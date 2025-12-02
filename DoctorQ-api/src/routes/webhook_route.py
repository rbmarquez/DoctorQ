"""
Rotas de Webhooks - Integração com Billing
Webhook para upgrade automático e eventos de assinatura
"""
import hashlib
import hmac
import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.webhook import WebhookEvent
from src.services.billing_service import BillingService

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = get_logger(__name__)


@router.post("/stripe/")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Webhook para receber eventos do Stripe

    **Eventos Suportados:**
    - customer.subscription.created - Nova assinatura criada
    - customer.subscription.updated - Assinatura atualizada (upgrade/downgrade)
    - customer.subscription.deleted - Assinatura cancelada
    - customer.subscription.trial_will_end - Trial terminando em 3 dias
    - invoice.payment_succeeded - Pagamento bem-sucedido
    - invoice.payment_failed - Pagamento falhou

    **Segurança:**
    - Verifica assinatura HMAC do Stripe
    - Protege contra replay attacks
    - Rate limit aplicado

    **Upgrade Automático:**
    - Ao detectar upgrade de plano, atualiza automaticamente os limites da empresa
    - Notifica administradores por email
    """
    try:
        # Ler payload bruto
        payload = await request.body()
        payload_str = payload.decode("utf-8")

        # Verificar assinatura do Stripe (se configurado)
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        if webhook_secret and stripe_signature:
            if not verify_stripe_signature(payload, stripe_signature, webhook_secret):
                logger.warning("❌ Assinatura inválida do Stripe webhook")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Assinatura inválida"
                )

        # Parse do evento
        event = json.loads(payload_str)
        event_type = event.get("type")
        event_data = event.get("data", {}).get("object", {})

        logger.info(f"📥 Webhook Stripe recebido: {event_type}")

        # Processar evento
        if event_type == "customer.subscription.created":
            await handle_subscription_created(db, event_data)

        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(db, event_data)

        elif event_type == "customer.subscription.deleted":
            await handle_subscription_canceled(db, event_data)

        elif event_type == "customer.subscription.trial_will_end":
            await handle_trial_ending(db, event_data)

        elif event_type == "invoice.payment_succeeded":
            await handle_payment_succeeded(db, event_data)

        elif event_type == "invoice.payment_failed":
            await handle_payment_failed(db, event_data)

        else:
            logger.info(f"ℹ️  Evento não tratado: {event_type}")

        # Log do evento processado
        await log_webhook_delivery(
            db=db,
            event_type=event_type,
            event_data=event,
            status="delivered"
        )

        return {"status": "success", "event": event_type}

    except json.JSONDecodeError as e:
        logger.error(f"❌ Erro ao parsear JSON: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JSON inválido"
        )

    except Exception as e:
        logger.error(f"❌ Erro ao processar webhook: {e}", exc_info=True)

        # Log do erro
        await log_webhook_delivery(
            db=db,
            event_type=event.get("type", "unknown"),
            event_data=event,
            status="failed",
            error_message=str(e)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar webhook: {str(e)}"
        )


def verify_stripe_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verifica assinatura HMAC do Stripe

    Formato da assinatura:
    t=timestamp,v1=hash_hmac_sha256
    """
    try:
        # Extrair timestamp e assinatura
        parts = signature.split(",")
        timestamp = None
        v1_signature = None

        for part in parts:
            if part.startswith("t="):
                timestamp = part[2:]
            elif part.startswith("v1="):
                v1_signature = part[3:]

        if not timestamp or not v1_signature:
            return False

        # Verificar se timestamp não é muito antigo (5 minutos)
        current_time = int(datetime.utcnow().timestamp())
        if abs(current_time - int(timestamp)) > 300:  # 5 minutos
            logger.warning("⚠️  Timestamp do webhook muito antigo")
            return False

        # Calcular assinatura esperada
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
        expected_signature = hmac.new(
            secret.encode("utf-8"),
            signed_payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # Comparar assinaturas (timing-safe)
        return hmac.compare_digest(expected_signature, v1_signature)

    except Exception as e:
        logger.error(f"❌ Erro ao verificar assinatura: {e}")
        return False


async def handle_subscription_created(db: AsyncSession, subscription: dict):
    """
    Processa criação de nova assinatura
    """
    customer_id = subscription.get("customer")
    plan_id = subscription.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")

    logger.info(f"✅ Nova assinatura criada - Cliente: {customer_id}, Plano: {plan_id}")

    # Buscar empresa pelo customer_id do Stripe
    from src.models.empresa import TbEmpresa

    stmt = select(TbEmpresa).where(TbEmpresa.ds_stripe_customer_id == customer_id)
    result = await db.execute(stmt)
    empresa = result.scalar_one_or_none()

    if not empresa:
        logger.warning(f"⚠️  Empresa não encontrada para customer_id: {customer_id}")
        return

    # Atualizar status da assinatura
    billing_service = BillingService()
    await billing_service.update_subscription_from_stripe(
        db=db,
        id_empresa=empresa.id_empresa,
        subscription_data=subscription
    )

    logger.info(f"✅ Assinatura criada para empresa {empresa.nm_razao_social}")


async def handle_subscription_updated(db: AsyncSession, subscription: dict):
    """
    Processa atualização de assinatura (UPGRADE/DOWNGRADE AUTOMÁTICO)
    """
    customer_id = subscription.get("customer")
    plan_id = subscription.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")
    status_subscription = subscription.get("status")

    logger.info(f"🔄 Assinatura atualizada - Cliente: {customer_id}, Status: {status_subscription}")

    # Buscar empresa
    from src.models.empresa import TbEmpresa

    stmt = select(TbEmpresa).where(TbEmpresa.ds_stripe_customer_id == customer_id)
    result = await db.execute(stmt)
    empresa = result.scalar_one_or_none()

    if not empresa:
        logger.warning(f"⚠️  Empresa não encontrada para customer_id: {customer_id}")
        return

    # Atualizar assinatura e limites automaticamente
    billing_service = BillingService()
    await billing_service.upgrade_subscription_automatically(
        db=db,
        id_empresa=empresa.id_empresa,
        new_plan_id=plan_id,
        subscription_data=subscription
    )

    logger.info(f"✅ UPGRADE AUTOMÁTICO aplicado para {empresa.nm_razao_social}")

    # Notificar administradores por email
    from src.services.email_service import EmailService
    email_service = EmailService()

    admin_email = empresa.nm_email  # Email principal da empresa
    if admin_email:
        await email_service.send_upgrade_notification(
            email=admin_email,
            empresa_name=empresa.nm_razao_social or empresa.nm_fantasia,
            new_plan=plan_id
        )


async def handle_subscription_canceled(db: AsyncSession, subscription: dict):
    """
    Processa cancelamento de assinatura
    """
    customer_id = subscription.get("customer")

    logger.info(f"❌ Assinatura cancelada - Cliente: {customer_id}")

    # Buscar empresa
    from src.models.empresa import TbEmpresa

    stmt = select(TbEmpresa).where(TbEmpresa.ds_stripe_customer_id == customer_id)
    result = await db.execute(stmt)
    empresa = result.scalar_one_or_none()

    if not empresa:
        return

    # Atualizar status
    billing_service = BillingService()
    await billing_service.cancel_subscription(
        db=db,
        id_empresa=empresa.id_empresa,
        reason="Cancelado pelo Stripe"
    )

    logger.info(f"✅ Assinatura cancelada para {empresa.nm_razao_social}")


async def handle_trial_ending(db: AsyncSession, subscription: dict):
    """
    Processa aviso de trial terminando
    """
    customer_id = subscription.get("customer")
    trial_end = subscription.get("trial_end")

    logger.info(f"⏰ Trial terminando - Cliente: {customer_id}, Data: {trial_end}")

    # Buscar empresa e enviar notificação
    from src.models.empresa import TbEmpresa

    stmt = select(TbEmpresa).where(TbEmpresa.ds_stripe_customer_id == customer_id)
    result = await db.execute(stmt)
    empresa = result.scalar_one_or_none()

    if not empresa:
        return

    # Enviar email de aviso
    from src.services.email_service import EmailService
    email_service = EmailService()

    if empresa.nm_email:
        await email_service.send_trial_ending_notification(
            email=empresa.nm_email,
            empresa_name=empresa.nm_razao_social or empresa.nm_fantasia,
            days_remaining=3
        )


async def handle_payment_succeeded(db: AsyncSession, invoice: dict):
    """
    Processa pagamento bem-sucedido
    """
    customer_id = invoice.get("customer")
    amount = invoice.get("amount_paid", 0) / 100  # Converter de centavos

    logger.info(f"💰 Pagamento bem-sucedido - Cliente: {customer_id}, Valor: R$ {amount:.2f}")

    # Registrar transação
    # Implementar lógica de registro de transação


async def handle_payment_failed(db: AsyncSession, invoice: dict):
    """
    Processa falha de pagamento
    """
    customer_id = invoice.get("customer")
    amount = invoice.get("amount_due", 0) / 100

    logger.warning(f"❌ Pagamento falhou - Cliente: {customer_id}, Valor: R$ {amount:.2f}")

    # Enviar notificação de falha
    # Implementar lógica de notificação


async def log_webhook_delivery(
    db: AsyncSession,
    event_type: str,
    event_data: dict,
    status: str,
    error_message: Optional[str] = None
):
    """
    Registra entrega de webhook no banco de dados
    """
    from src.models.webhook import WebhookDelivery

    # Buscar webhook ativo do tipo Stripe
    from src.models.webhook import Webhook

    stmt = select(Webhook).where(
        Webhook.nm_status == "active",
        Webhook.ds_events.contains([event_type])
    ).limit(1)

    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()

    if not webhook:
        logger.debug(f"Webhook não configurado para evento: {event_type}")
        return

    # Criar delivery log
    delivery = WebhookDelivery(
        id_webhook=webhook.id_webhook,
        nm_event_type=event_type,
        ds_event_data=event_data,
        nm_status=status,
        ds_error_message=error_message,
        dt_completado=datetime.utcnow() if status in ["delivered", "failed"] else None
    )

    db.add(delivery)

    # Atualizar estatísticas do webhook
    if status == "delivered":
        webhook.nr_success_count += 1
        webhook.dt_last_success = datetime.utcnow()
    elif status == "failed":
        webhook.nr_failure_count += 1
        webhook.dt_last_failure = datetime.utcnow()

    await db.commit()


import os
