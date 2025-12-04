# 📖 GUIA DE MIGRAÇÃO - FASE 1 COMPLETA

**Versão:** 1.0
**Data:** 29 de Outubro de 2025
**Status:** Em Implementação

---

## 🎯 Objetivo

Este guia ajuda desenvolvedores a migrar código da estrutura antiga para a nova arquitetura Feature-First + Server Components + DDD.

---

## 📂 Nova Estrutura

### Frontend

```
src/
├── app-new/              # Nova estrutura de rotas (coexiste com app/)
│   ├── (auth)/          # Route Group - Autenticação
│   ├── (dashboard)/     # Route Group - Áreas autenticadas
│   ├── (public)/        # Route Group - Páginas públicas
│   └── (marketplace)/   # Route Group - Marketplace
│
├── components-new/       # Novos componentes (coexiste com components/)
│   ├── features/        # Por feature (agendamento, chat, etc)
│   ├── shared/          # Compartilhados (layout, forms, etc)
│   └── ui/              # Primitivos Shadcn/Radix
│
└── lib-new/             # Nova biblioteca (coexiste com lib/)
    └── api/
        ├── client.ts            # ✅ Cliente HTTP centralizado
        ├── types.ts             # ✅ Tipos compartilhados
        └── hooks/
            ├── factory.ts       # ✅ Factory useQuery/useMutation
            ├── gestao/
            │   ├── useEmpresas.ts  # ✅ Exemplo implementado
            │   └── index.ts
            └── index.ts         # Barrel exports
```

### Backend

```
src/
├── api/v1/              # Nova API versionada
│   ├── gestao/         # Domínio: Gestão
│   ├── ia/             # Domínio: IA
│   ├── clinica/        # Domínio: Clínica
│   └── marketplace/    # Domínio: Marketplace
│
├── domain/              # Camada de domínio (DDD)
│   ├── entities/       # Entidades de negócio
│   ├── value_objects/  # Value Objects
│   ├── events/         # Domain Events
│   └── repositories/   # Interfaces de repositórios
│
├── application/         # Camada de aplicação
│   ├── use_cases/      # Use Cases (lógica de negócio)
│   ├── dto/            # Data Transfer Objects
│   └── services/       # Application Services
│
└── infrastructure/      # Camada de infraestrutura
    ├── database/       # ORM, repositories, migrations
    ├── cache/          # Redis
    ├── ai/             # LLM, embeddings, vector stores
    └── external/       # Payment, shipping, etc
```

---

## 🔧 Configuração Aplicada

### TypeScript Paths (tsconfig.json)

✅ **Configurado com suporte a estruturas paralelas:**

```json
{
  "compilerOptions": {
    "paths": {
      "@/app/*": ["./src/app/*", "./src/app-new/*"],
      "@/components/*": ["./src/components/*", "./src/components-new/*"],
      "@/lib/*": ["./src/lib/*", "./src/lib-new/*"]
    }
  }
}
```

**Como funciona:**
- Imports de `@/lib/api/hooks` buscam primeiro em `lib-new/`, depois em `lib/`
- Permite coexistência e migração gradual

---

## 🪝 Usando o Factory de Hooks

### 1. Hook de Listagem (useQuery)

**ANTES (inconsistente):**
```typescript
// lib/api/hooks/useEmpresas.ts
import useSWR from 'swr';

export function useEmpresas(filtros) {
  const { data, error, isLoading } = useSWR(key, fetcher);
  return {
    empresas: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}
```

**DEPOIS (padronizado):**
```typescript
// lib-new/api/hooks/gestao/useEmpresas.ts
import { useQuery } from '../factory';

export function useEmpresas(filtros: EmpresasFiltros = {}) {
  return useQuery<Empresa, EmpresasFiltros>({
    endpoint: '/empresas/',
    params: { page: 1, size: 10, ...filtros },
  });
}
```

**Uso em componente:**
```typescript
import { useEmpresas } from '@/lib/api/hooks';

export function EmpresasPage() {
  const { data: empresas, meta, isLoading, error } = useEmpresas({
    page: 1,
    size: 10,
    busca: 'termo',
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      {empresas.map(empresa => (
        <EmpresaCard key={empresa.id_empresa} empresa={empresa} />
      ))}
      <Pagination
        current={meta.currentPage}
        total={meta.totalPages}
      />
    </div>
  );
}
```

### 2. Hook de Item Único (useQuerySingle)

```typescript
import { useQuerySingle } from '../factory';

export function useEmpresa(id: string | undefined) {
  return useQuerySingle<Empresa>({
    endpoint: id ? `/empresas/${id}` : '',
    enabled: !!id,
  });
}

// Uso
const { data: empresa, isLoading } = useEmpresa(empresaId);
```

### 3. Hook de Mutation (useMutation)

```typescript
import { useMutation } from '../factory';

export function useCreateEmpresa() {
  return useMutation<Empresa, CreateEmpresaDto>({
    method: 'POST',
    endpoint: '/empresas/',
  });
}

// Uso
const { trigger: criarEmpresa, isMutating, error } = useCreateEmpresa();

const handleSubmit = async (data: CreateEmpresaDto) => {
  try {
    const empresa = await criarEmpresa(data);
    toast.success('Empresa criada!');
    router.push(`/admin/gestao/empresas/${empresa.id_empresa}`);
  } catch (error) {
    toast.error('Erro ao criar empresa');
  }
};
```

---

## 📄 Migrando Páginas para Server Components

### Passo 1: Identificar se pode ser Server Component

**✅ Pode ser Server Component se:**
- Apenas exibe dados (sem useState, useEffect)
- Não tem interatividade complexa
- Não usa hooks de browser (localStorage, etc)

**❌ Deve ser Client Component se:**
- Usa useState, useEffect, useContext
- Tem forms complexos com validação
- Usa WebSocket, EventSource
- Precisa de eventos de browser (onClick, onChange)

### Passo 2: Migrar Fetch para Servidor

**ANTES (Client Component):**
```typescript
// app/admin/empresas/page.tsx
"use client";

import { useEmpresas } from '@/lib/api/hooks/useEmpresas';

export default function EmpresasPage() {
  const { empresas, isLoading } = useEmpresas();

  if (isLoading) return <LoadingState />;

  return <EmpresasList empresas={empresas} />;
}
```

**DEPOIS (Server Component):**
```typescript
// app-new/(dashboard)/admin/gestao/empresas/page.tsx
// Sem "use client"!

import { getEmpresas } from '@/lib/api/server';
import { EmpresasList } from './_components/EmpresasList';
import { PageHeader } from '@/components/shared/layout/PageHeader';

export default async function EmpresasPage() {
  // ✅ Fetch no servidor
  const empresas = await getEmpresas({ page: 1, size: 10 });

  return (
    <div className="p-8">
      <PageHeader
        title="Empresas"
        description="Gerencie empresas cadastradas"
        action={{ label: "Nova Empresa", href: "/admin/gestao/empresas/nova" }}
      />

      {/* Client Component isolado */}
      <EmpresasList empresas={empresas} />
    </div>
  );
}
```

### Passo 3: Extrair Interatividade para _components/

```typescript
// app-new/(dashboard)/admin/gestao/empresas/_components/EmpresasList.tsx
"use client"; // ✅ Client apenas onde necessário

import { useState } from 'react';
import { EmpresaCard } from '@/components/features/gestao/EmpresaCard';

interface EmpresasListProps {
  empresas: Empresa[];
}

export function EmpresasList({ empresas: initialEmpresas }: EmpresasListProps) {
  const [search, setSearch] = useState('');

  // Filtrar localmente
  const filtered = initialEmpresas.filter(e =>
    e.nm_razao_social.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SearchInput value={search} onChange={setSearch} />

      <div className="grid grid-cols-3 gap-6">
        {filtered.map(empresa => (
          <EmpresaCard key={empresa.id_empresa} empresa={empresa} />
        ))}
      </div>
    </div>
  );
}
```

---

## 🧩 Migrando Componentes

### Estrutura de Componente (Feature)

```
components-new/features/agendamento/
├── AgendamentoCard/
│   ├── index.tsx          # Componente principal
│   ├── AgendamentoCard.test.tsx
│   └── styles.module.css  # (opcional)
│
├── AgendamentoList/
│   └── index.tsx
│
└── AgendamentoFilters/
    └── index.tsx
```

### Template de Componente

```typescript
// components-new/features/agendamento/AgendamentoCard/index.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/format';
import type { Agendamento } from '@/types/api';

interface AgendamentoCardProps {
  agendamento: Agendamento;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  variant?: 'default' | 'compact';
}

/**
 * Card de agendamento com informações básicas e ações
 *
 * @example
 * ```tsx
 * <AgendamentoCard
 *   agendamento={agendamento}
 *   onCancel={handleCancel}
 *   variant="default"
 * />
 * ```
 */
export function AgendamentoCard({
  agendamento,
  onCancel,
  onReschedule,
  variant = 'default'
}: AgendamentoCardProps) {
  const { id, paciente, profissional, data, status } = agendamento;

  return (
    <Card data-variant={variant}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{paciente.nome}</h3>
          <Badge variant={getStatusVariant(status)}>
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          Profissional: {profissional.nome}
        </p>
        <p className="text-sm text-muted-foreground">
          Data: {formatDate(data)}
        </p>

        {(onReschedule || onCancel) && (
          <div className="mt-4 flex gap-2">
            {onReschedule && (
              <Button variant="outline" onClick={() => onReschedule(id)}>
                Reagendar
              </Button>
            )}
            {onCancel && (
              <Button variant="destructive" onClick={() => onCancel(id)}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: string) {
  const variants = {
    'confirmado': 'success',
    'pendente': 'warning',
    'cancelado': 'destructive',
  };
  return variants[status] || 'default';
}
```

### Barrel Export

```typescript
// components-new/features/agendamento/index.ts
export * from './AgendamentoCard';
export * from './AgendamentoList';
export * from './AgendamentoFilters';
```

---

## ✅ Checklist de Migração

### Migrar Hook de API

- [ ] Criar arquivo em `lib-new/api/hooks/dominio/useEntidade.ts`
- [ ] Usar factory `useQuery`, `useQuerySingle` ou `useMutation`
- [ ] Adicionar tipos TypeScript (params, response)
- [ ] Adicionar JSDoc com exemplos
- [ ] Exportar em `lib-new/api/hooks/dominio/index.ts`
- [ ] Testar em componente
- [ ] Deprecar hook antigo (console.warn)

### Migrar Componente

- [ ] Criar pasta em `components-new/features/feature/ComponentName/`
- [ ] Mover lógica para `index.tsx`
- [ ] Adicionar props interface com JSDoc
- [ ] Separar lógica de apresentação
- [ ] Adicionar testes
- [ ] Exportar em `components-new/features/feature/index.ts`
- [ ] Atualizar imports em páginas

### Migrar Página

- [ ] Identificar se pode ser Server Component
- [ ] Criar em `app-new/(group)/area/feature/page.tsx`
- [ ] Implementar fetch no servidor (se possível)
- [ ] Extrair interatividade para `_components/`
- [ ] Adicionar PageHeader, ErrorBoundary
- [ ] Testar loading e error states
- [ ] Validar SEO (meta tags)
- [ ] Verificar Lighthouse score

---

## 🧪 Testando

### Testar Compilação

```bash
cd estetiQ-web
yarn build
```

**Deve compilar sem erros.**

### Testar Hook Novo

```typescript
// Criar componente de teste temporário
import { useEmpresas } from '@/lib/api/hooks';

export function TesteHook() {
  const { data, isLoading, error } = useEmpresas();

  console.log('Hook funcionando:', { data, isLoading, error });

  return <div>Teste OK</div>;
}
```

### Testar Server Component

```bash
yarn dev
# Acessar página no browser
# Verificar:
# - Dados carregam
# - Sem erro no console
# - Network tab: request do servidor
```

---

## 🐛 Troubleshooting

### Erro: "Module not found"

**Causa:** Paths do TypeScript não configurados.

**Solução:**
```bash
# Verificar tsconfig.json
cat tsconfig.json | grep -A 10 "paths"

# Deve conter:
# "@/lib/*": ["./src/lib/*", "./src/lib-new/*"]
```

### Erro: "Cannot use import statement outside a module"

**Causa:** Arquivo sem extensão `.ts` ou `.tsx`.

**Solução:** Renomear para `.ts` ou `.tsx`.

### Warning: "use client" missing

**Causa:** Componente usa hooks mas não tem `"use client"`.

**Solução:**
```typescript
// Adicionar no topo do arquivo
"use client";

import { useState } from 'react';
// ...
```

### Hook não retorna dados

**Causa:** Endpoint errado ou API não rodando.

**Solução:**
```bash
# Verificar API está rodando
curl http://localhost:8080/empresas/

# Verificar endpoint no hook
# Deve incluir trailing slash: '/empresas/' não '/empresas'
```

---

## 📚 Recursos Adicionais

### Documentação de Referência

- [Proposta Completa de Reestruturação](./PROPOSTA_REESTRUTURACAO.md)
- [Mapeamento de Rotas Frontend](./MAPEAMENTO_ROTAS_FRONTEND.md)
- [Documentação de Arquitetura](./DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)

### Links Externos

- [Next.js 15 - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js 15 - Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [SWR Documentation](https://swr.vercel.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎯 Próximos Passos

### Esta Semana
1. ✅ Fase 1 completada (estrutura + factory)
2. ⏳ Migrar 5 componentes prioritários
3. ⏳ Migrar 3 hooks mais usados

### Próxima Semana
- Iniciar Fase 2 (Componentes UI)
- Migrar 20 componentes

---

**Dúvidas?**
- Slack: #refactor-architecture
- Email: arquitetura@doctorq.com
- Issues: GitHub com label `refactor`

**Última atualização:** 29/10/2025
