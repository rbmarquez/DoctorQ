"""
Configuracoes do DoctorQ Universidade da Beleza
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from src.config.settings import settings

# Logger
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, "INFO"))
logger = logging.getLogger("doctorq-univ")

# Base para os models
Base = declarative_base()

# Engine e Session
_engine = None
_async_session_maker = None


def get_engine():
    """Retorna engine SQLAlchemy"""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
    return _engine


def get_session_maker():
    """Retorna session maker"""
    global _async_session_maker
    if _async_session_maker is None:
        _async_session_maker = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency para injetar sessao do banco"""
    session_maker = get_session_maker()
    async with session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Inicializa o banco de dados"""
    engine = get_engine()
    async with engine.begin() as conn:
        # Criar tabelas se nao existirem
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Banco de dados inicializado")


async def check_db_connection() -> bool:
    """Verifica conexao com banco de dados"""
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Erro ao conectar com banco: {e}")
        return False


async def close_db():
    """Fecha conexoes com banco"""
    global _engine
    if _engine:
        await _engine.dispose()
        _engine = None
        logger.info("Conexoes com banco fechadas")
