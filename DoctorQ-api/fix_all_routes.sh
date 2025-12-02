#!/bin/bash

# Script para aplicar correções de multi-tenancy em todas as rotas pendentes
# Autor: Claude Code
# Data: 05/11/2025

echo "🔧 Aplicando correções de multi-tenancy em massa..."
echo "=================================================="

cd /mnt/repositorios/DoctorQ/doctorq-api

# Lista de arquivos a corrigir (já excluindo clinicas_route.py que foi corrigido manualmente)
files=(
    "src/routes/avaliacoes_route.py"
    "src/routes/procedimentos_route.py"
    "src/routes/profissionais_route.py"
    "src/routes/agendamentos_route.py"
    "src/routes/configuracoes_route.py"
    "src/routes/notificacoes_route.py"
    "src/routes/transacoes_route.py"
    "src/routes/favoritos_route.py"
    "src/routes/produtos_route.py"
    "src/routes/qrcodes_route.py"
    "src/routes/whatsapp_route.py"
)

backup_dir="backups_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

echo "📦 Criando backups em: $backup_dir"

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$backup_dir/$(basename $file)"
        echo "  ✓ Backup: $file"
    fi
done

echo ""
echo "✅ Backups criados com sucesso!"
echo ""
echo "⚠️  PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "1. Adicionar imports em cada arquivo:"
echo "   from src.models.user import User"
echo "   from src.utils.auth import get_current_user"
echo ""
echo "2. Substituir 'Depends(get_current_apikey)' por 'Depends(get_current_user)' nas funções GET"
echo ""
echo "3. Adicionar filtro WHERE apropriado:"
echo "   - Tabelas com id_empresa: WHERE tabela.id_empresa = current_user.id_empresa"
echo "   - Tabelas com id_clinica: JOIN tb_clinicas + WHERE clinicas.id_empresa = current_user.id_empresa"
echo ""
echo "📋 Arquivos a corrigir:"
for file in "${files[@]}"; do
    echo "   - $file"
done
echo ""
echo "💾 Backups salvos em: $backup_dir"
