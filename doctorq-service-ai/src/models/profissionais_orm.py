"""
ORM Model para Profissionais
Estrutura EXATA da tabela tb_profissionais
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
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.dialects import postgresql

from src.models.base import Base


class ProfissionalORM(Base):
    """Profissionais de Saúde - Estrutura EXATA da tabela tb_profissionais"""

    __tablename__ = "tb_profissionais"
    __table_args__ = {'extend_existing': True}

    id_profissional = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    id_clinica = Column(UUID(as_uuid=True), ForeignKey("tb_clinicas.id_clinica"))
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"))
    nm_profissional = Column(String(255), nullable=False)
    ds_biografia = Column(Text)
    ds_especialidades = Column(Text, nullable=False, default="[]")  # JSON array for SQLite compatibility
    nr_registro_profissional = Column(String(50))
    ds_formacao = Column(Text)
    nr_anos_experiencia = Column(Integer)
    ds_email = Column(String(255))
    nr_telefone = Column(String(20))
    nr_whatsapp = Column(String(20))
    ds_foto = Column(Text)
    ds_horarios_atendimento = Column(JSONB)
    nr_tempo_consulta = Column(Integer, default=60)
    st_aceita_online = Column(Boolean, default=True)
    ds_procedimentos_realizados = Column(Text, default="[]")  # JSON array for SQLite compatibility
    fg_autonomo = Column(Boolean, default=False)
    st_ativo = Column(Boolean, default=True)
    st_verificado = Column(Boolean, default=False)
    nr_avaliacao_media = Column(DECIMAL(3, 2), default=Decimal("0.0"))
    nr_total_avaliacoes = Column(Integer, default=0)
    nr_total_atendimentos = Column(Integer, default=0)
    dt_criacao = Column(TIMESTAMP, default=datetime.utcnow)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
