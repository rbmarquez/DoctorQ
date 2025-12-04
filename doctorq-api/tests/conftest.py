"""
Pytest fixtures e configurações compartilhadas para testes
"""

import pytest
import os
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

# IMPORTANTE: Definir ambiente de teste ANTES de importar qualquer módulo da aplicação
os.environ["TESTING"] = "true"
# Usar PostgreSQL de testes (mesmo servidor, DB separado para testes)
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/dbdoctorq_test"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"
os.environ["LOG_LEVEL"] = "ERROR"

from src.main import app
from src.models.base import Base
from src.config.orm_config import ORMConfig, get_db
from src.utils.auth import get_current_apikey

# Importar modelos principais para testes
import src.models.user  # noqa
import src.models.empresa  # noqa
import src.models.perfil  # noqa
import src.models.agent  # noqa
import src.models.conversation  # noqa
import src.models.message  # noqa
import src.models.analytics  # noqa
import src.models.apikey  # noqa
import src.models.credencial  # noqa
import src.models.variable  # noqa
import src.models.webhook  # noqa
# Modelos para testes de integração
import src.models.albuns_orm  # noqa
import src.models.profissionais_orm  # noqa


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine using PostgreSQL"""
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/dbdoctorq_test",
        echo=False,
        pool_pre_ping=True,
    )

    yield engine

    # Limpar dados após cada teste (comentado para performance - limpar manualmente se necessário)
    # async with engine.begin() as conn:
    #     await conn.execute(text("TRUNCATE TABLE tb_albuns, tb_fotos CASCADE"))

    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session_maker(test_engine):
    """Create a sessionmaker for test database"""
    return async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


@pytest.fixture
async def db_session(test_session_maker) -> AsyncGenerator[AsyncSession, None]:
    """Fixture que fornece uma sessão de banco de dados para testes"""
    async with test_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture(autouse=True, scope="function")
async def initialize_test_database(test_engine, test_session_maker):
    """Inicializa o banco de dados de teste antes de cada teste"""
    # Guardar os valores originais
    original_engine = ORMConfig.async_engine
    original_session = ORMConfig.AsyncSessionLocal
    original_initialized = ORMConfig._initialized

    # Substituir com sessão de teste
    ORMConfig.async_engine = test_engine
    ORMConfig.AsyncSessionLocal = test_session_maker
    ORMConfig._initialized = True

    yield

    # Restaurar valores originais
    ORMConfig.async_engine = original_engine
    ORMConfig.AsyncSessionLocal = original_session
    ORMConfig._initialized = original_initialized


@pytest.fixture
async def client(test_session_maker) -> AsyncGenerator[AsyncClient, None]:
    """Fixture para cliente HTTP de teste com override de dependências"""

    # Override do dependency get_db para usar sessão de teste
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with test_session_maker() as session:
            try:
                yield session
            finally:
                await session.close()

    # Override do dependency get_current_apikey para retornar API key mockada
    async def override_get_current_apikey():
        """Retorna um objeto mockado de API key válida"""
        class MockApiKey:
            id_api_key = "04a4e71e-aed4-491b-b3f3-73694f470250"
            apiKey = "test-api-key-12345"
            nm_api_key = "Test API Key"
            st_ativo = True

        return MockApiKey()

    # Aplicar overrides
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_apikey] = override_get_current_apikey

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Limpar overrides após o teste
    app.dependency_overrides.clear()


@pytest.fixture
def api_key() -> str:
    """Fixture para API key de teste"""
    return os.getenv("TEST_API_KEY", "test-api-key-12345")


@pytest.fixture
def auth_headers(api_key: str) -> dict:
    """Fixture para headers de autenticação"""
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def sample_user_id() -> str:
    return "550e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_empresa_id() -> str:
    return "650e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_conversa_id() -> str:
    return "660e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_album_id() -> str:
    """Fixture para ID de álbum de teste"""
    return "750e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_foto_id() -> str:
    """Fixture para ID de foto de teste"""
    return "760e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_profissional_id() -> str:
    """Fixture para ID de profissional de teste"""
    return "850e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_paciente_id() -> str:
    """Fixture para ID de paciente de teste"""
    return "860e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def anyio_backend():
    return "asyncio"
