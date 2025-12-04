# src/central_atendimento/services/message_orchestrator_service.py
"""
Serviço de Orquestração de Mensagens.

Este serviço coordena todo o fluxo de processamento de mensagens recebidas,
integrando os diversos services da Central de Atendimento:

1. MessageQueueProcessor - Agrupamento de mensagens rápidas
2. SessionManager - Gerenciamento de sessões IA ↔ Humano
3. AudioTranscriptionService - Transcrição de áudios
4. HorarioAtendimentoService - Verificação de horário
5. WhatsAppService - Envio de respostas
6. FilaProcessorService - Roteamento para atendentes

Fluxo:
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│  Webhook    │───►│ Orchestrator │───►│ Session Check  │
└─────────────┘    └──────┬───────┘    └───────┬────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌────────────────┐
                   │ Message Queue│    │ IA ou Humano?  │
                   └──────┬───────┘    └───────┬────────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐    ┌────────────────┐
                   │ Audio Trans? │    │ Processa IA ou │
                   └──────┬───────┘    │ Encaminha Fila │
                          │            └────────────────┘
                          ▼
                   ┌──────────────┐
                   │ Horário OK?  │
                   └──────────────┘
"""

import uuid
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_async_session_context

# Services
from src.central_atendimento.services.message_queue_processor import (
    MessageQueueProcessor,
    MessageSource,
    QueuedMessage,
    get_message_queue_processor,
)
from src.central_atendimento.services.session_manager import (
    SessionManager,
    TipoAtendimento,
    AcaoColeta,
    MotivoTransferencia,
    get_session_manager,
)
from src.central_atendimento.services.audio_transcription_service import (
    AudioTranscriptionService,
    get_audio_transcription_service,
)
from src.central_atendimento.services.horario_atendimento_service import (
    HorarioAtendimentoService,
    StatusAtendimento,
    get_horario_atendimento_service,
)
from src.central_atendimento.services.websocket_notification_service import (
    WebSocketNotificationService,
    NotificationType,
    get_ws_notification_service,
)
from src.central_atendimento.services.contato_service import ContatoOmniService
from src.central_atendimento.services.conversa_service import ConversaOmniService
from src.central_atendimento.services.fila_service import FilaAtendimentoService
from src.central_atendimento.services.routing_service import RoutingService
from src.central_atendimento.services.whatsapp_service import WhatsAppService

from src.central_atendimento.models.canal import CanalTipo
from src.central_atendimento.models.conversa_omni import (
    MensagemOmniCreate,
    MensagemTipo,
    MensagemStatus,
)

logger = get_logger(__name__)


class ProcessingResult(str, Enum):
    """Resultado do processamento de mensagem."""
    QUEUED = "queued"  # Mensagem aguardando agrupamento
    PROCESSED_IA = "processed_ia"  # Processado pela IA
    TRANSFERRED_HUMAN = "transferred_human"  # Transferido para humano
    OUTSIDE_HOURS = "outside_hours"  # Fora do horário
    ERROR = "error"  # Erro no processamento


@dataclass
class ProcessedMessage:
    """Resultado do processamento de uma mensagem."""
    id_mensagem: Optional[uuid.UUID] = None
    id_conversa: Optional[uuid.UUID] = None
    id_contato: Optional[uuid.UUID] = None
    resultado: ProcessingResult = ProcessingResult.QUEUED
    resposta_enviada: bool = False
    texto_resposta: Optional[str] = None
    transcricao: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class MessageOrchestratorService:
    """
    Serviço central de orquestração de mensagens.

    Coordena o fluxo completo de processamento de mensagens recebidas
    através dos diversos services da Central de Atendimento.
    """

    def __init__(self):
        """Inicializa o orquestrador."""
        self._message_queue = get_message_queue_processor()
        self._session_manager = get_session_manager()
        self._transcription = get_audio_transcription_service()
        self._horario = get_horario_atendimento_service()
        self._ws_notification = get_ws_notification_service()

        # Registrar handler para processar mensagens agrupadas
        self._message_queue.register_handler(
            MessageSource.WHATSAPP,
            self._on_messages_grouped_handler
        )

        # Flag de inicialização
        self._initialized = False

    async def initialize(self):
        """Inicializa os services dependentes."""
        if self._initialized:
            return

        # Iniciar processador de fila de mensagens
        from src.central_atendimento.services.message_queue_processor import (
            start_message_queue_processor,
        )
        await start_message_queue_processor()

        self._initialized = True
        logger.info("MessageOrchestratorService inicializado")

    async def process_incoming_message(
        self,
        id_empresa: uuid.UUID,
        canal: CanalTipo,
        telefone: str,
        nome_contato: str,
        tipo_mensagem: MensagemTipo,
        conteudo: Optional[str],
        media_id: Optional[str] = None,
        media_url: Optional[str] = None,
        mime_type: Optional[str] = None,
        external_message_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ProcessedMessage:
        """
        Processa uma mensagem recebida.

        Este é o ponto de entrada principal para todas as mensagens
        recebidas via webhook.

        Args:
            id_empresa: ID da empresa (multi-tenant)
            canal: Tipo do canal (WHATSAPP, INSTAGRAM, etc.)
            telefone: Número do telefone do contato
            nome_contato: Nome do contato
            tipo_mensagem: Tipo da mensagem (TEXTO, AUDIO, IMAGEM, etc.)
            conteudo: Conteúdo da mensagem (texto ou caption)
            media_id: ID da mídia (para download)
            media_url: URL da mídia
            mime_type: Tipo MIME do arquivo
            external_message_id: ID externo da mensagem (WhatsApp, etc.)
            metadata: Metadados adicionais

        Returns:
            ProcessedMessage com resultado do processamento
        """
        result = ProcessedMessage(metadata=metadata or {})

        try:
            async with get_async_session_context() as db:
                # 1. Buscar ou criar contato
                contato_service = ContatoOmniService(db, id_empresa)
                contato, criado = await contato_service.obter_ou_criar(
                    telefone=telefone,
                    nome=nome_contato,
                    origem=canal.value,
                )
                result.id_contato = contato.id_contato

                # 2. Buscar ou criar conversa
                conversa_service = ConversaOmniService(db, id_empresa)
                conversa, _ = await conversa_service.obter_ou_criar_conversa(
                    id_contato=contato.id_contato,
                    tp_canal=canal,
                )
                result.id_conversa = conversa.id_conversa

                # 3. Transcrever áudio se necessário
                texto_processado = conteudo
                if tipo_mensagem == MensagemTipo.AUDIO and media_id:
                    transcricao = await self._transcribe_audio(
                        id_empresa, media_id, canal
                    )
                    if transcricao:
                        texto_processado = transcricao
                        result.transcricao = transcricao
                        logger.info(f"Áudio transcrito: {transcricao[:100]}...")

                # 4. Criar mensagem no banco
                mensagem_dados = MensagemOmniCreate(
                    id_conversa=conversa.id_conversa,
                    st_entrada=True,
                    nm_remetente=nome_contato,
                    tp_mensagem=tipo_mensagem,
                    ds_conteudo=texto_processado,
                    ds_url_midia=media_url or media_id,
                    nm_mime_type=mime_type,
                    ds_metadata={
                        "external_id": external_message_id,
                        "transcricao": result.transcricao,
                        **(metadata or {}),
                    },
                )
                mensagem = await conversa_service.criar_mensagem(mensagem_dados)
                result.id_mensagem = mensagem.id_mensagem

                # 5. Verificar horário de atendimento
                status_horario = await self._horario.verificar_horario_atendimento(
                    id_empresa
                )

                # 6. Adicionar à fila de agrupamento
                queued_msg = QueuedMessage(
                    id=str(mensagem.id_mensagem),
                    source=MessageSource.WHATSAPP,
                    sender_id=telefone,
                    content=texto_processado or "",
                    message_type=tipo_mensagem.value if hasattr(tipo_mensagem, 'value') else str(tipo_mensagem),
                    empresa_id=id_empresa,
                    # Campos adicionais para o orquestrador
                    id_mensagem=mensagem.id_mensagem,
                    id_conversa=conversa.id_conversa,
                    id_contato=contato.id_contato,
                    telefone=telefone,
                    nome_contato=nome_contato,
                    canal=canal,
                    metadata={
                        "em_horario": status_horario.em_atendimento,
                        "horario_status": status_horario.mensagem,
                        "external_id": external_message_id,
                    },
                )

                await self._message_queue.enqueue(queued_msg)
                result.resultado = ProcessingResult.QUEUED

                # 7. Notificar via WebSocket
                await self._ws_notification.notify(
                    id_empresa=id_empresa,
                    notification_type=NotificationType.NEW_MESSAGE,
                    data={
                        "id_conversa": str(conversa.id_conversa),
                        "id_mensagem": str(mensagem.id_mensagem),
                        "preview": (texto_processado or "")[:100],
                        "tipo": tipo_mensagem.value,
                        "contato": nome_contato,
                    },
                )

                # 8. Registrar interação do contato
                await contato_service.registrar_interacao(
                    contato.id_contato, entrada=True
                )

                logger.info(
                    f"Mensagem processada: {mensagem.id_mensagem} "
                    f"(conversa: {conversa.id_conversa})"
                )

        except Exception as e:
            logger.error(f"Erro ao processar mensagem: {e}", exc_info=True)
            result.resultado = ProcessingResult.ERROR
            result.metadata["error"] = str(e)

        return result

    async def _on_messages_grouped_handler(
        self,
        sender_id: str,
        combined_text: str,
        messages: List[QueuedMessage],
        media_messages: List[QueuedMessage],
        empresa_id: Optional[uuid.UUID],
        canal_id: Optional[uuid.UUID],
    ):
        """
        Handler chamado pelo MessageQueueProcessor.

        Este método adapta a assinatura do handler para o método interno.
        """
        await self._on_messages_grouped(messages)

    async def _on_messages_grouped(
        self,
        messages: List[QueuedMessage],
    ):
        """
        Callback chamado quando mensagens são agrupadas.

        Este método é chamado pelo MessageQueueProcessor quando
        um grupo de mensagens está pronto para processamento.
        """
        if not messages:
            return

        # Pegar dados do primeiro (todas do mesmo contato/conversa)
        first = messages[0]
        id_empresa = first.empresa_id
        id_conversa = first.id_conversa
        id_contato = first.id_contato
        telefone = first.telefone
        canal = first.canal

        # Concatenar conteúdo das mensagens
        conteudo_completo = "\n".join(
            m.content for m in messages if m.content
        )

        logger.info(
            f"Processando grupo de {len(messages)} mensagens "
            f"para conversa {id_conversa}"
        )

        try:
            async with get_async_session_context() as db:
                # Verificar horário de atendimento
                em_horario = first.metadata.get("em_horario", True)

                if not em_horario:
                    # Fora do horário - enviar mensagem automática
                    await self._send_outside_hours_response(
                        db, id_empresa, telefone, canal
                    )
                    return

                # Verificar sessão atual
                sessao = await self._session_manager.obter_sessao(id_conversa)

                if sessao and sessao.tipo_atendimento == TipoAtendimento.HUMANO:
                    # Já está em atendimento humano - notificar atendente
                    await self._notify_attendant(
                        id_empresa, id_conversa, conteudo_completo
                    )
                    return

                # Processar via IA (detectar intenção)
                resultado = await self._session_manager.processar_mensagem(
                    id_conversa=id_conversa,
                    conteudo=conteudo_completo,
                    id_empresa=id_empresa,
                )

                if resultado.get("transferir_humano"):
                    # Transferir para atendimento humano
                    await self._transfer_to_human(
                        db,
                        id_empresa,
                        id_conversa,
                        id_contato,
                        telefone,
                        canal,
                        resultado.get("motivo", MotivoTransferencia.SOLICITACAO_USUARIO),
                    )
                elif resultado.get("acao_coleta"):
                    # Coletar dados do usuário
                    await self._handle_data_collection(
                        db, id_empresa, id_conversa, telefone, canal, resultado
                    )
                else:
                    # Processar com IA normalmente
                    await self._process_with_ai(
                        db, id_empresa, id_conversa, id_contato,
                        telefone, canal, conteudo_completo
                    )

        except Exception as e:
            logger.error(f"Erro ao processar grupo de mensagens: {e}", exc_info=True)

    async def _transcribe_audio(
        self,
        id_empresa: uuid.UUID,
        media_id: str,
        canal: CanalTipo,
    ) -> Optional[str]:
        """Transcreve áudio usando o serviço de transcrição."""
        try:
            if canal == CanalTipo.WHATSAPP:
                return await self._transcription.transcribe_whatsapp_audio(
                    media_id, id_empresa
                )
            # Outros canais podem ter métodos diferentes
            return None
        except Exception as e:
            logger.error(f"Erro na transcrição de áudio: {e}")
            return None

    async def _send_outside_hours_response(
        self,
        db: AsyncSession,
        id_empresa: uuid.UUID,
        telefone: str,
        canal: CanalTipo,
    ):
        """Envia mensagem de fora do horário."""
        mensagem = await self._horario.obter_mensagem_fora_horario(id_empresa)

        if canal == CanalTipo.WHATSAPP:
            whatsapp = WhatsAppService(db, id_empresa)
            try:
                await whatsapp.enviar_mensagem_texto(telefone, mensagem)
                logger.info(f"Mensagem de fora do horário enviada para {telefone}")
            except Exception as e:
                logger.error(f"Erro ao enviar mensagem fora do horário: {e}")

    async def _notify_attendant(
        self,
        id_empresa: uuid.UUID,
        id_conversa: uuid.UUID,
        conteudo: str,
    ):
        """Notifica atendente sobre nova mensagem."""
        await self._ws_notification.notify(
            id_empresa=id_empresa,
            notification_type=NotificationType.NEW_MESSAGE,
            data={
                "id_conversa": str(id_conversa),
                "conteudo": conteudo[:200],
                "tipo": "atendimento_humano",
            },
        )

    async def _transfer_to_human(
        self,
        db: AsyncSession,
        id_empresa: uuid.UUID,
        id_conversa: uuid.UUID,
        id_contato: uuid.UUID,
        telefone: str,
        canal: CanalTipo,
        motivo: MotivoTransferencia,
    ):
        """Transfere conversa para atendimento humano."""
        # Transferir sessão
        await self._session_manager.transferir_para_humano(
            id_conversa=id_conversa,
            motivo=motivo,
        )

        # Adicionar à fila de atendimento
        routing = RoutingService(db, id_empresa)
        await routing.rotear_conversa(
            id_conversa=id_conversa,
            motivo=motivo.value,
        )

        # Notificar
        await self._ws_notification.notify(
            id_empresa=id_empresa,
            notification_type=NotificationType.QUEUE_UPDATE,
            data={
                "id_conversa": str(id_conversa),
                "acao": "nova_conversa_fila",
                "motivo": motivo.value,
            },
        )

        # Enviar mensagem ao cliente
        mensagem_transferencia = (
            "Entendi! Estou transferindo você para um de nossos atendentes. "
            "Por favor, aguarde um momento."
        )

        if canal == CanalTipo.WHATSAPP:
            whatsapp = WhatsAppService(db, id_empresa)
            try:
                await whatsapp.enviar_mensagem_texto(telefone, mensagem_transferencia)
            except Exception as e:
                logger.error(f"Erro ao enviar mensagem de transferência: {e}")

        logger.info(f"Conversa {id_conversa} transferida para atendimento humano")

    async def _handle_data_collection(
        self,
        db: AsyncSession,
        id_empresa: uuid.UUID,
        id_conversa: uuid.UUID,
        telefone: str,
        canal: CanalTipo,
        resultado: Dict[str, Any],
    ):
        """Processa coleta de dados do usuário."""
        acao = resultado.get("acao_coleta")
        prompt = resultado.get("prompt_coleta", "")

        if prompt and canal == CanalTipo.WHATSAPP:
            whatsapp = WhatsAppService(db, id_empresa)
            try:
                await whatsapp.enviar_mensagem_texto(telefone, prompt)
            except Exception as e:
                logger.error(f"Erro ao enviar prompt de coleta: {e}")

    async def _process_with_ai(
        self,
        db: AsyncSession,
        id_empresa: uuid.UUID,
        id_conversa: uuid.UUID,
        id_contato: uuid.UUID,
        telefone: str,
        canal: CanalTipo,
        conteudo: str,
    ):
        """
        Processa mensagem com IA usando o agente da Central de Atendimento.

        Integrado com o CentralAtendimentoAgentService que utiliza LangChain
        com tools específicas para clínicas estéticas.
        """
        try:
            from src.central_atendimento.services.central_agent_service import (
                get_central_agent_service,
            )

            # Obter nome do contato para personalização
            contato_service = ContatoOmniService(db, id_empresa)
            contato = await contato_service.obter(id_contato)
            nome_contato = contato.nm_contato if contato else None

            # Processar com o agente de IA
            agent_service = get_central_agent_service(db, id_empresa)
            resultado = await agent_service.processar_mensagem(
                mensagem=conteudo,
                id_conversa=id_conversa,
                nome_contato=nome_contato,
            )

            resposta = resultado.get("resposta", "Desculpe, não consegui processar sua mensagem.")

            # Verificar se precisa transferir para humano
            if resultado.get("transferir_humano"):
                await self._transfer_to_human(
                    db=db,
                    id_empresa=id_empresa,
                    id_conversa=id_conversa,
                    id_contato=id_contato,
                    telefone=telefone,
                    canal=canal,
                    motivo=MotivoTransferencia.SOLICITACAO_USUARIO,
                )
                return

            # Enviar resposta
            if canal == CanalTipo.WHATSAPP:
                whatsapp = WhatsAppService(db, id_empresa)
                try:
                    await whatsapp.enviar_mensagem_texto(telefone, resposta)

                    # Salvar resposta no banco
                    conversa_service = ConversaOmniService(db, id_empresa)
                    mensagem_dados = MensagemOmniCreate(
                        id_conversa=id_conversa,
                        st_entrada=False,
                        nm_remetente="Assistente IA",
                        tp_mensagem=MensagemTipo.TEXTO,
                        ds_conteudo=resposta,
                        ds_metadata={
                            "tools_usadas": resultado.get("tools_usadas", []),
                            "agente": "central_atendimento",
                        },
                    )
                    await conversa_service.criar_mensagem(mensagem_dados)

                    logger.info(
                        f"Resposta IA enviada para conversa {id_conversa} "
                        f"(tools: {resultado.get('tools_usadas', [])})"
                    )

                except Exception as e:
                    logger.error(f"Erro ao enviar resposta IA: {e}")

        except ImportError as e:
            logger.warning(f"Agente não disponível, usando resposta fallback: {e}")
            await self._send_fallback_response(db, id_empresa, id_conversa, telefone, canal)

        except Exception as e:
            logger.error(f"Erro ao processar com IA: {e}", exc_info=True)
            await self._send_fallback_response(db, id_empresa, id_conversa, telefone, canal)

    async def _send_fallback_response(
        self,
        db: AsyncSession,
        id_empresa: uuid.UUID,
        id_conversa: uuid.UUID,
        telefone: str,
        canal: CanalTipo,
    ):
        """Envia resposta fallback quando o agente não está disponível."""
        resposta = (
            "Olá! Sou o assistente virtual da clínica. "
            "Em que posso ajudá-lo hoje?\n\n"
            "Posso ajudar com:\n"
            "• Agendamento de consultas\n"
            "• Informações sobre procedimentos\n"
            "• Dúvidas gerais\n\n"
            "Digite 'atendente' para falar com uma pessoa."
        )

        if canal == CanalTipo.WHATSAPP:
            whatsapp = WhatsAppService(db, id_empresa)
            try:
                await whatsapp.enviar_mensagem_texto(telefone, resposta)

                # Salvar resposta no banco
                conversa_service = ConversaOmniService(db, id_empresa)
                mensagem_dados = MensagemOmniCreate(
                    id_conversa=id_conversa,
                    st_entrada=False,
                    nm_remetente="Assistente IA",
                    tp_mensagem=MensagemTipo.TEXTO,
                    ds_conteudo=resposta,
                )
                await conversa_service.criar_mensagem(mensagem_dados)

            except Exception as e:
                logger.error(f"Erro ao enviar resposta fallback: {e}")


# Singleton
_orchestrator: Optional[MessageOrchestratorService] = None


def get_message_orchestrator() -> MessageOrchestratorService:
    """Retorna instância singleton do orquestrador."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = MessageOrchestratorService()
    return _orchestrator


async def start_message_orchestrator():
    """Inicializa o orquestrador."""
    orchestrator = get_message_orchestrator()
    await orchestrator.initialize()
    logger.info("Message Orchestrator iniciado")


async def stop_message_orchestrator():
    """Para o orquestrador."""
    from src.central_atendimento.services.message_queue_processor import (
        stop_message_queue_processor,
    )
    await stop_message_queue_processor()
    logger.info("Message Orchestrator parado")
