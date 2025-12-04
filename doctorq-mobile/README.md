# 📱 DoctorQ Mobile

<div align="center">
  <h3>Aplicativo mobile oficial da plataforma DoctorQ</h3>
  <p>Sua plataforma completa de gestão de clínicas de estética, agora no seu bolso!</p>

  ![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

---

## 🌟 Sobre o Projeto

O **DoctorQ Mobile** é um aplicativo nativo cross-platform (iOS e Android) que complementa a plataforma web DoctorQ, oferecendo acesso mobile completo a todas as funcionalidades principais do sistema de gestão de clínicas de estética.

### ✨ Principais Funcionalidades

- 🔐 **Autenticação Segura** - Login/registro com JWT e suporte a OAuth (Google, Microsoft, Facebook)
- 📅 **Agendamentos** - Agende, visualize e gerencie consultas e procedimentos
- 🏥 **Clínicas & Profissionais** - Busque e avalie clínicas e profissionais
- 🛍️ **Marketplace** - Compre produtos de estética com carrinho integrado
- 💬 **Chat em Tempo Real** - Converse com a central de atendimento via WebSocket
- 🔔 **Notificações Push** - Receba lembretes de agendamentos e atualizações
- 🌙 **Modo Escuro** - Interface adaptável com suporte a tema claro/escuro
- 📱 **Deep Linking** - Navegação direta via links externos

---

## 🏗️ Arquitetura e Tecnologias

### Stack Principal

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React Native** | 0.81.5 | Framework para desenvolvimento mobile |
| **Expo** | ~54.0 | Plataforma de desenvolvimento e build |
| **TypeScript** | ~5.9.2 | Superset tipado do JavaScript |
| **Expo Router** | ^6.0 | Navegação file-based routing |
| **TanStack Query** | ^5.90 | Gerenciamento de estado servidor |
| **Zustand** | ^5.0 | Gerenciamento de estado global |
| **Axios** | ^1.13 | Cliente HTTP |
| **Socket.io** | ^4.8 | WebSocket para chat em tempo real |
| **React Hook Form** | ^7.66 | Gerenciamento de formulários |
| **Zod** | ^4.1 | Validação de schemas |
| **NativeWind** | ^4.2 | TailwindCSS para React Native |
| **date-fns** | ^4.1 | Manipulação de datas |

### Arquitetura

O projeto segue os princípios de **Clean Architecture** e **Feature-Based Structure**:

```
doctorq-mobile/
├── app/                          # Expo Router (rotas)
│   ├── (tabs)/                  # Navegação por tabs
│   │   ├── index.tsx           # Home
│   │   ├── appointments.tsx    # Agendamentos
│   │   ├── marketplace.tsx     # Marketplace
│   │   ├── chat.tsx            # Chat
│   │   └── profile.tsx         # Perfil
│   ├── (auth)/                 # Autenticação
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── appointment/[id].tsx    # Detalhes de agendamento
│   ├── clinic/[id].tsx         # Detalhes de clínica
│   ├── professional/[id].tsx   # Detalhes de profissional
│   ├── product/[id].tsx        # Detalhes de produto
│   ├── chat/[id].tsx           # Conversa individual
│   ├── _layout.tsx             # Layout raiz
│   └── index.tsx               # Rota inicial
│
├── src/
│   ├── api/                    # Camada de API
│   │   ├── client.ts          # Cliente Axios configurado
│   │   └── services/          # Serviços por domínio
│   │       ├── authService.ts
│   │       ├── appointmentService.ts
│   │       ├── clinicService.ts
│   │       ├── professionalService.ts
│   │       ├── marketplaceService.ts
│   │       └── chatService.ts
│   │
│   ├── components/            # Componentes reutilizáveis
│   │   ├── common/           # Componentes genéricos
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── forms/            # Componentes de formulário
│   │   └── layout/           # Componentes de layout
│   │
│   ├── hooks/                # Hooks customizados
│   │   ├── useAuth.ts
│   │   ├── useAppointments.ts
│   │   └── useMarketplace.ts
│   │
│   ├── store/                # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── cartStore.ts
│   │
│   ├── services/             # Serviços de infraestrutura
│   │   ├── tokenManager.ts
│   │   ├── websocketService.ts
│   │   └── notificationService.ts
│   │
│   ├── types/                # Definições TypeScript
│   │   └── index.ts
│   │
│   ├── config/               # Configurações
│   │   └── constants.ts
│   │
│   ├── theme/                # Design system
│   │   └── index.ts
│   │
│   └── utils/                # Utilitários
│
├── assets/                   # Assets estáticos
├── .env.example             # Variáveis de ambiente (exemplo)
├── app.json                 # Configuração do Expo
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── babel.config.js
└── README.md
```

---

## 🚀 Começando

### Pré-requisitos

- Node.js >= 18
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode (macOS only)
- Para Android: Android Studio

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd doctorq-mobile
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
API_BASE_URL=http://localhost:8000
API_AI_BASE_URL=http://localhost:8001
API_VIDEO_BASE_URL=http://localhost:8002
WS_URL=ws://localhost:8000/ws

GOOGLE_CLIENT_ID=your-google-client-id
FACEBOOK_APP_ID=your-facebook-app-id
MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm start
```

### Executando o App

**iOS (requer macOS)**
```bash
npm run ios
```

**Android**
```bash
npm run android
```

**Web (para testes)**
```bash
npm run web
```

**Expo Go (desenvolvimento)**
1. Instale o app Expo Go no seu dispositivo ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Escaneie o QR code que aparece no terminal

---

## 🔐 Autenticação

O app implementa múltiplas estratégias de autenticação:

### JWT (Padrão)
```typescript
import { useAuth } from '@hooks/useAuth';

const { login, isLoggingIn } = useAuth();

login({ email: 'user@example.com', password: 'password' });
```

### OAuth (Google, Microsoft, Facebook)
```typescript
// TODO: Implementar OAuth nativo
```

### Fluxo de Autenticação
1. Token JWT armazenado de forma segura com `expo-secure-store`
2. Refresh automático de tokens expirados
3. Interceptors Axios para adicionar tokens automaticamente
4. Logout limpa tokens e redireciona para login

---

## 📡 Comunicação com Backend

### API REST

Todos os serviços utilizam o `apiClient` configurado com:
- Base URL configurável
- Interceptors de autenticação
- Tratamento de erros global
- Retry automático em falhas de rede

```typescript
import { appointmentService } from '@api/services/appointmentService';

// Buscar agendamentos
const appointments = await appointmentService.getAppointments({
  page: 1,
  page_size: 20,
  status: 'agendado'
});

// Criar agendamento
const newAppointment = await appointmentService.createAppointment({
  id_profissional: 'uuid',
  dt_agendamento: '2024-12-01T10:00:00Z',
  id_procedimento: 'uuid'
});
```

### WebSocket (Chat em Tempo Real)

```typescript
import { websocketService } from '@services/websocketService';

// Conectar
await websocketService.connect();

// Entrar em uma conversa
websocketService.joinChat('conversation-id');

// Enviar mensagem
websocketService.sendMessage('conversation-id', 'Hello!');

// Ouvir mensagens
websocketService.onMessage((message) => {
  console.log('Nova mensagem:', message);
});

// Indicador de digitação
websocketService.sendTyping('conversation-id');
```

### React Query

Gerenciamento de cache e sincronização automática:

```typescript
import { useAppointments } from '@hooks/useAppointments';

const {
  appointments,
  isLoading,
  error,
  refetch,
  createAppointment,
  cancelAppointment
} = useAppointments();
```

---

## 🎨 Design System

### Tema

```typescript
import { theme } from '@theme';

// Cores
theme.colors.primary[500]  // #0ea5e9
theme.colors.secondary[500] // #d946ef
theme.colors.success        // #10b981
theme.colors.error          // #ef4444

// Espaçamento
theme.spacing.xs   // 4px
theme.spacing.sm   // 8px
theme.spacing.md   // 16px
theme.spacing.lg   // 24px
theme.spacing.xl   // 32px

// Tipografia
theme.fontSize.xs   // 12
theme.fontSize.base // 16
theme.fontSize.xl   // 20
theme.fontSize['2xl'] // 24
```

### Componentes Reutilizáveis

```typescript
import { Button, Input, Card, Avatar } from '@components/common';

<Button
  title="Salvar"
  onPress={handleSave}
  variant="primary"
  size="lg"
  isLoading={isLoading}
  fullWidth
/>

<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  keyboardType="email-address"
/>

<Card variant="elevated" onPress={handlePress}>
  <Text>Conteúdo do card</Text>
</Card>

<Avatar
  source="https://..."
  name="João Silva"
  size="lg"
/>
```

---

## 🔔 Notificações Push

### Configuração

```typescript
import { notificationService } from '@services/notificationService';

// Inicializar (pedir permissões)
await notificationService.initialize();

// Obter token Expo Push
const token = notificationService.getExpoPushToken();
// Enviar este token para o backend para receber notificações

// Agendar notificação local
await notificationService.scheduleNotification(
  'Lembrete',
  'Você tem uma consulta amanhã às 10:00',
  { appointmentId: 'uuid' },
  new Date('2024-12-01T09:00:00Z')
);

// Ouvir notificações
notificationService.addNotificationReceivedListener((notification) => {
  console.log('Notificação recebida:', notification);
});

notificationService.addNotificationResponseReceivedListener((response) => {
  // Usuário clicou na notificação
  const { appointmentId } = response.notification.request.content.data;
  // Navegar para tela de detalhes...
});
```

---

## 📱 Deep Linking

### Configuração

O app suporta deep linking com o esquema `doctorq://`

```json
// app.json
{
  "expo": {
    "scheme": "doctorq"
  }
}
```

### URLs Suportadas

```
doctorq://appointment/[id]       # Abrir agendamento
doctorq://clinic/[id]            # Abrir clínica
doctorq://professional/[id]      # Abrir profissional
doctorq://product/[id]           # Abrir produto
doctorq://chat/[id]              # Abrir conversa
```

### Uso

```typescript
import * as Linking from 'expo-linking';

// Abrir URL externa
Linking.openURL('doctorq://appointment/123');

// Ouvir deep links
Linking.addEventListener('url', ({ url }) => {
  // Processar URL e navegar
});
```

---

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes E2E (requer Detox configurado)
npm run test:e2e

# Cobertura
npm run test:coverage
```

---

## 📦 Build e Deploy

### Build de Desenvolvimento

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Build de Produção

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Publicação

```bash
# Atualizar OTA (Over-The-Air)
eas update --branch production

# Submeter para App Store
eas submit --platform ios

# Submeter para Google Play
eas submit --platform android
```

---

## 🔧 Troubleshooting

### Erro de cache do Metro

```bash
npm start -- --reset-cache
```

### Problemas com dependências nativas

```bash
npx expo prebuild
npx expo run:ios
npx expo run:android
```

### Limpar tudo e reinstalar

```bash
rm -rf node_modules
npm install
```

---

## 📝 Convenções de Código

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any`, prefira `unknown`
- Crie interfaces para objetos complexos

### Componentes

- Um componente por arquivo
- Use PascalCase para nomes de componentes
- Props sempre tipadas com interfaces

### Hooks

- Prefixo `use` para hooks customizados
- Coloque lógica complexa em hooks separados

### Naming

- Arquivos: `camelCase.ts` ou `PascalCase.tsx` (componentes)
- Variáveis: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Tipos/Interfaces: `PascalCase`

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👥 Time

Desenvolvido com ❤️ pela equipe DoctorQ

---

## 🔗 Links Úteis

- [Documentação do Expo](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [NativeWind Docs](https://www.nativewind.dev/)

---

<div align="center">
  <p>Feito com ❤️ usando React Native + Expo</p>
</div>
