-- Migration: Central de Atendimento - Configurações e Métricas
-- Data: 2025-11-24
-- Descrição: Adiciona tabela de configurações da central de atendimento
--            e campos auxiliares para métricas de campanhas

-- ============================================================================
-- TABELA: tb_config_central_atendimento
-- Armazena configurações por empresa
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_config_central_atendimento (
    id_config UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL UNIQUE REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Configurações Gerais
    nm_empresa_chat VARCHAR(100) NOT NULL DEFAULT 'Atendimento',
    ds_mensagem_boas_vindas TEXT,
    ds_mensagem_ausencia TEXT,
    ds_mensagem_encerramento TEXT,
    nr_tempo_inatividade INTEGER NOT NULL DEFAULT 30,
    st_encerramento_automatico BOOLEAN NOT NULL DEFAULT true,
    st_pesquisa_satisfacao BOOLEAN NOT NULL DEFAULT true,

    -- Configurações do Bot
    st_bot_ativo BOOLEAN NOT NULL DEFAULT true,
    st_transferencia_automatica BOOLEAN NOT NULL DEFAULT true,
    nr_tentativas_antes_transferir INTEGER NOT NULL DEFAULT 3,
    ds_palavras_transferencia VARCHAR[] DEFAULT ARRAY['atendente', 'humano', 'pessoa'],
    st_resposta_ia BOOLEAN NOT NULL DEFAULT true,
    nm_modelo_ia VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    nr_temperatura_ia DECIMAL(3,2) NOT NULL DEFAULT 0.7,

    -- Configurações de Horário
    st_respeitar_horario BOOLEAN NOT NULL DEFAULT true,
    hr_inicio VARCHAR(5) NOT NULL DEFAULT '08:00',
    hr_fim VARCHAR(5) NOT NULL DEFAULT '18:00',
    ds_dias_semana VARCHAR[] DEFAULT ARRAY['seg', 'ter', 'qua', 'qui', 'sex'],
    st_atender_feriados BOOLEAN NOT NULL DEFAULT false,

    -- Configurações de Notificações
    st_som_mensagem BOOLEAN NOT NULL DEFAULT true,
    st_notificacao_desktop BOOLEAN NOT NULL DEFAULT true,
    st_email_nova_conversa BOOLEAN NOT NULL DEFAULT false,
    st_email_resumo_diario BOOLEAN NOT NULL DEFAULT true,
    nm_email_notificacoes VARCHAR(255),

    -- Configurações Avançadas
    ds_webhook_url VARCHAR(500),
    st_webhook_ativo BOOLEAN NOT NULL DEFAULT false,
    st_rate_limiting BOOLEAN NOT NULL DEFAULT true,
    ds_cor_widget VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    ds_posicao_widget VARCHAR(20) NOT NULL DEFAULT 'bottom-right',

    -- Timestamps
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_config_central_empresa ON tb_config_central_atendimento(id_empresa);

-- Comentários
COMMENT ON TABLE tb_config_central_atendimento IS 'Configurações da Central de Atendimento por empresa';
COMMENT ON COLUMN tb_config_central_atendimento.nr_tempo_inatividade IS 'Tempo em minutos para encerramento automático';
COMMENT ON COLUMN tb_config_central_atendimento.ds_palavras_transferencia IS 'Palavras-chave que disparam transferência para humano';
COMMENT ON COLUMN tb_config_central_atendimento.nr_temperatura_ia IS 'Temperatura do modelo de IA (0.0 a 2.0)';

-- ============================================================================
-- CAMPOS AUXILIARES: tb_campanhas
-- Adiciona campos para controle de rate limiting e métricas diárias
-- ============================================================================

-- Adicionar campo para contagem diária (reset pelo worker)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_campanhas' AND column_name = 'nr_enviados_hoje'
    ) THEN
        ALTER TABLE tb_campanhas ADD COLUMN nr_enviados_hoje INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo para último reset diário
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_campanhas' AND column_name = 'dt_ultimo_reset_diario'
    ) THEN
        ALTER TABLE tb_campanhas ADD COLUMN dt_ultimo_reset_diario DATE;
    END IF;
END $$;

-- ============================================================================
-- CAMPOS AUXILIARES: tb_campanhas_destinatarios
-- Adiciona campo para ID da mensagem externa
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_campanhas_destinatarios' AND column_name = 'id_mensagem_externa'
    ) THEN
        ALTER TABLE tb_campanhas_destinatarios ADD COLUMN id_mensagem_externa VARCHAR(255);
    END IF;
END $$;

-- ============================================================================
-- TRIGGER: Atualizar dt_atualizacao
-- ============================================================================

CREATE OR REPLACE FUNCTION update_config_central_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_config_central_timestamp ON tb_config_central_atendimento;
CREATE TRIGGER trigger_config_central_timestamp
    BEFORE UPDATE ON tb_config_central_atendimento
    FOR EACH ROW
    EXECUTE FUNCTION update_config_central_timestamp();

-- ============================================================================
-- FUNÇÃO: Reset diário de contadores de campanha
-- Pode ser chamada por um cron job ou pelo worker
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_campanhas_diario()
RETURNS void AS $$
BEGIN
    UPDATE tb_campanhas
    SET nr_enviados_hoje = 0,
        dt_ultimo_reset_diario = CURRENT_DATE
    WHERE dt_ultimo_reset_diario IS NULL
       OR dt_ultimo_reset_diario < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONFIRMAR MIGRAÇÃO
-- ============================================================================

SELECT 'Migration 024 - Central de Atendimento Config concluída' AS status;
