# 🚀 Quickstart Guide - DoctorQ Video Service

Guia rápido para iniciar o sistema de vídeo streaming self-hosted.

---

## ⚡ Start em 5 Minutos

### 1. Iniciar Serviços

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-video-service

# Subir todos os serviços (MinIO, Redis, API, Worker)
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f
```

**Aguardar**: ~30 segundos para todos os serviços inicializarem.

### 2. Verificar Status

```bash
# Health check da API
curl http://localhost:8083/health

# Readiness (verifica MinIO)
curl http://localhost:8083/ready

# Ver buckets no MinIO
docker exec doctorq-minio mc ls local/
```

**Esperado**:
- `/health` → `{"status": "healthy"}`
- `/ready` → `{"status": "ready", "minio": "connected"}`
- Buckets: `videos-raw/` e `videos-hls/`

### 3. Upload de Vídeo de Teste

```bash
# Criar arquivo de teste (se não tiver)
# Baixe um vídeo MP4 de teste ou use um existente

# Upload via API
curl -X POST http://localhost:8083/api/videos/upload \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -F "file=@seu-video.mp4" \
  -F "titulo=Video de Teste"

# Copie o video_id retornado
```

**Resposta Esperada**:
```json
{
  "video_id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "seu-video.mp4",
  "size_bytes": 52428800,
  "status": "uploaded",
  "message": "Video uploaded successfully. Transcoding started in background.",
  "uploaded_at": "2025-11-20T12:00:00"
}
```

### 4. Acompanhar Processamento

```bash
# Substitua pelo video_id real
VIDEO_ID="123e4567-e89b-12d3-a456-426614174000"

# Ver status detalhado
curl http://localhost:8083/api/videos/$VIDEO_ID/status | jq

# Polling simples (reexecutar até completar)
curl http://localhost:8083/api/videos/$VIDEO_ID/progress
```

**Status possíveis**:
- `uploaded` → Vídeo enviado, aguardando processamento
- `processing` → Transcodificando para HLS
- `completed` → ✅ Pronto para streaming
- `failed` → ❌ Erro (ver logs)

### 5. Testar Streaming

Quando `status = "completed"`:

```bash
# Obter URL do stream
curl http://localhost:8083/api/videos/$VIDEO_ID/stream | jq

# Acessar master playlist direto
curl http://localhost:8083/api/videos/$VIDEO_ID/master.m3u8
```

**URL do Player**: `http://localhost:3000/universidade/aula/{id_aula}` (após integração)

---

## 🎬 Exemplo Completo

### Script Bash Completo

```bash
#!/bin/bash

VIDEO_FILE="test-video.mp4"
API_URL="http://localhost:8083"
API_KEY="vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

# 1. Upload
echo "📤 Uploading video..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/api/videos/upload" \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@$VIDEO_FILE" \
  -F "titulo=Teste Automatico")

VIDEO_ID=$(echo $UPLOAD_RESPONSE | jq -r '.video_id')
echo "✅ Video uploaded: $VIDEO_ID"

# 2. Aguardar processamento
echo "⏳ Waiting for processing..."
while true; do
  STATUS_RESPONSE=$(curl -s "$API_URL/api/videos/$VIDEO_ID/status")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  PROGRESS=$(echo $STATUS_RESPONSE | jq -r '.progress_percent')

  echo "  Status: $STATUS ($PROGRESS%)"

  if [ "$STATUS" == "completed" ]; then
    echo "✅ Processing completed!"
    break
  elif [ "$STATUS" == "failed" ]; then
    echo "❌ Processing failed"
    echo $STATUS_RESPONSE | jq
    exit 1
  fi

  sleep 5
done

# 3. Obter stream URL
echo "🎬 Getting stream info..."
STREAM_RESPONSE=$(curl -s "$API_URL/api/videos/$VIDEO_ID/stream")
MASTER_URL=$(echo $STREAM_RESPONSE | jq -r '.master_playlist_url')

echo "✅ Stream ready:"
echo "  Video ID: $VIDEO_ID"
echo "  Master Playlist: $MASTER_URL"
echo "  Qualities: $(echo $STREAM_RESPONSE | jq -r '.qualities | join(", ")')"

# 4. Testar download do playlist
echo "🧪 Testing playlist download..."
curl -s "$MASTER_URL" | head -n 10

echo ""
echo "✅ All tests passed!"
```

Salve como `test-upload.sh`, dê permissão `chmod +x test-upload.sh` e execute:

```bash
./test-upload.sh
```

---

## 🔍 Debugging

### Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas API
docker-compose logs -f video-api

# Apenas Worker
docker-compose logs -f video-worker

# MinIO
docker-compose logs -f minio
```

### Acessar Redis

```bash
docker exec -it doctorq-redis redis-cli

# Listar todos os vídeos
KEYS video:*

# Ver metadata de um vídeo
HGETALL video:123e4567-e89b-12d3-a456-426614174000

# Ver apenas status
HGET video:123e4567-e89b-12d3-a456-426614174000 status

# Ver progresso
HGET video:123e4567-e89b-12d3-a456-426614174000 progress_percent
```

### Acessar MinIO Console

1. Abrir: http://localhost:9001
2. Login:
   - **Username**: `doctorq_admin`
   - **Password**: `doctorq_minio_2025_secure`
3. Navegar:
   - **videos-raw**: Vídeos originais (privado)
   - **videos-hls**: HLS transcodificado (público)

### Verificar FFmpeg

```bash
# Entrar no container
docker exec -it doctorq-video-api bash

# Testar FFmpeg
ffmpeg -version

# Ver codecs disponíveis
ffmpeg -codecs | grep h264
```

---

## 🧪 Testes Rápidos

### 1. Health Checks

```bash
curl http://localhost:8083/health        # API health
curl http://localhost:8083/ready         # MinIO check
curl http://localhost:9000/minio/health/live  # MinIO direct
docker exec doctorq-redis redis-cli ping  # Redis
```

### 2. Upload Pequeno

```bash
# Criar vídeo de teste de 5 segundos
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=5 \
  -vcodec libx264 -acodec aac -shortest test-5s.mp4

# Upload
curl -X POST http://localhost:8083/api/videos/upload \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -F "file=@test-5s.mp4"
```

### 3. Teste de Carga (múltiplos uploads)

```bash
for i in {1..5}; do
  echo "Upload $i/5..."
  curl -X POST http://localhost:8083/api/videos/upload \
    -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
    -F "file=@test-video.mp4" \
    -F "titulo=Video $i" &
done
wait
echo "✅ All uploads started"
```

---

## 🛠️ Comandos Úteis

### Reiniciar Serviços

```bash
docker-compose restart video-api    # Apenas API
docker-compose restart video-worker # Apenas Worker
docker-compose restart              # Todos
```

### Limpar e Recomeçar

```bash
# Parar tudo
docker-compose down

# Remover volumes (⚠️ apaga vídeos!)
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache

# Iniciar novamente
docker-compose up -d
```

### Ver Uso de Recursos

```bash
docker stats doctorq-video-api doctorq-video-worker doctorq-minio doctorq-redis
```

---

## 📱 Integração Frontend

### Adicionar Variável de Ambiente

**Arquivo**: `/mnt/repositorios/DoctorQ/estetiQ-web/.env.local`

```bash
NEXT_PUBLIC_VIDEO_API_URL=http://localhost:8083
```

### Usar Component

```tsx
import { VideoPlayerHLS } from '@/components/universidade/VideoPlayerHLS';

<VideoPlayerHLS
  videoId="123e4567-e89b-12d3-a456-426614174000"
  titulo="Minha Aula"
/>
```

### Verificar no Browser

1. Abrir: http://localhost:3000/universidade/cursos/toxina-botulinica-avancada
2. Clicar em "Preview" de uma aula
3. Confirmar que player HLS aparece

---

## ❓ FAQ

### Quanto tempo leva para processar um vídeo?

- **5 min de vídeo**: ~2-3 minutos
- **30 min de vídeo**: ~10-15 minutos
- **1 hora de vídeo**: ~20-30 minutos

Depende da CPU disponível e configuração do FFmpeg (`FFMPEG_THREADS`).

### Posso processar múltiplos vídeos simultaneamente?

Sim! O worker processa em background. Por padrão, 2 workers paralelos (`concurrency=2` no docker-compose). Aumente se tiver CPU disponível:

```yaml
# docker-compose.yml
video-worker:
  command: celery -A src.workers.celery_app worker --loglevel=info --concurrency=4
```

### Quais formatos são suportados?

- **Entrada**: mp4, mov, avi, mkv, webm
- **Saída**: HLS (H.264 + AAC)

### Como mudar as qualidades geradas?

Edite `docker-compose.yml`:

```yaml
environment:
  VIDEO_QUALITIES: "1080p,720p,480p"  # Remover 360p, por exemplo
```

### O vídeo original é mantido?

Sim, em `videos-raw` bucket (privado). Pode ser removido após processamento se quiser economizar espaço.

---

## ✅ Checklist de Validação

Antes de usar em produção, verificar:

- [ ] Todos os serviços sobem com `docker-compose up -d`
- [ ] Health checks retornam `healthy`
- [ ] Upload funciona
- [ ] Processamento completa (`status = completed`)
- [ ] Stream URL é acessível
- [ ] Player frontend carrega vídeo HLS
- [ ] Qualidades múltiplas aparecem no player
- [ ] Controles funcionam (play, pause, seek, volume)
- [ ] Progresso é salvo corretamente

---

**Pronto para uso! 🎉**

Se encontrar problemas, consulte:
- [README.md](./README.md) - Documentação completa
- [IMPLEMENTACAO_VIDEO_STREAMING_SELF_HOSTED.md](../DOC_Arquitetura/IMPLEMENTACAO_VIDEO_STREAMING_SELF_HOSTED.md) - Arquitetura detalhada
