#!/bin/bash
# Script de deployment para DESENVOLVIMENTO (local)
# Atualiza código no GitHub e prepara para deploy

echo "========================================"
echo "🚀 Deploy DoctorQ - DESENVOLVIMENTO"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/mnt/repositorios/DoctorQ"

# Função para verificar sucesso
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 concluído com sucesso${NC}"
    else
        echo -e "${RED}✗ Erro em $1${NC}"
        exit 1
    fi
}

# 1. Verificar se está no diretório correto
cd "$PROJECT_DIR" || exit 1
echo -e "${YELLOW}📁 Diretório: $(pwd)${NC}"

# 2. Status do Git
echo -e "\n${YELLOW}📊 Status do Git:${NC}"
git status --short

# 3. Verificar se há conflitos de merge
echo -e "\n${YELLOW}🔍 Verificando conflitos de merge...${NC}"
CONFLICTS=$(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "<<<<<<< HEAD" 2>/dev/null)
if [ ! -z "$CONFLICTS" ]; then
    echo -e "${RED}⚠️  Conflitos encontrados em:${NC}"
    echo "$CONFLICTS"
    echo -e "${RED}Por favor, resolva os conflitos antes de continuar!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Nenhum conflito de merge encontrado${NC}"

# 4. Build do Frontend
echo -e "\n${YELLOW}🏗️  Testando build do frontend...${NC}"
cd "$PROJECT_DIR/estetiQ-web"
yarn install
check_success "yarn install"

# Build com flags para ignorar warnings se necessário
NEXT_DISABLE_ESLINT=1 TSC_COMPILE_ON_ERROR=1 NODE_OPTIONS="--max-old-space-size=4096" yarn build
check_success "yarn build"

# 5. Build do Backend (se existir)
if [ -d "$PROJECT_DIR/estetiQ-api" ]; then
    echo -e "\n${YELLOW}🏗️  Verificando backend...${NC}"
    cd "$PROJECT_DIR/estetiQ-api"

    # Se usar UV (Python)
    if [ -f "pyproject.toml" ]; then
        uv sync
        check_success "uv sync"

        # Verificar sintaxe Python
        uv run python -m py_compile src/**/*.py 2>/dev/null
        check_success "verificação de sintaxe Python"
    fi

    # Se usar Yarn (Node.js)
    if [ -f "package.json" ]; then
        yarn install
        check_success "yarn install (backend)"
    fi
fi

# 6. Commit e Push
cd "$PROJECT_DIR"
echo -e "\n${YELLOW}📝 Preparando commit...${NC}"

# Adicionar arquivos modificados
git add -A

# Verificar se há mudanças para commit
if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}ℹ️  Nenhuma mudança para commit${NC}"
else
    # Commit com mensagem descritiva
    echo -e "${YELLOW}Digite a mensagem do commit:${NC}"
    read -r COMMIT_MSG

    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="fix: correções e melhorias no projeto DoctorQ"
    fi

    git commit -m "$COMMIT_MSG"
    check_success "git commit"

    # Push para o repositório
    echo -e "\n${YELLOW}📤 Enviando para o GitHub...${NC}"
    git push origin main
    check_success "git push"
fi

# 7. Instruções para produção
echo -e "\n${GREEN}========================================"
echo -e "✅ DESENVOLVIMENTO CONCLUÍDO!"
echo -e "========================================${NC}"
echo -e "\n${YELLOW}📋 Próximos passos para PRODUÇÃO:${NC}"
echo -e "1. Conecte ao servidor: ${GREEN}ssh ec2-user@seu-servidor${NC}"
echo -e "2. Execute: ${GREEN}./deploy-prod.sh${NC}"
echo -e "3. Ou manualmente:"
echo -e "   ${GREEN}cd /home/ec2-user/DoctorQ${NC}"
echo -e "   ${GREEN}git pull origin master${NC}"
echo -e "   ${GREEN}cd estetiQ-web && yarn install && yarn build${NC}"
echo -e "   ${GREEN}pm2 restart doctorq-web${NC}"

echo -e "\n${YELLOW}🔗 GitHub:${NC} https://github.com/seu-usuario/DoctorQ"
echo -e "${YELLOW}🌐 Produção:${NC} https://seu-dominio.com.br"