#!/bin/bash

###############################################################################
# Script de Teste de Integração com API Backend do EstetiQ
###############################################################################

set -e

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuração
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8080}"
API_KEY="${API_ESTETIQ_API_KEY:-vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX}"

echo "============================================="
echo "🧪 Teste de Integração - EstetiQ API"
echo "============================================="
echo "API URL: $API_URL"
echo ""

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}

    echo -n "Testing $name... "

    status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $API_KEY" \
        "$API_URL$endpoint")

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $status_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status_code, expected $expected_status)"
        return 1
    fi
}

# Testes
echo "📡 Testando endpoints principais..."
echo ""

PASSED=0
FAILED=0

# Health check
if test_endpoint "Health Check" "/health" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Ready check
if test_endpoint "Ready Check" "/ready" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Empresas
if test_endpoint "GET /empresas/" "/empresas/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Usuários
if test_endpoint "GET /users/" "/users/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Perfis
if test_endpoint "GET /perfis/" "/perfis/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Clínicas
if test_endpoint "GET /clinicas/" "/clinicas/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Procedimentos
if test_endpoint "GET /procedimentos/" "/procedimentos/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Produtos
if test_endpoint "GET /produtos/" "/produtos/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Profissionais
if test_endpoint "GET /profissionais/" "/profissionais/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Pacientes
if test_endpoint "GET /pacientes/" "/pacientes/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "============================================="
echo "📊 Resultado dos Testes"
echo "============================================="
echo -e "${GREEN}Passaram: $PASSED${NC}"
echo -e "${RED}Falharam: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os testes passaram! (100%)${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Taxa de sucesso: ${SUCCESS_RATE}%${NC}"
    exit 1
fi
