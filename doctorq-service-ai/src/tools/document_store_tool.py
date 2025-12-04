"""
Tool para consultar Document Stores via RAG
Permite que agentes IA busquem informações em bases de conhecimento configuradas
"""
from typing import Any, Dict, Optional, Type
from uuid import UUID

from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.tools.base_tool import BaseTool

logger = get_logger(__name__)


class DocumentStoreToolConfig(BaseModel):
    """Schema para configuração da tool Document Store"""

    document_store_id: str = Field(
        ..., description="ID do Document Store a ser consultado"
    )
    top_k: int = Field(
        5, ge=1, le=20, description="Número máximo de chunks a retornar"
    )
    enable_embeddings: bool = Field(
        False, description="Usar busca por embeddings (se disponível)"
    )
    embedding_credential_id: Optional[str] = Field(
        None, description="ID da credencial para embeddings (opcional)"
    )


class DocumentStoreToolSchema(BaseModel):
    """Schema para argumentos da tool Document Store"""

    query: str = Field(
        ...,
        description="Pergunta ou consulta para buscar no Document Store",
    )
    top_k: Optional[int] = Field(
        5, ge=1, le=20, description="Número máximo de resultados a retornar"
    )
    min_similarity: Optional[float] = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Similaridade mínima dos resultados (0.0-1.0, padrão 0.0)"
    )


class DocumentStoreTool(BaseTool):
    """
    Tool para busca em Document Stores configurados

    Permite que agentes IA consultem bases de conhecimento organizadas
    e retornem contexto relevante para responder perguntas.
    """

    name: str = "document_store_search"
    description: str = (
        "Buscar informações relevantes em uma base de conhecimento específica. "
        "Use esta ferramenta quando precisar de contexto adicional de documentos "
        "armazenados para responder perguntas do usuário."
    )
    args_schema: Type[BaseModel] = DocumentStoreToolSchema
    tool_config: Dict[str, Any] = Field(default_factory=dict)
    agent_id: Optional[str] = Field(default=None)

    async def _execute_tool_logic(
        self,
        query: str,
        top_k: Optional[int] = None,
        min_similarity: Optional[float] = 0.0,
        **kwargs: Any,
    ) -> str:
        """
        Executa busca no Document Store

        Args:
            query: Texto da consulta
            top_k: Número máximo de resultados (override da config)
            min_similarity: Similaridade mínima (0.0-1.0, padrão 0.0)

        Returns:
            String formatada com os chunks relevantes encontrados
        """
        try:
            # Importar serviços necessários
            from src.config.orm_config import ORMConfig
            from src.services.documento_store_service import DocumentoStoreService

            # Obter configuração da tool
            document_store_id = self.tool_config.get("document_store_id")
            if not document_store_id:
                return "❌ Erro: Document Store não configurado para este agente."

            # Usar top_k da configuração ou do parâmetro
            final_top_k = top_k or self.tool_config.get("top_k", 5)
            # Usar min_similarity do parâmetro (padrão 0.0 = sem filtro)
            final_min_similarity = min_similarity if min_similarity is not None else 0.0

            logger.debug(
                f"Consultando Document Store {document_store_id} com query: '{query}' "
                f"(top_k={final_top_k}, min_similarity={final_min_similarity})"
            )

            # Executar consulta usando o serviço
            async with ORMConfig.get_session() as db_session:
                service = DocumentoStoreService(db=db_session)

                # Verificar se o document store existe
                try:
                    doc_store = await service.get_documento_store_by_id(
                        UUID(document_store_id)
                    )
                    if not doc_store:
                        return f"❌ Document Store com ID {document_store_id} não encontrado."
                except Exception as e:
                    logger.error(f"Erro ao buscar document store: {e}")
                    return f"❌ Erro ao acessar Document Store: {str(e)}"

                # Executar a consulta com novos parâmetros
                results = await service.query_document_store(
                    document_store_id=UUID(document_store_id),
                    query=query,
                    top_k=final_top_k,
                    min_similarity=final_min_similarity,  # ✨ NOVO: filtro por similaridade
                )

                # Formatar resultados
                if not results:
                    return (
                        f"ℹ️ Nenhum resultado encontrado para a consulta '{query}' "
                        f"no Document Store '{doc_store.nm_documento_store}'."
                    )

                # Detectar método de busca do primeiro resultado
                search_method = results[0].get('search_method', 'unknown') if results else 'unknown'
                search_method_emoji = "🔍" if search_method == "semantic" else "📝"
                search_method_name = "Busca Semântica (Vetorial)" if search_method == "semantic" else "Busca por Palavras-chave"

                # Criar resposta formatada
                response_parts = [
                    f"📚 Resultados do Document Store '{doc_store.nm_documento_store}':",
                    f"Query: {query}",
                    f"{search_method_emoji} Método: {search_method_name}",
                    f"✅ Chunks encontrados: {len(results)}/{final_top_k}",
                ]

                # Adicionar filtro de similaridade se usado
                if final_min_similarity > 0:
                    response_parts.append(f"⚙️ Similaridade mínima: {final_min_similarity:.1%}")

                response_parts.append("")  # Linha em branco

                for idx, result in enumerate(results, 1):
                    chunk_info = [
                        f"--- Chunk {idx} ---",
                        f"📄 Arquivo: {result.get('filename', 'N/A')}",
                        f"📍 Posição: {result.get('chunk_index', 'N/A')}",
                    ]

                    # Adicionar score se disponível (com mais detalhes)
                    if result.get('score') is not None and result['score'] > 0:
                        score_pct = result['score'] * 100
                        score_stars = "⭐" * min(5, int(result['score'] * 5))
                        chunk_info.append(f"🎯 Relevância: {score_pct:.1f}% {score_stars}")

                    chunk_info.append(f"\n💬 Conteúdo:\n{result.get('content', '')}")
                    chunk_info.append("")

                    response_parts.extend(chunk_info)

                response = "\n".join(response_parts)
                logger.debug(f"Retornando {len(results)} resultados para o agente")

                return response

        except Exception as e:
            error_msg = f"❌ Erro ao consultar Document Store: {str(e)}"
            logger.error(error_msg)
            logger.exception(e)
            return error_msg

    async def _arun(
        self,
        query: str,
        top_k: Optional[int] = None,
        min_similarity: Optional[float] = 0.0,
        **kwargs: Any,
    ) -> str:
        """
        Método de execução assíncrona (mantido para compatibilidade)
        Delega para _execute_tool_logic
        """
        return await self._execute_tool_logic(
            query=query,
            top_k=top_k,
            min_similarity=min_similarity,
            **kwargs
        )

    def _run(self, *args, **kwargs) -> Any:
        """Execução síncrona não suportada"""
        raise NotImplementedError(
            "DocumentStoreTool requer execução assíncrona. Use _arun ou _execute_tool_logic."
        )


def create_document_store_tool(
    document_store_id: str,
    document_store_name: str = "Knowledge Base",
    top_k: int = 5,
    enable_embeddings: bool = False,
    embedding_credential_id: Optional[str] = None,
) -> DocumentStoreTool:
    """
    Factory function para criar uma instância da tool Document Store

    Args:
        document_store_id: UUID do document store
        document_store_name: Nome descritivo (para logs)
        top_k: Número padrão de resultados
        enable_embeddings: Se deve usar busca por embeddings
        embedding_credential_id: ID da credencial para embeddings

    Returns:
        Instância configurada de DocumentStoreTool
    """
    tool_config = {
        "document_store_id": document_store_id,
        "top_k": top_k,
        "enable_embeddings": enable_embeddings,
        "embedding_credential_id": embedding_credential_id,
    }

    tool = DocumentStoreTool(
        name=f"search_{document_store_name.lower().replace(' ', '_')}",
        description=(
            f"Buscar informações na base de conhecimento '{document_store_name}'. "
            f"Use quando precisar de contexto específico desta fonte."
        ),
        tool_config=tool_config,
    )

    logger.info(
        f"Tool criada para Document Store '{document_store_name}' (ID: {document_store_id})"
    )

    return tool
