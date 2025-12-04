# DoctorQ AI Service

Serviço dedicado de IA com agentes conversacionais e RAG (Retrieval-Augmented Generation) para a plataforma DoctorQ.

## Visão Geral

Este serviço foi separado do backend principal (`estetiQ-api`) para:
- **Escalabilidade**: Permitir escalonamento independente do serviço de IA
- **Manutenibilidade**: Isolar lógica de IA e LLM em um serviço dedicado
- **Performance**: Otimizar recursos específicos para processamento de IA
- **Modularidade**: Facilitar atualizações e testes de novos modelos de IA

## Arquitetura

```
src/
├── main.py                  # FastAPI application entry point
├── agents/                  # AI agents implementation
│   ├── base_agent.py       # Base agent class
│   ├── dynamic_custom_agent.py
│   ├── prompt_generator_agent.py
│   ├── summary_generator_agent.py
│   ├── title_generator_agent.py
│   ├── agent_types.py
│   └── dtos.py
├── llms/                    # LLM provider integrations
│   ├── openai.py           # OpenAI integration
│   ├── azure_openai.py     # Azure OpenAI integration
│   └── ollama.py           # Ollama local models
├── routes/                  # API endpoints
│   ├── agent.py            # Agent CRUD and management
│   ├── conversation.py     # Chat sessions
│   ├── message.py          # Message history
│   └── prediction.py       # LLM inference
├── services/                # Business logic layer
│   ├── agent_service.py
│   ├── conversation_service.py
│   ├── message_service.py
│   ├── chat_message_service.py
│   ├── analytics_agents_service.py
│   └── streaming_agent_executor.py
├── models/                  # Pydantic models and database schemas
│   ├── base.py
│   ├── agent.py
│   ├── conversation.py
│   └── message.py
├── config/                  # Configuration modules
│   ├── orm_config.py       # SQLAlchemy async setup
│   ├── cache_config.py     # Redis cache
│   ├── logger_config.py    # Structured logging
│   └── settings.py         # Environment variables
├── utils/                   # Helper utilities
│   └── auth.py             # Authentication utilities
└── middleware/              # FastAPI middleware

```

## Tecnologias

- **FastAPI**: Framework web assíncrono
- **LangChain**: Framework para agentes de IA
- **SQLAlchemy**: ORM assíncrono
- **PostgreSQL**: Banco de dados (compartilhado com estetiQ-api)
- **Redis**: Cache e sessões
- **OpenAI/Azure OpenAI**: Modelos de linguagem
- **Langfuse**: Observabilidade de LLM
- **UV**: Gerenciador de pacotes Python

## Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env-exemplo` para `.env` e configure:

```bash
cp .env-exemplo .env
```

Principais variáveis:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key
- `AZURE_OPENAI_*`: Azure OpenAI credentials
- `LANGFUSE_*`: Langfuse observability keys
- `API_KEY`: API key para autenticação

### 2. Instalação de Dependências

```bash
# Instalar dependências de produção
make install

# OU instalar todas as dependências (incluindo dev)
make sync
```

### 3. Banco de Dados

Este serviço compartilha o banco de dados com o `estetiQ-api`. As tabelas necessárias já devem existir:
- `tb_agentes`
- `tb_conversas_usuarios`
- `tb_messages`
- `tb_api_keys`
- `tb_credenciais`
- `tb_variaveis`

## Comandos

```bash
# Desenvolvimento (porta 8081)
make dev

# Produção
make prod

# Linting
make lint

# Auto-fix de código
make fix

# Testes
make test

# Limpar cache
make clean
```

## Endpoints Principais

### Agents

- `POST /ai/agentes/` - Criar agente
- `GET /ai/agentes/` - Listar agentes
- `GET /ai/agentes/{id}/` - Obter agente por ID
- `PUT /ai/agentes/{id}/` - Atualizar agente
- `DELETE /ai/agentes/{id}/` - Deletar agente

### Conversations

- `POST /ai/conversas/` - Criar conversa
- `GET /ai/conversas/` - Listar conversas
- `GET /ai/conversas/{id}/` - Obter conversa
- `POST /ai/conversas/{id}/chat/` - Enviar mensagem (streaming)
- `GET /ai/conversas/{id}/messages/` - Histórico de mensagens

### Predictions

- `POST /ai/predictions/{agent_id}/` - Inferência LLM (streaming)

### Health

- `GET /ai/health/` - Health check
- `GET /ai/ready/` - Readiness check

## Integração com Frontend

O frontend (`estetiQ-web`) deve ser atualizado para chamar este serviço ao invés do backend principal para funcionalidades de IA.

### Exemplo de Configuração

```typescript
// .env.local
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8082/ai
AI_SERVICE_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

### Exemplo de Uso (API Client)

```typescript
// lib/api/ai-client.ts
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL;
const AI_API_KEY = process.env.AI_SERVICE_API_KEY;

export async function sendMessage(conversationId: string, message: string) {
  const response = await fetch(`${AI_BASE_URL}/conversas/${conversationId}/chat/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  // Handle SSE streaming
  const reader = response.body.getReader();
  // ... process stream
}
```

## Deployment

### Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
RUN pip install uv && uv sync --no-dev

COPY src/ ./src/

EXPOSE 8081

CMD ["uv", "run", "gunicorn", "src.main:app", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8082", "--workers", "4"]
```

### Kubernetes

Health checks configurados:
- Liveness: `/ai/health/`
- Readiness: `/ai/ready/` (verifica memória e banco de dados)

## Logs e Monitoramento

- **Logs estruturados**: Usando `colorlog`
- **Observabilidade LLM**: Langfuse para tracing
- **Métricas**: Prometheus (futuro)

## Desenvolvimento

### Adicionar Novo Agente

1. Criar classe em `src/agents/my_agent.py`
2. Herdar de `BaseCustomAgent`
3. Implementar método `execute()`
4. Registrar em `src/agents/__init__.py`

### Adicionar Nova Rota

1. Criar arquivo em `src/routes/my_route.py`
2. Definir `APIRouter`
3. Incluir router em `src/main.py`

## Troubleshooting

### Serviço não inicia
- Verificar `DATABASE_URL` em `.env`
- Verificar se PostgreSQL está acessível
- Checar logs: `journalctl -u doctorq-ai-service -f`

### Erro de autenticação
- Verificar `API_KEY` em `.env`
- Confirmar header `Authorization: Bearer {API_KEY}`

### LLM não responde
- Validar `OPENAI_API_KEY` ou `AZURE_OPENAI_API_KEY`
- Verificar logs do Langfuse
- Checar modelos disponíveis

## Licença

Proprietary - DoctorQ Platform
