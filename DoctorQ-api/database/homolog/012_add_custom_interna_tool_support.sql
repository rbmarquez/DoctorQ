-- Migração: Adicionar suporte ao tool_type 'custom_interna'
-- Data: 2025-08-08
-- Descrição: Atualiza a constraint do campo tp_tool para aceitar o tipo 'custom_interna'

-- Remove a constraint existente
ALTER TABLE tb_tools DROP CONSTRAINT IF EXISTS tb_tools_tp_tool_check;

-- Adiciona a nova constraint incluindo 'custom_interna'
ALTER TABLE tb_tools ADD CONSTRAINT tb_tools_tp_tool_check 
    CHECK (tp_tool IN ('api', 'function', 'external', 'rag', 'mcp', 'custom_interna'));

-- Comentário da tabela atualizado
COMMENT ON COLUMN tb_tools.tp_tool IS 'Tipo do tool: api, function, external, rag, mcp, custom_interna';