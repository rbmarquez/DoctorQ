"""
Modelos de dados para Onboarding de Usuários
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
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


class OnboardingStepType(str, Enum):
    """Tipos de steps de onboarding"""

    ACCOUNT_SETUP = "account_setup"  # Configuração de conta
    PROFILE_COMPLETION = "profile_completion"  # Completar perfil
    FIRST_AGENT = "first_agent"  # Criar primeiro agente
    FIRST_CONVERSATION = "first_conversation"  # Primeira conversa
    UPLOAD_DOCUMENT = "upload_document"  # Fazer upload de documento
    INSTALL_TEMPLATE = "install_template"  # Instalar template
    INVITE_TEAM = "invite_team"  # Convidar time
    CONFIGURE_TOOLS = "configure_tools"  # Configurar ferramentas
    SETUP_BILLING = "setup_billing"  # Configurar billing
    TUTORIAL_COMPLETED = "tutorial_completed"  # Tutorial completo

    # Clinic-specific steps
    CLINIC_INFO = "clinic_info"  # Informações da clínica
    LEAD_QUALIFICATION = "lead_qualification"  # Qualificação de lead
    TEAM_SETUP = "team_setup"  # Configuração de equipe
    SCHEDULE_SETUP = "schedule_setup"  # Configuração de horários
    SERVICES_SETUP = "services_setup"  # Configuração de serviços
    SCHEDULES = "schedules"  # Horários e agendamentos
    NOTIFICATIONS = "notifications"  # Notificações
    INTEGRATIONS = "integrations"  # Integrações
    PRIVACY = "privacy"  # Privacidade e aparência

    # Professional-specific steps
    PROFESSIONAL_INFO = "professional_info"  # Informações profissionais
    AVAILABILITY = "availability"  # Disponibilidade
    SERVICES = "services"  # Procedimentos do profissional
    PUBLIC_PROFILE = "public_profile"  # Perfil público

    # Supplier-specific steps
    SUPPLIER_INFO = "supplier_info"  # Informações do fornecedor
    SUPPLIER_TEAM = "supplier_team"  # Equipe comercial
    SUPPLIER_CATALOG = "supplier_catalog"  # Catálogo e categorias
    SUPPLIER_LOGISTICS = "supplier_logistics"  # Logística e políticas
    SUPPLIER_INTEGRATIONS = "supplier_integrations"  # Integrações e pagamentos
    SUPPLIER_REVIEW = "supplier_review"  # Revisão final antes de publicar

    CUSTOM = "custom"  # Step customizado


class OnboardingStatus(str, Enum):
    """Status do onboarding"""

    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class StepStatus(str, Enum):
    """Status de um step individual"""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


# =============================================================================
# SQLALCHEMY MODELS
# =============================================================================


class OnboardingFlow(Base):
    """Modelo para tb_onboarding_flows - Define flows de onboarding"""

    __tablename__ = "tb_onboarding_flows"

    id_flow = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_flow"
    )

    # Nome e descrição
    nm_flow = Column(String(100), nullable=False, unique=True, name="nm_flow")
    ds_flow = Column(Text, nullable=True, name="ds_flow")

    # Target (para quem é esse flow)
    nm_target_type = Column(
        String(50),
        nullable=False,
        server_default=text("'all_users'"),
        name="nm_target_type",
    )
    # Valores: 'all_users', 'free_users', 'paid_users', 'enterprise_users', 'custom'

    # Ordem de exibição
    nr_order = Column(Integer, nullable=False, server_default=text("0"), name="nr_order")

    # Ativo/Inativo
    bl_ativo = Column(
        Boolean, nullable=False, server_default=text("true"), name="bl_ativo"
    )

    # Steps do flow (JSON array de step configs)
    ds_steps = Column(JSONB, nullable=False, name="ds_steps")
    # Formato:
    # [
    #   {
    #     "step_type": "account_setup",
    #     "title": "Complete seu perfil",
    #     "description": "Adicione suas informações",
    #     "order": 1,
    #     "required": true,
    #     "help_url": "https://docs.../setup",
    #     "estimated_minutes": 5
    #   }
    # ]

    # Configurações do flow
    ds_config = Column(JSONB, nullable=True, name="ds_config")
    # Formato:
    # {
    #   "allow_skip": true,
    #   "show_progress_bar": true,
    #   "auto_advance": false,
    #   "celebration_on_complete": true
    # }

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
    user_progress = relationship(
        "UserOnboardingProgress", back_populates="flow", lazy="select"
    )

    def __repr__(self):
        return f"<OnboardingFlow(id_flow={self.id_flow}, nm_flow='{self.nm_flow}')>"


class UserOnboardingProgress(Base):
    """Modelo para tb_user_onboarding_progress - Progresso do usuário"""

    __tablename__ = "tb_user_onboarding_progress"

    id_progress = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_progress"
    )

    # Relacionamentos
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    id_flow = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_onboarding_flows.id_flow", ondelete="CASCADE"),
        nullable=False,
        name="id_flow",
    )

    # Status geral
    nm_status = Column(
        String(20),
        nullable=False,
        server_default=text("'not_started'"),
        name="nm_status",
    )

    # Progresso (0-100)
    nr_progress_percentage = Column(
        Integer, nullable=False, server_default=text("0"), name="nr_progress_percentage"
    )

    # Step atual
    nm_current_step = Column(String(100), nullable=True, name="nm_current_step")

    # Steps completados (array de step types)
    ds_completed_steps = Column(
        JSONB,
        nullable=False,
        server_default=text("'[]'::jsonb"),
        name="ds_completed_steps",
    )

    # Steps pulados
    ds_skipped_steps = Column(
        JSONB,
        nullable=False,
        server_default=text("'[]'::jsonb"),
        name="ds_skipped_steps",
    )

    # Dados customizados de progresso
    ds_progress_data = Column(JSONB, nullable=True, name="ds_progress_data")

    # Timestamps
    dt_inicio = Column(DateTime, nullable=True, name="dt_inicio")
    dt_conclusao = Column(DateTime, nullable=True, name="dt_conclusao")
    dt_ultima_atividade = Column(DateTime, nullable=True, name="dt_ultima_atividade")

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
    flow = relationship("OnboardingFlow", back_populates="user_progress", lazy="select")

    def __repr__(self):
        return f"<UserOnboardingProgress(id_progress={self.id_progress}, user={self.id_user}, progress={self.nr_progress_percentage}%)>"


class OnboardingEvent(Base):
    """Modelo para tb_onboarding_events - Eventos de onboarding"""

    __tablename__ = "tb_onboarding_events"

    id_event = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_event"
    )

    # Relacionamentos
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    id_progress = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_user_onboarding_progress.id_progress", ondelete="CASCADE"),
        nullable=False,
        name="id_progress",
    )

    # Tipo de evento
    nm_event_type = Column(String(100), nullable=False, name="nm_event_type")
    # Valores: 'step_started', 'step_completed', 'step_skipped', 'flow_started', 'flow_completed'

    # Step relacionado (opcional)
    nm_step_type = Column(String(100), nullable=True, name="nm_step_type")

    # Dados do evento
    ds_event_data = Column(JSONB, nullable=True, name="ds_event_data")

    # Timestamp
    dt_event = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        name="dt_event",
    )

    # Relacionamentos
    user = relationship("User", lazy="select")
    progress = relationship("UserOnboardingProgress", lazy="select")

    def __repr__(self):
        return f"<OnboardingEvent(id_event={self.id_event}, type='{self.nm_event_type}')>"


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================


# -----------------------------------------------------------------------------
# Onboarding Flow Schemas
# -----------------------------------------------------------------------------


class OnboardingStepConfig(BaseModel):
    """Configuração de um step de onboarding"""

    step_type: OnboardingStepType = Field(..., description="Tipo do step")
    title: str = Field(..., min_length=1, max_length=200, description="Título do step")
    description: Optional[str] = Field(None, description="Descrição do step")
    order: int = Field(..., ge=1, description="Ordem de exibição")
    required: bool = Field(True, description="Step obrigatório?")
    help_url: Optional[str] = Field(None, description="URL de ajuda")
    estimated_minutes: Optional[int] = Field(
        None, ge=1, description="Tempo estimado em minutos"
    )
    icon: Optional[str] = Field(None, description="Ícone do step")
    action_url: Optional[str] = Field(None, description="URL da ação")


class OnboardingFlowConfig(BaseModel):
    """Configuração do flow de onboarding"""

    allow_skip: bool = Field(True, description="Permitir pular steps?")
    show_progress_bar: bool = Field(True, description="Mostrar barra de progresso?")
    auto_advance: bool = Field(False, description="Avançar automaticamente?")
    celebration_on_complete: bool = Field(
        True, description="Mostrar celebração ao completar?"
    )


class OnboardingFlowBase(BaseModel):
    """Schema base para OnboardingFlow"""

    nm_flow: str = Field(..., min_length=1, max_length=100, description="Nome do flow")
    ds_flow: Optional[str] = Field(None, description="Descrição do flow")
    nm_target_type: str = Field(
        "all_users", description="Tipo de usuário alvo do flow"
    )
    nr_order: int = Field(0, ge=0, description="Ordem de exibição")
    bl_ativo: bool = Field(True, description="Flow ativo?")
    ds_steps: List[OnboardingStepConfig] = Field(..., description="Steps do flow")
    ds_config: Optional[OnboardingFlowConfig] = Field(None, description="Configurações")


class OnboardingFlowCreate(OnboardingFlowBase):
    """Schema para criar OnboardingFlow"""

    pass


class OnboardingFlowUpdate(BaseModel):
    """Schema para atualizar OnboardingFlow"""

    nm_flow: Optional[str] = Field(None, min_length=1, max_length=100)
    ds_flow: Optional[str] = None
    nm_target_type: Optional[str] = None
    nr_order: Optional[int] = Field(None, ge=0)
    bl_ativo: Optional[bool] = None
    ds_steps: Optional[List[OnboardingStepConfig]] = None
    ds_config: Optional[OnboardingFlowConfig] = None


class OnboardingFlowResponse(OnboardingFlowBase):
    """Schema de resposta para OnboardingFlow"""

    id_flow: uuid.UUID
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# User Progress Schemas
# -----------------------------------------------------------------------------


class UserOnboardingProgressBase(BaseModel):
    """Schema base para UserOnboardingProgress"""

    id_user: uuid.UUID = Field(..., description="ID do usuário")
    id_flow: uuid.UUID = Field(..., description="ID do flow")


class UserOnboardingProgressCreate(UserOnboardingProgressBase):
    """Schema para criar UserOnboardingProgress"""

    pass


class UserOnboardingProgressUpdate(BaseModel):
    """Schema para atualizar UserOnboardingProgress"""

    nm_status: Optional[OnboardingStatus] = None
    nm_current_step: Optional[str] = None
    ds_progress_data: Optional[Dict] = None


class UserOnboardingProgressResponse(UserOnboardingProgressBase):
    """Schema de resposta para UserOnboardingProgress"""

    id_progress: uuid.UUID
    nm_status: OnboardingStatus
    nr_progress_percentage: int
    nm_current_step: Optional[str]
    ds_completed_steps: List[str]
    ds_skipped_steps: List[str]
    ds_progress_data: Optional[Dict]
    dt_inicio: Optional[datetime]
    dt_conclusao: Optional[datetime]
    dt_ultima_atividade: Optional[datetime]
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Onboarding Event Schemas
# -----------------------------------------------------------------------------


class OnboardingEventCreate(BaseModel):
    """Schema para criar OnboardingEvent"""

    id_user: uuid.UUID = Field(..., description="ID do usuário")
    id_progress: uuid.UUID = Field(..., description="ID do progresso")
    nm_event_type: str = Field(..., min_length=1, description="Tipo de evento")
    nm_step_type: Optional[OnboardingStepType] = Field(None, description="Tipo do step")
    ds_event_data: Optional[Dict] = Field(None, description="Dados do evento")


class OnboardingEventResponse(BaseModel):
    """Schema de resposta para OnboardingEvent"""

    id_event: uuid.UUID
    id_user: uuid.UUID
    id_progress: uuid.UUID
    nm_event_type: str
    nm_step_type: Optional[OnboardingStepType]
    ds_event_data: Optional[Dict]
    dt_event: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Specialized Schemas
# -----------------------------------------------------------------------------


class CompleteStepRequest(BaseModel):
    """Request para completar um step"""

    step_type: OnboardingStepType = Field(..., description="Tipo do step a completar")
    data: Optional[Dict] = Field(None, description="Dados opcionais do step")


class SkipStepRequest(BaseModel):
    """Request para pular um step"""

    step_type: OnboardingStepType = Field(..., description="Tipo do step a pular")
    reason: Optional[str] = Field(None, description="Razão para pular")


class OnboardingDashboard(BaseModel):
    """Dashboard de onboarding para usuário"""

    flow: OnboardingFlowResponse
    progress: UserOnboardingProgressResponse
    current_step: Optional[OnboardingStepConfig]
    next_steps: List[OnboardingStepConfig]
    is_completed: bool
    completion_percentage: int
