import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.variable import (
    VariableCreate,
    VariableUpdate,
)
from src.presentes.variable_presenter import VariablePresenter
from src.services.variable_service import VariableService, get_variable_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(
    prefix="/variaveis",
    tags=["VariÃ¡veis"],
    responses={404: {"description": "VariÃ¡vel nÃ£o encontrada"}},
)


@router.get("/")
async def get_variables(
    page: int = Query(1, ge=1, description="NÃºmero da pÃ¡gina"),
    size: int = Query(10, ge=1, le=100, description="Tamanho da pÃ¡gina"),
    search: Optional[str] = Query(None, description="Buscar por nome ou valor"),
    type_filter: Optional[str] = Query(None, description="Filtrar por tipo"),
    order_by: str = Query("dt_criacao", description="Campo para ordenaÃ§Ã£o"),
    order_desc: bool = Query(True, description="OrdenaÃ§Ã£o decrescente"),
    service: VariableService = Depends(get_variable_service),
    _: object = Depends(get_current_apikey),
) -> Dict[str, Any]:
    """Recupera todas as variÃ¡veis (coleÃ§Ã£o)"""
    try:
        variables, total = await service.list_variables(
            page=page,
            size=size,
            search=search,
            type_filter=type_filter,
            order_by=order_by,
            order_desc=order_desc,
        )

        return VariablePresenter.present_variable_list_response(
            variables=variables, total=total, page=page, size=size, method="GET"
        )

    except Exception as e:
        logger.error(f"Erro ao listar variÃ¡veis: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{id_variavel}")
async def get_variable(
    id_variavel: uuid.UUID,
    service: VariableService = Depends(get_variable_service),
    _: object = Depends(get_current_apikey),
) -> Dict[str, Any]:
    """Recupera detalhes de uma variÃ¡vel especÃ­fica (item)"""
    try:
        variable = await service.get_variable_by_id(id_variavel)

        if not variable:
            raise HTTPException(status_code=404, detail="VariÃ¡vel nÃ£o encontrada")

        return VariablePresenter.present_variable_response(variable, method="GET")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar variÃ¡vel: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/", status_code=201)
async def create_variable(
    variable_data: VariableCreate,
    service: VariableService = Depends(get_variable_service),
    _: object = Depends(get_current_apikey),
) -> Dict[str, Any]:
    """Cria uma nova variÃ¡vel"""
    try:
        variable = await service.create_variable(variable_data)
        return VariablePresenter.present_variable_response(variable, method="POST")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar variÃ¡vel: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{id_variavel}")
async def update_variable(
    id_variavel: uuid.UUID,
    variable_update: VariableUpdate,
    service: VariableService = Depends(get_variable_service),
    _: object = Depends(get_current_apikey),
) -> Dict[str, Any]:
    """Atualiza todo o registro de variÃ¡vel com o id especificado"""
    try:
        variable = await service.update_variable(id_variavel, variable_update)

        if not variable:
            raise HTTPException(status_code=404, detail="VariÃ¡vel nÃ£o encontrada")

        return VariablePresenter.present_variable_response(variable, method="PUT")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar variÃ¡vel: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{id_variavel}", status_code=204)
async def delete_variable(
    id_variavel: uuid.UUID,
    service: VariableService = Depends(get_variable_service),
    _: object = Depends(get_current_apikey),
):
    """Exclui a variÃ¡vel com o id especificado"""
    try:
        deleted = await service.delete_variable(id_variavel)

        if not deleted:
            raise HTTPException(status_code=404, detail="VariÃ¡vel nÃ£o encontrada")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar variÃ¡vel: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
