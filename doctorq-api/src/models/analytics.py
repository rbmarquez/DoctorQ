"""
Modelos de dados para Analytics de Negócio
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# =============================================================================
# ENUMS
# =============================================================================


class MetricType(str, Enum):
    """Tipos de métricas"""

    # User Metrics
    DAILY_ACTIVE_USERS = "daily_active_users"
    MONTHLY_ACTIVE_USERS = "monthly_active_users"
    NEW_USERS = "new_users"
    CHURNED_USERS = "churned_users"

    # Conversation Metrics
    TOTAL_CONVERSATIONS = "total_conversations"
    TOTAL_MESSAGES = "total_messages"
    AVG_CONVERSATION_LENGTH = "avg_conversation_length"
    AVG_RESPONSE_TIME = "avg_response_time"

    # Revenue Metrics
    MRR = "mrr"  # Monthly Recurring Revenue
    ARR = "arr"  # Annual Recurring Revenue
    NEW_MRR = "new_mrr"
    CHURNED_MRR = "churned_mrr"
    EXPANSION_MRR = "expansion_mrr"

    # Agent Metrics
    TOTAL_AGENTS = "total_agents"
    ACTIVE_AGENTS = "active_agents"
    AVG_AGENT_USAGE = "avg_agent_usage"

    # Template Metrics
    TEMPLATE_INSTALLS = "template_installs"
    TEMPLATE_REVIEWS = "template_reviews"
    AVG_TEMPLATE_RATING = "avg_template_rating"

    # Usage Metrics
    API_CALLS = "api_calls"
    TOKENS_USED = "tokens_used"
    STORAGE_USED_GB = "storage_used_gb"


class ReportType(str, Enum):
    """Tipos de relatórios"""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class EventType(str, Enum):
    """Tipos de eventos de analytics"""

    # User Events
    USER_LOGIN = "user_login"
    USER_SIGNUP = "user_signup"
    USER_LOGOUT = "user_logout"
    USER_PROFILE_UPDATED = "user_profile_updated"

    # Conversation Events
    CONVERSATION_CREATED = "conversation_created"
    CONVERSATION_DELETED = "conversation_deleted"
    MESSAGE_SENT = "message_sent"
    MESSAGE_RECEIVED = "message_received"

    # Agent Events
    AGENT_CREATED = "agent_created"
    AGENT_UPDATED = "agent_updated"
    AGENT_DELETED = "agent_deleted"
    AGENT_EXECUTED = "agent_executed"

    # Subscription Events
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_UPDATED = "subscription_updated"
    SUBSCRIPTION_CANCELED = "subscription_canceled"

    # Template Events
    TEMPLATE_INSTALLED = "template_installed"
    TEMPLATE_REVIEWED = "template_reviewed"

    # API Events
    API_CALL = "api_call"
    ERROR_OCCURRED = "error_occurred"

    # Feature Usage
    FEATURE_USED = "feature_used"


# =============================================================================
# SQLALCHEMY MODELS
# =============================================================================


class AnalyticsSnapshot(Base):
    """Modelo para tb_analytics_snapshots - snapshot diário de métricas"""

    __tablename__ = "tb_analytics_snapshots"

    id_snapshot = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_snapshot"
    )

    # Data do snapshot
    dt_snapshot = Column(Date, nullable=False, name="dt_snapshot")

    # Tipo de métrica
    nm_metric_type = Column(String(100), nullable=False, name="nm_metric_type")

    # Valor da métrica
    nr_value = Column(Numeric(20, 4), nullable=False, name="nr_value")

    # Dimensões (para segmentação)
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=True,
        name="id_empresa",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=True,
        name="id_user",
    )

    # Metadados adicionais
    ds_metadata = Column(JSONB, nullable=True, name="ds_metadata")

    # Auditoria
    dt_criacao = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        name="dt_criacao",
    )

    # Relacionamentos
    empresa = relationship("Empresa", lazy="select")
    user = relationship("User", lazy="select")

    def __repr__(self):
        return f"<AnalyticsSnapshot(dt_snapshot={self.dt_snapshot}, metric={self.nm_metric_type}, value={self.nr_value})>"


class AnalyticsEvent(Base):
    """Modelo para tb_analytics_events - eventos de analytics em tempo real"""

    __tablename__ = "tb_analytics_events"

    id_event = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_event"
    )

    # Tipo de evento
    nm_event_type = Column(String(100), nullable=False, name="nm_event_type")
    # Exemplos: user_login, conversation_started, message_sent, agent_created,
    #           template_installed, subscription_created, payment_successful

    # Propriedades do evento
    ds_properties = Column(JSONB, nullable=True, name="ds_properties")

    # Associações
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=True,
        name="id_user",
    )
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=True,
        name="id_empresa",
    )

    # Timestamp
    dt_evento = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        name="dt_evento",
    )

    # Relacionamentos
    user = relationship("User", lazy="select")
    empresa = relationship("Empresa", lazy="select")

    def __repr__(self):
        return f"<AnalyticsEvent(event={self.nm_event_type}, user={self.id_user}, timestamp={self.dt_evento})>"


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================


# -----------------------------------------------------------------------------
# Snapshot Schemas
# -----------------------------------------------------------------------------


class SnapshotBase(BaseModel):
    """Schema base para Snapshot"""

    dt_snapshot: date
    nm_metric_type: MetricType
    nr_value: Decimal
    id_empresa: Optional[uuid.UUID] = None
    id_user: Optional[uuid.UUID] = None
    ds_metadata: Optional[Dict] = None


class SnapshotCreate(SnapshotBase):
    """Schema para criar Snapshot"""

    pass


class SnapshotResponse(SnapshotBase):
    """Schema de resposta para Snapshot"""

    id_snapshot: uuid.UUID
    dt_criacao: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Event Schemas
# -----------------------------------------------------------------------------


class EventBase(BaseModel):
    """Schema base para Event"""

    nm_event_type: str = Field(..., description="Tipo do evento")
    ds_properties: Optional[Dict] = Field(None, description="Propriedades do evento")
    id_user: Optional[uuid.UUID] = None
    id_empresa: Optional[uuid.UUID] = None


class EventCreate(EventBase):
    """Schema para criar Event"""

    pass


# Alias para compatibilidade com imports
AnalyticsEventCreate = EventCreate


class EventResponse(EventBase):
    """Schema de resposta para Event"""

    id_event: uuid.UUID
    dt_evento: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Analytics Report Schemas
# -----------------------------------------------------------------------------


class MetricValue(BaseModel):
    """Valor de uma métrica com metadata"""

    metric_type: MetricType
    value: Decimal
    change_percentage: Optional[float] = None  # Comparado com período anterior
    timestamp: datetime


class UserAnalytics(BaseModel):
    """Analytics de usuários"""

    total_users: int
    active_users: int
    new_users: int
    churn_rate: Decimal
    retention_rate: Decimal


class ConversationAnalytics(BaseModel):
    """Analytics de conversas"""

    total_conversations: int
    active_conversations: int
    total_messages: int
    avg_messages_per_conversation: Decimal
    engagement_rate: Decimal


class RevenueAnalytics(BaseModel):
    """Analytics de receita"""

    mrr: Decimal  # Monthly Recurring Revenue
    arr: Decimal  # Annual Recurring Revenue
    paid_subscriptions: int
    trial_subscriptions: int
    arpu: Decimal  # Average Revenue Per User
    ltv: Decimal  # Lifetime Value


class AgentAnalytics(BaseModel):
    """Analytics de agentes"""

    total_agents: int


class TemplateAnalytics(BaseModel):
    """Analytics de templates"""

    total_templates: int
    total_installations: int
    total_reviews: int
    avg_rating: Decimal
    top_templates: List[str]


class UsageAnalytics(BaseModel):
    """Analytics de uso da plataforma"""

    total_api_calls: int
    total_tokens: int
    total_storage_gb: Decimal
    avg_tokens_per_call: Decimal
    estimated_cost: Decimal


class DashboardSummary(BaseModel):
    """Resumo completo do dashboard"""

    users: UserAnalytics
    conversations: ConversationAnalytics
    revenue: RevenueAnalytics
    agents: AgentAnalytics
    templates: TemplateAnalytics
    usage: UsageAnalytics
    generated_at: datetime = Field(default_factory=datetime.now)


# -----------------------------------------------------------------------------
# Filtros e Consultas
# -----------------------------------------------------------------------------


class AnalyticsDateRange(BaseModel):
    """Range de datas para consultas"""

    start_date: date
    end_date: date


class AnalyticsFilters(BaseModel):
    """Filtros para analytics"""

    date_range: AnalyticsDateRange
    empresa_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    metric_types: Optional[List[MetricType]] = None
    group_by: Optional[str] = None  # day, week, month


class TimeSeriesData(BaseModel):
    """Dados de série temporal"""

    metric_type: MetricType
    data_points: List[Dict]  # [{date, value}]
    total: Decimal
    avg: Decimal
    min: Decimal
    max: Decimal


class CohortAnalysis(BaseModel):
    """Análise de cohort"""

    cohort_month: str  # YYYY-MM
    user_count: int
    retention_rates: Dict[str, float]  # {month_0: 100, month_1: 85, ...}
    revenue_per_cohort: Dict[str, Decimal]
