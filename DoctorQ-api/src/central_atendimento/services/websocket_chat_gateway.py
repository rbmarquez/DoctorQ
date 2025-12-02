# src/central_atendimento/services/websocket_chat_gateway.py
"""
Gateway WebSocket para chat em tempo real com suporte a Redis.

Este gateway suporta dois modos de operação:
- REDIS: Estado compartilhado via Redis Pub/Sub (produção com múltiplas instâncias)
- MEMORY: Estado em memória local (desenvolvimento ou single instance)

O modo é selecionado automaticamente baseado na disponibilidade do Redis.
"""

import asyncio
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Set, Optional, Any, List
from dataclasses import dataclass, field, asdict
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from src.config.logger_config import get_logger
from src.config.orm_config import get_async_session_context

logger = get_logger(__name__)


class ChatEventType(str, Enum):
    """Tipos de eventos do chat."""
    # Conexão
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    RECONNECTED = "reconnected"

    # Mensagens
    MESSAGE = "message"
    MESSAGE_SENT = "message_sent"
    MESSAGE_DELIVERED = "message_delivered"
    MESSAGE_READ = "message_read"

    # Status
    TYPING_START = "typing_start"
    TYPING_STOP = "typing_stop"
    PRESENCE = "presence"

    # Atendimento
    QUEUE_POSITION = "queue_position"
    ATTENDANT_JOINED = "attendant_joined"
    ATTENDANT_LEFT = "attendant_left"
    SESSION_STARTED = "session_started"
    SESSION_ENDED = "session_ended"
    TRANSFERRED = "transferred"

    # Sistema
    ERROR = "error"
    PING = "ping"
    PONG = "pong"


class ParticipantRole(str, Enum):
    """Papel do participante no chat."""
    CONTACT = "contact"  # Cliente/manifestante
    ATTENDANT = "attendant"  # Operador/atendente
    BOT = "bot"  # Assistente virtual
    SYSTEM = "system"  # Sistema


class GatewayMode(str, Enum):
    """Modo de operação do gateway."""
    MEMORY = "memory"  # Estado em memória local
    REDIS = "redis"    # Estado compartilhado via Redis


@dataclass
class ChatParticipant:
    """Participante de uma sessão de chat."""
    connection_id: str
    websocket: WebSocket
    role: ParticipantRole
    user_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    name: str = ""
    connected_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    last_ping: datetime = field(default_factory=datetime.utcnow)
    is_typing: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)
    instance_id: str = ""  # ID da instância que gerencia esta conexão


@dataclass
class ChatRoom:
    """Sala de chat (uma conversa)."""
    room_id: str  # conversa_id
    empresa_id: uuid.UUID
    participants: Dict[str, ChatParticipant] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


class WebSocketChatGateway:
    """
    Gateway para comunicação WebSocket de chat.

    Suporta dois modos de operação:
    - MEMORY: Estado em memória (default, para dev/single instance)
    - REDIS: Estado compartilhado via Redis Pub/Sub (produção multi-instance)

    Features:
    - Salas por conversa
    - Múltiplos participantes (contato, atendente, bot)
    - Typing indicators
    - Heartbeat/ping-pong
    - Reconexão com tolerância
    - Sincronização entre instâncias (modo Redis)
    """

    # Configurações
    PING_INTERVAL_SECONDS = 30
    PING_TIMEOUT_SECONDS = 10
    RECONNECT_GRACE_PERIOD_SECONDS = 30
    MAX_MESSAGE_SIZE = 65536  # 64KB

    # Redis keys prefixes
    REDIS_PREFIX_ROOM = "ws:chat:rooms:"
    REDIS_PREFIX_CONN = "ws:chat:connections:"
    REDIS_PREFIX_INSTANCE = "ws:chat:instance:"
    REDIS_CHANNEL_PREFIX = "ws:chat:channel:room:"
    REDIS_TTL_SECONDS = 300  # 5 minutos

    def __init__(self):
        """Inicializa o gateway."""
        # ID único desta instância (para identificar conexões locais)
        self._instance_id = str(uuid.uuid4())[:8]

        # Modo de operação (será definido no start)
        self._mode: GatewayMode = GatewayMode.MEMORY

        # Estado in-memory (sempre mantido para conexões locais)
        self._rooms: Dict[str, ChatRoom] = {}
        self._connections: Dict[str, ChatParticipant] = {}
        self._pending_reconnects: Dict[str, datetime] = {}

        # Redis client e pubsub
        self._redis = None
        self._pubsub = None
        self._subscribed_rooms: Set[str] = set()

        # Controle
        self._is_running = False
        self._ping_task: Optional[asyncio.Task] = None
        self._pubsub_task: Optional[asyncio.Task] = None
        self._message_handlers: List[callable] = []

        # Estatísticas
        self._stats = {
            "total_connections": 0,
            "total_messages": 0,
            "total_rooms": 0,
            "mode": "unknown",
            "instance_id": self._instance_id,
        }

    def register_message_handler(self, handler: callable):
        """
        Registra handler para processar mensagens recebidas.

        Args:
            handler: Callable async(room_id, participant, message_data)
        """
        self._message_handlers.append(handler)

    async def start(self):
        """Inicia o gateway (ping task e Redis se disponível)."""
        if self._is_running:
            return

        self._is_running = True

        # Tentar conectar ao Redis
        await self._initialize_redis()

        # Iniciar ping task
        self._ping_task = asyncio.create_task(self._ping_loop())

        # Se tiver Redis, iniciar listener do Pub/Sub
        if self._mode == GatewayMode.REDIS:
            self._pubsub_task = asyncio.create_task(self._pubsub_listener())

        self._stats["mode"] = self._mode.value
        logger.info(
            "WebSocketChatGateway iniciado (mode=%s, instance=%s)",
            self._mode.value,
            self._instance_id
        )

    async def _initialize_redis(self):
        """Tenta inicializar conexão com Redis."""
        try:
            from src.config.cache_config import get_cache_client, is_cache_enabled

            if not is_cache_enabled():
                logger.debug("Cache Redis não disponível, usando modo MEMORY")
                self._mode = GatewayMode.MEMORY
                return

            self._redis = await get_cache_client()

            if self._redis:
                # Testar conexão
                await self._redis.ping()

                # Criar pubsub
                self._pubsub = self._redis.pubsub()

                self._mode = GatewayMode.REDIS
                logger.info("Redis conectado - gateway em modo REDIS")
            else:
                self._mode = GatewayMode.MEMORY
                logger.debug("Redis client não disponível, usando modo MEMORY")

        except Exception as e:
            logger.warning("Falha ao conectar Redis: %s - usando modo MEMORY", str(e))
            self._mode = GatewayMode.MEMORY
            self._redis = None
            self._pubsub = None

    async def stop(self):
        """Para o gateway."""
        self._is_running = False

        # Cancelar tasks
        if self._ping_task:
            self._ping_task.cancel()
            try:
                await self._ping_task
            except asyncio.CancelledError:
                pass

        if self._pubsub_task:
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except asyncio.CancelledError:
                pass

        # Fechar todas as conexões locais
        for conn_id in list(self._connections.keys()):
            await self._close_connection(conn_id, "Gateway shutdown")

        # Limpar dados desta instância no Redis
        if self._mode == GatewayMode.REDIS and self._redis:
            try:
                await self._cleanup_instance_data()
            except Exception as e:
                logger.warning("Erro ao limpar dados do Redis: %s", str(e))

        # Fechar pubsub
        if self._pubsub:
            try:
                await self._pubsub.close()
            except Exception:
                pass

        logger.info("WebSocketChatGateway parado")

    async def _cleanup_instance_data(self):
        """Remove dados desta instância do Redis."""
        if not self._redis:
            return

        # Remover conexões desta instância
        instance_key = f"{self.REDIS_PREFIX_INSTANCE}{self._instance_id}:connections"
        conn_ids = await self._redis.smembers(instance_key)

        for conn_id in conn_ids:
            await self._redis.delete(f"{self.REDIS_PREFIX_CONN}{conn_id}")

        await self._redis.delete(instance_key)

    async def handle_connection(
        self,
        websocket: WebSocket,
        room_id: str,
        role: ParticipantRole,
        user_id: Optional[uuid.UUID] = None,
        contact_id: Optional[uuid.UUID] = None,
        empresa_id: Optional[uuid.UUID] = None,
        name: str = "",
    ) -> str:
        """
        Processa nova conexão WebSocket.

        Args:
            websocket: Conexão WebSocket
            room_id: ID da sala (conversa)
            role: Papel do participante
            user_id: ID do usuário (para atendentes)
            contact_id: ID do contato (para clientes)
            empresa_id: ID da empresa
            name: Nome para exibição

        Returns:
            ID da conexão
        """
        await websocket.accept()

        connection_id = str(uuid.uuid4())

        # Criar participante
        participant = ChatParticipant(
            connection_id=connection_id,
            websocket=websocket,
            role=role,
            user_id=user_id,
            contact_id=contact_id,
            name=name,
            instance_id=self._instance_id,
        )

        # Armazenar localmente (sempre)
        self._connections[connection_id] = participant
        self._stats["total_connections"] += 1

        # Adicionar à sala
        await self._join_room(room_id, participant, empresa_id)

        # Se modo Redis, armazenar estado e subscrever ao canal
        if self._mode == GatewayMode.REDIS:
            await self._store_connection_redis(connection_id, participant, room_id)
            await self._subscribe_room(room_id)

        # Enviar confirmação de conexão
        await self._send_to_participant(
            participant,
            ChatEventType.CONNECTED,
            {
                "connection_id": connection_id,
                "room_id": room_id,
                "role": role.value,
                "timestamp": datetime.utcnow().isoformat(),
                "mode": self._mode.value,
                "instance_id": self._instance_id,
            },
        )

        # Notificar outros participantes
        await self._broadcast_to_room(
            room_id,
            ChatEventType.PRESENCE,
            {
                "participant": {
                    "connection_id": connection_id,
                    "role": role.value,
                    "name": name,
                    "online": True,
                }
            },
            exclude={connection_id},
        )

        logger.debug(
            "Nova conexão chat: %s (room=%s, role=%s, mode=%s)",
            connection_id,
            room_id,
            role.value,
            self._mode.value,
        )

        # Iniciar loop de mensagens
        try:
            await self._message_loop(connection_id, room_id)
        except WebSocketDisconnect:
            pass
        finally:
            await self._handle_disconnect(connection_id, room_id)

        return connection_id

    async def _store_connection_redis(
        self,
        connection_id: str,
        participant: ChatParticipant,
        room_id: str
    ):
        """Armazena conexão no Redis."""
        if not self._redis:
            return

        try:
            # Dados do participante (serializáveis)
            conn_data = {
                "connection_id": connection_id,
                "instance_id": self._instance_id,
                "role": participant.role.value,
                "user_id": str(participant.user_id) if participant.user_id else "",
                "contact_id": str(participant.contact_id) if participant.contact_id else "",
                "name": participant.name,
                "room_id": room_id,
                "connected_at": participant.connected_at.isoformat(),
            }

            # Armazenar conexão
            conn_key = f"{self.REDIS_PREFIX_CONN}{connection_id}"
            await self._redis.hset(conn_key, mapping=conn_data)
            await self._redis.expire(conn_key, self.REDIS_TTL_SECONDS)

            # Registrar na lista de conexões desta instância
            instance_key = f"{self.REDIS_PREFIX_INSTANCE}{self._instance_id}:connections"
            await self._redis.sadd(instance_key, connection_id)

            # Adicionar à sala
            room_participants_key = f"{self.REDIS_PREFIX_ROOM}{room_id}:participants"
            await self._redis.sadd(room_participants_key, connection_id)

        except Exception as e:
            logger.warning("Erro ao armazenar conexão no Redis: %s", str(e))

    async def _subscribe_room(self, room_id: str):
        """Subscreve ao canal da room no Redis."""
        if not self._pubsub or room_id in self._subscribed_rooms:
            return

        try:
            channel = f"{self.REDIS_CHANNEL_PREFIX}{room_id}"
            await self._pubsub.subscribe(channel)
            self._subscribed_rooms.add(room_id)
            logger.debug("Subscrito ao canal: %s", channel)
        except Exception as e:
            logger.warning("Erro ao subscrever ao canal: %s", str(e))

    async def _pubsub_listener(self):
        """Escuta mensagens do Redis Pub/Sub."""
        while self._is_running:
            try:
                if not self._pubsub:
                    await asyncio.sleep(1)
                    continue

                # Aguardar até ter pelo menos uma subscription
                if not self._subscribed_rooms:
                    await asyncio.sleep(1)
                    continue

                message = await self._pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0
                )

                if message and message["type"] == "message":
                    await self._handle_pubsub_message(message)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Erro no pubsub listener: %s", str(e))
                await asyncio.sleep(1)

    async def _handle_pubsub_message(self, message: dict):
        """Processa mensagem recebida do Pub/Sub."""
        try:
            data = json.loads(message["data"])
            channel = message["channel"]

            # Extrair room_id do canal
            if isinstance(channel, bytes):
                channel = channel.decode()
            room_id = channel.replace(self.REDIS_CHANNEL_PREFIX, "")

            # Ignorar mensagens desta própria instância
            source_instance = data.get("source_instance", "")
            if source_instance == self._instance_id:
                return

            exclude = set(data.get("exclude", []))
            event_type = data.get("type", "")
            event_data = data.get("data", {})

            # Enviar para participantes locais desta room
            room = self._rooms.get(room_id)
            if not room:
                return

            for conn_id, participant in list(room.participants.items()):
                if conn_id in exclude:
                    continue

                await self._send_to_participant(
                    participant,
                    ChatEventType(event_type) if event_type else ChatEventType.MESSAGE,
                    event_data,
                )

        except Exception as e:
            logger.error("Erro ao processar mensagem Pub/Sub: %s", str(e))

    async def _publish_to_redis(self, room_id: str, event_type: str, data: dict, exclude: Set[str] = None):
        """Publica mensagem para o canal Redis da room."""
        if not self._redis or self._mode != GatewayMode.REDIS:
            return

        try:
            channel = f"{self.REDIS_CHANNEL_PREFIX}{room_id}"
            message = {
                "type": event_type,
                "data": data,
                "exclude": list(exclude) if exclude else [],
                "source_instance": self._instance_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await self._redis.publish(channel, json.dumps(message))
        except Exception as e:
            logger.warning("Erro ao publicar no Redis: %s", str(e))

    async def _join_room(
        self,
        room_id: str,
        participant: ChatParticipant,
        empresa_id: Optional[uuid.UUID],
    ):
        """Adiciona participante à sala (local)."""
        if room_id not in self._rooms:
            self._rooms[room_id] = ChatRoom(
                room_id=room_id,
                empresa_id=empresa_id or uuid.uuid4(),
            )
            self._stats["total_rooms"] += 1

        room = self._rooms[room_id]
        room.participants[participant.connection_id] = participant
        room.last_activity = datetime.utcnow()

    async def _message_loop(self, connection_id: str, room_id: str):
        """Loop de recebimento de mensagens."""
        participant = self._connections.get(connection_id)
        if not participant:
            return

        while self._is_running:
            try:
                data = await participant.websocket.receive_json()
                await self._handle_message(connection_id, room_id, data)
            except Exception as e:
                if "disconnect" in str(e).lower():
                    raise WebSocketDisconnect()
                logger.error("Erro ao receber mensagem: %s", str(e))
                break

    async def _handle_message(
        self,
        connection_id: str,
        room_id: str,
        data: Dict[str, Any],
    ):
        """Processa mensagem recebida."""
        participant = self._connections.get(connection_id)
        if not participant:
            return

        participant.last_activity = datetime.utcnow()

        event_type = data.get("type", "")
        payload = data.get("data", {})

        # Ping/Pong
        if event_type == ChatEventType.PING.value:
            participant.last_ping = datetime.utcnow()
            await self._send_to_participant(
                participant,
                ChatEventType.PONG,
                {"timestamp": datetime.utcnow().isoformat()},
            )
            # Renovar TTL no Redis
            if self._mode == GatewayMode.REDIS and self._redis:
                try:
                    conn_key = f"{self.REDIS_PREFIX_CONN}{connection_id}"
                    await self._redis.expire(conn_key, self.REDIS_TTL_SECONDS)
                except Exception:
                    pass
            return

        # Typing indicators
        if event_type == ChatEventType.TYPING_START.value:
            participant.is_typing = True
            await self._broadcast_to_room(
                room_id,
                ChatEventType.TYPING_START,
                {
                    "participant_id": connection_id,
                    "name": participant.name,
                },
                exclude={connection_id},
            )
            return

        if event_type == ChatEventType.TYPING_STOP.value:
            participant.is_typing = False
            await self._broadcast_to_room(
                room_id,
                ChatEventType.TYPING_STOP,
                {"participant_id": connection_id},
                exclude={connection_id},
            )
            return

        # Mensagem de chat
        if event_type == ChatEventType.MESSAGE.value:
            self._stats["total_messages"] += 1

            # Processar com handlers registrados
            for handler in self._message_handlers:
                try:
                    await handler(room_id, participant, payload)
                except Exception as e:
                    logger.error("Erro no handler de mensagem: %s", str(e))

            # Broadcast para sala
            await self._broadcast_to_room(
                room_id,
                ChatEventType.MESSAGE,
                {
                    "from": {
                        "connection_id": connection_id,
                        "role": participant.role.value,
                        "name": participant.name,
                    },
                    "content": payload.get("content", ""),
                    "type": payload.get("type", "text"),
                    "timestamp": datetime.utcnow().isoformat(),
                    "metadata": payload.get("metadata", {}),
                },
            )

            # Confirmar envio
            await self._send_to_participant(
                participant,
                ChatEventType.MESSAGE_SENT,
                {
                    "message_id": payload.get("message_id"),
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

    async def _handle_disconnect(self, connection_id: str, room_id: str):
        """Processa desconexão."""
        participant = self._connections.pop(connection_id, None)
        if not participant:
            return

        # Registrar para possível reconexão
        self._pending_reconnects[connection_id] = datetime.utcnow()

        # Remover da sala local
        room = self._rooms.get(room_id)
        if room:
            room.participants.pop(connection_id, None)

            # Notificar outros (local + Redis)
            await self._broadcast_to_room(
                room_id,
                ChatEventType.PRESENCE,
                {
                    "participant": {
                        "connection_id": connection_id,
                        "role": participant.role.value,
                        "name": participant.name,
                        "online": False,
                    }
                },
            )

            # Remover sala se vazia
            if not room.participants:
                self._rooms.pop(room_id, None)
                self._stats["total_rooms"] = max(0, self._stats["total_rooms"] - 1)
                self._subscribed_rooms.discard(room_id)

        # Limpar do Redis
        if self._mode == GatewayMode.REDIS and self._redis:
            try:
                await self._redis.delete(f"{self.REDIS_PREFIX_CONN}{connection_id}")
                instance_key = f"{self.REDIS_PREFIX_INSTANCE}{self._instance_id}:connections"
                await self._redis.srem(instance_key, connection_id)
                room_participants_key = f"{self.REDIS_PREFIX_ROOM}{room_id}:participants"
                await self._redis.srem(room_participants_key, connection_id)
            except Exception as e:
                logger.warning("Erro ao limpar conexão do Redis: %s", str(e))

        logger.debug("Desconexão chat: %s (room=%s)", connection_id, room_id)

    async def send_message_to_room(
        self,
        room_id: str,
        event_type: ChatEventType,
        data: Dict[str, Any],
        from_system: bool = True,
    ):
        """
        Envia mensagem para todos na sala (API externa).

        Args:
            room_id: ID da sala
            event_type: Tipo do evento
            data: Dados a enviar
            from_system: Se é mensagem do sistema
        """
        if from_system:
            data["from"] = {
                "role": ParticipantRole.SYSTEM.value,
                "name": "Sistema",
            }

        await self._broadcast_to_room(room_id, event_type, data)

    async def send_queue_position(
        self,
        room_id: str,
        position: int,
        total: int,
        message: str,
    ):
        """Envia atualização de posição na fila."""
        await self._broadcast_to_room(
            room_id,
            ChatEventType.QUEUE_POSITION,
            {
                "position": position,
                "total": total,
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def notify_attendant_joined(
        self,
        room_id: str,
        attendant_name: str,
        attendant_id: str,
    ):
        """Notifica que atendente entrou na conversa."""
        await self._broadcast_to_room(
            room_id,
            ChatEventType.ATTENDANT_JOINED,
            {
                "attendant_id": attendant_id,
                "name": attendant_name,
                "message": f"{attendant_name} entrou na conversa.",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def notify_session_ended(
        self,
        room_id: str,
        reason: str = "Atendimento finalizado",
    ):
        """Notifica fim da sessão."""
        await self._broadcast_to_room(
            room_id,
            ChatEventType.SESSION_ENDED,
            {
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def _broadcast_to_room(
        self,
        room_id: str,
        event_type: ChatEventType,
        data: Dict[str, Any],
        exclude: Optional[Set[str]] = None,
    ):
        """Envia mensagem para todos na sala (local + Redis)."""
        exclude = exclude or set()

        # Enviar para participantes locais
        room = self._rooms.get(room_id)
        if room:
            message = {
                "type": event_type.value,
                "data": data,
            }

            for conn_id, participant in list(room.participants.items()):
                if conn_id in exclude:
                    continue

                try:
                    if participant.websocket.client_state == WebSocketState.CONNECTED:
                        await participant.websocket.send_json(message)
                except Exception as e:
                    logger.debug("Erro ao enviar para %s: %s", conn_id, str(e))

        # Publicar no Redis para outras instâncias
        if self._mode == GatewayMode.REDIS:
            await self._publish_to_redis(room_id, event_type.value, data, exclude)

    async def _send_to_participant(
        self,
        participant: ChatParticipant,
        event_type: ChatEventType,
        data: Dict[str, Any],
    ):
        """Envia mensagem para um participante."""
        try:
            if participant.websocket.client_state == WebSocketState.CONNECTED:
                await participant.websocket.send_json({
                    "type": event_type.value,
                    "data": data,
                })
        except Exception as e:
            logger.debug(
                "Erro ao enviar para %s: %s",
                participant.connection_id,
                str(e),
            )

    async def _close_connection(self, connection_id: str, reason: str):
        """Fecha conexão específica."""
        participant = self._connections.get(connection_id)
        if not participant:
            return

        try:
            await participant.websocket.close(1000, reason)
        except Exception:
            pass

    async def _ping_loop(self):
        """Loop de ping para manter conexões ativas."""
        while self._is_running:
            await asyncio.sleep(self.PING_INTERVAL_SECONDS)

            now = datetime.utcnow()
            timeout = timedelta(seconds=self.PING_TIMEOUT_SECONDS + self.PING_INTERVAL_SECONDS)

            # Verificar conexões inativas
            for conn_id, participant in list(self._connections.items()):
                if now - participant.last_ping > timeout:
                    logger.debug(
                        "Conexão %s sem ping, fechando",
                        conn_id,
                    )
                    # A conexão será limpa pelo handler de disconnect

            # Limpar reconexões pendentes expiradas
            grace = timedelta(seconds=self.RECONNECT_GRACE_PERIOD_SECONDS)
            expired = [
                k for k, v in self._pending_reconnects.items()
                if now - v > grace
            ]
            for k in expired:
                self._pending_reconnects.pop(k, None)

    def get_room_participants(self, room_id: str) -> List[Dict[str, Any]]:
        """Obtém lista de participantes da sala (local)."""
        room = self._rooms.get(room_id)
        if not room:
            return []

        return [
            {
                "connection_id": p.connection_id,
                "role": p.role.value,
                "name": p.name,
                "connected_at": p.connected_at.isoformat(),
                "is_typing": p.is_typing,
            }
            for p in room.participants.values()
        ]

    async def get_room_participants_global(self, room_id: str) -> List[Dict[str, Any]]:
        """Obtém lista de participantes da sala (global, incluindo outras instâncias)."""
        if self._mode != GatewayMode.REDIS or not self._redis:
            return self.get_room_participants(room_id)

        try:
            room_participants_key = f"{self.REDIS_PREFIX_ROOM}{room_id}:participants"
            conn_ids = await self._redis.smembers(room_participants_key)

            participants = []
            for conn_id in conn_ids:
                if isinstance(conn_id, bytes):
                    conn_id = conn_id.decode()
                conn_key = f"{self.REDIS_PREFIX_CONN}{conn_id}"
                data = await self._redis.hgetall(conn_key)
                if data:
                    # Converter bytes para string se necessário
                    clean_data = {}
                    for k, v in data.items():
                        if isinstance(k, bytes):
                            k = k.decode()
                        if isinstance(v, bytes):
                            v = v.decode()
                        clean_data[k] = v
                    participants.append(clean_data)

            return participants
        except Exception as e:
            logger.warning("Erro ao obter participantes do Redis: %s", str(e))
            return self.get_room_participants(room_id)

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do gateway."""
        return {
            **self._stats,
            "active_connections": len(self._connections),
            "active_rooms": len(self._rooms),
            "pending_reconnects": len(self._pending_reconnects),
            "subscribed_rooms": len(self._subscribed_rooms),
        }

    def get_mode(self) -> str:
        """Retorna o modo de operação atual."""
        return self._mode.value

    def get_instance_id(self) -> str:
        """Retorna o ID desta instância."""
        return self._instance_id


# Singleton do gateway
_chat_gateway: Optional[WebSocketChatGateway] = None


def get_websocket_chat_gateway() -> WebSocketChatGateway:
    """Retorna instância singleton do gateway."""
    global _chat_gateway
    if _chat_gateway is None:
        _chat_gateway = WebSocketChatGateway()
    return _chat_gateway


async def _persist_message_handler(room_id: str, participant: "ChatParticipant", payload: Dict[str, Any]):
    """
    Handler para persistir mensagens recebidas via WebSocket no banco de dados.

    Args:
        room_id: ID da conversa (id_conversa)
        participant: Participante que enviou a mensagem
        payload: Dados da mensagem (content, type, etc.)
    """
    try:
        # Import aqui para evitar circular import
        from src.central_atendimento.services.conversa_service import ConversaOmniService
        from src.central_atendimento.models.conversa_omni import MensagemOmniCreate, MensagemTipo

        content = payload.get("content", "")
        if not content:
            return

        async with get_async_session_context() as db:
            # Obter a conversa para pegar o id_empresa
            from sqlalchemy import select
            from src.central_atendimento.models.conversa_omni import ConversaOmni

            result = await db.execute(
                select(ConversaOmni).where(ConversaOmni.id_conversa == room_id)
            )
            conversa = result.scalar_one_or_none()

            if not conversa:
                logger.warning(f"Conversa não encontrada para persistir mensagem: {room_id}")
                return

            # Mapear tipo de mensagem
            msg_type = payload.get("type", "text")
            tipo_mensagem = MensagemTipo.TEXTO
            if msg_type == "image":
                tipo_mensagem = MensagemTipo.IMAGEM
            elif msg_type == "audio":
                tipo_mensagem = MensagemTipo.AUDIO
            elif msg_type == "video":
                tipo_mensagem = MensagemTipo.VIDEO
            elif msg_type == "document":
                tipo_mensagem = MensagemTipo.DOCUMENTO

            # Determinar nome do remetente baseado no role
            nm_remetente = participant.name or "Visitante"
            st_entrada = participant.role == ParticipantRole.CONTACT

            # Criar mensagem
            conversa_service = ConversaOmniService(db, conversa.id_empresa)
            mensagem_dados = MensagemOmniCreate(
                id_conversa=room_id,
                nm_remetente=nm_remetente,
                tp_mensagem=tipo_mensagem,
                ds_conteudo=content,
                st_entrada=st_entrada,
            )

            mensagem = await conversa_service.criar_mensagem(mensagem_dados)
            logger.debug(f"Mensagem WebSocket persistida: id={mensagem.id_mensagem}, conversa={room_id}")

    except Exception as e:
        logger.error(f"Erro ao persistir mensagem WebSocket: {e}")


async def start_chat_gateway():
    """Inicia o gateway (chamar no lifespan)."""
    gateway = get_websocket_chat_gateway()

    # Registrar handler para persistir mensagens no banco
    gateway.register_message_handler(_persist_message_handler)
    logger.info("Handler de persistência de mensagens registrado")

    await gateway.start()


async def stop_chat_gateway():
    """Para o gateway (chamar no lifespan)."""
    gateway = get_websocket_chat_gateway()
    await gateway.stop()
