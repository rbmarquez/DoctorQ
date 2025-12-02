-- Migration 019: Criar tabelas de pagamentos (Stripe e MercadoPago)
-- Data: 02/11/2025
-- Descrição: Tabelas para persistir pagamentos e histórico de transações

-- =====================================================
-- TABELA: tb_pagamentos
-- Descrição: Pagamentos processados via Stripe ou MercadoPago
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_pagamentos (
    -- Identificação
    id_pagamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_user UUID,

    -- Gateway de pagamento
    ds_gateway VARCHAR(50) NOT NULL, -- 'stripe' ou 'mercadopago'
    ds_tipo_pagamento VARCHAR(50) NOT NULL, -- 'checkout', 'payment_intent', 'pix', 'card', 'preference'

    -- Identificadores externos
    ds_external_id VARCHAR(255) NOT NULL, -- ID do Stripe/MercadoPago
    ds_session_id VARCHAR(255), -- Session ID (Stripe) ou Preference ID (MercadoPago)
    ds_payment_method VARCHAR(50), -- 'card', 'pix', 'boleto', etc

    -- Valores
    vl_amount DECIMAL(10, 2) NOT NULL, -- Valor em reais
    ds_currency VARCHAR(3) DEFAULT 'BRL', -- Moeda
    vl_fee DECIMAL(10, 2), -- Taxa da plataforma
    vl_net DECIMAL(10, 2), -- Valor líquido

    -- Status
    ds_status VARCHAR(50) NOT NULL, -- 'pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'
    ds_status_detail TEXT, -- Detalhes do status

    -- Informações do pagador
    ds_payer_email VARCHAR(255),
    ds_payer_name VARCHAR(255),
    ds_payer_cpf VARCHAR(14),
    nm_payer_phone VARCHAR(20),

    -- Dados adicionais
    ds_description TEXT,
    ds_metadata JSONB, -- Metadata customizada

    -- PIX específico (MercadoPago)
    ds_qr_code TEXT, -- QR Code PIX
    ds_qr_code_base64 TEXT, -- QR Code em base64
    ds_ticket_url TEXT, -- URL do ticket PIX

    -- URLs de callback
    ds_success_url TEXT,
    ds_cancel_url TEXT,
    ds_failure_url TEXT,
    ds_pending_url TEXT,

    -- Parcelamento
    qt_installments INTEGER DEFAULT 1,

    -- Reembolso
    fg_refunded BOOLEAN DEFAULT FALSE,
    dt_refunded TIMESTAMP,
    vl_refunded DECIMAL(10, 2),

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP,
    dt_expiracao TIMESTAMP, -- Data de expiração do pagamento
    fg_ativo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Foreign Keys
    CONSTRAINT fk_pagamento_empresa FOREIGN KEY (id_empresa) REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    CONSTRAINT fk_pagamento_user FOREIGN KEY (id_user) REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT chk_gateway CHECK (ds_gateway IN ('stripe', 'mercadopago')),
    CONSTRAINT chk_status CHECK (ds_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'expired')),
    CONSTRAINT chk_amount_positive CHECK (vl_amount > 0)
);

-- Indexes para performance
CREATE INDEX idx_pagamentos_empresa ON tb_pagamentos(id_empresa);
CREATE INDEX idx_pagamentos_user ON tb_pagamentos(id_user);
CREATE INDEX idx_pagamentos_external_id ON tb_pagamentos(ds_external_id);
CREATE INDEX idx_pagamentos_session_id ON tb_pagamentos(ds_session_id);
CREATE INDEX idx_pagamentos_status ON tb_pagamentos(ds_status);
CREATE INDEX idx_pagamentos_gateway ON tb_pagamentos(ds_gateway);
CREATE INDEX idx_pagamentos_dt_criacao ON tb_pagamentos(dt_criacao DESC);
CREATE INDEX idx_pagamentos_payer_email ON tb_pagamentos(ds_payer_email);

-- Comentários
COMMENT ON TABLE tb_pagamentos IS 'Pagamentos processados via Stripe e MercadoPago';
COMMENT ON COLUMN tb_pagamentos.ds_gateway IS 'Gateway de pagamento: stripe ou mercadopago';
COMMENT ON COLUMN tb_pagamentos.ds_tipo_pagamento IS 'Tipo: checkout, payment_intent, pix, card, preference';
COMMENT ON COLUMN tb_pagamentos.ds_external_id IS 'ID externo do gateway (payment_id, session_id, etc)';
COMMENT ON COLUMN tb_pagamentos.vl_amount IS 'Valor em reais (ou moeda especificada)';
COMMENT ON COLUMN tb_pagamentos.ds_metadata IS 'Metadata JSON para rastreamento';

-- =====================================================
-- TABELA: tb_transacoes_pagamento
-- Descrição: Histórico de eventos e transições de estado dos pagamentos
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_transacoes_pagamento (
    -- Identificação
    id_transacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pagamento UUID NOT NULL,

    -- Tipo de evento
    ds_evento_tipo VARCHAR(100) NOT NULL, -- 'payment.created', 'payment.succeeded', 'payment.failed', etc
    ds_evento_origem VARCHAR(50) NOT NULL, -- 'api', 'webhook', 'manual'

    -- Status
    ds_status_anterior VARCHAR(50),
    ds_status_novo VARCHAR(50) NOT NULL,

    -- Dados do evento
    ds_evento_data JSONB, -- Payload completo do evento
    ds_resposta_data JSONB, -- Resposta da API

    -- Informações adicionais
    ds_mensagem TEXT, -- Mensagem descritiva
    ds_codigo_erro VARCHAR(100), -- Código de erro (se houver)

    -- Request info (para debugging)
    ds_ip_address INET,
    ds_user_agent TEXT,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),

    -- Foreign Keys
    CONSTRAINT fk_transacao_pagamento FOREIGN KEY (id_pagamento) REFERENCES tb_pagamentos(id_pagamento) ON DELETE CASCADE
);

-- Indexes para performance
CREATE INDEX idx_transacoes_pagamento ON tb_transacoes_pagamento(id_pagamento);
CREATE INDEX idx_transacoes_evento_tipo ON tb_transacoes_pagamento(ds_evento_tipo);
CREATE INDEX idx_transacoes_dt_criacao ON tb_transacoes_pagamento(dt_criacao DESC);
CREATE INDEX idx_transacoes_status_novo ON tb_transacoes_pagamento(ds_status_novo);

-- Comentários
COMMENT ON TABLE tb_transacoes_pagamento IS 'Histórico de eventos e transições de estado dos pagamentos';
COMMENT ON COLUMN tb_transacoes_pagamento.ds_evento_tipo IS 'Tipo do evento: payment.created, payment.succeeded, payment.failed, etc';
COMMENT ON COLUMN tb_transacoes_pagamento.ds_evento_origem IS 'Origem do evento: api, webhook, manual';
COMMENT ON COLUMN tb_transacoes_pagamento.ds_evento_data IS 'Payload JSON completo do evento';

-- =====================================================
-- DADOS DE EXEMPLO (apenas para desenvolvimento)
-- =====================================================

-- Inserir pagamento de exemplo (comentado por padrão)
/*
INSERT INTO tb_pagamentos (
    id_empresa,
    ds_gateway,
    ds_tipo_pagamento,
    ds_external_id,
    vl_amount,
    ds_status,
    ds_payer_email,
    ds_description
) VALUES (
    '04a4e71e-aed4-491b-b3f3-73694f470250', -- id_empresa de exemplo
    'stripe',
    'checkout',
    'cs_test_123456',
    100.00,
    'pending',
    'cliente@exemplo.com',
    'Pagamento de teste'
);
*/

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE tablename IN ('tb_pagamentos', 'tb_transacoes_pagamento')
ORDER BY tablename;

-- Verificar colunas da tb_pagamentos
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tb_pagamentos'
ORDER BY ordinal_position;

-- Verificar indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('tb_pagamentos', 'tb_transacoes_pagamento')
ORDER BY tablename, indexname;

-- Fim da migration 019
