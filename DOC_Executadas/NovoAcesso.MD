# 🔐 Acessos do Sistema EstetiQ

**Data de Criação:** 19/11/2025
**Banco de Dados:** estetiq_prod
**Servidor:** 10.11.2.81:5432

---

## 📊 Banco de Dados

**Conexão PostgreSQL:**
```
Host: 10.11.2.81
Porta: 5432
Database: estetiq_prod
Usuário: postgres
Senha: postgres
```

**String de Conexão:**
```
postgresql://postgres:postgres@10.11.2.81:5432/estetiq_prod
```

---

## 👥 Usuários do Sistema

### Administrador Principal
- **Nome:** Administrador EstetiQ
- **E-mail:** `admin@estetiq.app`
- **Senha:** `SenhaSegura123!`
- **Perfil:** Administrador
- **Empresa:** Clínica Exemplo
- **ID:** `65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4`

### Gestor - Empresa Teste
- **Nome:** Gestor Clínica Estética Premium
- **E-mail:** `gestor.premium@teste.com`
- **Senha:** `SenhaSegura123!`
- **Perfil:** Gestor de Clínica
- **Empresa:** Empresa Teste
- **ID:** `4b6d20ed-bb93-46ad-8b1c-d9740ecd589d`
- **ID Empresa:** `af8b2919-d0f6-4310-9a77-488989969ea4`

### Outros Gestores
1. **Gestor Dermato Avançada**
   - E-mail: `gestor.dermato@teste.com`
   - Senha: `SenhaSegura123!`
   - ID: `6b64f309-f370-4576-90b4-4cba8fd0ce0b`

2. **Gestor Beleza Total**
   - E-mail: `gestor.beleza@teste.com`
   - Senha: `SenhaSegura123!`
   - ID: `820f74ef-05f2-4578-8c74-cd5e9af75875`

### Profissionais
1. **Dr. João Silva**
   - E-mail: `joao.silva@estetiq.app`
   - Senha: `SenhaSegura123!`
   - Perfil: Profissional
   - ID: `3aea6348-d537-400b-8d61-33a92ffe1c32`

2. **Dr. Eduardo Santos**
   - E-mail: `eduardo.santos@clinicanova.com.br`
   - Senha: `SenhaSegura123!`
   - Perfil: Profissional
   - ID: `5f35cb29-b345-41f3-ae07-a23d808f4b64`

### Usuário de Teste
- **Nome:** Usuário Teste
- **E-mail:** `teste@estetiq.app`
- **Senha:** `SenhaSegura123!`
- **Perfil:** Administrador
- **ID:** `f512692f-de1b-45f1-a955-5d23b598affe`

---

## 🏥 Clínicas Cadastradas (3)

### 1. Clínica Estética Premium
- **ID:** `40b0197f-344b-4f9e-9098-2bcb786520ee`
- **CNPJ:** 12.345.678/0001-90
- **E-mail:** contato@esteticapremium.com
- **Telefone:** (11) 98765-4321
- **Endereço:** Av. Paulista, 1000 - São Paulo/SP
- **CEP:** 01310-100
- **Status:** Ativo

### 2. Dermato Avançada
- **ID:** `1233d1a2-8f5c-485f-953f-11f0b4f242b0`
- **CNPJ:** 98.765.432/0001-11
- **E-mail:** contato@dermatoavancada.com
- **Telefone:** (11) 97654-3210
- **Endereço:** Rua Augusta, 500 - São Paulo/SP
- **CEP:** 01305-000
- **Status:** Ativo

### 3. Beleza Total
- **ID:** `90615b13-33f2-48dc-a0e7-1fe7bc7847dd`
- **CNPJ:** 45.678.912/0001-33
- **E-mail:** contato@belezatotal.com
- **Telefone:** (11) 96543-2109
- **Endereço:** Av. Faria Lima, 2000 - São Paulo/SP
- **CEP:** 01451-000
- **Status:** Ativo

---

## 🏭 Fornecedores Cadastrados (3)

### 1. Dermocosméticos Brasil Ltda
- **ID:** `b461320a-3c29-4a4a-8098-6e928c81a4d8`
- **CNPJ:** 11.223.344/0001-55
- **E-mail:** vendas@dermocosmeticos.com.br
- **Telefone:** (11) 3333-4444
- **Endereço:** Rua dos Fornecedores, 100 - São Paulo/SP
- **CEP:** 01400-000
- **Categorias:** Dermocosméticos, Produtos Faciais

### 2. Equipamentos Estéticos S/A
- **ID:** `80aac090-03c3-47a3-80c1-007b3c6ba866`
- **CNPJ:** 22.334.455/0001-66
- **E-mail:** comercial@equipamentos.com.br
- **Telefone:** (11) 4444-5555
- **Endereço:** Av. Industrial, 500 - São Paulo/SP
- **CEP:** 01500-000
- **Categorias:** Equipamentos, Laser

### 3. Distribuidora Beauty Supply
- **ID:** `1c3a8b0b-912b-4b97-a520-10866f5cb7a5`
- **CNPJ:** 33.445.566/0001-77
- **E-mail:** atendimento@beautysupply.com.br
- **Telefone:** (11) 5555-6666
- **Endereço:** Rua do Comércio, 888 - São Paulo/SP
- **CEP:** 01600-000
- **Categorias:** Cosméticos, Suprimentos

---

## 👤 Pacientes Cadastrados (3)

### 1. Maria Silva Santos
- **ID:** `6abe41cc-f836-4d4e-8916-b4cc4b56fa45`
- **CPF:** 123.456.789-01
- **E-mail:** maria.silva@email.com
- **Telefone:** (11) 99999-1111
- **Data Nascimento:** 15/05/1990
- **Gênero:** Feminino
- **Endereço:** Rua das Flores, 123 - São Paulo/SP
- **CEP:** 01000-000

### 2. João Pedro Oliveira
- **ID:** `90e52499-c68c-4aa5-94f4-490f1998f933`
- **CPF:** 987.654.321-09
- **E-mail:** joao.pedro@email.com
- **Telefone:** (11) 98888-2222
- **Data Nascimento:** 20/08/1985
- **Gênero:** Masculino
- **Endereço:** Av. Brasil, 456 - São Paulo/SP
- **CEP:** 01100-000

### 3. Ana Carolina Souza
- **ID:** `23f345bb-4dd6-4d5b-b375-b8cebbbb36de`
- **CPF:** 111.222.333-44
- **E-mail:** ana.souza@email.com
- **Telefone:** (11) 97777-3333
- **Data Nascimento:** 10/12/1995
- **Gênero:** Feminino
- **Endereço:** Rua da Paz, 789 - São Paulo/SP
- **CEP:** 01200-000

---

## 🔑 API Backend

**Endpoint:** http://localhost:8080
**API Key:** `vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX`

**Exemplo de Requisição:**
```bash
curl -X GET "http://localhost:8080/clinicas/" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -H "Content-Type: application/json"
```

**Documentação Swagger:**
http://localhost:8080/docs

---

## 📝 Notas Importantes

1. **Senha Padrão:** Todos os usuários usam a senha `SenhaSegura123!`
2. **Banco de Dados:** Certifique-se de usar `estetiq_prod` (não `estetiq`)
3. **API Key:** Necessária para todas as requisições ao backend
4. **IDs:** Todos os IDs são UUIDs v4

---

## 🔄 Comandos Úteis

### Conectar ao Banco
```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d estetiq_prod
```

### Verificar Dados
```sql
SELECT COUNT(*) FROM tb_clinicas;    -- Deve retornar 3
SELECT COUNT(*) FROM tb_fornecedores; -- Deve retornar 3
SELECT COUNT(*) FROM tb_pacientes;    -- Deve retornar 3
```

### Testar API
```bash
# Listar clínicas
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8080/clinicas/

# Listar fornecedores
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8080/fornecedores/

# Listar pacientes
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8080/pacientes/
```

---

**Documento gerado automaticamente em:** 19/11/2025 19:30 BRT
**Última atualização:** 19/11/2025 19:30 BRT
