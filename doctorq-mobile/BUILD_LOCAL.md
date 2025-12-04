# 📱 Guia de Build Local - APK sem EAS

Este guia mostra como gerar um APK do DoctorQ Mobile **sem precisar de conta Expo/EAS**, direto na sua máquina.

---

## 🎯 Método Recomendado: Script Automático

### Forma Mais Rápida (1 comando)

```bash
cd doctorq-mobile
./build-apk.sh
```

**Pronto!** O script vai:
1. ✅ Instalar dependências
2. ✅ Gerar arquivos nativos
3. ✅ Compilar o APK
4. ✅ Mostrar onde está o APK
5. ✅ Oferecer instalar automaticamente se tiver celular conectado

---

## 📋 Pré-requisitos

Você precisa ter instalado:

### 1. Node.js e npm
```bash
node --version  # v18 ou superior
npm --version   # v9 ou superior
```

### 2. JDK (Java Development Kit)
```bash
java -version  # OpenJDK 17 ou superior
```

**Instalar JDK:**
```bash
# Ubuntu/Debian
sudo apt install openjdk-17-jdk

# macOS (usando Homebrew)
brew install openjdk@17

# Windows
# Baixar de: https://adoptium.net/
```

### 3. Android SDK (Opcional mas recomendado)

Baixe o Android Studio: https://developer.android.com/studio

Ou instale apenas as ferramentas de linha de comando:
```bash
# Ubuntu/Debian
sudo apt install android-sdk

# macOS (usando Homebrew)
brew install --cask android-commandlinetools
```

**Configurar variáveis de ambiente:**
```bash
# Adicione ao ~/.bashrc ou ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

---

## 🛠️ Método Manual (Passo a Passo)

Se preferir fazer manualmente ao invés de usar o script:

### Passo 1: Preparar o Projeto

```bash
cd doctorq-mobile

# Instalar dependências
npm install --legacy-peer-deps
```

### Passo 2: Gerar Arquivos Nativos

```bash
# Gerar pasta android/ com código nativo
npx expo prebuild --platform android --clean
```

Isso cria a pasta `android/` com todo o código nativo do Android.

### Passo 3: Build do APK

```bash
cd android

# Build de release (APK de produção)
./gradlew assembleRelease

# Ou build de debug (APK de desenvolvimento)
./gradlew assembleDebug
```

O build pode demorar 5-10 minutos na primeira vez.

### Passo 4: Localizar o APK

```bash
# APK de Release (menor, otimizado)
android/app/build/outputs/apk/release/app-release.apk

# APK de Debug (maior, com debug)
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📲 Como Instalar o APK no Celular

### Opção 1: Via Cabo USB (Recomendado)

1. **Ativar Depuração USB no celular:**
   - Abra `Configurações`
   - Vá em `Sobre o telefone`
   - Toque 7 vezes em `Número da versão`
   - Volte e entre em `Opções do desenvolvedor`
   - Ative `Depuração USB`

2. **Conectar e instalar:**
   ```bash
   # Conecte o celular via USB

   # Verificar se o celular foi detectado
   adb devices

   # Instalar o APK
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

### Opção 2: Via Transferência Direta

1. **Copiar APK para o celular:**
   - Use cabo USB para copiar o arquivo
   - Ou envie por email/WhatsApp/Drive

2. **Instalar no celular:**
   - Abra o arquivo APK no celular
   - Android vai pedir para permitir instalação de apps desconhecidos
   - Permita para a fonte (Arquivos, Chrome, etc.)
   - Clique em "Instalar"

### Opção 3: Via QR Code (Rápido)

Se você tiver um servidor web local:

```bash
# Na pasta do projeto
cd android/app/build/outputs/apk/release/

# Inicie um servidor HTTP simples
python3 -m http.server 8080

# Acesse no navegador do celular:
# http://<SEU_IP>:8080/app-release.apk
```

Ou use serviços como:
- [Diawi](https://www.diawi.com/) - Upload e gera QR code
- [AppsGeyser](https://www.appsgeyser.com/)
- [Firebase App Distribution](https://firebase.google.com/docs/app-distribution)

---

## 🔧 Troubleshooting

### Erro: "SDK location not found"

Crie o arquivo `android/local.properties`:

```properties
sdk.dir=/home/SEU_USUARIO/Android/Sdk
```

Ou no Windows:
```properties
sdk.dir=C\:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Erro: "Gradle build failed"

```bash
# Limpar e tentar novamente
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### Erro: "Java version incompatible"

```bash
# Verificar versão do Java
java -version

# Deve ser JDK 17 ou superior
# Se não for, instale a versão correta e configure JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Build muito lento

```bash
# Aumentar memória do Gradle
# Edite android/gradle.properties e adicione:
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### APK muito grande

O APK de release já é otimizado, mas você pode reduzir mais:

```bash
# Gerar AAB (Android App Bundle) ao invés de APK
cd android
./gradlew bundleRelease

# O AAB fica em:
# android/app/build/outputs/bundle/release/app-release.aab

# AAB é até 50% menor que APK, mas precisa do Google Play para distribuir
```

### Erro ao instalar no celular

```bash
# Desinstalar versão antiga primeiro
adb uninstall com.doctorq.app

# Instalar novamente
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## ⚡ Builds Mais Rápidos

### 1. Usar Gradle Daemon

Já ativado por padrão, mas verifique em `android/gradle.properties`:
```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

### 2. Não limpar antes de rebuild

```bash
# Ao invés de:
npx expo prebuild --platform android --clean

# Use:
npx expo prebuild --platform android
```

### 3. Build incremental

```bash
# Não use clean se não mudou dependências
cd android
./gradlew assembleRelease  # Rápido se já buildou antes
```

---

## 🎨 Personalizar o APK

### Mudar ícone do app

1. Substitua `assets/icon.png` e `assets/adaptive-icon.png`
2. Rode `npx expo prebuild --platform android --clean`

### Mudar nome do app

Edite `app.json`:
```json
{
  "expo": {
    "name": "Seu Nome Aqui",
    "slug": "doctorq-mobile"
  }
}
```

### Mudar package name (bundle identifier)

Edite `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.suaempresa.doctorq"
    }
  }
}
```

Depois rode:
```bash
npx expo prebuild --platform android --clean
```

---

## 📊 Comparação de Métodos

| Método | Tempo | Tamanho APK | Requer Internet | Complexidade |
|--------|-------|-------------|-----------------|--------------|
| **Script automático** | 5-10 min | ~50 MB | Sim (1ª vez) | ⭐ Fácil |
| **Build manual** | 5-10 min | ~50 MB | Sim (1ª vez) | ⭐⭐ Médio |
| **EAS Build (nuvem)** | 15-20 min | ~45 MB | Sim (sempre) | ⭐ Fácil |
| **Android Studio** | 10-15 min | ~50 MB | Sim (1ª vez) | ⭐⭐⭐ Difícil |

---

## 🚀 Dicas de Produção

### 1. Assinar o APK (para distribuição)

Para distribuir fora do Google Play, é melhor assinar:

```bash
cd android

# Gerar keystore
keytool -genkeypair -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Configure em android/app/build.gradle
```

### 2. Otimizar tamanho

Edite `android/app/build.gradle`:
```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Versionar o APK

Edite `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

---

## 🔗 Links Úteis

- [Expo Prebuild Docs](https://docs.expo.dev/workflow/prebuild/)
- [Gradle Build Docs](https://developer.android.com/build)
- [Android Debug Bridge (ADB)](https://developer.android.com/tools/adb)
- [Signing Android Apps](https://developer.android.com/studio/publish/app-signing)

---

## ✅ Checklist Rápido

- [ ] JDK 17+ instalado
- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install --legacy-peer-deps`)
- [ ] Executar `./build-apk.sh`
- [ ] APK gerado em `android/app/build/outputs/apk/release/`
- [ ] Transferir APK para celular
- [ ] Instalar no celular

---

**Pronto para testar seu app! 🎉**

Se tiver qualquer problema, consulte a seção de [Troubleshooting](#-troubleshooting) acima.
