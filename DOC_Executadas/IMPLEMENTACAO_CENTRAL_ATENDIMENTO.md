# 📞 Implementação: Funcionalidades Faltantes - Central de Atendimento

## 🎯 Funcionalidades a Implementar

### 1. ❌ Chamada de Voz

**Status:** Não implementado
**Frontend:** Botão existe em `CentralAtendimentoLayout.tsx:552-554`
**Backend:** Sem endpoint

#### Implementação Sugerida:

**Opção A: Twilio Voice**
```python
# src/central_atendimento/routes/central_atendimento_route.py

@router.post("/conversas/{id_conversa}/iniciar-chamada/")
async def iniciar_chamada_voz(
    id_conversa: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Inicia chamada de voz via Twilio."""
    from twilio.rest import Client
    import os

    # Obter conversa e contato
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)
    conversa = await service.obter_conversa_com_contato(id_conversa)

    if not conversa or not conversa.contato:
        raise HTTPException(status_code=404, detail="Conversa ou contato não encontrado")

    # Twilio credentials
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_number = os.getenv("TWILIO_PHONE_NUMBER")

    client = Client(account_sid, auth_token)

    # Iniciar chamada
    call = client.calls.create(
        to=conversa.contato.nr_telefone,
        from_=twilio_number,
        url="https://SEU_DOMINIO/webhooks/twilio/voice",  # TwiML handler
        status_callback=f"https://SEU_DOMINIO/webhooks/twilio/call-status/{id_conversa}",
    )

    return {
        "call_sid": call.sid,
        "status": call.status,
        "to": conversa.contato.nr_telefone,
    }
```

**Opção B: Click-to-Call (Frontend)**
```typescript
// Simples: Abre discador do telefone
const handleChamar = () => {
  if (contatoInfo?.nr_telefone) {
    window.location.href = `tel:${contatoInfo.nr_telefone}`;
  }
};
```

---

### 2. ❌ Chamada de Vídeo

**Status:** Não implementado
**Frontend:** Botão existe em `CentralAtendimentoLayout.tsx:555-557`
**Backend:** Sem endpoint

#### Implementação Sugerida:

**Opção A: Jitsi Meet (Open Source)**
```python
# src/central_atendimento/routes/central_atendimento_route.py

@router.post("/conversas/{id_conversa}/iniciar-video/")
async def iniciar_chamada_video(
    id_conversa: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Gera link de chamada de vídeo via Jitsi."""
    import hashlib

    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)
    conversa = await service.obter_conversa_com_contato(id_conversa)

    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    # Gerar room ID único
    room_hash = hashlib.sha256(str(id_conversa).encode()).hexdigest()[:12]
    room_name = f"doctorq-{room_hash}"

    # URL Jitsi (pode ser self-hosted ou meet.jit.si)
    jitsi_domain = os.getenv("JITSI_DOMAIN", "meet.jit.si")
    video_url = f"https://{jitsi_domain}/{room_name}"

    # Salvar link na conversa (JSONB metadata)
    # TODO: Adicionar campo ds_metadata JSONB na tb_conversas_omni

    # Enviar link via WhatsApp para o cliente
    whatsapp = WhatsAppService(db, id_empresa)
    if conversa.tp_canal == "whatsapp" and conversa.contato.nr_telefone:
        await whatsapp.enviar_mensagem_texto(
            conversa.contato.nr_telefone,
            f"🎥 Link para chamada de vídeo:\n{video_url}\n\nClique no link para entrar."
        )

    return {
        "video_url": video_url,
        "room_name": room_name,
        "expires_at": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
    }
```

**Frontend:**
```typescript
const handleVideo = async () => {
  try {
    const response = await apiClient.post(
      `/central-atendimento/conversas/${conversaSelecionada.id_conversa}/iniciar-video/`
    );

    // Abrir Jitsi em nova janela
    window.open(response.data.video_url, '_blank');
  } catch (error) {
    console.error('Erro ao iniciar vídeo:', error);
  }
};
```

---

### 3. ❌ Favoritar Conversa

**Status:** Não implementado
**Frontend:** Opção existe no menu (linha 570-572)
**Backend:** Sem endpoint, sem campo no banco

#### Implementação Completa:

**A) Adicionar campo no banco:**
```sql
-- Migration: Adicionar campo st_favorito
ALTER TABLE tb_conversas_omni
ADD COLUMN st_favorito BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_conversas_omni_favorito
ON tb_conversas_omni(id_empresa, st_favorito)
WHERE st_favorito = TRUE;
```

**B) Backend - Model (Pydantic):**
```python
# src/central_atendimento/models/conversa_omni.py

class ConversaOmniResponse(BaseModel):
    id_conversa: UUID
    # ... outros campos ...
    st_favorito: bool = False  # 👈 ADICIONAR
```

**C) Backend - Service:**
```python
# src/central_atendimento/services/conversa_service.py

async def favoritar_conversa(
    self,
    id_conversa: UUID,
    favorito: bool = True
) -> Optional[TbConversaOmni]:
    """Marca/desmarca conversa como favorita."""
    stmt = (
        update(TbConversaOmni)
        .where(
            TbConversaOmni.id_conversa == id_conversa,
            TbConversaOmni.id_empresa == self.id_empresa,
        )
        .values(st_favorito=favorito)
        .returning(TbConversaOmni)
    )

    result = await self.db.execute(stmt)
    await self.db.commit()
    conversa = result.scalar_one_or_none()

    return conversa
```

**D) Backend - Route:**
```python
# src/central_atendimento/routes/central_atendimento_route.py

@router.post("/conversas/{id_conversa}/favoritar/")
async def favoritar_conversa(
    id_conversa: uuid.UUID,
    favorito: bool = Query(True, description="True para favoritar, False para desfavoritar"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Marca/desmarca conversa como favorita."""
    id_empresa = get_empresa_from_user(current_user)
    service = ConversaOmniService(db, id_empresa)

    conversa = await service.favoritar_conversa(id_conversa, favorito)
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    return {
        "message": "Conversa favoritada" if favorito else "Conversa desfavoritada",
        "st_favorito": conversa.st_favorito,
    }
```

**E) Frontend - Hook:**
```typescript
// src/lib/api/hooks/central-atendimento/useCentralAtendimento.ts

const favoritarConversa = useCallback(async (idConversa: string, favorito: boolean = true) => {
  try {
    const response = await apiClient.post(
      `/central-atendimento/conversas/${idConversa}/favoritar/?favorito=${favorito}`
    ) as { data: any };
    await mutateConversas();
    return response.data;
  } catch (error) {
    console.error('Erro ao favoritar conversa:', error);
    throw error;
  }
}, [mutateConversas]);

// Exportar
return {
  // ...
  favoritarConversa,
};
```

**F) Frontend - Componente:**
```typescript
// CentralAtendimentoLayout.tsx (linha ~565)

<DropdownMenuItem
  onClick={async () => {
    if (!conversaSelecionada) return;
    try {
      await favoritarConversa(
        conversaSelecionada.id_conversa,
        !conversaSelecionada.st_favorito
      );
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  }}
>
  <Star className={`h-3 w-3 mr-2 ${conversaSelecionada?.st_favorito ? 'fill-yellow-400 text-yellow-400' : ''}`} />
  {conversaSelecionada?.st_favorito ? 'Desfavoritar' : 'Favoritar'}
</DropdownMenuItem>
```

---

## 🐛 Erro CORS / Timeout

### Problema:

```
Access-Control-Allow-Origin header is present
net::ERR_FAILED
```

### Causa:

**NÃO é erro de CORS!** É erro de **timeout/conexão**.

O SWR está fazendo polling a cada 3s (linha 114):
```typescript
{ refreshInterval: 3000 }
```

Se a query de mensagens demorar >3s, ocorre timeout.

### Soluções:

#### 1. Aumentar timeout do SWR:
```typescript
// useCentralAtendimento.ts (linha 110-117)

const useMensagens = (idConversa: string | null) => {
  const { data, error, mutate, isLoading } = useSWR<{ items: MensagemOmni[]; total: number }>(
    idConversa ? `/central-atendimento/conversas/${idConversa}/mensagens/?page_size=100` : null,
    fetcher,
    {
      refreshInterval: 5000,  // 5s ao invés de 3s
      dedupingInterval: 2000,  // Evitar chamadas duplicadas
      revalidateOnFocus: false,  // Não revalidar ao focar janela
    }
  );
  return { mensagens: data?.items || [], total: data?.total || 0, error, mutate, isLoading };
};
```

#### 2. Adicionar índice no banco (performance):
```sql
-- Acelerar query de mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_omni_conversa_data
ON tb_mensagens_omni(id_conversa, dt_criacao DESC);
```

#### 3. Verificar CORS no .env (confirmação):
```bash
# .env
URL_PERMITIDA=http://localhost:3000  # ✅ Correto
CORS_ORIGINS=http://localhost:3000,https://doctorq.app  # Ou usar "*" para dev
```

#### 4. Verificar logs do backend:
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
tail -f logs/app.log  # Verificar se há erros
```

---

## 🧪 Checklist de Testes

### Funcionalidades Implementadas:

- [ ] Transferir para Humano
  - [ ] Conversa muda para `st_aguardando_humano = true`
  - [ ] Entra na fila de atendimento
  - [ ] Atendente consegue assumir

- [ ] Fechar Conversa
  - [ ] Conversa muda para `st_aberta = false`
  - [ ] Aceita avaliação (1-5)
  - [ ] Aceita feedback em texto

- [ ] Enviar Mensagem
  - [ ] Mensagem salva no banco
  - [ ] Notificação via WebSocket
  - [ ] Integração WhatsApp (se canal=whatsapp)

### Funcionalidades a Implementar:

- [ ] Chamada de Voz
  - [ ] Escolher: Twilio vs Click-to-Call
  - [ ] Criar endpoint `/iniciar-chamada/`
  - [ ] Integrar botão frontend

- [ ] Chamada de Vídeo
  - [ ] Escolher: Jitsi vs Twilio Video
  - [ ] Criar endpoint `/iniciar-video/`
  - [ ] Integrar botão frontend
  - [ ] Enviar link via WhatsApp

- [ ] Favoritar Conversa
  - [ ] Migration: adicionar `st_favorito` ao banco
  - [ ] Service: `favoritar_conversa()`
  - [ ] Route: `POST /conversas/{id}/favoritar/`
  - [ ] Hook: `favoritarConversa()`
  - [ ] UI: ícone estrela preenchida/vazia
  - [ ] Filtro: adicionar "Favoritas" aos filtros

---

## 🚀 Prioridades de Implementação

### Alta Prioridade:
1. **Favoritar Conversa** - Funcionalidade simples, alto impacto UX
2. **Corrigir Timeout SWR** - Evitar erros no console

### Média Prioridade:
3. **Chamada de Vídeo (Jitsi)** - Diferencial competitivo
4. **Índices no Banco** - Performance

### Baixa Prioridade:
5. **Chamada de Voz (Twilio)** - Requer integração paga

---

## 📦 Dependências Necessárias

### Para Chamada de Voz (Twilio):
```bash
pip install twilio
```

```bash
# .env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

### Para Chamada de Vídeo (Jitsi):
```bash
# .env
JITSI_DOMAIN=meet.jit.si  # Ou self-hosted
```

Sem dependências extras (Jitsi é iframe).

---

## 📝 Exemplos de Uso (API)

### Favoritar Conversa:
```bash
curl -X POST "http://localhost:8080/central-atendimento/conversas/875bb2a1.../favoritar/?favorito=true" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"
```

### Iniciar Vídeo:
```bash
curl -X POST "http://localhost:8080/central-atendimento/conversas/875bb2a1.../iniciar-video/" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

# Resposta:
{
  "video_url": "https://meet.jit.si/doctorq-a3f9c2e1b4d5",
  "room_name": "doctorq-a3f9c2e1b4d5",
  "expires_at": "2025-11-24T18:00:00"
}
```

---

**Gerado por:** Claude Code
**Data:** 2025-11-24
**Projeto:** DoctorQ - Central de Atendimento Omnichannel
