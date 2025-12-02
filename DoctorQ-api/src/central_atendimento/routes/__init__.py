# src/central_atendimento/routes/__init__.py
"""
Rotas do módulo Central de Atendimento Omnichannel.
"""

from src.central_atendimento.routes.central_atendimento_route import router as central_router
from src.central_atendimento.routes.webhook_route import router as webhook_router
from src.central_atendimento.routes.websocket_route import router as websocket_router
from src.central_atendimento.routes.handoff_route import router as handoff_router
from src.central_atendimento.routes.widget_route import router as widget_router

__all__ = [
    "central_router",
    "webhook_router",
    "websocket_router",
    "handoff_router",
    "widget_router",
]
