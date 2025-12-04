# ANÁLISE DE INTEGRAÇÃO: DoctorQ + Rocket.Chat
## Embedding Rocket.Chat para Automação Omnichannel

**Data**: 16 de Novembro de 2025
**Projeto**: DoctorQ - Plataforma SaaS para Estética
**Versão**: 1.0
**Objetivo**: Avaliar viabilidade de integrar Rocket.Chat para alcançar automação nível BotConversa/ProspectAI

---

## SUMÁRIO EXECUTIVO

Este documento analisa a viabilidade técnica, dificuldade e custo-benefício de **integrar/embeber o Rocket.Chat** no DoctorQ para aproveitar suas integrações omnichannel prontas (WhatsApp, Instagram, Facebook, Messenger) em vez de implementar tudo nativamente.

### Conclusão Rápida

**⚠️ OPÇÃO INTERMEDIÁRIA**: Rocket.Chat reduz esforço de integrações multi-canal, mas adiciona complexidade de sincronização e dependência de sistema externo.

**Comparação Rápida**:
- ✅ **Integração Rocket.Chat**: 60-40% mais rápido para multi-canal
- ✅ **Implementação Nativa**: Maior controle, melhor integração com IA do DoctorQ
- ❌ **Integração BotConversa/CLINT**: ROI negativo (conforme análise anterior)

**💰 INVESTIMENTO ESTIMADO**:
- Rocket.Chat (self-hosted): R$ 28k-38k (280-380h)
- Implementação Nativa: R$ 34k-49k (340-490h)
- **Economia**: 15-25% de esforço, mas com trade-offs

---

## 1. VISÃO GERAL DO ROCKET.CHAT

### 1.1 O que é Rocket.Chat?

**Rocket.Chat** é uma plataforma de comunicação **open-source** que oferece:

- ✅ Chat em tempo real (similar ao Slack/Teams)
- ✅ Omnichannel (WhatsApp, Instagram, Facebook, Messenger, Email, SMS)
- ✅ Self-hosted (controle total dos dados - LGPD compliant)
- ✅ API REST robusta e bem documentada
- ✅ Webhooks bidirecionais
- ✅ Iframe embedding para integração em apps
- ✅ Framework de apps/bots

### 1.2 Casos de Uso Típicos

- **Customer Service**: Centralizar atendimento de múltiplos canais
- **Team Collaboration**: Comunicação interna de equipes
- **Omnichannel Hub**: Unificar WhatsApp, Instagram, Facebook, etc.

### 1.3 Licenciamento e Custos

| Opção | Custo | Descrição |
|-------|-------|-----------|
| **Community (Self-Hosted)** | R$ 0 (infraestrutura) | Open-source, autogerenciado |
| **Enterprise** | US$ 7-35/usuário/mês | Suporte oficial, recursos avançados |
| **Marketplace Apps** | US$ 0-39/mês | WhatsApp 360Dialog: US$ 39/mês |

**Para DoctorQ**: Recomendado **Community Self-Hosted** (R$ 0 licença + infraestrutura)

---

## 2. ARQUITETURA DE INTEGRAÇÃO

### 2.1 Modelo de Integração Proposto

```
┌─────────────────────────────────────────────────────────────────┐
│                          DOCTORQ WEB                            │
│                  (Next.js 15 + React 19)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐          ┌────────────────────┐          │
│  │  DoctorQ Pages   │          │ Rocket.Chat        │          │
│  │  (Prontuários,   │◄────────►│ Embedded Widget    │          │
│  │  Agendamentos,   │   API    │ (Iframe/SDK)       │          │
│  │  Marketplace)    │          │                    │          │
│  └──────────────────┘          └────────────────────┘          │
│                                         ▲                       │
└─────────────────────────────────────────┼───────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │     INTEGRATION LAYER (Middleware)        │
                    │                                           │
                    │  ┌─────────────────────────────────────┐ │
                    │  │   Webhook Sync Service (FastAPI)    │ │
                    │  │                                     │ │
                    │  │  • Sincronização bidirecional      │ │
                    │  │  • Mapeamento de usuários          │ │
                    │  │  • Enriquecimento com IA (GPT-4)   │ │
                    │  │  • Lead scoring                    │ │
                    │  └─────────────────────────────────────┘ │
                    │                                           │
                    └───────────┬───────────────────┬───────────┘
                                │                   │
        ┌───────────────────────┼───────────────────┼─────────────┐
        │                       ▼                   ▼             │
        │              DOCTORQ BACKEND      ROCKET.CHAT SERVER    │
        │              (FastAPI + Python)   (Node.js + MongoDB)   │
        ├──────────────────────────────────────────────────────────┤
        │                                                          │
        │  ┌──────────────────┐          ┌────────────────────┐   │
        │  │ PostgreSQL 16    │          │ MongoDB 6.x        │   │
        │  │ (DoctorQ Data)   │          │ (Rocket.Chat Data) │   │
        │  │                  │          │                    │   │
        │  │ • Pacientes      │          │ • Conversas        │   │
        │  │ • Agendamentos   │          │ • Mensagens        │   │
        │  │ • Prontuários    │          │ • Usuários RC      │   │
        │  │ • IA/RAG         │          │ • Channels         │   │
        │  └──────────────────┘          └────────────────────┘   │
        │                                                          │
        └──────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │   OMNICHANNEL INTEGRATIONS  │
                    ├─────────────────────────────┤
                    │                             │
                    │  ✅ WhatsApp (Cloud/360)   │
                    │  ✅ Instagram Direct        │
                    │  ✅ Facebook Messenger      │
                    │  ✅ Email                   │
                    │  ✅ SMS (Twilio)            │
                    │  ✅ Telegram                │
                    │                             │
                    └─────────────────────────────┘
```

### 2.2 Componentes da Arquitetura

#### 2.2.1 Rocket.Chat Server (Self-Hosted)

**Responsabilidades**:
- Gerenciar conversas multi-canal
- Integrar com WhatsApp, Instagram, Facebook
- Processar mensagens em tempo real
- Armazenar histórico de conversas

**Infraestrutura**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  rocketchat:
    image: rocket.chat:latest
    container_name: rocketchat
    restart: always
    environment:
      MONGO_URL: mongodb://mongo:27017/rocketchat
      MONGO_OPLOG_URL: mongodb://mongo:27017/local
      ROOT_URL: https://chat.doctorq.app
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - mongo

  mongo:
    image: mongo:6.0
    container_name: mongodb
    restart: always
    volumes:
      - ./data/db:/data/db
    command: mongod --oplogSize 128 --replSet rs0
```

**Recursos Necessários**:
- CPU: 2-4 cores
- RAM: 4-8 GB
- Storage: 50-100 GB SSD
- Estimativa AWS: ~R$ 400-800/mês (EC2 t3.medium)

#### 2.2.2 Webhook Sync Service (Middleware)

**Arquivo**: `estetiQ-api/src/services/rocketchat_sync_service.py`

```python
# estetiQ-api/src/services/rocketchat_sync_service.py

import asyncio
import httpx
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RocketChatSyncService:
    """
    Serviço de sincronização bidirecional entre DoctorQ e Rocket.Chat
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.rc_base_url = "https://chat.doctorq.app"
        self.rc_user_id = os.getenv("ROCKETCHAT_USER_ID")
        self.rc_auth_token = os.getenv("ROCKETCHAT_AUTH_TOKEN")

    # ============================================================================
    # SINCRONIZAÇÃO: ROCKET.CHAT → DOCTORQ
    # ============================================================================

    async def process_incoming_message(self, webhook_payload: Dict[str, Any]):
        """
        Processa mensagem recebida do Rocket.Chat via webhook

        Webhook payload:
        {
          "message_id": "uuid",
          "user": {"id": "rc_user_id", "name": "João Silva"},
          "channel": "whatsapp_channel_id",
          "text": "Gostaria de agendar uma consulta",
          "timestamp": "2025-11-16T10:30:00Z",
          "source": "whatsapp"
        }
        """
        try:
            # 1. Mapear usuário Rocket.Chat → DoctorQ
            user_doctorq = await self._map_rocketchat_user_to_doctorq(
                rc_user_id=webhook_payload["user"]["id"],
                name=webhook_payload["user"]["name"],
                source=webhook_payload["source"]
            )

            # 2. Salvar mensagem no banco do DoctorQ
            mensagem = await self._save_message_to_doctorq(
                user_id=user_doctorq.id_user,
                conteudo=webhook_payload["text"],
                canal=webhook_payload["source"],
                rc_message_id=webhook_payload["message_id"]
            )

            # 3. Processar com IA se necessário
            if self._should_process_with_ai(webhook_payload["text"]):
                await self._process_with_doctorq_ai(
                    mensagem_id=mensagem.id_mensagem,
                    user_id=user_doctorq.id_user,
                    texto=webhook_payload["text"]
                )

            # 4. Atualizar lead scoring
            await self._update_lead_score(
                user_id=user_doctorq.id_user,
                message=webhook_payload["text"]
            )

            logger.info(f"Mensagem processada: {webhook_payload['message_id']}")

        except Exception as e:
            logger.error(f"Erro ao processar mensagem RC: {e}")
            raise

    async def _map_rocketchat_user_to_doctorq(
        self,
        rc_user_id: str,
        name: str,
        source: str
    ) -> User:
        """
        Mapeia usuário Rocket.Chat para DoctorQ
        Cria se não existir
        """
        # Verificar se já existe mapeamento
        mapping = await self.db.execute(
            select(RocketChatUserMapping).where(
                RocketChatUserMapping.rc_user_id == rc_user_id
            )
        )
        mapping = mapping.scalar_one_or_none()

        if mapping:
            # Usuário já mapeado
            user = await self.db.get(User, mapping.id_user)
            return user

        # Criar novo usuário no DoctorQ
        user = User(
            nm_completo=name,
            ds_origem=f"rocketchat_{source}",
            st_tipo_usuario="paciente"
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Criar mapeamento
        mapping = RocketChatUserMapping(
            rc_user_id=rc_user_id,
            id_user=user.id_user
        )
        self.db.add(mapping)
        await self.db.commit()

        logger.info(f"Novo usuário criado no DoctorQ: {user.id_user}")
        return user

    async def _process_with_doctorq_ai(
        self,
        mensagem_id: UUID,
        user_id: UUID,
        texto: str
    ):
        """
        Processa mensagem com IA do DoctorQ (GPT-4 + RAG)
        """
        # Usar LangChain service existente do DoctorQ
        langchain_service = get_langchain_service()

        # Classificar intenção
        intencao = await self._classificar_intencao_com_ia(texto)

        if intencao == "agendamento":
            # Iniciar fluxo de agendamento automático
            await self._iniciar_fluxo_agendamento(user_id, texto)
        elif intencao == "informacao_procedimento":
            # Buscar informações de procedimentos (RAG)
            resposta = await self._buscar_info_procedimentos(texto)
            await self._enviar_resposta_rocketchat(user_id, resposta)
        elif intencao == "qualificacao":
            # Fazer perguntas de qualificação
            await self._iniciar_qualificacao_lead(user_id)

    # ============================================================================
    # SINCRONIZAÇÃO: DOCTORQ → ROCKET.CHAT
    # ============================================================================

    async def send_message_to_rocketchat(
        self,
        user_id: UUID,
        mensagem: str,
        canal: str = "whatsapp"
    ):
        """
        Envia mensagem do DoctorQ para Rocket.Chat
        (para que seja enviada via WhatsApp/Instagram/etc)
        """
        # 1. Obter mapeamento de usuário
        mapping = await self.db.execute(
            select(RocketChatUserMapping).where(
                RocketChatUserMapping.id_user == user_id
            )
        )
        mapping = mapping.scalar_one_or_none()

        if not mapping:
            raise ValueError(f"Usuário {user_id} não mapeado no Rocket.Chat")

        # 2. Enviar via API do Rocket.Chat
        async with httpx.AsyncClient() as client:
            headers = {
                "X-Auth-Token": self.rc_auth_token,
                "X-User-Id": self.rc_user_id
            }

            payload = {
                "channel": f"#{canal}_{mapping.rc_user_id}",
                "text": mensagem
            }

            response = await client.post(
                f"{self.rc_base_url}/api/v1/chat.postMessage",
                json=payload,
                headers=headers
            )

            if response.status_code != 200:
                raise Exception(f"Erro ao enviar mensagem RC: {response.text}")

            logger.info(f"Mensagem enviada para RC: {user_id}")

    async def create_rocketchat_user_if_needed(
        self,
        paciente_id: UUID,
        telefone: str,
        nome: str
    ):
        """
        Cria usuário no Rocket.Chat quando paciente faz cadastro no DoctorQ
        """
        async with httpx.AsyncClient() as client:
            headers = {
                "X-Auth-Token": self.rc_auth_token,
                "X-User-Id": self.rc_user_id
            }

            # Verificar se já existe
            response = await client.get(
                f"{self.rc_base_url}/api/v1/users.info",
                params={"username": telefone},
                headers=headers
            )

            if response.status_code == 200:
                # Usuário já existe
                rc_user = response.json()["user"]
            else:
                # Criar usuário
                payload = {
                    "username": telefone,
                    "name": nome,
                    "email": f"{telefone}@temp.doctorq.app",
                    "password": self._generate_random_password()
                }

                response = await client.post(
                    f"{self.rc_base_url}/api/v1/users.create",
                    json=payload,
                    headers=headers
                )

                if response.status_code != 200:
                    raise Exception(f"Erro ao criar usuário RC: {response.text}")

                rc_user = response.json()["user"]

            # Criar mapeamento
            mapping = RocketChatUserMapping(
                rc_user_id=rc_user["_id"],
                id_user=paciente_id
            )
            self.db.add(mapping)
            await self.db.commit()

            logger.info(f"Usuário RC criado/mapeado: {rc_user['_id']}")

    # ============================================================================
    # HELPER METHODS
    # ============================================================================

    def _should_process_with_ai(self, texto: str) -> bool:
        """Determina se mensagem deve ser processada com IA"""
        keywords_ia = [
            "agendar", "horário", "disponibilidade", "procedimento",
            "preço", "valor", "quanto custa", "informação"
        ]
        return any(keyword in texto.lower() for keyword in keywords_ia)

    async def _classificar_intencao_com_ia(self, texto: str) -> str:
        """Usa GPT-4 para classificar intenção da mensagem"""
        langchain_service = get_langchain_service()

        prompt = f"""
        Classifique a intenção da seguinte mensagem de um paciente:

        "{texto}"

        Intenções possíveis:
        - agendamento: deseja agendar procedimento
        - informacao_procedimento: quer saber sobre procedimentos
        - preco: pergunta sobre valores
        - qualificacao: está interessado mas precisa mais info
        - outro: outras intenções

        Retorne APENAS a categoria.
        """

        resposta = await langchain_service.run_process_simple(
            user_message=prompt,
            user_id="system"
        )

        return resposta.strip().lower()

    async def _iniciar_fluxo_agendamento(self, user_id: UUID, texto: str):
        """Inicia fluxo de agendamento automático"""
        # Usar AgendamentoAutomaticoService (do documento anterior)
        agendamento_service = AgendamentoAutomaticoService(self.db)
        await agendamento_service.processar_intencao_agendamento(
            user_id=user_id,
            mensagem_usuario=texto
        )
```

**Nova Tabela para Mapeamento**:
```sql
-- Tabela para mapear usuários entre RC e DoctorQ
CREATE TABLE tb_rocketchat_user_mapping (
    id_mapping UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rc_user_id VARCHAR(255) NOT NULL UNIQUE, -- ID do usuário no Rocket.Chat
    id_user UUID REFERENCES tb_users(id_user), -- ID do usuário no DoctorQ
    ds_canal VARCHAR(50), -- whatsapp, instagram, facebook
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_ultima_sync TIMESTAMP
);

CREATE INDEX idx_rc_user_mapping ON tb_rocketchat_user_mapping(rc_user_id);
CREATE INDEX idx_doctorq_user_mapping ON tb_rocketchat_user_mapping(id_user);
```

#### 2.2.3 Frontend Integration

**Embedding Widget no Frontend**:
```typescript
// estetiQ-web/src/components/RocketChatWidget.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface RocketChatWidgetProps {
  pacienteId?: string;
  minimized?: boolean;
}

export function RocketChatWidget({
  pacienteId,
  minimized = true
}: RocketChatWidgetProps) {
  const { data: session } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Carregar SDK do Rocket.Chat
    const script = document.createElement('script');
    script.src = 'https://chat.doctorq.app/livechat/rocketchat-livechat.min.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
      initializeRocketChat();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeRocketChat = () => {
    if (typeof window !== 'undefined' && (window as any).RocketChat) {
      (window as any).RocketChat(function(this: any) {
        this.setCustomField('paciente_id', pacienteId);
        this.setCustomField('origem', 'doctorq_web');

        if (session?.user) {
          this.setGuestName(session.user.name);
          this.setGuestEmail(session.user.email);
        }

        // Configurar callbacks
        this.onChatStarted(() => {
          console.log('Chat iniciado');
          trackEvent('chat_started');
        });

        this.onChatEnded(() => {
          console.log('Chat finalizado');
          trackEvent('chat_ended');
        });
      });
    }
  };

  return (
    <div className="rocket-chat-widget">
      {/* Widget carrega automaticamente */}
    </div>
  );
}
```

**Uso nas Páginas**:
```typescript
// estetiQ-web/src/app/paciente/dashboard/page.tsx

import { RocketChatWidget } from '@/components/RocketChatWidget';

export default function PacienteDashboard() {
  return (
    <div>
      <h1>Dashboard do Paciente</h1>

      {/* Resto do conteúdo */}

      {/* Widget do Rocket.Chat flutuante */}
      <RocketChatWidget pacienteId={session.user.id} minimized={true} />
    </div>
  );
}
```

---

## 3. ANÁLISE DE DIFICULDADE

### 3.1 Complexidade Técnica por Componente

| Componente | Dificuldade | Esforço (h) | Principais Desafios |
|------------|-------------|-------------|---------------------|
| **Deploy Rocket.Chat** | 🟡 Média | 10-15h | Docker, MongoDB replica set, SSL |
| **Configurar Integrações** | 🟡 Média | 20-30h | WhatsApp 360Dialog, Instagram API, Facebook |
| **Webhook Sync Service** | 🔴 Alta | 60-80h | Sincronização bidirecional, mapeamento usuários |
| **Frontend Embedding** | 🟢 Baixa | 15-20h | Iframe/SDK, customização visual |
| **Mapeamento Usuários** | 🟡 Média | 20-30h | Deduplicação, linking accounts |
| **IA Integration** | 🔴 Alta | 40-60h | Conectar GPT-4 do DoctorQ com mensagens RC |
| **Lead Scoring** | 🟡 Média | 20-30h | Análise de mensagens cross-platform |
| **Testing E2E** | 🟡 Média | 30-40h | Testes de fluxos completos |
| **Monitoring & Logs** | 🟢 Baixa | 10-15h | Logs centralizados, alertas |
| **Documentação** | 🟢 Baixa | 15-20h | Docs técnicas, guias de uso |

**TOTAL**: 240-340h (6-8 semanas)

### 3.2 Riscos e Desafios

#### 🔴 ALTA COMPLEXIDADE

1. **Sincronização Bidirecional**
   - Manter consistência entre dois bancos de dados (PostgreSQL + MongoDB)
   - Duplicação de dados (conversas em ambos os sistemas)
   - Race conditions em atualizações simultâneas

2. **Latência Adicional**
   - Mensagem: Cliente → Rocket.Chat → Webhook → DoctorQ → IA → Rocket.Chat → Cliente
   - Cada hop adiciona 100-500ms de latência

3. **Mapeamento de Usuários Complexo**
   - Um usuário pode conversar por WhatsApp, Instagram, Facebook
   - Precisa identificar que é a mesma pessoa
   - Deduplica ção não trivial

#### 🟡 MÉDIA COMPLEXIDADE

4. **Integração com IA do DoctorQ**
   - Rocket.Chat não tem acesso direto aos agentes GPT-4
   - Precisa fazer chamada externa para DoctorQ
   - RAG do DoctorQ não acessível diretamente

5. **Configuração de Integrações**
   - Cada canal (WhatsApp, Instagram, Facebook) tem setup diferente
   - WhatsApp requer 360Dialog (US$ 39/mês) ou Meta Cloud API
   - Instagram/Facebook requerem aprovação de apps

6. **Customização de UI**
   - Widget do Rocket.Chat tem visual próprio
   - Precisa customizar para match com design do DoctorQ
   - Limitações de branding no iframe

#### 🟢 BAIXA COMPLEXIDADE

7. **Deploy e Infraestrutura**
   - Docker Compose bem documentado
   - Processo de deploy estável
   - Escalabilidade horizontal possível

---

## 4. COMPARAÇÃO: ROCKET.CHAT vs IMPLEMENTAÇÃO NATIVA

### 4.1 Matriz Comparativa Completa

| Critério | Rocket.Chat Embedding | Implementação Nativa | Vencedor |
|----------|----------------------|---------------------|----------|
| **Tempo de Implementação** | 240-340h (6-8 sem) | 340-490h (8-12 sem) | 🟢 Rocket.Chat |
| **Custo de Desenvolvimento** | R$ 24k-34k | R$ 34k-49k | 🟢 Rocket.Chat |
| **Custo Operacional/mês** | R$ 400-800 (infra) + R$ 39 (WhatsApp) | R$ 200-500 (APIs) | 🟢 Nativo |
| **Integrações Multi-Canal** | ✅ Prontas (WhatsApp, Instagram, Facebook) | ⚠️ Precisa implementar cada uma | 🟢 Rocket.Chat |
| **Controle sobre IA** | ⚠️ Integração externa necessária | ✅ Total (GPT-4 + RAG nativo) | 🟢 Nativo |
| **Latência** | ⚠️ Maior (múltiplos hops) | ✅ Menor (direto) | 🟢 Nativo |
| **Complexidade de Manutenção** | 🔴 Alta (2 sistemas) | 🟡 Média (1 sistema) | 🟢 Nativo |
| **LGPD/Compliance** | ✅ Self-hosted (OK) | ✅ Total controle | 🟡 Empate |
| **Escalabilidade** | 🟡 Limitada por RC | ✅ Ilimitada | 🟢 Nativo |
| **Customização** | ⚠️ Limitada (iframe) | ✅ Total | 🟢 Nativo |
| **Editor Visual** | ❌ Não tem | ❌ Precisa implementar | 🟡 Empate |
| **Prospecção Proativa** | ⚠️ Precisa implementar | ⚠️ Precisa implementar | 🟡 Empate |
| **Learning Curve** | 🟡 Média (RC + DoctorQ) | 🟢 Baixa (só DoctorQ) | 🟢 Nativo |
| **Vendor Lock-in** | ⚠️ Parcial (RC open-source) | ✅ Nenhum | 🟢 Nativo |
| **Time to Market** | 🟢 Mais rápido (6-8 sem) | 🟡 Mais lento (8-12 sem) | 🟢 Rocket.Chat |

**Resultado**:
- **Rocket.Chat vence**: 5 critérios (tempo, custo dev, multi-canal, time-to-market)
- **Nativo vence**: 9 critérios (controle IA, latência, manutenção, escalabilidade, customização)
- **Empate**: 3 critérios

### 4.2 Análise de Cenários

#### Cenário 1: Prioridade em Time-to-Market (Lançamento Rápido)

**Recomendação**: ✅ **Rocket.Chat**

**Razão**:
- 6-8 semanas vs 8-12 semanas
- Integrações multi-canal prontas
- Menos código para escrever

**Trade-off Aceitável**:
- Maior complexidade de manutenção
- Menor controle sobre IA

#### Cenário 2: Prioridade em Qualidade da IA (Diferencial Competitivo)

**Recomendação**: ✅ **Implementação Nativa**

**Razão**:
- IA do DoctorQ (GPT-4 + RAG) é superior
- Integração direta sem latência
- RAG com base de conhecimento específica de estética

**Trade-off Aceitável**:
- 4 semanas a mais de desenvolvimento
- Precisa implementar cada integração

#### Cenário 3: Orçamento Limitado

**Recomendação**: ⚠️ **Depende do Horizonte**

**Curto Prazo (6 meses)**: Rocket.Chat (R$ 24k-34k dev)
**Longo Prazo (12+ meses)**: Nativo (R$ 34k-49k dev, mas menor custo operacional)

**Análise Financeira 12 meses**:
- **Rocket.Chat**: R$ 34k (dev) + R$ 5k (infra/mês * 12) = **R$ 94k**
- **Nativo**: R$ 49k (dev) + R$ 3k (APIs/mês * 12) = **R$ 85k**

Nativo é **R$ 9k mais barato** em 12 meses.

#### Cenário 4: Equipe Pequena (1-2 devs)

**Recomendação**: ✅ **Rocket.Chat**

**Razão**:
- Menos código para manter
- Integrações prontas
- Foco em features de negócio

---

## 5. PLANO DE EXECUÇÃO - INTEGRAÇÃO ROCKET.CHAT

### 5.1 Fase 1: Setup e Infraestrutura (2 semanas)

#### Sprint 1: Deploy Rocket.Chat (1 semana)
**Esforço**: 20-30h

**Tarefas**:
- [ ] Provisionar servidor (AWS EC2 t3.medium ou similar)
- [ ] Configurar Docker + Docker Compose
- [ ] Deploy MongoDB replica set
- [ ] Deploy Rocket.Chat container
- [ ] Configurar SSL (Let's Encrypt)
- [ ] Configurar backup automático MongoDB
- [ ] Testar acesso e performance

**Entregável**: Rocket.Chat rodando em `https://chat.doctorq.app`

**Arquivos**:
```
infra/rocket-chat/
├── docker-compose.yml
├── nginx.conf
├── backup-mongo.sh
└── README.md
```

#### Sprint 2: Configurar Integrações Omnichannel (1 semana)
**Esforço**: 20-30h

**Tarefas**:
- [ ] Instalar app WhatsApp 360Dialog (US$ 39/mês)
- [ ] Configurar WhatsApp Business API
- [ ] Configurar Instagram Direct (via Meta Graph API)
- [ ] Configurar Facebook Messenger
- [ ] Configurar Email (SMTP)
- [ ] Testar envio/recebimento em cada canal

**Entregável**: Todos os canais funcionando

**Custos Mensais**:
- WhatsApp 360Dialog: US$ 39 (~R$ 195)
- Infraestrutura AWS: ~R$ 400-600
- **Total**: ~R$ 600-800/mês

### 5.2 Fase 2: Sincronização e Middleware (4 semanas)

#### Sprint 3: Webhook Sync Service - Parte 1 (2 semanas)
**Esforço**: 40-60h

**Tarefas**:
- [ ] Criar tabela `tb_rocketchat_user_mapping`
- [ ] Implementar `RocketChatSyncService`
- [ ] Endpoint webhook: `POST /webhooks/rocketchat`
- [ ] Processar mensagens recebidas (RC → DoctorQ)
- [ ] Mapeamento automático de usuários
- [ ] Logs e monitoramento

**Entregável**: Mensagens do RC chegam no DoctorQ

**Arquivos**:
```
estetiQ-api/src/
├── services/rocketchat_sync_service.py
├── routes/rocketchat_webhook_route.py
├── models/rocketchat_user_mapping.py
└── tests/test_rocketchat_sync.py
```

#### Sprint 4: Webhook Sync Service - Parte 2 (2 semanas)
**Esforço**: 40-60h

**Tarefas**:
- [ ] Envio de mensagens (DoctorQ → RC)
- [ ] Criação automática de usuários RC
- [ ] Sincronização de status (lida, entregue)
- [ ] Tratamento de erros e retries
- [ ] Queue para processamento assíncrono (Celery)
- [ ] Testes E2E completos

**Entregável**: Sincronização bidirecional completa

### 5.3 Fase 3: Integração com IA (3 semanas)

#### Sprint 5: IA Processing Pipeline (2 semanas)
**Esforço**: 40-50h

**Tarefas**:
- [ ] Classificação de intenção com GPT-4
- [ ] Trigger de fluxos de agendamento
- [ ] Busca RAG para informações de procedimentos
- [ ] Respostas automáticas contextuais
- [ ] Fallback para atendimento humano

**Entregável**: IA do DoctorQ processando mensagens do RC

#### Sprint 6: Lead Scoring e Qualificação (1 semana)
**Esforço**: 20-30h

**Tarefas**:
- [ ] Análise de sentimento
- [ ] Cálculo de score baseado em engajamento
- [ ] Classificação (quente/morno/frio)
- [ ] Notificações para equipe de vendas

**Entregável**: Leads sendo qualificados automaticamente

### 5.4 Fase 4: Frontend e UX (2 semanas)

#### Sprint 7: Embedding Widget (1 semana)
**Esforço**: 15-20h

**Tarefas**:
- [ ] Componente `RocketChatWidget.tsx`
- [ ] Integração com sessão do DoctorQ
- [ ] Customização de cores/logo
- [ ] Responsividade mobile
- [ ] Testes de usabilidade

**Entregável**: Widget embarcado em todas as páginas

#### Sprint 8: Dashboard de Conversas (1 semana)
**Esforço**: 20-30h

**Tarefas**:
- [ ] Página de histórico de conversas
- [ ] Filtros por canal (WhatsApp, Instagram, etc)
- [ ] Indicadores de não lidas
- [ ] Exportação de conversas
- [ ] Analytics básico

**Entregável**: Dashboard funcional para profissionais

### 5.5 Fase 5: Testing e Launch (1 semana)

#### Sprint 9: Testing e Otimização (1 semana)
**Esforço**: 30-40h

**Tarefas**:
- [ ] Testes E2E de todos os fluxos
- [ ] Load testing (simular 100 conversas simultâneas)
- [ ] Otimização de performance
- [ ] Ajustes de UX baseados em feedback
- [ ] Documentação final
- [ ] Deploy em produção

**Entregável**: Sistema em produção

---

## 6. ESTIMATIVA COMPLETA DE CUSTOS

### 6.1 Custos de Desenvolvimento

| Fase | Esforço (h) | Custo (R$ 100/h) |
|------|-------------|------------------|
| Fase 1: Setup e Infraestrutura | 40-60h | R$ 4k-6k |
| Fase 2: Sincronização e Middleware | 80-120h | R$ 8k-12k |
| Fase 3: Integração com IA | 60-80h | R$ 6k-8k |
| Fase 4: Frontend e UX | 35-50h | R$ 3,5k-5k |
| Fase 5: Testing e Launch | 30-40h | R$ 3k-4k |
| **TOTAL** | **245-350h** | **R$ 24,5k-35k** |

### 6.2 Custos Operacionais Mensais

| Item | Custo Mensal |
|------|--------------|
| Infraestrutura AWS (EC2 + Storage) | R$ 400-600 |
| WhatsApp 360Dialog | R$ 195 (US$ 39) |
| Backup e Monitoring | R$ 50-100 |
| **TOTAL** | **R$ 645-895/mês** |

**Custo Anual**: R$ 7.740-10.740

### 6.3 Comparação Financeira Total (12 meses)

| Abordagem | Dev | Operacional (12m) | **TOTAL 12m** |
|-----------|-----|-------------------|---------------|
| **Rocket.Chat** | R$ 24,5k-35k | R$ 7,7k-10,7k | **R$ 32,2k-45,7k** |
| **Implementação Nativa** | R$ 34k-49k | R$ 2,4k-6k | **R$ 36,4k-55k** |
| **Diferença** | -R$ 9,5k-14k | +R$ 5,3k-4,7k | **-R$ 4,2k-9,3k** |

**Conclusão**: Rocket.Chat é **R$ 4k-9k mais barato** no primeiro ano.

---

## 7. PONTOS DE ATENÇÃO E RISCOS

### 7.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Latência alta** | Média | Alto | Otimizar webhooks, usar queue |
| **Sincronização falhar** | Média | Crítico | Retry automático, logs detalhados |
| **RC down afeta DoctorQ** | Baixa | Crítico | Fallback para modo degradado |
| **Duplicação de usuários** | Alta | Médio | Algoritmo robusto de dedup |
| **Custo operacional crescer** | Média | Médio | Monitorar uso, planejar escala |

### 7.2 Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Dependência de RC** | Alta | Alto | Manter código portável |
| **RC descontinuar feature** | Baixa | Médio | Open-source, fork possível |
| **Usuários confusos com 2 interfaces** | Média | Médio | UX consistente, treinamento |
| **Equipe precisa conhecer RC** | Alta | Médio | Documentação, treinamento |

### 7.3 Limitações Conhecidas

1. **Editor Visual de Fluxos**: Rocket.Chat NÃO possui
   - Ainda precisaria implementar (80-120h adicionais)
   - Ou viver sem e configurar via código

2. **Prospecção Proativa**: Rocket.Chat NÃO possui nativamente
   - Ainda precisaria implementar (60-80h adicionais)
   - Ou integrar ferramenta externa

3. **IA Limitada**: Rocket.Chat não tem IA nativa robusta
   - Precisa integração externa com GPT-4 do DoctorQ
   - Adiciona latência

4. **Customização de UI**: Limitada no iframe
   - Difícil match 100% com design do DoctorQ
   - Pode parecer "outro sistema"

---

## 8. RECOMENDAÇÕES FINAIS

### 8.1 Quando Escolher Rocket.Chat

✅ **RECOMENDADO SE**:

1. **Time-to-Market é crítico** (precisa lançar em < 2 meses)
2. **Equipe pequena** (1-2 desenvolvedores)
3. **Multi-canal é prioridade #1** (WhatsApp + Instagram + Facebook)
4. **Orçamento de desenvolvimento limitado** (< R$ 35k)
5. **IA não é diferencial principal** do produto

### 8.2 Quando Escolher Implementação Nativa

✅ **RECOMENDADO SE**:

1. **IA é diferencial competitivo** (GPT-4 + RAG essenciais)
2. **Controle total necessário** (produto white-label)
3. **Escalabilidade a longo prazo** é prioridade
4. **Equipe tem capacidade** (3+ desenvolvedores)
5. **Orçamento permite** (R$ 40-50k)
6. **UX/UI consistente** é mandatório

### 8.3 Abordagem Híbrida (Melhor dos Dois Mundos)

🎯 **RECOMENDAÇÃO IDEAL**: **Híbrida Phased**

**Fase 1 (0-3 meses)**: Rocket.Chat
- Lançar rápido com multi-canal
- Validar mercado
- Começar a gerar receita

**Fase 2 (3-6 meses)**: Migração Gradual
- Implementar WhatsApp nativo (mais usado)
- Manter Instagram/Facebook no RC temporariamente
- Começar a construir IA própria

**Fase 3 (6-12 meses)**: Nativo Completo
- Migrar todos os canais para nativo
- Descomissionar Rocket.Chat
- Sistema 100% proprietário

**Vantagens**:
- ✅ Time-to-market rápido (Rocket.Chat)
- ✅ Migração sem down-time
- ✅ Validação de mercado antes de investir full
- ✅ Reduz risco

---

## 9. DECISÃO MATRIX

### 9.1 Scorecard de Decisão

| Critério | Peso | Rocket.Chat | Nativo | Híbrido |
|----------|------|-------------|--------|---------|
| **Time-to-Market** | 25% | 9/10 | 5/10 | 8/10 |
| **Custo Total (12m)** | 20% | 8/10 | 7/10 | 7/10 |
| **Qualidade da IA** | 20% | 5/10 | 10/10 | 8/10 |
| **Manutenibilidade** | 15% | 5/10 | 9/10 | 7/10 |
| **Escalabilidade** | 10% | 6/10 | 10/10 | 8/10 |
| **Controle/Ownership** | 10% | 6/10 | 10/10 | 8/10 |
| **TOTAL PONDERADO** | 100% | **7.0** | **7.9** | **7.7** |

**Resultado**:
1. 🥇 **Implementação Nativa**: 7.9/10
2. 🥈 **Abordagem Híbrida**: 7.7/10
3. 🥉 **Rocket.Chat**: 7.0/10

### 9.2 Recomendação Final Baseada em Contexto

#### Se DoctorQ está em:

**Estágio Inicial (0-100 clientes)**:
→ ✅ **Rocket.Chat** ou **Híbrido**
- Validar mercado rápido
- Menor investimento inicial
- Multi-canal rápido

**Crescimento (100-1000 clientes)**:
→ ✅ **Híbrido** (migração em andamento)
- Começa com RC
- Migra gradualmente para nativo
- Minimiza risco

**Maturidade (1000+ clientes)**:
→ ✅ **Nativo** 100%
- Controle total
- IA diferenciada
- Escalabilidade ilimitada

---

## 10. PLANO DE AÇÃO RECOMENDADO

### 10.1 Decisão Imediata (Esta Semana)

**Perguntas para Responder**:

1. ✅ Qual o prazo de lançamento desejado?
   - < 2 meses → Rocket.Chat
   - 2-4 meses → Híbrido
   - 4+ meses → Nativo

2. ✅ IA é diferencial competitivo #1?
   - Sim → Nativo
   - Não → Rocket.Chat ou Híbrido

3. ✅ Orçamento disponível?
   - < R$ 30k → Rocket.Chat
   - R$ 30-40k → Híbrido
   - > R$ 40k → Nativo

4. ✅ Tamanho da equipe?
   - 1-2 devs → Rocket.Chat
   - 3+ devs → Nativo ou Híbrido

### 10.2 Próximos Passos Baseados na Decisão

#### Se escolher **Rocket.Chat**:

**Semana 1-2**: Setup
- [ ] Provisionar servidor
- [ ] Deploy Rocket.Chat
- [ ] Configurar WhatsApp 360Dialog

**Semana 3-4**: Sincronização
- [ ] Implementar webhook sync
- [ ] Mapeamento de usuários
- [ ] Testes básicos

**Semana 5-6**: IA Integration
- [ ] Conectar GPT-4 do DoctorQ
- [ ] Fluxos de agendamento
- [ ] Lead scoring

**Semana 7-8**: Frontend & Launch
- [ ] Embedding widget
- [ ] Dashboard de conversas
- [ ] Launch em produção

#### Se escolher **Nativo**:

Seguir roadmap do documento **ANALISE_MATURIDADE_AUTOMACAO_PROSPECTAI.md**:
- Fase 1: WhatsApp + Listas (4-6 sem)
- Fase 2: Automação IA (6-8 sem)
- Fase 3: Editor Visual (8-10 sem)

#### Se escolher **Híbrido**:

**Fase 1 (Mês 1-3)**: Rocket.Chat
- Implementar conforme plano Rocket.Chat acima
- Lançar e validar mercado

**Fase 2 (Mês 4-6)**: Migração WhatsApp
- Implementar WhatsApp nativo
- Migrar usuários gradualmente
- Manter RC para Instagram/Facebook

**Fase 3 (Mês 7-12)**: Full Native
- Implementar todos os canais nativos
- Descomissionar Rocket.Chat
- Sistema 100% proprietário

---

## 11. ANEXOS

### 11.1 Referências Técnicas

**Rocket.Chat**:
- Documentação Oficial: https://docs.rocket.chat
- API Reference: https://developer.rocket.chat/reference/api
- Omnichannel Guide: https://docs.rocket.chat/docs/omnichannel
- WhatsApp Setup: https://docs.rocket.chat/docs/whatsapp-cloud-app

**Integrações**:
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Instagram Graph API: https://developers.facebook.com/docs/instagram
- Facebook Messenger: https://developers.facebook.com/docs/messenger-platform

### 11.2 Custos Detalhados

**Infraestrutura AWS (Estimativa)**:
```
EC2 t3.medium (2 vCPU, 4GB RAM):    R$ 250/mês
EBS SSD 100GB:                       R$ 50/mês
Backup S3 (500GB):                   R$ 60/mês
Load Balancer:                       R$ 100/mês
CloudWatch Logs:                     R$ 40/mês
TOTAL:                               R$ 500/mês
```

**Alternativa DigitalOcean (mais barato)**:
```
Droplet 4GB RAM:                     R$ 240/mês (US$ 48)
Block Storage 100GB:                 R$ 50/mês (US$ 10)
Backup:                              R$ 50/mês (US$ 10)
TOTAL:                               R$ 340/mês
```

### 11.3 Exemplo de Configuração Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  rocketchat:
    image: registry.rocket.chat/rocketchat/rocket.chat:latest
    container_name: rocketchat
    restart: always
    environment:
      MONGO_URL: "mongodb://mongo:27017/rocketchat?replicaSet=rs0"
      MONGO_OPLOG_URL: "mongodb://mongo:27017/local?replicaSet=rs0"
      ROOT_URL: "https://chat.doctorq.app"
      PORT: 3000
      DEPLOY_METHOD: docker
      # Configurações de performance
      OVERWRITE_SETTING_Show_Setup_Wizard: "completed"
      # Integração com DoctorQ
      DOCTORQ_API_URL: "https://api.doctorq.app"
      DOCTORQ_WEBHOOK_SECRET: "${DOCTORQ_WEBHOOK_SECRET}"
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "3000:3000"
    depends_on:
      - mongo
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rocketchat.rule=Host(`chat.doctorq.app`)"
      - "traefik.http.routers.rocketchat.tls=true"
      - "traefik.http.routers.rocketchat.tls.certresolver=le"

  mongo:
    image: mongo:6.0
    container_name: mongodb
    restart: always
    volumes:
      - ./data/db:/data/db
      - ./data/dump:/dump
    command: >
      mongod
      --oplogSize 128
      --replSet rs0
      --storageEngine wiredTiger
    labels:
      - "traefik.enable=false"

  mongo-init-replica:
    image: mongo:6.0
    command: >
      bash -c "sleep 10 && mongo mongodb://mongo:27017/rocketchat
      --eval 'rs.initiate({_id:\"rs0\",members:[{_id:0,host:\"mongo:27017\"}]})'"
    depends_on:
      - mongo

  # Backup automático
  backup:
    image: mongo:6.0
    container_name: backup
    restart: always
    volumes:
      - ./data/backup:/backup
      - ./scripts:/scripts
    command: >
      bash -c "sleep 60 && /scripts/backup-mongo.sh"
    depends_on:
      - mongo
    environment:
      BACKUP_INTERVAL: "86400" # 24 horas
      MONGO_URL: "mongodb://mongo:27017"
```

### 11.4 Script de Backup

```bash
#!/bin/bash
# backup-mongo.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup"
MONGO_URL="mongodb://mongo:27017"

# Criar backup
mongodump --uri="$MONGO_URL" --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Compactar
cd $BACKUP_DIR
tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"
rm -rf "backup_$TIMESTAMP"

# Enviar para S3 (opcional)
aws s3 cp "backup_$TIMESTAMP.tar.gz" s3://doctorq-backups/rocketchat/

# Limpar backups antigos (manter 30 dias)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup concluído: backup_$TIMESTAMP.tar.gz"
```

---

## 12. CONCLUSÃO FINAL

### 12.1 Resumo das Opções

| Opção | Prós | Contras | Custo 12m |
|-------|------|---------|-----------|
| **Rocket.Chat** | • Rápido (6-8 sem)<br>• Multi-canal pronto<br>• Menor dev | • Maior custo operacional<br>• Menos controle IA<br>• 2 sistemas | R$ 32k-46k |
| **Nativo** | • Total controle<br>• IA superior<br>• Menor custo operacional | • Mais lento (8-12 sem)<br>• Mais código<br>• Cada integração manual | R$ 36k-55k |
| **Híbrido** | • Melhor dos 2 mundos<br>• Migração gradual<br>• Menor risco | • Mais complexo gerenciar<br>• Migração contínua | R$ 40k-60k |

### 12.2 Decisão Recomendada

Com base na análise completa:

🎯 **RECOMENDAÇÃO**: **Abordagem Híbrida Phased**

**Razões**:
1. ✅ **Quick Win**: Lançar em 6-8 semanas com Rocket.Chat
2. ✅ **Validação**: Testar mercado antes de investir full
3. ✅ **Migração Segura**: Transição gradual para nativo
4. ✅ **Menor Risco**: Se RC não funcionar, pivota rápido
5. ✅ **Melhor ROI**: Equilibra tempo, custo e qualidade

**Plano de 12 Meses**:
- **Mês 1-3**: Deploy Rocket.Chat + integrações básicas
- **Mês 4-6**: Implementar WhatsApp nativo (canal principal)
- **Mês 7-9**: Migrar Instagram e Facebook para nativo
- **Mês 10-12**: Descomissionar RC, sistema 100% nativo

**Investimento Total**: ~R$ 40k-50k
**Resultado Final**: Sistema nativo completo com validação de mercado

---

**Documento elaborado por**: Claude (Anthropic)
**Revisão**: Pendente
**Aprovação**: Pendente
**Versão**: 1.0
**Status**: 📋 Draft para Revisão e Decisão
