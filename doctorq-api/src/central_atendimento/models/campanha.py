# src/central_atendimento/models/campanha.py
"""
Models para campanhas de prospecção proativa e marketing.

Suporta campanhas de:
- Prospecção de leads (cold outreach)
- Reengajamento de leads inativos
- Marketing promocional
- Lembretes e follow-ups automáticos
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
from src.central_atendimento.models.canal import CanalTipo


class CampanhaStatus(str, Enum):
    """Status da campanha."""
    RASCUNHO = "rascunho"
    AGENDADA = "agendada"
    EM_EXECUCAO = "em_execucao"
    PAUSADA = "pausada"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class CampanhaTipo(str, Enum):
    """Tipo de campanha."""
    PROSPECCAO = "prospeccao"  # Prospecção de novos leads
    REENGAJAMENTO = "reengajamento"  # Reativar leads inativos
    MARKETING = "marketing"  # Campanhas promocionais
    LEMBRETE = "lembrete"  # Lembretes de agendamento
    FOLLOWUP = "followup"  # Follow-up pós-atendimento
    PESQUISA = "pesquisa"  # Pesquisa de satisfação


class Campanha(Base):
    """
    Model ORM para campanhas de prospecção e marketing.
    """

    __tablename__ = "tb_campanhas"

    # Identificadores
    id_campanha = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_campanha",
    )

    # Multi-tenant
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        name="id_empresa",
        index=True,
    )

    # Informações básicas
    nm_campanha = Column(
        String(255),
        nullable=False,
        name="nm_campanha",
    )
    ds_descricao = Column(
        Text,
        nullable=True,
        name="ds_descricao",
    )
    tp_campanha = Column(
        SQLEnum(CampanhaTipo, name="tp_campanha_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        name="tp_campanha",
    )

    # Status
    st_campanha = Column(
        SQLEnum(CampanhaStatus, name="st_campanha_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=CampanhaStatus.RASCUNHO,
        nullable=False,
        name="st_campanha",
    )

    # Canal e configuração
    tp_canal = Column(
        SQLEnum(CanalTipo, name="tp_canal_enum", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        name="tp_canal",
    )
    id_canal = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_canais_omni.id_canal", ondelete="SET NULL"),
        nullable=True,
        name="id_canal",
    )

    # Mensagem da campanha
    nm_template = Column(
        String(100),
        nullable=True,
        name="nm_template",  # Para WhatsApp templates
    )
    ds_mensagem = Column(
        Text,
        nullable=False,
        name="ds_mensagem",
    )
    ds_variaveis = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_variaveis",  # Variáveis dinâmicas: {{nome}}, {{empresa}}
    )

    # Segmentação
    ds_filtros = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_filtros",  # Filtros de segmentação de contatos
    )

    # Agendamento (alinhado com schema do banco)
    dt_agendamento = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_agendamento",
    )
    dt_inicio = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_inicio",
    )
    dt_fim = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_fim",
    )

    # Limites
    nr_limite_diario = Column(
        Integer,
        default=100,
        nullable=True,
        name="nr_limite_diario",
    )
    nr_intervalo_segundos = Column(
        Integer,
        default=60,
        nullable=True,
        name="nr_intervalo_segundos",  # Intervalo entre envios
    )

    # Métricas (alinhado com schema do banco)
    nr_total_destinatarios = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_total_destinatarios",
    )
    nr_enviados = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_enviados",
    )
    nr_entregues = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_entregues",
    )
    nr_lidos = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_lidos",
    )
    nr_respondidos = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_respondidos",
    )
    nr_convertidos = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_convertidos",
    )
    nr_erros = Column(
        Integer,
        default=0,
        nullable=True,
        name="nr_erros",
    )

    # Taxas
    pc_taxa_abertura = Column(
        Integer,  # Usar Numeric daria problema, usando Integer
        default=0,
        nullable=True,
        name="pc_taxa_abertura",
    )
    pc_taxa_resposta = Column(
        Integer,
        default=0,
        nullable=True,
        name="pc_taxa_resposta",
    )
    pc_taxa_conversao = Column(
        Integer,
        default=0,
        nullable=True,
        name="pc_taxa_conversao",
    )

    # Responsável
    id_criador = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="SET NULL"),
        nullable=True,
        name="id_criador",
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
        nullable=True,
        default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    # Campos adicionados pela migration 024
    nr_enviados_hoje = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_enviados_hoje",
    )
    dt_ultimo_reset_diario = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_ultimo_reset_diario",
    )

    # Alias para compatibilidade (propriedades virtuais)
    @property
    def dt_inicio_agendado(self):
        return self.dt_agendamento

    @property
    def dt_fim_agendado(self):
        return self.dt_fim

    @property
    def nr_destinatarios_total(self):
        return self.nr_total_destinatarios

    # Índices
    __table_args__ = (
        Index("idx_campanhas_empresa", "id_empresa"),
        Index("idx_campanhas_status", "st_campanha"),
        Index("idx_campanhas_criacao", "dt_criacao"),
    )

    def __repr__(self):
        return f"<Campanha(id={self.id_campanha}, nome={self.nm_campanha}, status={self.st_campanha})>"


class CampanhaDestinatario(Base):
    """
    Model ORM para destinatários de campanhas.

    Rastreia cada contato incluído em uma campanha e seu status de envio.
    """

    __tablename__ = "tb_campanha_destinatarios"

    # Identificadores
    id_destinatario = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_destinatario",
    )

    # Relacionamentos
    id_campanha = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_campanhas.id_campanha", ondelete="CASCADE"),
        nullable=False,
        name="id_campanha",
        index=True,
    )
    id_contato = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_contatos_omni.id_contato", ondelete="CASCADE"),
        nullable=False,
        name="id_contato",
        index=True,
    )

    # Status
    st_enviado = Column(
        Boolean,
        default=False,
        nullable=True,
        name="st_enviado",
    )
    st_entregue = Column(
        Boolean,
        default=False,
        nullable=True,
        name="st_entregue",
    )
    st_lido = Column(
        Boolean,
        default=False,
        nullable=True,
        name="st_lido",
    )
    st_respondido = Column(
        Boolean,
        default=False,
        nullable=True,
        name="st_respondido",
    )
    st_convertido = Column(
        Boolean,
        default=False,
        nullable=True,
        name="st_convertido",
    )
    st_erro = Column(
        Boolean,
        default=False,
        nullable=True,
        name="st_erro",
    )

    # Detalhes de erro
    ds_erro = Column(
        Text,
        nullable=True,
        name="ds_erro",
    )

    # ID da mensagem externa (do provedor WhatsApp/Instagram/etc)
    id_mensagem_externo = Column(
        String(255),
        nullable=True,
        name="id_mensagem_externo",
    )

    # Variáveis personalizadas
    ds_variaveis = Column(
        JSONB,
        default={},
        nullable=True,
        name="ds_variaveis",
    )

    # Timestamps
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
    dt_resposta = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_resposta",
    )
    dt_conversao = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_conversao",
    )
    dt_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )

    # Constraint
    __table_args__ = (
        Index("idx_campanha_dest_campanha", "id_campanha"),
        Index("idx_campanha_dest_contato", "id_contato"),
        Index("idx_campanha_dest_enviado", "st_enviado"),
    )

    def __repr__(self):
        return f"<CampanhaDestinatario(campanha={self.id_campanha}, contato={self.id_contato})>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class CampanhaBase(BaseModel):
    """Schema base para Campanha."""
    model_config = ConfigDict(from_attributes=True)

    nm_campanha: str = Field(..., max_length=255)
    ds_descricao: Optional[str] = None
    tp_campanha: CampanhaTipo
    tp_canal: CanalTipo


class CampanhaCreate(CampanhaBase):
    """Schema para criar campanha."""
    id_canal: Optional[uuid.UUID] = None
    nm_template: Optional[str] = None
    ds_mensagem: str  # Obrigatório no banco
    ds_variaveis: Optional[Dict[str, Any]] = None
    ds_filtros: Optional[Dict[str, Any]] = None
    dt_agendamento: Optional[datetime] = None
    nr_limite_diario: int = 100
    nr_intervalo_segundos: int = 60


class CampanhaUpdate(BaseModel):
    """Schema para atualizar campanha."""
    model_config = ConfigDict(from_attributes=True)

    nm_campanha: Optional[str] = None
    ds_descricao: Optional[str] = None
    st_campanha: Optional[CampanhaStatus] = None
    nm_template: Optional[str] = None
    ds_mensagem: Optional[str] = None
    ds_variaveis: Optional[Dict[str, Any]] = None
    ds_filtros: Optional[Dict[str, Any]] = None
    dt_agendamento: Optional[datetime] = None
    nr_limite_diario: Optional[int] = None
    nr_intervalo_segundos: Optional[int] = None


class CampanhaResponse(CampanhaBase):
    """Schema de resposta para Campanha."""
    id_campanha: uuid.UUID
    id_empresa: uuid.UUID
    st_campanha: CampanhaStatus
    id_canal: Optional[uuid.UUID] = None
    nm_template: Optional[str] = None
    ds_mensagem: Optional[str] = None
    nr_total_destinatarios: int = 0
    nr_enviados: int = 0
    nr_entregues: int = 0
    nr_lidos: int = 0
    nr_respondidos: int = 0
    nr_convertidos: int = 0
    nr_erros: int = 0
    dt_agendamento: Optional[datetime] = None
    dt_inicio: Optional[datetime] = None
    dt_fim: Optional[datetime] = None
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None


class CampanhaListResponse(BaseModel):
    """Schema para lista de campanhas."""
    model_config = ConfigDict(from_attributes=True)

    items: list[CampanhaResponse]
    total: int
    page: int
    page_size: int


class CampanhaMetricas(BaseModel):
    """Schema para métricas detalhadas da campanha."""
    model_config = ConfigDict(from_attributes=True)

    id_campanha: uuid.UUID
    nr_total_destinatarios: int = 0
    nr_enviados: int = 0
    nr_entregues: int = 0
    nr_lidos: int = 0
    nr_respondidos: int = 0
    nr_convertidos: int = 0
    nr_erros: int = 0
    pc_taxa_abertura: float = 0  # Taxa de abertura
    pc_taxa_resposta: float = 0  # Taxa de resposta
    pc_taxa_conversao: float = 0  # Taxa de conversão


class AdicionarDestinatariosRequest(BaseModel):
    """Schema para adicionar destinatários à campanha."""
    model_config = ConfigDict(from_attributes=True)

    ids_contatos: List[uuid.UUID]
    ds_variaveis: Optional[Dict[str, Dict[str, Any]]] = None  # {id_contato: {variavel: valor}}
