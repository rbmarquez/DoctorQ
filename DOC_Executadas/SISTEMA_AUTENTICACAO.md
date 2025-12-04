# Sistema de Autenticação Multi-Tipo de Usuário - DoctorQ

## 📋 Visão Geral

O sistema de autenticação foi organizado para suportar **4 tipos de usuários**, cada um com seu próprio dashboard e menu personalizado. Quando o usuário faz login, ele é automaticamente redirecionado para a tela apropriada baseada no seu tipo.

## 👥 Tipos de Usuário

### 1. **Cliente** (Paciente)
- **Email demo**: `cliente@estetiQ.com`
- **Dashboard**: `/paciente/dashboard`
- **Tema**: Rosa/Roxo (Pink/Purple)
- **Menu**: 11 itens
  - Dashboard, Agendamentos, Avaliações, Favoritos, Carrinho, Pedidos, Mensagens, Pagamentos, Notificações, Perfil, Configurações

### 2. **Profissional** (Médico/Esteta)
- **Email demo**: `profissional@estetiQ.com`
- **Dashboard**: `/profissional/dashboard`
- **Tema**: Azul/Índigo (Blue/Indigo)
- **Menu**: 13 itens
  - Dashboard, Agenda, Pacientes, Avaliações, Procedimentos, Horários, Mensagens, Financeiro, Relatórios, Certificados, Prontuários, Perfil, Configurações

### 3. **Fornecedor** (Fabricante)
- **Email demo**: `fornecedor@estetiQ.com`
- **Dashboard**: `/fornecedor/dashboard`
- **Tema**: Verde/Esmeralda (Green/Emerald)
- **Menu**: 15 itens
  - Dashboard, Produtos, Catálogo, Pedidos, Entregas, Estoque, Clientes, Avaliações, Promoções, Mensagens, Financeiro, Relatórios, Notas Fiscais, Perfil, Configurações

### 4. **Administrador** (Admin)
- **Email demo**: `admin@estetiQ.com`
- **Dashboard**: `/admin/dashboard`
- **Tema**: Vermelho/Laranja (Red/Orange)
- **Menu**: 20 itens
  - Dashboard, Usuários, Profissionais, Fornecedores, Agendamentos, Produtos, Procedimentos, Avaliações, Mensagens, Financeiro, Relatórios, Logs, Configurações, Notificações, Certificados, Planos, Cupons, Integrações, Suporte, Perfil

## 🔐 Arquivos Criados/Modificados

### Arquivos Criados

1. **`src/types/auth.ts`**
   - Define TypeScript interfaces para autenticação
   - Tipos: `User`, `UserType`

2. **`src/contexts/UserTypeContext.tsx`**
   - Context API para gerenciar estado de autenticação
   - Funções: `login()`, `logout()`
   - Mock users para demonstração
   - Persistência em localStorage

3. **`src/lib/auth-utils.ts`**
   - Helper functions para autenticação
   - `getDashboardRoute()` - retorna rota baseada no tipo
   - `getUserTypeLabel()` - retorna label amigável
   - `getUserTypeTheme()` - retorna tema de cores

4. **`src/components/layout/ClienteSidebar.tsx`**
   - Sidebar personalizado para Cliente
   - 11 menu items + quick actions

5. **`src/components/layout/ProfissionalSidebar.tsx`**
   - Sidebar personalizado para Profissional
   - 13 menu items + estatísticas rápidas

6. **`src/components/layout/FornecedorSidebar.tsx`**
   - Sidebar personalizado para Fornecedor
   - 15 menu items + estatísticas de vendas

7. **`src/components/layout/AdministradorSidebar.tsx`**
   - Sidebar personalizado para Administrador
   - 20 menu items + estatísticas do sistema

8. **`src/components/layout/AuthenticatedLayout.tsx`**
   - Layout wrapper que renderiza o sidebar correto
   - Proteção de rotas
   - Loading e estados não-autenticados

### Arquivos Modificados

1. **`src/components/providers.tsx`**
   - Adicionado `UserTypeProvider` à hierarquia

2. **`src/app/login/page.tsx`**
   - Integração com `UserTypeContext`
   - Redirecionamento automático por tipo de usuário
   - Seção de usuários demo com emails
   - Fallback para NextAuth se necessário

3. **`src/app/paciente/dashboard/page.tsx`**
   - Wrapped com `AuthenticatedLayout`

4. **`src/app/profissional/dashboard/page.tsx`**
   - Criado dashboard do profissional

5. **`src/app/fornecedor/dashboard/page.tsx`**
   - Criado dashboard do fornecedor

6. **`src/app/admin/dashboard/page.tsx`**
   - Criado dashboard do administrador

## 🚀 Como Testar

### Opção 1: Página de Login (`/login`)

1. Acesse: [http://localhost:3000/login](http://localhost:3000/login)
2. Use um dos emails de demonstração:
   - `cliente@estetiQ.com`
   - `profissional@estetiQ.com`
   - `fornecedor@estetiQ.com`
   - `admin@estetiQ.com`
3. Digite **qualquer senha** (o sistema aceita qualquer senha para contas demo)
4. Clique em "Entrar"
5. Você será redirecionado automaticamente para o dashboard correto

### Opção 2: Página Demo (`/demo`)

1. Acesse: [http://localhost:3000/demo](http://localhost:3000/demo)
2. Clique em um dos 4 cards de usuário
3. Login automático e redirecionamento instantâneo

## 🔄 Fluxo de Autenticação

```
┌─────────────────┐
│   /login        │
│  Página Login   │
└────────┬────────┘
         │
         │ 1. Usuário entra email/senha
         ▼
┌─────────────────────────┐
│  UserTypeContext.login() │
│  Valida credenciais      │
└────────┬────────────────┘
         │
         │ 2. Armazena user em state + localStorage
         ▼
┌─────────────────────────┐
│  useEffect na página     │
│  Detecta contextUser     │
└────────┬────────────────┘
         │
         │ 3. Chama getDashboardRoute(userType)
         ▼
┌─────────────────────────┐
│  router.replace()        │
│  Redireciona para dash   │
└────────┬────────────────┘
         │
         │ 4. Dashboard carrega com AuthenticatedLayout
         ▼
┌─────────────────────────┐
│  AuthenticatedLayout     │
│  Renderiza sidebar       │
│  correto para o tipo     │
└─────────────────────────┘
```

## 🎨 Temas por Tipo de Usuário

Cada tipo de usuário tem seu próprio tema visual:

| Tipo          | Cores Primárias       | Gradient                        |
|---------------|----------------------|----------------------------------|
| Cliente       | Rosa/Roxo            | `from-pink-500 to-purple-600`   |
| Profissional  | Azul/Índigo          | `from-blue-500 to-indigo-600`   |
| Fornecedor    | Verde/Esmeralda      | `from-green-500 to-emerald-600` |
| Administrador | Vermelho/Laranja     | `from-red-500 to-orange-600`    |

## 📱 Responsividade

- **Desktop**: Sidebar fixa na lateral esquerda (280px)
- **Mobile**: Sidebar overlay com botão de menu no topo
- **Tablet**: Sidebar oculta, acessível via botão

## 🔒 Proteção de Rotas

O `AuthenticatedLayout` protege automaticamente todas as páginas que o utilizam:

1. Verifica se o usuário está autenticado
2. Se não estiver, exibe mensagem "Acesso Restrito"
3. Botão para redirecionar para `/login`
4. Se estiver autenticado, renderiza o conteúdo com o sidebar correto

## 💾 Persistência

- **localStorage**: Armazena dados do usuário logado
- **Key**: `estetiQ_user`
- **Auto-restore**: Ao recarregar a página, o usuário continua logado

## 🔌 Integração com Backend

Atualmente o sistema usa **mock users** para demonstração. Para integrar com o backend real:

### 1. Atualizar `UserTypeContext.tsx`

```typescript
const login = async (email: string, password: string) => {
  setIsLoading(true);
  try {
    // Chamar API real
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciais inválidas");
    }

    const userData: User = await response.json();

    setUser(userData);
    localStorage.setItem("estetiQ_user", JSON.stringify(userData));
  } catch (error) {
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Adicionar Token JWT

```typescript
interface User {
  // ... campos existentes
  access_token?: string;
  refresh_token?: string;
}

// Armazenar tokens
localStorage.setItem("estetiQ_access_token", userData.access_token);
localStorage.setItem("estetiQ_refresh_token", userData.refresh_token);

// Usar em requests
const token = localStorage.getItem("estetiQ_access_token");
headers: {
  "Authorization": `Bearer ${token}`
}
```

### 3. Endpoint Backend Esperado

```
POST /auth/login
Body: {
  "email": "user@example.com",
  "password": "senha123"
}

Response 200: {
  "id_user": "uuid",
  "nm_completo": "Nome Completo",
  "nm_email": "user@example.com",
  "ds_tipo_usuario": "cliente" | "profissional" | "fornecedor" | "administrador",
  "ds_foto_url": "https://...",
  "nr_telefone": "11999999999",
  "st_ativo": true,
  "dt_criacao": "2024-01-01T00:00:00Z",
  "dt_ultimo_acesso": "2024-01-15T10:30:00Z",
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}

Response 401: {
  "error": "Credenciais inválidas"
}
```

## 🧪 Usuários de Demonstração

Os seguintes usuários estão disponíveis para teste (mock):

| Email                        | Tipo          | Dashboard                      |
|------------------------------|---------------|--------------------------------|
| cliente@estetiQ.com          | Cliente       | /paciente/dashboard            |
| profissional@estetiQ.com     | Profissional  | /profissional/dashboard        |
| fornecedor@estetiQ.com       | Fornecedor    | /fornecedor/dashboard          |
| admin@estetiQ.com            | Administrador | /admin/dashboard               |

**Senha**: Qualquer uma (aceita qualquer valor para demo)

## ✅ Features Implementadas

- [x] Sistema de autenticação multi-tipo
- [x] 4 sidebars personalizados por tipo de usuário
- [x] Redirecionamento automático após login
- [x] Proteção de rotas autenticadas
- [x] Persistência em localStorage
- [x] Loading states
- [x] Mock users para demonstração
- [x] Temas visuais por tipo de usuário
- [x] Responsividade mobile
- [x] Página de login com seção demo
- [x] Integração com NextAuth (fallback)

## 📝 Próximos Passos

1. ✅ **Integração com Backend Real**
   - Conectar com API de autenticação
   - Implementar tokens JWT
   - Refresh token automático

2. ⏳ **Implementar Páginas Restantes**
   - ~60+ páginas referenciadas nos menus
   - Cada rota precisa ser criada

3. ⏳ **Middleware de Autenticação**
   - Proteger rotas no Next.js middleware
   - Verificar tipo de usuário antes de renderizar

4. ⏳ **Logout Completo**
   - Limpar todos os tokens
   - Revogar sessão no backend
   - Redirecionar para login

5. ⏳ **Recuperação de Senha**
   - Fluxo de "Esqueci minha senha"
   - Email com token de recuperação

6. ⏳ **Registro de Novos Usuários**
   - Página de cadastro funcional
   - Validação de dados
   - Email de verificação

## 🐛 Troubleshooting

### Erro: "useUserType is not defined"
**Solução**: Verificar se o arquivo está importando corretamente:
```typescript
import { useUserType } from "@/contexts/UserTypeContext";
```

### Usuário não redireciona após login
**Solução**: Verificar se o `UserTypeProvider` está na hierarquia de providers em `src/components/providers.tsx`

### Sidebar não aparece
**Solução**: Verificar se a página está wrapped com `<AuthenticatedLayout>`

### LocalStorage não persiste
**Solução**: Verificar configurações do navegador para permitir localStorage

## 📚 Referências

- [UserTypeContext.tsx](src/contexts/UserTypeContext.tsx)
- [AuthenticatedLayout.tsx](src/components/layout/AuthenticatedLayout.tsx)
- [Login Page](src/app/login/page.tsx)
- [Auth Utils](src/lib/auth-utils.ts)
- [Auth Types](src/types/auth.ts)
