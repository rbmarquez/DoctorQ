import logging
import uuid
from typing import Optional

import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.credencial_service import CredencialService, get_credencial_service
from src.services.variable_service import VariableService

logger = logging.getLogger(__name__)

# Cliente Redis global
redis_client: Optional[redis.Redis] = None


class CacheManager:
    """Singleton para gerenciar configuraÃ§Ãµes de cache globalmente"""

    _instance = None
    _cache_config: Optional["CacheConfig"] = None
    _redis_client: Optional[redis.Redis] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def cache_config(self) -> Optional["CacheConfig"]:
        return self._cache_config

    @cache_config.setter
    def cache_config(self, value: Optional["CacheConfig"]):
        self._cache_config = value

    @property
    def redis_client(self) -> Optional[redis.Redis]:
        return self._redis_client

    @redis_client.setter
    def redis_client(self, value: Optional[redis.Redis]):
        self._redis_client = value

    async def close_cache(self):
        """Fecha conexÃ£o com Redis"""
        if self._cache_config:
            try:
                await self._cache_config.close_redis()
            except Exception as e:
                logger.error(f"Erro ao fechar cache: {e}")
            finally:
                self._cache_config = None
                self._redis_client = None

    def is_cache_enabled(self) -> bool:
        """Verifica se o cache estÃ¡ habilitado e funcionando"""
        return (
            self._cache_config is not None
            and self._redis_client is not None
            and self._cache_config.is_enabled()
        )


# InstÃ¢ncia global do gerenciador de cache
_cache_manager = CacheManager()


class CacheConfig:
    """
    Classe para configurar e gerenciar o Redis Cache
    Integrada com sistema de credenciais para configuraÃ§Ã£o dinÃ¢mica

    Configura credencial a partir da configuraÃ§Ã£o de memÃ³ria do agent_config.
    Quando memory.ativo=True, usa memory.credencialId.
    """

    def __init__(
        self,
        db_session: Optional[AsyncSession] = None,
        redis_host: Optional[str] = None,
        redis_port: Optional[int] = None,
        redis_db: Optional[int] = None,
        redis_password: Optional[str] = None,
        socket_timeout: int = 5,
        socket_connect_timeout: int = 5,
        use_credentials: bool = True,
        id_credencial: Optional[str] = None,
        **kwargs,
    ):
        """
        Inicializa a configuraÃ§Ã£o do Redis Cache

        Args:
            db_session: SessÃ£o do banco de dados para buscar credenciais e variÃ¡veis
            redis_host: Host do Redis
            redis_port: Porta do Redis
            redis_db: Database do Redis
            redis_password: Senha do Redis
            socket_timeout: Timeout do socket
            socket_connect_timeout: Timeout de conexÃ£o do socket
            use_credentials: Se deve usar o sistema de credenciais
            id_credencial: ID da credencial opcional (usado como fallback se variÃ¡vel nÃ£o existir)

        Nota: O ID da credencial serÃ¡ configurado via agent_config.memory.credencialId
        """

        # ConfiguraÃ§Ã£o do service de credenciais
        self.db_session = db_session
        self.credential_service: Optional[CredencialService] = None
        self.variable_service: Optional[VariableService] = None
        self.use_credentials = use_credentials
        self.id_credencial = id_credencial

        if self.db_session and self.use_credentials:
            self.credential_service = get_credencial_service()
            self.variable_service = VariableService(self.db_session)

        # ConfiguraÃ§Ãµes iniciais (podem ser sobrescritas pelas credenciais)
        self.redis_host = redis_host or "localhost"
        self.redis_port = redis_port or 6379
        self.redis_db = redis_db or 0
        self.redis_password = redis_password
        self.socket_timeout = socket_timeout
        self.socket_connect_timeout = socket_connect_timeout
        self.cache_enabled = True
        self.additional_kwargs = kwargs

        # Controle de inicializaÃ§Ã£o
        self.config_loaded = False
        self.redis_client: Optional[redis.Redis] = None
        self.credencial_id = None  # SerÃ¡ configurado via agent_config

    def set_credential_from_agent_config(self, agent_config: dict):
        """Configurar credencial a partir do agent_config"""
        try:
            if not agent_config:
                logger.warning("agent_config nÃ£o fornecido")
                return False

            memory_config = agent_config.get("memory", {})

            # Verificar se memÃ³ria estÃ¡ ativa
            if not memory_config.get("ativo", False):
                logger.debug("MemÃ³ria nÃ£o estÃ¡ ativa no agent_config")
                return False

            # Obter ID da credencial do agent_config
            credencial_id_str = memory_config.get("credencialId")
            if not credencial_id_str:
                logger.warning(
                    "credencialId nÃ£o configurado na memÃ³ria do agent_config"
                )
                return False

            try:
                self.credencial_id = uuid.UUID(credencial_id_str)
                logger.debug(
                    f"Credencial Redis configurada do agent_config: {self.credencial_id}"
                )
                return True
            except ValueError:
                logger.error(
                    f"ID de credencial invÃ¡lido no agent_config: {credencial_id_str}"
                )
                return False

        except Exception as e:
            logger.error(f"Erro ao configurar credencial do agent_config: {e}")
            return False

    async def _load_credential_config(self):
        """Carrega configuraÃ§Ãµes da credencial do banco de dados"""
        if not self.credential_service:
            logger.warning("Service de credenciais nÃ£o disponÃ­vel")
            return

        try:
            # Verificar se credencial foi configurada via agent_config
            if not self.credencial_id:
                if self.id_credencial:
                    try:
                        self.credencial_id = uuid.UUID(self.id_credencial)
                        logger.debug(
                            f"Usando ID da credencial fornecido: {self.credencial_id}"
                        )
                    except ValueError:
                        logger.error(f"ID de credencial invÃ¡lido: {self.id_credencial}")
                        return
                else:
                    # Buscar primeira credencial Redis disponÃ­vel
                    try:
                        redis_credenciais = (
                            await self.credential_service.get_credenciais_by_type(
                                "redisApi", limit=1
                            )
                        )
                        if redis_credenciais:
                            self.credencial_id = redis_credenciais[0].id_credencial
                        else:
                            logger.debug(
                                "Nenhuma credencial Redis encontrada. Usando configuraÃ§Ãµes padrÃ£o (localhost:6379)"
                            )
                            return
                    except Exception:
                        logger.debug("Usando configuraÃ§Ãµes padrÃ£o (localhost:6379)")
                        return

            credencial_id = self.credencial_id

            # Buscar e carregar dados da credencial
            credencial_data = await self.credential_service.get_credencial_decrypted(
                credencial_id
            )
            if not credencial_data:
                logger.warning(f"Credencial nÃ£o encontrada: {credencial_id}")
                return

            dados = credencial_data.get("dados", {})

            # Mapear configuraÃ§Ãµes
            config_map = {
                "redis_host": ["host", "redis_host"],
                "redis_password": ["password", "redis_password"],
            }

            for attr, keys in config_map.items():
                for key in keys:
                    if key in dados:
                        setattr(self, attr, dados[key])
                        break

            # ConfiguraÃ§Ãµes numÃ©ricas com validaÃ§Ã£o
            if "port" in dados:
                try:
                    self.redis_port = int(dados["port"])
                except (ValueError, TypeError):
                    logger.warning("Valor invÃ¡lido para redis_port na credencial")

            if "database" in dados:
                try:
                    self.redis_db = int(dados["database"])
                except (ValueError, TypeError):
                    logger.warning("Valor invÃ¡lido para redis_db na credencial")

            self.config_loaded = True
            logger.debug("ConfiguraÃ§Ãµes do Redis carregadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao carregar configuraÃ§Ãµes da credencial: {str(e)}")
            self.config_loaded = True

    def _validate_config(self):
        """Valida se todas as configuraÃ§Ãµes obrigatÃ³rias estÃ£o presentes"""
        if not self.cache_enabled:
            logger.debug("Cache Redis desabilitado pela configuraÃ§Ã£o")
            return False

        required_configs = {
            "redis_host": self.redis_host,
            "redis_port": self.redis_port,
            "redis_db": self.redis_db,
        }

        logger.debug(f"Validando configuraÃ§Ãµes do Redis: {required_configs}")

        missing_configs = [
            key for key, value in required_configs.items() if value is None
        ]

        if missing_configs:
            logger.warning(
                f"ConfiguraÃ§Ãµes obrigatÃ³rias nÃ£o encontradas para Redis: {', '.join(missing_configs)}. "
                "Cache serÃ¡ desabilitado."
            )
            return False

        return True

    async def _initialize_redis(self) -> Optional[redis.Redis]:
        """Inicializa o cliente Redis"""
        try:
            # Carregar configuraÃ§Ãµes se ainda nÃ£o carregou
            if not self.config_loaded:
                if self.use_credentials and self.credential_service:
                    await self._load_credential_config()
                else:
                    self.config_loaded = True

            # Se nÃ£o hÃ¡ credencial configurada, usar configuraÃ§Ãµes padrÃ£o
            if not self.credencial_id and self.use_credentials:
                logger.debug("Cache Redis usando configuraÃ§Ãµes padrÃ£o (localhost:6379)")
                # Usar configuraÃ§Ãµes padrÃ£o do Redis local
                self.redis_host = "localhost"
                self.redis_port = 6379
                self.redis_db = 0
                self.redis_password = None
                self.cache_enabled = True

            # Validar configuraÃ§Ãµes
            if not self._validate_config():
                return None

            logger.debug(
                f"Conectando ao Redis: {self.redis_host}:{self.redis_port}, DB: {self.redis_db}"
            )

            # Configurar o cliente Redis
            redis_config = {
                "host": self.redis_host,
                "port": self.redis_port,
                "db": self.redis_db,
                "decode_responses": True,
                "socket_timeout": self.socket_timeout,
                "socket_connect_timeout": self.socket_connect_timeout,
                "retry_on_timeout": True,
                **self.additional_kwargs,
            }

            if self.redis_password:
                redis_config["password"] = self.redis_password

            client = redis.Redis(**redis_config)

            # Testar conexÃ£o
            await client.ping()
            logger.debug("Cache Redis conectado")

            # Teste bÃ¡sico de leitura/escrita
            await client.set("test:connection", "ok", ex=10)
            result = await client.get("test:connection")
            if result == "ok":
                await client.delete("test:connection")
                logger.debug("Cache Redis funcionando")
            else:
                raise RuntimeError("Falha no teste de leitura/escrita")

            return client

        except Exception as e:
            logger.warning(f"Cache Redis nÃ£o disponÃ­vel: {e}")
            logger.debug("Continuando sem cache...")
            return None

    async def get_redis_client(self) -> Optional[redis.Redis]:
        """Retorna a instÃ¢ncia do cliente Redis configurado"""
        if not self.redis_client:
            self.redis_client = await self._initialize_redis()
        return self.redis_client

    async def reload_config(self):
        """Recarrega configuraÃ§Ãµes da credencial e reinicializa o Redis"""
        try:
            logger.debug("Recarregando configuraÃ§Ãµes do Redis")

            # Fechar cliente atual se existir
            if self.redis_client:
                await self.close_redis()

            self.config_loaded = False
            self.redis_client = None
            await self.get_redis_client()
            logger.debug("ConfiguraÃ§Ãµes do Redis recarregadas com sucesso")
        except Exception as e:
            logger.error(f"Erro ao recarregar configuraÃ§Ãµes do Redis: {str(e)}")
            raise

    async def close_redis(self):
        """Fecha conexÃ£o com Redis"""
        if self.redis_client:
            try:
                await self.redis_client.close()
                logger.debug("Cache Redis fechado")
            except Exception as e:
                logger.error(f"Erro ao fechar Redis: {e}")
            finally:
                self.redis_client = None

    async def test_connection(self) -> bool:
        """Testa a conexÃ£o com o Redis"""
        try:
            client = await self.get_redis_client()
            if not client:
                return False

            await client.ping()
            return True
        except Exception as e:
            logger.error(f"Erro ao testar conexÃ£o Redis: {e}")
            return False

    def is_enabled(self) -> bool:
        """Verifica se o cache estÃ¡ habilitado"""
        return self.cache_enabled and self.redis_client is not None

    def get_config_info(self) -> dict:
        """Retorna informaÃ§Ãµes sobre a configuraÃ§Ã£o atual"""
        return {
            "redis_host": self.redis_host,
            "redis_port": self.redis_port,
            "redis_db": self.redis_db,
            "cache_enabled": self.cache_enabled,
            "socket_timeout": self.socket_timeout,
            "socket_connect_timeout": self.socket_connect_timeout,
            "use_credentials": self.use_credentials,
            "id_credencial": self.id_credencial,
            "config_loaded": self.config_loaded,
            "client_connected": self.redis_client is not None,
        }


# InstÃ¢ncia global da configuraÃ§Ã£o de cache (removida - usando CacheManager)


async def init_cache(
    db_session: Optional[AsyncSession] = None,
    use_credentials: bool = True,
    id_credencial: Optional[str] = None,
    **kwargs,
) -> None:
    """
    Inicializa o cache Redis globalmente

    Args:
        db_session: SessÃ£o do banco de dados
        use_credentials: Se deve usar sistema de credenciais
        id_credencial: ID da credencial opcional (usado como fallback se variÃ¡vel nÃ£o existir)
        **kwargs: ParÃ¢metros adicionais de configuraÃ§Ã£o
    """
    try:
        cache_config = CacheConfig(
            db_session=db_session,
            use_credentials=use_credentials,
            id_credencial=id_credencial,
            **kwargs,
        )

        redis_client = await cache_config.get_redis_client()
        _cache_manager.cache_config = cache_config
        _cache_manager.redis_client = redis_client

        if redis_client:
            logger.debug("Cache inicializado com sucesso")
        else:
            logger.debug("Cache nÃ£o disponÃ­vel - continuando sem cache")

    except Exception as e:
        logger.error(f"Erro ao inicializar cache: {e}")
        _cache_manager.redis_client = None


async def close_cache():
    """Fecha conexÃ£o com Redis"""
    await _cache_manager.close_cache()


async def get_cache_client() -> Optional[redis.Redis]:
    """Retorna o cliente Redis global"""
    return _cache_manager.redis_client


async def reload_cache_config():
    """Recarrega configuraÃ§Ãµes do cache"""
    if _cache_manager.cache_config:
        await _cache_manager.cache_config.reload_config()
        _cache_manager.redis_client = (
            await _cache_manager.cache_config.get_redis_client()
        )


def is_cache_enabled() -> bool:
    """Verifica se o cache estÃ¡ habilitado e funcionando"""
    return _cache_manager.is_cache_enabled()


def get_cache_info() -> dict:
    """Retorna informaÃ§Ãµes sobre o cache"""
    if _cache_manager.cache_config:
        return _cache_manager.cache_config.get_config_info()

    return {
        "cache_enabled": False,
        "config_loaded": False,
        "client_connected": False,
        "message": "Cache nÃ£o inicializado",
    }


# Factory function para criar instÃ¢ncias facilmente
async def create_cache_config(
    db_session: Optional[AsyncSession] = None,
    use_credentials: bool = True,
    id_credencial: Optional[str] = None,
    **kwargs,
) -> CacheConfig:
    """
    Factory function para criar uma instÃ¢ncia do CacheConfig

    Args:
        db_session: SessÃ£o do banco de dados
        use_credentials: Se deve usar sistema de credenciais
        id_credencial: ID da credencial opcional (usado como fallback se variÃ¡vel nÃ£o existir)
        **kwargs: ParÃ¢metros adicionais

    Returns:
        InstÃ¢ncia configurada do CacheConfig
    """
    cache_config = CacheConfig(
        db_session=db_session,
        use_credentials=use_credentials,
        id_credencial=id_credencial,
        **kwargs,
    )

    # Inicializar configuraÃ§Ãµes
    await cache_config.get_redis_client()
    return cache_config
