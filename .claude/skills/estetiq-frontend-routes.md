# DoctorQ Frontend Routes Skill

## Descrição
Esta skill verifica e documenta as rotas do frontend (páginas Next.js), garantindo que o mapeamento de rotas está atualizado.

## Quando Usar
- Após adicionar novas páginas no frontend
- Para auditoria da estrutura de páginas
- Antes de releases
- Ao revisar PRs que adicionam/modificam páginas

## Instruções

Você é um assistente especializado em mapear e documentar rotas do frontend DoctorQ. Sua função é:

### 1. Descobrir Páginas Implementadas

**Varrer diretório do App Router**:
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-web

# Encontrar todos os arquivos page.tsx (páginas)
find src/app -name "page.tsx" -type f

# Encontrar layouts
find src/app -name "layout.tsx" -type f

# Encontrar route handlers (API routes)
find src/app -name "route.ts" -type f
```

**Estrutura do Next.js 15 App Router**:
- `page.tsx` = Página renderizada
- `layout.tsx` = Layout compartilhado
- `route.ts` = API route handler
- `loading.tsx` = Loading UI
- `error.tsx` = Error boundary
- `not-found.tsx` = 404 page

### 2. Mapear Rotas

**Converter caminho de arquivo para URL**:

```
src/app/page.tsx → /
src/app/login/page.tsx → /login
src/app/admin/dashboard/page.tsx → /admin/dashboard
src/app/paciente/[id]/page.tsx → /paciente/[id] (dynamic route)
src/app/(auth)/login/page.tsx → /login (route group, não afeta URL)
```

**Identificar tipos de rotas**:
- **Estáticas**: `/about`, `/pricing`
- **Dinâmicas**: `/profissional/[id]`, `/blog/[slug]`
- **Catch-all**: `/docs/[...slug]`
- **Parallel**: `@modal/page.tsx`
- **Intercepting**: `(..)modal/page.tsx`

### 3. Atualizar Documentação de Rotas

**Arquivo**: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/MAPEAMENTO_ROTAS_FRONTEND.md`

**Template de documentação por página**:

```markdown
### `/caminho/da/rota`

**Arquivo**: `src/app/caminho/da/rota/page.tsx`
**Tipo**: Pública | Autenticada | Admin
**Layout**: Default | Auth | Dashboard
**Descrição**: Descrição clara da página

**Funcionalidades**:
- Funcionalidade 1
- Funcionalidade 2

**Componentes Principais**:
- [NomeComponente](src/components/caminho/NomeComponente.tsx)
- [OutroComponente](src/components/caminho/OutroComponente.tsx)

**Hooks de API Utilizados**:
- `useEmpresas()` - [useEmpresas.ts](src/lib/api/hooks/useEmpresas.ts)
- `useUsuarios()` - [useUsuarios.ts](src/lib/api/hooks/useUsuarios.ts)

**Endpoints Backend**:
- `GET /empresas/` - Lista empresas
- `POST /empresas/` - Cria empresa

**Permissões Necessárias**:
- Role: admin, gestor_clinica
- Auth: JWT obrigatório

**Metadata (SEO)**:
```typescript
export const metadata = {
  title: "Título da Página",
  description: "Descrição para SEO"
}
```

**Screenshots**: (opcional)
- Link para screenshot ou mockup
```

### 4. Organizar por Seção

**Estrutura de navegação do DoctorQ**:

**1. Rotas Públicas (Unauthenticated)**:
- Landing page: `/`
- Marketing: `/blog`, `/sobre`, `/contato`
- Busca pública: `/busca`, `/profissionais`, `/clinicas`
- Marketplace: `/marketplace/produtos`, `/marketplace/fornecedores`

**2. Autenticação**:
- Login: `/login`
- Registro: `/registro`
- OAuth callback: `/oauth-callback`
- Recuperação de senha: `/esqueci-senha`, `/redefinir-senha`

**3. Admin Dashboard**:
- `/admin/dashboard` - Visão geral
- `/admin/empresas` - Gestão de empresas
- `/admin/usuarios` - Gestão de usuários
- `/admin/perfis` - Roles e permissões
- `/admin/agentes` - AI agents
- `/admin/analytics` - Analytics
- `/admin/billing` - Faturamento
- `/admin/marketplace` - Gestão de produtos
- `/admin/configuracoes` - Configurações

**4. Profissional Dashboard**:
- `/profissional/dashboard` - Visão geral
- `/profissional/agenda` - Calendário
- `/profissional/pacientes` - Lista de pacientes
- `/profissional/procedimentos` - Procedimentos
- `/profissional/financeiro` - Financeiro
- `/profissional/mensagens` - Chat
- `/profissional/perfil` - Perfil

**5. Paciente Portal**:
- `/paciente/dashboard` - Visão geral
- `/paciente/agendamentos` - Meus agendamentos
- `/paciente/avaliacoes` - Minhas avaliações
- `/paciente/financeiro` - Faturas
- `/paciente/fotos` - Before/after photos
- `/paciente/mensagens` - Chat
- `/paciente/favoritos` - Favoritos
- `/paciente/pedidos` - Pedidos marketplace
- `/paciente/perfil` - Perfil

**6. Chat/IA**:
- `/chat` - Assistente IA

**7. API Routes (Backend Proxy)**:
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/webhooks/stripe` - Stripe webhooks
- `/api/proxy/*` - Proxy para backend

### 5. Verificar Proteção de Rotas

**Para cada página autenticada, verificar**:

```typescript
// Deve ter proteção de autenticação
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // ... resto da página
}
```

**Ou usar middleware**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Verificar autenticação para rotas protegidas
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profissional/:path*',
    '/paciente/:path*',
  ]
}
```

### 6. Gerar Relatório de Rotas

**Template de Relatório**:

```markdown
# Mapeamento de Rotas Frontend - DoctorQ

**Data**: [Data atual]
**Versão**: v1.x
**Total de Páginas**: X

## 📊 Estatísticas

| Categoria | Quantidade |
|-----------|------------|
| Rotas Públicas | X |
| Rotas Autenticadas | Y |
| Admin | A |
| Profissional | B |
| Paciente | C |
| API Routes | D |
| **Total** | **Z** |

## 🌐 Rotas Públicas (X rotas)

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| / | src/app/page.tsx | Landing page |
| /busca | src/app/busca/page.tsx | Busca profissionais |

## 🔒 Rotas Admin (X rotas)

| Rota | Arquivo | Roles | Descrição |
|------|---------|-------|-----------|
| /admin/dashboard | src/app/admin/dashboard/page.tsx | admin | Dashboard admin |

## 👨‍⚕️ Rotas Profissional (X rotas)

| Rota | Arquivo | Roles | Descrição |
|------|---------|-------|-----------|
| /profissional/dashboard | src/app/profissional/dashboard/page.tsx | profissional | Dashboard profissional |

## 🧑‍🦱 Rotas Paciente (X rotas)

| Rota | Arquivo | Roles | Descrição |
|------|---------|-------|-----------|
| /paciente/dashboard | src/app/paciente/dashboard/page.tsx | paciente | Dashboard paciente |

## 🔧 API Routes (X rotas)

| Rota | Arquivo | Método | Descrição |
|------|---------|--------|-----------|
| /api/auth/[...nextauth] | src/app/api/auth/[...nextauth]/route.ts | ALL | NextAuth |

## ⚠️ Rotas Não Documentadas

| Rota | Arquivo | Ação |
|------|---------|------|
| /nova-rota | src/app/nova-rota/page.tsx | Adicionar à documentação |

## 📝 Recomendações

1. Documentar X novas rotas
2. Adicionar proteção de autenticação em Y rotas
3. Revisar metadata SEO de Z páginas
4. Implementar loading states faltando
```

### 7. Validar Navegação

**Verificar links de navegação**:
```bash
# Procurar por Links no código
grep -r "Link href=" src/app src/components | grep -v "node_modules"

# Procurar por redirects
grep -r "redirect(" src/app

# Procurar por useRouter
grep -r "useRouter" src/app src/components
```

**Validar**:
- [ ] Todos os links internos usam componente `<Link>` do Next.js
- [ ] Não há links quebrados
- [ ] Rotas dinâmicas estão sendo usadas corretamente
- [ ] Redirects estão configurados (ex: `/` → `/dashboard` se autenticado)

### 8. Verificar Layouts e Metadata

**Para cada layout principal**:
```typescript
// src/app/admin/layout.tsx
export const metadata = {
  title: {
    template: '%s | Admin - DoctorQ',
    default: 'Admin - DoctorQ'
  },
  description: 'Painel administrativo do DoctorQ'
}

export default function AdminLayout({ children }) {
  return (
    <div>
      <AdminSidebar />
      <main>{children}</main>
    </div>
  )
}
```

**Verificar**:
- [ ] Metadata para SEO está definida
- [ ] Layouts são reutilizados adequadamente
- [ ] Navegação está consistente

### 9. Comandos Úteis

**Listar todas as páginas**:
```bash
find src/app -name "page.tsx" | sort
```

**Contar páginas por diretório**:
```bash
find src/app -name "page.tsx" | cut -d'/' -f3 | sort | uniq -c
```

**Encontrar páginas sem loading state**:
```bash
for dir in $(find src/app -name "page.tsx" -exec dirname {} \;); do
  if [ ! -f "$dir/loading.tsx" ]; then
    echo "Missing loading: $dir"
  fi
done
```

**Procurar rotas dinâmicas**:
```bash
find src/app -type d -name "[*" -o -name "[...*"
```

## Exemplo de Uso

**Usuário**: Mapeia todas as rotas do frontend e atualiza a documentação

**Ações Esperadas**:
1. Varrer `src/app/` para encontrar todos os `page.tsx`
2. Converter caminhos de arquivos em URLs
3. Categorizar por tipo (público, admin, profissional, paciente)
4. Verificar proteção de autenticação
5. Comparar com `MAPEAMENTO_ROTAS_FRONTEND.md` existente
6. Identificar rotas não documentadas
7. Gerar relatório
8. Atualizar documentação

**Resposta Exemplo**:
```
# Mapeamento de Rotas - DoctorQ Frontend

Encontrei **242 páginas** implementadas no App Router.

## 📊 Resumo

- Rotas Públicas: 18
- Admin: 87
- Profissional: 64
- Paciente: 68
- API Routes: 5

## ⚠️ Atenção

**12 rotas novas não documentadas**:
1. /admin/licencas → Gestão de licenças partner
2. /paciente/fotos → Galeria before/after
3. /marketplace/carrinho → Carrinho de compras
...

**Recomendação**: Atualizar MAPEAMENTO_ROTAS_FRONTEND.md

Quer que eu atualize a documentação agora?
```

## Referências
- Código do frontend: `/mnt/repositorios/DoctorQ/estetiQ-web/src/app/`
- Documentação: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/MAPEAMENTO_ROTAS_FRONTEND.md`
- Next.js App Router: https://nextjs.org/docs/app
