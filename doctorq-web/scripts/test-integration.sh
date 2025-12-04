#!/bin/bash
echo "============================================="
echo "🧪 Teste de Integração - EstetiQ API"
echo "============================================="

API_URL="http://localhost:8080"
API_KEY="vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

echo "API URL: $API_URL"
echo ""

PASSED=0
FAILED=0

test_ep() {
    local name=$1
    local endpoint=$2
    echo -n "Testing $name... "
    status=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $API_KEY" "$API_URL$endpoint")
    if [ "$status" -eq "200" ]; then
        echo "✓ OK (HTTP $status)"
        ((PASSED++))
    else
        echo "✗ FAIL (HTTP $status)"
        ((FAILED++))
    fi
}

echo "📡 Testando endpoints..."
test_ep "Health Check" "/health"
test_ep "Ready Check" "/ready"
test_ep "Empresas" "/empresas/"
test_ep "Usuários" "/users/"
test_ep "Perfis" "/perfis/"
test_ep "Clínicas" "/clinicas/"
test_ep "Procedimentos" "/procedimentos/"
test_ep "Produtos" "/produtos/"
test_ep "Profissionais" "/profissionais/"
test_ep "Pacientes" "/pacientes/"

echo ""
echo "============================================="
echo "📊 Resultado: ✅ $PASSED passaram | ❌ $FAILED falharam"
echo "============================================="
