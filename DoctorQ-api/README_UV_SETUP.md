# 🚀 Setup InovaIA API com UV

## ✅ Migração Completa para UV

Este projeto agora usa **UV** (ultraviolet) como gerenciador de pacotes Python, substituindo o Poetry.

### 🎯 Vantagens do UV

- ⚡ **10-100x mais rápido** que pip e Poetry
- 🦀 **Escrito em Rust** - performance nativa
- 📦 **Compatível** com padrões Python (PEP 621)
- 🔒 **Lock file eficiente** para reprodutibilidade
- 🐍 **Gerenciamento automático** de versões Python

## 📋 Pré-requisitos

### Instalar UV

#### Linux/macOS
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Windows (PowerShell)
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### Via pip (alternativa)
```bash
pip install uv
```

### Verificar instalação
```bash
uv --version
# Esperado: uv 0.9.x ou superior
```

## 🏗️ Setup do Projeto

### 1. Clone e navegue até o diretório
```bash
cd /mnt/repositorios/InovaIA/inovaia-api
```

### 2. Instale as dependências
```bash
# Usando Makefile (recomendado)
make install

# Ou diretamente com UV
uv sync
```

### 3. Configure variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp env-exemplo .env

# Edite o .env com suas configurações
nano .env
```

**Variáveis essenciais:**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/inovaia

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# LLM Providers
OPENAI_API_KEY=sk-...
# AZURE_OPENAI_API_KEY=...
# OLLAMA_BASE_URL=http://localhost:11434

# Security
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

# CORS
URL_PERMITIDA=http://localhost:3000

# Debug
LOG_LEVEL=INFO
DEBUG=false
```

### 4. Execute o servidor

#### Desenvolvimento (com hot-reload)
```bash
make dev
# Servidor rodando em: http://localhost:8080
```

#### Produção
```bash
make prod
```

### 5. Verifique se está funcionando
```bash
# Em outro terminal
curl http://localhost:8080/health
# Esperado: {"status":"healthy"}
```

## 📝 Comandos Disponíveis

### Gerenciamento de Dependências
```bash
# Instalar todas as dependências
make install
# ou: uv sync

# Instalar com dependências de desenvolvimento
make sync
# ou: uv sync --all-extras

# Adicionar nova dependência
uv add nome-do-pacote

# Adicionar dependência de desenvolvimento
uv add --dev nome-do-pacote

# Remover dependência
uv remove nome-do-pacote

# Atualizar todas as dependências
uv sync --upgrade
```

### Desenvolvimento
```bash
# Servidor de desenvolvimento (porta 8080)
make dev

# Servidor de produção com Gunicorn
make prod

# Servidor básico
make start
```

### Qualidade de Código
```bash
# Executar linters (ruff + pylint)
make lint

# Auto-corrigir problemas (ruff, isort, black)
make fix
```

### Testes e Database
```bash
# Testar conexão com database
make check-db
```

### Limpeza
```bash
# Remover cache, __pycache__, .venv, uv.lock
make clean
```

## 🏗️ Estrutura do Projeto

```
inovaia-api/
├── src/
│   ├── main.py              # Entry point FastAPI
│   ├── routes/              # Endpoints da API
│   ├── services/            # Lógica de negócio
│   ├── agents/              # Agentes de IA
│   ├── models/              # Modelos Pydantic/DB
│   ├── llms/                # Integrações LLM
│   ├── tools/               # Ferramentas dos agentes
│   ├── middleware/          # Auth, logging, etc.
│   ├── config/              # Configurações
│   └── utils/               # Utilitários
├── pyproject.toml           # Configuração do projeto
├── Makefile                 # Comandos de build
├── .env                     # Variáveis de ambiente (não commitado)
├── env-exemplo              # Template de .env
└── README_UV_SETUP.md       # Este arquivo
```

## 🔍 Troubleshooting

### UV não encontrado após instalação
```bash
# Adicione ao PATH (Linux/macOS)
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verifique
which uv
```

### Erro de versão do Python
```bash
# UV gerencia versões automaticamente
uv python list
uv python install 3.12
```

### Erro ao instalar dependências
```bash
# Limpe e reinstale
make clean
uv sync --all-extras
```

### Porta 8080 já em uso
```bash
# Mude a porta no comando
uv run uvicorn src.main:app --host 0.0.0.0 --port 8081 --reload
```

### Database não conecta
```bash
# Teste a conexão
make check-db

# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql
# ou
docker ps | grep postgres
```

### Redis opcional
O projeto funciona sem Redis, mas com performance reduzida para cache. Se Redis não estiver disponível, apenas um warning será exibido nos logs.

## 📚 Recursos

- [Documentação UV](https://docs.astral.sh/uv/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [LangChain Docs](https://python.langchain.com/)
- [PEP 621 - Metadata](https://peps.python.org/pep-0621/)

## 🆚 Migração do Poetry

Se você está migrando de Poetry:

| Poetry | UV |
|--------|-----|
| `poetry install` | `uv sync` |
| `poetry add pkg` | `uv add pkg` |
| `poetry remove pkg` | `uv remove pkg` |
| `poetry run cmd` | `uv run cmd` |
| `poetry update` | `uv sync --upgrade` |

**Arquivos removidos:**
- ❌ `poetry.lock`
- ❌ `package.json` (erro de Node.js)
- ❌ `package-lock.json`

**Arquivos novos:**
- ✅ `uv.lock` (auto-gerado, pode ser gitignored)
- ✅ `.python-version`

## 🚀 Quick Start

```bash
# 1. Instalar UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Instalar dependências
cd /mnt/repositorios/InovaIA/inovaia-api
make install

# 3. Configurar .env
cp env-exemplo .env
# Edite .env com suas configurações

# 4. Rodar servidor
make dev

# 5. Testar
curl http://localhost:8080/health
```

## 📞 Suporte

Em caso de problemas, consulte:
1. [MIGRATION_UV.md](./MIGRATION_UV.md) - Detalhes da migração
2. [readme.md](./readme.md) - Documentação geral da API
3. Logs do servidor: verifique mensagens de erro detalhadas
