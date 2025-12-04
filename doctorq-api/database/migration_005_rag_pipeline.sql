-- Migration 005: RAG Pipeline - Chunks, Embeddings e Processing Jobs
-- Data: 2025-10-21
-- Descrição: Cria tabelas para sistema RAG (Retrieval Augmented Generation)

-- ============================================================================
-- 1. TABELA DE CHUNKS DE DOCUMENTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_document_chunks (
    id_chunk UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_documento UUID NOT NULL,
    id_documento_store UUID NOT NULL,

    -- Conteúdo do chunk
    ds_texto TEXT NOT NULL,
    nr_ordem INTEGER NOT NULL,
    nr_start_char INTEGER,
    nr_end_char INTEGER,
    nr_tokens INTEGER, -- Número de tokens (estimado)

    -- Metadados
    js_metadata JSONB DEFAULT '{}',
    nm_page_number INTEGER, -- Número da página (para PDFs)
    nm_section TEXT, -- Seção do documento

    -- Embedding (1536 dimensões para OpenAI text-embedding-3-small)
    embedding vector(1536),

    -- Auditoria
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_documento FOREIGN KEY (id_documento)
        REFERENCES tb_documentos(id_documento) ON DELETE CASCADE,
    CONSTRAINT fk_documento_store FOREIGN KEY (id_documento_store)
        REFERENCES tb_documento_store(id_documento_store) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chunks_documento ON tb_document_chunks(id_documento);
CREATE INDEX IF NOT EXISTS idx_chunks_documento_store ON tb_document_chunks(id_documento_store);
CREATE INDEX IF NOT EXISTS idx_chunks_ordem ON tb_document_chunks(id_documento, nr_ordem);

-- Índice HNSW para busca vetorial rápida (similaridade cosine)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON tb_document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Comentários
COMMENT ON TABLE tb_document_chunks IS 'Chunks de texto extraídos de documentos para RAG';
COMMENT ON COLUMN tb_document_chunks.embedding IS 'Vetor de embedding (1536 dim, OpenAI ada-002/3-small)';
COMMENT ON INDEX idx_chunks_embedding IS 'Índice HNSW para busca por similaridade cosine';

-- ============================================================================
-- 2. TABELA DE JOBS DE PROCESSAMENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_processing_jobs (
    id_job UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_documento UUID NOT NULL,
    id_documento_store UUID NOT NULL,

    -- Status do job
    nm_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Status: pending, processing, completed, failed, cancelled

    -- Tipo de processamento
    nm_tipo VARCHAR(50) NOT NULL,
    -- Tipos: chunking, embedding, both

    -- Progresso
    nr_total_steps INTEGER DEFAULT 0,
    nr_completed_steps INTEGER DEFAULT 0,
    nr_progress_percent DECIMAL(5,2) DEFAULT 0.00,

    -- Resultados
    nr_chunks_created INTEGER DEFAULT 0,
    nr_embeddings_created INTEGER DEFAULT 0,

    -- Erro (se houver)
    ds_error TEXT,
    js_error_details JSONB,

    -- Configurações do job
    js_config JSONB DEFAULT '{}',

    -- Timestamps
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_inicio TIMESTAMP,
    dt_conclusao TIMESTAMP,
    nr_duracao_segundos INTEGER,

    -- Foreign keys
    CONSTRAINT fk_job_documento FOREIGN KEY (id_documento)
        REFERENCES tb_documentos(id_documento) ON DELETE CASCADE,
    CONSTRAINT fk_job_documento_store FOREIGN KEY (id_documento_store)
        REFERENCES tb_documento_store(id_documento_store) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_status CHECK (nm_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT chk_tipo CHECK (nm_tipo IN ('chunking', 'embedding', 'both'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_jobs_documento ON tb_processing_jobs(id_documento);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON tb_processing_jobs(nm_status);
CREATE INDEX IF NOT EXISTS idx_jobs_criacao ON tb_processing_jobs(dt_criacao DESC);

-- Comentários
COMMENT ON TABLE tb_processing_jobs IS 'Jobs de processamento de documentos (chunking e embeddings)';
COMMENT ON COLUMN tb_processing_jobs.nm_status IS 'Status: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN tb_processing_jobs.nm_tipo IS 'Tipo: chunking, embedding, both';

-- ============================================================================
-- 3. TABELA DE CONFIGURAÇÕES DE EMBEDDING
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_embedding_configs (
    id_config UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_documento_store UUID NOT NULL,

    -- Modelo de embedding
    nm_modelo VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
    nm_provider VARCHAR(50) NOT NULL DEFAULT 'openai',
    -- Providers: openai, sentence-transformers, custom

    -- Dimensões do vetor
    nr_dimensoes INTEGER NOT NULL DEFAULT 1536,

    -- Configurações de chunking
    nr_chunk_size INTEGER DEFAULT 1000,
    nr_chunk_overlap INTEGER DEFAULT 200,
    nm_chunking_strategy VARCHAR(50) DEFAULT 'fixed_size',
    -- Strategies: fixed_size, semantic, recursive

    -- Outras configurações
    bl_ativo BOOLEAN DEFAULT TRUE,
    js_config_extra JSONB DEFAULT '{}',

    -- Auditoria
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_config_documento_store FOREIGN KEY (id_documento_store)
        REFERENCES tb_documento_store(id_documento_store) ON DELETE CASCADE,

    -- Unique constraint (1 config ativa por document store)
    CONSTRAINT uq_store_config UNIQUE (id_documento_store, bl_ativo)
);

-- Comentários
COMMENT ON TABLE tb_embedding_configs IS 'Configurações de embedding e chunking por Document Store';
COMMENT ON COLUMN tb_embedding_configs.nr_dimensoes IS 'Dimensões do vetor (1536 para OpenAI, 384 para MiniLM, etc.)';

-- ============================================================================
-- 4. TABELA DE ESTATÍSTICAS DE BUSCA
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_search_stats (
    id_stat UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_documento_store UUID NOT NULL,
    id_agente UUID,

    -- Query
    ds_query TEXT NOT NULL,
    nr_query_tokens INTEGER,

    -- Resultados
    nr_results_found INTEGER DEFAULT 0,
    nr_top_k INTEGER DEFAULT 5,

    -- Métricas
    nr_search_time_ms INTEGER, -- Tempo de busca em ms
    nr_avg_similarity DECIMAL(5,4), -- Similaridade média dos resultados
    nr_top_similarity DECIMAL(5,4), -- Maior similaridade encontrada

    -- Metadados
    js_filters JSONB, -- Filtros aplicados
    js_results JSONB, -- IDs dos chunks retornados

    -- Timestamp
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_stat_documento_store FOREIGN KEY (id_documento_store)
        REFERENCES tb_documento_store(id_documento_store) ON DELETE CASCADE,
    CONSTRAINT fk_stat_agente FOREIGN KEY (id_agente)
        REFERENCES tb_agentes(id_agente) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stats_store ON tb_search_stats(id_documento_store);
CREATE INDEX IF NOT EXISTS idx_stats_agente ON tb_search_stats(id_agente);
CREATE INDEX IF NOT EXISTS idx_stats_criacao ON tb_search_stats(dt_criacao DESC);

-- Comentários
COMMENT ON TABLE tb_search_stats IS 'Estatísticas de buscas semânticas para analytics';

-- ============================================================================
-- 5. ADICIONAR CAMPOS NA TABELA tb_documentos
-- ============================================================================

-- Adicionar campos de status de processamento
ALTER TABLE tb_documentos ADD COLUMN IF NOT EXISTS nm_status_processamento VARCHAR(50) DEFAULT 'pending';
ALTER TABLE tb_documentos ADD COLUMN IF NOT EXISTS nr_chunks_count INTEGER DEFAULT 0;
ALTER TABLE tb_documentos ADD COLUMN IF NOT EXISTS bl_embeddings_gerados BOOLEAN DEFAULT FALSE;
ALTER TABLE tb_documentos ADD COLUMN IF NOT EXISTS dt_ultimo_processamento TIMESTAMP;

-- Comentários
COMMENT ON COLUMN tb_documentos.nm_status_processamento IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN tb_documentos.nr_chunks_count IS 'Número de chunks gerados deste documento';
COMMENT ON COLUMN tb_documentos.bl_embeddings_gerados IS 'Se embeddings foram gerados';

-- ============================================================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para calcular similaridade cosine entre dois vetores
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$;

COMMENT ON FUNCTION cosine_similarity IS 'Calcula similaridade cosine entre dois vetores (retorna 0-1)';

-- Função para busca semântica
CREATE OR REPLACE FUNCTION busca_semantica(
    p_embedding vector,
    p_id_documento_store UUID,
    p_top_k INTEGER DEFAULT 5,
    p_min_similarity DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    id_chunk UUID,
    ds_texto TEXT,
    nr_similarity DECIMAL,
    js_metadata JSONB,
    nr_ordem INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id_chunk,
        c.ds_texto,
        ROUND((1 - (c.embedding <=> p_embedding))::DECIMAL, 4) as nr_similarity,
        c.js_metadata,
        c.nr_ordem
    FROM tb_document_chunks c
    WHERE c.id_documento_store = p_id_documento_store
        AND c.embedding IS NOT NULL
        AND (1 - (c.embedding <=> p_embedding)) >= p_min_similarity
    ORDER BY c.embedding <=> p_embedding
    LIMIT p_top_k;
END;
$$;

COMMENT ON FUNCTION busca_semantica IS 'Busca semântica por similaridade de vetores com threshold mínimo';

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Trigger para atualizar contador de chunks em tb_documentos
CREATE OR REPLACE FUNCTION atualizar_chunks_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tb_documentos
    SET nr_chunks_count = (
        SELECT COUNT(*)
        FROM tb_document_chunks
        WHERE id_documento = NEW.id_documento
    ),
    dt_ultimo_processamento = CURRENT_TIMESTAMP
    WHERE id_documento = NEW.id_documento;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_chunks_count ON tb_document_chunks;
CREATE TRIGGER trigger_atualizar_chunks_count
AFTER INSERT OR DELETE ON tb_document_chunks
FOR EACH ROW
EXECUTE FUNCTION atualizar_chunks_count();

-- Trigger para marcar embeddings como gerados
CREATE OR REPLACE FUNCTION marcar_embeddings_gerados()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.embedding IS NOT NULL AND OLD.embedding IS NULL THEN
        UPDATE tb_documentos
        SET bl_embeddings_gerados = TRUE,
            dt_ultimo_processamento = CURRENT_TIMESTAMP
        WHERE id_documento = NEW.id_documento;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marcar_embeddings ON tb_document_chunks;
CREATE TRIGGER trigger_marcar_embeddings
AFTER UPDATE ON tb_document_chunks
FOR EACH ROW
EXECUTE FUNCTION marcar_embeddings_gerados();

-- ============================================================================
-- 8. VIEWS
-- ============================================================================

-- View para documentos com estatísticas de processamento
CREATE OR REPLACE VIEW vw_documentos_rag_stats AS
SELECT
    d.id_documento,
    d.id_documento_store,
    d.nm_arquivo,
    d.nm_status_processamento,
    d.nr_chunks_count,
    d.bl_embeddings_gerados,
    d.dt_ultimo_processamento,
    COUNT(DISTINCT c.id_chunk) as nr_chunks_atual,
    COUNT(DISTINCT CASE WHEN c.embedding IS NOT NULL THEN c.id_chunk END) as nr_chunks_com_embedding,
    MAX(j.dt_conclusao) as dt_ultimo_job,
    MAX(j.nm_status) as nm_status_ultimo_job
FROM tb_documentos d
LEFT JOIN tb_document_chunks c ON d.id_documento = c.id_documento
LEFT JOIN tb_processing_jobs j ON d.id_documento = j.id_documento
GROUP BY d.id_documento, d.id_documento_store, d.nm_arquivo,
         d.nm_status_processamento, d.nr_chunks_count,
         d.bl_embeddings_gerados, d.dt_ultimo_processamento;

COMMENT ON VIEW vw_documentos_rag_stats IS 'View com estatísticas de processamento RAG por documento';

-- View para estatísticas de Document Store
CREATE OR REPLACE VIEW vw_document_store_rag_stats AS
SELECT
    ds.id_documento_store,
    ds.nm_documento_store,
    COUNT(DISTINCT d.id_documento) as nr_total_documentos,
    COUNT(DISTINCT c.id_chunk) as nr_total_chunks,
    COUNT(DISTINCT CASE WHEN c.embedding IS NOT NULL THEN c.id_chunk END) as nr_chunks_com_embedding,
    COUNT(DISTINCT CASE WHEN d.bl_embeddings_gerados THEN d.id_documento END) as nr_documentos_processados,
    AVG(d.nr_chunks_count) as nr_media_chunks_por_doc,
    MAX(d.dt_ultimo_processamento) as dt_ultimo_processamento
FROM tb_documento_store ds
LEFT JOIN tb_documentos d ON ds.id_documento_store = d.id_documento_store
LEFT JOIN tb_document_chunks c ON d.id_documento = c.id_documento
GROUP BY ds.id_documento_store, ds.nm_documento_store;

COMMENT ON VIEW vw_document_store_rag_stats IS 'View com estatísticas RAG por Document Store';

-- ============================================================================
-- 9. DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- ============================================================================

-- Configuração padrão de embedding
-- INSERT INTO tb_embedding_configs (id_documento_store, nm_modelo, nm_provider, nr_dimensoes)
-- SELECT id_documento_store, 'text-embedding-3-small', 'openai', 1536
-- FROM tb_documento_store
-- WHERE NOT EXISTS (
--     SELECT 1 FROM tb_embedding_configs
--     WHERE id_documento_store = tb_documento_store.id_documento_store
-- );

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificar integridade
SELECT 'Migration 005 aplicada com sucesso!' as resultado;
SELECT 'Tabelas criadas: tb_document_chunks, tb_processing_jobs, tb_embedding_configs, tb_search_stats' as tabelas;
SELECT 'Views criadas: vw_documentos_rag_stats, vw_document_store_rag_stats' as views;
SELECT 'Funções criadas: cosine_similarity, busca_semantica' as funcoes;
