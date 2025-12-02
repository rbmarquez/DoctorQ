-- =====================================================
-- Migration 115: Sistema de Exportação de Relatórios
-- UC115 - Exportar Relatórios
-- Data: 07/11/2025
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: tb_export_jobs
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_export_jobs (
    id_export UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_user_solicitante UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE RESTRICT,

    -- Tipo e formato
    tp_relatorio VARCHAR(50) NOT NULL,
    ds_nome_relatorio VARCHAR(255) NOT NULL,
    tp_formato VARCHAR(20) NOT NULL CHECK (tp_formato IN ('excel', 'csv', 'pdf', 'json')),

    -- Filtros (JSON)
    ds_filtros JSONB,

    -- Status
    st_export VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (st_export IN ('pendente', 'processando', 'concluido', 'erro')),
    ds_mensagem_erro TEXT,

    -- Resultado
    ds_arquivo_path TEXT,
    ds_arquivo_url TEXT,
    nr_total_registros INTEGER DEFAULT 0,
    nr_tamanho_bytes INTEGER DEFAULT 0,

    -- Timestamps
    dt_solicitacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_inicio_processamento TIMESTAMP,
    dt_fim_processamento TIMESTAMP,
    dt_expiracao TIMESTAMP,

    -- Agendamento
    fg_agendado BOOLEAN NOT NULL DEFAULT false,
    id_agendamento UUID,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE tb_export_jobs IS 'Jobs de exportação de relatórios';

-- =====================================================
-- TABELA: tb_export_agendamentos
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_export_agendamentos (
    id_agendamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_user_criador UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE RESTRICT,

    -- Identificação
    nm_agendamento VARCHAR(255) NOT NULL,
    ds_descricao TEXT,

    -- Relatório
    tp_relatorio VARCHAR(50) NOT NULL,
    tp_formato VARCHAR(20) NOT NULL,
    ds_filtros JSONB,

    -- Frequência
    tp_frequencia VARCHAR(20) NOT NULL CHECK (tp_frequencia IN ('diario', 'semanal', 'mensal', 'trimestral')),
    nr_hora_execucao INTEGER DEFAULT 8 CHECK (nr_hora_execucao >= 0 AND nr_hora_execucao <= 23),
    nr_dia_execucao INTEGER CHECK (nr_dia_execucao >= 1 AND nr_dia_execucao <= 31),

    -- Email
    fg_enviar_email BOOLEAN NOT NULL DEFAULT true,
    ds_emails_destinatarios JSONB,

    -- Última execução
    dt_ultima_execucao TIMESTAMP,
    dt_proxima_execucao TIMESTAMP,

    -- Status
    fg_ativo BOOLEAN NOT NULL DEFAULT true,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE tb_export_agendamentos IS 'Agendamentos recorrentes de exportação';

-- Adicionar FK após criar tb_export_agendamentos
ALTER TABLE tb_export_jobs
ADD CONSTRAINT fk_export_jobs_agendamento
FOREIGN KEY (id_agendamento)
REFERENCES tb_export_agendamentos(id_agendamento)
ON DELETE SET NULL;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_export_jobs_empresa ON tb_export_jobs(id_empresa);
CREATE INDEX IF NOT EXISTS idx_export_jobs_solicitante ON tb_export_jobs(id_user_solicitante);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON tb_export_jobs(st_export);
CREATE INDEX IF NOT EXISTS idx_export_jobs_dt_solicitacao ON tb_export_jobs(dt_solicitacao DESC);
CREATE INDEX IF NOT EXISTS idx_export_jobs_dt_expiracao ON tb_export_jobs(dt_expiracao) WHERE dt_expiracao IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_export_agendamentos_empresa ON tb_export_agendamentos(id_empresa);
CREATE INDEX IF NOT EXISTS idx_export_agendamentos_ativo ON tb_export_agendamentos(fg_ativo);
CREATE INDEX IF NOT EXISTS idx_export_agendamentos_proxima ON tb_export_agendamentos(dt_proxima_execucao) WHERE fg_ativo = true;

-- =====================================================
-- FUNÇÕES
-- =====================================================

CREATE OR REPLACE FUNCTION limpar_exports_expirados()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM tb_export_jobs
    WHERE dt_expiracao < now()
      AND st_export = 'concluido';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limpar_exports_expirados IS 'Remove jobs de exportação expirados';

CREATE OR REPLACE FUNCTION buscar_agendamentos_prontos()
RETURNS TABLE (
    id_agendamento UUID,
    nm_agendamento VARCHAR,
    tp_relatorio VARCHAR,
    dt_proxima_execucao TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id_agendamento,
        a.nm_agendamento,
        a.tp_relatorio,
        a.dt_proxima_execucao
    FROM tb_export_agendamentos a
    WHERE a.fg_ativo = true
      AND a.dt_proxima_execucao <= now()
    ORDER BY a.dt_proxima_execucao;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_agendamentos_prontos IS 'Busca agendamentos prontos para processar';

-- =====================================================
-- VIEW: Painel de Exportações
-- =====================================================

CREATE OR REPLACE VIEW vw_export_painel AS
SELECT
    j.id_export,
    j.id_empresa,
    j.tp_relatorio,
    j.ds_nome_relatorio,
    j.tp_formato,
    j.st_export,
    j.nr_total_registros,
    j.nr_tamanho_bytes,
    ROUND(j.nr_tamanho_bytes::NUMERIC / (1024 * 1024), 2) AS tamanho_mb,
    j.dt_solicitacao,
    j.dt_fim_processamento,
    CASE
        WHEN j.dt_inicio_processamento IS NOT NULL AND j.dt_fim_processamento IS NOT NULL
        THEN EXTRACT(EPOCH FROM (j.dt_fim_processamento - j.dt_inicio_processamento))::INTEGER
        ELSE NULL
    END AS duracao_segundos,
    u.nm_nome AS solicitante_nome,
    j.fg_agendado
FROM tb_export_jobs j
LEFT JOIN tb_users u ON j.id_user_solicitante = u.id_user;

COMMENT ON VIEW vw_export_painel IS 'Painel consolidado de exportações';

-- =====================================================
-- ROW-LEVEL SECURITY
-- =====================================================

ALTER TABLE tb_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_export_agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS export_jobs_empresa_isolation ON tb_export_jobs;
CREATE POLICY export_jobs_empresa_isolation ON tb_export_jobs
    USING (id_empresa = current_setting('app.current_empresa_id', true)::UUID);

DROP POLICY IF EXISTS export_agendamentos_empresa_isolation ON tb_export_agendamentos;
CREATE POLICY export_agendamentos_empresa_isolation ON tb_export_agendamentos
    USING (id_empresa = current_setting('app.current_empresa_id', true)::UUID);

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_export_jobs') THEN
        RAISE EXCEPTION 'Tabela tb_export_jobs não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_export_agendamentos') THEN
        RAISE EXCEPTION 'Tabela tb_export_agendamentos não foi criada';
    END IF;

    RAISE NOTICE 'Migration 115 aplicada com sucesso!';
    RAISE NOTICE '- 2 tabelas criadas';
    RAISE NOTICE '- 8 índices criados';
    RAISE NOTICE '- 2 funções criadas';
    RAISE NOTICE '- 1 view criada';
END $$;
