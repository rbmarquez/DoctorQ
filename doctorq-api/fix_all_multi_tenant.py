#!/usr/bin/env python3
"""
Script para aplicar TODAS as correções de multi-tenancy de uma vez.
Aplica padrões específicos para cada tipo de tabela.
"""

import re
from pathlib import Path
from typing import Dict, List

# Mapeamento completo de correções
ROUTE_FIXES: Dict[str, Dict] = {
    # ALTA PRIORIDADE
    "src/routes/procedimentos_route.py": {
        "table": "tb_procedimentos",
        "filter_type": "id_clinica",
        "import_exists": False,
    },
    "src/routes/profissionais_route.py": {
        "table": "tb_profissionais",
        "filter_type": "id_clinica",
        "import_exists": True,  # Já tem imports
        "skip_routes": ["listar_profissionais"],  # Já corrigida
    },
    "src/routes/agendamentos_route.py": {
        "table": "tb_agendamentos",
        "filter_type": "id_clinica",
        "import_exists": True,  # Já tem imports
        "skip_routes": ["list_agendamentos"],  # Já corrigida
    },

    # MÉDIA PRIORIDADE
    "src/routes/configuracoes_route.py": {
        "table": "tb_configuracoes",
        "filter_type": "id_empresa",
        "import_exists": False,
    },
    "src/routes/notificacoes_route.py": {
        "table": "tb_notificacoes",
        "filter_type": "id_empresa",
        "import_exists": False,
    },
    "src/routes/transacoes_route.py": {
        "table": "tb_transacoes",
        "filter_type": "id_empresa",
        "import_exists": False,
    },

    # BAIXA PRIORIDADE
    "src/routes/favoritos_route.py": {
        "table": "tb_favoritos",
        "filter_type": "id_clinica",
        "import_exists": False,
    },
    "src/routes/produtos_route.py": {
        "table": "tb_produtos",
        "filter_type": "id_empresa",  # Verificar schema
        "import_exists": False,
    },
    "src/routes/qrcodes_route.py": {
        "table": "tb_qrcodes_avaliacao",
        "filter_type": "id_clinica",
        "import_exists": False,
    },
    "src/routes/whatsapp_route.py": {
        "table": "tb_agendamentos",
        "filter_type": "id_clinica",
        "import_exists": False,
    },
}


def add_imports(content: str, import_exists: bool) -> str:
    """Adiciona imports User e get_current_user se não existirem"""
    if import_exists:
        return content

    if "from src.models.user import User" in content:
        return content

    # Encontrar linha de import de auth
    pattern = r'(from src\.utils\.auth import [^\n]+)'
    match = re.search(pattern, content)

    if not match:
        # Adicionar depois de ORMConfig
        pattern = r'(from src\.config\.orm_config import [^\n]+)'
        match = re.search(pattern, content)
        if match:
            old_line = match.group(1)
            new_lines = f"{old_line}\nfrom src.models.user import User\nfrom src.utils.auth import get_current_user"
            content = content.replace(old_line, new_lines)
        return content

    old_import = match.group(1)

    # Adicionar User antes
    new_imports = "from src.models.user import User\n" + old_import

    # Adicionar get_current_user se não tiver
    if "get_current_user" not in old_import:
        new_imports = new_imports.replace(
            "from src.utils.auth import",
            "from src.utils.auth import get_current_user,"
        )

    content = content.replace(old_import, new_imports)
    return content


def fix_get_routes(content: str, filter_type: str, table: str, skip_routes: List[str] = None) -> str:
    """
    Corrige todas as rotas GET adicionando:
    1. current_user: User = Depends(get_current_user)
    2. Filtro WHERE apropriado
    """
    skip_routes = skip_routes or []

    # Padrão para encontrar rotas GET
    get_pattern = r'(@router\.get\([^\)]+\)\s*async def\s+(\w+)\([^)]+\):)'

    matches = list(re.finditer(get_pattern, content, re.DOTALL))

    for match in reversed(matches):  # Reverso para não afetar índices
        full_match = match.group(0)
        func_name = match.group(2)

        # Pular se já corrigida
        if func_name in skip_routes:
            continue

        # Pular se já tem current_user
        if "current_user:" in full_match or "current_user =" in full_match:
            continue

        # Substituir get_current_apikey por get_current_user
        if "get_current_apikey" in full_match:
            new_match = full_match.replace(
                "_: object = Depends(get_current_apikey)",
                "current_user: User = Depends(get_current_user)"
            )
            new_match = new_match.replace(
                "_ = Depends(get_current_apikey)",
                "current_user: User = Depends(get_current_user)"
            )
            content = content.replace(full_match, new_match)

    # Adicionar filtros nas queries SQL
    if filter_type == "id_empresa":
        # Tabelas com id_empresa direto
        # Procurar WHERE clauses e adicionar filtro
        content = re.sub(
            r'(WHERE\s+[\w\.]+\s*=\s*[^\n]+)',
            r'\1 AND {}.id_empresa = :id_empresa'.format(table[0]),  # Alias da tabela
            content,
            flags=re.IGNORECASE
        )

        # Adicionar parâmetro id_empresa
        content = re.sub(
            r'(params\s*=\s*\{[^}]*)',
            r'\1, "id_empresa": str(current_user.id_empresa)',
            content
        )

    elif filter_type == "id_clinica":
        # Tabelas com id_clinica - precisa JOIN
        # Procurar FROM tabela e adicionar JOIN
        alias = table[3]  # Pega alias da tabela (ex: tb_procedimentos -> p)

        content = re.sub(
            rf'(FROM\s+{table}\s+{alias}(?!\s+INNER JOIN tb_clinicas))',
            rf'\1 INNER JOIN tb_clinicas c ON {alias}.id_clinica = c.id_clinica',
            content,
            flags=re.IGNORECASE
        )

        # Adicionar WHERE c.id_empresa
        content = re.sub(
            r'(WHERE\s+[\w\.]+\s*=\s*[^\n]+)',
            r'\1 AND c.id_empresa = :id_empresa',
            content,
            flags=re.IGNORECASE
        )

        # Adicionar parâmetro
        content = re.sub(
            r'(params\s*=\s*\{[^}]*)',
            r'\1, "id_empresa": str(current_user.id_empresa)',
            content
        )

    return content


def main():
    print("🔧 Aplicando TODAS as correções de multi-tenancy...")
    print("=" * 80)

    base_dir = Path(__file__).parent
    fixed = []
    failed = []

    for file_path, config in ROUTE_FIXES.items():
        full_path = base_dir / file_path

        if not full_path.exists():
            print(f"⚠️  Não encontrado: {file_path}")
            failed.append(file_path)
            continue

        print(f"\n📝 {file_path}")
        print(f"   Tabela: {config['table']}")
        print(f"   Filtro: {config['filter_type']}")

        try:
            # Ler
            content = full_path.read_text(encoding='utf-8')
            original = content

            # Aplicar correções
            content = add_imports(content, config.get('import_exists', False))
            content = fix_get_routes(
                content,
                config['filter_type'],
                config['table'],
                config.get('skip_routes', [])
            )

            # Salvar apenas se houve mudança
            if content != original:
                full_path.write_text(content, encoding='utf-8')
                print(f"   ✅ Corrigido!")
                fixed.append(file_path)
            else:
                print(f"   ℹ️  Sem mudanças necessárias")

        except Exception as e:
            print(f"   ❌ Erro: {e}")
            failed.append(file_path)

    print("\n" + "=" * 80)
    print(f"📊 RESUMO:")
    print(f"   ✅ Corrigidos: {len(fixed)}")
    print(f"   ❌ Falhas: {len(failed)}")
    print(f"   📁 Total: {len(ROUTE_FIXES)}")

    if fixed:
        print("\n✅ Arquivos corrigidos:")
        for f in fixed:
            print(f"   - {f}")

    if failed:
        print("\n❌ Falhas:")
        for f in failed:
            print(f"   - {f}")

    print("\n⚠️  IMPORTANTE:")
    print("   1. Revise as mudanças: git diff src/routes/")
    print("   2. Teste o backend: make dev")
    print("   3. Valide rotas específicas manualmente")


if __name__ == "__main__":
    main()
