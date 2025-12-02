-- =============================================
-- DoctorQ - Migration 019: Password Reset Tokens
-- =============================================
-- Descrição: Cria tabela para armazenar tokens de recuperação de senha
-- Data: 2025-10-30
-- Versão: 1.0
-- =============================================

BEGIN;

-- Criar tabela de tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS tb_password_reset_tokens (
    id_token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL,
    ds_token VARCHAR(255) UNIQUE NOT NULL,
    dt_expiration TIMESTAMP NOT NULL,
    st_used VARCHAR(1) DEFAULT 'N' NOT NULL CHECK (st_used IN ('S', 'N')),
    dt_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_used TIMESTAMP,
    ds_ip_address VARCHAR(45),
    ds_user_agent TEXT,

    -- Foreign key
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (id_user)
        REFERENCES tb_users(id_user)
        ON DELETE CASCADE
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON tb_password_reset_tokens(ds_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expiration ON tb_password_reset_tokens(dt_expiration);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON tb_password_reset_tokens(id_user);
CREATE INDEX IF NOT EXISTS idx_password_reset_used ON tb_password_reset_tokens(st_used);

-- Criar índice composto para validação rápida
CREATE INDEX IF NOT EXISTS idx_password_reset_validation
    ON tb_password_reset_tokens(ds_token, st_used, dt_expiration);

-- Comentários
COMMENT ON TABLE tb_password_reset_tokens IS 'Armazena tokens de recuperação de senha';
COMMENT ON COLUMN tb_password_reset_tokens.id_token IS 'ID único do token';
COMMENT ON COLUMN tb_password_reset_tokens.id_user IS 'ID do usuário que solicitou a recuperação';
COMMENT ON COLUMN tb_password_reset_tokens.ds_token IS 'Token único para recuperação';
COMMENT ON COLUMN tb_password_reset_tokens.dt_expiration IS 'Data e hora de expiração (1 hora após criação)';
COMMENT ON COLUMN tb_password_reset_tokens.st_used IS 'Se o token já foi usado (S/N)';
COMMENT ON COLUMN tb_password_reset_tokens.dt_created IS 'Data e hora de criação';
COMMENT ON COLUMN tb_password_reset_tokens.dt_used IS 'Data e hora em que foi usado';
COMMENT ON COLUMN tb_password_reset_tokens.ds_ip_address IS 'Endereço IP que solicitou';
COMMENT ON COLUMN tb_password_reset_tokens.ds_user_agent IS 'User agent do navegador';

COMMIT;

-- Rollback script (executar manualmente se necessário)
-- DROP TABLE IF EXISTS tb_password_reset_tokens CASCADE;
