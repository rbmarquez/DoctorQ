-- Migration 024: Adicionar campos st_favorito e ds_metadata às conversas
-- Data: 2025-11-24
-- Descrição: Permite favoritar conversas e armazenar metadados (ex: links de vídeo)

-- 1. Adicionar campo st_favorito
ALTER TABLE tb_conversas_omni
ADD COLUMN IF NOT EXISTS st_favorito BOOLEAN DEFAULT FALSE;

-- 2. Adicionar campo ds_metadata para armazenar dados extras (JSONB)
ALTER TABLE tb_conversas_omni
ADD COLUMN IF NOT EXISTS ds_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Criar índice para conversas favoritas (performance)
CREATE INDEX IF NOT EXISTS idx_conversas_omni_favorito
ON tb_conversas_omni(id_empresa, st_favorito)
WHERE st_favorito = TRUE;

-- 4. Criar índice GIN para busca em metadata JSONB
CREATE INDEX IF NOT EXISTS idx_conversas_omni_metadata
ON tb_conversas_omni USING GIN (ds_metadata);

-- 5. Comentários para documentação
COMMENT ON COLUMN tb_conversas_omni.st_favorito IS 'Indica se a conversa foi marcada como favorita pelo atendente';
COMMENT ON COLUMN tb_conversas_omni.ds_metadata IS 'Metadados da conversa em JSON (ex: video_url, call_sid, tags)';

-- 6. Verificação
DO $$
BEGIN
    RAISE NOTICE 'Migration 024 aplicada com sucesso!';
    RAISE NOTICE 'Campos adicionados: st_favorito, ds_metadata';
    RAISE NOTICE 'Índices criados: idx_conversas_omni_favorito, idx_conversas_omni_metadata';
END $$;
