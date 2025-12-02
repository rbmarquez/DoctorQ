-- Migration: Criar estrutura do Marketplace de Agentes
-- Data: 21/10/2025
-- Descrição: Sistema de compartilhamento e avaliação de agentes

-- Tabela de agentes no marketplace (agentes públicos compartilhados)
CREATE TABLE IF NOT EXISTS tb_marketplace_agentes (
    id_marketplace_agente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_agente UUID NOT NULL REFERENCES tb_agentes(id_agente) ON DELETE CASCADE,
    id_empresa_publicador UUID REFERENCES tb_empresas(id_empresa),
    nm_categoria VARCHAR(100),
    ds_tags TEXT[],
    ds_descricao_longa TEXT,
    nr_instalacoes INTEGER DEFAULT 0,
    nr_avaliacoes INTEGER DEFAULT 0,
    nr_media_estrelas DECIMAL(3,2) DEFAULT 0.00,
    st_ativo BOOLEAN DEFAULT TRUE,
    st_destacado BOOLEAN DEFAULT FALSE,
    dt_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_media_estrelas CHECK (nr_media_estrelas >= 0 AND nr_media_estrelas <= 5)
);

-- Tabela de avaliações de agentes
CREATE TABLE IF NOT EXISTS tb_avaliacoes_agentes (
    id_avaliacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_marketplace_agente UUID NOT NULL REFERENCES tb_marketplace_agentes(id_marketplace_agente) ON DELETE CASCADE,
    id_usuario UUID NOT NULL,
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    nr_estrelas INTEGER NOT NULL CHECK (nr_estrelas >= 1 AND nr_estrelas <= 5),
    ds_comentario TEXT,
    st_util BOOLEAN DEFAULT NULL, -- Usuários podem marcar avaliação como útil
    nr_votos_util INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(id_marketplace_agente, id_usuario, id_empresa)
);

-- Tabela de instalações de agentes do marketplace
CREATE TABLE IF NOT EXISTS tb_instalacoes_marketplace (
    id_instalacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_marketplace_agente UUID NOT NULL REFERENCES tb_marketplace_agentes(id_marketplace_agente) ON DELETE CASCADE,
    id_agente_instalado UUID NOT NULL REFERENCES tb_agentes(id_agente) ON DELETE CASCADE,
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa),
    id_usuario_instalador UUID NOT NULL,
    st_ativo BOOLEAN DEFAULT TRUE,
    dt_instalacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(id_marketplace_agente, id_empresa)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_marketplace_categoria
    ON tb_marketplace_agentes(nm_categoria);

CREATE INDEX IF NOT EXISTS idx_marketplace_tags
    ON tb_marketplace_agentes USING GIN(ds_tags);

CREATE INDEX IF NOT EXISTS idx_marketplace_media_estrelas
    ON tb_marketplace_agentes(nr_media_estrelas DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_instalacoes
    ON tb_marketplace_agentes(nr_instalacoes DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_publicacao
    ON tb_marketplace_agentes(dt_publicacao DESC);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_marketplace_agente
    ON tb_avaliacoes_agentes(id_marketplace_agente);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario
    ON tb_avaliacoes_agentes(id_usuario);

CREATE INDEX IF NOT EXISTS idx_instalacoes_empresa
    ON tb_instalacoes_marketplace(id_empresa);

-- Trigger para atualizar dt_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_marketplace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_timestamp
    BEFORE UPDATE ON tb_marketplace_agentes
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_timestamp();

CREATE TRIGGER trigger_update_avaliacao_timestamp
    BEFORE UPDATE ON tb_avaliacoes_agentes
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_timestamp();

-- Função para recalcular média de estrelas
CREATE OR REPLACE FUNCTION recalcular_media_estrelas()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tb_marketplace_agentes
    SET
        nr_media_estrelas = (
            SELECT COALESCE(AVG(nr_estrelas), 0)
            FROM tb_avaliacoes_agentes
            WHERE id_marketplace_agente = NEW.id_marketplace_agente
        ),
        nr_avaliacoes = (
            SELECT COUNT(*)
            FROM tb_avaliacoes_agentes
            WHERE id_marketplace_agente = NEW.id_marketplace_agente
        )
    WHERE id_marketplace_agente = NEW.id_marketplace_agente;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_media_insert
    AFTER INSERT ON tb_avaliacoes_agentes
    FOR EACH ROW
    EXECUTE FUNCTION recalcular_media_estrelas();

CREATE TRIGGER trigger_recalcular_media_update
    AFTER UPDATE ON tb_avaliacoes_agentes
    FOR EACH ROW
    EXECUTE FUNCTION recalcular_media_estrelas();

CREATE TRIGGER trigger_recalcular_media_delete
    AFTER DELETE ON tb_avaliacoes_agentes
    FOR EACH ROW
    EXECUTE FUNCTION recalcular_media_estrelas();

-- Função para incrementar contador de instalações
CREATE OR REPLACE FUNCTION incrementar_instalacoes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.st_ativo = TRUE THEN
        UPDATE tb_marketplace_agentes
        SET nr_instalacoes = nr_instalacoes + 1
        WHERE id_marketplace_agente = NEW.id_marketplace_agente;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.st_ativo = FALSE AND NEW.st_ativo = TRUE THEN
            UPDATE tb_marketplace_agentes
            SET nr_instalacoes = nr_instalacoes + 1
            WHERE id_marketplace_agente = NEW.id_marketplace_agente;
        ELSIF OLD.st_ativo = TRUE AND NEW.st_ativo = FALSE THEN
            UPDATE tb_marketplace_agentes
            SET nr_instalacoes = nr_instalacoes - 1
            WHERE id_marketplace_agente = NEW.id_marketplace_agente;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_incrementar_instalacoes
    AFTER INSERT OR UPDATE ON tb_instalacoes_marketplace
    FOR EACH ROW
    EXECUTE FUNCTION incrementar_instalacoes();

-- Inserir agentes de exemplo no marketplace
-- Primeiro, vamos pegar o ID do agente principal (InovaIA)
DO $$
DECLARE
    agente_inovaia_id UUID;
    marketplace_id UUID;
BEGIN
    -- Buscar o agente principal
    SELECT id_agente INTO agente_inovaia_id
    FROM tb_agentes
    WHERE st_principal = TRUE
    LIMIT 1;

    -- Se encontrou, publicar no marketplace
    IF agente_inovaia_id IS NOT NULL THEN
        INSERT INTO tb_marketplace_agentes (
            id_agente,
            nm_categoria,
            ds_tags,
            ds_descricao_longa,
            nr_instalacoes,
            nr_avaliacoes,
            nr_media_estrelas,
            st_destacado
        ) VALUES (
            agente_inovaia_id,
            'assistente',
            ARRAY['inovacao', 'consultoria', 'estrategia', 'ia'],
            'Agente especializado em inovação e consultoria estratégica. Auxilia em todas as fases de um projeto, desde concepção até implementação. Ideal para equipes que buscam acelerar desenvolvimento de soluções inovadoras.',
            42,
            8,
            4.75,
            TRUE
        ) RETURNING id_marketplace_agente INTO marketplace_id;

        -- Adicionar algumas avaliações de exemplo
        INSERT INTO tb_avaliacoes_agentes (
            id_marketplace_agente,
            id_usuario,
            nr_estrelas,
            ds_comentario
        ) VALUES
            (marketplace_id, gen_random_uuid(), 5, 'Excelente agente! Ajudou muito no desenvolvimento do nosso produto.'),
            (marketplace_id, gen_random_uuid(), 5, 'Respostas muito precisas e úteis. Recomendo!'),
            (marketplace_id, gen_random_uuid(), 4, 'Muito bom, mas poderia ter mais exemplos práticos.'),
            (marketplace_id, gen_random_uuid(), 5, 'Transformou nossa forma de trabalhar. Essencial!'),
            (marketplace_id, gen_random_uuid(), 5, 'Melhor agente que já usei. Vale muito a pena.'),
            (marketplace_id, gen_random_uuid(), 4, 'Ótimo para brainstorming e validação de ideias.'),
            (marketplace_id, gen_random_uuid(), 5, 'Profissional e eficiente. Superou expectativas.'),
            (marketplace_id, gen_random_uuid(), 5, 'Indispensável para nossa equipe de inovação.');
    END IF;
END $$;

-- Comentários das tabelas
COMMENT ON TABLE tb_marketplace_agentes IS 'Agentes públicos disponíveis no marketplace para instalação';
COMMENT ON TABLE tb_avaliacoes_agentes IS 'Avaliações e comentários dos usuários sobre agentes do marketplace';
COMMENT ON TABLE tb_instalacoes_marketplace IS 'Registro de instalações de agentes do marketplace por empresas';
COMMENT ON COLUMN tb_marketplace_agentes.st_destacado IS 'Indica se o agente aparece em destaque na página principal';
COMMENT ON COLUMN tb_avaliacoes_agentes.st_util IS 'Outros usuários marcam a avaliação como útil ou não';
