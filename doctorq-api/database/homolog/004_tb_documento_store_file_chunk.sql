-- =============================================================================
-- Tabela: tb_documento_store_file_chunk
-- =============================================================================
CREATE TABLE IF NOT EXISTS tb_documento_store_file_chunk (
    id_chunk UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_documento UUID,
    nr_chunk INTEGER,
    id_store UUID,
    ds_page_content TEXT,
    ds_metadata TEXT
);

-- Relacionamento: 1 documento_store tem 1 ou N chunks
ALTER TABLE tb_documento_store_file_chunk 
ADD CONSTRAINT fk_chunk_documento_store 
FOREIGN KEY (id_store) REFERENCES tb_documento_store(id_documento_store) 
ON DELETE CASCADE 
ON UPDATE CASCADE;


-- Ãndices para tb_documento_store_file_chunk
CREATE INDEX IF NOT EXISTS idx_chunk_documento ON tb_documento_store_file_chunk(id_documento);
CREATE INDEX IF NOT EXISTS idx_chunk_store ON tb_documento_store_file_chunk(id_store);
CREATE INDEX IF NOT EXISTS idx_chunk_numero ON tb_documento_store_file_chunk(nr_chunk);
CREATE INDEX IF NOT EXISTS idx_chunk_doc_numero ON tb_documento_store_file_chunk(id_documento, nr_chunk);
CREATE INDEX IF NOT EXISTS idx_chunk_store_doc ON tb_documento_store_file_chunk(id_store, id_documento);


COMMENT ON TABLE tb_documento_store_file_chunk IS 'Tabela para armazenar chunks de arquivos processados';
COMMENT ON COLUMN tb_documento_store_file_chunk.id_chunk IS 'ID Ãºnico do chunk';
COMMENT ON COLUMN tb_documento_store_file_chunk.id_documento IS 'ID do documento original';
COMMENT ON COLUMN tb_documento_store_file_chunk.nr_chunk IS 'NÃºmero sequencial do chunk no documento';
COMMENT ON COLUMN tb_documento_store_file_chunk.id_store IS 'ID do document store onde estÃ¡ armazenado';
COMMENT ON COLUMN tb_documento_store_file_chunk.ds_page_content IS 'ConteÃºdo do chunk';
COMMENT ON COLUMN tb_documento_store_file_chunk.ds_metadata IS 'Metadados do chunk em JSON';
