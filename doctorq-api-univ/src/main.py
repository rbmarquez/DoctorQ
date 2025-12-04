"""
DoctorQ Universidade da Beleza - API Principal
"""
import asyncio
from contextlib import asynccontextmanager

import psutil
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import logger, init_db, close_db, check_db_connection
from src.config.settings import settings

# Importar rotas
from src.routes.certificado import router as certificado_router
from src.routes.notificacao import router as notificacao_router
from src.routes.webhook_video import router as webhook_video_router


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Gerenciador de ciclo de vida da aplicacao"""
    logger.info("Iniciando DoctorQ Universidade da Beleza...")

    # Inicializar banco de dados
    try:
        await init_db()
        logger.info("Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco: {e}")
        # Continua mesmo sem banco (para testes)

    # Log das rotas registradas
    for route in application.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            methods = ", ".join(sorted(route.methods))
            logger.debug(f"  {methods:15} {route.path}")

    logger.info(f"Aplicacao pronta na porta {settings.PORT}")
    yield

    # Cleanup
    logger.info("Finalizando aplicacao...")
    await close_db()
    logger.info("Aplicacao finalizada")


# Criar aplicacao FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="API para plataforma de cursos e certificacoes em estetica",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if not settings.DISABLE_SWAGGER else None,
    redoc_url="/redoc" if not settings.DISABLE_SWAGGER else None,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas
app.include_router(certificado_router)
app.include_router(notificacao_router)
app.include_router(webhook_video_router)


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": f"{settings.APP_NAME} v{settings.APP_VERSION}",
        "version": settings.APP_VERSION,
        "status": "online",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """Health check para Kubernetes liveness probe"""
    try:
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "service": "doctorq-api-univ",
        }
    except Exception as e:
        logger.error(f"Health check falhou: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


@app.get("/ready")
async def readiness_check():
    """Readiness check para Kubernetes"""
    try:
        # Verificar memoria
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            raise HTTPException(
                status_code=503,
                detail=f"Alto uso de memoria: {memory.percent:.1f}%"
            )

        # Verificar banco de dados
        db_ok = await check_db_connection()

        return {
            "status": "ready",
            "database": "connected" if db_ok else "disconnected",
            "memory_usage": f"{memory.percent:.1f}%",
            "version": settings.APP_VERSION,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Readiness check falhou: {e}")
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handler global de excecoes"""
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    logger.error(f"Erro nao tratado: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"},
    )


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
