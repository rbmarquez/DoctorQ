-- ====================================================================
-- SEED DE CUPONS - DoctorQ
-- ====================================================================
-- Popula cupons de desconto para testes
-- Data: 2025-10-27
-- ====================================================================

BEGIN;

DO $$
DECLARE
    empresa_id uuid;
BEGIN
    -- Pegar primeira empresa ativa
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    IF empresa_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma empresa ativa encontrada';
    END IF;

    RAISE NOTICE 'Inserindo cupons para empresa: %', empresa_id;

    -- Cupons de percentual
    INSERT INTO tb_cupons (
        id_empresa, ds_codigo, nm_cupom, ds_descricao,
        ds_tipo_desconto, nr_percentual_desconto,
        vl_minimo_compra, nr_usos_maximos, nr_usos_por_usuario,
        dt_inicio, dt_fim, st_ativo
    ) VALUES
    -- BEMVINDO10 - 10% desconto para novos clientes
    (
        empresa_id, 'BEMVINDO10', 'Boas-vindas 10%',
        'Cupom de boas-vindas com 10% de desconto para novos clientes',
        'percentual', 10.00,
        50.00, 1000, 1,
        NOW(), NOW() + INTERVAL '3 months', true
    ),

    -- PRIMEIRACOMPRA - 15% desconto primeira compra
    (
        empresa_id, 'PRIMEIRACOMPRA', 'Primeira Compra 15%',
        'Desconto especial de 15% para sua primeira compra',
        'percentual', 15.00,
        100.00, 500, 1,
        NOW(), NOW() + INTERVAL '6 months', true
    ),

    -- CLIENTE20 - 20% desconto clientes VIP
    (
        empresa_id, 'CLIENTE20', 'Cliente VIP 20%',
        'Desconto exclusivo de 20% para clientes VIP',
        'percentual', 20.00,
        200.00, NULL, 10,
        NOW(), NOW() + INTERVAL '1 year', true
    ),

    -- VERAO2025 - 25% desconto promoção de verão
    (
        empresa_id, 'VERAO2025', 'Verão 2025',
        'Promoção especial de verão com 25% de desconto',
        'percentual', 25.00,
        150.00, 1000, 3,
        NOW(), NOW() + INTERVAL '2 months', true
    );

    -- Cupons de valor fixo
    INSERT INTO tb_cupons (
        id_empresa, ds_codigo, nm_cupom, ds_descricao,
        ds_tipo_desconto, vl_desconto_fixo,
        vl_minimo_compra, vl_maximo_desconto,
        nr_usos_maximos, nr_usos_por_usuario,
        dt_inicio, dt_fim, st_ativo
    ) VALUES
    -- DESCONTO50 - R$ 50 de desconto
    (
        empresa_id, 'DESCONTO50', 'Desconto R$ 50',
        'Ganhe R$ 50,00 de desconto na sua compra',
        'fixo', 50.00,
        300.00, 50.00,
        200, 1,
        NOW(), NOW() + INTERVAL '1 month', true
    ),

    -- FRETEGRATIS - Frete grátis (desconto de R$ 20)
    (
        empresa_id, 'FRETEGRATIS', 'Frete Grátis',
        'Frete grátis para compras acima de R$ 200',
        'fixo', 20.00,
        200.00, 20.00,
        500, 2,
        NOW(), NOW() + INTERVAL '3 months', true
    );

    RAISE NOTICE 'Cupons inseridos com sucesso!';

END $$;

COMMIT;

-- Verificação
SELECT
    ds_codigo,
    nm_cupom,
    ds_tipo_desconto,
    COALESCE(nr_percentual_desconto, 0) as percentual,
    COALESCE(vl_desconto_fixo, 0) as valor_fixo,
    vl_minimo_compra,
    nr_usos_maximos,
    nr_usos_por_usuario,
    st_ativo,
    dt_fim
FROM tb_cupons
ORDER BY dt_criacao;
