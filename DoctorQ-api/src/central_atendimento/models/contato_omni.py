# src/central_atendimento/models/contato_omni.py
"""
Model para contatos unificados omnichannel.

Um contato pode ter múltiplos identificadores em diferentes canais
(telefone WhatsApp, ID Instagram, email, etc.) todos vinculados
ao mesmo registro de contato.

Schema sincronizado com tb_contatos_omni em 22/11/2025.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import (
    Column,
    DateTime,
    String,
    Text,
    Boolean,
    Integer,
    Numeric,
    ForeignKey,
    func,
    Enum as SQLEnum,
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from src.models.base import Base


class ContatoStatus(str, Enum):
    """Status do contato."""
    LEAD = "lead"
    QUALIFICADO = "qualificado"
    CLIENTE = "cliente"
    INATIVO = "inativo"
    BLOQUEADO = "bloqueado"


class ContatoOmni(Base):
    """
    Model ORM para contatos omnichannel unificados.

    Este modelo centraliza todos os dados de contato de um lead/cliente,
    independente do canal de origem.

    Schema sincronizado com tb_contatos_omni em 22/11/2025.
    """

    __tablename__ = "tb_contatos_omni"

    # Identificadores
    id_contato = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_contato",
    )

    # Multi-tenant
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        name="id_empresa",
        index=True,
    )

    # Dados pessoais
    nm_contato = Column(
        String(255),
        nullable=False,
        name="nm_contato",
    )
    nm_apelido = Column(
        String(100),
        nullable=True,
        name="nm_apelido",
    )
    nm_email = Column(
        String(255),
        nullable=True,
        name="nm_email",
    )
    nr_telefone = Column(
        String(20),
        nullable=True,
        name="nr_telefone",
    )
    nr_telefone_secundario = Column(
        String(20),
        nullable=True,
        name="nr_telefone_secundario",
    )

    # CPF/CNPJ
    nr_documento = Column(
        String(20),
        nullable=True,
        name="nr_documento",
    )

    # Localização
    ds_endereco = Column(
        Text,
        nullable=True,
        name="ds_endereco",
    )
    nm_cidade = Column(
        String(100),
        nullable=True,
        name="nm_cidade",
    )
    nm_estado = Column(
        String(2),
        nullable=True,
        name="nm_estado",
    )
    nr_cep = Column(
        String(10),
        nullable=True,
        name="nr_cep",
    )
    nm_pais = Column(
        String(50),
        nullable=True,
        default="Brasil",
        name="nm_pais",
    )

    # Status
    st_contato = Column(
        SQLEnum(
            ContatoStatus,
            name="st_contato_omni_enum",
            create_type=False,
            values_callable=lambda x: [e.value for e in x]
        ),
        default=ContatoStatus.LEAD,
        nullable=False,
        name="st_contato",
    )
    st_ativo = Column(
        Boolean,
        default=True,
        nullable=False,
        name="st_ativo",
    )
    st_bloqueado = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_bloqueado",
    )

    # Identificadores externos (por canal)
    id_whatsapp = Column(
        String(50),
        nullable=True,
        name="id_whatsapp",
        index=True,
    )
    id_instagram = Column(
        String(100),
        nullable=True,
        name="id_instagram",
        index=True,
    )
    id_facebook = Column(
        String(100),
        nullable=True,
        name="id_facebook",
        index=True,
    )

    # Relacionamento com paciente (se existir)
    id_paciente = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_pacientes.id_paciente", ondelete="SET NULL"),
        nullable=True,
        name="id_paciente",
        index=True,
    )

    # Preferências e tags
    ds_preferencias = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_preferencias",
    )
    ds_tags = Column(
        ARRAY(String),
        nullable=True,
        default=[],
        name="ds_tags",
    )

    # Origem
    nm_origem = Column(
        String(100),
        nullable=True,
        name="nm_origem",
    )
    nm_canal_origem = Column(
        String(50),
        nullable=True,
        name="nm_canal_origem",
    )

    # Metadados e notas
    ds_metadata = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_metadata",
    )
    ds_notas = Column(
        Text,
        nullable=True,
        name="ds_notas",
    )

    # Métricas
    nr_conversas_total = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_conversas_total",
    )
    nr_agendamentos_total = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_agendamentos_total",
    )
    nr_compras_total = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_compras_total",
    )
    vl_total_gasto = Column(
        Numeric(15, 2),
        default=0,
        nullable=True,
        name="vl_total_gasto",
    )

    # Timestamps de contato
    dt_primeiro_contato = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_primeiro_contato",
    )
    dt_ultimo_contato = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_ultimo_contato",
    )

    # Timestamps de sistema
    dt_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    # Constraints e índices
    __table_args__ = (
        UniqueConstraint("id_empresa", "nr_telefone", name="uk_contato_empresa_telefone"),
        Index("idx_contato_empresa_telefone", "id_empresa", "nr_telefone"),
        Index("idx_contato_empresa_email", "id_empresa", "nm_email"),
        Index("idx_contato_empresa_status", "id_empresa", "st_contato"),
    )

    def __repr__(self):
        return f"<ContatoOmni(id={self.id_contato}, nome='{self.nm_contato}')>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ContatoOmniBase(BaseModel):
    """Schema base para ContatoOmni."""
    model_config = ConfigDict(from_attributes=True)

    nm_contato: str = Field(..., max_length=255, description="Nome do contato")
    nm_apelido: Optional[str] = Field(None, max_length=100)
    nm_email: Optional[str] = Field(None, max_length=255)
    nr_telefone: Optional[str] = Field(None, max_length=20)
    nr_telefone_secundario: Optional[str] = None
    nr_documento: Optional[str] = None
    ds_endereco: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nr_cep: Optional[str] = None
    nm_pais: Optional[str] = "Brasil"


class ContatoOmniCreate(ContatoOmniBase):
    """Schema para criar contato."""
    id_whatsapp: Optional[str] = None
    id_instagram: Optional[str] = None
    id_facebook: Optional[str] = None
    st_contato: ContatoStatus = ContatoStatus.LEAD
    ds_tags: Optional[List[str]] = None
    nm_origem: Optional[str] = None
    nm_canal_origem: Optional[str] = None
    ds_preferencias: Optional[Dict[str, Any]] = None
    ds_metadata: Optional[Dict[str, Any]] = None
    ds_notas: Optional[str] = None
    id_paciente: Optional[uuid.UUID] = None


class ContatoOmniUpdate(BaseModel):
    """Schema para atualizar contato."""
    model_config = ConfigDict(from_attributes=True)

    nm_contato: Optional[str] = Field(None, max_length=255)
    nm_apelido: Optional[str] = None
    nm_email: Optional[str] = None
    nr_telefone: Optional[str] = None
    nr_telefone_secundario: Optional[str] = None
    nr_documento: Optional[str] = None
    ds_endereco: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nr_cep: Optional[str] = None
    nm_pais: Optional[str] = None
    id_whatsapp: Optional[str] = None
    id_instagram: Optional[str] = None
    id_facebook: Optional[str] = None
    st_contato: Optional[ContatoStatus] = None
    st_ativo: Optional[bool] = None
    st_bloqueado: Optional[bool] = None
    ds_tags: Optional[List[str]] = None
    ds_preferencias: Optional[Dict[str, Any]] = None
    ds_metadata: Optional[Dict[str, Any]] = None
    ds_notas: Optional[str] = None
    id_paciente: Optional[uuid.UUID] = None


class ContatoOmniResponse(ContatoOmniBase):
    """Schema de resposta para ContatoOmni."""
    id_contato: uuid.UUID
    id_empresa: uuid.UUID
    id_whatsapp: Optional[str] = None
    id_instagram: Optional[str] = None
    id_facebook: Optional[str] = None
    st_contato: ContatoStatus
    st_ativo: bool
    st_bloqueado: bool
    ds_tags: Optional[List[str]] = None
    nm_origem: Optional[str] = None
    nm_canal_origem: Optional[str] = None
    id_paciente: Optional[uuid.UUID] = None
    nr_conversas_total: Optional[int] = 0
    nr_agendamentos_total: Optional[int] = 0
    nr_compras_total: Optional[int] = 0
    vl_total_gasto: Optional[Decimal] = Decimal("0")
    dt_primeiro_contato: Optional[datetime] = None
    dt_ultimo_contato: Optional[datetime] = None
    dt_criacao: datetime
    dt_atualizacao: datetime


class ContatoOmniListResponse(BaseModel):
    """Schema para lista de contatos."""
    model_config = ConfigDict(from_attributes=True)

    items: list[ContatoOmniResponse]
    total: int
    page: int
    page_size: int


class ContatoOmniImportRequest(BaseModel):
    """Schema para importação em massa de contatos."""
    model_config = ConfigDict(from_attributes=True)

    contatos: List[ContatoOmniCreate]
    st_atualizar_existentes: bool = Field(
        False,
        description="Se True, atualiza contatos existentes baseado no telefone/email"
    )
    nm_origem: Optional[str] = None
    ds_tags: Optional[List[str]] = None
