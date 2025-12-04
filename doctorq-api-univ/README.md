# 🎓 Universidade da Beleza - Microserviço API

**Plataforma de Educação Estética com IA, Gamificação, Web3 e Metaverso**

> Parte do ecossistema DoctorQ Platform - O "Netflix + Duolingo + Coursera + Metaverso" da estética profissional

---

## 📋 Visão Geral

Este microserviço gerencia toda a **Universidade da Beleza**, incluindo:

- 📚 **Cursos e Conteúdo**: Biblioteca de cursos com vídeos, PDFs, quizzes e simuladores AR
- 🎓 **Inscrições e Progresso**: Acompanhamento de evolução dos alunos
- 🎮 **Gamificação**: Sistema de XP, níveis, badges e tokens ($ESTQ)
- 📜 **Certificações**: Emissão de certificados (blockchain-ready)
- 📺 **Lives e Eventos**: Webinars, workshops e congressos virtuais
- 👥 **Mentoria**: Sistema de matching entre mentores e mentorados
- 🌐 **Metaverso**: Campus virtual 3D para aulas imersivas
- 🤖 **IA Mentora**: Dra. Sophie - Assistente 24/7 com RAG

---

## 🚀 Quick Start

### Pré-requisitos

- Python 3.12+
- PostgreSQL 16+ (com extensões `uuid-ossp` e `pgvector`)
- Redis (opcional, para cache)
- UV (gerenciador de pacotes)

### Instalação

```bash
# Clone o repositório (se ainda não tiver)
cd /mnt/repositorios/DoctorQ/estetiQ-api-univ

# Instale as dependências
make install
# OU com dev dependencies:
make sync

# Configure as variáveis de ambiente
cp .env.exemplo .env
# Edite o .env com suas credenciais
```

### Criar Banco de Dados

```bash
# Conecte ao PostgreSQL e crie o banco
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -c "CREATE DATABASE doctorq_univ;"

# Execute a migration inicial
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ < database/migration_001_init_universidade.sql
```

### Iniciar Servidor

```bash
# Desenvolvimento (porta 8081)
make dev

# Produção
make prod
```

Acesse:
- **API Docs**: http://localhost:8081/docs
- **ReDoc**: http://localhost:8081/redoc
- **Health**: http://localhost:8081/health

---

## 📚 Arquitetura

### Stack Tecnológico

```
🎯 Backend:
├── FastAPI 0.115+ (framework web)
├── SQLAlchemy 2.0+ (ORM async)
├── PostgreSQL 16+ (banco principal)
├── pgvector (busca semântica)
├── Redis (cache e sessões)
├── LangChain + OpenAI (IA Mentora)
└── Pydantic 2.0+ (validação)

🔧 Ferramentas:
├── UV (package manager)
├── Alembic (migrations)
├── Ruff + Black (formatação)
└── Pytest (testes)
```

### Estrutura de Diretórios

```
estetiQ-api-univ/
├── src/
│   ├── config/           # Configurações (DB, Redis, Logger)
│   ├── models/           # SQLAlchemy Models + Pydantic Schemas
│   │   ├── curso.py      # Cursos, Módulos, Aulas
│   │   ├── inscricao.py  # Inscrições e Progresso
│   │   ├── gamificacao.py # XP, Tokens, Ranking
│   │   ├── badge.py      # Badges e conquistas
│   │   ├── certificado.py # Certificados
│   │   ├── evento.py     # Lives e eventos
│   │   ├── mentoria.py   # Sistema de mentoria
│   │   ├── avatar.py     # Avatares do metaverso
│   │   └── analytics.py  # Eventos de analytics
│   ├── services/         # Business logic
│   │   ├── curso_service.py
│   │   ├── inscricao_service.py
│   │   └── gamificacao_service.py
│   ├── routes/           # API endpoints
│   │   ├── curso.py      # GET/POST/PUT/DELETE /cursos
│   │   ├── inscricao.py  # /inscricoes
│   │   └── gamificacao.py # /gamificacao
│   ├── agents/           # IA agents (Dra. Sophie)
│   ├── middleware/       # Auth, CORS, Rate Limit
│   ├── utils/            # Helpers
│   └── main.py           # FastAPI app
├── database/             # SQL migrations
├── tests/                # Testes automatizados
├── Makefile              # Comandos úteis
├── pyproject.toml        # Dependências (UV)
└── README.md             # Este arquivo
```

---

## 🗄️ Banco de Dados

### Tabelas Principais

```sql
-- CURSOS (50+)
tb_universidade_cursos              -- Catálogo de cursos
tb_universidade_modulos             -- Módulos de cada curso
tb_universidade_aulas               -- Aulas (vídeos, PDFs, quizzes)

-- PROGRESSO (acompanhamento)
tb_universidade_inscricoes          -- Inscrições de usuários
tb_universidade_progresso_aulas     -- Progresso em cada aula

-- GAMIFICAÇÃO (engajamento)
tb_universidade_xp                  -- XP e níveis
tb_universidade_badges              -- Badges disponíveis
tb_universidade_badges_usuarios     -- Badges conquistados
tb_universidade_tokens              -- Saldo de $ESTQ
tb_universidade_transacoes_tokens   -- Histórico de tokens
tb_universidade_ranking             -- Rankings (diário, semanal, mensal)

-- CERTIFICAÇÕES
tb_universidade_certificados        -- Certificados emitidos (NFT-ready)

-- EVENTOS
tb_universidade_eventos             -- Lives, webinars, workshops
tb_universidade_inscricoes_eventos  -- Inscrições em eventos

-- MENTORIA
tb_universidade_mentores            -- Perfil de mentores
tb_universidade_sessoes_mentoria    -- Sessões agendadas

-- METAVERSO
tb_universidade_avatares            -- Avatares 3D dos usuários
tb_universidade_salas_metaverso     -- Salas virtuais

-- ANALYTICS
tb_universidade_analytics           -- Eventos de tracking
```

### Indexes Otimizados

- **Foreign Keys**: Indexes em todas FKs
- **Busca por usuário**: `id_usuario`
- **Busca semântica**: pgvector index em `embeddings`
- **Filtros**: categoria, nível, status, período

---

## 🔌 API Endpoints

### Cursos

```bash
GET    /cursos/                   # Listar cursos (filtros: categoria, nivel, page, size)
GET    /cursos/{id}/              # Buscar curso específico
POST   /cursos/                   # Criar curso
PUT    /cursos/{id}/              # Atualizar curso
DELETE /cursos/{id}/              # Deletar curso (soft delete)
```

### Inscrições

```bash
POST   /inscricoes/               # Criar inscrição em curso
GET    /inscricoes/usuario/{id}/  # Listar inscrições do usuário
GET    /inscricoes/{id}/          # Buscar inscrição específica
POST   /inscricoes/{id}/progresso/ # Atualizar progresso de aula
```

### Gamificação

```bash
GET    /gamificacao/xp/{id_usuario}/      # Buscar XP do usuário
GET    /gamificacao/tokens/{id_usuario}/  # Buscar tokens do usuário
```

### Eventos

```bash
GET    /eventos/                   # Listar eventos (lives, webinars)
GET    /eventos/{id}/              # Buscar evento específico
POST   /eventos/                   # Criar evento
POST   /eventos/{id}/inscricao/    # Inscrever em evento
POST   /eventos/{id}/presenca/     # Marcar presença
```

### Certificados

```bash
GET    /certificados/usuario/{id}/  # Listar certificados do usuário
GET    /certificados/verificar/{codigo}/ # Verificar autenticidade
POST   /certificados/emitir/        # Emitir novo certificado
GET    /certificados/{id}/          # Buscar certificado por ID
```

### Busca Semântica (RAG)

```bash
POST   /busca/semantica/  # Busca semântica em aulas (pgvector)
POST   /busca/pergunta/   # Responder pergunta com IA
```

**Exemplo de Request:**

```bash
# Listar cursos de injetáveis
curl http://localhost:8081/cursos/?categoria=injetaveis&page=1&size=10

# Criar inscrição
curl -X POST http://localhost:8081/inscricoes/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "uuid-do-usuario",
    "id_curso": "uuid-do-curso"
  }'
```

---

## 🎮 Sistema de Gamificação

### XP e Níveis

```python
# Tabela de XP por nível
Nível 1:  100 XP    (Aprendiz)
Nível 5:  2.000 XP  (Profissional)
Nível 10: 16.000 XP (Especialista)
Nível 15: 40.000 XP (Expert)
Nível 20: 100.000 XP (Master)
```

### Como Ganhar XP

```python
+10 XP   → Assistir 1 aula completa
+25 XP   → Passar em um quiz (>80%)
+50 XP   → Completar um módulo
+100 XP  → Completar um curso
+200 XP  → Aprovar em prova prática
+500 XP  → Certificação completa
+1000 XP → Case publicado e aprovado
```

### Tokens ($ESTQ)

```python
# GANHAR:
100-500 tokens  → Completar curso
50 tokens       → Quiz perfeito
500 tokens      → Streak 30 dias
200 tokens      → Referral (convidar amigo)
300 tokens      → Case aprovado

# GASTAR:
500 tokens    → Desbloquear curso premium
1.000 tokens  → Mentoria 1:1 (30min)
2.000 tokens  → Acesso VIP evento
100 tokens    → R$ 10 de desconto na loja
```

---

## 🤖 IA Mentora - Dra. Sophie

### Recursos

- **RAG (Retrieval-Augmented Generation)**: Busca semântica em 10.000+ aulas
- **Análise de Fotos**: Computer vision para análise de casos
- **Recomendações**: Sugere cursos baseado no perfil
- **Protocolos Personalizados**: Cria planos de tratamento
- **Respostas Científicas**: Citações de SBCP, SBME, estudos

### Exemplo de Uso

```python
# Query: "Como tratar melasma em pele negra?"
# IA retorna:
{
  "resposta": "Para tratamento de melasma...",
  "referencias": [
    "SBCP - Protocolo de Melasma 2025",
    "Estudo: J Cosmet Dermatol 2024"
  ],
  "cursos_recomendados": ["Peelings Químicos Avançados"],
  "confianca": 0.95
}
```

---

## 📜 Certificações

### Tipos

```
🥉 BRONZE (20-40h)   → Prova online
🥈 PRATA (40-80h)    → Prova online + AR
🥇 OURO (80-120h)    → Prova presencial
💎 DIAMANTE (120h+)  → Banca expert + TCC
```

### Blockchain (NFT)

- Network: **Polygon** (gas barato)
- Smart Contract: ERC-721
- Armazenamento: IPFS (Arweave)
- Verificação: QR Code + URL pública

```
verify.doctorq.com/EST-2026-001234
```

---

## 🧪 Desenvolvimento

### Comandos Úteis

```bash
# Linting
make lint

# Auto-fix (ruff + isort + black)
make fix

# Testes
make test

# Criar migration
make revision

# Aplicar migrations
make migrate

# Rollback última migration
make rollback

# Limpar cache
make clean
```

### Variáveis de Ambiente Importantes

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/doctorq_univ

# LLM
OPENAI_API_KEY=sk-...

# Integração com API principal
DOCTORQ_API_URL=http://localhost:8080
DOCTORQ_API_KEY=vf_...

# Web3 (opcional)
WEB3_PROVIDER_URL=https://polygon-rpc.com
CONTRACT_ADDRESS_CERTIFICATE=0x...
```

---

## 🔗 Integração com API Principal

### Endpoints Chamados

```python
# Buscar dados do usuário
GET {DOCTORQ_API_URL}/users/{id_usuario}/

# Buscar profissional (instrutor)
GET {DOCTORQ_API_URL}/profissionais/{id_profissional}/

# Registrar evento no analytics
POST {DOCTORQ_API_URL}/analytics/
```

### Headers

```bash
Authorization: Bearer {DOCTORQ_API_KEY}
Content-Type: application/json
```

---

## 📊 Roadmap

### FASE 1: MVP (Q2 2026) ✅
- [x] Core (DB, API, Cursos)
- [x] Progresso e Inscrições
- [x] Gamificação (XP, Tokens, Badges)
- [x] Certificações
- [ ] IA Mentora (RAG)
- [ ] Lives e Eventos

### FASE 2: Growth (Q3-Q4 2026)
- [ ] Realidade Aumentada (simuladores)
- [ ] Web3 & Blockchain (NFTs)
- [ ] Mentoria e Networking
- [ ] App Mobile (React Native)

### FASE 3: Scale (2027)
- [ ] Metaverso (Campus 3D)
- [ ] Internacionalização (EN, ES)
- [ ] IA Avançada (análise de fotos)
- [ ] Parcerias Acadêmicas (SBCP, SBME)

---

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feat/minha-feature`
2. Commit: `git commit -m "feat: adiciona nova feature"`
3. Push: `git push origin feat/minha-feature`
4. Abra um Pull Request

**Convenções:**
- Commits: Conventional Commits
- Code style: Ruff + Black
- Testes: Pytest (cobertura > 80%)

---

## 📝 Licença

Propriedade de **DoctorQ Platform** - Todos os direitos reservados.

---

## 📞 Suporte

- **Docs**: http://localhost:8081/docs
- **Email**: dev@doctorq.app
- **Issues**: GitHub Issues

---

**🎓 Universidade da Beleza - Revolucionando a educação estética no Brasil e no mundo!**

> *"Do Aprendizado à Prática, do Virtual ao Real."*
