# Configuração do Azure OpenAI

## Visão Geral

O DoctorQ AI Service está configurado para usar **Azure OpenAI** como provedor principal de LLM. Este documento explica como obter e configurar as credenciais necessárias.

## Por que Azure OpenAI?

- ✅ **Conformidade**: Dados hospedados na região escolhida (LGPD/GDPR)
- ✅ **Segurança**: Enterprise-grade com integração Azure AD
- ✅ **Custo**: Preços competitivos e controle de gastos
- ✅ **Performance**: Baixa latência em região brasileira (Brazil South)
- ✅ **Confiabilidade**: SLA de 99.9%

## Passo a Passo: Obter Credenciais

### 1. Criar Recurso Azure OpenAI

1. Acesse o [Portal do Azure](https://portal.azure.com)
2. Clique em **"Criar um recurso"**
3. Busque por **"Azure OpenAI"**
4. Clique em **"Criar"**

**Configurações do Recurso**:
- **Subscription**: Sua assinatura Azure
- **Resource Group**: Crie um novo ou use existente (ex: `rg-doctorq-ai`)
- **Region**: **Brazil South** (recomendado para LGPD)
- **Name**: `doctorq-openai-prod` (ou nome de sua preferência)
- **Pricing Tier**: **Standard S0**

5. Clique em **"Review + Create"** → **"Create"**
6. Aguarde o deployment (1-2 minutos)

### 2. Obter API Key e Endpoint

1. Após criado, vá para o recurso
2. No menu lateral, clique em **"Keys and Endpoint"**
3. Copie:
   - **KEY 1** → Será seu `AZURE_OPENAI_API_KEY`
   - **Endpoint** → Será seu `AZURE_OPENAI_ENDPOINT`

Exemplo:
```bash
AZURE_OPENAI_API_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
AZURE_OPENAI_ENDPOINT=https://doctorq-openai-prod.openai.azure.com/
```

### 3. Criar Deployment do Modelo

1. No recurso Azure OpenAI, vá para **"Model deployments"**
2. Clique em **"Create new deployment"**

**Configurações do Deployment**:
- **Select a model**: `gpt-4o-mini` (recomendado para início)
  - **Alternativa**: `gpt-4o` (mais poderoso, custo maior)
- **Deployment name**: `gpt-4o-mini` (use o mesmo nome do modelo)
- **Model version**: Última versão disponível
- **Deployment type**: **Standard**
- **Tokens per Minute Rate Limit**: `10K` (ajuste conforme necessidade)

3. Clique em **"Create"**
4. Aguarde o deployment (1-2 minutos)

O **deployment name** será seu `AZURE_OPENAI_DEPLOYMENT`:
```bash
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

### 4. Configurar no .env

Edite o arquivo `/mnt/repositorios/DoctorQ/estetiQ-service-ai/.env`:

```bash
# Azure OpenAI - CONFIGURAR COM SUAS CREDENCIAIS
AZURE_OPENAI_API_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
AZURE_OPENAI_ENDPOINT=https://doctorq-openai-prod.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_MODEL=gpt-4o-mini
```

## Modelos Disponíveis

### Recomendados

| Modelo | Uso | Custo (aprox) | Tokens/min |
|--------|-----|---------------|------------|
| **gpt-4o-mini** | Geral (recomendado início) | $0.15/$0.60 per 1M | 10K-100K |
| **gpt-4o** | Tarefas complexas | $5/$15 per 1M | 10K-100K |
| **gpt-4-turbo** | Alto volume | $10/$30 per 1M | 10K-100K |

Preços: Input/Output por 1M tokens (sujeitos a alteração)

### Para Embeddings (RAG/Busca)

| Modelo | Uso | Custo |
|--------|-----|-------|
| **text-embedding-3-small** | Embeddings rápidos | $0.02 per 1M |
| **text-embedding-3-large** | Embeddings precisos | $0.13 per 1M |

## Configuração de Produção

### 1. Variáveis de Ambiente Obrigatórias

```bash
# Azure OpenAI (OBRIGATÓRIO)
AZURE_OPENAI_API_KEY=<sua-api-key>
AZURE_OPENAI_ENDPOINT=<seu-endpoint>
AZURE_OPENAI_DEPLOYMENT=<nome-do-deployment>

# Database (OBRIGATÓRIO)
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/doctorq

# Security (OBRIGATÓRIO - mude em produção!)
SECRET_KEY=<gere-chave-aleatória-32-chars>
API_KEY=<gere-api-key-segura>
```

### 2. Variáveis de Ambiente Recomendadas

```bash
# Observability
LANGFUSE_SECRET_KEY=<sua-secret-key>
LANGFUSE_PUBLIC_KEY=<sua-public-key>

# CORS (ajuste para seu domínio)
CORS_ORIGINS=https://doctorq.app,https://www.doctorq.app
```

## Monitoramento de Custos

### Azure Portal

1. Acesse o recurso Azure OpenAI
2. Vá em **"Cost Management"** → **"Cost Analysis"**
3. Configure alertas de gasto

### Langfuse (Opcional mas Recomendado)

Langfuse fornece observabilidade de LLM:
- Rastreamento de tokens usados
- Custo por requisição
- Latência de resposta
- Debugging de prompts

**Configurar Langfuse**:
1. Acesse [cloud.langfuse.com](https://cloud.langfuse.com)
2. Crie conta gratuita
3. Crie um projeto
4. Copie Secret Key e Public Key
5. Configure no `.env`:

```bash
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

## Limites e Quotas

### Rate Limits Padrão

- **Tokens per Minute (TPM)**: 10.000 (ajustável)
- **Requests per Minute (RPM)**: 60 (ajustável)
- **Tokens per Day**: 100.000 (ajustável)

### Aumentar Limites

1. Acesse o deployment
2. Clique em **"Edit deployment"**
3. Ajuste **"Tokens per Minute Rate Limit"**
4. Valores comuns: 10K, 50K, 100K, 240K

## Segurança

### Boas Práticas

1. **Nunca commite credenciais no Git**
   ```bash
   # .gitignore já configurado para ignorar .env
   ```

2. **Use Azure Key Vault em produção**
   ```bash
   # Referência ao Key Vault ao invés de plain text
   AZURE_OPENAI_API_KEY=@Microsoft.KeyVault(SecretUri=...)
   ```

3. **Rotacione API Keys periodicamente**
   - Azure Portal → Keys and Endpoint → Regenerate Key

4. **Configure IP Whitelisting**
   - Azure Portal → Networking → Firewall

## Troubleshooting

### Erro: 401 Unauthorized

**Causa**: API Key inválida

**Solução**:
1. Verifique se copiou a KEY 1 completa
2. Regenere a key no Azure Portal se necessário
3. Atualize o `.env`

### Erro: 404 Not Found

**Causa**: Endpoint ou deployment incorreto

**Solução**:
1. Verifique `AZURE_OPENAI_ENDPOINT` (deve terminar com `.openai.azure.com/`)
2. Verifique `AZURE_OPENAI_DEPLOYMENT` (deve ser exatamente o nome criado)

### Erro: 429 Too Many Requests

**Causa**: Rate limit excedido

**Solução**:
1. Aumente o limite do deployment (Tokens per Minute)
2. Implemente retry com backoff exponencial
3. Use cache para respostas repetidas

### Erro: Model Not Available in Region

**Causa**: Modelo não disponível na região Brazil South

**Solução**:
1. Use modelo alternativo disponível na região
2. OU crie recurso em outra região (ex: East US)
3. Verifique disponibilidade: [Azure OpenAI Models](https://learn.microsoft.com/azure/ai-services/openai/concepts/models)

## Fallback para OpenAI

Se preferir usar OpenAI diretamente (sem Azure):

```bash
# Descomente e configure
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Comente Azure
# AZURE_OPENAI_API_KEY=
# AZURE_OPENAI_ENDPOINT=
```

O sistema tentará Azure primeiro, se falhar, usa OpenAI como fallback.

## Próximos Passos

1. Configure as credenciais no `.env`
2. Teste o serviço: `make dev`
3. Verifique health: `curl http://localhost:8082/ai/health/`
4. Crie seu primeiro agente via API
5. Configure observabilidade com Langfuse

## Recursos

- [Azure OpenAI Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Model Availability by Region](https://learn.microsoft.com/azure/ai-services/openai/concepts/models#model-summary-table-and-region-availability)
- [Langfuse Documentation](https://langfuse.com/docs)

## Suporte

Para dúvidas sobre configuração:
- Documentação do projeto: [README.md](README.md)
- Integração: [../INTEGRACAO_AI_SERVICE.md](../INTEGRACAO_AI_SERVICE.md)
