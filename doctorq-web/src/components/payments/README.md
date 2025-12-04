# Payment Components

Componentes React para integração com gateways de pagamento (Stripe e MercadoPago).

## 📦 Componentes Disponíveis

### 1. StripeCheckout

Componente para checkout com cartão via Stripe.

**Props:**
```typescript
interface StripeCheckoutProps {
  idEmpresa: string;       // ID da empresa (obrigatório)
  idUser?: string;         // ID do usuário (opcional)
  amount: number;          // Valor em centavos (ex: 10000 = R$ 100)
  currency?: string;       // Moeda (padrão: "brl")
  description?: string;    // Descrição do pagamento
  metadata?: Record<string, any>;  // Metadados adicionais
  onSuccess?: (url: string) => void;  // Callback de sucesso
  onError?: (error: string) => void;  // Callback de erro
}
```

**Exemplo de uso:**
```tsx
import { StripeCheckout } from "@/components/payments";

<StripeCheckout
  idEmpresa="04a4e71e-aed4-491b-b3f3-73694f470250"
  idUser="user-uuid"
  amount={10000} // R$ 100,00
  currency="brl"
  description="Consulta Dermatologia"
  metadata={{ agendamento_id: "123" }}
  onSuccess={(url) => console.log("Checkout URL:", url)}
  onError={(error) => console.error("Erro:", error)}
/>
```

---

### 2. MercadoPagoCheckout

Componente para checkout com PIX via MercadoPago.

**Props:**
```typescript
interface MercadoPagoCheckoutProps {
  amount: number;          // Valor em reais (ex: 100.00)
  description: string;     // Descrição do pagamento
  metadata?: Record<string, any>;  // Metadados adicionais
  onSuccess?: (data: any) => void;  // Callback de sucesso
  onError?: (error: string) => void;  // Callback de erro
}
```

**Exemplo de uso:**
```tsx
import { MercadoPagoCheckout } from "@/components/payments";

<MercadoPagoCheckout
  amount={100.00}
  description="Consulta Dermatologia - PIX"
  metadata={{ agendamento_id: "123" }}
  onSuccess={(data) => console.log("PIX gerado:", data)}
  onError={(error) => console.error("Erro:", error)}
/>
```

---

### 3. PixPayment

Componente para exibir QR Code PIX e código copia e cola.

**Props:**
```typescript
interface PixPaymentProps {
  qrCode: string;          // Código PIX copia e cola
  qrCodeBase64?: string;   // Imagem QR Code em base64
  amount: number;          // Valor em reais
  paymentId: string;       // ID do pagamento
  ticketUrl?: string;      // URL do comprovante
}
```

**Exemplo de uso:**
```tsx
import { PixPayment } from "@/components/payments";

<PixPayment
  qrCode="00020126580014BR.GOV.BCB.PIX..."
  qrCodeBase64="iVBORw0KGgoAAAANS..."
  amount={100.00}
  paymentId="payment-uuid"
  ticketUrl="https://www.mercadopago.com.br/..."
/>
```

---

## 🔧 Hook `usePayment`

Hook customizado para integração com a API de pagamentos.

**Métodos disponíveis:**
```typescript
const {
  // Estado
  loading,           // boolean - Indica se há operação em andamento
  error,             // string | null - Mensagem de erro

  // Métodos
  createStripeCheckout,     // Criar sessão Stripe
  createMercadoPagoPix,     // Criar pagamento PIX
  getPaymentStatus,         // Buscar status do pagamento
  listPayments,             // Listar pagamentos com filtros
  redirectToCheckout,       // Redirecionar para URL de checkout
} = usePayment();
```

**Exemplo:**
```tsx
import { usePayment } from "@/hooks/usePayment";

function MyComponent() {
  const { createStripeCheckout, loading } = usePayment();

  const handlePayment = async () => {
    const result = await createStripeCheckout({
      id_empresa: "empresa-uuid",
      amount: 10000,
      currency: "brl",
      success_url: "https://meusite.com/sucesso",
      cancel_url: "https://meusite.com/cancelado",
    });

    if (result) {
      console.log("Checkout criado:", result.data);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? "Processando..." : "Pagar"}
    </button>
  );
}
```

---

## 📄 Páginas de Confirmação

### Página de Sucesso
**URL:** `/pagamento/sucesso`

Exibe detalhes do pagamento confirmado. Aceita parâmetros via query string:
- `payment_id` - ID do pagamento
- `session_id` - ID da sessão (Stripe)

### Página de Cancelamento
**URL:** `/pagamento/cancelado`

Exibe mensagem de pagamento cancelado com opções de ação.

---

## 🔐 Configuração

### Variáveis de Ambiente

Adicione no arquivo `.env.local`:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX

# Stripe (opcional - para mostrar logo)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# MercadoPago (opcional - para mostrar logo)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...
```

---

## 🚀 Fluxo de Integração

### Stripe (Cartão de Crédito)

1. Usuário preenche e-mail
2. Clica em "Pagar"
3. Sistema cria sessão no Stripe via API
4. Pagamento é salvo no banco com status `pending`
5. Usuário é redirecionado para página do Stripe
6. Stripe processa pagamento
7. Webhook atualiza status para `succeeded` no banco
8. Usuário é redirecionado para `/pagamento/sucesso`

### MercadoPago (PIX)

1. Usuário preenche nome, CPF e e-mail
2. Clica em "Pagar com PIX"
3. Sistema cria pagamento PIX via API
4. Pagamento é salvo no banco com status `pending`
5. QR Code é exibido na tela
6. Usuário escaneia QR Code no app do banco
7. Webhook recebe notificação de pagamento
8. Status é atualizado para `succeeded` no banco
9. Usuário vê confirmação na tela

---

## 🎨 Estilos

Os componentes usam:
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **Sonner** para toasts/notificações

---

## 📝 Webhooks

Os webhooks estão configurados no backend para persistir eventos no banco:

**Stripe:**
- `checkout.session.completed` - Checkout finalizado
- `payment_intent.succeeded` - Pagamento confirmado
- `payment_intent.payment_failed` - Pagamento falhou

**MercadoPago:**
- `payment.approved` - Pagamento aprovado
- `payment.rejected` - Pagamento rejeitado
- `payment.pending` - Pagamento pendente

Todos os eventos são salvos na tabela `tb_transacoes_pagamento` para auditoria.

---

## 🧪 Testando

### Modo Sandbox

**Stripe (Test Mode):**
- Cartão de teste: `4242 4242 4242 4242`
- CVC: Qualquer 3 dígitos
- Validade: Qualquer data futura

**MercadoPago (Sandbox):**
- Use credenciais de teste do painel do MercadoPago
- PIX é simulado automaticamente em sandbox

---

## 📚 Documentação Adicional

- [Documentação Stripe](https://stripe.com/docs)
- [Documentação MercadoPago](https://www.mercadopago.com.br/developers)
- [Backend API Docs](http://localhost:8080/docs)

---

## 🆘 Suporte

Em caso de problemas:

1. Verifique as variáveis de ambiente
2. Confirme que o backend está rodando
3. Valide as credenciais dos gateways
4. Consulte os logs do backend para detalhes de erros

---

**Última atualização:** 02/11/2025
