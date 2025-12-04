# 🚀 Início Rápido - Sistema de Pagamentos

Guia rápido para começar a testar o sistema de pagamentos da Universidade da Beleza.

---

## ✅ Status Atual

- ✅ **Backend API** - Rodando em http://localhost:8081
- ✅ **Frontend** - Rodando em http://localhost:3000
- ✅ **Database** - PostgreSQL conectado
- ✅ **Endpoints** - 9 rotas de pagamento implementadas
- ⚠️ **MercadoPago** - Credenciais são PLACEHOLDERS (precisam ser substituídas)

---

## 🔴 AÇÃO NECESSÁRIA

### As credenciais do MercadoPago nos arquivos `.env` são placeholders e precisam ser substituídas!

**Credenciais atuais (INVÁLIDAS):**
```bash
MERCADOPAGO_ACCESS_TOKEN=NPFC64Y5XXVH
MERCADOPAGO_PUBLIC_KEY=APP_USR-seu-public-key-aqui
```

---

## 📝 Passo a Passo para Testar

### 1. Obter Credenciais Reais do MercadoPago

#### Opção A: Você já tem conta MercadoPago
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login
3. Selecione ou crie uma aplicação
4. Vá em **"Credenciais" → "Credenciais de Teste"**
5. Copie:
   - **Access Token** (começa com `TEST-`, ~70 caracteres)
   - **Public Key** (começa com `TEST-` ou `APP_USR-`, ~50 caracteres)

#### Opção B: Você NÃO tem conta MercadoPago
1. Crie uma conta em: https://www.mercadopago.com.br
2. Vá para: https://www.mercadopago.com.br/developers/panel/app
3. Clique em **"Criar aplicação"**
4. Nome: "Universidade da Beleza - Teste"
5. Siga os passos da Opção A

---

### 2. Atualizar Arquivos de Configuração

#### Backend: `/mnt/repositorios/DoctorQ/estetiQ-api-univ/.env`

Abra o arquivo e substitua:

```bash
# ANTES (placeholders)
MERCADOPAGO_ACCESS_TOKEN=NPFC64Y5XXVH
MERCADOPAGO_PUBLIC_KEY=APP_USR-seu-public-key-aqui

# DEPOIS (suas credenciais reais)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-012345-abcdefghijklmnopqrstuvwxyz-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789abc
```

⚠️ **Cole as credenciais REAIS que você copiou!**

#### Frontend: `/mnt/repositorios/DoctorQ/estetiQ-web/.env.local`

Abra o arquivo e substitua:

```bash
# ANTES
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-seu-public-key-aqui

# DEPOIS (mesma Public Key do backend!)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789abc
```

---

### 3. Reiniciar os Serviços

#### Terminal 1 - Backend
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api-univ
uv run uvicorn src.main:app --host 0.0.0.0 --port 8081 --reload
```

Aguarde ver:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8081
```

#### Terminal 2 - Frontend
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-web
yarn dev
```

Aguarde ver:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

### 4. Executar Script de Verificação

```bash
/mnt/repositorios/DoctorQ/verificar_mercadopago.sh
```

**Resultado esperado:**
- ✅ MERCADOPAGO_ACCESS_TOKEN configurado
- ✅ MERCADOPAGO_PUBLIC_KEY configurado
- ✅ Backend rodando
- ✅ Frontend rodando
- ✅ MercadoPago configurado: true

---

### 5. Testar no Navegador

#### Abra: http://localhost:3000/universidade/assinar

Você verá a página com 4 planos:
- ⚪ Gratuito (R$ 0,00)
- 🔥 **Premium Mensal** (R$ 47,90) - Mais Popular
- 💰 Premium Trimestral (R$ 129,90) - Economize
- 👑 Premium Anual (R$ 479,90) - Melhor Valor

#### Clique em "Assinar Agora" em qualquer plano pago

O modal de pagamento abrirá com 2 opções:
- 💳 **Cartão de Crédito**
- 📱 **PIX**

---

### 6. Teste com Cartão de Crédito (RECOMENDADO)

#### Preencha os dados:

| Campo | Valor |
|-------|-------|
| **Número do Cartão** | `5031 4332 1540 6351` |
| **Nome no Cartão** | `APRO` |
| **Validade** | `11/25` |
| **CVV** | `123` |
| **Parcelas** | `1x de R$ 47,90 sem juros` |

#### Clique em "Pagar"

**Resultado esperado:**
- ✅ Mensagem "Pagamento aprovado! Redirecionando..."
- ✅ Página recarrega após 2 segundos
- ✅ Assinatura criada no banco com status "ativa"

---

### 7. Verificar no Banco de Dados

```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ
```

#### Consultar último pagamento:
```sql
SELECT id_pagamento, tipo_item, tipo_pagamento, vl_total, status, dt_criacao
FROM tb_universidade_pagamentos
ORDER BY dt_criacao DESC
LIMIT 1;
```

**Resultado esperado:**
| Coluna | Valor |
|--------|-------|
| tipo_item | assinatura |
| tipo_pagamento | card |
| vl_total | 47.90 |
| status | **approved** |

#### Consultar assinatura criada:
```sql
SELECT id_assinatura, tipo_plano, vl_plano, status, dt_inicio, dt_fim
FROM tb_universidade_assinaturas
ORDER BY dt_criacao DESC
LIMIT 1;
```

**Resultado esperado:**
| Coluna | Valor |
|--------|-------|
| tipo_plano | mensal |
| vl_plano | 47.90 |
| status | **ativa** |
| dt_inicio | 2025-11-14 ... |
| dt_fim | 2025-12-14 ... (1 mês depois) |

---

### 8. Teste com PIX (Opcional)

1. Clique em "Assinar Agora"
2. Selecione **"PIX"**
3. Clique em **"Gerar QR Code PIX"**

**Resultado esperado:**
- ✅ QR Code exibido
- ✅ Código PIX copiável
- ✅ Pagamento criado com status "pending"

⚠️ **Nota:** Em ambiente de teste, o QR Code é gerado mas não pode ser pago via app bancário. Para simular aprovação, use webhooks ou API do MercadoPago.

---

## 🧪 Testes Adicionais

### Teste de Cartão Rejeitado

Use o **mesmo número** de cartão, mas mude o nome:

| Campo | Valor |
|-------|-------|
| **Nome no Cartão** | `OTHE` |

**Resultado esperado:**
- ❌ Mensagem "Pagamento não aprovado: ..."
- ❌ Status do pagamento: "rejected"

### Teste de Cartão Pendente

| Campo | Valor |
|-------|-------|
| **Nome no Cartão** | `CONT` |

**Resultado esperado:**
- ⏳ Mensagem "Pagamento em análise. Aguarde a aprovação."
- ⏳ Status do pagamento: "pending"

---

## 📊 Monitorar Logs em Tempo Real

### Backend:
```bash
tail -f /tmp/backend_univ.log
```

Ao processar pagamento, você verá:
```
INFO: MercadoPago Payment created: {...}
INFO: Payment saved: id_pagamento=...
INFO: Subscription created: id_assinatura=...
```

### Frontend (console do navegador):
Abra DevTools (F12) e vá na aba **Console**.

Você NÃO deve ver erros 404 do MercadoPago:
```
✅ GET https://api.mercadopago.com/v1/payment_methods/search?public_key=TEST-...
   200 OK
```

---

## 🐛 Problemas Comuns

### 1. Console mostra 404 do MercadoPago

**Problema:** Public Key inválida

**Solução:**
1. Verifique se substituiu o placeholder no `.env.local`
2. Reinicie o frontend (`yarn dev`)
3. Recarregue a página (Ctrl+R)

### 2. Backend retorna 401 ao criar pagamento

**Problema:** Access Token inválido

**Solução:**
1. Verifique se substituiu o placeholder no `.env`
2. Reinicie o backend
3. Execute o script de verificação

### 3. Pagamento sempre retorna "pending"

**Problema:** Nome do cartão errado

**Solução:** Use exatamente `APRO` (maiúsculas, sem espaços)

### 4. "MercadoPago não configurado"

**Problema:** Credenciais não foram atualizadas

**Solução:**
1. Execute: `/mnt/repositorios/DoctorQ/verificar_mercadopago.sh`
2. Siga as instruções do script

---

## 📚 Documentação Completa

Se precisar de mais detalhes:

- **📖 Configuração Completa:** [CONFIGURACAO_MERCADOPAGO.md](file:///mnt/repositorios/DoctorQ/CONFIGURACAO_MERCADOPAGO.md)
- **📖 Exemplos de API:** [EXEMPLOS_API_PAGAMENTOS.md](file:///mnt/repositorios/DoctorQ/EXEMPLOS_API_PAGAMENTOS.md)
- **📖 Resumo da Implementação:** [RESUMO_IMPLEMENTACAO_PAGAMENTOS.md](file:///mnt/repositorios/DoctorQ/RESUMO_IMPLEMENTACAO_PAGAMENTOS.md)
- **🔧 Script de Verificação:** [verificar_mercadopago.sh](file:///mnt/repositorios/DoctorQ/verificar_mercadopago.sh)

---

## ✅ Checklist Rápido

Antes de começar os testes:

- [ ] Credenciais obtidas no painel do MercadoPago
- [ ] Access Token atualizado no `.env` do backend
- [ ] Public Key atualizada no `.env` do backend
- [ ] Public Key atualizada no `.env.local` do frontend
- [ ] Backend reiniciado e rodando (porta 8081)
- [ ] Frontend reiniciado e rodando (porta 3000)
- [ ] Script de verificação executado com sucesso
- [ ] Console do navegador SEM erros 404

---

## 🎯 Resumo de 30 Segundos

1. **Obter credenciais:** https://www.mercadopago.com.br/developers/panel/app → Credenciais de Teste
2. **Atualizar .env:** Substituir placeholders nos 2 arquivos (backend + frontend)
3. **Reiniciar:** Backend (porta 8081) + Frontend (porta 3000)
4. **Verificar:** Executar `verificar_mercadopago.sh`
5. **Testar:** http://localhost:3000/universidade/assinar → Assinar Agora → Cartão `5031 4332 1540 6351` com nome `APRO`

---

**🎉 Pronto! Sistema 100% funcional após configurar as credenciais!**

---

**📅 Criado em:** 2025-11-14
**🔧 Desenvolvedor:** Claude Code
**📦 Projeto:** DoctorQ - Universidade da Beleza
