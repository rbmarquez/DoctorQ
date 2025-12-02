-- database/007_add_rag_tool_support.sql
-- Adicionar suporte para tool tipo 'rag' (idempotente e compatível)

-- Atualizar constraint para incluir tipos: rag e superset existentes
ALTER TABLE IF EXISTS public.tb_tools DROP CONSTRAINT IF EXISTS tb_tools_tp_tool_check;
ALTER TABLE IF EXISTS public.tb_tools ADD CONSTRAINT tb_tools_tp_tool_check 
    CHECK (tp_tool IN ('api', 'function', 'external', 'rag', 'custom_interna', 'rag_qdrant', 'rag_postgres', 'mcp'));

-- Atualizar comentário da coluna
COMMENT ON COLUMN public.tb_tools.tp_tool IS 'Tipo do tool: api, function, external, rag, custom_interna, rag_qdrant, rag_postgres, mcp';

-- Inserir tool RAG exemplo (upsert)
INSERT INTO public.tb_tools (
    nm_tool, 
    ds_tool, 
    tp_tool, 
    config_tool, 
    st_ativo
) 
VALUES (
    'documento_search',
    'Tool RAG para buscar documentos relevantes e responder perguntas baseadas em conhecimento',
    'rag',
    '{
        "rag_config": {
            "name": "Busca em Documentos",
            "description": "Busca semantica em documentos usando RAG com algoritmos de similaridade avancados",
            "default_max_results": 5,
            "default_similarity_threshold": 0.7,
            "document_stores": [],
            "namespaces": ["default_embeddings"],
            "enable_hybrid_search": true,
            "search_algorithm": "cosine_similarity",
            "embedding_model": "text-embedding-ada-002",
            "vector_distance_metric": "cosine",
            "rerank_algorithm": "cross_encoder",
            "response_format": "structured",
            "cache_ttl": 300
        },
        "azure_embedding_credential_id": "abbbbe89-232b-44bb-9f5b-a94ab47282b7",
        "enable_logging": true,
        "enable_caching": true
    }',
    true
) 
ON CONFLICT (nm_tool) DO UPDATE SET
    ds_tool = EXCLUDED.ds_tool,
    config_tool = EXCLUDED.config_tool,
    dt_atualizacao = CURRENT_TIMESTAMP;

-- Comentário
COMMENT ON TABLE public.tb_tools IS 'Tabela para armazenar configurações de tools para agentes de IA, incluindo tools RAG para busca em documentos';

DO $$
BEGIN
    RAISE NOTICE 'Suporte para RAG Tool adicionado com sucesso!';
END $$;