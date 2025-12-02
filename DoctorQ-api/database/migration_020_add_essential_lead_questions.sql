-- ============================================================================
-- Migration 020: Adicionar Perguntas Essenciais de Leads
-- ============================================================================
-- Descrição: Adiciona perguntas estratégicas para melhor qualificação de leads
-- Data: 2025-01-19
-- Autor: Claude Code
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADICIONAR PERGUNTAS ESSENCIAIS PARA PACIENTES
-- ============================================================================

INSERT INTO tb_partner_lead_questions (tp_partner, nm_question, tp_input, ds_placeholder, nr_order, st_required, st_active) VALUES
-- Idade e sexo
('paciente', 'Qual a sua idade?', 'number', 'Ex: 35', 10, true, true),
('paciente', 'Qual o seu sexo?', 'radio', NULL, 11, true, true),

-- O que incomoda
('paciente', 'O que mais te incomoda?', 'radio', NULL, 12, true, true),

-- Prioridade
('paciente', 'Qual a sua prioridade de tratamento?', 'select', NULL, 13, true, true),

-- Experiência anterior (já existe similar, vou adicionar versão mais específica)
('paciente', 'Já realizou procedimentos estéticos anteriormente?', 'radio', NULL, 14, true, true),

-- Investimento anual
('paciente', 'Quanto você investe anualmente em estética?', 'select', NULL, 15, true, true),

-- O que valoriza
('paciente', 'O que você mais valoriza ao escolher um profissional?', 'select', NULL, 16, true, true);

-- Atualizar ds_options
UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Masculino", "Feminino", "Prefiro não informar"]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%Qual o seu sexo%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Facial (rosto, pescoço)", "Corporal (corpo, silhueta)", "Ambos"]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%O que mais te incomoda%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Rosto (rugas, manchas, flacidez)",
    "Corpo (gordura localizada, celulite)",
    "Pele (acne, cicatrizes, rejuvenescimento)",
    "Cabelo e couro cabeludo",
    "Procedimento específico"
  ]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%prioridade de tratamento%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim, várias vezes", "Sim, poucas vezes", "Não, será minha primeira vez"]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%Já realizou procedimentos estéticos anteriormente%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Até R$ 1.500",
    "R$ 1.500 - R$ 3.000",
    "R$ 3.000 - R$ 5.000",
    "R$ 5.000 - R$ 10.000",
    "Acima de R$ 10.000"
  ]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%investe anualmente%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Preço competitivo",
    "Segurança e certificações",
    "Qualidade dos resultados",
    "Credenciais e experiência do profissional",
    "Tecnologia e equipamentos modernos",
    "Localização e conveniência"
  ]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%o que você mais valoriza%';

-- ============================================================================
-- 2. ADICIONAR PERGUNTAS ESSENCIAIS PARA PROFISSIONAIS
-- ============================================================================

INSERT INTO tb_partner_lead_questions (tp_partner, nm_question, tp_input, ds_placeholder, nr_order, st_required, st_active) VALUES
-- Faixa etária do paciente ideal
('profissional', 'Qual a faixa etária do seu paciente ideal?', 'select', NULL, 20, true, true),

-- Gênero preferencial
('profissional', 'Você atende preferencialmente qual gênero?', 'radio', NULL, 21, false, true),

-- Localização atendida
('profissional', 'Quais bairros/regiões você atende?', 'textarea', 'Liste os principais bairros ou regiões...', 22, true, true),

-- Especialidades
('profissional', 'Quais são suas principais especialidades?', 'checkbox', NULL, 23, true, true),

-- Perfil econômico - Ticket médio
('profissional', 'Qual o ticket médio dos seus atendimentos?', 'select', NULL, 24, false, true),

-- Posicionamento
('profissional', 'Como você posiciona seus serviços?', 'radio', NULL, 25, true, true);

-- Atualizar ds_options
UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["25-35 anos", "35-50 anos", "Acima de 50 anos", "Todas as idades"]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%faixa etária do seu paciente ideal%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Feminino", "Masculino", "Ambos"]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%atende preferencialmente qual gênero%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Procedimentos faciais (toxina botulínica, preenchimento)",
    "Tratamentos corporais (criolipólise, radiofrequência)",
    "Tecnologias avançadas (laser, ultrassom microfocado)",
    "Harmonização facial",
    "Tratamentos de pele (peeling, microagulhamento)",
    "Depilação a laser",
    "Estética capilar"
  ]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%principais especialidades%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Até R$ 300",
    "R$ 300 - R$ 600",
    "R$ 600 - R$ 1.200",
    "R$ 1.200 - R$ 2.500",
    "Acima de R$ 2.500"
  ]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%ticket médio%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Preço competitivo (acessível)",
    "Qualidade premium (alto padrão)",
    "Segurança e certificações",
    "Inovação e tecnologia"
  ]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%Como você posiciona seus serviços%';

-- ============================================================================
-- 3. ADICIONAR PERGUNTAS ESSENCIAIS PARA CLÍNICAS
-- ============================================================================

INSERT INTO tb_partner_lead_questions (tp_partner, nm_question, tp_input, ds_placeholder, nr_order, st_required, st_active) VALUES
-- Faixa etária do paciente ideal
('clinica', 'Qual a faixa etária predominante dos seus pacientes?', 'select', NULL, 20, true, true),

-- Gênero atendido
('clinica', 'A clínica atende preferencialmente qual público?', 'radio', NULL, 21, false, true),

-- Bairros/regiões
('clinica', 'Quais bairros/regiões a clínica atende?', 'textarea', 'Liste os principais...', 22, true, true),

-- Especialidades da clínica
('clinica', 'Quais especialidades a clínica oferece?', 'checkbox', NULL, 23, true, true),

-- Ticket médio
('clinica', 'Qual o ticket médio dos procedimentos da clínica?', 'select', NULL, 24, false, true),

-- Posicionamento
('clinica', 'Como a clínica se posiciona no mercado?', 'radio', NULL, 25, true, true);

-- Atualizar ds_options
UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["25-35 anos", "35-50 anos", "Acima de 50 anos", "Público diverso"]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%faixa etária predominante%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Público feminino", "Público masculino", "Ambos os públicos"]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%atende preferencialmente qual público%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Procedimentos faciais (toxina, preenchimento, fios)",
    "Tratamentos corporais (criolipólise, lipo sem corte)",
    "Tecnologias avançadas (laser, HIFU, radiofrequência)",
    "Harmonização facial completa",
    "Dermatologia estética",
    "Medicina estética avançada",
    "Cirurgia plástica"
  ]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%especialidades a clínica oferece%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Até R$ 500",
    "R$ 500 - R$ 1.000",
    "R$ 1.000 - R$ 2.500",
    "R$ 2.500 - R$ 5.000",
    "Acima de R$ 5.000"
  ]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%ticket médio dos procedimentos%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Preço acessível e competitivo",
    "Qualidade premium e excelência",
    "Segurança e credenciais",
    "Inovação e tecnologia de ponta"
  ]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%Como a clínica se posiciona%';

COMMIT;

-- ============================================================================
-- Verificação final
-- ============================================================================

-- Contar perguntas por tipo de parceiro
SELECT tp_partner, COUNT(*) as total_perguntas
FROM tb_partner_lead_questions
GROUP BY tp_partner
ORDER BY tp_partner;

-- Mostrar as novas perguntas adicionadas
SELECT tp_partner, nm_question, tp_input, st_required
FROM tb_partner_lead_questions
WHERE nr_order >= 10
ORDER BY tp_partner, nr_order;
