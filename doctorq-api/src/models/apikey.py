# src/models/apikey.py
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class ApiKey(Base):
    """Modelo para a tabela tb_api_keys"""

    __tablename__ = "tb_api_keys"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_api_key",
    )
    apiKey = Column(String, nullable=False, name="nm_api_key", unique=True)
    keyName = Column(String, nullable=True, name="nm_descricao")
    id_empresa = Column(UUID(as_uuid=True), nullable=True, name="id_empresa")
    id_user = Column(UUID(as_uuid=True), nullable=True, name="id_user")
    st_ativo = Column(Boolean, nullable=True, name="st_ativo", default=True)
    updatedDate = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )

    def __repr__(self):
        return f"<ApiKey(id={self.id}, keyName='{self.keyName}', apiKey='{self.apiKey[:8]}...')>"


# Pydantic Models para API
class ApiKeyBase(BaseModel):
    """Schema base para ApiKey"""

    keyName: str = Field(..., description="Nome descritivo da API Key")


class ApiKeyCreate(ApiKeyBase):
    """Schema para criar uma ApiKey"""

    keyName: str = Field(
        ..., min_length=1, max_length=100, description="Nome da API Key"
    )


class ApiKeyUpdate(BaseModel):
    """Schema para atualizar uma ApiKey"""

    keyName: Optional[str] = Field(
        None, min_length=1, max_length=100, description="Nome da API Key"
    )


class ApiKeyResponse(ApiKeyBase):
    """Schema de resposta para ApiKey"""

    id: uuid.UUID = Field(..., description="ID Ãºnico da API Key")
    keyName: str = Field(..., description="Nome da API Key")
    apiKey: str = Field(..., description="Chave pÃºblica da API")
    updatedDate: datetime = Field(..., description="Data de Ãºltima atualizaÃ§Ã£o")

    class Config:
        from_attributes = True


class ApiKeyCreateResponse(ApiKeyResponse):
    """Schema de resposta para criaÃ§Ã£o de ApiKey com secret"""

    apiSecret: str = Field(
        ..., description="Chave secreta da API (mostrada apenas na criaÃ§Ã£o)"
    )


class ApiKeyRegenerateResponse(BaseModel):
    """Schema de resposta para regeneraÃ§Ã£o de secret"""

    id: uuid.UUID = Field(..., description="ID da API Key")
    apiKey: str = Field(..., description="Chave pÃºblica da API")
    apiSecret: str = Field(..., description="Nova chave secreta da API")
    updatedDate: datetime = Field(..., description="Data de atualizaÃ§Ã£o")

    class Config:
        from_attributes = True


class ApiKeyListResponse(BaseModel):
    """Schema para lista de API Keys"""

    items: List[ApiKeyResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(cls, apikeys: List["ApiKey"], total: int, page: int, size: int):
        """Criar resposta de paginaÃ§Ã£o"""
        total_pages = (total + size - 1) // size  # CÃ¡lculo de pÃ¡ginas

        # Converter apikeys para response - usa model_validate
        items = [ApiKeyResponse.model_validate(apikey) for apikey in apikeys]

        return cls(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            },
        )
