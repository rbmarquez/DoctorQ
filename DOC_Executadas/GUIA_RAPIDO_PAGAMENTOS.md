# 🚀 Guia Rápido - Sistema de Pagamentos DoctorQ

**Versão:** 1.0.0
**Data:** 02/11/2025

---

## 📋 Pré-requisitos

- ✅ Backend rodando em `http://localhost:8080`
- ✅ Frontend rodando em `http://localhost:3000`
- ✅ PostgreSQL com tabelas criadas
- ✅ Variáveis de ambiente configuradas

---

## ⚡ Start Rápido (5 minutos)

### **1. Configurar Variáveis de Ambiente**

**Backend** (`estetiQ-api/.env`):
```bash
# Stripe Test
STRIPE_SECRET_KEY=sk_test_51QJA0oJKbHq...
STRIPE_MODE=test

# MercadoPago Test
MERCADOPAGO_ACCESS_TOKEN=TEST-123456...
MERCADOPAGO_MODE=sandbox
```

**Frontend** (`estetiQ-web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

### **2. Iniciar Servidores**

**Terminal 1 - Backend:**
```bash
cd DoctorQ/estetiQ-api
make dev
```

**Terminal 2 - Frontend:**
```bash
cd DoctorQ/estetiQ-web
yarn dev
```

### **3. Testar API**

```bash
# Health check
curl http://localhost:8080/pagamentos/health/

# Resposta esperada:
# {
#   "stripe": {"configured": true, "mode": "test"},
#   "mercadopago": {"configured": true, "mode": "sandbox"}
# }
```

---

## 💳 Exemplo 1: Checkout Stripe (Cartão)

### **Código do Componente:**

```tsx
import { StripeCheckout } from "@/components/payments";

export default function MyCheckoutPage() {
  return (
    <StripeCheckout
      idEmpresa="04a4e71e-aed4-491b-b3f3-73694f470250"
      amount={10000} // R$ 100,00 (em centavos)
      currency="brl"
      description="Consulta Dermatologia"
      onSuccess={(url) => {
        console.log("Redirecionando para:", url);
      }}
      onError={(error) => {
        console.error("Erro:", error);
      }}
    />
  );
}
```

### **Testar:**

1. Abra `http://localhost:3000/sua-pagina`
2. Digite um e-mail
3. Clique em "Pagar"
4. Use cartão de teste: `4242 4242 4242 4242`
5. CVC: `123`, Validade: `12/25`
6. Será redirecionado para página de sucesso

---

## 💸 Exemplo 2: PIX MercadoPago

### **Código do Componente:**

```tsx
import { MercadoPagoCheckout } from "@/components/payments";

export default function MyPixPage() {
  return (
    <MercadoPagoCheckout
      amount={100.00} // R$ 100,00 (em reais)
      description="Consulta Dermatologia - PIX"
      onSuccess={(data) => {
        console.log("PIX gerado:", data);
        console.log("QR Code:", data.qr_code);
      }}
      onError={(error) => {
        console.error("Erro:", error);
      }}
    />
  );
}
```

### **Testar:**

1. Abra `http://localhost:3000/sua-pagina`
2. Preencha nome, CPF e e-mail
3. Clique em "Pagar com PIX"
4. QR Code será exibido automaticamente
5. Em sandbox, pagamento é aprovado automaticamente

---

## 🔍 Verificar Pagamento no Banco

```sql
-- Ver todos os pagamentos
SELECT
    id_pagamento,
    ds_gateway,
    ds_tipo_pagamento,
    vl_amount,
    ds_status,
    ds_payer_email,
    dt_criacao
FROM tb_pagamentos
ORDER BY dt_criacao DESC
LIMIT 10;

-- Ver histórico de transações
SELECT
    t.id_transacao,
    t.ds_evento_tipo,
    t.ds_evento_origem,
    t.ds_status_anterior,
    t.ds_status_novo,
    t.ds_mensagem,
    t.dt_criacao
FROM tb_transacoes_pagamento t
JOIN tb_pagamentos p ON t.id_pagamento = p.id_pagamento
ORDER BY t.dt_criacao DESC
LIMIT 10;
```

---

## 🎯 Exemplo 3: Seletor de Método

### **Código Completo:**

```tsx
"use client";

import { useState } from "react";
import { StripeCheckout, MercadoPagoCheckout } from "@/components/payments";
import { CreditCard, QrCode } from "lucide-react";

export default function CheckoutPage() {
  const [method, setMethod] = useState<"stripe" | "mercadopago">("stripe");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Finalizar Pagamento</h1>

      {/* Seletor de Método */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setMethod("stripe")}
          className={`flex-1 p-6 rounded-2xl border-2 transition-all ${
            method === "stripe"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-200 hover:border-purple-300"
          }`}
        >
          <CreditCard className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">Cartão de Crédito</p>
          <p className="text-sm text-gray-500">Via Stripe</p>
        </button>

        <button
          onClick={() => setMethod("mercadopago")}
          className={`flex-1 p-6 rounded-2xl border-2 transition-all ${
            method === "mercadopago"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <QrCode className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">PIX</p>
          <p className="text-sm text-gray-500">Via MercadoPago</p>
        </button>
      </div>

      {/* Componente de Pagamento */}
      <div className="flex justify-center">
        {method === "stripe" ? (
          <StripeCheckout
            idEmpresa="04a4e71e-aed4-491b-b3f3-73694f470250"
            amount={10000}
            currency="brl"
            description="Consulta Dermatologia"
          />
        ) : (
          <MercadoPagoCheckout
            amount={100.00}
            description="Consulta Dermatologia - PIX"
          />
        )}
      </div>
    </div>
  );
}
```

---

## 🔧 Usar o Hook Diretamente

### **Exemplo sem Componente:**

```tsx
"use client";

import { usePayment } from "@/hooks/usePayment";
import { useState } from "react";

export default function CustomCheckout() {
  const { createStripeCheckout, loading } = usePayment();
  const [email, setEmail] = useState("");

  const handlePayment = async () => {
    const result = await createStripeCheckout({
      id_empresa: "04a4e71e-aed4-491b-b3f3-73694f470250",
      amount: 10000, // R$ 100,00
      currency: "brl",
      success_url: `${window.location.origin}/pagamento/sucesso`,
      cancel_url: `${window.location.origin}/pagamento/cancelado`,
      payer_email: email,
    });

    if (result) {
      // Redirecionar para Stripe
      window.location.href = result.data.url;
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
      />
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processando..." : "Pagar R$ 100,00"}
      </button>
    </div>
  );
}
```

---

## 🧪 Testar Webhooks Localmente

### **Stripe CLI:**

```bash
# 1. Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Forward webhooks
stripe listen --forward-to http://localhost:8080/pagamentos/stripe/webhook/

# 4. Testar evento (em outro terminal)
stripe trigger checkout.session.completed
```

### **MercadoPago (ngrok):**

```bash
# 1. Instalar ngrok
brew install ngrok

# 2. Expor porta 8080
ngrok http 8080

# 3. Copiar URL pública (ex: https://abc123.ngrok.io)

# 4. Configurar no painel MercadoPago:
# URL: https://abc123.ngrok.io/pagamentos/mercadopago/webhook/
```

---

## 📊 Monitorar Pagamentos

### **API Endpoints:**

```bash
# Listar pagamentos de uma empresa
curl -X GET \
  'http://localhost:8080/pagamentos/?id_empresa=04a4e71e-aed4-491b-b3f3-73694f470250&page=1&size=10' \
  -H 'Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX'

# Buscar pagamento específico
curl -X GET \
  'http://localhost:8080/pagamentos/{id_pagamento}/' \
  -H 'Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX'

# Ver histórico de transações
curl -X GET \
  'http://localhost:8080/pagamentos/{id_pagamento}/transacoes/' \
  -H 'Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX'
```

---

## ⚠️ Troubleshooting

### **Erro: "Gateway not configured"**

**Solução:**
- Verifique se `.env` tem as keys corretas
- Restart do backend: `make dev`
- Teste: `curl http://localhost:8080/pagamentos/health/`

### **Erro: 401 Unauthorized**

**Solução:**
- Verifique se `Authorization: Bearer` está no header
- Confira se API key está correta em `.env.local`

### **Erro: "Database connection failed"**

**Solução:**
- Verifique se PostgreSQL está rodando
- Teste conexão: `psql -h 10.11.2.81 -U postgres -d doctorq`
- Valide `DATABASE_URL` em `.env`

### **Webhook não está funcionando**

**Solução:**
- Verifique se URL é pública (não localhost)
- Confirme que webhook secret está correto
- Veja logs: `tail -f logs/app.log`

---

## 📞 Suporte

### **Documentação:**
- Sumário Executivo: `SUMARIO_EXECUTIVO_PAGAMENTOS.md`
- Fase 1: `CONFIGURACAO_PAGAMENTOS.md`
- Fase 2: `IMPLEMENTACAO_PAGAMENTOS_FASE2_BANCO_DADOS.md`
- Fase 3: `IMPLEMENTACAO_PAGAMENTOS_FASE3_FRONTEND_E_WEBHOOKS.md`

### **API Docs:**
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

### **Links Úteis:**
- [Stripe Testing](https://stripe.com/docs/testing)
- [MercadoPago Sandbox](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/make-test-purchase)

---

## 🎯 Próximos Passos

1. ✅ **Testar em Desenvolvimento**
   - Criar checkout de teste
   - Processar pagamento PIX
   - Verificar webhooks

2. ✅ **Configurar Produção**
   - Obter keys de produção (Stripe/MercadoPago)
   - Configurar URLs de webhook
   - Deploy de backend e frontend

3. ✅ **Integrar em Páginas**
   - Adicionar botões "Pagar" nas páginas de agendamento
   - Importar componentes onde necessário
   - Testar fluxo completo

4. ✅ **Monitorar**
   - Dashboard de pagamentos
   - Alertas de erro
   - Métricas de conversão

---

**🚀 Seu sistema de pagamentos está pronto para uso!**

**Última atualização:** 02/11/2025

🤖 Generated with [Claude Code](https://claude.com/claude-code)
