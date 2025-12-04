-- =====================================================================
-- Migration 008: Sistema de Analytics e Métricas de Negócio
-- =====================================================================
-- Descrição: Cria tabelas para rastreamento de eventos e snapshots
--           de métricas de negócio
-- Data: 2025-01-21
-- Autor: InovaIA Platform
-- =====================================================================

-- =====================================================================
-- 1. TABELA DE EVENTOS DE ANALYTICS
-- =====================================================================

CREATE TABLE IF NOT EXISTS tb_analytics_events (
    id_event UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,

    -- Tipo de evento
    nm_event_type VARCHAR(100) NOT NULL,
    -- Tipos suportados:
    -- 'user_login', 'user_signup', 'user_logout',
    -- 'conversation_created', 'conversation_deleted',
    -- 'message_sent', 'message_received',
    -- 'agent_created', 'agent_updated', 'agent_deleted',
    -- 'subscription_created', 'subscription_canceled', 'subscription_upgraded',
    -- 'template_installed', 'template_reviewed',
    -- 'api_call', 'error_occurred', 'feature_used'

    -- Dados do evento (JSON flexível)
    ds_event_data JSONB,

    -- Metadados adicionais
    ds_metadata JSONB,

    -- Timestamp
    dt_event TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Índices para performance
    CONSTRAINT chk_event_type CHECK (nm_event_type <> '')
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_analytics_events_user
    ON tb_analytics_events(id_user);

CREATE INDEX IF NOT EXISTS idx_analytics_events_empresa
    ON tb_analytics_events(id_empresa);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type
    ON tb_analytics_events(nm_event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_date
    ON tb_analytics_events(dt_event DESC);

-- Índice composto para queries de eventos por usuário e período
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_date
    ON tb_analytics_events(id_user, dt_event DESC);

-- Índice para queries por tipo e período
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date
    ON tb_analytics_events(nm_event_type, dt_event DESC);

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_analytics_events_data
    ON tb_analytics_events USING GIN (ds_event_data);

-- Comentários
COMMENT ON TABLE tb_analytics_events IS 'Rastreamento de eventos de analytics e auditoria';
COMMENT ON COLUMN tb_analytics_events.nm_event_type IS 'Tipo de evento (login, signup, api_call, etc.)';
COMMENT ON COLUMN tb_analytics_events.ds_event_data IS 'Dados específicos do evento em formato JSON';
COMMENT ON COLUMN tb_analytics_events.ds_metadata IS 'Metadados adicionais (IP, user agent, source, etc.)';


-- =====================================================================
-- 2. TABELA DE SNAPSHOTS DE MÉTRICAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS tb_analytics_snapshots (
    id_snapshot UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Data do snapshot (diário)
    dt_snapshot DATE NOT NULL,

    -- Tipo de métrica
    nm_metric_type VARCHAR(100) NOT NULL,
    -- Tipos suportados:
    -- 'daily_active_users', 'monthly_active_users',
    -- 'total_users', 'new_users',
    -- 'mrr', 'arr', 'arpu', 'ltv',
    -- 'total_conversations', 'active_conversations',
    -- 'total_messages', 'avg_messages_per_conversation',
    -- 'total_api_calls', 'total_tokens', 'total_storage_gb',
    -- 'total_templates', 'total_installations',
    -- 'churn_rate', 'retention_rate', 'engagement_rate'

    -- Valor da métrica
    nr_value NUMERIC(20, 4) NOT NULL DEFAULT 0.0000,

    -- Metadados opcionais
    ds_metadata JSONB,

    -- Timestamp de criação
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: um snapshot por métrica por dia
    CONSTRAINT uq_snapshot_date_metric UNIQUE (dt_snapshot, nm_metric_type),
    CONSTRAINT chk_metric_type CHECK (nm_metric_type <> '')
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date
    ON tb_analytics_snapshots(dt_snapshot DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_metric
    ON tb_analytics_snapshots(nm_metric_type);

-- Índice composto para queries de métricas por período
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_metric_date
    ON tb_analytics_snapshots(nm_metric_type, dt_snapshot DESC);

-- Comentários
COMMENT ON TABLE tb_analytics_snapshots IS 'Snapshots diários de métricas de negócio para análise histórica';
COMMENT ON COLUMN tb_analytics_snapshots.dt_snapshot IS 'Data do snapshot (geralmente fim do dia)';
COMMENT ON COLUMN tb_analytics_snapshots.nm_metric_type IS 'Tipo de métrica capturada';
COMMENT ON COLUMN tb_analytics_snapshots.nr_value IS 'Valor da métrica no momento do snapshot';


-- =====================================================================
-- 3. VIEWS PARA FACILITAR ANÁLISES
-- =====================================================================

-- View: Eventos agrupados por dia e tipo
CREATE OR REPLACE VIEW vw_analytics_events_daily AS
SELECT
    DATE(dt_event) as dt_dia,
    nm_event_type,
    COUNT(*) as nr_eventos,
    COUNT(DISTINCT id_user) as nr_usuarios_distintos,
    COUNT(DISTINCT id_empresa) as nr_empresas_distintas
FROM tb_analytics_events
GROUP BY DATE(dt_event), nm_event_type
ORDER BY dt_dia DESC, nr_eventos DESC;

COMMENT ON VIEW vw_analytics_events_daily IS 'Eventos agrupados por dia e tipo para análises rápidas';


-- View: Métricas do mês atual
CREATE OR REPLACE VIEW vw_analytics_current_month AS
SELECT
    nm_metric_type,
    MAX(nr_value) as valor_atual,
    MIN(nr_value) as valor_minimo,
    MAX(nr_value) as valor_maximo,
    AVG(nr_value) as valor_medio,
    COUNT(*) as nr_snapshots
FROM tb_analytics_snapshots
WHERE dt_snapshot >= DATE_TRUNC('month', CURRENT_DATE)
  AND dt_snapshot <= CURRENT_DATE
GROUP BY nm_metric_type;

COMMENT ON VIEW vw_analytics_current_month IS 'Resumo de métricas do mês atual';


-- View: Top 10 eventos mais comuns (últimos 30 dias)
CREATE OR REPLACE VIEW vw_analytics_top_events AS
SELECT
    nm_event_type,
    COUNT(*) as nr_eventos,
    COUNT(DISTINCT id_user) as nr_usuarios,
    COUNT(DISTINCT DATE(dt_event)) as nr_dias,
    MIN(dt_event) as dt_primeiro_evento,
    MAX(dt_event) as dt_ultimo_evento
FROM tb_analytics_events
WHERE dt_event >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY nm_event_type
ORDER BY nr_eventos DESC
LIMIT 10;

COMMENT ON VIEW vw_analytics_top_events IS 'Top 10 eventos mais comuns nos últimos 30 dias';


-- =====================================================================
-- 4. FUNÇÕES ÚTEIS
-- =====================================================================

-- Função: Buscar eventos de um usuário por período
CREATE OR REPLACE FUNCTION buscar_eventos_usuario(
    p_user_id UUID,
    p_start_date TIMESTAMP DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id_event UUID,
    nm_event_type VARCHAR,
    dt_event TIMESTAMP,
    ds_event_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id_event,
        e.nm_event_type,
        e.dt_event,
        e.ds_event_data
    FROM tb_analytics_events e
    WHERE e.id_user = p_user_id
      AND e.dt_event >= p_start_date
      AND e.dt_event <= p_end_date
    ORDER BY e.dt_event DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_eventos_usuario IS 'Busca eventos de um usuário específico por período';


-- Função: Calcular crescimento de métrica
CREATE OR REPLACE FUNCTION calcular_crescimento_metrica(
    p_metric_type VARCHAR,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    dt_inicio DATE,
    dt_fim DATE,
    valor_inicial NUMERIC,
    valor_final NUMERIC,
    crescimento_absoluto NUMERIC,
    crescimento_percentual NUMERIC
) AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_valor_inicial NUMERIC;
    v_valor_final NUMERIC;
BEGIN
    v_data_fim := CURRENT_DATE;
    v_data_inicio := CURRENT_DATE - p_days;

    -- Buscar valor inicial
    SELECT nr_value INTO v_valor_inicial
    FROM tb_analytics_snapshots
    WHERE nm_metric_type = p_metric_type
      AND dt_snapshot >= v_data_inicio
    ORDER BY dt_snapshot ASC
    LIMIT 1;

    -- Buscar valor final
    SELECT nr_value INTO v_valor_final
    FROM tb_analytics_snapshots
    WHERE nm_metric_type = p_metric_type
      AND dt_snapshot <= v_data_fim
    ORDER BY dt_snapshot DESC
    LIMIT 1;

    -- Calcular crescimento
    RETURN QUERY
    SELECT
        v_data_inicio,
        v_data_fim,
        COALESCE(v_valor_inicial, 0::NUMERIC),
        COALESCE(v_valor_final, 0::NUMERIC),
        COALESCE(v_valor_final - v_valor_inicial, 0::NUMERIC) as crescimento_abs,
        CASE
            WHEN COALESCE(v_valor_inicial, 0) = 0 THEN 0::NUMERIC
            ELSE ((v_valor_final - v_valor_inicial) / v_valor_inicial * 100)
        END as crescimento_pct;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_crescimento_metrica IS 'Calcula crescimento absoluto e percentual de uma métrica em um período';


-- Função: Obter métricas comparadas (mês atual vs mês anterior)
CREATE OR REPLACE FUNCTION comparar_metricas_mensal()
RETURNS TABLE (
    nm_metric_type VARCHAR,
    valor_mes_atual NUMERIC,
    valor_mes_anterior NUMERIC,
    diferenca NUMERIC,
    crescimento_percentual NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH mes_atual AS (
        SELECT
            s.nm_metric_type,
            AVG(s.nr_value) as valor
        FROM tb_analytics_snapshots s
        WHERE s.dt_snapshot >= DATE_TRUNC('month', CURRENT_DATE)
          AND s.dt_snapshot <= CURRENT_DATE
        GROUP BY s.nm_metric_type
    ),
    mes_anterior AS (
        SELECT
            s.nm_metric_type,
            AVG(s.nr_value) as valor
        FROM tb_analytics_snapshots s
        WHERE s.dt_snapshot >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND s.dt_snapshot < DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY s.nm_metric_type
    )
    SELECT
        COALESCE(ma.nm_metric_type, mant.nm_metric_type) as metric,
        COALESCE(ma.valor, 0::NUMERIC) as val_atual,
        COALESCE(mant.valor, 0::NUMERIC) as val_anterior,
        COALESCE(ma.valor, 0::NUMERIC) - COALESCE(mant.valor, 0::NUMERIC) as diff,
        CASE
            WHEN COALESCE(mant.valor, 0) = 0 THEN 0::NUMERIC
            ELSE ((ma.valor - mant.valor) / mant.valor * 100)
        END as growth_pct
    FROM mes_atual ma
    FULL OUTER JOIN mes_anterior mant ON ma.nm_metric_type = mant.nm_metric_type
    ORDER BY metric;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION comparar_metricas_mensal IS 'Compara métricas do mês atual com o mês anterior';


-- =====================================================================
-- 5. TRIGGERS AUTOMÁTICOS
-- =====================================================================

-- Trigger: Registrar evento de login automaticamente (exemplo)
-- Este é um exemplo de como triggers podem ser usados para rastrear eventos
-- automaticamente. Pode ser customizado conforme necessidade.

CREATE OR REPLACE FUNCTION trigger_registrar_evento_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar evento de login quando dt_ultimo_login é atualizado
    IF NEW.dt_ultimo_login IS DISTINCT FROM OLD.dt_ultimo_login THEN
        INSERT INTO tb_analytics_events (
            id_user,
            nm_event_type,
            ds_event_data,
            ds_metadata
        ) VALUES (
            NEW.id_user,
            'user_login',
            jsonb_build_object(
                'email', NEW.nm_email,
                'nome', NEW.nm_completo
            ),
            jsonb_build_object(
                'total_logins', NEW.nr_total_logins,
                'ultimo_login', NEW.dt_ultimo_login
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela de usuários
DROP TRIGGER IF EXISTS trg_analytics_user_login ON tb_users;
CREATE TRIGGER trg_analytics_user_login
    AFTER UPDATE ON tb_users
    FOR EACH ROW
    WHEN (NEW.dt_ultimo_login IS DISTINCT FROM OLD.dt_ultimo_login)
    EXECUTE FUNCTION trigger_registrar_evento_login();

COMMENT ON FUNCTION trigger_registrar_evento_login IS 'Registra evento de login automaticamente quando usuário faz login';


-- =====================================================================
-- 6. DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DESENVOLVIMENTO)
-- =====================================================================

-- Inserir alguns eventos de exemplo
INSERT INTO tb_analytics_events (nm_event_type, ds_event_data, ds_metadata)
VALUES
    ('user_signup', '{"source": "web", "plan": "free"}'::jsonb, '{"ip": "192.168.1.1"}'::jsonb),
    ('conversation_created', '{"agent_type": "chatbot"}'::jsonb, '{"platform": "web"}'::jsonb),
    ('api_call', '{"endpoint": "/predictions", "status": 200}'::jsonb, '{"duration_ms": 450}'::jsonb),
    ('template_installed', '{"template_id": "template-123", "template_name": "Sales Assistant"}'::jsonb, '{"customizations": true}'::jsonb),
    ('feature_used', '{"feature": "rag_search", "success": true}'::jsonb, '{"query_length": 150}'::jsonb)
ON CONFLICT DO NOTHING;


-- Inserir snapshots de exemplo para últimos 7 dias
DO $$
DECLARE
    i INTEGER;
    v_date DATE;
BEGIN
    FOR i IN 0..6 LOOP
        v_date := CURRENT_DATE - i;

        -- DAU
        INSERT INTO tb_analytics_snapshots (dt_snapshot, nm_metric_type, nr_value)
        VALUES (v_date, 'daily_active_users', 100 + (i * 10))
        ON CONFLICT (dt_snapshot, nm_metric_type) DO NOTHING;

        -- MRR
        INSERT INTO tb_analytics_snapshots (dt_snapshot, nm_metric_type, nr_value)
        VALUES (v_date, 'mrr', 5000.00 + (i * 100))
        ON CONFLICT (dt_snapshot, nm_metric_type) DO NOTHING;

        -- Total Conversations
        INSERT INTO tb_analytics_snapshots (dt_snapshot, nm_metric_type, nr_value)
        VALUES (v_date, 'total_conversations', 500 + (i * 20))
        ON CONFLICT (dt_snapshot, nm_metric_type) DO NOTHING;

        -- Total Messages
        INSERT INTO tb_analytics_snapshots (dt_snapshot, nm_metric_type, nr_value)
        VALUES (v_date, 'total_messages', 5000 + (i * 200))
        ON CONFLICT (dt_snapshot, nm_metric_type) DO NOTHING;
    END LOOP;
END $$;


-- =====================================================================
-- 7. VERIFICAÇÃO
-- =====================================================================

-- Verificar tabelas criadas
DO $$
BEGIN
    RAISE NOTICE 'Verificando tabelas criadas...';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_analytics_events') THEN
        RAISE NOTICE '✓ Tabela tb_analytics_events criada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_analytics_snapshots') THEN
        RAISE NOTICE '✓ Tabela tb_analytics_snapshots criada';
    END IF;
END $$;

-- Verificar views criadas
DO $$
BEGIN
    RAISE NOTICE 'Verificando views criadas...';

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_analytics_events_daily') THEN
        RAISE NOTICE '✓ View vw_analytics_events_daily criada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_analytics_current_month') THEN
        RAISE NOTICE '✓ View vw_analytics_current_month criada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_analytics_top_events') THEN
        RAISE NOTICE '✓ View vw_analytics_top_events criada';
    END IF;
END $$;

-- Exibir estatísticas
SELECT
    'tb_analytics_events' as tabela,
    COUNT(*) as nr_registros
FROM tb_analytics_events
UNION ALL
SELECT
    'tb_analytics_snapshots' as tabela,
    COUNT(*) as nr_registros
FROM tb_analytics_snapshots;


-- =====================================================================
-- FIM DA MIGRATION 008
-- =====================================================================

-- Observações:
-- 1. Execute esta migration após as migrations de billing e templates
-- 2. Os eventos são inseridos automaticamente via API ou triggers
-- 3. Os snapshots devem ser criados via cronjob diário (POST /analytics/snapshots/daily)
-- 4. As views facilitam análises rápidas sem precisar de queries complexas
-- 5. As funções ajudam a calcular crescimento e comparações
-- 6. Os índices otimizam queries de período e tipo de evento/métrica
