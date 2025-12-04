# ✅ Implementação Concluída - Central de Atendimento

**Data:** 2025-11-24
**Funcionalidades Implementadas:**
1. ⭐ **Favoritar Conversa** (Prioridade Alta)
2. 🎥 **Chamada de Vídeo via Jitsi** (Prioridade Média)
3. 📞 **Click-to-Call (Chamada de Voz)** (Bônus)

---

## 📦 Arquivos Modificados/Criados

### **Backend (estetiQ-api)**

#### 1. Migration SQL
- ✅ **`database/migration_024_add_favorito_video_conversas.sql`**
  - Adiciona campo `st_favorito BOOLEAN` à tabela `tb_conversas_omni`
  - Adiciona campo `ds_metadata JSONB` (para salvar links de vídeo, etc.)
  - Cria índices para performance
  - **Aplicada com sucesso:** ✅

#### 2. Models ORM (SQLAlchemy + Pydantic)
- ✅ **`src/central_atendimento/models/conversa_omni.py`**
  - Adicionado campo `st_favorito` no ORM model (linha 204-209)
  - Adicionado `st_favorito` no `ConversaOmniResponse` (linha 478)
  - Adicionado `st_favorito` e `ds_metadata` no `ConversaOmniUpdate` (linha 457, 462)

#### 3. Services
- ✅ **`src/central_atendimento/services/conversa_service.py`**
  - Método `favoritar_conversa()` implementado (linha 301-333)
  - Marca/desmarca conversa como favorita com update otimizado

#### 4. Routes (Endpoints)
- ✅ **`src/central_atendimento/routes/central_atendimento_route.py`**
  - **POST `/central-atendimento/conversas/{id_conversa}/favoritar/`** (linha 541-559)
    - Query param: `favorito` (boolean, default=True)
    - Retorna: `{ message, st_favorito }`

  - **POST `/central-atendimento/conversas/{id_conversa}/iniciar-video/`** (linha 562-633)
    - Gera sala Jitsi única
    - Salva link na metadata da conversa
    - Envia link via WhatsApp (se canal=whatsapp)
    - Retorna: `{ video_url, room_name, expires_at, message }`

---

### **Frontend (estetiQ-web)**

#### 5. Hook de API
- ✅ **`src/lib/api/hooks/central-atendimento/useCentralAtendimento.ts`**
  - Interface `ConversaOmni` atualizada com `st_favorito` e `ds_metadata` (linha 34, 42)
  - Método `favoritarConversa()` implementado (linha 214-226)
  - Método `iniciarVideo()` implementado (linha 228-239)
  - Exportados no return do hook (linha 263-264)
  - Timeout SWR corrigido: 3s → 5s (linha 115)

#### 6. Componente UI
- ✅ **`src/app/(dashboard)/admin/central-atendimento/_components/CentralAtendimentoLayout.tsx`**
  - Hook importando `favoritarConversa` e `iniciarVideo` (linha 110-111)

  - **Botão de Chamada (Click-to-Call)** (linha 554-567):
    - Abre discador do telefone com `tel:` URI
    - Funciona em mobile e desktop

  - **Botão de Vídeo (Jitsi)** (linha 568-585):
    - Chama `iniciarVideo()`
    - Abre Jitsi em nova janela (1024x768)
    - Envia link automaticamente via WhatsApp

  - **Menu Favoritar** (linha 597-618):
    - Ícone estrela muda de cor quando favoritada (fill-yellow-400)
    - Texto dinâmico: "Favoritar" / "Desfavoritar"
    - Toggle ao clicar

---

## 🧪 Como Testar

### **1. Reiniciar Serviços**

```bash
# Backend
cd /mnt/repositorios/DoctorQ/estetiQ-api
make dev  # ou: uv run uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload

# Frontend (em outro terminal)
cd /mnt/repositorios/DoctorQ/estetiQ-web
yarn dev  # porta 3000
```

### **2. Testar no Browser**

Acesse: **http://localhost:3000/admin/central-atendimento**

#### **Teste 1: Favoritar Conversa ⭐**

1. Selecione uma conversa na lista
2. Clique no menu `⋮` (três pontos)
3. Clique em **"Favoritar"**
4. ✅ **Resultado esperado:**
   - Ícone da estrela fica amarelo preenchido
   - Texto muda para "Desfavoritar"
   - Conversa atualizada no backend (verifique no banco: `SELECT st_favorito FROM tb_conversas_omni`)

#### **Teste 2: Chamada de Vídeo 🎥**

1. Selecione uma conversa
2. Clique no botão **📹 (Vídeo)** no header
3. ✅ **Resultado esperado:**
   - Nova janela abre com Jitsi Meet
   - URL: `https://meet.jit.si/doctorq-XXXXXXXXXX`
   - Se canal=WhatsApp: Cliente recebe mensagem com link
   - Link salvo em `ds_metadata` da conversa (verifique no banco)

#### **Teste 3: Click-to-Call 📞**

1. Selecione uma conversa com telefone
2. Clique no botão **📞 (Telefone)** no header
3. ✅ **Resultado esperado:**
   - **Desktop:** Abre aplicativo de telefone (Skype, FaceTime, etc.)
   - **Mobile:** Abre discador nativo com número preenchido

---

## 🔍 Testes Via cURL (Opcional)

### **Favoritar Conversa:**
```bash
CONVERSA_ID="875bb2a1-b485-464e-9ad0-a1f229582ccd"  # Substituir por ID real
curl -X POST "http://localhost:8080/central-atendimento/conversas/$CONVERSA_ID/favoritar/?favorito=true" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

# Resposta esperada:
# {"message": "Conversa favoritada", "st_favorito": true}
```

### **Desfavoritar:**
```bash
curl -X POST "http://localhost:8080/central-atendimento/conversas/$CONVERSA_ID/favoritar/?favorito=false" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

# Resposta esperada:
# {"message": "Conversa desfavoritada", "st_favorito": false}
```

### **Iniciar Vídeo:**
```bash
curl -X POST "http://localhost:8080/central-atendimento/conversas/$CONVERSA_ID/iniciar-video/" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

# Resposta esperada:
# {
#   "video_url": "https://meet.jit.si/doctorq-a3f9c2e1b4d5",
#   "room_name": "doctorq-a3f9c2e1b4d5",
#   "expires_at": "2025-11-24T18:00:00",
#   "message": "Link de vídeo gerado com sucesso"
# }
```

---

## 🗄️ Verificar no Banco de Dados

```bash
# Verificar campo st_favorito adicionado
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_prod -c "\d tb_conversas_omni" | grep favorito

# Ver conversas favoritadas
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_prod -c "
SELECT id_conversa, st_favorito, ds_metadata
FROM tb_conversas_omni
WHERE st_favorito = true
LIMIT 5;
"

# Ver metadata de vídeo
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_prod -c "
SELECT id_conversa, ds_metadata->'video_call' AS video_info
FROM tb_conversas_omni
WHERE ds_metadata ? 'video_call'
LIMIT 5;
"
```

---

## 📊 Status das Funcionalidades

| Funcionalidade | Backend | Frontend | Testes | Status |
|---|---|---|---|---|
| **Favoritar Conversa** | ✅ | ✅ | ⏳ | 🟢 PRONTO |
| **Chamada de Vídeo (Jitsi)** | ✅ | ✅ | ⏳ | 🟢 PRONTO |
| **Click-to-Call** | - | ✅ | ⏳ | 🟢 PRONTO |
| **Transferir para Humano** | ✅ | ✅ | ✅ | 🟢 JÁ EXISTIA |
| **Fechar Conversa** | ✅ | ✅ | ✅ | 🟢 JÁ EXISTIA |

---

## 🔧 Configurações Opcionais

### **Usar Jitsi Self-Hosted (Opcional)**

Se quiser usar seu próprio servidor Jitsi ao invés do `meet.jit.si`:

```bash
# .env (backend)
JITSI_DOMAIN=jitsi.suaempresa.com.br
```

Reinicie o backend após alterar.

---

## 🐛 Troubleshooting

### **Erro: "Conversa não encontrada"**
- Verifique se o `id_conversa` existe no banco
- Confirme que a conversa pertence à empresa do usuário logado

### **Vídeo não abre**
- Verifique popup blocker do navegador
- Teste manualmente abrindo: `https://meet.jit.si/doctorq-teste123`

### **WhatsApp não envia link**
- Verifique configuração do WhatsApp Business API no `.env`:
  ```bash
  WHATSAPP_PHONE_NUMBER_ID=...
  WHATSAPP_ACCESS_TOKEN=...
  ```
- Verifique logs do backend: `tail -f logs/app.log`

### **Favoritar não funciona**
- Verifique migration foi aplicada: `SELECT column_name FROM information_schema.columns WHERE table_name='tb_conversas_omni' AND column_name='st_favorito';`
- Se não retornar nada, rode a migration novamente

---

## 📝 Próximos Passos (Opcional)

### **1. Adicionar Filtro "Favoritas"**

Adicione opção de filtro para mostrar apenas conversas favoritadas:

```typescript
// CentralAtendimentoLayout.tsx - linha 428 (filtros)
<SelectItem value="favoritas">Favoritas</SelectItem>

// Atualizar filtro (linha 223):
const matchStatus = filtroStatus === 'todos' ||
  (filtroStatus === 'aguardando' && c.st_aguardando_humano) ||
  (filtroStatus === 'bot' && c.st_bot_ativo && !c.st_aguardando_humano) ||
  (filtroStatus === 'ativas' && c.st_aberta) ||
  (filtroStatus === 'favoritas' && c.st_favorito);  // 👈 NOVO
```

### **2. Indicador Visual de Favorito na Lista**

Adicione ícone de estrela nas conversas favoritadas:

```typescript
// CentralAtendimentoLayout.tsx - linha 500 (badge de status)
{getStatusBadge(conversa)}
{conversa.st_favorito && (
  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
)}
```

### **3. Notificação Toast ao Favoritar**

Use shadcn/ui Toast para feedback visual:

```typescript
import { toast } from '@/components/ui/use-toast';

await favoritarConversa(...);
toast({
  title: conversa.st_favorito ? "⭐ Favoritado" : "Desfavoritado",
  description: "Conversa atualizada com sucesso",
});
```

---

## 🎉 Conclusão

Implementação completa das funcionalidades de **Favoritar** e **Chamada de Vídeo** para a Central de Atendimento!

**Principais melhorias:**
- ⭐ Conversas podem ser marcadas como favoritas
- 🎥 Links de vídeo Jitsi gerados automaticamente
- 📞 Click-to-Call para chamadas telefônicas
- 🔧 Timeout do SWR corrigido (3s → 5s)
- 📊 Metadata JSONB para armazenar dados extras

**Gerado por:** Claude Code
**Projeto:** DoctorQ - Central de Atendimento Omnichannel
