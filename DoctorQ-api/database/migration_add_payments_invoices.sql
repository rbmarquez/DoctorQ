-- =====================================================
-- Migration: Adicionar tabelas de Payments e Invoices
-- Data: 2025-10-22
-- Descrição: Tabelas para histórico de pagamentos e faturas
-- =====================================================

-- Extensão para UUID (caso não exista)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: tb_payments
-- Descrição: Histórico de pagamentos dos usuários
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_payments (
    id_payment UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    id_subscription UUID NOT NULL,
    id_user UUID NOT NULL,
    id_invoice UUID,  -- Pode ser NULL se pagamento não está associado a invoice ainda

    -- Dados do pagamento
    nm_stripe_payment_id VARCHAR(255) UNIQUE,  -- ID do pagamento no Stripe
    nm_stripe_payment_intent_id VARCHAR(255),  -- ID do payment intent no Stripe
    nm_payment_method VARCHAR(50) NOT NULL,  -- card, bank_transfer, pix, etc.
    nm_status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, processing, succeeded, failed, canceled, refunded

    -- Valores
    vl_amount DECIMAL(10,2) NOT NULL,  -- Valor total
    vl_amount_refunded DECIMAL(10,2) DEFAULT 0.00,  -- Valor reembolsado
    nm_currency VARCHAR(3) NOT NULL DEFAULT 'BRL',  -- BRL, USD, EUR

    -- Metadados
    ds_metadata JSONB,  -- Metadados adicionais (last 4 digits, brand, etc.)
    ds_failure_message TEXT,  -- Mensagem de erro se falhou
    ds_receipt_url TEXT,  -- URL do recibo

    -- Timestamps
    dt_paid_at TIMESTAMP,  -- Data/hora que foi pago
    dt_refunded_at TIMESTAMP,  -- Data/hora do reembolso
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_payment_subscription FOREIGN KEY (id_subscription)
        REFERENCES tb_subscriptions(id_subscription) ON DELETE CASCADE,
    CONSTRAINT fk_payment_user FOREIGN KEY (id_user)
        REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_payment_status CHECK (nm_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
    CONSTRAINT chk_payment_amount CHECK (vl_amount >= 0),
    CONSTRAINT chk_refunded_amount CHECK (vl_amount_refunded >= 0 AND vl_amount_refunded <= vl_amount)
);

-- Índices para tb_payments
CREATE INDEX idx_payments_subscription ON tb_payments(id_subscription);
CREATE INDEX idx_payments_user ON tb_payments(id_user);
CREATE INDEX idx_payments_invoice ON tb_payments(id_invoice);
CREATE INDEX idx_payments_status ON tb_payments(nm_status);
CREATE INDEX idx_payments_stripe_payment_id ON tb_payments(nm_stripe_payment_id);
CREATE INDEX idx_payments_created ON tb_payments(dt_criacao DESC);
CREATE INDEX idx_payments_paid_at ON tb_payments(dt_paid_at DESC);

-- Comentários
COMMENT ON TABLE tb_payments IS 'Histórico de pagamentos dos usuários';
COMMENT ON COLUMN tb_payments.id_payment IS 'ID único do pagamento';
COMMENT ON COLUMN tb_payments.nm_stripe_payment_id IS 'ID do pagamento no Stripe';
COMMENT ON COLUMN tb_payments.nm_status IS 'Status do pagamento: pending, processing, succeeded, failed, canceled, refunded';
COMMENT ON COLUMN tb_payments.vl_amount IS 'Valor total do pagamento';
COMMENT ON COLUMN tb_payments.vl_amount_refunded IS 'Valor que foi reembolsado';

-- =====================================================
-- TABELA: tb_invoices
-- Descrição: Faturas geradas para assinaturas
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_invoices (
    id_invoice UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    id_subscription UUID NOT NULL,
    id_user UUID NOT NULL,

    -- Dados da invoice
    nm_stripe_invoice_id VARCHAR(255) UNIQUE,  -- ID da invoice no Stripe
    nm_invoice_number VARCHAR(100),  -- Número da fatura (ex: INV-2024-001)
    nm_status VARCHAR(50) NOT NULL DEFAULT 'draft',  -- draft, open, paid, uncollectible, void

    -- Valores
    vl_subtotal DECIMAL(10,2) NOT NULL,  -- Subtotal (antes de descontos/impostos)
    vl_tax DECIMAL(10,2) DEFAULT 0.00,  -- Impostos
    vl_discount DECIMAL(10,2) DEFAULT 0.00,  -- Descontos
    vl_total DECIMAL(10,2) NOT NULL,  -- Total final
    vl_amount_paid DECIMAL(10,2) DEFAULT 0.00,  -- Valor já pago
    vl_amount_due DECIMAL(10,2) NOT NULL,  -- Valor devido
    nm_currency VARCHAR(3) NOT NULL DEFAULT 'BRL',

    -- Período de cobrança
    dt_period_start TIMESTAMP NOT NULL,
    dt_period_end TIMESTAMP NOT NULL,

    -- Datas importantes
    dt_due_date TIMESTAMP,  -- Data de vencimento
    dt_paid_at TIMESTAMP,  -- Data que foi paga
    dt_finalized_at TIMESTAMP,  -- Data que foi finalizada
    dt_voided_at TIMESTAMP,  -- Data que foi cancelada

    -- Metadados
    ds_description TEXT,  -- Descrição da fatura
    ds_items JSONB,  -- Items da fatura (linha por linha)
    ds_metadata JSONB,  -- Metadados adicionais
    ds_invoice_pdf_url TEXT,  -- URL do PDF da fatura
    ds_hosted_invoice_url TEXT,  -- URL da página hospedada da fatura

    -- Timestamps
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_invoice_subscription FOREIGN KEY (id_subscription)
        REFERENCES tb_subscriptions(id_subscription) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_user FOREIGN KEY (id_user)
        REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_invoice_status CHECK (nm_status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
    CONSTRAINT chk_invoice_amounts CHECK (
        vl_subtotal >= 0 AND
        vl_tax >= 0 AND
        vl_discount >= 0 AND
        vl_total >= 0 AND
        vl_amount_paid >= 0 AND
        vl_amount_due >= 0
    )
);

-- Adicionar FK de invoice em payments (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_payment_invoice'
    ) THEN
        ALTER TABLE tb_payments
        ADD CONSTRAINT fk_payment_invoice FOREIGN KEY (id_invoice)
            REFERENCES tb_invoices(id_invoice) ON DELETE SET NULL;
    END IF;
END $$;

-- Índices para tb_invoices
CREATE INDEX idx_invoices_subscription ON tb_invoices(id_subscription);
CREATE INDEX idx_invoices_user ON tb_invoices(id_user);
CREATE INDEX idx_invoices_status ON tb_invoices(nm_status);
CREATE INDEX idx_invoices_stripe_invoice_id ON tb_invoices(nm_stripe_invoice_id);
CREATE INDEX idx_invoices_invoice_number ON tb_invoices(nm_invoice_number);
CREATE INDEX idx_invoices_created ON tb_invoices(dt_criacao DESC);
CREATE INDEX idx_invoices_due_date ON tb_invoices(dt_due_date);
CREATE INDEX idx_invoices_period_start ON tb_invoices(dt_period_start);

-- Comentários
COMMENT ON TABLE tb_invoices IS 'Faturas geradas para assinaturas';
COMMENT ON COLUMN tb_invoices.id_invoice IS 'ID único da fatura';
COMMENT ON COLUMN tb_invoices.nm_stripe_invoice_id IS 'ID da invoice no Stripe';
COMMENT ON COLUMN tb_invoices.nm_invoice_number IS 'Número sequencial da fatura';
COMMENT ON COLUMN tb_invoices.nm_status IS 'Status da invoice: draft, open, paid, uncollectible, void';
COMMENT ON COLUMN tb_invoices.vl_total IS 'Valor total da fatura';
COMMENT ON COLUMN tb_invoices.vl_amount_due IS 'Valor ainda devido';
COMMENT ON COLUMN tb_invoices.ds_items IS 'Array JSON com os items da fatura';

-- =====================================================
-- FUNÇÃO: Gerar número de invoice automático
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix VARCHAR(4);
    next_number INTEGER;
    new_invoice_number VARCHAR(100);
BEGIN
    -- Pegar ano atual
    year_suffix := TO_CHAR(NOW(), 'YYYY');

    -- Pegar próximo número sequencial do ano
    SELECT COALESCE(MAX(CAST(SUBSTRING(nm_invoice_number FROM 'INV-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM tb_invoices
    WHERE nm_invoice_number LIKE 'INV-' || year_suffix || '-%';

    -- Gerar número com padding
    new_invoice_number := 'INV-' || year_suffix || '-' || LPAD(next_number::TEXT, 5, '0');

    NEW.nm_invoice_number := new_invoice_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número de invoice
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON tb_invoices;
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT ON tb_invoices
    FOR EACH ROW
    WHEN (NEW.nm_invoice_number IS NULL)
    EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- FUNÇÃO: Atualizar dt_atualizacao automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_dt_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar dt_atualizacao
DROP TRIGGER IF EXISTS trigger_update_payments_dt_atualizacao ON tb_payments;
CREATE TRIGGER trigger_update_payments_dt_atualizacao
    BEFORE UPDATE ON tb_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_atualizacao();

DROP TRIGGER IF EXISTS trigger_update_invoices_dt_atualizacao ON tb_invoices;
CREATE TRIGGER trigger_update_invoices_dt_atualizacao
    BEFORE UPDATE ON tb_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_atualizacao();

-- =====================================================
-- DADOS DE EXEMPLO (para desenvolvimento)
-- =====================================================

-- Inserir invoices de exemplo (apenas se existirem subscriptions)
DO $$
DECLARE
    v_subscription_id UUID;
    v_user_id UUID;
    v_invoice_id UUID;
BEGIN
    -- Pegar primeira subscription ativa para exemplo
    SELECT id_subscription, id_user INTO v_subscription_id, v_user_id
    FROM tb_subscriptions
    WHERE nm_status IN ('active', 'trialing')
    LIMIT 1;

    IF v_subscription_id IS NOT NULL THEN
        -- Invoice paga
        INSERT INTO tb_invoices (
            id_subscription, id_user, nm_status,
            vl_subtotal, vl_tax, vl_discount, vl_total, vl_amount_paid, vl_amount_due,
            dt_period_start, dt_period_end, dt_due_date, dt_paid_at, dt_finalized_at,
            ds_description, ds_items
        ) VALUES (
            v_subscription_id, v_user_id, 'paid',
            100.00, 10.00, 0.00, 110.00, 110.00, 0.00,
            NOW() - INTERVAL '30 days', NOW(), NOW() - INTERVAL '25 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days',
            'Assinatura mensal - Período anterior',
            '[{"description": "Plano Professional - Mensal", "quantity": 1, "unit_price": 100.00, "amount": 100.00}]'::jsonb
        ) RETURNING id_invoice INTO v_invoice_id;

        -- Payment da invoice paga
        INSERT INTO tb_payments (
            id_subscription, id_user, id_invoice, nm_payment_method, nm_status,
            vl_amount, nm_currency, dt_paid_at,
            ds_metadata
        ) VALUES (
            v_subscription_id, v_user_id, v_invoice_id, 'card', 'succeeded',
            110.00, 'BRL', NOW() - INTERVAL '23 days',
            '{"brand": "visa", "last4": "4242", "exp_month": 12, "exp_year": 2025}'::jsonb
        );

        -- Invoice aberta (a vencer)
        INSERT INTO tb_invoices (
            id_subscription, id_user, nm_status,
            vl_subtotal, vl_tax, vl_discount, vl_total, vl_amount_paid, vl_amount_due,
            dt_period_start, dt_period_end, dt_due_date, dt_finalized_at,
            ds_description, ds_items
        ) VALUES (
            v_subscription_id, v_user_id, 'open',
            100.00, 10.00, 0.00, 110.00, 0.00, 110.00,
            NOW(), NOW() + INTERVAL '30 days', NOW() + INTERVAL '5 days', NOW(),
            'Assinatura mensal - Período atual',
            '[{"description": "Plano Professional - Mensal", "quantity": 1, "unit_price": 100.00, "amount": 100.00}]'::jsonb
        );
    END IF;
END $$;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Resumo de pagamentos por usuário
CREATE OR REPLACE VIEW vw_user_payments_summary AS
SELECT
    p.id_user,
    u.nm_completo,
    u.nm_email,
    COUNT(*) AS total_payments,
    COUNT(*) FILTER (WHERE p.nm_status = 'succeeded') AS successful_payments,
    COUNT(*) FILTER (WHERE p.nm_status = 'failed') AS failed_payments,
    SUM(p.vl_amount) FILTER (WHERE p.nm_status = 'succeeded') AS total_paid,
    SUM(p.vl_amount_refunded) AS total_refunded,
    MAX(p.dt_paid_at) AS last_payment_date
FROM tb_payments p
JOIN tb_users u ON p.id_user = u.id_user
GROUP BY p.id_user, u.nm_completo, u.nm_email;

COMMENT ON VIEW vw_user_payments_summary IS 'Resumo de pagamentos por usuário';

-- View: Invoices pendentes
CREATE OR REPLACE VIEW vw_pending_invoices AS
SELECT
    i.id_invoice,
    i.nm_invoice_number,
    i.id_user,
    u.nm_completo,
    u.nm_email,
    i.vl_total,
    i.vl_amount_due,
    i.dt_due_date,
    CASE
        WHEN i.dt_due_date < NOW() THEN 'overdue'
        WHEN i.dt_due_date < NOW() + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'upcoming'
    END AS urgency,
    NOW() - i.dt_due_date AS days_overdue
FROM tb_invoices i
JOIN tb_users u ON i.id_user = u.id_user
WHERE i.nm_status = 'open' AND i.vl_amount_due > 0
ORDER BY i.dt_due_date ASC;

COMMENT ON VIEW vw_pending_invoices IS 'Invoices pendentes de pagamento com urgência';

-- =====================================================
-- CONCLUSÃO
-- =====================================================

SELECT
    'Tabelas de Payments e Invoices criadas com sucesso!' AS message,
    (SELECT COUNT(*) FROM tb_payments) AS total_payments,
    (SELECT COUNT(*) FROM tb_invoices) AS total_invoices;
