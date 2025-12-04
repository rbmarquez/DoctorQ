-- =============================================
-- DoctorQ - Dados MOCK para Testes
-- =============================================
-- Descrição: Popula o banco com dados realistas para desenvolvimento
-- Data: 2025-10-27
-- =============================================

-- Limpar dados antigos (opcional - comentar se quiser manter dados existentes)
-- TRUNCATE TABLE tb_avaliacoes, tb_agendamentos, tb_profissionais, tb_pacientes, tb_clinicas CASCADE;

-- =============================================
-- 1. EMPRESAS (Clínicas/Grupos)
-- =============================================

INSERT INTO tb_empresas (id_empresa, nm_empresa, nr_cnpj, nm_cidade, nm_estado, st_ativo) VALUES
('11111111-1111-1111-1111-111111111111', 'Clínica DoctorQ Premium', '12.345.678/0001-90', 'São Paulo', 'SP', true),
('22222222-2222-2222-2222-222222222222', 'BeautyMed Estética Avançada', '98.765.432/0001-10', 'Rio de Janeiro', 'RJ', true),
('33333333-3333-3333-3333-333333333333', 'Espaço Beleza & Saúde', '11.222.333/0001-44', 'Belo Horizonte', 'MG', true)
ON CONFLICT (id_empresa) DO NOTHING;

-- =============================================
-- 2. USUÁRIOS (Pacientes e Profissionais)
-- =============================================

-- Profissionais
INSERT INTO tb_users (id_user, nm_email, nm_completo, nm_papel, nr_telefone, st_ativo, id_perfil, dt_criacao) VALUES
('a1111111-1111-1111-1111-111111111111', 'dra.ana.silva@doctorq.com', 'Dra. Ana Paula Silva', 'profissional', '(11) 98765-4321', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW()),
('a2222222-2222-2222-2222-222222222222', 'dr.carlos.souza@doctorq.com', 'Dr. Carlos Eduardo Souza', 'profissional', '(11) 97654-3210', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW()),
('a3333333-3333-3333-3333-333333333333', 'dra.maria.costa@doctorq.com', 'Dra. Maria Fernanda Costa', 'profissional', '(21) 98876-5432', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW()),
('a4444444-4444-4444-4444-444444444444', 'juliana.santos@doctorq.com', 'Juliana Santos', 'profissional', '(21) 97765-4321', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW())
ON CONFLICT (nm_email) DO NOTHING;

-- Pacientes
INSERT INTO tb_users (id_user, nm_email, nm_completo, nm_papel, nr_telefone, st_ativo, id_perfil, dt_criacao) VALUES
('b1111111-1111-1111-1111-111111111111', 'patricia.oliveira@email.com', 'Patrícia Oliveira', 'paciente', '(11) 91234-5678', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b2222222-2222-2222-2222-222222222222', 'ricardo.almeida@email.com', 'Ricardo Almeida', 'paciente', '(11) 92345-6789', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b3333333-3333-3333-3333-333333333333', 'fernanda.lima@email.com', 'Fernanda Lima', 'paciente', '(21) 93456-7890', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b4444444-4444-4444-4444-444444444444', 'bruno.costa@email.com', 'Bruno Costa', 'paciente', '(21) 94567-8901', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b5555555-5555-5555-5555-555555555555', 'amanda.rocha@email.com', 'Amanda Rocha', 'paciente', '(31) 95678-9012', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b6666666-6666-6666-6666-666666666666', 'lucas.martins@email.com', 'Lucas Martins', 'paciente', '(31) 96789-0123', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW())
ON CONFLICT (nm_email) DO NOTHING;

-- Admin/Gestor
INSERT INTO tb_users (id_user, nm_email, nm_completo, nm_papel, nr_telefone, st_ativo, id_perfil, id_empresa, dt_criacao) VALUES
('c1111111-1111-1111-1111-111111111111', 'admin@doctorq.com', 'Admin DoctorQ', 'admin', '(11) 99999-9999', true, (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'admin'), '11111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (nm_email) DO NOTHING;

-- =============================================
-- 3. CLÍNICAS
-- =============================================

INSERT INTO tb_clinicas (
    id_clinica,
    id_empresa,
    nm_clinica,
    ds_clinica,
    ds_email,
    nr_telefone,
    nr_whatsapp,
    ds_endereco,
    nr_numero,
    nm_bairro,
    nm_cidade,
    nm_estado,
    nr_cep,
    ds_especialidades,
    ds_horario_funcionamento,
    st_ativo,
    st_verificada,
    nr_avaliacao_media,
    nr_total_avaliacoes
) VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Clínica DoctorQ Premium - Jardins',
    'Clínica especializada em estética facial e corporal, com equipamentos de última geração e profissionais altamente qualificados.',
    'jardins@doctorq.com',
    '(11) 3456-7890',
    '(11) 98765-4321',
    'Av. Brigadeiro Faria Lima',
    '3477',
    'Jardim Paulistano',
    'São Paulo',
    'SP',
    '01452-000',
    ARRAY['Estética Facial', 'Estética Corporal', 'Dermatologia', 'Harmonização Facial'],
    '{"segunda": "08:00-18:00", "terca": "08:00-18:00", "quarta": "08:00-18:00", "quinta": "08:00-18:00", "sexta": "08:00-18:00", "sabado": "09:00-14:00", "domingo": "FECHADO"}'::jsonb,
    true,
    true,
    4.8,
    127
),
(
    'c2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'BeautyMed - Barra da Tijuca',
    'Centro de estética avançada com foco em tratamentos minimamente invasivos e rejuvenescimento.',
    'barra@beautymed.com',
    '(21) 2345-6789',
    '(21) 98876-5432',
    'Av. das Américas',
    '5555',
    'Barra da Tijuca',
    'Rio de Janeiro',
    'RJ',
    '22640-100',
    ARRAY['Harmonização Facial', 'Preenchimento', 'Botox', 'Microagulhamento'],
    '{"segunda": "09:00-19:00", "terca": "09:00-19:00", "quarta": "09:00-19:00", "quinta": "09:00-19:00", "sexta": "09:00-19:00", "sabado": "09:00-15:00", "domingo": "FECHADO"}'::jsonb,
    true,
    true,
    4.6,
    89
),
(
    'c3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Espaço Beleza & Saúde - Savassi',
    'Clínica integrada de estética e bem-estar, oferecendo tratamentos personalizados.',
    'savassi@espacobeleza.com',
    '(31) 3234-5678',
    '(31) 99887-6543',
    'Rua Pernambuco',
    '1000',
    'Savassi',
    'Belo Horizonte',
    'MG',
    '30130-150',
    ARRAY['Estética Corporal', 'Massoterapia', 'Drenagem Linfática', 'Tratamentos Faciais'],
    '{"segunda": "08:00-20:00", "terca": "08:00-20:00", "quarta": "08:00-20:00", "quinta": "08:00-20:00", "sexta": "08:00-20:00", "sabado": "08:00-14:00", "domingo": "FECHADO"}'::jsonb,
    true,
    true,
    4.7,
    64
)
ON CONFLICT (id_clinica) DO NOTHING;

-- =============================================
-- 4. PROFISSIONAIS
-- =============================================

INSERT INTO tb_profissionais (
    id_profissional,
    id_user,
    id_clinica,
    nm_profissional,
    ds_biografia,
    ds_especialidades,
    nr_registro_profissional,
    nr_anos_experiencia,
    ds_email,
    nr_telefone,
    st_ativo,
    st_verificado,
    nr_avaliacao_media,
    nr_total_avaliacoes,
    nr_total_atendimentos
) VALUES
(
    'p1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Dra. Ana Paula Silva',
    'Dermatologista com mais de 12 anos de experiência em estética facial e harmonização. Especializada em técnicas minimamente invasivas.',
    ARRAY['Dermatologia', 'Harmonização Facial', 'Botox', 'Preenchimento'],
    'CRM 123456/SP',
    12,
    'dra.ana.silva@doctorq.com',
    '(11) 98765-4321',
    true,
    true,
    4.9,
    156,
    842
),
(
    'p2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    'Dr. Carlos Eduardo Souza',
    'Fisioterapeuta Dermato-Funcional especializado em tratamentos corporais e faciais avançados.',
    ARRAY['Fisioterapia Estética', 'Drenagem Linfática', 'Radiofrequência', 'Criolipolise'],
    'CREFITO 234567/SP',
    8,
    'dr.carlos.souza@doctorq.com',
    '(11) 97654-3210',
    true,
    true,
    4.7,
    92,
    564
),
(
    'p3333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'c2222222-2222-2222-2222-222222222222',
    'Dra. Maria Fernanda Costa',
    'Biomédica Estética com especialização em procedimentos injetáveis e laserterapia.',
    ARRAY['Estética Facial', 'Harmonização', 'Laser', 'Peeling'],
    'CRBM 34567/RJ',
    10,
    'dra.maria.costa@doctorq.com',
    '(21) 98876-5432',
    true,
    true,
    4.8,
    118,
    673
),
(
    'p4444444-4444-4444-4444-444444444444',
    'a4444444-4444-4444-4444-444444444444',
    'c3333333-3333-3333-3333-333333333333',
    'Juliana Santos',
    'Esteticista e Cosmetóloga especializada em tratamentos corporais e técnicas de rejuvenescimento.',
    ARRAY['Estética Corporal', 'Massoterapia', 'Microagulhamento', 'Tratamentos Faciais'],
    'CRF 45678/MG',
    6,
    'juliana.santos@doctorq.com',
    '(31) 99887-6543',
    true,
    true,
    4.6,
    78,
    421
)
ON CONFLICT (id_profissional) DO NOTHING;

-- =============================================
-- 5. PACIENTES
-- =============================================

INSERT INTO tb_pacientes (
    id_paciente,
    id_user,
    id_clinica,
    nm_paciente,
    dt_nascimento,
    nr_cpf,
    nm_genero,
    ds_email,
    nr_telefone,
    nm_cidade,
    nm_estado,
    st_ativo
) VALUES
('pac11111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Patrícia Oliveira', '1985-03-15', '123.456.789-10', 'feminino', 'patricia.oliveira@email.com', '(11) 91234-5678', 'São Paulo', 'SP', true),
('pac22222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Ricardo Almeida', '1978-07-22', '234.567.890-11', 'masculino', 'ricardo.almeida@email.com', '(11) 92345-6789', 'São Paulo', 'SP', true),
('pac33333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'Fernanda Lima', '1990-11-08', '345.678.901-22', 'feminino', 'fernanda.lima@email.com', '(21) 93456-7890', 'Rio de Janeiro', 'RJ', true),
('pac44444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'Bruno Costa', '1982-05-30', '456.789.012-33', 'masculino', 'bruno.costa@email.com', '(21) 94567-8901', 'Rio de Janeiro', 'RJ', true),
('pac55555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'c3333333-3333-3333-3333-333333333333', 'Amanda Rocha', '1995-09-12', '567.890.123-44', 'feminino', 'amanda.rocha@email.com', '(31) 95678-9012', 'Belo Horizonte', 'MG', true),
('pac66666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'Lucas Martins', '1987-12-25', '678.901.234-55', 'masculino', 'lucas.martins@email.com', '(31) 96789-0123', 'Belo Horizonte', 'MG', true)
ON CONFLICT (id_paciente) DO NOTHING;

-- =============================================
-- 6. PROCEDIMENTOS (se a tabela existir)
-- =============================================

INSERT INTO tb_procedimentos (
    id_procedimento,
    nm_procedimento,
    ds_procedimento,
    nr_duracao_minutos,
    vl_preco,
    ds_categoria,
    st_ativo
) VALUES
('proc1111-1111-1111-1111-111111111111', 'Harmonização Facial com Ácido Hialurônico', 'Preenchimento facial para correção de sulcos e aumento de volume', 90, 1500.00, 'facial', true),
('proc2222-2222-2222-2222-222222222222', 'Aplicação de Botox', 'Toxina botulínica para tratamento de rugas de expressão', 45, 800.00, 'facial', true),
('proc3333-3333-3333-3333-333333333333', 'Drenagem Linfática Corporal', 'Massagem terapêutica para redução de inchaço e celulite', 60, 180.00, 'corporal', true),
('proc4444-4444-4444-4444-444444444444', 'Limpeza de Pele Profunda', 'Tratamento facial completo com extração e máscara', 90, 250.00, 'facial', true),
('proc5555-5555-5555-5555-555555555555', 'Criolipolise', 'Tratamento não-invasivo para redução de gordura localizada', 60, 1200.00, 'corporal', true),
('proc6666-6666-6666-6666-666666666666', 'Peeling Químico', 'Renovação celular com ácidos para rejuvenescimento', 60, 450.00, 'facial', true),
('proc7777-7777-7777-7777-777777777777', 'Microagulhamento Facial', 'Indução percutânea de colágeno para rejuvenescimento', 75, 550.00, 'facial', true),
('proc8888-8888-8888-8888-888888888888', 'Radiofrequência Corporal', 'Tratamento para flacidez e contorno corporal', 45, 380.00, 'corporal', true)
ON CONFLICT (id_procedimento) DO NOTHING;

-- =============================================
-- 7. AGENDAMENTOS
-- =============================================

-- Agendamentos futuros
INSERT INTO tb_agendamentos (
    id_agendamento,
    id_paciente,
    id_profissional,
    id_clinica,
    dt_agendamento,
    nr_duracao_minutos,
    ds_tipo,
    ds_observacoes,
    ds_status
) VALUES
-- Próxima semana
('ag111111-1111-1111-1111-111111111111', 'pac11111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 90, 'consulta', 'Primeira consulta - harmonização facial', 'confirmado'),
('ag222222-2222-2222-2222-222222222222', 'pac22222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', NOW() + INTERVAL '4 days' + INTERVAL '14 hours', 60, 'procedimento', 'Sessão de drenagem linfática', 'confirmado'),
('ag333333-3333-3333-3333-333333333333', 'pac33333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', NOW() + INTERVAL '5 days' + INTERVAL '9 hours', 45, 'procedimento', 'Aplicação de botox', 'pendente'),
('ag444444-4444-4444-4444-444444444444', 'pac44444-4444-4444-4444-444444444444', 'p3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', NOW() + INTERVAL '7 days' + INTERVAL '11 hours', 90, 'consulta', 'Avaliação para preenchimento labial', 'confirmado'),
('ag555555-5555-5555-5555-555555555555', 'pac55555-5555-5555-5555-555555555555', 'p4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', NOW() + INTERVAL '6 days' + INTERVAL '15 hours', 75, 'procedimento', 'Microagulhamento facial', 'confirmado'),
-- Agendamentos passados (concluídos)
('ag666666-6666-6666-6666-666666666666', 'pac11111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days', 90, 'procedimento', 'Aplicação de ácido hialurônico', 'concluido'),
('ag777777-7777-7777-7777-777777777777', 'pac22222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '15 days', 60, 'procedimento', 'Drenagem linfática - 3ª sessão', 'concluido'),
('ag888888-8888-8888-8888-888888888888', 'pac33333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 days', 45, 'procedimento', 'Aplicação de botox - manutenção', 'concluido'),
('ag999999-9999-9999-9999-999999999999', 'pac55555-5555-5555-5555-555555555555', 'p4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '8 days', 90, 'consulta', 'Avaliação inicial', 'concluido')
ON CONFLICT (id_agendamento) DO NOTHING;

-- =============================================
-- 8. AVALIAÇÕES
-- =============================================

INSERT INTO tb_avaliacoes (
    id_avaliacao,
    id_user,
    id_profissional,
    id_clinica,
    nr_avaliacao,
    ds_comentario,
    dt_criacao
) VALUES
('av111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 5, 'Excelente profissional! Muito atenciosa e cuidadosa. O resultado da harmonização ficou perfeito!', NOW() - INTERVAL '5 days'),
('av222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 5, 'Dr. Carlos é ótimo! Sessão de drenagem muito relaxante e eficiente. Recomendo!', NOW() - INTERVAL '7 days'),
('av333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 4, 'Dra. Maria é muito profissional. O botox ficou natural, exatamente como eu queria.', NOW() - INTERVAL '12 days'),
('av444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'p3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 5, 'Adorei a clínica e a profissional! Ambiente limpo e confortável.', NOW() - INTERVAL '10 days'),
('av555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'p4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 5, 'Juliana é maravilhosa! Super atenciosa e competente. Voltarei com certeza!', NOW() - INTERVAL '3 days'),
('av666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'p4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 4, 'Ótimo atendimento e resultado. A clínica é muito bem localizada.', NOW() - INTERVAL '15 days')
ON CONFLICT (id_avaliacao) DO NOTHING;

-- =============================================
-- 9. CONVERSAS E MENSAGENS (se necessário)
-- =============================================

-- Conversas entre pacientes e profissionais
INSERT INTO tb_conversas (
    id_conversa,
    id_usuario,
    ds_titulo,
    ds_tipo,
    st_ativo
) VALUES
('cv111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Dúvidas sobre harmonização', 'paciente_profissional', true),
('cv222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'Reagendamento de consulta', 'paciente_clinica', true),
('cv333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555555', 'Informações sobre procedimentos', 'paciente_profissional', true)
ON CONFLICT (id_conversa) DO NOTHING;

-- =============================================
-- FIM DO SCRIPT
-- =============================================

-- Verificar dados inseridos
SELECT 'Empresas:', COUNT(*) FROM tb_empresas;
SELECT 'Usuários:', COUNT(*) FROM tb_users;
SELECT 'Clínicas:', COUNT(*) FROM tb_clinicas;
SELECT 'Profissionais:', COUNT(*) FROM tb_profissionais;
SELECT 'Pacientes:', COUNT(*) FROM tb_pacientes;
SELECT 'Agendamentos:', COUNT(*) FROM tb_agendamentos;
SELECT 'Avaliações:', COUNT(*) FROM tb_avaliacoes;
SELECT 'Conversas:', COUNT(*) FROM tb_conversas;

COMMENT ON TABLE tb_clinicas IS 'Dados MOCK inseridos em 2025-10-27 para testes e desenvolvimento';
