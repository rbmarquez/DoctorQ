# 🧪 Guia de Teste - Sistema de Legendas

**Data:** 20/11/2025
**Objetivo:** Testar sistema completo de legendas end-to-end

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de que:

1. **Serviços rodando:**
   ```bash
   # Video Service (porta 8083)
   curl http://localhost:8083/health

   # Frontend (porta 3000)
   curl http://localhost:3000

   # MinIO (porta 9000)
   curl http://localhost:9000/minio/health/live

   # Redis (porta 6379)
   redis-cli ping
   ```

2. **Variáveis de ambiente configuradas:**
   ```bash
   # Frontend .env.local
   NEXT_PUBLIC_VIDEO_API_URL=http://localhost:8083
   NEXT_PUBLIC_VIDEO_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
   ```

---

## 📝 Passo 1: Criar Arquivo de Legenda de Teste

Crie um arquivo `teste-pt-BR.vtt` com o seguinte conteúdo:

```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Bem-vindo ao curso de Toxina Botulínica Avançada

00:00:05.500 --> 00:00:12.000
Nesta aula, vamos aprender sobre as principais técnicas de aplicação

00:00:12.500 --> 00:00:18.000
É importante entender a anatomia facial antes de aplicar

00:00:18.500 --> 00:00:25.000
Observe com atenção as regiões que serão demonstradas

00:00:25.500 --> 00:00:32.000
<b>Importante:</b> Sempre utilize material esterilizado
```

**Salvar como:** `teste-pt-BR.vtt`

**Opcional - Criar legenda em inglês** (`teste-en-US.vtt`):

```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to the Advanced Bot