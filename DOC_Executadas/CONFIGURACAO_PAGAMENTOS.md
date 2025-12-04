# 💳 Configuração de Pagamentos - Stripe & MercadoPago

**Data**: 02 de Novembro de 2025
**Objetivo**: Configurar gateways de pagamento em modo sandbox para MVP
**Status**: 🚧 Em andamento

---

## 📋 OVERVIEW

O DoctorQ suporta 2 gateways de pagamento:
1. **Stripe** - Internacional (cartões de crédito/débito)
2. **MercadoPago** - Brasil (PIX, boleto, cartões)

---

## 🔧 STRIPE - Configuração Sandbox

### **1. Criar Conta de Teste**

1. Acesse: https://dashboard.stripe.com/register
2. Crie uma conta Stripe (gratuita)
3. Ative o **Test Mode** (toggle no canto superior direito)

### **2. Obter Credenciais de Teste**

No dashboard Stripe (Test Mode):
1. Acesse **Developers** → **API keys**
2. Copie:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### **3. Configurar Variáveis de Ambiente**

**Backend** (`.env`):
```bash
# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # Configurado depois
STRIPE_MODE=test
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### **4. Cartões de Teste Stripe**

Cartões que sempre funcionam:
- **Sucesso**: `4242 4242 4242 4242`
- **Falha (cartão recusado)**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Demais dados:
- **Data de validade**: Qualquer data futura (ex: 12/34)
- **CVC**: Qualquer 3 dígitos (ex: 123)
- **CEP**: Qualquer (ex: 12345)

### **5. Instalar SDK Stripe**

```bash
cd estetiQ-api
uv pip install stripe

cd ../estetiQ-web
yarn add @stripe/stripe-js @stripe/react-stripe-js
```

### **6. Implementação Backend (FastAPI)**

Criar serviço de pagamento Stripe:

**`src/services/stripe_service.py`**:
```python
"""Serviço de integração com Stripe"""
import stripe
from src.config.settings import get_settings

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Serviço para operações com Stripe"""

    @staticmethod
    async def create_checkout_session(
        amount: int,
        currency: str = "brl",
        success_url: str = "",
        cancel_url: str = "",
        metadata: dict = None
    ):
        """Cria sessão de checkout Stripe"""
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'product_data': {'name': 'Pagamento DoctorQ'},
                    'unit_amount': amount,  # em centavos
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata or {}
        )
        return session

    @staticmethod
    async def retrieve_session(session_id: str):
        """Recupera sessão de checkout"""
        return stripe.checkout.Session.retrieve(session_id)

    @staticmethod
    async def create_payment_intent(amount: int, currency: str = "brl", metadata: dict = None):
        """Cria Payment Intent"""
        return stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            metadata=metadata or {}
        )

    @staticmethod
    async def handle_webhook(payload: bytes, sig_header: str):
        """Processa webhook do Stripe"""
        webhook_secret = settings.stripe_webhook_secret
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")
```

### **7. Implementação Frontend (Next.js)**

**`src/lib/stripe.ts`**:
```typescript
import { loadStripe } from '@stripe/stripe-js';

export const getStripePromise = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error('Stripe publishable key not found');
  }

  return loadStripe(key);
};
```

**Componente de Checkout**:
```typescript
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe';

export function CheckoutPage() {
  const stripePromise = getStripePromise();

  return (
    <Elements stripe={stripePromise}>
      {/* Seu formulário de pagamento aqui */}
    </Elements>
  );
}
```

### **8. Webhooks Stripe**

No dashboard Stripe (Test Mode):
1. Acesse **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/api/webhooks/stripe`
4. Eventos a monitorar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copie o **Signing secret** (whsec_...)

---

## 🇧🇷 MERCADOPAGO - Configuração Sandbox

### **1. Criar Conta de Teste**

1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login/crie uma conta MercadoPago
3. Acesse **Suas integrações** → **Criar aplicação**
4. Nome: "DoctorQ Test"
5. Ative **Modo Sandbox**

### **2. Obter Credenciais de Teste**

No dashboard MercadoPago (Sandbox):
1. Acesse **Credenciais**
2. Copie:
   - **Public Key** (APP_USR-...)
   - **Access Token** (APP_USR-...)

### **3. Configurar Variáveis de Ambiente**

**Backend** (`.env`):
```bash
# MercadoPago Test Mode
MERCADOPAGO_ACCESS_TOKEN=APP_USR_YOUR_ACCESS_TOKEN_HERE
MERCADOPAGO_PUBLIC_KEY=APP_USR_YOUR_PUBLIC_KEY_HERE
MERCADOPAGO_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
MERCADOPAGO_MODE=sandbox
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR_YOUR_PUBLIC_KEY_HERE
```

### **4. Cartões de Teste MercadoPago**

| Bandeira | Número | CVV | Status |
|----------|--------|-----|--------|
| **Visa** | 4235 6477 2802 5682 | 123 | Aprovado |
| **Mastercard** | 5031 7557 3453 0604 | 123 | Aprovado |
| **Recusado** | 5031 4332 1540 6351 | 123 | Recusado |

Demais dados:
- **Nome**: APRO (aprovado) / OTHE (recusado)
- **Validade**: Qualquer data futura
- **CPF**: 123.456.789-00 (teste)

### **5. Instalar SDK MercadoPago**

```bash
cd estetiQ-api
uv pip install mercadopago

cd ../estetiQ-web
yarn add @mercadopago/sdk-react @mercadopago/sdk-js
```

### **6. Implementação Backend**

**`src/services/mercadopago_service.py`**:
```python
"""Serviço de integração com MercadoPago"""
import mercadopago
from src.config.settings import get_settings

settings = get_settings()


class MercadoPagoService:
    """Serviço para operações com MercadoPago"""

    def __init__(self):
        self.sdk = mercadopago.SDK(settings.mercadopago_access_token)

    async def create_preference(
        self,
        title: str,
        amount: float,
        quantity: int = 1,
        success_url: str = "",
        failure_url: str = "",
        pending_url: str = "",
        metadata: dict = None
    ):
        """Cria preferência de pagamento"""
        preference_data = {
            "items": [{
                "title": title,
                "quantity": quantity,
                "unit_price": amount
            }],
            "back_urls": {
                "success": success_url,
                "failure": failure_url,
                "pending": pending_url
            },
            "auto_return": "approved",
            "metadata": metadata or {}
        }

        preference = self.sdk.preference().create(preference_data)
        return preference["response"]

    async def get_payment(self, payment_id: str):
        """Recupera informações de pagamento"""
        payment = self.sdk.payment().get(payment_id)
        return payment["response"]

    async def create_pix_payment(self, amount: float, description: str, metadata: dict = None):
        """Cria pagamento PIX"""
        payment_data = {
            "transaction_amount": amount,
            "description": description,
            "payment_method_id": "pix",
            "payer": {
                "email": "test@test.com"
            },
            "metadata": metadata or {}
        }

        payment = self.sdk.payment().create(payment_data)
        return payment["response"]

    async def handle_webhook(self, payload: dict):
        """Processa webhook do MercadoPago"""
        # Validar webhook e processar evento
        if payload.get("action") == "payment.created":
            payment_id = payload.get("data", {}).get("id")
            if payment_id:
                return await self.get_payment(payment_id)
        return None
```

### **7. Implementação Frontend**

**`src/lib/mercadopago.ts`**:
```typescript
export const loadMercadoPagoSDK = async () => {
  const script = document.createElement('script');
  script.src = 'https://sdk.mercadopago.com/js/v2';
  document.body.appendChild(script);

  return new Promise((resolve) => {
    script.onload = () => {
      const mp = new (window as any).MercadoPago(
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      );
      resolve(mp);
    };
  });
};
```

### **8. Webhooks MercadoPago**

No dashboard MercadoPago:
1. Acesse **Webhooks**
2. Adicione URL: `https://seu-dominio.com/api/webhooks/mercadopago`
3. Eventos:
   - `payment`
   - `plan`
   - `subscription`

---

## 🧪 TESTES RECOMENDADOS

### **Stripe**
1. ✅ Criar sessão de checkout
2. ✅ Processar pagamento com cartão de teste (4242...)
3. ✅ Simular falha (4000 0000 0000 0002)
4. ✅ Testar webhook local com Stripe CLI
5. ✅ Validar transação no dashboard

### **MercadoPago**
1. ✅ Criar preferência de pagamento
2. ✅ Processar pagamento com cartão (APRO)
3. ✅ Gerar QR Code PIX
4. ✅ Testar webhook local
5. ✅ Validar transação no dashboard

---

## 📚 RECURSOS

### Stripe
- Docs: https://stripe.com/docs
- Test Mode: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks
- CLI: https://stripe.com/docs/stripe-cli

### MercadoPago
- Docs: https://www.mercadopago.com.br/developers/pt/docs
- Sandbox: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test
- Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

## ⚠️ IMPORTANTE - PRODUÇÃO

Quando migrar para produção:

1. **Stripe**:
   - Desative Test Mode
   - Use credenciais de produção (pk_live_, sk_live_)
   - Configure webhook com URL de produção
   - Ative monitoramento de fraude

2. **MercadoPago**:
   - Desative Modo Sandbox
   - Use credenciais de produção
   - Configure webhook com URL de produção
   - Ative validações de segurança

3. **Segurança**:
   - NUNCA commite credenciais no git
   - Use secrets manager (AWS Secrets, Google Secret Manager)
   - Valide sempre assinaturas de webhook
   - Log todas as transações

---

**Status**: ⏳ Documentação completa - Aguardando implementação
**Próximo**: Implementar serviços e rotas de pagamento
**Criado por**: Claude Code
**Data**: 02/11/2025
