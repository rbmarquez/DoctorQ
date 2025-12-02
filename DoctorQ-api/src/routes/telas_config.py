"""
Rotas para Configuração de Visibilidade de Telas

Endpoints para gerenciar a visibilidade de telas por tipo de usuário.
Suporta autenticação via JWT ou API Key.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig
from src.middleware.apikey_auth import get_current_user_optional, get_current_apikey_optional
from src.models.telas_config import (
    TelaConfigBulkItem,
    TelaConfigResponse,
    TipoUsuarioTela,
)
from src.services.telas_config_service import TelasConfigService

logger = get_logger(__name__)


def _get_empresa_id(request: Request) -> UUID:
    """
    Obtém o id_empresa do usuário autenticado.
    Suporta tanto JWT quanto API Key.
    """
    # Tentar obter via JWT primeiro
    jwt_user = get_current_user_optional(request)

    if jwt_user:
        id_empresa = jwt_user.get("id_empresa")
        if id_empresa:
            return UUID(id_empresa) if isinstance(id_empresa, str) else id_empresa
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT não contém id_empresa"
        )

    # Tentar obter via API Key
    api_key = get_current_apikey_optional(request)
    if api_key and api_key.id_empresa:
        return api_key.id_empresa

    # Nenhum método de autenticação válido ou sem empresa
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autenticação requerida com empresa associada"
    )

router = APIRouter(prefix="/telas-config", tags=["Telas Config"])


# ============================================================================
# GET - Listar configurações
# ============================================================================


@router.get("/", response_model=list[TelaConfigResponse])
async def listar_telas_config(
    request: Request,
    tp_tipo: Optional[TipoUsuarioTela] = Query(
        None, description="Filtrar por tipo de usuário"
    ),
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Lista todas as configurações de tela.

    Se tp_tipo for informado, filtra por tipo de usuário.
    Suporta autenticação via JWT ou API Key.
    """
    id_empresa = _get_empresa_id(request)
    service = TelasConfigService(db)

    if tp_tipo:
        configs = await service.get_by_tipo(id_empresa, tp_tipo)
    else:
        configs = await service.get_all(id_empresa)

    return configs


@router.get("/tela/{cd_tela}/", response_model=list[TelaConfigResponse])
async def listar_config_por_tela(
    request: Request,
    cd_tela: str,
    tp_tipo: Optional[TipoUsuarioTela] = Query(
        None, description="Filtrar por tipo de usuário"
    ),
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Lista configurações de uma tela específica.
    Suporta autenticação via JWT ou API Key.
    """
    id_empresa = _get_empresa_id(request)
    service = TelasConfigService(db)

    configs = await service.get_by_tela(id_empresa, cd_tela, tp_tipo)
    return configs


@router.get("/verificar/", response_model=dict)
async def verificar_visibilidade(
    request: Request,
    cd_tela: str = Query(..., description="Código da tela"),
    tp_tipo: TipoUsuarioTela = Query(..., description="Tipo de usuário"),
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Verifica se uma tela está visível para um tipo de usuário.
    Suporta autenticação via JWT ou API Key.

    Returns:
        {"cd_tela": "xxx", "tp_tipo": "xxx", "fg_visivel": true/false}
    """
    id_empresa = _get_empresa_id(request)
    service = TelasConfigService(db)

    fg_visivel = await service.is_tela_visivel(id_empresa, cd_tela, tp_tipo)

    return {
        "cd_tela": cd_tela,
        "tp_tipo": tp_tipo.value,
        "fg_visivel": fg_visivel,
    }


# ============================================================================
# POST/PUT - Criar/Atualizar configurações
# ============================================================================


@router.post("/", response_model=TelaConfigResponse)
async def criar_ou_atualizar_config(
    request: Request,
    cd_tela: str = Query(..., description="Código da tela"),
    tp_tipo: TipoUsuarioTela = Query(..., description="Tipo de usuário"),
    fg_visivel: bool = Query(..., description="Se a tela está visível"),
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Cria ou atualiza a configuração de visibilidade de uma tela.
    Suporta autenticação via JWT ou API Key.
    """
    id_empresa = _get_empresa_id(request)
    service = TelasConfigService(db)

    config = await service.set_visibilidade(id_empresa, cd_tela, tp_tipo, fg_visivel)

    logger.info(
        f"Config atualizada: tela={cd_tela}, tipo={tp_tipo.value}, "
        f"visivel={fg_visivel}, empresa={id_empresa}"
    )

    return config


@router.post("/bulk/", response_model=list[TelaConfigResponse])
async def atualizar_em_lote(
    request: Request,
    tp_tipo: TipoUsuarioTela = Query(..., description="Tipo de usuário"),
    telas: list[TelaConfigBulkItem] = [],
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Atualiza múltiplas configurações de tela de uma vez.
    Suporta autenticação via JWT ou API Key.

    Body:
        [
            {"cd_tela": "admin_dashboard", "fg_visivel": true},
            {"cd_tela": "admin_usuarios", "fg_visivel": false},
            ...
        ]
    """
    id_empresa = _get_empresa_id(request)
    service = TelasConfigService(db)

    configs = await service.bulk_update(id_empresa, tp_tipo, telas)

    logger.info(
        f"Bulk update: empresa={id_empresa}, tipo={tp_tipo.value}, "
        f"{len(configs)} telas atualizadas"
    )

    return configs


# ============================================================================
# DELETE - Remover configurações (voltar ao padrão)
# ============================================================================


@router.delete("/tela/{cd_tela}/", response_model=dict)
async def remover_config_tela(
    request: Request,
    cd_tela: str,
    tp_tipo: Optional[TipoUsuarioTela] = Query(
        None, description="Tipo de usuário (se não informado, remove todos)"
    ),
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Remove configurações de uma tela (volta ao padrão: visível).
    Suporta autenticação via JWT ou API Key.
    """
    id_empresa = _get_empresa_id(request)
    service = TelasConfigService(db)

    count = await service.delete_by_tela(id_empresa, cd_tela, tp_tipo)

    return {
        "message": f"Configurações removidas com sucesso",
        "cd_tela": cd_tela,
        "tp_tipo": tp_tipo.value if tp_tipo else "todos",
        "registros_removidos": count,
    }


@router.delete("/reset/{tp_tipo}/", response_model=dict)
async def resetar_tipo(
    request: Request,
    tp_tipo: TipoUsuarioTela,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Remove todas as configurações de um tipo (volta ao padrão: todas visíveis).
    Suporta autenticação via JWT ou API Key.
    """
    id_empresa = _get_empresa_id(request)
    service = TelasConfigService(db)

    count = await service.reset_tipo(id_empresa, tp_tipo)

    return {
        "message": f"Configurações do tipo {tp_tipo.value} resetadas",
        "tp_tipo": tp_tipo.value,
        "registros_removidos": count,
    }
