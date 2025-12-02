-- =============================================================================
-- Script para corrigir problemas em produção - DoctorQ
-- Data: 25/11/2025
-- =============================================================================
-- Problemas identificados nos logs:
-- 1. Perfil admin com ID incorreto (9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7)
-- 2. Colunas faltando em tb_campanhas (nr_enviados_hoje, dt_ultimo_reset_diario)
-- =============================================================================

\c dbdoctorq

BEGIN;

-- =============================================================================
-- 1. ATUALIZAR PERFIL ADMIN COM ID CORRETO
-- =============================================================================
SELECT 'Verificando perfil atual do admin...' as info;

SELECT
    u.nm_email,
    u.id_perfil,
    p.nm_perfil,
    p.nm_papel
FROM tb_users u
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil
WHERE u.nm_email = 'admin@doctorq.app';

-- Atualizar perfil existente com nm_papel='admin'
UPDATE tb_perfis SET
    nm_perfil = 'Administrador',
    ds_descricao = 'Administrador do Sistema - Acesso Total',
    nm_papel = 'admin',
    fg_ativo = true,
    dt_atualizacao = NOW()
WHERE id_perfil = '9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7';

-- Se não existir, criar o perfil
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_descricao,
    nm_papel,
    fg_ativo,
    dt_criacao
)
SELECT
    '9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7',
    'Administrador',
    'Administrador do Sistema - Acesso Total',
    'admin',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tb_perfis WHERE id_perfil = '9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7'
);

-- Garantir que usuário admin está com perfil correto
UPDATE tb_users SET
    id_perfil = '9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7',
    st_ativo = 'S',
    fg_ativo = true,
    dt_atualizacao = NOW()
WHERE nm_email = 'admin@doctorq.app';

SELECT 'Perfil admin atualizado!' as resultado;

-- =============================================================================
-- 2. ADICIONAR COLUNAS FALTANDO EM tb_campanhas
-- =============================================================================
SELECT 'Adicionando colunas faltando em tb_campanhas...' as info;

-- Adicionar nr_enviados_hoje
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_campanhas'
        AND column_name = 'nr_enviados_hoje'
    ) THEN
        ALTER TABLE tb_campanhas
        ADD COLUMN nr_enviados_hoje INTEGER DEFAULT 0 NOT NULL;

        RAISE NOTICE 'Coluna nr_enviados_hoje adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna nr_enviados_hoje já existe';
    END IF;
END $$;

-- Adicionar dt_ultimo_reset_diario
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_campanhas'
        AND column_name = 'dt_ultimo_reset_diario'
    ) THEN
        ALTER TABLE tb_campanhas
        ADD COLUMN dt_ultimo_reset_diario TIMESTAMP NULL;

        RAISE NOTICE 'Coluna dt_ultimo_reset_diario adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna dt_ultimo_reset_diario já existe';
    END IF;
END $$;

SELECT 'Colunas adicionadas em tb_campanhas!' as resultado;

-- =============================================================================
-- 3. VERIFICAR RESULTADOS
-- =============================================================================
SELECT '======================================' as info;
SELECT 'Verificando perfil após atualização:' as info;
SELECT '======================================' as info;

SELECT
    u.nm_email,
    u.st_ativo,
    u.fg_ativo,
    u.id_perfil,
    p.nm_perfil,
    p.nm_papel as role
FROM tb_users u
JOIN tb_perfis p ON u.id_perfil = p.id_perfil
WHERE u.nm_email = 'admin@doctorq.app';

SELECT '======================================' as info;
SELECT 'Verificando colunas de tb_campanhas:' as info;
SELECT '======================================' as info;

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tb_campanhas'
AND column_name IN ('nr_enviados_hoje', 'dt_ultimo_reset_diario', 'nr_limite_diario')
ORDER BY column_name;

COMMIT;

SELECT '✅ Script concluído com sucesso!' as resultado;

-- =============================================================================
-- INSTRUÇÕES DE USO:
-- =============================================================================

-- Em Produção (AWS RDS):
/*
PGPASSWORD=Passw0rd150982 psql \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d dbdoctorq \
  -f fix_production_issues.sql
*/

-- Local (10.11.2.81):
/*
PGPASSWORD=postgres psql \
  -h 10.11.2.81 \
  -U postgres \
  -d dbdoctorq \
  -f fix_production_issues.sql
*/
