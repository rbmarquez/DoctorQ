# src/middleware/tenant_middleware.py
"""
Middleware para detecção e isolamento de tenants (empresas).

Este middleware detecta o tenant atual através de:
1. Header X-Tenant-ID (para APIs diretas)
2. Subdomain (empresa.inovaia.com -> empresa)
3. User session (tenant do usuário logado)

E injeta o tenant_id no contexto da requisição para isolamento de dados.
"""

import uuid
from typing import Optional
from contextvars import ContextVar

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger

logger = get_logger(__name__)

# Context variable para armazenar o tenant atual
_tenant_context: ContextVar[Optional[uuid.UUID]] = ContextVar("tenant_id", default=None)


class TenantContext:
    """Classe para gerenciar o contexto de tenant."""

    @staticmethod
    def get_current_tenant() -> Optional[uuid.UUID]:
        """Obtém o tenant atual do contexto."""
        return _tenant_context.get()

    @staticmethod
    def set_current_tenant(tenant_id: Optional[uuid.UUID]) -> None:
        """Define o tenant atual no contexto."""
        _tenant_context.set(tenant_id)

    @staticmethod
    def clear_current_tenant() -> None:
        """Limpa o tenant do contexto."""
        _tenant_context.set(None)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware para detecção automática de tenant.

    Ordem de prioridade:
    1. Header X-Tenant-ID (mais alto)
    2. Subdomain do host
    3. Empresa do usuário autenticado (fallback)
    """

    def __init__(self, app, enable_subdomain: bool = True, require_tenant: bool = False):
        super().__init__(app)
        self.enable_subdomain = enable_subdomain
        self.require_tenant = require_tenant

    async def dispatch(self, request: Request, call_next):
        """Processa a requisição e injeta o tenant."""

        # Limpar contexto anterior
        TenantContext.clear_current_tenant()

        # Rotas públicas que não precisam de tenant
        public_paths = ["/health", "/ready", "/docs", "/openapi.json", "/redoc"]
        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)

        tenant_id = None
        detection_method = None

        # 1. Tentar obter do header X-Tenant-ID
        tenant_header = request.headers.get("X-Tenant-ID")
        if tenant_header:
            try:
                tenant_id = uuid.UUID(tenant_header)
                detection_method = "header"
                logger.debug(f"Tenant detectado via header: {tenant_id}")
            except ValueError:
                logger.warning(f"Header X-Tenant-ID inválido: {tenant_header}")

        # 2. Tentar obter do subdomain (se habilitado)
        if not tenant_id and self.enable_subdomain:
            host = request.headers.get("host", "")
            subdomain = self._extract_subdomain(host)
            if subdomain:
                # TODO: Buscar tenant_id pelo subdomain no banco
                # Por enquanto, vamos apenas logar
                logger.debug(f"Subdomain detectado: {subdomain}")
                detection_method = "subdomain"

        # 3. Tentar obter do usuário autenticado (via state)
        if not tenant_id and hasattr(request.state, "user"):
            user = request.state.user
            if hasattr(user, "id_empresa") and user.id_empresa:
                tenant_id = user.id_empresa
                detection_method = "user_session"
                logger.debug(f"Tenant detectado via usuário: {tenant_id}")

        # Verificar se tenant é obrigatório
        if self.require_tenant and not tenant_id:
            logger.warning(f"Tenant não detectado para rota: {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant ID não fornecido. Use header X-Tenant-ID ou autenticação.",
            )

        # Injetar tenant no contexto
        if tenant_id:
            TenantContext.set_current_tenant(tenant_id)
            request.state.tenant_id = tenant_id
            request.state.tenant_detection_method = detection_method
            logger.info(
                f"Tenant {tenant_id} detectado via {detection_method} "
                f"para {request.method} {request.url.path}"
            )

        # Processar requisição
        response = await call_next(request)

        # Limpar contexto após processamento
        TenantContext.clear_current_tenant()

        return response

    def _extract_subdomain(self, host: str) -> Optional[str]:
        """
        Extrai o subdomain do host.

        Exemplos:
        - empresa.inovaia.com -> empresa
        - localhost:3000 -> None
        - inovaia.com -> None
        """
        # Remover porta se existir
        host_without_port = host.split(":")[0]

        # Dividir por pontos
        parts = host_without_port.split(".")

        # Se tiver mais de 2 partes (subdomain.domain.tld), retornar primeira parte
        if len(parts) > 2:
            return parts[0]

        return None


# Dependency para obter tenant atual
def get_current_tenant() -> Optional[uuid.UUID]:
    """
    Dependency para obter o tenant atual.

    Usage:
        @router.get("/items")
        async def get_items(tenant_id: uuid.UUID = Depends(get_current_tenant)):
            # tenant_id será automaticamente injetado
            ...
    """
    tenant_id = TenantContext.get_current_tenant()
    return tenant_id


def require_tenant() -> uuid.UUID:
    """
    Dependency que requer um tenant válido.

    Lança exceção se tenant não estiver disponível.

    Usage:
        @router.get("/items")
        async def get_items(tenant_id: uuid.UUID = Depends(require_tenant)):
            # Garante que tenant_id existe
            ...
    """
    tenant_id = TenantContext.get_current_tenant()
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context não disponível",
        )
    return tenant_id


# Helper para queries com filtro automático de tenant
class TenantQueryMixin:
    """
    Mixin para adicionar filtro automático de tenant em queries.

    Usage em um service:
        class MyService(TenantQueryMixin):
            async def get_items(self, db: AsyncSession):
                query = select(Item)
                query = self.apply_tenant_filter(query, Item)
                result = await db.execute(query)
                return result.scalars().all()
    """

    def apply_tenant_filter(self, query, model, tenant_id: Optional[uuid.UUID] = None):
        """
        Aplica filtro de tenant na query.

        Args:
            query: SQLAlchemy query
            model: Model que tem campo id_empresa
            tenant_id: Tenant ID (opcional, usa do contexto se não fornecido)
        """
        if tenant_id is None:
            tenant_id = TenantContext.get_current_tenant()

        if tenant_id and hasattr(model, "id_empresa"):
            return query.where(model.id_empresa == tenant_id)

        return query
