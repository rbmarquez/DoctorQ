# TABELA RÁPIDA - PÁGINAS ADMINISTRATIVAS DOCTORQ

## Visão Geral

| ID | Página | Caminho | Status Cards | Componentes Chave | Modelo de Dados |
|----|--------|---------|--------|---------|--------|
| 1 | Dashboard | `/admin/dashboard` | 4 stats | Card, Grid | Stats array |
| 2 | Usuários | `/admin/usuarios` | 4 stats | Avatar, Badge | Usuario[] |
| 3 | Clientes | `/admin/clientes` | 3 stats | Card, Badge | Cliente[] |
| 4 | Profissionais | `/admin/profissionais` | - | Card, Avatar | Profissional[] |
| 5 | Agendamentos | `/admin/agendamentos` | 5 stats + Tabs | Tabs, Badge | Agendamento[] |
| 6 | Produtos | `/admin/produtos` | - | Card, Badge | Produto[] |
| 7 | Pedidos | `/admin/pedidos` | 5 stats + Tabs | Tabs, Badge | Pedido[] |
| 8 | Fornecedores | `/admin/fornecedores` | - | Card, Avatar | Fornecedor[] |
| 9 | Avaliações | `/admin/avaliacoes` | 4 stats + Tabs | Tabs, Badge, Avatar | Avaliacao[] |
| 10 | Procedimentos | `/admin/procedimentos` | - | Card, Badge | Procedimento[] |
| 11 | Mensagens | `/admin/mensagens` | 4 stats + Tabs | Tabs, Badge, Avatar | Conversa[] |
| 12 | Categorias | `/admin/categorias` | 4 stats | Dialog, Badge | Categoria[] |
| 13 | Relatórios | `/admin/relatorios` | 4 stats | Select, Card | Relatorio[] |
| 14 | Financeiro | `/admin/financeiro` | 4 stats + Tabs | Tabs, Badge | Transacao[] |
| 15 | Notificações | `/admin/notificacoes` | 3 stats + Tabs | Dialog, Tabs, Badge | Notificacao[] |
| 16 | Perfil | `/admin/perfil` | - | Tabs, Input, Avatar | Perfil, Notificacoes |
| 17 | Segurança | `/admin/seguranca` | 4 stats + Tabs | Tabs, Switch, Select | Security config |
| 18 | Logs | `/admin/logs` | 5 stats + Tabs | Tabs, Badge | Log[] |
| 19 | Configurações | `/admin/configuracoes` | - | Input, Switch, Select | Configuracao[] |
| 20 | Backup | `/admin/backup` | 4 stats | Card, Switch | Backup[] |
| 21 | Integrações | `/admin/integracoes` | 3 stats | Card, Dialog, Switch | Integracao[] |
| 22 | Produtos & Equip. | `/admin/marketing/produtos` | - | Card, Dialog | ProfessionalProduct[] |
| 23 | Parceiros | `/admin/marketing/parceiros` | - | Card, Input | PartnerLead[] |
| 24 | Principais Buscas | `/admin/marketing/buscas-populares` | - | Table, Dialog | PopularSearch[] |
| 25 | Debug Config | `/admin/configuracoes/debug` | - | Card, Button | Env vars |

---

## Padrões de Implementação

### Estrutura Padrão de Página
```
┌─────────────────────────────────────────────┐
│         AuthenticatedLayout                 │
├─────────────────────────────────────────────┤
│ [HEADER] Título + Descrição + Botões Ação   │
├─────────────────────────────────────────────┤
│ [STATS] 3-5 Cards com números + cores       │
├─────────────────────────────────────────────┤
│ [FILTROS] Busca + Selects + Tabs            │
├─────────────────────────────────────────────┤
│ [CONTEÚDO]                                  │
│ - Cards (grid md:grid-cols-2 lg:grid-cols-3)│
│ - Tabelas HTML                              │
│ - Tabs com TabsContent                      │
│ - Dialogs para CRUD                         │
├─────────────────────────────────────────────┤
│ [AÇÕES] Edit, Delete, View, etc             │
└─────────────────────────────────────────────┘
```

### Componentes Padrão por Tipo de Página

#### Listagem Simples (Usuários, Clientes, etc)
- AuthenticatedLayout
- Header com título + botão novo
- Input busca
- Grid/Tabela com cards
- Badges para status
- Botões de ação (edit, delete)

#### Com Filtros por Status (Agendamentos, Pedidos, etc)
- AuthenticatedLayout
- Header com título
- Stats cards (5 cards típicamente)
- Tabs para status
- Cards dentro de cada tab
- Ações para cada item

#### Com Dialog CRUD (Categorias, Notificações, etc)
- AuthenticatedLayout
- Header com título + botão novo
- Grid de cards
- Botões editar/deletar abre Dialog
- Dialog com formulário
- AlertDialog para confirmação de delete

#### Com Configurações (Segurança, Perfil, etc)
- AuthenticatedLayout
- Tabs para seções
- Cards para cada configuração
- Input/Switch/Select por tipo
- Botão salvar
- Toast feedback

---

## Cores e Gradientes Utilizados

| Elemento | Cores | Exemplo |
|----------|-------|---------|
| Ativo/Success | Verde | `from-green-500 to-emerald-600` |
| Erro/Danger | Vermelho | `from-red-500 to-rose-600` |
| Aviso | Amarelo | `from-yellow-500 to-amber-600` |
| Info | Azul | `from-blue-500 to-cyan-600` |
| Principal | Rosa/Roxo | `from-pink-500 to-purple-600` |
| Neutro | Cinza | `from-gray-500 to-slate-600` |
| Processando | Roxo | `from-purple-500 to-pink-600` |

---

## Estados Gerenciados por Página

```typescript
// Padrão de busca/filtro
const [search, setSearch] = useState("");
const [filtro, setFiltro] = useState("todos");
const [statusFiltro, setStatusFiltro] = useState("todos");

// Padrão de modal/dialog
const [dialogAberto, setDialogAberto] = useState(false);
const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
const [itemSelecionado, setItemSelecionado] = useState<T | null>(null);

// Padrão de loading/saving
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [deleting, setDeleting] = useState(false);

// Padrão de dados
const [items, setItems] = useState<T[]>([]);
const [formState, setFormState] = useState(EMPTY_FORM);
```

---

## Ícones Lucide Mais Utilizados

### Por Categoria

**Ações:**
- `Plus` - Criar novo
- `Edit` / `Pencil` - Editar
- `Trash` / `Trash2` - Deletar
- `Download` - Baixar
- `Upload` - Enviar
- `Share2` - Compartilhar
- `Settings` - Configurar
- `Eye` / `EyeOff` - Mostrar/ocultar

**Status:**
- `CheckCircle2` - Concluído/Ativo
- `XCircle` - Erro/Inativo
- `AlertCircle` - Aviso
- `Clock` - Pendente
- `Ban` - Bloqueado
- `AlertTriangle` - Atenção

**Informação:**
- `Users` - Usuários
- `User` - Um usuário
- `Shield` - Admin/Segurança
- `Package` - Produtos
- `ShoppingBag` / `ShoppingCart` - Compras
- `DollarSign` - Financeiro
- `Star` - Avaliação
- `TrendingUp` / `TrendingDown` - Crescimento/queda
- `Activity` - Atividades
- `MessageSquare` - Mensagens
- `Mail` - Email
- `Phone` - Telefone
- `MapPin` - Localização
- `Calendar` - Datas
- `Clock` - Horas

**Integrações:**
- `Plug` - Integrações
- `Database` - Banco de dados
- `FileText` - Logs
- `BarChart3` - Relatórios
- `Bell` - Notificações
- `Briefcase` - Negócios
- `Factory` - Fabricante
- `Building2` - Clínica
- `ListChecks` - Produtos/Buscas

---

## Fluxos de CRUD Padrão

### CREATE
1. Usuário clica "Novo"
2. Dialog abre com form vazio
3. Usuário preenche campos
4. Clica "Salvar"
5. setState(saving, true)
6. Fetch POST /api/...
7. Toast success
8. setDialogAberto(false)
9. fetchData() para recarregar

### READ
1. Página carrega
2. useEffect com fetchData
3. setState(loading, true)
4. Fetch GET /api/...
5. setItems(response)
6. setState(loading, false)

### UPDATE
1. Usuário clica "Editar" em um item
2. setItemSelecionado(item)
3. setFormState(mapItemToForm(item))
4. Dialog abre com form preenchido
5. Usuário altera campos
6. Clica "Salvar"
7. Fetch PUT /api/.../id
8. Toast success + reload

### DELETE
1. Usuário clica "Deletar" em um item
2. AlertDialog abre pedindo confirmação
3. Usuário clica "Remover"
4. setState(deleting, true)
5. Fetch DELETE /api/.../id
6. Toast success + reload
7. AlertDialog fecha

---

## API Endpoints Esperados

Padrão RESTful:

```
GET    /api/resource/          → Listar todos
POST   /api/resource/          → Criar novo
GET    /api/resource/{id}      → Obter detalhes
PUT    /api/resource/{id}      → Atualizar
DELETE /api/resource/{id}      → Deletar

Filtros:
GET    /api/resource/?search=...
GET    /api/resource/?status=...
GET    /api/resource/?page=...&size=...
```

---

## Checklist de Implementação

Para cada página, implementar em ordem:

- [ ] Criar arquivo page.tsx
- [ ] Adicionar "use client" no topo
- [ ] Importar AuthenticatedLayout
- [ ] Criar interface/type dos dados
- [ ] Adicionar useEffect para fetchData
- [ ] Adicionar states (search, filtros, dialogs)
- [ ] Criar função de filtro/busca
- [ ] Renderizar header com título
- [ ] Renderizar stats cards
- [ ] Renderizar conteúdo (cards/tabela)
- [ ] Adicionar botões de ação
- [ ] Criar Dialog para CRUD (se necessário)
- [ ] Adicionar AlertDialog para delete (se necessário)
- [ ] Implementar funções de CRUD
- [ ] Adicionar toast notifications
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Validar permissões (isAdmin checks)

---

## Validações Comuns

```typescript
// Permissão de admin
const isAdmin = useMemo(() => 
  user?.ds_tipo_usuario?.toLowerCase().includes("admin"), 
  [user]
);

// Validação de form
if (!formState.name.trim()) {
  toast.error("Nome é obrigatório");
  return;
}

// Validação de array vazio
if (items.length === 0) {
  return <div>Nenhum item encontrado</div>;
}

// Validação de API offline
if (!response.ok) {
  throw new Error("Erro ao salvar");
}

// Formatação de dados
const formatted = items.map(item => ({
  ...item,
  data: new Date(item.data).toLocaleDateString("pt-BR"),
  valor: item.valor.toLocaleString("pt-BR", {
    style: "currency", 
    currency: "BRL"
  })
}));
```

---

## Dicas de Performance

1. **Lazy load de dialogs** - Não renderize se não estiver aberto
2. **Memoização** - Use useMemo para filtros complexos
3. **Debounce de busca** - Considere usar hook useDebounce
4. **Paginação** - Para listas maiores que 50 itens
5. **Virtual scrolling** - Para listas com 1000+ itens
6. **Skeleton loaders** - Durante carregamento
7. **Cache** - Reutilize SWR com revalidate

---

## Padrão de Resposta da API

```typescript
// Lista com paginação
{
  items: T[],
  total: number,
  page: number,
  size: number
}

// Item único
{
  id: string,
  ...props
}

// Erro
{
  error: string,
  message: string
}
```

