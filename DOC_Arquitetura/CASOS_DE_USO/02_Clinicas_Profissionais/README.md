# 🏥 Módulo 02: Clínicas e Profissionais

## Visão Geral

Módulo responsável pelo cadastro e gestão de clínicas, profissionais de estética, especialidades e configurações de atendimento.

---

## UC010 - Cadastrar Clínica

**Prioridade:** 🔴 Alta | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Permitir que administradores cadastrem novas clínicas na plataforma.

**Fluxo Principal:**
1. Admin acessa "Nova Clínica"
2. Preenche dados:
   - Nome fantasia
   - Razão social
   - CNPJ
   - Endereço completo
   - Telefone/WhatsApp
   - Email
   - Horário de funcionamento
   - Logo
3. Sistema valida CNPJ único
4. Sistema cria registro de clínica
5. Sistema cria empresa associada (multi-tenant)
6. Sistema exibe confirmação

**Regras de Negócio:**
- **RN-100:** CNPJ deve ser único
- **RN-101:** Logo max 2MB (JPG, PNG)
- **RN-102:** Cada clínica é um tenant isolado

**Dados de Entrada:**
```typescript
{
  nome_fantasia: string;
  razao_social: string;
  cnpj: string; // Validado
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  contato: {
    telefone: string;
    whatsapp?: string;
    email: string;
  };
  horario_funcionamento: {
    [dia: string]: {
      abertura: string; // "08:00"
      fechamento: string; // "18:00"
      fechado: boolean;
    };
  };
  logo_url?: string;
}
```

---

## UC011 - Gerenciar Dados da Clínica

**Prioridade:** 🟡 Média | **Complexidade:** 🟢 Baixa | **Status:** ✅ Implementado

**Descrição:** Permitir atualização de informações da clínica.

**Fluxo Principal:**
1. Admin acessa "Configurações da Clínica"
2. Sistema carrega dados atuais
3. Admin modifica campos desejados
4. Sistema valida alterações
5. Sistema atualiza registro
6. Sistema invalida cache da clínica
7. Sistema exibe confirmação

---

## UC012 - Cadastrar Profissional

**Prioridade:** 🔴 Alta | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Cadastrar profissionais de estética vinculados à clínica.

**Fluxo Principal:**
1. Admin acessa "Profissionais" > "Novo"
2. Preenche dados:
   - Nome completo
   - Registro profissional (CRM, CREF, etc.)
   - Especialidades
   - Bio/Apresentação
   - Foto
   - Contato
3. Sistema valida registro único
4. Sistema cria profissional vinculado à clínica
5. Sistema cria usuário associado (se não existir)
6. Sistema envia convite por email
7. Sistema exibe confirmação

**Fluxos Alternativos:**

**FA1: Profissional Já Cadastrado**
1. No passo 3, sistema detecta email já existente
2. Sistema oferece vincular profissional existente
3. Sistema cria vínculo clínica-profissional
4. Fim do fluxo

**Regras de Negócio:**
- **RN-110:** Registro profissional único por especialidade
- **RN-111:** Profissional pode estar em múltiplas clínicas
- **RN-112:** Bio max 500 caracteres
- **RN-113:** Foto max 5MB

---

## UC127 - Onboarding de Profissional

- **Objetivo:** guiar profissionais recém-cadastrados na configuração completa do perfil e agenda
- **Status:** 📝 Planejado | **Prioridade:** 🔴 Alta | **Complexidade:** 🟡 Média

**Principais Etapas:**
1. Dados profissionais (registro, especialidades, bio, foto)
2. Configuração de disponibilidade (agenda semanal, bloqueios)
3. Associação com clínicas e unidades
4. Configuração de serviços e valores
5. Preferências de notificações e integrações

**Regras de Negócio Relevantes:**
- CRM/CRBM obrigatório para categorias reguladas
- É necessário ao menos um bloco de disponibilidade ativo para concluir
- Perfil permanece “Configuração pendente” até finalização do wizard

**Integrações:** `GET/POST /api/onboarding/*`, Google Calendar (opcional)

📄 Detalhamento completo em [`UC-Profissional-Onboarding.md`](./UC-Profissional-Onboarding.md)

**Dados de Entrada:**
```typescript
{
  nome_completo: string;
  registro_profissional: string;
  tipo_registro: 'CRM' | 'CREF' | 'COREN' | 'Outro';
  especialidades: string[]; // IDs
  bio: string; // max 500 chars
  foto_url?: string;
  contato: {
    email: string;
    telefone: string;
    whatsapp?: string;
  };
  tempo_consulta_padrao: number; // minutos
}
```

---

## UC013 - Gerenciar Agenda do Profissional

**Prioridade:** 🔴 Alta | **Complexidade:** 🔴 Alta | **Status:** ✅ Implementado

**Descrição:** Visualizar e gerenciar agenda de atendimentos do profissional.

**Fluxo Principal:**
1. Profissional acessa "Minha Agenda"
2. Sistema carrega agendamentos do período (semana/mês)
3. Sistema exibe:
   - Calendário visual
   - Horários ocupados/livres
   - Detalhes dos agendamentos
4. Profissional pode:
   - Bloquear horários
   - Cancelar agendamento
   - Adicionar observações
5. Sistema atualiza agenda em tempo real

**Funcionalidades:**
- **Visualizações:** Dia, Semana, Mês
- **Filtros:** Por procedimento, status
- **Cores:** Status visual (confirmado, pendente, cancelado)
- **Sincronização:** Google Calendar, Outlook (opcional)

**Integrações:**
- **Google Calendar API:** Sincronização bidirecional
- **Microsoft Graph:** Sincronização Outlook

---

## UC014 - Configurar Horários de Atendimento

**Prioridade:** 🟡 Média | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Definir horários disponíveis para agendamento.

**Fluxo Principal:**
1. Profissional acessa "Configurações de Horário"
2. Sistema exibe grade semanal
3. Profissional configura para cada dia:
   - Horário de início
   - Horário de fim
   - Intervalo de almoço
   - Duração de slot
4. Profissional pode:
   - Copiar config para outros dias
   - Definir exceções (feriados)
   - Bloquear períodos específicos
5. Sistema valida não-sobreposição
6. Sistema salva configuração
7. Sistema recalcula disponibilidade

**Regras de Negócio:**
- **RN-120:** Slots mínimos de 15 minutos
- **RN-121:** Intervalo de almoço obrigatório (se > 6h/dia)
- **RN-122:** Horários não podem sobrepor agendamentos existentes
- **RN-123:** Exceções têm prioridade sobre config padrão

**Dados de Configuração:**
```typescript
{
  dia_semana: 0-6; // 0 = Domingo
  horario_inicio: string; // "08:00"
  horario_fim: string; // "18:00"
  intervalo_almoco?: {
    inicio: string;
    fim: string;
  };
  duracao_slot: number; // 15, 30, 45, 60 minutos
  disponivel: boolean;
}
```

---

## UC015 - Avaliar Profissional

**Prioridade:** 🟡 Média | **Complexidade:** 🟢 Baixa | **Status:** ✅ Implementado

**Descrição:** Pacientes avaliam profissionais após atendimento.

**Fluxo Principal:**
1. Paciente recebe solicitação de avaliação (24h após consulta)
2. Paciente acessa link de avaliação
3. Sistema exibe formulário:
   - Nota (1-5 estrelas)
   - Comentário (opcional)
   - Aspectos (pontualidade, atendimento, resultado)
4. Paciente submete avaliação
5. Sistema valida (1 avaliação por atendimento)
6. Sistema calcula nova média do profissional
7. Sistema notifica profissional
8. Sistema publica avaliação (após moderação se habilitado)

**Regras de Negócio:**
- **RN-130:** Apenas pacientes atendidos podem avaliar
- **RN-131:** 1 avaliação por atendimento
- **RN-132:** Avaliações podem ser moderadas antes de publicar
- **RN-133:** Profissional pode responder avaliação

**Dados de Entrada:**
```typescript
{
  id_agendamento: uuid;
  nota_geral: 1-5;
  aspectos: {
    pontualidade: 1-5;
    atendimento: 1-5;
    resultado: 1-5;
  };
  comentario?: string; // max 500 chars
}
```

---

## UC016 - Gerenciar Especialidades

**Prioridade:** 🟢 Baixa | **Complexidade:** 🟢 Baixa | **Status:** ✅ Implementado

**Descrição:** Cadastrar e gerenciar especialidades médicas/estéticas.

**Fluxo Principal:**
1. Admin acessa "Especialidades"
2. Sistema lista especialidades cadastradas
3. Admin pode:
   - Criar nova especialidade
   - Editar existente
   - Desativar especialidade
4. Para criar:
   - Nome
   - Descrição
   - Ícone/Categoria
5. Sistema valida nome único
6. Sistema salva especialidade
7. Sistema disponibiliza para cadastro de profissionais

**Especialidades Comuns:**
- Dermatologia Estética
- Harmonização Facial
- Depilação a Laser
- Massoterapia
- Estética Corporal
- Nutrição Estética
- Tricologia

---

## 🗄️ Modelo de Dados

### Tabela: tb_clinicas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_clinica | UUID | PK |
| id_empresa | UUID | FK - Tenant |
| nm_fantasia | VARCHAR(255) | Nome da clínica |
| nm_razao_social | VARCHAR(255) | Razão social |
| nr_cnpj | VARCHAR(18) | CNPJ único |
| ds_endereco | JSONB | Endereço completo |
| ds_contato | JSONB | Telefones e emails |
| ds_horario_funcionamento | JSONB | Horários por dia |
| ds_logo_url | VARCHAR(500) | URL do logo |
| st_ativo | CHAR(1) | 'S' ou 'N' |

### Tabela: tb_profissionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_profissional | UUID | PK |
| id_user | UUID | FK - Usuário associado |
| id_clinica | UUID | FK - Clínica principal |
| nm_completo | VARCHAR(255) | Nome do profissional |
| nm_registro_profissional | VARCHAR(50) | CRM, CREF, etc |
| nm_tipo_registro | VARCHAR(20) | Tipo do registro |
| ds_bio | TEXT | Biografia |
| ds_foto_url | VARCHAR(500) | Foto de perfil |
| nr_tempo_consulta_padrao | INTEGER | Minutos |
| nr_avaliacao_media | DECIMAL(2,1) | Média 0.0-5.0 |
| nr_total_avaliacoes | INTEGER | Total de avaliações |

### Tabela: tb_especialidades

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_especialidade | UUID | PK |
| nm_especialidade | VARCHAR(100) | Nome único |
| ds_descricao | TEXT | Descrição |
| ds_icone | VARCHAR(50) | Ícone/categoria |
| st_ativo | CHAR(1) | 'S' ou 'N' |

---

## 📊 Endpoints da API

### Clínicas

```http
POST   /clinicas              - Criar clínica
GET    /clinicas              - Listar clínicas
GET    /clinicas/{id}         - Obter clínica
PATCH  /clinicas/{id}         - Atualizar clínica
DELETE /clinicas/{id}         - Desativar clínica
```

### Profissionais

```http
POST   /profissionais         - Criar profissional
GET    /profissionais         - Listar profissionais
GET    /profissionais/{id}    - Obter profissional
PATCH  /profissionais/{id}    - Atualizar profissional
GET    /profissionais/{id}/agenda - Obter agenda
POST   /profissionais/{id}/avaliacoes - Criar avaliação
```

---

## 🧪 Cenários de Teste

**CT-100: Cadastrar clínica com dados válidos**
- Resultado: HTTP 201 + clínica criada + empresa criada

**CT-101: Cadastrar clínica com CNPJ duplicado**
- Resultado: HTTP 400 + erro de validação

**CT-102: Cadastrar profissional em clínica**
- Resultado: HTTP 201 + profissional criado + email enviado

**CT-103: Configurar horários sem sobreposição**
- Resultado: Horários salvos + disponibilidade recalculada

**CT-104: Avaliar profissional após atendimento**
- Resultado: Avaliação salva + média recalculada + notificação enviada

---

*Documentação do Módulo Clínicas e Profissionais - DoctorQ v1.0.0*
