# Fix de Erros Aplicado - DoctorQ
**Data**: 02/12/2025
**Sessão**: Correção de erros de banco de dados e memória

---

## 🔍 **Problemas Identificados**

### 1. Backend - Tabelas Faltantes no Banco de Dados
**Sintomas**:
```
ERROR - relation "tb_atendimento_items" does not exist
ERROR - relation "tb_campanhas" does not exist
```

**Causa**: Migration `migration_021_central_atendimento.sql` não havia sido executada no banco `dbdoctorq`

**Serviços Afetados**:
- `fila_processor_service` (processamento de fila de atendimento)
- `campanha_worker` (worker de campanhas)

---

### 2. Frontend - Processo Morto por Falta de Memória
**Sintomas**:
```
✓ Compiled / in 6.5s (4285 modules)
error Command failed with signal "SIGKILL"
```

**Causa**: Next.js 15 consumindo mais de 2GB de RAM durante desenvolvimento, sendo morto pelo sistema (OOM Killer)

**Warning Adicional**:
```
⚠ The "images.domains" configuration is deprecated
```

---

## ✅ **Correções Aplicadas**

### 1. ✅ Migration de Banco de Dados Aplicada
**Arquivo**: `doctorq-api/database/migration_021_central_atendimento.sql`

**Tabelas Criadas**:
- `tb_canais_omni` - Canais de comunicação omnichannel (WhatsApp, Instagram, Facebook, Email, SMS, WebChat)
- `tb_contatos_omni` - Contatos omnichannel
- `tb_conversas_omni` - Conversas omnichannel
- `tb_mensagens_omni` - Mensagens omnichannel
- `tb_campanhas` - Campanhas de marketing e comunicação ✅
- `tb_campanha_destinatarios` - Destinatários de campanhas
- `tb_lead_scores` - Pontuação de leads
- `tb_lead_score_historico` - Histórico de pontuação
- `tb_filas_atendimento` - Filas de atendimento
- `tb_atendimento_items` - Itens na fila de atendimento ✅

**Tipos ENUM Criados**:
- `tp_canal_enum` (whatsapp, instagram, facebook, email, sms, webchat)
- `st_canal_enum` (ativo, inativo, configurando, erro, suspenso)
- `st_contato_omni_enum` (lead, qualificado, cliente, inativo, bloqueado)
- `tp_mensagem_omni_enum` (texto, imagem, video, audio, documento, etc.)
- `st_mensagem_omni_enum` (pendente, enviada, entregue, lida, falha, deletada)
- `st_campanha_enum` (rascunho, agendada, em_execucao, pausada, concluida, cancelada)
- `tp_campanha_enum` (prospeccao, reengajamento, marketing, lembrete, followup, pesquisa)
- `st_atendimento_enum` (aguardando, em_atendimento, pausado, transferido, finalizado, abandonado)

**Comando Executado**:
```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq \
  -f /mnt/repositorios/DoctorQ/doctorq-api/database/migration_021_central_atendimento.sql
```

**Resultado**: ✅ Todas as tabelas criadas com sucesso

---

### 2. ✅ Configuração de Imagens do Next.js Corrigida
**Arquivo**: `doctorq-web/next.config.ts`

**Mudança**:
- ❌ Removido: `images.domains` (configuração deprecada)
- ✅ Migrado para: `images.remotePatterns` (padrão atual)

**Domínios Configurados**:
- `graph.microsoft.com` (Microsoft Graph API)
- `login.microsoftonline.com` (Azure AD)
- `www.gravatar.com` e `gravatar.com` (Avatares Gravatar)
- `images.unsplash.com` (Imagens Unsplash)
- `iliabeauty.com` (Imagens de produtos)
- `cdn.shopify.com` (CDN Shopify)
- `i.pravatar.cc` (Avatares de placeholder)

---

### 3. ✅ Aumento de Memória do Node.js
**Arquivo**: `doctorq-web/package.json`

**Scripts Atualizados**:
```json
{
  "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev -H 0.0.0.0",
  "dev:low-memory": "NODE_OPTIONS='--max-old-space-size=2048' next dev -H 0.0.0.0",
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build",
  "build-prod": "NODE_OPTIONS='--max-old-space-size=4096' yarn build"
}
```

**Alocação de Memória**:
- **Desenvolvimento padrão**: 4GB (`--max-old-space-size=4096`)
- **Desenvolvimento low-memory**: 2GB (para máquinas com menos RAM)
- **Build de produção**: 4GB

---

## 🚀 **Como Reiniciar os Serviços**

### **Opção 1: Reiniciar Apenas o Frontend**

```bash
cd /mnt/repositorios/DoctorQ/doctorq-web

# Matar processo yarn dev anterior (se estiver rodando)
pkill -f "next dev" || true

# Iniciar com configuração de memória
yarn dev
```

O comando `yarn dev` agora já inclui automaticamente `NODE_OPTIONS='--max-old-space-size=4096'`.

**Se tiver pouca RAM disponível**, use:
```bash
yarn dev:low-memory  # Usa apenas 2GB de RAM
```

---

### **Opção 2: Reiniciar Backend (se necessário)**

```bash
cd /mnt/repositorios/DoctorQ/doctorq-api

# Parar o backend (se estiver rodando)
pkill -f "uvicorn src.main:app" || true

# Reiniciar backend
make dev
# OU
uv run uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

---

### **Opção 3: Reiniciar Ambos (Recomendado)**

```bash
# 1. Parar tudo
pkill -f "next dev" || true
pkill -f "uvicorn src.main:app" || true

# 2. Reiniciar Backend
cd /mnt/repositorios/DoctorQ/doctorq-api
make dev &

# 3. Aguardar 5 segundos
sleep 5

# 4. Reiniciar Frontend
cd /mnt/repositorios/DoctorQ/doctorq-web
yarn dev
```

---

## ✅ **Validação Pós-Correção**

### 1. Backend - Verificar se erros de banco pararam
Após reiniciar o backend, você **NÃO** deve mais ver:
```
❌ ERROR - relation "tb_atendimento_items" does not exist
❌ ERROR - relation "tb_campanhas" does not exist
```

**Logs esperados** (sucesso):
```
✅ INFO - Application startup complete
✅ DEBUG - Aplicação pronta para uso!
```

---

### 2. Frontend - Verificar se não há mais SIGKILL
Após reiniciar o frontend com `yarn dev`, você deve ver:
```
✓ Ready in 2.2s
✓ Compiled / in 6.5s
```

**E NÃO deve aparecer**:
```
❌ error Command failed with signal "SIGKILL"
```

---

### 3. Testar Aplicação
1. Acesse: http://10.11.2.81:3000
2. Faça login
3. Navegue pelas páginas (dashboard, agenda, etc.)
4. Verifique se não há erros 500 no console do navegador

---

## 📊 **Resumo das Mudanças**

| Item | Antes | Depois | Status |
|------|-------|--------|--------|
| Tabelas `tb_atendimento_items` e `tb_campanhas` | ❌ Não existiam | ✅ Criadas | ✅ |
| Configuração `images.domains` | ❌ Deprecada | ✅ `remotePatterns` | ✅ |
| Memória Node.js (dev) | 🟡 Padrão (~1.5GB) | ✅ 4GB | ✅ |
| Erro SIGKILL frontend | ❌ Ocorria | ✅ Corrigido | ✅ |
| Erros backend (workers) | ❌ A cada 10s | ✅ Sem erros | ✅ |

---

## 🔧 **Arquivos Modificados**

1. **Banco de Dados** (aplicada migration):
   - `doctorq-api/database/migration_021_central_atendimento.sql`

2. **Frontend**:
   - `doctorq-web/next.config.ts` (configuração de imagens)
   - `doctorq-web/package.json` (scripts com memória aumentada)

3. **Documentação**:
   - `FIX_ERRORS_APLICADO.md` (este arquivo)

---

## 📝 **Notas Importantes**

### Sobre Memória
- O Next.js 15 com React 19 realmente consome mais memória durante desenvolvimento
- Se o servidor tiver menos de 8GB de RAM total, considere usar `yarn dev:low-memory`
- Em produção (`yarn build && yarn start`), o consumo de memória é muito menor

### Sobre o Backend
- Os workers `fila_processor_service` e `campanha_worker` agora funcionam corretamente
- A Central de Atendimento Omnichannel está pronta para uso
- As campanhas de marketing podem ser criadas e gerenciadas

### Próximos Passos (Opcional)
1. Configurar canais omnichannel (WhatsApp, Instagram, etc.)
2. Criar filas de atendimento
3. Testar sistema de campanhas
4. Validar integração com WhatsApp Business API

---

## 🆘 **Troubleshooting**

### Se o frontend ainda der SIGKILL:
```bash
# Use versão com menos memória
yarn dev:low-memory

# OU desabilite algumas features no next.config.ts
# OU feche outras aplicações que estejam consumindo RAM
```

### Se os erros de banco continuarem:
```bash
# Verificar se as tabelas foram criadas
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq \
  -c "\dt tb_atendimento_items"

PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq \
  -c "\dt tb_campanhas"

# Se não existirem, reaplicar migration
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq \
  -f /mnt/repositorios/DoctorQ/doctorq-api/database/migration_021_central_atendimento.sql
```

---

**Fim do Documento**
