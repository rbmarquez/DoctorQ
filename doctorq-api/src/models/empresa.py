# src/models/empresa.py
import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, Date, Integer, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from src.config.orm_config import Base


# ==========================================
# SQLAlchemy Model (Database)
# ==========================================
class Empresa(Base):
    """Modelo SQLAlchemy para empresas/organizações"""

    __tablename__ = "tb_empresas"

    id_empresa = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nm_empresa = Column(String(255), nullable=False)
    nm_razao_social = Column(String(255))
    nr_cnpj = Column(String(18), unique=True)
    nm_segmento = Column(String(100))
    nm_porte = Column(String(50), default="Pequeno")
    nr_telefone = Column(String(20))
    nm_email_contato = Column(String(255))

    # Endereço
    nm_endereco = Column(String(255))
    nm_cidade = Column(String(100))
    nm_estado = Column(String(2))
    nr_cep = Column(String(10))
    nm_pais = Column(String(100), default="Brasil")

    # Informações de conta
    st_ativo = Column(String(1), nullable=False, default="S")
    dt_assinatura = Column(Date)
    dt_vencimento = Column(Date)
    nm_plano = Column(String(50), default="Free")
    nr_limite_usuarios = Column(Integer, default=5)
    nr_limite_agentes = Column(Integer, default=2)
    nr_limite_document_stores = Column(Integer, default=1)

    # Configurações
    ds_config = Column(JSONB)
    ds_logo_url = Column(String(500))
    nm_cor_primaria = Column(String(7), default="#6366f1")

    # Timestamps
    dt_criacao = Column(TIMESTAMP, nullable=False, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, nullable=False, default=datetime.now, onupdate=datetime.now)

    # Relacionamentos (lazy import para evitar circular imports)
    usuarios = relationship("User", back_populates="empresa", lazy="select")
    perfis = relationship("Perfil", back_populates="empresa", cascade="all, delete-orphan", lazy="select")
    telas_config = relationship("TelasConfig", back_populates="empresa", cascade="all, delete-orphan", lazy="select")

    # Relacionamentos do Sistema de Carreiras
    vagas = relationship("TbVagas", back_populates="empresa", lazy="select")


# ==========================================
# Pydantic Models (API/Validation)
# ==========================================
class EmpresaBase(BaseModel):
    """Base model para Empresa"""

    nm_empresa: str = Field(..., min_length=1, max_length=255, description="Nome da empresa")
    nm_razao_social: Optional[str] = Field(None, max_length=255, description="Razão social")
    nr_cnpj: Optional[str] = Field(None, max_length=18, description="CNPJ da empresa")
    nm_segmento: Optional[str] = Field(None, max_length=100, description="Segmento de atuação")
    nm_porte: Optional[str] = Field("Pequeno", description="Porte: Pequeno, Médio, Grande, Enterprise")
    nr_telefone: Optional[str] = Field(None, max_length=20, description="Telefone de contato")
    nm_email_contato: Optional[str] = Field(None, max_length=255, description="Email de contato")

    # Endereço
    nm_endereco: Optional[str] = Field(None, max_length=255)
    nm_cidade: Optional[str] = Field(None, max_length=100)
    nm_estado: Optional[str] = Field(None, max_length=2)
    nr_cep: Optional[str] = Field(None, max_length=10)
    nm_pais: Optional[str] = Field("Brasil", max_length=100)

    # Informações de conta
    nm_plano: Optional[str] = Field("Free", description="Plano: Free, Starter, Professional, Enterprise")
    nr_limite_usuarios: Optional[int] = Field(5, description="Limite de usuários")
    nr_limite_agentes: Optional[int] = Field(2, description="Limite de agentes")
    nr_limite_document_stores: Optional[int] = Field(1, description="Limite de document stores")

    # Configurações
    ds_logo_url: Optional[str] = Field(None, max_length=500, description="URL do logo")
    nm_cor_primaria: Optional[str] = Field("#6366f1", max_length=7, description="Cor primária (hex)")


class EmpresaCreate(EmpresaBase):
    """Model para criação de empresa"""

    st_ativo: Optional[str] = Field("S", description="Status: S=Ativo, N=Inativo")
    dt_assinatura: Optional[date] = None
    dt_vencimento: Optional[date] = None
    ds_config: Optional[dict] = None


class EmpresaUpdate(BaseModel):
    """Model para atualização de empresa"""

    nm_empresa: Optional[str] = Field(None, min_length=1, max_length=255)
    nm_razao_social: Optional[str] = Field(None, max_length=255)
    nr_cnpj: Optional[str] = Field(None, max_length=18)
    nm_segmento: Optional[str] = Field(None, max_length=100)
    nm_porte: Optional[str] = None
    nr_telefone: Optional[str] = Field(None, max_length=20)
    nm_email_contato: Optional[str] = Field(None, max_length=255)

    # Endereço
    nm_endereco: Optional[str] = Field(None, max_length=255)
    nm_cidade: Optional[str] = Field(None, max_length=100)
    nm_estado: Optional[str] = Field(None, max_length=2)
    nr_cep: Optional[str] = Field(None, max_length=10)
    nm_pais: Optional[str] = Field(None, max_length=100)

    # Informações de conta
    st_ativo: Optional[str] = None
    dt_assinatura: Optional[date] = None
    dt_vencimento: Optional[date] = None
    nm_plano: Optional[str] = None
    nr_limite_usuarios: Optional[int] = None
    nr_limite_agentes: Optional[int] = None
    nr_limite_document_stores: Optional[int] = None

    # Configurações
    ds_config: Optional[dict] = None
    ds_logo_url: Optional[str] = Field(None, max_length=500)
    nm_cor_primaria: Optional[str] = Field(None, max_length=7)


class EmpresaResponse(EmpresaBase):
    """Model para resposta de empresa"""

    id_empresa: uuid.UUID
    st_ativo: str
    dt_assinatura: Optional[date]
    dt_vencimento: Optional[date]
    ds_config: Optional[dict]
    dt_criacao: datetime
    dt_atualizacao: datetime

    # Estatísticas (opcionais, podem ser adicionadas dinamicamente)
    nr_usuarios_ativos: Optional[int] = None
    nr_agentes_criados: Optional[int] = None
    nr_document_stores_criados: Optional[int] = None

    model_config = {"from_attributes": True}
