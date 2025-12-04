import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.apikey import (
    ApiKeyCreate,
    ApiKeyCreateResponse,
    ApiKeyListResponse,
    ApiKeyResponse,
    ApiKeyUpdate,
)
from src.presentes.apikey_presenter import ApiKeyPresenter
from src.services.apikey_service import ApiKeyService, get_apikey_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(
    prefix="/apikeys",
    tags=["API Keys"],
    responses={404: {"description": "API Key nÃ£o encontrada"}},
)


@router.get("/")
async def get_apikeys(
    page: int = Query(1, ge=1, description="NÃºmero da pÃ¡gina"),
    size: int = Query(10, ge=1, le=100, description="Tamanho da pÃ¡gina"),
    search: Optional[str] = Query(None, description="Buscar por nome ou chave"),
    order_by: str = Query("updatedDate", description="Campo para ordenaÃ§Ã£o"),
    order_desc: bool = Query(True, description="OrdenaÃ§Ã£o decrescente"),
    service: ApiKeyService = Depends(get_apikey_service),
    _=Depends(get_current_apikey),
) -> ApiKeyListResponse:
    """Recupera todas as API keys (coleÃ§Ã£o)"""
    try:
        apikeys, total = await service.list_apikeys(
            page=page,
            size=size,
            search=search,
            order_by=order_by,
            order_desc=order_desc,
        )

        response = ApiKeyListResponse.create_response(
            apikeys=apikeys, total=total, page=page, size=size
        )

        # Aplica presenter para mascarar as API keys
        presented_data = ApiKeyPresenter.present_api_key_list_response(
            [item.model_dump() for item in response.items], response.meta
        )

        return ApiKeyListResponse(**presented_data)

    except Exception as e:
        logger.error(f"Erro ao listar API keys: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{apikey_id}")
async def get_apikey(
    apikey_id: uuid.UUID,
    service: ApiKeyService = Depends(get_apikey_service),
    x_show_unmasked: Optional[str] = Header(
        None, description="Se 'true', retorna API key sem mÃ¡scara"
    ),
    _=Depends(get_current_apikey),
) -> ApiKeyResponse:
    """Recupera detalhes de uma API key especÃ­fica (item)"""
    try:
        apikey = await service.get_apikey_by_id(apikey_id)

        if not apikey:
            raise HTTPException(status_code=404, detail="API Key nÃ£o encontrada")

        response = ApiKeyResponse.model_validate(apikey)

        # Verifica se deve retornar sem mÃ¡scara
        show_unmasked = x_show_unmasked and x_show_unmasked.lower() == "true"

        if show_unmasked:
            # Retorna sem aplicar o presenter (sem mÃ¡scara)
            return response

        # Aplica presenter para mascarar a API key
        presented_data = ApiKeyPresenter.present_api_key_response(response.model_dump())
        return ApiKeyResponse(**presented_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/", status_code=201)
async def create_apikey(
    apikey_data: ApiKeyCreate,
    service: ApiKeyService = Depends(get_apikey_service),
    _=Depends(get_current_apikey),
) -> ApiKeyCreateResponse:
    """Cria uma nova API key"""
    try:
        apikey, api_secret = await service.create_apikey(apikey_data)

        # Criar resposta com o secret nÃ£o criptografado
        response_data = ApiKeyResponse.model_validate(apikey).model_dump()
        response_data["apiSecret"] = api_secret

        return ApiKeyCreateResponse.model_validate(response_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{apikey_id}")
async def update_apikey(
    apikey_id: uuid.UUID,
    apikey_update: ApiKeyUpdate,
    service: ApiKeyService = Depends(get_apikey_service),
    _=Depends(get_current_apikey),
) -> ApiKeyResponse:
    """Atualiza todo o registro de API key com o id especificado"""
    try:
        apikey = await service.update_apikey(apikey_id, apikey_update)

        if not apikey:
            raise HTTPException(status_code=404, detail="API Key nÃ£o encontrada")

        response = ApiKeyResponse.model_validate(apikey)

        # Aplica presenter para mascarar a API key
        presented_data = ApiKeyPresenter.present_api_key_response(response.model_dump())

        return ApiKeyResponse(**presented_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{apikey_id}", status_code=204)
async def delete_apikey(
    apikey_id: uuid.UUID,
    service: ApiKeyService = Depends(get_apikey_service),
    _=Depends(get_current_apikey),
):
    """Exclui a API key com o id especificado"""
    try:
        deleted = await service.delete_apikey(apikey_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="API Key nÃ£o encontrada")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
