# DoctorQ Project Configuration

> **Configuração do Claude Code para o projeto DoctorQ**
> **Última Atualização**: 31 de Outubro de 2025
> **Versão**: 1.0

---

## 🎯 Contexto do Projeto

**DoctorQ** é uma plataforma SaaS completa para gestão de clínicas de estética, inspirada no Doctoralia.

### Stack Tecnológico
- **Backend**: FastAPI 0.115+ + Python 3.12+ + SQLAlchemy 2.0 async
- **Frontend**: Next.js 15 + React 19 + TypeScript 5.x
- **Database**: PostgreSQL 16+ com pgvector (embeddings)
- **Cache**: Redis 6.4+
- **AI**: LangChain 0.3.x + OpenAI GPT-4 + Langfuse
- **Package Managers**: UV (Python), Yarn 4.x (JavaScript)

### Arquitetura
- **Multi-Tenant**: Isolamento por `id_empresa`
- **RBAC**: 5 roles (admin, gestor_clinica, profissional, recepcionista, paciente)
- **Auth**: OAuth2 (Google, Azure AD) + JWT + API Key
- **Real-time**: Server-Sent Events (SSE) para streaming de IA
- **Marketplace**: E-commerce integrado (produtos, fornecedores, pedidos)

---

## 📚 Documentação Obrigatória

**SEMPRE consulte antes de responder**:

1. **Arquitetura Completa** (v2.1 - 31/10/2025):
   - `@file:DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md`
   - Contém: visão de negócio, arquitetura técnica, funcionalidades, roadmap
   - **1.917 linhas** de documentação completa

2. **Mapeamento de Rotas Frontend**:
   - `@file:DOC_Arquitetura/MAPEAMENTO_ROTAS_FRONTEND.md`
   - Contém: 112 páginas Next.js mapeadas, 56 hooks SWR, 122 componentes

3. **Skills Especializadas** (`.claude/skills/`):
   - 8 skills com **2.405 linhas** de instruções
   - Leia `README.md` para entender cada skill
   - Use `doctorq-skills` para recomendações

---

## 🛠️ Skills Disponíveis

| Skill | Função | Quando Usar |
|-------|--------|-------------|
| **doctorq-arch** | Consultar arquitetura | "Como funciona X?" |
| **doctorq-doc-update** | Atualizar documentação | Após implementações |
| **doctorq-roadmap** | Gestão de roadmap | "Próximas features?" |
| **doctorq-onboarding** | Guia para novos devs | "Como começar?" |
| **doctorq-api-check** | Auditoria de APIs | "Verifica rotas" |
| **doctorq-frontend-routes** | Mapear páginas | "Mapeia frontend" |
| **doctorq-db-schema** | Validar banco de dados | "Valida schema" |
| **doctorq-skills** | Índice de skills | "Qual skill usar?" |

---

## 📊 Estatísticas do Projeto

**Última Auditoria**: 31/10/2025

### Backend (estetiQ-api/)
- **51 arquivos** de rotas (`src/routes/`)
- **52 services** (`src/services/`)
- **48 models** (`src/models/`)
- **106 tabelas** no PostgreSQL
- **32 migrations** (27 SQL + 5 Alembic)
- **~50.000 linhas** de código Python

### Frontend (estetiQ-web/)
- **112 páginas** Next.js App Router
- **56 hooks SWR** (`src/lib/api/hooks/`)
- **122 componentes** React
- **~22.000 linhas** de código TypeScript

### Total
- **~72.000 linhas** de código
- **95% MVP** completo
- **8 skills** (2.405 linhas de docs)

---

## 🔧 Padrões de Desenvolvimento

### Backend

**Estrutura de arquivo**:
```
src/
├── routes/        # Endpoints da API
├── services/      # Lógica de negócio
├── models/        # SQLAlchemy ORM + Pydantic
├── agents/        # LangChain AI agents
├── middleware/    # Auth, CORS, rate limiting
├── config/        # ORM, Redis, Logger
└── utils/         # Helpers
```

**Convenções**:
- ✅ Sempre `async/await` para I/O
- ✅ Trailing slash em rotas: `/empresas/` (não `/empresas`)
- ✅ Dependency injection: `db: AsyncSession = Depends(ORMConfig.get_session)`
- ✅ Type hints em todas as funções
- ✅ Docstrings em formato Google Style

### Frontend

**Estrutura de arquivo**:
```
src/
├── app/           # Next.js 15 App Router
│   ├── (auth)/   # Route group - auth pages
│   ├── (dashboard)/admin/     # Admin dashboard
│   ├── (dashboard)/profissional/  # Professional dashboard
│   └── (dashboard)/paciente/      # Patient portal
├── components/    # React components
├── lib/api/       # API client + hooks SWR
├── hooks/         # Custom hooks
└── types/         # TypeScript types
```

**Convenções**:
- ✅ Server Components por padrão
- ✅ Client Components (`'use client'`) apenas quando necessário
- ✅ SWR para data fetching
- ✅ Tailwind CSS + Radix UI (Shadcn/UI)
- ✅ TypeScript strict mode

### Banco de Dados

**Nomenclatura**:
- **Tabelas**: `tb_` + plural (ex: `tb_agendamentos`)
- **Colunas**:
  - `id_` - Identificadores (UUID)
  - `nm_` - Nomes (VARCHAR)
  - `ds_` - Descrições (TEXT)
  - `vl_` - Valores numéricos
  - `dt_` - Datas/timestamps
  - `fg_` - Flags booleanas

**Padrões**:
- ✅ UUID primary keys: `id_nome_tabela UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- ✅ Multi-tenant: `id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE`
- ✅ Auditoria: `dt_criacao`, `dt_atualizacao`, `fg_ativo`
- ✅ Indexes em FKs: `CREATE INDEX idx_tabela_fk ON tb_tabela(id_fk)`

---

## 🔄 Fluxo de Trabalho Padrão

### 1. Antes de Implementar

```bash
# Verificar se está no roadmap
"O que vem no próximo sprint?"  # → doctorq-roadmap

# Entender arquitetura
"Como funciona o sistema de agendamentos?"  # → doctorq-arch

# Verificar padrões existentes
# Ler seção relevante da documentação
```

### 2. Durante Implementação

**Backend**:
```bash
cd estetiQ-api

# 1. Criar model (src/models/)
# 2. Criar service (src/services/)
# 3. Criar route (src/routes/)
# 4. Registrar em src/main.py

# 5. Criar migration
make revision  # Alembic autogenerate

# 6. Aplicar migration
make migrate   # alembic upgrade head

# 7. Testar
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8080/endpoint/
```

**Frontend**:
```bash
cd estetiQ-web

# 1. Criar types (src/types/)
# 2. Criar hook SWR (src/lib/api/hooks/)
# 3. Criar componentes (src/components/)
# 4. Criar página (src/app/)

# 5. Testar
yarn dev
# Navegar para http://localhost:3000
```

### 3. Após Implementação

```bash
# Auditar APIs
"Verifica se as APIs estão documentadas"  # → doctorq-api-check

# Mapear páginas
"Mapeia as rotas do frontend"  # → doctorq-frontend-routes

# Validar banco
"Valida o schema do banco"  # → doctorq-db-schema

# Atualizar documentação
"Atualiza a documentação"  # → doctorq-doc-update

# Marcar como concluído
"Marca funcionalidade X como concluída"  # → doctorq-roadmap
```

---

## ⚠️ Regras Importantes

### ✅ SEMPRE

1. **Trailing slash em rotas API**: `/empresas/` (não `/empresas`)
2. **Multi-tenant em tabelas de dados**: Incluir `id_empresa` (exceto core: users, empresas, perfis)
3. **Async/await no backend**: FastAPI + SQLAlchemy async
4. **Atualizar documentação após implementar**: Use `doctorq-doc-update`
5. **Validar com auditorias**: Use skills de auditoria
6. **Seguir convenções de nomenclatura**: `tb_`, `id_`, `nm_`, etc.
7. **Criar indexes em FKs**: Performance e integridade
8. **Usar UUIDs para PKs**: `gen_random_uuid()`

### ❌ NUNCA

1. **Criar rotas sem documentar**: Sempre atualizar docs
2. **Pular validações de auditoria**: Skills garantem qualidade
3. **Hardcodar credenciais**: Usar `tb_credenciais` (encrypted AES-256)
4. **Criar tabelas sem prefixo `tb_`**: Convenção do projeto
5. **Usar IDs numéricos**: Sempre UUID
6. **Ignorar multi-tenancy**: Filtrar por `id_empresa`
7. **Fazer queries sem filtrar empresa**: Isolamento de dados

---

## 🔐 Autenticação

**Backend**:
```python
# Todas as rotas protegidas com API Key
headers = {"Authorization": "Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"}
```

**Frontend**:
```typescript
// NextAuth.js com múltiplos providers
- OAuth2: Google, Microsoft Azure AD
- Credentials: Email/senha
- JWT tokens armazenados em Redis (session)
```

**Database**:
```bash
# Produção
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq
```

---

## 🚀 Comandos Úteis

### Backend

```bash
cd estetiQ-api

make install    # Instalar deps (UV)
make dev        # Server desenvolvimento (port 8080)
make migrate    # Aplicar migrations
make lint       # Ruff + Pylint
make fix        # Auto-fix + format
make test       # Pytest com coverage
```

### Frontend

```bash
cd estetiQ-web

yarn install    # Instalar deps
yarn dev        # Server desenvolvimento (port 3000)
yarn build      # Build produção
yarn lint       # ESLint
yarn test       # Jest unit tests
yarn test:e2e   # Playwright E2E
```

### Database

```bash
# Conectar
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq

# Listar tabelas
\dt tb_*

# Descrever tabela
\d tb_empresas

# Query
SELECT * FROM tb_empresas WHERE fg_ativo = true;
```

---

## 📖 Referências Rápidas

- **Docs Principal**: `DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md`
- **Rotas Frontend**: `DOC_Arquitetura/MAPEAMENTO_ROTAS_FRONTEND.md`
- **Skills**: `.claude/skills/README.md`
- **Auditoria**: `DOC_Arquitetura/ATUALIZACAO_DOCUMENTACAO_31_10_2025.md`
- **CLAUDE.md**: `/mnt/repositorios/CLAUDE.md` (linhas 265-315)

---

## 💡 Dicas

1. **Dúvida sobre arquitetura?** → Use `doctorq-arch`
2. **Implementou algo?** → Use `doctorq-doc-update`
3. **Não sabe qual skill usar?** → Use `doctorq-skills`
4. **Antes de release?** → Execute todas as auditorias (api-check, frontend-routes, db-schema)
5. **Onboarding novo dev?** → Use `doctorq-onboarding`

---

**Gerado por**: Claude Code
**Data**: 31 de Outubro de 2025
**Versão**: 1.0
