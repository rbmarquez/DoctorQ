# src/models/partner_lead.py
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import (
    CHAR,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


class PartnerType(str, Enum):
    CLINICA = "clinica"
    PROFISSIONAL = "profissional"
    FABRICANTE = "fabricante"
    FORNECEDOR = "fornecedor"


class ServiceCategory(str, Enum):
    PLANO_BASE = "plano_base"
    OFERTA = "oferta"
    DIFERENCIAL = "diferencial"
    ADDON = "addon"


class PartnerLeadStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    REJECTED = "rejected"


class PartnerServiceDefinition(Base):
    __tablename__ = "tb_partner_service_definitions"

    id_service = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_service",
    )
    service_code = Column("cd_service", String(64), nullable=False, unique=True)
    service_name = Column("nm_service", String(255), nullable=False)
    description = Column("ds_resumo", Text, nullable=True)
    price_value = Column("vl_preco_base", Numeric(12, 2), nullable=True)
    price_label = Column("ds_preco_label", String(255), nullable=True)
    features = Column("ds_features", JSONB, nullable=False, server_default="[]")
    active_flag = Column("st_ativo", CHAR(1), nullable=False, server_default="S")
    recommended_flag = Column(
        "st_recomendado",
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    category = Column(
        "tp_categoria",
        String(32),
        nullable=False,
        default=ServiceCategory.PLANO_BASE.value,
        server_default="plano_base",
    )
    partner_type = Column(
        "tp_partner",
        String(32),
        nullable=False,
        default="universal",
        server_default="universal",
    )
    max_licenses = Column("qt_max_licenses", Integer, nullable=True)
    yearly_discount = Column(
        "pc_desconto_anual",
        Numeric(5, 2),
        nullable=False,
        default=17.00,
        server_default="17.00",
    )
    created_at = Column(
        "dt_criacao",
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
    )

    lead_services = relationship(
        "PartnerLeadService",
        back_populates="service_definition",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    package_items = relationship(
        "PartnerPackageItem",
        back_populates="service_definition",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class PartnerLead(Base):
    __tablename__ = "tb_partner_leads"

    id_partner_lead = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_partner_lead",
    )
    partner_type = Column("tp_partner", String(32), nullable=False)
    contact_name = Column("nm_contato", String(255), nullable=False)
    contact_email = Column("nm_email", String(255), nullable=False)
    contact_phone = Column("nr_telefone", String(32), nullable=False)
    business_name = Column("nm_empresa", String(255), nullable=False)
    cnpj = Column("nr_cnpj", String(32), nullable=True)
    city = Column("nm_cidade", String(120), nullable=True)
    state = Column("nm_estado", String(64), nullable=True)
    services_description = Column("ds_servicos", Text, nullable=True)
    differentiators = Column("ds_diferenciais", Text, nullable=True)
    team_size = Column("nr_tamanho_equipe", String(32), nullable=True)
    catalog_link = Column("ds_catalogo_url", String(500), nullable=True)
    notes = Column("ds_observacoes", Text, nullable=True)
    status = Column(
        "nm_status",
        String(32),
        nullable=False,
        default=PartnerLeadStatus.PENDING.value,
        server_default=PartnerLeadStatus.PENDING.value,
    )
    created_at = Column(
        "dt_criacao",
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
    )
    updated_at = Column(
        "dt_atualizacao",
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        onupdate=func.now(),
        server_default=func.now(),
    )

    services = relationship(
        "PartnerLeadService",
        back_populates="partner_lead",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    packages = relationship(
        "PartnerPackage",
        back_populates="partner_lead",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class PartnerLeadService(Base):
    __tablename__ = "tb_partner_lead_services"
    __table_args__ = (
        UniqueConstraint(
            "id_partner_lead",
            "id_service",
            name="uq_partner_lead_service",
        ),
    )

    id_partner_lead_service = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_partner_lead_service",
    )
    id_partner_lead = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_leads.id_partner_lead", ondelete="CASCADE"),
        nullable=False,
        name="id_partner_lead",
    )
    id_service = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_service_definitions.id_service", ondelete="RESTRICT"),
        nullable=False,
        name="id_service",
    )
    service_name = Column("nm_service", String(255), nullable=False)
    price_label_snapshot = Column("ds_preco_label", String(255), nullable=True)
    created_at = Column(
        "dt_criacao",
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
    )

    partner_lead = relationship("PartnerLead", back_populates="services", lazy="selectin")
    service_definition = relationship(
        "PartnerServiceDefinition",
        back_populates="lead_services",
        lazy="joined",
    )


class PartnerLeadServiceCreate(BaseModel):
    service_code: str = Field(..., description="Código do serviço selecionado")


class PartnerLeadCreate(BaseModel):
    partner_type: PartnerType
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    business_name: str
    cnpj: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    services: Optional[str] = None
    differentiators: Optional[str] = None
    team_size: Optional[str] = None
    catalog_link: Optional[str] = None
    notes: Optional[str] = None
    selected_services: List[PartnerLeadServiceCreate]


class PartnerLeadServiceResponse(BaseModel):
    id_service: uuid.UUID
    service_code: str
    service_name: str
    price_label: Optional[str]

    class Config:
        from_attributes = True


class PartnerLeadResponse(BaseModel):
    id_partner_lead: uuid.UUID
    partner_type: PartnerType
    status: PartnerLeadStatus
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    business_name: str
    cnpj: Optional[str]
    city: Optional[str]
    state: Optional[str]
    services: Optional[str] = Field(None, alias="services_description")
    differentiators: Optional[str]
    team_size: Optional[str]
    catalog_link: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    services_selected: List[PartnerLeadServiceResponse]

    class Config:
        from_attributes = True
        populate_by_name = True


class PartnerLeadStatusUpdate(BaseModel):
    status: PartnerLeadStatus
    notes: Optional[str] = None


class PartnerServiceDefinitionResponse(BaseModel):
    id_service: uuid.UUID
    service_code: str
    service_name: str
    description: Optional[str]
    price_value: Optional[float]
    price_label: Optional[str]
    features: List[str]
    active: bool
    recommended: bool
    category: ServiceCategory = ServiceCategory.PLANO_BASE
    partner_type: str = "universal"
    max_licenses: Optional[int] = None
    yearly_discount: float = 17.00

    class Config:
        from_attributes = True


class PartnerServiceDefinitionCreate(BaseModel):
    service_code: str
    service_name: str
    description: Optional[str] = None
    price_value: Optional[float] = None
    price_label: Optional[str] = None
    features: List[str] = Field(default_factory=list)
    active: bool = True
    recommended: bool = False
    category: ServiceCategory = ServiceCategory.PLANO_BASE
    partner_type: str = "universal"
    max_licenses: Optional[int] = None
    yearly_discount: float = 17.00


class PartnerServiceDefinitionUpdate(BaseModel):
    service_code: Optional[str] = None
    service_name: Optional[str] = None
    description: Optional[str] = None
    price_value: Optional[float] = None
    price_label: Optional[str] = None
    features: Optional[List[str]] = None
    active: Optional[bool] = None
    recommended: Optional[bool] = None
    category: Optional[ServiceCategory] = None
    partner_type: Optional[str] = None
    max_licenses: Optional[int] = None
    yearly_discount: Optional[float] = None
