-- Migration 019: Criar tabelas de Webhooks
-- UC: Webhook para integração com billing (upgrade automático)
-- Data: 2025-11-07

BEGIN;

-- Criar tabela de webhooks
CREATE TABLE IF NOT EXISTS tb_webhooks (
    id_webhook UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,

    -- Configurações
    nm_webhook VARCHAR(200) NOT NULL,
    ds_webhook TEXT,
    ds_url VARCHAR(500) NOT NULL,
    ds_events JSONB NOT NULL,
    ds_secret VARCHAR(200),

    -- Status
    nm_status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Retry config
    nr_max_retries INTEGER NOT NULL DEFAULT 3,
    nr_retry_delay_seconds INTEGER NOT NULL DEFAULT 60,

    -- Estatísticas
    nr_success_count INTEGER NOT NULL DEFAULT 0,
    nr_failure_count INTEGER NOT NULL DEFAULT 0,
    dt_last_success TIMESTAMP,
    dt_last_failure TIMESTAMP,

    -- Headers e metadados
    ds_headers JSONB,
    ds_metadata JSONB,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now()
);

-- Criar tabela de deliveries de webhooks
CREATE TABLE IF NOT EXISTS tb_webhook_deliveries (
    id_delivery UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_webhook UUID NOT NULL REFERENCES tb_webhooks(id_webhook) ON DELETE CASCADE,

    -- Evento
    nm_event_type VARCHAR(100) NOT NULL,
    ds_event_data JSONB NOT NULL,

    -- Delivery
    nm_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    nr_http_status INTEGER,
    ds_response_body TEXT,
    ds_error_message TEXT,

    -- Retry
    nr_attempt INTEGER NOT NULL DEFAULT 1,
    dt_next_retry TIMESTAMP,

    -- Timing
    nr_duration_ms INTEGER,

    -- Timestamps
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_enviado TIMESTAMP,
    dt_completado TIMESTAMP
);

-- Indexes para tb_webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON tb_webhooks(id_user);
CREATE INDEX IF NOT EXISTS idx_webhooks_empresa ON tb_webhooks(id_empresa);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON tb_webhooks(nm_status);
CREATE INDEX IF NOT EXISTS idx_webhooks_events_gin ON tb_webhooks USING gin(ds_events);

-- Indexes para tb_webhook_deliveries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON tb_webhook_deliveries(id_webhook);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON tb_webhook_deliveries(nm_status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON tb_webhook_deliveries(nm_event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON tb_webhook_deliveries(dt_next_retry) WHERE nm_status = 'retrying';
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON tb_webhook_deliveries(dt_criacao DESC);

-- Constraints
ALTER TABLE tb_webhooks ADD CONSTRAINT chk_webhooks_status
    CHECK (nm_status IN ('active', 'inactive', 'failed'));

ALTER TABLE tb_webhook_deliveries ADD CONSTRAINT chk_deliveries_status
    CHECK (nm_status IN ('pending', 'delivered', 'failed', 'retrying'));

-- Trigger para atualizar dt_atualizacao
CREATE OR REPLACE FUNCTION update_webhooks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhooks_timestamp
    BEFORE UPDATE ON tb_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_webhooks_timestamp();

COMMIT;
