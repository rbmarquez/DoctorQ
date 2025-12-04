-- =============================================
-- DoctorQ - Migration 011: Pedidos e Carrinho
-- =============================================
-- Descrição: Tabelas para pedidos, carrinho e logística
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================

-- =============================================
-- CARRINHO DE COMPRAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_carrinho (
    id_item_carrinho UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Item pode ser produto OU procedimento
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE CASCADE,
    id_variacao UUID REFERENCES tb_produto_variacoes(id_variacao) ON DELETE CASCADE,

    -- Para procedimentos
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE SET NULL,
    dt_agendamento_desejado TIMESTAMP,

    -- Quantidade e preço
    qt_quantidade INTEGER DEFAULT 1 CHECK (qt_quantidade > 0),
    vl_unitario DECIMAL(10, 2) NOT NULL,
    vl_total DECIMAL(10, 2) GENERATED ALWAYS AS (qt_quantidade * vl_unitario) STORED,

    -- Observações
    ds_observacoes TEXT,

    -- Metadata
    dt_adicionado TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_item_type CHECK (
        (id_produto IS NOT NULL AND id_procedimento IS NULL) OR
        (id_produto IS NULL AND id_procedimento IS NOT NULL)
    )
);

CREATE INDEX idx_carrinho_user ON tb_carrinho(id_user);
CREATE INDEX idx_carrinho_produto ON tb_carrinho(id_produto);
CREATE INDEX idx_carrinho_procedimento ON tb_carrinho(id_procedimento);

-- =============================================
-- CUPONS DE DESCONTO
-- =============================================

CREATE TABLE IF NOT EXISTS tb_cupons (
    id_cupom UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE,

    -- Código do cupom
    ds_codigo VARCHAR(50) UNIQUE NOT NULL,
    nm_cupom VARCHAR(255) NOT NULL,
    ds_descricao TEXT,

    -- Tipo de desconto
    ds_tipo_desconto VARCHAR(20) NOT NULL, -- 'percentual', 'valor_fixo', 'frete_gratis'
    nr_percentual_desconto DECIMAL(5, 2), -- 10.50 = 10,5%
    vl_desconto_fixo DECIMAL(10, 2),

    -- Condições de uso
    vl_minimo_compra DECIMAL(10, 2),
    vl_maximo_desconto DECIMAL(10, 2), -- desconto máximo em reais

    -- Limite de uso
    nr_usos_maximos INTEGER, -- NULL = ilimitado
    nr_usos_por_usuario INTEGER DEFAULT 1,
    nr_usos_atuais INTEGER DEFAULT 0,

    -- Restrições
    ds_produtos_validos UUID[], -- Array de IDs de produtos específicos
    ds_categorias_validas UUID[], -- Array de IDs de categorias
    st_primeira_compra BOOLEAN DEFAULT false,

    -- Validade
    dt_inicio TIMESTAMP NOT NULL,
    dt_fim TIMESTAMP NOT NULL,

    -- Status
    st_ativo BOOLEAN DEFAULT true,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cupons_codigo ON tb_cupons(ds_codigo);
CREATE INDEX idx_cupons_ativo ON tb_cupons(st_ativo);
CREATE INDEX idx_cupons_validade ON tb_cupons(dt_inicio, dt_fim);

-- =============================================
-- PEDIDOS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_pedidos (
    id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nr_pedido VARCHAR(20) UNIQUE NOT NULL, -- PED-000001

    -- Cliente e fornecedor
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE,

    -- Endereço de entrega
    ds_destinatario VARCHAR(255) NOT NULL,
    ds_endereco VARCHAR(255) NOT NULL,
    nr_numero VARCHAR(20) NOT NULL,
    ds_complemento VARCHAR(100),
    nm_bairro VARCHAR(100) NOT NULL,
    nm_cidade VARCHAR(100) NOT NULL,
    nm_estado VARCHAR(2) NOT NULL,
    nr_cep VARCHAR(10) NOT NULL,
    nr_telefone VARCHAR(20),

    -- Valores
    vl_subtotal DECIMAL(10, 2) NOT NULL, -- soma dos produtos
    vl_frete DECIMAL(10, 2) DEFAULT 0,
    vl_desconto DECIMAL(10, 2) DEFAULT 0,
    vl_taxa_servico DECIMAL(10, 2) DEFAULT 0,
    vl_total DECIMAL(10, 2) NOT NULL,

    -- Cupom aplicado
    id_cupom UUID REFERENCES tb_cupons(id_cupom) ON DELETE SET NULL,
    ds_codigo_cupom VARCHAR(50),

    -- Status do pedido
    ds_status VARCHAR(50) DEFAULT 'pendente',
    -- 'pendente', 'pago', 'processando', 'separado', 'enviado', 'em_transito', 'entregue', 'cancelado'

    -- Pagamento
    ds_forma_pagamento VARCHAR(50), -- 'credito', 'debito', 'pix', 'boleto'
    ds_status_pagamento VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'aprovado', 'recusado', 'estornado'
    ds_id_transacao_gateway VARCHAR(255), -- ID do gateway de pagamento
    ds_dados_pagamento JSONB, -- Dados adicionais do pagamento
    dt_pagamento TIMESTAMP,

    -- Entrega
    ds_metodo_envio VARCHAR(50), -- 'correios_sedex', 'correios_pac', 'transportadora', 'retirada'
    ds_codigo_rastreio VARCHAR(100),
    ds_transportadora VARCHAR(100),
    dt_envio TIMESTAMP,
    dt_entrega_prevista DATE,
    dt_entrega TIMESTAMP,

    -- Nota fiscal
    ds_numero_nota_fiscal VARCHAR(50),
    ds_chave_nfe VARCHAR(44),
    ds_url_danfe TEXT,
    dt_emissao_nf TIMESTAMP,

    -- Observações
    ds_observacoes_cliente TEXT,
    ds_observacoes_internas TEXT,

    -- Cancelamento
    ds_motivo_cancelamento TEXT,
    dt_cancelamento TIMESTAMP,
    nm_cancelado_por VARCHAR(255), -- 'cliente', 'fornecedor', 'admin'

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedidos_nr_pedido ON tb_pedidos(nr_pedido);
CREATE INDEX idx_pedidos_user ON tb_pedidos(id_user);
CREATE INDEX idx_pedidos_fornecedor ON tb_pedidos(id_fornecedor);
CREATE INDEX idx_pedidos_status ON tb_pedidos(ds_status);
CREATE INDEX idx_pedidos_data ON tb_pedidos(dt_criacao);
CREATE INDEX idx_pedidos_rastreio ON tb_pedidos(ds_codigo_rastreio);

-- =============================================
-- ITENS DO PEDIDO
-- =============================================

CREATE TABLE IF NOT EXISTS tb_itens_pedido (
    id_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE CASCADE,

    -- Produto
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE SET NULL,
    id_variacao UUID REFERENCES tb_produto_variacoes(id_variacao) ON DELETE SET NULL,

    -- Snapshot do produto (caso o produto seja deletado)
    nm_produto VARCHAR(255) NOT NULL,
    ds_produto TEXT,
    ds_sku VARCHAR(100),
    ds_variacao VARCHAR(100), -- Ex: "Cor: Vermelho, Tamanho: Grande"
    ds_imagem_url TEXT,

    -- Quantidade e valores
    qt_quantidade INTEGER NOT NULL CHECK (qt_quantidade > 0),
    vl_unitario DECIMAL(10, 2) NOT NULL,
    vl_desconto_item DECIMAL(10, 2) DEFAULT 0,
    vl_total DECIMAL(10, 2) NOT NULL,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itens_pedido_pedido ON tb_itens_pedido(id_pedido);
CREATE INDEX idx_itens_pedido_produto ON tb_itens_pedido(id_produto);

-- =============================================
-- HISTÓRICO DE STATUS DO PEDIDO
-- =============================================

CREATE TABLE IF NOT EXISTS tb_pedido_historico (
    id_historico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE CASCADE,

    -- Status
    ds_status_anterior VARCHAR(50),
    ds_status_novo VARCHAR(50) NOT NULL,

    -- Observações
    ds_observacao TEXT,
    ds_observacao_cliente TEXT, -- Visível para o cliente

    -- Quem alterou
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    nm_usuario VARCHAR(255),

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedido_historico_pedido ON tb_pedido_historico(id_pedido);
CREATE INDEX idx_pedido_historico_data ON tb_pedido_historico(dt_criacao);

-- =============================================
-- USO DE CUPONS (rastreamento)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_cupons_uso (
    id_uso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cupom UUID REFERENCES tb_cupons(id_cupom) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE CASCADE,

    vl_desconto_aplicado DECIMAL(10, 2) NOT NULL,

    dt_uso TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cupons_uso_cupom ON tb_cupons_uso(id_cupom);
CREATE INDEX idx_cupons_uso_user ON tb_cupons_uso(id_user);
CREATE INDEX idx_cupons_uso_pedido ON tb_cupons_uso(id_pedido);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function para gerar número do pedido
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
    proximo_numero INTEGER;
    numero_pedido TEXT;
BEGIN
    -- Pega o maior número atual e incrementa
    SELECT COALESCE(MAX(CAST(SUBSTRING(nr_pedido FROM 5) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM tb_pedidos
    WHERE nr_pedido ~ '^PED-[0-9]+$';

    -- Formata com zeros à esquerda
    numero_pedido := 'PED-' || LPAD(proximo_numero::TEXT, 6, '0');

    RETURN numero_pedido;
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar uso do cupom
CREATE OR REPLACE FUNCTION atualizar_uso_cupom()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementa contador de usos do cupom
    UPDATE tb_cupons
    SET nr_usos_atuais = nr_usos_atuais + 1
    WHERE id_cupom = NEW.id_cupom;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para registrar histórico de status
CREATE OR REPLACE FUNCTION registrar_historico_pedido()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se o status mudou
    IF NEW.ds_status IS DISTINCT FROM OLD.ds_status THEN
        INSERT INTO tb_pedido_historico (
            id_pedido,
            ds_status_anterior,
            ds_status_novo
        ) VALUES (
            NEW.id_pedido,
            OLD.ds_status,
            NEW.ds_status
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_update_carrinho BEFORE UPDATE ON tb_carrinho
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_cupons BEFORE UPDATE ON tb_cupons
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_pedidos BEFORE UPDATE ON tb_pedidos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- Trigger para uso de cupom
CREATE TRIGGER trg_cupom_usado AFTER INSERT ON tb_cupons_uso
FOR EACH ROW EXECUTE FUNCTION atualizar_uso_cupom();

-- Trigger para histórico de status
CREATE TRIGGER trg_pedido_status_historico AFTER UPDATE ON tb_pedidos
FOR EACH ROW EXECUTE FUNCTION registrar_historico_pedido();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE tb_carrinho IS 'Carrinho de compras dos usuários (produtos e procedimentos)';
COMMENT ON TABLE tb_cupons IS 'Cupons de desconto promocionais';
COMMENT ON TABLE tb_pedidos IS 'Pedidos de produtos realizados';
COMMENT ON TABLE tb_itens_pedido IS 'Itens dos pedidos (produtos comprados)';
COMMENT ON TABLE tb_pedido_historico IS 'Histórico de mudanças de status dos pedidos';
COMMENT ON TABLE tb_cupons_uso IS 'Rastreamento de uso de cupons';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
