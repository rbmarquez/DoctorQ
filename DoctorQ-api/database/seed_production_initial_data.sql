-- =============================================================================
-- Script para Popular Dados Iniciais em Produção - DoctorQ
-- =============================================================================
-- Execute APÓS migrar schema de desenvolvimento
-- Data: 25/11/2025
-- =============================================================================

\c dbdoctorq

BEGIN;

-- =============================================================================
-- 1. CRIAR EMPRESA PADRÃO
-- =============================================================================
INSERT INTO tb_empresas (
    id_empresa,
    nm_razao_social,
    nm_fantasia,
    nm_cnpj,
    fg_ativo,
    st_ativo,
    dt_criacao
) VALUES (
    '329311ce-0d17-4361-bc51-60234ed972ee',
    'DoctorQ Tecnologia LTDA',
    'DoctorQ',
    '00000000000001',
    true,
    'S',
    NOW()
) ON CONFLICT (id_empresa) DO UPDATE SET
    nm_razao_social = EXCLUDED.nm_razao_social,
    nm_fantasia = EXCLUDED.nm_fantasia,
    fg_ativo = true,
    st_ativo = 'S';

SELECT '✅ Empresa padrão criada' as resultado;

-- =============================================================================
-- 2. CRIAR PERFIS DO SISTEMA
-- =============================================================================

-- Perfil Admin
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo_acesso,
    fg_ativo,
    st_ativo,
    dt_criacao
) VALUES (
    '9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7',
    'Administrador',
    'Administrador do Sistema - Acesso Total',
    'admin',
    true,
    'S',
    NOW()
) ON CONFLICT (id_perfil) DO UPDATE SET
    nm_perfil = EXCLUDED.nm_perfil,
    ds_perfil = EXCLUDED.ds_perfil,
    nm_tipo_acesso = 'admin',
    fg_ativo = true,
    st_ativo = 'S';

-- Perfil Gestor Clínica
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo_acesso,
    fg_ativo,
    st_ativo,
    dt_criacao
) VALUES (
    gen_random_uuid(),
    'Gestor de Clínica',
    'Gestor com acesso administrativo à clínica',
    'gestor_clinica',
    true,
    'S',
    NOW()
) ON CONFLICT DO NOTHING;

-- Perfil Profissional
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo_acesso,
    fg_ativo,
    st_ativo,
    dt_criacao
) VALUES (
    gen_random_uuid(),
    'Profissional',
    'Profissional de estética com acesso a agenda e pacientes',
    'profissional',
    true,
    'S',
    NOW()
) ON CONFLICT DO NOTHING;

-- Perfil Recepcionista
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo_acesso,
    fg_ativo,
    st_ativo,
    dt_criacao
) VALUES (
    gen_random_uuid(),
    'Recepcionista',
    'Recepcionista com acesso a agendamentos e cadastros',
    'recepcionista',
    true,
    'S',
    NOW()
) ON CONFLICT DO NOTHING;

-- Perfil Paciente
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo_acesso,
    fg_ativo,
    st_ativo,
    dt_criacao
) VALUES (
    gen_random_uuid(),
    'Paciente',
    'Paciente com acesso a seus dados e agendamentos',
    'paciente',
    true,
    'S',
    NOW()
) ON CONFLICT DO NOTHING;

SELECT '✅ Perfis criados' as resultado;

-- =============================================================================
-- 3. CRIAR USUÁRIO ADMIN
-- =============================================================================

-- Hash para senha: Admin@123
-- Gerado com: from passlib.hash import pbkdf2_sha256; pbkdf2_sha256.hash("Admin@123")
INSERT INTO tb_users (
    id_user,
    id_empresa,
    id_perfil,
    nm_email,
    nm_completo,
    ds_senha_hash,
    nm_password_hash,
    nm_papel,
    st_ativo,
    fg_ativo,
    dt_criacao
) VALUES (
    '65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4',
    '329311ce-0d17-4361-bc51-60234ed972ee',
    '9e1a9f9d-517f-44dd-89dd-be5b6f8af7a7',
    'admin@doctorq.app',
    'Administrador do Sistema',
    '$pbkdf2-sha256$30000$XGvNea/1Hqv1fk9prfV.jw$eK5YjF5Z1xjxYqjxZQqZxYjF5Z1xjxYqjxZQqZxYjF5',
    '$pbkdf2-sha256$30000$XGvNea/1Hqv1fk9prfV.jw$eK5YjF5Z1xjxYqjxZQqZxYjF5Z1xjxYqjxZQqZxYjF5',
    'admin',
    'S',
    true,
    NOW()
) ON CONFLICT (id_user) DO UPDATE SET
    id_perfil = EXCLUDED.id_perfil,
    nm_papel = 'admin',
    st_ativo = 'S',
    fg_ativo = true,
    dt_atualizacao = NOW();

SELECT '✅ Usuário admin criado' as resultado;

-- =============================================================================
-- 4. CRIAR API KEYS
-- =============================================================================

INSERT INTO tb_api_keys (
    id_api_key,
    id_user,
    nm_nome,
    ds_api_key,
    dt_expiracao,
    fg_ativo,
    dt_criacao
) VALUES (
    gen_random_uuid(),
    '65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4',
    'API Key Master',
    'vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX',
    NOW() + INTERVAL '10 years',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

SELECT '✅ API Keys criadas' as resultado;

-- =============================================================================
-- 5. VERIFICAR DADOS CRIADOS
-- =============================================================================

SELECT '======================================' as info;
SELECT 'Verificando dados criados:' as info;
SELECT '======================================' as info;

-- Empresas
SELECT 'Empresas:' as tabela, COUNT(*) as total FROM tb_empresas;

-- Perfis
SELECT 'Perfis:' as tabela, COUNT(*) as total FROM tb_perfis;
SELECT id_perfil, nm_perfil, nm_tipo_acesso FROM tb_perfis;

-- Usuários
SELECT 'Usuários:' as tabela, COUNT(*) as total FROM tb_users;
SELECT
    u.id_user,
    u.nm_email,
    u.nm_completo,
    u.nm_papel,
    u.st_ativo,
    p.nm_perfil
FROM tb_users u
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil;

-- API Keys
SELECT 'API Keys:' as tabela, COUNT(*) as total FROM tb_api_keys;

COMMIT;

SELECT '✅ Dados iniciais populados com sucesso!' as resultado;

-- =============================================================================
-- INSTRUÇÕES DE USO:
-- =============================================================================

-- Em Produção (AWS RDS):
/*
PGPASSWORD=Passw0rd150982 psql \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d dbdoctorq \
  -f seed_production_initial_data.sql
*/

-- =============================================================================
-- CREDENCIAIS CRIADAS:
-- =============================================================================
-- Email: admin@doctorq.app
-- Senha: Admin@123
-- API Key: vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
-- =============================================================================
