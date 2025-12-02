-- ===============================================================
-- DoctorQ - Seed mínimo para ambiente de produção
-- Cria empresa, perfis essenciais, usuário administrador,
-- planos base e configurações gerais sem inserir dados de negócio.
-- ===============================================================

BEGIN;

-- -----------------------------------------------------------------
-- 1) Empresa raiz
-- -----------------------------------------------------------------
INSERT INTO tb_empresas (
    id_empresa,
    nm_empresa,
    nm_razao_social,
    nr_cnpj,
    ds_email,
    nr_telefone,
    nm_plano,
    nr_limite_usuarios,
    nr_limite_agentes,
    nr_limite_document_stores,
    st_ativo
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'DoctorQ Admin',
    'DoctorQ Tecnologia LTDA',
    '00000000000000',
    'admin@doctorq.app',
    '(11) 0000-0000',
    'Enterprise',
    100,
    100,
    10,
    'S'
)
ON CONFLICT (nr_cnpj) DO UPDATE
SET
    nm_empresa = EXCLUDED.nm_empresa,
    nm_razao_social = EXCLUDED.nm_razao_social,
    ds_email = EXCLUDED.ds_email,
    nr_telefone = EXCLUDED.nr_telefone,
    nm_plano = EXCLUDED.nm_plano,
    nr_limite_usuarios = EXCLUDED.nr_limite_usuarios,
    nr_limite_agentes = EXCLUDED.nr_limite_agentes,
    nr_limite_document_stores = EXCLUDED.nr_limite_document_stores,
    st_ativo = 'S';


-- -----------------------------------------------------------------
-- 2) Perfis essenciais
-- -----------------------------------------------------------------
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    ds_permissoes,
    id_empresa,
    nm_tipo,
    st_ativo,
    nm_tipo_acesso,
    nr_ordem
)
VALUES
    (
        '22222222-2222-2222-2222-222222222221',
        'admin',
        'Administrador do sistema (acesso total).',
        '{"admin": true, "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true}}'::jsonb,
        '11111111-1111-1111-1111-111111111111',
        'system',
        'S',
        'admin',
        1
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'gestor_clinica',
        'Gestor da clínica com acesso operacional completo.',
        '{"agendamentos": {"criar": true, "editar": true, "visualizar": true}, "pacientes": {"criar": true, "editar": true, "visualizar": true}}'::jsonb,
        '11111111-1111-1111-1111-111111111111',
        'system',
        'S',
        'parceiro',
        2
    ),
    (
        '22222222-2222-2222-2222-222222222223',
        'profissional',
        'Profissional de estética.',
        '{"agendamentos": {"visualizar": true}, "pacientes": {"visualizar": true}}'::jsonb,
        '11111111-1111-1111-1111-111111111111',
        'system',
        'S',
        'parceiro',
        3
    ),
    (
        '22222222-2222-2222-2222-222222222224',
        'recepcionista',
        'Recepcionista com foco em agenda e pacientes.',
        '{"agendamentos": {"criar": true, "editar": true, "visualizar": true}, "pacientes": {"criar": true, "visualizar": true}}'::jsonb,
        '11111111-1111-1111-1111-111111111111',
        'system',
        'S',
        'parceiro',
        4
    ),
    (
        '22222222-2222-2222-2222-222222222225',
        'paciente',
        'Paciente com acesso às próprias informações.',
        '{"perfil": {"editar": true, "visualizar": true}, "agendamentos": {"criar": true, "visualizar": true}}'::jsonb,
        NULL,
        'system',
        'S',
        'paciente',
        100
    )
ON CONFLICT (nm_perfil) DO UPDATE
SET
    ds_perfil = EXCLUDED.ds_perfil,
    ds_permissoes = EXCLUDED.ds_permissoes,
    id_empresa = EXCLUDED.id_empresa,
    nm_tipo = EXCLUDED.nm_tipo,
    st_ativo = 'S',
    nm_tipo_acesso = EXCLUDED.nm_tipo_acesso,
    nr_ordem = EXCLUDED.nr_ordem;


-- -----------------------------------------------------------------
-- 3) Usuário administrador
-- -----------------------------------------------------------------
INSERT INTO tb_users (
    id_user,
    id_empresa,
    id_perfil,
    nm_email,
    nm_completo,
    nm_papel,
    st_ativo,
    nm_password_hash,
    dt_ultimo_login,
    nr_total_logins
)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'admin@doctorq.app',
    'Administrador DoctorQ',
    'admin',
    'S',
    '$pbkdf2-sha256$29000$SonxXmttLYWwNqbUuheidA$XfyTFOUkWJuyeKPbPpY7B9etUuFaDuNynHZzDvcpo8c',
    NOW(),
    '1'
)
ON CONFLICT (nm_email) DO UPDATE
SET
    id_empresa = EXCLUDED.id_empresa,
    id_perfil = EXCLUDED.id_perfil,
    nm_completo = EXCLUDED.nm_completo,
    nm_papel = EXCLUDED.nm_papel,
    st_ativo = EXCLUDED.st_ativo,
    nm_password_hash = EXCLUDED.nm_password_hash;


-- -----------------------------------------------------------------
-- 4) Planos base para billing
-- -----------------------------------------------------------------
INSERT INTO tb_plans (
    id_plan,
    nm_plan,
    ds_plan,
    nm_tier,
    vl_price_monthly,
    vl_price_yearly,
    ds_features,
    ds_quotas,
    nr_trial_days,
    st_ativo,
    st_visivel
)
VALUES
    (
        '44444444-4444-4444-4444-444444444441',
        'Free',
        'Plano gratuito para uso inicial.',
        'free',
        0.00,
        0.00,
        '{"max_agents": 1, "support": "email", "features": ["Até 1 agente", "Suporte por email"]}'::jsonb,
        '{"max_agents": 1, "max_messages_per_month": 200, "max_tokens_per_month": 50000, "max_document_stores": 0, "max_storage_gb": 0.1}'::jsonb,
        0,
        'S',
        'S'
    ),
    (
        '44444444-4444-4444-4444-444444444442',
        'Starter',
        'Ideal para pequenas clínicas iniciando na plataforma.',
        'starter',
        29.00,
        290.00,
        '{"max_agents": 5, "support": "email", "features": ["5 agentes", "Suporte por email", "API"]}'::jsonb,
        '{"max_agents": 5, "max_messages_per_month": 1000, "max_tokens_per_month": 500000, "max_document_stores": 3, "max_storage_gb": 5}'::jsonb,
        14,
        'S',
        'S'
    ),
    (
        '44444444-4444-4444-4444-444444444443',
        'Professional',
        'Recursos avançados para clínicas em crescimento.',
        'professional',
        99.00,
        990.00,
        '{"max_agents": 20, "support": "priority", "features": ["20 agentes", "Suporte prioritário", "Analytics avançados"]}'::jsonb,
        '{"max_agents": 20, "max_messages_per_month": 10000, "max_tokens_per_month": 5000000, "max_document_stores": 15, "max_storage_gb": 50}'::jsonb,
        14,
        'S',
        'S'
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Enterprise',
        'Plano completo para redes e franquias.',
        'enterprise',
        499.00,
        4990.00,
        '{"max_agents": -1, "support": "dedicated", "features": ["Agentes ilimitados", "Suporte dedicado", "Integrações customizadas"]}'::jsonb,
        '{"max_agents": -1, "max_messages_per_month": -1, "max_tokens_per_month": -1, "max_document_stores": -1, "max_storage_gb": -1}'::jsonb,
        30,
        'S',
        'S'
    )
ON CONFLICT (nm_plan) DO UPDATE
SET
    ds_plan = EXCLUDED.ds_plan,
    nm_tier = EXCLUDED.nm_tier,
    vl_price_monthly = EXCLUDED.vl_price_monthly,
    vl_price_yearly = EXCLUDED.vl_price_yearly,
    ds_features = EXCLUDED.ds_features,
    ds_quotas = EXCLUDED.ds_quotas,
    nr_trial_days = EXCLUDED.nr_trial_days,
    st_ativo = 'S',
    st_visivel = 'S';


-- -----------------------------------------------------------------
-- 5) Configurações gerais (chaves permanecem vazias para preenchimento posterior)
-- -----------------------------------------------------------------
INSERT INTO tb_configuracoes (nm_chave, ds_valor, ds_tipo, ds_categoria, ds_descricao, st_criptografado, st_ativo)
VALUES
    ('whatsapp_api_url', 'https://graph.facebook.com/v18.0', 'texto', 'whatsapp', 'URL da API do WhatsApp Business', FALSE, TRUE),
    ('whatsapp_access_token', '', 'senha', 'whatsapp', 'Token de acesso do WhatsApp Business API', TRUE, TRUE),
    ('whatsapp_phone_id', '', 'texto', 'whatsapp', 'ID do telefone no WhatsApp Business', FALSE, TRUE),
    ('whatsapp_habilitado', 'false', 'boolean', 'whatsapp', 'Ativa/desativa integração com WhatsApp', FALSE, TRUE),
    ('whatsapp_antecedencia_lembrete', '24', 'numero', 'whatsapp', 'Horas de antecedência para enviar lembretes', FALSE, TRUE),
    ('email_smtp_host', '', 'texto', 'email', 'Servidor SMTP para envio de emails', FALSE, TRUE),
    ('email_smtp_port', '587', 'numero', 'email', 'Porta do servidor SMTP', FALSE, TRUE),
    ('email_smtp_usuario', '', 'texto', 'email', 'Usuário para autenticação SMTP', FALSE, TRUE),
    ('email_smtp_senha', '', 'senha', 'email', 'Senha para autenticação SMTP', TRUE, TRUE),
    ('email_remetente', 'noreply@doctorq.com.br', 'texto', 'email', 'Remetente padrão dos emails', FALSE, TRUE),
    ('email_habilitado', 'false', 'boolean', 'email', 'Ativa/desativa envio de emails', FALSE, TRUE),
    ('sms_provedor', '', 'texto', 'sms', 'Provedor de SMS (twilio, zenvia, etc.)', FALSE, TRUE),
    ('sms_api_key', '', 'senha', 'sms', 'API key do provedor de SMS', TRUE, TRUE),
    ('sms_remetente', '', 'texto', 'sms', 'Nome ou número remetente de SMS', FALSE, TRUE),
    ('sms_habilitado', 'false', 'boolean', 'sms', 'Ativa/desativa envio de SMS', FALSE, TRUE),
    ('sistema_nome', 'DoctorQ', 'texto', 'geral', 'Nome do sistema exibido nas interfaces', FALSE, TRUE),
    ('sistema_url', 'http://localhost:3000', 'texto', 'geral', 'URL base do frontend', FALSE, TRUE),
    ('sistema_email_suporte', 'suporte@doctorq.com.br', 'texto', 'geral', 'Email de suporte técnico', FALSE, TRUE),
    ('sistema_timezone', 'America/Sao_Paulo', 'texto', 'geral', 'Timezone padrão da plataforma', FALSE, TRUE)
ON CONFLICT (nm_chave) DO UPDATE
SET
    ds_valor = EXCLUDED.ds_valor,
    ds_tipo = EXCLUDED.ds_tipo,
    ds_categoria = EXCLUDED.ds_categoria,
    ds_descricao = EXCLUDED.ds_descricao,
    st_criptografado = EXCLUDED.st_criptografado,
    st_ativo = TRUE;


COMMIT;
