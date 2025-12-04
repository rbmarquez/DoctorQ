# src/config/orm_config.py

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.ext.declarative import declarative_base

from src.config.logger_config import get_logger
from src.config.settings import get_settings

# Logger usando sua implementação
logger = get_logger(__name__)

# Base para modelos
Base = declarative_base()


class ORMConfig:
    """Configuração centralizada do ORM"""

    async_engine: Optional[AsyncEngine] = None
    AsyncSessionLocal: Optional[async_sessionmaker[AsyncSession]] = None
    _initialized: bool = False

    @classmethod
    def get_database_url(cls) -> str:
        """Obtém a URL do banco de dados"""
        settings = get_settings()
        return settings.build_database_url()

    @classmethod
    async def initialize_database(cls, max_retries: int = 3) -> bool:
        """Inicializa a conexão com o banco"""
        if cls._initialized:
            logger.debug("Banco já inicializado")
            return True

        last_error: Optional[Exception] = None

        for attempt in range(max_retries):
            try:
                logger.debug(
                    "Tentativa %s/%s - Conectando ao banco...", attempt + 1, max_retries
                )

                database_url = cls.get_database_url()

                # Log da conexão (sem mostrar credenciais)
                connection_info = (
                    database_url.split("@")[1] if "@" in database_url else "localhost"
                )
                logger.debug("Conectando em: %s", connection_info)

                cls.async_engine = create_async_engine(
                    database_url,
                    echo=False,
                    pool_pre_ping=True,
                    pool_size=5,
                    max_overflow=10,
                    pool_timeout=30,
                    pool_recycle=1800,  # 30 minutos
                    pool_reset_on_return="commit",
                    connect_args={
                        "server_settings": {
                            "application_name": "doctorq-ai-service",
                        },
                        "command_timeout": 30,
                    },
                )

                cls.AsyncSessionLocal = async_sessionmaker(
                    cls.async_engine,
                    class_=AsyncSession,
                    expire_on_commit=False,
                    autocommit=False,
                    autoflush=False,
                )

                # Testar conexão com timeout
                async with asyncio.timeout(15):
                    async with cls.async_engine.begin() as conn:
                        result = await conn.execute(
                            text("SELECT version(), current_database()")
                        )
                        row = result.fetchone()
                        if row is None:
                            raise RuntimeError(
                                "Não foi possível obter informações do banco"
                            )

                        version_raw = row[0]
                        database_raw = row[1]

                        if version_raw is None or database_raw is None:
                            raise RuntimeError("Informações do banco estão vazias")

                        version = (
                            version_raw[:50] + "..."
                            if len(str(version_raw)) > 50
                            else str(version_raw)
                        )
                        database = str(database_raw)

                logger.debug("Banco conectado com sucesso!")
                logger.debug("PostgreSQL: %s", version)
                logger.debug("Database: %s", database)

                cls._initialized = True
                return True

            except asyncio.TimeoutError as e:
                last_error = e
                logger.error("Timeout na conexão (tentativa %s)", attempt + 1)
            except Exception as e:
                last_error = e
                logger.error("Erro na conexão (tentativa %s): %s", attempt + 1, e)

            # Limpar engine se criado mas falhou
            if cls.async_engine:
                try:
                    await cls.async_engine.dispose()
                    cls.async_engine = None
                    cls.AsyncSessionLocal = None
                except Exception as cleanup_error:
                    logger.warning("Erro ao limpar engine: %s", cleanup_error)

            # Aguardar antes da próxima tentativa (exceto na última)
            if attempt < max_retries - 1:
                logger.debug("Aguardando 2s antes da próxima tentativa...")
                await asyncio.sleep(2)

        # Se chegou aqui, todas as tentativas falharam
        error_msg = f"Falha na inicialização do banco após {max_retries} tentativas"
        if last_error:
            error_msg += f". Último erro: {last_error}"

        logger.error(error_msg)
        raise RuntimeError(error_msg)

    @classmethod
    def get_session(cls) -> AsyncSession:
        """Obtém uma nova sessão"""
        if not cls.AsyncSessionLocal:
            raise RuntimeError(
                "Banco de dados não inicializado. Chame initialize_database() antes."
            )
        session = cls.AsyncSessionLocal()
        return session

    @classmethod
    async def check_connection(cls) -> bool:
        """Verifica se a conexão está ativa"""
        try:
            if not cls.async_engine:
                return False

            async with cls.async_engine.begin() as conn:
                result = await conn.execute(text("SELECT 1"))
                return result.scalar() == 1
        except Exception as e:
            logger.error("Erro na verificação de conexão: %s", e)
            return False

    @classmethod
    async def health_check(cls) -> Dict[str, str]:
        """Health check do banco"""
        if await cls.check_connection():
            return {"status": "healthy", "database": "connected"}
        return {"status": "error", "database": "disconnected"}

    @classmethod
    async def close_connections(cls) -> None:
        """Fecha conexões"""
        if cls.async_engine:
            try:
                await cls.async_engine.dispose()
                cls.async_engine = None
                cls.AsyncSessionLocal = None
                cls._initialized = False
                logger.debug("Conexões fechadas")
            except Exception as e:
                logger.error("Erro ao fechar conexões: %s", e)


# Dependency para FastAPI


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency para obter sessão do banco (para uso com async for - FastAPI)"""
    if not ORMConfig.AsyncSessionLocal:
        raise RuntimeError(
            "ORM não foi inicializado. Chame ORMConfig.initialize() primeiro."
        )

    session = ORMConfig.AsyncSessionLocal()
    try:
        yield session
    except Exception as e:
        logger.error("Erro na sessão: %s", e)
        try:
            if session.is_active:
                await session.rollback()
        except Exception as rollback_error:
            logger.warning("Erro durante rollback: %s", rollback_error)
        raise
    finally:
        try:
            await session.close()
        except Exception as close_error:
            logger.warning("Erro ao fechar sessão: %s", close_error)


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager para obter sessão do banco (para uso com async with)"""
    if not ORMConfig.AsyncSessionLocal:
        raise RuntimeError(
            "ORM não foi inicializado. Chame ORMConfig.initialize() primeiro."
        )

    session = ORMConfig.AsyncSessionLocal()
    try:
        yield session
    except Exception as e:
        logger.error("Erro na sessão: %s", e)
        try:
            if session.is_active:
                await session.rollback()
        except Exception as rollback_error:
            logger.warning("Erro durante rollback: %s", rollback_error)
        raise
    finally:
        try:
            await session.close()
        except Exception as close_error:
            logger.warning("Erro ao fechar sessão: %s", close_error)


async def get_async_session() -> AsyncSession:
    """Obter uma nova sessão assíncrona do banco"""
    return ORMConfig.get_session()


class AsyncSessionContext:
    """Context manager para sessões assíncronas"""

    def __init__(self):
        self.session: Optional[AsyncSession] = None

    async def __aenter__(self) -> AsyncSession:
        self.session = ORMConfig.get_session()
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            try:
                if exc_type:
                    await self.session.rollback()
                await self.session.close()
            except Exception as e:
                logger.warning(f"Erro ao fechar sessão no context manager: {e}")


def get_async_session_context() -> AsyncSessionContext:
    """Obter context manager para sessão assíncrona"""
    return AsyncSessionContext()


# Função para inicialização no FastAPI


async def init_db() -> bool:
    """Inicializa o banco para o FastAPI"""
    return await ORMConfig.initialize_database()


# Para uso no shutdown do FastAPI
async def shutdown_db() -> None:
    """Encerra conexões com o banco"""
    await ORMConfig.close_connections()


# Log de carregamento
logger.debug("Módulo ORM carregado")
