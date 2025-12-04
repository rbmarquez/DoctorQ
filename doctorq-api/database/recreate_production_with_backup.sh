#!/bin/bash
# =============================================================================
# Script para Recriar Banco de Produção com Backup por Renomeação
# =============================================================================
# Estratégia: Renomeia banco atual e cria novo com schema de desenvolvimento
# ⚠️ MAIS SEGURO: Mantém banco antigo disponível para rollback
# =============================================================================
# Data: 25/11/2025
# =============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
PROD_HOST="dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com"
PROD_PORT="5432"
PROD_DB="dbdoctorq"
PROD_USER="doctorq"
PROD_PASSWORD="Passw0rd150982"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DB="dbdoctorq_backup_$TIMESTAMP"

# Arquivo de schema (commitado no repositório)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/schema_development.sql"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Recriar Banco de Produção com Backup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}Estratégia:${NC}"
echo "  1. Renomear banco atual: ${PROD_DB} → ${BACKUP_DB}"
echo "  2. Criar novo banco: ${PROD_DB}"
echo "  3. Aplicar schema de desenvolvimento"
echo "  4. Popular dados iniciais"
echo ""
echo -e "${GREEN}✅ SEGURO: Banco antigo fica disponível como ${BACKUP_DB}${NC}"
echo ""
echo -e "${YELLOW}Banco de produção:${NC} ${PROD_HOST}"
echo -e "${YELLOW}Schema file:${NC} ${SCHEMA_FILE}"
echo ""

# Confirmação
read -p "$(echo -e ${YELLOW}'Deseja continuar? (s/n): '${NC})" CONFIRM
if [ "$CONFIRM" != "s" ]; then
    echo -e "${GREEN}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Prosseguindo com migração...${NC}"
echo ""

# Verificar se arquivo de schema existe
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Arquivo de schema não encontrado: $SCHEMA_FILE${NC}"
    echo -e "${YELLOW}Execute 'git pull' para obter o arquivo mais recente${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Arquivo de schema encontrado ($(du -h $SCHEMA_FILE | cut -f1))${NC}"

# =============================================================================
# PASSO 1: TERMINAR CONEXÕES ATIVAS NO BANCO ATUAL
# =============================================================================
echo ""
echo -e "${BLUE}[1/5] Encerrando conexões ativas em ${PROD_DB}...${NC}"

PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PROD_DB' AND pid <> pg_backend_pid();"

echo -e "${GREEN}✅ Conexões encerradas${NC}"

# =============================================================================
# PASSO 2: RENOMEAR BANCO ATUAL PARA BACKUP
# =============================================================================
echo ""
echo -e "${BLUE}[2/5] Renomeando banco ${PROD_DB} → ${BACKUP_DB}...${NC}"

PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d postgres \
  -c "ALTER DATABASE ${PROD_DB} RENAME TO ${BACKUP_DB};"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Banco renomeado para ${BACKUP_DB}${NC}"
else
    echo -e "${RED}❌ Erro ao renomear banco! Abortando.${NC}"
    exit 1
fi

# =============================================================================
# PASSO 3: CRIAR NOVO BANCO DBDOCTORQ
# =============================================================================
echo ""
echo -e "${BLUE}[3/5] Criando novo banco ${PROD_DB}...${NC}"

PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d postgres \
  -c "CREATE DATABASE ${PROD_DB} OWNER ${PROD_USER};"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Banco ${PROD_DB} criado${NC}"
else
    echo -e "${RED}❌ Erro ao criar banco!${NC}"
    echo -e "${YELLOW}Revertendo: renomeando ${BACKUP_DB} → ${PROD_DB}${NC}"
    PGPASSWORD=$PROD_PASSWORD psql \
      -h $PROD_HOST \
      -p $PROD_PORT \
      -U $PROD_USER \
      -d postgres \
      -c "ALTER DATABASE ${BACKUP_DB} RENAME TO ${PROD_DB};"
    exit 1
fi

# =============================================================================
# PASSO 4: APLICAR SCHEMA DE DESENVOLVIMENTO
# =============================================================================
echo ""
echo -e "${BLUE}[4/5] Aplicando schema de desenvolvimento em ${PROD_DB}...${NC}"

PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  -f "$SCHEMA_FILE" 2>&1 | grep -v "NOTICE"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Schema aplicado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar schema!${NC}"
    echo -e "${YELLOW}Para restaurar: renomear ${BACKUP_DB} → ${PROD_DB}${NC}"
    echo "ALTER DATABASE ${BACKUP_DB} RENAME TO ${PROD_DB};"
    exit 1
fi

# =============================================================================
# PASSO 5: POPULAR DADOS INICIAIS
# =============================================================================
echo ""
echo -e "${BLUE}[5/5] Populando dados iniciais...${NC}"

# Verificar se arquivo seed existe
SEED_FILE="$(dirname $0)/seed_production_initial_data.sql"
if [ -f "$SEED_FILE" ]; then
    PGPASSWORD=$PROD_PASSWORD psql \
      -h $PROD_HOST \
      -p $PROD_PORT \
      -U $PROD_USER \
      -d $PROD_DB \
      -f "$SEED_FILE" 2>&1 | grep -v "NOTICE"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✅ Dados iniciais populados${NC}"
    else
        echo -e "${YELLOW}⚠️  Erro ao popular dados iniciais (não crítico)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo seed não encontrado: $SEED_FILE${NC}"
    echo -e "${YELLOW}Execute manualmente depois para criar usuário admin${NC}"
fi

# =============================================================================
# VALIDAÇÃO
# =============================================================================
echo ""
echo -e "${BLUE}Validando novo banco...${NC}"

# Contar tabelas
TABLES=$(PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")

echo -e "${GREEN}Tabelas criadas: $TABLES${NC}"

# Verificar extensões
echo ""
echo -e "${YELLOW}Extensões:${NC}"
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  -t -c "SELECT extname FROM pg_extension;" | sed 's/^/  - /'

# =============================================================================
# RESUMO FINAL
# =============================================================================
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Migração Concluída com Sucesso!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Bancos em produção:${NC}"
echo "  - ${GREEN}${PROD_DB}${NC} (novo com schema de desenvolvimento)"
echo "  - ${BLUE}${BACKUP_DB}${NC} (backup do banco antigo)"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Verificar login: admin@doctorq.app / Admin@123"
echo "  2. Reiniciar API: pm2 restart doctorq-api"
echo "  3. Testar funcionalidades básicas"
echo "  4. Se tudo OK, pode deletar ${BACKUP_DB} depois"
echo ""
echo -e "${BLUE}Para restaurar backup se necessário:${NC}"
echo "  1. Encerrar conexões em ${PROD_DB}"
echo "  2. DROP DATABASE ${PROD_DB};"
echo "  3. ALTER DATABASE ${BACKUP_DB} RENAME TO ${PROD_DB};"
echo ""
echo -e "${GREEN}✅ Banco antigo preservado como ${BACKUP_DB}${NC}"
echo ""
