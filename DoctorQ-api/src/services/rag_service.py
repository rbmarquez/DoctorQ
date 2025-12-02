# src/services/rag_service.py
import hashlib
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from src.config.logger_config import get_logger
from src.models.rag_config import (
    RAGConfiguration,
    RAGDocumentResult,
    RAGQueryRequest,
    RAGQueryResponse,
)
from src.services.embedding_service import DocumentSearchResult, EmbeddingService

logger = get_logger(__name__)


class RAGService:
    """ServiÃ§o para operaÃ§Ãµes RAG (Retrieval-Augmented Generation)"""

    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _generate_cache_key(self, query: str, config: Dict[str, Any]) -> str:
        """Gerar chave Ãºnica para cache baseada na query e configuraÃ§Ã£o"""
        config_str = json.dumps(config, sort_keys=True)
        combined = f"{query}:{config_str}"
        return hashlib.md5(combined.encode("utf-8")).hexdigest()

    def _get_cached_result(self, cache_key: str) -> Optional[RAGQueryResponse]:
        """Verificar se existe resultado em cache vÃ¡lido"""
        if cache_key not in self._cache:
            return None

        cached_data = self._cache[cache_key]
        cache_time = cached_data.get("timestamp")

        if not cache_time:
            return None

        logger.debug(f"Cache hit para query: {cache_key[:16]}...")
        return cached_data.get("result")

    def _cache_result(self, cache_key: str, result: RAGQueryResponse):
        """Armazenar resultado no cache"""
        self._cache[cache_key] = {"result": result, "timestamp": datetime.now()}
        logger.debug(f"Resultado armazenado em cache: {cache_key[:16]}...")

    def _format_context_for_llm(
        self, documents: List[RAGDocumentResult], template: str
    ) -> str:
        """Formatar contexto dos documentos para o LLM"""
        if not documents:
            return "Nenhum documento relevante encontrado."

        # Formatar cada documento
        formatted_docs = []
        for i, doc in enumerate(documents, 1):
            doc_text = f"Documento {i} (similaridade: {doc.similarity:.2f}):\n"
            doc_text += f"ConteÃºdo: {doc.content}\n"

            if doc.metadata:
                relevant_metadata = {
                    k: v
                    for k, v in doc.metadata.items()
                    if k not in ["record_manager_key", "record_manager_namespace"]
                }
                if relevant_metadata:
                    doc_text += f"Metadados: {json.dumps(relevant_metadata, ensure_ascii=False)}\n"

            formatted_docs.append(doc_text)

        documents_text = "\n---\n".join(formatted_docs)
        return template.format(documents=documents_text)

    def _convert_search_results_to_rag_documents(
        self, search_results: List[DocumentSearchResult]
    ) -> List[RAGDocumentResult]:
        """Converter resultados de busca para formato RAG"""
        rag_documents = []

        for result in search_results:
            source = None
            if result.metadata:
                source = result.metadata.get("source") or result.metadata.get(
                    "file_name"
                )

            rag_doc = RAGDocumentResult(
                id=result.id,
                content=result.content,
                similarity=result.similarity,
                metadata=result.metadata or {},
                created_at=result.created_at,
                source=source,
            )

            rag_documents.append(rag_doc)

        return rag_documents

    async def search_documents(
        self,
        request: RAGQueryRequest,
        config: RAGConfiguration,
        enable_cache: bool = True,
    ) -> RAGQueryResponse:
        """
        Realizar busca RAG nos documentos

        Args:
            request: RequisiÃ§Ã£o de busca RAG
            config: ConfiguraÃ§Ã£o RAG
            enable_cache: Habilitar uso de cache

        Returns:
            Resposta RAG com documentos encontrados e contexto formatado
        """
        try:

            logger.debug(f"Executando busca RAG para query: '{request.query[:50]}...'")

            # Determinar namespace para busca
            # Usar o namespace especificado na requisiÃ§Ã£o
            namespace = request.namespace
            if not namespace:
                logger.warning(
                    "ðŸš¨ [RAGService] Namespace nÃ£o especificado na requisiÃ§Ã£o! Usando 'default' como fallback."
                )
                namespace = "default"
            logger.debug(f"ðŸ” [RAGService] Namespace recebido: {request.namespace}")
            logger.debug(f"ðŸ” [RAGService] Namespace usado: {namespace}")
            logger.debug("ðŸ” [RAGService] ParÃ¢metros da busca semÃ¢ntica:")
            logger.debug(f"  - Query: '{request.query}'")
            logger.debug(f"  - Limit: {request.max_results}")
            logger.debug(f"  - Threshold: {request.similarity_threshold}")
            logger.debug(f"  - Namespace: {namespace}")
            logger.debug(
                f"  - Filter Source: {getattr(request, 'filter_source', None)}"
            )
            logger.debug(
                f"  - SEI Metadata Filters: {getattr(request, 'sei_metadata_filters', None)}"
            )
            logger.debug(
                f"  - User Unidades: {getattr(request, 'user_unidades', None)}"
            )

            # Preparar filtros para busca SEI
            metadata_filters = None
            user_unidades = None

            if hasattr(request, "filter_source") and request.filter_source == "sei":
                logger.debug("ðŸ¢ [RAGService] Aplicando filtros SEI")

                # Usar filtros de metadados SEI se fornecidos
                if (
                    hasattr(request, "sei_metadata_filters")
                    and request.sei_metadata_filters
                ):
                    metadata_filters = request.sei_metadata_filters
                    logger.debug(f"Filtros de metadados SEI: {metadata_filters}")

                # Usar unidades do usuÃ¡rio se fornecidas
                if hasattr(request, "user_unidades") and request.user_unidades:
                    user_unidades = request.user_unidades
                    logger.debug(f"Unidades do usuÃ¡rio: {user_unidades}")

            # Realizar busca semÃ¢ntica
            search_results = await self.embedding_service.semantic_search(
                query=request.query,
                limit=request.max_results,
                threshold=request.similarity_threshold,
                namespace=namespace,
                metadata_filters=metadata_filters,
                user_unidades=user_unidades,
            )

            logger.debug(
                f"ðŸ” [RAGService] Resultados da busca semÃ¢ntica: {len(search_results)} documentos encontrados"
            )

            # Filtrar por document stores se especificado
            if request.documento_store_ids:
                filtered_results = []
                for result in search_results:
                    # Verificar se o documento pertence a um dos stores especificados
                    doc_metadata = result.metadata or {}
                    doc_store_id = doc_metadata.get("documento_store_id")

                    if (
                        doc_store_id
                        and str(doc_store_id) in request.documento_store_ids
                    ):
                        filtered_results.append(result)

                search_results = filtered_results
                logger.debug(
                    f"Resultados filtrados por document store: {len(search_results)}"
                )

            # Converter para formato RAG
            rag_documents = self._convert_search_results_to_rag_documents(
                search_results
            )

            # Formatar contexto para LLM
            context = self._format_context_for_llm(
                rag_documents, config.context_template
            )

            # Preparar metadados da busca
            search_metadata = {
                "search_type": "semantic",
                "namespace": namespace,
                "similarity_threshold": request.similarity_threshold,
                "requested_max_results": request.max_results,
                "actual_results": len(rag_documents),
                "search_timestamp": datetime.now().isoformat(),
                "filtered_by_stores": bool(request.documento_store_ids),
                "search_algorithm": config.search_algorithm,
                "vector_distance_metric": config.vector_distance_metric,
            }

            # Criar resposta
            response = RAGQueryResponse(
                query=request.query,
                documents=rag_documents,
                total_found=len(rag_documents),
                context=context,
                search_metadata=search_metadata,
            )

            logger.debug(
                f"Busca RAG concluÃ­da: {len(rag_documents)} documentos encontrados"
            )
            return response

        except Exception as e:
            logger.error(f"Erro na busca RAG: {str(e)}")
            raise

    def clear_cache(self):
        """Limpar cache de consultas"""
        cache_size = len(self._cache)
        self._cache.clear()
        logger.debug(f"Cache limpo: {cache_size} entradas removidas")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Obter estatÃ­sticas do cache"""
        now = datetime.now()
        valid_entries = 0
        expired_entries = 0

        for cache_data in self._cache.values():
            cache_time = cache_data.get("timestamp")
            # Considera vÃ¡lido se menos de 1h
            if cache_time and (now - cache_time).seconds < 3600:
                valid_entries += 1
            else:
                expired_entries += 1

        return {
            "total_entries": len(self._cache),
            "valid_entries": valid_entries,
            "expired_entries": expired_entries,
            "cache_memory_usage": len(str(self._cache).encode("utf-8")),
        }


def get_rag_service(embedding_service: EmbeddingService) -> RAGService:
    """
    Factory function para criar instÃ¢ncia do RAGService

    Args:
        embedding_service: InstÃ¢ncia do EmbeddingService

    Returns:
        InstÃ¢ncia configurada do RAGService
    """
    return RAGService(embedding_service)
