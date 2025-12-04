"""
ORM Models para Produtos e Categorias
Estrutura EXATA das tabelas tb_produtos e tb_categorias_produtos
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Integer,
    DECIMAL,
    TIMESTAMP,
    ForeignKey,
    ARRAY,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.models.base import Base


# ============================================================================
# CATEGORIAS DE PRODUTOS
# ============================================================================


class CategoriaProdutoORM(Base):
    """Categoria de produtos"""

    __tablename__ = "tb_categorias_produtos"
    __table_args__ = {'extend_existing': True}

    id_categoria = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nm_categoria = Column(String(100), nullable=False)
    ds_descricao = Column(Text)
    ds_icone = Column(String(100))
    ds_imagem_url = Column(Text)
    nr_ordem = Column(Integer, default=0)
    st_ativo = Column(Boolean, default=True, nullable=False)
    dt_criacao = Column(TIMESTAMP, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # Relacionamento
    produtos = relationship("ProdutoORM", back_populates="categoria")

    def __repr__(self):
        return f"<CategoriaProduto(id={self.id_categoria}, nome={self.nm_categoria})>"


# ============================================================================
# PRODUTOS
# ============================================================================


class ProdutoORM(Base):
    """Produto do marketplace - Estrutura EXATA da tabela tb_produtos"""

    __tablename__ = "tb_produtos"
    __table_args__ = {'extend_existing': True}

    # IDs
    id_produto = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_categoria = Column(UUID(as_uuid=True), ForeignKey("tb_categorias_produtos.id_categoria"))
    id_fornecedor = Column(UUID(as_uuid=True), ForeignKey("tb_fornecedores.id_fornecedor"))
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"))

    # Informações básicas
    nm_produto = Column(String(255), nullable=False)
    ds_descricao = Column(Text)
    ds_descricao_curta = Column(Text)
    ds_categoria = Column(String(100), nullable=False)  # Categoria como string (legacy)
    ds_subcategoria = Column(String(100))
    ds_marca = Column(String(100))
    ds_slug = Column(String(255))
    ds_sku = Column(String(100))
    ds_ean = Column(String(13))
    ds_codigo_fornecedor = Column(String(100))

    # Preços
    vl_preco = Column(DECIMAL(10, 2), nullable=False)
    vl_preco_original = Column(DECIMAL(10, 2))
    vl_preco_promocional = Column(DECIMAL(10, 2))
    dt_inicio_promocao = Column(TIMESTAMP)
    dt_fim_promocao = Column(TIMESTAMP)

    # Estoque
    st_estoque = Column(Boolean, default=True)
    nr_quantidade_estoque = Column(Integer, default=0)

    # Imagens
    ds_imagem_url = Column(Text)
    ds_imagens_adicionais = Column(JSONB, default=[])
    ds_video_url = Column(Text)

    # Detalhes do produto
    ds_ingredientes = Column(Text)
    ds_modo_uso = Column(Text)
    ds_cuidados = Column(Text)
    ds_contraindicacoes = Column(Text)
    ds_especificacoes = Column(JSONB, default={})

    # Dimensões e peso
    nr_peso_gramas = Column(Integer)
    nr_altura_cm = Column(DECIMAL(10, 2))
    nr_largura_cm = Column(DECIMAL(10, 2))
    nr_profundidade_cm = Column(DECIMAL(10, 2))

    # Certificações e selos
    st_vegano = Column(Boolean, default=False)
    st_cruelty_free = Column(Boolean, default=False)
    st_organico = Column(Boolean, default=False)
    ds_registro_anvisa = Column(String(50))

    # Marketing
    st_destaque = Column(Boolean, default=False)
    ds_selo = Column(String(50))
    ds_tags = Column(ARRAY(Text), default=[])

    # Avaliações e vendas
    nr_avaliacao_media = Column(DECIMAL(3, 2), default=0)
    nr_total_avaliacoes = Column(Integer, default=0)
    nr_total_vendas = Column(Integer, default=0)

    # SEO
    ds_meta_title = Column(String(255))
    ds_meta_description = Column(Text)
    ds_meta_keywords = Column(Text)

    # Status
    st_ativo = Column(Boolean, default=True, nullable=False)

    # Timestamps
    dt_criacao = Column(TIMESTAMP, default=datetime.now, nullable=False)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # Relacionamentos
    categoria = relationship("CategoriaProdutoORM", back_populates="produtos")
    fornecedor = relationship("FornecedorORM", back_populates="produtos")
    variacoes = relationship("ProdutoVariacaoORM", back_populates="produto", cascade="all, delete-orphan")
    itens_carrinho = relationship("CarrinhoORM", back_populates="produto")

    def __repr__(self):
        return f"<Produto(id={self.id_produto}, nome={self.nm_produto})>"


# ============================================================================
# VARIAÇÕES DE PRODUTO
# ============================================================================


class ProdutoVariacaoORM(Base):
    """Variações de produto (tamanho, cor, etc)"""

    __tablename__ = "tb_produto_variacoes"
    __table_args__ = {'extend_existing': True}

    id_variacao = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_produto = Column(UUID(as_uuid=True), ForeignKey("tb_produtos.id_produto"), nullable=False)

    nm_variacao = Column(String(100), nullable=False)  # "50ml", "Azul", "P"
    ds_tipo = Column(String(50))  # "tamanho", "cor", "volume"
    vl_adicional = Column(DECIMAL(10, 2), default=0)
    nr_estoque = Column(Integer, default=0)
    ds_sku_variacao = Column(String(100), unique=True)

    st_ativo = Column(Boolean, default=True)
    dt_criacao = Column(TIMESTAMP, default=datetime.now)

    # Relacionamento
    produto = relationship("ProdutoORM", back_populates="variacoes")

    def __repr__(self):
        return f"<Variacao(id={self.id_variacao}, nome={self.nm_variacao})>"
