# 💾 Sistema de Backup e Restauração - DoctorQ

Sistema completo de **Disaster Recovery** para banco de dados PostgreSQL e arquivos.

## 🎯 UC125 - Backup e Restauração

Implementação de backup automático com:

- ✅ Backup FULL diário do PostgreSQL
- ✅ Backup SEMANAL com retenção de 1 ano
- ✅ Backup INCREMENTAL a cada 6 horas (opcional)
- ✅ Upload automático para S3/MinIO (Glacier)
- ✅ Verificação de integridade (checksum MD5)
- ✅ Retenção configurável (30 dias diário, 1 ano semanal)
- ✅ Restauração self-service via scripts
- ✅ Notificações por webhook (Slack, email, etc)

## 📁 Estrutura de Arquivos

```
scripts/
├── backup_database.sh        # Script de backup PostgreSQL
├── restore_database.sh        # Script de restauração
├── backup_cron.conf           # Configuração de agendamento
└── README_BACKUP.md           # Esta documentação
```

## 🚀 Quick Start

### 1. Configurar Variáveis de Ambiente

Crie arquivo `.env.backup`:

```bash
# PostgreSQL
export PGHOST=10.11.2.81
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=postgres
export PGDATABASE=doctorq

# Diretório de backup
export BACKUP_DIR=/var/backups/doctorq/database

# S3/MinIO (opcional)
export S3_BUCKET=doctorq-backups
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# Notificações (opcional)
export WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Carregar variáveis:

```bash
source .env.backup
```

### 2. Criar Diretórios

```bash
sudo mkdir -p /var/backups/doctorq/database/weekly
sudo chown -R $USER:$USER /var/backups/doctorq
```

### 3. Dar Permissão de Execução

```bash
chmod +x scripts/backup_database.sh
chmod +x scripts/restore_database.sh
```

### 4. Testar Backup Manual

```bash
# Backup FULL
./scripts/backup_database.sh full

# Verificar arquivo criado
ls -lh /var/backups/doctorq/database/
```

### 5. Configurar Agendamento Automático

```bash
# Copiar arquivo de configuração
sudo cp scripts/backup_cron.conf /etc/cron.d/doctorq-backup

# Ajustar permissões
sudo chmod 644 /etc/cron.d/doctorq-backup

# Recarregar cron
sudo systemctl restart cron

# Verificar se foi carregado
sudo crontab -l
```

## 📊 Estratégia de Backup

### Backup FULL Diário

- **Frequência**: Todos os dias às 02:00 AM
- **Retenção**: 30 dias
- **Tipo**: `pg_dump --format=custom`
- **Compressão**: Level 9 (máxima)
- **Armazenamento**: Local + S3 Glacier

### Backup SEMANAL

- **Frequência**: Domingos às 03:00 AM
- **Retenção**: 1 ano (365 dias)
- **Tipo**: FULL backup copiado para diretório `weekly/`
- **Armazenamento**: S3 Glacier

### Backup INCREMENTAL (Opcional)

- **Frequência**: A cada 6 horas
- **Retenção**: 7 dias
- **Tipo**: WAL archiving (Write-Ahead Logging)
- **Observação**: Requer configuração no PostgreSQL

## 🔧 Uso dos Scripts

### Backup Manual

```bash
# Backup FULL
source .env.backup
./scripts/backup_database.sh full

# Backup INCREMENTAL
./scripts/backup_database.sh incremental
```

**Saída esperada:**

```
[2025-11-07 14:30:00] =========================================
[2025-11-07 14:30:00] Backup DoctorQ Database - Tipo: full
[2025-11-07 14:30:00] =========================================
[2025-11-07 14:30:01] PostgreSQL está acessível
[2025-11-07 14:30:01] Iniciando backup FULL do banco de dados 'doctorq'...
[2025-11-07 14:30:01] Host: 10.11.2.81:5432
[2025-11-07 14:30:01] Arquivo: /var/backups/doctorq/database/doctorq_full_20251107_143000.sql.gz
[2025-11-07 14:35:23] Backup FULL concluído com sucesso!
[2025-11-07 14:35:23] Tamanho do backup: 1.2G
[2025-11-07 14:35:23] Checksum MD5 gerado
[2025-11-07 14:35:25] Fazendo upload para S3: s3://doctorq-backups/doctorq/database/2025-11-07/doctorq_full_20251107_143000.sql.gz
[2025-11-07 14:37:10] Upload para S3 concluído!
[2025-11-07 14:37:11] Limpando backups antigos...
[2025-11-07 14:37:12] Limpeza concluída
```

### Restauração

```bash
# Listar backups disponíveis
ls -lh /var/backups/doctorq/database/

# Restaurar backup específico
source .env.backup
./scripts/restore_database.sh /var/backups/doctorq/database/doctorq_full_20251107_143000.sql.gz
```

**Atenção**: A restauração é **destrutiva** e **irreversível**. O script solicitará confirmação explícita.

**Saída esperada:**

```
[2025-11-07 15:00:00] =========================================
[2025-11-07 15:00:00] Restauração DoctorQ Database
[2025-11-07 15:00:00] =========================================
[2025-11-07 15:00:01] Arquivo de backup encontrado: /var/backups/doctorq/database/doctorq_full_20251107_143000.sql.gz
[2025-11-07 15:00:02] Verificando checksum MD5...
[2025-11-07 15:00:02] ✓ Checksum MD5 válido
[2025-11-07 15:00:02] PostgreSQL está acessível
[2025-11-07 15:00:02] =========================================
[2025-11-07 15:00:02] ATENÇÃO: RESTAURAÇÃO DE BANCO DE DADOS
[2025-11-07 15:00:02] =========================================
[2025-11-07 15:00:02] Origem: /var/backups/doctorq/database/doctorq_full_20251107_143000.sql.gz
[2025-11-07 15:00:02] Destino: 10.11.2.81:5432/dbdoctorq
[2025-11-07 15:00:02]
[2025-11-07 15:00:02] ⚠️  ESTA OPERAÇÃO IRÁ:
[2025-11-07 15:00:02]    - Desconectar todos os usuários do banco
[2025-11-07 15:00:02]    - Apagar todos os dados existentes
[2025-11-07 15:00:02]    - Restaurar os dados do backup
[2025-11-07 15:00:02]
[2025-11-07 15:00:02] Esta ação NÃO PODE SER DESFEITA!
[2025-11-07 15:00:02]
Tem certeza que deseja continuar? (digite 'SIM' para confirmar): SIM
[2025-11-07 15:00:10] Confirmação recebida. Iniciando restauração...
[2025-11-07 15:00:11] Criando backup de segurança antes da restauração: /tmp/doctorq_pre_restore_backup_20251107_150011.sql.gz
[2025-11-07 15:05:30] Terminando conexões ativas no banco 'doctorq'...
[2025-11-07 15:05:31] Conexões terminadas
[2025-11-07 15:05:31] Removendo banco de dados existente...
[2025-11-07 15:05:33] Criando novo banco de dados...
[2025-11-07 15:05:34] Banco de dados criado com sucesso
[2025-11-07 15:05:34] Iniciando restauração do backup...
[2025-11-07 15:05:34] Arquivo: /var/backups/doctorq/database/doctorq_full_20251107_143000.sql.gz
[2025-11-07 15:05:34] Este processo pode levar vários minutos...
[2025-11-07 15:20:15] ✓ Restauração concluída com sucesso!
[2025-11-07 15:20:16] Verificando integridade do banco restaurado...
[2025-11-07 15:20:17] Tabelas encontradas: 106
[2025-11-07 15:20:17] ✓ Banco de dados restaurado contém 106 tabelas
[2025-11-07 15:20:18] =========================================
[2025-11-07 15:20:18] ✓ RESTAURAÇÃO CONCLUÍDA COM SUCESSO
[2025-11-07 15:20:18] =========================================
[2025-11-07 15:20:18] Log completo: /tmp/doctorq_restore_20251107_150000.log
```

## 📍 Upload para S3/MinIO

### Configurar AWS CLI

```bash
# Instalar AWS CLI
sudo apt-get install awscli

# Configurar credenciais
aws configure
# AWS Access Key ID: your_access_key
# AWS Secret Access Key: your_secret_key
# Default region name: us-east-1
# Default output format: json

# Testar acesso
aws s3 ls s3://doctorq-backups/
```

### Configurar MinIO Client (alternativa)

```bash
# Instalar MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configurar alias
mc alias set minio https://minio.doctorq.app access_key secret_key

# Testar acesso
mc ls minio/doctorq-backups/
```

### Classe de Armazenamento S3 Glacier

Backups mais antigos são movidos automaticamente para **S3 Glacier** para reduzir custos:

- **Standard**: Últimos 7 dias (acesso imediato)
- **Glacier**: 8-30 dias (recuperação em ~4 horas)
- **Deep Archive**: > 30 dias (recuperação em ~12 horas)

**Recuperar backup do Glacier:**

```bash
# Solicitar restauração
aws s3api restore-object \
  --bucket doctorq-backups \
  --key doctorq/database/2025-10-01/doctorq_full_20251001_020000.sql.gz \
  --restore-request Days=1,GlacierJobParameters={Tier=Expedited}

# Aguardar 1-5 minutos (Expedited) ou 3-5 horas (Standard)

# Download após restauração
aws s3 cp s3://doctorq-backups/doctorq/database/2025-10-01/doctorq_full_20251001_020000.sql.gz ./
```

## 🔔 Notificações

### Slack

1. Criar Incoming Webhook no Slack:
   - Workspace → Apps → Incoming Webhooks → Add New Webhook
   - Copiar URL: `https://hooks.slack.com/services/XXX/YYY/ZZZ`

2. Configurar variável de ambiente:
   ```bash
   export WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
   ```

3. Testar notificação:
   ```bash
   curl -X POST "$WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"text":"Teste de notificação de backup DoctorQ"}'
   ```

### Email

Configurar `MAILTO` em `/etc/cron.d/doctorq-backup`:

```bash
MAILTO=devops@doctorq.app,admin@doctorq.app
```

Certifique-se de que o servidor tem um MTA configurado (postfix, sendmail, etc).

## 📊 Monitoramento

### Verificar Logs de Backup

```bash
# Logs mais recentes
ls -lt /var/backups/doctorq/database/backup_*.log | head -5

# Ver log específico
cat /var/backups/doctorq/database/backup_20251107_020000.log

# Acompanhar backup em tempo real
tail -f /var/log/syslog | grep backup
```

### Verificar Integridade

```bash
# Verificar checksum MD5
cd /var/backups/doctorq/database/
md5sum -c doctorq_full_20251107_143000.sql.gz.md5

# Listar backups com tamanhos
du -h /var/backups/doctorq/database/*.sql.gz | sort -h
```

### Testar Restauração (Dry Run)

```bash
# Criar banco de testes
createdb -h localhost -U postgres doctorq_test

# Restaurar para banco de testes
pg_restore \
  -h localhost -U postgres -d dbdoctorq_test \
  --verbose \
  /var/backups/doctorq/database/doctorq_full_20251107_143000.sql.gz

# Verificar tabelas
psql -h localhost -U postgres -d dbdoctorq_test -c "\dt"

# Remover banco de testes
dropdb -h localhost -U postgres doctorq_test
```

## 🔒 Segurança

### Criptografia em Trânsito

- Backups são enviados para S3 via HTTPS (TLS 1.2+)

### Criptografia em Repouso

S3 Glacier suporta criptografia server-side:

```bash
# Upload com criptografia
aws s3 cp backup.sql.gz s3://doctorq-backups/... \
  --server-side-encryption AES256
```

### Permissões de Arquivos

```bash
# Backups devem ter permissões restritas
chmod 600 /var/backups/doctorq/database/*.sql.gz
chown postgres:postgres /var/backups/doctorq/database/*.sql.gz
```

### Proteção do .env.backup

```bash
chmod 600 .env.backup
# NUNCA comitar .env.backup no git!
echo ".env.backup" >> .gitignore
```

## 🆘 Troubleshooting

### Erro: "pg_dump: command not found"

```bash
# Instalar cliente PostgreSQL
sudo apt-get install postgresql-client
```

### Erro: "Permission denied"

```bash
# Dar permissões corretas
sudo chown -R postgres:postgres /var/backups/doctorq
sudo chmod 755 /var/backups/doctorq/database
```

### Erro: "S3 upload failed"

```bash
# Verificar credenciais AWS
aws sts get-caller-identity

# Verificar permissões do bucket
aws s3api get-bucket-acl --bucket doctorq-backups
```

### Backup demora muito

- Considere usar backup incremental entre backups completos
- Verifique performance do disco (I/O)
- Ajuste nível de compressão (9 → 6)

## 📚 Recursos Adicionais

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Glacier](https://aws.amazon.com/s3/storage-classes/glacier/)
- [PostgreSQL WAL Archiving](https://www.postgresql.org/docs/current/continuous-archiving.html)

---

**Implementado em:** 07/11/2025
**UC:** UC125 - Backup e Restauração (Disaster Recovery)
**Versão:** 1.0.0
