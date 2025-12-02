-- =============================================
-- DoctorQ - Seed 004: Produtos (Schema Correto)
-- =============================================
-- Descrição: Produtos usando schema real da tabela
-- Data: 2025-01-23
-- =============================================

-- Produto 1: Sérum Vitamina C
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, vl_preco_promocional, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Sérum Anti-idade Vitamina C 30ml',
    'Sérum facial concentrado com vitamina C pura estabilizada. Ação antioxidante, clareadora e rejuvenescedora.',
    'Sérum concentrado com vitamina C pura',
    'serum-anti-idade-vitamina-c-30ml', 'SER-VITC-30ML', 'Derma Science',
    ARRAY['vitamina c', 'anti-idade', 'clareador'],
    189.90, 159.90, 45, true,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
    true, true, 4.8, 234,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Beleza Premium Distribuidora' AND c.nm_categoria = 'Cuidados Faciais' LIMIT 1;

-- Produto 2: Máscara de Argila
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Máscara Facial de Argila Verde 120g',
    'Máscara facial purificante com argila verde natural. Remove impurezas e controla oleosidade.',
    'Máscara purificante de argila verde',
    'mascara-facial-argila-verde-120g', 'MASK-ARG-120G', 'Bio Natural',
    ARRAY['máscara', 'argila verde', 'purificante'],
    79.90, 78, true,
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883',
    true, 4.6, 156,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Bio Natural Cosméticos' AND c.nm_categoria = 'Cuidados Faciais' LIMIT 1;

-- Produto 3: Creme Ácido Hialurônico
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, vl_preco_promocional, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Creme Facial Ácido Hialurônico 50g',
    'Creme hidratante de alta performance com ácido hialurônico de baixo peso molecular.',
    'Creme hidratante com ácido hialurônico',
    'creme-facial-acido-hialuronico-50g', 'CRE-HIAL-50G', 'Derma Science',
    ARRAY['ácido hialurônico', 'hidratante', 'anti-idade'],
    149.90, 129.90, 62, true,
    'https://images.unsplash.com/photo-1556228852-80f63f77c2e5',
    true, true, 4.9, 389,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Derma Science Brasil' AND c.nm_categoria = 'Cuidados Faciais' LIMIT 1;

-- Produto 4: Óleo de Rosa Mosqueta
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes,
    st_vegano, st_organico, ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Óleo Facial de Rosa Mosqueta Orgânico 30ml',
    'Óleo facial 100% puro e orgânico de rosa mosqueta. Rico em ácidos graxos essenciais.',
    'Óleo puro de rosa mosqueta orgânico',
    'oleo-facial-rosa-mosqueta-organico-30ml', 'OIL-ROSM-30ML', 'Bio Natural',
    ARRAY['óleo facial', 'rosa mosqueta', 'orgânico'],
    119.90, 34, true,
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b',
    true, 4.7, 145,
    true, true, c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Bio Natural Cosméticos' AND c.nm_categoria = 'Cuidados Faciais' LIMIT 1;

-- Produto 5: Gel Redutor
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, vl_preco_promocional, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Gel Redutor de Medidas Cafeína 500ml',
    'Gel corporal termo ativado com cafeína. Ação liporreductora e drenante. Uso profissional.',
    'Gel redutor profissional com cafeína',
    'gel-redutor-medidas-cafeina-500ml', 'GEL-RED-500ML', 'Spa Wellness',
    ARRAY['redutor', 'cafeína', 'drenante'],
    159.90, 139.90, 52, true,
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571',
    true, 4.5, 98,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Spa & Wellness Supply' AND c.nm_categoria = 'Cuidados Corporais' LIMIT 1;

-- Produto 6: Esfoliante Coffee
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes,
    st_vegano, st_organico, ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Esfoliante Corporal Coffee Scrub 250g',
    'Esfoliante corporal natural com café orgânico. Remove células mortas e ativa circulação.',
    'Esfoliante natural de café orgânico',
    'esfoliante-corporal-coffee-scrub-250g', 'ESF-COFF-250G', 'Bio Natural',
    ARRAY['esfoliante', 'café', 'orgânico'],
    89.90, 67, true,
    'https://images.unsplash.com/photo-1556228720-195a672e8a03',
    true, 4.8, 203,
    true, true, c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Bio Natural Cosméticos' AND c.nm_categoria = 'Cuidados Corporais' LIMIT 1;

-- Produto 7: Máscara Capilar
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, vl_preco_promocional, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Máscara Capilar Reconstrução Profunda 1kg',
    'Máscara de reconstrução intensiva para cabelos danificados. Com queratina e colágeno.',
    'Máscara reconstrutora profissional',
    'mascara-capilar-reconstrucao-profunda-1kg', 'MASK-CAP-1KG', 'Hair Care Pro',
    ARRAY['reconstrução', 'queratina', 'profissional'],
    149.90, 129.90, 35, true,
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da',
    true, 4.9, 287,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Hair Care Professional' AND c.nm_categoria = 'Cuidados Capilares' LIMIT 1;

-- Produto 8: Base Líquida
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Base Líquida HD Alta Cobertura 30ml - Tom 02',
    'Base líquida de alta cobertura com acabamento matte. Tecnologia HD. Longa duração 12h.',
    'Base líquida profissional HD',
    'base-liquida-hd-alta-cobertura-30ml-tom-02', 'BASE-HD-02-30ML', 'MakeUp Pro',
    ARRAY['base', 'maquiagem', 'hd'],
    89.90, 88, true,
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796',
    true, true, 4.9, 456,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'MakeUp Pro Studio' AND c.nm_categoria = 'Maquiagem' LIMIT 1;

-- Produto 9: Radiofrequência
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, vl_preco_promocional, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, st_destaque, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Aparelho de Radiofrequência Facial e Corporal',
    'Equipamento profissional de radiofrequência bipolar. 3 aplicadores. 110V/220V.',
    'Radiofrequência bipolar profissional',
    'aparelho-radiofrequencia-facial-corporal', 'EQ-RF-FACIAL', 'Tech Estética',
    ARRAY['radiofrequência', 'equipamento', 'profissional'],
    8990.00, 7990.00, 5, true,
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    true, true, 4.9, 34,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Tech Estética Equipamentos' AND c.nm_categoria = 'Equipamentos' LIMIT 1;

-- Produto 10: Sabonete Purificante
INSERT INTO tb_produtos (
    id_fornecedor, id_categoria, nm_produto, ds_descricao, ds_descricao_curta,
    ds_slug, ds_sku, ds_marca, ds_tags,
    vl_preco, nr_quantidade_estoque, st_estoque,
    ds_imagem_url, st_ativo, nr_avaliacao_media, nr_total_avaliacoes,
    ds_categoria
) SELECT
    f.id_fornecedor, c.id_categoria,
    'Sabonete Líquido Facial Purificante 200ml',
    'Sabonete líquido facial com ácido salicílico. Controle de oleosidade.',
    'Sabonete líquido purificante',
    'sabonete-liquido-facial-purificante-200ml', 'SAB-PUR-200ML', 'Derma Science',
    ARRAY['sabonete', 'limpeza', 'purificante'],
    59.90, 92, true,
    'https://images.unsplash.com/photo-1556228720-195a672e8a03',
    true, 4.6, 198,
    c.nm_categoria
FROM tb_fornecedores f, tb_categorias_produtos c
WHERE f.nm_empresa = 'Derma Science Brasil' AND c.nm_categoria = 'Higiene' LIMIT 1;

-- Relatório Final
SELECT
    'Produtos inseridos com sucesso!' as status,
    COUNT(*) as total_produtos,
    COUNT(*) FILTER (WHERE id_fornecedor IS NOT NULL) as com_fornecedor,
    COUNT(*) FILTER (WHERE id_categoria IS NOT NULL) as com_categoria,
    COUNT(*) FILTER (WHERE ds_sku LIKE 'SER-%' OR ds_sku LIKE 'MASK-%' OR ds_sku LIKE 'CRE-%'
                      OR ds_sku LIKE 'OIL-%' OR ds_sku LIKE 'GEL-%' OR ds_sku LIKE 'ESF-%'
                      OR ds_sku LIKE 'BASE-%' OR ds_sku LIKE 'EQ-%' OR ds_sku LIKE 'SAB-%') as novos_produtos
FROM tb_produtos;

-- Listar novos produtos
SELECT
    p.nm_produto,
    c.nm_categoria as categoria,
    f.nm_empresa as fornecedor,
    p.vl_preco,
    p.vl_preco_promocional,
    p.nr_avaliacao_media
FROM tb_produtos p
LEFT JOIN tb_categorias_produtos c ON p.id_categoria = c.id_categoria
LEFT JOIN tb_fornecedores f ON p.id_fornecedor = f.id_fornecedor
WHERE ds_sku IN ('SER-VITC-30ML', 'MASK-ARG-120G', 'CRE-HIAL-50G', 'OIL-ROSM-30ML',
                 'GEL-RED-500ML', 'ESF-COFF-250G', 'MASK-CAP-1KG', 'BASE-HD-02-30ML',
                 'EQ-RF-FACIAL', 'SAB-PUR-200ML')
ORDER BY p.vl_preco DESC;

-- =============================================
-- FIM DO SEED
-- =============================================
