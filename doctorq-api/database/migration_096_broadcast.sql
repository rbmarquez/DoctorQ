-- =====================================================
-- Migration 096: Sistema de Broadcast de Mensagens
-- UC096 - Broadcast de Mensagens
-- Data: 07/11/2025
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: tb_broadcast_templates (PRIMEIRO)
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_broadcast_templates (
    id_template UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Identificação
    nm_template VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    tp_canal VARCHAR(20) NOT NULL CHECK (tp_canal IN ('email', 'whatsapp', 'sms', 'push', 'mensagem_interna')),

    -- Conteúdo
    ds_assunto VARCHAR(255),
    ds_corpo TEXT NOT NULL,
    ds_variaveis JSONB,  -- Lista de variáveis: {{nome}}, {{clinica}}, etc

    -- Categorização
    tp_categoria VARCHAR(50),  -- promocional, informativo, lembrete

    -- Metadados
    fg_ativo BOOLEAN NOT NULL DEFAULT true,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE tb_broadcast_templates IS 'Templates reutilizáveis para campanhas de broadcast';
COMMENT ON COLUMN tb_broadcast_templates.ds_variaveis IS 'JSON com lista de variáveis permitidas no template';

-- =====================================================
-- TABELA: tb_broadcast_campanhas (SEGUNDO)
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_broadcast_campanhas (
    id_campanha UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_user_criador UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE RESTRICT,

    -- Identificação
    nm_campanha VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    tp_campanha VARCHAR(20) NOT NULL DEFAULT 'informativo' CHECK (tp_campanha IN ('promocional', 'informativo', 'transacional', 'lembrete')),

    -- Conteúdo
    ds_assunto VARCHAR(255),  -- Para email
    ds_mensagem TEXT NOT NULL,
    ds_template_id UUID REFERENCES tb_broadcast_templates(id_template) ON DELETE SET NULL,

    -- Canal e segmentação
    tp_canal VARCHAR(20) NOT NULL DEFAULT 'email' CHECK (tp_canal IN ('email', 'whatsapp', 'sms', 'push', 'mensagem_interna')),
    ds_filtros_segmentacao JSONB,  -- Filtros aplicados

    -- Agendamento
    dt_agendamento TIMESTAMP,
    fg_agendada BOOLEAN NOT NULL DEFAULT false,

    -- Controle de envio
    st_campanha VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (st_campanha IN ('rascunho', 'agendada', 'processando', 'enviada', 'cancelada', 'erro')),
    dt_inicio_envio TIMESTAMP,
    dt_fim_envio TIMESTAMP,

    -- Estatísticas
    nr_total_destinatarios INTEGER NOT NULL DEFAULT 0,
    nr_enviados INTEGER NOT NULL DEFAULT 0,
    nr_entregues INTEGER NOT NULL DEFAULT 0,
    nr_falhas INTEGER NOT NULL DEFAULT 0,
    nr_abertos INTEGER NOT NULL DEFAULT 0,
    nr_cliques INTEGER NOT NULL DEFAULT 0,

    -- Metadados
    ds_metadados JSONB,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now(),
    fg_ativo BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE tb_broadcast_campanhas IS 'Campanhas de broadcast (envio em massa)';
COMMENT ON COLUMN tb_broadcast_campanhas.tp_campanha IS 'promocional | informativo | transacional | lembrete';
COMMENT ON COLUMN tb_broadcast_campanhas.tp_canal IS 'email | whatsapp | sms | push | mensagem_interna';
COMMENT ON COLUMN tb_broadcast_campanhas.st_campanha IS 'rascunho | agendada | processando | enviada | cancelada | erro';
COMMENT ON COLUMN tb_broadcast_campanhas.ds_filtros_segmentacao IS 'JSON com filtros de segmentação aplicados';

-- =====================================================
-- TABELA: tb_broadcast_destinatarios (TERCEIRO)
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_broadcast_destinatarios (
    id_destinatario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_campanha UUID NOT NULL REFERENCES tb_broadcast_campanhas(id_campanha) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Contato
    ds_email VARCHAR(255),
    ds_telefone VARCHAR(20),
    ds_push_token VARCHAR(255),

    -- Status de entrega
    st_envio VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (st_envio IN ('pendente', 'enviado', 'entregue', 'falha', 'aberto', 'clicado')),
    ds_mensagem_erro TEXT,

    -- Timestamps de ações
    dt_enviado TIMESTAMP,
    dt_entregue TIMESTAMP,
    dt_aberto TIMESTAMP,
    dt_clicado TIMESTAMP,
    nr_vezes_aberto INTEGER NOT NULL DEFAULT 0,
    nr_vezes_clicado INTEGER NOT NULL DEFAULT 0,

    -- Metadados
    ds_metadados JSONB,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now(),

    -- Constraint: destinatário único por campanha
    CONSTRAINT uk_broadcast_campanha_user UNIQUE (id_campanha, id_user)
);

COMMENT ON TABLE tb_broadcast_destinatarios IS 'Destinatários individuais de cada campanha com tracking de entrega';
COMMENT ON COLUMN tb_broadcast_destinatarios.st_envio IS 'pendente | enviado | entregue | falha | aberto | clicado';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- tb_broadcast_campanhas
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_empresa ON tb_broadcast_campanhas(id_empresa);
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_criador ON tb_broadcast_campanhas(id_user_criador);
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_status ON tb_broadcast_campanhas(st_campanha);
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_canal ON tb_broadcast_campanhas(tp_canal);
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_dt_criacao ON tb_broadcast_campanhas(dt_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_dt_agendamento ON tb_broadcast_campanhas(dt_agendamento) WHERE dt_agendamento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_agendadas ON tb_broadcast_campanhas(st_campanha, dt_agendamento) WHERE st_campanha = 'agendada';

-- Índice GIN para busca em JSON (filtros)
CREATE INDEX IF NOT EXISTS idx_broadcast_campanhas_filtros_gin ON tb_broadcast_campanhas USING GIN (ds_filtros_segmentacao);

-- tb_broadcast_destinatarios
CREATE INDEX IF NOT EXISTS idx_broadcast_destinatarios_campanha ON tb_broadcast_destinatarios(id_campanha);
CREATE INDEX IF NOT EXISTS idx_broadcast_destinatarios_user ON tb_broadcast_destinatarios(id_user);
CREATE INDEX IF NOT EXISTS idx_broadcast_destinatarios_status ON tb_broadcast_destinatarios(st_envio);
CREATE INDEX IF NOT EXISTS idx_broadcast_destinatarios_dt_enviado ON tb_broadcast_destinatarios(dt_enviado DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_destinatarios_campanha_status ON tb_broadcast_destinatarios(id_campanha, st_envio);

-- tb_broadcast_templates
CREATE INDEX IF NOT EXISTS idx_broadcast_templates_empresa ON tb_broadcast_templates(id_empresa);
CREATE INDEX IF NOT EXISTS idx_broadcast_templates_canal ON tb_broadcast_templates(tp_canal);
CREATE INDEX IF NOT EXISTS idx_broadcast_templates_ativo ON tb_broadcast_templates(fg_ativo);

-- =====================================================
-- FUNÇÕES DE NEGÓCIO
-- =====================================================

-- Função para atualizar estatísticas da campanha
CREATE OR REPLACE FUNCTION atualizar_estatisticas_campanha(p_id_campanha UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tb_broadcast_campanhas
    SET
        nr_enviados = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio IN ('enviado', 'entregue', 'aberto', 'clicado')),
        nr_entregues = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio IN ('entregue', 'aberto', 'clicado')),
        nr_falhas = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio = 'falha'),
        nr_abertos = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio IN ('aberto', 'clicado')),
        nr_cliques = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio = 'clicado'),
        dt_atualizacao = now()
    WHERE id_campanha = p_id_campanha;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_estatisticas_campanha IS 'Atualiza estatísticas de envio da campanha baseado nos destinatários';

-- Função para obter taxa de abertura
CREATE OR REPLACE FUNCTION calcular_taxa_abertura(p_id_campanha UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_entregues INTEGER;
    v_abertos INTEGER;
    v_taxa NUMERIC;
BEGIN
    SELECT nr_entregues, nr_abertos INTO v_entregues, v_abertos
    FROM tb_broadcast_campanhas
    WHERE id_campanha = p_id_campanha;

    IF v_entregues = 0 THEN
        RETURN 0;
    END IF;

    v_taxa := (v_abertos::NUMERIC / v_entregues::NUMERIC) * 100;
    RETURN ROUND(v_taxa, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_taxa_abertura IS 'Calcula taxa de abertura: (abertos / entregues) × 100';

-- Função para calcular taxa de clique
CREATE OR REPLACE FUNCTION calcular_taxa_clique(p_id_campanha UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_abertos INTEGER;
    v_cliques INTEGER;
    v_taxa NUMERIC;
BEGIN
    SELECT nr_abertos, nr_cliques INTO v_abertos, v_cliques
    FROM tb_broadcast_campanhas
    WHERE id_campanha = p_id_campanha;

    IF v_abertos = 0 THEN
        RETURN 0;
    END IF;

    v_taxa := (v_cliques::NUMERIC / v_abertos::NUMERIC) * 100;
    RETURN ROUND(v_taxa, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_taxa_clique IS 'Calcula taxa de clique: (cliques / abertos) × 100';

-- Função para buscar campanhas agendadas para processamento
CREATE OR REPLACE FUNCTION buscar_campanhas_agendadas_para_envio()
RETURNS TABLE (
    id_campanha UUID,
    nm_campanha VARCHAR,
    dt_agendamento TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id_campanha,
        c.nm_campanha,
        c.dt_agendamento
    FROM tb_broadcast_campanhas c
    WHERE c.st_campanha = 'agendada'
      AND c.dt_agendamento <= now()
      AND c.fg_ativo = true
    ORDER BY c.dt_agendamento;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_campanhas_agendadas_para_envio IS 'Retorna campanhas agendadas prontas para envio (dt_agendamento <= now)';

-- =====================================================
-- VIEW: Painel de Campanhas com Estatísticas
-- =====================================================

CREATE OR REPLACE VIEW vw_broadcast_painel AS
SELECT
    c.id_campanha,
    c.id_empresa,
    c.nm_campanha,
    c.tp_campanha,
    c.tp_canal,
    c.st_campanha,
    c.dt_agendamento,
    c.nr_total_destinatarios,
    c.nr_enviados,
    c.nr_entregues,
    c.nr_falhas,
    c.nr_abertos,
    c.nr_cliques,
    -- Taxas calculadas
    CASE
        WHEN c.nr_enviados > 0 THEN ROUND((c.nr_entregues::NUMERIC / c.nr_enviados::NUMERIC) * 100, 2)
        ELSE 0
    END AS taxa_entrega,
    CASE
        WHEN c.nr_entregues > 0 THEN ROUND((c.nr_abertos::NUMERIC / c.nr_entregues::NUMERIC) * 100, 2)
        ELSE 0
    END AS taxa_abertura,
    CASE
        WHEN c.nr_abertos > 0 THEN ROUND((c.nr_cliques::NUMERIC / c.nr_abertos::NUMERIC) * 100, 2)
        ELSE 0
    END AS taxa_clique,
    CASE
        WHEN c.nr_enviados > 0 THEN ROUND((c.nr_falhas::NUMERIC / c.nr_enviados::NUMERIC) * 100, 2)
        ELSE 0
    END AS taxa_falha,
    -- Duração do envio
    CASE
        WHEN c.dt_inicio_envio IS NOT NULL AND c.dt_fim_envio IS NOT NULL
        THEN EXTRACT(EPOCH FROM (c.dt_fim_envio - c.dt_inicio_envio))::INTEGER
        ELSE NULL
    END AS duracao_segundos,
    c.dt_criacao,
    c.dt_inicio_envio,
    c.dt_fim_envio
FROM tb_broadcast_campanhas c
WHERE c.fg_ativo = true;

COMMENT ON VIEW vw_broadcast_painel IS 'Painel consolidado de campanhas com estatísticas calculadas';

-- =====================================================
-- VIEW: Ranking de Campanhas por Performance
-- =====================================================

CREATE OR REPLACE VIEW vw_broadcast_ranking AS
SELECT
    c.id_campanha,
    c.nm_campanha,
    c.tp_campanha,
    c.tp_canal,
    c.st_campanha,
    c.nr_total_destinatarios,
    c.nr_abertos,
    c.nr_cliques,
    CASE
        WHEN c.nr_entregues > 0 THEN ROUND((c.nr_abertos::NUMERIC / c.nr_entregues::NUMERIC) * 100, 2)
        ELSE 0
    END AS taxa_abertura,
    CASE
        WHEN c.nr_abertos > 0 THEN ROUND((c.nr_cliques::NUMERIC / c.nr_abertos::NUMERIC) * 100, 2)
        ELSE 0
    END AS taxa_clique,
    c.dt_criacao,
    -- Score de performance (ponderado)
    CASE
        WHEN c.nr_entregues > 0 AND c.nr_abertos > 0 THEN
            (c.nr_abertos::NUMERIC / c.nr_entregues::NUMERIC * 0.6) +
            (c.nr_cliques::NUMERIC / NULLIF(c.nr_abertos, 0) * 0.4)
        ELSE 0
    END AS score_performance
FROM tb_broadcast_campanhas c
WHERE c.fg_ativo = true
  AND c.st_campanha = 'enviada'
ORDER BY score_performance DESC;

COMMENT ON VIEW vw_broadcast_ranking IS 'Ranking de campanhas por performance (taxa abertura 60% + taxa clique 40%)';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION trg_atualizar_estatisticas_campanha()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.st_envio IS DISTINCT FROM NEW.st_envio) THEN
        PERFORM atualizar_estatisticas_campanha(NEW.id_campanha);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_broadcast_destinatario_atualizar_stats ON tb_broadcast_destinatarios;
CREATE TRIGGER trg_broadcast_destinatario_atualizar_stats
    AFTER UPDATE ON tb_broadcast_destinatarios
    FOR EACH ROW
    EXECUTE FUNCTION trg_atualizar_estatisticas_campanha();

-- Trigger para incrementar contadores de aberturas/cliques
CREATE OR REPLACE FUNCTION trg_incrementar_contadores_destinatario()
RETURNS TRIGGER AS $$
BEGIN
    -- Se mudou para 'aberto' e ainda não tinha data de abertura
    IF NEW.st_envio = 'aberto' AND OLD.st_envio != 'aberto' AND NEW.dt_aberto IS NULL THEN
        NEW.dt_aberto := now();
        NEW.nr_vezes_aberto := NEW.nr_vezes_aberto + 1;
    END IF;

    -- Se mudou para 'clicado' e ainda não tinha data de clique
    IF NEW.st_envio = 'clicado' AND OLD.st_envio != 'clicado' AND NEW.dt_clicado IS NULL THEN
        NEW.dt_clicado := now();
        NEW.nr_vezes_clicado := NEW.nr_vezes_clicado + 1;
        -- Se clicou, também conta como aberto
        IF NEW.dt_aberto IS NULL THEN
            NEW.dt_aberto := now();
            NEW.nr_vezes_aberto := NEW.nr_vezes_aberto + 1;
        END IF;
    END IF;

    NEW.dt_atualizacao := now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_broadcast_destinatario_contadores ON tb_broadcast_destinatarios;
CREATE TRIGGER trg_broadcast_destinatario_contadores
    BEFORE UPDATE ON tb_broadcast_destinatarios
    FOR EACH ROW
    EXECUTE FUNCTION trg_incrementar_contadores_destinatario();

-- =====================================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE tb_broadcast_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_broadcast_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_broadcast_templates ENABLE ROW LEVEL SECURITY;

-- Policy: usuários veem apenas campanhas da própria empresa
DROP POLICY IF EXISTS broadcast_campanhas_empresa_isolation ON tb_broadcast_campanhas;
CREATE POLICY broadcast_campanhas_empresa_isolation ON tb_broadcast_campanhas
    USING (id_empresa = current_setting('app.current_empresa_id', true)::UUID);

DROP POLICY IF EXISTS broadcast_destinatarios_empresa_isolation ON tb_broadcast_destinatarios;
CREATE POLICY broadcast_destinatarios_empresa_isolation ON tb_broadcast_destinatarios
    USING (
        id_campanha IN (
            SELECT id_campanha FROM tb_broadcast_campanhas
            WHERE id_empresa = current_setting('app.current_empresa_id', true)::UUID
        )
    );

DROP POLICY IF EXISTS broadcast_templates_empresa_isolation ON tb_broadcast_templates;
CREATE POLICY broadcast_templates_empresa_isolation ON tb_broadcast_templates
    USING (id_empresa = current_setting('app.current_empresa_id', true)::UUID);

-- =====================================================
-- DADOS DE EXEMPLO (DESENVOLVIMENTO)
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
    v_empresa_id UUID;
    v_user_id UUID;
    v_template_id UUID;
BEGIN
    SELECT COUNT(*) INTO v_count FROM tb_broadcast_campanhas;

    IF v_count = 0 THEN
        -- Buscar empresa e usuário de exemplo
        SELECT id_empresa INTO v_empresa_id FROM tb_empresas LIMIT 1;
        SELECT id_user INTO v_user_id FROM tb_users WHERE id_empresa = v_empresa_id LIMIT 1;

        IF v_empresa_id IS NOT NULL AND v_user_id IS NOT NULL THEN
            -- Criar template de exemplo
            INSERT INTO tb_broadcast_templates (
                id_empresa, nm_template, tp_canal, ds_assunto, ds_corpo, ds_variaveis
            ) VALUES (
                v_empresa_id,
                'Boas-vindas Novos Clientes',
                'email',
                'Bem-vindo à {{clinica}}!',
                E'Olá {{nome}},\n\nObrigado por escolher a {{clinica}}!\n\nEstamos felizes em tê-lo(a) como nosso cliente.\n\nAtenciosamente,\nEquipe {{clinica}}',
                '{"variaveis": ["nome", "clinica"]}'::jsonb
            ) RETURNING id_template INTO v_template_id;

            -- Criar campanha de exemplo
            INSERT INTO tb_broadcast_campanhas (
                id_empresa, id_user_criador, nm_campanha, ds_descricao,
                tp_campanha, ds_assunto, ds_mensagem, ds_template_id,
                tp_canal, st_campanha, nr_total_destinatarios
            ) VALUES (
                v_empresa_id,
                v_user_id,
                'Campanha de Boas-Vindas 2025',
                'Envio automático para novos clientes',
                'informativo',
                'Bem-vindo à nossa clínica!',
                'Olá! Obrigado por se cadastrar. Aproveite nossos serviços!',
                v_template_id,
                'email',
                'rascunho',
                0
            );

            RAISE NOTICE 'Template e campanha de exemplo criados';
        END IF;
    END IF;
END $$;

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
BEGIN
    -- Verificar se tabelas foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_broadcast_campanhas') THEN
        RAISE EXCEPTION 'Tabela tb_broadcast_campanhas não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_broadcast_destinatarios') THEN
        RAISE EXCEPTION 'Tabela tb_broadcast_destinatarios não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_broadcast_templates') THEN
        RAISE EXCEPTION 'Tabela tb_broadcast_templates não foi criada';
    END IF;

    -- Verificar se views foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_broadcast_painel') THEN
        RAISE EXCEPTION 'View vw_broadcast_painel não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_broadcast_ranking') THEN
        RAISE EXCEPTION 'View vw_broadcast_ranking não foi criada';
    END IF;

    RAISE NOTICE 'Migration 096 aplicada com sucesso!';
    RAISE NOTICE '- 3 tabelas criadas: tb_broadcast_campanhas, tb_broadcast_destinatarios, tb_broadcast_templates';
    RAISE NOTICE '- 15 índices criados';
    RAISE NOTICE '- 4 funções criadas';
    RAISE NOTICE '- 2 views criadas';
    RAISE NOTICE '- 2 triggers criados';
    RAISE NOTICE '- Row-Level Security habilitado';
END $$;
