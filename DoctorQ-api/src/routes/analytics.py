"""
Rotas para Analytics e Métricas de Negócio
"""

import uuid
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.config.logger_config import get_logger
from src.models.analytics import (
    AnalyticsEvent,
    AnalyticsEventCreate,
    AnalyticsSnapshot,
    ConversationAnalytics,
    DashboardSummary,
    EventType,
    MetricType,
    RevenueAnalytics,
    TemplateAnalytics,
    UsageAnalytics,
    UserAnalytics,
)
from src.services.analytics_service import AnalyticsService, get_analytics_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


# =============================================================================
# EVENT TRACKING
# =============================================================================


@router.post("/events", status_code=status.HTTP_201_CREATED, response_model=dict)
async def track_event(
    event_data: AnalyticsEventCreate,
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Registra um evento de analytics

    **Exemplo de payload:**
    ```json
    {
        "id_user": "123e4567-e89b-12d3-a456-426614174000",
        "nm_event_type": "user_login",
        "ds_event_data": {
            "ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0..."
        },
        "ds_metadata": {
            "source": "web"
        }
    }
    ```
    """
    try:
        event = await analytics_service.track_event(event_data)
        return {
            "id_event": str(event.id_event),
            "message": "Evento registrado com sucesso",
        }
    except Exception as e:
        logger.error(f"Erro ao registrar evento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar evento",
        ) from e


@router.get("/events", response_model=List[dict])
async def get_events(
    user_id: Optional[uuid.UUID] = Query(None, description="Filtrar por usuário"),
    empresa_id: Optional[uuid.UUID] = Query(None, description="Filtrar por empresa"),
    event_type: Optional[EventType] = Query(None, description="Tipo de evento"),
    start_date: Optional[datetime] = Query(None, description="Data inicial"),
    end_date: Optional[datetime] = Query(None, description="Data final"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de resultados"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Busca eventos com filtros

    **Filtros disponíveis:**
    - `user_id`: Filtrar por ID do usuário
    - `empresa_id`: Filtrar por ID da empresa
    - `event_type`: Tipo de evento (user_login, user_signup, etc.)
    - `start_date`: Data inicial (formato ISO 8601)
    - `end_date`: Data final (formato ISO 8601)
    - `limit`: Limite de resultados (máximo 1000)

    **Exemplo de resposta:**
    ```json
    [
        {
            "id_event": "...",
            "id_user": "...",
            "nm_event_type": "user_login",
            "dt_event": "2025-01-15T10:30:00",
            "ds_event_data": {...}
        }
    ]
    ```
    """
    try:
        events = await analytics_service.get_events(
            user_id=user_id,
            empresa_id=empresa_id,
            event_type=event_type,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )

        return [
            {
                "id_event": str(event.id_event),
                "id_user": str(event.id_user) if event.id_user else None,
                "id_empresa": str(event.id_empresa) if event.id_empresa else None,
                "nm_event_type": event.nm_event_type,
                "dt_event": event.dt_event,
                "ds_event_data": event.ds_event_data,
                "ds_metadata": event.ds_metadata,
            }
            for event in events
        ]
    except Exception as e:
        logger.error(f"Erro ao buscar eventos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar eventos",
        ) from e


# =============================================================================
# SNAPSHOTS
# =============================================================================


@router.get("/snapshots/{metric_type}", response_model=List[dict])
async def get_snapshots(
    metric_type: MetricType,
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Busca snapshots históricos de uma métrica

    **Métricas disponíveis:**
    - `daily_active_users`: Usuários ativos diários
    - `monthly_active_users`: Usuários ativos mensais
    - `mrr`: Monthly Recurring Revenue
    - `arr`: Annual Recurring Revenue
    - `total_conversations`: Total de conversas
    - `total_messages`: Total de mensagens
    - E outras (ver enum MetricType)

    **Exemplo de resposta:**
    ```json
    [
        {
            "id_snapshot": "...",
            "dt_snapshot": "2025-01-15",
            "nm_metric_type": "mrr",
            "nr_value": 15000.00
        }
    ]
    ```
    """
    try:
        snapshots = await analytics_service.get_snapshots(
            metric_type=metric_type, start_date=start_date, end_date=end_date
        )

        return [
            {
                "id_snapshot": str(snapshot.id_snapshot),
                "dt_snapshot": snapshot.dt_snapshot,
                "nm_metric_type": snapshot.nm_metric_type,
                "nr_value": float(snapshot.nr_value),
            }
            for snapshot in snapshots
        ]
    except Exception as e:
        logger.error(f"Erro ao buscar snapshots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar snapshots",
        ) from e


@router.post("/snapshots/daily", status_code=status.HTTP_201_CREATED)
async def create_daily_snapshots(
    snapshot_date: Optional[date] = Query(None, description="Data do snapshot"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Cria snapshots diários de todas as métricas

    **Uso:**
    - Endpoint para ser chamado por cronjob diário
    - Se não especificar data, usa a data de hoje
    - Cria snapshots para: usuários, receita, conversas, etc.

    **Exemplo:**
    ```
    POST /analytics/snapshots/daily?snapshot_date=2025-01-15
    ```
    """
    try:
        await analytics_service.create_daily_snapshots(snapshot_date=snapshot_date)
        return {
            "message": "Snapshots diários criados com sucesso",
            "snapshot_date": snapshot_date or date.today(),
        }
    except Exception as e:
        logger.error(f"Erro ao criar snapshots diários: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar snapshots diários",
        ) from e


# =============================================================================
# USER ANALYTICS
# =============================================================================


@router.get("/users", response_model=UserAnalytics)
async def get_user_analytics(
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna métricas de usuários

    **Métricas retornadas:**
    - `total_users`: Total de usuários cadastrados
    - `active_users`: Usuários ativos (últimos 30 dias)
    - `new_users`: Novos usuários no período
    - `churn_rate`: Taxa de churn (%)
    - `retention_rate`: Taxa de retenção (%)

    **Exemplo de resposta:**
    ```json
    {
        "total_users": 1500,
        "active_users": 850,
        "new_users": 120,
        "churn_rate": 15.5,
        "retention_rate": 84.5
    }
    ```
    """
    try:
        return await analytics_service.get_user_analytics(
            start_date=start_date, end_date=end_date
        )
    except Exception as e:
        logger.error(f"Erro ao buscar user analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar user analytics",
        ) from e


# =============================================================================
# CONVERSATION ANALYTICS
# =============================================================================


@router.get("/conversations", response_model=ConversationAnalytics)
async def get_conversation_analytics(
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna métricas de conversas

    **Métricas retornadas:**
    - `total_conversations`: Total de conversas
    - `active_conversations`: Conversas ativas (últimos 7 dias)
    - `total_messages`: Total de mensagens
    - `avg_messages_per_conversation`: Média de mensagens por conversa
    - `engagement_rate`: Taxa de engajamento (%)

    **Exemplo de resposta:**
    ```json
    {
        "total_conversations": 5000,
        "active_conversations": 1200,
        "total_messages": 45000,
        "avg_messages_per_conversation": 9.0,
        "engagement_rate": 24.0
    }
    ```
    """
    try:
        return await analytics_service.get_conversation_analytics(
            start_date=start_date, end_date=end_date
        )
    except Exception as e:
        logger.error(f"Erro ao buscar conversation analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar conversation analytics",
        ) from e


# =============================================================================
# REVENUE ANALYTICS
# =============================================================================


@router.get("/revenue", response_model=RevenueAnalytics)
async def get_revenue_analytics(
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna métricas de receita

    **Métricas retornadas:**
    - `mrr`: Monthly Recurring Revenue
    - `arr`: Annual Recurring Revenue
    - `paid_subscriptions`: Total de assinaturas pagas
    - `trial_subscriptions`: Total de assinaturas em trial
    - `arpu`: Average Revenue Per User
    - `ltv`: Lifetime Value

    **Exemplo de resposta:**
    ```json
    {
        "mrr": 15000.00,
        "arr": 180000.00,
        "paid_subscriptions": 150,
        "trial_subscriptions": 30,
        "arpu": 100.00,
        "ltv": 3600000.00
    }
    ```
    """
    try:
        return await analytics_service.get_revenue_analytics(
            start_date=start_date, end_date=end_date
        )
    except Exception as e:
        logger.error(f"Erro ao buscar revenue analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar revenue analytics",
        ) from e


# =============================================================================
# USAGE ANALYTICS
# =============================================================================


@router.get("/usage", response_model=UsageAnalytics)
async def get_usage_analytics(
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna métricas de uso da plataforma

    **Métricas retornadas:**
    - `total_api_calls`: Total de chamadas de API
    - `total_tokens`: Total de tokens processados
    - `total_storage_gb`: Total de storage usado (GB)
    - `avg_tokens_per_call`: Média de tokens por chamada
    - `estimated_cost`: Custo estimado em USD

    **Exemplo de resposta:**
    ```json
    {
        "total_api_calls": 50000,
        "total_tokens": 25000000,
        "total_storage_gb": 150.5,
        "avg_tokens_per_call": 500.0,
        "estimated_cost": 50.00
    }
    ```
    """
    try:
        return await analytics_service.get_usage_analytics(
            start_date=start_date, end_date=end_date
        )
    except Exception as e:
        logger.error(f"Erro ao buscar usage analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar usage analytics",
        ) from e


# =============================================================================
# TEMPLATE ANALYTICS
# =============================================================================


@router.get("/templates", response_model=TemplateAnalytics)
async def get_template_analytics(
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna métricas do marketplace de templates

    **Métricas retornadas:**
    - `total_templates`: Total de templates publicados
    - `total_installations`: Total de instalações
    - `total_reviews`: Total de reviews
    - `avg_rating`: Avaliação média
    - `top_templates`: Top 5 templates por instalações

    **Exemplo de resposta:**
    ```json
    {
        "total_templates": 50,
        "total_installations": 1200,
        "total_reviews": 350,
        "avg_rating": 4.35,
        "top_templates": [
            "Assistente de Vendas B2B",
            "Suporte Técnico 24/7",
            "Analista de Dados",
            "Assistente Jurídico",
            "RH Virtual"
        ]
    }
    ```
    """
    try:
        return await analytics_service.get_template_analytics(
            start_date=start_date, end_date=end_date
        )
    except Exception as e:
        logger.error(f"Erro ao buscar template analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar template analytics",
        ) from e


# =============================================================================
# DASHBOARD SUMMARY
# =============================================================================


@router.get("/dashboard", response_model=DashboardSummary)
async def get_dashboard_summary(
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna resumo completo do dashboard com todas as métricas

    **Retorna:**
    - Métricas de usuários (total, ativos, novos, churn, retenção)
    - Métricas de conversas (total, ativas, mensagens, engajamento)
    - Métricas de receita (MRR, ARR, assinaturas, ARPU, LTV)
    - Métricas de agentes (total de agentes)
    - Métricas de templates (total, instalações, reviews, rating)
    - Métricas de uso (API calls, tokens, storage, custo)

    **Uso recomendado:**
    - Endpoint principal para dashboard administrativo
    - Cachear resultado no frontend (TTL de 5-15 minutos)
    - Usar filtros de data para análise histórica

    **Exemplo de resposta:**
    ```json
    {
        "users": {
            "total_users": 1500,
            "active_users": 850,
            "new_users": 120,
            "churn_rate": 15.5,
            "retention_rate": 84.5
        },
        "conversations": {
            "total_conversations": 5000,
            "active_conversations": 1200,
            "total_messages": 45000,
            "avg_messages_per_conversation": 9.0,
            "engagement_rate": 24.0
        },
        "revenue": {
            "mrr": 15000.00,
            "arr": 180000.00,
            "paid_subscriptions": 150,
            "trial_subscriptions": 30,
            "arpu": 100.00,
            "ltv": 3600000.00
        },
        "agents": {
            "total_agents": 350
        },
        "templates": {
            "total_templates": 50,
            "total_installations": 1200,
            "total_reviews": 350,
            "avg_rating": 4.35,
            "top_templates": [...]
        },
        "usage": {
            "total_api_calls": 50000,
            "total_tokens": 25000000,
            "total_storage_gb": 150.5,
            "avg_tokens_per_call": 500.0,
            "estimated_cost": 50.00
        }
    }
    ```
    """
    try:
        return await analytics_service.get_dashboard_summary(
            start_date=start_date, end_date=end_date
        )
    except Exception as e:
        logger.error(f"Erro ao buscar dashboard summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar dashboard summary",
        ) from e


# =============================================================================
# HEALTH CHECK
# =============================================================================


@router.get("/health", status_code=status.HTTP_200_OK)
async def analytics_health():
    """
    Health check para o módulo de analytics

    **Retorna:**
    - Status: OK
    - Timestamp atual
    """
    return {
        "status": "OK",
        "module": "analytics",
        "timestamp": datetime.now().isoformat(),
    }
