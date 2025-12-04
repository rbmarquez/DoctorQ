-- ====================================================================
-- SEED COMPLETO DE DADOS MOCK V2 - DoctorQ
-- ====================================================================
-- Corrigido para usar tipos de dados corretos (boolean vs character)
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
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;
    SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' LIMIT 1;

    -- 5 API Keys para diferentes propósitos
    INSERT INTO tb_api_keys (id_api_key, id_empresa, id_user, nm_api_key, nm_descricao, st_ativo, dt_expiracao)
    VALUES
    (gen_random_uuid(), empresa_id, user_id,
     'pk_prod_' || substring(md5(random()::text) from 1 for 32),
     'API Key de Produção - Acesso completo', true, NOW() + INTERVAL '1 year'),

    (gen_random_uuid(), empresa_id, user_id,
     'pk_dev_' || substring(md5(random()::text) from 1 for 32),
     'API Key de Desenvolvimento', true, NOW() + INTERVAL '6 months'),

    (gen_random_uuid(), empresa_id, user_id,
     'pk_test_' || substring(md5(random()::text) from 1 for 32),
     'API Key de Teste - Somente leitura', true, NOW() + INTERVAL '3 months'),

    (gen_random_uuid(), empresa_id, user_id,
     'pk_mobile_' || substring(md5(random()::text) from 1 for 32),
     'API Key Mobile App', true, NOW() + INTERVAL '1 year'),

    (gen_random_uuid(), empresa_id, user_id,
     'pk_partner_' || substring(md5(random()::text) from 1 for 32),
     'API Key Parceiro Integração', true, NOW() + INTERVAL '2 years');
END $$;

-- ====================================================================
-- 2. BILLING - PLANS
-- ====================================================================
INSERT INTO tb_plans (id_plan, nm_nome, ds_descricao, vl_preco_mensal, vl_preco_anual, ds_caracteristicas, st_ativo)
VALUES
('11111111-1111-1111-1111-111111111111', 'Básico',
 'Plano ideal para clínicas pequenas com até 3 profissionais',
 99.00, 990.00,
 '["Até 3 profissionais", "Agendamento online", "Prontuário eletrônico", "5GB storage", "Suporte por email"]'::jsonb, true),

('22222222-2222-2222-2222-222222222222', 'Profissional',
 'Plano completo para clínicas médias',
 299.00, 2990.00,
 '["Até 10 profissionais", "Agendamento + WhatsApp", "Prontuário + Fotos", "50GB storage", "Relatórios avançados", "Suporte prioritário"]'::jsonb, true),

('33333333-3333-3333-3333-333333333333', 'Enterprise',
 'Plano para grandes clínicas e franquias',
 999.00, 9990.00,
 '["Profissionais ilimitados", "Multi-unidade", "API completa", "500GB storage", "Suporte 24/7", "White label", "Customizações"]'::jsonb, true);

-- ====================================================================
-- 3. SUBSCRIPTIONS
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
    plan_ids uuid[] := ARRAY['11111111-1111-1111-1111-111111111111'::uuid,
                              '22222222-2222-2222-2222-222222222222'::uuid,
                              '33333333-3333-3333-3333-333333333333'::uuid];
    i integer := 1;
BEGIN
    FOR empresa_id IN (SELECT id_empresa FROM tb_empresas WHERE st_ativo = true LIMIT 4) LOOP
        -- Assinatura ativa
        INSERT INTO tb_subscriptions (
            id_subscription, id_empresa, id_plan, nm_status, nm_ciclo_faturamento,
            dt_inicio, dt_inicio_periodo_atual, dt_fim_periodo_atual, ds_metadata
        )
        VALUES (
            gen_random_uuid(), empresa_id, plan_ids[MOD(i, 3) + 1], 'active', 'monthly',
            NOW() - INTERVAL '3 months', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days',
            jsonb_build_object('payment_method', 'credit_card', 'auto_renew', true)
        );
        i := i + 1;
    END LOOP;
END $$;

-- ====================================================================
-- 4. INVOICES
-- ====================================================================
DO $$
DECLARE
    subscription_rec RECORD;
BEGIN
    FOR subscription_rec IN (SELECT s.id_subscription, s.id_empresa FROM tb_subscriptions s LIMIT 4) LOOP
        -- Fatura paga (mês passado)
        INSERT INTO tb_invoices (
            id_invoice, id_subscription, id_empresa, vl_valor, nm_status,
            dt_vencimento, dt_pagamento, nm_metodo_pagamento
        )
        VALUES (
            gen_random_uuid(), subscription_rec.id_subscription, subscription_rec.id_empresa,
            299.00, 'paid', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 'credit_card'
        );

        -- Fatura pendente (mês atual)
        INSERT INTO tb_invoices (
            id_invoice, id_subscription, id_empresa, vl_valor, nm_status, dt_vencimento
        )
        VALUES (
            gen_random_uuid(), subscription_rec.id_subscription, subscription_rec.id_empresa,
            299.00, 'pending', NOW() + INTERVAL '15 days'
        );
    END LOOP;
END $$;

-- ====================================================================
-- 5. PAYMENTS
-- ====================================================================
DO $$
DECLARE
    invoice_rec RECORD;
BEGIN
    FOR invoice_rec IN (SELECT id_invoice, id_empresa, vl_valor FROM tb_invoices WHERE nm_status = 'paid') LOOP
        INSERT INTO tb_payments (
            id_payment, id_invoice, id_empresa, vl_valor, nm_status,
            nm_metodo_pagamento, ds_transacao_id, dt_pagamento
        )
        VALUES (
            gen_random_uuid(), invoice_rec.id_invoice, invoice_rec.id_empresa, invoice_rec.vl_valor,
            'succeeded', 'credit_card',
            'txn_' || substring(md5(random()::text) from 1 for 20),
            NOW() - INTERVAL '14 days'
        );
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
    FOR empresa_id IN (SELECT id_empresa FROM tb_empresas WHERE st_ativo = true LIMIT 4) LOOP
        FOR i IN 1..7 LOOP
            -- Métricas diárias para última semana
            INSERT INTO tb_usage_metrics (id_usage_metric, id_empresa, nm_tipo_metrica, nr_valor, dt_data)
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
    counter integer := 0;
BEGIN
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 20) LOOP
        EXIT WHEN counter >= 30;

        SELECT id_procedimento INTO procedimento_id FROM tb_procedimentos ORDER BY random() LIMIT 1;
        SELECT id_produto INTO produto_id FROM tb_produtos ORDER BY random() LIMIT 1;

        -- Favorito de procedimento
        IF procedimento_id IS NOT NULL THEN
            INSERT INTO tb_favoritos (id_favorito, id_paciente, id_procedimento, tp_item)
            VALUES (gen_random_uuid(), paciente_id, procedimento_id, 'procedimento')
            ON CONFLICT DO NOTHING;
            counter := counter + 1;
        END IF;

        -- Favorito de produto
        IF produto_id IS NOT NULL AND random() > 0.5 THEN
            INSERT INTO tb_favoritos (id_favorito, id_paciente, id_produto, tp_item)
            VALUES (gen_random_uuid(), paciente_id, produto_id, 'produto')
            ON CONFLICT DO NOTHING;
            counter := counter + 1;
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
    produto_preco numeric;
BEGIN
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 15) LOOP
        SELECT id_produto, vl_preco INTO produto_id, produto_preco
        FROM tb_produtos
        WHERE st_ativo = true
        ORDER BY random() LIMIT 1;

        IF produto_id IS NOT NULL AND produto_preco IS NOT NULL THEN
            INSERT INTO tb_carrinho (id_carrinho, id_paciente, id_produto, nr_quantidade, vl_preco_unitario)
            VALUES (gen_random_uuid(), paciente_id, produto_id, floor(random() * 3 + 1), produto_preco)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 9. E-COMMERCE - AVALIAÇÕES DE PRODUTOS
-- ====================================================================
DO $$
DECLARE
    paciente_rec RECORD;
    produto_id uuid;
    comentarios text[] := ARRAY[
        'Produto excelente! Superou minhas expectativas',
        'Muito bom, recomendo para todos',
        'Qualidade ótima, vale cada centavo',
        'Adorei o resultado, vou comprar novamente',
        'Produto de primeira qualidade',
        'Recomendo! Resultado visível em poucos dias',
        'Excelente custo-benefício',
        'Produto original e de qualidade'
    ];
BEGIN
    FOR paciente_rec IN (SELECT id_paciente FROM tb_pacientes ORDER BY random() LIMIT 30) LOOP
        SELECT id_produto INTO produto_id FROM tb_produtos WHERE st_ativo = true ORDER BY random() LIMIT 1;

        IF produto_id IS NOT NULL THEN
            INSERT INTO tb_avaliacoes_produtos (
                id_avaliacao_produto, id_produto, id_paciente,
                nr_nota, ds_comentario, st_aprovado
            )
            VALUES (
                gen_random_uuid(), produto_id, paciente_rec.id_paciente,
                floor(random() * 3 + 3), -- nota entre 3 e 5
                comentarios[floor(random() * array_length(comentarios, 1) + 1)],
                true
            )
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
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    IF empresa_id IS NOT NULL THEN
        INSERT INTO tb_cupons (
            id_cupom, id_empresa, nm_codigo, ds_descricao,
            tp_desconto, vl_desconto, dt_validade_inicio, dt_validade_fim,
            nr_uso_maximo, st_ativo
        )
        VALUES
        (gen_random_uuid(), empresa_id, 'BEMVINDO10', 'Desconto de boas-vindas para novos clientes',
         'percentual', 10.00, NOW(), NOW() + INTERVAL '3 months', 100, true),

        (gen_random_uuid(), empresa_id, 'VERAO2025', 'Promoção especial de verão',
         'percentual', 15.00, NOW(), NOW() + INTERVAL '2 months', 500, true),

        (gen_random_uuid(), empresa_id, 'PRIMEIRACOMPRA', 'Desconto na primeira compra',
         'valor', 50.00, NOW(), NOW() + INTERVAL '6 months', 1000, true),

        (gen_random_uuid(), empresa_id, 'VIP20', 'Desconto exclusivo VIP',
         'percentual', 20.00, NOW(), NOW() + INTERVAL '1 year', NULL, true),

        (gen_random_uuid(), empresa_id, 'BLACKFRIDAY', 'Black Friday 2025',
         'percentual', 30.00, NOW() + INTERVAL '10 months', NOW() + INTERVAL '11 months', 10000, true);
    END IF;
END $$;

-- ====================================================================
-- 11. E-COMMERCE - PEDIDOS
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    empresa_id uuid;
    vl_total numeric;
    vl_desconto numeric;
    vl_frete numeric;
    status_list text[] := ARRAY['pendente', 'processando', 'enviado', 'entregue', 'cancelado'];
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes ORDER BY random() LIMIT 25) LOOP
        vl_total := random() * 500 + 100;
        vl_desconto := random() * 50;
        vl_frete := random() * 30 + 10;

        INSERT INTO tb_pedidos (
            id_pedido, id_paciente, id_empresa, nm_status,
            vl_total, vl_desconto, vl_frete, vl_final, ds_endereco_entrega
        )
        VALUES (
            gen_random_uuid(), paciente_id, empresa_id,
            status_list[floor(random() * array_length(status_list, 1) + 1)],
            vl_total, vl_desconto, vl_frete, vl_total - vl_desconto + vl_frete,
            jsonb_build_object(
                'rua', 'Rua das Flores',
                'numero', floor(random() * 1000 + 1)::text,
                'bairro', 'Centro',
                'cidade', 'São Paulo',
                'estado', 'SP',
                'cep', '01234-567'
            )
        );
    END LOOP;
END $$;

-- ====================================================================
-- 12. E-COMMERCE - ITENS DE PEDIDOS
-- ====================================================================
DO $$
DECLARE
    pedido_id uuid;
    produto_rec RECORD;
    qtd integer;
BEGIN
    FOR pedido_id IN (SELECT id_pedido FROM tb_pedidos) LOOP
        -- Adiciona 1-4 produtos por pedido
        FOR i IN 1..floor(random() * 3 + 1) LOOP
            SELECT id_produto, vl_preco INTO produto_rec
            FROM tb_produtos
            WHERE st_ativo = true
            ORDER BY random() LIMIT 1;

            IF FOUND THEN
                qtd := floor(random() * 3 + 1);
                INSERT INTO tb_pedido_itens (
                    id_pedido_item, id_pedido, id_produto,
                    nr_quantidade, vl_preco_unitario, vl_total
                )
                VALUES (
                    gen_random_uuid(), pedido_id, produto_rec.id_produto,
                    qtd, produto_rec.vl_preco, produto_rec.vl_preco * qtd
                )
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
    titulos text[] := ARRAY['Evolução Tratamento', 'Antes e Depois', 'Meus Resultados', 'Procedimentos 2025'];
    legendas text[] := ARRAY['Antes do tratamento', 'Depois de 30 dias', 'Resultado final', 'Evolução positiva'];
BEGIN
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 10) LOOP
        album_id := gen_random_uuid();
        INSERT INTO tb_albuns (id_album, id_paciente, id_empresa, nm_titulo, ds_descricao, st_publico)
        VALUES (
            album_id, paciente_id,
            (SELECT id_empresa FROM tb_empresas WHERE st_ativo = true LIMIT 1),
            titulos[floor(random() * array_length(titulos, 1) + 1)],
            'Registro fotográfico do tratamento estético',
            random() > 0.5
        );

        -- 2-5 fotos por álbum
        FOR i IN 1..floor(random() * 3 + 2) LOOP
            INSERT INTO tb_fotos (id_foto, id_album, id_paciente, ds_url, ds_legenda, dt_captura, st_aprovado)
            VALUES (
                gen_random_uuid(), album_id, paciente_id,
                '/uploads/fotos/' || substring(md5(random()::text) from 1 for 20) || '.jpg',
                legendas[floor(random() * array_length(legendas, 1) + 1)],
                NOW() - (floor(random() * 90) || ' days')::interval,
                true
            );
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
    mensagens text[] := ARRAY[
        'Olá! Como posso ajudar?',
        'Gostaria de agendar um procedimento',
        'Qual o valor?',
        'Temos disponibilidade na próxima semana',
        'Perfeito! Vou confirmar',
        'Muito obrigado pelo atendimento'
    ];
BEGIN
    -- 15 conversas entre usuários
    FOR i IN 1..15 LOOP
        SELECT id_user INTO user1_id FROM tb_users WHERE st_ativo = 'S' ORDER BY random() LIMIT 1;
        SELECT id_user INTO user2_id FROM tb_users WHERE id_user != user1_id AND st_ativo = 'S' ORDER BY random() LIMIT 1;

        IF user1_id IS NOT NULL AND user2_id IS NOT NULL THEN
            conversa_id := gen_random_uuid();
            INSERT INTO tb_conversas_usuarios (
                id_conversa_usuario, id_empresa, nm_titulo, tp_conversa, dt_ultima_mensagem
            )
            VALUES (
                conversa_id,
                (SELECT id_empresa FROM tb_empresas WHERE st_ativo = true LIMIT 1),
                'Conversa sobre procedimentos',
                'privada',
                NOW() - (floor(random() * 30) || ' days')::interval
            );

            -- Adiciona participantes
            INSERT INTO tb_participantes_conversa (id_participante, id_conversa_usuario, id_user)
            VALUES
            (gen_random_uuid(), conversa_id, user1_id),
            (gen_random_uuid(), conversa_id, user2_id);

            -- 3-10 mensagens por conversa
            FOR j IN 1..floor(random() * 7 + 3) LOOP
                INSERT INTO tb_mensagens_usuarios (
                    id_mensagem_usuario, id_conversa_usuario, id_user_remetente,
                    ds_conteudo, st_lida
                )
                VALUES (
                    gen_random_uuid(), conversa_id,
                    CASE WHEN random() > 0.5 THEN user1_id ELSE user2_id END,
                    mensagens[floor(random() * array_length(mensagens, 1) + 1)],
                    random() > 0.3
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 15. NOTIFICAÇÕES ADICIONAIS
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    tipos text[] := ARRAY['agendamento', 'pagamento', 'lembrete', 'promocao', 'sistema'];
    titulos text[] := ARRAY[
        'Novo agendamento confirmado',
        'Pagamento aprovado',
        'Lembrete de consulta',
        'Promoção especial',
        'Atualização do sistema'
    ];
BEGIN
    FOR i IN 1..50 LOOP
        SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' ORDER BY random() LIMIT 1;

        IF user_id IS NOT NULL THEN
            INSERT INTO tb_notificacoes (
                id_notificacao, id_user, id_empresa, tp_notificacao,
                ds_titulo, ds_mensagem, st_lida, ds_metadados
            )
            VALUES (
                gen_random_uuid(), user_id,
                (SELECT id_empresa FROM tb_users WHERE id_user = user_id),
                tipos[floor(random() * array_length(tipos, 1) + 1)],
                titulos[floor(random() * array_length(titulos, 1) + 1)],
                'Mensagem de notificação do sistema DoctorQ',
                random() > 0.4,
                jsonb_build_object('action_url', '/dashboard', 'priority', 'normal')
            );
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 16. BANNERS DE MARKETING
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    IF empresa_id IS NOT NULL THEN
        INSERT INTO tb_banners (
            id_banner, id_empresa, nm_titulo, ds_descricao, ds_url_imagem,
            ds_url_destino, tp_posicao, st_ativo, dt_inicio, dt_fim, nr_ordem
        )
        VALUES
        (gen_random_uuid(), empresa_id, 'Promoção de Verão',
         'Desconto de até 30% em procedimentos selecionados',
         '/banners/verao2025.jpg', '/promocoes/verao', 'home', true,
         NOW(), NOW() + INTERVAL '2 months', 1),

        (gen_random_uuid(), empresa_id, 'Novo Tratamento Facial',
         'Conheça nossa nova linha de tratamentos faciais',
         '/banners/facial-novo.jpg', '/procedimentos/facial', 'sidebar', true,
         NOW(), NOW() + INTERVAL '3 months', 2),

        (gen_random_uuid(), empresa_id, 'Cashback 20%',
         'Ganhe cashback em sua primeira compra',
         '/banners/cashback.jpg', '/promocoes/cashback', 'popup', true,
         NOW(), NOW() + INTERVAL '1 month', 3),

        (gen_random_uuid(), empresa_id, 'Black Friday 2025',
         'Prepare-se para as melhores ofertas do ano',
         '/banners/blackfriday.jpg', '/blackfriday', 'home', false,
         NOW() + INTERVAL '10 months', NOW() + INTERVAL '11 months', 4);
    END IF;
END $$;

-- ====================================================================
-- 17. ANALYTICS EVENTS
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    empresa_id uuid;
    event_types text[] := ARRAY['page_view', 'click', 'form_submit', 'purchase', 'search', 'login', 'logout'];
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    FOR i IN 1..100 LOOP
        SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' ORDER BY random() LIMIT 1;

        IF user_id IS NOT NULL AND empresa_id IS NOT NULL THEN
            INSERT INTO tb_analytics_events (
                id_analytics_event, nm_tipo_evento, ds_dados_evento, id_user, id_empresa
            )
            VALUES (
                gen_random_uuid(),
                event_types[floor(random() * array_length(event_types, 1) + 1)],
                jsonb_build_object(
                    'page', '/dashboard',
                    'timestamp', NOW(),
                    'session_id', substring(md5(random()::text) from 1 for 20)
                ),
                user_id, empresa_id
            );
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 18. LOGS DE ACESSO
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    urls text[] := ARRAY['/dashboard', '/agendamentos', '/procedimentos', '/perfil', '/configuracoes'];
    metodos text[] := ARRAY['GET', 'POST', 'PUT', 'DELETE'];
    status_codes integer[] := ARRAY[200, 201, 204, 400, 401, 404, 500];
BEGIN
    FOR i IN 1..200 LOOP
        SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' ORDER BY random() LIMIT 1;

        IF user_id IS NOT NULL THEN
            INSERT INTO tb_logs_acesso (
                id_log_acesso, id_user, ds_endereco_ip, ds_user_agent,
                ds_url, nm_metodo, nr_codigo_status
            )
            VALUES (
                gen_random_uuid(), user_id,
                format('%s.%s.%s.%s',
                    floor(random() * 255), floor(random() * 255),
                    floor(random() * 255), floor(random() * 255)
                ),
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                urls[floor(random() * array_length(urls, 1) + 1)],
                metodos[floor(random() * array_length(metodos, 1) + 1)],
                status_codes[floor(random() * array_length(status_codes, 1) + 1)]
            );
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 19. CREDENCIAIS (ENCRYPTED)
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    IF empresa_id IS NOT NULL THEN
        INSERT INTO tb_credenciais (
            id_credencial, id_empresa, nm_nome, tp_credencial,
            ds_valor_encriptado, st_ativo
        )
        VALUES
        (gen_random_uuid(), empresa_id, 'WhatsApp Business API', 'api_key',
         encode('whatsapp_encrypted_key_12345'::bytea, 'base64'), true),

        (gen_random_uuid(), empresa_id, 'Mercado Pago Token', 'api_key',
         encode('mercadopago_token_67890'::bytea, 'base64'), true),

        (gen_random_uuid(), empresa_id, 'AWS S3 Access', 'secret',
         encode('aws_secret_key_abcdef'::bytea, 'base64'), true),

        (gen_random_uuid(), empresa_id, 'Google OAuth Client', 'oauth',
         encode('google_client_secret_xyz'::bytea, 'base64'), true);
    END IF;
END $$;

-- ====================================================================
-- 20. DISPOSITIVOS (Push Notifications)
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    plataformas text[] := ARRAY['ios', 'android', 'web'];
    modelos text[] := ARRAY['iPhone 14', 'Samsung Galaxy S23', 'Xiaomi Redmi Note 12', 'Chrome Desktop'];
BEGIN
    FOR i IN 1..80 LOOP
        SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' ORDER BY random() LIMIT 1;

        IF user_id IS NOT NULL THEN
            INSERT INTO tb_dispositivos (
                id_dispositivo, id_user, ds_token_push, tp_plataforma, nm_modelo, st_ativo
            )
            VALUES (
                gen_random_uuid(), user_id,
                'push_token_' || substring(md5(random()::text) from 1 for 40),
                plataformas[floor(random() * array_length(plataformas, 1) + 1)],
                modelos[floor(random() * array_length(modelos, 1) + 1)],
                true
            );
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 21. TOOLS E AGENTE_TOOLS
-- ====================================================================
INSERT INTO tb_tools (
    id_tool, nm_nome, ds_descricao, tp_tool, ds_configuracao, st_ativo
)
VALUES
('11111111-1111-1111-1111-111111111111', 'Web Search',
 'Ferramenta de busca na web com Google Search API', 'api',
 jsonb_build_object('provider', 'google', 'api_key_encrypted', true), true),

('22222222-2222-2222-2222-222222222222', 'Email Sender',
 'Envio automatizado de emails via SMTP', 'function',
 jsonb_build_object('smtp_host', 'smtp.gmail.com', 'port', 587), true),

('33333333-3333-3333-3333-333333333333', 'WhatsApp Integration',
 'Integração completa com WhatsApp Business API', 'external',
 jsonb_build_object('webhook_url', 'https://api.whatsapp.com/webhook'), true),

('44444444-4444-4444-4444-444444444444', 'Knowledge Base RAG',
 'Busca semântica em base de conhecimento com embeddings', 'rag',
 jsonb_build_object('embedding_model', 'text-embedding-3-small', 'vector_db', 'pgvector'), true),

('55555555-5555-5555-5555-555555555555', 'Calendar Sync',
 'Sincronização bidirecional com Google Calendar', 'api',
 jsonb_build_object('provider', 'google_calendar', 'scopes', ARRAY['calendar.events']), true);

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
    user_id uuid;
    agente_ids uuid[];
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;
    SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' LIMIT 1;
    SELECT array_agg(id_agente) INTO agente_ids FROM tb_agentes LIMIT 3;

    IF empresa_id IS NOT NULL AND user_id IS NOT NULL AND array_length(agente_ids, 1) >= 3 THEN
        INSERT INTO tb_templates (
            id_template, nm_nome, ds_descricao, tp_categoria, nm_status, nm_visibilidade,
            id_agente, id_criador, id_empresa_criador, ds_configuracao, ds_tags,
            nr_instalacoes, nr_avaliacao_media, nr_total_avaliacoes
        )
        VALUES
        (gen_random_uuid(), 'Atendente Virtual de Clínica',
         'Agente especializado em atendimento a pacientes de clínicas estéticas com IA',
         'customer_service', 'published', 'public',
         agente_ids[1], user_id, empresa_id,
         jsonb_build_object(
             'model', 'gpt-4',
             'temperature', 0.7,
             'system_prompt', 'Você é um atendente virtual de clínica estética'
         ),
         '["atendimento", "saude", "estetica"]'::jsonb, 156, 4.8, 42),

        (gen_random_uuid(), 'Consultor de Procedimentos Estéticos',
         'Agente que recomenda procedimentos baseado no perfil e necessidades do paciente',
         'consultation', 'published', 'public',
         agente_ids[2], user_id, empresa_id,
         jsonb_build_object('model', 'gpt-4', 'temperature', 0.6, 'tools', ARRAY['knowledge_base']),
         '["consultoria", "recomendacao", "procedimentos"]'::jsonb, 89, 4.5, 27),

        (gen_random_uuid(), 'Agente de Vendas e Cross-sell',
         'Especializado em oferecer produtos complementares aos tratamentos',
         'sales', 'published', 'public',
         agente_ids[3], user_id, empresa_id,
         jsonb_build_object('model', 'gpt-3.5-turbo', 'temperature', 0.8),
         '["vendas", "produtos", "cross-sell"]'::jsonb, 234, 4.6, 78);
    END IF;
END $$;

-- ====================================================================
-- 23. TEMPLATE REVIEWS
-- ====================================================================
DO $$
DECLARE
    template_id uuid;
    user_id uuid;
    reviews text[] := ARRAY[
        'Excelente template! Funcionou perfeitamente',
        'Muito útil para minha clínica',
        'Recomendo fortemente',
        'Funciona exatamente como esperado',
        'Atendeu todas as minhas expectativas',
        'Muito bom e fácil de configurar'
    ];
BEGIN
    FOR template_id IN (SELECT id_template FROM tb_templates) LOOP
        FOR i IN 1..floor(random() * 7 + 8) LOOP
            SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' ORDER BY random() LIMIT 1;

            IF user_id IS NOT NULL THEN
                INSERT INTO tb_template_reviews (
                    id_template_review, id_template, id_user,
                    nr_nota, ds_comentario, st_aprovado
                )
                VALUES (
                    gen_random_uuid(), template_id, user_id,
                    floor(random() * 3 + 3), -- 3-5 stars
                    reviews[floor(random() * array_length(reviews, 1) + 1)],
                    true
                );
            END IF;
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
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    IF empresa_id IS NOT NULL THEN
        INSERT INTO tb_onboarding_flows (
            id_onboarding_flow, id_empresa, nm_nome, ds_descricao, ds_passos, st_ativo
        )
        VALUES
        (gen_random_uuid(), empresa_id, 'Onboarding de Clínica',
         'Fluxo de configuração inicial completa para clínicas',
         jsonb_build_array(
             jsonb_build_object('step', 1, 'title', 'Bem-vindo', 'description', 'Configure sua clínica'),
             jsonb_build_object('step', 2, 'title', 'Adicione Profissionais', 'description', 'Cadastre sua equipe'),
             jsonb_build_object('step', 3, 'title', 'Configure Procedimentos', 'description', 'Defina seus serviços'),
             jsonb_build_object('step', 4, 'title', 'Integre Agendamento', 'description', 'Ative o agendamento online')
         ), true),

        (gen_random_uuid(), empresa_id, 'Onboarding de Paciente',
         'Fluxo de boas-vindas para novos pacientes',
         jsonb_build_array(
             jsonb_build_object('step', 1, 'title', 'Complete seu Perfil', 'description', 'Adicione suas informações'),
             jsonb_build_object('step', 2, 'title', 'Explore Procedimentos', 'description', 'Conheça nossos tratamentos'),
             jsonb_build_object('step', 3, 'title', 'Agende sua Consulta', 'description', 'Marque seu primeiro atendimento')
         ), true);
    END IF;
END $$;

-- ====================================================================
-- 25. COMPARAÇÃO DE PRODUTOS
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    produto_ids uuid[];
BEGIN
    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 20) LOOP
        SELECT array_agg(id_produto ORDER BY random()) INTO produto_ids
        FROM tb_produtos
        WHERE st_ativo = true
        LIMIT 2;

        IF array_length(produto_ids, 1) >= 2 THEN
            INSERT INTO tb_comparacao (id_comparacao, id_paciente, ds_produtos_ids)
            VALUES (gen_random_uuid(), paciente_id, to_jsonb(produto_ids))
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================
SELECT 'Seed V2 executado com sucesso!' as status;

SELECT tablename,
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', schemaname, tablename), false, true, '')))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'tb_%'
ORDER BY row_count DESC
LIMIT 30;
