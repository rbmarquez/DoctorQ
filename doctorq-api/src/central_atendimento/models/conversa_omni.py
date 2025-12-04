# src/central_atendimento/models/conversa_omni.py
"""
Models para conversas e mensagens omnichannel.

Suporta conversas unificadas através de múltiplos canais
com histórico completo e metadados por mensagem.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import (
    Column,
    DateTime,
    String,
    Text,
    Boolean,
    Integer,
    ForeignKey,
    func,
    Enum as SQLEnum,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from src.models.base import Base
from src.central_atendimento.models.canal import CanalTipo


class MensagemTipo(str, Enum):
    """Tipos de mensagem."""
    TEXTO = "texto"
    IMAGEM = "imagem"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENTO = "documento"
    LOCALIZACAO = "localizacao"
    CONTATO = "contato"
    STICKER = "sticker"
    TEMPLATE = "template"
    INTERATIVO = "interativo"  # Buttons, lists
    REACAO = "reacao"
    SISTEMA = "sistema"  # Mensagens do sistema


class MensagemStatus(str, Enum):
    """Status de entrega da mensagem."""
    PENDENTE = "pendente"
    ENVIADA = "enviada"
    ENTREGUE = "entregue"
    LIDA = "lida"
    FALHA = "falha"
    DELETADA = "deletada"


class ConversaOmni(Base):
    """
    Model ORM para conversas omnichannel.

    Uma conversa representa uma sessão de comunicação com um contato,
    podendo incluir mensagens de múltiplos canais.
    """

    __tablename__ = "tb_conversas_omni"

    # Identificadores
    id_conversa = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_conversa",
    )

    # Multi-tenant
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        name="id_empresa",
        index=True,
    )

    # Relacionamento com contato
    id_contato = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_contatos_omni.id_contato", ondelete="CASCADE"),
        nullable=False,
        name="id_contato",
        index=True,
    )

    # Canal principal da conversa
    id_canal = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_canais_omni.id_canal", ondelete="SET NULL"),
        nullable=True,
        name="id_canal",
    )
    tp_canal = Column(
        SQLEnum(CanalTipo, name="tp_canal_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        name="tp_canal",
    )

    # Título e resumo
    nm_titulo = Column(
        String(255),
        nullable=True,
        name="nm_titulo",
    )
    ds_resumo = Column(
        Text,
        nullable=True,
        name="ds_resumo",
    )

    # Status
    st_aberta = Column(
        Boolean,
        default=True,
        nullable=False,
        name="st_aberta",
    )
    st_arquivada = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_arquivada",
    )
    st_bot_ativo = Column(
        Boolean,
        default=True,
        nullable=False,
        name="st_bot_ativo",  # Se o bot está respondendo automaticamente
    )
    st_aguardando_humano = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_aguardando_humano",
    )

    # Atendente responsável
    id_atendente = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="SET NULL"),
        nullable=True,
        name="id_atendente",
    )

    # Fila de atendimento
    id_fila = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_filas_atendimento.id_fila", ondelete="SET NULL"),
        nullable=True,
        name="id_fila",
    )

    # Agente de IA responsável (sem ForeignKey pois tb_agentes não tem modelo ORM)
    id_agente = Column(
        UUID(as_uuid=True),
        nullable=True,
        name="id_agente",
    )

    # Métricas
    nr_mensagens_total = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_mensagens_total",
    )
    nr_mensagens_entrada = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_mensagens_entrada",
    )
    nr_mensagens_saida = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_mensagens_saida",
    )
    nr_tempo_resposta_medio = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_tempo_resposta_medio",  # Em segundos
    )

    # Contexto da conversa
    ds_contexto = Column(
        JSONB,
        default={},
        nullable=False,
        name="ds_contexto",  # Contexto para o agente de IA
    )

    # Favorito (adicionado em migration_024)
    st_favorito = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_favorito",
    )

    # Metadados
    ds_metadata = Column(
        JSONB,
        default={},
        nullable=False,
        name="ds_metadata",
    )

    # Avaliação
    nr_avaliacao = Column(
        Integer,
        nullable=True,
        name="nr_avaliacao",  # 1-5 estrelas
    )
    ds_feedback = Column(
        Text,
        nullable=True,
        name="ds_feedback",
    )

    # Timestamps
    dt_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )
    dt_ultima_mensagem = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_ultima_mensagem",
    )
    dt_fechamento = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_fechamento",
    )

    # Índices
    __table_args__ = (
        Index("idx_conversa_empresa_contato", "id_empresa", "id_contato"),
        Index("idx_conversa_empresa_aberta", "id_empresa", "st_aberta"),
        Index("idx_conversa_atendente", "id_atendente", "st_aberta"),
    )

    def __repr__(self):
        return f"<ConversaOmni(id={self.id_conversa}, contato={self.id_contato})>"


class MensagemOmni(Base):
    """
    Model ORM para mensagens omnichannel.

    Cada mensagem pertence a uma conversa e pode ser de diferentes tipos
    (texto, imagem, áudio, etc.) com suporte a status de entrega.

    Schema sincronizado com tb_mensagens_omni em 22/11/2025.
    """

    __tablename__ = "tb_mensagens_omni"

    # Identificadores
    id_mensagem = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_mensagem",
    )

    # Relacionamento com conversa
    id_conversa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_conversas_omni.id_conversa", ondelete="CASCADE"),
        nullable=False,
        name="id_conversa",
        index=True,
    )

    # ID externo (da plataforma: WhatsApp, Instagram, etc.)
    id_externo = Column(
        String(255),
        nullable=True,
        name="id_externo",
        index=True,
    )

    # Direção: entrada (do contato) ou saída (para o contato)
    st_entrada = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_entrada",  # True = do contato, False = para o contato
    )

    # Remetente
    nm_remetente = Column(
        String(100),
        nullable=True,
        name="nm_remetente",  # "bot", "atendente", nome do contato
    )

    # Tipo e conteúdo
    tp_mensagem = Column(
        SQLEnum(MensagemTipo, name="tp_mensagem_omni_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=MensagemTipo.TEXTO,
        nullable=False,
        name="tp_mensagem",
    )
    ds_conteudo = Column(
        Text,
        nullable=False,
        name="ds_conteudo",
    )
    ds_conteudo_original = Column(
        Text,
        nullable=True,
        name="ds_conteudo_original",  # Conteúdo original antes de formatação
    )

    # Mídia
    ds_url_midia = Column(
        String(500),
        nullable=True,
        name="ds_url_midia",
    )
    nm_tipo_midia = Column(
        String(100),
        nullable=True,
        name="nm_tipo_midia",  # MIME type
    )
    nr_tamanho_midia = Column(
        Integer,
        nullable=True,
        name="nr_tamanho_midia",  # bytes
    )
    ds_transcricao = Column(
        Text,
        nullable=True,
        name="ds_transcricao",  # Transcrição de áudio
    )

    # Status
    st_mensagem = Column(
        SQLEnum(MensagemStatus, name="st_mensagem_omni_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=MensagemStatus.PENDENTE,
        nullable=False,
        name="st_mensagem",
    )
    st_lida = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_lida",
    )

    # Metadados
    ds_metadata = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_metadata",
    )

    # Erro (se falhou)
    ds_erro = Column(
        Text,
        nullable=True,
        name="ds_erro",
    )

    # Timestamps
    dt_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_envio = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_envio",
    )
    dt_entrega = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_entrega",
    )
    dt_leitura = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_leitura",
    )

    # Índices (já existem no banco)
    __table_args__ = (
        Index("idx_mensagens_conversa", "id_conversa"),
        Index("idx_mensagens_externo", "id_externo"),
        Index("idx_mensagens_criacao", "dt_criacao"),
        Index("idx_mensagens_status", "st_mensagem"),
    )

    def __repr__(self):
        return f"<MensagemOmni(id={self.id_mensagem}, tipo={self.tp_mensagem})>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ConversaOmniBase(BaseModel):
    """Schema base para ConversaOmni."""
    model_config = ConfigDict(from_attributes=True)

    nm_titulo: Optional[str] = Field(None, max_length=255)
    ds_resumo: Optional[str] = None


class ConversaOmniCreate(ConversaOmniBase):
    """Schema para criar conversa."""
    id_contato: uuid.UUID
    id_canal: Optional[uuid.UUID] = None
    tp_canal: CanalTipo
    id_agente: Optional[uuid.UUID] = None
    st_bot_ativo: bool = True


class ConversaOmniUpdate(BaseModel):
    """Schema para atualizar conversa."""
    model_config = ConfigDict(from_attributes=True)

    nm_titulo: Optional[str] = None
    ds_resumo: Optional[str] = None
    st_aberta: Optional[bool] = None
    st_arquivada: Optional[bool] = None
    st_bot_ativo: Optional[bool] = None
    st_aguardando_humano: Optional[bool] = None
    st_favorito: Optional[bool] = None  # Adicionado em migration_024
    id_atendente: Optional[uuid.UUID] = None
    id_fila: Optional[uuid.UUID] = None
    id_agente: Optional[uuid.UUID] = None
    ds_contexto: Optional[Dict[str, Any]] = None
    ds_metadata: Optional[Dict[str, Any]] = None  # Adicionado em migration_024
    nr_avaliacao: Optional[int] = Field(None, ge=1, le=5)
    ds_feedback: Optional[str] = None


class ConversaOmniResponse(ConversaOmniBase):
    """Schema de resposta para ConversaOmni."""
    id_conversa: uuid.UUID
    id_empresa: uuid.UUID
    id_contato: uuid.UUID
    id_canal: Optional[uuid.UUID] = None
    tp_canal: CanalTipo
    st_aberta: bool
    st_arquivada: bool
    st_bot_ativo: bool
    st_aguardando_humano: bool
    st_favorito: bool = False  # Adicionado em migration_024
    id_atendente: Optional[uuid.UUID] = None
    id_fila: Optional[uuid.UUID] = None
    id_agente: Optional[uuid.UUID] = None
    nr_mensagens_total: int
    nr_mensagens_entrada: int
    nr_mensagens_saida: int
    nr_avaliacao: Optional[int] = None
    ds_metadata: Optional[Dict[str, Any]] = None  # Adicionado em migration_024
    dt_criacao: datetime
    dt_atualizacao: datetime
    dt_ultima_mensagem: Optional[datetime] = None
    dt_fechamento: Optional[datetime] = None


class MensagemOmniBase(BaseModel):
    """Schema base para MensagemOmni."""
    model_config = ConfigDict(from_attributes=True)

    tp_mensagem: MensagemTipo = MensagemTipo.TEXTO
    ds_conteudo: Optional[str] = None


class MensagemOmniCreate(MensagemOmniBase):
    """
    Schema para criar mensagem.

    Sincronizado com tb_mensagens_omni em 22/11/2025.
    """
    id_conversa: uuid.UUID
    st_entrada: bool
    nm_remetente: Optional[str] = None
    ds_url_midia: Optional[str] = None
    nm_tipo_midia: Optional[str] = None  # MIME type
    ds_metadata: Optional[Dict[str, Any]] = None


class MensagemOmniResponse(MensagemOmniBase):
    """
    Schema de resposta para MensagemOmni.

    Sincronizado com tb_mensagens_omni em 22/11/2025.
    """
    id_mensagem: uuid.UUID
    id_conversa: uuid.UUID
    id_externo: Optional[str] = None
    st_entrada: bool
    nm_remetente: Optional[str] = None
    ds_url_midia: Optional[str] = None
    nm_tipo_midia: Optional[str] = None
    nr_tamanho_midia: Optional[int] = None
    ds_transcricao: Optional[str] = None
    st_mensagem: MensagemStatus
    st_lida: bool = False
    ds_erro: Optional[str] = None
    dt_criacao: datetime
    dt_envio: Optional[datetime] = None
    dt_entrega: Optional[datetime] = None
    dt_leitura: Optional[datetime] = None


class ConversaOmniListResponse(BaseModel):
    """Schema para lista de conversas."""
    model_config = ConfigDict(from_attributes=True)

    items: list[ConversaOmniResponse]
    total: int
    page: int
    page_size: int


class MensagemOmniListResponse(BaseModel):
    """Schema para lista de mensagens."""
    model_config = ConfigDict(from_attributes=True)

    items: list[MensagemOmniResponse]
    total: int
    page: int
    page_size: int


class EnviarMensagemRequest(BaseModel):
    """Schema para enviar mensagem."""
    model_config = ConfigDict(from_attributes=True)

    id_conversa: Optional[uuid.UUID] = None
    id_contato: Optional[uuid.UUID] = None
    tp_canal: Optional[CanalTipo] = None
    tp_mensagem: MensagemTipo = MensagemTipo.TEXTO
    ds_conteudo: Optional[str] = None
    ds_url_midia: Optional[str] = None
    nm_template: Optional[str] = None
    ds_template_params: Optional[Dict[str, Any]] = None
