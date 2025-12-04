# 🔧 Troubleshooting - Sistema de Agendamento

**Data:** 2025-10-30

---

## 🚨 Erro: "Nenhum horário disponível" / ApiClientError

### Sintomas

```
❌ Erro API ao buscar agenda para 2025-11-05: ApiClientError
⚠️ Backend não disponível, usando agenda mock
```

---

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Verificar se o Backend Está Rodando

```bash
# Testar se o backend responde
curl http://localhost:8080/health

# Resposta esperada:
# {"status": "healthy"}
```

**Se não responder:**
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
make dev
```

### Passo 2: Testar o Endpoint de Disponibilidade Diretamente

```bash
# Obter um ID de profissional válido primeiro
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "
  SELECT id_profissional, nm_profissional
  FROM tb_profissionais
  WHERE st_ativo = TRUE
  LIMIT 1;
"

# Exemplo de resposta:
#           id_profissional           |   nm_profissional
# ------------------------------------+---------------------
#  123e4567-e89b-12d3-a456-426614174000 | Dra. Maria Silva

# Usar o UUID acima para testar:
curl -X GET "http://localhost:8080/agendamentos/disponibilidade?id_profissional=123e4567-e89b-12d3-a456-426614174000&data=2025-10-30&duracao_minutos=60" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"
```

**Resposta esperada (sucesso):**
```json
[
  {
    "dt_horario": "2025-10-30T08:00:00",
    "disponivel": true,
    "motivo": null
  },
  {
    "dt_horario": "2025-10-30T08:30:00",
    "disponivel": false,
    "motivo": "Horário no passado"
  }
]
```

**Possíveis erros e soluções:**

#### Erro 401 Unauthorized
```json
{"detail": "Unauthorized"}
```

**Causa:** API key incorreta ou não enviada

**Solução:**
1. Verificar `.env.local`:
   ```bash
   cat /mnt/repositorios/DoctorQ/estetiQ-web/.env.local | grep API_KEY
   ```

   Deve conter:
   ```
   NEXT_PUBLIC_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
   API_DOCTORQ_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
   ```

2. Reiniciar o frontend:
   ```bash
   cd /mnt/repositorios/DoctorQ/estetiQ-web
   # Parar com Ctrl+C
   yarn dev
   ```

#### Erro 400 Bad Request
```json
{"detail": "ID de profissional inválido"}
```

**Causa:** UUID do profissional está no formato errado

**Solução:** Verificar se o ID tem formato UUID válido (36 caracteres com hífens)

#### Erro 500 Internal Server Error
```json
{"detail": "Erro ao consultar disponibilidade: ..."}
```

**Causa:** Problema no banco de dados ou código do backend

**Solução:**
1. Verificar logs do backend (terminal onde rodou `make dev`)
2. Verificar conexão com PostgreSQL:
   ```bash
   PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "SELECT 1;"
   ```

### Passo 3: Verificar Se Há Profissionais no Banco

```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "
  SELECT
    id_profissional,
    nm_profissional,
    st_ativo,
    id_empresa
  FROM tb_profissionais
  WHERE st_ativo = TRUE
  LIMIT 5;
"
```

**Se retornar vazio:**
```sql
-- Inserir profissionais de teste
INSERT INTO tb_profissionais (
  id_empresa,
  nm_profissional,
  ds_especialidades,
  st_ativo
) VALUES (
  (SELECT id_empresa FROM tb_empresas LIMIT 1),
  'Dr. João Silva',
  ARRAY['Dermatologia', 'Estética'],
  TRUE
) RETURNING id_profissional;
```

### Passo 4: Verificar Console do Navegador

1. Abrir DevTools (F12)
2. Aba **Console**
3. Procurar por mensagens:

**Sucesso:**
```
🔍 Buscando agenda real para profissional: 123e4567-...
✅ Horários recebidos para 2025-10-30: 20
✅ Horários recebidos para 2025-10-31: 20
```

**Erro detalhado:**
```
❌ Erro API ao buscar agenda para 2025-10-30: {
  status: 400,
  message: "ID de profissional inválido",
  url: "/agendamentos/disponibilidade?id_profissional=..."
}
```

### Passo 5: Verificar Rede no DevTools

1. Abrir DevTools (F12)
2. Aba **Network** (Rede)
3. Filtrar por `disponibilidade`
4. Ver detalhes da requisição:
   - **Status:** Deve ser 200
   - **Response:** JSON com horários
   - **Request Headers:** Deve ter `Authorization: Bearer ...`

---

## 🐛 Problemas Comuns

### 1. Backend não está rodando

**Sintoma:** `Failed to fetch` ou `ERR_CONNECTION_REFUSED`

**Solução:**
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
make dev
```

Aguardar até ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. PostgreSQL não está acessível

**Sintoma:** `connection to server ... failed`

**Solução:**
1. Verificar se PostgreSQL está rodando no servidor:
   ```bash
   PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -c "SELECT version();"
   ```

2. Se não conectar, verificar:
   - Servidor 10.11.2.81 está online?
   - Porta 5432 está aberta?
   - Credenciais corretas?

### 3. CORS Error

**Sintoma:** `Access to fetch ... has been blocked by CORS policy`

**Solução:** Verificar configuração de CORS no backend

Arquivo: `estetiQ-api/src/main.py`

Deve ter:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. UUID inválido

**Sintoma:** `ID de profissional inválido`

**Verificar formato do UUID:**
```javascript
// Correto (36 caracteres com hífens)
"123e4567-e89b-12d3-a456-426614174000"

// Incorreto
"123"
"prof-1"
""
```

---

## ✅ Modo Fallback (Mock)

Se o backend não estiver disponível, o sistema automaticamente usa dados MOCK (falsos) como fallback.

**Identificar modo mock no console:**
```
⚠️ Backend não disponível para profissional xxx, usando agenda mock
```

**Comportamento no modo mock:**
- ✅ Horários são gerados aleatoriamente
- ✅ Horários no passado são marcados como indisponíveis
- ❌ Agendamentos NÃO são salvos no banco
- ❌ Conflitos NÃO são detectados

**Para FORÇAR uso do backend:**
1. Garantir que backend está rodando
2. Verificar variável `.env.local`:
   ```
   NEXT_PUBLIC_USE_REAL_AGENDAMENTO=true
   ```
3. Reiniciar frontend

---

## 📊 Checklist de Verificação

- [ ] Backend está rodando (`curl http://localhost:8080/health`)
- [ ] PostgreSQL está acessível (`psql -h 10.11.2.81 ...`)
- [ ] Há profissionais ativos no banco (`SELECT * FROM tb_profissionais`)
- [ ] Frontend está usando API key correta (`.env.local`)
- [ ] Console mostra logs de requisição
- [ ] Network tab mostra status 200 nas requisições
- [ ] UUIDs dos profissionais são válidos

---

## 🔬 Teste Manual Completo

### Script de Teste

```bash
#!/bin/bash
echo "🧪 Testando Sistema de Agendamento"
echo "=================================="

# 1. Testar Backend
echo "1️⃣ Testando backend..."
curl -s http://localhost:8080/health | grep -q "healthy" && echo "✅ Backend OK" || echo "❌ Backend OFFLINE"

# 2. Testar PostgreSQL
echo "2️⃣ Testando PostgreSQL..."
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "SELECT 1;" > /dev/null 2>&1 && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL INACESSÍVEL"

# 3. Verificar profissionais
echo "3️⃣ Verificando profissionais..."
COUNT=$(PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -t -c "SELECT COUNT(*) FROM tb_profissionais WHERE st_ativo = TRUE;")
echo "   Profissionais ativos: $COUNT"

# 4. Testar endpoint de disponibilidade
echo "4️⃣ Testando endpoint /agendamentos/disponibilidade..."
ID=$(PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -t -c "SELECT id_profissional FROM tb_profissionais WHERE st_ativo = TRUE LIMIT 1;" | xargs)

if [ ! -z "$ID" ]; then
  curl -s -w "\nStatus: %{http_code}\n" \
    "http://localhost:8080/agendamentos/disponibilidade?id_profissional=$ID&data=2025-10-30&duracao_minutos=60" \
    -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
    | head -20
else
  echo "❌ Nenhum profissional encontrado"
fi

echo ""
echo "=================================="
echo "🏁 Teste concluído!"
```

Salvar como `test_agendamento.sh` e executar:
```bash
chmod +x test_agendamento.sh
./test_agendamento.sh
```

---

## 📞 Suporte

Se após seguir todos os passos o problema persistir:

1. **Capturar logs:**
   - Console do navegador (F12)
   - Terminal do backend
   - Resposta do curl

2. **Informar:**
   - Mensagem de erro exata
   - Status code HTTP
   - URL completa da requisição
   - Versão do navegador

3. **Verificar:**
   - Arquivo de documentação principal
   - Issues no GitHub (se aplicável)

---

**Última atualização:** 2025-10-30
