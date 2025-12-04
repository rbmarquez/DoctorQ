"""
Modelos Pydantic para Pedidos
"""

import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# ENDEREÇO DE ENTREGA
# ============================================================================


class EnderecoEntrega(BaseModel):
    """Modelo para endereço de entrega"""
    nm_destinatario: str = Field(..., description="Nome do destinatário")
    nr_telefone: str = Field(..., description="Telefone de contato")
    ds_logradouro: str = Field(..., description="Rua/Avenida")
    nr_numero: str = Field(..., description="Número")
    ds_complemento: Optional[str] = Field(None, description="Complemento")
    ds_bairro: str = Field(..., description="Bairro")
    ds_cidade: str = Field(..., description="Cidade")
    ds_estado: str = Field(..., max_length=2, description="UF (sigla do estado)")
    nr_cep: str = Field(..., description="CEP")
    ds_referencia: Optional[str] = Field(None, description="Ponto de referência")

    @field_validator("nr_cep")
    def validar_cep(cls, v):
        """Validar formato do CEP"""
        if v:
            # Remove caracteres não numéricos
            cep_limpo = "".join(filter(str.isdigit, v))
            if len(cep_limpo) != 8:
                raise ValueError("CEP deve ter 8 dígitos")
        return v

    @field_validator("ds_estado")
    def validar_estado(cls, v):
        """Validar UF"""
        if v:
            v = v.upper()
            estados_validos = [
                "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
                "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
                "RS", "RO", "RR", "SC", "SP", "SE", "TO"
            ]
            if v not in estados_validos:
                raise ValueError("Estado inválido")
        return v


# ============================================================================
# ITEM DO PEDIDO
# ============================================================================


class ItemPedido(BaseModel):
    """Modelo para item do pedido"""
    id_item: Optional[uuid.UUID] = None
    id_produto: Optional[uuid.UUID] = None
    id_procedimento: Optional[uuid.UUID] = None
    nm_item: str = Field(..., description="Nome do produto/procedimento")
    qt_quantidade: int = Field(..., gt=0, description="Quantidade")
    vl_unitario: Decimal = Field(..., ge=0, description="Valor unitário")
    vl_subtotal: Decimal = Field(..., ge=0, description="Subtotal do item")
    ds_imagem_url: Optional[str] = None
    ds_observacoes: Optional[str] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_produto": "123e4567-e89b-12d3-a456-426614174000",
                "nm_item": "Sérum Anti-idade Vitamina C 30ml",
                "qt_quantidade": 2,
                "vl_unitario": 159.90,
                "vl_subtotal": 319.80,
            }
        }


# ============================================================================
# CRIAR PEDIDO
# ============================================================================


class PedidoCreate(BaseModel):
    """Modelo para criação de pedido"""
    id_user: uuid.UUID = Field(..., description="ID do usuário")
    ds_endereco_entrega: EnderecoEntrega
    ds_forma_pagamento: str = Field(
        ...,
        description="Forma de pagamento (pix, credito, debito, boleto)"
    )
    ds_observacoes: Optional[str] = Field(None, description="Observações do pedido")
    id_cupom: Optional[uuid.UUID] = Field(None, description="ID do cupom de desconto")

    @field_validator("ds_forma_pagamento")
    def validar_forma_pagamento(cls, v):
        """Validar forma de pagamento"""
        formas_validas = ["pix", "credito", "debito", "boleto"]
        if v.lower() not in formas_validas:
            raise ValueError(
                f"Forma de pagamento inválida. Opções: {', '.join(formas_validas)}"
            )
        return v.lower()

    class Config:
        json_schema_extra = {
            "example": {
                "id_user": "123e4567-e89b-12d3-a456-426614174000",
                "ds_endereco_entrega": {
                    "nm_destinatario": "Maria Silva",
                    "nr_telefone": "(11) 98765-4321",
                    "ds_logradouro": "Rua das Flores",
                    "nr_numero": "123",
                    "ds_complemento": "Apto 45",
                    "ds_bairro": "Centro",
                    "ds_cidade": "São Paulo",
                    "ds_estado": "SP",
                    "nr_cep": "01234-567",
                },
                "ds_forma_pagamento": "pix",
                "ds_observacoes": "Entregar pela manhã",
            }
        }


# ============================================================================
# ATUALIZAR PEDIDO
# ============================================================================


class PedidoUpdate(BaseModel):
    """Modelo para atualização de pedido"""
    ds_status: Optional[str] = Field(
        None,
        description="Status (pendente, confirmado, pago, separando, enviado, entregue, cancelado)"
    )
    ds_rastreio: Optional[str] = Field(None, description="Código de rastreio")
    ds_codigo_rastreio: Optional[str] = None
    dt_envio: Optional[datetime] = None
    dt_entrega: Optional[datetime] = None
    dt_entrega_estimada: Optional[date] = None
    ds_numero_nota_fiscal: Optional[str] = None
    ds_chave_nfe: Optional[str] = None
    ds_url_danfe: Optional[str] = None
    ds_observacoes: Optional[str] = None

    @field_validator("ds_status")
    def validar_status(cls, v):
        """Validar status do pedido"""
        if v:
            status_validos = [
                "pendente", "confirmado", "pago", "separando",
                "enviado", "entregue", "cancelado"
            ]
            if v.lower() not in status_validos:
                raise ValueError(
                    f"Status inválido. Opções: {', '.join(status_validos)}"
                )
            return v.lower()
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "ds_status": "enviado",
                "ds_rastreio": "BR123456789XX",
                "dt_envio": "2025-01-24T10:00:00",
            }
        }


# ============================================================================
# RESPOSTA DO PEDIDO
# ============================================================================


class PedidoResponse(BaseModel):
    """Modelo de resposta completa do pedido"""
    id_pedido: uuid.UUID
    id_user: uuid.UUID
    nr_pedido: str
    vl_subtotal: Decimal
    vl_desconto: Decimal
    vl_frete: Decimal
    vl_total: Decimal
    ds_status: str
    ds_endereco_entrega: Dict[str, Any]
    ds_forma_pagamento: Optional[str] = None
    ds_rastreio: Optional[str] = None
    ds_codigo_rastreio: Optional[str] = None
    dt_pedido: datetime
    dt_confirmacao: Optional[datetime] = None
    dt_pagamento: Optional[datetime] = None
    dt_envio: Optional[datetime] = None
    dt_entrega: Optional[datetime] = None
    dt_entrega_estimada: Optional[date] = None
    dt_cancelamento: Optional[datetime] = None
    ds_observacoes: Optional[str] = None
    id_fornecedor: Optional[uuid.UUID] = None
    ds_numero_nota_fiscal: Optional[str] = None
    ds_chave_nfe: Optional[str] = None
    ds_url_danfe: Optional[str] = None
    dt_criacao: datetime

    # Campos extras (joins)
    itens: Optional[List[ItemPedido]] = None
    fornecedor_nome: Optional[str] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_pedido": "123e4567-e89b-12d3-a456-426614174000",
                "nr_pedido": "PED-000123",
                "vl_subtotal": 319.80,
                "vl_desconto": 0.00,
                "vl_frete": 25.00,
                "vl_total": 344.80,
                "ds_status": "confirmado",
                "ds_forma_pagamento": "pix",
            }
        }


# ============================================================================
# LISTAGEM DE PEDIDOS
# ============================================================================


class PedidoListItem(BaseModel):
    """Modelo resumido para listagem de pedidos"""
    id_pedido: uuid.UUID
    nr_pedido: str
    dt_pedido: datetime
    vl_total: Decimal
    ds_status: str
    qt_itens: int = 0
    fornecedor_nome: Optional[str] = None

    class Config:
        from_attributes = True


class PedidoList(BaseModel):
    """Modelo de resposta para lista paginada de pedidos"""
    items: List[PedidoListItem]
    meta: Dict[str, int] = Field(
        ...,
        description="Metadados de paginação",
        example={
            "totalItems": 100,
            "itemsPerPage": 12,
            "totalPages": 9,
            "currentPage": 1,
        },
    )


# ============================================================================
# RASTREAMENTO
# ============================================================================


class RastreioEvento(BaseModel):
    """Evento de rastreamento"""
    dt_evento: datetime
    ds_local: str
    ds_descricao: str
    ds_status: str


class RastreioResponse(BaseModel):
    """Resposta de rastreamento"""
    id_pedido: uuid.UUID
    nr_pedido: str
    ds_codigo_rastreio: Optional[str] = None
    ds_transportadora: Optional[str] = None
    dt_postagem: Optional[datetime] = None
    dt_entrega_prevista: Optional[date] = None
    ds_status_atual: str
    eventos: List[RastreioEvento] = []

    class Config:
        from_attributes = True


# ============================================================================
# ESTATÍSTICAS
# ============================================================================


class PedidoStats(BaseModel):
    """Estatísticas de pedidos"""
    total_pedidos: int = 0
    total_faturado: Decimal = Decimal("0.00")
    ticket_medio: Decimal = Decimal("0.00")
    pedidos_por_status: Dict[str, int] = {}
    pedidos_mes: int = 0
    faturamento_mes: Decimal = Decimal("0.00")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "total_pedidos": 150,
                "total_faturado": 45000.00,
                "ticket_medio": 300.00,
                "pedidos_por_status": {
                    "pendente": 5,
                    "confirmado": 10,
                    "enviado": 20,
                    "entregue": 110,
                    "cancelado": 5,
                },
                "pedidos_mes": 25,
                "faturamento_mes": 7500.00,
            }
        }
