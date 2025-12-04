# estetiQ-api/src/models/partner_package.py
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import (
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


class PartnerPackageStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PartnerPackageItemStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class PartnerLicenseStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class PartnerPackage(Base):
    __tablename__ = "tb_partner_packages"

    id_partner_package = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_partner_package",
    )
    id_partner_lead = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_leads.id_partner_lead", ondelete="SET NULL"),
        nullable=True,
        name="id_partner_lead",
    )
    package_code = Column("cd_package", String(64), nullable=False, unique=True)
    package_name = Column("nm_package", String(255), nullable=False)
    status = Column(
        "nm_status",
        String(32),
        nullable=False,
        default=PartnerPackageStatus.PENDING.value,
        server_default=PartnerPackageStatus.PENDING.value,
    )
    billing_cycle = Column(
        "nm_billing_cycle",
        String(32),
        nullable=False,
        default="monthly",
        server_default="monthly",
    )
    total_value = Column("vl_total", Numeric(12, 2), nullable=True)
    currency = Column("nm_currency", String(8), nullable=False, default="BRL", server_default="BRL")
    contract_url = Column("ds_contract_url", String(500), nullable=True)
    notes = Column("ds_notes", Text, nullable=True)
    metadata_json = Column("ds_metadata", JSONB, nullable=True)
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
    activated_at = Column("dt_ativacao", DateTime(timezone=True), nullable=True)
    expires_at = Column("dt_expiracao", DateTime(timezone=True), nullable=True)

    partner_lead = relationship("PartnerLead", back_populates="packages", lazy="joined")
    items = relationship(
        "PartnerPackageItem",
        back_populates="package",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class PartnerPackageItem(Base):
    __tablename__ = "tb_partner_package_items"
    __table_args__ = (
        UniqueConstraint(
            "id_partner_package",
            "id_service",
            name="uq_partner_package_item",
        ),
    )

    id_partner_package_item = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_partner_package_item",
    )
    id_partner_package = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_packages.id_partner_package", ondelete="CASCADE"),
        nullable=False,
        name="id_partner_package",
    )
    id_service = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_service_definitions.id_service", ondelete="RESTRICT"),
        nullable=False,
        name="id_service",
    )
    quantity = Column(
        "qt_licenses",
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )
    unit_price_value = Column("vl_unitario", Numeric(12, 2), nullable=True)
    unit_price_label = Column("ds_preco_label", String(255), nullable=True)
    status = Column(
        "nm_status",
        String(32),
        nullable=False,
        default=PartnerPackageItemStatus.PENDING.value,
        server_default=PartnerPackageItemStatus.PENDING.value,
    )
    metadata_json = Column("ds_metadata", JSONB, nullable=True)
    created_at = Column(
        "dt_criacao",
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
    )

    package = relationship("PartnerPackage", back_populates="items", lazy="joined")
    service_definition = relationship(
        "PartnerServiceDefinition",
        back_populates="package_items",
        lazy="joined",
    )
    licenses = relationship(
        "PartnerLicense",
        back_populates="package_item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class PartnerLicense(Base):
    __tablename__ = "tb_partner_licenses"

    id_partner_license = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_partner_license",
    )
    id_partner_package_item = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_package_items.id_partner_package_item", ondelete="CASCADE"),
        nullable=False,
        name="id_partner_package_item",
    )
    license_key = Column("cd_license", String(128), nullable=False, unique=True)
    assigned_to = Column("nm_assigned_to", String(255), nullable=True)
    assigned_email = Column("nm_assigned_email", String(255), nullable=True)
    status = Column(
        "nm_status",
        String(32),
        nullable=False,
        default=PartnerLicenseStatus.AVAILABLE.value,
        server_default=PartnerLicenseStatus.AVAILABLE.value,
    )
    metadata_json = Column("ds_metadata", JSONB, nullable=True)
    created_at = Column(
        "dt_criacao",
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
    )
    activated_at = Column("dt_ativacao", DateTime(timezone=True), nullable=True)
    revoked_at = Column("dt_revogacao", DateTime(timezone=True), nullable=True)

    package_item = relationship("PartnerPackageItem", back_populates="licenses", lazy="joined")


# =====================================================
# Pydantic Schemas
# =====================================================


class PartnerPackageLeadInfo(BaseModel):
    id_partner_lead: uuid.UUID
    business_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True


class PartnerPackageItemCreate(BaseModel):
    service_code: str = Field(..., description="Código do serviço a licenciar")
    quantity: int = Field(default=1, ge=1, description="Quantidade de licenças do serviço")


class PartnerPackageCreate(BaseModel):
    package_code: str
    package_name: str
    lead_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Identificador do lead associado ao pacote",
    )
    billing_cycle: str = Field(default="monthly")
    total_value: Optional[float] = None
    notes: Optional[str] = None
    items: List[PartnerPackageItemCreate]


class PartnerLicenseResponse(BaseModel):
    id_partner_license: uuid.UUID
    license_key: str
    status: PartnerLicenseStatus
    assigned_to: Optional[str]
    assigned_email: Optional[str]
    activated_at: Optional[datetime]
    revoked_at: Optional[datetime]

    class Config:
        from_attributes = True


class PartnerPackageItemResponse(BaseModel):
    id_partner_package_item: uuid.UUID
    service_id: uuid.UUID = Field(alias="id_service")
    service_code: str
    service_name: str
    quantity: int
    unit_price_value: Optional[float]
    unit_price_label: Optional[str]
    status: PartnerPackageItemStatus
    licenses: List[PartnerLicenseResponse]

    class Config:
        from_attributes = True
        populate_by_name = True


class PartnerPackageResponse(BaseModel):
    id_partner_package: uuid.UUID
    package_code: str
    package_name: str
    status: PartnerPackageStatus
    billing_cycle: str
    total_value: Optional[float]
    currency: str
    contract_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    activated_at: Optional[datetime]
    expires_at: Optional[datetime]
    lead_id: Optional[uuid.UUID] = Field(default=None, alias="id_partner_lead")
    lead: Optional[PartnerPackageLeadInfo] = None
    items: List[PartnerPackageItemResponse]

    class Config:
        from_attributes = True
        populate_by_name = True


class PartnerPackageStatusUpdate(BaseModel):
    status: PartnerPackageStatus
    notes: Optional[str] = None


# ============================================================================
# Modelos para UC-PARC-007 e UC-PARC-008
# ============================================================================


class PackageChangeType(str, Enum):
    """Tipo de mudança no pacote."""
    UPGRADE = "upgrade"
    DOWNGRADE = "downgrade"
    ADD_LICENSES = "add_licenses"
    ADD_ADDON = "add_addon"
    REMOVE_ADDON = "remove_addon"


class PartnerPackageHistory(Base):
    """Histórico de mudanças no pacote (upgrades/downgrades)."""
    __tablename__ = "tb_partner_package_history"

    id_history = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_partner_package = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_packages.id_partner_package", ondelete="CASCADE"),
        nullable=False,
    )
    id_service_old = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_service_definitions.id_service", ondelete="SET NULL"),
        nullable=True,
    )
    id_service_new = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_service_definitions.id_service", ondelete="RESTRICT"),
        nullable=False,
    )
    tp_change = Column(String(32), nullable=False)
    vl_prorata_charged = Column(Numeric(12, 2), nullable=True)
    nm_currency = Column(String(8), nullable=False, default="BRL")
    qt_dias_restantes = Column(Integer, nullable=True)
    dt_change = Column(DateTime(timezone=True), nullable=False, default=func.now())
    ds_reason = Column(Text, nullable=True)
    id_user_action = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="SET NULL"),
        nullable=True,
    )
    ds_metadata = Column(JSONB, nullable=True)

    # Relationships
    package = relationship("PartnerPackage", lazy="selectin")


class ProfissionalClinica(Base):
    """Relacionamento N:N entre profissionais e clínicas (múltiplas unidades)."""
    __tablename__ = "tb_profissionais_clinicas"

    id_profissional_clinica = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    id_profissional = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_profissionais.id_profissional", ondelete="CASCADE"),
        nullable=False,
    )
    id_clinica = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_clinicas.id_clinica", ondelete="CASCADE"),
        nullable=False,
    )
    dt_vinculo = Column(DateTime(timezone=True), nullable=False, default=func.now())
    st_ativo = Column("st_ativo", String(1), nullable=False, default="S")
    ds_observacoes = Column(Text, nullable=True)


# ============================================================================
# Pydantic Schemas para UC-PARC-007 e UC-PARC-008
# ============================================================================


class PackageUpgradeRequest(BaseModel):
    """Schema para solicitar upgrade de plano."""
    id_service_new: uuid.UUID
    ds_reason: Optional[str] = "Upgrade voluntário via self-service"
    confirm_prorata: bool = Field(
        default=False, description="Confirma pagamento do valor pro-rata"
    )


class ProrataCalculation(BaseModel):
    """Cálculo de valor pro-rata para upgrade."""
    plano_atual: str
    plano_novo: str
    vl_plano_atual: float
    vl_plano_novo: float
    dt_upgrade: datetime
    qt_dias_restantes: int
    qt_dias_ciclo: int
    vl_proporcional_novo: float
    vl_credito_atual: float
    vl_a_pagar: float
    ds_explicacao: str


class PackageHistoryResponse(BaseModel):
    """Schema de resposta de histórico de mudança."""
    id_history: uuid.UUID
    tp_change: str
    service_old_name: Optional[str]
    service_new_name: str
    vl_prorata_charged: Optional[float]
    qt_dias_restantes: Optional[int]
    dt_change: datetime
    ds_reason: Optional[str]

    class Config:
        from_attributes = True


class ClinicaUnitCreate(BaseModel):
    """Schema para criar nova unidade/clínica."""
    id_empresa: uuid.UUID
    nm_clinica: str
    ds_clinica: Optional[str] = None
    nr_cnpj: Optional[str] = None
    ds_email: Optional[str] = None
    nr_telefone: Optional[str] = None
    nr_whatsapp: Optional[str] = None
    ds_endereco: Optional[str] = None
    nr_numero: Optional[str] = None
    ds_complemento: Optional[str] = None
    nm_bairro: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nr_cep: Optional[str] = None
    nm_responsavel: Optional[str] = None
    profissionais_ids: List[uuid.UUID] = Field(
        default_factory=list,
        description="IDs dos profissionais que atuarão nesta unidade",
    )


class ClinicaUnitResponse(BaseModel):
    """Schema de resposta de unidade/clínica."""
    id_clinica: uuid.UUID
    id_empresa: uuid.UUID
    nm_clinica: str
    nm_cidade: Optional[str]
    nm_estado: Optional[str]
    nr_telefone: Optional[str]
    st_ativo: bool
    qt_profissionais: int
    dt_criacao: datetime

    class Config:
        from_attributes = True


class ProfissionalClinicaLink(BaseModel):
    """Schema para vincular profissional a clínica."""
    id_profissional: uuid.UUID
    id_clinica: uuid.UUID
    ds_observacoes: Optional[str] = None
