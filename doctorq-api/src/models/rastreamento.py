"""
Modelos para Sistema de Rastreamento de Pedidos - UC054
Integração com Correios, Transportadoras e outras APIs
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


# ========== SQLAlchemy Models ==========

class TbRastreamentoEvento(Base):
    """
    Tabela de eventos de rastreamento externos
    Armazena eventos brutos das APIs de transportadoras
    """
    __tablename__ = "tb_rastreamento_eventos"

    id_evento = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_pedido = Column(PG_UUID(as_uuid=True), ForeignKey("tb_pedidos.id_pedido"), nullable=False)

    # Identificação da transportadora
    ds_transportadora = Column(String(100), nullable=False)  # correios, jadlog, total_express, etc.
    ds_codigo_rastreio = Column(String(100), nullable=False)

    # Dados do evento
    ds_status = Column(String(100), nullable=False)  # Status da transportadora
    ds_status_mapeado = Column(String(50))  # Status mapeado para nosso sistema
    ds_descricao = Column(Text, nullable=False)

    # Localização do evento
    ds_cidade = Column(String(100))
    ds_estado = Column(String(2))
    ds_pais = Column(String(3), default="BRA")
    ds_local_completo = Column(String(255))

    # Timestamps
    dt_evento = Column(DateTime, nullable=False)  # Data/hora do evento na transportadora
    dt_captura = Column(DateTime, default=datetime.utcnow)  # Data/hora que capturamos o evento

    # Metadados
    ds_dados_brutos = Column(JSON)  # Resposta completa da API para debug

    # Auditoria
    dt_criacao = Column(DateTime, default=datetime.utcnow)


# ========== Pydantic Models ==========

class RastreamentoEventoResponse(BaseModel):
    """Evento de rastreamento (resposta)"""
    ds_status: str
    ds_descricao: str
    dt_evento: datetime
    ds_cidade: Optional[str] = None
    ds_estado: Optional[str] = None
    ds_local_completo: Optional[str] = None

    class Config:
        from_attributes = True


class RastreamentoTimelineResponse(BaseModel):
    """Timeline completa de rastreamento"""
    id_pedido: UUID
    nr_pedido: str
    ds_codigo_rastreio: Optional[str]
    ds_transportadora: Optional[str]
    ds_status_atual: str
    dt_entrega_estimada: Optional[datetime]

    # Datas importantes
    dt_pedido: datetime
    dt_confirmacao: Optional[datetime]
    dt_pagamento: Optional[datetime]
    dt_envio: Optional[datetime]
    dt_entrega: Optional[datetime]

    # Eventos de rastreamento
    eventos: List[RastreamentoEventoResponse]

    # Histórico de status internos
    historico_status: List[dict]


class RastreamentoConsulta(BaseModel):
    """Request para consultar rastreamento"""
    ds_codigo_rastreio: str = Field(..., description="Código de rastreio da transportadora")
    ds_transportadora: Optional[str] = Field(None, description="correios | jadlog | total_express | etc")


class RastreamentoAtualizacaoManual(BaseModel):
    """Request para atualização manual de status"""
    ds_status: str = Field(..., description="Status do pedido")
    ds_observacao: Optional[str] = Field(None, description="Observação sobre a atualização")
    dt_entrega_estimada: Optional[datetime] = Field(None, description="Nova data estimada de entrega")


class RastreamentoResumo(BaseModel):
    """Resumo de rastreamento para listagem"""
    id_pedido: UUID
    nr_pedido: str
    ds_codigo_rastreio: Optional[str]
    ds_status_atual: str
    dt_ultimo_evento: Optional[datetime]
    ds_ultimo_evento: Optional[str]
    dt_entrega_estimada: Optional[datetime]
    fg_atrasado: bool = False
    fg_alerta: bool = False


class RastreamentoEstatisticas(BaseModel):
    """Estatísticas de rastreamento"""
    total_pedidos: int
    total_em_transito: int
    total_entregues: int
    total_atrasados: int
    total_com_problema: int
    tempo_medio_entrega_dias: Optional[float]
    taxa_entrega_no_prazo: Optional[float]


class WebhookRastreamento(BaseModel):
    """Webhook de transportadora (entrada)"""
    ds_transportadora: str
    ds_codigo_rastreio: str
    ds_status: str
    ds_descricao: str
    dt_evento: datetime
    ds_cidade: Optional[str] = None
    ds_estado: Optional[str] = None
    ds_dados_adicionais: Optional[dict] = None
