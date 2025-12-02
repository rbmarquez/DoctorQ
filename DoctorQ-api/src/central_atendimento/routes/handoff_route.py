# src/central_atendimento/routes/handoff_route.py
"""
Rotas para handoff do chatbot Gisele para atendimento humano.
"""

import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from src.config.orm_config import ORMConfig
from src.config.logger_config import get_logger
from src.central_atendimento.services.conversa_service import ConversaOmniService
from src.central_atendimento.services.contato_service import ContatoOmniService
from src.central_atendimento.models.canal import CanalTipo
from src.central_atendimento.models.contato_omni import ContatoOmniCreate
from src.central_atendimento.models.conversa_omni import (
    ConversaOmniCreate,
    MensagemOmniCreate,
    MensagemTipo,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/handoff", tags=["Handoff Chatbot"])


# =============================================================================
# DTOs
# =============================================================================


class MensagemHistorico(BaseModel):
    """Mensagem do histórico do chat."""
    role: str = Field(..., description="Papel: 'user' ou 'assistant'")
    content: str = Field(..., description="Conteúdo da mensagem")
    timestamp: Optional[str] = Field(None, description="Timestamp da mensagem")


class HandoffRequest(BaseModel):
    """Requisição de handoff do chatbot para Central de Atendimento."""

    # ID do agente (para determinar empresa)
    id_agente: Optional[str] = Field(None, description="ID do agente do widget")

    # Dados do usuário (pode ser anônimo)
    nm_nome: Optional[str] = Field(None, description="Nome do usuário")
    ds_email: Optional[str] = Field(None, description="Email do usuário")
    nr_telefone: Optional[str] = Field(None, description="Telefone do usuário")

    # Contexto da conversa
    id_conversa_gisele: Optional[str] = Field(None, description="ID da conversa com a Gisele")
    ds_motivo: str = Field(
        default="Solicitação de atendimento humano",
        description="Motivo do handoff"
    )

    # Histórico de mensagens para contexto
    historico_mensagens: Optional[List[MensagemHistorico]] = Field(
        default=None,
        description="Histórico de mensagens do chat"
    )

    # Canal preferido (padrão: webchat)
    tp_canal: CanalTipo = Field(default=CanalTipo.WEBCHAT, description="Canal de atendimento")


class HandoffResponse(BaseModel):
    """Resposta do handoff."""
    success: bool
    id_conversa: uuid.UUID
    id_contato: uuid.UUID
    mensagem: str
    nr_posicao_fila: Optional[int] = None
    tempo_estimado_minutos: Optional[int] = None


# =============================================================================
# Padrões de Intenção de Handoff
# =============================================================================

HANDOFF_PATTERNS = [
    # Português
    "falar com atendente",
    "falar com humano",
    "atendente humano",
    "atendimento humano",
    "quero falar com alguem",
    "quero falar com alguém",
    "pessoa real",
    "atendente real",
    "falar com pessoa",
    "falar com uma pessoa",
    "preciso de ajuda humana",
    "transferir para atendente",
    "transferir atendimento",
    "sair do bot",
    "nao quero falar com robo",
    "não quero falar com robô",
    "falar com suporte",
    "suporte humano",
    "atendente por favor",
    "me ajude de verdade",
    "voce é um robo",
    "você é um robô",
    "isso é um bot",
    # Inglês (caso alguém use)
    "talk to human",
    "human agent",
    "real person",
    "transfer to agent",
]


def detectar_intencao_handoff(mensagem: str) -> bool:
    """
    Detecta se a mensagem indica intenção de falar com atendente humano.

    Args:
        mensagem: Texto da mensagem do usuário

    Returns:
        True se indica intenção de handoff
    """
    mensagem_lower = mensagem.lower().strip()

    # Remover acentos para comparação mais flexível
    import unicodedata
    mensagem_normalized = unicodedata.normalize('NFKD', mensagem_lower)
    mensagem_normalized = ''.join(c for c in mensagem_normalized if not unicodedata.combining(c))

    for pattern in HANDOFF_PATTERNS:
        pattern_normalized = unicodedata.normalize('NFKD', pattern.lower())
        pattern_normalized = ''.join(c for c in pattern_normalized if not unicodedata.combining(c))

        if pattern_normalized in mensagem_normalized:
            return True

    return False


# =============================================================================
# Endpoints
# =============================================================================


@router.post("/iniciar/", response_model=HandoffResponse)
async def iniciar_handoff(
    dados: HandoffRequest,
    db: AsyncSession = Depends(ORMConfig.get_session),
) -> HandoffResponse:
    """
    Inicia o handoff do chatbot Gisele para a Central de Atendimento.

    Este endpoint:
    1. Cria ou recupera o contato do usuário
    2. Cria uma nova conversa na Central de Atendimento
    3. Importa o histórico de mensagens do chat com a Gisele
    4. Coloca a conversa na fila de atendimento humano

    Returns:
        HandoffResponse com ID da conversa criada e posição na fila
    """
    logger.info(f"Iniciando handoff: motivo='{dados.ds_motivo}', id_agente='{dados.id_agente}'")

    # Determinar empresa: do agente (se fornecido) ou padrão
    import os
    id_empresa = None

    # Se id_agente foi fornecido, buscar a empresa do agente
    if dados.id_agente:
        try:
            agente_result = await db.execute(
                text("SELECT id_empresa FROM tb_agentes WHERE id_agente = :id_agente"),
                {"id_agente": dados.id_agente}
            )
            agente_row = agente_result.fetchone()
            if agente_row and agente_row[0]:
                id_empresa = agente_row[0]
                logger.info(f"✅ Usando empresa do agente: {id_empresa}")
        except Exception as e:
            logger.warning(f"Erro ao buscar empresa do agente: {e}")

    # Fallback para empresa padrão
    if not id_empresa:
        default_empresa_id = os.getenv(
            "DEFAULT_EMPRESA_ID",
            "329311ce-0d17-4361-bc51-60234ed972ee"  # Empresa padrão da Central
        )
        id_empresa = uuid.UUID(default_empresa_id)
        logger.info(f"📋 Usando empresa padrão: {id_empresa}")

    try:
        # Serviços
        contato_service = ContatoOmniService(db, id_empresa)
        conversa_service = ConversaOmniService(db, id_empresa)

        # 1. Criar ou recuperar contato
        contato = None

        # Tentar encontrar por email ou telefone
        if dados.ds_email:
            contato = await contato_service.obter_por_email(dados.ds_email)

        if not contato and dados.nr_telefone:
            contato = await contato_service.obter_por_telefone(dados.nr_telefone)

        # Se não encontrou, criar novo contato
        if not contato:
            nm_nome = dados.nm_nome or "Visitante Web"

            contato_dados = ContatoOmniCreate(
                nm_contato=nm_nome,
                nm_email=dados.ds_email,
                nr_telefone=dados.nr_telefone,
                nm_origem="chatbot_gisele",
                ds_metadata={
                    "origem": "handoff_gisele",
                    "dt_primeiro_contato": datetime.utcnow().isoformat(),
                }
            )
            contato = await contato_service.criar(contato_dados)
            logger.info(f"Contato criado: {contato.id_contato}")
        else:
            logger.info(f"Contato encontrado: {contato.id_contato}")

        # 2. Verificar se já existe conversa ativa
        conversa_ativa = await conversa_service.obter_conversa_ativa(
            id_contato=contato.id_contato,
            tp_canal=dados.tp_canal,
        )

        if conversa_ativa and conversa_ativa.st_aguardando_humano:
            # Já existe conversa aguardando atendimento
            logger.info(f"Conversa já aguardando: {conversa_ativa.id_conversa}")
            return HandoffResponse(
                success=True,
                id_conversa=conversa_ativa.id_conversa,
                id_contato=contato.id_contato,
                mensagem="Você já está na fila de atendimento. Um atendente irá atendê-lo em breve!",
                nr_posicao_fila=1,  # Simplificado - pode calcular posição real
                tempo_estimado_minutos=5,
            )

        # 3. Criar nova conversa ou usar a ativa
        if conversa_ativa:
            conversa = conversa_ativa
            # Transferir para atendimento humano
            conversa = await conversa_service.transferir_para_humano(
                id_conversa=conversa.id_conversa,
                motivo=dados.ds_motivo,
            )
        else:
            # Criar nova conversa
            conversa_dados = ConversaOmniCreate(
                id_contato=contato.id_contato,
                tp_canal=dados.tp_canal,
                nm_titulo=f"Handoff - {contato.nm_contato}",
                ds_resumo=dados.ds_motivo,
                st_bot_ativo=False,  # Bot desativado - aguardando humano
            )
            conversa = await conversa_service.criar_conversa(conversa_dados)

            # Marcar como aguardando humano
            conversa = await conversa_service.transferir_para_humano(
                id_conversa=conversa.id_conversa,
                motivo=dados.ds_motivo,
            )

        logger.info(f"Conversa criada/atualizada: {conversa.id_conversa}")

        # 4. Importar histórico de mensagens
        if dados.historico_mensagens:
            for msg in dados.historico_mensagens:
                msg_dados = MensagemOmniCreate(
                    id_conversa=conversa.id_conversa,
                    st_entrada=msg.role == "user",  # user = entrada, assistant = saída
                    nm_remetente=contato.nm_contato if msg.role == "user" else "Gisele AI",
                    tp_mensagem=MensagemTipo.TEXTO,
                    ds_conteudo=msg.content,
                    ds_metadata={
                        "origem": "historico_gisele",
                        "timestamp_original": msg.timestamp,
                    }
                )
                await conversa_service.criar_mensagem(msg_dados)

            logger.info(f"Importadas {len(dados.historico_mensagens)} mensagens do histórico")

        # 5. Adicionar mensagem de sistema sobre o handoff
        msg_sistema = MensagemOmniCreate(
            id_conversa=conversa.id_conversa,
            st_entrada=False,
            nm_remetente="Sistema",
            tp_mensagem=MensagemTipo.TEXTO,
            ds_conteudo=f"🔄 **Transferência para atendimento humano**\n\n"
                       f"Motivo: {dados.ds_motivo}\n\n"
                       f"Um atendente irá atendê-lo em instantes.",
            ds_metadata={"tipo": "sistema", "evento": "handoff"}
        )
        await conversa_service.criar_mensagem(msg_sistema)

        # Calcular posição na fila (simplificado)
        # Em produção, fazer query real na fila
        conversas_aguardando, total = await conversa_service.listar_conversas(
            st_aberta=True,
            st_aguardando_humano=True,
            page_size=100,
        )
        posicao_fila = len([c for c in conversas_aguardando if c.dt_criacao < conversa.dt_criacao]) + 1

        return HandoffResponse(
            success=True,
            id_conversa=conversa.id_conversa,
            id_contato=contato.id_contato,
            mensagem="Você foi transferido para um atendente humano. Por favor, aguarde!",
            nr_posicao_fila=posicao_fila,
            tempo_estimado_minutos=max(5, posicao_fila * 3),  # 3 min por conversa na fila
        )

    except Exception as e:
        logger.error(f"Erro no handoff: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao transferir para atendente: {str(e)}"
        )


@router.post("/detectar-intencao/")
async def detectar_intencao(
    mensagem: str,
) -> dict:
    """
    Detecta se uma mensagem indica intenção de falar com atendente humano.

    Este endpoint pode ser chamado pelo frontend ou pelo agente de IA
    para verificar se deve iniciar o processo de handoff.

    Args:
        mensagem: Texto da mensagem do usuário

    Returns:
        Dict com is_handoff (bool) e confidence (float)
    """
    is_handoff = detectar_intencao_handoff(mensagem)

    return {
        "is_handoff": is_handoff,
        "confidence": 0.95 if is_handoff else 0.0,
        "mensagem_original": mensagem,
    }


@router.get("/status/{id_conversa}/")
async def status_handoff(
    id_conversa: uuid.UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
) -> dict:
    """
    Retorna o status de uma conversa em handoff.

    Args:
        id_conversa: ID da conversa

    Returns:
        Status da conversa e posição na fila
    """
    import os
    default_empresa_id = os.getenv(
        "DEFAULT_EMPRESA_ID",
        "329311ce-0d17-4361-bc51-60234ed972ee"
    )
    id_empresa = uuid.UUID(default_empresa_id)

    conversa_service = ConversaOmniService(db, id_empresa)
    conversa = await conversa_service.obter_conversa(id_conversa)

    if not conversa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversa não encontrada"
        )

    # Verificar se está em atendimento
    em_atendimento = conversa.id_atendente is not None

    # Calcular posição na fila
    posicao_fila = None
    if conversa.st_aguardando_humano and not em_atendimento:
        conversas_aguardando, _ = await conversa_service.listar_conversas(
            st_aberta=True,
            st_aguardando_humano=True,
            page_size=100,
        )
        posicao_fila = len([c for c in conversas_aguardando if c.dt_criacao < conversa.dt_criacao]) + 1

    return {
        "id_conversa": str(conversa.id_conversa),
        "st_aberta": conversa.st_aberta,
        "st_aguardando_humano": conversa.st_aguardando_humano,
        "st_bot_ativo": conversa.st_bot_ativo,
        "em_atendimento": em_atendimento,
        "nr_posicao_fila": posicao_fila,
        "tempo_estimado_minutos": max(5, (posicao_fila or 0) * 3) if posicao_fila else None,
    }
