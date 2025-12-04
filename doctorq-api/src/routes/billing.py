"""
Rotas para gerenciamento de Billing e Assinaturas
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.billing import (
    InvoiceResponse,
    PaymentResponse,
    PlanCreate,
    PlanResponse,
    PlanTier,
    PlanUpdate,
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionStatus,
    SubscriptionUpdate,
    UsageMetricCreate,
    UsageMetricResponse,
    UsageSummary,
)
from src.services.billing_service import BillingService, get_billing_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(
    prefix="/billing",
    tags=["Billing"],
    responses={404: {"description": "Não encontrado"}},
)


# =============================================================================
# PLANS
# =============================================================================


@router.get("/plans")
async def list_plans(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    tier: Optional[PlanTier] = None,
    service: BillingService = Depends(get_billing_service),
):
    """Listar planos disponíveis"""
    plans, total = await service.list_plans(page=page, size=size, tier=tier)
    return {
        "plans": [PlanResponse.model_validate(p) for p in plans],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post("/plans", status_code=201)
async def create_plan(
    plan_data: PlanCreate,
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> PlanResponse:
    """Criar novo plano (admin only)"""
    plan = await service.create_plan(plan_data)
    return PlanResponse.model_validate(plan)


@router.get("/plans/{plan_id}")
async def get_plan(
    plan_id: uuid.UUID,
    service: BillingService = Depends(get_billing_service),
) -> PlanResponse:
    """Obter detalhes de um plano"""
    plan = await service.get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return PlanResponse.model_validate(plan)


@router.put("/plans/{plan_id}")
async def update_plan(
    plan_id: uuid.UUID,
    plan_update: PlanUpdate,
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> PlanResponse:
    """Atualizar plano (admin only)"""
    plan = await service.update_plan(plan_id, plan_update)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return PlanResponse.model_validate(plan)


# =============================================================================
# SUBSCRIPTIONS
# =============================================================================


@router.post("/subscriptions", status_code=201)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> SubscriptionResponse:
    """Criar nova assinatura"""
    subscription = await service.create_subscription(subscription_data)
    return SubscriptionResponse.model_validate(subscription)


@router.get("/subscriptions/user/{user_id}")
async def get_user_subscription(
    user_id: uuid.UUID,
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> SubscriptionResponse:
    """Obter assinatura ativa do usuário"""
    subscription = await service.get_active_subscription_by_user(user_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    return SubscriptionResponse.model_validate(subscription)


@router.put("/subscriptions/{subscription_id}")
async def update_subscription(
    subscription_id: uuid.UUID,
    subscription_update: SubscriptionUpdate,
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> SubscriptionResponse:
    """Atualizar assinatura"""
    subscription = await service.update_subscription(subscription_id, subscription_update)
    if not subscription:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    return SubscriptionResponse.model_validate(subscription)


@router.post("/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: uuid.UUID,
    immediately: bool = Query(False),
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> SubscriptionResponse:
    """Cancelar assinatura"""
    subscription = await service.cancel_subscription(subscription_id, immediately)
    if not subscription:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    return SubscriptionResponse.model_validate(subscription)


# =============================================================================
# USAGE
# =============================================================================


@router.post("/usage", status_code=201)
async def track_usage(
    metric_data: UsageMetricCreate,
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> UsageMetricResponse:
    """Registrar uso de recursos"""
    metric = await service.track_usage(metric_data)
    return UsageMetricResponse.model_validate(metric)


@router.get("/usage/user/{user_id}/summary")
async def get_usage_summary(
    user_id: uuid.UUID,
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
) -> UsageSummary:
    """Obter resumo de uso do usuário"""
    return await service.get_usage_summary(user_id)


# =============================================================================
# SUBSCRIPTION MANAGEMENT
# =============================================================================


@router.get("/subscriptions")
async def list_subscriptions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
):
    """Listar todas as assinaturas (admin)"""
    try:
        # Converter status string para enum se fornecido
        status_enum = None
        if status:
            try:
                status_enum = SubscriptionStatus(status)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Status inválido. Use: {', '.join([s.value for s in SubscriptionStatus])}",
                )

        subscriptions, total = await service.list_all_subscriptions(
            page=page, size=size, status=status_enum
        )

        return {
            "subscriptions": [SubscriptionResponse.model_validate(s) for s in subscriptions],
            "total": total,
            "page": page,
            "size": size,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar assinaturas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/subscriptions/{subscription_id}/upgrade")
async def upgrade_subscription(
    subscription_id: uuid.UUID,
    new_plan_id: uuid.UUID = Query(..., description="ID do novo plano"),
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
):
    """Fazer upgrade de assinatura"""
    try:
        # Buscar assinatura atual
        subscription = await service.get_subscription_by_id(subscription_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="Assinatura não encontrada")

        # Buscar novo plano
        new_plan = await service.get_plan_by_id(new_plan_id)
        if not new_plan:
            raise HTTPException(status_code=404, detail="Plano não encontrado")

        # Atualizar assinatura
        subscription_update = SubscriptionUpdate(
            id_plan=new_plan_id,
            vl_price=new_plan.vl_price_monthly,
        )
        updated = await service.update_subscription(subscription_id, subscription_update)

        return {
            "message": "Upgrade realizado com sucesso",
            "subscription": SubscriptionResponse.model_validate(updated),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer upgrade: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar upgrade")


@router.post("/subscriptions/{subscription_id}/downgrade")
async def downgrade_subscription(
    subscription_id: uuid.UUID,
    new_plan_id: uuid.UUID = Query(..., description="ID do novo plano"),
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
):
    """Fazer downgrade de assinatura"""
    try:
        # Buscar assinatura atual
        subscription = await service.get_subscription_by_id(subscription_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="Assinatura não encontrada")

        # Buscar novo plano
        new_plan = await service.get_plan_by_id(new_plan_id)
        if not new_plan:
            raise HTTPException(status_code=404, detail="Plano não encontrado")

        # Atualizar assinatura
        subscription_update = SubscriptionUpdate(
            id_plan=new_plan_id,
            vl_price=new_plan.vl_price_monthly,
        )
        updated = await service.update_subscription(subscription_id, subscription_update)

        return {
            "message": "Downgrade agendado para o fim do período atual",
            "subscription": SubscriptionResponse.model_validate(updated),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer downgrade: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar downgrade")


# =============================================================================
# QUOTA CHECKING
# =============================================================================


@router.get("/quotas/check/{user_id}")
async def check_quota(
    user_id: uuid.UUID,
    metric_type: str = Query(..., description="Tipo de métrica a verificar"),
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
):
    """Verificar se usuário está dentro da quota"""
    try:
        from src.models.billing import UsageMetricType

        # Converter string para enum
        try:
            metric_enum = UsageMetricType(metric_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de métrica inválido. Valores válidos: {[e.value for e in UsageMetricType]}"
            )

        allowed, info = await service.check_quota(user_id, metric_enum)

        return {
            "allowed": allowed,
            "quota_info": info,
            "metric_type": metric_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar quota: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao verificar quota")


# =============================================================================
# PAYMENT HISTORY
# =============================================================================


@router.get("/payments/user/{user_id}")
async def get_payment_history(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
):
    """Obter histórico de pagamentos do usuário"""
    try:
        payments, total = await service.get_payment_history(user_id, page=page, size=size)

        return {
            "payments": [PaymentResponse.model_validate(p) for p in payments],
            "total": total,
            "page": page,
            "size": size,
        }

    except Exception as e:
        logger.error(f"Erro ao buscar histórico de pagamentos: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/invoices/user/{user_id}")
async def get_invoices(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
):
    """Obter faturas do usuário"""
    try:
        invoices, total = await service.get_user_invoices(user_id, page=page, size=size)

        return {
            "invoices": [InvoiceResponse.model_validate(i) for i in invoices],
            "total": total,
            "page": page,
            "size": size,
        }

    except Exception as e:
        logger.error(f"Erro ao buscar invoices: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# =============================================================================
# STRIPE WEBHOOKS
# =============================================================================


@router.post("/webhooks/stripe")
async def stripe_webhook(
    event: dict,  # Stripe envia um JSON com o evento
    service: BillingService = Depends(get_billing_service),
):
    """
    Webhook para eventos do Stripe

    IMPORTANTE: Em produção, adicione validação de assinatura usando stripe.Webhook.construct_event()
    Ver: https://stripe.com/docs/webhooks/signatures
    """
    try:
        # TODO: Em produção, validar assinatura do Stripe
        # stripe_signature = request.headers.get("stripe-signature")
        # event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)

        event_type = event.get("type")
        event_data = event.get("data", {}).get("object", {})

        logger.info(f"Webhook Stripe recebido: {event_type}")

        # Processar diferentes tipos de eventos
        if event_type == "customer.subscription.created":
            # Nova assinatura criada
            logger.info(f"Nova assinatura criada: {event_data.get('id')}")
            # TODO: Sincronizar com banco de dados

        elif event_type == "customer.subscription.updated":
            # Assinatura atualizada
            logger.info(f"Assinatura atualizada: {event_data.get('id')}")
            # TODO: Atualizar status/dados da assinatura

        elif event_type == "customer.subscription.deleted":
            # Assinatura cancelada
            logger.info(f"Assinatura cancelada: {event_data.get('id')}")
            # TODO: Marcar assinatura como cancelada

        elif event_type == "invoice.payment_succeeded":
            # Pagamento de invoice bem-sucedido
            invoice_id = event_data.get("id")
            amount = event_data.get("amount_paid", 0) / 100  # Stripe usa centavos
            logger.info(f"Pagamento bem-sucedido: invoice {invoice_id}, valor {amount}")
            # TODO: Atualizar invoice e criar payment record

        elif event_type == "invoice.payment_failed":
            # Falha no pagamento
            invoice_id = event_data.get("id")
            logger.warning(f"Falha no pagamento: invoice {invoice_id}")
            # TODO: Notificar usuário e atualizar status

        elif event_type == "payment_intent.succeeded":
            # Payment intent bem-sucedido
            payment_intent_id = event_data.get("id")
            logger.info(f"Payment intent bem-sucedido: {payment_intent_id}")

        elif event_type == "payment_intent.payment_failed":
            # Falha no payment intent
            payment_intent_id = event_data.get("id")
            error = event_data.get("last_payment_error", {}).get("message", "Unknown error")
            logger.warning(f"Payment intent falhou: {payment_intent_id} - {error}")

        else:
            logger.debug(f"Evento não processado: {event_type}")

        return {"received": True, "event_type": event_type}

    except Exception as e:
        logger.error(f"Erro ao processar webhook do Stripe: {str(e)}")
        # Não retornar 500 para não fazer Stripe retentar indefinidamente
        return {"received": True, "error": str(e)}


# =============================================================================
# STATISTICS
# =============================================================================


@router.get("/stats")
async def get_billing_stats(
    service: BillingService = Depends(get_billing_service),
    _=Depends(get_current_apikey),
):
    """Obter estatísticas de billing (admin)"""
    try:
        stats = await service.get_billing_statistics()
        return stats

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
