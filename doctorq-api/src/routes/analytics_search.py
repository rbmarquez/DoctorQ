"""
Rotas de Analytics para Busca Avançada
Fase 4 - Analytics e Monitoramento
"""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.models.analytics_schemas import (
    SearchAnalyticsResponse,
    SearchMetricsSummary,
    SearchTrend,
    TopDocument,
    TopQuery,
)
from src.services.analytics_search_service import (
    AnalyticsSearchService,
    get_analytics_search_service,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/analytics/search", tags=["Analytics Search"])


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.get("/summary", response_model=SearchMetricsSummary)
async def get_search_summary(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Resumo de Métricas de Busca**

    Retorna estatísticas agregadas sobre buscas realizadas.

    **Métricas incluídas:**
    - Total de buscas
    - Tempo médio de execução
    - Percentis de performance (P95, P99)
    - Taxa de sucesso
    - Média de resultados por busca

    **Exemplo:**
    ```bash
    GET /analytics/search/summary?days=7
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        summary = await analytics_service.get_search_summary(start_date, end_date)

        logger.info(
            f"Summary gerado para período: {start_date} a {end_date} ({days} dias)"
        )
        return summary

    except Exception as e:
        logger.error(f"Erro ao gerar summary de buscas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-queries", response_model=List[TopQuery])
async def get_top_queries(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    limit: int = Query(10, ge=1, le=100, description="Número de queries"),
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Top Queries Mais Buscadas**

    Retorna as queries mais frequentes com suas estatísticas.

    **Informações por query:**
    - Texto da query
    - Número de buscas
    - Média de resultados
    - Tempo médio de execução
    - Última busca

    **Exemplo:**
    ```bash
    GET /analytics/search/top-queries?days=7&limit=10
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        top_queries = await analytics_service.get_top_queries(
            start_date, end_date, limit
        )

        logger.info(f"Top {len(top_queries)} queries retornadas")
        return top_queries

    except Exception as e:
        logger.error(f"Erro ao buscar top queries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-documents", response_model=List[TopDocument])
async def get_top_documents(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    limit: int = Query(10, ge=1, le=100, description="Número de documentos"),
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Top Documentos Mais Acessados**

    Retorna os documentos mais retornados em buscas.

    **Informações por documento:**
    - ID e nome do documento
    - Tipo de documento
    - Número de acessos
    - Score médio
    - Último acesso

    **Exemplo:**
    ```bash
    GET /analytics/search/top-documents?days=7&limit=10
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        top_docs = await analytics_service.get_top_documents(start_date, end_date, limit)

        logger.info(f"Top {len(top_docs)} documentos retornados")
        return top_docs

    except Exception as e:
        logger.error(f"Erro ao buscar top documentos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends", response_model=List[SearchTrend])
async def get_search_trends(
    days: int = Query(30, ge=1, le=365, description="Período em dias"),
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Tendências de Busca por Período**

    Retorna série temporal de buscas agregadas por dia.

    **Informações por dia:**
    - Data
    - Total de buscas
    - Buscas bem-sucedidas
    - Tempo médio de execução

    **Exemplo:**
    ```bash
    GET /analytics/search/trends?days=30
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        trends = await analytics_service.get_search_trends(start_date, end_date)

        logger.info(f"Trends retornadas para {len(trends)} dias")
        return trends

    except Exception as e:
        logger.error(f"Erro ao buscar trends de busca: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/complete", response_model=SearchAnalyticsResponse)
async def get_complete_analytics(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    top_limit: int = Query(10, ge=1, le=50, description="Limite de top items"),
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Analytics Completo de Busca**

    Retorna todas as métricas em uma única chamada.

    **Inclui:**
    - Summary de métricas
    - Top queries
    - Top documentos
    - Tendências temporais

    **Exemplo:**
    ```bash
    GET /analytics/search/complete?days=7&top_limit=10
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # Executar todas as queries em paralelo (simulado - pode usar asyncio.gather)
        summary = await analytics_service.get_search_summary(start_date, end_date)
        top_queries = await analytics_service.get_top_queries(
            start_date, end_date, top_limit
        )
        top_docs = await analytics_service.get_top_documents(
            start_date, end_date, top_limit
        )
        trends = await analytics_service.get_search_trends(start_date, end_date)

        response = SearchAnalyticsResponse(
            summary=summary,
            top_queries=top_queries,
            top_documents=top_docs,
            trends=trends,
        )

        logger.info("Analytics completo gerado com sucesso")
        return response

    except Exception as e:
        logger.error(f"Erro ao gerar analytics completo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track")
async def track_search_event(
    query: str,
    execution_time_ms: float,
    total_results: int,
    success: bool = True,
    filters_used: dict = None,
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Rastrear Evento de Busca**

    Registra uma busca realizada para análise futura.

    **Payload:**
    ```json
    {
      "query": "contratos 2024",
      "execution_time_ms": 245.5,
      "total_results": 15,
      "success": true,
      "filters_used": {
        "document_types": ["pdf"],
        "date_from": "2024-01-01"
      }
    }
    ```
    """
    try:
        await analytics_service.track_search(
            query=query,
            execution_time_ms=execution_time_ms,
            total_results=total_results,
            success=success,
            filters_used=filters_used or {},
        )

        logger.debug(f"Busca rastreada: '{query[:50]}...' ({execution_time_ms}ms)")
        return {"message": "Evento rastreado com sucesso"}

    except Exception as e:
        logger.error(f"Erro ao rastrear busca: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS ADICIONAIS - UC114
# ============================================================================


class NoResultQuery(BaseModel):
    """Query sem resultados"""
    query: str = Field(..., description="Texto da busca")
    count: int = Field(..., description="Número de vezes buscada")
    last_search: datetime = Field(..., description="Última busca")


class OptimizationSuggestion(BaseModel):
    """Sugestão de otimização"""
    type: str = Field(..., description="Tipo: missing_content, typo, filter_too_restrictive")
    query: str = Field(..., description="Query problemática")
    suggestion: str = Field(..., description="Sugestão de melhoria")
    priority: str = Field(..., description="Prioridade: alta, media, baixa")
    affected_searches: int = Field(..., description="Número de buscas afetadas")


@router.get("/no-results/", response_model=List[NoResultQuery])
async def get_no_result_queries(
    days: int = Query(30, ge=1, le=365, description="Período em dias"),
    limit: int = Query(20, ge=1, le=100, description="Número de queries"),
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Buscas Sem Resultados**

    Retorna queries que não retornaram nenhum resultado.

    **Útil para:**
    - Identificar lacunas no conteúdo
    - Detectar problemas de indexação
    - Descobrir demanda não atendida
    - Sugestões de novos conteúdos

    **Ordenação:** Por frequência (mais buscadas primeiro)

    **Exemplo:**
    ```bash
    GET /analytics/search/no-results/?days=30&limit=20
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        no_results = await analytics_service.get_no_result_queries(
            start_date, end_date, limit
        )

        logger.info(f"{len(no_results)} queries sem resultados encontradas")
        return no_results

    except Exception as e:
        logger.error(f"Erro ao buscar queries sem resultados: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimization-suggestions/", response_model=List[OptimizationSuggestion])
async def get_optimization_suggestions(
    days: int = Query(30, ge=1, le=365, description="Período em dias"),
    analytics_service: AnalyticsSearchService = Depends(get_analytics_search_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Sugestões de Otimização**

    Analisa padrões de busca e sugere melhorias.

    **Tipos de Sugestões:**
    - **missing_content**: Conteúdo ausente (muitas buscas sem resultado)
    - **typo**: Possíveis erros de digitação (ex: "estética" vs "estetica")
    - **filter_too_restrictive**: Filtros muito restritivos

    **Prioridades:**
    - Alta: Afeta muitas buscas (>50)
    - Média: Afeta algumas buscas (10-50)
    - Baixa: Afeta poucas buscas (<10)

    **Exemplo:**
    ```bash
    GET /analytics/search/optimization-suggestions/?days=30
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        suggestions = await analytics_service.get_optimization_suggestions(
            start_date, end_date
        )

        logger.info(f"{len(suggestions)} sugestões de otimização geradas")
        return suggestions

    except Exception as e:
        logger.error(f"Erro ao gerar sugestões de otimização: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
