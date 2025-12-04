"""
Modelos para Pacientes - UC030
"""
from datetime import datetime, date
from typing import Optional
from uuid import uuid4, UUID

from pydantic import BaseModel, Field, EmailStr, validator
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


class TbPaciente(Base):
    """Tabela de pacientes"""
    __tablename__ = "tb_pacientes"
    __table_args__ = {'extend_existing': True}

    id_paciente = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_user = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    id_clinica = Column(PG_UUID(as_uuid=True), ForeignKey("tb_clinicas.id_clinica"))
    # NOTE: id_profissional mantida temporariamente para compatibilidade com banco
    # Remover após migração que drop a coluna do banco (2025-11-10)
    id_profissional = Column(PG_UUID(as_uuid=True), ForeignKey("tb_profissionais.id_profissional"))
    nm_paciente = Column(String(255), nullable=False)
    dt_nascimento = Column(Date)
    nr_cpf = Column(String(14), unique=True)
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
    dt_primeira_consulta = Column(DateTime)
    dt_ultima_consulta = Column(DateTime)
    nr_total_consultas = Column(Integer, default=0)
    dt_criacao = Column(DateTime, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PacienteCreate(BaseModel):
    id_user: Optional[UUID] = None
    id_clinica: Optional[UUID] = None  # Opcional: auto-detectado pelo backend
    id_profissional: Optional[UUID] = None  # Opcional: auto-detectado pelo backend (2025-11-11)
    nm_paciente: str = Field(..., min_length=3, max_length=255)
    dt_nascimento: Optional[date] = None
    nr_cpf: str = Field(..., min_length=11, max_length=14)
    nr_rg: Optional[str] = None
    nm_genero: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    nr_whatsapp: Optional[str] = None
    ds_endereco: Optional[str] = None
    nr_numero: Optional[str] = None
    ds_complemento: Optional[str] = None
    nm_bairro: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nr_cep: Optional[str] = None
    ds_tipo_sanguineo: Optional[str] = None
    ds_alergias: Optional[str] = None
    ds_medicamentos_uso: Optional[str] = None
    ds_condicoes_medicas: Optional[str] = None
    ds_cirurgias_previas: Optional[str] = None
    ds_observacoes: Optional[str] = None
    st_possui_convenio: bool = False
    nm_convenio: Optional[str] = None
    nr_carteirinha: Optional[str] = None

    @validator('nr_cpf')
    def validar_cpf(cls, v):
        if v:
            return ''.join(filter(str.isdigit, v))
        return v


class PacienteUpdate(BaseModel):
    id_clinica: Optional[UUID] = None
    id_profissional: Optional[UUID] = None  # Opcional (2025-11-11)
    nm_paciente: Optional[str] = None
    dt_nascimento: Optional[date] = None
    nr_cpf: Optional[str] = None
    nr_rg: Optional[str] = None
    nm_genero: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    nr_whatsapp: Optional[str] = None
    ds_endereco: Optional[str] = None
    nr_numero: Optional[str] = None
    ds_complemento: Optional[str] = None
    nm_bairro: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nr_cep: Optional[str] = None
    ds_tipo_sanguineo: Optional[str] = None
    ds_alergias: Optional[str] = None
    ds_medicamentos_uso: Optional[str] = None
    ds_condicoes_medicas: Optional[str] = None
    ds_cirurgias_previas: Optional[str] = None
    ds_observacoes: Optional[str] = None
    st_possui_convenio: Optional[bool] = None
    nm_convenio: Optional[str] = None
    nr_carteirinha: Optional[str] = None
    st_ativo: Optional[bool] = None


class PacienteResponse(BaseModel):
    id_paciente: UUID
    id_user: Optional[UUID]
    id_clinica: Optional[UUID]
    # NOTE: id_profissional removed - simplified architecture (2025-11-10)
    # id_profissional: Optional[UUID]
    nm_paciente: str
    dt_nascimento: Optional[date]
    nr_cpf: str
    nr_rg: Optional[str]
    nm_genero: Optional[str]
    ds_email: Optional[str]
    nr_telefone: Optional[str]
    nr_whatsapp: Optional[str]
    ds_endereco: Optional[str]
    nr_numero: Optional[str]
    ds_complemento: Optional[str]
    nm_bairro: Optional[str]
    nm_cidade: Optional[str]
    nm_estado: Optional[str]
    nr_cep: Optional[str]
    ds_tipo_sanguineo: Optional[str]
    ds_alergias: Optional[str]
    ds_medicamentos_uso: Optional[str]
    ds_condicoes_medicas: Optional[str]
    ds_cirurgias_previas: Optional[str]
    ds_observacoes: Optional[str]
    st_possui_convenio: bool
    nm_convenio: Optional[str]
    nr_carteirinha: Optional[str]
    ds_foto: Optional[str]
    st_ativo: bool
    dt_primeira_consulta: Optional[datetime]
    dt_ultima_consulta: Optional[datetime]
    nr_total_consultas: int
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class PacienteListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[PacienteResponse]
