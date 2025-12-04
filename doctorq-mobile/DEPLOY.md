# 🚀 Guia de Deploy - DoctorQ Mobile

Este guia contém todas as instruções para fazer o deploy do aplicativo DoctorQ Mobile para produção.

---

## 📋 Pré-requisitos

### 1. Contas Necessárias

- [ ] **Expo Account** - Criar em [expo.dev](https://expo.dev)
- [ ] **Apple Developer Account** - US$ 99/ano para iOS ([developer.apple.com](https://developer.apple.com))
- [ ] **Google Play Console** - US$ 25 taxa única para Android ([play.google.com/console](https://play.google.com/console))

### 2. Ferramentas

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Fazer login no Expo
eas login
```

---

## 🏗️ Build Local (Desenvolvimento)

### Build de Desenvolvimento

```bash
cd doctorq-mobile

# iOS (desenvolvimento)
npx expo run:ios

# Android (desenvolvimento)
npx expo run:android

# Web (para testes)
npm run web
```

---

## ☁️ Build na Nuvem (EAS Build)

### 1. Configurar Projeto EAS

```bash
# Configurar EAS
eas build:configure

# Atualizar app.json com informações do projeto
```

### 2. Build para Android

**APK (Desenvolvimento/Preview)**
```bash
# Build APK para testes
eas build --profile preview --platform android

# Build APK de desenvolvimento
eas build --profile development --platform android
```

**AAB (Produção - Google Play)**
```bash
# Build para Google Play Store
eas build --profile production --platform android

# Após o build, fazer download do AAB
# Upload manual no Google Play Console
```

### 3. Build para iOS

**Simulator (Desenvolvimento)**
```bash
# Build para simulador iOS
eas build --profile development --platform ios
```

**Ad Hoc / TestFlight (Preview)**
```bash
# Build para distribuição interna
eas build --profile preview --platform ios
```

**App Store (Produção)**
```bash
# Build para App Store
eas build --profile production --platform ios

# Configurar certificados e profiles
# Upload automático ou manual via App Store Connect
```

---

## 📱 Distribuição

### Android

#### 1. Google Play Store (Produção)

```bash
# Build AAB
eas build --profile production --platform android

# Submit para Google Play (automático)
eas submit --platform android

# Ou upload manual:
# 1. Acesse play.google.com/console
# 2. Crie um novo app
# 3. Faça upload do AAB gerado
# 4. Configure listagem da loja
# 5. Submeta para revisão
```

#### 2. Distribuição Direta (APK)

```bash
# Gerar APK
eas build --profile preview --platform android

# Distribuir o APK:
# - Email
# - Firebase App Distribution
# - Site próprio
# - TestFlight equivalente (como Diawi)
```

### iOS

#### 1. TestFlight (Beta Testing)

```bash
# Build e submit para TestFlight
eas build --profile production --platform ios
eas submit --platform ios

# Ou via Xcode:
# 1. Abrir projeto no Xcode
# 2. Product > Archive
# 3. Distribute App > TestFlight
```

#### 2. App Store (Produção)

```bash
# Submit para App Store
eas submit --platform ios

# Configurar no App Store Connect:
# 1. App Information
# 2. Pricing and Availability
# 3. App Review Information
# 4. Version Information
# 5. Submit for Review
```

---

## 🔄 Over-The-Air (OTA) Updates

### Atualizações Instantâneas (sem rebuild)

```bash
# Publicar update OTA
eas update --branch production --message "Fix login bug"

# Criar canal de updates
eas channel:create production

# Ver histórico de updates
eas update:list --branch production

# Rollback se necessário
eas update:rollback --branch production
```

### Quando Usar OTA vs Build Completo

**✅ OTA Updates (instantâneo)**
- Correções de bugs JS
- Mudanças de UI
- Atualizações de conteúdo
- Ajustes de lógica

**❌ Requer Build Completo**
- Mudanças em dependências nativas
- Atualizações do Expo SDK
- Mudanças em permissões (AndroidManifest, Info.plist)
- Mudanças em app.json (bundle identifier, etc.)

---

## 🔐 Variáveis de Ambiente para Produção

### 1. Criar .env.production

```bash
# doctorq-mobile/.env.production
API_BASE_URL=https://api.doctorq.com
API_AI_BASE_URL=https://ai.doctorq.com
API_VIDEO_BASE_URL=https://video.doctorq.com
WS_URL=wss://api.doctorq.com/ws

GOOGLE_CLIENT_ID=your-production-google-id
FACEBOOK_APP_ID=your-production-facebook-id
MICROSOFT_CLIENT_ID=your-production-microsoft-id

APP_ENV=production
SENTRY_DSN=your-sentry-dsn
```

### 2. Usar no Build

```bash
# Carregar .env.production
export $(cat .env.production | xargs)

# Build com variáveis
eas build --profile production --platform all
```

---

## 📊 Monitoramento e Analytics

### 1. Configurar Sentry (Error Tracking)

```bash
npm install @sentry/react-native

# Configurar em app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV,
});
```

### 2. Configurar Analytics

```bash
# Firebase Analytics
npm install @react-native-firebase/analytics

# Ou Amplitude
npm install @amplitude/analytics-react-native
```

---

## 🧪 Testes Antes do Deploy

### Checklist Pré-Deploy

- [ ] Executar testes unitários: `npm test`
- [ ] Type-check TypeScript: `npm run type-check`
- [ ] Lint código: `npm run lint`
- [ ] Testar em iOS simulator
- [ ] Testar em Android emulator
- [ ] Testar em dispositivos físicos (iOS e Android)
- [ ] Verificar integração com APIs de produção
- [ ] Testar notificações push
- [ ] Testar deep linking
- [ ] Testar fluxo completo de autenticação
- [ ] Testar offline mode
- [ ] Verificar performance (FPS, memória)
- [ ] Revisar permissões (câmera, localização, etc.)

### Comandos de Teste

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Verificar bundle size
npx expo-updates --branch production

# Analisar performance
npx react-native-performance
```

---

## 📝 Versionamento

### Atualizar Versão

```bash
# Editar package.json e app.json
{
  "version": "1.1.0",
  "expo": {
    "version": "1.1.0",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

### Semantic Versioning

- **Major (1.0.0)**: Mudanças incompatíveis
- **Minor (1.1.0)**: Novas features compatíveis
- **Patch (1.1.1)**: Bug fixes

---

## 🚨 Troubleshooting

### Build Falha

```bash
# Limpar cache EAS
eas build:cancel --all
eas build --clear-cache

# Verificar credenciais
eas credentials

# Logs detalhados
eas build --profile production --platform ios --local
```

### Certificados iOS

```bash
# Regenerar certificados
eas credentials --platform ios

# Verificar status
eas credentials:list --platform ios
```

### Assinatura Android

```bash
# Gerar novo keystore
eas credentials --platform android

# Verificar keystore
keytool -list -v -keystore path/to/keystore.jks
```

---

## 📈 Estratégia de Release

### 1. Desenvolvimento (Interno)

```bash
# Builds frequentes para testes internos
eas build --profile development --platform all
```

### 2. Beta (TestFlight / Google Play Beta)

```bash
# Release para testers externos
eas build --profile preview --platform all
eas submit --platform all
```

### 3. Produção (Staged Rollout)

```bash
# Release gradual
# 1. 10% dos usuários
# 2. Monitorar crashes/feedback 24h
# 3. 50% dos usuários
# 4. Monitorar 48h
# 5. 100% dos usuários

# Google Play Console: Production > Releases > Staged Rollout
# App Store Connect: não tem staged rollout nativo
```

---

## 🔗 Links Úteis

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Expo Best Practices](https://docs.expo.dev/guides/best-practices/)

---

## 🎯 Comandos Rápidos

```bash
# Build tudo (iOS + Android) para produção
eas build --profile production --platform all

# Submit tudo para stores
eas submit --platform all

# OTA update para produção
eas update --branch production --message "Bug fixes"

# Ver status dos builds
eas build:list

# Ver logs em tempo real
eas build:view <BUILD_ID>
```

---

**Pronto para fazer deploy? Comece com builds de desenvolvimento e vá escalando! 🚀**
