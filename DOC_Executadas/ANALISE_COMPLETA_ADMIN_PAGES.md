# ANÁLISE COMPLETA DAS PÁGINAS ADMINISTRATIVAS - DoctorQ

## Resumo Executivo

O projeto DoctorQ_Prod implementa **25 páginas administrativas** no diretório `/estetiQ-web/src/app/admin/`. Este documento fornece uma análise detalhada de cada página com:

- Caminho completo do arquivo
- Título/Nome da página
- Descrição das funcionalidades
- Componentes UI utilizados
- Padrões de implementação
- Dados/Estados gerenciados

---

## 1. DASHBOARD ADMINISTRATIVO

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/dashboard/page.tsx`

### Nome da Página
**Painel Administrativo (Admin Dashboard)**

### Funcionalidades Principais
- Exibição de estatísticas principais com cards coloridos
- Métricas de:
  - Total de Usuários (1.247)
  - Total de Profissionais (342)
  - Total de Fornecedores (89)
  - Transações do Dia (156)
- Layout responsivo com grid
- Mensagem de boas-vindas personalizada com nome do usuário

### Componentes Utilizados
- `AuthenticatedLayout` - Container principal
- `Card`, `CardContent` - Componentes de card
- Ícones Lucide React:
  - `Shield` - Ícone principal
  - `Users` - Total de usuários
  - `Briefcase` - Profissionais
  - `Package` - Fornecedores
  - `Activity` - Transações

### Padrões Implementados
- Uso de contexto `UserTypeContext` para obter dados do usuário
- Cards com gradientes (ex: `from-red-600 to-orange-600`)
- Stats array com mapeamento para renderização
- Grid responsivo: `md:grid-cols-2 lg:grid-cols-4`

---

## 2. GESTÃO DE USUÁRIOS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/usuarios/page.tsx`

### Nome da Página
**Gestão de Usuários**

### Funcionalidades Principais
- Listagem completa de usuários do sistema
- Filtragem por nome ou email
- Cards informativos por tipo de usuário:
  - Admin (com ícone especial)
  - Cliente
  - Profissional
  - Fornecedor
- Informações exibidas por usuário:
  - Avatar com iniciais
  - Nome completo
  - Email
  - Tipo de usuário (badge colorida)
  - Status (ativo/inativo/bloqueado)
  - Data de criação
  - Último acesso
- Ações por usuário:
  - Editar
  - Bloquear/Desbloquear
  - Deletar

### Componentes Utilizados
- `AuthenticatedLayout` - Container
- `Card`, `CardContent` - Cards de usuário
- `Input` - Campo de busca
- `Badge` - Status e tipo
- `Button` - Ações
- `Avatar`, `AvatarFallback` - Avatares com iniciais
- Ícones Lucide:
  - `Users` - Ícone principal
  - `Search` - Busca
  - `Plus` - Novo usuário
  - `Edit`, `Trash2`, `Ban` - Ações

### Estados Gerenciados
```typescript
interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "admin" | "cliente" | "profissional" | "fornecedor";
  status: "ativo" | "inativo" | "bloqueado";
  dataCriacao: string;
  ultimoAcesso: string;
}
```

### Padrões Implementados
- Estado local com `useState` para busca
- Filtragem em tempo real
- Funções color-coded para diferentes tipos/status
- Grid de cards com 4 colunas para estatísticas
- Search com debounce implícito (onChange)

---

## 3. GESTÃO DE CLIENTES

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/clientes/page.tsx`

### Nome da Página
**Clientes**

### Funcionalidades Principais
- Visualização de todos os clientes
- Cards informativos globais:
  - Total de clientes
  - Total de pedidos (agregado)
  - Receita total
- Cards individuais por cliente com:
  - Avatar
  - Nome
  - Email
  - Telefone
  - Total de pedidos realizados
  - Total gasto
  - Última compra
  - Status
- Botão "Ver Detalhes" para cada cliente

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Status
- `Avatar`, `AvatarFallback`
- `Button` - Ver detalhes
- `Input` - Busca
- Ícones Lucide:
  - `User` - Ícone principal
  - `Search` - Busca
  - `Eye` - Ver detalhes
  - `ShoppingBag` - Total pedidos
  - `DollarSign` - Receita

### Estados Gerenciados
```typescript
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  totalPedidos: number;
  totalGasto: number;
  ultimaCompra: string;
  status: "ativo";
}
```

### Padrões Implementados
- Grid responsivo: `md:grid-cols-2`
- Formatação de moeda com `toLocaleString("pt-BR")`
- Cálculo de agregações com `.reduce()`
- Cards hover com shadow
- Status badge inline

---

## 4. GESTÃO DE PROFISSIONAIS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/profissionais/page.tsx`

### Nome da Página
**Profissionais**

### Funcionalidades Principais
- Listagem de profissionais de saúde/estética
- Informações por profissional:
  - Avatar
  - Nome
  - Especialidade
  - Status (ativo/inativo)
  - Avaliação (estrelas)
  - Total de clientes
  - Faturamento mensal

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Status
- `Avatar`, `AvatarFallback`
- Ícones Lucide:
  - `Briefcase` - Ícone principal
  - `Star` - Avaliação
  - `Users` - Total clientes
  - `DollarSign` - Receita

### Estados Gerenciados
```typescript
interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  avaliacao: number;
  totalClientes: number;
  faturamento: number;
  status: "ativo";
}
```

### Padrões Implementados
- Grid `md:grid-cols-2`
- Ícones inline com dados
- Formatação de moeda e avaliações

---

## 5. GESTÃO DE AGENDAMENTOS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/agendamentos/page.tsx`

### Nome da Página
**Agendamentos**

### Funcionalidades Principais
- Visualização de todos os agendamentos
- Filtro por status com abas (Tabs):
  - Todos
  - Pendentes
  - Confirmados
  - Concluídos
  - Cancelados
- Cards de estatísticas (5 cards):
  - Total
  - Confirmados
  - Pendentes
  - Concluídos
  - Cancelados
- Informações por agendamento:
  - ID do agendamento
  - Procedimento
  - Paciente
  - Profissional
  - Data e horário
  - Local
  - Valor
  - Status com ícone

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Status
- Ícones Lucide:
  - `Calendar` - Ícone principal e data
  - `Clock` - Horário
  - `User` - Paciente
  - `MapPin` - Local
  - `CheckCircle2` - Confirmado/Concluído
  - `XCircle` - Cancelado

### Estados Gerenciados
```typescript
interface Agendamento {
  id: string;
  paciente: string;
  profissional: string;
  procedimento: string;
  data: string;
  horario: string;
  local: string;
  valor: number;
  status: "confirmado" | "pendente" | "concluido" | "cancelado";
}
```

### Padrões Implementados
- Sistema de Tabs com `TabsContent` renderizado condicionalmente
- Função `renderAgendamentos()` para filtro
- Ícones por status
- Grid de estatísticas com 5 colunas

---

## 6. GESTÃO DE PRODUTOS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/produtos/page.tsx`

### Nome da Página
**Produtos**

### Funcionalidades Principais
- Listagem de produtos do marketplace
- Informações por produto:
  - Nome
  - Fornecedor
  - Categoria (badge)
  - Preço
  - Estoque
  - Total vendido
  - Avaliação (estrelas)

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Categoria
- Ícones Lucide:
  - `ShoppingBag` - Ícone principal
  - `Package` - Estoque
  - `TrendingUp` - Vendidos
  - `Star` - Avaliação

### Estados Gerenciados
```typescript
interface Produto {
  id: string;
  nome: string;
  fornecedor: string;
  categoria: string;
  preco: number;
  estoque: number;
  vendidos: number;
  avaliacao: number;
}
```

---

## 7. GESTÃO DE PEDIDOS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/pedidos/page.tsx`

### Nome da Página
**Pedidos**

### Funcionalidades Principais
- Visualização de todos os pedidos
- Filtro por status com Tabs:
  - Todos
  - Processando
  - Em Trânsito
  - Entregues
  - Cancelados
- Cards de estatísticas (5 cards)
- Informações por pedido:
  - ID do pedido
  - Cliente
  - Fornecedor
  - Lista de produtos com quantidade e valores
  - Valor total
  - Datas de pedido e entrega
  - Status com ícone

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Status
- Ícones Lucide:
  - `ShoppingCart` - Ícone principal
  - `Package` - Em trânsito
  - `Clock` - Processando
  - `CheckCircle2` - Entregue
  - `XCircle` - Cancelado

### Estados Gerenciados
```typescript
interface Pedido {
  id: string;
  cliente: string;
  fornecedor: string;
  produtos: Array<{
    nome: string;
    quantidade: number;
    valor: number;
  }>;
  valorTotal: number;
  status: "entregue" | "em_transito" | "processando" | "cancelado";
  dataPedido: string;
  dataEntrega: string | null;
}
```

---

## 8. GESTÃO DE FORNECEDORES

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/fornecedores/page.tsx`

### Nome da Página
**Fornecedores**

### Funcionalidades Principais
- Listagem de fornecedores
- Informações por fornecedor:
  - Avatar
  - Nome
  - CNPJ
  - Email
  - Status
  - Total de produtos
  - Total de vendas
  - Avaliação

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Status
- `Avatar`, `AvatarFallback`
- Ícones Lucide:
  - `Package` - Ícone principal
  - `Star` - Avaliação

### Estados Gerenciados
```typescript
interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  totalProdutos: number;
  totalVendas: number;
  avaliacao: number;
  status: "ativo";
}
```

---

## 9. GESTÃO DE AVALIAÇÕES

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/avaliacoes/page.tsx`

### Nome da Página
**Avaliações**

### Funcionalidades Principais
- Visualização de todas as avaliações (profissionais e produtos)
- Filtro por status com Tabs:
  - Todas
  - Pendentes
  - Aprovadas
  - Reportadas
- Cards de estatísticas (4 cards):
  - Total
  - Aprovadas
  - Pendentes
  - Média geral (com estrela)
- Informações por avaliação:
  - Avatar do avaliador
  - Estrelas (renderizadas dinamicamente)
  - Tipo (profissional/produto)
  - O que foi avaliado
  - Avaliador
  - Data
  - Comentário
  - Procedimento (se aplicável)
- Ações:
  - Aprovar/Rejeitar (para pendentes)
  - Manter/Remover (para reportadas)

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Status e tipo
- `Button` - Ações
- `Avatar`, `AvatarFallback`
- Ícones Lucide:
  - `Star` - Ícone principal e rating
  - `ThumbsUp` - Aprovar
  - `Flag` - Reportado
  - `User` - Avaliador
  - `Briefcase` - Profissional

### Estados Gerenciados
```typescript
interface Avaliacao {
  id: string;
  tipo: "profissional" | "produto";
  avaliado: string;
  avaliador: string;
  nota: number; // 1-5
  comentario: string;
  data: string;
  status: "aprovado" | "pendente" | "reportado";
  procedimento?: string;
}
```

### Padrões Implementados
- Função `renderStars()` para renderizar estrelas
- Distinção de ações por status
- Cálculo de média com `.reduce()`

---

## 10. GESTÃO DE PROCEDIMENTOS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/procedimentos/page.tsx`

### Nome da Página
**Procedimentos**

### Funcionalidades Principais
- Listagem de procedimentos oferecidos
- Informações por procedimento:
  - Nome
  - Categoria
  - Preço médio
  - Total realizado
  - Total de profissionais

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Categoria
- Ícones Lucide:
  - `Activity` - Ícone principal
  - `DollarSign` - Preço
  - `Users` - Profissionais

---

## 11. GESTÃO DE MENSAGENS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/mensagens/page.tsx`

### Nome da Página
**Mensagens**

### Funcionalidades Principais
- Monitoramento de conversas entre usuários
- Filtro por status com Tabs:
  - Todas
  - Ativas
  - Reportadas
- Cards de estatísticas (4 cards):
  - Total
  - Ativas
  - Reportadas
  - Não lidas
- Campo de busca por participante ou conteúdo
- Informações por conversa:
  - Ícone de status
  - Participantes (com seta entre eles)
  - Badge de não lidas
  - Tipo de conversa (cliente-profissional, etc)
  - Última mensagem
  - Data/hora
  - Status

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Tipo e não lidas
- `Button` - Ver conversa
- `Input` - Busca
- `Avatar`, `AvatarFallback`
- Ícones Lucide:
  - `MessageSquare` - Ícone principal
  - `Search` - Busca
  - `CheckCircle2` - Ativa
  - `Flag` - Reportada

### Estados Gerenciados
```typescript
interface Conversa {
  id: string;
  tipo: "cliente-profissional" | "cliente-fornecedor" | "profissional-fornecedor";
  participantes: string[];
  ultimaMensagem: string;
  data: string;
  status: "ativa" | "reportada" | "arquivada";
  naoLidas: number;
}
```

---

## 12. GESTÃO DE CATEGORIAS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/categorias/page.tsx`

### Nome da Página
**Categorias**

### Funcionalidades Principais
- Gerenciamento de categorias de procedimentos e produtos
- Dialog para criar nova categoria
- Cards de estatísticas (4 cards):
  - Total de categorias (procedimentos)
  - Ativas (procedimentos)
  - Total de categorias (produtos)
  - Ativas (produtos)
- Seções separadas para:
  - Categorias de Procedimentos
  - Categorias de Produtos
- Informações por categoria:
  - Ícone
  - Nome
  - Status (ativa/inativa)
  - Descrição
  - Total de itens
  - ID único
- Ações:
  - Editar
  - Deletar

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`
- `Badge` - Status
- `Button` - Ações e criar
- `Input` - Formulário
- `Label` - Rótulos
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Ícones Lucide:
  - `FolderTree` - Ícone principal
  - `Plus` - Criar nova
  - `Edit` - Editar
  - `Trash2` - Deletar
  - `Tag` - Por categoria

### Padrões Implementados
- Dialog controlado com estado `dialogAberto`
- Função `renderCategorias()` reutilizável
- Select para escolha de tipo (procedimento/produto)
- Toast notifications para ações

---

## 13. RELATÓRIOS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/relatorios/page.tsx`

### Nome da Página
**Relatórios**

### Funcionalidades Principais
- Visualização de relatórios disponíveis
- Cards de métricas (4 cards):
  - Total de usuários (com crescimento %)
  - Receita mensal (com crescimento %)
  - Agendamentos (com crescimento %)
  - Ticket médio (com crescimento %)
- Gerador de relatório personalizado:
  - Seleção de tipo (financeiro, vendas, clientes, profissionais, agendamentos)
  - Seleção de período
  - Seleção de formato (PDF, Excel, CSV)
  - Botão para gerar
- Lista de relatórios recentes com:
  - Título
  - Descrição
  - Categoria (badge colorida)
  - Período
  - Data de geração
  - Botão de download

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Categoria
- `Button` - Ações
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Ícones Lucide:
  - `BarChart3` - Ícone principal
  - `TrendingUp` - Crescimento
  - `Users` - Usuários
  - `DollarSign` - Receita
  - `Calendar` - Agendamentos
  - `ShoppingBag` - Ticket
  - `Download` - Download
  - `FileText` - Gerar

### Estados Gerenciados
```typescript
interface Relatorio {
  id: string;
  titulo: string;
  descricao: string;
  categoria: "financeiro" | "profissionais" | "vendas" | "agendamentos" | "clientes";
  periodo: string;
  geradoEm: string;
}
```

---

## 14. FINANCEIRO

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/financeiro/page.tsx`

### Nome da Página
**Financeiro**

### Funcionalidades Principais
- Acompanhamento de movimentações financeiras
- Cards de estatísticas (4 cards):
  - Receita total (verde)
  - Despesa total (vermelho)
  - Saldo líquido (azul)
  - Pendente (amarelo)
- Cards de resumo mensal (2 cards):
  - Janeiro 2025 (receita, despesa, saldo)
  - Dezembro 2024 (mesmas informações)
- Filtro por tipo de transação com Tabs:
  - Todas
  - Entradas
  - Saídas
- Informações por transação:
  - Ícone indicando entrada/saída
  - Descrição
  - Origem
  - Status (confirmado, processando, cancelado)
  - Data
  - ID
  - Valor com sinal (+ ou -)

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Status
- Ícones Lucide:
  - `DollarSign` - Ícone principal
  - `TrendingUp` - Receita
  - `TrendingDown` - Despesa
  - `Wallet` - Saldo
  - `CreditCard` - Pendente
  - `ArrowUpRight` - Entrada
  - `ArrowDownRight` - Saída

### Estados Gerenciados
```typescript
interface Transacao {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  origem: string;
  data: string;
  status: "confirmado" | "processando" | "cancelado";
}
```

---

## 15. NOTIFICAÇÕES

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/notificacoes/page.tsx`

### Nome da Página
**Notificações**

### Funcionalidades Principais
- Gestão de notificações do sistema
- Dialog para enviar nova notificação
- Cards de estatísticas (3 cards):
  - Total enviadas
  - Agendadas
  - Taxa de visualização (%)
- Formulário de criação com campos:
  - Título
  - Mensagem (textarea)
  - Destinatários (select)
  - Tipo de envio (imediato, agendado, rascunho)
- Filtro por status com Tabs:
  - Todas
  - Enviadas
  - Agendadas
- Informações por notificação:
  - Ícone de status
  - Título e mensagem
  - Status (enviada, agendada, rascunho)
  - Tipo de destinatário
  - Data de envio
  - Total de destinatários
  - Visualizações (com percentual)

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Status
- `Button` - Ações
- `Input` - Formulário
- `Textarea` - Mensagem
- `Label` - Rótulos
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Ícones Lucide:
  - `Bell` - Ícone principal
  - `Send` - Enviar
  - `Plus` - Nova
  - `Users` - Destinatários
  - `CheckCircle2` - Enviada
  - `Clock` - Agendada

### Padrões Implementados
- Dialog controlado
- Estados para controlar form
- Toast notifications para ações

---

## 16. MEU PERFIL

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/perfil/page.tsx`

### Nome da Página
**Meu Perfil**

### Funcionalidades Principais
- Gerenciamento do perfil do usuário admin
- Sistema de Tabs para:
  - Dados Pessoais
  - Segurança
  - Notificações

#### Aba: Dados Pessoais
- Card com avatar grande (com botão para alterar foto)
- Modo edição/visualização (botão Editar/Cancelar/Salvar)
- Campos editáveis:
  - Nome completo
  - Email
  - Telefone
  - Cargo
  - Departamento
  - Endereço
  - Cidade
  - Estado
  - CEP

#### Aba: Segurança
- Seção "Alterar Senha" com:
  - Senha atual
  - Nova senha
  - Confirmar senha
  - Validação de coincidência

#### Aba: Notificações
- Seções de preferências:
  - Email Notifications (3 opções com switches)
  - Push Notifications (2 opções com switches)
- Botão "Salvar Preferências"

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Button` - Ações
- `Input` - Campos
- `Label` - Rótulos
- `Switch` - Preferências
- `Avatar`, `AvatarFallback`
- Ícones Lucide:
  - `User` - Ícone principal
  - `Edit` - Editar
  - `Camera` - Alterar foto
  - `Save` - Salvar
  - `X` - Cancelar
  - `Shield` - Segurança
  - `Key` - Alterar senha

### Estados Gerenciados
```typescript
interface Perfil {
  nm_completo: string;
  nm_email: string;
  nr_telefone: string;
  ds_cargo: string;
  ds_departamento: string;
  ds_endereco: string;
  ds_cidade: string;
  ds_estado: string;
  nr_cep: string;
}

interface Notificacoes {
  emailNovosUsuarios: boolean;
  emailTransacoes: boolean;
  emailRelatorios: boolean;
  pushAlertas: boolean;
  pushMensagens: boolean;
}
```

---

## 17. SEGURANÇA

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/seguranca/page.tsx`

### Nome da Página
**Segurança**

### Funcionalidades Principais
- Gestão de segurança da plataforma
- Cards de estatísticas (4 cards):
  - Tentativas bloqueadas
  - IPs bloqueados
  - Sessões ativas
  - Alertas de segurança
- Sistema de Tabs para:
  - Configurações
  - Tentativas de Login
  - Sessões Ativas

#### Aba: Configurações
- Cards de configuração (4 grupos):

**1. Autenticação:**
- 2FA obrigatório (switch)
- Mínimo de caracteres na senha (select)
- Expiração de senha em dias (select)

**2. Proteção de Conta:**
- Bloqueio automático (switch)
- Máximo de tentativas de login (select)
- Tempo de bloqueio (select)

**3. Auditoria:**
- Log de auditoria (switch)
- Retenção de logs em dias (select)

**4. API e Tokens:**
- Validade do token de acesso (select)
- Validade do refresh token (select)

#### Aba: Tentativas de Login
- Cards para cada tentativa com:
  - Usuário
  - IP
  - Total de tentativas
  - Última tentativa
  - Origem (país/localidade)
  - Status (bloqueado/monitorado)
  - Botão Bloquear IP ou Desbloquear

#### Aba: Sessões Ativas
- Cards para cada sessão com:
  - Usuário
  - IP
  - Dispositivo (navegador + SO)
  - Localização
  - Hora de início
  - Última atividade
  - Botão Encerrar

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Status
- `Button` - Ações
- `Switch` - Toggles
- `Label` - Rótulos
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Ícones Lucide:
  - `Shield` - Ícone principal
  - `Lock` - Autenticação
  - `Key` - Tokens
  - `AlertTriangle` - Tentativas
  - `Users` - Sessões
  - `Eye` - Auditoria
  - `Ban` - Bloqueado
  - `CheckCircle2` - Ativa

---

## 18. LOGS DO SISTEMA

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/logs/page.tsx`

### Nome da Página
**Logs do Sistema**

### Funcionalidades Principais
- Monitoramento de eventos e erros do sistema
- Botão para exportar logs
- Cards de estatísticas (5 cards):
  - Total de logs
  - Info
  - Warning
  - Error
  - Critical
- Campo de busca por mensagem, usuário ou categoria
- Seletor de categoria (filtro)
- Sistema de Tabs por tipo:
  - Todos
  - Critical
  - Errors
  - Warnings
  - Info
- Informações por log:
  - Ícone indicando tipo
  - Mensagem
  - Detalhes
  - Badge de tipo e categoria
  - Usuário
  - IP
  - ID do log
  - Timestamp

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` - Tipo e categoria
- `Button` - Exportar
- `Input` - Busca
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Ícones Lucide:
  - `FileText` - Ícone principal
  - `Download` - Exportar
  - `Search` - Busca
  - `Info` - Info
  - `AlertTriangle` - Warning
  - `AlertCircle` - Error
  - `XCircle` - Critical

### Estados Gerenciados
```typescript
interface Log {
  id: string;
  tipo: "info" | "warning" | "error" | "critical";
  categoria: "autenticacao" | "api" | "pagamento" | "database" | "usuario" | "seguranca";
  mensagem: string;
  usuario: string;
  ip: string;
  timestamp: string;
  detalhes: string;
}
```

---

## 19. CONFIGURAÇÕES DO SISTEMA

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/configuracoes/page.tsx`

### Nome da Página
**Configurações do Sistema**

### Funcionalidades Principais
- Gerenciamento de integrações externas
- Header com gradiente (rosa/roxo/rosa)
- Abas de categorias sticky:
  - WhatsApp Business
  - Email (SMTP)
  - SMS
  - Geral
- Card de sucesso flutuante para feedback
- Para cada configuração:
  - Campo com rótulo
  - Campo de entrada (text, number, password, boolean)
  - Ícone de mostrar/ocultar para campos sensíveis
  - Badge de "sensível" para campos criptografados
  - Botão "Salvar" por configuração
- Botões globais:
  - Cancelar alterações
  - Salvar todas as configurações

### Componentes Utilizados
- `AuthenticatedLayout` (adaptada)
- `Card`, `CardContent`
- `Button` - Ações
- `Input` - Campos
- `Label` - Rótulos
- `Textarea` - Campos longos
- Ícones Lucide:
  - `Settings` - Ícone principal
  - `MessageSquare` - WhatsApp
  - `Mail` - Email
  - `Smartphone` - SMS
  - `Globe` - Geral
  - `Eye`, `EyeOff` - Mostrar/ocultar
  - `Save` - Salvar
  - `CheckCircle`, `Loader2` - Estados

### Padrões Implementados
- Fetch API para GET/PUT
- Renderização dinâmica de inputs baseado em tipo
- Estados de loading e saving
- Mensagens de sucesso com toast e spinner
- Categorias com gradientes individuais

---

## 20. BACKUP E RESTAURAÇÃO

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/backup/page.tsx`

### Nome da Página
**Backup e Restauração**

### Funcionalidades Principais
- Gerenciamento de backups do sistema
- Botão para gerar backup manual
- Cards de estatísticas (4 cards):
  - Total de backups
  - Tamanho total
  - Concluídos
  - Com erro
- Card "Último Backup" com:
  - Status
  - Data
  - Tamanho
  - Duração
- Card "Configurações de Backup" com:
  - Switch para backup automático
  - Frequência (select)
  - Retenção em dias (select)
- Lista de histórico de backups com:
  - Badge de tipo (completo/incremental)
  - ID
  - Descrição
  - Status com ícone
  - Data/hora
  - Tamanho
  - Duração
  - Mensagem de erro (se aplicável)
  - Botões: Baixar, Restaurar

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Tipo e status
- `Button` - Ações
- `Switch` - Backup automático
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Progress` - Progress bar (importado)
- Ícones Lucide:
  - `Database` - Ícone principal
  - `Play` - Gerar
  - `Download` - Baixar
  - `RotateCcw` - Restaurar
  - `CheckCircle2` - Concluído
  - `Clock` - Pendente
  - `AlertCircle` - Erro

### Estados Gerenciados
```typescript
interface Backup {
  id: string;
  tipo: "completo" | "incremental";
  descricao: string;
  tamanho: string;
  dataGeracao: string;
  status: "concluido" | "em_andamento" | "erro";
  duracao: string;
  erro?: string;
}
```

---

## 21. INTEGRAÇÕES

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/integracoes/page.tsx`

### Nome da Página
**Integrações**

### Funcionalidades Principais
- Gerenciamento de integrações com serviços externos
- Cards de estatísticas (3 cards):
  - Total
  - Ativas
  - Inativas
- Grid de cards para cada integração com:
  - Ícone de status
  - Nome
  - Descrição
  - Badge de categoria
  - Badge de status
  - Switch para ativar/desativar
  - Última sincronização
  - Botões: Configurar, Testar
- Dialog para configurar integração:
  - Nome e descrição
  - Campos dinâmicos (text, password com toggle)
  - Botões: Salvar, Cancelar

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`
- `Badge` - Status e categoria
- `Button` - Ações
- `Input` - Formulário
- `Label` - Rótulos
- `Switch` - Ativar/desativar
- Ícones Lucide:
  - `Plug` - Ícone principal
  - `Settings` - Configurar
  - `Eye`, `EyeOff` - Mostrar/ocultar senha
  - `CheckCircle2` - Ativa
  - `XCircle` - Inativa

### Estados Gerenciados
```typescript
interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  categoria: "autenticacao" | "pagamento" | "email" | "storage" | "comunicacao" | "analytics";
  status: "ativo" | "inativo" | "erro";
  ultimaSincronizacao: string | null;
  configuracoes: Record<string, string>;
}
```

---

## 22. MARKETING - PRODUTOS & EQUIPAMENTOS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/marketing/produtos/page.tsx`

### Nome da Página
**Produtos & Equipamentos**

### Funcionalidades Principais
- Cadastro de produtos que aparecem na vitrine
- Campo de busca
- Link para "Ver vitrine"
- Alert de API offline (se necessário)
- Loading skeleton enquanto carrega
- Grid de cards para cada produto com:
  - Categoria (uppercase)
  - Nome
  - Resumo (truncado com line-clamp)
  - Tags trending (até 3)
  - Botões: Editar, Remover
- Dialog para criar/editar produto com campos:
  - Nome
  - Categoria
  - Subcategoria
  - Resumo
  - Imagem destaque (URL)
  - Benefícios (textarea, um por linha)
  - Tags (separadas por vírgula)

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Dialog`, `DialogContent`, `DialogFooter`, `DialogHeader`, `DialogTitle`
- `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`
- `Button` - Ações
- `Input` - Busca e formulário
- `Label` - Rótulos
- `Textarea` - Campos longos
- Ícones Lucide:
  - `ListChecks` - Ícone principal
  - `Plus` - Novo
  - `Pencil` - Editar
  - `Trash` - Remover
  - `Loader2` - Loading

### Padrões Implementados
- Fetch API com cache control
- Validação de permissão (isAdmin)
- Estados para form e dialogs
- Loading state com spinner
- Tratamento de offline mode
- API fallback com dados padrão

---

## 23. MARKETING - PARCEIROS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/marketing/parceiros/page.tsx`

### Nome da Página
**Cadastros de Parceiros**

### Funcionalidades Principais
- Acompanhamento de leads de parceria
- Filtro de busca por empresa, contato ou cidade
- Filtros de tipo (Todos, Clínica, Profissional, Fabricante, Fornecedor)
- Cards para cada lead com:
  - Avatar com ícone do tipo
  - Nome da empresa
  - Tipo (label)
  - Nome de contato
  - Email, telefone, localização (com ícones)
  - Ofertas/serviços (lista)
  - Notas (se houver)
  - Data de criação
  - Data de atualização
  - Link para website (se houver)

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Badge` - Tipo
- `Button` - Filtros
- `Input` - Busca
- `Loader2` - Loading
- Link - Para website
- Ícones Lucide:
  - `Building2` - Clínica
  - `Users` - Profissional
  - `Factory` - Fabricante
  - `Package` - Fornecedor
  - `Mail` - Email
  - `Phone` - Telefone
  - `MapPin` - Localização
  - `ExternalLink` - Website

### Estados Gerenciados
```typescript
interface PartnerLead {
  id: string;
  type: "clinica" | "profissional" | "fabricante" | "fornecedor";
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  services?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 24. MARKETING - PRINCIPAIS BUSCAS

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/marketing/buscas-populares/page.tsx`

### Nome da Página
**Principais Buscas**

### Funcionalidades Principais
- Organização de buscas destacadas na landing page
- Alert de permissão (se não for admin)
- Campo de busca e switch "Mostrar apenas ativos"
- Tabela com colunas:
  - Termo
  - Categoria
  - Destaque (badge)
  - Tags (badges)
  - Ordem
  - Status (badge ativo/inativo)
  - Ações (Editar, Remover)
- Dialog para criar/editar busca com campos:
  - Termo (obrigatório)
  - Descrição (opcional)
  - Destaque (badge) - opcional
  - Categoria - opcional
  - Tags (separadas por vírgula)
  - Ordem de exibição
  - Switch para exibir na landing page

### Componentes Utilizados
- `AuthenticatedLayout`
- `Card`, `CardContent`
- `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`
- `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`
- `Badge` - Status e destaque
- `Button` - Ações e filtros
- `Input` - Busca e formulário
- `Label` - Rótulos
- `Textarea` - Descrição
- `Switch` - Filtro ativo
- `Skeleton` - Loading
- Ícones Lucide:
  - `ListChecks` - Ícone principal
  - `Plus` - Nova busca
  - `Search` - Ícone de busca
  - `Pencil` - Editar
  - `Trash` - Remover
  - `Loader2` - Loading

### Padrões Implementados
- Tabela HTML para listagem (em vez de cards)
- Sorting automático por ordem
- Validação de admin
- Cálculo dinâmico de próxima ordem
- Parsing de array para string (tags)

---

## 25. CONFIGURAÇÕES - DEBUG

### Arquivo
`/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/admin/configuracoes/debug/page.tsx`

### Nome da Página
**Debug - Variáveis de Ambiente**

### Funcionalidades Principais
- Exibição de variáveis de ambiente
- Botão para testar chamada à API
- Cards para cada variável:
  - NEXT_PUBLIC_API_URL
  - NEXT_PUBLIC_API_KEY
- Endpoint de teste: `/configuracoes/categorias`

### Componentes Utilizados
- Cards HTML simples
- Button com onClick

### Padrões Implementados
- Client-side component
- Fetch direto na UI
- Alert com resposta JSON

---

---

# RESUMO EXECUTIVO DE COMPONENTES COMPARTILHADOS

## Componentes UI Mais Utilizados

| Componente | Uso | Páginas |
|------------|-----|---------|
| `Card`, `CardContent` | Container principal | TODAS |
| `Button` | Ações | TODAS |
| `Badge` | Status, tipos, categorias | 90% |
| `Tabs` | Filtros por status | 10 páginas |
| `Dialog` | Criação/edição | 5 páginas |
| `AlertDialog` | Confirmação delete | 3 páginas |
| `Input` | Busca, formulários | 15 páginas |
| `Avatar`, `AvatarFallback` | Perfis de usuários | 8 páginas |
| `Select` | Dropdowns | 8 páginas |
| `Switch` | Toggles on/off | 5 páginas |
| `Label` | Rótulos | 7 páginas |
| `Textarea` | Campos longos | 5 páginas |

## Padrões Comuns

1. **Estrutura de página:**
   - AuthenticatedLayout wrapper
   - Title + description
   - Stats cards (grid de 3-5 cards)
   - Conteúdo principal (cards, tabelas ou tabbed content)

2. **Filtros:**
   - Input de busca com ícone Search
   - Tabs para categorias/status
   - Selects para filtros adicionais

3. **Ações:**
   - Botão "Novo/+" para criar
   - Botões Edit, Delete, View em cada item
   - Confirmação com AlertDialog antes de delete

4. **Formatação:**
   - Datas: `toLocaleDateString("pt-BR")`
   - Moeda: `toLocaleString("pt-BR", {style: "currency", currency: "BRL"})`
   - Gradientes: `from-cor-500 to-cor-600`
   - Cores por status: verde (ativo), vermelho (erro), amarelo (pendente), azul (info)

5. **Estados:**
   - useState para busca, filtros, dialogs
   - Estado loading com spinner
   - Toast notifications com sonner
   - Validações no submit

## Ícones Lucide Mais Usados

- `Users` - Usuários/pessoas
- `Settings` - Configurações
- `Shield` - Segurança/admin
- `Search` - Busca
- `Plus` - Criar novo
- `Edit` - Editar
- `Trash2` - Deletar
- `CheckCircle2` - Sucesso/confirmado
- `AlertCircle` - Erro
- `Clock` - Pendente/relógio
- `Star` - Avaliação
- `DollarSign` - Financeiro
- `TrendingUp` / `TrendingDown` - Crescimento/queda
- `Download` - Baixar
- `Eye` / `EyeOff` - Mostrar/ocultar

---

# ESTRUTURA DE DIRETÓRIOS

```
src/app/admin/
├── dashboard/
│   └── page.tsx
├── usuarios/
│   └── page.tsx
├── clientes/
│   └── page.tsx
├── profissionais/
│   └── page.tsx
├── agendamentos/
│   └── page.tsx
├── produtos/
│   └── page.tsx
├── pedidos/
│   └── page.tsx
├── fornecedores/
│   └── page.tsx
├── avaliacoes/
│   └── page.tsx
├── procedimentos/
│   └── page.tsx
├── mensagens/
│   └── page.tsx
├── categorias/
│   └── page.tsx
├── relatorios/
│   └── page.tsx
├── financeiro/
│   └── page.tsx
├── notificacoes/
│   └── page.tsx
├── perfil/
│   └── page.tsx
├── seguranca/
│   └── page.tsx
├── logs/
│   └── page.tsx
├── configuracoes/
│   ├── page.tsx
│   └── debug/
│       └── page.tsx
├── backup/
│   └── page.tsx
├── integracoes/
│   └── page.tsx
└── marketing/
    ├── produtos/
    │   └── page.tsx
    ├── parceiros/
    │   └── page.tsx
    └── buscas-populares/
        └── page.tsx
```

---

# CHECKLIST PARA IMPLEMENTAÇÃO NO PROJETO DoctorQ ATUAL

Use este checklist para implementar todas as 25 páginas no projeto em `/mnt/repositorios/DoctorQ/estetiQ-web/`:

- [ ] 1. Dashboard Administrativo
- [ ] 2. Gestão de Usuários
- [ ] 3. Gestão de Clientes
- [ ] 4. Gestão de Profissionais
- [ ] 5. Gestão de Agendamentos
- [ ] 6. Gestão de Produtos
- [ ] 7. Gestão de Pedidos
- [ ] 8. Gestão de Fornecedores
- [ ] 9. Gestão de Avaliações
- [ ] 10. Gestão de Procedimentos
- [ ] 11. Gestão de Mensagens
- [ ] 12. Gestão de Categorias
- [ ] 13. Relatórios
- [ ] 14. Financeiro
- [ ] 15. Notificações
- [ ] 16. Meu Perfil
- [ ] 17. Segurança
- [ ] 18. Logs do Sistema
- [ ] 19. Configurações do Sistema
- [ ] 20. Backup e Restauração
- [ ] 21. Integrações
- [ ] 22. Marketing - Produtos & Equipamentos
- [ ] 23. Marketing - Parceiros
- [ ] 24. Marketing - Principais Buscas
- [ ] 25. Configurações - Debug

