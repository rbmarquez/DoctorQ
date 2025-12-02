"""
Modelos para Biblioteca de Prompts
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import ARRAY, Boolean, Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID

from src.config.orm_config import Base


# Modelo SQLAlchemy
class PromptLibrary(Base):
    """Modelo de Prompt da Biblioteca"""

    __tablename__ = "tb_prompt_biblioteca"

    id_prompt = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nm_titulo = Column(String(200), nullable=False)
    ds_prompt = Column(Text, nullable=False)
    ds_categoria = Column(String(50), nullable=True)
    ds_tags = Column(ARRAY(Text), default=list)
    id_empresa = Column(UUID(as_uuid=True), nullable=True)
    id_usuario_criador = Column(UUID(as_uuid=True), nullable=True)
    nr_vezes_usado = Column(Integer, default=0)
    st_publico = Column(Boolean, default=False)
    dt_criacao = Column(TIMESTAMP, default=datetime.utcnow)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


# Schemas Pydantic
class PromptLibraryBase(BaseModel):
    """Schema base para Prompt"""

    nm_titulo: str = Field(..., description="Título do prompt")
    ds_prompt: str = Field(..., description="Conteúdo do prompt")
    ds_categoria: Optional[str] = Field(None, description="Categoria do prompt")
    ds_tags: Optional[List[str]] = Field(default_factory=list, description="Tags para busca")
    st_publico: bool = Field(False, description="Se true, visível para toda empresa")


class PromptLibraryCreate(PromptLibraryBase):
    """Schema para criar um Prompt"""

    pass


class PromptLibraryUpdate(BaseModel):
    """Schema para atualizar um Prompt"""

    nm_titulo: Optional[str] = Field(None, description="Título do prompt")
    ds_prompt: Optional[str] = Field(None, description="Conteúdo do prompt")
    ds_categoria: Optional[str] = Field(None, description="Categoria do prompt")
    ds_tags: Optional[List[str]] = Field(None, description="Tags para busca")
    st_publico: Optional[bool] = Field(None, description="Se true, visível para toda empresa")


class PromptLibraryResponse(BaseModel):
    """Schema de resposta para Prompt"""

    id_prompt: uuid.UUID = Field(..., description="ID único do prompt")
    nm_titulo: str = Field(..., description="Título do prompt")
    ds_prompt: str = Field(..., description="Conteúdo do prompt")
    ds_categoria: Optional[str] = Field(None, description="Categoria do prompt")
    ds_tags: List[str] = Field(default_factory=list, description="Tags para busca")
    id_empresa: Optional[uuid.UUID] = Field(None, description="ID da empresa")
    id_usuario_criador: Optional[uuid.UUID] = Field(None, description="ID do criador")
    nr_vezes_usado: int = Field(0, description="Número de vezes usado")
    st_publico: bool = Field(False, description="Se true, visível para toda empresa")
    dt_criacao: datetime = Field(..., description="Data de criação")
    dt_atualizacao: datetime = Field(..., description="Data de atualização")

    class Config:
        from_attributes = True


# Categorias permitidas
CATEGORIAS_PERMITIDAS = [
    "atendimento",
    "analise",
    "criacao",
    "codigo",
    "pesquisa",
    "educacao",
    "outro",
]
