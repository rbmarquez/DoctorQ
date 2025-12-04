-- =============================================
-- DoctorQ - Dados MOCK para Testes (V2 - Corrigido)
-- =============================================
-- Descrição: Popula o banco com dados realistas compatíveis com estrutura existente
-- Data: 2025-10-27
-- =============================================

-- =============================================
-- 1. EMPRESAS (usando empresas existentes ou criando novas)
-- =============================================

-- Pegar ID de uma empresa existente ou criar uma nova
DO $$
DECLARE
    empresa_id uuid;
BEGIN
    -- Tentar pegar uma empresa existente
    SELECT id_empresa INTO empresa_id FROM tb_empresas WHERE st_ativo = 'S' LIMIT 1;

    -- Se não houver, criar uma
    IF empresa_id IS NULL THEN
        INSERT INTO tb_empresas (nm_empresa, nr_cnpj, nm_cidade, nm_estado, st_ativo)
        VALUES ('Clínica DoctorQ', '12345678000190', 'São Paulo', 'SP', 'S')
        RETURNING id_empresa INTO empresa_id;
    END IF;

    -- Armazenar em uma variável temporária
    CREATE TEMP TABLE temp_empresa (id uuid);
    INSERT INTO temp_empresa VALUES (empresa_id);
END $$;

-- =============================================
-- 2. USUÁRIOS (Pacientes e Profissionais)
-- =============================================

-- Profissionais
INSERT INTO tb_users (id_user, nm_email, nm_completo, nm_papel, nr_telefone, st_ativo, id_perfil, dt_criacao) VALUES
('a1111111-1111-1111-1111-111111111111', 'dra.ana.silva@doctorq.com', 'Dra. Ana Paula Silva', 'profissional', '(11) 98765-4321', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW()),
('a2222222-2222-2222-2222-222222222222', 'dr.carlos.souza@doctorq.com', 'Dr. Carlos Eduardo Souza', 'profissional', '(11) 97654-3210', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW()),
('a3333333-3333-3333-3333-333333333333', 'dra.maria.costa@doctorq.com', 'Dra. Maria Fernanda Costa', 'profissional', '(21) 98876-5432', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW()),
('a4444444-4444-4444-4444-444444444444', 'juliana.santos@doctorq.com', 'Juliana Santos', 'profissional', '(21) 97765-4321', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'profissional'), NOW())
ON CONFLICT (nm_email) DO NOTHING;

-- Pacientes
INSERT INTO tb_users (id_user, nm_email, nm_completo, nm_papel, nr_telefone, st_ativo, id_perfil, dt_criacao) VALUES
('b1111111-1111-1111-1111-111111111111', 'patricia.oliveira@email.com', 'Patrícia Oliveira', 'paciente', '(11) 91234-5678', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b2222222-2222-2222-2222-222222222222', 'ricardo.almeida@email.com', 'Ricardo Almeida', 'paciente', '(11) 92345-6789', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b3333333-3333-3333-3333-333333333333', 'fernanda.lima@email.com', 'Fernanda Lima', 'paciente', '(21) 93456-7890', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b4444444-4444-4444-4444-444444444444', 'bruno.costa@email.com', 'Bruno Costa', 'paciente', '(21) 94567-8901', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b5555555-5555-5555-5555-555555555555', 'amanda.rocha@email.com', 'Amanda Rocha', 'paciente', '(31) 95678-9012', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW()),
('b6666666-6666-6666-6666-666666666666', 'lucas.martins@email.com', 'Lucas Martins', 'paciente', '(31) 96789-0123', 'S', (SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'paciente'), NOW())
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
    (SELECT id FROM temp_empresa LIMIT 1),
    'Clínica DoctorQ Premium - Jardins',
    'Clínica especializada em estética facial e corporal',
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
    (SELECT id FROM temp_empresa LIMIT 1),
    'BeautyMed - Barra da Tijuca',
    'Centro de estética avançada',
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
    (SELECT id FROM temp_empresa LIMIT 1),
    'Espaço Beleza & Saúde - Savassi',
    'Clínica integrada de estética e bem-estar',
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
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Dra. Ana Paula Silva',
    'Dermatologista com mais de 12 anos de experiência',
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
    '22222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    'Dr. Carlos Eduardo Souza',
    'Fisioterapeuta Dermato-Funcional',
    ARRAY['Fisioterapia Estética', 'Drenagem Linfática', 'Radiofrequência'],
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
    '33333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'c2222222-2222-2222-2222-222222222222',
    'Dra. Maria Fernanda Costa',
    'Biomédica Estética especializada em injetáveis',
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
    '44444444-4444-4444-4444-444444444444',
    'a4444444-4444-4444-4444-444444444444',
    'c3333333-3333-3333-3333-333333333333',
    'Juliana Santos',
    'Esteticista e Cosmetóloga',
    ARRAY['Estética Corporal', 'Massoterapia', 'Microagulhamento'],
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
('11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Patrícia Oliveira', '1985-03-15', '12345678910', 'feminino', 'patricia.oliveira@email.com', '(11) 91234-5678', 'São Paulo', 'SP', true),
('22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Ricardo Almeida', '1978-07-22', '23456789011', 'masculino', 'ricardo.almeida@email.com', '(11) 92345-6789', 'São Paulo', 'SP', true),
('33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'Fernanda Lima', '1990-11-08', '34567890122', 'feminino', 'fernanda.lima@email.com', '(21) 93456-7890', 'Rio de Janeiro', 'RJ', true),
('44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'Bruno Costa', '1982-05-30', '45678901233', 'masculino', 'bruno.costa@email.com', '(21) 94567-8901', 'Rio de Janeiro', 'RJ', true),
('55555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'c3333333-3333-3333-3333-333333333333', 'Amanda Rocha', '1995-09-12', '56789012344', 'feminino', 'amanda.rocha@email.com', '(31) 95678-9012', 'Belo Horizonte', 'MG', true),
('66666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'Lucas Martins', '1987-12-25', '67890123455', 'masculino', 'lucas.martins@email.com', '(31) 96789-0123', 'Belo Horizonte', 'MG', true)
ON CONFLICT (id_paciente) DO NOTHING;

-- =============================================
-- 6. PROCEDIMENTOS
-- =============================================

INSERT INTO tb_procedimentos (
    id_procedimento,
    id_clinica,
    nm_procedimento,
    ds_procedimento,
    nr_duracao_minutos,
    vl_preco,
    ds_categoria,
    st_ativo
) VALUES
('11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Harmonização Facial', 'Preenchimento facial com ácido hialurônico', 90, 1500.00, 'facial', true),
('22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Aplicação de Botox', 'Toxina botulínica para rugas', 45, 800.00, 'facial', true),
('33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'Drenagem Linfática', 'Massagem para redução de inchaço', 60, 180.00, 'corporal', true),
('44444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'Limpeza de Pele', 'Tratamento facial profundo', 90, 250.00, 'facial', true),
('55555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 'Criolipolise', 'Redução de gordura localizada', 60, 1200.00, 'corporal', true),
('66666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'Peeling Químico', 'Renovação celular', 60, 450.00, 'facial', true),
('77777777-7777-7777-7777-777777777777', 'c3333333-3333-3333-3333-333333333333', 'Microagulhamento', 'Indução de colágeno', 75, 550.00, 'facial', true),
('88888888-8888-8888-8888-888888888888', 'c3333333-3333-3333-3333-333333333333', 'Radiofrequência', 'Tratamento para flacidez', 45, 380.00, 'corporal', true)
ON CONFLICT (id_procedimento) DO NOTHING;

-- =============================================
-- FIM DO SCRIPT
-- =============================================

-- Verificar dados inseridos
SELECT 'Empresas:', COUNT(*) FROM tb_empresas WHERE st_ativo = 'S';
SELECT 'Usuários:', COUNT(*) FROM tb_users WHERE st_ativo = 'S';
SELECT 'Clínicas:', COUNT(*) FROM tb_clinicas;
SELECT 'Profissionais:', COUNT(*) FROM tb_profissionais;
SELECT 'Pacientes:', COUNT(*) FROM tb_pacientes;
SELECT 'Procedimentos:', COUNT(*) FROM tb_procedimentos;

-- Mostrar alguns dados
SELECT nm_clinica, nm_cidade, nr_avaliacao_media FROM tb_clinicas ORDER BY nm_clinica;
SELECT nm_profissional, ds_especialidades[1] as especialidade, nr_avaliacao_media FROM tb_profissionais ORDER BY nm_profissional;

COMMENT ON TABLE tb_clinicas IS 'Dados MOCK inseridos em 2025-10-27 para testes e desenvolvimento';
