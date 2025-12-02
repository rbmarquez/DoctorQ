-- ====================================================================
-- MIGRATION 019 - Criar Tabela tb_cupons
-- ====================================================================
-- Data: 09/11/2025
-- Descrição: Cria tabela para gerenciamento de cupons de desconto
-- ====================================================================

-- Criar tabela tb_cupons
CREATE TABLE IF NOT EXISTS tb_cupons (
    -- Identificação
    id_cupom UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_fornecedor UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,

    -- Informações do Cupom
    ds_codigo VARCHAR(50) UNIQUE NOT NULL,
    nm_cupom VARCHAR(255) NOT NULL,
    ds_descricao TEXT,

    -- Tipo e Valor do Desconto
    ds_tipo_desconto VARCHAR(20) NOT NULL CHECK (ds_tipo_desconto IN ('percentual', 'fixo')),
    nr_percentual_desconto NUMERIC(5, 2) CHECK (nr_percentual_desconto >= 0 AND nr_percentual_desconto <= 100),
    vl_desconto_fixo NUMERIC(10, 2) CHECK (vl_desconto_fixo >= 0),

    -- Regras de Aplicação
    vl_minimo_compra NUMERIC(10, 2),
    vl_maximo_desconto NUMERIC(10, 2),

    -- Limites de Uso
    nr_usos_maximos INTEGER,
    nr_usos_por_usuario INTEGER NOT NULL DEFAULT 1,
    nr_usos_atuais INTEGER NOT NULL DEFAULT 0,

    -- Restrições de Produtos/Categorias
    ds_produtos_validos UUID[],
    ds_categorias_validas UUID[],

    -- Flags
    st_primeira_compra BOOLEAN NOT NULL DEFAULT false,

    -- Período de Validade
    dt_inicio DATE NOT NULL,
    dt_fim DATE NOT NULL,

    -- Status
    st_ativo BOOLEAN NOT NULL DEFAULT true,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_desconto_valido CHECK (
        (ds_tipo_desconto = 'percentual' AND nr_percentual_desconto IS NOT NULL AND vl_desconto_fixo IS NULL) OR
        (ds_tipo_desconto = 'fixo' AND vl_desconto_fixo IS NOT NULL AND nr_percentual_desconto IS NULL)
    ),
    CONSTRAINT chk_datas_validas CHECK (dt_fim >= dt_inicio)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON tb_cupons(ds_codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_empresa ON tb_cupons(id_empresa);
CREATE INDEX IF NOT EXISTS idx_cupons_ativo ON tb_cupons(st_ativo);
CREATE INDEX IF NOT EXISTS idx_cupons_validade ON tb_cupons(dt_inicio, dt_fim);

-- Trigger para atualizar dt_atualizacao
CREATE OR REPLACE FUNCTION update_dt_atualizacao_cupons()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_cupons
    BEFORE UPDATE ON tb_cupons
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_atualizacao_cupons();

-- Comentários
COMMENT ON TABLE tb_cupons IS 'Tabela de cupons de desconto';
COMMENT ON COLUMN tb_cupons.ds_tipo_desconto IS 'Tipo: percentual ou fixo';
COMMENT ON COLUMN tb_cupons.nr_usos_maximos IS 'NULL = ilimitado';
COMMENT ON COLUMN tb_cupons.st_primeira_compra IS 'Cupom válido apenas para primeira compra';

-- ====================================================================
-- FIM DA MIGRATION
-- ====================================================================
