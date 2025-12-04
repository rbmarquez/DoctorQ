"""
Modelo de Mensagem para o sistema de conversas
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel, Field
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


class MessageRole(str, Enum):
    """Papéis possíveis de uma mensagem"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    FUNCTION = "function"
    TOOL = "tool"


class Message(Base):
    """Modelo para a tabela tb_messages"""

    __tablename__ = "tb_messages"

    id_mensagem = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_mensagem",
    )

    # Foreign Keys
    id_conversa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_conversas.id_conversa", ondelete="CASCADE"),
        nullable=False,
        name="id_conversa",
        index=True,
    )
    id_usuario = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="SET NULL"),
        nullable=True,
        name="id_usuario",
        index=True,
    )
    id_agente = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_agentes.id_agente", ondelete="SET NULL"),
        nullable=True,
        name="id_agente",
    )

    # Message Content
    nm_papel = Column(
        String(20),
        nullable=False,
        name="nm_papel",
    )
    ds_conteudo = Column(
        Text,
        nullable=False,
        name="ds_conteudo",
    )

    # Metadata
    ds_metadata = Column(
        Text,
        nullable=True,
        name="ds_metadata",  # JSON com informações extras (tools usadas, etc)
    )

    # Token & Cost Tracking
    nr_tokens = Column(
        Integer,
        nullable=True,
        name="nr_tokens",
    )
    vl_custo = Column(
        Numeric(10, 6),  # Permite valores até 9999.999999
        nullable=True,
        name="vl_custo",
    )
    nm_modelo = Column(
        String(100),
        nullable=True,
        name="nm_modelo",  # gpt-3.5-turbo, gpt-4, etc
    )

    # Timestamps
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=True,
        default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    # Relationships
    # Comentado para evitar conflito com modelo existente de Conversation
    # conversation = relationship(
    #     "Conversation",
    #     back_populates="messages",
    #     lazy="select"
    # )

    def __repr__(self):
        return f"<Message(id={self.id_mensagem}, role={self.nm_papel}, tokens={self.nr_tokens})>"


# Pydantic Models para API
class MessageBase(BaseModel):
    """Schema base para Message"""

    nm_papel: MessageRole = Field(..., description="Papel da mensagem")
    ds_conteudo: str = Field(..., description="Conteúdo da mensagem")
    ds_metadata: Optional[Dict] = Field(None, description="Metadados extras")
    nr_tokens: Optional[int] = Field(None, description="Número de tokens")
    vl_custo: Optional[float] = Field(None, description="Custo estimado")
    nm_modelo: Optional[str] = Field(None, description="Modelo usado")


class MessageCreate(MessageBase):
    """Schema para criar uma Message"""
    pass


class MessageUpdate(BaseModel):
    """Schema para atualizar uma Message"""

    ds_conteudo: Optional[str] = Field(None, description="Conteúdo da mensagem")
    ds_metadata: Optional[Dict] = Field(None, description="Metadados extras")
    nr_tokens: Optional[int] = Field(None, description="Número de tokens")
    vl_custo: Optional[float] = Field(None, description="Custo estimado")


class MessageResponse(MessageBase):
    """Schema de resposta para Message"""

    id_mensagem: uuid.UUID = Field(..., description="ID único da mensagem")
    id_conversa: uuid.UUID = Field(..., description="ID da conversa")
    id_usuario: Optional[uuid.UUID] = Field(None, description="ID do usuário")
    id_agente: Optional[uuid.UUID] = Field(None, description="ID do agente")
    dt_criacao: datetime = Field(..., description="Data de criação")
    dt_atualizacao: Optional[datetime] = Field(None, description="Data de atualização")

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """Schema para lista de mensagens"""

    items: list[MessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int