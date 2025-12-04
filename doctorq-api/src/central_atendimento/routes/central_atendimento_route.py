# src/central_atendimento/routes/central_atendimento_route.py
"""
Rotas principais da Central de Atendimento Omnichannel.
"""

import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.config.logger_config import get_logger
from src.utils.auth import get_current_user, get_empresa_from_user
from src.models.user import User

# Services
from src.central_atendimento.services.canal_service import CanalService
from src.central_atendimento.services.contato_service import ContatoOmniService
from src.central_atendimento.services.conversa_service import ConversaOmniService
from src.central_atendimento.services.fila_service import FilaAtendimentoService
from src.central_atendimento.services.campanha_service import CampanhaService
from src.central_atendimento.services.lead_scoring_service import LeadScoringService
from src.central_atendimento.services.routing_service import RoutingService
from src.central_atendimento.services.whatsapp_service import WhatsAppService
from src.central_atendimento.services.websocket_chat_gateway import (
    get_websocket_chat_gateway,
    ChatEventType,
)

# Schemas
from src.central_atendimento.models.canal import (
    CanalCreate,
    CanalUpdate,
    CanalResponse,
    CanalListResponse,
    CanalTipo,
    CanalStatus,
)
from src.central_atendimento.models.contato_omni import (
    ContatoOmniCreate,
    ContatoOmniUpdate,
    ContatoOmniResponse,
    ContatoOmniListResponse,
    ContatoOmniImportRequest,
    ContatoStatus,
)
from src.central_atendimento.models.conversa_omni import (
    ConversaOmniCreate,
    ConversaOmniUpdate,
    ConversaOmniResponse,
    ConversaOmniListResponse,
    MensagemOmniCreate,
    MensagemOmniResponse,
    MensagemOmniListResponse,
    MensagemStatus,
    EnviarMensagemRequest,
)
from src.central_atendimento.models.fila_atendimento import (
    FilaAtendimentoCreate,
    FilaAtendimentoUpdate,
    FilaAtendimentoResponse,
    FilaAtendimentoListResponse,
    AtendimentoItemResponse,
    AtendimentoItemListResponse,
    TransferirAtendimentoRequest,
    FilaMetricas,
    AtendimentoStatus,
)
from src.central_atendimento.models.campanha import (
    CampanhaCreate,
    CampanhaUpdate,
    CampanhaResponse,
    CampanhaListResponse,
    CampanhaMetricas,
    AdicionarDestinatariosRequest,
    CampanhaStatus,
    CampanhaTipo,
)
from src.central_atendimento.models.lead_scoring import (
    LeadScoreResponse,
    LeadScoreAnalise,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/central-atendimento", tags=["Central de Atendimento"])


# =============================================================================
# Canais
# =============================================================================

@router.post("/canais/", response_model=CanalResponse, status_code=status.HTTP_201_CREATED)
async def criar_canal(
    dados: CanalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cria um novo canal de comunicação."""
    id_empresa = get_empresa_from_user(current_user)
    service = CanalService(db, id_empresa)
    canal = await service.criar(dados)
    return CanalResponse.model_validate(canal)


@router.get("/canais/", response_model=CanalListResponse)
async def listar_canais(
    tp_canal: Optional[CanalTipo] = None,
    st_canal: Optional[CanalStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista canais da empresa."""
    id_empresa = get_empresa_from_user(current_user)
    service = CanalService(db, id_empresa)
    canais, total = await service.listar(tp_canal, st_canal, page, page_size)
    return CanalListResponse(
        items=[CanalResponse.model_validate(c) for c in canais],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/canais/{id_canal}", response_model=CanalResponse)
async def obter_canal(
    id_canal: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém um canal pelo ID."""
    id_empresa = get_empresa_from_user(current_user)
    service = CanalService(db, id_empresa)
    canal = await service.obter(id_canal)
    if not canal:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    return CanalResponse.model_validate(canal)


@router.patch("/canais/{id_canal}", response_model=CanalResponse)
async def atualizar_canal(
    id_canal: uuid.UUID,
    dados: CanalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Atualiza um canal."""
    id_empresa = get_empresa_from_user(current_user)
    service = CanalService(db, id_empresa)
    canal = await service.atualizar(id_canal, dados)
    if not canal:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    return CanalResponse.model_validate(canal)


@router.delete("/canais/{id_canal}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_canal(
    id_canal: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Deleta um canal."""
    id_empresa = get_empresa_from_user(current_user)
    service = CanalService(db, id_empresa)
    if not await service.deletar(id_canal):
        raise HTTPException(status_code=404, detail="Canal não encontrado")


@router.post("/canais/{id_canal}/validar")
async def validar_credenciais_canal(
    id_canal: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Valida as credenciais de um canal."""
    id_empresa = get_empresa_from_user(current_user)
    service = CanalService(db, id_empresa)
    resultado = await service.validar_credenciais(id_canal)
    return resultado


# =============================================================================
# Contatos
# =============================================================================

@router.post("/contatos/", response_model=ContatoOmniResponse, status_code=status.HTTP_201_CREATED)
async def criar_contato(
    dados: ContatoOmniCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cria um novo contato."""
    id_empresa = get_empresa_from_user(current_user)
    service = ContatoOmniService(db, id_empresa)
    contato = await service.criar(dados)
    return ContatoOmniResponse.model_validate(contato)


@router.get("/contatos/", response_model=ContatoOmniListResponse)
async def listar_contatos(
    st_contato: Optional[ContatoStatus] = None,
    tags: Optional[str] = None,
    busca: Optional[str] = None,
    score_minimo: Optional[int] = None,
    score_maximo: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    ordenar_por: str = "dt_criacao",
    ordem: str = "desc",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista contatos com filtros."""
    id_empresa = get_empresa_from_user(current_user)
    service = ContatoOmniService(db, id_empresa)

    tags_list = tags.split(",") if tags else None

    contatos, total = await service.listar(
        st_contato=st_contato,
        tags=tags_list,
        score_minimo=score_minimo,
        score_maximo=score_maximo,
        busca=busca,
        page=page,
        page_size=page_size,
        ordenar_por=ordenar_por,
        ordem=ordem,
    )

    return ContatoOmniListResponse(
        items=[ContatoOmniResponse.model_validate(c) for c in contatos],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/contatos/{id_contato}", response_model=ContatoOmniResponse)
async def obter_contato(
    id_contato: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém um contato pelo ID."""
    id_empresa = get_empresa_from_user(current_user)
    service = ContatoOmniService(db, id_empresa)
    contato = await service.obter(id_contato)
    if not contato:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    return ContatoOmniResponse.model_validate(contato)


@router.patch("/contatos/{id_contato}", response_model=ContatoOmniResponse)
async def atualizar_contato(
    id_contato: uuid.UUID,
    dados: ContatoOmniUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Atualiza um contato."""
    id_empresa = get_empresa_from_user(current_user)
    service = ContatoOmniService(db, id_empresa)
    contato = await service.atualizar(id_contato, dados)
    if not contato:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    return ContatoOmniResponse.model_validate(contato)


@router.delete("/contatos/{id_contato}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_contato(
    id_contato: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Deleta um contato."""
    id_empresa = get_empresa_from_user(current_user)
    service = ContatoOmniService(db, id_empresa)
    if not await service.deletar(id_contato):
        raise HTTPException(status_code=404, detail="Contato não encontrado")


@router.post("/contatos/importar")
async def importar_contatos(
    dados: ContatoOmniImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Importa contatos em massa."""
    id_empresa = get_empresa_from_user(current_user)
    service = ContatoOmniService(db, id_empresa)
    resultado = await service.importar_contatos(
        dados.contatos,
        dados.st_atualizar_existentes,
        dados.nm_campanha_origem,
        dados.ds_tags,
    )
    return resultado


# =============================================================================
# Conversas
# =============================================================================

@router.post("/conversas/", response_model=ConversaOmniResponse, status_code=status.HTTP_201_CREATED)
async def criar_conversa(
    dados: ConversaOmniCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Cria uma nova conversa.

    Permite criar uma conversa manualmente pela Central de Atendimento.
    A conversa é criada com o contato especificado e canal escolhido.
    """
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)

    # Criar a conversa usando o service
    conversa = await service.criar_conversa(dados)

    # Buscar a conversa com o contato carregado para retorno completo
    conversa_completa = await service.obter_conversa_com_contato(conversa.id_conversa)
    if conversa_completa:
        return ConversaOmniResponse.model_validate(conversa_completa)

    return ConversaOmniResponse.model_validate(conversa)


@router.get("/conversas/", response_model=ConversaOmniListResponse)
async def listar_conversas(
    st_aberta: Optional[bool] = None,
    id_contato: Optional[uuid.UUID] = None,
    tp_canal: Optional[CanalTipo] = None,
    st_aguardando_humano: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista conversas."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)

    conversas, total = await service.listar_conversas(
        st_aberta=st_aberta,
        id_contato=id_contato,
        tp_canal=tp_canal,
        st_aguardando_humano=st_aguardando_humano,
        page=page,
        page_size=page_size,
    )

    return ConversaOmniListResponse(
        items=[ConversaOmniResponse.model_validate(c) for c in conversas],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/conversas/{id_conversa}", response_model=ConversaOmniResponse)
async def obter_conversa(
    id_conversa: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém uma conversa."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)
    conversa = await service.obter_conversa(id_conversa)
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    return ConversaOmniResponse.model_validate(conversa)


@router.get("/conversas/{id_conversa}/mensagens/", response_model=MensagemOmniListResponse)
async def listar_mensagens(
    id_conversa: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    ordem: str = "asc",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista mensagens de uma conversa."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)

    mensagens, total = await service.listar_mensagens(
        id_conversa, page, page_size, ordem
    )

    return MensagemOmniListResponse(
        items=[MensagemOmniResponse.model_validate(m) for m in mensagens],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/conversas/{id_conversa}/enviar/", response_model=MensagemOmniResponse)
async def enviar_mensagem(
    id_conversa: uuid.UUID,
    dados: EnviarMensagemRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Envia uma mensagem em uma conversa."""
    id_empresa = get_empresa_from_user(current_user)

    # Obter conversa
    conversa_service = ConversaOmniService(db, id_empresa)
    conversa = await conversa_service.obter_conversa(id_conversa)
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    # Criar mensagem local (sincronizado com schema em 22/11/2025)
    # current_user pode ser dict (de JWT) ou objeto User (de API key)
    if isinstance(current_user, dict):
        nome_remetente = current_user.get("nm_usuario", "Atendente")
    else:
        nome_remetente = getattr(current_user, "nm_usuario", None) or getattr(current_user, "nm_nome", "Atendente")

    mensagem_dados = MensagemOmniCreate(
        id_conversa=id_conversa,
        st_entrada=False,
        nm_remetente=nome_remetente,
        tp_mensagem=dados.tp_mensagem,
        ds_conteudo=dados.ds_conteudo,
        ds_url_midia=dados.ds_url_midia,
    )

    mensagem = await conversa_service.criar_mensagem(mensagem_dados)

    # Notificar participantes via WebSocket
    try:
        gateway = get_websocket_chat_gateway()
        await gateway.send_message_to_room(
            room_id=str(id_conversa),
            event_type=ChatEventType.MESSAGE,
            data={
                "from": {
                    "role": "attendant",
                    "name": nome_remetente,
                },
                "content": dados.ds_conteudo,
                "type": dados.tp_mensagem or "text",
                "timestamp": mensagem.dt_criacao.isoformat() if mensagem.dt_criacao else None,
                "message_id": str(mensagem.id_mensagem),
            },
            from_system=False,
        )
        logger.debug(f"Mensagem notificada via WebSocket: room={id_conversa}")
    except Exception as ws_error:
        logger.warning(f"Falha ao notificar WebSocket: {ws_error}")
        # Não falhar a requisição se WebSocket falhar

    # Enviar via WhatsApp se for o canal
    if conversa.tp_canal == CanalTipo.WHATSAPP:
        try:
            whatsapp = WhatsAppService(db, id_empresa)

            # Obter telefone do contato
            contato_service = ContatoOmniService(db, id_empresa)
            contato = await contato_service.obter(conversa.id_contato)

            if contato and contato.nr_telefone:
                if dados.nm_template:
                    resultado = await whatsapp.enviar_mensagem_template(
                        contato.nr_telefone,
                        dados.nm_template,
                        components=dados.ds_template_params.get("components") if dados.ds_template_params else None,
                    )
                else:
                    resultado = await whatsapp.enviar_mensagem_texto(
                        contato.nr_telefone,
                        dados.ds_conteudo,
                    )

                # Atualizar mensagem com ID externo
                if resultado.get("messages"):
                    await conversa_service.atualizar_status_mensagem(
                        mensagem.id_mensagem,
                        MensagemStatus.ENVIADA,
                        resultado["messages"][0].get("id"),
                    )

        except Exception as e:
            logger.error(f"Erro ao enviar via WhatsApp: {e}")
            # Não falhar a requisição, apenas logar

    return MensagemOmniResponse.model_validate(mensagem)


@router.post("/conversas/{id_conversa}/transferir-humano/")
async def transferir_para_humano(
    id_conversa: uuid.UUID,
    id_fila: Optional[uuid.UUID] = None,
    motivo: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Transfere conversa para atendimento humano."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)

    conversa = await service.transferir_para_humano(id_conversa, id_fila, motivo)
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    # Adicionar à fila de atendimento
    routing = RoutingService(db, id_empresa)
    await routing.rotear_conversa(id_conversa, id_fila, motivo=motivo)

    return {"message": "Conversa transferida para atendimento humano"}


@router.post("/conversas/{id_conversa}/fechar/")
async def fechar_conversa(
    id_conversa: uuid.UUID,
    avaliacao: Optional[int] = Query(None, ge=1, le=5),
    feedback: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Fecha uma conversa."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)

    conversa = await service.fechar_conversa(id_conversa, avaliacao, feedback)
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    return {"message": "Conversa fechada"}


@router.post("/conversas/{id_conversa}/favoritar/")
async def favoritar_conversa(
    id_conversa: uuid.UUID,
    favorito: bool = Query(True, description="True para favoritar, False para desfavoritar"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Marca ou desmarca uma conversa como favorita."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)

    conversa = await service.favoritar_conversa(id_conversa, favorito)
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    return {
        "message": "Conversa favoritada" if favorito else "Conversa desfavoritada",
        "st_favorito": conversa.st_favorito,
    }


@router.post("/conversas/{id_conversa}/iniciar-video/")
async def iniciar_chamada_video(
    id_conversa: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gera link de chamada de vídeo via Jitsi e envia para o cliente."""
    import hashlib
    from datetime import datetime, timedelta

    # Gerar room ID único
    room_hash = hashlib.sha256(str(id_conversa).encode()).hexdigest()[:12]
    room_name = f"doctorq-{room_hash}"

    # URL de redirecionamento após fechar a chamada
    import os
    from src.config.settings import get_settings
    settings = get_settings()

    # Pega a URL base do frontend (de onde veio a requisição ou configuração)
    base_url = os.getenv("FRONTEND_URL", "http://10.11.2.81:3000")
    redirect_url = f"{base_url}/admin/central-atendimento"

    # Adicionar parâmetros de configuração do Jitsi para melhorar UX
    # e configurar redirecionamento via página customizada
    config_params = [
        "config.prejoinPageEnabled=false",  # Pula tela de pré-entrada
        "config.disableDeepLinking=true",   # Desabilita deep linking
        f"config.callStatsID={room_name}",  # ID da sala
    ]

    # Construir URL completa com configurações
    config_string = "&".join(config_params)
    video_url = f"https://meet.jit.si/{room_name}#{config_string}"

    expires_at = datetime.utcnow() + timedelta(hours=2)

    # Buscar conversa para enviar mensagem
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)
    conversa = await service.obter_conversa(id_conversa)

    if conversa:
        # Preparar mensagem
        mensagem_texto = (
            f"🎥 Chamada de Vídeo Iniciada\n\n"
            f"Clique no link para entrar:\n"
            f"{video_url}\n\n"
            f"⏰ Válido por 2 horas"
        )

        # Enviar mensagem no chat (salvar no banco)
        try:
            from src.central_atendimento.models.conversa_omni import MensagemOmniCreate, MensagemTipo

            # Criar mensagem de saída (atendente -> cliente)
            nova_mensagem = MensagemOmniCreate(
                id_conversa=id_conversa,
                st_entrada=False,  # Mensagem de saída (atendente -> cliente)
                nm_remetente="Sistema",
                tp_mensagem=MensagemTipo.TEXTO,
                ds_conteudo=mensagem_texto,
            )

            # Usar o service da conversa para criar a mensagem
            mensagem_criada = await service.criar_mensagem(nova_mensagem)
            logger.info(f"✅ Mensagem de vídeo criada: {mensagem_criada.id_mensagem}")

            # Enviar via WebSocket para atualização em tempo real
            if conversa.tp_canal == "webchat":
                try:
                    ws_gateway = get_websocket_chat_gateway()
                    await ws_gateway.send_message_to_room(
                        room_id=str(id_conversa),
                        event_type=ChatEventType.MESSAGE,
                        data={
                            "id": str(mensagem_criada.id_mensagem),
                            "content": mensagem_texto,
                            "type": "text",
                            "video_url": video_url,
                            "timestamp": mensagem_criada.dt_criacao.isoformat(),
                        },
                        from_system=True
                    )
                    logger.info(f"✅ Notificação WebSocket enviada")
                except Exception as ws_error:
                    logger.warning(f"⚠️ WebSocket falhou mas mensagem foi salva: {str(ws_error)}")

        except Exception as e:
            logger.error(f"❌ Erro ao criar mensagem de vídeo: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())

    return {
        "video_url": video_url,
        "room_name": room_name,
        "expires_at": expires_at.isoformat(),
        "message": "Link de vídeo gerado com sucesso",
    }


# =============================================================================
# Filas de Atendimento
# =============================================================================

@router.post("/filas/", response_model=FilaAtendimentoResponse, status_code=status.HTTP_201_CREATED)
async def criar_fila(
    dados: FilaAtendimentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cria uma nova fila de atendimento."""
    id_empresa = get_empresa_from_user(current_user)
    service = FilaAtendimentoService(db, id_empresa)
    fila = await service.criar(dados)
    return FilaAtendimentoResponse.model_validate(fila)


@router.get("/filas/", response_model=FilaAtendimentoListResponse)
async def listar_filas(
    apenas_ativas: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista filas de atendimento."""
    id_empresa = get_empresa_from_user(current_user)
    service = FilaAtendimentoService(db, id_empresa)
    filas = await service.listar(apenas_ativas)
    return FilaAtendimentoListResponse(
        items=[FilaAtendimentoResponse.model_validate(f) for f in filas],
        total=len(filas),
    )


@router.get("/filas/{id_fila}", response_model=FilaAtendimentoResponse)
async def obter_fila(
    id_fila: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém uma fila."""
    id_empresa = get_empresa_from_user(current_user)
    service = FilaAtendimentoService(db, id_empresa)
    fila = await service.obter(id_fila)
    if not fila:
        raise HTTPException(status_code=404, detail="Fila não encontrada")
    return FilaAtendimentoResponse.model_validate(fila)


@router.get("/filas/{id_fila}/metricas", response_model=FilaMetricas)
async def obter_metricas_fila(
    id_fila: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém métricas de uma fila."""
    id_empresa = get_empresa_from_user(current_user)
    service = FilaAtendimentoService(db, id_empresa)
    metricas = await service.obter_metricas(id_fila)
    if not metricas:
        raise HTTPException(status_code=404, detail="Fila não encontrada")
    return metricas


@router.get("/filas/{id_fila}/atendimentos", response_model=AtendimentoItemListResponse)
async def listar_atendimentos_fila(
    id_fila: uuid.UUID,
    status: Optional[AtendimentoStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista atendimentos de uma fila."""
    id_empresa = get_empresa_from_user(current_user)
    routing = RoutingService(db, id_empresa)

    itens, total = await routing.listar_fila(id_fila, status, page, page_size)

    return AtendimentoItemListResponse(
        items=[AtendimentoItemResponse.model_validate(i) for i in itens],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/filas/{id_fila}/proximo-atendimento", response_model=AtendimentoItemResponse)
async def obter_proximo_atendimento(
    id_fila: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém próximo atendimento da fila."""
    id_empresa = get_empresa_from_user(current_user)
    id_atendente = current_user.get("id_user")

    routing = RoutingService(db, id_empresa)
    item = await routing.obter_proximo_atendimento(id_atendente, id_fila)

    if not item:
        raise HTTPException(status_code=404, detail="Não há atendimentos disponíveis")

    return AtendimentoItemResponse.model_validate(item)


# =============================================================================
# Campanhas
# =============================================================================

@router.post("/campanhas/", response_model=CampanhaResponse, status_code=status.HTTP_201_CREATED)
async def criar_campanha(
    dados: CampanhaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cria uma nova campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)
    campanha = await service.criar(dados)
    return CampanhaResponse.model_validate(campanha)


@router.get("/campanhas/", response_model=CampanhaListResponse)
async def listar_campanhas(
    st_campanha: Optional[CampanhaStatus] = None,
    tp_campanha: Optional[CampanhaTipo] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista campanhas."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    campanhas, total = await service.listar(st_campanha, tp_campanha, page, page_size)

    return CampanhaListResponse(
        items=[CampanhaResponse.model_validate(c) for c in campanhas],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/campanhas/{id_campanha}", response_model=CampanhaResponse)
async def obter_campanha(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)
    campanha = await service.obter(id_campanha)
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return CampanhaResponse.model_validate(campanha)


@router.get("/campanhas/{id_campanha}/metricas", response_model=CampanhaMetricas)
async def obter_metricas_campanha(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém métricas de uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)
    metricas = await service.obter_metricas(id_campanha)
    if not metricas:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return metricas


@router.get("/campanhas/{id_campanha}/destinatarios")
async def listar_destinatarios_campanha(
    id_campanha: uuid.UUID,
    st_enviado: Optional[bool] = None,
    st_erro: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista destinatários de uma campanha com filtros."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        destinatarios, total = await service.listar_destinatarios(
            id_campanha, st_enviado, st_erro, page, page_size
        )
        return {
            "items": destinatarios,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/campanhas/{id_campanha}/destinatarios")
async def adicionar_destinatarios(
    id_campanha: uuid.UUID,
    dados: AdicionarDestinatariosRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Adiciona destinatários a uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        resultado = await service.adicionar_destinatarios(
            id_campanha, dados.ids_contatos, dados.ds_variaveis
        )
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/campanhas/{id_campanha}/iniciar")
async def iniciar_campanha(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Inicia execução de uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        campanha = await service.iniciar_campanha(id_campanha)
        return {"message": "Campanha iniciada", "status": campanha.st_campanha}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/campanhas/{id_campanha}/pausar")
async def pausar_campanha(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Pausa uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        await service.pausar_campanha(id_campanha)
        return {"message": "Campanha pausada"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/campanhas/{id_campanha}/retomar", response_model=CampanhaResponse)
async def retomar_campanha(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retoma uma campanha pausada."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        campanha = await service.retomar_campanha(id_campanha)
        return CampanhaResponse.model_validate(campanha)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/campanhas/{id_campanha}/cancelar", response_model=CampanhaResponse)
async def cancelar_campanha(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cancela uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        campanha = await service.cancelar_campanha(id_campanha)
        return CampanhaResponse.model_validate(campanha)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/campanhas/{id_campanha}", response_model=CampanhaResponse)
async def atualizar_campanha(
    id_campanha: uuid.UUID,
    dados: CampanhaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Atualiza uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        campanha = await service.atualizar(id_campanha, dados)
        if not campanha:
            raise HTTPException(status_code=404, detail="Campanha não encontrada")
        return CampanhaResponse.model_validate(campanha)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/campanhas/{id_campanha}")
async def excluir_campanha(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Exclui uma campanha."""
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        sucesso = await service.deletar(id_campanha)
        if not sucesso:
            raise HTTPException(status_code=404, detail="Campanha não encontrada")
        return {"message": "Campanha excluída com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/campanhas/{id_campanha}/destinatarios/filtro")
async def adicionar_destinatarios_por_filtro(
    id_campanha: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Adiciona destinatários baseado nos filtros configurados na campanha.

    Os filtros são lidos de ds_filtros da campanha.
    """
    id_empresa = get_empresa_from_user(current_user)
    service = CampanhaService(db, id_empresa)

    try:
        resultado = await service.adicionar_destinatarios_por_filtro(id_campanha)
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# Lead Scoring
# =============================================================================

@router.get("/contatos/{id_contato}/score", response_model=LeadScoreResponse)
async def obter_score_contato(
    id_contato: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém o score de um contato."""
    id_empresa = get_empresa_from_user(current_user)
    service = LeadScoringService(db, id_empresa)

    score = await service.obter_score(id_contato)
    if not score:
        # Calcular se não existe
        score = await service.calcular_score(id_contato)

    return LeadScoreResponse.model_validate(score)


@router.post("/contatos/{id_contato}/score/recalcular", response_model=LeadScoreResponse)
async def recalcular_score(
    id_contato: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Recalcula o score de um contato."""
    id_empresa = get_empresa_from_user(current_user)
    service = LeadScoringService(db, id_empresa)

    score = await service.calcular_score(id_contato, "recalculo_manual")
    return LeadScoreResponse.model_validate(score)


@router.get("/leads-quentes")
async def listar_leads_quentes(
    limite: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista os leads mais quentes."""
    id_empresa = get_empresa_from_user(current_user)
    service = LeadScoringService(db, id_empresa)

    leads = await service.listar_leads_quentes(limite)

    return [
        {
            "contato": ContatoOmniResponse.model_validate(contato),
            "score": LeadScoreResponse.model_validate(score),
        }
        for contato, score in leads
    ]


# =============================================================================
# WhatsApp - Testes e Configuração
# =============================================================================

@router.get("/whatsapp/config")
async def verificar_config_whatsapp():
    """
    Verifica a configuração do WhatsApp Business API.

    Retorna status das variáveis de ambiente necessárias.
    """
    import os

    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    waba_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
    api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")

    return {
        "status": "ok" if all([phone_id, waba_id, access_token, verify_token]) else "incompleto",
        "config": {
            "WHATSAPP_PHONE_NUMBER_ID": "✅ Configurado" if phone_id else "❌ Não configurado",
            "WHATSAPP_BUSINESS_ACCOUNT_ID": "✅ Configurado" if waba_id else "❌ Não configurado",
            "WHATSAPP_ACCESS_TOKEN": "✅ Configurado" if access_token and access_token != "<INSERIR_TOKEN_AQUI>" else "❌ Não configurado",
            "WHATSAPP_VERIFY_TOKEN": f"✅ {verify_token}" if verify_token else "❌ Não configurado",
            "WHATSAPP_API_VERSION": api_version,
        },
        "webhook_url": "/webhooks/whatsapp",
        "instrucoes": {
            "1": "Configure o webhook no Meta for Developers",
            "2": f"URL: https://SEU_DOMINIO/webhooks/whatsapp",
            "3": f"Verify Token: {verify_token}",
            "4": "Selecione os eventos: messages, message_status",
        },
    }


@router.post("/whatsapp/test-envio")
async def testar_envio_whatsapp(
    telefone: str = Query(..., description="Número no formato 5511999999999"),
    mensagem: str = Query(default="Teste de integração DoctorQ WhatsApp Business API"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Testa o envio de mensagem via WhatsApp Business API.

    Apenas para testes - use o número de teste da Meta para receber.
    """
    import os
    import httpx

    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")

    if not phone_id or not access_token or access_token == "<INSERIR_TOKEN_AQUI>":
        raise HTTPException(
            status_code=400,
            detail="WhatsApp não configurado. Verifique WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN no .env"
        )

    # Formatar telefone
    telefone_limpo = "".join(filter(str.isdigit, telefone))
    if len(telefone_limpo) <= 11:
        telefone_limpo = "55" + telefone_limpo

    url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": telefone_limpo,
        "type": "text",
        "text": {"body": mensagem},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            result = response.json()

            if response.status_code >= 400:
                logger.error(f"Erro WhatsApp API: {result}")
                return {
                    "status": "erro",
                    "codigo": response.status_code,
                    "detalhes": result,
                }

            logger.info(f"Mensagem de teste enviada: {result}")
            return {
                "status": "sucesso",
                "message_id": result.get("messages", [{}])[0].get("id"),
                "para": telefone_limpo,
                "resposta": result,
            }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout na conexão com WhatsApp API")
    except Exception as e:
        logger.error(f"Erro ao testar envio WhatsApp: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/whatsapp/perfil-negocio")
async def obter_perfil_whatsapp(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtém o perfil do WhatsApp Business configurado.
    """
    import os
    import httpx

    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")

    if not phone_id or not access_token or access_token == "<INSERIR_TOKEN_AQUI>":
        raise HTTPException(
            status_code=400,
            detail="WhatsApp não configurado. Configure o Access Token no .env"
        )

    url = f"https://graph.facebook.com/v18.0/{phone_id}/whatsapp_business_profile"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"fields": "about,address,description,email,profile_picture_url,websites,vertical"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, params=params)
            result = response.json()

            if response.status_code >= 400:
                return {"status": "erro", "detalhes": result}

            return {"status": "ok", "perfil": result.get("data", [{}])[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/whatsapp/templates")
async def listar_templates_whatsapp(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Lista templates de mensagem aprovados no WhatsApp Business.
    """
    import os
    import httpx

    waba_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")

    if not waba_id or not access_token or access_token == "<INSERIR_TOKEN_AQUI>":
        raise HTTPException(
            status_code=400,
            detail="WhatsApp não configurado. Configure WHATSAPP_BUSINESS_ACCOUNT_ID e WHATSAPP_ACCESS_TOKEN no .env"
        )

    url = f"https://graph.facebook.com/v18.0/{waba_id}/message_templates"
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)
            result = response.json()

            if response.status_code >= 400:
                return {"status": "erro", "detalhes": result}

            templates = result.get("data", [])
            return {
                "status": "ok",
                "total": len(templates),
                "templates": [
                    {
                        "nome": t.get("name"),
                        "status": t.get("status"),
                        "categoria": t.get("category"),
                        "idioma": t.get("language"),
                    }
                    for t in templates
                ],
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Métricas e Analytics
# =============================================================================

from src.central_atendimento.services.metricas_service import (
    MetricasService,
    PeriodoMetricas,
    MetricasDashboard,
    ConversasPorDia,
    ConversasPorCanal,
    ConversasPorHora,
    RelatorioCompleto,
)


@router.get("/metricas/dashboard", response_model=MetricasDashboard)
async def obter_metricas_dashboard(
    periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_7D,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtém métricas principais para o dashboard.

    Períodos disponíveis:
    - hoje, ontem, 24h, 7d, 30d, 90d, mes_atual, mes_anterior
    """
    id_empresa = get_empresa_from_user(current_user)
    service = MetricasService(db, id_empresa)
    return await service.obter_metricas_dashboard(periodo)


@router.get("/metricas/conversas-por-dia", response_model=List[ConversasPorDia])
async def obter_conversas_por_dia(
    periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém conversas agregadas por dia para gráficos."""
    id_empresa = get_empresa_from_user(current_user)
    service = MetricasService(db, id_empresa)
    return await service.obter_conversas_por_dia(periodo)


@router.get("/metricas/conversas-por-canal", response_model=List[ConversasPorCanal])
async def obter_conversas_por_canal(
    periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém distribuição de conversas por canal."""
    id_empresa = get_empresa_from_user(current_user)
    service = MetricasService(db, id_empresa)
    return await service.obter_conversas_por_canal(periodo)


@router.get("/metricas/conversas-por-hora", response_model=List[ConversasPorHora])
async def obter_conversas_por_hora(
    periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_7D,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém distribuição de conversas por hora do dia."""
    id_empresa = get_empresa_from_user(current_user)
    service = MetricasService(db, id_empresa)
    return await service.obter_conversas_por_hora(periodo)


@router.get("/metricas/relatorio-completo", response_model=RelatorioCompleto)
async def obter_relatorio_completo(
    periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém relatório completo com todas as métricas."""
    id_empresa = get_empresa_from_user(current_user)
    service = MetricasService(db, id_empresa)
    return await service.gerar_relatorio_completo(periodo)


@router.get("/metricas/exportar/csv")
async def exportar_metricas_csv(
    periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Exporta relatório em formato CSV.

    Retorna arquivo CSV para download.
    """
    from fastapi.responses import Response

    id_empresa = get_empresa_from_user(current_user)
    service = MetricasService(db, id_empresa)
    csv_content = await service.exportar_csv(periodo)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=relatorio_central_{periodo.value}.csv"
        }
    )


@router.get("/metricas/exportar/pdf-data")
async def exportar_metricas_pdf_data(
    periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retorna dados estruturados para geração de PDF no frontend.

    O frontend pode usar bibliotecas como jsPDF ou react-pdf para gerar o PDF.
    """
    id_empresa = get_empresa_from_user(current_user)
    service = MetricasService(db, id_empresa)
    return await service.exportar_pdf_data(periodo)


# =============================================================================
# Configurações da Central
# =============================================================================

from src.central_atendimento.services.config_service import ConfigCentralService
from src.central_atendimento.models.config_central import (
    ConfigCentralUpdate,
    ConfigCentralResponse,
)


@router.get("/configuracoes/", response_model=ConfigCentralResponse)
async def obter_configuracoes(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém configurações da Central de Atendimento."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConfigCentralService(db, id_empresa)
    config = await service.obter_ou_criar()
    return ConfigCentralResponse.from_orm_model(config)


@router.put("/configuracoes/", response_model=ConfigCentralResponse)
async def atualizar_configuracoes(
    dados: ConfigCentralUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Atualiza configurações da Central de Atendimento."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConfigCentralService(db, id_empresa)
    config = await service.atualizar(dados)
    return ConfigCentralResponse.from_orm_model(config)


@router.post("/configuracoes/resetar", response_model=ConfigCentralResponse)
async def resetar_configuracoes(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Reseta configurações para valores padrão."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConfigCentralService(db, id_empresa)
    config = await service.resetar()
    return ConfigCentralResponse.from_orm_model(config)


# =============================================================================
# Worker de Campanhas (Admin)
# =============================================================================

from src.central_atendimento.services.campanha_worker import (
    get_campanha_worker,
    iniciar_campanha_worker,
    parar_campanha_worker,
)


@router.get("/campanhas/worker/status")
async def status_worker_campanhas(
    current_user: dict = Depends(get_current_user),
):
    """Obtém status do worker de campanhas."""
    worker = get_campanha_worker()
    return {
        "running": worker._running,
        "check_interval": worker._check_interval,
    }


@router.post("/campanhas/worker/iniciar")
async def iniciar_worker(
    current_user: dict = Depends(get_current_user),
):
    """Inicia o worker de campanhas."""
    await iniciar_campanha_worker()
    return {"message": "Worker iniciado"}


@router.post("/campanhas/worker/parar")
async def parar_worker(
    current_user: dict = Depends(get_current_user),
):
    """Para o worker de campanhas."""
    await parar_campanha_worker()
    return {"message": "Worker parado"}
