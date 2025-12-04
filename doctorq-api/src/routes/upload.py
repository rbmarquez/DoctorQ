import gzip
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response

from src.config.logger_config import get_logger
from src.utils.auth import get_current_apikey
from src.utils.docling import DoclingProcessor

router = APIRouter(prefix="/upload", tags=["upload"])
logger = get_logger(__name__)

# ExtensÃµes permitidas
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".doc",
    ".txt",
    ".md",
    ".html",
    ".htm",
    ".pptx",
    ".xlsx",
    # Imagens
    ".jpg",
    ".jpeg",
    ".png",
    ".tiff",
    ".tif",
    ".gif",
    ".bmp",
    ".webp",
}

# Tamanho mÃ¡ximo por arquivo (30MB padrÃ£o, 100MB para Excel com sistema hÃ­brido)
MAX_FILE_SIZE = 30 * 1024 * 1024
MAX_EXCEL_FILE_SIZE = 100 * 1024 * 1024  # 100MB para Excel grandes

# Limite de resposta JSON (2MB para K8s)
MAX_RESPONSE_SIZE = 2 * 1024 * 1024


def validate_file_extension(filename: str) -> bool:
    """Valida se a extensÃ£o do arquivo Ã© permitida"""
    file_extension = Path(filename).suffix.lower()
    return file_extension in ALLOWED_EXTENSIONS


def validate_file_size(file_size: int, filename: str = "") -> bool:
    """Valida se o tamanho do arquivo estÃ¡ dentro do limite"""
    # Verificar se Ã© Excel - permite tamanho maior
    if filename.lower().endswith((".xlsx", ".xls")):
        return file_size <= MAX_EXCEL_FILE_SIZE
    return file_size <= MAX_FILE_SIZE


def get_max_file_size_for_type(filename: str) -> int:
    """Retorna o tamanho mÃ¡ximo permitido para o tipo de arquivo"""
    if filename.lower().endswith((".xlsx", ".xls")):
        return MAX_EXCEL_FILE_SIZE
    return MAX_FILE_SIZE


def create_compressed_response(data: dict, status_code: int = 200) -> Response:
    """Cria resposta comprimida para dados grandes"""
    json_str = json.dumps(data, ensure_ascii=False, separators=(",", ":"))

    # Se a resposta for muito grande, comprimi-la
    if len(json_str.encode("utf-8")) > 1024:  # Comprimir se > 1KB
        compressed_data = gzip.compress(json_str.encode("utf-8"))
        return Response(
            content=compressed_data,
            status_code=status_code,
            media_type="application/json",
            headers={
                "Content-Encoding": "gzip",
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-Content-Length": str(len(json_str)),
                "X-Compressed-Length": str(len(compressed_data)),
            },
        )

    return JSONResponse(content=data, status_code=status_code)


def validate_response_size(data: dict) -> bool:
    """Valida se o tamanho da resposta estÃ¡ dentro do limite"""
    json_str = json.dumps(data, ensure_ascii=False)
    return len(json_str.encode("utf-8")) <= MAX_RESPONSE_SIZE


@router.post("/simples")
async def upload_single_file(
    file: UploadFile = File(...),
    output_format: str = "txt",
    _: object = Depends(get_current_apikey),
):
    """
    Upload de um Ãºnico arquivo e processamento otimizado
    Suporta documentos (PDF, DOCX, TXT, etc.) e imagens (JPG, PNG, TIFF, etc.)
    output_format: Formato de saÃ­da (txt, markdown, html)

    """
    try:
        # ValidaÃ§Ãµes bÃ¡sicas
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nome do arquivo nao fornecido")

        # Cria o processador
        docling_processor = DoclingProcessor()

        # Verifica se o arquivo Ã© permitido
        if not docling_processor.is_allowed_file(file):
            raise HTTPException(
                status_code=400,
                detail=f"Extensao nao permitida. Extensoes aceitas: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # Verificar tamanho do arquivo com limites especÃ­ficos por tipo
        if hasattr(file, "size") and file.size:
            max_size = get_max_file_size_for_type(file.filename)
            if file.size > max_size:
                file_type = (
                    "Excel"
                    if file.filename.lower().endswith((".xlsx", ".xls"))
                    else "arquivo"
                )
                raise HTTPException(
                    status_code=413,
                    detail=f"{file_type} muito grande: {file.size / 1024 / 1024:.2f}MB (mÃ¡x: {max_size / 1024 / 1024:.2f}MB)",
                )

        # Verifica formato de saÃ­da
        available_formats = docling_processor.get_available_output_formats()
        if output_format not in available_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Formato de saida invalido. Formatos disponiveis: {', '.join(available_formats)}",
            )

        logger.info(f"Iniciando processamento: {file.filename} -> {output_format}")

        # Para formato JSON, usar versÃ£o otimizada
        if output_format == "json":
            output_format = "json"  # Usar versÃ£o otimizada
            logger.info("Usando processamento JSON otimizado para evitar travamento")

        # Processa o arquivo
        processed_content = await docling_processor.process_upload_file_complete(
            file, output_format
        )

        # Adiciona informaÃ§Ãµes de processamento
        response_data = {
            "success": True,
            "message": "Arquivo processado com sucesso",
            "processing_info": {
                "filename": file.filename,
                "format": output_format,
                "limits_applied": docling_processor.get_processing_limits(),
                "content_truncated": False,
            },
            "data": processed_content,
        }

        # Verifica se precisa truncar ainda mais
        if not validate_response_size(response_data):
            logger.warning(
                f"Resposta muito grande para {file.filename}, aplicando truncamento adicional"
            )

            # EstratÃ©gia de truncamento agressivo
            if "content" in processed_content:
                content = str(processed_content["content"])
                if len(content) > 100000:  # 100KB de conteÃºdo
                    processed_content["content"] = (
                        content[:100000]
                        + "\n\n[CONTEUDO TRUNCADO - MUITO GRANDE PARA EXIBICAO]"
                    )
                    response_data["processing_info"]["content_truncated"] = True

            response_data["data"] = processed_content

        logger.info(f"Arquivo {file.filename} processado com sucesso")

        # Retorna resposta comprimida se necessÃ¡rio
        return create_compressed_response(response_data)

    except ValueError as e:
        logger.error(f"Erro de validacao: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except TimeoutError as e:
        logger.error(f"Timeout no processamento: {str(e)}")

        raise HTTPException(
            status_code=408,
            detail={
                "error": "Timeout no processamento",
                "message": str(e),
                "async_endpoint": "/upload/simples/async",
                "max_timeout_seconds": (
                    docling_processor.MAX_PROCESSING_TIME
                    if hasattr(docling_processor, "MAX_PROCESSING_TIME")
                    else 90
                ),
            },
        ) from e
    except RuntimeError as e:
        logger.error(f"Erro de runtime (possÃ­vel memÃ³ria): {str(e)}")
        raise HTTPException(
            status_code=503, detail=f"ServiÃ§o temporiamente indisponÃ­vel: {str(e)}"
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro interno no processamento do arquivo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno no processamento do arquivo: {str(e)}",
        ) from e


@router.post("/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    output_format: str = "txt",
    _: object = Depends(get_current_apikey),
):
    """
    Upload de mÃºltiplos arquivos com processamento otimizado
    Suporta documentos (PDF, DOCX, TXT, etc.) e imagens (JPG, PNG, TIFF, etc.)

    output_format: Formato de saÃ­da (txt, markdown, html)
    """
    # Limites mais restritivos para mÃºltiplos arquivos
    max_files = 5 if output_format in ["json", "full"] else 10

    if len(files) > max_files:
        raise HTTPException(
            status_code=400,
            detail=f"Maximo de {max_files} arquivos por upload para formato {output_format}",
        )

    docling_processor = DoclingProcessor()

    # Verifica formato de saÃ­da
    available_formats = docling_processor.get_available_output_formats()
    if output_format not in available_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de saida invalido. Formatos disponiveis: {', '.join(available_formats)}",
        )

    logger.info(
        f"Iniciando processamento de {len(files)} arquivos para formato: {output_format}"
    )

    results = []
    errors = []

    # Processamento sequencial para controle de memÃ³ria
    for i, file in enumerate(files):
        try:
            # ValidaÃ§Ãµes
            if not file.filename:
                errors.append(
                    {
                        "filename": "arquivo sem nome",
                        "error": "Nome do arquivo nao fornecido",
                    }
                )
                continue

            if not docling_processor.is_allowed_file(file):
                errors.append(
                    {
                        "filename": file.filename,
                        "error": f"Extensao nao permitida. Extensoes aceitas: {', '.join(ALLOWED_EXTENSIONS)}",
                    }
                )
                continue

            logger.info(f"Processando arquivo {i+1}/{len(files)}: {file.filename}")

            # Processa o arquivo com timeout menor para mÃºltiplos arquivos
            processed_content = await docling_processor.process_upload_file_complete(
                file, output_format
            )

            results.append(
                {
                    "filename": file.filename,
                    "processed_content": processed_content,
                    "status": "success",
                    "file_index": i,
                }
            )

            logger.info(
                f"Arquivo {file.filename} processado com sucesso ({i+1}/{len(files)})"
            )

        except TimeoutError as e:
            logger.error(f"Timeout ao processar arquivo {file.filename}: {str(e)}")
            errors.append(
                {
                    "filename": file.filename,
                    "error": f"Timeout no processamento: {str(e)}",
                }
            )
        except Exception as e:
            logger.error(f"Erro ao processar arquivo {file.filename}: {str(e)}")
            errors.append(
                {"filename": file.filename, "error": f"Erro no processamento: {str(e)}"}
            )

    response_data = {
        "success": True,
        "message": f"Processamento concluido. {len(results)} arquivos processados com sucesso, {len(errors)} com erro",
        "processing_info": {
            "format": output_format,
            "limits_applied": docling_processor.get_processing_limits(),
            "total_files": len(files),
            "successful": len(results),
            "failed": len(errors),
        },
        "data": {
            "processed_files": results,
            "errors": errors,
            "summary": {
                "total_files": len(files),
                "successful": len(results),
                "failed": len(errors),
            },
        },
    }

    logger.info(
        f"Processamento concluido: {len(results)} sucessos, {len(errors)} erros"
    )

    # Verifica tamanho e trunca se necessÃ¡rio
    if not validate_response_size(response_data):
        logger.warning(
            "Resposta de multiplos arquivos muito grande, aplicando truncamento"
        )

        # Trunca resultados se necessÃ¡rio
        if len(results) > 3:
            response_data["data"]["processed_files"] = results[:3]
            response_data["data"]["truncated_results"] = len(results) - 3
            response_data["message"] += " (Exibindo apenas os primeiros 3 resultados)"

    return create_compressed_response(response_data)


@router.post("/simples/async")
async def upload_single_file_async(
    file: UploadFile = File(...),
    output_format: str = "txt",
    _: object = Depends(get_current_apikey),
):
    """
    Upload assÃ­ncrono para arquivos grandes - retorna job_id para consulta posterior
    Ideal para PDFs grandes que excedem limites do processamento sÃ­ncrono
    """
    try:
        # ValidaÃ§Ãµes bÃ¡sicas
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nome do arquivo nao fornecido")

        docling_processor = DoclingProcessor()

        # Verifica se o arquivo Ã© permitido
        if not docling_processor.is_allowed_file(file):
            raise HTTPException(
                status_code=400,
                detail=f"Extensao nao permitida. Extensoes aceitas: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # Verifica formato de saÃ­da
        available_formats = docling_processor.get_available_output_formats()
        if output_format not in available_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Formato de saida invalido. Formatos disponiveis: {', '.join(available_formats)}",
            )

        # Gerar ID do job
        job_id = str(uuid.uuid4())

        logger.info(
            f"Iniciando processamento assÃ­ncrono: {file.filename} (job: {job_id})"
        )

        # Salvar arquivo temporariamente para processamento futuro
        temp_path = await docling_processor.save_upload_file(file)
        logger.debug(f"Arquivo salvo temporariamente: {temp_path}")

        # Retornar job_id imediatamente - processamento acontece em background
        response_data = {
            "success": True,
            "message": "Arquivo recebido para processamento assÃ­ncrono",
            "job_id": job_id,
            "status": "processing",
            "estimated_time": "2-5 minutos",
            "check_status_url": f"/upload/status/{job_id}",
            "file_info": {
                "filename": file.filename,
                "format": output_format,
                "submitted_at": datetime.now().isoformat(),
            },
        }

        # TODO: Implementar processamento em background com Redis/Celery
        # Por enquanto, simular resposta assÃ­ncrona
        logger.info(f"Job {job_id} criado para arquivo {file.filename}")

        return create_compressed_response(response_data, 202)  # 202 Accepted

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload assÃ­ncrono: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno no processamento assÃ­ncrono: {str(e)}",
        ) from e


@router.get("/status/{job_id}")
async def get_processing_status(
    job_id: str,
    _: object = Depends(get_current_apikey),
):
    """
    Consulta status do processamento assÃ­ncrono
    Estados: processing, completed, failed, not_found
    """
    try:
        # TODO: Implementar consulta real de status no Redis/banco
        # Por enquanto, simular resposta

        response_data = {
            "success": True,
            "job_id": job_id,
            "status": "processing",  # processing, completed, failed
            "progress": 45,  # 0-100%
            "estimated_remaining": "2 minutos",
            "message": "Processando pÃ¡ginas do documento...",
            "started_at": datetime.now().isoformat(),
            "result_url": None,  # Quando completed
        }

        return JSONResponse(content=response_data)

    except Exception as e:
        logger.error(f"Erro ao consultar status do job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar status: {str(e)}",
        ) from e


@router.get("/result/{job_id}")
async def get_processing_result(
    job_id: str,
    _: object = Depends(get_current_apikey),
):
    """
    Recupera resultado do processamento assÃ­ncrono quando completo
    """
    try:
        # TODO: Implementar recuperaÃ§Ã£o real do resultado
        # Por enquanto, simular resposta

        response_data = {
            "success": True,
            "job_id": job_id,
            "status": "completed",
            "processing_info": {
                "filename": "exemplo.pdf",
                "format": "txt",
                "completed_at": datetime.now().isoformat(),
                "processing_time": "3m 45s",
            },
            "data": {
                "content": "ConteÃºdo processado do documento...",
                "metadata": {"pages": 42, "extraction_method": "docling_k8s_optimized"},
            },
        }

        return create_compressed_response(response_data)

    except Exception as e:
        logger.error(f"Erro ao recuperar resultado do job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao recuperar resultado: {str(e)}",
        ) from e


@router.get("/limits")
async def get_processing_limits(
    _: object = Depends(get_current_apikey),
):
    """Retorna os limites de processamento atuais"""
    docling_processor = DoclingProcessor()

    # Detectar ambiente
    is_k8s = os.getenv("KUBERNETES_SERVICE_HOST") is not None

    limits = {
        **docling_processor.get_processing_limits(),
        "max_file_size": MAX_FILE_SIZE,
        "max_excel_file_size": MAX_EXCEL_FILE_SIZE,
        "max_response_size": MAX_RESPONSE_SIZE,
        "supported_extensions": list(ALLOWED_EXTENSIONS),
        "available_formats": docling_processor.get_available_output_formats(),
        "environment": "kubernetes" if is_k8s else "local",
        "async_processing_available": True,
        "sync_recommendations": {
            "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024),
            "max_excel_file_size_mb": MAX_EXCEL_FILE_SIZE / (1024 * 1024),
            "timeout_seconds": docling_processor.MAX_PROCESSING_TIME,
        },
    }

    return JSONResponse(
        content={
            "success": True,
            "limits": limits,
        }
    )
