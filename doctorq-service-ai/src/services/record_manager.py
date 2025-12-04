# src/services/record_manager.py
import time
from typing import List, Optional, Sequence

from langchain_core.indexing.base import RecordManager
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.cache_config import get_cache_client, is_cache_enabled
from src.config.logger_config import get_logger
from src.services.record_manager_service import get_record_manager_service

logger = get_logger(__name__)


class HybridRecordManager(RecordManager):
    """
    ImplementaÃ§Ã£o customizada de RecordManager para integraÃ§Ã£o com o sistema hÃ­brido (PostgreSQL + Redis).

    Esta implementaÃ§Ã£o segue a interface do LangChain RecordManager e integra com:
    - PostgreSQL: Para persistÃªncia permanente
    - Redis: Para cache rÃ¡pido (opcional)
    """

    def __init__(self, namespace: str, db: AsyncSession):
        """
        Inicializar HybridRecordManager

        Args:
            namespace: Namespace para separaÃ§Ã£o lÃ³gica de records
            db: SessÃ£o do banco de dados
        """
        super().__init__(namespace)
        self.db = db
        self.service = get_record_manager_service(db)
        self._redis_client = None
        self._redis_enabled = is_cache_enabled()

        logger.debug(f"HybridRecordManager inicializado para namespace: {namespace}")

    async def _get_redis_client(self):
        """Obter cliente Redis se disponÃ­vel"""
        if not self._redis_enabled:
            return None

        if self._redis_client is None:
            try:
                self._redis_client = await get_cache_client()
            except Exception as e:
                logger.warning(f"Erro ao conectar Redis: {e}")
                self._redis_client = None

        return self._redis_client

    # ===========================================
    # MÃ‰TODOS OBRIGATÃ“RIOS DA INTERFACE
    # ===========================================

    async def acreate_schema(self) -> None:
        """Criar schema do banco de dados (async)"""
        await self.service.create_schema()
        logger.debug(f"Schema criado para namespace: {self.namespace}")

    def create_schema(self) -> None:
        """Criar schema do banco de dados (sync)"""
        # Para compatibilidade, mas como estamos usando async, este mÃ©todo nÃ£o Ã© usado
        logger.warning(
            "create_schema() sÃ­ncronizado nÃ£o Ã© suportado. Use acreate_schema()"
        )

    async def aupdate(
        self,
        keys: Sequence[str],
        *,
        group_ids: Optional[Sequence[Optional[str]]] = None,
        time_at_least: Optional[float] = None,
    ) -> None:
        """
        Upsert records no banco (async)

        Args:
            keys: Lista de chaves dos records
            group_ids: Lista opcional de group_ids
            time_at_least: Timestamp mÃ­nimo opcional
        """
        try:
            await self.service.upsert_records(
                namespace=self.namespace,
                keys=keys,
                group_ids=group_ids,
                time_at_least=time_at_least,
            )

            # Cache no Redis se disponÃ­vel
            await self._cache_keys_in_redis(keys, group_ids)

            logger.debug(
                f"Upsert de {len(keys)} keys concluÃ­do no namespace: {self.namespace}"
            )

        except Exception as e:
            logger.error(f"Erro no upsert: {e}")
            raise

    def update(
        self,
        keys: Sequence[str],
        *,
        group_ids: Optional[Sequence[Optional[str]]] = None,
        time_at_least: Optional[float] = None,
    ) -> None:
        """Upsert records no banco (sync)"""
        logger.warning("update() sÃ­ncronizado nÃ£o Ã© suportado. Use aupdate()")
        raise NotImplementedError("Use aupdate() para operaÃ§Ãµes assÃ­ncronas")

    async def adelete_keys(self, keys: Sequence[str]) -> None:
        """
        Deletar records por keys (async)

        Args:
            keys: Lista de chaves para deletar
        """
        try:
            await self.service.delete_keys(self.namespace, keys)

            # Remover do cache Redis se disponÃ­vel
            await self._remove_keys_from_redis(keys)

            logger.debug(f"Deleted {len(keys)} keys do namespace: {self.namespace}")

        except Exception as e:
            logger.error(f"Erro ao deletar keys: {e}")
            raise

    def delete_keys(self, keys: Sequence[str]) -> None:
        """Deletar records por keys (sync)"""
        logger.warning("delete_keys() sÃ­ncronizado nÃ£o Ã© suportado. Use adelete_keys()")
        raise NotImplementedError("Use adelete_keys() para operaÃ§Ãµes assÃ­ncronas")

    async def aexists(self, keys: Sequence[str]) -> List[bool]:
        """
        Verificar existÃªncia de keys (async)

        Args:
            keys: Lista de chaves para verificar

        Returns:
            Lista de booleans indicando existÃªncia
        """
        try:
            # Tentar cache Redis primeiro
            redis_result = await self._check_keys_in_redis(keys)
            if redis_result is not None:
                logger.debug(
                    f"VerificaÃ§Ã£o de existÃªncia via Redis para {len(keys)} keys"
                )
                return redis_result

            # Fallback para PostgreSQL
            result = await self.service.exists(self.namespace, keys)
            logger.debug(
                f"VerificaÃ§Ã£o de existÃªncia via PostgreSQL para {len(keys)} keys"
            )
            return result

        except Exception as e:
            logger.error(f"Erro ao verificar existÃªncia: {e}")
            raise

    def exists(self, keys: Sequence[str]) -> List[bool]:
        """Verificar existÃªncia de keys (sync)"""
        logger.warning("exists() sÃ­ncronizado nÃ£o Ã© suportado. Use aexists()")
        raise NotImplementedError("Use aexists() para operaÃ§Ãµes assÃ­ncronas")

    async def alist_keys(
        self,
        *,
        before: Optional[float] = None,
        after: Optional[float] = None,
        group_ids: Optional[Sequence[str]] = None,
        limit: Optional[int] = None,
    ) -> List[str]:
        """
        Listar keys com filtros (async)

        Args:
            before: Filtrar records antes deste timestamp
            after: Filtrar records depois deste timestamp
            group_ids: Filtrar por group_ids especÃ­ficos
            limit: Limite de registros

        Returns:
            Lista de keys
        """
        try:
            keys = await self.service.list_keys(
                namespace=self.namespace,
                before=before,
                after=after,
                group_ids=group_ids,
                limit=limit,
            )

            logger.debug(f"Listadas {len(keys)} keys do namespace: {self.namespace}")
            return keys

        except Exception as e:
            logger.error(f"Erro ao listar keys: {e}")
            raise

    def list_keys(
        self,
        *,
        before: Optional[float] = None,
        after: Optional[float] = None,
        group_ids: Optional[Sequence[str]] = None,
        limit: Optional[int] = None,
    ) -> List[str]:
        """Listar keys com filtros (sync)"""
        logger.warning("list_keys() sÃ­ncronizado nÃ£o Ã© suportado. Use alist_keys()")
        raise NotImplementedError("Use alist_keys() para operaÃ§Ãµes assÃ­ncronas")

    async def aget_time(self) -> float:
        """
        Obter timestamp atual do servidor (async)

        Returns:
            Timestamp atual como float
        """
        try:
            return await self.service.get_time()
        except Exception as e:
            logger.error(f"Erro ao obter timestamp: {e}")
            # Fallback para timestamp local
            return time.time()

    def get_time(self) -> float:
        """Obter timestamp atual do servidor (sync)"""
        logger.warning("get_time() sÃ­ncronizado nÃ£o Ã© suportado. Use aget_time()")
        # Fallback para timestamp local
        return time.time()

    # ===========================================
    # MÃ‰TODOS DE CACHE REDIS
    # ===========================================

    async def _cache_keys_in_redis(
        self, keys: Sequence[str], group_ids: Optional[Sequence[Optional[str]]] = None
    ) -> None:
        """Cache keys no Redis se disponÃ­vel"""
        redis_client = await self._get_redis_client()
        if not redis_client:
            return

        try:
            for i, key in enumerate(keys):
                cache_key = f"record:{self.namespace}:{key}"
                group_id = group_ids[i] if group_ids else None

                # Cache com TTL de 1 hora
                await redis_client.setex(cache_key, 3600, group_id or "no_group")

            logger.debug(f"Cached {len(keys)} keys no Redis")

        except Exception as e:
            logger.warning(f"Erro ao fazer cache no Redis: {e}")

    async def _remove_keys_from_redis(self, keys: Sequence[str]) -> None:
        """Remover keys do cache Redis"""
        redis_client = await self._get_redis_client()
        if not redis_client:
            return

        try:
            cache_keys = [f"record:{self.namespace}:{key}" for key in keys]
            if cache_keys:
                await redis_client.delete(*cache_keys)

            logger.debug(f"Removidas {len(keys)} keys do cache Redis")

        except Exception as e:
            logger.warning(f"Erro ao remover cache do Redis: {e}")

    async def _check_keys_in_redis(self, keys: Sequence[str]) -> Optional[List[bool]]:
        """Verificar existÃªncia de keys no Redis"""
        redis_client = await self._get_redis_client()
        if not redis_client:
            return None

        try:
            cache_keys = [f"record:{self.namespace}:{key}" for key in keys]
            exists_results = await redis_client.mget(cache_keys)

            # Se temos resultados parciais do cache, retornamos None para usar PostgreSQL
            if any(result is None for result in exists_results):
                return None

            return [result is not None for result in exists_results]

        except Exception as e:
            logger.warning(f"Erro ao verificar cache Redis: {e}")
            return None

    # ===========================================
    # MÃ‰TODOS UTILITÃRIOS
    # ===========================================

    async def get_stats(self) -> dict:
        """
        Obter estatÃ­sticas do namespace

        Returns:
            DicionÃ¡rio com estatÃ­sticas
        """
        try:
            total_records = await self.service.get_records_count(self.namespace)
            current_time = await self.aget_time()

            stats = {
                "namespace": self.namespace,
                "total_records": total_records,
                "redis_enabled": self._redis_enabled,
                "current_timestamp": current_time,
            }

            return stats

        except Exception as e:
            logger.error(f"Erro ao obter estatÃ­sticas: {e}")
            return {"error": str(e)}

    async def clear_namespace(self) -> int:
        """
        Limpar todos os records do namespace

        Returns:
            NÃºmero de records removidos
        """
        try:
            # Listar todas as keys primeiro
            all_keys = await self.alist_keys()

            if all_keys:
                await self.adelete_keys(all_keys)

            logger.debug(
                f"Namespace '{self.namespace}' limpo: {len(all_keys)} records removidos"
            )
            return len(all_keys)

        except Exception as e:
            logger.error(f"Erro ao limpar namespace: {e}")
            raise


# ===========================================
# FACTORY FUNCTION
# ===========================================


async def create_hybrid_record_manager(
    namespace: str, db: AsyncSession
) -> HybridRecordManager:
    """
    Factory function para criar HybridRecordManager

    Args:
        namespace: Namespace para o record manager
        db: SessÃ£o do banco de dados

    Returns:
        InstÃ¢ncia configurada do HybridRecordManager
    """
    try:
        record_manager = HybridRecordManager(namespace, db)

        # Criar schema se necessÃ¡rio
        await record_manager.acreate_schema()

        logger.debug(f"HybridRecordManager criado para namespace: {namespace}")
        return record_manager

    except Exception as e:
        logger.error(f"Erro ao criar HybridRecordManager: {e}")
        raise
