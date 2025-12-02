# src/central_atendimento/services/websocket_notification_service.py
"""
Serviço de notificações via WebSocket para Central de Atendimento.

Suporta dois modos de operação:
- REDIS: Estado compartilhado via Redis Pub/Sub (produção com múltiplas instâncias)
- MEMORY: Estado em memória local (desenvolvimento ou single instance)

O modo é selecionado automaticamente baseado na disponibilidade do Redis.
"""

import asyncio
import uuid
import json
from datetime import datetime
from typing import Dict, Set, Optional, Any, List
from dataclasses import dataclass, field
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class NotificationType(str, Enum):
    """Tipos de notificação."""
    # Para atendentes
    NEW_TICKET = "new_ticket"
    TICKET_ASSIGNED = "ticket_assigned"
    TICKET_TRANSFERRED = "ticket_transferred"
    NEW_MESSAGE = "new_message"
    TICKET_CLOSED = "ticket_closed"

    # Para clientes/contatos
    QUEUE_POSITION = "queue_position"
    ATTENDANT_ASSIGNED = "attendant_assigned"
    MESSAGE_RECEIVED = "message_received"
    SESSION_ENDED = "session_ended"

    # Sistema
    SYSTEM_MESSAGE = "system_message"
    ERROR = "error"


class ServiceMode(str, Enum):
    """Modo de operação do serviço."""
    MEMORY = "memory"
    REDIS = "redis"


@dataclass
class WebSocketConnection:
    """Representa uma conexão WebSocket."""
    websocket: WebSocket
    user_id: Optional[uuid.UUID] = None
    empresa_id: Optional[uuid.UUID] = None
    conversa_id: Optional[uuid.UUID] = None
    role: str = "client"  # "attendant" ou "client"
    connected_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    instance_id: str = ""  # ID da instância que gerencia esta conexão


class WebSocketNotificationService:
    """
    Gerenciador de conexões WebSocket e notificações.

    Suporta dois modos de operação:
    - MEMORY: Estado em memória (default, para dev/single instance)
    - REDIS: Estado compartilhado via Redis Pub/Sub (produção multi-instance)

    Features:
    - Múltiplas conexões por usuário (diferentes dispositivos)
    - Salas por empresa e conversa
    - Broadcast para grupos específicos
    - Heartbeat para manter conexões ativas
    - Sincronização entre instâncias (modo Redis)
    """

    # Redis keys prefixes
    REDIS_PREFIX_CONN = "ws:notify:connections:"
    REDIS_PREFIX_USER = "ws:notify:user:"
    REDIS_PREFIX_EMPRESA = "ws:notify:empresa:"
    REDIS_PREFIX_CONVERSA = "ws:notify:conversa:"
    REDIS_PREFIX_ATTENDANTS = "ws:notify:attendants:"
    REDIS_PREFIX_INSTANCE = "ws:notify:instance:"
    REDIS_CHANNEL_USER = "ws:notify:channel:user:"
    REDIS_CHANNEL_EMPRESA = "ws:notify:channel:empresa:"
    REDIS_CHANNEL_CONVERSA = "ws:notify:channel:conversa:"
    REDIS_TTL_SECONDS = 300  # 5 minutos

    def __init__(self):
        """Inicializa o serviço."""
        # ID único desta instância
        self._instance_id = str(uuid.uuid4())[:8]

        # Modo de operação
        self._mode: ServiceMode = ServiceMode.MEMORY

        # Conexões ativas indexadas por ID único (locais)
        self._connections: Dict[str, WebSocketConnection] = {}

        # Índices para busca rápida (locais)
        self._by_user: Dict[str, Set[str]] = {}  # user_id -> connection_ids
        self._by_empresa: Dict[str, Set[str]] = {}  # empresa_id -> connection_ids
        self._by_conversa: Dict[str, Set[str]] = {}  # conversa_id -> connection_ids
        self._attendants: Dict[str, Set[str]] = {}  # empresa_id -> attendant connection_ids

        # Redis client e pubsub
        self._redis = None
        self._pubsub = None
        self._subscribed_channels: Set[str] = set()

        # Controle
        self._is_running = False
        self._pubsub_task: Optional[asyncio.Task] = None

    def _generate_connection_id(self) -> str:
        """Gera ID único para conexão."""
        return str(uuid.uuid4())

    async def start(self):
        """Inicia o serviço (conecta ao Redis se disponível)."""
        if self._is_running:
            return

        self._is_running = True

        # Tentar conectar ao Redis
        await self._initialize_redis()

        # Se tiver Redis, iniciar listener do Pub/Sub
        if self._mode == ServiceMode.REDIS:
            self._pubsub_task = asyncio.create_task(self._pubsub_listener())

        logger.info(
            "WebSocketNotificationService iniciado (mode=%s, instance=%s)",
            self._mode.value,
            self._instance_id
        )

    async def _initialize_redis(self):
        """Tenta inicializar conexão com Redis."""
        try:
            from src.config.cache_config import get_cache_client, is_cache_enabled

            if not is_cache_enabled():
                logger.debug("Cache Redis não disponível para notificações, usando modo MEMORY")
                self._mode = ServiceMode.MEMORY
                return

            self._redis = await get_cache_client()

            if self._redis:
                # Testar conexão
                await self._redis.ping()

                # Criar pubsub
                self._pubsub = self._redis.pubsub()

                self._mode = ServiceMode.REDIS
                logger.info("Redis conectado - notification service em modo REDIS")
            else:
                self._mode = ServiceMode.MEMORY
                logger.debug("Redis client não disponível para notificações, usando modo MEMORY")

        except Exception as e:
            logger.warning("Falha ao conectar Redis para notificações: %s - usando modo MEMORY", str(e))
            self._mode = ServiceMode.MEMORY
            self._redis = None
            self._pubsub = None

    async def stop(self):
        """Para o serviço."""
        self._is_running = False

        # Cancelar pubsub task
        if self._pubsub_task:
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except asyncio.CancelledError:
                pass

        # Limpar dados desta instância no Redis
        if self._mode == ServiceMode.REDIS and self._redis:
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

        logger.info("WebSocketNotificationService parado")

    async def _cleanup_instance_data(self):
        """Remove dados desta instância do Redis."""
        if not self._redis:
            return

        # Remover conexões desta instância
        instance_key = f"{self.REDIS_PREFIX_INSTANCE}{self._instance_id}:connections"
        conn_ids = await self._redis.smembers(instance_key)

        for conn_id in conn_ids:
            if isinstance(conn_id, bytes):
                conn_id = conn_id.decode()
            await self._redis.delete(f"{self.REDIS_PREFIX_CONN}{conn_id}")

        await self._redis.delete(instance_key)

    async def _pubsub_listener(self):
        """Escuta mensagens do Redis Pub/Sub."""
        while self._is_running:
            try:
                if not self._pubsub:
                    await asyncio.sleep(1)
                    continue

                # Aguardar até ter pelo menos uma subscription
                if not self._subscribed_channels:
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
                logger.error("Erro no pubsub listener de notificações: %s", str(e))
                await asyncio.sleep(1)

    async def _handle_pubsub_message(self, message: dict):
        """Processa mensagem recebida do Pub/Sub."""
        try:
            data = json.loads(message["data"])
            channel = message["channel"]

            if isinstance(channel, bytes):
                channel = channel.decode()

            # Ignorar mensagens desta própria instância
            source_instance = data.get("source_instance", "")
            if source_instance == self._instance_id:
                return

            notification_type = NotificationType(data.get("type", "system_message"))
            payload = data.get("data", {})

            # Determinar quais conexões locais devem receber
            target_conn_ids = set()

            if channel.startswith(self.REDIS_CHANNEL_USER):
                user_key = channel.replace(self.REDIS_CHANNEL_USER, "")
                target_conn_ids = self._by_user.get(user_key, set())

            elif channel.startswith(self.REDIS_CHANNEL_EMPRESA):
                empresa_key = channel.replace(self.REDIS_CHANNEL_EMPRESA, "")
                # Para attendants apenas
                if data.get("attendants_only", False):
                    target_conn_ids = self._attendants.get(empresa_key, set())
                else:
                    target_conn_ids = self._by_empresa.get(empresa_key, set())

            elif channel.startswith(self.REDIS_CHANNEL_CONVERSA):
                conversa_key = channel.replace(self.REDIS_CHANNEL_CONVERSA, "")
                target_conn_ids = self._by_conversa.get(conversa_key, set())

            # Enviar para conexões locais
            for conn_id in target_conn_ids:
                await self.send_to_connection(conn_id, notification_type, payload)

        except Exception as e:
            logger.error("Erro ao processar mensagem Pub/Sub de notificação: %s", str(e))

    async def _subscribe_channel(self, channel: str):
        """Subscreve a um canal Redis."""
        if not self._pubsub or channel in self._subscribed_channels:
            return

        try:
            await self._pubsub.subscribe(channel)
            self._subscribed_channels.add(channel)
        except Exception as e:
            logger.warning("Erro ao subscrever ao canal %s: %s", channel, str(e))

    async def _publish_to_channel(self, channel: str, notification_type: NotificationType, data: dict, attendants_only: bool = False):
        """Publica mensagem em um canal Redis."""
        if not self._redis or self._mode != ServiceMode.REDIS:
            return

        try:
            message = {
                "type": notification_type.value,
                "data": data,
                "source_instance": self._instance_id,
                "attendants_only": attendants_only,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await self._redis.publish(channel, json.dumps(message))
        except Exception as e:
            logger.warning("Erro ao publicar no canal %s: %s", channel, str(e))

    async def connect(
        self,
        websocket: WebSocket,
        user_id: Optional[uuid.UUID] = None,
        empresa_id: Optional[uuid.UUID] = None,
        conversa_id: Optional[uuid.UUID] = None,
        role: str = "client",
    ) -> str:
        """
        Registra uma nova conexão WebSocket.

        Args:
            websocket: Conexão WebSocket
            user_id: ID do usuário (atendente)
            empresa_id: ID da empresa
            conversa_id: ID da conversa (para clientes)
            role: Papel do usuário ("attendant" ou "client")

        Returns:
            ID único da conexão
        """
        await websocket.accept()

        connection_id = self._generate_connection_id()

        connection = WebSocketConnection(
            websocket=websocket,
            user_id=user_id,
            empresa_id=empresa_id,
            conversa_id=conversa_id,
            role=role,
            instance_id=self._instance_id,
        )

        # Registrar conexão localmente
        self._connections[connection_id] = connection

        # Atualizar índices locais
        if user_id:
            user_key = str(user_id)
            if user_key not in self._by_user:
                self._by_user[user_key] = set()
            self._by_user[user_key].add(connection_id)

        if empresa_id:
            empresa_key = str(empresa_id)
            if empresa_key not in self._by_empresa:
                self._by_empresa[empresa_key] = set()
            self._by_empresa[empresa_key].add(connection_id)

            # Se for atendente, adicionar ao índice de atendentes
            if role == "attendant":
                if empresa_key not in self._attendants:
                    self._attendants[empresa_key] = set()
                self._attendants[empresa_key].add(connection_id)

        if conversa_id:
            conversa_key = str(conversa_id)
            if conversa_key not in self._by_conversa:
                self._by_conversa[conversa_key] = set()
            self._by_conversa[conversa_key].add(connection_id)

        # Se modo Redis, armazenar e subscrever
        if self._mode == ServiceMode.REDIS:
            await self._store_connection_redis(connection_id, connection)

            # Subscrever aos canais relevantes
            if user_id:
                await self._subscribe_channel(f"{self.REDIS_CHANNEL_USER}{user_id}")
            if empresa_id:
                await self._subscribe_channel(f"{self.REDIS_CHANNEL_EMPRESA}{empresa_id}")
            if conversa_id:
                await self._subscribe_channel(f"{self.REDIS_CHANNEL_CONVERSA}{conversa_id}")

        logger.debug(
            "WebSocket conectado: %s (user=%s, empresa=%s, conversa=%s, role=%s, mode=%s)",
            connection_id,
            user_id,
            empresa_id,
            conversa_id,
            role,
            self._mode.value,
        )

        return connection_id

    async def _store_connection_redis(self, connection_id: str, connection: WebSocketConnection):
        """Armazena conexão no Redis."""
        if not self._redis:
            return

        try:
            conn_data = {
                "connection_id": connection_id,
                "instance_id": self._instance_id,
                "user_id": str(connection.user_id) if connection.user_id else "",
                "empresa_id": str(connection.empresa_id) if connection.empresa_id else "",
                "conversa_id": str(connection.conversa_id) if connection.conversa_id else "",
                "role": connection.role,
                "connected_at": connection.connected_at.isoformat(),
            }

            # Armazenar conexão
            conn_key = f"{self.REDIS_PREFIX_CONN}{connection_id}"
            await self._redis.hset(conn_key, mapping=conn_data)
            await self._redis.expire(conn_key, self.REDIS_TTL_SECONDS)

            # Registrar na lista desta instância
            instance_key = f"{self.REDIS_PREFIX_INSTANCE}{self._instance_id}:connections"
            await self._redis.sadd(instance_key, connection_id)

            # Adicionar aos índices Redis
            if connection.user_id:
                await self._redis.sadd(f"{self.REDIS_PREFIX_USER}{connection.user_id}", connection_id)
            if connection.empresa_id:
                await self._redis.sadd(f"{self.REDIS_PREFIX_EMPRESA}{connection.empresa_id}", connection_id)
                if connection.role == "attendant":
                    await self._redis.sadd(f"{self.REDIS_PREFIX_ATTENDANTS}{connection.empresa_id}", connection_id)
            if connection.conversa_id:
                await self._redis.sadd(f"{self.REDIS_PREFIX_CONVERSA}{connection.conversa_id}", connection_id)

        except Exception as e:
            logger.warning("Erro ao armazenar conexão no Redis: %s", str(e))

    async def disconnect(self, connection_id: str):
        """Remove uma conexão WebSocket."""
        if connection_id not in self._connections:
            return

        connection = self._connections[connection_id]

        # Remover dos índices locais
        if connection.user_id:
            user_key = str(connection.user_id)
            if user_key in self._by_user:
                self._by_user[user_key].discard(connection_id)

        if connection.empresa_id:
            empresa_key = str(connection.empresa_id)
            if empresa_key in self._by_empresa:
                self._by_empresa[empresa_key].discard(connection_id)
            if empresa_key in self._attendants:
                self._attendants[empresa_key].discard(connection_id)

        if connection.conversa_id:
            conversa_key = str(connection.conversa_id)
            if conversa_key in self._by_conversa:
                self._by_conversa[conversa_key].discard(connection_id)

        # Remover conexão local
        del self._connections[connection_id]

        # Limpar do Redis
        if self._mode == ServiceMode.REDIS and self._redis:
            try:
                await self._redis.delete(f"{self.REDIS_PREFIX_CONN}{connection_id}")
                instance_key = f"{self.REDIS_PREFIX_INSTANCE}{self._instance_id}:connections"
                await self._redis.srem(instance_key, connection_id)

                if connection.user_id:
                    await self._redis.srem(f"{self.REDIS_PREFIX_USER}{connection.user_id}", connection_id)
                if connection.empresa_id:
                    await self._redis.srem(f"{self.REDIS_PREFIX_EMPRESA}{connection.empresa_id}", connection_id)
                    await self._redis.srem(f"{self.REDIS_PREFIX_ATTENDANTS}{connection.empresa_id}", connection_id)
                if connection.conversa_id:
                    await self._redis.srem(f"{self.REDIS_PREFIX_CONVERSA}{connection.conversa_id}", connection_id)

            except Exception as e:
                logger.warning("Erro ao remover conexão do Redis: %s", str(e))

        logger.debug("WebSocket desconectado: %s", connection_id)

    async def send_to_connection(
        self,
        connection_id: str,
        notification_type: NotificationType,
        data: Dict[str, Any],
    ) -> bool:
        """Envia mensagem para uma conexão específica (local)."""
        if connection_id not in self._connections:
            return False

        connection = self._connections[connection_id]

        try:
            message = {
                "type": notification_type.value,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await connection.websocket.send_json(message)
            connection.last_activity = datetime.utcnow()
            return True
        except Exception as e:
            logger.error("Erro ao enviar mensagem para %s: %s", connection_id, str(e))
            await self.disconnect(connection_id)
            return False

    async def send_to_user(
        self,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        data: Dict[str, Any],
    ) -> int:
        """Envia mensagem para todas as conexões de um usuário."""
        user_key = str(user_id)

        # Enviar para conexões locais
        count = 0
        if user_key in self._by_user:
            for connection_id in list(self._by_user[user_key]):
                if await self.send_to_connection(connection_id, notification_type, data):
                    count += 1

        # Publicar no Redis para outras instâncias
        if self._mode == ServiceMode.REDIS:
            await self._publish_to_channel(
                f"{self.REDIS_CHANNEL_USER}{user_id}",
                notification_type,
                data
            )

        return count

    async def send_to_conversa(
        self,
        conversa_id: uuid.UUID,
        notification_type: NotificationType,
        data: Dict[str, Any],
    ) -> int:
        """Envia mensagem para todas as conexões de uma conversa."""
        conversa_key = str(conversa_id)

        # Enviar para conexões locais
        count = 0
        if conversa_key in self._by_conversa:
            for connection_id in list(self._by_conversa[conversa_key]):
                if await self.send_to_connection(connection_id, notification_type, data):
                    count += 1

        # Publicar no Redis para outras instâncias
        if self._mode == ServiceMode.REDIS:
            await self._publish_to_channel(
                f"{self.REDIS_CHANNEL_CONVERSA}{conversa_id}",
                notification_type,
                data
            )

        return count

    async def send_to_empresa_attendants(
        self,
        empresa_id: uuid.UUID,
        notification_type: NotificationType,
        data: Dict[str, Any],
    ) -> int:
        """Envia mensagem para todos os atendentes de uma empresa."""
        empresa_key = str(empresa_id)

        # Enviar para conexões locais
        count = 0
        if empresa_key in self._attendants:
            for connection_id in list(self._attendants[empresa_key]):
                if await self.send_to_connection(connection_id, notification_type, data):
                    count += 1

        # Publicar no Redis para outras instâncias
        if self._mode == ServiceMode.REDIS:
            await self._publish_to_channel(
                f"{self.REDIS_CHANNEL_EMPRESA}{empresa_id}",
                notification_type,
                data,
                attendants_only=True
            )

        return count

    async def broadcast_to_empresa(
        self,
        empresa_id: uuid.UUID,
        notification_type: NotificationType,
        data: Dict[str, Any],
    ) -> int:
        """Envia mensagem para todas as conexões de uma empresa."""
        empresa_key = str(empresa_id)

        # Enviar para conexões locais
        count = 0
        if empresa_key in self._by_empresa:
            for connection_id in list(self._by_empresa[empresa_key]):
                if await self.send_to_connection(connection_id, notification_type, data):
                    count += 1

        # Publicar no Redis para outras instâncias
        if self._mode == ServiceMode.REDIS:
            await self._publish_to_channel(
                f"{self.REDIS_CHANNEL_EMPRESA}{empresa_id}",
                notification_type,
                data,
                attendants_only=False
            )

        return count

    # Métodos de conveniência para tipos específicos de notificação

    async def notify_new_ticket(
        self,
        empresa_id: uuid.UUID,
        attendant_id: uuid.UUID,
        ticket_data: Dict[str, Any],
    ):
        """Notifica atendente sobre novo ticket."""
        await self.send_to_user(
            attendant_id,
            NotificationType.NEW_TICKET,
            ticket_data,
        )

    async def notify_queue_position(
        self,
        conversa_id: uuid.UUID,
        position: int,
        total: int,
        message: str,
    ):
        """Notifica cliente sobre posição na fila."""
        await self.send_to_conversa(
            conversa_id,
            NotificationType.QUEUE_POSITION,
            {
                "position": position,
                "total": total,
                "message": message,
                "is_waiting": position > 0,
            },
        )

    async def notify_new_message(
        self,
        conversa_id: uuid.UUID,
        message_data: Dict[str, Any],
    ):
        """Notifica sobre nova mensagem na conversa."""
        await self.send_to_conversa(
            conversa_id,
            NotificationType.NEW_MESSAGE,
            message_data,
        )

    async def notify_attendant_assigned(
        self,
        conversa_id: uuid.UUID,
        attendant_name: str,
    ):
        """Notifica cliente que atendente foi atribuído."""
        await self.send_to_conversa(
            conversa_id,
            NotificationType.ATTENDANT_ASSIGNED,
            {
                "attendant_name": attendant_name,
                "message": f"Olá! Meu nome é {attendant_name}. Como posso ajudar você hoje?",
            },
        )

    async def notify(
        self,
        id_empresa: uuid.UUID,
        notification_type: NotificationType,
        data: Dict[str, Any],
    ) -> int:
        """
        Método genérico de notificação.

        Envia para todos os atendentes da empresa.

        Args:
            id_empresa: ID da empresa
            notification_type: Tipo de notificação
            data: Dados da notificação

        Returns:
            Número de notificações enviadas
        """
        return await self.send_to_empresa_attendants(
            id_empresa,
            notification_type,
            data,
        )

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas das conexões."""
        return {
            "mode": self._mode.value,
            "instance_id": self._instance_id,
            "total_connections": len(self._connections),
            "users_connected": len(self._by_user),
            "empresas_active": len(self._by_empresa),
            "conversas_active": len(self._by_conversa),
            "attendants_online": sum(len(v) for v in self._attendants.values()),
            "subscribed_channels": len(self._subscribed_channels),
        }

    def get_mode(self) -> str:
        """Retorna o modo de operação atual."""
        return self._mode.value

    def get_instance_id(self) -> str:
        """Retorna o ID desta instância."""
        return self._instance_id


# Singleton do serviço
_ws_notification_service: Optional[WebSocketNotificationService] = None


def get_ws_notification_service() -> WebSocketNotificationService:
    """Retorna instância singleton do serviço de notificações."""
    global _ws_notification_service
    if _ws_notification_service is None:
        _ws_notification_service = WebSocketNotificationService()
    return _ws_notification_service


async def start_notification_service():
    """Inicia o serviço de notificações (chamar no lifespan)."""
    service = get_ws_notification_service()
    await service.start()


async def stop_notification_service():
    """Para o serviço de notificações (chamar no lifespan)."""
    service = get_ws_notification_service()
    await service.stop()
