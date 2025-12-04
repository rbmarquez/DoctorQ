# src/main.py
import asyncio
import logging
import os
from contextlib import asynccontextmanager

import psutil
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Importar função de formatação de erro
from src.agents.dtos import format_validation_error
from src.config.cache_config import init_cache, is_cache_enabled
from src.config.logger_config import get_logger

# Importar configurações
from src.config.orm_config import ORMConfig, AsyncSessionContext

# ✅ IMPORTANTE: Importar modelos na ordem correta ANTES das rotas
# Isso garante que o SQLAlchemy inicialize os mappers na ordem de dependência
from src.models import (  # noqa: F401
    Base, Empresa, Perfil, User, PasswordResetToken,
    Agent, ApiKey, Conversation, Message, DocumentoStore, Tool, Variable, Credencial
)

# Importar rotas
from src.routes.agent import router as agent_router
from src.routes.analytics_agents import router as analytics_agents_router
from src.routes.apikey import router as apikey_router
from src.routes.conversation import router as conversation_router
from src.routes.credencial import router as credencial_router
from src.routes.documento_store import router as documento_store_router
from src.routes.message import router as message_router
from src.routes.prediction import router as prediction_router
from src.routes.sync import router as sync_router
from src.routes.tool import router as tool_router
from src.routes.variable import router as variable_router

logger = get_logger("main")

# Carregar variáveis de ambiente
load_dotenv(override=True)


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Configurar logging
    root_handlers = logging.getLogger().handlers
    for name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
        logger_uv = logging.getLogger(name)
        logger_uv.handlers = root_handlers.copy()
        if name == "uvicorn.error":
            logger_uv.propagate = False

    logger.debug("Iniciando aplicação DoctorQ AI Service")

    # Log das rotas registradas
    for route in application.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            methods = ", ".join(sorted(route.methods))

            # Obter o nome do arquivo da rota
            filename = "unknown"
            if hasattr(route, "endpoint") and route.endpoint:
                module = getattr(route.endpoint, "__module__", None)
                if module:
                    # Extrai apenas o nome do arquivo do módulo
                    filename = module.split(".")[-1] if "." in module else module

            logger.debug(
                "  %s → %s [%s]", f"{methods:15}", f"{route.path:20}", filename
            )

    try:
        # Inicializar banco de dados
        logger.debug("Inicializando conexão com banco de dados...")
        try:
            # Verificar se a variável de ambiente DATABASE_URL está definida
            await ORMConfig.initialize_database()
            logger.debug("Banco de dados inicializado com sucesso")

            # Inicializar cache Redis usando variáveis de ambiente
            logger.debug("Inicializando cache Redis...")

            async with AsyncSessionContext() as db_session:
                await init_cache(
                    db_session=db_session,
                )

            if is_cache_enabled():
                logger.debug("Cache Redis inicializado e funcionando")
            else:
                logger.info(
                    "Cache Redis configurado - usando variáveis de ambiente (.env)"
                )

        except Exception as e:
            logger.error(f"Erro crítico no banco de dados: {str(e)}")
            logger.error("Aplicação não pode continuar sem banco de dados")
            raise

        await asyncio.sleep(0.1)
        logger.debug("Aplicação pronta para uso!")
        yield
    except Exception as e:
        logger.error("Erro fatal durante inicialização: %s", str(e))
        raise
    finally:
        await ORMConfig.close_connections()
        logger.debug("Finalizando aplicação...")


# Criar aplicação FastAPI
app = FastAPI(
    title="DoctorQ AI Service",
    description="Serviço de IA com agentes conversacionais e RAG para a plataforma DoctorQ",
    version="1.0.0",
    root_path="/ai",
    lifespan=lifespan,
    docs_url="/docs" if not os.getenv("DISABLE_SWAGGER", "false").lower() == "true" else None,
    redoc_url="/redoc" if not os.getenv("DISABLE_SWAGGER", "false").lower() == "true" else None,
)

# Configurar CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(agent_router)
app.include_router(analytics_agents_router)
app.include_router(apikey_router)
app.include_router(conversation_router)
app.include_router(credencial_router)
app.include_router(documento_store_router)
app.include_router(message_router)
app.include_router(prediction_router)
app.include_router(sync_router)
app.include_router(tool_router)
app.include_router(variable_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler personalizado para erros de validação"""
    try:
        # Usar nossa função de formatação personalizada
        formatted_error = format_validation_error(exc)
        logger.warning(f"Erro de validação: {formatted_error}")

        return JSONResponse(
            status_code=400,
            content={
                "error": "Validation Error",
                "detail": formatted_error,
            },
        )
    except Exception as format_error:
        # Fallback para o formato padrão do FastAPI se a formatação falhar
        logger.error(f"Erro ao formatar erro de validação: {str(format_error)}")
        return JSONResponse(
            status_code=400,
            content={
                "error": "Validation Error",
                "detail": exc.errors(),
            },
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler personalizado para HTTPException"""
    logger.warning(f"HTTPException: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler genérico para exceções não tratadas"""
    logger.error(f"Exceção não tratada: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)},
    )


@app.get("/health/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "doctorq-ai-service"}


@app.get("/ready/", tags=["Health"])
async def readiness_check():
    """
    Readiness check endpoint
    Verifica se o serviço está pronto para receber requisições
    """
    try:
        # Verificar memória
        memory_percent = psutil.virtual_memory().percent
        if memory_percent > 90:
            raise HTTPException(
                status_code=503, detail=f"Alta utilização de memória: {memory_percent}%"
            )

        # Verificar conexão com banco de dados
        async with AsyncSessionContext() as db:
            await db.execute("SELECT 1")

        return {
            "status": "ready",
            "service": "doctorq-ai-service",
            "memory_percent": memory_percent,
        }
    except Exception as e:
        logger.error(f"Readiness check falhou: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")


# Entry point para execução direta
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8082)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
