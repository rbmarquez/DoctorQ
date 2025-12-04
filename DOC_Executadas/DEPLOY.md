# 🚀 Guia de Deploy - DoctorQ

## 📋 Resumo das Correções Realizadas

### ✅ Problemas Resolvidos:

1. **Erro de tipo em `parceiros/page.tsx`** - Corrigido para Next.js 15 (searchParams agora é Promise)
2. **Conflitos de merge** - Verificados e já estavam resolvidos em desenvolvimento
3. **Scripts de deploy** - Criados para automatizar o processo

## 🛠️ Comandos de Deploy

### 💻 DESENVOLVIMENTO (Local)

```bash
# 1. Tornar o script executável (primeira vez)
chmod +x deploy-dev.sh

# 2. Executar o deploy para desenvolvimento
./deploy-dev.sh

# O script irá:
# - Verificar conflitos de merge
# - Testar o build
# - Fazer commit e push automático
# - Fornecer instruções para produção
```

### 📦 PRODUÇÃO (Servidor EC2)

```bash
# 1. Conectar ao servidor
ssh ec2-user@seu-servidor.amazonaws.com

# 2. Navegar para o diretório do projeto
cd /home/ec2-user/DoctorQ

# 3. Baixar o script de deploy (primeira vez)
wget https://raw.githubusercontent.com/seu-usuario/DoctorQ/master/deploy-prod.sh
chmod +x deploy-prod.sh

# 4. Executar o deploy
./deploy-prod.sh

# O script irá:
# - Criar backup automático
# - Baixar atualizações do GitHub
# - Instalar dependências
# - Fazer build de produção
# - Reiniciar aplicação com PM2
# - Rollback automático em caso de erro
```

## 🔧 Configurações Necessárias

### Arquivos de Ambiente

#### `/estetiQ-web/.env.local` (Produção)
```env
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com.br
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
NEXTAUTH_URL=https://seu-dominio.com.br
NEXTAUTH_SECRET=sua-chave-secreta
```

#### `/estetiQ-api/.env` (Se houver backend)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/doctorq
REDIS_URL=redis://localhost:6379
SECRET_KEY=sua-chave-secreta
ENVIRONMENT=production
```

## 📊 PM2 - Gerenciamento de Processos

### Comandos Úteis:

```bash
# Ver status das aplicações
pm2 list

# Ver logs em tempo real
pm2 logs doctorq-web

# Monitorar recursos (CPU/Memória)
pm2 monit

# Reiniciar aplicação
pm2 restart doctorq-web

# Recarregar sem downtime
pm2 reload doctorq-web

# Parar aplicação
pm2 stop doctorq-web

# Salvar configuração PM2
pm2 save

# Configurar auto-start no boot
pm2 startup
```

### Usar ecosystem.config.js:

```bash
# Iniciar com arquivo de configuração
pm2 start ecosystem.config.js

# Recarregar com arquivo de configuração
pm2 reload ecosystem.config.js --env production
```

## 🐛 Solução de Problemas

### Build Falha em Produção

Se o build falhar com erros de TypeScript ou ESLint:

```bash
# Build forçado (ignora erros não críticos)
NEXT_DISABLE_ESLINT=1 TSC_COMPILE_ON_ERROR=1 NODE_OPTIONS="--max-old-space-size=4096" yarn build

# Ou edite next.config.js:
```

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ... resto da configuração
}
```

### Memória Insuficiente

Se houver erro de memória durante o build:

```bash
# Aumentar limite de memória do Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
yarn build

# Ou usar swap (temporário)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Porta em Uso

Se a porta 3000 estiver em uso:

```bash
# Verificar processos na porta
sudo lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou mudar a porta
PORT=3001 yarn start
```

## 🔄 Workflow de Desenvolvimento

### 1. Desenvolvimento Local:

```bash
# Fazer alterações
code .

# Testar localmente
yarn dev

# Verificar build
yarn build

# Commit e push
./deploy-dev.sh
```

### 2. Deploy para Produção:

```bash
# No servidor de produção
./deploy-prod.sh

# Verificar logs
pm2 logs doctorq-web --lines 100

# Monitorar
pm2 monit
```

## 🔐 Segurança

### Recomendações:

1. **Nunca commitar arquivos .env**
   ```bash
   # Adicionar ao .gitignore
   echo ".env*" >> .gitignore
   ```

2. **Usar secrets do GitHub Actions** (para CI/CD)
   - Configurar em: Settings > Secrets > Actions

3. **Configurar firewall** no servidor
   ```bash
   # Apenas portas necessárias
   sudo ufw allow 22   # SSH
   sudo ufw allow 80   # HTTP
   sudo ufw allow 443  # HTTPS
   sudo ufw enable
   ```

4. **Backup regular**
   ```bash
   # Adicionar ao crontab
   0 2 * * * /home/ec2-user/backup-doctorq.sh
   ```

## 📈 Monitoramento

### Verificar saúde da aplicação:

```bash
# Endpoint de health check
curl http://localhost:3000/api/health

# Verificar uso de recursos
htop

# Verificar espaço em disco
df -h

# Verificar logs de erro
tail -f ~/.pm2/logs/doctorq-web-error.log
```

## 🆘 Suporte

Em caso de problemas:

1. Verificar logs: `pm2 logs doctorq-web`
2. Verificar status: `pm2 list`
3. Fazer rollback se necessário (backup automático)
4. Consultar documentação: `/mnt/repositorios/DoctorQ/docs/`

---

**Última atualização:** $(date)
**Versão:** 1.0.0