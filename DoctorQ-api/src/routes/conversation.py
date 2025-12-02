import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer

from src.config.logger_config import get_logger
from src.models.conversation import (
    ConversationCreate,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdate,
)
from src.services.conversation.conversation_service import (
    ConversationService,
    get_conversation_service,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/conversas", tags=["conversas"])
security = HTTPBearer()


@router.get("", response_model=ConversationListResponse)
async def listar_conversas(
    page: int = Query(1, ge=1, description="NÃºmero da pÃ¡gina"),
    size: int = Query(20, ge=1, le=100, description="Itens por pÃ¡gina"),
    search: Optional[str] = Query(None, description="Busca por token"),
    user_id: Optional[str] = Query(None, description="ID do usuÃ¡rio"),
    status: Optional[str] = Query(None, description="Status da conversa (S/N)"),
    order_by: str = Query("dt_criacao", description="Campo para ordenaÃ§Ã£o"),
    order_desc: bool = Query(True, description="Ordem decrescente"),
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Listar conversas com filtros e paginaÃ§Ã£o

    SECURITY NOTE: Este endpoint deve ser protegido com autenticaÃ§Ã£o JWT
    e o user_id deve ser extraÃ­do do token, nÃ£o do query parameter.
    """
    try:
        # Tratar user_id como string (pode ser UUID ou ID do provedor como Microsoft)
        user_identifier = None
        if user_id:
            # Primeiro, tentar como UUID
            try:
                user_identifier = uuid.UUID(user_id)
            except ValueError:
                # Se nÃ£o for UUID, usar como string (ex: Microsoft ID)
                user_identifier = user_id

        # Validar status
        if status and status not in ["S", "N"]:
            raise HTTPException(status_code=400, detail="Status deve ser 'S' ou 'N'")

        conversations, total = await conversation_service.list_conversations(
            page=page,
            size=size,
            search=search,
            user_id=user_identifier,
            status_filter=status,
            order_by=order_by,
            order_desc=order_desc,
        )

        # Calculate total pages
        total_pages = (total + size - 1) // size if total > 0 else 0

        return ConversationListResponse(
            items=[ConversationResponse.model_validate(conv) for conv in conversations],
            total=total,
            page=page,
            page_size=size,
            total_pages=total_pages,
        )

    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao listar conversas: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao listar conversas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("", response_model=ConversationResponse, status_code=201)
async def criar_conversa(
    conversation_data: ConversationCreate,
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Criar uma nova conversa

    Args:
        conversation_data: Dados da nova conversa (id_agente, id_user, nm_titulo)

    Returns:
        Conversa criada com ID gerado
    """
    try:
        # Validar que id_user foi fornecido
        if not conversation_data.id_user:
            raise HTTPException(
                status_code=400,
                detail="Campo 'id_user' é obrigatório para criar uma conversa"
            )

        # Criar conversa no service
        conversation = await conversation_service.create_conversation(
            conversation_data,
            user_id=conversation_data.id_user
        )

        if not conversation:
            raise HTTPException(
                status_code=500,
                detail="Erro ao criar conversa - nenhum objeto retornado"
            )

        logger.info(
            f"Conversa criada com sucesso: {conversation.id_conversa} "
            f"(Agente: {conversation.id_agente}, Usuário: {conversation.id_usuario})"
        )

        return ConversationResponse.model_validate(conversation)

    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao criar conversa: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar conversa: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def obter_conversa(
    conversation_id: str,
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Obter uma conversa especÃ­fica por ID"""
    try:
        # Converter string para UUID
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de conversa invÃ¡lido")

        conversation = await conversation_service.get_conversation_by_id(conv_uuid)

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversa nÃ£o encontrada")

        return ConversationResponse.model_validate(conversation)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter conversa: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{conversation_id}", response_model=ConversationResponse)
async def atualizar_conversa(
    conversation_id: str,
    conversation_update: ConversationUpdate,
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Atualizar uma conversa especÃ­fica"""
    try:
        # Converter string para UUID
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de conversa invÃ¡lido")

        # Atualizar o ID no objeto de atualizaÃ§Ã£o
        conversation_update.id_conversa = conv_uuid

        updated_conversation = await conversation_service.update_conversation(
            conversation_id=conv_uuid, conversation_update=conversation_update
        )

        if not updated_conversation:
            raise HTTPException(status_code=404, detail="Conversa nÃ£o encontrada")

        return ConversationResponse.model_validate(updated_conversation)

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao atualizar conversa: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao atualizar conversa: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{conversation_id}")
async def deletar_conversa(
    conversation_id: str,
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Deletar uma conversa especÃ­fica"""
    try:
        # Converter string para UUID
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de conversa invÃ¡lido")

        deleted = await conversation_service.delete_conversation(conv_uuid)

        if not deleted:
            raise HTTPException(status_code=404, detail="Conversa nÃ£o encontrada")

        return {"message": "Conversa deletada com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar conversa: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{conversation_id}/titulo", response_model=ConversationResponse)
async def atualizar_titulo_conversa(
    conversation_id: str,
    titulo_data: dict,
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Atualizar apenas o tÃ­tulo de uma conversa"""
    try:
        # Converter string para UUID
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de conversa invÃ¡lido")

        # Validar que o tÃ­tulo foi fornecido
        if "nm_titulo" not in titulo_data:
            raise HTTPException(
                status_code=400, detail="Campo 'nm_titulo' Ã© obrigatÃ³rio"
            )

        # Validar comprimento do tÃ­tulo
        titulo = titulo_data["nm_titulo"].strip()
        if len(titulo) > 500:
            raise HTTPException(
                status_code=400, detail="TÃ­tulo muito longo (mÃ¡ximo 500 caracteres)"
            )

        # Criar objeto de atualizaÃ§Ã£o apenas com o tÃ­tulo
        conversation_update = ConversationUpdate(id_conversa=conv_uuid, nm_titulo=titulo)  # type: ignore

        updated_conversation = await conversation_service.update_conversation(
            conversation_id=conv_uuid, conversation_update=conversation_update
        )

        if not updated_conversation:
            raise HTTPException(status_code=404, detail="Conversa nÃ£o encontrada")

        return ConversationResponse.model_validate(updated_conversation)

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao atualizar tÃ­tulo: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao atualizar tÃ­tulo da conversa: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{conversation_id}/gerar-titulo", response_model=ConversationResponse)
async def gerar_titulo_automatico(
    conversation_id: str,
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Gerar tÃ­tulo automaticamente baseado na primeira mensagem da conversa"""
    try:
        # Converter string para UUID
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de conversa invÃ¡lido")

        # Gerar e atualizar tÃ­tulo automaticamente
        updated_conversation = (
            await conversation_service.auto_update_title_from_first_message(conv_uuid)
        )

        if not updated_conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversa nÃ£o encontrada ou erro ao gerar tÃ­tulo",
            )

        return ConversationResponse.model_validate(updated_conversation)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar tÃ­tulo automÃ¡tico: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{conversation_id}/gerar-resumo", response_model=ConversationResponse)
async def gerar_resumo_automatico(
    conversation_id: str,
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Gerar resumo automaticamente baseado nas mensagens da conversa"""
    try:
        # Converter string para UUID
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de conversa invÃ¡lido")

        # Gerar e atualizar resumo automaticamente
        updated_conversation = (
            await conversation_service.auto_update_summary_from_conversation(conv_uuid)
        )

        if not updated_conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversa nÃ£o encontrada ou erro ao gerar resumo",
            )

        return ConversationResponse.model_validate(updated_conversation)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar resumo automÃ¡tico: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/estatisticas", response_model=dict)
async def obter_estatisticas_usuario(
    user_id: Optional[str] = Query(None, description="ID do usuÃ¡rio"),
    conversation_service: ConversationService = Depends(get_conversation_service),
    _: object = Depends(get_current_apikey),
):
    """Obter estatÃ­sticas de conversas do usuÃ¡rio"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="ID do usuÃ¡rio Ã© obrigatÃ³rio")

        # Obter estatÃ­sticas
        stats = await conversation_service.get_user_conversation_stats(user_id)

        return stats

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter estatÃ­sticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e

@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: uuid.UUID,
    user_id: str = Query(..., description="ID do usuário"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=200, description="Itens por página"),
    _: object = Depends(get_current_apikey),
):
    """Listar mensagens de uma conversa"""
    try:
        # Importar o service de mensagens
        from src.services.message_service import MessageService
        from src.config.orm_config import get_db
        import json

        # Obter DB session
        async for db in get_db():
            message_service = MessageService(db)

            # Buscar mensagens
            messages, total = await message_service.list_messages(
                conversation_id=conversation_id,
                page=page,
                size=size,
                order_desc=False  # Ordem cronológica
            )

            # Converter para formato da API
            items = []
            for msg in messages:
                # Parse metadata JSON se existir
                metadata = None
                if msg.ds_metadata:
                    try:
                        metadata = json.loads(msg.ds_metadata)
                    except:
                        metadata = None

                items.append({
                    "id_mensagem": str(msg.id_mensagem),
                    "nm_papel": msg.nm_papel,
                    "ds_conteudo": msg.ds_conteudo,
                    "dt_criacao": msg.dt_criacao.isoformat() if msg.dt_criacao else None,
                    "nr_tokens": msg.nr_tokens,
                    "vl_custo": float(msg.vl_custo) if msg.vl_custo else None,
                    "nm_modelo": msg.nm_modelo,
                    "ds_metadata": metadata
                })

            # Calcular total de páginas
            total_pages = (total + size - 1) // size if total > 0 else 0

            return {
                "items": items,
                "total": total,
                "page": page,
                "page_size": size,
                "total_pages": total_pages
            }

    except Exception as e:
        logger.error(f"Erro ao listar mensagens: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
