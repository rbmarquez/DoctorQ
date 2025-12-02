-- Migration: Criar/Atualizar tabela tb_credenciais com suporte multi-tenant
-- Data: 2025-11-29
-- Descrição: Adiciona campo id_empresa para isolamento de credenciais por clínica/empresa

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS tb_credenciais (
    id_credencial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    nome_credencial VARCHAR(100) NOT NULL,
    dados_criptografado TEXT NOT NULL,
    dt_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna id_empresa se não existir (caso tabela já exista)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_credenciais' AND column_name = 'id_empresa'
    ) THEN
        ALTER TABLE tb_credenciais
        ADD COLUMN id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar coluna fg_ativo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_credenciais' AND column_name = 'fg_ativo'
    ) THEN
        ALTER TABLE tb_credenciais ADD COLUMN fg_ativo BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_credenciais_empresa ON tb_credenciais(id_empresa);
CREATE INDEX IF NOT EXISTS idx_credenciais_nome ON tb_credenciais(nome_credencial);
CREATE INDEX IF NOT EXISTS idx_credenciais_empresa_tipo ON tb_credenciais(id_empresa, nome_credencial);

-- Comentários
COMMENT ON TABLE tb_credenciais IS 'Armazena credenciais criptografadas por empresa (multi-tenant)';
COMMENT ON COLUMN tb_credenciais.id_empresa IS 'Empresa dona da credencial (multi-tenant)';
COMMENT ON COLUMN tb_credenciais.nome IS 'Nome amigável da credencial';
COMMENT ON COLUMN tb_credenciais.nome_credencial IS 'Tipo da credencial (openIaApi, azureOpenIaChatApi, etc)';
COMMENT ON COLUMN tb_credenciais.dados_criptografado IS 'Dados criptografados com AES-256';
COMMENT ON COLUMN tb_credenciais.fg_ativo IS 'Se a credencial está ativa';
