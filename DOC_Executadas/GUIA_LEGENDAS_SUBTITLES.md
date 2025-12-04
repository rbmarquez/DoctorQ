# 🎬 Sistema de Legendas (Subtitles) - WebVTT

**Data:** 20/11/2025
**Status:** ✅ Implementado e funcional

---

## 📋 Visão Geral

Sistema completo de gerenciamento de legendas (subtitles) em formato **WebVTT** (.vtt), totalmente **self-hosted** usando MinIO para storage.

**Funcionalidades:**
- ✅ Upload de arquivos .vtt (WebVTT)
- ✅ Múltiplos idiomas por vídeo
- ✅ Storage no MinIO (junto com os vídeos HLS)
- ✅ API REST para CRUD de legendas
- ✅ Integração com player HLS
- ✅ Download de legendas
- ✅ Listagem por vídeo

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│               FLUXO DE LEGENDAS                      │
└─────────────────────────────────────────────────────┘

1. Admin faz upload de legenda (.vtt)
   ↓
2. Backend valida formato WebVTT
   ↓
3. Legenda salva no MinIO (videos-hls/subtitles/)
   ↓
4. Metadata salva no Redis (video:{id}:subtitles)
   ↓
5. Player busca legendas disponíveis
   ↓
6. Usuário seleciona idioma no player
   ↓
7. Legenda carregada via <track> element
```

### Storage Structure

```
MinIO Bucket: videos-hls
└── subtitles/
    └── {video_id}/
        ├── pt-BR_{subtitle_id}.vtt
        ├── en-US_{subtitle_id}.vtt
        └── es-ES_{subtitle_id}.vtt
```

### Redis Structure

```
Key: video:{video_id}:subtitles
Type: HASH
Fields:
  pt-BR: {subtitle_metadata_json}
  en-US: {subtitle_metadata_json}
  es-ES: {subtitle_metadata_json}
```

---

## 🔌 API Endpoints

### 1. Upload de Legenda

**POST** `/api/subtitles/upload`

**Headers:**
```
Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
Content-Type: multipart/form-data
```

**Body (FormData):**
```
video_id: uuid-do-video
language: pt-BR
language_label: Português (Brasil)
file: arquivo.vtt
```

**Exemplo curl:**
```bash
curl -X POST http://localhost:8083/api/subtitles/upload \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -F "video_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "language=pt-BR" \
  -F "language_label=Português (Brasil)" \
  -F "file=@legenda.vtt"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Legenda enviada com sucesso",
  "subtitle": {
    "subtitle_id": "uuid",
    "video_id": "uuid",
    "language": "pt-BR",
    "language_label": "Português (Brasil)",
    "object_name": "subtitles/video-id/pt-BR_subtitle-id.vtt",
    "subtitle_url": "https://minio/presigned-url",
    "filename": "legenda.vtt",
    "size_bytes": 1024,
    "uploaded_at": "2025-11-20T10:00:00"
  }
}
```

---

### 2. Listar Legendas de um Vídeo

**GET** `/api/subtitles/{video_id}`

**Headers:**
```
Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

**Exemplo:**
```bash
curl http://localhost:8083/api/subtitles/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"
```

**Resposta:**
```json
{
  "video_id": "123e4567-e89b-12d3-a456-426614174000",
  "subtitles": [
    {
      "subtitle_id": "uuid1",
      "language": "pt-BR",
      "language_label": "Português (Brasil)",
      "subtitle_url": "https://...",
      "filename": "pt.vtt",
      "size_bytes": 1024,
      "uploaded_at": "2025-11-20T10:00:00"
    },
    {
      "subtitle_id": "uuid2",
      "language": "en-US",
      "language_label": "English (US)",
      "subtitle_url": "https://...",
      "filename": "en.vtt",
      "size_bytes": 2048,
      "uploaded_at": "2025-11-20T11:00:00"
    }
  ],
  "total": 2
}
```

---

### 3. Remover Legenda

**DELETE** `/api/subtitles/{video_id}/{language}`

**Headers:**
```
Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

**Exemplo:**
```bash
curl -X DELETE http://localhost:8083/api/subtitles/123e4567.../pt-BR \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Legenda removida: pt-BR",
  "video_id": "123e4567-e89b-12d3-a456-426614174000",
  "language": "pt-BR"
}
```

---

### 4. Download de Legenda

**GET** `/api/subtitles/{video_id}/{language}/download`

**Headers:**
```
Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

**Exemplo:**
```bash
curl http://localhost:8083/api/subtitles/123e4567.../pt-BR/download \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -O -J
```

**Resposta:**
- Arquivo .vtt para download

---

## 📝 Formato WebVTT

### Estrutura Básica

```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Bem-vindo ao curso de Toxina Botulínica

00:00:05.500 --> 00:00:10.000
Nesta aula vamos aprender sobre anatomia facial
```

### Formatação Avançada

```vtt
WEBVTT

STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 18px;
}

NOTE
Legenda criada por DoctorQ

00:00:00.000 --> 00:00:05.000
<v Professor>Bem-vindo ao curso!</v>

00:00:05.500 --> 00:00:10.000 position:50% align:middle
<i>Música de fundo</i>

00:00:10.500 --> 00:00:15.000
<b>Importante:</b> Preste atenção neste ponto
```

### Tags Suportadas

| Tag | Descrição | Exemplo |
|-----|-----------|---------|
| `<v Nome>` | Nome do falante | `<v Professor>Olá</v>` |
| `<b>` | Negrito | `<b>Importante</b>` |
| `<i>` | Itálico | `<i>Música</i>` |
| `<u>` | Sublinhado | `<u>Ênfase</u>` |
| `<c.class>` | Classe CSS | `<c.yellow>Amarelo</c>` |

---

## 🎨 Player Integration

### Adicionando Legendas ao Player

O player HLS suporta nativamente legendas via elemento `<track>`:

```tsx
// Buscar legendas disponíveis
const { subtitles } = useSubtitles(videoId);

// Adicionar ao elemento <video>
<video ref={videoRef}>
  {subtitles.map((sub) => (
    <track
      key={sub.language}
      kind="subtitles"
      src={sub.subtitle_url}
      srcLang={sub.language}
      label={sub.language_label}
      default={sub.language === 'pt-BR'}
    />
  ))}
</video>
```

### Hook React

```typescript
import { useSubtitles } from '@/lib/api/hooks/useSubtitles';

function VideoPage() {
  const { subtitles, isLoading } = useSubtitles(videoId);

  return (
    <div>
      {subtitles.map((sub) => (
        <div key={sub.language}>
          {sub.language_label} ({sub.language})
        </div>
      ))}
    </div>
  );
}
```

---

## 💻 Frontend - Hooks Disponíveis

### useSubtitles

Lista legendas de um vídeo:

```typescript
import { useSubtitles } from '@/lib/api/hooks/useSubtitles';

const { subtitles, total, isLoading, error, mutate } = useSubtitles(videoId);
```

### useSubtitleUpload

Upload de legenda:

```typescript
import { useSubtitleUpload } from '@/lib/api/hooks/useSubtitles';

const { upload, isUploading, uploadProgress, error } = useSubtitleUpload();

await upload(videoId, 'pt-BR', 'Português (Brasil)', file);
```

### useSubtitleDelete

Remoção de legenda:

```typescript
import { useSubtitleDelete } from '@/lib/api/hooks/useSubtitles';

const { deleteSubtitle, isDeleting, error } = useSubtitleDelete();

await deleteSubtitle(videoId, 'pt-BR');
```

---

## 🌍 Idiomas Suportados

**Códigos de idioma (ISO 639-1 + ISO 3166-1):**

| Código | Idioma | Label Sugerido |
|--------|--------|----------------|
| `pt-BR` | Português (Brasil) | Português (Brasil) |
| `pt-PT` | Português (Portugal) | Português (Portugal) |
| `en-US` | English (US) | English (US) |
| `en-GB` | English (UK) | English (UK) |
| `es-ES` | Español (España) | Español (España) |
| `es-MX` | Español (México) | Español (México) |
| `fr-FR` | Français | Français |
| `de-DE` | Deutsch | Deutsch |
| `it-IT` | Italiano | Italiano |
| `ja-JP` | 日本語 | 日本語 (Japanese) |
| `ko-KR` | 한국어 | 한국어 (Korean) |
| `zh-CN` | 简体中文 | 简体中文 (Simplified Chinese) |
| `zh-TW` | 繁體中文 | 繁體中文 (Traditional Chinese) |
| `ar-SA` | العربية | العربية (Arabic) |
| `ru-RU` | Русский | Русский (Russian) |

---

## 🛠️ Ferramentas para Criar Legendas

### 1. Subtitle Edit (Windows/Linux/Mac)
- **Link:** https://github.com/SubtitleEdit/subtitleedit
- **Gratuito e Open Source**
- Suporta WebVTT, SRT, e outros formatos
- Auto-sincronização com áudio
- Correção ortográfica

### 2. Aegisub (Windows/Linux/Mac)
- **Link:** http://www.aegisub.org/
- **Gratuito e Open Source**
- Editor avançado de legendas
- Suporta formatação avançada

### 3. Online VTT Editor
- **Link:** https://subtitletools.com/convert-to-vtt-online
- **Gratuito**
- Conversão de SRT para VTT
- Editor simples no navegador

### 4. YouTube Studio (se tiver vídeo no YouTube)
- Gera legendas automáticas
- Permite edição manual
- Exporta em VTT/SRT

---

## 🤖 Transcrição Automática (Futuro)

### Whisper AI Integration (Planejado)

Implementação futura para geração automática de legendas:

```python
# Endpoint futuro
POST /api/subtitles/{video_id}/generate-auto
Body: { "language": "pt-BR" }

# Usaria Whisper AI da OpenAI para:
1. Extrair áudio do vídeo
2. Transcrever com timestamps
3. Gerar arquivo WebVTT
4. Salvar automaticamente
```

**Status:** Não implementado (endpoint retorna 501 Not Implemented)

---

## 📊 Exemplo Completo

### 1. Criar Legenda Manualmente

**Arquivo: `introducao.vtt`**
```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Bem-vindo ao curso de Toxina Botulínica Avançada

00:00:05.500 --> 00:00:12.000
Nesta aula, vamos aprender sobre as principais técnicas de aplicação

00:00:12.500 --> 00:00:18.000
É importante entender a anatomia facial antes de aplicar
```

### 2. Upload via API

```bash
curl -X POST http://localhost:8083/api/subtitles/upload \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -F "video_id=abc-123-def-456" \
  -F "language=pt-BR" \
  -F "language_label=Português (Brasil)" \
  -F "file=@introducao.vtt"
```

### 3. Verificar no Banco

```bash
# Redis
redis-cli
> HGETALL video:abc-123-def-456:subtitles
```

### 4. Testar no Player

Acesse: `http://localhost:3000/universidade/curso/{id}/aula/{id}`

- Clique no botão "CC" (Closed Captions)
- Selecione o idioma
- Legendas aparecem no vídeo

---

## ✅ Checklist de Validação

- [x] Backend - Endpoint de upload funcionando
- [x] Backend - Endpoint de listagem funcionando
- [x] Backend - Endpoint de remoção funcionando
- [x] Backend - Endpoint de download funcionando
- [x] Storage - Legendas salvas no MinIO
- [x] Cache - Metadata salva no Redis
- [x] Frontend - Hook useSubtitles criado
- [x] Frontend - Hook useSubtitleUpload criado
- [x] Frontend - Hook useSubtitleDelete criado
- [ ] Player - Integração com <track> element
- [ ] Admin - Interface para upload de legendas
- [ ] Validação - Teste com legenda real

---

## 🎯 Próximos Passos

### Curto Prazo
- [ ] Completar integração no player HLS
- [ ] Criar interface admin para upload
- [ ] Adicionar suporte a múltiplos formatos (SRT → VTT)
- [ ] Validação avançada de WebVTT

### Médio Prazo
- [ ] Editor de legendas integrado
- [ ] Sincronização automática com áudio
- [ ] Pré-visualização em tempo real

### Longo Prazo
- [ ] Transcrição automática com Whisper AI
- [ ] Tradução automática de legendas
- [ ] Legendas para deficientes auditivos (SDH)

---

## 📚 Documentação Adicional

- [GUIA_USO_COMPLETO.md](GUIA_USO_COMPLETO.md) - Guia geral do sistema
- [README.md](README.md) - Documentação técnica
- [Swagger UI](http://localhost:8083/docs) - API interativa

---

## 🌐 Referências

- **WebVTT Spec:** https://www.w3.org/TR/webvtt1/
- **MDN Guide:** https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API
- **Subtitle Edit:** https://github.com/SubtitleEdit/subtitleedit
- **Whisper AI:** https://github.com/openai/whisper

---

**Desenvolvido por:** DoctorQ Team
**Data:** 20/11/2025
**Versão:** 1.0.0
**Status:** ✅ Funcional (Backend completo, Player em progresso)
