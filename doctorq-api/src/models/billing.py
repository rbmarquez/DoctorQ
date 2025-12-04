"""
Modelos de dados para Billing e Monetização
Gerencia planos, assinaturas e métricas de uso
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import (
    CHAR,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text

from src.models.base import Base


# =============================================================================
# ENUMS
# =============================================================================


class PlanTier(str, Enum):
    """Tiers de planos disponíveis"""

    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    """Status da assinatura"""

    ACTIVE = "active"  # Assinatura ativa e funcionando
    TRIALING = "trialing"  # Período de trial
    PAST_DUE = "past_due"  # Pagamento atrasado
    CANCELED = "canceled"  # Cancelada pelo usuário
    UNPAID = "unpaid"  # Cancelada por falta de pagamento
    PAUSED = "paused"  # Pausada temporariamente


class BillingInterval(str, Enum):
    """Intervalo de cobrança"""

    MONTH = "month"
    YEAR = "year"


class UsageMetricType(str, Enum):
    """Tipos de métricas de uso"""

    API_CALLS = "api_calls"
    TOKENS = "tokens"
    MESSAGES = "messages"
    AGENTS = "agents"
    DOCUMENT_STORES = "document_stores"
    STORAGE_GB = "storage_gb"
    EMBEDDINGS = "embeddings"


class PaymentStatus(str, Enum):
    """Status do pagamento"""

    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"
    REFUNDED = "refunded"


class InvoiceStatus(str, Enum):
    """Status da invoice"""

    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    UNCOLLECTIBLE = "uncollectible"
    VOID = "void"


# =============================================================================
# SQLALCHEMY MODELS
# =============================================================================


class Plan(Base):
    """Modelo para planos de assinatura"""

    __tablename__ = "tb_plans"

    id_plan = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_plan",
    )
    nm_plan = Column(String(100), nullable=False, unique=True, name="nm_plan")
    ds_plan = Column(String(500), nullable=True, name="ds_plan")
    nm_tier = Column(
        String(20),
        nullable=False,
        server_default=text("'free'"),
        name="nm_tier",
    )
    vl_price_monthly = Column(
        Numeric(10, 2),
        nullable=False,
        server_default=text("0.00"),
        name="vl_price_monthly",
    )
    vl_price_yearly = Column(
        Numeric(10, 2),
        nullable=False,
        server_default=text("0.00"),
        name="vl_price_yearly",
    )
    ds_features = Column(JSONB, nullable=True, name="ds_features")  # Lista de features
    ds_quotas = Column(JSONB, nullable=True, name="ds_quotas")  # Quotas (ex: max_agents)
    st_ativo = Column(
        CHAR(1),
        nullable=False,
        server_default=text("'S'"),
        name="st_ativo",
    )
    st_visivel = Column(
        CHAR(1),
        nullable=False,
        server_default=text("'S'"),
        name="st_visivel",
    )
    nr_trial_days = Column(
        Integer,
        nullable=False,
        server_default=text("0"),
        name="nr_trial_days",
    )
    nm_stripe_price_id_monthly = Column(
        String(100), nullable=True, name="nm_stripe_price_id_monthly"
    )
    nm_stripe_price_id_yearly = Column(
        String(100), nullable=True, name="nm_stripe_price_id_yearly"
    )
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=True,
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    # Relacionamentos
    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    """Modelo para assinaturas de usuários"""

    __tablename__ = "tb_subscriptions"

    id_subscription = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_subscription",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    id_plan = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_plans.id_plan", ondelete="SET NULL"),
        nullable=True,
        name="id_plan",
    )
    nm_status = Column(
        String(20),
        nullable=False,
        server_default=text("'trialing'"),
        name="nm_status",
    )
    nm_billing_interval = Column(
        String(10),
        nullable=False,
        server_default=text("'month'"),
        name="nm_billing_interval",
    )
    dt_start = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_start",
    )
    dt_trial_end = Column(DateTime, nullable=True, name="dt_trial_end")
    dt_current_period_start = Column(
        DateTime, nullable=True, name="dt_current_period_start"
    )
    dt_current_period_end = Column(DateTime, nullable=True, name="dt_current_period_end")
    dt_canceled_at = Column(DateTime, nullable=True, name="dt_canceled_at")
    dt_ended_at = Column(DateTime, nullable=True, name="dt_ended_at")
    nm_stripe_subscription_id = Column(
        String(100), nullable=True, unique=True, name="nm_stripe_subscription_id"
    )
    nm_stripe_customer_id = Column(
        String(100), nullable=True, name="nm_stripe_customer_id"
    )
    ds_metadata = Column(JSONB, nullable=True, name="ds_metadata")
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=True,
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    # Relacionamentos
    user = relationship("User", backref="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    usage_metrics = relationship("UsageMetric", back_populates="subscription")


class UsageMetric(Base):
    """Modelo para métricas de uso por usuário"""

    __tablename__ = "tb_usage_metrics"

    id_metric = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_metric",
    )
    id_subscription = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_subscriptions.id_subscription", ondelete="CASCADE"),
        nullable=False,
        name="id_subscription",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    nm_metric_type = Column(
        String(50),
        nullable=False,
        name="nm_metric_type",
    )
    nr_value = Column(
        Numeric(15, 2),
        nullable=False,
        server_default=text("0.00"),
        name="nr_value",
    )
    dt_period_start = Column(DateTime, nullable=False, name="dt_period_start")
    dt_period_end = Column(DateTime, nullable=False, name="dt_period_end")
    ds_metadata = Column(
        JSONB, nullable=True, name="ds_metadata"
    )  # Ex: breakdown por agente
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )

    # Relacionamentos
    subscription = relationship("Subscription", back_populates="usage_metrics")
    user = relationship("User", backref="usage_metrics")


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================


class PlanBase(BaseModel):
    """Schema base para Plan"""

    nm_plan: str = Field(..., min_length=1, max_length=100, description="Nome do plano")
    ds_plan: Optional[str] = Field(
        None, max_length=500, description="Descrição do plano"
    )
    nm_tier: PlanTier = Field(PlanTier.FREE, description="Tier do plano")
    vl_price_monthly: Decimal = Field(
        Decimal("0.00"), ge=0, description="Preço mensal"
    )
    vl_price_yearly: Decimal = Field(Decimal("0.00"), ge=0, description="Preço anual")
    ds_features: Optional[Dict[str, Any]] = Field(
        None, description="Features incluídas"
    )
    ds_quotas: Optional[Dict[str, int]] = Field(None, description="Quotas de uso")
    nr_trial_days: int = Field(0, ge=0, le=365, description="Dias de trial")


class PlanCreate(PlanBase):
    """Schema para criar plano"""

    nm_stripe_price_id_monthly: Optional[str] = Field(
        None, description="ID do preço mensal no Stripe"
    )
    nm_stripe_price_id_yearly: Optional[str] = Field(
        None, description="ID do preço anual no Stripe"
    )


class PlanUpdate(BaseModel):
    """Schema para atualizar plano"""

    nm_plan: Optional[str] = Field(None, min_length=1, max_length=100)
    ds_plan: Optional[str] = Field(None, max_length=500)
    vl_price_monthly: Optional[Decimal] = Field(None, ge=0)
    vl_price_yearly: Optional[Decimal] = Field(None, ge=0)
    ds_features: Optional[Dict[str, Any]] = None
    ds_quotas: Optional[Dict[str, int]] = None
    st_ativo: Optional[str] = Field(None, pattern="^[SN]$")
    st_visivel: Optional[str] = Field(None, pattern="^[SN]$")
    nr_trial_days: Optional[int] = Field(None, ge=0, le=365)


class PlanResponse(PlanBase):
    """Schema de resposta para plano"""

    id_plan: uuid.UUID
    st_ativo: str
    st_visivel: str
    nm_stripe_price_id_monthly: Optional[str]
    nm_stripe_price_id_yearly: Optional[str]
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]

    class Config:
        from_attributes = True


class SubscriptionBase(BaseModel):
    """Schema base para Subscription"""

    id_plan: uuid.UUID = Field(..., description="ID do plano")
    nm_billing_interval: BillingInterval = Field(
        BillingInterval.MONTH, description="Intervalo de cobrança"
    )


class SubscriptionCreate(SubscriptionBase):
    """Schema para criar assinatura"""

    id_user: uuid.UUID = Field(..., description="ID do usuário")
    nm_stripe_customer_id: Optional[str] = Field(None, description="ID do customer no Stripe")


class SubscriptionUpdate(BaseModel):
    """Schema para atualizar assinatura"""

    id_plan: Optional[uuid.UUID] = None
    nm_status: Optional[SubscriptionStatus] = None
    nm_billing_interval: Optional[BillingInterval] = None
    dt_trial_end: Optional[datetime] = None
    dt_canceled_at: Optional[datetime] = None


class SubscriptionResponse(SubscriptionBase):
    """Schema de resposta para assinatura"""

    id_subscription: uuid.UUID
    id_user: uuid.UUID
    nm_status: SubscriptionStatus
    dt_start: datetime
    dt_trial_end: Optional[datetime]
    dt_current_period_start: Optional[datetime]
    dt_current_period_end: Optional[datetime]
    dt_canceled_at: Optional[datetime]
    dt_ended_at: Optional[datetime]
    nm_stripe_subscription_id: Optional[str]
    nm_stripe_customer_id: Optional[str]
    ds_metadata: Optional[Dict[str, Any]]
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]

    # Nested plan info
    plan: Optional[PlanResponse] = None

    class Config:
        from_attributes = True


class UsageMetricBase(BaseModel):
    """Schema base para métrica de uso"""

    nm_metric_type: UsageMetricType = Field(..., description="Tipo de métrica")
    nr_value: Decimal = Field(..., ge=0, description="Valor da métrica")
    dt_period_start: datetime = Field(..., description="Início do período")
    dt_period_end: datetime = Field(..., description="Fim do período")
    ds_metadata: Optional[Dict[str, Any]] = Field(None, description="Metadados adicionais")


class UsageMetricCreate(UsageMetricBase):
    """Schema para criar métrica de uso"""

    id_subscription: uuid.UUID = Field(..., description="ID da assinatura")
    id_user: uuid.UUID = Field(..., description="ID do usuário")


class UsageMetricResponse(UsageMetricBase):
    """Schema de resposta para métrica de uso"""

    id_metric: uuid.UUID
    id_subscription: uuid.UUID
    id_user: uuid.UUID
    dt_criacao: datetime

    class Config:
        from_attributes = True


class UsageSummary(BaseModel):
    """Schema para resumo de uso do usuário"""

    id_user: uuid.UUID
    current_period_start: datetime
    current_period_end: datetime
    metrics: Dict[str, Decimal] = Field(
        default_factory=dict, description="Métricas por tipo"
    )
    quotas: Dict[str, int] = Field(default_factory=dict, description="Quotas do plano")
    usage_percentage: Dict[str, float] = Field(
        default_factory=dict, description="Percentual de uso por quota"
    )


class SubscriptionListResponse(BaseModel):
    """Schema para lista paginada de assinaturas"""

    subscriptions: List[SubscriptionResponse]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def create_response(
        cls,
        subscriptions: List[Subscription],
        total: int,
        page: int,
        size: int,
    ) -> "SubscriptionListResponse":
        """Cria resposta paginada"""
        pages = (total + size - 1) // size if size > 0 else 0
        return cls(
            subscriptions=[
                SubscriptionResponse.model_validate(sub) for sub in subscriptions
            ],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )


# =============================================================================
# PAYMENT MODELS
# =============================================================================


class Payment(Base):
    """Modelo SQLAlchemy para Payments"""

    __tablename__ = "tb_payments"

    id_payment = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_payment",
    )
    id_subscription = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_subscriptions.id_subscription", ondelete="CASCADE"),
        nullable=False,
        name="id_subscription",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    id_invoice = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_invoices.id_invoice", ondelete="SET NULL"),
        nullable=True,
        name="id_invoice",
    )

    # Stripe data
    nm_stripe_payment_id = Column(String(255), unique=True, name="nm_stripe_payment_id")
    nm_stripe_payment_intent_id = Column(
        String(255), name="nm_stripe_payment_intent_id"
    )
    nm_payment_method = Column(String(50), nullable=False, name="nm_payment_method")
    nm_status = Column(
        String(50),
        nullable=False,
        server_default=text("'pending'"),
        name="nm_status",
    )

    # Amounts
    vl_amount = Column(Numeric(10, 2), nullable=False, name="vl_amount")
    vl_amount_refunded = Column(
        Numeric(10, 2), server_default=text("'0.00'"), name="vl_amount_refunded"
    )
    nm_currency = Column(
        String(3), nullable=False, server_default=text("'BRL'"), name="nm_currency"
    )

    # Metadata
    ds_metadata = Column(JSONB, name="ds_metadata")
    ds_failure_message = Column(String, name="ds_failure_message")
    ds_receipt_url = Column(String, name="ds_receipt_url")

    # Timestamps
    dt_paid_at = Column(DateTime, name="dt_paid_at")
    dt_refunded_at = Column(DateTime, name="dt_refunded_at")
    dt_criacao = Column(
        DateTime, server_default=func.now(), nullable=False, name="dt_criacao"
    )
    dt_atualizacao = Column(DateTime, server_default=func.now(), name="dt_atualizacao")


class Invoice(Base):
    """Modelo SQLAlchemy para Invoices"""

    __tablename__ = "tb_invoices"

    id_invoice = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_invoice",
    )
    id_subscription = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_subscriptions.id_subscription", ondelete="CASCADE"),
        nullable=False,
        name="id_subscription",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )

    # Invoice data
    nm_stripe_invoice_id = Column(
        String(255), unique=True, name="nm_stripe_invoice_id"
    )
    nm_invoice_number = Column(String(100), name="nm_invoice_number")
    nm_status = Column(
        String(50),
        nullable=False,
        server_default=text("'draft'"),
        name="nm_status",
    )

    # Amounts
    vl_subtotal = Column(Numeric(10, 2), nullable=False, name="vl_subtotal")
    vl_tax = Column(Numeric(10, 2), server_default=text("'0.00'"), name="vl_tax")
    vl_discount = Column(Numeric(10, 2), server_default=text("'0.00'"), name="vl_discount")
    vl_total = Column(Numeric(10, 2), nullable=False, name="vl_total")
    vl_amount_paid = Column(
        Numeric(10, 2), server_default=text("'0.00'"), name="vl_amount_paid"
    )
    vl_amount_due = Column(Numeric(10, 2), nullable=False, name="vl_amount_due")
    nm_currency = Column(
        String(3), nullable=False, server_default=text("'BRL'"), name="nm_currency"
    )

    # Period
    dt_period_start = Column(DateTime, nullable=False, name="dt_period_start")
    dt_period_end = Column(DateTime, nullable=False, name="dt_period_end")

    # Important dates
    dt_due_date = Column(DateTime, name="dt_due_date")
    dt_paid_at = Column(DateTime, name="dt_paid_at")
    dt_finalized_at = Column(DateTime, name="dt_finalized_at")
    dt_voided_at = Column(DateTime, name="dt_voided_at")

    # Metadata
    ds_description = Column(String, name="ds_description")
    ds_items = Column(JSONB, name="ds_items")
    ds_metadata = Column(JSONB, name="ds_metadata")
    ds_invoice_pdf_url = Column(String, name="ds_invoice_pdf_url")
    ds_hosted_invoice_url = Column(String, name="ds_hosted_invoice_url")

    # Timestamps
    dt_criacao = Column(
        DateTime, server_default=func.now(), nullable=False, name="dt_criacao"
    )
    dt_atualizacao = Column(DateTime, server_default=func.now(), name="dt_atualizacao")


# =============================================================================
# PYDANTIC SCHEMAS - PAYMENT
# =============================================================================


class PaymentBase(BaseModel):
    """Schema base para Payment"""

    id_subscription: uuid.UUID
    id_user: uuid.UUID
    id_invoice: Optional[uuid.UUID] = None
    nm_payment_method: str
    vl_amount: Decimal
    nm_currency: str = "BRL"
    ds_metadata: Optional[Dict[str, Any]] = None


class PaymentCreate(PaymentBase):
    """Schema para criar Payment"""

    nm_stripe_payment_id: Optional[str] = None
    nm_stripe_payment_intent_id: Optional[str] = None
    nm_status: PaymentStatus = PaymentStatus.PENDING


class PaymentUpdate(BaseModel):
    """Schema para atualizar Payment"""

    nm_status: Optional[PaymentStatus] = None
    vl_amount_refunded: Optional[Decimal] = None
    ds_failure_message: Optional[str] = None
    ds_receipt_url: Optional[str] = None
    dt_paid_at: Optional[datetime] = None
    dt_refunded_at: Optional[datetime] = None


class PaymentResponse(BaseModel):
    """Schema de resposta para Payment"""

    id_payment: uuid.UUID
    id_subscription: uuid.UUID
    id_user: uuid.UUID
    id_invoice: Optional[uuid.UUID] = None
    nm_stripe_payment_id: Optional[str] = None
    nm_payment_method: str
    nm_status: str
    vl_amount: Decimal
    vl_amount_refunded: Decimal
    nm_currency: str
    ds_metadata: Optional[Dict[str, Any]] = None
    ds_failure_message: Optional[str] = None
    ds_receipt_url: Optional[str] = None
    dt_paid_at: Optional[datetime] = None
    dt_refunded_at: Optional[datetime] = None
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    model_config = {"from_attributes": True}


# =============================================================================
# PYDANTIC SCHEMAS - INVOICE
# =============================================================================


class InvoiceBase(BaseModel):
    """Schema base para Invoice"""

    id_subscription: uuid.UUID
    id_user: uuid.UUID
    vl_subtotal: Decimal
    vl_tax: Decimal = Decimal("0.00")
    vl_discount: Decimal = Decimal("0.00")
    vl_total: Decimal
    vl_amount_due: Decimal
    dt_period_start: datetime
    dt_period_end: datetime
    nm_currency: str = "BRL"


class InvoiceCreate(InvoiceBase):
    """Schema para criar Invoice"""

    nm_stripe_invoice_id: Optional[str] = None
    nm_status: InvoiceStatus = InvoiceStatus.DRAFT
    dt_due_date: Optional[datetime] = None
    ds_description: Optional[str] = None
    ds_items: Optional[List[Dict[str, Any]]] = None
    ds_metadata: Optional[Dict[str, Any]] = None


class InvoiceUpdate(BaseModel):
    """Schema para atualizar Invoice"""

    nm_status: Optional[InvoiceStatus] = None
    vl_amount_paid: Optional[Decimal] = None
    vl_amount_due: Optional[Decimal] = None
    dt_paid_at: Optional[datetime] = None
    dt_finalized_at: Optional[datetime] = None
    dt_voided_at: Optional[datetime] = None
    ds_invoice_pdf_url: Optional[str] = None
    ds_hosted_invoice_url: Optional[str] = None


class InvoiceResponse(BaseModel):
    """Schema de resposta para Invoice"""

    id_invoice: uuid.UUID
    id_subscription: uuid.UUID
    id_user: uuid.UUID
    nm_stripe_invoice_id: Optional[str] = None
    nm_invoice_number: Optional[str] = None
    nm_status: str
    vl_subtotal: Decimal
    vl_tax: Decimal
    vl_discount: Decimal
    vl_total: Decimal
    vl_amount_paid: Decimal
    vl_amount_due: Decimal
    nm_currency: str
    dt_period_start: datetime
    dt_period_end: datetime
    dt_due_date: Optional[datetime] = None
    dt_paid_at: Optional[datetime] = None
    dt_finalized_at: Optional[datetime] = None
    dt_voided_at: Optional[datetime] = None
    ds_description: Optional[str] = None
    ds_items: Optional[List[Dict[str, Any]]] = None
    ds_metadata: Optional[Dict[str, Any]] = None
    ds_invoice_pdf_url: Optional[str] = None
    ds_hosted_invoice_url: Optional[str] = None
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    model_config = {"from_attributes": True}
