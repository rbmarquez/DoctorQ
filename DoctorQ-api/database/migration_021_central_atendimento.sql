-- Migration: Central de Atendimento Omnichannel
-- Data: 2025-11-22
-- Descrição: Cria as tabelas para o módulo de Central de Atendimento Omnichannel
-- Tabelas: tb_canais_omni, tb_contatos_omni, tb_conversas_omni, tb_mensagens_omni,
--          tb_campanhas, tb_campanha_destinatarios, tb_lead_scores, tb_lead_score_historico,
--          tb_filas_atendimento, tb_atendimento_items

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================

-- Tipo de canal
DO $$ BEGIN
    CREATE TYPE tp_canal_enum AS ENUM ('whatsapp', 'instagram', 'facebook', 'email', 'sms', 'webchat');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Status do canal
DO $$ BEGIN
    CREATE TYPE st_canal_enum AS ENUM ('ativo', 'inativo', 'configurando', 'erro', 'suspenso');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Status do contato
DO $$ BEGIN
    CREATE TYPE st_contato_omni_enum AS ENUM ('lead', 'qualificado', 'cliente', 'inativo', 'bloqueado');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tipo de mensagem
DO $$ BEGIN
    CREATE TYPE tp_mensagem_omni_enum AS ENUM ('texto', 'imagem', 'video', 'audio', 'documento', 'localizacao', 'contato', 'sticker', 'template', 'interativo', 'reacao', 'sistema');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Status de entrega da mensagem
DO $$ BEGIN
    CREATE TYPE st_mensagem_omni_enum AS ENUM ('pendente', 'enviada', 'entregue', 'lida', 'falha', 'deletada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Status da campanha
DO $$ BEGIN
    CREATE TYPE st_campanha_enum AS ENUM ('rascunho', 'agendada', 'em_execucao', 'pausada', 'concluida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tipo de campanha
DO $$ BEGIN
    CREATE TYPE tp_campanha_enum AS ENUM ('prospeccao', 'reengajamento', 'marketing', 'lembrete', 'followup', 'pesquisa');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Status do atendimento
DO $$ BEGIN
    CREATE TYPE st_atendimento_enum AS ENUM ('aguardando', 'em_atendimento', 'pausado', 'transferido', 'finalizado', 'abandonado');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABELA: tb_canais_omni
-- Canais de comunicação omnichannel
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_canais_omni (
    id_canal UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Informações do canal
    nm_canal VARCHAR(100) NOT NULL,
    tp_canal tp_canal_enum NOT NULL,
    ds_descricao TEXT,

    -- Status
    st_canal st_canal_enum NOT NULL DEFAULT 'configurando',
    st_ativo BOOLEAN NOT NULL DEFAULT true,

    -- Identificadores externos (WhatsApp, Instagram, etc.)
    id_telefone_whatsapp VARCHAR(20),
    id_instagram VARCHAR(100),
    id_facebook_page VARCHAR(100),
    nm_email VARCHAR(255),

    -- Credenciais (criptografadas ou referência)
    ds_credenciais JSONB DEFAULT '{}',
    id_credencial UUID, -- Referência para tb_credenciais se usar vault

    -- Configurações
    ds_configuracoes JSONB DEFAULT '{}',

    -- Webhooks
    ds_webhook_url VARCHAR(500),
    ds_webhook_secret VARCHAR(255),

    -- Métricas
    nr_mensagens_enviadas INTEGER DEFAULT 0,
    nr_mensagens_recebidas INTEGER DEFAULT 0,
    nr_conversas_ativas INTEGER DEFAULT 0,
    dt_ultima_sincronizacao TIMESTAMP WITH TIME ZONE,

    -- Auditoria
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_desativacao TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT uk_canal_empresa_tipo UNIQUE (id_empresa, tp_canal, id_telefone_whatsapp)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_canais_omni_empresa ON tb_canais_omni(id_empresa);
CREATE INDEX IF NOT EXISTS idx_canais_omni_tipo ON tb_canais_omni(tp_canal);
CREATE INDEX IF NOT EXISTS idx_canais_omni_ativo ON tb_canais_omni(st_ativo);

COMMENT ON TABLE tb_canais_omni IS 'Canais de comunicação omnichannel (WhatsApp, Instagram, etc.)';

-- ============================================================================
-- TABELA: tb_contatos_omni
-- Contatos unificados omnichannel
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_contatos_omni (
    id_contato UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Dados pessoais
    nm_contato VARCHAR(255) NOT NULL,
    nm_apelido VARCHAR(100),
    nm_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    nr_telefone_secundario VARCHAR(20),
    nr_documento VARCHAR(20), -- CPF/CNPJ

    -- Localização
    ds_endereco TEXT,
    nm_cidade VARCHAR(100),
    nm_estado VARCHAR(2),
    nr_cep VARCHAR(10),
    nm_pais VARCHAR(50) DEFAULT 'Brasil',

    -- Status
    st_contato st_contato_omni_enum NOT NULL DEFAULT 'lead',
    st_ativo BOOLEAN NOT NULL DEFAULT true,
    st_bloqueado BOOLEAN NOT NULL DEFAULT false,

    -- Identificadores externos (por canal)
    id_whatsapp VARCHAR(50),
    id_instagram VARCHAR(100),
    id_facebook VARCHAR(100),

    -- Relacionamento com paciente (se existir)
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE SET NULL,

    -- Preferências
    ds_preferencias JSONB DEFAULT '{}',
    ds_tags TEXT[] DEFAULT '{}',

    -- Origem
    nm_origem VARCHAR(100), -- Campanha, site, indicação, etc.
    nm_canal_origem VARCHAR(50), -- Canal de primeiro contato

    -- Metadados
    ds_metadata JSONB DEFAULT '{}',
    ds_notas TEXT,

    -- Métricas
    nr_conversas_total INTEGER DEFAULT 0,
    nr_agendamentos_total INTEGER DEFAULT 0,
    nr_compras_total INTEGER DEFAULT 0,
    vl_total_gasto DECIMAL(15,2) DEFAULT 0,

    -- Timestamps
    dt_primeiro_contato TIMESTAMP WITH TIME ZONE,
    dt_ultimo_contato TIMESTAMP WITH TIME ZONE,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT uk_contato_empresa_telefone UNIQUE (id_empresa, nr_telefone)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contatos_omni_empresa ON tb_contatos_omni(id_empresa);
CREATE INDEX IF NOT EXISTS idx_contatos_omni_telefone ON tb_contatos_omni(nr_telefone);
CREATE INDEX IF NOT EXISTS idx_contatos_omni_email ON tb_contatos_omni(nm_email);
CREATE INDEX IF NOT EXISTS idx_contatos_omni_whatsapp ON tb_contatos_omni(id_whatsapp);
CREATE INDEX IF NOT EXISTS idx_contatos_omni_status ON tb_contatos_omni(st_contato);
CREATE INDEX IF NOT EXISTS idx_contatos_omni_paciente ON tb_contatos_omni(id_paciente);

COMMENT ON TABLE tb_contatos_omni IS 'Contatos unificados omnichannel com dados de múltiplos canais';

-- ============================================================================
-- TABELA: tb_filas_atendimento
-- Filas de atendimento humano
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_filas_atendimento (
    id_fila UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Informações da fila
    nm_fila VARCHAR(100) NOT NULL,
    ds_descricao TEXT,
    nm_cor VARCHAR(7) DEFAULT '#3B82F6',

    -- Status
    st_ativa BOOLEAN NOT NULL DEFAULT true,
    st_padrao BOOLEAN NOT NULL DEFAULT false, -- Fila padrão

    -- SLA (em segundos)
    nr_sla_primeira_resposta INTEGER DEFAULT 300, -- 5 minutos
    nr_sla_resposta INTEGER DEFAULT 600, -- 10 minutos
    nr_sla_resolucao INTEGER DEFAULT 86400, -- 24 horas

    -- Distribuição
    nm_modo_distribuicao VARCHAR(30) DEFAULT 'round_robin', -- round_robin, menos_ocupado, skill_based
    nr_limite_simultaneo INTEGER DEFAULT 5,

    -- Horário de funcionamento
    ds_horario_funcionamento JSONB DEFAULT '{
        "segunda": {"inicio": "08:00", "fim": "18:00", "ativo": true},
        "terca": {"inicio": "08:00", "fim": "18:00", "ativo": true},
        "quarta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
        "quinta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
        "sexta": {"inicio": "08:00", "fim": "18:00", "ativo": true},
        "sabado": {"inicio": "08:00", "fim": "12:00", "ativo": false},
        "domingo": {"ativo": false}
    }',

    -- Mensagens automáticas
    ds_mensagem_boas_vindas TEXT,
    ds_mensagem_fora_horario TEXT,
    ds_mensagem_aguardando TEXT DEFAULT 'Aguarde um momento, em breve um atendente irá lhe ajudar.',

    -- Regras de roteamento
    ds_regras_roteamento JSONB DEFAULT '[]',

    -- Atendentes (array de UUIDs)
    ds_atendentes UUID[] DEFAULT '{}',

    -- Métricas (atualizadas em tempo real)
    nr_atendimentos_hoje INTEGER DEFAULT 0,
    nr_aguardando INTEGER DEFAULT 0,
    nr_tempo_espera_medio INTEGER DEFAULT 0, -- segundos
    nr_tempo_atendimento_medio INTEGER DEFAULT 0, -- segundos

    -- Prioridade
    nr_prioridade INTEGER DEFAULT 0,

    -- Timestamps
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_filas_empresa ON tb_filas_atendimento(id_empresa);
CREATE INDEX IF NOT EXISTS idx_filas_ativa ON tb_filas_atendimento(st_ativa);
CREATE INDEX IF NOT EXISTS idx_filas_empresa_ativa ON tb_filas_atendimento(id_empresa, st_ativa);

COMMENT ON TABLE tb_filas_atendimento IS 'Filas de atendimento humano com SLA e distribuição inteligente';

-- ============================================================================
-- TABELA: tb_conversas_omni
-- Conversas omnichannel
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_conversas_omni (
    id_conversa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_contato UUID NOT NULL REFERENCES tb_contatos_omni(id_contato) ON DELETE CASCADE,

    -- Canal
    id_canal UUID REFERENCES tb_canais_omni(id_canal) ON DELETE SET NULL,
    tp_canal tp_canal_enum NOT NULL,

    -- Título e resumo
    nm_titulo VARCHAR(255),
    ds_resumo TEXT,

    -- Status
    st_aberta BOOLEAN NOT NULL DEFAULT true,
    st_arquivada BOOLEAN NOT NULL DEFAULT false,
    st_bot_ativo BOOLEAN NOT NULL DEFAULT true,
    st_aguardando_humano BOOLEAN NOT NULL DEFAULT false,

    -- Atendimento
    id_atendente UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_fila UUID REFERENCES tb_filas_atendimento(id_fila) ON DELETE SET NULL,
    id_agente UUID, -- Agente de IA (referência futura)

    -- Métricas
    nr_mensagens_total INTEGER DEFAULT 0,
    nr_mensagens_entrada INTEGER DEFAULT 0,
    nr_mensagens_saida INTEGER DEFAULT 0,
    nr_tempo_resposta_medio INTEGER DEFAULT 0, -- segundos

    -- Contexto para IA
    ds_contexto JSONB DEFAULT '{}',
    ds_metadata JSONB DEFAULT '{}',

    -- Avaliação
    nr_avaliacao INTEGER CHECK (nr_avaliacao >= 1 AND nr_avaliacao <= 5),
    ds_feedback TEXT,

    -- Timestamps
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_ultima_mensagem TIMESTAMP WITH TIME ZONE,
    dt_fechamento TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversas_empresa ON tb_conversas_omni(id_empresa);
CREATE INDEX IF NOT EXISTS idx_conversas_contato ON tb_conversas_omni(id_contato);
CREATE INDEX IF NOT EXISTS idx_conversas_empresa_contato ON tb_conversas_omni(id_empresa, id_contato);
CREATE INDEX IF NOT EXISTS idx_conversas_empresa_aberta ON tb_conversas_omni(id_empresa, st_aberta);
CREATE INDEX IF NOT EXISTS idx_conversas_atendente ON tb_conversas_omni(id_atendente, st_aberta);
CREATE INDEX IF NOT EXISTS idx_conversas_fila ON tb_conversas_omni(id_fila);

COMMENT ON TABLE tb_conversas_omni IS 'Conversas unificadas omnichannel com histórico completo';

-- ============================================================================
-- TABELA: tb_mensagens_omni
-- Mensagens das conversas omnichannel
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_mensagens_omni (
    id_mensagem UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversa UUID NOT NULL REFERENCES tb_conversas_omni(id_conversa) ON DELETE CASCADE,

    -- ID externo (da plataforma)
    id_externo VARCHAR(255),

    -- Direção e origem
    st_entrada BOOLEAN NOT NULL DEFAULT true, -- true = do contato, false = para o contato
    nm_remetente VARCHAR(100), -- Nome de quem enviou

    -- Tipo e conteúdo
    tp_mensagem tp_mensagem_omni_enum NOT NULL DEFAULT 'texto',
    ds_conteudo TEXT NOT NULL,
    ds_conteudo_original TEXT, -- Conteúdo original (antes de formatação)

    -- Mídia
    ds_url_midia VARCHAR(500),
    nm_tipo_midia VARCHAR(100), -- MIME type
    nr_tamanho_midia INTEGER, -- bytes
    ds_transcricao TEXT, -- Transcrição de áudio

    -- Status
    st_mensagem st_mensagem_omni_enum NOT NULL DEFAULT 'pendente',
    st_lida BOOLEAN NOT NULL DEFAULT false,

    -- Metadados
    ds_metadata JSONB DEFAULT '{}',
    ds_erro TEXT, -- Mensagem de erro se falhou

    -- Timestamps
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_envio TIMESTAMP WITH TIME ZONE,
    dt_entrega TIMESTAMP WITH TIME ZONE,
    dt_leitura TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON tb_mensagens_omni(id_conversa);
CREATE INDEX IF NOT EXISTS idx_mensagens_externo ON tb_mensagens_omni(id_externo);
CREATE INDEX IF NOT EXISTS idx_mensagens_criacao ON tb_mensagens_omni(dt_criacao);
CREATE INDEX IF NOT EXISTS idx_mensagens_status ON tb_mensagens_omni(st_mensagem);

COMMENT ON TABLE tb_mensagens_omni IS 'Mensagens de conversas omnichannel com suporte a múltiplos tipos';

-- ============================================================================
-- TABELA: tb_atendimento_items
-- Itens na fila de atendimento
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_atendimento_items (
    id_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_fila UUID NOT NULL REFERENCES tb_filas_atendimento(id_fila) ON DELETE CASCADE,
    id_conversa UUID NOT NULL REFERENCES tb_conversas_omni(id_conversa) ON DELETE CASCADE,
    id_contato UUID NOT NULL REFERENCES tb_contatos_omni(id_contato) ON DELETE CASCADE,

    -- Atendente
    id_atendente UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_atendente_anterior UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Status
    st_atendimento st_atendimento_enum NOT NULL DEFAULT 'aguardando',

    -- Prioridade
    nr_prioridade INTEGER DEFAULT 0,
    nr_posicao_fila INTEGER,

    -- Protocolo
    nr_protocolo VARCHAR(20),

    -- Motivo
    ds_motivo TEXT,
    ds_motivo_transferencia TEXT,

    -- SLA
    dt_sla_primeira_resposta TIMESTAMP WITH TIME ZONE,
    dt_sla_resolucao TIMESTAMP WITH TIME ZONE,
    st_sla_estourado BOOLEAN DEFAULT false,

    -- Timestamps
    dt_entrada_fila TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_inicio_atendimento TIMESTAMP WITH TIME ZONE,
    dt_fim_atendimento TIMESTAMP WITH TIME ZONE,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Métricas
    nr_tempo_espera INTEGER DEFAULT 0, -- segundos
    nr_tempo_atendimento INTEGER DEFAULT 0 -- segundos
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_atendimento_items_empresa ON tb_atendimento_items(id_empresa);
CREATE INDEX IF NOT EXISTS idx_atendimento_items_fila ON tb_atendimento_items(id_fila);
CREATE INDEX IF NOT EXISTS idx_atendimento_items_conversa ON tb_atendimento_items(id_conversa);
CREATE INDEX IF NOT EXISTS idx_atendimento_items_atendente ON tb_atendimento_items(id_atendente);
CREATE INDEX IF NOT EXISTS idx_atendimento_items_status ON tb_atendimento_items(st_atendimento);
CREATE INDEX IF NOT EXISTS idx_atendimento_items_fila_status ON tb_atendimento_items(id_fila, st_atendimento);

COMMENT ON TABLE tb_atendimento_items IS 'Itens na fila de atendimento humano';

-- ============================================================================
-- TABELA: tb_campanhas
-- Campanhas de prospecção e marketing
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_campanhas (
    id_campanha UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Informações
    nm_campanha VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    tp_campanha tp_campanha_enum NOT NULL,

    -- Status
    st_campanha st_campanha_enum NOT NULL DEFAULT 'rascunho',

    -- Canal
    tp_canal tp_canal_enum NOT NULL,
    id_canal UUID REFERENCES tb_canais_omni(id_canal) ON DELETE SET NULL,

    -- Template
    nm_template VARCHAR(100),
    ds_mensagem TEXT NOT NULL,
    ds_variaveis JSONB DEFAULT '{}', -- Variáveis disponíveis no template

    -- Agendamento
    dt_agendamento TIMESTAMP WITH TIME ZONE,
    dt_inicio TIMESTAMP WITH TIME ZONE,
    dt_fim TIMESTAMP WITH TIME ZONE,

    -- Limites
    nr_limite_diario INTEGER DEFAULT 100,
    nr_intervalo_segundos INTEGER DEFAULT 60, -- Intervalo entre envios

    -- Filtros de destinatários
    ds_filtros JSONB DEFAULT '{}',

    -- Métricas
    nr_total_destinatarios INTEGER DEFAULT 0,
    nr_enviados INTEGER DEFAULT 0,
    nr_entregues INTEGER DEFAULT 0,
    nr_lidos INTEGER DEFAULT 0,
    nr_respondidos INTEGER DEFAULT 0,
    nr_convertidos INTEGER DEFAULT 0,
    nr_erros INTEGER DEFAULT 0,
    pc_taxa_abertura DECIMAL(5,2) DEFAULT 0,
    pc_taxa_resposta DECIMAL(5,2) DEFAULT 0,
    pc_taxa_conversao DECIMAL(5,2) DEFAULT 0,

    -- Criador
    id_criador UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Timestamps
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa ON tb_campanhas(id_empresa);
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON tb_campanhas(st_campanha);
CREATE INDEX IF NOT EXISTS idx_campanhas_tipo ON tb_campanhas(tp_campanha);
CREATE INDEX IF NOT EXISTS idx_campanhas_agendamento ON tb_campanhas(dt_agendamento);

COMMENT ON TABLE tb_campanhas IS 'Campanhas de prospecção proativa e marketing';

-- ============================================================================
-- TABELA: tb_campanha_destinatarios
-- Destinatários de campanhas
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_campanha_destinatarios (
    id_destinatario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_campanha UUID NOT NULL REFERENCES tb_campanhas(id_campanha) ON DELETE CASCADE,
    id_contato UUID NOT NULL REFERENCES tb_contatos_omni(id_contato) ON DELETE CASCADE,

    -- Status
    st_enviado BOOLEAN DEFAULT false,
    st_entregue BOOLEAN DEFAULT false,
    st_lido BOOLEAN DEFAULT false,
    st_respondido BOOLEAN DEFAULT false,
    st_convertido BOOLEAN DEFAULT false,
    st_erro BOOLEAN DEFAULT false,

    -- Detalhes
    ds_erro TEXT,
    id_mensagem_externo VARCHAR(255),

    -- Variáveis personalizadas
    ds_variaveis JSONB DEFAULT '{}',

    -- Timestamps
    dt_envio TIMESTAMP WITH TIME ZONE,
    dt_entrega TIMESTAMP WITH TIME ZONE,
    dt_leitura TIMESTAMP WITH TIME ZONE,
    dt_resposta TIMESTAMP WITH TIME ZONE,
    dt_conversao TIMESTAMP WITH TIME ZONE,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Constraint única
    CONSTRAINT uk_campanha_contato UNIQUE (id_campanha, id_contato)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campanha_dest_campanha ON tb_campanha_destinatarios(id_campanha);
CREATE INDEX IF NOT EXISTS idx_campanha_dest_contato ON tb_campanha_destinatarios(id_contato);
CREATE INDEX IF NOT EXISTS idx_campanha_dest_enviado ON tb_campanha_destinatarios(st_enviado);

COMMENT ON TABLE tb_campanha_destinatarios IS 'Destinatários de campanhas com tracking individual';

-- ============================================================================
-- TABELA: tb_lead_scores
-- Lead scoring com IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_lead_scores (
    id_score UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contato UUID NOT NULL REFERENCES tb_contatos_omni(id_contato) ON DELETE CASCADE UNIQUE,
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Score total (0-100)
    nr_score_total INTEGER NOT NULL DEFAULT 0 CHECK (nr_score_total >= 0 AND nr_score_total <= 100),

    -- Scores por dimensão (0-100)
    nr_score_comportamento INTEGER DEFAULT 0 CHECK (nr_score_comportamento >= 0 AND nr_score_comportamento <= 100),
    nr_score_perfil INTEGER DEFAULT 0 CHECK (nr_score_perfil >= 0 AND nr_score_perfil <= 100),
    nr_score_engajamento INTEGER DEFAULT 0 CHECK (nr_score_engajamento >= 0 AND nr_score_engajamento <= 100),
    nr_score_intencao INTEGER DEFAULT 0 CHECK (nr_score_intencao >= 0 AND nr_score_intencao <= 100),

    -- Temperatura (0-100)
    nr_temperatura INTEGER DEFAULT 0 CHECK (nr_temperatura >= 0 AND nr_temperatura <= 100),

    -- Pesos do cálculo
    ds_pesos JSONB DEFAULT '{
        "comportamento": 0.25,
        "perfil": 0.20,
        "engajamento": 0.30,
        "intencao": 0.25
    }',

    -- Fatores detalhados
    ds_fatores JSONB DEFAULT '{}',

    -- Recomendações da IA
    ds_recomendacoes JSONB DEFAULT '[]',

    -- Status
    nm_classificacao VARCHAR(20) DEFAULT 'frio', -- frio, morno, quente
    st_qualificado BOOLEAN DEFAULT false,
    st_prioridade_alta BOOLEAN DEFAULT false,

    -- Timestamps
    dt_calculo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_proximo_calculo TIMESTAMP WITH TIME ZONE,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lead_scores_contato ON tb_lead_scores(id_contato);
CREATE INDEX IF NOT EXISTS idx_lead_scores_empresa ON tb_lead_scores(id_empresa);
CREATE INDEX IF NOT EXISTS idx_lead_scores_total ON tb_lead_scores(nr_score_total DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_temperatura ON tb_lead_scores(nr_temperatura DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_classificacao ON tb_lead_scores(nm_classificacao);

COMMENT ON TABLE tb_lead_scores IS 'Lead scoring com IA para priorização de contatos';

-- ============================================================================
-- TABELA: tb_lead_score_historico
-- Histórico de scores para análise de tendência
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_lead_score_historico (
    id_historico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_score UUID NOT NULL REFERENCES tb_lead_scores(id_score) ON DELETE CASCADE,
    id_contato UUID NOT NULL REFERENCES tb_contatos_omni(id_contato) ON DELETE CASCADE,

    -- Snapshot dos scores
    nr_score_total INTEGER NOT NULL,
    nr_score_comportamento INTEGER DEFAULT 0,
    nr_score_perfil INTEGER DEFAULT 0,
    nr_score_engajamento INTEGER DEFAULT 0,
    nr_score_intencao INTEGER DEFAULT 0,
    nr_temperatura INTEGER DEFAULT 0,

    -- Motivo da alteração
    nm_evento VARCHAR(100),
    ds_detalhes JSONB DEFAULT '{}',

    -- Timestamp
    dt_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lead_score_hist_score ON tb_lead_score_historico(id_score);
CREATE INDEX IF NOT EXISTS idx_lead_score_hist_contato ON tb_lead_score_historico(id_contato);
CREATE INDEX IF NOT EXISTS idx_lead_score_hist_data ON tb_lead_score_historico(dt_registro);

COMMENT ON TABLE tb_lead_score_historico IS 'Histórico de alterações de lead score para análise de tendência';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para atualizar dt_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_central_atendimento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
            'tb_canais_omni', 'tb_contatos_omni', 'tb_conversas_omni',
            'tb_filas_atendimento', 'tb_atendimento_items', 'tb_campanhas',
            'tb_lead_scores'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_central_atendimento_updated_at();
        ', t.table_name, t.table_name, t.table_name, t.table_name);
    END LOOP;
END;
$$;

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Criar fila padrão para cada empresa existente
INSERT INTO tb_filas_atendimento (id_empresa, nm_fila, ds_descricao, st_padrao)
SELECT
    id_empresa,
    'Atendimento Geral',
    'Fila padrão de atendimento ao cliente',
    true
FROM tb_empresas
WHERE NOT EXISTS (
    SELECT 1 FROM tb_filas_atendimento WHERE tb_filas_atendimento.id_empresa = tb_empresas.id_empresa
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON COLUMN tb_canais_omni.ds_credenciais IS 'Credenciais do canal (tokens, secrets) - devem ser criptografadas';
COMMENT ON COLUMN tb_contatos_omni.ds_tags IS 'Tags para segmentação do contato';
COMMENT ON COLUMN tb_filas_atendimento.nm_modo_distribuicao IS 'Modo de distribuição: round_robin, menos_ocupado, skill_based';
COMMENT ON COLUMN tb_lead_scores.nm_classificacao IS 'Classificação automática: frio, morno, quente';
