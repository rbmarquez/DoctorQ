"""
Modelos para Compartilhamento de Conversas - UC085
Permite compartilhar conversas via link público com controle de expiração e senha opcional
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# ========== SQLAlchemy Model ==========

class TbConversaCompartilhada(Base):
    """
    Tabela de conversas compartilhadas (links públicos)
    """
    __tablename__ = "tb_conversas_compartilhadas"

    id_compartilhamento = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_conversa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_conversas.id_conversa", ondelete="CASCADE"), nullable=False)
    id_user_criador = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Token público único
    ds_token = Column(String(64), nullable=False, unique=True, index=True)

    # Senha opcional (hash bcrypt)
    ds_senha_hash = Column(String(255), nullable=True)

    # Controle de expiração
    dt_expiracao = Column(DateTime, nullable=True)  # null = nunca expira
    fg_expirado = Column(Boolean, default=False, nullable=False)

    # Estatísticas de acesso
    nr_visualizacoes = Column(Integer, default=0, nullable=False)
    dt_ultimo_acesso = Column(DateTime, nullable=True)

    # Metadados
    ds_descricao = Column(Text, nullable=True)  # Descrição do compartilhamento
    ds_ip_criador = Column(String(45), nullable=True)

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_revogado = Column(DateTime, nullable=True)  # Se revogado manualmente
    fg_ativo = Column(Boolean, default=True, nullable=False)


# ========== Pydantic Schemas ==========

class CompartilharConversaRequest(BaseModel):
    """Request para compartilhar conversa"""
    ds_senha: Optional[str] = Field(None, min_length=4, max_length=50, description="Senha opcional para proteger o link")
    dt_expiracao: Optional[datetime] = Field(None, description="Data de expiração (opcional)")
    dias_expiracao: Optional[int] = Field(None, ge=1, le=365, description="Expirar após X dias (alternativa a dt_expiracao)")
    ds_descricao: Optional[str] = Field(None, max_length=500, description="Descrição/motivo do compartilhamento")


class CompartilharConversaResponse(BaseModel):
    """Response com link de compartilhamento"""
    id_compartilhamento: UUID
    id_conversa: UUID
    ds_token: str
    url_compartilhamento: str  # URL completa: /conversas/compartilhadas/{token}
    dt_expiracao: Optional[datetime]
    fg_protegido_senha: bool
    dt_criacao: datetime

    class Config:
        from_attributes = True


class AcessarConversaCompartilhadaRequest(BaseModel):
    """Request para acessar conversa compartilhada (se protegida por senha)"""
    ds_senha: Optional[str] = Field(None, description="Senha do link (se protegido)")


class ConversaCompartilhadaResponse(BaseModel):
    """Response com dados da conversa compartilhada"""
    id_conversa: UUID
    ds_tipo: Optional[str]
    dt_criacao: datetime
    dt_ultima_mensagem: Optional[datetime]

    # Dados anonimizados dos participantes
    nm_user_1: str
    ds_foto_user_1: Optional[str]
    nm_user_2: str
    ds_foto_user_2: Optional[str]

    # Mensagens da conversa
    mensagens: list[dict]  # Lista de mensagens

    # Metadados do compartilhamento
    nr_visualizacoes: int
    dt_compartilhado: datetime
    ds_descricao: Optional[str]


class CompartilhamentoListItem(BaseModel):
    """Item de lista de compartilhamentos"""
    id_compartilhamento: UUID
    id_conversa: UUID
    ds_token: str
    url_compartilhamento: str
    dt_expiracao: Optional[datetime]
    fg_protegido_senha: bool
    fg_expirado: bool
    nr_visualizacoes: int
    dt_ultimo_acesso: Optional[datetime]
    dt_criacao: datetime
    fg_ativo: bool

    class Config:
        from_attributes = True


class CompartilhamentoListResponse(BaseModel):
    """Lista paginada de compartilhamentos"""
    total: int
    page: int
    size: int
    items: list[CompartilhamentoListItem]


class CompartilhamentoStats(BaseModel):
    """Estatísticas de compartilhamentos"""
    total_compartilhamentos: int
    ativos: int
    expirados: int
    protegidos_senha: int
    total_visualizacoes: int
    media_visualizacoes_por_link: float


# ========== Helper Functions ==========

def gerar_token_compartilhamento() -> str:
    """Gera token único seguro para compartilhamento"""
    return secrets.token_urlsafe(32)  # 43 caracteres base64url


def calcular_data_expiracao(dias: int) -> datetime:
    """Calcula data de expiração baseado em dias"""
    return datetime.utcnow() + timedelta(days=dias)
