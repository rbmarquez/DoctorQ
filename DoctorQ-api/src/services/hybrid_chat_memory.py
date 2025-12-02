# src/services/hybrid_chat_memory.py
import uuid
from typing import Any, Dict, List, Optional

from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.cache_config import is_cache_enabled
from src.config.logger_config import get_logger
from src.models.chat_message import ChatMessageCreate, TipoMessage
from src.services.chat_message_service import ChatMessageService
from src.services.credencial_service import get_credencial_service

logger = get_logger(__name__)


class HybridChatMemory:
    """
    Gerenciador hÃ­brido de memÃ³ria de chat usando Redis (cache) + PostgreSQL (persistÃªncia)

    Funcionalidades:
    - Cache rÃ¡pido no Redis com TTL de 6 horas
    - PersistÃªncia permanente no PostgreSQL
    - Fallback automÃ¡tico Redis â†’ PostgreSQL
    - SincronizaÃ§Ã£o entre as duas camadas
    - AtualizaÃ§Ã£o automÃ¡tica de conversas com agentes customizados
    """

    # Constantes de configuraÃ§Ã£o
    REDIS_TTL_SECONDS = 21600  # 6 horas
    REDIS_TTL_HOURS = 6
    MAX_HISTORY_LIMIT = 50
    RECENT_HISTORY_LIMIT = 10

    def __init__(self, id_conversation: str, agent_id: str, db: AsyncSession):
        """
        Inicializar gerenciador hÃ­brido

        Args:
            id_conversation: ID da conversa
            agent_id: ID do agente
            db: SessÃ£o do banco de dados
        """
        self._validate_inputs(id_conversation, agent_id)

        self.id_conversation = id_conversation
        self.agent_id = agent_id
        self.db = db
        self.redis_session_id = f"{id_conversation}:{agent_id}"

        # Estado interno
        self.redis = None
        self.initialized = False

        # ServiÃ§os
        self.chat_message_service = ChatMessageService()

    def _validate_inputs(self, id_conversation: str, agent_id: str) -> None:
        """Validar parÃ¢metros de entrada"""
        if not id_conversation or not agent_id:
            raise ValueError("id_conversation e agent_id sÃ£o obrigatÃ³rios")

    async def _initialize(self) -> None:
        """InicializaÃ§Ã£o lazy do Redis"""
        if self.initialized:
            return

        try:
            if is_cache_enabled():
                redis_config = await self._get_redis_config()
                if redis_config:
                    self.redis = await self._create_redis_connection(redis_config)

            self.initialized = True
            logger.debug(
                f"MemÃ³ria hÃ­brida inicializada para sessÃ£o: {self.redis_session_id}"
            )

        except Exception as e:
            logger.warning(f"Erro na inicializaÃ§Ã£o da memÃ³ria hÃ­brida: {e}")
            self.initialized = True

    async def _get_redis_config(self) -> Optional[Dict[str, Any]]:
        """Obter configuraÃ§Ã£o do Redis do banco de dados"""
        try:
            # Se temos agent_config, usar configuraÃ§Ã£o de memÃ³ria
            if hasattr(self, "agent_config") and self.agent_config:
                memory_config = self.agent_config.get("memory", {})

                if memory_config.get("ativo", False):
                    credencial_id_str = memory_config.get("credencialId")
                    if credencial_id_str:
                        try:
                            credencial_id = uuid.UUID(credencial_id_str)
                            credencial_service = get_credencial_service()
                            credencial = (
                                await credencial_service.get_credencial_decrypted(
                                    credencial_id
                                )
                            )

                            if credencial and "dados" in credencial:
                                dados = credencial["dados"]
                                logger.debug(
                                    "ConfiguraÃ§Ã£o Redis carregada do agent_config"
                                )
                                return dados
                        except ValueError:
                            logger.warning(
                                f"ID de credencial invÃ¡lido no agent_config: {credencial_id_str}"
                            )
                        except Exception as e:
                            logger.warning(
                                f"Erro ao carregar credencial do agent_config: {e}"
                            )

            # Buscar primeira credencial Redis disponÃ­vel
            try:
                credencial_service = get_credencial_service()
                redis_credenciais = await credencial_service.get_credenciais_by_type(
                    "redisApi", limit=1
                )

                if redis_credenciais:
                    credencial_id = redis_credenciais[0].id_credencial
                    credencial = await credencial_service.get_credencial_decrypted(
                        credencial_id
                    )

                    if credencial and "dados" in credencial:
                        dados = credencial["dados"]
                        logger.debug(
                            f"ConfiguraÃ§Ã£o Redis carregada da primeira credencial disponÃ­vel: {credencial_id}"
                        )
                        return dados

                logger.debug(
                    "Nenhuma credencial Redis encontrada - usando configuraÃ§Ãµes padrÃ£o"
                )
                # Retornar configuraÃ§Ã£o padrÃ£o do Redis local
                return {
                    "host": "localhost",
                    "port": 6379,
                    "database": 0,
                    "password": None,
                }
            except Exception as e:
                logger.warning(f"Erro ao buscar credenciais Redis: {e}")
                logger.debug("Usando configuraÃ§Ãµes padrÃ£o (localhost:6379)")
                # Retornar configuraÃ§Ã£o padrÃ£o do Redis local
                return {
                    "host": "localhost",
                    "port": 6379,
                    "database": 0,
                    "password": None,
                }

        except Exception as e:
            logger.warning(f"Erro ao buscar configuraÃ§Ã£o Redis: {e}")
            return None

    async def _create_redis_connection(
        self, config: Dict[str, Any]
    ) -> Optional[RedisChatMessageHistory]:
        """Criar conexÃ£o Redis com a configuraÃ§Ã£o"""
        try:
            # Construir URL Redis
            if config["password"]:
                redis_url = f"redis://:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
            else:
                redis_url = (
                    f"redis://{config['host']}:{config['port']}/{config['database']}"
                )

            # Criar instÃ¢ncia
            redis_history = RedisChatMessageHistory(
                session_id=self.redis_session_id,
                url=redis_url,
                ttl=self.REDIS_TTL_SECONDS,
            )

            # Testar conexÃ£o
            _ = redis_history.messages

            logger.debug(
                f"Redis conectado: {config['host']}:{config['port']}/{config['database']}"
            )
            return redis_history

        except Exception as e:
            logger.warning(f"Falha na conexÃ£o Redis: {e}")
            return None

    async def add_user_message(self, text: str) -> None:
        """
        Adicionar mensagem do usuÃ¡rio em ambas as camadas

        Args:
            text: ConteÃºdo da mensagem
        """
        await self._initialize()

        if not text or not text.strip():
            logger.warning("Texto da mensagem do usuÃ¡rio estÃ¡ vazio")
            return

        text = text.strip()

        try:
            # 1. Persistir no PostgreSQL
            await self._save_message_to_db(text, TipoMessage.USER_MESSAGE)

            # 2. Cache no Redis
            await self._save_message_to_redis(text, is_user=True)

            # 3. Atualizar conversa automaticamente (novo)
            await self._trigger_conversation_update()

        except Exception as e:
            logger.error(f"Erro ao adicionar mensagem do usuÃ¡rio: {e}")

    async def add_ai_message(self, text: str, tools: Optional[str] = None) -> None:
        """
        Adicionar mensagem da IA em ambas as camadas

        Args:
            text: ConteÃºdo da mensagem
            tools: Tools utilizadas (opcional)
        """
        await self._initialize()

        if not text or not text.strip():
            logger.warning("Texto da mensagem da IA estÃ¡ vazio")
            return

        text = text.strip()

        try:
            # 1. Persistir no PostgreSQL
            await self._save_message_to_db(text, TipoMessage.API_MESSAGE, tools)

            # 2. Cache no Redis
            await self._save_message_to_redis(text, is_user=False)

            # 3. Atualizar conversa automaticamente (novo)
            await self._trigger_conversation_update()

        except Exception as e:
            logger.error(f"Erro ao adicionar mensagem da IA: {e}")

    async def _save_message_to_db(
        self, text: str, tipo: TipoMessage, tools: Optional[str] = None
    ) -> None:
        """Salvar mensagem no PostgreSQL"""
        try:
            id_conversation = self._to_uuid(self.id_conversation)
            message_data = ChatMessageCreate(
                id_agent=id_conversation,
                id_conversation=id_conversation,
                tools=tools,
                nm_text=text,
                nm_tipo=tipo,
            )

            await self.chat_message_service.create_message(message_data)

        except Exception as e:
            logger.error(f"Erro ao salvar na a conversa: {e}")
            raise

    async def _save_message_to_redis(self, text: str, is_user: bool) -> None:
        """Salvar mensagem no Redis"""
        if not self.redis:
            logger.debug("Redis nÃ£o disponÃ­vel para cache")
            return

        try:
            if is_user:
                self.redis.add_user_message(text)
            else:
                self.redis.add_ai_message(text)

        except Exception as e:
            logger.error(f"Erro ao salvar no Redis: {e}")

    async def _trigger_conversation_update(self) -> None:
        """Acionar atualizaÃ§Ã£o automÃ¡tica da conversa usando agentes customizados"""
        try:
            # Importar aqui para evitar dependÃªncia circular
            from src.services.conversation.conversation_auto_update_service import (
                ConversationAutoUpdateService,
            )

            conversation_id = self._to_uuid(self.id_conversation)
            update_service = ConversationAutoUpdateService()

            # Executar atualizaÃ§Ã£o de forma assÃ­ncrona (nÃ£o bloqueante)
            await update_service.update_conversation_on_new_message(
                conversation_id=conversation_id
            )

        except Exception as e:
            # Log do erro mas nÃ£o falha a operaÃ§Ã£o principal
            logger.error(f"Erro na atualizaÃ§Ã£o automÃ¡tica da conversa: {e}")

    def _to_uuid(self, value: str) -> uuid.UUID:
        """Converter string para UUID com validaÃ§Ã£o"""
        try:
            return uuid.UUID(value) if isinstance(value, str) else value
        except ValueError as e:
            logger.error(f"Erro ao converter para UUID: {value}")
            raise ValueError(f"UUID invÃ¡lido: {value}") from e

    async def get_messages(self) -> List[BaseMessage]:
        """
        Recuperar mensagens com estratÃ©gia Redis â†’ PostgreSQL

        Returns:
            Lista de mensagens no formato LangChain
        """
        await self._initialize()

        try:
            # 1. Tentar Redis primeiro
            redis_messages = await self._get_messages_from_redis()
            if redis_messages:
                return redis_messages

            # 2. Fallback para PostgreSQL
            db_messages = await self._get_messages_from_db()
            if not db_messages:
                return []

            return db_messages

        except Exception as e:
            logger.error(f"Erro ao recuperar mensagens: {e}")
            return []

    async def _get_messages_from_redis(self) -> List[BaseMessage]:
        """Recuperar mensagens do Redis"""
        if not self.redis:
            return []

        try:
            messages = self.redis.messages
            return messages or []
        except Exception as e:
            logger.error(f"Erro no Redis: {e}")
            return []

    async def _get_messages_from_db(self) -> List[BaseMessage]:
        """Recuperar mensagens do PostgreSQL e converter para LangChain"""
        try:
            id_conversation = self._to_uuid(self.id_conversation)

            db_messages = await self.chat_message_service.get_conversation_history(
                id_conversation=str(id_conversation), limit=self.MAX_HISTORY_LIMIT
            )

            return self._convert_db_to_langchain(db_messages)

        except Exception as e:
            logger.error(f"Erro no PostgreSQL: {e}")
            return []

    def _convert_db_to_langchain(self, db_messages) -> List[BaseMessage]:
        """Converter mensagens do banco para formato LangChain"""
        langchain_messages = []

        for msg in db_messages:
            try:
                if msg.nm_tipo == "userMessage":
                    langchain_messages.append(HumanMessage(content=msg.nm_text))
                elif msg.nm_tipo == "apiMessage":
                    langchain_messages.append(AIMessage(content=msg.nm_text))
            except Exception as e:
                logger.warning(f"Erro ao converter mensagem {msg.id_chat_message}: {e}")
                continue

        return langchain_messages

    async def clear(self) -> None:
        """Limpar apenas cache Redis (manter PostgreSQL)"""
        await self._initialize()

        try:
            if self.redis:
                self.redis.clear()
            else:
                logger.warning("Redis nÃ£o disponÃ­vel para limpeza")

        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")

    async def clear_all(self) -> None:
        """Limpar Redis E PostgreSQL completamente"""
        await self._initialize()

        try:
            # Limpar Redis
            await self.clear()

            # Limpar PostgreSQL
            conversation_uuid = self._to_uuid(self.id_conversation)
            await self.chat_message_service.delete_messages_by_session(
                conversation_uuid
            )

        except Exception as e:
            logger.error(f"Erro na limpeza completa: {e}")

    async def get_message_count(self) -> int:
        """Contar mensagens na sessÃ£o"""
        try:
            messages = await self.get_messages()
            return len(messages)
        except Exception as e:
            logger.error(f"Erro ao contar mensagens: {e}")
            return 0

    def is_redis_available(self) -> bool:
        """Verificar disponibilidade do Redis"""
        return self.redis is not None

    async def get_memory_status(self) -> Dict[str, Any]:
        """Obter status detalhado da memÃ³ria"""
        await self._initialize()

        status = {
            "id_conversation": self.id_conversation,
            "agent_id": self.agent_id,
            "redis_session_id": self.redis_session_id,
            "redis_available": self.is_redis_available(),
            "initialized": self.initialized,
            "message_count": await self.get_message_count(),
            "ttl_hours": self.REDIS_TTL_HOURS,
            "ttl_seconds": self.REDIS_TTL_SECONDS,
        }

        # InformaÃ§Ãµes de TTL se Redis disponÃ­vel
        if self.redis:
            ttl_info = await self._get_redis_ttl_info()
            status.update(ttl_info)

        return status

    async def _get_redis_ttl_info(self) -> Dict[str, Any]:
        """Obter informaÃ§Ãµes de TTL do Redis"""
        try:
            from src.config.cache_config import get_cache_client

            redis_client = await get_cache_client()

            if not redis_client:
                return {"ttl_error": "cliente_nao_disponivel"}

            key = f"message_store:{self.redis_session_id}"
            ttl_remaining = await redis_client.ttl(key)

            if ttl_remaining > 0:
                hours = ttl_remaining // 3600
                minutes = (ttl_remaining % 3600) // 60
                return self._format_ttl_response(
                    {
                        "ttl_remaining_seconds": ttl_remaining,
                        "ttl_remaining_hours": hours,
                        "ttl_remaining_minutes": minutes,
                    },
                    ttl_remaining,
                )

            elif ttl_remaining == -1:
                return {"ttl_error": "chave_sem_expiracao"}
            else:
                return {"ttl_error": "chave_nao_existe"}

        except Exception as e:
            logger.error(f"Erro ao obter TTL: {e}")
            return {"ttl_error": str(e)}

    async def extend_ttl(self, hours: int = 6) -> bool:
        """
        Estender TTL do Redis

        Args:
            hours: NÃºmero de horas para estender

        Returns:
            True se sucesso, False caso contrÃ¡rio
        """
        try:
            from src.config.cache_config import get_cache_client

            redis_client = await get_cache_client()

            if not redis_client:
                logger.warning("Cliente Redis nÃ£o disponÃ­vel para extensÃ£o TTL")
                return False

            key = f"message_store:{self.redis_session_id}"
            seconds = hours * 3600

            # Verificar se chave existe
            exists = await redis_client.exists(key)
            if not exists:
                logger.warning(f"Chave Redis nÃ£o existe: {key}")
                return False

            # Estender TTL
            await redis_client.expire(key, seconds)
            logger.debug(f"TTL estendido para {hours} horas: {key}")
            return True

        except Exception as e:
            logger.error(f"Erro ao estender TTL: {e}")
            return False

    async def get_ttl_info(self) -> Dict[str, Any]:
        """Obter informaÃ§Ãµes de TTL detalhadas"""
        await self._initialize()

        base_info = {
            "redis_session_id": self.redis_session_id,
            "default_ttl_hours": self.REDIS_TTL_HOURS,
            "default_ttl_seconds": self.REDIS_TTL_SECONDS,
            "redis_available": self.is_redis_available(),
        }

        if not self.is_redis_available():
            return base_info

        # Obter TTL atual
        try:
            from src.config.cache_config import get_cache_client

            redis_client = await get_cache_client()

            if not redis_client:
                base_info["error"] = "cliente_redis_nao_disponivel"
                return base_info

            key = f"message_store:{self.redis_session_id}"
            ttl_remaining = await redis_client.ttl(key)

            return self._format_ttl_response(base_info, ttl_remaining)

        except Exception as e:
            logger.error(f"Erro ao obter informaÃ§Ãµes TTL: {e}")
            base_info["error"] = str(e)
            return base_info

    def _format_ttl_response(
        self, base_info: Dict[str, Any], ttl_remaining: int
    ) -> Dict[str, Any]:
        """Formatar resposta de TTL"""
        if ttl_remaining > 0:
            hours = ttl_remaining // 3600
            minutes = (ttl_remaining % 3600) // 60
            seconds = ttl_remaining % 60

            base_info.update(
                {
                    "ttl_remaining_seconds": ttl_remaining,
                    "ttl_remaining_hours": hours,
                    "ttl_remaining_minutes": minutes,
                    "ttl_remaining_seconds_only": seconds,
                    "formatted_time": f"{hours:02d}:{minutes:02d}:{seconds:02d}",
                    "expires_soon": ttl_remaining < 3600,  # Expira em menos de 1 hora
                    "status": "ativo",
                }
            )
        elif ttl_remaining == -1:
            base_info.update(
                {"status": "sem_expiracao", "warning": "Chave Redis sem TTL definido"}
            )
        else:
            base_info.update(
                {"status": "expirado_ou_inexistente", "ttl_remaining_seconds": 0}
            )

        return base_info


async def create_hybrid_memory(
    id_conversation: str,
    agent_id: str,
    db: AsyncSession,
    agent_config: Optional[Dict[str, Any]] = None,
) -> HybridChatMemory:
    """
    Factory para criar instÃ¢ncia de memÃ³ria hÃ­brida

    Args:
        id_conversation: ID da conversa
        agent_id: ID do agente
        db: SessÃ£o do banco de dados
        agent_config: ConfiguraÃ§Ã£o do agente (opcional)

    Returns:
        InstÃ¢ncia configurada de HybridChatMemory
    """
    try:
        memory = HybridChatMemory(id_conversation, agent_id, db)

        # Configurar agent_config se fornecido
        if agent_config:
            memory.agent_config = agent_config
            logger.debug("agent_config configurado na memÃ³ria hÃ­brida")

        await memory._initialize()
        return memory

    except Exception as e:
        logger.error(
            f"Erro ao criar memÃ³ria hÃ­brida para conversa {id_conversation}: {e}"
        )
        raise RuntimeError(f"Falha na criaÃ§Ã£o da memÃ³ria hÃ­brida: {e}") from e


# FunÃ§Ãµes auxiliares para compatibilidade
async def get_hybrid_memory_status(
    id_conversation: str, agent_id: str, db: AsyncSession
) -> Dict[str, Any]:
    """Obter status da memÃ³ria hÃ­brida"""
    memory = await create_hybrid_memory(id_conversation, agent_id, db)
    return await memory.get_memory_status()


async def clear_hybrid_memory(
    id_conversation: str, agent_id: str, db: AsyncSession
) -> bool:
    """Limpar cache Redis da memÃ³ria hÃ­brida"""
    try:
        memory = await create_hybrid_memory(id_conversation, agent_id, db)
        await memory.clear()
        return True
    except Exception as e:
        logger.error(f"Erro ao limpar memÃ³ria hÃ­brida: {e}")
        return False
