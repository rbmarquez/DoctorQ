"""
Models para sistema de pagamentos (Stripe e MercadoPago).

Este módulo define:
- TbPagamento: Pagamentos processados
- TbTransacaoPagamento: Histórico de transações
- Schemas Pydantic para validação
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import (
    DECIMAL,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# =====================================================
# ENUMS
# =====================================================


class GatewayEnum(str, Enum):
    """Enum para gateways de pagamento."""

    STRIPE = "stripe"
    MERCADOPAGO = "mercadopago"


class TipoPagamentoEnum(str, Enum):
    """Enum para tipos de pagamento."""

    CHECKOUT = "checkout"
    PAYMENT_INTENT = "payment_intent"
    PIX = "pix"
    CARD = "card"
    PREFERENCE = "preference"


class StatusPagamentoEnum(str, Enum):
    """Enum para status de pagamento."""

    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"
    REFUNDED = "refunded"
    EXPIRED = "expired"


class EventoOrigemEnum(str, Enum):
    """Enum para origem de evento."""

    API = "api"
    WEBHOOK = "webhook"
    MANUAL = "manual"


# =====================================================
# SQLALCHEMY MODELS
# =====================================================


class TbPagamento(Base):
    """
    Model para tabela tb_pagamentos.

    Representa pagamentos processados via Stripe ou MercadoPago.
    """

    __tablename__ = "tb_pagamentos"

    # Identificação
    id_pagamento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_empresa = Column(
        UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"), nullable=False
    )
    id_user = Column(
        UUID(as_uuid=True), ForeignKey("tb_users.id_user", ondelete="SET NULL"), nullable=True
    )

    # Gateway de pagamento
    ds_gateway = Column(String(50), nullable=False)  # 'stripe' ou 'mercadopago'
    ds_tipo_pagamento = Column(String(50), nullable=False)

    # Identificadores externos
    ds_external_id = Column(String(255), nullable=False)
    ds_session_id = Column(String(255), nullable=True)
    ds_payment_method = Column(String(50), nullable=True)

    # Valores
    vl_amount = Column(DECIMAL(10, 2), nullable=False)
    ds_currency = Column(String(3), default="BRL")
    vl_fee = Column(DECIMAL(10, 2), nullable=True)
    vl_net = Column(DECIMAL(10, 2), nullable=True)

    # Status
    ds_status = Column(String(50), nullable=False)
    ds_status_detail = Column(Text, nullable=True)

    # Informações do pagador
    ds_payer_email = Column(String(255), nullable=True)
    ds_payer_name = Column(String(255), nullable=True)
    ds_payer_cpf = Column(String(14), nullable=True)
    nm_payer_phone = Column(String(20), nullable=True)

    # Dados adicionais
    ds_description = Column(Text, nullable=True)
    ds_metadata = Column(JSONB, nullable=True)

    # PIX específico (MercadoPago)
    ds_qr_code = Column(Text, nullable=True)
    ds_qr_code_base64 = Column(Text, nullable=True)
    ds_ticket_url = Column(Text, nullable=True)

    # URLs de callback
    ds_success_url = Column(Text, nullable=True)
    ds_cancel_url = Column(Text, nullable=True)
    ds_failure_url = Column(Text, nullable=True)
    ds_pending_url = Column(Text, nullable=True)

    # Parcelamento
    qt_installments = Column(Integer, default=1)

    # Reembolso
    fg_refunded = Column(Boolean, default=False)
    dt_refunded = Column(DateTime, nullable=True)
    vl_refunded = Column(DECIMAL(10, 2), nullable=True)

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.now)
    dt_atualizacao = Column(DateTime, nullable=True, onupdate=datetime.now)
    dt_expiracao = Column(DateTime, nullable=True)
    fg_ativo = Column(Boolean, nullable=False, default=True)

    # Relationships (comentados por enquanto para evitar problemas de import circular)
    # empresa = relationship("TbEmpresa", foreign_keys=[id_empresa])
    # user = relationship("User", foreign_keys=[id_user])
    transacoes = relationship(
        "TbTransacaoPagamento", back_populates="pagamento", cascade="all, delete-orphan"
    )


class TbTransacaoPagamento(Base):
    """
    Model para tabela tb_transacoes_pagamento.

    Representa histórico de eventos e transições de estado dos pagamentos.
    """

    __tablename__ = "tb_transacoes_pagamento"

    # Identificação
    id_transacao = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_pagamento = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_pagamentos.id_pagamento", ondelete="CASCADE"),
        nullable=False,
    )

    # Tipo de evento
    ds_evento_tipo = Column(String(100), nullable=False)
    ds_evento_origem = Column(String(50), nullable=False)

    # Status
    ds_status_anterior = Column(String(50), nullable=True)
    ds_status_novo = Column(String(50), nullable=False)

    # Dados do evento
    ds_evento_data = Column(JSONB, nullable=True)
    ds_resposta_data = Column(JSONB, nullable=True)

    # Informações adicionais
    ds_mensagem = Column(Text, nullable=True)
    ds_codigo_erro = Column(String(100), nullable=True)

    # Request info (debugging)
    ds_ip_address = Column(INET, nullable=True)
    ds_user_agent = Column(Text, nullable=True)

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.now)

    # Relationships
    pagamento = relationship("TbPagamento", back_populates="transacoes")


# =====================================================
# PYDANTIC SCHEMAS
# =====================================================


class PagamentoCreate(BaseModel):
    """Schema para criação de pagamento."""

    id_empresa: uuid.UUID
    id_user: Optional[uuid.UUID] = None
    ds_gateway: GatewayEnum
    ds_tipo_pagamento: TipoPagamentoEnum
    ds_external_id: str
    ds_session_id: Optional[str] = None
    ds_payment_method: Optional[str] = None
    vl_amount: Decimal
    ds_currency: str = "BRL"
    vl_fee: Optional[Decimal] = None
    vl_net: Optional[Decimal] = None
    ds_status: StatusPagamentoEnum
    ds_status_detail: Optional[str] = None
    ds_payer_email: Optional[str] = None
    ds_payer_name: Optional[str] = None
    ds_payer_cpf: Optional[str] = None
    nm_payer_phone: Optional[str] = None
    ds_description: Optional[str] = None
    ds_metadata: Optional[Dict] = None
    ds_qr_code: Optional[str] = None
    ds_qr_code_base64: Optional[str] = None
    ds_ticket_url: Optional[str] = None
    ds_success_url: Optional[str] = None
    ds_cancel_url: Optional[str] = None
    ds_failure_url: Optional[str] = None
    ds_pending_url: Optional[str] = None
    qt_installments: int = 1
    dt_expiracao: Optional[datetime] = None

    class Config:
        from_attributes = True


class PagamentoUpdate(BaseModel):
    """Schema para atualização de pagamento."""

    ds_status: Optional[StatusPagamentoEnum] = None
    ds_status_detail: Optional[str] = None
    ds_payment_method: Optional[str] = None
    vl_fee: Optional[Decimal] = None
    vl_net: Optional[Decimal] = None
    fg_refunded: Optional[bool] = None
    dt_refunded: Optional[datetime] = None
    vl_refunded: Optional[Decimal] = None
    ds_metadata: Optional[Dict] = None

    class Config:
        from_attributes = True


class PagamentoResponse(BaseModel):
    """Schema para resposta de pagamento."""

    id_pagamento: uuid.UUID
    id_empresa: uuid.UUID
    id_user: Optional[uuid.UUID]
    ds_gateway: str
    ds_tipo_pagamento: str
    ds_external_id: str
    ds_session_id: Optional[str]
    ds_payment_method: Optional[str]
    vl_amount: Decimal
    ds_currency: str
    vl_fee: Optional[Decimal]
    vl_net: Optional[Decimal]
    ds_status: str
    ds_status_detail: Optional[str]
    ds_payer_email: Optional[str]
    ds_payer_name: Optional[str]
    ds_payer_cpf: Optional[str]
    nm_payer_phone: Optional[str]
    ds_description: Optional[str]
    ds_metadata: Optional[Dict]
    ds_qr_code: Optional[str]
    ds_qr_code_base64: Optional[str]
    ds_ticket_url: Optional[str]
    qt_installments: int
    fg_refunded: bool
    dt_refunded: Optional[datetime]
    vl_refunded: Optional[Decimal]
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]
    dt_expiracao: Optional[datetime]
    fg_ativo: bool

    class Config:
        from_attributes = True


class TransacaoPagamentoCreate(BaseModel):
    """Schema para criação de transação."""

    id_pagamento: uuid.UUID
    ds_evento_tipo: str
    ds_evento_origem: EventoOrigemEnum
    ds_status_anterior: Optional[str] = None
    ds_status_novo: str
    ds_evento_data: Optional[Dict] = None
    ds_resposta_data: Optional[Dict] = None
    ds_mensagem: Optional[str] = None
    ds_codigo_erro: Optional[str] = None
    ds_ip_address: Optional[str] = None
    ds_user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class TransacaoPagamentoResponse(BaseModel):
    """Schema para resposta de transação."""

    id_transacao: uuid.UUID
    id_pagamento: uuid.UUID
    ds_evento_tipo: str
    ds_evento_origem: str
    ds_status_anterior: Optional[str]
    ds_status_novo: str
    ds_evento_data: Optional[Dict]
    ds_resposta_data: Optional[Dict]
    ds_mensagem: Optional[str]
    ds_codigo_erro: Optional[str]
    ds_ip_address: Optional[str]
    ds_user_agent: Optional[str]
    dt_criacao: datetime

    class Config:
        from_attributes = True


class PagamentoListResponse(BaseModel):
    """Schema para lista de pagamentos."""

    total: int
    page: int
    size: int
    data: List[PagamentoResponse]

    class Config:
        from_attributes = True
