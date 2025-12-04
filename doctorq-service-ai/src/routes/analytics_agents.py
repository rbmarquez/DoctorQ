"""
Rotas de Analytics para Agentes
Fase 4 - Analytics e Monitoramento
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.models.agent_analytics_schemas import (
    AgentDocumentStoreUsage,
    AgentMetrics,
    AgentPerformanceComparison,
    TokenUsageByAgent,
)
from src.services.analytics_agents_service import (
    AnalyticsAgentsService,
    get_analytics_agents_service,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/analytics/agents", tags=["Analytics Agents"])


# ============================================================================
# MODELS
# ============================================================================






# ============================================================================
# ENDPOINTS
# ============================================================================


@router.get("/summary", response_model=List[AgentMetrics])
async def get_agents_summary(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    limit: int = Query(20, ge=1, le=100, description="Número máximo de agentes"),
    analytics_service: AnalyticsAgentsService = Depends(get_analytics_agents_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Resumo de Métricas de Agentes**

    Retorna métricas agregadas de todos os agentes.

    **Métricas por agente:**
    - Total de conversas
    - Total de mensagens
    - Tempo médio de resposta
    - Taxa de sucesso
    - Tokens consumidos
    - Custo estimado

    **Exemplo:**
    ```bash
    GET /analytics/agents/summary?days=7&limit=20
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        metrics = await analytics_service.get_agents_summary(
            start_date, end_date, limit
        )

        logger.info(f"Métricas de {len(metrics)} agentes retornadas")
        return metrics

    except Exception as e:
        logger.error(f"Erro ao buscar summary de agentes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document-stores", response_model=List[AgentDocumentStoreUsage])
async def get_document_store_usage(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    agent_id: Optional[UUID] = Query(None, description="Filtrar por agente"),
    analytics_service: AnalyticsAgentsService = Depends(get_analytics_agents_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Uso de Document Stores por Agentes**

    Mostra quais document stores são mais utilizados por cada agente.

    **Informações:**
    - Agente e document store
    - Número de consultas
    - Média de resultados
    - Último uso

    **Exemplo:**
    ```bash
    GET /analytics/agents/document-stores?days=7
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        usage = await analytics_service.get_document_store_usage(
            start_date, end_date, agent_id
        )

        logger.info(f"Uso de {len(usage)} document stores retornado")
        return usage

    except Exception as e:
        logger.error(f"Erro ao buscar uso de document stores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance-comparison", response_model=AgentPerformanceComparison)
async def get_performance_comparison(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    analytics_service: AnalyticsAgentsService = Depends(get_analytics_agents_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Comparação de Performance entre Agentes**

    Ranking de agentes por diferentes critérios de performance.

    **Inclui:**
    - Ranking completo de agentes
    - Melhor agente do período
    - Pior agente do período

    **Exemplo:**
    ```bash
    GET /analytics/agents/performance-comparison?days=7
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        comparison = await analytics_service.get_performance_comparison(
            start_date, end_date
        )

        logger.info("Comparação de performance gerada")
        return comparison

    except Exception as e:
        logger.error(f"Erro ao comparar performance de agentes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/token-usage", response_model=List[TokenUsageByAgent])
async def get_token_usage(
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    analytics_service: AnalyticsAgentsService = Depends(get_analytics_agents_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Uso de Tokens por Agente**

    Análise detalhada de consumo de tokens LLM por agente.

    **Informações:**
    - Tokens totais (prompt + completion)
    - Custo estimado
    - Porcentagem do total

    **Exemplo:**
    ```bash
    GET /analytics/agents/token-usage?days=7
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        token_usage = await analytics_service.get_token_usage(start_date, end_date)

        logger.info(f"Uso de tokens de {len(token_usage)} agentes retornado")
        return token_usage

    except Exception as e:
        logger.error(f"Erro ao buscar uso de tokens: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}/details", response_model=AgentMetrics)
async def get_agent_details(
    agent_id: UUID,
    days: int = Query(7, ge=1, le=365, description="Período em dias"),
    analytics_service: AnalyticsAgentsService = Depends(get_analytics_agents_service),
    _: object = Depends(get_current_apikey),
):
    """
    **Detalhes de um Agente Específico**

    Métricas detalhadas de um agente individual.

    **Exemplo:**
    ```bash
    GET /analytics/agents/{agent_id}/details?days=7
    ```
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        details = await analytics_service.get_agent_details(
            str(agent_id), start_date, end_date
        )

        if not details:
            raise HTTPException(
                status_code=404, detail="Agente não encontrado ou sem dados"
            )

        logger.info(f"Detalhes do agente {agent_id} retornados")
        return details

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do agente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
