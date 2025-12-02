-- ============================================================================
-- Migration 031: Partner System - Upgrade & Multi-Unit Support
-- Descrição: Atualiza sistema de parcerias com múltiplas unidades e upgrade
-- Data: 2025-11-10
-- Autor: Sistema DoctorQ
-- Referência: DOC_Arquitetura/CASOS_DE_USO/UC_SISTEMA_PARCERIAS.md
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Criar ENUM para categorias de planos (se não existir)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_plan_category') THEN
        CREATE TYPE enum_plan_category AS ENUM ('clinica', 'profissional', 'fornecedor', 'addon');
    END IF;
END $$;

-- ============================================================================
-- 2. Atualizar tb_partner_service_definitions para suportar novas categorias
-- ============================================================================

-- Adicionar coluna qt_max_licenses se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_partner_service_definitions'
        AND column_name = 'qt_max_licenses'
    ) THEN
        ALTER TABLE tb_partner_service_definitions
        ADD COLUMN qt_max_licenses INTEGER DEFAULT NULL;
    END IF;
END $$;

-- Atualizar descrição completa se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_partner_service_definitions'
        AND column_name = 'ds_descricao_completa'
    ) THEN
        ALTER TABLE tb_partner_service_definitions
        ADD COLUMN ds_descricao_completa TEXT;
    END IF;
END $$;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN tb_partner_service_definitions.qt_max_licenses IS 'Quantidade máxima de licenças/usuários permitidos no plano (NULL = ilimitado)';
COMMENT ON COLUMN tb_partner_service_definitions.tp_categoria IS 'Categoria do serviço: clinica, profissional, fornecedor, addon';
COMMENT ON COLUMN tb_partner_service_definitions.ds_metadata IS 'Metadados flexíveis: max_appointments_month, api_access, white_label, etc.';

-- ============================================================================
-- 3. Criar tabela N:N entre profissionais e clínicas (múltiplas unidades)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tb_profissionais_clinicas (
    id_profissional_clinica UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_profissional UUID NOT NULL,
    id_clinica UUID NOT NULL,
    dt_vinculo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    st_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ds_observacoes TEXT,

    CONSTRAINT fk_profissionais_clinicas_prof
        FOREIGN KEY (id_profissional) REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    CONSTRAINT fk_profissionais_clinicas_clinica
        FOREIGN KEY (id_clinica) REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,
    CONSTRAINT uq_profissional_clinica UNIQUE (id_profissional, id_clinica)
);

-- Indexes para tb_profissionais_clinicas
CREATE INDEX IF NOT EXISTS idx_profissionais_clinicas_prof ON tb_profissionais_clinicas(id_profissional);
CREATE INDEX IF NOT EXISTS idx_profissionais_clinicas_clinica ON tb_profissionais_clinicas(id_clinica);
CREATE INDEX IF NOT EXISTS idx_profissionais_clinicas_ativo ON tb_profissionais_clinicas(st_ativo);

COMMENT ON TABLE tb_profissionais_clinicas IS 'Relacionamento N:N entre profissionais e clínicas - suporta múltiplas unidades';
COMMENT ON COLUMN tb_profissionais_clinicas.dt_vinculo IS 'Data de vínculo do profissional com a clínica/unidade';

-- ============================================================================
-- 4. Criar tabela de histórico de mudanças de pacotes (upgrades/downgrades)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tb_partner_package_history (
    id_history UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_partner_package UUID NOT NULL,
    id_service_old UUID,
    id_service_new UUID NOT NULL,
    tp_change VARCHAR(32) NOT NULL, -- 'upgrade', 'downgrade', 'add_licenses', 'add_addon', 'remove_addon'
    vl_prorata_charged NUMERIC(12, 2),
    nm_currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
    qt_dias_restantes INTEGER,
    dt_change TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ds_reason TEXT,
    id_user_action UUID, -- Quem fez a mudança (admin ou parceiro)
    ds_metadata JSONB,

    CONSTRAINT fk_package_history_package
        FOREIGN KEY (id_partner_package) REFERENCES tb_partner_packages(id_partner_package) ON DELETE CASCADE,
    CONSTRAINT fk_package_history_service_old
        FOREIGN KEY (id_service_old) REFERENCES tb_partner_service_definitions(id_service) ON DELETE SET NULL,
    CONSTRAINT fk_package_history_service_new
        FOREIGN KEY (id_service_new) REFERENCES tb_partner_service_definitions(id_service) ON DELETE RESTRICT,
    CONSTRAINT fk_package_history_user
        FOREIGN KEY (id_user_action) REFERENCES tb_users(id_user) ON DELETE SET NULL
);

-- Indexes para tb_partner_package_history
CREATE INDEX IF NOT EXISTS idx_package_history_package ON tb_partner_package_history(id_partner_package);
CREATE INDEX IF NOT EXISTS idx_package_history_change_type ON tb_partner_package_history(tp_change);
CREATE INDEX IF NOT EXISTS idx_package_history_date ON tb_partner_package_history(dt_change DESC);

COMMENT ON TABLE tb_partner_package_history IS 'Histórico de mudanças de planos (upgrade/downgrade/add-ons)';
COMMENT ON COLUMN tb_partner_package_history.tp_change IS 'Tipo: upgrade, downgrade, add_licenses, add_addon, remove_addon';
COMMENT ON COLUMN tb_partner_package_history.vl_prorata_charged IS 'Valor cobrado/creditado no pro-rata';
COMMENT ON COLUMN tb_partner_package_history.qt_dias_restantes IS 'Dias restantes no ciclo de cobrança no momento da mudança';

-- ============================================================================
-- 5. Atualizar catálogo de serviços com planos específicos por tipo
-- ============================================================================

-- Remover serviços antigos genéricos (soft delete)
UPDATE tb_partner_service_definitions
SET st_ativo = FALSE
WHERE cd_service IN ('PLAN_STARTER', 'PLAN_PROFESSIONAL', 'PLAN_ENTERPRISE');

-- Inserir novos planos para CLÍNICAS
INSERT INTO tb_partner_service_definitions (
    cd_service,
    nm_service,
    ds_resumo,
    ds_descricao_completa,
    vl_preco_base,
    nm_currency,
    ds_features,
    tp_categoria,
    fg_is_addon,
    qt_max_licenses,
    ds_metadata
) VALUES
-- Planos para Clínicas
(
    'PLAN_CLINIC_BASIC',
    'Clínica Básico',
    'Ideal para clínicas pequenas com até 5 profissionais',
    'Plano completo para clínicas iniciantes com até 5 profissionais/usuários. Inclui agenda inteligente, gestão de pacientes, relatórios básicos e perfil no marketplace.',
    299.00,
    'BRL',
    '["Até 5 profissionais/usuários", "200 agendamentos/mês", "Gestão de pacientes e prontuários", "Agenda inteligente", "Perfil no marketplace", "Relatórios básicos", "Suporte por email"]'::jsonb,
    'clinica',
    FALSE,
    5,
    '{"max_professionals": 5, "max_appointments_month": 200, "storage_gb": 5, "marketplace_profile": true, "basic_reports": true, "support_level": "email"}'::jsonb
),
(
    'PLAN_CLINIC_INTERMEDIATE',
    'Clínica Intermediário',
    'Para clínicas médias com até 15 profissionais',
    'Plano intermediário para clínicas em crescimento com até 15 profissionais. Inclui todas as funcionalidades do Básico + campanhas de marketing, integração WhatsApp e relatórios avançados.',
    599.00,
    'BRL',
    '["Até 15 profissionais/usuários", "750 agendamentos/mês", "Tudo do Básico", "Campanhas de marketing", "Integração WhatsApp Business", "Relatórios avançados", "Gestão financeira", "Suporte prioritário"]'::jsonb,
    'clinica',
    FALSE,
    15,
    '{"max_professionals": 15, "max_appointments_month": 750, "storage_gb": 20, "marketing_campaigns": true, "whatsapp_integration": true, "advanced_reports": true, "financial_management": true, "support_level": "priority"}'::jsonb
),
(
    'PLAN_CLINIC_ADVANCED',
    'Clínica Avançado',
    'Para redes de clínicas com até 30 profissionais',
    'Plano avançado para redes de clínicas com até 30 profissionais. Inclui múltiplas unidades, API de integração, BI avançado, gestão multiusuário e atendimento dedicado.',
    1199.00,
    'BRL',
    '["Até 30 profissionais/usuários", "2000 agendamentos/mês", "Tudo do Intermediário", "Unidades ilimitadas", "API de integração", "BI e Analytics avançado", "Gestão de estoque", "White-label parcial", "Atendimento dedicado"]'::jsonb,
    'clinica',
    FALSE,
    30,
    '{"max_professionals": 30, "max_appointments_month": 2000, "storage_gb": 100, "unlimited_units": true, "api_access": true, "bi_analytics": true, "inventory_management": true, "white_label_partial": true, "support_level": "dedicated"}'::jsonb
),
(
    'PLAN_CLINIC_CUSTOM',
    'Clínica Personalizado',
    'Plano sob medida para redes grandes (30+ profissionais)',
    'Solução empresarial totalmente customizável para grandes redes de clínicas. Inclui tudo do Avançado + profissionais ilimitados, SLA customizado, treinamentos exclusivos e gerente de conta.',
    0.00,
    'BRL',
    '["Profissionais ilimitados", "Agendamentos ilimitados", "Tudo do Avançado", "Customizações sob demanda", "SLA customizado", "Treinamentos exclusivos", "Gerente de conta dedicado", "White-label completo"]'::jsonb,
    'clinica',
    FALSE,
    NULL,
    '{"custom": true, "unlimited": true, "negotiable": true, "sla_custom": true, "exclusive_training": true, "account_manager": true, "white_label_full": true}'::jsonb
),

-- Planos para Profissionais Autônomos
(
    'PLAN_PROF_SOLO',
    'Profissional Solo',
    'Para profissionais autônomos que trabalham sozinhos',
    'Plano individual para profissionais autônomos. Agenda pessoal, perfil destacado no marketplace, gestão de pacientes e relatórios básicos.',
    99.00,
    'BRL',
    '["1 profissional", "100 agendamentos/mês", "Perfil no marketplace", "Agenda pessoal", "Gestão de pacientes", "Prontuário eletrônico", "Relatórios básicos"]'::jsonb,
    'profissional',
    FALSE,
    1,
    '{"max_professionals": 1, "max_appointments_month": 100, "storage_gb": 2, "marketplace_featured": true, "basic_reports": true}'::jsonb
),
(
    'PLAN_PROF_PLUS',
    'Profissional Plus',
    'Para profissionais com assistentes ou que trabalham em múltiplos locais',
    'Plano para profissionais que precisam de mais recursos. Inclui assistentes, múltiplas unidades de atendimento e integração WhatsApp.',
    199.00,
    'BRL',
    '["Até 3 usuários (assistentes)", "300 agendamentos/mês", "Tudo do Solo", "Múltiplas unidades", "Integração WhatsApp", "Campanhas de marketing", "Relatórios avançados"]'::jsonb,
    'profissional',
    FALSE,
    3,
    '{"max_professionals": 3, "max_appointments_month": 300, "storage_gb": 10, "multiple_units": true, "whatsapp_integration": true, "marketing_campaigns": true, "advanced_reports": true}'::jsonb
),
(
    'PLAN_PROF_PREMIUM',
    'Profissional Premium',
    'Para profissionais de alta demanda com equipe completa',
    'Plano premium para profissionais com alta demanda. Equipe completa, prioridade no marketplace, BI avançado e suporte VIP.',
    349.00,
    'BRL',
    '["Até 5 usuários", "Agendamentos ilimitados", "Tudo do Plus", "Prioridade no marketplace", "BI e Analytics", "CRM avançado", "Automações de marketing", "Suporte VIP"]'::jsonb,
    'profissional',
    FALSE,
    5,
    '{"max_professionals": 5, "max_appointments_month": null, "storage_gb": 50, "marketplace_priority": true, "bi_analytics": true, "advanced_crm": true, "marketing_automation": true, "support_level": "vip"}'::jsonb
),

-- Planos para Fornecedores (Marketplace)
(
    'PLAN_SUPPLIER_STARTER',
    'Fornecedor Starter',
    'Para fornecedores iniciantes no marketplace',
    'Plano básico para fornecedores. Cadastro de até 20 produtos, perfil no marketplace e gestão de pedidos.',
    199.00,
    'BRL',
    '["Até 20 produtos", "Perfil no marketplace", "Gestão de pedidos", "Até 50 transações/mês", "Relatórios básicos", "Suporte por email"]'::jsonb,
    'fornecedor',
    FALSE,
    NULL,
    '{"max_products": 20, "max_transactions_month": 50, "marketplace_profile": true, "order_management": true, "basic_reports": true, "support_level": "email"}'::jsonb
),
(
    'PLAN_SUPPLIER_BUSINESS',
    'Fornecedor Business',
    'Para fornecedores estabelecidos com catálogo médio',
    'Plano para fornecedores estabelecidos. Produtos ilimitados, destaque no marketplace, integração de estoque e CRM.',
    499.00,
    'BRL',
    '["Produtos ilimitados", "Até 200 transações/mês", "Tudo do Starter", "Destaque no marketplace", "Integração de estoque", "CRM de clientes", "Campanhas promocionais", "Relatórios avançados"]'::jsonb,
    'fornecedor',
    FALSE,
    NULL,
    '{"max_products": null, "max_transactions_month": 200, "marketplace_featured": true, "inventory_integration": true, "customer_crm": true, "promotional_campaigns": true, "advanced_reports": true}'::jsonb
),
(
    'PLAN_SUPPLIER_ENTERPRISE',
    'Fornecedor Enterprise',
    'Para grandes fornecedores e distribuidores',
    'Solução empresarial para grandes fornecedores. Transações ilimitadas, API de integração, BI avançado e gerente de conta.',
    999.00,
    'BRL',
    '["Produtos e transações ilimitados", "Tudo do Business", "API de integração", "Prioridade máxima", "BI e Analytics", "Gestão de representantes", "Gerente de conta", "SLA customizado"]'::jsonb,
    'fornecedor',
    FALSE,
    NULL,
    '{"unlimited": true, "api_access": true, "marketplace_priority_max": true, "bi_analytics": true, "representative_management": true, "account_manager": true, "sla_custom": true}'::jsonb
),

-- Add-ons Universais (compatíveis com todos os tipos)
(
    'ADDON_EXTRA_USERS',
    'Pacote de Usuários Extras',
    'Adicione mais 5 usuários/profissionais ao seu plano',
    'Expanda sua capacidade com pacotes de 5 usuários adicionais. Compatível com planos Clínica e Profissional.',
    99.00,
    'BRL',
    '["5 usuários adicionais", "Mantém todas as funcionalidades do plano base", "Pode contratar múltiplos pacotes"]'::jsonb,
    'addon',
    TRUE,
    5,
    '{"addon_type": "licenses", "quantity": 5, "stackable": true, "compatible_with": ["clinica", "profissional"]}'::jsonb
),
(
    'ADDON_WHATSAPP',
    'Integração WhatsApp Business',
    'Integração completa com WhatsApp Business API',
    'Conecte sua conta WhatsApp Business. Envio automático de lembretes, campanhas segmentadas e chatbot.',
    149.00,
    'BRL',
    '["WhatsApp Business API", "Envio automático de lembretes", "Campanhas segmentadas", "Chatbot básico", "Relatórios de engajamento"]'::jsonb,
    'addon',
    TRUE,
    NULL,
    '{"addon_type": "integration", "compatible_with": ["clinica", "profissional", "fornecedor"]}'::jsonb
),
(
    'ADDON_ADVANCED_ANALYTICS',
    'Analytics Avançado',
    'Dashboards e relatórios avançados com BI',
    'Painéis personalizáveis, relatórios exportáveis, análise preditiva e insights de negócio.',
    199.00,
    'BRL',
    '["Dashboards personalizáveis", "Relatórios exportáveis (PDF/Excel)", "Análise preditiva", "KPIs customizados", "Integração com Google Analytics"]'::jsonb,
    'addon',
    TRUE,
    NULL,
    '{"addon_type": "feature", "compatible_with": ["clinica", "profissional", "fornecedor"]}'::jsonb
),
(
    'ADDON_AI_CHATBOT',
    'Chatbot com IA Avançada',
    'Assistente virtual inteligente com IA para atendimento 24/7',
    'Chatbot treinado com IA para atendimento automático, qualificação de leads e agendamentos.',
    249.00,
    'BRL',
    '["IA conversacional avançada", "Atendimento 24/7", "Qualificação automática de leads", "Agendamento inteligente", "Integração multicanal"]'::jsonb,
    'addon',
    TRUE,
    NULL,
    '{"addon_type": "feature", "compatible_with": ["clinica", "profissional"]}'::jsonb
),
(
    'ADDON_MARKETPLACE_BOOST',
    'Impulsionamento no Marketplace',
    'Destaque sua marca no topo do marketplace',
    'Posicionamento prioritário nas buscas, selo de destaque e campanhas promocionais no marketplace.',
    179.00,
    'BRL',
    '["Posicionamento prioritário", "Selo de parceiro destacado", "Campanhas promocionais mensais", "Análise de concorrência", "Suporte de marketing"]'::jsonb,
    'addon',
    TRUE,
    NULL,
    '{"addon_type": "marketing", "compatible_with": ["clinica", "profissional", "fornecedor"]}'::jsonb
),
(
    'ADDON_API_ACCESS',
    'Acesso à API de Integração',
    'API REST completa para integrações customizadas',
    'Acesso à API REST do DoctorQ para integrar com seus sistemas internos, ERPs e ferramentas.',
    299.00,
    'BRL',
    '["API REST completa", "Documentação técnica detalhada", "Webhooks em tempo real", "Suporte técnico dedicado", "SLA de 99.9%"]'::jsonb,
    'addon',
    TRUE,
    NULL,
    '{"addon_type": "integration", "compatible_with": ["clinica", "fornecedor"]}'::jsonb
),
(
    'ADDON_WHITE_LABEL',
    'White Label Completo',
    'Personalize a plataforma com sua marca',
    'Customização completa com sua identidade visual, domínio próprio e remoção da marca DoctorQ.',
    499.00,
    'BRL',
    '["Logo e cores personalizadas", "Domínio próprio (ex: app.suamarca.com.br)", "Remoção da marca DoctorQ", "Emails personalizados", "Aplicativo mobile branded"]'::jsonb,
    'addon',
    TRUE,
    NULL,
    '{"addon_type": "branding", "compatible_with": ["clinica"], "requires_plan": ["PLAN_CLINIC_ADVANCED", "PLAN_CLINIC_CUSTOM"]}'::jsonb
)
ON CONFLICT (cd_service) DO UPDATE SET
    nm_service = EXCLUDED.nm_service,
    ds_resumo = EXCLUDED.ds_resumo,
    ds_descricao_completa = EXCLUDED.ds_descricao_completa,
    vl_preco_base = EXCLUDED.vl_preco_base,
    ds_features = EXCLUDED.ds_features,
    tp_categoria = EXCLUDED.tp_categoria,
    fg_is_addon = EXCLUDED.fg_is_addon,
    qt_max_licenses = EXCLUDED.qt_max_licenses,
    ds_metadata = EXCLUDED.ds_metadata,
    st_ativo = TRUE,
    dt_atualizacao = now();

-- ============================================================================
-- 6. Migrar vínculos existentes para a tabela N:N
-- ============================================================================

-- Copiar relações existentes de tb_profissionais para tb_profissionais_clinicas
INSERT INTO tb_profissionais_clinicas (id_profissional, id_clinica, dt_vinculo, st_ativo)
SELECT
    id_profissional,
    id_clinica,
    dt_criacao,
    st_ativo
FROM tb_profissionais
WHERE id_clinica IS NOT NULL
ON CONFLICT (id_profissional, id_clinica) DO NOTHING;

-- ============================================================================
-- 7. Verificações e Estatísticas
-- ============================================================================

-- Contar serviços por categoria
DO $$
DECLARE
    v_count_clinica INTEGER;
    v_count_prof INTEGER;
    v_count_forn INTEGER;
    v_count_addon INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_clinica FROM tb_partner_service_definitions WHERE tp_categoria = 'clinica' AND st_ativo = TRUE;
    SELECT COUNT(*) INTO v_count_prof FROM tb_partner_service_definitions WHERE tp_categoria = 'profissional' AND st_ativo = TRUE;
    SELECT COUNT(*) INTO v_count_forn FROM tb_partner_service_definitions WHERE tp_categoria = 'fornecedor' AND st_ativo = TRUE;
    SELECT COUNT(*) INTO v_count_addon FROM tb_partner_service_definitions WHERE tp_categoria = 'addon' AND st_ativo = TRUE;

    RAISE NOTICE '=== CATÁLOGO DE SERVIÇOS ATUALIZADO ===';
    RAISE NOTICE 'Planos para Clínicas: %', v_count_clinica;
    RAISE NOTICE 'Planos para Profissionais: %', v_count_prof;
    RAISE NOTICE 'Planos para Fornecedores: %', v_count_forn;
    RAISE NOTICE 'Add-ons Universais: %', v_count_addon;
    RAISE NOTICE 'Total de Serviços Ativos: %', (v_count_clinica + v_count_prof + v_count_forn + v_count_addon);
END $$;

-- Mostrar estrutura das novas tabelas
SELECT 'Novas tabelas criadas:' as info;
SELECT tablename FROM pg_tables
WHERE tablename IN ('tb_profissionais_clinicas', 'tb_partner_package_history')
ORDER BY tablename;

COMMIT;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
