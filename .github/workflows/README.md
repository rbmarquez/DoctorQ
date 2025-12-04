# GitHub Actions Workflows - DoctorQ

## 📋 Workflows Configurados

### 1. Deploy Frontend (`deploy.yml`)
**Triggers**:
- Push para `main`
- Execução manual via GitHub UI

**O que faz**:
- ✅ Roda testes (lint/test)
- ✅ Faz pull do código mais recente
- ✅ Limpa cache do Next.js
- ✅ Instala dependências (Yarn 4)
- ✅ Build de produção
- ✅ Reinicia apenas `doctorq-web` via PM2

**Tempo estimado**: ~3-5 minutos

---

### 2. Deploy API (`deploy-api.yml`)
**Triggers**:
- Push para `main` com mudanças em `estetiQ-api/**`
- Execução manual via GitHub UI

**O que faz**:
- ✅ Faz pull do código mais recente
- ✅ Instala dependências Python (uv sync)
- ✅ Reinicia **3 serviços de API** via PM2
- ✅ Verifica logs

**Tempo estimado**: ~1-2 minutos

---

## 🔐 Secrets Necessários

Configure em: `Settings → Secrets and variables → Actions`

| Nome | Valor | Descrição |
|------|-------|-----------|
| `EC2_HOST` | `54.160.229.38` | IP público da EC2 |
| `EC2_USER` | `ec2-user` | Usuário SSH |
| `EC2_SSH_KEY` | [chave privada] | Conteúdo de `github_actions_deploy` |

### Como obter a chave SSH:
```bash
cat /home/ec2-user/DoctorQ/github_actions_deploy
```

---

## 🚀 Como Usar

### Deploy Automático
Simplesmente faça push para `main`:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

**Frontend**: Deploy sempre que houver qualquer mudança
**API**: Deploy apenas quando houver mudanças em `estetiQ-api/`

---

## 📊 Monitoramento

### Acompanhar Deploy
Acesse: `https://github.com/rbmarquez/DoctorQ/actions`

### Verificar Status no Servidor
```bash
pm2 list
pm2 logs [nome-servico] --lines 50
```
# Test deploy Tue Nov 25 13:03:21 UTC 2025
