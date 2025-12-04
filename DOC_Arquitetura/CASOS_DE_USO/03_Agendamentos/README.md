# 📅 Módulo 03: Agendamentos

## Visão Geral

Sistema completo de agendamento de consultas e procedimentos estéticos, incluindo busca de disponibilidade, confirmações, lembretes e check-in via QR Code.

---

## UC020 - Agendar Consulta

**Prioridade:** 🔴 Alta | **Complexidade:** 🔴 Alta | **Status:** ✅ Implementado

**Descrição:** Permitir que pacientes agendem consultas com profissionais.

**Atores:**
- Principal: Paciente
- Secundários: Profissional, Sistema de Notificações

**Fluxo Principal:**
1. Paciente acessa "Agendar Consulta"
2. Sistema exibe opções de busca:
   - Por procedimento
   - Por profissional
   - Por clínica
3. Paciente seleciona:
   - Procedimento desejado
   - Clínica (se múltiplas disponíveis)
   - Profissional (opcional - sistema sugere)
4. Sistema consulta disponibilidade do profissional
5. Sistema exibe calendário com slots disponíveis
6. Paciente seleciona data e horário
7. Sistema solicita confirmação de dados:
   - Procedimento
   - Profissional
   - Data/hora
   - Observações (opcional)
8. Sistema valida disponibilidade (double-check)
9. Sistema cria agendamento com status "pendente"
10. Sistema bloqueia horário temporariamente (15 min)
11. Sistema envia confirmação por email/WhatsApp
12. Sistema notifica profissional
13. Sistema exibe confirmação na tela
14. Sistema oferece adicionar ao calendário (iCal)

**Fluxos Alternativos:**

**FA1: Agendamento Recorrente**
1. No passo 6, paciente marca "Repetir agendamento"
2. Sistema solicita padrão de recorrência:
   - Semanal (que dias)
   - Quinzenal
   - Mensal (dia específico)
3. Sistema solicita data final ou número de repetições
4. Sistema valida disponibilidade de todas as datas
5. Sistema cria múltiplos agendamentos
6. Continua no passo 11

**FA2: Agendamento para Terceiros**
1. No passo 7, paciente indica "Agendar para outra pessoa"
2. Sistema solicita dados do beneficiário:
   - Nome
   - Telefone
   - Email (opcional)
3. Sistema cria agendamento vinculado ao pagador
4. Sistema envia notificações para ambos
5. Continua no passo 11

**FA3: Lista de Espera**
1. No passo 4, não há slots disponíveis no período desejado
2. Sistema oferece "Entrar na lista de espera"
3. Paciente confirma interesse
4. Sistema registra preferências (datas/horários)
5. Sistema notifica quando surgir vaga
6. Fim do fluxo

**Fluxos de Exceção:**

**FE1: Conflito de Agendamento**
1. No passo 8, horário foi reservado por outro paciente
2. Sistema exibe mensagem: "Horário não está mais disponível"
3. Sistema atualiza calendário com slots atuais
4. Retorna ao passo 5

**FE2: Profissional Indisponível**
1. No passo 4, profissional não tem horários livres
2. Sistema sugere profissionais alternativos com mesma especialidade
3. Sistema exibe comparação (avaliação, experiência, preço)
4. Paciente seleciona alternativa ou cancela
5. Se seleciona, continua no passo 5

**FE3: Limite de Agendamentos Atingido**
1. No passo 8, paciente já tem 3 agendamentos pendentes
2. Sistema exibe: "Limite de agendamentos simultâneos atingido"
3. Sistema sugere confirmar ou cancelar agendamentos existentes
4. Fim do fluxo

**Pós-condições:**
- Agendamento criado no banco de dados
- Horário bloqueado na agenda do profissional
- Notificações enviadas (email + WhatsApp)
- Evento criado no calendário (se solicitado)

**Regras de Negócio:**

- **RN-200:** Agendamento mínimo com 2h de antecedência
- **RN-201:** Máximo 3 agendamentos pendentes por paciente
- **RN-202:** Bloqueio temporário de 15 min para pagamento (se pago)
- **RN-203:** Agendamentos recorrentes máximo 12 repetições
- **RN-204:** Cancelamento gratuito até 24h antes
- **RN-205:** No-show registrado se não comparecimento sem cancelamento
- **RN-206:** Após 2 no-shows, agendamentos requerem pré-pagamento

**Requisitos Não-Funcionais:**

- **Performance:**
  - Consulta de disponibilidade < 500ms
  - Criação de agendamento < 1s
  - Notificações enviadas em < 30s (assíncrono)

- **Usabilidade:**
  - Calendário intuitivo com cores visuais
  - Sugestões de profissionais baseadas em avaliações
  - Auto-complete de busca

- **Confiabilidade:**
  - Transações atômicas (agendamento + bloqueio)
  - Retry em caso de falha de notificação
  - Logs de auditoria de todas as operações

**Integrações:**
- **Sistema de Pagamento:** Para procedimentos que exigem pré-pagamento
- **WhatsApp Business API:** Envio de confirmações
- **SendGrid/SES:** Envio de emails
- **Google Calendar/Outlook:** Exportação de eventos

**Dados de Entrada:**

```typescript
{
  id_paciente: uuid;
  id_procedimento: uuid;
  id_profissional?: uuid; // Opcional - sistema sugere
  id_clinica?: uuid; // Se procedimento em múltiplas clínicas
  dt_agendamento: string; // ISO 8601
  hr_inicio: string; // "14:00"
  ds_observacoes?: string;
  recorrente?: {
    tipo: 'semanal' | 'quinzenal' | 'mensal';
    dias_semana?: number[]; // Para semanal
    data_fim?: string;
    num_repeticoes?: number;
  };
  beneficiario?: {
    nm_completo: string;
    nr_telefone: string;
    nm_email?: string;
  };
}
```

**Dados de Saída:**

```typescript
{
  id_agendamento: uuid;
  id_paciente: uuid;
  id_profissional: uuid;
  id_procedimento: uuid;
  dt_agendamento: string;
  hr_inicio: string;
  hr_fim: string; // Calculado
  st_agendamento: 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'falta';
  nr_valor: number;
  ds_observacoes?: string;
  qr_code_checkin?: string; // URL ou base64
  dt_criacao: string;
  agendamentos_recorrentes?: uuid[]; // IDs se recorrente
}
```

**Cenários de Teste:**

**CT-200: Agendamento simples com sucesso**
- **Pré-condição:** Profissional com horário disponível
- **Ação:** POST /agendamentos com dados válidos
- **Resultado:** HTTP 201 + agendamento criado + notificações enviadas

**CT-201: Agendamento em horário ocupado**
- **Pré-condição:** Horário já reservado
- **Ação:** POST /agendamentos
- **Resultado:** HTTP 409 + mensagem de conflito

**CT-202: Agendamento recorrente (4 semanas)**
- **Ação:** POST com recorrente.tipo = 'semanal', num_repeticoes = 4
- **Resultado:** 4 agendamentos criados + notificações

**CT-203: Agendamento para terceiros**
- **Ação:** POST com dados de beneficiario
- **Resultado:** Agendamento com beneficiário + 2 emails enviados

**CT-204: Lista de espera**
- **Pré-condição:** Sem slots disponíveis
- **Ação:** POST /agendamentos/lista-espera
- **Resultado:** Registro criado + notificação quando vaga abrir

---

## UC021 - Reagendar Consulta

**Prioridade:** 🔴 Alta | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Permitir alteração de data/horário de agendamento existente.

**Fluxo Principal:**
1. Paciente acessa "Meus Agendamentos"
2. Sistema lista agendamentos (futuros primeiro)
3. Paciente seleciona agendamento a reagendar
4. Sistema exibe detalhes atuais
5. Paciente clica "Reagendar"
6. Sistema valida se pode reagendar (prazo mínimo)
7. Sistema exibe calendário com novos slots
8. Paciente seleciona nova data/hora
9. Sistema valida disponibilidade
10. Sistema atualiza agendamento
11. Sistema libera horário antigo
12. Sistema bloqueia novo horário
13. Sistema notifica profissional da mudança
14. Sistema envia confirmação ao paciente

**Regras de Negócio:**
- **RN-210:** Reagendamento até 2h antes do horário original
- **RN-211:** Máximo 2 reagendamentos por agendamento
- **RN-212:** Se menos de 24h, pode ter taxa

---

## UC022 - Cancelar Agendamento

**Prioridade:** 🔴 Alta | **Complexidade:** 🟢 Baixa | **Status:** ✅ Implementado

**Descrição:** Cancelar agendamento futuro.

**Fluxo Principal:**
1. Paciente/Profissional acessa agendamento
2. Seleciona "Cancelar"
3. Sistema solicita motivo do cancelamento
4. Sistema valida prazo (24h de antecedência)
5. Sistema atualiza status para "cancelado"
6. Sistema libera horário na agenda
7. Sistema processa reembolso (se pago)
8. Sistema notifica as partes
9. Sistema registra cancelamento no histórico

**Regras de Negócio:**
- **RN-220:** Cancelamento gratuito até 24h antes
- **RN-221:** Entre 24h e 2h: taxa de 50%
- **RN-222:** Menos de 2h: sem reembolso
- **RN-223:** Profissional pode cancelar sem taxa (emergências)

---

## UC023 - Confirmar Presença

**Prioridade:** 🟡 Média | **Complexidade:** 🟢 Baixa | **Status:** ✅ Implementado

**Descrição:** Paciente confirma que comparecerá ao agendamento.

**Fluxo Principal:**
1. Sistema envia lembrete 24h antes
2. Lembrete inclui botões de ação:
   - "Confirmar Presença"
   - "Reagendar"
   - "Cancelar"
3. Paciente clica "Confirmar Presença"
4. Sistema atualiza st_confirmado = true
5. Sistema registra dt_confirmacao
6. Sistema notifica clínica
7. Sistema exibe QR Code de check-in

**Regras de Negócio:**
- **RN-230:** Lembrete enviado 24h antes
- **RN-231:** Segundo lembrete 2h antes (se não confirmado)
- **RN-232:** Agendamentos não confirmados ficam em lista de atenção

---

## UC024 - Gerar QR Code de Check-in

**Prioridade:** 🟢 Baixa | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Gerar QR Code para check-in rápido na recepção.

**Fluxo Principal:**
1. Sistema gera QR Code após confirmação
2. QR Code contém:
   - ID do agendamento (criptografado)
   - Data/hora
   - Assinatura digital
3. Paciente apresenta QR Code na recepção
4. Recepcionista escaneia QR Code
5. Sistema valida assinatura
6. Sistema verifica agendamento
7. Sistema registra check-in
8. Sistema atualiza status para "em atendimento"
9. Sistema exibe dados do paciente
10. Sistema inicia cronômetro de atendimento

**Regras de Negócio:**
- **RN-240:** QR Code válido apenas no dia do agendamento
- **RN-241:** QR Code pode ser usado 30 min antes até 15 min depois
- **RN-242:** Check-in registra horário real de chegada

---

## UC025 - Visualizar Agenda

**Prioridade:** 🔴 Alta | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Visualizar agenda de atendimentos em diferentes formatos.

**Funcionalidades:**

### Visualizações Disponíveis
- **Dia:** Lista de horários com detalhes
- **Semana:** Grade semanal multi-profissional
- **Mês:** Calendário mensal com indicadores

### Filtros
- Por profissional
- Por procedimento
- Por status (pendente, confirmado, etc.)
- Por clínica

### Ações Rápidas
- Ver detalhes do agendamento
- Reagendar (drag & drop)
- Cancelar
- Marcar como concluído
- Adicionar observações

### Indicadores Visuais
- 🟢 Confirmado
- 🟡 Pendente confirmação
- 🔴 Atrasado
- ⚫ Cancelado
- ✅ Concluído

---

## UC026 - Buscar Horários Disponíveis

**Prioridade:** 🔴 Alta | **Complexidade:** 🔴 Alta | **Status:** ✅ Implementado

**Descrição:** Sistema de busca inteligente de disponibilidade.

**Algoritmo de Busca:**

1. **Entrada:**
   - Procedimento
   - Profissional (opcional)
   - Período desejado
   - Preferências de horário

2. **Processamento:**
   ```python
   def buscar_disponibilidade(
       procedimento_id,
       profissional_id=None,
       data_inicio,
       data_fim,
       preferencias=None
   ):
       # 1. Buscar profissionais qualificados
       if profissional_id:
           profissionais = [profissional_id]
       else:
           profissionais = buscar_por_especialidade(procedimento.especialidade)

       # 2. Para cada profissional
       slots_disponiveis = []
       for prof in profissionais:
           # 2.1 Obter configuração de horários
           config_horarios = obter_config_horarios(prof)

           # 2.2 Obter agendamentos existentes
           agendamentos = obter_agendamentos(prof, data_inicio, data_fim)

           # 2.3 Gerar slots disponíveis
           for dia in range(data_inicio, data_fim):
               slots_dia = gerar_slots(
                   config_horarios[dia.weekday()],
                   procedimento.duracao
               )

               # 2.4 Remover slots ocupados
               slots_livres = remover_ocupados(slots_dia, agendamentos)

               # 2.5 Aplicar preferências (manhã, tarde, noite)
               if preferencias:
                   slots_livres = filtrar_preferencias(slots_livres, preferencias)

               slots_disponiveis.extend(slots_livres)

       # 3. Ordenar por:
       #    - Data mais próxima
       #    - Avaliação do profissional
       #    - Preferências do paciente
       return sorted(slots_disponiveis, key=sort_key)
   ```

3. **Otimizações:**
   - Cache de configurações de horários (Redis, TTL 1h)
   - Índices de banco de dados em dt_agendamento
   - Pré-cálculo de slots para próximas 2 semanas

**Regras de Negócio:**
- **RN-250:** Busca limitada a 60 dias no futuro
- **RN-251:** Sugestões priorizadas por avaliação + proximidade
- **RN-252:** Horários bloqueados para manutenção não aparecem

---

## UC027 - Enviar Lembretes de Agendamento

**Prioridade:** 🟡 Média | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Sistema automático de lembretes multi-canal.

**Fluxo Automático:**

1. **Cron Job Diário (00:00)**
   ```python
   async def enviar_lembretes_diarios():
       # Buscar agendamentos para daqui a 24h
       agendamentos = await buscar_agendamentos(
           dt_agendamento=tomorrow(),
           st_agendamento='confirmado'
       )

       for agendamento in agendamentos:
           await agendar_lembrete_24h(agendamento)
   ```

2. **Lembrete 24h Antes**
   - Email com detalhes
   - WhatsApp com botões de ação
   - Notificação push no app

3. **Lembrete 2h Antes (se não confirmado)**
   - SMS
   - WhatsApp
   - Push notification

4. **Conteúdo dos Lembretes:**
   ```markdown
   🗓️ Lembrete: Você tem uma consulta amanhã!

   📅 Data: 08/11/2025
   ⏰ Horário: 14:00
   👤 Profissional: Dr. João Silva
   🏥 Clínica: Estética Bella Vita
   📍 Endereço: Rua das Flores, 123

   ✅ Confirmar Presença
   📅 Reagendar
   ❌ Cancelar

   💡 Dica: Chegue 10 minutos antes!
   ```

**Regras de Negócio:**
- **RN-260:** Lembrete 24h: Email + WhatsApp + Push
- **RN-261:** Lembrete 2h: SMS + WhatsApp
- **RN-262:** Paciente pode desabilitar lembretes nas preferências
- **RN-263:** Máximo 2 lembretes por agendamento

---

## 🗄️ Modelo de Dados

### Tabela: tb_agendamentos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_agendamento | UUID | PK |
| id_paciente | UUID | FK - Paciente |
| id_profissional | UUID | FK - Profissional |
| id_procedimento | UUID | FK - Procedimento |
| id_clinica | UUID | FK - Clínica |
| dt_agendamento | DATE | Data da consulta |
| hr_inicio | TIME | Hora de início |
| hr_fim | TIME | Hora de fim (calculado) |
| st_agendamento | VARCHAR(20) | pendente, confirmado, cancelado, concluido, falta |
| st_confirmado | BOOLEAN | Paciente confirmou? |
| dt_confirmacao | TIMESTAMP | Quando confirmou |
| dt_checkin | TIMESTAMP | Check-in real |
| nr_valor | DECIMAL(10,2) | Valor do procedimento |
| ds_observacoes | TEXT | Observações |
| ds_qr_code | TEXT | QR Code para check-in |
| nm_motivo_cancelamento | TEXT | Motivo (se cancelado) |
| id_beneficiario | UUID | Se agendado para terceiro |
| id_agendamento_pai | UUID | Se recorrente |
| nr_tentativas_reagendamento | INTEGER | Contador |
| dt_criacao | TIMESTAMP | Criado em |
| dt_atualizacao | TIMESTAMP | Atualizado em |

### Índices

```sql
CREATE INDEX idx_agendamentos_data ON tb_agendamentos(dt_agendamento);
CREATE INDEX idx_agendamentos_profissional_data ON tb_agendamentos(id_profissional, dt_agendamento);
CREATE INDEX idx_agendamentos_paciente ON tb_agendamentos(id_paciente);
CREATE INDEX idx_agendamentos_status ON tb_agendamentos(st_agendamento);
```

---

## 📊 Endpoints da API

```http
POST   /agendamentos                     - Criar agendamento
GET    /agendamentos                     - Listar agendamentos
GET    /agendamentos/{id}                - Obter agendamento
PATCH  /agendamentos/{id}                - Atualizar agendamento
DELETE /agendamentos/{id}                - Cancelar agendamento

GET    /agendamentos/disponibilidade     - Buscar horários disponíveis
POST   /agendamentos/{id}/confirmar      - Confirmar presença
POST   /agendamentos/{id}/checkin        - Realizar check-in
POST   /agendamentos/{id}/reagendar      - Reagendar

GET    /profissionais/{id}/agenda        - Agenda do profissional
POST   /profissionais/{id}/bloqueios     - Bloquear horários

GET    /agendamentos/lista-espera        - Lista de espera
POST   /agendamentos/lista-espera        - Entrar na lista
```

---

## 🔔 Eventos e Notificações

### Eventos do Sistema

| Evento | Trigger | Ações |
|--------|---------|-------|
| `agendamento.criado` | Novo agendamento | Email + WhatsApp + Push |
| `agendamento.confirmado` | Confirmação de presença | Notificar clínica + Gerar QR |
| `agendamento.cancelado` | Cancelamento | Email + Liberar horário |
| `agendamento.reagendado` | Alteração de data/hora | Email + WhatsApp |
| `agendamento.checkin` | Check-in realizado | Notificar profissional |
| `agendamento.concluido` | Fim do atendimento | Solicitar avaliação |
| `agendamento.falta` | No-show | Registrar + Email |
| `lembrete.24h` | 24h antes | Email + WhatsApp + Push |
| `lembrete.2h` | 2h antes | SMS + WhatsApp |

---

## 📈 Métricas e KPIs

### KPIs de Agendamento

- **Taxa de Ocupação:** % de slots preenchidos
- **Taxa de Confirmação:** % agendamentos confirmados
- **Taxa de No-Show:** % faltas sem cancelamento
- **Taxa de Cancelamento:** % cancelamentos
- **Tempo Médio de Agendamento:** Da busca à confirmação
- **Conversão:** % de buscas que viram agendamento

### Relatórios

- **Agendamentos por Período:** Gráfico temporal
- **Taxa de Ocupação por Profissional:** Comparativo
- **Horários Mais Procurados:** Heatmap
- **Procedimentos Mais Agendados:** Ranking

---

*Documentação do Módulo Agendamentos - DoctorQ v1.0.0*
