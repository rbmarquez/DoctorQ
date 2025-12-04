# src/central_atendimento/services/config_service.py
"""
Serviço para gerenciamento de configurações da Central de Atendimento.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.config.logger_config import get_logger
from src.central_atendimento.models.config_central import (
    ConfigCentralAtendimento,
    ConfigCentralCreate,
    ConfigCentralUpdate,
    ConfigCentralResponse,
)

logger = get_logger(__name__)


class ConfigCentralService:
    """Serviço para operações de configuração."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def obter(self) -> Optional[ConfigCentralAtendimento]:
        """Obtém a configuração da empresa."""
        stmt = select(ConfigCentralAtendimento).where(
            ConfigCentralAtendimento.id_empresa == self.id_empresa
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_ou_criar(self) -> ConfigCentralAtendimento:
        """
        Obtém a configuração existente ou cria uma nova com valores padrão.

        Returns:
            ConfigCentralAtendimento
        """
        config = await self.obter()
        if config:
            return config

        # Criar configuração padrão
        config = ConfigCentralAtendimento(
            id_empresa=self.id_empresa,
            nm_empresa_chat="Atendimento",
            ds_mensagem_boas_vindas="Olá! Bem-vindo. Como posso ajudá-lo hoje?",
            ds_mensagem_ausencia="No momento nosso atendimento está indisponível. Retornaremos em breve!",
            ds_mensagem_encerramento="Obrigado pelo contato! Esperamos ter ajudado. Até logo!",
        )

        self.db.add(config)
        await self.db.commit()
        await self.db.refresh(config)

        logger.info(f"Configuração criada para empresa {self.id_empresa}")
        return config

    async def atualizar(self, dados: ConfigCentralUpdate) -> ConfigCentralAtendimento:
        """
        Atualiza a configuração da empresa.

        Args:
            dados: ConfigCentralUpdate com os dados a atualizar

        Returns:
            ConfigCentralAtendimento atualizada
        """
        config = await self.obter_ou_criar()

        # Atualizar configurações gerais
        if dados.geral:
            config.nm_empresa_chat = dados.geral.nm_empresa_chat
            config.ds_mensagem_boas_vindas = dados.geral.ds_mensagem_boas_vindas
            config.ds_mensagem_ausencia = dados.geral.ds_mensagem_ausencia
            config.ds_mensagem_encerramento = dados.geral.ds_mensagem_encerramento
            config.nr_tempo_inatividade = dados.geral.nr_tempo_inatividade
            config.st_encerramento_automatico = dados.geral.st_encerramento_automatico
            config.st_pesquisa_satisfacao = dados.geral.st_pesquisa_satisfacao

        # Atualizar configurações do bot
        if dados.bot:
            config.st_bot_ativo = dados.bot.st_bot_ativo
            config.st_transferencia_automatica = dados.bot.st_transferencia_automatica
            config.nr_tentativas_antes_transferir = dados.bot.nr_tentativas_antes_transferir
            config.ds_palavras_transferencia = dados.bot.ds_palavras_transferencia
            config.st_resposta_ia = dados.bot.st_resposta_ia
            config.nm_modelo_ia = dados.bot.nm_modelo_ia
            config.nr_temperatura_ia = dados.bot.nr_temperatura_ia

        # Atualizar configurações de horário
        if dados.horario:
            config.st_respeitar_horario = dados.horario.st_respeitar_horario
            config.hr_inicio = dados.horario.hr_inicio
            config.hr_fim = dados.horario.hr_fim
            config.ds_dias_semana = dados.horario.ds_dias_semana
            config.st_atender_feriados = dados.horario.st_atender_feriados

        # Atualizar configurações de notificações
        if dados.notificacoes:
            config.st_som_mensagem = dados.notificacoes.st_som_mensagem
            config.st_notificacao_desktop = dados.notificacoes.st_notificacao_desktop
            config.st_email_nova_conversa = dados.notificacoes.st_email_nova_conversa
            config.st_email_resumo_diario = dados.notificacoes.st_email_resumo_diario
            config.nm_email_notificacoes = dados.notificacoes.nm_email_notificacoes

        # Atualizar configurações avançadas
        if dados.avancado:
            config.ds_webhook_url = dados.avancado.ds_webhook_url
            config.st_webhook_ativo = dados.avancado.st_webhook_ativo
            config.st_rate_limiting = dados.avancado.st_rate_limiting
            config.ds_cor_widget = dados.avancado.ds_cor_widget
            config.ds_posicao_widget = dados.avancado.ds_posicao_widget

        await self.db.commit()
        await self.db.refresh(config)

        logger.info(f"Configuração atualizada para empresa {self.id_empresa}")
        return config

    async def resetar(self) -> ConfigCentralAtendimento:
        """
        Reseta a configuração para valores padrão.

        Returns:
            ConfigCentralAtendimento com valores padrão
        """
        config = await self.obter()
        if config:
            await self.db.delete(config)
            await self.db.commit()

        return await self.obter_ou_criar()
