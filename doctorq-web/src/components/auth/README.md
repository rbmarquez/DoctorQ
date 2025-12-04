# Componentes de Autenticação e Autorização

Sistema de controle de acesso em dois níveis para o EstetiQ.

## Visão Geral

O sistema de permissões possui dois níveis de controle:

- **Nível 1 (Grupos)**: Controla acesso às áreas do sistema (`/admin`, `/clinica`, `/profissional`, `/paciente`, `/fornecedor`)
- **Nível 2 (Funcionalidades)**: Controla ações específicas dentro de cada área (visualizar, criar, editar, excluir, etc.)

## Componentes Disponíveis

### 1. ProtectedRoute

Protege rotas inteiras com base no grupo de acesso (Nível 1).

**Uso em Layouts:**

```tsx
// app/(dashboard)/admin/layout.tsx
import { ProtectedRoute } from '@/components/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredGroup="admin">
      <div className="admin-layout">
        <AdminSidebar />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
```

**Uso em Páginas:**

```tsx
// app/(dashboard)/clinica/page.tsx
import { ProtectedRoute } from '@/components/auth';

export default function ClinicaDashboard() {
  return (
    <ProtectedRoute requiredGroup="clinica">
      <h1>Dashboard da Clínica</h1>
      <ClinicaContent />
    </ProtectedRoute>
  );
}
```

**Com Redirecionamento Customizado:**

```tsx
<ProtectedRoute
  requiredGroup="profissional"
  redirectTo="/login"
  showAccessDenied={false}
>
  <ProfissionalDashboard />
</ProtectedRoute>
```

**Props:**

- `requiredGroup`: Grupo necessário (`'admin' | 'clinica' | 'profissional' | 'paciente' | 'fornecedor'`)
- `redirectTo`: URL para redirecionar (opcional)
- `showAccessDenied`: Mostrar página de acesso negado ou redirecionar (default: `true`)

---

### 2. ProtectedAction

Protege ações específicas com base em permissões detalhadas (Nível 2).

**Ocultar Botão se Sem Permissão:**

```tsx
import { ProtectedAction } from '@/components/auth';

function AgendaPage() {
  return (
    <div>
      <h1>Agenda</h1>

      {/* Só mostra botão se pode criar agendamentos */}
      <ProtectedAction grupo="clinica" recurso="agenda" acao="criar">
        <Button onClick={handleCreate}>
          Novo Agendamento
        </Button>
      </ProtectedAction>
    </div>
  );
}
```

**Desabilitar Botão ao Invés de Ocultar:**

```tsx
<ProtectedAction
  grupo="clinica"
  recurso="pacientes"
  acao="excluir"
  showDisabled={true}
  disabledMessage="Você não tem permissão para excluir pacientes"
>
  <Button variant="destructive">
    Excluir
  </Button>
</ProtectedAction>
```

**Com Fallback Customizado:**

```tsx
<ProtectedAction
  grupo="admin"
  recurso="usuarios"
  acao="editar"
  fallback={
    <Button disabled variant="outline">
      Editar (Sem permissão)
    </Button>
  }
>
  <Button>
    Editar Usuário
  </Button>
</ProtectedAction>
```

**Props:**

- `grupo`: Grupo de acesso
- `recurso`: Nome do recurso (`'agenda' | 'pacientes' | 'usuarios' | ...`)
- `acao`: Ação a verificar (`'visualizar' | 'criar' | 'editar' | 'excluir' | 'exportar' | 'executar'`)
- `showDisabled`: Mostrar desabilitado ao invés de ocultar (default: `false`)
- `disabledMessage`: Mensagem do tooltip quando desabilitado
- `disabledClassName`: Classes CSS customizadas quando desabilitado
- `fallback`: Elemento alternativo quando sem permissão

---

### 3. ProtectedMultipleActions

Protege com base em múltiplas permissões.

**Exigir Todas as Permissões:**

```tsx
import { ProtectedMultipleActions } from '@/components/auth';

function AgendaManagement() {
  return (
    <ProtectedMultipleActions
      checks={[
        ['clinica', 'agenda', 'criar'],
        ['clinica', 'agenda', 'editar'],
        ['clinica', 'agenda', 'excluir'],
      ]}
      requireAll={true}
    >
      <FullAgendaEditor />
    </ProtectedMultipleActions>
  );
}
```

**Exigir Pelo Menos Uma Permissão:**

```tsx
<ProtectedMultipleActions
  checks={[
    ['clinica', 'agenda', 'criar'],
    ['clinica', 'agenda', 'editar'],
  ]}
  requireAll={false} // Basta ter UMA das permissões
>
  <AgendaActions />
</ProtectedMultipleActions>
```

**Props:**

- `checks`: Array de tuplas `[grupo, recurso, acao]`
- `requireAll`: Se `true`, exige todas. Se `false`, basta uma (default: `true`)
- `fallback`: Elemento alternativo quando sem permissão

---

## Hooks Disponíveis

### 1. usePermissions

Hook principal para verificar permissões.

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const {
    permissions,
    hasGroupAccess,
    hasPermission,
    isAdmin,
    getAccessibleGroups,
    getGroupResources,
    getResourceActions,
    isLoading,
    error,
  } = usePermissions();

  // Verificar acesso a grupo
  if (hasGroupAccess('admin')) {
    // Usuário pode acessar /admin
  }

  // Verificar permissão específica
  if (hasPermission('clinica', 'agenda', 'criar')) {
    // Usuário pode criar agendamentos
  }

  // Verificar se é admin
  if (isAdmin()) {
    // Admin tem acesso total
  }

  // Obter grupos acessíveis
  const grupos = getAccessibleGroups();
  // ['admin', 'clinica']

  // Obter recursos de um grupo
  const recursos = getGroupResources('clinica');
  // ['agenda', 'pacientes', 'procedimentos']

  // Obter ações de um recurso
  const acoes = getResourceActions('clinica', 'agenda');
  // ['visualizar', 'criar', 'editar']
}
```

---

### 2. useGroupAccess

Hook simplificado para verificar acesso a grupo.

```tsx
import { useGroupAccess } from '@/hooks/usePermissions';

function Sidebar() {
  const hasAdminAccess = useGroupAccess('admin');
  const hasClinicaAccess = useGroupAccess('clinica');

  return (
    <nav>
      {hasAdminAccess && <Link href="/admin">Admin</Link>}
      {hasClinicaAccess && <Link href="/clinica">Clínica</Link>}
    </nav>
  );
}
```

---

### 3. usePermission

Hook simplificado para verificar permissão específica.

```tsx
import { usePermission } from '@/hooks/usePermissions';

function AgendaToolbar() {
  const canCreate = usePermission('clinica', 'agenda', 'criar');
  const canEdit = usePermission('clinica', 'agenda', 'editar');
  const canDelete = usePermission('clinica', 'agenda', 'excluir');

  return (
    <div>
      {canCreate && <Button>Criar</Button>}
      {canEdit && <Button>Editar</Button>}
      {canDelete && <Button variant="destructive">Excluir</Button>}
    </div>
  );
}
```

---

### 4. useActionPermission

Hook helper para uso direto em componentes.

```tsx
import { useActionPermission } from '@/components/auth';

function PacienteActions({ paciente }) {
  const canEdit = useActionPermission('clinica', 'pacientes', 'editar');
  const canDelete = useActionPermission('clinica', 'pacientes', 'excluir');

  return (
    <DropdownMenu>
      {canEdit && <DropdownMenuItem>Editar</DropdownMenuItem>}
      {canDelete && <DropdownMenuItem>Excluir</DropdownMenuItem>}
    </DropdownMenu>
  );
}
```

---

## Exemplos Práticos

### Proteger Área Admin Completa

```tsx
// app/(dashboard)/admin/layout.tsx
import { ProtectedRoute } from '@/components/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredGroup="admin">
      {children}
    </ProtectedRoute>
  );
}
```

### Controlar Botões de Ação

```tsx
// components/AgendaTable.tsx
import { ProtectedAction } from '@/components/auth';

export function AgendaTable() {
  return (
    <div>
      <ProtectedAction grupo="clinica" recurso="agenda" acao="criar">
        <Button onClick={handleCreate}>Novo</Button>
      </ProtectedAction>

      {agendamentos.map((agenda) => (
        <div key={agenda.id}>
          <span>{agenda.titulo}</span>

          <ProtectedAction grupo="clinica" recurso="agenda" acao="editar">
            <Button onClick={() => handleEdit(agenda)}>Editar</Button>
          </ProtectedAction>

          <ProtectedAction grupo="clinica" recurso="agenda" acao="excluir">
            <Button variant="destructive" onClick={() => handleDelete(agenda)}>
              Excluir
            </Button>
          </ProtectedAction>
        </div>
      ))}
    </div>
  );
}
```

### Menu Dinâmico Baseado em Permissões

```tsx
// components/Sidebar.tsx
import { useGroupAccess } from '@/hooks/usePermissions';

export function Sidebar() {
  const hasAdminAccess = useGroupAccess('admin');
  const hasClinicaAccess = useGroupAccess('clinica');
  const hasProfissionalAccess = useGroupAccess('profissional');
  const hasPacienteAccess = useGroupAccess('paciente');

  return (
    <nav>
      {hasAdminAccess && (
        <NavItem href="/admin" icon={Shield}>
          Administração
        </NavItem>
      )}

      {hasClinicaAccess && (
        <NavItem href="/clinica" icon={Building2}>
          Clínica
        </NavItem>
      )}

      {hasProfissionalAccess && (
        <NavItem href="/profissional" icon={UserCog}>
          Profissional
        </NavItem>
      )}

      {hasPacienteAccess && (
        <NavItem href="/paciente" icon={User}>
          Paciente
        </NavItem>
      )}
    </nav>
  );
}
```

### Lógica Condicional com Permissões

```tsx
// pages/clinica/equipe/page.tsx
import { usePermissions } from '@/hooks/usePermissions';

export default function EquipePage() {
  const { hasPermission, getResourceActions } = usePermissions();

  const canManageTeam = hasPermission('clinica', 'equipe', 'editar');
  const actions = getResourceActions('clinica', 'equipe');

  return (
    <div>
      <h1>Equipe</h1>

      {canManageTeam ? (
        <TeamEditor actions={actions} />
      ) : (
        <TeamViewOnly />
      )}
    </div>
  );
}
```

---

## Estrutura de Permissões

### Grupos Disponíveis

- `admin` - Área administrativa
- `clinica` - Área da clínica
- `profissional` - Área do profissional
- `paciente` - Portal do paciente
- `fornecedor` - Portal do fornecedor

### Ações Disponíveis

- `visualizar` - Pode visualizar o recurso
- `criar` - Pode criar novos registros
- `editar` - Pode editar registros existentes
- `excluir` - Pode excluir registros
- `exportar` - Pode exportar dados (relatórios)
- `executar` - Pode executar ações (agentes, tools)
- `cancelar` - Pode cancelar (agendamentos)
- `upload` - Pode fazer upload (fotos, arquivos)

### Recursos por Grupo

**Admin:**
- `dashboard`, `usuarios`, `empresas`, `perfis`, `agentes`, `conversas`, `analytics`, `configuracoes`, `tools`

**Clínica:**
- `dashboard`, `agenda`, `pacientes`, `profissionais`, `procedimentos`, `financeiro`, `relatorios`, `configuracoes`, `equipe`, `perfis`

**Profissional:**
- `dashboard`, `agenda`, `relatorios`, `procedimentos`, `pacientes`

**Paciente:**
- `dashboard`, `agendamentos`, `avaliacoes`, `financeiro`, `fotos`, `mensagens`, `favoritos`, `pedidos`, `perfil`

**Fornecedor:**
- `dashboard`, `produtos`, `pedidos`, `financeiro`, `relatorios`, `perfil`

---

## Fluxo de Dados

1. Usuário faz login ’ `id_user` armazenado em sessão
2. Frontend chama `/permissions/users/{id_user}/permissions`
3. Backend busca perfil do usuário em `tb_perfis`
4. Retorna `grupos_acesso` (Nível 1) e `permissoes_detalhadas` (Nível 2)
5. Frontend armazena no SWR com cache de 1 minuto
6. Componentes usam hooks para verificar permissões
7. UI é renderizada/ocultada dinamicamente

---

## Boas Práticas

1. **Sempre proteger rotas no layout:** Use `ProtectedRoute` no layout de cada grupo
2. **Granularidade nas ações:** Use `ProtectedAction` para botões e links
3. **Loading states:** Componentes já tratam estados de loading
4. **Cache eficiente:** SWR cacheia permissões por 1 minuto
5. **Verificação no backend:** SEMPRE verificar permissões no backend também
6. **Mensagens claras:** Use `disabledMessage` para explicar por que não tem acesso

---

## Documentação Completa

Para detalhes técnicos completos, consulte:
- `/DOC_Arquitetura/SISTEMA_PERMISSOES_DOIS_NIVEIS.md`
