-- ====================================================================
-- SCRIPT DE SEED - Usuário Demo e Notificações
-- ====================================================================
-- Data: 09/11/2025
-- Descrição: Cria usuário demo paciente e suas notificações
-- ====================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
BEGIN
    -- Pega a primeira empresa
    SELECT id_empresa INTO v_empresa_id FROM tb_empresas LIMIT 1;

    -- Cria usuário demo se não existir (usando ds_senha_hash)
    INSERT INTO tb_users (
        id_user,
        id_empresa,
        nm_email,
        nm_completo,
        ds_senha_hash,
        nm_papel,
        st_ativo,
        dt_criacao
    ) VALUES (
        gen_random_uuid(),
        v_empresa_id,
        'demo.paciente@doctorq.app',
        'Maria Silva Santos',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5kosgktb4IEQ6', -- Senha: demo123
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
        ),
        (
            gen_random_uuid(),
            v_user_id,
            'promocao',
            'Programa de Fidelidade',
            'Você acumulou 150 pontos! Troque por descontos em procedimentos.',
            'baixa',
            true,
            NOW() - INTERVAL '4 days'
        ),
        (
            gen_random_uuid(),
            v_user_id,
            'agendamento',
            'Confirmação Necessária',
            'Por favor, confirme seu agendamento para Drenagem Linfática em 28/10',
            'normal',
            true,
            NOW() - INTERVAL '5 days'
        );

    RAISE NOTICE 'Usuário demo criado: %', v_user_id;
END $$;

-- Verificações
SELECT COUNT(*) as total_notificacoes_demo
FROM tb_notificacoes
WHERE id_user IN (SELECT id_user FROM tb_users WHERE nm_email = 'demo.paciente@doctorq.app');

SELECT nm_email, nm_completo, nm_papel
FROM tb_users
WHERE nm_email = 'demo.paciente@doctorq.app';

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
