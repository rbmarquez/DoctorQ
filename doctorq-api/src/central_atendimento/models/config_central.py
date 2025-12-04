# src/central_atendimento/models/config_central.py
"""
Model para configurações da Central de Atendimento.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import (
    Column,
    DateTime,
    String,
    Text,
    Boolean,
    Integer,
    Float,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from src.models.base import Base


class ConfigCentralAtendimento(Base):
    """
    Model ORM para configurações da Central de Atendimento.

    Armazena configurações por empresa.
    """

    __tablename__ = "tb_config_central_atendimento"

    # Identificador
    id_config = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_config",
    )

    # Multi-tenant
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        name="id_empresa",
        index=True,
    )

    # === Configurações Gerais ===
    nm_empresa_chat = Column(
        String(100),
        nullable=False,
        default="Atendimento",
        name="nm_empresa_chat",
    )
    ds_mensagem_boas_vindas = Column(
        Text,
        nullable=True,
        name="ds_mensagem_boas_vindas",
    )
    ds_mensagem_ausencia = Column(
        Text,
        nullable=True,
        name="ds_mensagem_ausencia",
    )
    ds_mensagem_encerramento = Column(
        Text,
        nullable=True,
        name="ds_mensagem_encerramento",
    )
    nr_tempo_inatividade = Column(
        Integer,
        nullable=False,
        default=30,
        name="nr_tempo_inatividade",  # minutos
    )
    st_encerramento_automatico = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_encerramento_automatico",
    )
    st_pesquisa_satisfacao = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_pesquisa_satisfacao",
    )

    # === Configurações do Bot ===
    st_bot_ativo = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_bot_ativo",
    )
    st_transferencia_automatica = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_transferencia_automatica",
    )
    nr_tentativas_antes_transferir = Column(
        Integer,
        nullable=False,
        default=3,
        name="nr_tentativas_antes_transferir",
    )
    ds_palavras_transferencia = Column(
        ARRAY(String),
        nullable=True,
        default=["atendente", "humano", "pessoa"],
        name="ds_palavras_transferencia",
    )
    st_resposta_ia = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_resposta_ia",
    )
    nm_modelo_ia = Column(
        String(50),
        nullable=False,
        default="gpt-4",
        name="nm_modelo_ia",
    )
    nr_temperatura_ia = Column(
        Float,
        nullable=False,
        default=0.7,
        name="nr_temperatura_ia",
    )

    # === Configurações de Horário ===
    st_respeitar_horario = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_respeitar_horario",
    )
    hr_inicio = Column(
        String(5),
        nullable=False,
        default="08:00",
        name="hr_inicio",
    )
    hr_fim = Column(
        String(5),
        nullable=False,
        default="18:00",
        name="hr_fim",
    )
    ds_dias_semana = Column(
        ARRAY(String),
        nullable=False,
        default=["seg", "ter", "qua", "qui", "sex"],
        name="ds_dias_semana",
    )
    st_atender_feriados = Column(
        Boolean,
        nullable=False,
        default=False,
        name="st_atender_feriados",
    )

    # === Configurações de Notificações ===
    st_som_mensagem = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_som_mensagem",
    )
    st_notificacao_desktop = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_notificacao_desktop",
    )
    st_email_nova_conversa = Column(
        Boolean,
        nullable=False,
        default=False,
        name="st_email_nova_conversa",
    )
    st_email_resumo_diario = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_email_resumo_diario",
    )
    nm_email_notificacoes = Column(
        String(255),
        nullable=True,
        name="nm_email_notificacoes",
    )

    # === Configurações Avançadas ===
    ds_webhook_url = Column(
        String(500),
        nullable=True,
        name="ds_webhook_url",
    )
    st_webhook_ativo = Column(
        Boolean,
        nullable=False,
        default=False,
        name="st_webhook_ativo",
    )
    st_rate_limiting = Column(
        Boolean,
        nullable=False,
        default=True,
        name="st_rate_limiting",
    )
    ds_cor_widget = Column(
        String(7),
        nullable=False,
        default="#4F46E5",
        name="ds_cor_widget",
    )
    ds_posicao_widget = Column(
        String(20),
        nullable=False,
        default="bottom-right",
        name="ds_posicao_widget",
    )

    # Timestamps
    dt_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    def __repr__(self):
        return f"<ConfigCentralAtendimento(id={self.id_config}, empresa={self.id_empresa})>"


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ConfigGeralSchema(BaseModel):
    """Schema para configurações gerais."""
    model_config = ConfigDict(from_attributes=True)

    nm_empresa_chat: str = "Atendimento"
    ds_mensagem_boas_vindas: Optional[str] = None
    ds_mensagem_ausencia: Optional[str] = None
    ds_mensagem_encerramento: Optional[str] = None
    nr_tempo_inatividade: int = Field(default=30, ge=5, le=120)
    st_encerramento_automatico: bool = True
    st_pesquisa_satisfacao: bool = True


class ConfigBotSchema(BaseModel):
    """Schema para configurações do bot."""
    model_config = ConfigDict(from_attributes=True)

    st_bot_ativo: bool = True
    st_transferencia_automatica: bool = True
    nr_tentativas_antes_transferir: int = Field(default=3, ge=1, le=10)
    ds_palavras_transferencia: List[str] = ["atendente", "humano", "pessoa"]
    st_resposta_ia: bool = True
    nm_modelo_ia: str = "gpt-4"
    nr_temperatura_ia: float = Field(default=0.7, ge=0.0, le=2.0)


class ConfigHorarioSchema(BaseModel):
    """Schema para configurações de horário."""
    model_config = ConfigDict(from_attributes=True)

    st_respeitar_horario: bool = True
    hr_inicio: str = "08:00"
    hr_fim: str = "18:00"
    ds_dias_semana: List[str] = ["seg", "ter", "qua", "qui", "sex"]
    st_atender_feriados: bool = False


class ConfigNotificacoesSchema(BaseModel):
    """Schema para configurações de notificações."""
    model_config = ConfigDict(from_attributes=True)

    st_som_mensagem: bool = True
    st_notificacao_desktop: bool = True
    st_email_nova_conversa: bool = False
    st_email_resumo_diario: bool = True
    nm_email_notificacoes: Optional[str] = None


class ConfigAvancadoSchema(BaseModel):
    """Schema para configurações avançadas."""
    model_config = ConfigDict(from_attributes=True)

    ds_webhook_url: Optional[str] = None
    st_webhook_ativo: bool = False
    st_rate_limiting: bool = True
    ds_cor_widget: str = "#4F46E5"
    ds_posicao_widget: str = "bottom-right"


class ConfigCentralCreate(BaseModel):
    """Schema para criar configuração."""
    model_config = ConfigDict(from_attributes=True)

    geral: Optional[ConfigGeralSchema] = None
    bot: Optional[ConfigBotSchema] = None
    horario: Optional[ConfigHorarioSchema] = None
    notificacoes: Optional[ConfigNotificacoesSchema] = None
    avancado: Optional[ConfigAvancadoSchema] = None


class ConfigCentralUpdate(BaseModel):
    """Schema para atualizar configuração."""
    model_config = ConfigDict(from_attributes=True)

    geral: Optional[ConfigGeralSchema] = None
    bot: Optional[ConfigBotSchema] = None
    horario: Optional[ConfigHorarioSchema] = None
    notificacoes: Optional[ConfigNotificacoesSchema] = None
    avancado: Optional[ConfigAvancadoSchema] = None


class ConfigCentralResponse(BaseModel):
    """Schema de resposta completa."""
    model_config = ConfigDict(from_attributes=True)

    id_config: uuid.UUID
    id_empresa: uuid.UUID
    geral: ConfigGeralSchema
    bot: ConfigBotSchema
    horario: ConfigHorarioSchema
    notificacoes: ConfigNotificacoesSchema
    avancado: ConfigAvancadoSchema
    dt_criacao: datetime
    dt_atualizacao: datetime

    @classmethod
    def from_orm_model(cls, config: ConfigCentralAtendimento) -> "ConfigCentralResponse":
        """Converte o model ORM para o schema de resposta."""
        return cls(
            id_config=config.id_config,
            id_empresa=config.id_empresa,
            geral=ConfigGeralSchema(
                nm_empresa_chat=config.nm_empresa_chat,
                ds_mensagem_boas_vindas=config.ds_mensagem_boas_vindas,
                ds_mensagem_ausencia=config.ds_mensagem_ausencia,
                ds_mensagem_encerramento=config.ds_mensagem_encerramento,
                nr_tempo_inatividade=config.nr_tempo_inatividade,
                st_encerramento_automatico=config.st_encerramento_automatico,
                st_pesquisa_satisfacao=config.st_pesquisa_satisfacao,
            ),
            bot=ConfigBotSchema(
                st_bot_ativo=config.st_bot_ativo,
                st_transferencia_automatica=config.st_transferencia_automatica,
                nr_tentativas_antes_transferir=config.nr_tentativas_antes_transferir,
                ds_palavras_transferencia=config.ds_palavras_transferencia or [],
                st_resposta_ia=config.st_resposta_ia,
                nm_modelo_ia=config.nm_modelo_ia,
                nr_temperatura_ia=config.nr_temperatura_ia,
            ),
            horario=ConfigHorarioSchema(
                st_respeitar_horario=config.st_respeitar_horario,
                hr_inicio=config.hr_inicio,
                hr_fim=config.hr_fim,
                ds_dias_semana=config.ds_dias_semana or [],
                st_atender_feriados=config.st_atender_feriados,
            ),
            notificacoes=ConfigNotificacoesSchema(
                st_som_mensagem=config.st_som_mensagem,
                st_notificacao_desktop=config.st_notificacao_desktop,
                st_email_nova_conversa=config.st_email_nova_conversa,
                st_email_resumo_diario=config.st_email_resumo_diario,
                nm_email_notificacoes=config.nm_email_notificacoes,
            ),
            avancado=ConfigAvancadoSchema(
                ds_webhook_url=config.ds_webhook_url,
                st_webhook_ativo=config.st_webhook_ativo,
                st_rate_limiting=config.st_rate_limiting,
                ds_cor_widget=config.ds_cor_widget,
                ds_posicao_widget=config.ds_posicao_widget,
            ),
            dt_criacao=config.dt_criacao,
            dt_atualizacao=config.dt_atualizacao,
        )
