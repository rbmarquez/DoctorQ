"""
Modelos para Sistema de Exportação de Relatórios - UC115
Exportação de dados em múltiplos formatos (Excel, CSV, PDF, JSON)
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from enum import Enum

from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


class FormatoExport(str, Enum):
    """Formatos de exportação suportados"""
    EXCEL = "excel"  # .xlsx
    CSV = "csv"
    PDF = "pdf"
    JSON = "json"


class TipoRelatorio(str, Enum):
    """Tipos de relatórios disponíveis"""
    AGENDAMENTOS = "agendamentos"
    FATURAMENTO = "faturamento"
    PRODUTOS = "produtos"
    PACIENTES = "pacientes"
    AVALIACOES = "avaliacoes"
    ESTOQUE = "estoque"
    NOTAS_FISCAIS = "notas_fiscais"
    BROADCAST = "broadcast"
    CUSTOMIZADO = "customizado"


class StatusExport(str, Enum):
    """Status do job de exportação"""
    PENDENTE = "pendente"
    PROCESSANDO = "processando"
    CONCLUIDO = "concluido"
    ERRO = "erro"


class FrequenciaAgendamento(str, Enum):
    """Frequência de agendamento automático"""
    DIARIO = "diario"  # Todo dia às X horas
    SEMANAL = "semanal"  # Toda semana no dia X
    MENSAL = "mensal"  # Todo mês no dia X
    TRIMESTRAL = "trimestral"


# ========== SQLAlchemy Models ==========

class TbExportJob(Base):
    """
    Jobs de exportação de relatórios
    """
    __tablename__ = "tb_export_jobs"

    id_export = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_user_solicitante = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Tipo de relatório
    tp_relatorio = Column(String(50), nullable=False)  # agendamentos, faturamento, produtos, etc
    ds_nome_relatorio = Column(String(255), nullable=False)  # Nome amigável do relatório

    # Formato
    tp_formato = Column(String(20), nullable=False)  # excel, csv, pdf, json

    # Filtros aplicados (em JSON)
    ds_filtros = Column(JSON)  # {dt_inicio, dt_fim, id_clinica, etc}

    # Processamento
    st_export = Column(String(20), nullable=False, default="pendente")  # pendente, processando, concluido, erro
    ds_mensagem_erro = Column(Text)

    # Resultado
    ds_arquivo_path = Column(Text)  # Caminho do arquivo gerado
    ds_arquivo_url = Column(Text)  # URL para download
    nr_total_registros = Column(Integer, default=0)
    nr_tamanho_bytes = Column(Integer, default=0)

    # Timestamps
    dt_solicitacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_inicio_processamento = Column(DateTime)
    dt_fim_processamento = Column(DateTime)
    dt_expiracao = Column(DateTime)  # Data de expiração do arquivo (limpar após X dias)

    # Agendamento (se for recorrente)
    fg_agendado = Column(Boolean, default=False)
    id_agendamento = Column(PG_UUID(as_uuid=True), ForeignKey("tb_export_agendamentos.id_agendamento"))

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)


class TbExportAgendamento(Base):
    """
    Agendamentos recorrentes de exportação
    """
    __tablename__ = "tb_export_agendamentos"

    id_agendamento = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_user_criador = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Identificação
    nm_agendamento = Column(String(255), nullable=False)
    ds_descricao = Column(Text)

    # Relatório
    tp_relatorio = Column(String(50), nullable=False)
    tp_formato = Column(String(20), nullable=False)
    ds_filtros = Column(JSON)

    # Frequência
    tp_frequencia = Column(String(20), nullable=False)  # diario, semanal, mensal, trimestral
    nr_hora_execucao = Column(Integer, default=8)  # Hora do dia para executar (0-23)
    nr_dia_execucao = Column(Integer)  # Dia da semana (1-7) ou dia do mês (1-31)

    # Email
    fg_enviar_email = Column(Boolean, default=True)
    ds_emails_destinatarios = Column(JSON)  # Lista de emails: ["user1@example.com", "user2@example.com"]

    # Última execução
    dt_ultima_execucao = Column(DateTime)
    dt_proxima_execucao = Column(DateTime)

    # Status
    fg_ativo = Column(Boolean, default=True)

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# ========== Pydantic Models ==========

class ExportFiltros(BaseModel):
    """Filtros para relatórios"""
    dt_inicio: Optional[datetime] = Field(None, description="Data início")
    dt_fim: Optional[datetime] = Field(None, description="Data fim")
    id_clinica: Optional[UUID] = Field(None, description="Filtrar por clínica")
    id_profissional: Optional[UUID] = Field(None, description="Filtrar por profissional")
    status: Optional[str] = Field(None, description="Filtrar por status")
    # Adicionar outros filtros conforme necessário


class ExportJobCreate(BaseModel):
    """Request para criar job de exportação"""
    tp_relatorio: TipoRelatorio = Field(..., description="Tipo de relatório")
    ds_nome_relatorio: str = Field(..., min_length=3, max_length=255, description="Nome do relatório")
    tp_formato: FormatoExport = Field(FormatoExport.EXCEL, description="Formato de saída")
    filtros: Optional[ExportFiltros] = Field(None, description="Filtros do relatório")


class ExportJobResponse(BaseModel):
    """Resposta com job de exportação"""
    id_export: UUID
    id_empresa: UUID
    id_user_solicitante: UUID

    tp_relatorio: str
    ds_nome_relatorio: str
    tp_formato: str

    ds_filtros: Optional[Dict[str, Any]]

    st_export: str
    ds_mensagem_erro: Optional[str]

    ds_arquivo_url: Optional[str]
    nr_total_registros: int
    nr_tamanho_bytes: int

    dt_solicitacao: datetime
    dt_inicio_processamento: Optional[datetime]
    dt_fim_processamento: Optional[datetime]
    dt_expiracao: Optional[datetime]

    fg_agendado: bool

    class Config:
        from_attributes = True


class ExportJobListResponse(BaseModel):
    """Lista paginada de jobs"""
    total: int
    page: int
    size: int
    items: List[ExportJobResponse]


class ExportAgendamentoCreate(BaseModel):
    """Request para criar agendamento recorrente"""
    nm_agendamento: str = Field(..., min_length=3, max_length=255)
    ds_descricao: Optional[str] = None

    tp_relatorio: TipoRelatorio
    tp_formato: FormatoExport
    filtros: Optional[ExportFiltros] = None

    tp_frequencia: FrequenciaAgendamento
    nr_hora_execucao: int = Field(8, ge=0, le=23, description="Hora do dia (0-23)")
    nr_dia_execucao: Optional[int] = Field(None, ge=1, le=31, description="Dia da semana (1-7) ou do mês (1-31)")

    fg_enviar_email: bool = Field(True, description="Enviar relatório por email")
    emails_destinatarios: Optional[List[str]] = Field(None, description="Lista de emails")

    @validator('emails_destinatarios')
    def validar_emails(cls, v):
        if v:
            for email in v:
                if '@' not in email:
                    raise ValueError(f"Email inválido: {email}")
        return v


class ExportAgendamentoUpdate(BaseModel):
    """Request para atualizar agendamento"""
    nm_agendamento: Optional[str] = Field(None, min_length=3, max_length=255)
    ds_descricao: Optional[str] = None
    tp_frequencia: Optional[FrequenciaAgendamento] = None
    nr_hora_execucao: Optional[int] = Field(None, ge=0, le=23)
    nr_dia_execucao: Optional[int] = Field(None, ge=1, le=31)
    fg_enviar_email: Optional[bool] = None
    emails_destinatarios: Optional[List[str]] = None
    fg_ativo: Optional[bool] = None


class ExportAgendamentoResponse(BaseModel):
    """Resposta com agendamento"""
    id_agendamento: UUID
    id_empresa: UUID
    id_user_criador: UUID

    nm_agendamento: str
    ds_descricao: Optional[str]

    tp_relatorio: str
    tp_formato: str
    ds_filtros: Optional[Dict[str, Any]]

    tp_frequencia: str
    nr_hora_execucao: int
    nr_dia_execucao: Optional[int]

    fg_enviar_email: bool
    ds_emails_destinatarios: Optional[Dict[str, Any]]

    dt_ultima_execucao: Optional[datetime]
    dt_proxima_execucao: Optional[datetime]

    fg_ativo: bool

    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class ExportAgendamentoListResponse(BaseModel):
    """Lista paginada de agendamentos"""
    total: int
    page: int
    size: int
    items: List[ExportAgendamentoResponse]


class ExportEstatisticas(BaseModel):
    """Estatísticas de exportações"""
    total_exports: int
    total_concluidos: int
    total_erro: int
    total_pendentes: int
    tamanho_total_mb: float
    formatos_mais_usados: Dict[str, int]  # {excel: 50, csv: 30, pdf: 20}
    relatorios_mais_exportados: Dict[str, int]  # {agendamentos: 40, faturamento: 35}
