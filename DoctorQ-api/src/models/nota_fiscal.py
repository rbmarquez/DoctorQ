"""
Modelos para Sistema de Nota Fiscal Eletrônica - UC063
Integração com serviços de NFSe (Focus NFe, eNotas, etc)
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
from enum import Enum

from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Numeric, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


class TipoNotaFiscal(str, Enum):
    """Tipos de nota fiscal"""
    NFSE = "nfse"  # Nota Fiscal de Serviço Eletrônica
    NFE = "nfe"    # Nota Fiscal Eletrônica (produtos)
    NFCE = "nfce"  # Nota Fiscal de Consumidor Eletrônica


class StatusNotaFiscal(str, Enum):
    """Status da nota fiscal"""
    PENDENTE = "pendente"
    PROCESSANDO = "processando"
    EMITIDA = "emitida"
    CANCELADA = "cancelada"
    ERRO = "erro"


# ========== SQLAlchemy Models ==========

class TbNotaFiscal(Base):
    """
    Tabela de notas fiscais emitidas
    """
    __tablename__ = "tb_notas_fiscais"

    id_nota_fiscal = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_pedido = Column(PG_UUID(as_uuid=True), ForeignKey("tb_pedidos.id_pedido"), nullable=True)
    id_fatura = Column(PG_UUID(as_uuid=True), ForeignKey("tb_faturas.id_fatura"), nullable=True)

    # Tipo e número
    tp_nota = Column(String(10), nullable=False, default="nfse")  # nfse, nfe, nfce
    nr_nota = Column(String(50))  # Número da nota (retornado após emissão)
    ds_serie = Column(String(10))  # Série da nota
    nr_rps = Column(String(50))  # RPS (Recibo Provisório de Serviços) - antes da emissão

    # Status
    st_nota = Column(String(20), nullable=False, default="pendente")
    ds_status_mensagem = Column(Text)  # Mensagem de erro ou sucesso

    # Valores
    vl_servicos = Column(Numeric(10, 2), nullable=False)
    vl_deducoes = Column(Numeric(10, 2), default=0)
    vl_pis = Column(Numeric(10, 2), default=0)
    vl_cofins = Column(Numeric(10, 2), default=0)
    vl_inss = Column(Numeric(10, 2), default=0)
    vl_ir = Column(Numeric(10, 2), default=0)
    vl_csll = Column(Numeric(10, 2), default=0)
    vl_iss = Column(Numeric(10, 2), default=0)
    vl_desconto_condicionado = Column(Numeric(10, 2), default=0)
    vl_desconto_incondicionado = Column(Numeric(10, 2), default=0)
    vl_outras_retencoes = Column(Numeric(10, 2), default=0)
    vl_total_tributos = Column(Numeric(10, 2), default=0)
    vl_liquido = Column(Numeric(10, 2), nullable=False)

    # Alíquota ISS
    pc_aliquota_iss = Column(Numeric(5, 2), default=5.00)  # % ISS (varia por município)

    # Tomador (cliente)
    ds_tomador_cnpj_cpf = Column(String(14), nullable=False)
    ds_tomador_razao_social = Column(String(255), nullable=False)
    ds_tomador_email = Column(String(255))
    ds_tomador_endereco = Column(JSON)  # Endereço completo em JSON

    # Prestador (empresa)
    ds_prestador_cnpj = Column(String(14), nullable=False)
    ds_prestador_razao_social = Column(String(255), nullable=False)
    ds_prestador_inscricao_municipal = Column(String(50))
    ds_prestador_endereco = Column(JSON)

    # Serviço prestado
    ds_discriminacao = Column(Text, nullable=False)  # Descrição do serviço
    ds_codigo_servico = Column(String(10))  # Código do serviço municipal (LC 116/2003)
    ds_item_lista_servico = Column(String(10))  # Item da lista de serviços
    ds_codigo_tributacao_municipio = Column(String(20))

    # Dados da API do serviço de NFe
    ds_provedor_nfe = Column(String(50))  # focus_nfe, enotas, etc
    ds_ref_externa = Column(String(100))  # ID da nota no serviço externo
    ds_chave_acesso = Column(String(44))  # Chave de acesso da NFe (44 caracteres)
    ds_codigo_verificacao = Column(String(20))  # Código de verificação
    ds_url_nfe = Column(Text)  # URL para consultar a nota
    ds_url_pdf = Column(Text)  # URL do PDF da nota

    # XMLs
    ds_xml_rps = Column(Text)  # XML do RPS enviado
    ds_xml_nfe = Column(Text)  # XML da NFe retornado
    ds_dados_completos = Column(JSON)  # Resposta completa da API (para debug)

    # Cancelamento
    fg_cancelada = Column(Boolean, default=False)
    dt_cancelamento = Column(DateTime)
    ds_motivo_cancelamento = Column(Text)

    # Auditoria
    dt_emissao = Column(DateTime)  # Data/hora de emissão (retornada pela prefeitura)
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# ========== Pydantic Models ==========

class NotaFiscalTomador(BaseModel):
    """Dados do tomador (cliente)"""
    cnpj_cpf: str = Field(..., description="CPF (11 dígitos) ou CNPJ (14 dígitos)")
    razao_social: str = Field(..., description="Nome ou Razão Social")
    email: Optional[str] = Field(None, description="Email para envio da nota")
    telefone: Optional[str] = None
    endereco: dict = Field(..., description="Endereço completo")

    @validator('cnpj_cpf')
    def validar_cnpj_cpf(cls, v):
        # Remove caracteres não numéricos
        v = ''.join(filter(str.isdigit, v))
        if len(v) not in [11, 14]:
            raise ValueError("CPF deve ter 11 dígitos ou CNPJ 14 dígitos")
        return v


class NotaFiscalPrestador(BaseModel):
    """Dados do prestador (empresa)"""
    cnpj: str = Field(..., description="CNPJ da empresa (14 dígitos)")
    razao_social: str
    inscricao_municipal: Optional[str] = None
    endereco: dict


class NotaFiscalServico(BaseModel):
    """Dados do serviço prestado"""
    discriminacao: str = Field(..., description="Descrição detalhada do serviço")
    codigo_servico: Optional[str] = Field(None, description="Código do serviço municipal")
    item_lista_servico: Optional[str] = Field("01.01", description="Item da LC 116/2003")
    aliquota_iss: float = Field(5.0, ge=0, le=100, description="Alíquota ISS (%)")


class NotaFiscalCreate(BaseModel):
    """Request para criar nota fiscal"""
    id_pedido: Optional[UUID] = Field(None, description="ID do pedido relacionado")
    id_fatura: Optional[UUID] = Field(None, description="ID da fatura relacionada")

    # Tomador
    tomador: NotaFiscalTomador

    # Serviço
    servico: NotaFiscalServico

    # Valores
    vl_servicos: float = Field(..., gt=0, description="Valor bruto dos serviços")
    vl_deducoes: Optional[float] = Field(0, ge=0)
    vl_desconto_incondicionado: Optional[float] = Field(0, ge=0)

    # Retenções
    vl_pis: Optional[float] = Field(0, ge=0)
    vl_cofins: Optional[float] = Field(0, ge=0)
    vl_inss: Optional[float] = Field(0, ge=0)
    vl_ir: Optional[float] = Field(0, ge=0)
    vl_csll: Optional[float] = Field(0, ge=0)

    # Provedor NFe
    provedor_nfe: Optional[str] = Field("focus_nfe", description="focus_nfe | enotas | nfse_nacional")


class NotaFiscalResponse(BaseModel):
    """Resposta com nota fiscal"""
    id_nota_fiscal: UUID
    id_empresa: UUID
    id_pedido: Optional[UUID]
    id_fatura: Optional[UUID]

    tp_nota: str
    nr_nota: Optional[str]
    ds_serie: Optional[str]
    nr_rps: Optional[str]

    st_nota: str
    ds_status_mensagem: Optional[str]

    vl_servicos: float
    vl_iss: float
    vl_liquido: float
    vl_total_tributos: float

    ds_tomador_cnpj_cpf: str
    ds_tomador_razao_social: str

    ds_discriminacao: str

    ds_chave_acesso: Optional[str]
    ds_codigo_verificacao: Optional[str]
    ds_url_nfe: Optional[str]
    ds_url_pdf: Optional[str]

    fg_cancelada: bool
    dt_emissao: Optional[datetime]
    dt_criacao: datetime

    class Config:
        from_attributes = True


class NotaFiscalListResponse(BaseModel):
    """Lista paginada de notas fiscais"""
    total: int
    page: int
    size: int
    items: List[NotaFiscalResponse]


class NotaFiscalCancelar(BaseModel):
    """Request para cancelar nota fiscal"""
    motivo: str = Field(..., min_length=15, description="Motivo do cancelamento (mínimo 15 caracteres)")


class NotaFiscalConsulta(BaseModel):
    """Request para consultar nota fiscal"""
    nr_nota: Optional[str] = None
    ds_chave_acesso: Optional[str] = None
    ds_codigo_verificacao: Optional[str] = None


class NotaFiscalReenvio(BaseModel):
    """Request para reenviar nota fiscal por email"""
    email: str = Field(..., description="Email para reenvio")


class NotaFiscalEstatisticas(BaseModel):
    """Estatísticas de notas fiscais"""
    total_emitidas: int
    total_canceladas: int
    total_pendentes: int
    total_erro: int
    vl_total_faturado: float
    vl_total_iss: float
    vl_total_tributos: float
