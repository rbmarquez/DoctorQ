# Casos de Uso - Universidade da Beleza

**Projeto:** DoctorQ - Universidade da Beleza
**Versão:** 1.0
**Data:** 13/11/2025
**Status:** Documentação Completa

---

## 📋 Visão Geral

Este diretório contém os Casos de Uso detalhados para a implementação da **Universidade da Beleza**, uma plataforma educacional inovadora que combina:

- 🎓 **Netflix** - Biblioteca de cursos on-demand
- 🎮 **Duolingo** - Gamificação e engajamento
- 📜 **Coursera** - Certificações profissionais
- 🤖 **ChatGPT** - Mentor IA 24/7 (Dra. Sophie)
- 🔗 **Web3** - Certificados NFT verificáveis na blockchain

---

## 📚 Casos de Uso Principais

### [UC001 - Matrícula e Acesso a Cursos](./UC001_MATRICULA_ACESSO_CURSOS.md)

**Descrição:** Sistema completo de navegação no catálogo, matrícula, pagamento e acesso a cursos.

**Principais Funcionalidades:**
- 🔍 Catálogo estilo Netflix com filtros e busca
- 💳 Checkout integrado (Stripe/MercadoPago)
- 🎁 Sistema de cupons e vouchers
- 🎯 Recomendações personalizadas via IA
- 📊 Gestão de inscrições e assinaturas

**Atores:**
- Aluno/Paciente
- Sistema de Pagamento
- Sistema de Notificações
- Mentor IA (Dra. Sophie)

**Fluxos Cobertos:**
- Navegação e descoberta de cursos
- Processo de matrícula (compra única, assinatura, trial)
- Pagamento (cartão, PIX, boleto)
- Cupons de desconto
- Presentear cursos (gift cards)
- Lista de espera (cursos lotados)
- Reembolso

**Tabelas Principais:**
- `tb_universidade_cursos`
- `tb_universidade_inscricoes`
- `tb_universidade_progresso`
- `tb_universidade_lista_espera`

**Endpoints-Chave:**
- `GET /universidade/cursos/` - Listar cursos
- `POST /universidade/inscricoes/` - Criar matrícula
- `GET /universidade/meus-cursos/` - Cursos do aluno

---

### [UC002 - Sistema de Gamificação e XP](./UC002_GAMIFICACAO_XP.md)

**Descrição:** Sistema completo de gamificação inspirado no Duolingo, com XP, níveis, badges, streaks e rankings.

**Principais Funcionalidades:**
- ⚡ Ganho de XP por ações (assistir aulas, quizzes, projetos)
- 🏆 Sistema de níveis (1-50) com progressão exponencial
- 🏅 Badges desbloqueáveis (45+ badges disponíveis)
- 🔥 Streaks diários com freezes
- 📊 Rankings globais e por curso
- 🎯 Missões diárias
- ⚔️ Desafios entre amigos
- 🥇 Ligas competitivas (Bronze → Diamante)

**Atores:**
- Aluno
- Sistema de Gamificação
- Sistema de Notificações
- Mentor IA (celebra conquistas)

**Fluxos Cobertos:**
- Ganho de XP com multiplicadores
- Progressão de níveis
- Desbloqueio de badges
- Rastreamento de streaks
- Rankings e ligas
- Missões diárias
- Recompensas por progresso

**Tabelas Principais:**
- `tb_universidade_ranking`
- `tb_universidade_badges`
- `tb_universidade_badges_alunos`
- `tb_universidade_conquistas`
- `tb_universidade_regras_xp`
- `tb_universidade_eventos`
- `tb_universidade_desafios`

**Endpoints-Chave:**
- `GET /universidade/ranking/global/` - Ranking global
- `GET /universidade/gamificacao/meu-perfil/` - Perfil do aluno
- `POST /universidade/gamificacao/creditar-xp/` - Creditar XP
- `GET /universidade/gamificacao/badges/` - Listar badges
- `GET /universidade/gamificacao/missoes-diarias/` - Missões do dia

**XP por Ação:**

| Ação | XP Base | Multiplicador |
|------|---------|---------------|
| Assistir aula completa | +20 XP | 1x |
| Completar quiz | +30 XP | 1x-3x (nota) |
| Concluir módulo | +100 XP | 1x |
| Concluir curso | +500 XP | 1x-2x (certificação) |
| Streak diário | +15 XP | 1x-5x (dias) |
| Upload projeto | +50 XP | 1x |

**Badges Especiais:**
- 👣 Primeiro Passo (1ª aula)
- 🏃 Maratonista (10 aulas/dia)
- 💯 Perfeccionista (5 quizzes 100%)
- 🔥 Em Chamas (streak 7 dias)
- 🏆 Lenda (streak 30 dias)
- 🎓 Mestre (10 cursos completos)
- 🧙 Guru (nível 20)

---

### [UC003 - Mentor IA e RAG](./UC003_MENTOR_IA_RAG.md)

**Descrição:** Sistema de Mentor IA "Dra. Sophie" com RAG (Retrieval-Augmented Generation) para responder dúvidas contextuais dos alunos 24/7.

**Principais Funcionalidades:**
- 🤖 Chat inteligente com especialista virtual
- 🔍 RAG: busca semântica em conteúdo dos cursos
- 📚 Respostas baseadas em conhecimento verificado
- 🎓 Modo tutor socrático (ensina fazendo perguntas)
- 🎯 Simulador de casos clínicos
- 💬 Mensagens proativas (celebração, incentivo, ajuda)
- 📊 Feedback e melhoria contínua
- ⚡ Streaming de respostas (SSE)

**Atores:**
- Aluno
- Dra. Sophie (Mentor IA)
- Sistema RAG
- Banco de Conhecimento

**Fluxos Cobertos:**
- Conversa com Dra. Sophie
- RAG pipeline (embedding + vector search)
- Geração de resposta contextualizada (LLM)
- Detecção de emergências médicas
- Modo simulação de casos clínicos
- Mensagens proativas
- Feedback de qualidade

**Tabelas Principais:**
- `tb_universidade_knowledge_chunks`
- `tb_universidade_feedback_ia`
- `tb_universidade_mensagens_proativas`
- `tb_conversas_usuarios` (reutilizada)
- `tb_messages` (reutilizada)

**Endpoints-Chave:**
- `POST /universidade/mentor/conversa/` - Iniciar conversa
- `POST /universidade/mentor/conversa/{id}/mensagem/` - Enviar pergunta (SSE)
- `POST /universidade/mentor/feedback/` - Enviar feedback
- `GET /universidade/mentor/historico/` - Histórico de conversas
- `POST /universidade/mentor/modo-simulacao/` - Ativar simulador

**Pipeline RAG:**
1. Análise da pergunta (intenção, entidades)
2. Gerar embedding da pergunta
3. Buscar chunks relevantes (vector search)
4. Montar prompt contextualizado
5. Chamar LLM com streaming
6. Salvar mensagem e solicitar feedback

**Tipos de Pergunta:**
- 🔬 Técnica (procedimentos, anatomia)
- 💊 Produto (substâncias, equipamentos)
- 📖 Curso (aulas, módulos)
- 💪 Motivacional (suporte emocional)
- 🏛️ Administrativo (certificação, plataforma)

---

### [UC004 - Certificações Blockchain](./UC004_CERTIFICACOES_BLOCKCHAIN.md)

**Descrição:** Sistema de certificados digitais verificáveis como NFTs na blockchain Polygon, garantindo autenticidade e imutabilidade.

**Principais Funcionalidades:**
- 📜 Certificado PDF profissional
- 🔗 NFT na blockchain Polygon (ERC-721)
- 🔒 Soulbound tokens (não-transferíveis)
- ✅ Verificação pública de autenticidade
- 💾 Metadata no IPFS (immutable)
- 🌐 Integração com OpenSea
- 💸 Gas fee pago pelo sistema (não pelo aluno)
- 🔍 Detecção de fraudes

**Atores:**
- Aluno
- Sistema de Certificação
- Blockchain (Polygon)
- Smart Contract
- Wallet Provider (MetaMask)
- Verificador Externo

**Fluxos Cobertos:**
- Conclusão de curso (elegibilidade)
- Geração de certificado PDF
- Mintagem de NFT na blockchain
- Configuração de wallet Web3
- Verificação pública de certificado
- Emissão de segunda via
- Detecção de certificados fraudulentos

**Tabelas Principais:**
- `tb_universidade_certificados`
- `tb_universidade_tentativas_fraude`
- `tb_universidade_ranking` (+ `wallet_address`)

**Endpoints-Chave:**
- `POST /universidade/certificados/emitir/` - Emitir certificado
- `GET /universidade/certificados/meus/` - Listar certificados
- `GET /verificar/{cd_verificacao}/` - Verificar certificado (público)
- `POST /universidade/configuracoes/wallet/` - Configurar wallet
- `POST /universidade/certificados/{id}/reivindicar-nft/` - Reivindicar NFT

**Smart Contract (Solidity):**
- `CertificadoNFT.sol` - Contrato ERC-721 customizado
- Função `mintCertificado()` - Emite NFT
- Função `verificarCertificado()` - Valida certificado
- Bloqueio de transferências (soulbound)

**Critérios de Elegibilidade:**
- ✅ `pc_conclusao >= 80%`
- ✅ Todas avaliações obrigatórias concluídas
- ✅ Curso ativo por 7+ dias
- ✅ Não duplicado

---

## 🗺️ Roadmap de Implementação

### Fase 1: MVP (Q1 2026) - Funcionalidades Essenciais

**Prioridade: 🔴 Alta**

1. **UC001 - Matrícula e Acesso** (4 semanas)
   - Catálogo de cursos
   - Sistema de inscrições
   - Checkout básico (cartão + PIX)
   - Player de vídeo
   - Progresso de curso

2. **UC002 - Gamificação Básica** (3 semanas)
   - Sistema de XP
   - Níveis (1-20)
   - 10 badges essenciais
   - Streak diário
   - Ranking global

3. **UC003 - Mentor IA Básico** (3 semanas)
   - Chat com Dra. Sophie
   - RAG com conteúdo indexado
   - Respostas contextuais
   - Feedback básico

4. **UC004 - Certificados PDF** (2 semanas)
   - Geração de PDF
   - Código de verificação
   - Página pública de verificação
   - (NFT adiado para Fase 2)

**Total Fase 1:** 12 semanas (3 meses)

---

### Fase 2: Expansão (Q2 2026) - Funcionalidades Avançadas

**Prioridade: 🟡 Média**

1. **UC001 - Marketplace Avançado**
   - Assinaturas recorrentes
   - Sistema de cupons
   - Gift cards
   - Teste grátis (trial)

2. **UC002 - Gamificação Avançada**
   - Ligas competitivas
   - Desafios entre amigos
   - Missões diárias
   - Eventos de XP duplo

3. **UC003 - Mentor IA Avançado**
   - Modo tutor socrático
   - Simulador de casos clínicos
   - Mensagens proativas
   - Fine-tuning com feedbacks

4. **UC004 - Certificados Blockchain**
   - Smart contract deployed
   - Mintagem de NFTs
   - Integração MetaMask
   - OpenSea listing

**Total Fase 2:** 8 semanas (2 meses)

---

### Fase 3: Inovação (Q3-Q4 2026) - Funcionalidades Web3 e Metaverso

**Prioridade: 🟢 Baixa (Futuro)**

1. **Realidade Aumentada (AR)**
   - Simulador AR de procedimentos
   - Visualização 3D de anatomia
   - Prática guiada com AR

2. **Metaverso**
   - Salas de aula virtuais
   - Avatares personalizados
   - Eventos ao vivo no metaverso

3. **Web3 Avançado**
   - Tokens de recompensa (ERC-20)
   - Staking de tokens
   - DAO de governança

4. **IA Avançada**
   - Geração de conteúdo adaptativo
   - Trilhas de aprendizado personalizadas
   - Análise preditiva de performance

---

## 🛠️ Stack Tecnológica

### Backend
- **Framework:** FastAPI 0.115+
- **Linguagem:** Python 3.12+
- **ORM:** SQLAlchemy 2.0+ (async)
- **Database:** PostgreSQL 16+ (com pgvector)
- **Cache:** Redis 6.4+
- **LLM:** OpenAI GPT-4 / Azure OpenAI
- **Vector Search:** pgvector ou Qdrant
- **Observability:** Langfuse
- **Blockchain:** Web3.py + Polygon RPC
- **Storage:** IPFS (Pinata ou similar)

### Frontend
- **Framework:** Next.js 15.2
- **Linguagem:** TypeScript 5.x
- **UI Library:** Shadcn/UI + Radix
- **Styling:** Tailwind CSS 3.4
- **State Management:** SWR (data fetching)
- **Auth:** NextAuth.js
- **Web3:** ethers.js / wagmi
- **Charts:** Recharts / Chart.js

### Infraestrutura
- **Cloud:** AWS / Azure / Google Cloud
- **CDN:** CloudFlare R2
- **Container:** Docker + Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana

---

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Catálogo  │  │  Player    │  │ Gamificação│            │
│  │  de Cursos │  │  de Vídeo  │  │ (XP/Badges)│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Chat IA    │  │ Certificados│  │   Wallet   │            │
│  │ (Dra Sophie│  │   (PDF+NFT) │  │ (MetaMask) │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          │ REST API + SSE
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Courses    │  │ Gamification│  │   Auth     │            │
│  │  Service   │  │   Service   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  AI Agent  │  │ Certificate │  │ Blockchain │            │
│  │ (RAG+LLM)  │  │   Service   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │    Redis     │  │   Polygon    │
│ + pgvector   │  │    Cache     │  │  Blockchain  │
└──────────────┘  └──────────────┘  └──────────────┘
         │
         ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   OpenAI     │  │    IPFS      │  │   Langfuse   │
│   GPT-4      │  │  (Metadata)  │  │ (Observ.)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔗 Integrações Externas

### Pagamentos
- **Stripe** - Cartão de crédito/débito (internacional)
- **MercadoPago** - PIX, boleto, cartão (Brasil)

### LLM e IA
- **OpenAI** - GPT-4 para Dra. Sophie
- **Azure OpenAI** - Alternativa enterprise
- **Langfuse** - Observabilidade de LLM

### Blockchain
- **Polygon** - Rede de baixo custo para NFTs
- **IPFS (Pinata)** - Armazenamento descentralizado
- **OpenSea** - Marketplace de NFTs

### Comunicação
- **SendGrid** - Emails transacionais
- **Twilio** - SMS e WhatsApp (opcional)

### Storage
- **AWS S3** - Vídeos e PDFs
- **CloudFlare R2** - CDN de assets

---

## 📈 Métricas de Sucesso

### Engajamento
- **Taxa de Conclusão:** > 60% dos alunos concluem cursos
- **Tempo Médio de Estudo:** > 3 horas/semana
- **Streak Médio:** > 7 dias consecutivos

### Gamificação
- **Alunos com Badge:** > 80% têm pelo menos 1 badge
- **Participação em Rankings:** > 40% ativos em ligas
- **XP Médio Diário:** > 50 XP/aluno

### IA (Dra. Sophie)
- **Taxa de Satisfação:** > 85% feedbacks positivos
- **Tempo de Resposta:** < 2s primeira palavra
- **Taxa de "Não Sei":** < 15%

### Certificações
- **Certificados Emitidos:** > 1.000/mês
- **NFTs Mintados:** > 70% optam por NFT
- **Verificações Públicas:** > 500/mês

---

## 📝 Convenções de Nomenclatura

### Banco de Dados
- **Tabelas:** `tb_universidade_*` (ex: `tb_universidade_cursos`)
- **Colunas:**
  - `id_` - Identificadores (PKs, FKs)
  - `nm_` - Nomes (VARCHAR)
  - `ds_` - Descrições (TEXT)
  - `vl_` - Valores (DECIMAL, INTEGER)
  - `dt_` - Datas (TIMESTAMP)
  - `fg_` - Flags booleanas (BOOLEAN)
  - `qt_` - Quantidades (INTEGER)
  - `pc_` - Percentuais (DECIMAL)
  - `cd_` - Códigos (VARCHAR)
  - `url_` - URLs (VARCHAR)

### API Endpoints
- **Padrão:** `/universidade/{recurso}/`
- **Exemplos:**
  - `GET /universidade/cursos/`
  - `POST /universidade/inscricoes/`
  - `GET /universidade/gamificacao/badges/`

### Frontend Components
- **PascalCase:** `UniversidadeCourseCard`
- **Hooks:** `useVagas`, `useCertificados`

---

## 👥 Equipe Recomendada

### Fase 1 (MVP)
- 1 Tech Lead (Full-Stack)
- 2 Desenvolvedores Backend (Python/FastAPI)
- 2 Desenvolvedores Frontend (Next.js/TypeScript)
- 1 Engenheiro de IA/ML (RAG, LLM)
- 1 Designer UX/UI
- 1 QA Engineer

**Total:** 8 pessoas

### Fase 2 (Expansão)
- +1 Desenvolvedor Blockchain (Solidity/Web3)
- +1 Engenheiro DevOps/Infra

**Total:** 10 pessoas

---

## 📚 Referências

### Documentação Técnica
- [Documentação Arquitetura Completa DoctorQ](../DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)
- [Proposta Universidade da Beleza](../UNIVERSIDADE_BELEZA_PROPOSTA_INOVADORA.md)
- [Guia de Padrões](../GUIA_PADROES.md)
- [Changelog](../CHANGELOG.md)

### Inspirações
- **Duolingo** - Gamificação e engajamento
- **Coursera** - Certificações e qualidade
- **Netflix** - UX de catálogo e recomendações
- **ChatGPT** - Assistente IA conversacional
- **OpenSea** - Marketplace de NFTs

---

## 📞 Contato

**Projeto:** DoctorQ - Universidade da Beleza
**Versão:** 1.0
**Data:** 13/11/2025

---

**Próximos Passos:**
1. Revisar e aprovar casos de uso com stakeholders
2. Priorizar features para Sprint 1
3. Criar épicos e user stories no Jira/GitHub
4. Iniciar desenvolvimento do MVP (Fase 1)

---

✅ **Documentação Completa de Casos de Uso Finalizada**
