# src/models/contato.py
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class Contato(Base):
    """Modelo para a tabela contato"""

    __tablename__ = "tb_contatos"

    id_contato = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_contato",
    )
    nm_contato = Column(String(255), nullable=False, name="nm_contato")
    nm_email = Column(String(255), nullable=False, unique=True, name="nm_email")
    nr_telefone = Column(String(20), nullable=True, name="nr_telefone")
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )

    def __repr__(self):
        return f"<Contato(id_contato={self.id_contato}, nm_contato='{self.nm_contato}', nm_email='{self.nm_email}')>"


# Pydantic Models para API
class ContatoBase(BaseModel):
    """Schema base para Contato"""

    nm_contato: str = Field(..., description="Nome do contato")
    nm_email: str = Field(..., description="Email do contato")
    nr_telefone: Optional[str] = Field(None, description="Telefone do contato")


class ContatoCreate(ContatoBase):
    """Schema para criar um Contato"""

    nm_contato: str = Field(..., description="Nome do contato")
    nm_email: str = Field(..., description="Email do contato")
    nr_telefone: Optional[str] = Field(None, description="Telefone do contato")


class ContatoUpdate(BaseModel):
    """Schema para atualizar um Contato"""

    id_contato: uuid.UUID = Field(..., description="ID Ãºnico do contato")
    nm_contato: Optional[str] = Field(None, description="Nome do contato")
    nm_email: Optional[str] = Field(None, description="Email do contato")
    nr_telefone: Optional[str] = Field(None, description="Telefone do contato")


class ContatoResponse(ContatoBase):
    """Schema de resposta para Contato"""

    id_contato: uuid.UUID = Field(..., description="ID Ãºnico do contato")
    nm_contato: str = Field(..., description="Nome do contato")
    nm_email: str = Field(..., description="Email do contato")
    nr_telefone: Optional[str] = Field(None, description="Telefone do contato")
    dt_criacao: datetime = Field(..., description="Data de criaÃ§Ã£o")

    class Config:
        from_attributes = True


class ContatoListResponse(BaseModel):
    """Schema para lista de contatos"""

    items: list[ContatoResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(
        cls, contatos: List["Contato"], total: int, page: int, size: int
    ):
        """Criar resposta de paginaÃ§Ã£o"""
        total_pages = (total + size - 1) // size

        items = [ContatoResponse.model_validate(contato) for contato in contatos]

        return cls(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            },
        )
