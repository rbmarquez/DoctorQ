# Sistema de Vídeos e Streaming - Universidade da Beleza

## 📊 Análise Atual

### Schema do Banco de Dados ✅

```sql
tb_universidade_aulas
├── tipo VARCHAR(50) CHECK (tipo IN ('video', 'pdf', 'quiz', 'simulador_ar', 'live', 'texto', 'infografico'))
├── conteudo_url VARCHAR(500) -- URL do vídeo
└── recursos JSONB -- Materiais complementares
```

**Status:** ✅ **Estrutura correta e adequada para múltiplas fontes de vídeo**

---

## 🎯 Opções de Armazenamento e Streaming

### 1. **Plataformas Externas (Recomendado para MVP)**

#### a) Vimeo Pro/Plus ($12-20/mês)
- ✅ **Melhor opção para educação**
- ✅ Sem anúncios
- ✅ Controle total sobre privacidade
- ✅ Player customizável
- ✅ Analytics detalhado
- ✅ Suporta legendas/CC
- ✅ Proteção de domínio (embed apenas no seu site)
- ✅ Download controlado
- ⚠️ Custo mensal
- 📦 **500GB storage (Pro) ou 2TB (Plus)**

**Exemplo de URL:**
```
https://vimeo.com/123456789
Embed: https://player.vimeo.com/video/123456789
```

#### b) YouTube (Gratuito)
- ✅ Gratuito e ilimitado
- ✅ CDN global
- ✅ Processamento automático de qualidade
- ❌ Anúncios (mesmo em vídeos privados/não listados)
- ❌ Menos controle sobre player
- ❌ Branding do YouTube
- ⚠️ Alguns vídeos bloqueiam embed
- ⚠️ Pode ser removido pela plataforma

**Exemplo de URL:**
```
https://www.youtube.com/watch?v=kD7MXGx_jMg
Embed: https://www.youtube.com/embed/kD7MXGx_jMg
```

#### c) Wistia ($99/mês)
- ✅ **Profissional para educação corporativa**
- ✅ Analytics avançado
- ✅ Integrações marketing
- ✅ Customização completa
- ❌ Caro
- 📦 **200GB storage**

---

### 2. **Self-Hosted + CDN (Escalável)**

#### a) Bunny CDN + Stream ($10/TB transferência)
- ✅ **Melhor custo-benefício**
- ✅ CDN global rápido
- ✅ Controle total
- ✅ API completa
- ✅ HLS/DASH adaptativo
- ✅ Analytics
- ⚙️ Requer configuração
- 💰 **~$10-50/mês** (dependendo do uso)

**Exemplo de integração:**
```typescript
// Upload via API
const uploadVideo = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://video.bunnycdn.com/library/{libraryId}/videos', {
    method: 'POST',
    headers: {
      'AccessKey': 'YOUR_API_KEY'
    },
    body: formData
  });

  return response.json(); // { guid, streamUrl }
};

// Player URL
const streamUrl = `https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}`;
```

#### b) MinIO + CDN (Self-hosted)
- ✅ Open-source
- ✅ S3-compatible
- ✅ Controle total
- ⚙️ Requer infraestrutura
- ⚙️ Manutenção necessária
- 💰 **Custos de servidor** (~$20-100/mês VPS)

---

### 3. **Cloud Storage + CDN (Empresarial)**

#### a) AWS S3 + CloudFront
- ✅ Escalável infinitamente
- ✅ Confiável (99.99% uptime)
- ✅ Integrações completas
- ⚙️ Complexo de configurar
- 💰 **Pay-as-you-go** (~$50-200/mês para médio porte)

**Custos estimados (100 horas de vídeo, 1000 views/mês):**
- Storage: ~$2-5/mês
- Transfer: ~$10-30/mês
- CloudFront: ~$10-50/mês

#### b) Google Cloud Storage + CDN
- Similar ao AWS
- ✅ Integração com YouTube
- 💰 **Pay-as-you-go**

#### c) Azure Blob + CDN
- Similar ao AWS
- ✅ Bom para quem já usa Azure
- 💰 **Pay-as-you-go**

---

## 🏆 Recomendações por Cenário

### **MVP / Prototipagem (Atual)**
```
Plataforma: Vimeo Pro ($12/mês) ou YouTube (grátis)
Motivo: Rápido, simples, sem infra
Limite: ~50-100 cursos
```

**Configuração:**
1. Criar conta Vimeo Pro
2. Upload de vídeos
3. Habilitar proteção de domínio
4. Usar URLs de embed no banco

---

### **Produção (0-1000 alunos)**
```
Plataforma: Bunny CDN Stream ($10-50/mês)
Motivo: Custo-benefício, escalável
Limite: Ilimitado
```

**Vantagens:**
- Streaming adaptativo (HLS)
- Múltiplas resoluções automáticas
- Analytics incluído
- API para upload direto

---

### **Escala Enterprise (1000+ alunos)**
```
Plataforma: AWS S3 + CloudFront + MediaConvert
Motivo: Escalabilidade infinita, confiabilidade
Limite: Ilimitado
```

**Arquitetura:**
```
Upload → S3 → Lambda (Trigger) → MediaConvert (Transcode)
  ↓
  CloudFront CDN → HLS Stream → Player
```

---

## 🔧 Configuração Recomendada para DoctorQ

### **Fase 1: MVP (Atual - 3 meses)**
- ✅ **Vimeo Pro** ($12/mês)
- Razão: Sem anúncios, profissional, fácil
- Migration path: Simples (apenas trocar URLs)

### **Fase 2: Crescimento (6-12 meses)**
- ✅ **Bunny CDN Stream** ($30-100/mês)
- Razão: Escalável, custo fixo baixo
- Features: HLS, múltiplas resoluções, analytics

### **Fase 3: Escala (12+ meses)**
- ✅ **AWS S3 + CloudFront**
- Razão: Escala infinita, SLA enterprise
- Features: Redundância global, AI (transcrição, legendas)

---

## 💾 Formato de Armazenamento no Banco

### **Estrutura Atual (Mantém)**
```sql
tb_universidade_aulas (
  conteudo_url VARCHAR(500) -- URL completa do vídeo
  recursos JSONB -- Materiais + metadados de vídeo
)
```

### **Exemplo de recursos JSONB:**
```json
{
  "video": {
    "provider": "vimeo",
    "video_id": "123456789",
    "embed_url": "https://player.vimeo.com/video/123456789",
    "thumbnail": "https://...",
    "duration_seconds": 1800,
    "resolutions": ["360p", "720p", "1080p"],
    "has_subtitles": true,
    "allow_download": false
  },
  "materiais_complementares": [
    {
      "tipo": "pdf",
      "titulo": "Slides da Aula",
      "url": "https://..."
    }
  ]
}
```

---

## 🎬 Player Requirements

### **Funcionalidades Essenciais:**
- ✅ Play/Pause
- ✅ Controle de volume
- ✅ Barra de progresso
- ✅ Velocidade de reprodução (0.5x - 2x)
- ✅ Fullscreen
- ✅ Marcadores de notas

### **Funcionalidades Avançadas:**
- ✅ Qualidade adaptativa (auto, 1080p, 720p, 480p, 360p)
- ✅ Legendas/CC
- ✅ Picture-in-Picture
- ✅ Keyboard shortcuts
- ✅ Continuar de onde parou
- ✅ Prevenir skip (para certificação)

---

## 🔒 Segurança e Proteção

### **Nível 1: Básico (MVP)**
- Vídeos não-listados (YouTube/Vimeo)
- Proteção de domínio (Vimeo)

### **Nível 2: Intermediário**
- Token de autenticação nas URLs
- Expiração de links (signed URLs)
- Geolocation restriction

### **Nível 3: Avançado**
- DRM (Digital Rights Management)
- Watermarking personalizado
- Screen recording prevention

---

## 📊 Comparativo de Custos (100h de vídeo)

| Solução | Setup | Mensal | Transfer (1000 views) | Total/mês |
|---------|-------|--------|-----------------------|-----------|
| YouTube | $0 | $0 | $0 | **$0** ⚠️ com anúncios |
| Vimeo Pro | $0 | $12 | included | **$12** ✅ |
| Bunny CDN | $50 | $1 | $10 | **$61 → $11** 📈 |
| AWS S3+CF | $0 | $5 | $40 | **$45** 💰 |
| Wistia | $0 | $99 | included | **$99** 💎 |

---

## 🚀 Migração Recomendada

### **Agora (Semana 1):**
1. ✅ Criar conta Vimeo Pro
2. ✅ Re-upload dos vídeos de teste
3. ✅ Atualizar URLs no banco
4. ✅ Implementar player com suporte a iframe

### **Próximos 30 dias:**
1. Upload de todos os cursos no Vimeo
2. Configurar proteção de domínio
3. Implementar analytics de vídeo
4. Adicionar legendas

### **3-6 meses (se crescer):**
1. Avaliar migração para Bunny CDN
2. Implementar upload direto do admin
3. HLS streaming adaptativo
4. Transcodificação automática

---

## 📝 Checklist de Implementação

### **Backend:**
- [x] Campo `conteudo_url` VARCHAR(500)
- [x] Campo `recursos` JSONB
- [ ] Adicionar `video_provider` ENUM ('youtube', 'vimeo', 'bunny', 'custom')
- [ ] API para obter metadados de vídeo
- [ ] Webhook para notificação de upload completo

### **Frontend:**
- [ ] Player universal (YouTube, Vimeo, Bunny, custom)
- [ ] Detecção automática de provider
- [ ] Fallback para erro de vídeo
- [ ] Thumbnail preview
- [ ] Progress tracking
- [ ] Quality selector

### **Infraestrutura:**
- [ ] CDN para thumbnails
- [ ] Object storage para materiais complementares
- [ ] Backup de vídeos

---

## 🎯 Próximo Passo Imediato

**Ação:** Migrar vídeos de teste para Vimeo Pro

**Script de migração:**
```sql
-- Exemplo de atualização para Vimeo
UPDATE tb_universidade_aulas
SET
  conteudo_url = 'https://vimeo.com/987654321',
  recursos = jsonb_set(
    recursos,
    '{video}',
    '{"provider": "vimeo", "video_id": "987654321", "embed_url": "https://player.vimeo.com/video/987654321"}'::jsonb
  )
WHERE id_aula = '0ef876bd-fd4d-47a6-8bf9-881ce41cfc70';
```

---

## 📚 Recursos Adicionais

- [Vimeo API Docs](https://developer.vimeo.com/)
- [Bunny Stream Docs](https://docs.bunny.net/docs/stream)
- [AWS MediaConvert](https://aws.amazon.com/mediaconvert/)
- [HLS Streaming Guide](https://developer.apple.com/streaming/)

---

**Data:** 20/11/2025
**Versão:** 1.0
**Status:** ✅ Aprovado para implementação
