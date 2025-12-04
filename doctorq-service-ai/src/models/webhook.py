"""
Modelos de dados para Webhooks e Integrações
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl, validator
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# =============================================================================
# ENUMS
# =============================================================================


class WebhookEvent(str, Enum):
    """Tipos de eventos de webhook"""

    # Conversas
    CONVERSATION_CREATED = "conversation.created"
    CONVERSATION_DELETED = "conversation.deleted"
    CONVERSATION_UPDATED = "conversation.updated"

    # Mensagens
    MESSAGE_SENT = "message.sent"
    MESSAGE_RECEIVED = "message.received"

    # Agentes
    AGENT_CREATED = "agent.created"
    AGENT_UPDATED = "agent.updated"
    AGENT_DELETED = "agent.deleted"

    # Assinaturas
    SUBSCRIPTION_CREATED = "subscription.created"
    SUBSCRIPTION_UPDATED = "subscription.updated"
    SUBSCRIPTION_CANCELED = "subscription.canceled"
    SUBSCRIPTION_TRIAL_ENDING = "subscription.trial_ending"

    # Quotas
    QUOTA_EXCEEDED = "quota.exceeded"
    QUOTA_WARNING = "quota.warning"  # 80% do limite

    # Templates
    TEMPLATE_INSTALLED = "template.installed"
    TEMPLATE_REVIEWED = "template.reviewed"

    # Onboarding
    ONBOARDING_STARTED = "onboarding.started"
    ONBOARDING_COMPLETED = "onboarding.completed"
    ONBOARDING_STEP_COMPLETED = "onboarding.step_completed"


class WebhookStatus(str, Enum):
    """Status do webhook"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    FAILED = "failed"  # Falhas recorrentes


class DeliveryStatus(str, Enum):
    """Status de entrega de webhook"""

    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRYING = "retrying"


# =============================================================================
# SQLALCHEMY MODELS
# =============================================================================


class Webhook(Base):
    """Modelo para tb_webhooks - Configurações de webhooks"""

    __tablename__ = "tb_webhooks"

    id_webhook = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_webhook"
    )

    # Relacionamentos
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="SET NULL"),
        nullable=True,
        name="id_empresa",
    )

    # Configurações
    nm_webhook = Column(String(200), nullable=False, name="nm_webhook")
    ds_webhook = Column(Text, nullable=True, name="ds_webhook")
    ds_url = Column(String(500), nullable=False, name="ds_url")

    # Eventos subscritos (array)
    ds_events = Column(JSONB, nullable=False, name="ds_events")

    # Secret para validação de assinatura
    ds_secret = Column(String(200), nullable=True, name="ds_secret")

    # Status
    nm_status = Column(
        String(20), nullable=False, server_default=text("'active'"), name="nm_status"
    )

    # Retry config
    nr_max_retries = Column(
        Integer, nullable=False, server_default=text("3"), name="nr_max_retries"
    )
    nr_retry_delay_seconds = Column(
        Integer, nullable=False, server_default=text("60"), name="nr_retry_delay_seconds"
    )

    # Estatísticas
    nr_success_count = Column(
        Integer, nullable=False, server_default=text("0"), name="nr_success_count"
    )
    nr_failure_count = Column(
        Integer, nullable=False, server_default=text("0"), name="nr_failure_count"
    )
    dt_last_success = Column(DateTime, nullable=True, name="dt_last_success")
    dt_last_failure = Column(DateTime, nullable=True, name="dt_last_failure")

    # Headers customizados (opcional)
    ds_headers = Column(JSONB, nullable=True, name="ds_headers")

    # Metadados
    ds_metadata = Column(JSONB, nullable=True, name="ds_metadata")

    # Auditoria
    dt_criacao = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=datetime.now,
        name="dt_atualizacao",
    )

    # Relacionamentos
    user = relationship("User", lazy="select")
    empresa = relationship("Empresa", lazy="select")
    deliveries = relationship("WebhookDelivery", back_populates="webhook", lazy="select")

    def __repr__(self):
        return f"<Webhook(id_webhook={self.id_webhook}, nm_webhook='{self.nm_webhook}', status='{self.nm_status}')>"


class WebhookDelivery(Base):
    """Modelo para tb_webhook_deliveries - Log de entregas de webhooks"""

    __tablename__ = "tb_webhook_deliveries"

    id_delivery = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_delivery"
    )

    # Relacionamentos
    id_webhook = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_webhooks.id_webhook", ondelete="CASCADE"),
        nullable=False,
        name="id_webhook",
    )

    # Evento
    nm_event_type = Column(String(100), nullable=False, name="nm_event_type")
    ds_event_data = Column(JSONB, nullable=False, name="ds_event_data")

    # Delivery
    nm_status = Column(
        String(20), nullable=False, server_default=text("'pending'"), name="nm_status"
    )
    nr_http_status = Column(Integer, nullable=True, name="nr_http_status")
    ds_response_body = Column(Text, nullable=True, name="ds_response_body")
    ds_error_message = Column(Text, nullable=True, name="ds_error_message")

    # Retry
    nr_attempt = Column(
        Integer, nullable=False, server_default=text("1"), name="nr_attempt"
    )
    dt_next_retry = Column(DateTime, nullable=True, name="dt_next_retry")

    # Timing
    nr_duration_ms = Column(Integer, nullable=True, name="nr_duration_ms")

    # Timestamps
    dt_criacao = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        name="dt_criacao",
    )
    dt_enviado = Column(DateTime, nullable=True, name="dt_enviado")
    dt_completado = Column(DateTime, nullable=True, name="dt_completado")

    # Relacionamentos
    webhook = relationship("Webhook", back_populates="deliveries", lazy="select")

    def __repr__(self):
        return f"<WebhookDelivery(id_delivery={self.id_delivery}, event='{self.nm_event_type}', status='{self.nm_status}')>"


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================


# -----------------------------------------------------------------------------
# Webhook Schemas
# -----------------------------------------------------------------------------


class WebhookBase(BaseModel):
    """Schema base para Webhook"""

    nm_webhook: str = Field(..., min_length=1, max_length=200, description="Nome do webhook")
    ds_webhook: Optional[str] = Field(None, description="Descrição do webhook")
    ds_url: HttpUrl = Field(..., description="URL de destino do webhook")
    ds_events: List[WebhookEvent] = Field(..., min_items=1, description="Eventos subscritos")
    ds_secret: Optional[str] = Field(None, description="Secret para validação HMAC")
    nr_max_retries: int = Field(3, ge=0, le=10, description="Máximo de tentativas")
    nr_retry_delay_seconds: int = Field(
        60, ge=1, le=3600, description="Delay entre tentativas (segundos)"
    )
    ds_headers: Optional[Dict[str, str]] = Field(
        None, description="Headers HTTP customizados"
    )
    ds_metadata: Optional[Dict] = Field(None, description="Metadados adicionais")

    @validator("ds_events")
    def validate_events_not_empty(cls, v):
        """Validar que há pelo menos um evento"""
        if not v:
            raise ValueError("Deve haver pelo menos um evento subscrito")
        return v


class WebhookCreate(WebhookBase):
    """Schema para criar Webhook"""

    id_user: uuid.UUID = Field(..., description="ID do usuário")
    id_empresa: Optional[uuid.UUID] = Field(None, description="ID da empresa")


class WebhookUpdate(BaseModel):
    """Schema para atualizar Webhook"""

    nm_webhook: Optional[str] = Field(None, min_length=1, max_length=200)
    ds_webhook: Optional[str] = None
    ds_url: Optional[HttpUrl] = None
    ds_events: Optional[List[WebhookEvent]] = Field(None, min_items=1)
    ds_secret: Optional[str] = None
    nm_status: Optional[WebhookStatus] = None
    nr_max_retries: Optional[int] = Field(None, ge=0, le=10)
    nr_retry_delay_seconds: Optional[int] = Field(None, ge=1, le=3600)
    ds_headers: Optional[Dict[str, str]] = None
    ds_metadata: Optional[Dict] = None


class WebhookResponse(WebhookBase):
    """Schema de resposta para Webhook"""

    id_webhook: uuid.UUID
    id_user: uuid.UUID
    id_empresa: Optional[uuid.UUID]
    nm_status: WebhookStatus
    nr_success_count: int
    nr_failure_count: int
    dt_last_success: Optional[datetime]
    dt_last_failure: Optional[datetime]
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Webhook Delivery Schemas
# -----------------------------------------------------------------------------


class WebhookDeliveryResponse(BaseModel):
    """Schema de resposta para WebhookDelivery"""

    id_delivery: uuid.UUID
    id_webhook: uuid.UUID
    nm_event_type: WebhookEvent
    ds_event_data: Dict
    nm_status: DeliveryStatus
    nr_http_status: Optional[int]
    ds_response_body: Optional[str]
    ds_error_message: Optional[str]
    nr_attempt: int
    dt_next_retry: Optional[datetime]
    nr_duration_ms: Optional[int]
    dt_criacao: datetime
    dt_enviado: Optional[datetime]
    dt_completado: Optional[datetime]

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Specialized Schemas
# -----------------------------------------------------------------------------


class WebhookEventPayload(BaseModel):
    """Payload de evento enviado para webhook"""

    id: str = Field(..., description="ID único do evento")
    type: WebhookEvent = Field(..., description="Tipo de evento")
    created_at: datetime = Field(..., description="Timestamp de criação")
    data: Dict = Field(..., description="Dados do evento")


class WebhookTestRequest(BaseModel):
    """Request para testar webhook"""

    event_type: WebhookEvent = Field(
        WebhookEvent.MESSAGE_SENT, description="Tipo de evento para teste"
    )
    test_data: Optional[Dict] = Field(None, description="Dados de teste customizados")


class WebhookStats(BaseModel):
    """Estatísticas de um webhook"""

    id_webhook: uuid.UUID
    nm_webhook: str
    total_deliveries: int
    successful_deliveries: int
    failed_deliveries: int
    pending_deliveries: int
    success_rate: float
    avg_response_time_ms: Optional[float]
    last_delivery: Optional[datetime]
