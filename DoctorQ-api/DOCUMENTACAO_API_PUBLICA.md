# Documentação da API Pública - InovaIA Platform

> Versão 1.0.0 | Atualizado em: Janeiro 2025

## 📚 Índice

1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Rate Limits e Quotas](#rate-limits-e-quotas)
4. [Estrutura de Resposta](#estrutura-de-resposta)
5. [Endpoints Principais](#endpoints-principais)
   - [Agentes](#agentes)
   - [Conversas e Mensagens](#conversas-e-mensagens)
   - [Templates e Marketplace](#templates-e-marketplace)
   - [Analytics](#analytics)
   - [Billing](#billing)
   - [Onboarding](#onboarding)
6. [Webhooks](#webhooks)
7. [SDKs e Bibliotecas](#sdks-e-bibliotecas)
8. [Exemplos de Integração](#exemplos-de-integração)
9. [Códigos de Erro](#códigos-de-erro)
10. [Changelog](#changelog)

---

## Introdução

A **InovaIA Platform API** é uma API RESTful que permite integrar agentes de IA inteligentes em suas aplicações. Com ela você pode:

- ✅ Criar e gerenciar agentes de IA customizados
- ✅ Implementar conversas inteligentes com streaming
- ✅ Acessar marketplace de templates prontos
- ✅ Monitorar métricas e analytics
- ✅ Gerenciar billing e assinaturas
- ✅ Implementar onboarding estruturado

### Base URL

```
Produção:  https://api.inovaia.com
Staging:   https://staging.inovaia.com
Dev:       http://localhost:8080
```

### Formato de Dados

- **Content-Type**: `application/json`
- **Encoding**: UTF-8
- **Date Format**: ISO 8601 (`2025-01-21T10:30:00Z`)

---

## Autenticação

### API Key Authentication

Todos os endpoints (exceto `/health` e `/ready`) requerem autenticação via API Key no header:

```http
Authorization: Bearer YOUR_API_KEY
```

### Obtendo uma API Key

1. **Via Dashboard**: Acesse Settings → API Keys → Generate New Key
2. **Via API** (requer login):

```bash
curl -X POST https://api.inovaia.com/apikeys \
  -H "Content-Type: application/json" \
  -d '{
    "nm_apikey": "Production API Key",
    "ds_apikey": "Chave para ambiente de produção"
  }'
```

**Resposta:**
```json
{
  "id_apikey": "550e8400-e29b-41d4-a716-446655440000",
  "nm_apikey": "Production API Key",
  "token": "vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX",
  "dt_criacao": "2025-01-21T10:30:00Z"
}
```

⚠️ **IMPORTANTE**: Guarde seu token de forma segura. Ele não será mostrado novamente.

### Segurança

- ✅ Use HTTPS em produção
- ✅ Nunca exponha API keys no frontend
- ✅ Rotacione keys regularmente
- ✅ Use diferentes keys para dev/staging/prod

---

## Rate Limits e Quotas

### Rate Limiting

| Plan | Requests/min | Requests/hora | Requests/dia |
|------|-------------|---------------|--------------|
| Free | 10 | 100 | 1,000 |
| Starter | 60 | 1,000 | 10,000 |
| Professional | 300 | 10,000 | 100,000 |
| Enterprise | Ilimitado | Ilimitado | Ilimitado |

### Headers de Rate Limit

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642771200
```

### Quotas de Uso

Cada plano possui quotas mensais:

```json
{
  "max_agents": 20,
  "max_messages_per_month": 10000,
  "max_tokens_per_month": 2000000,
  "max_document_stores": 10,
  "max_storage_gb": 50
}
```

### Erro de Quota Excedida

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Quota Exceeded",
  "quota_info": {
    "metric": "messages",
    "current_usage": 10000,
    "quota_limit": 10000,
    "reset_date": "2025-02-01T00:00:00Z"
  }
}
```

---

## Estrutura de Resposta

### Resposta de Sucesso

```json
{
  "id": "uuid",
  "nome": "string",
  "data": {},
  "timestamp": "2025-01-21T10:30:00Z"
}
```

### Resposta de Erro

```json
{
  "detail": "Mensagem de erro",
  "type": "validation_error | internal_server_error",
  "errors": [],
  "path": "/api/endpoint"
}
```

### Paginação

Endpoints que retornam listas usam paginação:

```http
GET /agentes?page=1&size=20
```

**Resposta:**
```json
{
  "items": [...],
  "meta": {
    "totalItems": 150,
    "itemsPerPage": 20,
    "totalPages": 8,
    "currentPage": 1
  }
}
```

---

## Endpoints Principais

### Agentes

#### Listar Agentes

```http
GET /agentes?page=1&size=20
Authorization: Bearer YOUR_API_KEY
```

**Resposta:**
```json
{
  "items": [
    {
      "id_agente": "uuid",
      "nm_agente": "Assistente de Vendas",
      "ds_agente": "Agente especializado em vendas B2B",
      "nm_tipo": "chatbot",
      "nm_modelo": "gpt-4",
      "nr_temperatura": 0.7,
      "dt_criacao": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "totalItems": 5,
    "itemsPerPage": 20,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

#### Criar Agente

```http
POST /agentes
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "nm_agente": "Assistente de Vendas",
  "ds_agente": "Agente para qualificar leads",
  "nm_tipo": "chatbot",
  "nm_modelo": "gpt-4",
  "nr_temperatura": 0.7,
  "nm_system_prompt": "Você é um assistente de vendas B2B...",
  "bl_ativo": true
}
```

**Resposta:** `201 Created`
```json
{
  "id_agente": "uuid",
  "nm_agente": "Assistente de Vendas",
  "message": "Agente criado com sucesso"
}
```

#### Buscar Agente por ID

```http
GET /agentes/{id_agente}
Authorization: Bearer YOUR_API_KEY
```

#### Atualizar Agente

```http
PUT /agentes/{id_agente}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "nm_agente": "Novo Nome",
  "nr_temperatura": 0.8
}
```

#### Deletar Agente

```http
DELETE /agentes/{id_agente}
Authorization: Bearer YOUR_API_KEY
```

**Resposta:** `204 No Content`

---

### Conversas e Mensagens

#### Criar Conversa

```http
POST /conversas
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "id_agente": "uuid",
  "nm_titulo": "Conversa sobre vendas",
  "ds_metadata": {
    "customer_id": "12345",
    "source": "website"
  }
}
```

**Resposta:**
```json
{
  "id_conversa": "uuid",
  "id_agente": "uuid",
  "nm_titulo": "Conversa sobre vendas",
  "dt_criacao": "2025-01-21T10:30:00Z"
}
```

#### Enviar Mensagem (com Streaming)

```http
POST /conversas/{id_conversa}/chat
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "message": "Olá, preciso de ajuda com vendas B2B",
  "stream": true
}
```

**Resposta (Server-Sent Events):**
```
Content-Type: text/event-stream

data: {"type": "token", "content": "Olá"}

data: {"type": "token", "content": "!"}

data: {"type": "token", "content": " Como"}

data: {"type": "done", "id_message": "uuid"}
```

#### Listar Mensagens de uma Conversa

```http
GET /conversas/{id_conversa}/messages?page=1&size=50
Authorization: Bearer YOUR_API_KEY
```

**Resposta:**
```json
{
  "items": [
    {
      "id_message": "uuid",
      "id_conversa": "uuid",
      "nm_role": "user",
      "ds_conteudo": "Olá, preciso de ajuda",
      "nr_tokens": 10,
      "dt_criacao": "2025-01-21T10:30:00Z"
    },
    {
      "id_message": "uuid",
      "id_conversa": "uuid",
      "nm_role": "assistant",
      "ds_conteudo": "Olá! Como posso ajudar?",
      "nr_tokens": 15,
      "dt_criacao": "2025-01-21T10:30:05Z"
    }
  ],
  "meta": {...}
}
```

---

### Templates e Marketplace

#### Listar Templates

```http
GET /templates?page=1&size=12&category=sales&search=vendas
Authorization: Bearer YOUR_API_KEY
```

**Resposta:**
```json
{
  "templates": [
    {
      "id_template": "uuid",
      "nm_template": "Assistente de Vendas B2B",
      "ds_template": "Agente especializado em vendas B2B...",
      "nm_category": "sales",
      "nr_install_count": 1250,
      "nr_rating_avg": 4.8,
      "ds_tags": ["vendas", "b2b", "crm"]
    }
  ],
  "total": 50,
  "page": 1,
  "size": 12,
  "total_pages": 5
}
```

#### Instalar Template

```http
POST /templates/install
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "id_template": "uuid",
  "customizations": {
    "company_name": "Minha Empresa",
    "tone": "formal"
  }
}
```

**Resposta:**
```json
{
  "id_installation": "uuid",
  "id_agente": "uuid",
  "message": "Template instalado e agente criado com sucesso"
}
```

#### Avaliar Template

```http
POST /templates/reviews
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "id_template": "uuid",
  "nr_rating": 5,
  "ds_title": "Excelente template!",
  "ds_review": "Muito útil para vendas B2B..."
}
```

---

### Analytics

#### Dashboard Completo

```http
GET /analytics/dashboard?start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer YOUR_API_KEY
```

**Resposta:**
```json
{
  "users": {
    "total_users": 1500,
    "active_users": 850,
    "new_users": 120,
    "churn_rate": 15.5,
    "retention_rate": 84.5
  },
  "conversations": {
    "total_conversations": 5000,
    "active_conversations": 1200,
    "total_messages": 45000,
    "avg_messages_per_conversation": 9.0,
    "engagement_rate": 24.0
  },
  "revenue": {
    "mrr": 15000.00,
    "arr": 180000.00,
    "paid_subscriptions": 150,
    "trial_subscriptions": 30,
    "arpu": 100.00,
    "ltv": 3600000.00
  },
  "usage": {
    "total_api_calls": 50000,
    "total_tokens": 25000000,
    "total_storage_gb": 150.5,
    "avg_tokens_per_call": 500.0,
    "estimated_cost": 50.00
  }
}
```

#### Registrar Evento

```http
POST /analytics/events
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "id_user": "uuid",
  "nm_event_type": "feature_used",
  "ds_event_data": {
    "feature": "rag_search",
    "duration_ms": 450
  }
}
```

---

### Billing

#### Listar Planos

```http
GET /billing/plans
Authorization: Bearer YOUR_API_KEY
```

**Resposta:**
```json
{
  "plans": [
    {
      "id_plan": "uuid",
      "nm_plan": "Professional",
      "nm_tier": "professional",
      "vl_price_monthly": 99.00,
      "vl_price_yearly": 990.00,
      "ds_quotas": {
        "max_agents": 20,
        "max_messages_per_month": 10000,
        "max_tokens_per_month": 2000000
      },
      "nr_trial_days": 14
    }
  ]
}
```

#### Criar Assinatura

```http
POST /billing/subscriptions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "id_plan": "uuid",
  "id_user": "uuid",
  "nm_billing_interval": "monthly",
  "ds_payment_metadata": {
    "stripe_customer_id": "cus_123",
    "payment_method": "card"
  }
}
```

#### Verificar Uso Atual

```http
GET /billing/usage/{user_id}
Authorization: Bearer YOUR_API_KEY
```

**Resposta:**
```json
{
  "user_id": "uuid",
  "plan": "Professional",
  "billing_period": "2025-01",
  "usage": {
    "messages": 5420,
    "tokens": 1250000,
    "api_calls": 8500,
    "storage_gb": 25.5
  },
  "quotas": {
    "max_messages_per_month": 10000,
    "max_tokens_per_month": 2000000,
    "max_api_calls_per_month": 50000,
    "max_storage_gb": 50
  },
  "usage_percentage": {
    "messages": 54.2,
    "tokens": 62.5,
    "api_calls": 17.0,
    "storage_gb": 51.0
  }
}
```

---

### Onboarding

#### Buscar Dashboard de Onboarding

```http
GET /onboarding/dashboard/{user_id}?flow_id=uuid
Authorization: Bearer YOUR_API_KEY
```

**Resposta:**
```json
{
  "flow": {
    "id_flow": "uuid",
    "nm_flow": "Onboarding Básico",
    "ds_steps": [...]
  },
  "progress": {
    "nm_status": "in_progress",
    "nr_progress_percentage": 50,
    "ds_completed_steps": ["account_setup", "first_agent"]
  },
  "current_step": {
    "step_type": "first_conversation",
    "title": "Inicie uma conversa",
    "description": "Teste seu agente",
    "order": 3,
    "required": true,
    "estimated_minutes": 5
  },
  "next_steps": [
    {
      "step_type": "install_template",
      "title": "Explore templates",
      "order": 4
    }
  ],
  "is_completed": false,
  "completion_percentage": 50
}
```

#### Completar Step

```http
POST /onboarding/complete-step/{flow_id}?user_id=uuid
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "step_type": "first_agent",
  "data": {
    "agent_id": "uuid",
    "agent_name": "Meu Primeiro Agente"
  }
}
```

---

## Webhooks

### Configurar Webhook

```http
POST /webhooks
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "url": "https://myapp.com/webhooks/inovaia",
  "events": [
    "conversation.created",
    "message.sent",
    "subscription.updated",
    "quota.exceeded"
  ],
  "secret": "your_webhook_secret"
}
```

### Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `conversation.created` | Nova conversa criada |
| `conversation.deleted` | Conversa deletada |
| `message.sent` | Mensagem enviada |
| `message.received` | Resposta do agente recebida |
| `agent.created` | Novo agente criado |
| `agent.updated` | Agente atualizado |
| `subscription.created` | Nova assinatura |
| `subscription.updated` | Assinatura atualizada |
| `subscription.canceled` | Assinatura cancelada |
| `quota.exceeded` | Quota excedida |

### Payload do Webhook

```json
{
  "id": "evt_123456",
  "type": "conversation.created",
  "created_at": "2025-01-21T10:30:00Z",
  "data": {
    "id_conversa": "uuid",
    "id_agente": "uuid",
    "id_user": "uuid",
    "nm_titulo": "Nova conversa"
  }
}
```

### Verificação de Assinatura

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}
```

---

## SDKs e Bibliotecas

### JavaScript/TypeScript

```bash
npm install @inovaia/sdk
```

```typescript
import { InovaIA } from '@inovaia/sdk';

const client = new InovaIA({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'https://api.inovaia.com'
});

// Criar agente
const agent = await client.agents.create({
  nm_agente: 'Assistente de Vendas',
  nm_tipo: 'chatbot',
  nm_modelo: 'gpt-4'
});

// Iniciar conversa com streaming
const conversation = await client.conversations.create({
  id_agente: agent.id_agente
});

const stream = await client.chat.stream({
  id_conversa: conversation.id_conversa,
  message: 'Olá!'
});

for await (const chunk of stream) {
  console.log(chunk.content);
}
```

### Python

```bash
pip install inovaia-sdk
```

```python
from inovaia import InovaIA

client = InovaIA(api_key="YOUR_API_KEY")

# Criar agente
agent = client.agents.create(
    nm_agente="Assistente de Vendas",
    nm_tipo="chatbot",
    nm_modelo="gpt-4"
)

# Iniciar conversa
conversation = client.conversations.create(
    id_agente=agent.id_agente
)

# Enviar mensagem com streaming
for chunk in client.chat.stream(
    id_conversa=conversation.id_conversa,
    message="Olá!"
):
    print(chunk.content, end="")
```

### cURL

```bash
# Criar agente
curl -X POST https://api.inovaia.com/agentes \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nm_agente": "Assistente de Vendas",
    "nm_tipo": "chatbot",
    "nm_modelo": "gpt-4"
  }'

# Listar conversas
curl https://api.inovaia.com/conversas \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Exemplos de Integração

### Slack Bot

```javascript
const { InovaIA } = require('@inovaia/sdk');
const { App } = require('@slack/bolt');

const inovaia = new InovaIA({ apiKey: process.env.INOVAIA_API_KEY });
const slack = new App({ token: process.env.SLACK_TOKEN });

slack.message(async ({ message, say }) => {
  // Criar ou buscar conversa
  const conversation = await inovaia.conversations.create({
    id_agente: AGENT_ID,
    ds_metadata: { slack_user: message.user }
  });

  // Enviar mensagem e obter resposta
  const stream = await inovaia.chat.stream({
    id_conversa: conversation.id_conversa,
    message: message.text
  });

  let response = '';
  for await (const chunk of stream) {
    response += chunk.content;
  }

  await say(response);
});
```

### Widget de Chat Web

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.inovaia.com/widget.js"></script>
</head>
<body>
  <div id="inovaia-chat"></div>

  <script>
    InovaIA.init({
      apiKey: 'YOUR_API_KEY',
      agentId: 'AGENT_ID',
      container: '#inovaia-chat',
      theme: 'light',
      position: 'bottom-right'
    });
  </script>
</body>
</html>
```

---

## Códigos de Erro

| Código | Mensagem | Descrição |
|--------|----------|-----------|
| 400 | Bad Request | Request inválido ou malformado |
| 401 | Unauthorized | API Key inválida ou ausente |
| 403 | Forbidden | Sem permissão para acessar recurso |
| 404 | Not Found | Recurso não encontrado |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro interno do servidor |
| 503 | Service Unavailable | Serviço temporariamente indisponível |

---

## Changelog

### v1.0.0 (Janeiro 2025)
- ✨ Lançamento inicial da API pública
- ✨ Endpoints de Agentes, Conversas, Mensagens
- ✨ Sistema de Templates e Marketplace
- ✨ Analytics e métricas de negócio
- ✨ Billing e gerenciamento de assinaturas
- ✨ Onboarding estruturado
- ✨ Webhooks para eventos
- ✨ SDKs para JavaScript e Python

---

## Suporte

- 📧 Email: api-support@inovaia.com
- 📖 Documentação: https://docs.inovaia.com
- 💬 Discord: https://discord.gg/inovaia
- 🐛 Issues: https://github.com/inovaia/api/issues

---

**© 2025 InovaIA Platform. Todos os direitos reservados.**
