"""
Modelos para Sistema de Lembretes
UC027 - Enviar Lembretes de Agendamento
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


# ========== SQLAlchemy Models ==========

class TbLembrete(Base):
    """
    Tabela de lembretes enviados
    Controla lembretes automáticos de agendamentos
    """
    __tablename__ = "tb_lembretes"

    id_lembrete = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_agendamento = Column(PG_UUID(as_uuid=True), ForeignKey("tb_agendamentos.id_agendamento"), nullable=False)
    id_paciente = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Tipo de lembrete
    tp_lembrete = Column(String(20), nullable=False, comment="24h | 2h | custom")

    # Canais de envio
    fg_email = Column(Boolean, default=False, comment="Enviado por email?")
    fg_whatsapp = Column(Boolean, default=False, comment="Enviado por WhatsApp?")
    fg_sms = Column(Boolean, default=False, comment="Enviado por SMS?")
    fg_push = Column(Boolean, default=False, comment="Enviado por push notification?")

    # Timestamps de envio
    dt_email = Column(DateTime, nullable=True, comment="Data envio email")
    dt_whatsapp = Column(DateTime, nullable=True, comment="Data envio WhatsApp")
    dt_sms = Column(DateTime, nullable=True, comment="Data envio SMS")
    dt_push = Column(DateTime, nullable=True, comment="Data envio push")

    # Status
    st_lembrete = Column(String(20), nullable=False, default="pendente", comment="pendente | enviado | erro | cancelado")
    ds_erro = Column(String(500), nullable=True, comment="Mensagem de erro se houver")
    nr_tentativas = Column(Integer, nullable=False, default=0, comment="Número de tentativas")

    # Auditoria
    dt_agendado = Column(DateTime, nullable=False, comment="Data/hora agendada para envio")
    dt_enviado = Column(DateTime, nullable=True, comment="Data/hora real do envio")
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# ========== Pydantic Models ==========

class LembreteCreate(BaseModel):
    """Criar lembrete"""
    id_agendamento: UUID
    id_paciente: UUID
    tp_lembrete: str = Field(..., description="24h | 2h | custom")
    dt_agendado: datetime = Field(..., description="Data/hora agendada para envio")
    canais: List[str] = Field(default=["email", "whatsapp"], description="Canais: email, whatsapp, sms, push")


class LembreteResponse(BaseModel):
    """Resposta com lembrete"""
    id_lembrete: UUID
    id_empresa: UUID
    id_agendamento: UUID
    id_paciente: UUID
    tp_lembrete: str
    fg_email: bool
    fg_whatsapp: bool
    fg_sms: bool
    fg_push: bool
    dt_email: Optional[datetime]
    dt_whatsapp: Optional[datetime]
    dt_sms: Optional[datetime]
    dt_push: Optional[datetime]
    st_lembrete: str
    ds_erro: Optional[str]
    nr_tentativas: int
    dt_agendado: datetime
    dt_enviado: Optional[datetime]
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class LembreteListResponse(BaseModel):
    """Lista paginada de lembretes"""
    total: int
    page: int
    size: int
    items: List[LembreteResponse]


class LembreteEnvioResponse(BaseModel):
    """Resposta após envio de lembrete"""
    id_lembrete: UUID
    tp_lembrete: str
    canais_enviados: List[str]
    canais_erro: List[str]
    st_lembrete: str
    dt_enviado: Optional[datetime]
