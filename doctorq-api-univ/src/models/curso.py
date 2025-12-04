"""
Models de Curso, Aula e Matricula
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer,
    Numeric, String, Text
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from src.config import Base


class Curso(Base):
    """Tabela de cursos"""
    __tablename__ = "tb_cursos"

    id_curso = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_empresa = Column(UUID(as_uuid=True), nullable=True, index=True)

    titulo = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)
    descricao_curta = Column(String(500), nullable=True)

    categoria = Column(String(100), nullable=True)
    nivel = Column(String(50), default="iniciante")  # iniciante, intermediario, avancado

    instrutor_id = Column(UUID(as_uuid=True), nullable=True)
    instrutor_nome = Column(String(255), nullable=True)

    carga_horaria = Column(Integer, default=0)
    preco = Column(Numeric(10, 2), default=0)
    preco_promocional = Column(Numeric(10, 2), nullable=True)

    thumbnail_url = Column(String(500), nullable=True)
    video_preview_url = Column(String(500), nullable=True)

    tags = Column(ARRAY(String), default=[])
    requisitos = Column(ARRAY(String), default=[])
    objetivos = Column(ARRAY(String), default=[])

    total_aulas = Column(Integer, default=0)
    total_alunos = Column(Integer, default=0)
    avaliacao_media = Column(Float, default=0)

    fg_ativo = Column(Boolean, default=True)
    fg_destaque = Column(Boolean, default=False)
    fg_publicado = Column(Boolean, default=False)

    dt_criacao = Column(DateTime, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, onupdate=datetime.utcnow)
    dt_publicacao = Column(DateTime, nullable=True)


class Aula(Base):
    """Tabela de aulas"""
    __tablename__ = "tb_aulas"

    id_aula = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_curso = Column(UUID(as_uuid=True), ForeignKey("tb_cursos.id_curso"), nullable=False, index=True)
    id_modulo = Column(UUID(as_uuid=True), nullable=True)

    titulo = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)
    ordem = Column(Integer, default=0)

    tipo = Column(String(50), default="video")  # video, texto, quiz, live
    duracao_minutos = Column(Integer, default=0)

    video_id = Column(String(255), nullable=True)
    video_url = Column(String(500), nullable=True)
    video_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    video_processing_progress = Column(Integer, default=0)
    video_metadata = Column(JSONB, default={})

    conteudo_texto = Column(Text, nullable=True)
    materiais = Column(JSONB, default=[])

    fg_ativo = Column(Boolean, default=True)
    fg_gratuita = Column(Boolean, default=False)

    dt_criacao = Column(DateTime, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, onupdate=datetime.utcnow)


class Matricula(Base):
    """Tabela de matriculas"""
    __tablename__ = "tb_matriculas"

    id_matricula = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), nullable=False, index=True)
    id_curso = Column(UUID(as_uuid=True), ForeignKey("tb_cursos.id_curso"), nullable=False, index=True)

    status = Column(String(50), default="ativo")  # ativo, concluido, cancelado, expirado
    progresso_percentual = Column(Float, default=0)

    aulas_concluidas = Column(ARRAY(UUID(as_uuid=True)), default=[])
    ultima_aula_id = Column(UUID(as_uuid=True), nullable=True)

    nota_avaliacao = Column(Float, nullable=True)
    comentario_avaliacao = Column(Text, nullable=True)

    dt_matricula = Column(DateTime, default=datetime.utcnow)
    dt_conclusao = Column(DateTime, nullable=True)
    dt_expiracao = Column(DateTime, nullable=True)

    fg_ativo = Column(Boolean, default=True)


class CursoResponse(BaseModel):
    """Schema de resposta para curso"""
    id_curso: uuid.UUID
    titulo: str
    descricao: Optional[str] = None
    instrutor_nome: Optional[str] = None
    carga_horaria: int
    preco: Decimal
    thumbnail_url: Optional[str] = None
    total_aulas: int
    avaliacao_media: float
    fg_ativo: bool

    class Config:
        from_attributes = True
