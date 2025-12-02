-- ====================================================================
-- SCRIPT DE SEED - DADOS DE DEMONSTRAÇÃO PARA MÓDULO DO PACIENTE
-- ====================================================================
-- Data: 09/11/2025
-- Descrição: Popula tabelas com dados realistas para demonstração
-- do módulo do paciente (Cupons, Notificações, Procedimentos, etc.)
-- ====================================================================

-- Limpar dados existentes (apenas para demo - NÃO usar em produção)
-- DELETE FROM tb_cupons WHERE ds_codigo LIKE 'DEMO%';
-- DELETE FROM tb_notificacoes WHERE id_user IN (SELECT id_user FROM tb_users WHERE nm_email = 'demo.paciente@doctorq.app');
-- DELETE FROM tb_procedimentos WHERE nm_procedimento LIKE 'DEMO:%';

-- ====================================================================
-- 1. CUPONS DE DESCONTO
-- ====================================================================

-- Cupom de boas-vindas
INSERT INTO tb_cupons (
    id_cupom,
    id_empresa,
    ds_codigo,
    nm_cupom,
    ds_descricao,
    ds_tipo_desconto,
    nr_percentual_desconto,
    vl_desconto_fixo,
    vl_minimo_compra,
    vl_maximo_desconto,
    nr_usos_maximos,
    nr_usos_por_usuario,
    nr_usos_atuais,
    st_primeira_compra,
    dt_inicio,
    dt_fim,
    st_ativo,
    dt_criacao
) VALUES
    (
        gen_random_uuid(),
        (SELECT id_empresa FROM tb_empresas LIMIT 1),
        'BEMVINDO10',
        'Bem-vindo ao DoctorQ',
        '10% de desconto na sua primeira compra de produtos ou procedimentos',
        'percentual',
        10.00,
        NULL,
        100.00,
        NULL,
        NULL, -- Ilimitado
        1,
        0,
        true,
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '365 days',
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id_empresa FROM tb_empresas LIMIT 1),
        'FACIAL20',
        'Especial Facial',
        '20% OFF em todos os procedimentos faciais desta semana!',
        'percentual',
        20.00,
        NULL,
        200.00,
        500.00,
        50,
        3,
        12,
        false,
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '23 days',
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id_empresa FROM tb_empresas LIMIT 1),
        'RELAX50',
        'Relaxamento Total',
        'R$ 50 de desconto em massagens e tratamentos corporais',
        'fixo',
        NULL,
        50.00,
        150.00,
        NULL,
        100,
        2,
        35,
        false,
        CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '10 days',
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id_empresa FROM tb_empresas LIMIT 1),
        'BLACKFRIDAY30',
        'Black Friday - 30% OFF',
        'Desconto especial em TODOS os procedimentos durante a Black Friday!',
        'percentual',
        30.00,
        NULL,
        NULL,
        NULL,
        NULL,
        1,
        78,
        false,
        '2025-11-24',
        '2025-11-30',
        true,
        NOW()
    );

-- ====================================================================
-- 2. PROCEDIMENTOS
-- ====================================================================

INSERT INTO tb_procedimentos (
    id_procedimento,
    nm_procedimento,
    ds_procedimento,
    vl_preco_base,
    vl_preco_minimo,
    vl_preco_maximo,
    nr_duracao_minutos,
    ds_categoria,
    ds_subcategoria,
    nr_media_avaliacoes,
    qt_total_avaliacoes,
    qt_clinicas_oferecem,
    fg_disponivel_online,
    st_ativo,
    dt_criacao
) VALUES
    (
        gen_random_uuid(),
        'Limpeza de Pele Profunda',
        'Limpeza facial completa com extração de cravos, esfoliação, máscara específica para seu tipo de pele e hidratação intensiva',
        180.00,
        120.00,
        250.00,
        60,
        'Facial',
        'Limpeza de Pele',
        4.8,
        142,
        15,
        true,
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        'Botox - Toxina Botulínica',
        'Aplicação de toxina botulínica tipo A para suavização de rugas e linhas de expressão (testa, glabela, periocular)',
        800.00,
        600.00,
        1200.00,
        30,
        'Estética Facial',
        'Toxina Botulínica',
        4.9,
        89,
        8,
        false,
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        'Preenchimento Labial',
        'Preenchimento com ácido hialurônico para realçar o volume e contorno dos lábios de forma natural',
        1200.00,
        900.00,
        1800.00,
        45,
        'Estética Facial',
        'Preenchimento',
        4.7,
        156,
        6,
        false,
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        'Microagulhamento Facial',
        'Tratamento de rejuvenescimento com microagulhas para estimular produção de colágeno, melhorar cicatrizes e manchas',
        350.00,
        250.00,
        500.00,
        90,
        'Rejuvenescimento',
        'Microagulhamento',
        4.6,
        78,
        12,
        true,
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        'Peeling Químico',
        'Renovação celular através de ácidos específicos (glicólico, salicílico, mandélico) para tratamento de manchas, acne e fotoenvelhecimento',
        280.00,
        200.00,
        450.00,
        60,
        'Facial',
        'Peeling',
        4.5,
        94,
        10,
        true,
        true,
        NOW()
    ),
    (
        gen_random_uuid(),
        'Drenagem Linfática Facial',
        'Massagem especializada para redução de inchaço, melhora da circulação e detoxificação da pele do rosto',
        150.00,
        100.00,
        200.00,
        50,
        'Corporal',
        'Drenagem',
        4.8,
        112,
        20,
        true,
        true,
        NOW()
    );

-- ====================================================================
-- 3. NOTIFICAÇÕES (para usuário demo)
-- ====================================================================

-- Primeiro, vamos criar um usuário demo se não existir
DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
BEGIN
    -- Pega a primeira empresa
    SELECT id_empresa INTO v_empresa_id FROM tb_empresas LIMIT 1;

    -- Cria usuário demo se não existir
    INSERT INTO tb_users (
        id_user,
        id_empresa,
        nm_email,
        nm_completo,
        senha,
        nm_papel,
        st_ativo,
        dt_criacao
    ) VALUES (
        gen_random_uuid(),
        v_empresa_id,
        'demo.paciente@doctorq.app',
        'Maria Silva Santos',
        '$2b$12$dummy_hash_for_demo_user_only', -- Senha: demo123
        'paciente',
        true,
        NOW()
    )
    ON CONFLICT (nm_email) DO NOTHING;

    -- Pega o ID do usuário demo
    SELECT id_user INTO v_user_id
    FROM tb_users
    WHERE nm_email = 'demo.paciente@doctorq.app';

    -- Insere notificações
    INSERT INTO tb_notificacoes (
        id_notificacao,
        id_user,
        ds_tipo,
        nm_titulo,
        ds_conteudo,
        ds_prioridade,
        st_lida,
        dt_criacao
    ) VALUES
        (
            gen_random_uuid(),
            v_user_id,
            'agendamento',
            'Lembrete de Agendamento',
            'Você tem um agendamento amanhã às 14:00 - Limpeza de Pele com Dra. Ana Paula Costa',
            'alta',
            false,
            NOW() - INTERVAL '2 hours'
        ),
        (
            gen_random_uuid(),
            v_user_id,
            'promocao',
            'Promoção Especial 🎉',
            '30% de desconto em todos os procedimentos faciais nesta semana! Aproveite!',
            'normal',
            false,
            NOW() - INTERVAL '3 hours'
        ),
        (
            gen_random_uuid(),
            v_user_id,
            'avaliacao',
            'Avalie seu Procedimento',
            'Que tal avaliar o procedimento de Peeling Químico realizado em 18/10? Sua opinião é muito importante!',
            'normal',
            false,
            NOW() - INTERVAL '1 day'
        ),
        (
            gen_random_uuid(),
            v_user_id,
            'sistema',
            'Agendamento Confirmado',
            'Seu agendamento para Massagem Relaxante foi confirmado para 25/10 às 10:00',
            'normal',
            true,
            NOW() - INTERVAL '2 days'
        ),
        (
            gen_random_uuid(),
            v_user_id,
            'lembrete',
            'Lembrete de Cuidados',
            'Não esqueça de aplicar o protetor solar após o procedimento de Peeling Químico',
            'normal',
            true,
            NOW() - INTERVAL '3 days'
        );
END $$;

-- ====================================================================
-- 4. TRANSAÇÕES/PAGAMENTOS (para histórico)
-- ====================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
BEGIN
    SELECT id_user INTO v_user_id
    FROM tb_users
    WHERE nm_email = 'demo.paciente@doctorq.app';

    SELECT id_empresa INTO v_empresa_id FROM tb_empresas LIMIT 1;

    INSERT INTO tb_transacoes (
        id_transacao,
        id_empresa,
        ds_tipo,
        vl_valor,
        vl_taxa,
        vl_liquido,
        ds_descricao,
        ds_forma_pagamento,
        ds_status,
        dt_pagamento,
        dt_competencia,
        dt_criacao
    ) VALUES
        (
            gen_random_uuid(),
            v_empresa_id,
            'entrada',
            180.00,
            0.00,
            180.00,
            'Limpeza de Pele Profunda - Maria Silva Santos',
            'credito',
            'pago',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days'
        ),
        (
            gen_random_uuid(),
            v_empresa_id,
            'entrada',
            1200.00,
            0.00,
            1200.00,
            'Preenchimento Labial - Maria Silva Santos',
            'pix',
            'pago',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days'
        ),
        (
            gen_random_uuid(),
            v_empresa_id,
            'entrada',
            150.00,
            0.00,
            150.00,
            'Peeling Químico - Parcela 1/3 - Maria Silva Santos',
            'credito',
            'pago',
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '3 days'
        ),
        (
            gen_random_uuid(),
            v_empresa_id,
            'entrada',
            200.00,
            0.00,
            200.00,
            'Massagem Relaxante - Maria Silva Santos',
            'boleto',
            'pendente',
            NULL,
            NOW() + INTERVAL '3 days',
            NOW() - INTERVAL '1 day'
        );
END $$;

-- ====================================================================
-- COMMIT
-- ====================================================================

COMMIT;

-- ====================================================================
-- VERIFICAÇÕES
-- ====================================================================

-- Contar cupons inseridos
SELECT COUNT(*) as total_cupons FROM tb_cupons WHERE ds_codigo IN ('BEMVINDO10', 'FACIAL20', 'RELAX50', 'BLACKFRIDAY30');

-- Contar procedimentos inseridos
SELECT COUNT(*) as total_procedimentos FROM tb_procedimentos WHERE nm_procedimento LIKE '%Limpeza de Pele%' OR nm_procedimento LIKE '%Botox%';

-- Contar notificações do usuário demo
SELECT COUNT(*) as total_notificacoes
FROM tb_notificacoes
WHERE id_user IN (SELECT id_user FROM tb_users WHERE nm_email = 'demo.paciente@doctorq.app');

-- Contar transações
SELECT COUNT(*) as total_transacoes FROM tb_transacoes WHERE ds_descricao LIKE '%Maria Silva Santos%';

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
