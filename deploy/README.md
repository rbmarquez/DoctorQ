# Ai Que Beleza - Guia de Deploy para Produção

## Arquitetura de Produção

```
                    ┌─────────────────────────────────────┐
                    │          Internet                    │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │        Nginx (porta 80/443)         │
                    │        SSL Let's Encrypt            │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐   ┌────────▼────────┐   ┌─────────▼─────────┐
    │  Frontend (3000)  │   │   API (8080)    │   │   WebSocket       │
    │   Next.js + PM2   │   │ FastAPI+Gunicorn│   │    /ws/           │
    └───────────────────┘   └────────┬────────┘   └───────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼─────────┐   ┌───────▼───────┐   ┌─────────▼─────────┐
    │   PostgreSQL 16   │   │     Redis     │   │   File Storage    │
    │   + pgvector      │   │   (Cache)     │   │   (uploads)       │
    └───────────────────┘   └───────────────┘   └───────────────────┘
```

## Pré-requisitos

- Ubuntu 22.04+ ou Debian 12+
- Domínio configurado (aiquebeleza.com) apontando para o servidor
- Portas 80 e 443 abertas no firewall
- PostgreSQL 16+ instalado e configurado
- Redis instalado e rodando

## Deploy Rápido (Automático)

```bash
# 1. Clone o repositório (se ainda não tiver)
git clone https://github.com/rbmarquez/DoctorQ.git /mnt/repositorios/DoctorQ
cd /mnt/repositorios/DoctorQ

# 2. Configure as variáveis de ambiente
cp deploy/env/backend.env.production estetiQ-api/.env
cp deploy/env/frontend.env.production estetiQ-web/.env.production.local
# Edite os arquivos com suas credenciais

# 3. Execute o script de deploy
chmod +x deploy/scripts/deploy-production.sh
sudo ./deploy/scripts/deploy-production.sh all
```

## Deploy Manual (Passo a Passo)

### 1. Instalar Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Yarn e PM2
sudo npm install -g yarn pm2

# Instalar UV (Python)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Configurar SSL (Let's Encrypt)

```bash
# Obter certificado SSL
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d aiquebeleza.com \
    -d www.aiquebeleza.com \
    --email admin@aiquebeleza.com \
    --agree-tos

# Configurar renovação automática (já configurado por padrão)
sudo systemctl enable certbot.timer
```

### 3. Configurar Nginx

```bash
# Copiar configuração
sudo cp deploy/nginx/aiquebeleza.conf /etc/nginx/sites-available/

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/aiquebeleza.conf /etc/nginx/sites-enabled/

# Remover default
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Deploy do Backend (API)

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api

# Configurar ambiente
cp ../deploy/env/backend.env.production .env
# Edite .env com suas credenciais

# Instalar dependências
uv sync --all-extras

# Criar serviço systemd
sudo tee /etc/systemd/system/aiquebeleza-api.service << 'EOF'
[Unit]
Description=Ai Que Beleza API
After=network.target

[Service]
Type=exec
User=www-data
WorkingDirectory=/mnt/repositorios/DoctorQ/estetiQ-api
ExecStart=/mnt/repositorios/DoctorQ/estetiQ-api/.venv/bin/gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Iniciar serviço
sudo systemctl daemon-reload
sudo systemctl enable aiquebeleza-api
sudo systemctl start aiquebeleza-api
```

### 5. Deploy do Frontend (Web)

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-web

# Configurar ambiente
cp ../deploy/env/frontend.env.production .env.production.local
# Edite com suas credenciais

# Instalar dependências
yarn install --frozen-lockfile

# Build de produção
yarn build

# Iniciar com PM2
pm2 start npm --name "aiquebeleza-web" -- start
pm2 save
pm2 startup
```

## Comandos Úteis

### Gerenciar Serviços

```bash
# Frontend (PM2)
pm2 status                    # Ver status
pm2 logs aiquebeleza-web          # Ver logs
pm2 restart aiquebeleza-web       # Reiniciar

# Backend (systemd)
sudo systemctl status aiquebeleza-api
sudo journalctl -u aiquebeleza-api -f   # Ver logs
sudo systemctl restart aiquebeleza-api

# Nginx
sudo systemctl status nginx
sudo nginx -t                 # Testar configuração
sudo systemctl reload nginx
```

### Atualizar Aplicação

```bash
cd /mnt/repositorios/DoctorQ

# Baixar atualizações
git pull origin main

# Atualizar frontend
cd estetiQ-web
yarn install --frozen-lockfile
yarn build
pm2 restart aiquebeleza-web

# Atualizar backend
cd ../estetiQ-api
uv sync
sudo systemctl restart aiquebeleza-api
```

## Verificação de Saúde

```bash
# Testar HTTPS
curl -I https://aiquebeleza.com

# Testar API
curl https://aiquebeleza.com/api/health

# Testar WebSocket
# Use um cliente WebSocket para wss://aiquebeleza.com/ws/

# Verificar logs de erro
sudo tail -f /var/log/nginx/aiquebeleza_error.log
```

## Troubleshooting

### Erro 502 Bad Gateway
- Verificar se API está rodando: `sudo systemctl status aiquebeleza-api`
- Verificar se frontend está rodando: `pm2 status`
- Ver logs: `sudo journalctl -u aiquebeleza-api -f`

### Erro SSL
- Verificar certificado: `sudo certbot certificates`
- Renovar manualmente: `sudo certbot renew`

### Porta 80/443 não acessível
- Verificar firewall: `sudo ufw status`
- Liberar portas: `sudo ufw allow 80,443/tcp`

## Estrutura de Arquivos

```
/mnt/repositorios/DoctorQ/
├── estetiQ-api/           # Backend FastAPI
│   └── .env               # Variáveis de ambiente
├── estetiQ-web/           # Frontend Next.js
│   └── .env.production.local
├── deploy/
│   ├── nginx/
│   │   └── doctorq.conf   # Configuração Nginx
│   ├── scripts/
│   │   └── deploy-production.sh
│   ├── env/
│   │   ├── backend.env.production
│   │   └── frontend.env.production
│   └── README.md          # Este arquivo

/var/www/aiquebeleza/          # Diretório de produção
├── uploads/               # Uploads de arquivos
└── certbot/               # Challenge Let's Encrypt

/var/log/nginx/
├── doctorq_access.log
└── doctorq_error.log

/var/log/pm2/
├── aiquebeleza-web-out.log
└── aiquebeleza-web-error.log
```

## Segurança

- [ ] Alterar todas as senhas padrão
- [ ] Configurar firewall (UFW)
- [ ] Habilitar fail2ban
- [ ] Configurar backup do banco de dados
- [ ] Monitorar logs regularmente
- [ ] Manter sistema atualizado

## Contato

Em caso de dúvidas, consulte a documentação em `DOC_Arquitetura/` ou abra uma issue no GitHub.
