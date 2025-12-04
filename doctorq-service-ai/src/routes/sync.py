import uuid
from enum import Enum
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from src.config.logger_config import get_logger
from src.services.postgresql_service import PostgreSQLService, get_postgresql_service
from src.services.qdrant_service import QdrantService, get_qdrant_service
from src.services.sei.sei_sync_service import SeiSyncService, create_sync_sei_service
from src.services.sharepoints.sync_service import SyncService, create_sync_service
from src.utils.auth import get_current_apikey
from src.utils.docling import DoclingProcessor

router = APIRouter(prefix="/sync", tags=["sync"])
logger = get_logger(__name__)


class CleanupMode(str, Enum):
    """Modos de limpeza para embeddings"""

    NONE = "none"
    INCREMENTAL = "incremental"
    FULL = "full"


async def get_sync_service() -> SyncService:
    """Factory para obter instÃ¢ncia do SyncService"""
    return create_sync_service()


async def get_sei_sync_service():
    """Factory para obter instÃ¢ncia do SeiSyncService"""
    return create_sync_sei_service()


@router.get("/sharepoint/files", response_model=List[Dict[str, Any]])
async def list_sharepoint_files(
    library: str = Query("", description="Nome da biblioteca de documentos"),
    folder_path: str = Query("", description="Caminho da pasta dentro da biblioteca"),
    force_refresh: bool = Query(
        False, description="ForÃ§ar atualizaÃ§Ã£o da lista de arquivos"
    ),
    sync_service: SyncService = Depends(get_sync_service),
    _: object = Depends(get_current_apikey),
):
    """
    Listar arquivos de uma biblioteca do SharePoint
    """
    try:
        return await sync_service.list_sharepoint_files(
            library, folder_path, force_refresh
        )
    #   return await sync_service.get_first_file(library, folder_path)
    except Exception as e:
        logger.error(f"Erro ao listar arquivos: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar arquivos do SharePoint: {str(e)}"
        )


@router.get("/sharepoint/processs", response_model=List[Dict[str, Any]])
async def process_sharepoint_files(
    batch_size: int = Query("2", description="Caminho da pasta dentro da biblioteca"),
    sync_service: SyncService = Depends(get_sync_service),
    _: object = Depends(get_current_apikey),
):
    """Processar arquivos do SharePoint"""
    try:
        return await sync_service.process_sharepoint_files(batch_size)
    except Exception as e:
        logger.error(f"Erro ao processar arquivos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar arquivos do SharePoint: {str(e)}",
        )


@router.get("/sei/documentos", response_model=Dict[str, Any])
async def list_sei_files(
    id_unidade: int = Query("", description="Id da unidade"),
    sync_sei_service: SeiSyncService = Depends(get_sei_sync_service),
    _: object = Depends(get_current_apikey),
):
    """
    Listar processos de uma unidade SEI
    """
    try:
        return await sync_sei_service.list_processos(id_unidade)
    except Exception as e:
        logger.error(f"Erro ao listar arquivos: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar processo no sei: {str(e)}"
        )


@router.get("/sei/processs", response_model=Dict[str, Any])
async def process_sei_files(
    batch_size: int = Query(2, description="Caminho da pasta dentro da biblioteca"),
    id_unidade: int = Query("", description="Id da unidade"),
    sync_sei_service: SeiSyncService = Depends(get_sei_sync_service),
    _: object = Depends(get_current_apikey),
):
    """Processar arquivos do sei"""
    try:
        return await sync_sei_service.process_sei_files(batch_size, id_unidade)
    except Exception as e:
        logger.error(f"Erro ao processar arquivos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar arquivos do SharePoint: {str(e)}",
        )


@router.get("/sei/auto_processo", response_model=Dict[str, Any])
async def auto_process_sei_files(
    tempo: int = Query(
        ..., description="Tempo em minutos para execuÃ§Ã£o do processamento"
    ),
    id_unidade: int = Query(None, description="Id da unidade"),
    nivel_acesso_publico: bool = Query(False, description="NÃ­vel de acesso pÃºblico"),
    total_unidades: bool = Query(False, description="Total de unidades"),
    batch_size: int = Query(2, description="Tamanho do lote"),
    sync_sei_service: SeiSyncService = Depends(get_sei_sync_service),
    _: object = Depends(get_current_apikey),
):
    """
    Processamento automÃ¡tico e temporizado de processos SEI com nÃ­vel de acesso pÃºblico.
    Executa por tempo determinado em minutos.
    """
    try:
        # Validar parÃ¢metro de tempo
        if tempo <= 0:
            raise HTTPException(status_code=400, detail="Tempo deve ser maior que zero")

        if total_unidades:
            return await sync_sei_service.auto_process_sei_files_by_time_total_unidades(
                nivel_acesso_publico, tempo
            )

        return await sync_sei_service.auto_process_sei_files_by_time(
            tempo, id_unidade, nivel_acesso_publico, batch_size
        )

    except HTTPException:
        # Re-raise HTTP exceptions para manter status code
        raise
    except Exception as e:
        logger.error(f"Erro ao processar arquivos SEI automaticamente: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar arquivos SEI automaticamente: {str(e)}",
        )


@router.post("/qdrant-emb")
async def upload_document_to_qdrant(
    files: List[UploadFile] = File(...),
    id_crendencial_gdrant: uuid.UUID = Query(
        ..., description="ID da credencial Qdrant"
    ),
    id_credencial_modelo: uuid.UUID = Query(
        ..., description="ID da credencial do modelo Azure para embedding"
    ),
    chunk_size: int = Query(1000, description="Tamanho dos chunks de texto"),
    chunk_overlap: int = Query(200, description="SobreposiÃ§Ã£o entre chunks"),
    collection_name: str = Query(..., description="Nome da coleÃ§Ã£o"),
    cleanup: CleanupMode = Query(
        CleanupMode.INCREMENTAL, description="Modo de limpeza"
    ),
    qdrant_service: QdrantService = Depends(get_qdrant_service),
    _: object = Depends(get_current_apikey),
):
    """
    Upload de documentos (1 ou mÃºltiplos) e processamento para embeddings no Qdrant

    - Processa documentos igual ao /upload
    - Localiza credenciais Qdrant do agente
    - Gera embeddings e armazena no Qdrant
    - Cleanup modes:
      - 'none': Adiciona sem limpeza
      - 'incremental': Remove versÃµes antigas dos mesmos documentos
      - 'full': Limpa toda a coleÃ§Ã£o antes de adicionar
    """
    try:
        # ValidaÃ§Ãµes bÃ¡sicas
        if not files:
            raise HTTPException(status_code=400, detail="Nenhum arquivo fornecido")

        # Criar processador de documentos
        docling_processor = DoclingProcessor()

        # Processar cada arquivo
        all_results = []
        total_chars = 0

        for file_index, file in enumerate(files):
            # ValidaÃ§Ãµes por arquivo
            if not file.filename:
                raise HTTPException(
                    status_code=400,
                    detail=f"Nome do arquivo nÃ£o fornecido para arquivo {file_index + 1}",
                )

            # Verificar se arquivo Ã© permitido
            if not docling_processor.is_allowed_file(file):
                allowed_extensions = {
                    ".pdf",
                    ".docx",
                    ".doc",
                    ".txt",
                    ".md",
                    ".html",
                    ".htm",
                    ".pptx",
                    ".xlsx",
                }
                raise HTTPException(
                    status_code=400,
                    detail=f"ExtensÃ£o nÃ£o permitida para {file.filename}. ExtensÃµes aceitas: {', '.join(allowed_extensions)}",
                )

            # Verificar tamanho do arquivo
            max_file_size = 30 * 1024 * 1024  # 30MB
            if hasattr(file, "size") and file.size:
                if file.filename.lower().endswith((".xlsx", ".xls")):
                    max_file_size = 100 * 1024 * 1024  # 100MB para Excel

                if file.size > max_file_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Arquivo {file.filename} muito grande: {file.size / 1024 / 1024:.2f}MB (mÃ¡x: {max_file_size / 1024 / 1024:.2f}MB)",
                    )

            logger.info(
                f"Processando arquivo {file_index + 1}/{len(files)}: {file.filename}"
            )

            # Processar documento para extrair texto
            processed_content = await docling_processor.process_upload_file_complete(
                file, output_format="txt"
            )

            if not processed_content or not processed_content.get("content"):
                logger.warning(f"NÃ£o foi possÃ­vel extrair conteÃºdo de {file.filename}")
                continue

            # Preparar metadados do documento
            document_metadata = {
                "filename": file.filename,
                "content_type": file.content_type,
                "file_size": getattr(file, "size", 0),
                "processed_at": processed_content.get("timestamp"),
                "file_info": processed_content.get("file_info", {}),
                "processing_info": processed_content.get("processing_info", {}),
                "batch_index": file_index,
                "total_files": len(files),
            }

            # Adicionar collection_name aos metadados
            document_metadata["custom_collection_name"] = collection_name

            # Para cleanup FULL, sÃ³ aplicar no primeiro arquivo
            current_cleanup = cleanup.value if file_index == 0 else "none"

            # Armazenar embeddings no Qdrant
            qdrant_result = (
                await qdrant_service.store_document_embeddings_with_credential(
                    qdrant_credential_id=str(id_crendencial_gdrant),
                    document_content=processed_content["content"],
                    document_metadata=document_metadata,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    model_credential_id=str(id_credencial_modelo),
                    custom_collection_name=collection_name,
                    cleanup_mode=current_cleanup,
                )
            )

            all_results.append(
                {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "size": getattr(file, "size", 0),
                    "extracted_chars": len(processed_content["content"]),
                    "chunks_generated": (
                        qdrant_result.get("results", [{}])[0].get("chunks_processed", 0)
                        if qdrant_result.get("results")
                        else 0
                    ),
                    "qdrant_storage": qdrant_result,
                }
            )

            total_chars += len(processed_content["content"])
            logger.info(f"Arquivo {file.filename} processado com sucesso")

        # Calcular total de chunks
        total_chunks = sum(result.get("chunks_generated", 0) for result in all_results)

        # Resposta simples
        response = {
            "success": True,
            "message": f"{len(all_results)} documentos processados com sucesso",
            "files_processed": len(all_results),
            "total_chunks": total_chunks,
            "collection_name": collection_name,
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar documento para Qdrant: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar documento para Qdrant: {str(e)}",
        ) from e


@router.post("/postgres-emb")
async def upload_document_to_postgresql(
    files: List[UploadFile] = File(...),
    namespace: str = Query(
        ..., description="Namespace para separar documentos por contexto"
    ),
    id_credencial_modelo: str = Query(
        ..., description="ID da credencial do modelo Azure para embedding"
    ),
    chunk_size: int = Query(1000, description="Tamanho dos chunks em caracteres"),
    chunk_overlap: int = Query(200, description="SobreposiÃ§Ã£o entre chunks"),
    cleanup: CleanupMode = Query(
        CleanupMode.NONE,
        description="Modo de limpeza: none (manter), incremental (remover arquivo duplicado), full (limpar tudo)",
    ),
    postgresql_service: PostgreSQLService = Depends(get_postgresql_service),
    _: object = Depends(get_current_apikey),
):
    """
    Processar e armazenar documentos no PostgreSQL com embeddings
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="Nenhum arquivo foi enviado")

        logger.info(f"Processando {len(files)} arquivo(s) para PostgreSQL")

        # Inicializar DoclingProcessor para processamento
        docling_processor = DoclingProcessor()

        # Lista para armazenar resultados
        all_results = []
        total_chars = 0

        for file_index, file in enumerate(files):
            # ValidaÃ§Ãµes por arquivo
            if not file.filename:
                raise HTTPException(
                    status_code=400,
                    detail=f"Nome do arquivo nÃ£o fornecido para arquivo {file_index + 1}",
                )

            # Verificar se arquivo Ã© permitido
            if not docling_processor.is_allowed_file(file):
                allowed_extensions = {
                    ".pdf",
                    ".docx",
                    ".doc",
                    ".txt",
                    ".md",
                    ".html",
                    ".htm",
                    ".pptx",
                    ".xlsx",
                }
                raise HTTPException(
                    status_code=400,
                    detail=f"ExtensÃ£o nÃ£o permitida para {file.filename}. ExtensÃµes aceitas: {', '.join(allowed_extensions)}",
                )

            # Verificar tamanho do arquivo
            max_file_size = 30 * 1024 * 1024  # 30MB
            if hasattr(file, "size") and file.size:
                if file.filename.lower().endswith((".xlsx", ".xls")):
                    max_file_size = 100 * 1024 * 1024  # 100MB para Excel

                if file.size > max_file_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Arquivo {file.filename} muito grande: {file.size / 1024 / 1024:.2f}MB (mÃ¡x: {max_file_size / 1024 / 1024:.2f}MB)",
                    )

            logger.info(
                f"Processando arquivo {file_index + 1}/{len(files)}: {file.filename}"
            )

            # Processar documento para extrair texto
            processed_content = await docling_processor.process_upload_file_complete(
                file, output_format="txt"
            )

            if not processed_content or not processed_content.get("content"):
                logger.warning(f"NÃ£o foi possÃ­vel extrair conteÃºdo de {file.filename}")
                continue

            # Preparar metadados do documento
            document_metadata = {
                "filename": file.filename,
                "content_type": file.content_type,
                "file_size": getattr(file, "size", 0),
                "processed_at": processed_content.get("timestamp"),
                "file_info": processed_content.get("file_info", {}),
                "processing_info": processed_content.get("processing_info", {}),
                "batch_index": file_index,
                "total_files": len(files),
            }

            # Adicionar namespace aos metadados
            document_metadata["namespace"] = namespace

            # Para cleanup FULL, sÃ³ aplicar no primeiro arquivo
            current_cleanup = cleanup.value if file_index == 0 else "none"

            # Armazenar embeddings no PostgreSQL (sem agente especÃ­fico)
            postgresql_result = (
                await postgresql_service.store_document_embeddings_direct(
                    document_content=processed_content["content"],
                    document_metadata=document_metadata,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    model_credential_id=id_credencial_modelo,
                    cleanup_mode=current_cleanup,
                    namespace=namespace,
                )
            )

            all_results.append(
                {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "size": getattr(file, "size", 0),
                    "extracted_chars": len(processed_content["content"]),
                    "chunks_generated": (
                        postgresql_result.get("results", [{}])[0].get(
                            "chunks_processed", 0
                        )
                        if postgresql_result.get("results")
                        else 0
                    ),
                    "postgresql_storage": postgresql_result,
                }
            )

            total_chars += len(processed_content["content"])
            logger.info(f"Arquivo {file.filename} processado com sucesso")

        # Calcular total de chunks
        total_chunks = sum(result.get("chunks_generated", 0) for result in all_results)

        # Resposta simples
        response = {
            "success": True,
            "message": f"{len(all_results)} documentos processados com sucesso",
            "files_processed": len(all_results),
            "total_chunks": total_chunks,
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar documento para PostgreSQL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar documento para PostgreSQL: {str(e)}",
        ) from e
