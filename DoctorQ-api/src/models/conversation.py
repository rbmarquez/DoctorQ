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

from src.config.orm_config import Base


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

    # Relacionamentos
    id_usuario = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_usuario",
    )
    id_empresa = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="SET NULL"),
        nullable=True,
        name="id_empresa",
    )
    id_agente = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("tb_agentes.id_agente", ondelete="CASCADE"),
        nullable=False,
        name="id_agente",
    )

    # Informações da conversa
    nm_titulo = Column(
        String(255),
        nullable=False,
        default="Nova Conversa",
        name="nm_titulo",
    )
    ds_resumo = Column(Text, nullable=True, name="ds_resumo")

    # Estatísticas
    nr_total_mensagens = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_total_mensagens",
    )
    nr_mensagens_usuario = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_mensagens_usuario",
    )
    nr_mensagens_agente = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_mensagens_agente",
    )
    nr_tokens_total = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_tokens_total",
    )
    vl_custo_total = Column(
        Numeric(10, 6),
        default=0.00,
        nullable=False,
        name="vl_custo_total",
    )

    # Status e configurações
    st_arquivada = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_arquivada",
    )
    st_compartilhada = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_compartilhada",
    )
    st_favorita = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_favorita",
    )
    ds_token_compartilhamento = Column(
        String(100),
        unique=True,
        nullable=True,
        name="ds_token_compartilhamento",
    )

    # Metadados
    ds_metadata = Column(
        JSONB,
        default={},
        nullable=False,
        name="ds_metadata",
    )
    ds_tags = Column(
        ARRAY(Text),
        nullable=True,
        name="ds_tags",
    )

    # Timestamps
    dt_criacao = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        name="dt_atualizacao",
    )
    dt_ultima_mensagem = Column(
        DateTime,
        nullable=True,
        name="dt_ultima_mensagem",
    )
    dt_arquivada = Column(
        DateTime,
        nullable=True,
        name="dt_arquivada",
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
    """Schema base para conversas."""
    model_config = ConfigDict(from_attributes=True)

    nm_titulo: str = Field(default="Nova Conversa", max_length=255)
    ds_resumo: Optional[str] = None
    ds_metadata: Optional[dict] = Field(default_factory=dict)
    ds_tags: Optional[List[str]] = None


class ConversationCreate(ConversationBase):
    """Schema para criar conversa."""
    id_agente: UUID = Field(..., description="ID do agente")
    id_user: Optional[UUID] = Field(None, description="ID do usuário (opcional)")


class ConversationUpdate(BaseModel):
    """Schema para atualizar conversa."""
    model_config = ConfigDict(from_attributes=True)

    nm_titulo: Optional[str] = Field(None, max_length=255)
    ds_resumo: Optional[str] = None
    st_arquivada: Optional[bool] = None
    st_compartilhada: Optional[bool] = None
    st_favorita: Optional[bool] = None
    ds_tags: Optional[List[str]] = None


class ConversationResponse(ConversationBase):
    """Schema de resposta de conversa."""
    id_conversa: UUID
    id_usuario: UUID
    id_empresa: Optional[UUID] = None
    id_agente: UUID
    nr_total_mensagens: int
    nr_mensagens_usuario: int
    nr_mensagens_agente: int
    nr_tokens_total: int
    vl_custo_total: float
    st_arquivada: bool
    st_compartilhada: bool
    st_favorita: bool
    ds_token_compartilhamento: Optional[str] = None
    dt_criacao: datetime
    dt_atualizacao: datetime
    dt_ultima_mensagem: Optional[datetime] = None
    dt_arquivada: Optional[datetime] = None


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
