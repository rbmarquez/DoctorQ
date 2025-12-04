-- Migration 019: Sistema de Perfis Hierárquicos
-- Adiciona suporte para perfis com hierarquia (perfil pai + sub-perfis)
-- Tipos de acesso: admin, parceiro, fornecedor

-- ==========================================
-- 1. Adicionar colunas para hierarquia
-- ==========================================

-- Tipo de acesso principal (Nível 1)
ALTER TABLE tb_perfis
ADD COLUMN IF NOT EXISTS nm_tipo_acesso VARCHAR(20);

-- Perfil pai (para sub-perfis - Nível 2)
ALTER TABLE tb_perfis
ADD COLUMN IF NOT EXISTS id_perfil_pai UUID;

-- Ordem de exibição
ALTER TABLE tb_perfis
ADD COLUMN IF NOT EXISTS nr_ordem INTEGER DEFAULT 0;

-- ==========================================
-- 2. Adicionar foreign key para perfil pai
-- ==========================================

ALTER TABLE tb_perfis
ADD CONSTRAINT tb_perfis_id_perfil_pai_fkey
FOREIGN KEY (id_perfil_pai) REFERENCES tb_perfis(id_perfil) ON DELETE CASCADE;

-- ==========================================
-- 3. Criar índices
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_perfis_tipo_acesso ON tb_perfis(nm_tipo_acesso);
CREATE INDEX IF NOT EXISTS idx_perfis_pai ON tb_perfis(id_perfil_pai);

-- ==========================================
-- 4. Comentários nas colunas
-- ==========================================

COMMENT ON COLUMN tb_perfis.nm_tipo_acesso IS 'Tipo de acesso principal: admin, parceiro, fornecedor';
COMMENT ON COLUMN tb_perfis.id_perfil_pai IS 'ID do perfil pai (NULL = perfil raiz)';
COMMENT ON COLUMN tb_perfis.nr_ordem IS 'Ordem de exibição no menu';

-- ==========================================
-- 5. Limpar perfis existentes
-- ==========================================

-- Remover perfis antigos (exceto os que já estão em uso)
DELETE FROM tb_perfis WHERE nm_perfil NOT IN (
  SELECT DISTINCT p.nm_perfil
  FROM tb_perfis p
  INNER JOIN tb_users u ON u.id_perfil = p.id_perfil
);

-- ==========================================
-- 6. CRIAR PERFIS PRINCIPAIS (Nível 1)
-- ==========================================

-- 6.1 ADMINISTRADOR (Controla plataforma e licenças)
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
VALUES (
  gen_random_uuid(),
  'administrador',
  'Administrador da Plataforma',
  'system',
  'admin',
  NULL,
  'S',
  1,
  '{
    "admin": true,
    "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "agentes": {"criar": true, "editar": true, "excluir": true, "visualizar": true, "executar": true},
    "conversas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "empresa": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "licencas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true}
  }'::jsonb
) ON CONFLICT (nm_perfil) DO UPDATE SET
  ds_perfil = EXCLUDED.ds_perfil,
  nm_tipo_acesso = EXCLUDED.nm_tipo_acesso,
  id_perfil_pai = EXCLUDED.id_perfil_pai,
  nr_ordem = EXCLUDED.nr_ordem,
  ds_permissoes = EXCLUDED.ds_permissoes;

-- 6.2 PARCEIRO (Clínicas e profissionais que prestam serviços)
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
VALUES (
  gen_random_uuid(),
  'parceiro',
  'Parceiro (Clínica/Profissional)',
  'system',
  'parceiro',
  NULL,
  'S',
  2,
  '{
    "admin": false,
    "agendamentos": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "pacientes": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "procedimentos": {"criar": true, "editar": true, "visualizar": true},
    "profissionais": {"criar": true, "editar": true, "visualizar": true},
    "financeiro": {"visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true}
  }'::jsonb
) ON CONFLICT (nm_perfil) DO UPDATE SET
  ds_perfil = EXCLUDED.ds_perfil,
  nm_tipo_acesso = EXCLUDED.nm_tipo_acesso,
  id_perfil_pai = EXCLUDED.id_perfil_pai,
  nr_ordem = EXCLUDED.nr_ordem,
  ds_permissoes = EXCLUDED.ds_permissoes;

-- 6.3 FORNECEDOR (Empresas que vendem produtos - propaganda + vendas)
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
VALUES (
  gen_random_uuid(),
  'fornecedor',
  'Fornecedor (Produtos/Serviços)',
  'system',
  'fornecedor',
  NULL,
  'S',
  3,
  '{
    "admin": false,
    "produtos": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "pedidos": {"visualizar": true},
    "marketplace": {"criar": true, "editar": true, "visualizar": true},
    "campanhas": {"criar": true, "editar": true, "visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true}
  }'::jsonb
) ON CONFLICT (nm_perfil) DO UPDATE SET
  ds_perfil = EXCLUDED.ds_perfil,
  nm_tipo_acesso = EXCLUDED.nm_tipo_acesso,
  id_perfil_pai = EXCLUDED.id_perfil_pai,
  nr_ordem = EXCLUDED.nr_ordem,
  ds_permissoes = EXCLUDED.ds_permissoes;

-- ==========================================
-- 7. SUB-PERFIS ADMINISTRADOR (Nível 2)
-- ==========================================

-- 7.1 Super Admin
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'super_admin',
  'Super Administrador',
  'system',
  'admin',
  id_perfil,
  'S',
  11,
  '{
    "admin": true,
    "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "agentes": {"criar": true, "editar": true, "excluir": true, "visualizar": true, "executar": true},
    "conversas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "empresa": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "licencas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'administrador'
ON CONFLICT (nm_perfil) DO NOTHING;

-- 7.2 Analista
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'analista',
  'Analista de Dados',
  'system',
  'admin',
  id_perfil,
  'S',
  12,
  '{
    "admin": false,
    "relatorios": {"visualizar": true, "exportar": true},
    "analytics": {"visualizar": true},
    "usuarios": {"visualizar": true},
    "empresa": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'administrador'
ON CONFLICT (nm_perfil) DO NOTHING;

-- 7.3 Suporte
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'suporte',
  'Suporte Técnico',
  'system',
  'admin',
  id_perfil,
  'S',
  13,
  '{
    "admin": false,
    "usuarios": {"visualizar": true, "editar": true},
    "conversas": {"visualizar": true},
    "licencas": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'administrador'
ON CONFLICT (nm_perfil) DO NOTHING;

-- ==========================================
-- 8. SUB-PERFIS PARCEIRO (Nível 2)
-- ==========================================

-- 8.1 Gestor de Clínica
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'gestor_clinica',
  'Gestor de Clínica',
  'system',
  'parceiro',
  id_perfil,
  'S',
  21,
  '{
    "admin": false,
    "agendamentos": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "pacientes": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "procedimentos": {"criar": true, "editar": true, "visualizar": true},
    "profissionais": {"criar": true, "editar": true, "visualizar": true},
    "financeiro": {"criar": true, "editar": true, "visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'parceiro'
ON CONFLICT (nm_perfil) DO UPDATE SET
  nm_tipo_acesso = EXCLUDED.nm_tipo_acesso,
  id_perfil_pai = EXCLUDED.id_perfil_pai;

-- 8.2 Médico
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'medico',
  'Médico',
  'system',
  'parceiro',
  id_perfil,
  'S',
  22,
  '{
    "admin": false,
    "agendamentos": {"criar": true, "editar": true, "visualizar": true},
    "pacientes": {"criar": true, "editar": true, "visualizar": true},
    "procedimentos": {"visualizar": true, "executar": true},
    "prontuarios": {"criar": true, "editar": true, "visualizar": true},
    "relatorios": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'parceiro'
ON CONFLICT (nm_perfil) DO NOTHING;

-- 8.3 Profissional de Estética
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'profissional_estetica',
  'Profissional de Estética',
  'system',
  'parceiro',
  id_perfil,
  'S',
  23,
  '{
    "admin": false,
    "agendamentos": {"criar": true, "editar": true, "visualizar": true},
    "pacientes": {"criar": true, "editar": true, "visualizar": true},
    "procedimentos": {"visualizar": true, "executar": true},
    "relatorios": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'parceiro'
ON CONFLICT (nm_perfil) DO NOTHING;

-- 8.4 Secretaria/Recepção
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'secretaria',
  'Secretaria/Recepção',
  'system',
  'parceiro',
  id_perfil,
  'S',
  24,
  '{
    "admin": false,
    "agendamentos": {"criar": true, "editar": true, "visualizar": true},
    "pacientes": {"criar": true, "editar": true, "visualizar": true},
    "procedimentos": {"visualizar": true},
    "financeiro": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'parceiro'
ON CONFLICT (nm_perfil) DO NOTHING;

-- 8.5 Financeiro
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'financeiro',
  'Financeiro',
  'system',
  'parceiro',
  id_perfil,
  'S',
  25,
  '{
    "admin": false,
    "financeiro": {"criar": true, "editar": true, "visualizar": true},
    "faturas": {"criar": true, "editar": true, "visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true},
    "agendamentos": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'parceiro'
ON CONFLICT (nm_perfil) DO NOTHING;

-- ==========================================
-- 9. SUB-PERFIS FORNECEDOR (Nível 2)
-- ==========================================

-- 9.1 Gestor de Fornecedor
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'gestor_fornecedor',
  'Gestor de Fornecedor',
  'system',
  'fornecedor',
  id_perfil,
  'S',
  31,
  '{
    "admin": false,
    "produtos": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "pedidos": {"visualizar": true},
    "marketplace": {"criar": true, "editar": true, "visualizar": true},
    "campanhas": {"criar": true, "editar": true, "visualizar": true},
    "financeiro": {"visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'fornecedor'
ON CONFLICT (nm_perfil) DO NOTHING;

-- 9.2 Vendedor
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'vendedor',
  'Vendedor',
  'system',
  'fornecedor',
  id_perfil,
  'S',
  32,
  '{
    "admin": false,
    "produtos": {"visualizar": true},
    "pedidos": {"visualizar": true},
    "marketplace": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'fornecedor'
ON CONFLICT (nm_perfil) DO NOTHING;

-- 9.3 Marketing
INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
SELECT
  gen_random_uuid(),
  'marketing',
  'Marketing',
  'system',
  'fornecedor',
  id_perfil,
  'S',
  33,
  '{
    "admin": false,
    "campanhas": {"criar": true, "editar": true, "visualizar": true},
    "produtos": {"visualizar": true},
    "relatorios": {"visualizar": true}
  }'::jsonb
FROM tb_perfis WHERE nm_perfil = 'fornecedor'
ON CONFLICT (nm_perfil) DO NOTHING;

-- ==========================================
-- 10. PERFIL PACIENTE (Usuários finais)
-- ==========================================

INSERT INTO tb_perfis (id_perfil, nm_perfil, ds_perfil, nm_tipo, nm_tipo_acesso, id_perfil_pai, st_ativo, nr_ordem, ds_permissoes)
VALUES (
  gen_random_uuid(),
  'paciente',
  'Paciente/Cliente',
  'system',
  'paciente',
  NULL,
  'S',
  100,
  '{
    "admin": false,
    "agendamentos": {"criar": true, "visualizar": true},
    "avaliacoes": {"criar": true, "visualizar": true},
    "procedimentos": {"visualizar": true},
    "perfil": {"editar": true, "visualizar": true}
  }'::jsonb
) ON CONFLICT (nm_perfil) DO UPDATE SET
  nm_tipo_acesso = EXCLUDED.nm_tipo_acesso,
  nr_ordem = EXCLUDED.nr_ordem,
  ds_permissoes = EXCLUDED.ds_permissoes;

-- ==========================================
-- 11. Atualizar perfis órfãos
-- ==========================================

-- Garantir que perfis antigos tenham nm_tipo_acesso
UPDATE tb_perfis
SET nm_tipo_acesso = 'parceiro'
WHERE nm_tipo_acesso IS NULL AND nm_perfil LIKE '%clinica%';

UPDATE tb_perfis
SET nm_tipo_acesso = 'admin'
WHERE nm_tipo_acesso IS NULL AND nm_perfil = 'admin';

-- ==========================================
-- 12. Verificação final
-- ==========================================

-- Listar todos os perfis criados
SELECT
  p.nm_perfil,
  p.ds_perfil,
  p.nm_tipo_acesso,
  pp.nm_perfil as perfil_pai,
  p.nr_ordem,
  p.st_ativo
FROM tb_perfis p
LEFT JOIN tb_perfis pp ON p.id_perfil_pai = pp.id_perfil
WHERE p.nm_tipo = 'system'
ORDER BY p.nm_tipo_acesso, p.nr_ordem;
