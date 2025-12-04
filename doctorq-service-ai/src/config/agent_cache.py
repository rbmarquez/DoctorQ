# src/config/agent_cache.py
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class AgentCache:
    """
    Cache singleton para agentes e ferramentas para melhorar performance.
    Evita recarregar configuraÃ§Ãµes pesadas a cada requisiÃ§Ã£o.
    """

    _instance: Optional["AgentCache"] = None
    _lock = asyncio.Lock()

    def __new__(cls) -> "AgentCache":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized"):
            return

        self._initialized = True
        self._agents_cache: Dict[str, Any] = {}
        self._tools_cache: Dict[uuid.UUID, List[Any]] = {}
        self._agent_executors_cache: Dict[str, Any] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        self._cache_ttl = timedelta(minutes=30)  # 30 minutos de TTL

        logger.info("AgentCache inicializado")

    async def get_agent_executor(self, agent_id: uuid.UUID, filter_sources: Optional[List[str]] = None) -> Optional[Any]:
        """
        Obter AgentExecutor do cache ou criar se nÃ£o existir.

        Args:
            agent_id: ID do agente
            filter_sources: Lista de sources para filtrar tools (usado na chave de cache)

        Returns:
            AgentExecutor ou None se nÃ£o encontrado
        """
        async with self._lock:
            # Gerar chave de cache que inclui filtros para evitar conflitos
            filter_key = str(sorted(filter_sources)) if filter_sources else "no_filter"
            cache_key = f"{agent_id}_{filter_key}"

            # Verificar se existe no cache e nÃ£o estÃ¡ expirado
            if cache_key in self._agent_executors_cache:
                timestamp = self._cache_timestamps.get(f"executor_{cache_key}")
                if timestamp and (datetime.now() - timestamp) < self._cache_ttl:
                    logger.debug(f"AgentExecutor encontrado no cache: {agent_id} (filtros: {filter_sources})")
                    return self._agent_executors_cache[cache_key]

                # Expirado, remover do cache
                logger.debug(f"AgentExecutor expirado no cache: {agent_id} (filtros: {filter_sources})")
                self._agent_executors_cache.pop(cache_key, None)
                self._cache_timestamps.pop(f"executor_{cache_key}", None)

            return None

    async def set_agent_executor(self, agent_id: uuid.UUID, executor: Any, filter_sources: Optional[List[str]] = None) -> None:
        """
        Armazenar AgentExecutor no cache.

        Args:
            agent_id: ID do agente
            executor: AgentExecutor para cachear
            filter_sources: Lista de sources para filtrar tools (usado na chave de cache)
        """
        async with self._lock:
            # Gerar chave de cache que inclui filtros para evitar conflitos
            filter_key = str(sorted(filter_sources)) if filter_sources else "no_filter"
            cache_key = f"{agent_id}_{filter_key}"
            self._agent_executors_cache[cache_key] = executor
            self._cache_timestamps[f"executor_{cache_key}"] = datetime.now()
            logger.debug(f"AgentExecutor armazenado no cache: {agent_id} (filtros: {filter_sources})")

    async def get_agent_tools(self, agent_id: uuid.UUID) -> Optional[List[Any]]:
        """
        Obter ferramentas do agente do cache.

        Args:
            agent_id: ID do agente

        Returns:
            Lista de ferramentas ou None se nÃ£o encontrado
        """
        async with self._lock:
            if agent_id in self._tools_cache:
                timestamp = self._cache_timestamps.get(f"tools_{agent_id}")
                if timestamp and (datetime.now() - timestamp) < self._cache_ttl:
                    logger.debug(f"Ferramentas encontradas no cache: {agent_id}")
                    return self._tools_cache[agent_id]

                # Expirado, remover do cache
                logger.debug(f"Ferramentas expiradas no cache: {agent_id}")
                self._tools_cache.pop(agent_id, None)
                self._cache_timestamps.pop(f"tools_{agent_id}", None)

            return None

    async def set_agent_tools(self, agent_id: uuid.UUID, tools: List[Any]) -> None:
        """
        Armazenar ferramentas do agente no cache.

        Args:
            agent_id: ID do agente
            tools: Lista de ferramentas para cachear
        """
        async with self._lock:
            self._tools_cache[agent_id] = tools
            self._cache_timestamps[f"tools_{agent_id}"] = datetime.now()
            logger.debug(
                f"Ferramentas armazenadas no cache: {agent_id}, total: {len(tools)}"
            )

    async def get_agent_config(self, agent_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Obter configuraÃ§Ã£o do agente do cache.

        Args:
            agent_id: ID do agente

        Returns:
            ConfiguraÃ§Ã£o do agente ou None se nÃ£o encontrado
        """
        async with self._lock:
            cache_key = str(agent_id)
            if cache_key in self._agents_cache:
                timestamp = self._cache_timestamps.get(f"config_{cache_key}")
                if timestamp and (datetime.now() - timestamp) < self._cache_ttl:
                    logger.debug(
                        f"ConfiguraÃ§Ã£o do agente encontrada no cache: {agent_id}"
                    )
                    return self._agents_cache[cache_key]

                # Expirado, remover do cache
                logger.debug(f"ConfiguraÃ§Ã£o do agente expirada no cache: {agent_id}")
                self._agents_cache.pop(cache_key, None)
                self._cache_timestamps.pop(f"config_{cache_key}", None)

            return None

    async def set_agent_config(
        self, agent_id: uuid.UUID, config: Dict[str, Any]
    ) -> None:
        """
        Armazenar configuraÃ§Ã£o do agente no cache.

        Args:
            agent_id: ID do agente
            config: ConfiguraÃ§Ã£o para cachear
        """
        async with self._lock:
            cache_key = str(agent_id)
            self._agents_cache[cache_key] = config
            self._cache_timestamps[f"config_{cache_key}"] = datetime.now()
            logger.debug(f"ConfiguraÃ§Ã£o do agente armazenada no cache: {agent_id}")

    async def invalidate_agent(self, agent_id: uuid.UUID) -> None:
        """
        Invalidar cache do agente especÃ­fico.

        Args:
            agent_id: ID do agente
        """
        async with self._lock:
            cache_key = str(agent_id)

            # Remover todas as entradas relacionadas ao agente
            self._agents_cache.pop(cache_key, None)
            self._tools_cache.pop(agent_id, None)
            
            # Remover todos os AgentExecutors que comeÃ§am com o agent_id (diferentes filtros)
            executors_to_remove = [key for key in self._agent_executors_cache.keys() if key.startswith(f"{agent_id}_")]
            for exec_key in executors_to_remove:
                self._agent_executors_cache.pop(exec_key, None)

            # Remover timestamps
            self._cache_timestamps.pop(f"config_{cache_key}", None)
            self._cache_timestamps.pop(f"tools_{agent_id}", None)
            
            # Remover timestamps dos executors com diferentes filtros
            timestamp_keys_to_remove = [key for key in self._cache_timestamps.keys() if key.startswith(f"executor_{agent_id}_")]
            for ts_key in timestamp_keys_to_remove:
                self._cache_timestamps.pop(ts_key, None)

            logger.info(f"Cache invalidado para agente: {agent_id} (incluindo todos os filtros)")

    async def clear_expired(self) -> None:
        """Limpar entradas expiradas do cache."""
        async with self._lock:
            now = datetime.now()
            expired_keys = []

            for key, timestamp in self._cache_timestamps.items():
                if (now - timestamp) > self._cache_ttl:
                    expired_keys.append(key)

            # Remover entradas expiradas
            for key in expired_keys:
                self._cache_timestamps.pop(key, None)

                # Identificar tipo de cache e remover entrada correspondente
                if key.startswith("config_"):
                    agent_key = key.replace("config_", "")
                    self._agents_cache.pop(agent_key, None)
                elif key.startswith("tools_"):
                    agent_id_str = key.replace("tools_", "")
                    try:
                        agent_uuid = uuid.UUID(agent_id_str)
                        self._tools_cache.pop(agent_uuid, None)
                    except ValueError:
                        pass
                elif key.startswith("executor_"):
                    # A chave agora pode ter formato "executor_uuid_filter" ou "executor_uuid"
                    agent_exec_key = key.replace("executor_", "")
                    self._agent_executors_cache.pop(agent_exec_key, None)

            if expired_keys:
                logger.info(
                    f"Removidas {len(expired_keys)} entradas expiradas do cache"
                )

    async def clear_all(self) -> None:
        """Limpar todo o cache."""
        async with self._lock:
            self._agents_cache.clear()
            self._tools_cache.clear()
            self._agent_executors_cache.clear()
            self._cache_timestamps.clear()
            logger.info("Cache completamente limpo")

    async def get_stats(self) -> Dict[str, Any]:
        """Obter estatÃ­sticas do cache."""
        async with self._lock:
            now = datetime.now()
            active_entries = sum(
                1
                for timestamp in self._cache_timestamps.values()
                if (now - timestamp) < self._cache_ttl
            )

            return {
                "agents_cached": len(self._agents_cache),
                "tools_cached": len(self._tools_cache),
                "executors_cached": len(self._agent_executors_cache),
                "active_entries": active_entries,
                "total_entries": len(self._cache_timestamps),
                "cache_ttl_minutes": self._cache_ttl.total_seconds() / 60,
            }


# InstÃ¢ncia global do cache
agent_cache = AgentCache()


async def get_agent_cache() -> AgentCache:
    """Obter instÃ¢ncia do cache de agentes."""
    return agent_cache
