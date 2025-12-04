"""
Serviço de integração com MercadoPago para processamento de pagamentos no Brasil.

Este módulo fornece funcionalidades para:
- Criar preferências de pagamento
- Processar pagamentos PIX
- Gerenciar webhooks do MercadoPago
- Recuperar informações de pagamento
"""

from typing import Any, Dict, Optional

import mercadopago

from src.config.settings import get_settings

settings = get_settings()


class MercadoPagoService:
    """Serviço para operações com MercadoPago."""

    def __init__(self):
        """Inicializa o SDK do MercadoPago."""
        if not settings.mercadopago_access_token:
            raise ValueError("MercadoPago access token não configurado")

        self.sdk = mercadopago.SDK(settings.mercadopago_access_token)

    async def create_preference(
        self,
        title: str,
        amount: float,
        quantity: int = 1,
        success_url: str = "",
        failure_url: str = "",
        pending_url: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        payer_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Cria uma preferência de pagamento no MercadoPago.

        Args:
            title: Título do item
            amount: Valor unitário em reais (ex: 100.00)
            quantity: Quantidade de itens
            success_url: URL de redirecionamento em caso de sucesso
            failure_url: URL de redirecionamento em caso de falha
            pending_url: URL de redirecionamento para pagamento pendente
            metadata: Dados adicionais para rastreamento
            payer_email: Email do pagador (opcional)

        Returns:
            Dicionário com dados da preferência criada

        Raises:
            Exception: Em caso de erro na API do MercadoPago
        """
        try:
            preference_data = {
                "items": [{"title": title, "quantity": quantity, "unit_price": amount}],
                "back_urls": {
                    "success": success_url,
                    "failure": failure_url,
                    "pending": pending_url,
                },
                "auto_return": "approved",
                "metadata": metadata or {},
            }

            if payer_email:
                preference_data["payer"] = {"email": payer_email}

            preference = self.sdk.preference().create(preference_data)

            if preference["status"] == 200 or preference["status"] == 201:
                response = preference["response"]
                return {
                    "id": response["id"],
                    "init_point": response["init_point"],
                    "sandbox_init_point": response.get("sandbox_init_point"),
                    "status": "created",
                }
            else:
                raise Exception(
                    f"Erro ao criar preferência: {preference.get('response', {}).get('message', 'Erro desconhecido')}"
                )

        except Exception as e:
            raise Exception(f"Erro ao criar preferência MercadoPago: {str(e)}") from e

    async def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Recupera informações de um pagamento.

        Args:
            payment_id: ID do pagamento

        Returns:
            Dicionário com dados do pagamento

        Raises:
            Exception: Em caso de erro na API do MercadoPago
        """
        try:
            payment = self.sdk.payment().get(payment_id)

            if payment["status"] == 200:
                response = payment["response"]
                return {
                    "id": response["id"],
                    "status": response["status"],
                    "status_detail": response.get("status_detail"),
                    "transaction_amount": response["transaction_amount"],
                    "currency_id": response["currency_id"],
                    "payment_method_id": response.get("payment_method_id"),
                    "payment_type_id": response.get("payment_type_id"),
                    "description": response.get("description"),
                    "payer": response.get("payer", {}),
                    "metadata": response.get("metadata", {}),
                    "date_created": response.get("date_created"),
                    "date_approved": response.get("date_approved"),
                }
            else:
                raise Exception(
                    f"Erro ao recuperar pagamento: {payment.get('response', {}).get('message', 'Erro desconhecido')}"
                )

        except Exception as e:
            raise Exception(f"Erro ao recuperar pagamento MercadoPago: {str(e)}") from e

    async def create_pix_payment(
        self,
        amount: float,
        description: str,
        payer_email: str,
        payer_cpf: Optional[str] = None,
        payer_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Cria um pagamento PIX.

        Args:
            amount: Valor em reais (ex: 100.00)
            description: Descrição do pagamento
            payer_email: Email do pagador
            payer_cpf: CPF do pagador (opcional)
            payer_name: Nome do pagador (opcional)
            metadata: Dados adicionais

        Returns:
            Dicionário com dados do pagamento PIX (inclui QR Code)

        Raises:
            Exception: Em caso de erro na API do MercadoPago
        """
        try:
            payment_data = {
                "transaction_amount": amount,
                "description": description,
                "payment_method_id": "pix",
                "payer": {"email": payer_email},
                "metadata": metadata or {},
            }

            # Adicionar CPF e nome se fornecidos
            if payer_cpf:
                payment_data["payer"]["identification"] = {
                    "type": "CPF",
                    "number": payer_cpf,
                }

            if payer_name:
                payment_data["payer"]["first_name"] = payer_name

            payment = self.sdk.payment().create(payment_data)

            if payment["status"] == 200 or payment["status"] == 201:
                response = payment["response"]
                return {
                    "id": response["id"],
                    "status": response["status"],
                    "status_detail": response.get("status_detail"),
                    "transaction_amount": response["transaction_amount"],
                    "qr_code": response.get("point_of_interaction", {})
                    .get("transaction_data", {})
                    .get("qr_code"),
                    "qr_code_base64": response.get("point_of_interaction", {})
                    .get("transaction_data", {})
                    .get("qr_code_base64"),
                    "ticket_url": response.get("point_of_interaction", {})
                    .get("transaction_data", {})
                    .get("ticket_url"),
                    "external_resource_url": response.get("external_resource_url"),
                    "date_created": response.get("date_created"),
                }
            else:
                raise Exception(
                    f"Erro ao criar pagamento PIX: {payment.get('response', {}).get('message', 'Erro desconhecido')}"
                )

        except Exception as e:
            raise Exception(f"Erro ao criar pagamento PIX: {str(e)}") from e

    async def create_card_payment(
        self,
        amount: float,
        token: str,
        description: str,
        installments: int = 1,
        payer_email: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Cria um pagamento com cartão de crédito.

        Args:
            amount: Valor em reais
            token: Token do cartão (gerado pelo frontend)
            description: Descrição do pagamento
            installments: Número de parcelas
            payer_email: Email do pagador
            metadata: Dados adicionais

        Returns:
            Dicionário com dados do pagamento

        Raises:
            Exception: Em caso de erro na API do MercadoPago
        """
        try:
            payment_data = {
                "transaction_amount": amount,
                "token": token,
                "description": description,
                "installments": installments,
                "payment_method_id": "visa",  # Será determinado automaticamente pelo token
                "payer": {"email": payer_email},
                "metadata": metadata or {},
            }

            payment = self.sdk.payment().create(payment_data)

            if payment["status"] == 200 or payment["status"] == 201:
                response = payment["response"]
                return {
                    "id": response["id"],
                    "status": response["status"],
                    "status_detail": response.get("status_detail"),
                    "transaction_amount": response["transaction_amount"],
                    "installments": response.get("installments"),
                    "payment_method_id": response.get("payment_method_id"),
                    "date_created": response.get("date_created"),
                    "date_approved": response.get("date_approved"),
                }
            else:
                raise Exception(
                    f"Erro ao criar pagamento com cartão: {payment.get('response', {}).get('message', 'Erro desconhecido')}"
                )

        except Exception as e:
            raise Exception(
                f"Erro ao criar pagamento com cartão: {str(e)}"
            ) from e

    async def handle_webhook(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Processa webhook do MercadoPago.

        Args:
            payload: Corpo da requisição (JSON)

        Returns:
            Dados do pagamento se for evento de pagamento, None caso contrário

        Raises:
            Exception: Em caso de erro ao processar webhook
        """
        try:
            # MercadoPago envia diferentes tipos de notificações
            action = payload.get("action")
            topic = payload.get("topic") or payload.get("type")

            # Processar notificação de pagamento
            if topic == "payment" or action == "payment.created":
                payment_id = payload.get("data", {}).get("id")

                if payment_id:
                    # Buscar informações completas do pagamento
                    return await self.get_payment(str(payment_id))

            return None

        except Exception as e:
            raise Exception(f"Erro ao processar webhook MercadoPago: {str(e)}") from e

    async def cancel_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Cancela um pagamento.

        Args:
            payment_id: ID do pagamento

        Returns:
            Dados do pagamento cancelado

        Raises:
            Exception: Em caso de erro na API do MercadoPago
        """
        try:
            # MercadoPago não tem endpoint direto para cancelamento
            # Usamos refund para pagamentos aprovados
            refund = self.sdk.refund().create(payment_id)

            if refund["status"] == 200 or refund["status"] == 201:
                response = refund["response"]
                return {
                    "id": response["id"],
                    "payment_id": response["payment_id"],
                    "status": response["status"],
                    "amount": response.get("amount"),
                    "date_created": response.get("date_created"),
                }
            else:
                raise Exception(
                    f"Erro ao cancelar pagamento: {refund.get('response', {}).get('message', 'Erro desconhecido')}"
                )

        except Exception as e:
            raise Exception(f"Erro ao cancelar pagamento: {str(e)}") from e

    async def create_refund(
        self, payment_id: str, amount: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Cria um reembolso para um pagamento.

        Args:
            payment_id: ID do pagamento
            amount: Valor a reembolsar (None = reembolso total)

        Returns:
            Dados do reembolso criado

        Raises:
            Exception: Em caso de erro na API do MercadoPago
        """
        try:
            refund_data = {"payment_id": payment_id}

            if amount:
                refund_data["amount"] = amount

            refund = self.sdk.refund().create(payment_id, refund_data)

            if refund["status"] == 200 or refund["status"] == 201:
                response = refund["response"]
                return {
                    "id": response["id"],
                    "payment_id": response["payment_id"],
                    "status": response["status"],
                    "amount": response.get("amount"),
                    "source_id": response.get("source_id"),
                    "date_created": response.get("date_created"),
                }
            else:
                raise Exception(
                    f"Erro ao criar reembolso: {refund.get('response', {}).get('message', 'Erro desconhecido')}"
                )

        except Exception as e:
            raise Exception(f"Erro ao criar reembolso: {str(e)}") from e
