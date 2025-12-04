# 📍 Mapeamento Completo de Rotas - Frontend DoctorQ

> **Última atualização:** 06/11/2025 (Atualização v2.2 - Dashboards e Consolidação)
> **Total de rotas:** 116 páginas (+4 novas páginas implementadas)
> **Hooks SWR:** 58 hooks de API (+2 novos: useEquipe, useLimitesUsuarios)
> **Componentes:** 122 componentes React
> **Status:** ✅ Documentação sincronizada com código
> **Arquitetura:** Next.js 15 App Router com route groups

### 🆕 Novidades v2.2 (06/11/2025)
- ✅ **4 novas páginas de dashboard** implementadas (Clínica, Profissional, Agendas Consolidadas, Fornecedor)
- ✅ **Consolidação multi-clínica** para profissionais
- ✅ **Gestão de equipe** para clínicas com limites de usuários
- ✅ **Total: +4 páginas, +2 hooks SWR, ~1.071 linhas de código frontend**

### 🔧 Correção v2.2.1 (06/11/2025)
- ✅ **Corrigido conflito de rotas duplicadas** entre `(authenticated)/` e `(dashboard)/`
- ✅ **Removidas 3 páginas duplicadas** de `(authenticated)/` (clinica/dashboard, clinica/equipe, profissional/dashboard)
- ✅ **Movidas 2 páginas novas** para `(dashboard)/` (profissional/agendas-consolidadas, fornecedor/dashboard)
- ✅ **Diretório `(authenticated)/` removido** - todas páginas protegidas agora em `(dashboard)/`
- ✅ **Build validado** - 131 páginas compiladas com sucesso

---

## 🔄 Mudanças da Refatoração v2.0

A refatoração completa (29/10/2025) reorganizou toda a estrutura de rotas usando **Next.js 15 App Router** com **route groups**:

### Nova Organização de Pastas

```
app/
├── (auth)/                    # Route group - Autenticação (sem layout dashboard)
│   ├── login/
│   ├── registro/
│   └── oauth-callback/
├── (dashboard)/               # Route group - Áreas protegidas (com sidebar)
│   ├── admin/                 # Admin dashboard (33 rotas)
│   ├── paciente/              # Paciente dashboard (18 rotas)
│   ├── profissional/          # Profissional dashboard (21 rotas)
│   └── layout.tsx             # Shared layout com sidebar
├── marketplace/               # Público - E-commerce (10 rotas)
├── busca/                     # Público - Busca
├── chat/                      # Público - AI Chat
└── page.tsx                   # Landing page
```

### Benefícios da Nova Estrutura

✅ **Route Groups** - Organizadas por função ((auth), (dashboard))
✅ **Layouts Compartilhados** - Sidebar reutilizada em todas páginas dashboard
✅ **Colocation** - Componentes próximos às páginas (`_components/`)
✅ **TypeScript Paths** - Imports limpos (`@/app/*`, `@/components/*`)
✅ **Performance** - Server Components por padrão, Client Components apenas quando necessário

### Mudanças Principais

| Antes | Depois | Benefício |
|-------|--------|-----------|
| Estrutura flat | Route groups | Melhor organização |
| Layouts duplicados | Layout compartilhado | DRY |
| ~50 componentes | ~150 componentes | Reutilização |
| Build 45s | Build 27s | -40% tempo |
| Bundle ~180 kB | Bundle ~118 kB | -34% tamanho |

---

## 📋 Índice

1. [Rotas Públicas](#-rotas-públicas)
2. [Área de Administrador](#-área-de-administrador-admin)
3. [Área do Paciente/Cliente](#-área-do-pacientecliente-paciente)
4. [Área da Clínica](#-área-da-clínica-clinica)
5. [Área do Profissional](#-área-do-profissional-profissional)
6. [Área do Fornecedor](#-área-do-fornecedor-fornecedor)
6. [Área de Parceiros](#-área-de-parceiros-parceiros)
7. [Sistema de Billing](#-sistema-de-billing-billing)
8. [Marketplace](#-marketplace-marketplace)
9. [Sistema de IA](#-sistema-de-ia-estúdio)
10. [Biblioteca e Knowledge](#-biblioteca-e-knowledge-biblioteca)
11. [Configurações](#-configurações-configuracoes)
12. [Ajuda e Suporte](#-ajuda-e-suporte)
13. [Área Jurídica](#-área-jurídica-legal)
14. [Status de Implementação](#-status-de-implementação)

---

## 🌐 Rotas Públicas

### Landing e Marketing

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/` | `page.tsx` | ✅ Completo | Landing page principal |
| `/sobre` | `sobre/page.tsx` | ✅ Completo | Sobre a empresa |
| `/servicos` | `servicos/page.tsx` | ✅ Completo | Lista de serviços |
| `/servicos/[id]` | `servicos/[id]/page.tsx` | ✅ Completo | Detalhes de serviço |
| `/blog` | `blog/page.tsx` | ✅ Completo | Blog/artigos |
| `/blog/[slug]` | `blog/[slug]/page.tsx` | ✅ Completo | Artigo individual |
| `/changelog` | `changelog/page.tsx` | ✅ Completo | Histórico de versões |
| `/roadmap` | `roadmap/page.tsx` | ✅ Completo | Roadmap do produto |
| `/status` | `status/page.tsx` | ✅ Completo | Status dos serviços |
| `/novidades` | `novidades/page.tsx` | ✅ Completo | Novidades e updates |
| `/comunidade` | `comunidade/page.tsx` | ✅ Completo | Comunidade DoctorQ |
| `/eventos` | `eventos/page.tsx` | ✅ Completo | Eventos e webinars |
| `/eventos/[id]` | `eventos/[id]/page.tsx` | ✅ Completo | Detalhes do evento |

### Autenticação

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/login` | `login/page.tsx` | ✅ Completo | Página de login (OAuth + Credentials) |
| `/cadastro` | `cadastro/page.tsx` | ✅ Completo | Registro de novo usuário |

### Busca e Descoberta

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/busca` | `busca/page.tsx` | ✅ Completo | Busca global |
| `/busca-inteligente` | `busca-inteligente/page.tsx` | ✅ Completo | Busca com IA |
| `/pesquisa` | `pesquisa/page.tsx` | ✅ Completo | Pesquisa avançada |
| `/profissionais` | `profissionais/page.tsx` | ✅ Completo | Lista de profissionais |
| `/profissionais/[id]` | `profissionais/[id]/page.tsx` | ✅ Completo | Perfil do profissional |
| `/profissionais/lista` | `profissionais/lista/page.tsx` | ✅ Completo | Lista filtrada |
| `/fornecedores` | `fornecedores/page.tsx` | ✅ Completo | Lista de fornecedores |
| `/fornecedores/[id]` | `fornecedores/[id]/page.tsx` | ✅ Completo | Perfil do fornecedor |

### Procedimentos

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/procedimentos` | `procedimentos/page.tsx` | ✅ Completo | Catálogo de procedimentos |
| `/procedimentos/[id]` | `procedimentos/[id]/page.tsx` | ✅ Completo | Detalhes do procedimento |
| `/procedimento/[id]` | `procedimento/[id]/page.tsx` | ✅ Completo | (Alternativo) Detalhes |
| `/procedimento/[id]/agendar` | `procedimento/[id]/agendar/page.tsx` | ✅ Completo | Agendar procedimento |

### Agendamento (Público)

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/agendamento/tipo-visita` | `agendamento/tipo-visita/page.tsx` | ✅ Completo | Passo 1: Tipo de visita |
| `/agendamento/dados-paciente` | `agendamento/dados-paciente/page.tsx` | ✅ Completo | Passo 2: Dados do paciente |
| `/agendamento/confirmar` | `agendamento/confirmar/page.tsx` | ✅ Completo | Passo 3: Confirmação |

### Produtos (Público)

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/produtos` | `produtos/page.tsx` | ✅ Completo | Catálogo de produtos |
| `/produtos/[id]` | `produtos/[id]/page.tsx` | ✅ Completo | Detalhes do produto |

### Avaliações

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/avaliacoes` | `avaliacoes/page.tsx` | ✅ Completo | Avaliações públicas |
| `/avaliar/[token]` | `avaliar/[token]/page.tsx` | ✅ Completo | Avaliar com token |

### Contato

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/contato` | `contato/page.tsx` | ✅ Completo | Formulário de contato |
| `/suporte` | `suporte/page.tsx` | ✅ Completo | Central de suporte |

---

## 👨‍💼 Área de Administrador (`/admin`)

### Dashboard e Visão Geral

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/dashboard` | `admin/dashboard/page.tsx` | ✅ Completo | Dashboard administrativo |
| `/admin/relatorios` | `admin/relatorios/page.tsx` | ✅ Completo | Relatórios gerenciais |

### Inteligência Artificial

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/estudio` | `admin/estudio/page.tsx` | ✅ Completo | **NOVO** Estúdio de IA |
| `/admin/agentes` | `admin/agentes/page.tsx` | ✅ Completo | Gerenciar agentes de IA |
| `/admin/conversas` | `admin/conversas/page.tsx` | ✅ Completo | **NOVO** Histórico de conversas |
| `/admin/tools` | `admin/tools/page.tsx` | ✅ Completo | Ferramentas e integrações |
| `/admin/apikeys` | `admin/apikeys/page.tsx` | ✅ Completo | Chaves de API |
| `/admin/credenciais` | `admin/credenciais/page.tsx` | ✅ Completo | Credenciais criptografadas |
| `/admin/knowledge` | `admin/knowledge/page.tsx` | ✅ Completo | Base de conhecimento |

### Gestão de Usuários e Empresas

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/usuarios` | `admin/usuarios/page.tsx` | ✅ Completo | Gerenciar usuários |
| `/admin/empresas` | `admin/empresas/page.tsx` | ✅ Completo | Gerenciar empresas |
| `/admin/perfis` | `admin/perfis/page.tsx` | ✅ Completo | Perfis e permissões (RBAC) |
| `/admin/clientes` | `admin/clientes/page.tsx` | ✅ Completo | Gerenciar clientes |
| `/admin/profissionais` | `admin/profissionais/page.tsx` | ✅ Completo | Gerenciar profissionais |
| `/admin/fornecedores` | `admin/fornecedores/page.tsx` | ✅ Completo | Gerenciar fornecedores |
| `/admin/clinicas` | `admin/clinicas/page.tsx` | ✅ Completo | Gerenciar clínicas |

### Operações

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/agendamentos` | `admin/agendamentos/page.tsx` | ✅ Completo | Todos os agendamentos |
| `/admin/procedimentos` | `admin/procedimentos/page.tsx` | ✅ Completo | Catálogo de procedimentos |
| `/admin/produtos` | `admin/produtos/page.tsx` | ✅ Completo | Gerenciar produtos |
| `/admin/pedidos` | `admin/pedidos/page.tsx` | ✅ Completo | Todos os pedidos |
| `/admin/avaliacoes` | `admin/avaliacoes/page.tsx` | ✅ Completo | Moderação de avaliações |
| `/admin/categorias` | `admin/categorias/page.tsx` | ✅ Completo | Categorias de produtos |

### Comunicação

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/mensagens` | `admin/mensagens/page.tsx` | ✅ Completo | Central de mensagens |
| `/admin/notificacoes` | `admin/notificacoes/page.tsx` | ✅ Completo | Notificações do sistema |

### Financeiro

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/financeiro` | `admin/financeiro/page.tsx` | ✅ Completo | Visão financeira |
| `/admin/pagamentos` | `admin/pagamentos/page.tsx` | ✅ Completo | Histórico de pagamentos |
| `/admin/licencas` | `admin/licencas/page.tsx` | ✅ Completo | Gerenciar licenças |

### Sistema

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/logs` | `admin/logs/page.tsx` | ✅ Completo | Logs do sistema |
| `/admin/backup` | `admin/backup/page.tsx` | ✅ Completo | Backup e restauração |
| `/admin/integracoes` | `admin/integracoes/page.tsx` | ✅ Completo | Integrações externas |
| `/admin/seguranca` | `admin/seguranca/page.tsx` | ✅ Completo | Configurações de segurança |
| `/admin/configuracoes` | `admin/configuracoes/page.tsx` | ✅ Completo | Configurações gerais |

### Perfil Admin

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/admin/perfil` | `admin/perfil/page.tsx` | ✅ Completo | Perfil do administrador |

---

## 👤 Área do Paciente/Cliente (`/paciente`)

### Dashboard e Visão Geral

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/paciente/dashboard` | `paciente/dashboard/page.tsx` | ✅ Completo | Dashboard do paciente |
| `/paciente/perfil` | `paciente/perfil/page.tsx` | ✅ Completo | Perfil e informações |

### Serviços e Atendimento

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/paciente/procedimentos` | `paciente/procedimentos/page.tsx` | ✅ Completo | Procedimentos disponíveis |
| `/paciente/procedimentos/[id]` | `paciente/procedimentos/[id]/page.tsx` | ✅ Completo | Detalhes do procedimento |
| `/paciente/agendamentos` | `paciente/agendamentos/page.tsx` | ✅ Completo | Meus agendamentos |
| `/paciente/agendamentos/novo` | `paciente/agendamentos/novo/page.tsx` | ✅ Completo | Novo agendamento |
| `/paciente/avaliacoes` | `paciente/avaliacoes/page.tsx` | ✅ Completo | Minhas avaliações |
| `/paciente/favoritos` | `paciente/favoritos/page.tsx` | ✅ Completo | Profissionais favoritos |

### Prontuário e Saúde

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/paciente/anamnese` | `paciente/anamnese/page.tsx` | ✅ Completo | Anamnese digital |
| `/paciente/fotos` | `paciente/fotos/page.tsx` | ✅ Completo | Galeria de fotos (antes/depois) |
| `/paciente/albums` | `paciente/albums/page.tsx` | ✅ Completo | Álbuns de fotos |
| `/paciente/albums/[id]` | `paciente/albums/[id]/page.tsx` | ✅ Completo | Visualizar álbum |

### Marketplace e Compras

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/paciente/pedidos` | `paciente/pedidos/page.tsx` | ✅ Completo | Meus pedidos |
| `/paciente/pedidos/[id]` | `paciente/pedidos/[id]/page.tsx` | ✅ Completo | Detalhes do pedido |
| `/paciente/cupons` | `paciente/cupons/page.tsx` | ✅ Completo | Meus cupons de desconto |

### Financeiro

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/paciente/financeiro` | `paciente/financeiro/page.tsx` | ✅ Completo | Visão financeira |
| `/paciente/pagamentos` | `paciente/pagamentos/page.tsx` | ✅ Completo | Histórico de pagamentos |

### Comunicação

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/paciente/mensagens` | `paciente/mensagens/page.tsx` | ✅ Completo | Mensagens |
| `/paciente/notificacoes` | `paciente/notificacoes/page.tsx` | ✅ Completo | Notificações |

### Configurações

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/paciente/configuracoes` | `paciente/configuracoes/page.tsx` | ✅ Completo | Configurações da conta |

---

## 🏥 Área da Clínica (`/clinica`)

### Dashboard e Visão Geral

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/clinica/dashboard` | `clinica/dashboard/page.tsx` | ✅ Completo | **NOVO** Dashboard da clínica com estatísticas |
| `/clinica/equipe` | `clinica/equipe/page.tsx` | ✅ Completo | **NOVO** Gestão de equipe e sub-usuários |

---

## 👨‍⚕️ Área do Profissional (`/profissional`)

### Dashboard e Visão Geral

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/dashboard` | `profissional/dashboard/page.tsx` | ✅ Completo | Dashboard do profissional |
| `/profissional/perfil` | `profissional/perfil/page.tsx` | ✅ Completo | Perfil profissional |
| `/profissional/[id]` | `profissional/[id]/page.tsx` | ✅ Completo | Perfil público |

### Agenda e Atendimento

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/agenda` | `profissional/agenda/page.tsx` | ✅ Completo | Agenda de atendimentos |
| `/profissional/agendas-consolidadas` | `profissional/agendas-consolidadas/page.tsx` | ✅ Completo | **NOVO** Visão unificada de agendas de todas as clínicas |
| `/profissional/agenda/configuracoes` | `profissional/agenda/configuracoes/page.tsx` | ✅ Completo | Config. da agenda |
| `/profissional/horarios` | `profissional/horarios/page.tsx` | ✅ Completo | Disponibilidade de horários |

### Pacientes

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/pacientes` | `profissional/pacientes/page.tsx` | ✅ Completo | Lista de pacientes |
| `/profissional/pacientes/[id]` | `profissional/pacientes/[id]/page.tsx` | ✅ Completo | Ficha do paciente |

### Prontuário Eletrônico

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/prontuarios` | `profissional/prontuarios/page.tsx` | ✅ Completo | Lista de prontuários |
| `/profissional/prontuario` | `profissional/prontuario/page.tsx` | ✅ Completo | Visualização geral |
| `/profissional/prontuario/[id_paciente]` | `profissional/prontuario/[id_paciente]/page.tsx` | ✅ Completo | Prontuário do paciente |
| `/profissional/prontuario/[id_paciente]/anamnese/nova` | `profissional/prontuario/[id_paciente]/anamnese/nova/page.tsx` | ✅ Completo | Nova anamnese |
| `/profissional/prontuario/[id_paciente]/nova-evolucao` | `profissional/prontuario/[id_paciente]/nova-evolucao/page.tsx` | ✅ Completo | Nova evolução |

### Gestão

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/procedimentos` | `profissional/procedimentos/page.tsx` | ✅ Completo | Procedimentos oferecidos |
| `/profissional/avaliacoes` | `profissional/avaliacoes/page.tsx` | ✅ Completo | Avaliações recebidas |
| `/profissional/certificados` | `profissional/certificados/page.tsx` | ✅ Completo | Certificados e qualificações |

### Comunicação

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/mensagens` | `profissional/mensagens/page.tsx` | ✅ Completo | Mensagens |

### Financeiro

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/financeiro` | `profissional/financeiro/page.tsx` | ✅ Completo | Financeiro |
| `/profissional/relatorios` | `profissional/relatorios/page.tsx` | ✅ Completo | Relatórios |

### Configurações

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/profissional/configuracoes` | `profissional/configuracoes/page.tsx` | ✅ Completo | Configurações |

---

## 🏭 Área do Fornecedor (`/fornecedor`)

### Dashboard e Visão Geral

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/fornecedor/dashboard` | `fornecedor/dashboard/page.tsx` | ✅ Completo | Dashboard do fornecedor |
| `/fornecedor/perfil` | `fornecedor/perfil/page.tsx` | ✅ Completo | Perfil da empresa |

### Produtos

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/fornecedor/produtos` | `fornecedor/produtos/page.tsx` | ✅ Completo | Meus produtos |
| `/fornecedor/catalogo` | `fornecedor/catalogo/page.tsx` | ✅ Completo | Catálogo completo |
| `/fornecedor/estoque` | `fornecedor/estoque/page.tsx` | ✅ Completo | Controle de estoque |
| `/fornecedor/promocoes` | `fornecedor/promocoes/page.tsx` | ✅ Completo | Promoções ativas |

### Vendas

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/fornecedor/pedidos` | `fornecedor/pedidos/page.tsx` | ✅ Completo | Pedidos recebidos |
| `/fornecedor/entregas` | `fornecedor/entregas/page.tsx` | ✅ Completo | Gestão de entregas |
| `/fornecedor/notas-fiscais` | `fornecedor/notas-fiscais/page.tsx` | ✅ Completo | Notas fiscais |

### Gestão

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/fornecedor/clientes` | `fornecedor/clientes/page.tsx` | ✅ Completo | Clientes |
| `/fornecedor/avaliacoes` | `fornecedor/avaliacoes/page.tsx` | ✅ Completo | Avaliações recebidas |
| `/fornecedor/mensagens` | `fornecedor/mensagens/page.tsx` | ✅ Completo | Mensagens |

### Financeiro

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/fornecedor/financeiro` | `fornecedor/financeiro/page.tsx` | ✅ Completo | Financeiro |
| `/fornecedor/relatorios` | `fornecedor/relatorios/page.tsx` | ✅ Completo | Relatórios de vendas |

### Configurações

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/fornecedor/configuracoes` | `fornecedor/configuracoes/page.tsx` | ✅ Completo | Configurações |

---

## 🤝 Área de Parceiros (`/parceiros`)

### Gestão de Parcerias

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/parceiros` | `parceiros/page.tsx` | ✅ Completo | Portal de parceiros |
| `/parceiros/novo` | `parceiros/novo/page.tsx` | ✅ Completo | Cadastro de parceiro |
| `/parceiros/sucesso` | `parceiros/sucesso/page.tsx` | ✅ Completo | Confirmação de cadastro |
| `/parceiros/[id]` | `parceiros/[id]/page.tsx` | ✅ Completo | Detalhes do parceiro |
| `/parceiros/cadastro` | `parceiros/cadastro/page.tsx` | ✅ Completo | Formulário de cadastro |

### Programa de Parceiros

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/parceiros/beneficios` | `parceiros/beneficios/page.tsx` | ✅ Completo | Benefícios do programa |
| `/parceiros/propostas` | `parceiros/propostas/page.tsx` | ✅ Completo | Propostas comerciais |
| `/parceiros/contratos` | `parceiros/contratos/page.tsx` | ✅ Completo | Contratos |
| `/parceiros/contratos/[id]` | `parceiros/contratos/[id]/page.tsx` | ✅ Completo | Visualizar contrato |

### Gestão

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/parceiros/desempenho` | `parceiros/desempenho/page.tsx` | ✅ Completo | Métricas de desempenho |
| `/parceiros/relatorios` | `parceiros/relatorios/page.tsx` | ✅ Completo | Relatórios |
| `/parceiros/documentos` | `parceiros/documentos/page.tsx` | ✅ Completo | Documentação |

### Comunicação

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/parceiros/comunicacao` | `parceiros/comunicacao/page.tsx` | ✅ Completo | Central de comunicação |
| `/parceiros/suporte` | `parceiros/suporte/page.tsx` | ✅ Completo | Suporte especializado |

---

## 💳 Sistema de Billing (`/billing`)

### Assinaturas

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/billing/plans` | `billing/plans/page.tsx` | ✅ Completo | Planos disponíveis |
| `/billing/planos` | `billing/planos/page.tsx` | ✅ Completo | (Alternativo) Planos |
| `/billing/subscription` | `billing/subscription/page.tsx` | ✅ Completo | Minha assinatura |
| `/billing/subscribe/[id]` | `billing/subscribe/[id]/page.tsx` | ✅ Completo | Assinar plano |
| `/billing/upgrade` | `billing/upgrade/page.tsx` | ✅ Completo | Upgrade de plano |
| `/billing/cancelamento` | `billing/cancelamento/page.tsx` | ✅ Completo | Cancelar assinatura |

### Pagamentos

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/billing/payments` | `billing/payments/page.tsx` | ✅ Completo | Histórico de pagamentos |
| `/billing/metodo-pagamento` | `billing/metodo-pagamento/page.tsx` | ✅ Completo | Métodos de pagamento |
| `/billing/historico` | `billing/historico/page.tsx` | ✅ Completo | Histórico completo |

### Faturas

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/billing/invoices` | `billing/invoices/page.tsx` | ✅ Completo | Faturas |
| `/billing/faturas/[id]` | `billing/faturas/[id]/page.tsx` | ✅ Completo | Visualizar fatura |

---

## 🛒 Marketplace (`/marketplace`)

### Navegação e Compras

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/marketplace` | `marketplace/page.tsx` | ✅ Completo | Home do marketplace |
| `/marketplace/[id]` | `marketplace/[id]/page.tsx` | ✅ Completo | Detalhes do produto |
| `/marketplace/carrinho` | `marketplace/carrinho/page.tsx` | ✅ Completo | Carrinho de compras |
| `/marketplace/busca` | `marketplace/busca/page.tsx` | ✅ Completo | Busca no marketplace |

### Categorização

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/marketplace/categoria/[slug]` | `marketplace/categoria/[slug]/page.tsx` | ✅ Completo | Produtos por categoria |
| `/marketplace/marcas` | `marketplace/marcas/page.tsx` | ✅ Completo | Produtos por marca |
| `/marketplace/novidades` | `marketplace/novidades/page.tsx` | ✅ Completo | Novidades |
| `/marketplace/ofertas` | `marketplace/ofertas/page.tsx` | ✅ Completo | Ofertas especiais |

### Avaliações e Comparação

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/marketplace/avaliacoes` | `marketplace/avaliacoes/page.tsx` | ✅ Completo | Avaliações de produtos |
| `/marketplace/comparar` | `marketplace/comparar/page.tsx` | ✅ Completo | Comparar produtos |

---

## 🤖 Sistema de IA (Estúdio)

### Estúdio Principal

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/estudio` | `estudio/page.tsx` | ✅ Completo | Hub do estúdio |
| `/estudio-wizard` | `estudio-wizard/page.tsx` | ✅ Completo | Wizard de configuração |

### Agentes

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/agentes` | `agentes/page.tsx` | ✅ Completo | Lista de agentes |
| `/agentes/novo` | `agentes/novo/page.tsx` | ✅ Completo | Criar novo agente |
| `/agentes/[id]` | `agentes/[id]/page.tsx` | ✅ Completo | Editar agente |
| `/estudio/agentes` | `estudio/agentes/page.tsx` | ✅ Completo | Gerenciar agentes |

### Conversas e Chat

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/conversas` | `conversas/page.tsx` | ✅ Completo | Todas as conversas |
| `/chat` | `chat/page.tsx` | ✅ Completo | Interface de chat |
| `/chat/[conversationToken]` | `chat/[conversationToken]/page.tsx` | ✅ Completo | Chat específico |
| `/estudio/conversas` | `estudio/conversas/page.tsx` | ✅ Completo | Gerenciar conversas |

### Ferramentas e Configurações

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/tools` | `tools/page.tsx` | ✅ Completo | Ferramentas disponíveis |
| `/estudio/templates` | `estudio/templates/page.tsx` | ✅ Completo | Templates de agentes |
| `/estudio/playground` | `estudio/playground/page.tsx` | ✅ Completo | Playground de testes |
| `/estudio/configuracoes` | `estudio/configuracoes/page.tsx` | ✅ Completo | Configurações |

### Analytics e Documentos

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/estudio/analytics` | `estudio/analytics/page.tsx` | ✅ Completo | Analytics de IA |
| `/estudio/documentos` | `estudio/documentos/page.tsx` | ✅ Completo | Documentos processados |

### MCP (Model Context Protocol)

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/mcp` | `mcp/page.tsx` | ✅ Completo | Gerenciar MCP servers |
| `/mcp/new` | `mcp/new/page.tsx` | ✅ Completo | Novo MCP server |
| `/mcp/[id]/edit` | `mcp/[id]/edit/page.tsx` | ✅ Completo | Editar MCP server |

### Inteligência Artificial (Geral)

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/inteligencia-artificial` | `inteligencia-artificial/page.tsx` | ✅ Completo | Hub de IA |

---

## 📚 Biblioteca e Knowledge (`/biblioteca`)

### Navegação

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/biblioteca` | `biblioteca/page.tsx` | ✅ Completo | Biblioteca principal |
| `/biblioteca/[id]` | `biblioteca/[id]/page.tsx` | ✅ Completo | Visualizar documento |
| `/knowledge` | `knowledge/page.tsx` | ✅ Completo | Base de conhecimento |

### Organização

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/biblioteca/categorias` | `biblioteca/categorias/page.tsx` | ✅ Completo | Categorias |
| `/biblioteca/tags` | `biblioteca/tags/page.tsx` | ✅ Completo | Tags |
| `/biblioteca/documentos` | `biblioteca/documentos/page.tsx` | ✅ Completo | Todos os documentos |

### Busca e Upload

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/biblioteca/busca` | `biblioteca/busca/page.tsx` | ✅ Completo | Buscar documentos |
| `/biblioteca/upload` | `biblioteca/upload/page.tsx` | ✅ Completo | Upload de documentos |
| `/biblioteca/compartilhados` | `biblioteca/compartilhados/page.tsx` | ✅ Completo | Docs compartilhados |

### Document Stores

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/document-stores` | `document-stores/page.tsx` | ✅ Completo | Gerenciar stores |

---

## ⚙️ Configurações (`/configuracoes`)

### Configurações Gerais

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/configuracoes` | `configuracoes/page.tsx` | ✅ Completo | Hub de configurações |

### Conta e Perfil

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/configuracoes/conta` | `configuracoes/conta/page.tsx` | ✅ Completo | Dados da conta |
| `/configuracoes/seguranca` | `configuracoes/seguranca/page.tsx` | ✅ Completo | Segurança |
| `/configuracoes/privacidade` | `configuracoes/privacidade/page.tsx` | ✅ Completo | Privacidade |

### Aparência

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/configuracoes/aparencia` | `configuracoes/aparencia/page.tsx` | ✅ Completo | Aparência |
| `/configuracoes/tema` | `configuracoes/tema/page.tsx` | ✅ Completo | Tema (claro/escuro) |
| `/configuracoes/acessibilidade` | `configuracoes/acessibilidade/page.tsx` | ✅ Completo | Acessibilidade |
| `/configuracoes/idioma` | `configuracoes/idioma/page.tsx` | ✅ Completo | Idioma |

### Notificações

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/configuracoes/notificacoes` | `configuracoes/notificacoes/page.tsx` | ✅ Completo | Preferências de notif. |
| `/configuracoes/preferencias` | `configuracoes/preferencias/page.tsx` | ✅ Completo | Preferências gerais |

### Integrações e API

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/configuracoes/integracoes` | `configuracoes/integracoes/page.tsx` | ✅ Completo | Integrações |
| `/configuracoes/api` | `configuracoes/api/page.tsx` | ✅ Completo | Configurações de API |
| `/configuracoes/conexoes` | `configuracoes/conexoes/page.tsx` | ✅ Completo | Conexões externas |

### Dados e Sistema

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/configuracoes/backup` | `configuracoes/backup/page.tsx` | ✅ Completo | Backup de dados |
| `/configuracoes/exportar-dados` | `configuracoes/exportar-dados/page.tsx` | ✅ Completo | Exportar dados (LGPD) |
| `/configuracoes/avancado` | `configuracoes/avancado/page.tsx` | ✅ Completo | Configurações avançadas |
| `/configuracoes/desenvolvedor` | `configuracoes/desenvolvedor/page.tsx` | ✅ Completo | Ferramentas dev |

---

## 🆘 Ajuda e Suporte

### Central de Ajuda

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/ajuda` | `ajuda/page.tsx` | ✅ Completo | Central de ajuda |
| `/ajuda/primeiros-passos` | `ajuda/primeiros-passos/page.tsx` | ✅ Completo | Guia inicial |
| `/faq` | `faq/page.tsx` | ✅ Completo | Perguntas frequentes |
| `/tutoriais` | `tutoriais/page.tsx` | ✅ Completo | Tutoriais |

### Tópicos Específicos

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/ajuda/agendamentos` | `ajuda/agendamentos/page.tsx` | ✅ Completo | Ajuda: Agendamentos |
| `/ajuda/pagamentos` | `ajuda/pagamentos/page.tsx` | ✅ Completo | Ajuda: Pagamentos |
| `/ajuda/categorias` | `ajuda/categorias/page.tsx` | ✅ Completo | Ajuda: Categorias |

---

## ⚖️ Área Jurídica (`/legal`)

### Documentos Legais

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/politica-privacidade` | `politica-privacidade/page.tsx` | ✅ Completo | Política de privacidade |
| `/termos-servico` | `termos-servico/page.tsx` | ✅ Completo | Termos de serviço |
| `/legal/termos` | `legal/termos/page.tsx` | ✅ Completo | (Alternativo) Termos |
| `/legal/privacidade` | `legal/privacidade/page.tsx` | ✅ Completo | (Alternativo) Privacidade |

### LGPD e Conformidade

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/legal/lgpd` | `legal/lgpd/page.tsx` | ✅ Completo | Conformidade LGPD |
| `/legal/cookies` | `legal/cookies/page.tsx` | ✅ Completo | Política de cookies |
| `/legal/acessibilidade` | `legal/acessibilidade/page.tsx` | ✅ Completo | Declaração de acess. |

---

## 🔄 Outras Rotas

### Checkout

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/checkout` | `checkout/page.tsx` | ✅ Completo | Checkout |
| `/checkout/sucesso` | `checkout/sucesso/page.tsx` | ✅ Completo | Confirmação de compra |

### Gestão Geral

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/dashboard` | `dashboard/page.tsx` | ✅ Completo | Dashboard genérico |
| `/perfil` | `perfil/page.tsx` | ✅ Completo | Perfil genérico |
| `/usuarios` | `usuarios/page.tsx` | ✅ Completo | Gestão de usuários |
| `/usuarios/novo` | `usuarios/novo/page.tsx` | ✅ Completo | Novo usuário |
| `/usuarios/[userId]/editar` | `usuarios/[userId]/editar/page.tsx` | ✅ Completo | Editar usuário |
| `/empresas` | `empresas/page.tsx` | ✅ Completo | Gestão de empresas |
| `/perfis` | `perfis/page.tsx` | ✅ Completo | Gestão de perfis (RBAC) |
| `/relatorios` | `relatorios/page.tsx` | ✅ Completo | Relatórios |

### Outros

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/agenda` | `agenda/page.tsx` | ✅ Completo | Agenda geral |
| `/agendamentos/[id]` | `agendamentos/[id]/page.tsx` | ✅ Completo | Detalhes agendamento |
| `/pedidos/[id]` | `pedidos/[id]/page.tsx` | ✅ Completo | Detalhes do pedido |
| `/cupons` | `cupons/page.tsx` | ✅ Completo | Gestão de cupons |
| `/variaveis` | `variaveis/page.tsx` | ✅ Completo | Variáveis do sistema |
| `/apikeys` | `apikeys/page.tsx` | ✅ Completo | Chaves de API |
| `/credenciais` | `credenciais/page.tsx` | ✅ Completo | Credenciais |
| `/demo` | `demo/page.tsx` | ✅ Completo | Demonstração |
| `/notificacoes-todas` | `notificacoes-todas/page.tsx` | ✅ Completo | Todas as notificações |

### Onboarding

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/onboarding` | `onboarding/page.tsx` | ✅ Completo | Onboarding inicial |
| `/onboarding/step-1` | `onboarding/step-1/page.tsx` | ✅ Completo | Passo 1 |
| `/onboarding/step-2` | `onboarding/step-2/page.tsx` | ✅ Completo | Passo 2 |
| `/onboarding/step-3` | `onboarding/step-3/page.tsx` | ✅ Completo | Passo 3 |

### Criação Rápida

| Rota | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| `/new` | `new/page.tsx` | ✅ Completo | Criar novo (genérico) |
| `/new/search` | `new/search/page.tsx` | ✅ Completo | Nova busca |

---

## 📊 Status de Implementação

### Legenda

| Símbolo | Status | Descrição |
|---------|--------|-----------|
| ✅ | Completo | Interface implementada (mock data) |
| 🔌 | Conectado | Interface + Backend conectado |
| ⚠️ | Parcial | Implementação incompleta |
| ❌ | Pendente | Não implementado |

### Estatísticas Gerais

- **Total de Rotas:** 248 páginas
- **Rotas Públicas:** 42 páginas
- **Área Admin:** 33 páginas
- **Área Paciente:** 18 páginas
- **Área Profissional:** 21 páginas
- **Área Fornecedor:** 14 páginas
- **Área Parceiros:** 13 páginas
- **Sistema de IA:** 18 páginas
- **Marketplace:** 10 páginas
- **Biblioteca:** 8 páginas
- **Billing:** 12 páginas
- **Configurações:** 17 páginas
- **Ajuda:** 6 páginas
- **Legal:** 6 páginas
- **Outras:** 30 páginas

### Status por Categoria

#### ✅ 100% Implementado (UI)
Todas as 248 páginas possuem interface completa com:
- Layout responsivo
- Componentes UI (Shadcn/Radix)
- Mock data para visualização
- Navegação funcional
- Tema consistente

#### 🔌 Conectado ao Backend (~15%)
Rotas com backend funcional:
- `/login` - Autenticação OAuth + Credentials
- `/admin/agentes` - CRUD de agentes
- `/admin/conversas` - Histórico de conversas
- `/admin/empresas` - Gestão de empresas
- `/admin/usuarios` - Gestão de usuários
- `/admin/perfis` - RBAC
- Alguns endpoints de marketplace
- Alguns endpoints de billing

#### 🚧 Próximos Passos

**Prioridade Alta:**
1. Conectar autenticação em todas as rotas protegidas
2. Implementar APIs de agendamento
3. Conectar marketplace ao backend
4. Implementar sistema de pagamentos
5. Conectar prontuário eletrônico

**Prioridade Média:**
6. Conectar sistema de avaliações
7. Implementar upload de fotos
8. Conectar mensagens em tempo real
9. Implementar notificações
10. Conectar relatórios

**Prioridade Baixa:**
11. Conectar sistema de parceiros
12. Implementar analytics
13. Conectar cupons
14. Implementar webhooks
15. Sistema de backup

---

## 🧪 Como Testar

### 1. Desenvolvimento Local

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-web
yarn dev
```

Acesse: `http://localhost:3000`

### 2. Rotas Públicas (Sem Autenticação)

- Landing: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Cadastro: `http://localhost:3000/cadastro`
- Procedimentos: `http://localhost:3000/procedimentos`
- Profissionais: `http://localhost:3000/profissionais`
- Marketplace: `http://localhost:3000/marketplace`
- Blog: `http://localhost:3000/blog`

### 3. Rotas Protegidas (Requer Autenticação)

**Admin:**
```
http://localhost:3000/admin/dashboard
http://localhost:3000/admin/estudio
http://localhost:3000/admin/agentes
http://localhost:3000/admin/conversas
```

**Paciente:**
```
http://localhost:3000/paciente/dashboard
http://localhost:3000/paciente/agendamentos
http://localhost:3000/paciente/fotos
```

**Profissional:**
```
http://localhost:3000/profissional/dashboard
http://localhost:3000/profissional/agenda
http://localhost:3000/profissional/prontuarios
```

**Fornecedor:**
```
http://localhost:3000/fornecedor/dashboard
http://localhost:3000/fornecedor/produtos
http://localhost:3000/fornecedor/pedidos
```

### 4. Credenciais de Teste

Configurar em `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
API_DOCTORQ_API_KEY=vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

**Backend deve estar rodando:**
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
make dev
```

---

## 📝 Notas de Desenvolvimento (Pós-Refatoração)

### Padrões de Arquivo (Nova Estrutura)

```
src/
└── app/
    ├── (dashboard)/                    # Route group com layout compartilhado
    │   └── [area]/                     # admin, paciente, profissional
    │       └── [recurso]/              # agentes, usuarios, etc.
    │           ├── _components/        # ✨ Componentes específicos da rota
    │           │   └── RecursoTable.tsx
    │           ├── page.tsx            # Página principal
    │           ├── loading.tsx         # Loading state (opcional)
    │           └── error.tsx           # Error boundary (opcional)
    └── marketplace/                    # Rota pública (sem dashboard layout)
        └── [produto]/
            └── page.tsx
```

### Estrutura Típica de Página (Atualizado)

```typescript
'use client'; // Apenas se necessário (hooks, state, eventos)

import { useState } from 'react';
import { useRecursos } from '@/lib/api/hooks'; // ✨ Hook SWR centralizado
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { DataTable } from '@/components/shared/data-table/DataTable';
import { RecursoFormDialog } from './_components/RecursoFormDialog'; // ✨ Colocation

export default function RecursosPage() {
  // 1. Hooks de dados
  const { data, meta, isLoading } = useRecursos({ page: 1, size: 25 });

  // 2. State local
  const [dialogOpen, setDialogOpen] = useState(false);

  // 3. Handlers
  const handleNovoRecurso = () => setDialogOpen(true);

  // 4. Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Recursos"
          description="Gerencie todos os recursos"
        />

        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
        />

        <RecursoFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </div>
  );
}
```

### Componentes Reutilizáveis (Nova Estrutura)

Localizados em `/src/components`:

```
components/
├── shared/                          # ✨ Componentes compartilhados
│   ├── layout/                      # PageHeader, Sidebar, Footer
│   ├── forms/                       # FormDialog, FormField
│   ├── data-table/                  # DataTable, Pagination (reutilizável)
│   ├── feedback/                    # LoadingState, ErrorState, EmptyState
│   └── navigation/                  # Breadcrumbs, Menu
├── dashboard/                       # Widgets específicos de dashboard
├── chat/                            # Componentes de chat
├── calendar/                        # Componentes de calendário
├── marketplace/                     # Componentes de e-commerce
├── analytics/                       # Charts e métricas
└── ui/                              # ✨ Shadcn/UI primitives (Button, Card, etc.)
```

### Hooks Customizados (Atualizados)

Localizados em `/src/hooks`:
- `useSSE.ts` - Server-Sent Events para chat streaming
- `useAuth.ts` - Estado de autenticação
- `useTheme.ts` - Gerenciamento de tema
- `useDebounce.ts` - Utilitários de performance

### API Hooks (SWR) - Nova Organização

Localizados em `/src/lib/api/hooks` (✨ Barrel exports centralizados):

**Estrutura:**
```
lib/api/hooks/
├── auth/                            # useAuth, useSession
├── gestao/                          # useEmpresas, usePerfis, useUsuarios
├── ia/                              # useAgentes, useConversas, useMensagens
├── clinica/                         # useAgendamentos, usePacientes, useProcedimentos
├── marketplace/                     # useProdutos, usePedidos, useCarrinho
├── financeiro/                      # useFaturas, useTransacoes
├── factory.ts                       # Hook factory (DRY para CRUD)
└── index.ts                         # ✨ Exports centralizados
```

**Uso (import único):**
```typescript
import {
  useAgentes,
  useEmpresas,
  useConversas,
  useProdutos
} from '@/lib/api/hooks'; // ✨ Um único import para todos os hooks
```

**Padrão de Hook:**
```typescript
export function useRecursos(filtros = {}) {
  const { data, error, mutate } = useSWR(
    `/recursos/?${new URLSearchParams(filtros)}`,
    fetcher
  );

  return {
    data: data?.results || [],
    meta: data?.meta,
    isLoading: !error && !data,
    error,
    mutate, // Para revalidação manual
  };
}
```

### Convenções Pós-Refatoração

**Nomenclatura:**
- ✅ Components: PascalCase (`AgentesTable.tsx`)
- ✅ Hooks: camelCase com `use` prefix (`useAgentes.ts`)
- ✅ Utils: camelCase (`formatDate.ts`)
- ✅ Types: PascalCase (`Usuario`, `Agente`)
- ✅ Folders: kebab-case (`data-table/`, `api-keys/`)

**TypeScript Path Aliases:**
```typescript
import { Button } from '@/components/ui/button';
import { useAgentes } from '@/lib/api/hooks';
import { formatDate } from '@/lib/utils';
```

**Server vs Client Components:**
```typescript
// Server Component (padrão) - sem 'use client'
export default async function Page() {
  const data = await serverFetch('/agentes/');
  return <div>{data}</div>;
}

// Client Component - com 'use client'
'use client';
export function InteractiveTable() {
  const [page, setPage] = useState(1);
  return <DataTable onPageChange={setPage} />;
}
```

---

## 🔗 Links Úteis

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **API Docs:** http://localhost:8080/docs
- **Repositório:** https://github.com/rbmarquez/DoctorQ

---

**Gerado em:** 29/10/2025
**Versão:** 2.0.0 (Pós-Refatoração)
**Documentação:** /mnt/repositorios/DoctorQ/DOC_Arquitetura/

---

## 📚 Documentação Relacionada

### Refatoração v2.0

A refatoração completa está documentada em:

1. **[README_MIGRACAO_CONCLUIDA.md](../README_MIGRACAO_CONCLUIDA.md)** - Guia completo do projeto refatorado
   - Estrutura completa de pastas
   - Como rodar em desenvolvimento
   - Deployment guide
   - Stack tecnológico completo

2. **[FASE_6_RESULTADO_FINAL.md](../FASE_6_RESULTADO_FINAL.md)** - Status final da Fase 6
   - Correções aplicadas (188 arquivos)
   - Problemas resolvidos
   - Métricas de performance
   - Tarefas pendentes

3. **[PROPOSTA_VS_IMPLEMENTACAO_ANALISE.md](../PROPOSTA_VS_IMPLEMENTACAO_ANALISE.md)** - Análise completa
   - Comparação proposta vs implementação
   - Decisões estratégicas
   - ROI da refatoração
   - Lições aprendidas

4. **[DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md](DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)** - Arquitetura completa
   - Visão geral do sistema
   - Stack tecnológico
   - Padrões de código
   - Fluxos de dados

### Ferramentas de Desenvolvimento

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs (Swagger)**: http://localhost:8080/docs
- **Repositório**: `/mnt/repositorios/DoctorQ/`

---

**© 2025 DoctorQ Platform - Todos os direitos reservados**
