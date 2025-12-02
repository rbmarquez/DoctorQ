# Deploy em Produção - DoctorQ

## Pré-requisitos

- Acesso SSH ao servidor de produção
- PostgreSQL 16+ instalado
- Python 3.12+ com UV instalado
- Node.js 20+ com Yarn instalado

---

## 1. Banco de Dados

### 1.1 Se o banco estiver vazio ou muito antigo (criar do zero):

```bash
# Conectar no servidor de produção
ssh usuario@servidor-producao

# Criar banco de dados (se não existir)
sudo -u postgres createdb doctorq

# Aplicar schema completo
cd /caminho/para/doctorq-api
sudo -u postgres psql -d dbdoctorq -f database/schema_completo_doctorq.sql
```

### 1.2 Se o banco já existe (aplicar apenas migrações):

```bash
# Aplicar configuração do handoff
sudo -u postgres psql -d dbdoctorq -f database/migration_handoff_gisele_config.sql
```

### 1.3 Verificar se tabelas foram criadas:

```bash
sudo -u postgres psql -d dbdoctorq -c "\dt tb_*omni*"
# Deve mostrar: tb_canais_omni, tb_contatos_omni, tb_conversas_omni, tb_mensagens_omni
```

---

## 2. Backend (API)

### 2.1 Atualizar código:

```bash
cd /caminho/para/doctorq-api

# Puxar alterações do GitHub
git pull origin main

# Instalar dependências
uv sync
```

### 2.2 Configurar variáveis de ambiente:

Editar `.env` e garantir que existe:

```bash
# Empresa padrão para Central de Atendimento
DEFAULT_EMPRESA_ID=af8b2919-d0f6-4310-9a77-488989969ea4

# Banco de dados
DATABASE_URL=postgresql+asyncpg://postgres:senha@localhost:5432/dbdoctorq

# Redis (opcional mas recomendado)
REDIS_URL=redis://localhost:6379/0
```

### 2.3 Reiniciar serviço:

**Se usar systemd:**
```bash
sudo systemctl restart doctorq-api
sudo systemctl status doctorq-api
```

**Se usar supervisord:**
```bash
sudo supervisorctl restart doctorq-api
sudo supervisorctl status doctorq-api
```

**Se rodar manualmente:**
```bash
# Parar processo atual
pkill -f "uvicorn.*doctorq"

# Iniciar em background
cd /caminho/para/doctorq-api
nohup uv run uvicorn src.main:app --host 0.0.0.0 --port 8080 > /var/log/doctorq-api.log 2>&1 &
```

### 2.4 Verificar se API está funcionando:

```bash
curl http://localhost:8080/health
# Deve retornar: {"status": "healthy", ...}

curl http://localhost:8080/central-atendimento/conversas/?page_size=1 \
  -H "Authorization: Bearer SEU_API_KEY"
# Deve retornar lista de conversas
```

---

## 3. Frontend (Web)

### 3.1 Atualizar código:

```bash
cd /caminho/para/doctorq-web

# Puxar alterações do GitHub
git pull origin main

# Instalar dependências
yarn install
```

### 3.2 Configurar variáveis de ambiente:

Editar `.env.local` ou `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.doctorq.app
API_DOCTORQ_API_KEY=sua_api_key_aqui
NEXTAUTH_URL=https://doctorq.app
NEXTAUTH_SECRET=sua_secret_aqui
```

### 3.3 Build e deploy:

```bash
# Build para produção
yarn build

# Se usar PM2:
pm2 restart doctorq-web

# Se rodar manualmente:
yarn start
```

---

## 4. Verificação Final

### 4.1 Testar endpoints da Central de Atendimento:

```bash
# Listar conversas
curl https://api.doctorq.app/central-atendimento/conversas/ \
  -H "Authorization: Bearer API_KEY"

# Testar handoff
curl -X POST https://api.doctorq.app/central-atendimento/handoff/iniciar/ \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ds_motivo": "Teste de deploy"}'
```

### 4.2 Testar WebSocket:

```bash
# Usar wscat ou similar
wscat -c "wss://api.doctorq.app/ws/central-atendimento/chat/ID_CONVERSA/?token=API_KEY"
```

### 4.3 Verificar logs:

```bash
# Logs da API
tail -f /var/log/doctorq-api.log

# Ou se usar journalctl
journalctl -u doctorq-api -f
```

---

## 5. Rollback (se necessário)

```bash
# Voltar para versão anterior
git checkout HEAD~1

# Reiniciar serviços
sudo systemctl restart doctorq-api
pm2 restart doctorq-web
```

---

## Estrutura de Arquivos Importantes

```
doctorq-api/
├── database/
│   ├── schema_completo_doctorq.sql      # Schema completo (138 tabelas)
│   └── migration_handoff_gisele_config.sql  # Config do handoff
├── src/
│   ├── central_atendimento/
│   │   ├── routes/
│   │   │   ├── handoff_route.py         # Endpoints de handoff
│   │   │   └── websocket_route.py       # WebSocket do chat
│   │   └── services/
│   │       └── websocket_chat_gateway.py # Gateway WebSocket
│   └── main.py
└── .env                                  # Variáveis de ambiente

doctorq-web/
├── src/
│   ├── app/api/handoff/route.ts         # Proxy do handoff
│   ├── components/chat/GiseleChatWidget.tsx
│   └── hooks/useGiseleChat.ts
└── .env.local                            # Variáveis de ambiente
```

---

## Contato

Em caso de problemas, verificar:
1. Logs da API: `tail -f /var/log/doctorq-api.log`
2. Logs do PostgreSQL: `tail -f /var/log/postgresql/postgresql-16-main.log`
3. Status dos serviços: `systemctl status doctorq-api`
