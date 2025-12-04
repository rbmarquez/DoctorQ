-- =============================================
-- DoctorQ - Migration 012: Sistema Financeiro
-- =============================================
-- Descrição: Tabelas para gestão financeira completa
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================

-- =============================================
-- CONTAS BANCÁRIAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_contas_bancarias (
    id_conta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE,

    -- Tipo de titular
    ds_tipo_titular VARCHAR(20) NOT NULL, -- 'empresa', 'profissional', 'fornecedor'

    -- Dados bancários
    nm_banco VARCHAR(100) NOT NULL,
    nr_banco VARCHAR(10),
    ds_agencia VARCHAR(20) NOT NULL,
    ds_conta VARCHAR(20) NOT NULL,
    ds_tipo_conta VARCHAR(20) DEFAULT 'corrente', -- 'corrente', 'poupanca', 'pagamento'
    ds_pix VARCHAR(255), -- Chave PIX

    -- Status
    st_principal BOOLEAN DEFAULT false,
    st_ativo BOOLEAN DEFAULT true,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: apenas um tipo de titular por conta
    CONSTRAINT chk_titular_type CHECK (
        (id_empresa IS NOT NULL AND id_profissional IS NULL AND id_fornecedor IS NULL) OR
        (id_empresa IS NULL AND id_profissional IS NOT NULL AND id_fornecedor IS NULL) OR
        (id_empresa IS NULL AND id_profissional IS NULL AND id_fornecedor IS NOT NULL)
    )
);

CREATE INDEX idx_contas_bancarias_empresa ON tb_contas_bancarias(id_empresa);
CREATE INDEX idx_contas_bancarias_profissional ON tb_contas_bancarias(id_profissional);
CREATE INDEX idx_contas_bancarias_fornecedor ON tb_contas_bancarias(id_fornecedor);

-- =============================================
-- CATEGORIAS FINANCEIRAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_categorias_financeiras (
    id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_categoria_pai UUID REFERENCES tb_categorias_financeiras(id_categoria) ON DELETE SET NULL,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    nm_categoria VARCHAR(100) NOT NULL,
    ds_tipo VARCHAR(20) NOT NULL, -- 'receita', 'despesa'
    ds_cor VARCHAR(20), -- Para UI
    ds_icone VARCHAR(50), -- Lucide icon name

    st_ativo BOOLEAN DEFAULT true,
    nr_ordem INTEGER DEFAULT 0,

    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categorias_financeiras_empresa ON tb_categorias_financeiras(id_empresa);
CREATE INDEX idx_categorias_financeiras_tipo ON tb_categorias_financeiras(ds_tipo);

-- Categorias padrão
INSERT INTO tb_categorias_financeiras (nm_categoria, ds_tipo, ds_cor, ds_icone) VALUES
    ('Vendas de Produtos', 'receita', 'green', 'ShoppingBag'),
    ('Procedimentos Estéticos', 'receita', 'emerald', 'Sparkles'),
    ('Consultas', 'receita', 'teal', 'Stethoscope'),
    ('Comissões', 'despesa', 'orange', 'Percent'),
    ('Impostos', 'despesa', 'red', 'Receipt'),
    ('Fornecedores', 'despesa', 'purple', 'Package'),
    ('Salários', 'despesa', 'blue', 'Users'),
    ('Infraestrutura', 'despesa', 'gray', 'Building')
ON CONFLICT DO NOTHING;

-- =============================================
-- TRANSAÇÕES FINANCEIRAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_transacoes (
    id_transacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_categoria UUID REFERENCES tb_categorias_financeiras(id_categoria) ON DELETE SET NULL,
    id_conta_bancaria UUID REFERENCES tb_contas_bancarias(id_conta) ON DELETE SET NULL,

    -- Referências opcionais
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE SET NULL,
    id_fatura UUID, -- Será referenciado quando criarmos tb_faturas abaixo

    -- Tipo e valores
    ds_tipo VARCHAR(20) NOT NULL, -- 'receita', 'despesa', 'transferencia', 'estorno'
    vl_valor DECIMAL(12, 2) NOT NULL,
    vl_taxa DECIMAL(12, 2) DEFAULT 0, -- Taxas de gateway, etc.
    vl_liquido DECIMAL(12, 2) GENERATED ALWAYS AS (vl_valor - vl_taxa) STORED,

    -- Descrição
    ds_descricao VARCHAR(500) NOT NULL,
    ds_observacoes TEXT,

    -- Pagamento
    ds_forma_pagamento VARCHAR(50), -- 'dinheiro', 'pix', 'credito', 'debito', 'boleto', 'transferencia'
    ds_status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'confirmado', 'cancelado', 'estornado'

    -- Gateway de pagamento
    ds_gateway VARCHAR(50), -- 'stripe', 'pagseguro', 'mercadopago', 'manual'
    ds_id_transacao_gateway VARCHAR(255),
    ds_dados_gateway JSONB,

    -- Datas
    dt_vencimento DATE,
    dt_pagamento TIMESTAMP,
    dt_competencia DATE, -- Mês/ano de competência contábil

    -- Recorrência
    st_recorrente BOOLEAN DEFAULT false,
    ds_frequencia_recorrencia VARCHAR(20), -- 'mensal', 'trimestral', 'anual'
    id_transacao_pai UUID REFERENCES tb_transacoes(id_transacao) ON DELETE SET NULL,

    -- Parcelamento
    nr_parcela INTEGER,
    nr_total_parcelas INTEGER,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: valor sempre positivo
    CONSTRAINT chk_valor_positivo CHECK (vl_valor > 0)
);

CREATE INDEX idx_transacoes_empresa ON tb_transacoes(id_empresa);
CREATE INDEX idx_transacoes_categoria ON tb_transacoes(id_categoria);
CREATE INDEX idx_transacoes_tipo ON tb_transacoes(ds_tipo);
CREATE INDEX idx_transacoes_status ON tb_transacoes(ds_status);
CREATE INDEX idx_transacoes_competencia ON tb_transacoes(dt_competencia);
CREATE INDEX idx_transacoes_vencimento ON tb_transacoes(dt_vencimento);
CREATE INDEX idx_transacoes_agendamento ON tb_transacoes(id_agendamento);
CREATE INDEX idx_transacoes_pedido ON tb_transacoes(id_pedido);

-- =============================================
-- FATURAS
-- =============================================

CREATE TABLE IF NOT EXISTS tb_faturas (
    id_fatura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nr_fatura VARCHAR(20) UNIQUE NOT NULL, -- FAT-000001
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Cliente (paciente ou empresa)
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_empresa_cliente UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Valores
    vl_subtotal DECIMAL(12, 2) NOT NULL,
    vl_descontos DECIMAL(12, 2) DEFAULT 0,
    vl_impostos DECIMAL(12, 2) DEFAULT 0,
    vl_total DECIMAL(12, 2) NOT NULL,
    vl_pago DECIMAL(12, 2) DEFAULT 0,
    vl_saldo DECIMAL(12, 2) GENERATED ALWAYS AS (vl_total - vl_pago) STORED,

    -- Status
    ds_status VARCHAR(50) DEFAULT 'rascunho',
    -- 'rascunho', 'enviada', 'paga', 'parcialmente_paga', 'vencida', 'cancelada'

    -- Datas
    dt_emissao DATE NOT NULL,
    dt_vencimento DATE NOT NULL,
    dt_pagamento TIMESTAMP,

    -- Observações
    ds_observacoes TEXT,
    ds_termos_condicoes TEXT,

    -- Nota fiscal
    ds_numero_nota_fiscal VARCHAR(50),
    ds_chave_nfe VARCHAR(44),
    ds_url_danfe TEXT,
    dt_emissao_nf TIMESTAMP,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: pelo menos um cliente definido
    CONSTRAINT chk_cliente_fatura CHECK (
        id_paciente IS NOT NULL OR id_empresa_cliente IS NOT NULL
    )
);

CREATE INDEX idx_faturas_nr_fatura ON tb_faturas(nr_fatura);
CREATE INDEX idx_faturas_empresa ON tb_faturas(id_empresa);
CREATE INDEX idx_faturas_paciente ON tb_faturas(id_paciente);
CREATE INDEX idx_faturas_status ON tb_faturas(ds_status);
CREATE INDEX idx_faturas_vencimento ON tb_faturas(dt_vencimento);

-- =============================================
-- ITENS DA FATURA
-- =============================================

CREATE TABLE IF NOT EXISTS tb_itens_fatura (
    id_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_fatura UUID REFERENCES tb_faturas(id_fatura) ON DELETE CASCADE,

    -- Item pode ser agendamento ou produto
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE SET NULL,

    -- Descrição
    ds_descricao VARCHAR(500) NOT NULL,
    qt_quantidade DECIMAL(10, 2) DEFAULT 1 CHECK (qt_quantidade > 0),
    vl_unitario DECIMAL(12, 2) NOT NULL,
    vl_desconto DECIMAL(12, 2) DEFAULT 0,
    vl_total DECIMAL(12, 2) NOT NULL,

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itens_fatura_fatura ON tb_itens_fatura(id_fatura);
CREATE INDEX idx_itens_fatura_agendamento ON tb_itens_fatura(id_agendamento);
CREATE INDEX idx_itens_fatura_produto ON tb_itens_fatura(id_produto);

-- =============================================
-- REPASSES (para profissionais e fornecedores)
-- =============================================

CREATE TABLE IF NOT EXISTS tb_repasses (
    id_repasse UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE,
    id_conta_bancaria UUID REFERENCES tb_contas_bancarias(id_conta) ON DELETE SET NULL,

    -- Valores
    vl_bruto DECIMAL(12, 2) NOT NULL,
    vl_impostos DECIMAL(12, 2) DEFAULT 0,
    vl_taxas DECIMAL(12, 2) DEFAULT 0,
    vl_liquido DECIMAL(12, 2) GENERATED ALWAYS AS (vl_bruto - vl_impostos - vl_taxas) STORED,

    -- Período
    dt_inicio_periodo DATE NOT NULL,
    dt_fim_periodo DATE NOT NULL,

    -- Status
    ds_status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'processando', 'pago', 'cancelado'

    -- Pagamento
    ds_forma_pagamento VARCHAR(50), -- 'transferencia', 'pix', 'boleto'
    dt_pagamento TIMESTAMP,
    ds_comprovante_url TEXT,

    -- Observações
    ds_observacoes TEXT,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraint: apenas um tipo de beneficiário
    CONSTRAINT chk_beneficiario_repasse CHECK (
        (id_profissional IS NOT NULL AND id_fornecedor IS NULL) OR
        (id_profissional IS NULL AND id_fornecedor IS NOT NULL)
    )
);

CREATE INDEX idx_repasses_empresa ON tb_repasses(id_empresa);
CREATE INDEX idx_repasses_profissional ON tb_repasses(id_profissional);
CREATE INDEX idx_repasses_fornecedor ON tb_repasses(id_fornecedor);
CREATE INDEX idx_repasses_status ON tb_repasses(ds_status);
CREATE INDEX idx_repasses_periodo ON tb_repasses(dt_inicio_periodo, dt_fim_periodo);

-- =============================================
-- ITENS DO REPASSE
-- =============================================

CREATE TABLE IF NOT EXISTS tb_itens_repasse (
    id_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_repasse UUID REFERENCES tb_repasses(id_repasse) ON DELETE CASCADE,
    id_transacao UUID REFERENCES tb_transacoes(id_transacao) ON DELETE SET NULL,
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE SET NULL,

    ds_descricao VARCHAR(500) NOT NULL,
    vl_valor DECIMAL(12, 2) NOT NULL,
    nr_percentual_comissao DECIMAL(5, 2), -- Ex: 30.00 = 30%
    vl_comissao DECIMAL(12, 2) NOT NULL,

    dt_referencia DATE, -- Data da transação original

    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itens_repasse_repasse ON tb_itens_repasse(id_repasse);
CREATE INDEX idx_itens_repasse_transacao ON tb_itens_repasse(id_transacao);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function para gerar número da fatura
CREATE OR REPLACE FUNCTION gerar_numero_fatura()
RETURNS TEXT AS $$
DECLARE
    proximo_numero INTEGER;
    numero_fatura TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(nr_fatura FROM 5) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM tb_faturas
    WHERE nr_fatura ~ '^FAT-[0-9]+$';

    numero_fatura := 'FAT-' || LPAD(proximo_numero::TEXT, 6, '0');

    RETURN numero_fatura;
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar valor pago da fatura
CREATE OR REPLACE FUNCTION atualizar_valor_pago_fatura()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza o valor pago na fatura quando uma transação é confirmada
    IF NEW.ds_status = 'confirmado' AND NEW.id_fatura IS NOT NULL THEN
        UPDATE tb_faturas
        SET vl_pago = COALESCE((
            SELECT SUM(vl_liquido)
            FROM tb_transacoes
            WHERE id_fatura = NEW.id_fatura AND ds_status = 'confirmado'
        ), 0)
        WHERE id_fatura = NEW.id_fatura;

        -- Atualiza status da fatura
        UPDATE tb_faturas f
        SET ds_status = CASE
            WHEN f.vl_saldo <= 0 THEN 'paga'
            WHEN f.vl_pago > 0 AND f.vl_saldo > 0 THEN 'parcialmente_paga'
            WHEN f.dt_vencimento < CURRENT_DATE AND f.vl_saldo > 0 THEN 'vencida'
            ELSE f.ds_status
        END
        WHERE f.id_fatura = NEW.id_fatura;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_update_contas_bancarias BEFORE UPDATE ON tb_contas_bancarias
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_categorias_financeiras BEFORE UPDATE ON tb_categorias_financeiras
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_transacoes BEFORE UPDATE ON tb_transacoes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_faturas BEFORE UPDATE ON tb_faturas
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_repasses BEFORE UPDATE ON tb_repasses
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- Trigger para atualizar valor pago da fatura
CREATE TRIGGER trg_atualizar_fatura_pagamento AFTER INSERT OR UPDATE ON tb_transacoes
FOR EACH ROW EXECUTE FUNCTION atualizar_valor_pago_fatura();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE tb_contas_bancarias IS 'Contas bancárias de empresas, profissionais e fornecedores';
COMMENT ON TABLE tb_categorias_financeiras IS 'Categorias para organização de receitas e despesas';
COMMENT ON TABLE tb_transacoes IS 'Transações financeiras (receitas, despesas, transferências)';
COMMENT ON TABLE tb_faturas IS 'Faturas emitidas para clientes';
COMMENT ON TABLE tb_itens_fatura IS 'Itens/serviços incluídos nas faturas';
COMMENT ON TABLE tb_repasses IS 'Repasses financeiros para profissionais e fornecedores';
COMMENT ON TABLE tb_itens_repasse IS 'Detalhamento dos itens que compõem os repasses';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
