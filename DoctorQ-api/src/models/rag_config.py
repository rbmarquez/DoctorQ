# src/models/rag_config.py
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RAGQueryRequest(BaseModel):
    """Schema para requisiÃ§Ã£o de consulta RAG"""

    query: str = Field(..., description="Pergunta ou consulta do usuÃ¡rio", min_length=1)
    max_results: int = Field(
        5, description="NÃºmero mÃ¡ximo de documentos a retornar", ge=1, le=20
    )
    similarity_threshold: float = Field(
        0.3, description="Limite mÃ­nimo de similaridade", ge=0.0, le=1.0
    )
    documento_store_ids: Optional[List[str]] = Field(
        None, description="IDs especÃ­ficos de document stores para buscar"
    )
    include_metadata: bool = Field(
        True, description="Incluir metadados dos documentos na resposta"
    )
    namespace: Optional[str] = Field(
        None, description="Namespace especÃ­fico para busca"
    )
    # Novos campos para filtros SEI
    filter_source: Optional[str] = Field(
        None, description="Fonte especÃ­fica para filtrar (ex: 'sei', 'faq')"
    )
    sei_metadata_filters: Optional[Dict[str, Any]] = Field(
        None,
        description="Filtros especÃ­ficos por metadados SEI (idProcesso, idUnidade, idDocumento)",
    )
    user_unidades: Optional[List[str]] = Field(
        None, description="Lista de IDs das unidades que o usuÃ¡rio tem acesso"
    )


class RAGDocumentResult(BaseModel):
    """Schema para resultado de documento encontrado"""

    id: UUID = Field(..., description="ID Ãºnico do documento")
    content: str = Field(..., description="ConteÃºdo do documento")
    similarity: float = Field(..., description="Score de similaridade com a consulta")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Metadados do documento"
    )
    source: Optional[str] = Field(None, description="Fonte/origem do documento")
    created_at: Optional[datetime] = Field(
        None, description="Data de criaÃ§Ã£o do documento"
    )


class RAGQueryResponse(BaseModel):
    """Schema para resposta de consulta RAG"""

    query: str = Field(..., description="Consulta original")
    documents: List[RAGDocumentResult] = Field(
        ..., description="Documentos encontrados"
    )
    total_found: int = Field(..., description="Total de documentos encontrados")
    context: str = Field(..., description="Contexto formatado para o LLM")
    search_metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Metadados da busca"
    )


class RAGConfiguration(BaseModel):
    """Schema para configuraÃ§Ã£o da tool RAG"""

    name: str = Field(..., description="Nome da configuraÃ§Ã£o RAG")
    description: str = Field(..., description="DescriÃ§Ã£o da configuraÃ§Ã£o")
    default_max_results: int = Field(
        5, description="NÃºmero padrÃ£o de resultados", ge=1, le=20
    )
    default_similarity_threshold: float = Field(
        0.7, description="Threshold padrÃ£o de similaridade", ge=0.0, le=1.0
    )
    document_stores: List[str] = Field(
        default_factory=list, description="IDs dos document stores permitidos"
    )
    namespaces: List[str] = Field(
        default_factory=list, description="Namespaces permitidos para busca"
    )
    search_algorithm: str = Field(
        "cosine_similarity",
        description="Algoritmo de busca: cosine_similarity, euclidean_distance, dot_product",
    )
    vector_distance_metric: str = Field(
        "cosine", description="MÃ©trica de distÃ¢ncia: cosine, euclidean, dot_product"
    )
    context_template: str = Field(
        "Contexto baseado nos documentos encontrados:\n\n{documents}\n\nBaseado no contexto acima, responda:",
        description="Template para formataÃ§Ã£o do contexto",
    )
    # ConfiguraÃ§Ãµes especÃ­ficas para SEI
    enable_sei_filtering: bool = Field(
        False, description="Habilitar filtros especÃ­ficos para documentos SEI"
    )
    sei_default_fields: List[str] = Field(
        default_factory=lambda: ["idProcesso", "idUnidade", "idDocumento"],
        description="Campos padrÃ£o para filtros SEI",
    )


class RAGToolConfig(BaseModel):
    """Schema especÃ­fico para configuraÃ§Ã£o da tool RAG no banco de dados"""

    rag_config: RAGConfiguration = Field(..., description="ConfiguraÃ§Ã£o RAG")
    embedding_credential_id: Optional[str] = Field(
        None,
        description="ID da credencial Azure OpenAI para embeddings (serÃ¡ buscado da variÃ¡vel AZURE_OPENIA_EMBEDDINGS_CREDENCIAL_ID)",
    )
