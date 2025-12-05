"""
ORM Model e Schemas para Configuração de Telas por Plano
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class PlanoTelaConfigORM(Base):
    """Configuração de Telas por Plano - tb_plano_telas_config"""

    __tablename__ = "tb_plano_telas_config"
    __table_args__ = {"extend_existing": True}

    id_plano_tela = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_service = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_partner_service_definitions.id_service", ondelete="CASCADE"),
        nullable=False,
    )
    cd_tela = Column(String(100), nullable=False)
    fg_visivel = Column(Boolean, nullable=False, default=True)
    dt_criacao = Column(DateTime(timezone=True), default=func.now())
    dt_atualizacao = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())


# Pydantic Schemas
class PlanoTelaConfigBase(BaseModel):
    cd_tela: str
    fg_visivel: bool = True


class PlanoTelaConfigCreate(PlanoTelaConfigBase):
    pass


class PlanoTelaConfigResponse(PlanoTelaConfigBase):
    id_plano_tela: uuid.UUID
    id_service: uuid.UUID
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlanoTelaConfigBulkCreate(BaseModel):
    """Schema para criação em lote de configurações de tela"""
    telas: List[PlanoTelaConfigBase] = Field(..., description="Lista de configurações de tela")


class PlanoTelaConfigBulkResponse(BaseModel):
    """Resposta para criação em lote"""
    message: str
    count: int
    configs: List[PlanoTelaConfigResponse]


class TelasPermitidasResponse(BaseModel):
    """Resposta com lista de telas permitidas para o usuário"""
    telas_permitidas: List[str] = Field(default_factory=list, description="Lista de códigos de telas visíveis")
    id_service: Optional[uuid.UUID] = Field(None, description="ID do plano/serviço do usuário")
    nm_plano: Optional[str] = Field(None, description="Nome do plano")
