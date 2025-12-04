-- =====================================================================
-- Migration 032: Adicionar campo tp_partner à tb_partner_service_definitions
-- Data: 10/11/2025
-- Autor: DoctorQ System
-- Descrição: Separa o tipo de parceiro (tp_partner) da categoria do plano (tp_categoria)
--            para permitir que cada plano seja específico para um tipo de parceiro
-- =====================================================================

BEGIN;

-- 1. Criar ENUM para tipo de parceiro (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_partner_type') THEN
        CREATE TYPE enum_partner_type AS ENUM ('clinica', 'profissional', 'fornecedor', 'universal');
    END IF;
END $$;

-- 2. Adicionar coluna tp_partner à tabela tb_partner_service_definitions
ALTER TABLE tb_partner_service_definitions
ADD COLUMN IF NOT EXISTS tp_partner VARCHAR(32) DEFAULT 'universal';

-- 3. Atualizar valores existentes baseado no prefixo do cd_service
UPDATE tb_partner_service_definitions
SET tp_partner = 'clinica'
WHERE cd_service LIKE 'PLAN_CLINIC_%';

UPDATE tb_partner_service_definitions
SET tp_partner = 'profissional'
WHERE cd_service LIKE 'PLAN_PROF_%';

UPDATE tb_partner_service_definitions
SET tp_partner = 'fornecedor'
WHERE cd_service LIKE 'PLAN_SUPPLIER_%';

-- 4. Manter valores de tp_categoria para indicar o tipo de plano (não o tipo de parceiro)
-- Os valores válidos de tp_categoria devem ser: 'plano_base', 'oferta', 'diferencial', 'addon'
-- Atualizar tp_categoria para valores que estão como 'clinica', 'profissional', 'fornecedor'
UPDATE tb_partner_service_definitions
SET tp_categoria = 'plano_base'
WHERE tp_categoria IN ('clinica', 'profissional', 'fornecedor');

-- 5. Criar índice para tp_partner
CREATE INDEX IF NOT EXISTS idx_partner_service_definitions_partner_type
ON tb_partner_service_definitions(tp_partner);

-- 6. Adicionar comentários
COMMENT ON COLUMN tb_partner_service_definitions.tp_partner IS 'Tipo de parceiro: clinica, profissional, fornecedor, ou universal (todos)';
COMMENT ON COLUMN tb_partner_service_definitions.tp_categoria IS 'Categoria do plano: plano_base (core), oferta (promotional), diferencial (feature), addon (add-on)';

COMMIT;

-- =====================================================================
-- Verificação
-- =====================================================================
SELECT
    cd_service,
    nm_service,
    tp_partner,
    tp_categoria,
    qt_max_licenses
FROM tb_partner_service_definitions
WHERE cd_service LIKE 'PLAN_%'
ORDER BY tp_partner, cd_service;
