-- Migration: Vectors and embeddings (idempotent)
-- - Checks pgvector extension
-- - Creates documents table with embedding column
-- - Creates HNSW index for vector search

DO $$
DECLARE
  has_vector BOOLEAN := EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  );
BEGIN
  IF NOT has_vector THEN
    RAISE NOTICE 'pgvector (vector) extension not installed. Skipping vector migration.';
    RETURN;
  END IF;

  -- Criar tabela de documentos (idempotente)
  CREATE TABLE IF NOT EXISTS public.tb_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
  );

  -- Comments
  COMMENT ON TABLE public.tb_documentos IS 'Table to store documents and embeddings';
  COMMENT ON COLUMN public.tb_documentos.embedding IS 'Vector embedding (1536 dims)';

  -- HNSW index on embedding (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_tb_documentos_embedding_hnsw'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_tb_documentos_embedding_hnsw
      ON public.tb_documentos USING hnsw (embedding vector_cosine_ops);
  END IF;
END $$;