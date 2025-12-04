-- =============================================
-- DoctorQ - Seed 003: Produtos (Inserção Direta)
-- =============================================
-- Descrição: Produtos de exemplo - inserção direta
-- Data: 2025-01-23
-- =============================================

-- Produto 1: Sérum Vitamina C
INSERT INTO tb_produtos (
    id_fornecedor,
    id_categoria,
    nm_produto,
    ds_descricao,
    ds_descricao_curta,
    ds_slug,
    ds_sku,
    ds_marca,
    ds_tags,
    vl_preco,
    vl_preco_promocional,
    nr_estoque,
    st_estoque,
    nr_quantidade_estoque,
    ds_imagem_url,
    st_ativo,
    st_destaque,
    nr_avaliacao_media,
    nr_total_avaliacoes
) SELECT
    f.id_fornecedor,
    c.id_categoria,
    'Sérum Anti-idade Vitamina C 30ml',
    'Sérum facial concentrado com vitamina C pura estabilizada. Ação antioxidante, clareadora e rejuvenescedora. Indicado para todos os tipos de pele, especialmente para peles maduras com sinais de envelhecimento.',
    'Sérum concentrado com vitamina C pura para rejuvenescimento facial',
    'serum-anti-idade-vitamina-c-30ml',
    'SER-VITC-30ML',
    'Derma Science',
    ARRAY['vitamina c', 'anti-idade', 'clareador', 'antioxidante', 'sérum'],
    189.90, 159.90, 45, true, 45,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
    true, true, 4.8, 234
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Beleza Premium Distribuidora'
  AND c.nm_categoria = 'Cuidados Faciais'
LIMIT 1;

-- Produto 2: Máscara de Argila
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Máscara Facial de Argila Verde 120g',
    'Máscara facial purificante com argila verde natural. Remove impurezas, controla oleosidade e minimiza poros. Rica em minerais essenciais para pele saudável.',
    'Máscara purificante de argila verde para peles oleosas',
    'mascara-facial-argila-verde-120g', 'MASK-ARG-120G',
    'Bio Natural', ARRAY['máscara', 'argila verde', 'purificante', 'poros', 'oleosidade'],
    79.90, 78, true, 78,
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883',
    true, false, 4.6, 156
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Bio Natural Cosméticos' AND c.nm_categoria = 'Cuidados Faciais' LIMIT 1;

-- Produto 3: Creme Ácido Hialurônico
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, vl_preco_promocional, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Creme Facial Ácido Hialurônico 50g',
    'Creme hidratante de alta performance com ácido hialurônico de baixo peso molecular. Penetração profunda, hidratação intensa e efeito preenchedor.',
    'Creme hidratante com ácido hialurônico de alta absorção',
    'creme-facial-acido-hialuronico-50g', 'CRE-HIAL-50G',
    'Derma Science', ARRAY['ácido hialurônico', 'hidratante', 'anti-idade', 'preenchedor'],
    149.90, 129.90, 62, true, 62,
    'https://images.unsplash.com/photo-1556228852-80f63f77c2e5',
    true, true, 4.9, 389
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Derma Science Brasil' AND c.nm_categoria = 'Cuidados Faciais' LIMIT 1;

-- Produto 4: Óleo de Rosa Mosqueta
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes, st_vegano, st_organico
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Óleo Facial de Rosa Mosqueta Orgânico 30ml',
    'Óleo facial 100% puro e orgânico de rosa mosqueta. Rico em ácidos graxos essenciais e vitamina A natural. Regenera, cicatriza e uniformiza o tom da pele.',
    'Óleo puro de rosa mosqueta orgânico para regeneração',
    'oleo-facial-rosa-mosqueta-organico-30ml', 'OIL-ROSM-30ML',
    'Bio Natural', ARRAY['óleo facial', 'rosa mosqueta', 'orgânico', 'vegano', 'regenerador'],
    119.90, 34, true, 34,
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b',
    true, 4.7, 145, true, true
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Bio Natural Cosméticos' AND c.nm_categoria = 'Cuidados Faciais' LIMIT 1;

-- Produto 5: Gel Redutor
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, vl_preco_promocional, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Gel Redutor de Medidas Cafeína 500ml',
    'Gel corporal termo ativado com alta concentração de cafeína, L-carnitina e extrato de centella asiática. Ação liporreductora e drenante. Uso profissional.',
    'Gel redutor profissional com cafeína e termo ativação',
    'gel-redutor-medidas-cafeina-500ml', 'GEL-RED-500ML',
    'Spa Wellness', ARRAY['redutor', 'cafeína', 'termo ativado', 'drenante', 'profissional'],
    159.90, 139.90, 52, true, 52,
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571',
    true, 4.5, 98
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Spa & Wellness Supply' AND c.nm_categoria = 'Cuidados Corporais' LIMIT 1;

-- Produto 6: Esfoliante Coffee
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes, st_vegano, st_organico
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Esfoliante Corporal Coffee Scrub 250g',
    'Esfoliante corporal natural com café orgânico, açúcar mascavo e óleo de coco. Remove células mortas, ativa circulação e deixa pele macia e perfumada.',
    'Esfoliante natural de café orgânico para corpo',
    'esfoliante-corporal-coffee-scrub-250g', 'ESF-COFF-250G',
    'Bio Natural', ARRAY['esfoliante', 'café', 'orgânico', 'natural', 'vegano'],
    89.90, 67, true, 67,
    'https://images.unsplash.com/photo-1556228720-195a672e8a03',
    true, 4.8, 203, true, true
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Bio Natural Cosméticos' AND c.nm_categoria = 'Cuidados Corporais' LIMIT 1;

-- Produto 7: Máscara Capilar
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, vl_preco_promocional, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Máscara Capilar Reconstrução Profunda 1kg',
    'Máscara de reconstrução intensiva para cabelos danificados. Fórmula com queratina hidrolisada, colágeno e pantenol. Recupera fios quimicamente tratados.',
    'Máscara reconstrutora profissional para cabelos danificados',
    'mascara-capilar-reconstrucao-profunda-1kg', 'MASK-CAP-1KG',
    'Hair Care Pro', ARRAY['reconstrução', 'queratina', 'máscara capilar', 'profissional'],
    149.90, 129.90, 35, true, 35,
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da',
    true, 4.9, 287
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Hair Care Professional' AND c.nm_categoria = 'Cuidados Capilares' LIMIT 1;

-- Produto 8: Base Líquida
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Base Líquida HD Alta Cobertura 30ml - Tom 02',
    'Base líquida de alta cobertura com acabamento matte. Tecnologia HD para fotos perfeitas. Longa duração 12h. Diversos tons para pele brasileira.',
    'Base líquida profissional HD longa duração',
    'base-liquida-hd-alta-cobertura-30ml-tom-02', 'BASE-HD-02-30ML',
    'MakeUp Pro', ARRAY['base', 'maquiagem', 'hd', 'alta cobertura', 'profissional'],
    89.90, 88, true, 88,
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796',
    true, true, 4.9, 456
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'MakeUp Pro Studio' AND c.nm_categoria = 'Maquiagem' LIMIT 1;

-- Produto 9: Radiofrequência
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, vl_preco_promocional, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Aparelho de Radiofrequência Facial e Corporal',
    'Equipamento profissional de radiofrequência bipolar. 3 aplicadores (facial, corporal e olhos). Tela touch screen. Protocolo pré-programado. 110V/220V.',
    'Radiofrequência bipolar profissional com 3 aplicadores',
    'aparelho-radiofrequencia-facial-corporal', 'EQ-RF-FACIAL',
    'Tech Estética', ARRAY['radiofrequência', 'equipamento', 'facial', 'corporal', 'profissional'],
    8990.00, 7990.00, 5, true, 5,
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    true, true, 4.9, 34
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Tech Estética Equipamentos' AND c.nm_categoria = 'Equipamentos' LIMIT 1;

-- Produto 10: Sabonete Purificante
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta, ds_slug, ds_sku,
    ds_marca, ds_tags, vl_preco, nr_estoque, st_estoque, nr_quantidade_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Sabonete Líquido Facial Purificante 200ml',
    'Sabonete líquido facial com ácido salicílico e tea tree. Limpeza profunda, controle de oleosidade. Indicado para peles acneicas e mistas.',
    'Sabonete líquido purificante para peles acneicas',
    'sabonete-liquido-facial-purificante-200ml', 'SAB-PUR-200ML',
    'Derma Science', ARRAY['sabonete', 'limpeza', 'purificante', 'acne', 'facial'],
    59.90, 92, true, 92,
    'https://images.unsplash.com/photo-1556228720-195a672e8a03',
    true, 4.6, 198
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Derma Science Brasil' AND c.nm_categoria = 'Higiene' LIMIT 1;

-- Relatório
SELECT
    COUNT(*) as total_produtos_apos_insert,
    COUNT(*) FILTER (WHERE id_fornecedor IS NOT NULL) as com_fornecedor,
    COUNT(*) FILTER (WHERE id_categoria IS NOT NULL) as com_categoria
FROM tb_produtos;

SELECT nm_produto, vl_preco, nr_avaliacao_media
FROM tb_produtos
WHERE ds_sku LIKE 'SER-%' OR ds_sku LIKE 'MASK-%' OR ds_sku LIKE 'CRE-%'
   OR ds_sku LIKE 'OIL-%' OR ds_sku LIKE 'GEL-%' OR ds_sku LIKE 'ESF-%'
   OR ds_sku LIKE 'BASE-%' OR ds_sku LIKE 'EQ-%' OR ds_sku LIKE 'SAB-%'
ORDER BY vl_preco DESC;

-- =============================================
-- FIM DO SEED
-- =============================================
