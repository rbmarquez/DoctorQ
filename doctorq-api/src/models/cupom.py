"""
Modelo ORM para Cupons de Desconto
"""
from sqlalchemy import Column, String, Numeric, Integer, Boolean, TIMESTAMP, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from src.models.base import Base


class CupomORM(Base):
    """Model para tb_cupons"""

    __tablename__ = "tb_cupons"

    # Identificação
    id_cupom = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"))
    id_fornecedor = Column(UUID(as_uuid=True), ForeignKey("tb_fornecedores.id_fornecedor", ondelete="CASCADE"), nullable=True)

    # Informações do Cupom
    ds_codigo = Column(String(50), unique=True, nullable=False, index=True)
    nm_cupom = Column(String(255), nullable=False)
    ds_descricao = Column(String, nullable=True)

    # Tipo e Valor do Desconto
    ds_tipo_desconto = Column(String(20), nullable=False)  # 'percentual' ou 'fixo'
    nr_percentual_desconto = Column(Numeric(5, 2), nullable=True)  # Ex: 10.00 = 10%
    vl_desconto_fixo = Column(Numeric(10, 2), nullable=True)  # Ex: 50.00 = R$ 50

    # Regras de Aplicação
    vl_minimo_compra = Column(Numeric(10, 2), nullable=True)  # Valor mínimo do carrinho
    vl_maximo_desconto = Column(Numeric(10, 2), nullable=True)  # Limite máximo de desconto

    # Limites de Uso
    nr_usos_maximos = Column(Integer, nullable=True)  # NULL = ilimitado
    nr_usos_por_usuario = Column(Integer, nullable=False, default=1)
    nr_usos_atuais = Column(Integer, nullable=False, default=0)

    # Restrições de Produtos/Categorias
    ds_produtos_validos = Column(ARRAY(UUID(as_uuid=True)), nullable=True)
    ds_categorias_validas = Column(ARRAY(UUID(as_uuid=True)), nullable=True)

    # Regras Especiais
    st_primeira_compra = Column(Boolean, default=False)  # Apenas para primeira compra

    # Validade
    dt_inicio = Column(TIMESTAMP, nullable=False)
    dt_fim = Column(TIMESTAMP, nullable=False)

    # Status
    st_ativo = Column(Boolean, default=True, index=True)

    # Auditoria
    dt_criacao = Column(TIMESTAMP, default=datetime.utcnow)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (se necessário)
    # empresa = relationship("EmpresaORM", back_populates="cupons")
    # fornecedor = relationship("FornecedorORM", back_populates="cupons")

    def __repr__(self):
        return f"<CupomORM(codigo='{self.ds_codigo}', tipo='{self.ds_tipo_desconto}', ativo={self.st_ativo})>"

    def to_dict(self):
        """Converte o model para dicionário"""
        return {
            "id_cupom": str(self.id_cupom),
            "id_empresa": str(self.id_empresa) if self.id_empresa else None,
            "id_fornecedor": str(self.id_fornecedor) if self.id_fornecedor else None,
            "ds_codigo": self.ds_codigo,
            "nm_cupom": self.nm_cupom,
            "ds_descricao": self.ds_descricao,
            "ds_tipo_desconto": self.ds_tipo_desconto,
            "nr_percentual_desconto": float(self.nr_percentual_desconto) if self.nr_percentual_desconto else None,
            "vl_desconto_fixo": float(self.vl_desconto_fixo) if self.vl_desconto_fixo else None,
            "vl_minimo_compra": float(self.vl_minimo_compra) if self.vl_minimo_compra else None,
            "vl_maximo_desconto": float(self.vl_maximo_desconto) if self.vl_maximo_desconto else None,
            "nr_usos_maximos": self.nr_usos_maximos,
            "nr_usos_por_usuario": self.nr_usos_por_usuario,
            "nr_usos_atuais": self.nr_usos_atuais,
            "ds_produtos_validos": [str(p) for p in self.ds_produtos_validos] if self.ds_produtos_validos else None,
            "ds_categorias_validas": [str(c) for c in self.ds_categorias_validas] if self.ds_categorias_validas else None,
            "st_primeira_compra": self.st_primeira_compra,
            "dt_inicio": self.dt_inicio.isoformat() if self.dt_inicio else None,
            "dt_fim": self.dt_fim.isoformat() if self.dt_fim else None,
            "st_ativo": self.st_ativo,
            "dt_criacao": self.dt_criacao.isoformat() if self.dt_criacao else None,
            "dt_atualizacao": self.dt_atualizacao.isoformat() if self.dt_atualizacao else None,
        }


class CupomUsoORM(Base):
    """Model para tb_cupons_uso - Registro de uso de cupons"""

    __tablename__ = "tb_cupons_uso"

    id_cupom_uso = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cupom = Column(UUID(as_uuid=True), ForeignKey("tb_cupons.id_cupom", ondelete="CASCADE"), nullable=False)
    id_user = Column(UUID(as_uuid=True), ForeignKey("tb_users.id_user", ondelete="CASCADE"), nullable=False)
    id_pedido = Column(UUID(as_uuid=True), ForeignKey("tb_pedidos.id_pedido", ondelete="SET NULL"), nullable=True)

    vl_desconto_aplicado = Column(Numeric(10, 2), nullable=False)
    dt_uso = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    # cupom = relationship("CupomORM", back_populates="usos")
    # user = relationship("UserORM", back_populates="cupons_usados")
    # pedido = relationship("PedidoORM", back_populates="cupom_usado")

    def __repr__(self):
        return f"<CupomUsoORM(cupom={self.id_cupom}, user={self.id_user}, desconto={self.vl_desconto_aplicado})>"
