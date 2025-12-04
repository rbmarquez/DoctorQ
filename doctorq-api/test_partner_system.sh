#!/bin/bash
# Script de teste rápido para o sistema de parcerias
# Autor: DoctorQ System
# Data: 10/11/2025

echo "🧪 Teste do Sistema de Parcerias - DoctorQ API"
echo "=============================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:8080"
API_KEY="vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

echo -e "${BLUE}📊 1. Verificando catálogo de serviços (17 planos)${NC}"
echo "GET $API_URL/partner-leads/services/"
curl -s -H "Authorization: Bearer $API_KEY" \
  "$API_URL/partner-leads/services/" | python3 -m json.tool | head -50
echo ""
echo ""

echo -e "${BLUE}📊 2. Verificando planos para Clínicas${NC}"
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq -c \
  "SELECT cd_service, nm_service, vl_preco_base, tp_categoria
   FROM tb_partner_service_definitions
   WHERE st_ativo = TRUE AND tp_categoria = 'clinica'
   ORDER BY vl_preco_base"
echo ""

echo -e "${BLUE}📊 3. Verificando tabela de histórico (deve estar vazia)${NC}"
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq -c \
  "SELECT COUNT(*) as total_registros FROM tb_partner_package_history"
echo ""

echo -e "${BLUE}📊 4. Verificando tabela N:N profissionais-clínicas${NC}"
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq -c \
  "SELECT COUNT(*) as total_vinculos FROM tb_profissionais_clinicas"
echo ""

echo -e "${GREEN}✅ Testes básicos concluídos!${NC}"
echo ""
echo "📚 Para testar os endpoints de upgrade:"
echo "   1. Acesse: http://localhost:8080/docs"
echo "   2. Procure por 'Parceiros - Upgrade & Unidades'"
echo "   3. Teste os endpoints com dados reais"
echo ""
echo "🔗 Endpoints disponíveis:"
echo "   POST /parceiros/clinicas/unidades/"
echo "   POST /parceiros/clinicas/vincular-profissional/"
echo "   GET  /parceiros/pacotes/{id}/calcular-upgrade/"
echo "   POST /parceiros/pacotes/{id}/upgrade/"
echo "   GET  /parceiros/pacotes/{id}/historico/"
