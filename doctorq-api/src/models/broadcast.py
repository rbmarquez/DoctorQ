"""
Modelos para Sistema de Broadcast de Mensagens - UC096
Envio de mensagens em massa com segmentação e agendamento
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from enum import Enum

from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from src.models.base import Base


class StatusCampanha(str, Enum):
    """Status da campanha de broadcast"""
    RASCUNHO = "rascunho"
    AGENDADA = "agendada"
    PROCESSANDO = "processando"
    ENVIADA = "enviada"
    CANCELADA = "cancelada"
    ERRO = "erro"


class CanalEnvio(str, Enum):
    """Canais de envio disponíveis"""
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    PUSH = "push"
    MENSAGEM_INTERNA = "mensagem_interna"


class TipoCampanha(str, Enum):
    """Tipo de campanha"""
    PROMOCIONAL = "promocional"
    INFORMATIVO = "informativo"
    TRANSACIONAL = "transacional"
    LEMBRETE = "lembrete"


class StatusDestinatario(str, Enum):
    """Status de entrega individual"""
    PENDENTE = "pendente"
    ENVIADO = "enviado"
    ENTREGUE = "entregue"
    FALHA = "falha"
    ABERTO = "aberto"
    CLICADO = "clicado"


# ========== SQLAlchemy Models ==========

class TbBroadcastCampanha(Base):
    """
    Tabela de campanhas de broadcast
    """
    __tablename__ = "tb_broadcast_campanhas"

    id_campanha = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_user_criador = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Identificação
    nm_campanha = Column(String(255), nullable=False)
    ds_descricao = Column(Text)
    tp_campanha = Column(String(20), nullable=False, default="informativo")  # promocional, informativo, transacional, lembrete

    # Conteúdo
    ds_assunto = Column(String(255))  # Para email
    ds_mensagem = Column(Text, nullable=False)  # Corpo da mensagem
    ds_template_id = Column(PG_UUID(as_uuid=True), ForeignKey("tb_broadcast_templates.id_template"), nullable=True)

    # Canal e segmentação
    tp_canal = Column(String(20), nullable=False, default="email")  # email, whatsapp, sms, push, mensagem_interna
    ds_filtros_segmentacao = Column(JSON)  # Filtros aplicados (perfil, cidade, última visita, etc)

    # Agendamento
    dt_agendamento = Column(DateTime)  # Se null, envia imediatamente
    fg_agendada = Column(Boolean, default=False)

    # Controle de envio
    st_campanha = Column(String(20), nullable=False, default="rascunho")  # rascunho, agendada, processando, enviada, cancelada, erro
    dt_inicio_envio = Column(DateTime)
    dt_fim_envio = Column(DateTime)

    # Estatísticas
    nr_total_destinatarios = Column(Integer, default=0)
    nr_enviados = Column(Integer, default=0)
    nr_entregues = Column(Integer, default=0)
    nr_falhas = Column(Integer, default=0)
    nr_abertos = Column(Integer, default=0)  # Para email/push
    nr_cliques = Column(Integer, default=0)  # Se houver links

    # Metadados
    ds_metadados = Column(JSON)  # Dados adicionais (UTM params, variáveis personalizadas)

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    fg_ativo = Column(Boolean, default=True)


class TbBroadcastDestinatario(Base):
    """
    Tabela de destinatários individuais de cada campanha
    Rastreia status de entrega por destinatário
    """
    __tablename__ = "tb_broadcast_destinatarios"

    id_destinatario = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_campanha = Column(PG_UUID(as_uuid=True), ForeignKey("tb_broadcast_campanhas.id_campanha", ondelete="CASCADE"), nullable=False)
    id_user = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)

    # Contato
    ds_email = Column(String(255))
    ds_telefone = Column(String(20))
    ds_push_token = Column(String(255))  # Token do dispositivo para push

    # Status de entrega
    st_envio = Column(String(20), nullable=False, default="pendente")  # pendente, enviado, entregue, falha, aberto, clicado
    ds_mensagem_erro = Column(Text)  # Se falha, armazena o erro

    # Timestamps de ações
    dt_enviado = Column(DateTime)
    dt_entregue = Column(DateTime)
    dt_aberto = Column(DateTime)  # Primeiro opened
    dt_clicado = Column(DateTime)  # Primeiro click
    nr_vezes_aberto = Column(Integer, default=0)
    nr_vezes_clicado = Column(Integer, default=0)

    # Metadados
    ds_metadados = Column(JSON)  # Dados personalizados por destinatário

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class TbBroadcastTemplate(Base):
    """
    Templates reutilizáveis para campanhas
    """
    __tablename__ = "tb_broadcast_templates"

    id_template = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)

    # Identificação
    nm_template = Column(String(255), nullable=False)
    ds_descricao = Column(Text)
    tp_canal = Column(String(20), nullable=False)  # email, whatsapp, sms, push

    # Conteúdo
    ds_assunto = Column(String(255))  # Para email
    ds_corpo = Column(Text, nullable=False)
    ds_variaveis = Column(JSON)  # Lista de variáveis permitidas: {{nome}}, {{clinica}}, etc

    # Categorização
    tp_categoria = Column(String(50))  # promocional, informativo, lembrete

    # Metadados
    fg_ativo = Column(Boolean, default=True)

    # Auditoria
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# ========== Pydantic Models ==========

class BroadcastFiltros(BaseModel):
    """Filtros para segmentação de destinatários"""
    perfis: Optional[List[str]] = Field(None, description="Lista de perfis: admin, gestor_clinica, profissional, paciente")
    cidades: Optional[List[str]] = Field(None, description="Filtrar por cidade")
    estados: Optional[List[str]] = Field(None, description="Filtrar por estado")
    clinicas: Optional[List[UUID]] = Field(None, description="IDs de clínicas específicas")
    dt_ultima_visita_min: Optional[datetime] = Field(None, description="Última visita após esta data")
    dt_ultima_visita_max: Optional[datetime] = Field(None, description="Última visita antes desta data")
    fg_ativo: Optional[bool] = Field(True, description="Apenas usuários ativos")
    ids_usuarios: Optional[List[UUID]] = Field(None, description="IDs específicos de usuários")


class BroadcastCampanhaCreate(BaseModel):
    """Request para criar campanha"""
    nm_campanha: str = Field(..., min_length=3, max_length=255, description="Nome da campanha")
    ds_descricao: Optional[str] = Field(None, description="Descrição da campanha")
    tp_campanha: TipoCampanha = Field(TipoCampanha.INFORMATIVO, description="Tipo de campanha")

    # Conteúdo
    ds_assunto: Optional[str] = Field(None, max_length=255, description="Assunto (email)")
    ds_mensagem: str = Field(..., min_length=10, description="Corpo da mensagem")
    id_template: Optional[UUID] = Field(None, description="ID do template (se usar)")

    # Canal e segmentação
    tp_canal: CanalEnvio = Field(CanalEnvio.EMAIL, description="Canal de envio")
    filtros_segmentacao: Optional[BroadcastFiltros] = Field(None, description="Filtros de segmentação")

    # Agendamento
    dt_agendamento: Optional[datetime] = Field(None, description="Data/hora para agendar (null = envia imediatamente)")

    # Metadados
    metadados: Optional[Dict[str, Any]] = Field(None, description="Metadados adicionais")


class BroadcastCampanhaUpdate(BaseModel):
    """Request para atualizar campanha"""
    nm_campanha: Optional[str] = Field(None, min_length=3, max_length=255)
    ds_descricao: Optional[str] = None
    ds_assunto: Optional[str] = Field(None, max_length=255)
    ds_mensagem: Optional[str] = Field(None, min_length=10)
    dt_agendamento: Optional[datetime] = None


class BroadcastCampanhaResponse(BaseModel):
    """Resposta com dados da campanha"""
    id_campanha: UUID
    id_empresa: UUID
    id_user_criador: UUID

    nm_campanha: str
    ds_descricao: Optional[str]
    tp_campanha: str

    ds_assunto: Optional[str]
    ds_mensagem: str
    tp_canal: str
    ds_filtros_segmentacao: Optional[Dict[str, Any]]

    st_campanha: str
    dt_agendamento: Optional[datetime]
    dt_inicio_envio: Optional[datetime]
    dt_fim_envio: Optional[datetime]

    nr_total_destinatarios: int
    nr_enviados: int
    nr_entregues: int
    nr_falhas: int
    nr_abertos: int
    nr_cliques: int

    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class BroadcastCampanhaListResponse(BaseModel):
    """Lista paginada de campanhas"""
    total: int
    page: int
    size: int
    items: List[BroadcastCampanhaResponse]


class BroadcastDestinatarioResponse(BaseModel):
    """Resposta com dados de destinatário"""
    id_destinatario: UUID
    id_campanha: UUID
    id_user: UUID

    ds_email: Optional[str]
    ds_telefone: Optional[str]

    st_envio: str
    ds_mensagem_erro: Optional[str]

    dt_enviado: Optional[datetime]
    dt_entregue: Optional[datetime]
    dt_aberto: Optional[datetime]
    dt_clicado: Optional[datetime]
    nr_vezes_aberto: int
    nr_vezes_clicado: int

    dt_criacao: datetime

    class Config:
        from_attributes = True


class BroadcastTemplateCreate(BaseModel):
    """Request para criar template"""
    nm_template: str = Field(..., min_length=3, max_length=255)
    ds_descricao: Optional[str] = None
    tp_canal: CanalEnvio
    ds_assunto: Optional[str] = Field(None, max_length=255)
    ds_corpo: str = Field(..., min_length=10, description="Corpo do template com variáveis {{var}}")
    variaveis: Optional[List[str]] = Field(None, description="Lista de variáveis: nome, email, clinica, etc")
    tp_categoria: Optional[str] = None


class BroadcastTemplateResponse(BaseModel):
    """Resposta com template"""
    id_template: UUID
    id_empresa: UUID
    nm_template: str
    ds_descricao: Optional[str]
    tp_canal: str
    ds_assunto: Optional[str]
    ds_corpo: str
    ds_variaveis: Optional[Dict[str, Any]]
    tp_categoria: Optional[str]
    fg_ativo: bool
    dt_criacao: datetime

    class Config:
        from_attributes = True


class BroadcastEstatisticas(BaseModel):
    """Estatísticas detalhadas da campanha"""
    id_campanha: UUID
    nm_campanha: str
    st_campanha: str

    total_destinatarios: int
    enviados: int
    entregues: int
    falhas: int
    abertos: int
    cliques: int

    taxa_entrega: float  # (entregues / enviados) * 100
    taxa_abertura: float  # (abertos / entregues) * 100
    taxa_clique: float  # (cliques / abertos) * 100
    taxa_falha: float  # (falhas / enviados) * 100

    dt_inicio_envio: Optional[datetime]
    dt_fim_envio: Optional[datetime]
    duracao_segundos: Optional[int]


class BroadcastPreview(BaseModel):
    """Preview da campanha antes de enviar"""
    total_destinatarios: int
    canais_destino: Dict[str, int]  # {email: 150, whatsapp: 30, ...}
    amostra_destinatarios: List[Dict[str, Any]]  # Primeiros 10 destinatários
    mensagem_renderizada: str  # Mensagem com variáveis substituídas (exemplo)
    custo_estimado: Optional[float]  # Se aplicável (SMS tem custo)
