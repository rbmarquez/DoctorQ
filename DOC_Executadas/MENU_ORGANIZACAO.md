# Organização do Menu - DoctorQ

## Estrutura Completa do Menu Lateral

### 📱 Seção Principal
Disponível para: **Admin** e **Usuário**

- **Estúdio** → `/estudio`
  - Ícone: Wand2 (varinha mágica)
  - Criação e edição de agentes

- **Biblioteca** → `/biblioteca`
  - Ícone: Library (biblioteca)
  - Acesso aos prompts salvos

- **Marketplace** → `/marketplace`
  - Ícone: Store (loja)
  - Agentes disponíveis para uso

- **Conversas** → `/chat`
  - Ícone: MessageSquare (mensagem)
  - Chat com agentes

---

### 💳 Seção Faturamento
Disponível para: **Admin** e **Usuário**

- **Planos** → `/billing/plans`
  - Ícone: Package (pacote)
  - Visualização e comparação de planos disponíveis
  - Upgrade/downgrade de plano

- **Minha Assinatura** → `/billing/subscription`
  - Ícone: CreditCard (cartão de crédito)
  - Status da assinatura atual
  - Uso de recursos (agentes, usuários, document stores)
  - Cancelamento de assinatura

- **Pagamentos** → `/billing/payments`
  - Ícone: Wallet (carteira)
  - Histórico completo de pagamentos
  - Status de cada transação
  - Links para recibos

- **Faturas** → `/billing/invoices`
  - Ícone: Receipt (recibo)
  - Lista de todas as faturas
  - Download de PDFs
  - Status de pagamento
  - Links de pagamento para faturas pendentes

---

### 🔧 Seção Administração
Disponível para: **Admin apenas**

- **Usuários** → `/usuarios`
  - Ícone: User
  - Gerenciamento de usuários

- **Empresas** → `/empresas`
  - Ícone: Building2
  - Gerenciamento de empresas

- **Perfis** → `/perfis`
  - Ícone: Shield
  - Gerenciamento de perfis de acesso

- **Agentes** → `/agentes`
  - Ícone: Bot
  - Administração de agentes do sistema

- **Credenciais** → `/credenciais`
  - Ícone: Key
  - Gerenciamento de credenciais

- **Tools** → `/tools`
  - Ícone: Wrench
  - Ferramentas disponíveis para agentes

- **API Keys** → `/apikeys`
  - Ícone: Key
  - Chaves de API para integração

- **Variáveis** → `/variaveis`
  - Ícone: Table
  - Variáveis de ambiente e configuração

- **Document Stores** → `/document-stores`
  - Ícone: Database
  - Gerenciamento de bases de conhecimento

---

## Componentes Visuais

### Separadores
Os separadores dividem o menu em seções lógicas:
- **Label em uppercase** com texto em cinza claro
- **Linha horizontal** abaixo do label
- **Espaçamento** de 6 unidades acima e 2 abaixo

### Itens de Menu
- **Estado normal**: Texto cinza com hover em destaque
- **Estado ativo**: Fundo azul com sombra
- **Ícones**: 20x20px à esquerda do texto
- **Transições**: Suaves (200ms)
- **Bordas arredondadas**: 12px (rounded-xl)

## Controle de Acesso

### Roles
- **admin**: Acesso total a todas as seções
- **usuario**: Acesso à seção principal e faturamento (sem seção de administração)

### Lógica de Filtro
```typescript
const allowedNavItems = navItems.filter((item) => {
  if (!role) return false;
  return item.roles.includes(role);
});
```

## Arquivos Modificados

1. **src/components/sidebar.tsx**
   - Adicionados 4 ícones novos: `CreditCard`, `Receipt`, `Wallet`, `Package`
   - Adicionados 4 novos itens de menu para Billing
   - Implementados 2 separadores visuais
   - Atualizada interface `NavItem` para suportar separadores
   - Atualizada lógica de renderização para mostrar separadores

## Próximos Passos (Opcional)

### Melhorias Futuras
1. **Badge de notificações**
   - Mostrar faturas vencidas
   - Avisos de limite de uso próximo

2. **Indicadores visuais**
   - Percentual de uso ao lado de "Minha Assinatura"
   - Número de faturas pendentes

3. **Responsividade**
   - Menu colapsável em mobile
   - Ícones apenas quando colapsado

4. **Animações**
   - Transição suave ao expandir/colapsar seções
   - Highlight em novas notificações

5. **Temas**
   - Suporte a dark mode completo
   - Cores customizáveis por tema

## Exemplo de Uso

```typescript
// Usuário normal vê:
- Estúdio
- Biblioteca
- Marketplace
- Conversas
--- FATURAMENTO ---
- Planos
- Minha Assinatura
- Pagamentos
- Faturas

// Admin vê tudo acima +
--- ADMINISTRAÇÃO ---
- Usuários
- Empresas
- Perfis
- Agentes
- Credenciais
- Tools
- API Keys
- Variáveis
- Document Stores
```

## Screenshots

### Layout do Menu

```
┌─────────────────────────┐
│                         │
│  🪄 Estúdio             │
│  📚 Biblioteca          │
│  🏪 Marketplace         │
│  💬 Conversas           │
│                         │
│  ──── FATURAMENTO ────  │
│                         │
│  📦 Planos              │
│  💳 Minha Assinatura    │
│  👛 Pagamentos          │
│  🧾 Faturas             │
│                         │
│  ─── ADMINISTRAÇÃO ───  │
│                         │
│  👤 Usuários            │
│  🏢 Empresas            │
│  🛡️  Perfis             │
│  🤖 Agentes             │
│  🔑 Credenciais         │
│  🔧 Tools               │
│  🔐 API Keys            │
│  📊 Variáveis           │
│  💾 Document Stores     │
│                         │
└─────────────────────────┘
```
