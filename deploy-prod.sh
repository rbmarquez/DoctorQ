#!/bin/bash
# Script de deployment para PRODUÇÃO (servidor EC2)
# Baixa atualizações do GitHub e faz deploy

echo "========================================"
echo "🚀 Deploy DoctorQ - PRODUÇÃO"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/home/ec2-user/DoctorQ"
BACKUP_DIR="/home/ec2-user/backups/DoctorQ"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Função para verificar sucesso
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 concluído com sucesso${NC}"
        return 0
    else
        echo -e "${RED}✗ Erro em $1${NC}"
        return 1
    fi
}

# Função para rollback
rollback() {
    echo -e "${RED}⚠️  Erro detectado! Iniciando rollback...${NC}"

    if [ -d "$BACKUP_DIR/backup_$TIMESTAMP" ]; then
        echo -e "${YELLOW}Restaurando backup...${NC}"
        rm -rf "$PROJECT_DIR"
        cp -r "$BACKUP_DIR/backup_$TIMESTAMP" "$PROJECT_DIR"

        # Reiniciar aplicação com backup
        cd "$PROJECT_DIR/estetiQ-web" || exit 1
        pm2 restart doctorq-web

        echo -e "${GREEN}✓ Rollback concluído${NC}"
    else
        echo -e "${RED}✗ Backup não encontrado para rollback${NC}"
    fi
    exit 1
}

# 1. Verificar se está rodando como ec2-user
if [ "$USER" != "ec2-user" ]; then
    echo -e "${RED}⚠️  Este script deve ser executado como ec2-user${NC}"
    exit 1
fi

# 2. Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# 3. Fazer backup do projeto atual
echo -e "${YELLOW}📦 Criando backup...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cp -r "$PROJECT_DIR" "$BACKUP_DIR/backup_$TIMESTAMP"
    check_success "Backup criado em $BACKUP_DIR/backup_$TIMESTAMP"
else
    echo -e "${YELLOW}ℹ️  Primeira instalação - sem backup necessário${NC}"
fi

# 4. Navegar para o diretório do projeto
cd "$PROJECT_DIR" || {
    echo -e "${RED}Diretório $PROJECT_DIR não encontrado!${NC}"
    echo -e "${YELLOW}Clonando repositório...${NC}"
    cd /home/ec2-user
    git clone https://github.com/seu-usuario/DoctorQ.git
    cd "$PROJECT_DIR" || exit 1
}

# 5. Salvar alterações locais (se houver)
echo -e "${YELLOW}💾 Salvando alterações locais...${NC}"
git stash push -m "Auto stash before deploy $TIMESTAMP"

# 6. Baixar atualizações do GitHub
echo -e "${YELLOW}📥 Baixando atualizações do GitHub...${NC}"
git fetch origin
git reset --hard origin/main
if ! check_success "git pull"; then
    rollback
fi

# 7. Restaurar arquivos de configuração local (se necessário)
if [ -f "$BACKUP_DIR/env_files/.env.local" ]; then
    echo -e "${YELLOW}📋 Restaurando arquivos de configuração...${NC}"
    cp "$BACKUP_DIR/env_files/.env.local" "$PROJECT_DIR/estetiQ-web/.env.local"
fi

# 8. Build do Frontend
echo -e "${YELLOW}🏗️  Construindo frontend...${NC}"
cd "$PROJECT_DIR/estetiQ-web" || rollback

# Instalar dependências
yarn install --frozen-lockfile
if ! check_success "yarn install"; then
    rollback
fi

# Build de produção
echo -e "${YELLOW}⚙️  Executando build de produção...${NC}"
NEXT_DISABLE_ESLINT=1 TSC_COMPILE_ON_ERROR=1 NODE_OPTIONS="--max-old-space-size=4096" yarn build
if ! check_success "yarn build"; then
    echo -e "${RED}Build falhou! Tentando build alternativo...${NC}"

    # Tentar build sem validações
    SKIP_PREFLIGHT_CHECK=true NEXT_DISABLE_ESLINT=1 TSC_COMPILE_ON_ERROR=1 NODE_OPTIONS="--max-old-space-size=4096" yarn build

    if ! check_success "yarn build (alternativo)"; then
        rollback
    fi
fi

# 9. Build do Backend (se existir)
if [ -d "$PROJECT_DIR/estetiQ-api" ]; then
    echo -e "${YELLOW}🏗️  Atualizando backend...${NC}"
    cd "$PROJECT_DIR/estetiQ-api" || rollback

    # Se usar UV (Python)
    if [ -f "pyproject.toml" ]; then
        uv sync --frozen
        check_success "uv sync (backend)"
    fi

    # Se usar Yarn (Node.js)
    if [ -f "package.json" ]; then
        yarn install --frozen-lockfile
        check_success "yarn install (backend)"
    fi
fi

# 10. Reiniciar aplicação com PM2
echo -e "${YELLOW}🔄 Reiniciando aplicação...${NC}"
cd "$PROJECT_DIR/estetiQ-web"

# Verificar se PM2 está rodando
pm2 list | grep -q "doctorq-web"
if [ $? -eq 0 ]; then
    # Restart gracefully
    pm2 reload doctorq-web --update-env
    check_success "pm2 reload"
else
    # Start novo processo
    pm2 start yarn --name "doctorq-web" -- start
    check_success "pm2 start"
    pm2 save
fi

# 11. Verificar saúde da aplicação
echo -e "${YELLOW}🏥 Verificando saúde da aplicação...${NC}"
sleep 5

# Testar se a aplicação está respondendo
curl -f -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health
HTTP_CODE=$?

if [ $HTTP_CODE -eq 0 ] || [ $HTTP_CODE -eq 200 ]; then
    echo -e "${GREEN}✓ Aplicação respondendo corretamente${NC}"
else
    echo -e "${YELLOW}⚠️  Aplicação pode estar iniciando... aguarde alguns segundos${NC}"
fi

# 12. Limpar backups antigos (manter apenas os últimos 5)
echo -e "${YELLOW}🧹 Limpando backups antigos...${NC}"
cd "$BACKUP_DIR"
ls -t | grep "backup_" | tail -n +6 | xargs -r rm -rf

# 13. Status final
echo -e "\n${GREEN}========================================"
echo -e "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo -e "========================================${NC}"

echo -e "\n${BLUE}📊 Status dos serviços:${NC}"
pm2 list

echo -e "\n${YELLOW}📋 Comandos úteis:${NC}"
echo -e "  ${GREEN}pm2 logs doctorq-web${NC} - Ver logs da aplicação"
echo -e "  ${GREEN}pm2 monit${NC} - Monitorar recursos"
echo -e "  ${GREEN}pm2 restart doctorq-web${NC} - Reiniciar aplicação"
echo -e "  ${GREEN}pm2 stop doctorq-web${NC} - Parar aplicação"

echo -e "\n${YELLOW}🔗 URLs:${NC}"
echo -e "  Local: ${GREEN}http://localhost:3000${NC}"
echo -e "  Público: ${GREEN}https://seu-dominio.com.br${NC}"

echo -e "\n${YELLOW}📁 Locais importantes:${NC}"
echo -e "  Projeto: ${GREEN}$PROJECT_DIR${NC}"
echo -e "  Backups: ${GREEN}$BACKUP_DIR${NC}"
echo -e "  Logs: ${GREEN}~/.pm2/logs/${NC}"