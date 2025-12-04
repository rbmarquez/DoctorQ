"""
ORM Model para Carrinho
Estrutura EXATA da tabela tb_carrinho
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DECIMAL,
    TIMESTAMP,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# ============================================================================
# CARRINHO
# ============================================================================


class CarrinhoORM(Base):
    """Itens do carrinho de compras - Estrutura EXATA da tabela tb_carrinho"""

    __tablename__ = "tb_carrinho"
    __table_args__ = {'extend_existing': True}

    id_carrinho = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Item pode ser produto OU procedimento (constraint no banco garante exclusividade)
    id_produto = Column(UUID(as_uuid=True), ForeignKey("tb_produtos.id_produto"))
    id_procedimento = Column(UUID(as_uuid=True), ForeignKey("tb_procedimentos.id_procedimento"))

    # Variação do produto (opcional)
    id_variacao = Column(UUID(as_uuid=True), ForeignKey("tb_produto_variacoes.id_variacao"))

    # Profissional desejado para procedimento (opcional)
    id_profissional_desejado = Column(UUID(as_uuid=True), ForeignKey("tb_profissionais.id_profissional"))

    # Quantidade e preço
    nr_quantidade = Column(Integer, nullable=False, default=1)
    vl_preco_unitario = Column(DECIMAL(10, 2), nullable=False)

    # Agendamento (para procedimentos)
    dt_agendamento_desejado = Column(TIMESTAMP)

    # Observações
    ds_observacoes = Column(Text)

    # Datas
    dt_criacao = Column(TIMESTAMP, default=datetime.now, nullable=False)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # Relacionamentos
    produto = relationship("ProdutoORM", back_populates="itens_carrinho")

    def __repr__(self):
        return f"<CarrinhoItem(id={self.id_carrinho}, user={self.id_user})>"
