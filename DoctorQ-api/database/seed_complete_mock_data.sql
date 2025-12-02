-- ====================================================================
-- SEED COMPLETO DE DADOS MOCK - DoctorQ
-- ====================================================================
-- Este script popula TODAS as tabelas vazias com dados realistas
-- Data: 2025-10-27
-- ====================================================================

BEGIN;

-- ====================================================================
-- 1. API KEYS
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
    user_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = 'S' LIMIT 1;
    SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' LIMIT 1;

    -- 5 API Keys para diferentes propósitos
    INSERT INTO tb_api_keys (id_api_key, id_empresa, id_user, nm_nome, ds_key, st_ativo, dt_expiracao, ds_permissoes, nr_limite_requisicoes)
    VALUES
    (gen_random_uuid(), empresa_id, user_id, 'API Key Produção',
     'pk_prod_' || substring(md5(random()::text) from 1 for 32),
     'S', NOW() + INTERVAL '1 year',
     '["read", "write", "admin"]'::jsonb, 10000),

    (gen_random_uuid(), empresa_id, user_id, 'API Key Desenvolvimento',
     'pk_dev_' || substring(md5(random()::text) from 1 for 32),
     'S', NOW() + INTERVAL '6 months',
     '["read", "write"]'::jsonb, 5000),

    (gen_random_uuid(), empresa_id, user_id, 'API Key Teste',
     'pk_test_' || substring(md5(random()::text) from 1 for 32),
     'S', NOW() + INTERVAL '3 months',
     '["read"]'::jsonb, 1000),

    (gen_random_uuid(), empresa_id, user_id, 'API Key Mobile',
     'pk_mobile_' || substring(md5(random()::text) from 1 for 32),
     'S', NOW() + INTERVAL '1 year',
     '["read", "write"]'::jsonb, 20000),

    (gen_random_uuid(), empresa_id, user_id, 'API Key Parceiro',
     'pk_partner_' || substring(md5(random()::text) from 1 for 32),
     'S', NOW() + INTERVAL '2 years',
     '["read"]'::jsonb, 50000);
END $$;

-- ====================================================================
-- 2. BILLING - PLANS
-- ====================================================================
INSERT INTO tb_plans (id_plan, nm_name, ds_description, vl_price_monthly, vl_price_yearly, ds_features, nr_max_users, nr_max_storage_gb, st_active)
VALUES
('11111111-1111-1111-1111-111111111111', 'Básico', 'Plano ideal para clínicas pequenas', 99.00, 990.00,
 '["Até 3 profissionais", "Agendamento online", "Prontuário eletrônico", "5GB storage"]'::jsonb, 3, 5, 'S'),

('22222222-2222-2222-2222-222222222222', 'Profissional', 'Plano completo para clínicas médias', 299.00, 2990.00,
 '["Até 10 profissionais", "Agendamento + WhatsApp", "Prontuário + Fotos", "50GB storage", "Relatórios avançados"]'::jsonb, 10, 50, 'S'),

('33333333-3333-3333-3333-333333333333', 'Enterprise', 'Plano para grandes clínicas e franquias', 999.00, 9990.00,
 '["Profissionais ilimitados", "Multi-unidade", "API completa", "500GB storage", "Suporte prioritário", "White label"]'::jsonb, 999, 500, 'S');

-- ====================================================================
-- 3. SUBSCRIPTIONS
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
    plan_basico uuid := '11111111-1111-1111-1111-111111111111';
    plan_prof uuid := '22222222-2222-2222-2222-222222222222';
    plan_ent uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- 10 assinaturas de diferentes empresas
    FOR empresa_id IN (SELECT id_empresa FROM tb_empresas LIMIT 4) LOOP
        -- Assinatura ativa
        INSERT INTO tb_subscriptions (id_subscription, id_empresa, id_plan, nm_status, nm_billing_cycle, dt_start, dt_current_period_start, dt_current_period_end, ds_metadata)
        VALUES
        (gen_random_uuid(), empresa_id, plan_prof, 'active', 'monthly',
         NOW() - INTERVAL '3 months', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days',
         '{"payment_method": "credit_card", "auto_renew": true}'::jsonb);
    END LOOP;
END $$;

-- ====================================================================
-- 4. INVOICES
-- ====================================================================
DO $$
DECLARE
    subscription_rec RECORD;
BEGIN
    FOR subscription_rec IN (SELECT id_subscription, id_empresa FROM tb_subscriptions LIMIT 4) LOOP
        -- Fatura paga
        INSERT INTO tb_invoices (id_invoice, id_subscription, id_empresa, vl_amount, nm_status, dt_due, dt_paid, ds_payment_method)
        VALUES
        (gen_random_uuid(), subscription_rec.id_subscription, subscription_rec.id_empresa,
         299.00, 'paid', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 'credit_card');

        -- Fatura pendente
        INSERT INTO tb_invoices (id_invoice, id_subscription, id_empresa, vl_amount, nm_status, dt_due)
        VALUES
        (gen_random_uuid(), subscription_rec.id_subscription, subscription_rec.id_empresa,
         299.00, 'pending', NOW() + INTERVAL '15 days');
    END LOOP;
END $$;

-- ====================================================================
-- 5. PAYMENTS
-- ====================================================================
DO $$
DECLARE
    invoice_rec RECORD;
BEGIN
    FOR invoice_rec IN (SELECT id_invoice, id_empresa, vl_amount FROM tb_invoices WHERE nm_status = 'paid') LOOP
        INSERT INTO tb_payments (id_payment, id_invoice, id_empresa, vl_amount, nm_status, nm_payment_method, ds_transaction_id, dt_paid)
        VALUES
        (gen_random_uuid(), invoice_rec.id_invoice, invoice_rec.id_empresa, invoice_rec.vl_amount,
         'succeeded', 'credit_card', 'txn_' || substring(md5(random()::text) from 1 for 20), NOW() - INTERVAL '14 days');
    END LOOP;
END $$;

-- ====================================================================
-- 6. USAGE METRICS
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
    i integer;
BEGIN
    FOR empresa_id IN (SELECT id_empresa FROM tb_empresas LIMIT 4) LOOP
        FOR i IN 1..7 LOOP
            INSERT INTO tb_usage_metrics (id_usage_metric, id_empresa, nm_metric_type, nr_value, dt_date)
            VALUES
            (gen_random_uuid(), empresa_id, 'api_calls', floor(random() * 1000 + 100), NOW() - (i || ' days')::interval),
            (gen_random_uuid(), empresa_id, 'storage_used_mb', floor(random() * 5000 + 1000), NOW() - (i || ' days')::interval),
            (gen_random_uuid(), empresa_id, 'active_users', floor(random() * 50 + 10), NOW() - (i || ' days')::interval);
        END LOOP;
    END LOOP;
END $$;

-- ====================================================================
-- 7. E-COMMERCE - FAVORITOS
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    procedimento_id uuid;
    produto_id uuid;
BEGIN
    -- 20 favoritos de procedimentos
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 20) LOOP
        SELECT id_procedimento INTO procedimento_id FROM tb_procedimentos ORDER BY random() LIMIT 1;
        SELECT id_produto INTO produto_id FROM tb_produtos ORDER BY random() LIMIT 1;

        -- Favorito de procedimento
        IF procedimento_id IS NOT NULL THEN
            INSERT INTO tb_favoritos (id_favorito, id_paciente, id_procedimento, tp_item)
            VALUES (gen_random_uuid(), paciente_id, procedimento_id, 'procedimento')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Favorito de produto
        IF produto_id IS NOT NULL THEN
            INSERT INTO tb_favoritos (id_favorito, id_paciente, id_produto, tp_item)
            VALUES (gen_random_uuid(), paciente_id, produto_id, 'produto')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 8. E-COMMERCE - CARRINHO
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    produto_id uuid;
BEGIN
    -- 15 itens no carrinho de diferentes pacientes
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 15) LOOP
        SELECT id_produto INTO produto_id FROM tb_produtos ORDER BY random() LIMIT 1;

        IF produto_id IS NOT NULL THEN
            INSERT INTO tb_carrinho (id_carrinho, id_paciente, id_produto, nr_quantidade, vl_preco_unitario)
            VALUES (gen_random_uuid(), paciente_id, produto_id, floor(random() * 3 + 1),
                   (SELECT vl_preco FROM tb_produtos WHERE id_produto = produto_id))
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 9. E-COMMERCE - AVALIAÇÕES DE PRODUTOS
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    produto_id uuid;
BEGIN
    -- 30 avaliações de produtos
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes ORDER BY random() LIMIT 30) LOOP
        SELECT id_produto INTO produto_id FROM tb_produtos ORDER BY random() LIMIT 1;

        IF produto_id IS NOT NULL THEN
            INSERT INTO tb_avaliacoes_produtos (id_avaliacao_produto, id_produto, id_paciente, nr_nota, ds_comentario, st_aprovado)
            VALUES
            (gen_random_uuid(), produto_id, paciente_id,
             floor(random() * 3 + 3), -- nota entre 3 e 5
             (ARRAY['Produto excelente!', 'Muito bom, recomendo', 'Superou expectativas',
                    'Qualidade ótima', 'Vale cada centavo', 'Adorei o resultado'])[floor(random() * 6 + 1)],
             'S')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 10. E-COMMERCE - CUPONS
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas LIMIT 1;

    INSERT INTO tb_cupons (id_cupom, id_empresa, nm_codigo, ds_descricao, tp_desconto, vl_desconto, dt_inicio, dt_fim, nr_uso_maximo, st_ativo)
    VALUES
    (gen_random_uuid(), empresa_id, 'BEMVINDO10', 'Desconto de boas-vindas', 'percentual', 10.00, NOW(), NOW() + INTERVAL '3 months', 100, 'S'),
    (gen_random_uuid(), empresa_id, 'VERAO2025', 'Promoção de verão', 'percentual', 15.00, NOW(), NOW() + INTERVAL '2 months', 500, 'S'),
    (gen_random_uuid(), empresa_id, 'PRIMEIRACOMPRA', 'Primeira compra', 'valor', 50.00, NOW(), NOW() + INTERVAL '6 months', 1000, 'S'),
    (gen_random_uuid(), empresa_id, 'VIP20', 'Desconto VIP', 'percentual', 20.00, NOW(), NOW() + INTERVAL '1 year', NULL, 'S'),
    (gen_random_uuid(), empresa_id, 'BLACKFRIDAY', 'Black Friday 2025', 'percentual', 30.00, NOW() + INTERVAL '10 months', NOW() + INTERVAL '11 months', 10000, 'S');
END $$;

-- ====================================================================
-- 11. E-COMMERCE - PEDIDOS
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas LIMIT 1;

    -- 25 pedidos
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes ORDER BY random() LIMIT 25) LOOP
        INSERT INTO tb_pedidos (id_pedido, id_paciente, id_empresa, nm_status, vl_total, vl_desconto, vl_frete, vl_final, ds_endereco_entrega)
        VALUES
        (gen_random_uuid(), paciente_id, empresa_id,
         (ARRAY['pendente', 'processando', 'enviado', 'entregue', 'cancelado'])[floor(random() * 5 + 1)],
         random() * 500 + 100,
         random() * 50,
         random() * 30 + 10,
         random() * 500 + 100,
         '{"rua": "Rua das Flores", "numero": "123", "bairro": "Centro", "cidade": "São Paulo", "estado": "SP", "cep": "01234-567"}'::jsonb);
    END LOOP;
END $$;

-- ====================================================================
-- 12. E-COMMERCE - ITENS DE PEDIDOS
-- ====================================================================
DO $$
DECLARE
    pedido_rec RECORD;
    produto_id uuid;
BEGIN
    FOR pedido_rec IN (SELECT id_pedido FROM tb_pedidos) LOOP
        -- Adiciona 1-4 produtos por pedido
        FOR i IN 1..floor(random() * 3 + 1) LOOP
            SELECT id_produto INTO produto_id FROM tb_produtos ORDER BY random() LIMIT 1;

            IF produto_id IS NOT NULL THEN
                INSERT INTO tb_pedido_itens (id_pedido_item, id_pedido, id_produto, nr_quantidade, vl_preco_unitario, vl_total)
                VALUES
                (gen_random_uuid(), pedido_rec.id_pedido, produto_id,
                 floor(random() * 3 + 1),
                 (SELECT vl_preco FROM tb_produtos WHERE id_produto = produto_id),
                 (SELECT vl_preco * floor(random() * 3 + 1) FROM tb_produtos WHERE id_produto = produto_id))
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ====================================================================
-- 13. FOTOS E ÁLBUNS
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    album_id uuid;
BEGIN
    -- 10 álbuns
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 10) LOOP
        album_id := gen_random_uuid();
        INSERT INTO tb_albuns (id_album, id_paciente, nm_titulo, ds_descricao, st_publico)
        VALUES
        (album_id, paciente_id,
         (ARRAY['Evolução Tratamento', 'Antes e Depois', 'Meus Resultados', 'Procedimentos 2025'])[floor(random() * 4 + 1)],
         'Registro fotográfico do tratamento estético',
         (random() > 0.5));

        -- 2-5 fotos por álbum
        FOR i IN 1..floor(random() * 3 + 2) LOOP
            INSERT INTO tb_fotos (id_foto, id_album, id_paciente, ds_url, ds_legenda, dt_data_foto, st_aprovado)
            VALUES
            (gen_random_uuid(), album_id, paciente_id,
             '/uploads/fotos/' || substring(md5(random()::text) from 1 for 20) || '.jpg',
             (ARRAY['Antes do tratamento', 'Depois de 30 dias', 'Resultado final', 'Evolução positiva'])[floor(random() * 4 + 1)],
             NOW() - (floor(random() * 90) || ' days')::interval,
             'S');
        END LOOP;
    END LOOP;
END $$;

-- ====================================================================
-- 14. CHAT - CONVERSAS ENTRE USUÁRIOS
-- ====================================================================
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    conversa_id uuid;
BEGIN
    -- 15 conversas entre usuários
    FOR i IN 1..15 LOOP
        SELECT id_user INTO user1_id FROM tb_users ORDER BY random() LIMIT 1;
        SELECT id_user INTO user2_id FROM tb_users WHERE id_user != user1_id ORDER BY random() LIMIT 1;

        conversa_id := gen_random_uuid();
        INSERT INTO tb_conversas_usuarios (id_conversa_usuario, nm_titulo, tp_conversa, dt_ultima_mensagem)
        VALUES
        (conversa_id, 'Conversa sobre procedimentos', 'privada', NOW() - (floor(random() * 30) || ' days')::interval);

        -- Adiciona participantes
        INSERT INTO tb_participantes_conversa (id_participante, id_conversa_usuario, id_user)
        VALUES
        (gen_random_uuid(), conversa_id, user1_id),
        (gen_random_uuid(), conversa_id, user2_id);

        -- 3-10 mensagens por conversa
        FOR j IN 1..floor(random() * 7 + 3) LOOP
            INSERT INTO tb_mensagens_usuarios (id_mensagem_usuario, id_conversa_usuario, id_user_remetente, ds_conteudo, st_lida)
            VALUES
            (gen_random_uuid(), conversa_id,
             CASE WHEN random() > 0.5 THEN user1_id ELSE user2_id END,
             (ARRAY['Olá! Como posso ajudar?', 'Gostaria de agendar um procedimento',
                    'Qual o valor?', 'Temos disponibilidade na próxima semana',
                    'Perfeito! Vou confirmar', 'Muito obrigado pelo atendimento'])[floor(random() * 6 + 1)],
             random() > 0.3);
        END LOOP;
    END LOOP;
END $$;

-- ====================================================================
-- 15. NOTIFICAÇÕES ADICIONAIS
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- 50 notificações variadas
    FOR user_id IN (SELECT id_user FROM tb_users ORDER BY random() LIMIT 50) LOOP
        INSERT INTO tb_notificacoes (id_notificacao, id_user, tp_notificacao, ds_titulo, ds_mensagem, st_lida, ds_dados_adicionais)
        VALUES
        (gen_random_uuid(), user_id,
         (ARRAY['agendamento', 'pagamento', 'lembrete', 'promocao', 'sistema'])[floor(random() * 5 + 1)],
         (ARRAY['Novo agendamento confirmado', 'Pagamento aprovado', 'Lembrete de consulta',
                'Promoção especial', 'Atualização do sistema'])[floor(random() * 5 + 1)],
         'Mensagem de notificação do sistema DoctorQ',
         random() > 0.4,
         '{"action_url": "/dashboard", "priority": "normal"}'::jsonb);
    END LOOP;
END $$;

-- ====================================================================
-- 16. BANNERS DE MARKETING
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas LIMIT 1;

    INSERT INTO tb_banners (id_banner, id_empresa, nm_titulo, ds_descricao, ds_url_imagem, ds_url_destino, tp_banner, st_ativo, dt_inicio, dt_fim, nr_ordem)
    VALUES
    (gen_random_uuid(), empresa_id, 'Promoção de Verão', 'Desconto de até 30% em procedimentos selecionados',
     '/banners/verao2025.jpg', '/promocoes/verao', 'home', 'S', NOW(), NOW() + INTERVAL '2 months', 1),

    (gen_random_uuid(), empresa_id, 'Novo Tratamento Facial', 'Conheça nossa nova linha de tratamentos',
     '/banners/facial-novo.jpg', '/procedimentos/facial', 'sidebar', 'S', NOW(), NOW() + INTERVAL '3 months', 2),

    (gen_random_uuid(), empresa_id, 'Cashback 20%', 'Ganhe cashback em sua primeira compra',
     '/banners/cashback.jpg', '/promocoes/cashback', 'popup', 'S', NOW(), NOW() + INTERVAL '1 month', 3),

    (gen_random_uuid(), empresa_id, 'Black Friday 2025', 'Prepare-se para as melhores ofertas do ano',
     '/banners/blackfriday.jpg', '/blackfriday', 'home', 'N', NOW() + INTERVAL '10 months', NOW() + INTERVAL '11 months', 4);
END $$;

-- ====================================================================
-- 17. ANALYTICS EVENTS
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas LIMIT 1;

    -- 100 eventos de analytics
    FOR i IN 1..100 LOOP
        SELECT id_user INTO user_id FROM tb_users ORDER BY random() LIMIT 1;

        INSERT INTO tb_analytics_events (id_analytics_event, nm_event_type, ds_event_data, id_user, id_empresa)
        VALUES
        (gen_random_uuid(),
         (ARRAY['page_view', 'click', 'form_submit', 'purchase', 'search', 'login', 'logout'])[floor(random() * 7 + 1)],
         format('{"page": "/dashboard", "timestamp": "%s", "session_id": "%s"}', NOW(), substring(md5(random()::text) from 1 for 20))::jsonb,
         user_id, empresa_id);
    END LOOP;
END $$;

-- ====================================================================
-- 18. LOGS DE ACESSO
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- 200 logs de acesso
    FOR i IN 1..200 LOOP
        SELECT id_user INTO user_id FROM tb_users ORDER BY random() LIMIT 1;

        INSERT INTO tb_logs_acesso (id_log_acesso, id_user, ds_ip, ds_user_agent, ds_url, ds_metodo, nr_status_code)
        VALUES
        (gen_random_uuid(), user_id,
         format('%s.%s.%s.%s', floor(random() * 255), floor(random() * 255), floor(random() * 255), floor(random() * 255)),
         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
         (ARRAY['/dashboard', '/agendamentos', '/procedimentos', '/perfil', '/configuracoes'])[floor(random() * 5 + 1)],
         (ARRAY['GET', 'POST', 'PUT', 'DELETE'])[floor(random() * 4 + 1)],
         (ARRAY[200, 201, 204, 400, 401, 404, 500])[floor(random() * 7 + 1)]);
    END LOOP;
END $$;

-- ====================================================================
-- 19. CREDENCIAIS (ENCRYPTED)
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas LIMIT 1;

    INSERT INTO tb_credenciais (id_credencial, id_empresa, nm_nome, tp_credencial, ds_valor_encriptado, st_ativo)
    VALUES
    (gen_random_uuid(), empresa_id, 'WhatsApp API', 'api_key',
     encode(encrypt('whatsapp_key_12345', 'encryption_key_secret', 'aes'), 'base64'), 'S'),

    (gen_random_uuid(), empresa_id, 'Mercado Pago', 'api_key',
     encode(encrypt('mp_token_67890', 'encryption_key_secret', 'aes'), 'base64'), 'S'),

    (gen_random_uuid(), empresa_id, 'AWS S3', 'secret',
     encode(encrypt('aws_secret_key_abcdef', 'encryption_key_secret', 'aes'), 'base64'), 'S'),

    (gen_random_uuid(), empresa_id, 'Google OAuth', 'oauth',
     encode(encrypt('google_client_secret_xyz', 'encryption_key_secret', 'aes'), 'base64'), 'S');
END $$;

-- ====================================================================
-- 20. DISPOSITIVOS (Push Notifications)
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- 80 dispositivos registrados
    FOR user_id IN (SELECT id_user FROM tb_users ORDER BY random() LIMIT 80) LOOP
        INSERT INTO tb_dispositivos (id_dispositivo, id_user, ds_token_push, tp_plataforma, nm_modelo, st_ativo)
        VALUES
        (gen_random_uuid(), user_id,
         'push_token_' || substring(md5(random()::text) from 1 for 40),
         (ARRAY['ios', 'android', 'web'])[floor(random() * 3 + 1)],
         (ARRAY['iPhone 14', 'Samsung Galaxy S23', 'Xiaomi Redmi Note 12', 'Chrome Desktop'])[floor(random() * 4 + 1)],
         'S');
    END LOOP;
END $$;

-- ====================================================================
-- 21. TOOLS E AGENTE_TOOLS
-- ====================================================================
INSERT INTO tb_tools (id_tool, nm_nome, ds_descricao, tp_tool, ds_configuracao, st_ativo)
VALUES
('11111111-1111-1111-1111-111111111111', 'Web Search', 'Ferramenta de busca na web', 'api',
 '{"provider": "google", "api_key": "encrypted"}'::jsonb, 'S'),

('22222222-2222-2222-2222-222222222222', 'Email Sender', 'Envio de emails automatizado', 'function',
 '{"smtp_host": "smtp.gmail.com", "port": 587}'::jsonb, 'S'),

('33333333-3333-3333-3333-333333333333', 'WhatsApp Integration', 'Integração com WhatsApp Business', 'external',
 '{"webhook_url": "https://api.whatsapp.com/webhook"}'::jsonb, 'S'),

('44444444-4444-4444-4444-444444444444', 'Knowledge Base RAG', 'Busca em base de conhecimento', 'rag',
 '{"embedding_model": "text-embedding-3-small", "vector_db": "pgvector"}'::jsonb, 'S'),

('55555555-5555-5555-5555-555555555555', 'Calendar Sync', 'Sincronização com Google Calendar', 'api',
 '{"provider": "google_calendar", "scopes": ["calendar.events"]}'::jsonb, 'S');

-- Vincular tools aos agentes
DO $$
DECLARE
    agente_id uuid;
    tool_id uuid;
BEGIN
    FOR agente_id IN (SELECT id_agente FROM tb_agentes LIMIT 3) LOOP
        FOR tool_id IN (SELECT id_tool FROM tb_tools) LOOP
            INSERT INTO tb_agente_tools (id_agente_tool, id_agente, id_tool, st_ativo)
            VALUES (gen_random_uuid(), agente_id, tool_id, random() > 0.3)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ====================================================================
-- 22. TEMPLATES
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
    user_creator uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas LIMIT 1;
    SELECT id_user INTO user_creator FROM tb_users WHERE st_ativo = 'S' LIMIT 1;

    INSERT INTO tb_templates (id_template, nm_nome, ds_descricao, tp_categoria, nm_status, nm_visibility, id_agente, id_created_by, id_empresa, ds_config, ds_tags, nr_installs, nr_rating, nr_reviews_count)
    VALUES
    (gen_random_uuid(), 'Atendente Virtual de Clínica',
     'Agente especializado em atendimento a pacientes de clínicas estéticas',
     'customer_service', 'published', 'public',
     (SELECT id_agente FROM tb_agentes LIMIT 1), user_creator, empresa_id,
     '{"model": "gpt-4", "temperature": 0.7, "system_prompt": "Você é um atendente virtual de clínica estética"}'::jsonb,
     '["atendimento", "saude", "estetica"]'::jsonb, 156, 4.8, 42),

    (gen_random_uuid(), 'Consultor de Procedimentos Estéticos',
     'Agente que recomenda procedimentos baseado no perfil do paciente',
     'consultation', 'published', 'public',
     (SELECT id_agente FROM tb_agentes LIMIT 1 OFFSET 1), user_creator, empresa_id,
     '{"model": "gpt-4", "temperature": 0.6, "tools": ["knowledge_base"]}'::jsonb,
     '["consultoria", "recomendacao", "procedimentos"]'::jsonb, 89, 4.5, 27),

    (gen_random_uuid(), 'Agente de Vendas e Cross-sell',
     'Especializado em oferecer produtos complementares aos tratamentos',
     'sales', 'published', 'public',
     (SELECT id_agente FROM tb_agentes LIMIT 1 OFFSET 2), user_creator, empresa_id,
     '{"model": "gpt-3.5-turbo", "temperature": 0.8}'::jsonb,
     '["vendas", "produtos", "cross-sell"]'::jsonb, 234, 4.6, 78);
END $$;

-- ====================================================================
-- 23. TEMPLATE REVIEWS
-- ====================================================================
DO $$
DECLARE
    template_id uuid;
    user_id uuid;
BEGIN
    FOR template_id IN (SELECT id_template FROM tb_templates) LOOP
        -- 8-15 reviews por template
        FOR i IN 1..floor(random() * 7 + 8) LOOP
            SELECT id_user INTO user_id FROM tb_users ORDER BY random() LIMIT 1;

            INSERT INTO tb_template_reviews (id_template_review, id_template, id_user, nr_rating, ds_review, st_approved)
            VALUES
            (gen_random_uuid(), template_id, user_id,
             floor(random() * 3 + 3), -- 3-5 stars
             (ARRAY['Excelente template!', 'Muito útil para minha clínica', 'Recomendo!',
                    'Funciona perfeitamente', 'Atendeu minhas expectativas', 'Muito bom!'])[floor(random() * 6 + 1)],
             'S');
        END LOOP;
    END LOOP;
END $$;

-- ====================================================================
-- 24. ONBOARDING FLOWS
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas LIMIT 1;

    INSERT INTO tb_onboarding_flows (id_onboarding_flow, id_empresa, nm_nome, ds_descricao, ds_steps, st_ativo)
    VALUES
    (gen_random_uuid(), empresa_id, 'Onboarding de Clínica', 'Fluxo de configuração inicial para clínicas',
     '[
       {"step": 1, "title": "Bem-vindo", "description": "Configure sua clínica"},
       {"step": 2, "title": "Adicione Profissionais", "description": "Cadastre sua equipe"},
       {"step": 3, "title": "Configure Procedimentos", "description": "Defina seus serviços"},
       {"step": 4, "title": "Integre Agendamento", "description": "Ative o agendamento online"}
     ]'::jsonb, 'S'),

    (gen_random_uuid(), empresa_id, 'Onboarding de Paciente', 'Fluxo de boas-vindas para novos pacientes',
     '[
       {"step": 1, "title": "Complete seu Perfil", "description": "Adicione suas informações"},
       {"step": 2, "title": "Explore Procedimentos", "description": "Conheça nossos tratamentos"},
       {"step": 3, "title": "Agende sua Consulta", "description": "Marque seu primeiro atendimento"}
     ]'::jsonb, 'S');
END $$;

-- ====================================================================
-- 25. COMPARAÇÃO DE PRODUTOS
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    produto1_id uuid;
    produto2_id uuid;
BEGIN
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 20) LOOP
        SELECT id_produto INTO produto1_id FROM tb_produtos ORDER BY random() LIMIT 1;
        SELECT id_produto INTO produto2_id FROM tb_produtos WHERE id_produto != produto1_id ORDER BY random() LIMIT 1;

        IF produto1_id IS NOT NULL AND produto2_id IS NOT NULL THEN
            INSERT INTO tb_comparacao (id_comparacao, id_paciente, ds_produtos_ids)
            VALUES (gen_random_uuid(), paciente_id,
                   format('["%s", "%s"]', produto1_id, produto2_id)::jsonb)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================
SELECT 'Seed completo executado com sucesso!' as status;

SELECT tablename,
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', schemaname, tablename), false, true, '')))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'tb_%'
ORDER BY row_count DESC;
