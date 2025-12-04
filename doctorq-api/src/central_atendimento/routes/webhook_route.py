# src/central_atendimento/routes/webhook_route.py
"""
Rotas de webhooks para receber mensagens dos canais.

Processa webhooks de:
- WhatsApp Business API (Meta Cloud API)
- Instagram Direct
- Facebook Messenger
"""

import os
import uuid
import hmac
import hashlib
from typing import Optional, Dict, Any

from fastapi import APIRouter, Request, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db, get_async_session_context
from src.config.logger_config import get_logger

# Variáveis de ambiente do WhatsApp
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "DoctorQ_whatsapp_verify_2024")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
from src.central_atendimento.services.contato_service import ContatoOmniService
from src.central_atendimento.services.conversa_service import ConversaOmniService
from src.central_atendimento.services.lead_scoring_service import LeadScoringService
from src.central_atendimento.services.canal_service import CanalService
from src.central_atendimento.services.message_orchestrator_service import (
    get_message_orchestrator,
    ProcessingResult,
)
from src.central_atendimento.models.canal import Canal, CanalTipo
from src.central_atendimento.models.conversa_omni import (
    MensagemOmniCreate,
    MensagemTipo,
    MensagemStatus,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


# =============================================================================
# WhatsApp Webhook
# =============================================================================

@router.get("/whatsapp")
async def verificar_webhook_whatsapp(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """
    Verificação do webhook do WhatsApp.

    A Meta envia uma requisição GET para verificar o webhook.
    Você deve configurar o verify_token no seu dashboard do WhatsApp Business.

    Configure a variável WHATSAPP_VERIFY_TOKEN no .env
    """
    logger.info(f"Webhook verificação recebida: mode={hub_mode}, token={hub_verify_token}, challenge={hub_challenge}")

    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("Webhook WhatsApp verificado com sucesso")
        # Meta espera o challenge de volta como string ou int
        try:
            return int(hub_challenge)
        except (TypeError, ValueError):
            # Se não puder converter, retorna como string
            return hub_challenge

    logger.warning(f"Verificação falhou: mode={hub_mode}, token_match={hub_verify_token == WHATSAPP_VERIFY_TOKEN}")
    raise HTTPException(status_code=403, detail="Verificação falhou")


@router.post("/whatsapp")
async def receber_webhook_whatsapp(request: Request):
    """
    Recebe mensagens do WhatsApp.

    Processa diferentes tipos de eventos:
    - messages: Novas mensagens recebidas
    - statuses: Atualizações de status (enviado, entregue, lido)
    """
    try:
        body = await request.json()
        logger.debug(f"Webhook WhatsApp recebido: {body}")

        # Verificar assinatura (opcional em dev, obrigatório em prod)
        # signature = request.headers.get("X-Hub-Signature-256")
        # await _verificar_assinatura(body, signature)

        # Processar webhook
        entry = body.get("entry", [])
        for e in entry:
            changes = e.get("changes", [])
            for change in changes:
                value = change.get("value", {})

                # Identificar a empresa pelo phone_number_id
                metadata = value.get("metadata", {})
                phone_number_id = metadata.get("phone_number_id")

                if not phone_number_id:
                    continue

                # Processar mensagens
                messages = value.get("messages", [])
                for message in messages:
                    await _processar_mensagem_whatsapp(phone_number_id, message, value)

                # Processar status updates
                statuses = value.get("statuses", [])
                for status_update in statuses:
                    await _processar_status_whatsapp(status_update)

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Erro ao processar webhook WhatsApp: {e}")
        # Retornar 200 para não reenviar
        return {"status": "error", "message": str(e)}


async def _buscar_empresa_por_phone_id(
    db: AsyncSession,
    phone_number_id: str,
) -> Optional[uuid.UUID]:
    """
    Busca o id_empresa associado ao phone_number_id do WhatsApp.

    Ordem de busca:
    1. Verifica se é o phone_number_id configurado no .env
    2. Busca canal WhatsApp com esse phone_number_id no banco
    3. Busca qualquer canal WhatsApp ativo
    4. Usa DEFAULT_EMPRESA_ID como fallback final
    """
    from sqlalchemy import select

    # 1. Verificar se é o phone_number_id global configurado
    if phone_number_id == WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_PHONE_NUMBER_ID:
        # Buscar primeira empresa com canal WhatsApp ativo
        stmt = select(Canal).where(
            Canal.tp_canal == CanalTipo.WHATSAPP,
            Canal.st_ativo == True,
        ).limit(1)
        result = await db.execute(stmt)
        canal = result.scalar_one_or_none()
        if canal:
            return canal.id_empresa

    # 2. Buscar canal pelo phone_number_id específico no banco
    stmt = select(Canal).where(
        Canal.tp_canal == CanalTipo.WHATSAPP,
        Canal.id_telefone_whatsapp == phone_number_id,
        Canal.st_ativo == True,
    )
    result = await db.execute(stmt)
    canal = result.scalar_one_or_none()
    if canal:
        return canal.id_empresa

    # 3. Buscar qualquer canal WhatsApp ativo
    stmt = select(Canal).where(
        Canal.tp_canal == CanalTipo.WHATSAPP,
        Canal.st_ativo == True,
    ).limit(1)
    result = await db.execute(stmt)
    canal = result.scalar_one_or_none()
    if canal:
        logger.info(f"Usando canal WhatsApp genérico para phone_number_id: {phone_number_id}")
        return canal.id_empresa

    # 4. Fallback: usar empresa padrão do .env
    default_empresa = os.getenv("DEFAULT_EMPRESA_ID")
    if default_empresa:
        logger.info(f"Usando DEFAULT_EMPRESA_ID como fallback para phone_number_id: {phone_number_id}")
        return uuid.UUID(default_empresa)

    return None


async def _processar_mensagem_whatsapp(
    phone_number_id: str,
    message: Dict[str, Any],
    value: Dict[str, Any],
):
    """Processa uma mensagem recebida do WhatsApp usando o Orchestrator."""
    async with get_async_session_context() as db:
        try:
            # Buscar empresa pelo phone_number_id
            id_empresa = await _buscar_empresa_por_phone_id(db, phone_number_id)

            if not id_empresa:
                logger.warning(
                    f"Empresa não encontrada para phone_number_id: {phone_number_id}. "
                    "Configure DEFAULT_EMPRESA_ID no .env ou cadastre um canal WhatsApp."
                )
                return

            # Extrair dados da mensagem
            wa_message_id = message.get("id")
            from_number = message.get("from")
            timestamp = message.get("timestamp")
            msg_type = message.get("type")

            # Dados do contato
            contacts = value.get("contacts", [])
            contact_name = contacts[0].get("profile", {}).get("name", "Contato") if contacts else "Contato"

            logger.info(f"Mensagem WhatsApp de {from_number}: {msg_type}")

            # Extrair conteúdo baseado no tipo
            conteudo = None
            media_id = None
            nome_arquivo = None
            mime_type = None
            tipo_mensagem = MensagemTipo.TEXTO

            if msg_type == "text":
                conteudo = message.get("text", {}).get("body")
                tipo_mensagem = MensagemTipo.TEXTO

            elif msg_type == "image":
                image = message.get("image", {})
                conteudo = image.get("caption")
                media_id = image.get("id")
                mime_type = image.get("mime_type")
                tipo_mensagem = MensagemTipo.IMAGEM

            elif msg_type == "audio":
                audio = message.get("audio", {})
                media_id = audio.get("id")
                mime_type = audio.get("mime_type")
                tipo_mensagem = MensagemTipo.AUDIO

            elif msg_type == "video":
                video = message.get("video", {})
                conteudo = video.get("caption")
                media_id = video.get("id")
                mime_type = video.get("mime_type")
                tipo_mensagem = MensagemTipo.VIDEO

            elif msg_type == "document":
                doc = message.get("document", {})
                conteudo = doc.get("caption")
                media_id = doc.get("id")
                nome_arquivo = doc.get("filename")
                mime_type = doc.get("mime_type")
                tipo_mensagem = MensagemTipo.DOCUMENTO

            elif msg_type == "location":
                loc = message.get("location", {})
                conteudo = f"Localização: {loc.get('latitude')}, {loc.get('longitude')}"
                if loc.get("name"):
                    conteudo += f" - {loc.get('name')}"
                tipo_mensagem = MensagemTipo.LOCALIZACAO

            elif msg_type == "sticker":
                sticker = message.get("sticker", {})
                media_id = sticker.get("id")
                tipo_mensagem = MensagemTipo.STICKER

            elif msg_type == "interactive":
                interactive = message.get("interactive", {})
                if interactive.get("type") == "button_reply":
                    conteudo = interactive.get("button_reply", {}).get("title")
                elif interactive.get("type") == "list_reply":
                    conteudo = interactive.get("list_reply", {}).get("title")
                tipo_mensagem = MensagemTipo.INTERATIVO

            elif msg_type == "reaction":
                reaction = message.get("reaction", {})
                conteudo = f"Reação: {reaction.get('emoji')}"
                tipo_mensagem = MensagemTipo.REACAO

            # Processar via Orchestrator
            orchestrator = get_message_orchestrator()
            result = await orchestrator.process_incoming_message(
                id_empresa=id_empresa,
                canal=CanalTipo.WHATSAPP,
                telefone=from_number,
                nome_contato=contact_name,
                tipo_mensagem=tipo_mensagem,
                conteudo=conteudo,
                media_id=media_id,
                mime_type=mime_type,
                external_message_id=wa_message_id,
                metadata={
                    "phone_number_id": phone_number_id,
                    "timestamp": timestamp,
                    "filename": nome_arquivo,
                },
            )

            logger.info(
                f"Mensagem processada: {result.id_mensagem} "
                f"(resultado: {result.resultado.value})"
            )

        except Exception as e:
            logger.error(f"Erro ao processar mensagem WhatsApp: {e}")
            raise


async def _processar_status_whatsapp(status_update: Dict[str, Any]):
    """Processa atualização de status de mensagem do WhatsApp."""
    async with get_async_session_context() as db:
        try:
            wa_message_id = status_update.get("id")
            status_value = status_update.get("status")
            timestamp = status_update.get("timestamp")

            logger.debug(f"Status WhatsApp: {wa_message_id} -> {status_value}")

            # Mapear status
            status_map = {
                "sent": MensagemStatus.ENVIADA,
                "delivered": MensagemStatus.ENTREGUE,
                "read": MensagemStatus.LIDA,
                "failed": MensagemStatus.FALHA,
            }

            novo_status = status_map.get(status_value)
            if not novo_status:
                return

            # TODO: Identificar empresa e atualizar mensagem
            # Por enquanto, apenas logar
            logger.info(f"Status atualizado: {wa_message_id} -> {novo_status}")

            """
            conversa_service = ConversaOmniService(db, id_empresa)
            await conversa_service.atualizar_status_por_id_externo(
                wa_message_id,
                novo_status,
            )
            """

        except Exception as e:
            logger.error(f"Erro ao processar status WhatsApp: {e}")


# =============================================================================
# Instagram Webhook
# =============================================================================

@router.get("/instagram")
async def verificar_webhook_instagram(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Verificação do webhook do Instagram."""
    VERIFY_TOKEN = "DoctorQ_instagram_verify_token"

    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        logger.info("Webhook Instagram verificado com sucesso")
        return int(hub_challenge)

    raise HTTPException(status_code=403, detail="Verificação falhou")


@router.post("/instagram")
async def receber_webhook_instagram(request: Request):
    """
    Recebe mensagens do Instagram Direct.

    Usa a mesma estrutura de webhook do Facebook/Meta.
    """
    try:
        body = await request.json()
        logger.debug(f"Webhook Instagram recebido: {body}")

        # Estrutura similar ao WhatsApp
        entry = body.get("entry", [])
        for e in entry:
            messaging = e.get("messaging", [])
            for msg in messaging:
                sender_id = msg.get("sender", {}).get("id")
                recipient_id = msg.get("recipient", {}).get("id")
                message = msg.get("message", {})

                if message:
                    await _processar_mensagem_instagram(sender_id, recipient_id, message)

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Erro ao processar webhook Instagram: {e}")
        return {"status": "error", "message": str(e)}


async def _processar_mensagem_instagram(
    sender_id: str,
    recipient_id: str,
    message: Dict[str, Any],
):
    """Processa mensagem do Instagram Direct."""
    logger.info(f"Mensagem Instagram de {sender_id}: {message.get('text', '')[:50]}")

    # TODO: Implementar processamento similar ao WhatsApp
    # Por enquanto, apenas logar


# =============================================================================
# Facebook Messenger Webhook
# =============================================================================

@router.get("/facebook")
async def verificar_webhook_facebook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Verificação do webhook do Facebook Messenger."""
    VERIFY_TOKEN = "DoctorQ_facebook_verify_token"

    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        logger.info("Webhook Facebook verificado com sucesso")
        return int(hub_challenge)

    raise HTTPException(status_code=403, detail="Verificação falhou")


@router.post("/facebook")
async def receber_webhook_facebook(request: Request):
    """
    Recebe mensagens do Facebook Messenger.
    """
    try:
        body = await request.json()
        logger.debug(f"Webhook Facebook recebido: {body}")

        entry = body.get("entry", [])
        for e in entry:
            messaging = e.get("messaging", [])
            for msg in messaging:
                sender_id = msg.get("sender", {}).get("id")
                recipient_id = msg.get("recipient", {}).get("id")
                message = msg.get("message", {})

                if message:
                    await _processar_mensagem_facebook(sender_id, recipient_id, message)

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Erro ao processar webhook Facebook: {e}")
        return {"status": "error", "message": str(e)}


async def _processar_mensagem_facebook(
    sender_id: str,
    recipient_id: str,
    message: Dict[str, Any],
):
    """Processa mensagem do Facebook Messenger."""
    logger.info(f"Mensagem Facebook de {sender_id}: {message.get('text', '')[:50]}")

    # TODO: Implementar processamento similar ao WhatsApp


# =============================================================================
# Utilidades
# =============================================================================

async def _verificar_assinatura(body: bytes, signature: str, app_secret: str) -> bool:
    """
    Verifica a assinatura do webhook da Meta.

    Args:
        body: Corpo da requisição em bytes
        signature: Header X-Hub-Signature-256
        app_secret: App Secret do Facebook App

    Returns:
        True se válido
    """
    if not signature:
        return False

    expected = "sha256=" + hmac.new(
        app_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected)
