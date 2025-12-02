"""
Rotas para Biblioteca de Prompts
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.prompt_library import (
    CATEGORIAS_PERMITIDAS,
    PromptLibraryCreate,
    PromptLibraryResponse,
    PromptLibraryUpdate,
)
from src.services.prompt_library_service import (
    PromptLibraryService,
    get_prompt_library_service,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/prompt-library", tags=["prompt-library"])


@router.post("/", status_code=201, response_model=PromptLibraryResponse)
async def create_prompt(
    prompt_data: PromptLibraryCreate,
    prompt_service: PromptLibraryService = Depends(get_prompt_library_service),
    _: object = Depends(get_current_apikey),
):
    """Criar novo prompt na biblioteca"""
    try:
        # Validar categoria
        if (
            prompt_data.ds_categoria
            and prompt_data.ds_categoria not in CATEGORIAS_PERMITIDAS
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Categoria inválida. Permitidas: {CATEGORIAS_PERMITIDAS}",
            )

        prompt = await prompt_service.create_prompt(prompt_data)
        return PromptLibraryResponse.model_validate(prompt)

    except ValueError as e:
        logger.warning(f"Erro de validação ao criar prompt: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar prompt: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/", response_model=dict)
async def list_prompts(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por título ou conteúdo"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    tags: Optional[str] = Query(None, description="Filtrar por tags (separadas por vírgula)"),
    prompt_service: PromptLibraryService = Depends(get_prompt_library_service),
    _: object = Depends(get_current_apikey),
):
    """Listar prompts da biblioteca com paginação e filtros"""
    try:
        # Converter tags de string para lista
        tags_list = None
        if tags:
            tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

        prompts, total = await prompt_service.list_prompts(
            page=page,
            size=size,
            search=search,
            categoria=categoria,
            tags=tags_list,
        )

        # Converter para response models
        prompts_response = [
            PromptLibraryResponse.model_validate(p) for p in prompts
        ]

        return {
            "items": prompts_response,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except Exception as e:
        logger.error(f"Erro ao listar prompts: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/categorias", response_model=List[str])
async def list_categorias(
    _: object = Depends(get_current_apikey),
):
    """Listar categorias disponíveis"""
    return CATEGORIAS_PERMITIDAS


@router.get("/{prompt_id}", response_model=PromptLibraryResponse)
async def get_prompt(
    prompt_id: uuid.UUID,
    prompt_service: PromptLibraryService = Depends(get_prompt_library_service),
    _: object = Depends(get_current_apikey),
):
    """Buscar prompt por ID"""
    try:
        prompt = await prompt_service.get_prompt_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt não encontrado")

        return PromptLibraryResponse.model_validate(prompt)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar prompt {prompt_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{prompt_id}", response_model=PromptLibraryResponse)
async def update_prompt(
    prompt_id: uuid.UUID,
    prompt_data: PromptLibraryUpdate,
    prompt_service: PromptLibraryService = Depends(get_prompt_library_service),
    _: object = Depends(get_current_apikey),
):
    """Atualizar prompt"""
    try:
        # Validar categoria se fornecida
        if (
            prompt_data.ds_categoria
            and prompt_data.ds_categoria not in CATEGORIAS_PERMITIDAS
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Categoria inválida. Permitidas: {CATEGORIAS_PERMITIDAS}",
            )

        prompt = await prompt_service.update_prompt(prompt_id, prompt_data)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt não encontrado")

        return PromptLibraryResponse.model_validate(prompt)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar prompt {prompt_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt(
    prompt_id: uuid.UUID,
    prompt_service: PromptLibraryService = Depends(get_prompt_library_service),
    _: object = Depends(get_current_apikey),
):
    """Deletar prompt"""
    try:
        deleted = await prompt_service.delete_prompt(prompt_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Prompt não encontrado")

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar prompt {prompt_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{prompt_id}/use", status_code=204)
async def increment_prompt_usage(
    prompt_id: uuid.UUID,
    prompt_service: PromptLibraryService = Depends(get_prompt_library_service),
    _: object = Depends(get_current_apikey),
):
    """Incrementar contador de uso do prompt"""
    try:
        await prompt_service.increment_usage(prompt_id)
        return None

    except Exception as e:
        logger.error(f"Erro ao incrementar uso do prompt {prompt_id}: {str(e)}")
        # Não retornar erro, é não-crítico
        return None
