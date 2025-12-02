# src/config/orm_config.py

import asyncio
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

# Logger usando sua implementaÃ§Ã£o
logger = get_logger(__name__)

# Base para modelos: utilizar a mesma Base dos modelos
from src.models.base import Base

# Importar todos os modelos para que sejam registrados no metadata do SQLAlchemy
from src.models.empresa import Empresa  # noqa: F401
from src.models.perfil import Perfil  # noqa: F401
from src.models.user import User  # noqa: F401

# Importar novos ORM models do marketplace
from src.models.produto_orm import ProdutoORM, CategoriaProdutoORM, ProdutoVariacaoORM  # noqa: F401
from src.models.fornecedor_orm import FornecedorORM  # noqa: F401
from src.models.carrinho_orm import CarrinhoORM  # noqa: F401
from src.models.pedido_orm import PedidoORM, ItemPedidoORM, PedidoHistoricoORM  # noqa: F401


class ORMConfig:
    """ConfiguraÃ§Ã£o centralizada do ORM"""

    async_engine: Optional[AsyncEngine] = None
    AsyncSessionLocal: Optional[async_sessionmaker[AsyncSession]] = None
    _initialized: bool = False

    @classmethod
    def get_database_url(cls) -> str:
        """ObtÃ©m a URL do banco de dados"""
        settings = get_settings()
        return settings.build_database_url()

    @classmethod
    async def initialize_database(cls, max_retries: int = 3) -> bool:
        """Inicializa a conexÃ£o com o banco"""
        if cls._initialized:
            logger.debug("Banco jÃ¡ inicializado")
            return True

        last_error: Optional[Exception] = None

        for attempt in range(max_retries):
            try:
                logger.debug(
                    "Tentativa %s/%s - Conectando ao banco...", attempt + 1, max_retries
                )

                database_url = cls.get_database_url()

                # Log da conexÃ£o (sem mostrar credenciais)
                connection_info = (
                    database_url.split("@")[1] if "@" in database_url else "localhost"
                )
                logger.debug("Conectando em: %s", connection_info)

                cls.async_engine = create_async_engine(
                    database_url,
                    echo=False,
                    pool_pre_ping=True,
                    pool_size=5,  # Reduzido para 5
                    max_overflow=10,  # Reduzido para 10
                    pool_timeout=30,  # Reduzido para 30
                    pool_recycle=1800,  # 30 minutos
                    pool_reset_on_return="commit",  # Garantir reset das conexÃµes
                    connect_args={
                        "server_settings": {
                            "application_name": "inovaia-api",
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

                # Testar conexÃ£o com timeout
                async with asyncio.timeout(15):  # Aumentado de 10 para 15
                    async with cls.async_engine.begin() as conn:
                        result = await conn.execute(
                            text("SELECT version(), current_database()")
                        )
                        row = result.fetchone()
                        if row is None:
                            raise RuntimeError(
                                "NÃ£o foi possÃ­vel obter informaÃ§Ãµes do banco"
                            )

                        version_raw = row[0]
                        database_raw = row[1]

                        if version_raw is None or database_raw is None:
                            raise RuntimeError("InformaÃ§Ãµes do banco estÃ£o vazias")

                        version = (
                            version_raw[:50] + "..."
                            if len(str(version_raw)) > 50
                            else str(version_raw)
                        )
                        database = str(database_raw)

                logger.debug("Banco conectado com sucesso!")
                logger.debug("PostgreSQL: %s", version)
                logger.debug("Database: %s", database)

                # Criar tabelas se necessÃ¡rio
                try:
                    logger.debug("Verificando/criando tabelas...")
                    async with cls.async_engine.begin() as conn:
                        # Garantir extensões necessárias (uuid-ossp e pgvector)
                        try:
                            await conn.execute(
                                text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
                            )
                            logger.debug(
                                'Extensão "uuid-ossp" verificada/criada com sucesso'
                            )
                        except Exception as ext_error:
                            logger.warning(
                                'Falha ao criar/verificar extensão uuid-ossp: %s',
                                ext_error,
                            )

                        # Tentar criar/verificar a extensão pgvector
                        # Observação: o nome da extensão é "vector" (pgvector)
                        try:
                            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
                            logger.debug(
                                'Extensão "vector" (pgvector) verificada/criada com sucesso'
                            )
                        except Exception as ext_error:
                            # Se não for possível criar a extensão, registrar erro claro
                            logger.error(
                                'Extensão pgvector não disponível no banco atual. '
                                'Instale o pacote pgvector no servidor PostgreSQL e execute '
                                '"CREATE EXTENSION vector" com um usuário com privilégios. '
                                'Erro: %s',
                                ext_error,
                            )
                            # Propagar erro para evitar tentativa de criar tabelas com tipo vector inexistente
                            raise

                        await conn.run_sync(Base.metadata.create_all)
                        # Compatibilidade de esquema da tabela de usuários
                        try:
                            # Garantir coluna de hash de senha
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS nm_password_hash VARCHAR(255)"
                                )
                            )
                            logger.debug(
                                "Esquema compatibilizado: nm_password_hash presente em tb_users"
                            )

                            # Garantir coluna e índice do Microsoft ID
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS nm_microsoft_id VARCHAR(255)"
                                )
                            )
                            await conn.execute(
                                text(
                                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_users_nm_microsoft_id "
                                    "ON tb_users (nm_microsoft_id) WHERE nm_microsoft_id IS NOT NULL"
                                )
                            )

                            # Garantir coluna de papel
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS nm_papel VARCHAR(20)"
                                )
                            )
                            await conn.execute(
                                text(
                                    "UPDATE tb_users SET nm_papel = COALESCE(nm_papel, 'usuario')"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN nm_papel SET DEFAULT 'usuario'"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN nm_papel SET NOT NULL"
                                )
                            )

                            # Converter st_ativo para CHAR(1) ('S'/'N') se necessário
                            await conn.execute(
                                text(
                                    """
                                    DO $$
                                    BEGIN
                                        IF EXISTS (
                                            SELECT 1
                                            FROM information_schema.columns
                                            WHERE table_name = 'tb_users'
                                              AND column_name = 'st_ativo'
                                              AND data_type = 'boolean'
                                        ) THEN
                                            ALTER TABLE tb_users
                                                ALTER COLUMN st_ativo TYPE CHAR(1)
                                                USING (CASE WHEN st_ativo THEN 'S' ELSE 'N' END);
                                        END IF;
                                    END $$;
                                    """
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN st_ativo TYPE CHAR(1) USING st_ativo::CHAR(1)"
                                )
                            )
                            await conn.execute(
                                text(
                                    "UPDATE tb_users SET st_ativo = COALESCE(st_ativo, 'S')"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN st_ativo SET DEFAULT 'S'"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN st_ativo SET NOT NULL"
                                )
                            )

                            # Garantir coluna de contagem de logins
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS nr_total_logins VARCHAR(10)"
                                )
                            )
                            await conn.execute(
                                text(
                                    """
                                    DO $$
                                    BEGIN
                                        IF EXISTS (
                                            SELECT 1
                                            FROM information_schema.columns
                                            WHERE table_name = 'tb_users'
                                              AND column_name = 'nr_total_logins'
                                              AND data_type IN ('integer', 'bigint', 'smallint')
                                        ) THEN
                                            ALTER TABLE tb_users
                                                ALTER COLUMN nr_total_logins TYPE VARCHAR(10)
                                                USING nr_total_logins::TEXT;
                                        END IF;
                                    END $$;
                                    """
                                )
                            )
                            await conn.execute(
                                text(
                                    "UPDATE tb_users SET nr_total_logins = COALESCE(nr_total_logins, '0')"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN nr_total_logins SET DEFAULT '0'"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN nr_total_logins SET NOT NULL"
                                )
                            )

                            # Garantir colunas opcionais adicionais
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS id_empresa UUID"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS id_perfil UUID"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS nm_cargo VARCHAR(100)"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS ds_preferencias JSONB DEFAULT '{}'::jsonb"
                                )
                            )
                            await conn.execute(
                                text(
                                    "UPDATE tb_users SET ds_preferencias = '{}'::jsonb WHERE ds_preferencias IS NULL"
                                )
                            )
                            await conn.execute(
                                text(
                                    "ALTER TABLE tb_users ALTER COLUMN ds_preferencias SET DEFAULT '{}'::jsonb"
                                )
                            )

                            logger.debug(
                                "Esquema compatibilizado: colunas essenciais de tb_users atualizadas"
                            )
                        except Exception as compat_error:
                            logger.warning(
                                "Falha ao compatibilizar esquema tb_users: %s",
                                compat_error,
                            )
                    logger.debug("Tabelas verificadas/criadas")
                except Exception as e:
                    logger.warning("Erro ao criar tabelas: %s", e)

                cls._initialized = True
                return True

            except asyncio.TimeoutError as e:
                last_error = e
                logger.error("Timeout na conexÃ£o (tentativa %s)", attempt + 1)
            except Exception as e:
                last_error = e
                logger.error("Erro na conexÃ£o (tentativa %s): %s", attempt + 1, e)

            # Limpar engine se criado mas falhou
            if cls.async_engine:
                try:
                    await cls.async_engine.dispose()
                    cls.async_engine = None
                    cls.AsyncSessionLocal = None
                except Exception as cleanup_error:
                    logger.warning("Erro ao limpar engine: %s", cleanup_error)

            # Aguardar antes da prÃ³xima tentativa (exceto na Ãºltima)
            if attempt < max_retries - 1:
                logger.debug("Aguardando 2s antes da prÃ³xima tentativa...")
                await asyncio.sleep(2)

        # Se chegou aqui, todas as tentativas falharam
        error_msg = f"Falha na inicializaÃ§Ã£o do banco apÃ³s {max_retries} tentativas"
        if last_error:
            error_msg += f". Ãšltimo erro: {last_error}"

        logger.error(error_msg)
        raise RuntimeError(error_msg)

    @classmethod
    def get_session(cls) -> AsyncSession:
        """ObtÃ©m uma nova sessÃ£o"""
        if not cls.AsyncSessionLocal:
            raise RuntimeError(
                "Banco de dados nÃ£o inicializado. Chame initialize_database() antes."
            )
        session = cls.AsyncSessionLocal()
        # Removido weakref.finalize: AsyncSession nÃ£o possui is_closed e fechamento assÃ­ncrono
        # O fechamento Ã© garantido nos contextos get_db e AsyncSessionContext
        return session

    @classmethod
    async def check_connection(cls) -> bool:
        """Verifica se a conexÃ£o estÃ¡ ativa"""
        try:
            if not cls.async_engine:
                return False

            async with cls.async_engine.begin() as conn:
                result = await conn.execute(text("SELECT 1"))
                return result.scalar() == 1
        except Exception as e:
            logger.error("Erro na verificaÃ§Ã£o de conexÃ£o: %s", e)
            return False

    @classmethod
    async def health_check(cls) -> Dict[str, str]:
        """Health check do banco"""
        if await cls.check_connection():
            return {"status": "healthy", "database": "connected"}
        return {"status": "error", "database": "disconnected"}

    @classmethod
    async def close_connections(cls) -> None:
        """Fecha conexÃµes"""
        if cls.async_engine:
            try:
                await cls.async_engine.dispose()
                cls.async_engine = None
                cls.AsyncSessionLocal = None
                cls._initialized = False
                logger.debug("ConexÃµes fechadas")
            except Exception as e:
                logger.error("Erro ao fechar conexÃµes: %s", e)


# Dependency para FastAPI


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency para obter sessÃ£o do banco"""
    if not ORMConfig.AsyncSessionLocal:
        raise RuntimeError(
            "ORM nÃ£o foi inicializado. Chame ORMConfig.initialize() primeiro."
        )

    session = ORMConfig.AsyncSessionLocal()
    try:
        yield session
    except Exception as e:
        logger.error("Erro na sessÃ£o: %s", e)
        # Tentar rollback apenas se a sessÃ£o ainda estÃ¡ vÃ¡lida
        try:
            if session.is_active:
                await session.rollback()
        except Exception as rollback_error:
            logger.warning("Erro durante rollback: %s", rollback_error)
        raise
    finally:
        # Garantir que a sessÃ£o seja sempre fechada
        try:
            await session.close()
        except Exception as close_error:
            logger.warning("Erro ao fechar sessÃ£o: %s", close_error)


async def get_async_session() -> AsyncSession:
    """Obter uma nova sessÃ£o assÃ­ncrona do banco"""
    return ORMConfig.get_session()


class AsyncSessionContext:
    """Context manager para sessÃµes assÃ­ncronas"""

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
                logger.warning(f"Erro ao fechar sessÃ£o no context manager: {e}")


def get_async_session_context() -> AsyncSessionContext:
    """Obter context manager para sessÃ£o assÃ­ncrona"""
    return AsyncSessionContext()


# FunÃ§Ã£o para inicializaÃ§Ã£o no FastAPI


async def init_db() -> bool:
    """Inicializa o banco para o FastAPI"""
    return await ORMConfig.initialize_database()


# Para uso no shutdown do FastAPI
async def shutdown_db() -> None:
    """Encerra conexÃµes com o banco"""
    await ORMConfig.close_connections()


# Log de carregamento
logger.debug("MÃ³dulo ORM carregado")
