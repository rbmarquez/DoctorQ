# Análise de Código - Boas Práticas e Pontos de Melhoria
## Projeto DoctorQ - Plataforma SaaS para Gestão de Clínicas de Estética

**Data da Análise:** 06/11/2025
**Versão do Projeto:** 1.0.0
**Tecnologias Principais:** FastAPI, Next.js 15, React 19, PostgreSQL, LangChain

---

## 📋 Sumário Executivo

O projeto **DoctorQ** é uma plataforma SaaS robusta e bem estruturada para gestão de clínicas de estética com integração de IA. A análise identificou diversos pontos fortes em termos de arquitetura e organização, mas também revelou oportunidades significativas de melhoria em áreas como testes, documentação, segurança e qualidade de código.

### Pontuação Geral por Categoria

| Categoria | Pontuação | Status |
|-----------|-----------|---------|
| **Arquitetura e Organização** | 8.5/10 | ✅ Excelente |
| **Qualidade de Código** | 6.5/10 | ⚠️ Precisa Melhorar |
| **Testes** | 3.0/10 | ❌ Crítico |
| **Documentação** | 7.0/10 | ✅ Bom |
| **Segurança** | 6.0/10 | ⚠️ Precisa Melhorar |
| **Performance** | 7.0/10 | ✅ Bom |
| **DevOps e CI/CD** | 5.0/10 | ⚠️ Precisa Melhorar |

**Média Geral: 6.1/10**

---

## 🎯 PARTE 1: BOAS PRÁTICAS IDENTIFICADAS

### 1.1 Arquitetura e Design

#### ✅ Pontos Fortes

**1. Arquitetura em Camadas Bem Definida (Backend)**
```
✓ Separação clara entre Routes, Services, Models
✓ Service-Oriented Architecture (SOA)
✓ Dependency Injection com FastAPI Depends
✓ Padrão Repository implícito nos services
```

**2. Monorepo Estruturado**
```
estetiQ-api/          # Backend isolado
estetiQ-web/          # Frontend isolado
DOC_Arquitetura/      # Documentação centralizada
```

**3. Configuração Centralizada**
```python
# src/config/settings.py
class AppSettings(BaseSettings):
    # Uso correto de Pydantic Settings
    # Validação automática de variáveis de ambiente
    # Caching com @lru_cache
```

**4. Async/Await First (Backend)**
- Todo o stack assíncrono: FastAPI + asyncpg + SQLAlchemy 2.0
- Escalabilidade horizontal garantida
- Lifespan context manager para inicialização/shutdown

**5. Component-Driven Architecture (Frontend)**
- Estrutura atômica de componentes
- Separação UI/Feature components
- Custom hooks para encapsulamento de lógica

### 1.2 Tecnologias e Stack

#### ✅ Escolhas Acertadas

**Backend:**
- FastAPI (moderno, rápido, type-safe)
- SQLAlchemy 2.0 com suporte async
- Pydantic para validação
- LangChain para orquestração de IA
- Qdrant para busca vetorial
- Redis para cache distribuído

**Frontend:**
- Next.js 15 com App Router (SSR, RSC)
- React 19 (features mais recentes)
- TypeScript para type safety
- Radix UI (acessibilidade nativa)
- Tailwind CSS (produtividade)
- SWR para data fetching

**Database:**
- PostgreSQL 16 com pgvector (vetores + relacional)
- Alembic para migrations versionadas

### 1.3 Code Quality

#### ✅ Práticas Positivas

**1. Type Safety**
```python
# Backend: Pydantic models com validação
class UserCreate(UserBase):
    nm_email: EmailStr = Field(..., description="Email do usuario")
    nm_completo: str = Field(..., description="Nome completo")
```

```typescript
// Frontend: TypeScript com schemas Zod
import { z } from "zod";
```

**2. Linting e Formatting**
- Ruff + Black + isort (backend)
- ESLint (frontend)
- Configuração de Pylint detalhada

**3. Environment-based Configuration**
```python
# Múltiplos ambientes suportados
database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
```

**4. Error Handling Estruturado**
```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Handler personalizado para erros de validação
```

### 1.4 Segurança

#### ✅ Implementações Corretas

**1. Autenticação Robusta**
- NextAuth com múltiplos providers (Google, Microsoft, Apple)
- JWT tokens
- Credentials provider para login local
- Password hashing com Passlib

**2. Middleware de Segurança**
```python
# CORS configurado
# API Key authentication middleware
# Quota enforcement middleware
# Tenant detection middleware
```

**3. Validação de Entrada**
- Pydantic validators em todos os models
- Zod schemas no frontend
- Email normalization (trim + lowercase)

### 1.5 Performance

#### ✅ Otimizações Presentes

**1. Caching Strategy**
- Redis para cache distribuído
- Agent-specific caching
- SWR para data fetching (frontend)

**2. Database Optimization**
- Indexes implícitos (unique constraints)
- Async queries (não-bloqueantes)
- Connection pooling via SQLAlchemy

**3. Build Optimization**
- Code splitting (Next.js automático)
- Image optimization
- Static file serving

---

## ❌ PARTE 2: PONTOS DE MELHORIA CRÍTICOS

### 2.1 Testes - **CRÍTICO** ❌

#### Problemas Identificados

**1. Cobertura de Testes Extremamente Baixa**
```
Backend:  ~5 arquivos de teste para 205 arquivos Python
Frontend: Configuração de testes presente, mas poucos testes implementados
```

**2. Ausência de Testes Unitários Críticos**
- Services sem testes (user_service.py, billing_service.py, etc.)
- Models sem validação de regras de negócio
- Routes sem testes de integração

**3. Testes E2E Mínimos**
- Playwright configurado, mas sem suíte completa
- Fluxos críticos não testados (checkout, agendamento, chat)

#### Impacto
- Alto risco de regressões
- Dificuldade para refatoração
- Bugs em produção
- Confiança reduzida em deploys

#### Solução Recomendada
```bash
# Meta mínima aceitável:
Backend:  70% de cobertura de código
Frontend: 60% de cobertura de componentes
E2E:      Fluxos críticos cobertos (login, checkout, agendamento)
```

### 2.2 Qualidade de Código

#### ⚠️ Problemas Detectados

**1. Configuração de Build Permissiva (Frontend)**
```typescript
// next.config.ts - CRÍTICO
eslint: {
  ignoreDuringBuilds: true,  // ❌ NUNCA fazer isso em produção
},
typescript: {
  ignoreBuildErrors: true,    // ❌ NUNCA fazer isso
}
```

**Impacto:** Permite deploy de código com erros de tipo e lint.

**2. Pylint com Muitas Exceções**
```python
# .pylintrc - 40+ regras desabilitadas
disable=missing-docstring,
        too-many-arguments,
        too-many-locals,
        # ... muitas outras
```

**Impacto:** Reduz efetividade do linting.

**3. Encodings Inconsistentes**
```python
# src/models/user.py - linha 1
﻿# src/models/user.py  # BOM (Byte Order Mark)
```

**Impacto:** Problemas em diferentes sistemas operacionais.

**4. Strings de Encoding Misturadas**
```python
# Comentários em português com caracteres especiais quebrados
"""Service para operaÃ§Ãµes com usuÃ¡rios"""  # ❌ Encoding incorreto
```

**5. Comentários em Múltiplos Idiomas**
- Código em inglês (variáveis, funções)
- Comentários em português
- Docstrings misturadas

**Impacto:** Dificulta colaboração internacional.

### 2.3 Segurança

#### 🔐 Vulnerabilidades e Riscos

**1. Secrets Hardcoded (Possível)**
```python
# Verificar se não há secrets em:
# - Código fonte
# - Commits antigos
# - Arquivos de configuração
```

**2. Rate Limiting Não Evidente**
- Middleware de quota presente, mas implementação não verificada
- Endpoints públicos podem estar vulneráveis a abuse

**3. CORS Permissivo (Desenvolvimento)**
```python
cors_origins: List[str] = Field(default_factory=lambda: ["*"])
```

**Impacto:** Aceita requisições de qualquer origem em dev.

**4. Session Management**
```typescript
// auth.ts
maxAge: 30 * 24 * 60 * 60, // 30 days - pode ser muito longo
```

**5. API Key Exposure**
```typescript
// lib/api.ts
const API_KEY = process.env.API_DOCTORQ_API_KEY;
// Verificar se está sendo exposto ao cliente
```

**6. SQL Injection (Baixo Risco)**
- SQLAlchemy ORM reduz risco, mas queries manuais devem ser auditadas

**7. Error Messages Verbosos**
```python
# Evitar expor stack traces em produção
logger.error(f"Erro crítico no banco de dados: {str(e)}")
```

### 2.4 Performance e Otimização

#### ⚡ Gargalos Potenciais

**1. N+1 Query Problem (Possível)**
```python
# SQLAlchemy com lazy loading pode gerar N+1
empresa = relationship("Empresa", back_populates="usuarios", lazy="select")
```

**Solução:** Usar eager loading com `joinedload()` ou `selectinload()`.

**2. Ausência de Pagination Universal**
```python
# Alguns endpoints podem não ter paginação
async def list_users(..., page: int = 1, size: int = 10):  # ✅ Tem
# Verificar se TODOS os endpoints de listagem têm paginação
```

**3. File Upload Sem Limites Claros**
```python
# src/routes/upload.py
# Verificar se há limite de tamanho de arquivo
# Verificar validação de tipos de arquivo
```

**4. Cache Invalidation Strategy**
- Cache presente, mas estratégia de invalidação não documentada
- Risco de dados desatualizados

**5. Database Connection Pool**
```python
# orm_config.py
# Verificar configuração de pool_size e max_overflow
```

**6. Frontend Bundle Size**
- Next.js 15 com muitas dependências
- Verificar se há lazy loading de componentes pesados

### 2.5 DevOps e CI/CD

#### 🚀 Infraestrutura

**1. Ausência de CI/CD Automatizado**
```
.github/workflows/ - Verificar se há pipelines configurados
```

**Necessário:**
- Build automático
- Testes automáticos
- Deploy automático (staging/prod)
- Linting obrigatório

**2. Docker Multi-Stage Build**
```dockerfile
# Verificar se Dockerfiles usam multi-stage para reduzir imagem
```

**3. Health Checks**
```python
# main.py - ✅ Tem /health e /ready
# Verificar se está configurado no K8s/orquestrador
```

**4. Logging Estruturado**
```python
# logger_config.py - ✅ Tem colorlog
# Verificar se logs vão para sistema centralizado (ELK, CloudWatch)
```

**5. Monitoramento e Observabilidade**
```python
# Langfuse para LLM observability - ✅
# Falta: APM (Application Performance Monitoring)
# Falta: Error tracking (Sentry, Rollbar)
```

**6. Secrets Management**
```
# Verificar uso de:
# - Kubernetes Secrets
# - AWS Secrets Manager
# - HashiCorp Vault
```

**7. Database Migrations em Produção**
```python
# Alembic presente - ✅
# Verificar estratégia de rollback
# Verificar backup antes de migrations
```

### 2.6 Documentação

#### 📚 Gaps Identificados

**1. Documentação de API Incompleta**
```
DOCUMENTACAO_API_PUBLICA.md - existe
Verificar se cobre:
- Todos os endpoints
- Exemplos de request/response
- Códigos de erro
- Rate limits
```

**2. Docstrings Inconsistentes**
```python
# Alguns métodos têm, outros não
async def create_user(self, user_data: UserCreate) -> User:
    """Criar um novo usuário"""  # ✅ Tem

async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
    """Obter usuário por ID"""  # ✅ Tem

# Mas muitos services não têm docstrings completas
```

**3. README Técnico**
- Falta guia de contribuição
- Falta troubleshooting
- Falta guia de debug local

**4. Architecture Decision Records (ADR)**
- Decisões arquiteturais não documentadas
- Exemplo: Por que FastAPI? Por que LangChain?

**5. Changelog Ausente**
```
CHANGELOG.md - não existe
Necessário para tracking de mudanças
```

### 2.7 Código Legado e Débito Técnico

#### 🏗️ Technical Debt

**1. Código Comentado**
```typescript
// lib/api.ts
// compress: true,  // ❌ Código comentado deve ser removido
```

**2. TODOs e FIXMEs**
```python
# Verificar se há TODOs não resolvidos
# Pylint configurado para detectar: TODO, FIXME, XXX
```

**3. Imports Não Utilizados**
```python
# Verificar com ruff se há imports não usados
```

**4. Dead Code**
```typescript
// auth.ts.backup - arquivo de backup no repositório
```

**5. Duplicação de Código**
```python
# Pylint tem duplicate-code desabilitado
# Pode haver duplicação não detectada
```

---

## 🛠️ PARTE 3: ROTEIRO DE MELHORIAS

### Fase 1: CRÍTICO - Curto Prazo (1-2 meses)

#### 🔴 Prioridade MÁXIMA

**1.1 Implementar Suíte de Testes (4 semanas)**

**Backend:**
```bash
# Meta: 70% de cobertura
Semana 1-2: Testes unitários de services críticos
  - user_service.py
  - billing_service.py
  - agent_service.py
  - embedding_service.py

Semana 3: Testes de integração de endpoints
  - /users/*
  - /billing/*
  - /agents/*

Semana 4: Testes E2E críticos
  - Fluxo de registro/login
  - Fluxo de agendamento
  - Fluxo de checkout
```

**Frontend:**
```bash
# Meta: 60% de cobertura
Semana 1-2: Testes de componentes críticos
  - Formulários de autenticação
  - Componentes de checkout
  - Chat interface

Semana 3: Testes de hooks customizados
  - useAuth
  - useChatSSE
  - useFileUpload

Semana 4: Playwright E2E
  - User journey completo
  - Fluxos de pagamento
  - Agendamento
```

**Ferramentas:**
```bash
# Backend
pip install pytest-cov pytest-asyncio faker freezegun

# Frontend
yarn add -D @testing-library/react @testing-library/jest-dom
```

**1.2 Corrigir Configuração de Build (1 dia)**

```typescript
// next.config.ts - CORRIGIR IMEDIATAMENTE
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,  // ✅ Corrigido
  },
  typescript: {
    ignoreBuildErrors: false,    // ✅ Corrigido
  },
  // ... resto
}
```

**1.3 Implementar CI/CD Pipeline (1 semana)**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: cd estetiQ-api && uv sync --all-extras
      - name: Run linting
        run: cd estetiQ-api && make lint
      - name: Run tests
        run: cd estetiQ-api && make test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd estetiQ-web && yarn install
      - name: Run linting
        run: cd estetiQ-web && yarn lint
      - name: Run tests
        run: cd estetiQ-web && yarn test
      - name: Build
        run: cd estetiQ-web && yarn build

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install Playwright
        run: cd estetiQ-web && yarn playwright install
      - name: Run E2E tests
        run: cd estetiQ-web && yarn test:e2e
```

**1.4 Implementar Error Tracking (2 dias)**

```python
# Backend: Sentry
# estetiQ-api/pyproject.toml
dependencies = [
    # ... existing
    "sentry-sdk[fastapi]>=1.40.0",
]

# estetiQ-api/src/main.py
import sentry_sdk

sentry_sdk.init(
    dsn=settings.sentry_dsn,
    environment=settings.environment,
    traces_sample_rate=0.1,
)
```

```typescript
// Frontend: Sentry
// estetiQ-web/instrumentation.ts
import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}
```

**1.5 Security Hardening (1 semana)**

```python
# Backend
# 1. Adicionar rate limiting global
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/users")
@limiter.limit("100/minute")
async def list_users():
    ...

# 2. Helmet-style headers
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. CORS restritivo em produção
if settings.environment == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_cors_origins,  # Lista específica
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

# 4. Secrets management
from cryptography.fernet import Fernet

# Usar AWS Secrets Manager ou HashiCorp Vault
# Nunca commitar secrets no código
```

```typescript
// Frontend
// 1. Content Security Policy
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

// 2. Environment variable validation
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  // ... todas as envs necessárias
});

export const env = envSchema.parse(process.env);
```

---

### Fase 2: IMPORTANTE - Médio Prazo (3-4 meses)

#### 🟠 Prioridade ALTA

**2.1 Melhorar Qualidade de Código (6 semanas)**

**Semana 1-2: Refatoração de Services Grandes**
```python
# Identificar e quebrar services >1000 linhas
# langchain_service.py (77KB) -> dividir em:
#   - langchain_orchestrator.py
#   - langchain_tools.py
#   - langchain_memory.py
#   - langchain_chains.py

# embedding_service.py (55KB) -> dividir em:
#   - embedding_generator.py
#   - embedding_storage.py
#   - embedding_retrieval.py
```

**Semana 3-4: Adicionar Type Hints Completos**
```python
# Habilitar mypy strict mode
# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

# Corrigir todos os type errors
```

**Semana 5-6: Melhorar Docstrings**
```python
# Adotar Google/NumPy docstring style
def create_user(self, user_data: UserCreate) -> User:
    """
    Cria um novo usuário no sistema.

    Args:
        user_data: Dados do usuário a ser criado, incluindo email e nome completo.

    Returns:
        Instância do usuário criado com ID gerado.

    Raises:
        ValueError: Se email já existir no banco de dados.
        RuntimeError: Se houver erro de banco de dados.

    Examples:
        >>> user_data = UserCreate(nm_email="teste@exemplo.com", nm_completo="Teste")
        >>> user = await service.create_user(user_data)
        >>> print(user.id_user)
        UUID('...')
    """
    ...
```

**2.2 Performance Optimization (4 semanas)**

**Semana 1: Database Query Optimization**
```python
# 1. Adicionar índices faltantes
# alembic revision -m "add_performance_indexes"

# migration/xxx_add_performance_indexes.py
def upgrade():
    # Índices compostos para queries frequentes
    op.create_index(
        'idx_users_email_ativo',
        'tb_users',
        ['nm_email', 'st_ativo']
    )

    op.create_index(
        'idx_agendamentos_clinica_data',
        'tb_agendamentos',
        ['id_clinica', 'dt_agendamento']
    )

    # Índice para busca full-text
    op.execute("""
        CREATE INDEX idx_procedimentos_nome_trgm
        ON tb_procedimentos
        USING gin (nm_procedimento gin_trgm_ops)
    """)

# 2. Eager loading para evitar N+1
from sqlalchemy.orm import selectinload

async def get_user_with_empresa(user_id: uuid.UUID):
    stmt = (
        select(User)
        .options(selectinload(User.empresa))
        .where(User.id_user == user_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

# 3. Query optimization
# Usar explain analyze para queries lentas
async def analyze_slow_query():
    result = await session.execute(
        text("EXPLAIN ANALYZE SELECT * FROM tb_users WHERE ...")
    )
    print(result.all())
```

**Semana 2: Caching Strategy**
```python
# 1. Cache decorator para funções pesadas
from functools import wraps
import hashlib
import json

def cache_result(ttl: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Gerar cache key
            cache_key = f"{func.__name__}:{hashlib.md5(
                json.dumps([args, kwargs], sort_keys=True).encode()
            ).hexdigest()}"

            # Tentar buscar do cache
            redis = await get_cache_client()
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)

            # Executar função
            result = await func(*args, **kwargs)

            # Salvar no cache
            await redis.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

# Uso:
@cache_result(ttl=600)
async def get_popular_procedures():
    # Query pesada
    ...

# 2. Cache de dados estáticos
# Cache de configurações, prompts, templates
```

**Semana 3: Frontend Performance**
```typescript
// 1. Lazy loading de componentes pesados
import dynamic from 'next/dynamic';

const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Se não precisa SSR
});

// 2. Image optimization
import Image from 'next/image';

<Image
  src="/images/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Para imagens above the fold
  placeholder="blur" // Blur placeholder
/>

// 3. Route prefetching
import Link from 'next/link';

<Link href="/agendamentos" prefetch={true}>
  Agendar Consulta
</Link>

// 4. Memoization
import { useMemo, useCallback } from 'react';

const expensiveData = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const handleClick = useCallback(() => {
  // Handler
}, [dependencies]);

// 5. Virtual scrolling para listas grandes
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

**Semana 4: Monitoring e APM**
```python
# Backend: Adicionar APM (New Relic, DataDog, ou Prometheus)
# pyproject.toml
dependencies = [
    "prometheus-fastapi-instrumentator>=6.1.0",
]

# main.py
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)

# Custom metrics
from prometheus_client import Counter, Histogram

request_count = Counter('http_requests_total', 'Total HTTP requests')
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    request_count.inc()
    with request_duration.time():
        response = await call_next(request)
    return response
```

**2.3 Melhorar Documentação (3 semanas)**

**Semana 1: OpenAPI/Swagger Completo**
```python
# main.py
app = FastAPI(
    title="DoctorQ API",
    description="""
    API completa para gestão de clínicas de estética.

    ## Recursos Principais

    * **Usuários** - Gestão de usuários e autenticação
    * **Agendamentos** - Sistema de agendamento de consultas
    * **Billing** - Gestão de assinaturas e pagamentos
    * **AI Agents** - Assistentes virtuais com IA

    ## Autenticação

    A API usa JWT tokens. Obtenha um token através do endpoint /users/login-local
    e inclua no header: `Authorization: Bearer {token}`
    """,
    version="1.0.0",
    contact={
        "name": "Equipe DoctorQ",
        "email": "devs@doctorq.app",
        "url": "https://doctorq.app",
    },
    license_info={
        "name": "Proprietary",
    },
    openapi_tags=[
        {"name": "users", "description": "Operações de usuários"},
        {"name": "agendamentos", "description": "Gestão de agendamentos"},
        # ... todas as tags
    ]
)

# Em cada route
@router.post(
    "/",
    response_model=UserResponse,
    status_code=201,
    summary="Criar novo usuário",
    description="Cria um novo usuário no sistema com os dados fornecidos.",
    responses={
        201: {"description": "Usuário criado com sucesso"},
        400: {"description": "Dados inválidos"},
        409: {"description": "Email já cadastrado"},
    },
    tags=["users"]
)
async def create_user(user_data: UserCreate):
    ...
```

**Semana 2: README Técnico Completo**
```markdown
# README.md

## 🚀 Quick Start

### Pré-requisitos
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose

### Instalação Local

#### Backend
\`\`\`bash
cd estetiQ-api
cp env-exemplo .env  # Configurar variáveis
uv sync --all-extras
make db-init
make dev
\`\`\`

#### Frontend
\`\`\`bash
cd estetiQ-web
cp .env.example .env.local
yarn install
yarn dev
\`\`\`

### Docker Compose
\`\`\`bash
docker-compose up -d
\`\`\`

## 📖 Documentação

- [Arquitetura](DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)
- [API Docs](http://localhost:8080/docs)
- [Guia de Contribuição](CONTRIBUTING.md)
- [Troubleshooting](TROUBLESHOOTING.md)

## 🧪 Testes

\`\`\`bash
# Backend
cd estetiQ-api
make test

# Frontend
cd estetiQ-web
yarn test
yarn test:e2e
\`\`\`

## 🔧 Debugging

### Backend
\`\`\`bash
# Com VSCode
python -m debugpy --listen 5678 -m uvicorn src.main:app --reload

# Logs
docker-compose logs -f api
\`\`\`

### Frontend
\`\`\`bash
# Debug mode
NODE_OPTIONS='--inspect' yarn dev
\`\`\`

## 📊 Monitoramento

- **Logs:** http://localhost:8080/logs (se configurado)
- **Metrics:** http://localhost:8080/metrics
- **Health:** http://localhost:8080/health

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: \`git checkout -b feature/nova-feature\`
3. Commit: \`git commit -m 'feat: adiciona nova feature'\`
4. Push: \`git push origin feature/nova-feature\`
5. Abra um Pull Request

## 📝 Commit Convention

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` Nova funcionalidade
- \`fix:\` Correção de bug
- \`docs:\` Documentação
- \`style:\` Formatação
- \`refactor:\` Refatoração
- \`test:\` Testes
- \`chore:\` Manutenção
```

**Semana 3: Architecture Decision Records (ADR)**
```markdown
# docs/adr/001-escolha-fastapi.md

# ADR 001: Escolha do FastAPI como Framework Backend

## Status
Aceito

## Contexto
Precisávamos escolher um framework web para o backend da plataforma DoctorQ.

## Decisão
Escolhemos FastAPI como framework principal.

## Razões

### Prós
- **Performance:** Um dos frameworks Python mais rápidos (comparable a Node.js)
- **Type Safety:** Baseado em type hints Python 3.6+
- **Async First:** Suporte nativo a async/await
- **Auto-documentação:** OpenAPI/Swagger automático
- **Validação:** Integração com Pydantic
- **Developer Experience:** Excelente DX com autocomplete

### Contras
- **Comunidade menor** que Django/Flask (mas crescendo)
- **Menos bibliotecas** específicas do framework

## Alternativas Consideradas

### Django REST Framework
- ❌ Síncrono (Django async ainda imaturo)
- ❌ Mais opinativo
- ✅ ORM integrado
- ✅ Admin panel

### Flask
- ❌ Síncrono
- ❌ Menos features out-of-the-box
- ✅ Flexível
- ✅ Grande comunidade

## Consequências

### Positivas
- Desenvolvimento mais rápido com auto-validação
- Melhor performance para APIs assíncronas
- Documentação automática mantida

### Negativas
- Equipe precisa aprender async programming
- Menos exemplos/tutoriais disponíveis

## Data
2024-01-15

## Participantes
- Equipe de Arquitetura
```

**2.4 Implementar Feature Flags (1 semana)**

```python
# Backend: Feature flags com LaunchDarkly ou similar
# pyproject.toml
dependencies = [
    "launchdarkly-server-sdk>=8.0.0",
]

# src/config/feature_flags.py
import ldclient
from ldclient.config import Config

ldclient.set_config(Config(settings.launchdarkly_sdk_key))
ld_client = ldclient.get()

def is_feature_enabled(user_id: str, feature_key: str) -> bool:
    user = {
        "key": user_id,
    }
    return ld_client.variation(feature_key, user, False)

# Uso
if is_feature_enabled(user_id, "new-chat-interface"):
    # Nova implementação
    return await new_chat_service.process(message)
else:
    # Implementação antiga
    return await chat_service.process(message)
```

---

### Fase 3: DESEJÁVEL - Longo Prazo (5-6 meses)

#### 🟡 Prioridade MÉDIA

**3.1 Migração para Microservices (Opcional)**

Se a escala justificar:

```
Serviço Monolítico Atual → Dividir em:
├── auth-service (autenticação/autorização)
├── clinic-service (gestão de clínicas)
├── appointment-service (agendamentos)
├── billing-service (pagamentos/assinaturas)
├── ai-service (agentes de IA)
├── notification-service (notificações)
└── api-gateway (roteamento)
```

**3.2 GraphQL API (Complementar REST)**

```python
# Adicionar Strawberry GraphQL
dependencies = [
    "strawberry-graphql[fastapi]>=0.219.0",
]

# src/graphql/schema.py
import strawberry
from typing import List

@strawberry.type
class User:
    id: strawberry.ID
    email: str
    name: str

@strawberry.type
class Query:
    @strawberry.field
    def users(self) -> List[User]:
        return get_users()

schema = strawberry.Schema(query=Query)

# main.py
from strawberry.fastapi import GraphQLRouter

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")
```

**3.3 Event-Driven Architecture**

```python
# Implementar message broker (RabbitMQ/Kafka)
dependencies = [
    "aiormq>=6.8.0",  # RabbitMQ async
]

# src/events/publisher.py
import aiormq

async def publish_event(event_type: str, payload: dict):
    connection = await aiormq.connect("amqp://guest:guest@localhost/")
    channel = await connection.channel()

    await channel.basic_publish(
        body=json.dumps(payload).encode(),
        routing_key=event_type,
        exchange="doctorq_events"
    )

# Uso
await publish_event("user.created", {
    "user_id": str(user.id_user),
    "email": user.nm_email,
})

# src/events/consumer.py
async def consume_user_events():
    connection = await aiormq.connect("amqp://guest:guest@localhost/")
    channel = await connection.channel()

    await channel.basic_consume(
        queue="user_events",
        consumer_callback=on_user_event
    )

async def on_user_event(message: aiormq.abc.DeliveredMessage):
    payload = json.loads(message.body)
    if payload.get("event_type") == "user.created":
        # Enviar email de boas-vindas
        await send_welcome_email(payload["user_id"])

    await message.channel.basic_ack(message.delivery.delivery_tag)
```

**3.4 Multi-tenancy Completo**

```python
# Já existe TenantMiddleware
# Melhorar para:

# 1. Schema-based multi-tenancy (se necessário isolamento total)
class TenantMiddleware:
    async def __call__(self, request: Request, call_next):
        tenant_id = extract_tenant_from_subdomain(request)

        # Setar schema PostgreSQL por tenant
        async with get_db() as session:
            await session.execute(text(f"SET search_path TO tenant_{tenant_id}"))
            response = await call_next(request)

        return response

# 2. Row-level security (RLS) no PostgreSQL
# migration
def upgrade():
    op.execute("""
        ALTER TABLE tb_users ENABLE ROW LEVEL SECURITY;

        CREATE POLICY tenant_isolation ON tb_users
        USING (id_empresa = current_setting('app.current_tenant')::uuid);
    """)
```

**3.5 Internacionalização (i18n)**

```python
# Backend
dependencies = [
    "python-i18n>=0.3.9",
]

# src/i18n/
# ├── pt-BR.yml
# ├── en-US.yml
# └── es-ES.yml

# pt-BR.yml
errors:
  user_not_found: "Usuário não encontrado"
  invalid_credentials: "Credenciais inválidas"

# en-US.yml
errors:
  user_not_found: "User not found"
  invalid_credentials: "Invalid credentials"

# Uso
import i18n

i18n.set('locale', user.preferred_language)
error_msg = i18n.t('errors.user_not_found')
```

```typescript
// Frontend: next-intl
// package.json
{
  "dependencies": {
    "next-intl": "^3.0.0"
  }
}

// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['pt-BR', 'en-US', 'es-ES'],
  defaultLocale: 'pt-BR'
});

// Uso
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('common');

  return <h1>{t('welcome')}</h1>;
}
```

**3.6 Machine Learning Pipeline**

```python
# Para features avançadas de IA
dependencies = [
    "scikit-learn>=1.4.0",
    "mlflow>=2.10.0",
]

# src/ml/
# ├── models/
# │   ├── appointment_prediction.py  # Prever no-shows
# │   ├── revenue_forecast.py        # Previsão de receita
# │   └── customer_churn.py          # Predição de churn
# ├── training/
# └── inference/

# Exemplo: Previsão de no-shows
from sklearn.ensemble import RandomForestClassifier
import mlflow

class AppointmentPredictor:
    def __init__(self):
        self.model = RandomForestClassifier()

    async def train(self, X_train, y_train):
        with mlflow.start_run():
            self.model.fit(X_train, y_train)
            mlflow.sklearn.log_model(self.model, "appointment_predictor")

    async def predict_no_show(self, appointment_data: dict) -> float:
        features = self.extract_features(appointment_data)
        probability = self.model.predict_proba([features])[0][1]
        return probability
```

---

## 📊 PARTE 4: MÉTRICAS E KPIs

### 4.1 Métricas de Qualidade

**Código:**
```
✓ Cobertura de testes: 70% (backend), 60% (frontend)
✓ Pylint score: > 8.0
✓ ESLint errors: 0
✓ TypeScript errors: 0
✓ Duplicação de código: < 5%
✓ Complexidade ciclomática: < 10 (média)
```

**Performance:**
```
✓ Tempo de resposta API: < 200ms (P95)
✓ First Contentful Paint: < 1.5s
✓ Time to Interactive: < 3.5s
✓ Lighthouse score: > 90
```

**Segurança:**
```
✓ Vulnerabilidades críticas: 0
✓ Vulnerabilidades altas: 0
✓ Dependências desatualizadas: < 5%
✓ OWASP Top 10: Compliance total
```

**DevOps:**
```
✓ Build time: < 5min
✓ Deploy frequency: Diário (staging), Semanal (prod)
✓ Mean Time to Recovery: < 1h
✓ Change Failure Rate: < 15%
```

### 4.2 Dashboard de Progresso

```markdown
## Sprint 1 (Semanas 1-2)
- [ ] Implementar testes unitários críticos
- [ ] Corrigir next.config.ts
- [ ] Setup CI/CD básico
- [ ] Implementar Sentry

## Sprint 2 (Semanas 3-4)
- [ ] Completar suite de testes (70% coverage)
- [ ] Implementar rate limiting
- [ ] Security hardening
- [ ] Adicionar APM

## Sprint 3 (Semanas 5-6)
- [ ] Refatorar services grandes
- [ ] Adicionar type hints completos
- [ ] Melhorar docstrings
- [ ] Otimizar queries

... (continuar para todos os sprints)
```

---

## 🎓 PARTE 5: RECURSOS E FERRAMENTAS RECOMENDADAS

### 5.1 Ferramentas de Desenvolvimento

**Code Quality:**
- **SonarQube:** Análise estática de código
- **CodeClimate:** Quality metrics
- **Codecov:** Cobertura de testes

**Security:**
- **Snyk:** Vulnerability scanning
- **OWASP Dependency-Check:** Dependências inseguras
- **Bandit:** Security linting (Python)

**Performance:**
- **Locust:** Load testing (Python)
- **Artillery:** Load testing (Node.js)
- **Lighthouse CI:** Performance monitoring

**Monitoring:**
- **Sentry:** Error tracking
- **DataDog/New Relic:** APM
- **Grafana + Prometheus:** Metrics visualization

### 5.2 Recursos de Aprendizado

**Para a Equipe:**

**Python/FastAPI:**
- FastAPI Official Docs
- "Python Concurrency with asyncio" (Caleb Hattingh)
- "Architecture Patterns with Python" (Harry Percival)

**TypeScript/Next.js:**
- Next.js 15 Documentation
- "Effective TypeScript" (Dan Vanderkam)
- "Learning React" (Alex Banks)

**Testing:**
- "Test-Driven Development with Python" (Harry Percival)
- "Testing JavaScript Applications" (Lucas da Costa)

**Architecture:**
- "Clean Architecture" (Robert C. Martin)
- "Microservices Patterns" (Chris Richardson)
- "Domain-Driven Design" (Eric Evans)

### 5.3 Templates e Checklists

**Pull Request Template:**
```markdown
## Descrição
[Descreva as mudanças]

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem erros de lint
- [ ] Build passando
- [ ] Code review realizado
- [ ] Changelog atualizado

## Screenshots (se aplicável)
[Adicione screenshots]

## Testes Realizados
[Descreva os testes]
```

**Issue Template:**
```markdown
## Bug Report

**Descrição:**
[Descrição clara do bug]

**Passos para Reproduzir:**
1. Acesse...
2. Clique em...
3. Veja o erro

**Comportamento Esperado:**
[O que deveria acontecer]

**Comportamento Atual:**
[O que está acontecendo]

**Screenshots:**
[Se aplicável]

**Ambiente:**
- OS: [e.g. macOS 14]
- Browser: [e.g. Chrome 120]
- Versão: [e.g. 1.0.0]

**Logs:**
```
[Cole os logs relevantes]
```
```

---

## 📈 PARTE 6: ESTIMATIVAS E CRONOGRAMA

### 6.1 Esforço Estimado

| Fase | Duração | Pessoas | Custo (horas) |
|------|---------|---------|---------------|
| **Fase 1 - Crítico** | 2 meses | 2 devs | 640h |
| **Fase 2 - Importante** | 4 meses | 2 devs | 1280h |
| **Fase 3 - Desejável** | 6 meses | 1-2 devs | 960h |
| **Total** | 12 meses | - | 2880h |

### 6.2 Roadmap Visual

```
Mês 1-2 (CRÍTICO)
└─ Testes + CI/CD + Security Hardening
    ├─ Week 1-2: Suite de testes backend
    ├─ Week 3-4: Suite de testes frontend
    ├─ Week 5: CI/CD pipeline
    ├─ Week 6: Security fixes
    └─ Week 7-8: Monitoring setup

Mês 3-6 (IMPORTANTE)
└─ Code Quality + Performance + Docs
    ├─ Week 9-14: Refactoring services
    ├─ Week 15-18: Performance optimization
    ├─ Week 19-21: Documentação completa
    └─ Week 22-24: Feature flags

Mês 7-12 (DESEJÁVEL)
└─ Advanced Features
    ├─ Microservices evaluation
    ├─ GraphQL implementation
    ├─ Event-driven architecture
    ├─ i18n support
    └─ ML pipeline
```

---

## ✅ PARTE 7: CHECKLIST DE AÇÃO IMEDIATA

### Para Começar AGORA (Próximas 48h)

```markdown
## Backend
- [ ] Corrigir encoding de arquivos (remover BOM)
- [ ] Criar branch de testes
- [ ] Instalar pytest-cov
- [ ] Escrever primeiro teste unitário (user_service.py)
- [ ] Configurar GitHub Actions básico

## Frontend
- [ ] Corrigir next.config.ts (remover ignoreBuildErrors)
- [ ] Executar yarn lint e corrigir erros
- [ ] Executar yarn build e corrigir erros TS
- [ ] Instalar @testing-library/react
- [ ] Escrever primeiro teste de componente

## DevOps
- [ ] Criar conta no Sentry (free tier)
- [ ] Configurar Sentry no backend
- [ ] Configurar Sentry no frontend
- [ ] Adicionar .github/workflows/ci.yml
- [ ] Testar pipeline CI

## Documentação
- [ ] Criar CONTRIBUTING.md
- [ ] Criar TROUBLESHOOTING.md
- [ ] Atualizar README.md com instruções completas
- [ ] Documentar variáveis de ambiente obrigatórias
```

---

## 🎯 CONCLUSÃO

O projeto DoctorQ possui uma **base sólida** com arquitetura bem pensada e stack moderna. No entanto, há **gaps críticos** em testes, qualidade de código e segurança que precisam ser endereçados urgentemente.

### Recomendações Finais:

1. **Priorize testes IMEDIATAMENTE** - É o maior risco atual
2. **Corrija a configuração de build** - Não ignore erros de TypeScript/ESLint
3. **Implemente CI/CD** - Automatize quality gates
4. **Adicione monitoring** - Sentry + APM são essenciais
5. **Invista em documentação** - Facilita onboarding e manutenção

Com a execução deste plano, o projeto estará em **nível production-ready** após 6 meses, e em **nível enterprise-grade** após 12 meses.

---

**Próximos Passos:**
1. Revisar este documento com a equipe
2. Priorizar itens críticos
3. Criar issues no GitHub para tracking
4. Iniciar Sprint 1 de melhorias
5. Revisar progresso semanalmente

**Contato:**
- Documentação: /DOC_Arquitetura
- Issues: GitHub Issues
- Suporte: devs@doctorq.app

---

*Análise realizada em 06/11/2025*
*Próxima revisão: 06/02/2026 (3 meses)*
