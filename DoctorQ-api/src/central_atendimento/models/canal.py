# src/central_atendimento/models/canal.py
"""
Model para canais de comunicação omnichannel.

Suporta:
- WhatsApp Business API (Meta Cloud API - Oficial)
- Instagram Direct
- Facebook Messenger
- Email
- SMS
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

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
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.models.base import Base


class CanalTipo(str, Enum):
    """Tipos de canais de comunicação."""
    WHATSAPP = "whatsapp"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    EMAIL = "email"
    SMS = "sms"
    WEBCHAT = "webchat"


class CanalStatus(str, Enum):
    """Status do canal."""
    ATIVO = "ativo"
    INATIVO = "inativo"
    CONFIGURANDO = "configurando"
    ERRO = "erro"
    SUSPENSO = "suspenso"


class Canal(Base):
    """
    Model ORM para canais de comunicação.

    Cada canal representa uma integração com uma plataforma de comunicação
    (WhatsApp, Instagram, etc.) configurada para uma empresa.

    Schema sincronizado com tb_canais_omni em 22/11/2025.
    """

    __tablename__ = "tb_canais_omni"

    # Identificadores
    id_canal = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_canal",
    )

    # Relacionamento com empresa (multi-tenant)
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        name="id_empresa",
        index=True,
    )

    # Informações do canal
    nm_canal = Column(
        String(100),
        nullable=False,
        name="nm_canal",
    )
    tp_canal = Column(
        SQLEnum(CanalTipo, name="tp_canal_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        name="tp_canal",
    )
    ds_descricao = Column(
        Text,
        nullable=True,
        name="ds_descricao",
    )

    # Status
    st_canal = Column(
        SQLEnum(CanalStatus, name="st_canal_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=CanalStatus.CONFIGURANDO,
        nullable=False,
        name="st_canal",
    )
    st_ativo = Column(
        Boolean,
        default=True,
        nullable=False,
        name="st_ativo",
    )

    # WhatsApp específico
    id_telefone_whatsapp = Column(
        String(20),
        nullable=True,
        name="id_telefone_whatsapp",
    )

    # Instagram específico
    id_instagram = Column(
        String(100),
        nullable=True,
        name="id_instagram",
    )

    # Facebook específico
    id_facebook_page = Column(
        String(100),
        nullable=True,
        name="id_facebook_page",
    )

    # Email específico
    nm_email = Column(
        String(255),
        nullable=True,
        name="nm_email",
    )

    # Credenciais e configurações
    ds_credenciais = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_credenciais",
    )
    id_credencial = Column(
        UUID(as_uuid=True),
        nullable=True,
        name="id_credencial",
    )
    ds_configuracoes = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_configuracoes",
    )

    # Webhook
    ds_webhook_url = Column(
        String(500),
        nullable=True,
        name="ds_webhook_url",
    )
    ds_webhook_secret = Column(
        String(255),
        nullable=True,
        name="ds_webhook_secret",
    )

    # Métricas
    nr_mensagens_enviadas = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_mensagens_enviadas",
    )
    nr_mensagens_recebidas = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_mensagens_recebidas",
    )
    nr_conversas_ativas = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_conversas_ativas",
    )
    dt_ultima_sincronizacao = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_ultima_sincronizacao",
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
    dt_desativacao = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_desativacao",
    )

    def __repr__(self):
        return f"<Canal(id={self.id_canal}, nome='{self.nm_canal}', tipo={self.tp_canal})>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class CanalBase(BaseModel):
    """Schema base para Canal."""
    model_config = ConfigDict(from_attributes=True)

    nm_canal: str = Field(..., max_length=100, description="Nome do canal")
    tp_canal: CanalTipo = Field(..., description="Tipo do canal")
    ds_descricao: Optional[str] = Field(None, description="Descrição do canal")


class CanalCreate(CanalBase):
    """Schema para criar canal."""
    ds_credenciais: Optional[Dict[str, Any]] = Field(default_factory=dict)
    ds_configuracoes: Optional[Dict[str, Any]] = Field(default_factory=dict)

    # WhatsApp
    id_telefone_whatsapp: Optional[str] = None

    # Instagram
    id_instagram: Optional[str] = None

    # Facebook
    id_facebook_page: Optional[str] = None

    # Email
    nm_email: Optional[str] = None


class CanalUpdate(BaseModel):
    """Schema para atualizar canal."""
    model_config = ConfigDict(from_attributes=True)

    nm_canal: Optional[str] = Field(None, max_length=100)
    ds_descricao: Optional[str] = None
    st_canal: Optional[CanalStatus] = None
    st_ativo: Optional[bool] = None
    ds_credenciais: Optional[Dict[str, Any]] = None
    ds_configuracoes: Optional[Dict[str, Any]] = None


class CanalResponse(CanalBase):
    """Schema de resposta para Canal."""
    id_canal: uuid.UUID
    id_empresa: uuid.UUID
    st_canal: CanalStatus
    st_ativo: bool
    nr_mensagens_enviadas: Optional[int] = 0
    nr_mensagens_recebidas: Optional[int] = 0
    nr_conversas_ativas: Optional[int] = 0
    dt_ultima_sincronizacao: Optional[datetime] = None
    dt_criacao: datetime
    dt_atualizacao: datetime


class CanalListResponse(BaseModel):
    """Schema para lista de canais."""
    model_config = ConfigDict(from_attributes=True)

    items: list[CanalResponse]
    total: int
    page: int
    page_size: int
