-- =============================================
-- DoctorQ - Migration 013: Sistema de Mensagens
-- =============================================
-- Descrição: Tabelas para mensagens entre usuários
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================

-- =============================================
-- CONVERSAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_conversas_usuarios (
    id_conversa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Tipo de conversa
    ds_tipo VARCHAR(20) DEFAULT 'individual', -- 'individual', 'grupo', 'suporte'

    -- Título (para grupos)
    nm_titulo VARCHAR(255),
    ds_descricao TEXT,

    -- Configurações
    st_arquivada BOOLEAN DEFAULT false,
    st_bloqueada BOOLEAN DEFAULT false,
    ds_avatar_url TEXT,

    -- Última atividade
    dt_ultima_mensagem TIMESTAMP,
    id_ultima_mensagem UUID, -- Será referenciado abaixo

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversas_usuarios_empresa ON tb_conversas_usuarios(id_empresa);
CREATE INDEX idx_conversas_usuarios_tipo ON tb_conversas_usuarios(ds_tipo);
CREATE INDEX idx_conversas_usuarios_ultima_mensagem ON tb_conversas_usuarios(dt_ultima_mensagem DESC);

-- =============================================
-- PARTICIPANTES DA CONVERSA
-- =============================================

CREATE TABLE IF NOT EXISTS tb_participantes_conversa (
    id_participante UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversa UUID REFERENCES tb_conversas_usuarios(id_conversa) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Papel na conversa
    ds_papel VARCHAR(20) DEFAULT 'membro', -- 'admin', 'membro'

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    st_silenciado BOOLEAN DEFAULT false,

    -- Leitura
    dt_ultima_leitura TIMESTAMP,
    nr_mensagens_nao_lidas INTEGER DEFAULT 0,

    -- Notificações
    st_notificacoes_ativas BOOLEAN DEFAULT true,

    -- Metadata
    dt_entrada TIMESTAMP DEFAULT NOW(),
    dt_saida TIMESTAMP,

    -- Constraint: usuário único por conversa
    CONSTRAINT uk_user_conversa UNIQUE (id_conversa, id_user)
);

CREATE INDEX idx_participantes_conversa ON tb_participantes_conversa(id_conversa);
CREATE INDEX idx_participantes_user ON tb_participantes_conversa(id_user);
CREATE INDEX idx_participantes_ativo ON tb_participantes_conversa(st_ativo);

-- =============================================
-- MENSAGENS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_mensagens_usuarios (
    id_mensagem UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversa UUID REFERENCES tb_conversas_usuarios(id_conversa) ON DELETE CASCADE,
    id_remetente UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Resposta a outra mensagem (threading)
    id_mensagem_pai UUID REFERENCES tb_mensagens_usuarios(id_mensagem) ON DELETE SET NULL,

    -- Conteúdo
    ds_tipo_mensagem VARCHAR(20) DEFAULT 'texto',
    -- 'texto', 'imagem', 'video', 'audio', 'arquivo', 'localizacao', 'agendamento', 'produto'
    ds_conteudo TEXT NOT NULL,

    -- Mídia anexa
    ds_arquivos_url TEXT[], -- Array de URLs
    ds_metadados JSONB, -- Metadados adicionais (localização, duração de áudio, etc.)

    -- Referências externas
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE SET NULL,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE SET NULL,

    -- Status
    st_editada BOOLEAN DEFAULT false,
    st_deletada BOOLEAN DEFAULT false,
    dt_editada TIMESTAMP,
    dt_deletada TIMESTAMP,

    -- Entrega e leitura
    st_enviada BOOLEAN DEFAULT true,
    st_entregue BOOLEAN DEFAULT false,
    st_lida BOOLEAN DEFAULT false,
    dt_entregue TIMESTAMP,
    dt_lida TIMESTAMP,

    -- Reações
    ds_reacoes JSONB, -- {"👍": ["user_id_1", "user_id_2"], "❤️": ["user_id_3"]}

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mensagens_usuarios_conversa ON tb_mensagens_usuarios(id_conversa);
CREATE INDEX idx_mensagens_usuarios_remetente ON tb_mensagens_usuarios(id_remetente);
CREATE INDEX idx_mensagens_usuarios_tipo ON tb_mensagens_usuarios(ds_tipo_mensagem);
CREATE INDEX idx_mensagens_usuarios_criacao ON tb_mensagens_usuarios(dt_criacao DESC);
CREATE INDEX idx_mensagens_usuarios_pai ON tb_mensagens_usuarios(id_mensagem_pai);
CREATE INDEX idx_mensagens_usuarios_agendamento ON tb_mensagens_usuarios(id_agendamento);

-- =============================================
-- LEITURA DE MENSAGENS (tracking detalhado)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_leitura_mensagens (
    id_leitura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mensagem UUID REFERENCES tb_mensagens_usuarios(id_mensagem) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    dt_leitura TIMESTAMP DEFAULT NOW(),

    -- Constraint: uma leitura por usuário por mensagem
    CONSTRAINT uk_user_mensagem_leitura UNIQUE (id_mensagem, id_user)
);

CREATE INDEX idx_leitura_mensagens_mensagem ON tb_leitura_mensagens(id_mensagem);
CREATE INDEX idx_leitura_mensagens_user ON tb_leitura_mensagens(id_user);

-- =============================================
-- ANEXOS DE MENSAGENS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_anexos_mensagens (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mensagem UUID REFERENCES tb_mensagens_usuarios(id_mensagem) ON DELETE CASCADE,

    -- Arquivo
    nm_arquivo VARCHAR(500) NOT NULL,
    ds_url TEXT NOT NULL,
    ds_tipo_mime VARCHAR(100),
    nr_tamanho_bytes BIGINT,

    -- Thumbnail (para imagens/vídeos)
    ds_thumbnail_url TEXT,

    -- Metadados
    nr_largura INTEGER, -- Para imagens
    nr_altura INTEGER,
    nr_duracao_segundos INTEGER, -- Para vídeos/áudios

    -- Status
    st_processado BOOLEAN DEFAULT false,
    st_virus_scan BOOLEAN DEFAULT false, -- Scan de vírus
    ds_status_scan VARCHAR(50), -- 'limpo', 'infectado', 'pendente'

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anexos_mensagens_mensagem ON tb_anexos_mensagens(id_mensagem);
CREATE INDEX idx_anexos_mensagens_tipo ON tb_anexos_mensagens(ds_tipo_mime);

-- =============================================
-- MENSAGENS AGENDADAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_mensagens_agendadas (
    id_mensagem_agendada UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversa UUID REFERENCES tb_conversas_usuarios(id_conversa) ON DELETE CASCADE,
    id_remetente UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Conteúdo
    ds_conteudo TEXT NOT NULL,
    ds_arquivos_url TEXT[],

    -- Agendamento
    dt_envio_programado TIMESTAMP NOT NULL,
    st_enviada BOOLEAN DEFAULT false,
    dt_enviada TIMESTAMP,

    -- Referência à mensagem criada após envio
    id_mensagem_criada UUID REFERENCES tb_mensagens_usuarios(id_mensagem) ON DELETE SET NULL,

    -- Status
    st_cancelada BOOLEAN DEFAULT false,
    dt_cancelada TIMESTAMP,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mensagens_agendadas_conversa ON tb_mensagens_agendadas(id_conversa);
CREATE INDEX idx_mensagens_agendadas_envio ON tb_mensagens_agendadas(dt_envio_programado);
CREATE INDEX idx_mensagens_agendadas_enviada ON tb_mensagens_agendadas(st_enviada);

-- =============================================
-- TEMPLATES DE MENSAGENS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_templates_mensagens (
    id_template UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Template
    nm_template VARCHAR(255) NOT NULL,
    ds_conteudo TEXT NOT NULL,
    ds_categoria VARCHAR(100), -- 'confirmacao', 'lembrete', 'boas_vindas', etc.

    -- Variáveis disponíveis
    ds_variaveis TEXT[], -- Ex: ["{nome_paciente}", "{data_agendamento}", "{profissional}"]

    -- Uso
    nr_vezes_usado INTEGER DEFAULT 0,
    dt_ultimo_uso TIMESTAMP,

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    st_favorito BOOLEAN DEFAULT false,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_mensagens_empresa ON tb_templates_mensagens(id_empresa);
CREATE INDEX idx_templates_mensagens_user ON tb_templates_mensagens(id_user);
CREATE INDEX idx_templates_mensagens_categoria ON tb_templates_mensagens(ds_categoria);

-- =============================================
-- RESPOSTAS RÁPIDAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_respostas_rapidas (
    id_resposta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Atalho e conteúdo
    ds_atalho VARCHAR(50) NOT NULL, -- Ex: "/oi", "/confirmar"
    ds_conteudo TEXT NOT NULL,

    -- Uso
    nr_vezes_usado INTEGER DEFAULT 0,
    dt_ultimo_uso TIMESTAMP,

    st_ativo BOOLEAN DEFAULT true,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: atalho único por usuário
    CONSTRAINT uk_atalho_user UNIQUE (id_user, ds_atalho)
);

CREATE INDEX idx_respostas_rapidas_user ON tb_respostas_rapidas(id_user);
CREATE INDEX idx_respostas_rapidas_atalho ON tb_respostas_rapidas(ds_atalho);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function para atualizar contadores de mensagens não lidas
CREATE OR REPLACE FUNCTION atualizar_mensagens_nao_lidas()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contador para todos os participantes (exceto remetente)
    UPDATE tb_participantes_conversa
    SET nr_mensagens_nao_lidas = nr_mensagens_nao_lidas + 1
    WHERE id_conversa = NEW.id_conversa
      AND id_user != NEW.id_remetente
      AND st_ativo = true;

    -- Atualizar última mensagem da conversa
    UPDATE tb_conversas_usuarios
    SET dt_ultima_mensagem = NEW.dt_criacao,
        id_ultima_mensagem = NEW.id_mensagem
    WHERE id_conversa = NEW.id_conversa;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION marcar_mensagens_lidas()
RETURNS TRIGGER AS $$
BEGIN
    -- Zerar contador de mensagens não lidas
    UPDATE tb_participantes_conversa
    SET nr_mensagens_nao_lidas = 0,
        dt_ultima_leitura = NEW.dt_leitura
    WHERE id_conversa = (
        SELECT id_conversa FROM tb_mensagens_usuarios WHERE id_mensagem = NEW.id_mensagem
    ) AND id_user = NEW.id_user;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar contador de uso de template
CREATE OR REPLACE FUNCTION incrementar_uso_template()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementar contador quando template é usado
    UPDATE tb_templates_mensagens
    SET nr_vezes_usado = nr_vezes_usado + 1,
        dt_ultimo_uso = NOW()
    WHERE id_template = NEW.id_template;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_update_conversas_usuarios BEFORE UPDATE ON tb_conversas_usuarios
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_mensagens_agendadas BEFORE UPDATE ON tb_mensagens_agendadas
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_templates_mensagens BEFORE UPDATE ON tb_templates_mensagens
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_respostas_rapidas BEFORE UPDATE ON tb_respostas_rapidas
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- Trigger para atualizar mensagens não lidas
CREATE TRIGGER trg_nova_mensagem AFTER INSERT ON tb_mensagens_usuarios
FOR EACH ROW EXECUTE FUNCTION atualizar_mensagens_nao_lidas();

-- Trigger para marcar mensagens como lidas
CREATE TRIGGER trg_mensagem_lida AFTER INSERT ON tb_leitura_mensagens
FOR EACH ROW EXECUTE FUNCTION marcar_mensagens_lidas();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE tb_conversas_usuarios IS 'Conversas entre usuários (individual ou grupo)';
COMMENT ON TABLE tb_participantes_conversa IS 'Participantes de cada conversa';
COMMENT ON TABLE tb_mensagens_usuarios IS 'Mensagens trocadas nas conversas';
COMMENT ON TABLE tb_leitura_mensagens IS 'Rastreamento de leitura de mensagens por usuário';
COMMENT ON TABLE tb_anexos_mensagens IS 'Anexos de arquivos nas mensagens';
COMMENT ON TABLE tb_mensagens_agendadas IS 'Mensagens programadas para envio futuro';
COMMENT ON TABLE tb_templates_mensagens IS 'Templates reutilizáveis de mensagens';
COMMENT ON TABLE tb_respostas_rapidas IS 'Respostas rápidas com atalhos para usuários';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
