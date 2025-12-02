# src/central_atendimento/routes/widget_route.py
"""
Rotas públicas para o Chat Widget embeddable.

Estas rotas NÃO requerem autenticação, pois são usadas por
visitantes do site da clínica.
"""

import uuid
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import ORMConfig
from src.config.logger_config import get_logger

logger = get_logger(__name__)


async def get_agente_by_id(db: AsyncSession, id_agente: uuid.UUID) -> Optional[dict]:
    """Busca agente diretamente na tabela tb_agentes via SQL."""
    result = await db.execute(
        text("""
            SELECT
                id_agente,
                id_empresa,
                nm_agente,
                ds_agente,
                st_ativo,
                ds_config
            FROM tb_agentes
            WHERE id_agente = :id_agente
              AND st_ativo = true
        """),
        {"id_agente": id_agente}
    )
    row = result.fetchone()
    if row:
        return {
            "id_agente": row.id_agente,
            "id_empresa": row.id_empresa,
            "nm_agente": row.nm_agente,
            "ds_agente": row.ds_agente,
            "st_ativo": row.st_ativo,
            "ds_config": row.ds_config,
        }
    return None


router = APIRouter(
    prefix="/widget",
    tags=["Chat Widget"],
)


# =============================================================================
# Schemas
# =============================================================================


class WidgetConfigResponse(BaseModel):
    """Configuração do widget para inicialização."""

    id_agente: str
    nm_agente: str
    ds_agente: Optional[str] = None
    nm_empresa: Optional[str] = None
    cor_primaria: str = "#6366f1"
    cor_secundaria: str = "#4f46e5"
    mensagem_boas_vindas: str = "Olá! Como posso ajudá-lo hoje?"
    placeholder_input: str = "Digite sua mensagem..."
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class WidgetMessageRequest(BaseModel):
    """Requisição de mensagem do widget."""

    mensagem: str = Field(..., min_length=1, max_length=4000)
    session_id: str = Field(..., description="ID da sessão do visitante")
    nome_visitante: Optional[str] = Field(None, max_length=100)


class WidgetMessageResponse(BaseModel):
    """Resposta de mensagem do widget."""

    resposta: str
    tools_usadas: list[str] = []
    transferir_humano: bool = False


# =============================================================================
# Endpoints
# =============================================================================


@router.get("/{id_agente}/config/")
async def obter_config_widget(
    id_agente: uuid.UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
) -> WidgetConfigResponse:
    """
    Obtém a configuração do widget para o agente especificado.

    Este endpoint é público e retorna apenas informações seguras
    para configurar a aparência do widget.
    """
    try:
        # Buscar agente via SQL direto
        agente = await get_agente_by_id(db, id_agente)

        if not agente:
            raise HTTPException(
                status_code=404,
                detail="Agente não encontrado ou inativo"
            )

        # Buscar nome da empresa via SQL direto
        empresa_result = await db.execute(
            text("SELECT nm_empresa FROM tb_empresas WHERE id_empresa = :id_empresa"),
            {"id_empresa": agente["id_empresa"]}
        )
        empresa_row = empresa_result.fetchone()
        nm_empresa = empresa_row.nm_empresa if empresa_row else None

        # Extrair configurações de aparência do ds_config
        config = agente["ds_config"] or {}
        widget_config = config.get("widget", {}) if isinstance(config, dict) else {}

        return WidgetConfigResponse(
            id_agente=str(agente["id_agente"]),
            nm_agente=agente["nm_agente"],
            ds_agente=agente["ds_agente"],
            nm_empresa=nm_empresa,
            cor_primaria=widget_config.get("cor_primaria", "#6366f1"),
            cor_secundaria=widget_config.get("cor_secundaria", "#4f46e5"),
            mensagem_boas_vindas=widget_config.get(
                "mensagem_boas_vindas",
                "Olá! Como posso ajudá-lo hoje?"
            ),
            placeholder_input=widget_config.get(
                "placeholder_input",
                "Digite sua mensagem..."
            ),
            avatar_url=widget_config.get("avatar_url"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter config do widget: {e}")
        raise HTTPException(status_code=500, detail="Erro interno")


@router.post("/{id_agente}/message/")
async def enviar_mensagem_widget(
    id_agente: uuid.UUID,
    request: WidgetMessageRequest,
    db: AsyncSession = Depends(ORMConfig.get_session),
) -> WidgetMessageResponse:
    """
    Envia uma mensagem para o agente e retorna a resposta.

    Este endpoint é público e permite que visitantes do site
    conversem com o agente de IA.
    """
    try:
        logger.info(f"[Widget] Recebendo mensagem para agente {id_agente}")
        logger.debug(f"[Widget] Session ID: {request.session_id}, Mensagem: {request.mensagem[:50]}...")

        # Buscar agente via SQL direto
        agente = await get_agente_by_id(db, id_agente)

        if not agente:
            logger.warning(f"[Widget] Agente {id_agente} não encontrado")
            raise HTTPException(
                status_code=404,
                detail="Agente não encontrado ou inativo"
            )

        logger.info(f"[Widget] Agente encontrado: {agente['nm_agente']} (empresa: {agente['id_empresa']})")

        # Processar com o agente de IA
        from src.central_atendimento.services.central_agent_service import (
            get_central_agent_service,
        )

        agent_service = get_central_agent_service(db, agente["id_empresa"])

        # Usar session_id como id_conversa para manter histórico
        id_conversa = uuid.UUID(request.session_id) if _is_valid_uuid(request.session_id) else uuid.uuid5(
            uuid.NAMESPACE_DNS,
            request.session_id
        )

        logger.info(f"[Widget] Processando mensagem com conversa {id_conversa}")

        resultado = await agent_service.processar_mensagem(
            mensagem=request.mensagem,
            id_conversa=id_conversa,
            nome_contato=request.nome_visitante,
        )

        # Log do resultado
        if resultado.get("sucesso"):
            logger.info(f"[Widget] Mensagem processada com sucesso")
        else:
            logger.warning(f"[Widget] Processamento com erro: {resultado.get('erro', 'desconhecido')}")

        return WidgetMessageResponse(
            resposta=resultado.get("resposta", "Desculpe, não consegui processar sua mensagem."),
            tools_usadas=resultado.get("tools_usadas", []),
            transferir_humano=resultado.get("transferir_humano", False),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Widget] Erro inesperado ao processar mensagem: {e}", exc_info=True)
        return WidgetMessageResponse(
            resposta="Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
            tools_usadas=[],
            transferir_humano=False,
        )


@router.post("/{id_agente}/message/stream/")
async def enviar_mensagem_widget_stream(
    id_agente: uuid.UUID,
    request: WidgetMessageRequest,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Envia uma mensagem para o agente com resposta em streaming (SSE).

    Ideal para respostas longas, mostrando texto em tempo real.
    """
    try:
        # Buscar agente via SQL direto
        agente = await get_agente_by_id(db, id_agente)

        if not agente:
            raise HTTPException(
                status_code=404,
                detail="Agente não encontrado ou inativo"
            )

        # Processar com streaming
        from src.central_atendimento.services.central_agent_service import (
            get_central_agent_service,
        )

        agent_service = get_central_agent_service(db, agente["id_empresa"])

        id_conversa = uuid.UUID(request.session_id) if _is_valid_uuid(request.session_id) else uuid.uuid5(
            uuid.NAMESPACE_DNS,
            request.session_id
        )

        async def generate():
            try:
                async for chunk in agent_service.processar_mensagem_stream(
                    mensagem=request.mensagem,
                    id_conversa=id_conversa,
                    nome_contato=request.nome_visitante,
                ):
                    import json
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Erro no streaming: {e}")
                import json
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao iniciar streaming: {e}")
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/{id_agente}/embed.js")
async def obter_script_embed(
    id_agente: uuid.UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Retorna o código JavaScript do widget para ser incorporado.

    Uso:
    <script src="https://api.doctorq.app/widget/{id_agente}/embed.js"></script>
    """
    try:
        # Verificar se agente existe e está ativo via SQL direto
        agente = await get_agente_by_id(db, id_agente)

        if not agente:
            raise HTTPException(
                status_code=404,
                detail="Agente não encontrado ou inativo"
            )

        # Retornar o JavaScript do widget
        from fastapi.responses import Response

        js_content = _generate_widget_js(str(id_agente))

        return Response(
            content=js_content,
            media_type="application/javascript",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Access-Control-Allow-Origin": "*",
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar script embed: {e}")
        raise HTTPException(status_code=500, detail="Erro interno")


# =============================================================================
# Helpers
# =============================================================================


def _is_valid_uuid(value: str) -> bool:
    """Verifica se string é um UUID válido."""
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


def _generate_widget_js(id_agente: str) -> str:
    """Gera o código JavaScript do widget com estilo premium."""

    return f'''
(function() {{
    'use strict';

    // Configuração
    const AGENT_ID = '{id_agente}';
    const API_BASE = window.DOCTORQ_API_URL || 'https://api.doctorq.app';
    const WS_BASE = (window.DOCTORQ_WS_URL || API_BASE).replace('http', 'ws');

    // Estado
    let isOpen = false;
    let isMinimized = false;
    let sessionId = localStorage.getItem('doctorq_session_' + AGENT_ID) || generateUUID();
    let config = null;
    let messages = [];

    // Estado do handoff/WebSocket
    let isInHandoff = false;
    let handoffConversaId = null;
    let websocket = null;
    let wsReconnectAttempts = 0;
    let wsPingInterval = null;
    const MAX_WS_RECONNECT_ATTEMPTS = 5;
    const WS_PING_INTERVAL = 30000; // 30 segundos

    // Salvar session
    localStorage.setItem('doctorq_session_' + AGENT_ID, sessionId);

    // Inicialização
    async function init() {{
        try {{
            // Buscar configuração
            const response = await fetch(API_BASE + '/widget/' + AGENT_ID + '/config/');
            if (!response.ok) throw new Error('Agente não encontrado');
            config = await response.json();

            // Criar widget
            createWidget();

        }} catch (error) {{
            console.error('[DoctorQ Widget] Erro ao inicializar:', error);
        }}
    }}

    // Criar elementos do widget
    function createWidget() {{
        // Estilos
        const styles = document.createElement('style');
        styles.textContent = getStyles();
        document.head.appendChild(styles);

        // Container principal
        const container = document.createElement('div');
        container.id = 'doctorq-widget-container';
        container.innerHTML = getWidgetHTML();
        document.body.appendChild(container);

        // Event listeners
        setupEventListeners();

        // Mostrar sugestões iniciais se não houver mensagens
        showWelcomeScreen();
    }}

    // HTML do widget
    function getWidgetHTML() {{
        return `
            <!-- Botão Flutuante com Glow -->
            <div id="doctorq-chat-bubble" class="doctorq-bubble">
                <div class="doctorq-bubble-glow"></div>
                <div class="doctorq-bubble-inner">
                    ${{config.avatar_url ?
                        `<img src="${{config.avatar_url}}" alt="Avatar" class="doctorq-bubble-avatar">` :
                        `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>`
                    }}
                </div>
                <div class="doctorq-bubble-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                </div>
            </div>

            <!-- Janela de Chat Premium -->
            <div id="doctorq-chat-window" class="doctorq-window doctorq-hidden">
                <!-- Border gradient -->
                <div class="doctorq-window-border"></div>

                <!-- Header Premium -->
                <div class="doctorq-header">
                    <div class="doctorq-header-pattern"></div>
                    <div class="doctorq-header-content">
                        <div class="doctorq-header-info">
                            <div class="doctorq-avatar-wrapper">
                                <div class="doctorq-avatar-glow"></div>
                                <div class="doctorq-avatar">
                                    ${{config.avatar_url ? `<img src="${{config.avatar_url}}" alt="Avatar">` : getDefaultAvatar()}}
                                </div>
                                <div class="doctorq-online-indicator"></div>
                            </div>
                            <div class="doctorq-header-text">
                                <div class="doctorq-title">
                                    ${{config.nm_agente}}
                                    <svg class="doctorq-sparkle" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                    </svg>
                                </div>
                                <div class="doctorq-subtitle">${{config.nm_empresa || 'Assistente Virtual Especializada'}}</div>
                            </div>
                        </div>
                        <div class="doctorq-header-actions">
                            <button id="doctorq-minimize" class="doctorq-action-btn" title="Minimizar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="4 14 10 14 10 20"></polyline>
                                    <polyline points="20 10 14 10 14 4"></polyline>
                                    <line x1="14" y1="10" x2="21" y2="3"></line>
                                    <line x1="3" y1="21" x2="10" y2="14"></line>
                                </svg>
                            </button>
                            <button id="doctorq-close" class="doctorq-action-btn" title="Fechar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Conteúdo (escondido quando minimizado) -->
                <div id="doctorq-content" class="doctorq-content">
                    <!-- Área de Mensagens -->
                    <div id="doctorq-messages" class="doctorq-messages"></div>

                    <!-- Input Area Premium -->
                    <div class="doctorq-input-area">
                        <div class="doctorq-input-wrapper">
                            <input
                                type="text"
                                id="doctorq-input"
                                class="doctorq-input"
                                placeholder="${{config.placeholder_input}}"
                            >
                        </div>
                        <button id="doctorq-send" class="doctorq-send-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }}

    // Estilos CSS Premium
    function getStyles() {{
        // Usar cores configuradas ou gradiente pink/purple padrão
        const primary = config.cor_primaria || '#ec4899';
        const secondary = config.cor_secundaria || '#8b5cf6';

        return `
            #doctorq-widget-container {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                --doctorq-primary: ${{primary}};
                --doctorq-secondary: ${{secondary}};
            }}

            /* ===== BOTÃO FLUTUANTE PREMIUM ===== */
            .doctorq-bubble {{
                position: fixed;
                bottom: 32px;
                right: 32px;
                width: 80px;
                height: 80px;
                cursor: pointer;
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
            }}

            .doctorq-bubble-glow {{
                position: absolute;
                inset: -4px;
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}}, #6366f1);
                border-radius: 50%;
                opacity: 0.75;
                filter: blur(12px);
                animation: doctorq-pulse 2s infinite;
            }}

            .doctorq-bubble-inner {{
                position: relative;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}}, #6366f1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
                border: 4px solid white;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }}

            .doctorq-bubble:hover .doctorq-bubble-inner {{
                transform: scale(1.1);
                box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
            }}

            .doctorq-bubble-avatar {{
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
            }}

            .doctorq-bubble-badge {{
                position: absolute;
                top: -4px;
                right: -4px;
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #ef4444, #ec4899);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                animation: doctorq-badge-pulse 2s infinite;
            }}

            @keyframes doctorq-pulse {{
                0%, 100% {{ opacity: 0.75; }}
                50% {{ opacity: 1; }}
            }}

            @keyframes doctorq-badge-pulse {{
                0%, 100% {{ transform: scale(1); }}
                50% {{ transform: scale(1.2); }}
            }}

            /* ===== JANELA DE CHAT PREMIUM ===== */
            .doctorq-window {{
                position: fixed;
                bottom: 32px;
                right: 32px;
                width: 440px;
                max-width: calc(100vw - 64px);
                height: 700px;
                max-height: calc(100vh - 64px);
                background: linear-gradient(135deg, #faf5ff, white, #fdf4ff);
                border-radius: 24px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                z-index: 999999;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }}

            .doctorq-window.doctorq-minimized {{
                height: 80px;
            }}

            .doctorq-window-border {{
                position: absolute;
                inset: 0;
                border-radius: 24px;
                padding: 2px;
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}}, #6366f1);
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                opacity: 0.6;
                pointer-events: none;
            }}

            .doctorq-hidden {{
                opacity: 0;
                transform: scale(0.8) translateY(50px);
                pointer-events: none;
            }}

            /* ===== HEADER PREMIUM ===== */
            .doctorq-header {{
                position: relative;
                height: 80px;
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}}, #6366f1);
                flex-shrink: 0;
            }}

            .doctorq-header-pattern {{
                position: absolute;
                inset: 0;
                opacity: 0.2;
                background-image: radial-gradient(circle at 20px 20px, white 1px, transparent 1px);
                background-size: 40px 40px;
            }}

            .doctorq-header-content {{
                position: relative;
                height: 100%;
                padding: 0 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }}

            .doctorq-header-info {{
                display: flex;
                align-items: center;
                gap: 16px;
            }}

            .doctorq-avatar-wrapper {{
                position: relative;
            }}

            .doctorq-avatar-glow {{
                position: absolute;
                inset: 0;
                background: white;
                border-radius: 50%;
                filter: blur(8px);
                opacity: 0.5;
            }}

            .doctorq-avatar {{
                position: relative;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                color: white;
            }}

            .doctorq-avatar img {{
                width: 100%;
                height: 100%;
                object-fit: cover;
            }}

            .doctorq-online-indicator {{
                position: absolute;
                bottom: 0;
                right: 0;
                width: 14px;
                height: 14px;
                background: #22c55e;
                border-radius: 50%;
                border: 2px solid white;
                animation: doctorq-online-pulse 2s infinite;
            }}

            @keyframes doctorq-online-pulse {{
                0%, 100% {{ transform: scale(1); }}
                50% {{ transform: scale(1.2); }}
            }}

            .doctorq-header-text {{
                color: white;
            }}

            .doctorq-title {{
                font-weight: 700;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 8px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}

            .doctorq-sparkle {{
                animation: doctorq-sparkle 2s infinite;
            }}

            @keyframes doctorq-sparkle {{
                0%, 100% {{ opacity: 1; transform: rotate(0deg); }}
                50% {{ opacity: 0.7; transform: rotate(15deg); }}
            }}

            .doctorq-subtitle {{
                font-size: 13px;
                opacity: 0.9;
                font-weight: 500;
            }}

            .doctorq-header-actions {{
                display: flex;
                gap: 8px;
            }}

            .doctorq-action-btn {{
                background: rgba(255,255,255,0.15);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }}

            .doctorq-action-btn:hover {{
                background: rgba(255,255,255,0.25);
                transform: scale(1.05);
            }}

            /* ===== CONTEÚDO ===== */
            .doctorq-content {{
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }}

            .doctorq-content.doctorq-hidden-content {{
                display: none;
            }}

            /* ===== ÁREA DE MENSAGENS ===== */
            .doctorq-messages {{
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                background: linear-gradient(180deg, rgba(139, 92, 246, 0.05), white);
            }}

            /* ===== TELA DE BOAS-VINDAS ===== */
            .doctorq-welcome {{
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 32px 20px;
                text-align: center;
            }}

            .doctorq-welcome-icon {{
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 24px;
                animation: doctorq-welcome-pulse 3s infinite;
            }}

            .doctorq-welcome-icon svg {{
                width: 40px;
                height: 40px;
                color: ${{secondary}};
            }}

            @keyframes doctorq-welcome-pulse {{
                0%, 100% {{ transform: scale(1); }}
                50% {{ transform: scale(1.1); }}
            }}

            .doctorq-welcome-title {{
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}});
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 8px;
            }}

            .doctorq-welcome-subtitle {{
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 32px;
            }}

            .doctorq-suggestions {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                width: 100%;
                max-width: 360px;
            }}

            .doctorq-suggestion {{
                padding: 16px;
                border-radius: 16px;
                border: none;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}

            .doctorq-suggestion:hover {{
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            }}

            .doctorq-suggestion-1 {{ background: linear-gradient(135deg, #3b82f6, #06b6d4); }}
            .doctorq-suggestion-2 {{ background: linear-gradient(135deg, #8b5cf6, #ec4899); }}
            .doctorq-suggestion-3 {{ background: linear-gradient(135deg, #f97316, #f43f5e); }}
            .doctorq-suggestion-4 {{ background: linear-gradient(135deg, #ef4444, #ec4899); }}

            .doctorq-suggestion-icon {{
                font-size: 24px;
                margin-bottom: 8px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }}

            .doctorq-suggestion-text {{
                color: white;
                font-size: 12px;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }}

            /* ===== MENSAGENS ===== */
            .doctorq-message-wrapper {{
                display: flex;
                gap: 12px;
                align-items: flex-start;
            }}

            .doctorq-message-wrapper.doctorq-user {{
                flex-direction: row-reverse;
            }}

            .doctorq-message-avatar {{
                width: 36px;
                height: 36px;
                border-radius: 50%;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border: 2px solid white;
            }}

            .doctorq-message-avatar.doctorq-bot-avatar {{
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}});
                color: white;
            }}

            .doctorq-message-avatar.doctorq-user-avatar {{
                background: linear-gradient(135deg, #3b82f6, #6366f1);
                color: white;
            }}

            .doctorq-message-avatar img {{
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
            }}

            .doctorq-message {{
                max-width: 75%;
                padding: 14px 18px;
                border-radius: 20px;
                word-wrap: break-word;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                position: relative;
            }}

            .doctorq-message-user {{
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}});
                color: white;
                border-bottom-right-radius: 6px;
                margin-left: 48px;
            }}

            .doctorq-message-bot {{
                background: white;
                color: #1f2937;
                border: 2px solid #f3f4f6;
                border-bottom-left-radius: 6px;
                margin-right: 48px;
            }}

            .doctorq-message-time {{
                font-size: 10px;
                opacity: 0.7;
                margin-top: 6px;
            }}

            .doctorq-message-user .doctorq-message-time {{
                text-align: right;
            }}

            /* ===== LINKS E FORMATAÇÃO ===== */
            .doctorq-message a {{
                color: inherit;
                text-decoration: underline;
                transition: opacity 0.2s ease;
            }}

            .doctorq-message a:hover {{
                opacity: 0.8;
            }}

            .doctorq-message-bot a {{
                color: ${{secondary}};
            }}

            .doctorq-message strong {{
                font-weight: 600;
            }}

            .doctorq-message em {{
                font-style: italic;
            }}

            /* ===== STATUS HANDOFF ===== */
            .doctorq-handoff-status {{
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1));
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 12px;
                padding: 12px 16px;
                margin: 8px 0;
                text-align: center;
                font-size: 13px;
                color: #059669;
            }}

            /* ===== TYPING INDICATOR ===== */
            .doctorq-typing {{
                display: flex;
                gap: 6px;
                padding: 16px 20px;
            }}

            .doctorq-typing span {{
                width: 10px;
                height: 10px;
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}});
                border-radius: 50%;
                animation: doctorq-typing 0.6s infinite;
            }}

            .doctorq-typing span:nth-child(2) {{ animation-delay: 0.15s; }}
            .doctorq-typing span:nth-child(3) {{ animation-delay: 0.3s; }}

            @keyframes doctorq-typing {{
                0%, 100% {{ transform: translateY(0); opacity: 0.5; }}
                50% {{ transform: translateY(-8px); opacity: 1; }}
            }}

            /* ===== INPUT AREA PREMIUM ===== */
            .doctorq-input-area {{
                padding: 16px 20px;
                background: white;
                border-top: 2px solid rgba(139, 92, 246, 0.1);
                display: flex;
                gap: 12px;
                align-items: flex-end;
            }}

            .doctorq-input-wrapper {{
                flex: 1;
                position: relative;
            }}

            .doctorq-input {{
                width: 100%;
                border: 2px solid rgba(139, 92, 246, 0.2);
                border-radius: 20px;
                padding: 14px 20px;
                font-size: 15px;
                outline: none;
                transition: all 0.2s ease;
                background: #faf5ff;
            }}

            .doctorq-input:focus {{
                border-color: ${{secondary}};
                background: white;
                box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
            }}

            .doctorq-input::placeholder {{
                color: #9ca3af;
            }}

            .doctorq-send-btn {{
                background: linear-gradient(135deg, ${{primary}}, ${{secondary}});
                border: none;
                color: white;
                width: 52px;
                height: 52px;
                border-radius: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            }}

            .doctorq-send-btn:hover {{
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
            }}

            .doctorq-send-btn:disabled {{
                background: #d1d5db;
                box-shadow: none;
                cursor: not-allowed;
                transform: none;
            }}

            /* ===== RESPONSIVO ===== */
            @media (max-width: 480px) {{
                .doctorq-window {{
                    bottom: 0;
                    right: 0;
                    width: 100%;
                    max-width: 100%;
                    height: 100%;
                    max-height: 100%;
                    border-radius: 0;
                }}

                .doctorq-bubble {{
                    bottom: 20px;
                    right: 20px;
                    width: 64px;
                    height: 64px;
                }}

                .doctorq-window-border {{
                    border-radius: 0;
                }}

                .doctorq-suggestions {{
                    grid-template-columns: 1fr;
                }}
            }}
        `;
    }}

    // Default avatar SVG
    function getDefaultAvatar() {{
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }}

    // Mostrar tela de boas-vindas
    function showWelcomeScreen() {{
        const container = document.getElementById('doctorq-messages');
        container.innerHTML = `
            <div class="doctorq-welcome">
                <div class="doctorq-welcome-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                </div>
                <h2 class="doctorq-welcome-title">Olá! Sou ${{config.nm_agente}} 👋</h2>
                <p class="doctorq-welcome-subtitle">Sua assistente virtual especializada</p>
                <div class="doctorq-suggestions">
                    <button class="doctorq-suggestion doctorq-suggestion-1" data-text="Como agendar uma consulta?">
                        <div class="doctorq-suggestion-icon">📅</div>
                        <div class="doctorq-suggestion-text">Como agendar consulta?</div>
                    </button>
                    <button class="doctorq-suggestion doctorq-suggestion-2" data-text="Quais procedimentos vocês oferecem?">
                        <div class="doctorq-suggestion-icon">💉</div>
                        <div class="doctorq-suggestion-text">Procedimentos disponíveis</div>
                    </button>
                    <button class="doctorq-suggestion doctorq-suggestion-3" data-text="Quero saber mais sobre harmonização facial">
                        <div class="doctorq-suggestion-icon">✨</div>
                        <div class="doctorq-suggestion-text">Harmonização facial</div>
                    </button>
                    <button class="doctorq-suggestion doctorq-suggestion-4" data-text="Quero falar com um atendente humano" data-handoff="true">
                        <div class="doctorq-suggestion-icon">👤</div>
                        <div class="doctorq-suggestion-text">Falar com atendente</div>
                    </button>
                </div>
            </div>
        `;

        // Adicionar listeners aos botões de sugestão
        container.querySelectorAll('.doctorq-suggestion').forEach(btn => {{
            btn.addEventListener('click', () => {{
                const text = btn.getAttribute('data-text');
                const isHandoff = btn.getAttribute('data-handoff') === 'true';

                // Limpar tela de boas-vindas
                container.innerHTML = '';

                if (isHandoff) {{
                    addMessage(text, 'user');
                    iniciarHandoff(text);
                }} else {{
                    // Enviar mensagem
                    document.getElementById('doctorq-input').value = text;
                    sendMessage();
                }}
            }});
        }});
    }}

    // Event listeners
    function setupEventListeners() {{
        const bubble = document.getElementById('doctorq-chat-bubble');
        const closeBtn = document.getElementById('doctorq-close');
        const minimizeBtn = document.getElementById('doctorq-minimize');
        const input = document.getElementById('doctorq-input');
        const sendBtn = document.getElementById('doctorq-send');

        bubble.addEventListener('click', openChat);
        closeBtn.addEventListener('click', closeChat);
        minimizeBtn.addEventListener('click', toggleMinimize);

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {{
            if (e.key === 'Enter' && !e.shiftKey) {{
                e.preventDefault();
                sendMessage();
            }}
        }});
    }}

    // Abrir chat
    function openChat() {{
        const chatWindow = document.getElementById('doctorq-chat-window');
        const bubble = document.getElementById('doctorq-chat-bubble');

        isOpen = true;
        chatWindow.classList.remove('doctorq-hidden');
        bubble.style.display = 'none';

        setTimeout(() => {{
            document.getElementById('doctorq-input').focus();
        }}, 300);
    }}

    // Fechar chat
    function closeChat() {{
        const chatWindow = document.getElementById('doctorq-chat-window');
        const bubble = document.getElementById('doctorq-chat-bubble');

        isOpen = false;
        chatWindow.classList.add('doctorq-hidden');

        setTimeout(() => {{
            bubble.style.display = 'flex';
        }}, 300);
    }}

    // Minimizar/Maximizar
    function toggleMinimize() {{
        const chatWindow = document.getElementById('doctorq-chat-window');
        const content = document.getElementById('doctorq-content');
        const minimizeBtn = document.getElementById('doctorq-minimize');

        isMinimized = !isMinimized;

        if (isMinimized) {{
            chatWindow.classList.add('doctorq-minimized');
            content.classList.add('doctorq-hidden-content');
            minimizeBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
            `;
        }} else {{
            chatWindow.classList.remove('doctorq-minimized');
            content.classList.remove('doctorq-hidden-content');
            minimizeBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="4 14 10 14 10 20"></polyline>
                    <polyline points="20 10 14 10 14 4"></polyline>
                    <line x1="14" y1="10" x2="21" y2="3"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
            `;
            setTimeout(() => {{
                document.getElementById('doctorq-input').focus();
            }}, 100);
        }}
    }}

    // Escapar HTML para evitar XSS e texto "brabrado"
    function escapeHtml(text) {{
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }}

    // Formatar texto com markdown básico (negrito, itálico, links)
    function formatText(text) {{
        if (!text) return '';

        // Primeiro escapar HTML
        let formatted = escapeHtml(text);

        // Converter quebras de linha
        formatted = formatted.replace(/\\n/g, '<br>');

        // Converter **negrito**
        formatted = formatted.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');

        // Converter *itálico*
        formatted = formatted.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');

        // Converter links [texto](url)
        formatted = formatted.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Converter URLs soltas em links clicáveis
        formatted = formatted.replace(/(https?:\\/\\/[^\\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        return formatted;
    }}

    // Adicionar mensagem
    function addMessage(text, sender, skipFormat = false) {{
        const container = document.getElementById('doctorq-messages');

        // Remover tela de boas-vindas se existir
        const welcome = container.querySelector('.doctorq-welcome');
        if (welcome) welcome.remove();

        const time = new Date().toLocaleTimeString('pt-BR', {{ hour: '2-digit', minute: '2-digit' }});

        const wrapper = document.createElement('div');
        wrapper.className = 'doctorq-message-wrapper ' + (sender === 'user' ? 'doctorq-user' : '');

        // Formatar o texto (ou apenas escapar se skipFormat)
        const formattedText = skipFormat ? escapeHtml(text) : formatText(text);

        const avatarHtml = sender === 'user'
            ? `<div class="doctorq-message-avatar doctorq-user-avatar">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                       <circle cx="12" cy="7" r="4"></circle>
                   </svg>
               </div>`
            : `<div class="doctorq-message-avatar doctorq-bot-avatar">
                   ${{config.avatar_url ? `<img src="${{config.avatar_url}}" alt="Avatar">` : getDefaultAvatar()}}
               </div>`;

        wrapper.innerHTML = `
            ${{avatarHtml}}
            <div class="doctorq-message doctorq-message-${{sender}}">
                ${{formattedText}}
                <div class="doctorq-message-time">${{time}}</div>
            </div>
        `;

        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
        messages.push({{ text, sender }});
    }}

    // Mostrar typing indicator
    function showTyping() {{
        const container = document.getElementById('doctorq-messages');

        const wrapper = document.createElement('div');
        wrapper.id = 'doctorq-typing';
        wrapper.className = 'doctorq-message-wrapper';
        wrapper.innerHTML = `
            <div class="doctorq-message-avatar doctorq-bot-avatar">
                ${{config.avatar_url ? `<img src="${{config.avatar_url}}" alt="Avatar">` : getDefaultAvatar()}}
            </div>
            <div class="doctorq-message doctorq-message-bot doctorq-typing">
                <span></span><span></span><span></span>
            </div>
        `;

        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
    }}

    // Esconder typing indicator
    function hideTyping() {{
        const typing = document.getElementById('doctorq-typing');
        if (typing) typing.remove();
    }}

    // =============================================
    // WEBSOCKET PARA COMUNICAÇÃO COM ATENDENTE
    // =============================================

    // Conectar ao WebSocket
    function connectWebSocket(conversaId) {{
        if (websocket && websocket.readyState === WebSocket.OPEN) {{
            console.log('[DoctorQ Widget] WebSocket já conectado');
            return;
        }}

        const wsUrl = `${{WS_BASE}}/ws/central-atendimento/chat/${{conversaId}}?role=contact&name=Visitante`;
        console.log('[DoctorQ Widget] Conectando WebSocket:', wsUrl);

        try {{
            websocket = new WebSocket(wsUrl);

            websocket.onopen = () => {{
                console.log('[DoctorQ Widget] WebSocket conectado!');
                wsReconnectAttempts = 0;

                // Iniciar ping keepalive
                if (wsPingInterval) clearInterval(wsPingInterval);
                wsPingInterval = setInterval(() => {{
                    if (websocket && websocket.readyState === WebSocket.OPEN) {{
                        websocket.send(JSON.stringify({{ type: 'ping', data: {{}} }}));
                    }}
                }}, WS_PING_INTERVAL);
            }};

            websocket.onmessage = (event) => {{
                try {{
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                }} catch (e) {{
                    console.error('[DoctorQ Widget] Erro ao parsear mensagem WS:', e);
                }}
            }};

            websocket.onerror = (error) => {{
                console.error('[DoctorQ Widget] WebSocket erro:', error);
            }};

            websocket.onclose = (event) => {{
                console.log('[DoctorQ Widget] WebSocket fechado:', event.code, event.reason);

                // Limpar ping interval
                if (wsPingInterval) {{
                    clearInterval(wsPingInterval);
                    wsPingInterval = null;
                }}

                // Tentar reconectar se ainda em handoff
                if (isInHandoff && wsReconnectAttempts < MAX_WS_RECONNECT_ATTEMPTS) {{
                    wsReconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts), 30000);
                    console.log(`[DoctorQ Widget] Reconectando em ${{delay}}ms (tentativa ${{wsReconnectAttempts}}/${{MAX_WS_RECONNECT_ATTEMPTS}})`);
                    setTimeout(() => {{
                        if (isInHandoff && handoffConversaId) {{
                            connectWebSocket(handoffConversaId);
                        }}
                    }}, delay);
                }}
            }};
        }} catch (error) {{
            console.error('[DoctorQ Widget] Erro ao criar WebSocket:', error);
        }}
    }}

    // Processar mensagens do WebSocket
    function handleWebSocketMessage(data) {{
        const {{ type }} = data;

        switch (type) {{
            case 'connected':
                console.log('[DoctorQ Widget] Conexão WS confirmada:', data.data);
                break;

            case 'message':
                // Mensagem recebida do atendente
                if (data.data && data.data.content) {{
                    const msg = data.data;
                    // Só mostrar mensagens do atendente, não as próprias
                    if (msg.from && msg.from.role !== 'contact') {{
                        const senderName = msg.from.name || 'Atendente';
                        addMessage(`👤 ${{senderName}}: ${{msg.content}}`, 'bot');
                    }}
                }}
                break;

            case 'attendant_joined':
                // Atendente entrou na conversa
                if (data.data && data.data.name) {{
                    addMessage(`✅ ${{data.data.name}} entrou no chat e está pronto para atendê-lo!`, 'bot');
                }} else {{
                    addMessage('✅ Um atendente entrou no chat!', 'bot');
                }}
                break;

            case 'attendant_left':
                addMessage('ℹ️ O atendente saiu do chat.', 'bot');
                break;

            case 'session_ended':
                const reason = data.data?.reason || 'Atendimento finalizado';
                addMessage(`📋 ${{reason}}`, 'bot');
                endHandoff();
                break;

            case 'queue_position':
                if (data.data) {{
                    addMessage(`📋 Posição na fila: ${{data.data.position}}/${{data.data.total}}`, 'bot');
                }}
                break;

            case 'typing_start':
                showTyping();
                break;

            case 'typing_stop':
                hideTyping();
                break;

            case 'pong':
                // Keepalive response
                break;

            default:
                console.log('[DoctorQ Widget] Evento WS não tratado:', type, data);
        }}
    }}

    // Enviar mensagem via WebSocket
    function sendWebSocketMessage(content) {{
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {{
            console.error('[DoctorQ Widget] WebSocket não conectado');
            addMessage('⚠️ Conexão perdida. Tentando reconectar...', 'bot');
            if (handoffConversaId) {{
                connectWebSocket(handoffConversaId);
            }}
            return false;
        }}

        try {{
            websocket.send(JSON.stringify({{
                type: 'message',
                data: {{
                    content: content,
                    type: 'text',
                    message_id: generateUUID()
                }}
            }}));
            return true;
        }} catch (error) {{
            console.error('[DoctorQ Widget] Erro ao enviar via WS:', error);
            return false;
        }}
    }}

    // Desconectar WebSocket
    function disconnectWebSocket() {{
        // Limpar ping interval
        if (wsPingInterval) {{
            clearInterval(wsPingInterval);
            wsPingInterval = null;
        }}

        if (websocket) {{
            websocket.close(1000, 'User disconnect');
            websocket = null;
        }}
    }}

    // Finalizar handoff
    function endHandoff() {{
        isInHandoff = false;
        handoffConversaId = null;
        wsReconnectAttempts = 0;
        disconnectWebSocket();
        addMessage('💬 Você pode continuar conversando com a Gisele, nossa assistente virtual.', 'bot');
    }}

    // Iniciar handoff para atendente humano
    async function iniciarHandoff(motivoMensagem) {{
        try {{
            addMessage('⏳ Conectando você a um atendente...', 'bot');

            // Preparar histórico de mensagens
            const historico = messages.map(m => ({{
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text,
                timestamp: new Date().toISOString()
            }}));

            const response = await fetch(API_BASE + '/central-atendimento/handoff/iniciar/', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json',
                }},
                body: JSON.stringify({{
                    id_agente: AGENT_ID,
                    ds_motivo: motivoMensagem || 'Solicitação de atendimento humano',
                    historico_mensagens: historico,
                    tp_canal: 'webchat'
                }}),
            }});

            if (response.ok) {{
                const data = await response.json();
                console.log('[DoctorQ Widget] Handoff response:', data);

                if (data.success) {{
                    // Marcar como em handoff
                    isInHandoff = true;
                    handoffConversaId = data.id_conversa;

                    addMessage('✅ Você foi adicionado à fila de atendimento!', 'bot');
                    if (data.nr_posicao_fila) {{
                        addMessage(`📋 Posição na fila: ${{data.nr_posicao_fila}}`, 'bot');
                    }}
                    if (data.tempo_estimado_minutos) {{
                        addMessage(`⏱️ Tempo estimado: ~${{data.tempo_estimado_minutos}} minutos`, 'bot');
                    }}
                    addMessage('Um atendente entrará em contato assim que possível. Enquanto aguarda, você pode digitar sua mensagem.', 'bot');

                    // Conectar ao WebSocket para receber mensagens em tempo real
                    if (data.id_conversa) {{
                        connectWebSocket(data.id_conversa);
                    }}
                }} else {{
                    addMessage('Um atendente humano entrará em contato em breve.', 'bot');
                }}
            }} else {{
                addMessage('Um atendente humano entrará em contato em breve.', 'bot');
            }}
        }} catch (error) {{
            console.error('[DoctorQ Widget] Erro no handoff:', error);
            addMessage('Um atendente humano entrará em contato em breve.', 'bot');
        }}
    }}

    // Enviar mensagem
    async function sendMessage() {{
        const input = document.getElementById('doctorq-input');
        const sendBtn = document.getElementById('doctorq-send');
        const text = input.value.trim();

        if (!text) return;

        // Remover tela de boas-vindas se existir
        const welcome = document.querySelector('.doctorq-welcome');
        if (welcome) welcome.remove();

        // Adicionar mensagem do usuário
        addMessage(text, 'user');
        input.value = '';
        sendBtn.disabled = true;

        // =============================================
        // SE EM HANDOFF: ENVIAR VIA WEBSOCKET
        // =============================================
        if (isInHandoff && handoffConversaId) {{
            const sent = sendWebSocketMessage(text);
            if (sent) {{
                console.log('[DoctorQ Widget] Mensagem enviada via WebSocket');
            }} else {{
                // Tentar reconectar e enviar novamente
                console.log('[DoctorQ Widget] Falha ao enviar, tentando reconectar...');
            }}
            sendBtn.disabled = false;
            input.focus();
            return;
        }}

        // =============================================
        // MODO NORMAL: ENVIAR PARA O BOT/AGENTE
        // =============================================
        showTyping();

        try {{
            const response = await fetch(API_BASE + '/widget/' + AGENT_ID + '/message/', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json',
                }},
                body: JSON.stringify({{
                    mensagem: text,
                    session_id: sessionId,
                }}),
            }});

            if (!response.ok) throw new Error('Erro na resposta');

            const data = await response.json();

            hideTyping();
            addMessage(data.resposta, 'bot');

            // Se precisa transferir para humano
            if (data.transferir_humano) {{
                await iniciarHandoff(text);
            }}

        }} catch (error) {{
            console.error('[DoctorQ Widget] Erro:', error);
            hideTyping();
            addMessage('Desculpe, ocorreu um erro. Tente novamente.', 'bot');
        }}

        sendBtn.disabled = false;
        input.focus();
    }}

    // Gerar UUID
    function generateUUID() {{
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {{
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }});
    }}

    // Iniciar quando DOM estiver pronto
    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', init);
    }} else {{
        init();
    }}
}})();
'''
