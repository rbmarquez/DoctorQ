# src/tools/rag_tool.py
from typing import Any, Dict, Optional, Type

from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.models.rag_config import RAGConfiguration, RAGQueryRequest
from src.tools.base_tool import BaseTool

logger = get_logger(__name__)


class RAGToolSchema(BaseModel):
    """Schema para argumentos da tool RAG"""

    query: str = Field(
        ...,
        description="Pergunta ou consulta para buscar nos documentos",
    )
    max_results: Optional[int] = Field(
        5, description="NÃºmero mÃ¡ximo de documentos a retornar"
    )
    similarity_threshold: Optional[float] = Field(
        0.3, description="Limite mÃ­nimo de similaridade (0.0 a 1.0)"
    )
    documento_store_ids: Optional[str] = Field(
        None, description="IDs dos document stores separados por vÃ­rgula"
    )
    include_metadata: Optional[bool] = Field(
        True, description="Incluir metadados dos documentos"
    )
    # Novos parÃ¢metros para filtros SEI
    filter_source: Optional[str] = Field(
        None, description="Fonte especÃ­fica para filtrar (ex: 'sei', 'faq')"
    )
    id_processo: Optional[str] = Field(
        None, description="ID do processo SEI para filtrar"
    )
    id_unidade: Optional[str] = Field(
        None, description="ID da unidade SEI para filtrar"
    )
    id_documento: Optional[str] = Field(
        None, description="ID do documento SEI para filtrar"
    )
    user_unidades: Optional[str] = Field(
        None, description="IDs das unidades do usuÃ¡rio separados por vÃ­rgula"
    )


class RAGTool(BaseTool):
    """Tool para realizar consultas RAG usando busca semÃ¢ntica vetorial"""

    args_schema: Type[BaseModel] = RAGToolSchema

    def __init__(self, config: Dict[str, Any]):
        """Inicializar RAG Tool"""

        # ConfiguraÃ§Ã£o padrÃ£o
        clean_config = {
            "name": config.get("name", "rag_search"),
            "description": config.get(
                "description",
                "Buscar documentos relevantes usando RAG com busca semÃ¢ntica",
            ),
        }

        super().__init__(**clean_config)

        # Armazenar config original para parsing posterior
        self._original_config = config
        self._rag_config = None
        self._embedding_service = None
        self._rag_service = None
        self._services_initialized = False
        self._skip_service_init = True  # Compatibilidade com ToolManager

    def _parse_rag_config(self) -> None:
        """Parse da configuraÃ§Ã£o RAG"""
        if self._rag_config is None:
            rag_config_data = self._original_config.get("rag_config", {})

            # Criar configuraÃ§Ã£o simples ou usar RAGConfiguration se disponÃ­vel
            if isinstance(rag_config_data, dict):
                self._rag_config = RAGConfiguration(
                    name=rag_config_data.get("name", "RAG Search"),
                    description=rag_config_data.get("description", ""),
                    default_max_results=rag_config_data.get("default_max_results", 5),
                    default_similarity_threshold=rag_config_data.get(
                        "default_similarity_threshold", 0.7
                    ),
                    document_stores=rag_config_data.get("document_stores", []),
                    namespaces=rag_config_data.get("namespaces", []),
                    search_algorithm=rag_config_data.get(
                        "search_algorithm", "cosine_similarity"
                    ),
                    vector_distance_metric=rag_config_data.get(
                        "vector_distance_metric", "cosine"
                    ),
                    context_template=rag_config_data.get(
                        "context_template",
                        "Contexto baseado nos documentos encontrados:\n\n{documents}\n\nBaseado no contexto acima, responda:",
                    ),
                )
            else:
                # Fallback para configuraÃ§Ã£o mÃ­nima
                self._rag_config = RAGConfiguration(
                    name="RAG Search",
                    description="",
                    default_max_results=5,
                    default_similarity_threshold=0.7,
                    document_stores=[],
                    namespaces=[],
                    search_algorithm="cosine_similarity",
                    vector_distance_metric="cosine",
                    context_template="Contexto: {documents}",
                )

    def _initialize_services(self):
        """Inicializar serviÃ§os necessÃ¡rios"""
        if self._services_initialized or self._skip_service_init:
            return

        try:
            # Importar e inicializar serviÃ§os
            from src.config.orm_config import ORMConfig
            from src.services.embedding_service import EmbeddingService
            from src.services.rag_service import get_rag_service

            # Criar sessÃ£o do banco
            db_session = ORMConfig.get_session()
            # Criar serviÃ§os com a sessÃ£o
            self._embedding_service = EmbeddingService(db_session)
            self._rag_service = get_rag_service(self._embedding_service)
            self._services_initialized = True
            # Armazenar a sessÃ£o para fechar depois
            self._db_session = db_session

            logger.debug("ServiÃ§os RAG inicializados com sucesso")

        except Exception as e:
            logger.error(f"Erro ao inicializar serviÃ§os RAG: {e}")
            raise RuntimeError(f"Falha ao inicializar serviÃ§os RAG: {e}")

    def set_skip_service_init(self, skip: bool):
        """Controlar se deve pular inicializaÃ§Ã£o de serviÃ§os - compatibilidade com ToolManager"""
        self._skip_service_init = skip
        logger.debug(f"skip_service_init definido como: {skip}")

        # Se nÃ£o deve mais pular, tentar inicializar
        if not skip and not self._services_initialized:
            try:
                self._initialize_services()
            except Exception as e:
                logger.warning(f"Erro ao inicializar serviÃ§os apÃ³s habilitar: {e}")

    async def close(self):
        """Fecha a sessÃ£o do banco"""
        try:
            if hasattr(self, '_db_session') and self._db_session:
                await self._db_session.close()
                self._db_session = None
        except Exception as e:
            logger.warning(f"Erro ao fechar sessÃ£o RAG: {e}")

    def _ensure_services_initialized(self):
        """Garantir que serviÃ§os estÃ£o inicializados - compatibilidade com ToolManager"""
        if not self._skip_service_init:
            self._initialize_services()

    def ensure_services_initialized(self):
        """Garantir que serviÃ§os estÃ£o inicializados (mÃ©todo pÃºblico)"""
        self._ensure_services_initialized()

    async def _execute_tool_logic(self, **kwargs) -> Dict[str, Any]:
        """Executar busca RAG"""
        try:
            # Garantir inicializaÃ§Ã£o do banco
            from src.config.orm_config import ORMConfig

            if not ORMConfig.AsyncSessionLocal:
                await ORMConfig.initialize_database()

            # ForÃ§ar inicializaÃ§Ã£o de serviÃ§os durante execuÃ§Ã£o
            if not self._services_initialized:
                # Temporariamente permitir inicializaÃ§Ã£o
                old_skip = self._skip_service_init
                self._skip_service_init = False
                self._initialize_services()
                self._skip_service_init = old_skip

            # Parse da configuraÃ§Ã£o
            self._parse_rag_config()

            # Validar argumentos
            args = RAGToolSchema.model_validate(kwargs)

            # Preparar document store IDs
            documento_store_ids = None
            if args.documento_store_ids:
                documento_store_ids = [
                    id.strip()
                    for id in args.documento_store_ids.split(",")
                    if id.strip()
                ]

            # Obter namespace da configuraÃ§Ã£o
            if self._rag_config is None:
                raise RuntimeError("ConfiguraÃ§Ã£o RAG nÃ£o foi inicializada")

            namespaces = self._rag_config.namespaces
            if not namespaces:
                raise ValueError(f"Tool '{self.name}' nÃ£o tem namespaces configurados")

            namespace_to_use = namespaces[0]

            # Preparar filtros SEI se especificados
            sei_metadata_filters = None
            user_unidades_list = None

            if args.filter_source == "sei":
                logger.debug("ðŸ¢ [RAGTool] Preparando filtros SEI")

                # Montar filtros de metadados SEI
                sei_filters = {}
                if args.id_processo:
                    sei_filters["idProcesso"] = args.id_processo
                if args.id_unidade:
                    sei_filters["idUnidade"] = args.id_unidade
                if args.id_documento:
                    sei_filters["idDocumento"] = args.id_documento

                if sei_filters:
                    sei_metadata_filters = sei_filters

                # Processar unidades do usuÃ¡rio
                if args.user_unidades:
                    user_unidades_list = [
                        id.strip() for id in args.user_unidades.split(",") if id.strip()
                    ]
                    logger.debug(
                        f"Unidades do usuÃ¡rio processadas: {user_unidades_list}"
                    )

            # Criar requisiÃ§Ã£o RAG
            rag_request = RAGQueryRequest(
                query=args.query,
                max_results=args.max_results or 5,
                similarity_threshold=args.similarity_threshold or 0.3,
                documento_store_ids=documento_store_ids,
                include_metadata=(
                    args.include_metadata if args.include_metadata is not None else True
                ),
                namespace=namespace_to_use,
                filter_source=args.filter_source,
                sei_metadata_filters=sei_metadata_filters,
                user_unidades=user_unidades_list,
            )

            # Executar busca
            if self._rag_service is None:
                raise RuntimeError("ServiÃ§o RAG nÃ£o foi inicializado")
            if self._rag_config is None:
                raise RuntimeError("ConfiguraÃ§Ã£o RAG nÃ£o foi inicializada")

            response = await self._rag_service.search_documents(
                request=rag_request, config=self._rag_config
            )

            return {
                "success": True,
                "query": response.query,
                "context": response.context,
                "documents": [
                    {
                        "content": doc.content,
                        "similarity": doc.similarity,
                        "metadata": doc.metadata if args.include_metadata else {},
                        "source": doc.source,
                    }
                    for doc in response.documents
                ],
                "total_found": response.total_found,
                "search_metadata": response.search_metadata,
            }

        except Exception as e:
            logger.error(f"Erro na execuÃ§Ã£o da RAG tool: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "context": "Erro ao buscar documentos. Tente reformular sua pergunta.",
                "documents_found": 0,
            }

    def get_config_info(self) -> Dict[str, Any]:
        """Obter informaÃ§Ãµes de configuraÃ§Ã£o da tool"""
        self._parse_rag_config()

        if self._rag_config is None:
            return {
                "name": self.name,
                "description": self.description,
                "rag_config": None,
            }

        return {
            "name": self.name,
            "description": self.description,
            "rag_config": {
                "name": self._rag_config.name,
                "default_max_results": self._rag_config.default_max_results,
                "default_similarity_threshold": self._rag_config.default_similarity_threshold,
                "document_stores": self._rag_config.document_stores,
                "namespaces": self._rag_config.namespaces,
            },
        }

    @classmethod
    def from_db_config(
        cls,
        config: Dict[str, Any],
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> "RAGTool":
        """Criar RAG Tool a partir de configuraÃ§Ã£o do banco de dados"""

        final_config = {
            "name": name or config.get("name", "rag_search"),
            "description": description
            or config.get("description", "Busca documentos usando RAG"),
            "rag_config": config.get("rag_config", {}),
        }

        return cls(final_config)


def create_rag_tool(config: Dict[str, Any]) -> RAGTool:
    """Factory function para criar RAG Tool"""
    return RAGTool(config)
