# DoctorQ Video Service

Sistema self-hosted de streaming de vídeo com transcodificação HLS adaptativa.

## 🎯 Características

- ✅ **Self-Hosted**: Controle total sobre infraestrutura e dados
- ✅ **HLS Streaming**: Adaptive bitrate streaming (1080p, 720p, 480p, 360p)
- ✅ **MinIO Storage**: S3-compatible object storage
- ✅ **FFmpeg Processing**: Transcodificação profissional
- ✅ **Redis Queue**: Processamento assíncrono
- ✅ **FastAPI Backend**: API moderna e rápida
- ✅ **React Player**: Player HLS com hls.js

## 📋 Pré-requisitos

- Docker e Docker Compose
- 10GB+ espaço em disco (para vídeos)
- 4GB+ RAM recomendado
- CPU com 2+ cores

## 🚀 Início Rápido

### 1. Clone e configure

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-video-service

# Criar arquivo .env (opcional, padrões já configurados no docker-compose)
cp .env.example .env
```

### 2. Inicie os serviços com Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar status
docker-compose ps
```

### 3. Acesse as interfaces

- **Video API**: http://localhost:8083/docs
- **MinIO Console**: http://localhost:9001 (usuário: `doctorq_admin`, senha: `doctorq_minio_2025_secure`)
- **Redis**: localhost:6379

## 📁 Estrutura do Projeto

```
estetiQ-video-service/
├── docker-compose.yml      # Orquestração de serviços
├── Dockerfile              # Imagem da aplicação
├── pyproject.toml          # Dependências Python
├── src/
│   ├── main.py            # FastAPI application
│   ├── api/               # API endpoints
│   │   ├── upload.py      # Upload de vídeos
│   │   ├── stream.py      # Streaming HLS
│   │   └── status.py      # Status de processamento
│   ├── config/            # Configurações
│   │   ├── settings.py
│   │   ├── logger.py
│   │   ├── minio_client.py
│   │   └── redis_client.py
│   ├── utils/             # Utilitários
│   │   └── ffmpeg_wrapper.py  # Wrapper do FFmpeg
│   └── workers/           # Workers de processamento
│       └── video_processor.py
└── README.md
```

## 🎬 Fluxo de Upload e Processamento

```
1. Upload → POST /api/videos/upload
   ├── Salva vídeo no MinIO (bucket: videos-raw)
   ├── Gera ID único
   └── Inicia processamento em background

2. Processing (Background Task)
   ├── Download do vídeo do MinIO
   ├── Análise com ffprobe (duração, resolução, codec)
   ├── Geração de thumbnail (5s)
   ├── Transcodificação HLS (múltiplas qualidades)
   │   ├── 1080p @ 5000 kbps
   │   ├── 720p @ 2800 kbps
   │   ├── 480p @ 1400 kbps
   │   └── 360p @ 800 kbps
   ├── Upload HLS files para MinIO (bucket: videos-hls)
   └── Atualiza status para "completed"

3. Streaming → GET /api/videos/{video_id}/stream
   ├── Retorna URL do master playlist
   ├── HLS player faz requisições adaptativas
   └── MinIO serve os segments (.ts files)
```

## 📡 API Endpoints

### Upload de Vídeo

```bash
POST /api/videos/upload
Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
Content-Type: multipart/form-data

Body:
- file: <video_file>
- id_aula: <optional_lesson_id>
- titulo: <optional_title>

Response:
{
  "video_id": "uuid",
  "filename": "video.mp4",
  "size_bytes": 123456789,
  "status": "uploaded",
  "message": "Video uploaded successfully. Transcoding started in background.",
  "uploaded_at": "2025-11-20T12:00:00"
}
```

### Status de Processamento

```bash
GET /api/videos/{video_id}/status

Response:
{
  "video_id": "uuid",
  "status": "processing|completed|failed",
  "filename": "video.mp4",
  "size_bytes": 123456789,
  "uploaded_at": "...",
  "processing_started_at": "...",
  "completed_at": "...",
  "progress_percent": 75,
  "current_step": "Transcoding to HLS",
  "hls_qualities": ["1080p", "720p", "480p", "360p"],
  "duration_seconds": 1800.5
}
```

### Stream Info

```bash
GET /api/videos/{video_id}/stream

Response:
{
  "video_id": "uuid",
  "master_playlist_url": "https://minio:9000/...",
  "qualities": ["1080p", "720p", "480p", "360p"],
  "status": "completed",
  "thumbnail_url": "https://minio:9000/..."
}
```

### Master Playlist (HLS)

```bash
GET /api/videos/{video_id}/master.m3u8
→ Redireciona para MinIO presigned URL
```

## 🎨 Frontend Integration

### Usando o VideoPlayerHLS Component

```tsx
import { VideoPlayerHLS } from '@/components/universidade/VideoPlayerHLS';

<VideoPlayerHLS
  videoId="uuid-do-video"
  titulo="Aula de Toxina Botulínica"
  onProgress={(segundos, percentual) => {
    console.log(`Progresso: ${percentual}%`);
  }}
  onComplete={() => {
    console.log('Vídeo concluído!');
  }}
/>
```

### Ou com URL pré-fetched

```tsx
const streamInfo = await fetch(`/api/videos/${videoId}/stream`).then(r => r.json());

<VideoPlayerHLS
  videoId={videoId}
  streamUrl={streamInfo.master_playlist_url}
  titulo="Minha Aula"
/>
```

## 🗄️ Banco de Dados

### Atualizar Schema

```sql
-- Adicionar campos de vídeo HLS
ALTER TABLE tb_universidade_aulas
ADD COLUMN IF NOT EXISTS video_provider VARCHAR(50) DEFAULT 'hls',
ADD COLUMN IF NOT EXISTS video_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS video_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS video_processing_progress INTEGER DEFAULT 0;

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_aulas_video_id ON tb_universidade_aulas(video_id);
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```bash
# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=doctorq_admin
MINIO_SECRET_KEY=doctorq_minio_2025_secure
MINIO_SECURE=false
MINIO_BUCKET_RAW=videos-raw
MINIO_BUCKET_HLS=videos-hls

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/doctorq_univ

# FFmpeg
FFMPEG_THREADS=4
HLS_SEGMENT_DURATION=10
VIDEO_QUALITIES=1080p,720p,480p,360p

# API
API_HOST=0.0.0.0
API_PORT=8083
API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

## 📊 Monitoramento

### Ver status dos serviços

```bash
# Health check
curl http://localhost:8083/health

# Readiness (verifica MinIO)
curl http://localhost:8083/ready

# MinIO health
docker exec doctorq-minio mc admin info local
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas API
docker-compose logs -f video-api

# Apenas Worker
docker-compose logs -f video-worker
```

### Redis (ver progresso)

```bash
docker exec -it doctorq-redis redis-cli

# Listar vídeos
KEYS video:*

# Ver metadata de um vídeo
HGETALL video:uuid-do-video

# Ver status
HGET video:uuid-do-video status
HGET video:uuid-do-video progress_percent
```

## 🧪 Testes

### Upload de teste

```bash
curl -X POST http://localhost:8083/api/videos/upload \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -F "file=@test-video.mp4" \
  -F "titulo=Video de Teste"
```

### Verificar processamento

```bash
VIDEO_ID="uuid-retornado"

# Status
curl http://localhost:8083/api/videos/$VIDEO_ID/status | jq

# Stream (quando completo)
curl http://localhost:8083/api/videos/$VIDEO_ID/stream | jq
```

## 🐛 Troubleshooting

### MinIO não conecta

```bash
# Verificar se MinIO está rodando
docker ps | grep minio

# Verificar buckets
docker exec doctorq-minio mc ls local/
```

### FFmpeg falha no transcoding

```bash
# Ver logs do worker
docker-compose logs video-worker

# Verificar FFmpeg está instalado
docker exec doctorq-video-api ffmpeg -version
```

### Vídeo não carrega no player

1. Verificar status: `GET /api/videos/{id}/status`
2. Se `status = "completed"`, verificar URL do master playlist
3. Verificar console do navegador para erros HLS
4. Confirmar que bucket `videos-hls` está público

## 📈 Escalabilidade

### Produção

1. **Usar CDN**: Configure MinIO com CloudFlare ou CloudFront
2. **Workers paralelos**: Aumente `concurrency` do Celery
3. **Storage externo**: Use S3 ao invés de MinIO local
4. **Load Balancer**: Nginx na frente da API

### Otimizações

```yaml
# docker-compose.yml
video-worker:
  deploy:
    replicas: 4  # Múltiplos workers
  environment:
    FFMPEG_THREADS: 8  # Mais threads por vídeo
```

## 💰 Custos Estimados

**Self-Hosted (VPS):**
- VPS 4GB RAM: ~$20-40/mês
- Storage (500GB): ~$10-20/mês
- **Total**: ~$30-60/mês

**vs. Vimeo Pro**: $12/mês (500GB, limitado)

## 📚 Recursos

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [hls.js GitHub](https://github.com/video-dev/hls.js/)

## 🔒 Segurança

- ✅ API Key authentication
- ✅ Presigned URLs (expiram em 24h)
- ✅ Buckets privados (raw) e públicos (hls)
- ✅ CORS configurado

### Melhorias Futuras

- [ ] Adicionar DRM (Widevine, FairPlay)
- [ ] Watermarking personalizado
- [ ] Controle de acesso por usuário
- [ ] Analytics de visualizações

---

**Desenvolvido por**: DoctorQ Team
**Versão**: 1.0.0
**Data**: 20/11/2025
