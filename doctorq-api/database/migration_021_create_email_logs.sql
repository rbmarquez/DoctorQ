-- =====================================================
-- Migration 021: Criar Tabela de Logs de Emails
-- UC095 - Email Transacional (categorização e histórico)
-- Data: 2025-11-07
-- =====================================================

BEGIN;

-- Criar enum para categorias de email
CREATE TYPE tp_categoria_email AS ENUM (
    'transacional',      -- Emails de transação (pedidos, pagamentos)
    'notificacao',       -- Notificações do sistema
    'marketing',         -- Emails promocionais
    'operacional',       -- Emails operacionais (senhas, convites)
    'lembrete',          -- Lembretes (agendamentos, vencimentos)
    'suporte'            -- Emails de suporte
);

-- Criar tabela de logs de emails
CREATE TABLE IF NOT EXISTS tb_email_logs (
    id_email_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,  -- Destinatário (se usuário)
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,

    -- Dados do email
    ds_destinatario VARCHAR(255) NOT NULL,
    ds_assunto VARCHAR(500) NOT NULL,
    tp_categoria tp_categoria_email NOT NULL DEFAULT 'transacional',
    tp_template VARCHAR(100),  -- Nome do template usado

    -- Status de envio
    st_envio VARCHAR(20) NOT NULL DEFAULT 'pendente',  -- pendente, enviado, erro, rejeitado
    ds_erro TEXT,  -- Mensagem de erro (se houver)

    -- Metadados
    ds_metadata JSONB,  -- Dados adicionais (variáveis, contexto)
    ds_smtp_message_id VARCHAR(255),  -- ID da mensagem no servidor SMTP

    -- Rastreamento (se suportado)
    fg_aberto BOOLEAN DEFAULT FALSE,
    dt_aberto TIMESTAMP,
    fg_clicado BOOLEAN DEFAULT FALSE,
    dt_clicado TIMESTAMP,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_enviado TIMESTAMP,
    dt_tentativa_envio TIMESTAMP
);

-- Criar índices
CREATE INDEX idx_email_logs_user ON tb_email_logs(id_user);
CREATE INDEX idx_email_logs_empresa ON tb_email_logs(id_empresa);
CREATE INDEX idx_email_logs_destinatario ON tb_email_logs(ds_destinatario);
CREATE INDEX idx_email_logs_categoria ON tb_email_logs(tp_categoria);
CREATE INDEX idx_email_logs_status ON tb_email_logs(st_envio);
CREATE INDEX idx_email_logs_template ON tb_email_logs(tp_template);
CREATE INDEX idx_email_logs_criacao ON tb_email_logs(dt_criacao DESC);

-- Comentários
COMMENT ON TABLE tb_email_logs IS 'UC095 - Histórico de emails enviados pelo sistema';
COMMENT ON COLUMN tb_email_logs.tp_categoria IS 'Categoria do email: transacional, notificacao, marketing, operacional, lembrete, suporte';
COMMENT ON COLUMN tb_email_logs.tp_template IS 'Nome do template usado (ex: password_reset, welcome, invoice)';
COMMENT ON COLUMN tb_email_logs.st_envio IS 'Status do envio: pendente, enviado, erro, rejeitado';
COMMENT ON COLUMN tb_email_logs.ds_metadata IS 'Dados adicionais do email (variáveis, contexto)';

COMMIT;
