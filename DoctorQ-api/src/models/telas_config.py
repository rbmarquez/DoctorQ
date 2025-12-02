"""
Models para Configuração de Visibilidade de Telas

Define quais telas são visíveis para cada tipo de usuário.
Tipos: publico, paciente, clinica, profissional, fornecedor
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.models.base import Base


# ============================================================================
# Enum para tipos de usuário
# ============================================================================

class TipoUsuarioTela(str, Enum):
    """Tipos de usuário para visibilidade de telas."""
    ADMIN = "admin"
    PUBLICO = "publico"
    PACIENTE = "paciente"
    CLINICA = "clinica"
    PROFISSIONAL = "profissional"
    FORNECEDOR = "fornecedor"


# ============================================================================
# ORM Model
# ============================================================================

class TelasConfig(Base):
    """
    Configuração de visibilidade de telas por tipo de usuário.

    Se fg_visivel = True, a tela é visível (sujeita a permissões).
    Se fg_visivel = False, a tela é sempre oculta, independente de permissões.
    """
    __tablename__ = "tb_telas_config"

    id_tela_config = Column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    id_empresa = Column(PGUUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"), nullable=False)

    cd_tela = Column(String(100), nullable=False)  # ID único da tela
    tp_tipo = Column(String(50), nullable=False)   # publico, paciente, clinica, profissional, fornecedor
    fg_visivel = Column(Boolean, nullable=False, default=True)

    dt_criacao = Column(DateTime, server_default=func.now(), nullable=False)
    dt_atualizacao = Column(DateTime, onupdate=func.now())

    # Relacionamento com empresa
    empresa = relationship("Empresa", back_populates="telas_config", lazy="selectin")

    def __repr__(self):
        return f"<TelasConfig(tela={self.cd_tela}, tipo={self.tp_tipo}, visivel={self.fg_visivel})>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class TelaConfigBase(BaseModel):
    """Base schema para configuração de tela."""
    cd_tela: str = Field(..., description="Identificador único da tela")
    tp_tipo: TipoUsuarioTela = Field(..., description="Tipo de usuário")
    fg_visivel: bool = Field(default=True, description="Se a tela está visível")


class TelaConfigCreate(TelaConfigBase):
    """Schema para criar configuração de tela."""
    pass


class TelaConfigUpdate(BaseModel):
    """Schema para atualizar configuração de tela."""
    fg_visivel: bool = Field(..., description="Se a tela está visível")


class TelaConfigResponse(TelaConfigBase):
    """Schema de resposta para configuração de tela."""
    id_tela_config: UUID
    id_empresa: UUID
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    class Config:
        from_attributes = True


class TelaConfigBulkUpdate(BaseModel):
    """Schema para atualização em lote de configurações de tela."""
    tp_tipo: TipoUsuarioTela = Field(..., description="Tipo de usuário")
    telas: list[dict] = Field(..., description="Lista de telas com cd_tela e fg_visivel")


class TelaConfigBulkItem(BaseModel):
    """Item individual para atualização em lote."""
    cd_tela: str = Field(..., description="Identificador único da tela")
    fg_visivel: bool = Field(..., description="Se a tela está visível")
