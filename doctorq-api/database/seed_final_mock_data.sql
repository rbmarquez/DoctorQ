-- ====================================================================
-- SEED FINAL MOCK DATA - Last missing tables
-- ====================================================================
-- Populates: tb_template_installations, tb_api_keys, tb_search_stats,
--            tb_analytics_events, tb_onboarding_flows,
--            tb_user_onboarding_progress
-- ====================================================================

-- ====================================================================
-- 1. TEMPLATE_INSTALLATIONS - 25 records
-- ====================================================================

INSERT INTO tb_template_installations (
    id_installation,
    id_template,
    id_user,
    id_empresa,
    id_agente,
    js_customizations,
    bl_ativo,
    dt_instalacao
) VALUES
-- Template 1 (Customer Support) - 5 installations
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', '{"company_name": "DoctorQ", "support_hours": "24/7", "languages": ["pt-BR", "en"]}'::jsonb, true, NOW() - INTERVAL '100 days'),
('a1211111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"company_name": "Minha Empresa", "support_hours": "9-18"}'::jsonb, true, NOW() - INTERVAL '80 days'),
('a1311111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"company_name": "Tech Solutions", "support_hours": "8-20"}'::jsonb, true, NOW() - INTERVAL '60 days'),
('a1411111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', NULL, '{}'::jsonb, false, NOW() - INTERVAL '40 days'),
('a1511111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', NULL, '{"company_name": "StartupX"}'::jsonb, true, NOW() - INTERVAL '20 days'),

-- Template 2 (Sales Assistant) - 4 installations
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"crm": "pipedrive", "auto_followup": true}'::jsonb, true, NOW() - INTERVAL '70 days'),
('a2322222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', NULL, '{"crm": "salesforce"}'::jsonb, true, NOW() - INTERVAL '50 days'),
('a2422222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', '00000000-0000-0000-0000-000000000001', '73a148b6-42a7-423f-b05b-a0d64cc56322', '{"crm": "hubspot", "lead_score_threshold": 7}'::jsonb, true, NOW() - INTERVAL '30 days'),
('a2522222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{}'::jsonb, true, NOW() - INTERVAL '15 days'),

-- Template 4 (Marketing Content) - 6 installations
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "profissional", "platforms": ["Instagram", "LinkedIn"]}'::jsonb, true, NOW() - INTERVAL '55 days'),
('a4544444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "casual", "platforms": ["Facebook", "Twitter"]}'::jsonb, true, NOW() - INTERVAL '45 days'),
('a4644444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "amigável", "platforms": ["TikTok", "Instagram"]}'::jsonb, true, NOW() - INTERVAL '35 days'),
('a4744444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "técnico"}'::jsonb, true, NOW() - INTERVAL '25 days'),
('a4844444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "inspirador"}'::jsonb, true, NOW() - INTERVAL '12 days'),
('a4944444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "educativo"}'::jsonb, false, NOW() - INTERVAL '5 days'),

-- Template 8 (Teacher Assistant) - 10 installations
('a8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Matemática", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '9 days'),
('a8988888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Física", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '8 days'),
('a8a88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Português", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '7 days'),
('a8b88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Programação", "grade_level": "superior"}'::jsonb, true, NOW() - INTERVAL '6 days'),
('a8c88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Inglês", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '5 days'),
('a8d88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Química", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '4 days'),
('a8e88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "História", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '3 days'),
('a8f88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Biologia", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '2 days'),
('a8108888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Geografia", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '1 day'),
('a8208888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Espanhol", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '6 hours');

-- ====================================================================
-- 2. API_KEYS - 10 records
-- ====================================================================

INSERT INTO tb_api_keys (
    id_api_key,
    id_user,
    id_empresa,
    nm_api_key,
    nm_descricao,
    st_ativo,
    dt_expiracao,
    dt_criacao
) VALUES
-- Production keys
('11111111-1111-1111-1111-111111111111', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', '00000000-0000-0000-0000-000000000001', 'sk_prod_1234567890abcdefghijklmnopqrstuv', 'Production API Key - Admin', true, NOW() + INTERVAL '365 days', NOW() - INTERVAL '180 days'),
('22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'sk_prod_abcdefghij1234567890klmnopqrstuv', 'Production Key - Patricia', true, NOW() + INTERVAL '365 days', NOW() - INTERVAL '90 days'),
('33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'sk_prod_xyz9876543210fedcbazyxwvutsrqpon', 'Production Key - Fernanda', true, NOW() + INTERVAL '365 days', NOW() - INTERVAL '60 days'),

-- Development keys
('44444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'sk_dev_testkey12345abcdefghij67890xyz', 'Development Key - Ricardo', true, NOW() + INTERVAL '90 days', NOW() - INTERVAL '30 days'),
('55555555-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'sk_dev_devkey9876543210fedcba123456', 'Development Key - Bruno', true, NOW() + INTERVAL '90 days', NOW() - INTERVAL '15 days'),

-- Test keys
('66666666-6666-6666-6666-666666666666', 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'sk_test_testkeyabcdefghijklmnopqrstuv', 'Test Key - Amanda', true, NOW() + INTERVAL '30 days', NOW() - INTERVAL '10 days'),
('77777777-7777-7777-7777-777777777777', 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 'sk_test_testkey123456789abcdefghijk', 'Test Key - Lucas', true, NOW() + INTERVAL '30 days', NOW() - INTERVAL '5 days'),

-- Revoked/Inactive keys
('88888888-8888-8888-8888-888888888888', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'sk_prod_oldkey_revoked_123456789abc', 'Old Production Key (Revoked)', false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '200 days'),
('99999999-9999-9999-9999-999999999999', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'sk_dev_expiredkey_987654321fedcba', 'Expired Development Key', false, NOW() - INTERVAL '60 days', NOW() - INTERVAL '150 days'),

-- Integration key
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', '00000000-0000-0000-0000-000000000001', 'sk_integration_webhook_123abc456def', 'Webhook Integration Key', true, NULL, NOW() - INTERVAL '45 days');

-- ====================================================================
-- 3. SEARCH_STATS - 20 records
-- ====================================================================

-- Get document store IDs
DO $$
DECLARE
    store_id1 uuid;
    store_id2 uuid;
    store_id3 uuid;
    store_id4 uuid;
BEGIN
    SELECT id_documento_store INTO store_id1 FROM tb_documento_store ORDER BY dt_criacao LIMIT 1 OFFSET 0;
    SELECT id_documento_store INTO store_id2 FROM tb_documento_store ORDER BY dt_criacao LIMIT 1 OFFSET 1;
    SELECT id_documento_store INTO store_id3 FROM tb_documento_store ORDER BY dt_criacao LIMIT 1 OFFSET 2;
    SELECT id_documento_store INTO store_id4 FROM tb_documento_store ORDER BY dt_criacao LIMIT 1 OFFSET 3;

    CREATE TEMP TABLE temp_doc_stores (
        idx int,
        id_store uuid
    );

    INSERT INTO temp_doc_stores VALUES
        (1, COALESCE(store_id1, (SELECT id_documento_store FROM tb_documento_store LIMIT 1))),
        (2, COALESCE(store_id2, (SELECT id_documento_store FROM tb_documento_store LIMIT 1))),
        (3, COALESCE(store_id3, (SELECT id_documento_store FROM tb_documento_store LIMIT 1))),
        (4, COALESCE(store_id4, (SELECT id_documento_store FROM tb_documento_store LIMIT 1)));
END $$;

INSERT INTO tb_search_stats (
    id_stat,
    id_documento_store,
    id_agente,
    ds_query,
    nr_query_tokens,
    nr_results_found,
    nr_top_k,
    nr_search_time_ms,
    nr_avg_similarity,
    nr_top_similarity,
    js_filters,
    js_results,
    dt_criacao
) VALUES
-- Successful searches
('11111111-1111-1111-1111-111111111111', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Como funciona a licitação pública?', 8, 15, 5, 234, 0.8234, 0.9123, '{}'::jsonb, '[{"doc_id": "doc1", "score": 0.9123}, {"doc_id": "doc2", "score": 0.8456}]'::jsonb, NOW() - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222222', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Contrato administrativo prazo', 5, 23, 5, 189, 0.7823, 0.8845, '{}'::jsonb, '[{"doc_id": "doc3", "score": 0.8845}]'::jsonb, NOW() - INTERVAL '4 hours'),
('33333333-3333-3333-3333-333333333333', (SELECT id_store FROM temp_doc_stores WHERE idx = 2), '73a148b6-42a7-423f-b05b-a0d64cc56322', 'Lei 14.133 modalidades de contratação', 7, 34, 10, 312, 0.8534, 0.9234, '{"year": 2021}'::jsonb, '[{"doc_id": "lei1", "score": 0.9234}]'::jsonb, NOW() - INTERVAL '1 day'),
('44444444-4444-4444-4444-444444444444', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Dispensa de licitação', 4, 19, 5, 156, 0.7912, 0.8678, '{}'::jsonb, '[{"doc_id": "doc5", "score": 0.8678}]'::jsonb, NOW() - INTERVAL '2 days'),
('55555555-5555-5555-5555-555555555555', (SELECT id_store FROM temp_doc_stores WHERE idx = 2), '73a148b6-42a7-423f-b05b-a0d64cc56322', 'Pregão eletrônico procedimentos', 5, 28, 5, 201, 0.8123, 0.8923, '{}'::jsonb, '[{"doc_id": "doc7", "score": 0.8923}]'::jsonb, NOW() - INTERVAL '3 days'),

-- More varied searches
('66666666-6666-6666-6666-666666666666', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Rescisão contratual fundamentos legais', 6, 17, 5, 178, 0.7645, 0.8456, '{}'::jsonb, '[{"doc_id": "doc9", "score": 0.8456}]'::jsonb, NOW() - INTERVAL '5 days'),
('77777777-7777-7777-7777-777777777777', (SELECT id_store FROM temp_doc_stores WHERE idx = 3), '455fbe40-84f2-4104-8c12-bfe918ac9462', 'Sanções administrativas fornecedores', 5, 12, 5, 145, 0.7234, 0.8234, '{}'::jsonb, '[{"doc_id": "doc11", "score": 0.8234}]'::jsonb, NOW() - INTERVAL '7 days'),
('88888888-8888-8888-8888-888888888888', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Fiscalização e gestão de contratos', 6, 31, 10, 267, 0.8345, 0.9045, '{}'::jsonb, '[{"doc_id": "doc13", "score": 0.9045}]'::jsonb, NOW() - INTERVAL '10 days'),
('99999999-9999-9999-9999-999999999999', (SELECT id_store FROM temp_doc_stores WHERE idx = 2), '73a148b6-42a7-423f-b05b-a0d64cc56322', 'Sustentabilidade em contratações públicas', 7, 14, 5, 198, 0.7456, 0.8123, '{"topic": "sustainability"}'::jsonb, '[{"doc_id": "doc15", "score": 0.8123}]'::jsonb, NOW() - INTERVAL '12 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id_store FROM temp_doc_stores WHERE idx = 4), 'de355852-c1dd-43ee-9709-ae042369aafb', 'Habilitação de empresas licitação', 6, 22, 5, 223, 0.7834, 0.8567, '{}'::jsonb, '[{"doc_id": "doc17", "score": 0.8567}]'::jsonb, NOW() - INTERVAL '15 days'),

-- Low similarity searches (not found relevant results)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Como fazer pizza margherita', 5, 3, 5, 134, 0.2123, 0.3456, '{}'::jsonb, '[]'::jsonb, NOW() - INTERVAL '18 days'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id_store FROM temp_doc_stores WHERE idx = 2), '73a148b6-42a7-423f-b05b-a0d64cc56322', 'receita bolo chocolate', 4, 1, 5, 112, 0.1234, 0.2345, '{}'::jsonb, '[]'::jsonb, NOW() - INTERVAL '20 days'),

-- Recent high-quality searches
('dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Procedimento licitatório passo a passo', 7, 42, 10, 345, 0.8756, 0.9456, '{}'::jsonb, '[{"doc_id": "doc20", "score": 0.9456}]'::jsonb, NOW() - INTERVAL '5 hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT id_store FROM temp_doc_stores WHERE idx = 2), '73a148b6-42a7-423f-b05b-a0d64cc56322', 'Documentação necessária pregão', 5, 27, 5, 198, 0.8234, 0.8934, '{}'::jsonb, '[{"doc_id": "doc22", "score": 0.8934}]'::jsonb, NOW() - INTERVAL '3 hours'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Prazos recursais licitação', 5, 18, 5, 167, 0.7945, 0.8678, '{}'::jsonb, '[{"doc_id": "doc24", "score": 0.8678}]'::jsonb, NOW() - INTERVAL '1 hour'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', (SELECT id_store FROM temp_doc_stores WHERE idx = 3), '455fbe40-84f2-4104-8c12-bfe918ac9462', 'Critérios julgamento melhor técnica', 6, 25, 5, 234, 0.8123, 0.8845, '{}'::jsonb, '[{"doc_id": "doc26", "score": 0.8845}]'::jsonb, NOW() - INTERVAL '30 minutes'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Garantia contratual tipos valores', 6, 21, 5, 189, 0.7756, 0.8567, '{}'::jsonb, '[{"doc_id": "doc28", "score": 0.8567}]'::jsonb, NOW() - INTERVAL '15 minutes'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', (SELECT id_store FROM temp_doc_stores WHERE idx = 2), '73a148b6-42a7-423f-b05b-a0d64cc56322', 'Reajuste preços contratuais índices', 6, 19, 5, 201, 0.8034, 0.8745, '{}'::jsonb, '[{"doc_id": "doc30", "score": 0.8745}]'::jsonb, NOW() - INTERVAL '5 minutes'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', (SELECT id_store FROM temp_doc_stores WHERE idx = 1), '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', 'Subcontratação regras limites', 5, 16, 5, 156, 0.7623, 0.8423, '{}'::jsonb, '[{"doc_id": "doc32", "score": 0.8423}]'::jsonb, NOW() - INTERVAL '2 minutes'),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', (SELECT id_store FROM temp_doc_stores WHERE idx = 4), 'de355852-c1dd-43ee-9709-ae042369aafb', 'Equilíbrio econômico financeiro', 5, 24, 5, 178, 0.7834, 0.8656, '{}'::jsonb, '[{"doc_id": "doc34", "score": 0.8656}]'::jsonb, NOW() - INTERVAL '1 minute');

DROP TABLE temp_doc_stores;

-- ====================================================================
-- 4. ANALYTICS_EVENTS - 30 records
-- ====================================================================

INSERT INTO tb_analytics_events (
    id_event,
    nm_event_type,
    ds_properties,
    id_user,
    id_empresa,
    dt_evento
) VALUES
-- User login events
('11111111-1111-1111-1111-111111111111', 'user_login', '{"ip": "192.168.1.100", "user_agent": "Chrome 120", "location": "São Paulo, BR"}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222222', 'user_login', '{"ip": "192.168.1.101", "user_agent": "Firefox 121", "location": "Rio de Janeiro, BR"}'::jsonb, 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 hours'),
('33333333-3333-3333-3333-333333333333', 'user_login', '{"ip": "192.168.1.102", "user_agent": "Safari 17", "location": "Belo Horizonte, BR"}'::jsonb, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day'),

-- Agent creation events
('44444444-4444-4444-4444-444444444444', 'agent_created', '{"agent_name": "Assistente de Vendas", "model": "gpt-4", "temperature": 0.7}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days'),
('55555555-5555-5555-5555-555555555555', 'agent_created', '{"agent_name": "Suporte Técnico", "model": "gpt-3.5-turbo", "temperature": 0.5}'::jsonb, 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days'),

-- Message sent events
('66666666-6666-6666-6666-666666666666', 'message_sent', '{"tokens": 345, "cost": 0.00345, "model": "gpt-4", "response_time_ms": 2340}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
('77777777-7777-7777-7777-777777777777', 'message_sent', '{"tokens": 234, "cost": 0.00234, "model": "gpt-4", "response_time_ms": 1890}'::jsonb, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours'),
('88888888-8888-8888-8888-888888888888', 'message_sent', '{"tokens": 567, "cost": 0.00567, "model": "gpt-4", "response_time_ms": 3120}'::jsonb, 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 hours'),

-- Document upload events
('99999999-9999-9999-9999-999999999999', 'document_uploaded', '{"file_name": "contrato_fornecimento.pdf", "file_size_mb": 2.3, "pages": 15}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'document_uploaded', '{"file_name": "proposta_tecnica.docx", "file_size_mb": 1.8, "pages": 12}'::jsonb, 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days'),

-- Template installed events
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'template_installed', '{"template_name": "Agente de Suporte", "template_id": "11111111-1111-1111-1111-111111111111"}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '100 days'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'template_installed', '{"template_name": "Assistente de Vendas", "template_id": "22222222-2222-2222-2222-222222222222"}'::jsonb, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '70 days'),

-- Search events
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'search_performed', '{"query": "licitação pública", "results_count": 15, "search_time_ms": 234}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'search_performed', '{"query": "contrato administrativo", "results_count": 23, "search_time_ms": 189}'::jsonb, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 hours'),

-- Subscription events
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'subscription_created', '{"plan": "Professional", "interval": "monthly", "amount": 99.00}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days'),
('10000000-0000-0000-0000-000000000000', 'subscription_upgraded', '{"from_plan": "Starter", "to_plan": "Professional", "amount": 99.00}'::jsonb, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days'),
('20000000-0000-0000-0000-000000000000', 'subscription_canceled', '{"plan": "Starter", "reason": "switching_to_competitor", "months_active": 5}'::jsonb, 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days'),

-- Payment events
('30000000-0000-0000-0000-000000000000', 'payment_succeeded', '{"amount": 99.00, "method": "credit_card", "card_last4": "4242"}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '29 days'),
('40000000-0000-0000-0000-000000000000', 'payment_failed', '{"amount": 99.00, "method": "credit_card", "card_last4": "1234", "error": "insufficient_funds"}'::jsonb, 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days'),

-- API key events
('50000000-0000-0000-0000-000000000000', 'api_key_created', '{"key_name": "Production Key", "expires_in_days": 365}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days'),
('60000000-0000-0000-0000-000000000000', 'api_key_revoked', '{"key_name": "Old Production Key", "reason": "security_rotation"}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days'),

-- Error events
('70000000-0000-0000-0000-000000000000', 'error_occurred', '{"error_type": "rate_limit_exceeded", "endpoint": "/api/chat", "status_code": 429}'::jsonb, 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 hours'),
('80000000-0000-0000-0000-000000000000', 'error_occurred', '{"error_type": "invalid_api_key", "endpoint": "/api/agents", "status_code": 401}'::jsonb, NULL, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 hours'),

-- Feature usage events
('90000000-0000-0000-0000-000000000000', 'feature_used', '{"feature": "rag_search", "duration_ms": 234, "results_count": 15}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
('a0000000-0000-0000-0000-000000000000', 'feature_used', '{"feature": "code_execution", "duration_ms": 3456, "language": "python"}'::jsonb, 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours'),
('b0000000-0000-0000-0000-000000000000', 'feature_used', '{"feature": "email_sending", "recipients_count": 5, "template": "welcome_email"}'::jsonb, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 hours'),

-- Logout events
('c0000000-0000-0000-0000-000000000000', 'user_logout', '{"session_duration_minutes": 45, "actions_performed": 23}'::jsonb, 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes'),
('d0000000-0000-0000-0000-000000000000', 'user_logout', '{"session_duration_minutes": 120, "actions_performed": 67}'::jsonb, 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 minutes'),
('e0000000-0000-0000-0000-000000000000', 'user_logout', '{"session_duration_minutes": 30, "actions_performed": 12}'::jsonb, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 minutes');

-- ====================================================================
-- 5. ONBOARDING_FLOWS - 3 flows
-- ====================================================================

INSERT INTO tb_onboarding_flows (
    id_flow,
    nm_flow,
    ds_flow,
    nm_target_type,
    nr_order,
    bl_ativo,
    ds_steps,
    ds_config,
    dt_criacao
) VALUES
-- Flow 1: First Agent Setup
(
    '11111111-1111-1111-1111-111111111111',
    'Primeiro Agente',
    'Fluxo de onboarding para criar o primeiro agente de IA',
    'new_users',
    1,
    true,
    '[
        {"id": "welcome", "title": "Bem-vindo ao InovaIA!", "description": "Vamos configurar seu primeiro agente de IA em poucos passos.", "type": "intro"},
        {"id": "agent_name", "title": "Nome do Agente", "description": "Como você quer chamar seu agente?", "type": "input", "required": true},
        {"id": "agent_purpose", "title": "Finalidade", "description": "Para que você vai usar este agente?", "type": "select", "options": ["Atendimento", "Vendas", "Suporte", "Análise de Dados", "Outro"]},
        {"id": "model_selection", "title": "Escolha o Modelo", "description": "Qual modelo de IA você quer usar?", "type": "select", "options": ["GPT-4 (Recomendado)", "GPT-3.5 Turbo (Mais rápido)", "Claude 3"]},
        {"id": "tools_setup", "title": "Ferramentas", "description": "Selecione as ferramentas que seu agente pode usar", "type": "multi_select", "options": ["Busca Web", "Análise de Documentos", "Envio de Email", "Consulta a Banco de Dados"]},
        {"id": "completion", "title": "Pronto!", "description": "Seu agente foi criado com sucesso. Que tal testá-lo agora?", "type": "completion", "action_button": "Testar Agente"}
    ]'::jsonb,
    '{"show_skip": true, "auto_save": true, "completion_reward": "badge_first_agent"}'::jsonb,
    NOW() - INTERVAL '90 days'
),

-- Flow 2: Document Store Setup
(
    '22222222-2222-2222-2222-222222222222',
    'Biblioteca de Documentos',
    'Configure sua primeira biblioteca de documentos para RAG',
    'users_with_agents',
    2,
    true,
    '[
        {"id": "intro_rag", "title": "O que é RAG?", "description": "RAG (Retrieval-Augmented Generation) permite que seu agente busque informações em seus documentos.", "type": "info"},
        {"id": "create_store", "title": "Nome da Biblioteca", "description": "Como você quer chamar sua biblioteca de documentos?", "type": "input", "required": true},
        {"id": "upload_docs", "title": "Upload de Documentos", "description": "Faça upload dos primeiros documentos", "type": "file_upload", "accept": ".pdf,.docx,.txt", "max_size_mb": 10},
        {"id": "embedding_config", "title": "Configuração de Embeddings", "description": "Configure como os documentos serão processados", "type": "advanced_config", "show_advanced": false},
        {"id": "connect_agent", "title": "Conectar ao Agente", "description": "Qual agente terá acesso a esta biblioteca?", "type": "select_agent"},
        {"id": "test_search", "title": "Teste de Busca", "description": "Faça uma busca de teste em seus documentos", "type": "search_test"},
        {"id": "completion", "title": "Biblioteca Criada!", "description": "Seu agente agora pode buscar informações nos seus documentos.", "type": "completion"}
    ]'::jsonb,
    '{"show_skip": false, "required_for_plan": "professional", "video_tutorial_url": "https://docs.inovaia.com/videos/rag-setup"}'::jsonb,
    NOW() - INTERVAL '60 days'
),

-- Flow 3: Team Collaboration
(
    '33333333-3333-3333-3333-333333333333',
    'Colaboração em Equipe',
    'Convide membros da equipe e configure permissões',
    'enterprise_users',
    3,
    true,
    '[
        {"id": "team_intro", "title": "Trabalhe em Equipe", "description": "Convide colegas e gerencie acessos aos agentes", "type": "intro"},
        {"id": "invite_members", "title": "Convidar Membros", "description": "Digite os emails dos membros da equipe", "type": "email_list", "placeholder": "email@empresa.com"},
        {"id": "set_roles", "title": "Definir Perfis", "description": "Defina o nível de acesso de cada membro", "type": "role_assignment", "roles": ["Admin", "Editor", "Visualizador"]},
        {"id": "share_agents", "title": "Compartilhar Agentes", "description": "Escolha quais agentes serão compartilhados com a equipe", "type": "multi_select_agents"},
        {"id": "notifications", "title": "Notificações", "description": "Configure como a equipe será notificada", "type": "checkbox_list", "options": ["Email", "Slack", "Teams"]},
        {"id": "completion", "title": "Equipe Configurada!", "description": "Convites foram enviados para os membros da equipe.", "type": "completion"}
    ]'::jsonb,
    '{"required_plan": "enterprise", "show_skip": true, "slack_integration": true}'::jsonb,
    NOW() - INTERVAL '30 days'
);

-- ====================================================================
-- 6. USER_ONBOARDING_PROGRESS - 15 records
-- ====================================================================

INSERT INTO tb_user_onboarding_progress (
    id_progress,
    id_user,
    id_flow,
    nm_current_step,
    nr_step_index,
    bl_completo,
    ds_step_data,
    dt_inicio,
    dt_ultima_atualizacao,
    dt_conclusao
) VALUES
-- Flow 1 completions
('11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'completion', 5, true, '{"agent_name": "Assistente Patricia", "model": "gpt-4", "tools": ["WebSearch", "EmailSender"]}'::jsonb, NOW() - INTERVAL '89 days', NOW() - INTERVAL '89 days', NOW() - INTERVAL '89 days'),
('22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completion', 5, true, '{"agent_name": "Vendas Bot", "model": "gpt-3.5-turbo", "tools": ["DatabaseQuery"]}'::jsonb, NOW() - INTERVAL '78 days', NOW() - INTERVAL '78 days', NOW() - INTERVAL '78 days'),
('33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completion', 5, true, '{"agent_name": "Suporte Fernanda", "model": "gpt-4", "tools": ["WebSearch", "DocumentAnalyzer"]}'::jsonb, NOW() - INTERVAL '65 days', NOW() - INTERVAL '65 days', NOW() - INTERVAL '65 days'),

-- Flow 1 in progress
('44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'model_selection', 3, false, '{"agent_name": "Meu Agente", "agent_purpose": "Atendimento"}'::jsonb, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL),
('55555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'agent_name', 1, false, '{}'::jsonb, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', NULL),

-- Flow 2 completions
('66666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'completion', 6, true, '{"store_name": "Documentos Empresa", "documents_uploaded": 15, "agent_connected": "Assistente Patricia"}'::jsonb, NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),
('77777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completion', 6, true, '{"store_name": "Base Conhecimento", "documents_uploaded": 23, "agent_connected": "Suporte Fernanda"}'::jsonb, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),

-- Flow 2 in progress
('88888888-8888-8888-8888-888888888888', 'b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'upload_docs', 2, false, '{"store_name": "Meus Documentos"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NULL),
('99999999-9999-9999-9999-999999999999', 'b6666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'connect_agent', 4, false, '{"store_name": "Biblioteca Lucas", "documents_uploaded": 8}'::jsonb, NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days', NULL),

-- Flow 3 (Enterprise) completion
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', '33333333-3333-3333-3333-333333333333', 'completion', 5, true, '{"team_members": 5, "shared_agents": 3, "notifications": ["Email", "Slack"]}'::jsonb, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),

-- Flow 3 in progress
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'set_roles', 2, false, '{"invited_emails": ["colega1@empresa.com", "colega2@empresa.com"]}'::jsonb, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', NULL),

-- More varied progress states
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'welcome', 0, false, '{}'::jsonb, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NULL),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'b5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'intro_rag', 0, false, '{}'::jsonb, NOW() - INTERVAL '24 hours', NOW() - INTERVAL '24 hours', NULL),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'b6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'tools_setup', 4, false, '{"agent_name": "Agente Lucas", "model": "gpt-4", "agent_purpose": "Análise de Dados"}'::jsonb, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '6 hours', NULL),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'invite_members', 1, false, '{}'::jsonb, NOW() - INTERVAL '48 hours', NOW() - INTERVAL '36 hours', NULL);

-- ====================================================================
-- END OF FINAL SEED SCRIPT
-- ====================================================================
