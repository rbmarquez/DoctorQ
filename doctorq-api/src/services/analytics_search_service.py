"""
Serviço de Analytics para Busca Avançada
Fase 4 - Analytics e Monitoramento
"""

import json
from datetime import datetime
from typing import Dict, List

from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.analytics_schemas import (
    SearchMetricsSummary,
    SearchTrend,
    TopDocument,
    TopQuery,
)

logger = get_logger(__name__)


class AnalyticsSearchService:
    """
    Serviço de Analytics para Busca

    Coleta e agrega métricas sobre:
    - Performance de buscas
    - Queries mais frequentes
    - Documentos mais acessados
    - Tendências temporais
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_search_summary(
        self, start_date: datetime, end_date: datetime
    ) -> SearchMetricsSummary:
        """
        Gera resumo de métricas de busca para período

        Calcula:
        - Total de buscas
        - Tempo médio/P95/P99
        - Taxa de sucesso
        - Média de resultados
        """
        try:
            # Query para buscar eventos de busca da tabela de analytics
            query = text(
                """
                SELECT
                    COUNT(*) as total_searches,
                    AVG(CAST(ds_event_data->>'execution_time_ms' AS FLOAT)) as avg_execution_time_ms,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(ds_event_data->>'execution_time_ms' AS FLOAT)) as p95_execution_time_ms,
                    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY CAST(ds_event_data->>'execution_time_ms' AS FLOAT)) as p99_execution_time_ms,
                    AVG(CAST(ds_event_data->>'total_results' AS FLOAT)) as avg_results,
                    SUM(CASE WHEN CAST(ds_event_data->>'success' AS BOOLEAN) = true THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as success_rate
                FROM tb_analytics_events
                WHERE nm_event_type = 'search_executed'
                AND dt_criacao BETWEEN :start_date AND :end_date
            """
            )

            result = await self.db.execute(
                query, {"start_date": start_date, "end_date": end_date}
            )
            row = result.fetchone()

            if row and row.total_searches > 0:
                return SearchMetricsSummary(
                    total_searches=row.total_searches or 0,
                    avg_execution_time_ms=row.avg_execution_time_ms or 0.0,
                    p95_execution_time_ms=row.p95_execution_time_ms or 0.0,
                    p99_execution_time_ms=row.p99_execution_time_ms or 0.0,
                    success_rate=row.success_rate or 0.0,
                    avg_results_per_search=row.avg_results or 0.0,
                    period_start=start_date,
                    period_end=end_date,
                )
            else:
                # Retornar métricas zeradas se não houver dados
                return SearchMetricsSummary(
                    total_searches=0,
                    avg_execution_time_ms=0.0,
                    p95_execution_time_ms=0.0,
                    p99_execution_time_ms=0.0,
                    success_rate=0.0,
                    avg_results_per_search=0.0,
                    period_start=start_date,
                    period_end=end_date,
                )

        except Exception as e:
            logger.error(f"Erro ao gerar summary: {str(e)}")
            # Retornar métricas zeradas em caso de erro
            return SearchMetricsSummary(
                total_searches=0,
                avg_execution_time_ms=0.0,
                p95_execution_time_ms=0.0,
                p99_execution_time_ms=0.0,
                success_rate=0.0,
                avg_results_per_search=0.0,
                period_start=start_date,
                period_end=end_date,
            )

    async def get_top_queries(
        self, start_date: datetime, end_date: datetime, limit: int
    ) -> List[TopQuery]:
        """
        Retorna as queries mais buscadas com suas estatísticas
        """
        try:
            query = text(
                """
                SELECT
                    ds_event_data->>'query' as query,
                    COUNT(*) as count,
                    AVG(CAST(ds_event_data->>'total_results' AS FLOAT)) as avg_results,
                    AVG(CAST(ds_event_data->>'execution_time_ms' AS FLOAT)) as avg_execution_time_ms,
                    MAX(dt_criacao) as last_searched
                FROM tb_analytics_events
                WHERE nm_event_type = 'search_executed'
                AND dt_criacao BETWEEN :start_date AND :end_date
                AND ds_event_data->>'query' IS NOT NULL
                GROUP BY ds_event_data->>'query'
                ORDER BY count DESC
                LIMIT :limit
            """
            )

            result = await self.db.execute(
                query,
                {"start_date": start_date, "end_date": end_date, "limit": limit},
            )

            top_queries = []
            for row in result.fetchall():
                top_queries.append(
                    TopQuery(
                        query=row.query or "",
                        count=row.count or 0,
                        avg_results=row.avg_results or 0.0,
                        avg_execution_time_ms=row.avg_execution_time_ms or 0.0,
                        last_searched=row.last_searched or datetime.now(),
                    )
                )

            return top_queries

        except Exception as e:
            logger.error(f"Erro ao buscar top queries: {str(e)}")
            return []

    async def get_top_documents(
        self, start_date: datetime, end_date: datetime, limit: int
    ) -> List[TopDocument]:
        """
        Retorna os documentos mais retornados em buscas
        """
        try:
            # Esta query precisa analisar os resultados de busca
            # Como não temos uma tabela específica, vamos usar uma estratégia alternativa
            # Buscar do metadata dos eventos de busca ou da tabela de embeddings

            query = text(
                """
                SELECT
                    ds_event_data->'results'->0->>'id' as document_id,
                    ds_event_data->'results'->0->>'filename' as filename,
                    ds_event_data->'results'->0->>'document_type' as document_type,
                    COUNT(*) as access_count,
                    AVG(CAST(ds_event_data->'results'->0->>'score' AS FLOAT)) as avg_score,
                    MAX(dt_criacao) as last_accessed
                FROM tb_analytics_events
                WHERE nm_event_type = 'search_executed'
                AND dt_criacao BETWEEN :start_date AND :end_date
                AND ds_event_data->'results'->0->>'id' IS NOT NULL
                GROUP BY document_id, filename, document_type
                ORDER BY access_count DESC
                LIMIT :limit
            """
            )

            result = await self.db.execute(
                query,
                {"start_date": start_date, "end_date": end_date, "limit": limit},
            )

            top_docs = []
            for row in result.fetchall():
                top_docs.append(
                    TopDocument(
                        document_id=row.document_id or "unknown",
                        filename=row.filename or "Unknown Document",
                        document_type=row.document_type or "unknown",
                        access_count=row.access_count or 0,
                        avg_score=row.avg_score or 0.0,
                        last_accessed=row.last_accessed or datetime.now(),
                    )
                )

            return top_docs

        except Exception as e:
            logger.error(f"Erro ao buscar top documentos: {str(e)}")
            return []

    async def get_search_trends(
        self, start_date: datetime, end_date: datetime
    ) -> List[SearchTrend]:
        """
        Retorna tendências de busca agregadas por dia
        """
        try:
            query = text(
                """
                SELECT
                    DATE(dt_criacao) as date,
                    COUNT(*) as total_searches,
                    SUM(CASE WHEN CAST(ds_event_data->>'success' AS BOOLEAN) = true THEN 1 ELSE 0 END) as successful_searches,
                    AVG(CAST(ds_event_data->>'execution_time_ms' AS FLOAT)) as avg_execution_time_ms
                FROM tb_analytics_events
                WHERE nm_event_type = 'search_executed'
                AND dt_criacao BETWEEN :start_date AND :end_date
                GROUP BY DATE(dt_criacao)
                ORDER BY date DESC
            """
            )

            result = await self.db.execute(
                query, {"start_date": start_date, "end_date": end_date}
            )

            trends = []
            for row in result.fetchall():
                trends.append(
                    SearchTrend(
                        date=row.date.strftime("%Y-%m-%d") if row.date else "",
                        total_searches=row.total_searches or 0,
                        successful_searches=row.successful_searches or 0,
                        avg_execution_time_ms=row.avg_execution_time_ms or 0.0,
                    )
                )

            return trends

        except Exception as e:
            logger.error(f"Erro ao buscar trends: {str(e)}")
            return []

    async def track_search(
        self,
        query: str,
        execution_time_ms: float,
        total_results: int,
        success: bool,
        filters_used: Dict,
    ):
        """
        Registra um evento de busca para análise futura
        """
        try:
            # Inserir evento na tabela de analytics
            insert_query = text(
                """
                INSERT INTO tb_analytics_events (
                    id_event,
                    nm_event_type,
                    ds_event_data,
                    dt_criacao
                ) VALUES (
                    gen_random_uuid(),
                    'search_executed',
                    :event_data::jsonb,
                    NOW()
                )
            """
            )

            event_data = json.dumps(
                {
                    "query": query,
                    "execution_time_ms": execution_time_ms,
                    "total_results": total_results,
                    "success": success,
                    "filters_used": filters_used,
                }
            )

            await self.db.execute(insert_query, {"event_data": event_data})
            await self.db.commit()

            logger.debug(f"Evento de busca rastreado: '{query[:50]}...'")

        except Exception as e:
            logger.error(f"Erro ao rastrear busca: {str(e)}")
            await self.db.rollback()

    async def get_no_result_queries(
        self, start_date: datetime, end_date: datetime, limit: int = 20
    ) -> List[dict]:
        """
        Busca queries que não retornaram resultados

        Útil para identificar lacunas no conteúdo e problemas de indexação
        """
        try:
            query = text("""
                SELECT
                    ds_query as query,
                    COUNT(*) as count,
                    MAX(dt_criacao) as last_search
                FROM tb_analytics_events
                WHERE
                    nm_event_type = 'search'
                    AND dt_criacao BETWEEN :start_date AND :end_date
                    AND (ds_event_data->>'total_results')::int = 0
                GROUP BY ds_query
                ORDER BY count DESC
                LIMIT :limit
            """)

            result = await self.db.execute(
                query,
                {
                    "start_date": start_date,
                    "end_date": end_date,
                    "limit": limit,
                },
            )

            rows = result.fetchall()

            return [
                {
                    "query": row.query,
                    "count": row.count,
                    "last_search": row.last_search,
                }
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Erro ao buscar queries sem resultados: {str(e)}")
            return []

    async def get_optimization_suggestions(
        self, start_date: datetime, end_date: datetime
    ) -> List[dict]:
        """
        Gera sugestões de otimização baseadas em padrões de busca

        Analisa:
        - Buscas sem resultados (missing content)
        - Possíveis typos (queries similares com/sem resultados)
        - Filtros muito restritivos
        """
        suggestions = []

        try:
            # 1. Buscas sem resultados (missing content)
            no_results_query = text("""
                SELECT
                    ds_query as query,
                    COUNT(*) as affected_searches
                FROM tb_analytics_events
                WHERE
                    nm_event_type = 'search'
                    AND dt_criacao BETWEEN :start_date AND :end_date
                    AND (ds_event_data->>'total_results')::int = 0
                GROUP BY ds_query
                HAVING COUNT(*) >= 5  -- Pelo menos 5 buscas
                ORDER BY affected_searches DESC
                LIMIT 10
            """)

            result = await self.db.execute(
                no_results_query,
                {"start_date": start_date, "end_date": end_date},
            )

            for row in result.fetchall():
                count = row.affected_searches

                # Determinar prioridade
                if count >= 50:
                    priority = "alta"
                elif count >= 10:
                    priority = "media"
                else:
                    priority = "baixa"

                suggestions.append({
                    "type": "missing_content",
                    "query": row.query,
                    "suggestion": f"Considere adicionar conteúdo sobre '{row.query}'. {count} usuários buscaram este termo sem encontrar resultados.",
                    "priority": priority,
                    "affected_searches": count,
                })

            # 2. Detectar possíveis typos (queries similares)
            # Buscar queries com poucos resultados vs queries com muitos resultados
            typo_query = text("""
                WITH search_stats AS (
                    SELECT
                        ds_query,
                        AVG((ds_event_data->>'total_results')::int) as avg_results,
                        COUNT(*) as search_count
                    FROM tb_analytics_events
                    WHERE
                        nm_event_type = 'search'
                        AND dt_criacao BETWEEN :start_date AND :end_date
                    GROUP BY ds_query
                )
                SELECT
                    ds_query as query,
                    search_count as affected_searches
                FROM search_stats
                WHERE avg_results = 0 AND search_count >= 3
                ORDER BY search_count DESC
                LIMIT 5
            """)

            result = await self.db.execute(
                typo_query,
                {"start_date": start_date, "end_date": end_date},
            )

            for row in result.fetchall():
                # Sugerir correções simples (remover acentos, etc)
                query_clean = row.query.lower().strip()

                suggestions.append({
                    "type": "typo",
                    "query": row.query,
                    "suggestion": f"Possível erro de digitação em '{row.query}'. Considere implementar correção automática ou sugestões de busca.",
                    "priority": "media",
                    "affected_searches": row.affected_searches,
                })

            # 3. Filtros muito restritivos
            # (Implementação simplificada - pode ser expandida)
            restrictive_query = text("""
                SELECT
                    ds_query as query,
                    COUNT(*) as affected_searches
                FROM tb_analytics_events
                WHERE
                    nm_event_type = 'search'
                    AND dt_criacao BETWEEN :start_date AND :end_date
                    AND (ds_event_data->>'total_results')::int = 0
                    AND jsonb_array_length(ds_event_data->'filters_used') > 2
                GROUP BY ds_query
                HAVING COUNT(*) >= 3
                LIMIT 5
            """)

            result = await self.db.execute(
                restrictive_query,
                {"start_date": start_date, "end_date": end_date},
            )

            for row in result.fetchall():
                suggestions.append({
                    "type": "filter_too_restrictive",
                    "query": row.query,
                    "suggestion": f"Busca '{row.query}' com múltiplos filtros não retorna resultados. Considere relaxar os filtros ou adicionar mais conteúdo.",
                    "priority": "baixa",
                    "affected_searches": row.affected_searches,
                })

            logger.info(f"{len(suggestions)} sugestões de otimização geradas")
            return suggestions

        except Exception as e:
            logger.error(f"Erro ao gerar sugestões de otimização: {str(e)}")
            return []


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================


async def get_analytics_search_service() -> AnalyticsSearchService:
    """Dependency para obter instância do serviço"""
    async with get_db() as db:
        yield AnalyticsSearchService(db)
