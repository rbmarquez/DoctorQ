# 🚀 Quick Start - Universidade da Beleza v1.2.0

Guia rápido para iniciar o projeto **Universidade da Beleza**.

---

## 📋 Pré-requisitos

- **Python**: 3.12+
- **UV**: Package manager (mais rápido que pip/poetry)
- **PostgreSQL**: 16+ com extensão `pgvector`
- **Redis**: 6+ (opcional, mas recomendado)
- **Credenciais**:
  - OpenAI API Key (para IA Mentora)
  - Mux Token ID e Secret (para upload de vídeos)
  - SMTP (para emails)

---

## ⚡ Instalação Rápida

### 1. Instalar Dependências

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api-univ

# Instala UV se não tiver
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sincroniza todas as dependências
uv sync
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.exemplo .env

# Editar com suas credenciais
nano .env
```

**Configurações Mínimas:**
```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/doctorq_univ

# OpenAI (para IA Mentora)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Mux (para upload de vídeos)
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret

# SMTP (para emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@doctorq.app
SMTP_PASSWORD=your-password

# Auth
API_KEY=univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
JWT_SECRET=your-jwt-secret-min-32-chars
```

### 3. Iniciar Servidor

```bash
# Desenvolvimento (auto-reload)
make dev
# OU: uv run uvicorn src.main:app --reload --port 8081

# Produção (Gunicorn com 4 workers)
make prod
# OU: uv run gunicorn src.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8081 --workers 4
```

**API estará disponível em:** http://localhost:8081

---

## 🧪 Testar Endpoints

### 1. Health Check

```bash
curl http://localhost:8081/
# Resposta: {"app":"DoctorQ Universidade da Beleza","version":"1.2.0","status":"online"}
```

### 2. Documentação Swagger

Abra no navegador:
```
http://localhost:8081/docs
```

### 3. Criar Upload de Vídeo (Mux)

```bash
curl -X POST http://localhost:8081/videos/upload/create/ \
  -H "Authorization: Bearer univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -H "Content-Type: application/json" \
  -d '{"playback_policy": "public"}'

# Resposta: {"upload_id": "...", "upload_url": "https://storage.googleapis.com/..."}
```

### 4. Testar Email de Conclusão de Curso

```bash
curl -X POST "http://localhost:8081/notificacoes/teste/?to_email=test@example.com&tipo=curso_concluido" \
  -H "Authorization: Bearer univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

# Resposta: {"success":true,"message":"Email de teste enviado para test@example.com"}
```

### 5. Perguntar para Dra. Sophie (IA Mentora)

```bash
curl -X POST http://localhost:8081/chat/perguntar/ \
  -H "Authorization: Bearer univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -H "Content-Type: application/json" \
  -d '{
    "pergunta": "Como tratar melasma em pele negra?",
    "streaming": false
  }'

# Resposta: {"resposta":"...", "fontes":[...], "confianca":0.85, "cursos_recomendados":[...]}
```

### 6. Download de Certificado PDF

```bash
curl -X GET "http://localhost:8081/certificados/{id_certificado}/download/?nome_aluno=Dr.%20João%20Silva" \
  -H "Authorization: Bearer univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  --output certificado.pdf

# Arquivo PDF será salvo em certificado.pdf
```

---

## 📂 Estrutura do Projeto

```
estetiQ-api-univ/
├── src/
│   ├── main.py                     # FastAPI application
│   ├── config/                     # Configurações (DB, Redis, Settings)
│   ├── middleware/                 # Auth, CORS, Rate limit
│   ├── routes/                     # Endpoints (9 routers)
│   │   ├── curso.py               # Cursos, módulos, aulas
│   │   ├── inscricao.py           # Inscrições e progresso
│   │   ├── gamificacao.py         # XP, níveis, badges, tokens
│   │   ├── evento.py              # Eventos e webinars
│   │   ├── certificado.py         # Certificados
│   │   ├── busca.py               # Busca semântica (RAG)
│   │   ├── chat.py                # Dra. Sophie (IA Mentora) 🆕
│   │   ├── video.py               # Upload de vídeos (Mux) 🆕
│   │   └── notificacao.py         # Emails (SMTP) 🆕
│   ├── services/                   # Business logic (9 services)
│   │   ├── pdf_service.py         # Geração de PDFs 🆕
│   │   ├── video_service.py       # Integração Mux 🆕
│   │   └── email_service.py       # Envio de emails 🆕
│   ├── agents/                     # AI agents
│   │   ├── rag_agent.py           # RAG com pgvector
│   │   └── dra_sophie.py          # IA Mentora (LangChain + GPT-4) 🆕
│   └── models/                     # ORM + Schemas (17 models)
├── database/                       # Migrations SQL
├── tests/                          # Testes (pytest)
├── pyproject.toml                  # Dependências (UV)
├── .env                            # Variáveis de ambiente (local)
├── .env.exemplo                    # Template de .env
├── Makefile                        # Comandos úteis
├── README.md                       # Documentação completa
├── CHANGELOG.md                    # Histórico de mudanças 🆕
└── QUICK_START.md                  # Este arquivo 🆕
```

---

## 🎯 Funcionalidades Implementadas (v1.2.0)

### ✅ Core
- [x] CRUD de cursos, módulos e aulas
- [x] Sistema de inscrições e progresso
- [x] Gamificação (XP, níveis, badges, tokens, ranking)
- [x] Eventos e webinars
- [x] Sistema de certificados
- [x] Busca semântica com pgvector

### ✅ IA & Automação
- [x] **Dra. Sophie** - IA Mentora com LangChain + GPT-4
- [x] **RAG** - Retrieval-Augmented Generation
- [x] **Streaming SSE** - Respostas em tempo real
- [x] **Recomendações** - Cursos personalizados

### ✅ Mídia & Conteúdo
- [x] **Upload de Vídeos** - Integração com Mux
- [x] **HLS Streaming** - Reprodução adaptativa
- [x] **Thumbnails** - Geração automática
- [x] **PDF Certificados** - Geração com QR Code

### ✅ Comunicação
- [x] **Emails SMTP** - 4 templates HTML responsivos
  - Curso Concluído
  - Novo Evento
  - Lembrete de Aula
  - Missões Diárias
- [x] **Background Tasks** - Envio assíncrono

### ✅ Segurança
- [x] **JWT Authentication** - PyJWT com cache
- [x] **API Key** - Bearer token
- [x] **CORS** - Configurável
- [x] **Token Cache** - 5 minutos TTL

---

## 🐛 Troubleshooting

### Erro: "Module 'langchain.chains' not found"

**Solução:** Atualizado para LangChain 1.0.5 (já corrigido)

### Erro: "email-validator is not installed"

**Solução:**
```bash
uv sync  # Reinstala todas as dependências
```

### Erro: "Database connection failed"

**Verificar:**
1. PostgreSQL está rodando?
2. Extensão `pgvector` instalada?
3. `DATABASE_URL` correto no `.env`?

```bash
# Testar conexão
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ -c "SELECT 1"
```

### Erro: "OPENAI_API_KEY not configured"

**Solução:** Configurar chave no `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Erro: "Mux upload failed"

**Verificar:**
1. `MUX_TOKEN_ID` e `MUX_TOKEN_SECRET` corretos?
2. Conta Mux ativa?
3. Verificar logs: `tail -f logs/app.log`

---

## 📊 Endpoints Totais

**33+ endpoints funcionais** distribuídos em 9 categorias:

- **Cursos**: 5 endpoints
- **Inscrições**: 4 endpoints
- **Gamificação**: 6 endpoints
- **Eventos**: 5 endpoints
- **Certificados**: 4 endpoints
- **Busca**: 2 endpoints
- **Chat IA**: 2 endpoints 🆕
- **Vídeos**: 6 endpoints 🆕
- **Notificações**: 5 endpoints 🆕

---

## 🚀 Próximos Passos

1. **Deploy em Produção** - Kubernetes/Docker
2. **CI/CD Pipeline** - GitHub Actions
3. **Testes E2E** - Playwright
4. **Web3/NFT** - Smart contracts (Polygon)
5. **Realidade Aumentada** - Simuladores AR
6. **Metaverso 3D** - Virtual campus

---

## 📚 Documentação Adicional

- **CHANGELOG.md** - Histórico de mudanças
- **README.md** - Documentação completa
- **Swagger** - http://localhost:8081/docs
- **ReDoc** - http://localhost:8081/redoc

---

## 🆘 Suporte

- **Issues**: GitHub Issues
- **Email**: dev@doctorq.app
- **Docs**: http://localhost:8081/docs

---

**Universidade da Beleza v1.2.0** - Powered by DoctorQ Platform 🎓
