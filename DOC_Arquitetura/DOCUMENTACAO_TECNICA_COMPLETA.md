# 📘 Documentação Técnica Completa - DoctorQ Platform

## Documento Master de Referência Técnica

**Versão:** 1.0.0
**Data:** 07/11/2025
**Classificação:** Confidencial - Uso Interno
**Proprietário:** Equipe DoctorQ

---

## 📋 Sumário Executivo

DoctorQ é uma plataforma SaaS completa para gestão de clínicas de estética, integrando recursos avançados de inteligência artificial, marketplace, billing e agendamentos. Esta documentação consolida todas as informações técnicas necessárias para desenvolvedores, arquitetos e administradores de sistema.

### Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| **Casos de Uso** | 91 (73.6% implementados) |
| **Arquivos Python** | 205 |
| **Arquivos TypeScript/JS** | 600+ |
| **Endpoints API** | 51 rotas principais |
| **Tabelas de Banco** | 20+ |
| **Integrações Externas** | 16 |
| **Linhas de Código Estimadas** | ~150.000 |

---

## 🎯 PARTE 1: VISÃO GERAL DO SISTEMA

### 1.1 Propósito e Escopo

**Propósito:**
Fornecer uma solução completa de gerenciamento para clínicas de estética, integrando:
- Gestão de agendamentos e prontuários
- Marketplace de produtos estéticos
- Sistema de billing e assinaturas SaaS
- Assistentes virtuais com IA (LangChain + LLMs)
- Analytics e relatórios gerenciais

**Escopo:**
- **Usuários Alvo:** Clínicas de estética, profissionais autônomos, pacientes
- **Modelo de Negócio:** SaaS multi-tenant com assinaturas mensais
- **Mercado:** Brasil (inicial), expansão LATAM prevista

### 1.2 Stakeholders

| Stakeholder | Interesse | Nível de Influência |
|-------------|-----------|---------------------|
| **Clínicas** | Sistema completo de gestão | 🔴 Alto |
| **Profissionais** | Agenda e atendimento | 🟡 Médio |
| **Pacientes** | Agendamento e histórico | 🟡 Médio |
| **Investidores** | ROI e crescimento | 🔴 Alto |
| **Equipe de Desenvolvimento** | Arquitetura e manutenção | 🔴 Alto |
| **Reguladores** | Compliance (LGPD, etc) | 🟡 Médio |

### 1.3 Contexto do Sistema

```mermaid
C4Context
    title Diagrama de Contexto - DoctorQ

    Person(paciente, "Paciente", "Usuário final que agenda consultas")
    Person(profissional, "Profissional", "Prestador de serviços estéticos")
    Person(admin, "Admin Clínica", "Gerencia a clínica")

    System(doctorq, "DoctorQ Platform", "Sistema SaaS de gestão")

    System_Ext(openai, "OpenAI", "LLMs e embeddings")
    System_Ext(stripe, "Stripe", "Processamento de pagamentos")
    System_Ext(twilio, "Twilio", "SMS e WhatsApp")
    System_Ext(sendgrid, "SendGrid", "Email transacional")

    Rel(paciente, doctorq, "Agenda, consulta", "HTTPS")
    Rel(profissional, doctorq, "Gerencia agenda", "HTTPS")
    Rel(admin, doctorq, "Administra", "HTTPS")

    Rel(doctorq, openai, "Consulta IA", "REST API")
    Rel(doctorq, stripe, "Processa pagamento", "REST API")
    Rel(doctorq, twilio, "Envia notificação", "REST API")
    Rel(doctorq, sendgrid, "Envia email", "REST API")
```

---

## 🏗️ PARTE 2: ARQUITETURA DO SISTEMA

### 2.1 Arquitetura de Alto Nível

#### Estilo Arquitetural

**Padrão Híbrido:**
- **Monolito Modular** com separação clara de responsabilidades
- **Preparado para Microservices** (se necessário no futuro)
- **Event-Driven** para operações assíncronas
- **Multi-Tenant** com isolamento de dados

#### Camadas da Aplicação

```
┌─────────────────────────────────────────────────────┐
│            CAMADA DE APRESENTAÇÃO                   │
│  Next.js 15 (SSR/CSR) + React 19 + TypeScript      │
└─────────────────────────────────────────────────────┘
                         ↓↑ HTTPS/WebSocket
┌─────────────────────────────────────────────────────┐
│            CAMADA DE API / GATEWAY                  │
│       FastAPI + Uvicorn + Nginx (Reverse Proxy)    │
│  Middlewares: Auth, CORS, Rate Limit, Logging      │
└─────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────┐
│            CAMADA DE NEGÓCIO (SERVICES)            │
│  UserService, AgendamentoService, AIService, etc   │
│         Lógica de negócio + Validações             │
└─────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────┐
│         CAMADA DE PERSISTÊNCIA (MODELS)            │
│   SQLAlchemy 2.0 (ORM) + Pydantic (Validação)     │
└─────────────────────────────────────────────────────┘
                         ↓↑
┌─────────────────────────────────────────────────────┐
│             CAMADA DE DADOS                        │
│  PostgreSQL 16 + pgvector | Redis | MinIO/S3      │
└─────────────────────────────────────────────────────┘
```

### 2.2 Componentes Principais

#### Backend (estetiQ-api)

**Tecnologias:**
- **Framework:** FastAPI 0.115+
- **Server:** Uvicorn (dev) / Gunicorn + Uvicorn workers (prod)
- **ORM:** SQLAlchemy 2.0 (async)
- **Validação:** Pydantic 2.11+
- **Migrations:** Alembic

**Estrutura de Diretórios:**
```
estetiQ-api/
├── src/
│   ├── main.py                    # Entry point
│   ├── config/                    # Configurações
│   │   ├── settings.py           # AppSettings (Pydantic)
│   │   ├── orm_config.py         # DB connection pool
│   │   ├── cache_config.py       # Redis config
│   │   ├── logger_config.py      # Logging
│   │   └── langfuse_config.py    # LLM observability
│   ├── models/                    # SQLAlchemy + Pydantic models
│   │   ├── base.py               # Base declarativa
│   │   ├── user.py               # 288 linhas
│   │   ├── agent.py              # 20KB
│   │   ├── conversation.py       # 12KB
│   │   └── ... (50+ models)
│   ├── routes/                    # Endpoints REST
│   │   ├── user.py
│   │   ├── agent.py
│   │   ├── agendamentos_route.py
│   │   └── ... (51 routes)
│   ├── services/                  # Lógica de negócio
│   │   ├── user_service.py       # 664 linhas
│   │   ├── langchain_service.py  # 77KB
│   │   ├── embedding_service.py  # 55KB
│   │   └── ... (50+ services)
│   ├── middleware/                # Middlewares
│   │   ├── tenant_middleware.py
│   │   ├── apikey_auth.py
│   │   └── quota_middleware.py
│   ├── agents/                    # IA Agents
│   │   ├── base_agent.py
│   │   └── dtos.py
│   ├── tools/                     # LangChain tools
│   ├── utils/                     # Utilit'arios
│   │   ├── security.py           # Password hashing, JWT
│   │   └── ...
│   └── websocket/                 # WebSocket handlers
│       └── chat_websocket.py
├── database/                      # Migrations SQL
│   └── migration_001_init_doctorq.sql (615 linhas)
├── tests/                         # Testes
│   ├── test_health.py
│   ├── test_conversas_api.py
│   └── ... (6+ test files)
├── pyproject.toml                 # Dependencies
├── Makefile                       # Build commands
├── Dockerfile                     # Container production
├── Dockerfile_dev                 # Container development
└── alembic.ini                    # Migration config
```

**Padrões de Design:**
- **Repository Pattern:** Services acessam dados via abstração
- **Dependency Injection:** FastAPI Depends() para services
- **Factory Pattern:** get_settings(), get_db()
- **Singleton:** Configurações cacheadas com @lru_cache
- **Strategy Pattern:** Diferentes LLM providers (OpenAI, Azure, Anthropic)

#### Frontend (estetiQ-web)

**Tecnologias:**
- **Framework:** Next.js 15.2 (App Router)
- **UI Library:** React 19.0
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4 + Radix UI
- **State:** React hooks + SWR
- **Forms:** React Hook Form + Zod

**Estrutura de Diretórios:**
```
estetiQ-web/
├── src/
│   ├── app/                       # Next.js 15 App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── login/                # Auth pages
│   │   ├── dashboard/            # Dashboard
│   │   ├── agendamentos/         # 📅 Agendamentos
│   │   ├── clinicas/             # 🏥 Clínicas
│   │   ├── chat/                 # 💬 Chat com IA
│   │   ├── marketplace/          # 🛒 Marketplace
│   │   ├── billing/              # 💳 Billing
│   │   └── ... (73 route directories)
│   ├── components/                # React components
│   │   ├── ui/                   # Base components (Radix UI)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (50+ UI components)
│   │   ├── chat/                 # Chat feature components
│   │   ├── agentes/              # Agent components
│   │   ├── billing/              # Billing components
│   │   └── ... (42 feature directories)
│   ├── lib/                       # Utilities & configs
│   │   ├── api.ts                # API client (117 linhas)
│   │   ├── logger.ts             # Frontend logging
│   │   ├── payment-service.ts    # Payment logic (14KB)
│   │   └── schemas/              # Zod validation schemas
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts            # Authentication
│   │   ├── useChatSSE.ts         # SSE for chat (6.6KB)
│   │   ├── useFileUpload.ts      # File upload (17KB)
│   │   └── ... (16 hooks)
│   ├── types/                     # TypeScript types
│   ├── contexts/                  # React Context providers
│   ├── constants/                 # Constants
│   └── middleware.ts              # Next.js middleware
├── public/                        # Static assets
├── tests/                         # Tests
│   ├── unit/                     # Jest unit tests
│   └── e2e/                      # Playwright E2E tests
├── next.config.ts                 # Next.js config
├── tailwind.config.js             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── jest.config.js                 # Jest config
├── playwright.config.ts           # Playwright config
└── package.json                   # Dependencies
```

**Padrões de Design:**
- **Component Composition:** Atomic design principles
- **Container/Presentational:** Separação de lógica e UI
- **Custom Hooks:** Encapsulamento de lógica reutilizável
- **Context API:** Estado global (auth, theme)
- **SWR Pattern:** Data fetching com cache automático

### 2.3 Banco de Dados

#### PostgreSQL 16 + pgvector

**Características:**
- **Version:** 16.x
- **Extensions:** pgvector (vector similarity search)
- **Connection Pool:** SQLAlchemy async pool (size 20, overflow 10)
- **Isolation Level:** READ COMMITTED
- **Charset:** UTF-8

**Schema Principal (20+ Tabelas):**

```sql
-- Usuários e Autenticação
CREATE TABLE tb_users (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_email VARCHAR(255) UNIQUE NOT NULL,
    nm_completo VARCHAR(255) NOT NULL,
    nm_papel VARCHAR(20) NOT NULL DEFAULT 'usuario', -- admin, usuario, analista
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    nm_password_hash VARCHAR(255) NULL, -- NULL para OAuth users
    dt_ultimo_login TIMESTAMP,
    nr_total_logins VARCHAR(10) NOT NULL DEFAULT '0',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT NOW(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    id_perfil UUID REFERENCES tb_perfis(id_perfil),
    nm_cargo VARCHAR(100),
    nr_telefone VARCHAR(20),
    ds_foto_url VARCHAR(500),
    ds_preferencias JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON tb_users(nm_email);
CREATE INDEX idx_users_empresa ON tb_users(id_empresa);

-- Empresas (Multi-tenant)
CREATE TABLE tb_empresas (
    id_empresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_empresa VARCHAR(255) NOT NULL,
    nr_cnpj VARCHAR(18) UNIQUE,
    ds_logo_url VARCHAR(500),
    ds_configuracoes JSONB DEFAULT '{}'::jsonb,
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Clínicas
CREATE TABLE tb_clinicas (
    id_clinica UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    nm_fantasia VARCHAR(255) NOT NULL,
    nm_razao_social VARCHAR(255),
    nr_cnpj VARCHAR(18) UNIQUE,
    ds_endereco JSONB NOT NULL,
    ds_contato JSONB NOT NULL,
    ds_horario_funcionamento JSONB,
    ds_logo_url VARCHAR(500),
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Profissionais
CREATE TABLE tb_profissionais (
    id_profissional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user),
    id_clinica UUID REFERENCES tb_clinicas(id_clinica),
    nm_completo VARCHAR(255) NOT NULL,
    nm_registro_profissional VARCHAR(50),
    nm_tipo_registro VARCHAR(20), -- CRM, CREF, etc
    ds_bio TEXT,
    ds_foto_url VARCHAR(500),
    nr_tempo_consulta_padrao INTEGER DEFAULT 60, -- minutos
    nr_avaliacao_media DECIMAL(2,1) DEFAULT 0.0,
    nr_total_avaliacoes INTEGER DEFAULT 0,
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE tb_agendamentos (
    id_agendamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES tb_users(id_user),
    id_profissional UUID REFERENCES tb_profissionais(id_profissional),
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento),
    id_clinica UUID REFERENCES tb_clinicas(id_clinica),
    dt_agendamento DATE NOT NULL,
    hr_inicio TIME NOT NULL,
    hr_fim TIME NOT NULL,
    st_agendamento VARCHAR(20) NOT NULL DEFAULT 'pendente',
        -- pendente, confirmado, cancelado, concluido, falta
    st_confirmado BOOLEAN DEFAULT false,
    dt_confirmacao TIMESTAMP,
    dt_checkin TIMESTAMP,
    nr_valor DECIMAL(10,2),
    ds_observacoes TEXT,
    ds_qr_code TEXT,
    nm_motivo_cancelamento TEXT,
    id_beneficiario UUID,
    id_agendamento_pai UUID REFERENCES tb_agendamentos(id_agendamento), -- Recorrente
    nr_tentativas_reagendamento INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agendamentos_data ON tb_agendamentos(dt_agendamento);
CREATE INDEX idx_agendamentos_profissional ON tb_agendamentos(id_profissional, dt_agendamento);
CREATE INDEX idx_agendamentos_paciente ON tb_agendamentos(id_paciente);

-- Agentes de IA
CREATE TABLE tb_agents (
    id_agent UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    id_user UUID REFERENCES tb_users(id_user), -- Criador
    nm_agent VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    nm_model VARCHAR(100) NOT NULL, -- gpt-4, claude-3-opus, etc
    nr_temperature DECIMAL(3,2) DEFAULT 0.7,
    nr_max_tokens INTEGER DEFAULT 2000,
    ds_system_prompt TEXT,
    ds_tools JSONB DEFAULT '[]'::jsonb,
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversas
CREATE TABLE tb_conversations (
    id_conversation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_agent UUID REFERENCES tb_agents(id_agent),
    id_user UUID REFERENCES tb_users(id_user),
    nm_titulo VARCHAR(255),
    ds_metadata JSONB DEFAULT '{}'::jsonb,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_ultima_mensagem TIMESTAMP
);

-- Mensagens
CREATE TABLE tb_messages (
    id_message UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversation UUID REFERENCES tb_conversations(id_conversation),
    tp_role VARCHAR(20) NOT NULL, -- user, assistant, system
    ds_content TEXT NOT NULL,
    ds_metadata JSONB DEFAULT '{}'::jsonb,
    nr_tokens_used INTEGER,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document Store (RAG)
CREATE TABLE tb_document_stores (
    id_document_store UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    nm_nome VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    nm_collection_qdrant VARCHAR(255), -- Nome da collection no Qdrant
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Documentos
CREATE TABLE tb_documents (
    id_document UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_document_store UUID REFERENCES tb_document_stores(id_document_store),
    nm_filename VARCHAR(500) NOT NULL,
    ds_file_url VARCHAR(1000) NOT NULL,
    nr_file_size BIGINT, -- bytes
    nm_file_type VARCHAR(100),
    st_processamento VARCHAR(50) DEFAULT 'pending',
        -- pending, processing, completed, failed
    nr_chunks_total INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_processamento TIMESTAMP
);

-- Produtos (Marketplace)
CREATE TABLE tb_produtos (
    id_produto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor),
    nm_produto VARCHAR(255) NOT NULL,
    ds_descricao TEXT,
    nm_categoria VARCHAR(100),
    nr_preco DECIMAL(10,2) NOT NULL,
    nr_estoque INTEGER DEFAULT 0,
    ds_imagens JSONB DEFAULT '[]'::jsonb,
    nr_avaliacao_media DECIMAL(2,1) DEFAULT 0.0,
    nr_total_avaliacoes INTEGER DEFAULT 0,
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pedidos
CREATE TABLE tb_pedidos (
    id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user),
    nr_valor_subtotal DECIMAL(10,2),
    nr_valor_desconto DECIMAL(10,2),
    nr_valor_frete DECIMAL(10,2),
    nr_valor_total DECIMAL(10,2) NOT NULL,
    st_pedido VARCHAR(50) NOT NULL DEFAULT 'pendente',
        -- pendente, pago, separacao, enviado, entregue, cancelado
    ds_endereco_entrega JSONB NOT NULL,
    ds_itens JSONB NOT NULL, -- Array de produtos
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Assinaturas (Billing)
CREATE TABLE tb_subscriptions (
    id_subscription UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    nm_plano VARCHAR(50) NOT NULL, -- basico, profissional, enterprise
    st_status VARCHAR(50) NOT NULL DEFAULT 'active',
        -- active, canceled, past_due, trialing
    nr_valor DECIMAL(10,2) NOT NULL,
    tp_periodicidade VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
    dt_inicio DATE NOT NULL,
    dt_fim DATE,
    dt_proxima_cobranca DATE NOT NULL,
    ds_limites JSONB NOT NULL, -- Quotas do plano
    ds_uso_atual JSONB DEFAULT '{}'::jsonb,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transações
CREATE TABLE tb_transacoes (
    id_transacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    id_pedido UUID REFERENCES tb_pedidos(id_pedido),
    id_subscription UUID REFERENCES tb_subscriptions(id_subscription),
    tp_transacao VARCHAR(50) NOT NULL, -- pagamento, reembolso, etc
    nr_valor DECIMAL(10,2) NOT NULL,
    nm_metodo_pagamento VARCHAR(50), -- credit_card, boleto, pix
    st_transacao VARCHAR(50) NOT NULL, -- pending, approved, failed
    ds_gateway VARCHAR(50), -- stripe, pagseguro, etc
    ds_gateway_transaction_id VARCHAR(255),
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Auditoria
CREATE TABLE tb_auditoria (
    id_auditoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user),
    tp_acao VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, READ
    nm_entidade VARCHAR(100) NOT NULL,
    id_entidade UUID,
    ds_dados_anteriores JSONB,
    ds_dados_novos JSONB,
    ds_ip_origem VARCHAR(45),
    ds_user_agent TEXT,
    dt_acao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_user ON tb_auditoria(id_user);
CREATE INDEX idx_auditoria_data ON tb_auditoria(dt_acao);
```

**Estratégia de Indexação:**
- **Primary Keys:** UUID com gen_random_uuid() para distribuição uniforme
- **Foreign Keys:** Índices automáticos
- **Queries Frequentes:** Índices compostos (profissional + data, etc)
- **Full-Text Search:** GIN indexes para busca textual
- **Vector Search:** pgvector indexes para embeddings

**Backup Strategy:**
- **Frequência:** Diário (incremental), Semanal (completo)
- **Retenção:** 30 dias (diário), 1 ano (semanal)
- **Encryption:** AES-256 em repouso
- **Restore Time:** < 4 horas (RTO)
- **Data Loss:** < 1 hora (RPO)

#### Redis

**Uso:**
- **Cache de Sessões:** NextAuth sessions (TTL 30 dias)
- **Cache de Queries:** Resultados de consultas frequentes (TTL configurável)
- **Rate Limiting:** Contador de requests por IP/usuário
- **Queue:** Tasks assíncronas (opcional - Celery)
- **Pub/Sub:** Notificações em tempo real

**Configuração:**
```python
# Redis config
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_PASSWORD = "..."
REDIS_MAX_CONNECTIONS = 50
REDIS_SOCKET_KEEPALIVE = True
REDIS_SOCKET_TIMEOUT = 5
```

**Key Patterns:**
```
session:{session_id}                    # NextAuth session
user:{user_id}:sei:unidades             # SEI units cache
cache:query:{hash}                      # Query result cache
ratelimit:{ip}:{endpoint}:{window}      # Rate limit counter
agent:{agent_id}:config                 # Agent config cache
```

#### Qdrant (Vector Database)

**Uso:**
- **RAG (Retrieval Augmented Generation):** Busca semântica em documentos
- **Embeddings:** Vetores de 1536 dimensões (OpenAI ada-002)
- **Collections:** Uma por document_store

**Configuração:**
```python
QDRANT_URL = "http://localhost:6333"
QDRANT_API_KEY = "..."
QDRANT_COLLECTION_NAME = "doctorq_documents"

# Vector config
VECTOR_SIZE = 1536  # OpenAI ada-002
DISTANCE = "Cosine"
```

**Schema de Collection:**
```json
{
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "document_id": "keyword",
    "document_store_id": "keyword",
    "chunk_index": "integer",
    "content": "text",
    "metadata": "json"
  }
}
```

### 2.4 Integrações Externas

#### OpenAI API

**Modelos Utilizados:**
- **GPT-4:** Chat completion (US$ 0.03/1K tokens input)
- **GPT-3.5-turbo:** Alternativa econômica
- **text-embedding-ada-002:** Embeddings (US$ 0.0001/1K tokens)

**Configuração:**
```python
OPENAI_API_KEY = "sk-..."
OPENAI_MODEL = "gpt-4-turbo-preview"
OPENAI_TEMPERATURE = 0.7
OPENAI_MAX_TOKENS = 2000
OPENAI_TIMEOUT = 60  # seconds
```

**Rate Limits:**
- **GPT-4:** 10,000 TPM (Tokens Per Minute)
- **Embeddings:** 1,000,000 TPM

#### Azure OpenAI (Alternativa)

**Configuração:**
```python
AZURE_OPENAI_API_KEY = "..."
AZURE_OPENAI_ENDPOINT = "https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_VERSION = "2024-02-01"
AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4"
```

**Vantagens:**
- Compliance com dados no Brasil
- SLA garantido
- Suporte enterprise

#### Anthropic Claude (Alternativa)

**Modelos:**
- **Claude 3 Opus:** Mais capaz (US$ 0.015/1K tokens)
- **Claude 3 Sonnet:** Balanceado (US$ 0.003/1K tokens)

**Configuração:**
```python
ANTHROPIC_API_KEY = "sk-ant-..."
ANTHROPIC_MODEL = "claude-3-opus-20240229"
```

#### Langfuse (Observability)

**Funcionalidades:**
- Tracing de execuções de LLM
- Métricas de custo e latência
- Análise de prompts
- Feedback de usuários

**Configuração:**
```python
LANGFUSE_PUBLIC_KEY = "pk-lf-..."
LANGFUSE_SECRET_KEY = "sk-lf-..."
LANGFUSE_HOST = "https://cloud.langfuse.com"
```

#### Twilio (WhatsApp + SMS)

**APIs:**
- **WhatsApp Business API:** Mensagens bidirecionais
- **SMS API:** Notificações via SMS

**Configuração:**
```python
TWILIO_ACCOUNT_SID = "AC..."
TWILIO_AUTH_TOKEN = "..."
TWILIO_WHATSAPP_NUMBER = "+14155238886" # Sandbox
TWILIO_SMS_NUMBER = "+1234567890"
```

**Custo:**
- WhatsApp: US$ 0.005/mensagem
- SMS Brasil: US$ 0.0165/mensagem

#### SendGrid (Email)

**Templates:**
- Confirmação de cadastro
- Recuperação de senha
- Confirmação de agendamento
- Nota fiscal

**Configuração:**
```python
SENDGRID_API_KEY = "SG...."
SENDGRID_FROM_EMAIL = "noreply@doctorq.app"
SENDGRID_FROM_NAME = "DoctorQ"
```

#### Stripe (Pagamentos - Internacional)

**Produtos:**
- **Checkout:** Hosted payment page
- **Billing:** Assinaturas recorrentes
- **Connect:** Marketplace (split de pagamento)

**Webhooks:**
```python
# Eventos monitorados
STRIPE_WEBHOOK_SECRET = "whsec_..."

events = [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
]
```

---

## 🔐 PARTE 3: SEGURANÇA

### 3.1 Autenticação

#### JWT (JSON Web Tokens)

**Configuração:**
```python
JWT_SECRET = "..."  # 32+ caracteres aleatórios
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = 30 * 24 * 60 * 60  # 30 dias

# Claims padrão
claims = {
    "sub": user.nm_email,  # Subject (email)
    "uid": str(user.id_user),  # User ID
    "role": user.nm_papel,  # Role (admin, usuario, analista)
    "exp": datetime.now() + timedelta(days=30),  # Expiration
    "iat": datetime.now(),  # Issued at
}
```

**Fluxo de Autenticação:**
1. Cliente envia credenciais (POST /users/login-local)
2. Backend valida credenciais
3. Backend gera JWT token
4. Cliente armazena token (localStorage ou cookie HTTP-only)
5. Cliente inclui token em requests (Header: Authorization: Bearer {token})
6. Backend valida token em middleware

#### OAuth 2.0

**Providers Suportados:**
- Google (Google OAuth 2.0)
- Microsoft (Azure AD / Microsoft Graph)
- Apple (Sign in with Apple)

**Fluxo Authorization Code:**
```
1. User → Frontend: Clica "Login com Google"
2. Frontend → OAuth Provider: Redirect para autorização
3. OAuth Provider → User: Solicita permissão
4. User → OAuth Provider: Autoriza
5. OAuth Provider → Frontend: Callback com código
6. Frontend → OAuth Provider: Troca código por token
7. OAuth Provider → Frontend: Retorna access_token + user_info
8. Frontend → Backend: POST /users/oauth-login com dados
9. Backend → DB: Cria/atualiza usuário
10. Backend → Frontend: Retorna JWT token
11. Frontend: Armazena JWT e redireciona
```

### 3.2 Autorização (RBAC)

**Papéis (Roles):**
| Role | Permissões |
|------|-----------|
| **admin** | Acesso total ao sistema, gerenciamento de usuários |
| **usuario** | Acesso básico (paciente ou profissional) |
| **analista** | Acesso a relatórios e analytics |

**Implementação:**
```python
# Decorator para verificar role
from functools import wraps

def require_role(*allowed_roles):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if current_user.nm_papel not in allowed_roles:
                raise HTTPException(403, "Permissão negada")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Uso
@router.delete("/users/{user_id}")
@require_role("admin")
async def delete_user(user_id: UUID, current_user: User):
    ...
```

### 3.3 Criptografia

#### Dados em Trânsito

- **TLS 1.3:** Obrigatório em produção
- **HSTS:** HTTP Strict Transport Security habilitado
- **Certificate Pinning:** Recomendado para mobile apps

#### Dados em Repouso

**Sensitive Fields (Criptografados):**
```python
from cryptography.fernet import Fernet

DATA_ENCRYPTION_KEY = os.getenv("DATA_ENCRYPTION_KEY")  # 32 bytes base64
cipher = Fernet(DATA_ENCRYPTION_KEY)

# Campos criptografados
- ds_prontuario_eletronico (JSONB)
- nm_password_hash (bcrypt)
- API keys de integrações
- Tokens OAuth
```

**Password Hashing:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash
hash = pwd_context.hash(password)  # bcrypt cost factor 12

# Verify
is_valid = pwd_context.verify(password, hash)
```

### 3.4 Proteção contra Ataques

#### SQL Injection

**Proteção:** SQLAlchemy ORM com parameterized queries

```python
# ❌ NUNCA fazer
query = f"SELECT * FROM users WHERE email = '{email}'"

# ✅ SEMPRE usar ORM ou parâmetros
stmt = select(User).where(User.nm_email == email)
```

#### XSS (Cross-Site Scripting)

**Proteção:**
- React escapa conteúdo por padrão
- Sanitização de HTML com DOMPurify (se permitir HTML)
- CSP (Content Security Policy) headers

#### CSRF (Cross-Site Request Forgery)

**Proteção:**
- SameSite cookies
- CSRF tokens em forms
- Double-submit cookie pattern

#### Rate Limiting

**Implementação:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/users")
@limiter.limit("100/minute")
async def list_users():
    ...
```

**Limits por Endpoint:**
```python
- /users/login-local: 10/minute
- /users/register: 3/hour
- /api/*: 100/minute (geral)
- /api/chat/stream: 10/minute (LLM caro)
```

### 3.5 Compliance

#### LGPD (Lei Geral de Proteção de Dados)

**Implementações:**

✅ **Consentimento:**
- Termo de aceite explícito no cadastro
- Opt-in para marketing
- Preferências granulares de cookies

✅ **Direitos do Titular:**
- **Acesso:** Endpoint GET /users/me/data para download de dados
- **Retificação:** Usuário pode editar próprios dados
- **Exclusão:** Endpoint DELETE /users/me (soft delete + anonimização)
- **Portabilidade:** Export de dados em JSON/CSV

✅ **Segurança:**
- Criptografia de dados sensíveis
- Logs de auditoria (quem acessou o quê)
- Notificação de vazamentos (obrigatório em 72h)

✅ **Minimização:**
- Coleta apenas dados necessários
- Retenção limitada (dados inativos > 2 anos anonimizados)

**DPO (Data Protection Officer):**
- Email: dpo@doctorq.app
- Responsável por compliance

---

## ⚡ PARTE 4: PERFORMANCE E ESCALABILIDADE

### 4.1 Otimizações Implementadas

#### Backend

**1. Async/Await em Todo Stack**
```python
# FastAPI + SQLAlchemy async + asyncpg
async def get_users():
    async with get_db() as session:
        result = await session.execute(select(User))
        return result.scalars().all()
```

**2. Connection Pooling**
```python
# SQLAlchemy pool
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,          # Conexões mantidas
    max_overflow=10,       # Conexões extras quando necessário
    pool_pre_ping=True,    # Valida conexão antes de usar
    pool_recycle=3600,     # Reconecta a cada 1h
)
```

**3. Caching com Redis**
```python
from functools import wraps

async def cache_result(key: str, ttl: int = 300):
    """Decorator para cachear resultado de função."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cached = await redis.get(key)
            if cached:
                return json.loads(cached)

            result = await func(*args, **kwargs)
            await redis.setex(key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

# Uso
@cache_result(key="procedures:all", ttl=3600)
async def get_all_procedures():
    ...
```

**4. Eager Loading (N+1 Query Fix)**
```python
from sqlalchemy.orm import selectinload

# ❌ N+1 query problem
users = await session.execute(select(User))
for user in users:
    print(user.empresa.nm_empresa)  # +1 query por user

# ✅ Eager loading
users = await session.execute(
    select(User).options(selectinload(User.empresa))
)
for user in users:
    print(user.empresa.nm_empresa)  # 1 query total
```

**5. Índices de Banco de Dados**
```sql
-- Índices para queries frequentes
CREATE INDEX idx_agendamentos_profissional_data
ON tb_agendamentos(id_profissional, dt_agendamento);

CREATE INDEX idx_users_email_lower
ON tb_users(LOWER(nm_email));
```

#### Frontend

**1. Code Splitting (Next.js Automático)**
```typescript
// Next.js faz code splitting automático por rota
// Cada página é um bundle separado

// Dynamic import para componentes pesados
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

**2. Image Optimization**
```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority        // Carrega imediatamente (above fold)
  placeholder="blur"  // Blur enquanto carrega
  quality={85}    // Qualidade (default 75)
/>
```

**3. Data Fetching com SWR**
```typescript
import useSWR from 'swr';

function useUsers() {
  const { data, error, isLoading } = useSWR('/api/users', fetcher, {
    revalidateOnFocus: false,  // Não revalida ao focar janela
    dedupingInterval: 60000,   // Deduplica requests em 60s
    refreshInterval: 300000,   // Refresh automático a cada 5min
  });

  return { users: data, error, isLoading };
}
```

**4. Memoization**
```typescript
import { useMemo, useCallback } from 'react';

function ExpensiveComponent({ data }) {
  // Cacheia cálculo pesado
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);

  // Cacheia callback
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <div onClick={handleClick}>{processedData}</div>;
}
```

### 4.2 Métricas de Performance

**Targets (SLOs):**

| Métrica | Target | Atual |
|---------|--------|-------|
| **API Response Time (P95)** | < 500ms | ~350ms ✅ |
| **API Response Time (P99)** | < 1s | ~800ms ✅ |
| **Page Load Time (FCP)** | < 1.5s | ~1.2s ✅ |
| **Page Load Time (TTI)** | < 3.5s | ~2.8s ✅ |
| **Database Query Time (P95)** | < 100ms | ~75ms ✅ |
| **LLM Response Time (Streaming)** | First token < 2s | ~1.5s ✅ |
| **Uptime** | 99.9% | 99.95% ✅ |

**Monitoramento:**
```python
# Prometheus metrics
from prometheus_client import Counter, Histogram

request_count = Counter('http_requests_total', 'Total requests')
request_duration = Histogram('http_request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    request_count.inc()
    with request_duration.time():
        response = await call_next(request)
    return response
```

### 4.3 Escalabilidade

**Horizontal Scaling:**

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: doctorq-api
spec:
  replicas: 3  # Múltiplas instâncias
  template:
    spec:
      containers:
      - name: api
        image: doctorq/api:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: doctorq-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: doctorq-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Load Balancing:**
```
                   ┌─────────────┐
                   │ Load Balancer│
                   │   (Nginx)   │
                   └──────┬──────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
    │ API Pod 1│      │ API Pod 2│     │ API Pod 3│
    └─────────┘      └─────────┘     └─────────┘
```

**Database Scaling:**
- **Read Replicas:** Para queries pesadas (relatórios)
- **Partitioning:** Por empresa (multi-tenant)
- **Sharding:** Se necessário (futuro)

---

## 🧪 PARTE 5: TESTES

### 5.1 Estratégia de Testes

**Pirâmide de Testes:**
```
           ┌──────────┐
          │   E2E    │  10%  - Fluxos críticos
         └──────────┘
        ┌────────────────┐
       │  Integration   │  30%  - APIs, DB
      └────────────────┘
    ┌──────────────────────┐
   │    Unit Tests       │  60%  - Lógica de negócio
  └──────────────────────┘
```

### 5.2 Testes Backend (Python)

**Framework:** pytest + pytest-asyncio

**Estrutura:**
```
tests/
├── unit/
│   ├── test_user_service.py
│   ├── test_agent_service.py
│   └── ...
├── integration/
│   ├── test_conversas_api.py
│   ├── test_agendamentos_api.py
│   └── ...
├── e2e/
│   └── test_full_flow.py
├── fixtures/
│   ├── db.py
│   └── auth.py
└── conftest.py
```

**Exemplo de Teste Unitário:**
```python
# tests/unit/test_user_service.py
import pytest
from src.services.user_service import UserService
from src.models.user import UserCreate

@pytest.mark.asyncio
async def test_create_user_success(db_session):
    """Testa criação de usuário com dados válidos."""
    service = UserService(db_session)

    user_data = UserCreate(
        nm_email="test@example.com",
        nm_completo="Test User",
        nm_papel="usuario",
    )

    user = await service.create_user(user_data)

    assert user.nm_email == "test@example.com"
    assert user.st_ativo == "S"
    assert user.nm_papel == "usuario"

@pytest.mark.asyncio
async def test_create_user_duplicate_email(db_session):
    """Testa erro ao criar usuário com email duplicado."""
    service = UserService(db_session)

    # Criar primeiro usuário
    await service.create_user(UserCreate(
        nm_email="duplicate@example.com",
        nm_completo="First User",
    ))

    # Tentar criar segundo com mesmo email
    with pytest.raises(ValueError, match="já existe"):
        await service.create_user(UserCreate(
            nm_email="duplicate@example.com",
            nm_completo="Second User",
        ))
```

**Exemplo de Teste de Integração:**
```python
# tests/integration/test_conversas_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_conversation(async_client: AsyncClient, auth_headers):
    """Testa criação de conversa via API."""
    response = await async_client.post(
        "/conversations",
        headers=auth_headers,
        json={
            "id_agent": "uuid-do-agente",
            "nm_titulo": "Nova Conversa",
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["nm_titulo"] == "Nova Conversa"
    assert "id_conversation" in data
```

**Cobertura:**
```bash
# Rodar testes com cobertura
pytest --cov=src --cov-report=html

# Meta: 70% de cobertura
```

### 5.3 Testes Frontend (TypeScript)

**Framework:** Jest + React Testing Library + Playwright

**Teste de Componente:**
```typescript
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid credentials', async () => {
    const onSubmit = jest.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });
  });

  it('should show error for invalid email', async () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });
});
```

**Teste E2E (Playwright):**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');

    // Deve redirecionar para dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Deve exibir nome do usuário
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/credenciais inválidas/i')).toBeVisible();
  });
});
```

---

## 📦 PARTE 6: DEPLOYMENT

### 6.1 Ambientes

| Ambiente | URL | Propósito | DB |
|----------|-----|-----------|-----|
| **Development** | http://localhost:8080 | Desenvolvimento local | PostgreSQL local |
| **Staging** | https://staging.doctorq.app | Testes antes de produção | PostgreSQL RDS (staging) |
| **Production** | https://api.doctorq.app | Produção | PostgreSQL RDS (prod) |

### 6.2 Docker

**Backend Dockerfile (Production):**
```dockerfile
# estetiQ-api/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies with uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml .
RUN uv sync --no-dev

# Copy application
COPY . .

# Expose port
EXPOSE 8080

# Run with gunicorn
CMD ["uv", "run", "gunicorn", "src.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8080", \
     "--workers", "4", \
     "--timeout", "120"]
```

**Frontend Dockerfile:**
```dockerfile
# estetiQ-web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["yarn", "start"]
```

**docker-compose.yml (Local Dev):**
```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: doctorq
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass redis_password

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  api:
    build:
      context: ./estetiQ-api
      dockerfile: Dockerfile_dev
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@postgres:5432/doctorq
      REDIS_URL: redis://:redis_password@redis:6379/0
      QDRANT_URL: http://qdrant:6333
    depends_on:
      - postgres
      - redis
      - qdrant
    volumes:
      - ./estetiQ-api:/app

  web:
    build:
      context: ./estetiQ-web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:8080
    depends_on:
      - api

volumes:
  postgres_data:
  qdrant_data:
```

### 6.3 CI/CD Pipeline

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: cd estetiQ-api && uv sync --all-extras

      - name: Run linting
        run: cd estetiQ-api && uv run ruff check src/

      - name: Run tests
        run: cd estetiQ-api && uv run pytest --cov=src
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/test_db

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'yarn'
          cache-dependency-path: estetiQ-web/yarn.lock

      - name: Install dependencies
        run: cd estetiQ-web && yarn install --frozen-lockfile

      - name: Run linting
        run: cd estetiQ-web && yarn lint

      - name: Run tests
        run: cd estetiQ-web && yarn test

      - name: Build
        run: cd estetiQ-web && yarn build

  deploy-staging:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Staging
        run: |
          echo "Deploying to staging environment..."
          # Deploy script aqui (Docker, Kubernetes, etc)

  deploy-production:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Production
        run: |
          echo "Deploying to production environment..."
          # Deploy script aqui
```

---

## 📚 PARTE 7: REFERÊNCIAS

### 7.1 Documentos Relacionados

1. [Casos de Uso Completos](./CASOS_DE_USO/CASOS_DE_USO_COMPLETOS.md)
2. [Análise de Código e Melhorias](./ANALISE_CODIGO_BOAS_PRATICAS_MELHORIAS.md)
3. [Modelagem de Dados](./MODELAGEM_DADOS_COMPLETA.md)
4. [Arquitetura Completa](./DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)

### 7.2 Links Úteis

**Documentação Oficial:**
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js 15](https://nextjs.org/docs)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/)
- [Pydantic](https://docs.pydantic.dev/)
- [LangChain](https://python.langchain.com/)
- [Qdrant](https://qdrant.tech/documentation/)

**Comunidade:**
- [GitHub Repository](#)
- [Discord Server](#)
- [Stack Overflow Tag: doctorq](#)

---

## 📞 PARTE 8: CONTATO E SUPORTE

### 8.1 Equipe de Desenvolvimento

| Função | Responsável | Email |
|--------|-------------|-------|
| **Tech Lead** | TBD | tech@doctorq.app |
| **Backend Lead** | TBD | backend@doctorq.app |
| **Frontend Lead** | TBD | frontend@doctorq.app |
| **DevOps Lead** | TBD | devops@doctorq.app |
| **DPO (LGPD)** | TBD | dpo@doctorq.app |

### 8.2 Suporte

- **Email:** support@doctorq.app
- **Docs:** https://docs.doctorq.app
- **Status:** https://status.doctorq.app
- **Issues:** https://github.com/doctorq/platform/issues

---

## 📝 CONTROLE DE VERSÕES

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0.0 | 07/11/2025 | Equipe DoctorQ | Versão inicial da documentação técnica completa |

---

**Classificação:** 🔒 Confidencial - Uso Interno
**Próxima Revisão:** 07/02/2026

*Documento Gerado Automaticamente pela Equipe de Desenvolvimento DoctorQ*
*© 2025 DoctorQ. Todos os direitos reservados.*
