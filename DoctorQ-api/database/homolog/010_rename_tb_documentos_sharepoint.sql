-- Migration 010: Renomear tabela tb_documentos_sharepoint para tb_documentos (idempotente)

DO $$
DECLARE
  old_table REGCLASS := to_regclass('public.tb_documentos_sharepoint');
  new_table REGCLASS := to_regclass('public.tb_documentos');
BEGIN
  IF old_table IS NOT NULL AND new_table IS NULL THEN
    EXECUTE 'ALTER TABLE public.tb_documentos_sharepoint RENAME TO tb_documentos';
  END IF;

  -- Renomear Ã­ndice se existir
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_tb_documentos_sharepoint_embedding_hnsw'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_tb_documentos_sharepoint_embedding_hnsw RENAME TO idx_tb_documentos_embedding_hnsw';
  END IF;
END $$;