"""
Modelo para relacionamento Profissional-Clínica (N:N)
"""
from datetime import datetime
from uuid import uuid4, UUID

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


class TbProfissionalClinica(Base):
    """Tabela de relacionamento N:N entre profissionais e clínicas"""
    __tablename__ = "tb_profissionais_clinicas"
    __table_args__ = {'extend_existing': True}

    id_profissional_clinica = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_profissional = Column(PG_UUID(as_uuid=True), ForeignKey("tb_profissionais.id_profissional"), nullable=False)
    id_clinica = Column(PG_UUID(as_uuid=True), ForeignKey("tb_clinicas.id_clinica"), nullable=False)
    dt_vinculo = Column(DateTime, default=datetime.utcnow, nullable=False)
    st_ativo = Column(Boolean, default=True, nullable=False)
    ds_observacoes = Column(Text)
