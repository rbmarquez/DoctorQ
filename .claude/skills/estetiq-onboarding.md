# DoctorQ Onboarding Skill

## Descrição
Esta skill guia novos desenvolvedores através do processo de onboarding no projeto DoctorQ, desde a configuração do ambiente até a primeira contribuição.

## Quando Usar
- Ao integrar novos desenvolvedores ao time
- Quando um desenvolvedor precisa configurar ambiente local
- Para relembrar processos e padrões do projeto
- Ao ensinar sobre a estrutura e arquitetura do código

## Instruções

Você é um assistente de onboarding especializado no projeto DoctorQ. Sua função é guiar novos desenvolvedores através de todo o processo de setup e integração.

### 1. Guia de Setup Inicial

**Etapa 1: Pré-requisitos**

Verifique se o desenvolvedor tem instalado:
- Python 3.12+
- Node.js 20+ (LTS)
- PostgreSQL 16+
- Redis 6.4+
- Git
- UV (Python package manager)
- Yarn 4.x
- Docker e Docker Compose (opcional mas recomendado)

**Comandos de verificação**:
```bash
python --version  # Deve ser 3.12+
node --version    # Deve ser 20+
psql --version    # Deve ser 16+
redis-server --version
git --version
uv --version
yarn --version
```

**Etapa 2: Clone do Repositório**

```bash
cd /mnt/repositorios
git clone [URL_DO_REPOSITORIO] DoctorQ
cd DoctorQ
```

**Etapa 3: Setup do Backend (estetiQ-api)**

```bash
cd estetiQ-api

# Instalar dependências com UV
make install
# OU: uv sync --all-extras

# Copiar arquivo de ambiente
cp env-exemplo .env

# Editar .env com configurações locais
# Importante: DATABASE_URL, REDIS_URL, OPENAI_API_KEY
nano .env
```

**Configurar .env mínimo para desenvolvimento**:
```env
# Database
DATABASE_HOST=10.11.2.81
DATABASE_PORT=5432
DATABASE_NAME=doctorq
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_URL=postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/doctorq

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=dev-secret-key-min-32-chars-change-in-prod
JWT_SECRET=dev-jwt-secret-key-min-32-chars
API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX

# LLM (obter sua própria key)
OPENAI_API_KEY=sk-...

# CORS
URL_PERMITIDA=http://localhost:3000

# Debug
DEBUG=true
LOG_LEVEL=DEBUG
DISABLE_SWAGGER=false
```

**Aplicar migrations do banco**:
```bash
make migrate
# OU: uv run alembic upgrade head
```

**Iniciar servidor de desenvolvimento**:
```bash
make dev
# OU: uv run uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload

# Acessar documentação da API:
# http://localhost:8080/docs
```

**Etapa 4: Setup do Frontend (estetiQ-web)**

```bash
cd ../estetiQ-web

# Instalar dependências
yarn install

# Copiar arquivo de ambiente
cp .env.example .env.local

# Editar .env.local
nano .env.local
```

**Configurar .env.local mínimo**:
```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8080
API_DOCTORQ_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret-min-32-chars

# OAuth (opcional para dev)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_NAME=DoctorQ
```

**Iniciar servidor de desenvolvimento**:
```bash
yarn dev

# Acessar aplicação:
# http://localhost:3000
```

### 2. Tour pela Estrutura do Projeto

**Backend (estetiQ-api/src/)**:
```
src/
├── main.py              # 🚀 Entry point da aplicação
├── routes/              # 🛣️  Endpoints da API (53 rotas)
│   ├── auth.py         # Autenticação
│   ├── empresa.py      # Gestão de empresas
│   ├── user.py         # Usuários
│   ├── agendamento.py  # Agendamentos
│   └── ...
├── services/            # 💼 Lógica de negócio (38 services)
├── models/              # 🗄️  SQLAlchemy ORM + Pydantic (51 models)
├── agents/              # 🤖 LangChain AI agents
├── middleware/          # 🔒 Auth, CORS, rate limiting
├── config/              # ⚙️  Configurações (ORM, Redis, Logger)
└── utils/               # 🔧 Utilitários
```

**Frontend (estetiQ-web/src/)**:
```
src/
├── app/                 # 📱 Next.js 15 App Router (242 páginas)
│   ├── (auth)/         # Rotas de autenticação
│   ├── admin/          # Dashboard admin
│   ├── profissional/   # Dashboard profissional
│   ├── paciente/       # Portal do paciente
│   ├── marketplace/    # E-commerce
│   └── api/            # API routes (NextAuth)
├── components/          # 🧩 React components (~200+)
├── lib/                 # 📚 API client, utilities
│   ├── api/
│   │   ├── client.ts   # HTTP client com auth
│   │   └── hooks/      # 28 SWR hooks
└── hooks/               # 🪝 Custom React hooks
```

### 3. Primeiro Desenvolvimento

**Exemplo: Criar novo endpoint na API**

```bash
# 1. Criar modelo (se necessário)
nano estetiQ-api/src/models/minha_feature.py

# 2. Criar service
nano estetiQ-api/src/services/minha_feature_service.py

# 3. Criar route
nano estetiQ-api/src/routes/minha_feature.py

# 4. Registrar route em main.py
nano estetiQ-api/src/main.py
# Adicionar: app.include_router(minha_feature_router)

# 5. Criar migration
make revision
# Seguir prompt para nomear migration

# 6. Aplicar migration
make migrate

# 7. Testar endpoint
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8080/minha-feature/
```

**Exemplo: Criar nova página no frontend**

```bash
# 1. Criar página
mkdir -p estetiQ-web/src/app/minha-pagina
nano estetiQ-web/src/app/minha-pagina/page.tsx

# 2. Criar hook de API (se necessário)
nano estetiQ-web/src/lib/api/hooks/useMinhaFeature.ts

# 3. Criar componentes
mkdir -p estetiQ-web/src/components/minha-feature
nano estetiQ-web/src/components/minha-feature/MeuComponente.tsx

# 4. Acessar no browser
# http://localhost:3000/minha-pagina
```

### 4. Padrões de Código

**Backend (Python)**:
- Use type hints em todas as funções
- Siga PEP 8 (verificar com `make lint`)
- Use async/await para operações I/O
- Docstrings em formato Google Style
- Services devem ser stateless
- Use dependency injection do FastAPI

**Frontend (TypeScript)**:
- Use TypeScript strict mode
- Componentes funcionais com hooks
- Use SWR para data fetching
- Siga padrões do ESLint (`yarn lint`)
- CSS com Tailwind classes
- Componentes em Radix UI quando possível

### 5. Workflow de Desenvolvimento

**GitFlow**:
```bash
# 1. Criar branch de feature
git checkout -b feature/minha-feature

# 2. Desenvolver e commitar
git add .
git commit -m "feat: implementa minha feature"

# 3. Push e abrir PR
git push origin feature/minha-feature
# Abrir PR no GitHub
```

**Padrão de Commits (Conventional Commits)**:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças em documentação
- `style:` - Formatação, sem mudança de lógica
- `refactor:` - Refatoração de código
- `test:` - Adição de testes
- `chore:` - Manutenção, deps, etc.

### 6. Testes

**Backend**:
```bash
cd estetiQ-api
make test
# OU: uv run pytest tests/ -v --cov
```

**Frontend**:
```bash
cd estetiQ-web
yarn test              # Unit tests
yarn test:e2e          # E2E tests
yarn test:coverage     # Coverage report
```

### 7. Recursos e Documentação

**Documentos Essenciais**:
1. [Arquitetura Completa](DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)
2. [README Principal](README.md)
3. [Setup UV Backend](estetiQ-api/README_UV_SETUP.md)
4. [Migrations DB](estetiQ-api/database/README.md)

**Onde Buscar Ajuda**:
- Slack: #doctorq-dev
- Documentação: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/`
- Issues: GitHub Issues
- Tech Lead: [Nome]

### 8. Checklist de Onboarding

Marque conforme completar:

**Setup Inicial**:
- [ ] Ambiente configurado (Python, Node, PostgreSQL, Redis)
- [ ] Repositório clonado
- [ ] Backend rodando em http://localhost:8080
- [ ] Frontend rodando em http://localhost:3000
- [ ] Consegue acessar Swagger em http://localhost:8080/docs
- [ ] Consegue fazer login na aplicação

**Conhecimento**:
- [ ] Leu documentação de arquitetura
- [ ] Entende estrutura de diretórios
- [ ] Sabe como criar novo endpoint
- [ ] Sabe como criar nova página
- [ ] Conhece padrões de código
- [ ] Entende workflow Git

**Primeiro PR**:
- [ ] Criou branch de feature
- [ ] Implementou funcionalidade simples
- [ ] Escreveu testes
- [ ] Passou linting e testes
- [ ] Abriu Pull Request
- [ ] PR aprovado e merged

## Exemplo de Uso

**Usuário**: Sou novo no projeto DoctorQ. Como começo?

**Resposta Esperada**:
```
Bem-vindo ao DoctorQ! Vou guiá-lo pelo processo de onboarding.

**Passo 1: Verificar Pré-requisitos**
Execute estes comandos para verificar se tem tudo instalado:
[comandos de verificação]

**Passo 2: Clonar e Configurar**
[instruções detalhadas]

**Passo 3: Primeiro Teste**
Após configurar, você deve conseguir:
1. Acessar API docs: http://localhost:8080/docs
2. Acessar frontend: http://localhost:3000
3. Fazer login com credenciais de teste

**Próximos Passos**:
1. Ler [Arquitetura Completa](link)
2. Fazer tour pelo código com um desenvolvedor senior
3. Pegar sua primeira issue no backlog

Precisa de ajuda em algum passo específico?
```

## Referências
- Seção 5.1 da Documentação: Guia de Onboarding
- Seção 5.2: Guia de Contribuição
- README Principal: `/mnt/repositorios/DoctorQ/README.md`
