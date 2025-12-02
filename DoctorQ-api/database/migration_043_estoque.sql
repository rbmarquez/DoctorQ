-- =====================================================
-- Migration 043: Sistema de Gestão de Estoque
-- UC043 - Gerenciar Estoque
-- Data: 07/11/2025
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: tb_movimentacoes_estoque
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_movimentacoes_estoque (
    id_movimentacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES tb_produtos(id_produto) ON DELETE RESTRICT,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE SET NULL,
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE SET NULL,

    -- Tipo de movimentação
    tp_movimentacao VARCHAR(20) NOT NULL CHECK (tp_movimentacao IN ('entrada', 'saida', 'ajuste', 'reserva', 'devolucao')),

    -- Quantidades
    nr_quantidade INTEGER NOT NULL CHECK (nr_quantidade > 0),
    nr_estoque_anterior INTEGER NOT NULL,
    nr_estoque_atual INTEGER NOT NULL,

    -- Valores
    vl_custo_unitario DECIMAL(10,2),

    -- Rastreabilidade
    ds_motivo TEXT,
    ds_lote VARCHAR(50),
    dt_validade TIMESTAMP,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_estoque_nao_negativo CHECK (nr_estoque_atual >= 0)
);

COMMENT ON TABLE tb_movimentacoes_estoque IS 'Movimentações de estoque (entrada, saída, ajuste, etc)';
COMMENT ON COLUMN tb_movimentacoes_estoque.tp_movimentacao IS 'entrada | saida | ajuste | reserva | devolucao';
COMMENT ON COLUMN tb_movimentacoes_estoque.nr_estoque_anterior IS 'Estoque antes da movimentação';
COMMENT ON COLUMN tb_movimentacoes_estoque.nr_estoque_atual IS 'Estoque após a movimentação';
COMMENT ON COLUMN tb_movimentacoes_estoque.ds_lote IS 'Número do lote do produto';
COMMENT ON COLUMN tb_movimentacoes_estoque.dt_validade IS 'Data de validade do lote';

-- =====================================================
-- TABELA: tb_reservas_estoque
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_reservas_estoque (
    id_reserva UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES tb_produtos(id_produto) ON DELETE RESTRICT,
    id_agendamento UUID NOT NULL REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,

    -- Quantidade reservada
    nr_quantidade INTEGER NOT NULL CHECK (nr_quantidade > 0),

    -- Status e expiração
    st_reserva VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK (st_reserva IN ('ativa', 'confirmada', 'cancelada', 'expirada')),
    dt_expiracao TIMESTAMP,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE tb_reservas_estoque IS 'Reservas temporárias de estoque para agendamentos';
COMMENT ON COLUMN tb_reservas_estoque.st_reserva IS 'ativa | confirmada | cancelada | expirada';
COMMENT ON COLUMN tb_reservas_estoque.dt_expiracao IS 'Data/hora de expiração da reserva (default 24h)';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- tb_movimentacoes_estoque
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa ON tb_movimentacoes_estoque(id_empresa);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON tb_movimentacoes_estoque(id_produto);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON tb_movimentacoes_estoque(tp_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_user ON tb_movimentacoes_estoque(id_user);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_agendamento ON tb_movimentacoes_estoque(id_agendamento);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_pedido ON tb_movimentacoes_estoque(id_pedido);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_dt_criacao ON tb_movimentacoes_estoque(dt_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_lote ON tb_movimentacoes_estoque(ds_lote) WHERE ds_lote IS NOT NULL;

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_produto_dt ON tb_movimentacoes_estoque(id_empresa, id_produto, dt_criacao DESC);

-- tb_reservas_estoque
CREATE INDEX IF NOT EXISTS idx_reservas_empresa ON tb_reservas_estoque(id_empresa);
CREATE INDEX IF NOT EXISTS idx_reservas_produto ON tb_reservas_estoque(id_produto);
CREATE INDEX IF NOT EXISTS idx_reservas_agendamento ON tb_reservas_estoque(id_agendamento);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON tb_reservas_estoque(st_reserva);
CREATE INDEX IF NOT EXISTS idx_reservas_dt_criacao ON tb_reservas_estoque(dt_criacao DESC);

-- Índice parcial para reservas ativas (mais consultadas)
CREATE INDEX IF NOT EXISTS idx_reservas_ativas ON tb_reservas_estoque(id_empresa, id_produto)
    WHERE st_reserva = 'ativa';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar dt_atualizacao em tb_reservas_estoque
CREATE OR REPLACE FUNCTION update_reservas_estoque_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reservas_estoque_timestamp ON tb_reservas_estoque;
CREATE TRIGGER trg_update_reservas_estoque_timestamp
    BEFORE UPDATE ON tb_reservas_estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_reservas_estoque_timestamp();

-- =====================================================
-- FUNÇÕES DE NEGÓCIO
-- =====================================================

-- Função para calcular estoque atual de um produto
CREATE OR REPLACE FUNCTION calcular_estoque_produto(p_id_empresa UUID, p_id_produto UUID)
RETURNS INTEGER AS $$
DECLARE
    v_estoque INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN tp_movimentacao IN ('entrada', 'devolucao') THEN nr_quantidade
            ELSE -nr_quantidade
        END
    ), 0)
    INTO v_estoque
    FROM tb_movimentacoes_estoque
    WHERE id_empresa = p_id_empresa
      AND id_produto = p_id_produto;

    RETURN v_estoque;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_estoque_produto IS 'Calcula estoque atual de um produto somando todas as movimentações';

-- Função para calcular estoque reservado de um produto
CREATE OR REPLACE FUNCTION calcular_estoque_reservado(p_id_empresa UUID, p_id_produto UUID)
RETURNS INTEGER AS $$
DECLARE
    v_reservado INTEGER;
BEGIN
    SELECT COALESCE(SUM(nr_quantidade), 0)
    INTO v_reservado
    FROM tb_reservas_estoque
    WHERE id_empresa = p_id_empresa
      AND id_produto = p_id_produto
      AND st_reserva = 'ativa'
      AND (dt_expiracao IS NULL OR dt_expiracao > now());

    RETURN v_reservado;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_estoque_reservado IS 'Calcula estoque reservado (ativo e não expirado) de um produto';

-- Função para expirar reservas antigas (pode ser chamada por cron job)
CREATE OR REPLACE FUNCTION expirar_reservas_antigas()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE tb_reservas_estoque
    SET st_reserva = 'expirada',
        dt_atualizacao = now()
    WHERE st_reserva = 'ativa'
      AND dt_expiracao IS NOT NULL
      AND dt_expiracao < now();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expirar_reservas_antigas IS 'Expira reservas cujo dt_expiracao passou (deve ser executado periodicamente)';

-- =====================================================
-- VIEW: Resumo de Estoque por Produto
-- =====================================================

CREATE OR REPLACE VIEW vw_estoque_produtos AS
SELECT
    p.id_produto,
    p.id_empresa,
    p.nm_produto,
    p.nr_quantidade_estoque AS nr_estoque_atual,
    COALESCE(r.nr_reservado, 0) AS nr_reservado,
    p.nr_quantidade_estoque - COALESCE(r.nr_reservado, 0) AS nr_disponivel,
    p.nr_estoque_minimo,
    CASE
        WHEN p.nr_quantidade_estoque <= p.nr_estoque_minimo THEN true
        ELSE false
    END AS fg_estoque_baixo,
    CASE
        WHEN p.nr_quantidade_estoque = 0 THEN true
        ELSE false
    END AS fg_sem_estoque,
    p.vl_preco_custo * p.nr_quantidade_estoque AS vl_estoque_total
FROM tb_produtos p
LEFT JOIN (
    SELECT
        id_empresa,
        id_produto,
        SUM(nr_quantidade) AS nr_reservado
    FROM tb_reservas_estoque
    WHERE st_reserva = 'ativa'
      AND (dt_expiracao IS NULL OR dt_expiracao > now())
    GROUP BY id_empresa, id_produto
) r ON p.id_empresa = r.id_empresa AND p.id_produto = r.id_produto;

COMMENT ON VIEW vw_estoque_produtos IS 'Resumo consolidado de estoque: atual, reservado, disponível, alertas';

-- =====================================================
-- VIEW: Estatísticas de Movimentações
-- =====================================================

CREATE OR REPLACE VIEW vw_estoque_estatisticas AS
SELECT
    id_empresa,
    id_produto,
    tp_movimentacao,
    COUNT(*) AS nr_movimentacoes,
    SUM(nr_quantidade) AS nr_total_quantidade,
    AVG(nr_quantidade) AS nr_media_quantidade,
    MIN(dt_criacao) AS dt_primeira_movimentacao,
    MAX(dt_criacao) AS dt_ultima_movimentacao
FROM tb_movimentacoes_estoque
GROUP BY id_empresa, id_produto, tp_movimentacao;

COMMENT ON VIEW vw_estoque_estatisticas IS 'Estatísticas de movimentações por empresa, produto e tipo';

-- =====================================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE tb_movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_reservas_estoque ENABLE ROW LEVEL SECURITY;

-- Policies para tb_movimentacoes_estoque
DROP POLICY IF EXISTS movimentacoes_estoque_tenant_isolation ON tb_movimentacoes_estoque;
CREATE POLICY movimentacoes_estoque_tenant_isolation ON tb_movimentacoes_estoque
    USING (id_empresa = current_setting('app.current_empresa_id')::UUID);

-- Policies para tb_reservas_estoque
DROP POLICY IF EXISTS reservas_estoque_tenant_isolation ON tb_reservas_estoque;
CREATE POLICY reservas_estoque_tenant_isolation ON tb_reservas_estoque
    USING (id_empresa = current_setting('app.current_empresa_id')::UUID);

-- =====================================================
-- DADOS DE EXEMPLO (DESENVOLVIMENTO)
-- =====================================================

-- Inserir movimentações de exemplo (apenas se tabela vazia)
DO $$
DECLARE
    v_count INTEGER;
    v_empresa_id UUID;
    v_produto_id UUID;
    v_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO v_count FROM tb_movimentacoes_estoque;

    IF v_count = 0 THEN
        -- Buscar IDs de exemplo
        SELECT id_empresa INTO v_empresa_id FROM tb_empresas LIMIT 1;
        SELECT id_produto INTO v_produto_id FROM tb_produtos WHERE id_empresa = v_empresa_id LIMIT 1;
        SELECT id_user INTO v_user_id FROM tb_users WHERE id_empresa = v_empresa_id LIMIT 1;

        IF v_empresa_id IS NOT NULL AND v_produto_id IS NOT NULL THEN
            -- Entrada inicial
            INSERT INTO tb_movimentacoes_estoque (
                id_empresa, id_produto, id_user, tp_movimentacao,
                nr_quantidade, nr_estoque_anterior, nr_estoque_atual,
                vl_custo_unitario, ds_motivo, ds_lote, dt_validade
            ) VALUES (
                v_empresa_id, v_produto_id, v_user_id, 'entrada',
                100, 0, 100,
                50.00, 'Estoque inicial', 'LOTE001', now() + INTERVAL '1 year'
            );

            -- Saída
            INSERT INTO tb_movimentacoes_estoque (
                id_empresa, id_produto, id_user, tp_movimentacao,
                nr_quantidade, nr_estoque_anterior, nr_estoque_atual,
                ds_motivo
            ) VALUES (
                v_empresa_id, v_produto_id, v_user_id, 'saida',
                10, 100, 90,
                'Venda para cliente'
            );
        END IF;
    END IF;
END $$;

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
BEGIN
    -- Verificar se tabelas foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_movimentacoes_estoque') THEN
        RAISE EXCEPTION 'Tabela tb_movimentacoes_estoque não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_reservas_estoque') THEN
        RAISE EXCEPTION 'Tabela tb_reservas_estoque não foi criada';
    END IF;

    -- Verificar se views foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_estoque_produtos') THEN
        RAISE EXCEPTION 'View vw_estoque_produtos não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_estoque_estatisticas') THEN
        RAISE EXCEPTION 'View vw_estoque_estatisticas não foi criada';
    END IF;

    RAISE NOTICE 'Migration 043 aplicada com sucesso!';
    RAISE NOTICE '- 2 tabelas criadas: tb_movimentacoes_estoque, tb_reservas_estoque';
    RAISE NOTICE '- 15 índices criados';
    RAISE NOTICE '- 4 funções criadas';
    RAISE NOTICE '- 2 views criadas';
    RAISE NOTICE '- Row-Level Security habilitado';
END $$;
