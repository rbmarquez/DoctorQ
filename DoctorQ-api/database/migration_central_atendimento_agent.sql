-- Migration: Criar agente padrão para Central de Atendimento
-- Data: 2025-11-28
-- Descrição: Adiciona um agente padrão para a Central de Atendimento
--            com prompt especializado para clínicas estéticas.

-- ============================================================================
-- Adicionar coluna st_principal à tb_agentes se não existir
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_agentes' AND column_name = 'st_principal'
    ) THEN
        ALTER TABLE tb_agentes ADD COLUMN st_principal BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================================================
-- Adicionar coluna id_empresa à tb_agentes se não existir
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_agentes' AND column_name = 'id_empresa'
    ) THEN
        ALTER TABLE tb_agentes ADD COLUMN id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- Criar índice para id_empresa em tb_agentes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_agentes_empresa ON tb_agentes(id_empresa);

-- ============================================================================
-- Criar função para inserir agente padrão para novas empresas
-- ============================================================================
CREATE OR REPLACE FUNCTION criar_agente_central_atendimento()
RETURNS TRIGGER AS $$
DECLARE
    prompt_agente TEXT;
BEGIN
    -- Prompt padrão do agente de Central de Atendimento
    prompt_agente := 'Você é a assistente virtual da clínica, especializada em estética e beleza.

## Sua Personalidade
- Seja sempre cordial, profissional e acolhedor
- Use uma linguagem clara e acessível
- Demonstre empatia e atenção às necessidades do cliente
- Mantenha um tom amigável mas profissional

## Suas Capacidades
Você pode ajudar os clientes com:
1. **Informações sobre procedimentos** - Descrever tratamentos, benefícios, contraindicações e valores
2. **Agendamentos** - Verificar disponibilidade e agendar consultas/procedimentos
3. **Consultas** - Verificar agendamentos existentes do cliente
4. **Dúvidas gerais** - Responder perguntas sobre a clínica, horário de funcionamento, etc.

## Regras Importantes
- NUNCA invente informações sobre procedimentos ou preços. Use as tools disponíveis.
- Se não souber responder algo, seja honesto e ofereça transferir para um atendente humano
- Sempre confirme os dados do agendamento antes de finalizar
- Para procedimentos invasivos, sempre mencione que é necessária avaliação presencial
- Respeite a privacidade do cliente e não peça informações desnecessárias

## Quando Transferir para Humano
Transfira o atendimento para um humano quando:
- O cliente solicitar explicitamente ("quero falar com atendente", "quero falar com uma pessoa")
- Houver reclamações ou problemas que você não consegue resolver
- O assunto envolver questões financeiras complexas (parcelamentos especiais, negociações)
- O cliente demonstrar frustração ou insatisfação com o atendimento automatizado

Lembre-se: sua prioridade é proporcionar uma experiência excelente ao cliente!';

    -- Inserir agente padrão para a nova empresa
    INSERT INTO tb_agentes (
        id_agente,
        nm_agente,
        ds_agente,
        ds_tipo,
        nm_modelo,
        nm_provider,
        nr_temperature,
        ds_system_prompt,
        ds_config,
        ds_tools,
        id_empresa,
        st_principal,
        st_ativo,
        dt_criacao,
        dt_atualizacao
    ) VALUES (
        gen_random_uuid(),
        'Assistente Central de Atendimento',
        'Agente de IA para atendimento automatizado ao cliente via WhatsApp e chat',
        'central_atendimento',
        'gpt-4o-mini',
        'openai',
        0.7,
        prompt_agente,
        jsonb_build_object(
            'transferir_humano_keywords', jsonb_build_array(
                'atendente',
                'humano',
                'pessoa',
                'falar com alguém'
            )
        ),
        ARRAY['buscar_procedimentos', 'buscar_horarios', 'informacoes_clinica'],
        NEW.id_empresa,
        true,
        true,
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Criar trigger para novas empresas
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_criar_agente_central ON tb_empresas;

CREATE TRIGGER trigger_criar_agente_central
    AFTER INSERT ON tb_empresas
    FOR EACH ROW
    EXECUTE FUNCTION criar_agente_central_atendimento();

-- ============================================================================
-- Inserir agente para empresas existentes que não têm agente principal
-- ============================================================================
DO $$
DECLARE
    empresa_record RECORD;
    prompt_agente TEXT;
BEGIN
    -- Prompt padrão do agente
    prompt_agente := 'Você é a assistente virtual da clínica, especializada em estética e beleza.

## Sua Personalidade
- Seja sempre cordial, profissional e acolhedor
- Use uma linguagem clara e acessível
- Demonstre empatia e atenção às necessidades do cliente
- Mantenha um tom amigável mas profissional

## Suas Capacidades
Você pode ajudar os clientes com:
1. **Informações sobre procedimentos** - Descrever tratamentos, benefícios, contraindicações e valores
2. **Agendamentos** - Verificar disponibilidade e agendar consultas/procedimentos
3. **Consultas** - Verificar agendamentos existentes do cliente
4. **Dúvidas gerais** - Responder perguntas sobre a clínica, horário de funcionamento, etc.

## Regras Importantes
- NUNCA invente informações sobre procedimentos ou preços. Use as tools disponíveis.
- Se não souber responder algo, seja honesto e ofereça transferir para um atendente humano
- Sempre confirme os dados do agendamento antes de finalizar
- Para procedimentos invasivos, sempre mencione que é necessária avaliação presencial
- Respeite a privacidade do cliente e não peça informações desnecessárias

## Quando Transferir para Humano
Transfira o atendimento para um humano quando:
- O cliente solicitar explicitamente ("quero falar com atendente", "quero falar com uma pessoa")
- Houver reclamações ou problemas que você não consegue resolver
- O assunto envolver questões financeiras complexas (parcelamentos especiais, negociações)
- O cliente demonstrar frustração ou insatisfação com o atendimento automatizado

Lembre-se: sua prioridade é proporcionar uma experiência excelente ao cliente!';

    -- Loop por empresas sem agente principal
    FOR empresa_record IN
        SELECT e.id_empresa
        FROM tb_empresas e
        WHERE NOT EXISTS (
            SELECT 1 FROM tb_agentes a
            WHERE a.id_empresa = e.id_empresa
            AND a.st_principal = true
        )
    LOOP
        INSERT INTO tb_agentes (
            id_agente,
            nm_agente,
            ds_agente,
            ds_tipo,
            nm_modelo,
            nm_provider,
            nr_temperature,
            ds_system_prompt,
            ds_config,
            ds_tools,
            id_empresa,
            st_principal,
            st_ativo,
            dt_criacao,
            dt_atualizacao
        ) VALUES (
            gen_random_uuid(),
            'Assistente Central de Atendimento',
            'Agente de IA para atendimento automatizado ao cliente via WhatsApp e chat',
            'central_atendimento',
            'gpt-4o-mini',
            'openai',
            0.7,
            prompt_agente,
            jsonb_build_object(
                'transferir_humano_keywords', jsonb_build_array(
                    'atendente',
                    'humano',
                    'pessoa',
                    'falar com alguém'
                )
            ),
            ARRAY['buscar_procedimentos', 'buscar_horarios', 'informacoes_clinica'],
            empresa_record.id_empresa,
            true,
            true,
            NOW(),
            NOW()
        );

        RAISE NOTICE 'Agente criado para empresa: %', empresa_record.id_empresa;
    END LOOP;
END $$;

-- ============================================================================
-- Comentários
-- ============================================================================
COMMENT ON COLUMN tb_agentes.st_principal IS 'Indica se é o agente principal da empresa (usado pela Central de Atendimento)';
COMMENT ON COLUMN tb_agentes.id_empresa IS 'ID da empresa dona do agente (multi-tenant)';
COMMENT ON FUNCTION criar_agente_central_atendimento() IS 'Trigger function que cria automaticamente um agente de Central de Atendimento para novas empresas';

-- ============================================================================
-- Verificação
-- ============================================================================
DO $$
DECLARE
    total_agentes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_agentes
    FROM tb_agentes
    WHERE st_principal = true;

    RAISE NOTICE 'Total de agentes principais criados: %', total_agentes;
END $$;
