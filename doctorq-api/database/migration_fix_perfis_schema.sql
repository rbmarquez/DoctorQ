-- Migration: Fix tb_perfis schema to match model
-- Date: 2025-10-27
-- Description: Add missing columns id_empresa, nm_tipo, st_ativo, dt_atualizacao

BEGIN;

-- Add missing columns
ALTER TABLE tb_perfis
  ADD COLUMN IF NOT EXISTS id_empresa UUID,
  ADD COLUMN IF NOT EXISTS nm_tipo VARCHAR(20) DEFAULT 'custom' NOT NULL,
  ADD COLUMN IF NOT EXISTS st_ativo CHAR(1) DEFAULT 'S' NOT NULL,
  ADD COLUMN IF NOT EXISTS dt_atualizacao TIMESTAMP DEFAULT NOW() NOT NULL;

-- Add foreign key for id_empresa
ALTER TABLE tb_perfis
  ADD CONSTRAINT tb_perfis_id_empresa_fkey
  FOREIGN KEY (id_empresa)
  REFERENCES tb_empresas(id_empresa)
  ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_perfis_empresa ON tb_perfis(id_empresa);
CREATE INDEX IF NOT EXISTS idx_perfis_tipo ON tb_perfis(nm_tipo);
CREATE INDEX IF NOT EXISTS idx_perfis_ativo ON tb_perfis(st_ativo);

-- Update existing perfis to have default values
UPDATE tb_perfis
SET nm_tipo = 'system'
WHERE nm_perfil IN ('admin', 'gestor', 'operador');

UPDATE tb_perfis
SET st_ativo = 'S'
WHERE st_ativo IS NULL;

UPDATE tb_perfis
SET dt_atualizacao = dt_criacao
WHERE dt_atualizacao IS NULL;

COMMIT;

-- Verify the changes
\d tb_perfis
