"""
Modelo de Mensagem para o sistema de conversas
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel, Field
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
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
        name="id_message",  # Nome real da coluna no banco
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
        name="id_user",  # Nome real da coluna no banco
        index=True,
    )
    id_agente = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_agentes.id_agente", ondelete="SET NULL"),
        nullable=True,
        name="id_agente",  # Adicionada na migration 003
    )

    # Message Content
    nm_papel = Column(
        String(20),
        nullable=False,
        name="ds_role",  # Nome real da coluna no banco
    )
    ds_conteudo = Column(
        Text,
        nullable=False,
        name="ds_content",  # Nome real da coluna no banco
    )

    # Metadata
    ds_metadata = Column(
        JSONB,  # Banco usa JSONB, não Text
        nullable=True,
        name="ds_metadata",  # JSON com informações extras (tools usadas, etc)
    )

    # Token & Cost Tracking
    # Banco tem 2 colunas separadas: nr_tokens_prompt e nr_tokens_completion
    # Por simplicidade, vamos usar nr_tokens_prompt e ignorar nr_tokens_completion
    nr_tokens = Column(
        Integer,
        nullable=True,
        name="nr_tokens_prompt",  # Banco usa nr_tokens_prompt
    )
    vl_custo = Column(
        Numeric(10, 6),  # Permite valores até 9999.999999
        nullable=True,
        name="vl_custo",
    )
    vl_temperatura = Column(
        Numeric(3, 2),  # 0.0 a 2.0
        nullable=True,
        name="vl_temperatura",  # Adicionada na migration 003
    )
    nm_modelo = Column(
        String(100),
        nullable=True,
        name="nm_modelo",  # Adicionada na migration 003 (gpt-3.5-turbo, gpt-4, etc)
    )

    # Soft Delete
    st_deletada = Column(
        Boolean,
        nullable=False,
        default=False,
        name="st_deletada",  # Adicionada na migration 003
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
        name="dt_atualizacao",  # Adicionada na migration 003
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