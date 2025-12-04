"""
Middleware de Autenticacao
"""
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, Header, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.config import logger
from src.config.settings import settings


security = HTTPBearer(auto_error=False)


async def verify_api_key(
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> bool:
    """
    Verifica API Key no header Authorization

    Returns:
        bool: True se valido
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    # Verifica Bearer token
    token = authorization.credentials
    if token != settings.API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API Key"
        )

    return True


async def get_current_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    """
    Extrai user ID do header ou valida API key

    Headers aceitos:
    - X-User-ID: UUID do usuario
    - Authorization: Bearer {API_KEY}

    Returns:
        str: ID do usuario ou "system" se apenas API key
    """
    # Se tem X-User-ID, usa diretamente
    if x_user_id:
        try:
            # Valida se é UUID válido
            UUID(x_user_id)
            return x_user_id
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="X-User-ID deve ser um UUID válido"
            )

    # Se nao tem X-User-ID, valida API key e retorna "system"
    if authorization:
        token = authorization.credentials
        if token == settings.API_KEY:
            return "system"
        else:
            raise HTTPException(
                status_code=403,
                detail="Invalid API Key"
            )

    raise HTTPException(
        status_code=401,
        detail="Authorization required. Use X-User-ID header ou Bearer token"
    )


async def get_optional_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Extrai user ID de forma opcional

    Returns:
        Optional[str]: ID do usuario ou None
    """
    if x_user_id:
        try:
            UUID(x_user_id)
            return x_user_id
        except ValueError:
            return None

    if authorization and authorization.credentials == settings.API_KEY:
        return "system"

    return None


class AuthMiddleware:
    """Middleware de autenticacao para todas as rotas"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Rotas publicas (sem auth)
            public_paths = ["/", "/health", "/ready", "/docs", "/redoc", "/openapi.json"]
            path = scope.get("path", "")

            if path not in public_paths:
                headers = dict(scope.get("headers", []))
                auth_header = headers.get(b"authorization", b"").decode()

                if not auth_header.startswith("Bearer "):
                    # Permite continuar, auth será validada na rota
                    pass

        await self.app(scope, receive, send)
