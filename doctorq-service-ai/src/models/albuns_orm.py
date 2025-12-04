"""
ORM Model para Albuns
Estrutura EXATA da tabela tb_albuns
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    TIMESTAMP,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class AlbumORM(Base):
    """Álbuns de fotos - Estrutura EXATA da tabela tb_albuns"""

    __tablename__ = "tb_albuns"
    __table_args__ = {'extend_existing': True}

    id_album = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"))
    nm_album = Column(String(255), nullable=False)
    ds_descricao = Column(Text)
    ds_tipo = Column(String(50), default="pessoal")
    ds_visibilidade = Column(String(20), default="privado")
    id_profissional = Column(UUID(as_uuid=True), ForeignKey("tb_profissionais.id_profissional"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("tb_pacientes.id_paciente"))
    id_procedimento = Column(UUID(as_uuid=True), ForeignKey("tb_procedimentos.id_procedimento"))
    ds_capa_url = Column(Text)
    nr_total_fotos = Column(Integer, default=0)
    nr_visualizacoes = Column(Integer, default=0)
    st_ativo = Column(Boolean, default=True)
    st_destaque = Column(Boolean, default=False)
    dt_criacao = Column(TIMESTAMP, default=datetime.utcnow)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class FotoORM(Base):
    """Fotos - Estrutura da tabela tb_fotos"""

    __tablename__ = "tb_fotos"
    __table_args__ = {'extend_existing': True}

    id_foto = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_album = Column(UUID(as_uuid=True), ForeignKey("tb_albuns.id_album"))
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    nm_foto = Column(String(255))
    ds_foto = Column(Text)
    ds_url = Column(Text, nullable=False)
    ds_tipo = Column(String(50))  # antes, depois, durante, resultado
    nr_ordem = Column(Integer, default=0)
    st_ativo = Column(Boolean, default=True)
    st_aprovado = Column(Boolean, default=True)
    nr_curtidas = Column(Integer, default=0)
    nr_visualizacoes = Column(Integer, default=0)
    dt_criacao = Column(TIMESTAMP, default=datetime.utcnow)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
