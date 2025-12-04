-- Migration: Add two-level permission control system
-- Date: 2025-11-05
-- Description: Add group-level and feature-level permission control to tb_perfis

BEGIN;

-- ====================================
-- STEP 1: Add new columns to tb_perfis
-- ====================================

-- Array of groups the profile can access (/admin, /paciente, /clinica, /profissional, /fornecedor)
ALTER TABLE tb_perfis
  ADD COLUMN IF NOT EXISTS ds_grupos_acesso TEXT[] DEFAULT '{}' NOT NULL;

-- JSONB structure for feature-level permissions within each group
-- Example structure:
-- {
--   "admin": {
--     "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
--     "empresas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
--     "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true}
--   },
--   "clinica": {
--     "agenda": {"criar": true, "editar": true, "visualizar": true},
--     "pacientes": {"criar": true, "editar": false, "visualizar": true},
--     "procedimentos": {"visualizar": true}
--   },
--   "profissional": {
--     "agenda": {"visualizar": true},
--     "relatorios": {"visualizar": true},
--     "procedimentos": {"visualizar": true}
--   }
-- }
ALTER TABLE tb_perfis
  ADD COLUMN IF NOT EXISTS ds_permissoes_detalhadas JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Field to indicate if this is a template profile (can be cloned)
ALTER TABLE tb_perfis
  ADD COLUMN IF NOT EXISTS fg_template BOOLEAN DEFAULT false NOT NULL;

-- ====================================
-- STEP 2: Create indexes for performance
-- ====================================

CREATE INDEX IF NOT EXISTS idx_perfis_grupos_acesso ON tb_perfis USING gin(ds_grupos_acesso);
CREATE INDEX IF NOT EXISTS idx_perfis_permissoes_detalhadas ON tb_perfis USING gin(ds_permissoes_detalhadas);
CREATE INDEX IF NOT EXISTS idx_perfis_template ON tb_perfis(fg_template);

-- ====================================
-- STEP 3: Seed default permission templates
-- ====================================

-- Template: Administrador Total (acesso a tudo)
UPDATE tb_perfis
SET
  ds_grupos_acesso = ARRAY['admin', 'clinica', 'paciente', 'profissional', 'fornecedor'],
  ds_permissoes_detalhadas = '{
    "admin": {
      "dashboard": {"visualizar": true},
      "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "empresas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "agentes": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "conversas": {"visualizar": true, "excluir": true},
      "analytics": {"visualizar": true},
      "configuracoes": {"editar": true, "visualizar": true},
      "tools": {"visualizar": true, "executar": true}
    },
    "clinica": {
      "dashboard": {"visualizar": true},
      "agenda": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "pacientes": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "profissionais": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "procedimentos": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "financeiro": {"criar": true, "editar": true, "visualizar": true},
      "relatorios": {"visualizar": true, "exportar": true},
      "configuracoes": {"editar": true, "visualizar": true},
      "equipe": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true}
    }
  }'::jsonb,
  fg_template = true
WHERE nm_perfil = 'admin' AND nm_tipo = 'system';

-- Template: Gestor de Clínica (acesso operacional completo na clínica)
UPDATE tb_perfis
SET
  ds_grupos_acesso = ARRAY['clinica'],
  ds_permissoes_detalhadas = '{
    "clinica": {
      "dashboard": {"visualizar": true},
      "agenda": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "pacientes": {"criar": true, "editar": true, "visualizar": true},
      "profissionais": {"visualizar": true},
      "procedimentos": {"criar": true, "editar": true, "visualizar": true},
      "financeiro": {"visualizar": true},
      "relatorios": {"visualizar": true, "exportar": true},
      "equipe": {"criar": true, "editar": true, "visualizar": true},
      "configuracoes": {"visualizar": true}
    }
  }'::jsonb,
  fg_template = true
WHERE nm_perfil = 'gestor_clinica' AND nm_tipo = 'system';

-- Template: Profissional (acesso limitado a agenda e procedimentos)
UPDATE tb_perfis
SET
  ds_grupos_acesso = ARRAY['profissional'],
  ds_permissoes_detalhadas = '{
    "profissional": {
      "dashboard": {"visualizar": true},
      "agenda": {"visualizar": true, "editar": true},
      "relatorios": {"visualizar": true},
      "procedimentos": {"visualizar": true},
      "pacientes": {"visualizar": true}
    }
  }'::jsonb,
  fg_template = true
WHERE nm_perfil = 'profissional' AND nm_tipo = 'system';

-- Template: Recepcionista/Secretária (acesso a agenda e pacientes)
UPDATE tb_perfis
SET
  ds_grupos_acesso = ARRAY['clinica'],
  ds_permissoes_detalhadas = '{
    "clinica": {
      "dashboard": {"visualizar": true},
      "agenda": {"criar": true, "editar": true, "visualizar": true},
      "pacientes": {"criar": true, "editar": true, "visualizar": true},
      "procedimentos": {"visualizar": true}
    }
  }'::jsonb,
  fg_template = true
WHERE nm_perfil = 'recepcionista' AND nm_tipo = 'system';

-- Template: Paciente (acesso apenas ao portal do paciente)
UPDATE tb_perfis
SET
  ds_grupos_acesso = ARRAY['paciente'],
  ds_permissoes_detalhadas = '{
    "paciente": {
      "dashboard": {"visualizar": true},
      "agendamentos": {"criar": true, "visualizar": true, "cancelar": true},
      "avaliacoes": {"criar": true, "editar": true, "visualizar": true},
      "financeiro": {"visualizar": true},
      "fotos": {"visualizar": true},
      "mensagens": {"visualizar": true, "enviar": true},
      "favoritos": {"criar": true, "excluir": true, "visualizar": true},
      "pedidos": {"criar": true, "visualizar": true},
      "perfil": {"editar": true, "visualizar": true}
    }
  }'::jsonb,
  fg_template = true
WHERE nm_perfil = 'paciente' AND nm_tipo = 'system';

-- ====================================
-- STEP 4: Create helper function to check permissions
-- ====================================

-- Function to check if a profile has access to a group
CREATE OR REPLACE FUNCTION perfil_tem_acesso_grupo(
  p_id_perfil UUID,
  p_grupo TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_grupos_acesso TEXT[];
BEGIN
  SELECT ds_grupos_acesso INTO v_grupos_acesso
  FROM tb_perfis
  WHERE id_perfil = p_id_perfil AND st_ativo = 'S';

  RETURN p_grupo = ANY(v_grupos_acesso);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a profile has a specific permission
CREATE OR REPLACE FUNCTION perfil_tem_permissao(
  p_id_perfil UUID,
  p_grupo TEXT,
  p_recurso TEXT,
  p_acao TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissoes JSONB;
  v_tem_permissao BOOLEAN;
BEGIN
  SELECT ds_permissoes_detalhadas INTO v_permissoes
  FROM tb_perfis
  WHERE id_perfil = p_id_perfil AND st_ativo = 'S';

  -- Check if the permission exists and is true
  v_tem_permissao := COALESCE(
    (v_permissoes -> p_grupo -> p_recurso ->> p_acao)::BOOLEAN,
    false
  );

  RETURN v_tem_permissao;
END;
$$ LANGUAGE plpgsql STABLE;

-- ====================================
-- STEP 5: Create view for user permissions
-- ====================================

CREATE OR REPLACE VIEW vw_usuarios_permissoes AS
SELECT
  u.id_user,
  u.nm_email,
  u.nm_completo,
  u.nm_papel,
  u.id_empresa,
  u.id_perfil,
  p.nm_perfil,
  p.ds_grupos_acesso,
  p.ds_permissoes_detalhadas,
  p.fg_template,
  -- Helper columns
  CASE
    WHEN 'admin' = ANY(p.ds_grupos_acesso) THEN true
    ELSE false
  END AS fg_acesso_admin,
  CASE
    WHEN 'clinica' = ANY(p.ds_grupos_acesso) THEN true
    ELSE false
  END AS fg_acesso_clinica,
  CASE
    WHEN 'profissional' = ANY(p.ds_grupos_acesso) THEN true
    ELSE false
  END AS fg_acesso_profissional,
  CASE
    WHEN 'paciente' = ANY(p.ds_grupos_acesso) THEN true
    ELSE false
  END AS fg_acesso_paciente,
  CASE
    WHEN 'fornecedor' = ANY(p.ds_grupos_acesso) THEN true
    ELSE false
  END AS fg_acesso_fornecedor
FROM tb_users u
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil
WHERE u.st_ativo = 'S' AND (p.st_ativo = 'S' OR p.st_ativo IS NULL);

COMMENT ON VIEW vw_usuarios_permissoes IS 'View with user permissions for easy access control validation';

-- ====================================
-- STEP 6: Add comments for documentation
-- ====================================

COMMENT ON COLUMN tb_perfis.ds_grupos_acesso IS 'Array of groups the profile can access: admin, clinica, profissional, paciente, fornecedor';
COMMENT ON COLUMN tb_perfis.ds_permissoes_detalhadas IS 'JSONB with detailed permissions for each group and resource';
COMMENT ON COLUMN tb_perfis.fg_template IS 'Indicates if this is a template profile that can be cloned';

COMMIT;

-- ====================================
-- Verification queries (optional)
-- ====================================

-- Check perfis with their groups
-- SELECT id_perfil, nm_perfil, ds_grupos_acesso, fg_template FROM tb_perfis;

-- Check detailed permissions
-- SELECT id_perfil, nm_perfil, ds_permissoes_detalhadas FROM tb_perfis WHERE nm_tipo = 'system';

-- Test permission functions
-- SELECT perfil_tem_acesso_grupo('22222222-2222-2222-2222-222222222221'::uuid, 'admin');
-- SELECT perfil_tem_permissao('22222222-2222-2222-2222-222222222221'::uuid, 'admin', 'usuarios', 'criar');
