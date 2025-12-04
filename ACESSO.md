# Credenciais de Acesso - DoctorQ

**Data de atualização:** 08/11/2025
**Banco de dados:** PostgreSQL `dbdoctorq` em `10.11.2.81:5432`

---

## ✅ Usuários Ativos (Testados e Funcionando)

### 1. Administrador Principal
- **Email:** `admin@doctorq.app`
- **Senha:** `Admin@123`
- **Perfil:** Administrador
- **Papel:** `admin`
- **Empresa:** Clínica Exemplo (329311ce-0d17-4361-bc51-60234ed972ee)
- **ID:** 65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4
- **Status:** ✅ Login testado e funcionando

### 2. Profissional - Dr. João Silva
- **Email:** `joao.silva@doctorq.app`
- **Senha:** `Profissional@123`
- **Perfil:** Profissional
- **Papel:** `profissional`
- **Especialidades:** Dermatologia, Harmonização Facial, Preenchimento
- **Registro:** CRM 12345-SP
- **Clínica:** Unidade Principal - Centro
- **Empresa:** Clínica Exemplo (329311ce-0d17-4361-bc51-60234ed972ee)
- **ID Usuário:** 3aea6348-d537-400b-8d61-33a92ffe1c32
- **ID Profissional:** 61022350-9384-488e-95a3-c4d7c49270b6
- **Status:** ✅ Login testado e funcionando

### 3. Usuário Teste
- **Email:** `teste@doctorq.app`
- **Senha:** `Teste@123`
- **Perfil:** Administrador
- **Papel:** `admin`
- **Empresa:** DoctorQ Admin (aba9d445-0b13-494d-ab93-73d00f850985)
- **ID:** f512692f-de1b-45f1-a955-5d23b598affe
- **Status:** ✅ Login testado e funcionando

---

## 📊 Informações do Ambiente

### Backend (API)
- **URL:** `http://localhost:8080`
- **Documentação:** `http://localhost:8080/docs`
- **Status:** ✅ Rodando
- **Banco:** PostgreSQL `dbdoctorq` em `10.11.2.81:5432`

### Frontend (Web)
- **URL:** `http://localhost:3000`
- **Status:** ✅ Rodando
- **Framework:** Next.js 15 + React 19

### Banco de Dados
- **Host:** `10.11.2.81`
- **Porta:** `5432`
- **Database:** `dbdoctorq`
- **Usuário:** `postgres`
- **Senha:** `postgres`

---

## 🔐 Algoritmo de Hash de Senhas

- **Algoritmo:** `pbkdf2_sha256`
- **Rounds:** 30000
- **Biblioteca:** passlib (Python)

---

## 📝 Notas Importantes

1. **Banco de Dados Correto:** O backend está configurado para usar `dbdoctorq`, não `doctorq`
2. **Colunas de Senha:** A tabela `tb_users` possui duas colunas de senha:
   - `ds_senha_hash` (mapeada pelo modelo como `nm_password_hash`)
   - `nm_password_hash` (coluna real)
   - **Ambas precisam ser atualizadas ao modificar senhas**
3. **Status Ativo:** O campo `st_ativo` usa `CHAR(1)` com valores `'S'` ou `'N'`, não boolean
4. **Onboarding:** Fluxos de onboarding configurados para clínica e profissional (verificar IDs no banco)

---

## 🧪 Testes de Login (via cURL)

### Admin
```bash
curl -s -X POST http://localhost:8080/users/login-local \
  -H "Content-Type: application/json" \
  -d '{"nm_email": "admin@doctorq.app", "senha": "Admin@123"}' | python3 -m json.tool
```

### Profissional
```bash
curl -s -X POST http://localhost:8080/users/login-local \
  -H "Content-Type: application/json" \
  -d '{"nm_email": "joao.silva@doctorq.app", "senha": "Profissional@123"}' | python3 -m json.tool
```

### Teste
```bash
curl -s -X POST http://localhost:8080/users/login-local \
  -H "Content-Type: application/json" \
  -d '{"nm_email": "teste@doctorq.app", "senha": "Teste@123"}' | python3 -m json.tool
```

---

## 🔄 Fluxo de Desenvolvimento

1. **Fazer login no frontend:** Acesse `http://localhost:3000/login`
2. **Escolher perfil:** Admin ou Profissional
3. **Completar onboarding:** Se for primeiro acesso, complete o onboarding
4. **Acessar áreas:** Dashboard específico por perfil

---

## ⚠️ Resolução de Problemas

### Login falha com "Credenciais inválidas"
- ✅ Verificar se está usando o banco `dbdoctorq`
- ✅ Verificar se ambas colunas de senha estão atualizadas
- ✅ Confirmar que hash usa pbkdf2_sha256 com 30000 rounds

### Usuário não encontrado
- ✅ Executar query diretamente no banco correto (`dbdoctorq`)
- ✅ Verificar se email está em lowercase
- ✅ Confirmar que `st_ativo = 'S'`

### Onboarding não aparece
- ✅ Verificar se fluxo existe em `tb_onboarding_flows`
- ✅ Verificar progresso em `tb_user_onboarding_progress`
- ✅ Limpar cache do navegador

---

**Última atualização:** 08/11/2025 20:50 BRT
