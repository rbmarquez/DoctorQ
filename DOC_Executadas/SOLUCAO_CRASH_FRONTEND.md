# Solução para Crash do Frontend Next.js - DoctorQ
**Data**: 02/12/2025
**Problema**: Next.js inicia, compila, mas crashacorretamente

depois de responder primeira requisição

---

## 🔍 **Diagnóstico do Problema**

### **Sintomas Observados**

1. **Frontend inicia corretamente**:
   ```
   ✓ Ready in 1363ms
   ✓ Compiled / in 8.8s (4294 modules)
   GET / 200 in 9527ms
   ```

2. **Mas crashalogo depois**:
   - Browser mostra: `net::ERR_EMPTY_RESPONSE`
   - Chunks JS não carregam: `app/page.js`, `app/global-error.js`
   - Processo Node.js morre silenciosamente

3. **Recursos do Sistema**:
   - RAM total: 31GB
   - RAM disponível: 18GB
   - **NÃO é problema de memória do sistema**

### **Causa Provável**

O Next.js 15 + React 19 está crashando após a primeira requisição por um dos seguintes motivos:

1. **Erro durante Server-Side Rendering (SSR)** de algum componente
2. **Problema com streaming de React Server Components**
3. **Erro assíncrono em middleware ou API route**
4. **Dependência circular ou import problemático**

---

## ✅ **Soluções Aplicadas**

### 1. ✅ Migration de Banco Aplicada
- Resolveu erros de backend (`tb_atendimento_items`, `tb_campanhas`)

### 2. ✅ Configuração de Imagens Corrigida
- Removido `images.domains` (deprecado)
- Migrado para `images.remotePatterns`

### 3. ✅ Memória do Node.js Aumentada
- De ~1.5GB para 4GB: `--max-old-space-size=4096`
- Script `yarn dev` atualizado

### 4. ✅ Cache Limpo
- Removido `.next/` folder

### 5. ✅ Script de Inicialização Seguro Criado
- Arquivo: [`start-dev-safe.sh`](/mnt/repositorios/DoctorQ/doctorq-web/start-dev-safe.sh)

---

## 🚀 **Como Iniciar o Frontend Corretamente**

### **Opção 1: Script Automático (Recomendado)**

```bash
cd /mnt/repositorios/DoctorQ/doctorq-web
./start-dev-safe.sh
```

**O que o script faz**:
- Mata processos anteriores
- Limpa cache `.next`
- Configura variáveis de ambiente
- Inicia Next.js com 4GB de RAM e trace de warnings

---

### **Opção 2: Manual (Passo a Passo)**

```bash
# 1. Ir para o diretório
cd /mnt/repositorios/DoctorQ/doctorq-web

# 2. Parar processos anteriores
pkill -f "next dev" || true

# 3. Limpar cache (importante!)
rm -rf .next

# 4. Iniciar servidor
yarn dev
```

**Aguarde até ver**:
```
✓ Ready in XXXms
```

Só então acesse: http://10.11.2.81:3000 ou http://localhost:3000

---

### **Opção 3: Modo Debug Completo**

Se o crash persistir, use este comando para ver logs detalhados:

```bash
cd /mnt/repositorios/DoctorQ/doctorq-web

# Parar tudo
pkill -f "next dev" || true

# Limpar cache
rm -rf .next

# Rodar com debug completo
NODE_OPTIONS='--max-old-space-size=4096 --trace-warnings --trace-uncaught' \
DEBUG='next:*' \
yarn dev 2>&1 | tee next-dev-log.txt
```

Isso salvará TODOS os logs em `next-dev-log.txt` para análise.

---

## 🔧 **Troubleshooting**

### **Se o servidor crashar imediatamente ao acessar a página**

**Problema**: Erro durante SSR de algum componente

**Solução**: Desabilitar SSR temporariamente para identificar o componente problemático

1. Edite `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  // ... outras configurações ...

  // TEMPORÁRIO - APENAS PARA DEBUG
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Forçar renderização client-side (TEMPORÁRIO)
  output: 'standalone', // Remover depois de identificar o problema
};
```

2. Em `src/app/page.tsx`, force client-side:

```typescript
"use client"; // Já existe

import { useEffect, useState } from "react";
import { EditorialLandingPage } from "@/components/portal/EditorialLandingPage";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Carregando...</div>;
  }

  return <EditorialLandingPage />;
}
```

3. Reinicie o servidor e teste.

---

### **Se aparecer erro de módulo não encontrado**

**Exemplo**: `Module not found: Can't resolve '@/components/portal/X'`

**Solução**:

```bash
# Verificar se todos os componentes existem
cd /mnt/repositorios/DoctorQ/doctorq-web
find src/components/portal -name "*.tsx" -o -name "*.ts"

# Reinstalar dependências
yarn install

# Limpar cache e reiniciar
rm -rf .next node_modules/.cache
yarn dev
```

---

### **Se o erro for no middleware**

O middleware em `src/middleware.ts` é executado a cada requisição.

**Debug do middleware**:

1. Edite `src/middleware.ts` e adicione logs:

```typescript
export async function middleware(request: NextRequest) {
  console.log('[Middleware] Request:', request.nextUrl.pathname);

  try {
    // ... código existente ...
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Erro:', error);
    return NextResponse.next(); // Permitir requisição mesmo com erro
  }
}
```

2. Reinicie e observe o terminal.

---

### **Se o erro for relacionado a NextAuth**

**Problema**: `[auth][warn][debug-enabled]` ou erro no `/api/auth/session`

**Solução**:

1. Verifique `.env.local`:

```bash
cat .env.local | grep -E "NEXTAUTH|DATABASE|GOOGLE|AZURE"
```

**Deve conter**:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-secret-key-min-32-chars
DATABASE_URL=postgresql://...
```

2. Regenerar secret se necessário:

```bash
openssl rand -base64 32
```

3. Atualizar `.env.local` e reiniciar.

---

## 📊 **Verificações Pós-Inicialização**

Após iniciar o servidor, faça estas verificações:

### 1. **Processo está rodando?**

```bash
ps aux | grep "next dev" | grep doctorq-web | grep -v grep
```

**Saída esperada**: Deve mostrar processo ativo

---

### 2. **Servidor responde na porta 3000?**

```bash
curl -I http://localhost:3000/ --max-time 5
```

**Saída esperada**: `HTTP/1.1 200 OK`

---

### 3. **Logs não mostram erros?**

No terminal onde rodou `yarn dev`, **NÃO deve aparecer**:

- ❌ `Error:...`
- ❌ `UnhandledPromiseRejectionWarning`
- ❌ `TypeError:...`
- ❌ `ECONNREFUSED`
- ❌ `Module not found`

**Deve aparecer**:

- ✅ `✓ Ready in XXXms`
- ✅ `✓ Compiled /...`
- ✅ `GET / 200 in XXXms`

---

## 🎯 **Checklist de Inicialização**

Use este checklist cada vez que for iniciar o servidor:

- [ ] 1. Backend está rodando? (`cd doctorq-api && make dev`)
- [ ] 2. Banco de dados acessível? (`psql -h 10.11.2.81 -U postgres -d dbdoctorq -c "SELECT 1"`)
- [ ] 3. `.env.local` existe e está configurado?
- [ ] 4. Cache limpo? (`rm -rf .next`)
- [ ] 5. Nenhum processo Next.js rodando? (`pkill -f "next dev"`)
- [ ] 6. Terminal aberto dedicado para logs?
- [ ] 7. `yarn dev` executado e aguardou `Ready in...`?
- [ ] 8. Acessou http://localhost:3000 **depois** de compilar?

---

## 💡 **Dicas de Desenvolvimento**

### **Use Terminais Separados**

**Terminal 1 - Backend**:
```bash
cd /mnt/repositorios/DoctorQ/doctorq-api
make dev
```

**Terminal 2 - Frontend**:
```bash
cd /mnt/repositorios/DoctorQ/doctorq-web
./start-dev-safe.sh
```

**Terminal 3 - Comandos**:
- Testes, build, etc.

---

### **Monitore Memória do Processo**

```bash
watch -n 5 "ps aux | grep 'next dev' | grep -v grep | awk '{print \$6/1024 \" MB\"}'"
```

---

### **Hot Reload está lento?**

Se o hot reload estiver demorando:

```bash
# Desabilitar source maps em desenvolvimento (mais rápido)
# Adicione em next.config.ts:

const nextConfig: NextConfig = {
  // ...
  productionBrowserSourceMaps: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'cheap-module-source-map'; // Mais rápido que 'eval-source-map'
    }
    return config;
  },
};
```

---

## 🆘 **Se Nada Funcionar**

### **Último Recurso: Rebuild Completo**

```bash
cd /mnt/repositorios/DoctorQ/doctorq-web

# Parar tudo
pkill -f "next dev" || true

# Remover TUDO
rm -rf .next node_modules yarn.lock

# Reinstalar do zero
yarn install

# Iniciar
yarn dev
```

**Tempo estimado**: 3-5 minutos para reinstalar node_modules

---

### **Reverter para Landing Anterior**

Se a nova `EditorialLandingPage` estiver com problema:

1. Edite `src/app/page.tsx`:

```typescript
"use client";

import { PremiumLandingPage } from "@/components/landing/PremiumLandingPage";

export default function Home() {
  return <PremiumLandingPage />;
}
```

2. Reinicie o servidor.

---

## 📝 **Logs e Debugging**

### **Capturar todos os logs**

```bash
yarn dev 2>&1 | tee -a logs/dev-$(date +%Y%m%d-%H%M%S).log
```

Salva logs em `logs/dev-YYYYMMDD-HHMMSS.log`

---

### **Analisar crash**

Se o processo crashar, procure no log por:

```bash
grep -E "(Error|Exception|Unhandled|FATAL|SIGKILL|SIGTERM)" logs/dev-*.log
```

---

## 📞 **Próximos Passos**

1. **Inicie o servidor** usando o script `./start-dev-safe.sh`
2. **Mantenha o terminal aberto** e observe os logs
3. **Acesse a aplicação** http://localhost:3000
4. **Se crashar novamente**:
   - Capture os logs do terminal
   - Identifique o último log antes do crash
   - Verifique qual rota ou componente causou
   - Aplique debug específico (instruções acima)

---

**Fim do Documento**
