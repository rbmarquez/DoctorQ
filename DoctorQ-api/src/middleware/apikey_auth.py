# src/middleware/apikey_auth.py
from typing import Optional

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from src.config.logger_config import get_logger
from src.config.orm_config import get_async_session_context
from src.services.apikey_service import ApiKeyService
from src.utils.security import decode_access_token

logger = get_logger(__name__)


class ApiKeyAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware para autenticação via Bearer Token (API Key ou JWT).

    Suporta dois métodos de autenticação:
    1. API Key global (para integrações e admin bypass)
    2. JWT Token (para usuários autenticados com permissões granulares)
    """

    def __init__(self, app, excluded_paths: Optional[list] = None):
        super().__init__(app)
        # Paths que NÃO requerem autenticação
        self.excluded_paths = excluded_paths or [
            "/users/login-local",
            "/users/register",
            "/health",
            "/vagas",  # Endpoint público de vagas
            "/partner/lead-questions/public",  # Endpoints públicos de perguntas de leads
            "/profissionais/public",  # Endpoint público de visualização de profissionais
            "/webhooks",  # Webhooks externos (WhatsApp, Stripe, Instagram, Facebook)
            "/widget",  # Widget de chat embeddable (público para sites de clínicas)
            "/handoff",  # Handoff do chatbot para atendimento humano (usado pelo widget)
            "/central-atendimento/handoff",  # Handoff via Central de Atendimento

            "/docs",
            "/openapi.json",
            "/redoc",
        ]

    def _extract_bearer_token(self, authorization_header: str) -> Optional[str]:
        """Extrai o token do header Authorization: Bearer <token>"""
        if not authorization_header:
            return None

        parts = authorization_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        return parts[1]

    async def _try_validate_jwt(self, token: str) -> Optional[dict]:
        """
        Tenta validar token como JWT.
        Retorna payload se válido, None caso contrário.
        """
        try:
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                logger.debug(f"✅ JWT válido detectado: user_id={payload.get('sub')}")
                return payload
            return None
        except Exception as e:
            logger.debug(f"Token não é JWT válido: {str(e)}")
            return None

    async def dispatch(self, request: Request, call_next):
        """
        Intercepta requests e valida Bearer Token (API Key ou JWT).

        Fluxo:
        1. Verifica se rota está excluída
        2. Extrai token Bearer do header Authorization
        3. Tenta validar como API Key (tabela tb_api_keys)
        4. Se falhar, tenta validar como JWT (decode_access_token)
        5. Se ambos falharem, retorna HTTP 401
        6. Se algum for válido, permite request continuar
        """

        # Permitir preflight CORS sem exigir autenticação
        if request.method.upper() == "OPTIONS":
            return await call_next(request)

        # Verificar se a rota está excluída da autenticação
        path = request.url.path
        logger.debug(f"🔍 Middleware interceptou: {path}")

        is_excluded = any(
            path.startswith(excluded_path) for excluded_path in self.excluded_paths
        )

        if is_excluded:
            logger.debug(f"✅ Permitindo acesso sem auth para: {path}")
            return await call_next(request)

        # Verificar header Authorization
        authorization = request.headers.get("Authorization")

        if not authorization:
            logger.warning(f"❌ Acesso negado - Authorization header ausente: {path}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header requerido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Extrair token Bearer
        token = self._extract_bearer_token(authorization)

        if not token:
            logger.warning(f"❌ Bearer token malformado: {path}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bearer token inválido ou ausente",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # ESTRATÉGIA 1: Tentar validar como API Key global
        try:
            async with get_async_session_context() as db:
                service = ApiKeyService(db)
                validated_apikey = await service.get_apikey_by_key(token)

                if validated_apikey:
                    # API Key válida - marcar request e continuar
                    logger.debug(f"✅ Autenticado via API Key: {validated_apikey.keyName}")
                    request.state.api_key = validated_apikey
                    request.state.auth_method = "bearer_apikey"

                    response = await call_next(request)
                    response.headers["X-Auth-Method"] = "bearer_apikey"
                    response.headers["X-API-Key-Name"] = validated_apikey.keyName
                    return response

        except Exception as e:
            logger.debug(f"Erro ao validar como API Key: {str(e)}")

        # ESTRATÉGIA 2: Tentar validar como JWT Token
        jwt_payload = await self._try_validate_jwt(token)

        if jwt_payload:
            # JWT válido - marcar request e continuar
            # A validação de permissões será feita pelo decorator @require_permission
            logger.debug(f"✅ Autenticado via JWT: user_id={jwt_payload.get('sub')}")
            request.state.jwt_payload = jwt_payload
            request.state.auth_method = "jwt"

            response = await call_next(request)
            response.headers["X-Auth-Method"] = "jwt"
            return response

        # Ambas as estratégias falharam
        logger.warning(
            f"❌ Token inválido (não é API Key nem JWT válido): {path} (token: {token[:8]}...)"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_apikey_optional(request: Request) -> Optional[object]:
    """
    Função helper para obter a API Key atual do request
    Retorna None se não houver API Key validada
    """
    return getattr(request.state, "api_key", None)


def get_current_apikey(request: Request) -> object:
    """
    Função helper para obter a API Key atual do request
    Lança exceção se não houver API Key validada
    """
    apikey = getattr(request.state, "api_key", None)
    if not apikey:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key requerida",
        )
    return apikey


def get_current_user(request: Request) -> dict:
    """
    Função helper para obter dados do usuário autenticado via JWT.
    Lança exceção se não houver JWT validado.

    Returns:
        dict: JWT payload contendo 'sub' (email), 'uid' (id_user), 'role'
    """
    jwt_payload = getattr(request.state, "jwt_payload", None)
    if not jwt_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação JWT requerida",
        )
    return jwt_payload


def get_current_user_optional(request: Request) -> Optional[dict]:
    """
    Função helper para obter dados do usuário autenticado via JWT.
    Retorna None se não houver JWT validado.

    Returns:
        Optional[dict]: JWT payload ou None
    """
    return getattr(request.state, "jwt_payload", None)
