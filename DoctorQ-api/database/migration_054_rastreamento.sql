-- =====================================================
-- Migration 054: Sistema de Rastreamento de Pedidos
-- UC054 - Rastrear Pedido
-- Data: 07/11/2025
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: tb_rastreamento_eventos
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_rastreamento_eventos (
    id_evento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID NOT NULL REFERENCES tb_pedidos(id_pedido) ON DELETE CASCADE,

    -- Identificação da transportadora
    ds_transportadora VARCHAR(100) NOT NULL,  -- correios, jadlog, total_express, outro
    ds_codigo_rastreio VARCHAR(100) NOT NULL,

    -- Dados do evento
    ds_status VARCHAR(100) NOT NULL,  -- Status original da transportadora
    ds_status_mapeado VARCHAR(50),    -- Status mapeado para nosso sistema
    ds_descricao TEXT NOT NULL,

    -- Localização do evento
    ds_cidade VARCHAR(100),
    ds_estado VARCHAR(2),
    ds_pais VARCHAR(3) DEFAULT 'BRA',
    ds_local_completo VARCHAR(255),

    -- Timestamps
    dt_evento TIMESTAMP NOT NULL,  -- Data/hora do evento na transportadora
    dt_captura TIMESTAMP NOT NULL DEFAULT now(),  -- Data/hora que capturamos o evento

    -- Metadados (JSON completo da API para debug/auditoria)
    ds_dados_brutos JSONB,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),

    -- Constraint: evitar duplicatas exatas
    CONSTRAINT uk_rastreamento_evento UNIQUE (id_pedido, ds_codigo_rastreio, dt_evento, ds_status)
);

COMMENT ON TABLE tb_rastreamento_eventos IS 'Eventos de rastreamento capturados das APIs de transportadoras';
COMMENT ON COLUMN tb_rastreamento_eventos.ds_transportadora IS 'correios | jadlog | total_express | outro';
COMMENT ON COLUMN tb_rastreamento_eventos.ds_status IS 'Status original retornado pela transportadora';
COMMENT ON COLUMN tb_rastreamento_eventos.ds_status_mapeado IS 'Status normalizado: em_transito | saiu_para_entrega | entregue | problema | etc';
COMMENT ON COLUMN tb_rastreamento_eventos.dt_evento IS 'Data/hora real do evento (timestamp da transportadora)';
COMMENT ON COLUMN tb_rastreamento_eventos.dt_captura IS 'Data/hora que capturamos o evento da API';
COMMENT ON COLUMN tb_rastreamento_eventos.ds_dados_brutos IS 'JSON completo da resposta da API (para auditoria)';

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rastreamento_pedido ON tb_rastreamento_eventos(id_pedido);
CREATE INDEX IF NOT EXISTS idx_rastreamento_codigo ON tb_rastreamento_eventos(ds_codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_rastreamento_transportadora ON tb_rastreamento_eventos(ds_transportadora);
CREATE INDEX IF NOT EXISTS idx_rastreamento_status ON tb_rastreamento_eventos(ds_status_mapeado);
CREATE INDEX IF NOT EXISTS idx_rastreamento_dt_evento ON tb_rastreamento_eventos(dt_evento DESC);
CREATE INDEX IF NOT EXISTS idx_rastreamento_dt_captura ON tb_rastreamento_eventos(dt_captura DESC);

-- Índice composto para consultas de timeline
CREATE INDEX IF NOT EXISTS idx_rastreamento_pedido_dt ON tb_rastreamento_eventos(id_pedido, dt_evento DESC);

-- Índice composto para buscar por código
CREATE INDEX IF NOT EXISTS idx_rastreamento_codigo_dt ON tb_rastreamento_eventos(ds_codigo_rastreio, dt_evento DESC);

-- Índice GIN para busca em JSON (dados brutos)
CREATE INDEX IF NOT EXISTS idx_rastreamento_dados_brutos_gin ON tb_rastreamento_eventos USING GIN (ds_dados_brutos);

-- =====================================================
-- FUNÇÕES DE NEGÓCIO
-- =====================================================

-- Função para obter último evento de um pedido
CREATE OR REPLACE FUNCTION obter_ultimo_evento_rastreamento(p_id_pedido UUID)
RETURNS TABLE (
    ds_status VARCHAR,
    ds_descricao TEXT,
    dt_evento TIMESTAMP,
    ds_local VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.ds_status_mapeado,
        e.ds_descricao,
        e.dt_evento,
        e.ds_local_completo
    FROM tb_rastreamento_eventos e
    WHERE e.id_pedido = p_id_pedido
    ORDER BY e.dt_evento DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_ultimo_evento_rastreamento IS 'Retorna o evento mais recente de um pedido';

-- Função para verificar se pedido está atrasado
CREATE OR REPLACE FUNCTION verificar_pedido_atrasado(p_id_pedido UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_dt_estimada DATE;
    v_status VARCHAR;
BEGIN
    SELECT dt_entrega_estimada, ds_status
    INTO v_dt_estimada, v_status
    FROM tb_pedidos
    WHERE id_pedido = p_id_pedido;

    IF v_dt_estimada IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_status = 'entregue' THEN
        RETURN FALSE;
    END IF;

    RETURN v_dt_estimada < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_pedido_atrasado IS 'Verifica se um pedido está atrasado (data estimada passou e não foi entregue)';

-- Função para gerar resumo de rastreamento
CREATE OR REPLACE FUNCTION gerar_resumo_rastreamento(p_id_pedido UUID)
RETURNS JSONB AS $$
DECLARE
    v_resumo JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_eventos', COUNT(*),
        'transportadora', MAX(ds_transportadora),
        'ultimo_status', (
            SELECT ds_status_mapeado
            FROM tb_rastreamento_eventos
            WHERE id_pedido = p_id_pedido
            ORDER BY dt_evento DESC
            LIMIT 1
        ),
        'ultimo_evento', (
            SELECT ds_descricao
            FROM tb_rastreamento_eventos
            WHERE id_pedido = p_id_pedido
            ORDER BY dt_evento DESC
            LIMIT 1
        ),
        'dt_ultimo_evento', (
            SELECT dt_evento
            FROM tb_rastreamento_eventos
            WHERE id_pedido = p_id_pedido
            ORDER BY dt_evento DESC
            LIMIT 1
        ),
        'primeira_atualizacao', MIN(dt_captura),
        'ultima_atualizacao', MAX(dt_captura)
    )
    INTO v_resumo
    FROM tb_rastreamento_eventos
    WHERE id_pedido = p_id_pedido;

    RETURN v_resumo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_resumo_rastreamento IS 'Gera JSON com resumo completo de rastreamento de um pedido';

-- =====================================================
-- VIEW: Pedidos com Informações de Rastreamento
-- =====================================================

CREATE OR REPLACE VIEW vw_pedidos_rastreamento AS
SELECT
    p.id_pedido,
    p.nr_pedido,
    p.id_user,
    p.ds_status,
    p.ds_codigo_rastreio,
    p.dt_entrega_estimada,
    p.dt_pedido,
    p.dt_envio,
    p.dt_entrega,
    -- Último evento
    last_event.ds_transportadora,
    last_event.ds_status_mapeado AS ds_ultimo_status_rastreamento,
    last_event.ds_descricao AS ds_ultimo_evento,
    last_event.dt_evento AS dt_ultimo_evento,
    last_event.ds_local_completo AS ds_ultimo_local,
    -- Contadores
    stats.total_eventos,
    -- Flags
    CASE
        WHEN p.dt_entrega_estimada IS NOT NULL
         AND p.dt_entrega_estimada < CURRENT_DATE
         AND p.ds_status != 'entregue'
        THEN TRUE
        ELSE FALSE
    END AS fg_atrasado,
    CASE
        WHEN p.ds_status IN ('problema_entrega', 'cancelado', 'devolvido')
        THEN TRUE
        ELSE FALSE
    END AS fg_problema
FROM tb_pedidos p
LEFT JOIN LATERAL (
    SELECT
        ds_transportadora,
        ds_status_mapeado,
        ds_descricao,
        dt_evento,
        ds_local_completo
    FROM tb_rastreamento_eventos
    WHERE id_pedido = p.id_pedido
    ORDER BY dt_evento DESC
    LIMIT 1
) last_event ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total_eventos
    FROM tb_rastreamento_eventos
    WHERE id_pedido = p.id_pedido
) stats ON TRUE
WHERE p.ds_codigo_rastreio IS NOT NULL;

COMMENT ON VIEW vw_pedidos_rastreamento IS 'View consolidada: pedidos com informações de rastreamento e último evento';

-- =====================================================
-- VIEW: Estatísticas de Rastreamento por Transportadora
-- =====================================================

CREATE OR REPLACE VIEW vw_rastreamento_estatisticas_transportadora AS
SELECT
    ds_transportadora,
    COUNT(DISTINCT id_pedido) AS total_pedidos,
    COUNT(*) AS total_eventos,
    COUNT(DISTINCT ds_codigo_rastreio) AS total_codigos_rastreio,
    MIN(dt_captura) AS primeira_captura,
    MAX(dt_captura) AS ultima_captura,
    AVG(EXTRACT(EPOCH FROM (dt_captura - dt_evento)) / 3600) AS delay_medio_captura_horas
FROM tb_rastreamento_eventos
GROUP BY ds_transportadora;

COMMENT ON VIEW vw_rastreamento_estatisticas_transportadora IS 'Estatísticas de rastreamento por transportadora';

-- =====================================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE tb_rastreamento_eventos ENABLE ROW LEVEL SECURITY;

-- Policy: usuários veem apenas eventos dos próprios pedidos
DROP POLICY IF EXISTS rastreamento_eventos_user_isolation ON tb_rastreamento_eventos;
CREATE POLICY rastreamento_eventos_user_isolation ON tb_rastreamento_eventos
    USING (
        id_pedido IN (
            SELECT id_pedido FROM tb_pedidos
            WHERE id_user = current_setting('app.current_user_id')::UUID
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para notificar mudanças de status via rastreamento
CREATE OR REPLACE FUNCTION notificar_mudanca_rastreamento()
RETURNS TRIGGER AS $$
BEGIN
    -- TODO: Integrar com sistema de notificações
    -- Quando novo evento importante é capturado, notificar cliente
    IF NEW.ds_status_mapeado IN ('entregue', 'saiu_para_entrega', 'problema') THEN
        -- INSERT INTO tb_notificacoes (...)
        RAISE NOTICE 'Notificação: Novo status de rastreamento - %', NEW.ds_status_mapeado;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notificar_mudanca_rastreamento ON tb_rastreamento_eventos;
CREATE TRIGGER trg_notificar_mudanca_rastreamento
    AFTER INSERT ON tb_rastreamento_eventos
    FOR EACH ROW
    EXECUTE FUNCTION notificar_mudanca_rastreamento();

-- =====================================================
-- DADOS DE EXEMPLO (DESENVOLVIMENTO)
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
    v_pedido_id UUID;
BEGIN
    SELECT COUNT(*) INTO v_count FROM tb_rastreamento_eventos;

    IF v_count = 0 THEN
        -- Buscar um pedido de exemplo
        SELECT id_pedido INTO v_pedido_id FROM tb_pedidos WHERE ds_codigo_rastreio IS NOT NULL LIMIT 1;

        IF v_pedido_id IS NOT NULL THEN
            -- Inserir eventos de exemplo
            INSERT INTO tb_rastreamento_eventos (
                id_pedido, ds_transportadora, ds_codigo_rastreio,
                ds_status, ds_status_mapeado, ds_descricao,
                ds_cidade, ds_estado, ds_local_completo,
                dt_evento, dt_captura
            ) VALUES
            (
                v_pedido_id, 'correios', (SELECT ds_codigo_rastreio FROM tb_pedidos WHERE id_pedido = v_pedido_id),
                'PO', 'em_transito', 'Objeto postado',
                'São Paulo', 'SP', 'São Paulo/SP',
                now() - INTERVAL '3 days', now() - INTERVAL '3 days'
            ),
            (
                v_pedido_id, 'correios', (SELECT ds_codigo_rastreio FROM tb_pedidos WHERE id_pedido = v_pedido_id),
                'RO', 'em_transito', 'Objeto em trânsito - por favor aguarde',
                'Campinas', 'SP', 'Campinas/SP',
                now() - INTERVAL '2 days', now() - INTERVAL '2 days'
            ),
            (
                v_pedido_id, 'correios', (SELECT ds_codigo_rastreio FROM tb_pedidos WHERE id_pedido = v_pedido_id),
                'DO', 'saiu_para_entrega', 'Objeto saiu para entrega',
                'Campinas', 'SP', 'Campinas/SP',
                now() - INTERVAL '1 day', now() - INTERVAL '1 day'
            );

            RAISE NOTICE 'Eventos de rastreamento de exemplo inseridos';
        END IF;
    END IF;
END $$;

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
BEGIN
    -- Verificar se tabela foi criada
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_rastreamento_eventos') THEN
        RAISE EXCEPTION 'Tabela tb_rastreamento_eventos não foi criada';
    END IF;

    -- Verificar se views foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_pedidos_rastreamento') THEN
        RAISE EXCEPTION 'View vw_pedidos_rastreamento não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_rastreamento_estatisticas_transportadora') THEN
        RAISE EXCEPTION 'View vw_rastreamento_estatisticas_transportadora não foi criada';
    END IF;

    RAISE NOTICE 'Migration 054 aplicada com sucesso!';
    RAISE NOTICE '- 1 tabela criada: tb_rastreamento_eventos';
    RAISE NOTICE '- 9 índices criados';
    RAISE NOTICE '- 3 funções criadas';
    RAISE NOTICE '- 2 views criadas';
    RAISE NOTICE '- 1 trigger criado';
    RAISE NOTICE '- Row-Level Security habilitado';
END $$;
