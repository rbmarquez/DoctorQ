-- =============================================
-- DoctorQ - Migration 015: Notificações e Sistema
-- =============================================
-- Descrição: Tabelas para notificações e funcionalidades do sistema
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================

-- =============================================
-- NOTIFICAÇÕES
-- =============================================

CREATE TABLE IF NOT EXISTS tb_notificacoes (
    id_notificacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Tipo e categoria
    ds_tipo VARCHAR(50) NOT NULL,
    -- 'agendamento', 'mensagem', 'pedido', 'pagamento', 'avaliacao', 'sistema', 'promocao'
    ds_categoria VARCHAR(50),
    -- 'confirmacao', 'lembrete', 'cancelamento', 'nova_mensagem', 'status_pedido', etc.

    -- Conteúdo
    nm_titulo VARCHAR(255) NOT NULL,
    ds_conteudo TEXT NOT NULL,
    ds_dados_adicionais JSONB, -- Dados estruturados adicionais

    -- Prioridade
    ds_prioridade VARCHAR(20) DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'

    -- Canais de envio
    st_push BOOLEAN DEFAULT true,
    st_email BOOLEAN DEFAULT false,
    st_sms BOOLEAN DEFAULT false,
    st_whatsapp BOOLEAN DEFAULT false,

    -- Status de envio por canal
    st_push_enviado BOOLEAN DEFAULT false,
    st_email_enviado BOOLEAN DEFAULT false,
    st_sms_enviado BOOLEAN DEFAULT false,
    st_whatsapp_enviado BOOLEAN DEFAULT false,

    dt_push_enviado TIMESTAMP,
    dt_email_enviado TIMESTAMP,
    dt_sms_enviado TIMESTAMP,
    dt_whatsapp_enviado TIMESTAMP,

    -- Status de leitura
    st_lida BOOLEAN DEFAULT false,
    dt_lida TIMESTAMP,

    -- Ação
    ds_acao VARCHAR(50), -- 'abrir_agendamento', 'ver_pedido', 'responder_mensagem', etc.
    ds_url TEXT, -- URL de destino ao clicar
    ds_url_deep_link TEXT, -- Deep link para app mobile

    -- Referências opcionais
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE CASCADE,
    id_mensagem UUID REFERENCES tb_mensagens_usuarios(id_mensagem) ON DELETE CASCADE,
    id_conversa UUID REFERENCES tb_conversas_usuarios(id_conversa) ON DELETE CASCADE,

    -- Agendamento
    dt_envio_programado TIMESTAMP,
    st_enviada BOOLEAN DEFAULT false,

    -- Expiração
    dt_expiracao TIMESTAMP,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_user ON tb_notificacoes(id_user);
CREATE INDEX idx_notificacoes_empresa ON tb_notificacoes(id_empresa);
CREATE INDEX idx_notificacoes_tipo ON tb_notificacoes(ds_tipo);
CREATE INDEX idx_notificacoes_lida ON tb_notificacoes(st_lida);
CREATE INDEX idx_notificacoes_criacao ON tb_notificacoes(dt_criacao DESC);
CREATE INDEX idx_notificacoes_agendamento ON tb_notificacoes(id_agendamento);
CREATE INDEX idx_notificacoes_pedido ON tb_notificacoes(id_pedido);
CREATE INDEX idx_notificacoes_envio ON tb_notificacoes(dt_envio_programado);

-- =============================================
-- PREFERÊNCIAS DE NOTIFICAÇÃO
-- =============================================

CREATE TABLE IF NOT EXISTS tb_preferencias_notificacao (
    id_preferencia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Canal
    ds_canal VARCHAR(50) NOT NULL, -- 'push', 'email', 'sms', 'whatsapp'

    -- Tipos de notificação
    st_agendamentos BOOLEAN DEFAULT true,
    st_mensagens BOOLEAN DEFAULT true,
    st_pedidos BOOLEAN DEFAULT true,
    st_pagamentos BOOLEAN DEFAULT true,
    st_avaliacoes BOOLEAN DEFAULT true,
    st_promocoes BOOLEAN DEFAULT false,
    st_sistema BOOLEAN DEFAULT true,

    -- Horário de silêncio
    hr_inicio_silencio TIME, -- Ex: '22:00:00'
    hr_fim_silencio TIME,    -- Ex: '08:00:00'

    -- Frequência
    ds_frequencia_resumo VARCHAR(20), -- 'imediato', 'diario', 'semanal'
    hr_envio_resumo TIME, -- Horário do resumo diário/semanal

    -- Status
    st_ativo BOOLEAN DEFAULT true,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: canal único por usuário
    CONSTRAINT uk_user_canal UNIQUE (id_user, ds_canal)
);

CREATE INDEX idx_preferencias_notificacao_user ON tb_preferencias_notificacao(id_user);
CREATE INDEX idx_preferencias_notificacao_canal ON tb_preferencias_notificacao(ds_canal);

-- =============================================
-- DISPOSITIVOS (para push notifications)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_dispositivos (
    id_dispositivo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Token do dispositivo
    ds_token_push VARCHAR(500) UNIQUE NOT NULL,
    ds_plataforma VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'

    -- Informações do dispositivo
    nm_modelo VARCHAR(255),
    ds_sistema_operacional VARCHAR(100),
    ds_versao_app VARCHAR(50),

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    dt_ultimo_acesso TIMESTAMP,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dispositivos_user ON tb_dispositivos(id_user);
CREATE INDEX idx_dispositivos_token ON tb_dispositivos(ds_token_push);
CREATE INDEX idx_dispositivos_plataforma ON tb_dispositivos(ds_plataforma);
CREATE INDEX idx_dispositivos_ativo ON tb_dispositivos(st_ativo);

-- =============================================
-- LEMBRETES
-- =============================================

CREATE TABLE IF NOT EXISTS tb_lembretes (
    id_lembrete UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Conteúdo
    nm_titulo VARCHAR(255) NOT NULL,
    ds_descricao TEXT,

    -- Data e hora
    dt_lembrete TIMESTAMP NOT NULL,

    -- Recorrência
    st_recorrente BOOLEAN DEFAULT false,
    ds_frequencia VARCHAR(20), -- 'diario', 'semanal', 'mensal', 'anual'
    nr_dias_antecedencia INTEGER, -- Enviar lembrete X dias antes

    -- Referências opcionais
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,
    id_tarefa UUID, -- Para futuras tarefas

    -- Status
    st_enviado BOOLEAN DEFAULT false,
    dt_enviado TIMESTAMP,
    st_concluido BOOLEAN DEFAULT false,
    dt_concluido TIMESTAMP,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lembretes_user ON tb_lembretes(id_user);
CREATE INDEX idx_lembretes_data ON tb_lembretes(dt_lembrete);
CREATE INDEX idx_lembretes_enviado ON tb_lembretes(st_enviado);
CREATE INDEX idx_lembretes_agendamento ON tb_lembretes(id_agendamento);

-- =============================================
-- ATIVIDADES DO SISTEMA (Audit Log)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_atividades (
    id_atividade UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Tipo de atividade
    ds_tipo VARCHAR(50) NOT NULL,
    -- 'criar', 'editar', 'deletar', 'login', 'logout', 'acesso', 'upload', 'download', etc.

    -- Entidade afetada
    ds_entidade VARCHAR(100) NOT NULL, -- 'agendamento', 'usuario', 'produto', etc.
    id_entidade UUID, -- ID do registro afetado

    -- Detalhes
    ds_acao VARCHAR(500) NOT NULL, -- Descrição legível da ação
    ds_dados_antes JSONB, -- Estado antes da mudança
    ds_dados_depois JSONB, -- Estado depois da mudança
    ds_dados_adicionais JSONB, -- Metadados extras

    -- Origem
    ds_ip VARCHAR(45), -- Suporta IPv6
    ds_user_agent TEXT,
    ds_origem VARCHAR(50), -- 'web', 'mobile', 'api', 'sistema'

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atividades_user ON tb_atividades(id_user);
CREATE INDEX idx_atividades_empresa ON tb_atividades(id_empresa);
CREATE INDEX idx_atividades_tipo ON tb_atividades(ds_tipo);
CREATE INDEX idx_atividades_entidade ON tb_atividades(ds_entidade);
CREATE INDEX idx_atividades_entidade_id ON tb_atividades(id_entidade);
CREATE INDEX idx_atividades_criacao ON tb_atividades(dt_criacao DESC);

-- =============================================
-- PESQUISAS E FEEDBACKS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_pesquisas (
    id_pesquisa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Pesquisa
    nm_titulo VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    ds_tipo VARCHAR(50) DEFAULT 'nps', -- 'nps', 'satisfacao', 'personalizada'

    -- Perguntas (JSONB array)
    ds_perguntas JSONB NOT NULL,
    -- Ex: [{"id": "1", "tipo": "escala", "pergunta": "Como você avalia?", "min": 0, "max": 10}]

    -- Configuração
    st_anonima BOOLEAN DEFAULT false,
    st_obrigatoria BOOLEAN DEFAULT false,

    -- Período
    dt_inicio DATE,
    dt_fim DATE,

    -- Status
    st_ativa BOOLEAN DEFAULT true,

    -- Estatísticas
    nr_total_respostas INTEGER DEFAULT 0,
    nr_nps_score DECIMAL(5, 2), -- Net Promoter Score calculado

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pesquisas_empresa ON tb_pesquisas(id_empresa);
CREATE INDEX idx_pesquisas_ativa ON tb_pesquisas(st_ativa);
CREATE INDEX idx_pesquisas_periodo ON tb_pesquisas(dt_inicio, dt_fim);

-- =============================================
-- RESPOSTAS DE PESQUISAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_respostas_pesquisas (
    id_resposta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pesquisa UUID REFERENCES tb_pesquisas(id_pesquisa) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Referências opcionais (contexto da pesquisa)
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE SET NULL,

    -- Respostas (JSONB object)
    ds_respostas JSONB NOT NULL,
    -- Ex: {"1": 9, "2": "Excelente atendimento", "3": ["opcao1", "opcao2"]}

    -- NPS
    nr_nota_nps INTEGER CHECK (nr_nota_nps >= 0 AND nr_nota_nps <= 10),
    ds_categoria_nps VARCHAR(20), -- 'detrator', 'neutro', 'promotor'

    -- Feedback adicional
    ds_comentario TEXT,

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_respostas_pesquisas_pesquisa ON tb_respostas_pesquisas(id_pesquisa);
CREATE INDEX idx_respostas_pesquisas_user ON tb_respostas_pesquisas(id_user);
CREATE INDEX idx_respostas_pesquisas_nps ON tb_respostas_pesquisas(nr_nota_nps);
CREATE INDEX idx_respostas_pesquisas_agendamento ON tb_respostas_pesquisas(id_agendamento);

-- =============================================
-- BANNERS E ANÚNCIOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_banners (
    id_banner UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Conteúdo
    nm_titulo VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    ds_imagem_url TEXT NOT NULL,
    ds_imagem_mobile_url TEXT, -- Imagem otimizada para mobile

    -- Ação
    ds_tipo_acao VARCHAR(50), -- 'link', 'produto', 'procedimento', 'promocao'
    ds_url TEXT,
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE SET NULL,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE SET NULL,

    -- Posicionamento
    ds_posicao VARCHAR(50) DEFAULT 'home', -- 'home', 'produtos', 'procedimentos', 'perfil'
    nr_ordem INTEGER DEFAULT 0,

    -- Período de exibição
    dt_inicio TIMESTAMP NOT NULL,
    dt_fim TIMESTAMP NOT NULL,

    -- Segmentação
    ds_publico_alvo VARCHAR(50), -- 'todos', 'pacientes', 'profissionais', 'novos_usuarios'

    -- Estatísticas
    nr_visualizacoes INTEGER DEFAULT 0,
    nr_cliques INTEGER DEFAULT 0,
    nr_taxa_conversao DECIMAL(5, 2) DEFAULT 0,

    -- Status
    st_ativo BOOLEAN DEFAULT true,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banners_empresa ON tb_banners(id_empresa);
CREATE INDEX idx_banners_posicao ON tb_banners(ds_posicao);
CREATE INDEX idx_banners_periodo ON tb_banners(dt_inicio, dt_fim);
CREATE INDEX idx_banners_ativo ON tb_banners(st_ativo);

-- =============================================
-- CLIQUES EM BANNERS (tracking)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_cliques_banners (
    id_clique UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_banner UUID REFERENCES tb_banners(id_banner) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Origem
    ds_ip VARCHAR(45),
    ds_user_agent TEXT,

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cliques_banners_banner ON tb_cliques_banners(id_banner);
CREATE INDEX idx_cliques_banners_user ON tb_cliques_banners(id_user);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function para calcular categoria NPS
CREATE OR REPLACE FUNCTION calcular_categoria_nps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nr_nota_nps IS NOT NULL THEN
        NEW.ds_categoria_nps := CASE
            WHEN NEW.nr_nota_nps >= 0 AND NEW.nr_nota_nps <= 6 THEN 'detrator'
            WHEN NEW.nr_nota_nps >= 7 AND NEW.nr_nota_nps <= 8 THEN 'neutro'
            WHEN NEW.nr_nota_nps >= 9 AND NEW.nr_nota_nps <= 10 THEN 'promotor'
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar NPS score da pesquisa
CREATE OR REPLACE FUNCTION atualizar_nps_pesquisa()
RETURNS TRIGGER AS $$
DECLARE
    total_respostas INTEGER;
    promotores INTEGER;
    detratores INTEGER;
    nps_score DECIMAL(5, 2);
BEGIN
    -- Contar respostas
    SELECT COUNT(*) INTO total_respostas
    FROM tb_respostas_pesquisas
    WHERE id_pesquisa = NEW.id_pesquisa AND nr_nota_nps IS NOT NULL;

    IF total_respostas > 0 THEN
        -- Contar promotores
        SELECT COUNT(*) INTO promotores
        FROM tb_respostas_pesquisas
        WHERE id_pesquisa = NEW.id_pesquisa AND ds_categoria_nps = 'promotor';

        -- Contar detratores
        SELECT COUNT(*) INTO detratores
        FROM tb_respostas_pesquisas
        WHERE id_pesquisa = NEW.id_pesquisa AND ds_categoria_nps = 'detrator';

        -- Calcular NPS: ((promotores - detratores) / total) * 100
        nps_score := ((promotores::DECIMAL - detratores::DECIMAL) / total_respostas::DECIMAL) * 100;

        -- Atualizar pesquisa
        UPDATE tb_pesquisas
        SET nr_nps_score = nps_score,
            nr_total_respostas = total_respostas
        WHERE id_pesquisa = NEW.id_pesquisa;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_update_notificacoes BEFORE UPDATE ON tb_notificacoes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_preferencias_notificacao BEFORE UPDATE ON tb_preferencias_notificacao
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_dispositivos BEFORE UPDATE ON tb_dispositivos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_lembretes BEFORE UPDATE ON tb_lembretes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_pesquisas BEFORE UPDATE ON tb_pesquisas
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_banners BEFORE UPDATE ON tb_banners
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- Trigger para calcular categoria NPS
CREATE TRIGGER trg_categoria_nps BEFORE INSERT OR UPDATE ON tb_respostas_pesquisas
FOR EACH ROW EXECUTE FUNCTION calcular_categoria_nps();

-- Trigger para atualizar NPS score
CREATE TRIGGER trg_nps_score AFTER INSERT OR UPDATE ON tb_respostas_pesquisas
FOR EACH ROW EXECUTE FUNCTION atualizar_nps_pesquisa();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE tb_notificacoes IS 'Notificações multi-canal para usuários (push, email, SMS, WhatsApp)';
COMMENT ON TABLE tb_preferencias_notificacao IS 'Preferências de notificação por usuário e canal';
COMMENT ON TABLE tb_dispositivos IS 'Dispositivos registrados para push notifications';
COMMENT ON TABLE tb_lembretes IS 'Lembretes e alertas programados';
COMMENT ON TABLE tb_atividades IS 'Log de atividades e auditoria do sistema';
COMMENT ON TABLE tb_pesquisas IS 'Pesquisas de satisfação e NPS';
COMMENT ON TABLE tb_respostas_pesquisas IS 'Respostas das pesquisas';
COMMENT ON TABLE tb_banners IS 'Banners e anúncios promocionais';
COMMENT ON TABLE tb_cliques_banners IS 'Rastreamento de cliques em banners';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
