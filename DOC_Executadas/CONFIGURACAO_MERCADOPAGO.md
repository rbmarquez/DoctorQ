# 🔐 Configuração MercadoPago - Universidade da Beleza

## ⚠️ Problema Identificado

As credenciais atuais nos arquivos `.env` são **placeholders** e precisam ser substituídas por credenciais reais de teste do MercadoPago.

**Credenciais atuais (INVÁLIDAS):**
```bash
# Backend (.env)
MERCADOPAGO_ACCESS_TOKEN=NPFC64Y5XXVH
MERCADOPAGO_PUBLIC_KEY=APP_USR-seu-public-key-aqui

# Frontend (.env.local)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-seu-public-key-aqui
```

---

## 📋 Passo a Passo para Obter Credenciais de Teste

### 1️⃣ Acessar o Painel de Desenvolvedor

Acesse: **https://www.mercadopago.com.br/developers/panel/app**

- Faça login com sua conta MercadoPago
- Se não tiver conta, crie uma em https://www.mercadopago.com.br

### 2️⃣ Criar ou Selecionar uma Aplicação

1. Clique em **"Criar aplicação"** (se não tiver nenhuma)
2. Ou selecione uma aplicação existente
3. Nome sugerido: **"Universidade da Beleza - Teste"**

### 3️⃣ Obter as Credenciais de Teste

No menu lateral, clique em **"Credenciais"**

Você verá duas abas:
- **Credenciais de Produção** ❌ (NÃO use essas!)
- **Credenciais de Teste** ✅ (Use estas!)

Clique em **"Credenciais de Teste"** e copie:

#### Access Token (Backend)
```
Formato: TEST-1234567890123456-012345-abcdefghijklmnopqrstuvwxyz-123456789
Tamanho: ~70 caracteres
Começa com: TEST-
```

#### Public Key (Frontend)
```
Formato: TEST-12345678-1234-1234-1234-123456789abc
Tamanho: ~50 caracteres
Começa com: TEST- ou APP_USR-
```

---

## 🔧 Configuração dos Arquivos

### Backend: `/mnt/repositorios/DoctorQ/estetiQ-api-univ/.env`

Substitua as linhas:
```bash
# MERCADOPAGO (Pagamentos)
MERCADOPAGO_ACCESS_TOKEN=NPFC64Y5XXVH
MERCADOPAGO_PUBLIC_KEY=APP_USR-seu-public-key-aqui
```

Por:
```bash
# MERCADOPAGO (Pagamentos)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-012345-abcdefghijklmnopqrstuvwxyz-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789abc
```

⚠️ **IMPORTANTE:** Cole as credenciais REAIS que você copiou do painel!

### Frontend: `/mnt/repositorios/DoctorQ/estetiQ-web/.env.local`

Substitua a linha:
```bash
# MercadoPago (Universidade)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-seu-public-key-aqui
```

Por:
```bash
# MercadoPago (Universidade)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789abc
```

⚠️ **IMPORTANTE:** Use a MESMA Public Key do backend!

---

## 🧪 Como Testar Após Configurar

### 1. Reiniciar os Serviços

```bash
# Backend (Terminal 1)
cd /mnt/repositorios/DoctorQ/estetiQ-api-univ
uv run uvicorn src.main:app --host 0.0.0.0 --port 8081 --reload

# Frontend (Terminal 2)
cd /mnt/repositorios/DoctorQ/estetiQ-web
yarn dev
```

### 2. Acessar a Página de Assinatura

Abra no navegador: **http://localhost:3000/universidade/assinar**

### 3. Testar Pagamento com Cartão

1. Clique em **"Assinar Agora"** em qualquer plano
2. Selecione **"Cartão de Crédito"**
3. Use os **dados de teste** abaixo:

#### 📇 Cartões de Teste MercadoPago

**✅ Cartão APROVADO:**
```
Número: 5031 4332 1540 6351
Nome: APRO
Validade: 11/25
CVV: 123
CPF: 12345678909
```

**❌ Cartão REJEITADO (para testar erro):**
```
Número: 5031 4332 1540 6351
Nome: OTHE
Validade: 11/25
CVV: 123
CPF: 12345678909
```

**⏳ Cartão PENDENTE:**
```
Número: 5031 4332 1540 6351
Nome: CONT
Validade: 11/25
CVV: 123
CPF: 12345678909
```

> **Dica:** O status do pagamento depende do NOME digitado no cartão!

### 4. Testar Pagamento PIX

1. Clique em **"Assinar Agora"**
2. Selecione **"PIX"**
3. Clique em **"Gerar QR Code PIX"**
4. Você verá o QR Code e o código PIX

⚠️ **Nota:** Em ambiente de teste, o QR Code PIX é gerado mas NÃO pode ser pago (MercadoPago não processa PIX em sandbox). Para simular aprovação, use os webhooks ou a API do MercadoPago.

---

## 🔍 Verificar se Está Funcionando

### Verificar no Console do Navegador

1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Não deve aparecer erros **404** do MercadoPago

**❌ ANTES (com placeholder):**
```
GET https://api.mercadopago.com/v1/payment_methods/search?public_key=APP_USR-seu-public-key-aqui
404 (Not Found)
```

**✅ DEPOIS (com credencial válida):**
```
GET https://api.mercadopago.com/v1/payment_methods/search?public_key=TEST-12345...
200 (OK)
```

### Verificar Logs do Backend

```bash
tail -f /tmp/backend_univ_new.log
```

Ao processar um pagamento, você deve ver:
```
INFO: MercadoPago Payment created: {...}
INFO: Payment saved: id_pagamento=...
INFO: Subscription created: id_assinatura=...
```

---

## 🚀 Endpoints Disponíveis

Após configurar, você pode testar diretamente via API:

### 1. Criar Pagamento com Cartão (Assinatura)

```bash
curl -X POST http://localhost:8081/pagamentos/assinatura/card/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "tipo_plano": "mensal",
    "email": "usuario@exemplo.com",
    "token": "CARD_TOKEN_AQUI",
    "parcelas": 1,
    "nome": "APRO",
    "cpf": "12345678909"
  }'
```

### 2. Criar Pagamento PIX (Assinatura)

```bash
curl -X POST http://localhost:8081/pagamentos/assinatura/pix/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4",
    "tipo_plano": "mensal",
    "email": "usuario@exemplo.com",
    "nome": "Nome do Usuário",
    "cpf": "12345678909"
  }'
```

### 3. Listar Assinaturas do Usuário

```bash
curl http://localhost:8081/pagamentos/assinaturas/65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4/
```

### 4. Consultar Status de Pagamento

```bash
curl http://localhost:8081/pagamentos/status/{MP_PAYMENT_ID}/
```

---

## 📊 Verificar no Banco de Dados

```bash
# Conectar ao banco
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ

# Ver pagamentos
SELECT id_pagamento, tipo_item, tipo_pagamento, vl_total, status, dt_criacao
FROM tb_universidade_pagamentos
ORDER BY dt_criacao DESC
LIMIT 10;

# Ver assinaturas
SELECT id_assinatura, id_usuario, tipo_plano, vl_plano, status, dt_inicio, dt_fim
FROM tb_universidade_assinaturas
ORDER BY dt_criacao DESC
LIMIT 10;

# Ver matrículas
SELECT id_matricula, id_usuario, id_curso, progresso, status
FROM tb_universidade_matriculas
ORDER BY dt_criacao DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Erro 404 no Frontend

**Problema:** `GET https://api.mercadopago.com/v1/payment_methods... 404`

**Solução:** Public Key inválida. Verifique se você copiou a credencial de TESTE correta do painel do MercadoPago.

### Erro 401 Unauthorized

**Problema:** Backend retorna 401 ao criar pagamento

**Solução:** Access Token inválido. Verifique se você copiou o Access Token de TESTE correto.

### Pagamento sempre retorna "pending"

**Problema:** Status sempre fica em "pending" mesmo usando nome APRO

**Solução:** Verifique se está usando o nome EXATAMENTE como na documentação: `APRO` (maiúsculas, sem espaços)

### QR Code PIX não aparece

**Problema:** Erro ao gerar QR Code PIX

**Solução:** Em ambiente de teste, PIX pode ter limitações. Use cartão de crédito para testes completos.

---

## 📚 Documentação Oficial

- **Credenciais de Teste:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/credentials
- **Cartões de Teste:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/test-cards
- **API Reference:** https://www.mercadopago.com.br/developers/pt/reference

---

## ✅ Checklist Final

Antes de considerar a configuração completa:

- [ ] Credenciais de TESTE copiadas do painel MercadoPago
- [ ] Access Token atualizado no `.env` do backend
- [ ] Public Key atualizada no `.env` do backend
- [ ] Public Key atualizada no `.env.local` do frontend
- [ ] Backend reiniciado (porta 8081)
- [ ] Frontend reiniciado (porta 3000)
- [ ] Console do navegador SEM erros 404 do MercadoPago
- [ ] Pagamento com cartão testado (nome APRO)
- [ ] Assinatura criada no banco de dados
- [ ] Status da assinatura = "ativa" após aprovação

---

## 🎯 Próximos Passos Após Configurar

1. **Testar fluxo completo de assinatura** (mensal, trimestral, anual)
2. **Testar pagamento de cursos individuais**
3. **Configurar webhook do MercadoPago** para atualizações automáticas
4. **Testar renovação de assinatura**
5. **Implementar painel de gerenciamento de assinaturas**

---

**💡 Dica Final:** Mantenha as credenciais de TESTE separadas das de PRODUÇÃO. Quando for para produção, crie um novo arquivo `.env.production` com as credenciais reais!
