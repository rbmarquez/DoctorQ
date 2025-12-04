# EstetiQ Web

Frontend da plataforma EstetiQ, construído com Next.js 15, React 19 e TypeScript. Interface moderna para gestão de clínicas de estética, inspirada no Doctoralia.

## Principais Funcionalidades

- **Dashboard Intuitivo**: Visão geral de agendamentos, faturamento e métricas
- **Gestão de Clínicas**: Interface para cadastro e gerenciamento de clínicas
- **Agendamento Online**: Sistema completo de agendamento para pacientes e profissionais
- **Prontuário Eletrônico**: Gestão de prontuários e histórico de procedimentos
- **Chat com IA**: Assistente virtual para dúvidas, recomendações e análises
- **Marketplace**: Catálogo de produtos e equipamentos para estética
- **Multi-tenant**: Suporte a múltiplas clínicas/empresas
- **UI Responsiva**: Tailwind CSS com componentes Shadcn/UI customizados
- **Streaming SSE**: Chat em tempo real com Server-Sent Events
- **Autenticação**: NextAuth com OAuth (Google, Microsoft)

## Requisitos

- Node.js 20 ou superior (recomendado 22 LTS)
- Yarn 4 (ou npm)
- A API EstetiQ executando localmente ou acessível por rede

## Instalação e Configuração

### 1. Instalar Dependências

```bash
yarn install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Configure as variáveis no arquivo `.env.local`:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8080
API_ESTETIQ_API_KEY=seu-api-key-aqui

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-aqui

# OAuth (opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...

# Feature Flags
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
```

## Scripts Disponíveis

```bash
# Desenvolvimento com HMR na porta 3000
yarn dev

# Build de produção
yarn build

# Servidor de produção
yarn start

# Linting
yarn lint

# Testes unitários
yarn test
yarn test:watch
yarn test:coverage

# Testes E2E
yarn test:e2e
yarn test:e2e:ui
```

## Estrutura do Projeto

```
EstetiQ/
  estetiQ-web/
    src/
      app/                # Next.js App Router
        api/              # API Routes (proxy)
        clinicas/         # Gestão de clínicas
        profissionais/    # Gestão de profissionais
        agendamentos/     # Sistema de agendamento
        pacientes/        # Gestão de pacientes
        chat/             # Chat com IA
        marketplace/      # Marketplace
      components/         # Componentes React
        ui/               # Componentes base (Radix UI)
        clinicas/         # Componentes específicos de clínicas
        agendamentos/     # Componentes de agendamento
        chat/             # Componentes de chat
      lib/                # Utilitários
        api.ts            # Cliente API
        utils.ts          # Funções auxiliares
      hooks/              # Custom React Hooks
      types/              # TypeScript types
    next.config.ts        # Configurações do Next.js
    tailwind.config.js    # Design tokens e temas
```

## Páginas Principais

### Autenticação
- `/login` - Login
- `/cadastro` - Registro

### Dashboard
- `/dashboard` - Overview geral
- `/clinicas` - Gestão de clínicas
- `/profissionais` - Gestão de profissionais
- `/agendamentos` - Sistema de agendamento
- `/pacientes` - Gestão de pacientes
- `/chat` - Chat com IA
- `/marketplace` - Marketplace

### Área do Profissional
- `/profissional/agenda` - Agenda do profissional
- `/profissional/pacientes` - Pacientes do profissional
- `/profissional/financeiro` - Financeiro

### Área do Paciente
- `/paciente/agendamentos` - Agendamentos
- `/paciente/prontuario` - Prontuário
- `/paciente/historico` - Histórico de procedimentos

## Tecnologias

- **Next.js**: 15.2.0 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 3.4.0
- **Radix UI**: Componentes acessíveis
- **NextAuth**: Autenticação
- **Lucide React**: Ícones
- **Date-fns**: Manipulação de datas
- **Playwright**: Testes E2E
- **Jest**: Testes unitários

## Deploy

### Vercel (Recomendado)

```bash
vercel
```

### Docker

```bash
docker build -t estetiq-web .
docker run -p 3000:3000 estetiq-web
```

## Próximos Passos

- [ ] Sistema de agendamento com drag-and-drop
- [ ] Prontuário eletrônico com assinatura digital
- [ ] Chat com IA integrado ao prontuário
- [ ] Marketplace de produtos
- [ ] App mobile (React Native)
- [ ] Notificações push
- [ ] Integração com sistemas de pagamento

## Licença

Proprietário - EstetiQ © 2025

## Suporte

Para dúvidas ou suporte: devs@estetiq.app
