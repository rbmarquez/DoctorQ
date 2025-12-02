-- ============================================================================
-- Migration 030b: Partner System Fixes
-- Descrição: Adiciona colunas faltantes nas tabelas do Partner System
-- Data: 2025-11-08
-- ============================================================================

-- Adicionar colunas faltantes em tb_partner_service_definitions
ALTER TABLE tb_partner_service_definitions
ADD COLUMN IF NOT EXISTS nm_currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS ds_descricao_completa TEXT,
ADD COLUMN IF NOT EXISTS fg_is_addon BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ds_metadata JSONB,
ADD COLUMN IF NOT EXISTS dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Adicionar colunas faltantes em tb_partner_leads (se necessário)
ALTER TABLE tb_partner_leads
ADD COLUMN IF NOT EXISTS id_empresa UUID,
ADD COLUMN IF NOT EXISTS id_user UUID;

-- Adicionar foreign keys se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_partner_lead_empresa'
    ) THEN
        ALTER TABLE tb_partner_leads
        ADD CONSTRAINT fk_partner_lead_empresa
        FOREIGN KEY (id_empresa)
        REFERENCES tb_empresas(id_empresa)
        ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_partner_lead_user'
    ) THEN
        ALTER TABLE tb_partner_leads
        ADD CONSTRAINT fk_partner_lead_user
        FOREIGN KEY (id_user)
        REFERENCES tb_users(id_user)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Inserir dados de seed (com conflito ignorado)
INSERT INTO tb_partner_service_definitions (cd_service, nm_service, ds_resumo, vl_preco_base, tp_categoria, fg_is_addon)
VALUES
    ('PLAN_STARTER', 'Plano Starter', 'Plano básico para clínicas iniciantes', 299.00, 'plano_base', FALSE),
    ('PLAN_PROFESSIONAL', 'Plano Professional', 'Plano completo para clínicas estabelecidas', 599.00, 'plano_base', FALSE),
    ('PLAN_ENTERPRISE', 'Plano Enterprise', 'Solução completa para redes de clínicas', 1299.00, 'plano_base', FALSE),
    ('ADDON_EXTRA_USERS', 'Usuários Adicionais', 'Licenças extras de usuários (pacote 5)', 99.00, 'addon', TRUE),
    ('ADDON_WHATSAPP', 'Integração WhatsApp', 'Integração com WhatsApp Business', 149.00, 'addon', TRUE),
    ('ADDON_ADVANCED_ANALYTICS', 'Analytics Avançado', 'Relatórios e dashboards avançados', 199.00, 'addon', TRUE),
    ('ADDON_AI_CHATBOT', 'Chatbot IA', 'Assistente virtual com IA para atendimento', 249.00, 'addon', TRUE)
ON CONFLICT (cd_service) DO NOTHING;

-- Verificação
SELECT 'Migration 030b aplicada com sucesso!' as status;
SELECT 'Serviços cadastrados: ' || COUNT(*)::text FROM tb_partner_service_definitions;
