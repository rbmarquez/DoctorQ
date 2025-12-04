# 🔐 Guia de Configuração OAuth - DoctorQ

Este guia explica como configurar a autenticação OAuth com Google, Microsoft e Apple no DoctorQ.

## 📋 Pré-requisitos

1. Node.js 18+ instalado
2. Conta Google Cloud Platform
3. Conta Microsoft Azure
4. Conta Apple Developer (para Apple Sign In)

---

## 🔵 1. Configurar Google OAuth

### Passo 1: Acessar o Google Cloud Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente

### Passo 2: Configurar OAuth Consent Screen
1. No menu lateral, vá em **APIs & Services** > **OAuth consent screen**
2. Escolha **External** (para usuários públicos)
3. Preencha:
   - **App name**: DoctorQ
   - **User support email**: seu@email.com
   - **Developer contact**: seu@email.com
4. Clique em **Save and Continue**

### Passo 3: Criar Credenciais OAuth
1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Escolha **Web application**
4. Configure:
   - **Name**: DoctorQ Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://seudominio.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     https://seudominio.com/api/auth/callback/google
     ```
5. Clique em **Create**
6. **Copie o Client ID e Client Secret**

### Passo 4: Adicionar ao .env
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

---

## 🟦 2. Configurar Microsoft OAuth (Azure AD)

### Passo 1: Acessar Azure Portal
1. Acesse [Azure Portal](https://portal.azure.com/)
2. Vá em **Azure Active Directory** (ou Microsoft Entra ID)

### Passo 2: Registrar Aplicação
1. No menu lateral, clique em **App registrations**
2. Clique em **New registration**
3. Preencha:
   - **Name**: DoctorQ
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**:
     - Platform: **Web**
     - URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Clique em **Register**

### Passo 3: Configurar Client Secret
1. Na página do app, vá em **Certificates & secrets**
2. Clique em **New client secret**
3. Adicione descrição e escolha validade
4. **Copie o Value** (não poderá ver novamente!)

### Passo 4: Pegar Application ID
1. Na página **Overview** do app
2. **Copie o Application (client) ID**
3. **Copie o Directory (tenant) ID** (ou use "common" para multi-tenant)

### Passo 5: Adicionar ao .env
```bash
MICROSOFT_CLIENT_ID=your-application-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_TENANT_ID=common
```

---

## 🍎 3. Configurar Apple Sign In

### Passo 1: Acessar Apple Developer
1. Acesse [Apple Developer](https://developer.apple.com/account/)
2. Vá em **Certificates, Identifiers & Profiles**

### Passo 2: Criar App ID
1. Clique em **Identifiers** > **+** (adicionar)
2. Escolha **App IDs** > **Continue**
3. Escolha **App** > **Continue**
4. Preencha:
   - **Description**: DoctorQ Web
   - **Bundle ID**: com.inovaia.web (ou seu domínio reverso)
5. Marque **Sign in with Apple**
6. Clique em **Continue** > **Register**

### Passo 3: Criar Service ID
1. Clique em **Identifiers** > **+** (adicionar)
2. Escolha **Services IDs** > **Continue**
3. Preencha:
   - **Description**: DoctorQ Web Service
   - **Identifier**: com.inovaia.web.service
4. Marque **Sign in with Apple**
5. Clique em **Configure**
6. Configure:
   - **Primary App ID**: Selecione o App ID criado
   - **Domains and Subdomains**: `localhost`, `seudominio.com`
   - **Return URLs**:
     ```
     http://localhost:3000/api/auth/callback/apple
     https://seudominio.com/api/auth/callback/apple
     ```
7. Clique em **Save** > **Continue** > **Register**

### Passo 4: Criar Key para JWT
1. Vá em **Keys** > **+** (adicionar)
2. Preencha:
   - **Key Name**: DoctorQ Sign In Key
3. Marque **Sign in with Apple**
4. Clique em **Configure** e selecione o Primary App ID
5. Clique em **Save** > **Continue** > **Register**
6. **Baixe o arquivo .p8** (não poderá baixar novamente!)
7. **Anote o Key ID**

### Passo 5: Criar Client Secret JWT
Apple requer um JWT assinado como client secret. Use este script Node.js:

```javascript
// generate-apple-secret.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('AuthKey_XXXXXXXXXX.p8');
const teamId = 'YOUR_TEAM_ID';  // Encontrado em Account > Membership
const clientId = 'com.inovaia.web.service';  // Seu Service ID
const keyId = 'YOUR_KEY_ID';  // Key ID da chave criada

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId
});

console.log(token);
```

Execute: `node generate-apple-secret.js`

### Passo 6: Adicionar ao .env
```bash
APPLE_CLIENT_ID=com.inovaia.web.service
APPLE_CLIENT_SECRET=eyJhbGciOiJFUzI1NiIsImtpZCI...  # Token JWT gerado
```

---

## 🔧 4. Configuração Final

### Gerar NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Arquivo .env Completo
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-secret-gerada-aqui

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-application-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_TENANT_ID=common

# Apple OAuth
APPLE_CLIENT_ID=com.inovaia.web.service
APPLE_CLIENT_SECRET=eyJhbGciOiJFUzI1NiIsImtpZCI...

# API
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## ✅ 5. Testar a Autenticação

### Iniciar Backend API

1. Abra um terminal e inicie o backend:
```bash
cd DoctorQ/inovaia-api
make dev
```

O backend estará disponível em: http://localhost:8080

### Iniciar Frontend

2. Abra outro terminal e inicie o frontend:
```bash
cd DoctorQ/inovaia-web
yarn dev
```

O frontend estará disponível em: http://localhost:3000

### Testar o Fluxo OAuth

3. Acesse: http://localhost:3000/cadastro

4. Clique em um dos botões OAuth:
   - **Cadastre-se com Google**
   - **Cadastre-se com Microsoft**
   - **Cadastre-se com Apple**

5. Complete o fluxo OAuth no provedor

6. Você será redirecionado para `/dashboard` após autenticação

### Como Funciona o Fluxo

1. **Frontend (NextAuth.js)**:
   - Usuário clica em botão OAuth
   - NextAuth redireciona para provedor (Google/Microsoft/Apple)
   - Provedor autentica e retorna para callback

2. **Callback NextAuth** (`src/auth.ts`):
   - NextAuth recebe dados do provedor
   - Chama `/users/oauth-login` no backend
   - Backend cria/atualiza usuário
   - Backend retorna JWT token

3. **Session Management**:
   - NextAuth armazena sessão com JWT
   - Token válido por 30 dias
   - Frontend pode acessar sessão via `useSession()`

---

## 🚨 Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de callback está EXATAMENTE igual nas configurações do provedor
- Para localhost, use `http://localhost:3000` (sem trailing slash)

### Erro: "invalid_client"
- Verifique se o Client ID e Client Secret estão corretos
- Certifique-se de que não há espaços extras no .env

### Erro: Apple "invalid_client"
- Verifique se o JWT não expirou (gere um novo)
- Certifique-se de que o Team ID e Key ID estão corretos

### Session não persiste
- Verifique se NEXTAUTH_SECRET está configurado
- Limpe cookies do navegador e tente novamente

---

## 📚 Recursos Adicionais

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Apple Sign In](https://developer.apple.com/sign-in-with-apple/)

---

## 🔐 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` para o repositório
- ✅ Use variáveis de ambiente em produção
- ✅ Rotacione secrets periodicamente
- ✅ Use HTTPS em produção
- ✅ Restrinja domínios autorizados

---

**✨ Pronto! Seu OAuth está configurado e funcionando!**
