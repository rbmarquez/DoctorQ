-- ====================================================================
-- SEED MARKETPLACE MOCK DATA FOR INOVAIA
-- ====================================================================
-- Populates: tb_tools, tb_agente_tools, tb_templates,
--            tb_template_installations, tb_template_reviews,
--            tb_instalacoes_marketplace
-- ====================================================================

-- ====================================================================
-- 1. TOOLS (Ferramentas) - Create additional tools
-- ====================================================================

INSERT INTO tb_tools (
    id_tool,
    nm_tool,
    ds_tool,
    ds_tipo,
    js_schema,
    dt_criacao
) VALUES
-- Tool 2: Web Search
(
    '22222222-2222-2222-2222-222222222222',
    'WebSearch',
    'Busca informações na internet em tempo real usando APIs de busca',
    'api',
    '{"name": "WebSearch", "description": "Busca web", "parameters": {"type": "object", "properties": {"query": {"type": "string", "description": "Termo de busca"}}, "required": ["query"]}}'::jsonb,
    NOW() - INTERVAL '30 days'
),

-- Tool 3: Database Query
(
    '33333333-3333-3333-3333-333333333333',
    'DatabaseQuery',
    'Executa consultas SQL em bancos de dados configurados',
    'database',
    '{"name": "DatabaseQuery", "description": "Query database", "parameters": {"type": "object", "properties": {"query": {"type": "string", "description": "SQL query"}, "database": {"type": "string", "description": "Database name"}}, "required": ["query"]}}'::jsonb,
    NOW() - INTERVAL '25 days'
),

-- Tool 4: Document Analyzer
(
    '44444444-4444-4444-4444-444444444444',
    'DocumentAnalyzer',
    'Analisa documentos (PDF, Word, Excel) e extrai informações relevantes',
    'file',
    '{"name": "DocumentAnalyzer", "description": "Analyze documents", "parameters": {"type": "object", "properties": {"file_path": {"type": "string", "description": "Path to document"}, "analysis_type": {"type": "string", "enum": ["summary", "entities", "keywords"]}}, "required": ["file_path"]}}'::jsonb,
    NOW() - INTERVAL '20 days'
),

-- Tool 5: Email Sender
(
    '55555555-5555-5555-5555-555555555555',
    'EmailSender',
    'Envia emails automaticamente com templates personalizados',
    'communication',
    '{"name": "EmailSender", "description": "Send email", "parameters": {"type": "object", "properties": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}}, "required": ["to", "subject", "body"]}}'::jsonb,
    NOW() - INTERVAL '15 days'
),

-- Tool 6: Calendar Integration
(
    '66666666-6666-6666-6666-666666666666',
    'CalendarIntegration',
    'Integração com Google Calendar e Outlook para gerenciamento de agenda',
    'api',
    '{"name": "CalendarIntegration", "description": "Manage calendar", "parameters": {"type": "object", "properties": {"action": {"type": "string", "enum": ["create", "update", "delete", "list"]}, "event_data": {"type": "object"}}, "required": ["action"]}}'::jsonb,
    NOW() - INTERVAL '10 days'
),

-- Tool 7: Code Executor
(
    '77777777-7777-7777-7777-777777777777',
    'CodeExecutor',
    'Executa código Python de forma segura em sandbox',
    'code',
    '{"name": "CodeExecutor", "description": "Execute Python code", "parameters": {"type": "object", "properties": {"code": {"type": "string", "description": "Python code to execute"}, "timeout": {"type": "number", "default": 30}}, "required": ["code"]}}'::jsonb,
    NOW() - INTERVAL '5 days'
);

-- ====================================================================
-- 2. AGENTE_TOOLS (Relação Agentes-Tools) - 15 records
-- ====================================================================

INSERT INTO tb_agente_tools (
    id_agente_tool,
    id_agente,
    id_tool,
    dt_criacao
) VALUES
-- InovaIA agent (9eb7cf6c...) with multiple tools
('11111111-1111-1111-1111-111111111111', '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', '8ad2699c-465a-4dc7-9ce9-817a97066f1f', NOW() - INTERVAL '20 days'),
('11211111-1111-1111-1111-111111111111', '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '15 days'),
('11311111-1111-1111-1111-111111111111', '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '10 days'),

-- Assistente de contratação (73a148b6...) with business tools
('22222222-2222-2222-2222-222222222222', '73a148b6-42a7-423f-b05b-a0d64cc56322', '8ad2699c-465a-4dc7-9ce9-817a97066f1f', NOW() - INTERVAL '18 days'),
('22322222-2222-2222-2222-222222222222', '73a148b6-42a7-423f-b05b-a0d64cc56322', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '18 days'),
('22422222-2222-2222-2222-222222222222', '73a148b6-42a7-423f-b05b-a0d64cc56322', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '18 days'),
('22522222-2222-2222-2222-222222222222', '73a148b6-42a7-423f-b05b-a0d64cc56322', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '18 days'),

-- Assistente de contratação 1 (455fbe40...) similar tools
('33333333-3333-3333-3333-333333333333', '455fbe40-84f2-4104-8c12-bfe918ac9462', '8ad2699c-465a-4dc7-9ce9-817a97066f1f', NOW() - INTERVAL '17 days'),
('33433333-3333-3333-3333-333333333333', '455fbe40-84f2-4104-8c12-bfe918ac9462', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '17 days'),
('33533333-3333-3333-3333-333333333333', '455fbe40-84f2-4104-8c12-bfe918ac9462', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '17 days'),

-- Teste com Ferramentas (07133dd6...) with code and automation tools
('44444444-4444-4444-4444-444444444444', '07133dd6-d037-48a6-8cad-98bf3b90aab0', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '12 days'),
('44544444-4444-4444-4444-444444444444', '07133dd6-d037-48a6-8cad-98bf3b90aab0', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '12 days'),
('44644444-4444-4444-4444-444444444444', '07133dd6-d037-48a6-8cad-98bf3b90aab0', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '12 days'),

-- Teste Estrutura (de355852...) with document tools
('55555555-5555-5555-5555-555555555555', 'de355852-c1dd-43ee-9709-ae042369aafb', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '8 days'),
('55655555-5555-5555-5555-555555555555', 'de355852-c1dd-43ee-9709-ae042369aafb', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '8 days');

-- ====================================================================
-- 3. TEMPLATES (Agent Templates) - 8 records
-- ====================================================================

INSERT INTO tb_templates (
    id_template,
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    id_user_creator,
    id_empresa_creator,
    js_agent_config,
    ds_tags,
    ds_metadata,
    nm_version,
    nr_install_count,
    nr_rating_avg,
    nr_rating_count,
    ds_image_url,
    ds_icon_url,
    dt_criacao,
    dt_publicacao
) VALUES
-- Template 1: Customer Support Agent
(
    '11111111-1111-1111-1111-111111111111',
    'Agente de Suporte ao Cliente 24/7',
    'Agente especializado em atendimento ao cliente, capaz de responder dúvidas frequentes, criar tickets de suporte e escalar problemas complexos para humanos. Ideal para empresas que buscam automatizar primeiro nível de suporte.',
    'customer_service',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.7, "max_tokens": 2000, "system_prompt": "Você é um agente de suporte ao cliente amigável e prestativo. Responda de forma clara e objetiva.", "tools": ["WebSearch", "EmailSender"], "features": {"multi_language": true, "ticket_creation": true, "escalation": true}}'::jsonb,
    '["atendimento", "suporte", "FAQ", "ticket"]'::jsonb,
    '{"author": "InovaIA Team", "license": "MIT", "documentation": "https://docs.inovaia.com/templates/customer-support"}'::jsonb,
    '2.1.0',
    156,
    4.7,
    42,
    '/templates/customer-support.jpg',
    '/icons/customer-support.svg',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '120 days'
),

-- Template 2: Sales Assistant
(
    '22222222-2222-2222-2222-222222222222',
    'Assistente de Vendas Inteligente',
    'Agente focado em qualificação de leads, agendamento de reuniões e follow-up automático. Integra com CRM e calendar para gerenciamento completo do pipeline de vendas.',
    'sales',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.8, "max_tokens": 1500, "system_prompt": "Você é um assistente de vendas experiente. Foque em entender as necessidades do cliente e qualificar leads.", "tools": ["CalendarIntegration", "EmailSender", "DatabaseQuery"], "features": {"lead_scoring": true, "meeting_scheduler": true, "crm_integration": true}}'::jsonb,
    '["vendas", "CRM", "qualificação", "agendamento"]'::jsonb,
    '{"author": "InovaIA Team", "license": "Commercial", "pricing": "Pro", "documentation": "https://docs.inovaia.com/templates/sales-assistant"}'::jsonb,
    '1.5.2',
    89,
    4.5,
    28,
    '/templates/sales-assistant.jpg',
    '/icons/sales.svg',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
),

-- Template 3: HR Recruiter
(
    '33333333-3333-3333-3333-333333333333',
    'Recrutador de RH Automatizado',
    'Triagem de currículos, agendamento de entrevistas e comunicação com candidatos. Integra com principais plataformas de RH (LinkedIn, Indeed, Gupy).',
    'hr',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.6, "max_tokens": 2000, "system_prompt": "Você é um recrutador experiente. Analise currículos objetivamente e faça perguntas relevantes para avaliar fit cultural.", "tools": ["DocumentAnalyzer", "EmailSender", "CalendarIntegration"], "features": {"resume_parsing": true, "interview_scheduling": true, "candidate_scoring": true}}'::jsonb,
    '["RH", "recrutamento", "currículos", "entrevistas"]'::jsonb,
    '{"author": "InovaIA Team", "license": "Commercial", "pricing": "Enterprise", "documentation": "https://docs.inovaia.com/templates/hr-recruiter"}'::jsonb,
    '1.8.0',
    67,
    4.8,
    19,
    '/templates/hr-recruiter.jpg',
    '/icons/hr.svg',
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '75 days'
),

-- Template 4: Marketing Content Creator
(
    '44444444-4444-4444-4444-444444444444',
    'Criador de Conteúdo Marketing',
    'Gera posts para redes sociais, emails marketing e copy para anúncios. Mantém consistência de voz da marca e otimiza para SEO.',
    'marketing',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.9, "max_tokens": 3000, "system_prompt": "Você é um copywriter criativo. Crie conteúdo engajador mantendo o tom da marca.", "tools": ["WebSearch", "DocumentAnalyzer"], "features": {"seo_optimization": true, "multi_platform": true, "a_b_testing": true}}'::jsonb,
    '["marketing", "conteúdo", "copywriting", "SEO"]'::jsonb,
    '{"author": "InovaIA Team", "license": "MIT", "documentation": "https://docs.inovaia.com/templates/content-creator"}'::jsonb,
    '2.0.1',
    134,
    4.6,
    38,
    '/templates/content-creator.jpg',
    '/icons/marketing.svg',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
),

-- Template 5: Data Analyst
(
    '55555555-5555-5555-5555-555555555555',
    'Analista de Dados BI',
    'Executa queries em bancos de dados, gera relatórios e visualizações. Responde perguntas sobre dados em linguagem natural.',
    'analytics',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.3, "max_tokens": 2000, "system_prompt": "Você é um analista de dados especializado. Interprete dados e gere insights acionáveis.", "tools": ["DatabaseQuery", "CodeExecutor"], "features": {"sql_generation": true, "data_visualization": true, "predictive_analytics": false}}'::jsonb,
    '["análise", "dados", "BI", "relatórios", "SQL"]'::jsonb,
    '{"author": "InovaIA Team", "license": "Commercial", "pricing": "Pro", "documentation": "https://docs.inovaia.com/templates/data-analyst"}'::jsonb,
    '1.3.5',
    78,
    4.4,
    22,
    '/templates/data-analyst.jpg',
    '/icons/analytics.svg',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '45 days'
),

-- Template 6: Legal Document Reviewer
(
    '66666666-6666-6666-6666-666666666666',
    'Revisor de Documentos Jurídicos',
    'Analisa contratos, identifica cláusulas críticas e sugere melhorias. Mantém compliance com legislação brasileira.',
    'legal',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.2, "max_tokens": 4000, "system_prompt": "Você é um assistente jurídico especializado em contratos. Analise documentos com rigor e atenção a detalhes.", "tools": ["DocumentAnalyzer", "DatabaseQuery"], "features": {"clause_detection": true, "risk_assessment": true, "compliance_check": true}}'::jsonb,
    '["jurídico", "contratos", "compliance", "revisão"]'::jsonb,
    '{"author": "InovaIA Team", "license": "Commercial", "pricing": "Enterprise", "documentation": "https://docs.inovaia.com/templates/legal-reviewer"}'::jsonb,
    '1.2.0',
    45,
    4.9,
    12,
    '/templates/legal-reviewer.jpg',
    '/icons/legal.svg',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
),

-- Template 7: Financial Advisor
(
    '77777777-7777-7777-7777-777777777777',
    'Consultor Financeiro Pessoal',
    'Análise de gastos, sugestões de investimentos e planejamento financeiro personalizado.',
    'finance',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.5, "max_tokens": 2000, "system_prompt": "Você é um consultor financeiro. Ajude com planejamento financeiro de forma educativa e responsável.", "tools": ["DatabaseQuery", "CodeExecutor", "WebSearch"], "features": {"expense_tracking": true, "investment_recommendations": true, "tax_planning": false}}'::jsonb,
    '["finanças", "investimentos", "planejamento", "orçamento"]'::jsonb,
    '{"author": "InovaIA Team", "license": "MIT", "documentation": "https://docs.inovaia.com/templates/financial-advisor"}'::jsonb,
    '1.0.8',
    92,
    4.3,
    27,
    '/templates/financial-advisor.jpg',
    '/icons/finance.svg',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
),

-- Template 8: Teacher Assistant (Education)
(
    '88888888-8888-8888-8888-888888888888',
    'Assistente de Ensino Personalizado',
    'Auxilia estudantes com dúvidas, cria exercícios personalizados e acompanha progresso de aprendizado.',
    'education',
    'published',
    'public',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    '00000000-0000-0000-0000-000000000001',
    '{"model": "gpt-4", "temperature": 0.7, "max_tokens": 2500, "system_prompt": "Você é um professor paciente e didático. Explique conceitos de forma clara e adapte ao nível do aluno.", "tools": ["WebSearch", "CodeExecutor", "DocumentAnalyzer"], "features": {"adaptive_learning": true, "exercise_generation": true, "progress_tracking": true}}'::jsonb,
    '["educação", "ensino", "tutoria", "exercícios"]'::jsonb,
    '{"author": "InovaIA Team", "license": "MIT", "documentation": "https://docs.inovaia.com/templates/teacher-assistant"}'::jsonb,
    '1.1.2',
    203,
    4.8,
    67,
    '/templates/teacher-assistant.jpg',
    '/icons/education.svg',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
);

-- ====================================================================
-- 4. TEMPLATE_INSTALLATIONS (Instalações de Templates) - 25 records
-- ====================================================================

INSERT INTO tb_template_installations (
    id_installation,
    id_template,
    id_user,
    id_empresa,
    id_agente,
    js_customizations,
    bl_ativo,
    dt_instalacao
) VALUES
-- Template 1 (Customer Support) - 5 installations
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b', '{"company_name": "DoctorQ", "support_hours": "24/7", "languages": ["pt-BR", "en"]}'::jsonb, true, NOW() - INTERVAL '100 days'),
('11211111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"company_name": "Minha Empresa", "support_hours": "9-18"}'::jsonb, true, NOW() - INTERVAL '80 days'),
('11311111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"company_name": "Tech Solutions", "support_hours": "8-20"}'::jsonb, true, NOW() - INTERVAL '60 days'),
('11411111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', NULL, '{}'::jsonb, false, NOW() - INTERVAL '40 days'),
('11511111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', NULL, '{"company_name": "StartupX"}'::jsonb, true, NOW() - INTERVAL '20 days'),

-- Template 2 (Sales Assistant) - 4 installations
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"crm": "pipedrive", "auto_followup": true}'::jsonb, true, NOW() - INTERVAL '70 days'),
('22322222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', NULL, '{"crm": "salesforce"}'::jsonb, true, NOW() - INTERVAL '50 days'),
('22422222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', '00000000-0000-0000-0000-000000000001', '73a148b6-42a7-423f-b05b-a0d64cc56322', '{"crm": "hubspot", "lead_score_threshold": 7}'::jsonb, true, NOW() - INTERVAL '30 days'),
('22522222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{}'::jsonb, true, NOW() - INTERVAL '15 days'),

-- Template 4 (Marketing Content) - 6 installations
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "profissional", "platforms": ["Instagram", "LinkedIn"]}'::jsonb, true, NOW() - INTERVAL '55 days'),
('44544444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "casual", "platforms": ["Facebook", "Twitter"]}'::jsonb, true, NOW() - INTERVAL '45 days'),
('44644444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "amigável", "platforms": ["TikTok", "Instagram"]}'::jsonb, true, NOW() - INTERVAL '35 days'),
('44744444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "técnico"}'::jsonb, true, NOW() - INTERVAL '25 days'),
('44844444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "inspirador"}'::jsonb, true, NOW() - INTERVAL '12 days'),
('44944444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', NULL, '{"brand_voice": "educativo"}'::jsonb, false, NOW() - INTERVAL '5 days'),

-- Template 8 (Teacher Assistant) - 10 installations
('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Matemática", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '9 days'),
('88988888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Física", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '8 days'),
('88a88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Português", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '7 days'),
('88b88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Programação", "grade_level": "superior"}'::jsonb, true, NOW() - INTERVAL '6 days'),
('88c88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Inglês", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '5 days'),
('88d88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Química", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '4 days'),
('88e88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "História", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '3 days'),
('88f88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Biologia", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '2 days'),
('88g88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Geografia", "grade_level": "fundamental"}'::jsonb, true, NOW() - INTERVAL '1 day'),
('88h88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', NULL, '{"subject": "Espanhol", "grade_level": "médio"}'::jsonb, true, NOW() - INTERVAL '6 hours');

-- ====================================================================
-- 5. TEMPLATE_REVIEWS (Avaliações de Templates) - 15 records
-- ====================================================================

INSERT INTO tb_template_reviews (
    id_review,
    id_template,
    id_user,
    nr_rating,
    ds_title,
    ds_review,
    bl_verified_install,
    bl_aprovado,
    dt_criacao
) VALUES
-- Reviews for Template 1 (Customer Support)
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 5, 'Excelente para suporte!', 'Reduziu em 60% o volume de tickets de primeiro nível. A integração foi muito simples e o agente responde de forma natural. Recomendo!', true, true, NOW() - INTERVAL '95 days'),
('11211111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 4, 'Muito bom, mas precisa ajustes', 'Funciona bem mas às vezes precisa de treinamento adicional para perguntas específicas do negócio. Fora isso, é ótimo!', true, true, NOW() - INTERVAL '75 days'),
('11311111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 5, 'Transformou nosso atendimento', 'Clientes adoram a rapidez nas respostas. Economizamos muito com equipe de suporte.', true, true, NOW() - INTERVAL '55 days'),

-- Reviews for Template 2 (Sales Assistant)
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 5, 'Aumentou minhas vendas em 40%', 'A qualificação automática de leads é perfeita. Economizo horas por semana que antes gastava com follow-ups.', true, true, NOW() - INTERVAL '65 days'),
('22322222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 4, 'Muito útil para vendas B2B', 'Integração com CRM funciona perfeitamente. Só precisa melhorar a personalização de emails.', true, true, NOW() - INTERVAL '25 days'),

-- Reviews for Template 4 (Marketing Content)
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 5, 'Copywriter perfeito', 'Gera conteúdo de qualidade mantendo nossa identidade visual. Estou impressionado!', true, true, NOW() - INTERVAL '50 days'),
('44544444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 4, 'Bom, mas não substitui criativo humano', 'Útil para rascunhos e ideias iniciais. Para campanhas importantes ainda preferimos revisão humana.', true, true, NOW() - INTERVAL '40 days'),
('44644444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', 5, 'Acelera muito a produção de conteúdo', 'Triplicamos a produção de posts sem perder qualidade. Vale cada centavo!', true, true, NOW() - INTERVAL '30 days'),

-- Reviews for Template 8 (Teacher Assistant)
('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b1111111-1111-1111-1111-111111111111', 5, 'Meus alunos adoram!', 'Explica de forma didática e paciente. Meus alunos estão usando diariamente para tirar dúvidas.', true, true, NOW() - INTERVAL '8 days'),
('88988888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b2222222-2222-2222-2222-222222222222', 5, 'Revolucionou meu ensino', 'Consigo acompanhar o progresso individual de cada aluno de forma automática. Impressionante!', true, true, NOW() - INTERVAL '7 days'),
('88a88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b3333333-3333-3333-3333-333333333333', 4, 'Excelente ferramenta educacional', 'Muito bom para exercícios e dúvidas. Só falta integração com mais plataformas educacionais.', true, true, NOW() - INTERVAL '6 days'),
('88b88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', 5, 'Melhor assistente de ensino', 'Adapta o conteúdo ao nível do aluno automaticamente. Meus alunos melhoraram muito!', true, true, NOW() - INTERVAL '5 days'),
('88c88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b5555555-5555-5555-5555-555555555555', 5, 'Indispensável para professores', 'Economizo horas corrigindo exercícios. O agente dá feedback detalhado para cada aluno.', true, true, NOW() - INTERVAL '4 days'),
('88d88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b6666666-6666-6666-6666-666666666666', 5, 'Gamechanger na educação', 'Personalização de ensino que antes era impossível. Recomendo para todos os professores!', true, true, NOW() - INTERVAL '3 days'),
('88e88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3', 5, 'Perfeito para ensino híbrido', 'Facilita muito o ensino remoto e presencial. Alunos têm suporte 24/7.', true, true, NOW() - INTERVAL '2 days');

-- ====================================================================
-- 6. INSTALACOES_MARKETPLACE (Instalações do Marketplace) - 5 records
-- ====================================================================

INSERT INTO tb_instalacoes_marketplace (
    id_instalacao,
    id_marketplace_agente,
    id_agente_instalado,
    id_empresa,
    id_usuario_instalador,
    st_ativo,
    dt_instalacao
) VALUES
-- Installation 1: InovaIA agent installed by company
(
    '11111111-1111-1111-1111-111111111111',
    'ae7b8177-b255-4e4c-b1a4-c3c8a3554cea',
    '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b',
    '00000000-0000-0000-0000-000000000001',
    '3109ee4f-1e0b-40e3-8f89-ea62d7ea36f3',
    true,
    NOW() - INTERVAL '30 days'
),

-- Installation 2-5: More installations by different users
(
    '22222222-2222-2222-2222-222222222222',
    'ae7b8177-b255-4e4c-b1a4-c3c8a3554cea',
    '73a148b6-42a7-423f-b05b-a0d64cc56322',
    '00000000-0000-0000-0000-000000000001',
    'b1111111-1111-1111-1111-111111111111',
    true,
    NOW() - INTERVAL '25 days'
),
(
    '33333333-3333-3333-3333-333333333333',
    'ae7b8177-b255-4e4c-b1a4-c3c8a3554cea',
    '455fbe40-84f2-4104-8c12-bfe918ac9462',
    '00000000-0000-0000-0000-000000000001',
    'b2222222-2222-2222-2222-222222222222',
    true,
    NOW() - INTERVAL '20 days'
),
(
    '44444444-4444-4444-4444-444444444444',
    'ae7b8177-b255-4e4c-b1a4-c3c8a3554cea',
    '07133dd6-d037-48a6-8cad-98bf3b90aab0',
    '00000000-0000-0000-0000-000000000001',
    'b3333333-3333-3333-3333-333333333333',
    false,
    NOW() - INTERVAL '15 days'
),
(
    '55555555-5555-5555-5555-555555555555',
    'ae7b8177-b255-4e4c-b1a4-c3c8a3554cea',
    'de355852-c1dd-43ee-9709-ae042369aafb',
    '00000000-0000-0000-0000-000000000001',
    'b4444444-4444-4444-4444-444444444444',
    true,
    NOW() - INTERVAL '10 days'
);

-- ====================================================================
-- END OF MARKETPLACE SEED SCRIPT
-- ====================================================================
