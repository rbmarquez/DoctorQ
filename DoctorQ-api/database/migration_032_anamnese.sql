-- ============================================================
-- Migration 032: Anamnese (Questionário Pré-Atendimento)
-- UC032 - Registrar Anamnese
-- Data: 2025-11-07
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. TEMPLATES DE ANAMNESE
-- ============================================================

CREATE TABLE IF NOT EXISTS tb_anamnese_templates (
    id_template UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

    -- Identificação do template
    nm_template VARCHAR(255) NOT NULL,
    ds_template TEXT,
    tp_template VARCHAR(50) NOT NULL, -- geral, facial, corporal, depilacao, preenchimento, outro

    -- Estrutura do questionário
    ds_perguntas JSONB NOT NULL, -- Array de perguntas estruturadas

    -- Regras de validação e alertas
    ds_regras_validacao JSONB,
    ds_regras_alertas JSONB,

    -- Flags
    fg_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    fg_publico BOOLEAN NOT NULL DEFAULT FALSE, -- Template disponível para todas clínicas?

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_tp_template CHECK (
        tp_template IN ('geral', 'facial', 'corporal', 'depilacao', 'preenchimento', 'laser', 'botox', 'outro')
    )
);

-- Índices tb_anamnese_templates
CREATE INDEX idx_anamnese_templates_empresa ON tb_anamnese_templates(id_empresa);
CREATE INDEX idx_anamnese_templates_tipo ON tb_anamnese_templates(tp_template);
CREATE INDEX idx_anamnese_templates_publico ON tb_anamnese_templates(fg_publico) WHERE fg_publico = TRUE;
CREATE INDEX idx_anamnese_templates_ativo ON tb_anamnese_templates(fg_ativo) WHERE fg_ativo = TRUE;
CREATE INDEX idx_anamnese_templates_perguntas_gin ON tb_anamnese_templates USING GIN (ds_perguntas);

-- Comentários tb_anamnese_templates
COMMENT ON TABLE tb_anamnese_templates IS 'Templates de anamnese (questionários pré-atendimento)';
COMMENT ON COLUMN tb_anamnese_templates.id_template IS 'ID único do template';
COMMENT ON COLUMN tb_anamnese_templates.id_empresa IS 'Empresa dona do template (NULL = template global)';
COMMENT ON COLUMN tb_anamnese_templates.nm_template IS 'Nome do template';
COMMENT ON COLUMN tb_anamnese_templates.ds_template IS 'Descrição do template';
COMMENT ON COLUMN tb_anamnese_templates.tp_template IS 'Tipo do template: geral, facial, corporal, depilacao, preenchimento, laser, botox, outro';
COMMENT ON COLUMN tb_anamnese_templates.ds_perguntas IS 'Array de perguntas estruturadas em JSON';
COMMENT ON COLUMN tb_anamnese_templates.ds_regras_validacao IS 'Regras de validação de respostas';
COMMENT ON COLUMN tb_anamnese_templates.ds_regras_alertas IS 'Regras para gerar alertas baseados em respostas';
COMMENT ON COLUMN tb_anamnese_templates.fg_ativo IS 'Template ativo?';
COMMENT ON COLUMN tb_anamnese_templates.fg_publico IS 'Template disponível para todas as clínicas?';


-- ============================================================
-- 2. ANAMNESES PREENCHIDAS
-- ============================================================

CREATE TABLE IF NOT EXISTS tb_anamneses (
    id_anamnese UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_paciente UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE SET NULL,
    id_template UUID NOT NULL REFERENCES tb_anamnese_templates(id_template) ON DELETE RESTRICT,

    -- Respostas do questionário
    ds_respostas JSONB NOT NULL, -- Array de respostas estruturadas
    ds_observacoes TEXT,

    -- Alertas identificados
    fg_alertas_criticos BOOLEAN NOT NULL DEFAULT FALSE,
    ds_alertas JSONB, -- Array de alertas gerados

    -- Assinaturas digitais
    nm_assinatura_paciente VARCHAR(255),
    dt_assinatura_paciente TIMESTAMP,
    nm_assinatura_profissional VARCHAR(255),
    dt_assinatura_profissional TIMESTAMP,

    -- Flags
    fg_ativo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoria
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_assinatura_paciente CHECK (
        (nm_assinatura_paciente IS NULL AND dt_assinatura_paciente IS NULL) OR
        (nm_assinatura_paciente IS NOT NULL AND dt_assinatura_paciente IS NOT NULL)
    ),
    CONSTRAINT chk_assinatura_profissional CHECK (
        (nm_assinatura_profissional IS NULL AND dt_assinatura_profissional IS NULL) OR
        (nm_assinatura_profissional IS NOT NULL AND dt_assinatura_profissional IS NOT NULL)
    )
);

-- Índices tb_anamneses
CREATE INDEX idx_anamneses_empresa ON tb_anamneses(id_empresa);
CREATE INDEX idx_anamneses_paciente ON tb_anamneses(id_paciente);
CREATE INDEX idx_anamneses_profissional ON tb_anamneses(id_profissional);
CREATE INDEX idx_anamneses_procedimento ON tb_anamneses(id_procedimento);
CREATE INDEX idx_anamneses_template ON tb_anamneses(id_template);
CREATE INDEX idx_anamneses_alertas ON tb_anamneses(fg_alertas_criticos) WHERE fg_alertas_criticos = TRUE;
CREATE INDEX idx_anamneses_ativo ON tb_anamneses(fg_ativo) WHERE fg_ativo = TRUE;
CREATE INDEX idx_anamneses_dt_criacao ON tb_anamneses(dt_criacao DESC);
CREATE INDEX idx_anamneses_respostas_gin ON tb_anamneses USING GIN (ds_respostas);

-- Índices compostos para queries comuns
CREATE INDEX idx_anamneses_empresa_paciente ON tb_anamneses(id_empresa, id_paciente);
CREATE INDEX idx_anamneses_empresa_profissional ON tb_anamneses(id_empresa, id_profissional);
CREATE INDEX idx_anamneses_empresa_alertas ON tb_anamneses(id_empresa, fg_alertas_criticos) WHERE fg_alertas_criticos = TRUE;

-- Comentários tb_anamneses
COMMENT ON TABLE tb_anamneses IS 'Anamneses preenchidas por pacientes antes de procedimentos';
COMMENT ON COLUMN tb_anamneses.id_anamnese IS 'ID único da anamnese';
COMMENT ON COLUMN tb_anamneses.id_empresa IS 'Empresa da anamnese (multi-tenant)';
COMMENT ON COLUMN tb_anamneses.id_paciente IS 'Paciente que preencheu a anamnese';
COMMENT ON COLUMN tb_anamneses.id_profissional IS 'Profissional que revisou/assinou (opcional)';
COMMENT ON COLUMN tb_anamneses.id_procedimento IS 'Procedimento relacionado (opcional)';
COMMENT ON COLUMN tb_anamneses.id_template IS 'Template utilizado';
COMMENT ON COLUMN tb_anamneses.ds_respostas IS 'Respostas do questionário em JSON';
COMMENT ON COLUMN tb_anamneses.ds_observacoes IS 'Observações adicionais do profissional ou paciente';
COMMENT ON COLUMN tb_anamneses.fg_alertas_criticos IS 'Possui alertas críticos? (ex: gravidez, alergias severas)';
COMMENT ON COLUMN tb_anamneses.ds_alertas IS 'Lista de alertas identificados';
COMMENT ON COLUMN tb_anamneses.nm_assinatura_paciente IS 'Nome para assinatura digital do paciente';
COMMENT ON COLUMN tb_anamneses.dt_assinatura_paciente IS 'Data/hora da assinatura do paciente';
COMMENT ON COLUMN tb_anamneses.nm_assinatura_profissional IS 'Nome para assinatura digital do profissional';
COMMENT ON COLUMN tb_anamneses.dt_assinatura_profissional IS 'Data/hora da assinatura do profissional';
COMMENT ON COLUMN tb_anamneses.fg_ativo IS 'Anamnese ativa? (soft delete para LGPD)';


-- ============================================================
-- 3. TEMPLATE PADRÃO DE ANAMNESE GERAL
-- ============================================================

INSERT INTO tb_anamnese_templates (
    id_empresa,
    nm_template,
    ds_template,
    tp_template,
    ds_perguntas,
    ds_regras_alertas,
    fg_publico,
    fg_ativo
) VALUES (
    NULL, -- Template global
    'Anamnese Geral - Estética',
    'Questionário geral para qualquer procedimento estético',
    'geral',
    '[
        {
            "id_pergunta": "hist_saude",
            "nm_pergunta": "Como você classifica seu estado geral de saúde?",
            "tp_resposta": "radio",
            "fg_obrigatoria": true,
            "ds_opcoes": ["Excelente", "Bom", "Regular", "Ruim"],
            "nr_ordem": 1
        },
        {
            "id_pergunta": "alergias",
            "nm_pergunta": "Possui alguma alergia conhecida?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": true,
            "ds_ajuda": "Liste todas as alergias a medicamentos, cosméticos, alimentos, etc.",
            "nr_ordem": 2
        },
        {
            "id_pergunta": "medicamentos",
            "nm_pergunta": "Está fazendo uso de algum medicamento atualmente?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": true,
            "ds_ajuda": "Liste todos os medicamentos que está usando, incluindo dosagem",
            "nr_ordem": 3
        },
        {
            "id_pergunta": "gestante",
            "nm_pergunta": "Está grávida ou amamentando?",
            "tp_resposta": "radio",
            "fg_obrigatoria": true,
            "ds_opcoes": ["Não", "Grávida", "Amamentando"],
            "nr_ordem": 4
        },
        {
            "id_pergunta": "doencas_cronicas",
            "nm_pergunta": "Possui alguma doença crônica?",
            "tp_resposta": "multiselect",
            "fg_obrigatoria": true,
            "ds_opcoes": [
                "Nenhuma",
                "Diabetes",
                "Hipertensão",
                "Doenças cardíacas",
                "Doenças autoimunes",
                "Câncer (atual ou histórico)",
                "Epilepsia",
                "Doenças de pele",
                "Outras"
            ],
            "nr_ordem": 5
        },
        {
            "id_pergunta": "cirurgias",
            "nm_pergunta": "Já realizou alguma cirurgia? Quais e quando?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": false,
            "nr_ordem": 6
        },
        {
            "id_pergunta": "tratamentos_anteriores",
            "nm_pergunta": "Já realizou algum tratamento estético anteriormente?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": false,
            "ds_ajuda": "Descreva quais tratamentos, quando e resultados",
            "nr_ordem": 7
        },
        {
            "id_pergunta": "expectativas",
            "nm_pergunta": "Quais são suas expectativas com o tratamento?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": true,
            "nr_ordem": 8
        },
        {
            "id_pergunta": "termo_consentimento",
            "nm_pergunta": "Li e concordo com o termo de consentimento do procedimento",
            "tp_resposta": "boolean",
            "fg_obrigatoria": true,
            "nr_ordem": 9
        }
    ]'::jsonb,
    '{
        "alertas_criticos": [
            {
                "condicao": "gestante != ''Não''",
                "alerta": {
                    "tp_alerta": "critico",
                    "nm_alerta": "Gestação/Amamentação",
                    "ds_alerta": "Paciente grávida ou amamentando. Muitos procedimentos são contraindicados."
                }
            },
            {
                "condicao": "''Câncer'' in doencas_cronicas",
                "alerta": {
                    "tp_alerta": "critico",
                    "nm_alerta": "Histórico de Câncer",
                    "ds_alerta": "Paciente com câncer. Necessário avaliação médica prévia."
                }
            }
        ]
    }'::jsonb,
    TRUE, -- Público (disponível para todas as empresas)
    TRUE  -- Ativo
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. TRIGGERS DE AUDITORIA
-- ============================================================

-- Trigger para atualizar dt_atualizacao em tb_anamnese_templates
CREATE OR REPLACE FUNCTION update_anamnese_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_anamnese_templates_timestamp
    BEFORE UPDATE ON tb_anamnese_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_anamnese_templates_timestamp();

-- Trigger para atualizar dt_atualizacao em tb_anamneses
CREATE OR REPLACE FUNCTION update_anamneses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_anamneses_timestamp
    BEFORE UPDATE ON tb_anamneses
    FOR EACH ROW
    EXECUTE FUNCTION update_anamneses_timestamp();


-- ============================================================
-- 5. ESTATÍSTICAS E PERFORMANCE
-- ============================================================

-- Atualizar estatísticas das novas tabelas
ANALYZE tb_anamnese_templates;
ANALYZE tb_anamneses;


-- ============================================================
-- 6. PERMISSÕES (ajustar conforme ambiente)
-- ============================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON tb_anamnese_templates TO doctorq_api;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tb_anamneses TO doctorq_api;


-- ============================================================
-- FIM DA MIGRATION
-- ============================================================

-- Verificação final
SELECT
    'tb_anamnese_templates' as tabela,
    count(*) as total_registros
FROM tb_anamnese_templates
UNION ALL
SELECT
    'tb_anamneses' as tabela,
    count(*) as total_registros
FROM tb_anamneses;
