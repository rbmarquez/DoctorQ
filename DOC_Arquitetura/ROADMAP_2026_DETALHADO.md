# 🗓️ ROADMAP 2026 DETALHADO - DoctorQ Platform

**Versão:** 1.0
**Data:** 12/11/2025
**Status:** Planejamento Aprovado

---

## 📊 VISÃO GERAL 2026

```
Q1 (Jan-Mar)          Q2 (Abr-Jun)          Q3 (Jul-Set)          Q4 (Out-Dez)
═══════════════       ═══════════════       ═══════════════       ═══════════════
GO-LIVE               GROWTH                CONTENT               SCALE
PREPARATION           FEATURES              & EDUCATION           & EXPANSION

🎯 50 clínicas        🎯 200 clínicas       🎯 500 clínicas       🎯 1.000 clínicas
💰 R$ 22k MRR         💰 R$ 89k MRR         💰 R$ 224k MRR        💰 R$ 447k MRR
```

---

## Q1/2026: GO-LIVE PREPARATION (Semanas 1-12)

### 🎯 Objetivo
Plataforma pronta para primeiros clientes pagantes com funcionalidades críticas implementadas.

### 📦 SPRINT 1-2: Sistema de Qualificação de Leads

**Duração:** 2 semanas (01-14 de Janeiro)
**Prioridade:** 🔴 CRÍTICA
**Responsável:** Backend Team + Product

#### Tasks Técnicas:

**Backend (5 dias):**
- [ ] Criar `LeadQualificationService`
- [ ] Model `tb_lead_qualifications` (perguntas + respostas JSONB)
- [ ] Algoritmo de matching (score 0-100%)
- [ ] Endpoint `POST /onboarding/patient/qualifications`
- [ ] Endpoint `POST /profissionais/preferences`
- [ ] Endpoint `GET /profissionais/matches?patient_id=X`

**Frontend (5 dias):**
- [ ] Wizard 6 steps paciente (componente React)
- [ ] Wizard 6 steps profissional (settings)
- [ ] Dashboard de leads com score
- [ ] Badge "Match 85%+"

**Testes (2 dias):**
- [ ] Unit tests do algoritmo
- [ ] E2E do fluxo completo

**Entrega:** Sistema funcional de qualificação de leads

---

### 📦 SPRINT 3-5: Integração WhatsApp Business

**Duração:** 3 semanas (15 Jan - 04 Fev)
**Prioridade:** 🔴 CRÍTICA
**Responsável:** Backend Team + DevOps

#### Tasks Técnicas:

**Integração (1 semana):**
- [ ] Conta Twilio WhatsApp Business
- [ ] Webhook `POST /webhooks/whatsapp`
- [ ] `NotificationService.send_whatsapp()`
- [ ] Templates aprovados (confirmação, lembrete, etc)

**Chatbot WhatsApp (1 semana):**
- [ ] Routing de mensagens WhatsApp → IA
- [ ] Streaming de respostas (WhatsApp não suporta SSE, usar mensagens incrementais)
- [ ] Comandos: /agendar, /cancelar, /ajuda

**Frontend (1 semana):**
- [ ] Inbox unificado (Web + WhatsApp)
- [ ] Configurações WhatsApp (número, horário)
- [ ] Dashboard de métricas (entrega, leitura, resposta)

**Entrega:** WhatsApp integrado com notificações automáticas

---

### 📦 SPRINT 6: Integração Gateway de Pagamentos

**Duração:** 1 semana (05-11 Fev)
**Prioridade:** 🔴 CRÍTICA
**Responsável:** Backend Team

#### Tasks Técnicas:

- [ ] Conta Stripe (ou PagSeguro)
- [ ] `PaymentService.create_payment_intent()`
- [ ] `PaymentService.create_subscription()`
- [ ] Webhook `POST /webhooks/stripe`
- [ ] Frontend: Stripe Checkout (hosted)
- [ ] Testes de transação

**Entrega:** Pagamentos funcionando (assinaturas SaaS)

---

### 📦 SPRINT 7-8: Testes E2E e Correções

**Duração:** 2 semanas (12-25 Fev)
**Prioridade:** 🟡 ALTA
**Responsável:** QA + Devs

#### Fluxos a Testar:

- [ ] Cadastro completo (paciente, profissional, clínica)
- [ ] Onboarding guiado (3 perfis)
- [ ] Busca inteligente + IA
- [ ] Agendamento end-to-end
- [ ] WhatsApp notifications
- [ ] Pagamento de assinatura
- [ ] Marketplace (compra de produto)
- [ ] Avaliação pós-procedimento

**Entrega:** Lista de bugs críticos corrigidos

---

### 📦 SPRINT 9-10: Deploy Produção

**Duração:** 2 semanas (26 Fev - 11 Mar)
**Prioridade:** 🔴 CRÍTICA
**Responsável:** DevOps + CTO

#### Tasks:

- [ ] Ambiente produção AWS/GCP
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoramento (Grafana + Prometheus)
- [ ] Backup automatizado (diário)
- [ ] SSL certificado
- [ ] Domínio doctorq.app
- [ ] Load testing (500 usuários simultâneos)

**Entrega:** Plataforma no ar, estável, monitorada

---

### 📦 SPRINT 11-12: Beta Onboarding

**Duração:** 2 semanas (12-25 Mar)
**Prioridade:** 🟡 ALTA
**Responsável:** Customer Success + Product

#### Tasks:

- [ ] Recrutar 50 clínicas beta (Brasília)
- [ ] Onboarding individual (chamada 1:1)
- [ ] Coleta de feedback (surveys)
- [ ] Ajustes rápidos (hotfixes)
- [ ] Cases de sucesso (2-3 clínicas)

**Entrega:** 50 clínicas ativas, feedback coletado

---

### 📊 Métricas de Sucesso Q1

| Métrica | Meta | Método de Medição |
|---------|------|-------------------|
| Clínicas Ativas | 50 | COUNT(tb_empresas WHERE fg_ativo = true) |
| Profissionais | 150 | COUNT(tb_profissionais WHERE fg_ativo = true) |
| Pacientes | 1.000 | COUNT(tb_pacientes WHERE fg_ativo = true) |
| Agendamentos | 500/mês | COUNT(tb_agendamentos WHERE dt_agendamento >= start_of_month) |
| MRR | R$ 22.350 | SUM(tb_partner_licenses.vl_monthly) |
| NPS | 50+ | Survey NPS após 30 dias de uso |
| Churn | <5% | COUNT(cancelamentos) / COUNT(total_clientes) |

---

## Q2/2026: GROWTH FEATURES (Semanas 13-24)

### 🎯 Objetivo
Diferenciação competitiva e aumento de engajamento.

### 📦 SPRINT 13-16: Avatar "Gisele" Interativo

**Duração:** 4 semanas (Abr)
**Prioridade:** 🟡 MÉDIA

#### Fases:

**Fase 1: Mockup e Design (1 semana)**
- [ ] Wireframes do avatar (Figma)
- [ ] Body mapping (SVG com regiões clicáveis)
- [ ] Fluxo de interação

**Fase 2: Frontend (2 semanas)**
- [ ] Biblioteca 3D (Three.js ou Ready Player Me)
- [ ] Canvas interativo (click em regiões)
- [ ] Integração com chatbot

**Fase 3: Backend (1 semana)**
- [ ] Endpoint `POST /avatar/analyze` (recebe regiões marcadas)
- [ ] Prompt engineering (regiões → procedimentos)

**Entrega:** Avatar funcional com body mapping

---

### 📦 SPRINT 17-19: Gamificação Completa

**Duração:** 3 semanas (Mai)
**Prioridade:** 🟡 MÉDIA

#### Tasks:

**Backend (2 semanas):**
- [ ] `LoyaltyService`
- [ ] Models: `tb_pontos`, `tb_resgates`, `tb_loyalty_levels`
- [ ] Regras: 10 pts/avaliação, 50 pts/indicação
- [ ] Catálogo de resgates (API)

**Frontend (1 semana):**
- [ ] Widget de pontos no header
- [ ] Página de resgates
- [ ] Dashboard de níveis (Bronze → Platinum)
- [ ] Badges e conquistas

**Entrega:** Sistema de pontos gamificado

---

### 📦 SPRINT 20-27: App Mobile MVP

**Duração:** 8 semanas (Jun-Jul)
**Prioridade:** 🟡 MÉDIA

#### Stack:
- React Native (iOS + Android)
- Expo para build
- Push notifications (Firebase)

#### Features MVP:
- [ ] Login / Registro
- [ ] Busca de procedimentos
- [ ] Agendamento
- [ ] Chat com IA
- [ ] Notificações push
- [ ] Perfil do paciente

**Entrega:** App na App Store + Google Play

---

### 📦 SPRINT 28: Integração Google Calendar

**Duração:** 2 semanas (Ago)
**Prioridade:** 🟢 BAIXA

**Entrega:** Sincronização bi-direcional com Google Calendar

---

### 📊 Métricas de Sucesso Q2

| Métrica | Meta |
|---------|------|
| Clínicas Ativas | 200 |
| MRR | R$ 89.400 |
| Downloads App | 5.000 |
| Taxa de Engajamento (Gamificação) | 40% |

---

## Q3/2026: CONTENT & EDUCATION (Semanas 25-36)

### 🎯 Objetivo
Educação de pacientes e monetização de cursos.

### 📦 SPRINT 29-34: Universidade da Beleza (LMS)

**Duração:** 6 semanas (Set-Out)
**Prioridade:** 🟡 MÉDIA

#### Arquitetura LMS:

**Models:**
- `tb_cursos`
- `tb_modulos`
- `tb_aulas`
- `tb_quizzes`
- `tb_respostas_quiz`
- `tb_certificados`

**Features:**
- [ ] Player de vídeo (Vimeo API)
- [ ] Progress tracking
- [ ] Quizzes interativos
- [ ] Certificado PDF
- [ ] Marketplace de cursos (R$ 99-499)

**Entrega:** LMS funcional com 1 curso piloto

---

### 📦 SPRINT 35-38: Módulo "Processo de Envelhecimento"

**Duração:** 4 semanas (Nov)
**Prioridade:** 🟡 MÉDIA

#### Conteúdo:
- 10 vídeos de 5 minutos
- Temas: Pele, gordura, músculo, osso, tratamentos
- Quiz ao final de cada vídeo
- Certificação "Paciente Educado"

**Entrega:** Módulo educativo completo

---

### 📦 SPRINT 39-40: Biblioteca de Procedimentos

**Duração:** 2 semanas (Dez)
**Prioridade:** 🟢 BAIXA

**Conteúdo:**
- Fichas técnicas (50 procedimentos)
- Vídeos explicativos
- Fotos antes/depois

**Entrega:** Biblioteca pública

---

### 📦 SPRINT 41-42: Programa de Embaixadores

**Duração:** 2 semanas (Dez)
**Prioridade:** 🟢 BAIXA

**Features:**
- [ ] Sistema de convites
- [ ] Badge "Embaixador"
- [ ] Dashboard especial
- [ ] Comissões diferenciadas

**Entrega:** 10 embaixadores recrutados

---

### 📊 Métricas de Sucesso Q3

| Métrica | Meta |
|---------|------|
| Clínicas Ativas | 500 |
| MRR | R$ 223.500 |
| Alunos LMS | 1.000 |
| Cursos Vendidos | 200 (R$ 20k receita) |

---

## Q4/2026: SCALE & EXPANSION (Semanas 37-48)

### 🎯 Objetivo
Escalabilidade e expansão internacional.

### 📦 SPRINT 43-46: Multi-idioma

**Duração:** 4 semanas
**Prioridade:** 🟢 BAIXA

**Idiomas:**
- Português (BR)
- Espanhol (LATAM)
- Inglês (US)

**Entrega:** i18n completo

---

### 📦 SPRINT 47-48: Multi-moeda

**Duração:** 2 semanas
**Prioridade:** 🟢 BAIXA

**Moedas:**
- BRL (Real)
- USD (Dólar)
- EUR (Euro)

**Entrega:** Conversão automática

---

### 📦 SPRINT 49-54: White-label

**Duração:** 6 semanas
**Prioridade:** 🟡 MÉDIA

**Features:**
- [ ] Customização de marca (logo, cores)
- [ ] Domínio próprio (franquia.doctorq.app)
- [ ] Pricing: R$ 15k setup + 5% royalties

**Entrega:** 1 franquia white-label ativa

---

### 📦 SPRINT 55-58: API Pública

**Duração:** 4 semanas
**Prioridade:** 🟢 BAIXA

**Entrega:**
- REST API documentada (Swagger)
- Webhooks
- SDKs (Python, JS, PHP)

---

### 📊 Métricas de Sucesso Q4

| Métrica | Meta |
|---------|------|
| Clínicas Ativas | 1.000 |
| MRR | R$ 447.000 |
| Franquias White-label | 1-2 |
| Expansão LATAM | Soft-launch Argentina |

---

## 📊 RESUMO ANUAL 2026

| Trimestre | Clínicas | MRR | ARR Acumulado |
|-----------|----------|-----|---------------|
| Q1 | 50 | R$ 22k | R$ 268k |
| Q2 | 200 | R$ 89k | R$ 1,07M |
| Q3 | 500 | R$ 224k | R$ 2,68M |
| Q4 | 1.000 | R$ 447k | **R$ 5,36M** |

---

## 🎯 DEPENDÊNCIAS CRÍTICAS

### Bloqueadores Q1:
- ⚠️ Conta Twilio (WhatsApp) - 2 dias para aprovação
- ⚠️ Conta Stripe - 1 dia para aprovação
- ⚠️ Infraestrutura AWS/GCP - Provisionar com antecedência

### Recursos Necessários:
- **Q1:** 9 pessoas (2 backend, 2 frontend, 1 PM, 1 designer, 2 CS, 1 CTO)
- **Q2:** +2 mobile devs
- **Q3:** +1 produtor de conteúdo
- **Q4:** +1 DevOps

---

## 📋 CHECKLIST DE EXECUÇÃO

### Antes de Iniciar Q1:
- [ ] Equipe contratada (9 pessoas)
- [ ] Infraestrutura provisionada
- [ ] Contas criadas (Twilio, Stripe, AWS)
- [ ] Backlog refinado (sprints 1-12)

### Antes de Iniciar Q2:
- [ ] 50 clínicas beta ativas
- [ ] Feedback coletado e priorizado
- [ ] Mobile devs contratados

### Antes de Iniciar Q3:
- [ ] Produtor de conteúdo contratado
- [ ] 10 vídeos gravados (módulo envelhecimento)
- [ ] LMS arquitetura validada

### Antes de Iniciar Q4:
- [ ] Estratégia de internacionalização definida
- [ ] Parceiro white-label identificado
- [ ] API pública especificada

---

**Documento mantido por:** Product Team
**Próxima Revisão:** Final de cada trimestre
**Versão:** 1.0 (12/11/2025)
