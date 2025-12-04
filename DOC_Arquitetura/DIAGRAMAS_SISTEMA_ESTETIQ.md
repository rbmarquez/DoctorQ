# Diagramas do Sistema DoctorQ

Este documento contém todos os diagramas visuais do sistema DoctorQ, criados com Mermaid para renderização automática no GitHub/GitBook.

---

## 1. Visão Geral do Sistema

### 1.1 Arquitetura da Plataforma

```mermaid
graph TB
    subgraph "👥 Usuários"
        PAC[👤 Paciente]
        PRO[👩‍⚕️ Profissional]
        CLI[🏥 Clínica]
        FOR[🏭 Fornecedor]
        ADM[⚙️ Administrador]
    end

    subgraph "🌐 Frontend - Next.js 15"
        WEB[Web App<br/>React 19 + Tailwind]
    end

    subgraph "⚡ Backend - FastAPI"
        API[API REST<br/>Python 3.12]
        WS[WebSocket<br/>Chat em Tempo Real]
        AI[🤖 Agentes IA<br/>LangChain + GPT-4]
    end

    subgraph "💾 Dados"
        PG[(PostgreSQL<br/>+ pgvector)]
        RD[(Redis<br/>Cache)]
    end

    subgraph "🔌 Integrações"
        PAY[💳 Pagamentos<br/>Stripe / MercadoPago]
        MSG[📱 Mensagens<br/>WhatsApp / Email]
        STR[📦 Storage<br/>AWS S3]
    end

    PAC --> WEB
    PRO --> WEB
    CLI --> WEB
    FOR --> WEB
    ADM --> WEB

    WEB --> API
    WEB --> WS

    API --> PG
    API --> RD
    API --> AI

    AI --> PG

    API --> PAY
    API --> MSG
    API --> STR
```

### 1.2 Tipos de Usuário e Permissões

```mermaid
graph LR
    subgraph "Hierarquia de Acesso"
        ADM[⚙️ Admin]
        GES[🏥 Gestor Clínica]
        PRO[👩‍⚕️ Profissional]
        REC[💼 Recepcionista]
        FOR[🏭 Fornecedor]
        PAC[👤 Paciente]
    end

    ADM -->|gerencia| GES
    ADM -->|gerencia| FOR
    GES -->|gerencia| PRO
    GES -->|gerencia| REC
    PRO -->|atende| PAC
    FOR -->|vende para| PAC
    FOR -->|vende para| CLI[Clínicas]

    style ADM fill:#ff6b6b,color:#fff
    style GES fill:#4ecdc4,color:#fff
    style PRO fill:#45b7d1,color:#fff
    style FOR fill:#96ceb4,color:#fff
    style PAC fill:#dfe6e9,color:#333
```

---

## 2. Fluxos do Paciente

### 2.1 Fluxo de Cadastro

```mermaid
flowchart TD
    A[🌐 Acessa doctorq.app] --> B{Tem conta?}
    B -->|Não| C[📝 Clica em Cadastrar]
    B -->|Sim| L[🔐 Faz Login]

    C --> D{Método de cadastro}
    D -->|Email| E[Preenche formulário]
    D -->|Google| F[🔵 OAuth Google]
    D -->|Microsoft| G[🔷 OAuth Microsoft]
    D -->|Apple| H[🍎 OAuth Apple]

    E --> I[📧 Recebe email de confirmação]
    I --> J[✅ Confirma email]

    F --> K[✅ Conta criada automaticamente]
    G --> K
    H --> K
    J --> K

    K --> M[👤 Completa perfil]
    M --> N[📍 Adiciona endereço]
    N --> O[🎉 Pronto para usar!]

    L --> O

    style A fill:#e8f5e9
    style O fill:#c8e6c9
    style K fill:#fff9c4
```

### 2.2 Fluxo de Agendamento

```mermaid
flowchart TD
    A[👤 Paciente logado] --> B[🔍 Busca profissional]

    B --> C{Filtros}
    C --> D[📍 Localização]
    C --> E[💰 Preço]
    C --> F[⭐ Avaliação]
    C --> G[📅 Disponibilidade]

    D & E & F & G --> H[📋 Lista de resultados]

    H --> I[👆 Seleciona profissional]
    I --> J[👀 Visualiza perfil completo]

    J --> K{Quer agendar?}
    K -->|Não| B
    K -->|Sim| L[📅 Clica em Agendar]

    L --> M[💆 Escolhe procedimento]
    M --> N[📆 Seleciona data]
    N --> O[🕐 Seleciona horário]

    O --> P[📝 Confirma dados]
    P --> Q{Pagar agora?}

    Q -->|Sim| R[💳 Pagamento online]
    Q -->|Não| S[Pagar na clínica]

    R --> T[✅ Agendamento confirmado]
    S --> T

    T --> U[📧 Recebe confirmação]
    U --> V[📱 Lembrete 24h antes]

    style A fill:#e3f2fd
    style T fill:#c8e6c9
    style R fill:#fff9c4
```

### 2.3 Fluxo de Avaliação

```mermaid
flowchart LR
    A[✅ Procedimento<br/>concluído] --> B[📧 Recebe convite<br/>para avaliar]
    B --> C[⭐ Acessa formulário]

    C --> D[Avalia critérios]

    subgraph "Critérios de Avaliação"
        D --> E[👩‍⚕️ Atendimento]
        D --> F[⏰ Pontualidade]
        D --> G[✨ Resultado]
        D --> H[🏥 Ambiente]
    end

    E & F & G & H --> I[💬 Adiciona comentário]
    I --> J[📷 Fotos antes/depois<br/>opcional]
    J --> K[📤 Envia avaliação]

    K --> L[✅ Avaliação publicada]
    L --> M[👩‍⚕️ Profissional<br/>pode responder]

    style A fill:#e8f5e9
    style L fill:#c8e6c9
```

---

## 3. Fluxos do Profissional

### 3.1 Fluxo de Atendimento

```mermaid
flowchart TD
    A[👩‍⚕️ Profissional<br/>inicia o dia] --> B[📊 Acessa Dashboard]

    B --> C[📅 Visualiza agenda do dia]
    C --> D[👥 Lista de pacientes]

    D --> E{Paciente chegou?}
    E -->|Não| F[⏳ Aguarda]
    F --> E

    E -->|Sim| G[▶️ Inicia Atendimento]

    G --> H[📋 Revisa prontuário]
    H --> I[👀 Verifica histórico]
    I --> J[💆 Realiza procedimento]

    J --> K[📝 Registra evolução]
    K --> L[📷 Adiciona fotos]
    L --> M[💊 Prescrições<br/>se necessário]

    M --> N[✅ Finaliza atendimento]
    N --> O[💰 Registra pagamento]

    O --> P{Mais pacientes?}
    P -->|Sim| D
    P -->|Não| Q[📊 Fecha o dia]

    style A fill:#e3f2fd
    style N fill:#c8e6c9
    style J fill:#fff9c4
```

### 3.2 Estrutura do Prontuário

```mermaid
graph TB
    subgraph "📋 Prontuário Eletrônico"
        A[👤 Dados do Paciente]
        B[📝 Anamnese]
        C[📅 Histórico de Atendimentos]
        D[💊 Medicamentos]
        E[⚠️ Alergias]
        F[📷 Galeria de Fotos]
        G[📄 Documentos]
    end

    A --> A1[Nome, Idade, Contato]
    A --> A2[CPF, Endereço]

    B --> B1[Histórico de saúde]
    B --> B2[Medicamentos em uso]
    B --> B3[Cirurgias anteriores]

    C --> C1[Evoluções]
    C --> C2[Procedimentos realizados]
    C --> C3[Valores pagos]

    F --> F1[Antes]
    F --> F2[Durante]
    F --> F3[Depois]

    G --> G1[Termos de consentimento]
    G --> G2[Receitas]
    G --> G3[Laudos]

    style A fill:#e3f2fd
    style B fill:#fff9c4
    style C fill:#e8f5e9
```

---

## 4. Fluxos da Clínica

### 4.1 Fluxo de Onboarding da Clínica

```mermaid
flowchart TD
    A[🏥 Nova Clínica] --> B[📝 Cadastro no sistema]
    B --> C[📄 Envio de documentos]

    C --> D{Documentos OK?}
    D -->|Não| E[🔄 Correção necessária]
    E --> C

    D -->|Sim| F[✅ Conta aprovada]

    F --> G[⚙️ Configuração inicial]

    subgraph "Setup da Clínica"
        G --> H[🖼️ Logo e fotos]
        G --> I[📍 Endereço e contato]
        G --> J[🕐 Horário funcionamento]
        G --> K[💳 Dados bancários]
    end

    H & I & J & K --> L[👥 Adicionar equipe]

    L --> M[👩‍⚕️ Cadastrar profissionais]
    M --> N[💼 Cadastrar recepcionistas]

    N --> O[💆 Cadastrar procedimentos]
    O --> P[🎉 Clínica pronta!]

    style A fill:#e3f2fd
    style P fill:#c8e6c9
```

### 4.2 Visão da Agenda Consolidada

```mermaid
gantt
    title Agenda da Clínica - 25/11/2025
    dateFormat HH:mm
    axisFormat %H:%M

    section Dra. Ana
    Maria - Botox           :active, ana1, 09:00, 30m
    João - Preenchimento    :ana2, 10:00, 45m
    Almoço                  :crit, ana3, 12:00, 60m
    Carlos - Limpeza        :ana4, 14:00, 60m

    section Dr. Carlos
    Pedro - Peeling         :carlos1, 09:00, 45m
    Livre                   :carlos2, 10:00, 120m
    Almoço                  :crit, carlos3, 12:00, 60m
    Rita - Botox            :carlos4, 14:00, 30m

    section Dra. Fernanda
    Lucia - Hidratação      :fer1, 09:00, 60m
    Ana - Limpeza           :fer2, 10:30, 60m
    Almoço                  :crit, fer3, 12:00, 60m
    Bruno - Peeling         :fer4, 14:00, 45m
```

### 4.3 Dashboard de Métricas

```mermaid
pie showData
    title Faturamento por Procedimento (Novembro)
    "Botox" : 45
    "Preenchimento" : 25
    "Limpeza de Pele" : 15
    "Peeling" : 10
    "Outros" : 5
```

---

## 5. Fluxos do Fornecedor

### 5.1 Fluxo de Venda no Marketplace

```mermaid
flowchart TD
    A[🏭 Fornecedor] --> B[📦 Cadastra produto]

    B --> C[📸 Adiciona fotos]
    C --> D[📝 Descrição e preço]
    D --> E[✅ Produto publicado]

    E --> F[👤 Paciente visualiza]
    F --> G[🛒 Adiciona ao carrinho]
    G --> H[💳 Finaliza compra]

    H --> I[📧 Fornecedor notificado]
    I --> J[✅ Confirma pedido]

    J --> K[📦 Separa produtos]
    K --> L[🏷️ Gera etiqueta]
    L --> M[🚚 Despacha]

    M --> N[📍 Atualiza rastreamento]
    N --> O[📬 Cliente recebe]

    O --> P[✅ Entrega confirmada]
    P --> Q[💰 Pagamento liberado<br/>14 dias após]

    style A fill:#e8f5e9
    style Q fill:#c8e6c9
    style H fill:#fff9c4
```

### 5.2 Ciclo de Vida do Pedido

```mermaid
stateDiagram-v2
    [*] --> Pendente: Pedido criado

    Pendente --> Confirmado: Fornecedor confirma
    Pendente --> Cancelado: Cliente/Fornecedor cancela

    Confirmado --> Preparando: Inicia separação
    Confirmado --> Cancelado: Problema no estoque

    Preparando --> Enviado: Despacha com transportadora

    Enviado --> EmTransito: Coleta realizada
    EmTransito --> Entregue: Entrega confirmada
    EmTransito --> Devolvido: Problema na entrega

    Entregue --> [*]
    Cancelado --> [*]
    Devolvido --> Reembolso
    Reembolso --> [*]

    note right of Pendente: Aguardando ação do fornecedor
    note right of Entregue: Pagamento liberado em 14 dias
```

---

## 6. Fluxos do Administrador

### 6.1 Gestão de Usuários

```mermaid
flowchart TD
    A[⚙️ Admin] --> B[👥 Acessa Usuários]

    B --> C{Ação desejada}

    C -->|Criar| D[➕ Novo usuário]
    D --> D1[Preenche dados]
    D1 --> D2[Define perfil/papel]
    D2 --> D3[✅ Usuário criado]

    C -->|Editar| E[✏️ Seleciona usuário]
    E --> E1[Altera dados]
    E1 --> E2[✅ Salva alterações]

    C -->|Desativar| F[🚫 Seleciona usuário]
    F --> F1{Confirma?}
    F1 -->|Sim| F2[❌ Usuário desativado]
    F1 -->|Não| B

    C -->|Ver detalhes| G[🔍 Abre perfil]
    G --> G1[Histórico de ações]
    G --> G2[Permissões]
    G --> G3[Logs de acesso]

    style A fill:#ff6b6b,color:#fff
    style D3 fill:#c8e6c9
    style F2 fill:#ffcdd2
```

### 6.2 Monitoramento do Sistema

```mermaid
graph TB
    subgraph "📊 Dashboard Admin"
        A[Métricas em Tempo Real]
        B[Alertas do Sistema]
        C[Logs de Atividade]
    end

    subgraph "👥 Usuários"
        D[Total de usuários]
        E[Novos hoje]
        F[Ativos agora]
    end

    subgraph "📅 Agendamentos"
        G[Total do dia]
        H[Confirmados]
        I[Cancelados]
    end

    subgraph "💰 Financeiro"
        J[Faturamento]
        K[Transações]
        L[Comissões]
    end

    subgraph "🤖 IA"
        M[Mensagens Gisele]
        N[Uso de tokens]
        O[Satisfação]
    end

    A --> D & E & F
    A --> G & H & I
    A --> J & K & L
    A --> M & N & O

    style A fill:#e3f2fd
```

---

## 7. Fluxo de Pagamento

### 7.1 Checkout Online

```mermaid
sequenceDiagram
    participant P as 👤 Paciente
    participant W as 🌐 Frontend
    participant A as ⚡ API
    participant S as 💳 Stripe/MP
    participant B as 💾 Banco

    P->>W: Confirma agendamento
    W->>A: POST /pagamentos/criar
    A->>S: Cria sessão de checkout
    S-->>A: URL de pagamento
    A-->>W: Redireciona
    W->>P: Abre checkout

    P->>S: Insere dados do cartão
    S->>S: Processa pagamento

    alt Pagamento aprovado
        S-->>A: Webhook: payment_success
        A->>B: Registra transação
        A->>P: Email de confirmação
        A-->>W: Sucesso!
        W->>P: Mostra confirmação
    else Pagamento recusado
        S-->>A: Webhook: payment_failed
        A-->>W: Erro
        W->>P: Mostra erro
    end
```

### 7.2 Fluxo de Comissões (Marketplace)

```mermaid
flowchart LR
    A[💳 Venda<br/>R$ 100] --> B{Processamento}

    B --> C[Comissão DoctorQ<br/>12% = R$ 12]
    B --> D[Taxa Gateway<br/>3% = R$ 3]
    B --> E[Líquido Fornecedor<br/>85% = R$ 85]

    C --> F[💰 Receita<br/>Plataforma]
    D --> G[💳 Stripe/MP]
    E --> H[🏭 Conta do<br/>Fornecedor]

    H --> I[⏳ Retenção 14 dias]
    I --> J[💸 Repasse automático]

    style A fill:#e3f2fd
    style J fill:#c8e6c9
```

---

## 8. Integrações

### 8.1 Ecossistema de Integrações

```mermaid
graph TB
    subgraph "🏥 DoctorQ Core"
        API[API Principal]
    end

    subgraph "💳 Pagamentos"
        STR[Stripe]
        MP[MercadoPago]
    end

    subgraph "📧 Comunicação"
        EMAIL[SendGrid/SES]
        WPP[WhatsApp API]
        SMS[Twilio SMS]
    end

    subgraph "☁️ Infraestrutura"
        AWS[AWS S3]
        RDS[AWS RDS]
        EC2[AWS EC2]
    end

    subgraph "🤖 IA"
        OAI[OpenAI GPT-4]
        LF[Langfuse]
        QD[Qdrant]
    end

    subgraph "📊 Analytics"
        GA[Google Analytics]
        MX[Mixpanel]
    end

    API <--> STR
    API <--> MP
    API <--> EMAIL
    API <--> WPP
    API <--> SMS
    API <--> AWS
    API <--> RDS
    API <--> OAI
    API <--> LF
    API <--> QD
    API --> GA
    API --> MX

    style API fill:#4ecdc4,color:#fff
```

---

## 9. Jornadas de Usuário

### 9.1 Jornada Completa do Paciente

```mermaid
journey
    title Jornada do Paciente no DoctorQ
    section Descoberta
      Pesquisa no Google: 3: Paciente
      Acessa landing page: 4: Paciente
      Cria conta: 4: Paciente
    section Busca
      Busca profissional: 4: Paciente
      Filtra resultados: 4: Paciente
      Lê avaliações: 5: Paciente
    section Agendamento
      Escolhe procedimento: 4: Paciente
      Seleciona horário: 5: Paciente
      Confirma agendamento: 5: Paciente
    section Atendimento
      Recebe lembrete: 5: Sistema
      Vai à clínica: 4: Paciente
      Realiza procedimento: 5: Paciente
    section Pós-atendimento
      Avalia profissional: 4: Paciente
      Recomenda para amigos: 5: Paciente
      Agenda retorno: 5: Paciente
```

### 9.2 Jornada do Profissional

```mermaid
journey
    title Jornada do Profissional no DoctorQ
    section Cadastro
      Cria conta: 4: Profissional
      Envia documentos: 3: Profissional
      Aguarda verificação: 2: Profissional
      Conta aprovada: 5: Sistema
    section Configuração
      Completa perfil: 4: Profissional
      Cadastra procedimentos: 4: Profissional
      Define horários: 4: Profissional
    section Operação
      Recebe agendamentos: 5: Sistema
      Atende pacientes: 5: Profissional
      Registra prontuário: 4: Profissional
    section Crescimento
      Recebe avaliações: 5: Paciente
      Aumenta visibilidade: 5: Sistema
      Cresce base de pacientes: 5: Profissional
```

---

## 10. Modelo de Dados Simplificado

```mermaid
erDiagram
    USUARIO ||--o{ AGENDAMENTO : faz
    USUARIO ||--o{ AVALIACAO : escreve
    USUARIO ||--o{ MENSAGEM : envia

    PROFISSIONAL ||--o{ AGENDAMENTO : atende
    PROFISSIONAL ||--o{ PROCEDIMENTO : oferece
    PROFISSIONAL }o--|| CLINICA : trabalha_em

    CLINICA ||--o{ PROFISSIONAL : possui
    CLINICA ||--o{ AGENDAMENTO : hospeda

    AGENDAMENTO ||--|| PROCEDIMENTO : refere
    AGENDAMENTO ||--o| PAGAMENTO : tem
    AGENDAMENTO ||--o| AVALIACAO : gera

    FORNECEDOR ||--o{ PRODUTO : vende
    PRODUTO ||--o{ PEDIDO_ITEM : contem
    PEDIDO ||--o{ PEDIDO_ITEM : possui
    USUARIO ||--o{ PEDIDO : realiza

    USUARIO {
        uuid id_user PK
        string nm_email
        string nm_completo
        string nm_papel
    }

    PROFISSIONAL {
        uuid id_profissional PK
        string nm_registro
        float vl_avaliacao_media
    }

    CLINICA {
        uuid id_clinica PK
        string nm_clinica
        string ds_endereco
    }

    AGENDAMENTO {
        uuid id_agendamento PK
        datetime dt_agendamento
        string ds_status
    }

    PROCEDIMENTO {
        uuid id_procedimento PK
        string nm_procedimento
        decimal vl_valor
    }
```

---

## Como Usar Estes Diagramas

### No GitHub
Os diagramas Mermaid são renderizados automaticamente em arquivos `.md` no GitHub.

### No GitBook
GitBook suporta Mermaid nativamente.

### Exportar como Imagem
Use o [Mermaid Live Editor](https://mermaid.live/) para exportar PNG/SVG.

### Em Apresentações
1. Acesse https://mermaid.live/
2. Cole o código do diagrama
3. Exporte como PNG ou SVG
4. Use na sua apresentação

---

*Última atualização: Novembro 2025*
