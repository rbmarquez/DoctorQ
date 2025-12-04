-- =============================================
-- Agendamentos e Avaliações - Dados MOCK
-- =============================================

-- =============================================
-- 1. AGENDAMENTOS FUTUROS
-- =============================================

INSERT INTO tb_agendamentos (
    id_agendamento,
    id_paciente,
    id_profissional,
    id_clinica,
    id_procedimento,
    dt_agendamento,
    nr_duracao_minutos,
    ds_status,
    ds_observacoes,
    st_confirmado,
    vl_valor
) VALUES
-- Próximos 7 dias
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', 90, 'agendado', 'Primeira consulta - harmonização facial', true, 1500.00),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', NOW() + INTERVAL '3 days' + INTERVAL '14 hours', 60, 'agendado', 'Sessão de drenagem linfática', true, 180.00),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '4 days' + INTERVAL '9 hours', 45, 'agendado', 'Aplicação de botox', true, 800.00),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', NOW() + INTERVAL '5 days' + INTERVAL '11 hours', 90, 'agendado', 'Limpeza de pele profunda', true, 250.00),
('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', NOW() + INTERVAL '6 days' + INTERVAL '15 hours', 75, 'agendado', 'Microagulhamento facial', true, 550.00),
('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', NOW() + INTERVAL '7 days' + INTERVAL '10 hours', 45, 'agendado', 'Radiofrequência corporal', false, 380.00)
ON CONFLICT (id_agendamento) DO NOTHING;

-- =============================================
-- 2. AGENDAMENTOS PASSADOS (CONCLUÍDOS)
-- =============================================

INSERT INTO tb_agendamentos (
    id_agendamento,
    id_paciente,
    id_profissional,
    id_clinica,
    id_procedimento,
    dt_agendamento,
    nr_duracao_minutos,
    ds_status,
    ds_observacoes,
    st_confirmado,
    vl_valor,
    st_pago,
    st_avaliado
) VALUES
-- Últimos 30 dias
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days', 45, 'concluido', 'Aplicação de botox - manutenção', true, 800.00, true, true),
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '8 days', 60, 'concluido', 'Drenagem linfática - 2ª sessão', true, 180.00, true, true),
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '12 days', 90, 'concluido', 'Limpeza de pele', true, 250.00, true, true),
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '15 days', 45, 'concluido', 'Botox - primeira aplicação', true, 800.00, true, true),
('a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '18 days', 60, 'concluido', 'Peeling químico', true, 450.00, true, true),
('a6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '20 days', 45, 'concluido', 'Radiofrequência - 1ª sessão', true, 380.00, true, true),
('a7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '25 days', 90, 'concluido', 'Harmonização facial - avaliação', true, 1500.00, true, true),
('a8888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '28 days', 60, 'concluido', 'Drenagem linfática - 1ª sessão', true, 180.00, true, false)
ON CONFLICT (id_agendamento) DO NOTHING;

-- =============================================
-- 3. AVALIAÇÕES
-- =============================================

INSERT INTO tb_avaliacoes (
    id_avaliacao,
    id_paciente,
    id_profissional,
    id_clinica,
    id_agendamento,
    nr_avaliacao,
    ds_comentario,
    dt_criacao
) VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 5, 'Excelente profissional! Muito atenciosa e cuidadosa. O resultado ficou perfeito e natural. Super recomendo!', NOW() - INTERVAL '4 days'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 5, 'Dr. Carlos é ótimo! Sessão de drenagem muito relaxante e eficiente. Já senti diferença!', NOW() - INTERVAL '7 days'),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 5, 'Dra. Maria é muito profissional e experiente. A limpeza de pele foi impecável. Clínica linda!', NOW() - INTERVAL '11 days'),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 4, 'Muito bom! O botox ficou natural. Dra. Maria explica tudo direitinho. Voltarei!', NOW() - INTERVAL '14 days'),
('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', 5, 'Juliana é maravilhosa! Super atenciosa e competente. O peeling foi perfeito.', NOW() - INTERVAL '17 days'),
('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', 5, 'Ótimo atendimento! Ambiente aconchegante e profissional muito qualificada.', NOW() - INTERVAL '19 days'),
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', 5, 'Amei o resultado! Dra. Ana tem mão de fada. Harmonia perfeita!', NOW() - INTERVAL '24 days')
ON CONFLICT (id_avaliacao) DO NOTHING;

-- =============================================
-- VERIFICAÇÃO
-- =============================================

SELECT 'Agendamentos Futuros:', COUNT(*) FROM tb_agendamentos WHERE dt_agendamento > NOW();
SELECT 'Agendamentos Passados:', COUNT(*) FROM tb_agendamentos WHERE dt_agendamento <= NOW();
SELECT 'Avaliações:', COUNT(*) FROM tb_avaliacoes;

-- Mostrar próximos agendamentos
SELECT
    a.dt_agendamento,
    pa.nm_paciente,
    pr.nm_profissional,
    c.nm_clinica,
    a.ds_status
FROM tb_agendamentos a
JOIN tb_pacientes pa ON a.id_paciente = pa.id_paciente
JOIN tb_profissionais pr ON a.id_profissional = pr.id_profissional
JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
WHERE a.dt_agendamento > NOW()
ORDER BY a.dt_agendamento
LIMIT 5;

COMMENT ON TABLE tb_agendamentos IS 'Dados MOCK de agendamentos inseridos em 2025-10-27';
