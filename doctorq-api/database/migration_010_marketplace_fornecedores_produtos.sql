-- =============================================
-- DoctorQ - Migration 010: Marketplace (Fornecedores e Produtos)
-- =============================================
-- Descrição: Tabelas para marketplace de produtos de estética
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================

-- =============================================
-- FORNECEDORES
-- =============================================

CREATE TABLE IF NOT EXISTS tb_fornecedores (
    id_fornecedor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Informações da empresa
    nm_empresa VARCHAR(255) NOT NULL,
    ds_razao_social VARCHAR(255),
    nr_cnpj VARCHAR(18) UNIQUE NOT NULL,
    nr_inscricao_estadual VARCHAR(20),
    ds_descricao TEXT,
    ds_site VARCHAR(255),

    -- Contato
    ds_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    nr_whatsapp VARCHAR(20),

    -- Endereço
    ds_endereco VARCHAR(255),
    nr_numero VARCHAR(20),
    ds_complemento VARCHAR(100),
    nm_bairro VARCHAR(100),
    nm_cidade VARCHAR(100),
    nm_estado VARCHAR(2),
    nr_cep VARCHAR(10),

    -- Dados bancários (criptografados na aplicação)
    ds_banco VARCHAR(100),
    ds_agencia VARCHAR(20),
    ds_conta VARCHAR(20),
    ds_tipo_conta VARCHAR(20), -- 'corrente', 'poupanca'
    ds_pix VARCHAR(255),

    -- Informações comerciais
    ds_categorias_produtos TEXT[], -- Array de categorias que vende
    nr_tempo_entrega_dias INTEGER DEFAULT 7,
    vl_frete_minimo DECIMAL(10, 2) DEFAULT 0,
    vl_pedido_minimo DECIMAL(10, 2),

    -- Logo e fotos
    ds_logo_url TEXT,
    ds_banner_url TEXT,
    ds_fotos TEXT[], -- Array de URLs

    -- Status e avaliações
    st_ativo BOOLEAN DEFAULT true,
    st_verificado BOOLEAN DEFAULT false,
    nr_avaliacao_media DECIMAL(3, 2) DEFAULT 0.0,
    nr_total_avaliacoes INTEGER DEFAULT 0,
    nr_total_vendas INTEGER DEFAULT 0,
    vl_total_vendido DECIMAL(12, 2) DEFAULT 0,

    -- Metadata
    dt_primeira_venda TIMESTAMP,
    dt_ultima_venda TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fornecedores_user ON tb_fornecedores(id_user);
CREATE INDEX idx_fornecedores_cnpj ON tb_fornecedores(nr_cnpj);
CREATE INDEX idx_fornecedores_ativo ON tb_fornecedores(st_ativo);
CREATE INDEX idx_fornecedores_cidade ON tb_fornecedores(nm_cidade);
CREATE INDEX idx_fornecedores_categorias ON tb_fornecedores USING GIN(ds_categorias_produtos);

-- =============================================
-- CATEGORIAS DE PRODUTOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_categorias_produtos (
    id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_categoria_pai UUID REFERENCES tb_categorias_produtos(id_categoria) ON DELETE SET NULL,

    nm_categoria VARCHAR(100) NOT NULL UNIQUE,
    ds_descricao TEXT,
    ds_slug VARCHAR(100) UNIQUE NOT NULL,
    ds_icone VARCHAR(100), -- nome do ícone lucide
    ds_imagem_url TEXT,

    nr_ordem INTEGER DEFAULT 0,
    st_ativo BOOLEAN DEFAULT true,
    st_destaque BOOLEAN DEFAULT false,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categorias_produtos_pai ON tb_categorias_produtos(id_categoria_pai);
CREATE INDEX idx_categorias_produtos_slug ON tb_categorias_produtos(ds_slug);
CREATE INDEX idx_categorias_produtos_ativo ON tb_categorias_produtos(st_ativo);

-- Inserir categorias padrão
INSERT INTO tb_categorias_produtos (nm_categoria, ds_descricao, ds_slug, ds_icone) VALUES
    ('Cuidados Faciais', 'Produtos para cuidados com o rosto', 'cuidados-faciais', 'Sparkles'),
    ('Cuidados Corporais', 'Produtos para o corpo', 'cuidados-corporais', 'Heart'),
    ('Cuidados Capilares', 'Produtos para cabelos', 'cuidados-capilares', 'Scissors'),
    ('Maquiagem', 'Produtos de maquiagem profissional', 'maquiagem', 'Palette'),
    ('Equipamentos', 'Equipamentos e aparelhos para estética', 'equipamentos', 'Zap'),
    ('Higiene', 'Produtos de higiene e limpeza', 'higiene', 'Droplet')
ON CONFLICT (nm_categoria) DO NOTHING;

-- =============================================
-- PRODUTOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_produtos (
    id_produto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE,
    id_categoria UUID REFERENCES tb_categorias_produtos(id_categoria) ON DELETE SET NULL,

    -- Informações básicas
    nm_produto VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    ds_descricao_curta VARCHAR(500),
    ds_slug VARCHAR(255) UNIQUE NOT NULL,

    -- SKU e código de barras
    ds_sku VARCHAR(100) UNIQUE,
    ds_ean VARCHAR(13),
    ds_codigo_fornecedor VARCHAR(100),

    -- Categoria e tags
    ds_tags TEXT[], -- Array de tags para busca
    ds_marca VARCHAR(100),

    -- Preço
    vl_preco DECIMAL(10, 2) NOT NULL,
    vl_preco_promocional DECIMAL(10, 2),
    dt_inicio_promocao TIMESTAMP,
    dt_fim_promocao TIMESTAMP,
    nr_percentual_desconto INTEGER, -- calculado automaticamente

    -- Estoque
    nr_estoque INTEGER DEFAULT 0,
    nr_estoque_minimo INTEGER DEFAULT 5,
    nr_estoque_maximo INTEGER DEFAULT 999,
    st_controla_estoque BOOLEAN DEFAULT true,
    st_disponivel_sem_estoque BOOLEAN DEFAULT false, -- venda sob encomenda

    -- Dimensões e peso (para cálculo de frete)
    nr_peso_gramas INTEGER,
    nr_altura_cm DECIMAL(10, 2),
    nr_largura_cm DECIMAL(10, 2),
    nr_profundidade_cm DECIMAL(10, 2),

    -- Informações do produto
    ds_ingredientes TEXT,
    ds_modo_uso TEXT,
    ds_cuidados TEXT,
    ds_contraindicacoes TEXT,
    nr_volume_ml INTEGER, -- volume em ml
    nr_quantidade_unidades INTEGER, -- quantidade de unidades na embalagem

    -- Certificações e regulamentações
    ds_registro_anvisa VARCHAR(100),
    st_vegano BOOLEAN DEFAULT false,
    st_cruelty_free BOOLEAN DEFAULT false,
    st_organico BOOLEAN DEFAULT false,
    ds_certificacoes TEXT[],

    -- Mídia
    ds_imagem_principal TEXT,
    ds_imagens TEXT[], -- Array de URLs de imagens
    ds_video_url TEXT,

    -- SEO
    ds_meta_title VARCHAR(255),
    ds_meta_description VARCHAR(500),
    ds_meta_keywords TEXT[],

    -- Status e avaliações
    st_ativo BOOLEAN DEFAULT true,
    st_destaque BOOLEAN DEFAULT false,
    st_novidade BOOLEAN DEFAULT false,
    nr_avaliacao_media DECIMAL(3, 2) DEFAULT 0.0,
    nr_total_avaliacoes INTEGER DEFAULT 0,
    nr_total_vendas INTEGER DEFAULT 0,
    nr_visualizacoes INTEGER DEFAULT 0,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_produtos_fornecedor ON tb_produtos(id_fornecedor);
CREATE INDEX idx_produtos_categoria ON tb_produtos(id_categoria);
CREATE INDEX idx_produtos_sku ON tb_produtos(ds_sku);
CREATE INDEX idx_produtos_slug ON tb_produtos(ds_slug);
CREATE INDEX idx_produtos_ativo ON tb_produtos(st_ativo);
CREATE INDEX idx_produtos_destaque ON tb_produtos(st_destaque);
CREATE INDEX idx_produtos_tags ON tb_produtos USING GIN(ds_tags);
CREATE INDEX idx_produtos_preco ON tb_produtos(vl_preco);
CREATE INDEX idx_produtos_marca ON tb_produtos(ds_marca);

-- =============================================
-- VARIAÇÕES DE PRODUTOS (opcional)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_produto_variacoes (
    id_variacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,

    -- Tipo de variação (cor, tamanho, sabor, etc.)
    nm_tipo_variacao VARCHAR(50) NOT NULL, -- 'cor', 'tamanho', 'sabor'
    nm_variacao VARCHAR(100) NOT NULL, -- 'Vermelho', 'Grande', 'Morango'

    -- Preço e estoque específico
    vl_preco_adicional DECIMAL(10, 2) DEFAULT 0,
    nr_estoque INTEGER DEFAULT 0,
    ds_sku VARCHAR(100) UNIQUE,

    -- Imagem específica
    ds_imagem_url TEXT,

    st_ativo BOOLEAN DEFAULT true,
    nr_ordem INTEGER DEFAULT 0,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_produto_variacoes_produto ON tb_produto_variacoes(id_produto);
CREATE INDEX idx_produto_variacoes_sku ON tb_produto_variacoes(ds_sku);

-- =============================================
-- AVALIAÇÕES DE PRODUTOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_avaliacoes_produtos (
    id_avaliacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_pedido UUID, -- Será referenciado quando criarmos tb_pedidos

    -- Avaliação
    nr_nota INTEGER CHECK (nr_nota >= 1 AND nr_nota <= 5) NOT NULL,
    ds_titulo VARCHAR(255),
    ds_comentario TEXT,

    -- Aspectos específicos
    nr_qualidade INTEGER CHECK (nr_qualidade >= 1 AND nr_qualidade <= 5),
    nr_custo_beneficio INTEGER CHECK (nr_custo_beneficio >= 1 AND nr_custo_beneficio <= 5),
    nr_entrega INTEGER CHECK (nr_entrega >= 1 AND nr_entrega <= 5),

    -- Fotos da avaliação
    ds_fotos TEXT[],

    -- Recomendação
    st_recomenda BOOLEAN,
    st_compra_verificada BOOLEAN DEFAULT false,

    -- Resposta do fornecedor
    ds_resposta TEXT,
    dt_resposta TIMESTAMP,

    -- Moderação
    st_aprovada BOOLEAN DEFAULT false,
    st_reportada BOOLEAN DEFAULT false,
    ds_motivo_report TEXT,

    -- Utilidade (quantas pessoas acharam útil)
    nr_util INTEGER DEFAULT 0,
    nr_nao_util INTEGER DEFAULT 0,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_avaliacoes_produtos_produto ON tb_avaliacoes_produtos(id_produto);
CREATE INDEX idx_avaliacoes_produtos_user ON tb_avaliacoes_produtos(id_user);
CREATE INDEX idx_avaliacoes_produtos_aprovada ON tb_avaliacoes_produtos(st_aprovada);
CREATE INDEX idx_avaliacoes_produtos_nota ON tb_avaliacoes_produtos(nr_nota);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_update_fornecedores BEFORE UPDATE ON tb_fornecedores
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_categorias_produtos BEFORE UPDATE ON tb_categorias_produtos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_produtos BEFORE UPDATE ON tb_produtos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_produto_variacoes BEFORE UPDATE ON tb_produto_variacoes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_avaliacoes_produtos BEFORE UPDATE ON tb_avaliacoes_produtos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE tb_fornecedores IS 'Cadastro de fornecedores de produtos de estética';
COMMENT ON TABLE tb_categorias_produtos IS 'Categorias hierárquicas de produtos';
COMMENT ON TABLE tb_produtos IS 'Catálogo de produtos do marketplace';
COMMENT ON TABLE tb_produto_variacoes IS 'Variações de produtos (cor, tamanho, etc.)';
COMMENT ON TABLE tb_avaliacoes_produtos IS 'Avaliações de produtos por clientes';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
