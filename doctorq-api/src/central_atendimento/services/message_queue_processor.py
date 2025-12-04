# src/central_atendimento/services/message_queue_processor.py
"""
Processador de fila de mensagens com agrupamento inteligente.

Inspirado no ProcessQueueWhatsAppService do Maua, este serviço:
- Agrupa mensagens rápidas em uma única (evita fragmentação)
- Processa mensagens de WhatsApp/outros canais
- Integra com transcricao de audio
- Gerencia download/upload de mídia
"""

import asyncio
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class MessageSource(str, Enum):
    """Fonte da mensagem."""
    WHATSAPP = "whatsapp"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    WEBCHAT = "webchat"
    EMAIL = "email"
    SMS = "sms"


@dataclass
class QueuedMessage:
    """Mensagem na fila de processamento."""
    id: str
    source: MessageSource
    sender_id: str  # wa_id, ig_id, etc
    content: str
    message_type: str  # text, image, audio, document, etc
    media_url: Optional[str] = None
    media_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    empresa_id: Optional[uuid.UUID] = None
    canal_id: Optional[uuid.UUID] = None
    # Campos adicionais para integração com orquestrador
    id_mensagem: Optional[uuid.UUID] = None
    id_conversa: Optional[uuid.UUID] = None
    id_contato: Optional[uuid.UUID] = None
    telefone: Optional[str] = None
    nome_contato: Optional[str] = None
    canal: Optional[Any] = None  # CanalTipo


@dataclass
class MessageGroup:
    """Grupo de mensagens do mesmo remetente."""
    sender_id: str
    source: MessageSource
    messages: List[QueuedMessage] = field(default_factory=list)
    first_message_time: datetime = field(default_factory=datetime.utcnow)
    last_message_time: datetime = field(default_factory=datetime.utcnow)
    timer_task: Optional[asyncio.Task] = None
    empresa_id: Optional[uuid.UUID] = None
    canal_id: Optional[uuid.UUID] = None


class MessageQueueProcessor:
    """
    Processador de fila de mensagens com agrupamento inteligente.

    Inspirado no ProcessQueueWhatsAppService do Maua:
    - Agrupa mensagens enviadas rapidamente (dentro de GROUPING_DELAY)
    - Processa mídia (download, transcricao)
    - Emite eventos para processamento posterior
    """

    # Configurações
    GROUPING_DELAY_SECONDS = 2.0  # Tempo para agrupar mensagens
    PROCESS_INTERVAL_MS = 200  # Intervalo de processamento
    MAX_GROUP_SIZE = 10  # Máximo de mensagens por grupo
    MAX_GROUP_AGE_SECONDS = 10  # Tempo máximo de espera por grupo

    def __init__(self):
        """Inicializa o processador."""
        self._queue: asyncio.Queue = asyncio.Queue()
        self._message_groups: Dict[str, MessageGroup] = {}
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._handlers: Dict[MessageSource, List[Callable]] = {}
        self._stats = {
            "total_received": 0,
            "total_processed": 0,
            "total_grouped": 0,
            "groups_created": 0,
        }

    def register_handler(self, source: MessageSource, handler: Callable):
        """
        Registra handler para processar mensagens de uma fonte.

        Args:
            source: Fonte das mensagens (whatsapp, instagram, etc)
            handler: Callable async que recebe (sender_id, combined_text, messages)
        """
        if source not in self._handlers:
            self._handlers[source] = []
        self._handlers[source].append(handler)
        logger.debug("Handler registrado para fonte: %s", source.value)

    async def start(self):
        """Inicia o processador de fila."""
        if self._is_running:
            logger.warning("MessageQueueProcessor já está em execução")
            return

        self._is_running = True
        self._task = asyncio.create_task(self._process_loop())
        logger.info(
            "MessageQueueProcessor iniciado (grouping_delay=%.1fs, interval=%dms)",
            self.GROUPING_DELAY_SECONDS,
            self.PROCESS_INTERVAL_MS,
        )

    async def stop(self):
        """Para o processador de fila."""
        if not self._is_running:
            return

        self._is_running = False

        # Cancelar timers pendentes
        for group in self._message_groups.values():
            if group.timer_task and not group.timer_task.done():
                group.timer_task.cancel()

        # Processar grupos pendentes
        await self._flush_all_groups()

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info("MessageQueueProcessor parado. Stats: %s", self._stats)

    async def enqueue(self, message: QueuedMessage):
        """
        Adiciona mensagem à fila de processamento.

        Args:
            message: Mensagem para processar
        """
        self._stats["total_received"] += 1
        await self._queue.put(message)
        logger.debug(
            "Mensagem enfileirada: source=%s, sender=%s, type=%s",
            message.source.value,
            message.sender_id,
            message.message_type,
        )

    async def enqueue_webhook_payload(
        self,
        source: MessageSource,
        payload: Dict[str, Any],
        empresa_id: uuid.UUID,
        canal_id: uuid.UUID,
    ):
        """
        Processa payload de webhook e enfileira mensagens.

        Args:
            source: Fonte da mensagem
            payload: Payload do webhook (formato varia por fonte)
            empresa_id: ID da empresa
            canal_id: ID do canal
        """
        if source == MessageSource.WHATSAPP:
            await self._parse_whatsapp_webhook(payload, empresa_id, canal_id)
        elif source == MessageSource.INSTAGRAM:
            await self._parse_instagram_webhook(payload, empresa_id, canal_id)
        else:
            logger.warning("Webhook não suportado para fonte: %s", source.value)

    async def _parse_whatsapp_webhook(
        self,
        payload: Dict[str, Any],
        empresa_id: uuid.UUID,
        canal_id: uuid.UUID,
    ):
        """Parseia webhook do WhatsApp e enfileira mensagens."""
        try:
            entry = payload.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})

            messages = value.get("messages", [])
            contacts = value.get("contacts", [])

            for msg in messages:
                contact = next(
                    (c for c in contacts if c.get("wa_id") == msg.get("from")),
                    {}
                )

                message_type = msg.get("type", "text")
                content = ""
                media_url = None
                media_id = None

                if message_type == "text":
                    content = msg.get("text", {}).get("body", "")
                elif message_type in ("image", "audio", "video", "document"):
                    media_data = msg.get(message_type, {})
                    media_id = media_data.get("id")
                    content = media_data.get("caption", "")
                elif message_type == "location":
                    loc = msg.get("location", {})
                    content = f"Localização: {loc.get('latitude')}, {loc.get('longitude')}"
                elif message_type == "contacts":
                    contact_data = msg.get("contacts", [{}])[0]
                    content = f"Contato: {contact_data.get('name', {}).get('formatted_name', '')}"
                elif message_type == "interactive":
                    interactive = msg.get("interactive", {})
                    if interactive.get("type") == "button_reply":
                        content = interactive.get("button_reply", {}).get("title", "")
                    elif interactive.get("type") == "list_reply":
                        content = interactive.get("list_reply", {}).get("title", "")

                queued_msg = QueuedMessage(
                    id=msg.get("id", str(uuid.uuid4())),
                    source=MessageSource.WHATSAPP,
                    sender_id=msg.get("from", ""),
                    content=content,
                    message_type=message_type,
                    media_id=media_id,
                    metadata={
                        "wa_id": msg.get("from"),
                        "message_id": msg.get("id"),
                        "timestamp": msg.get("timestamp"),
                        "contact_name": contact.get("profile", {}).get("name"),
                        "phone_number_id": value.get("metadata", {}).get("phone_number_id"),
                    },
                    empresa_id=empresa_id,
                    canal_id=canal_id,
                )

                await self.enqueue(queued_msg)

        except Exception as e:
            logger.error("Erro ao parsear webhook WhatsApp: %s", str(e))

    async def _parse_instagram_webhook(
        self,
        payload: Dict[str, Any],
        empresa_id: uuid.UUID,
        canal_id: uuid.UUID,
    ):
        """Parseia webhook do Instagram e enfileira mensagens."""
        try:
            entry = payload.get("entry", [{}])[0]
            messaging = entry.get("messaging", [{}])[0]

            sender_id = messaging.get("sender", {}).get("id", "")
            message = messaging.get("message", {})

            content = message.get("text", "")
            message_type = "text"
            media_id = None

            # Verificar attachments
            attachments = message.get("attachments", [])
            if attachments:
                attachment = attachments[0]
                message_type = attachment.get("type", "text")
                media_id = attachment.get("payload", {}).get("url")

            queued_msg = QueuedMessage(
                id=message.get("mid", str(uuid.uuid4())),
                source=MessageSource.INSTAGRAM,
                sender_id=sender_id,
                content=content,
                message_type=message_type,
                media_id=media_id,
                metadata={
                    "ig_id": sender_id,
                    "message_id": message.get("mid"),
                    "timestamp": messaging.get("timestamp"),
                },
                empresa_id=empresa_id,
                canal_id=canal_id,
            )

            await self.enqueue(queued_msg)

        except Exception as e:
            logger.error("Erro ao parsear webhook Instagram: %s", str(e))

    async def _process_loop(self):
        """Loop principal de processamento."""
        while self._is_running:
            try:
                # Processar mensagens da fila
                while not self._queue.empty():
                    try:
                        message = self._queue.get_nowait()
                        await self._add_to_group(message)
                    except asyncio.QueueEmpty:
                        break

                # Verificar grupos antigos
                await self._check_old_groups()

            except Exception as e:
                logger.error("Erro no loop de processamento: %s", str(e))

            await asyncio.sleep(self.PROCESS_INTERVAL_MS / 1000)

    async def _add_to_group(self, message: QueuedMessage):
        """Adiciona mensagem a um grupo existente ou cria novo."""
        group_key = f"{message.source.value}:{message.sender_id}"

        if group_key in self._message_groups:
            group = self._message_groups[group_key]

            # Cancelar timer existente
            if group.timer_task and not group.timer_task.done():
                group.timer_task.cancel()

            # Adicionar ao grupo
            group.messages.append(message)
            group.last_message_time = datetime.utcnow()

            # Verificar se atingiu limite
            if len(group.messages) >= self.MAX_GROUP_SIZE:
                await self._process_group(group_key)
                return

            self._stats["total_grouped"] += 1

        else:
            # Criar novo grupo
            group = MessageGroup(
                sender_id=message.sender_id,
                source=message.source,
                messages=[message],
                empresa_id=message.empresa_id,
                canal_id=message.canal_id,
            )
            self._message_groups[group_key] = group
            self._stats["groups_created"] += 1

        # Agendar processamento após delay
        group.timer_task = asyncio.create_task(
            self._delayed_process(group_key)
        )

    async def _delayed_process(self, group_key: str):
        """Processa grupo após delay de agrupamento."""
        await asyncio.sleep(self.GROUPING_DELAY_SECONDS)
        await self._process_group(group_key)

    async def _check_old_groups(self):
        """Verifica e processa grupos muito antigos."""
        now = datetime.utcnow()
        max_age = timedelta(seconds=self.MAX_GROUP_AGE_SECONDS)

        old_groups = [
            key for key, group in self._message_groups.items()
            if now - group.first_message_time > max_age
        ]

        for group_key in old_groups:
            await self._process_group(group_key)

    async def _process_group(self, group_key: str):
        """Processa um grupo de mensagens."""
        if group_key not in self._message_groups:
            return

        group = self._message_groups.pop(group_key)

        # Cancelar timer se existir
        if group.timer_task and not group.timer_task.done():
            group.timer_task.cancel()

        if not group.messages:
            return

        # Combinar mensagens de texto
        text_messages = [
            m.content for m in group.messages
            if m.message_type == "text" and m.content
        ]
        combined_text = " ".join(text_messages)

        # Separar mensagens de mídia
        media_messages = [
            m for m in group.messages
            if m.message_type != "text"
        ]

        logger.debug(
            "Processando grupo: source=%s, sender=%s, messages=%d, text='%s...'",
            group.source.value,
            group.sender_id,
            len(group.messages),
            combined_text[:50] if combined_text else "(vazio)",
        )

        # Chamar handlers registrados
        handlers = self._handlers.get(group.source, [])
        for handler in handlers:
            try:
                await handler(
                    sender_id=group.sender_id,
                    combined_text=combined_text,
                    messages=group.messages,
                    media_messages=media_messages,
                    empresa_id=group.empresa_id,
                    canal_id=group.canal_id,
                )
            except Exception as e:
                logger.error(
                    "Erro ao executar handler para %s: %s",
                    group.source.value,
                    str(e),
                )

        self._stats["total_processed"] += len(group.messages)

    async def _flush_all_groups(self):
        """Processa todos os grupos pendentes (para shutdown)."""
        group_keys = list(self._message_groups.keys())
        for group_key in group_keys:
            await self._process_group(group_key)

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do processador."""
        return {
            **self._stats,
            "pending_groups": len(self._message_groups),
            "queue_size": self._queue.qsize(),
            "is_running": self._is_running,
        }


# Singleton do processador
_message_queue_processor: Optional[MessageQueueProcessor] = None


def get_message_queue_processor() -> MessageQueueProcessor:
    """Retorna instância singleton do processador."""
    global _message_queue_processor
    if _message_queue_processor is None:
        _message_queue_processor = MessageQueueProcessor()
    return _message_queue_processor


async def start_message_queue_processor():
    """Inicia o processador (chamar no lifespan)."""
    processor = get_message_queue_processor()
    await processor.start()


async def stop_message_queue_processor():
    """Para o processador (chamar no lifespan)."""
    processor = get_message_queue_processor()
    await processor.stop()
