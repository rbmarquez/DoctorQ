-- Migration 006: Sistema de Billing e Monetização
-- Data: 21/10/2025
-- Descrição: Planos, assinaturas, métricas de uso e integração com Stripe
-- Autor: Claude Code Agent

-- =============================================================================
-- TABELA: tb_plans (Planos de Assinatura)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tb_plans (
    id_plan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_plan VARCHAR(100) NOT NULL UNIQUE,
    ds_plan VARCHAR(500),
    nm_tier VARCHAR(20) NOT NULL DEFAULT 'free',  -- free, starter, professional, enterprise
    vl_price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    vl_price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ds_features JSONB,  -- Ex: {"rag": true, "custom_agents": true, "api_access": true}
    ds_quotas JSONB,  -- Ex: {"max_agents": 10, "max_messages_per_month": 1000}
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',  -- S=Sim, N=Não
    st_visivel CHAR(1) NOT NULL DEFAULT 'S',  -- S=Visível, N=Oculto
    nr_trial_days INTEGER NOT NULL DEFAULT 0,  -- Dias de trial gratuito
    nm_stripe_price_id_monthly VARCHAR(100),  -- ID do Price mensal no Stripe
    nm_stripe_price_id_yearly VARCHAR(100),  -- ID do Price anual no Stripe
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP,

    CONSTRAINT chk_tier CHECK (nm_tier IN ('free', 'starter', 'professional', 'enterprise')),
    CONSTRAINT chk_status CHECK (st_ativo IN ('S', 'N')),
    CONSTRAINT chk_visibilidade CHECK (st_visivel IN ('S', 'N')),
    CONSTRAINT chk_prices CHECK (vl_price_monthly >= 0 AND vl_price_yearly >= 0),
    CONSTRAINT chk_trial_days CHECK (nr_trial_days >= 0 AND nr_trial_days <= 365)
);

-- Comentários
COMMENT ON TABLE tb_plans IS 'Planos de assinatura disponíveis para usuários';
COMMENT ON COLUMN tb_plans.nm_tier IS 'Tier do plano: free, starter, professional, enterprise';
COMMENT ON COLUMN tb_plans.ds_features IS 'Features incluídas no plano (JSON)';
COMMENT ON COLUMN tb_plans.ds_quotas IS 'Limites de uso (quotas) do plano (JSON)';
COMMENT ON COLUMN tb_plans.nr_trial_days IS 'Número de dias de trial gratuito';


-- =============================================================================
-- TABELA: tb_subscriptions (Assinaturas de Usuários)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tb_subscriptions (
    id_subscription UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_plan UUID REFERENCES tb_plans(id_plan) ON DELETE SET NULL,
    nm_status VARCHAR(20) NOT NULL DEFAULT 'trialing',  -- active, trialing, past_due, canceled, unpaid, paused
    nm_billing_interval VARCHAR(10) NOT NULL DEFAULT 'month',  -- month, year
    dt_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_trial_end TIMESTAMP,  -- Fim do período de trial
    dt_current_period_start TIMESTAMP,  -- Início do período de cobrança atual
    dt_current_period_end TIMESTAMP,  -- Fim do período de cobrança atual
    dt_canceled_at TIMESTAMP,  -- Data de cancelamento
    dt_ended_at TIMESTAMP,  -- Data de término efetivo
    nm_stripe_subscription_id VARCHAR(100) UNIQUE,  -- ID da subscription no Stripe
    nm_stripe_customer_id VARCHAR(100),  -- ID do customer no Stripe
    ds_metadata JSONB,  -- Metadados adicionais
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP,

    CONSTRAINT chk_status CHECK (nm_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'paused')),
    CONSTRAINT chk_billing_interval CHECK (nm_billing_interval IN ('month', 'year'))
);

-- Comentários
COMMENT ON TABLE tb_subscriptions IS 'Assinaturas ativas, trial e canceladas de usuários';
COMMENT ON COLUMN tb_subscriptions.nm_status IS 'Status da assinatura: active, trialing, past_due, canceled, unpaid, paused';
COMMENT ON COLUMN tb_subscriptions.nm_billing_interval IS 'Intervalo de cobrança: month ou year';
COMMENT ON COLUMN tb_subscriptions.dt_trial_end IS 'Data de término do período de trial';
COMMENT ON COLUMN tb_subscriptions.nm_stripe_subscription_id IS 'ID da subscription no Stripe (único)';


-- =============================================================================
-- TABELA: tb_usage_metrics (Métricas de Uso)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tb_usage_metrics (
    id_metric UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_subscription UUID NOT NULL REFERENCES tb_subscriptions(id_subscription) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    nm_metric_type VARCHAR(50) NOT NULL,  -- api_calls, tokens, messages, agents, document_stores, storage_gb, embeddings
    nr_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,  -- Valor da métrica
    dt_period_start TIMESTAMP NOT NULL,  -- Início do período de medição
    dt_period_end TIMESTAMP NOT NULL,  -- Fim do período de medição
    ds_metadata JSONB,  -- Ex: breakdown por agente, tipo de call, etc
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_metric_type CHECK (nm_metric_type IN (
        'api_calls', 'tokens', 'messages', 'agents',
        'document_stores', 'storage_gb', 'embeddings'
    )),
    CONSTRAINT chk_value CHECK (nr_value >= 0),
    CONSTRAINT chk_period CHECK (dt_period_start < dt_period_end)
);

-- Comentários
COMMENT ON TABLE tb_usage_metrics IS 'Métricas de uso de recursos por usuário/assinatura';
COMMENT ON COLUMN tb_usage_metrics.nm_metric_type IS 'Tipo de métrica: api_calls, tokens, messages, agents, etc';
COMMENT ON COLUMN tb_usage_metrics.nr_value IS 'Valor numérico da métrica (pode ser decimal para GB, etc)';
COMMENT ON COLUMN tb_usage_metrics.dt_period_start IS 'Início do período de medição';
COMMENT ON COLUMN tb_usage_metrics.dt_period_end IS 'Fim do período de medição';


-- =============================================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices para tb_plans
CREATE INDEX IF NOT EXISTS idx_plans_tier ON tb_plans(nm_tier);
CREATE INDEX IF NOT EXISTS idx_plans_ativo ON tb_plans(st_ativo);
CREATE INDEX IF NOT EXISTS idx_plans_visivel ON tb_plans(st_visivel);

-- Índices para tb_subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON tb_subscriptions(id_user);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON tb_subscriptions(id_plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON tb_subscriptions(nm_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON tb_subscriptions(nm_stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON tb_subscriptions(dt_current_period_end);

-- Índices para tb_usage_metrics
CREATE INDEX IF NOT EXISTS idx_usage_subscription ON tb_usage_metrics(id_subscription);
CREATE INDEX IF NOT EXISTS idx_usage_user ON tb_usage_metrics(id_user);
CREATE INDEX IF NOT EXISTS idx_usage_metric_type ON tb_usage_metrics(nm_metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_period ON tb_usage_metrics(dt_period_start, dt_period_end);

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_usage_user_period
    ON tb_usage_metrics(id_user, dt_period_start, dt_period_end);

CREATE INDEX IF NOT EXISTS idx_usage_sub_type
    ON tb_usage_metrics(id_subscription, nm_metric_type);


-- =============================================================================
-- SEED DATA: PLANOS PADRÃO
-- =============================================================================

-- Plano Free (Padrão para novos usuários)
INSERT INTO tb_plans (nm_plan, ds_plan, nm_tier, vl_price_monthly, vl_price_yearly, ds_features, ds_quotas, nr_trial_days)
VALUES (
    'Free',
    'Plano gratuito para experimentar a plataforma',
    'free',
    0.00,
    0.00,
    '{
        "max_agents": 1,
        "rag": false,
        "custom_tools": false,
        "api_access": false,
        "support": "community",
        "features": ["Chat básico", "1 agente", "Modelos gratuitos"]
    }'::jsonb,
    '{
        "max_agents": 1,
        "max_messages_per_month": 100,
        "max_tokens_per_month": 50000,
        "max_document_stores": 0,
        "max_storage_gb": 0.1
    }'::jsonb,
    0
) ON CONFLICT (nm_plan) DO NOTHING;

-- Plano Starter
INSERT INTO tb_plans (nm_plan, ds_plan, nm_tier, vl_price_monthly, vl_price_yearly, ds_features, ds_quotas, nr_trial_days)
VALUES (
    'Starter',
    'Ideal para freelancers e pequenos projetos',
    'starter',
    29.00,
    290.00,
    '{
        "max_agents": 5,
        "rag": true,
        "custom_tools": true,
        "api_access": true,
        "support": "email",
        "features": ["5 agentes", "RAG básico", "API", "Ferramentas customizadas", "Suporte por email"]
    }'::jsonb,
    '{
        "max_agents": 5,
        "max_messages_per_month": 1000,
        "max_tokens_per_month": 500000,
        "max_document_stores": 3,
        "max_storage_gb": 5
    }'::jsonb,
    14
) ON CONFLICT (nm_plan) DO NOTHING;

-- Plano Professional
INSERT INTO tb_plans (nm_plan, ds_plan, nm_tier, vl_price_monthly, vl_price_yearly, ds_features, ds_quotas, nr_trial_days)
VALUES (
    'Professional',
    'Para empresas que precisam de mais recursos',
    'professional',
    99.00,
    990.00,
    '{
        "max_agents": 20,
        "rag": true,
        "custom_tools": true,
        "api_access": true,
        "advanced_analytics": true,
        "support": "priority",
        "features": ["20 agentes", "RAG avançado", "API ilimitada", "Analytics avançados", "Suporte prioritário", "Whitelabel"]
    }'::jsonb,
    '{
        "max_agents": 20,
        "max_messages_per_month": 10000,
        "max_tokens_per_month": 5000000,
        "max_document_stores": 15,
        "max_storage_gb": 50
    }'::jsonb,
    14
) ON CONFLICT (nm_plan) DO NOTHING;

-- Plano Enterprise
INSERT INTO tb_plans (nm_plan, ds_plan, nm_tier, vl_price_monthly, vl_price_yearly, ds_features, ds_quotas, nr_trial_days)
VALUES (
    'Enterprise',
    'Solução completa para grandes empresas',
    'enterprise',
    499.00,
    4990.00,
    '{
        "max_agents": -1,
        "rag": true,
        "custom_tools": true,
        "api_access": true,
        "advanced_analytics": true,
        "dedicated_support": true,
        "sla": true,
        "custom_integration": true,
        "support": "dedicated",
        "features": ["Agentes ilimitados", "RAG enterprise", "API dedicada", "SLA 99.9%", "Suporte dedicado", "Integração customizada", "On-premise opcional"]
    }'::jsonb,
    '{
        "max_agents": -1,
        "max_messages_per_month": -1,
        "max_tokens_per_month": -1,
        "max_document_stores": -1,
        "max_storage_gb": -1
    }'::jsonb,
    30
) ON CONFLICT (nm_plan) DO NOTHING;


-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger para atualizar dt_atualizacao em tb_plans
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON tb_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_plans_updated_at();

-- Trigger para atualizar dt_atualizacao em tb_subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON tb_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();


-- =============================================================================
-- VIEWS ÚTEIS
-- =============================================================================

-- View: Resumo de assinaturas ativas
CREATE OR REPLACE VIEW vw_active_subscriptions AS
SELECT
    s.id_subscription,
    s.id_user,
    u.nm_email,
    u.nm_completo,
    p.nm_plan,
    p.nm_tier,
    s.nm_status,
    s.nm_billing_interval,
    s.dt_current_period_end,
    p.vl_price_monthly,
    p.vl_price_yearly,
    CASE
        WHEN s.nm_billing_interval = 'month' THEN p.vl_price_monthly
        WHEN s.nm_billing_interval = 'year' THEN p.vl_price_yearly
        ELSE 0
    END as vl_price_current
FROM tb_subscriptions s
INNER JOIN tb_users u ON s.id_user = u.id_user
LEFT JOIN tb_plans p ON s.id_plan = p.id_plan
WHERE s.nm_status IN ('active', 'trialing');

COMMENT ON VIEW vw_active_subscriptions IS 'View com resumo de todas as assinaturas ativas';

-- View: Uso agregado por usuário (período atual)
CREATE OR REPLACE VIEW vw_current_usage_by_user AS
SELECT
    um.id_user,
    u.nm_email,
    um.nm_metric_type,
    SUM(um.nr_value) as total_usage,
    MAX(um.dt_period_end) as last_updated
FROM tb_usage_metrics um
INNER JOIN tb_users u ON um.id_user = u.id_user
WHERE um.dt_period_end >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY um.id_user, u.nm_email, um.nm_metric_type;

COMMENT ON VIEW vw_current_usage_by_user IS 'Uso agregado por usuário nos últimos 30 dias';


-- =============================================================================
-- GRANTS (Ajuste conforme suas permissões)
-- =============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON tb_plans TO your_api_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tb_subscriptions TO your_api_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tb_usage_metrics TO your_api_user;
-- GRANT SELECT ON vw_active_subscriptions TO your_api_user;
-- GRANT SELECT ON vw_current_usage_by_user TO your_api_user;


-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 006 (Billing System) executada com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: tb_plans, tb_subscriptions, tb_usage_metrics';
    RAISE NOTICE '🌱 Seed data inserido: 4 planos (Free, Starter, Professional, Enterprise)';
    RAISE NOTICE '📈 Views criadas: vw_active_subscriptions, vw_current_usage_by_user';
END $$;
