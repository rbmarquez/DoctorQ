#!/usr/bin/env python3
"""
Script para aplicar correções de multi-tenancy automaticamente.
Autor: Claude Code
Data: 05/11/2025
"""

import re
from pathlib import Path

# Definições de correções por arquivo
FIXES = {
    "src/routes/procedimentos_route.py": {
        "table": "tb_procedimentos",
        "filter_type": "id_clinica",
        "routes": [
            {"method": "GET", "path": "/"},
            {"method": "GET", "path": "/categorias"},
            {"method": "GET", "path": "/{procedimento_id}"},
            {"method": "GET", "path": "/comparar/{nome_procedimento}"},
        ]
    },
    "src/routes/configuracoes_route.py": {
        "table": "tb_configuracoes",
        "filter_type": "id_empresa",
        "routes": [
            {"method": "GET", "path": "/"},
            {"method": "GET", "path": "/categorias"},
            {"method": "GET", "path": "/{chave}"},
        ]
    },
    "src/routes/notificacoes_route.py": {
        "table": "tb_notificacoes",
        "filter_type": "id_empresa",
        "routes": [
            {"method": "GET", "path": "/"},
            {"method": "GET", "path": "/{notificacao_id}"},
            {"method": "GET", "path": "/stats/{id_user}"},
        ]
    },
    "src/routes/transacoes_route.py": {
        "table": "tb_transacoes",
        "filter_type": "id_empresa",
        "routes": [
            {"method": "GET", "path": "/"},
            {"method": "GET", "path": "/stats"},
        ]
    },
}

def add_imports(content: str) -> str:
    """Adiciona imports necessários se não existirem"""
    if "from src.models.user import User" not in content:
        # Encontrar a linha após os imports existentes
        import_section = re.search(r'(from src\.utils\.auth import .*)', content)
        if import_section:
            old_import = import_section.group(1)
            new_import = old_import.replace(
                "from src.utils.auth import",
                "from src.models.user import User\nfrom src.utils.auth import"
            )
            if "get_current_user" not in old_import:
                new_import = new_import.replace(
                    "from src.utils.auth import get_current_apikey",
                    "from src.utils.auth import get_current_apikey, get_current_user"
                )
            content = content.replace(old_import, new_import)

    return content

def fix_get_endpoint(content: str, filter_type: str) -> str:
    """Corrige endpoints GET adicionando filtro de empresa"""

    # Substituir get_current_apikey por get_current_user em rotas GET
    content = re.sub(
        r'(@router\.get\([^\)]+\).*?async def [^\(]+\([^)]+)_: object = Depends\(get_current_apikey\)',
        r'\1current_user: User = Depends(get_current_user)',
        content,
        flags=re.DOTALL
    )

    # Adicionar filtro WHERE conforme tipo
    if filter_type == "id_empresa":
        # Adicionar filtro direto
        content = re.sub(
            r'(WHERE [^\n]+)',
            r'\1 AND tabela.id_empresa = :id_empresa',
            content
        )
    elif filter_type == "id_clinica":
        # Adicionar JOIN + filtro
        content = re.sub(
            r'(FROM tb_\w+)',
            r'\1 INNER JOIN tb_clinicas c ON tabela.id_clinica = c.id_clinica',
            content
        )
        content = re.sub(
            r'(WHERE [^\n]+)',
            r'\1 AND c.id_empresa = :id_empresa',
            content
        )

    return content

def main():
    print("🔧 Aplicando correções de multi-tenancy automaticamente...")
    print("=" * 80)

    base_dir = Path(__file__).parent
    fixed_count = 0

    for file_path, config in FIXES.items():
        full_path = base_dir / file_path

        if not full_path.exists():
            print(f"⚠️  Arquivo não encontrado: {file_path}")
            continue

        print(f"\n📝 Processando: {file_path}")
        print(f"   Tabela: {config['table']}")
        print(f"   Tipo: {config['filter_type']}")
        print(f"   Rotas: {len(config['routes'])}")

        try:
            # Ler conteúdo
            content = full_path.read_text(encoding='utf-8')

            # Aplicar correções
            content = add_imports(content)
            content = fix_get_endpoint(content, config['filter_type'])

            # Salvar
            full_path.write_text(content, encoding='utf-8')

            print(f"   ✅ Corrigido com sucesso!")
            fixed_count += 1

        except Exception as e:
            print(f"   ❌ Erro: {str(e)}")

    print("\n" + "=" * 80)
    print(f"📊 RESUMO:")
    print(f"   Arquivos corrigidos: {fixed_count}/{len(FIXES)}")
    print("\n⚠️  IMPORTANTE: Revise manualmente as mudanças antes de commitar!")
    print("   Use: git diff src/routes/")

if __name__ == "__main__":
    main()
