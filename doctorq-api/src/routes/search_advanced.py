"""
Rotas de Busca Avançada - Fase 2
Implementa hybrid search, re-ranking e filtros avançados
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.models.search_schemas import (
    DocumentType,
    ExportFormat,
    HybridSearchRequest,
    SearchResponseAdvanced,
    SearchResultAdvanced,
    SortBy,
)
from src.services.search_advanced_service import (
    AdvancedSearchService,
    get_advanced_search_service,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/search/advanced", tags=["Search Advanced"])


# ============================================================================
# REQUEST MODELS (models específicos desta rota, não compartilhados)
# ============================================================================


class ExportRequest(BaseModel):
    """Request para exportação de resultados"""

    query: str = Field(..., description="Consulta de busca")
    format: ExportFormat = Field(ExportFormat.JSON, description="Formato de exportação")
    limit: int = Field(100, ge=1, le=1000, description="Número máximo de resultados")

    # Mesmos filtros da busca avançada
    document_types: Optional[List[DocumentType]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    tags: Optional[List[str]] = None
    namespace: Optional[str] = None


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.post("/hybrid", response_model=SearchResponseAdvanced)
async def hybrid_search(
    request: HybridSearchRequest,
    search_service: AdvancedSearchService = Depends(get_advanced_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Busca Híbrida (Keyword + Vector)**

    Combina busca por palavras-chave com busca vetorial semântica para
    resultados mais precisos e relevantes.

    **Features:**
    - Hybrid search com pesos configuráveis
    - Re-ranking por relevância contextual
    - Filtros avançados (data, tipo, tags)
    - Ordenação customizável
    - Highlights nos resultados

    **Exemplo:**
    ```json
    {
      "query": "contratos de licitação 2024",
      "vector_weight": 0.7,
      "document_types": ["pdf", "docx"],
      "date_from": "2024-01-01",
      "enable_reranking": true
    }
    ```
    """
    try:
        logger.info(f"Busca híbrida iniciada: '{request.query[:50]}...'")

        # Executar busca híbrida com todos os filtros
        response = await search_service.hybrid_search(
            query=request.query,
            limit=request.limit,
            vector_weight=request.vector_weight,
            threshold=request.threshold,
            document_types=request.document_types,
            date_from=request.date_from,
            date_to=request.date_to,
            tags=request.tags,
            namespace=request.namespace,
            sort_by=request.sort_by,
            enable_reranking=request.enable_reranking,
        )

        logger.info(
            f"Busca híbrida concluída: {response.total_found} resultados em {response.execution_time_ms:.2f}ms"
        )
        return response

    except Exception as e:
        logger.error(f"Erro na busca híbrida: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro interno na busca híbrida: {str(e)}"
        )


@router.get("/hybrid", response_model=SearchResponseAdvanced)
async def hybrid_search_get(
    query: str = Query(..., description="Consulta de busca"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de resultados"),
    vector_weight: float = Query(0.5, ge=0.0, le=1.0, description="Peso vetorial"),
    threshold: float = Query(0.3, ge=0.0, le=1.0, description="Threshold mínimo"),
    document_types: Optional[str] = Query(
        None, description="Tipos de documento (separados por vírgula)"
    ),
    date_from: Optional[datetime] = Query(None, description="Data inicial"),
    date_to: Optional[datetime] = Query(None, description="Data final"),
    tags: Optional[str] = Query(None, description="Tags (separadas por vírgula)"),
    namespace: Optional[str] = Query(None, description="Namespace"),
    sort_by: SortBy = Query(SortBy.RELEVANCE, description="Ordenação"),
    enable_reranking: bool = Query(True, description="Ativar re-ranking"),
    search_service: AdvancedSearchService = Depends(get_advanced_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Busca Híbrida (GET)**

    Versão GET do endpoint de busca híbrida para facilitar testes.

    **Exemplo:**
    ```
    GET /search/advanced/hybrid?query=contratos&vector_weight=0.7&document_types=pdf,docx
    ```
    """
    # Parse tipos de documento
    doc_types = None
    if document_types:
        doc_types = [DocumentType(t.strip()) for t in document_types.split(",")]

    # Parse tags
    tag_list = None
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]

    # Criar request
    request = HybridSearchRequest(
        query=query,
        limit=limit,
        vector_weight=vector_weight,
        threshold=threshold,
        document_types=doc_types,
        date_from=date_from,
        date_to=date_to,
        tags=tag_list,
        namespace=namespace,
        sort_by=sort_by,
        enable_reranking=enable_reranking,
    )

    return await hybrid_search(request, search_service)


@router.post("/export")
async def export_results(
    request: ExportRequest,
    search_service: AdvancedSearchService = Depends(get_advanced_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Exportação de Resultados**

    Exporta resultados de busca em diferentes formatos.

    **Formatos suportados:**
    - `json` - JSON estruturado
    - `csv` - CSV para planilhas
    - `markdown` - Markdown formatado
    - `txt` - Texto plano

    **Exemplo:**
    ```json
    {
      "query": "relatórios 2024",
      "format": "csv",
      "limit": 100,
      "document_types": ["pdf"]
    }
    ```
    """
    try:
        logger.info(
            f"Exportação iniciada: '{request.query[:50]}...' (formato: {request.format})"
        )

        # Executar busca e exportar
        export_data = await search_service.export_results(
            query=request.query,
            format=request.format,
            limit=request.limit,
            document_types=request.document_types,
            date_from=request.date_from,
            date_to=request.date_to,
            tags=request.tags,
            namespace=request.namespace,
        )

        logger.info(f"Exportação concluída: {len(export_data)} bytes")

        # Retornar com content-type apropriado
        from fastapi.responses import Response

        content_types = {
            ExportFormat.JSON: "application/json",
            ExportFormat.CSV: "text/csv",
            ExportFormat.MARKDOWN: "text/markdown",
            ExportFormat.TXT: "text/plain",
        }

        return Response(
            content=export_data,
            media_type=content_types.get(request.format, "text/plain"),
            headers={
                "Content-Disposition": f"attachment; filename=search_results.{request.format.value}"
            },
        )

    except Exception as e:
        logger.error(f"Erro na exportação: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro interno na exportação: {str(e)}"
        )


@router.get("/filters/available")
async def get_available_filters(
    search_service: AdvancedSearchService = Depends(get_advanced_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Filtros Disponíveis**

    Retorna todos os filtros disponíveis com suas opções.

    **Retorna:**
    - Tipos de documento disponíveis
    - Tags existentes
    - Namespaces
    - Range de datas
    """
    try:
        logger.debug("Obtendo filtros disponíveis")

        filters = await search_service.get_available_filters()

        logger.debug(f"Filtros obtidos: {len(filters.get('tags', []))} tags")
        return filters

    except Exception as e:
        logger.error(f"Erro ao obter filtros: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro interno ao obter filtros: {str(e)}"
        )


@router.get("/stats")
async def get_search_stats(
    search_service: AdvancedSearchService = Depends(get_advanced_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Estatísticas de Busca**

    Retorna estatísticas sobre documentos e buscas.

    **Retorna:**
    - Total de documentos
    - Documentos por tipo
    - Documentos por período
    - Tags mais utilizadas
    """
    try:
        logger.debug("Obtendo estatísticas de busca")

        stats = await search_service.get_stats()

        logger.debug("Estatísticas obtidas com sucesso")
        return stats

    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro interno ao obter estatísticas: {str(e)}"
        )
