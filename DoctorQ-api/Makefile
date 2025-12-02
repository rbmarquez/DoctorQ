.PHONY: install dev prod start lint test fix clean check-db db-init db-reset db-shell migrate revision help

# =============================================
# DoctorQ API - Makefile
# =============================================

# UV path (add to PATH if installed in ~/.local/bin)
UV := $(shell which uv 2>/dev/null || echo ~/.local/bin/uv)

DB_HOST := $(or $(DATABASE_HOST),$(POSTGRES_HOST),localhost)
DB_PORT := $(or $(DATABASE_PORT),$(POSTGRES_PORT),5432)
DB_NAME := $(or $(DATABASE_NAME),doctorq)
DB_USER := $(or $(DATABASE_USERNAME),$(POSTGRES_USER),postgres)
DB_PASSWORD := $(or $(DATABASE_PASSWORD),$(POSTGRES_PASSWORD),postgres)

help:
	@echo "DoctorQ API - Comandos disponíveis:"
	@echo ""
	@echo "  make install     - Instalar dependências"
	@echo "  make sync        - Instalar com dependências de dev"
	@echo "  make dev         - Executar servidor de desenvolvimento"
	@echo "  make prod        - Executar servidor de produção"
	@echo "  make lint        - Executar linting"
	@echo "  make fix         - Corrigir problemas de formatação"
	@echo "  make clean       - Limpar arquivos temporários"
	@echo "  make check-db    - Testar conexão com banco"
	@echo "  make migrate     - Aplicar migrations (alembic upgrade head)"
	@echo "  make revision    - Gerar nova migration (autogenerate)"
	@echo "  make db-init     - Inicializar banco de dados"
	@echo "  make db-reset    - Resetar banco de dados (cuidado!)"
	@echo "  make db-shell    - Abrir shell do PostgreSQL"
	@echo ""

install:
	@echo "📦 Instalando dependências..."
	$(UV) sync

sync:
	@echo "📦 Instalando dependências (com dev extras)..."
	$(UV) sync --all-extras

dev:
	@echo "🚀 Iniciando servidor de desenvolvimento..."
	$(UV) run uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload

prod:
	@echo "🚀 Iniciando servidor de produção..."
	$(UV) run gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 --workers 4 --log-level info

start:
	@echo "🚀 Iniciando servidor..."
	$(UV) run uvicorn src.main:app --reload

lint:
	@echo "🔍 Executando linting..."
	$(UV) run ruff check src/
	$(UV) run pylint src/

test:
	@echo "🧪 Executando testes..."
	$(UV) run pytest

migrate:
	@echo "🗄️ Aplicando migrations (alembic upgrade head)..."
	$(UV) run alembic upgrade head

revision:
	@read -p "Descrição da migração: " MSG; \
	if [ -z "$$MSG" ]; then \
		echo "Descrição obrigatória."; \
		exit 1; \
	fi; \
	echo "🛠️ Gerando migration com alembic..."; \
	$(UV) run alembic revision --autogenerate -m "$$MSG"

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
	uv run python scripts/test_db_connection.py

db-init:
	@echo "🗄️ Inicializando banco de dados..."
	@read -p "Nome do database [$(DB_NAME)]: " TARGET_DB; \
	TARGET_DB=$${TARGET_DB:-$(DB_NAME)}; \
	PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $$TARGET_DB -f database/migration_001_init_doctorq.sql

db-reset:
	@echo "⚠️  ATENÇÃO: Este comando irá apagar TODOS os dados!"
	@read -p "Tem certeza? Digite 'RESET' para confirmar: " CONFIRM; \
	if [ "$$CONFIRM" = "RESET" ]; then \
		echo "🗄️ Resetando banco de dados..."; \
		PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -c "DROP DATABASE IF EXISTS $(DB_NAME);"; \
		PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -c "CREATE DATABASE $(DB_NAME);"; \
		PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME) -f database/migration_001_init_doctorq.sql; \
		echo "✅ Banco resetado com sucesso!"; \
	else \
		echo "❌ Operação cancelada."; \
	fi

db-shell:
	@echo "🐘 Abrindo shell do PostgreSQL..."
	PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME)
