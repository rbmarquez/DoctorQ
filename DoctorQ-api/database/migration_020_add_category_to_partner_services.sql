-- Migration 020: Add category field to partner service definitions
-- Date: 2025-11-04
-- Description: Adds category field to tb_partner_service_definitions table

BEGIN;

-- Add category column to partner service definitions
ALTER TABLE tb_partner_service_definitions
ADD COLUMN IF NOT EXISTS tp_categoria VARCHAR(32) NOT NULL DEFAULT 'plano_base'
CHECK (tp_categoria IN ('plano_base', 'oferta', 'diferencial', 'addon'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_partner_services_categoria
ON tb_partner_service_definitions(tp_categoria);

-- Update existing records to have appropriate categories
-- Set PLATAFORMA as plano_base
UPDATE tb_partner_service_definitions
SET tp_categoria = 'plano_base'
WHERE cd_service IN ('PLATAFORMA', 'FREE')
AND tp_categoria = 'plano_base';

-- Set Academy, Chatbot, WhatsApp as ofertas
UPDATE tb_partner_service_definitions
SET tp_categoria = 'oferta'
WHERE cd_service IN ('DOCTORQ_ACADEMY', 'CHATBOT_DOCTORQ', 'WHATSAPP_INTELIGENTE');

-- Set Central Atendimento as diferencial
UPDATE tb_partner_service_definitions
SET tp_categoria = 'diferencial'
WHERE cd_service IN ('CENTRAL_ATENDIMENTO');

COMMIT;

-- Rollback in case of error
-- To rollback this migration, run:
-- ALTER TABLE tb_partner_service_definitions DROP COLUMN IF EXISTS tp_categoria;
-- DROP INDEX IF EXISTS idx_partner_services_categoria;
