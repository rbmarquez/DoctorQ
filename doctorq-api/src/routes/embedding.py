from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.services.embedding_service import EmbeddingService, get_embedding_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/embedding", tags=["Embedding"])


class SemanticSearchRequest(BaseModel):
    """Request para busca semÃ¢ntica"""

    query: str = Field(..., description="Consulta para busca semÃ¢ntica")
    limit: int = Field(10, ge=1, le=100, description="NÃºmero mÃ¡ximo de resultados")
    threshold: float = Field(
        0.3, ge=0.0, le=1.0, description="Limite mÃ­nimo de similaridade"
    )
    namespace: Optional[str] = Field(None, description="Namespace para filtrar a busca")


class TextSearchRequest(BaseModel):
    """Request para busca textual"""

    query: str = Field(..., description="Consulta para busca textual")
    limit: int = Field(10, ge=1, le=100, description="NÃºmero mÃ¡ximo de resultados")
    namespace: Optional[str] = Field(None, description="Namespace para filtrar a busca")


class SearchResult(BaseModel):
    """Resultado de busca"""

    id: str
    content: str
    metadata: dict = {}


class SearchResponse(BaseModel):
    """Resposta de busca"""

    results: List[SearchResult]
    total_found: int


@router.post("/search/semantic", response_model=SearchResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    _: object = Depends(get_current_apikey),
):
    """
    Busca semÃ¢ntica usando embeddings vetoriais

    Esta rota permite buscar documentos usando similaridade semÃ¢ntica baseada em embeddings.
    A busca pode ser filtrada por namespace para limitar os resultados a um contexto especÃ­fico.
    """
    from src.config.orm_config import get_db

    async with get_db() as db:
        try:
            logger.debug(f"Iniciando busca semÃ¢ntica: '{request.query[:50]}...'")

            # Obter serviÃ§o de embedding
            embedding_service = EmbeddingService(db)

            # Executar busca semÃ¢ntica
            results = await embedding_service.semantic_search(
                query=request.query,
                limit=request.limit,
                threshold=request.threshold,
                namespace=request.namespace,
            )

            # Converter resultados para formato da resposta
            search_results = []
            for result in results:
                search_result = SearchResult(
                    id=str(result.id),
                    content=result.content,
                    metadata=result.metadata or {},
                )
                search_results.append(search_result)

            response = SearchResponse(
                results=search_results,
                total_found=len(search_results),
            )

            logger.debug(
                f"Busca semÃ¢ntica concluÃ­da: {len(search_results)} resultados encontrados"
            )
            return response

        except Exception as e:
            logger.error(f"Erro na busca semÃ¢ntica: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro interno na busca semÃ¢ntica: {str(e)}"
            )


@router.post("/search/text", response_model=SearchResponse)
async def text_search_post(
    request: TextSearchRequest,
    _: object = Depends(get_current_apikey),
):
    """
    Busca textual usando correspondÃªncia de texto

    Esta rota permite buscar documentos usando busca textual tradicional.
    A busca pode ser filtrada por namespace para limitar os resultados a um contexto especÃ­fico.
    """
    from src.config.orm_config import get_db

    async with get_db() as db:
        try:
            logger.debug(f"Iniciando busca textual: '{request.query[:50]}...'")

            # Obter serviÃ§o de embedding
            embedding_service = EmbeddingService(db)

            # Executar busca textual
            results = await embedding_service.text_search(
                query=request.query, limit=request.limit, namespace=request.namespace
            )

            # Converter resultados para formato da resposta
            search_results = []
            for result in results:
                search_result = SearchResult(
                    id=str(result.id),
                    content=result.content,
                    metadata=result.metadata or {},
                )
                search_results.append(search_result)

            response = SearchResponse(
                results=search_results,
                total_found=len(search_results),
            )

            logger.debug(
                f"Busca textual concluÃ­da: {len(search_results)} resultados encontrados"
            )
            return response

        except Exception as e:
            logger.error(f"Erro na busca textual: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro interno na busca textual: {str(e)}"
            ) from e


@router.get("/search/semantic", response_model=SearchResponse)
async def semantic_search_get(
    query: str = Query(..., description="Consulta para busca semÃ¢ntica"),
    limit: int = Query(10, ge=1, le=100, description="NÃºmero mÃ¡ximo de resultados"),
    threshold: float = Query(
        0.3, ge=0.0, le=1.0, description="Limite mÃ­nimo de similaridade"
    ),
    namespace: Optional[str] = Query(
        None, description="Namespace para filtrar a busca"
    ),
    _: object = Depends(get_current_apikey),
):
    """
    Busca semÃ¢ntica usando embeddings vetoriais (via GET)

    VersÃ£o GET da busca semÃ¢ntica para facilitar testes e integraÃ§Ãµes simples.
    """
    request = SemanticSearchRequest(
        query=query, limit=limit, threshold=threshold, namespace=namespace
    )
    return await semantic_search(request)


@router.get("/search/text", response_model=SearchResponse)
async def text_search_get(
    query: str = Query(..., description="Consulta para busca textual"),
    limit: int = Query(10, ge=1, le=100, description="NÃºmero mÃ¡ximo de resultados"),
    namespace: Optional[str] = Query(
        None, description="Namespace para filtrar a busca"
    ),
    _: object = Depends(get_current_apikey),
):
    """
    Busca textual usando correspondÃªncia de texto (via GET)

    VersÃ£o GET da busca textual para facilitar testes e integraÃ§Ãµes simples.
    """
    request = TextSearchRequest(query=query, limit=limit, namespace=namespace)
    return await text_search_post(request)


@router.get("/search/metadata-sei", response_model=SearchResponse)
async def search_by_metadata_get_sei(
    limit: int = Query(10, ge=1, le=100, description="NÃºmero mÃ¡ximo de resultados"),
    # Filtros especÃ­ficos do SEI
    id_unidade: Optional[str] = Query(None, description="ID da unidade no SEI"),
    id_procedimento: Optional[str] = Query(
        None, description="ID do procedimento no SEI"
    ),
    id_documento: Optional[str] = Query(None, description="ID do documento no SEI"),
    numero_documento: Optional[str] = Query(None, description="NÃºmero do documento"),
    protocolo: Optional[str] = Query(
        None, description="Protocolo formatado do procedimento"
    ),
    protocolo_formatado_procedimento: Optional[str] = Query(
        None, description="Protocolo formatado completo"
    ),
    sigla_unidade_geradora: Optional[str] = Query(
        None, description="Sigla da unidade geradora"
    ),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Busca documentos por metadata (via GET)

    Suporte para filtros especÃ­ficos do SEI e filtros genÃ©ricos por metadata.
    Permite filtrar por campos como id_unidade, id_procedimento, id_documento, etc.
    """
    try:
        documents = await embedding_service.search_by_metadata_sei(
            metadata_filter=None,  # NÃ£o usa filtros genÃ©ricos neste endpoint
            limit=limit,
            # Filtros especÃ­ficos do SEI
            id_unidade=id_unidade,
            id_procedimento=id_procedimento,
            id_documento=id_documento,
            numero_documento=numero_documento,
            protocolo=protocolo,
            protocolo_formatado_procedimento=protocolo_formatado_procedimento,
            sigla_unidade_geradora=sigla_unidade_geradora,
        )

        search_results = []
        for doc in documents:
            search_result = SearchResult(id=str(doc.id), content=doc.content)
            search_results.append(search_result)

        response = SearchResponse(
            results=search_results, total_found=len(search_results)
        )

        return response

    except Exception as e:
        logger.error(f"Erro na busca por metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/namespaces")
async def list_namespaces(
    _: object = Depends(get_current_apikey),
):
    """
    Lista todos os namespaces disponÃ­veis

    Retorna uma lista dos namespaces que contÃªm documentos indexados.
    """
    from src.config.orm_config import get_db

    async with get_db() as db:
        try:
            logger.debug("Listando namespaces disponÃ­veis")

            # Obter serviÃ§o de embedding
            embedding_service = EmbeddingService(db)

            # Listar namespaces
            namespaces = await embedding_service.list_namespaces()

            logger.debug(f"Encontrados {len(namespaces)} namespaces")
            return {"namespaces": namespaces, "total": len(namespaces)}

        except Exception as e:
            logger.error(f"Erro ao listar namespaces: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro interno ao listar namespaces: {str(e)}"
            )


@router.get("/stats")
async def embedding_stats(
    _: object = Depends(get_current_apikey),
):
    """
    EstatÃ­sticas dos embeddings

    Retorna estatÃ­sticas sobre os embeddings armazenados, incluindo contagem por namespace.
    """
    from src.config.orm_config import get_db

    async with get_db() as db:
        try:
            logger.debug("Obtendo estatÃ­sticas dos embeddings")

            # Obter serviÃ§o de embedding
            embedding_service = EmbeddingService(db)

            # Obter estatÃ­sticas
            stats = await embedding_service.get_stats()

            logger.debug("EstatÃ­sticas obtidas com sucesso")
            return stats

        except Exception as e:
            logger.error(f"Erro ao obter estatÃ­sticas: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro interno ao obter estatÃ­sticas: {str(e)}"
            )
