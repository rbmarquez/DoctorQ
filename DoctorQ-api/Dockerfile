FROM python:3.12-slim as builder

# Instalar dependÃªncias de build do sistema
RUN apt-get update -q && \
    apt-get install -y -q --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar 'uv' (gerenciador de pacotes Python rÃ¡pido)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Copiar somente os arquivos de dependÃªncia para aproveitar o cache do Docker.
# A camada abaixo sÃ³ serÃ¡ reconstruÃ­da se estes arquivos mudarem.
COPY pyproject.toml uv.lock ./

# --- ESTRATÃ‰GIA ANTI-OOM ---
# 1. Instale o(s) pacote(s) mais pesado(s) primeiro e de forma isolada.
#    Substitua 'torch' pelo pacote que mais consome memÃ³ria no seu projeto.
#    Use '--no-deps' para evitar instalar dependÃªncias transitÃ³rias aqui.
# RUN uv pip install torch --no-deps

# 2. Instale o restante das dependÃªncias. 'uv' serÃ¡ inteligente o suficiente
#    para nÃ£o reinstalar o que jÃ¡ foi instalado.
RUN uv sync --frozen --no-install-project --no-dev


# ==============================================================================
# Stage 2: Runtime - Imagem final e enxuta para execuÃ§Ã£o
# ==============================================================================
FROM python:3.12-slim as runtime

# Definir variÃ¡veis de ambiente essenciais.
# 'TZ' configura o timezone para evitar problemas com datas e logs.
# OtimizaÃ§Ãµes Python para ambiente de contÃªiner.
ENV TZ=America/Sao_Paulo \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # Desabilitar paralelismo de tokenizers pode evitar deadlocks e uso excessivo de CPU.
    TOKENIZERS_PARALLELISM=false \
    # Limitar threads para ML/cÃ¡lculo numÃ©rico em ambientes sem GPU.
    CUDA_VISIBLE_DEVICES="" \
    OMP_NUM_THREADS=2 \
    MKL_NUM_THREADS=2 \
    # Definir o PATH para incluir os binÃ¡rios do venv e o 'uv'.
    PATH="/app/.venv/bin:/usr/local/bin:$PATH"

# Instalar dependÃªncias de runtime do sistema e configurar timezone.
RUN apt-get update -q && \
    apt-get install -y -q --no-install-recommends \
        libpq5 \
        tzdata \
        antiword \
        poppler-utils \
        tesseract-ocr \
        tesseract-ocr-por \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuÃ¡rio e grupo nÃ£o-root para seguranÃ§a.
# Agrupar comandos de criaÃ§Ã£o de diretÃ³rios e permissÃµes em uma Ãºnica camada.
RUN groupadd -r appuser && \
    useradd --no-log-init -r -g appuser -d /app -s /bin/bash appuser && \
    mkdir -p /app/logs /app/temp/uploads /app/.cache/huggingface /app/.cache/transformers /app/.EasyOCR && \
    chown -R appuser:appuser /app

WORKDIR /app
USER appuser

# Copiar o ambiente virtual Python do estÃ¡gio de build.
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# Copiar o binÃ¡rio 'uv' do estÃ¡gio de build (mais eficiente que baixar de novo).
COPY --from=builder /root/.local/bin/uv /usr/local/bin/uv

# Copiar o cÃ³digo da aplicaÃ§Ã£o. Esta Ã© uma das Ãºltimas etapas para que mudanÃ§as
# no cÃ³digo nÃ£o invalidem o cache das dependÃªncias.
COPY --chown=appuser:appuser src ./src
COPY --chown=appuser:appuser scripts ./scripts

# Fazer warmup dos modelos de IA/OCR para evitar downloads em produÃ§Ã£o
RUN python scripts/warmup_models.py

EXPOSE 8080

# Comando de execuÃ§Ã£o usando 'uv run' para ativar o venv implicitamente.
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
