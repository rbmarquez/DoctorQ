-- ====================================================================
-- SEED DE CONTEÚDO - Not ificações, Fotos, Álbuns
-- ====================================================================
-- Data: 2025-10-27
-- ====================================================================

BEGIN;

-- ====================================================================
-- 1. NOTIFICAÇÕES ADICIONAIS (50 notificações)
-- ====================================================================
DO $$
DECLARE
    user_id uuid;
    empresa_id uuid;
    tipos text[] := ARRAY['agendamento', 'pagamento', 'lembrete', 'promocao', 'sistema', 'mensagem'];
    titulos text[] := ARRAY[
        'Novo agendamento confirmado',
        'Pagamento aprovado com sucesso',
        'Lembrete: Consulta amanhã',
        'Promoção especial para você!',
        'Atualização do sistema',
        'Nova mensagem recebida',
        'Procedimento concluído',
        'Avaliação pendente'
    ];
    mensagens text[] := ARRAY[
        'Seu agendamento foi confirmado para amanhã às 14h',
        'O pagamento de R$ 299,00 foi processado com sucesso',
        'Não esqueça: você tem uma consulta agendada amanhã',
        'Ganhe 20% de desconto em todos os procedimentos',
        'Sistema será atualizado hoje à noite',
        'Você recebeu uma nova mensagem do atendimento',
        'Seu procedimento foi finalizado com sucesso',
        'Avalie sua última consulta e ganhe pontos'
    ];
    counter integer := 0;
BEGIN
    RAISE NOTICE 'Inserindo Notificações Adicionais...';

    FOR i IN 1..50 LOOP
        SELECT id_user, id_empresa INTO user_id, empresa_id
        FROM tb_users
        WHERE st_ativo = 'S'
        ORDER BY random()
        LIMIT 1;

        IF user_id IS NOT NULL AND empresa_id IS NOT NULL THEN
            INSERT INTO tb_notificacoes (
                id_notificacao, id_user, id_empresa, ds_tipo,
                nm_titulo, ds_conteudo, st_lida, ds_dados_adicionais, ds_prioridade
            )
            VALUES (
                gen_random_uuid(), user_id, empresa_id,
                tipos[floor(random() * array_length(tipos, 1) + 1)],
                titulos[floor(random() * array_length(titulos, 1) + 1)],
                mensagens[floor(random() * array_length(mensagens, 1) + 1)],
                random() > 0.4,
                jsonb_build_object('action_url', '/dashboard'),
                CASE WHEN random() > 0.8 THEN 'high' ELSE 'normal' END
            );
            counter := counter + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '% notificações inseridas!', counter;
END $$;

-- ====================================================================
-- 2. ÁLBUNS DE FOTOS (15 álbuns)
-- ====================================================================
DO $$
DECLARE
    paciente_id uuid;
    empresa_id uuid;
    album_id uuid;
    titulos text[] := ARRAY[
        'Evolução do Tratamento',
        'Antes e Depois',
        'Meus Resultados',
        'Procedimentos 2025',
        'Galeria de Transformação',
        'Progresso Mensal',
        'Histórico de Procedimentos'
    ];
    counter integer := 0;
BEGIN
    RAISE NOTICE 'Inserindo Álbuns...';

    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = true LIMIT 1;

    FOR paciente_id IN (SELECT id_paciente FROM tb_pacientes LIMIT 15) LOOP
        IF empresa_id IS NOT NULL THEN
            album_id := gen_random_uuid();
            INSERT INTO tb_albuns (
                id_album, id_paciente, id_empresa, nm_album, ds_descricao, ds_visibilidade
            )
            VALUES (
                album_id, paciente_id, empresa_id,
                titulos[floor(random() * array_length(titulos, 1) + 1)],
                'Registro fotográfico completo do tratamento estético realizado',
                CASE WHEN random() > 0.6 THEN 'publico' ELSE 'privado' END
            );
            counter := counter + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '% álbuns inseridos!', counter;
END $$;

-- ====================================================================
-- 3. FOTOS (60 fotos distribuídas nos álbuns)
-- ====================================================================
DO $$
DECLARE
    album_rec RECORD;
    paciente_id uuid;
    legendas text[] := ARRAY[
        'Antes do tratamento - foto inicial',
        'Após 30 dias de tratamento',
        'Resultado após 60 dias',
        'Resultado final do tratamento',
        'Evolução positiva visível',
        'Aplicação do procedimento',
        'Resultado imediato',
        'Comparativo antes/depois'
    ];
    counter integer := 0;
BEGIN
    RAISE NOTICE 'Inserindo Fotos...';

    FOR album_rec IN (
        SELECT a.id_album, u.id_user
        FROM tb_albuns a
        LEFT JOIN tb_pacientes p ON a.id_paciente = p.id_paciente
        LEFT JOIN tb_users u ON p.id_user = u.id_user
        WHERE u.id_user IS NOT NULL
    ) LOOP
        -- 3-5 fotos por álbum
        FOR i IN 1..floor(random() * 3 + 3) LOOP
            INSERT INTO tb_fotos (
                id_foto, id_album, id_user, ds_url, ds_legenda, dt_foto_tirada
            )
            VALUES (
                gen_random_uuid(),
                album_rec.id_album,
                album_rec.id_user,
                '/uploads/fotos/' || to_char(NOW(), 'YYYY/MM/') || substring(md5(random()::text) from 1 for 20) || '.jpg',
                legendas[floor(random() * array_length(legendas, 1) + 1)],
                NOW() - (floor(random() * 90) || ' days')::interval
            );
            counter := counter + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '% fotos inseridas!', counter;
END $$;

COMMIT;

-- ====================================================================
-- VERIFICAÇÃO
-- ====================================================================
SELECT 'tb_notificacoes' as tabela, COUNT(*) as registros FROM tb_notificacoes
UNION ALL
SELECT 'tb_albuns', COUNT(*) FROM tb_albuns
UNION ALL
SELECT 'tb_fotos', COUNT(*) FROM tb_fotos;
