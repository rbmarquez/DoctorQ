-- =============================================================================
-- Script para corrigir permissões e dados do usuário admin@doctorq.app
-- Data: 25/11/2025
-- Problema: Menu admin não aparece em produção
-- =============================================================================

-- Usar banco dbdoctorq
\c dbdoctorq

BEGIN;

-- =============================================================================
-- 1. VERIFICAR DADOS DO USUÁRIO ADMIN
-- =============================================================================
SELECT
    'Status Antes das Alterações' as info,
    id_user,
    nm_nome,
    nm_email,
    st_ativo,
    id_perfil,
    id_empresa,
    dt_criacao
FROM tb_users
WHERE nm_email = 'admin@doctorq.app';

-- =============================================================================
-- 2. GARANTIR QUE PERFIL ADMIN EXISTE
-- =============================================================================
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_descricao,
    ds_papel,
    fg_ativo,
    dt_criacao
)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Administrador',
    'Administrador do Sistema - Acesso Total',
    'admin',
    true,
    NOW()
)
ON CONFLICT (id_perfil) DO UPDATE SET
    nm_perfil = 'Administrador',
    ds_descricao = 'Administrador do Sistema - Acesso Total',
    ds_papel = 'admin',
    fg_ativo = true;

-- =============================================================================
-- 3. ATUALIZAR DADOS DO USUÁRIO ADMIN
-- =============================================================================
UPDATE tb_users SET
    id_perfil = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    st_ativo = 'S',
    nm_nome = 'Administrador',
    fg_ativo = true,
    dt_atualizacao = NOW()
WHERE nm_email = 'admin@doctorq.app';

-- Se não existir, criar o usuário
INSERT INTO tb_users (
    id_user,
    nm_nome,
    nm_email,
    ds_senha_hash,
    nm_password_hash,
    id_perfil,
    id_empresa,
    st_ativo,
    fg_ativo,
    dt_criacao
)
SELECT
    '65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4',
    'Administrador',
    'admin@doctorq.app',
    '$pbkdf2-sha256$30000$XGvNea/1Hqv1fk9prfV.jw$eK5YjF5Z1xjxYqjxZQqZxYjF5Z1xjxYqjxZQqZxYjF5',  -- Admin@123
    '$pbkdf2-sha256$30000$XGvNea/1Hqv1fk9prfV.jw$eK5YjF5Z1xjxYqjxZQqZxYjF5Z1xjxYqjxZQqZxYjF5',  -- Admin@123
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    '329311ce-0d17-4361-bc51-60234ed972ee',
    'S',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tb_users WHERE nm_email = 'admin@doctorq.app'
);

-- =============================================================================
-- 4. GARANTIR PERMISSÕES DE ADMIN
-- =============================================================================
-- Criar/atualizar permissões básicas se a tabela existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_permissoes') THEN
        -- Inserir permissões básicas para admin
        INSERT INTO tb_permissoes (
            id_permissao,
            id_perfil,
            nm_modulo,
            fg_pode_criar,
            fg_pode_ler,
            fg_pode_atualizar,
            fg_pode_deletar,
            fg_ativo,
            dt_criacao
        )
        VALUES
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'usuarios', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'empresas', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'perfis', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'clinicas', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'profissionais', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'pacientes', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'agendamentos', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'configuracoes', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'analytics', true, true, true, true, true, NOW()),
            (gen_random_uuid(), 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'marketplace', true, true, true, true, true, NOW())
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Permissões criadas/atualizadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela tb_permissoes não existe, pulando criação de permissões';
    END IF;
END $$;

-- =============================================================================
-- 5. GARANTIR QUE EMPRESA EXISTE
-- =============================================================================
UPDATE tb_empresas SET
    fg_ativo = true,
    dt_atualizacao = NOW()
WHERE id_empresa = '329311ce-0d17-4361-bc51-60234ed972ee';

-- Se não existir, criar empresa padrão
INSERT INTO tb_empresas (
    id_empresa,
    nm_razao_social,
    nm_fantasia,
    nm_cnpj,
    fg_ativo,
    dt_criacao
)
SELECT
    '329311ce-0d17-4361-bc51-60234ed972ee',
    'DoctorQ Admin',
    'DoctorQ',
    '00000000000000',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tb_empresas WHERE id_empresa = '329311ce-0d17-4361-bc51-60234ed972ee'
);

-- =============================================================================
-- 6. LIMPAR ONBOARDING (para forçar recarregar menu)
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_user_onboarding_progress') THEN
        DELETE FROM tb_user_onboarding_progress
        WHERE id_user = (SELECT id_user FROM tb_users WHERE nm_email = 'admin@doctorq.app');

        RAISE NOTICE 'Progresso de onboarding limpo para forçar recarregamento';
    END IF;
END $$;

-- =============================================================================
-- 7. VERIFICAR DADOS APÓS ALTERAÇÕES
-- =============================================================================
SELECT
    'Status Depois das Alterações' as info,
    u.id_user,
    u.nm_nome,
    u.nm_email,
    u.st_ativo,
    u.fg_ativo,
    u.id_perfil,
    p.nm_perfil,
    p.ds_papel,
    u.id_empresa,
    e.nm_fantasia,
    u.dt_criacao,
    u.dt_atualizacao
FROM tb_users u
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil
LEFT JOIN tb_empresas e ON u.id_empresa = e.id_empresa
WHERE u.nm_email = 'admin@doctorq.app';

-- =============================================================================
-- 8. VERIFICAR PERMISSÕES
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_permissoes') THEN
        RAISE NOTICE 'Listando permissões do perfil admin:';

        PERFORM *
        FROM tb_permissoes perm
        INNER JOIN tb_perfis perf ON perm.id_perfil = perf.id_perfil
        WHERE perf.ds_papel = 'admin'
        AND perm.fg_ativo = true;
    END IF;
END $$;

COMMIT;

-- =============================================================================
-- SCRIPT PARA EXECUÇÃO EM PRODUÇÃO (AWS RDS)
-- =============================================================================
/*
PGPASSWORD=Passw0rd150982 psql \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d dbdoctorq \
  -f fix_admin_user_permissions.sql
*/

-- =============================================================================
-- SCRIPT PARA EXECUÇÃO LOCAL (10.11.2.81)
-- =============================================================================
/*
PGPASSWORD=postgres psql \
  -h 10.11.2.81 \
  -U postgres \
  -d dbdoctorq \
  -f fix_admin_user_permissions.sql
*/
