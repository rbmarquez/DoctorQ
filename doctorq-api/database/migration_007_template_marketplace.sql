-- Migration 007: Template Marketplace System
-- Data: 2025-10-21
-- Descrição: Cria tabelas para o sistema de marketplace de templates de agentes

-- ============================================================================
-- 1. TABELA DE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_templates (
    id_template UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Informações básicas
    nm_template VARCHAR(200) NOT NULL,
    ds_template TEXT,
    nm_category VARCHAR(50) NOT NULL DEFAULT 'other',

    -- Status e visibilidade
    nm_status VARCHAR(20) NOT NULL DEFAULT 'draft',
    nm_visibility VARCHAR(20) NOT NULL DEFAULT 'public',

    -- Criador do template
    id_user_creator UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_empresa_creator UUID REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,

    -- Configuração do agente (JSON)
    js_agent_config JSONB NOT NULL,
    -- Formato exemplo:
    -- {
    --   "name": "Customer Support Bot",
    --   "system_prompt": "You are a helpful customer support agent...",
    --   "model": "gpt-4",
    --   "temperature": 0.7,
    --   "max_tokens": 2000,
    --   "tools": ["web_search", "calculator"],
    --   "knowledge_base_ids": ["uuid1", "uuid2"],
    --   "settings": {...}
    -- }

    -- Metadados
    ds_tags JSONB,  -- ["chatbot", "support", "sales"]
    ds_metadata JSONB,
    nm_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',

    -- Estatísticas
    nr_install_count INTEGER NOT NULL DEFAULT 0,
    nr_rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    nr_rating_count INTEGER NOT NULL DEFAULT 0,

    -- Imagem/Ícone
    ds_image_url VARCHAR(500),
    ds_icon_url VARCHAR(500),

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_publicacao TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_template_status CHECK (nm_status IN ('draft', 'published', 'archived', 'deprecated')),
    CONSTRAINT chk_template_visibility CHECK (nm_visibility IN ('public', 'private', 'organization')),
    CONSTRAINT chk_template_category CHECK (nm_category IN (
        'customer_service', 'sales', 'support', 'hr', 'marketing',
        'analytics', 'productivity', 'legal', 'finance', 'education', 'other'
    )),
    CONSTRAINT chk_rating_avg CHECK (nr_rating_avg >= 0.00 AND nr_rating_avg <= 5.00)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON tb_templates(nm_category);
CREATE INDEX IF NOT EXISTS idx_templates_status ON tb_templates(nm_status);
CREATE INDEX IF NOT EXISTS idx_templates_visibility ON tb_templates(nm_visibility);
CREATE INDEX IF NOT EXISTS idx_templates_creator_user ON tb_templates(id_user_creator);
CREATE INDEX IF NOT EXISTS idx_templates_creator_empresa ON tb_templates(id_empresa_creator);
CREATE INDEX IF NOT EXISTS idx_templates_rating ON tb_templates(nr_rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_templates_installs ON tb_templates(nr_install_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON tb_templates USING GIN(ds_tags);

-- Índice de busca full-text
CREATE INDEX IF NOT EXISTS idx_templates_search ON tb_templates
USING GIN(to_tsvector('portuguese', COALESCE(nm_template, '') || ' ' || COALESCE(ds_template, '')));

-- Comentários
COMMENT ON TABLE tb_templates IS 'Templates de agentes para o marketplace';
COMMENT ON COLUMN tb_templates.js_agent_config IS 'Configuração completa do agente em formato JSON';
COMMENT ON COLUMN tb_templates.nm_status IS 'Status: draft, published, archived, deprecated';
COMMENT ON COLUMN tb_templates.nm_visibility IS 'Visibilidade: public, private, organization';
COMMENT ON COLUMN tb_templates.nr_rating_avg IS 'Média de avaliações (0.00 a 5.00)';

-- ============================================================================
-- 2. TABELA DE INSTALAÇÕES DE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_template_installations (
    id_installation UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template e usuário
    id_template UUID NOT NULL REFERENCES tb_templates(id_template) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Agente criado a partir do template
    id_agente UUID REFERENCES tb_agentes(id_agente) ON DELETE SET NULL,

    -- Customizações feitas na instalação
    js_customizations JSONB,
    -- Exemplo:
    -- {
    --   "system_prompt_override": "Custom prompt...",
    --   "model_override": "gpt-3.5-turbo",
    --   "temperature_override": 0.9,
    --   "custom_tools": [...]
    -- }

    -- Status da instalação
    bl_ativo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoria
    dt_instalacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_ultima_atualizacao TIMESTAMP,

    -- Constraint: um usuário não pode instalar o mesmo template duas vezes (ativo)
    CONSTRAINT uq_template_user_active UNIQUE (id_template, id_user)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_installations_template ON tb_template_installations(id_template);
CREATE INDEX IF NOT EXISTS idx_installations_user ON tb_template_installations(id_user);
CREATE INDEX IF NOT EXISTS idx_installations_empresa ON tb_template_installations(id_empresa);
CREATE INDEX IF NOT EXISTS idx_installations_agente ON tb_template_installations(id_agente);
CREATE INDEX IF NOT EXISTS idx_installations_ativo ON tb_template_installations(bl_ativo);
CREATE INDEX IF NOT EXISTS idx_installations_data ON tb_template_installations(dt_instalacao DESC);

-- Comentários
COMMENT ON TABLE tb_template_installations IS 'Rastreamento de instalações de templates por usuários';
COMMENT ON COLUMN tb_template_installations.js_customizations IS 'Customizações aplicadas na instalação';
COMMENT ON COLUMN tb_template_installations.id_agente IS 'Agente criado a partir do template (se aplicável)';

-- ============================================================================
-- 3. TABELA DE AVALIAÇÕES DE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_template_reviews (
    id_review UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template e usuário
    id_template UUID NOT NULL REFERENCES tb_templates(id_template) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Avaliação
    nr_rating INTEGER NOT NULL CHECK (nr_rating >= 1 AND nr_rating <= 5),
    ds_title VARCHAR(200),
    ds_review TEXT,

    -- Metadata
    bl_verified_install BOOLEAN NOT NULL DEFAULT FALSE,  -- Usuário realmente instalou?

    -- Moderação
    bl_aprovado BOOLEAN NOT NULL DEFAULT TRUE,
    ds_moderacao_nota TEXT,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: um usuário pode fazer apenas uma review por template
    CONSTRAINT uq_template_user_review UNIQUE (id_template, id_user)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_template ON tb_template_reviews(id_template);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON tb_template_reviews(id_user);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON tb_template_reviews(nr_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_aprovado ON tb_template_reviews(bl_aprovado);
CREATE INDEX IF NOT EXISTS idx_reviews_data ON tb_template_reviews(dt_criacao DESC);

-- Comentários
COMMENT ON TABLE tb_template_reviews IS 'Avaliações e reviews de templates por usuários';
COMMENT ON COLUMN tb_template_reviews.nr_rating IS 'Avaliação de 1 a 5 estrelas';
COMMENT ON COLUMN tb_template_reviews.bl_verified_install IS 'Se TRUE, usuário realmente instalou o template';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Trigger para atualizar estatísticas do template após instalação
CREATE OR REPLACE FUNCTION atualizar_install_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tb_templates
        SET nr_install_count = nr_install_count + 1
        WHERE id_template = NEW.id_template;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tb_templates
        SET nr_install_count = GREATEST(0, nr_install_count - 1)
        WHERE id_template = OLD.id_template;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_install_count ON tb_template_installations;
CREATE TRIGGER trigger_update_install_count
AFTER INSERT OR DELETE ON tb_template_installations
FOR EACH ROW
EXECUTE FUNCTION atualizar_install_count();

-- Trigger para atualizar rating médio após review
CREATE OR REPLACE FUNCTION atualizar_template_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating NUMERIC(3, 2);
    v_rating_count INTEGER;
BEGIN
    -- Calcular nova média e contagem
    SELECT
        COALESCE(AVG(nr_rating), 0.00)::NUMERIC(3, 2),
        COUNT(*)
    INTO v_avg_rating, v_rating_count
    FROM tb_template_reviews
    WHERE id_template = COALESCE(NEW.id_template, OLD.id_template)
      AND bl_aprovado = TRUE;

    -- Atualizar template
    UPDATE tb_templates
    SET
        nr_rating_avg = v_avg_rating,
        nr_rating_count = v_rating_count
    WHERE id_template = COALESCE(NEW.id_template, OLD.id_template);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_template_rating ON tb_template_reviews;
CREATE TRIGGER trigger_update_template_rating
AFTER INSERT OR UPDATE OR DELETE ON tb_template_reviews
FOR EACH ROW
EXECUTE FUNCTION atualizar_template_rating();

-- Trigger para verificar se usuário instalou antes de permitir review
CREATE OR REPLACE FUNCTION verificar_instalacao_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se usuário instalou o template
    IF EXISTS (
        SELECT 1 FROM tb_template_installations
        WHERE id_template = NEW.id_template
          AND id_user = NEW.id_user
    ) THEN
        NEW.bl_verified_install = TRUE;
    ELSE
        NEW.bl_verified_install = FALSE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verificar_instalacao ON tb_template_reviews;
CREATE TRIGGER trigger_verificar_instalacao
BEFORE INSERT OR UPDATE ON tb_template_reviews
FOR EACH ROW
EXECUTE FUNCTION verificar_instalacao_review();

-- Trigger para atualizar timestamp de atualizacao
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_template_atualizacao ON tb_templates;
CREATE TRIGGER trigger_template_atualizacao
BEFORE UPDATE ON tb_templates
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

DROP TRIGGER IF EXISTS trigger_review_atualizacao ON tb_template_reviews;
CREATE TRIGGER trigger_review_atualizacao
BEFORE UPDATE ON tb_template_reviews
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- View de templates populares
CREATE OR REPLACE VIEW vw_templates_populares AS
SELECT
    t.id_template,
    t.nm_template,
    t.ds_template,
    t.nm_category,
    t.nm_status,
    t.nr_install_count,
    t.nr_rating_avg,
    t.nr_rating_count,
    t.dt_publicacao,
    COUNT(DISTINCT i.id_installation) as nr_active_installs,
    COUNT(DISTINCT r.id_review) as nr_reviews
FROM tb_templates t
LEFT JOIN tb_template_installations i ON t.id_template = i.id_template AND i.bl_ativo = TRUE
LEFT JOIN tb_template_reviews r ON t.id_template = r.id_template AND r.bl_aprovado = TRUE
WHERE t.nm_status = 'published'
  AND t.nm_visibility = 'public'
GROUP BY t.id_template, t.nm_template, t.ds_template, t.nm_category,
         t.nm_status, t.nr_install_count, t.nr_rating_avg, t.nr_rating_count, t.dt_publicacao
ORDER BY t.nr_install_count DESC, t.nr_rating_avg DESC;

COMMENT ON VIEW vw_templates_populares IS 'Templates mais populares (publicados, públicos, ordenados por instalações)';

-- View de estatísticas por categoria
CREATE OR REPLACE VIEW vw_template_stats_por_categoria AS
SELECT
    nm_category,
    COUNT(*) as nr_templates,
    SUM(nr_install_count) as nr_total_installs,
    AVG(nr_rating_avg) as avg_rating,
    COUNT(DISTINCT id_user_creator) as nr_creators
FROM tb_templates
WHERE nm_status = 'published'
GROUP BY nm_category
ORDER BY nr_total_installs DESC;

COMMENT ON VIEW vw_template_stats_por_categoria IS 'Estatísticas de templates agrupadas por categoria';

-- View de templates do usuário (criados ou instalados)
CREATE OR REPLACE VIEW vw_user_templates AS
SELECT
    u.id_user,
    u.nm_email,
    t.id_template,
    t.nm_template,
    t.nm_category,
    CASE
        WHEN t.id_user_creator = u.id_user THEN 'creator'
        WHEN i.id_installation IS NOT NULL THEN 'installer'
        ELSE 'other'
    END as relationship_type,
    t.nr_install_count,
    t.nr_rating_avg,
    i.dt_instalacao,
    i.bl_ativo as installation_active
FROM tb_users u
LEFT JOIN tb_templates t ON u.id_user = t.id_user_creator
LEFT JOIN tb_template_installations i ON u.id_user = i.id_user AND t.id_template = i.id_template
WHERE t.id_template IS NOT NULL OR i.id_installation IS NOT NULL;

COMMENT ON VIEW vw_user_templates IS 'Templates associados a cada usuário (criados ou instalados)';

-- View de reviews recentes
CREATE OR REPLACE VIEW vw_reviews_recentes AS
SELECT
    r.id_review,
    r.id_template,
    t.nm_template,
    r.id_user,
    u.nm_email,
    u.nm_completo,
    r.nr_rating,
    r.ds_title,
    r.ds_review,
    r.bl_verified_install,
    r.bl_aprovado,
    r.dt_criacao
FROM tb_template_reviews r
INNER JOIN tb_templates t ON r.id_template = t.id_template
INNER JOIN tb_users u ON r.id_user = u.id_user
WHERE r.bl_aprovado = TRUE
ORDER BY r.dt_criacao DESC
LIMIT 100;

COMMENT ON VIEW vw_reviews_recentes IS 'Reviews aprovadas mais recentes (últimas 100)';

-- ============================================================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para buscar templates por similaridade de texto
CREATE OR REPLACE FUNCTION buscar_templates(
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id_template UUID,
    nm_template VARCHAR(200),
    ds_template TEXT,
    nm_category VARCHAR(50),
    nr_rating_avg NUMERIC(3, 2),
    nr_install_count INTEGER,
    similarity_score REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id_template,
        t.nm_template,
        t.ds_template,
        t.nm_category,
        t.nr_rating_avg,
        t.nr_install_count,
        ts_rank(
            to_tsvector('portuguese', COALESCE(t.nm_template, '') || ' ' || COALESCE(t.ds_template, '')),
            plainto_tsquery('portuguese', p_query)
        ) as similarity_score
    FROM tb_templates t
    WHERE t.nm_status = 'published'
      AND t.nm_visibility = 'public'
      AND to_tsvector('portuguese', COALESCE(t.nm_template, '') || ' ' || COALESCE(t.ds_template, ''))
          @@ plainto_tsquery('portuguese', p_query)
    ORDER BY similarity_score DESC, t.nr_install_count DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION buscar_templates IS 'Busca templates por similaridade textual (full-text search)';

-- Função para verificar se usuário pode instalar template
CREATE OR REPLACE FUNCTION pode_instalar_template(
    p_user_id UUID,
    p_template_id UUID
)
RETURNS TABLE (
    pode_instalar BOOLEAN,
    motivo TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_template_exists BOOLEAN;
    v_template_status VARCHAR(20);
    v_template_visibility VARCHAR(20);
    v_already_installed BOOLEAN;
BEGIN
    -- Verificar se template existe
    SELECT EXISTS(SELECT 1 FROM tb_templates WHERE id_template = p_template_id)
    INTO v_template_exists;

    IF NOT v_template_exists THEN
        RETURN QUERY SELECT FALSE, 'Template não encontrado'::TEXT;
        RETURN;
    END IF;

    -- Verificar status e visibilidade
    SELECT nm_status, nm_visibility
    INTO v_template_status, v_template_visibility
    FROM tb_templates
    WHERE id_template = p_template_id;

    IF v_template_status != 'published' THEN
        RETURN QUERY SELECT FALSE, 'Template não está publicado'::TEXT;
        RETURN;
    END IF;

    -- Verificar se já instalou
    SELECT EXISTS(
        SELECT 1 FROM tb_template_installations
        WHERE id_template = p_template_id
          AND id_user = p_user_id
          AND bl_ativo = TRUE
    ) INTO v_already_installed;

    IF v_already_installed THEN
        RETURN QUERY SELECT FALSE, 'Template já está instalado'::TEXT;
        RETURN;
    END IF;

    -- Pode instalar
    RETURN QUERY SELECT TRUE, 'Pode instalar'::TEXT;
END;
$$;

COMMENT ON FUNCTION pode_instalar_template IS 'Verifica se usuário pode instalar um template';

-- ============================================================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 'Migration 007 aplicada com sucesso!' as resultado;
SELECT 'Tabelas criadas: tb_templates, tb_template_installations, tb_template_reviews' as tabelas;
SELECT 'Views criadas: vw_templates_populares, vw_template_stats_por_categoria, vw_user_templates, vw_reviews_recentes' as views;
SELECT 'Funções criadas: buscar_templates, pode_instalar_template' as funcoes;
SELECT 'Triggers criados: atualizar_install_count, atualizar_template_rating, verificar_instalacao_review' as triggers;
