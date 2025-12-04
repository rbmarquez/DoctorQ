CREATE TABLE IF NOT EXISTS tb_documento_store (
    id_documento_store UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nm_documento_store VARCHAR,
    ds_documento_store VARCHAR,
    ds_loaders TEXT,
    ds_where_used TEXT,
    nm_status VARCHAR,
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),
    ds_vector_store_config TEXT,
    ds_embedding_config TEXT,
    ds_record_manager_config TEXT
);


-- =============================================================================
-- ComentÃ¡rios nas tabelas
-- =============================================================================
COMMENT ON TABLE tb_documento_store IS 'Tabela para armazenar configuraÃ§Ãµes de document stores';
COMMENT ON COLUMN tb_documento_store.id_documento_store IS 'ID Ãºnico do document store';
COMMENT ON COLUMN tb_documento_store.nm_documento_store IS 'Nome do document store';
COMMENT ON COLUMN tb_documento_store.ds_documento_store IS 'DescriÃ§Ã£o do document store';
COMMENT ON COLUMN tb_documento_store.ds_loaders IS 'ConfiguraÃ§Ã£o dos loaders em JSON';
COMMENT ON COLUMN tb_documento_store.ds_where_used IS 'DescriÃ§Ã£o de onde Ã© utilizado';
COMMENT ON COLUMN tb_documento_store.nm_status IS 'Status do document store (active, inactive, etc.)';
COMMENT ON COLUMN tb_documento_store.dt_criacao IS 'Data e hora de criaÃ§Ã£o';
COMMENT ON COLUMN tb_documento_store.dt_atualizacao IS 'Data e hora da Ãºltima atualizaÃ§Ã£o';
COMMENT ON COLUMN tb_documento_store.ds_vector_store_config IS 'ConfiguraÃ§Ã£o do vector store em JSON';
COMMENT ON COLUMN tb_documento_store.ds_embedding_config IS 'ConfiguraÃ§Ã£o do embedding em JSON';
COMMENT ON COLUMN tb_documento_store.ds_record_manager_config IS 'ConfiguraÃ§Ã£o do record manager em JSON';
