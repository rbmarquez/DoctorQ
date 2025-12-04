# src/utils/auth.py
import os
import uuid
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig, get_async_session_context
from src.models.user import User
from src.services.apikey_service import ApiKeyService
from src.utils.security import decode_access_token

logger = get_logger(__name__)

# Configurar HTTPBearer para extrair token automaticamente
bearer_scheme = HTTPBearer()


def get_excluded_paths() -> list[str]:
    """
    Retorna lista de rotas excluÃ­das da autenticaÃ§Ã£o.
    Se DISABLE_SWAGGER=true, remove endpoints do Swagger da lista.
    """
    base_paths = [
        "/users/register",
        "/users/login-local",
        "/users/me",
        "/health",
        "/",
        "/vagas",  # Endpoint público de listagem de vagas
        "/webhooks",  # Webhooks externos (WhatsApp, Stripe, Instagram, Facebook)
    ]

    # Adicionar endpoints do Swagger apenas se nÃ£o estiver desabilitado
    disable_swagger = os.getenv("DISABLE_SWAGGER", "false").lower() == "true"

    if not disable_swagger:
        swagger_paths = [
            "/docs",
            "/openapi.json",
            "/redoc",
        ]
        base_paths.extend(swagger_paths)
        logger.debug("Swagger habilitado - endpoints excluÃ­dos da autenticaÃ§Ã£o")
    else:
        logger.debug("Swagger desabilitado - endpoints requerem autenticaÃ§Ã£o")

    return base_paths


# Rotas que NÃƒO requerem autenticaÃ§Ã£o (dinÃ¢micas baseadas em DISABLE_SWAGGER)
EXCLUDED_PATHS = get_excluded_paths()


async def get_current_apikey(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> object:
    """
    Dependency para validar API Key via Bearer token
    SEMPRE exige autenticaÃ§Ã£o vÃ¡lida
    """
    api_key = credentials.credentials

    try:
        # Validar API Key no banco
        async with get_async_session_context() as db:
            service = ApiKeyService(db)
            validated_apikey = await service.get_apikey_by_key(api_key)

            if not validated_apikey:
                logger.warning(f"API Key invÃ¡lida: {api_key[:8]}...")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API Key invÃ¡lida",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            return validated_apikey

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao validar API Key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor",
        ) from e


# Dependency opcional que nÃ£o lanÃ§a erro se nÃ£o houver token
async def get_current_apikey_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[object]:
    """Dependency opcional que retorna None se nÃ£o houver token vÃ¡lido"""
    try:
        if credentials:
            return await get_current_apikey(credentials)
        return None
    except HTTPException:
        return None


def is_path_excluded(path: str) -> bool:
    """
    Verifica se um path estÃ¡ excluÃ­do da autenticaÃ§Ã£o.
    Ãštil para middlewares ou validaÃ§Ãµes condicionais.
    """
    excluded_paths = get_excluded_paths()

    # VerificaÃ§Ã£o exata para "/" para evitar match com todos os paths
    if path == "/":
        return "/" in excluded_paths

    # Para outros paths, usar startswith mas excluir "/"
    other_paths = [p for p in excluded_paths if p != "/"]
    return any(path.startswith(excluded_path) for excluded_path in other_paths)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(ORMConfig.get_session),
) -> User:
    """
    Dependency para extrair o usuário autenticado do JWT token.

    Este dependency é OBRIGATÓRIO para usar o decorator @require_permission.

    Fluxo:
    0. Verifica se middleware já validou API Key (em request.state.api_key)
    1. Extrai o token do header Authorization: Bearer {token}
    2. Tenta decodificar como JWT (para usuários logados via /login-local ou OAuth)
    3. Se JWT válido, extrai user_id e busca User no banco
    4. Se JWT inválido, tenta validar como API Key global
    5. Se API Key válida, retorna um User "system" fictício com papel admin

    Raises:
        HTTPException 401: Token inválido ou expirado
        HTTPException 404: Usuário não encontrado

    Returns:
        User: Objeto User autenticado
    """
    # Verificar se middleware já validou API Key
    if hasattr(request.state, "api_key"):
        api_key = request.state.api_key
        logger.debug(f"✅ Usando API Key validada pelo middleware: {api_key.keyName}")

        # Se a API key tem um user associado, retornar esse user
        # MAS com a empresa da API Key (se definida) para garantir isolamento correto
        if api_key.id_user:
            stmt = select(User).where(
                User.id_user == api_key.id_user,
                User.st_ativo == "S"
            )
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if user:
                # Sobrescrever empresa do usuário com a da API Key (se definida)
                # Isso garante que a API Key controla o escopo de acesso
                if api_key.id_empresa:
                    logger.debug(f"✅ Sobrescrevendo empresa do usuário com a da API Key: {api_key.id_empresa}")
                    user.id_empresa = api_key.id_empresa
                logger.debug(f"✅ Retornando usuário associado à API Key: {user.nm_email} (empresa: {user.id_empresa})")
                return user

        # Criar User fictício com papel admin (bypass de permissões)
        system_user = User(
            id_user=uuid.UUID("00000000-0000-0000-0000-000000000000"),
            nm_email="system@doctorq.api",
            nm_completo="System API Key",
            nm_papel="admin",
            st_ativo='S',
            id_empresa=api_key.id_empresa,
        )
        return system_user

    token = credentials.credentials

    # Tentar decodificar como JWT primeiro (usuários reais)
    payload = decode_access_token(token)

    if payload:
        # JWT válido - extrair user_id
        # "uid" = user ID (UUID), "sub" = subject (email)
        user_id_str = payload.get("uid")

        if not user_id_str:
            logger.warning("JWT sem campo 'uid' (user_id)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: sem identificador de usuário",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            logger.warning(f"user_id inválido no JWT: {user_id_str}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: identificador malformado",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Buscar usuário no banco
        stmt = select(User).where(
            User.id_user == user_id,
            User.st_ativo == "S"
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"Usuário não encontrado ou inativo: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado ou inativo",
            )

        logger.debug(f"✅ Usuário autenticado via JWT: {user.nm_email} (id={user.id_user})")
        return user

    # Se não for JWT, tentar validar como API Key global (fallback para testes/integrações)
    try:
        async with get_async_session_context() as api_db:
            service = ApiKeyService(api_db)
            validated_apikey = await service.get_apikey_by_key(token)

            if validated_apikey:
                # API Key válida - retornar usuário "system" fictício com privilégios admin
                logger.debug(f"✅ Autenticação via API Key global: {validated_apikey.keyName}")

                # Se a API key tem um user associado, retornar esse user
                if validated_apikey.id_user:
                    stmt = select(User).where(
                        User.id_user == validated_apikey.id_user,
                        User.st_ativo == "S"
                    )
                    result = await db.execute(stmt)
                    user = result.scalar_one_or_none()
                    if user:
                        logger.debug(f"✅ Retornando usuário associado à API Key: {user.nm_email}")
                        return user

                # Criar User fictício com papel admin (bypass de permissões)
                # ✅ FIX: Incluir id_empresa da API key para suportar multi-tenant
                system_user = User(
                    id_user=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                    nm_email="system@doctorq.api",
                    nm_completo="System API Key",
                    nm_papel="admin",  # Admin bypass habilitado no decorator
                    st_ativo='S',
                    id_empresa=validated_apikey.id_empresa,  # ✅ FIX: Incluir empresa da API key
                )
                return system_user
    except Exception as e:
        logger.warning(f"Erro ao validar API Key: {str(e)}")

    # Nem JWT nem API Key válidos
    logger.warning(f"Token inválido (não é JWT nem API Key): {token[:8]}...")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de autenticação inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_empresa_from_user(user: User) -> uuid.UUID:
    """
    Extrai o id_empresa do usuário autenticado.

    Args:
        user: Objeto User retornado por get_current_user

    Returns:
        UUID do id_empresa do usuário

    Raises:
        HTTPException 400: Se usuário não tem empresa associada
    """
    if not user.id_empresa:
        logger.warning(f"Usuário {user.nm_email} não tem empresa associada")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não tem empresa associada. Entre em contato com o suporte.",
        )
    return user.id_empresa
