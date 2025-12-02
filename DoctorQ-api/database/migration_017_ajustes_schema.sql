-- =============================================
-- DoctorQ - Migration 017: Ajustes de Schema
-- =============================================
-- Descrição: Adiciona colunas faltantes em tabelas existentes
-- Data: 2025-01-23
-- Versão: 1.0
-- =============================================
-- IMPORTANTE: Esta migration preserva todos os dados existentes
-- =============================================

-- =============================================
-- AJUSTES EM tb_produtos
-- =============================================

-- Adicionar colunas de fornecedor e categoria
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE SET NULL;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS id_categoria UUID REFERENCES tb_categorias_produtos(id_categoria) ON DELETE SET NULL;

-- Adicionar campos de identificação
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_slug VARCHAR(255);

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_sku VARCHAR(100);

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_ean VARCHAR(13);

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_codigo_fornecedor VARCHAR(100);

-- Adicionar descrição curta
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_descricao_curta TEXT;

-- Adicionar campos de dimensões e peso
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS nr_peso_gramas INTEGER;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS nr_altura_cm DECIMAL(10,2);

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS nr_largura_cm DECIMAL(10,2);

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS nr_profundidade_cm DECIMAL(10,2);

-- Adicionar campos de promoção
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS dt_inicio_promocao TIMESTAMP;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS dt_fim_promocao TIMESTAMP;

-- Adicionar campos informativos
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_ingredientes TEXT;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_modo_uso TEXT;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_cuidados TEXT;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_contraindicacoes TEXT;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_registro_anvisa VARCHAR(50);

-- Adicionar selos/certificações
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS st_vegano BOOLEAN DEFAULT false;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS st_cruelty_free BOOLEAN DEFAULT false;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS st_organico BOOLEAN DEFAULT false;

-- Adicionar mídia adicional
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_video_url TEXT;

-- Adicionar SEO
ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_meta_title VARCHAR(255);

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_meta_description TEXT;

ALTER TABLE tb_produtos
    ADD COLUMN IF NOT EXISTS ds_meta_keywords TEXT;

-- Migrar dados existentes
-- Gerar slugs para produtos existentes
UPDATE tb_produtos
SET ds_slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(nm_produto, ' ', '-'), 'ã', 'a'), 'á', 'a'), 'ç', 'c'))
WHERE ds_slug IS NULL;

-- Gerar SKUs simples para produtos existentes
UPDATE tb_produtos
SET ds_sku = 'PROD-' || LPAD(SUBSTR(id_produto::TEXT, 1, 8), 8, '0')
WHERE ds_sku IS NULL;

-- Mapear categorias antigas para novas (se possível)
UPDATE tb_produtos p
SET id_categoria = c.id_categoria
FROM tb_categorias_produtos c
WHERE p.id_categoria IS NULL
  AND LOWER(p.ds_categoria) = LOWER(c.nm_categoria);

-- Copiar descrição para descrição curta se não existir
UPDATE tb_produtos
SET ds_descricao_curta = LEFT(ds_descricao, 200)
WHERE ds_descricao_curta IS NULL AND ds_descricao IS NOT NULL;

-- Criar índices para novos campos
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON tb_produtos(id_fornecedor);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_new ON tb_produtos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON tb_produtos(ds_slug);
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON tb_produtos(ds_sku);
CREATE INDEX IF NOT EXISTS idx_produtos_vegano ON tb_produtos(st_vegano);
CREATE INDEX IF NOT EXISTS idx_produtos_promocao ON tb_produtos(dt_inicio_promocao, dt_fim_promocao);

-- =============================================
-- AJUSTES EM tb_pedidos
-- =============================================

-- Adicionar fornecedor
ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE SET NULL;

-- Adicionar código de rastreio
ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS ds_codigo_rastreio VARCHAR(100);

-- Adicionar campos de envio
ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS dt_envio TIMESTAMP;

ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS dt_entrega TIMESTAMP;

ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS dt_entrega_estimada DATE;

-- Adicionar endereço de entrega
ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS ds_endereco_entrega JSONB;

-- Adicionar nota fiscal
ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS ds_numero_nota_fiscal VARCHAR(50);

ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS ds_chave_nfe VARCHAR(44);

ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS ds_url_danfe TEXT;

-- Adicionar data de criação se não existir
ALTER TABLE tb_pedidos
    ADD COLUMN IF NOT EXISTS dt_criacao TIMESTAMP DEFAULT NOW();

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_pedidos_fornecedor ON tb_pedidos(id_fornecedor);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo_rastreio ON tb_pedidos(ds_codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_pedidos_dt_criacao ON tb_pedidos(dt_criacao DESC);

-- =============================================
-- AJUSTES EM tb_carrinho
-- =============================================

-- Adicionar procedimento (para permitir agendar procedimentos via carrinho)
ALTER TABLE tb_carrinho
    ADD COLUMN IF NOT EXISTS id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE CASCADE;

-- Adicionar variação de produto
ALTER TABLE tb_carrinho
    ADD COLUMN IF NOT EXISTS id_variacao UUID REFERENCES tb_produto_variacoes(id_variacao) ON DELETE SET NULL;

-- Adicionar data de agendamento para procedimentos
ALTER TABLE tb_carrinho
    ADD COLUMN IF NOT EXISTS dt_agendamento_desejado TIMESTAMP;

ALTER TABLE tb_carrinho
    ADD COLUMN IF NOT EXISTS id_profissional_desejado UUID REFERENCES tb_profissionais(id_profissional) ON DELETE SET NULL;

-- Adicionar observações
ALTER TABLE tb_carrinho
    ADD COLUMN IF NOT EXISTS ds_observacoes TEXT;

-- Criar constraint para garantir que é produto OU procedimento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_carrinho_item_type'
    ) THEN
        ALTER TABLE tb_carrinho
        ADD CONSTRAINT chk_carrinho_item_type CHECK (
            (id_produto IS NOT NULL AND id_procedimento IS NULL) OR
            (id_produto IS NULL AND id_procedimento IS NOT NULL)
        );
    END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_carrinho_procedimento ON tb_carrinho(id_procedimento);
CREATE INDEX IF NOT EXISTS idx_carrinho_profissional ON tb_carrinho(id_profissional_desejado);

-- =============================================
-- AJUSTES EM tb_favoritos
-- =============================================

-- Adicionar tipo de item
ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS ds_tipo_item VARCHAR(50);

-- Adicionar FKs para diferentes tipos
ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE;

ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE CASCADE;

ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE;

ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE;

-- Adicionar categoria e organização
ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS ds_categoria_favorito VARCHAR(100);

ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS ds_observacoes TEXT;

ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS nr_prioridade INTEGER DEFAULT 0;

-- Adicionar notificações
ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS st_notificar_promocao BOOLEAN DEFAULT true;

ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS st_notificar_disponibilidade BOOLEAN DEFAULT true;

-- Adicionar datas se não existir
ALTER TABLE tb_favoritos
    ADD COLUMN IF NOT EXISTS dt_atualizacao TIMESTAMP DEFAULT NOW();

-- Migrar dados existentes - determinar tipo baseado em qual FK está preenchida
UPDATE tb_favoritos
SET ds_tipo_item = CASE
    WHEN id_produto IS NOT NULL THEN 'produto'
    ELSE 'outro'
END
WHERE ds_tipo_item IS NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_favoritos_tipo_item ON tb_favoritos(ds_tipo_item);
CREATE INDEX IF NOT EXISTS idx_favoritos_profissional ON tb_favoritos(id_profissional);
CREATE INDEX IF NOT EXISTS idx_favoritos_procedimento ON tb_favoritos(id_procedimento);
CREATE INDEX IF NOT EXISTS idx_favoritos_fornecedor ON tb_favoritos(id_fornecedor);
CREATE INDEX IF NOT EXISTS idx_favoritos_clinica ON tb_favoritos(id_clinica);
CREATE INDEX IF NOT EXISTS idx_favoritos_categoria ON tb_favoritos(ds_categoria_favorito);

-- =============================================
-- AJUSTES EM tb_configuracoes
-- =============================================

-- Adicionar empresa (multi-tenant)
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE;

-- Adicionar valor padrão
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS ds_valor_padrao TEXT;

-- Adicionar tipo de dado
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS ds_tipo VARCHAR(50) DEFAULT 'texto';

-- Adicionar descrição e ajuda
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS ds_descricao TEXT;

ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS ds_ajuda TEXT;

-- Adicionar segurança
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS st_criptografado BOOLEAN DEFAULT false;

ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS st_somente_leitura BOOLEAN DEFAULT false;

-- Adicionar validação
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS ds_validacao VARCHAR(500);

ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS ds_opcoes TEXT[];

-- Adicionar visibilidade
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS st_visivel BOOLEAN DEFAULT true;

-- Adicionar datas se não existir
ALTER TABLE tb_configuracoes
    ADD COLUMN IF NOT EXISTS dt_atualizacao TIMESTAMP DEFAULT NOW();

-- Migrar dados existentes
UPDATE tb_configuracoes
SET ds_valor_padrao = ds_valor
WHERE ds_valor_padrao IS NULL AND ds_valor IS NOT NULL;

-- Criar índice para empresa
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa ON tb_configuracoes(id_empresa);

-- =============================================
-- AJUSTES EM tb_avaliacoes_produtos
-- =============================================

-- Adicionar campos de moderação
ALTER TABLE tb_avaliacoes_produtos
    ADD COLUMN IF NOT EXISTS st_aprovada BOOLEAN DEFAULT false;

ALTER TABLE tb_avaliacoes_produtos
    ADD COLUMN IF NOT EXISTS st_compra_verificada BOOLEAN DEFAULT false;

ALTER TABLE tb_avaliacoes_produtos
    ADD COLUMN IF NOT EXISTS ds_resposta_fornecedor TEXT;

ALTER TABLE tb_avaliacoes_produtos
    ADD COLUMN IF NOT EXISTS dt_resposta_fornecedor TIMESTAMP;

-- Renomear colunas se necessário (usar aliases nas queries)
-- nr_avaliacao -> nr_nota (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_avaliacoes_produtos'
        AND column_name = 'nr_avaliacao'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_avaliacoes_produtos'
        AND column_name = 'nr_nota'
    ) THEN
        ALTER TABLE tb_avaliacoes_produtos RENAME COLUMN nr_avaliacao TO nr_nota;
    END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_produtos_aprovada ON tb_avaliacoes_produtos(st_aprovada);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_produtos_nota ON tb_avaliacoes_produtos(nr_nota);

-- =============================================
-- TRIGGERS PARA NOVOS CAMPOS
-- =============================================

-- Garantir que triggers de update existam
CREATE TRIGGER IF NOT EXISTS trg_update_favoritos_new
    BEFORE UPDATE ON tb_favoritos
    FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER IF NOT EXISTS trg_update_configuracoes_new
    BEFORE UPDATE ON tb_configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- =============================================
-- VERIFICAÇÕES E VALIDAÇÕES
-- =============================================

-- Verificar produtos sem categoria
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM tb_produtos WHERE id_categoria IS NULL;
    IF v_count > 0 THEN
        RAISE NOTICE 'AVISO: % produtos sem categoria. Considere atribuir categorias manualmente.', v_count;
    END IF;
END $$;

-- Verificar produtos sem fornecedor
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM tb_produtos WHERE id_fornecedor IS NULL;
    IF v_count > 0 THEN
        RAISE NOTICE 'AVISO: % produtos sem fornecedor. Considere atribuir fornecedores manualmente.', v_count;
    END IF;
END $$;

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON COLUMN tb_produtos.id_fornecedor IS 'Fornecedor do produto';
COMMENT ON COLUMN tb_produtos.id_categoria IS 'Categoria do produto (hierárquica)';
COMMENT ON COLUMN tb_produtos.ds_slug IS 'URL-friendly identifier único';
COMMENT ON COLUMN tb_produtos.ds_sku IS 'Stock Keeping Unit - código único do produto';

COMMENT ON COLUMN tb_pedidos.id_fornecedor IS 'Fornecedor responsável pelo pedido';
COMMENT ON COLUMN tb_pedidos.ds_codigo_rastreio IS 'Código de rastreamento da transportadora';

COMMENT ON COLUMN tb_carrinho.id_procedimento IS 'Procedimento a ser agendado (alternativo a produto)';
COMMENT ON COLUMN tb_carrinho.dt_agendamento_desejado IS 'Data/hora desejada para procedimento';

COMMENT ON COLUMN tb_favoritos.ds_tipo_item IS 'Tipo do item favoritado (produto, procedimento, profissional, etc)';
COMMENT ON COLUMN tb_favoritos.ds_categoria_favorito IS 'Categoria organizacional do favorito';

COMMENT ON COLUMN tb_configuracoes.id_empresa IS 'Empresa dona da configuração (multi-tenant)';
COMMENT ON COLUMN tb_configuracoes.ds_valor_padrao IS 'Valor padrão caso configuração não esteja definida';

-- =============================================
-- FIM DA MIGRATION
-- =============================================

-- Relatório final
SELECT
    'Migration 017 concluída com sucesso!' as status,
    (SELECT COUNT(*) FROM tb_produtos) as total_produtos,
    (SELECT COUNT(*) FROM tb_produtos WHERE id_categoria IS NOT NULL) as produtos_com_categoria,
    (SELECT COUNT(*) FROM tb_produtos WHERE id_fornecedor IS NOT NULL) as produtos_com_fornecedor,
    (SELECT COUNT(*) FROM tb_fornecedores) as total_fornecedores,
    (SELECT COUNT(*) FROM tb_categorias_produtos) as total_categorias;
