# Início Rápido - DoctorQ AI Service

## ✅ Instalação Concluída

As dependências foram instaladas com sucesso! ✅

## 📋 Checklist Antes de Iniciar

### 1. Banco de Dados PostgreSQL

Verifique se o PostgreSQL está acessível:

```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "SELECT 1"
```

**Esperado**:
```
 ?column?
----------
        1
(1 row)
```

**Se falhar**: Verifique se o PostgreSQL está rodando e acessível.

### 2. Redis (Opcional mas Recomendado)

Inicie o Redis localmente:

```bash
# Instalar Redis (se necessário)
sudo apt update && sudo apt install redis-server

# Iniciar Redis
sudo systemctl start redis-server

# Verificar
redis-cli ping
```

**Esperado**: `PONG`

### 3. Configurar Azure OpenAI (OBRIGATÓRIO)

Edite o arquivo `.env`:

```bash
nano .env
```

**Preencha**:
```bash
AZURE_OPENAI_API_KEY=sua-chave-aqui
AZURE_OPENAI_ENDPOINT=https://seu-recurso.openai.azure.com/
```

Consulte [CONFIGURACAO_AZURE.md](CONFIGURACAO_AZURE.md) para obter credenciais.

## 🚀 Iniciar o Serviço

### Modo Desenvolvimento (Recomendado)

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-service-ai

# Iniciar com auto-reload
make dev
```

**OU diretamente com UV**:

```bash
uv run uvicorn src.main:app --host 0.0.0.0 --port 8081 --reload
```

### Modo Produção

```bash
make prod
```

**OU diretamente com Gunicorn**:

```bash
uv run gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8082 --workers 4
```

## 🧪 Testar o Serviço

### 1. Health Check

Em outro terminal:

```bash
curl http://localhost:8082/ai/health/
```

**Esperado**:
```json
{"status":"healthy","service":"doctorq-ai-service"}
```

### 2. Readiness Check

```bash
curl http://localhost:8082/ai/ready/
```

**Esperado**:
```json
{"status":"ready","service":"doctorq-ai-service","memory_percent":45.2}
```

### 3. Documentação Interativa

Abra no navegador:
```
http://localhost:8082/ai/docs
```

### 4. Listar Agentes

```bash
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8082/ai/agentes/
```

## ⚠️ Troubleshooting

### Erro: "No module named 'src'"

**Solução**:
```bash
# Certifique-se de estar no diretório correto
cd /mnt/repositorios/DoctorQ/estetiQ-service-ai

# Re-instalar dependências
make sync
```

### Erro: "RuntimeError: Falha na inicialização do banco"

**Causa**: PostgreSQL não acessível

**Solução**:
```bash
# Verificar conectividade
ping 10.11.2.81

# Verificar PostgreSQL
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "\l"

# Verificar .env
cat .env | grep DATABASE_URL
```

### Erro: "Cache Redis não disponível"

**Não crítico**: O serviço continua funcionando sem Redis

**Solução (opcional)**:
```bash
# Instalar Redis
sudo apt install redis-server

# Iniciar
sudo systemctl start redis-server

# Verificar
redis-cli ping
```

### Erro: "AZURE_OPENAI_API_KEY not configured"

**Solução**:
1. Obtenha credenciais Azure OpenAI (veja [CONFIGURACAO_AZURE.md](CONFIGURACAO_AZURE.md))
2. Edite `.env` e preencha `AZURE_OPENAI_API_KEY` e `AZURE_OPENAI_ENDPOINT`

### Serviço não inicia (timeout)

**Causa**: Tentando conectar ao banco mas sem sucesso

**Solução**:
```bash
# Verificar logs detalhados
uv run uvicorn src.main:app --host 0.0.0.0 --port 8081 --log-level debug
```

## 📊 Monitoramento

### Logs em Tempo Real

```bash
# Desenvolvimento
tail -f logs/app.log

# Produção (se configurado)
journalctl -u doctorq-ai-service -f
```

### Métricas

- **Health**: `http://localhost:8082/ai/health/`
- **Readiness**: `http://localhost:8082/ai/ready/`
- **Prometheus** (futuro): `http://localhost:9090/metrics`

## 🔄 Integração com Frontend

### 1. Iniciar Backend Principal

Em outro terminal:

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
make dev
```

**Porta**: 8080

### 2. Iniciar AI Service

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-service-ai
make dev
```

**Porta**: 8081

### 3. Iniciar Frontend

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-web

# Verificar .env.local
cat .env.local | grep AI_SERVICE

# Deve ter:
# NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8082/ai
# NEXT_PUBLIC_AI_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX

yarn dev
```

**Porta**: 3000

### 4. Testar Integração

Abra: `http://localhost:3000`

Navegue para funcionalidades de IA:
- Chat com agentes
- Configuração de agentes
- Conversas

## 📚 Próximos Passos

1. ✅ Configure Azure OpenAI
2. ✅ Inicie os 3 serviços (API, AI, Frontend)
3. ✅ Teste a integração
4. 📖 Leia [README.md](README.md) para documentação completa
5. 📖 Leia [INTEGRACAO_AI_SERVICE.md](../INTEGRACAO_AI_SERVICE.md) para migration checklist

## 🆘 Suporte

- **Documentação**: [README.md](README.md)
- **Configuração Azure**: [CONFIGURACAO_AZURE.md](CONFIGURACAO_AZURE.md)
- **Integração**: [../INTEGRACAO_AI_SERVICE.md](../INTEGRACAO_AI_SERVICE.md)

## 📝 Comandos Úteis

```bash
# Desenvolvimento
make dev

# Produção
make prod

# Lint
make lint

# Auto-fix
make fix

# Testes
make test

# Limpar cache
make clean

# Reinstalar dependências
make sync
```

## ✅ Checklist de Inicialização

- [ ] PostgreSQL acessível (`10.11.2.81:5432/doctorq`)
- [ ] Redis rodando (opcional)
- [ ] Azure OpenAI configurado no `.env`
- [ ] Dependências instaladas (`make sync`)
- [ ] Serviço iniciado (`make dev`)
- [ ] Health check OK (`curl http://localhost:8082/ai/health/`)
- [ ] Backend principal rodando (porta 8080)
- [ ] Frontend rodando (porta 3000)
- [ ] Variáveis de AI Service no frontend (`.env.local`)

Tudo pronto! 🚀
