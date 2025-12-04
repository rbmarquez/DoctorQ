-- ============================================================================
-- Migration 019: Partner Lead Questions System
-- ============================================================================
-- Descrição: Cria tabela para gerenciar perguntas dinâmicas de leads
-- Data: 2025-01-19
-- Autor: Claude Code
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Criar tabela de perguntas para leads
-- ============================================================================

CREATE TABLE IF NOT EXISTS tb_partner_lead_questions (
    id_question UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tp_partner VARCHAR(32) NOT NULL CHECK (tp_partner IN ('paciente', 'profissional', 'clinica', 'fornecedor')),
    nm_question VARCHAR(500) NOT NULL,
    tp_input VARCHAR(32) NOT NULL CHECK (tp_input IN ('text', 'textarea', 'select', 'radio', 'checkbox', 'number', 'email', 'tel', 'date')),
    ds_options JSONB DEFAULT NULL, -- Para select/radio/checkbox: {"options": ["Opção 1", "Opção 2"]}
    ds_placeholder VARCHAR(255) DEFAULT NULL,
    ds_help_text TEXT DEFAULT NULL,
    nr_order INTEGER NOT NULL DEFAULT 0,
    st_required BOOLEAN NOT NULL DEFAULT false,
    st_active BOOLEAN NOT NULL DEFAULT true,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP DEFAULT NULL
);

-- ============================================================================
-- 2. Criar índices para otimização de queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_partner_lead_questions_tp_partner
    ON tb_partner_lead_questions(tp_partner);

CREATE INDEX IF NOT EXISTS idx_partner_lead_questions_active
    ON tb_partner_lead_questions(st_active);

CREATE INDEX IF NOT EXISTS idx_partner_lead_questions_order
    ON tb_partner_lead_questions(tp_partner, nr_order);

-- ============================================================================
-- 3. Trigger para atualizar dt_atualizacao
-- ============================================================================

CREATE OR REPLACE FUNCTION update_partner_lead_questions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_lead_questions_timestamp
    BEFORE UPDATE ON tb_partner_lead_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_lead_questions_timestamp();

-- ============================================================================
-- 4. Inserir perguntas de exemplo para PACIENTES
-- ============================================================================

INSERT INTO tb_partner_lead_questions (tp_partner, nm_question, tp_input, ds_placeholder, nr_order, st_required, st_active) VALUES
('paciente', 'Qual procedimento estético você procura?', 'select', NULL, 1, true, true),
('paciente', 'Qual a sua faixa etária?', 'select', NULL, 2, true, true),
('paciente', 'Qual o seu orçamento estimado para o procedimento?', 'select', NULL, 3, false, true),
('paciente', 'Em qual região você prefere realizar o procedimento?', 'text', 'Ex: Zona Sul, Centro, etc.', 4, false, true),
('paciente', 'Você já realizou este procedimento anteriormente?', 'radio', NULL, 5, false, true),
('paciente', 'Possui alguma alergia ou condição médica relevante?', 'textarea', 'Descreva brevemente...', 6, false, true),
('paciente', 'Como conheceu a DoctorQ?', 'select', NULL, 7, false, true);

-- Atualizar ds_options para perguntas com opções
UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Botox",
    "Preenchimento labial",
    "Harmonização facial",
    "Peeling",
    "Limpeza de pele",
    "Microagulhamento",
    "Depilação a laser",
    "Tratamento de manchas",
    "Lifting facial",
    "Bichectomia",
    "Outro"
  ]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%procedimento estético%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "18-25 anos",
    "26-35 anos",
    "36-45 anos",
    "46-55 anos",
    "56-65 anos",
    "Acima de 65 anos"
  ]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%faixa etária%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Até R$ 500",
    "R$ 500 - R$ 1.000",
    "R$ 1.000 - R$ 2.000",
    "R$ 2.000 - R$ 5.000",
    "R$ 5.000 - R$ 10.000",
    "Acima de R$ 10.000",
    "Prefiro não informar"
  ]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%orçamento%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim", "Não", "Não sei"]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%realizou este procedimento%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Google/Busca online",
    "Redes sociais (Instagram/Facebook)",
    "Indicação de amigo/familiar",
    "Anúncio online",
    "Outro"
  ]
}'::jsonb
WHERE tp_partner = 'paciente' AND nm_question LIKE '%Como conheceu%';

-- ============================================================================
-- 5. Inserir perguntas de exemplo para PROFISSIONAIS
-- ============================================================================

INSERT INTO tb_partner_lead_questions (tp_partner, nm_question, tp_input, ds_placeholder, nr_order, st_required, st_active) VALUES
('profissional', 'Qual a sua especialidade principal?', 'select', NULL, 1, true, true),
('profissional', 'Quanto tempo de experiência você possui?', 'select', NULL, 2, true, true),
('profissional', 'Você possui registro profissional ativo (CRM, CRF, etc.)?', 'radio', NULL, 3, true, true),
('profissional', 'Número do registro profissional', 'text', 'Ex: CRM 123456/SP', 4, true, true),
('profissional', 'Você atualmente trabalha em alguma clínica?', 'radio', NULL, 5, false, true),
('profissional', 'Quantos atendimentos você realiza por mês aproximadamente?', 'select', NULL, 6, false, true),
('profissional', 'Quais procedimentos você realiza?', 'textarea', 'Liste os principais procedimentos...', 7, true, true),
('profissional', 'Você tem interesse em receber pacientes através da plataforma?', 'radio', NULL, 8, true, true);

-- Atualizar ds_options para profissionais
UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Dermatologia",
    "Biomedicina Estética",
    "Enfermagem Estética",
    "Farmácia Estética",
    "Fisioterapia Dermato-Funcional",
    "Odontologia Estética",
    "Nutrição Estética",
    "Esteticista",
    "Outra"
  ]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%especialidade principal%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Menos de 1 ano",
    "1-3 anos",
    "3-5 anos",
    "5-10 anos",
    "Mais de 10 anos"
  ]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%tempo de experiência%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim", "Não", "Em processo"]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%registro profissional ativo%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim", "Não", "Trabalho em consultório próprio"]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%trabalha em alguma clínica%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Menos de 10",
    "10-30",
    "30-50",
    "50-100",
    "Mais de 100"
  ]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%atendimentos você realiza%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim, com certeza", "Talvez", "Não tenho interesse no momento"]
}'::jsonb
WHERE tp_partner = 'profissional' AND nm_question LIKE '%interesse em receber pacientes%';

-- ============================================================================
-- 6. Inserir perguntas de exemplo para CLÍNICAS
-- ============================================================================

INSERT INTO tb_partner_lead_questions (tp_partner, nm_question, tp_input, ds_placeholder, nr_order, st_required, st_active) VALUES
('clinica', 'Nome da clínica', 'text', 'Ex: Clínica Beauty Care', 1, true, true),
('clinica', 'CNPJ', 'text', '00.000.000/0000-00', 2, true, true),
('clinica', 'Endereço completo', 'textarea', 'Rua, número, bairro, cidade, estado', 3, true, true),
('clinica', 'Quantos profissionais atuam na clínica?', 'select', NULL, 4, true, true),
('clinica', 'A clínica possui Alvará Sanitário?', 'radio', NULL, 5, true, true),
('clinica', 'Quais especialidades a clínica oferece?', 'textarea', 'Liste as especialidades...', 6, true, true),
('clinica', 'Quais procedimentos são realizados?', 'textarea', 'Liste os principais procedimentos...', 7, true, true),
('clinica', 'A clínica já utiliza algum sistema de gestão?', 'select', NULL, 8, false, true),
('clinica', 'Qual o volume médio de atendimentos mensais?', 'select', NULL, 9, false, true),
('clinica', 'Possui interesse em vender produtos através do marketplace?', 'radio', NULL, 10, false, true);

-- Atualizar ds_options para clínicas
UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "1-3 profissionais",
    "4-7 profissionais",
    "8-15 profissionais",
    "16-30 profissionais",
    "Mais de 30 profissionais"
  ]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%profissionais atuam%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim", "Não", "Em processo de obtenção"]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%Alvará Sanitário%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Não utilizo",
    "Planilhas/Excel",
    "Sistema próprio/desenvolvido",
    "Software comercial (Clinicorp, Ninsaúde, etc.)",
    "Outro"
  ]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%sistema de gestão%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Até 50 atendimentos",
    "51-100 atendimentos",
    "101-200 atendimentos",
    "201-500 atendimentos",
    "Mais de 500 atendimentos"
  ]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%volume médio de atendimentos%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim", "Não", "Talvez futuramente"]
}'::jsonb
WHERE tp_partner = 'clinica' AND nm_question LIKE '%vender produtos%';

-- ============================================================================
-- 7. Inserir perguntas de exemplo para FORNECEDORES
-- ============================================================================

INSERT INTO tb_partner_lead_questions (tp_partner, nm_question, tp_input, ds_placeholder, nr_order, st_required, st_active) VALUES
('fornecedor', 'Nome da empresa', 'text', 'Ex: Distribuidora XYZ Ltda', 1, true, true),
('fornecedor', 'CNPJ', 'text', '00.000.000/0000-00', 2, true, true),
('fornecedor', 'Endereço completo (sede)', 'textarea', 'Rua, número, bairro, cidade, estado', 3, true, true),
('fornecedor', 'Qual o tipo de produtos que fornece?', 'select', NULL, 4, true, true),
('fornecedor', 'É fabricante, distribuidor ou revendedor?', 'radio', NULL, 5, true, true),
('fornecedor', 'Quais marcas você representa/distribui?', 'textarea', 'Liste as principais marcas...', 6, true, true),
('fornecedor', 'Possui Autorização de Funcionamento (AFE) da Anvisa?', 'radio', NULL, 7, true, true),
('fornecedor', 'Trabalha com quais regiões de entrega?', 'textarea', 'Ex: São Paulo capital e grande SP...', 8, true, true),
('fornecedor', 'Qual o prazo médio de entrega?', 'select', NULL, 9, true, true),
('fornecedor', 'Qual o ticket médio de pedidos?', 'select', NULL, 10, false, true),
('fornecedor', 'Oferece suporte técnico para os produtos?', 'radio', NULL, 11, false, true);

-- Atualizar ds_options para fornecedores
UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Dermocosméticos",
    "Equipamentos estéticos",
    "Insumos e consumíveis",
    "Produtos para procedimentos invasivos",
    "Suplementos e nutracêuticos",
    "Mobiliário para clínicas",
    "Outro"
  ]
}'::jsonb
WHERE tp_partner = 'fornecedor' AND nm_question LIKE '%tipo de produtos%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Fabricante", "Distribuidor autorizado", "Revendedor"]
}'::jsonb
WHERE tp_partner = 'fornecedor' AND nm_question LIKE '%fabricante, distribuidor ou revendedor%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim", "Não", "Em processo de obtenção"]
}'::jsonb
WHERE tp_partner = 'fornecedor' AND nm_question LIKE '%Autorização de Funcionamento%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "24-48 horas",
    "3-5 dias úteis",
    "7-10 dias úteis",
    "Mais de 10 dias úteis",
    "Varia por região"
  ]
}'::jsonb
WHERE tp_partner = 'fornecedor' AND nm_question LIKE '%prazo médio de entrega%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": [
    "Até R$ 500",
    "R$ 500 - R$ 1.500",
    "R$ 1.500 - R$ 5.000",
    "R$ 5.000 - R$ 15.000",
    "Acima de R$ 15.000"
  ]
}'::jsonb
WHERE tp_partner = 'fornecedor' AND nm_question LIKE '%ticket médio%';

UPDATE tb_partner_lead_questions SET ds_options = '{
  "options": ["Sim", "Não", "Apenas para alguns produtos"]
}'::jsonb
WHERE tp_partner = 'fornecedor' AND nm_question LIKE '%suporte técnico%';

-- ============================================================================
-- 8. Comentários na tabela
-- ============================================================================

COMMENT ON TABLE tb_partner_lead_questions IS 'Gerenciamento de perguntas dinâmicas para leads de parceiros';
COMMENT ON COLUMN tb_partner_lead_questions.id_question IS 'ID único da pergunta';
COMMENT ON COLUMN tb_partner_lead_questions.tp_partner IS 'Tipo de parceiro: paciente, profissional, clinica, fornecedor';
COMMENT ON COLUMN tb_partner_lead_questions.nm_question IS 'Texto da pergunta';
COMMENT ON COLUMN tb_partner_lead_questions.tp_input IS 'Tipo de input: text, textarea, select, radio, checkbox, number, email, tel, date';
COMMENT ON COLUMN tb_partner_lead_questions.ds_options IS 'Opções para select/radio/checkbox em formato JSONB';
COMMENT ON COLUMN tb_partner_lead_questions.ds_placeholder IS 'Texto de placeholder para o input';
COMMENT ON COLUMN tb_partner_lead_questions.ds_help_text IS 'Texto de ajuda/dica para a pergunta';
COMMENT ON COLUMN tb_partner_lead_questions.nr_order IS 'Ordem de exibição da pergunta';
COMMENT ON COLUMN tb_partner_lead_questions.st_required IS 'Se a pergunta é obrigatória';
COMMENT ON COLUMN tb_partner_lead_questions.st_active IS 'Se a pergunta está ativa';

COMMIT;

-- ============================================================================
-- Verificação final
-- ============================================================================

-- Verificar total de perguntas inseridas
SELECT tp_partner, COUNT(*) as total_perguntas
FROM tb_partner_lead_questions
GROUP BY tp_partner
ORDER BY tp_partner;

-- Exemplo de consulta para buscar perguntas ativas de um tipo
-- SELECT * FROM tb_partner_lead_questions
-- WHERE tp_partner = 'paciente' AND st_active = true
-- ORDER BY nr_order;
