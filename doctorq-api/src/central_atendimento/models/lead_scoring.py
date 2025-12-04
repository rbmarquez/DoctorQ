# src/central_atendimento/models/lead_scoring.py
"""
Models para lead scoring com IA.

O sistema de lead scoring avalia automaticamente cada contato
baseado em comportamento, engajamento e dados demográficos.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import (
    Column,
    DateTime,
    String,
    Text,
    Boolean,
    Integer,
    Float,
    ForeignKey,
    func,
    Enum as SQLEnum,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from src.models.base import Base


class LeadScore(Base):
    """
    Model ORM para score de leads.

    O score é calculado automaticamente baseado em:
    - Comportamento (respostas, tempo de resposta, engajamento)
    - Perfil (dados demográficos, setor, cargo)
    - Histórico (conversas anteriores, compras)
    - Intenção (palavras-chave, perguntas sobre preço)
    """

    __tablename__ = "tb_lead_scores"

    # Identificadores
    id_score = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_score",
    )

    # Relacionamento com contato (1:1)
    id_contato = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_contatos_omni.id_contato", ondelete="CASCADE"),
        nullable=False,
        name="id_contato",
        unique=True,
        index=True,
    )

    # Multi-tenant
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        name="id_empresa",
        index=True,
    )

    # Score total (0-100)
    nr_score_total = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_score_total",
    )

    # Scores por dimensão (0-100 cada)
    nr_score_comportamento = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_score_comportamento",
    )
    nr_score_perfil = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_score_perfil",
    )
    nr_score_engajamento = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_score_engajamento",
    )
    nr_score_intencao = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_score_intencao",
    )

    # Temperatura (0-100): quão "quente" está o lead
    nr_temperatura = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_temperatura",
    )

    # Pesos utilizados no cálculo
    ds_pesos = Column(
        JSONB,
        default={
            "comportamento": 0.25,
            "perfil": 0.20,
            "engajamento": 0.30,
            "intencao": 0.25,
        },
        nullable=False,
        name="ds_pesos",
    )

    # Fatores positivos detectados
    ds_fatores_positivos = Column(
        JSONB,
        default=[],
        nullable=False,
        name="ds_fatores_positivos",  # ["respondeu_rapido", "perguntou_preco"]
    )

    # Fatores negativos detectados
    ds_fatores_negativos = Column(
        JSONB,
        default=[],
        nullable=False,
        name="ds_fatores_negativos",  # ["sem_resposta_3_dias", "pediu_desconto_alto"]
    )

    # Métricas de comportamento
    nr_tempo_resposta_medio = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_tempo_resposta_medio",  # Em segundos
    )
    nr_mensagens_enviadas = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_mensagens_enviadas",
    )
    nr_mensagens_recebidas = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_mensagens_recebidas",
    )
    nr_conversas_total = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_conversas_total",
    )

    # Intenção de compra detectada
    st_intencao_compra = Column(
        Boolean,
        default=False,
        nullable=False,
        name="st_intencao_compra",
    )
    nr_nivel_intencao = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_nivel_intencao",  # 1-5
    )
    ds_sinais_intencao = Column(
        JSONB,
        default=[],
        nullable=False,
        name="ds_sinais_intencao",  # ["perguntou_preco", "pediu_agenda"]
    )

    # Análise de sentimento (última mensagem)
    nm_sentimento = Column(
        String(20),
        default="neutro",
        nullable=False,
        name="nm_sentimento",  # positivo, neutro, negativo
    )
    nr_confianca_sentimento = Column(
        Float,
        default=0.0,
        nullable=False,
        name="nr_confianca_sentimento",  # 0.0-1.0
    )

    # Previsão de conversão
    nr_probabilidade_conversao = Column(
        Float,
        default=0.0,
        nullable=False,
        name="nr_probabilidade_conversao",  # 0.0-1.0
    )
    vl_ticket_estimado = Column(
        Integer,
        default=0,
        nullable=False,
        name="vl_ticket_estimado",  # Em centavos
    )

    # Recomendação de ação
    nm_acao_recomendada = Column(
        String(50),
        nullable=True,
        name="nm_acao_recomendada",  # "ligar_agora", "enviar_proposta", "aguardar"
    )
    ds_motivo_acao = Column(
        Text,
        nullable=True,
        name="ds_motivo_acao",
    )

    # Modelo/versão usado no cálculo
    nm_modelo_scoring = Column(
        String(50),
        default="v1.0",
        nullable=False,
        name="nm_modelo_scoring",
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
    dt_ultimo_calculo = Column(
        DateTime(timezone=True),
        nullable=True,
        name="dt_ultimo_calculo",
    )

    # Índices
    __table_args__ = (
        Index("idx_score_empresa_total", "id_empresa", "nr_score_total"),
        Index("idx_score_empresa_temp", "id_empresa", "nr_temperatura"),
    )

    def __repr__(self):
        return f"<LeadScore(contato={self.id_contato}, score={self.nr_score_total})>"


class LeadScoreHistorico(Base):
    """
    Model ORM para histórico de scores.

    Mantém o histórico de mudanças no score para análise temporal.
    """

    __tablename__ = "tb_lead_score_historico"

    # Identificadores
    id_historico = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_historico",
    )

    # Relacionamento
    id_score = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_lead_scores.id_score", ondelete="CASCADE"),
        nullable=False,
        name="id_score",
        index=True,
    )
    id_contato = Column(
        UUID(as_uuid=True),
        nullable=False,
        name="id_contato",
    )

    # Scores no momento
    nr_score_total = Column(
        Integer,
        nullable=False,
        name="nr_score_total",
    )
    nr_temperatura = Column(
        Integer,
        nullable=False,
        name="nr_temperatura",
    )

    # Motivo da mudança
    nm_evento = Column(
        String(100),
        nullable=False,
        name="nm_evento",  # "nova_mensagem", "resposta_rapida", "sem_resposta"
    )
    ds_detalhes = Column(
        JSONB,
        default={},
        nullable=False,
        name="ds_detalhes",
    )

    # Variação
    nr_variacao = Column(
        Integer,
        default=0,
        nullable=False,
        name="nr_variacao",  # Pode ser positivo ou negativo
    )

    # Timestamp
    dt_registro = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_registro",
    )

    # Índice para busca temporal
    __table_args__ = (
        Index("idx_hist_score_data", "id_score", "dt_registro"),
    )

    def __repr__(self):
        return f"<LeadScoreHistorico(score={self.id_score}, evento='{self.nm_evento}')>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class LeadScoreBase(BaseModel):
    """Schema base para LeadScore."""
    model_config = ConfigDict(from_attributes=True)

    nr_score_total: int = Field(0, ge=0, le=100)
    nr_temperatura: int = Field(0, ge=0, le=100)


class LeadScoreResponse(LeadScoreBase):
    """Schema de resposta para LeadScore."""
    id_score: uuid.UUID
    id_contato: uuid.UUID
    id_empresa: uuid.UUID
    nr_score_comportamento: int
    nr_score_perfil: int
    nr_score_engajamento: int
    nr_score_intencao: int
    ds_fatores_positivos: List[str]
    ds_fatores_negativos: List[str]
    st_intencao_compra: bool
    nr_nivel_intencao: int
    ds_sinais_intencao: List[str]
    nm_sentimento: str
    nr_probabilidade_conversao: float
    vl_ticket_estimado: int
    nm_acao_recomendada: Optional[str] = None
    ds_motivo_acao: Optional[str] = None
    dt_criacao: datetime
    dt_atualizacao: datetime
    dt_ultimo_calculo: Optional[datetime] = None


class LeadScoreHistoricoResponse(BaseModel):
    """Schema de resposta para histórico de score."""
    model_config = ConfigDict(from_attributes=True)

    id_historico: uuid.UUID
    id_contato: uuid.UUID
    nr_score_total: int
    nr_temperatura: int
    nm_evento: str
    ds_detalhes: Dict[str, Any]
    nr_variacao: int
    dt_registro: datetime


class LeadScoreAnalise(BaseModel):
    """Schema para análise completa de lead scoring."""
    model_config = ConfigDict(from_attributes=True)

    score_atual: LeadScoreResponse
    historico_recente: List[LeadScoreHistoricoResponse]
    tendencia: str  # "subindo", "estavel", "descendo"
    variacao_7_dias: int
    variacao_30_dias: int
    ranking_empresa: int  # Posição entre os leads da empresa


class LeadScoreConfigUpdate(BaseModel):
    """Schema para atualizar configuração de pesos."""
    model_config = ConfigDict(from_attributes=True)

    peso_comportamento: Optional[float] = Field(None, ge=0, le=1)
    peso_perfil: Optional[float] = Field(None, ge=0, le=1)
    peso_engajamento: Optional[float] = Field(None, ge=0, le=1)
    peso_intencao: Optional[float] = Field(None, ge=0, le=1)
