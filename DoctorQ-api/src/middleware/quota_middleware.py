"""
Middleware para enforcement de quotas de uso
Verifica limites do plano antes de permitir operações
"""

from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig
from src.models.billing import UsageMetricType
from src.services.billing_service import BillingService

logger = get_logger(__name__)


class QuotaEnforcementMiddleware(BaseHTTPMiddleware):
    """Middleware para verificar quotas antes de operações custosas"""

    def __init__(self, app):
        super().__init__(app)
        # Rotas que consomem quotas (path -> metric_type)
        self.quota_routes = {
            "/predictions/": UsageMetricType.API_CALLS,
            "/conversas/": UsageMetricType.MESSAGES,
            "/agentes": UsageMetricType.AGENTS,
            "/document-stores": UsageMetricType.DOCUMENT_STORES,
            "/upload/": UsageMetricType.STORAGE_GB,
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Verificar quota antes de processar request"""

        # Verificar se é rota que consome quota
        path = request.url.path
        metric_type = None

        for route_prefix, route_metric in self.quota_routes.items():
            if path.startswith(route_prefix):
                metric_type = route_metric
                break

        # Se não é rota controlada, prosseguir
        if not metric_type or request.method not in ["POST", "PUT"]:
            return await call_next(request)

        # Extrair user_id (ajuste conforme seu sistema de auth)
        user_id = getattr(request.state, "user_id", None)

        if not user_id:
            # Sem user_id, permitir (fail-open)
            return await call_next(request)

        # Verificar quota
        try:
            async with ORMConfig.get_session() as db:
                billing_service = BillingService(db)
                allowed, info = await billing_service.check_quota(user_id, metric_type)

                if not allowed:
                    logger.warning(
                        f"Quota excedida: user={user_id}, metric={metric_type.value}"
                    )
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "error": "Quota Exceeded",
                            "message": info.get("message", "Limite do plano atingido"),
                            "quota_info": info,
                        },
                    )

        except Exception as e:
            logger.error(f"Erro ao verificar quota: {str(e)}")
            # Em caso de erro, permitir (fail-open)
            pass

        # Quota OK, prosseguir
        response = await call_next(request)
        return response
