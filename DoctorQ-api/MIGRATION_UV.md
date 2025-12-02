# Migração para UV

Este projeto foi migrado de **Poetry** para **UV** (ultraviolet), um gerenciador de pacotes Python extremamente rápido escrito em Rust.

## Por que UV?

- **10-100x mais rápido** que pip e Poetry
- **Compatível** com pyproject.toml padrão (PEP 621)
- **Gerenciamento automático** de versões do Python
- **Lock file** mais eficiente
- **Resolução de dependências** ultrarrápida

## Instalação do UV

### Linux/macOS
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Via pip (alternativa)
```bash
pip install uv
```

## Comandos Básicos

### Instalação de Dependências
```bash
# Instalar todas as dependências
uv sync

# Instalar com dependências de desenvolvimento
uv sync --all-extras

# Ou usar o Makefile
make install
make sync
```

### Executar Aplicação
```bash
# Desenvolvimento (com hot-reload)
make dev
# ou: uv run uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload

# Produção
make prod
# ou: uv run gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 --workers 4
```

### Gerenciamento de Dependências
```bash
# Adicionar nova dependência
uv add nome-do-pacote

# Adicionar dependência de desenvolvimento
uv add --dev nome-do-pacote

# Remover dependência
uv remove nome-do-pacote

# Atualizar dependências
uv sync --upgrade
```

### Linting e Formatação
```bash
make lint  # Executar ruff e pylint
make fix   # Auto-corrigir com ruff, isort e black
```

### Limpeza
```bash
make clean  # Remove __pycache__, .pyc, .venv, uv.lock
```

## Diferenças em Relação ao Poetry

| Comando Poetry | Comando UV | Descrição |
|----------------|------------|-----------|
| `poetry install` | `uv sync` | Instalar dependências |
| `poetry add pkg` | `uv add pkg` | Adicionar pacote |
| `poetry remove pkg` | `uv remove pkg` | Remover pacote |
| `poetry run cmd` | `uv run cmd` | Executar comando |
| `poetry shell` | N/A | UV cria venv automaticamente |
| `poetry update` | `uv sync --upgrade` | Atualizar dependências |

## Estrutura de Arquivos

- **pyproject.toml** - Configuração do projeto (migrado para PEP 621)
- **uv.lock** - Lock file (gerado automaticamente, não commitar se preferir)
- **.python-version** - Versão do Python (3.12)
- **Makefile** - Scripts de build e desenvolvimento

## Migração Concluída

✅ Removido: `poetry.lock`, `package.json`, `package-lock.json`
✅ Atualizado: `pyproject.toml` (formato PEP 621)
✅ Atualizado: `Makefile` (comandos com UV)
✅ Criado: `.python-version`

## Troubleshooting

### UV não encontrado
Certifique-se de que UV está no PATH:
```bash
echo $PATH | grep .cargo/bin
# ou
which uv
```

### Versão do Python incorreta
UV gerencia versões automaticamente. Verifique:
```bash
uv python list
uv python install 3.12
```

### Dependências não instaladas
Limpe e reinstale:
```bash
make clean
uv sync --all-extras
```

## Referências

- [Documentação UV](https://docs.astral.sh/uv/)
- [PEP 621](https://peps.python.org/pep-0621/) - Metadata em pyproject.toml
- [Guia de Migração](https://docs.astral.sh/uv/guides/projects/)
