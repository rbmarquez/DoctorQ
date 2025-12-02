#!/bin/bash
# =============================================================================
# Script para Migrar Schema de Desenvolvimento para Produção
# =============================================================================
# ⚠️⚠️⚠️ ATENÇÃO: ESTE SCRIPT APAGA TODOS OS DADOS DE PRODUÇÃO! ⚠️⚠️⚠️
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
DEV_HOST="10.11.2.81"
DEV_PORT="5432"
DEV_DB="dbdoctorq"
DEV_USER="postgres"
DEV_PASSWORD="postgres"

PROD_HOST="dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com"
PROD_PORT="5432"
PROD_DB="dbdoctorq"
PROD_USER="doctorq"
PROD_PASSWORD="Passw0rd150982"

BACKUP_DIR="/tmp/doctorq_migration_backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${RED}=========================================${NC}"
echo -e "${RED}⚠️  AVISO CRÍTICO ⚠️${NC}"
echo -e "${RED}=========================================${NC}"
echo -e "${RED}Este script irá:${NC}"
echo -e "${RED}1. APAGAR TODOS OS DADOS de produção${NC}"
echo -e "${RED}2. DROP de todas as tabelas${NC}"
echo -e "${RED}3. Recriar estrutura do zero${NC}"
echo -e "${RED}4. Aplicar schema de desenvolvimento${NC}"
echo ""
echo -e "${YELLOW}Banco de produção:${NC} ${PROD_HOST}"
echo -e "${YELLOW}Banco de desenvolvimento:${NC} ${DEV_HOST}"
echo ""
echo -e "${RED}ESTA OPERAÇÃO NÃO PODE SER DESFEITA!${NC}"
echo ""

# Confirmação 1
read -p "$(echo -e ${YELLOW}Digite '"'SIM APAGAR TUDO'"' para continuar: ${NC})" CONFIRM1
if [ "$CONFIRM1" != "SIM APAGAR TUDO" ]; then
    echo -e "${GREEN}Operação cancelada. Nenhuma alteração foi feita.${NC}"
    exit 0
fi

# Confirmação 2
echo ""
echo -e "${RED}Última chance! Você tem certeza ABSOLUTA?${NC}"
read -p "$(echo -e ${YELLOW}Digite '"'CONFIRMO APAGAR PRODUCAO'"' para prosseguir: ${NC})" CONFIRM2
if [ "$CONFIRM2" != "CONFIRMO APAGAR PRODUCAO" ]; then
    echo -e "${GREEN}Operação cancelada. Nenhuma alteração foi feita.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Prosseguindo com migração...${NC}"
echo ""

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# =============================================================================
# PASSO 1: BACKUP COMPLETO DE PRODUÇÃO
# =============================================================================
echo -e "${BLUE}[1/6] Fazendo backup de produção...${NC}"

BACKUP_FILE="$BACKUP_DIR/producao_backup_$TIMESTAMP.sql"

PGPASSWORD=$PROD_PASSWORD pg_dump \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  --format=plain \
  --no-owner \
  --no-acl \
  -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup salvo em: $BACKUP_FILE${NC}"
    ls -lh "$BACKUP_FILE"
else
    echo -e "${RED}❌ Erro ao fazer backup! Abortando.${NC}"
    exit 1
fi

# =============================================================================
# PASSO 2: EXPORT DO SCHEMA DE DESENVOLVIMENTO
# =============================================================================
echo ""
echo -e "${BLUE}[2/6] Exportando schema de desenvolvimento...${NC}"

SCHEMA_FILE="$BACKUP_DIR/desenvolvimento_schema_$TIMESTAMP.sql"

PGPASSWORD=$DEV_PASSWORD pg_dump \
  -h $DEV_HOST \
  -p $DEV_PORT \
  -U $DEV_USER \
  -d $DEV_DB \
  --schema-only \
  --no-owner \
  --no-acl \
  -f "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema exportado: $SCHEMA_FILE${NC}"
    ls -lh "$SCHEMA_FILE"
else
    echo -e "${RED}❌ Erro ao exportar schema! Abortando.${NC}"
    exit 1
fi

# =============================================================================
# PASSO 3: TERMINAR CONEXÕES ATIVAS EM PRODUÇÃO
# =============================================================================
echo ""
echo -e "${BLUE}[3/6] Encerrando conexões ativas em produção...${NC}"

PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PROD_DB' AND pid <> pg_backend_pid();"

echo -e "${GREEN}✅ Conexões encerradas${NC}"

# =============================================================================
# PASSO 4: DROP DO SCHEMA PUBLIC EM PRODUÇÃO
# =============================================================================
echo ""
echo -e "${BLUE}[4/6] Removendo schema public de produção...${NC}"

PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema public removido e recriado${NC}"
else
    echo -e "${RED}❌ Erro ao remover schema! Verifique logs.${NC}"
    exit 1
fi

# =============================================================================
# PASSO 5: APLICAR SCHEMA DE DESENVOLVIMENTO EM PRODUÇÃO
# =============================================================================
echo ""
echo -e "${BLUE}[5/6] Aplicando schema de desenvolvimento em produção...${NC}"

PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  -f "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema aplicado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar schema!${NC}"
    echo -e "${YELLOW}Para restaurar backup:${NC}"
    echo "PGPASSWORD=$PROD_PASSWORD psql -h $PROD_HOST -U $PROD_USER -d $PROD_DB -f $BACKUP_FILE"
    exit 1
fi

# =============================================================================
# PASSO 6: VALIDAÇÃO
# =============================================================================
echo ""
echo -e "${BLUE}[6/6] Validando migração...${NC}"

# Contar tabelas em produção
PROD_TABLES=$(PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")

echo -e "${GREEN}Tabelas criadas em produção: $PROD_TABLES${NC}"

# Verificar extensões
echo ""
echo -e "${YELLOW}Extensões instaladas:${NC}"
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -p $PROD_PORT \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "SELECT extname, extversion FROM pg_extension;"

# =============================================================================
# RESUMO FINAL
# =============================================================================
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Migração Concluída com Sucesso!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Arquivos gerados:${NC}"
echo "  - Backup: $BACKUP_FILE"
echo "  - Schema: $SCHEMA_FILE"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Verificar estrutura em produção"
echo "  2. Popular dados iniciais (usuários, perfis, etc)"
echo "  3. Reiniciar aplicações: pm2 restart all"
echo "  4. Testar login e funcionalidades"
echo ""
echo -e "${RED}⚠️  BANCO DE PRODUÇÃO ESTÁ VAZIO! Popule com dados necessários.${NC}"
echo ""
