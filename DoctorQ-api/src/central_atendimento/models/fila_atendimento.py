# src/central_atendimento/models/fila_atendimento.py
"""
Models para sistema de filas e roteamento de atendimento.

Implementa:
- Filas de atendimento por departamento/skill
- Roteamento inteligente baseado em regras
- Distribuição de carga entre atendentes
- SLA e métricas de tempo de resposta
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
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from src.models.base import Base


class AtendimentoStatus(str, Enum):
    """Status do item na fila."""
    AGUARDANDO = "aguardando"
    EM_ATENDIMENTO = "em_atendimento"
    PAUSADO = "pausado"
    TRANSFERIDO = "transferido"
    FINALIZADO = "finalizado"
    ABANDONADO = "abandonado"


class FilaAtendimento(Base):
    """
    Model ORM para filas de atendimento.

    Cada fila representa um departamento ou skill que recebe
    conversas para atendimento humano.
    """

    __tablename__ = "tb_filas_atendimento"

    # Identificadores
    id_fila = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_fila",
    )

    # Multi-tenant
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        name="id_empresa",
        index=True,
    )

    # Informações da fila
    nm_fila = Column(
        String(100),
        nullable=False,
        name="nm_fila",
    )
    ds_descricao = Column(
        Text,
        nullable=True,
        name="ds_descricao",
    )
    nm_cor = Column(
        String(7),
        default="#3B82F6",
        nullable=False,
        name="nm_cor",  # Cor para identificação visual
    )

    # Status
    st_ativa = Column(
        Boolean,
        default=True,
        nullable=False,
        name="st_ativa",
    )
    st_padrao = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_padrao",  # Fila padrão para novos atendimentos
    )

    # Configuração de SLA
    nr_sla_primeira_resposta = Column(
        Integer,
        default=300,
        nullable=False,
        name="nr_sla_primeira_resposta",  # Em segundos (5 min padrão)
    )
    nr_sla_resposta = Column(
        Integer,
        default=600,
        nullable=False,
        name="nr_sla_resposta",  # Em segundos (10 min padrão)
    )
    nr_sla_resolucao = Column(
        Integer,
        default=86400,
        nullable=False,
        name="nr_sla_resolucao",  # Em segundos (24h padrão)
    )

    # Configuração de distribuição
    nm_modo_distribuicao = Column(
        String(30),
        default="round_robin",
        nullable=False,
        name="nm_modo_distribuicao",  # round_robin, menos_ocupado, skill_based
    )
    nr_limite_simultaneo = Column(
        Integer,
        default=5,
        nullable=False,
        name="nr_limite_simultaneo",  # Atendimentos simultâneos por atendente
    )

    # Horário de funcionamento
    ds_horario_funcionamento = Column(
        JSONB,
        default={
            "segunda": {"inicio": "08:00", "fim": "18:00", "ativo": True},
            "terca": {"inicio": "08:00", "fim": "18:00", "ativo": True},
            "quarta": {"inicio": "08:00", "fim": "18:00", "ativo": True},
            "quinta": {"inicio": "08:00", "fim": "18:00", "ativo": True},
            "sexta": {"inicio": "08:00", "fim": "18:00", "ativo": True},
            "sabado": {"inicio": "08:00", "fim": "12:00", "ativo": False},
            "domingo": {"ativo": False},
        },
        nullable=False,
        name="ds_horario_funcionamento",
    )

    # Mensagens automáticas
    ds_mensagem_boas_vindas = Column(
        Text,
        nullable=True,
        name="ds_mensagem_boas_vindas",
    )
    ds_mensagem_fora_horario = Column(
        Text,
        nullable=True,
        name="ds_mensagem_fora_horario",
    )
    ds_mensagem_aguardando = Column(
        Text,
        default="Aguarde um momento, em breve um atendente irá lhe ajudar.",
        nullable=True,
        name="ds_mensagem_aguardando",
    )

    # Regras de roteamento
    ds_regras_roteamento = Column(
        JSONB,
        default=[],
        nullable=False,
        name="ds_regras_roteamento",  # Lista de regras
    )

    # Métricas
    nr_atendimentos_hoje = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_atendimentos_hoje",
    )
    nr_aguardando = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_aguardando",
    )
    nr_tempo_espera_medio = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_tempo_espera_medio",  # Em segundos
    )
    nr_tempo_atendimento_medio = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_tempo_atendimento_medio",  # Em segundos
    )

    # Atendentes da fila (relacionamento M:N gerenciado via tabela associativa)
    ds_atendentes = Column(
        ARRAY(UUID(as_uuid=True)),
        default=[],
        nullable=False,
        name="ds_atendentes",  # Lista de IDs de atendentes
    )

    # Prioridade
    nr_prioridade = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_prioridade",  # Maior = mais prioritário
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

    # Índices
    __table_args__ = (
        Index("idx_fila_empresa_ativa", "id_empresa", "st_ativa"),
    )

    def __repr__(self):
        return f"<FilaAtendimento(id={self.id_fila}, nome='{self.nm_fila}')>"


class AtendimentoItem(Base):
    """
    Model ORM para itens na fila de atendimento.

    Cada item representa uma conversa que está aguardando
    ou sendo atendida por um humano.

    Schema sincronizado com tb_atendimento_items em 22/11/2025.
    """

    __tablename__ = "tb_atendimento_items"

    # Identificadores
    id_item = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_item",
    )

    # Multi-tenant
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        name="id_empresa",
        index=True,
    )

    # Relacionamentos
    id_fila = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_filas_atendimento.id_fila", ondelete="CASCADE"),
        nullable=False,
        name="id_fila",
        index=True,
    )
    id_conversa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_conversas_omni.id_conversa", ondelete="CASCADE"),
        nullable=False,
        name="id_conversa",
        index=True,
    )
    id_contato = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_contatos_omni.id_contato", ondelete="CASCADE"),
        nullable=False,
        name="id_contato",
    )

    # Atendente
    id_atendente = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="SET NULL"),
        nullable=True,
        name="id_atendente",
        index=True,
    )
    id_atendente_anterior = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="SET NULL"),
        nullable=True,
        name="id_atendente_anterior",
    )

    # Status
    st_atendimento = Column(
        SQLEnum(AtendimentoStatus, name="st_atendimento_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=AtendimentoStatus.AGUARDANDO,
        nullable=False,
        name="st_atendimento",
    )

    # Prioridade e Posição
    nr_prioridade = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_prioridade",
    )
    nr_posicao_fila = Column(
        Integer,
        nullable=True,
        name="nr_posicao_fila",
    )
    nr_protocolo = Column(
        String(20),
        nullable=True,
        name="nr_protocolo",
    )

    # Motivo (ds_motivo no banco, não nm_motivo)
    ds_motivo = Column(
        Text,
        nullable=True,
        name="ds_motivo",
    )
    ds_motivo_transferencia = Column(
        Text,
        nullable=True,
        name="ds_motivo_transferencia",
    )

    # SLA
    dt_sla_primeira_resposta = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_sla_primeira_resposta",
    )
    dt_sla_resolucao = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_sla_resolucao",
    )
    st_sla_estourado = Column(
        Boolean,
        default=False,
        nullable=True,
        name="st_sla_estourado",
    )

    # Timestamps
    dt_entrada_fila = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_entrada_fila",
    )
    dt_inicio_atendimento = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_inicio_atendimento",
    )
    dt_fim_atendimento = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_fim_atendimento",
    )
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

    # Métricas de tempo
    nr_tempo_espera = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_tempo_espera",
    )
    nr_tempo_atendimento = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_tempo_atendimento",
    )

    def __repr__(self):
        return f"<AtendimentoItem(id={self.id_item}, status={self.st_atendimento})>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class FilaAtendimentoBase(BaseModel):
    """Schema base para FilaAtendimento."""
    model_config = ConfigDict(from_attributes=True)

    nm_fila: str = Field(..., max_length=100)
    ds_descricao: Optional[str] = None
    nm_cor: str = Field("#3B82F6", max_length=7)


class FilaAtendimentoCreate(FilaAtendimentoBase):
    """Schema para criar fila."""
    st_padrao: bool = False
    nr_sla_primeira_resposta: int = 300
    nr_sla_resposta: int = 600
    nr_sla_resolucao: int = 86400
    nm_modo_distribuicao: str = "round_robin"
    nr_limite_simultaneo: int = 5
    ds_horario_funcionamento: Optional[Dict[str, Any]] = None
    ds_mensagem_boas_vindas: Optional[str] = None
    ds_mensagem_fora_horario: Optional[str] = None
    ds_mensagem_aguardando: Optional[str] = None
    ds_atendentes: Optional[List[uuid.UUID]] = None
    nr_prioridade: int = 0


class FilaAtendimentoUpdate(BaseModel):
    """Schema para atualizar fila."""
    model_config = ConfigDict(from_attributes=True)

    nm_fila: Optional[str] = None
    ds_descricao: Optional[str] = None
    nm_cor: Optional[str] = None
    st_ativa: Optional[bool] = None
    st_padrao: Optional[bool] = None
    nr_sla_primeira_resposta: Optional[int] = None
    nr_sla_resposta: Optional[int] = None
    nr_sla_resolucao: Optional[int] = None
    nm_modo_distribuicao: Optional[str] = None
    nr_limite_simultaneo: Optional[int] = None
    ds_horario_funcionamento: Optional[Dict[str, Any]] = None
    ds_mensagem_boas_vindas: Optional[str] = None
    ds_mensagem_fora_horario: Optional[str] = None
    ds_mensagem_aguardando: Optional[str] = None
    ds_atendentes: Optional[List[uuid.UUID]] = None
    nr_prioridade: Optional[int] = None


class FilaAtendimentoResponse(FilaAtendimentoBase):
    """Schema de resposta para FilaAtendimento."""
    id_fila: uuid.UUID
    id_empresa: uuid.UUID
    st_ativa: bool
    st_padrao: bool
    nr_sla_primeira_resposta: int
    nr_sla_resposta: int
    nr_sla_resolucao: int
    nm_modo_distribuicao: str
    nr_limite_simultaneo: int
    nr_atendimentos_hoje: int
    nr_aguardando: int
    nr_tempo_espera_medio: int
    nr_tempo_atendimento_medio: int
    ds_atendentes: List[uuid.UUID]
    nr_prioridade: int
    dt_criacao: datetime
    dt_atualizacao: datetime


class AtendimentoItemBase(BaseModel):
    """Schema base para AtendimentoItem."""
    model_config = ConfigDict(from_attributes=True)

    ds_motivo: Optional[str] = None


class AtendimentoItemCreate(AtendimentoItemBase):
    """Schema para criar item na fila."""
    id_fila: uuid.UUID
    id_conversa: uuid.UUID
    id_contato: uuid.UUID
    nr_prioridade: int = 0


class AtendimentoItemUpdate(BaseModel):
    """Schema para atualizar item na fila."""
    model_config = ConfigDict(from_attributes=True)

    id_atendente: Optional[uuid.UUID] = None
    st_atendimento: Optional[AtendimentoStatus] = None
    nr_prioridade: Optional[int] = None
    ds_motivo_transferencia: Optional[str] = None


class AtendimentoItemResponse(AtendimentoItemBase):
    """Schema de resposta para AtendimentoItem."""
    id_item: uuid.UUID
    id_fila: uuid.UUID
    id_conversa: uuid.UUID
    id_contato: uuid.UUID
    id_empresa: uuid.UUID
    id_atendente: Optional[uuid.UUID] = None
    id_atendente_anterior: Optional[uuid.UUID] = None
    st_atendimento: AtendimentoStatus
    nr_prioridade: Optional[int] = 0
    nr_posicao_fila: Optional[int] = None
    nr_protocolo: Optional[str] = None
    ds_motivo_transferencia: Optional[str] = None
    dt_sla_primeira_resposta: Optional[datetime] = None
    dt_sla_resolucao: Optional[datetime] = None
    st_sla_estourado: Optional[bool] = False
    dt_entrada_fila: datetime
    dt_inicio_atendimento: Optional[datetime] = None
    dt_fim_atendimento: Optional[datetime] = None
    nr_tempo_espera: Optional[int] = 0
    nr_tempo_atendimento: Optional[int] = 0


class FilaAtendimentoListResponse(BaseModel):
    """Schema para lista de filas."""
    model_config = ConfigDict(from_attributes=True)

    items: list[FilaAtendimentoResponse]
    total: int


class AtendimentoItemListResponse(BaseModel):
    """Schema para lista de itens na fila."""
    model_config = ConfigDict(from_attributes=True)

    items: list[AtendimentoItemResponse]
    total: int
    page: int
    page_size: int


class TransferirAtendimentoRequest(BaseModel):
    """Schema para transferir atendimento."""
    model_config = ConfigDict(from_attributes=True)

    id_fila_destino: Optional[uuid.UUID] = None
    id_atendente_destino: Optional[uuid.UUID] = None
    ds_motivo: Optional[str] = None


class FilaMetricas(BaseModel):
    """Schema para métricas da fila."""
    model_config = ConfigDict(from_attributes=True)

    id_fila: uuid.UUID
    nm_fila: str
    nr_aguardando: int
    nr_em_atendimento: int
    nr_atendimentos_hoje: int
    nr_tempo_espera_medio: int
    nr_tempo_atendimento_medio: int
    nr_sla_estourados_hoje: int
    taxa_resolucao_primeiro_contato: float
    nr_avaliacao_media: float
