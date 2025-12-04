"""
Schemas e Modelos para Busca Avançada
Separados para evitar importação circular entre routes e services
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# ENUMS
# ============================================================================


class DocumentType(str, Enum):
    """Tipos de documentos suportados"""

    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    MD = "md"
    HTML = "html"
    JSON = "json"
    CSV = "csv"
    XLSX = "xlsx"
    ALL = "all"


class SortBy(str, Enum):
    """Ordenação de resultados"""

    RELEVANCE = "relevance"
    DATE_DESC = "date_desc"
    DATE_ASC = "date_asc"
    NAME_ASC = "name_asc"
    NAME_DESC = "name_desc"


class ExportFormat(str, Enum):
    """Formatos de exportação"""

    JSON = "json"
    CSV = "csv"
    MARKDOWN = "markdown"
    TXT = "txt"


# ============================================================================
# REQUEST MODELS
# ============================================================================


class HybridSearchRequest(BaseModel):
    """Request para busca híbrida (keyword + vector)"""

    query: str = Field(..., description="Consulta de busca")
    limit: int = Field(10, ge=1, le=100, description="Número máximo de resultados")
    vector_weight: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="Peso da busca vetorial (0=só keyword, 1=só vector)",
    )
    threshold: float = Field(
        0.3, ge=0.0, le=1.0, description="Threshold mínimo de similaridade"
    )

    # Filtros avançados
    document_types: Optional[List[DocumentType]] = Field(
        None, description="Filtrar por tipos de documento"
    )
    date_from: Optional[datetime] = Field(None, description="Data inicial (upload)")
    date_to: Optional[datetime] = Field(None, description="Data final (upload)")
    tags: Optional[List[str]] = Field(None, description="Filtrar por tags")
    namespace: Optional[str] = Field(None, description="Filtrar por namespace")

    # Opções de ordenação
    sort_by: SortBy = Field(
        SortBy.RELEVANCE, description="Critério de ordenação dos resultados"
    )

    # Re-ranking
    enable_reranking: bool = Field(
        True, description="Ativar re-ranking por relevância contextual"
    )


# ============================================================================
# RESPONSE MODELS
# ============================================================================


class SearchResultAdvanced(BaseModel):
    """Resultado de busca avançada"""

    id: str
    content: str
    metadata: dict = {}
    score: float = Field(..., description="Score de relevância (0-1)")
    rank: int = Field(..., description="Posição no ranking")

    # Informações adicionais
    document_type: Optional[str] = None
    upload_date: Optional[datetime] = None
    tags: List[str] = []
    highlights: List[str] = Field(
        default_factory=list, description="Trechos destacados do conteúdo"
    )


class SearchResponseAdvanced(BaseModel):
    """Resposta de busca avançada"""

    results: List[SearchResultAdvanced]
    total_found: int
    query: str
    execution_time_ms: float
    filters_applied: dict = {}
