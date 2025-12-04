"""
Schemas e Modelos para Analytics de Busca
Separados para evitar importação circular entre routes e services
"""

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


# ============================================================================
# METRICS MODELS
# ============================================================================


class SearchMetricsSummary(BaseModel):
    """Resumo de métricas de busca"""

    total_searches: int = Field(..., description="Total de buscas realizadas")
    avg_execution_time_ms: float = Field(
        ..., description="Tempo médio de execução (ms)"
    )
    p95_execution_time_ms: float = Field(..., description="Percentil 95 de execução")
    p99_execution_time_ms: float = Field(..., description="Percentil 99 de execução")
    success_rate: float = Field(..., description="Taxa de sucesso (0-1)")
    avg_results_per_search: float = Field(..., description="Média de resultados")
    period_start: datetime
    period_end: datetime


class TopQuery(BaseModel):
    """Query mais buscada"""

    query: str
    count: int
    avg_results: float
    avg_execution_time_ms: float
    last_searched: datetime


class TopDocument(BaseModel):
    """Documento mais acessado"""

    document_id: str
    filename: str
    document_type: str
    access_count: int
    avg_score: float
    last_accessed: datetime


class SearchTrend(BaseModel):
    """Tendência de buscas por período"""

    date: str  # YYYY-MM-DD
    total_searches: int
    successful_searches: int
    avg_execution_time_ms: float


class SearchAnalyticsResponse(BaseModel):
    """Resposta completa de analytics de busca"""

    summary: SearchMetricsSummary
    top_queries: List[TopQuery]
    top_documents: List[TopDocument]
    trends: List[SearchTrend]
