-- =============================================================================
-- Tabela de Records Manager para LangChain Indexing
-- =============================================================================

CREATE TABLE IF NOT EXISTS tb_record_manager (
    id_record UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    namespace VARCHAR(255) NOT NULL,
    key VARCHAR(1000) NOT NULL,
    group_id VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ãndice Ãºnico composto para namespace + key
    CONSTRAINT uk_record_manager_namespace_key UNIQUE (namespace, key)
);

-- =============================================================================
-- Ãndices para performance
-- =============================================================================

-- Ãndice para busca por namespace
CREATE INDEX IF NOT EXISTS idx_record_manager_namespace 
ON tb_record_manager (namespace);

-- Ãndice para busca por namespace + updated_at (usado para filtering temporal)
CREATE INDEX IF NOT EXISTS idx_record_manager_namespace_updated_at 
ON tb_record_manager (namespace, updated_at);

-- Ãndice para busca por group_id
CREATE INDEX IF NOT EXISTS idx_record_manager_group_id 
ON tb_record_manager (group_id) WHERE group_id IS NOT NULL;

-- Ãndice composto para busca por namespace + group_id
CREATE INDEX IF NOT EXISTS idx_record_manager_namespace_group_id 
ON tb_record_manager (namespace, group_id) WHERE group_id IS NOT NULL;

-- =============================================================================
-- ComentÃ¡rios nas tabelas e colunas
-- =============================================================================

COMMENT ON TABLE tb_record_manager IS 'Tabela para gerenciar records do LangChain indexing system';
COMMENT ON COLUMN tb_record_manager.id_record IS 'ID Ãºnico do record';
COMMENT ON COLUMN tb_record_manager.namespace IS 'Namespace do record manager (separaÃ§Ã£o lÃ³gica)';
COMMENT ON COLUMN tb_record_manager.key IS 'Chave Ãºnica do record dentro do namespace';
COMMENT ON COLUMN tb_record_manager.group_id IS 'ID do grupo (opcional, usado para agrupamento de records)';
COMMENT ON COLUMN tb_record_manager.updated_at IS 'Timestamp da Ãºltima atualizaÃ§Ã£o (usado para indexing temporal)';
COMMENT ON COLUMN tb_record_manager.created_at IS 'Timestamp de criaÃ§Ã£o do record';

-- =============================================================================
-- Trigger para atualizar automaticamente updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_record_manager_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_record_manager_updated_at
    BEFORE UPDATE ON tb_record_manager
    FOR EACH ROW
    EXECUTE FUNCTION update_record_manager_updated_at();
