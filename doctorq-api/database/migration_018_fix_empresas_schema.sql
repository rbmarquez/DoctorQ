-- =============================================
-- DoctorQ - Migration 018: Fix Empresas Schema
-- =============================================
-- Descrição: Adiciona colunas faltantes na tabela tb_empresas
-- Data: 2025-10-29
-- Versão: 1.0
-- =============================================

BEGIN;

-- Adicionar colunas faltantes em tb_empresas
ALTER TABLE tb_empresas
    ADD COLUMN IF NOT EXISTS nm_razao_social VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nm_segmento VARCHAR(100),
    ADD COLUMN IF NOT EXISTS nm_porte VARCHAR(50) DEFAULT 'Pequeno',
    ADD COLUMN IF NOT EXISTS nm_email_contato VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nm_endereco VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nm_pais VARCHAR(100) DEFAULT 'Brasil',
    ADD COLUMN IF NOT EXISTS dt_assinatura DATE,
    ADD COLUMN IF NOT EXISTS dt_vencimento DATE,
    ADD COLUMN IF NOT EXISTS nm_plano VARCHAR(50) DEFAULT 'Free',
    ADD COLUMN IF NOT EXISTS nr_limite_usuarios INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS nr_limite_agentes INTEGER DEFAULT 2,
    ADD COLUMN IF NOT EXISTS nr_limite_document_stores INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS ds_config JSONB,
    ADD COLUMN IF NOT EXISTS ds_logo_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS nm_cor_primaria VARCHAR(7) DEFAULT '#6366f1';

-- Alterar st_ativo de BOOLEAN para VARCHAR(1) para consistência
-- Primeiro, adicione a nova coluna
ALTER TABLE tb_empresas ADD COLUMN IF NOT EXISTS st_ativo_temp VARCHAR(1);

-- Copie os dados convertidos
UPDATE tb_empresas SET st_ativo_temp = CASE WHEN st_ativo = true THEN 'S' ELSE 'N' END WHERE st_ativo_temp IS NULL;

-- Remova a coluna antiga e renomeie a nova
ALTER TABLE tb_empresas DROP COLUMN IF EXISTS st_ativo CASCADE;
ALTER TABLE tb_empresas RENAME COLUMN st_ativo_temp TO st_ativo;

-- Defina o default
ALTER TABLE tb_empresas ALTER COLUMN st_ativo SET DEFAULT 'S';
ALTER TABLE tb_empresas ALTER COLUMN st_ativo SET NOT NULL;

-- Atualizar empresas existentes com valores padrão
UPDATE tb_empresas
SET
    nm_razao_social = COALESCE(nm_razao_social, nm_empresa),
    nm_segmento = COALESCE(nm_segmento, 'Estética e Bem-estar'),
    nm_porte = COALESCE(nm_porte, 'Pequeno'),
    nm_email_contato = COALESCE(nm_email_contato, ds_email),
    nm_plano = COALESCE(nm_plano, 'Free'),
    nr_limite_usuarios = COALESCE(nr_limite_usuarios, 5),
    nr_limite_agentes = COALESCE(nr_limite_agentes, 2),
    nr_limite_document_stores = COALESCE(nr_limite_document_stores, 1),
    nm_cor_primaria = COALESCE(nm_cor_primaria, '#6366f1'),
    nm_pais = COALESCE(nm_pais, 'Brasil')
WHERE nm_razao_social IS NULL
   OR nm_segmento IS NULL
   OR nm_porte IS NULL
   OR nm_plano IS NULL
   OR nm_cor_primaria IS NULL
   OR nm_pais IS NULL;

-- Criar índices úteis
CREATE INDEX IF NOT EXISTS idx_empresas_plano ON tb_empresas(nm_plano);
CREATE INDEX IF NOT EXISTS idx_empresas_segmento ON tb_empresas(nm_segmento);

COMMIT;

-- Verificar a estrutura final
\d tb_empresas