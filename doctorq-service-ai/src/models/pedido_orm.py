"""
ORM Models para Pedidos
Estrutura EXATA das tabelas tb_pedidos, tb_itens_pedido e tb_pedido_historico
"""

import uuid
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DECIMAL,
    TIMESTAMP,
    Date,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.models.base import Base


# ============================================================================
# PEDIDOS
# ============================================================================


class PedidoORM(Base):
    """Pedido de produtos/procedimentos - Estrutura EXATA da tabela tb_pedidos"""

    __tablename__ = "tb_pedidos"
    __table_args__ = {'extend_existing': True}

    id_pedido = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)
    id_fornecedor = Column(UUID(as_uuid=True), ForeignKey("tb_fornecedores.id_fornecedor"))

    # Número do pedido
    nr_pedido = Column(String(50), unique=True, nullable=False)

    # Valores
    vl_subtotal = Column(DECIMAL(10, 2), nullable=False)
    vl_desconto = Column(DECIMAL(10, 2), default=0)
    vl_frete = Column(DECIMAL(10, 2), default=0)
    vl_total = Column(DECIMAL(10, 2), nullable=False)

    # Status
    ds_status = Column(String(50), default="pendente", nullable=False)
    # Opções: pendente, confirmado, pago, separando, enviado, entregue, cancelado

    # Endereço de entrega (JSONB)
    ds_endereco_entrega = Column(JSONB, nullable=False)

    # Forma de pagamento
    ds_forma_pagamento = Column(String(50))
    # pix, credito, debito, boleto

    # Rastreamento
    ds_rastreio = Column(String(100))
    ds_codigo_rastreio = Column(String(100))

    # Nota fiscal
    ds_numero_nota_fiscal = Column(String(50))
    ds_chave_nfe = Column(String(44))
    ds_url_danfe = Column(Text)

    # Observações
    ds_observacoes = Column(Text)

    # Datas
    dt_pedido = Column(TIMESTAMP, default=datetime.now)
    dt_confirmacao = Column(TIMESTAMP)
    dt_pagamento = Column(TIMESTAMP)
    dt_envio = Column(TIMESTAMP)
    dt_entrega = Column(TIMESTAMP)
    dt_entrega_estimada = Column(Date)
    dt_cancelamento = Column(TIMESTAMP)
    dt_criacao = Column(TIMESTAMP, default=datetime.now, nullable=False)

    # Relacionamentos
    itens = relationship("ItemPedidoORM", back_populates="pedido", cascade="all, delete-orphan")
    historico = relationship("PedidoHistoricoORM", back_populates="pedido", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Pedido(id={self.id_pedido}, nr={self.nr_pedido})>"


# ============================================================================
# ITENS DO PEDIDO
# ============================================================================


class ItemPedidoORM(Base):
    """Itens de um pedido - Estrutura EXATA da tabela tb_itens_pedido"""

    __tablename__ = "tb_itens_pedido"
    __table_args__ = {'extend_existing': True}

    id_item = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_pedido = Column(UUID(as_uuid=True), ForeignKey("tb_pedidos.id_pedido"))

    # Referências
    id_produto = Column(UUID(as_uuid=True), ForeignKey("tb_produtos.id_produto"))
    id_variacao = Column(UUID(as_uuid=True), ForeignKey("tb_produto_variacoes.id_variacao"))

    # Detalhes do item no momento da compra (snapshot)
    nm_produto = Column(String(255), nullable=False)
    ds_produto = Column(Text)
    ds_sku = Column(String(100))
    ds_variacao = Column(String(100))
    ds_imagem_url = Column(Text)

    # Quantidades e valores
    qt_quantidade = Column(Integer, nullable=False)
    vl_unitario = Column(DECIMAL(10, 2), nullable=False)
    vl_desconto_item = Column(DECIMAL(10, 2), default=0)
    vl_total = Column(DECIMAL(10, 2), nullable=False)

    dt_criacao = Column(TIMESTAMP, default=datetime.now)

    # Relacionamento
    pedido = relationship("PedidoORM", back_populates="itens")

    def __repr__(self):
        return f"<ItemPedido(id={self.id_item}, nome={self.nm_produto})>"


# ============================================================================
# HISTÓRICO DO PEDIDO
# ============================================================================


class PedidoHistoricoORM(Base):
    """Histórico de mudanças de status do pedido - Estrutura EXATA da tabela tb_pedido_historico"""

    __tablename__ = "tb_pedido_historico"
    __table_args__ = {'extend_existing': True}

    id_historico = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_pedido = Column(UUID(as_uuid=True), ForeignKey("tb_pedidos.id_pedido"))

    ds_status_anterior = Column(String(50))
    ds_status_novo = Column(String(50), nullable=False)
    ds_observacao = Column(Text)
    ds_observacao_cliente = Column(Text)

    # Usuário que fez a mudança
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    nm_usuario = Column(String(255))

    dt_criacao = Column(TIMESTAMP, default=datetime.now, nullable=False)

    # Relacionamento
    pedido = relationship("PedidoORM", back_populates="historico")

    def __repr__(self):
        return f"<PedidoHistorico(id={self.id_historico}, status={self.ds_status_novo})>"
