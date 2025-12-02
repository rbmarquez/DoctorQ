-- ============================================================
-- Migration 027: Lembretes de Agendamento
-- UC027 - Enviar Lembretes de Agendamento
-- Data: 2025-11-07
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABELA DE LEMBRETES
-- ============================================================

CREATE TABLE IF NOT EXISTS tb_lembretes (
    id_lembrete UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_agendamento UUID NOT NULL REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,
    id_paciente UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Tipo de lembrete
    tp_lembrete VARCHAR(20) NOT NULL, -- 24h | 2h | custom

    -- Canais de envio (flags)
    fg_email BOOLEAN NOT NULL DEFAULT FALSE,
    fg_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    fg_sms BOOLEAN NOT NULL DEFAULT FALSE,
    fg_push BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps de envio por canal
    dt_email TIMESTAMP,
    dt_whatsapp TIMESTAMP,
    dt_sms TIMESTAMP,
    dt_push TIMESTAMP,

    -- Status e controle
    st_lembrete VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente | enviado | erro | cancelado
    ds_erro VARCHAR(500),
    nr_tentativas INTEGER NOT NULL DEFAULT 0,

    -- Agendamento
    dt_agendado TIMESTAMP NOT NULL, -- Data/hora agendada para envio
    dt_enviado TIMESTAMP, -- Data/hora real do envio

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_tp_lembrete CHECK (
        tp_lembrete IN ('24h', '2h', 'custom')
    ),
    CONSTRAINT chk_st_lembrete CHECK (
        st_lembrete IN ('pendente', 'enviado', 'erro', 'cancelado')
    ),
    CONSTRAINT chk_pelo_menos_um_canal CHECK (
        fg_email = TRUE OR fg_whatsapp = TRUE OR fg_sms = TRUE OR fg_push = TRUE
    )
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

-- Índices simples
CREATE INDEX idx_lembretes_empresa ON tb_lembretes(id_empresa);
CREATE INDEX idx_lembretes_agendamento ON tb_lembretes(id_agendamento);
CREATE INDEX idx_lembretes_paciente ON tb_lembretes(id_paciente);
CREATE INDEX idx_lembretes_tipo ON tb_lembretes(tp_lembrete);
CREATE INDEX idx_lembretes_status ON tb_lembretes(st_lembrete);
CREATE INDEX idx_lembretes_dt_agendado ON tb_lembretes(dt_agendado);
CREATE INDEX idx_lembretes_dt_criacao ON tb_lembretes(dt_criacao DESC);

-- Índices compostos para queries comuns
CREATE INDEX idx_lembretes_empresa_status ON tb_lembretes(id_empresa, st_lembrete);
CREATE INDEX idx_lembretes_status_agendado ON tb_lembretes(st_lembrete, dt_agendado)
    WHERE st_lembrete = 'pendente'; -- Índice parcial para buscar pendentes

-- Índice para processar lembretes pendentes (cron job)
CREATE INDEX idx_lembretes_pendentes_processar ON tb_lembretes(dt_agendado, st_lembrete, nr_tentativas)
    WHERE st_lembrete = 'pendente' AND nr_tentativas < 3;

-- ============================================================
-- 3. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE tb_lembretes IS 'Lembretes automáticos de agendamentos enviados por múltiplos canais';
COMMENT ON COLUMN tb_lembretes.id_lembrete IS 'ID único do lembrete';
COMMENT ON COLUMN tb_lembretes.id_empresa IS 'Empresa do lembrete (multi-tenant)';
COMMENT ON COLUMN tb_lembretes.id_agendamento IS 'Agendamento relacionado';
COMMENT ON COLUMN tb_lembretes.id_paciente IS 'Paciente que receberá o lembrete';
COMMENT ON COLUMN tb_lembretes.tp_lembrete IS 'Tipo: 24h (1 dia antes), 2h (2 horas antes), custom (personalizado)';
COMMENT ON COLUMN tb_lembretes.fg_email IS 'Enviar por email?';
COMMENT ON COLUMN tb_lembretes.fg_whatsapp IS 'Enviar por WhatsApp?';
COMMENT ON COLUMN tb_lembretes.fg_sms IS 'Enviar por SMS?';
COMMENT ON COLUMN tb_lembretes.fg_push IS 'Enviar por push notification?';
COMMENT ON COLUMN tb_lembretes.dt_email IS 'Data/hora de envio do email';
COMMENT ON COLUMN tb_lembretes.dt_whatsapp IS 'Data/hora de envio do WhatsApp';
COMMENT ON COLUMN tb_lembretes.dt_sms IS 'Data/hora de envio do SMS';
COMMENT ON COLUMN tb_lembretes.dt_push IS 'Data/hora de envio da push notification';
COMMENT ON COLUMN tb_lembretes.st_lembrete IS 'Status: pendente (aguardando), enviado (sucesso), erro (falha), cancelado (agendamento cancelado)';
COMMENT ON COLUMN tb_lembretes.ds_erro IS 'Mensagem de erro se houver falha no envio';
COMMENT ON COLUMN tb_lembretes.nr_tentativas IS 'Número de tentativas de envio (máx 3)';
COMMENT ON COLUMN tb_lembretes.dt_agendado IS 'Data/hora agendada para envio do lembrete';
COMMENT ON COLUMN tb_lembretes.dt_enviado IS 'Data/hora real do envio (quando foi processado)';

-- ============================================================
-- 4. TRIGGERS DE AUDITORIA
-- ============================================================

-- Trigger para atualizar dt_atualizacao
CREATE OR REPLACE FUNCTION update_lembretes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lembretes_timestamp
    BEFORE UPDATE ON tb_lembretes
    FOR EACH ROW
    EXECUTE FUNCTION update_lembretes_timestamp();

-- ============================================================
-- 5. FUNÇÃO AUXILIAR: Criar Lembretes para Agendamento
-- ============================================================

CREATE OR REPLACE FUNCTION criar_lembretes_agendamento(
    p_id_empresa UUID,
    p_id_agendamento UUID,
    p_id_paciente UUID,
    p_dt_agendamento TIMESTAMP
) RETURNS INTEGER AS $$
DECLARE
    v_dt_lembrete_24h TIMESTAMP;
    v_dt_lembrete_2h TIMESTAMP;
    v_count INTEGER := 0;
BEGIN
    -- Calcular datas dos lembretes
    v_dt_lembrete_24h := p_dt_agendamento - INTERVAL '24 hours';
    v_dt_lembrete_2h := p_dt_agendamento - INTERVAL '2 hours';

    -- Lembrete 24h antes (email + whatsapp + push)
    IF v_dt_lembrete_24h > now() THEN
        INSERT INTO tb_lembretes (
            id_empresa,
            id_agendamento,
            id_paciente,
            tp_lembrete,
            fg_email,
            fg_whatsapp,
            fg_push,
            dt_agendado,
            st_lembrete,
            nr_tentativas
        ) VALUES (
            p_id_empresa,
            p_id_agendamento,
            p_id_paciente,
            '24h',
            TRUE,  -- email
            TRUE,  -- whatsapp
            TRUE,  -- push
            v_dt_lembrete_24h,
            'pendente',
            0
        );
        v_count := v_count + 1;
    END IF;

    -- Lembrete 2h antes (sms + whatsapp)
    IF v_dt_lembrete_2h > now() THEN
        INSERT INTO tb_lembretes (
            id_empresa,
            id_agendamento,
            id_paciente,
            tp_lembrete,
            fg_sms,
            fg_whatsapp,
            dt_agendado,
            st_lembrete,
            nr_tentativas
        ) VALUES (
            p_id_empresa,
            p_id_agendamento,
            p_id_paciente,
            '2h',
            TRUE,  -- sms
            TRUE,  -- whatsapp
            v_dt_lembrete_2h,
            'pendente',
            0
        );
        v_count := v_count + 1;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION criar_lembretes_agendamento IS 'Cria lembretes automáticos (24h e 2h) para um agendamento';

-- ============================================================
-- 6. FUNÇÃO AUXILIAR: Cancelar Lembretes de Agendamento
-- ============================================================

CREATE OR REPLACE FUNCTION cancelar_lembretes_agendamento(
    p_id_agendamento UUID
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE tb_lembretes
    SET
        st_lembrete = 'cancelado',
        dt_atualizacao = now()
    WHERE
        id_agendamento = p_id_agendamento
        AND st_lembrete = 'pendente';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancelar_lembretes_agendamento IS 'Cancela todos os lembretes pendentes de um agendamento';

-- ============================================================
-- 7. VIEW: Estatísticas de Lembretes
-- ============================================================

CREATE OR REPLACE VIEW vw_lembretes_stats AS
SELECT
    id_empresa,
    tp_lembrete,
    st_lembrete,
    COUNT(*) as qt_lembretes,
    COUNT(*) FILTER (WHERE fg_email = TRUE) as qt_email,
    COUNT(*) FILTER (WHERE fg_whatsapp = TRUE) as qt_whatsapp,
    COUNT(*) FILTER (WHERE fg_sms = TRUE) as qt_sms,
    COUNT(*) FILTER (WHERE fg_push = TRUE) as qt_push,
    COUNT(*) FILTER (WHERE dt_email IS NOT NULL) as qt_email_enviado,
    COUNT(*) FILTER (WHERE dt_whatsapp IS NOT NULL) as qt_whatsapp_enviado,
    COUNT(*) FILTER (WHERE dt_sms IS NOT NULL) as qt_sms_enviado,
    COUNT(*) FILTER (WHERE dt_push IS NOT NULL) as qt_push_enviado,
    AVG(nr_tentativas) as media_tentativas,
    MIN(dt_criacao) as dt_primeiro,
    MAX(dt_criacao) as dt_ultimo
FROM tb_lembretes
GROUP BY id_empresa, tp_lembrete, st_lembrete;

COMMENT ON VIEW vw_lembretes_stats IS 'Estatísticas de lembretes por empresa, tipo e status';

-- ============================================================
-- 8. ESTATÍSTICAS E PERFORMANCE
-- ============================================================

-- Atualizar estatísticas da nova tabela
ANALYZE tb_lembretes;

-- ============================================================
-- 9. PERMISSÕES (ajustar conforme ambiente)
-- ============================================================

-- GRANT SELECT, INSERT, UPDATE ON tb_lembretes TO doctorq_api;
-- GRANT EXECUTE ON FUNCTION criar_lembretes_agendamento TO doctorq_api;
-- GRANT EXECUTE ON FUNCTION cancelar_lembretes_agendamento TO doctorq_api;
-- GRANT SELECT ON vw_lembretes_stats TO doctorq_api;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================

-- Verificação final
SELECT
    'tb_lembretes' as tabela,
    count(*) as total_registros,
    count(*) FILTER (WHERE st_lembrete = 'pendente') as pendentes,
    count(*) FILTER (WHERE st_lembrete = 'enviado') as enviados,
    count(*) FILTER (WHERE st_lembrete = 'erro') as erros,
    count(*) FILTER (WHERE st_lembrete = 'cancelado') as cancelados
FROM tb_lembretes;
