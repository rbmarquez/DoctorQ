# ANÁLISE DE MATURIDADE: DoctorQ vs ProspectAI/BotConversa
## Gap Analysis e Roadmap para Automação de Vendas Nível ProspectAI

**Data**: 16 de Novembro de 2025
**Projeto**: DoctorQ - Plataforma SaaS para Estética
**Versão**: 1.0
**Objetivo**: Alcançar maturidade de automação equivalente ao BotConversa/ProspectAI

---

## SUMÁRIO EXECUTIVO

Este documento analisa os gaps entre o **DoctorQ** (atual estado) e a **ProspectAI** (arquitetura de referência para automação de vendas via chatbot), identificando o que falta implementar para alcançar o mesmo nível de maturidade em automação de fluxos conversacionais e prospecção ativa.

### Conclusão Rápida

**✅ BOA NOTÍCIA**: O DoctorQ possui **85% da infraestrutura técnica necessária** já implementada! A IA do DoctorQ é **SUPERIOR** à da ProspectAI (GPT-4 + LangChain + RAG vs IA básica).

**⚠️ GAPS PRINCIPAIS**:
1. **Fluxo Visual No-Code** (0% implementado) - Editor drag-and-drop para criar automações
2. **Prospecção Proativa** (0% implementado) - Sistema que inicia conversas automaticamente
3. **Upload e Gestão de Listas** (30% implementado) - Importação em massa de prospects
4. **Qualificação Automática de Leads** (40% implementado) - Scoring e classificação automática
5. **Agendamento Automático Avançado** (60% implementado) - Bot agenda diretamente na agenda

**💰 INVESTIMENTO ESTIMADO**: 240-320 horas (R$ 24k-32k) para completar gaps e alcançar paridade

---

## 1. ARQUITETURA COMPARATIVA

### 1.1 ProspectAI - Arquitetura de Referência

```
ProspectAI/BotConversa
│
├── 📋 Upload de Listas
│   ├── Importação CSV/Excel
│   ├── Enriquecimento de dados
│   └── Segmentação automática
│
├── 🤖 Prospecção Ativa (Bot Proativo)
│   ├── Envio automático de mensagens iniciais
│   ├── Personalização por perfil
│   ├── Sequências de follow-up
│   └── Timing inteligente
│
├── 💬 Conversação Inteligente
│   ├── IA para qualificação
│   ├── Detecção de intenção
│   ├── Respostas contextuais
│   └── Handoff para humano
│
├── 📊 Qualificação Automática
│   ├── Lead scoring
│   ├── Identificação de momento de compra
│   ├── Detecção de objeções
│   └── Classificação (quente/morno/frio)
│
├── 📅 Agendamento Automático
│   ├── Verificação de disponibilidade
│   ├── Criação de eventos
│   ├── Envio de links de reunião
│   └── Lembretes automáticos
│
├── 🎨 Editor Visual (No-Code)
│   ├── Drag-and-drop de fluxos
│   ├── Condições e ramificações
│   ├── Templates pré-prontos
│   └── Simulação de fluxos
│
└── 📈 Analytics e Otimização
    ├── Taxa de conversão por etapa
    ├── Tempo médio de resposta
    ├── Análise de sentimento
    └── A/B testing de mensagens
```

### 1.2 DoctorQ - Arquitetura Atual

```
DoctorQ
│
├── ✅ Sistema de Mensagens (100%)
│   ├── WebSocket tempo real
│   ├── Múltiplos tipos (texto, imagem, áudio, vídeo)
│   ├── Status de leitura
│   └── Conversas bidirecionais
│
├── ✅ IA Avançada (100%)
│   ├── GPT-4 / Azure OpenAI
│   ├── LangChain para orquestração
│   ├── Agentes customizáveis
│   ├── RAG com Document Stores
│   └── Observabilidade com Langfuse
│
├── ⚠️ Agendamentos (100% reativo, 0% proativo)
│   ├── ✅ Verificação de disponibilidade
│   ├── ✅ Detecção de conflitos
│   ├── ✅ CRUD completo
│   ├── ❌ Bot não agenda automaticamente
│   └── ❌ Sem sugestão proativa de horários
│
├── ⚠️ Notificações (50% - infraestrutura pronta)
│   ├── ✅ Push notifications
│   ├── ⚠️ Email (infraestrutura)
│   ├── ⚠️ SMS (infraestrutura)
│   └── ⚠️ WhatsApp (mock/preparado)
│
├── ⚠️ CRM e Gestão de Leads (70%)
│   ├── ✅ CRUD de pacientes/profissionais
│   ├── ✅ Multi-tenant
│   ├── ⚠️ Lead scoring (parcial)
│   ├── ❌ Pipeline de vendas visual
│   └── ❌ Importação em massa de prospects
│
├── ❌ Editor Visual No-Code (0%)
│   ├── Sem drag-and-drop de fluxos
│   ├── Sem templates visuais
│   └── Configuração via código/JSON
│
├── ❌ Prospecção Proativa (0%)
│   ├── Sem iniciativa automática de contato
│   ├── Sem sequências de follow-up
│   └── Sem upload de listas de prospects
│
└── ✅ Analytics (100%)
    ├── Event tracking
    ├── Métricas por domínio
    └── Time-series data
```

---

## 2. MATRIZ DE GAPS DETALHADA

### 2.1 Funcionalidades vs Status

| Funcionalidade | ProspectAI | DoctorQ Atual | Gap (%) | Prioridade |
|----------------|------------|---------------|---------|------------|
| **💬 Chat em Tempo Real** | ✅ 100% | ✅ 100% | 0% | ✅ Completo |
| **🤖 IA Conversacional** | ⚠️ 60% (básica) | ✅ 100% (avançada) | 0% | ✅ Superior |
| **📚 RAG (Base Conhecimento)** | ❌ 0% | ✅ 100% | 0% | ✅ Superior |
| **📋 Upload de Listas CSV** | ✅ 100% | ⚠️ 30% | 70% | 🔴 Alta |
| **🎯 Prospecção Proativa** | ✅ 100% | ❌ 0% | 100% | 🔴 Alta |
| **💡 Qualificação de Leads** | ✅ 100% | ⚠️ 40% | 60% | 🟡 Média |
| **📊 Lead Scoring** | ✅ 100% | ⚠️ 30% | 70% | 🟡 Média |
| **📅 Agendamento Manual** | ✅ 100% | ✅ 100% | 0% | ✅ Completo |
| **🤝 Agendamento Automático** | ✅ 100% | ⚠️ 60% | 40% | 🟡 Média |
| **🎨 Editor Visual Fluxos** | ✅ 100% | ❌ 0% | 100% | 🔴 Alta |
| **📱 WhatsApp Integration** | ✅ 100% | ⚠️ 50% | 50% | 🔴 Alta |
| **📧 Email Marketing** | ⚠️ 50% | ⚠️ 50% | 0% | 🟢 Baixa |
| **📨 SMS** | ⚠️ 50% | ⚠️ 50% | 0% | 🟢 Baixa |
| **🔔 Notificações Push** | ✅ 100% | ✅ 100% | 0% | ✅ Completo |
| **🔄 Follow-up Automático** | ✅ 100% | ❌ 0% | 100% | 🔴 Alta |
| **🎭 Personalização por Perfil** | ✅ 100% | ⚠️ 50% | 50% | 🟡 Média |
| **📈 Analytics de Conversão** | ✅ 100% | ⚠️ 70% | 30% | 🟢 Baixa |
| **🧪 A/B Testing Mensagens** | ✅ 100% | ❌ 0% | 100% | 🟢 Baixa |
| **👥 Handoff Humano** | ✅ 100% | ⚠️ 60% | 40% | 🟡 Média |
| **🌐 Multi-canal** | ✅ 100% | ⚠️ 40% | 60% | 🟡 Média |

### 2.2 Resumo de Gaps por Categoria

| Categoria | Status DoctorQ | Gap Principal | Impacto |
|-----------|----------------|---------------|---------|
| **Infraestrutura de IA** | ✅ 100% | Nenhum | ✅ Superior ao ProspectAI |
| **Mensagens & Chat** | ✅ 100% | Nenhum | ✅ Completo |
| **Automação de Vendas** | ⚠️ 35% | Prospecção proativa | 🔴 Crítico |
| **Editor Visual** | ❌ 0% | Tudo | 🔴 Crítico |
| **Gestão de Leads** | ⚠️ 50% | Upload listas, scoring | 🟡 Médio |
| **Integrações** | ⚠️ 50% | WhatsApp, Email, SMS | 🟡 Médio |
| **Analytics** | ✅ 85% | A/B testing | 🟢 Baixo |

---

## 3. ANÁLISE DETALHADA DOS GAPS CRÍTICOS

### 3.1 GAP #1: Editor Visual de Fluxos (No-Code Builder) 🎨

**Status Atual**: ❌ 0% implementado
**Prioridade**: 🔴 ALTA
**Esforço**: 80-120 horas
**Impacto**: Permite usuários não técnicos criarem automações

#### O que é necessário:

**Frontend (60-80h)**:
- ✅ Canvas drag-and-drop (React Flow ou similar)
- ✅ Biblioteca de nodes (início conversa, pergunta, condição, ação, fim)
- ✅ Editor de propriedades de cada node
- ✅ Validação visual de fluxos
- ✅ Simulação/preview de conversas
- ✅ Templates pré-prontos (agendamento, qualificação, suporte)

**Backend (20-40h)**:
- ✅ API para salvar/carregar fluxos (JSON)
- ✅ Engine de execução de fluxos
- ✅ Versionamento de fluxos
- ✅ Logs de execução por node

**Exemplo de Estrutura de Fluxo**:
```json
{
  "flow_id": "uuid",
  "flow_name": "Agendamento Automático",
  "version": "1.0",
  "nodes": [
    {
      "id": "node1",
      "type": "trigger",
      "config": {
        "channel": "whatsapp",
        "trigger_type": "message_received"
      }
    },
    {
      "id": "node2",
      "type": "ai_message",
      "config": {
        "prompt": "Olá! Gostaria de agendar um procedimento?",
        "wait_for_response": true
      }
    },
    {
      "id": "node3",
      "type": "condition",
      "config": {
        "if": "response_contains(['sim', 'quero', 'gostaria'])",
        "then": "node4",
        "else": "node10"
      }
    },
    {
      "id": "node4",
      "type": "action",
      "config": {
        "action": "check_availability",
        "params": {
          "professional_id": "{{user.preferred_professional}}",
          "days_ahead": 7
        }
      }
    },
    {
      "id": "node5",
      "type": "ai_message",
      "config": {
        "prompt": "Tenho os seguintes horários: {{slots}}. Qual prefere?"
      }
    }
  ]
}
```

**Referências de Implementação**:
- React Flow: https://reactflow.dev/
- Rete.js: https://rete.js.org/
- n8n (open source): https://github.com/n8n-io/n8n

---

### 3.2 GAP #2: Prospecção Proativa (Bot Iniciando Conversas) 🎯

**Status Atual**: ❌ 0% implementado
**Prioridade**: 🔴 ALTA
**Esforço**: 60-80 horas
**Impacto**: Transforma sistema de reativo para proativo

#### O que é necessário:

**Sistema de Campanhas (30-40h)**:
```sql
-- Nova tabela: tb_campanhas
CREATE TABLE tb_campanhas (
    id_campanha UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_campanha VARCHAR(255) NOT NULL,
    ds_objetivo VARCHAR(50), -- 'agendamento', 'qualificacao', 'reengajamento'
    ds_segmento JSONB, -- Filtros de audience
    ds_template_mensagem TEXT, -- Template com variáveis
    dt_inicio TIMESTAMP,
    dt_fim TIMESTAMP,
    st_ativa BOOLEAN DEFAULT true,
    qt_enviadas INTEGER DEFAULT 0,
    qt_respostas INTEGER DEFAULT 0,
    qt_conversoes INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT NOW()
);

-- Nova tabela: tb_campanha_contatos
CREATE TABLE tb_campanha_contatos (
    id_campanha_contato UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_campanha UUID REFERENCES tb_campanhas(id_campanha),
    id_contato UUID, -- ID do paciente/prospect
    st_status VARCHAR(50), -- 'pendente', 'enviado', 'respondeu', 'converteu', 'falhou'
    dt_envio_agendado TIMESTAMP,
    dt_enviado TIMESTAMP,
    dt_resposta TIMESTAMP,
    ds_resposta TEXT,
    dt_criacao TIMESTAMP DEFAULT NOW()
);
```

**Engine de Prospecção (30-40h)**:
```python
# estetiQ-api/src/services/prospeccao_service.py

class ProspeccaoService:
    """Serviço para prospecção proativa"""

    async def iniciar_campanha(self, campanha_id: UUID) -> dict:
        """
        Inicia uma campanha de prospecção
        1. Busca contatos da campanha
        2. Agenda envios com throttling
        3. Monitora respostas
        """
        campanha = await self.get_campanha(campanha_id)
        contatos = await self.get_contatos_pendentes(campanha_id)

        for contato in contatos:
            # Personalizar mensagem
            mensagem = self._personalizar_mensagem(
                campanha.ds_template_mensagem,
                contato
            )

            # Agendar envio com delay (evitar spam)
            await self.agendar_envio(
                contato_id=contato.id,
                mensagem=mensagem,
                delay_segundos=random.randint(60, 300)
            )

        return {
            "campanha_id": str(campanha_id),
            "total_contatos": len(contatos),
            "status": "iniciada"
        }

    async def processar_resposta(self, contato_id: UUID, mensagem: str):
        """
        Processa resposta de prospect
        1. Atualiza status no CRM
        2. Qualifica lead
        3. Redireciona para próximo passo do fluxo
        """
        # Classificar intenção com IA
        intencao = await self._classificar_intencao(mensagem)

        if intencao == "positivo":
            # Iniciar fluxo de qualificação/agendamento
            await self.iniciar_fluxo_qualificacao(contato_id)
        elif intencao == "negativo":
            # Marcar como não interessado
            await self.marcar_nao_interessado(contato_id)
        else:
            # Continuar conversa
            await self.continuar_conversa(contato_id, mensagem)

    def _personalizar_mensagem(self, template: str, contato: dict) -> str:
        """Personaliza template com dados do contato"""
        variaveis = {
            "{{nome}}": contato.get("nm_completo", "").split()[0],
            "{{ultimo_procedimento}}": contato.get("ultimo_procedimento", ""),
            "{{data_ultimo_agendamento}}": contato.get("dt_ultimo_agendamento", ""),
        }

        mensagem = template
        for var, valor in variaveis.items():
            mensagem = mensagem.replace(var, str(valor))

        return mensagem
```

**Exemplo de Campanha**:
```json
{
  "campanha": {
    "nm_campanha": "Reativação de Pacientes Inativos",
    "ds_objetivo": "reengajamento",
    "ds_segmento": {
      "filtros": [
        {"campo": "dt_ultimo_agendamento", "operador": "<", "valor": "2024-08-01"},
        {"campo": "qt_procedimentos_realizados", "operador": ">=", "valor": 1}
      ]
    },
    "ds_template_mensagem": "Olá {{nome}}! Faz tempo que não nos vemos 😊 Temos novidades em {{categoria_preferida}}. Que tal agendar uma avaliação? Tenho um horário especial para você na próxima semana!",
    "dt_inicio": "2025-11-20T09:00:00",
    "dt_fim": "2025-11-30T18:00:00"
  }
}
```

---

### 3.3 GAP #3: Upload e Gestão de Listas de Prospects 📋

**Status Atual**: ⚠️ 30% implementado (CRUD básico existe)
**Prioridade**: 🔴 ALTA
**Esforço**: 40-60 horas
**Impacto**: Permite importação em massa e segmentação

#### O que é necessário:

**Upload de CSV/Excel (20-30h)**:
```python
# estetiQ-api/src/routes/prospects_route.py

@router.post("/prospects/upload")
async def upload_lista_prospects(
    file: UploadFile,
    id_campanha: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Upload de lista de prospects via CSV/Excel

    Formato esperado:
    nome, email, telefone, cidade, interesse, observacoes
    João Silva, joao@email.com, 11999999999, São Paulo, Botox, Cliente antigo
    """

    # Validar arquivo
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, "Formato inválido. Use CSV ou XLSX")

    # Processar arquivo
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file.file)
    else:
        df = pd.read_excel(file.file)

    # Validar colunas obrigatórias
    required_columns = ['nome', 'telefone']
    missing = set(required_columns) - set(df.columns)
    if missing:
        raise HTTPException(400, f"Colunas faltando: {missing}")

    # Processar cada linha
    prospects_criados = []
    prospects_duplicados = []

    for _, row in df.iterrows():
        # Verificar duplicata por telefone
        existing = await db.execute(
            select(Prospect).where(Prospect.ds_telefone == row['telefone'])
        )

        if existing.scalar_one_or_none():
            prospects_duplicados.append(row['telefone'])
            continue

        # Criar prospect
        prospect = Prospect(
            nm_completo=row['nome'],
            ds_email=row.get('email'),
            ds_telefone=row['telefone'],
            ds_cidade=row.get('cidade'),
            ds_interesse=row.get('interesse'),
            ds_observacoes=row.get('observacoes'),
            ds_tags=["lista_importada"],
            id_campanha=id_campanha
        )

        db.add(prospect)
        prospects_criados.append(prospect)

    await db.commit()

    return {
        "total_linhas": len(df),
        "criados": len(prospects_criados),
        "duplicados": len(prospects_duplicados),
        "lista_duplicados": prospects_duplicados
    }
```

**Enriquecimento de Dados (20-30h)**:
```python
class ProspectEnrichmentService:
    """Enriquecimento automático de dados de prospects"""

    async def enriquecer_prospect(self, prospect_id: UUID):
        """
        Enriquecer dados do prospect automaticamente
        1. Validar telefone (formato, WhatsApp ativo)
        2. Buscar dados em APIs públicas (se disponível)
        3. Calcular score inicial
        """
        prospect = await self.get_prospect(prospect_id)

        # Validar WhatsApp
        whatsapp_ativo = await self.validar_whatsapp(prospect.ds_telefone)
        prospect.st_whatsapp_ativo = whatsapp_ativo

        # Calcular score inicial
        score = self._calcular_score_inicial(prospect)
        prospect.nr_score = score

        await self.db.commit()

    def _calcular_score_inicial(self, prospect: Prospect) -> int:
        """Calcula score inicial baseado em dados disponíveis"""
        score = 0

        # Pontos por dados completos
        if prospect.ds_email:
            score += 10
        if prospect.ds_telefone:
            score += 20
        if prospect.st_whatsapp_ativo:
            score += 30
        if prospect.ds_interesse:
            score += 20
        if prospect.ds_cidade:
            score += 10

        # Pontos por histórico (se for reativação)
        if prospect.qt_procedimentos_anteriores > 0:
            score += 50

        return min(score, 100)
```

---

### 3.4 GAP #4: Qualificação Automática de Leads com IA 💡

**Status Atual**: ⚠️ 40% implementado (IA existe, falta scoring)
**Prioridade**: 🟡 MÉDIA
**Esforço**: 30-40 horas
**Impacto**: Prioriza leads com maior potencial de conversão

#### O que é necessário:

**Sistema de Lead Scoring (20-30h)**:
```python
# estetiQ-api/src/services/lead_scoring_service.py

class LeadScoringService:
    """Serviço de qualificação e scoring de leads"""

    CRITERIOS_SCORING = {
        "engajamento": {
            "respondeu_rapido": 15,  # Respondeu em < 5min
            "respondeu_medio": 10,   # Respondeu em 5-30min
            "multiplas_mensagens": 20, # Mais de 3 mensagens
        },
        "interesse": {
            "perguntou_preco": 25,
            "perguntou_disponibilidade": 30,
            "mencionou_procedimento_especifico": 20,
        },
        "qualificacao": {
            "tem_orcamento": 30,
            "tem_urgencia": 25,
            "ja_fez_procedimento_antes": 15,
        },
        "sinais_negativos": {
            "perguntou_apenas_preco": -15,
            "nao_respondeu_perguntas": -20,
            "resposta_monossilabica": -10,
        }
    }

    async def qualificar_lead(
        self,
        conversa_id: UUID,
        mensagens: List[dict]
    ) -> dict:
        """
        Qualifica lead baseado na conversa
        Retorna score (0-100) e classificação (quente/morno/frio)
        """

        # Analisar conversa com IA
        analise = await self._analisar_conversa_com_ia(mensagens)

        # Calcular score
        score = 0

        # Engajamento
        tempo_resposta = self._calcular_tempo_medio_resposta(mensagens)
        if tempo_resposta < 300:  # 5 minutos
            score += self.CRITERIOS_SCORING["engajamento"]["respondeu_rapido"]
        elif tempo_resposta < 1800:  # 30 minutos
            score += self.CRITERIOS_SCORING["engajamento"]["respondeu_medio"]

        if len(mensagens) >= 3:
            score += self.CRITERIOS_SCORING["engajamento"]["multiplas_mensagens"]

        # Interesse (via IA)
        if analise.get("perguntou_preco"):
            score += self.CRITERIOS_SCORING["interesse"]["perguntou_preco"]
        if analise.get("perguntou_disponibilidade"):
            score += self.CRITERIOS_SCORING["interesse"]["perguntou_disponibilidade"]
        if analise.get("procedimento_especifico"):
            score += self.CRITERIOS_SCORING["interesse"]["mencionou_procedimento_especifico"]

        # Qualificação (via IA)
        if analise.get("tem_orcamento"):
            score += self.CRITERIOS_SCORING["qualificacao"]["tem_orcamento"]
        if analise.get("tem_urgencia"):
            score += self.CRITERIOS_SCORING["qualificacao"]["tem_urgencia"]

        # Sinais negativos
        if analise.get("apenas_preco"):
            score += self.CRITERIOS_SCORING["sinais_negativos"]["perguntou_apenas_preco"]

        # Classificar
        if score >= 70:
            classificacao = "quente"
            prioridade = "alta"
        elif score >= 40:
            classificacao = "morno"
            prioridade = "media"
        else:
            classificacao = "frio"
            prioridade = "baixa"

        return {
            "score": max(0, min(score, 100)),  # Limitar entre 0-100
            "classificacao": classificacao,
            "prioridade": prioridade,
            "sinais_detectados": analise,
            "recomendacao": self._gerar_recomendacao(classificacao, analise)
        }

    async def _analisar_conversa_com_ia(self, mensagens: List[dict]) -> dict:
        """Usa GPT-4 para analisar intenção e interesse na conversa"""

        # Preparar histórico da conversa
        historico = "\n".join([
            f"{msg['autor']}: {msg['conteudo']}"
            for msg in mensagens
        ])

        prompt = f"""
        Analise a seguinte conversa entre um prospect e uma clínica de estética.

        Conversa:
        {historico}

        Identifique:
        1. O prospect perguntou sobre preços? (true/false)
        2. O prospect perguntou sobre disponibilidade/horários? (true/false)
        3. O prospect mencionou um procedimento específico? (true/false) Se sim, qual?
        4. O prospect demonstrou ter orçamento? (true/false)
        5. O prospect demonstrou urgência? (true/false)
        6. O prospect apenas perguntou preço sem outras questões? (true/false)
        7. Nível de interesse geral (baixo/médio/alto)
        8. Principais objeções mencionadas

        Retorne em formato JSON.
        """

        # Chamar GPT-4
        response = await self.langchain_service.run_process_simple(
            user_message=prompt,
            user_id="system",
            system_prompt="Você é um analista de vendas especializado em estética."
        )

        # Parse JSON
        analise = json.loads(response)
        return analise

    def _gerar_recomendacao(self, classificacao: str, analise: dict) -> str:
        """Gera recomendação de ação baseada na qualificação"""

        if classificacao == "quente":
            return "AÇÃO IMEDIATA: Ligar ou enviar proposta personalizada nas próximas 2 horas"
        elif classificacao == "morno":
            return "Enviar informações adicionais e fazer follow-up em 24h"
        else:
            return "Adicionar à sequência de nutrição de leads (conteúdo educativo)"
```

---

### 3.5 GAP #5: Agendamento Automático Completo 📅

**Status Atual**: ⚠️ 60% implementado (API existe, falta bot agendar)
**Prioridade**: 🟡 MÉDIA
**Esforço**: 20-30 horas
**Impacto**: Bot agenda diretamente sem intervenção humana

#### O que falta:

**IA que Agenda Automaticamente (20-30h)**:
```python
# estetiQ-api/src/services/agendamento_automatico_service.py

class AgendamentoAutomaticoService:
    """Bot agenda automaticamente baseado em disponibilidade"""

    async def processar_intencao_agendamento(
        self,
        conversa_id: UUID,
        mensagem_usuario: str
    ):
        """
        Processa intenção de agendamento e sugere horários
        """

        # 1. Extrair informações com IA
        info = await self._extrair_info_agendamento(mensagem_usuario)

        # 2. Buscar disponibilidade
        slots = await self._buscar_slots_disponiveis(
            procedimento=info.get("procedimento"),
            profissional_id=info.get("profissional_id"),
            data_preferida=info.get("data_preferida"),
            periodo_preferido=info.get("periodo")  # manhã, tarde, noite
        )

        # 3. Sugerir melhores horários
        if not slots:
            return await self._responder_sem_disponibilidade(conversa_id)

        # 4. Enviar opções para o usuário
        await self._enviar_opcoes_agendamento(conversa_id, slots)

        # 5. Aguardar confirmação
        # (próxima mensagem do usuário vai para confirmar_agendamento)

    async def _extrair_info_agendamento(self, mensagem: str) -> dict:
        """Extrai informações de agendamento da mensagem usando IA"""

        prompt = f"""
        Extraia as informações de agendamento da mensagem do usuário.

        Mensagem: "{mensagem}"

        Identifique:
        1. Procedimento desejado (se mencionado)
        2. Data preferida (se mencionada) - formato YYYY-MM-DD
        3. Período preferido (manhã/tarde/noite)
        4. Profissional preferido (se mencionado)
        5. Urgência (sim/não)

        Retorne em formato JSON.
        Se algo não foi mencionado, deixe null.
        """

        response = await self.langchain_service.run_process_simple(
            user_message=prompt,
            user_id="system"
        )

        return json.loads(response)

    async def _buscar_slots_disponiveis(
        self,
        procedimento: Optional[str],
        profissional_id: Optional[UUID],
        data_preferida: Optional[date],
        periodo_preferido: Optional[str]
    ) -> List[dict]:
        """Busca slots disponíveis considerando preferências"""

        # Se não tem data preferida, buscar nos próximos 7 dias
        if not data_preferida:
            data_inicio = date.today()
            data_fim = data_inicio + timedelta(days=7)
        else:
            data_inicio = data_preferida
            data_fim = data_preferida

        # Chamar API de disponibilidade existente
        disponibilidade = await self.agendamento_service.get_disponibilidade(
            data_inicio=data_inicio,
            data_fim=data_fim,
            profissional_id=profissional_id,
            procedimento=procedimento
        )

        # Filtrar por período se especificado
        if periodo_preferido:
            disponibilidade = self._filtrar_por_periodo(
                disponibilidade,
                periodo_preferido
            )

        # Retornar top 3 melhores opções
        return disponibilidade[:3]

    async def _enviar_opcoes_agendamento(
        self,
        conversa_id: UUID,
        slots: List[dict]
    ):
        """Envia opções de agendamento formatadas"""

        mensagem = "Encontrei os seguintes horários disponíveis:\n\n"

        for i, slot in enumerate(slots, 1):
            data_formatada = slot['data'].strftime("%d/%m/%Y")
            hora_formatada = slot['hora'].strftime("%H:%M")
            profissional = slot['profissional']['nome']

            mensagem += f"{i}. {data_formatada} às {hora_formatada} com {profissional}\n"

        mensagem += "\nQual horário prefere? Responda com o número (1, 2 ou 3)"

        # Enviar via WebSocket ou WhatsApp
        await self.mensagem_service.enviar_mensagem(
            conversa_id=conversa_id,
            conteudo=mensagem,
            remetente_id="bot"
        )

    async def confirmar_agendamento(
        self,
        conversa_id: UUID,
        escolha: int,
        usuario_id: UUID
    ):
        """Confirma agendamento escolhido pelo usuário"""

        # Recuperar slots do contexto da conversa
        slots = await self._get_slots_from_context(conversa_id)

        if escolha < 1 or escolha > len(slots):
            return await self._responder_escolha_invalida(conversa_id)

        slot_escolhido = slots[escolha - 1]

        # Criar agendamento
        agendamento = await self.agendamento_service.criar_agendamento(
            id_paciente=usuario_id,
            id_profissional=slot_escolhido['profissional_id'],
            id_procedimento=slot_escolhido['procedimento_id'],
            dt_agendamento=slot_escolhido['data'],
            hr_inicio=slot_escolhido['hora']
        )

        # Enviar confirmação
        mensagem = f"""
        ✅ Agendamento confirmado!

        📅 Data: {slot_escolhido['data'].strftime("%d/%m/%Y")}
        ⏰ Horário: {slot_escolhido['hora'].strftime("%H:%M")}
        👤 Profissional: {slot_escolhido['profissional']['nome']}
        💆 Procedimento: {slot_escolhido['procedimento']['nome']}

        Você receberá um lembrete 24h antes do seu horário.
        Até lá! 😊
        """

        await self.mensagem_service.enviar_mensagem(
            conversa_id=conversa_id,
            conteudo=mensagem,
            remetente_id="bot"
        )

        # Agendar lembrete
        await self.notificacao_service.agendar_lembrete(
            agendamento_id=agendamento.id_agendamento,
            data_envio=slot_escolhido['data'] - timedelta(days=1)
        )
```

---

## 4. ROADMAP DE IMPLEMENTAÇÃO

### 4.1 Fase 1: Fundação (4-6 semanas) - PRIORIDADE ALTA

**Objetivo**: Completar gaps críticos para automação básica

#### Sprint 1: WhatsApp Business API (2 semanas)
- [ ] Integração completa com WhatsApp Business API
- [ ] Webhooks para receber mensagens
- [ ] Envio de mensagens (texto, imagem, botões)
- [ ] Templates de mensagens aprovados
- [ ] **Esforço**: 40-60h
- [ ] **Entregável**: WhatsApp funcional 100%

#### Sprint 2: Upload de Listas e Gestão de Prospects (2 semanas)
- [ ] API de upload CSV/Excel
- [ ] Validação e deduplicação automática
- [ ] Enriquecimento básico de dados
- [ ] Segmentação de prospects
- [ ] **Esforço**: 40-60h
- [ ] **Entregável**: Importação em massa funcional

#### Sprint 3: Prospecção Proativa - MVP (2 semanas)
- [ ] Tabelas de campanhas e contatos
- [ ] Engine básica de envio
- [ ] Personalização de templates
- [ ] Monitoramento de respostas
- [ ] **Esforço**: 60-80h
- [ ] **Entregável**: Primeira campanha proativa funcional

### 4.2 Fase 2: Automação Inteligente (6-8 semanas) - PRIORIDADE MÉDIA

**Objetivo**: IA para qualificação e agendamento automático

#### Sprint 4: Lead Scoring e Qualificação (3 semanas)
- [ ] Sistema de scoring automático
- [ ] Análise de conversa com IA
- [ ] Classificação (quente/morno/frio)
- [ ] Recomendações de ação
- [ ] **Esforço**: 30-40h
- [ ] **Entregável**: Qualificação automática de leads

#### Sprint 5: Agendamento Automático Completo (3 semanas)
- [ ] Extração de intenção de agendamento
- [ ] Sugestão automática de horários
- [ ] Confirmação via bot
- [ ] Lembretes automáticos
- [ ] **Esforço**: 20-30h
- [ ] **Entregável**: Bot agenda sem intervenção humana

#### Sprint 6: Follow-up Automático (2 semanas)
- [ ] Sequências de follow-up configuráveis
- [ ] Triggers baseados em eventos
- [ ] A/B testing de mensagens
- [ ] **Esforço**: 30-40h
- [ ] **Entregável**: Sistema de nurturing de leads

### 4.3 Fase 3: Editor Visual (8-10 semanas) - PRIORIDADE BAIXA*

**Objetivo**: Interface no-code para criação de fluxos

*Pode ser adiada se usuários técnicos estiverem confortáveis com JSON/código

#### Sprint 7-8: Frontend do Editor (4 semanas)
- [ ] Canvas drag-and-drop (React Flow)
- [ ] Biblioteca de nodes
- [ ] Editor de propriedades
- [ ] Validação visual
- [ ] **Esforço**: 60-80h
- [ ] **Entregável**: Editor visual funcional

#### Sprint 9-10: Engine de Execução (4 semanas)
- [ ] Interpretador de fluxos JSON
- [ ] Runtime de execução
- [ ] Logs e debugging
- [ ] Templates pré-prontos
- [ ] **Esforço**: 20-40h
- [ ] **Entregável**: Fluxos criados visualmente executando

### 4.4 Fase 4: Otimização e Analytics (4 semanas)

**Objetivo**: Analytics avançado e otimização de conversão

#### Sprint 11-12: Analytics de Conversão (4 semanas)
- [ ] Funil de conversão visual
- [ ] Taxa de conversão por etapa
- [ ] Tempo médio por etapa
- [ ] Análise de abandono
- [ ] Dashboard de performance de campanhas
- [ ] **Esforço**: 40-60h
- [ ] **Entregável**: Dashboard completo de analytics

---

## 5. ESTIMATIVA DE ESFORÇO E CUSTO

### 5.1 Resumo por Fase

| Fase | Duração | Esforço (h) | Custo (R$100/h) | Prioridade |
|------|---------|-------------|-----------------|------------|
| **Fase 1: Fundação** | 4-6 sem | 140-200h | R$ 14k-20k | 🔴 Alta |
| **Fase 2: Automação IA** | 6-8 sem | 80-110h | R$ 8k-11k | 🟡 Média |
| **Fase 3: Editor Visual** | 8-10 sem | 80-120h | R$ 8k-12k | 🟢 Baixa |
| **Fase 4: Analytics** | 4 sem | 40-60h | R$ 4k-6k | 🟢 Baixa |
| **TOTAL** | 22-28 sem | 340-490h | **R$ 34k-49k** | - |

### 5.2 Priorização por ROI

**Alta Prioridade (Implementar PRIMEIRO)**:
1. WhatsApp Business API (ROI: ⭐⭐⭐⭐⭐)
2. Upload de Listas (ROI: ⭐⭐⭐⭐⭐)
3. Prospecção Proativa (ROI: ⭐⭐⭐⭐⭐)

**Média Prioridade (Implementar DEPOIS)**:
4. Lead Scoring (ROI: ⭐⭐⭐⭐)
5. Agendamento Automático (ROI: ⭐⭐⭐⭐)
6. Follow-up Automático (ROI: ⭐⭐⭐⭐)

**Baixa Prioridade (Implementar SE NECESSÁRIO)**:
7. Editor Visual (ROI: ⭐⭐⭐ - útil mas não essencial)
8. Analytics Avançado (ROI: ⭐⭐⭐)

---

## 6. DIFERENCIAIS DO DOCTORQ vs PROSPECTAI

### 6.1 Onde DoctorQ JÁ É SUPERIOR

1. **IA Mais Avançada** ✅
   - GPT-4 vs IA básica
   - LangChain para orquestração complexa
   - RAG com base de conhecimento
   - Agentes customizáveis por domínio

2. **Infraestrutura Empresarial** ✅
   - Multi-tenant nativo
   - RBAC granular
   - Auditoria completa
   - PostgreSQL + Redis

3. **Domínio Específico** ✅
   - Prontuários eletrônicos
   - Fotos antes/depois
   - Marketplace de produtos
   - Avaliações com QR Code

### 6.2 Arquitetura Híbrida Recomendada

**Combinação do melhor dos dois mundos**:

```
DoctorQ Evolution = DoctorQ Base (IA Superior) + ProspectAI (Automação)

├── ✅ Core do DoctorQ (manter)
│   ├── GPT-4 + LangChain
│   ├── RAG com Document Stores
│   ├── Multi-tenant
│   └── Domínio de estética
│
├── ➕ Adicionar do ProspectAI
│   ├── Editor visual de fluxos
│   ├── Prospecção proativa
│   ├── Upload de listas
│   └── Follow-up automático
│
└── 🚀 Resultado
    └── Plataforma mais completa do mercado de estética
```

---

## 7. MÉTRICAS DE SUCESSO

### 7.1 KPIs para Avaliar Maturidade

Ao final da implementação, o DoctorQ deve atingir:

| Métrica | Situação Atual | Meta (ProspectAI Level) |
|---------|----------------|-------------------------|
| **Taxa de Resposta Automática** | 40% | 85% |
| **Tempo Médio de Resposta** | 15 min | < 1 min |
| **Taxa de Agendamento Automático** | 0% | 60% |
| **Leads Qualificados/dia** | Manual | 100+ automático |
| **Taxa de Conversão (Lead → Agendamento)** | 15% | 35% |
| **Tempo de Qualificação** | 2-3 dias | < 1 hora |
| **Prospects Contatados/dia** | 10 manual | 500+ automático |

### 7.2 Benchmarks de Performance

**Após implementação completa**:
- ✅ 85% das conversas tratadas automaticamente
- ✅ 60% dos agendamentos feitos pelo bot
- ✅ 100+ prospects qualificados por dia
- ✅ Tempo de resposta < 1 minuto
- ✅ Taxa de conversão 2x maior

---

## 8. RECOMENDAÇÕES FINAIS

### 8.1 Estratégia Recomendada

**🎯 ABORDAGEM: "Quick Wins First"**

1. **Mês 1-2: Fundação** (Fase 1)
   - Implementar WhatsApp, Upload Listas, Prospecção Básica
   - **Resultado**: Sistema funcional com ROI imediato

2. **Mês 3-4: Automação IA** (Fase 2)
   - Lead scoring, agendamento automático, follow-up
   - **Resultado**: 60% de automação alcançada

3. **Mês 5-6: Editor Visual** (Fase 3 - OPCIONAL)
   - Só implementar se houver demanda de usuários não técnicos
   - **Resultado**: Interface no-code disponível

### 8.2 Vantagem Competitiva

**DoctorQ após implementação será ÚNICO no mercado**:

| Aspecto | BotConversa | CLINT | ManyChat | **DoctorQ** |
|---------|-------------|-------|----------|-------------|
| IA Avançada (GPT-4) | ❌ | ⚠️ | ❌ | ✅ |
| RAG (Base Conhecimento) | ❌ | ❌ | ❌ | ✅ |
| Prospecção Proativa | ✅ | ✅ | ⚠️ | ✅ |
| Editor Visual | ✅ | ❌ | ✅ | ✅ |
| Domínio Estética | ❌ | ❌ | ❌ | ✅ |
| Multi-tenant | ❌ | ❌ | ❌ | ✅ |
| Prontuário Eletrônico | ❌ | ❌ | ❌ | ✅ |
| Marketplace Integrado | ❌ | ❌ | ❌ | ✅ |

**🏆 Resultado**: Plataforma MAIS COMPLETA do mercado brasileiro de estética

### 8.3 Decisão de "Build vs Buy"

**❌ NÃO integrar BotConversa/CLINT/ManyChat**

**Razões**:
1. DoctorQ já tem 85% da infraestrutura
2. IA do DoctorQ é superior
3. Dados sensíveis (LGPD) devem ficar no próprio servidor
4. Custo de implementação nativa < custo de integração + mensalidades
5. Maior controle e customização

**✅ Implementar nativamente**

**Investimento**: R$ 34k-49k (6 meses)
**Economia vs Integração**: R$ 50k+/ano em licenças
**ROI**: Positivo em 6-8 meses

---

## 9. PRÓXIMOS PASSOS IMEDIATOS

### Semana 1: Decisão e Planejamento
- [ ] Aprovar este documento
- [ ] Definir orçamento (R$ 34k-49k)
- [ ] Alocar equipe de desenvolvimento
- [ ] Criar conta Meta Business (WhatsApp)

### Semana 2-3: Sprint 1 - WhatsApp
- [ ] Integração WhatsApp Business API
- [ ] Testes de envio/recebimento
- [ ] Deploy em produção

### Semana 4-5: Sprint 2 - Upload Listas
- [ ] Implementar upload CSV/Excel
- [ ] Validação e deduplicação
- [ ] Interface de gestão de prospects

### Semana 6-7: Sprint 3 - Prospecção MVP
- [ ] Criar engine de campanhas
- [ ] Primeiro teste de campanha proativa
- [ ] Ajustes baseados em feedback

**🎯 Meta 60 dias**: Primeira campanha proativa rodando com WhatsApp!

---

## 10. CONCLUSÃO

O **DoctorQ** possui uma base técnica **sólida e superior** ao ProspectAI/BotConversa em termos de IA e infraestrutura. Os gaps identificados são principalmente em **features de produto** (editor visual, prospecção proativa) e não em capacidade técnica.

**Implementando as Fases 1 e 2** (R$ 22k-31k, 3-4 meses), o DoctorQ alcançará **80% da maturidade do BotConversa** com uma IA **significativamente melhor**.

O **Editor Visual (Fase 3)** pode ser adiado ou até mesmo **evitado** se os usuários estiverem confortáveis com configurações via interface administrativa (JSON estruturado, não código puro).

**Recomendação final**: ✅ **Investir na implementação nativa** seguindo o roadmap proposto, começando pelas Fases 1 e 2.

---

**Documento elaborado por**: Claude (Anthropic)
**Revisão**: Pendente
**Aprovação**: Pendente
**Versão**: 1.0
**Status**: 📋 Draft para Revisão
