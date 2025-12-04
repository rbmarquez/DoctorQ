"""
Serviço de integração com Stripe para processamento de pagamentos.

Este módulo fornece funcionalidades para:
- Criar sessões de checkout
- Processar Payment Intents
- Gerenciar webhooks do Stripe
- Recuperar informações de pagamento
"""

from typing import Any, Dict, Optional

import stripe

from src.config.settings import get_settings

settings = get_settings()

# Configurar API key do Stripe
if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Serviço para operações com Stripe."""

    @staticmethod
    async def create_checkout_session(
        amount: int,
        currency: str = "brl",
        success_url: str = "",
        cancel_url: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Cria uma sessão de checkout Stripe.

        Args:
            amount: Valor em centavos (ex: 10000 = R$ 100,00)
            currency: Moeda (padrão: "brl")
            success_url: URL de redirecionamento em caso de sucesso
            cancel_url: URL de redirecionamento em caso de cancelamento
            metadata: Dados adicionais para rastreamento

        Returns:
            Dicionário com dados da sessão criada

        Raises:
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        if not settings.stripe_secret_key:
            raise ValueError("Stripe secret key não configurada")

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": currency,
                            "product_data": {"name": "Pagamento DoctorQ"},
                            "unit_amount": amount,
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata or {},
            )
            return {
                "id": session.id,
                "url": session.url,
                "status": session.status,
                "amount_total": session.amount_total,
                "currency": session.currency,
                "payment_status": session.payment_status,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Erro ao criar sessão Stripe: {str(e)}") from e

    @staticmethod
    async def retrieve_session(session_id: str) -> Dict[str, Any]:
        """
        Recupera informações de uma sessão de checkout.

        Args:
            session_id: ID da sessão Stripe

        Returns:
            Dicionário com dados da sessão

        Raises:
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        if not settings.stripe_secret_key:
            raise ValueError("Stripe secret key não configurada")

        try:
            session = stripe.checkout.Session.retrieve(session_id)
            return {
                "id": session.id,
                "status": session.status,
                "amount_total": session.amount_total,
                "currency": session.currency,
                "payment_status": session.payment_status,
                "customer_email": session.customer_details.email
                if session.customer_details
                else None,
                "metadata": session.metadata,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Erro ao recuperar sessão Stripe: {str(e)}") from e

    @staticmethod
    async def create_payment_intent(
        amount: int,
        currency: str = "brl",
        metadata: Optional[Dict[str, Any]] = None,
        automatic_payment_methods: bool = True,
    ) -> Dict[str, Any]:
        """
        Cria um Payment Intent para pagamento direto.

        Args:
            amount: Valor em centavos
            currency: Moeda (padrão: "brl")
            metadata: Dados adicionais
            automatic_payment_methods: Se deve habilitar métodos automáticos

        Returns:
            Dicionário com dados do Payment Intent

        Raises:
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        if not settings.stripe_secret_key:
            raise ValueError("Stripe secret key não configurada")

        try:
            intent_data = {
                "amount": amount,
                "currency": currency,
                "metadata": metadata or {},
            }

            if automatic_payment_methods:
                intent_data["automatic_payment_methods"] = {"enabled": True}

            payment_intent = stripe.PaymentIntent.create(**intent_data)

            return {
                "id": payment_intent.id,
                "client_secret": payment_intent.client_secret,
                "status": payment_intent.status,
                "amount": payment_intent.amount,
                "currency": payment_intent.currency,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Erro ao criar Payment Intent: {str(e)}") from e

    @staticmethod
    async def retrieve_payment_intent(payment_intent_id: str) -> Dict[str, Any]:
        """
        Recupera informações de um Payment Intent.

        Args:
            payment_intent_id: ID do Payment Intent

        Returns:
            Dicionário com dados do Payment Intent

        Raises:
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        if not settings.stripe_secret_key:
            raise ValueError("Stripe secret key não configurada")

        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "id": payment_intent.id,
                "status": payment_intent.status,
                "amount": payment_intent.amount,
                "currency": payment_intent.currency,
                "charges": payment_intent.charges.data if payment_intent.charges else [],
                "metadata": payment_intent.metadata,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Erro ao recuperar Payment Intent: {str(e)}") from e

    @staticmethod
    async def handle_webhook(payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Processa webhook do Stripe e valida assinatura.

        Args:
            payload: Corpo da requisição em bytes
            sig_header: Header Stripe-Signature da requisição

        Returns:
            Evento processado do Stripe

        Raises:
            ValueError: Se o payload for inválido
            stripe.error.SignatureVerificationError: Se a assinatura for inválida
        """
        webhook_secret = settings.stripe_webhook_secret

        if not webhook_secret:
            raise ValueError("Stripe webhook secret não configurado")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            return {
                "id": event.id,
                "type": event.type,
                "data": event.data.object,
                "created": event.created,
            }
        except ValueError as e:
            raise ValueError(f"Payload inválido: {str(e)}") from e
        except stripe.error.SignatureVerificationError as e:
            raise ValueError(f"Assinatura inválida: {str(e)}") from e

    @staticmethod
    async def list_payment_methods(
        customer_id: str, type: str = "card"
    ) -> Dict[str, Any]:
        """
        Lista métodos de pagamento de um cliente.

        Args:
            customer_id: ID do cliente Stripe
            type: Tipo de método de pagamento (card, etc)

        Returns:
            Lista de métodos de pagamento

        Raises:
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        if not settings.stripe_secret_key:
            raise ValueError("Stripe secret key não configurada")

        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id, type=type
            )
            return {"payment_methods": payment_methods.data, "has_more": payment_methods.has_more}
        except stripe.error.StripeError as e:
            raise Exception(f"Erro ao listar métodos de pagamento: {str(e)}") from e

    @staticmethod
    async def create_refund(
        payment_intent_id: str, amount: Optional[int] = None, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cria um reembolso para um pagamento.

        Args:
            payment_intent_id: ID do Payment Intent
            amount: Valor a reembolsar em centavos (None = reembolso total)
            reason: Motivo do reembolso

        Returns:
            Dados do reembolso criado

        Raises:
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        if not settings.stripe_secret_key:
            raise ValueError("Stripe secret key não configurada")

        try:
            refund_data = {"payment_intent": payment_intent_id}

            if amount:
                refund_data["amount"] = amount

            if reason:
                refund_data["reason"] = reason

            refund = stripe.Refund.create(**refund_data)

            return {
                "id": refund.id,
                "status": refund.status,
                "amount": refund.amount,
                "currency": refund.currency,
                "reason": refund.reason,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Erro ao criar reembolso: {str(e)}") from e
