-- =====================================================================
-- Migration 009: Sistema de Onboarding Estruturado
-- =====================================================================
-- Descrição: Cria tabelas para onboarding de usuários com flows
--           configuráveis e tracking de progresso
-- Data: 2025-01-21
-- Autor: InovaIA Platform
-- =====================================================================

-- =====================================================================
-- 1. TABELA DE FLOWS DE ONBOARDING
-- =====================================================================

CREATE TABLE IF NOT EXISTS tb_onboarding_flows (
    id_flow UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Nome e descrição
    nm_flow VARCHAR(100) NOT NULL UNIQUE,
    ds_flow TEXT,

    -- Target (para quem é esse flow)
    nm_target_type VARCHAR(50) NOT NULL DEFAULT 'all_users',
    -- Valores: 'all_users', 'free_users', 'paid_users', 'enterprise_users', 'custom'

    -- Ordem de exibição
    nr_order INTEGER NOT NULL DEFAULT 0,

    -- Ativo/Inativo
    bl_ativo BOOLEAN NOT NULL DEFAULT true,

    -- Steps do flow (JSON array)
    ds_steps JSONB NOT NULL,
    -- Formato:
    -- [
    --   {
    --     "step_type": "account_setup",
    --     "title": "Complete seu perfil",
    --     "description": "Adicione suas informações",
    --     "order": 1,
    --     "required": true,
    --     "help_url": "https://docs.../setup",
    --     "estimated_minutes": 5,
    --     "icon": "user",
    --     "action_url": "/profile"
    --   }
    -- ]

    -- Configurações do flow
    ds_config JSONB,
    -- Formato:
    -- {
    --   "allow_skip": true,
    --   "show_progress_bar": true,
    --   "auto_advance": false,
    --   "celebration_on_complete": true
    -- }

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_flow_name CHECK (nm_flow <> ''),
    CONSTRAINT chk_steps_not_empty CHECK (jsonb_array_length(ds_steps) > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_onboarding_flows_active
    ON tb_onboarding_flows(bl_ativo) WHERE bl_ativo = true;

CREATE INDEX IF NOT EXISTS idx_onboarding_flows_target
    ON tb_onboarding_flows(nm_target_type);

CREATE INDEX IF NOT EXISTS idx_onboarding_flows_order
    ON tb_onboarding_flows(nr_order);

-- Comentários
COMMENT ON TABLE tb_onboarding_flows IS 'Flows de onboarding configuráveis com steps customizados';
COMMENT ON COLUMN tb_onboarding_flows.nm_target_type IS 'Tipo de usuário alvo (all_users, free_users, etc.)';
COMMENT ON COLUMN tb_onboarding_flows.ds_steps IS 'Array JSON de steps do flow com configurações';
COMMENT ON COLUMN tb_onboarding_flows.ds_config IS 'Configurações do flow (skip, progress bar, etc.)';


-- =====================================================================
-- 2. TABELA DE PROGRESSO DO USUÁRIO
-- =====================================================================

CREATE TABLE IF NOT EXISTS tb_user_onboarding_progress (
    id_progress UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_flow UUID NOT NULL REFERENCES tb_onboarding_flows(id_flow) ON DELETE CASCADE,

    -- Status geral
    nm_status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    -- Valores: 'not_started', 'in_progress', 'completed', 'skipped'

    -- Progresso (0-100)
    nr_progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (nr_progress_percentage >= 0 AND nr_progress_percentage <= 100),

    -- Step atual
    nm_current_step VARCHAR(100),

    -- Steps completados (array de step types)
    ds_completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Steps pulados
    ds_skipped_steps JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Dados customizados de progresso
    ds_progress_data JSONB,

    -- Timestamps
    dt_inicio TIMESTAMP,
    dt_conclusao TIMESTAMP,
    dt_ultima_atividade TIMESTAMP,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: um usuário tem apenas um progresso por flow
    CONSTRAINT uq_user_flow UNIQUE (id_user, id_flow)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_progress_user
    ON tb_user_onboarding_progress(id_user);

CREATE INDEX IF NOT EXISTS idx_user_progress_flow
    ON tb_user_onboarding_progress(id_flow);

CREATE INDEX IF NOT EXISTS idx_user_progress_status
    ON tb_user_onboarding_progress(nm_status);

CREATE INDEX IF NOT EXISTS idx_user_progress_percentage
    ON tb_user_onboarding_progress(nr_progress_percentage);

-- Índice para usuários com onboarding incompleto
CREATE INDEX IF NOT EXISTS idx_user_progress_incomplete
    ON tb_user_onboarding_progress(id_user, nm_status)
    WHERE nm_status IN ('not_started', 'in_progress');

-- Comentários
COMMENT ON TABLE tb_user_onboarding_progress IS 'Progresso de onboarding dos usuários';
COMMENT ON COLUMN tb_user_onboarding_progress.nr_progress_percentage IS 'Percentual de conclusão (0-100)';
COMMENT ON COLUMN tb_user_onboarding_progress.ds_completed_steps IS 'Array de step_types completados';
COMMENT ON COLUMN tb_user_onboarding_progress.ds_skipped_steps IS 'Array de step_types pulados';


-- =====================================================================
-- 3. TABELA DE EVENTOS DE ONBOARDING
-- =====================================================================

CREATE TABLE IF NOT EXISTS tb_onboarding_events (
    id_event UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_progress UUID NOT NULL REFERENCES tb_user_onboarding_progress(id_progress) ON DELETE CASCADE,

    -- Tipo de evento
    nm_event_type VARCHAR(100) NOT NULL,
    -- Valores: 'flow_started', 'flow_completed', 'step_started', 'step_completed', 'step_skipped'

    -- Step relacionado (opcional)
    nm_step_type VARCHAR(100),

    -- Dados do evento
    ds_event_data JSONB,

    -- Timestamp
    dt_event TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraint
    CONSTRAINT chk_event_type CHECK (nm_event_type <> '')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user
    ON tb_onboarding_events(id_user);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_progress
    ON tb_onboarding_events(id_progress);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_type
    ON tb_onboarding_events(nm_event_type);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_date
    ON tb_onboarding_events(dt_event DESC);

-- Índice composto para queries de eventos por usuário e período
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_date
    ON tb_onboarding_events(id_user, dt_event DESC);

-- Comentários
COMMENT ON TABLE tb_onboarding_events IS 'Eventos de onboarding para tracking e analytics';
COMMENT ON COLUMN tb_onboarding_events.nm_event_type IS 'Tipo de evento (flow_started, step_completed, etc.)';
COMMENT ON COLUMN tb_onboarding_events.nm_step_type IS 'Step relacionado ao evento (opcional)';


-- =====================================================================
-- 4. TRIGGERS AUTOMÁTICOS
-- =====================================================================

-- Trigger: Atualizar dt_atualizacao em flows
CREATE OR REPLACE FUNCTION atualizar_flow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_flow_timestamp ON tb_onboarding_flows;
CREATE TRIGGER trg_update_flow_timestamp
    BEFORE UPDATE ON tb_onboarding_flows
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_flow_timestamp();


-- Trigger: Atualizar dt_atualizacao em progress
CREATE OR REPLACE FUNCTION atualizar_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_progress_timestamp ON tb_user_onboarding_progress;
CREATE TRIGGER trg_update_progress_timestamp
    BEFORE UPDATE ON tb_user_onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_progress_timestamp();


-- =====================================================================
-- 5. VIEWS ÚTEIS
-- =====================================================================

-- View: Resumo de onboarding por usuário
CREATE OR REPLACE VIEW vw_onboarding_summary AS
SELECT
    u.id_user,
    u.nm_email,
    u.nm_completo,
    COUNT(DISTINCT p.id_progress) as nr_flows_iniciados,
    COUNT(DISTINCT CASE WHEN p.nm_status = 'completed' THEN p.id_progress END) as nr_flows_completados,
    COALESCE(AVG(p.nr_progress_percentage), 0) as media_progresso,
    MAX(p.dt_ultima_atividade) as dt_ultima_atividade_onboarding
FROM tb_users u
LEFT JOIN tb_user_onboarding_progress p ON p.id_user = u.id_user
GROUP BY u.id_user, u.nm_email, u.nm_completo;

COMMENT ON VIEW vw_onboarding_summary IS 'Resumo de onboarding por usuário';


-- View: Estatísticas de flows
CREATE OR REPLACE VIEW vw_onboarding_flow_stats AS
SELECT
    f.id_flow,
    f.nm_flow,
    f.nm_target_type,
    f.bl_ativo,
    COUNT(DISTINCT p.id_user) as nr_usuarios_iniciados,
    COUNT(DISTINCT CASE WHEN p.nm_status = 'completed' THEN p.id_user END) as nr_usuarios_completaram,
    CASE
        WHEN COUNT(DISTINCT p.id_user) > 0 THEN
            ROUND((COUNT(DISTINCT CASE WHEN p.nm_status = 'completed' THEN p.id_user END)::NUMERIC /
                  COUNT(DISTINCT p.id_user)::NUMERIC * 100), 2)
        ELSE 0
    END as taxa_conclusao_percentual,
    COALESCE(AVG(p.nr_progress_percentage), 0) as media_progresso
FROM tb_onboarding_flows f
LEFT JOIN tb_user_onboarding_progress p ON p.id_flow = f.id_flow
GROUP BY f.id_flow, f.nm_flow, f.nm_target_type, f.bl_ativo;

COMMENT ON VIEW vw_onboarding_flow_stats IS 'Estatísticas de cada flow de onboarding';


-- View: Usuários com onboarding incompleto
CREATE OR REPLACE VIEW vw_onboarding_incomplete AS
SELECT
    u.id_user,
    u.nm_email,
    u.nm_completo,
    f.nm_flow,
    p.nm_status,
    p.nr_progress_percentage,
    p.nm_current_step,
    p.dt_ultima_atividade,
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - p.dt_inicio) as dias_desde_inicio
FROM tb_user_onboarding_progress p
INNER JOIN tb_users u ON u.id_user = p.id_user
INNER JOIN tb_onboarding_flows f ON f.id_flow = p.id_flow
WHERE p.nm_status IN ('not_started', 'in_progress')
ORDER BY p.dt_ultima_atividade DESC NULLS LAST;

COMMENT ON VIEW vw_onboarding_incomplete IS 'Usuários com onboarding incompleto para campanhas de re-engajamento';


-- =====================================================================
-- 6. FUNÇÕES ÚTEIS
-- =====================================================================

-- Função: Buscar próximo step para um usuário
CREATE OR REPLACE FUNCTION buscar_proximo_step(
    p_user_id UUID,
    p_flow_id UUID
)
RETURNS TABLE (
    step_type VARCHAR,
    title TEXT,
    description TEXT,
    order_num INTEGER,
    required BOOLEAN,
    estimated_minutes INTEGER
) AS $$
DECLARE
    v_progress RECORD;
    v_flow RECORD;
    v_step JSONB;
BEGIN
    -- Buscar progresso do usuário
    SELECT * INTO v_progress
    FROM tb_user_onboarding_progress
    WHERE id_user = p_user_id AND id_flow = p_flow_id;

    -- Se não existe progresso, retornar primeiro step
    IF v_progress IS NULL THEN
        SELECT * INTO v_flow FROM tb_onboarding_flows WHERE id_flow = p_flow_id;

        IF v_flow IS NOT NULL THEN
            -- Retornar primeiro step ordenado
            FOR v_step IN
                SELECT * FROM jsonb_array_elements(v_flow.ds_steps)
                ORDER BY (value->>'order')::INTEGER ASC
                LIMIT 1
            LOOP
                RETURN QUERY
                SELECT
                    v_step->>'step_type',
                    v_step->>'title',
                    v_step->>'description',
                    (v_step->>'order')::INTEGER,
                    (v_step->>'required')::BOOLEAN,
                    (v_step->>'estimated_minutes')::INTEGER;
            END LOOP;
        END IF;

        RETURN;
    END IF;

    -- Buscar flow
    SELECT * INTO v_flow FROM tb_onboarding_flows WHERE id_flow = p_flow_id;

    -- Encontrar primeiro step não completado
    FOR v_step IN
        SELECT * FROM jsonb_array_elements(v_flow.ds_steps)
        WHERE (value->>'step_type') NOT IN (
            SELECT jsonb_array_elements_text(COALESCE(v_progress.ds_completed_steps, '[]'::jsonb))
            UNION
            SELECT jsonb_array_elements_text(COALESCE(v_progress.ds_skipped_steps, '[]'::jsonb))
        )
        ORDER BY (value->>'order')::INTEGER ASC
        LIMIT 1
    LOOP
        RETURN QUERY
        SELECT
            v_step->>'step_type',
            v_step->>'title',
            v_step->>'description',
            (v_step->>'order')::INTEGER,
            (v_step->>'required')::BOOLEAN,
            (v_step->>'estimated_minutes')::INTEGER;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_proximo_step IS 'Retorna o próximo step de onboarding para um usuário';


-- Função: Calcular taxa de conclusão de um flow
CREATE OR REPLACE FUNCTION calcular_taxa_conclusao_flow(
    p_flow_id UUID
)
RETURNS TABLE (
    total_usuarios INTEGER,
    usuarios_completaram INTEGER,
    taxa_conclusao NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total,
        COUNT(CASE WHEN nm_status = 'completed' THEN 1 END)::INTEGER as completaram,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN nm_status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100), 2)
            ELSE 0::NUMERIC
        END as taxa
    FROM tb_user_onboarding_progress
    WHERE id_flow = p_flow_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_taxa_conclusao_flow IS 'Calcula taxa de conclusão de um flow';


-- =====================================================================
-- 7. DADOS INICIAIS (FLOWS DE EXEMPLO)
-- =====================================================================

-- Flow 1: Onboarding Básico
INSERT INTO tb_onboarding_flows (nm_flow, ds_flow, nm_target_type, nr_order, ds_steps, ds_config)
VALUES (
    'Onboarding Básico',
    'Flow de onboarding inicial para novos usuários da plataforma',
    'all_users',
    1,
    '[
        {
            "step_type": "account_setup",
            "title": "Complete seu perfil",
            "description": "Adicione suas informações básicas e foto de perfil",
            "order": 1,
            "required": true,
            "help_url": "/docs/profile-setup",
            "estimated_minutes": 5,
            "icon": "user",
            "action_url": "/profile"
        },
        {
            "step_type": "first_agent",
            "title": "Crie seu primeiro agente",
            "description": "Experimente o poder da IA criando seu primeiro agente",
            "order": 2,
            "required": true,
            "help_url": "/docs/create-agent",
            "estimated_minutes": 10,
            "icon": "robot",
            "action_url": "/agents/new"
        },
        {
            "step_type": "first_conversation",
            "title": "Inicie uma conversa",
            "description": "Teste seu agente iniciando uma conversa",
            "order": 3,
            "required": true,
            "help_url": "/docs/start-conversation",
            "estimated_minutes": 5,
            "icon": "message-circle",
            "action_url": "/conversations"
        },
        {
            "step_type": "install_template",
            "title": "Explore templates",
            "description": "Instale um template do marketplace para começar rapidamente",
            "order": 4,
            "required": false,
            "help_url": "/docs/templates",
            "estimated_minutes": 3,
            "icon": "download",
            "action_url": "/marketplace"
        }
    ]'::jsonb,
    '{
        "allow_skip": true,
        "show_progress_bar": true,
        "auto_advance": false,
        "celebration_on_complete": true
    }'::jsonb
) ON CONFLICT (nm_flow) DO NOTHING;


-- Flow 2: Onboarding Empresarial
INSERT INTO tb_onboarding_flows (nm_flow, ds_flow, nm_target_type, nr_order, ds_steps, ds_config)
VALUES (
    'Onboarding Empresarial',
    'Flow de onboarding para usuários de planos empresariais',
    'enterprise_users',
    2,
    '[
        {
            "step_type": "account_setup",
            "title": "Configure sua empresa",
            "description": "Adicione informações da sua organização",
            "order": 1,
            "required": true,
            "estimated_minutes": 10,
            "icon": "building"
        },
        {
            "step_type": "invite_team",
            "title": "Convide sua equipe",
            "description": "Adicione membros do time para colaborar",
            "order": 2,
            "required": true,
            "estimated_minutes": 5,
            "icon": "users"
        },
        {
            "step_type": "configure_tools",
            "title": "Configure ferramentas",
            "description": "Integre com suas ferramentas existentes",
            "order": 3,
            "required": false,
            "estimated_minutes": 15,
            "icon": "settings"
        },
        {
            "step_type": "setup_billing",
            "title": "Configure faturamento",
            "description": "Adicione método de pagamento",
            "order": 4,
            "required": false,
            "estimated_minutes": 5,
            "icon": "credit-card"
        },
        {
            "step_type": "first_agent",
            "title": "Crie agente corporativo",
            "description": "Crie um agente para sua equipe",
            "order": 5,
            "required": true,
            "estimated_minutes": 15,
            "icon": "robot"
        }
    ]'::jsonb,
    '{
        "allow_skip": false,
        "show_progress_bar": true,
        "auto_advance": false,
        "celebration_on_complete": true
    }'::jsonb
) ON CONFLICT (nm_flow) DO NOTHING;


-- =====================================================================
-- 8. VERIFICAÇÃO
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Verificando tabelas criadas...';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_onboarding_flows') THEN
        RAISE NOTICE '✓ Tabela tb_onboarding_flows criada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_user_onboarding_progress') THEN
        RAISE NOTICE '✓ Tabela tb_user_onboarding_progress criada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_onboarding_events') THEN
        RAISE NOTICE '✓ Tabela tb_onboarding_events criada';
    END IF;
END $$;

-- Exibir flows criados
SELECT
    nm_flow,
    nm_target_type,
    jsonb_array_length(ds_steps) as nr_steps,
    bl_ativo
FROM tb_onboarding_flows
ORDER BY nr_order;


-- =====================================================================
-- FIM DA MIGRATION 009
-- =====================================================================

-- Observações:
-- 1. Execute esta migration após as migrations de analytics
-- 2. Os flows podem ser customizados via API (/onboarding/flows)
-- 3. Novos flows podem ser criados para diferentes segmentos
-- 4. O progresso é rastreado automaticamente via API
-- 5. Eventos são registrados para analytics
-- 6. Views facilitam análises de conversão
