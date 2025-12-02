"""
ORM Model para Agendamentos
Estrutura básica da tabela tb_agendamentos
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    DECIMAL,
    Date,
)
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class AgendamentoORM(Base):
    """Agendamentos - Estrutura da tabela tb_agendamentos"""

    __tablename__ = "tb_agendamentos"
    __table_args__ = {'extend_existing': True}

    id_agendamento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("tb_pacientes.id_paciente"))
    id_profissional = Column(
        UUID(as_uuid=True), ForeignKey("tb_profissionais.id_profissional")
    )
    id_clinica = Column(UUID(as_uuid=True), ForeignKey("tb_clinicas.id_clinica"))
    id_procedimento = Column(
        UUID(as_uuid=True), ForeignKey("tb_procedimentos.id_procedimento")
    )
    dt_agendamento = Column(TIMESTAMP, nullable=False)
    nr_duracao_minutos = Column(Integer, nullable=False)
    ds_status = Column(String(50), default="agendado")
    ds_motivo = Column(String(255))
    ds_observacoes = Column(Text)
    st_confirmado = Column(Boolean, default=False)
    dt_confirmacao = Column(TIMESTAMP)
    nm_confirmado_por = Column(String(255))
    st_lembrete_enviado = Column(Boolean, default=False)
    dt_lembrete_enviado = Column(TIMESTAMP)
    ds_motivo_cancelamento = Column(Text)
    dt_cancelamento = Column(TIMESTAMP)
    nm_cancelado_por = Column(String(255))
    vl_valor = Column(DECIMAL(10, 2))
    ds_forma_pagamento = Column(String(50))
    st_pago = Column(Boolean, default=False)
    dt_pagamento = Column(TIMESTAMP)
    st_avaliado = Column(Boolean, default=False)
    dt_criacao = Column(TIMESTAMP, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
