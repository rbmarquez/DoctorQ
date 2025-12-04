-- ====================================================================
-- SEED BILLING MOCK DATA FOR DOCTORQ
-- ====================================================================
-- Populates: tb_subscriptions, tb_invoices, tb_payments, tb_usage_metrics
-- ====================================================================

-- ====================================================================
-- 1. SUBSCRIPTIONS - 10 records
-- ====================================================================

-- Get plan IDs
DO $$
DECLARE
    plan_free_id uuid;
    plan_starter_id uuid;
    plan_professional_id uuid;
    plan_enterprise_id uuid;
BEGIN
    SELECT id_plan INTO plan_free_id FROM tb_plans WHERE nm_tier = 'free' LIMIT 1;
    SELECT id_plan INTO plan_starter_id FROM tb_plans WHERE nm_tier = 'starter' LIMIT 1;
    SELECT id_plan INTO plan_professional_id FROM tb_plans WHERE nm_tier = 'professional' LIMIT 1;
    SELECT id_plan INTO plan_enterprise_id FROM tb_plans WHERE nm_tier = 'enterprise' LIMIT 1;

    CREATE TEMP TABLE temp_plans (
        tier varchar(20),
        id_plan uuid
    );

    INSERT INTO temp_plans VALUES
        ('free', plan_free_id),
        ('starter', plan_starter_id),
        ('professional', plan_professional_id),
        ('enterprise', plan_enterprise_id);
END $$;

INSERT INTO tb_subscriptions (
    id_subscription,
    id_user,
    id_plan,
    nm_status,
    nm_billing_interval,
    dt_start,
    dt_trial_end,
    dt_current_period_start,
    dt_current_period_end,
    dt_canceled_at,
    dt_ended_at,
    nm_stripe_subscription_id,
    nm_stripe_customer_id,
    ds_metadata
) VALUES
-- Subscription 1: Patrícia - Professional (Active, monthly)
(
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    (SELECT id_plan FROM temp_plans WHERE tier = 'professional'),
    'active',
    'month',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '76 days',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    NULL,
    NULL,
    'sub_1PatriciaProf123456',
    'cus_Patricia123456',
    '{"payment_method": "credit_card", "card_brand": "visa", "card_last4": "4242"}'::jsonb
),

-- Subscription 2: Ricardo - Starter (Trialing)
(
    '22222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    (SELECT id_plan FROM temp_plans WHERE tier = 'starter'),
    'trialing',
    'month',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '23 days',
    NULL,
    NULL,
    'sub_2RicardoStarter789',
    'cus_Ricardo789',
    '{"trial_from": "marketing_campaign_q4"}'::jsonb
),

-- Subscription 3: Fernanda - Professional (Active, yearly)
(
    '33333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    (SELECT id_plan FROM temp_plans WHERE tier = 'professional'),
    'active',
    'year',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '166 days',
    NOW() - INTERVAL '180 days',
    NOW() + INTERVAL '185 days',
    NULL,
    NULL,
    'sub_3FernandaProf456',
    'cus_Fernanda456',
    '{"payment_method": "credit_card", "card_brand": "mastercard", "card_last4": "5555", "discount": "yearly_20"}'::jsonb
),

-- Subscription 4: Bruno - Free (Active)
(
    '44444444-4444-4444-4444-444444444444',
    'b4444444-4444-4444-4444-444444444444',
    (SELECT id_plan FROM temp_plans WHERE tier = 'free'),
    'active',
    'month',
    NOW() - INTERVAL '120 days',
    NULL,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    NULL,
    NULL,
    NULL,
    NULL,
    '{"signup_source": "organic"}'::jsonb
),

-- Subscription 5: Amanda - Starter (Canceled)
(
    '55555555-5555-5555-5555-555555555555',
    'b5555555-5555-5555-5555-555555555555',
    (SELECT id_plan FROM temp_plans WHERE tier = 'starter'),
    'canceled',
    'month',
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '136 days',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '15 days',
    NULL,
    'sub_5AmandaStarter321',
    'cus_Amanda321',
    '{"payment_method": "credit_card", "cancellation_reason": "switching_to_competitor", "feedback": "Preço alto para minhas necessidades"}'::jsonb
),

-- Subscription 6: Lucas - Professional (Past Due)
(
    '66666666-6666-6666-6666-666666666666',
    'b6666666-6666-6666-6666-666666666666',
    (SELECT id_plan FROM temp_plans WHERE tier = 'professional'),
    'past_due',
    'month',
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '186 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    NULL,
    NULL,
    'sub_6LucasProf654',
    'cus_Lucas654',
    '{"payment_method": "credit_card", "card_brand": "visa", "card_last4": "1234", "payment_failures": 3, "last_failure": "insufficient_funds"}'::jsonb
),

-- Subscription 7: Admin - Enterprise (Active, yearly)
(
    '77777777-7777-7777-7777-777777777777',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    (SELECT id_plan FROM temp_plans WHERE tier = 'enterprise'),
    'active',
    'year',
    NOW() - INTERVAL '365 days',
    NULL,
    NOW() - INTERVAL '365 days',
    NOW(),
    NULL,
    NULL,
    'sub_7AdminEnterprise999',
    'cus_Admin999',
    '{"payment_method": "boleto", "company": "DoctorQ Sistemas", "cnpj": "12.345.678/0001-90"}'::jsonb
),

-- Subscription 8: User (ex-trial, now active Professional)
(
    '88888888-8888-8888-8888-888888888888',
    'b1111111-1111-1111-1111-111111111111',
    (SELECT id_plan FROM temp_plans WHERE tier = 'professional'),
    'active',
    'month',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '31 days',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    NULL,
    NULL,
    'sub_8UserProf777',
    'cus_User777',
    '{"converted_from_trial": true, "conversion_date": "2025-09-26"}'::jsonb
),

-- Subscription 9: User (Paused)
(
    '99999999-9999-9999-9999-999999999999',
    'b2222222-2222-2222-2222-222222222222',
    (SELECT id_plan FROM temp_plans WHERE tier = 'starter'),
    'paused',
    'month',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '46 days',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    NULL,
    NULL,
    'sub_9UserStarter888',
    'cus_User888',
    '{"pause_reason": "vacation", "pause_requested_at": "2025-10-01", "resume_at": "2025-11-15"}'::jsonb
),

-- Subscription 10: User (Unpaid - payment failed)
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'b3333333-3333-3333-3333-333333333333',
    (SELECT id_plan FROM temp_plans WHERE tier = 'starter'),
    'unpaid',
    'month',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '76 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    NULL,
    NULL,
    'sub_10UserStarterUnpaid',
    'cus_UserUnpaid',
    '{"payment_method": "credit_card", "card_brand": "visa", "card_last4": "9999", "payment_failures": 5, "grace_period_end": "2025-11-05"}'::jsonb
);

-- ====================================================================
-- 2. INVOICES - 18 records
-- ====================================================================

INSERT INTO tb_invoices (
    id_invoice,
    id_subscription,
    id_user,
    nm_stripe_invoice_id,
    nm_invoice_number,
    nm_status,
    vl_subtotal,
    vl_tax,
    vl_discount,
    vl_total,
    vl_amount_paid,
    vl_amount_due,
    nm_currency,
    dt_period_start,
    dt_period_end,
    dt_due_date,
    dt_paid_at,
    dt_finalized_at,
    ds_description,
    ds_items,
    ds_metadata
) VALUES
-- Invoices for Patrícia (Professional - Active)
(
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'in_1PatriciaInv001',
    NULL, -- Will be auto-generated
    'paid',
    99.00,
    0.00,
    0.00,
    99.00,
    99.00,
    0.00,
    'BRL',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '29 days',
    NOW() - INTERVAL '30 days',
    'Assinatura Professional - Mensal',
    '[{"description": "Plano Professional", "quantity": 1, "unit_price": 99.00, "amount": 99.00}]'::jsonb,
    '{"payment_method": "credit_card"}'::jsonb
),
(
    '11211111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'in_1PatriciaInv002',
    NULL,
    'paid',
    99.00,
    0.00,
    0.00,
    99.00,
    99.00,
    0.00,
    'BRL',
    NOW() - INTERVAL '30 days',
    NOW(),
    NOW(),
    NOW() - INTERVAL '1 day',
    NOW(),
    'Assinatura Professional - Mensal',
    '[{"description": "Plano Professional", "quantity": 1, "unit_price": 99.00, "amount": 99.00}]'::jsonb,
    '{"payment_method": "credit_card"}'::jsonb
),

-- Invoice for Ricardo (Starter - Trialing) - Future invoice
(
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    NULL,
    NULL,
    'draft',
    29.00,
    0.00,
    0.00,
    29.00,
    0.00,
    29.00,
    'BRL',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '37 days',
    NOW() + INTERVAL '37 days',
    NULL,
    NULL,
    'Primeira fatura após trial - Plano Starter',
    '[{"description": "Plano Starter", "quantity": 1, "unit_price": 29.00, "amount": 29.00}]'::jsonb,
    '{"trial_conversion": true}'::jsonb
),

-- Invoice for Fernanda (Professional - Yearly) - Paid
(
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    'in_3FernandaInvYear001',
    NULL,
    'paid',
    990.00,
    0.00,
    198.00,
    792.00,
    792.00,
    0.00,
    'BRL',
    NOW() - INTERVAL '180 days',
    NOW() + INTERVAL '185 days',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days',
    'Assinatura Professional - Anual (20% desconto)',
    '[{"description": "Plano Professional Anual", "quantity": 1, "unit_price": 990.00, "amount": 990.00}, {"description": "Desconto Anual 20%", "quantity": 1, "unit_price": -198.00, "amount": -198.00}]'::jsonb,
    '{"payment_method": "credit_card", "discount_code": "YEARLY20"}'::jsonb
),

-- Invoices for Amanda (Starter - Canceled) - Mix of paid and last one
(
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'b5555555-5555-5555-5555-555555555555',
    'in_5AmandaInv001',
    NULL,
    'paid',
    29.00,
    0.00,
    0.00,
    29.00,
    29.00,
    0.00,
    'BRL',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '59 days',
    NOW() - INTERVAL '60 days',
    'Assinatura Starter - Mensal',
    '[{"description": "Plano Starter", "quantity": 1, "unit_price": 29.00, "amount": 29.00}]'::jsonb,
    '{"payment_method": "pix"}'::jsonb
),
(
    '55255555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'b5555555-5555-5555-5555-555555555555',
    'in_5AmandaInv002',
    NULL,
    'paid',
    29.00,
    0.00,
    0.00,
    29.00,
    29.00,
    0.00,
    'BRL',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '29 days',
    NOW() - INTERVAL '30 days',
    'Assinatura Starter - Mensal',
    '[{"description": "Plano Starter", "quantity": 1, "unit_price": 29.00, "amount": 29.00}]'::jsonb,
    '{"payment_method": "pix"}'::jsonb
),

-- Invoices for Lucas (Professional - Past Due) - Unpaid
(
    '66666666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'b6666666-6666-6666-6666-666666666666',
    'in_6LucasInv001',
    NULL,
    'paid',
    99.00,
    0.00,
    0.00,
    99.00,
    99.00,
    0.00,
    'BRL',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '58 days',
    NOW() - INTERVAL '60 days',
    'Assinatura Professional - Mensal',
    '[{"description": "Plano Professional", "quantity": 1, "unit_price": 99.00, "amount": 99.00}]'::jsonb,
    '{"payment_method": "credit_card"}'::jsonb
),
(
    '66766666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'b6666666-6666-6666-6666-666666666666',
    'in_6LucasInv002',
    NULL,
    'open',
    99.00,
    0.00,
    0.00,
    99.00,
    0.00,
    99.00,
    'BRL',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NULL,
    NOW() - INTERVAL '30 days',
    'Assinatura Professional - Mensal (Vencida)',
    '[{"description": "Plano Professional", "quantity": 1, "unit_price": 99.00, "amount": 99.00}]'::jsonb,
    '{"payment_method": "credit_card", "payment_attempts": 3}'::jsonb
),

-- Invoices for Admin (Enterprise - Yearly)
(
    '77777777-7777-7777-7777-777777777777',
    '77777777-7777-7777-7777-777777777777',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    'in_7AdminEntInv001',
    NULL,
    'paid',
    4990.00,
    0.00,
    0.00,
    4990.00,
    4990.00,
    0.00,
    'BRL',
    NOW() - INTERVAL '365 days',
    NOW(),
    NOW() - INTERVAL '365 days',
    NOW() - INTERVAL '360 days',
    NOW() - INTERVAL '365 days',
    'Assinatura Enterprise - Anual',
    '[{"description": "Plano Enterprise Anual", "quantity": 1, "unit_price": 4990.00, "amount": 4990.00}]'::jsonb,
    '{"payment_method": "boleto", "company_name": "DoctorQ Sistemas"}'::jsonb
),

-- More invoices for active subscriptions (recent months)
(
    '88888888-8888-8888-8888-888888888888',
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'in_PatriciaCurrent',
    NULL,
    'open',
    99.00,
    0.00,
    0.00,
    99.00,
    0.00,
    99.00,
    'BRL',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    NULL,
    NULL,
    'Assinatura Professional - Próximo período',
    '[{"description": "Plano Professional", "quantity": 1, "unit_price": 99.00, "amount": 99.00}]'::jsonb,
    '{"payment_method": "credit_card", "auto_charge_date": "2025-11-27"}'::jsonb
);

-- ====================================================================
-- 3. PAYMENTS - 15 records
-- ====================================================================

INSERT INTO tb_payments (
    id_payment,
    id_subscription,
    id_user,
    id_invoice,
    nm_stripe_payment_id,
    nm_stripe_payment_intent_id,
    nm_payment_method,
    nm_status,
    vl_amount,
    vl_amount_refunded,
    nm_currency,
    ds_metadata,
    ds_receipt_url,
    dt_paid_at
) VALUES
-- Payments for Patrícia invoices
(
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'py_1PatriciaPayment001',
    'pi_1PatriciaIntent001',
    'credit_card',
    'succeeded',
    99.00,
    0.00,
    'BRL',
    '{"card_brand": "visa", "card_last4": "4242", "card_exp_month": 12, "card_exp_year": 2027}'::jsonb,
    'https://stripe.com/receipts/patricia001',
    NOW() - INTERVAL '29 days'
),
(
    '11211111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    '11211111-1111-1111-1111-111111111111',
    'py_1PatriciaPayment002',
    'pi_1PatriciaIntent002',
    'credit_card',
    'succeeded',
    99.00,
    0.00,
    'BRL',
    '{"card_brand": "visa", "card_last4": "4242", "card_exp_month": 12, "card_exp_year": 2027}'::jsonb,
    'https://stripe.com/receipts/patricia002',
    NOW() - INTERVAL '1 day'
),

-- Payment for Fernanda yearly invoice
(
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'py_3FernandaPaymentYear',
    'pi_3FernandaIntentYear',
    'credit_card',
    'succeeded',
    792.00,
    0.00,
    'BRL',
    '{"card_brand": "mastercard", "card_last4": "5555", "card_exp_month": 8, "card_exp_year": 2026, "discount_applied": "YEARLY20"}'::jsonb,
    'https://stripe.com/receipts/fernanda001',
    NOW() - INTERVAL '180 days'
),

-- Payments for Amanda (PIX)
(
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'b5555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'py_5AmandaPaymentPIX001',
    'pi_5AmandaIntentPIX001',
    'pix',
    'succeeded',
    29.00,
    0.00,
    'BRL',
    '{"pix_key_type": "cpf", "pix_paid_via": "app_bancario"}'::jsonb,
    'https://stripe.com/receipts/amanda001',
    NOW() - INTERVAL '59 days'
),
(
    '55255555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'b5555555-5555-5555-5555-555555555555',
    '55255555-5555-5555-5555-555555555555',
    'py_5AmandaPaymentPIX002',
    'pi_5AmandaIntentPIX002',
    'pix',
    'succeeded',
    29.00,
    0.00,
    'BRL',
    '{"pix_key_type": "email", "pix_paid_via": "app_bancario"}'::jsonb,
    'https://stripe.com/receipts/amanda002',
    NOW() - INTERVAL '29 days'
),

-- Payment for Lucas (one successful, one failed)
(
    '66666666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'b6666666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'py_6LucasPayment001',
    'pi_6LucasIntent001',
    'credit_card',
    'succeeded',
    99.00,
    0.00,
    'BRL',
    '{"card_brand": "visa", "card_last4": "1234", "card_exp_month": 6, "card_exp_year": 2025}'::jsonb,
    'https://stripe.com/receipts/lucas001',
    NOW() - INTERVAL '58 days'
),
(
    '66766666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'b6666666-6666-6666-6666-666666666666',
    '66766666-6666-6666-6666-666666666666',
    'py_6LucasPaymentFailed',
    'pi_6LucasIntentFailed',
    'credit_card',
    'failed',
    99.00,
    0.00,
    'BRL',
    '{"card_brand": "visa", "card_last4": "1234", "card_exp_month": 6, "card_exp_year": 2025, "decline_code": "insufficient_funds"}'::jsonb,
    NULL,
    NULL
),

-- Payment for Admin (Boleto)
(
    '77777777-7777-7777-7777-777777777777',
    '77777777-7777-7777-7777-777777777777',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '77777777-7777-7777-7777-777777777777',
    'py_7AdminPaymentBoleto',
    'pi_7AdminIntentBoleto',
    'boleto',
    'succeeded',
    4990.00,
    0.00,
    'BRL',
    '{"boleto_barcode": "34191.79001 01043.510047 91020.150008 1 96610000019900", "paid_at_bank": "Banco do Brasil"}'::jsonb,
    'https://stripe.com/receipts/admin001',
    NOW() - INTERVAL '360 days'
);

-- ====================================================================
-- 4. USAGE METRICS - 35 records
-- ====================================================================

-- Metrics for Patrícia (Professional - Active user with good usage)
INSERT INTO tb_usage_metrics (
    id_metric,
    id_subscription,
    id_user,
    nm_metric_type,
    nr_value,
    dt_period_start,
    dt_period_end,
    ds_metadata
) VALUES
-- Current month
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'api_calls', 4523, NOW() - INTERVAL '30 days', NOW(), '{"peak_day": "2025-10-15", "peak_calls": 245}'::jsonb),
('11211111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'tokens', 125430, NOW() - INTERVAL '30 days', NOW(), '{"avg_tokens_per_call": 27.7}'::jsonb),
('11311111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'messages', 892, NOW() - INTERVAL '30 days', NOW(), '{"user_messages": 446, "assistant_messages": 446}'::jsonb),
('11411111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'agents', 3, NOW() - INTERVAL '30 days', NOW(), '{"active_agents": ["Agent A", "Agent B", "Agent C"]}'::jsonb),
('11511111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'document_stores', 2, NOW() - INTERVAL '30 days', NOW(), '{"total_documents": 45}'::jsonb),
('11611111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'storage_gb', 2.35, NOW() - INTERVAL '30 days', NOW(), '{"documents_size_gb": 1.8, "embeddings_size_gb": 0.55}'::jsonb),
('11711111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'embeddings', 3240, NOW() - INTERVAL '30 days', NOW(), '{"model": "text-embedding-3-small"}'::jsonb),
-- Previous month
('11811111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'api_calls', 3890, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', '{}'::jsonb),
('11911111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'tokens', 98234, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', '{}'::jsonb),

-- Metrics for Fernanda (Professional - Yearly, power user)
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'api_calls', 12450, NOW() - INTERVAL '30 days', NOW(), '{"peak_day": "2025-10-20", "peak_calls": 890}'::jsonb),
('33233333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'tokens', 456789, NOW() - INTERVAL '30 days', NOW(), '{"avg_tokens_per_call": 36.7}'::jsonb),
('33333334-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'messages', 2456, NOW() - INTERVAL '30 days', NOW(), '{"user_messages": 1228, "assistant_messages": 1228}'::jsonb),
('33333335-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'agents', 8, NOW() - INTERVAL '30 days', NOW(), '{"active_agents": 8}'::jsonb),
('33333336-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'document_stores', 5, NOW() - INTERVAL '30 days', NOW(), '{"total_documents": 234}'::jsonb),
('33333337-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'storage_gb', 8.92, NOW() - INTERVAL '30 days', NOW(), '{"documents_size_gb": 7.1, "embeddings_size_gb": 1.82}'::jsonb),
('33333338-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'embeddings', 15678, NOW() - INTERVAL '30 days', NOW(), '{"model": "text-embedding-3-small"}'::jsonb),

-- Metrics for Ricardo (Starter - Trial, light usage)
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'api_calls', 234, NOW() - INTERVAL '7 days', NOW(), '{"trial_user": true}'::jsonb),
('22322222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'tokens', 8456, NOW() - INTERVAL '7 days', NOW(), '{"trial_user": true}'::jsonb),
('22422222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'messages', 67, NOW() - INTERVAL '7 days', NOW(), '{"trial_user": true, "user_messages": 34, "assistant_messages": 33}'::jsonb),
('22522222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'agents', 1, NOW() - INTERVAL '7 days', NOW(), '{"trial_user": true}'::jsonb),

-- Metrics for Bruno (Free plan - limited usage)
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'api_calls', 156, NOW() - INTERVAL '30 days', NOW(), '{"free_tier_limit": 500, "usage_percent": 31.2}'::jsonb),
('44544444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'tokens', 5234, NOW() - INTERVAL '30 days', NOW(), '{"free_tier_limit": 10000, "usage_percent": 52.34}'::jsonb),
('44644444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'messages', 45, NOW() - INTERVAL '30 days', NOW(), '{"free_tier_limit": 100, "usage_percent": 45}'::jsonb),
('44744444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'agents', 1, NOW() - INTERVAL '30 days', NOW(), '{"free_tier_limit": 1}'::jsonb),

-- Metrics for Admin (Enterprise - Heavy usage)
('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'api_calls', 45890, NOW() - INTERVAL '30 days', NOW(), '{"enterprise_user": true, "peak_day": "2025-10-18", "peak_calls": 2345}'::jsonb),
('77877777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'tokens', 1234567, NOW() - INTERVAL '30 days', NOW(), '{"enterprise_user": true}'::jsonb),
('77977777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'messages', 8942, NOW() - INTERVAL '30 days', NOW(), '{"enterprise_user": true, "user_messages": 4471, "assistant_messages": 4471}'::jsonb),
('77a77777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'agents', 25, NOW() - INTERVAL '30 days', NOW(), '{"enterprise_user": true, "team_size": 15}'::jsonb),
('77b77777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'document_stores', 42, NOW() - INTERVAL '30 days', NOW(), '{"enterprise_user": true, "total_documents": 5678}'::jsonb),
('77c77777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'storage_gb', 156.78, NOW() - INTERVAL '30 days', NOW(), '{"enterprise_user": true, "documents_size_gb": 124.5, "embeddings_size_gb": 32.28}'::jsonb),
('77d77777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'embeddings', 89456, NOW() - INTERVAL '30 days', NOW(), '{"enterprise_user": true, "model": "text-embedding-3-large"}'::jsonb),

-- Previous month metrics for Admin
('77e77777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'api_calls', 38234, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', '{"enterprise_user": true}'::jsonb),
('77f77777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 'tokens', 987654, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', '{"enterprise_user": true}'::jsonb);

-- Drop temp table
DROP TABLE temp_plans;

-- ====================================================================
-- END OF BILLING SEED SCRIPT
-- ====================================================================
