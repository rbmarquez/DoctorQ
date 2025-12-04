"""
ORM Model para Vínculo Profissional-Clínica (N:N)
Estrutura da tabela tb_profissionais_clinicas
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    Text,
    Boolean,
    TIMESTAMP,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class ProfissionalClinicaORM(Base):
    """
    Tabela associativa N:N entre Profissionais e Clínicas.
    Permite que profissionais trabalhem em múltiplas clínicas.
    """

    __tablename__ = "tb_profissionais_clinicas"
    __table_args__ = {'extend_existing': True}

    id_profissional_clinica = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    id_profissional = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_profissionais.id_profissional", ondelete="CASCADE"),
        nullable=False,
    )
    id_clinica = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_clinicas.id_clinica", ondelete="CASCADE"),
        nullable=False,
    )
    dt_vinculo = Column(TIMESTAMP, nullable=False, default=datetime.now)
    dt_desvinculo = Column(TIMESTAMP, nullable=True)
    st_ativo = Column(Boolean, nullable=False, default=True)
    ds_observacoes = Column(Text, nullable=True)
    dt_criacao = Column(TIMESTAMP, nullable=False, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, nullable=True, onupdate=datetime.now)
