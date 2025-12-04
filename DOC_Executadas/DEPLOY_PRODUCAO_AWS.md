# Deploy em Produção - DoctorQ (AWS)

**Data:** 25/11/2025
**Banco de Dados:** AWS RDS PostgreSQL `dbdoctorq`

---

## 🚀 Opções de Deploy

### **Opção 1: Deploy Automático via GitHub Actions** (Recomendado)

O GitHub Actions já está configurado e detecta automaticamente pushes para `main`:

#### Acompanhar deploy:
```
https://github.com/rbmarquez/DoctorQ/actions
```

#### Forçar deploy manual:
1. Acesse: https://github.com/rbmarquez/DoctorQ/actions
2. Clique em "DoctorQ Deploy Production"
3. Clique em "Run workflow" → "Run workflow"

---

### **Opção 2: Deploy Manual via SSH**

#### 1. Conectar no servidor EC2
```bash
ssh ec2-user@54.160.229.38
```

#### 2. ⚠️ IMPORTANTE: Renomear banco em produção (APENAS UMA VEZ)

**Credenciais AWS RDS:**
- **Host:** `dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com`
- **Porta:** `5432`
- **Database:** `dbdoctorq`
- **Usuário:** `doctorq`
- **Senha:** `Passw0rd150982`

**Comando para renomear banco:**
```bash
PGPASSWORD=Passw0rd150982 psql -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com -U doctorq -d postgres << EOF
-- Desconectar sessões ativas
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'doctorq_prod' AND pid <> pg_backend_pid();

-- Renomear banco
ALTER DATABASE doctorq_prod RENAME TO dbdoctorq;
EOF
```

**Verificar se renomeou:**
```bash
PGPASSWORD=Passw0rd150982 psql \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d dbdoctorq \
  -c "SELECT current_database(), COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';"
```

#### 3. Atualizar código do GitHub
```bash
cd /home/ec2-user/DoctorQ
git fetch origin main
git reset --hard origin/main
git clean -fd
```

#### 4. Atualizar Backend (API)
```bash
cd estetiQ-api
uv sync
pm2 restart doctorq-api
# Ou reiniciar todos: pm2 restart all
```

#### 5. Atualizar Frontend (Web)
```bash
cd ../estetiQ-web
yarn install
rm -rf .next node_modules/.cache
yarn build
pm2 restart doctorq-web
```

#### 6. Configurar Redis (Primeira vez apenas)

**⚠️ Execute apenas se Redis ainda não estiver instalado**

```bash
# Voltar para raiz do projeto
cd /home/ec2-user/DoctorQ

# Executar script de instalação
sudo bash deploy/scripts/install_redis_ec2.sh

# O script irá gerar uma senha - ANOTE-A!
# Exemplo de saída:
# ✅ Senha gerada: AbCd1234EfGh5678IjKl9012MnOp3456
```

**Atualizar .env com senha do Redis:**
```bash
nano estetiQ-api/.env

# Adicionar/atualizar:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=SENHA_GERADA_ACIMA
REDIS_DB=0
REDIS_URL=redis://:SENHA_GERADA_ACIMA@localhost:6379/0
```

**Reiniciar API:**
```bash
pm2 restart doctorq-api
```

**Testar Redis:**
```bash
bash deploy/scripts/test_redis_connection.sh
```

**📖 Documentação completa:** Ver `DEPLOY_REDIS_AWS.md` para detalhes.

#### 7. Verificar status
```bash
pm2 list
pm2 logs --lines 50
```

---

## ⚠️ ATENÇÃO: Checklist Antes de Deploy

### ✅ **Fazer Backup do Banco (CRÍTICO)**

```bash
PGPASSWORD=Passw0rd150982 pg_dump \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d doctorq_prod \
  -Fc \
  -f backup_antes_rename_$(date +%Y%m%d_%H%M%S).dump

# Verificar tamanho do backup
ls -lh backup_antes_rename_*.dump
```

### ✅ **Parar Aplicações Antes de Renomear Banco**

```bash
pm2 stop all
pm2 list
```

### ✅ **Atualizar .env em Produção**

No servidor EC2, edite `/home/ec2-user/DoctorQ/estetiQ-api/.env`:

```bash
nano /home/ec2-user/DoctorQ/estetiQ-api/.env
```

**Altere as linhas:**
```env
DATABASE_HOST=dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com
POSTGRES_PORT=5432
DATABASE_NAME=dbdoctorq
DATABASE_USERNAME=doctorq
DATABASE_PASSWORD=Passw0rd150982
```

### ✅ **Reiniciar Aplicações**

```bash
pm2 restart all
pm2 save
pm2 logs --lines 50
```

---

## 📊 Validação Pós-Deploy

### 1. Testar conexão com banco AWS RDS
```bash
PGPASSWORD=Passw0rd150982 psql \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d dbdoctorq \
  -c "SELECT COUNT(*) as total_usuarios FROM tb_users;"
```

### 2. Testar Redis (se instalado)
```bash
# Verificar se Redis está rodando
sudo systemctl status redis

# Testar conexão (use a senha configurada)
redis-cli -a 'SUA_SENHA_REDIS' ping
# Deve retornar: PONG

# Ver estatísticas
redis-cli -a 'SUA_SENHA_REDIS' INFO stats | grep total_commands_processed

# Executar suite completa de testes
bash deploy/scripts/test_redis_connection.sh
```

### 3. Testar API em produção
```bash
# Health check
curl http://54.160.229.38:8080/health

# Verificar versão
curl http://54.160.229.38:8080/api/version
```

### 4. Ver logs da API
```bash
pm2 logs doctorq-api --lines 30
```

### 5. Ver logs do Frontend
```bash
pm2 logs doctorq-web --lines 30
```

### 6. Verificar processos PM2
```bash
pm2 list
pm2 monit
```

---

## 🔐 Credenciais de Produção

### Banco de Dados AWS RDS
- **Endpoint:** `dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com:5432`
- **Database:** `dbdoctorq`
- **Usuário:** `doctorq`
- **Senha:** `Passw0rd150982`
- **String de Conexão:**
  ```
  postgresql+asyncpg://doctorq:Passw0rd150982@dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com:5432/dbdoctorq
  ```

### Servidor EC2
- **IP Público:** `54.160.229.38`
- **Usuário SSH:** `ec2-user`
- **Chave SSH:** `github_actions_deploy`

---

## 🚨 Troubleshooting

### Erro: "database does not exist"
```bash
# Verificar se banco foi renomeado
PGPASSWORD=Passw0rd150982 psql \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d postgres \
  -c "SELECT datname FROM pg_database WHERE datname LIKE '%doctorq%';"
```

### Erro: "connection refused"
```bash
# Verificar security group do RDS permite conexão da EC2
# Verificar se .env tem as credenciais corretas
cat /home/ec2-user/DoctorQ/estetiQ-api/.env | grep DATABASE
```

### API não inicia
```bash
# Ver logs detalhados
pm2 logs doctorq-api --lines 100 --err

# Reiniciar com logs
pm2 restart doctorq-api && pm2 logs doctorq-api
```

### Frontend não carrega
```bash
# Verificar build
cd /home/ec2-user/DoctorQ/estetiQ-web
yarn build

# Verificar se PM2 está rodando
pm2 list | grep doctorq-web
```

---

## 📝 Rollback (se necessário)

### Restaurar backup do banco
```bash
PGPASSWORD=Passw0rd150982 pg_restore \
  -h dbdoctorq.cq346owcuqyu.us-east-1.rds.amazonaws.com \
  -U doctorq \
  -d dbdoctorq \
  --clean --if-exists \
  backup_antes_rename_XXXXXXXX.dump
```

### Voltar código para versão anterior
```bash
cd /home/ec2-user/DoctorQ
git log --oneline -5
git reset --hard <commit-hash-anterior>
pm2 restart all
```

---

**Última atualização:** 25/11/2025
