import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field, ValidationError

# Importar agentes customizados e DTOs
from src.agents import (
    AgentFactory,
    AgentType,
    CustomAgentRequest,
    CustomAgentResponse,
    DynamicCustomAgent,
    PromptGenerationRequest,
    PromptGenerationResponse,
    PromptGeneratorAgent,
    SummaryGeneratorAgent,
    TitleGeneratorAgent,
    format_validation_error,
)
from src.config.logger_config import get_logger
from src.config.orm_config import get_async_session_context
from src.models.agent import AgentCreate, AgentUpdate
from src.presentes.agent_presenter import AgentPresenter
from src.services.agent_service import AgentService, get_agent_service
from src.services.chat_message_service import (
    ChatMessageService,
    get_chat_message_service,
)
from src.services.conversation_service import (
    ConversationService,
    get_conversation_service,
)
from src.utils.auth import get_current_apikey, get_current_apikey_optional

logger = get_logger(__name__)

router = APIRouter(prefix="/agentes", tags=["agentes"])


class AddToolToAgentRequest(BaseModel):
    tool_id: uuid.UUID = Field(..., description="ID da ferramenta")
    agent_id: uuid.UUID = Field(..., description="ID do agente")


class RemoveToolFromAgentRequest(BaseModel):
    tool_id: uuid.UUID = Field(..., description="ID da ferramenta")
    agent_id: uuid.UUID = Field(..., description="ID do agente")


# Endpoints CRUD para Agentes (mantidos)
@router.post("/", status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Criar um novo agente"""
    try:
        agent = await agent_service.create_agent(agent_data)
        presenter = AgentPresenter()
        return presenter.present_agent_response(agent, method="POST")
    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao criar agente: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/")
async def list_agents(
    page: int = Query(1, ge=1, description="NÃºmero da pÃ¡gina"),
    size: int = Query(10, ge=1, le=100, description="Itens por pÃ¡gina"),
    search: Optional[str] = Query(None, description="Termo de busca"),
    credential_filter: Optional[uuid.UUID] = Query(
        None, description="Filtrar por credencial"
    ),
    st_principal: Optional[bool] = Query(
        None, description="Filtrar por agente principal"
    ),
    order_by: str = Query("dt_criacao", description="Campo para ordenaÃ§Ã£o"),
    order_desc: bool = Query(True, description="OrdenaÃ§Ã£o decrescente"),
    st_principal_header: Optional[str] = Header(None, alias="st-principal"),
    agent_service: AgentService = Depends(get_agent_service),
    _: Optional[object] = Depends(get_current_apikey_optional),
):
    """Listar agentes com paginaÃ§Ã£o e filtros"""
    try:
        # Se header st-principal for 'true', retornar apenas o idAgente do agente principal
        if st_principal_header and st_principal_header.lower() == "true":
            agent = await agent_service.get_principal_agent()
            if not agent:
                raise HTTPException(
                    status_code=404, detail="Agente principal nÃ£o encontrado"
                )

            from fastapi.responses import PlainTextResponse

            return PlainTextResponse(str(agent.id_agente))

        agents, total = await agent_service.list_agents(
            page=page,
            size=size,
            search=search,
            st_principal=st_principal,
            order_by=order_by,
            order_desc=order_desc,
        )
        presenter = AgentPresenter()
        return presenter.present_agent_list_response(agents, total, page, size)
    except Exception as e:
        logger.error(f"Erro ao listar agentes: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{agent_id}")
async def get_agent(
    agent_id: uuid.UUID,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Obter um agente por ID"""
    try:
        agent = await agent_service.get_agent_by_id(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agente nÃ£o encontrado")

        presenter = AgentPresenter()
        return presenter.present_agent(agent)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{agent_id}")
async def update_agent(
    agent_id: uuid.UUID,
    agent_update: AgentUpdate,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Atualizar um agente"""
    try:
        agent = await agent_service.update_agent(agent_id, agent_update)
        if not agent:
            raise HTTPException(status_code=404, detail="Agente nÃ£o encontrado")

        presenter = AgentPresenter()
        result = presenter.present_agent_response(agent, method="PUT")
        return result
    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao atualizar agente: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: uuid.UUID,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Deletar um agente"""
    try:
        success = await agent_service.delete_agent(agent_id)
        if not success:
            raise HTTPException(status_code=404, detail="Agente nÃ£o encontrado")
        return {"message": "Agente deletado com sucesso"}
    except Exception as e:
        logger.error(f"Erro ao deletar agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{agent_id}/summary")
async def get_agent_summary(
    agent_id: uuid.UUID,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Obter resumo de um agente (para dashboards e listagens rÃ¡pidas)"""
    try:
        agent = await agent_service.get_agent_by_id(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agente nÃ£o encontrado")
        presenter = AgentPresenter()
        return presenter.present_agent_summary(agent)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar resumo do agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/custom", response_model=CustomAgentResponse)
async def process_with_custom_agent(
    request: CustomAgentRequest, _: object = Depends(get_current_apikey)
):
    """
    Processar texto com agente baseado no tipo especificado em nome_agente.
    Suporta agentes especÃ­ficos (titulo_agente, resumo_agente) e agente dinÃ¢mico.
    """
    try:
        logger.debug(f"Processando com agente: {request.nome_agente}")

        # Usar sessÃ£o do banco para os agentes
        async with get_async_session_context() as db_session:
            # Verificar se o tipo de agente Ã© vÃ¡lido
            if not AgentFactory.is_valid_agent_type(request.nome_agente):
                available_types = AgentFactory.get_available_types()
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipo de agente invÃ¡lido: {request.nome_agente}. Tipos disponÃ­veis: {available_types}",
                )

            # Obter informaÃ§Ãµes do agente
            agent_info = AgentFactory.get_agent_info(request.nome_agente)
            agent_class = AgentFactory.get_agent_class(request.nome_agente)

            if not agent_class or not agent_info:
                raise HTTPException(
                    status_code=500,
                    detail="Erro interno: agente nÃ£o configurado corretamente",
                )

            # Processar baseado no tipo de agente
            if request.nome_agente == AgentType.TITULO_AGENTE:
                # Usar TitleGeneratorAgent
                logger.debug("Criando TitleGeneratorAgent")
                agent = TitleGeneratorAgent()
                resultado = await agent.generate_title(text=request.texto)
                metrics = {"input_tokens": 0, "output_tokens": 0, "truncated": False}

            elif request.nome_agente == AgentType.RESUMO_AGENTE:
                # Usar SummaryGeneratorAgent
                logger.debug("Criando SummaryGeneratorAgent")
                agent = SummaryGeneratorAgent()
                resultado = await agent.generate_summary(text=request.texto)
                metrics = {"input_tokens": 0, "output_tokens": 0, "truncated": False}

            elif request.nome_agente == AgentType.DINAMICO_AGENTE:
                # Usar DynamicCustomAgent com parÃ¢metros configurÃ¡veis
                logger.debug("Criando DynamicCustomAgent")

                # Usar valores padrÃ£o se nÃ£o fornecidos
                temperatura = (
                    request.temperatura if request.temperatura is not None else 0.3
                )
                max_tokens = (
                    request.max_tokens if request.max_tokens is not None else 500
                )
                limite_tokens_analise = (
                    request.limite_tokens_analise
                    if request.limite_tokens_analise is not None
                    else 2000
                )

                is_valid, error_msg = DynamicCustomAgent.validate_parameters(
                    agent_name=request.nome_agente,
                    temperatura=temperatura,
                    max_tokens=max_tokens,
                    limite_tokens_analise=limite_tokens_analise,
                    output_type=request.output_type or "string",
                )

                if not is_valid:
                    raise HTTPException(status_code=400, detail=error_msg)

                agent = DynamicCustomAgent(
                    agent_name=request.nome_agente,
                    temperatura=temperatura,
                    max_tokens=max_tokens,
                    limite_tokens_analise=limite_tokens_analise,
                    output_exemplo=request.output_exemplo,
                    output_type=request.output_type or "string",
                    db_session=db_session,
                )

                logger.debug(
                    f"DynamicCustomAgent criado com output_type: {request.output_type or 'string'}"
                )

                resultado, metrics = await agent.process_text(texto=request.texto)

            elif request.nome_agente == AgentType.PROMPT_GENERATOR_AGENTE:
                # Usar PromptGeneratorAgent
                logger.debug("Criando PromptGeneratorAgent")
                agent = PromptGeneratorAgent()

                # Para o endpoint /custom, usar o texto como descriÃ§Ã£o
                # e criar contexto bÃ¡sico
                descricao = request.texto
                contexto = "Gerado via endpoint /custom"
                tipo_agente = "geral"

                resultado, metrics = await agent.generate_prompt(
                    descricao=descricao, contexto=contexto, tipo_agente=tipo_agente
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipo de agente nÃ£o implementado: {request.nome_agente}",
                )

            logger.debug("Criando resposta")
            return CustomAgentResponse(
                result=resultado,
                agent_type=request.nome_agente,
                agent_name=agent_info["name"],
                timestamp=datetime.now().isoformat(),
                input_tokens=metrics.get("input_tokens", 0),
                output_tokens=metrics.get("output_tokens", 0),
                truncated=metrics.get("truncated", False),
                output_type=metrics.get("output_type", "string"),
                structured=metrics.get("structured", False),
            )

    except ValidationError as e:
        # Tratar erros de validaÃ§Ã£o do Pydantic
        error_message = format_validation_error(e)
        logger.warning(f"Erro de validaÃ§Ã£o: {error_message}")
        raise HTTPException(status_code=400, detail=error_message)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar com agente {request.nome_agente}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar com agente {request.nome_agente}: {str(e)}",
        ) from e


@router.post("/generate-prompt", response_model=PromptGenerationResponse)
async def generate_agent_prompt(
    request: PromptGenerationRequest, _: object = Depends(get_current_apikey)
):
    """
    Gerar prompt para agente baseado em descriÃ§Ã£o e contexto
    """
    try:
        logger.debug(f"Gerando prompt para tipo: {request.tipo_agente}")

        # Criar instÃ¢ncia do PromptGeneratorAgent
        agent = PromptGeneratorAgent()

        # Gerar o prompt
        prompt, _ = await agent.generate_prompt(
            descricao=request.descricao,
            contexto=request.contexto,
            tipo_agente=request.tipo_agente,
        )

        # Gerar sugestÃµes baseadas no tipo de agente
        sugestoes = _gerar_sugestoes(request.descricao, request.tipo_agente)

        logger.info(f"Prompt gerado com sucesso para tipo: {request.tipo_agente}")

        return PromptGenerationResponse(
            prompt=prompt,
            sugestoes=sugestoes,
            timestamp=datetime.now().isoformat(),
            tipo_agente=request.tipo_agente,
            qualidade="alta",
        )

    except ValidationError as e:
        error_message = format_validation_error(e)
        logger.warning(f"Erro de validaÃ§Ã£o na geraÃ§Ã£o de prompt: {error_message}")
        raise HTTPException(status_code=400, detail=error_message)
    except Exception as e:
        logger.error(f"Erro ao gerar prompt: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao gerar prompt") from e


def _gerar_sugestoes(descricao: str, tipo_agente: str) -> list[str]:
    """
    Gera sugestÃµes para melhorar o prompt baseado no tipo de agente
    """
    sugestoes = []

    # SugestÃµes gerais
    if len(descricao) < 50:
        sugestoes.append(
            "Considere adicionar mais detalhes sobre as responsabilidades especÃ­ficas do agente"
        )

    if (
        "tom de voz" not in descricao.lower()
        and "comportamento" not in descricao.lower()
    ):
        sugestoes.append("Especifique o tom de voz e comportamento esperado do agente")

    # SugestÃµes especÃ­ficas por tipo
    if tipo_agente == "atendimento":
        sugestoes.extend(
            [
                "Inclua diretrizes para lidar com clientes insatisfeitos",
                "Defina procedimentos para escalaÃ§Ã£o de problemas",
                "Especifique o nÃ­vel de formalidade nas respostas",
            ]
        )
    elif tipo_agente == "suporte":
        sugestoes.extend(
            [
                "Adicione instruÃ§Ãµes para troubleshooting passo a passo",
                "Defina quando solicitar informaÃ§Ãµes adicionais do usuÃ¡rio",
                "Especifique como lidar com problemas tÃ©cnicos complexos",
            ]
        )
    elif tipo_agente == "vendas":
        sugestoes.extend(
            [
                "Inclua tÃ©cnicas de qualificaÃ§Ã£o de leads",
                "Defina estratÃ©gias de apresentaÃ§Ã£o de produtos",
                "Especifique como lidar com objeÃ§Ãµes",
            ]
        )
    elif tipo_agente == "analise":
        sugestoes.extend(
            [
                "Defina formatos de relatÃ³rio esperados",
                "Especifique mÃ©tricas e KPIs relevantes",
                "Inclua diretrizes para interpretaÃ§Ã£o de dados",
            ]
        )
    elif tipo_agente == "criativo":
        sugestoes.extend(
            [
                "Defina o estilo e tom criativo desejado",
                "Especifique formatos de conteÃºdo (texto, vÃ­deo, imagem)",
                "Inclua diretrizes para manter consistÃªncia de marca",
            ]
        )

    return sugestoes


@router.get("/custom/available-agents")
async def list_custom_agents(current_user=Depends(get_current_apikey)):
    """Listar agentes customizados disponÃ­veis"""
    available_agents = []

    # Adicionar agentes do enum
    for agent_type in AgentType:
        agent_info = AgentFactory.get_agent_info(agent_type.value)
        if agent_info:
            agent_data = {
                "type": agent_type.value,
                "name": agent_info["name"],
                "description": agent_info["description"],
                "has_tools": False,
                "has_memory": False,
                "endpoint": "/agentes/custom",
                "supports_dynamic_config": agent_info["supports_dynamic_config"],
            }

            # Definir formato de entrada baseado no tipo
            if agent_type == AgentType.DINAMICO_AGENTE:
                agent_data["input_format"] = {
                    "texto": "string - Texto para processamento",
                    "temperatura": "float (0.0-1.0, opcional, padrÃ£o: 0.3) - Controla criatividade",
                    "max_tokens": "int (1-4000, opcional, padrÃ£o: 500) - Limite de tokens na resposta",
                    "limite_tokens_analise": "int (100-8000, opcional, padrÃ£o: 2000) - Limite de tokens para anÃ¡lise",
                    "nome_agente": f"string (obrigatÃ³rio: '{agent_type.value}') - Tipo do agente",
                    "output_exemplo": "string (opcional) - Exemplo de formato de saÃ­da",
                    "output_type": "string (opcional, padrÃ£o: 'string') - Tipo de saÃ­da estruturada: string, number, boolean, array, dictionary, object",
                }
            elif agent_type == AgentType.PROMPT_GENERATOR_AGENTE:
                agent_data["input_format"] = {
                    "descricao": "string (obrigatÃ³rio, 10-2000 chars) - DescriÃ§Ã£o detalhada do agente desejado",
                    "contexto": "string (opcional, max 1000 chars) - Contexto adicional (pÃºblico-alvo, tom de voz)",
                    "tipo_agente": "string (opcional, max 50 chars) - Tipo/categoria do agente",
                    "nome_agente": f"string (obrigatÃ³rio: '{agent_type.value}') - Tipo do agente",
                    "nota": "Este agente gera prompts estruturados para outros agentes de IA",
                }
            else:
                agent_data["input_format"] = {
                    "texto": "string - Texto para processamento",
                    "nome_agente": f"string (obrigatÃ³rio: '{agent_type.value}') - Tipo do agente",
                    "temperatura": "float (opcional, ignorado) - ParÃ¢metros de configuraÃ§Ã£o sÃ£o ignorados para este agente especÃ­fico",
                    "max_tokens": "int (opcional, ignorado) - ParÃ¢metros de configuraÃ§Ã£o sÃ£o ignorados para este agente especÃ­fico",
                    "nota": "Este agente usa configuraÃ§Ãµes fixas otimizadas para sua funÃ§Ã£o especÃ­fica",
                }

            available_agents.append(agent_data)

    return {
        "available_agents": available_agents,
        "note": "Use o endpoint /agentes/custom com nome_agente para acessar todos os agentes de forma unificada",
    }


@router.get("/conversation/{conversation_token}/messages")
async def get_conversation_messages(
    conversation_token: str,
    conversation_service: ConversationService = Depends(get_conversation_service),
    chat_message_service: ChatMessageService = Depends(get_chat_message_service),
    _: object = Depends(get_current_apikey),
):
    """Obter mensagens de uma conversa pelo token"""
    try:
        # Buscar conversa pelo token
        conversation = await conversation_service.get_conversation_by_token(
            conversation_token
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversa nÃ£o encontrada")

        # Buscar mensagens da conversa
        messages, _ = await chat_message_service.list_messages_by_session(
            session_id=str(conversation.id_conversa), page=1, size=100
        )

        # Converter para formato de resposta
        message_responses = []
        for msg in messages:
            message_responses.append(
                {
                    "id_chat_message": str(msg.id_chat_message),
                    "id_agent": str(msg.id_agent),
                    "id_conversa": str(msg.id_conversa),
                    "tools": msg.tools,
                    "nm_text": msg.nm_text,
                    "nm_tipo": msg.nm_tipo,
                }
            )

        return message_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar mensagens da conversa: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# Novos endpoints para gerenciamento de tools em agentes


@router.post("/{agent_id}/add-tool")
async def add_tool_to_agent(
    agent_id: uuid.UUID,
    body: AddToolToAgentRequest,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Adicionar uma ferramenta a um agente"""
    try:
        result = await agent_service.add_tool_to_agent(agent_id, body.tool_id)
        return {
            "message": "Ferramenta adicionada ao agente com sucesso",
            "data": result,
        }
    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao adicionar tool ao agente: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao adicionar tool ao agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{agent_id}/remove-tool")
async def remove_tool_from_agent(
    agent_id: uuid.UUID,
    body: RemoveToolFromAgentRequest,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Remover uma ferramenta de um agente"""
    try:
        result = await agent_service.remove_tool_from_agent(agent_id, body.tool_id)
        return {"message": "Ferramenta removida do agente com sucesso", "data": result}
    except ValueError as e:
        logger.warning(f"Erro de validaÃ§Ã£o ao remover tool do agente: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao remover tool do agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# Novos endpoints para gerenciamento de Document Stores em agentes


class AddDocumentStoreToAgentRequest(BaseModel):
    document_store_id: uuid.UUID = Field(..., description="ID do Document Store")
    search_type: str = Field(
        "embedding",
        description="Tipo de busca: 'embedding' para busca semântica ou 'text' para busca textual"
    )


class RemoveDocumentStoreFromAgentRequest(BaseModel):
    document_store_id: uuid.UUID = Field(..., description="ID do Document Store")


@router.get("/{agent_id}/document-stores")
async def list_agent_document_stores(
    agent_id: uuid.UUID,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Listar Document Stores vinculados a um agente"""
    try:
        document_stores_data = await agent_service.list_agent_document_stores(agent_id)
        return {
            "agent_id": str(agent_id),
            "document_stores": [
                {
                    "id_documento_store": str(item["document_store"].id_documento_store),
                    "nm_documento_store": item["document_store"].nm_documento_store,
                    "ds_documento_store": item["document_store"].ds_documento_store,
                    "nm_status": item["document_store"].nm_status,
                    "nm_search_type": item["search_type"],
                    "dt_criacao": item["document_store"].dt_criacao.isoformat() if item["document_store"].dt_criacao else None,
                }
                for item in document_stores_data
            ],
            "total": len(document_stores_data),
        }
    except ValueError as e:
        logger.warning(f"Erro ao listar Document Stores do agente: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao listar Document Stores do agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{agent_id}/document-stores")
async def add_document_store_to_agent(
    agent_id: uuid.UUID,
    body: AddDocumentStoreToAgentRequest,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Vincular um Document Store a um agente"""
    try:
        result = await agent_service.add_document_store_to_agent(
            agent_id, body.document_store_id, body.search_type
        )
        return {
            "message": "Document Store vinculado ao agente com sucesso",
            "data": {
                "id_agent_document_store": str(result.id_agent_document_store),
                "id_agente": str(result.id_agente),
                "id_documento_store": str(result.id_documento_store),
                "nm_search_type": result.nm_search_type,
                "dt_criacao": result.dt_criacao.isoformat() if result.dt_criacao else None,
            },
        }
    except ValueError as e:
        logger.warning(f"Erro ao vincular Document Store ao agente: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao vincular Document Store ao agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{agent_id}/document-stores/{document_store_id}")
async def remove_document_store_from_agent(
    agent_id: uuid.UUID,
    document_store_id: uuid.UUID,
    agent_service: AgentService = Depends(get_agent_service),
    _: object = Depends(get_current_apikey),
):
    """Desvincular um Document Store de um agente"""
    try:
        await agent_service.remove_document_store_from_agent(agent_id, document_store_id)
        return {
            "message": "Document Store desvinculado do agente com sucesso",
            "agent_id": str(agent_id),
            "document_store_id": str(document_store_id),
        }
    except ValueError as e:
        logger.warning(f"Erro ao desvincular Document Store do agente: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao desvincular Document Store do agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
