# src/services/langchain_service.py
import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple, Union

from fastapi import Depends
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import AzureChatOpenAI
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.agent_cache import get_agent_cache
from src.config.langfuse_config import get_langfuse_config
from src.config.logger_config import get_logger, is_debug_level
from src.config.orm_config import get_db
from src.models.conversation import ConversationCreate
from src.services.credencial_service import get_credencial_service
from src.services.hybrid_chat_memory import create_hybrid_memory
from src.services.variable_service import VariableService
from src.services.documento_store_service import DocumentoStoreService
from src.tools.manager import ToolManager

logger = get_logger(__name__)


class LangChainService:
    """Service para integração com LangChain, Azure OpenAI e Langfuse"""

    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db
        self.credencial_service = get_credencial_service()
        self.variable_service = VariableService(db)
        self.documento_store_service = DocumentoStoreService(db)
        # LAZY INITIALIZATION - Não inicializar conversation_service aqui para evitar recursão
        self._conversation_service = None
        self.langfuse_config = get_langfuse_config(db_session=db)
        self.azure_llm: Optional[AzureChatOpenAI] = None
        self.tool_manager: Optional[Any] = None  # Will be initialized with callbacks
        self.agent_executor: Optional[AgentExecutor] = None
        self._session_contexts: Dict[str, Optional[Dict[str, Any]]] = (
            {}
        )  # Store session contexts
        self._last_execution_tools: List[str] = []  # Store tools used in last execution
        self._last_execution_sources: List[Dict[str, str]] = []  # Store document sources used

        # Cache para otimizaÃ§Ã£o
        self._agent_cache = None  # SerÃ¡ inicializado assincronamente

        # Anti-recursion flags - inicializar todos aqui
        self._configuring_agent: bool = False
        self._initializing_llm: bool = False
        self._loading_tools: bool = False
        self._initialization_depth: int = 0
        self._max_initialization_depth: int = 3

    @property
    def conversation_service(self):
        """Lazy initialization of conversation_service to avoid circular dependency"""
        if self._conversation_service is None:
            from src.services.conversation_service import ConversationService
            # Criar instância direta com a mesma sessão de banco de dados
            self._conversation_service = ConversationService(self.db)
        return self._conversation_service

    async def _setup_azure_openai(
        self,
        session_id: Optional[str] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> AzureChatOpenAI:
        """Configurar Azure OpenAI"""
        try:
            # Silenciar logs verbosos do OpenAI que podem vazar credenciais
            import logging
            import os

            logging.getLogger("openai").setLevel(logging.WARNING)
            logging.getLogger("openai._base_client").setLevel(logging.WARNING)

            # Buscar credencial do agente
            credencial_id = None
            model_config = {}

            if agent_config and "model" in agent_config:
                model_config = agent_config["model"]

            # Converter model_config para dict ANTES de tentar buscar credencial
            if isinstance(model_config, str):
                model_config_dict = {}  # Usar valores padrÃ£o se for apenas string
            elif hasattr(model_config, 'model_dump'):
                model_config_dict = model_config.model_dump()
            elif hasattr(model_config, 'dict'):
                model_config_dict = model_config.dict()
            else:
                model_config_dict = model_config if isinstance(model_config, dict) else {}

            # Extrair id_credencial da configuraÃ§Ã£o
            credencial_id_str = model_config_dict.get("id_credencial")
            if credencial_id_str:
                try:
                    credencial_id = uuid.UUID(credencial_id_str)
                    logger.debug(f"Usando credencial do agente: {credencial_id}")
                except ValueError:
                    logger.warning(
                        f"ID de credencial do agente invÃ¡lido: {credencial_id_str}"
                    )

            # Tentar buscar credencial do banco se id_credencial foi fornecido
            azure_endpoint: Optional[str] = None
            api_key: Optional[str] = None
            deployment_name: Optional[str] = None
            api_version: Optional[str] = None

            if credencial_id:
                credencial_data: Optional[Dict[str, Any]] = (
                    await self.credencial_service.get_credencial_decrypted(credencial_id)
                )
                if credencial_data and "dados" in credencial_data:
                    dados: Optional[Dict[str, Any]] = credencial_data.get("dados")
                    if dados:
                        azure_endpoint = dados.get("endpoint")
                        api_key = dados.get("api_key")
                        deployment_name = dados.get("deployment_name")
                        api_version = dados.get("api_version")
                        logger.debug("Credenciais carregadas do banco de dados")

            # Fallback para variÃ¡veis de ambiente se credenciais nÃ£o foram carregadas
            if not azure_endpoint or not api_key:
                logger.debug("Usando credenciais de variÃ¡veis de ambiente (.env)")
                azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
                api_key = os.getenv("AZURE_OPENAI_API_KEY")
                deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
                api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

            # Remover /openai/v1 do final do endpoint se presente
            if azure_endpoint and azure_endpoint.endswith("/openai/v1"):
                azure_endpoint = azure_endpoint.replace("/openai/v1", "")
                logger.debug(f"Endpoint Azure ajustado: {azure_endpoint}")

            if not azure_endpoint or not api_key:
                raise ValueError("Credenciais Azure OpenAI nÃ£o encontradas (banco ou .env)")

            # Obter callbacks do Langfuse para Azure OpenAI
            # Reabilitar callbacks apÃ³s confirmar que streaming funciona
            if session_id:
                callbacks = self.langfuse_config.get_callbacks_with_session(
                    session_id=session_id, trace_name="AgentExecutor"
                )
                logger.debug(
                    f"Callbacks Langfuse para Azure OpenAI habilitados (session: {session_id}): {len(callbacks)} callbacks"
                )
            else:
                callbacks = self.langfuse_config.get_callbacks()
                logger.debug(
                    f"Callbacks Langfuse padrÃ£o para Azure OpenAI: {len(callbacks)} callbacks"
                )

            # Usar configurações do agente ou valores padrão
            temperature = model_config_dict.get("temperature", 0.7)
            max_tokens = model_config_dict.get("max_tokens", None)
            top_p = model_config_dict.get("top_p", 1.0)
            stream = model_config_dict.get(
                "stream", True
            )  # Usar configuração de streaming do agente
            timeout = model_config_dict.get(
                "timeout", 300.0
            )  # Usar configuração de timeout do agente

            llm = AzureChatOpenAI(
                azure_endpoint=azure_endpoint,
                api_key=SecretStr(api_key),
                azure_deployment=deployment_name,
                model=deployment_name,  # NecessÃ¡rio para Langfuse capturar tokens corretamente
                api_version=api_version,
                temperature=temperature,
                top_p=top_p,  # ParÃ¢metro explÃ­cito para evitar warning
                streaming=stream,  # Usar configuraÃ§Ã£o de streaming do agente
                verbose=is_debug_level(),  # Habilitar verbose apenas em DEBUG
                callbacks=callbacks,  # Reabilitar callbacks
                max_tokens=max_tokens,  # Usar max_tokens do agente
                timeout=timeout,  # Usar timeout configurado no agente
            )

            logger.debug(
                f"Azure OpenAI configurado - temp: {temperature}, max_tokens: {max_tokens}, top_p: {top_p}, stream: {stream}, timeout: {timeout}s"
            )

            logger.debug("Azure OpenAI configurado")

            return llm

        except Exception as e:
            logger.error(f"Erro ao configurar Azure OpenAI: {e}")
            raise RuntimeError(f"Falha na configuraÃ§Ã£o do Azure OpenAI: {e}") from e

    async def _setup_agent_executor(
        self,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> Optional[AgentExecutor]:
        """Configurar agente com tools usando cache"""
        try:
            # Inicializar cache se necessÃ¡rio
            if not self._agent_cache:
                self._agent_cache = await get_agent_cache()

            # Gerar chave de cache baseada no agent_config
            agent_id = None
            if agent_config and "agent_id" in agent_config:
                try:
                    agent_id = uuid.UUID(str(agent_config["agent_id"]))
                except (ValueError, TypeError):
                    logger.warning(
                        f"agent_id invÃ¡lido no agent_config: {agent_config.get('agent_id')}"
                    )

            # Tentar obter do cache primeiro (incluindo filtros na chave)
            if agent_id:
                cached_executor = await self._agent_cache.get_agent_executor(
                    agent_id, filter_sources
                )
                if cached_executor:
                    logger.info(
                        f"AgentExecutor obtido do cache: {agent_id} (filtros: {filter_sources})"
                    )
                    self.agent_executor = cached_executor
                    return cached_executor

            # Verificar profundidade de inicializaÃ§Ã£o
            self._initialization_depth += 1
            if self._initialization_depth > self._max_initialization_depth:
                logger.error(
                    f"Profundidade mÃ¡xima de inicializaÃ§Ã£o excedida: {self._initialization_depth}"
                )
                self._initialization_depth -= 1
                return None

            # Verificar se jÃ¡ estÃ¡ em processo de configuraÃ§Ã£o para evitar recursÃ£o
            if self._configuring_agent:
                logger.warning(
                    "ConfiguraÃ§Ã£o de agente jÃ¡ em andamento, evitando recursÃ£o"
                )
                self._initialization_depth -= 1
                return None

            self._configuring_agent = True

            # CORREÃ‡ÃƒO: Obter callbacks do Langfuse ANTES de usar
            if session_id:
                callbacks = self.langfuse_config.get_callbacks_with_session(
                    session_id=session_id, trace_name="AgentExecutor"
                )
            else:
                callbacks = self.langfuse_config.get_callbacks()

            # Inicializar tool manager de forma mais simples
            if not self.tool_manager:
                # Criar contexto de trace se Langfuse estiver disponÃ­vel
                trace_context = None
                if (
                    session_id
                    and self.langfuse_config
                    and self.langfuse_config.is_initialized()
                ):
                    try:
                        trace_context = self.langfuse_config.create_session_context(
                            session_id=session_id, trace_name="AgentExecutor"
                        )
                    except Exception as e:
                        logger.warning(
                            f"Erro ao criar trace context para ToolManager: {e}"
                        )
                        trace_context = None

                # Converter user_id para UUID se necessÃ¡rio
                user_uuid = None
                if user_id:
                    try:
                        user_uuid = (
                            uuid.UUID(user_id) if isinstance(user_id, str) else user_id
                        )
                    except ValueError:
                        logger.warning(f"user_id invÃ¡lido para ToolManager: {user_id}")
                        user_uuid = None

                # Extrair agent_id do agent_config se disponÃ­vel
                agent_id_str = None
                if agent_config and "agent_id" in agent_config:
                    agent_id_str = str(agent_config["agent_id"])

                self.tool_manager = ToolManager(
                    self.db,
                    callbacks=callbacks if session_id else [],
                    langfuse_config=self.langfuse_config,  # Reabilitar langfuse
                    session_trace_context=trace_context,  # Usar trace context em vez de session_id
                    user_id=user_uuid,  # Passar user_id para filtro SEI
                    agent_id=agent_id_str,  # Passar agent_id para tools que precisam
                )
                logger.debug(
                    f"ToolManager inicializado com Langfuse (session: {session_id}, trace_context: {trace_context is not None})"
                )

            # Carregar tools com proteÃ§Ã£o anti-recursÃ£o
            if self._loading_tools:
                logger.warning("Tools jÃ¡ sendo carregados, evitando recursÃ£o")
                self._configuring_agent = False
                self._initialization_depth -= 1
                return None

            self._loading_tools = True
            tools: List[Any] = []
            try:
                logger.debug("Iniciando carregamento simplificado de tools...")

                # Carregar tools de forma mais direta
                try:
                    loaded_tools: List[Any] = await asyncio.wait_for(
                        self.tool_manager.load_active_tools(
                            filter_sources=filter_sources, agent_config=agent_config
                        ),
                        timeout=300.0,  # Aumentado para 5 minutos
                    )

                    # Filtrar tools com teste mais rigoroso para evitar recursÃ£o
                    for tool in loaded_tools:
                        try:
                            # Teste mais completo para detectar tools problemÃ¡ticas
                            tool_name = getattr(tool, "name", None)
                            tool_desc = getattr(tool, "description", None)

                            if tool_name and tool_desc:
                                # Tentar acessar schema para detectar recursÃ£o
                                try:
                                    # Teste que pode falhar se houver recursÃ£o na tool
                                    _ = (
                                        tool.args_schema
                                        if hasattr(tool, "args_schema")
                                        else None
                                    )
                                    tools.append(tool)
                                    logger.debug(f"Tool vÃ¡lida adicionada: {tool_name}")
                                except Exception as schema_error:
                                    logger.warning(
                                        f"Tool {tool_name} ignorada por problema de schema: {schema_error}"
                                    )
                            else:
                                logger.warning(
                                    f"Tool ignorada por falta de atributos: {type(tool)}"
                                )

                        except Exception as tool_error:
                            logger.warning(
                                f"Tool ignorada por erro geral: {tool_error}"
                            )

                    logger.debug(f"Tools filtradas e validadas: {len(tools)} tools")

                except asyncio.TimeoutError:
                    logger.error("Timeout ao carregar tools")
                    tools = []
                except Exception as e:
                    logger.error(f"Erro ao carregar tools: {e}")
                    tools = []

            finally:
                self._loading_tools = False

            if not tools:
                logger.error("Nenhuma tool foi carregada pelo ToolManager")

                # DiagnÃ³stico para entender o problema
                diagnosis = await self.diagnose_tools_loading()
                logger.error(f"DiagnÃ³stico de tools: {diagnosis}")

                # Decidir se continua sem tools ou falha
                if diagnosis["db_tools_count"] == 0:
                    logger.warning(
                        "Nenhuma tool ativa no banco de dados - criando agente sem tools"
                    )
                    # Prosseguir sem tools
                else:
                    logger.error(
                        "Tools existem no banco mas nÃ£o foram carregadas - falha crÃ­tica"
                    )
                    self._configuring_agent = False
                    self._initialization_depth -= 1
                    return None

            if not self.azure_llm:
                logger.error("Azure LLM nÃ£o configurado antes da criaÃ§Ã£o do agente")
                self._configuring_agent = False
                self._initialization_depth -= 1
                return None

            # Criar prompt
            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", "{system_prompt}"),
                    MessagesPlaceholder(variable_name="chat_history"),
                    ("user", "{input}"),
                    MessagesPlaceholder(variable_name="agent_scratchpad"),
                ]
            )

            # Criar agente com tools disponÃ­veis
            agent: Optional[Any] = None
            final_tools: List[Any] = []

            try:
                if tools and len(tools) > 0:
                    logger.debug(f"Tentando criar agente com {len(tools)} tools")

                    # Log detalhado das tools
                    for i, tool in enumerate(tools):
                        tool_name = getattr(tool, "name", "unknown")
                        tool_desc = getattr(tool, "description", "no description")
                        logger.debug(f"Tool {i+1}: {tool_name} - {tool_desc}")

                    # EstratÃ©gia mais segura - criar agent sem validaÃ§Ã£o complexa das tools
                    # para evitar recursÃ£o nas anotaÃ§Ãµes Pydantic
                    logger.debug("Criando agent com estratÃ©gia simplificada")

                    # Criar agent diretamente com as tools carregadas
                    agent = create_openai_functions_agent(
                        llm=self.azure_llm, tools=tools, prompt=prompt
                    )
                    final_tools = tools
                    logger.debug(
                        f"Agente criado COM {len(final_tools)} tools com sucesso (estratÃ©gia simplificada)"
                    )

                else:
                    logger.warning(
                        "Nenhuma tool disponÃ­vel - OpenAI functions agent requer pelo menos uma tool"
                    )
                    agent = None
                    final_tools = []

            except Exception as e:
                logger.error(f"Erro crÃ­tico ao criar agente: {e}")
                # Se houver recursÃ£o, registrar e retornar None
                if "maximum recursion depth exceeded" in str(e):
                    logger.error(
                        "Detectada recursÃ£o mÃ¡xima - abortando criaÃ§Ã£o do agente"
                    )
                elif "RecursionError" in str(e):
                    logger.error("Erro de recursÃ£o detectado - problema com tools")

                # NÃ£o tentar criar agent sem tools - OpenAI functions agent requer pelo menos uma tool
                logger.warning(
                    "NÃ£o Ã© possÃ­vel criar OpenAI functions agent sem tools - abortando criaÃ§Ã£o do agente"
                )
                agent = None
                final_tools = []

            # Callbacks jÃ¡ foram definidos no inÃ­cio da funÃ§Ã£o

            # Criar AgentExecutor apenas se hÃ¡ um agente vÃ¡lido e tools
            if agent is not None and len(final_tools) > 0:
                try:
                    agent_executor = AgentExecutor(
                        agent=agent,
                        tools=final_tools,
                        verbose=is_debug_level(),  # Habilitar verbose apenas em DEBUG
                        max_iterations=100,  # Aumentado para 100 iteraÃ§Ãµes para arquivos grandes
                        max_execution_time=60
                        * 20,  # Aumentado para 20 minutos para arquivos grandes
                        return_intermediate_steps=True,  # Habilitar para capturar tools utilizadas
                        callbacks=callbacks,
                    )
                    logger.debug(
                        f"AgentExecutor criado com sucesso com {len(final_tools)} tools"
                    )

                    # APÃ“S o AgentExecutor ser criado, habilitar inicializaÃ§Ã£o de serviÃ§os nas tools RAG
                    if self.tool_manager:
                        self.tool_manager.enable_service_initialization()

                        # ForÃ§ar inicializaÃ§Ã£o imediata dos serviÃ§os RAG
                        loaded_tools = self.tool_manager.get_loaded_tools()
                        for tool in loaded_tools:
                            if hasattr(tool, "force_services_initialization"):
                                try:
                                    tool.force_services_initialization()
                                    logger.debug(
                                        f"ServiÃ§os inicializados para tool: {tool.name}"
                                    )
                                except Exception as e:
                                    logger.warning(
                                        f"Erro ao inicializar serviÃ§os para tool {tool.name}: {e}"
                                    )

                    self.agent_executor = agent_executor
                    logger.debug("AgentExecutor armazenado com sucesso")

                    # Salvar no cache se temos agent_id (incluindo filtros na chave)
                    if agent_id and self._agent_cache:
                        await self._agent_cache.set_agent_executor(
                            agent_id, agent_executor, filter_sources
                        )
                        logger.debug(
                            f"AgentExecutor salvo no cache: {agent_id} (filtros: {filter_sources})"
                        )

                except Exception as e:
                    logger.error(f"Erro ao criar AgentExecutor: {e}", exc_info=True)
                    agent_executor = None
                    logger.warning(
                        "AgentExecutor nÃ£o criado devido a erro - serÃ¡ usado LLM direto"
                    )
            else:
                # Sem agente ou sem tools - usar LLM direto
                agent_executor = None
                if agent is None:
                    logger.warning(
                        "AgentExecutor nÃ£o criado - nenhum agente disponÃ­vel - serÃ¡ usado LLM direto"
                    )
                else:
                    logger.warning(
                        "AgentExecutor nÃ£o criado - nenhuma tool disponÃ­vel - serÃ¡ usado LLM direto"
                    )

                logger.debug(
                    "InicializaÃ§Ã£o de serviÃ§os habilitada apÃ³s criaÃ§Ã£o do agente"
                )

            if callbacks:
                logger.debug(f"Callbacks Langfuse ativos: {len(callbacks)}")
            # else:
            #     logger.warning("Nenhum callback Langfuse ativo")

            self._configuring_agent = False
            self._initialization_depth -= 1
            return agent_executor

        except Exception as e:
            logger.error(f"Erro ao configurar agente: {e}")
            self._configuring_agent = False
            self._initialization_depth -= 1
            return None

    def _add_user_authentication_block(
        self,
        prompt: str,
        user_name: str,
        user_email: Optional[str] = None,
        user_login: Optional[str] = None,
    ) -> str:
        """Adiciona bloco de autenticaÃ§Ã£o do usuÃ¡rio ao prompt"""
        auth_block = f"""
        VocÃª foi desenvolvido pelo time de desenvolvimento do MinistÃ©rio dos Transportes.
        Sempre complemente educadamente o prompt com o bloco de autenticaÃ§Ã£o do usuÃ¡rio.

        Nunca Exiba o bloco de autenticaÃ§Ã£o do usuÃ¡rio.
        <user_autentication>
            <user_name_full>{user_name}</user_name_full>
            <user_login>{user_login}</user_login>
            <user_email>{user_email}</user_email>
        </user_autentication>
        """
        # Adiciona o bloco no final do prompt
        return prompt + auth_block

    def _get_default_system_prompt_without_auth(
        self,
        user_name: str,
        use_tools: bool = False,
    ) -> str:
        """Prompt padrÃ£o do sistema sem bloco de autenticaÃ§Ã£o"""
        base_prompt = f"""
        VocÃª Ã© Assistente virtual inteligente para facilitar o acesso aos serviÃ§os internos do MinistÃ©rio dos Transportes.

        Sempre complemente ao "{user_name}" a mensagem de saudaÃ§Ã£o com apenas o primeiro nome.
        Se acontecer um erro informe o usuÃ¡rio que ocorreu um erro e que ele deve tentar novamente mais tarde.
        """

        if use_tools:
            base_prompt += """

        VocÃª tem acesso a ferramentas (tools) que podem ajudar a executar tarefas especÃ­ficas.
        Use essas ferramentas quando apropriado para fornecer respostas mais precisas.

        <sei>
        Sempre exiba o nÃºmero do documento do SEI.
        Sempre exiba a unidade geradora do SEI.
        Sempre exiba a data da GeraÃ§Ã£o do Documento.

        <dica>
          Dica:  50000.034534/2020-60 Ã© um nÃºmero de processo Ã© mesmo 50000034534202060
          Quando pedir para detalhar usando nÃºmero processo pode exibir o indice que foram encontrados na busca.
        </dica>
        </sei>
        """

        return base_prompt


    async def _get_document_store_context(
        self,
        user_message: str,
        document_store_ids: List[str],
        top_k: int = 3,
    ) -> Tuple[str, List[Dict[str, str]]]:

        """
        Buscar contexto relevante dos Document Stores vinculados ao agente
        
        Args:
            user_message: Mensagem do usuário para buscar contexto relevante
            document_store_ids: IDs dos Document Stores vinculados ao agente
            top_k: Número máximo de chunks a retornar por Document Store
            
        Returns:
            String com o contexto formatado dos documentos encontrados
        """
        if not document_store_ids:
            return "", []
        
        logger.info(f"Buscando contexto em {len(document_store_ids)} Document Stores")
        
        all_results = []
        for doc_store_id in document_store_ids:
            try:
                logger.debug(f"Consultando Document Store {doc_store_id} com query: '{user_message}'")
                results = await self.documento_store_service.query_document_store(
                    document_store_id=uuid.UUID(doc_store_id),
                    query=user_message,
                    top_k=top_k,
                )
                logger.info(f"Document Store {doc_store_id} retornou {len(results)} resultados")
                if results:
                    logger.debug(f"Primeiros resultados: {results[:1]}")
                all_results.extend(results)
            except Exception as e:
                logger.warning(f"Erro ao consultar Document Store {doc_store_id}: {str(e)}", exc_info=True)
                continue

        logger.info(f"Total de resultados encontrados: {len(all_results)}")
        if not all_results:
            logger.warning("Nenhum resultado encontrado nos Document Stores - retornando vazio")
            return "", []
        
        # Formatar contexto para o prompt
        context_parts = ["\n## Contexto Relevante dos Documentos:\n"]
        for i, result in enumerate(all_results[:top_k * len(document_store_ids)], 1):
            context_parts.append(
                f"\n[Documento {i}] {result.get('filename', 'unknown')}:\n"
                f"{result.get('content', '')}\n"
            )
        
        context = "".join(context_parts)

        # Coletar fontes/sources usadas
        sources = []
        for result in all_results[:top_k * len(document_store_ids)]:
            sources.append({
                "filename": result.get('filename', 'unknown'),
                "chunk_id": result.get('chunk_id', ''),
                "chunk_index": str(result.get('chunk_index', 0)),
            })

        logger.info(f"Contexto RAG gerado: {len(context)} caracteres, {len(sources)} sources coletadas")
        logger.debug(f"Sources: {sources}")
        return context, sources


    async def _prepare_messages_with_history(
        self,
        user_message: str,
        id_conversation: str,
        system_prompt: Optional[str] = None,
        user_name: str = "Fulano",
        user_email: Optional[str] = None,
        user_login: Optional[str] = None,
        agent_id: Optional[str] = None,
        use_tools: bool = False,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Union[Dict[str, Any], List[Any]], Any]:
        """Preparar mensagens com histÃ³rico"""
        effective_agent_id = agent_id or id_conversation
        memory = await create_hybrid_memory(
            id_conversation, effective_agent_id, self.db, agent_config
        )
        history: List[Any] = await memory.get_messages()
        recent_history: List[Any] = history[-10:] if history else []

        await memory.add_user_message(user_message)

        # Buscar contexto dos Document Stores vinculados (RAG)
        rag_context = ""
        if agent_config and "document_store_ids" in agent_config:
            document_store_ids = agent_config.get("document_store_ids", [])
            if document_store_ids:
                rag_context, sources = await self._get_document_store_context(
                    user_message=user_message,
                    document_store_ids=document_store_ids,
                    top_k=3,
                )
                # Armazenar sources para retornar na resposta
                self._last_execution_sources = sources

        if use_tools and self.agent_executor:
            # Usar prompt do agente ou padrÃ£o, sempre com bloco de autenticaÃ§Ã£o
            if system_prompt:
                # Adicionar contexto RAG ao system_prompt se houver
                if rag_context:
                    system_prompt = f"{system_prompt}\n\n{rag_context}"
                final_prompt = self._add_user_authentication_block(
                    system_prompt, user_name, user_email, user_login
                )
            else:
                default_prompt = self._get_default_system_prompt_without_auth(
                    user_name, use_tools=True
                )
                # Adicionar contexto RAG ao default_prompt se houver
                if rag_context:
                    default_prompt = f"{default_prompt}\n\n{rag_context}"
                final_prompt = self._add_user_authentication_block(
                    default_prompt, user_name, user_email, user_login
                )

            agent_input = {
                "input": user_message,
                "chat_history": recent_history,
                "system_prompt": final_prompt,
            }
            return agent_input, memory

        messages = []
        if system_prompt:
            # Adicionar contexto RAG ao system_prompt se houver
            if rag_context:
                system_prompt = f"{system_prompt}\n\n{rag_context}"
            # Adicionar bloco de autenticaÃ§Ã£o ao prompt do agente
            final_prompt = self._add_user_authentication_block(
                system_prompt, user_name, user_email, user_login
            )
            messages.append(SystemMessage(content=final_prompt))
        else:
            default_prompt = self._get_default_system_prompt_without_auth(
                user_name, use_tools=False
            )
            # Adicionar contexto RAG ao default_prompt se houver
            if rag_context:
                default_prompt = f"{default_prompt}\n\n{rag_context}"
            final_prompt = self._add_user_authentication_block(
                default_prompt, user_name, user_email, user_login
            )
            messages.append(SystemMessage(content=final_prompt))

        messages.extend(recent_history)
        messages.append(HumanMessage(content=user_message))
        return messages, memory

    async def _prepare_messages_simple(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        user_name: str = "",
        use_tools: bool = False,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> Union[Dict[str, Any], List[Any]]:
        """Preparar mensagens sem histÃ³rico"""

        # Buscar contexto dos Document Stores vinculados (RAG)
        rag_context = ""
        if agent_config and "document_store_ids" in agent_config:
            document_store_ids = agent_config.get("document_store_ids", [])
            if document_store_ids:
                rag_context, sources = await self._get_document_store_context(
                    user_message=user_message,
                    document_store_ids=document_store_ids,
                    top_k=3,
                )
                # Armazenar sources para retornar na resposta
                self._last_execution_sources = sources

        # Adicionar contexto RAG ao system_prompt se houver
        if rag_context:
            if system_prompt:
                system_prompt = f"{system_prompt}\n\n{rag_context}"
            else:
                system_prompt = rag_context

        if use_tools and self.agent_executor:
            # Usar prompt do agente ou padrÃ£o, sempre com bloco de autenticaÃ§Ã£o
            if system_prompt:
                final_prompt = self._add_user_authentication_block(
                    system_prompt, user_name
                )
            else:
                default_prompt = self._get_default_system_prompt_without_auth(
                    user_name, use_tools=True
                )
                final_prompt = self._add_user_authentication_block(
                    default_prompt, user_name
                )

            agent_input = {
                "input": user_message,
                "chat_history": [],
                "system_prompt": final_prompt,
            }
            return agent_input
        else:
            messages = []
            if system_prompt:
                # Adicionar bloco de autenticaÃ§Ã£o ao prompt do agente
                final_prompt = self._add_user_authentication_block(
                    system_prompt, user_name
                )
                messages.append(SystemMessage(content=final_prompt))
            else:
                default_prompt = self._get_default_system_prompt_without_auth(
                    user_name, use_tools=False
                )
                final_prompt = self._add_user_authentication_block(
                    default_prompt, user_name
                )
                messages.append(SystemMessage(content=final_prompt))

            messages.append(HumanMessage(content=user_message))
            return messages

    async def _ensure_llm_ready(
        self,
        use_tools: bool = False,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Garantir que LLM e Langfuse estÃ£o prontos"""
        # Verificar profundidade de inicializaÃ§Ã£o
        self._initialization_depth += 1
        if self._initialization_depth > self._max_initialization_depth:
            logger.error(
                f"Profundidade mÃ¡xima de inicializaÃ§Ã£o excedida em _ensure_llm_ready: {self._initialization_depth}"
            )
            self._initialization_depth -= 1
            return

        # Verificar se jÃ¡ estÃ¡ em processo de inicializaÃ§Ã£o para evitar recursÃ£o
        if self._initializing_llm:
            logger.warning("LLM jÃ¡ em processo de inicializaÃ§Ã£o, evitando recursÃ£o")
            self._initialization_depth -= 1
            return

        self._initializing_llm = True
        logger.debug(
            f"Iniciando inicializaÃ§Ã£o do LLM (profundidade: {self._initialization_depth})"
        )

        try:
            # Configurar Langfuse com base no agent_config se disponÃ­vel
            if agent_config:
                logger.debug("Configurando Langfuse com agent_config...")
                langfuse_configured = (
                    self.langfuse_config.set_credential_from_agent_config(agent_config)
                )
                if langfuse_configured:
                    logger.debug("Langfuse configurado com credencial do agent_config")
                else:
                    logger.debug(
                        "Langfuse nÃ£o configurado via agent_config - usando configuraÃ§Ã£o padrÃ£o"
                    )

            # Verificar se observabilidade estÃ¡ ativa no agente
            observability_active = False
            if agent_config:
                observability_config = agent_config.get("observability", {})
                observability_active = observability_config.get("ativo", False)

            # Inicializar Langfuse apenas se habilitado E observabilidade ativa no agente
            if (
                self.langfuse_config.enabled
                and observability_active
                and not self.langfuse_config.is_initialized()
            ):
                logger.debug("Inicializando Langfuse...")
                success = await self.langfuse_config.initialize(self.credencial_service)
                if success:
                    logger.debug("Langfuse inicializado com sucesso")
                    # Configurar rastreamento detalhado de inputs
                    self.langfuse_config.configure_input_tracking(
                        enable_detailed_tracking=True
                    )
                    logger.debug(
                        f"Status do Langfuse: {self.langfuse_config.get_status()}"
                    )
                else:
                    logger.error(
                        "Falha ao inicializar Langfuse - traces nÃ£o serÃ£o enviados"
                    )
                    logger.debug("Verificando configuraÃ§Ã£o...")
                    status = self.langfuse_config.get_status()
                    logger.debug(f"Status detalhado: {status}")
            elif self.langfuse_config.is_initialized():
                # Garantir que a configuraÃ§Ã£o de tracking esteja ativa
                self.langfuse_config.configure_input_tracking(
                    enable_detailed_tracking=True
                )
            else:
                if not observability_active:
                    logger.debug(
                        "Observabilidade desativada no agente - Langfuse nÃ£o serÃ¡ inicializado"
                    )
                else:
                    logger.warning("Langfuse desabilitado")

            # Configurar cache Redis se memÃ³ria estiver habilitada
            if agent_config and agent_config.get("memory", {}).get("ativo", False):
                from src.config.cache_config import _cache_manager

                if _cache_manager.cache_config:
                    _cache_manager.cache_config.set_credential_from_agent_config(
                        agent_config
                    )
                    logger.debug("Cache Redis configurado com agent_config")

            if not self.azure_llm:
                self.azure_llm = await self._setup_azure_openai(
                    session_id=session_id, agent_config=agent_config
                )

            if use_tools and not self.agent_executor:
                try:
                    self.agent_executor = await self._setup_agent_executor(
                        session_id=session_id,
                        user_id=user_id,
                        filter_sources=filter_sources,
                        agent_config=agent_config,
                    )
                except Exception:
                    logger.warning("Continuando sem Agent Executor - usando apenas LLM")
                    self.agent_executor = None
            elif use_tools and self.agent_executor:
                logger.debug("Agent Executor jÃ¡ existe, nÃ£o reconfigurando")
            elif not use_tools:
                logger.debug("Tools desabilitadas, nÃ£o configurando Agent Executor")
            else:
                logger.debug(
                    "CondiÃ§Ãµes nÃ£o atendidas para configuraÃ§Ã£o do Agent Executor"
                )
        finally:
            self._initializing_llm = False
            self._initialization_depth -= 1

    async def _handle_conversation(
        self, user_id: str, conversation_token: Optional[str] = None
    ) -> str:
        """Gerenciar conversa"""
        try:
            if isinstance(user_id, str):
                try:
                    user_uuid = uuid.UUID(user_id)
                except ValueError:
                    logger.warning(f"user_id invÃ¡lido: {user_id}")
                    user_uuid = uuid.uuid4()
            else:
                user_uuid = user_id

            if conversation_token:
                existing_conversation = (
                    await self.conversation_service.get_conversation_by_token(
                        conversation_token
                    )
                )
                if existing_conversation:
                    # ForÃ§ar UUID puro
                    conv_id = existing_conversation.id_conversa
                    if not isinstance(conv_id, uuid.UUID):
                        conv_id = uuid.UUID(str(conv_id))

                    # Verificar se conversa estÃ¡ ativa
                    st_ativa = existing_conversation.st_ativa
                    if isinstance(st_ativa, bool):
                        ativa = st_ativa
                    else:
                        ativa = str(st_ativa) == "S"

                    # Verificar se expirou (opcional - baseado em dt_expira_em)
                    is_expired = False
                    if hasattr(existing_conversation, 'dt_expira_em') and existing_conversation.dt_expira_em:
                        is_expired = existing_conversation.dt_expira_em < datetime.now()

                    # Retornar conversa existente se ativa e nÃ£o expirada
                    if ativa and not is_expired:
                        return str(conv_id)

            new_token = conversation_token or f"conv_{uuid.uuid4().hex[:12]}"
            conversation_data = ConversationCreate(
                id_user=user_uuid,
                nm_token=new_token,
                dt_expira_em=datetime.now() + timedelta(days=1),
                st_ativa="S",
                nm_titulo=None,
                ds_resumo=None,
                qt_mensagens=0,
                dt_ultima_atividade=datetime.now(),
            )
            new_conversation = await self.conversation_service.create_conversation(
                conversation_data
            )

            return str(new_conversation.id_conversa)

        except Exception as e:
            logger.error(f"Erro ao gerenciar conversa: {e}")
            return str(uuid.uuid4())

    async def _get_or_create_session_context(
        self, session_id: str
    ) -> Optional[Dict[str, Any]]:
        """Obter ou criar contexto de sessÃ£o para Langfuse - usando apenas callbacks automÃ¡ticos"""
        if session_id not in self._session_contexts:
            if self.langfuse_config.is_initialized():
                # NÃ£o criar trace manual - deixar apenas os callbacks automÃ¡ticos
                self._session_contexts[session_id] = {
                    "initialized": True,
                    "session_id": session_id,
                }

            else:
                logger.warning(
                    f"Langfuse nÃ£o inicializado - sessÃ£o nÃ£o criada para session_id: {session_id}"
                )
                self._session_contexts[session_id] = None
        else:
            logger.debug(f"Usando sessÃ£o existente para: {session_id}")

        return self._session_contexts.get(session_id)

    async def _finalize_session_context(
        self, session_id: str, success: bool = True, error: Optional[str] = None
    ) -> None:
        """Finalizar contexto de sessÃ£o - apenas log, nÃ£o hÃ¡ trace manual para finalizar"""
        if session_id in self._session_contexts:
            context = self._session_contexts[session_id]
            if context:
                try:
                    status = "success" if success else "error"
                    logger.debug(f"SessÃ£o {session_id} finalizada com status: {status}")
                    if error:
                        logger.debug(f"Erro da sessÃ£o: {error}")

                except Exception as e:
                    logger.error(f"Erro ao finalizar sessÃ£o {session_id}: {e}")

    async def get_tools_used_in_last_execution(self) -> List[str]:
        """Retorna lista dos nomes das tools utilizadas na Ãºltima execuÃ§Ã£o"""
        return self._last_execution_tools.copy()

    async def get_sources_used_in_last_execution(self) -> List[Dict[str, str]]:
        """Retorna lista das fontes/documentos utilizados na última execução do RAG"""
        return self._last_execution_sources.copy()


    def _extract_tools_from_intermediate_steps(
        self, intermediate_steps: List[Any]
    ) -> List[str]:
        """Extrai nomes das tools dos intermediate steps"""
        tools_used = []
        for step in intermediate_steps:
            if len(step) >= 2:
                action = step[0]
                if hasattr(action, "tool"):
                    tools_used.append(action.tool)
        return tools_used

    async def run_process_streaming(
        self,
        user_message: str,
        user_id: str,
        conversation_token: Optional[str] = None,
        system_prompt: Optional[str] = None,
        user_name: Optional[str] = None,
        user_email: Optional[str] = None,
        user_login: Optional[str] = None,
        use_memory: bool = False,
        use_tools: bool = False,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[str, None]:
        """Processar chat com streaming"""
        session_id: Optional[str] = None
        try:
            id_conversation = await self._handle_conversation(
                user_id, conversation_token
            )
            # Usar conversation_id como session_id para trace_id do Langfuse
            session_id = id_conversation
            logger.debug(f"Usando session_id para Langfuse: {session_id}")

            # PRIMEIRO: Garantir que LLM e Langfuse estÃ£o prontos
            await self._ensure_llm_ready(
                use_tools=use_tools,
                session_id=session_id,
                user_id=user_id,
                filter_sources=filter_sources,
                agent_config=agent_config,
            )

            # DEPOIS: Criar contexto de sessÃ£o no Langfuse (agora jÃ¡ inicializado)
            await self._get_or_create_session_context(session_id)

            memory: Optional[Any] = None
            # Garantir user_name nunca None
            safe_user_name: str = user_name or ""
            if use_memory:
                messages_or_input, memory = await self._prepare_messages_with_history(
                    user_message=user_message,
                    id_conversation=id_conversation,
                    system_prompt=system_prompt,
                    user_name=safe_user_name,
                    user_email=user_email,
                    user_login=user_login,
                    agent_id=id_conversation,
                    use_tools=use_tools,
                    filter_sources=filter_sources,
                    agent_config=agent_config,
                )
            else:
                messages_or_input = await self._prepare_messages_simple(
                    user_message=user_message,
                    system_prompt=system_prompt,
                    user_name=safe_user_name,
                    use_tools=use_tools,
                    filter_sources=filter_sources,
                    agent_config=agent_config,
                )

            # Processar streaming
            async for chunk in self._process_streaming(
                messages_or_input, memory, use_memory, use_tools
            ):
                yield str(chunk)

        except Exception as e:
            logger.error(f"Erro no processamento: {e}")
            # Finalizar sessÃ£o com erro
            if session_id:
                await self._finalize_session_context(
                    session_id, success=False, error=str(e)
                )
            yield "Ocorreu um erro interno. Tente novamente mais tarde."
        finally:
            # Finalizar sessÃ£o com sucesso se nÃ£o houve erro
            if session_id:
                await self._finalize_session_context(session_id, success=True)

            logger.debug("Executando flush do Langfuse...")
            self.langfuse_config.flush()

            # Limpar handler da sessÃ£o do cache para evitar acÃºmulo
            if session_id:
                self.langfuse_config.remove_session_handler(session_id)

            logger.debug("Flush do Langfuse concluÃ­do")

    async def run_process_simple(
        self,
        user_message: str,
        user_id: str,
        conversation_token: Optional[str] = None,
        system_prompt: Optional[str] = None,
        user_name: Optional[str] = "Fulano",
        user_email: Optional[str] = None,
        user_login: Optional[str] = None,
        use_memory: bool = False,
        use_tools: bool = False,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Processar chat sem streaming"""
        session_id: Optional[str] = None

        # Iniciar tracking de performance
        self._execution_start_time: datetime = datetime.now()

        try:
            id_conversation = await self._handle_conversation(
                user_id, conversation_token
            )
            # Usar conversation_id como session_id para trace_id do Langfuse
            session_id = id_conversation
            logger.debug(f"Usando session_id para Langfuse: {session_id}")

            # PRIMEIRO: Garantir que LLM e Langfuse estÃ£o prontos
            await self._ensure_llm_ready(
                use_tools=use_tools,
                session_id=session_id,
                user_id=user_id,
                filter_sources=filter_sources,
                agent_config=agent_config,
            )

            # DEPOIS: Criar contexto de sessÃ£o no Langfuse (agora jÃ¡ inicializado)
            await self._get_or_create_session_context(session_id)

            memory: Optional[Any] = None
            safe_user_name: str = user_name or "Fulano"
            if use_memory:
                messages_or_input, memory = await self._prepare_messages_with_history(
                    user_message=user_message,
                    id_conversation=id_conversation,
                    system_prompt=system_prompt,
                    user_name=safe_user_name,
                    user_email=user_email,
                    user_login=user_login,
                    agent_id=id_conversation,
                    use_tools=use_tools,
                    filter_sources=filter_sources,
                    agent_config=agent_config,
                )
            else:
                messages_or_input = await self._prepare_messages_simple(
                    user_message=user_message,
                    system_prompt=system_prompt,
                    user_name=safe_user_name,
                    use_tools=use_tools,
                    agent_config=agent_config,
                )

            if use_tools and self.agent_executor is not None:
                # Verificar se o agent executor tem tools configuradas
                has_tools = (
                    hasattr(self.agent_executor, "tools")
                    and len(self.agent_executor.tools) > 0
                )

                logger.debug(f"AgentExecutor tem tools: {has_tools}")

                if has_tools:
                    if isinstance(messages_or_input, dict):
                        # Log das tools disponÃ­veis para o agente
                        logger.debug(
                            f"ðŸ“ [AGENT DEBUG] Input do usuÃ¡rio: {messages_or_input.get('input', 'N/A')}"
                        )

                        try:
                            if isinstance(messages_or_input, dict):
                                response = await self.agent_executor.ainvoke(
                                    messages_or_input
                                )
                            else:
                                raise ValueError(
                                    "messages_or_input deve ser dict ao usar agent_executor"
                                )
                            response_content = response.get("output", "")
                            logger.debug("AgentExecutor executado com sucesso")

                            # NOVA FUNCIONALIDADE: Capturar tools utilizadas
                            if "intermediate_steps" in response:
                                self._last_execution_tools = (
                                    self._extract_tools_from_intermediate_steps(
                                        response["intermediate_steps"]
                                    )
                                )
                            else:
                                self._last_execution_tools = []

                            # Log de tools que foram efetivamente utilizadas (se disponÃ­vel na resposta)
                            if "intermediate_steps" in response:
                                used_tools = []
                                for step in response["intermediate_steps"]:
                                    if len(step) >= 2:
                                        action = step[0]
                                        if hasattr(action, "tool"):
                                            used_tools.append(action.tool)
                                            logger.debug(
                                                f"âš¡ [AGENT DEBUG] Tool UTILIZADA: {action.tool}"
                                            )
                                            if hasattr(action, "tool_input"):
                                                logger.debug(
                                                    f"ðŸ“¥ [AGENT DEBUG] ParÃ¢metros da tool: {action.tool_input}"
                                                )

                        except Exception as e:
                            logger.error(f"Erro na execuÃ§Ã£o do AgentExecutor: {e}")
                            raise
                    else:
                        raise RuntimeError(
                            "messages_or_input deve ser dict ao usar tools"
                        )
                else:
                    logger.warning(
                        "Agent Executor criado sem tools - redirecionando para execuÃ§Ã£o direta do LLM"
                    )
                    # Redirecionar para execuÃ§Ã£o direta do LLM
                    if isinstance(messages_or_input, dict):
                        # Usar mensagem direta do dict
                        llm_input = messages_or_input.get("input", "")
                    else:
                        llm_input = messages_or_input

                    logger.debug("Executando LLM diretamente com callbacks automÃ¡ticos")
                    if not self.azure_llm:
                        raise RuntimeError("LLM nÃ£o inicializado")
                    response = await self.azure_llm.ainvoke(llm_input)
                    response_content = response.content
                    logger.debug("LLM executado com sucesso")
            else:
                logger.warning(
                    f"AgentExecutor nÃ£o disponÃ­vel - use_tools={use_tools}, agent_executor={self.agent_executor is not None}"
                )

                # Sem tools utilizadas quando nÃ£o usa AgentExecutor
                self._last_execution_tools = []

                if not self.azure_llm:
                    raise RuntimeError("LLM nÃ£o inicializado")
                if not isinstance(messages_or_input, list):
                    raise RuntimeError(
                        "messages_or_input deve ser list ao nÃ£o usar tools"
                    )

                logger.debug("Executando LLM diretamente com callbacks automÃ¡ticos")

                try:
                    response = await self.azure_llm.ainvoke(messages_or_input)
                    response_content = response.content
                    logger.debug("LLM executado com sucesso")
                except Exception as e:
                    logger.error(f"Erro na execuÃ§Ã£o do LLM: {e}")
                    raise

            if use_memory and memory and response_content:
                # Atualizar memÃ³ria - serÃ¡ capturado pelo callback se necessÃ¡rio
                try:
                    await memory.add_ai_message(str(response_content))
                    logger.debug("MemÃ³ria atualizada com sucesso")
                except Exception as e:
                    # NÃ£o falhar por erro de memÃ³ria
                    logger.error(f"Erro ao atualizar memÃ³ria: {e}")

            return str(response_content)

        except Exception as e:
            logger.error(f"Erro no processamento: {e}")
            # Finalizar sessÃ£o com erro
            if session_id:
                await self._finalize_session_context(
                    session_id, success=False, error=str(e)
                )
            raise RuntimeError("Erro interno do servidor.") from e
        finally:
            # Calcular e registrar mÃ©tricas de performance
            if session_id and hasattr(self, "_execution_start_time"):
                try:
                    execution_time_ms = (
                        datetime.now() - self._execution_start_time
                    ).total_seconds() * 1000

                    # Adicionar mÃ©tricas bÃ¡sicas (sem instrumentaÃ§Ã£o manual)
                    logger.debug(
                        f"MÃ©tricas de performance calculadas: {execution_time_ms}ms"
                    )

                except Exception as perf_error:
                    logger.warning(
                        f"Erro ao calcular mÃ©tricas de performance: {perf_error}"
                    )

            # Finalizar sessÃ£o com sucesso se nÃ£o houve erro
            if session_id:
                await self._finalize_session_context(session_id, success=True)

            logger.debug("Executando flush do Langfuse...")
            self.langfuse_config.flush()

            # Limpar handler da sessÃ£o do cache para evitar acÃºmulo
            if session_id:
                self.langfuse_config.remove_session_handler(session_id)

            logger.debug("Flush do Langfuse concluÃ­do")

    async def _process_streaming(
        self,
        messages_or_input: Union[Dict[str, Any], List[Any]],
        memory: Any,
        use_memory: bool,
        use_tools: bool = False,
    ) -> AsyncGenerator[str, None]:
        """Processar streaming com callbacks automÃ¡ticos - SOLUÃ‡ÃƒO HÃBRIDA INTELIGENTE"""
        full_response: str = ""

        try:
            if use_tools and self.agent_executor:
                try:
                    # Verificar se o AgentExecutor tem ferramentas
                    has_tools = (
                        hasattr(self.agent_executor, "tools")
                        and len(self.agent_executor.tools) > 0
                    )

                    if has_tools:
                        tool_names = [tool.name for tool in self.agent_executor.tools]
                        logger.debug(
                            f"ðŸ”§ [STREAMING] Ferramentas disponÃ­veis: {tool_names}"
                        )

                        # IMPLEMENTAÃ‡ÃƒO: AgentExecutor tradicional + Streaming otimizado
                        if isinstance(messages_or_input, dict):
                            logger.debug(
                                "ðŸ”§ [STREAMING] Usando AgentExecutor padrÃ£o com streaming otimizado"
                            )

                            # Usar timeout inteligente baseado no contexto
                            timeout_seconds = self._calculate_smart_timeout(
                                messages_or_input
                            )
                            logger.debug(
                                f"ðŸ”§ [STREAMING] Usando timeout inteligente: {timeout_seconds}s"
                            )

                            # Executar AgentExecutor completo para obter resultado com ferramentas
                            agent_result = await asyncio.wait_for(
                                self.agent_executor.ainvoke(messages_or_input),
                                timeout=timeout_seconds,
                            )
                            agent_response = agent_result.get("output", "")

                            logger.debug(
                                f"ðŸ”§ [STREAMING] AgentExecutor resultado: {len(agent_response)} chars"
                            )

                            # Capturar tools utilizadas no streaming
                            if "intermediate_steps" in agent_result:
                                self._last_execution_tools = (
                                    self._extract_tools_from_intermediate_steps(
                                        agent_result["intermediate_steps"]
                                    )
                                )
                            else:
                                self._last_execution_tools = []

                            # Verificar se ferramentas foram utilizadas
                            tools_used: bool = False
                            tools_executed: List[str] = []
                            if "intermediate_steps" in agent_result:
                                tools_used = len(agent_result["intermediate_steps"]) > 0
                                if tools_used:
                                    for step in agent_result["intermediate_steps"]:
                                        if len(step) >= 2:
                                            action = step[0]
                                            if hasattr(action, "tool"):
                                                tools_executed.append(action.tool)
                                    logger.debug(
                                        f"ðŸ”§ [STREAMING] Ferramentas utilizadas: {tools_executed}"
                                    )

                            if agent_response:
                                # STREAMING OTIMIZADO: Baseado em palavras para parecer mais natural
                                import re

                                # Dividir por palavras mantendo espaÃ§os e pontuaÃ§Ã£o
                                words = re.findall(r"\S+|\s+", agent_response)
                                current_chunk = ""
                                chunk_count = 0

                                for i, word in enumerate(words):
                                    current_chunk += word

                                    # Fazer yield a cada 2-3 palavras ou pontuaÃ§Ã£o importante
                                    should_yield = (
                                        # PontuaÃ§Ã£o importante
                                        word.strip().endswith((".", "!", "?", ":", ";"))
                                        or
                                        # A cada 2-3 palavras (nÃ£o espaÃ§os)
                                        (word.strip() and (i + 1) % 3 == 0)
                                        or
                                        # Ãšltimo item
                                        i == len(words) - 1
                                    )

                                    if should_yield and current_chunk.strip():
                                        chunk_count += 1
                                        full_response += current_chunk
                                        yield current_chunk
                                        current_chunk = ""

                                        # Delay menor para simular streaming mais rÃ¡pido
                                        await asyncio.sleep(
                                            0.01
                                        )  # 10ms (mais rÃ¡pido que 20ms)

                                # Garantir que qualquer resto seja enviado
                                if current_chunk.strip():
                                    chunk_count += 1
                                    full_response += current_chunk
                                    yield current_chunk
                            else:
                                yield "Desculpe, nÃ£o consegui gerar uma resposta."
                        else:
                            raise ValueError(
                                "messages_or_input deve ser dict ao usar AgentExecutor"
                            )

                    else:
                        logger.warning(
                            "ðŸ”§ [STREAMING] AgentExecutor sem ferramentas - usando LLM direto"
                        )
                        # Fallback para LLM direto com streaming real
                        if isinstance(messages_or_input, dict):
                            user_message = messages_or_input.get("input", "")
                            system_prompt = messages_or_input.get("system_prompt", "")

                            streaming_messages = []
                            if system_prompt:
                                # Nota: system_prompt jÃ¡ deve conter o bloco de autenticaÃ§Ã£o
                                # quando processado pelos mÃ©todos _prepare_messages_*
                                streaming_messages.append(
                                    SystemMessage(content=system_prompt)
                                )
                            streaming_messages.append(
                                HumanMessage(content=user_message)
                            )

                            messages_for_streaming = streaming_messages
                        else:
                            messages_for_streaming = messages_or_input

                        chunk_count = 0
                        if self.azure_llm:
                            async for chunk in self.azure_llm.astream(
                                messages_for_streaming
                            ):
                                chunk_count += 1
                                if hasattr(chunk, "content") and chunk.content:
                                    content = str(chunk.content)
                                    full_response += content
                                    logger.debug(
                                        f"ðŸ”„ [STREAMING] LLM fallback chunk: {content[:50]}..."
                                    )
                                    yield content
                        else:
                            raise RuntimeError("LLM nÃ£o inicializado")

                        logger.debug(
                            f"âœ… [STREAMING] LLM fallback concluÃ­do: {chunk_count} chunks"
                        )

                except Exception as e:
                    error_msg = str(e)
                    if (
                        "context_length_exceeded" in error_msg
                        or "maximum context length" in error_msg
                    ):
                        logger.warning(f"âŒ [STREAMING] Contexto excedido: {error_msg}")
                        yield "A janela de contexto acabou e favor inicie outra conversa"
                    else:
                        logger.error(f"âŒ [STREAMING] Erro no AgentExecutor: {e}")
                        yield f"Erro ao processar com ferramentas: {e}"

            else:
                # Sem tools utilizadas quando nÃ£o usa AgentExecutor
                self._last_execution_tools = []

                if not self.azure_llm:
                    raise RuntimeError("LLM nÃ£o inicializado")

                try:
                    chunk_count = 0
                    if isinstance(messages_or_input, list):
                        async for chunk in self.azure_llm.astream(messages_or_input):
                            chunk_count += 1

                            if hasattr(chunk, "content") and chunk.content:
                                content = str(chunk.content)
                                full_response += content
                                yield content
                    else:
                        raise ValueError(
                            "messages_or_input deve ser list ao usar LLM direto"
                        )

                    logger.debug(
                        f"âœ… [STREAMING] LLM concluÃ­do: {chunk_count} chunks, {len(full_response)} chars"
                    )

                except Exception as e:
                    logger.error(f"âŒ [STREAMING] Erro no LLM: {e}")
                    raise

            if use_memory and memory and full_response:
                # Atualizar memÃ³ria - serÃ¡ capturado pelo callback se necessÃ¡rio
                try:
                    await memory.add_ai_message(str(full_response))
                except Exception as e:
                    # NÃ£o falhar por erro de memÃ³ria
                    logger.error(f"Erro ao atualizar memÃ³ria: {e}")

        except Exception as e:
            logger.error(f"Erro no streaming: {e}")
            yield f"Erro: {e}"

    def _calculate_smart_timeout(self, messages_or_input: Dict[str, Any]) -> int:
        """
        Calcula timeout inteligente baseado no contexto da entrada

        Args:
            messages_or_input: Input do usuÃ¡rio para anÃ¡lise

        Returns:
            Timeout em segundos (entre 5-30 minutos)
        """
        try:
            # Timeout padrÃ£o: 20 minutos (valor jÃ¡ aumentado)
            base_timeout = 60 * 20  # 20 minutos

            # Extrair texto de anÃ¡lise do input
            input_text = ""
            if isinstance(messages_or_input, dict):
                # Verificar campo 'input' primeiro
                if "input" in messages_or_input:
                    input_text = str(messages_or_input["input"]).lower()
                # Verificar outros campos comuns
                elif "message" in messages_or_input:
                    input_text = str(messages_or_input["message"]).lower()
                elif "query" in messages_or_input:
                    input_text = str(messages_or_input["query"]).lower()
                else:
                    # Converter todo o dict para string como fallback
                    input_text = str(messages_or_input).lower()
            else:
                input_text = str(messages_or_input).lower()

            # Palavras-chave que indicam processamento de arquivos grandes/complexos
            large_file_keywords = [
                "excel",
                "xlsx",
                "planilha",
                "aba",
                "abas",
                "pdf",
                "documento",
                "arquivo",
                "upload",
                "processar",
                "extrair",
                "analisar",
                "grande",
                "muitas",
                "vÃ¡rias",
                "mÃºltiplas",
                "complexo",
                "detalhado",
                "completo",
                "sharepoint",
                "sincronizar",
                "sync",
                "embedding",
                "vectorizaÃ§Ã£o",
                "rag",
                "chunk",
                "fragmento",
                "divisÃ£o",
            ]

            # Palavras-chave que indicam processamento muito complexo
            complex_keywords = [
                "migraÃ§Ã£o",
                "importaÃ§Ã£o",
                "exportaÃ§Ã£o",
                "batch",
                "lote",
                "massa",
                "relatÃ³rio completo",
                "anÃ¡lise completa",
                "todos os arquivos",
                "toda a base",
                "integraÃ§Ã£o",
                "api externa",
            ]

            # Contar ocorrÃªncias de palavras-chave
            large_file_matches = sum(
                1 for keyword in large_file_keywords if keyword in input_text
            )
            complex_matches = sum(
                1 for keyword in complex_keywords if keyword in input_text
            )

            # Calcular timeout baseado nas palavras-chave encontradas
            timeout_seconds = base_timeout

            # Adicionar tempo extra para processamento de arquivos grandes
            if large_file_matches > 0:
                extra_time = min(
                    large_file_matches * 300, 600
                )  # MÃ¡ximo 10 minutos extras
                timeout_seconds += extra_time
                logger.debug(
                    f"Palavras-chave de arquivo grande detectadas ({large_file_matches}), adicionando {extra_time}s"
                )

            # Adicionar tempo extra para processamento muito complexo
            if complex_matches > 0:
                extra_time = min(complex_matches * 600, 900)  # MÃ¡ximo 15 minutos extras
                timeout_seconds += extra_time
                logger.debug(
                    f"Palavras-chave complexas detectadas ({complex_matches}), adicionando {extra_time}s"
                )

            # Verificar comprimento do input (inputs maiores podem precisar de mais tempo)
            if len(input_text) > 1000:
                extra_time = min(
                    int(len(input_text) / 1000) * 60, 300
                )  # MÃ¡ximo 5 minutos extras
                timeout_seconds += extra_time
                logger.debug(
                    f"Input longo detectado ({len(input_text)} chars), adicionando {extra_time}s"
                )

            # Aplicar limites mÃ­nimo e mÃ¡ximo
            min_timeout = 300  # 5 minutos mÃ­nimo
            max_timeout = 1800  # 30 minutos mÃ¡ximo

            timeout_seconds = max(min_timeout, min(timeout_seconds, max_timeout))

            logger.info(
                f"Timeout inteligente calculado: {timeout_seconds}s ({timeout_seconds / 60:.1f}min) para input com {large_file_matches} palavras-chave de arquivo e {complex_matches} palavras-chave complexas"
            )

            return timeout_seconds

        except Exception as e:
            logger.warning(
                f"Erro ao calcular timeout inteligente: {e}, usando timeout padrÃ£o"
            )
            return 60 * 20  # 20 minutos como fallback

    def get_llm_info(self) -> Dict[str, Any]:
        """InformaÃ§Ãµes do LLM"""
        return {
            "status": (
                "Azure OpenAI configurado" if self.azure_llm else "LLM nÃ£o inicializado"
            ),
            "langfuse": self.langfuse_config.get_status(),
        }

    async def get_status(self) -> Dict[str, Any]:
        """Status geral do serviÃ§o"""
        tools_count: int = 0
        if self.tool_manager:
            try:
                tools = await self.tool_manager.load_active_tools(
                    filter_sources=None, agent_config=None
                )
                tools_count = len(tools)
            except Exception as e:
                logger.error(f"Erro ao contar tools: {e}")
                tools_count = 0

        return {
            "llm_initialized": self.azure_llm is not None,
            "agent_executor_initialized": self.agent_executor is not None,
            "langfuse": self.langfuse_config.get_status(),
            "tools_loaded": tools_count,
        }


def get_langchain_service(db: AsyncSession = Depends(get_db)) -> LangChainService:
    """Factory function"""
    return LangChainService(db)
