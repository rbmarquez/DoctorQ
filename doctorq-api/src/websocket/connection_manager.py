"""
WebSocket Connection Manager para Chat em Tempo Real
"""

from typing import Dict, List, Set
from fastapi import WebSocket
from src.config.logger_config import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """Gerenciador de conexões WebSocket para chat em tempo real"""

    def __init__(self):
        # user_id -> lista de WebSockets (suporta múltiplas conexões)
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # conversa_id -> set de user_ids conectados
        self.conversation_users: Dict[str, Set[str]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Aceitar nova conexão WebSocket"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket conectado: user_id={user_id}, total={len(self.active_connections[user_id])}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        """Remover conexão WebSocket"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
                logger.info(f"WebSocket desconectado: user_id={user_id}")

            # Remover user se não tiver mais conexões
            if len(self.active_connections[user_id]) == 0:
                del self.active_connections[user_id]

        # Remover de todas as conversas
        for conversa_id in list(self.conversation_users.keys()):
            if user_id in self.conversation_users[conversa_id]:
                self.conversation_users[conversa_id].remove(user_id)
                if len(self.conversation_users[conversa_id]) == 0:
                    del self.conversation_users[conversa_id]

    def join_conversation(self, user_id: str, conversa_id: str):
        """Adicionar usuário a uma conversa"""
        if conversa_id not in self.conversation_users:
            self.conversation_users[conversa_id] = set()

        self.conversation_users[conversa_id].add(user_id)
        logger.info(f"Usuário {user_id} entrou na conversa {conversa_id}")

    def leave_conversation(self, user_id: str, conversa_id: str):
        """Remover usuário de uma conversa"""
        if conversa_id in self.conversation_users:
            self.conversation_users[conversa_id].discard(user_id)

            if len(self.conversation_users[conversa_id]) == 0:
                del self.conversation_users[conversa_id]

        logger.info(f"Usuário {user_id} saiu da conversa {conversa_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Enviar mensagem para um usuário específico (todas as suas conexões)"""
        if user_id in self.active_connections:
            disconnected = []

            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Erro ao enviar mensagem para {user_id}: {str(e)}")
                    disconnected.append(websocket)

            # Remover conexões com erro
            for websocket in disconnected:
                self.disconnect(user_id, websocket)

    async def broadcast_to_conversation(self, message: dict, conversa_id: str, exclude_user: str = None):
        """Enviar mensagem para todos os usuários de uma conversa"""
        if conversa_id in self.conversation_users:
            for user_id in self.conversation_users[conversa_id]:
                # Não enviar para o remetente
                if exclude_user and user_id == exclude_user:
                    continue

                await self.send_personal_message(message, user_id)

    async def broadcast_all(self, message: dict):
        """Broadcast para todos os usuários conectados"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)

    def get_connected_users(self, conversa_id: str = None) -> List[str]:
        """Obter lista de usuários conectados (opcionalmente filtrados por conversa)"""
        if conversa_id:
            return list(self.conversation_users.get(conversa_id, set()))
        else:
            return list(self.active_connections.keys())

    def is_user_online(self, user_id: str) -> bool:
        """Verificar se usuário está online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_stats(self) -> dict:
        """Obter estatísticas das conexões"""
        total_connections = sum(len(conns) for conns in self.active_connections.values())
        total_users = len(self.active_connections)
        total_conversations = len(self.conversation_users)

        return {
            "total_connections": total_connections,
            "total_users": total_users,
            "total_conversations": total_conversations,
            "users_online": list(self.active_connections.keys()),
        }


# Singleton global
manager = ConnectionManager()
