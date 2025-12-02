from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .base import Base


class TbVagas(Base):
    """Model para vagas de emprego"""
    __tablename__ = "tb_vagas"

    # Primary Key
    id_vaga = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_criador = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Informações Básicas
    nm_cargo = Column(String(255), nullable=False)
    ds_resumo = Column(Text, nullable=False)
    ds_responsabilidades = Column(Text, nullable=False)
    ds_requisitos = Column(Text, nullable=False)
    ds_diferenciais = Column(Text, nullable=True)

    # Classificação
    nm_area = Column(String(100), nullable=False)  # Estética Facial, Corporal, etc.
    nm_nivel = Column(String(50), nullable=False)  # estagiario, junior, pleno, senior, especialista
    nm_tipo_contrato = Column(String(50), nullable=False)  # clt, pj, estagio, temporario, freelance
    nm_regime_trabalho = Column(String(50), nullable=False)  # presencial, remoto, hibrido

    # Localização
    nm_cidade = Column(String(100), nullable=False)
    nm_estado = Column(String(2), nullable=False)
    ds_cep = Column(String(10), nullable=True)
    fg_aceita_remoto = Column(Boolean, default=False)

    # Remuneração
    vl_salario_min = Column(DECIMAL(10, 2), nullable=True)
    vl_salario_max = Column(DECIMAL(10, 2), nullable=True)
    fg_salario_a_combinar = Column(Boolean, default=False)
    ds_beneficios = Column(JSON, nullable=True, default=list)  # ["VR", "VT", "Plano de Saúde"]

    # Requisitos (JSON arrays)
    habilidades_requeridas = Column(JSON, nullable=False, default=list)
    habilidades_desejaveis = Column(JSON, nullable=True, default=list)
    certificacoes_necessarias = Column(JSON, nullable=True, default=list)
    nr_anos_experiencia_min = Column(Integer, nullable=False, default=0)

    # Status e Visibilidade
    ds_status = Column(String(20), nullable=False, default="aberta")  # aberta, pausada, fechada, expirada
    fg_destaque = Column(Boolean, default=False)
    dt_expiracao = Column(Date, nullable=True)

    # Estatísticas
    nr_vagas = Column(Integer, nullable=False, default=1)
    nr_candidatos = Column(Integer, default=0)
    nr_visualizacoes = Column(Integer, default=0)

    # Empresa Info (Denormalizada para performance)
    nm_empresa = Column(String(255), nullable=True)
    ds_logo_empresa = Column(String(500), nullable=True)

    # Metadados
    dt_criacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    dt_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dt_publicacao = Column(DateTime, nullable=True)

    # Relationships
    empresa = relationship("Empresa", back_populates="vagas", foreign_keys=[id_empresa])
    criador = relationship("User", back_populates="vagas_criadas", foreign_keys=[id_criador])
    candidaturas = relationship("TbCandidaturas", back_populates="vaga", cascade="all, delete-orphan")
    favoritos = relationship("TbFavoritos", back_populates="vaga", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Vaga {self.nm_cargo} - {self.nm_empresa}>"


# Adicionar relationships nos modelos relacionados:
# Em src/models/empresa.py adicionar:
# vagas = relationship("TbVagas", back_populates="empresa")

# Em src/models/user.py adicionar:
# vagas_criadas = relationship("TbVagas", back_populates="criador", foreign_keys="TbVagas.id_criador")
