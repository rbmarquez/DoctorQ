# Implementação: Central de Atendimento Omnichannel

**Data:** 2025-11-22
**Versão:** 2.0.0
**Status:** ✅ Implementado (Base Completa + Serviços de Processamento)

---

## Sumário Executivo

Este documento descreve a implementação do módulo **Central de Atendimento Omnichannel** para o DoctorQ, seguindo a **Opção 2: Implementação Nativa Completa**.

A implementação foi enriquecida com padrões de arquitetura do projeto **Maua** (plataformamaua-api-v2), especialmente nos módulos de `fila-atendimento`, `canal-atendimento` e `whatsapp`, adaptados de NestJS/TypeScript para FastAPI/Python.

### Custos Estimados
- **Desenvolvimento:** R$ 34.000 - 49.000
- **Operacional mensal:** R$ 200 - 500/mês
- **ROI:** Melhor retorno a longo prazo

### Estatísticas da Implementação
| Métrica | Quantidade |
|---------|------------|
| Tabelas no banco | 11 |
| ENUMs criados | 8 |
| Services implementados | 10 |
| Routers configurados | 2 |
| Modelos SQLAlchemy | 11 |

---

## Arquitetura do Módulo

### Estrutura de Diretórios

```
estetiQ-api/src/central_atendimento/
├── __init__.py                       # Exports principais
├── models/
│   ├── __init__.py                   # Exports dos modelos
│   ├── canal.py                      # Canais de comunicação (WhatsApp, Instagram, etc.)
│   ├── contato_omni.py               # Contatos unificados omnichannel
│   ├── conversa_omni.py              # Conversas e mensagens
│   ├── campanha.py                   # Campanhas e destinatários
│   ├── lead_scoring.py               # Lead scoring com histórico
│   └── fila_atendimento.py           # Filas, itens e roteamento
├── services/
│   ├── __init__.py                   # Exports dos serviços
│   ├── whatsapp_service.py           # Integração WhatsApp Business API (Meta)
│   ├── canal_service.py              # CRUD de canais
│   ├── contato_service.py            # CRUD de contatos
│   ├── conversa_service.py           # Gerenciamento de conversas
│   ├── campanha_service.py           # Gerenciamento de campanhas
│   ├── lead_scoring_service.py       # Cálculo de lead scoring
│   ├── fila_service.py               # Gerenciamento de filas
│   ├── routing_service.py            # Roteamento inteligente
│   ├── fila_processor_service.py     # ✨ Processador automático de fila (Maua)
│   └── websocket_notification_service.py  # ✨ Notificações em tempo real (Maua)
├── routes/
│   ├── __init__.py
│   ├── central_atendimento_route.py  # API REST principal
│   └── webhook_route.py              # Webhooks WhatsApp/Meta
└── schemas/
    └── __init__.py
```

### Inspiração do Maua

Os seguintes componentes foram inspirados e adaptados do projeto Maua (NestJS → FastAPI):

| Componente Maua | Componente DoctorQ | Adaptações |
|-----------------|-------------------|------------|
| `FilaAtendimentoService` | `FilaProcessorService` | @Cron → asyncio loop, TypeORM → SQLAlchemy async |
| `WebsocketNotificationService` | `WebSocketNotificationService` | Socket.IO → FastAPI WebSocket nativo |
| `WebsocketChatService` | (integrado no WebSocketNotificationService) | Unificado para simplificar |
| `ProcessQueueWhatsApp.service` | (padrão aplicado) | Processamento de mensagens em fila |
| Estratégias `round_robin`, `menos_ocupado` | ✅ Implementados | Lógica mantida |

---

## Modelos de Dados (11 Tabelas)

### Diagrama de Relacionamentos

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  tb_canais_omni │     │ tb_contatos_omni │     │  tb_lead_scores     │
│  (Canais)       │     │ (Contatos)       │◄────│  (Score do Lead)    │
└────────┬────────┘     └────────┬─────────┘     └─────────────────────┘
         │                       │                          │
         │                       │                          ▼
         │              ┌────────▼─────────┐     ┌─────────────────────┐
         │              │ tb_conversas_omni│     │tb_lead_score_hist   │
         └──────────────►  (Conversas)     │     │ (Histórico Score)   │
                        └────────┬─────────┘     └─────────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │ tb_mensagens_omni│
                        │ (Mensagens)      │
                        └──────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│tb_filas_atendimento │     │ tb_atendimento_items│
│ (Filas)             │◄────│ (Itens na Fila)     │
└─────────────────────┘     └─────────────────────┘

┌─────────────────────┐     ┌─────────────────────────┐
│   tb_campanhas      │◄────│ tb_campanha_destinatarios│
│   (Campanhas)       │     │ (Destinatários)         │
└─────────────────────┘     └─────────────────────────┘
```

### 1. Canal (`tb_canais_omni`)

Representa uma integração com uma plataforma de comunicação.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_canal | UUID | PK |
| id_empresa | UUID | FK para multi-tenant |
| nm_canal | VARCHAR(100) | Nome do canal |
| tp_canal | ENUM | whatsapp, instagram, facebook, email, sms |
| st_canal | ENUM | ativo, inativo, configurando, erro |
| ds_credenciais | JSONB | Credenciais criptografadas (AES-256) |
| nr_telefone_whatsapp | VARCHAR(20) | Número WhatsApp |
| id_conta_whatsapp | VARCHAR(100) | WABA ID |
| id_telefone_whatsapp | VARCHAR(100) | Phone Number ID |
| fg_default | BOOLEAN | Canal padrão da empresa |
| dt_criacao, dt_atualizacao | TIMESTAMP | Auditoria |

### 2. Contato Omnichannel (`tb_contatos_omni`)

Contato unificado com dados de todos os canais.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_contato | UUID | PK |
| id_empresa | UUID | FK multi-tenant |
| id_paciente | UUID | FK (opcional) para `tb_pacientes` |
| nm_contato | VARCHAR(255) | Nome |
| nm_email | VARCHAR(255) | Email |
| nr_telefone | VARCHAR(20) | Telefone principal |
| id_whatsapp | VARCHAR(50) | ID WhatsApp (indexado) |
| id_instagram | VARCHAR(100) | ID Instagram |
| id_facebook | VARCHAR(100) | ID Facebook |
| st_contato | ENUM | lead, qualificado, cliente, inativo |
| nr_score | INT | Score do lead (0-100) |
| nr_temperatura | INT | Temperatura do lead (0-100) |
| ds_tags | TEXT[] | Tags de segmentação |
| ds_segmentos | TEXT[] | Segmentos |
| ds_dados_extras | JSONB | Dados adicionais flexíveis |
| fg_opt_in_marketing | BOOLEAN | Aceita marketing |
| dt_ultimo_contato | TIMESTAMP | Última interação |

### 3. Conversa (`tb_conversas_omni`)

Sessão de comunicação com um contato.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_conversa | UUID | PK |
| id_empresa | UUID | FK |
| id_contato | UUID | FK para contato |
| id_canal | UUID | FK para canal |
| tp_canal | ENUM | Tipo do canal |
| st_aberta | BOOLEAN | Se conversa está ativa |
| st_bot_ativo | BOOLEAN | Se bot está respondendo |
| st_aguardando_humano | BOOLEAN | Aguardando atendente |
| id_atendente | UUID | FK para atendente |
| id_fila | UUID | FK para fila |
| id_agente | UUID | FK para agente de IA |
| nr_mensagens | INT | Contador de mensagens |
| nm_assunto | VARCHAR(255) | Assunto/título |
| ds_contexto | JSONB | Contexto para IA |
| dt_abertura, dt_fechamento | TIMESTAMP | Datas de controle |

### 4. Mensagem (`tb_mensagens_omni`)

Mensagens individuais das conversas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_mensagem | UUID | PK |
| id_conversa | UUID | FK |
| id_externo | VARCHAR(255) | ID da plataforma (indexado) |
| st_entrada | BOOLEAN | True = do contato |
| tp_mensagem | ENUM | texto, imagem, audio, video, documento, localizacao, contato, sticker, reacao, interativo |
| ds_conteudo | TEXT | Conteúdo da mensagem |
| ds_url_midia | VARCHAR(1000) | URL da mídia |
| nm_mime_type | VARCHAR(100) | MIME type |
| nr_tamanho_arquivo | INT | Tamanho em bytes |
| st_mensagem | ENUM | pendente, enviada, entregue, lida, falha |
| ds_erro | TEXT | Mensagem de erro (se falha) |
| ds_metadata | JSONB | Metadados extras |
| dt_criacao, dt_envio, dt_entrega, dt_leitura | TIMESTAMP | Timestamps de rastreio |

### 5. Campanha (`tb_campanhas`)

Campanhas de prospecção e marketing.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_campanha | UUID | PK |
| id_empresa | UUID | FK |
| id_canal | UUID | FK (opcional) |
| nm_campanha | VARCHAR(255) | Nome |
| ds_campanha | TEXT | Descrição |
| tp_campanha | ENUM | prospeccao, reengajamento, marketing, promocional, informativo, pesquisa |
| tp_canal | ENUM | Canal de envio |
| st_campanha | ENUM | rascunho, agendada, em_execucao, pausada, concluida, cancelada |
| nm_template | VARCHAR(100) | Template WhatsApp |
| ds_mensagem | TEXT | Mensagem |
| ds_variaveis | JSONB | Variáveis do template |
| ds_filtros_segmentacao | JSONB | Filtros para destinatários |
| dt_agendamento | TIMESTAMP | Data de início agendado |
| dt_inicio, dt_fim | TIMESTAMP | Execução real |
| nr_destinatarios_total | INT | Total de destinatários |
| nr_enviados, nr_entregues, nr_lidos, nr_respondidos, nr_falhas | INT | Métricas |
| vl_custo_estimado, vl_custo_real | DECIMAL | Custos |

### 6. Destinatário de Campanha (`tb_campanha_destinatarios`) ✨ NOVO

Relação N:N entre campanhas e contatos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_destinatario | UUID | PK |
| id_campanha | UUID | FK para campanha |
| id_contato | UUID | FK para contato |
| st_envio | ENUM | pendente, enviado, entregue, lido, respondido, falha, opt_out |
| ds_erro | TEXT | Mensagem de erro |
| dt_envio, dt_entrega, dt_leitura, dt_resposta | TIMESTAMP | Timestamps |
| ds_resposta | TEXT | Conteúdo da resposta |

### 7. Lead Score (`tb_lead_scores`)

Score automático de leads com 4 dimensões.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_score | UUID | PK |
| id_contato | UUID | FK (unique) |
| id_empresa | UUID | FK |
| nr_score_total | INT | Score total (0-100) |
| nr_score_comportamento | INT | Componente comportamento (25%) |
| nr_score_perfil | INT | Componente perfil (20%) |
| nr_score_engajamento | INT | Componente engajamento (30%) |
| nr_score_intencao | INT | Componente intenção (25%) |
| nr_temperatura | INT | Urgência (0-100) |
| st_intencao_compra | BOOLEAN | Detectada intenção |
| nm_acao_recomendada | VARCHAR(50) | Próxima ação |
| ds_sinais_detectados | TEXT[] | Sinais identificados |
| dt_ultimo_calculo | TIMESTAMP | Última atualização |

### 8. Histórico de Lead Score (`tb_lead_score_historico`) ✨ NOVO

Histórico de alterações no score para análise temporal.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_historico | UUID | PK |
| id_score | UUID | FK para lead_score |
| id_contato | UUID | FK para contato |
| nr_score_anterior | INT | Score antes |
| nr_score_novo | INT | Score depois |
| nm_motivo | VARCHAR(100) | Motivo da alteração |
| ds_detalhes | JSONB | Detalhes da mudança |
| dt_criacao | TIMESTAMP | Data do registro |

### 9. Fila de Atendimento (`tb_filas_atendimento`)

Filas para atendimento humano com SLA.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_fila | UUID | PK |
| id_empresa | UUID | FK |
| nm_fila | VARCHAR(100) | Nome da fila |
| ds_fila | TEXT | Descrição |
| nm_modo_distribuicao | VARCHAR(30) | round_robin, menos_ocupado |
| nr_limite_simultaneo | INT | Tickets simultâneos por atendente |
| nr_sla_primeira_resposta | INT | SLA 1ª resposta (segundos) |
| nr_sla_resolucao | INT | SLA resolução (segundos) |
| ds_horario_funcionamento | JSONB | Horários por dia da semana |
| ds_mensagem_fora_horario | TEXT | Mensagem automática |
| ds_mensagem_fila | TEXT | Mensagem de posição na fila |
| ds_atendentes | UUID[] | Lista de atendentes |
| fg_ativo | BOOLEAN | Fila ativa |
| nr_prioridade | INT | Prioridade (1-10) |
| nr_aguardando | INT | Contador atual |
| nr_atendimentos_hoje | INT | Atendimentos do dia |
| nr_tempo_medio_espera | INT | Tempo médio em segundos |
| nr_tempo_medio_atendimento | INT | Duração média |

### 10. Item de Atendimento (`tb_atendimento_items`) ✨ NOVO

Tickets/atendimentos individuais na fila. Inspirado no modelo de tickets do Maua.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_item | UUID | PK |
| id_fila | UUID | FK para fila |
| id_empresa | UUID | FK |
| id_conversa | UUID | FK para conversa |
| id_contato | UUID | FK para contato |
| id_atendente | UUID | FK (atribuído após distribuição) |
| st_atendimento | ENUM | aguardando, em_atendimento, finalizado, abandonado, transferido |
| nr_protocolo | VARCHAR(20) | Número de protocolo |
| nr_prioridade | INT | Prioridade (1-10) |
| dt_entrada_fila | TIMESTAMP | Entrada na fila |
| dt_inicio_atendimento | TIMESTAMP | Início do atendimento |
| dt_fim_atendimento | TIMESTAMP | Fim do atendimento |
| dt_sla_primeira_resposta | TIMESTAMP | Deadline SLA 1ª resposta |
| dt_sla_resolucao | TIMESTAMP | Deadline SLA resolução |
| nr_tempo_espera | INT | Tempo aguardando (segundos) |
| nr_tempo_atendimento | INT | Duração do atendimento |
| nm_motivo_finalizacao | VARCHAR(100) | Motivo do encerramento |
| nr_avaliacao | INT | Nota do cliente (1-5) |
| ds_comentario_avaliacao | TEXT | Comentário do cliente |

### 11. ENUMs Criados

```sql
-- 8 ENUMs para tipagem forte
CREATE TYPE canal_tipo AS ENUM ('whatsapp', 'instagram', 'facebook', 'email', 'sms');
CREATE TYPE canal_status AS ENUM ('ativo', 'inativo', 'configurando', 'erro');
CREATE TYPE contato_status AS ENUM ('lead', 'qualificado', 'cliente', 'inativo');
CREATE TYPE mensagem_tipo AS ENUM ('texto', 'imagem', 'audio', 'video', 'documento', 'localizacao', 'contato', 'sticker', 'reacao', 'interativo');
CREATE TYPE mensagem_status AS ENUM ('pendente', 'enviada', 'entregue', 'lida', 'falha');
CREATE TYPE campanha_tipo AS ENUM ('prospeccao', 'reengajamento', 'marketing', 'promocional', 'informativo', 'pesquisa');
CREATE TYPE campanha_status AS ENUM ('rascunho', 'agendada', 'em_execucao', 'pausada', 'concluida', 'cancelada');
CREATE TYPE atendimento_status AS ENUM ('aguardando', 'em_atendimento', 'finalizado', 'abandonado', 'transferido');
```

---

## Serviços Implementados (10 Services)

### 1. WhatsAppService

Integração com **Meta Cloud API** (oficial).

```python
# Métodos principais
await whatsapp.enviar_mensagem_texto(telefone, texto)
await whatsapp.enviar_mensagem_template(telefone, template_name, components)
await whatsapp.enviar_imagem(telefone, url, caption)
await whatsapp.enviar_documento(telefone, url, filename)
await whatsapp.enviar_botoes_interativos(telefone, texto, botoes)
await whatsapp.enviar_lista_interativa(telefone, texto, botao, secoes)
await whatsapp.marcar_como_lida(message_id)
await whatsapp.listar_templates()
```

**Custos WhatsApp Business API:**
- Conversas iniciadas pelo usuário: ~R$ 0,08
- Conversas iniciadas pelo negócio: ~R$ 0,15-0,50

### 2. LeadScoringService

Cálculo automático de score baseado em 4 dimensões:

| Dimensão | Peso | Critérios |
|----------|------|-----------|
| **Comportamento** | 25% | Tempo de resposta, mensagens enviadas, horário de interação |
| **Perfil** | 20% | Completude dos dados, telefone validado, email preenchido |
| **Engajamento** | 30% | Frequência de interações, recência, duração das conversas |
| **Intenção** | 25% | Sinais de compra detectados por palavras-chave |

**Sinais de intenção detectados:**
- "preço", "valor", "quanto custa"
- "agendar", "agenda", "horário"
- "desconto", "promoção", "parcelamento"
- "comprar", "quero", "interessado"

**Ações recomendadas:**
| Ação | Critério |
|------|----------|
| `ligar_agora` | Score > 80 + intenção detectada |
| `enviar_proposta` | Score > 60 + interesse demonstrado |
| `campanha_reengajamento` | Inativo há > 30 dias |
| `enviar_conteudo` | Score 40-60 |
| `qualificar` | Score < 40, dados incompletos |

### 3. RoutingService

Roteamento inteligente de conversas:

| Modo | Descrição |
|------|-----------|
| **Round Robin** | Distribuição igualitária entre atendentes |
| **Menos Ocupado** | Prioriza atendente com menos tickets ativos |

### 4. FilaProcessorService ✨ NOVO (Inspirado no Maua)

Processamento automático de fila de atendimento em background.

```python
class FilaProcessorService:
    """
    Serviço de processamento automático de fila de atendimento.
    Inspirado no FilaAtendimentoService do Maua (NestJS @Cron → asyncio loop).
    """

    DEFAULT_SIMULTANEOUS_TICKETS = 5    # Tickets simultâneos por operador
    DEFAULT_ABANDONED_TIMEOUT_SECONDS = 600  # 10 minutos para abandono
    PROCESS_INTERVAL_SECONDS = 15       # Intervalo de processamento

    async def start(self):
        """Inicia o processamento automático (chamado no lifespan)."""

    async def stop(self):
        """Para o processamento (chamado no shutdown)."""

    async def _process_queue(self):
        """Processa até 50 itens por ciclo, ordenados por prioridade e entrada."""

    async def _find_available_operator(self, db, fila, id_empresa):
        """
        Encontra operador disponível usando estratégia configurada.
        - round_robin: secrets.choice() entre disponíveis
        - menos_ocupado: ordena por menor número de tickets
        """

    async def _assign_to_operator(self, db, item, operador, fila):
        """Atribui ticket ao operador e atualiza métricas."""

    async def _handle_abandoned(self, db, item):
        """Marca ticket como abandonado após timeout."""
```

**Fluxo de Processamento:**
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Loop 15s   │────►│ Buscar Aguardando│────►│ Para cada item  │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                    ┌──────────────────┐              ▼
                    │ Notificar posição│◄─────┬─────────────────┐
                    └──────────────────┘      │ Verificar timeout│
                                              └────────┬────────┘
                    ┌──────────────────┐              │ OK
                    │ Buscar operador  │◄─────────────┘
                    │ disponível       │
                    └────────┬─────────┘
                             │ Encontrou
                    ┌────────▼─────────┐
                    │ Atribuir ticket  │
                    │ + Calcular SLA   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Notificar via WS │
                    └──────────────────┘
```

### 5. WebSocketNotificationService ✨ NOVO (Inspirado no Maua)

Notificações em tempo real via WebSocket.

```python
class WebSocketNotificationService:
    """
    Gerenciador de conexões WebSocket e notificações.
    Inspirado no WebsocketNotificationService e WebsocketChatService do Maua.

    Features:
    - Múltiplas conexões por usuário (diferentes dispositivos)
    - Salas por empresa e conversa
    - Broadcast para grupos específicos
    - Heartbeat para manter conexões ativas
    """

    # Tipos de notificação
    class NotificationType(str, Enum):
        # Para atendentes
        NEW_TICKET = "new_ticket"
        TICKET_ASSIGNED = "ticket_assigned"
        TICKET_TRANSFERRED = "ticket_transferred"
        NEW_MESSAGE = "new_message"
        TICKET_CLOSED = "ticket_closed"

        # Para clientes/contatos
        QUEUE_POSITION = "queue_position"
        ATTENDANT_ASSIGNED = "attendant_assigned"
        MESSAGE_RECEIVED = "message_received"
        SESSION_ENDED = "session_ended"

        # Sistema
        SYSTEM_MESSAGE = "system_message"
        ERROR = "error"

    async def connect(websocket, user_id, empresa_id, conversa_id, role):
        """Registra conexão WebSocket e retorna connection_id."""

    async def disconnect(connection_id):
        """Remove conexão e limpa índices."""

    async def send_to_user(user_id, notification_type, data):
        """Envia para todas as conexões de um usuário."""

    async def send_to_conversa(conversa_id, notification_type, data):
        """Envia para todas as conexões de uma conversa."""

    async def send_to_empresa_attendants(empresa_id, notification_type, data):
        """Envia para todos os atendentes de uma empresa."""

    async def notify_queue_position(conversa_id, position, total, message):
        """Notifica cliente sobre posição na fila."""

    async def notify_new_ticket(empresa_id, attendant_id, ticket_data):
        """Notifica atendente sobre novo ticket."""
```

**Índices Internos:**
```python
self._connections: Dict[str, WebSocketConnection]  # connection_id → connection
self._by_user: Dict[str, Set[str]]                # user_id → connection_ids
self._by_empresa: Dict[str, Set[str]]             # empresa_id → connection_ids
self._by_conversa: Dict[str, Set[str]]            # conversa_id → connection_ids
self._attendants: Dict[str, Set[str]]             # empresa_id → attendant_ids
```

### 6. CampanhaService

Gerenciamento de campanhas de prospecção:

```python
# Fluxo de campanha
campanha = await campanha_service.criar(dados)
await campanha_service.adicionar_destinatarios_por_filtro(campanha.id)
await campanha_service.iniciar_campanha(campanha.id)
# ... execução automática ...
metricas = await campanha_service.obter_metricas(campanha.id)
```

### 7-10. Outros Services

- **CanalService**: CRUD de canais, validação de credenciais
- **ContatoService**: CRUD de contatos, merge de duplicados, importação em massa
- **ConversaService**: Gerenciamento de sessões, histórico
- **FilaService**: CRUD de filas, configurações de SLA

---

## API Endpoints

### Canais
```
POST   /central-atendimento/canais/              # Criar canal
GET    /central-atendimento/canais/              # Listar canais
GET    /central-atendimento/canais/{id}/         # Obter canal
PATCH  /central-atendimento/canais/{id}/         # Atualizar canal
DELETE /central-atendimento/canais/{id}/         # Deletar canal
POST   /central-atendimento/canais/{id}/validar/ # Validar credenciais
```

### Contatos
```
POST   /central-atendimento/contatos/             # Criar contato
GET    /central-atendimento/contatos/             # Listar contatos
GET    /central-atendimento/contatos/{id}/        # Obter contato
PATCH  /central-atendimento/contatos/{id}/        # Atualizar contato
DELETE /central-atendimento/contatos/{id}/        # Deletar contato
POST   /central-atendimento/contatos/importar/    # Importar em massa
GET    /central-atendimento/contatos/{id}/score/  # Obter score
POST   /central-atendimento/contatos/{id}/score/recalcular/ # Recalcular
```

### Conversas
```
GET    /central-atendimento/conversas/                              # Listar
GET    /central-atendimento/conversas/{id}/                         # Obter
GET    /central-atendimento/conversas/{id}/mensagens/               # Mensagens
POST   /central-atendimento/conversas/{id}/mensagens/               # Enviar
POST   /central-atendimento/conversas/{id}/transferir-humano/       # Transferir
POST   /central-atendimento/conversas/{id}/fechar/                  # Fechar
```

### Filas de Atendimento
```
POST   /central-atendimento/filas/                            # Criar fila
GET    /central-atendimento/filas/                            # Listar filas
GET    /central-atendimento/filas/{id}/                       # Obter fila
GET    /central-atendimento/filas/{id}/metricas/              # Métricas
GET    /central-atendimento/filas/{id}/atendimentos/          # Listar itens
POST   /central-atendimento/filas/{id}/proximo-atendimento/   # Próximo
```

### Campanhas
```
POST   /central-atendimento/campanhas/                        # Criar
GET    /central-atendimento/campanhas/                        # Listar
GET    /central-atendimento/campanhas/{id}/                   # Obter
GET    /central-atendimento/campanhas/{id}/metricas/          # Métricas
POST   /central-atendimento/campanhas/{id}/destinatarios/     # Adicionar
POST   /central-atendimento/campanhas/{id}/iniciar/           # Iniciar
POST   /central-atendimento/campanhas/{id}/pausar/            # Pausar
```

### Webhooks
```
GET    /webhooks/whatsapp/    # Verificação Meta
POST   /webhooks/whatsapp/    # Receber mensagens WhatsApp
GET    /webhooks/instagram/   # Verificação Meta
POST   /webhooks/instagram/   # Receber mensagens Instagram
GET    /webhooks/facebook/    # Verificação Meta
POST   /webhooks/facebook/    # Receber mensagens Facebook
```

### WebSocket
```
WS     /ws/atendimento/{empresa_id}/                    # Conexão atendente
WS     /ws/atendimento/{empresa_id}/{conversa_id}/      # Conexão conversa
```

---

## Configuração

### 1. WhatsApp Business API

1. Criar conta no [Meta for Developers](https://developers.facebook.com)
2. Criar App do tipo "Business"
3. Adicionar produto "WhatsApp"
4. Obter credenciais:
   - `access_token`: Token permanente (System User Token)
   - `phone_number_id`: ID do número
   - `waba_id`: WhatsApp Business Account ID
5. Configurar webhook apontando para `/api/v1/webhooks/whatsapp/`
6. Verificar token de validação

### 2. Variáveis de Ambiente

```env
# WhatsApp (verificação de webhook)
WHATSAPP_VERIFY_TOKEN=estetiQ_whatsapp_verify_token

# Criptografia de credenciais
CREDENTIALS_ENCRYPTION_KEY=sua_chave_aes_256_aqui

# Configurações do processador de fila (opcional)
FILA_PROCESS_INTERVAL=15
FILA_ABANDONED_TIMEOUT=600
FILA_DEFAULT_SIMULTANEOUS=5
```

### 3. Migrations

```bash
# Migration já aplicada em dbdoctorq
# Arquivo: database/migration_021_central_atendimento.sql

# Para nova instalação:
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq \
  -f database/migration_021_central_atendimento.sql

# Verificar tabelas criadas:
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d dbdoctorq \
  -c "\dt tb_*omni* tb_*atend* tb_lead* tb_camp*"
```

---

## Integração com FastAPI

### main.py

```python
# Imports
from src.central_atendimento.routes.central_atendimento_route import router as central_atendimento_router
from src.central_atendimento.routes.webhook_route import router as central_atendimento_webhook_router
from src.central_atendimento.services.fila_processor_service import (
    start_fila_processor,
    stop_fila_processor,
)

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await start_fila_processor()  # ✅ Inicia processador de fila
    yield
    # Shutdown
    await stop_fila_processor()   # ✅ Para processador de fila

# Routers
app.include_router(central_atendimento_router)       # Rotas autenticadas
app.include_router(central_atendimento_webhook_router)  # Webhooks
```

---

## Checklist de Implementação

### ✅ Fase 1: MVP (Concluído)
- [x] Estrutura base do módulo
- [x] Models e schemas (11 tabelas, 8 ENUMs)
- [x] Services de integração (10 services)
- [x] API routes
- [x] Migrations do banco (aplicada em dbdoctorq)
- [x] FilaProcessorService (background job)
- [x] WebSocketNotificationService (real-time)
- [x] Integração com lifespan (start/stop)
- [ ] Testes unitários
- [ ] Integração real com WhatsApp Business API (aguardando credenciais)

### 🔄 Fase 2: Funcionalidades Avançadas (Próximo)
- [ ] Dashboard de métricas em tempo real
- [ ] Worker de campanhas (background jobs)
- [ ] Notificações push para atendentes
- [ ] Editor visual de fluxos (drag-and-drop)
- [ ] Integração com Instagram/Facebook

### 📋 Fase 3: IA e Automação (Futuro)
- [ ] Chatbot com GPT integrado
- [ ] Lead scoring com ML (além de regras)
- [ ] Análise de sentimento
- [ ] Sugestões automáticas de resposta
- [ ] Classificação automática de conversas
- [ ] Transcrição de áudio (inspirado no Maua)

---

## Comparativo: Documentação vs Implementação

| Aspecto | Documentado | Implementado |
|---------|-------------|--------------|
| Tabelas | 7 | 11 (+4) |
| ENUMs | ~6 | 8 |
| Services | 8 | 10 (+2 do Maua) |
| Background Jobs | ❌ | ✅ FilaProcessor |
| WebSocket | Mencionado | ✅ Implementado |
| Migrations | Pendente | ✅ Aplicada |

**Tabelas extras implementadas:**
1. `tb_campanha_destinatarios` - Relacionamento N:N campanhas ↔ contatos
2. `tb_lead_score_historico` - Histórico de alterações de score
3. `tb_atendimento_items` - Tickets individuais na fila
4. Campos extras em todas as tabelas para métricas

**Services extras (inspirados no Maua):**
1. `FilaProcessorService` - Processamento automático de fila
2. `WebSocketNotificationService` - Notificações em tempo real

---

## Conclusão

A implementação do módulo **Central de Atendimento Omnichannel** está completa na sua **base estrutural**, seguindo as melhores práticas:

| Padrão | Implementado |
|--------|--------------|
| Multi-tenant | ✅ Todas as tabelas têm `id_empresa` |
| Nomenclatura | ✅ Prefixos `tb_`, `nm_`, `ds_`, `st_`, `nr_`, `dt_` |
| Async/await | ✅ Todas operações assíncronas |
| Type hints | ✅ Tipagem completa Python 3.12 |
| Pydantic v2 | ✅ Schemas com `model_validate` |
| SQLAlchemy 2.0 | ✅ Async sessions |
| Background Jobs | ✅ asyncio tasks no lifespan |
| Real-time | ✅ WebSocket nativo FastAPI |

**Status atual:**
1. ✅ Banco de dados estruturado (11 tabelas)
2. ✅ Serviços de processamento ativos
3. ✅ WebSocket configurado
4. ⏳ Aguardando credenciais WhatsApp Business para testes reais
5. ⏳ Testes unitários pendentes
6. ⏳ Frontend de atendimento pendente

---

## PLANO DE IMPLANTAÇÃO COMPLETO

### Visão Geral

Este plano detalha a implantação completa da Central de Atendimento Omnichannel, integrando as funcionalidades do projeto Maua com a arquitetura DoctorQ.

### Arquitetura Final - 14 Services

```
central_atendimento/services/
├── whatsapp_service.py           # ✅ Integração Meta Cloud API
├── canal_service.py              # ✅ CRUD de canais
├── contato_service.py            # ✅ CRUD de contatos
├── conversa_service.py           # ✅ Gerenciamento de conversas
├── campanha_service.py           # ✅ Campanhas de marketing
├── lead_scoring_service.py       # ✅ Lead scoring com 4 dimensões
├── fila_service.py               # ✅ CRUD de filas
├── routing_service.py            # ✅ Roteamento inteligente
├── fila_processor_service.py     # ✅ Processador automático (Maua)
├── websocket_notification_service.py  # ✅ Notificações real-time (Maua)
├── message_queue_processor.py    # ✅ NEW: Agrupamento de mensagens
├── audio_transcription_service.py # ✅ NEW: Transcrição de áudio
├── horario_atendimento_service.py # ✅ NEW: Horário de atendimento
├── session_manager.py            # ✅ NEW: Gerenciador IA ↔ Humano
├── websocket_chat_gateway.py     # ✅ NEW: Gateway WebSocket Chat
└── message_orchestrator_service.py # ✅ NEW: Orquestrador central de mensagens
```

---

### Sprint 1: Configuração e Testes (1 semana)

#### Tarefas

| ID | Tarefa | Responsável | Status |
|----|--------|-------------|--------|
| 1.1 | Obter credenciais WhatsApp Business API (Meta) | DevOps/Admin | ⏳ Pendente |
| 1.2 | Configurar webhook no Meta for Developers | DevOps | ⏳ Pendente |
| 1.3 | Configurar variáveis de ambiente em produção | DevOps | ⏳ Pendente |
| 1.4 | Testar envio de mensagens WhatsApp | Backend | ⏳ Pendente |
| 1.5 | Testar recebimento via webhook | Backend | ⏳ Pendente |
| 1.6 | Validar processamento de fila | Backend | ⏳ Pendente |

#### Variáveis de Ambiente Necessárias

```env
# WhatsApp Business API (Meta)
WHATSAPP_VERIFY_TOKEN=estetiQ_whatsapp_verify_2024
WHATSAPP_ACCESS_TOKEN=<token_do_meta>
WHATSAPP_PHONE_NUMBER_ID=<phone_number_id>
WHATSAPP_BUSINESS_ACCOUNT_ID=<waba_id>

# Transcrição de Áudio
OPENAI_API_KEY=<api_key_openai>  # Para Whisper
# OU
AZURE_SPEECH_KEY=<azure_key>
AZURE_SPEECH_REGION=brazilsouth

# Processamento
FILA_PROCESS_INTERVAL=15
FILA_ABANDONED_TIMEOUT=600
MESSAGE_GROUPING_DELAY=2

# Criptografia
CREDENTIALS_ENCRYPTION_KEY=<chave_aes_256>
```

#### Guia de Configuração WhatsApp Business API

##### Passo 1: Criar App no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um novo App do tipo "Business"
3. Adicione o produto "WhatsApp" ao app
4. Na seção WhatsApp > API Setup, você encontrará:
   - **Phone Number ID**: `WHATSAPP_PHONE_NUMBER_ID`
   - **WhatsApp Business Account ID**: `WHATSAPP_BUSINESS_ACCOUNT_ID`

##### Passo 2: Gerar Access Token

1. Em WhatsApp > API Setup, clique em "Generate"
2. Selecione as permissões:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
3. Copie o token gerado para `WHATSAPP_ACCESS_TOKEN`

> ⚠️ **Importante**: O token temporário expira em 24h. Para produção, gere um **System User Token** com validade permanente.

##### Passo 3: Configurar Webhook

1. Em WhatsApp > Configuration, clique em "Edit"
2. Configure:
   - **Callback URL**: `https://SEU_DOMINIO/webhooks/whatsapp`
   - **Verify Token**: `estetiQ_whatsapp_verify_2024`
3. Selecione os eventos:
   - ✅ `messages` - Receber mensagens
   - ✅ `message_status` - Atualizações de status

##### Passo 4: Testar Configuração

Use os endpoints de teste disponíveis:

```bash
# 1. Verificar configuração
curl -X GET "http://localhost:8080/central-atendimento/whatsapp/config"

# 2. Obter perfil do negócio
curl -X GET "http://localhost:8080/central-atendimento/whatsapp/perfil-negocio" \
  -H "Authorization: Bearer SEU_TOKEN"

# 3. Listar templates aprovados
curl -X GET "http://localhost:8080/central-atendimento/whatsapp/templates" \
  -H "Authorization: Bearer SEU_TOKEN"

# 4. Testar envio (use número de teste da Meta)
curl -X POST "http://localhost:8080/central-atendimento/whatsapp/test-envio?telefone=5511999999999&mensagem=Teste" \
  -H "Authorization: Bearer SEU_TOKEN"
```

##### Passo 5: Número de Teste da Meta

Para testes sem custo, use o número de teste fornecido pela Meta:
- **Número**: +1 555 161 3547
- Configure este número para receber mensagens de teste

##### Variáveis Configuradas (Status Atual)

| Variável | Status | Valor |
|----------|--------|-------|
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ Configurado | `933199419867920` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ✅ Configurado | `1349013970232676` |
| `WHATSAPP_ACCESS_TOKEN` | ⏳ Pendente | `<INSERIR_TOKEN_AQUI>` |
| `WHATSAPP_VERIFY_TOKEN` | ✅ Configurado | `estetiQ_whatsapp_verify_2024` |

---

### Sprint 2: Frontend do Atendente (2 semanas)

#### Telas a Desenvolver

| Tela | Rota | Componentes |
|------|------|-------------|
| Dashboard Atendimento | `/admin/atendimento` | FilaWidget, MetricasWidget, NotificacoesWidget |
| Central de Conversas | `/admin/atendimento/conversas` | ConversaList, ChatWindow, ContactInfo |
| Detalhes da Conversa | `/admin/atendimento/conversas/[id]` | ChatMessages, SendBox, AttachmentPicker |
| Configuração de Filas | `/admin/atendimento/filas` | FilaForm, AtendentesList, HorarioConfig |
| Campanhas | `/admin/atendimento/campanhas` | CampanhaList, CampanhaForm, MetricasChart |
| Relatórios | `/admin/atendimento/relatorios` | DateRangePicker, Charts, ExportButton |

#### Componentes React Necessários

```
src/components/atendimento/
├── chat/
│   ├── ChatWindow.tsx          # Janela principal do chat
│   ├── MessageBubble.tsx       # Bolha de mensagem
│   ├── MessageList.tsx         # Lista de mensagens
│   ├── SendBox.tsx             # Input de envio
│   ├── AttachmentPicker.tsx    # Seletor de anexos
│   └── TypingIndicator.tsx     # Indicador "digitando..."
├── fila/
│   ├── FilaWidget.tsx          # Widget de fila no dashboard
│   ├── FilaList.tsx            # Lista de tickets
│   ├── TicketCard.tsx          # Card do ticket
│   └── QueuePosition.tsx       # Posição na fila
├── contact/
│   ├── ContactInfo.tsx         # Info do contato
│   ├── ContactHistory.tsx      # Histórico de conversas
│   └── LeadScoreCard.tsx       # Card do lead score
└── metrics/
    ├── MetricasWidget.tsx      # Métricas do dashboard
    ├── SLAIndicator.tsx        # Indicador de SLA
    └── PerformanceChart.tsx    # Gráficos de performance
```

#### Hooks SWR Necessários

```typescript
// src/lib/api/hooks/useAtendimento.ts
export function useConversasAtendimento(params: FiltersParams);
export function useConversaDetalhes(id: string);
export function useMensagens(conversaId: string);
export function useFilasAtendimento();
export function useMetricasAtendimento();

// src/hooks/useWebSocketChat.ts
export function useWebSocketChat(conversaId: string);
export function useTypingIndicator(conversaId: string);
export function useNotificacoesAtendimento();
```

---

### Sprint 3: Integração IA/Chatbot (2 semanas)

#### Fluxo de Atendimento com IA

```
┌─────────────────┐
│ Mensagem Recebida│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SessionManager  │
│ (obter sessão)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ Tipo Atendimento│──────│ASSISTENTE_VIRTUAL│
│                 │      └────────┬────────┘
│                 │               │
│                 │               ▼
│                 │      ┌─────────────────┐
│                 │      │ Detectar Intenção│
│                 │      │ de falar humano │
│                 │      └────────┬────────┘
│                 │               │
│                 │      ┌────────┴────────┐
│                 │      │                 │
│                 │      ▼                 ▼
│                 │   [Sim]             [Não]
│                 │      │                 │
│                 │      │                 ▼
│                 │      │      ┌─────────────────┐
│                 │      │      │ Agente LangChain│
│                 │      │      │ (GPT-4/Azure)   │
│                 │      │      └────────┬────────┘
│                 │      │               │
│                 │      │               ▼
│                 │      │      ┌─────────────────┐
│                 │      │      │ Verificar Horário│
│                 │      │      └────────┬────────┘
│                 │      │               │
│                 │      ▼               │
│                 │┌─────────────────┐   │
│                 ││ Transferir para │   │
│                 ││ Atendimento     │   │
│                 ││ Humano          │◄──┘ (se tag [DIRECIONAR])
│                 │└────────┬────────┘
└─────────────────┘         │
                            ▼
                   ┌─────────────────┐
                   │ Fila de Atend.  │
                   │ (FilaProcessor) │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Atribuir Operador│
                   │ (round_robin)   │
                   └─────────────────┘
```

#### Integração com Agentes Existentes

```python
# Exemplo de integração com DoctorQAgent existente
from src.agents.doctorq_agent import DoctorQAgent

async def processar_mensagem_ia(
    sessao: SessaoAtendimento,
    mensagem: str,
) -> str:
    session_manager = get_session_manager()

    # Verificar se deve transferir para humano
    resultado = await session_manager.processar_mensagem(sessao, mensagem)

    if resultado["transferir_humano"]:
        # Transferir para fila
        await transferir_para_fila(sessao)
        return "Você será transferido para um atendente. Aguarde um momento."

    # Processar com IA
    agent = DoctorQAgent(
        empresa_id=sessao.id_empresa,
        context=session_manager.obter_contexto_para_ia(sessao),
    )

    resposta = await agent.process_message(mensagem)

    # Verificar se resposta indica transferência
    if "[DIRECIONAR_ATENDIMENTO_HUMANO]" in resposta:
        horario_service = get_horario_atendimento_service()
        status = await horario_service.verificar_horario_atendimento(sessao.id_empresa)

        if status.em_atendimento:
            await session_manager.transferir_para_humano(
                sessao,
                MotivoTransferencia.INTENCAO_DETECTADA
            )
            resposta = resposta.replace("[DIRECIONAR_ATENDIMENTO_HUMANO]", "")
            resposta += "\n\nVocê será atendido por um de nossos especialistas."
        else:
            resposta = resposta.replace("[DIRECIONAR_ATENDIMENTO_HUMANO]", "")
            resposta += f"\n\n{status.mensagem}"

    return resposta
```

---

### Sprint 4: Integrações Adicionais (1 semana)

#### Instagram Direct

```python
# Webhook Instagram em webhook_route.py
@router.post("/webhooks/instagram/")
async def webhook_instagram(request: Request):
    payload = await request.json()

    processor = get_message_queue_processor()
    await processor.enqueue_webhook_payload(
        source=MessageSource.INSTAGRAM,
        payload=payload,
        empresa_id=empresa_id,
        canal_id=canal_id,
    )

    return {"status": "ok"}
```

#### Facebook Messenger

```python
# Similar ao Instagram, usando MessageSource.FACEBOOK
```

#### Transcrição de Áudio

```python
# Integração com MessageQueueProcessor
async def handler_whatsapp(
    sender_id: str,
    combined_text: str,
    messages: List[QueuedMessage],
    media_messages: List[QueuedMessage],
    **kwargs
):
    transcription_service = get_audio_transcription_service()

    for media in media_messages:
        if media.message_type == "audio":
            # Transcrever áudio
            texto = await transcription_service.transcribe_whatsapp_audio(
                media_id=media.media_id,
                phone_number_id=media.metadata["phone_number_id"],
                access_token=access_token,
            )

            if texto:
                combined_text += f" {texto}"

    # Processar mensagem combinada
    await processar_mensagem(sender_id, combined_text, **kwargs)
```

---

### Sprint 5: Dashboard e Relatórios (1 semana)

#### Métricas do Dashboard

```typescript
interface MetricasAtendimento {
  // Tempo Real
  aguardandoNaFila: number;
  emAtendimento: number;
  atendentesOnline: number;

  // Hoje
  atendimentosHoje: number;
  tempoMedioEspera: number;  // segundos
  tempoMedioAtendimento: number;
  taxaResolucaoPrimeiroContato: number;

  // SLA
  slaRespondido: number;  // %
  slaResolvido: number;   // %

  // Por Canal
  porCanal: {
    whatsapp: number;
    instagram: number;
    webchat: number;
  };

  // Por Período
  volumePorHora: { hora: number; quantidade: number }[];
}
```

#### Endpoints de Analytics

```
GET /central-atendimento/analytics/metricas/
GET /central-atendimento/analytics/metricas/tempo-real/
GET /central-atendimento/analytics/relatorio/diario/
GET /central-atendimento/analytics/relatorio/semanal/
GET /central-atendimento/analytics/atendente/{id}/performance/
GET /central-atendimento/analytics/fila/{id}/metricas/
```

---

### Cronograma Resumido

```
┌───────────────────────────────────────────────────────────────────┐
│                        CRONOGRAMA DE IMPLANTAÇÃO                  │
├───────────────────────────────────────────────────────────────────┤
│ Semana 1    │ Sprint 1: Configuração e Testes WhatsApp            │
│ Semana 2-3  │ Sprint 2: Frontend do Atendente (parte 1)           │
│ Semana 4-5  │ Sprint 2: Frontend do Atendente (parte 2)           │
│ Semana 6-7  │ Sprint 3: Integração IA/Chatbot                     │
│ Semana 8    │ Sprint 4: Integrações Adicionais (IG, FB)           │
│ Semana 9    │ Sprint 5: Dashboard e Relatórios                    │
│ Semana 10   │ Testes E2E e Ajustes Finais                         │
└───────────────────────────────────────────────────────────────────┘
```

---

### Checklist de Go-Live

#### Pré-Requisitos

- [ ] Credenciais WhatsApp Business API configuradas
- [ ] Webhook registrado no Meta for Developers
- [ ] HTTPS configurado para webhooks
- [ ] Redis disponível para cache (opcional mas recomendado)
- [ ] OpenAI API Key para transcrição (ou Azure Speech)
- [ ] Frontend de atendente deployado

#### Validações

- [ ] Teste de envio de mensagem WhatsApp
- [ ] Teste de recebimento de mensagem (webhook)
- [ ] Teste de transcrição de áudio
- [ ] Teste de WebSocket (conexão e mensagens)
- [ ] Teste de fila de atendimento (distribuição round_robin)
- [ ] Teste de horário de atendimento
- [ ] Teste de transferência IA → Humano
- [ ] Teste de lead scoring
- [ ] Teste de campanhas

#### Monitoramento

- [ ] Logs estruturados configurados
- [ ] Métricas Prometheus/Grafana
- [ ] Alertas para falhas de webhook
- [ ] Dashboard de monitoring

---

### Estimativa de Recursos

| Recurso | Quantidade | Período |
|---------|------------|---------|
| Desenvolvedores Backend | 1-2 | 10 semanas |
| Desenvolvedores Frontend | 1-2 | 6 semanas |
| DevOps | 1 | 2 semanas |
| QA | 1 | 3 semanas |

### Custos Operacionais Estimados

| Item | Custo Mensal |
|------|--------------|
| WhatsApp Business API (Meta) | ~R$ 0,15-0,50/conversa |
| OpenAI Whisper (transcrição) | ~$0,006/minuto |
| Azure Speech (alternativa) | ~$1/hora de áudio |
| Infraestrutura (servidor) | R$ 200-500 |
| **Total Estimado** | **R$ 300-800/mês** |

---

### Próximos Passos Imediatos

1. **Obter credenciais WhatsApp Business API**
   - Criar conta Meta for Developers
   - Criar App Business
   - Configurar webhook

2. **Configurar ambiente de staging**
   - Deploy dos novos services
   - Testar integração

3. **Desenvolver frontend do atendente**
   - Criar componentes de chat
   - Integrar WebSocket

4. **Documentar APIs para frontend**
   - Swagger/OpenAPI atualizado
   - Exemplos de uso
