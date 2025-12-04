# src/models/conversation.py
"""
Models para o sistema de conversas com agentes de IA.
Implementa as tabelas tb_conversas e tb_mensagens.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, ConfigDict

from src.models.base import Base


# ============================================================================
# SQLAlchemy Models
# ============================================================================

class Conversation(Base):
    """Model para conversas entre usuários e agentes."""

    __tablename__ = "tb_conversas"

    # Identificadores
    id_conversa = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
        name="id_conversa",
    )

    # Relacionamentos - ALINHADO COM SCHEMA REAL DO BANCO
    id_user = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=True,  # Permite conversas anônimas
        name="id_user",
    )
    id_agente = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tb_agentes.id_agente", ondelete="CASCADE"),
        nullable=True,
        name="id_agente",
    )
    id_paciente = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tb_pacientes.id_paciente", ondelete="SET NULL"),
        nullable=True,
        name="id_paciente",
    )

    # Informações da conversa - ALINHADO COM SCHEMA REAL
    nm_titulo = Column(
        String(255),
        nullable=True,
        name="nm_titulo",
    )
    ds_contexto = Column(
        Text,
        nullable=True,
        name="ds_contexto",
    )

    # Metadados
    ds_metadata = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_metadata",
    )

    # Estatísticas - APENAS AS QUE EXISTEM NO BANCO
    nr_total_mensagens = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_total_mensagens",
    )

    # Status - ALINHADO COM SCHEMA REAL
    st_ativa = Column(
        Boolean,
        default=True,
        nullable=True,
        name="st_ativa",
    )

    # Timestamps - ALINHADO COM SCHEMA REAL
    dt_criacao = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=True,
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True,
        name="dt_atualizacao",
    )
    dt_ultima_mensagem = Column(
        DateTime,
        nullable=True,
        name="dt_ultima_mensagem",
    )

    # Relacionamentos ORM - removed to avoid conflicts
    # The messages relationship will be handled at service level
    pass


# OLD Message model commented out - using new one from src.models.message
# class Message(Base):
#     """Model para mensagens individuais das conversas."""
#
#     __tablename__ = "tb_mensagens"
#
#     # Identificadores
#     id_mensagem = Column(
#         PG_UUID(as_uuid=True),
#         primary_key=True,
#         server_default="gen_random_uuid()",
#         name="id_mensagem",
#     )
#
#     # Relacionamento
#     id_conversa = Column(
#         PG_UUID(as_uuid=True),
#         ForeignKey("tb_conversas.id_conversa", ondelete="CASCADE"),
#         nullable=False,
#         name="id_conversa",
#     )
#
#     # Conteúdo
#     nm_papel = Column(
#         String(20),
#         nullable=False,
#         name="nm_papel",
#     )
#     ds_conteudo = Column(
#         Text,
#         nullable=False,
#         name="ds_conteudo",
#     )
#
#     # Metadados de processamento
#     ds_metadata = Column(
#         JSONB,
#         default={},
#         nullable=False,
#         name="ds_metadata",
#     )
#     nr_tokens = Column(Integer, nullable=True, name="nr_tokens")
#     vl_custo = Column(Numeric(10, 6), nullable=True, name="vl_custo")
#     vl_temperatura = Column(Numeric(3, 2), nullable=True, name="vl_temperatura")
#     nm_modelo = Column(String(100), nullable=True, name="nm_modelo")
#
#     # Status
#     st_editada = Column(
#         Boolean,
#         default=False,
#         nullable=False,
#         name="st_editada",
#     )
#     st_regenerada = Column(
#         Boolean,
#         default=False,
#         nullable=False,
#         name="st_regenerada",
#     )
#     st_deletada = Column(
#         Boolean,
#         default=False,
#         nullable=False,
#         name="st_deletada",
#     )
#     st_streaming = Column(
#         Boolean,
#         default=False,
#         nullable=False,
#         name="st_streaming",
#     )
#
#     # Referências
#     id_mensagem_original = Column(
#         PG_UUID(as_uuid=True),
#         ForeignKey("tb_mensagens.id_mensagem"),
#         nullable=True,
#         name="id_mensagem_original",
#     )
#     id_mensagem_pai = Column(
#         PG_UUID(as_uuid=True),
#         ForeignKey("tb_mensagens.id_mensagem"),
#         nullable=True,
#         name="id_mensagem_pai",
#     )
#
#     # Timestamps
#     dt_criacao = Column(
#         DateTime,
#         default=datetime.utcnow,
#         nullable=False,
#         name="dt_criacao",
#     )
#     dt_atualizacao = Column(
#         DateTime,
#         default=datetime.utcnow,
#         onupdate=datetime.utcnow,
#         nullable=False,
#         name="dt_atualizacao",
#     )
#     dt_deletada = Column(
#         DateTime,
#         nullable=True,
#         name="dt_deletada",
#     )
#
#     # Relacionamento ORM
#     conversation = relationship(
#         "Conversation",
#         back_populates="messages",
#     )
#
#     # Constraints
#     __table_args__ = (
#         CheckConstraint(
#             "nm_papel IN ('user', 'assistant', 'system', 'function')",
#             name="check_papel_valido",
#         ),
#     )


# ============================================================================
# Pydantic Schemas
# ============================================================================

class MessageRole:
    """Constantes para papéis de mensagem."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    FUNCTION = "function"


class MessageBase(BaseModel):
    """Schema base para mensagens."""
    model_config = ConfigDict(from_attributes=True)

    nm_papel: str = Field(..., description="Papel da mensagem")
    ds_conteudo: str = Field(..., description="Conteúdo da mensagem")
    ds_metadata: Optional[dict] = Field(default_factory=dict)
    nr_tokens: Optional[int] = None
    vl_custo: Optional[float] = None
    vl_temperatura: Optional[float] = None
    nm_modelo: Optional[str] = None


class MessageCreate(MessageBase):
    """Schema para criar mensagem."""
    pass


class MessageUpdate(BaseModel):
    """Schema para atualizar mensagem."""
    model_config = ConfigDict(from_attributes=True)

    ds_conteudo: Optional[str] = None
    st_editada: Optional[bool] = None
    st_deletada: Optional[bool] = None


class MessageResponse(MessageBase):
    """Schema de resposta de mensagem."""
    id_mensagem: UUID
    id_conversa: UUID
    st_editada: bool
    st_regenerada: bool
    st_deletada: bool
    st_streaming: bool
    id_mensagem_original: Optional[UUID] = None
    id_mensagem_pai: Optional[UUID] = None
    dt_criacao: datetime
    dt_atualizacao: datetime
    dt_deletada: Optional[datetime] = None


class ConversationBase(BaseModel):
    """Schema base para conversas - ALINHADO COM SCHEMA REAL DO BANCO."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    nm_titulo: Optional[str] = Field(default="Nova Conversa", max_length=255)
    ds_contexto: Optional[str] = None
    ds_metadata: Optional[dict] = Field(default_factory=dict)


class ConversationCreate(ConversationBase):
    """Schema para criar conversa."""
    id_agente: UUID = Field(..., description="ID do agente")
    id_user: Optional[UUID] = Field(None, description="ID do usuário (opcional para conversas anônimas)")
    id_paciente: Optional[UUID] = Field(None, description="ID do paciente (opcional)")


class ConversationUpdate(BaseModel):
    """Schema para atualizar conversa - ALINHADO COM SCHEMA REAL."""
    model_config = ConfigDict(from_attributes=True)

    nm_titulo: Optional[str] = Field(None, max_length=255)
    ds_contexto: Optional[str] = None
    st_ativa: Optional[bool] = None


class ConversationResponse(ConversationBase):
    """Schema de resposta de conversa - ALINHADO COM SCHEMA REAL DO BANCO."""
    id_conversa: UUID
    id_user: Optional[UUID] = Field(None, validation_alias="id_usuario")  # Aceita id_usuario também (compatibilidade)
    id_agente: Optional[UUID] = None
    id_paciente: Optional[UUID] = None
    nr_total_mensagens: Optional[int] = 0
    st_ativa: Optional[bool] = True
    dt_criacao: Optional[datetime] = None
    dt_atualizacao: Optional[datetime] = None
    dt_ultima_mensagem: Optional[datetime] = None


class ConversationWithMessages(ConversationResponse):
    """Schema de conversa com mensagens."""
    messages: List[MessageResponse] = []


class ConversationListResponse(BaseModel):
    """Schema de resposta de lista de conversas."""
    model_config = ConfigDict(from_attributes=True)

    items: List[ConversationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageListResponse(BaseModel):
    """Schema de resposta de lista de mensagens."""
    model_config = ConfigDict(from_attributes=True)

    items: List[MessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ChatRequest(BaseModel):
    """Schema para requisição de chat."""
    model_config = ConfigDict(from_attributes=True)

    message: str = Field(..., description="Mensagem do usuário")
    stream: bool = Field(default=True, description="Usar streaming")
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1)


class ChatResponse(BaseModel):
    """Schema de resposta de chat."""
    model_config = ConfigDict(from_attributes=True)

    id_mensagem: UUID
    ds_conteudo: str
    nr_tokens: Optional[int] = None
    vl_custo: Optional[float] = None
    nm_modelo: Optional[str] = None
