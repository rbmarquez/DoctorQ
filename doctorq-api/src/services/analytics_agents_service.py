"""
Serviço de Analytics para Agentes
Fase 4 - Analytics e Monitoramento
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
# REMOVIDO: from src.models.agent_analytics_schemas import (
    AgentDocumentStoreUsage,
    AgentMetrics,
    AgentPerformanceComparison,
    TokenUsageByAgent,
)

logger = get_logger(__name__)


class AnalyticsAgentsService:
    """
    Serviço de Analytics para Agentes

    Coleta e agrega métricas sobre:
    - Performance de agentes
    - Uso de document stores
    - Consumo de tokens
    - Comparação entre agentes
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_agents_summary(
        self, start_date: datetime, end_date: datetime, limit: int
    ) -> List[AgentMetrics]:
        """
        Retorna resumo de métricas de todos os agentes
        """
        try:
            query = text(
                """
                SELECT
                    a.id_agente,
                    a.nm_agente,
                    COUNT(DISTINCT c.id_conversa) as total_conversations,
                    COUNT(m.id_message) as total_messages,
                    AVG(
                        CASE
                            WHEN m.ds_metadata->>'response_time_ms' IS NOT NULL
                            THEN CAST(m.ds_metadata->>'response_time_ms' AS FLOAT)
                            ELSE NULL
                        END
                    ) as avg_response_time_ms,
                    COUNT(m.id_message)::FLOAT / NULLIF(COUNT(DISTINCT c.id_conversa), 0) as success_rate,
                    COALESCE(SUM(CAST(m.ds_metadata->>'total_tokens' AS INT)), 0) as total_tokens,
                    COALESCE(SUM(CAST(m.ds_metadata->>'cost' AS FLOAT)), 0.0) as total_cost,
                    MAX(c.dt_criacao) as last_used
                FROM tb_agentes a
                LEFT JOIN tb_conversas c ON c.id_agente = a.id_agente
                    AND c.dt_criacao BETWEEN :start_date AND :end_date
                LEFT JOIN tb_messages m ON m.id_conversa = c.id_conversa
                    AND m.ds_role = 'assistant'
                GROUP BY a.id_agente, a.nm_agente
                HAVING COUNT(m.id_message) > 0
                ORDER BY total_conversations DESC
                LIMIT :limit
            """
            )

            result = await self.db.execute(
                query,
                {"start_date": start_date, "end_date": end_date, "limit": limit},
            )

            metrics = []
            for row in result.fetchall():
                metrics.append(
                    AgentMetrics(
                        id_agente=str(row.id_agente),
                        nm_agente=row.nm_agente or "Unknown Agent",
                        total_conversations=row.total_conversations or 0,
                        total_messages=row.total_messages or 0,
                        avg_response_time_ms=row.avg_response_time_ms or 0.0,
                        success_rate=min(row.success_rate or 0.0, 1.0),
                        total_tokens=row.total_tokens or 0,
                        total_cost=row.total_cost or 0.0,
                        last_used=row.last_used,
                    )
                )

            return metrics

        except Exception as e:
            logger.error(f"Erro ao buscar summary de agentes: {str(e)}")
            return []

    async def get_document_store_usage(
        self, start_date: datetime, end_date: datetime, agent_id: Optional[UUID] = None
    ) -> List[AgentDocumentStoreUsage]:
        """
        Retorna uso de document stores por agentes
        """
        try:
            # Query adaptada - assumindo que temos uma relação entre agentes e document stores
            base_query = """
                SELECT
                    a.id_agente,
                    a.nm_agente,
                    ds.id_documento_store as id_document_store,
                    ds.nm_documento_store as nm_document_store,
                    COUNT(*) as usage_count,
                    AVG(
                        CASE
                            WHEN e.ds_event_data->>'total_results' IS NOT NULL
                            THEN CAST(e.ds_event_data->>'total_results' AS FLOAT)
                            ELSE 0
                        END
                    ) as avg_results_per_query,
                    MAX(e.dt_criacao) as last_used
                FROM tb_agentes a
                JOIN tb_agente_document_store ads ON ads.id_agente = a.id_agente
                JOIN tb_documento_store ds ON ds.id_documento_store = ads.id_documento_store
                LEFT JOIN tb_analytics_events e ON e.nm_event_type = 'document_store_query'
                    AND e.ds_event_data->>'id_agente' = a.id_agente::text
                    AND e.dt_criacao BETWEEN :start_date AND :end_date
            """

            if agent_id:
                base_query += " WHERE a.id_agente = :agent_id"

            base_query += """
                GROUP BY a.id_agente, a.nm_agente, ds.id_documento_store, ds.nm_documento_store
                ORDER BY usage_count DESC
                LIMIT 50
            """

            params = {"start_date": start_date, "end_date": end_date}
            if agent_id:
                params["agent_id"] = str(agent_id)

            result = await self.db.execute(text(base_query), params)

            usage_list = []
            for row in result.fetchall():
                usage_list.append(
                    AgentDocumentStoreUsage(
                        id_agente=str(row.id_agente),
                        nm_agente=row.nm_agente or "Unknown Agent",
                        id_document_store=str(row.id_document_store),
                        nm_document_store=row.nm_document_store or "Unknown Store",
                        usage_count=row.usage_count or 0,
                        avg_results_per_query=row.avg_results_per_query or 0.0,
                        last_used=row.last_used,
                    )
                )

            return usage_list

        except Exception as e:
            logger.error(f"Erro ao buscar uso de document stores: {str(e)}")
            return []

    async def get_performance_comparison(
        self, start_date: datetime, end_date: datetime
    ) -> AgentPerformanceComparison:
        """
        Compara performance entre agentes
        """
        try:
            # Buscar métricas de todos os agentes
            metrics = await self.get_agents_summary(start_date, end_date, limit=100)

            if not metrics:
                return AgentPerformanceComparison(
                    ranking=[],
                    best_agent=None,
                    worst_agent=None,
                    period_start=start_date,
                    period_end=end_date,
                )

            # Ordenar por múltiplos critérios (success_rate primeiro, depois total_conversations)
            sorted_metrics = sorted(
                metrics,
                key=lambda x: (x.success_rate, x.total_conversations),
                reverse=True,
            )

            return AgentPerformanceComparison(
                ranking=sorted_metrics,
                best_agent=sorted_metrics[0] if sorted_metrics else None,
                worst_agent=sorted_metrics[-1] if sorted_metrics else None,
                period_start=start_date,
                period_end=end_date,
            )

        except Exception as e:
            logger.error(f"Erro ao comparar performance: {str(e)}")
            return AgentPerformanceComparison(
                ranking=[],
                best_agent=None,
                worst_agent=None,
                period_start=start_date,
                period_end=end_date,
            )

    async def get_token_usage(
        self, start_date: datetime, end_date: datetime
    ) -> List[TokenUsageByAgent]:
        """
        Retorna uso de tokens por agente
        """
        try:
            query = text(
                """
                WITH agent_tokens AS (
                    SELECT
                        a.id_agente,
                        a.nm_agente,
                        COALESCE(SUM(CAST(m.ds_metadata->>'total_tokens' AS INT)), 0) as total_tokens,
                        COALESCE(SUM(CAST(m.ds_metadata->>'prompt_tokens' AS INT)), 0) as prompt_tokens,
                        COALESCE(SUM(CAST(m.ds_metadata->>'completion_tokens' AS INT)), 0) as completion_tokens,
                        COALESCE(SUM(CAST(m.ds_metadata->>'cost' AS FLOAT)), 0.0) as estimated_cost
                    FROM tb_agentes a
                    LEFT JOIN tb_conversas c ON c.id_agente = a.id_agente
                        AND c.dt_criacao BETWEEN :start_date AND :end_date
                    LEFT JOIN tb_messages m ON m.id_conversa = c.id_conversa
                        AND m.ds_role = 'assistant'
                    GROUP BY a.id_agente, a.nm_agente
                ),
                total_tokens_sum AS (
                    SELECT SUM(total_tokens) as sum_tokens
                    FROM agent_tokens
                )
                SELECT
                    at.id_agente,
                    at.nm_agente,
                    at.total_tokens,
                    at.prompt_tokens,
                    at.completion_tokens,
                    at.estimated_cost,
                    CASE
                        WHEN tts.sum_tokens > 0 THEN (at.total_tokens::FLOAT / tts.sum_tokens) * 100
                        ELSE 0
                    END as percentage_of_total
                FROM agent_tokens at
                CROSS JOIN total_tokens_sum tts
                WHERE at.total_tokens > 0
                ORDER BY at.total_tokens DESC
                LIMIT 50
            """
            )

            result = await self.db.execute(
                query, {"start_date": start_date, "end_date": end_date}
            )

            token_usage = []
            for row in result.fetchall():
                token_usage.append(
                    TokenUsageByAgent(
                        id_agente=str(row.id_agente),
                        nm_agente=row.nm_agente or "Unknown Agent",
                        total_tokens=row.total_tokens or 0,
                        prompt_tokens=row.prompt_tokens or 0,
                        completion_tokens=row.completion_tokens or 0,
                        estimated_cost=row.estimated_cost or 0.0,
                        percentage_of_total=row.percentage_of_total or 0.0,
                    )
                )

            return token_usage

        except Exception as e:
            logger.error(f"Erro ao buscar uso de tokens: {str(e)}")
            return []

    async def get_agent_details(
        self, agent_id: str, start_date: datetime, end_date: datetime
    ) -> Optional[AgentMetrics]:
        """
        Retorna detalhes de um agente específico
        """
        try:
            query = text(
                """
                SELECT
                    a.id_agente,
                    a.nm_agente,
                    COUNT(DISTINCT c.id_conversa) as total_conversations,
                    COUNT(m.id_message) as total_messages,
                    AVG(
                        CASE
                            WHEN m.ds_metadata->>'response_time_ms' IS NOT NULL
                            THEN CAST(m.ds_metadata->>'response_time_ms' AS FLOAT)
                            ELSE NULL
                        END
                    ) as avg_response_time_ms,
                    COUNT(m.id_message)::FLOAT / NULLIF(COUNT(DISTINCT c.id_conversa), 0) as success_rate,
                    COALESCE(SUM(CAST(m.ds_metadata->>'total_tokens' AS INT)), 0) as total_tokens,
                    COALESCE(SUM(CAST(m.ds_metadata->>'cost' AS FLOAT)), 0.0) as total_cost,
                    MAX(c.dt_criacao) as last_used
                FROM tb_agentes a
                LEFT JOIN tb_conversas c ON c.id_agente = a.id_agente
                    AND c.dt_criacao BETWEEN :start_date AND :end_date
                LEFT JOIN tb_messages m ON m.id_conversa = c.id_conversa
                    AND m.ds_role = 'assistant'
                WHERE a.id_agente = :agent_id
                GROUP BY a.id_agente, a.nm_agente
            """
            )

            result = await self.db.execute(
                query,
                {
                    "agent_id": agent_id,
                    "start_date": start_date,
                    "end_date": end_date,
                },
            )

            row = result.fetchone()

            if row:
                return AgentMetrics(
                    id_agente=str(row.id_agente),
                    nm_agente=row.nm_agente or "Unknown Agent",
                    total_conversations=row.total_conversations or 0,
                    total_messages=row.total_messages or 0,
                    avg_response_time_ms=row.avg_response_time_ms or 0.0,
                    success_rate=min(row.success_rate or 0.0, 1.0),
                    total_tokens=row.total_tokens or 0,
                    total_cost=row.total_cost or 0.0,
                    last_used=row.last_used,
                )

            return None

        except Exception as e:
            logger.error(f"Erro ao buscar detalhes do agente: {str(e)}")
            return None


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================


async def get_analytics_agents_service() -> AnalyticsAgentsService:
    """Dependency para obter instância do serviço"""
    async with get_db() as db:
        yield AnalyticsAgentsService(db)
