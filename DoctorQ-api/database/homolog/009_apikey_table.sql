-- Migration 009: Criar tabela tb_apikey para sistema de API Keys
-- Data: 2025-07-23
-- Descrição: Implementa sistema de autenticação via API Keys

CREATE TABLE IF NOT EXISTS public.tb_apikey (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    "apiKey" varchar NOT NULL,
    "apiSecret" varchar NOT NULL,
    "keyName" varchar NOT NULL,
    "updatedDate" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "PK_tb_apikey" PRIMARY KEY (id)
);

-- Índices para otimização de consultas
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tb_apikey_apiKey" ON public.tb_apikey ("apiKey");
CREATE INDEX IF NOT EXISTS "IDX_tb_apikey_keyName" ON public.tb_apikey ("keyName");
CREATE INDEX IF NOT EXISTS "IDX_tb_apikey_updatedDate" ON public.tb_apikey ("updatedDate");

-- Comentários para documentação
COMMENT ON TABLE public.tb_apikey IS 'Tabela para armazenamento de API Keys para autenticação programática';
COMMENT ON COLUMN public.tb_apikey.id IS 'Identificador único da API Key';
COMMENT ON COLUMN public.tb_apikey."apiKey" IS 'Chave pública da API (formato: vf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)';
COMMENT ON COLUMN public.tb_apikey."apiSecret" IS 'Chave secreta criptografada da API';
COMMENT ON COLUMN public.tb_apikey."keyName" IS 'Nome descritivo da API Key';
COMMENT ON COLUMN public.tb_apikey."updatedDate" IS 'Data de última atualização da API Key';