-- =====================================================================
-- Migration 033: Adicionar campo de desconto anual
-- Data: 10/11/2025
-- Autor: DoctorQ System
-- Descrição: Adiciona campo pc_desconto_anual para armazenar o percentual
--            de desconto aplicado em planos anuais
-- =====================================================================

BEGIN;

-- 1. Adicionar coluna pc_desconto_anual à tabela tb_partner_service_definitions
ALTER TABLE tb_partner_service_definitions
ADD COLUMN IF NOT EXISTS pc_desconto_anual DECIMAL(5, 2) DEFAULT 17.00;

-- 2. Atualizar valores existentes (17% como padrão = 0.17)
UPDATE tb_partner_service_definitions
SET pc_desconto_anual = 17.00
WHERE pc_desconto_anual IS NULL;

-- 3. Adicionar comentário
COMMENT ON COLUMN tb_partner_service_definitions.pc_desconto_anual
IS 'Percentual de desconto para plano anual (ex: 17.00 = 17% de desconto)';

COMMIT;

-- =====================================================================
-- Verificação
-- =====================================================================
SELECT
    cd_service,
    nm_service,
    vl_preco_base,
    pc_desconto_anual,
    ROUND(vl_preco_base * 12 * (1 - pc_desconto_anual/100), 2) AS vl_anual_com_desconto
FROM tb_partner_service_definitions
WHERE cd_service LIKE 'PLAN_%'
ORDER BY cd_service
LIMIT 10;
