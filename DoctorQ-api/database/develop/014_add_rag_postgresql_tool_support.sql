-- Migracao: Adicionar suporte ao tool_type 'rag_postgres'
-- Data: 2025-09-02
-- Descricao: Atualiza a constraint do campo tp_tool para aceitar o tipo 'rag_postgres'

-- Remover constraint existente se houver
ALTER TABLE IF EXISTS public.tb_tools DROP CONSTRAINT IF EXISTS tb_tools_tp_tool_check;

-- Adicionar nova constraint incluindo 'rag_postgres'
ALTER TABLE IF EXISTS public.tb_tools ADD CONSTRAINT tb_tools_tp_tool_check 
    CHECK (tp_tool IN ('api', 'function', 'external', 'rag', 'custom_interna', 'rag_qdrant', 'rag_postgres'));

-- Comentario da coluna atualizado
COMMENT ON COLUMN public.tb_tools.tp_tool IS 'Tipo do tool: api, function, external, rag, custom_interna, rag_qdrant, rag_postgres';

DO $$
BEGIN
    RAISE NOTICE 'Suporte para RAG_POSTGRES Tool adicionado com sucesso!';
    RAISE NOTICE 'Tipo de tool "rag_postgres" agora e suportado para busca em documentos via PostgreSQL.';
END $$;