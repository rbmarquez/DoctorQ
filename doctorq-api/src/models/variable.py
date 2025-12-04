# src/models/variable.py
import uuid
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field
from sqlalchemy import CHAR, Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text

from src.models.base import Base


class Variable(Base):
    """Modelo para a tabela variable"""

    __tablename__ = "tb_variaveis"

    st_criptografado: Literal["S", "N"] = Field(
        "N", description="Indica se estÃ¡ criptografado: 'S' ou 'N'"
    )

    id_variavel = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_variavel",
    )
    nm_variavel = Column(String, nullable=False, name="nm_variavel", unique=True)
    vl_variavel = Column(Text, nullable=False, name="vl_variavel")
    # NOTA: A coluna no banco tem typo "st_criptogrado" (sem "f")
    # Usamos name="st_criptogrado" para mapear corretamente ao banco
    st_criptografado = Column(
        CHAR(1), nullable=False, server_default=text("'N'"), name="st_criptogrado"
    )
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    def __repr__(self):
        return f"<Variable(id_variavel={self.id_variavel}, nm_variavel='{self.nm_variavel}', st_criptografado='{self.st_criptografado}')>"


# Pydantic Models para API
class VariableBase(BaseModel):
    """Schema base para Variable"""

    nm_variavel: str = Field(..., description="Nome da variÃ¡vel")
    vl_variavel: str = Field(..., description="Valor da variÃ¡vel")
    st_criptografado: Optional[Literal["S", "N"]] = Field(
        None, description="Tipo da variÃ¡vel"
    )


class VariableCreate(VariableBase):
    """Schema para criar uma Variable"""

    nm_variavel: str = Field(..., description="Nome da variÃ¡vel")
    vl_variavel: str = Field(..., description="Valor da variÃ¡vel")
    st_criptografado: Literal["S", "N"] = Field("N", description="Tipo da variÃ¡vel")


class VariableUpdate(BaseModel):
    """Schema para atualizar uma Variable"""

    nm_variavel: Optional[str] = Field(None, description="Nome da variÃ¡vel")
    vl_variavel: Optional[str] = Field(None, description="Valor da variÃ¡vel")
    st_criptografado: Optional[Literal["S", "N"]] = Field(
        None, description="Tipo da variÃ¡vel"
    )


class VariableResponse(VariableBase):
    """Schema de resposta para Variable"""

    id_variavel: uuid.UUID = Field(..., description="ID Ãºnico da variÃ¡vel")
    nm_variavel: str = Field(..., description="Nome da variÃ¡vel")
    vl_variavel: str = Field(..., description="Valor da variÃ¡vel")
    st_criptografado: Optional[Literal["S", "N"]] = Field(
        None, description="Tipo da variÃ¡vel"
    )
    dt_criacao: datetime = Field(..., description="Data de criaÃ§Ã£o")
    dt_atualizacao: datetime = Field(..., description="Data de atualizaÃ§Ã£o")

    class Config:
        from_attributes = True


class VariableListResponse(BaseModel):
    """Schema para lista de variÃ¡veis com paginaÃ§Ã£o"""

    data: List[VariableResponse]
    total: int
    page: int
    size: int
    totalPages: int
