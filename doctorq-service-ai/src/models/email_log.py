"""
Modelos para Logs de Emails - UC095
Registra histórico de emails enviados com categorização
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from enum import Enum

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

from src.models.base import Base


# ========== Enums ==========

class CategoriaEmail(str, Enum):
    """Categoria do email"""
    TRANSACIONAL = "transacional"      # Pedidos, pagamentos
    NOTIFICACAO = "notificacao"        # Notificações do sistema
    MARKETING = "marketing"            # Emails promocionais
    OPERACIONAL = "operacional"        # Senhas, convites
    LEMBRETE = "lembrete"              # Agendamentos, vencimentos
    SUPORTE = "suporte"                # Emails de suporte


class StatusEnvioEmail(str, Enum):
    """Status de envio"""
    PENDENTE = "pendente"
    ENVIADO = "enviado"
    ERRO = "erro"
    REJEITADO = "rejeitado"


class TipoTemplate(str, Enum):
    """Templates disponíveis"""
    PASSWORD_RESET = "password_reset"
    PASSWORD_CHANGED = "password_changed"
    WELCOME = "welcome"
    TEAM_INVITE = "team_invite"
    AGENDAMENTO_CONFIRMACAO = "agendamento_confirmacao"
    AGENDAMENTO_LEMBRETE = "agendamento_lembrete"
    PAGAMENTO_CONFIRMACAO = "pagamento_confirmacao"
    PEDIDO_CONFIRMACAO = "pedido_confirmacao"
    NOTA_FISCAL = "nota_fiscal"
    UPGRADE_PLANO = "upgrade_plano"
    TRIAL_ENDING = "trial_ending"
    LIMITE_ATINGIDO = "limite_atingido"


# ========== SQLAlchemy Model ==========

class TbEmailLog(Base):
    """
    Tabela de logs de emails enviados
    """
    __tablename__ = "tb_email_logs"

    id_email_log = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_user = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user", ondelete="SET NULL"), nullable=True)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa", ondelete="SET NULL"), nullable=True)

    # Dados do email
    ds_destinatario = Column(String(255), nullable=False)
    ds_assunto = Column(String(500), nullable=False)
    tp_categoria = Column(
        PG_ENUM('transacional', 'notificacao', 'marketing', 'operacional', 'lembrete', 'suporte', name='tp_categoria_email'),
        nullable=False,
        default='transacional'
    )
    tp_template = Column(String(100), nullable=True)

    # Status de envio
    st_envio = Column(String(20), nullable=False, default='pendente')
    ds_erro = Column(Text, nullable=True)

    # Metadados
    ds_metadata = Column(JSONB, nullable=True)
    ds_smtp_message_id = Column(String(255), nullable=True)

    # Rastreamento
    fg_aberto = Column(Boolean, default=False, nullable=False)
    dt_aberto = Column(DateTime, nullable=True)
    fg_clicado = Column(Boolean, default=False, nullable=False)
    dt_clicado = Column(DateTime, nullable=True)

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_enviado = Column(DateTime, nullable=True)
    dt_tentativa_envio = Column(DateTime, nullable=True)


# ========== Pydantic Schemas ==========

class EmailLogCreate(BaseModel):
    """Schema para criar log de email"""
    id_user: Optional[UUID] = None
    id_empresa: Optional[UUID] = None
    ds_destinatario: str = Field(..., max_length=255)
    ds_assunto: str = Field(..., max_length=500)
    tp_categoria: CategoriaEmail = Field(CategoriaEmail.TRANSACIONAL)
    tp_template: Optional[TipoTemplate] = None
    ds_metadata: Optional[Dict[str, Any]] = None


class EmailLogResponse(BaseModel):
    """Response com dados do log"""
    id_email_log: UUID
    id_user: Optional[UUID]
    id_empresa: Optional[UUID]
    ds_destinatario: str
    ds_assunto: str
    tp_categoria: str
    tp_template: Optional[str]
    st_envio: str
    ds_erro: Optional[str]
    fg_aberto: bool
    dt_aberto: Optional[datetime]
    fg_clicado: bool
    dt_clicado: Optional[datetime]
    dt_criacao: datetime
    dt_enviado: Optional[datetime]

    class Config:
        from_attributes = True


class EmailLogListResponse(BaseModel):
    """Lista paginada de logs"""
    total: int
    page: int
    size: int
    items: list[EmailLogResponse]


class EmailStats(BaseModel):
    """Estatísticas de emails"""
    total_enviados: int
    total_abertos: int
    total_clicados: int
    total_erros: int
    taxa_abertura: float  # (abertos / enviados) * 100
    taxa_clique: float    # (clicados / abertos) * 100
    por_categoria: Dict[str, int]
    por_template: Dict[str, int]
