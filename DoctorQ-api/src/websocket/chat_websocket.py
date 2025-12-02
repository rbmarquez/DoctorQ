"""
WebSocket Endpoints para Chat em Tempo Real
"""

import json
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig
from src.websocket.connection_manager import manager

logger = get_logger(__name__)

router = APIRouter(tags=["websocket"])


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@router.websocket("/ws/chat/{user_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    user_id: str,
    conversa_id: Optional[str] = Query(None),
):
    """
    WebSocket endpoint para chat em tempo real

    Conectar: ws://localhost:8080/ws/chat/{user_id}?conversa_id={conversa_id}

    Mensagens enviadas pelo cliente:
    {
        "type": "message",
        "conversa_id": "uuid",
        "conteudo": "texto da mensagem",
        "tipo": "texto"  // opcional
    }

    {
        "type": "join",
        "conversa_id": "uuid"
    }

    {
        "type": "leave",
        "conversa_id": "uuid"
    }

    {
        "type": "typing",
        "conversa_id": "uuid",
        "typing": true/false
    }

    Mensagens recebidas pelo cliente:
    {
        "type": "message",
        "data": {
            "id_mensagem": "uuid",
            "id_conversa": "uuid",
            "id_user_remetente": "uuid",
            "ds_conteudo": "texto",
            "dt_criacao": "iso datetime",
            ...
        }
    }

    {
        "type": "typing",
        "user_id": "uuid",
        "conversa_id": "uuid",
        "typing": true/false
    }

    {
        "type": "user_joined",
        "user_id": "uuid",
        "conversa_id": "uuid"
    }

    {
        "type": "error",
        "message": "erro descritivo"
    }
    """
    await manager.connect(user_id, websocket)

    # Se conversa_id foi passada na query, entrar automaticamente
    if conversa_id:
        manager.join_conversation(user_id, conversa_id)
        await manager.broadcast_to_conversation(
            {
                "type": "user_joined",
                "user_id": user_id,
                "conversa_id": conversa_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            conversa_id,
            exclude_user=user_id,
        )

    try:
        while True:
            # Receber mensagem do cliente
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)
                message_type = message_data.get("type")

                # ================================================================
                # ENVIAR MENSAGEM
                # ================================================================
                if message_type == "message":
                    await handle_chat_message(user_id, message_data)

                # ================================================================
                # ENTRAR NA CONVERSA
                # ================================================================
                elif message_type == "join":
                    conv_id = message_data.get("conversa_id")
                    if conv_id:
                        manager.join_conversation(user_id, conv_id)
                        await manager.broadcast_to_conversation(
                            {
                                "type": "user_joined",
                                "user_id": user_id,
                                "conversa_id": conv_id,
                                "timestamp": datetime.utcnow().isoformat(),
                            },
                            conv_id,
                            exclude_user=user_id,
                        )

                # ================================================================
                # SAIR DA CONVERSA
                # ================================================================
                elif message_type == "leave":
                    conv_id = message_data.get("conversa_id")
                    if conv_id:
                        manager.leave_conversation(user_id, conv_id)
                        await manager.broadcast_to_conversation(
                            {
                                "type": "user_left",
                                "user_id": user_id,
                                "conversa_id": conv_id,
                                "timestamp": datetime.utcnow().isoformat(),
                            },
                            conv_id,
                            exclude_user=user_id,
                        )

                # ================================================================
                # TYPING INDICATOR
                # ================================================================
                elif message_type == "typing":
                    conv_id = message_data.get("conversa_id")
                    is_typing = message_data.get("typing", False)

                    if conv_id:
                        await manager.broadcast_to_conversation(
                            {
                                "type": "typing",
                                "user_id": user_id,
                                "conversa_id": conv_id,
                                "typing": is_typing,
                                "timestamp": datetime.utcnow().isoformat(),
                            },
                            conv_id,
                            exclude_user=user_id,
                        )

                # ================================================================
                # PING/PONG (keepalive)
                # ================================================================
                elif message_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    })

                # ================================================================
                # TIPO DESCONHECIDO
                # ================================================================
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Tipo de mensagem desconhecido: {message_type}",
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Mensagem inválida: não é JSON válido",
                })
            except Exception as e:
                logger.error(f"Erro ao processar mensagem: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Erro ao processar mensagem: {str(e)}",
                })

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        logger.info(f"Cliente desconectado: {user_id}")
    except Exception as e:
        logger.error(f"Erro na conexão WebSocket: {str(e)}")
        manager.disconnect(user_id, websocket)


# ============================================================================
# Message Handler
# ============================================================================

async def handle_chat_message(user_id: str, message_data: dict):
    """Processar e broadcast mensagem de chat"""
    conversa_id = message_data.get("conversa_id")
    conteudo = message_data.get("conteudo", "")
    tipo = message_data.get("tipo", "texto")

    if not conversa_id or not conteudo:
        await manager.send_personal_message(
            {
                "type": "error",
                "message": "conversa_id e conteudo são obrigatórios",
            },
            user_id,
        )
        return

    # Salvar mensagem no banco de dados
    async for db in ORMConfig.get_session():
        try:
            query = text("""
                INSERT INTO tb_mensagens (
                    id_conversa, id_user_remetente, ds_conteudo, ds_tipo
                )
                VALUES (
                    :id_conversa, :id_user_remetente, :ds_conteudo, :ds_tipo
                )
                RETURNING id_mensagem, dt_criacao, st_lida
            """)

            result = await db.execute(query, {
                "id_conversa": conversa_id,
                "id_user_remetente": user_id,
                "ds_conteudo": conteudo,
                "ds_tipo": tipo,
            })

            await db.commit()
            row = result.fetchone()

            # Criar payload da mensagem
            message_payload = {
                "type": "message",
                "data": {
                    "id_mensagem": str(row[0]),
                    "id_conversa": conversa_id,
                    "id_user_remetente": user_id,
                    "ds_conteudo": conteudo,
                    "ds_tipo": tipo,
                    "dt_criacao": row[1].isoformat(),
                    "st_lida": row[2],
                }
            }

            # Broadcast para todos os participantes da conversa
            await manager.broadcast_to_conversation(
                message_payload,
                conversa_id,
            )

            logger.info(f"Mensagem salva e enviada: conversa={conversa_id}, user={user_id}")

        except Exception as e:
            logger.error(f"Erro ao salvar mensagem: {str(e)}")
            await db.rollback()
            await manager.send_personal_message(
                {
                    "type": "error",
                    "message": f"Erro ao salvar mensagem: {str(e)}",
                },
                user_id,
            )


# ============================================================================
# Status Endpoint (HTTP)
# ============================================================================

@router.get("/ws/status")
async def websocket_status():
    """Obter estatísticas das conexões WebSocket"""
    stats = manager.get_stats()
    return {
        "status": "online",
        "stats": stats,
    }


@router.get("/ws/users/online")
async def get_online_users():
    """Obter lista de usuários online"""
    return {
        "users": manager.get_connected_users(),
        "count": len(manager.get_connected_users()),
    }


@router.get("/ws/conversation/{conversa_id}/users")
async def get_conversation_users(conversa_id: str):
    """Obter usuários conectados em uma conversa específica"""
    users = manager.get_connected_users(conversa_id)
    return {
        "conversa_id": conversa_id,
        "users": users,
        "count": len(users),
    }
