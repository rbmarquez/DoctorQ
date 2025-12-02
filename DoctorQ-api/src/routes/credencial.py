import uuid

from typing import Any, Dict

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.config.logger_config import get_logger
from src.models.credencial import (
    CredencialCreate,
    CredencialListResponse,
    CredencialResponse,
    CredencialUpdate,
)
from src.models.credencial_schemas import CredencialFactory


from src.services.credencial_service import CredencialService, get_credencial_service
from src.utils.auth import get_current_apikey
from src.utils.mask_utils import apply_masks_to_credentials

logger = get_logger(__name__)


class CredencialEmpresaUpsert(BaseModel):
    """Schema para criar/atualizar credencial de uma empresa"""
    tipo: str = Field(..., description="Tipo da credencial (ex: openIaApi, azureOpenIaChatApi)")
    nome: str = Field(..., description="Nome amigável da credencial")
    dados: Dict[str, Any] = Field(..., description="Dados da credencial")

router = APIRouter(prefix="/credenciais", tags=["credenciais"])


@router.post("/", status_code=201, response_model=CredencialResponse)
async def create_credencial(
    credencial: CredencialCreate,
    service: CredencialService = Depends(get_credencial_service),
    _=Depends(get_current_apikey),
):
    """Criar nova credencial"""
    try:
        nova_credencial = await service.create_credencial(credencial)
        return CredencialResponse.model_validate(nova_credencial)

    except ValueError as e:
        logger.error(f"Erro de validaÃ§Ã£o ao criar credencial: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar credencial: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/types")
async def get_supported_types(
    current_user=Depends(get_current_apikey),
):
    """Listar tipos de credenciais suportados"""
    try:
        tipos = CredencialFactory.get_supported_types()
        return {"tipos_suportados": tipos, "total": len(tipos)}
    except Exception as e:
        logger.error(f"Erro ao listar tipos de credenciais: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/", response_model=CredencialListResponse)
async def list_credenciais(
    current_user=Depends(get_current_apikey),
    page: int = Query(1, ge=1, description="NÃºmero da pÃ¡gina"),
    size: int = Query(10, ge=1, le=100, description="Itens por pÃ¡gina"),
    service: CredencialService = Depends(get_credencial_service),
):
    """Listar credenciais com paginaÃ§Ã£o"""
    try:
        credenciais, total = await service.get_credenciais(page=page, size=size)
        return CredencialListResponse.create_response(credenciais, total, page, size)

    except Exception as e:
        logger.error(f"Erro ao listar credenciais: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{id_credencial}", response_model=CredencialResponse)
async def get_credencial(
    id_credencial: uuid.UUID,
    service: CredencialService = Depends(get_credencial_service),
    _=Depends(get_current_apikey),
):
    """Buscar credencial por ID"""
    try:
        credencial_data = await service.get_credencial_decrypted(id_credencial)

        if not credencial_data:
            raise HTTPException(status_code=404, detail="Credencial nÃ£o encontrada")

        # Aplicar mÃ¡scaras nos dados sensÃ­veis
        dados_mascarados = apply_masks_to_credentials(credencial_data.get("dados", {}))
        # Criar response com dados mascarados
        response_data = {
            "id_credencial": credencial_data["id_credencial"],
            "nome": credencial_data["nome"],
            "nome_credencial": credencial_data["nome_credencial"],
            "dados_plaintext": dados_mascarados,
            "dt_criacao": credencial_data["dt_criacao"],
            "dt_atualizacao": credencial_data["dt_atualizacao"],
        }

        return CredencialResponse.model_validate(response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar credencial {id_credencial}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{id_credencial}", response_model=CredencialResponse)
async def update_credencial(
    id_credencial: uuid.UUID,
    credencial: CredencialUpdate,
    service: CredencialService = Depends(get_credencial_service),
    _=Depends(get_current_apikey),
):
    """Atualizar credencial"""
    try:
        # Definir o ID no objeto de atualizaÃ§Ã£o
        credencial.id_credencial = id_credencial
        resultado = await service.update_credencial(credencial)

        if not resultado:
            raise HTTPException(status_code=404, detail="Credencial nÃ£o encontrada")

        return CredencialResponse.model_validate(resultado)

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Erro de validaÃ§Ã£o ao atualizar credencial: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao atualizar credencial: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{id_credencial}", status_code=204)
async def delete_credencial(
    id_credencial: uuid.UUID,
    service: CredencialService = Depends(get_credencial_service),
    _=Depends(get_current_apikey),
):
    """Deletar credencial"""
    try:
        deleted = await service.delete_credencial(id_credencial)

        if not deleted:
            raise HTTPException(status_code=404, detail="Credencial nÃ£o encontrada")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar credencial {id_credencial}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# ENDPOINTS MULTI-TENANT (POR EMPRESA)
# ============================================================================


@router.get("/empresa/{id_empresa}")
async def list_credenciais_empresa(
    id_empresa: uuid.UUID,
    tipo: str = Query(None, description="Tipo da credencial (ex: openIaApi, azureOpenIaChatApi)"),
    service: CredencialService = Depends(get_credencial_service),
    _=Depends(get_current_apikey),
):
    """Listar credenciais de uma empresa específica"""
    try:
        credenciais = await service.get_credenciais_by_empresa(id_empresa, tipo)

        # Mascarar dados sensíveis
        result = []
        for cred in credenciais:
            result.append({
                "id_credencial": cred.id_credencial,
                "id_empresa": cred.id_empresa,
                "nome": cred.nome,
                "nome_credencial": cred.nome_credencial,
                "fg_ativo": cred.fg_ativo,
                "dt_criacao": cred.dt_criacao,
                "dt_atualizacao": cred.dt_atualizacao,
            })

        return {"credenciais": result, "total": len(result)}

    except Exception as e:
        logger.error(f"Erro ao listar credenciais da empresa {id_empresa}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/empresa/{id_empresa}/tipo/{tipo}")
async def get_credencial_empresa_tipo(
    id_empresa: uuid.UUID,
    tipo: str,
    decrypted: bool = Query(False, description="Retornar dados descriptografados (uso interno)"),
    service: CredencialService = Depends(get_credencial_service),
    _=Depends(get_current_apikey),
):
    """Buscar credencial de uma empresa por tipo (ex: openIaApi, azureOpenIaChatApi)"""
    try:
        credencial_data = await service.get_credencial_decrypted_by_empresa(id_empresa, tipo)

        if not credencial_data:
            raise HTTPException(
                status_code=404,
                detail=f"Credencial tipo '{tipo}' não encontrada para esta empresa"
            )

        if decrypted:
            # Retornar dados completos (para uso interno do chatbot)
            return credencial_data
        else:
            # Retornar dados mascarados (para exibição no frontend)
            dados_mascarados = apply_masks_to_credentials(credencial_data.get("dados", {}))
            return {
                "id_credencial": credencial_data["id_credencial"],
                "id_empresa": credencial_data["id_empresa"],
                "nome": credencial_data["nome"],
                "nome_credencial": credencial_data["nome_credencial"],
                "dados_plaintext": dados_mascarados,
                "dt_criacao": credencial_data["dt_criacao"],
                "dt_atualizacao": credencial_data["dt_atualizacao"],
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar credencial tipo {tipo} da empresa {id_empresa}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/empresa/{id_empresa}", response_model=CredencialResponse)
async def upsert_credencial_empresa(
    id_empresa: uuid.UUID,
    body: CredencialEmpresaUpsert = Body(...),
    service: CredencialService = Depends(get_credencial_service),
    _=Depends(get_current_apikey),
):
    """Criar ou atualizar credencial de uma empresa (upsert)"""
    try:
        credencial = await service.upsert_credencial_empresa(
            id_empresa=id_empresa,
            tipo=body.tipo,
            nome=body.nome,
            dados=body.dados
        )

        return CredencialResponse.model_validate(credencial)

    except ValueError as e:
        logger.error(f"Erro de validação ao salvar credencial: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao salvar credencial da empresa {id_empresa}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
