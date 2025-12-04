# src/routes/message.py
"""
Routes para mensagens do sistema de conversas.
Implementa listagem de mensagens e chat (placeholder).
"""

import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer

from src.config.logger_config import get_logger
from src.models.conversation import (
    ChatRequest,
    MessageListResponse,
    MessageResponse,
)
from src.services.conversation_service import ConversationService
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/conversas", tags=["Messages"])
security = HTTPBearer()


async def get_conversation_service() -> ConversationService:
    """Dependency para obter ConversationService"""
    from src.config.orm_config import get_db
    async for db in get_db():
        yield ConversationService(db)


@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
async def list_messages(
    conversation_id: str,
    user_id: Optional[str] = Query(None, description="ID do usuário (opcional para conversas anônimas)"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Itens por página"),
    service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """
    Lista mensagens de uma conversa com paginação.

    SECURITY NOTE: user_id deveria ser extraído do token JWT.
    Para conversas anônimas (Gisele), user_id pode ser None.

    Args:
        conversation_id: ID da conversa
        user_id: ID do usuário (opcional para conversas anônimas)
        page: Número da página
        size: Itens por página

    Returns:
        Lista paginada de mensagens
    """
    try:
        # Validar UUIDs
        try:
            conv_uuid = uuid.UUID(conversation_id)
            user_uuid = uuid.UUID(user_id) if user_id else None
        except ValueError:
            raise HTTPException(status_code=400, detail="ID inválido")

        # Verificar se conversa existe (suporta anônimas com user_id=None)
        conversation = await service.get_conversation(conv_uuid, user_uuid)

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversa não encontrada")

        # Listar mensagens
        messages, total = await service.get_messages(
            conversation_id=conv_uuid,
            page=page,
            page_size=size,
        )

        # Calcular total de páginas
        total_pages = (total + size - 1) // size

        return MessageListResponse(
            items=[MessageResponse.model_validate(msg) for msg in messages],
            total=total,
            page=page,
            page_size=size,
            total_pages=total_pages,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar mensagens: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{conversation_id}/chat")
async def chat(
    conversation_id: str,
    chat_request: ChatRequest,
    user_id: Optional[str] = Query(None, description="ID do usuário (opcional para conversas anônimas)"),
    service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """
    Envia mensagem e recebe resposta do agente com streaming SSE.

    Suporta conversas anônimas (Gisele) quando user_id não é fornecido.

    Args:
        conversation_id: ID da conversa
        chat_request: Dados da mensagem
        user_id: ID do usuário (opcional para conversas anônimas)

    Returns:
        StreamingResponse (SSE) ou erro
    """
    try:
        # Validar UUIDs
        try:
            conv_uuid = uuid.UUID(conversation_id)
            user_uuid = uuid.UUID(user_id) if user_id else None
        except ValueError:
            raise HTTPException(status_code=400, detail="ID inválido")

        # Verificar se conversa existe (suporta anônimas com user_id=None)
        conversation = await service.get_conversation(conv_uuid, user_uuid)

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversa não encontrada")

        # Implementar chat streaming real
        async def event_generator():
            try:
                async for chunk in service.chat_stream(
                    conversation_id=conv_uuid,
                    user_id=user_uuid,
                    user_message=chat_request.message,
                    temperature=chat_request.temperature,
                    max_tokens=chat_request.max_tokens,
                ):
                    yield f"data: {json.dumps(chunk)}\n\n"
            except Exception as e:
                logger.error(f"Erro no streaming: {str(e)}")
                error_chunk = {
                    "type": "error",
                    "content": f"Erro ao processar mensagem: {str(e)}",
                }
                yield f"data: {json.dumps(error_chunk)}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
