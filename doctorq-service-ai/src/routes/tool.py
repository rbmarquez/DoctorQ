import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.api_config import ApiCallRequest, ApiCallResponse
from src.models.tool import (
    ToolCreate,
    ToolListResponse,
    ToolResponse,
    ToolType,
    ToolUpdate,
)
from src.services.api_service import ApiService, get_api_service
from src.services.tool_service import ToolService, get_tool_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(
    prefix="/tools",
    tags=["Tools"],
    responses={404: {"description": "Tool nÃ£o encontrado"}},
)


@router.get("/")
async def get_tools(
    page: int = Query(1, ge=1, description="NÃºmero da pÃ¡gina"),
    size: int = Query(10, ge=1, le=100, description="Tamanho da pÃ¡gina"),
    search: Optional[str] = Query(None, description="Buscar por nome ou descriÃ§Ã£o"),
    tp_tool: Optional[ToolType] = Query(None, description="Filtrar por tipo"),
    st_ativo: Optional[bool] = Query(None, description="Filtrar por status"),
    order_by: str = Query("dt_criacao", description="Campo para ordenaÃ§Ã£o"),
    order_desc: bool = Query(True, description="OrdenaÃ§Ã£o decrescente"),
    service: ToolService = Depends(get_tool_service),
    _: object = Depends(get_current_apikey),
) -> ToolListResponse:
    """Recupera todos os tools (coleÃ§Ã£o)"""
    try:
        tools, total = await service.list_tools(
            page=page,
            size=size,
            search=search,
            tool_type=tp_tool,
            active_filter=st_ativo,
            order_by=order_by,
            order_desc=order_desc,
        )

        return ToolListResponse.create_response(
            tools=tools, total=total, page=page, size=size
        )

    except Exception as e:
        logger.error(f"Erro ao listar tools: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{id_tool}")
async def get_tool(
    id_tool: uuid.UUID,
    service: ToolService = Depends(get_tool_service),
    _: object = Depends(get_current_apikey),
) -> ToolResponse:
    """Recupera detalhes de um tool especÃ­fico (item)"""
    try:
        tool = await service.get_tool_by_id(id_tool)

        if not tool:
            raise HTTPException(status_code=404, detail="Tool nÃ£o encontrado")

        return ToolResponse.model_validate(tool)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar tool: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/", status_code=201)
async def create_tool(
    tool_data: ToolCreate,
    service: ToolService = Depends(get_tool_service),
    _: object = Depends(get_current_apikey),
) -> ToolResponse:
    """Cria um novo tool"""
    try:
        tool = await service.create_tool(tool_data)
        return ToolResponse.model_validate(tool)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar tool: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{id_tool}")
async def update_tool(
    id_tool: uuid.UUID,
    tool_update: ToolUpdate,
    service: ToolService = Depends(get_tool_service),
    _: object = Depends(get_current_apikey),
) -> ToolResponse:
    """Atualiza todo o registro de tool com o id especificado"""
    try:
        tool = await service.update_tool(id_tool, tool_update)

        if not tool:
            raise HTTPException(status_code=404, detail="Tool nÃ£o encontrado")

        return ToolResponse.model_validate(tool)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar tool: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{id_tool}", status_code=204)
async def delete_tool(
    id_tool: uuid.UUID,
    service: ToolService = Depends(get_tool_service),
    _: object = Depends(get_current_apikey),
):
    """Exclui o tool com o id especificado"""
    try:
        deleted = await service.delete_tool(id_tool)

        if not deleted:
            raise HTTPException(status_code=404, detail="Tool nÃ£o encontrado")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar tool: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/execute")
async def execute_api_tool(
    request: ApiCallRequest,
    api_service: ApiService = Depends(get_api_service),
    _: object = Depends(get_current_apikey),
) -> ApiCallResponse:
    """Executa um tool de API"""
    try:
        result = await api_service.execute_api_call(request)
        return result

    except Exception as e:
        logger.error(f"Erro ao executar tool: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
