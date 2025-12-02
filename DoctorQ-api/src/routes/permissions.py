# src/routes/permissions.py
"""
Rotas para gerenciamento de permissões de usuários

Autor: Claude
Data: 2025-11-05
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.services.permission_service import PermissionService, get_permission_service
from src.utils.auth import get_current_apikey
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

router = APIRouter(prefix="/permissions", tags=["permissions"])


# ==========================================
# Pydantic Models para Request/Response
# ==========================================


class CheckGroupAccessRequest(BaseModel):
    """Request para verificar acesso a grupo"""

    user_id: str
    grupo: str


class CheckGroupAccessResponse(BaseModel):
    """Response para verificar acesso a grupo"""

    has_access: bool
    grupo: str
    user_id: str


class CheckPermissionRequest(BaseModel):
    """Request para verificar permissão específica"""

    user_id: str
    grupo: str
    recurso: str
    acao: str


class CheckPermissionResponse(BaseModel):
    """Response para verificar permissão específica"""

    has_permission: bool
    grupo: str
    recurso: str
    acao: str
    user_id: str


class UserGroupsResponse(BaseModel):
    """Response com grupos do usuário"""

    user_id: str
    grupos: List[str]


class GroupResourcesResponse(BaseModel):
    """Response com recursos de um grupo"""

    user_id: str
    grupo: str
    recursos: List[str]


class ResourceActionsResponse(BaseModel):
    """Response com ações de um recurso"""

    user_id: str
    grupo: str
    recurso: str
    acoes: List[str]


# ==========================================
# Endpoints
# ==========================================


@router.get("/users/{user_id}/permissions")
async def get_user_permissions(
    user_id: str,
    perm_service: PermissionService = Depends(get_permission_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna as permissões completas de um usuário

    Args:
        user_id: ID do usuário

    Returns:
        Dict com:
        - grupos_acesso: List[str] - Grupos permitidos
        - permissoes_detalhadas: Dict - Permissões por grupo/recurso
        - is_admin: bool - Se é admin total
        - nm_perfil: str - Nome do perfil
        - id_perfil: str - ID do perfil
    """
    try:
        # Validar UUID
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Buscar permissões
        permissions = await perm_service.get_user_permissions(user_uuid)

        if not permissions:
            raise HTTPException(
                status_code=404, detail="Usuário não encontrado ou sem perfil"
            )

        return permissions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar permissões do usuário {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/users/{user_id}/groups", response_model=UserGroupsResponse)
async def get_user_groups(
    user_id: str,
    perm_service: PermissionService = Depends(get_permission_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna a lista de grupos que o usuário pode acessar

    Args:
        user_id: ID do usuário

    Returns:
        UserGroupsResponse com lista de grupos
    """
    try:
        # Validar UUID
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Buscar grupos
        grupos = await perm_service.get_user_groups(user_uuid)

        return UserGroupsResponse(user_id=user_id, grupos=grupos)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar grupos do usuário {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/users/{user_id}/groups/{grupo}/resources", response_model=GroupResourcesResponse)
async def get_group_resources(
    user_id: str,
    grupo: str,
    perm_service: PermissionService = Depends(get_permission_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna a lista de recursos que o usuário pode acessar em um grupo específico

    Args:
        user_id: ID do usuário
        grupo: Nome do grupo (admin, clinica, profissional, etc)

    Returns:
        GroupResourcesResponse com lista de recursos
    """
    try:
        # Validar UUID
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Buscar recursos
        recursos = await perm_service.get_group_resources(user_uuid, grupo)

        return GroupResourcesResponse(user_id=user_id, grupo=grupo, recursos=recursos)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Erro ao buscar recursos do grupo {grupo} para usuário {user_id}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get(
    "/users/{user_id}/groups/{grupo}/resources/{recurso}/actions",
    response_model=ResourceActionsResponse,
)
async def get_resource_actions(
    user_id: str,
    grupo: str,
    recurso: str,
    perm_service: PermissionService = Depends(get_permission_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna a lista de ações que o usuário pode executar em um recurso específico

    Args:
        user_id: ID do usuário
        grupo: Nome do grupo
        recurso: Nome do recurso

    Returns:
        ResourceActionsResponse com lista de ações
    """
    try:
        # Validar UUID
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Buscar ações
        acoes = await perm_service.get_resource_actions(user_uuid, grupo, recurso)

        return ResourceActionsResponse(
            user_id=user_id, grupo=grupo, recurso=recurso, acoes=acoes
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Erro ao buscar ações do recurso {grupo}/{recurso} para usuário {user_id}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/check-group-access", response_model=CheckGroupAccessResponse)
async def check_group_access(
    request: CheckGroupAccessRequest,
    perm_service: PermissionService = Depends(get_permission_service),
    _: object = Depends(get_current_apikey),
):
    """
    Verifica se um usuário tem acesso a um grupo específico (Nível 1)

    Args:
        request: CheckGroupAccessRequest com user_id e grupo

    Returns:
        CheckGroupAccessResponse com resultado da verificação
    """
    try:
        # Validar UUID
        try:
            user_uuid = uuid.UUID(request.user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Verificar acesso
        has_access = await perm_service.check_group_access(user_uuid, request.grupo)

        return CheckGroupAccessResponse(
            has_access=has_access, grupo=request.grupo, user_id=request.user_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Erro ao verificar acesso ao grupo {request.grupo} para usuário {request.user_id}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/check-permission", response_model=CheckPermissionResponse)
async def check_permission(
    request: CheckPermissionRequest,
    perm_service: PermissionService = Depends(get_permission_service),
    _: object = Depends(get_current_apikey),
):
    """
    Verifica se um usuário tem permissão para uma ação específica (Nível 2)

    Args:
        request: CheckPermissionRequest com user_id, grupo, recurso e acao

    Returns:
        CheckPermissionResponse com resultado da verificação
    """
    try:
        # Validar UUID
        try:
            user_uuid = uuid.UUID(request.user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Verificar permissão
        has_permission = await perm_service.check_feature_permission(
            user_uuid, request.grupo, request.recurso, request.acao
        )

        return CheckPermissionResponse(
            has_permission=has_permission,
            grupo=request.grupo,
            recurso=request.recurso,
            acao=request.acao,
            user_id=request.user_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Erro ao verificar permissão {request.grupo}/{request.recurso}/{request.acao} "
            f"para usuário {request.user_id}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/users/{user_id}/is-admin")
async def is_admin(
    user_id: str,
    perm_service: PermissionService = Depends(get_permission_service),
    _: object = Depends(get_current_apikey),
):
    """
    Verifica se o usuário é administrador total do sistema

    Args:
        user_id: ID do usuário

    Returns:
        Dict com is_admin: bool
    """
    try:
        # Validar UUID
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Verificar se é admin
        is_admin_user = await perm_service.is_admin(user_uuid)

        return {"is_admin": is_admin_user, "user_id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar se usuário {user_id} é admin: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
