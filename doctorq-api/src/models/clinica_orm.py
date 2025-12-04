"""
ORM Model para Clínicas
Estrutura da tabela tb_clinicas
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
    ARRAY,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from src.models.base import Base


class ClinicaORM(Base):
    """Clínicas de Estética - Estrutura da tabela tb_clinicas"""

    __tablename__ = "tb_clinicas"
    __table_args__ = {'extend_existing': True}

    id_clinica = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"))
    nm_clinica = Column(String(255), nullable=False)
    ds_clinica = Column(Text)
    nr_cnpj = Column(String(18))
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
    ds_latitude = Column(DECIMAL(10, 8))
    ds_longitude = Column(DECIMAL(11, 8))
    nm_responsavel = Column(String(255))
    nr_cnes = Column(String(20))
    ds_especialidades = Column(ARRAY(Text))
    ds_foto_principal = Column(Text)
    ds_fotos_galeria = Column(ARRAY(Text))
    ds_horario_funcionamento = Column(JSONB)
    nr_tempo_medio_consulta = Column(Integer, default=60)
    st_aceita_convenio = Column(Boolean, default=False)
    ds_convenios = Column(ARRAY(Text))
    st_ativo = Column(Boolean, default=True)
    st_verificada = Column(Boolean, default=False)
    nr_avaliacao_media = Column(DECIMAL(3, 2), default=Decimal("0.0"))
    nr_total_avaliacoes = Column(Integer, default=0)
    dt_criacao = Column(TIMESTAMP, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
