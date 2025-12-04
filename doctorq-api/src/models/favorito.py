"""
Model SQLAlchemy para Favoritos (Vagas favoritadas por usuários)
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from src.models.base import Base


class TbFavoritos(Base):
    """Tabela de favoritos (produtos, procedimentos, profissionais, clínicas, fornecedores, vagas)"""

    __tablename__ = "tb_favoritos"

    id_favorito = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
    )
    ds_tipo_item = Column(String(50), nullable=False)  # vaga, produto, procedimento, profissional, clinica, fornecedor

    # IDs opcionais baseados no tipo
    id_vaga = Column(UUID(as_uuid=True), ForeignKey("tb_vagas.id_vaga", ondelete="CASCADE"), nullable=True)
    id_produto = Column(UUID(as_uuid=True), nullable=True)
    id_procedimento = Column(UUID(as_uuid=True), nullable=True)
    id_profissional = Column(UUID(as_uuid=True), nullable=True)
    id_clinica = Column(UUID(as_uuid=True), nullable=True)
    id_fornecedor = Column(UUID(as_uuid=True), nullable=True)

    ds_categoria_favorito = Column(String(100), nullable=True)
    ds_observacoes = Column(String, nullable=True)
    nr_prioridade = Column(Integer, default=0)
    st_notificar_promocao = Column(Boolean, default=True)
    st_notificar_disponibilidade = Column(Boolean, default=True)

    dt_criacao = Column(DateTime, server_default=func.now(), nullable=False)
    dt_atualizacao = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="favoritos")
    vaga = relationship("TbVagas", back_populates="favoritos")

    def __repr__(self):
        return f"<TbFavoritos {self.id_favorito}: User {self.id_user} -> {self.ds_tipo_item} {self.id_vaga or self.id_produto or self.id_procedimento}>"
