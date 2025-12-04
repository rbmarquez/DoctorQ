-- Migration: Adicionar suporte para Empresas e Perfis Personalizados
-- Data: 2025-10-20
-- Descrição: Adiciona tabelas para gerenciamento de empresas, perfis personalizados e permissões

-- ====================================
-- 1. TABELA DE EMPRESAS
-- ====================================
CREATE TABLE IF NOT EXISTS tb_empresas (
    id_empresa UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nm_empresa VARCHAR(255) NOT NULL,
    nm_razao_social VARCHAR(255),
    nr_cnpj VARCHAR(18) UNIQUE,
    nm_segmento VARCHAR(100),
    nm_porte VARCHAR(50) DEFAULT 'Pequeno', -- Pequeno, Médio, Grande, Enterprise
    nr_telefone VARCHAR(20),
    nm_email_contato VARCHAR(255),

    -- Endereço
    nm_endereco VARCHAR(255),
    nm_cidade VARCHAR(100),
    nm_estado VARCHAR(2),
    nr_cep VARCHAR(10),
    nm_pais VARCHAR(100) DEFAULT 'Brasil',

    -- Informações de conta
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_assinatura DATE,
    dt_vencimento DATE,
    nm_plano VARCHAR(50) DEFAULT 'Free', -- Free, Starter, Professional, Enterprise
    nr_limite_usuarios INTEGER DEFAULT 5,
    nr_limite_agentes INTEGER DEFAULT 2,
    nr_limite_document_stores INTEGER DEFAULT 1,

    -- Configurações
    ds_config JSONB, -- Configurações personalizadas da empresa
    ds_logo_url VARCHAR(500), -- URL do logo da empresa
    nm_cor_primaria VARCHAR(7) DEFAULT '#6366f1', -- Cor tema da empresa

    -- Timestamps
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON tb_empresas(nr_cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON tb_empresas(st_ativo);
CREATE INDEX IF NOT EXISTS idx_empresas_plano ON tb_empresas(nm_plano);

-- ====================================
-- 2. TABELA DE PERFIS PERSONALIZADOS
-- ====================================
CREATE TABLE IF NOT EXISTS tb_perfis (
    id_perfil UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID, -- NULL = perfil global do sistema
    nm_perfil VARCHAR(100) NOT NULL,
    ds_perfil TEXT,
    nm_tipo VARCHAR(20) NOT NULL DEFAULT 'custom', -- system, custom

    -- Permissões (estrutura flexível em JSONB)
    ds_permissoes JSONB NOT NULL DEFAULT '{
        "usuarios": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
        "agentes": {"criar": false, "editar": false, "excluir": false, "visualizar": false, "executar": false},
        "conversas": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
        "document_stores": {"criar": false, "editar": false, "excluir": false, "visualizar": false, "upload": false},
        "credenciais": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
        "variaveis": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
        "tools": {"criar": false, "editar": false, "excluir": false, "visualizar": false, "executar": false},
        "empresa": {"editar": false, "visualizar": false},
        "perfis": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
        "relatorios": {"visualizar": false, "exportar": false},
        "admin": false
    }'::jsonb,

    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now(),

    FOREIGN KEY (id_empresa) REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_perfis_empresa ON tb_perfis(id_empresa);
CREATE INDEX IF NOT EXISTS idx_perfis_tipo ON tb_perfis(nm_tipo);

-- ====================================
-- 3. ADICIONAR CAMPOS À TABELA DE USUÁRIOS
-- ====================================
DO $$
BEGIN
    -- Adicionar coluna id_empresa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='tb_users' AND column_name='id_empresa') THEN
        ALTER TABLE tb_users ADD COLUMN id_empresa UUID;
        ALTER TABLE tb_users ADD CONSTRAINT fk_users_empresa
            FOREIGN KEY (id_empresa) REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL;
    END IF;

    -- Adicionar coluna id_perfil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='tb_users' AND column_name='id_perfil') THEN
        ALTER TABLE tb_users ADD COLUMN id_perfil UUID;
        ALTER TABLE tb_users ADD CONSTRAINT fk_users_perfil
            FOREIGN KEY (id_perfil) REFERENCES tb_perfis(id_perfil) ON DELETE SET NULL;
    END IF;

    -- Adicionar coluna nm_cargo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='tb_users' AND column_name='nm_cargo') THEN
        ALTER TABLE tb_users ADD COLUMN nm_cargo VARCHAR(100);
    END IF;

    -- Adicionar coluna nr_telefone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='tb_users' AND column_name='nr_telefone') THEN
        ALTER TABLE tb_users ADD COLUMN nr_telefone VARCHAR(20);
    END IF;

    -- Adicionar coluna ds_foto_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='tb_users' AND column_name='ds_foto_url') THEN
        ALTER TABLE tb_users ADD COLUMN ds_foto_url VARCHAR(500);
    END IF;

    -- Adicionar coluna ds_preferencias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='tb_users' AND column_name='ds_preferencias') THEN
        ALTER TABLE tb_users ADD COLUMN ds_preferencias JSONB DEFAULT '{}'::jsonb;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_users_empresa ON tb_users(id_empresa);
CREATE INDEX IF NOT EXISTS idx_users_perfil ON tb_users(id_perfil);

-- ====================================
-- 4. CRIAR PERFIS PADRÃO DO SISTEMA
-- ====================================
INSERT INTO tb_perfis (id_perfil, id_empresa, nm_perfil, ds_perfil, nm_tipo, ds_permissoes, st_ativo)
VALUES
    -- Admin Global (permissões totais)
    (
        '00000000-0000-0000-0000-000000000001',
        NULL,
        'Administrador',
        'Administrador do sistema com acesso total',
        'system',
        '{
            "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "agentes": {"criar": true, "editar": true, "excluir": true, "visualizar": true, "executar": true},
            "conversas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "document_stores": {"criar": true, "editar": true, "excluir": true, "visualizar": true, "upload": true},
            "credenciais": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "variaveis": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "tools": {"criar": true, "editar": true, "excluir": true, "visualizar": true, "executar": true},
            "empresa": {"editar": true, "visualizar": true},
            "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "relatorios": {"visualizar": true, "exportar": true},
            "admin": true
        }'::jsonb,
        'S'
    ),

    -- Analista (permissões de leitura e criação)
    (
        '00000000-0000-0000-0000-000000000002',
        NULL,
        'Analista',
        'Analista com permissões de criação e edição',
        'system',
        '{
            "usuarios": {"criar": false, "editar": false, "excluir": false, "visualizar": true},
            "agentes": {"criar": true, "editar": true, "excluir": false, "visualizar": true, "executar": true},
            "conversas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "document_stores": {"criar": true, "editar": true, "excluir": false, "visualizar": true, "upload": true},
            "credenciais": {"criar": false, "editar": false, "excluir": false, "visualizar": true},
            "variaveis": {"criar": false, "editar": false, "excluir": false, "visualizar": true},
            "tools": {"criar": true, "editar": true, "excluir": false, "visualizar": true, "executar": true},
            "empresa": {"editar": false, "visualizar": true},
            "perfis": {"criar": false, "editar": false, "excluir": false, "visualizar": true},
            "relatorios": {"visualizar": true, "exportar": true},
            "admin": false
        }'::jsonb,
        'S'
    ),

    -- Usuário (apenas uso básico)
    (
        '00000000-0000-0000-0000-000000000003',
        NULL,
        'Usuário',
        'Usuário básico com permissões limitadas',
        'system',
        '{
            "usuarios": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
            "agentes": {"criar": false, "editar": false, "excluir": false, "visualizar": true, "executar": true},
            "conversas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
            "document_stores": {"criar": false, "editar": false, "excluir": false, "visualizar": true, "upload": false},
            "credenciais": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
            "variaveis": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
            "tools": {"criar": false, "editar": false, "excluir": false, "visualizar": true, "executar": true},
            "empresa": {"editar": false, "visualizar": false},
            "perfis": {"criar": false, "editar": false, "excluir": false, "visualizar": false},
            "relatorios": {"visualizar": false, "exportar": false},
            "admin": false
        }'::jsonb,
        'S'
    )
ON CONFLICT (id_perfil) DO NOTHING;

-- ====================================
-- 5. CRIAR EMPRESA PADRÃO
-- ====================================
INSERT INTO tb_empresas (
    id_empresa,
    nm_empresa,
    nm_razao_social,
    nm_segmento,
    nm_plano,
    nr_limite_usuarios,
    nr_limite_agentes,
    st_ativo
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'InovaIA',
    'InovaIA Tecnologia Ltda',
    'Tecnologia',
    'Enterprise',
    9999,
    9999,
    'S'
)
ON CONFLICT (id_empresa) DO NOTHING;

-- ====================================
-- 6. COMENTÁRIOS NAS TABELAS
-- ====================================
COMMENT ON TABLE tb_empresas IS 'Tabela de empresas/organizações do sistema';
COMMENT ON TABLE tb_perfis IS 'Tabela de perfis personalizados com permissões granulares';
COMMENT ON COLUMN tb_empresas.nm_porte IS 'Porte da empresa: Pequeno, Médio, Grande, Enterprise';
COMMENT ON COLUMN tb_empresas.nm_plano IS 'Plano de assinatura: Free, Starter, Professional, Enterprise';
COMMENT ON COLUMN tb_perfis.ds_permissoes IS 'Permissões em formato JSON para controle granular de acesso';
