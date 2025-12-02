-- Migration: Sistema de Configurações
-- Created: 2025-10-23
-- Description: Cria tabela para armazenar configurações do sistema (WhatsApp, Email, SMS, etc.)

-- ============================================
-- 1. Criar tabela de configurações
-- ============================================

CREATE TABLE IF NOT EXISTS tb_configuracoes (
    id_configuracao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_chave VARCHAR(100) UNIQUE NOT NULL,
    ds_valor TEXT,
    ds_tipo VARCHAR(50) DEFAULT 'texto', -- texto, numero, boolean, json, senha
    ds_categoria VARCHAR(50) NOT NULL, -- whatsapp, email, sms, pagamento, geral
    ds_descricao TEXT,
    st_criptografado BOOLEAN DEFAULT FALSE,
    st_ativo BOOLEAN DEFAULT TRUE,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON tb_configuracoes(nm_chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON tb_configuracoes(ds_categoria);
CREATE INDEX IF NOT EXISTS idx_configuracoes_ativo ON tb_configuracoes(st_ativo);

-- ============================================
-- 2. Trigger para atualizar dt_atualizacao
-- ============================================

CREATE OR REPLACE FUNCTION update_dt_atualizacao_configuracoes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_configuracoes
BEFORE UPDATE ON tb_configuracoes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao_configuracoes();

-- ============================================
-- 3. Inserir configurações padrão do WhatsApp
-- ============================================

INSERT INTO tb_configuracoes (nm_chave, ds_valor, ds_tipo, ds_categoria, ds_descricao, st_criptografado) VALUES
('whatsapp_api_url', 'https://graph.facebook.com/v18.0', 'texto', 'whatsapp', 'URL da API do WhatsApp Business', FALSE),
('whatsapp_access_token', '', 'senha', 'whatsapp', 'Token de acesso do WhatsApp Business API', TRUE),
('whatsapp_phone_id', '', 'texto', 'whatsapp', 'ID do telefone no WhatsApp Business', FALSE),
('whatsapp_habilitado', 'false', 'boolean', 'whatsapp', 'Ativa/desativa integração com WhatsApp', FALSE),
('whatsapp_antecedencia_lembrete', '24', 'numero', 'whatsapp', 'Horas de antecedência para enviar lembretes', FALSE)
ON CONFLICT (nm_chave) DO NOTHING;

-- ============================================
-- 4. Inserir outras configurações úteis
-- ============================================

INSERT INTO tb_configuracoes (nm_chave, ds_valor, ds_tipo, ds_categoria, ds_descricao, st_criptografado) VALUES
-- Email
('email_smtp_host', '', 'texto', 'email', 'Servidor SMTP para envio de emails', FALSE),
('email_smtp_port', '587', 'numero', 'email', 'Porta do servidor SMTP', FALSE),
('email_smtp_usuario', '', 'texto', 'email', 'Usuário para autenticação SMTP', FALSE),
('email_smtp_senha', '', 'senha', 'email', 'Senha para autenticação SMTP', TRUE),
('email_remetente', 'noreply@doctorq.com.br', 'texto', 'email', 'Email remetente padrão', FALSE),
('email_habilitado', 'false', 'boolean', 'email', 'Ativa/desativa envio de emails', FALSE),

-- SMS
('sms_provedor', '', 'texto', 'sms', 'Provedor de SMS (twilio, zenvia, etc)', FALSE),
('sms_api_key', '', 'senha', 'sms', 'API Key do provedor de SMS', TRUE),
('sms_remetente', '', 'texto', 'sms', 'Nome ou número remetente de SMS', FALSE),
('sms_habilitado', 'false', 'boolean', 'sms', 'Ativa/desativa envio de SMS', FALSE),

-- Geral
('sistema_nome', 'DoctorQ', 'texto', 'geral', 'Nome do sistema', FALSE),
('sistema_url', 'http://localhost:3000', 'texto', 'geral', 'URL base do sistema', FALSE),
('sistema_telefone', '', 'texto', 'geral', 'Telefone de contato principal', FALSE),
('sistema_email_suporte', 'suporte@doctorq.com.br', 'texto', 'geral', 'Email de suporte', FALSE),
('sistema_timezone', 'America/Sao_Paulo', 'texto', 'geral', 'Timezone do sistema', FALSE)
ON CONFLICT (nm_chave) DO NOTHING;

-- ============================================
-- 5. Função para buscar configuração
-- ============================================

CREATE OR REPLACE FUNCTION get_configuracao(chave VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    valor TEXT;
BEGIN
    SELECT ds_valor INTO valor
    FROM tb_configuracoes
    WHERE nm_chave = chave AND st_ativo = TRUE
    LIMIT 1;

    RETURN valor;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Função para atualizar configuração
-- ============================================

CREATE OR REPLACE FUNCTION set_configuracao(chave VARCHAR(100), novo_valor TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tb_configuracoes
    SET ds_valor = novo_valor,
        dt_atualizacao = NOW()
    WHERE nm_chave = chave;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Comentários
-- ============================================

COMMENT ON TABLE tb_configuracoes IS 'Configurações do sistema (WhatsApp, Email, SMS, etc)';
COMMENT ON COLUMN tb_configuracoes.st_criptografado IS 'Se TRUE, o valor deve ser criptografado no backend';
COMMENT ON COLUMN tb_configuracoes.ds_categoria IS 'Categoria da configuração: whatsapp, email, sms, pagamento, geral';
COMMENT ON COLUMN tb_configuracoes.ds_tipo IS 'Tipo do valor: texto, numero, boolean, json, senha';

-- ============================================
-- 8. Grant permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON tb_configuracoes TO postgres;

-- Fim da migration
