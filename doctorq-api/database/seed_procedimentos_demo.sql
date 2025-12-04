-- ====================================================================
-- SCRIPT DE SEED - PROCEDIMENTOS PARA DEMONSTRAÇÃO
-- ====================================================================
-- Data: 09/11/2025
-- Descrição: Popula tabela tb_procedimentos com dados realistas
-- ====================================================================

-- Pegar uma clínica existente (ou criar dados sem clínica)
DO $$
DECLARE
    v_clinica_id UUID;
BEGIN
    -- Tentar pegar uma clínica existente
    SELECT id_clinica INTO v_clinica_id FROM tb_clinicas LIMIT 1;

    -- Se não houver clínica, vamos usar NULL (procedimentos genéricos)
    IF v_clinica_id IS NULL THEN
        v_clinica_id := NULL;
    END IF;

    -- Inserir procedimentos
    INSERT INTO tb_procedimentos (
        id_procedimento,
        id_clinica,
        nm_procedimento,
        ds_procedimento,
        ds_categoria,
        ds_subcategoria,
        vl_preco,
        vl_preco_promocional,
        nr_duracao_minutos,
        nr_sessoes_recomendadas,
        ds_indicacoes,
        ds_contraindicacoes,
        ds_preparacao,
        ds_cuidados_pos,
        ds_resultados_esperados,
        st_disponivel_online,
        st_ativo,
        nr_ordem_exibicao
    ) VALUES
        (
            gen_random_uuid(),
            v_clinica_id,
            'Limpeza de Pele Profunda',
            'Limpeza facial completa com extração de cravos, esfoliação, máscara específica para seu tipo de pele e hidratação intensiva. Procedimento realizado por profissional capacitado.',
            'Facial',
            'Limpeza de Pele',
            180.00,
            NULL,
            60,
            1,
            'Pele com acne, cravos, oleosidade excessiva, poros dilatados',
            'Pele muito sensível, rosácea ativa, herpes labial ativo',
            'Evitar exposição solar 24h antes, não usar ácidos 3 dias antes',
            'Protetor solar FPS 30+, evitar maquiagem por 24h, hidratação constante',
            'Pele mais limpa, suave e luminosa. Redução de cravos e oleosidade',
            true,
            true,
            1
        ),
        (
            gen_random_uuid(),
            v_clinica_id,
            'Botox - Toxina Botulínica',
            'Aplicação de toxina botulínica tipo A para suavização de rugas e linhas de expressão (testa, glabela, periocular). Resultados visíveis em 3-7 dias.',
            'Estética Facial',
            'Toxina Botulínica',
            800.00,
            NULL,
            30,
            1,
            'Rugas de expressão, linhas de testa, pés de galinha, linhas de preocupação',
            'Gravidez, amamentação, miastenia gravis, alergia à toxina botulínica',
            'Não usar AAS ou anticoagulantes 7 dias antes, informar medicamentos em uso',
            'Não deitar por 4h, evitar exercícios físicos por 24h, não massagear área',
            'Suavização das rugas em 3-7 dias, duração de 4-6 meses',
            false,
            true,
            2
        ),
        (
            gen_random_uuid(),
            v_clinica_id,
            'Preenchimento Labial',
            'Preenchimento com ácido hialurônico para realçar o volume e contorno dos lábios de forma natural e harmoniosa',
            'Estética Facial',
            'Preenchimento',
            1200.00,
            NULL,
            45,
            1,
            'Lábios finos, assimétricos, perda de volume labial relacionada à idade',
            'Infecção ativa nos lábios, herpes labial ativo, gravidez, alergia ao ácido hialurônico',
            'Evitar AAS 7 dias antes, não estar com herpes labial, informar alergias',
            'Aplicar gelo nas primeiras 24h, evitar exposição solar, não usar batom por 24h',
            'Volume e definição labial natural, resultado imediato, duração de 6-12 meses',
            false,
            true,
            3
        ),
        (
            gen_random_uuid(),
            v_clinica_id,
            'Microagulhamento Facial',
            'Tratamento de rejuvenescimento com microagulhas para estimular produção de colágeno natural, melhorar textura da pele, cicatrizes de acne e manchas',
            'Rejuvenescimento',
            'Microagulhamento',
            350.00,
            NULL,
            90,
            3,
            'Cicatrizes de acne, manchas, linhas finas, textura irregular, poros dilatados',
            'Queloides, infecções ativas, herpes ativo, isotretinoína nos últimos 6 meses',
            'Não usar ácidos 1 semana antes, evitar exposição solar excessiva',
            'Protetor solar FPS 50+, vermelhidão normal por 24-48h, hidratação intensa',
            'Melhora da textura em 30 dias, redução de manchas e cicatrizes progressiva',
            true,
            true,
            4
        ),
        (
            gen_random_uuid(),
            v_clinica_id,
            'Peeling Químico',
            'Renovação celular através de ácidos específicos (glicólico, salicílico, mandélico) para tratamento de manchas, acne e fotoenvelhecimento',
            'Facial',
            'Peeling',
            280.00,
            NULL,
            60,
            4,
            'Manchas, melasma, acne, fotoenvelhecimento, textura irregular',
            'Pele muito sensível, rosácea grave, uso de isotretinoína, exposição solar recente',
            'Não usar ácidos 3 dias antes, preparar pele com dermocosméticos indicados',
            'Protetor solar FPS 50+ obrigatório, descamação esperada 3-7 dias, hidratação',
            'Clareamento de manchas, redução de acne, pele mais uniforme e renovada',
            true,
            true,
            5
        ),
        (
            gen_random_uuid(),
            v_clinica_id,
            'Drenagem Linfática Facial',
            'Massagem especializada para redução de inchaço, melhora da circulação facial e detoxificação da pele. Técnica suave e relaxante.',
            'Corporal',
            'Drenagem',
            150.00,
            NULL,
            50,
            1,
            'Inchaço facial, retenção de líquidos, pós-operatório facial, relaxamento',
            'Infecções ativas, febre, câncer ativo, trombose',
            'Hidratação adequada no dia, evitar refeições pesadas antes',
            'Beber água, evitar sal em excesso, repetir 2-3x/semana para melhores resultados',
            'Redução imediata do inchaço, rosto mais definido, pele radiante',
            true,
            true,
            6
        )
    ON CONFLICT (id_procedimento) DO NOTHING;

END $$;

-- Verificar quantos procedimentos foram inseridos
SELECT COUNT(*) as total_procedimentos_ativos
FROM tb_procedimentos
WHERE st_ativo = true;

SELECT nm_procedimento, ds_categoria, vl_preco
FROM tb_procedimentos
WHERE st_ativo = true
ORDER BY nr_ordem_exibicao;

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
