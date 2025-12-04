# 🚀 Guia de Deploy - Universidade da Beleza

## Opções de Deploy

### 1️⃣ Deploy com Docker (Recomendado)

#### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+

#### Quick Start

```bash
# 1. Clone/Navigate
cd /mnt/repositorios/DoctorQ/estetiQ-api-univ

# 2. Configure variáveis de ambiente
cp .env.docker .env
nano .env  # Edite com suas chaves

# 3. Build e start
docker-compose up -d

# 4. Verificar logs
docker-compose logs -f api

# 5. Acessar
# API: http://localhost:8081
# Docs: http://localhost:8081/docs
```

#### Comandos Docker Úteis

```bash
# Rebuild após mudanças
docker-compose up -d --build

# Ver logs
docker-compose logs -f api

# Executar migrations
docker-compose exec api uv run alembic upgrade head

# Parar serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Entrar no container
docker-compose exec api bash

# Ver status
docker-compose ps
```

---

### 2️⃣ Deploy Manual (VPS/VM)

#### Pré-requisitos
- Ubuntu 22.04+ / Debian 11+
- Python 3.12+
- PostgreSQL 16+
- Redis 7+
- Nginx (opcional, para proxy reverso)

#### Instalação

```bash
# 1. Instalar dependências do sistema
sudo apt update
sudo apt install -y python3.12 python3-pip postgresql-16 redis-server nginx

# 2. Instalar UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# 3. Clone do projeto
cd /opt
sudo git clone <repo-url> doctorq-univ
cd doctorq-univ

# 4. Configurar ambiente
cp .env.exemplo .env
sudo nano .env  # Editar variáveis

# 5. Instalar dependências
uv sync

# 6. Criar banco de dados
sudo -u postgres psql -c "CREATE DATABASE doctorq_univ;"
sudo -u postgres psql -d doctorq_univ < database/migration_001_init_universidade.sql

# 7. Iniciar com systemd (produção)
sudo cp deploy/doctorq-univ.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable doctorq-univ
sudo systemctl start doctorq-univ
sudo systemctl status doctorq-univ
```

#### Arquivo Systemd

Criar `/etc/systemd/system/doctorq-univ.service`:

```ini
[Unit]
Description=DoctorQ Universidade da Beleza API
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/doctorq-univ
Environment="PATH=/opt/doctorq-univ/.venv/bin"
ExecStart=/opt/doctorq-univ/.venv/bin/gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8081 --workers 4 --timeout 120
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Nginx Reverse Proxy

Criar `/etc/nginx/sites-available/doctorq-univ`:

```nginx
server {
    listen 80;
    server_name universidade.doctorq.app;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (para futuras features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Aumentar limite de upload (para vídeos)
    client_max_body_size 500M;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/doctorq-univ /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL com Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d universidade.doctorq.app
```

---

### 3️⃣ Deploy Kubernetes

#### Manifests Básicos

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: doctorq-univ-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: doctorq-univ-api
  template:
    metadata:
      labels:
        app: doctorq-univ-api
    spec:
      containers:
      - name: api
        image: doctorq/universidade:latest
        ports:
        - containerPort: 8081
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: doctorq-univ-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: doctorq-univ-secrets
              key: openai-key
        livenessProbe:
          httpGet:
            path: /health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8081
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

**service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: doctorq-univ-api
spec:
  selector:
    app: doctorq-univ-api
  ports:
  - protocol: TCP
    port: 8081
    targetPort: 8081
  type: LoadBalancer
```

```bash
# Apply
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Verificar
kubectl get pods
kubectl get svc
kubectl logs -f deployment/doctorq-univ-api
```

---

## Variáveis de Ambiente (Produção)

### Essenciais

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/doctorq_univ

# Redis
REDIS_URL=redis://host:6379/1

# Security
SECRET_KEY=<generate-with-openssl-rand-hex-32>
JWT_SECRET=<generate-with-openssl-rand-hex-32>
API_KEY=univ_<random-secure-key>

# OpenAI
OPENAI_API_KEY=sk-proj-...

# App
DEBUG=false
LOG_LEVEL=INFO
PORT=8081
```

### Gerar Secrets

```bash
# SECRET_KEY e JWT_SECRET
openssl rand -hex 32

# API_KEY
echo "univ_$(openssl rand -hex 16)"
```

---

## Monitoramento

### Logs

```bash
# Systemd
sudo journalctl -u doctorq-univ -f

# Docker
docker-compose logs -f api

# Kubernetes
kubectl logs -f deployment/doctorq-univ-api
```

### Health Checks

```bash
# Health (básico)
curl http://localhost:8081/health

# Readiness (completo)
curl http://localhost:8081/ready

# Metrics (se implementado)
curl http://localhost:8081/metrics
```

### Prometheus + Grafana (Opcional)

Adicionar ao `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./deploy/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Backup

### Banco de Dados

```bash
# Backup
pg_dump -h localhost -U postgres doctorq_univ > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres doctorq_univ < backup_20260113.sql

# Backup automatizado (cron)
0 2 * * * /usr/bin/pg_dump -h localhost -U postgres doctorq_univ > /backups/doctorq_univ_$(date +\%Y\%m\%d).sql
```

### Uploads

```bash
# Sync para S3 (se usando)
aws s3 sync /tmp/uploads_univ s3://doctorq-univ-uploads/

# Backup local
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /tmp/uploads_univ
```

---

## Troubleshooting

### API não inicia

```bash
# Verificar logs
docker-compose logs api

# Verificar DB
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ -c "SELECT 1"

# Verificar Redis
redis-cli ping
```

### Erro de conexão DB

```bash
# Testar conectividade
telnet 10.11.2.81 5432

# Verificar firewall
sudo ufw status
sudo ufw allow 5432
```

### Performance Issues

```bash
# Ver conexões ativas
SELECT * FROM pg_stat_activity WHERE datname = 'doctorq_univ';

# Ver queries lentas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

# Limpar cache Redis
redis-cli FLUSHALL
```

---

## CI/CD (GitHub Actions)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Build Docker Image
      run: |
        docker build -t doctorq/universidade:${{ github.sha }} .
        docker tag doctorq/universidade:${{ github.sha }} doctorq/universidade:latest

    - name: Push to Registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push doctorq/universidade:latest

    - name: Deploy to Server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /opt/doctorq-univ
          docker-compose pull
          docker-compose up -d --force-recreate
```

---

## Segurança

### Checklist

- [ ] Mudar `SECRET_KEY` e `JWT_SECRET` em produção
- [ ] Usar HTTPS (SSL/TLS)
- [ ] Configurar firewall (allow apenas portas necessárias)
- [ ] Atualizar dependências regularmente
- [ ] Backups automatizados
- [ ] Monitoramento de logs
- [ ] Rate limiting (Nginx ou CloudFlare)
- [ ] CORS restrito para domínios conhecidos
- [ ] Validar inputs (já implementado via Pydantic)
- [ ] Não expor `/docs` em produção (DISABLE_SWAGGER=true)

---

**Status**: Pronto para produção ✅
**Suporte**: dev@doctorq.app
