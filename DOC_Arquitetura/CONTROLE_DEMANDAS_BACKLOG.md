# 📊 Controle de Demandas - DoctorQ Platform

## Documento de Backlog e Controle de Evolução

**Versão:** 1.0.0
**Última Atualização:** 07/11/2025
**Responsável:** Product Owner / Tech Lead
**Frequência de Atualização:** Semanal (toda segunda-feira)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Metodologia de Controle](#metodologia-de-controle)
3. [Demandas Corretivas (Bugs)](#demandas-corretivas-bugs)
4. [Demandas Evolutivas (Features)](#demandas-evolutivas-features)
5. [Melhorias Técnicas](#melhorias-técnicas)
6. [Débito Técnico](#débito-técnico)
7. [Roadmap de Releases](#roadmap-de-releases)
8. [Métricas e KPIs](#métricas-e-kpis)
9. [Templates](#templates)
10. [Histórico de Atualizações](#histórico-de-atualizações)

---

## 📊 Visão Geral

### Estatísticas Atuais (07/11/2025)

| Categoria | Total | Aberto | Em Progresso | Concluído | Bloqueado |
|-----------|-------|--------|--------------|-----------|-----------|
| **🐛 Bugs Críticos** | 5 | 3 | 2 | 0 | 0 |
| **🐛 Bugs Altos** | 12 | 8 | 3 | 1 | 0 |
| **🐛 Bugs Médios** | 23 | 15 | 5 | 3 | 0 |
| **🐛 Bugs Baixos** | 8 | 6 | 0 | 2 | 0 |
| **✨ Features Críticas** | 4 | 2 | 2 | 0 | 0 |
| **✨ Features Altas** | 18 | 12 | 4 | 2 | 0 |
| **✨ Features Médias** | 35 | 28 | 5 | 2 | 0 |
| **✨ Features Baixas** | 20 | 18 | 1 | 1 | 0 |
| **🔧 Melhorias Técnicas** | 32 | 25 | 5 | 2 | 0 |
| **💳 Débito Técnico** | 15 | 12 | 2 | 1 | 0 |
| **TOTAL** | **172** | **129** | **29** | **14** | **0** |

### Distribuição por Origem

```
Cliente/Usuário:     65 (37.8%)
Equipe Interna:      52 (30.2%)
Análise de Código:   35 (20.3%)
Compliance/Legal:    12 (7.0%)
Segurança:           8 (4.7%)
```

### Velocidade do Time (Últimos 30 dias)

- **Demandas Concluídas:** 14
- **Velocity Média:** 3.5 demandas/semana
- **Lead Time Médio:** 12 dias
- **Cycle Time Médio:** 5 dias
- **Taxa de Bugs Reabertos:** 8%

---

## 🎯 Metodologia de Controle

### Sistema de Priorização (Framework RICE)

Cada demanda recebe uma pontuação baseada em:

**RICE Score = (Reach × Impact × Confidence) / Effort**

| Fator | Descrição | Escala |
|-------|-----------|--------|
| **Reach** | Quantos usuários serão impactados | 1-10 (1=<10%, 10=100%) |
| **Impact** | Qual o impacto no negócio/UX | 1-3 (1=Mínimo, 2=Médio, 3=Massivo) |
| **Confidence** | Qual a confiança na estimativa | 1-100% |
| **Effort** | Quanto esforço (em dias-pessoa) | 1-∞ |

### Classificação de Prioridade

| Prioridade | RICE Score | Descrição | SLA |
|------------|------------|-----------|-----|
| 🔴 **P0 - Crítico** | >8.0 | Sistema down, perda de dados, segurança | 4h |
| 🟠 **P1 - Alto** | 5.0-8.0 | Funcionalidade core quebrada, bug severo | 24h |
| 🟡 **P2 - Médio** | 2.0-5.0 | Bug moderado, feature importante | 7 dias |
| 🟢 **P3 - Baixo** | <2.0 | Melhoria, nice-to-have | 30 dias |

### Estados de Demanda

```
Backlog → Triagem → Aprovado → ToDo → InProgress → CodeReview → Testing → Done
                  ↘ Rejeitado
```

### Labels e Tags

**Por Tipo:**
- `bug` - Defeito no sistema
- `feature` - Nova funcionalidade
- `enhancement` - Melhoria em funcionalidade existente
- `refactor` - Refatoração de código
- `docs` - Documentação
- `test` - Testes
- `security` - Segurança
- `performance` - Performance

**Por Módulo:**
- `auth` - Autenticação
- `agendamentos` - Agendamentos
- `billing` - Faturamento
- `ia` - Inteligência Artificial
- `marketplace` - Marketplace
- `frontend` - Interface
- `backend` - API
- `database` - Banco de dados
- `infra` - Infraestrutura

---

## 🐛 Demandas Corretivas (Bugs)

### 🔴 P0 - Críticos (SLA: 4h)

#### BUG-001: Sistema de agendamento não valida conflitos de horário
**Status:** 🟡 Em Progresso (70%)
**Criado:** 05/11/2025 | **Atribuído:** João Silva
**Módulo:** `agendamentos` | **Prioridade:** P0

**Descrição:**
Sistema permite criar múltiplos agendamentos no mesmo horário para o mesmo profissional, causando overbooking.

**RICE Score:** 9.5 (Reach: 10, Impact: 3, Confidence: 100%, Effort: 3 dias)

**Solução:** Implementar transaction lock otimista + validação dupla

**Progresso:**
- [x] Análise técnica (100%)
- [x] Backend implementado (70%)
- [ ] Frontend (0%)
- [ ] Testes (0%)

---

#### BUG-002: Pagamentos PIX não processam callback
**Status:** 🔵 To Do
**Criado:** 06/11/2025 | **Atribuído:** Maria Santos
**Módulo:** `billing` | **Prioridade:** P0

**Descrição:**
Webhooks de confirmação PIX não validam signature corretamente, pedidos ficam pendentes.

**RICE Score:** 8.7 (Reach: 3, Impact: 3, Confidence: 100%, Effort: 1 dia)

**Impacto:** 30% das transações (PIX)

---

#### BUG-003: Sessão expira durante upload de documentos grandes
**Status:** 🔵 Backlog
**Criado:** 04/11/2025
**Módulo:** `ia` | **Prioridade:** P0

**Descrição:**
Upload de documentos >20MB causa timeout de sessão JWT (401).

**RICE Score:** 7.2

**Solução:** Refresh token automático durante upload

---

### 🟠 P1 - Altos (SLA: 24h)

#### BUG-004: Notificações WhatsApp duplicadas
**RICE:** 6.5 | **Status:** Backlog
Usuários recebem 2-3x a mesma notificação.

#### BUG-005: Relatórios de faturamento incorretos
**RICE:** 6.0 | **Status:** Backlog
Valores 15% abaixo do real (estornos mal calculados).

#### BUG-006: Busca não retorna resultados parciais
**RICE:** 5.8 | **Status:** Backlog

#### BUG-007: Avatar não atualiza após upload
**RICE:** 5.5 | **Status:** Backlog

---

### 🟡 P2 - Médios (18 bugs)
*Lista resumida - detalhes no tracking tool*

---

### 🟢 P3 - Baixos (8 bugs)
*Lista resumida*

---

## ✨ Demandas Evolutivas (Features)

### 🔴 P0 - Críticas

#### FEAT-001: Integração Google Calendar
**Status:** 🟡 Em Progresso (60%)
**Criado:** 01/11/2025 | **Atribuído:** Pedro Costa
**RICE Score:** 9.0

**Descrição:**
Sincronização bidirecional de agendamentos com Google Calendar.

**User Story:**
```
Como profissional,
Quero meus agendamentos no Google Calendar,
Para visualizar tudo em um lugar.
```

**Progresso:**
- [x] OAuth 2.0 (100%)
- [x] API client (60%)
- [ ] Webhook receiver
- [ ] Sync bidirecional
- [ ] Testes

**Previsão:** 12/11/2025

---

#### FEAT-002: Pagamento via Boleto
**Status:** 🔵 To Do
**RICE Score:** 8.5
**Impacto:** +15-20% conversão

**Requisitos:**
- Integração PagSeguro/Mercado Pago
- Geração de PDF
- Validação via webhook
- Email automático

---

#### FEAT-003: Chatbot IA para Suporte Nível 1
**Status:** 🔵 Backlog
**RICE Score:** 7.8

Responder dúvidas comuns antes de escalar para humano.

---

#### FEAT-004: Aplicativo Mobile (React Native)
**Status:** 🔵 Backlog
**RICE Score:** 7.5
**Esforço:** 10 dias (MVP)

**Funcionalidades MVP:**
- Login e autenticação
- Visualizar/criar agendamentos
- Notificações push
- Chat com IA

---

### 🟠 P1 - Altas (18 features)

#### FEAT-005: Pacotes de procedimentos (combo)
**RICE:** 6.8

#### FEAT-006: Programa de fidelidade
**RICE:** 6.5

#### FEAT-007: Integração Outlook Calendar
**RICE:** 6.2

*...mais 15 features*

---

### 🟡 P2 - Médias (35 features)

- Sistema de gamificação
- Live chat profissional-paciente
- Marketplace de cursos
- Telemedicina
- *...mais 31 features*

---

### 🟢 P3 - Baixas (20 features)

- Tema escuro automático
- Atalhos de teclado
- Easter eggs
- *...mais 17 features*

---

## 🔧 Melhorias Técnicas

### MT-001: Suite de Testes Completa
**Status:** 🟡 Em Progresso (40%)
**Prioridade:** 🔴 Crítico
**Esforço:** 8 dias

**Objetivo:** 5% → 70% cobertura backend, 2% → 60% frontend

**Plano:**
- Semana 1: Testes unitários (services críticos)
- Semana 2: Testes integração (APIs)
- Semana 3: Testes E2E (fluxos críticos)
- Semana 4: CI/CD obrigatório

**Progresso:**
- [x] Setup pytest + jest
- [x] user_service (100% coverage)
- [ ] agendamento_service
- [ ] billing_service
- [ ] E2E com Playwright

---

### MT-002: Otimizar Performance de Queries
**Status:** 🔵 To Do
**Prioridade:** 🟠 Alto
**Esforço:** 3 dias

**Queries lentas identificadas:** P95 em 2-3s

**Otimizações:**
- Índices compostos
- Eager loading (N+1 fix)
- Cache Redis
- Paginação obrigatória

---

### MT-003: Migrar IA para Microservice
**Status:** 🔵 Backlog
**Esforço:** 10 dias

Módulo IA consome 70% dos recursos, precisa escalar independente.

---

### Mais 29 melhorias técnicas mapeadas

---

## 💳 Débito Técnico

### DT-001: Código comentado e dead code
**Impacto:** 🟡 Médio | **Esforço:** 1 dia
500+ linhas de código comentado para remover.

---

### DT-002: ignoreBuildErrors no Next.js
**Impacto:** 🔴 Crítico | **Esforço:** 2 dias

```typescript
// ❌ CRÍTICO - permitindo erros TypeScript em produção
typescript: { ignoreBuildErrors: true }
```

**Ação:** Corrigir ~50 erros TS + remover flag

---

### DT-003: Pylint com 40+ regras desabilitadas
**Impacto:** 🟠 Alto
Reduz efetividade do linting.

---

### Mais 12 itens de débito técnico

---

## 🗓️ Roadmap de Releases

### Sprint Atual: Sprint 23 (04/11 - 17/11/2025)

**Objetivo:** Estabilidade + Bugs Críticos

**Planejado:**
- [x] BUG-001 (70% done)
- [ ] BUG-002
- [ ] FEAT-001 (finalizar)
- [ ] MT-001 (continuar)

**Capacidade:** 20 SP | **Usado:** 12 SP | **Disponível:** 8 SP

---

### Release 1.1.0 (18/11/2025)

**Tema:** Integrações e Estabilidade

**Incluído:**
- ✅ Google Calendar
- ✅ Boleto
- ✅ Bugs P0/P1 críticos
- ✅ 70% test coverage

---

### Release 1.2.0 (02/12/2025)

**Tema:** Mobile e UX

**Incluído:**
- App Mobile MVP
- Chatbot IA
- Pacotes de procedimentos
- 15 bugs médios

---

### Release 2.0.0 (Q1 2026)

**Tema:** Escalabilidade

**Incluído:**
- Microservices
- Multi-idioma
- Kubernetes
- GraphQL

---

## 📊 Métricas e KPIs

### Qualidade

| Métrica | Atual | Meta | Status |
|---------|-------|------|--------|
| Cobertura Testes Backend | 5% | 70% | 🔴 |
| Cobertura Testes Frontend | 2% | 60% | 🔴 |
| Bugs Críticos Abertos | 3 | 0 | 🟠 |
| Débito Técnico (SP) | 45 | <20 | 🔴 |
| Code Smells | 120 | <50 | 🟠 |

### Velocidade

| Métrica | Atual | Meta |
|---------|-------|------|
| Lead Time | 12 dias | <7 dias |
| Cycle Time | 5 dias | <3 dias |
| Deploy Frequency | 2x/sem | Diário |
| MTTR | 3h | <1h |

### Satisfação

| Métrica | Atual | Meta |
|---------|-------|------|
| NPS | 65 | >75 |
| CSAT | 4.2/5 | >4.5 |

---

## 📝 Templates

### Template: Bug Report

```markdown
## BUG-XXX: [Título do bug]

**Status:** 🔵 Backlog
**Criado:** DD/MM/AAAA
**Atribuído:** Nome
**Módulo:** `modulo` | **Prioridade:** PX

**Descrição:**
[Clara e concisa]

**Impacto:**
- Afeta X% dos usuários
- Quebra funcionalidade Y

**RICE Score:** X.X
- Reach: X
- Impact: X
- Confidence: X%
- Effort: X dias

**Reprodução:**
1. Passo 1
2. Passo 2
3. Resultado observado

**Esperado:** [O que deveria acontecer]

**Solução Proposta:**
[Como corrigir]

**Arquivos:**
- `arquivo1.py`
- `arquivo2.tsx`

**Progresso:**
- [ ] Análise
- [ ] Implementação
- [ ] Testes
- [ ] Review
- [ ] Deploy
```

---

### Template: Feature Request

```markdown
## FEAT-XXX: [Título da feature]

**Status:** 🔵 Backlog
**Criado:** DD/MM/AAAA
**Módulo:** `modulo` | **Prioridade:** PX

**Descrição:**
[O que é a feature]

**Valor de Negócio:**
- Por que importante
- Problema que resolve
- Dados/métricas

**RICE Score:** X.X

**User Story:**
```
Como [usuário],
Quero [ação],
Para [benefício].

Critérios:
- [ ] Critério 1
- [ ] Critério 2
```

**Especificação Técnica:**
[Detalhes de implementação]

**Dependências:**
- [ ] Dep 1
- [ ] Dep 2

**Progresso:**
- [ ] Discovery
- [ ] Design
- [ ] Implementação
- [ ] Testes
- [ ] Deploy
```

---

## 🔄 Processo de Atualização

### Frequência

| Atividade | Frequência | Responsável |
|-----------|------------|-------------|
| Atualizar status | Diário | Dev |
| Adicionar demandas | Contínuo | PO/Tech Lead |
| Revisar prioridades | Semanal (seg) | PO + Tech |
| Atualizar métricas | Semanal (sex) | Tech Lead |
| Sprint Planning | Quinzenal | Time |

### Checklist Semanal (Segunda-feira)

- [ ] Atualizar estatísticas gerais
- [ ] Revisar status de demandas
- [ ] Adicionar novos bugs/features
- [ ] Recalcular RICE scores
- [ ] Atualizar roadmap
- [ ] Atualizar métricas
- [ ] Arquivar concluídos
- [ ] Commitar mudanças
- [ ] Notificar time

---

## 📚 Histórico de Atualizações

### Versão 1.0.0 - 07/11/2025
**Criação Inicial**

**Conteúdo:**
- 48 bugs mapeados (P0-P3)
- 77 features mapeadas
- 32 melhorias técnicas
- 15 débito técnico
- Templates criados
- Roadmap 2025-2026

**Estatísticas Iniciais:**
- Total: 172 demandas
- Cobertura testes: 5%/2%
- Bugs críticos: 3 abertos

**Responsável:** Tech Lead

---

### [Template para Próximas Atualizações]

### Versão X.X.X - DD/MM/AAAA

**Adicionadas:**
- BUG-XXX
- FEAT-XXX

**Concluídas:**
- [x] BUG-XXX
- [x] FEAT-XXX

**Mudanças de Prioridade:**
- FEAT-XXX: P2 → P1

**Métricas:**
- Testes: X% → Y%
- Bugs: X → Y

---

## 🔗 Referências

### Documentação
- [Análise de Código](./ANALISE_CODIGO_BOAS_PRATICAS_MELHORIAS.md)
- [Casos de Uso](./CASOS_DE_USO/README.md)
- [Doc Técnica](./DOCUMENTACAO_TECNICA_COMPLETA.md)

### Ferramentas
- **Tracking:** GitHub Projects
- **CI/CD:** GitHub Actions
- **Errors:** Sentry
- **Metrics:** SonarQube

### Convenções
- **Commits:** Conventional Commits
- **Branches:** GitFlow
- **Review:** Min 1 aprovação

---

## 📞 Contato

**Product Owner:** po@doctorq.app
**Tech Lead:** tech@doctorq.app
**Suporte:** support@doctorq.app

**Slack:**
- `#desenvolvimento`
- `#bugs`
- `#features`
- `#releases`

---

**Última Atualização:** 07/11/2025 12:00
**Próxima Revisão:** 11/11/2025 (segunda)
**Versão:** 1.0.0

*Documento vivo - atualizado semanalmente*

---

*© 2025 DoctorQ Platform. Controle de Demandas e Backlog.*
