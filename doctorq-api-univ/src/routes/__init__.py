"""
Rotas do DoctorQ Universidade da Beleza
"""
from src.routes.certificado import router as certificado_router
from src.routes.notificacao import router as notificacao_router
from src.routes.webhook_video import router as webhook_video_router

__all__ = [
    "certificado_router",
    "notificacao_router",
    "webhook_video_router",
]
