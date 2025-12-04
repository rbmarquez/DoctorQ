# 🧪 Exemplos de Uso - API de Pagamentos

Exemplos práticos para testar os endpoints de pagamento da Universidade da Beleza.

---

## 🔐 Autenticação

Nenhuma autenticação é necessária para estes endpoints (ainda). Em produção, adicionar JWT ou API Key.

---

## 📋 Endpoints Disponíveis

### 1️⃣ Criar Pagamento PIX para Assinatura

**Endpoint:** `POST /pagamentos/assinatura/pix/`

**Descrição:** Gera um QR Code PIX para assinatura de plano.

**Planos disponíveis:**
- `mensal` - R$ 47,90
- `trimestral` - R$ 129,90
- `anual` - R$ 479,90

**Request:**
```bash
curl -X POST http://localhost:8081/pagamentos/assinatura/pix/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "tipo_plano": "mensal",
    "email": "usuario@exemplo.com",
    "nome": "João Silva",
    "cpf": "12345678909"
  }'
```

**Response de Sucesso (200):**
```json
{
  "success": true,
  "message": "Pagamento PIX criado com sucesso",
  "data": {
    "id_pagamento": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "id_assinatura": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "mp_payment_id": "123456789",
    "qr_code": "00020126580014br.gov.bcb.pix...",
    "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "ticket_url": "https://www.mercadopago.com.br/payments/123456789/ticket",
    "status": "pending",
    "vl_total": 47.90
  }
}
```

**Campos importantes do response:**
- `qr_code` - Código PIX copiável
- `qr_code_base64` - Imagem do QR Code em base64
- `ticket_url` - URL do boleto/comprovante
- `id_pagamento` - UUID do pagamento no nosso banco
- `id_assinatura` - UUID da assinatura criada
- `mp_payment_id` - ID do pagamento no MercadoPago

---

### 2️⃣ Criar Pagamento com Cartão para Assinatura

**Endpoint:** `POST /pagamentos/assinatura/card/`

**Descrição:** Processa pagamento com cartão de crédito para assinatura.

**⚠️ IMPORTANTE:** O `token` deve ser gerado no frontend usando MercadoPago.js SDK!

**Request:**
```bash
curl -X POST http://localhost:8081/pagamentos/assinatura/card/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "tipo_plano": "mensal",
    "email": "usuario@exemplo.com",
    "token": "abc123def456ghi789jkl012mno345",
    "parcelas": 1,
    "nome": "APRO",
    "cpf": "12345678909"
  }'
```

**Parâmetros:**
- `token` - Token do cartão gerado pelo MercadoPago.js (frontend)
- `parcelas` - Número de parcelas (1, 2, 3, 6 ou 12)
- `nome` - Nome no cartão (use `APRO` para teste aprovado)

**Response de Sucesso - Pagamento Aprovado (200):**
```json
{
  "success": true,
  "message": "Pagamento com cartão processado",
  "data": {
    "id_pagamento": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
    "id_assinatura": "d4e5f6a7-b8c9-0123-def1-234567890bcd",
    "mp_payment_id": "987654321",
    "status": "approved",
    "status_detail": "accredited",
    "vl_total": 47.90,
    "parcelas": 1,
    "tipo_plano": "mensal",
    "dt_inicio": "2025-11-14T10:30:00",
    "dt_fim": "2025-12-14T10:30:00"
  }
}
```

**Response - Pagamento Rejeitado (200):**
```json
{
  "success": true,
  "message": "Pagamento com cartão processado",
  "data": {
    "id_pagamento": "e5f6a7b8-c9d0-1234-efab-cdef12345678",
    "id_assinatura": "f6a7b8c9-d0e1-2345-fabc-def123456789",
    "mp_payment_id": "111222333",
    "status": "rejected",
    "status_detail": "cc_rejected_insufficient_amount",
    "vl_total": 47.90,
    "parcelas": 1
  }
}
```

**Códigos de status_detail:**
- `accredited` - Pagamento aprovado
- `cc_rejected_insufficient_amount` - Saldo insuficiente
- `cc_rejected_bad_filled_card_number` - Número do cartão inválido
- `cc_rejected_bad_filled_security_code` - CVV inválido
- `cc_rejected_bad_filled_date` - Data de validade inválida

---

### 3️⃣ Criar Pagamento PIX para Curso Individual

**Endpoint:** `POST /pagamentos/curso/pix/`

**Descrição:** Gera QR Code PIX para compra de curso individual.

**Request:**
```bash
curl -X POST http://localhost:8081/pagamentos/curso/pix/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "id_curso": "12345678-abcd-ef01-2345-6789abcdef01",
    "vl_curso": 297.00,
    "titulo_curso": "Microagulhamento Avançado",
    "email": "usuario@exemplo.com",
    "nome": "Maria Santos",
    "cpf": "98765432100"
  }'
```

**Response de Sucesso (200):**
```json
{
  "success": true,
  "message": "Pagamento PIX criado com sucesso",
  "data": {
    "id_pagamento": "a7b8c9d0-e1f2-3456-7890-abcdef123456",
    "id_matricula": "b8c9d0e1-f2a3-4567-890a-bcdef1234567",
    "mp_payment_id": "444555666",
    "qr_code": "00020126580014br.gov.bcb.pix...",
    "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "ticket_url": "https://www.mercadopago.com.br/payments/444555666/ticket",
    "status": "pending",
    "vl_total": 297.00
  }
}
```

---

### 4️⃣ Criar Pagamento com Cartão para Curso Individual

**Endpoint:** `POST /pagamentos/curso/card/`

**Request:**
```bash
curl -X POST http://localhost:8081/pagamentos/curso/card/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "id_curso": "12345678-abcd-ef01-2345-6789abcdef01",
    "vl_curso": 297.00,
    "titulo_curso": "Microagulhamento Avançado",
    "email": "usuario@exemplo.com",
    "token": "xyz789abc456def123ghi890jkl567",
    "parcelas": 3,
    "nome": "APRO",
    "cpf": "98765432100"
  }'
```

**Response de Sucesso (200):**
```json
{
  "success": true,
  "message": "Pagamento com cartão processado",
  "data": {
    "id_pagamento": "c9d0e1f2-a3b4-5678-901a-bcdef123456",
    "id_matricula": "d0e1f2a3-b4c5-6789-012b-cdef1234567",
    "mp_payment_id": "777888999",
    "status": "approved",
    "status_detail": "accredited",
    "vl_total": 297.00,
    "parcelas": 3,
    "titulo_curso": "Microagulhamento Avançado",
    "progresso": 0
  }
}
```

---

### 5️⃣ Webhook MercadoPago

**Endpoint:** `POST /pagamentos/webhook/`

**Descrição:** Recebe notificações do MercadoPago quando um pagamento PIX é aprovado.

**⚠️ Este endpoint é chamado automaticamente pelo MercadoPago, não por você!**

**Request (exemplo enviado pelo MercadoPago):**
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "123456789"
  },
  "date_created": "2025-11-14T10:30:00.000-04:00",
  "id": 123456789,
  "live_mode": false,
  "type": "payment",
  "user_id": "987654321"
}
```

**Fluxo do Webhook:**
1. MercadoPago envia notificação para `/pagamentos/webhook/`
2. Backend busca detalhes do pagamento via `data.id`
3. Backend atualiza status no banco de dados
4. Se `status = approved`:
   - Assinatura: Atualiza para `ativa` e define datas
   - Matrícula: Atualiza para `ativa`

**Response (200):**
```json
{
  "success": true,
  "message": "Webhook processado com sucesso",
  "status": "approved"
}
```

---

### 6️⃣ Listar Assinaturas do Usuário

**Endpoint:** `GET /pagamentos/assinaturas/{id_usuario}/`

**Request:**
```bash
curl http://localhost:8081/pagamentos/assinaturas/65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4/
```

**Response (200):**
```json
{
  "success": true,
  "total": 2,
  "data": [
    {
      "id_assinatura": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
      "id_pagamento": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "tipo_plano": "mensal",
      "vl_plano": "47.90",
      "status": "ativa",
      "dt_inicio": "2025-11-14T10:30:00",
      "dt_fim": "2025-12-14T10:30:00",
      "dt_criacao": "2025-11-14T10:25:00"
    },
    {
      "id_assinatura": "c3d4e5f6-a7b8-9012-cdef-123456789abc",
      "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
      "tipo_plano": "anual",
      "vl_plano": "479.90",
      "status": "pendente",
      "dt_inicio": null,
      "dt_fim": null,
      "dt_criacao": "2025-11-13T15:20:00"
    }
  ]
}
```

---

### 7️⃣ Listar Matrículas do Usuário

**Endpoint:** `GET /pagamentos/matriculas/{id_usuario}/`

**Request:**
```bash
curl http://localhost:8081/pagamentos/matriculas/65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4/
```

**Response (200):**
```json
{
  "success": true,
  "total": 3,
  "data": [
    {
      "id_matricula": "d4e5f6a7-b8c9-0123-def1-234567890bcd",
      "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
      "id_curso": "12345678-abcd-ef01-2345-6789abcdef01",
      "id_pagamento": "e5f6a7b8-c9d0-1234-efab-cdef12345678",
      "progresso": 45,
      "status": "ativa",
      "dt_criacao": "2025-11-10T08:15:00"
    },
    {
      "id_matricula": "f6a7b8c9-d0e1-2345-fabc-def123456789",
      "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
      "id_curso": "23456789-bcde-f012-3456-789abcdef012",
      "id_pagamento": null,
      "progresso": 100,
      "status": "concluida",
      "dt_criacao": "2025-10-01T10:00:00"
    }
  ]
}
```

---

### 8️⃣ Consultar Status de Pagamento

**Endpoint:** `GET /pagamentos/status/{mp_payment_id}/`

**Descrição:** Busca um pagamento pelo ID do MercadoPago.

**Request:**
```bash
curl http://localhost:8081/pagamentos/status/123456789/
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id_pagamento": "a7b8c9d0-e1f2-3456-7890-abcdef123456",
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "tipo_item": "assinatura",
    "mp_payment_id": "123456789",
    "tipo_pagamento": "pix",
    "vl_total": "47.90",
    "status": "approved",
    "parcelas": 1,
    "metadata": {
      "tipo_plano": "mensal",
      "email": "usuario@exemplo.com",
      "nome": "João Silva"
    },
    "dt_criacao": "2025-11-14T10:25:00",
    "dt_atualizacao": "2025-11-14T10:30:00"
  }
}
```

---

### 9️⃣ Health Check

**Endpoint:** `GET /pagamentos/health/`

**Descrição:** Verifica se o MercadoPago está configurado.

**Request:**
```bash
curl http://localhost:8081/pagamentos/health/
```

**Response - Configurado (200):**
```json
{
  "mercadopago": {
    "configured": true
  }
}
```

**Response - NÃO Configurado (200):**
```json
{
  "mercadopago": {
    "configured": false
  }
}
```

---

## 🧪 Testes com Cartões de Teste

### ✅ Cartão Aprovado

```json
{
  "cardNumber": "5031433215406351",
  "cardholderName": "APRO",
  "cardExpirationMonth": "11",
  "cardExpirationYear": "2025",
  "securityCode": "123",
  "identificationType": "CPF",
  "identificationNumber": "12345678909"
}
```

**Resultado:** `status = approved`

### ❌ Cartão Rejeitado (Saldo Insuficiente)

Use o mesmo número, mas mude o nome:

```json
{
  "cardholderName": "OTHE"
}
```

**Resultado:** `status = rejected`, `status_detail = cc_rejected_other_reason`

### ⏳ Cartão Pendente (Em Análise)

```json
{
  "cardholderName": "CONT"
}
```

**Resultado:** `status = pending`, `status_detail = pending_contingency`

---

## 🔄 Fluxo Completo de Teste (PIX)

### Passo 1: Criar Pagamento PIX

```bash
curl -X POST http://localhost:8081/pagamentos/assinatura/pix/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "tipo_plano": "mensal",
    "email": "teste@exemplo.com",
    "nome": "Teste User",
    "cpf": "12345678909"
  }' | jq
```

**Capturar do response:**
- `id_pagamento` - Para consultar depois
- `mp_payment_id` - Para simular webhook
- `qr_code` - Código PIX

### Passo 2: Verificar no Banco

```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ -c \
  "SELECT id_pagamento, status FROM tb_universidade_pagamentos ORDER BY dt_criacao DESC LIMIT 1;"
```

**Resultado esperado:** `status = pending`

### Passo 3: Simular Aprovação do Pagamento PIX

Em teste, você pode simular aprovação via API do MercadoPago ou aguardar webhook.

**Consultar status via API:**
```bash
curl http://localhost:8081/pagamentos/status/123456789/ | jq
```

### Passo 4: Verificar Assinatura Ativada

```bash
curl http://localhost:8081/pagamentos/assinaturas/65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4/ | jq
```

**Resultado esperado após webhook:**
- `status = "ativa"`
- `dt_inicio` preenchido
- `dt_fim` preenchido (1 mês depois para mensal)

---

## 🔄 Fluxo Completo de Teste (Cartão)

### Passo 1: Gerar Token do Cartão (Frontend)

⚠️ **Isso deve ser feito no frontend usando MercadoPago.js!**

```javascript
// No navegador (após carregar MercadoPago.js)
const mp = new MercadoPago('YOUR_PUBLIC_KEY');

const cardToken = await mp.createCardToken({
  cardNumber: '5031433215406351',
  cardholderName: 'APRO',
  cardExpirationMonth: '11',
  cardExpirationYear: '2025',
  securityCode: '123',
  identificationType: 'CPF',
  identificationNumber: '12345678909'
});

console.log('Token:', cardToken.id);
```

### Passo 2: Enviar Pagamento com Token

```bash
curl -X POST http://localhost:8081/pagamentos/assinatura/card/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "tipo_plano": "mensal",
    "email": "teste@exemplo.com",
    "token": "abc123def456ghi789",
    "parcelas": 1,
    "nome": "APRO",
    "cpf": "12345678909"
  }' | jq
```

### Passo 3: Verificar Resultado Imediato

Cartão retorna status imediatamente:
- `status = approved` → Assinatura ativa
- `status = rejected` → Pagamento rejeitado
- `status = pending` → Em análise

### Passo 4: Verificar Assinatura

```bash
curl http://localhost:8081/pagamentos/assinaturas/65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4/ | jq
```

Se `approved`, a assinatura já estará ativa com datas definidas.

---

## ⚙️ Configuração de Webhook no MercadoPago

Para receber notificações automáticas quando um PIX for pago:

### Passo 1: Expor Endpoint Publicamente

Use **ngrok** para expor o localhost:

```bash
ngrok http 8081
```

Copie a URL pública (ex: `https://abc123.ngrok.io`)

### Passo 2: Configurar no Painel MercadoPago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em **"Webhooks"**
3. Clique em **"Adicionar Webhook"**
4. Cole a URL: `https://abc123.ngrok.io/pagamentos/webhook/`
5. Selecione evento: **"Pagamentos"**
6. Salve

### Passo 3: Testar Webhook

Após pagar um PIX no sandbox, o MercadoPago enviará:

```
POST https://abc123.ngrok.io/pagamentos/webhook/
```

Você verá nos logs do backend:
```
INFO: Webhook received: payment.updated
INFO: Payment ID: 123456789
INFO: Payment approved, activating subscription...
```

---

## 📊 Queries Úteis no Banco

### Ver Últimos Pagamentos

```sql
SELECT
  id_pagamento,
  tipo_item,
  tipo_pagamento,
  vl_total,
  status,
  parcelas,
  dt_criacao
FROM tb_universidade_pagamentos
ORDER BY dt_criacao DESC
LIMIT 10;
```

### Ver Assinaturas Ativas

```sql
SELECT
  a.id_assinatura,
  a.id_usuario,
  a.tipo_plano,
  a.vl_plano,
  a.status,
  a.dt_inicio,
  a.dt_fim,
  p.tipo_pagamento,
  p.status as status_pagamento
FROM tb_universidade_assinaturas a
LEFT JOIN tb_universidade_pagamentos p ON a.id_pagamento = p.id_pagamento
WHERE a.status = 'ativa'
ORDER BY a.dt_criacao DESC;
```

### Ver Matrículas por Progresso

```sql
SELECT
  m.id_matricula,
  m.id_usuario,
  m.id_curso,
  m.progresso,
  m.status,
  p.vl_total as vl_pago
FROM tb_universidade_matriculas m
LEFT JOIN tb_universidade_pagamentos p ON m.id_pagamento = p.id_pagamento
WHERE m.status = 'ativa'
ORDER BY m.progresso DESC;
```

### Ver Receita por Tipo de Plano

```sql
SELECT
  a.tipo_plano,
  COUNT(*) as total_assinaturas,
  SUM(p.vl_total) as receita_total,
  AVG(p.vl_total) as ticket_medio
FROM tb_universidade_assinaturas a
INNER JOIN tb_universidade_pagamentos p ON a.id_pagamento = p.id_pagamento
WHERE p.status = 'approved'
GROUP BY a.tipo_plano
ORDER BY receita_total DESC;
```

---

## 🐛 Troubleshooting

### Erro: "configured": false

**Problema:** MercadoPago não configurado

**Solução:** Verifique `.env`:
```bash
grep MERCADOPAGO /mnt/repositorios/DoctorQ/estetiQ-api-univ/.env
```

### Erro 400: "Tipo de plano inválido"

**Problema:** `tipo_plano` não é `mensal`, `trimestral` ou `anual`

**Solução:** Use exatamente esses valores (minúsculas)

### Erro 500: "MercadoPago API error"

**Problema:** Credenciais inválidas ou expiradas

**Solução:** Obtenha novas credenciais de teste

### Webhook não chega

**Problema:** Endpoint não está acessível publicamente

**Solução:** Use ngrok ou configure no servidor com domínio real

---

**📅 Última atualização:** 2025-11-14
**🔗 Documentação completa:** [CONFIGURACAO_MERCADOPAGO.md](file:///mnt/repositorios/DoctorQ/CONFIGURACAO_MERCADOPAGO.md)
