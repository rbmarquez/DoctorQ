#!/bin/bash

echo "🔍 Verificando imports faltantes..."
echo ""

# Lista de imports comuns para verificar
imports=(
  "lib/logger.ts"
  "lib/logger-env.ts"
  "lib/logger-utils.ts"
  "utils/storage.ts"
  "types/agentes.ts"
  "components/sidebar.tsx"
  "components/providers.tsx"
  "app/contexts/AgentContext.tsx"
  "app/contexts/AuthContext.tsx"
  "app/contexts/ChatInitialContext.tsx"
  "app/contexts/MarketplaceContext.tsx"
)

faltantes=0

for import in "${imports[@]}"; do
  if [ -f "src/$import" ]; then
    echo "✅ src/$import"
  else
    echo "❌ FALTANDO: src/$import"
    ((faltantes++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $faltantes -eq 0 ]; then
  echo "✅ Todos os imports verificados estão OK!"
  echo "🚀 Você pode reiniciar o servidor agora."
else
  echo "❌ Encontrados $faltantes imports faltantes"
  echo "⚠️  Corrija antes de reiniciar o servidor"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
