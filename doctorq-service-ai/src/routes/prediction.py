import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.config.logger_config import get_logger
from src.services.agent_service import AgentService, get_agent_service
from src.services.langchain_service import LangChainService, get_langchain_service
from src.utils.auth import get_current_apikey
from src.utils.sse_wrapper import create_sse_wrapper

logger = get_logger(__name__)

router = APIRouter(prefix="/predictions", tags=["predictions"])


# Modelos Pydantic para Chat
class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_login: Optional[str] = None
    conversation_token: Optional[str] = None
    filter_sources: Optional[List[str]] = []


class ChatResponse(BaseModel):
    response: str
    tools: Optional[List[str]] = []
    sources: Optional[List[dict]] = []
    conversation_token: str
    timestamp: str


@router.post("/{id_agente}")
async def chat_message(
    chat_data: ChatMessage,
    langchain_service: LangChainService = Depends(get_langchain_service),
    agent_service: AgentService = Depends(get_agent_service),
    id_agente: uuid.UUID = Path(..., description="ID do agente"),
    _: object = Depends(get_current_apikey),
):
    """Endpoint para mensagem de chat com ou sem streaming"""
    try:
        try:
            agent = await agent_service.get_agent_by_id(id_agente)

            if not agent:
                raise HTTPException(
                    status_code=404,
                    detail=f"Agente nÃ£o encontrado: {id_agente}",
                )

            # Extrair configuraÃ§Ãµes do agente
            agent_config = agent.ds_config

            # Adicionar agent_id ao config para uso nas tools
            if agent_config:
                agent_config = dict(agent_config)  # Criar cÃ³pia para modificar
                agent_config["agent_id"] = str(id_agente)

            # Buscar Document Stores vinculados ao agente
            document_stores_data = await agent_service.list_agent_document_stores(id_agente)
            # list_agent_document_stores retorna lista de dicts: {"document_store": obj, "search_type": str}
            document_store_ids = [str(item["document_store"].id_documento_store) for item in document_stores_data]
            agent_config["document_store_ids"] = document_store_ids

        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"ID do agente invÃ¡lido: {id_agente}",
            ) from e
        except Exception as e:
            logger.error(f"Erro ao buscar agente {id_agente}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Erro interno ao buscar configuraÃ§Ãµes do agente",
            ) from e

        # Verificar se streaming estÃ¡ habilitado na configuraÃ§Ã£o do modelo
        should_stream = agent.is_streaming_enabled()

        # Verificar se memÃ³ria estÃ¡ habilitada na configuraÃ§Ã£o do agente
        should_use_memory = agent.is_memory_enabled()

        # Verificar se o agente tem ferramentas configuradas
        should_use_tools = agent.has_tools()

        # Verificar se observabilidade estÃ¡ habilitada na configuraÃ§Ã£o do agente
        # should_use_observability = agent.is_observability_enabled()

        if should_stream:
            # Modo streaming com SSE
            logger.debug("Usando modo streaming com SSE")
            logger.debug(f"filter_sources: {chat_data.filter_sources}")

            # Criar wrapper SSE
            sse_wrapper = create_sse_wrapper(
                user_id=chat_data.user_id,
                conversation_token=chat_data.conversation_token,
            )

            # LangChain processa COM streaming e COM memÃ³ria usando novo mÃ©todo
            llm_stream = langchain_service.run_process_streaming(
                user_message=chat_data.message,
                user_id=chat_data.user_id,
                conversation_token=chat_data.conversation_token,
                system_prompt=agent.ds_prompt,
                user_name=chat_data.user_name or "",
                user_email=chat_data.user_email or "",
                user_login=chat_data.user_login or "",
                use_memory=should_use_memory,
                use_tools=should_use_tools,
                filter_sources=chat_data.filter_sources,
                agent_config=agent_config,
            )

            # SSE Wrapper apenas formata o stream
            sse_stream = sse_wrapper.wrap_stream(llm_stream, langchain_service)

            return StreamingResponse(
                sse_stream,
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                },
            )

        # Modo simples (JSON response) usando novo mÃ©todo
        response_text = await langchain_service.run_process_simple(
            user_message=chat_data.message,
            user_id=chat_data.user_id,
            conversation_token=chat_data.conversation_token,
            system_prompt=agent.ds_prompt,
            user_name=chat_data.user_name or "UsuÃ¡rio",
            user_email=chat_data.user_email or "",
            user_login=chat_data.user_login or "",
            use_memory=should_use_memory,
            use_tools=should_use_tools,
            filter_sources=chat_data.filter_sources,
            agent_config=agent_config,
        )

        # Capturar tools utilizadas na Ãºltima execuÃ§Ã£o
        tools_used = await langchain_service.get_tools_used_in_last_execution()

        # Capturar sources/documentos utilizados na Ãºltima execuÃ§Ã£o do RAG
        sources_used = await langchain_service.get_sources_used_in_last_execution()

        return ChatResponse(
            response=response_text,
            tools=tools_used,
            sources=sources_used,
            conversation_token=chat_data.conversation_token or "default",
            timestamp=datetime.now().isoformat(),
        )

    except Exception as e:
        error_msg = str(e)
        if (
            "context_length_exceeded" in error_msg
            or "maximum context length" in error_msg
        ):
            logger.warning(f"Contexto excedido: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail="A janela de contexto acabou e favor inicie outra conversa",
            ) from e
        logger.error(f"Erro ao processar mensagem: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor. Por favor, tente novamente mais tarde.",
        ) from e
