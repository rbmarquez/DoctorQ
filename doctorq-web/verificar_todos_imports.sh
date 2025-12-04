#!/bin/bash

echo "🔍 Verificação Completa de Imports - EstetiQ Frontend"
echo "=================================================="
echo ""

# Diretórios principais para verificar
declare -A DIRS=(
  ["lib"]="src/lib"
  ["hooks"]="src/hooks"
  ["components"]="src/components"
  ["types"]="src/types"
  ["utils"]="src/utils"
  ["contexts"]="src/contexts"
  ["app/contexts"]="src/app/contexts"
)

faltantes=0

for dir_name in "${!DIRS[@]}"; do
  dir_path="${DIRS[$dir_name]}"
  
  if [ -d "$dir_path" ]; then
    count=$(find "$dir_path" -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | wc -l)
    echo "✅ $dir_name: $count arquivos"
  else
    echo "❌ FALTANDO PASTA: $dir_path"
    ((faltantes++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Arquivos críticos específicos
echo ""
echo "Arquivos Críticos:"
critical_files=(
  "src/lib/api/index.ts"
  "src/lib/api/endpoints.ts"
  "src/lib/api/client.ts"
  "src/lib/logger.ts"
  "src/lib/agentes-cache.ts"
  "src/lib/chrome-runtime-fix.ts"
  "src/lib/debug-repeat.ts"
  "src/components/sidebar.tsx"
  "src/components/providers.tsx"
  "src/app/page.tsx"
  "src/app/layout.tsx"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ FALTANDO: $file"
    ((faltantes++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $faltantes -eq 0 ]; then
  echo "✅ Todos os arquivos críticos estão OK!"
  echo "🚀 Pronto para reiniciar o servidor"
else
  echo "❌ Encontrados $faltantes problemas"
  echo "⚠️  Corrija antes de continuar"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
