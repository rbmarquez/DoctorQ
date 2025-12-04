from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .base import Base


class TbCurriculos(Base):
    """Model para currículos profissionais"""
    __tablename__ = "tb_curriculos"

    # Primary Key
    id_curriculo = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=True)

    # Dados Pessoais
    nm_completo = Column(String(255), nullable=False)
    ds_email = Column(String(255), nullable=False)
    nr_telefone = Column(String(20), nullable=False)
    ds_linkedin = Column(String(500), nullable=True)
    ds_portfolio = Column(String(500), nullable=True)
    ds_foto_url = Column(String(500), nullable=True)

    # Localização
    nm_cidade = Column(String(100), nullable=False)
    nm_estado = Column(String(2), nullable=False)
    ds_cep = Column(String(10), nullable=True)

    # Perfil Profissional
    nm_cargo_desejado = Column(String(255), nullable=False)
    ds_resumo_profissional = Column(Text, nullable=False)
    nm_nivel_experiencia = Column(String(50), nullable=False)  # estagiario, junior, pleno, senior, especialista
    nr_anos_experiencia = Column(Integer, nullable=False, default=0)

    # Habilidades (JSON array)
    habilidades = Column(JSON, nullable=False, default=list)
    idiomas = Column(JSON, nullable=True, default=list)  # [{"nm_idioma": "Inglês", "nm_nivel": "avancado"}]

    # Experiências e Formação (JSON arrays)
    experiencias = Column(JSON, nullable=True, default=list)
    formacoes = Column(JSON, nullable=True, default=list)
    certificacoes = Column(JSON, nullable=True, default=list)

    # Preferências de Trabalho (JSON arrays)
    tipos_contrato_aceitos = Column(JSON, nullable=False, default=list)
    regimes_trabalho_aceitos = Column(JSON, nullable=False, default=list)
    vl_pretensao_salarial_min = Column(DECIMAL(10, 2), nullable=True)
    vl_pretensao_salarial_max = Column(DECIMAL(10, 2), nullable=True)
    fg_disponibilidade_viagem = Column(Boolean, default=False)
    fg_disponibilidade_mudanca = Column(Boolean, default=False)

    # Status
    ds_status = Column(String(20), nullable=False, default="ativo")  # ativo, inativo, pausado
    fg_visivel_recrutadores = Column(Boolean, default=True)

    # Metadados
    dt_criacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    dt_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    nr_visualizacoes = Column(Integer, default=0)
    nr_candidaturas = Column(Integer, default=0)

    # Relationships
    usuario = relationship("User", back_populates="curriculo", foreign_keys=[id_usuario])
    candidaturas = relationship("TbCandidaturas", back_populates="curriculo", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Curriculo {self.nm_completo} - {self.nm_cargo_desejado}>"


# Adicionar relationship no TbUsers (se ainda não existir)
# Em src/models/user.py adicionar:
# curriculo = relationship("TbCurriculos", back_populates="usuario", uselist=False)
