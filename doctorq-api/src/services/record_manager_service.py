# src/services/record_manager_service.py
import time
from datetime import datetime
from typing import List, Optional, Sequence

from langchain_core.indexing.base import RecordManager
from sqlalchemy import and_, delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.record_manager import RecordManagerCreate, RecordManagerModel

logger = get_logger(__name__)


class PostgreSQLRecordManager(RecordManager):
    """ImplementaÃ§Ã£o do RecordManager do LangChain usando PostgreSQL"""

    def __init__(self, namespace: str, session: AsyncSession):
        super().__init__(namespace)
        self.namespace = namespace
        self.session = session

    def create_schema(self) -> None:
        """Criar schema do banco (jÃ¡ existe via migrations)"""
        pass

    async def acreate_schema(self) -> None:
        """Criar schema do banco (async)"""
        pass

    def get_time(self) -> float:
        """Obter timestamp atual"""
        return time.time()

    async def aget_time(self) -> float:
        """Obter timestamp atual (async)"""
        return time.time()

    def update(
        self,
        keys: Sequence[str],
        group_ids: Optional[Sequence[Optional[str]]] = None,
        time_at_least: Optional[float] = None,
    ) -> None:
        """Atualizar records (sync - nÃ£o implementado)"""
        raise NotImplementedError("Use aupdate para operaÃ§Ãµes assÃ­ncronas")

    async def aupdate(
        self,
        keys: Sequence[str],
        group_ids: Optional[Sequence[Optional[str]]] = None,
        time_at_least: Optional[float] = None,
    ) -> None:
        """Atualizar ou inserir records"""
        try:
            current_time = datetime.utcnow()

            # Preparar dados para upsert
            records_data = []
            for i, key in enumerate(keys):
                group_id = group_ids[i] if group_ids and i < len(group_ids) else None
                records_data.append(
                    {
                        "namespace": self.namespace,
                        "key": key,
                        "group_id": group_id,
                        "updated_at": current_time,
                        "created_at": current_time,
                    }
                )

            # Fazer upsert usando PostgreSQL ON CONFLICT
            stmt = insert(RecordManagerModel).values(records_data)
            stmt = stmt.on_conflict_do_update(
                index_elements=["namespace", "key"],
                set_={
                    "group_id": stmt.excluded.group_id,
                    "updated_at": stmt.excluded.updated_at,
                },
            )

            await self.session.execute(stmt)

            logger.debug(
                f"Atualizados {len(keys)} records no namespace {self.namespace}"
            )

        except Exception as e:
            logger.error(f"Erro ao atualizar records: {str(e)}")
            raise

    def exists(self, keys: Sequence[str]) -> List[bool]:
        """Verificar existÃªncia de records (sync - nÃ£o implementado)"""
        raise NotImplementedError("Use aexists para operaÃ§Ãµes assÃ­ncronas")

    async def aexists(self, keys: Sequence[str]) -> List[bool]:
        """Verificar existÃªncia de records"""
        try:
            # Buscar records existentes
            stmt = select(RecordManagerModel.key).where(
                and_(
                    RecordManagerModel.namespace == self.namespace,
                    RecordManagerModel.key.in_(keys),
                )
            )
            result = await self.session.execute(stmt)
            existing_keys = set(row[0] for row in result.fetchall())

            # Retornar lista de booleanos na mesma ordem das keys
            return [key in existing_keys for key in keys]

        except Exception as e:
            logger.error(f"Erro ao verificar existÃªncia de records: {str(e)}")
            raise

    def list_keys(
        self,
        before: Optional[float] = None,
        after: Optional[float] = None,
        group_ids: Optional[Sequence[str]] = None,
        limit: Optional[int] = None,
    ) -> List[str]:
        """Listar keys (sync - nÃ£o implementado)"""
        raise NotImplementedError("Use alist_keys para operaÃ§Ãµes assÃ­ncronas")

    async def alist_keys(
        self,
        before: Optional[float] = None,
        after: Optional[float] = None,
        group_ids: Optional[Sequence[str]] = None,
        limit: Optional[int] = None,
    ) -> List[str]:
        """Listar keys com filtros"""
        try:
            # Construir query base
            stmt = select(RecordManagerModel.key).where(
                RecordManagerModel.namespace == self.namespace
            )

            # Aplicar filtros de tempo
            if before is not None:
                before_dt = datetime.fromtimestamp(before)
                stmt = stmt.where(RecordManagerModel.updated_at < before_dt)

            if after is not None:
                after_dt = datetime.fromtimestamp(after)
                stmt = stmt.where(RecordManagerModel.updated_at > after_dt)

            # Aplicar filtro de group_ids
            if group_ids is not None:
                stmt = stmt.where(RecordManagerModel.group_id.in_(group_ids))

            # Aplicar limite
            if limit is not None:
                stmt = stmt.limit(limit)

            # Executar query
            result = await self.session.execute(stmt)
            return [row[0] for row in result.fetchall()]

        except Exception as e:
            logger.error(f"Erro ao listar keys: {str(e)}")
            raise

    def delete_keys(self, keys: Sequence[str]) -> None:
        """Deletar records (sync - nÃ£o implementado)"""
        raise NotImplementedError("Use adelete_keys para operaÃ§Ãµes assÃ­ncronas")

    async def adelete_keys(self, keys: Sequence[str]) -> None:
        """Deletar records por keys"""
        try:
            stmt = delete(RecordManagerModel).where(
                and_(
                    RecordManagerModel.namespace == self.namespace,
                    RecordManagerModel.key.in_(keys),
                )
            )

            result = await self.session.execute(stmt)
            await self.session.commit()

            logger.debug(
                f"Deletados {result.rowcount} records do namespace {self.namespace}"
            )

        except Exception as e:
            logger.error(f"Erro ao deletar records: {str(e)}")
            raise


class RecordManagerService:
    """Service para gerenciar operations do Record Manager"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_schema(self) -> None:
        """Criar schema do banco (jÃ¡ existe via migrations)"""
        # O schema jÃ¡ foi criado via arquivo SQL de migration
        # Este mÃ©todo existe para compatibilidade com a interface
        logger.debug("Schema do Record Manager jÃ¡ existe via migrations")

    async def upsert_records(
        self,
        namespace: str,
        keys: Sequence[str],
        group_ids: Optional[Sequence[Optional[str]]] = None,
        time_at_least: Optional[float] = None,
    ) -> None:
        """
        Upsert (insert or update) records no banco

        Args:
            namespace: Namespace dos records
            keys: Lista de chaves dos records
            group_ids: Lista opcional de group_ids correspondentes Ã s keys
            time_at_least: Timestamp mÃ­nimo opcional para validaÃ§Ã£o
        """
        if group_ids and len(keys) != len(group_ids):
            raise ValueError("O nÃºmero de keys deve ser igual ao nÃºmero de group_ids")

        # Validar timestamp se fornecido
        if time_at_least:
            current_time = await self.get_time()
            if current_time < time_at_least:
                raise ValueError(
                    f"Tempo atual ({current_time}) Ã© menor que time_at_least ({time_at_least})"
                )

        try:
            for i, key in enumerate(keys):
                group_id = group_ids[i] if group_ids else None

                # Verificar se record jÃ¡ existe
                existing_record = await self._get_record_by_key(namespace, key)

                if existing_record:
                    # Atualizar record existente
                    await self._update_record(existing_record.id, group_id)
                    logger.info(f"Record atualizado: {namespace}:{key}")
                else:
                    # Criar novo record
                    await self._create_record(namespace, key, group_id)
                    logger.info(f"Record criado: {namespace}:{key}")

            await self.db.commit()
            logger.info(
                f"Upsert concluÃ­do para {len(keys)} records no namespace '{namespace}'"
            )

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro no upsert de records: {e}")
            raise

    async def _get_record_by_key(
        self, namespace: str, key: str
    ) -> Optional[RecordManagerModel]:
        """Buscar record por namespace e key"""
        query = select(RecordManagerModel).where(
            and_(
                RecordManagerModel.namespace == namespace, RecordManagerModel.key == key
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _create_record(
        self, namespace: str, key: str, group_id: Optional[str] = None
    ) -> RecordManagerModel:
        """Criar novo record"""
        record_data = RecordManagerCreate(
            namespace=namespace, key=key, group_id=group_id
        )

        db_record = RecordManagerModel(**record_data.model_dump())
        self.db.add(db_record)
        await self.db.flush()
        return db_record

    async def _update_record(self, record_id, group_id: Optional[str] = None) -> None:
        """Atualizar record existente"""
        query = select(RecordManagerModel).where(RecordManagerModel.id == record_id)
        result = await self.db.execute(query)
        record = result.scalar_one()

        if group_id is not None:
            record.group_id = group_id
        # updated_at serÃ¡ automaticamente atualizado pelo trigger do banco

    async def delete_keys(self, namespace: str, keys: Sequence[str]) -> None:
        """
        Deletar records por keys

        Args:
            namespace: Namespace dos records
            keys: Lista de chaves para deletar
        """
        try:
            query = delete(RecordManagerModel).where(
                and_(
                    RecordManagerModel.namespace == namespace,
                    RecordManagerModel.key.in_(keys),
                )
            )

            result = await self.db.execute(query)
            await self.db.commit()

            deleted_count = result.rowcount
            logger.debug(
                f"Deletados {deleted_count} records do namespace '{namespace}'"
            )

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao deletar records: {e}")
            raise

    async def exists(self, namespace: str, keys: Sequence[str]) -> List[bool]:
        """
        Verificar quais keys existem no namespace

        Args:
            namespace: Namespace dos records
            keys: Lista de chaves para verificar

        Returns:
            Lista de booleans indicando existÃªncia de cada key
        """
        try:
            query = select(RecordManagerModel.key).where(
                and_(
                    RecordManagerModel.namespace == namespace,
                    RecordManagerModel.key.in_(keys),
                )
            )

            result = await self.db.execute(query)
            existing_keys = {row[0] for row in result.fetchall()}

            return [key in existing_keys for key in keys]

        except Exception as e:
            logger.error(f"Erro ao verificar existÃªncia de records: {e}")
            raise

    async def list_keys(
        self,
        namespace: str,
        before: Optional[float] = None,
        after: Optional[float] = None,
        group_ids: Optional[Sequence[str]] = None,
        limit: Optional[int] = None,
    ) -> List[str]:
        """
        Listar keys baseado nos filtros

        Args:
            namespace: Namespace dos records
            before: Filtrar records atualizados antes deste timestamp
            after: Filtrar records atualizados depois deste timestamp
            group_ids: Filtrar por group_ids especÃ­ficos
            limit: Limite de registros retornados

        Returns:
            Lista de keys que atendem aos filtros
        """
        try:
            query = select(RecordManagerModel.key).where(
                RecordManagerModel.namespace == namespace
            )

            # Aplicar filtros temporais
            if before is not None:
                before_dt = datetime.fromtimestamp(before)
                query = query.where(RecordManagerModel.updated_at < before_dt)

            if after is not None:
                after_dt = datetime.fromtimestamp(after)
                query = query.where(RecordManagerModel.updated_at > after_dt)

            # Aplicar filtro de group_ids
            if group_ids is not None:
                query = query.where(RecordManagerModel.group_id.in_(group_ids))

            # Ordenar por data de atualizaÃ§Ã£o (mais recentes primeiro)
            query = query.order_by(RecordManagerModel.updated_at.desc())

            # Aplicar limite
            if limit is not None:
                query = query.limit(limit)

            result = await self.db.execute(query)
            keys = [row[0] for row in result.fetchall()]

            logger.debug(
                f"Listados {len(keys)} keys do namespace '{namespace}' com filtros aplicados"
            )
            return keys

        except Exception as e:
            logger.error(f"Erro ao listar keys: {e}")
            raise

    async def get_time(self) -> float:
        """
        Obter timestamp atual do servidor (banco de dados)

        Returns:
            Timestamp atual como float
        """
        try:
            query = select(func.extract("epoch", func.now()))
            result = await self.db.execute(query)
            timestamp = result.scalar()
            return float(timestamp)

        except Exception as e:
            logger.error(f"Erro ao obter timestamp do servidor: {e}")
            # Fallback para timestamp local
            return time.time()

    async def get_records_count(self, namespace: str) -> int:
        """
        Contar total de records em um namespace

        Args:
            namespace: Namespace para contar

        Returns:
            NÃºmero total de records
        """
        try:
            query = select(func.count(RecordManagerModel.id)).where(
                RecordManagerModel.namespace == namespace
            )
            result = await self.db.execute(query)
            count = result.scalar()
            return count or 0

        except Exception as e:
            logger.error(f"Erro ao contar records: {e}")
            return 0

    async def get_namespaces(self) -> List[str]:
        """
        Listar todos os namespaces disponÃ­veis

        Returns:
            Lista de namespaces Ãºnicos
        """
        try:
            query = select(RecordManagerModel.namespace).distinct()
            result = await self.db.execute(query)
            namespaces = [row[0] for row in result.fetchall()]
            return namespaces

        except Exception as e:
            logger.error(f"Erro ao listar namespaces: {e}")
            return []


# =============================================================================
# FACTORY FUNCTION
# =============================================================================


def get_record_manager_service(db: AsyncSession) -> RecordManagerService:
    """
    Factory function para criar instÃ¢ncia do RecordManagerService

    Args:
        db: SessÃ£o do banco de dados

    Returns:
        InstÃ¢ncia do RecordManagerService
    """
    return RecordManagerService(db)


def create_langchain_record_manager(
    namespace: str, session: AsyncSession
) -> PostgreSQLRecordManager:
    """
    Criar instÃ¢ncia do RecordManager do LangChain

    Args:
        namespace: Namespace para o record manager
        session: SessÃ£o do banco de dados

    Returns:
        InstÃ¢ncia do PostgreSQLRecordManager compatÃ­vel com LangChain
    """
    return PostgreSQLRecordManager(namespace, session)


async def get_langchain_record_manager_factory():
    """Factory para criar RecordManager do LangChain"""
    return create_langchain_record_manager
