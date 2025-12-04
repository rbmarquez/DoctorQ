# src/tools/qdrant_rag_tool.py
from typing import Any, Dict, Optional, Type

from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.tools.base_tool import BaseTool

logger = get_logger(__name__)


class QdrantRAGToolConfig(BaseModel):
    """Schema para configuraÃ§Ã£o da tool RAG Qdrant"""

    collection_name: str = Field(..., description="Nome da coleÃ§Ã£o Qdrant")
    qdrant_credential_id: str = Field(..., description="ID da credencial Qdrant")
    embedding_credential_id: str = Field(
        ..., description="ID da credencial Azure OpenAI Embedding"
    )
    similarity_threshold: float = Field(
        0.1, ge=0.0, le=1.0, description="Limite de similaridade"
    )
    max_results: int = Field(4, ge=1, le=100, description="MÃ¡ximo de resultados")


class QdrantRAGToolSchema(BaseModel):
    """Schema para argumentos da tool RAG Qdrant"""

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
    collection_name: Optional[str] = Field(
        None, description="Nome especÃ­fico da coleÃ§Ã£o Qdrant"
    )
    include_metadata: Optional[bool] = Field(
        True, description="Incluir metadados dos documentos"
    )


class QdrantRAGTool(BaseTool):
    """Tool para busca RAG usando Qdrant"""

    name: str = "qdrant_rag_search"
    description: str = "Buscar documentos similares na base de conhecimento Qdrant"
    args_schema: Type[BaseModel] = QdrantRAGToolSchema
    tool_config: Dict[str, Any] = Field(default_factory=dict)
    agent_id: Optional[str] = Field(default=None)

    async def _arun(
        self,
        query: str,
        max_results: int = 5,
        similarity_threshold: float = 0.3,
        collection_name: Optional[str] = None,
        include_metadata: bool = True,
        **kwargs: Any,
    ) -> str:
        """Executar busca RAG no Qdrant"""
        try:
            # Inicializar serviÃ§os usando context manager para sessÃ£o do banco
            from src.config.orm_config import ORMConfig
            from src.services.agent_service import AgentService
            from src.services.credencial_service import CredencialService
            from src.services.embedding_service import EmbeddingService
            from src.services.qdrant_service import QdrantService

            # Usar context manager para sessÃ£o do banco
            async with ORMConfig.get_session() as db_session:
                # Inicializar serviÃ§os (alguns aceitam db, outros gerenciam internamente)
                agent_service = AgentService(db=db_session)
                credencial_service = CredencialService()  # Gerencia prÃ³pria sessÃ£o
                embedding_service = EmbeddingService(db=db_session)
                qdrant_service = QdrantService(
                    agent_service=agent_service,
                    credencial_service=credencial_service,
                    embedding_service=embedding_service,
                )

                # Debug: verificar configuraÃ§Ã£o da tool
                logger.debug(f"Tool config disponÃ­vel: {self.tool_config}")

                # Tool config tem prioridade sobre parÃ¢metros
                if hasattr(self, "tool_config") and self.tool_config:
                    tool_collection = self.tool_config.get("collection_name")
                    if tool_collection:
                        collection_name = tool_collection

                # Usar similarity_threshold e max_results da tool_config se disponÃ­veis
                if hasattr(self, "tool_config"):
                    tool_similarity = self.tool_config.get("similarity_threshold")
                    tool_max_results = self.tool_config.get("max_results")

                    if tool_similarity is not None:
                        similarity_threshold = tool_similarity
                    if tool_max_results is not None:
                        max_results = tool_max_results

                # Obter credenciais diretamente da configuraÃ§Ã£o da tool
                qdrant_credential_id = self.tool_config.get("qdrant_credential_id")
                embedding_credential_id = self.tool_config.get(
                    "embedding_credential_id"
                )

                logger.debug(f"Collection name: {collection_name}")
                logger.debug(
                    f"Similarity threshold (tool config): {similarity_threshold}"
                )
                logger.debug(f"Max results (tool config): {max_results}")
                logger.debug(f"Qdrant credential ID: {qdrant_credential_id}")
                logger.debug(f"Embedding credential ID: {embedding_credential_id}")

                if not qdrant_credential_id or not embedding_credential_id:
                    return "ConfiguraÃ§Ã£o da tool incompleta: credenciais Qdrant ou embedding nÃ£o definidas"

                logger.info(
                    f"Iniciando busca RAG Qdrant: '{query}' (coleÃ§Ã£o: {collection_name or 'padrÃ£o'})"
                )

                # Buscar documentos similares usando credenciais da tool
                results = (
                    await qdrant_service.search_similar_documents_with_credentials(
                        query_text=query,
                        limit=max_results,
                        score_threshold=similarity_threshold,
                        collection_name=collection_name,
                        qdrant_credential_id=qdrant_credential_id,
                        embedding_credential_id=embedding_credential_id,
                    )
                )

                if not results:
                    return (
                        "Nenhum documento relevante encontrado na base de conhecimento."
                    )

                # Formatar resposta
                response_parts = []
                response_parts.append(
                    f"Encontrados {len(results)} documentos relevantes:\n"
                )

                for i, result in enumerate(results, 1):
                    score = result.get("score", 0)
                    payload = result.get("payload", {})
                    content = payload.get("content", "")

                    # Limitar tamanho do conteÃºdo
                    content_preview = (
                        content[:500] + "..." if len(content) > 500 else content
                    )

                    response_parts.append(f"\n{i}. Similaridade: {score:.2f}")

                    if include_metadata:
                        filename = payload.get("filename", "N/A")
                        chunk_id = payload.get("chunk_id", "N/A")
                        response_parts.append(
                            f"   Arquivo: {filename} (chunk {chunk_id})"
                        )

                    response_parts.append(f"   ConteÃºdo: {content_preview}")

                logger.info(
                    f"Busca RAG concluÃ­da: {len(results)} resultados para '{query}'"
                )
                return "\n".join(response_parts)

        except Exception as e:
            error_msg = f"Erro na busca RAG Qdrant: {str(e)}"
            logger.error(error_msg)
            return f"Erro ao buscar na base de conhecimento: {str(e)}"

    def _run(self, **kwargs: Any) -> str:
        """Executar busca RAG (sync - nÃ£o implementado)"""
        raise NotImplementedError("Use a versÃ£o assÃ­ncrona _arun")

    async def _execute_tool_logic(self, **kwargs) -> str:
        """ImplementaÃ§Ã£o do mÃ©todo abstrato da classe base"""
        return await self._arun(**kwargs)

    @classmethod
    def from_db_config(
        cls,
        config: Dict[str, Any],
        name: str,
        description: str,
        agent_id: str,
        **kwargs,
    ) -> "QdrantRAGTool":
        """Criar tool a partir de configuraÃ§Ã£o do banco"""

        # Validar configuraÃ§Ã£o usando o schema
        try:
            validated_config = QdrantRAGToolConfig.model_validate(config)
        except Exception as e:
            logger.error(f"ConfiguraÃ§Ã£o invÃ¡lida para QdrantRAGTool: {e}")
            raise ValueError(f"ConfiguraÃ§Ã£o invÃ¡lida: {e}")

        # Configurar tool com configuraÃ§Ã£o validada
        instance = cls(
            name=name,
            description=description,
            agent_id=agent_id,
            tool_config=validated_config.model_dump(),
            **kwargs,
        )

        return instance

    def get_config_schema(self) -> Dict[str, Any]:
        """Retornar schema de configuraÃ§Ã£o para esta tool"""
        return {
            "type": "object",
            "properties": {
                "collection_name": {
                    "type": "string",
                    "description": "Nome da coleÃ§Ã£o Qdrant",
                },
                "qdrant_credential_id": {
                    "type": "string",
                    "description": "ID da credencial Qdrant para conexÃ£o",
                },
                "embedding_credential_id": {
                    "type": "string",
                    "description": "ID da credencial Azure OpenAI Embedding",
                },
                "max_results": {
                    "type": "integer",
                    "default": 10,
                    "minimum": 1,
                    "maximum": 100,
                    "description": "NÃºmero mÃ¡ximo de documentos a retornar",
                },
                "similarity_threshold": {
                    "type": "number",
                    "default": 0.8,
                    "minimum": 0.0,
                    "maximum": 1.0,
                    "description": "Limite mÃ­nimo de similaridade",
                },
            },
            "required": [
                "collection_name",
                "qdrant_credential_id",
                "embedding_credential_id",
            ],
        }
