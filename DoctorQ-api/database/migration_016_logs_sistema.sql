-- =============================================
-- DoctorQ - Migration 016: Logs e Configurações
-- =============================================
-- Descrição: Tabelas para logs detalhados e configurações expandidas
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================

-- =============================================
-- CONFIGURAÇÕES DO SISTEMA
-- =============================================

CREATE TABLE IF NOT EXISTS tb_configuracoes (
    id_configuracao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Chave e valor
    nm_chave VARCHAR(255) UNIQUE NOT NULL,
    ds_valor TEXT,
    ds_valor_padrao TEXT,

    -- Tipo de dado
    ds_tipo VARCHAR(50) DEFAULT 'texto',
    -- 'texto', 'numero', 'boolean', 'json', 'senha', 'email', 'url'

    -- Categoria
    ds_categoria VARCHAR(100) NOT NULL,
    -- 'whatsapp', 'email', 'sms', 'geral', 'pagamento', 'integracao', 'aparencia'

    -- Descrição
    ds_descricao TEXT,
    ds_ajuda TEXT, -- Texto de ajuda para administradores

    -- Segurança
    st_criptografado BOOLEAN DEFAULT false,
    st_somente_leitura BOOLEAN DEFAULT false,

    -- Validação
    ds_validacao VARCHAR(500), -- Regex ou regra de validação
    ds_opcoes TEXT[], -- Array de opções válidas (para dropdowns)

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    st_visivel BOOLEAN DEFAULT true, -- Visível na UI de configurações

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_configuracoes_chave ON tb_configuracoes(nm_chave);
CREATE INDEX idx_configuracoes_categoria ON tb_configuracoes(ds_categoria);
CREATE INDEX idx_configuracoes_empresa ON tb_configuracoes(id_empresa);

-- Inserir configurações padrão
INSERT INTO tb_configuracoes (nm_chave, ds_valor_padrao, ds_tipo, ds_categoria, ds_descricao) VALUES
    -- WhatsApp
    ('whatsapp_api_url', 'https://api.whatsapp.com', 'url', 'whatsapp', 'URL da API do WhatsApp Business'),
    ('whatsapp_api_key', '', 'senha', 'whatsapp', 'Chave de API do WhatsApp'),
    ('whatsapp_numero', '', 'texto', 'whatsapp', 'Número do WhatsApp Business'),
    ('whatsapp_envio_ativo', 'true', 'boolean', 'whatsapp', 'Ativar envio de mensagens WhatsApp'),

    -- Email
    ('email_smtp_host', 'smtp.gmail.com', 'texto', 'email', 'Servidor SMTP'),
    ('email_smtp_port', '587', 'numero', 'email', 'Porta SMTP'),
    ('email_smtp_usuario', '', 'email', 'email', 'Usuário SMTP'),
    ('email_smtp_senha', '', 'senha', 'email', 'Senha SMTP'),
    ('email_remetente_nome', 'DoctorQ', 'texto', 'email', 'Nome do remetente'),
    ('email_remetente_email', 'noreply@doctorq.com', 'email', 'email', 'Email do remetente'),

    -- SMS
    ('sms_provedor', 'twilio', 'texto', 'sms', 'Provedor de SMS (twilio, zenvia)'),
    ('sms_api_key', '', 'senha', 'sms', 'Chave de API SMS'),
    ('sms_remetente', '', 'texto', 'sms', 'Nome/número do remetente'),
    ('sms_envio_ativo', 'false', 'boolean', 'sms', 'Ativar envio de SMS'),

    -- Geral
    ('sistema_nome', 'DoctorQ', 'texto', 'geral', 'Nome do sistema'),
    ('sistema_timezone', 'America/Sao_Paulo', 'texto', 'geral', 'Fuso horário'),
    ('sistema_idioma', 'pt-BR', 'texto', 'geral', 'Idioma padrão'),
    ('sistema_moeda', 'BRL', 'texto', 'geral', 'Moeda'),

    -- Agendamentos
    ('agendamento_antecedencia_minima', '2', 'numero', 'geral', 'Horas mínimas de antecedência'),
    ('agendamento_duracao_padrao', '60', 'numero', 'geral', 'Duração padrão em minutos'),
    ('agendamento_confirmacao_auto', 'false', 'boolean', 'geral', 'Confirmação automática'),

    -- Pagamentos
    ('pagamento_gateway', 'stripe', 'texto', 'pagamento', 'Gateway de pagamento (stripe, pagseguro)'),
    ('pagamento_api_key', '', 'senha', 'pagamento', 'Chave de API do gateway'),
    ('pagamento_comissao_percentual', '10', 'numero', 'pagamento', 'Comissão padrão (%)'),

    -- Aparência
    ('tema_cor_primaria', '#ec4899', 'texto', 'aparencia', 'Cor primária do tema'),
    ('tema_cor_secundaria', '#9333ea', 'texto', 'aparencia', 'Cor secundária do tema'),
    ('tema_logo_url', '', 'url', 'aparencia', 'URL do logotipo')
ON CONFLICT (nm_chave) DO NOTHING;

-- =============================================
-- HISTÓRICO DE CONFIGURAÇÕES
-- =============================================

CREATE TABLE IF NOT EXISTS tb_historico_configuracoes (
    id_historico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_configuracao UUID REFERENCES tb_configuracoes(id_configuracao) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Mudança
    ds_valor_anterior TEXT,
    ds_valor_novo TEXT,

    -- Origem
    ds_ip VARCHAR(45),
    ds_origem VARCHAR(50), -- 'web', 'api', 'sistema'

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_historico_config_configuracao ON tb_historico_configuracoes(id_configuracao);
CREATE INDEX idx_historico_config_user ON tb_historico_configuracoes(id_user);
CREATE INDEX idx_historico_config_criacao ON tb_historico_configuracoes(dt_criacao DESC);

-- =============================================
-- LOGS DE ERRO
-- =============================================

CREATE TABLE IF NOT EXISTS tb_logs_erro (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,

    -- Severidade
    ds_nivel VARCHAR(20) NOT NULL, -- 'debug', 'info', 'warning', 'error', 'critical'

    -- Erro
    ds_mensagem TEXT NOT NULL,
    ds_stack_trace TEXT,
    ds_tipo_erro VARCHAR(255), -- Classe do erro

    -- Contexto
    ds_endpoint VARCHAR(500), -- Endpoint onde ocorreu
    ds_metodo VARCHAR(10), -- GET, POST, PUT, DELETE
    ds_parametros JSONB, -- Parâmetros da requisição
    ds_resposta JSONB, -- Resposta gerada

    -- Origem
    ds_ip VARCHAR(45),
    ds_user_agent TEXT,
    ds_referer TEXT,

    -- Sistema
    ds_hostname VARCHAR(255), -- Servidor onde ocorreu
    ds_processo VARCHAR(100), -- Nome do processo
    ds_versao_app VARCHAR(50), -- Versão da aplicação

    -- Status
    st_resolvido BOOLEAN DEFAULT false,
    dt_resolvido TIMESTAMP,
    id_user_resolveu UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    ds_solucao TEXT,

    -- Agrupamento (para erros similares)
    ds_hash_erro VARCHAR(64), -- Hash para agrupar erros iguais
    nr_ocorrencias INTEGER DEFAULT 1,

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_erro_nivel ON tb_logs_erro(ds_nivel);
CREATE INDEX idx_logs_erro_user ON tb_logs_erro(id_user);
CREATE INDEX idx_logs_erro_empresa ON tb_logs_erro(id_empresa);
CREATE INDEX idx_logs_erro_criacao ON tb_logs_erro(dt_criacao DESC);
CREATE INDEX idx_logs_erro_resolvido ON tb_logs_erro(st_resolvido);
CREATE INDEX idx_logs_erro_hash ON tb_logs_erro(ds_hash_erro);
CREATE INDEX idx_logs_erro_endpoint ON tb_logs_erro(ds_endpoint);

-- =============================================
-- LOGS DE ACESSO (Access Logs)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_logs_acesso (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Requisição
    ds_metodo VARCHAR(10) NOT NULL,
    ds_endpoint VARCHAR(500) NOT NULL,
    ds_parametros_query JSONB,
    ds_body JSONB,

    -- Resposta
    nr_status_code INTEGER NOT NULL,
    nr_tempo_resposta_ms INTEGER, -- Tempo em milissegundos
    nr_tamanho_resposta_bytes BIGINT,

    -- Cliente
    ds_ip VARCHAR(45) NOT NULL,
    ds_user_agent TEXT,
    ds_referer TEXT,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_acesso_user ON tb_logs_acesso(id_user);
CREATE INDEX idx_logs_acesso_endpoint ON tb_logs_acesso(ds_endpoint);
CREATE INDEX idx_logs_acesso_status ON tb_logs_acesso(nr_status_code);
CREATE INDEX idx_logs_acesso_criacao ON tb_logs_acesso(dt_criacao DESC);
CREATE INDEX idx_logs_acesso_ip ON tb_logs_acesso(ds_ip);

-- =============================================
-- LOGS DE INTEGRAÇÃO
-- =============================================

CREATE TABLE IF NOT EXISTS tb_logs_integracao (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,

    -- Integração
    ds_servico VARCHAR(100) NOT NULL, -- 'whatsapp', 'email', 'sms', 'pagamento', etc.
    ds_tipo VARCHAR(50) NOT NULL, -- 'envio', 'recebimento', 'webhook', 'api_call'
    ds_acao VARCHAR(100), -- 'enviar_mensagem', 'processar_pagamento', etc.

    -- Requisição
    ds_endpoint_externo TEXT,
    ds_metodo VARCHAR(10),
    ds_headers JSONB,
    ds_payload JSONB,

    -- Resposta
    nr_status_code INTEGER,
    ds_resposta JSONB,
    ds_erro TEXT,

    -- Status
    st_sucesso BOOLEAN NOT NULL,
    nr_tempo_resposta_ms INTEGER,
    nr_tentativas INTEGER DEFAULT 1,

    -- Referências opcionais
    id_notificacao UUID REFERENCES tb_notificacoes(id_notificacao) ON DELETE SET NULL,
    id_transacao UUID REFERENCES tb_transacoes(id_transacao) ON DELETE SET NULL,

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_integracao_servico ON tb_logs_integracao(ds_servico);
CREATE INDEX idx_logs_integracao_tipo ON tb_logs_integracao(ds_tipo);
CREATE INDEX idx_logs_integracao_sucesso ON tb_logs_integracao(st_sucesso);
CREATE INDEX idx_logs_integracao_criacao ON tb_logs_integracao(dt_criacao DESC);
CREATE INDEX idx_logs_integracao_empresa ON tb_logs_integracao(id_empresa);

-- =============================================
-- SESSÕES DE USUÁRIO
-- =============================================

CREATE TABLE IF NOT EXISTS tb_sessoes (
    id_sessao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Token
    ds_token VARCHAR(500) UNIQUE NOT NULL,
    ds_refresh_token VARCHAR(500) UNIQUE,

    -- Dispositivo
    ds_ip VARCHAR(45) NOT NULL,
    ds_user_agent TEXT,
    ds_plataforma VARCHAR(20), -- 'web', 'ios', 'android'
    ds_navegador VARCHAR(100),
    ds_localizacao VARCHAR(255), -- Cidade/País baseado em IP

    -- Status
    st_ativa BOOLEAN DEFAULT true,
    dt_ultimo_acesso TIMESTAMP DEFAULT NOW(),
    dt_expiracao TIMESTAMP NOT NULL,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessoes_user ON tb_sessoes(id_user);
CREATE INDEX idx_sessoes_token ON tb_sessoes(ds_token);
CREATE INDEX idx_sessoes_ativa ON tb_sessoes(st_ativa);
CREATE INDEX idx_sessoes_expiracao ON tb_sessoes(dt_expiracao);

-- =============================================
-- JOBS E TAREFAS AGENDADAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_jobs (
    id_job UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Job
    nm_job VARCHAR(255) NOT NULL,
    ds_tipo VARCHAR(100) NOT NULL,
    -- 'envio_email', 'processamento_lote', 'backup', 'limpeza', 'relatorio', etc.

    -- Agendamento
    ds_cron VARCHAR(100), -- Expressão cron
    dt_proxima_execucao TIMESTAMP,

    -- Configuração
    ds_parametros JSONB,
    nr_timeout_segundos INTEGER DEFAULT 300,
    nr_max_tentativas INTEGER DEFAULT 3,

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    st_executando BOOLEAN DEFAULT false,

    -- Estatísticas
    nr_total_execucoes INTEGER DEFAULT 0,
    nr_execucoes_sucesso INTEGER DEFAULT 0,
    nr_execucoes_falha INTEGER DEFAULT 0,
    dt_ultima_execucao TIMESTAMP,
    dt_ultima_execucao_sucesso TIMESTAMP,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_tipo ON tb_jobs(ds_tipo);
CREATE INDEX idx_jobs_ativo ON tb_jobs(st_ativo);
CREATE INDEX idx_jobs_proxima_execucao ON tb_jobs(dt_proxima_execucao);

-- =============================================
-- HISTÓRICO DE EXECUÇÃO DE JOBS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_execucoes_jobs (
    id_execucao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_job UUID REFERENCES tb_jobs(id_job) ON DELETE CASCADE,

    -- Execução
    dt_inicio TIMESTAMP DEFAULT NOW(),
    dt_fim TIMESTAMP,
    nr_duracao_segundos INTEGER,

    -- Status
    st_sucesso BOOLEAN,
    ds_resultado TEXT,
    ds_erro TEXT,
    ds_stack_trace TEXT,

    -- Saída
    ds_logs TEXT,
    nr_registros_processados INTEGER,

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_execucoes_jobs_job ON tb_execucoes_jobs(id_job);
CREATE INDEX idx_execucoes_jobs_inicio ON tb_execucoes_jobs(dt_inicio DESC);
CREATE INDEX idx_execucoes_jobs_sucesso ON tb_execucoes_jobs(st_sucesso);

-- =============================================
-- CACHE DO SISTEMA
-- =============================================

CREATE TABLE IF NOT EXISTS tb_cache (
    nm_chave VARCHAR(500) PRIMARY KEY,
    ds_valor TEXT NOT NULL,
    ds_tags TEXT[], -- Tags para invalidação em grupo

    dt_expiracao TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cache_expiracao ON tb_cache(dt_expiracao);
CREATE INDEX idx_cache_tags ON tb_cache USING GIN(ds_tags);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function para registrar mudança de configuração
CREATE OR REPLACE FUNCTION registrar_mudanca_configuracao()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se o valor mudou
    IF NEW.ds_valor IS DISTINCT FROM OLD.ds_valor THEN
        INSERT INTO tb_historico_configuracoes (
            id_configuracao,
            ds_valor_anterior,
            ds_valor_novo
        ) VALUES (
            NEW.id_configuracao,
            OLD.ds_valor,
            NEW.ds_valor
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para limpar cache expirado
CREATE OR REPLACE FUNCTION limpar_cache_expirado()
RETURNS INTEGER AS $$
DECLARE
    registros_deletados INTEGER;
BEGIN
    DELETE FROM tb_cache
    WHERE dt_expiracao < NOW();

    GET DIAGNOSTICS registros_deletados = ROW_COUNT;
    RETURN registros_deletados;
END;
$$ LANGUAGE plpgsql;

-- Function para limpar logs antigos
CREATE OR REPLACE FUNCTION limpar_logs_antigos(dias INTEGER DEFAULT 90)
RETURNS TABLE(
    logs_acesso INTEGER,
    logs_integracao INTEGER,
    logs_erro_resolvidos INTEGER
) AS $$
DECLARE
    v_logs_acesso INTEGER;
    v_logs_integracao INTEGER;
    v_logs_erro INTEGER;
BEGIN
    -- Limpar logs de acesso
    DELETE FROM tb_logs_acesso WHERE dt_criacao < NOW() - INTERVAL '1 day' * dias;
    GET DIAGNOSTICS v_logs_acesso = ROW_COUNT;

    -- Limpar logs de integração
    DELETE FROM tb_logs_integracao WHERE dt_criacao < NOW() - INTERVAL '1 day' * dias;
    GET DIAGNOSTICS v_logs_integracao = ROW_COUNT;

    -- Limpar logs de erro resolvidos
    DELETE FROM tb_logs_erro WHERE st_resolvido = true AND dt_criacao < NOW() - INTERVAL '1 day' * dias;
    GET DIAGNOSTICS v_logs_erro = ROW_COUNT;

    RETURN QUERY SELECT v_logs_acesso, v_logs_integracao, v_logs_erro;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_update_configuracoes BEFORE UPDATE ON tb_configuracoes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_jobs BEFORE UPDATE ON tb_jobs
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_cache BEFORE UPDATE ON tb_cache
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- Trigger para histórico de configurações
CREATE TRIGGER trg_mudanca_configuracao AFTER UPDATE ON tb_configuracoes
FOR EACH ROW EXECUTE FUNCTION registrar_mudanca_configuracao();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE tb_configuracoes IS 'Configurações do sistema organizadas por categoria';
COMMENT ON TABLE tb_historico_configuracoes IS 'Histórico de mudanças nas configurações';
COMMENT ON TABLE tb_logs_erro IS 'Logs de erros e exceções do sistema';
COMMENT ON TABLE tb_logs_acesso IS 'Logs de acesso HTTP/API';
COMMENT ON TABLE tb_logs_integracao IS 'Logs de integrações externas (WhatsApp, Email, Pagamentos)';
COMMENT ON TABLE tb_sessoes IS 'Sessões ativas de usuários';
COMMENT ON TABLE tb_jobs IS 'Tarefas agendadas e jobs do sistema';
COMMENT ON TABLE tb_execucoes_jobs IS 'Histórico de execuções de jobs';
COMMENT ON TABLE tb_cache IS 'Cache de dados do sistema';

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View de erros recentes não resolvidos
CREATE OR REPLACE VIEW vw_erros_pendentes AS
SELECT
    l.*,
    u.nm_completo AS nm_user,
    e.nm_empresa
FROM tb_logs_erro l
LEFT JOIN tb_users u ON l.id_user = u.id_user
LEFT JOIN tb_empresas e ON l.id_empresa = e.id_empresa
WHERE l.st_resolvido = false
ORDER BY l.dt_criacao DESC;

-- View de configurações por categoria
CREATE OR REPLACE VIEW vw_configuracoes_categoria AS
SELECT
    ds_categoria,
    COUNT(*) AS nr_total,
    COUNT(*) FILTER (WHERE st_ativo = true) AS nr_ativas
FROM tb_configuracoes
GROUP BY ds_categoria;

-- View de jobs próximos
CREATE OR REPLACE VIEW vw_jobs_proximos AS
SELECT
    j.*,
    e.dt_inicio AS dt_ultima_execucao_inicio,
    e.st_sucesso AS st_ultima_execucao_sucesso
FROM tb_jobs j
LEFT JOIN LATERAL (
    SELECT dt_inicio, st_sucesso
    FROM tb_execucoes_jobs
    WHERE id_job = j.id_job
    ORDER BY dt_inicio DESC
    LIMIT 1
) e ON true
WHERE j.st_ativo = true
ORDER BY j.dt_proxima_execucao NULLS LAST;

-- =============================================
-- FIM DA MIGRATION
-- =============================================
