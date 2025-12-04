.PHONY: install dev prod start lint test fix clean check-db help

# =============================================
# DoctorQ Universidade da Beleza - Makefile
# =============================================

# UV path (add to PATH if installed in ~/.local/bin)
UV := $(shell which uv 2>/dev/null || echo ~/.local/bin/uv)

DB_HOST := $(or $(DATABASE_HOST),10.11.2.81)
DB_PORT := $(or $(DATABASE_PORT),5432)
DB_NAME := $(or $(DATABASE_NAME),doctorq_univ)
DB_USER := $(or $(DATABASE_USERNAME),postgres)
DB_PASSWORD := $(or $(DATABASE_PASSWORD),postgres)

help:
	@echo "DoctorQ Universidade da Beleza - Comandos disponíveis:"
	@echo ""
	@echo "  make install     - Instalar dependências"
	@echo "  make sync        - Instalar com dependências de dev"
	@echo "  make dev         - Executar servidor de desenvolvimento (porta 8082)"
	@echo "  make prod        - Executar servidor de produção"
	@echo "  make lint        - Executar linting"
	@echo "  make fix         - Corrigir problemas de formatação"
	@echo "  make test        - Executar testes"
	@echo "  make clean       - Limpar arquivos temporários"
	@echo "  make check-db    - Testar conexão com banco"
	@echo "  make db-shell    - Abrir shell do PostgreSQL"
	@echo ""

install:
	@echo "📦 Instalando dependências..."
	$(UV) sync

sync:
	@echo "📦 Instalando dependências (com dev extras)..."
	$(UV) sync --all-extras

dev:
	@echo "🚀 Iniciando servidor de desenvolvimento (porta 8082)..."
	$(UV) run uvicorn src.main:app --host 0.0.0.0 --port 8082 --reload

prod:
	@echo "🚀 Iniciando servidor de produção..."
	$(UV) run gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8082 --workers 4 --log-level info

start:
	@echo "🚀 Iniciando servidor..."
	$(UV) run uvicorn src.main:app --reload --port 8082

lint:
	@echo "🔍 Executando linting..."
	$(UV) run ruff check src/
	$(UV) run pylint src/

test:
	@echo "🧪 Executando testes..."
	$(UV) run pytest

fix:
	@echo "🔧 Corrigindo problemas de formatação..."
	$(UV) run ruff check src/ --fix
	$(UV) run isort src/
	$(UV) run black src/

clean:
	@echo "🧹 Limpando arquivos temporários..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf .venv uv.lock

check-db:
	@echo "🔍 Testando conexão com banco de dados..."
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME) -c "SELECT 1" && echo "✅ Conexão OK" || echo "❌ Falha na conexão"

db-shell:
	@echo "🐘 Abrindo shell do PostgreSQL..."
	PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME)
