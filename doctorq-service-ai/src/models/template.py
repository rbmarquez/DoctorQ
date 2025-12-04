"""
Modelos de dados para o Marketplace de Templates
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, validator
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# =============================================================================
# ENUMS
# =============================================================================


class TemplateCategory(str, Enum):
    """Categorias de templates"""

    CUSTOMER_SERVICE = "customer_service"
    SALES = "sales"
    SUPPORT = "support"
    HR = "hr"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    PRODUCTIVITY = "productivity"
    LEGAL = "legal"
    FINANCE = "finance"
    EDUCATION = "education"
    OTHER = "other"


class TemplateStatus(str, Enum):
    """Status do template"""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"


class TemplateVisibility(str, Enum):
    """Visibilidade do template"""

    PUBLIC = "public"  # Visível para todos
    PRIVATE = "private"  # Visível apenas para o criador
    ORGANIZATION = "organization"  # Visível apenas para a organização


# =============================================================================
# SQLALCHEMY MODELS
# =============================================================================


class Template(Base):
    """Modelo para tb_templates"""

    __tablename__ = "tb_templates"

    id_template = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_template",
    )

    # Informações básicas
    nm_template = Column(String(200), nullable=False, name="nm_template")
    ds_template = Column(Text, nullable=True, name="ds_template")
    nm_category = Column(
        String(50),
        nullable=False,
        server_default=text("'other'"),
        name="nm_category",
    )

    # Status e visibilidade
    nm_status = Column(
        String(20),
        nullable=False,
        server_default=text("'draft'"),
        name="nm_status",
    )
    nm_visibility = Column(
        String(20),
        nullable=False,
        server_default=text("'public'"),
        name="nm_visibility",
    )

    # Criador do template
    id_user_creator = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="SET NULL"),
        nullable=True,
        name="id_user_creator",
    )
    id_empresa_creator = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="SET NULL"),
        nullable=True,
        name="id_empresa_creator",
    )

    # Configuração do agente (JSON)
    js_agent_config = Column(JSONB, nullable=False, name="js_agent_config")
    # Formato:
    # {
    #   "name": "Customer Support Bot",
    #   "system_prompt": "You are a helpful...",
    #   "model": "gpt-4",
    #   "temperature": 0.7,
    #   "tools": ["web_search", "calculator"],
    #   "knowledge_base_ids": [...],
    #   ...
    # }

    # Metadados
    ds_tags = Column(JSONB, nullable=True, name="ds_tags")  # ["chatbot", "support"]
    ds_metadata = Column(JSONB, nullable=True, name="ds_metadata")
    nm_version = Column(
        String(20), nullable=False, server_default=text("'1.0.0'"), name="nm_version"
    )

    # Estatísticas
    nr_install_count = Column(
        Integer, nullable=False, server_default=text("0"), name="nr_install_count"
    )
    nr_rating_avg = Column(
        Numeric(3, 2), nullable=False, server_default=text("0.00"), name="nr_rating_avg"
    )
    nr_rating_count = Column(
        Integer, nullable=False, server_default=text("0"), name="nr_rating_count"
    )

    # Imagem/Ícone
    ds_image_url = Column(String(500), nullable=True, name="ds_image_url")
    ds_icon_url = Column(String(500), nullable=True, name="ds_icon_url")

    # Auditoria
    dt_criacao = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), name="dt_criacao"
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=datetime.now,
        name="dt_atualizacao",
    )
    dt_publicacao = Column(DateTime, nullable=True, name="dt_publicacao")

    # Relacionamentos
    creator = relationship("User", foreign_keys=[id_user_creator], lazy="select")
    empresa_creator = relationship("Empresa", foreign_keys=[id_empresa_creator], lazy="select")
    installations = relationship("TemplateInstallation", back_populates="template", lazy="select")
    reviews = relationship("TemplateReview", back_populates="template", lazy="select")

    def __repr__(self):
        return f"<Template(id_template={self.id_template}, nm_template='{self.nm_template}', category='{self.nm_category}')>"


class TemplateInstallation(Base):
    """Modelo para tb_template_installations - rastreia instalações de templates"""

    __tablename__ = "tb_template_installations"

    id_installation = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_installation",
    )

    # Template e usuário
    id_template = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_templates.id_template", ondelete="CASCADE"),
        nullable=False,
        name="id_template",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=True,
        name="id_empresa",
    )

    # Agente criado a partir do template
    id_agente = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_agentes.id_agente", ondelete="SET NULL"),
        nullable=True,
        name="id_agente",
    )

    # Customizações feitas na instalação
    js_customizations = Column(JSONB, nullable=True, name="js_customizations")

    # Status da instalação
    bl_ativo = Column(
        Boolean, nullable=False, server_default=text("true"), name="bl_ativo"
    )

    # Auditoria
    dt_instalacao = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), name="dt_instalacao"
    )
    dt_ultima_atualizacao = Column(
        DateTime, nullable=True, name="dt_ultima_atualizacao"
    )

    # Relacionamentos
    template = relationship("Template", back_populates="installations", lazy="select")
    user = relationship("User", lazy="select")
    empresa = relationship("Empresa", lazy="select")
    agente = relationship("Agent", lazy="select")

    # Constraint: um usuário não pode instalar o mesmo template duas vezes (ativo)
    __table_args__ = (
        UniqueConstraint(
            "id_template",
            "id_user",
            name="uq_template_user_active",
        ),
    )

    def __repr__(self):
        return f"<TemplateInstallation(id_installation={self.id_installation}, id_template={self.id_template}, id_user={self.id_user})>"


class TemplateReview(Base):
    """Modelo para tb_template_reviews - avaliações de templates"""

    __tablename__ = "tb_template_reviews"

    id_review = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_review",
    )

    # Template e usuário
    id_template = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_templates.id_template", ondelete="CASCADE"),
        nullable=False,
        name="id_template",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )

    # Avaliação
    nr_rating = Column(Integer, nullable=False, name="nr_rating")  # 1-5 stars
    ds_review = Column(Text, nullable=True, name="ds_review")
    ds_title = Column(String(200), nullable=True, name="ds_title")

    # Metadata
    bl_verified_install = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        name="bl_verified_install",
    )  # Usuário realmente instalou?

    # Moderação
    bl_aprovado = Column(
        Boolean, nullable=False, server_default=text("true"), name="bl_aprovado"
    )
    ds_moderacao_nota = Column(Text, nullable=True, name="ds_moderacao_nota")

    # Auditoria
    dt_criacao = Column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), name="dt_criacao"
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=datetime.now,
        name="dt_atualizacao",
    )

    # Relacionamentos
    template = relationship("Template", back_populates="reviews", lazy="select")
    user = relationship("User", lazy="select")

    # Constraint: um usuário pode fazer apenas uma review por template
    __table_args__ = (
        UniqueConstraint("id_template", "id_user", name="uq_template_user_review"),
    )

    def __repr__(self):
        return f"<TemplateReview(id_review={self.id_review}, id_template={self.id_template}, nr_rating={self.nr_rating})>"


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================


# -----------------------------------------------------------------------------
# Template Schemas
# -----------------------------------------------------------------------------


class TemplateBase(BaseModel):
    """Schema base para Template"""

    nm_template: str = Field(..., min_length=3, max_length=200, description="Nome do template")
    ds_template: Optional[str] = Field(None, description="Descrição do template")
    nm_category: TemplateCategory = Field(..., description="Categoria do template")
    nm_status: TemplateStatus = Field(
        TemplateStatus.DRAFT, description="Status do template"
    )
    nm_visibility: TemplateVisibility = Field(
        TemplateVisibility.PUBLIC, description="Visibilidade do template"
    )
    js_agent_config: Dict = Field(..., description="Configuração do agente (JSON)")
    ds_tags: Optional[List[str]] = Field(None, description="Tags do template")
    ds_metadata: Optional[Dict] = Field(None, description="Metadados adicionais")
    nm_version: str = Field("1.0.0", description="Versão do template")
    ds_image_url: Optional[str] = Field(None, description="URL da imagem do template")
    ds_icon_url: Optional[str] = Field(None, description="URL do ícone do template")

    @validator("js_agent_config")
    def validate_agent_config(cls, v):
        """Valida configuração do agente"""
        required_fields = ["name", "system_prompt"]
        for field in required_fields:
            if field not in v:
                raise ValueError(f"Campo obrigatório '{field}' não encontrado em js_agent_config")
        return v


class TemplateCreate(TemplateBase):
    """Schema para criar Template"""

    id_user_creator: Optional[uuid.UUID] = Field(None, description="ID do criador (usuário)")
    id_empresa_creator: Optional[uuid.UUID] = Field(
        None, description="ID do criador (empresa)"
    )


class TemplateUpdate(BaseModel):
    """Schema para atualizar Template"""

    nm_template: Optional[str] = Field(None, min_length=3, max_length=200)
    ds_template: Optional[str] = None
    nm_category: Optional[TemplateCategory] = None
    nm_status: Optional[TemplateStatus] = None
    nm_visibility: Optional[TemplateVisibility] = None
    js_agent_config: Optional[Dict] = None
    ds_tags: Optional[List[str]] = None
    ds_metadata: Optional[Dict] = None
    nm_version: Optional[str] = None
    ds_image_url: Optional[str] = None
    ds_icon_url: Optional[str] = None


class TemplateResponse(TemplateBase):
    """Schema de resposta para Template"""

    id_template: uuid.UUID
    id_user_creator: Optional[uuid.UUID]
    id_empresa_creator: Optional[uuid.UUID]
    nr_install_count: int
    nr_rating_avg: Decimal
    nr_rating_count: int
    dt_criacao: datetime
    dt_atualizacao: datetime
    dt_publicacao: Optional[datetime]

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Schema para lista paginada de templates"""

    templates: List[TemplateResponse]
    total: int
    page: int
    size: int
    total_pages: int


# -----------------------------------------------------------------------------
# Template Installation Schemas
# -----------------------------------------------------------------------------


class TemplateInstallationBase(BaseModel):
    """Schema base para Installation"""

    id_template: uuid.UUID = Field(..., description="ID do template")
    id_user: uuid.UUID = Field(..., description="ID do usuário")
    id_empresa: Optional[uuid.UUID] = Field(None, description="ID da empresa")
    js_customizations: Optional[Dict] = Field(None, description="Customizações na instalação")


class TemplateInstallationCreate(TemplateInstallationBase):
    """Schema para criar Installation"""

    pass


class TemplateInstallationUpdate(BaseModel):
    """Schema para atualizar Installation"""

    js_customizations: Optional[Dict] = None
    bl_ativo: Optional[bool] = None


class TemplateInstallationResponse(TemplateInstallationBase):
    """Schema de resposta para Installation"""

    id_installation: uuid.UUID
    id_agente: Optional[uuid.UUID]
    bl_ativo: bool
    dt_instalacao: datetime
    dt_ultima_atualizacao: Optional[datetime]

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Template Review Schemas
# -----------------------------------------------------------------------------


class TemplateReviewBase(BaseModel):
    """Schema base para Review"""

    id_template: uuid.UUID = Field(..., description="ID do template")
    nr_rating: int = Field(..., ge=1, le=5, description="Avaliação (1-5 estrelas)")
    ds_title: Optional[str] = Field(None, max_length=200, description="Título da review")
    ds_review: Optional[str] = Field(None, description="Texto da review")

    @validator("nr_rating")
    def validate_rating(cls, v):
        """Valida rating entre 1 e 5"""
        if v < 1 or v > 5:
            raise ValueError("Rating deve estar entre 1 e 5")
        return v


class TemplateReviewCreate(TemplateReviewBase):
    """Schema para criar Review"""

    id_user: uuid.UUID = Field(..., description="ID do usuário")


class TemplateReviewUpdate(BaseModel):
    """Schema para atualizar Review"""

    nr_rating: Optional[int] = Field(None, ge=1, le=5)
    ds_title: Optional[str] = Field(None, max_length=200)
    ds_review: Optional[str] = None


class TemplateReviewResponse(TemplateReviewBase):
    """Schema de resposta para Review"""

    id_review: uuid.UUID
    id_user: uuid.UUID
    bl_verified_install: bool
    bl_aprovado: bool
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Specialized Schemas
# -----------------------------------------------------------------------------


class TemplateSearchFilters(BaseModel):
    """Filtros de busca para templates"""

    category: Optional[TemplateCategory] = None
    tags: Optional[List[str]] = None
    min_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    search_query: Optional[str] = None  # Busca por nome/descrição
    visibility: Optional[TemplateVisibility] = None
    status: Optional[TemplateStatus] = TemplateStatus.PUBLISHED


class TemplateStats(BaseModel):
    """Estatísticas de um template"""

    id_template: uuid.UUID
    nr_install_count: int
    nr_active_installs: int
    nr_rating_avg: Decimal
    nr_rating_count: int
    nr_reviews: int
    dt_ultima_instalacao: Optional[datetime]


class MarketplaceStats(BaseModel):
    """Estatísticas gerais do marketplace"""

    total_templates: int
    total_installations: int
    total_reviews: int
    avg_rating: Decimal
    templates_by_category: Dict[str, int]
    top_templates: List[TemplateResponse]
