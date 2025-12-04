# src/models/chat_message.py
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class TipoMessage(str, Enum):
    """Enum para tipos de mensagem"""

    USER_MESSAGE = "userMessage"
    API_MESSAGE = "apiMessage"


class ChatMessage(Base):
    """Modelo para a tabela chat_message"""

    __tablename__ = "tb_chat_message"

    id_chat_message = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_chat_message",
    )
    id_agent = Column(UUID(as_uuid=True), nullable=False, name="id_agent")
    id_conversation = Column(UUID(as_uuid=True), nullable=False, name="id_conversation")
    tools = Column(Text, nullable=True, name="tools")
    nm_text = Column(Text, nullable=False, name="nm_text")
    nm_tipo = Column(String(20), nullable=False, name="nm_tipo")
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )

    def __repr__(self):
        return f"<ChatMessage(id_chat_message={self.id_chat_message}, id_agent={self.id_agent}, nm_tipo='{self.nm_tipo}')>"


# Pydantic Models para API
class ChatMessageBase(BaseModel):
    """Schema base para ChatMessage"""

    id_agent: uuid.UUID = Field(..., description="ID do agente")
    id_conversation: uuid.UUID = Field(..., description="ID da conversa")
    tools: Optional[str] = Field(None, description="Tools utilizadas")
    nm_text: str = Field(..., description="Texto da mensagem")
    nm_tipo: TipoMessage = Field(
        ..., description="Tipo da mensagem: userMessage ou apiMessage"
    )


class ChatMessageCreate(ChatMessageBase):
    """Schema para criar um ChatMessage"""

    id_agent: uuid.UUID = Field(..., description="ID do agente")
    id_conversation: uuid.UUID = Field(..., description="ID da conversa")
    tools: Optional[str] = Field(None, description="Tools utilizadas")
    nm_text: str = Field(..., description="Texto da mensagem")
    nm_tipo: TipoMessage = Field(..., description="Tipo da mensagem")


class ChatMessageUpdate(BaseModel):
    """Schema para atualizar um ChatMessage"""

    id_chat_message: uuid.UUID = Field(..., description="ID Ãºnico da mensagem")
    id_agent: Optional[uuid.UUID] = Field(None, description="ID do agente")
    id_conversation: Optional[uuid.UUID] = Field(None, description="ID da conversa")
    tools: Optional[str] = Field(None, description="Tools utilizadas")
    nm_text: Optional[str] = Field(None, description="Texto da mensagem")
    nm_tipo: Optional[TipoMessage] = Field(None, description="Tipo da mensagem")


class ChatMessageResponse(ChatMessageBase):
    """Schema de resposta para ChatMessage"""

    id_chat_message: uuid.UUID = Field(..., description="ID Ãºnico da mensagem")
    id_agent: uuid.UUID = Field(..., description="ID do agente")
    id_conversation: uuid.UUID = Field(..., description="ID da conversa")
    tools: Optional[str] = Field(None, description="Tools utilizadas")
    nm_text: str = Field(..., description="Texto da mensagem")
    nm_tipo: TipoMessage = Field(..., description="Tipo da mensagem")
    dt_criacao: datetime = Field(..., description="Data de criaÃ§Ã£o")

    class Config:
        from_attributes = True


class ChatMessageListResponse(BaseModel):
    """Schema para lista de mensagens de chat"""

    items: list[ChatMessageResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(
        cls, messages: List["ChatMessage"], total: int, page: int, size: int
    ):
        """Criar resposta de paginaÃ§Ã£o"""
        total_pages = (total + size - 1) // size

        items = [ChatMessageResponse.model_validate(message) for message in messages]

        return cls(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            },
        )
