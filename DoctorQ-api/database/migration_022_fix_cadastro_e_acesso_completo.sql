-- ============================================================================
-- Migration 022: Correção Completa do Sistema de Cadastro e Acesso
-- ============================================================================
-- Data: 06/11/2025
-- Objetivo: Corrigir arquitetura de perfis, criar estruturas específicas
--           por tipo de parceiro, e implementar tenant context
--
-- Referência: DOC_Arquitetura/ANALISE_COMPLETA_SISTEMA_CADASTRO_ACESSO.md
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR PERFIL TEMPLATE "FORNECEDOR"
-- ============================================================================

-- Verificar se já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_perfis
        WHERE nm_perfil = 'Fornecedor'
          AND fg_template = true
          AND id_empresa IS NULL
    ) THEN
        INSERT INTO tb_perfis (
            id_perfil,
            nm_perfil,
            ds_perfil,
            nm_tipo,
            fg_template,
            id_empresa,
            ds_grupos_acesso,
            ds_permissoes_detalhadas,
            st_ativo
        ) VALUES (
            gen_random_uuid(),
            'Fornecedor',
            'Perfil de fornecedor/fabricante com acesso ao marketplace e gestão de produtos',
            'system',
            true,  -- É template global
            NULL,  -- Não pertence a nenhuma empresa
            ARRAY['fornecedor']::TEXT[],
            '{
              "fornecedor": {
                "dashboard": {"visualizar": true},
                "produtos": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
                "pedidos": {"visualizar": true, "editar": true},
                "financeiro": {"visualizar": true, "exportar": true},
                "relatorios": {"visualizar": true, "exportar": true},
                "perfil": {"visualizar": true, "editar": true}
              }
            }'::JSONB,
            'S'
        );

        RAISE NOTICE '✅ Perfil template "Fornecedor" criado com sucesso';
    ELSE
        RAISE NOTICE '⚠️ Perfil template "Fornecedor" já existe';
    END IF;
END $$;

-- ============================================================================
-- PARTE 2: ATUALIZAR PERFIL "admin" PARA "Super Admin"
-- ============================================================================

-- Atualizar nome e permissões do admin global
UPDATE tb_perfis
SET
    nm_perfil = 'Super Admin',
    ds_perfil = 'Administrador da plataforma com acesso total (não pertence a empresa)',
    ds_grupos_acesso = ARRAY['admin']::TEXT[],
    ds_permissoes_detalhadas = '{
      "admin": {
        "dashboard": {"visualizar": true},
        "usuarios": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
        "empresas": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
        "perfis": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
        "agentes": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
        "conversas": {"visualizar": true, "excluir": true},
        "analytics": {"visualizar": true},
        "configuracoes": {"visualizar": true, "editar": true},
        "tools": {"visualizar": true, "executar": true}
      }
    }'::JSONB
WHERE
    nm_perfil = 'admin'
    AND fg_template = true
    AND id_empresa IS NULL;

-- ============================================================================
-- PARTE 3: MIGRAR USUÁRIOS SEM PERFIL
-- ============================================================================

-- 3.1. Usuários com nm_papel='admin' e sem perfil → Super Admin
UPDATE tb_users u
SET id_perfil = (
    SELECT id_perfil FROM tb_perfis
    WHERE nm_perfil IN ('Super Admin', 'admin')
      AND fg_template = true
      AND id_empresa IS NULL
    LIMIT 1
)
WHERE
    u.st_ativo = 'S'
    AND u.id_perfil IS NULL
    AND u.nm_papel = 'admin';

-- 3.2. Usuários com nm_papel='usuario' e com empresa → Clonar Paciente
DO $$
DECLARE
    user_record RECORD;
    perfil_template_id UUID;
    perfil_clone_id UUID;
BEGIN
    -- Buscar ID do template Paciente
    SELECT id_perfil INTO perfil_template_id
    FROM tb_perfis
    WHERE nm_perfil = 'Paciente'
      AND fg_template = true
      AND id_empresa IS NULL
    LIMIT 1;

    IF perfil_template_id IS NULL THEN
        RAISE EXCEPTION 'Template Paciente não encontrado!';
    END IF;

    -- Iterar sobre usuários sem perfil mas com empresa
    FOR user_record IN
        SELECT u.id_user, u.id_empresa, u.nm_email
        FROM tb_users u
        WHERE u.st_ativo = 'S'
          AND u.id_perfil IS NULL
          AND u.nm_papel IN ('usuario', 'user')
          AND u.id_empresa IS NOT NULL
    LOOP
        -- Verificar se já existe clone de Paciente para esta empresa
        SELECT id_perfil INTO perfil_clone_id
        FROM tb_perfis
        WHERE nm_perfil = 'Paciente'
          AND id_empresa = user_record.id_empresa
          AND fg_template = false
        LIMIT 1;

        -- Se não existir, criar clone
        IF perfil_clone_id IS NULL THEN
            INSERT INTO tb_perfis (
                id_perfil,
                id_empresa,
                nm_perfil,
                ds_perfil,
                nm_tipo,
                fg_template,
                ds_grupos_acesso,
                ds_permissoes_detalhadas,
                st_ativo
            )
            SELECT
                gen_random_uuid(),
                user_record.id_empresa,
                nm_perfil,
                ds_perfil,
                'custom',  -- Clone é sempre custom
                false,     -- Clone não é template
                ds_grupos_acesso,
                ds_permissoes_detalhadas,
                'S'
            FROM tb_perfis
            WHERE id_perfil = perfil_template_id
            RETURNING id_perfil INTO perfil_clone_id;

            RAISE NOTICE '✅ Clone de Paciente criado para empresa %', user_record.id_empresa;
        END IF;

        -- Atualizar usuário com perfil clonado
        UPDATE tb_users
        SET id_perfil = perfil_clone_id
        WHERE id_user = user_record.id_user;

        RAISE NOTICE '✅ Usuário % migrado para perfil Paciente', user_record.nm_email;
    END LOOP;
END $$;

-- 3.3. Log de usuários que não puderam ser migrados
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count
    FROM tb_users
    WHERE st_ativo = 'S' AND id_perfil IS NULL;

    IF unmigrated_count > 0 THEN
        RAISE WARNING '⚠️ % usuários ainda sem perfil. Execute query abaixo para detalhes:', unmigrated_count;
        RAISE NOTICE 'SELECT id_user, nm_email, nm_completo, nm_papel, id_empresa FROM tb_users WHERE st_ativo = ''S'' AND id_perfil IS NULL;';
    ELSE
        RAISE NOTICE '✅ Todos os usuários foram migrados com sucesso!';
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: CRIAR/ATUALIZAR TABELAS ESPECÍFICAS
-- ============================================================================

-- 4.1. Tabela tb_clinicas
CREATE TABLE IF NOT EXISTS tb_clinicas (
    id_clinica UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    nm_clinica VARCHAR(255) NOT NULL,
    ds_clinica TEXT,
    nm_especialidade VARCHAR(100),  -- Dermatologia, Estética, Odontologia
    nr_cnpj VARCHAR(18),
    nr_cnes VARCHAR(20),  -- Cadastro Nacional de Estabelecimentos de Saúde

    -- Endereço completo
    ds_endereco VARCHAR(255),
    nm_bairro VARCHAR(100),
    nm_cidade VARCHAR(100),
    nm_estado VARCHAR(2),
    nr_cep VARCHAR(10),

    -- Contato
    nr_telefone VARCHAR(20),
    nm_email VARCHAR(255),
    ds_site_url VARCHAR(500),
    ds_logo_url VARCHAR(500),

    -- Capacidade
    nr_capacidade_atendimentos INTEGER DEFAULT 10,
    nr_salas_atendimento INTEGER DEFAULT 1,

    -- Configurações
    ds_config JSONB DEFAULT '{}'::JSONB,

    -- Timestamps
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para tb_clinicas
CREATE INDEX IF NOT EXISTS idx_clinicas_empresa ON tb_clinicas(id_empresa);
CREATE INDEX IF NOT EXISTS idx_clinicas_ativo ON tb_clinicas(st_ativo);
CREATE INDEX IF NOT EXISTS idx_clinicas_cidade_estado ON tb_clinicas(nm_cidade, nm_estado);
CREATE INDEX IF NOT EXISTS idx_clinicas_cnpj ON tb_clinicas(nr_cnpj);

-- RLS para tb_clinicas
ALTER TABLE tb_clinicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinicas_isolation_policy ON tb_clinicas;
CREATE POLICY clinicas_isolation_policy ON tb_clinicas
USING (id_empresa = current_user_empresa_id());

-- 4.2. Atualizar tabela tb_profissionais
ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE;

ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS fg_autonomo BOOLEAN DEFAULT false;

ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS ds_bio TEXT;

ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS ds_foto_url VARCHAR(500);

ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS ds_config JSONB DEFAULT '{}'::JSONB;

-- Índices para tb_profissionais
CREATE INDEX IF NOT EXISTS idx_profissionais_empresa ON tb_profissionais(id_empresa);
CREATE INDEX IF NOT EXISTS idx_profissionais_autonomo ON tb_profissionais(fg_autonomo);

-- RLS para tb_profissionais
ALTER TABLE tb_profissionais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profissionais_isolation_policy ON tb_profissionais;
CREATE POLICY profissionais_isolation_policy ON tb_profissionais
USING (id_empresa IS NULL OR id_empresa = current_user_empresa_id());

-- 4.3. Atualizar tabela tb_fornecedores
ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE;

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS nm_tipo VARCHAR(50) DEFAULT 'Fornecedor';  -- Fornecedor, Fabricante, Distribuidor

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS ds_segmentos JSONB DEFAULT '[]'::JSONB;  -- ["Dermocosméticos", "Equipamentos"]

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS ds_catalogo_url VARCHAR(500);

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS nr_prazo_entrega_dias INTEGER DEFAULT 30;

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS ds_config JSONB DEFAULT '{}'::JSONB;

-- Índices para tb_fornecedores
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON tb_fornecedores(id_empresa);
CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON tb_fornecedores(nm_tipo);
CREATE INDEX IF NOT EXISTS idx_fornecedores_segmentos ON tb_fornecedores USING gin(ds_segmentos);

-- RLS para tb_fornecedores
ALTER TABLE tb_fornecedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fornecedores_isolation_policy ON tb_fornecedores;
CREATE POLICY fornecedores_isolation_policy ON tb_fornecedores
USING (id_empresa = current_user_empresa_id());

-- ============================================================================
-- PARTE 5: CRIAR FUNÇÃO current_user_empresa_id()
-- ============================================================================

CREATE OR REPLACE FUNCTION current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
    -- Retorna o id_empresa do usuário atual (via contexto da sessão)
    -- Se não houver contexto, retorna NULL (admin da plataforma)
    RETURN NULLIF(current_setting('app.current_user_empresa_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION current_user_empresa_id() IS 'Retorna o ID da empresa do usuário atual para RLS (NULL = admin plataforma)';

-- ============================================================================
-- PARTE 6: RLS EM TABELAS ADICIONAIS
-- ============================================================================

-- RLS em tb_users (opcional, mas recomendado)
ALTER TABLE tb_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_isolation_policy ON tb_users;
CREATE POLICY users_isolation_policy ON tb_users
USING (
    -- Admin da plataforma vê todos
    current_user_empresa_id() IS NULL
    OR
    -- Usuários veem apenas da própria empresa
    id_empresa = current_user_empresa_id()
);

-- ============================================================================
-- PARTE 7: VIEW AUXILIAR - vw_usuarios_contexto
-- ============================================================================

CREATE OR REPLACE VIEW vw_usuarios_contexto AS
SELECT
    u.id_user,
    u.nm_email,
    u.nm_completo,
    u.nm_papel,
    u.id_empresa,
    e.nm_empresa,
    u.id_perfil,
    p.nm_perfil,
    p.ds_grupos_acesso,
    p.ds_permissoes_detalhadas,
    p.fg_template,

    -- Flags de tipo de admin
    (u.id_empresa IS NULL AND 'admin' = ANY(p.ds_grupos_acesso)) AS fg_admin_plataforma,
    (u.id_empresa IS NOT NULL AND 'clinica' = ANY(p.ds_grupos_acesso)) AS fg_admin_clinica,
    (u.id_empresa IS NOT NULL AND 'profissional' = ANY(p.ds_grupos_acesso)) AS fg_admin_profissional,
    (u.id_empresa IS NOT NULL AND 'fornecedor' = ANY(p.ds_grupos_acesso)) AS fg_admin_fornecedor,

    -- Flags de acesso por grupo
    'admin' = ANY(p.ds_grupos_acesso) AS fg_acesso_admin,
    'clinica' = ANY(p.ds_grupos_acesso) AS fg_acesso_clinica,
    'profissional' = ANY(p.ds_grupos_acesso) AS fg_acesso_profissional,
    'paciente' = ANY(p.ds_grupos_acesso) AS fg_acesso_paciente,
    'fornecedor' = ANY(p.ds_grupos_acesso) AS fg_acesso_fornecedor,

    u.st_ativo,
    u.dt_criacao
FROM tb_users u
LEFT JOIN tb_empresas e ON u.id_empresa = e.id_empresa
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil
WHERE u.st_ativo = 'S';

COMMENT ON VIEW vw_usuarios_contexto IS 'View consolidada com contexto completo do usuário (empresa, perfil, permissões)';

-- ============================================================================
-- PARTE 8: VALIDAÇÕES E RELATÓRIOS
-- ============================================================================

-- Relatório de perfis templates
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RELATÓRIO DE PERFIS TEMPLATES GLOBAIS';
    RAISE NOTICE '============================================';
END $$;

SELECT
    nm_perfil,
    ds_grupos_acesso,
    CASE
        WHEN nm_perfil = 'Super Admin' THEN '✅ Admin Plataforma'
        WHEN nm_perfil = 'Gestor de Clínica' THEN '✅ Admin Clínica'
        WHEN nm_perfil = 'Profissional' THEN '✅ Admin Profissional'
        WHEN nm_perfil = 'Fornecedor' THEN '✅ Admin Fornecedor'
        WHEN nm_perfil = 'Recepcionista' THEN '✅ Colaborador Clínica'
        WHEN nm_perfil = 'Paciente' THEN '✅ Cliente'
        ELSE '⚠️ Outro'
    END as tipo
FROM tb_perfis
WHERE fg_template = true AND id_empresa IS NULL
ORDER BY nm_perfil;

-- Relatório de usuários por tipo
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RELATÓRIO DE USUÁRIOS POR TIPO';
    RAISE NOTICE '============================================';
END $$;

SELECT
    CASE
        WHEN fg_admin_plataforma THEN 'Admin Plataforma'
        WHEN fg_admin_clinica THEN 'Admin Clínica'
        WHEN fg_admin_profissional THEN 'Admin Profissional'
        WHEN fg_admin_fornecedor THEN 'Admin Fornecedor'
        WHEN fg_acesso_paciente THEN 'Paciente'
        ELSE 'Outro'
    END as tipo_usuario,
    COUNT(*) as total
FROM vw_usuarios_contexto
GROUP BY tipo_usuario
ORDER BY total DESC;

-- Relatório de usuários sem perfil (deve ser 0)
DO $$
DECLARE
    count_without_profile INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_without_profile
    FROM tb_users
    WHERE st_ativo = 'S' AND id_perfil IS NULL;

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'USUÁRIOS SEM PERFIL: %', count_without_profile;
    RAISE NOTICE '============================================';

    IF count_without_profile > 0 THEN
        RAISE WARNING '⚠️ Ainda existem % usuários sem perfil! Revisar manualmente.', count_without_profile;
    ELSE
        RAISE NOTICE '✅ Todos os usuários têm perfil atribuído!';
    END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION 022
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Migration 022 executada com sucesso!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Atualizar partner_activation_service.py';
    RAISE NOTICE '2. Criar endpoint /users/me/context';
    RAISE NOTICE '3. Testar fluxo de cadastro via /partner-activation/';
    RAISE NOTICE '';
END $$;
