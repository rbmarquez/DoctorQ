# src/utils/auth_helpers.py
"""
Helper functions para autenticação e validação de permissões.

Este módulo fornece funções auxiliares para:
- Validar que usuário pertence à empresa solicitada
- Extrair informações do JWT de forma segura
- Garantir isolamento multi-tenant (RLS)
"""

import uuid
from typing import Optional

from fastapi import HTTPException, Request


def validate_empresa_access(request: Request, id_empresa_param: str) -> uuid.UUID:
    """
    Valida que o usuário autenticado pertence à empresa solicitada.

    Esta função implementa Row-Level Security (RLS) garantindo que usuários
    só possam acessar dados da sua própria empresa.

    Args:
        request: Request object do FastAPI
        id_empresa_param: ID da empresa sendo acessada (string UUID)

    Returns:
        UUID: ID da empresa validado

    Raises:
        HTTPException 401: Se não houver JWT válido
        HTTPException 403: Se usuário não pertence à empresa solicitada
        HTTPException 400: Se ID da empresa for inválido

    Example:
        ```python
        @router.get("/clinicas/{id_empresa}/agendamentos/")
        async def listar_agendamentos(
            id_empresa: str,
            request: Request,
        ):
            # Valida acesso e retorna UUID
            id_empresa_uuid = validate_empresa_access(request, id_empresa)
            # Agora pode usar id_empresa_uuid com segurança
        ```
    """
    from src.middleware.apikey_auth import get_current_user

    # 1. Extrair usuário do JWT
    try:
        current_user = get_current_user(request)
    except HTTPException:
        raise HTTPException(
            status_code=401,
            detail="Token JWT inválido ou expirado"
        )

    if not current_user or not current_user.get("uid"):
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou ausente"
        )

    # 2. Extrair id_empresa do JWT
    user_empresa_id = current_user.get("id_empresa")

    if not user_empresa_id:
        raise HTTPException(
            status_code=403,
            detail="Usuário não possui empresa associada. Entre em contato com o suporte."
        )

    # 3. Validar UUID do parâmetro
    try:
        id_empresa_uuid = uuid.UUID(id_empresa_param)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail=f"ID de empresa inválido: {id_empresa_param}"
        )

    # 4. Comparar com o id_empresa do usuário
    if str(user_empresa_id) != str(id_empresa_uuid):
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para acessar dados desta empresa"
        )

    return id_empresa_uuid


def get_user_empresa_id(request: Request) -> Optional[uuid.UUID]:
    """
    Extrai o ID da empresa do usuário autenticado (via JWT ou API Key).

    Args:
        request: Request object do FastAPI

    Returns:
        Optional[UUID]: ID da empresa ou None se não houver JWT

    Raises:
        HTTPException 401: Se JWT inválido
        HTTPException 403: Se usuário não tem empresa associada

    Example:
        ```python
        @router.get("/meus-agendamentos/")
        async def listar_meus_agendamentos(request: Request):
            id_empresa = get_user_empresa_id(request)
            # Buscar agendamentos filtrados por id_empresa
        ```
    """
    from src.middleware.apikey_auth import get_current_user_optional, get_current_apikey_optional

    # Tentar obter JWT primeiro
    current_user = get_current_user_optional(request)

    if current_user:
        # Autenticado via JWT
        user_empresa_id = current_user.get("id_empresa")

        if not user_empresa_id:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada"
            )

        try:
            return uuid.UUID(str(user_empresa_id))
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=500,
                detail="ID de empresa inválido no token"
            )

    # Se não houver JWT, tentar API Key
    api_key = get_current_apikey_optional(request)

    if api_key:
        # Autenticado via API Key
        if not hasattr(api_key, 'id_empresa') or not api_key.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="API Key não possui empresa associada"
            )

        try:
            return uuid.UUID(str(api_key.id_empresa))
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=500,
                detail="ID de empresa inválido na API Key"
            )

    # Nem JWT nem API Key
    raise HTTPException(
        status_code=401,
        detail="Autenticação requerida (JWT ou API Key)"
    )


def get_user_id(request: Request) -> uuid.UUID:
    """
    Extrai o ID do usuário autenticado do JWT.

    Args:
        request: Request object do FastAPI

    Returns:
        UUID: ID do usuário

    Raises:
        HTTPException 401: Se JWT inválido ou ausente

    Example:
        ```python
        @router.post("/agendamentos/")
        async def criar_agendamento(request: Request, data: AgendamentoCreate):
            id_usuario = get_user_id(request)
            # Usar id_usuario para auditoria
        ```
    """
    from src.middleware.apikey_auth import get_current_user

    try:
        current_user = get_current_user(request)
    except HTTPException:
        raise HTTPException(
            status_code=401,
            detail="Token JWT inválido ou expirado"
        )

    if not current_user or not current_user.get("uid"):
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou ausente"
        )

    try:
        return uuid.UUID(current_user["uid"])
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=500,
            detail="ID de usuário inválido no token"
        )


async def get_user_profissional_id(request: Request, db) -> Optional[uuid.UUID]:
    """
    Extrai o ID do profissional associado ao usuário autenticado (se existir).

    Args:
        request: Request object do FastAPI
        db: AsyncSession do SQLAlchemy

    Returns:
        Optional[UUID]: ID do profissional se usuário for profissional, None caso contrário

    Example:
        ```python
        @router.get("/meus-pacientes/")
        async def listar_meus_pacientes(request: Request, db: AsyncSession):
            id_profissional = await get_user_profissional_id(request, db)
            if id_profissional:
                # Usuário é profissional
                # Buscar pacientes do profissional
            else:
                # Usuário não é profissional
                # Buscar pacientes da empresa
        ```
    """
    from sqlalchemy import select
    from src.models.profissionais_orm import ProfissionalORM

    try:
        # Tentar obter id_user do JWT ou API Key
        from src.middleware.apikey_auth import get_current_user_optional

        current_user = get_current_user_optional(request)

        if not current_user or not current_user.get("uid"):
            return None

        id_usuario = uuid.UUID(current_user["uid"])

        # Buscar profissional associado ao usuário
        query = select(ProfissionalORM.id_profissional).where(
            ProfissionalORM.id_user == id_usuario,
            ProfissionalORM.st_ativo == True
        )
        result = await db.execute(query)
        id_profissional = result.scalar_one_or_none()

        return uuid.UUID(str(id_profissional)) if id_profissional else None

    except Exception as e:
        # Se houver erro (ex: tabela não existe), retornar None
        return None


def get_user_role(request: Request) -> Optional[str]:
    """
    Extrai o role (perfil) do usuário autenticado do JWT.

    Args:
        request: Request object do FastAPI

    Returns:
        Optional[str]: Role do usuário (admin, gestor_clinica, profissional, recepcionista, paciente) ou None

    Example:
        ```python
        @router.get("/dashboard/")
        async def dashboard(request: Request):
            role = get_user_role(request)
            if role == "profissional":
                # Mostrar dashboard de profissional
            elif role == "admin":
                # Mostrar dashboard admin
        ```
    """
    from src.middleware.apikey_auth import get_current_user_optional

    current_user = get_current_user_optional(request)

    if current_user:
        return current_user.get("role")

    return None
