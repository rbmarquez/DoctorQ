-- Migration: Configuração de Visibilidade de Telas
-- Description: Cria tabela para controlar visibilidade de telas por tipo de usuário
-- Date: 2025-11-28

-- ============================================================================
-- TABELA: tb_telas_config
-- Controla quais telas são visíveis para cada tipo de usuário
-- Tipos: publico, paciente, clinica, profissional, fornecedor
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_telas_config (
    id_tela_config UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Identificador único da tela (corresponde ao ID no frontend)
    cd_tela VARCHAR(100) NOT NULL,

    -- Tipo de usuário: publico, paciente, clinica, profissional, fornecedor
    tp_tipo VARCHAR(50) NOT NULL CHECK (tp_tipo IN ('publico', 'paciente', 'clinica', 'profissional', 'fornecedor')),

    -- Se a tela está visível para este tipo de usuário
    fg_visivel BOOLEAN NOT NULL DEFAULT true,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP,

    -- Constraint única: cada tela só pode ter uma configuração por tipo por empresa
    CONSTRAINT uq_telas_config_empresa_tela_tipo UNIQUE (id_empresa, cd_tela, tp_tipo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_telas_config_empresa ON tb_telas_config(id_empresa);
CREATE INDEX IF NOT EXISTS idx_telas_config_tipo ON tb_telas_config(tp_tipo);
CREATE INDEX IF NOT EXISTS idx_telas_config_tela ON tb_telas_config(cd_tela);
CREATE INDEX IF NOT EXISTS idx_telas_config_visivel ON tb_telas_config(fg_visivel);

-- Comentários
COMMENT ON TABLE tb_telas_config IS 'Configuração de visibilidade de telas por tipo de usuário';
COMMENT ON COLUMN tb_telas_config.cd_tela IS 'Identificador único da tela (ex: admin_dashboard, paciente_agendamentos)';
COMMENT ON COLUMN tb_telas_config.tp_tipo IS 'Tipo de usuário: publico, paciente, clinica, profissional, fornecedor';
COMMENT ON COLUMN tb_telas_config.fg_visivel IS 'Se true, tela é visível (sujeita a permissões). Se false, tela é sempre oculta.';

-- ============================================================================
-- DADOS INICIAIS
-- Insere configuração padrão para empresa demo (se existir)
-- Por padrão, todas as telas são visíveis
-- ============================================================================

-- Não inserimos dados iniciais pois a lógica é:
-- Se não existe registro para uma tela/tipo, assume-se fg_visivel = true (visível)
-- Só criamos registros quando o admin desmarca uma tela

-- ============================================================================
-- TRIGGER: Atualização automática de dt_atualizacao
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_update_telas_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_telas_config_timestamp ON tb_telas_config;
CREATE TRIGGER trg_update_telas_config_timestamp
    BEFORE UPDATE ON tb_telas_config
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_telas_config_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada empresa só pode ver/modificar suas próprias configurações
-- ============================================================================

ALTER TABLE tb_telas_config ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
DROP POLICY IF EXISTS rls_telas_config_select ON tb_telas_config;
CREATE POLICY rls_telas_config_select ON tb_telas_config
    FOR SELECT
    USING (
        id_empresa = current_setting('app.current_tenant', true)::uuid
        OR current_setting('app.is_admin', true) = 'true'
    );

-- Policy para INSERT
DROP POLICY IF EXISTS rls_telas_config_insert ON tb_telas_config;
CREATE POLICY rls_telas_config_insert ON tb_telas_config
    FOR INSERT
    WITH CHECK (
        id_empresa = current_setting('app.current_tenant', true)::uuid
        OR current_setting('app.is_admin', true) = 'true'
    );

-- Policy para UPDATE
DROP POLICY IF EXISTS rls_telas_config_update ON tb_telas_config;
CREATE POLICY rls_telas_config_update ON tb_telas_config
    FOR UPDATE
    USING (
        id_empresa = current_setting('app.current_tenant', true)::uuid
        OR current_setting('app.is_admin', true) = 'true'
    );

-- Policy para DELETE
DROP POLICY IF EXISTS rls_telas_config_delete ON tb_telas_config;
CREATE POLICY rls_telas_config_delete ON tb_telas_config
    FOR DELETE
    USING (
        id_empresa = current_setting('app.current_tenant', true)::uuid
        OR current_setting('app.is_admin', true) = 'true'
    );

COMMIT;
