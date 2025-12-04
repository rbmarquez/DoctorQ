#!/bin/bash
# ============================================================================
# Script de Instalação do Banco de Dados DoctorQ
# Data: 2025-11-23
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} DoctorQ - Instalação do Banco de Dados${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Configurações padrão (podem ser sobrescritas por variáveis de ambiente)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-doctorq}"

# Solicitar senha se não estiver configurada
if [ -z "$PGPASSWORD" ]; then
    echo -n "Digite a senha do PostgreSQL: "
    read -s PGPASSWORD
    export PGPASSWORD
    echo ""
fi

echo ""
echo -e "${YELLOW}Configurações:${NC}"
echo "  Host: $DB_HOST"
echo "  Porta: $DB_PORT"
echo "  Usuário: $DB_USER"
echo "  Banco: $DB_NAME"
echo ""

# Verificar conexão com PostgreSQL
echo -e "${YELLOW}[1/4] Verificando conexão com PostgreSQL...${NC}"
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}ERRO: Não foi possível conectar ao PostgreSQL${NC}"
    echo "Verifique as configurações de conexão"
    exit 1
fi
echo -e "${GREEN}✓ Conexão estabelecida${NC}"

# Verificar se banco existe
echo -e "${YELLOW}[2/4] Verificando banco de dados...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}⚠ Banco '$DB_NAME' já existe${NC}"
    echo -n "Deseja recriar o banco? (isso apagará todos os dados) [s/N]: "
    read RESPOSTA
    if [ "$RESPOSTA" = "s" ] || [ "$RESPOSTA" = "S" ]; then
        echo "Removendo banco existente..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "Criando novo banco..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME WITH ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;"
    else
        echo "Usando banco existente..."
    fi
else
    echo "Criando banco '$DB_NAME'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME WITH ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;"
fi
echo -e "${GREEN}✓ Banco de dados pronto${NC}"

# Verificar extensões necessárias
echo -e "${YELLOW}[3/4] Instalando extensões...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" 2>/dev/null || true
echo -e "${GREEN}✓ Extensões instaladas${NC}"

# Aplicar schema e dados
echo -e "${YELLOW}[4/4] Aplicando schema e dados...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/deploy_completo_doctorq.sql" ]; then
    echo "Aplicando deploy_completo_doctorq.sql..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/deploy_completo_doctorq.sql" > /dev/null 2>&1
    echo -e "${GREEN}✓ Schema e dados aplicados${NC}"
else
    echo -e "${RED}ERRO: Arquivo deploy_completo_doctorq.sql não encontrado${NC}"
    exit 1
fi

# Verificação final
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} Instalação Concluída!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Verificando instalação...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 'Tabelas criadas: ' || COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Empresas: ' || COUNT(*) FROM tb_empresas
UNION ALL
SELECT 'Usuários: ' || COUNT(*) FROM tb_users
UNION ALL
SELECT 'Perfis: ' || COUNT(*) FROM tb_perfis;
"

echo ""
echo -e "${GREEN}Próximos passos:${NC}"
echo "1. Configure o arquivo .env da API com:"
echo "   DATABASE_URL=postgresql+asyncpg://$DB_USER:SENHA@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "2. Defina a variável de ambiente:"
echo "   DEFAULT_EMPRESA_ID=af8b2919-d0f6-4310-9a77-488989969ea4"
echo ""
echo "3. Inicie a API:"
echo "   make dev"
echo ""
