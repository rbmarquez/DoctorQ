-- ====================================================================
-- SEED ADDITIONAL MOCK DATA FOR DOCTORQ
-- ====================================================================
-- Populates: tb_prontuarios, tb_favoritos, tb_carrinho, tb_comparacao,
--            tb_avaliacoes_produtos, tb_pedidos, tb_pedido_itens
-- ====================================================================

-- ====================================================================
-- 1. PRONTUÁRIOS (MEDICAL RECORDS) - 5 records
-- ====================================================================

INSERT INTO tb_prontuarios (
    id_prontuario,
    id_paciente,
    id_profissional,
    id_agendamento,
    id_clinica,
    dt_consulta,
    ds_tipo,
    ds_queixa_principal,
    ds_historico_doenca_atual,
    ds_antecedentes_pessoais,
    ds_antecedentes_familiares,
    ds_habitos_vida,
    ds_pressao_arterial,
    ds_peso,
    ds_altura,
    ds_imc,
    ds_exame_fisico,
    ds_avaliacao_estetica,
    ds_diagnostico,
    ds_procedimentos_realizados,
    ds_produtos_utilizados,
    ds_prescricoes,
    ds_orientacoes,
    ds_plano_tratamento,
    ds_evolucao,
    dt_retorno_sugerido,
    ds_assinatura_profissional,
    dt_assinatura
) VALUES
-- Prontuário 1: Patrícia - Aplicação de Botox
(
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '5 days',
    'Consulta de Estética',
    'Paciente relata rugas dinâmicas na região frontal e ao redor dos olhos (pés de galinha)',
    'Rugas dinâmicas há cerca de 3 anos, com progressão gradual. Primeira aplicação de toxina botulínica.',
    'Nega doenças crônicas. Não faz uso de medicamentos contínuos.',
    'Mãe com história de envelhecimento cutâneo precoce.',
    'Não fumante. Consome álcool socialmente. Pratica exercícios físicos 3x/semana. Boa ingestão hídrica.',
    '120/80 mmHg',
    68.50,
    1.65,
    25.14,
    'Pele tipo II (Fitzpatrick), eutrófica, elástica, hidratada. Rugas dinâmicas em região frontal (Glogau II).',
    'Rugas dinâmicas frontais e glabelares grau moderado. Pés de galinha bilaterais grau leve a moderado.',
    'Rugas dinâmicas faciais - candidata à toxina botulínica.',
    'Aplicação de Toxina Botulínica tipo A (Botox 100U) - Região frontal: 20U, Glabela: 20U, Região periorbital: 12U bilateral',
    'Toxina Botulínica tipo A 100U (Allergan)',
    'Não prescrições domiciliares.',
    'Evitar deitar por 4h após aplicação. Não massagear área tratada. Evitar exercícios físicos intensos por 24h. Resultados visíveis em 3-7 dias com efeito máximo em 14 dias.',
    'Retorno em 14 dias para avaliação de resultado. Reaplicação sugerida em 4-6 meses.',
    'Paciente tolerou bem o procedimento. Sem intercorrências. Orientada sobre cuidados pós-procedimento.',
    CURRENT_DATE + INTERVAL '14 days',
    'Dra. Ana Paula Silva - CRM 123456/SP',
    NOW() - INTERVAL '5 days'
),

-- Prontuário 2: Ricardo - Drenagem Linfática
(
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '8 days',
    'Sessão de Drenagem',
    'Paciente com edema em membros inferiores e sensação de peso nas pernas',
    'Edema vespertino há 6 meses, piora ao final do dia. Trabalha muito tempo em pé.',
    'Nega cirurgias prévias. Sem histórico de problemas vasculares.',
    'Pai hipertenso. Mãe com varizes.',
    'Sedentário. Boa alimentação. Hidratação adequada. Trabalha 8h/dia em pé.',
    '130/85 mmHg',
    85.00,
    1.78,
    26.83,
    'Edema grau I em membros inferiores bilateral. Sem sinais de estase venosa. Pele íntegra.',
    'Edema pós-laboral. Ausência de sinais de insuficiência venosa crônica.',
    'Edema postural de membros inferiores - indicação de drenagem linfática manual.',
    'Drenagem Linfática Manual - técnica Vodder, 45 minutos, membros inferiores bilateralmente',
    'Gel de massagem neutro',
    'Não prescrições medicamentosas.',
    'Elevar membros inferiores ao descansar. Usar meias de compressão durante jornada de trabalho. Caminhadas leves. Retornar em 7 dias.',
    'Protocolo de 10 sessões, 2x/semana. Associar atividade física leve e uso de meias compressivas.',
    'Paciente referiu alívio imediato da sensação de peso. Redução visível do edema pós-sessão.',
    CURRENT_DATE + INTERVAL '7 days',
    'Dr. Carlos Eduardo Souza - CREFITO 54321/SP',
    NOW() - INTERVAL '8 days'
),

-- Prontuário 3: Fernanda - Limpeza de Pele
(
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'c2222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '12 days',
    'Limpeza de Pele',
    'Paciente com comedões abertos e fechados, poros dilatados e oleosidade excessiva',
    'Acne grau I-II há 5 anos. Já realizou tratamentos tópicos anteriormente com melhora parcial.',
    'Acne desde adolescência. Sem outras comorbidades.',
    'Irmã com acne.',
    'Alimentação balanceada. Uso irregular de protetor solar. Rotina de skincare básica.',
    '115/75 mmHg',
    58.00,
    1.68,
    20.55,
    'Pele tipo III, seborreica, comedogênica. Comedões abertos e fechados em zona T. Poros dilatados.',
    'Acne comedônica grau I-II. Seborréia facial. Poros dilatados.',
    'Acne comedônica - Indicação de limpeza de pele profunda e orientação de rotina domiciliar.',
    'Limpeza de Pele Profunda: Higienização, esfoliação mecânica, extração de comedões, máscara calmante, hidratação',
    'Sabonete facial para pele oleosa, Esfoliante enzimático, Máscara de argila verde, Hidratante oil-free',
    'Ácido Salicílico 2% gel - aplicar à noite nas áreas afetadas',
    'Lavar rosto 2x/dia com sabonete específico. Usar protetor solar FPS 50+ oil-free diariamente. Aplicar ácido conforme prescrito. Retornar em 30 dias.',
    'Limpeza de pele mensal por 3 meses. Avaliação para peeling químico após estabilização do quadro.',
    'Procedimento realizado sem intercorrências. Pele com vermelhidão leve pós-extração (esperado).',
    CURRENT_DATE + INTERVAL '30 days',
    'Dra. Maria Fernanda Costa - CRM 98765/RJ',
    NOW() - INTERVAL '12 days'
),

-- Prontuário 4: Bruno - Aplicação de Botox
(
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'c2222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '15 days',
    'Consulta de Harmonização',
    'Paciente masculino deseja suavização de rugas frontais e glabelares para aparência mais jovem',
    'Rugas de expressão há 2 anos. Trabalha com público e deseja aparência mais descansada.',
    'Saudável. Nega alergias.',
    'Sem relevância para o caso.',
    'Não fumante. Pratica musculação 5x/semana. Alimentação hiperproteica.',
    '125/80 mmHg',
    82.00,
    1.80,
    25.31,
    'Pele tipo III, espessa, hiperatividade muscular frontal e glabelar.',
    'Rugas dinâmicas frontais e glabelares proeminentes. Expressão facial tensa.',
    'Rugas dinâmicas faciais - tratamento com toxina botulínica.',
    'Aplicação de Toxina Botulínica tipo A - Região frontal: 25U, Glabela: 25U, técnica conservadora masculina',
    'Toxina Botulínica tipo A 100U (Botox)',
    'Não há.',
    'Seguir protocolo padrão pós-botox. Resultado natural em 7-10 dias. Evitar saunas e ambientes muito quentes por 48h.',
    'Retorno em 15 dias. Reaplicação em 5-6 meses conforme necessidade.',
    'Procedimento realizado com sucesso. Paciente satisfeito com planejamento conservador.',
    CURRENT_DATE + INTERVAL '15 days',
    'Dra. Maria Fernanda Costa - CRM 98765/RJ',
    NOW() - INTERVAL '15 days'
),

-- Prontuário 5: Amanda - Peeling Químico
(
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555',
    'c3333333-3333-3333-3333-333333333333',
    NOW() - INTERVAL '18 days',
    'Peeling Químico',
    'Paciente com melasma facial e deseja clareamento de manchas',
    'Melasma há 3 anos, piora no verão. Já tentou cremes clareadores com resultado parcial.',
    'Melasma desde gestação. Uso de anticoncepcional oral.',
    'Mãe com melasma.',
    'Exposição solar frequente (trabalho externo). Uso irregular de protetor solar.',
    '110/70 mmHg',
    62.00,
    1.66,
    22.50,
    'Pele tipo IV. Melasma centro-facial grau II-III. Manchas acastanhadas em zigoma e região malar bilateral.',
    'Melasma epidérmico-dérmico misto. MASI score 12.',
    'Melasma facial - indicação de peeling químico de ácido glicólico 30%.',
    'Peeling Químico de Ácido Glicólico 30% - aplicação em camadas, 3 minutos, neutralização com bicarbonato',
    'Ácido Glicólico 30%, Neutralizador, Creme pós-peeling',
    'Hidroquinona 4% + Tretinoína 0,05% - aplicar à noite (já em uso). Vitamina C sérum pela manhã. Protetor solar FPS 70+ a cada 2h.',
    'Evitar sol por 7 dias. Não usar maquiagem por 48h. Hidratação intensa. Não remover descamação. OBRIGATÓRIO uso de protetor solar.',
    'Protocolo de 4 sessões mensais de peeling. Manutenção com dermocosméticos. Avaliação de laserterapia após ciclo.',
    'Ardor leve durante aplicação (normal). Eritema pós-procedimento controlado. Paciente orientada sobre fase de descamação (3-5 dias).',
    CURRENT_DATE + INTERVAL '30 days',
    'Juliana Santos - CRBM 12345/MG',
    NOW() - INTERVAL '18 days'
);

-- ====================================================================
-- 2. FAVORITOS (PRODUCT FAVORITES) - 8 records
-- ====================================================================

INSERT INTO tb_favoritos (
    id_favorito,
    id_user,
    id_produto,
    dt_criacao
) VALUES
-- Patrícia favoritou 2 produtos
('11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days'),
('12111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days'),

-- Ricardo favoritou 1 produto
('22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '7 days'),

-- Fernanda favoritou 2 produtos
('33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days'),
('33233333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '4 days'),

-- Bruno favoritou 1 produto
('44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '10 days'),

-- Amanda favoritou 2 produtos
('55555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
('55255555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '6 days');

-- ====================================================================
-- 3. CARRINHO (SHOPPING CART) - 4 records
-- ====================================================================

INSERT INTO tb_carrinho (
    id_carrinho,
    id_user,
    id_produto,
    nr_quantidade,
    vl_preco_unitario,
    dt_criacao,
    dt_atualizacao
) VALUES
-- Patrícia tem 2 produtos no carrinho
('11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 89.90, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('11211111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 2, 149.90, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),

-- Fernanda tem 1 produto no carrinho
('33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1, 79.90, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),

-- Lucas tem 1 produto no carrinho
('66666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 1, 2499.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- ====================================================================
-- 4. COMPARAÇÃO (PRODUCT COMPARISON) - 5 records
-- ====================================================================

INSERT INTO tb_comparacao (
    id_comparacao,
    id_user,
    id_produto,
    dt_criacao
) VALUES
-- Patrícia comparando protetores solares e séruns
('11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
('11211111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day'),
('11311111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day'),

-- Ricardo comparando produtos de limpeza
('22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days'),
('22322222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 days');

-- ====================================================================
-- 5. AVALIAÇÕES DE PRODUTOS - 10 records
-- ====================================================================

INSERT INTO tb_avaliacoes_produtos (
    id_avaliacao,
    id_produto,
    id_user,
    nr_estrelas,
    ds_comentario,
    st_verificado,
    st_ativo,
    nr_likes,
    dt_criacao
) VALUES
-- La Roche-Posay Anthelios (Produto 1)
(
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    5,
    'Melhor protetor solar que já usei! Textura leve, não deixa a pele oleosa e protege muito bem. Uso diariamente há 6 meses e percebi grande melhora nas manchas. Vale cada centavo!',
    true,
    true,
    24,
    NOW() - INTERVAL '45 days'
),
(
    '11121111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'b5555555-5555-5555-5555-555555555555',
    5,
    'Produto excelente! Não arde nos olhos e é resistente à água. Perfeito para quem pratica atividades ao ar livre.',
    true,
    true,
    18,
    NOW() - INTERVAL '30 days'
),

-- Vichy Minéral 89 (Produto 2)
(
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'b3333333-3333-3333-3333-333333333333',
    5,
    'Hidratação incrível! Minha pele ficou muito mais viçosa e com aspecto saudável. A textura é leve e absorve rapidinho. Já estou no segundo frasco.',
    true,
    true,
    31,
    NOW() - INTERVAL '20 days'
),
(
    '22322222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    4,
    'Muito bom! Hidrata bem e não deixa a pele pegajosa. Único ponto negativo é o preço um pouco salgado, mas vale o investimento.',
    true,
    true,
    12,
    NOW() - INTERVAL '15 days'
),

-- Bioderma Sensibio H2O (Produto 3)
(
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    5,
    'A melhor água micelar! Remove toda a maquiagem sem precisar esfregar, não resseca e não irrita. Uso há anos e não troco por nada.',
    true,
    true,
    42,
    NOW() - INTERVAL '60 days'
),

-- SkinCeuticals C E Ferulic (Produto 4)
(
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'b1111111-1111-1111-1111-111111111111',
    4,
    'Produto caro mas que funciona! Percebi melhora na luminosidade da pele e nas manchas após 2 meses de uso. O cheiro é um pouco forte mas você se acostuma.',
    true,
    true,
    28,
    NOW() - INTERVAL '50 days'
),
(
    '44544444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'b5555555-5555-5555-5555-555555555555',
    5,
    'Investimento que vale a pena! Minha pele nunca esteve tão bonita. Clareou manchas, melhorou textura e deu aquele glow natural. Recomendo muito!',
    true,
    true,
    35,
    NOW() - INTERVAL '35 days'
),

-- Avène Água Termal (Produto 5)
(
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'b2222222-2222-2222-2222-222222222222',
    5,
    'Sensação de frescor imediata! Uso após a limpeza e após exercícios. Acalma a pele e ajuda a fixar a maquiagem. Produto coringa!',
    true,
    true,
    19,
    NOW() - INTERVAL '25 days'
),

-- Microagulhamento Dermapen (Produto 6)
(
    '66666666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'b4444444-4444-4444-4444-444444444444',
    5,
    'Equipamento profissional de altíssima qualidade! Como esteticista, investi neste dermapen e os resultados nos meus clientes são incríveis. Vale cada centavo do investimento.',
    true,
    true,
    47,
    NOW() - INTERVAL '90 days'
),
(
    '66766666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'b6666666-6666-6666-6666-666666666666',
    4,
    'Excelente equipamento! A agulha é precisa e o controle de profundidade funciona perfeitamente. Único ponto é que precisa de manutenção regular, mas nada que comprometa a qualidade.',
    true,
    true,
    22,
    NOW() - INTERVAL '75 days'
);

-- ====================================================================
-- 6. PEDIDOS (ORDERS) - 5 records
-- ====================================================================

INSERT INTO tb_pedidos (
    id_pedido,
    id_user,
    nr_pedido,
    vl_subtotal,
    vl_desconto,
    vl_frete,
    vl_total,
    ds_status,
    ds_endereco_entrega,
    ds_forma_pagamento,
    ds_rastreio,
    dt_pedido,
    dt_confirmacao,
    dt_pagamento,
    dt_envio,
    dt_entrega,
    ds_observacoes
) VALUES
-- Pedido 1: Patrícia (Entregue)
(
    '11111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'PED-2025-00001',
    239.80,
    24.00,
    15.90,
    231.70,
    'entregue',
    '{"logradouro": "Rua das Flores", "numero": "123", "complemento": "Apto 45", "bairro": "Jardins", "cidade": "São Paulo", "estado": "SP", "cep": "01452-000"}'::jsonb,
    'Cartão de Crédito',
    'BR123456789SP',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '23 days',
    NOW() - INTERVAL '20 days',
    'Entregar no portão com o porteiro'
),

-- Pedido 2: Fernanda (Entregue)
(
    '22222222-2222-2222-2222-222222222222',
    'b3333333-3333-3333-3333-333333333333',
    'PED-2025-00002',
    159.80,
    0.00,
    12.50,
    172.30,
    'entregue',
    '{"logradouro": "Av. Atlântica", "numero": "456", "complemento": "Cobertura", "bairro": "Copacabana", "cidade": "Rio de Janeiro", "estado": "RJ", "cep": "22021-000"}'::jsonb,
    'PIX',
    'RJ987654321BR',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '16 days',
    NOW() - INTERVAL '13 days',
    null
),

-- Pedido 3: Amanda (Em Trânsito)
(
    '33333333-3333-3333-3333-333333333333',
    'b5555555-5555-5555-5555-555555555555',
    'PED-2025-00003',
    579.00,
    57.90,
    0.00,
    521.10,
    'em_transito',
    '{"logradouro": "Rua da Bahia", "numero": "789", "complemento": null, "bairro": "Centro", "cidade": "Belo Horizonte", "estado": "MG", "cep": "30160-011"}'::jsonb,
    'Cartão de Crédito',
    'MG456789123BR',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days',
    null,
    'Frete grátis acima de R$ 500'
),

-- Pedido 4: Ricardo (Confirmado - Aguardando Envio)
(
    '44444444-4444-4444-4444-444444444444',
    'b2222222-2222-2222-2222-222222222222',
    'PED-2025-00004',
    229.70,
    0.00,
    18.90,
    248.60,
    'confirmado',
    '{"logradouro": "Rua XV de Novembro", "numero": "321", "complemento": "Casa", "bairro": "Centro", "cidade": "Curitiba", "estado": "PR", "cep": "80020-310"}'::jsonb,
    'Cartão de Débito',
    null,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    null,
    null,
    null
),

-- Pedido 5: Bruno (Profissional - Equipamento - Entregue)
(
    '55555555-5555-5555-5555-555555555555',
    'b4444444-4444-4444-4444-444444444444',
    'PED-2025-00005',
    2499.00,
    0.00,
    0.00,
    2499.00,
    'entregue',
    '{"logradouro": "Av. Paulista", "numero": "1000", "complemento": "Sala 1501", "bairro": "Bela Vista", "cidade": "São Paulo", "estado": "SP", "cep": "01310-100"}'::jsonb,
    'Boleto Bancário',
    'SP789456123BR',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '44 days',
    NOW() - INTERVAL '43 days',
    NOW() - INTERVAL '41 days',
    NOW() - INTERVAL '38 days',
    'Entrega comercial - Horário: 9h às 18h'
);

-- ====================================================================
-- 7. ITENS DOS PEDIDOS (ORDER ITEMS) - 12 records
-- ====================================================================

INSERT INTO tb_pedido_itens (
    id_item,
    id_pedido,
    id_produto,
    nm_produto,
    vl_preco_unitario,
    nr_quantidade,
    vl_subtotal,
    ds_imagem_url
) VALUES
-- Itens do Pedido 1 (Patrícia)
(
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'La Roche-Posay Anthelios Protetor Solar FPS 70',
    89.90,
    1,
    89.90,
    '/produtos/la-roche-posay-anthelios.jpg'
),
(
    '11211111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Vichy Minéral 89 Sérum Hidratante',
    149.90,
    1,
    149.90,
    '/produtos/vichy-mineral-89.jpg'
),

-- Itens do Pedido 2 (Fernanda)
(
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'Bioderma Sensibio H2O Água Micelar 500ml',
    79.90,
    2,
    159.80,
    '/produtos/bioderma-sensibio.jpg'
),

-- Itens do Pedido 3 (Amanda)
(
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'La Roche-Posay Anthelios Protetor Solar FPS 70',
    89.90,
    1,
    89.90,
    '/produtos/la-roche-posay-anthelios.jpg'
),
(
    '33233333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    'SkinCeuticals C E Ferulic Sérum Antioxidante',
    489.00,
    1,
    489.00,
    '/produtos/skinceuticals-ce-ferulic.jpg'
),

-- Itens do Pedido 4 (Ricardo)
(
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'Bioderma Sensibio H2O Água Micelar 500ml',
    79.90,
    1,
    79.90,
    '/produtos/bioderma-sensibio.jpg'
),
(
    '44544444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'Vichy Minéral 89 Sérum Hidratante',
    149.90,
    1,
    149.90,
    '/produtos/vichy-mineral-89.jpg'
),

-- Itens do Pedido 5 (Bruno - Equipamento Profissional)
(
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    'Microagulhamento Dermapen Profissional',
    2499.00,
    1,
    2499.00,
    '/produtos/dermapen-profissional.jpg'
);

-- ====================================================================
-- UPDATE PRODUCT STATISTICS
-- ====================================================================

-- Update products with reviews and sales count
UPDATE tb_produtos SET
    nr_avaliacao_media = 5.0,
    nr_total_avaliacoes = 2,
    nr_total_vendas = 3,
    nr_quantidade_estoque = nr_quantidade_estoque - 3
WHERE id_produto = '11111111-1111-1111-1111-111111111111';

UPDATE tb_produtos SET
    nr_avaliacao_media = 4.5,
    nr_total_avaliacoes = 2,
    nr_total_vendas = 3,
    nr_quantidade_estoque = nr_quantidade_estoque - 3
WHERE id_produto = '22222222-2222-2222-2222-222222222222';

UPDATE tb_produtos SET
    nr_avaliacao_media = 5.0,
    nr_total_avaliacoes = 1,
    nr_total_vendas = 3,
    nr_quantidade_estoque = nr_quantidade_estoque - 3
WHERE id_produto = '33333333-3333-3333-3333-333333333333';

UPDATE tb_produtos SET
    nr_avaliacao_media = 4.5,
    nr_total_avaliacoes = 2,
    nr_total_vendas = 2,
    nr_quantidade_estoque = nr_quantidade_estoque - 2
WHERE id_produto = '44444444-4444-4444-4444-444444444444';

UPDATE tb_produtos SET
    nr_avaliacao_media = 5.0,
    nr_total_avaliacoes = 1,
    nr_total_vendas = 0
WHERE id_produto = '55555555-5555-5555-5555-555555555555';

UPDATE tb_produtos SET
    nr_avaliacao_media = 4.5,
    nr_total_avaliacoes = 2,
    nr_total_vendas = 1,
    nr_quantidade_estoque = nr_quantidade_estoque - 1
WHERE id_produto = '66666666-6666-6666-6666-666666666666';

-- ====================================================================
-- END OF SEED SCRIPT
-- ====================================================================
