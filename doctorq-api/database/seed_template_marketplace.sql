-- Seed Data: Template Marketplace
-- Data: 2025-10-21
-- Descrição: Dados iniciais para popular o marketplace de templates com exemplos

-- ============================================================================
-- LIMPAR DADOS EXISTENTES (OPCIONAL - COMENTADO)
-- ============================================================================

-- TRUNCATE TABLE tb_template_reviews CASCADE;
-- TRUNCATE TABLE tb_template_installations CASCADE;
-- TRUNCATE TABLE tb_templates CASCADE;

-- ============================================================================
-- TEMPLATES - CUSTOMER SERVICE
-- ============================================================================

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Atendimento ao Cliente 24/7',
    'Template otimizado para atendimento ao cliente com suporte multilíngue e integração com bases de conhecimento. Ideal para empresas que precisam de suporte constante.',
    'customer_service',
    'published',
    'public',
    '{
        "name": "Assistente de Atendimento",
        "system_prompt": "Você é um assistente de atendimento ao cliente amigável e prestativo. Seu objetivo é resolver dúvidas, fornecer informações sobre produtos/serviços e garantir a satisfação do cliente. Seja profissional, empático e objetivo nas respostas.",
        "model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 1500,
        "tools": ["web_search", "knowledge_base"],
        "settings": {
            "language": "pt-BR",
            "tone": "friendly",
            "response_style": "concise"
        }
    }'::jsonb,
    '["atendimento", "suporte", "cliente", "24/7", "multilíngue"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=customer-service'
) ON CONFLICT (nm_template) DO NOTHING;

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'FAQ Automático Inteligente',
    'Bot especializado em responder perguntas frequentes usando RAG. Aprende com a base de conhecimento da empresa e fornece respostas precisas e contextualizadas.',
    'customer_service',
    'published',
    'public',
    '{
        "name": "FAQ Bot",
        "system_prompt": "Você é um especialista em responder perguntas frequentes (FAQ). Use a base de conhecimento disponível para fornecer respostas precisas e detalhadas. Se não souber a resposta, seja honesto e sugira contato com um atendente humano.",
        "model": "gpt-3.5-turbo",
        "temperature": 0.3,
        "max_tokens": 1000,
        "tools": ["knowledge_base", "search_documents"],
        "settings": {
            "rag_enabled": true,
            "top_k_docs": 5,
            "min_similarity": 0.75
        }
    }'::jsonb,
    '["faq", "perguntas", "respostas", "rag", "knowledge-base"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=faq-bot'
) ON CONFLICT (nm_template) DO NOTHING;

-- ============================================================================
-- TEMPLATES - SALES
-- ============================================================================

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Assistente de Vendas B2B',
    'Agente especializado em vendas B2B. Qualifica leads, agenda reuniões e fornece informações sobre produtos. Integra-se com CRM e ferramentas de calendário.',
    'sales',
    'published',
    'public',
    '{
        "name": "Vendedor Virtual B2B",
        "system_prompt": "Você é um especialista em vendas B2B. Seu objetivo é qualificar leads, entender as necessidades dos clientes empresariais e apresentar soluções adequadas. Seja consultivo, faça perguntas inteligentes e foque em gerar valor para o cliente.",
        "model": "gpt-4",
        "temperature": 0.8,
        "max_tokens": 2000,
        "tools": ["crm_integration", "calendar_scheduling", "product_catalog"],
        "settings": {
            "lead_qualification": true,
            "meeting_scheduler": true,
            "follow_up_enabled": true
        }
    }'::jsonb,
    '["vendas", "b2b", "leads", "crm", "agendamento"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=sales-b2b'
) ON CONFLICT (nm_template) DO NOTHING;

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Consultor de Produtos E-commerce',
    'Bot de recomendação de produtos para e-commerce. Analisa preferências do cliente e sugere produtos personalizados. Aumenta taxa de conversão.',
    'sales',
    'published',
    'public',
    '{
        "name": "Consultor de Produtos",
        "system_prompt": "Você é um consultor de produtos experiente. Ajude os clientes a encontrar exatamente o que procuram fazendo perguntas sobre suas necessidades e preferências. Forneça recomendações personalizadas e destaque os benefícios de cada produto.",
        "model": "gpt-4",
        "temperature": 0.9,
        "max_tokens": 1500,
        "tools": ["product_search", "inventory_check", "price_comparison"],
        "settings": {
            "personalization": true,
            "cross_sell": true,
            "upsell": true
        }
    }'::jsonb,
    '["ecommerce", "recomendação", "produtos", "vendas", "personalização"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=ecommerce-consultant'
) ON CONFLICT (nm_template) DO NOTHING;

-- ============================================================================
-- TEMPLATES - HR (RECURSOS HUMANOS)
-- ============================================================================

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Recrutador Inteligente',
    'Assistente de RH para triagem de currículos, agendamento de entrevistas e comunicação com candidatos. Automatiza processos de recrutamento.',
    'hr',
    'published',
    'public',
    '{
        "name": "Recrutador Virtual",
        "system_prompt": "Você é um recrutador profissional e experiente. Sua função é avaliar candidatos, fazer perguntas relevantes sobre experiências e habilidades, e identificar os melhores talentos. Seja objetivo, profissional e respeitoso.",
        "model": "gpt-4",
        "temperature": 0.6,
        "max_tokens": 2000,
        "tools": ["resume_parser", "calendar_scheduling", "email_sender"],
        "settings": {
            "screening_questions": true,
            "skill_assessment": true,
            "interview_scheduling": true
        }
    }'::jsonb,
    '["rh", "recrutamento", "seleção", "entrevistas", "vagas"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=recruiter'
) ON CONFLICT (nm_template) DO NOTHING;

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Onboarding de Colaboradores',
    'Guia de onboarding automatizado para novos colaboradores. Fornece informações sobre a empresa, processos e responde dúvidas iniciais.',
    'hr',
    'published',
    'public',
    '{
        "name": "Guia de Onboarding",
        "system_prompt": "Você é um guia de boas-vindas para novos colaboradores. Forneça informações sobre a cultura da empresa, processos internos, benefícios e responda dúvidas comuns de novos funcionários. Seja acolhedor e informativo.",
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 1500,
        "tools": ["knowledge_base", "document_access"],
        "settings": {
            "company_info": true,
            "benefits_guide": true,
            "checklist_tracking": true
        }
    }'::jsonb,
    '["onboarding", "rh", "colaboradores", "integração", "treinamento"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=onboarding'
) ON CONFLICT (nm_template) DO NOTHING;

-- ============================================================================
-- TEMPLATES - MARKETING
-- ============================================================================

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Gerador de Conteúdo para Redes Sociais',
    'Crie posts envolventes para redes sociais com base em temas, produtos ou eventos. Otimizado para diferentes plataformas (Instagram, LinkedIn, Twitter).',
    'marketing',
    'published',
    'public',
    '{
        "name": "Social Media Creator",
        "system_prompt": "Você é um especialista em marketing de conteúdo e redes sociais. Crie posts criativos, envolventes e otimizados para cada plataforma. Use hashtags relevantes, call-to-actions eficazes e adapte o tom conforme o canal.",
        "model": "gpt-4",
        "temperature": 1.0,
        "max_tokens": 500,
        "tools": ["image_generator", "hashtag_suggester"],
        "settings": {
            "platforms": ["instagram", "linkedin", "twitter", "facebook"],
            "content_types": ["promotional", "educational", "entertaining"],
            "tone_variations": true
        }
    }'::jsonb,
    '["marketing", "redes-sociais", "conteúdo", "posts", "criativo"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=social-media'
) ON CONFLICT (nm_template) DO NOTHING;

-- ============================================================================
-- TEMPLATES - ANALYTICS
-- ============================================================================

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Analista de Dados Empresariais',
    'Assistente para análise de dados e geração de insights. Interpreta métricas, cria visualizações e responde perguntas sobre dados do negócio.',
    'analytics',
    'published',
    'public',
    '{
        "name": "Data Analyst Assistant",
        "system_prompt": "Você é um analista de dados experiente. Interprete dados, identifique tendências, calcule métricas e forneça insights acionáveis. Explique conceitos complexos de forma simples e sugira visualizações apropriadas.",
        "model": "gpt-4",
        "temperature": 0.3,
        "max_tokens": 2000,
        "tools": ["data_query", "chart_generator", "calculator"],
        "settings": {
            "sql_enabled": true,
            "chart_types": ["line", "bar", "pie", "scatter"],
            "statistical_analysis": true
        }
    }'::jsonb,
    '["analytics", "dados", "métricas", "insights", "visualização"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=analytics'
) ON CONFLICT (nm_template) DO NOTHING;

-- ============================================================================
-- TEMPLATES - PRODUCTIVITY
-- ============================================================================

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Assistente Executivo Virtual',
    'Gerenciamento de agenda, emails, tarefas e lembretes. O assistente pessoal completo para profissionais ocupados.',
    'productivity',
    'published',
    'public',
    '{
        "name": "Executive Assistant",
        "system_prompt": "Você é um assistente executivo altamente organizado e eficiente. Gerencie agenda, priorize tarefas, resuma emails e forneça lembretes. Seja proativo e antecipe necessidades.",
        "model": "gpt-4",
        "temperature": 0.5,
        "max_tokens": 1500,
        "tools": ["calendar", "email_handler", "task_manager", "reminder"],
        "settings": {
            "email_summarization": true,
            "smart_scheduling": true,
            "priority_suggestions": true
        }
    }'::jsonb,
    '["produtividade", "agenda", "tarefas", "assistente", "organização"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=executive-assistant'
) ON CONFLICT (nm_template) DO NOTHING;

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Resumidor de Reuniões',
    'Participa de reuniões, anota pontos-chave e gera atas automáticas com action items. Economiza tempo da equipe.',
    'productivity',
    'published',
    'public',
    '{
        "name": "Meeting Summarizer",
        "system_prompt": "Você é um especialista em capturar informações de reuniões. Identifique decisões tomadas, action items, responsáveis e prazos. Crie resumos estruturados e acionáveis.",
        "model": "gpt-4",
        "temperature": 0.4,
        "max_tokens": 2000,
        "tools": ["transcription", "task_creator"],
        "settings": {
            "format": "structured",
            "include_timestamps": true,
            "action_items_tracking": true
        }
    }'::jsonb,
    '["reuniões", "atas", "resumo", "produtividade", "action-items"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=meeting-notes'
) ON CONFLICT (nm_template) DO NOTHING;

-- ============================================================================
-- TEMPLATES - EDUCATION
-- ============================================================================

INSERT INTO tb_templates (
    nm_template,
    ds_template,
    nm_category,
    nm_status,
    nm_visibility,
    js_agent_config,
    ds_tags,
    nm_version,
    ds_icon_url
) VALUES (
    'Tutor de Programação',
    'Professor virtual de programação. Explica conceitos, corrige código e fornece exercícios práticos. Suporta múltiplas linguagens.',
    'education',
    'published',
    'public',
    '{
        "name": "Code Tutor",
        "system_prompt": "Você é um professor de programação experiente e paciente. Explique conceitos de forma clara, forneça exemplos práticos e ajude os alunos a debugar código. Adapte a linguagem ao nível do estudante.",
        "model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 2000,
        "tools": ["code_executor", "syntax_checker"],
        "settings": {
            "languages": ["python", "javascript", "java", "c++", "sql"],
            "difficulty_levels": ["beginner", "intermediate", "advanced"],
            "interactive_mode": true
        }
    }'::jsonb,
    '["educação", "programação", "código", "tutor", "aprendizado"]'::jsonb,
    '1.0.0',
    'https://api.dicebear.com/7.x/shapes/svg?seed=code-tutor'
) ON CONFLICT (nm_template) DO NOTHING;

-- ============================================================================
-- ATUALIZAR ESTATÍSTICAS INICIAIS
-- ============================================================================

-- Simular algumas instalações e reviews para templates populares
UPDATE tb_templates
SET
    nr_install_count = FLOOR(RANDOM() * 500 + 100)::INTEGER,
    nr_rating_avg = ROUND((RANDOM() * 2 + 3)::NUMERIC, 2),  -- Rating entre 3.0 e 5.0
    nr_rating_count = FLOOR(RANDOM() * 100 + 20)::INTEGER,
    dt_publicacao = CURRENT_TIMESTAMP - INTERVAL '30 days' * RANDOM()
WHERE nm_status = 'published';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 'Seed data aplicado com sucesso!' as resultado;
SELECT COUNT(*) as total_templates FROM tb_templates WHERE nm_status = 'published';
SELECT nm_category, COUNT(*) as qtd
FROM tb_templates
WHERE nm_status = 'published'
GROUP BY nm_category
ORDER BY qtd DESC;
