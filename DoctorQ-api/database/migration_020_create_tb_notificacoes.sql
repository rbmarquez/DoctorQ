-- ====================================================================
-- MIGRATION 020 - Criar Tabela tb_notificacoes
-- ====================================================================
-- Data: 09/11/2025
-- Descrição: Cria tabela para sistema de notificações
-- ====================================================================

-- Criar tabela tb_notificacoes
CREATE TABLE IF NOT EXISTS tb_notificacoes (
    -- Identificação
    id_notificacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Tipo e Categoria
    ds_tipo VARCHAR(50) NOT NULL CHECK (ds_tipo IN ('agendamento', 'promocao', 'sistema', 'lembrete', 'avaliacao', 'pagamento', 'mensagem')),
    ds_categoria VARCHAR(100),

    -- Conteúdo
    nm_titulo VARCHAR(255) NOT NULL,
    ds_conteudo TEXT NOT NULL,
    ds_dados_adicionais JSONB,

    -- Prioridade
    ds_prioridade VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (ds_prioridade IN ('baixa', 'normal', 'alta', 'urgente')),

    -- Status de Leitura
    st_lida BOOLEAN NOT NULL DEFAULT false,
    dt_lida TIMESTAMP,

    -- Ação (opcional)
    ds_acao VARCHAR(100),
    ds_url TEXT,
    ds_url_deep_link TEXT,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON tb_notificacoes(id_user);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON tb_notificacoes(st_lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON tb_notificacoes(ds_tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criacao ON tb_notificacoes(dt_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON tb_notificacoes(id_user, st_lida);

-- Trigger para atualizar dt_lida quando marcar como lida
CREATE OR REPLACE FUNCTION update_dt_lida_notificacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.st_lida = true AND OLD.st_lida = false THEN
        NEW.dt_lida = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_dt_lida_notificacao
    BEFORE UPDATE ON tb_notificacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_lida_notificacao();

-- Comentários
COMMENT ON TABLE tb_notificacoes IS 'Tabela de notificações do sistema';
COMMENT ON COLUMN tb_notificacoes.ds_tipo IS 'Tipo: agendamento, promocao, sistema, lembrete, avaliacao, pagamento, mensagem';
COMMENT ON COLUMN tb_notificacoes.ds_prioridade IS 'Prioridade: baixa, normal, alta, urgente';
COMMENT ON COLUMN tb_notificacoes.ds_dados_adicionais IS 'Dados adicionais em formato JSON';

-- ====================================================================
-- FIM DA MIGRATION
-- ====================================================================
