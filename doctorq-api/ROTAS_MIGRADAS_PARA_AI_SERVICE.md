# Rotas Migradas para doctorq-service-ai

**Data**: 15/11/2025  
**Ação**: Remoção de endpoints de IA do doctorq-api após migração para microsserviço dedicado

## Contexto

As funcionalidades de IA foram separadas do backend monolítico (doctorq-api) para um microsserviço dedicado (doctorq-service-ai) seguindo o padrão de arquitetura do Maua/plataformamaua-service-ai-v1.

## Rotas Removidas do doctorq-api

### Imports Removidos (src/main.py):

```python
# Rotas de IA migradas para doctorq-service-ai (porta 8082)
from src.routes.agent import router as agent_router
from src.routes.apikey import router as apikey_router
from src.routes.conversation import router as conversation_router
from src.routes.documento_store import router as documento_store_router
from src.routes.embedding import router as embedding_router
from src.routes.prediction import router as prediction_router
from src.routes.sync import router as sync_router
from src.routes.tool import router as tool_router
from src.routes.variable import router as variable_router
from src.routes.message import router as message_router
from src.routes.analytics_agents import router as analytics_agents_router
```

### Registros Removidos (app.include_router):

```python
# Rotas de IA (agora em doctorq-service-ai)
app.include_router(tool_router)              # /tools
app.include_router(agent_router)             # /agentes
app.include_router(prediction_router)        # /predictions
app.include_router(variable_router)          # /variaveis
app.include_router(sync_router)              # /sync
app.include_router(embedding_router)         # /embedding
app.include_router(conversation_router)      # /conversas
app.include_router(message_router)           # /messages
app.include_router(apikey_router)            # /apikeys
app.include_router(documento_store_router)   # /documento-store
app.include_router(analytics_agents_router)  # /analytics/agents
```

## Novo Acesso às Funcionalidades de IA

### doctorq-service-ai (Porta 8082)

**Base URL**: `http://localhost:8082/ai`

**Endpoints Disponíveis** (200+ rotas registradas):
- `/ai/agentes/` - Gestão de agentes de IA
- `/ai/conversas/` - Conversas e chat
- `/ai/messages/` - Histórico de mensagens
- `/ai/predictions/` - Predições e inferências LLM
- `/ai/tools/` - Ferramentas dos agentes
- `/ai/variaveis/` - Variáveis de configuração
- `/ai/apikeys/` - Gerenciamento de API keys
- `/ai/documento-store/` - Armazenamento de documentos RAG
- `/ai/embedding/` - Embeddings e busca semântica
- `/ai/sync/` - Sincronização de dados externos
- `/ai/analytics/agents/` - Analytics de agentes

### Frontend

**Cliente HTTP**: `src/lib/api/ai-client.ts`  
**Hooks**: `src/lib/api/hooks/ai-factory.ts`

**Exemplo de Uso**:
```typescript
import { useAgentes } from '@/lib/api/hooks/ia/useAgentes';

function MyComponent() {
  const { data: agentes, isLoading } = useAgentes();
  // Agora aponta para http://localhost:8082/ai/agentes/
}
```

## Componentes Migrados

### Routes (11 arquivos):
- agent.py
- analytics_agents.py
- apikey.py
- conversation.py
- documento_store.py
- message.py
- prediction.py
- sync.py
- tool.py
- variable.py
- embedding.py

### Services (67+ arquivos):
Todos os services relacionados a IA, incluindo:
- agent_service.py
- conversation_service.py
- message_service.py
- langchain_service.py
- rag_service.py
- embedding_service.py
- variable_service.py
- apikey_service.py
- tool_service.py
- documento_store_service.py (3 arquivos)
- credencial_service.py
- E mais...

### Agents (8 arquivos):
- base_agent.py
- dynamic_custom_agent.py
- prompt_generator_agent.py
- summary_generator_agent.py
- title_generator_agent.py
- agent_types.py
- dtos.py

### Tools (10 arquivos):
Gerenciamento completo de ferramentas dos agentes

### LLMs (4 arquivos):
- azure_openai.py
- openai.py
- ollama.py
- __init__.py

### Models (60+ arquivos):
Todos os models relacionados a IA

### Utils, Middleware, Config:
Arquivos de suporte para o serviço de IA

## Status Atual

✅ **doctorq-api** (Porta 8080): 447 rotas registradas (sem IA)  
✅ **doctorq-service-ai** (Porta 8082): 200+ rotas de IA funcionando  
✅ **Frontend**: Hooks atualizados para usar ai-client

## Observações

<<<<<<< Updated upstream:DoctorQ-api/ROTAS_MIGRADAS_PARA_AI_SERVICE.md
- As credenciais Azure OpenAI estão configuradas no doctorq-service-ai
=======
- As credenciais Azure OpenAI estão configuradas no estetiQ-service-ai
>>>>>>> Stashed changes:doctorq-api/ROTAS_MIGRADAS_PARA_AI_SERVICE.md
- O banco de dados PostgreSQL (10.11.2.81:5432/dbdoctorq) é compartilhado entre os serviços
- A autenticação via API Key é mantida em ambos os serviços
- O Redis (cache) é opcional e compartilhado

## Arquivos Mantidos no doctorq-api

Os seguintes arquivos relacionados a IA foram MANTIDOS no doctorq-api pois são usados por outras funcionalidades:
- `src/routes/credencial.py` - Gerenciamento de credenciais (usado por vários serviços)
- `src/routes/sei.py` - Integração com SEI (não é IA)
- `src/routes/search_advanced.py` - Busca avançada (não migrada)
- `src/agents/dtos.py` - Usado para validação de erros no exception handler

## Próximos Passos

1. ✅ Remover imports e registros de rotas (CONCLUÍDO)
2. ✅ Testar inicialização do doctorq-api (CONCLUÍDO - 447 rotas)
3. ⏳ Testar endpoints do frontend com novo ai-client
4. ⏳ Atualizar documentação de arquitetura
5. ⏳ Configurar deployment do doctorq-service-ai
6. ⏳ Configurar proxy/gateway se necessário

