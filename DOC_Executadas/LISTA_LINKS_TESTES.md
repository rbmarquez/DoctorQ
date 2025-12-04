# Lista de Links para Testes - DoctorQ

## URLs Base
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

---

## 🏠 Páginas Públicas

### Landing Page e Busca
- ✅ **Home**: http://localhost:3000
- ✅ **Login**: http://localhost:3000/login
- ✅ **Cadastro**: http://localhost:3000/cadastro
- ✅ **Busca Geral**: http://localhost:3000/busca
- ✅ **Busca de Procedimentos**: http://localhost:3000/busca?tipo=procedimento
- ✅ **Busca de Profissionais**: http://localhost:3000/busca?tipo=profissional
- ✅ **Busca com Query**: http://localhost:3000/busca?q=limpeza+de+pele&tipo=procedimento
- ✅ **Busca com Localização**: http://localhost:3000/busca?q=botox&local=São+Paulo&tipo=procedimento
- ✅ **Busca Inteligente**: http://localhost:3000/busca-inteligente
- ✅ **Demo**: http://localhost:3000/demo

### Procedimentos
- ✅ **Lista de Procedimentos**: http://localhost:3000/procedimentos
- ✅ **Detalhes do Procedimento**: http://localhost:3000/procedimento/[id]
  - Exemplo: http://localhost:3000/procedimento/1
- ✅ **Agendar Procedimento**: http://localhost:3000/procedimento/[id]/agendar
  - Exemplo: http://localhost:3000/procedimento/1/agendar
- ✅ **Detalhes Alternativos**: http://localhost:3000/procedimentos/[id]
  - Exemplo: http://localhost:3000/procedimentos/1

### Profissionais
- ✅ **Lista de Profissionais**: http://localhost:3000/profissionais
- ✅ **Perfil do Profissional**: http://localhost:3000/profissional/[id]
  - Exemplo: http://localhost:3000/profissional/1
- ✅ **Perfil Alternativo**: http://localhost:3000/profissionais/[id]
  - Exemplo: http://localhost:3000/profissionais/1

### Marketplace
- ✅ **Marketplace**: http://localhost:3000/marketplace
- ✅ **Produto do Marketplace**: http://localhost:3000/marketplace/[id]
  - Exemplo: http://localhost:3000/marketplace/1
- ✅ **Carrinho**: http://localhost:3000/marketplace/carrinho

### Checkout
- ✅ **Checkout**: http://localhost:3000/checkout
- ✅ **Checkout - Sucesso**: http://localhost:3000/checkout/sucesso

### Avaliação
- ✅ **Avaliar**: http://localhost:3000/avaliar/[token]
  - Exemplo: http://localhost:3000/avaliar/abc123token

---

## 👤 Área do Cliente (Paciente)

### Menu Principal
- ✅ **Dashboard**: http://localhost:3000/paciente/dashboard
- ✅ **Meu Perfil**: http://localhost:3000/paciente/perfil
- ✅ **Procedimentos**: http://localhost:3000/paciente/procedimentos
- ✅ **Detalhes do Procedimento**: http://localhost:3000/paciente/procedimentos/[id]
  - Exemplo: http://localhost:3000/paciente/procedimentos/1
- ✅ **Meus Agendamentos**: http://localhost:3000/paciente/agendamentos
- ✅ **Agenda**: http://localhost:3000/agenda
- ✅ **Minhas Avaliações**: http://localhost:3000/paciente/avaliacoes
- ✅ **Galeria de Fotos**: http://localhost:3000/paciente/fotos
- ✅ **Favoritos**: http://localhost:3000/paciente/favoritos
- ✅ **Meus Pedidos**: http://localhost:3000/paciente/pedidos
- ✅ **Financeiro**: http://localhost:3000/paciente/financeiro
- ✅ **Mensagens**: http://localhost:3000/paciente/mensagens
- ✅ **Pagamentos**: http://localhost:3000/paciente/pagamentos
- ✅ **Notificações**: http://localhost:3000/paciente/notificacoes
- ✅ **Cupons**: http://localhost:3000/paciente/cupons
- ✅ **Anamnese**: http://localhost:3000/paciente/anamnese
- ✅ **Configurações**: http://localhost:3000/paciente/configuracoes

---

## 👨‍⚕️ Área do Profissional

### Menu Principal
- ✅ **Dashboard**: http://localhost:3000/profissional/dashboard
- ✅ **Meu Perfil**: http://localhost:3000/profissional/perfil
- ✅ **Agenda**: http://localhost:3000/profissional/agenda
- ✅ **Configurações da Agenda**: http://localhost:3000/profissional/agenda/configuracoes
- ✅ **Meus Pacientes**: http://localhost:3000/profissional/pacientes
- ✅ **Avaliações**: http://localhost:3000/profissional/avaliacoes
- ✅ **Procedimentos**: http://localhost:3000/profissional/procedimentos
- ✅ **Horários**: http://localhost:3000/profissional/horarios
- ✅ **Mensagens**: http://localhost:3000/profissional/mensagens
- ✅ **Financeiro**: http://localhost:3000/profissional/financeiro
- ✅ **Relatórios**: http://localhost:3000/profissional/relatorios
- ✅ **Certificados**: http://localhost:3000/profissional/certificados
- ✅ **Prontuários**: http://localhost:3000/profissional/prontuarios
- ✅ **Configurações**: http://localhost:3000/profissional/configuracoes

### Prontuário
- ✅ **Prontuário do Paciente**: http://localhost:3000/profissional/prontuario/[id_paciente]
  - Exemplo: http://localhost:3000/profissional/prontuario/1
- ✅ **Nova Anamnese**: http://localhost:3000/profissional/prontuario/[id_paciente]/anamnese/nova
  - Exemplo: http://localhost:3000/profissional/prontuario/1/anamnese/nova
- ✅ **Nova Evolução**: http://localhost:3000/profissional/prontuario/[id_paciente]/nova-evolucao
  - Exemplo: http://localhost:3000/profissional/prontuario/1/nova-evolucao

---

## 🏪 Área do Fornecedor

### Menu Principal
- ✅ **Dashboard**: http://localhost:3000/fornecedor/dashboard
- ✅ **Minha Empresa**: http://localhost:3000/fornecedor/perfil
- ✅ **Meus Produtos**: http://localhost:3000/fornecedor/produtos
- ✅ **Catálogo**: http://localhost:3000/fornecedor/catalogo
- ✅ **Pedidos**: http://localhost:3000/fornecedor/pedidos
- ✅ **Entregas**: http://localhost:3000/fornecedor/entregas
- ✅ **Estoque**: http://localhost:3000/fornecedor/estoque
- ✅ **Clientes**: http://localhost:3000/fornecedor/clientes
- ✅ **Avaliações**: http://localhost:3000/fornecedor/avaliacoes
- ✅ **Promoções**: http://localhost:3000/fornecedor/promocoes
- ✅ **Mensagens**: http://localhost:3000/fornecedor/mensagens
- ✅ **Financeiro**: http://localhost:3000/fornecedor/financeiro
- ✅ **Relatórios**: http://localhost:3000/fornecedor/relatorios
- ✅ **Notas Fiscais**: http://localhost:3000/fornecedor/notas-fiscais
- ✅ **Configurações**: http://localhost:3000/fornecedor/configuracoes

---

## 🛡️ Área Administrativa

### Menu Principal
- ✅ **Dashboard**: http://localhost:3000/admin/dashboard
- ✅ **Meu Perfil**: http://localhost:3000/admin/perfil
- ✅ **Usuários**: http://localhost:3000/admin/usuarios
- ✅ **Clientes**: http://localhost:3000/admin/clientes
- ✅ **Profissionais**: http://localhost:3000/admin/profissionais
- ✅ **Fornecedores**: http://localhost:3000/admin/fornecedores
- ✅ **Procedimentos**: http://localhost:3000/admin/procedimentos
- ✅ **Produtos**: http://localhost:3000/admin/produtos
- ✅ **Pedidos**: http://localhost:3000/admin/pedidos
- ✅ **Agendamentos**: http://localhost:3000/admin/agendamentos
- ✅ **Avaliações**: http://localhost:3000/admin/avaliacoes
- ✅ **Mensagens**: http://localhost:3000/admin/mensagens
- ✅ **Financeiro**: http://localhost:3000/admin/financeiro
- ✅ **Relatórios**: http://localhost:3000/admin/relatorios
- ✅ **Categorias**: http://localhost:3000/admin/categorias
- ✅ **Notificações**: http://localhost:3000/admin/notificacoes
- ✅ **Logs**: http://localhost:3000/admin/logs
- ✅ **Backup**: http://localhost:3000/admin/backup
- ✅ **Integrações**: http://localhost:3000/admin/integracoes
- ✅ **Segurança**: http://localhost:3000/admin/seguranca
- ✅ **Configurações**: http://localhost:3000/admin/configuracoes
- ✅ **Debug Config**: http://localhost:3000/admin/configuracoes/debug

---

## 🤖 Sistema de Agentes IA (Admin/Avançado)

### Gestão de Agentes
- ✅ **Lista de Agentes**: http://localhost:3000/agentes
- ✅ **Novo Agente**: http://localhost:3000/agentes/novo
- ✅ **Detalhes do Agente**: http://localhost:3000/agentes/[id]
  - Exemplo: http://localhost:3000/agentes/1

### Chat e Conversas
- ✅ **Chat**: http://localhost:3000/chat
- ✅ **Conversa Específica**: http://localhost:3000/chat/[conversationToken]
  - Exemplo: http://localhost:3000/chat/abc123token
- ✅ **Lista de Conversas**: http://localhost:3000/conversas

### Ferramentas e Configurações
- ✅ **Tools**: http://localhost:3000/tools
- ✅ **MCP Servers**: http://localhost:3000/mcp
- ✅ **Novo MCP**: http://localhost:3000/mcp/new
- ✅ **Editar MCP**: http://localhost:3000/mcp/[id]/edit
  - Exemplo: http://localhost:3000/mcp/1/edit
- ✅ **Document Stores**: http://localhost:3000/document-stores
- ✅ **Knowledge Base**: http://localhost:3000/knowledge
- ✅ **Biblioteca**: http://localhost:3000/biblioteca

### Sistema e Usuários
- ✅ **Usuários**: http://localhost:3000/usuarios
- ✅ **Novo Usuário**: http://localhost:3000/usuarios/novo
- ✅ **Editar Usuário**: http://localhost:3000/usuarios/[userId]/editar
  - Exemplo: http://localhost:3000/usuarios/1/editar
- ✅ **API Keys**: http://localhost:3000/apikeys
- ✅ **Credenciais**: http://localhost:3000/credenciais
- ✅ **Variáveis**: http://localhost:3000/variaveis
- ✅ **Empresas**: http://localhost:3000/empresas
- ✅ **Perfis**: http://localhost:3000/perfis
- ✅ **Meu Perfil**: http://localhost:3000/perfil
- ✅ **Configurações**: http://localhost:3000/configuracoes

### Outros
- ✅ **Dashboard**: http://localhost:3000/dashboard
- ✅ **Novo**: http://localhost:3000/new
- ✅ **Nova Busca**: http://localhost:3000/new/search
- ✅ **Estúdio**: http://localhost:3000/estudio
- ✅ **Estúdio Wizard**: http://localhost:3000/estudio-wizard

---

## 💳 Billing/Assinaturas

- ✅ **Planos**: http://localhost:3000/billing/plans
- ✅ **Minha Assinatura**: http://localhost:3000/billing/subscription
- ✅ **Assinar Plano**: http://localhost:3000/billing/subscribe/[id]
  - Exemplo: http://localhost:3000/billing/subscribe/1
- ✅ **Pagamentos**: http://localhost:3000/billing/payments
- ✅ **Faturas**: http://localhost:3000/billing/invoices

---

## 🔌 API Routes (Backend)

### Autenticação
- ✅ **GET** http://localhost:3000/api/health
- ✅ **GET** http://localhost:3000/api/healthcheck
- ✅ **POST** http://localhost:3000/api/auth/register
- ✅ **POST** http://localhost:3000/api/auth/token
- ✅ **ALL** http://localhost:3000/api/auth/[...nextauth]

### Usuários
- ✅ **GET/POST** http://localhost:3000/api/users
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/users/[userId]
- ✅ **GET** http://localhost:3000/api/users/[userId]/sei
- ✅ **GET** http://localhost:3000/api/user/photo

### Agentes
- ✅ **GET/POST** http://localhost:3000/api/agentes
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/agentes/[id]
- ✅ **POST** http://localhost:3000/api/agentes/[id]/add-tool
- ✅ **POST** http://localhost:3000/api/agentes/[id]/remove-tool
- ✅ **GET/POST** http://localhost:3000/api/agentes/[id]/document-stores
- ✅ **DELETE** http://localhost:3000/api/agentes/[id]/document-stores/[storeId]
- ✅ **POST** http://localhost:3000/api/agentes/generate-prompt
- ✅ **GET** http://localhost:3000/api/agentes/conversation/[conversationToken]/messages

### Conversas e Chat
- ✅ **GET/POST** http://localhost:3000/api/conversas
- ✅ **GET/DELETE** http://localhost:3000/api/conversas/[conversationId]
- ✅ **POST** http://localhost:3000/api/conversas/[conversationId]/chat
- ✅ **GET** http://localhost:3000/api/conversas/[conversationId]/messages
- ✅ **POST** http://localhost:3000/api/conversas/[conversationId]/gerar-titulo
- ✅ **PUT** http://localhost:3000/api/conversas/[conversationId]/titulo

### Predictions
- ✅ **POST** http://localhost:3000/api/predictions/[id]

### API Keys
- ✅ **GET/POST** http://localhost:3000/api/apikeys
- ✅ **DELETE** http://localhost:3000/api/apikeys/[id]

### Credenciais
- ✅ **GET/POST** http://localhost:3000/api/credenciais
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/credenciais/[id]
- ✅ **GET** http://localhost:3000/api/credenciais/types

### Tools
- ✅ **GET/POST** http://localhost:3000/api/tools
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/tools/[id]

### Variáveis
- ✅ **GET/POST** http://localhost:3000/api/variaveis
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/variaveis/[id]

### Document Stores
- ✅ **GET/POST** http://localhost:3000/api/document-stores
- ✅ **DELETE** http://localhost:3000/api/document-stores/[id]/files/[fileId]

### Empresas
- ✅ **GET/POST** http://localhost:3000/api/empresas
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/empresas/[id]

### Perfis
- ✅ **GET/POST** http://localhost:3000/api/perfis
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/perfis/[id]

### Marketplace
- ✅ **GET** http://localhost:3000/api/marketplace
- ✅ **POST** http://localhost:3000/api/marketplace/instalar
- ✅ **POST** http://localhost:3000/api/marketplace/avaliar
- ✅ **GET** http://localhost:3000/api/marketplace/[id]/avaliacoes

### Prompt Library
- ✅ **GET/POST** http://localhost:3000/api/prompt-library
- ✅ **GET/PUT/DELETE** http://localhost:3000/api/prompt-library/[id]
- ✅ **POST** http://localhost:3000/api/prompt-library/[id]/use

### Billing
- ✅ **GET** http://localhost:3000/api/billing/plans
- ✅ **GET/POST** http://localhost:3000/api/billing/subscription
- ✅ **GET** http://localhost:3000/api/billing/payments
- ✅ **GET** http://localhost:3000/api/billing/invoices

---

## 📋 Checklist de Testes

### Testes de Navegação Básica
- [ ] Home page carrega corretamente
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Busca sem filtros
- [ ] Busca com filtros de tipo (procedimento/profissional)
- [ ] Busca com query text e localização

### Testes por Perfil de Usuário

#### Cliente (Paciente)
- [ ] Dashboard do cliente
- [ ] Ver procedimentos disponíveis
- [ ] Agendar procedimento
- [ ] Ver meus agendamentos
- [ ] Avaliar procedimento
- [ ] Ver favoritos
- [ ] Carrinho de compras
- [ ] Checkout

#### Profissional
- [ ] Dashboard do profissional
- [ ] Ver agenda
- [ ] Configurar horários
- [ ] Ver pacientes
- [ ] Acessar prontuário
- [ ] Criar nova anamnese
- [ ] Registrar evolução

#### Fornecedor
- [ ] Dashboard do fornecedor
- [ ] Gerenciar produtos
- [ ] Ver pedidos
- [ ] Controlar estoque
- [ ] Gerenciar entregas

#### Administrador
- [ ] Dashboard administrativo
- [ ] Gerenciar usuários
- [ ] Ver logs do sistema
- [ ] Configurações gerais
- [ ] Debug config

### Testes de API
- [ ] Health check
- [ ] Autenticação
- [ ] CRUD de usuários
- [ ] CRUD de agentes
- [ ] Conversas e mensagens
- [ ] Upload de arquivos
- [ ] Marketplace

---

## 🔧 Comandos para Testes

### Iniciar Frontend
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-web
yarn dev
```

### Iniciar Backend
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
make dev
# ou
uv run uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

### Testar API com cURL
```bash
# Health check
curl http://localhost:3000/api/health

# Healthcheck do backend
curl http://localhost:8080/health

# Testar endpoint com autenticação
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:8080/agentes
```

---

## 📝 Notas Importantes

1. **Autenticação**: A maioria das rotas requer autenticação. Use o sistema de login ou configure API keys.

2. **IDs Dinâmicos**: Rotas com `[id]`, `[userId]`, `[conversationToken]`, etc., são rotas dinâmicas que precisam de IDs válidos do banco de dados.

3. **Backend API**: Algumas funcionalidades dependem do backend rodando em `http://localhost:8080`.

4. **Perfis de Usuário**: Cada perfil (Cliente, Profissional, Fornecedor, Admin) tem acesso a diferentes menus e funcionalidades.

5. **Environment Variables**: Certifique-se de que o arquivo `.env.local` está configurado corretamente.

---

## 🎯 Prioridades de Teste

### Alta Prioridade
1. Páginas públicas (Home, Busca, Login, Cadastro)
2. Dashboard de cada tipo de usuário
3. Sistema de agendamento
4. Checkout e pagamentos
5. APIs de autenticação

### Média Prioridade
1. Gerenciamento de perfis
2. Sistema de avaliações
3. Marketplace
4. Mensagens entre usuários
5. Relatórios

### Baixa Prioridade
1. Sistema de agentes IA
2. Document stores
3. MCP servers
4. Configurações avançadas
5. Debug tools
