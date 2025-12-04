"""
Rotas para gerenciamento de Document Stores (RAG)
Permite criar, listar, atualizar e deletar stores de documentos para RAG
"""
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from src.config.logger_config import get_logger
from src.models.documento_store import (
    DocumentoStoreCreate,
    DocumentoStoreUpdate,
    DocumentoStoreResponse,
    DocumentoStoreListResponse,
)
from src.services.documento_store_service import (
    DocumentoStoreService,
    get_documento_store_service,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(
    prefix="/document-stores",
    tags=["Document Stores"],
    responses={404: {"description": "Document Store não encontrado"}},
)


@router.get("/")
async def list_document_stores(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Tamanho da página"),
    search: Optional[str] = Query(None, description="Buscar por nome ou descrição"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    order_by: str = Query("dt_criacao", description="Campo para ordenação"),
    order_desc: bool = Query(True, description="Ordenação decrescente"),
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
) -> DocumentoStoreListResponse:
    """Recupera todos os document stores com paginação e filtros"""
    try:
        documento_stores, total = await service.list_documento_stores(
            page=page,
            size=size,
            search=search,
            status_filter=status,
            order_by=order_by,
            order_desc=order_desc,
        )

        response = DocumentoStoreListResponse.create_response(
            documento_stores=documento_stores, total=total, page=page, size=size
        )

        return response

    except Exception as e:
        logger.error(f"Erro ao listar document stores: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{document_store_id}")
async def get_document_store(
    document_store_id: uuid.UUID,
    include_chunks: bool = Query(False, description="Incluir chunks de documentos"),
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
) -> DocumentoStoreResponse:
    """Recupera detalhes de um document store específico"""
    try:
        document_store = await service.get_documento_store_by_id(
            document_store_id, include_chunks=include_chunks
        )

        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        return DocumentoStoreResponse.model_validate(document_store)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar document store: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/", status_code=201)
async def create_document_store(
    document_store_data: DocumentoStoreCreate,
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
) -> DocumentoStoreResponse:
    """Cria um novo document store"""
    try:
        document_store = await service.create_documento_store(document_store_data)
        return DocumentoStoreResponse.model_validate(document_store)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar document store: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{document_store_id}")
async def update_document_store(
    document_store_id: uuid.UUID,
    document_store_update: DocumentoStoreUpdate,
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
) -> DocumentoStoreResponse:
    """Atualiza um document store existente"""
    try:
        # Garantir que o ID no body corresponde ao ID da URL
        document_store_update.id_documento_store = document_store_id

        document_store = await service.update_documento_store(document_store_update)

        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        return DocumentoStoreResponse.model_validate(document_store)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar document store: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{document_store_id}", status_code=204)
async def delete_document_store(
    document_store_id: uuid.UUID,
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
):
    """Deleta um document store"""
    try:
        deleted = await service.delete_documento_store(document_store_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar document store: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{document_store_id}/upload")
async def upload_document(
    document_store_id: uuid.UUID,
    file: UploadFile = File(...),
    chunk_size: int = Form(1000, description="Tamanho dos chunks em caracteres"),
    chunk_overlap: int = Form(200, description="Sobreposição entre chunks"),
    generate_embeddings: bool = Form(True, description="Gerar embeddings automaticamente (usa credencial azureOpenIaEmbbedApi)"),
    embedding_credential_id: Optional[str] = Form(None, description="ID da credencial para embeddings (opcional - se não informado, usa azureOpenIaEmbbedApi)"),
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
):
    """
    Faz upload de um arquivo para o document store e processa para RAG

    Suporta: PDF, DOCX, TXT, MD, HTML, CSV

    Parâmetros:
    - file: Arquivo a ser processado
    - chunk_size: Tamanho de cada chunk (padrão: 1000 caracteres)
    - chunk_overlap: Sobreposição entre chunks (padrão: 200 caracteres)
    - generate_embeddings: Se True, gera embeddings automaticamente
    - embedding_credential_id: ID da credencial Azure/OpenAI para embeddings (obrigatório se generate_embeddings=True)
    """
    try:
        # Verificar se o document store existe
        document_store = await service.get_documento_store_by_id(document_store_id)
        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        # Processar o upload (credencial de embeddings é buscada automaticamente se não informada)
        result = await service.process_document_upload(
            document_store_id=document_store_id,
            file=file,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            generate_embeddings=generate_embeddings,
            embedding_credential_id=embedding_credential_id,
        )

        return {
            "message": "Documento processado com sucesso",
            "document_store_id": str(document_store_id),
            "file_name": file.filename,
            "chunks_created": result.get("chunks_created", 0),
            "embeddings_created": result.get("embeddings_created", 0),
            "status": "completed",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer upload de documento: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar documento: {str(e)}",
        ) from e


@router.post("/{document_store_id}/upload-bulk")
async def upload_multiple_documents(
    document_store_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    chunk_size: int = Form(1000, description="Tamanho dos chunks em caracteres"),
    chunk_overlap: int = Form(200, description="Sobreposição entre chunks"),
    generate_embeddings: bool = Form(True, description="Gerar embeddings automaticamente (usa credencial azureOpenIaEmbbedApi)"),
    embedding_credential_id: Optional[str] = Form(None, description="ID da credencial para embeddings (opcional - se não informado, usa azureOpenIaEmbbedApi)"),
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
):
    """
    Faz upload de múltiplos arquivos para o document store e processa para RAG

    Suporta: PDF, DOCX, TXT, MD, HTML, CSV

    Parâmetros:
    - files: Lista de arquivos a serem processados
    - chunk_size: Tamanho de cada chunk (padrão: 1000 caracteres)
    - chunk_overlap: Sobreposição entre chunks (padrão: 200 caracteres)
    - generate_embeddings: Se True, gera embeddings automaticamente
    - embedding_credential_id: ID da credencial Azure/OpenAI para embeddings (obrigatório se generate_embeddings=True)
    """
    try:
        # Verificar se o document store existe
        document_store = await service.get_documento_store_by_id(document_store_id)
        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        # Validar quantidade de arquivos
        if len(files) == 0:
            raise HTTPException(status_code=400, detail="Nenhum arquivo foi enviado")

        if len(files) > 100:
            raise HTTPException(
                status_code=400,
                detail="Máximo de 100 arquivos por upload. Você enviou {}.".format(len(files))
            )

        # Processar todos os arquivos
        results = []
        total_chunks = 0
        total_embeddings = 0
        failed_files = []
        skipped_files = []

        for file in files:
            try:
                logger.info(f"Processando arquivo: {file.filename}")

                # Verificar se arquivo já existe
                existing_file_id = await service.check_file_exists(
                    document_store_id, file.filename
                )

                if existing_file_id:
                    logger.warning(f"Arquivo '{file.filename}' já existe no store (id: {existing_file_id})")
                    skipped_files.append(file.filename)
                    results.append({
                        "file_name": file.filename,
                        "status": "skipped",
                        "message": "Arquivo já existe no Document Store",
                        "id_documento": str(existing_file_id),
                    })
                    continue

                result = await service.process_document_upload(
                    document_store_id=document_store_id,
                    file=file,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    generate_embeddings=generate_embeddings,
                    embedding_credential_id=embedding_credential_id,
                )

                total_chunks += result.get("chunks_created", 0)
                total_embeddings += result.get("embeddings_created", 0)

                results.append({
                    "file_name": file.filename,
                    "status": "success",
                    "chunks_created": result.get("chunks_created", 0),
                    "embeddings_created": result.get("embeddings_created", 0),
                })

            except Exception as e:
                logger.error(f"Erro ao processar arquivo {file.filename}: {str(e)}")
                failed_files.append(file.filename)
                results.append({
                    "file_name": file.filename,
                    "status": "error",
                    "error": str(e),
                })

        # Preparar resposta
        successful_count = len([r for r in results if r.get("status") == "success"])

        response = {
            "message": f"Processamento concluído: {successful_count} sucesso(s), {len(skipped_files)} ignorado(s), {len(failed_files)} erro(s)",
            "document_store_id": str(document_store_id),
            "total_files": len(files),
            "successful_files": successful_count,
            "skipped_files": len(skipped_files),
            "failed_files": len(failed_files),
            "total_chunks_created": total_chunks,
            "total_embeddings_created": total_embeddings,
            "results": results,
            "status": "completed" if len(failed_files) == 0 else "partial",
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer upload de documentos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar documentos: {str(e)}",
        ) from e


@router.get("/{document_store_id}/files")
async def list_document_store_files(
    document_store_id: uuid.UUID,
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
):
    """Lista todos os arquivos de um document store"""
    try:
        document_store = await service.get_documento_store_by_id(document_store_id)
        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        files = await service.list_files_in_document_store(document_store_id)

        return {
            "document_store_id": str(document_store_id),
            "total_files": len(files),
            "files": files,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar arquivos do document store: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor",
        ) from e


@router.delete("/{document_store_id}/files/{id_documento}")
async def delete_document_store_file(
    document_store_id: uuid.UUID,
    id_documento: uuid.UUID,
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
):
    """Exclui um arquivo específico de um document store"""
    try:
        document_store = await service.get_documento_store_by_id(document_store_id)
        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        deleted = await service.delete_file_from_document_store(
            document_store_id, id_documento
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Arquivo não encontrado neste Document Store",
            )

        return {
            "message": "Arquivo excluído com sucesso",
            "document_store_id": str(document_store_id),
            "id_documento": str(id_documento),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao excluir arquivo do document store: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor",
        ) from e


@router.get("/{document_store_id}/stats")
async def get_document_store_stats(
    document_store_id: uuid.UUID,
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
):
    """Retorna estatísticas do document store"""
    try:
        document_store = await service.get_documento_store_by_id(document_store_id)
        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        stats = await service.get_document_store_stats(document_store_id)

        return {
            "document_store_id": str(document_store_id),
            "document_store_name": document_store.nm_documento_store,
            "total_documents": stats.get("total_documents", 0),
            "total_chunks": stats.get("total_chunks", 0),
            "total_embeddings": stats.get("total_embeddings", 0),
            "status": document_store.nm_status,
            "created_at": document_store.dt_criacao.isoformat() if document_store.dt_criacao else None,
            "updated_at": document_store.dt_atualizacao.isoformat() if document_store.dt_atualizacao else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{document_store_id}/query")
async def query_document_store(
    document_store_id: uuid.UUID,
    query: str = Query(..., description="Consulta para buscar documentos relevantes"),
    top_k: int = Query(5, ge=1, le=20, description="Número de resultados a retornar"),
    min_similarity: float = Query(0.0, ge=0.0, le=1.0, description="Similaridade mínima (0.0-1.0, 0=sem filtro)"),
    metadata_filter: Optional[str] = Query(None, description="Filtro JSON para metadados (ex: {\"filename\": \"doc.pdf\"})"),
    service: DocumentoStoreService = Depends(get_documento_store_service),
    _=Depends(get_current_apikey),
):
    """
    Consulta o document store usando busca semântica com embeddings

    Retorna os chunks mais relevantes para a query usando:
    - Busca vetorial por similaridade cosine (se embeddings disponíveis)
    - Fallback para busca por palavras-chave

    Parâmetros:
    - query: Texto da consulta
    - top_k: Quantidade de resultados (1-20)
    - min_similarity: Score mínimo de similaridade (0.0-1.0, padrão 0.0 = sem filtro)
    - metadata_filter: Filtro JSON opcional para metadados

    Resposta:
    - results: Lista de chunks com content, score, filename
    - search_method: 'semantic' (vetorial) ou 'keyword' (texto)
    - stats: Estatísticas da busca
    """
    try:
        document_store = await service.get_documento_store_by_id(document_store_id)
        if not document_store:
            raise HTTPException(status_code=404, detail="Document Store não encontrado")

        # Parse metadata filter se fornecido
        import json
        metadata_filter_dict = None
        if metadata_filter:
            try:
                metadata_filter_dict = json.loads(metadata_filter)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="metadata_filter deve ser um JSON válido"
                )

        results = await service.query_document_store(
            document_store_id=document_store_id,
            query=query,
            top_k=top_k,
            min_similarity=min_similarity,
            metadata_filter=metadata_filter_dict,
        )

        # Calcular estatísticas
        search_method = results[0]["search_method"] if results else "none"
        avg_score = sum(r["score"] for r in results) / len(results) if results else 0.0

        return {
            "document_store_id": str(document_store_id),
            "query": query,
            "top_k": top_k,
            "min_similarity": min_similarity,
            "results_count": len(results),
            "results": results,
            "stats": {
                "search_method": search_method,
                "avg_score": round(avg_score, 4),
                "max_score": round(results[0]["score"], 4) if results else 0.0,
                "min_score": round(results[-1]["score"], 4) if results else 0.0,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar document store: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
