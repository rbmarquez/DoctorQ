-- Migration 023: Corrigir constraint de pacientes
-- Data: 2025-01-10
-- Objetivo: Remover constraint que obriga vínculo e simplificar lógica

-- 1. REMOVER CONSTRAINT ANTIGA
ALTER TABLE tb_pacientes
DROP CONSTRAINT IF EXISTS chk_paciente_vinculo;

-- 2. PERMITIR AMBOS OPCIONAIS (backend cuida da lógica)
COMMENT ON COLUMN tb_pacientes.id_clinica IS 'ID da clínica (preenchido quando cadastrado por admin/gestor)';
COMMENT ON COLUMN tb_pacientes.id_profissional IS 'ID do profissional (preenchido quando cadastrado por profissional)';

-- 3. VERIFICAR ESTRUTURA
SELECT 'Migration 023 aplicada com sucesso' AS status;
