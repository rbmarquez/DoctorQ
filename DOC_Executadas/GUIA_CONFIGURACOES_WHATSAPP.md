# 📱 Guia de Configuração do WhatsApp Business

## ✅ Implementação Completa

O sistema agora permite configurar o WhatsApp Business **diretamente pela interface web autenticada**, sem necessidade de editar arquivos `.env` ou reiniciar o servidor!

---

## 🎯 O Que Foi Implementado

### 1. **Banco de Dados**
- ✅ Tabela `tb_configuracoes` criada
- ✅ 20 configurações pré-cadastradas:
  - WhatsApp Business
  - Email (SMTP)
  - SMS
  - Configurações gerais

### 2. **Backend API**
- ✅ `/configuracoes/` - CRUD completo
- ✅ Criptografia automática para valores sensíveis
- ✅ Atualização do WhatsApp para buscar configurações do banco

### 3. **Frontend**
- ✅ Página `/admin/configuracoes` criada
- ✅ Interface por categorias (tabs)
- ✅ Mostrar/ocultar valores sensíveis
- ✅ Salvar individualmente ou em lote

---

## 📂 Arquivos Criados

```
Backend (3 arquivos):
├── database/migration_configuracoes_sistema.sql
├── src/routes/configuracoes_route.py
└── src/routes/whatsapp_route.py (atualizado)

Frontend (1 arquivo):
└── src/app/admin/configuracoes/page.tsx
```

---

## 🚀 Como Usar

### **Passo 1: Acessar a Página de Configurações**

Acesse: **http://localhost:3000/admin/configuracoes**

### **Passo 2: Selecionar Categoria**

Clique na aba **"WhatsApp Business"**

### **Passo 3: Preencher Credenciais**

Você verá 5 configurações:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **whatsapp_api_url** | URL da API | `https://graph.facebook.com/v18.0` |
| **whatsapp_access_token** | Token de acesso | `EAAXXXxxxxxxx...` (criptografado 🔒) |
| **whatsapp_phone_id** | ID do telefone | `1234567890` |
| **whatsapp_habilitado** | Ativa/desativa | `Ativado` ou `Desativado` |
| **whatsapp_antecedencia_lembrete** | Horas de antecedência | `24` |

### **Passo 4: Salvar**

- Clique em **"Salvar"** em cada campo individual, ou
- Clique em **"Salvar Todas as Configurações"** no final da página

### **Passo 5: Testar**

```bash
curl -X POST "http://localhost:8080/whatsapp/lembrete-agendamento" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -H "Content-Type: application/json" \
  -d '{
    "id_agendamento": "seu-agendamento-id",
    "antecedencia_horas": 24
  }'
```

---

## 🔐 Segurança

### **Criptografia Automática**

Valores marcados como `st_criptografado = TRUE` são automaticamente criptografados:

- ✅ `whatsapp_access_token` - Criptografado
- ✅ `email_smtp_senha` - Criptografado
- ✅ `sms_api_key` - Criptografado

**No banco de dados:**
```sql
SELECT nm_chave, ds_valor FROM tb_configuracoes WHERE nm_chave = 'whatsapp_access_token';

-- Resultado:
-- nm_chave: whatsapp_access_token
-- ds_valor: gAAAAABm7x... (criptografado com Fernet)
```

**Na interface:**
- Valores aparecem como `********`
- Clique no ícone 👁️ para revelar temporariamente

### **Chave de Criptografia**

Adicione ao `.env`:
```env
CONFIG_ENCRYPTION_KEY=sua_chave_fernet_base64_aqui
```

Ou deixe em branco para gerar automaticamente (não recomendado em produção).

---

## 🔄 Como Funciona

### **1. Fluxo de Salvamento**

```
Frontend (/admin/configuracoes)
    ↓
PUT /configuracoes/{chave}
    ↓
API verifica se st_criptografado = TRUE
    ↓ (sim)
Criptografa valor com Fernet
    ↓
Salva no banco tb_configuracoes
```

### **2. Fluxo de Uso (WhatsApp)**

```
Endpoint /whatsapp/lembrete-agendamento
    ↓
get_whatsapp_config(db)
    ↓
Busca configurações da tb_configuracoes
    ↓
Descriptografa valores sensíveis
    ↓
Usa configurações para enviar mensagem
```

### **3. Fallback**

Se não encontrar no banco, usa variáveis de ambiente como fallback:

```python
access_token = await get_config_value("whatsapp_access_token", db)
               or os.getenv("WHATSAPP_ACCESS_TOKEN", "")
```

---

## 📊 Outras Configurações Disponíveis

### **Email (SMTP)**

- `email_smtp_host` - Servidor SMTP
- `email_smtp_port` - Porta (587)
- `email_smtp_usuario` - Usuário
- `email_smtp_senha` - Senha (criptografada 🔒)
- `email_remetente` - Email remetente
- `email_habilitado` - Ativa/desativa

### **SMS**

- `sms_provedor` - Provedor (Twilio, Zenvia)
- `sms_api_key` - API Key (criptografada 🔒)
- `sms_remetente` - Remetente
- `sms_habilitado` - Ativa/desativa

### **Geral**

- `sistema_nome` - Nome do sistema
- `sistema_url` - URL base
- `sistema_telefone` - Telefone de contato
- `sistema_email_suporte` - Email de suporte
- `sistema_timezone` - Timezone (America/Sao_Paulo)

---

## 🛠️ API de Configurações

### **Listar Todas**

```bash
curl "http://localhost:8080/configuracoes/" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"
```

### **Listar por Categoria**

```bash
curl "http://localhost:8080/configuracoes/?categoria=whatsapp" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"
```

### **Obter uma Configuração**

```bash
curl "http://localhost:8080/configuracoes/whatsapp_access_token?descriptografar=true" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"
```

### **Atualizar**

```bash
curl -X PUT "http://localhost:8080/configuracoes/whatsapp_habilitado" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -H "Content-Type: application/json" \
  -d '{"ds_valor": "true"}'
```

### **Criar Nova**

```bash
curl -X POST "http://localhost:8080/configuracoes/" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -H "Content-Type: application/json" \
  -d '{
    "nm_chave": "minha_config",
    "ds_valor": "valor",
    "ds_tipo": "texto",
    "ds_categoria": "geral",
    "ds_descricao": "Minha configuração customizada",
    "st_criptografado": false
  }'
```

---

## 🎨 Interface Frontend

### **Features**

- ✅ Tabs por categoria
- ✅ Ícones coloridos
- ✅ Campos adaptados ao tipo:
  - `texto` → Input text
  - `numero` → Input number
  - `boolean` → Botões Ativado/Desativado
  - `senha` → Input password com botão revelar
- ✅ Indicador de valor criptografado
- ✅ Salvar individual ou em lote
- ✅ Mensagem de sucesso animada
- ✅ Loading states

### **Screenshots**

**Categoria WhatsApp:**
```
┌─────────────────────────────────────────────┐
│ 📱 WhatsApp Business                        │
├─────────────────────────────────────────────┤
│                                             │
│ URL da API do WhatsApp Business             │
│ ┌─────────────────────────────────────────┐ │
│ │ https://graph.facebook.com/v18.0        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Token de acesso do WhatsApp Business API    │
│ 🔒 Valor sensível - será criptografado      │
│ ┌─────────────────────────────────────────┐ │
│ │ ******************************    👁️    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Ativa/desativa integração com WhatsApp      │
│ ┌──────────┐  ┌──────────┐                │
│ │ Ativado  │  │Desativado│                │
│ └──────────┘  └──────────┘                │
│                                             │
│              [Salvar Todas] [💾]           │
└─────────────────────────────────────────────┘
```

---

## ✅ Benefícios

1. **Sem Restart** - Alterações aplicadas imediatamente
2. **Segurança** - Valores sensíveis criptografados
3. **Auditoria** - dt_criacao e dt_atualizacao rastreados
4. **Multi-usuário** - Vários admins podem configurar
5. **Histórico** - Soft delete mantém histórico
6. **Flexível** - Fácil adicionar novas configurações

---

## 🔮 Próximos Passos

### **Para Usar em Produção:**

1. Configure credenciais reais do WhatsApp Business
2. Gere uma chave de criptografia forte:
   ```python
   from cryptography.fernet import Fernet
   print(Fernet.generate_key().decode())
   ```
3. Adicione ao `.env`:
   ```env
   CONFIG_ENCRYPTION_KEY=a1b2c3d4...
   ```
4. Acesse `/admin/configuracoes` e ative o WhatsApp

### **Para Desenvolvedores:**

Adicione novas configurações via SQL:

```sql
INSERT INTO tb_configuracoes (nm_chave, ds_valor, ds_tipo, ds_categoria, ds_descricao, st_criptografado)
VALUES ('minha_config', 'valor_padrao', 'texto', 'geral', 'Descrição da config', FALSE);
```

Ou via API:

```bash
curl -X POST "http://localhost:8080/configuracoes/" ...
```

---

## 🐛 Troubleshooting

### **Problema: Configurações não aparecem**

```sql
-- Verificar se existem
SELECT COUNT(*) FROM tb_configuracoes WHERE st_ativo = TRUE;

-- Recarregar configurações padrão
\i database/migration_configuracoes_sistema.sql
```

### **Problema: Erro de criptografia**

- Certifique-se que `CONFIG_ENCRYPTION_KEY` está no `.env`
- Use a mesma chave sempre (perder a chave = perder dados criptografados)

### **Problema: WhatsApp não envia**

1. Verifique se `whatsapp_habilitado` = `true`
2. Verifique se token e phone_id estão preenchidos
3. Veja logs: `/tmp/doctorq_api.log`

---

## 📞 Suporte

**Documentação:** `GUIA_COMPLETO_3_PRIORIDADES.md`
**Página de Configurações:** http://localhost:3000/admin/configuracoes
**API Docs:** http://localhost:8080/docs

---

✅ **Sistema de configurações 100% funcional!**

Agora você pode gerenciar todas as integrações diretamente pela interface web! 🎉
