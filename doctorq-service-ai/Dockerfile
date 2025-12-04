# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build
FROM python:3.12-slim as builder

WORKDIR /app

# Instalar UV
RUN pip install --no-cache-dir uv

# Copiar arquivos de dependências
COPY pyproject.toml ./

# Instalar dependências
RUN uv sync --no-dev

# Stage 2: Runtime
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copiar UV e dependências do stage de build
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app/.venv /app/.venv

# Copiar código da aplicação
COPY src/ ./src/
COPY pyproject.toml ./

# Configurar PATH para incluir UV
ENV PATH="/root/.local/bin:/app/.venv/bin:${PATH}"

# Criar diretório para logs
RUN mkdir -p /app/logs

# Expor porta
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8082/ai/health/')" || exit 1

# Comando para iniciar a aplicação
CMD ["gunicorn", "src.main:app", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8082", "--workers", "4", "--timeout", "120"]
