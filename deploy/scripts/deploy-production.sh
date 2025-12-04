#!/bin/bash
# =============================================================================
# DoctorQ - Script de Deploy para Produção
# =============================================================================
# Uso: sudo ./deploy-production.sh [frontend|backend|all]
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DOMAIN="aiquebeleza.com"
PROJECT_DIR="/var/www/aiquebeleza"
REPO_DIR="/mnt/repositorios/DoctorQ"
NGINX_CONF="/etc/nginx/sites-available/aiquebeleza.conf"
CERTBOT_EMAIL="admin@aiquebeleza.com"

# Funções de utilidade
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Este script precisa ser executado como root (sudo)"
        exit 1
    fi
}

# Instalar dependências do sistema
install_dependencies() {
    log_info "Instalando dependências do sistema..."

    # Atualizar pacotes
    apt update

    # Nginx
    apt install -y nginx

    # Certbot para Let's Encrypt
    apt install -y certbot python3-certbot-nginx

    # Node.js (se não instalado)
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi

    # Yarn
    if ! command -v yarn &> /dev/null; then
        npm install -g yarn
    fi

    # PM2 para gerenciamento de processos
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi

    # Python e UV (para backend)
    if ! command -v uv &> /dev/null; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
    fi

    log_success "Dependências instaladas!"
}

# Configurar SSL com Let's Encrypt
setup_ssl() {
    log_info "Configurando SSL com Let's Encrypt..."

    # Criar diretório para challenge
    mkdir -p /var/www/certbot

    # Copiar configuração Nginx temporária (sem SSL)
    cat > /etc/nginx/sites-available/doctorq-temp.conf << 'EOF'
server {
    listen 80;
    server_name doctorq.app www.doctorq.app;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/doctorq-temp.conf /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx

    # Obter certificado
    certbot certonly --webroot \
        -w /var/www/certbot \
        -d ${DOMAIN} \
        -d www.${DOMAIN} \
        --email ${CERTBOT_EMAIL} \
        --agree-tos \
        --non-interactive

    # Remover config temporária
    rm -f /etc/nginx/sites-enabled/doctorq-temp.conf
    rm -f /etc/nginx/sites-available/doctorq-temp.conf

    # Configurar renovação automática
    echo "0 12 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" > /etc/cron.d/certbot-renew

    log_success "SSL configurado com sucesso!"
}

# Configurar Nginx
setup_nginx() {
    log_info "Configurando Nginx..."

    # Criar diretório de cache
    mkdir -p /var/cache/nginx/doctorq

    # Copiar configuração
    cp ${REPO_DIR}/deploy/nginx/aiquebeleza.conf ${NGINX_CONF}

    # Habilitar site
    ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/

    # Remover default se existir
    rm -f /etc/nginx/sites-enabled/default

    # Testar e recarregar
    nginx -t
    systemctl reload nginx

    log_success "Nginx configurado!"
}

# Deploy do Frontend
deploy_frontend() {
    log_info "Fazendo deploy do Frontend..."

    cd ${REPO_DIR}/estetiQ-web

    # Instalar dependências
    yarn install --frozen-lockfile

    # Build de produção
    yarn build

    # Configurar PM2
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'doctorq-web',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    error_file: '/var/log/pm2/doctorq-web-error.log',
    out_file: '/var/log/pm2/doctorq-web-out.log',
    merge_logs: true,
    time: true
  }]
};
EOF

    # Criar diretório de logs
    mkdir -p /var/log/pm2

    # Iniciar/Reiniciar com PM2
    pm2 delete doctorq-web 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save

    log_success "Frontend deployado!"
}

# Deploy do Backend
deploy_backend() {
    log_info "Fazendo deploy do Backend..."

    cd ${REPO_DIR}/estetiQ-api

    # Instalar dependências
    uv sync --all-extras

    # Criar serviço systemd
    cat > /etc/systemd/system/doctorq-api.service << 'EOF'
[Unit]
Description=DoctorQ API (FastAPI)
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/mnt/repositorios/DoctorQ/estetiQ-api
Environment="PATH=/mnt/repositorios/DoctorQ/estetiQ-api/.venv/bin"
ExecStart=/mnt/repositorios/DoctorQ/estetiQ-api/.venv/bin/gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 --workers 4 --timeout 120
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    # Recarregar systemd e iniciar
    systemctl daemon-reload
    systemctl enable doctorq-api
    systemctl restart doctorq-api

    log_success "Backend deployado!"
}

# Deploy completo
deploy_all() {
    log_info "Iniciando deploy completo..."

    install_dependencies

    # Setup SSL se não existir
    if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        setup_ssl
    fi

    setup_nginx
    deploy_backend
    deploy_frontend

    # Configurar PM2 para iniciar no boot
    pm2 startup
    pm2 save

    log_success "Deploy completo finalizado!"
    echo ""
    echo "=========================================="
    echo "  DoctorQ está rodando em produção!"
    echo "  https://${DOMAIN}"
    echo "=========================================="
}

# Menu principal
show_help() {
    echo "Uso: sudo $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  all        - Deploy completo (frontend + backend + nginx + ssl)"
    echo "  frontend   - Deploy apenas do frontend"
    echo "  backend    - Deploy apenas do backend"
    echo "  nginx      - Configurar apenas Nginx"
    echo "  ssl        - Configurar apenas SSL"
    echo "  deps       - Instalar dependências"
    echo "  help       - Mostrar esta ajuda"
}

# Executar
check_root

case "${1:-all}" in
    all)
        deploy_all
        ;;
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    nginx)
        setup_nginx
        ;;
    ssl)
        setup_ssl
        ;;
    deps)
        install_dependencies
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando desconhecido: $1"
        show_help
        exit 1
        ;;
esac
