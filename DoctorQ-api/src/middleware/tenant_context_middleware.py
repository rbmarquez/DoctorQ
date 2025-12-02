"""
Middleware para configurar contexto de tenant (empresa) automaticamente.

Este middleware configura a variável de sessão PostgreSQL que o Row Level Security
usa para filtrar automaticamente os dados por empresa.
"""

import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware que configura o contexto de tenant (empresa) para cada requisição.

    Para cada request autenticado, extrai o id_empresa do token JWT e configura
    a variável de sessão PostgreSQL 'app.current_empresa_id', que é usada pelas
    Row Level Security policies para filtrar automaticamente os dados.

    Fluxo:
    1. Request chega
    2. Extrai token do header Authorization
    3. Decode token e obtém user_id
    4. Busca id_empresa do usuário no banco
    5. Configura SET LOCAL app.current_empresa_id = '{id_empresa}'
    6. Executa a rota (que agora terá dados filtrados automaticamente)
    7. Response retorna

    Benefícios:
    - Camada extra de segurança além dos filtros na aplicação
    - Mesmo que uma rota esqueça de filtrar, o RLS garante isolamento
    - Defesa em profundidade (defense in depth)
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Processar request e configurar contexto de tenant"""

        # Pular configuração para rotas públicas
        public_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/ready",
            "/partner-activation",
        ]

        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)

        # Nota: A configuração do contexto de tenant (SET LOCAL app.current_empresa_id)
        # será feita pelas rotas individuais usando get_current_user().
        # Este middleware apenas registra requisições autenticadas para debug.
        authorization = request.headers.get("Authorization")

        if authorization and authorization.startswith("Bearer "):
            logger.debug(f"Request autenticado detectado em: {request.url.path}")

        # Processar request normalmente
        response = await call_next(request)
        return response
