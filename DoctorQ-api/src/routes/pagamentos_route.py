"""
Rotas para gerenciamento de pagamentos via Stripe e MercadoPago.

Este módulo fornece endpoints para:
- Criar sessões de checkout (Stripe)
- Criar preferências de pagamento (MercadoPago)
- Processar pagamentos PIX
- Gerenciar webhooks
- Consultar status de pagamentos
"""

import uuid
from decimal import Decimal
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.models.pagamento import (
    EventoOrigemEnum,
    GatewayEnum,
    PagamentoCreate,
    StatusPagamentoEnum,
    TipoPagamentoEnum,
)
from src.services.mercadopago_service import MercadoPagoService
from src.services.pagamento_service import PagamentoService
from src.services.stripe_service import StripeService

router = APIRouter(prefix="/pagamentos", tags=["Pagamentos"])


# ========== Pydantic Schemas ==========


class StripeCheckoutRequest(BaseModel):
    """Schema para criação de sessão de checkout Stripe."""

    id_empresa: uuid.UUID = Field(..., description="ID da empresa")
    id_user: Optional[uuid.UUID] = Field(None, description="ID do usuário (opcional)")
    amount: int = Field(..., description="Valor em centavos (ex: 10000 = R$ 100)")
    currency: str = Field(default="brl", description="Moeda (brl, usd, etc)")
    success_url: str = Field(..., description="URL de redirecionamento em caso de sucesso")
    cancel_url: str = Field(..., description="URL de redirecionamento em caso de cancelamento")
    description: Optional[str] = Field(None, description="Descrição do pagamento")
    payer_email: Optional[str] = Field(None, description="Email do pagador")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Dados adicionais para rastreamento"
    )


class StripePaymentIntentRequest(BaseModel):
    """Schema para criação de Payment Intent."""

    amount: int = Field(..., description="Valor em centavos")
    currency: str = Field(default="brl", description="Moeda")
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    automatic_payment_methods: bool = Field(
        default=True, description="Habilitar métodos automáticos"
    )


class MercadoPagoPreferenceRequest(BaseModel):
    """Schema para criação de preferência MercadoPago."""

    title: str = Field(..., description="Título do item")
    amount: float = Field(..., description="Valor unitário em reais")
    quantity: int = Field(default=1, description="Quantidade")
    success_url: str = Field(..., description="URL de sucesso")
    failure_url: str = Field(..., description="URL de falha")
    pending_url: str = Field(..., description="URL de pendente")
    payer_email: Optional[str] = Field(default=None, description="Email do pagador")
    metadata: Optional[Dict[str, Any]] = Field(default=None)


class MercadoPagoPixRequest(BaseModel):
    """Schema para criação de pagamento PIX."""

    amount: float = Field(..., description="Valor em reais")
    description: str = Field(..., description="Descrição do pagamento")
    payer_email: str = Field(..., description="Email do pagador")
    payer_cpf: Optional[str] = Field(default=None, description="CPF do pagador")
    payer_name: Optional[str] = Field(default=None, description="Nome do pagador")
    metadata: Optional[Dict[str, Any]] = Field(default=None)


class MercadoPagoCardRequest(BaseModel):
    """Schema para pagamento com cartão."""

    amount: float = Field(..., description="Valor em reais")
    token: str = Field(..., description="Token do cartão")
    description: str = Field(..., description="Descrição")
    installments: int = Field(default=1, description="Número de parcelas")
    payer_email: str = Field(..., description="Email do pagador")
    metadata: Optional[Dict[str, Any]] = Field(default=None)


class RefundRequest(BaseModel):
    """Schema para reembolso."""

    payment_id: str = Field(..., description="ID do pagamento")
    amount: Optional[float] = Field(
        default=None, description="Valor a reembolsar (None = total)"
    )
    reason: Optional[str] = Field(default=None, description="Motivo do reembolso")


# ========== STRIPE ENDPOINTS ==========


@router.post("/stripe/checkout/")
async def create_stripe_checkout(
    data: StripeCheckoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Cria uma sessão de checkout Stripe e salva no banco de dados.

    - **id_empresa**: ID da empresa
    - **id_user**: ID do usuário (opcional)
    - **amount**: Valor em centavos (10000 = R$ 100)
    - **currency**: Moeda (brl, usd, etc)
    - **success_url**: URL de redirecionamento em caso de sucesso
    - **cancel_url**: URL de redirecionamento em caso de cancelamento
    - **description**: Descrição do pagamento (opcional)
    - **payer_email**: Email do pagador (opcional)
    - **metadata**: Dados adicionais (opcional)

    Retorna URL de checkout para redirecionar o cliente.
    """
    try:
        # 1. Criar sessão no Stripe
        session = await StripeService.create_checkout_session(
            amount=data.amount,
            currency=data.currency,
            success_url=data.success_url,
            cancel_url=data.cancel_url,
            metadata=data.metadata,
        )

        # 2. Salvar no banco de dados
        pagamento_data = PagamentoCreate(
            id_empresa=data.id_empresa,
            id_user=data.id_user,
            ds_gateway=GatewayEnum.STRIPE,
            ds_tipo_pagamento=TipoPagamentoEnum.CHECKOUT,
            ds_external_id=session["id"],
            ds_session_id=session["id"],
            ds_payment_method="card",
            vl_amount=Decimal(data.amount) / 100,  # Converter centavos para reais
            ds_currency=data.currency.upper(),
            ds_status=StatusPagamentoEnum.PENDING,
            ds_payer_email=data.payer_email,
            ds_description=data.description,
            ds_metadata=data.metadata,
            ds_success_url=data.success_url,
            ds_cancel_url=data.cancel_url,
        )

        pagamento = await PagamentoService.criar_pagamento(db, pagamento_data)

        # 3. Retornar dados
        return {
            "success": True,
            "data": {
                **session,
                "id_pagamento": str(pagamento.id_pagamento),
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar checkout: {str(e)}")


@router.get("/stripe/session/{session_id}/")
async def get_stripe_session(session_id: str):
    """
    Recupera informações de uma sessão de checkout Stripe.

    - **session_id**: ID da sessão retornado ao criar o checkout
    """
    try:
        session = await StripeService.retrieve_session(session_id)
        return {"success": True, "data": session}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao recuperar sessão: {str(e)}")


@router.post("/stripe/payment-intent/")
async def create_stripe_payment_intent(data: StripePaymentIntentRequest):
    """
    Cria um Payment Intent Stripe para pagamento direto.

    - **amount**: Valor em centavos
    - **currency**: Moeda
    - **automatic_payment_methods**: Habilitar métodos automáticos
    - **metadata**: Dados adicionais (opcional)

    Retorna client_secret para usar no frontend.
    """
    try:
        intent = await StripeService.create_payment_intent(
            amount=data.amount,
            currency=data.currency,
            metadata=data.metadata,
            automatic_payment_methods=data.automatic_payment_methods,
        )
        return {"success": True, "data": intent}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao criar payment intent: {str(e)}"
        )


@router.get("/stripe/payment-intent/{payment_intent_id}/")
async def get_stripe_payment_intent(payment_intent_id: str):
    """
    Recupera informações de um Payment Intent.

    - **payment_intent_id**: ID do Payment Intent
    """
    try:
        intent = await StripeService.retrieve_payment_intent(payment_intent_id)
        return {"success": True, "data": intent}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao recuperar payment intent: {str(e)}"
        )


@router.post("/stripe/webhook/")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint para receber webhooks do Stripe.

    Valida assinatura e processa eventos (payment_intent.succeeded, etc).
    Persiste eventos e atualizações de status no banco de dados.
    """
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if not sig_header:
            raise HTTPException(status_code=400, detail="Header de assinatura ausente")

        event = await StripeService.handle_webhook(payload, sig_header)

        # Processar diferentes tipos de eventos
        event_type = event.get("type")
        event_data = event.get("data", {})

        if event_type == "checkout.session.completed":
            # Sessão de checkout completada
            session_id = event_data.get("id")
            payment_status = event_data.get("payment_status")

            # Buscar pagamento no banco
            pagamento = await PagamentoService.buscar_por_external_id(
                db, external_id=session_id, gateway="stripe"
            )

            if pagamento:
                # Mapear status do Stripe para StatusPagamentoEnum
                novo_status = StatusPagamentoEnum.SUCCEEDED if payment_status == "paid" else StatusPagamentoEnum.PENDING

                # Atualizar pagamento
                from src.models.pagamento import PagamentoUpdate
                update_data = PagamentoUpdate(
                    ds_status=novo_status,
                    ds_payment_method=event_data.get("payment_method_types", ["card"])[0],
                )
                await PagamentoService.atualizar_pagamento(
                    db, id_pagamento=pagamento.id_pagamento, data=update_data
                )

                # Registrar transação do webhook
                await PagamentoService.registrar_transacao(
                    db=db,
                    id_pagamento=pagamento.id_pagamento,
                    evento_tipo="checkout.session.completed",
                    origem=EventoOrigemEnum.WEBHOOK,
                    status_anterior=pagamento.ds_status,
                    status_novo=novo_status,
                    evento_data=event_data,
                    mensagem=f"Checkout completado - Status: {payment_status}",
                )

        elif event_type == "payment_intent.succeeded":
            # Pagamento bem-sucedido
            payment_intent_id = event_data.get("id")

            # Buscar pagamento no banco
            pagamento = await PagamentoService.buscar_por_external_id(
                db, external_id=payment_intent_id, gateway="stripe"
            )

            if pagamento:
                # Atualizar para succeeded
                from src.models.pagamento import PagamentoUpdate
                update_data = PagamentoUpdate(
                    ds_status=StatusPagamentoEnum.SUCCEEDED,
                    vl_fee=Decimal(event_data.get("charges", {}).get("data", [{}])[0].get("balance_transaction", {}).get("fee", 0)) / 100,
                    vl_net=Decimal(event_data.get("amount_received", 0)) / 100,
                )
                await PagamentoService.atualizar_pagamento(
                    db, id_pagamento=pagamento.id_pagamento, data=update_data
                )

                # Registrar transação
                await PagamentoService.registrar_transacao(
                    db=db,
                    id_pagamento=pagamento.id_pagamento,
                    evento_tipo="payment_intent.succeeded",
                    origem=EventoOrigemEnum.WEBHOOK,
                    status_anterior=pagamento.ds_status,
                    status_novo=StatusPagamentoEnum.SUCCEEDED,
                    evento_data=event_data,
                    mensagem="Pagamento confirmado com sucesso",
                )

        elif event_type == "payment_intent.payment_failed":
            # Pagamento falhou
            payment_intent_id = event_data.get("id")
            error_message = event_data.get("last_payment_error", {}).get("message", "Erro desconhecido")
            error_code = event_data.get("last_payment_error", {}).get("code")

            # Buscar pagamento no banco
            pagamento = await PagamentoService.buscar_por_external_id(
                db, external_id=payment_intent_id, gateway="stripe"
            )

            if pagamento:
                # Atualizar para failed
                from src.models.pagamento import PagamentoUpdate
                update_data = PagamentoUpdate(
                    ds_status=StatusPagamentoEnum.FAILED,
                    ds_status_detail=error_message,
                )
                await PagamentoService.atualizar_pagamento(
                    db, id_pagamento=pagamento.id_pagamento, data=update_data
                )

                # Registrar transação
                await PagamentoService.registrar_transacao(
                    db=db,
                    id_pagamento=pagamento.id_pagamento,
                    evento_tipo="payment_intent.payment_failed",
                    origem=EventoOrigemEnum.WEBHOOK,
                    status_anterior=pagamento.ds_status,
                    status_novo=StatusPagamentoEnum.FAILED,
                    evento_data=event_data,
                    mensagem=error_message,
                    codigo_erro=error_code,
                )

        return {"success": True, "event_type": event_type, "processed": True}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar webhook: {str(e)}")


@router.post("/stripe/refund/")
async def create_stripe_refund(data: RefundRequest):
    """
    Cria um reembolso Stripe.

    - **payment_id**: ID do Payment Intent
    - **amount**: Valor a reembolsar em centavos (None = total)
    - **reason**: Motivo do reembolso (opcional)
    """
    try:
        refund = await StripeService.create_refund(
            payment_intent_id=data.payment_id,
            amount=int(data.amount) if data.amount else None,
            reason=data.reason,
        )
        return {"success": True, "data": refund}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar reembolso: {str(e)}")


# ========== MERCADOPAGO ENDPOINTS ==========


@router.post("/mercadopago/preference/")
async def create_mercadopago_preference(data: MercadoPagoPreferenceRequest):
    """
    Cria uma preferência de pagamento MercadoPago.

    - **title**: Título do item
    - **amount**: Valor unitário em reais
    - **quantity**: Quantidade
    - **success_url**: URL de sucesso
    - **failure_url**: URL de falha
    - **pending_url**: URL de pendente
    - **payer_email**: Email do pagador (opcional)
    - **metadata**: Dados adicionais (opcional)

    Retorna init_point para redirecionar o cliente.
    """
    try:
        service = MercadoPagoService()
        preference = await service.create_preference(
            title=data.title,
            amount=data.amount,
            quantity=data.quantity,
            success_url=data.success_url,
            failure_url=data.failure_url,
            pending_url=data.pending_url,
            metadata=data.metadata,
            payer_email=data.payer_email,
        )
        return {"success": True, "data": preference}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar preferência: {str(e)}")


@router.post("/mercadopago/pix/")
async def create_mercadopago_pix(data: MercadoPagoPixRequest):
    """
    Cria um pagamento PIX via MercadoPago.

    - **amount**: Valor em reais
    - **description**: Descrição do pagamento
    - **payer_email**: Email do pagador
    - **payer_cpf**: CPF do pagador (opcional)
    - **payer_name**: Nome do pagador (opcional)
    - **metadata**: Dados adicionais (opcional)

    Retorna QR Code e dados do pagamento PIX.
    """
    try:
        service = MercadoPagoService()
        payment = await service.create_pix_payment(
            amount=data.amount,
            description=data.description,
            payer_email=data.payer_email,
            payer_cpf=data.payer_cpf,
            payer_name=data.payer_name,
            metadata=data.metadata,
        )
        return {"success": True, "data": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar pagamento PIX: {str(e)}")


@router.post("/mercadopago/card/")
async def create_mercadopago_card_payment(data: MercadoPagoCardRequest):
    """
    Cria um pagamento com cartão via MercadoPago.

    - **amount**: Valor em reais
    - **token**: Token do cartão (gerado no frontend)
    - **description**: Descrição
    - **installments**: Número de parcelas
    - **payer_email**: Email do pagador
    - **metadata**: Dados adicionais (opcional)
    """
    try:
        service = MercadoPagoService()
        payment = await service.create_card_payment(
            amount=data.amount,
            token=data.token,
            description=data.description,
            installments=data.installments,
            payer_email=data.payer_email,
            metadata=data.metadata,
        )
        return {"success": True, "data": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao criar pagamento com cartão: {str(e)}"
        )


@router.get("/mercadopago/payment/{payment_id}/")
async def get_mercadopago_payment(payment_id: str):
    """
    Recupera informações de um pagamento MercadoPago.

    - **payment_id**: ID do pagamento
    """
    try:
        service = MercadoPagoService()
        payment = await service.get_payment(payment_id)
        return {"success": True, "data": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao recuperar pagamento: {str(e)}"
        )


@router.post("/mercadopago/webhook/")
async def mercadopago_webhook(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint para receber webhooks do MercadoPago.

    Processa notificações de pagamento (payment.created, etc).
    Persiste eventos e atualizações de status no banco de dados.
    """
    try:
        service = MercadoPagoService()
        payment_data = await service.handle_webhook(payload)

        if payment_data:
            # Pagamento encontrado
            payment_id = str(payment_data.get("id"))
            payment_status = payment_data.get("status")
            status_detail = payment_data.get("status_detail")

            # Buscar pagamento no banco
            pagamento = await PagamentoService.buscar_por_external_id(
                db, external_id=payment_id, gateway="mercadopago"
            )

            if pagamento:
                # Mapear status do MercadoPago para StatusPagamentoEnum
                status_map = {
                    "approved": StatusPagamentoEnum.SUCCEEDED,
                    "pending": StatusPagamentoEnum.PENDING,
                    "in_process": StatusPagamentoEnum.PROCESSING,
                    "rejected": StatusPagamentoEnum.FAILED,
                    "cancelled": StatusPagamentoEnum.CANCELED,
                    "refunded": StatusPagamentoEnum.REFUNDED,
                }
                novo_status = status_map.get(payment_status, StatusPagamentoEnum.PENDING)

                if payment_status == "approved":
                    # Pagamento aprovado
                    from src.models.pagamento import PagamentoUpdate
                    update_data = PagamentoUpdate(
                        ds_status=novo_status,
                        ds_status_detail=status_detail,
                        vl_fee=Decimal(payment_data.get("fee_details", [{}])[0].get("amount", 0)),
                        vl_net=Decimal(payment_data.get("transaction_amount", 0)) - Decimal(payment_data.get("fee_details", [{}])[0].get("amount", 0)),
                    )
                    await PagamentoService.atualizar_pagamento(
                        db, id_pagamento=pagamento.id_pagamento, data=update_data
                    )

                    # Registrar transação
                    await PagamentoService.registrar_transacao(
                        db=db,
                        id_pagamento=pagamento.id_pagamento,
                        evento_tipo="payment.approved",
                        origem=EventoOrigemEnum.WEBHOOK,
                        status_anterior=pagamento.ds_status,
                        status_novo=novo_status,
                        evento_data=payment_data,
                        mensagem=f"Pagamento aprovado - Detalhes: {status_detail}",
                    )

                elif payment_status == "rejected":
                    # Pagamento rejeitado
                    from src.models.pagamento import PagamentoUpdate
                    update_data = PagamentoUpdate(
                        ds_status=novo_status,
                        ds_status_detail=status_detail,
                    )
                    await PagamentoService.atualizar_pagamento(
                        db, id_pagamento=pagamento.id_pagamento, data=update_data
                    )

                    # Registrar transação
                    await PagamentoService.registrar_transacao(
                        db=db,
                        id_pagamento=pagamento.id_pagamento,
                        evento_tipo="payment.rejected",
                        origem=EventoOrigemEnum.WEBHOOK,
                        status_anterior=pagamento.ds_status,
                        status_novo=novo_status,
                        evento_data=payment_data,
                        mensagem=f"Pagamento rejeitado - Motivo: {status_detail}",
                        codigo_erro=status_detail,
                    )

                elif payment_status == "pending":
                    # Pagamento pendente
                    from src.models.pagamento import PagamentoUpdate
                    update_data = PagamentoUpdate(
                        ds_status=novo_status,
                        ds_status_detail=status_detail,
                    )
                    await PagamentoService.atualizar_pagamento(
                        db, id_pagamento=pagamento.id_pagamento, data=update_data
                    )

                    # Registrar transação
                    await PagamentoService.registrar_transacao(
                        db=db,
                        id_pagamento=pagamento.id_pagamento,
                        evento_tipo="payment.pending",
                        origem=EventoOrigemEnum.WEBHOOK,
                        status_anterior=pagamento.ds_status,
                        status_novo=novo_status,
                        evento_data=payment_data,
                        mensagem=f"Pagamento pendente - Aguardando: {status_detail}",
                    )

        return {"success": True, "processed": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar webhook: {str(e)}")


@router.post("/mercadopago/refund/")
async def create_mercadopago_refund(data: RefundRequest):
    """
    Cria um reembolso MercadoPago.

    - **payment_id**: ID do pagamento
    - **amount**: Valor a reembolsar (None = total)
    """
    try:
        service = MercadoPagoService()
        refund = await service.create_refund(
            payment_id=data.payment_id, amount=data.amount
        )
        return {"success": True, "data": refund}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar reembolso: {str(e)}")


# ========== HEALTH CHECK ==========


@router.get("/health/")
async def payment_health():
    """
    Verifica se os serviços de pagamento estão configurados.
    """
    from src.config.settings import get_settings

    settings = get_settings()

    return {
        "stripe": {
            "configured": bool(settings.stripe_secret_key),
            "mode": settings.stripe_mode,
        },
        "mercadopago": {
            "configured": bool(settings.mercadopago_access_token),
            "mode": settings.mercadopago_mode,
        },
    }
