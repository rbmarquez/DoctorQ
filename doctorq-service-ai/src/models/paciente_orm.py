"""
ORM Model para Pacientes
Estrutura básica da tabela tb_pacientes
"""

import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    Date,
)
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class PacienteORM(Base):
    """Pacientes - Estrutura da tabela tb_pacientes"""

    __tablename__ = "tb_pacientes"
    __table_args__ = {'extend_existing': True}

    id_paciente = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    id_clinica = Column(UUID(as_uuid=True), ForeignKey("tb_clinicas.id_clinica"))
    nm_paciente = Column(String(255), nullable=False)
    dt_nascimento = Column(Date)
    nr_cpf = Column(String(14))
    nr_rg = Column(String(20))
    nm_genero = Column(String(20))
    ds_email = Column(String(255))
    nr_telefone = Column(String(20))
    nr_whatsapp = Column(String(20))
    ds_endereco = Column(String(255))
    nr_numero = Column(String(20))
    ds_complemento = Column(String(100))
    nm_bairro = Column(String(100))
    nm_cidade = Column(String(100))
    nm_estado = Column(String(2))
    nr_cep = Column(String(10))
    ds_tipo_sanguineo = Column(String(5))
    ds_alergias = Column(Text)
    ds_medicamentos_uso = Column(Text)
    ds_condicoes_medicas = Column(Text)
    ds_cirurgias_previas = Column(Text)
    ds_observacoes = Column(Text)
    st_possui_convenio = Column(Boolean, default=False)
    nm_convenio = Column(String(100))
    nr_carteirinha = Column(String(50))
    ds_foto = Column(Text)
    st_ativo = Column(Boolean, default=True)
    dt_primeira_consulta = Column(TIMESTAMP)
    dt_ultima_consulta = Column(TIMESTAMP)
    nr_total_consultas = Column(Integer, default=0)
    dt_criacao = Column(TIMESTAMP, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
