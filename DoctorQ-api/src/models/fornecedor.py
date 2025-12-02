"""
Modelos para Fornecedores
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class FornecedorBase(BaseModel):
    """Base model for fornecedor"""

    nm_empresa: str = Field(..., min_length=1, max_length=255)
    ds_razao_social: Optional[str] = Field(None, max_length=255)
    nr_cnpj: str = Field(..., pattern=r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$")
    nr_inscricao_estadual: Optional[str] = None
    ds_descricao: Optional[str] = None
    ds_site: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    nr_whatsapp: Optional[str] = None

    # Endereço
    ds_endereco: Optional[str] = None
    nr_numero: Optional[str] = None
    ds_complemento: Optional[str] = None
    nm_bairro: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = Field(None, max_length=2)
    nr_cep: Optional[str] = Field(None, pattern=r"^\d{5}-\d{3}$")

    # Categorias de produtos
    ds_categorias_produtos: Optional[List[str]] = None

    # Configurações de entrega
    nr_tempo_entrega_dias: Optional[int] = Field(None, ge=0)
    vl_frete_minimo: Optional[float] = Field(None, ge=0)
    vl_pedido_minimo: Optional[float] = Field(None, ge=0)

    # Logo
    ds_logo_url: Optional[str] = None

    # Status
    st_ativo: bool = True


class FornecedorCreate(FornecedorBase):
    """Model for creating fornecedor"""

    pass


class FornecedorUpdate(BaseModel):
    """Model for updating fornecedor"""

    nm_empresa: Optional[str] = Field(None, min_length=1, max_length=255)
    ds_razao_social: Optional[str] = Field(None, max_length=255)
    nr_cnpj: Optional[str] = Field(None, pattern=r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$")
    nr_inscricao_estadual: Optional[str] = None
    ds_descricao: Optional[str] = None
    ds_site: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    nr_whatsapp: Optional[str] = None
    ds_endereco: Optional[str] = None
    nr_numero: Optional[str] = None
    ds_complemento: Optional[str] = None
    nm_bairro: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = Field(None, max_length=2)
    nr_cep: Optional[str] = Field(None, pattern=r"^\d{5}-\d{3}$")
    ds_categorias_produtos: Optional[List[str]] = None
    nr_tempo_entrega_dias: Optional[int] = Field(None, ge=0)
    vl_frete_minimo: Optional[float] = Field(None, ge=0)
    vl_pedido_minimo: Optional[float] = Field(None, ge=0)
    ds_logo_url: Optional[str] = None
    st_ativo: Optional[bool] = None


class FornecedorResponse(FornecedorBase):
    """Model for fornecedor response"""

    id_fornecedor: UUID
    nr_avaliacao_media: float = 0.0
    nr_total_avaliacoes: int = 0
    nr_total_vendas: int = 0
    st_verificado: bool = False
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    class Config:
        from_attributes = True


class FornecedorList(BaseModel):
    """Model for fornecedor list response"""

    items: List[FornecedorResponse]
    meta: dict


class FornecedorStats(BaseModel):
    """Model for fornecedor statistics"""

    id_fornecedor: UUID
    nm_empresa: str
    nr_total_produtos: int = 0
    nr_produtos_ativos: int = 0
    nr_total_pedidos: int = 0
    nr_pedidos_mes: int = 0
    vl_total_vendas: float = 0.0
    vl_vendas_mes: float = 0.0
    nr_avaliacao_media: float = 0.0
    nr_total_avaliacoes: int = 0
