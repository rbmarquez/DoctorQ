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
from fastapi.staticfiles import StaticFiles

# Importar função de formatação de erro
# REMOVIDO: src.agents movido para DoctorQ-service-ai
# from src.agents.dtos import format_validation_error
from src.config.cache_config import init_cache, is_cache_enabled
from src.config.logger_config import get_logger
from src.config.settings import get_settings

# Importar configurações
from src.config.orm_config import ORMConfig
from src.routes.credencial import router as credencial_router
from src.routes.apikey import router as apikey_router
from src.routes.variable import router as variable_router
from src.routes.sei import router as sei_router
from src.routes.search_advanced import router as search_advanced_router

# Importar rotas
from src.routes.upload import router as upload_router
from src.routes.user import router as user_router
from src.routes.perfil import router as perfil_router
from src.routes.empresa import router as empresa_router
from src.routes.prompt_library import router as prompt_library_router
from src.routes.marketplace import router as marketplace_router
from src.routes.billing import router as billing_router
from src.routes.templates import router as templates_router
from src.routes.analytics import router as analytics_router
from src.routes.dashboard_route import router as dashboard_router
from src.routes.onboarding import router as onboarding_router
from src.routes.analytics_search import router as analytics_search_router
from src.routes.cupom import router as cupom_router
from src.routes.produtos_route import router as produtos_router
from src.routes.produtos_api_route import router as produtos_api_router
from src.routes.procedimentos_route import router as procedimentos_router
from src.routes.fornecedores_route import router as fornecedores_router
from src.routes.carrinho_route import router as carrinho_router
from src.routes.pedidos_route import router as pedidos_router
from src.routes.qrcodes_route import router as qrcodes_router
from src.routes.avaliacoes_route import router as avaliacoes_router
from src.routes.agendamentos_route import router as agendamentos_router
from src.routes.agentes_route import router as agentes_router
from src.routes.whatsapp_route import router as whatsapp_router
from src.routes.favoritos_route import router as favoritos_router
from src.routes.notificacoes_route import router as notificacoes_router
from src.routes.mensagens_route import router as mensagens_router
from src.routes.fotos_route import router as fotos_router
from src.routes.fotos_upload import router as fotos_upload_router
from src.routes.transacoes_route import router as transacoes_router
from src.routes.conversas_route import router as conversas_router
from src.routes.configuracoes_route import router as configuracoes_router
from src.routes.profissionais_route import router as profissionais_router
from src.routes.profissional_consolidacao_route import router as profissional_consolidacao_router
from src.routes.clinicas_route import router as clinicas_router
from src.routes.clinica_team_route import router as clinica_team_router
from src.routes.albums_route import router as albums_router
from src.routes.partner_lead import router as partner_lead_router
from src.routes.partner_package import router as partner_package_router
from src.routes.partner_lead_questions_route import router as partner_lead_questions_router
from src.routes.partner_license import router as partner_license_router
from src.routes.partner_activation import router as partner_activation_router
from src.routes.partner_route import router as partner_router
from src.routes.partner_upgrade import router as partner_upgrade_router
from src.routes.pagamentos_route import router as pagamentos_router
from src.routes.permissions import router as permissions_router
from src.routes.telas_config import router as telas_config_router
from src.routes.anamnese import router as anamnese_router
from src.routes.lembrete import router as lembrete_router
from src.routes.paciente import router as paciente_router
from src.routes.estoque import router as estoque_router
from src.routes.rastreamento import router as rastreamento_router
from src.routes.nota_fiscal import router as nota_fiscal_router
from src.routes.broadcast import router as broadcast_router
from src.routes.export import router as export_router
from src.routes.webhook_route import router as webhook_router
from src.websocket.chat_websocket import router as websocket_router
# REMOVIDO: Rotas de IA movidas para DoctorQ-service-ai
# from src.routes.agent import router as agent_router
# from src.routes.tool import router as tool_router

# Sistema de Carreiras (Jobs & Recruitment)
from src.routes.curriculo import router as curriculo_router
from src.routes.vaga import router as vaga_router
from src.routes.candidatura import router as candidatura_router
from src.routes.favorito import router as favorito_router

# Central de Atendimento Omnichannel
from src.central_atendimento.routes.central_atendimento_route import router as central_atendimento_router
from src.central_atendimento.routes.webhook_route import router as central_atendimento_webhook_router
from src.central_atendimento.routes.websocket_route import router as central_atendimento_ws_router
from src.central_atendimento.routes.handoff_route import router as handoff_router
from src.central_atendimento.routes.widget_route import router as widget_router
from src.central_atendimento.services.fila_processor_service import (
    start_fila_processor,
    stop_fila_processor,
)
from src.central_atendimento.services.message_orchestrator_service import (
    start_message_orchestrator,
    stop_message_orchestrator,
)
from src.central_atendimento.services.websocket_chat_gateway import (
    start_chat_gateway,
    stop_chat_gateway,
)
from src.central_atendimento.services.websocket_notification_service import (
    start_notification_service,
    stop_notification_service,
)
from src.central_atendimento.services.campanha_worker import (
    iniciar_campanha_worker,
    parar_campanha_worker,
)

logger = get_logger("main")

# Carregar variáveis de ambiente
load_dotenv(override=True)
settings = get_settings()


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Configurar logging
    root_handlers = logging.getLogger().handlers
    for name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
        logger_uv = logging.getLogger(name)
        logger_uv.handlers = root_handlers.copy()
        if name == "uvicorn.error":
            logger_uv.propagate = False

    logger.debug("Iniciando aplicação")

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
                "  %s  %s [%s]", f"{methods:15}", f"{route.path:20}", filename
            )

    try:
        # Inicializar banco de dados
        logger.debug("Inicializando conexão com banco de dados...")
        try:
            # Verificar se a variável de ambiente DATABASE_URL está definida
            await ORMConfig.initialize_database()
            logger.debug("Banco de dados inicializado com sucesso")

            # 2. Inicializar cache Redis usando CacheConfig
            logger.debug("Inicializando cache Redis...")

            async with ORMConfig.get_session() as db_session:
                await init_cache(
                    db_session=db_session,
                    use_credentials=True,
                )

            if is_cache_enabled():
                logger.debug("Cache Redis inicializado e funcionando")
            else:
                logger.info(
                    "Cache Redis configurado - será carregado automaticamente da primeira credencial Redis disponível"
                )

        except Exception as e:
            logger.error(f"Erro crítico no banco de dados: {str(e)}")
            logger.error("Aplicação não pode continuar sem banco de dados")
            raise

        # Iniciar processador de fila de atendimento
        try:
            await start_fila_processor()
            logger.info("Processador de fila de atendimento iniciado")
        except Exception as e:
            logger.warning(f"Não foi possível iniciar processador de fila: {str(e)}")

        # Iniciar orquestrador de mensagens (Central de Atendimento)
        try:
            await start_message_orchestrator()
            logger.info("Orquestrador de mensagens iniciado")
        except Exception as e:
            logger.warning(f"Não foi possível iniciar orquestrador de mensagens: {str(e)}")

        # Iniciar gateway WebSocket de chat
        try:
            await start_chat_gateway()
            logger.info("Gateway WebSocket de chat iniciado")
        except Exception as e:
            logger.warning(f"Não foi possível iniciar gateway WebSocket: {str(e)}")

        # Iniciar serviço de notificações WebSocket
        try:
            await start_notification_service()
            logger.info("Serviço de notificações WebSocket iniciado")
        except Exception as e:
            logger.warning(f"Não foi possível iniciar serviço de notificações: {str(e)}")

        # Iniciar worker de campanhas de marketing
        try:
            await iniciar_campanha_worker()
            logger.info("Worker de campanhas iniciado")
        except Exception as e:
            logger.warning(f"Não foi possível iniciar worker de campanhas: {str(e)}")

        await asyncio.sleep(0.1)
        logger.debug("Aplicação pronta para uso!")
        yield
    except Exception as e:
        logger.error("Erro fatal durante inicialização: %s", str(e))
        raise
    finally:
        # Parar worker de campanhas
        try:
            await parar_campanha_worker()
            logger.debug("Worker de campanhas parado")
        except Exception as e:
            logger.warning(f"Erro ao parar worker de campanhas: {str(e)}")

        # Parar serviço de notificações WebSocket
        try:
            await stop_notification_service()
            logger.debug("Serviço de notificações WebSocket parado")
        except Exception as e:
            logger.warning(f"Erro ao parar serviço de notificações: {str(e)}")

        # Parar gateway WebSocket de chat
        try:
            await stop_chat_gateway()
            logger.debug("Gateway WebSocket de chat parado")
        except Exception as e:
            logger.warning(f"Erro ao parar gateway WebSocket: {str(e)}")

        # Parar orquestrador de mensagens
        try:
            await stop_message_orchestrator()
            logger.debug("Orquestrador de mensagens parado")
        except Exception as e:
            logger.warning(f"Erro ao parar orquestrador de mensagens: {str(e)}")

        # Parar processador de fila
        try:
            await stop_fila_processor()
            logger.debug("Processador de fila parado")
        except Exception as e:
            logger.warning(f"Erro ao parar processador de fila: {str(e)}")

        await ORMConfig.close_connections()
        logger.debug("Finalizando aplicação...")


# Criar aplicação FastAPI
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Adicionar middleware de tenant detection (multi-tenancy)
from src.middleware.tenant_middleware import TenantMiddleware
app.add_middleware(
    TenantMiddleware,
    enable_subdomain=True,  # Detectar tenant via subdomain
    require_tenant=False,   # No exigir tenant em todas as rotas
)

# ⚠️ SEGURANÇA: Middleware de contexto tenant para Row Level Security
# Configura automaticamente app.current_empresa_id no PostgreSQL para
# ativar as policies de RLS e garantir isolamento multi-tenant
from src.middleware.tenant_context_middleware import TenantContextMiddleware
app.add_middleware(TenantContextMiddleware)

# Dependency global para autenticao
app.dependency_overrides = {}

# Importar e adicionar middleware de autenticao
from src.middleware.apikey_auth import ApiKeyAuthMiddleware
from src.middleware.quota_middleware import QuotaEnforcementMiddleware

app.add_middleware(ApiKeyAuthMiddleware)
app.add_middleware(QuotaEnforcementMiddleware)

# Configurar métricas Prometheus (UC116)
from src.middleware.metrics_middleware import setup_metrics
setup_metrics(app)
app.include_router(user_router)
app.include_router(upload_router)
app.include_router(credencial_router)
app.include_router(apikey_router)
app.include_router(variable_router)
app.include_router(search_advanced_router)
app.include_router(sei_router)
app.include_router(empresa_router)
app.include_router(perfil_router)
app.include_router(prompt_library_router)
app.include_router(marketplace_router)
app.include_router(fornecedores_router)
app.include_router(produtos_router)
app.include_router(produtos_api_router)
app.include_router(procedimentos_router)
app.include_router(carrinho_router)
app.include_router(pedidos_router)
app.include_router(cupom_router)
app.include_router(qrcodes_router)
app.include_router(avaliacoes_router)
app.include_router(agendamentos_router)
app.include_router(agentes_router)
app.include_router(whatsapp_router)
app.include_router(favoritos_router)
app.include_router(notificacoes_router)
app.include_router(mensagens_router)
app.include_router(fotos_router)
app.include_router(fotos_upload_router)
app.include_router(transacoes_router)
app.include_router(conversas_router)
# REMOVIDO: Rotas de IA movidas para DoctorQ-service-ai
# app.include_router(agent_router)
# app.include_router(tool_router)
app.include_router(profissionais_router)
app.include_router(profissional_consolidacao_router)
app.include_router(clinicas_router)
app.include_router(clinica_team_router)
app.include_router(albums_router)
app.include_router(configuracoes_router)
app.include_router(billing_router)
app.include_router(pagamentos_router)
app.include_router(partner_lead_router)
app.include_router(partner_package_router)
app.include_router(partner_lead_questions_router)
app.include_router(partner_license_router)
app.include_router(partner_activation_router)
app.include_router(partner_router)
app.include_router(partner_upgrade_router)
app.include_router(permissions_router)
app.include_router(telas_config_router)
app.include_router(anamnese_router)
app.include_router(lembrete_router)
app.include_router(paciente_router)
app.include_router(estoque_router)
app.include_router(rastreamento_router)
app.include_router(nota_fiscal_router)
app.include_router(broadcast_router)
app.include_router(export_router)
app.include_router(webhook_router)
app.include_router(templates_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(analytics_search_router)
app.include_router(onboarding_router)
app.include_router(websocket_router)

# Sistema de Carreiras (Jobs & Recruitment)
app.include_router(curriculo_router)
app.include_router(vaga_router)
app.include_router(candidatura_router)
app.include_router(favorito_router)

# Central de Atendimento Omnichannel
app.include_router(central_atendimento_router)
app.include_router(central_atendimento_webhook_router)
app.include_router(central_atendimento_ws_router, prefix="/ws/central-atendimento")
app.include_router(handoff_router, prefix="/central-atendimento")
app.include_router(widget_router)  # Widget público (sem autenticação)

# Montar diretório de uploads como arquivos estáticos
import os
from pathlib import Path
uploads_dir = Path("uploads")
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler personalizado para erros de validação"""
    # Formato padrão de erro de validação
    logger.warning(f"Erro de validação: {exc.errors()}")

    return JSONResponse(
        status_code=400,
        content={
            "detail": "Erro de validação nos dados fornecidos",
            "errors": exc.errors(),
            "type": "validation_error",
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc):
    """Handler global para exceções otimizado para K8s"""
    # HTTPException deve ser tratada pelo FastAPI padrão, não aqui
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    # Log com mais detalhes para debugging em K8s
    logger.error(
        "Erro não tratado - Path: %s, Method: %s, Error: %s",
        request.url.path,
        request.method,
        str(exc),
    )

    # Verificar se é erro relacionado a memória
    error_msg = str(exc).lower()
    if any(keyword in error_msg for keyword in ["memory", "malloc", "out of memory"]):
        logger.critical("Erro de memória detectado - pod pode precisar restart")
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Serviço temporariamente indisponível - erro de memória",
                "type": "memory_error",
                "restart_recommended": True,
            },
        )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor",
            "type": "internal_server_error",
            "path": request.url.path,
        },
    )


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": f"InovaIA API v{app.version}",
        "version": app.version,
        "status": "online",
    }


@app.get("/health")
async def health_check():
    """Health check simples para liveness probe do Kubernetes"""
    try:
        return {
            "status": "healthy",
            "timestamp": str(asyncio.get_event_loop().time()),
            "version": app.version,
        }
    except Exception as e:
        logger.error(f"Health check falhou: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


@app.get("/ready")
async def readiness_check():
    """Readiness check para verificar se a API pode processar requisições"""
    try:
        # Verificar memória disponível
        memory = psutil.virtual_memory()
        memory_usage_percent = memory.percent

        # Verificar se há memória suficiente (menos de 90% usado)
        if memory_usage_percent > 90:
            raise HTTPException(
                status_code=503,
                detail=f"Alto uso de memória: {memory_usage_percent:.1f}%",
            )

        # Verificar se o diretório temp existe e é acessível
        temp_dir = "/app/temp/uploads"
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir, exist_ok=True)

        # Verificar se consegue escrever no diretório temp
        temp_writable = os.access(temp_dir, os.W_OK)
        if not temp_writable:
            raise HTTPException(
                status_code=503, detail="Diretório temporário não acessível"
            )

        return {
            "status": "ready",
            "memory_usage": f"{memory_usage_percent:.1f}%",
            "available_memory": f"{memory.available / 1024 / 1024:.0f}MB",
            "temp_dir_accessible": temp_writable,
            "version": app.version,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Readiness check falhou: {e}")
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8080,
        reload=settings.debug,
        log_config=None,
    )
