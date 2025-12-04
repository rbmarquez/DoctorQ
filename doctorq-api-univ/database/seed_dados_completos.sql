-- ============================================
-- SEED: Dados Completos da Universidade
-- Popula usuários, inscrições, progresso, avaliações
-- ============================================

-- ====================
-- 1. USUÁRIOS DE EXEMPLO
-- ====================
-- Nota: Assumindo que usuários vêm de tb_users do DoctorQ principal
-- Vamos criar registros de XP e Tokens para usuários fictícios

DO $$
DECLARE
    -- IDs de usuários fictícios (substituir por UUIDs reais quando integrado)
    usuario1_id UUID := 'a1b2c3d4-e5f6-4890-a234-567890abcdef';
    usuario2_id UUID := 'b2c3d4e5-f6a7-4901-a345-678901bcdef0';
    usuario3_id UUID := 'c3d4e5f6-a7b8-4012-a456-789012cdef01';
    usuario4_id UUID := 'd4e5f6a7-b8c9-4123-a567-890123def012';
    usuario5_id UUID := 'e5f6a7b8-c9d0-4234-a678-901234ef0123';

    -- IDs dos cursos
    curso_toxina_id UUID;
    curso_preench_id UUID;
    curso_peelings_id UUID;
    curso_marketing_id UUID;
    curso_crio_id UUID;

    -- IDs de módulos e aulas
    modulo1_toxina_id UUID;
    modulo2_toxina_id UUID;
    modulo3_toxina_id UUID;

    inscricao1_id UUID;
    inscricao2_id UUID;
    inscricao3_id UUID;
    inscricao4_id UUID;
    inscricao5_id UUID;

BEGIN
    RAISE NOTICE '🎓 Iniciando seed de dados completos...';

    -- Buscar IDs dos cursos
    SELECT id_curso INTO curso_toxina_id FROM tb_universidade_cursos WHERE slug = 'toxina-botulinica-avancada';
    SELECT id_curso INTO curso_preench_id FROM tb_universidade_cursos WHERE slug = 'preenchedores-faciais';
    SELECT id_curso INTO curso_peelings_id FROM tb_universidade_cursos WHERE slug = 'peelings-quimicos-avancados';
    SELECT id_curso INTO curso_marketing_id FROM tb_universidade_cursos WHERE slug = 'marketing-digital-clinicas';
    SELECT id_curso INTO curso_crio_id FROM tb_universidade_cursos WHERE slug = 'criolipolise-avancada';

    -- Buscar módulos do curso de Toxina
    SELECT id_modulo INTO modulo1_toxina_id FROM tb_universidade_modulos
    WHERE id_curso = curso_toxina_id AND ordem = 1;

    SELECT id_modulo INTO modulo2_toxina_id FROM tb_universidade_modulos
    WHERE id_curso = curso_toxina_id AND ordem = 2;

    SELECT id_modulo INTO modulo3_toxina_id FROM tb_universidade_modulos
    WHERE id_curso = curso_toxina_id AND ordem = 3;

    -- ====================
    -- 2. XP E TOKENS DOS USUÁRIOS
    -- ====================
    RAISE NOTICE '💎 Criando XP e Tokens dos usuários...';

    -- Usuário 1: Avançado (Nível 8)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario1_id, 8500, 8, 9000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 8500, nivel = 8, xp_proximo_nivel = 9000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario1_id, 350)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 350;

    -- Usuário 2: Intermediário (Nível 5)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario2_id, 4200, 5, 5000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 4200, nivel = 5, xp_proximo_nivel = 5000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario2_id, 180)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 180;

    -- Usuário 3: Iniciante (Nível 2)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario3_id, 1800, 2, 2000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 1800, nivel = 2, xp_proximo_nivel = 2000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario3_id, 75)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 75;

    -- Usuário 4: Intermediário (Nível 4)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario4_id, 3100, 4, 4000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 3100, nivel = 4, xp_proximo_nivel = 4000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario4_id, 120)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 120;

    -- Usuário 5: Avançado (Nível 6)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario5_id, 5600, 6, 6000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 5600, nivel = 6, xp_proximo_nivel = 6000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario5_id, 210)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 210;

    -- ====================
    -- 3. INSCRIÇÕES EM CURSOS
    -- ====================
    RAISE NOTICE '📚 Criando inscrições em cursos...';

    -- Usuário 1: Inscrito em Toxina (80% completo) e Preenchedores (concluído)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario1_id, curso_toxina_id, 80, 'em_andamento', 720, NOW() - INTERVAL '15 days'),
        (usuario1_id, curso_preench_id, 100, 'concluido', 1800, NOW() - INTERVAL '45 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao1_id;

    -- Usuário 2: Inscrito em Marketing (60% completo)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario2_id, curso_marketing_id, 60, 'em_andamento', 290, NOW() - INTERVAL '8 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao2_id;

    -- Usuário 3: Inscrito em Peelings (25% completo)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario3_id, curso_peelings_id, 25, 'em_andamento', 180, NOW() - INTERVAL '5 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao3_id;

    -- Usuário 4: Inscrito em Toxina (40% completo) e Criolipólise (100% concluído)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario4_id, curso_toxina_id, 40, 'em_andamento', 480, NOW() - INTERVAL '12 days'),
        (usuario4_id, curso_crio_id, 100, 'concluido', 720, NOW() - INTERVAL '30 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao4_id;

    -- Usuário 5: Inscrito em Preenchedores (90% completo)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario5_id, curso_preench_id, 90, 'em_andamento', 1620, NOW() - INTERVAL '20 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao5_id;

    -- ====================
    -- 4. PROGRESSO DE AULAS (Usuário 1 - Toxina 80%)
    -- ====================
    RAISE NOTICE '📖 Criando progresso de aulas...';

    -- Buscar ID da inscrição do Usuário 1 no curso de Toxina
    SELECT id_inscricao INTO inscricao1_id
    FROM tb_universidade_inscricoes
    WHERE id_usuario = usuario1_id AND id_curso = curso_toxina_id;

    -- Marcar aulas do Módulo 1 como concluídas (4 aulas)
    INSERT INTO tb_universidade_progresso_aulas
        (id_inscricao, id_aula, concluida, fg_assistido, tempo_assistido_segundos, ultima_posicao_segundos, dt_inicio, dt_conclusao)
    SELECT
        inscricao1_id,
        id_aula,
        true,
        true,
        duracao_minutos * 60,
        duracao_minutos * 60,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '14 days'
    FROM tb_universidade_aulas
    WHERE id_modulo = modulo1_toxina_id
    ON CONFLICT (id_inscricao, id_aula) DO UPDATE
    SET concluida = true, fg_assistido = true;

    -- Marcar 4 aulas do Módulo 2 como concluídas (de 5)
    INSERT INTO tb_universidade_progresso_aulas
        (id_inscricao, id_aula, concluida, fg_assistido, tempo_assistido_segundos, ultima_posicao_segundos, dt_inicio, dt_conclusao)
    SELECT
        inscricao1_id,
        id_aula,
        true,
        true,
        duracao_minutos * 60,
        duracao_minutos * 60,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '8 days'
    FROM tb_universidade_aulas
    WHERE id_modulo = modulo2_toxina_id
    ORDER BY ordem
    LIMIT 4
    ON CONFLICT (id_inscricao, id_aula) DO UPDATE
    SET concluida = true, fg_assistido = true;

    -- Marcar 3 aulas do Módulo 3 como concluídas (de 5) - total: 11/14 = ~80%
    INSERT INTO tb_universidade_progresso_aulas
        (id_inscricao, id_aula, concluida, fg_assistido, tempo_assistido_segundos, ultima_posicao_segundos, dt_inicio, dt_conclusao)
    SELECT
        inscricao1_id,
        id_aula,
        true,
        true,
        duracao_minutos * 60,
        duracao_minutos * 60,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '2 days'
    FROM tb_universidade_aulas
    WHERE id_modulo = modulo3_toxina_id
    ORDER BY ordem
    LIMIT 3
    ON CONFLICT (id_inscricao, id_aula) DO UPDATE
    SET concluida = true, fg_assistido = true;

    -- ====================
    -- 5. AVALIAÇÕES DE CURSOS REAIS
    -- ====================
    RAISE NOTICE '⭐ Criando avaliações de cursos...';

    -- Limpar avaliações fake (se houver)
    DELETE FROM tb_universidade_avaliacoes_cursos;

    -- Usuário 1 avalia Preenchedores (concluído)
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario1_id, curso_preench_id, 5, 'Curso excepcional! O instrutor domina o assunto e as técnicas são muito bem explicadas. Já estou aplicando no consultório.', NOW() - INTERVAL '40 days'),
        (usuario1_id, curso_toxina_id, 5, 'Estou adorando o curso! Ainda não terminei mas já aprendi muito. A parte de anatomia é excelente.', NOW() - INTERVAL '3 days');

    -- Usuário 2 avalia Marketing
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario2_id, curso_marketing_id, 4, 'Curso muito bom para quem está começando com marketing digital. Estratégias práticas e diretas ao ponto.', NOW() - INTERVAL '2 days');

    -- Usuário 3 avalia Peelings
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario3_id, curso_peelings_id, 5, 'Aulas muito didáticas! A Dra. Maria explica de forma clara e segura. Recomendo muito!', NOW() - INTERVAL '1 day');

    -- Usuário 4 avalia Criolipólise (concluído)
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario4_id, curso_crio_id, 5, 'Curso completo e atualizado. Os protocolos são muito bem detalhados. Já comprei o aparelho e estou tendo ótimos resultados!', NOW() - INTERVAL '25 days'),
        (usuario4_id, curso_toxina_id, 4, 'Bom curso, mas achei que poderia ter mais casos práticos. Mesmo assim, muito conteúdo de qualidade.', NOW() - INTERVAL '5 days');

    -- Usuário 5 avalia Preenchedores
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario5_id, curso_preench_id, 5, 'Melhor curso de preenchedores que já fiz! O Dr. João é referência na área. Vale cada centavo.', NOW() - INTERVAL '1 day');

    -- Adicionar mais 10 avaliações genéricas para aumentar o total
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (gen_random_uuid(), curso_toxina_id, 5, 'Excelente curso! Superou minhas expectativas.', NOW() - INTERVAL '60 days'),
        (gen_random_uuid(), curso_toxina_id, 4, 'Muito bom, só poderia ter mais vídeos práticos.', NOW() - INTERVAL '55 days'),
        (gen_random_uuid(), curso_preench_id, 5, 'Maravilhoso! Aprendi técnicas que não conhecia.', NOW() - INTERVAL '50 days'),
        (gen_random_uuid(), curso_preench_id, 5, 'Top demais! Instrutor nota 10.', NOW() - INTERVAL '48 days'),
        (gen_random_uuid(), curso_peelings_id, 4, 'Curso completo e muito didático.', NOW() - INTERVAL '42 days'),
        (gen_random_uuid(), curso_peelings_id, 5, 'Recomendo para todos da área!', NOW() - INTERVAL '38 days'),
        (gen_random_uuid(), curso_marketing_id, 4, 'Bom para iniciantes, direto ao ponto.', NOW() - INTERVAL '35 days'),
        (gen_random_uuid(), curso_marketing_id, 5, 'Já aumentei minha clientela em 30%!', NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), curso_crio_id, 5, 'Curso essencial para quem quer trabalhar com criolipólise.', NOW() - INTERVAL '28 days'),
        (gen_random_uuid(), curso_crio_id, 4, 'Muito conteúdo bom, vale o investimento.', NOW() - INTERVAL '22 days');

    -- Atualizar média de avaliações dos cursos (calcular real)
    UPDATE tb_universidade_cursos c
    SET
        avaliacao_media = (
            SELECT ROUND(AVG(nota)::numeric, 2)
            FROM tb_universidade_avaliacoes_cursos
            WHERE id_curso = c.id_curso
        ),
        total_avaliacoes = (
            SELECT COUNT(*)
            FROM tb_universidade_avaliacoes_cursos
            WHERE id_curso = c.id_curso
        );

    -- ====================
    -- 6. BADGES CONQUISTADOS
    -- ====================
    RAISE NOTICE '🏆 Atribuindo badges...';

    -- Usuário 1 (avançado): badges de primeira aula, primeiro curso, badge de 5 cursos
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario1_id,
        id_badge,
        NOW() - INTERVAL '45 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'primeiro-curso-completo', 'maratonista')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 2 (intermediário): primeira aula, 10 aulas
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario2_id,
        id_badge,
        NOW() - INTERVAL '8 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'estudioso')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 3 (iniciante): primeira aula
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario3_id,
        id_badge,
        NOW() - INTERVAL '5 days'
    FROM tb_universidade_badges
    WHERE slug = 'primeira-aula'
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 4 (intermediário): primeira aula, primeiro curso
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario4_id,
        id_badge,
        NOW() - INTERVAL '30 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'primeiro-curso-completo')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 5 (avançado): primeira aula, estudioso
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario5_id,
        id_badge,
        NOW() - INTERVAL '20 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'estudioso')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    RAISE NOTICE '✅ Seed concluído com sucesso!';
    RAISE NOTICE '   - 5 usuários com XP e Tokens';
    RAISE NOTICE '   - 7 inscrições em cursos';
    RAISE NOTICE '   - ~11 aulas assistidas (usuário 1)';
    RAISE NOTICE '   - 17 avaliações reais de cursos';
    RAISE NOTICE '   - Badges distribuídos';

END $$;

-- ====================
-- 7. VERIFICAÇÃO FINAL
-- ====================
SELECT
    'Resumo do Seed' as info,
    (SELECT COUNT(*) FROM tb_universidade_xp) as usuarios_com_xp,
    (SELECT COUNT(*) FROM tb_universidade_inscricoes) as inscricoes,
    (SELECT COUNT(*) FROM tb_universidade_progresso_aulas) as aulas_assistidas,
    (SELECT COUNT(*) FROM tb_universidade_avaliacoes_cursos) as avaliacoes,
    (SELECT COUNT(*) FROM tb_universidade_badges_usuarios) as badges_conquistados;
