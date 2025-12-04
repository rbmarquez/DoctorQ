-- Migration: Marketplace de Produtos (Physical Products)
-- Created: 2025-10-23
-- Description: Creates tables for physical product marketplace with cart, favorites, reviews, and orders

-- ============================================
-- 1. Tabela de Produtos
-- ============================================
CREATE TABLE IF NOT EXISTS tb_produtos (
    id_produto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_produto VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    ds_categoria VARCHAR(100) NOT NULL, -- Dermocosméticos, Equipamentos, etc.
    ds_marca VARCHAR(100),
    ds_subcategoria VARCHAR(100),
    vl_preco DECIMAL(10, 2) NOT NULL,
    vl_preco_original DECIMAL(10, 2), -- Para mostrar desconto
    nr_avaliacao_media DECIMAL(3, 2) DEFAULT 0.0,
    nr_total_avaliacoes INTEGER DEFAULT 0,
    nr_total_vendas INTEGER DEFAULT 0,
    st_estoque BOOLEAN DEFAULT TRUE,
    nr_quantidade_estoque INTEGER DEFAULT 0,
    ds_selo VARCHAR(50), -- "Mais Vendido", "Destaque", "Novidade", "Premium"
    ds_imagem_url TEXT,
    ds_imagens_adicionais JSONB DEFAULT '[]'::jsonb, -- Array de URLs de imagens
    ds_especificacoes JSONB DEFAULT '{}'::jsonb, -- Especificações técnicas
    ds_tags TEXT[] DEFAULT '{}', -- Tags para busca
    st_ativo BOOLEAN DEFAULT TRUE,
    st_destaque BOOLEAN DEFAULT FALSE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE, -- Vendedor/Fornecedor
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON tb_produtos(ds_categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON tb_produtos(ds_marca);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque ON tb_produtos(st_estoque);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON tb_produtos(st_ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON tb_produtos(id_empresa);
CREATE INDEX IF NOT EXISTS idx_produtos_avaliacao ON tb_produtos(nr_avaliacao_media DESC);

-- ============================================
-- 2. Tabela de Avaliações de Produtos
-- ============================================
CREATE TABLE IF NOT EXISTS tb_avaliacoes_produtos (
    id_avaliacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    nr_estrelas INTEGER NOT NULL CHECK (nr_estrelas BETWEEN 1 AND 5),
    ds_comentario TEXT,
    ds_resposta_vendedor TEXT,
    dt_resposta_vendedor TIMESTAMP,
    st_verificado BOOLEAN DEFAULT FALSE, -- Compra verificada
    st_ativo BOOLEAN DEFAULT TRUE,
    nr_likes INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_produto, id_user) -- Um usuário pode avaliar um produto apenas uma vez
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_produtos_produto ON tb_avaliacoes_produtos(id_produto);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_produtos_user ON tb_avaliacoes_produtos(id_user);

-- ============================================
-- 3. Tabela de Carrinho de Compras
-- ============================================
CREATE TABLE IF NOT EXISTS tb_carrinho (
    id_carrinho UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    nr_quantidade INTEGER NOT NULL DEFAULT 1 CHECK (nr_quantidade > 0),
    vl_preco_unitario DECIMAL(10, 2) NOT NULL, -- Preço no momento da adição
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_user, id_produto)
);

CREATE INDEX IF NOT EXISTS idx_carrinho_user ON tb_carrinho(id_user);

-- ============================================
-- 4. Tabela de Favoritos
-- ============================================
CREATE TABLE IF NOT EXISTS tb_favoritos (
    id_favorito UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_user, id_produto)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_user ON tb_favoritos(id_user);

-- ============================================
-- 5. Tabela de Comparação de Produtos
-- ============================================
CREATE TABLE IF NOT EXISTS tb_comparacao (
    id_comparacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_user, id_produto)
);

CREATE INDEX IF NOT EXISTS idx_comparacao_user ON tb_comparacao(id_user);

-- ============================================
-- 6. Tabela de Pedidos
-- ============================================
CREATE TABLE IF NOT EXISTS tb_pedidos (
    id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    nr_pedido VARCHAR(50) UNIQUE NOT NULL, -- Número do pedido (ex: PED-2025-00001)
    vl_subtotal DECIMAL(10, 2) NOT NULL,
    vl_desconto DECIMAL(10, 2) DEFAULT 0.0,
    vl_frete DECIMAL(10, 2) DEFAULT 0.0,
    vl_total DECIMAL(10, 2) NOT NULL,
    ds_status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- pendente, confirmado, pago, enviado, entregue, cancelado
    ds_endereco_entrega JSONB NOT NULL, -- {rua, numero, complemento, bairro, cidade, estado, cep}
    ds_forma_pagamento VARCHAR(50), -- cartao, boleto, pix, etc.
    ds_rastreio VARCHAR(100),
    dt_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_confirmacao TIMESTAMP,
    dt_pagamento TIMESTAMP,
    dt_envio TIMESTAMP,
    dt_entrega TIMESTAMP,
    dt_cancelamento TIMESTAMP,
    ds_observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pedidos_user ON tb_pedidos(id_user);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON tb_pedidos(ds_status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON tb_pedidos(dt_pedido DESC);

-- ============================================
-- 7. Tabela de Itens do Pedido
-- ============================================
CREATE TABLE IF NOT EXISTS tb_pedido_itens (
    id_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID NOT NULL REFERENCES tb_pedidos(id_pedido) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES tb_produtos(id_produto),
    nm_produto VARCHAR(255) NOT NULL, -- Nome do produto no momento da compra
    vl_preco_unitario DECIMAL(10, 2) NOT NULL,
    nr_quantidade INTEGER NOT NULL CHECK (nr_quantidade > 0),
    vl_subtotal DECIMAL(10, 2) NOT NULL,
    ds_imagem_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON tb_pedido_itens(id_pedido);

-- ============================================
-- 8. Inserir Produtos de Exemplo
-- ============================================

-- Dermocosméticos
INSERT INTO tb_produtos (
    id_produto,
    nm_produto,
    ds_descricao,
    ds_categoria,
    ds_marca,
    vl_preco,
    vl_preco_original,
    nr_avaliacao_media,
    nr_total_avaliacoes,
    nr_total_vendas,
    st_estoque,
    nr_quantidade_estoque,
    ds_selo,
    ds_imagem_url,
    st_destaque
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'La Roche-Posay Anthelios Protetor Solar FPS 70',
    'Protetor solar de alta proteção com tecnologia Mexoplex para proteção UVA/UVB. Textura ultra leve e toque seco.',
    'Dermocosméticos',
    'La Roche-Posay',
    89.90,
    119.90,
    4.9,
    2341,
    3456,
    TRUE,
    150,
    'Mais Vendido',
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    TRUE
),
(
    '22222222-2222-2222-2222-222222222222',
    'Vichy Minéral 89 Sérum Hidratante',
    'Sérum facial com 89% de água vulcânica mineralizante e ácido hialurônico. Fortalece a barreira cutânea.',
    'Dermocosméticos',
    'Vichy',
    149.90,
    NULL,
    4.8,
    1876,
    2134,
    TRUE,
    89,
    'Destaque',
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop',
    TRUE
),
(
    '33333333-3333-3333-3333-333333333333',
    'Bioderma Sensibio H2O Água Micelar 500ml',
    'Água micelar para limpeza e remoção de maquiagem. Ideal para peles sensíveis. Sem enxágue.',
    'Dermocosméticos',
    'Bioderma',
    79.90,
    95.90,
    4.9,
    3456,
    4789,
    TRUE,
    200,
    'Mais Vendido',
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
    TRUE
),
(
    '44444444-4444-4444-4444-444444444444',
    'SkinCeuticals C E Ferulic Sérum Antioxidante',
    'Sérum antioxidante avançado com vitamina C pura, vitamina E e ácido ferúlico. Combate sinais de envelhecimento.',
    'Dermocosméticos',
    'SkinCeuticals',
    489.00,
    NULL,
    5.0,
    892,
    1245,
    TRUE,
    34,
    'Premium',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
    TRUE
),
(
    '55555555-5555-5555-5555-555555555555',
    'Avène Água Termal Spray 300ml',
    'Água termal calmante e suavizante. Reduz a sensibilidade e irritação da pele. 100% água termal de Avène.',
    'Dermocosméticos',
    'Avène',
    69.90,
    NULL,
    4.7,
    1234,
    2789,
    TRUE,
    178,
    NULL,
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
    FALSE
),
(
    '66666666-6666-6666-6666-666666666666',
    'Microagulhamento Dermapen Profissional',
    'Equipamento profissional de microagulhamento com 12 agulhas. Ajuste de profundidade 0.25mm a 2.5mm.',
    'Equipamentos',
    'DermaTech',
    2499.00,
    2999.00,
    4.6,
    234,
    456,
    TRUE,
    12,
    'Novidade',
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop',
    TRUE
);

-- ============================================
-- 9. Trigger para atualizar dt_atualizacao
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON tb_produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avaliacoes_produtos_updated_at BEFORE UPDATE ON tb_avaliacoes_produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carrinho_updated_at BEFORE UPDATE ON tb_carrinho
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. Comentários nas tabelas
-- ============================================
COMMENT ON TABLE tb_produtos IS 'Tabela de produtos físicos do marketplace (dermocosméticos, equipamentos, etc.)';
COMMENT ON TABLE tb_avaliacoes_produtos IS 'Avaliações e reviews dos produtos pelos usuários';
COMMENT ON TABLE tb_carrinho IS 'Carrinho de compras dos usuários';
COMMENT ON TABLE tb_favoritos IS 'Produtos favoritos/wishlist dos usuários';
COMMENT ON TABLE tb_comparacao IS 'Produtos marcados para comparação';
COMMENT ON TABLE tb_pedidos IS 'Pedidos realizados pelos usuários';
COMMENT ON TABLE tb_pedido_itens IS 'Itens de cada pedido';

-- ============================================
-- 11. Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_produtos TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_avaliacoes_produtos TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_carrinho TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_favoritos TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_comparacao TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_pedidos TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_pedido_itens TO postgres;

-- Fim da migration
