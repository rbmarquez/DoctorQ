# 🚀 Guia de Início Rápido - DoctorQ Mobile

Este guia vai te ajudar a configurar e executar o aplicativo mobile DoctorQ em poucos minutos!

---

## ⚡ Instalação Rápida

### 1. Instalar Dependências

```bash
cd doctorq-mobile
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` e configure as URLs do backend:

```env
API_BASE_URL=http://192.168.1.100:8000  # Use seu IP local, não localhost
API_AI_BASE_URL=http://192.168.1.100:8001
API_VIDEO_BASE_URL=http://192.168.1.100:8002
WS_URL=ws://192.168.1.100:8000/ws
```

> ⚠️ **IMPORTANTE**: No dispositivo físico, `localhost` não funciona! Use o IP da sua máquina na rede local.

### 3. Iniciar o Servidor

```bash
npm start
```

### 4. Executar no Dispositivo

**Opção 1: Expo Go (Mais Rápido)**
1. Instale o app Expo Go no seu celular:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Escaneie o QR code que aparece no terminal

**Opção 2: Simulador/Emulador**
```bash
# iOS (requer macOS + Xcode)
npm run ios

# Android (requer Android Studio)
npm run android
```

---

## 📝 Credenciais de Teste

Para facilitar o desenvolvimento, você pode usar estas credenciais de teste:

```
Email: paciente@doctorq.com
Senha: 123456
```

Ou crie uma nova conta diretamente no app!

---

## 🔧 Desenvolvimento

### Estrutura de Pastas Importantes

```
doctorq-mobile/
├── app/                    # 📱 Telas (Expo Router)
│   ├── (tabs)/            # Navegação principal
│   └── (auth)/            # Telas de login/registro
│
├── src/
│   ├── api/services/      # 🌐 Chamadas de API
│   ├── components/        # 🎨 Componentes reutilizáveis
│   ├── hooks/             # 🪝 Hooks customizados
│   ├── store/             # 📦 Estado global (Zustand)
│   ├── services/          # ⚙️ Serviços (WebSocket, Notifications)
│   └── theme/             # 🎨 Design system
```

### Adicionar Nova Tela

1. Crie um arquivo em `app/`:
```tsx
// app/minha-tela.tsx
export default function MinhaTela() {
  return <Text>Olá Mundo!</Text>;
}
```

2. Navegue para ela:
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/minha-tela');
```

### Fazer Chamada de API

```tsx
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@api/services/appointmentService';

export default function MinhaScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.getAppointments(),
  });

  if (isLoading) return <LoadingSpinner />;

  return <Text>{data?.data.length} agendamentos</Text>;
}
```

### Criar Componente Reutilizável

```tsx
// src/components/common/MyButton.tsx
import { Button } from '@components/common/Button';
import { theme } from '@theme';

export const MyButton = ({ title, onPress }) => {
  return (
    <Button
      title={title}
      onPress={onPress}
      variant="primary"
      size="lg"
    />
  );
};
```

---

## 🐛 Problemas Comuns

### Erro "Network request failed"

**Causa**: Backend não está acessível

**Solução**:
1. Certifique-se de que os backends estão rodando:
```bash
# No diretório estetiQ-api
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

2. Use o IP da sua máquina, não `localhost`:
```bash
# Descubra seu IP
# macOS/Linux: ifconfig | grep "inet "
# Windows: ipconfig

# Atualize .env com o IP correto
API_BASE_URL=http://192.168.1.100:8000  # Seu IP aqui
```

### Erro "Unable to resolve module"

**Solução**:
```bash
# Limpar cache e reinstalar
rm -rf node_modules
npm install
npm start -- --clear
```

### App não atualiza após mudanças

**Solução**:
```bash
# Reiniciar com cache limpo
npm start -- --clear

# Ou no terminal do Expo:
# Pressione 'r' para reload
# Pressione 'Shift + r' para limpar cache e reload
```

### TypeScript mostra erros

**Solução**:
```bash
# Verificar tipos
npm run type-check

# Reiniciar TypeScript server no VS Code
Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

---

## 📚 Recursos Úteis

### Hooks Principais

```tsx
import { useAuth } from '@hooks/useAuth';
import { useAppointments } from '@hooks/useAppointments';
import { useProducts, useCart } from '@hooks/useMarketplace';

// Autenticação
const { user, login, logout, isLoggingIn } = useAuth();

// Agendamentos
const { appointments, createAppointment, cancelAppointment } = useAppointments();

// Marketplace
const { products } = useProducts();
const { cart, addToCart } = useCart();
```

### Componentes UI

```tsx
import {
  Button,
  Input,
  Card,
  Avatar,
  LoadingSpinner
} from '@components/common';

<Button title="Salvar" onPress={handleSave} variant="primary" />
<Input label="Email" value={email} onChangeText={setEmail} />
<Card variant="elevated"><Text>Conteúdo</Text></Card>
<Avatar name="João Silva" size="lg" />
<LoadingSpinner message="Carregando..." />
```

### Navegação

```tsx
import { useRouter } from 'expo-router';

const router = useRouter();

router.push('/appointment/123');       // Ir para tela
router.replace('/login');              // Substituir tela atual
router.back();                         // Voltar
```

### WebSocket (Chat)

```tsx
import { websocketService } from '@services/websocketService';

// Conectar
await websocketService.connect();

// Enviar mensagem
websocketService.sendMessage('conversation-id', 'Olá!');

// Receber mensagens
websocketService.onMessage((msg) => {
  console.log('Nova mensagem:', msg);
});
```

---

## 🎨 Customização

### Mudar Cores do Tema

Edite `src/theme/index.ts`:

```typescript
export const theme = {
  colors: {
    primary: {
      500: '#0ea5e9',  // Sua cor principal
      // ...
    },
  },
};
```

### Adicionar Fonte Customizada

1. Coloque as fontes em `src/assets/fonts/`
2. Carregue no `app/_layout.tsx`:

```tsx
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'CustomFont': require('@assets/fonts/CustomFont.ttf'),
});
```

---

## 🚢 Deploy

### Build para Produção

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build iOS
eas build --profile production --platform ios

# Build Android
eas build --profile production --platform android
```

### Atualização OTA (sem rebuild)

```bash
# Publicar update
eas update --branch production
```

---

## 💡 Dicas de Produtividade

1. **Hot Reload**: Salve o arquivo e veja mudanças instantâneas
2. **Debug Menu**: Shake o dispositivo ou Cmd+D (iOS) / Cmd+M (Android)
3. **Logs**: Use `console.log()` e veja no terminal
4. **React DevTools**: `npm install -g react-devtools` e execute `react-devtools`
5. **Snippets**: Use extensões do VS Code para React Native

---

## 📞 Suporte

Problemas? Confira:
- [Documentação do Expo](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

**Pronto para começar? Execute `npm start` e boa codificação! 🚀**
