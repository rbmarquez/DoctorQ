-- ====================================================================
-- MIGRATION 021 - Criar Tabela tb_transacoes
-- ====================================================================
-- Data: 09/11/2025
-- Descrição: Cria tabela para gestão financeira e transações
-- ====================================================================

-- Criar tabela tb_transacoes
CREATE TABLE IF NOT EXISTS tb_transacoes (
    -- Identificação
    id_transacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,

    -- Tipo e Valores
    ds_tipo VARCHAR(20) NOT NULL CHECK (ds_tipo IN ('entrada', 'saida', 'transferencia')),
    vl_valor NUMERIC(10, 2) NOT NULL CHECK (vl_valor >= 0),
    vl_taxa NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (vl_taxa >= 0),
    vl_liquido NUMERIC(10, 2) NOT NULL CHECK (vl_liquido >= 0),

    -- Descrição
    ds_descricao VARCHAR(500) NOT NULL,
    ds_observacoes TEXT,

    -- Forma de Pagamento
    ds_forma_pagamento VARCHAR(20) CHECK (ds_forma_pagamento IN ('credito', 'debito', 'dinheiro', 'pix', 'boleto', 'transferencia')),

    -- Status
    ds_status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (ds_status IN ('pendente', 'pago', 'cancelado', 'estornado')),

    -- Datas
    dt_vencimento DATE,
    dt_pagamento TIMESTAMP,
    dt_competencia DATE,

    -- Parcelamento
    nr_parcela INTEGER,
    nr_total_parcelas INTEGER DEFAULT 1,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_parcela_valida CHECK (
        (nr_parcela IS NULL AND nr_total_parcelas = 1) OR
        (nr_parcela IS NOT NULL AND nr_parcela <= nr_total_parcelas)
    ),
    CONSTRAINT chk_vl_liquido CHECK (vl_liquido = vl_valor - vl_taxa)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON tb_transacoes(id_empresa);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON tb_transacoes(ds_tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON tb_transacoes(ds_status);
CREATE INDEX IF NOT EXISTS idx_transacoes_competencia ON tb_transacoes(dt_competencia);
CREATE INDEX IF NOT EXISTS idx_transacoes_pagamento ON tb_transacoes(dt_pagamento);
CREATE INDEX IF NOT EXISTS idx_transacoes_agendamento ON tb_transacoes(id_agendamento);

-- Trigger para atualizar dt_atualizacao
CREATE OR REPLACE FUNCTION update_dt_atualizacao_transacoes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = NOW();

    -- Atualizar dt_pagamento quando status muda para 'pago'
    IF NEW.ds_status = 'pago' AND OLD.ds_status != 'pago' AND NEW.dt_pagamento IS NULL THEN
        NEW.dt_pagamento = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_transacoes
    BEFORE UPDATE ON tb_transacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_atualizacao_transacoes();

-- Comentários
COMMENT ON TABLE tb_transacoes IS 'Tabela de transações financeiras';
COMMENT ON COLUMN tb_transacoes.ds_tipo IS 'Tipo: entrada, saida, transferencia';
COMMENT ON COLUMN tb_transacoes.ds_status IS 'Status: pendente, pago, cancelado, estornado';
COMMENT ON COLUMN tb_transacoes.vl_liquido IS 'Valor líquido = valor - taxa';
COMMENT ON COLUMN tb_transacoes.dt_competencia IS 'Data de competência contábil';

-- ====================================================================
-- FIM DA MIGRATION
-- ====================================================================
