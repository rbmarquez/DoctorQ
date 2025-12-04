# Como Corrigir o Erro "Usuário não possui empresa associada"

## ✅ Mudanças Aplicadas

Foram feitas correções críticas para garantir que o JWT do usuário (com `id_empresa`) seja usado em TODAS as requisições:

### 1. **Server-Side (Server Components)**
- [src/lib/api/server.ts](estetiQ-web/src/lib/api/server.ts#L72-L74) agora usa o JWT da sessão ao invés da API Key global

### 2. **Client-Side (Hooks SWR)**
- [src/lib/api/client.ts](estetiQ-web/src/lib/api/client.ts#L26-L35) agora suporta token dinâmico
- [src/components/AuthTokenSync.tsx](estetiQ-web/src/components/AuthTokenSync.tsx) sincroniza automaticamente o JWT da sessão

### 3. **Providers**
- [src/components/providers.tsx](estetiQ-web/src/components/providers.tsx#L28) inclui AuthTokenSync para atualizar token automaticamente

---

## 🚀 Como Aplicar a Correção

### Passo 1: Parar o servidor Next.js
Se estiver rodando, pressione `Ctrl+C` para parar.

### Passo 2: Limpar cache do Next.js
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-web
rm -rf .next
```

### Passo 3: Iniciar o servidor
```bash
yarn dev
```

### Passo 4: Limpar sessão do navegador
**Importante:** Abra o navegador em modo anônimo ou limpe os cookies do localhost:3000

### Passo 5: Fazer login novamente
1. Acesse http://localhost:3000/login
2. Login: `admin@doctorq.app`
3. Senha: `SenhaAdm123!`

### Passo 6: Verificar que funcionou
Após login, você deve:
- ✅ Ser redirecionado para `/admin/dashboard`
- ✅ Ver as estatísticas carregarem sem erro 403
- ✅ Conseguir navegar para todas as rotas do menu

---

## 🔍 Como Verificar se Está Funcionando

Abra as ferramentas de desenvolvedor do navegador (F12) e na aba Console você deve ver:

```
[AUTH_TOKEN_SYNC] Token atualizado para: admin@doctorq.app
[SERVER_FETCH] Usando JWT do usuário: admin@doctorq.app
```

Isso confirma que o JWT correto (com `id_empresa`) está sendo usado.

---

## ❌ Se Ainda Não Funcionar

1. **Verifique se o backend está rodando:**
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
uv run uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

2. **Verifique o usuário no banco:**
```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c \
  "SELECT id_user, nm_email, id_empresa FROM tb_users WHERE nm_email = 'admin@doctorq.app';"
```

Deve retornar:
```
id_user                              | nm_email          | id_empresa
-------------------------------------+-------------------+-------------------------------------
33333333-3333-3333-3333-333333333333 | admin@doctorq.app | 11111111-1111-1111-1111-111111111111
```

3. **Teste a API diretamente:**
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8080/users/login-local \
  -H "Content-Type: application/json" \
  -d '{"nm_email":"admin@doctorq.app","senha":"SenhaAdm123!"}' \
  | jq -r '.access_token')

# Verificar JWT contém id_empresa
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq
```

Se você ver `"id_empresa": "11111111-1111-1111-1111-111111111111"` no payload, o backend está correto.

---

## 📝 Resumo Técnico

**Antes:**
- ❌ Requisições usavam API Key global (sem `id_empresa`)
- ❌ Backend rejeitava com 403: "Usuário não possui empresa associada"

**Agora:**
- ✅ Server Components usam JWT da sessão (com `id_empresa`)
- ✅ Client Components usam JWT da sessão (com `id_empresa`)
- ✅ AuthTokenSync mantém token sincronizado automaticamente
- ✅ Backend aceita requisições e valida `id_empresa` corretamente
