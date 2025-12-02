-- ============================================================================
-- Migration: Sistema de Conversas e Mensagens
-- Descrição: Cria infraestrutura completa para chat com agentes
-- Data: 2025-10-21
-- Sprint: 3 - Sistema de Conversas
-- ============================================================================

-- ============================================================================
-- 1. TABELA: tb_conversas
-- Descrição: Armazena conversas entre usuários e agentes
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_conversas (
    id_conversa UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    id_usuario UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE SET NULL,
    id_agente UUID NOT NULL REFERENCES tb_agentes(id_agente) ON DELETE CASCADE,

    -- Informações da conversa
    nm_titulo VARCHAR(255) NOT NULL DEFAULT 'Nova Conversa',
    ds_resumo TEXT,

    -- Estatísticas
    nr_total_mensagens INT DEFAULT 0,
    nr_mensagens_usuario INT DEFAULT 0,
    nr_mensagens_agente INT DEFAULT 0,
    nr_tokens_total INT DEFAULT 0,
    vl_custo_total DECIMAL(10, 6) DEFAULT 0.00,

    -- Status e configurações
    st_arquivada BOOLEAN DEFAULT FALSE,
    st_compartilhada BOOLEAN DEFAULT FALSE,
    st_favorita BOOLEAN DEFAULT FALSE,
    ds_token_compartilhamento VARCHAR(100) UNIQUE,

    -- Metadados
    ds_metadata JSONB DEFAULT '{}',
    ds_tags TEXT[],

    -- Timestamps
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),
    dt_ultima_mensagem TIMESTAMP,
    dt_arquivada TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_usuario ON tb_conversas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_conversas_empresa ON tb_conversas(id_empresa);
CREATE INDEX IF NOT EXISTS idx_conversas_agente ON tb_conversas(id_agente);
CREATE INDEX IF NOT EXISTS idx_conversas_dt_atualizacao ON tb_conversas(dt_atualizacao DESC);
CREATE INDEX IF NOT EXISTS idx_conversas_dt_ultima_mensagem ON tb_conversas(dt_ultima_mensagem DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversas_arquivada ON tb_conversas(st_arquivada) WHERE st_arquivada = FALSE;
CREATE INDEX IF NOT EXISTS idx_conversas_compartilhada ON tb_conversas(ds_token_compartilhamento) WHERE st_compartilhada = TRUE;
CREATE INDEX IF NOT EXISTS idx_conversas_tags ON tb_conversas USING GIN(ds_tags);

-- Comentários
COMMENT ON TABLE tb_conversas IS 'Armazena conversas entre usuários e agentes de IA';
COMMENT ON COLUMN tb_conversas.nm_titulo IS 'Título da conversa (auto-gerado ou manual)';
COMMENT ON COLUMN tb_conversas.ds_resumo IS 'Resumo automático da conversa';
COMMENT ON COLUMN tb_conversas.nr_total_mensagens IS 'Total de mensagens na conversa';
COMMENT ON COLUMN tb_conversas.st_compartilhada IS 'Se a conversa pode ser acessada via link público';
COMMENT ON COLUMN tb_conversas.ds_token_compartilhamento IS 'Token único para compartilhamento público';

-- ============================================================================
-- 2. TABELA: tb_mensagens
-- Descrição: Armazena mensagens individuais das conversas
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_mensagens (
    id_mensagem UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamento
    id_conversa UUID NOT NULL REFERENCES tb_conversas(id_conversa) ON DELETE CASCADE,

    -- Conteúdo
    nm_papel VARCHAR(20) NOT NULL CHECK (nm_papel IN ('user', 'assistant', 'system', 'function')),
    ds_conteudo TEXT NOT NULL,

    -- Metadados de processamento
    ds_metadata JSONB DEFAULT '{}',
    nr_tokens INT,
    vl_custo DECIMAL(10, 6),
    vl_temperatura DECIMAL(3, 2),
    nm_modelo VARCHAR(100),

    -- Status
    st_editada BOOLEAN DEFAULT FALSE,
    st_regenerada BOOLEAN DEFAULT FALSE,
    st_deletada BOOLEAN DEFAULT FALSE,
    st_streaming BOOLEAN DEFAULT FALSE,

    -- Referências (para regeneração/edição)
    id_mensagem_original UUID REFERENCES tb_mensagens(id_mensagem),
    id_mensagem_pai UUID REFERENCES tb_mensagens(id_mensagem),

    -- Timestamps
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),
    dt_deletada TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON tb_mensagens(id_conversa);
CREATE INDEX IF NOT EXISTS idx_mensagens_dt_criacao ON tb_mensagens(dt_criacao);
CREATE INDEX IF NOT EXISTS idx_mensagens_papel ON tb_mensagens(nm_papel);
CREATE INDEX IF NOT EXISTS idx_mensagens_nao_deletadas ON tb_mensagens(id_conversa, dt_criacao) WHERE st_deletada = FALSE;
CREATE INDEX IF NOT EXISTS idx_mensagens_metadata ON tb_mensagens USING GIN(ds_metadata);

-- Comentários
COMMENT ON TABLE tb_mensagens IS 'Armazena mensagens individuais de cada conversa';
COMMENT ON COLUMN tb_mensagens.nm_papel IS 'Papel da mensagem: user, assistant, system ou function';
COMMENT ON COLUMN tb_mensagens.ds_conteudo IS 'Conteúdo da mensagem (suporta Markdown)';
COMMENT ON COLUMN tb_mensagens.nr_tokens IS 'Número de tokens consumidos pela mensagem';
COMMENT ON COLUMN tb_mensagens.st_regenerada IS 'Se a mensagem foi regenerada';
COMMENT ON COLUMN tb_mensagens.id_mensagem_original IS 'Referência à mensagem original se foi editada';

-- ============================================================================
-- 3. TRIGGERS
-- Descrição: Automações e manutenção de integridade
-- ============================================================================

-- Trigger: Atualizar timestamp de atualização
CREATE OR REPLACE FUNCTION fn_atualizar_dt_atualizacao_conversa()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_dt_atualizacao_conversa
    BEFORE UPDATE ON tb_conversas
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_dt_atualizacao_conversa();

CREATE TRIGGER trg_atualizar_dt_atualizacao_mensagem
    BEFORE UPDATE ON tb_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_dt_atualizacao_conversa();

-- Trigger: Incrementar contador de mensagens
CREATE OR REPLACE FUNCTION fn_incrementar_contador_mensagens()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tb_conversas
    SET
        nr_total_mensagens = nr_total_mensagens + 1,
        nr_mensagens_usuario = CASE WHEN NEW.nm_papel = 'user' THEN nr_mensagens_usuario + 1 ELSE nr_mensagens_usuario END,
        nr_mensagens_agente = CASE WHEN NEW.nm_papel = 'assistant' THEN nr_mensagens_agente + 1 ELSE nr_mensagens_agente END,
        nr_tokens_total = nr_tokens_total + COALESCE(NEW.nr_tokens, 0),
        vl_custo_total = vl_custo_total + COALESCE(NEW.vl_custo, 0),
        dt_ultima_mensagem = NEW.dt_criacao,
        dt_atualizacao = NOW()
    WHERE id_conversa = NEW.id_conversa;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_incrementar_contador_mensagens
    AFTER INSERT ON tb_mensagens
    FOR EACH ROW
    WHEN (NEW.st_deletada = FALSE)
    EXECUTE FUNCTION fn_incrementar_contador_mensagens();

-- Trigger: Decrementar contador ao deletar mensagem
CREATE OR REPLACE FUNCTION fn_decrementar_contador_mensagens()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tb_conversas
    SET
        nr_total_mensagens = GREATEST(nr_total_mensagens - 1, 0),
        nr_mensagens_usuario = CASE
            WHEN OLD.nm_papel = 'user' THEN GREATEST(nr_mensagens_usuario - 1, 0)
            ELSE nr_mensagens_usuario
        END,
        nr_mensagens_agente = CASE
            WHEN OLD.nm_papel = 'assistant' THEN GREATEST(nr_mensagens_agente - 1, 0)
            ELSE nr_mensagens_agente
        END,
        nr_tokens_total = GREATEST(nr_tokens_total - COALESCE(OLD.nr_tokens, 0), 0),
        vl_custo_total = GREATEST(vl_custo_total - COALESCE(OLD.vl_custo, 0), 0),
        dt_atualizacao = NOW()
    WHERE id_conversa = OLD.id_conversa;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrementar_contador_mensagens
    AFTER UPDATE ON tb_mensagens
    FOR EACH ROW
    WHEN (OLD.st_deletada = FALSE AND NEW.st_deletada = TRUE)
    EXECUTE FUNCTION fn_decrementar_contador_mensagens();

-- ============================================================================
-- 4. FUNÇÕES AUXILIARES
-- Descrição: Funções úteis para o sistema de conversas
-- ============================================================================

-- Função: Gerar token de compartilhamento único
CREATE OR REPLACE FUNCTION fn_gerar_token_compartilhamento()
RETURNS VARCHAR(100) AS $$
DECLARE
    token VARCHAR(100);
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gera token aleatório de 32 caracteres
        token := encode(gen_random_bytes(24), 'base64');
        token := REPLACE(token, '/', '_');
        token := REPLACE(token, '+', '-');
        token := REPLACE(token, '=', '');

        -- Verifica se já existe
        SELECT EXISTS(
            SELECT 1 FROM tb_conversas WHERE ds_token_compartilhamento = token
        ) INTO existe;

        -- Se não existe, retorna
        IF NOT existe THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função: Buscar conversas por conteúdo
CREATE OR REPLACE FUNCTION fn_buscar_conversas_por_conteudo(
    p_usuario_id UUID,
    p_termo_busca TEXT,
    p_limite INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id_conversa UUID,
    nm_titulo VARCHAR(255),
    ds_resumo TEXT,
    nr_total_mensagens INT,
    dt_ultima_mensagem TIMESTAMP,
    relevancia FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id_conversa,
        c.nm_titulo,
        c.ds_resumo,
        c.nr_total_mensagens,
        c.dt_ultima_mensagem,
        ts_rank(
            to_tsvector('portuguese', COALESCE(c.nm_titulo, '') || ' ' || COALESCE(c.ds_resumo, '')),
            plainto_tsquery('portuguese', p_termo_busca)
        ) AS relevancia
    FROM tb_conversas c
    LEFT JOIN tb_mensagens m ON m.id_conversa = c.id_conversa
    WHERE
        c.id_usuario = p_usuario_id
        AND c.st_arquivada = FALSE
        AND (
            c.nm_titulo ILIKE '%' || p_termo_busca || '%'
            OR c.ds_resumo ILIKE '%' || p_termo_busca || '%'
            OR m.ds_conteudo ILIKE '%' || p_termo_busca || '%'
        )
    ORDER BY relevancia DESC, c.dt_ultima_mensagem DESC NULLS LAST
    LIMIT p_limite
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DESENVOLVIMENTO)
-- Descrição: Dados de teste para facilitar desenvolvimento
-- ============================================================================

-- Exemplo: Inserir conversa de demonstração
DO $$
DECLARE
    v_conversa_id UUID;
    v_usuario_id UUID;
    v_agente_id UUID;
BEGIN
    -- Buscar primeiro usuário e agente
    SELECT id_user INTO v_usuario_id FROM tb_users LIMIT 1;
    SELECT id_agente INTO v_agente_id FROM tb_agentes LIMIT 1;

    -- Apenas criar se ambos existirem
    IF v_usuario_id IS NOT NULL AND v_agente_id IS NOT NULL THEN
        -- Criar conversa de exemplo
        INSERT INTO tb_conversas (
            id_usuario,
            id_agente,
            nm_titulo,
            ds_resumo
        ) VALUES (
            v_usuario_id,
            v_agente_id,
            'Conversa de Exemplo - Bem-vindo ao InovaIA',
            'Uma conversa de demonstração do sistema de chat'
        ) RETURNING id_conversa INTO v_conversa_id;

        -- Mensagem do usuário
        INSERT INTO tb_mensagens (
            id_conversa,
            nm_papel,
            ds_conteudo,
            nr_tokens,
            vl_custo
        ) VALUES (
            v_conversa_id,
            'user',
            'Olá! Como funciona o sistema de conversas do InovaIA?',
            15,
            0.000015
        );

        -- Mensagem do assistente
        INSERT INTO tb_mensagens (
            id_conversa,
            nm_papel,
            ds_conteudo,
            nr_tokens,
            vl_custo,
            nm_modelo
        ) VALUES (
            v_conversa_id,
            'assistant',
            E'Olá! Bem-vindo ao InovaIA! 👋\n\nO sistema de conversas permite que você:\n\n- 💬 **Converse** com agentes de IA inteligentes\n- 📊 **Visualize** todo o histórico de conversas\n- 🔄 **Gerencie** múltiplas conversas simultâneas\n- 📤 **Exporte** conversas em Markdown ou PDF\n- 🔗 **Compartilhe** conversas via link\n\nCada conversa é salva automaticamente e você pode retomá-la a qualquer momento. Como posso ajudar você hoje?',
            120,
            0.000120,
            'gpt-4'
        );

        RAISE NOTICE 'Conversa de exemplo criada com ID: %', v_conversa_id;
    END IF;
END $$;

-- ============================================================================
-- 6. VIEWS ÚTEIS
-- Descrição: Views para facilitar consultas comuns
-- ============================================================================

-- View: Conversas recentes com informações do agente
CREATE OR REPLACE VIEW vw_conversas_recentes AS
SELECT
    c.id_conversa,
    c.nm_titulo,
    c.ds_resumo,
    c.nr_total_mensagens,
    c.nr_mensagens_usuario,
    c.nr_mensagens_agente,
    c.vl_custo_total,
    c.st_arquivada,
    c.st_favorita,
    c.dt_criacao,
    c.dt_ultima_mensagem,
    a.nm_agente,
    a.ds_config->>'model' AS nm_modelo_agente,
    u.nm_completo AS nm_usuario
FROM tb_conversas c
INNER JOIN tb_agentes a ON a.id_agente = c.id_agente
INNER JOIN tb_users u ON u.id_user = c.id_usuario
WHERE c.st_arquivada = FALSE
ORDER BY c.dt_ultima_mensagem DESC NULLS LAST;

-- View: Estatísticas de uso por usuário
CREATE OR REPLACE VIEW vw_estatisticas_usuario AS
SELECT
    u.id_user,
    u.nm_completo,
    COUNT(DISTINCT c.id_conversa) AS nr_conversas,
    SUM(c.nr_total_mensagens) AS nr_mensagens_total,
    SUM(c.nr_tokens_total) AS nr_tokens_total,
    SUM(c.vl_custo_total) AS vl_custo_total,
    AVG(c.nr_total_mensagens) AS media_mensagens_por_conversa,
    MAX(c.dt_ultima_mensagem) AS dt_ultima_atividade
FROM tb_users u
LEFT JOIN tb_conversas c ON c.id_usuario = u.id_user AND c.st_arquivada = FALSE
GROUP BY u.id_user, u.nm_completo;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificação final
DO $$
BEGIN
    RAISE NOTICE '✅ Migration Sistema de Conversas aplicada com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: tb_conversas, tb_mensagens';
    RAISE NOTICE '🔧 Triggers configurados: 4 triggers automáticos';
    RAISE NOTICE '📈 Views criadas: vw_conversas_recentes, vw_estatisticas_usuario';
    RAISE NOTICE '🎯 Sistema pronto para uso!';
END $$;
