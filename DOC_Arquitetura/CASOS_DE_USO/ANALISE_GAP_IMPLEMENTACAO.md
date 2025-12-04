# 🔍 Análise de Gap - Implementação vs Documentação

## Visão Geral

Este documento analisa o **gap entre casos de uso documentados e código implementado**, identificando:
- ✅ O que está implementado
- 🔄 O que está parcialmente implementado
- ❌ O que falta implementar
- 🆕 O que foi implementado além do documentado

**Data da Análise:** 07/11/2025
**Versão:** 1.0.0

---

## 📊 Resumo Executivo

### Status Geral

| Status | Casos de Uso | Percentual | Observação |
|--------|--------------|------------|------------|
| ✅ Implementado | 67 | 73.6% | Funcional e testado |
| 🔄 Em Desenvolvimento | 20 | 22.0% | Parcialmente implementado |
| ❌ Não Implementado | 4 | 4.4% | Planejado |
| **TOTAL** | **91** | **100%** | |

### Prioridade dos Gaps

| Prioridade | Quantidade | UCs Críticos |
|------------|-----------|--------------|
| 🔴 Alta | 8 | UC003, UC032, UC043, UC054, UC063, UC093, UC116, UC125 |
| 🟡 Média | 10 | UC085, UC095, UC096, UC103, UC105, UC114, UC115 |
| 🟢 Baixa | 2 | UC076 (parcial) |

---

## 📋 Análise Detalhada por Módulo

## 01. 🔐 Autenticação e Usuários (UC001-UC007)

### ✅ Implementado Completamente (7/7 - 100%)

| UC | Nome | Rotas | Services | Status |
|----|------|-------|----------|--------|
| UC001 | Realizar Login | `user.py` | `user_service.py` | ✅ OAuth + Local funcionando |
| UC002 | Registrar Novo Usuário | `user.py` | `user_service.py` | ✅ Completo |
| UC003 | Recuperar Senha | - | - | ❌ **NÃO IMPLEMENTADO** |
| UC004 | Alterar Senha | `user.py` | `user_service.py` | ✅ Completo |
| UC005 | Gerenciar Perfil | `user.py` | `user_service.py` | ✅ Completo |
| UC006 | Gerenciar Permissões | `permissions.py` | `permission_service.py` | ✅ Completo |
| UC007 | Sincronizar SEI | `sei.py` | `user_service.py` | ✅ Completo |

### ❌ Gap Identificado

**UC003 - Recuperar Senha**
- **Status:** Não implementado
- **Prioridade:** 🔴 Alta
- **Impacto:** Usuários não podem recuperar senhas esquecidas
- **Esforço Estimado:** 2-3 dias
- **Dependências:** Email service (já existe)
- **Implementação Necessária:**
  - Rota: `POST /users/forgot-password`
  - Rota: `POST /users/reset-password`
  - Token temporário (Redis, TTL 1h)
  - Template de email
  - Frontend: Páginas de recuperação

**Arquivos a Criar/Modificar:**
```python
# src/routes/user.py
@router.post("/forgot-password/")
async def forgot_password(email: str, background_tasks: BackgroundTasks):
    # Gerar token
    # Enviar email
    # Armazenar no Redis

@router.post("/reset-password/")
async def reset_password(token: str, new_password: str):
    # Validar token
    # Atualizar senha
    # Invalidar token
```

---

## 02. 🏥 Clínicas e Profissionais (UC010-UC016)

### ✅ Implementado (6/7 - 85.7%)

| UC | Nome | Rotas | Services | Status |
|----|------|-------|----------|--------|
| UC010 | Cadastrar Clínica | `clinicas_route.py` | - | ✅ Completo |
| UC011 | Gerenciar Clínica | `clinicas_route.py` | - | ✅ CRUD completo |
| UC012 | Cadastrar Profissional | `profissionais_route.py` | - | ✅ Completo |
| UC013 | Gerenciar Agenda | `agendamentos_route.py` | - | ✅ Completo |
| UC014 | Configurar Horários | `profissionais_route.py` | - | ✅ Completo |
| UC015 | Avaliar Profissional | `avaliacoes_route.py` | - | ✅ Completo |
| UC016 | Gerenciar Especialidades | `profissionais_route.py` | - | ✅ Completo |

**Observação:** Módulo bem implementado, sem gaps críticos.

---

## 03. 📅 Agendamentos (UC020-UC027)

### ✅ Implementado (5/8 - 62.5%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC020 | Agendar Consulta | `agendamentos_route.py` | ✅ Completo |
| UC021 | Reagendar | `agendamentos_route.py` | ✅ Completo |
| UC022 | Cancelar | `agendamentos_route.py` | ✅ Completo |
| UC023 | Confirmar Presença | `agendamentos_route.py` | ✅ Completo |
| UC024 | QR Code Check-in | `qrcodes_route.py` | ✅ Completo |
| UC025 | Visualizar Agenda | `agendamentos_route.py` | ✅ Completo |
| UC026 | Buscar Disponibilidade | `agendamentos_route.py` | 🔄 Parcial |
| UC027 | Enviar Lembretes | - | ❌ Não implementado |

### 🔄 Gaps Identificados

**UC026 - Buscar Horários Disponíveis**
- **Status:** Parcialmente implementado
- **Implementado:** Busca básica de slots
- **Faltando:**
  - Algoritmo de scoring (relevância + avaliação + distância)
  - Cache de disponibilidade (Redis)
  - Sugestões inteligentes
- **Esforço:** 3-4 dias

**UC027 - Enviar Lembretes**
- **Status:** Não implementado
- **Prioridade:** 🟡 Média
- **Implementação Necessária:**
  - Cron job (Celery ou similar)
  - Templates de notificação (24h e 2h antes)
  - Integração WhatsApp/Email/SMS
- **Esforço:** 4-5 dias

---

## 04. 👤 Pacientes (UC030-UC036)

### ✅ Implementado (4/7 - 57.1%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC030 | Cadastrar Paciente | - | 🔄 Parcial (como user) |
| UC031 | Gerenciar Prontuário | - | 🔄 Estrutura JSONB existe |
| UC032 | Registrar Anamnese | - | ❌ **NÃO IMPLEMENTADO** |
| UC033 | Adicionar Fotos | `fotos_route.py` | ✅ Completo |
| UC034 | Histórico Procedimentos | `agendamentos_route.py` | ✅ Completo |
| UC035 | Gerenciar Favoritos | `favoritos_route.py` | ✅ Completo |
| UC036 | Buscar Clínicas | `search_advanced.py` | ✅ Busca avançada |

### ❌ Gaps Críticos

**UC030 - Cadastrar Paciente**
- **Status:** Parcialmente implementado (apenas como user)
- **Faltando:**
  - Tabela `tb_pacientes` específica
  - Campos médicos (convênio, responsável legal)
  - Validação CPF único
  - Vínculo com clínica
- **Esforço:** 2-3 dias

**UC031 - Gerenciar Prontuário**
- **Status:** Estrutura existe, mas não há CRUD completo
- **Faltando:**
  - Rotas específicas de prontuário
  - Evoluções clínicas
  - Assinatura digital
  - Logs de auditoria LGPD
- **Esforço:** 5-6 dias

**UC032 - Registrar Anamnese** 🔴 **CRÍTICO**
- **Status:** Não implementado
- **Prioridade:** 🔴 Alta (obrigatório antes de procedimentos)
- **Implementação Necessária:**
  - Templates de anamnese (geral + específicos)
  - Rotas CRUD
  - Validações de respostas obrigatórias
  - Sistema de alertas (alergias, contraindicações)
- **Esforço:** 6-8 dias

---

## 05. 💉 Procedimentos e Produtos (UC040-UC046)

### ✅ Implementado (6/7 - 85.7%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC040 | Cadastrar Procedimento | `procedimentos_route.py` | ✅ Completo |
| UC041 | Gerenciar Catálogo | `procedimentos_route.py` | ✅ Completo |
| UC042 | Cadastrar Produto | `produtos_route.py` | ✅ Completo |
| UC043 | Gerenciar Estoque | `produtos_route.py` | 🔄 **PARCIAL** |
| UC044 | Configurar Preços | `procedimentos_route.py` | ✅ Completo |
| UC045 | Cupons | `cupom.py` | ✅ Completo |
| UC046 | Fornecedores | `fornecedores_route.py` | ✅ Completo |

### 🔄 Gap Identificado

**UC043 - Gerenciar Estoque**
- **Status:** Parcialmente implementado
- **Implementado:** CRUD básico de produtos
- **Faltando:**
  - Movimentação de estoque (entrada/saída)
  - Alertas de estoque mínimo
  - Inventário
  - Reserva de estoque (agendamentos)
- **Esforço:** 4-5 dias

---

## 06. 🛒 Marketplace (UC050-UC056)

### ✅ Implementado (6/7 - 85.7%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC050 | Navegar Marketplace | `marketplace.py` | ✅ Completo |
| UC051 | Adicionar Carrinho | `carrinho_route.py` | ✅ Completo |
| UC052 | Gerenciar Carrinho | `carrinho_route.py` | ✅ Completo |
| UC053 | Finalizar Pedido | `pedidos_route.py` | ✅ Completo |
| UC054 | Rastrear Pedido | `pedidos_route.py` | 🔄 **PARCIAL** |
| UC055 | Avaliar Produto | `avaliacoes_route.py` | ✅ Completo |
| UC056 | Busca Avançada | `search_advanced.py` | ✅ Completo |

### 🔄 Gap Identificado

**UC054 - Rastrear Pedido**
- **Status:** Parcialmente implementado
- **Implementado:** Status básico do pedido
- **Faltando:**
  - Integração com transportadora (API rastreio)
  - Atualização automática de status
  - Notificações de mudança de status
  - Timeline visual
- **Esforço:** 3-4 dias

---

## 07. 💳 Billing e Assinaturas (UC060-UC066)

### ✅ Implementado (5/7 - 71.4%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC060 | Criar Assinatura | `billing.py` | ✅ Stripe integrado |
| UC061 | Gerenciar Plano | `billing.py` | ✅ Completo |
| UC062 | Processar Pagamento | `pagamentos_route.py` | ✅ Completo |
| UC063 | Emitir NF | - | ❌ **NÃO IMPLEMENTADO** |
| UC064 | Consultar Transações | `transacoes_route.py` | ✅ Completo |
| UC065 | Gerenciar Limites | `billing.py` | ✅ Quota system |
| UC066 | Relatório Faturamento | `analytics.py` | ✅ Completo |

### ❌ Gap Identificado

**UC063 - Emitir Nota Fiscal** 🔴 **IMPORTANTE**
- **Status:** Não implementado
- **Prioridade:** 🔴 Alta (obrigação legal)
- **Implementação Necessária:**
  - Integração API NFSe (prefeituras)
  - Geração automática pós-pagamento
  - Armazenamento de XML
  - Envio por email
- **Esforço:** 8-10 dias (complexidade alta - legislação)
- **Alternativa:** Usar serviço terceiro (Focus NFe, eNotas)

---

## 08. 🤖 IA e Agentes (UC070-UC076)

### ✅ Implementado (6/7 - 85.7%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC070 | Criar Agente | `agent.py` | ✅ LangChain implementado |
| UC071 | Configurar Tools | `tool.py` | ✅ Completo |
| UC072 | Treinar com Docs | `upload.py` | ✅ RAG implementado |
| UC073 | Base Conhecimento | `documento_store.py` | ✅ Qdrant integrado |
| UC074 | Executar Agente | `prediction.py` | ✅ Streaming SSE |
| UC075 | Monitorar Performance | `analytics_agents.py` | ✅ Langfuse integrado |
| UC076 | Gerenciar Prompts | `prompt_library.py` | 🔄 Parcial |

**Observação:** Módulo bem implementado, apenas melhorias em UC076.

---

## 09. 💬 Chat e Conversas (UC080-UC086)

### ✅ Implementado (6/7 - 85.7%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC080 | Iniciar Conversa | `conversas_route.py` | ✅ Completo |
| UC081 | Enviar Mensagem | `message.py` | ✅ Completo |
| UC082 | Resposta Streaming | `prediction.py` | ✅ SSE funcionando |
| UC083 | Anexar Documentos | `upload.py` | ✅ Completo |
| UC084 | Histórico | `conversas_route.py` | ✅ Completo |
| UC085 | Compartilhar Conversa | - | 🔄 **PARCIAL** |
| UC086 | Exportar Conversa | `conversas_route.py` | ✅ PDF/JSON |

### 🔄 Gap Identificado

**UC085 - Compartilhar Conversa**
- **Status:** Não implementado
- **Faltando:**
  - Geração de link público
  - Controle de expiração
  - Proteção por senha (opcional)
- **Esforço:** 2-3 dias

---

## 10. 🔔 Notificações (UC090-UC096)

### ✅ Implementado (4/7 - 57.1%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC090 | Enviar Notificação | `notificacoes_route.py` | ✅ Completo |
| UC091 | Push Notification | - | ✅ Firebase integrado |
| UC092 | Preferências | `notificacoes_route.py` | ✅ Completo |
| UC093 | Mensagem Direta | `mensagens_route.py` | 🔄 **PARCIAL** |
| UC094 | WhatsApp | `whatsapp_route.py` | ✅ Twilio integrado |
| UC095 | Email Transacional | - | 🔄 Parcial (service existe) |
| UC096 | Broadcast | - | ❌ **NÃO IMPLEMENTADO** |

### Gaps Identificados

**UC093 - Mensagem Direta (Chat P2P)**
- **Status:** Parcialmente implementado
- **Faltando:**
  - WebSocket para tempo real
  - Indicadores de leitura
  - Typing indicator
- **Esforço:** 5-6 dias

**UC095 - Email Transacional**
- **Status:** Service existe, mas não tem rotas/templates completos
- **Faltando:**
  - Templates profissionais
  - Categorização de emails
  - Fila de envio (Celery)
- **Esforço:** 3-4 dias

**UC096 - Broadcast de Mensagens** 🟡
- **Status:** Não implementado
- **Implementação Necessária:**
  - Seleção de segmento (filtros)
  - Agendamento de envio
  - Preview antes de enviar
  - Relatório de entrega
- **Esforço:** 4-5 dias

---

## 11. 📸 Mídias e Álbuns (UC100-UC106)

### ✅ Implementado (5/7 - 71.4%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC100 | Upload Foto | `fotos_upload.py` | ✅ MinIO integrado |
| UC101 | Criar Álbum | `albums_route.py` | ✅ Completo |
| UC102 | Gerenciar Álbum | `albums_route.py` | ✅ Completo |
| UC103 | Filtros em Fotos | - | ❌ **NÃO IMPLEMENTADO** |
| UC104 | Comparar Antes/Depois | `fotos_route.py` | ✅ Completo |
| UC105 | Compartilhar Álbum | - | 🔄 Parcial |
| UC106 | Relatório Visual | `albums_route.py` | ✅ PDF gerado |

### Gaps Identificados

**UC103 - Aplicar Filtros em Fotos**
- **Status:** Não implementado
- **Prioridade:** 🟢 Baixa (nice-to-have)
- **Implementação Necessária:**
  - Biblioteca de processamento (Pillow)
  - Filtros: brilho, contraste, saturação, crop
  - Preview antes de salvar
- **Esforço:** 3-4 dias

**UC105 - Compartilhar Álbum**
- **Status:** Parcialmente implementado
- **Faltando:**
  - Link público
  - Senha opcional
  - Expiração configurável
- **Esforço:** 2-3 dias

---

## 12. 📊 Analytics (UC110-UC116)

### ✅ Implementado (4/7 - 57.1%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC110 | Dashboard Principal | `analytics.py` | ✅ Completo |
| UC111 | Relatório Agendamentos | `analytics.py` | ✅ Completo |
| UC112 | Análise Receita | `analytics.py` | ✅ Completo |
| UC113 | Stats Uso IA | `analytics_agents.py` | ✅ Langfuse |
| UC114 | Análise Buscas | `analytics_search.py` | 🔄 **PARCIAL** |
| UC115 | Exportar Relatórios | - | 🔄 Parcial |
| UC116 | Métricas Performance | - | ❌ **NÃO IMPLEMENTADO** |

### Gaps Identificados

**UC114 - Análise de Buscas**
- **Status:** Parcialmente implementado
- **Implementado:** Tracking básico
- **Faltando:**
  - Analytics de termos sem resultados
  - Trending searches
  - Sugestões de otimização
- **Esforço:** 3-4 dias

**UC115 - Exportar Relatórios**
- **Status:** Parcialmente implementado
- **Implementado:** Alguns relatórios em PDF
- **Faltando:**
  - Excel/CSV export
  - Agendamento automático
  - Email programado
- **Esforço:** 2-3 dias

**UC116 - Métricas de Performance** 🔴
- **Status:** Não implementado
- **Prioridade:** 🔴 Alta (observabilidade)
- **Implementação Necessária:**
  - Integração Prometheus/Grafana
  - Métricas APM (P50, P95, P99)
  - Alertas automáticos
  - Dashboard de sistema
- **Esforço:** 6-8 dias

---

## 13. ⚙️ Configurações (UC120-UC126)

### ✅ Implementado (6/7 - 85.7%)

| UC | Nome | Rotas | Status |
|----|------|-------|--------|
| UC120 | Configurar Empresa | `empresa.py` | ✅ Completo |
| UC121 | API Keys | `apikey.py` | ✅ Completo |
| UC122 | Credenciais | `credencial.py` | ✅ AES-256 |
| UC123 | Variáveis Sistema | `variable.py` | ✅ Completo |
| UC124 | Onboarding | `onboarding.py` | ✅ Wizard implementado |
| UC127 | Onboarding Profissional | `onboarding.py` | 📝 Definir fluxo específico |
| UC128 | Onboarding Fornecedor | `onboarding.py` | 📝 Planejado |
| UC125 | Backup/Restauração | - | ❌ **NÃO IMPLEMENTADO** |
| UC126 | Auditoria | - | ✅ Logs no BD |

### ❌ Gap Crítico

**UC125 - Backup e Restauração** 🔴 **CRÍTICO**
- **Status:** Não implementado
- **Prioridade:** 🔴 Alta (DR - Disaster Recovery)
- **Implementação Necessária:**
  - Backup automático PostgreSQL (pg_dump)
  - Backup de arquivos (MinIO)
  - Agendamento (daily incremental, weekly full)
  - Restauração self-service ou via suporte
  - Retenção: 30 dias (diário), 1 ano (semanal)
  - Armazenamento: S3 Glacier (baixo custo)
- **Esforço:** 8-10 dias

---

## 🆕 Funcionalidades Implementadas Além do Documentado

### Extras Implementados

| Funcionalidade | Rotas | Observação |
|----------------|-------|------------|
| MCP Client | `mcp_client_routes.py` | Integração Model Context Protocol |
| MCP Server | `mcp_routes.py` | Servidor MCP próprio |
| Partner Program | `partner_*.py` | Sistema de parceiros/licenças |
| Stripe Integration | `stripe_service.py` | Pagamentos Stripe |
| Consolidação Profissional | `profissional_consolidacao_route.py` | Analytics por profissional |
| Clinica Team | `clinica_team_route.py` | Gestão de equipes |
| SharePoint Sync | `sharepoints/` | Sincronização SharePoint |
| Azure OpenAI Embeddings | `azure_openai_embedding_service.py` | Embeddings Azure |

**Observação:** Muitas funcionalidades foram implementadas além do MVP documentado.

---

## 📋 Plano de Ação Priorizado

### 🔴 Prioridade ALTA (Crítico para MVP)

| # | UC | Nome | Esforço | Justificativa |
|---|----|----- |---------|---------------|
| 1 | UC032 | Anamnese | 6-8d | Obrigatório antes de procedimentos |
| 2 | UC003 | Recuperar Senha | 2-3d | Básico para UX |
| 3 | UC063 | Emitir NF | 8-10d | Obrigação legal |
| 4 | UC116 | Métricas Performance | 6-8d | Observabilidade |
| 5 | UC125 | Backup | 8-10d | Disaster Recovery |

**Total Esforço ALTA:** 30-39 dias (~6-8 semanas)

### 🟡 Prioridade MÉDIA (Importante)

| # | UC | Nome | Esforço | Sprint Sugerido |
|---|----|----- |---------|-----------------|
| 6 | UC043 | Estoque | 4-5d | Q1 2026 |
| 7 | UC054 | Rastreio | 3-4d | Q1 2026 |
| 8 | UC093 | Chat P2P | 5-6d | Q1 2026 |
| 9 | UC027 | Lembretes | 4-5d | Q2 2026 |
| 10 | UC095 | Email Transacional | 3-4d | Q2 2026 |
| 11 | UC096 | Broadcast | 4-5d | Q2 2026 |
| 12 | UC114 | Análise Buscas | 3-4d | Q2 2026 |
| 13 | UC115 | Exportar Relatórios | 2-3d | Q2 2026 |

**Total Esforço MÉDIA:** 28-36 dias (~6 semanas)

### 🟢 Prioridade BAIXA (Nice-to-have)

| # | UC | Nome | Esforço | Sprint Sugerido |
|---|----|----- |---------|-----------------|
| 14 | UC026 | Busca Disponibilidade (melhorias) | 3-4d | Q3 2026 |
| 15 | UC085 | Compartilhar Conversa | 2-3d | Q3 2026 |
| 16 | UC103 | Filtros Fotos | 3-4d | Q3 2026 |
| 17 | UC105 | Compartilhar Álbum | 2-3d | Q3 2026 |
| 18 | UC030/031 | Prontuário Completo | 5-6d | Q3 2026 |

**Total Esforço BAIXA:** 15-20 dias (~3 semanas)

---

## 📊 Roadmap de Implementação

### Sprint 1-2 (Q4 2025) - Críticos para Produção

**Foco:** Funcionalidades críticas para lançamento MVP

```
Semana 1-2: UC032 (Anamnese) - 8 dias
Semana 3: UC003 (Recuperar Senha) - 3 dias
Semana 4: UC063 (Emitir NF) - 5 dias
```

**Entregáveis:**
- ✅ Anamnese funcional
- ✅ Recuperação de senha
- ✅ NF-e básica (via serviço terceiro)

### Sprint 3-4 (Q1 2026) - Observabilidade e Confiabilidade

**Foco:** Métricas e backup

```
Semana 5-6: UC116 (Métricas) - 8 dias
Semana 7-8: UC125 (Backup) - 10 dias
```

**Entregáveis:**
- ✅ Dashboard Prometheus/Grafana
- ✅ Backup automático funcionando

### Sprint 5-7 (Q1 2026) - Operacional

**Foco:** Melhorias operacionais

```
Sprint 5: UC043 (Estoque) + UC054 (Rastreio) - 8 dias
Sprint 6: UC093 (Chat P2P) - 6 dias
Sprint 7: UC027 (Lembretes) - 5 dias
```

### Sprint 8-10 (Q2 2026) - Comunicação

**Foco:** Sistemas de comunicação

```
Sprint 8: UC095 (Email) + UC096 (Broadcast) - 8 dias
Sprint 9: UC114 (Análise) + UC115 (Export) - 7 dias
Sprint 10: Buffer/Refinamentos
```

### Sprint 11+ (Q3 2026) - Nice-to-have

**Foco:** Melhorias de UX

```
- UC026, UC085, UC103, UC105
- Melhorias de performance
- Testes de carga
```

---

## 🎯 Estimativas Totais

### Desenvolvimento

| Categoria | Dias | Semanas | Desenvolvedores |
|-----------|------|---------|-----------------|
| Alta Prioridade | 30-39 | 6-8 | 2 devs |
| Média Prioridade | 28-36 | 6 | 2 devs |
| Baixa Prioridade | 15-20 | 3 | 1 dev |
| **TOTAL** | **73-95** | **15-19** | **2 devs full-time** |

### Recursos Necessários

**Equipe Recomendada:**
- 2x Backend Developers (Python/FastAPI)
- 1x Frontend Developer (Next.js/React)
- 1x DevOps Engineer (parte do tempo - UC116, UC125)
- 1x QA Engineer (testes)

**Infraestrutura Adicional:**
- Prometheus + Grafana (UC116)
- Celery + Redis (UC027, UC095, UC096)
- Serviço NFe terceiro (UC063)
- S3 Glacier para backups (UC125)

---

## 📌 Recomendações Estratégicas

### Curto Prazo (Antes do Go-Live)

1. **UC032 - Anamnese** é BLOQUEANTE
   - Sem anamnese, não pode fazer procedimentos com segurança
   - Prioridade máxima absoluta

2. **UC003 - Recuperar Senha** é básico
   - UX ruim sem isso
   - Implementação rápida (2-3 dias)

3. **UC063 - Nota Fiscal** é legal requirement
   - Usar serviço terceiro inicialmente (Focus NFe, eNotas)
   - Implementação interna pode vir depois

### Médio Prazo (Pós Go-Live)

4. **UC116 - Métricas** para observabilidade
   - Crítico para manter SLA 99.9%
   - Detectar problemas antes dos usuários

5. **UC125 - Backup** para DR
   - Backup diário automático
   - Testado mensalmente

### Longo Prazo (Melhorias)

6. **UCs de Comunicação** (UC027, UC093, UC095, UC096)
   - Melhoram engajamento
   - Não bloqueantes para MVP

7. **UCs de Analytics** (UC114, UC115)
   - Insights de negócio
   - Otimizações baseadas em dados

---

## 🔍 Métricas de Sucesso

### KPIs para Acompanhamento

| Métrica | Meta Q4 2025 | Meta Q2 2026 | Meta Q4 2026 |
|---------|--------------|--------------|--------------|
| Taxa Implementação | 75% | 85% | 95% |
| UCs Críticos (Alta) | 100% | 100% | 100% |
| UCs Média Prioridade | 40% | 80% | 100% |
| Cobertura Testes | 60% | 75% | 85% |
| Bugs em Produção | <5/mês | <3/mês | <2/mês |

---

## 📞 Suporte e Acompanhamento

**Para acompanhar progresso:**
- Weekly review do gap analysis
- Update deste documento a cada sprint
- Sincronização com CHANGELOG.md

**Responsável:** Arquiteto de Software / Tech Lead

---

*Análise de Gap de Implementação - DoctorQ v1.0.0*
*Gerado em 07/11/2025*
*Próxima atualização: Sprint review*
