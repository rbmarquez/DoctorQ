# 🧪 Guia de Testes - DoctorQ Mobile

Guia completo para testar o aplicativo em diferentes ambientes.

---

## 📱 Testar no Celular (Expo Go)

### Método 1: Setup Automático (Recomendado) 🚀

```bash
cd doctorq-mobile
./setup.sh
```

O script automaticamente:
- ✅ Detecta seu IP
- ✅ Cria o arquivo .env
- ✅ Instala dependências
- ✅ Verifica se backend está rodando
- ✅ Inicia o Expo

### Método 2: Manual 🔧

**1. Instalar Expo Go no celular:**
- [Android - Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

**2. Descobrir seu IP:**
```bash
# Linux/Mac
hostname -I | awk '{print $1}'

# Windows (PowerShell)
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like '*Wi-Fi*'}).IPAddress
```

**3. Criar arquivo .env:**
```bash
cp .env.example .env
nano .env
```

Edite com seu IP:
```env
API_BASE_URL=http://192.168.1.100:8000  # SEU IP AQUI
API_AI_BASE_URL=http://192.168.1.100:8001
API_VIDEO_BASE_URL=http://192.168.1.100:8002
WS_URL=ws://192.168.1.100:8000/ws
```

**4. Instalar e iniciar:**
```bash
npm install --legacy-peer-deps
npm start
```

**5. Escanear QR Code:**
- **Android**: Abra Expo Go > Scan QR Code
- **iOS**: Câmera nativa > Toque na notificação

---

## 🖥️ Testar em Emuladores

### Android Emulator

**Requisitos:**
- Android Studio instalado
- AVD (Android Virtual Device) configurado

**Executar:**
```bash
npm run android

# Ou com cache limpo
npx expo run:android --clear
```

**Configuração do .env para emulador:**
```env
# Use 10.0.2.2 para acessar localhost do host
API_BASE_URL=http://10.0.2.2:8000
```

### iOS Simulator (somente macOS)

**Requisitos:**
- Xcode instalado
- Simulador iOS configurado

**Executar:**
```bash
npm run ios

# Ou com cache limpo
npx expo run:ios --clear
```

**Configuração do .env para simulador:**
```env
# Use localhost normalmente
API_BASE_URL=http://localhost:8000
```

---

## 🌐 Testar no Navegador

```bash
npm run web
```

Abre em: `http://localhost:19006`

**Limitações:**
- Câmera não funciona
- Notificações push limitadas
- Alguns gestos nativos não funcionam

---

## 🔍 Debugging

### React Native Debugger

**1. Instalar:**
```bash
brew install --cask react-native-debugger  # macOS
# ou baixar em: https://github.com/jhen0409/react-native-debugger
```

**2. Iniciar debugger:**
```bash
open "rndebugger://set-debugger-loc?host=localhost&port=19000"
```

**3. No app:**
- Shake o dispositivo
- Selecione "Debug"

### Chrome DevTools

**1. No app:**
- Shake o dispositivo
- Selecione "Debug with Chrome"

**2. No Chrome:**
- Abra: `chrome://inspect`
- Clique em "Inspect"

### Flipper

**1. Instalar:**
```bash
brew install --cask flipper  # macOS
# ou baixar em: https://fbflipper.com/
```

**2. Executar:**
```bash
npx expo start
# Flipper detecta automaticamente
```

**Features:**
- 📱 Layout Inspector
- 🌐 Network Inspector
- 💾 Database viewer
- 📋 Logs viewer

---

## 🧪 Testes Automatizados

### Unit Tests (Jest)

```bash
# Executar todos os testes
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Teste específico
npm test -- Button.test.tsx
```

### E2E Tests (Detox) - Futuro

```bash
# Build
detox build --configuration ios.sim.debug

# Executar
detox test --configuration ios.sim.debug
```

---

## 📊 Performance Testing

### Análise de Bundle

```bash
# Analisar tamanho do bundle
npx expo-updates:assets:list

# Verificar imports não usados
npx depcheck
```

### Profiling

**1. Flipper:**
- Performance Monitor
- Memory Inspector
- Frame Rate

**2. React DevTools:**
```bash
npm install -g react-devtools
react-devtools
```

**3. No app:**
- Abrir menu dev
- "Show Perf Monitor"

---

## 🐛 Troubleshooting

### ❌ Erro: "Network request failed"

**Problema:** App não conecta ao backend

**Soluções:**

1. **Verificar conexão WiFi:**
```bash
# Celular e PC na mesma rede?
ping 192.168.1.100  # IP do PC
```

2. **Verificar backend:**
```bash
curl http://192.168.1.100:8000/health
# Deve retornar: {"status":"ok"}
```

3. **Verificar firewall:**
```bash
# Linux
sudo ufw allow 8000
sudo ufw allow 19000

# macOS
# Sistema > Segurança > Firewall > Opções
# Permitir conexões de entrada
```

4. **Testar em localhost:**
```bash
# Temporariamente use emulador para testar
npm run android  # ou npm run ios
```

### ❌ Erro: "Unable to resolve module"

**Problema:** Metro bundler não encontra módulos

**Solução:**
```bash
# Limpar cache
npx expo start --clear

# Ou limpar tudo
npm run clean
```

### ❌ Erro: "Invariant Violation"

**Problema:** Componente não renderiza

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules
npm install --legacy-peer-deps

# Limpar cache
npx expo start --clear
```

### ❌ QR Code não aparece

**Solução:**
```bash
# Usar tunneling (mais lento mas funciona)
npx expo start --tunnel

# Ou especificar host
npx expo start --host lan
```

### ❌ App recarrega infinitamente

**Solução:**
```bash
# Desabilitar fast refresh
# Em app.json:
{
  "expo": {
    "developer": {
      "unstable_requestIdleCallbackReactNative": false
    }
  }
}
```

---

## 🔄 Hot Reload / Fast Refresh

### Comandos no Terminal Expo

Quando o Expo está rodando:

- `r` - Reload manual
- `shift + r` - Reload com cache limpo
- `m` - Alternar menu dev
- `j` - Abrir debugger Chrome
- `i` - Executar no iOS simulator
- `a` - Executar no Android emulator
- `w` - Executar no web
- `c` - Limpar terminal

### No Dispositivo

**Abrir Menu Dev:**
- **Android**: Shake ou Cmd+M
- **iOS**: Shake ou Cmd+D

**Opções do Menu:**
- Reload
- Debug
- Show Element Inspector
- Show Performance Monitor
- Toggle Fast Refresh

---

## 📋 Checklist de Teste

### Antes de Testar

- [ ] Node.js instalado (v18+)
- [ ] Expo Go instalado no celular
- [ ] Celular e PC na mesma WiFi
- [ ] Backend rodando (porta 8000)
- [ ] .env configurado corretamente
- [ ] Dependências instaladas

### Funcionalidades para Testar

**Autenticação:**
- [ ] Login com email/senha
- [ ] Registro de novo usuário
- [ ] Logout
- [ ] Validação de formulário

**Navegação:**
- [ ] Tabs funcionando
- [ ] Navegação entre telas
- [ ] Botão voltar
- [ ] Deep linking

**Agendamentos:**
- [ ] Listar agendamentos
- [ ] Filtros (todos/agendado/concluído)
- [ ] Ver detalhes
- [ ] Criar novo

**Marketplace:**
- [ ] Grid de produtos
- [ ] Busca
- [ ] Adicionar ao carrinho
- [ ] Ver carrinho
- [ ] Contador de itens

**Chat:**
- [ ] Listar conversas
- [ ] Abrir conversa
- [ ] Enviar mensagem (se WebSocket rodando)

**Perfil:**
- [ ] Ver dados do usuário
- [ ] Avatar funcionando
- [ ] Menu de configurações

**Performance:**
- [ ] App carrega em < 5 segundos
- [ ] Navegação fluida (60 FPS)
- [ ] Sem memory leaks
- [ ] Imagens carregam rápido

---

## 🎯 Cenários de Teste

### Teste 1: Primeiro Uso

```
1. Abrir app pela primeira vez
2. Ver tela de login
3. Clicar em "Cadastre-se"
4. Preencher formulário
5. Submeter
6. Ver tela home
```

### Teste 2: Login Existente

```
1. Abrir app
2. Preencher email e senha
3. Clicar "Entrar"
4. Ver tela home com dados
```

### Teste 3: Criar Agendamento

```
1. Login
2. Ir para tab "Agendamentos"
3. Clicar "Novo Agendamento"
4. Preencher dados
5. Submeter
6. Ver agendamento na lista
```

### Teste 4: Comprar Produto

```
1. Login
2. Ir para tab "Marketplace"
3. Buscar produto
4. Clicar em produto
5. Ver detalhes
6. Adicionar ao carrinho
7. Ver contador atualizado
```

---

## 📱 Teste em Diferentes Dispositivos

### iOS

- [ ] iPhone SE (tela pequena)
- [ ] iPhone 14 (notch)
- [ ] iPhone 14 Pro Max (tela grande)
- [ ] iPad (tablet)

### Android

- [ ] Samsung Galaxy (One UI)
- [ ] Google Pixel (Android puro)
- [ ] Xiaomi (MIUI)
- [ ] Telas pequenas (< 5")
- [ ] Telas grandes (> 6.5")

---

## 🔧 Variáveis de Ambiente para Teste

### Desenvolvimento Local

```env
API_BASE_URL=http://192.168.1.100:8000
APP_ENV=development
ENABLE_BIOMETRIC_AUTH=false  # Desabilitar para testes
```

### Staging

```env
API_BASE_URL=https://staging-api.doctorq.com
APP_ENV=staging
ENABLE_PUSH_NOTIFICATIONS=true
```

### Produção

```env
API_BASE_URL=https://api.doctorq.com
APP_ENV=production
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_AI_FEATURES=true
```

---

## 📊 Métricas de Qualidade

### Performance

- ✅ TTI (Time to Interactive) < 3s
- ✅ FPS constante >= 60
- ✅ Memory usage < 200MB
- ✅ Bundle size < 5MB

### Acessibilidade

- ✅ Textos legíveis (min 14px)
- ✅ Contraste adequado (WCAG AA)
- ✅ Botões clicáveis (min 44x44px)
- ✅ Screen reader compatível

### Segurança

- ✅ Tokens em Secure Storage
- ✅ HTTPS obrigatório
- ✅ Input validation
- ✅ Sem dados sensíveis em logs

---

## 🎓 Comandos Úteis

```bash
# Setup completo
./setup.sh

# Iniciar rapidamente
./start.sh

# Limpar cache
npm start -- --clear

# Ver logs
npx expo start --verbose

# Build local
npx expo prebuild

# Analisar bundle
npx expo-updates:assets:list

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

---

**Pronto para testar? Execute `./setup.sh` e boa sorte! 🚀**
