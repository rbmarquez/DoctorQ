-- Adicionar coluna st_principal Ã  tabela tb_agentes
-- Data: 2025-09-03

ALTER TABLE tb_agentes 
ADD COLUMN st_principal BOOLEAN DEFAULT FALSE;

-- ComentÃ¡rio da coluna
COMMENT ON COLUMN tb_agentes.st_principal IS 'Indica se o agente Ã© principal/prioritÃ¡rio (padrÃ£o: false)';
