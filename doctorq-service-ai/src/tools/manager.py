import json
import re
import uuid
from typing import Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.tool import Tool
from src.services.tool_filter_service import get_tool_filter_service
from src.services.tool_service import get_tool_service

from .api_tool import ApiTool
from .base_tool import BaseTool
from .custom_interna_tool import CustomInternaTool
from .qdrant_rag_tool import QdrantRAGTool
from .rag_tool import RAGTool

logger = get_logger(__name__)


class ToolManager:
    """Gerenciador de tools para agentes"""

    def __init__(
        self,
        db: Optional[AsyncSession] = None,
        callbacks: Optional[List] = None,
        langfuse_config=None,
        session_trace_context=None,
        user_id: Optional[uuid.UUID] = None,
        agent_id: Optional[str] = None,
    ):
        """Inicializar ToolManager"""
        self.db = db  # Mantido para compatibilidade
        self.tool_service = get_tool_service()
        self.tool_filter_service = get_tool_filter_service()
        self._loaded_tools: Dict[str, BaseTool] = {}
        self.callbacks = callbacks or []
        self.langfuse_config = langfuse_config
        self.session_trace_context = session_trace_context
        self.user_id = user_id
        self.agent_id = agent_id

    async def load_active_tools(
        self,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict] = None,
    ) -> List[BaseTool]:
        """Carregar tools ativas do banco (com filtro SEI se user_id fornecido e filtro por sources)"""
        try:
            logger.info(
                f"LOAD_ACTIVE_TOOLS - filter_sources recebido: {filter_sources} (tipo: {type(filter_sources)})"
            )
            logger.info(f"LOAD_ACTIVE_TOOLS - user_id: {self.user_id}")
            logger.info(f"LOAD_ACTIVE_TOOLS - agent_config: {bool(agent_config)}")

            # Determinar quais tools carregar baseado na prioridade
            db_tools = await self._determine_tools_to_load(filter_sources, agent_config)

            if not db_tools:
                logger.warning("Nenhuma tool ativa encontrada")
                return []

            # Processar e criar instÃ¢ncias das tools
            return await self._create_tool_instances(db_tools)

        except Exception as e:
            logger.error(f"Erro ao carregar tools: {e}")
            return []

    async def _determine_tools_to_load(
        self,
        filter_sources: Optional[List[str]] = None,
        agent_config: Optional[Dict] = None,
    ) -> List[Tool]:
        """Determinar quais tools carregar baseado na prioridade de filtros"""
        # PRIORIDADE MÃXIMA: Se agent_id disponÃ­vel, usar relacionamento agente.tools
        if self.agent_id:
            return await self._load_tools_by_agent_id()

        # FALLBACK: Se agent_config com tools especificado (compatibilidade)
        if agent_config and "tools" in agent_config:
            return await self._load_tools_by_agent_config(agent_config)

        # PRIORIDADE: Se filter_sources for lista vazia [], carregar todas as tools ativas
        if filter_sources is not None and len(filter_sources) == 0:
            return await self._load_all_active_tools()

        # PRIORIDADE: Se filter_sources especificado e nÃ£o vazio, usar filtro especÃ­fico
        if filter_sources is not None and len(filter_sources) > 0:
            return await self._load_tools_by_filter_sources(filter_sources)

        # FALLBACK: Aplicar filtro SEI tradicional se user_id disponÃ­vel
        if self.user_id:
            return await self._load_tools_by_user_filter()

        # FALLBACK FINAL: Carregar tools ativas excluindo SEI
        return await self._load_tools_without_sei()

    async def _load_tools_by_agent_id(self) -> List[Tool]:
        """Carregar tools via relacionamento agente.tools"""
        logger.info(
            f"CARREGANDO TOOLS VIA RELACIONAMENTO AGENTE.TOOLS: agent_id={self.agent_id}"
        )

        from src.config.orm_config import get_db
        from src.services.agent_service import get_agent_service

        # Converter agent_id string para UUID
        try:
            agent_uuid = uuid.UUID(self.agent_id)
        except ValueError:
            logger.error(f"agent_id invÃ¡lido: {self.agent_id}")
            return []

        # Usar sessÃ£o do banco se disponÃ­vel, senÃ£o criar nova
        if self.db:
            agent_service = get_agent_service(self.db)
            agent = await agent_service.get_agent_by_id(agent_uuid)
        else:
            async with get_db() as db_session:
                agent_service = get_agent_service(db_session)
                agent = await agent_service.get_agent_by_id(agent_uuid)

        if agent and agent.agent_tools:
            # Filtrar apenas tools ativas atravÃ©s do relacionamento agent_tools
            db_tools = [
                agent_tool.tool
                for agent_tool in agent.agent_tools
                if agent_tool.tool.st_ativo
            ]
            logger.info(f"Tools carregadas via relacionamento: {len(db_tools)}")
            return db_tools

        logger.warning(f"Agente {self.agent_id} nÃ£o encontrado ou sem tools")
        return []

    async def _load_tools_by_agent_config(self, agent_config: Dict) -> List[Tool]:
        """Carregar tools do agent_config (fallback)"""
        agent_tools = agent_config["tools"]
        logger.info(
            f"CARREGANDO TOOLS DO AGENT_CONFIG (FALLBACK): {len(agent_tools)} tools configuradas"
        )

        # Obter tools ativas do banco para buscar configuraÃ§Ãµes
        all_tools = await self.tool_service.get_active_tools()
        tools_by_id = {str(tool.id_tool): tool for tool in all_tools}

        db_tools = []
        for agent_tool in agent_tools:
            tool_id = agent_tool.get("id")
            if tool_id and tool_id in tools_by_id:
                db_tools.append(tools_by_id[tool_id])
                logger.debug(f"Tool encontrada no agent_config: {tool_id}")
            else:
                logger.warning(
                    f"Tool do agent_config nÃ£o encontrada no banco: {tool_id}"
                )

        logger.info(f"Tools carregadas do agent_config: {len(db_tools)}")
        return db_tools

    async def _load_all_active_tools(self) -> List[Tool]:
        """Carregar todas as tools ativas"""
        logger.info("FILTRO SOURCES VAZIO - carregando todas as tools ativas")
        db_tools = await self.tool_service.get_active_tools()
        logger.info(f"Filtro sources vazio: carregadas {len(db_tools)} tools ativas")
        return db_tools

    async def _load_tools_by_filter_sources(
        self, filter_sources: List[str]
    ) -> List[Tool]:
        """Carregar tools filtradas por sources especÃ­ficas"""
        logger.info(f"APLICANDO FILTRO POR SOURCES: {filter_sources}")

        all_tools = await self.tool_service.get_active_tools()

        # Filtros especÃ­ficos por source
        if "sei" in filter_sources:
            return self._filter_tools_by_sei(all_tools)
        if "faq" in filter_sources:
            return self._filter_tools_by_faq(all_tools)
        if "none" in filter_sources:
            return self._filter_tools_by_chamado(all_tools)

        # Filtro normal por sources especÃ­ficas
        return self._filter_tools_by_sources(all_tools, filter_sources)

    def _filter_tools_by_sei(self, all_tools: List[Tool]) -> List[Tool]:
        """Filtrar apenas tools que contenham 'sei' no nome"""
        logger.info(
            "Filtro 'sei' detectado - carregando apenas tools que contenham 'sei' no nome"
        )

        db_tools = []
        for tool in all_tools:
            tool_name = str(tool.nm_tool).lower()
            if any(
                re.match(pattern, tool_name)
                for pattern in [
                    r"base_conhecimento_sei_.*",
                    r".*_sei_.*",
                    r"sei_.*",
                    r".*sei.*",
                ]
            ):
                db_tools.append(tool)

        logger.info(
            f"Filtro 'sei': {len(all_tools)} -> {len(db_tools)} tools (apenas com 'sei' no nome)"
        )
        return db_tools

    def _filter_tools_by_faq(self, all_tools: List[Tool]) -> List[Tool]:
        """Filtrar apenas tools FAQ excluindo SEI"""
        logger.info(
            "Filtro 'faq' detectado - carregando apenas tools que contenham 'faq' no nome"
        )

        db_tools = []
        for tool in all_tools:
            tool_name = str(tool.nm_tool).lower()
            tool_type = str(tool.tp_tool).lower()

            # Verificar se Ã© tool RAG/FAQ pelo tipo ou se contÃ©m 'faq' no nome
            is_faq = tool_type == "rag" or any(
                re.match(pattern, tool_name)
                for pattern in [
                    r"faq_.*",
                    r".*_faq.*",
                    r"base_conhecimento_.*",
                    r"conhecimento_.*",
                    r".*faq.*",
                ]
            )

            # Excluir tools SEI
            is_sei = any(
                re.match(pattern, tool_name)
                for pattern in [
                    r"base_conhecimento_sei_.*",
                    r".*_sei_.*",
                    r"sei_.*",
                    r".*sei.*",
                ]
            )

            if is_faq and not is_sei:
                db_tools.append(tool)

        logger.info(
            f"Filtro 'faq': {len(all_tools)} -> {len(db_tools)} tools (apenas com 'faq' no nome ou tipo RAG, excluindo SEI)"
        )
        return db_tools

    def _filter_tools_by_chamado(self, all_tools: List[Tool]) -> List[Tool]:
        """Filtrar apenas tools que contenham 'chamado' no nome"""
        logger.info(
            "Filtro 'none' detectado - carregando apenas tools que contenham 'chamado' no nome"
        )

        db_tools = []
        for tool in all_tools:
            tool_name = str(tool.nm_tool).lower()
            if any(
                re.search(pattern, tool_name)
                for pattern in [r".*chamado.*", r".*chamados.*"]
            ):
                db_tools.append(tool)

        logger.info(
            f"Filtro 'none': {len(all_tools)} -> {len(db_tools)} tools (apenas com 'chamado' no nome)"
        )
        return db_tools

    def _filter_tools_by_sources(
        self, all_tools: List[Tool], filter_sources: List[str]
    ) -> List[Tool]:
        """Filtro genÃ©rico por sources especÃ­ficas"""
        db_tools = []
        for tool in all_tools:
            tool_source = self._get_tool_source(tool)
            if tool_source in filter_sources:
                db_tools.append(tool)

        logger.info(
            f"Filtro por sources: {len(all_tools)} -> {len(db_tools)} tools (sources: {filter_sources})"
        )
        return db_tools

    async def _load_tools_by_user_filter(self) -> List[Tool]:
        """Carregar tools filtradas para usuÃ¡rio especÃ­fico"""
        logger.debug(f"Carregando tools filtradas para usuÃ¡rio {self.user_id}")
        return await self.tool_filter_service.get_user_tools_filtered(self.user_id)

    async def _load_tools_without_sei(self) -> List[Tool]:
        """Carregar tools ativas excluindo SEI"""
        logger.debug("Carregando tools ativas sem user_id - excluindo tools SEI")

        all_tools = await self.tool_service.get_active_tools()
        db_tools = [
            tool
            for tool in all_tools
            if not self.tool_service.is_sei_tool(tool.nm_tool)
        ]

        logger.info(
            f"Filtro sem usuÃ¡rio aplicado: {len(all_tools)} -> {len(db_tools)} tools (excluÃ­das tools SEI)"
        )
        return db_tools

    async def _create_tool_instances(self, db_tools: List[Tool]) -> List[BaseTool]:
        """Criar instÃ¢ncias das tools a partir dos dados do banco"""
        tools = []
        for db_tool in db_tools:
            try:
                tool = await self._create_tool_from_db(db_tool)
                if tool:
                    tools.append(tool)
                    self._loaded_tools[str(db_tool.nm_tool)] = tool
            except Exception as e:
                logger.error(f"Erro ao carregar tool {db_tool.nm_tool}: {e}")

        logger.info(f"Carregadas {len(tools)} tools ativas")
        return tools

    async def _create_tool_from_db(self, db_tool: Tool) -> Optional[BaseTool]:
        """Criar instÃ¢ncia de tool baseado nos dados do banco"""
        try:
            tool_name = str(db_tool.nm_tool)
            tool_type = str(db_tool.tp_tool)
            config_tool = getattr(db_tool, "config_tool", None)

            # Parse da configuraÃ§Ã£o
            if isinstance(config_tool, str):
                config_tool = json.loads(config_tool)
            elif not isinstance(config_tool, dict):
                if hasattr(config_tool, "value") and config_tool is not None:
                    config_tool = json.loads(config_tool.value)
                else:
                    raise ValueError(f"config_tool invÃ¡lido para {tool_name}")

            description = (
                str(db_tool.ds_tool)
                if db_tool.ds_tool is not None
                else f"Tool {tool_name}"
            )

            # Criar tool baseado no tipo
            tool = None
            if tool_type == "api":
                tool = ApiTool.from_db_config(
                    config_tool, nm_tool=tool_name, ds_tool=description
                )
            elif tool_type == "rag":
                # Verificar se Ã© RAG Qdrant baseado na config
                if config_tool.get("type") == "qdrant":
                    tool = QdrantRAGTool.from_db_config(
                        config_tool,
                        name=tool_name,
                        description=description,
                        agent_id=self.agent_id,
                    )
                else:
                    tool = RAGTool.from_db_config(
                        config_tool, name=tool_name, description=description
                    )
                    # Desabilitar inicializaÃ§Ã£o de serviÃ§os durante setup
                    if tool and hasattr(tool, "set_skip_service_init"):
                        tool.set_skip_service_init(True)
            elif tool_type == "rag_qdrant":
                tool = QdrantRAGTool.from_db_config(
                    config_tool,
                    name=tool_name,
                    description=description,
                    agent_id=self.agent_id,
                )
            elif tool_type == "custom_interna":
                tool = CustomInternaTool.from_db_config(
                    config_tool, name=tool_name, description=description
                )
                # Configurar sessÃ£o do banco se disponÃ­vel
                if tool and self.db and hasattr(tool, "set_db_session"):
                    tool.set_db_session(self.db)
            else:
                logger.warning(f"Tipo de tool nÃ£o suportado: {tool_type}")
                return None

            if tool:
                # Configurar verbose
                tool.verbose = True

                # Configurar contexto Langfuse se disponÃ­vel
                if (
                    self.langfuse_config
                    and self.session_trace_context
                    and hasattr(tool, "set_langfuse_context")
                ):
                    tool.set_langfuse_context(
                        self.langfuse_config, self.session_trace_context
                    )

            return tool

        except Exception as e:
            logger.error(f"Erro ao criar tool {db_tool.nm_tool}: {e}")
            return None

    async def get_tool_by_name(self, name: str) -> Optional[BaseTool]:
        """Obter tool carregado por nome"""
        return self._loaded_tools.get(name)

    def get_loaded_tools(self) -> List[BaseTool]:
        """Obter lista de tools carregados"""
        return list(self._loaded_tools.values())

    def enable_service_initialization(self):
        """Habilitar inicializaÃ§Ã£o de serviÃ§os em tools RAG"""
        enabled_count = 0
        for tool_name, tool in self._loaded_tools.items():
            if isinstance(tool, RAGTool):
                tool.set_skip_service_init(False)
                enabled_count += 1

                # Tentar inicializar serviÃ§os
                if hasattr(tool, "ensure_services_initialized"):
                    try:
                        tool.ensure_services_initialized()
                    except Exception as e:
                        logger.warning(
                            f"Erro ao inicializar serviÃ§os para {tool_name}: {e}"
                        )

        logger.debug(f"InicializaÃ§Ã£o habilitada para {enabled_count} tools RAG")

    def _get_tool_source(self, db_tool: Tool) -> str:
        """Determinar a source de uma tool baseado no seu tipo e nome usando regex"""
        tool_name = str(db_tool.nm_tool).lower()
        tool_type = str(db_tool.tp_tool).lower()

        # Patterns regex para identificar sources baseado no nome
        source_patterns = {
            "sei": [
                r"base_conhecimento_sei_.*",  # base_conhecimento_sei_qualquercoisa
                r".*_sei_.*",  # qualquercoisa_sei_qualquercoisa
                r"sei_.*",  # sei_qualquercoisa
                r".*sei.*",  # qualquercoisa contendo sei
            ],
            "faq": [
                r"faq_.*",  # faq_qualquercoisa
                r".*_faq.*",  # qualquercoisa_faq
                r"base_conhecimento_.*",  # base_conhecimento_qualquercoisa (exceto sei)
                r"conhecimento_.*",  # conhecimento_qualquercoisa
            ],
            "none": [
                r".*chamados.*",
                r".*chamado*",
            ],
        }

        # Verificar patterns SEI primeiro (mais especÃ­fico)
        for pattern in source_patterns["sei"]:
            if re.match(pattern, tool_name):
                logger.debug(
                    f"SOURCE DEBUG: Tool '{tool_name}' matched SEI pattern: {pattern}"
                )
                return "sei"

        # Verificar se Ã© tool RAG/FAQ pelo tipo
        if tool_type == "rag":
            logger.debug(
                f"SOURCE DEBUG: Tool '{tool_name}' classified as FAQ by type 'rag'"
            )
            return "faq"

        # Verificar patterns FAQ
        for pattern in source_patterns["faq"]:
            if re.match(pattern, tool_name):
                logger.debug(
                    f"SOURCE DEBUG: Tool '{tool_name}' matched FAQ pattern: {pattern}"
                )
                return "faq"

        # Tools API - assumir 'api' como padrÃ£o
        if tool_type == "api":
            logger.debug(f"SOURCE DEBUG: Tool '{tool_name}' classified as API by type")
            return "api"

        # Tools Custom Interna - assumir 'api' como source (serviÃ§os internos)
        if tool_type == "custom_interna":
            logger.debug(
                f"SOURCE DEBUG: Tool '{tool_name}' classified as API by type custom_interna"
            )
            return "api"

        # Fallback para outras tools
        logger.debug(
            f"SOURCE DEBUG: Tool '{tool_name}' classified as 'other' (fallback)"
        )
        return "other"
