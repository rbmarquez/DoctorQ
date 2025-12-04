-- =============================================
-- DoctorQ - Migration 014: Favoritos e Galeria
-- =============================================
-- Descrição: Tabelas para favoritos e galeria de fotos
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================

-- =============================================
-- FAVORITOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_favoritos (
    id_favorito UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Tipo de item favoritado
    ds_tipo_item VARCHAR(50) NOT NULL,
    -- 'profissional', 'procedimento', 'produto', 'fornecedor', 'clinica'

    -- Referências (apenas uma deve estar preenchida)
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE CASCADE,
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,

    -- Organização
    ds_categoria_favorito VARCHAR(100), -- 'quero_fazer', 'para_presente', 'proxima_compra', etc.
    ds_observacoes TEXT,
    nr_prioridade INTEGER DEFAULT 0, -- 0=baixa, 1=média, 2=alta

    -- Notificações
    st_notificar_promocao BOOLEAN DEFAULT true,
    st_notificar_disponibilidade BOOLEAN DEFAULT true,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: exatamente uma referência deve estar preenchida
    CONSTRAINT chk_tipo_favorito CHECK (
        (ds_tipo_item = 'profissional' AND id_profissional IS NOT NULL AND id_procedimento IS NULL AND id_produto IS NULL AND id_fornecedor IS NULL AND id_clinica IS NULL) OR
        (ds_tipo_item = 'procedimento' AND id_profissional IS NULL AND id_procedimento IS NOT NULL AND id_produto IS NULL AND id_fornecedor IS NULL AND id_clinica IS NULL) OR
        (ds_tipo_item = 'produto' AND id_profissional IS NULL AND id_procedimento IS NULL AND id_produto IS NOT NULL AND id_fornecedor IS NULL AND id_clinica IS NULL) OR
        (ds_tipo_item = 'fornecedor' AND id_profissional IS NULL AND id_procedimento IS NULL AND id_produto IS NULL AND id_fornecedor IS NOT NULL AND id_clinica IS NULL) OR
        (ds_tipo_item = 'clinica' AND id_profissional IS NULL AND id_procedimento IS NULL AND id_produto IS NULL AND id_fornecedor IS NULL AND id_clinica IS NOT NULL)
    )
);

CREATE INDEX idx_favoritos_user ON tb_favoritos(id_user);
CREATE INDEX idx_favoritos_tipo ON tb_favoritos(ds_tipo_item);
CREATE INDEX idx_favoritos_profissional ON tb_favoritos(id_profissional);
CREATE INDEX idx_favoritos_procedimento ON tb_favoritos(id_procedimento);
CREATE INDEX idx_favoritos_produto ON tb_favoritos(id_produto);
CREATE INDEX idx_favoritos_fornecedor ON tb_favoritos(id_fornecedor);
CREATE INDEX idx_favoritos_categoria ON tb_favoritos(ds_categoria_favorito);

-- =============================================
-- ÁLBUNS DE FOTOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_albuns (
    id_album UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Informações do álbum
    nm_album VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    ds_tipo VARCHAR(50) DEFAULT 'pessoal',
    -- 'pessoal', 'antes_depois', 'portfolio_profissional', 'clinica', 'produto'

    -- Privacidade
    ds_visibilidade VARCHAR(20) DEFAULT 'privado',
    -- 'privado', 'clinica', 'publico'

    -- Referências opcionais
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE CASCADE,

    -- Capa do álbum
    ds_capa_url TEXT,

    -- Estatísticas
    nr_total_fotos INTEGER DEFAULT 0,
    nr_visualizacoes INTEGER DEFAULT 0,

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    st_destaque BOOLEAN DEFAULT false,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_albuns_user ON tb_albuns(id_user);
CREATE INDEX idx_albuns_empresa ON tb_albuns(id_empresa);
CREATE INDEX idx_albuns_tipo ON tb_albuns(ds_tipo);
CREATE INDEX idx_albuns_profissional ON tb_albuns(id_profissional);
CREATE INDEX idx_albuns_paciente ON tb_albuns(id_paciente);
CREATE INDEX idx_albuns_visibilidade ON tb_albuns(ds_visibilidade);

-- =============================================
-- FOTOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_fotos (
    id_foto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_album UUID REFERENCES tb_albuns(id_album) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,

    -- Arquivo
    ds_url TEXT NOT NULL,
    ds_thumbnail_url TEXT,
    ds_url_original TEXT, -- URL da imagem original sem processamento

    -- Metadados da imagem
    nm_arquivo VARCHAR(500),
    ds_tipo_mime VARCHAR(100) DEFAULT 'image/jpeg',
    nr_tamanho_bytes BIGINT,
    nr_largura INTEGER,
    nr_altura INTEGER,

    -- Descrição
    ds_titulo VARCHAR(255),
    ds_legenda TEXT,
    ds_tags TEXT[], -- Tags para busca

    -- Tipo de foto
    ds_tipo_foto VARCHAR(50), -- 'antes', 'depois', 'durante', 'resultado', 'produto', 'portfolio'

    -- Referências opcionais
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE SET NULL,
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE SET NULL,

    -- Foto de antes/depois
    id_foto_relacionada UUID REFERENCES tb_fotos(id_foto) ON DELETE SET NULL, -- Par antes/depois
    dt_foto_tirada TIMESTAMP,

    -- EXIF data (opcional)
    ds_exif JSONB,

    -- Processamento
    st_processada BOOLEAN DEFAULT false,
    st_aprovada BOOLEAN DEFAULT false, -- Para fotos que precisam moderação
    ds_motivo_rejeicao TEXT,

    -- Privacidade
    ds_visibilidade VARCHAR(20) DEFAULT 'privado', -- 'privado', 'clinica', 'publico'

    -- Estatísticas
    nr_visualizacoes INTEGER DEFAULT 0,
    nr_curtidas INTEGER DEFAULT 0,

    -- Ordem no álbum
    nr_ordem INTEGER DEFAULT 0,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fotos_album ON tb_fotos(id_album);
CREATE INDEX idx_fotos_user ON tb_fotos(id_user);
CREATE INDEX idx_fotos_tipo ON tb_fotos(ds_tipo_foto);
CREATE INDEX idx_fotos_agendamento ON tb_fotos(id_agendamento);
CREATE INDEX idx_fotos_procedimento ON tb_fotos(id_procedimento);
CREATE INDEX idx_fotos_produto ON tb_fotos(id_produto);
CREATE INDEX idx_fotos_tags ON tb_fotos USING GIN(ds_tags);
CREATE INDEX idx_fotos_visibilidade ON tb_fotos(ds_visibilidade);
CREATE INDEX idx_fotos_relacionada ON tb_fotos(id_foto_relacionada);

-- =============================================
-- COMENTÁRIOS EM FOTOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_comentarios_fotos (
    id_comentario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_foto UUID REFERENCES tb_fotos(id_foto) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Comentário pai (para respostas)
    id_comentario_pai UUID REFERENCES tb_comentarios_fotos(id_comentario) ON DELETE CASCADE,

    -- Conteúdo
    ds_comentario TEXT NOT NULL,

    -- Status
    st_editado BOOLEAN DEFAULT false,
    st_aprovado BOOLEAN DEFAULT true,
    st_deletado BOOLEAN DEFAULT false,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comentarios_fotos_foto ON tb_comentarios_fotos(id_foto);
CREATE INDEX idx_comentarios_fotos_user ON tb_comentarios_fotos(id_user);
CREATE INDEX idx_comentarios_fotos_pai ON tb_comentarios_fotos(id_comentario_pai);

-- =============================================
-- CURTIDAS EM FOTOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_curtidas_fotos (
    id_curtida UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_foto UUID REFERENCES tb_fotos(id_foto) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    dt_criacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: usuário pode curtir foto apenas uma vez
    CONSTRAINT uk_user_foto_curtida UNIQUE (id_foto, id_user)
);

CREATE INDEX idx_curtidas_fotos_foto ON tb_curtidas_fotos(id_foto);
CREATE INDEX idx_curtidas_fotos_user ON tb_curtidas_fotos(id_user);

-- =============================================
-- COMPARTILHAMENTOS DE ÁLBUNS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_compartilhamentos_album (
    id_compartilhamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_album UUID REFERENCES tb_albuns(id_album) ON DELETE CASCADE,
    id_user_compartilhou UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_user_destinatario UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Permissões
    st_pode_comentar BOOLEAN DEFAULT true,
    st_pode_baixar BOOLEAN DEFAULT false,

    -- Link público
    ds_token_compartilhamento VARCHAR(100) UNIQUE,
    dt_expiracao TIMESTAMP,

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    st_visto BOOLEAN DEFAULT false,
    dt_primeiro_acesso TIMESTAMP,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compartilhamentos_album ON tb_compartilhamentos_album(id_album);
CREATE INDEX idx_compartilhamentos_compartilhou ON tb_compartilhamentos_album(id_user_compartilhou);
CREATE INDEX idx_compartilhamentos_destinatario ON tb_compartilhamentos_album(id_user_destinatario);
CREATE INDEX idx_compartilhamentos_token ON tb_compartilhamentos_album(ds_token_compartilhamento);

-- =============================================
-- LISTAS DE DESEJOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_listas_desejos (
    id_lista UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    nm_lista VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    ds_tipo VARCHAR(50) DEFAULT 'geral', -- 'geral', 'aniversario', 'casamento', etc.

    -- Privacidade
    st_publica BOOLEAN DEFAULT false,
    ds_token_compartilhamento VARCHAR(100) UNIQUE,

    -- Status
    st_ativa BOOLEAN DEFAULT true,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listas_desejos_user ON tb_listas_desejos(id_user);
CREATE INDEX idx_listas_desejos_tipo ON tb_listas_desejos(ds_tipo);
CREATE INDEX idx_listas_desejos_token ON tb_listas_desejos(ds_token_compartilhamento);

-- =============================================
-- ITENS DA LISTA DE DESEJOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_itens_lista_desejos (
    id_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_lista UUID REFERENCES tb_listas_desejos(id_lista) ON DELETE CASCADE,

    -- Item (produto ou procedimento)
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE CASCADE,

    -- Detalhes
    qt_quantidade INTEGER DEFAULT 1,
    nr_prioridade INTEGER DEFAULT 0, -- 0=baixa, 1=média, 2=alta
    ds_observacoes TEXT,

    -- Status
    st_adquirido BOOLEAN DEFAULT false,
    dt_adquirido TIMESTAMP,

    -- Ordem
    nr_ordem INTEGER DEFAULT 0,

    dt_criacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: produto OU procedimento
    CONSTRAINT chk_item_lista_desejo CHECK (
        (id_produto IS NOT NULL AND id_procedimento IS NULL) OR
        (id_produto IS NULL AND id_procedimento IS NOT NULL)
    )
);

CREATE INDEX idx_itens_lista_desejos_lista ON tb_itens_lista_desejos(id_lista);
CREATE INDEX idx_itens_lista_desejos_produto ON tb_itens_lista_desejos(id_produto);
CREATE INDEX idx_itens_lista_desejos_procedimento ON tb_itens_lista_desejos(id_procedimento);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function para atualizar total de fotos no álbum
CREATE OR REPLACE FUNCTION atualizar_total_fotos_album()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tb_albuns
        SET nr_total_fotos = nr_total_fotos + 1
        WHERE id_album = NEW.id_album;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tb_albuns
        SET nr_total_fotos = GREATEST(nr_total_fotos - 1, 0)
        WHERE id_album = OLD.id_album;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION atualizar_curtidas_foto()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tb_fotos
        SET nr_curtidas = nr_curtidas + 1
        WHERE id_foto = NEW.id_foto;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tb_fotos
        SET nr_curtidas = GREATEST(nr_curtidas - 1, 0)
        WHERE id_foto = OLD.id_foto;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_update_favoritos BEFORE UPDATE ON tb_favoritos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_albuns BEFORE UPDATE ON tb_albuns
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_fotos BEFORE UPDATE ON tb_fotos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_comentarios_fotos BEFORE UPDATE ON tb_comentarios_fotos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_compartilhamentos_album BEFORE UPDATE ON tb_compartilhamentos_album
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_listas_desejos BEFORE UPDATE ON tb_listas_desejos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- Trigger para atualizar total de fotos
CREATE TRIGGER trg_foto_album_total AFTER INSERT OR DELETE ON tb_fotos
FOR EACH ROW EXECUTE FUNCTION atualizar_total_fotos_album();

-- Trigger para atualizar curtidas
CREATE TRIGGER trg_curtida_foto AFTER INSERT OR DELETE ON tb_curtidas_fotos
FOR EACH ROW EXECUTE FUNCTION atualizar_curtidas_foto();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE tb_favoritos IS 'Itens favoritados pelos usuários (profissionais, produtos, etc.)';
COMMENT ON TABLE tb_albuns IS 'Álbuns de fotos (pessoais, antes/depois, portfolio)';
COMMENT ON TABLE tb_fotos IS 'Fotos armazenadas nos álbuns';
COMMENT ON TABLE tb_comentarios_fotos IS 'Comentários nas fotos';
COMMENT ON TABLE tb_curtidas_fotos IS 'Curtidas nas fotos';
COMMENT ON TABLE tb_compartilhamentos_album IS 'Compartilhamento de álbuns entre usuários';
COMMENT ON TABLE tb_listas_desejos IS 'Listas de desejos de produtos e procedimentos';
COMMENT ON TABLE tb_itens_lista_desejos IS 'Itens das listas de desejos';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
