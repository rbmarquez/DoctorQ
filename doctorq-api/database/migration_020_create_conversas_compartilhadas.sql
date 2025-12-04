-- =====================================================
-- Migration 020: Criar Tabela de Conversas Compartilhadas
-- UC085 - Compartilhar Conversa
-- Data: 2025-11-07
-- =====================================================

BEGIN;

-- Criar tabela de conversas compartilhadas
CREATE TABLE IF NOT EXISTS tb_conversas_compartilhadas (
    id_compartilhamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversa UUID NOT NULL REFERENCES tb_conversas(id_conversa) ON DELETE CASCADE,
    id_user_criador UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Token público único
    ds_token VARCHAR(64) NOT NULL UNIQUE,

    -- Senha opcional (hash bcrypt)
    ds_senha_hash VARCHAR(255),

    -- Controle de expiração
    dt_expiracao TIMESTAMP,
    fg_expirado BOOLEAN NOT NULL DEFAULT FALSE,

    -- Estatísticas de acesso
    nr_visualizacoes INTEGER NOT NULL DEFAULT 0,
    dt_ultimo_acesso TIMESTAMP,

    -- Metadados
    ds_descricao TEXT,
    ds_ip_criador VARCHAR(45),

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_revogado TIMESTAMP,
    fg_ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Criar índices
CREATE INDEX idx_conversas_compartilhadas_conversa ON tb_conversas_compartilhadas(id_conversa);
CREATE INDEX idx_conversas_compartilhadas_token ON tb_conversas_compartilhadas(ds_token) WHERE fg_ativo = TRUE;
CREATE INDEX idx_conversas_compartilhadas_criador ON tb_conversas_compartilhadas(id_user_criador);
CREATE INDEX idx_conversas_compartilhadas_expiracao ON tb_conversas_compartilhadas(dt_expiracao) WHERE fg_expirado = FALSE;

-- Comentários
COMMENT ON TABLE tb_conversas_compartilhadas IS 'UC085 - Links públicos de compartilhamento de conversas';
COMMENT ON COLUMN tb_conversas_compartilhadas.ds_token IS 'Token único para acesso público (URL-safe base64)';
COMMENT ON COLUMN tb_conversas_compartilhadas.ds_senha_hash IS 'Hash bcrypt da senha de proteção (opcional)';
COMMENT ON COLUMN tb_conversas_compartilhadas.dt_expiracao IS 'Data de expiração do link (null = nunca expira)';
COMMENT ON COLUMN tb_conversas_compartilhadas.nr_visualizacoes IS 'Contador de acessos ao link';

COMMIT;
