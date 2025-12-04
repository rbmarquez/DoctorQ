from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, DECIMAL, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .base import Base


class TbCandidaturas(Base):
    """Model para candidaturas em vagas"""
    __tablename__ = "tb_candidaturas"

    # Primary Key
    id_candidatura = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_vaga = Column(UUID(as_uuid=True), ForeignKey("tb_vagas.id_vaga"), nullable=False)
    id_curriculo = Column(UUID(as_uuid=True), ForeignKey("tb_curriculos.id_curriculo"), nullable=False)
    id_candidato = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Carta de Apresentação
    ds_carta_apresentacao = Column(Text, nullable=False)

    # Status do Processo Seletivo
    ds_status = Column(String(50), nullable=False, default="enviada")
    # Valores: enviada, em_analise, entrevista_agendada, aprovado, reprovado, desistiu

    # Match Score (calculado por IA)
    nr_match_score = Column(Integer, nullable=True)  # 0-100

    # Datas do Processo
    dt_candidatura = Column(DateTime, default=datetime.utcnow, nullable=False)
    dt_visualizacao_empresa = Column(DateTime, nullable=True)
    dt_entrevista = Column(DateTime, nullable=True)
    dt_finalizacao = Column(DateTime, nullable=True)

    # Feedback
    ds_feedback_empresa = Column(Text, nullable=True)
    ds_feedback_candidato = Column(Text, nullable=True)
    nr_avaliacao_candidato = Column(Integer, nullable=True)  # 1-5 estrelas

    # Informações Denormalizadas (para performance em listagens)
    nm_candidato = Column(String(255), nullable=True)
    ds_email_candidato = Column(String(255), nullable=True)
    nr_telefone_candidato = Column(String(20), nullable=True)
    nm_cargo_vaga = Column(String(255), nullable=True)
    nm_empresa = Column(String(255), nullable=True)

    # Metadados
    dt_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    vaga = relationship("TbVagas", back_populates="candidaturas", foreign_keys=[id_vaga])
    curriculo = relationship("TbCurriculos", back_populates="candidaturas", foreign_keys=[id_curriculo])
    candidato = relationship("User", back_populates="candidaturas", foreign_keys=[id_candidato])

    def __repr__(self):
        return f"<Candidatura {self.nm_candidato} → {self.nm_cargo_vaga} ({self.ds_status})>"


# Adicionar relationships nos modelos relacionados:
# Em src/models/user.py adicionar:
# candidaturas = relationship("TbCandidaturas", back_populates="candidato", foreign_keys="TbCandidaturas.id_candidato")
