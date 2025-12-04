# 📦 Migração de Vídeos do Vimeo para HLS

Este diretório contém scripts para migrar vídeos do Vimeo para o sistema HLS self-hosted.

## 📋 Pré-requisitos

### 1. Obter Access Token do Vimeo

Você precisa de um **Vimeo Access Token** com permissões de leitura para baixar vídeos.

**Como obter:**

1. Acesse: https://developer.vimeo.com/apps
2. Crie um novo app ou use um existente
3. Vá em **Authentication** → **Generate an Access Token**
4. Marque as permissões:
   - ✅ `private` - Acessar vídeos privados
   - ✅ `video_files` - Download de arquivos de vídeo
5. Copie o token gerado

**Configure o token:**

```bash
export VIMEO_ACCESS_TOKEN='seu_token_aqui'
```

### 2. Verificar Serviços

Certifique-se de que os seguintes serviços estão rodando:

```bash
# Video Service (porta 8083)
curl http://localhost:8083/health

# API Universidade (porta 8081)
curl http://localhost:8081/health

# PostgreSQL (10.11.2.81:5432)
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ -c "SELECT 1"

# MinIO (porta 9000)
curl http://localhost:9000/minio/health/live

# Redis (porta 6379)
redis-cli -h localhost -p 6379 ping
```

## 🚀 Uso do Script

### Dry Run (Simulação)

**Recomendado:** Execute primeiro em modo dry-run para ver o que seria feito:

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-video-service

python scripts/migrate_from_vimeo.py --dry-run
```

Isso irá:
- ✅ Listar todas as aulas com vídeos do Vimeo
- ✅ Mostrar quantas aulas seriam migradas
- ❌ **NÃO irá** baixar ou fazer upload de nenhum vídeo

### Migração de Teste (Limitada)

Teste com um número pequeno de vídeos primeiro:

```bash
# Migrar apenas 1 vídeo (teste)
python scripts/migrate_from_vimeo.py --limit 1

# Migrar 5 vídeos
python scripts/migrate_from_vimeo.py --limit 5
```

### Migração Completa

Após testar, execute a migração completa:

```bash
python scripts/migrate_from_vimeo.py
```

**⚠️ ATENÇÃO:**
- A migração pode demorar bastante (download + upload + processamento)
- Cada vídeo leva vários minutos dependendo do tamanho
- O script aguarda 5 segundos entre cada vídeo para não sobrecarregar

## 📊 O que o Script Faz

### 1. Listagem (SELECT)
```sql
SELECT * FROM tb_universidade_aulas
WHERE video_provider = 'vimeo'
ORDER BY titulo;
```

### 2. Para cada aula encontrada:

**a) Download do Vimeo:**
- Usa API do Vimeo para obter link de download
- Baixa a melhor qualidade disponível
- Salva temporariamente em `/tmp/vimeo_migration/{id_aula}.mp4`
- Mostra progresso do download

**b) Upload para Sistema HLS:**
- Envia arquivo via `POST /api/videos/upload`
- Inclui metadados (`titulo`, `id_aula`)
- Retorna `video_id` do novo sistema

**c) Atualização do Banco:**
```sql
UPDATE tb_universidade_aulas
SET
    video_provider = 'hls',
    video_id = '{novo_video_id}',
    video_status = 'processing',
    video_processing_progress = 0,
    video_metadata = jsonb_build_object(
        'migrated_from', 'vimeo',
        'original_vimeo_id', '{vimeo_id_antigo}',
        'upload_response', '{...}'
    )
WHERE id_aula = '{id_aula}';
```

**d) Limpeza:**
- Remove arquivo temporário
- Aguarda 5 segundos antes do próximo

### 3. Relatório Final

Exibe estatísticas:
```
📊 RELATÓRIO FINAL
================================================================================
Total de aulas: 10
✅ Sucessos: 9
❌ Falhas: 1
================================================================================
```

## 📁 Estrutura de Arquivos

```
scripts/
├── migrate_from_vimeo.py      # Script principal de migração
├── README_MIGRATION.md         # Este arquivo (guia de uso)
└── check_vimeo_videos.py      # Script auxiliar para listar vídeos (opcional)
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente

Você pode customizar via variáveis de ambiente:

```bash
# Token do Vimeo (OBRIGATÓRIO)
export VIMEO_ACCESS_TOKEN='seu_token'

# URL da API de Vídeo (padrão: http://localhost:8083)
export VIDEO_API_URL='http://localhost:8083'

# API Key do Video Service (padrão: vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX)
export API_KEY='sua_api_key'

# Database URL (padrão: postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/doctorq_univ)
export DATABASE_URL='postgresql+asyncpg://user:pass@host:5432/db'
```

### Diretório de Download Temporário

Por padrão, vídeos são baixados em `/tmp/vimeo_migration/`.

Para mudar, edite no script:
```python
TEMP_DOWNLOAD_DIR = Path("/seu/caminho/customizado")
```

## ❓ Troubleshooting

### Erro: "VIMEO_ACCESS_TOKEN não configurado"

**Solução:**
```bash
export VIMEO_ACCESS_TOKEN='seu_token'
```

### Erro: "Nenhum arquivo de download disponível"

**Causa:** Vídeo no Vimeo não tem arquivos de download habilitados.

**Solução:**
1. Vá ao vídeo no Vimeo
2. Settings → Distribution → Enable download
3. Ou use um token com permissões de owner do vídeo

### Erro: "Upload failed: 413 Payload Too Large"

**Causa:** Vídeo muito grande para upload.

**Solução:**
- Aumentar `MAX_UPLOAD_SIZE_MB` no `.env` do video service
- Ou dividir a migração em lotes menores

### Erro: "Connection timeout"

**Causa:** Download ou upload demorou muito.

**Solução:**
- Script já usa timeout de 5 minutos (300s) para download
- E 10 minutos (600s) para upload
- Se ainda assim falhar, vídeo pode ser muito grande
- Considere aumentar timeouts no código

### Script travou / não progride

**Verificar:**

1. **Video Service está rodando?**
   ```bash
   curl http://localhost:8083/health
   ```

2. **Redis está rodando?**
   ```bash
   redis-cli ping
   ```

3. **MinIO está acessível?**
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

4. **Espaço em disco?**
   ```bash
   df -h /tmp
   ```

### Migração falhou no meio

**O que acontece:**
- Vídeos já migrados permanecem migrados
- Vídeos não migrados ainda têm `video_provider = 'vimeo'`
- Você pode re-executar o script com segurança

**Para recomeçar:**
```bash
# O script ignora automaticamente aulas que já foram migradas
# Apenas re-execute:
python scripts/migrate_from_vimeo.py
```

## 📈 Monitoramento do Processamento

Após o upload, os vídeos entram na fila de processamento HLS.

**Verificar progresso:**

1. **Via API:**
   ```bash
   curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
     http://localhost:8083/api/videos/{video_id}/status
   ```

2. **Via Redis:**
   ```bash
   redis-cli -h localhost -p 6379
   > KEYS video:*
   > HGETALL video:{video_id}
   ```

3. **Via Banco de Dados:**
   ```sql
   SELECT
       titulo,
       video_status,
       video_processing_progress,
       video_metadata
   FROM tb_universidade_aulas
   WHERE video_provider = 'hls'
   ORDER BY titulo;
   ```

4. **Via Interface Admin:**
   - Acesse: http://localhost:3000/admin/universidade/videos
   - Veja lista de vídeos em processamento
   - Progresso em tempo real

## ✅ Validação Pós-Migração

Após concluir a migração, valide:

### 1. Verificar Banco de Dados

```sql
-- Contar vídeos migrados
SELECT
    video_provider,
    COUNT(*) as total,
    COUNT(CASE WHEN video_status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN video_status = 'processing' THEN 1 END) as processing,
    COUNT(CASE WHEN video_status = 'failed' THEN 1 END) as failed
FROM tb_universidade_aulas
WHERE video_provider IN ('vimeo', 'hls')
GROUP BY video_provider;
```

**Resultado esperado:**
```
video_provider | total | completed | processing | failed
----------------|-------|-----------|------------|-------
hls            |   50  |    48     |     2      |   0
vimeo          |    0  |     0     |     0      |   0
```

### 2. Testar Playback

Acesse uma aula migrada:
```
http://localhost:3000/universidade/curso/{id_curso}/aula/{id_aula}
```

Verifique:
- ✅ Player HLS é renderizado
- ✅ Vídeo carrega
- ✅ Seleção de qualidade funciona (1080p, 720p, 480p, 360p)
- ✅ Controles funcionam (play, pause, volume, fullscreen)

### 3. Verificar MinIO

```bash
# Listar buckets
mc ls myminio

# Listar vídeos raw
mc ls myminio/videos-raw

# Listar vídeos HLS processados
mc ls myminio/videos-hls
```

## 🔄 Rollback (Se Necessário)

Se algo der errado e você quiser reverter:

```sql
-- Reverter aulas para Vimeo (use com cuidado!)
UPDATE tb_universidade_aulas
SET
    video_provider = 'vimeo',
    video_id = video_metadata->>'original_vimeo_id',
    video_status = NULL,
    video_processing_progress = NULL,
    video_metadata = '{}'::jsonb
WHERE
    video_provider = 'hls'
    AND video_metadata->>'migrated_from' = 'vimeo';
```

**⚠️ ATENÇÃO:** Isso não remove os vídeos do MinIO, apenas reverte o banco.

## 📞 Suporte

Se encontrar problemas:

1. Verifique logs do Video Service:
   ```bash
   docker logs -f doctorq-video-service
   ```

2. Verifique logs do Celery Worker:
   ```bash
   docker logs -f doctorq-video-worker
   ```

3. Verifique script de migração:
   - Saída no terminal mostra progresso detalhado
   - Cada etapa é logada
   - Erros são exibidos com stack trace

## 🎯 Próximos Passos Após Migração

1. ✅ **Testar todas as aulas migradas**
2. ✅ **Desabilitar/remover vídeos do Vimeo** (economizar plano Vimeo)
3. ✅ **Configurar CDN** (CloudFlare/CloudFront) para melhor performance
4. ✅ **Backup dos vídeos** no MinIO (S3 backup, replicação)
5. ✅ **Monitorar métricas** de uso (analytics, bandwidth)

---

**Boa migração! 🚀**
