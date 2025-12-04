"""
ORM Model para Fornecedores
Estrutura EXATA da tabela tb_fornecedores
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Integer,
    DECIMAL,
    TIMESTAMP,
    ARRAY,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# ============================================================================
# FORNECEDORES
# ============================================================================


class FornecedorORM(Base):
    """Fornecedor de produtos - Estrutura EXATA da tabela tb_fornecedores"""

    __tablename__ = "tb_fornecedores"
    __table_args__ = {'extend_existing': True}

    # IDs
    id_fornecedor = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user"))
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"))

    # Informações da empresa
    nm_empresa = Column(String(255), nullable=False)
    ds_razao_social = Column(String(255))
    nr_cnpj = Column(String(18), unique=True, nullable=False)
    nr_inscricao_estadual = Column(String(20))

    # Descrição e apresentação
    ds_descricao = Column(Text)
    ds_logo_url = Column(Text)
    ds_banner_url = Column(Text)
    ds_fotos = Column(ARRAY(Text))

    # Contato
    ds_site = Column(String(255))
    ds_email = Column(String(255))
    nr_telefone = Column(String(20))
    nr_whatsapp = Column(String(20))

    # Endereço
    ds_endereco = Column(String(255))
    nr_numero = Column(String(20))
    ds_complemento = Column(String(100))
    nm_bairro = Column(String(100))
    nm_cidade = Column(String(100))
    nm_estado = Column(String(2))
    nr_cep = Column(String(10))

    # Dados bancários
    ds_banco = Column(String(100))
    ds_agencia = Column(String(20))
    ds_conta = Column(String(20))
    ds_tipo_conta = Column(String(20))
    ds_pix = Column(String(255))

    # Categorias de produtos que fornece
    ds_categorias_produtos = Column(ARRAY(Text))

    # Avaliações
    nr_avaliacao_media = Column(DECIMAL(3, 2), default=0)
    nr_total_avaliacoes = Column(Integer, default=0)

    # Vendas
    nr_total_vendas = Column(Integer, default=0)
    vl_total_vendido = Column(DECIMAL(12, 2), default=0)
    dt_primeira_venda = Column(TIMESTAMP)
    dt_ultima_venda = Column(TIMESTAMP)

    # Políticas comerciais
    vl_pedido_minimo = Column(DECIMAL(10, 2))
    vl_frete_minimo = Column(DECIMAL(10, 2), default=0)
    nr_tempo_entrega_dias = Column(Integer, default=7)

    # Certificações e selos
    st_verificado = Column(Boolean, default=False)

    # Status
    st_ativo = Column(Boolean, default=True, nullable=False)

    # Datas
    dt_criacao = Column(TIMESTAMP, default=datetime.now, nullable=False)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # Relacionamentos
    produtos = relationship("ProdutoORM", back_populates="fornecedor")

    def __repr__(self):
        return f"<Fornecedor(id={self.id_fornecedor}, nome={self.nm_empresa})>"
