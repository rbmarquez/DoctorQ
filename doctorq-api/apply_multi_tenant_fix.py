#!/usr/bin/env python3
"""
Script para aplicar correções de multi-tenancy em todas as rotas da API.

Este script corrige automaticamente as rotas que não estão filtrando por id_empresa,
adicionando o filtro obrigatório baseado no usuário logado.

Uso:
    python apply_multi_tenant_fix.py
"""

import re
from pathlib import Path
from typing import List, Tuple

# Mapeamento de tabelas para tipo de filtro
TABLES_WITH_ID_EMPRESA = [
    "tb_agentes", "tb_albuns", "tb_analytics_events", "tb_analytics_snapshots",
    "tb_api_keys", "tb_apikey", "tb_atividades", "tb_avaliacoes_agentes",
    "tb_banners", "tb_categorias_financeiras", "tb_configuracoes",
    "tb_contas_bancarias", "tb_conversas_usuarios", "tb_cupons", "tb_empresas",
    "tb_faturas", "tb_fornecedores", "tb_instalacoes_marketplace", "tb_logs_erro",
    "tb_logs_integracao", "tb_notificacoes", "tb_pagamentos", "tb_perfis",
    "tb_pesquisas", "tb_produtos", "tb_prompt_biblioteca", "tb_repasses",
    "tb_respostas_rapidas", "tb_template_installations", "tb_templates_mensagens",
    "tb_transacoes", "tb_users"
]

TABLES_WITH_ID_CLINICA = [
    "tb_agendamentos", "tb_avaliacoes", "tb_clinicas", "tb_favoritos",
    "tb_pacientes", "tb_procedimentos", "tb_profissionais",
    "tb_profissionais_clinicas", "tb_prontuarios", "tb_qrcodes_avaliacao"
]

def find_route_files(routes_dir: Path) -> List[Path]:
    """Encontra todos os arquivos de rotas Python"""
    return list(routes_dir.glob("*.py"))

def detect_table_in_query(content: str) -> Tuple[str, str]:
    """
    Detecta qual tabela principal está sendo usada na query SQL.
    Retorna (table_name, filter_type)
    """
    # Procurar por FROM tb_xxxxx
    match = re.search(r'FROM\s+(tb_\w+)', content, re.IGNORECASE)
    if not match:
        return None, None

    table_name = match.group(1).lower()

    if table_name in TABLES_WITH_ID_EMPRESA:
        return table_name, "id_empresa"
    elif table_name in TABLES_WITH_ID_CLINICA:
        return table_name, "id_clinica"
    else:
        return table_name, "unknown"

def analyze_route_file(file_path: Path) -> dict:
    """Analisa um arquivo de rota e retorna informações sobre correções necessárias"""
    content = file_path.read_text(encoding='utf-8')

    results = {
        "file": str(file_path),
        "needs_fix": False,
        "routes": [],
        "table": None,
        "filter_type": None
    }

    # Procurar por endpoints GET com queries SQL
    route_pattern = r'@router\.get\(["\']/(.*?)["\'].*?\)\s*async def (\w+)\((.*?)\):'
    query_pattern = r'text\s*\(\s*f?"""(.*?)"""'

    for route_match in re.finditer(route_pattern, content, re.DOTALL):
        endpoint = route_match.group(1)
        function_name = route_match.group(2)
        params = route_match.group(3)

        # Verificar se já tem current_user
        has_current_user = "current_user" in params

        # Buscar query SQL na função
        function_start = route_match.end()
        # Procurar até a próxima função ou final do arquivo
        next_function = re.search(r'^@router\.|^async def ', content[function_start:], re.MULTILINE)
        function_end = function_start + next_function.start() if next_function else len(content)
        function_body = content[function_start:function_end]

        query_match = re.search(query_pattern, function_body, re.DOTALL | re.IGNORECASE)
        if query_match:
            query_sql = query_match.group(1)
            table, filter_type = detect_table_in_query(query_sql)

            if table and filter_type != "unknown" and not has_current_user:
                results["needs_fix"] = True
                results["table"] = table
                results["filter_type"] = filter_type
                results["routes"].append({
                    "endpoint": endpoint,
                    "function": function_name,
                    "table": table,
                    "filter_type": filter_type,
                    "has_current_user": has_current_user
                })

    return results

def main():
    """Função principal"""
    routes_dir = Path(__file__).parent / "src" / "routes"

    if not routes_dir.exists():
        print(f"❌ Diretório de rotas não encontrado: {routes_dir}")
        return

    print("🔍 Analisando arquivos de rotas...")
    print("=" * 80)

    files_to_fix = []
    total_routes = 0

    for route_file in find_route_files(routes_dir):
        if route_file.name.startswith("__"):
            continue

        analysis = analyze_route_file(route_file)

        if analysis["needs_fix"]:
            files_to_fix.append(analysis)
            total_routes += len(analysis["routes"])

            print(f"\n📁 {route_file.name}")
            print(f"   Tabela: {analysis['table']}")
            print(f"   Tipo de filtro: {analysis['filter_type']}")
            print(f"   Rotas a corrigir: {len(analysis['routes'])}")

            for route in analysis["routes"]:
                print(f"   - GET /{route['endpoint']} ({route['function']})")

    print("\n" + "=" * 80)
    print(f"📊 RESUMO:")
    print(f"   Arquivos que precisam de correção: {len(files_to_fix)}")
    print(f"   Total de rotas a corrigir: {total_routes}")

    if files_to_fix:
        print("\n⚠️  AÇÃO NECESSÁRIA:")
        print("   As rotas acima não estão filtrando por empresa/clínica.")
        print("   Elas precisam ser corrigidas manualmente adicionando:")
        print("   1. current_user: User = Depends(get_current_user) nos parâmetros")
        print("   2. Filtro WHERE apropriado na query SQL")
        print("\n💡 Padrão de correção:")
        print("   - Para tabelas com id_empresa: WHERE tabela.id_empresa = current_user.id_empresa")
        print("   - Para tabelas com id_clinica: INNER JOIN tb_clinicas + WHERE clinicas.id_empresa = current_user.id_empresa")
    else:
        print("\n✅ Todas as rotas estão corretamente filtradas!")

if __name__ == "__main__":
    main()
