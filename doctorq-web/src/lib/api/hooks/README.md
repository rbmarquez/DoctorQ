# API Hooks - EstetiQ Frontend

Sistema de hooks padronizados para integração com a API backend do EstetiQ, organizado por domínios e seguindo o padrão Factory.

## Arquitetura

```
lib-new/api/hooks/
├── factory.ts          # Factory pattern (useQuery, useQuerySingle, useMutation)
├── index.ts            # Barrel export centralizado
├── gestao/             # Hooks de gestão administrativa
│   ├── useEmpresas.ts  # P0 - 10 referências
│   ├── useUsuarios.ts  # P0 - 8 referências
│   ├── usePerfis.ts    # P0 - 5 referências
│   └── index.ts
├── ia/                 # Hooks de IA e agentes
│   ├── useAgentes.ts   # P1 - 12 referências
│   ├── useConversas.ts # P1 - 15 referências
│   └── index.ts
├── clinica/            # Hooks do domínio clínico
│   ├── useAgendamentos.ts
│   └── index.ts
└── marketplace/        # Hooks de e-commerce
    ├── useProdutos.ts
    ├── useCarrinho.ts
    └── index.ts
```

## Factory Pattern

Todas as hooks utilizam três funções base do `factory.ts`:

### `useQuery<T, TParams>` - Queries Paginadas

```typescript
import { useEmpresas } from '@/lib-new/api/hooks';

function EmpresasPage() {
  const { data, meta, isLoading, error, mutate } = useEmpresas({
    page: 1,
    size: 10,
    busca: 'Clínica',
  });

  return (
    <div>
      {data.map((empresa) => (
        <div key={empresa.id_empresa}>{empresa.nm_razao_social}</div>
      ))}
      <p>Total: {meta.totalItems}</p>
    </div>
  );
}
```

**Retorno:**
- `data: T[]` - Array de itens (vazio se não houver)
- `meta` - Metadados de paginação (totalItems, totalPages, currentPage, pageSize)
- `isLoading: boolean` - Indica se está carregando
- `isError: boolean` - Indica se houve erro
- `error: Error | null` - Objeto de erro
- `mutate()` - Função para revalidar manualmente
- `isValidating: boolean` - Indica se está revalidando

### `useQuerySingle<T>` - Query de Item Único

```typescript
import { useEmpresa } from '@/lib-new/api/hooks';

function EmpresaDetalhes({ id }: { id: string }) {
  const { data: empresa, isLoading, error } = useEmpresa(id);

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error.message}</p>;

  return <div>{empresa?.nm_razao_social}</div>;
}
```

**Retorno:**
- `data: T | undefined` - Item retornado
- `isLoading: boolean`
- `isError: boolean`
- `error: Error | null`
- `mutate()`
- `isValidating: boolean`

### `useMutation<T, TData>` - Mutations (POST, PUT, DELETE)

```typescript
import { useCreateEmpresa } from '@/lib-new/api/hooks';

function CriarEmpresaForm() {
  const { trigger: criarEmpresa, isMutating, error } = useCreateEmpresa();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const empresa = await criarEmpresa({
        nm_razao_social: 'Nova Clínica',
        nr_cnpj: '12345678000100',
      });

      console.log('Empresa criada:', empresa);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={isMutating}>
        {isMutating ? 'Criando...' : 'Criar Empresa'}
      </button>
      {error && <p>Erro: {error.message}</p>}
    </form>
  );
}
```

**Retorno:**
- `trigger(data)` - Função assíncrona para executar a mutation
- `isMutating: boolean` - Indica se está executando
- `error: Error | null` - Erro da última execução

## Hooks Disponíveis

### Gestão (P0 - Alta Prioridade)

#### `useEmpresas(filtros?)`
Lista empresas com paginação e filtros.

```typescript
const { data, meta } = useEmpresas({
  page: 1,
  size: 10,
  busca: 'termo',
  plano: 'professional',
});
```

#### `useEmpresa(id)`
Busca uma empresa específica por ID.

```typescript
const { data: empresa } = useEmpresa('uuid-empresa');
```

#### `useCreateEmpresa()`
Cria nova empresa.

```typescript
const { trigger: criarEmpresa } = useCreateEmpresa();
await criarEmpresa({ nm_razao_social: '...', nr_cnpj: '...' });
```

#### `useUpdateEmpresa(id)`
Atualiza empresa existente.

```typescript
const { trigger: atualizarEmpresa } = useUpdateEmpresa('uuid-empresa');
await atualizarEmpresa({ nm_razao_social: 'Novo Nome' });
```

#### `useDeleteEmpresa(id)`
Deleta empresa.

```typescript
const { trigger: deletarEmpresa } = useDeleteEmpresa('uuid-empresa');
await deletarEmpresa();
```

---

#### `useUsuarios(filtros?)`
Lista usuários com paginação.

```typescript
const { data, meta } = useUsuarios({
  page: 1,
  size: 10,
  nm_papel: 'admin',
  id_empresa: 'uuid-empresa',
});
```

#### `useUsuario(id)`
Busca um usuário específico.

```typescript
const { data: usuario } = useUsuario('uuid-usuario');
```

#### `useCreateUsuario()`
Cria novo usuário.

```typescript
const { trigger: criarUsuario } = useCreateUsuario();
await criarUsuario({
  nm_email: 'user@example.com',
  nm_completo: 'Nome Completo',
  nm_papel: 'paciente',
  nm_senha: 'senha123',
});
```

#### `useUpdateUsuario(id)`
Atualiza usuário.

```typescript
const { trigger: atualizarUsuario } = useUpdateUsuario('uuid-usuario');
await atualizarUsuario({ nm_completo: 'Novo Nome' });
```

#### `useDeleteUsuario(id)`
Deleta usuário.

```typescript
const { trigger: deletarUsuario } = useDeleteUsuario('uuid-usuario');
await deletarUsuario();
```

---

#### `usePerfis(filtros?)`
Lista perfis (roles).

```typescript
const { data: perfis } = usePerfis();
```

#### `usePerfil(id)`
Busca um perfil específico.

```typescript
const { data: perfil } = usePerfil('uuid-perfil');
```

#### `useCreatePerfil()`
Cria novo perfil.

```typescript
const { trigger: criarPerfil } = useCreatePerfil();
await criarPerfil({
  nm_perfil: 'Gestor',
  ds_perfil: 'Descrição do perfil',
  permissions: ['read:users', 'write:users'],
});
```

#### `useUpdatePerfil(id)`
Atualiza perfil.

```typescript
const { trigger: atualizarPerfil } = useUpdatePerfil('uuid-perfil');
await atualizarPerfil({ nm_perfil: 'Novo Nome' });
```

#### `useDeletePerfil(id)`
Deleta perfil.

```typescript
const { trigger: deletarPerfil } = useDeletePerfil('uuid-perfil');
await deletarPerfil();
```

### IA (P1 - Média Prioridade)

#### `useAgentes(filtros?)`
Lista agentes de IA.

```typescript
const { data: agentes } = useAgentes({
  page: 1,
  size: 10,
  tipo_agente: 'chatbot',
});
```

#### `useAgente(id)`
Busca um agente específico.

```typescript
const { data: agente } = useAgente('uuid-agente');
```

#### `useCreateAgente()`
Cria novo agente.

```typescript
const { trigger: criarAgente } = useCreateAgente();
await criarAgente({
  nm_agente: 'Atendimento EstetiQ',
  tipo_agente: 'chatbot',
  // ... outras propriedades
});
```

---

#### `useConversas(filtros?)`
Lista conversas.

```typescript
const { data: conversas } = useConversas({
  page: 1,
  id_agente: 'uuid-agente',
});
```

#### `useConversa(id)`
Busca uma conversa específica.

```typescript
const { data: conversa } = useConversa('uuid-conversa');
```

#### `useCreateConversa()`
Cria nova conversa.

```typescript
const { trigger: criarConversa } = useCreateConversa();
await criarConversa({
  id_agente: 'uuid-agente',
  titulo: 'Nova Conversa',
});
```

### Clínica

#### `useAgendamentos(filtros?)`
Lista agendamentos.

```typescript
const { data: agendamentos } = useAgendamentos({
  page: 1,
  id_profissional: 'uuid-profissional',
  data_inicio: '2025-10-01',
  data_fim: '2025-10-31',
});
```

#### `useAgendamento(id)`
Busca um agendamento específico.

```typescript
const { data: agendamento } = useAgendamento('uuid-agendamento');
```

### Marketplace

#### `useProdutos(filtros?)`
Lista produtos do marketplace.

```typescript
const { data: produtos } = useProdutos({
  page: 1,
  size: 24,
  busca: 'hidratante',
  id_categoria: 'uuid-categoria',
  apenas_promocao: true,
});
```

#### `useProduto(id)`
Busca um produto específico.

```typescript
const { data: produto } = useProduto('uuid-produto');
```

---

#### `useCarrinho(idPaciente)`
Busca carrinho de compras do paciente.

```typescript
const { data: carrinho } = useCarrinho('uuid-paciente');
```

## Convenções de Código

### Nomenclatura

- **Hooks de listagem**: `use<Entidades>` (plural) - ex: `useEmpresas`, `useUsuarios`
- **Hooks de item único**: `use<Entidade>` (singular) - ex: `useEmpresa`, `useUsuario`
- **Hooks de criação**: `useCreate<Entidade>` - ex: `useCreateEmpresa`
- **Hooks de atualização**: `useUpdate<Entidade>` - ex: `useUpdateEmpresa`
- **Hooks de deleção**: `useDelete<Entidade>` - ex: `useDeleteEmpresa`

### Tipos e Interfaces

Cada hook deve exportar:

- `<Entidade>` - Tipo da entidade principal
- `<Entidades>Filtros` - Interface de filtros para listagem
- `Criar<Entidade>Data` - DTO para criação
- `Atualizar<Entidade>Data` - DTO para atualização (Partial do DTO de criação)

```typescript
export interface Empresa { ... }
export interface EmpresasFiltros extends BaseFilterParams { ... }
export interface CriarEmpresaData { ... }
export interface AtualizarEmpresaData extends Partial<CriarEmpresaData> { ... }
```

### Client Components

Todos os hooks usam `'use client'` no topo do arquivo, pois utilizam SWR (hooks do React).

### Documentação JSDoc

Todos os hooks devem ter documentação JSDoc com exemplo de uso:

```typescript
/**
 * Hook para listar empresas
 *
 * @example
 * ```typescript
 * const { data, meta, isLoading } = useEmpresas({
 *   page: 1,
 *   size: 10,
 * });
 * ```
 */
export function useEmpresas(filtros: EmpresasFiltros = {}) { ... }
```

## Integração com Server Components

Os hooks são para **Client Components**. Para **Server Components**, use as funções de `lib-new/api/server.ts`:

```typescript
// Server Component
import { getEmpresas } from '@/lib-new/api/server';

export default async function EmpresasPage() {
  const empresas = await getEmpresas({ page: 1, size: 10 });

  return <EmpresasList initialData={empresas} />;
}

// Client Component (recebe dados iniciais)
'use client';
import { useEmpresas } from '@/lib-new/api/hooks';

function EmpresasList({ initialData }) {
  const { data, mutate } = useEmpresas({ page: 1 });

  // Usar initialData no primeiro render, depois SWR assume
  const empresas = data.length > 0 ? data : initialData;

  return ...;
}
```

## Próximos Passos

### Hooks Planejados (Baixa Prioridade)

- **Gestão**: `useClinicas`, `useConfiguracoes`
- **Clínica**: `useProfissionais`, `usePacientes`, `useProcedimentos`, `useDisponibilidades`
- **Marketplace**: `useFornecedores`, `usePedidos`, `useCupons`
- **Financeiro**: `useFaturas`, `useTransacoes`
- **Analytics**: `useAnalytics`, `useMetricas`

### Melhorias Futuras

1. **Optimistic Updates**: Atualizar cache localmente antes da resposta do servidor
2. **Infinite Scroll**: Implementar hook `useInfiniteQuery` para paginação infinita
3. **Cache Strategies**: Configurar TTL e estratégias de revalidação por domínio
4. **Error Boundaries**: Integrar com React Error Boundaries para melhor UX
5. **TypeScript Strict**: Garantir tipagem completa e strict mode

## Migração da Estrutura Antiga

Para migrar de hooks antigos para novos:

1. **Identificar hook antigo**: `src/lib/api/hooks/useEmpresas.ts`
2. **Importar do novo local**: `import { useEmpresas } from '@/lib-new/api/hooks'`
3. **Ajustar sintaxe se necessário**: Retorno padronizado `{ data, meta, isLoading, error }`
4. **Testar componente**: Garantir que funcionalidade não quebrou
5. **Remover hook antigo**: Após validação, deletar arquivo antigo

## Suporte e Dúvidas

Consulte:
- Documentação do SWR: https://swr.vercel.app
- PROPOSTA_REESTRUTURACAO.md (Fase 3 - Hooks de API)
- CLAUDE.md (Guia de desenvolvimento do projeto)
