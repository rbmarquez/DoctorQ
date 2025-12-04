"""
Modelos para Gestão de Estoque - UC043
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


class TbMovimentacaoEstoque(Base):
    """Tabela de movimentações de estoque"""
    __tablename__ = "tb_movimentacoes_estoque"

    id_movimentacao = Column(PG_UUID(as_uuid=True), primary_key=True)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_produto = Column(PG_UUID(as_uuid=True), ForeignKey("tb_produtos.id_produto"), nullable=False)
    id_user = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    id_agendamento = Column(PG_UUID(as_uuid=True), ForeignKey("tb_agendamentos.id_agendamento"))
    id_pedido = Column(PG_UUID(as_uuid=True), ForeignKey("tb_pedidos.id_pedido"))

    tp_movimentacao = Column(String(20), nullable=False)  # entrada, saida, ajuste, reserva, devolucao
    nr_quantidade = Column(Integer, nullable=False)
    nr_estoque_anterior = Column(Integer, nullable=False)
    nr_estoque_atual = Column(Integer, nullable=False)
    vl_custo_unitario = Column(Numeric(10, 2))
    ds_motivo = Column(Text)
    ds_lote = Column(String(50))
    dt_validade = Column(DateTime)

    dt_criacao = Column(DateTime, default=datetime.utcnow)


class TbReservaEstoque(Base):
    """Tabela de reservas de estoque"""
    __tablename__ = "tb_reservas_estoque"

    id_reserva = Column(PG_UUID(as_uuid=True), primary_key=True)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_produto = Column(PG_UUID(as_uuid=True), ForeignKey("tb_produtos.id_produto"), nullable=False)
    id_agendamento = Column(PG_UUID(as_uuid=True), ForeignKey("tb_agendamentos.id_agendamento"), nullable=False)
    nr_quantidade = Column(Integer, nullable=False)
    st_reserva = Column(String(20), default="ativa")  # ativa, confirmada, cancelada, expirada
    dt_expiracao = Column(DateTime)
    dt_criacao = Column(DateTime, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Pydantic Models

class MovimentacaoCreate(BaseModel):
    id_produto: UUID
    tp_movimentacao: str = Field(..., description="entrada|saida|ajuste|reserva|devolucao")
    nr_quantidade: int = Field(..., gt=0)
    vl_custo_unitario: Optional[float] = None
    ds_motivo: Optional[str] = None
    ds_lote: Optional[str] = None
    dt_validade: Optional[datetime] = None
    id_agendamento: Optional[UUID] = None
    id_pedido: Optional[UUID] = None


class MovimentacaoResponse(BaseModel):
    id_movimentacao: UUID
    id_empresa: UUID
    id_produto: UUID
    id_user: Optional[UUID]
    id_agendamento: Optional[UUID]
    id_pedido: Optional[UUID]
    tp_movimentacao: str
    nr_quantidade: int
    nr_estoque_anterior: int
    nr_estoque_atual: int
    vl_custo_unitario: Optional[float]
    ds_motivo: Optional[str]
    ds_lote: Optional[str]
    dt_validade: Optional[datetime]
    dt_criacao: datetime

    class Config:
        from_attributes = True


class MovimentacaoListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[MovimentacaoResponse]


class ReservaEstoqueCreate(BaseModel):
    id_produto: UUID
    id_agendamento: UUID
    nr_quantidade: int = Field(..., gt=0)


class ReservaEstoqueResponse(BaseModel):
    id_reserva: UUID
    id_empresa: UUID
    id_produto: UUID
    id_agendamento: UUID
    nr_quantidade: int
    st_reserva: str
    dt_expiracao: Optional[datetime]
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class EstoqueAlertaResponse(BaseModel):
    id_produto: UUID
    nm_produto: str
    nr_quantidade_estoque: int
    nr_estoque_minimo: int
    st_critico: bool


class EstoqueResumoResponse(BaseModel):
    id_produto: UUID
    nm_produto: str
    nr_quantidade_estoque: int
    nr_reservado: int
    nr_disponivel: int
    vl_estoque_total: float
    nr_entradas_mes: int
    nr_saidas_mes: int
