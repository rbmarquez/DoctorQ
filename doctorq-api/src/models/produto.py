"""
Modelos para Produtos
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ProdutoBase(BaseModel):
    """Modelo base para produto"""

    nm_produto: str = Field(..., min_length=1, max_length=255)
    ds_descricao: Optional[str] = None
    ds_descricao_curta: Optional[str] = Field(None, max_length=500)

    # Fornecedor e Categoria
    id_fornecedor: Optional[UUID] = None
    id_categoria: Optional[UUID] = None

    # Identificação
    ds_slug: Optional[str] = Field(None, max_length=255)
    ds_sku: Optional[str] = Field(None, max_length=100)
    ds_ean: Optional[str] = Field(None, max_length=13)
    ds_codigo_fornecedor: Optional[str] = Field(None, max_length=100)

    # Branding
    ds_marca: Optional[str] = Field(None, max_length=100)
    ds_subcategoria: Optional[str] = Field(None, max_length=100)

    # Preços
    vl_preco: float = Field(..., gt=0)
    vl_preco_original: Optional[float] = Field(None, gt=0)
    vl_preco_promocional: Optional[float] = Field(None, gt=0)
    dt_inicio_promocao: Optional[datetime] = None
    dt_fim_promocao: Optional[datetime] = None

    # Estoque
    st_estoque: bool = True
    nr_quantidade_estoque: int = Field(default=0, ge=0)

    # Dimensões e peso
    nr_peso_gramas: Optional[int] = Field(None, ge=0)
    nr_altura_cm: Optional[float] = Field(None, gt=0)
    nr_largura_cm: Optional[float] = Field(None, gt=0)
    nr_profundidade_cm: Optional[float] = Field(None, gt=0)

    # Informações
    ds_ingredientes: Optional[str] = None
    ds_modo_uso: Optional[str] = None
    ds_cuidados: Optional[str] = None
    ds_contraindicacoes: Optional[str] = None
    ds_registro_anvisa: Optional[str] = Field(None, max_length=50)

    # Certificações
    st_vegano: bool = False
    st_cruelty_free: bool = False
    st_organico: bool = False

    # Mídia
    ds_imagem_url: Optional[str] = None
    ds_imagens_adicionais: Optional[List[str]] = Field(default_factory=list)
    ds_video_url: Optional[str] = None

    # Tags e especificações
    ds_tags: Optional[List[str]] = Field(default_factory=list)
    ds_especificacoes: Optional[Dict[str, Any]] = Field(default_factory=dict)

    # SEO
    ds_meta_title: Optional[str] = Field(None, max_length=255)
    ds_meta_description: Optional[str] = None
    ds_meta_keywords: Optional[str] = None

    # Status
    st_ativo: bool = True
    st_destaque: bool = False
    ds_selo: Optional[str] = Field(None, max_length=50)


class ProdutoCreate(ProdutoBase):
    """Modelo para criação de produto"""
    pass


class ProdutoUpdate(BaseModel):
    """Modelo para atualização de produto"""

    nm_produto: Optional[str] = Field(None, min_length=1, max_length=255)
    ds_descricao: Optional[str] = None
    ds_descricao_curta: Optional[str] = Field(None, max_length=500)
    id_fornecedor: Optional[UUID] = None
    id_categoria: Optional[UUID] = None
    ds_slug: Optional[str] = Field(None, max_length=255)
    ds_sku: Optional[str] = Field(None, max_length=100)
    ds_ean: Optional[str] = Field(None, max_length=13)
    ds_codigo_fornecedor: Optional[str] = Field(None, max_length=100)
    ds_marca: Optional[str] = Field(None, max_length=100)
    ds_subcategoria: Optional[str] = Field(None, max_length=100)
    vl_preco: Optional[float] = Field(None, gt=0)
    vl_preco_original: Optional[float] = Field(None, gt=0)
    vl_preco_promocional: Optional[float] = Field(None, gt=0)
    dt_inicio_promocao: Optional[datetime] = None
    dt_fim_promocao: Optional[datetime] = None
    st_estoque: Optional[bool] = None
    nr_quantidade_estoque: Optional[int] = Field(None, ge=0)
    nr_peso_gramas: Optional[int] = Field(None, ge=0)
    nr_altura_cm: Optional[float] = Field(None, gt=0)
    nr_largura_cm: Optional[float] = Field(None, gt=0)
    nr_profundidade_cm: Optional[float] = Field(None, gt=0)
    ds_ingredientes: Optional[str] = None
    ds_modo_uso: Optional[str] = None
    ds_cuidados: Optional[str] = None
    ds_contraindicacoes: Optional[str] = None
    ds_registro_anvisa: Optional[str] = Field(None, max_length=50)
    st_vegano: Optional[bool] = None
    st_cruelty_free: Optional[bool] = None
    st_organico: Optional[bool] = None
    ds_imagem_url: Optional[str] = None
    ds_imagens_adicionais: Optional[List[str]] = None
    ds_video_url: Optional[str] = None
    ds_tags: Optional[List[str]] = None
    ds_especificacoes: Optional[Dict[str, Any]] = None
    ds_meta_title: Optional[str] = Field(None, max_length=255)
    ds_meta_description: Optional[str] = None
    ds_meta_keywords: Optional[str] = None
    st_ativo: Optional[bool] = None
    st_destaque: Optional[bool] = None
    ds_selo: Optional[str] = Field(None, max_length=50)


class ProdutoResponse(ProdutoBase):
    """Modelo para resposta de produto"""

    id_produto: UUID
    ds_categoria: Optional[str] = None  # Nome da categoria (denormalizado)
    nr_avaliacao_media: float = 0.0
    nr_total_avaliacoes: int = 0
    nr_total_vendas: int = 0
    id_empresa: Optional[UUID] = None
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    # Informações do fornecedor (incluídas via join)
    fornecedor_nome: Optional[str] = None
    fornecedor_logo: Optional[str] = None

    class Config:
        from_attributes = True


class ProdutoListItem(BaseModel):
    """Modelo resumido para listagem de produtos"""

    id_produto: UUID
    nm_produto: str
    ds_descricao_curta: Optional[str] = None
    ds_marca: Optional[str] = None
    vl_preco: float
    vl_preco_promocional: Optional[float] = None
    ds_imagem_url: Optional[str] = None
    nr_avaliacao_media: float = 0.0
    nr_total_avaliacoes: int = 0
    st_estoque: bool = True
    st_destaque: bool = False
    ds_selo: Optional[str] = None
    ds_tags: Optional[List[str]] = Field(default_factory=list)

    # Certificações em formato simplificado
    certificacoes: List[str] = Field(default_factory=list)

    # Info do fornecedor
    fornecedor_nome: Optional[str] = None

    class Config:
        from_attributes = True


class ProdutoList(BaseModel):
    """Modelo para lista paginada de produtos"""

    items: List[ProdutoListItem]
    meta: dict


class CategoriaProduto(BaseModel):
    """Modelo para categoria de produto"""

    id_categoria: UUID
    nm_categoria: str
    ds_slug: str
    id_categoria_pai: Optional[UUID] = None
    ds_icone: Optional[str] = None
    st_ativo: bool = True

    class Config:
        from_attributes = True


class ProdutoStats(BaseModel):
    """Estatísticas do produto"""

    id_produto: UUID
    nm_produto: str
    nr_visualizacoes: int = 0
    nr_favoritos: int = 0
    nr_carrinho: int = 0
    nr_vendas: int = 0
    vl_total_vendas: float = 0.0
    nr_avaliacao_media: float = 0.0
    nr_total_avaliacoes: int = 0
    nr_estoque_atual: int = 0
