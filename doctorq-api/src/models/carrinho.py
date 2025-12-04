"""
Modelos para Carrinho de Compras
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CarrinhoItemBase(BaseModel):
    """Modelo base para item do carrinho"""

    # Item pode ser produto OU procedimento (exclusivo)
    id_produto: Optional[UUID] = None
    id_procedimento: Optional[UUID] = None

    # Quantidade
    nr_quantidade: int = Field(default=1, ge=1)

    # Opções para produtos
    id_variacao: Optional[UUID] = None  # Variação do produto (tamanho, cor, etc.)

    # Opções para procedimentos
    dt_agendamento_desejado: Optional[datetime] = None
    id_profissional_desejado: Optional[UUID] = None
    ds_observacoes: Optional[str] = None

    @field_validator("id_produto", "id_procedimento")
    @classmethod
    def validar_item_exclusivo(cls, v, info):
        """Garantir que apenas produto OU procedimento seja informado"""
        # Esta validação será feita no nível do endpoint
        return v


class CarrinhoItemCreate(CarrinhoItemBase):
    """Modelo para criação de item no carrinho"""

    vl_preco_unitario: float = Field(..., gt=0)

    @field_validator("vl_preco_unitario")
    @classmethod
    def validar_preco(cls, v):
        """Validar que o preço é positivo"""
        if v <= 0:
            raise ValueError("Preço deve ser maior que zero")
        return round(v, 2)


class CarrinhoItemUpdate(BaseModel):
    """Modelo para atualização de item no carrinho"""

    nr_quantidade: Optional[int] = Field(None, ge=1)
    id_variacao: Optional[UUID] = None
    dt_agendamento_desejado: Optional[datetime] = None
    id_profissional_desejado: Optional[UUID] = None
    ds_observacoes: Optional[str] = None


class CarrinhoItemResponse(CarrinhoItemBase):
    """Modelo para resposta de item do carrinho com dados relacionados"""

    id_carrinho: UUID
    id_user: UUID
    vl_preco_unitario: float
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    # Dados relacionados (denormalizados para facilitar exibição)
    # Produto
    produto_nome: Optional[str] = None
    produto_imagem: Optional[str] = None
    produto_slug: Optional[str] = None
    produto_estoque: Optional[int] = None

    # Procedimento
    procedimento_nome: Optional[str] = None
    procedimento_duracao: Optional[int] = None
    procedimento_imagem: Optional[str] = None

    # Variação
    variacao_nome: Optional[str] = None
    variacao_valor_adicional: Optional[float] = None

    # Profissional
    profissional_nome: Optional[str] = None
    profissional_foto: Optional[str] = None

    # Cálculos
    vl_subtotal: float = Field(default=0.0)

    class Config:
        from_attributes = True


class CarrinhoResponse(BaseModel):
    """Modelo para carrinho completo com itens"""

    id_user: UUID
    itens: List[CarrinhoItemResponse]
    total: "CarrinhoTotal"


class CarrinhoTotal(BaseModel):
    """Modelo para totais do carrinho"""

    nr_itens: int = 0
    vl_subtotal: float = 0.0
    vl_desconto: float = 0.0
    vl_frete: float = 0.0
    vl_total: float = 0.0

    # Detalhes
    nr_produtos: int = 0
    nr_procedimentos: int = 0

    # Cupom aplicado (se houver)
    cupom_codigo: Optional[str] = None
    cupom_desconto_percentual: Optional[float] = None
    cupom_desconto_fixo: Optional[float] = None


class CarrinhoLimpar(BaseModel):
    """Modelo para confirmação de limpeza do carrinho"""

    confirmar: bool = Field(..., description="Deve ser true para confirmar limpeza")


class CarrinhoStats(BaseModel):
    """Estatísticas do carrinho do usuário"""

    id_user: UUID
    nr_itens_atuais: int = 0
    vl_total_atual: float = 0.0
    nr_carrinhos_abandonados: int = 0
    vl_medio_carrinho: float = 0.0
    dt_ultimo_item_adicionado: Optional[datetime] = None
