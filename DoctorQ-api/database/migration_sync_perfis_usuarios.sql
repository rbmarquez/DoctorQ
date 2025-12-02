-- =====================================================
-- Migration: Sincronizar Perfis dos Usuários
-- Descrição: Pega os perfis únicos de tb_users.nm_papel
--            e insere na tabela tb_perfis, depois atualiza
--            o id_perfil dos usuários
-- =====================================================

-- =====================================================
-- 1. VERIFICAR PERFIS ÚNICOS EM TB_USERS
-- =====================================================

-- Lista de papéis únicos nos usuários (para referência)
-- SELECT DISTINCT nm_papel FROM tb_users WHERE nm_papel IS NOT NULL;

-- =====================================================
-- 2. INSERIR PERFIS QUE EXISTEM EM TB_USERS MAS NÃO EM TB_PERFIS
-- =====================================================

-- Criar perfis a partir dos papéis únicos dos usuários
INSERT INTO tb_perfis (nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, st_ativo, nr_ordem, ds_permissoes)
SELECT DISTINCT
    LOWER(u.nm_papel) as nm_perfil,
    INITCAP(REPLACE(u.nm_papel, '_', ' ')) as ds_perfil,
    'custom' as nm_tipo,
    CASE
        WHEN LOWER(u.nm_papel) IN ('admin', 'administrador', 'superadmin') THEN 'admin'
        WHEN LOWER(u.nm_papel) IN ('profissional', 'medico', 'esteticista', 'gestor_clinica', 'recepcionista') THEN 'parceiro'
        WHEN LOWER(u.nm_papel) IN ('fornecedor', 'vendedor', 'supplier') THEN 'fornecedor'
        ELSE 'parceiro'
    END as nm_tipo_acesso,
    'S' as st_ativo,
    100 as nr_ordem,
    '{"visualizar": true}'::jsonb as ds_permissoes
FROM tb_users u
WHERE u.nm_papel IS NOT NULL
  AND u.nm_papel != ''
  AND NOT EXISTS (
    SELECT 1 FROM tb_perfis p
    WHERE LOWER(p.nm_perfil) = LOWER(u.nm_papel)
  )
ON CONFLICT (nm_perfil) DO NOTHING;

-- =====================================================
-- 3. ATUALIZAR ID_PERFIL DOS USUÁRIOS
-- =====================================================

-- Atualiza usuários que tem nm_papel mas não tem id_perfil
UPDATE tb_users u
SET id_perfil = p.id_perfil
FROM tb_perfis p
WHERE LOWER(p.nm_perfil) = LOWER(u.nm_papel)
  AND u.id_perfil IS NULL
  AND u.nm_papel IS NOT NULL;

-- =====================================================
-- 4. ATUALIZAR USUÁRIOS COM PAPEL 'admin' PARA PERFIL ADMINISTRADOR
-- =====================================================

UPDATE tb_users u
SET id_perfil = p.id_perfil
FROM tb_perfis p
WHERE LOWER(p.nm_perfil) = 'administrador'
  AND LOWER(u.nm_papel) IN ('admin', 'superadmin')
  AND (u.id_perfil IS NULL OR u.id_perfil != p.id_perfil);

-- =====================================================
-- 5. MAPEAR PERFIS PADRÃO
-- =====================================================

-- Mapear 'profissional' para perfil 'profissional'
UPDATE tb_users u
SET id_perfil = p.id_perfil
FROM tb_perfis p
WHERE LOWER(p.nm_perfil) = 'profissional'
  AND LOWER(u.nm_papel) IN ('profissional', 'medico', 'esteticista', 'doctor')
  AND u.id_perfil IS NULL;

-- Mapear 'gestor_clinica' para perfil existente ou criar
UPDATE tb_users u
SET id_perfil = p.id_perfil
FROM tb_perfis p
WHERE LOWER(p.nm_perfil) = 'gestor_clinica'
  AND LOWER(u.nm_papel) IN ('gestor_clinica', 'gestor', 'manager')
  AND u.id_perfil IS NULL;

-- Mapear 'recepcionista' para perfil existente
UPDATE tb_users u
SET id_perfil = p.id_perfil
FROM tb_perfis p
WHERE LOWER(p.nm_perfil) = 'recepcionista'
  AND LOWER(u.nm_papel) IN ('recepcionista', 'receptionist', 'atendente')
  AND u.id_perfil IS NULL;

-- Mapear 'paciente' para perfil existente
UPDATE tb_users u
SET id_perfil = p.id_perfil
FROM tb_perfis p
WHERE LOWER(p.nm_perfil) = 'paciente'
  AND LOWER(u.nm_papel) IN ('paciente', 'cliente', 'patient', 'customer')
  AND u.id_perfil IS NULL;

-- =====================================================
-- 6. ATRIBUIR PERFIL PADRÃO PARA USUÁRIOS SEM PERFIL
-- =====================================================

-- Usuários sem perfil definido recebem o perfil 'paciente' (mais restritivo)
UPDATE tb_users u
SET id_perfil = (SELECT id_perfil FROM tb_perfis WHERE LOWER(nm_perfil) = 'paciente' LIMIT 1)
WHERE u.id_perfil IS NULL;

-- =====================================================
-- 7. RELATÓRIO FINAL
-- =====================================================

-- Exibir contagem de usuários por perfil
SELECT
    COALESCE(p.nm_perfil, 'SEM PERFIL') as perfil,
    p.nm_tipo_acesso as tipo_acesso,
    COUNT(u.id_user) as total_usuarios
FROM tb_users u
LEFT JOIN tb_perfis p ON p.id_perfil = u.id_perfil
GROUP BY p.nm_perfil, p.nm_tipo_acesso
ORDER BY total_usuarios DESC;

-- Exibir todos os perfis criados
SELECT
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo,
    nm_tipo_acesso,
    st_ativo,
    nr_ordem,
    (SELECT COUNT(*) FROM tb_users WHERE id_perfil = tb_perfis.id_perfil) as nr_usuarios
FROM tb_perfis
ORDER BY nr_ordem, nm_perfil;
