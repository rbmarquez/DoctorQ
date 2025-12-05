-- Migration: Criar tabela tb_plano_telas_config
-- Armazena as configurações de visibilidade de telas por plano (service)

-- Criar tabela de configuração de telas por plano
CREATE TABLE IF NOT EXISTS tb_plano_telas_config (
    id_plano_tela UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_service UUID NOT NULL REFERENCES tb_partner_service_definitions(id_service) ON DELETE CASCADE,
    cd_tela VARCHAR(100) NOT NULL,
    fg_visivel BOOLEAN NOT NULL DEFAULT true,
    dt_criacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(id_service, cd_tela)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_plano_telas_service ON tb_plano_telas_config(id_service);
CREATE INDEX IF NOT EXISTS idx_plano_telas_tela ON tb_plano_telas_config(cd_tela);
CREATE INDEX IF NOT EXISTS idx_plano_telas_visivel ON tb_plano_telas_config(fg_visivel);

-- Comentários
COMMENT ON TABLE tb_plano_telas_config IS 'Configuração de visibilidade de telas por plano de parceiro';
COMMENT ON COLUMN tb_plano_telas_config.id_service IS 'Referência ao plano/serviço (tb_partner_service_definitions)';
COMMENT ON COLUMN tb_plano_telas_config.cd_tela IS 'Código identificador da tela (ex: profissional_dashboard, clinica_pacientes)';
COMMENT ON COLUMN tb_plano_telas_config.fg_visivel IS 'Flag indicando se a tela está visível para este plano';

-- Trigger para atualizar dt_atualizacao
CREATE OR REPLACE FUNCTION update_plano_telas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_plano_telas_updated_at ON tb_plano_telas_config;
CREATE TRIGGER trigger_plano_telas_updated_at
    BEFORE UPDATE ON tb_plano_telas_config
    FOR EACH ROW
    EXECUTE FUNCTION update_plano_telas_updated_at();
