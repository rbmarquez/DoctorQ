# Deploy Redis na EC2 - DoctorQ (AWS)

**Data:** 25/11/2025
**Servidor:** EC2 em `54.160.229.38`

---

## 🎯 Objetivo

Instalar e configurar Redis na mesma instância EC2 que hospeda a aplicação DoctorQ, proporcionando cache e gerenciamento de sessões sem custo adicional.

---

## 📋 Pré-requisitos

- ✅ Acesso SSH ao servidor EC2: `ssh ec2-user@54.160.229.38`
- ✅ Permissões sudo no servidor
- ✅ Repositório DoctorQ clonado em `/home/ec2-user/DoctorQ`

---

## 🚀 Instalação Rápida (Opção Recomendada)

### **Passo 1: Conectar no Servidor**

```bash
ssh ec2-user@54.160.229.38
```

### **Passo 2: Atualizar Código do GitHub**

```bash
cd /home/ec2-user/DoctorQ
git pull origin main
```

### **Passo 3: Executar Script de Instalação**

```bash
sudo bash deploy/scripts/install_redis_ec2.sh
```

**O script irá:**
- ✅ Instalar Redis 7.x (ou 6.x se disponível)
- ✅ Gerar senha forte automaticamente
- ✅ Configurar Redis com segurança (bind localhost, senha obrigatória)
- ✅ Configurar política de memória (256MB, LRU)
- ✅ Habilitar persistência (RDB + AOF)
- ✅ Iniciar Redis e habilitar no boot
- ✅ Testar conexão

**Saída esperada:**
```
======================================
✅ Instalação Concluída com Sucesso!
======================================

📋 Informações importantes:

  Redis Host: localhost
  Redis Port: 6379
  Redis Password: AbCd1234EfGh5678IjKl9012MnOp3456
  Arquivo de senha: /tmp/redis_password.txt
```

### **Passo 4: Copiar Senha Gerada**

**⚠️ IMPORTANTE:** Anote a senha exibida no final da instalação!

Você também pode ler do arquivo temporário:
```bash
cat /tmp/redis_password.txt
```

### **Passo 5: Atualizar .env da API**

Edite o arquivo de configuração:
```bash
nano /home/ec2-user/DoctorQ/estetiQ-api/.env
```

Adicione/atualize as seguintes linhas (substitua `SENHA_GERADA` pela senha do passo anterior):
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=SENHA_GERADA_PELO_SCRIPT
REDIS_DB=0
REDIS_URL=redis://:SENHA_GERADA_PELO_SCRIPT@localhost:6379/0
```

**Exemplo real:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=AbCd1234EfGh5678IjKl9012MnOp3456
REDIS_DB=0
REDIS_URL=redis://:AbCd1234EfGh5678IjKl9012MnOp3456@localhost:6379/0
```

Salve com `Ctrl+O`, confirme com `Enter`, saia com `Ctrl+X`.

### **Passo 6: Reiniciar API**

```bash
pm2 restart doctorq-api
```

Verificar logs:
```bash
pm2 logs doctorq-api --lines 50
```

Procure por mensagens de conexão Redis bem-sucedida.

### **Passo 7: Testar Conexão Redis**

```bash
bash deploy/scripts/test_redis_connection.sh
```

**Saída esperada:**
```
======================================
Teste de Conexão Redis - DoctorQ
======================================

Executando testes de conexão:
  [1] PING básico... ✅ OK
  [2] SET test_key... ✅ OK
  [3] GET test_key... ✅ OK
  [4] DEL test_key... ✅ OK
  ...

======================================
Resumo dos Testes
======================================

  Total de testes: 9
  Testes passados: 9
  Testes falhados: 0

✅ Todos os testes passaram! Redis está funcionando perfeitamente.
```

### **Passo 8: Remover Arquivo Temporário de Senha**

Após configurar o `.env`, remova o arquivo temporário por segurança:
```bash
sudo rm /tmp/redis_password.txt
```

---

## ✅ Validação Pós-Instalação

### **1. Verificar Serviço Redis**

```bash
sudo systemctl status redis
```

Deve mostrar `Active: active (running)`.

### **2. Testar Conexão Manual**

```bash
redis-cli -a 'SUA_SENHA' ping
```

Deve retornar: `PONG`

### **3. Ver Informações do Redis**

```bash
redis-cli -a 'SUA_SENHA' INFO server
redis-cli -a 'SUA_SENHA' INFO memory
```

### **4. Verificar Logs da API**

```bash
pm2 logs doctorq-api | grep -i redis
```

Procure por:
- `✅ Redis conectado com sucesso`
- Sem erros de conexão

### **5. Testar Cache na API**

Acesse um endpoint que use cache (ex: lista de empresas):
```bash
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8080/empresas/
```

Chame novamente e veja se a resposta é mais rápida (cache hit).

---

## 🔧 Configurações Importantes

### **Arquivo de Configuração: `/etc/redis.conf`**

Principais configurações aplicadas pelo script:

```conf
# Segurança
requirepass SUA_SENHA          # Senha obrigatória
bind 127.0.0.1 ::1             # Apenas localhost (não expõe na internet)

# Memória
maxmemory 256mb                # Limite de 256MB
maxmemory-policy allkeys-lru   # Remove chaves menos usadas ao atingir limite

# Persistência
save 900 1                     # Salvar após 900s se 1 chave mudou
save 300 10                    # Salvar após 300s se 10 chaves mudaram
save 60 10000                  # Salvar após 60s se 10000 chaves mudaram
appendonly yes                 # AOF habilitado para durabilidade

# Logs
loglevel notice
logfile /var/log/redis/redis.log
```

### **Modificar Configurações (se necessário)**

```bash
sudo nano /etc/redis.conf
```

Após modificar, reinicie:
```bash
sudo systemctl restart redis
```

---

## 📊 Monitoramento

### **Ver Logs em Tempo Real**

```bash
sudo tail -f /var/log/redis/redis.log
```

### **Estatísticas de Uso**

```bash
redis-cli -a 'SUA_SENHA' INFO stats
```

### **Memória Utilizada**

```bash
redis-cli -a 'SUA_SENHA' INFO memory
```

### **Chaves Armazenadas**

```bash
redis-cli -a 'SUA_SENHA' DBSIZE
redis-cli -a 'SUA_SENHA' KEYS '*'  # ⚠️ Não use em produção com muitas chaves!
```

### **Clients Conectados**

```bash
redis-cli -a 'SUA_SENHA' CLIENT LIST
```

---

## 🚨 Troubleshooting

### **Erro: "Could not connect to Redis"**

**Causa:** Redis não está rodando ou senha incorreta.

**Solução:**
```bash
# Verificar se está rodando
sudo systemctl status redis

# Iniciar se não estiver
sudo systemctl start redis

# Verificar logs
sudo tail -50 /var/log/redis/redis.log
```

### **Erro: "NOAUTH Authentication required"**

**Causa:** Senha não foi fornecida ou está incorreta.

**Solução:**
```bash
# Verificar senha configurada
sudo grep requirepass /etc/redis.conf

# Atualizar .env da API com senha correta
nano /home/ec2-user/DoctorQ/estetiQ-api/.env

# Reiniciar API
pm2 restart doctorq-api
```

### **Erro: "OOM command not allowed when used memory > 'maxmemory'"**

**Causa:** Redis atingiu limite de memória (256MB).

**Solução 1 - Limpar cache:**
```bash
redis-cli -a 'SUA_SENHA' FLUSHDB
```

**Solução 2 - Aumentar maxmemory:**
```bash
sudo nano /etc/redis.conf
# Alterar: maxmemory 512mb

sudo systemctl restart redis
```

### **Redis não inicia após reiniciar EC2**

**Causa:** Redis não está habilitado para iniciar no boot.

**Solução:**
```bash
sudo systemctl enable redis
sudo systemctl start redis
```

### **Performance lenta**

**Diagnóstico:**
```bash
# Ver comandos lentos
redis-cli -a 'SUA_SENHA' SLOWLOG GET 10

# Ver operações por segundo
redis-cli -a 'SUA_SENHA' INFO stats | grep instantaneous_ops_per_sec
```

**Solução:**
- Revisar queries no código da API
- Aumentar maxmemory se necessário
- Considerar migrar para ElastiCache para alta demanda

---

## 🔄 Backup e Restore

### **Backup Manual**

```bash
# Redis faz backup automático em /var/lib/redis/dump.rdb
sudo cp /var/lib/redis/dump.rdb /var/backups/doctorq/redis/dump_$(date +%Y%m%d_%H%M%S).rdb

# Backup do AOF
sudo cp /var/lib/redis/appendonly.aof /var/backups/doctorq/redis/appendonly_$(date +%Y%m%d_%H%M%S).aof
```

### **Restore**

```bash
# Parar Redis
sudo systemctl stop redis

# Restaurar arquivo
sudo cp /var/backups/doctorq/redis/dump_XXXXXXXX.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb

# Iniciar Redis
sudo systemctl start redis
```

---

## 📈 Migração Futura para ElastiCache

Quando a aplicação crescer, você pode migrar para AWS ElastiCache:

### **Vantagens do ElastiCache:**
- ✅ Backups automáticos
- ✅ Alta disponibilidade (Multi-AZ)
- ✅ Escalabilidade automática
- ✅ Patches gerenciados pela AWS
- ✅ Monitoramento integrado com CloudWatch

### **Custo Estimado:**
- `cache.t3.micro`: ~$12/mês
- `cache.t4g.micro`: ~$9/mês

### **Passos para Migração:**

1. Criar ElastiCache Redis cluster no Console AWS
2. Configurar Security Group para permitir acesso da EC2
3. Atualizar `.env` com endpoint do ElastiCache:
   ```env
   REDIS_HOST=doctorq-redis.xxxxx.0001.use1.cache.amazonaws.com
   REDIS_PORT=6379
   REDIS_PASSWORD=senha_elasticache
   ```
4. Reiniciar API: `pm2 restart doctorq-api`
5. Desinstalar Redis da EC2 (opcional): `sudo yum remove redis`

---

## 📝 Checklist de Deploy

- [ ] Redis instalado na EC2
- [ ] Senha forte gerada e anotada
- [ ] `.env` da API atualizado com credenciais Redis
- [ ] API reiniciada com `pm2 restart`
- [ ] Testes de conexão passando
- [ ] Logs da API sem erros de Redis
- [ ] Arquivo temporário `/tmp/redis_password.txt` removido
- [ ] Cache funcionando (testar endpoint antes/depois)

---

## 🔗 Links Úteis

- **Documentação Redis:** https://redis.io/docs/
- **Redis CLI:** https://redis.io/docs/manual/cli/
- **Redis Best Practices:** https://redis.io/docs/manual/patterns/

---

**Última atualização:** 25/11/2025
