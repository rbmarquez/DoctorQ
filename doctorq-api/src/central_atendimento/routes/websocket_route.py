# src/central_atendimento/routes/websocket_route.py
"""
Rota WebSocket para Central de Atendimento.

Endpoints:
- /ws/chat/{conversa_id} - Conexão de chat em tempo real
- /ws/notifications/ - Notificações para atendentes
"""

import uuid
from typing import Optional
from urllib.parse import parse_qs

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import ORMConfig, get_async_session_context
from src.config.logger_config import get_logger
from src.central_atendimento.services.websocket_chat_gateway import (
    get_websocket_chat_gateway,
    ParticipantRole,
    ChatEventType,
)
from src.central_atendimento.services.websocket_notification_service import (
    get_ws_notification_service,
    NotificationType,
)

logger = get_logger(__name__)

router = APIRouter(tags=["WebSocket"])


async def get_user_from_token(token: str, db: AsyncSession) -> Optional[dict]:
    """
    Valida token e retorna dados do usuário.
    Aceita JWT token ou API key.
    """
    if not token:
        return None

    import jwt
    import os
    from sqlalchemy import select
    from src.models.apikey import ApiKey

    # 1. Tentar validar como JWT primeiro (começa com "ey")
    if token.startswith("ey"):
        try:
            secret = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", ""))
            payload = jwt.decode(token, secret, algorithms=["HS256"])

            # Extrair dados do payload
            user_id = payload.get("uid") or payload.get("user_id") or payload.get("sub")
            empresa_id = payload.get("id_empresa")
            role = payload.get("role", "attendant")

            if user_id:
                logger.debug(f"JWT validado: user_id={user_id}, empresa_id={empresa_id}")
                return {
                    "user_id": user_id,
                    "empresa_id": empresa_id,
                    "role": role,
                }
        except jwt.ExpiredSignatureError:
            logger.warning("JWT expirado")
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT inválido: {e}")
        except Exception as e:
            logger.error(f"Erro ao validar JWT: {e}")

    # 2. Se não for JWT ou falhou, tentar como API key
    try:
        result = await db.execute(
            select(ApiKey).where(
                ApiKey.apiKey == token,
                ApiKey.st_ativo == True
            )
        )
        api_key = result.scalar_one_or_none()

        if api_key:
            logger.debug(f"API key validada: user_id={api_key.id_user}")
            return {
                "user_id": api_key.id_user,
                "empresa_id": api_key.id_empresa,
                "role": "attendant",
            }
    except Exception as e:
        logger.error("Erro ao validar API key: %s", str(e))

    return None


@router.websocket("/chat/{conversa_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    conversa_id: str,
    token: Optional[str] = Query(None),
):
    """
    Endpoint WebSocket para chat em tempo real.

    Query Params:
    - token: Token de autenticação (API key ou JWT)
    - role: Papel do participante (attendant/contact)
    - name: Nome para exibição

    Mensagens recebidas (JSON):
    - {"type": "message", "data": {"content": "...", "type": "text"}}
    - {"type": "typing_start", "data": {}}
    - {"type": "typing_stop", "data": {}}
    - {"type": "ping", "data": {}}

    Mensagens enviadas (JSON):
    - {"type": "connected", "data": {...}}
    - {"type": "message", "data": {...}}
    - {"type": "typing_start", "data": {...}}
    - {"type": "presence", "data": {...}}
    """
    # Extrair parâmetros da query string
    query_string = websocket.scope.get("query_string", b"").decode()
    params = parse_qs(query_string)

    role_str = params.get("role", ["contact"])[0]
    name = params.get("name", [""])[0]
    token = params.get("token", [token])[0] if token is None else token

    # Determinar role
    role = ParticipantRole.CONTACT
    if role_str == "attendant":
        role = ParticipantRole.ATTENDANT
    elif role_str == "bot":
        role = ParticipantRole.BOT

    # Autenticar se necessário (atendentes devem ter token)
    user_id = None
    empresa_id = None
    contact_id = None

    if role == ParticipantRole.ATTENDANT:
        if not token:
            await websocket.close(1008, "Token obrigatório para atendentes")
            return

        async with get_async_session_context() as db:
            user_data = await get_user_from_token(token, db)
            if not user_data:
                await websocket.close(1008, "Token inválido")
                return

            user_id = user_data.get("user_id")
            empresa_id = user_data.get("empresa_id")
    else:
        # Para contatos, o conversa_id é suficiente
        # Podemos extrair contact_id da conversa se necessário
        try:
            contact_id = uuid.UUID(params.get("contact_id", [None])[0]) if params.get("contact_id") else None
        except ValueError:
            pass

    # Conectar ao gateway
    gateway = get_websocket_chat_gateway()

    try:
        await gateway.handle_connection(
            websocket=websocket,
            room_id=conversa_id,
            role=role,
            user_id=user_id,
            contact_id=contact_id,
            empresa_id=empresa_id,
            name=name or f"Participante_{conversa_id[:8]}",
        )
    except WebSocketDisconnect:
        logger.debug("WebSocket desconectado: conversa=%s", conversa_id)
    except Exception as e:
        logger.error("Erro no WebSocket chat: %s", str(e))


@router.websocket("/notifications/")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Endpoint WebSocket para notificações de atendentes.

    Recebe notificações em tempo real sobre:
    - Novos tickets
    - Novas mensagens
    - Transferências
    - Status de conversas

    Query Params:
    - token: Token de autenticação (obrigatório)

    Mensagens enviadas (JSON):
    - {"type": "new_ticket", "data": {...}, "timestamp": "..."}
    - {"type": "new_message", "data": {...}, "timestamp": "..."}
    """
    if not token:
        await websocket.close(1008, "Token obrigatório")
        return

    # Autenticar
    async with get_async_session_context() as db:
        user_data = await get_user_from_token(token, db)
        if not user_data:
            await websocket.close(1008, "Token inválido")
            return

        user_id = user_data.get("user_id")
        empresa_id = user_data.get("empresa_id")

    if not user_id or not empresa_id:
        await websocket.close(1008, "Dados de usuário incompletos")
        return

    # Conectar ao serviço de notificações
    ws_service = get_ws_notification_service()

    connection_id = await ws_service.connect(
        websocket=websocket,
        user_id=user_id,
        empresa_id=empresa_id,
        role="attendant",
    )

    try:
        # Enviar confirmação
        await ws_service.send_to_connection(
            connection_id,
            NotificationType.SYSTEM_MESSAGE,
            {
                "message": "Conectado ao sistema de notificações",
                "connection_id": connection_id,
            }
        )

        # Manter conexão aberta
        while True:
            try:
                data = await websocket.receive_json()

                # Processar mensagens do cliente (pings, etc)
                msg_type = data.get("type", "")

                if msg_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "data": {},
                    })

            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error("Erro ao processar mensagem: %s", str(e))
                break
    finally:
        await ws_service.disconnect(connection_id)


@router.get("/ws/stats/")
async def websocket_stats():
    """Retorna estatísticas das conexões WebSocket."""
    gateway = get_websocket_chat_gateway()
    notification_service = get_ws_notification_service()

    return {
        "chat_gateway": gateway.get_stats(),
        "notification_service": notification_service.get_stats(),
    }
