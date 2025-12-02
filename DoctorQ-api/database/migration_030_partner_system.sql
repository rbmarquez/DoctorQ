-- ============================================================================
-- Migration 030: Partner System Tables
-- Descrição: Cria as 6 tabelas do sistema de parceria/licenciamento
-- Data: 2025-11-08
-- Autor: Sistema DoctorQ
-- ============================================================================

-- Tabela 1: Definições de Serviços (Catálogo de Produtos)
-- Armazena os serviços/produtos que podem ser licenciados
CREATE TABLE IF NOT EXISTS tb_partner_service_definitions (
    id_service UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cd_service VARCHAR(64) NOT NULL UNIQUE,
    nm_service VARCHAR(255) NOT NULL,
    ds_resumo TEXT,
    ds_descricao_completa TEXT,
    vl_preco_base NUMERIC(12, 2),
    nm_currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
    ds_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    tp_categoria VARCHAR(32) NOT NULL DEFAULT 'plano_base',
    fg_is_addon BOOLEAN NOT NULL DEFAULT FALSE,
    ds_metadata JSONB,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    st_ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes para tb_partner_service_definitions
CREATE INDEX idx_partner_service_definitions_code ON tb_partner_service_definitions(cd_service);
CREATE INDEX idx_partner_service_definitions_category ON tb_partner_service_definitions(tp_categoria);
CREATE INDEX idx_partner_service_definitions_active ON tb_partner_service_definitions(st_ativo);

-- Tabela 2: Leads de Parceiros (Clínicas/Empresas Interessadas)
-- Armazena informações de contato e interesse de potenciais parceiros
CREATE TABLE IF NOT EXISTS tb_partner_leads (
    id_partner_lead UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tp_partner VARCHAR(32) NOT NULL,
    nm_contato VARCHAR(255) NOT NULL,
    nm_email VARCHAR(255) NOT NULL,
    nm_telefone VARCHAR(32),
    nm_empresa VARCHAR(255) NOT NULL,
    nr_cnpj VARCHAR(32),
    ds_endereco TEXT,
    nm_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    ds_notes TEXT,
    ds_metadata JSONB,
    id_empresa UUID,
    id_user UUID,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_converted TIMESTAMP WITH TIME ZONE,
    dt_contacted TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_partner_lead_empresa FOREIGN KEY (id_empresa)
        REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,
    CONSTRAINT fk_partner_lead_user FOREIGN KEY (id_user)
        REFERENCES tb_users(id_user) ON DELETE SET NULL
);

-- Indexes para tb_partner_leads
CREATE INDEX idx_partner_leads_email ON tb_partner_leads(nm_email);
CREATE INDEX idx_partner_leads_cnpj ON tb_partner_leads(nr_cnpj);
CREATE INDEX idx_partner_leads_status ON tb_partner_leads(nm_status);
CREATE INDEX idx_partner_leads_partner_type ON tb_partner_leads(tp_partner);
CREATE INDEX idx_partner_leads_empresa ON tb_partner_leads(id_empresa);

-- Tabela 3: Serviços Solicitados pelo Lead
-- Associa leads aos serviços/produtos que desejam contratar
CREATE TABLE IF NOT EXISTS tb_partner_lead_services (
    id_partner_lead_service UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_partner_lead UUID NOT NULL,
    id_service UUID NOT NULL,
    qt_quantity INTEGER NOT NULL DEFAULT 1,
    ds_metadata JSONB,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT fk_partner_lead_service_lead FOREIGN KEY (id_partner_lead)
        REFERENCES tb_partner_leads(id_partner_lead) ON DELETE CASCADE,
    CONSTRAINT fk_partner_lead_service_service FOREIGN KEY (id_service)
        REFERENCES tb_partner_service_definitions(id_service) ON DELETE RESTRICT,
    CONSTRAINT uq_partner_lead_service UNIQUE (id_partner_lead, id_service)
);

-- Indexes para tb_partner_lead_services
CREATE INDEX idx_partner_lead_services_lead ON tb_partner_lead_services(id_partner_lead);
CREATE INDEX idx_partner_lead_services_service ON tb_partner_lead_services(id_service);

-- Tabela 4: Pacotes de Parceria (Contratos)
-- Armazena os pacotes/contratos criados a partir de leads convertidos
CREATE TABLE IF NOT EXISTS tb_partner_packages (
    id_partner_package UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_partner_lead UUID,
    cd_package VARCHAR(64) NOT NULL UNIQUE,
    nm_package VARCHAR(255) NOT NULL,
    nm_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    nm_billing_cycle VARCHAR(32) NOT NULL DEFAULT 'monthly',
    vl_total NUMERIC(12, 2),
    nm_currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
    ds_contract_url VARCHAR(500),
    ds_notes TEXT,
    ds_metadata JSONB,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_ativacao TIMESTAMP WITH TIME ZONE,
    dt_expiracao TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_partner_package_lead FOREIGN KEY (id_partner_lead)
        REFERENCES tb_partner_leads(id_partner_lead) ON DELETE SET NULL
);

-- Indexes para tb_partner_packages
CREATE INDEX idx_partner_packages_code ON tb_partner_packages(cd_package);
CREATE INDEX idx_partner_packages_status ON tb_partner_packages(nm_status);
CREATE INDEX idx_partner_packages_lead ON tb_partner_packages(id_partner_lead);

-- Tabela 5: Itens do Pacote (Serviços Licenciados)
-- Detalhamento dos serviços/produtos incluídos em cada pacote
CREATE TABLE IF NOT EXISTS tb_partner_package_items (
    id_partner_package_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_partner_package UUID NOT NULL,
    id_service UUID NOT NULL,
    qt_licenses INTEGER NOT NULL DEFAULT 1,
    vl_unitario NUMERIC(12, 2),
    ds_preco_label VARCHAR(255),
    nm_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    ds_metadata JSONB,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT fk_partner_package_item_package FOREIGN KEY (id_partner_package)
        REFERENCES tb_partner_packages(id_partner_package) ON DELETE CASCADE,
    CONSTRAINT fk_partner_package_item_service FOREIGN KEY (id_service)
        REFERENCES tb_partner_service_definitions(id_service) ON DELETE RESTRICT,
    CONSTRAINT uq_partner_package_item UNIQUE (id_partner_package, id_service)
);

-- Indexes para tb_partner_package_items
CREATE INDEX idx_partner_package_items_package ON tb_partner_package_items(id_partner_package);
CREATE INDEX idx_partner_package_items_service ON tb_partner_package_items(id_service);
CREATE INDEX idx_partner_package_items_status ON tb_partner_package_items(nm_status);

-- Tabela 6: Licenças Individuais (Chaves de Ativação)
-- Gerencia as licenças individuais geradas para cada item do pacote
CREATE TABLE IF NOT EXISTS tb_partner_licenses (
    id_partner_license UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_partner_package_item UUID NOT NULL,
    cd_license VARCHAR(128) NOT NULL UNIQUE,
    nm_assigned_to VARCHAR(255),
    nm_assigned_email VARCHAR(255),
    nm_status VARCHAR(32) NOT NULL DEFAULT 'available',
    ds_metadata JSONB,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_ativacao TIMESTAMP WITH TIME ZONE,
    dt_revogacao TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_partner_license_package_item FOREIGN KEY (id_partner_package_item)
        REFERENCES tb_partner_package_items(id_partner_package_item) ON DELETE CASCADE
);

-- Indexes para tb_partner_licenses
CREATE INDEX idx_partner_licenses_package_item ON tb_partner_licenses(id_partner_package_item);
CREATE INDEX idx_partner_licenses_license_key ON tb_partner_licenses(cd_license);
CREATE INDEX idx_partner_licenses_status ON tb_partner_licenses(nm_status);
CREATE INDEX idx_partner_licenses_assigned_email ON tb_partner_licenses(nm_assigned_email);

-- ============================================================================
-- Dados Iniciais (Seed Data)
-- ============================================================================

-- Serviços Base (Catálogo de Produtos)
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

-- ============================================================================
-- Comentários nas Tabelas
-- ============================================================================

COMMENT ON TABLE tb_partner_service_definitions IS 'Catálogo de serviços/produtos que podem ser licenciados via programa de parceria';
COMMENT ON TABLE tb_partner_leads IS 'Leads de potenciais parceiros (clínicas/empresas interessadas)';
COMMENT ON TABLE tb_partner_lead_services IS 'Serviços solicitados por cada lead';
COMMENT ON TABLE tb_partner_packages IS 'Pacotes/contratos criados para parceiros';
COMMENT ON TABLE tb_partner_package_items IS 'Itens (serviços) incluídos em cada pacote';
COMMENT ON TABLE tb_partner_licenses IS 'Licenças individuais geradas para ativação de serviços';

-- ============================================================================
-- Verificação Final
-- ============================================================================

-- Contar registros de serviços iniciais
SELECT 'Serviços cadastrados: ' || COUNT(*)::text FROM tb_partner_service_definitions;

-- Mostrar estrutura das tabelas criadas
SELECT 'Tabelas criadas:' as info;
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'tb_partner_%'
ORDER BY tablename;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
