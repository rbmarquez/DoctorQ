-- Migration 020: Corrigir constraint única de perfis para permitir multi-tenancy
-- Data: 2025-11-05
-- Descrição: A constraint UNIQUE(nm_perfil) estava impedindo que empresas diferentes
--            tivessem perfis com o mesmo nome. Agora usamos partial unique indexes:
--            1. Perfis de empresas: UNIQUE(nm_perfil, id_empresa) WHERE id_empresa IS NOT NULL
--            2. Perfis template: UNIQUE(nm_perfil) WHERE fg_template = true AND id_empresa IS NULL

-- ==========================================
-- 1. Remover constraint antiga (global)
-- ==========================================
ALTER TABLE tb_perfis DROP CONSTRAINT IF EXISTS tb_perfis_nm_perfil_key;
ALTER TABLE tb_perfis DROP CONSTRAINT IF EXISTS tb_perfis_nm_perfil_empresa_key;

-- ==========================================
-- 2. Criar partial unique indexes
-- ==========================================

-- Index 1: Garante que perfis de empresas tenham nome único por empresa
-- (permite que empresas diferentes tenham perfis com mesmo nome)
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfis_nm_perfil_empresa_unique
ON tb_perfis(nm_perfil, id_empresa)
WHERE id_empresa IS NOT NULL;

-- Index 2: Garante que perfis template tenham nome único
-- (evita duplicação de templates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfis_template_nm_unique
ON tb_perfis(nm_perfil)
WHERE fg_template = true AND id_empresa IS NULL;

-- ==========================================
-- 3. Comentários para documentação
-- ==========================================
COMMENT ON INDEX idx_perfis_nm_perfil_empresa_unique IS
'Garante unicidade de nome de perfil por empresa (multi-tenancy)';

COMMENT ON INDEX idx_perfis_template_nm_unique IS
'Garante unicidade de nome de perfil template (id_empresa NULL)';

-- ==========================================
-- 4. Verificação
-- ==========================================
-- Verificar constraints criadas:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'tb_perfis' AND indexname LIKE '%unique%';

-- Testar se permite perfis com mesmo nome em empresas diferentes:
-- SELECT nm_perfil, id_empresa, COUNT(*) FROM tb_perfis
-- WHERE id_empresa IS NOT NULL
-- GROUP BY nm_perfil, id_empresa
-- HAVING COUNT(*) > 1;
