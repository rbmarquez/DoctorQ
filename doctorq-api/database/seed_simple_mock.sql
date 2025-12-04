-- ====================================================================
-- SEED SIMPLES DE DADOS MOCK - DoctorQ
-- ====================================================================
-- Popula apenas tabelas críticas com estruturas validadas
-- Data: 2025-10-27
-- ====================================================================

BEGIN;

-- ====================================================================
-- 1. API KEYS (5 chaves)
-- ====================================================================
DO $$
DECLARE
    empresa_id uuid;
    user_id uuid;
BEGIN
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;
    SELECT id_user INTO user_id FROM tb_users WHERE st_ativo = 'S' LIMIT 1;

    IF empresa_id IS NOT NULL AND user_id IS NOT NULL THEN
        RAISE NOTICE 'Inserindo API Keys...';

        INSERT INTO tb_api_keys (id_api_key, id_empresa, id_user, nm_api_key, nm_descricao, st_ativo, dt_expiracao)
        VALUES
        (gen_random_uuid(), empresa_id, user_id,
         'pk_prod_' || substring(md5(random()::text) from 1 for 32),
         'API Key de Produção', true, NOW() + INTERVAL '1 year'),

        (gen_random_uuid(), empresa_id, user_id,
         'pk_dev_' || substring(md5(random()::text) from 1 for 32),
         'API Key de Desenvolvimento', true, NOW() + INTERVAL '6 months'),

        (gen_random_uuid(), empresa_id, user_id,
         'pk_test_' || substring(md5(random()::text) from 1 for 32),
         'API Key de Teste', true, NOW() + INTERVAL '3 months'),

        (gen_random_uuid(), empresa_id, user_id,
         'pk_mobile_' || substring(md5(random()::text) from 1 for 32),
         'API Key Mobile App', true, NOW() + INTERVAL '1 year'),

        (gen_random_uuid(), empresa_id, user_id,
         'pk_partner_' || substring(md5(random()::text) from 1 for 32),
         'API Key Parceiro', true, NOW() + INTERVAL '2 years');

        RAISE NOTICE '5 API Keys inseridas com sucesso!';
    ELSE
        RAISE NOTICE 'Não foi possível encontrar empresa ou usuário ativo';
    END IF;
END $$;

-- ====================================================================
-- 2. FAVORITOS (30 favoritos de produtos/procedimentos)
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    produto_id uuid;
    procedimento_id uuid;
    counter integer := 0;
BEGIN
    RAISE NOTICE 'Inserindo Favoritos...';

    FOR user_id IN (SELECT id_user FROM tb_users WHERE st_ativo = 'S' LIMIT 30) LOOP
        -- Favorito de produto
        SELECT id_produto INTO produto_id FROM tb_produtos WHERE st_ativo = true ORDER BY random() LIMIT 1;
        IF produto_id IS NOT NULL THEN
            INSERT INTO tb_favoritos (id_user, id_produto, ds_tipo_item)
            VALUES (user_id, produto_id, 'produto')
            ON CONFLICT (id_user, id_produto) DO NOTHING;
            counter := counter + 1;
        END IF;

        -- Favorito de procedimento
        SELECT id_procedimento INTO procedimento_id FROM tb_procedimentos ORDER BY random() LIMIT 1;
        IF procedimento_id IS NOT NULL AND random() > 0.5 THEN
            BEGIN
                INSERT INTO tb_favoritos (id_user, id_procedimento, ds_tipo_item)
                VALUES (user_id, procedimento_id, 'procedimento');
                counter := counter + 1;
            EXCEPTION WHEN unique_violation THEN
                NULL; -- Ignora se já existe
            END;
        END IF;
    END LOOP;

    RAISE NOTICE '% favoritos inseridos com sucesso!', counter;
END $$;

-- ====================================================================
-- 3. DISPOSITIVOS (50 dispositivos para push notifications)
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    plataformas text[] := ARRAY['ios', 'android', 'web'];
    modelos text[] := ARRAY['iPhone 14', 'iPhone 13', 'Samsung Galaxy S23', 'Samsung Galaxy A54', 'Xiaomi Redmi Note 12', 'Chrome Desktop', 'Firefox Desktop'];
    counter integer := 0;
BEGIN
    RAISE NOTICE 'Inserindo Dispositivos...';

    FOR user_id IN (SELECT id_user FROM tb_users WHERE st_ativo = 'S' ORDER BY random() LIMIT 50) LOOP
        INSERT INTO tb_dispositivos (
            id_dispositivo, id_user, ds_token_push, ds_plataforma, nm_modelo, st_ativo
        )
        VALUES (
            gen_random_uuid(), user_id,
            'push_token_' || substring(md5(random()::text) from 1 for 40),
            plataformas[floor(random() * array_length(plataformas, 1) + 1)],
            modelos[floor(random() * array_length(modelos, 1) + 1)],
            true
        );
        counter := counter + 1;
    END LOOP;

    RAISE NOTICE '% dispositivos inseridos com sucesso!', counter;
END $$;

COMMIT;

-- ====================================================================
-- VERIFICAÇÃO
-- ====================================================================
SELECT 'tb_api_keys' as tabela, COUNT(*) as registros FROM tb_api_keys
UNION ALL
SELECT 'tb_favoritos', COUNT(*) FROM tb_favoritos
UNION ALL
SELECT 'tb_dispositivos', COUNT(*) FROM tb_dispositivos;
