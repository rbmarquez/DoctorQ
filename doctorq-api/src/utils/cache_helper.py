"""
Helper para cache Redis
"""
import json
import hashlib
from typing import Any, Optional, Callable
from datetime import timedelta
import redis.asyncio as redis

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class CacheHelper:
    """Helper para operações de cache Redis"""

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client

    async def get(self, key: str) -> Optional[Any]:
        """
        Busca valor do cache

        Args:
            key: Chave do cache

        Returns:
            Valor deserializado ou None se não existir
        """
        if not self.redis:
            return None

        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Erro ao buscar cache {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 300  # 5 minutos padrão
    ) -> bool:
        """
        Armazena valor no cache

        Args:
            key: Chave do cache
            value: Valor a ser armazenado
            ttl: Time-to-live em segundos

        Returns:
            True se armazenado com sucesso
        """
        if not self.redis:
            return False

        try:
            serialized = json.dumps(value, default=str)
            await self.redis.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.warning(f"Erro ao armazenar cache {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Deleta chave do cache"""
        if not self.redis:
            return False

        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Erro ao deletar cache {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        Deleta chaves que correspondem ao padrão

        Args:
            pattern: Padrão (ex: "agendas:profissional:*")

        Returns:
            Número de chaves deletadas
        """
        if not self.redis:
            return 0

        try:
            keys = []
            async for key in self.redis.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                return await self.redis.delete(*keys)
            return 0
        except Exception as e:
            logger.warning(f"Erro ao deletar padrão {pattern}: {e}")
            return 0

    @staticmethod
    def generate_cache_key(*args, **kwargs) -> str:
        """
        Gera chave de cache baseado em argumentos

        Example:
            key = CacheHelper.generate_cache_key("agendas", id_prof="123", dt_inicio="2025-11-01")
            # Returns: "agendas:123:2025-11-01:hash"
        """
        parts = [str(arg) for arg in args]
        for k, v in sorted(kwargs.items()):
            parts.append(f"{k}={v}")

        combined = ":".join(parts)
        hash_suffix = hashlib.md5(combined.encode()).hexdigest()[:8]

        return f"{combined}:{hash_suffix}"


# Instância global (será inicializada no main.py)
cache_helper: Optional[CacheHelper] = None


def get_cache_helper() -> Optional[CacheHelper]:
    """Retorna instância global do cache helper"""
    return cache_helper


def init_cache_helper(redis_client: redis.Redis):
    """Inicializa cache helper global"""
    global cache_helper
    cache_helper = CacheHelper(redis_client)
