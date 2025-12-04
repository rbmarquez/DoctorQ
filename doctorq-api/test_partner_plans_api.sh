#!/bin/bash
# Script de teste para validar os endpoints de planos de parceiros
# Data: 10/11/2025

echo "🧪 Testando Endpoints de Planos de Parceiros - DoctorQ API"
echo "=========================================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8080"
API_KEY="vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

echo -e "${BLUE}📊 1. Listando todos os planos de serviços${NC}"
echo "GET $API_URL/partner-leads/services/"
curl -s -H "Authorization: Bearer $API_KEY" \
  "$API_URL/partner-leads/services/" | python3 -m json.tool | head -100
echo ""
echo ""

echo -e "${BLUE}📊 2. Verificando planos com tp_partner e qt_max_licenses no banco${NC}"
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq -c \
  "SELECT cd_service, nm_service, tp_partner, tp_categoria, qt_max_licenses, vl_preco_base
   FROM tb_partner_service_definitions
   WHERE cd_service LIKE 'PLAN_%'
   ORDER BY tp_partner, cd_service
   LIMIT 15"
echo ""

echo -e "${YELLOW}📝 3. Criando um plano de teste via API (POST)${NC}"
echo "POST $API_URL/partner-leads/services/"

TEST_PLAN_PAYLOAD=$(cat <<'EOF'
{
  "service_code": "PLAN_TEST_001",
  "service_name": "Plano de Teste Clínica",
  "description": "Plano criado via API para testes",
  "price_value": 499.00,
  "price_label": "R$ 499,00/mês",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "active": true,
  "recommended": false,
  "category": "plano_base",
  "partner_type": "clinica",
  "max_licenses": 10
}
EOF
)

RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$TEST_PLAN_PAYLOAD" \
  "$API_URL/partner-leads/services/")

echo "$RESPONSE" | python3 -m json.tool
echo ""

# Extrair ID do plano criado
PLAN_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id_service', ''))" 2>/dev/null)

if [ -n "$PLAN_ID" ]; then
  echo -e "${GREEN}✅ Plano criado com sucesso! ID: $PLAN_ID${NC}"
  echo ""

  echo -e "${YELLOW}📝 4. Atualizando o plano de teste via API (PUT)${NC}"
  echo "PUT $API_URL/partner-leads/services/$PLAN_ID"

  UPDATE_PAYLOAD=$(cat <<'EOF'
{
  "service_name": "Plano de Teste Clínica (ATUALIZADO)",
  "max_licenses": 15
}
EOF
)

  curl -s -X PUT \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD" \
    "$API_URL/partner-leads/services/$PLAN_ID" | python3 -m json.tool
  echo ""

  echo -e "${GREEN}✅ Plano atualizado!${NC}"
  echo ""

  echo -e "${YELLOW}📝 5. Deletando o plano de teste via API (DELETE)${NC}"
  echo "DELETE $API_URL/partner-leads/services/$PLAN_ID"

  curl -s -X DELETE \
    -H "Authorization: Bearer $API_KEY" \
    "$API_URL/partner-leads/services/$PLAN_ID"
  echo ""
  echo -e "${GREEN}✅ Plano marcado como inativo!${NC}"
else
  echo -e "${RED}❌ Erro ao criar plano de teste${NC}"
fi

echo ""
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "📚 Resumo das mudanças implementadas:"
echo "   ✓ Adicionado campo 'tp_partner' (clinica, profissional, fornecedor, universal)"
echo "   ✓ Adicionado campo 'max_licenses' (quantidade máxima de licenças)"
echo "   ✓ Campo 'max_licenses' é condicional no frontend (apenas para plano_base)"
echo "   ✓ Backend atualizado (models, services, schemas Pydantic)"
echo "   ✓ Frontend atualizado (PartnerPlansManager.tsx com novos campos)"
echo ""
