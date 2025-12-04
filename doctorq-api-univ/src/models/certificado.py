"""
Model de Certificado
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID

from src.config import Base


class Certificado(Base):
    """Tabela de certificados emitidos"""
    __tablename__ = "tb_certificados"

    id_certificado = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), nullable=False, index=True)
    id_curso = Column(UUID(as_uuid=True), nullable=False, index=True)

    codigo_verificacao = Column(String(50), unique=True, nullable=False, index=True)
    tipo_certificacao = Column(String(50), default="bronze")  # bronze, silver, gold, platinum

    nota_final = Column(Float, nullable=False)
    carga_horaria = Column(Integer, nullable=False)

    acreditacoes = Column(ARRAY(String), default=[])
    metadata_extra = Column(JSONB, default={})

    hash_blockchain = Column(String(255), nullable=True)
    tx_hash = Column(String(255), nullable=True)

    dt_emissao = Column(DateTime, default=datetime.utcnow)
    dt_validade = Column(DateTime, nullable=True)

    fg_ativo = Column(Boolean, default=True)
    fg_verificado = Column(Boolean, default=False)


class CertificadoResponse(BaseModel):
    """Schema de resposta para certificado"""
    id_certificado: uuid.UUID
    id_usuario: uuid.UUID
    id_curso: uuid.UUID
    codigo_verificacao: str
    tipo_certificacao: str
    nota_final: float
    carga_horaria: int
    acreditacoes: Optional[list[str]] = []
    hash_blockchain: Optional[str] = None
    tx_hash: Optional[str] = None
    dt_emissao: datetime
    dt_validade: Optional[datetime] = None
    fg_ativo: bool = True
    fg_verificado: bool = False

    class Config:
        from_attributes = True
