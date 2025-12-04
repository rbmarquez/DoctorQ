-- =============================================
-- DoctorQ - Seed 002: Produtos e Categorias
-- =============================================
-- Descrição: Dados de exemplo de produtos
-- Data: 2025-01-23
-- =============================================

-- Obter IDs de fornecedores para usar nos produtos
DO $$
DECLARE
    v_fornecedor_1 UUID;
    v_fornecedor_2 UUID;
    v_fornecedor_3 UUID;
    v_fornecedor_4 UUID;
    v_fornecedor_5 UUID;
    v_fornecedor_6 UUID;

    v_cat_facial UUID;
    v_cat_corporal UUID;
    v_cat_capilar UUID;
    v_cat_maquiagem UUID;
    v_cat_equipamentos UUID;
    v_cat_higiene UUID;
BEGIN
    -- Pegar IDs dos fornecedores
    SELECT id_fornecedor INTO v_fornecedor_1 FROM tb_fornecedores WHERE nm_empresa = 'Beleza Premium Distribuidora' LIMIT 1;
    SELECT id_fornecedor INTO v_fornecedor_2 FROM tb_fornecedores WHERE nm_empresa = 'Estética Professional Supply' LIMIT 1;
    SELECT id_fornecedor INTO v_fornecedor_3 FROM tb_fornecedores WHERE nm_empresa = 'Bio Natural Cosméticos' LIMIT 1;
    SELECT id_fornecedor INTO v_fornecedor_4 FROM tb_fornecedores WHERE nm_empresa = 'Derma Science Brasil' LIMIT 1;
    SELECT id_fornecedor INTO v_fornecedor_5 FROM tb_fornecedores WHERE nm_empresa = 'MakeUp Pro Studio' LIMIT 1;
    SELECT id_fornecedor INTO v_fornecedor_6 FROM tb_fornecedores WHERE nm_empresa = 'Hair Care Professional' LIMIT 1;

    -- Pegar IDs das categorias
    SELECT id_categoria INTO v_cat_facial FROM tb_categorias_produtos WHERE nm_categoria = 'Cuidados Faciais' LIMIT 1;
    SELECT id_categoria INTO v_cat_corporal FROM tb_categorias_produtos WHERE nm_categoria = 'Cuidados Corporais' LIMIT 1;
    SELECT id_categoria INTO v_cat_capilar FROM tb_categorias_produtos WHERE nm_categoria = 'Cuidados Capilares' LIMIT 1;
    SELECT id_categoria INTO v_cat_maquiagem FROM tb_categorias_produtos WHERE nm_categoria = 'Maquiagem' LIMIT 1;
    SELECT id_categoria INTO v_cat_equipamentos FROM tb_categorias_produtos WHERE nm_categoria = 'Equipamentos' LIMIT 1;
    SELECT id_categoria INTO v_cat_higiene FROM tb_categorias_produtos WHERE nm_categoria = 'Higiene' LIMIT 1;

    -- Inserir produtos faciais
    INSERT INTO tb_produtos (
        id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug,
        ds_sku, ds_marca, ds_tags, vl_preco, vl_preco_promocional, nr_estoque,
        ds_imagem_principal, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes
    ) VALUES
        (
            v_fornecedor_1, v_cat_facial,
            'Sérum Anti-idade Vitamina C 30ml',
            'Sérum facial concentrado com vitamina C pura estabilizada. Ação antioxidante, clareadora e rejuvenescedora. Indicado para todos os tipos de pele, especialmente para peles maduras com sinais de envelhecimento.',
            'Sérum concentrado com vitamina C pura para rejuvenescimento facial',
            'serum-anti-idade-vitamina-c-30ml',
            'SER-VITC-30ML',
            'Derma Science',
            ARRAY['vitamina c', 'anti-idade', 'clareador', 'antioxidante', 'sérum'],
            189.90, 159.90, 45,
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
            true, true, 4.8, 234
        ),
        (
            v_fornecedor_1, v_cat_facial,
            'Máscara Facial de Argila Verde 120g',
            'Máscara facial purificante com argila verde natural. Remove impurezas, controla oleosidade e minimiza poros. Rica em minerais essenciais para pele saudável.',
            'Máscara purificante de argila verde para peles oleosas',
            'mascara-facial-argila-verde-120g',
            'MASK-ARG-120G',
            'Bio Natural',
            ARRAY['máscara', 'argila verde', 'purificante', 'poros', 'oleosidade'],
            79.90, NULL, 78,
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883',
            true, false, 4.6, 156
        ),
        (
            v_fornecedor_4, v_cat_facial,
            'Creme Facial Ácido Hialurônico 50g',
            'Creme hidratante de alta performance com ácido hialurônico de baixo peso molecular. Penetração profunda, hidratação intensa e efeito preenchedor. Textura leve não comedogênica.',
            'Creme hidratante com ácido hialurônico de alta absorção',
            'creme-facial-acido-hialuronico-50g',
            'CRE-HIAL-50G',
            'Derma Science',
            ARRAY['ácido hialurônico', 'hidratante', 'anti-idade', 'preenchedor'],
            149.90, 129.90, 62,
            'https://images.unsplash.com/photo-1556228852-80f63f77c2e5',
            true, true, 4.9, 389
        ),
        (
            v_fornecedor_3, v_cat_facial,
            'Óleo Facial de Rosa Mosqueta Orgânico 30ml',
            'Óleo facial 100% puro e orgânico de rosa mosqueta. Rico em ácidos graxos essenciais e vitamina A natural. Regenera, cicatriza e uniformiza o tom da pele.',
            'Óleo puro de rosa mosqueta orgânico para regeneração',
            'oleo-facial-rosa-mosqueta-organico-30ml',
            'OIL-ROSM-30ML',
            'Bio Natural',
            ARRAY['óleo facial', 'rosa mosqueta', 'orgânico', 'vegano', 'regenerador'],
            119.90, NULL, 34,
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b',
            true, false, 4.7, 145
        ),

    -- Produtos corporais
        (
            v_fornecedor_1, v_cat_corporal,
            'Gel Redutor de Medidas Cafeína 500ml',
            'Gel corporal termo ativado com alta concentração de cafeína, L-carnitina e extrato de centella asiática. Ação liporreductora e drenante. Uso profissional.',
            'Gel redutor profissional com cafeína e termo ativação',
            'gel-redutor-medidas-cafeina-500ml',
            'GEL-RED-500ML',
            'Spa Wellness',
            ARRAY['redutor', 'cafeína', 'termo ativado', 'drenante', 'profissional'],
            159.90, 139.90, 52,
            'https://images.unsplash.com/photo-1556228578-0d85b1a4d571',
            true, false, 4.5, 98
        ),
        (
            v_fornecedor_3, v_cat_corporal,
            'Esfoliante Corporal Coffee Scrub 250g',
            'Esfoliante corporal natural com café orgânico, açúcar mascavo e óleo de coco. Remove células mortas, ativa circulação e deixa pele macia e perfumada.',
            'Esfoliante natural de café orgânico para corpo',
            'esfoliante-corporal-coffee-scrub-250g',
            'ESF-COFF-250G',
            'Bio Natural',
            ARRAY['esfoliante', 'café', 'orgânico', 'natural', 'vegano'],
            89.90, NULL, 67,
            'https://images.unsplash.com/photo-1556228720-195a672e8a03',
            true, false, 4.8, 203
        ),
        (
            v_fornecedor_1, v_cat_corporal,
            'Creme Anti-Celulite Intensive 200ml',
            'Creme anti-celulite de ação intensiva com retinol, cafeína e extrato de ivy. Melhora aspecto de celulite grau 2 e 3. Resultados visíveis em 30 dias.',
            'Creme anti-celulite intensivo com resultados comprovados',
            'creme-anti-celulite-intensive-200ml',
            'CRE-CEL-200ML',
            'Beleza Premium',
            ARRAY['anti-celulite', 'retinol', 'firmador', 'intensivo'],
            179.90, NULL, 41,
            'https://images.unsplash.com/photo-1556228841-5c5e9c2e8dae',
            true, true, 4.6, 167
        ),

    -- Produtos capilares
        (
            v_fornecedor_6, v_cat_capilar,
            'Máscara Capilar Reconstrução Profunda 1kg',
            'Máscara de reconstrução intensiva para cabelos danificados. Fórmula com queratina hidrolisada, colágeno e pantenol. Recupera fios quimicamente tratados.',
            'Máscara reconstrutora profissional para cabelos danificados',
            'mascara-capilar-reconstrucao-profunda-1kg',
            'MASK-CAP-1KG',
            'Hair Care Pro',
            ARRAY['reconstrução', 'queratina', 'máscara capilar', 'profissional'],
            149.90, 129.90, 35,
            'https://images.unsplash.com/photo-1522338242992-e1a54906a8da',
            true, false, 4.9, 287
        ),
        (
            v_fornecedor_6, v_cat_capilar,
            'Ampola de Tratamento Capilar Vitamina E 15ml',
            'Ampola de tratamento intensivo com vitamina E, ácidos graxos e filtro UV. Ação antioxidante, brilho extremo e proteção térmica.',
            'Ampola vitamina E para brilho e proteção',
            'ampola-tratamento-capilar-vitamina-e-15ml',
            'AMP-VITE-15ML',
            'Hair Care Pro',
            ARRAY['ampola', 'vitamina e', 'brilho', 'proteção térmica', 'tratamento'],
            29.90, NULL, 120,
            'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388',
            true, false, 4.7, 412
        ),

    -- Produtos de maquiagem
        (
            v_fornecedor_5, v_cat_maquiagem,
            'Base Líquida HD Alta Cobertura 30ml - Tom 02',
            'Base líquida de alta cobertura com acabamento matte. Tecnologia HD para fotos perfeitas. Longa duração 12h. Diversos tons para pele brasileira.',
            'Base líquida profissional HD longa duração',
            'base-liquida-hd-alta-cobertura-30ml-tom-02',
            'BASE-HD-02-30ML',
            'MakeUp Pro',
            ARRAY['base', 'maquiagem', 'hd', 'alta cobertura', 'profissional'],
            89.90, NULL, 88,
            'https://images.unsplash.com/photo-1512496015851-a90fb38ba796',
            true, true, 4.9, 456
        ),
        (
            v_fornecedor_5, v_cat_maquiagem,
            'Paleta de Sombras Nude Collection 18 Cores',
            'Paleta profissional com 18 sombras em tons nude. Acabamentos matte, shimmer e glitter. Alta pigmentação e longa duração.',
            'Paleta 18 sombras nude para maquiadores profissionais',
            'paleta-sombras-nude-collection-18-cores',
            'PAL-NUDE-18C',
            'MakeUp Pro',
            ARRAY['sombra', 'paleta', 'nude', 'profissional', 'maquiagem'],
            159.90, 139.90, 45,
            'https://images.unsplash.com/photo-1583241800698-23e51b2ef9ed',
            true, true, 4.8, 324
        ),

    -- Equipamentos
        (
            v_fornecedor_2, v_cat_equipamentos,
            'Aparelho de Radiofrequência Facial e Corporal',
            'Equipamento profissional de radiofrequência bipolar. 3 aplicadores (facial, corporal e olhos). Tela touch screen. Protocolo pré-programado. 110V/220V.',
            'Radiofrequência bipolar profissional com 3 aplicadores',
            'aparelho-radiofrequencia-facial-corporal',
            'EQ-RF-FACIAL',
            'Tech Estética',
            ARRAY['radiofrequência', 'equipamento', 'facial', 'corporal', 'profissional'],
            8990.00, 7990.00, 5,
            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
            true, true, 4.9, 34
        ),
        (
            v_fornecedor_2, v_cat_equipamentos,
            'Maca Elétrica para Estética 3 Motores',
            'Maca elétrica profissional com 3 motores independentes. Elevação de altura, encosto e apoio de pernas. Capacidade 180kg. Estofado em corino branco.',
            'Maca elétrica profissional 3 motores',
            'maca-eletrica-estetica-3-motores',
            'EQ-MACA-3MT',
            'Spa Wellness',
            ARRAY['maca', 'equipamento', 'elétrica', 'profissional', 'mobiliário'],
            3490.00, NULL, 8,
            'https://images.unsplash.com/photo-1519494140681-8b17d830a3e9',
            true, false, 4.7, 23
        ),

    -- Produtos de higiene
        (
            v_fornecedor_4, v_cat_higiene,
            'Sabonete Líquido Facial Purificante 200ml',
            'Sabonete líquido facial com ácido salicílico e tea tree. Limpeza profunda, controle de oleosidade. Indicado para peles acneicas e mistas.',
            'Sabonete líquido purificante para peles acneicas',
            'sabonete-liquido-facial-purificante-200ml',
            'SAB-PUR-200ML',
            'Derma Science',
            ARRAY['sabonete', 'limpeza', 'purificante', 'acne', 'facial'],
            59.90, NULL, 92,
            'https://images.unsplash.com/photo-1556228720-195a672e8a03',
            true, false, 4.6, 198
        );

END $$;

-- Verificar inserção
SELECT
    p.nm_produto,
    c.nm_categoria,
    f.nm_empresa as fornecedor,
    p.vl_preco,
    p.nr_avaliacao_media,
    p.st_destaque
FROM tb_produtos p
LEFT JOIN tb_categorias_produtos c ON p.id_categoria = c.id_categoria
LEFT JOIN tb_fornecedores f ON p.id_fornecedor = f.id_fornecedor
WHERE p.ds_slug IS NOT NULL
ORDER BY c.nm_categoria, p.nm_produto;

-- =============================================
-- FIM DO SEED
-- =============================================
