-- Limpeza de registros SEI das tabelas tb_record_manager e tb_documentos
-- Data: $(date)

-- 1. Deletar todos os registros da tabela tb_record_manager onde namespace comeÃ§a com 'sei_'
DELETE FROM public.tb_record_manager 
WHERE namespace LIKE 'sei_%';

-- 2. Deletar todos os registros da tabela tb_documentos onde metadata->>'record_manager_namespace' comeÃ§a com 'sei_'
DELETE FROM public.tb_documentos 
WHERE metadata->>'record_manager_namespace' LIKE 'sei_%';

-- 3. Opcional: Verificar quantos registros foram deletados (comentado para nÃ£o executar automaticamente)
-- SELECT 
--     (SELECT COUNT(*) FROM public.tb_record_manager WHERE namespace LIKE 'sei_%') as registros_sei_record_manager,
--     (SELECT COUNT(*) FROM public.tb_documentos WHERE metadata->>'record_manager_namespace' LIKE 'sei_%') as registros_sei_documentos; 
