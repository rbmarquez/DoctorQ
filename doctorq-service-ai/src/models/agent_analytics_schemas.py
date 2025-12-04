"""
Schemas e Modelos para Analytics de Agentes
Separados para evitar importação circular entre routes e services
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# AGENT METRICS MODELS
# ============================================================================


class AgentMetrics(BaseModel):
    """Métricas de um agente"""

    id_agente: str
    nm_agente: str
    total_conversations: int
    total_messages: int
    avg_response_time_ms: float
    success_rate: float
    total_tokens: int
    total_cost: float
    last_used: Optional[datetime]


class AgentDocumentStoreUsage(BaseModel):
    """Uso de document stores por agente"""

    id_agente: str
    nm_agente: str
    id_document_store: str
    nm_document_store: str
    usage_count: int
    avg_results_per_query: float
    last_used: Optional[datetime]


class AgentPerformanceComparison(BaseModel):
    """Comparação de performance entre agentes"""

    ranking: List[AgentMetrics]
    best_agent: Optional[AgentMetrics]
    worst_agent: Optional[AgentMetrics]
    period_start: datetime
    period_end: datetime


class TokenUsageByAgent(BaseModel):
    """Uso de tokens por agente"""

    id_agente: str
    nm_agente: str
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    estimated_cost: float
    percentage_of_total: float
