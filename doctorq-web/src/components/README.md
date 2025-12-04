# 📦 Componentes - Nova Estrutura

Componentes organizados por **features** e **shared**, seguindo as melhores práticas de Feature-First Design.

---

## 📂 Estrutura

```
components-new/
├── features/        # Componentes específicos de features
│   ├── agendamento/
│   └── chat/
│
├── shared/          # Componentes compartilhados
│   ├── layout/
│   ├── feedback/
│   ├── navigation/
│   ├── forms/
│   └── data-display/
│
└── ui/              # Primitivos Shadcn/Radix (37 componentes)
```

---

## 🎨 Componentes Shared

### Layout

#### PageHeader
Cabeçalho padrão de páginas com título, descrição e ações.

```tsx
import { PageHeader } from '@/components/shared/layout';

<PageHeader
  title="Empresas"
  description="Gerencie empresas cadastradas"
  backHref="/admin/dashboard"
  action={{
    label: "Nova Empresa",
    href: "/admin/gestao/empresas/nova"
  }}
/>
```

---

### Feedback

#### LoadingState
Estado de carregamento com spinner e mensagem.

```tsx
import { LoadingState } from '@/components/shared/feedback';

<LoadingState message="Carregando dados..." size="md" />
```

#### ErrorState
Estado de erro com retry button.

```tsx
import { ErrorState } from '@/components/shared/feedback';

<ErrorState
  title="Erro ao carregar"
  error={error}
  onRetry={() => mutate()}
/>
```

#### EmptyState
Estado vazio com call-to-action.

```tsx
import { EmptyState } from '@/components/shared/feedback';

<EmptyState
  title="Nenhuma empresa encontrada"
  description="Crie sua primeira empresa"
  action={{
    label: "Nova Empresa",
    href: "/admin/gestao/empresas/nova"
  }}
/>
```

---

### Navigation

#### Pagination
Paginação completa com informações de total.

```tsx
import { Pagination } from '@/components/shared/navigation';

<Pagination
  currentPage={page}
  totalPages={meta.totalPages}
  totalItems={meta.totalItems}
  pageSize={10}
  onPageChange={setPage}
/>
```

#### Breadcrumbs
Navegação breadcrumb com ícone home.

```tsx
import { Breadcrumbs } from '@/components/shared/navigation';

<Breadcrumbs
  items={[
    { label: "Admin", href: "/admin" },
    { label: "Gestão", href: "/admin/gestao" },
    { label: "Empresas" }
  ]}
/>
```

---

### Forms

#### SearchInput
Input de busca com ícone e clear button.

```tsx
import { SearchInput } from '@/components/shared/forms';

const [search, setSearch] = useState('');

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Buscar empresas..."
/>
```

---

### Data Display

#### StatCard
Card de estatística com ícone e tendência.

```tsx
import { StatCard } from '@/components/shared/data-display';
import { Building } from 'lucide-react';

<StatCard
  title="Total de Empresas"
  value={42}
  icon={Building}
  change={12.5}
  changeLabel="vs mês anterior"
/>
```

---

## ✨ Componentes de Features

### Agendamento

#### AgendamentoCard
Card de agendamento com informações e ações.

```tsx
import { AgendamentoCard } from '@/components/features/agendamento';

<AgendamentoCard
  agendamento={agendamento}
  onCancel={handleCancel}
  onConfirm={handleConfirm}
  onReschedule={handleReschedule}
/>
```

**Props:**
- `agendamento`: Dados do agendamento
- `onCancel?`: Callback para cancelar
- `onConfirm?`: Callback para confirmar
- `onReschedule?`: Callback para reagendar
- `variant?`: 'default' | 'compact'

---

### Chat

#### ChatInterface
Interface completa de chat com histórico.

```tsx
import { ChatInterface } from '@/components/features/chat';

const [messages, setMessages] = useState<Message[]>([]);

<ChatInterface
  messages={messages}
  onSendMessage={handleSend}
  isLoading={isProcessing}
  title="Chat com IA"
/>
```

**Props:**
- `messages`: Array de mensagens
- `onSendMessage`: Callback ao enviar
- `isLoading?`: Estado de carregamento
- `placeholder?`: Placeholder do input
- `title?`: Título do chat

---

## 🎨 UI Primitivos

37 componentes Shadcn/Radix disponíveis em `@/components/ui`:

- accordion
- alert-dialog
- alert
- avatar
- badge
- button
- card
- checkbox
- collapsible
- dialog
- dropdown-menu
- hover-card
- input
- label
- navigation-menu
- pagination
- popover
- progress
- radio-group
- scroll-area
- select
- separator
- sidebar
- skeleton
- slider
- switch
- table
- tabs
- textarea
- tooltip
- theme-provider
- theme-toggle
- e mais...

---

## 📖 Guias de Uso

### Importando Componentes

**✅ CORRETO - Usar barrel exports:**
```tsx
import { PageHeader, LoadingState, ErrorState } from '@/components/shared';
import { AgendamentoCard } from '@/components/features/agendamento';
import { Button, Card } from '@/components/ui';
```

**❌ INCORRETO - Import direto:**
```tsx
import { PageHeader } from '@/components/shared/layout/PageHeader';
```

### Client vs Server Components

**Client Component** (interatividade):
```tsx
"use client";

import { useState } from 'react';
import { SearchInput } from '@/components/shared/forms';

export function SearchableList() {
  const [search, setSearch] = useState('');
  // ...
}
```

**Server Component** (apenas exibição):
```tsx
// Sem "use client"

import { PageHeader } from '@/components/shared/layout';

export default async function Page() {
  const data = await fetchData();

  return (
    <div>
      <PageHeader title="Página" />
      {/* ... */}
    </div>
  );
}
```

---

## 🔧 Convenções

### Nomenclatura
- Componentes: **PascalCase** (PageHeader, LoadingState)
- Arquivos: **PascalCase** com index.tsx (PageHeader/index.tsx)
- Props: **camelCase** com sufixo Props (PageHeaderProps)

### Estrutura de Pasta
```
ComponentName/
├── index.tsx           # Componente principal
├── ComponentName.test.tsx  # Testes (futuro)
└── styles.module.css   # Estilos (opcional)
```

### Props Interface
```tsx
export interface ComponentNameProps {
  /**
   * Descrição da prop
   */
  propName: string;

  /**
   * Prop opcional
   */
  optionalProp?: boolean;
}
```

### JSDoc
```tsx
/**
 * Descrição do componente
 *
 * @example
 * ```tsx
 * <ComponentName prop="value" />
 * ```
 */
export function ComponentName(props: ComponentNameProps) {
  // ...
}
```

---

## 📊 Estatísticas

- **Total de componentes**: 50+
- **UI Primitivos**: 37
- **Shared**: 9
- **Features**: 2
- **100% TypeScript**
- **100% documentado com JSDoc**

---

## 🚀 Próximos Passos

### Componentes Planejados

**Features:**
- [ ] GestaoCard (gestão/empresas, usuarios, perfis)
- [ ] ProdutoCard (marketplace)
- [ ] ProntuarioViewer (prontuário)
- [ ] AnalyticsChart (analytics)

**Shared:**
- [ ] DataTable (tabela avançada)
- [ ] FilterBar (barra de filtros)
- [ ] ConfirmDialog (diálogo de confirmação)

---

**Fase 2 Completa!** ✅

**Última atualização:** 29/10/2025
