-- Migration: Adicionar campo id_empresa à tabela tb_agentes
-- Data: 2025-10-21
-- Descrição: Adiciona suporte multi-tenant aos agentes

-- Adicionar coluna id_empresa (nullable para permitir agentes globais)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='tb_agentes' AND column_name='id_empresa') THEN
        ALTER TABLE tb_agentes ADD COLUMN id_empresa UUID;

        -- Adicionar foreign key constraint
        ALTER TABLE tb_agentes ADD CONSTRAINT fk_agentes_empresa
            FOREIGN KEY (id_empresa) REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL;

        -- Adicionar índice para melhor performance em queries filtradas por empresa
        CREATE INDEX idx_agentes_empresa ON tb_agentes(id_empresa);

        -- Log da alteração
        RAISE NOTICE 'Coluna id_empresa adicionada à tabela tb_agentes';
    ELSE
        RAISE NOTICE 'Coluna id_empresa já existe na tabela tb_agentes';
    END IF;
END$$;

-- Comentário na coluna
COMMENT ON COLUMN tb_agentes.id_empresa IS 'Empresa proprietária do agente (NULL = agente global)';
