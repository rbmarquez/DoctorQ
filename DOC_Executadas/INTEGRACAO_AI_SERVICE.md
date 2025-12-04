# Integração do DoctorQ AI Service

## Visão Geral

Este documento descreve a separação do serviço de IA do backend principal (`estetiQ-api`) para um serviço dedicado (`estetiQ-service-ai`) e as mudanças necessárias para integração.

## Arquitetura

### Antes

```
┌─────────────┐
│             │
│  Frontend   │
│ (Next.js)   │
│             │
└──────┬──────┘
       │
       │ HTTP
       │
       v
┌─────────────┐
│             │
│ estetiQ-api │
│  (FastAPI)  │
│             │
│  - Routes   │
│  - Services │
│  - Agents   │
│  - LLMs     │
│             │
└──────┬──────┘
       │
       v
  PostgreSQL
```

### Depois

```
┌─────────────┐
│             │
│  Frontend   │
│ (Next.js)   │
│             │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       v              v
┌─────────────┐  ┌──────────────────┐
│             │  │                  │
│ estetiQ-api │  │ estetiQ-service  │
│  (FastAPI)  │  │       -ai        │
│             │  │    (FastAPI)     │
│  - Routes   │  │                  │
│  - Services │  │    - Agents      │
│  - Models   │  │    - LLMs        │
│             │  │    - Streaming   │
└──────┬──────┘  └────────┬─────────┘
       │                  │
       └──────┬───────────┘
              │
              v
        PostgreSQL
          (shared)
```

## Mudanças no Backend

### 1. Novo Serviço: estetiQ-service-ai

**Localização**: `/mnt/repositorios/DoctorQ/estetiQ-service-ai/`

**Porta**: `8082`

**Estrutura**:
```
estetiQ-service-ai/
├── src/
│   ├── main.py              # FastAPI app
│   ├── agents/              # AI agents
│   ├── llms/                # LLM integrations
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── models/              # Pydantic models
│   ├── config/              # Configurations
│   └── utils/               # Utilities
├── pyproject.toml
├── Makefile
├── Dockerfile
├── docker-compose.yml
├── .env-exemplo
└── README.md
```

**Endpoints Migrados**:
- `/ai/agentes/` - CRUD de agentes
- `/ai/conversas/` - Gerenciamento de conversas
- `/ai/conversas/{id}/chat/` - Chat com streaming
- `/ai/conversas/{id}/messages/` - Histórico de mensagens
- `/ai/predictions/{agent_id}/` - Inferência LLM

**Comandos**:
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-service-ai

# Instalar dependências
make sync

# Desenvolvimento
make dev

# Produção
make prod
```

### 2. Backend Principal: estetiQ-api

**Mudanças**:
- ❌ Remover rotas de IA (opcional - manter para compatibilidade temporária)
- ❌ Remover `src/agents/` (opcional)
- ❌ Remover `src/llms/` (opcional)
- ✅ Manter models compartilhados (tb_agentes, tb_conversas_usuarios, tb_messages)

**Nota**: As rotas de IA podem ser mantidas temporariamente para compatibilidade, mas devem redirecionar para o novo serviço ou retornar deprecated warnings.

## Mudanças no Frontend

### 1. Variáveis de Ambiente

**Arquivo**: `estetiQ-web/.env.local`

Adicionar:
```bash
# AI Service
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8082/ai
NEXT_PUBLIC_AI_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

### 2. Novos Arquivos

**Cliente HTTP para AI Service**:
- `src/lib/api/ai-client.ts` - Cliente HTTP dedicado
- `src/lib/api/hooks/ai-factory.ts` - Factory para hooks SWR

**Hooks Atualizados**:
- `src/lib/api/hooks/ia/useAgentes.ts` - Agora usa `ai-factory`
- `src/lib/api/hooks/ia/useConversas.ts` - Agora usa `ai-factory`

### 3. Uso dos Hooks

**Antes**:
```typescript
import { useAgentes } from '@/lib/api/hooks/ia/useAgentes';

// Hook usava apiClient (porta 8080)
const { data: agentes } = useAgentes({ page: 1 });
```

**Depois**:
```typescript
import { useAgentes } from '@/lib/api/hooks/ia/useAgentes';

// Hook agora usa aiClient (porta 8082)
// Uso permanece idêntico!
const { data: agentes } = useAgentes({ page: 1 });
```

**Nota**: A interface pública dos hooks permanece inalterada. Apenas o cliente interno foi trocado.

### 4. Streaming de Chat

**Novo método disponível no aiClient**:

```typescript
import { aiClient } from '@/lib/api/ai-client';

// Streaming SSE para chat
await aiClient.stream(
  `/conversas/${conversationId}/chat/`,
  { message: 'Olá!' },
  (message) => {
    // Processar mensagem recebida
    console.log('Recebido:', message);
  },
  (error) => {
    // Tratar erro
    console.error('Erro:', error);
  },
  () => {
    // Callback de conclusão
    console.log('Stream finalizado');
  }
);
```

## Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  doctorq-api:
    build: ./estetiQ-api
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql+asyncpg://...
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  doctorq-ai-service:
    build: ./estetiQ-service-ai
    ports:
      - "8082:8082"
    environment:
      - DATABASE_URL=postgresql+asyncpg://...
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LANGFUSE_SECRET_KEY=${LANGFUSE_SECRET_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./estetiQ-web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://doctorq-api:8080
      - NEXT_PUBLIC_AI_SERVICE_URL=http://doctorq-ai-service:8082/ai
    depends_on:
      - doctorq-api
      - doctorq-ai-service

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: doctorq

  redis:
    image: redis:7-alpine
```

### Kubernetes

**estetiQ-ai-service deployment**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: doctorq-ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: doctorq-ai-service
  template:
    metadata:
      labels:
        app: doctorq-ai-service
    spec:
      containers:
      - name: doctorq-ai-service
        image: doctorq/ai-service:latest
        ports:
        - containerPort: 8082
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: doctorq-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: doctorq-secrets
              key: openai-api-key
        livenessProbe:
          httpGet:
            path: /ai/health/
            port: 8082
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ai/ready/
            port: 8082
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: doctorq-ai-service
spec:
  selector:
    app: doctorq-ai-service
  ports:
  - port: 8082
    targetPort: 8082
  type: ClusterIP
```

## Migration Checklist

### Backend

- [x] Criar estrutura `estetiQ-service-ai`
- [x] Migrar código de agentes (`src/agents/`)
- [x] Migrar LLMs (`src/llms/`)
- [x] Migrar services de IA
- [x] Migrar rotas de IA
- [x] Criar Dockerfile e docker-compose.yml
- [x] Configurar variáveis de ambiente
- [ ] Testar endpoints do AI service
- [ ] Validar streaming SSE
- [ ] Verificar integração com Langfuse
- [ ] Testar conexão com PostgreSQL compartilhado

### Frontend

- [x] Criar `ai-client.ts`
- [x] Criar `ai-factory.ts`
- [x] Atualizar `useAgentes.ts`
- [x] Atualizar `useConversas.ts`
- [ ] Adicionar variáveis de ambiente `.env.local`
- [ ] Testar listagem de agentes
- [ ] Testar criação de conversa
- [ ] Testar chat com streaming
- [ ] Testar erro handling

### DevOps

- [ ] Configurar CI/CD para novo serviço
- [ ] Atualizar docker-compose.yml do projeto
- [ ] Configurar health checks
- [ ] Configurar logs centralizados
- [ ] Configurar métricas (Prometheus)
- [ ] Atualizar documentação de deployment

## Troubleshooting

### AI Service não inicia

**Erro**: `RuntimeError: Falha na inicialização do banco`

**Solução**:
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão com PostgreSQL
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "SELECT 1"
```

### Frontend não se conecta ao AI Service

**Erro**: `Network Error` ou `CORS Error`

**Solução**:
```bash
# 1. Verificar se AI Service está rodando
curl http://localhost:8082/ai/health/

# 2. Verificar variável NEXT_PUBLIC_AI_SERVICE_URL
echo $NEXT_PUBLIC_AI_SERVICE_URL

# 3. Verificar CORS no AI Service (.env)
CORS_ORIGINS=http://localhost:3000,https://doctorq.app
```

### Streaming não funciona

**Erro**: Stream não retorna dados

**Solução**:
```bash
# Testar endpoint de streaming
curl -N -X POST http://localhost:8082/ai/conversas/{id}/chat/ \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá"}'
```

## Rollback

Se necessário reverter para arquitetura anterior:

1. **Frontend**:
   ```typescript
   // Reverter imports em useAgentes.ts e useConversas.ts
   - import { useQuery } from '../ai-factory';
   + import { useQuery } from '../factory';
   ```

2. **Backend**:
   - Manter `estetiQ-api` com rotas de IA
   - Desligar `estetiQ-service-ai`

3. **Variáveis de Ambiente**:
   ```bash
   # Remover do .env.local
   - NEXT_PUBLIC_AI_SERVICE_URL=...
   - NEXT_PUBLIC_AI_API_KEY=...
   ```

## Próximos Passos

1. Implementar autenticação unificada (JWT) entre serviços
2. Adicionar circuit breaker para resiliência
3. Implementar cache distribuído (Redis)
4. Adicionar tracing distribuído (Jaeger/Zipkin)
5. Configurar auto-scaling no Kubernetes
6. Implementar rate limiting por usuário

## Contato

Para dúvidas sobre a integração:
- Documentação: `/mnt/repositorios/DoctorQ/estetiQ-service-ai/README.md`
- Issues: GitHub Issues do projeto
