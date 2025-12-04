# src/models/credencial.py
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.models.base import Base


class Credencial(Base):
    """Modelo de credencial"""

    __tablename__ = "tb_credenciais"

    id_credencial = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False)
    nome_credencial = Column(String(100), nullable=False)
    dados_criptografado = Column(Text, nullable=False)
    dt_criacao = Column(DateTime(timezone=True), server_default=func.now())
    dt_atualizacao = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CredencialCreate(BaseModel):
    """Schema para criaÃ§Ã£o de credencial"""

    nome: str = Field(..., description="Nome da credencial")
    nome_credencial: str = Field(..., description="Tipo da credencial")
    dados_criptografado: Dict[str, Any] | str = Field(
        ..., description="Dados da credencial"
    )


class CredencialUpdate(BaseModel):
    """Schema para atualizaÃ§Ã£o de credencial"""

    id_credencial: Optional[uuid.UUID] = None
    nome: Optional[str] = None
    nome_credencial: Optional[str] = None
    dados_criptografado: Optional[Dict[str, Any] | str] = None


class CredencialResponse(BaseModel):
    """Schema de resposta de credencial"""

    id_credencial: uuid.UUID
    nome: str
    nome_credencial: str
    dados_plaintext: Optional[Dict[str, Any]] = None
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class CredencialDecryptedResponse(BaseModel):
    """Schema de resposta com dados descriptografados"""

    id_credencial: uuid.UUID
    nome: str
    nome_credencial: str
    dados: Dict[str, Any]
    dt_criacao: datetime
    dt_atualizacao: datetime


class CredencialListResponse(BaseModel):
    """Schema de resposta para listagem de credenciais"""

    credenciais: list[CredencialResponse]
    total: int
    page: int
    size: int
    total_pages: int

    @classmethod
    def create_response(cls, credenciais: list, total: int, page: int, size: int):
        """Criar resposta de listagem"""
        total_pages = (total + size - 1) // size
        return cls(
            credenciais=[CredencialResponse.model_validate(c) for c in credenciais],
            total=total,
            page=page,
            size=size,
            total_pages=total_pages,
        )
