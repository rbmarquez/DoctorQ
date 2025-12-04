"""
Modelos para Marketplace de Agentes
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import ARRAY, Boolean, Column, Integer, Numeric, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID

from src.config.orm_config import Base


# Modelos SQLAlchemy
class MarketplaceAgente(Base):
    """Modelo de Agente no Marketplace"""

    __tablename__ = "tb_marketplace_agentes"

    id_marketplace_agente = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_agente = Column(UUID(as_uuid=True), nullable=False)
    id_empresa_publicador = Column(UUID(as_uuid=True), nullable=True)
    nm_categoria = Column(String(100), nullable=True)
    ds_tags = Column(ARRAY(Text), default=list)
    ds_descricao_longa = Column(Text, nullable=True)
    nr_instalacoes = Column(Integer, default=0)
    nr_avaliacoes = Column(Integer, default=0)
    nr_media_estrelas = Column(Numeric(3, 2), default=0.00)
    st_ativo = Column(Boolean, default=True)
    st_destacado = Column(Boolean, default=False)
    dt_publicacao = Column(TIMESTAMP, default=datetime.utcnow)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class AvaliacaoAgente(Base):
    """Modelo de Avaliação de Agente"""

    __tablename__ = "tb_avaliacoes_agentes"

    id_avaliacao = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_marketplace_agente = Column(UUID(as_uuid=True), nullable=False)
    id_usuario = Column(UUID(as_uuid=True), nullable=False)
    id_empresa = Column(UUID(as_uuid=True), nullable=True)
    nr_estrelas = Column(Integer, nullable=False)
    ds_comentario = Column(Text, nullable=True)
    st_util = Column(Boolean, nullable=True)
    nr_votos_util = Column(Integer, default=0)
    dt_criacao = Column(TIMESTAMP, default=datetime.utcnow)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class InstalacaoMarketplace(Base):
    """Modelo de Instalação de Agente do Marketplace"""

    __tablename__ = "tb_instalacoes_marketplace"

    id_instalacao = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_marketplace_agente = Column(UUID(as_uuid=True), nullable=False)
    id_agente_instalado = Column(UUID(as_uuid=True), nullable=False)
    id_empresa = Column(UUID(as_uuid=True), nullable=False)
    id_usuario_instalador = Column(UUID(as_uuid=True), nullable=False)
    st_ativo = Column(Boolean, default=True)
    dt_instalacao = Column(TIMESTAMP, default=datetime.utcnow)


# Schemas Pydantic
class MarketplaceAgenteBase(BaseModel):
    """Schema base para Agente no Marketplace"""

    nm_categoria: Optional[str] = Field(None, description="Categoria do agente")
    ds_tags: Optional[List[str]] = Field(default_factory=list, description="Tags para busca")
    ds_descricao_longa: Optional[str] = Field(None, description="Descrição detalhada")


class MarketplaceAgentePublicar(MarketplaceAgenteBase):
    """Schema para publicar agente no marketplace"""

    id_agente: uuid.UUID = Field(..., description="ID do agente a ser publicado")


class MarketplaceAgenteResponse(MarketplaceAgenteBase):
    """Schema de resposta para Agente do Marketplace"""

    id_marketplace_agente: uuid.UUID
    id_agente: uuid.UUID
    id_empresa_publicador: Optional[uuid.UUID]
    nr_instalacoes: int = 0
    nr_avaliacoes: int = 0
    nr_media_estrelas: Decimal = Decimal("0.00")
    st_ativo: bool = True
    st_destacado: bool = False
    dt_publicacao: datetime
    dt_atualizacao: datetime

    # Dados do agente original (serão carregados via join)
    nm_agente: Optional[str] = None
    ds_prompt: Optional[str] = None

    class Config:
        from_attributes = True


class AvaliacaoCreate(BaseModel):
    """Schema para criar avaliação"""

    id_marketplace_agente: uuid.UUID = Field(..., description="ID do agente no marketplace")
    nr_estrelas: int = Field(..., ge=1, le=5, description="Avaliação de 1 a 5 estrelas")
    ds_comentario: Optional[str] = Field(None, max_length=1000, description="Comentário opcional")


class AvaliacaoUpdate(BaseModel):
    """Schema para atualizar avaliação"""

    nr_estrelas: Optional[int] = Field(None, ge=1, le=5, description="Avaliação de 1 a 5 estrelas")
    ds_comentario: Optional[str] = Field(None, max_length=1000, description="Comentário opcional")


class AvaliacaoResponse(BaseModel):
    """Schema de resposta para Avaliação"""

    id_avaliacao: uuid.UUID
    id_marketplace_agente: uuid.UUID
    id_usuario: uuid.UUID
    id_empresa: Optional[uuid.UUID]
    nr_estrelas: int
    ds_comentario: Optional[str]
    st_util: Optional[bool]
    nr_votos_util: int = 0
    dt_criacao: datetime
    dt_atualizacao: datetime

    # Dados do usuário (carregados separadamente)
    nm_usuario: Optional[str] = None

    class Config:
        from_attributes = True


class InstalacaoCreate(BaseModel):
    """Schema para instalar agente do marketplace"""

    id_marketplace_agente: uuid.UUID = Field(..., description="ID do agente no marketplace")


class InstalacaoResponse(BaseModel):
    """Schema de resposta para Instalação"""

    id_instalacao: uuid.UUID
    id_marketplace_agente: uuid.UUID
    id_agente_instalado: uuid.UUID
    id_empresa: uuid.UUID
    id_usuario_instalador: uuid.UUID
    st_ativo: bool
    dt_instalacao: datetime

    class Config:
        from_attributes = True


# Categorias permitidas no marketplace
CATEGORIAS_MARKETPLACE = [
    "assistente",
    "atendimento",
    "vendas",
    "marketing",
    "desenvolvimento",
    "analise",
    "pesquisa",
    "educacao",
    "outro",
]
