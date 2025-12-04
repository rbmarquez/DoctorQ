# UC003 - Mentor IA e RAG (Retrieval-Augmented Generation)

**Versão:** 1.0
**Data:** 13/11/2025
**Autor:** Sistema DoctorQ
**Status:** Planejado

---

## 1. Descrição

Este caso de uso descreve a funcionalidade do Mentor IA "Dra. Sophie", uma assistente virtual 24/7 especializada em estética que utiliza RAG (Retrieval-Augmented Generation) para responder dúvidas dos alunos com base no conteúdo dos cursos, artigos científicos e banco de conhecimento da plataforma.

---

## 2. Atores

### Ator Principal
- **Aluno** - Usuário que interage com Dra. Sophie para tirar dúvidas

### Atores Secundários
- **Dra. Sophie (Mentor IA)** - Agente LLM com especialização em estética
- **Sistema RAG** - Pipeline de recuperação de contexto (embeddings + vector search)
- **Sistema de Cursos** - Fonte de conteúdo para indexação
- **Banco de Conhecimento** - Artigos, papers, guidelines técnicas

---

## 3. Pré-condições

1. Aluno deve estar logado na plataforma
2. Aluno deve ter pelo menos 1 curso ativo (para perguntas contextuais)
3. Base de conhecimento indexada (embeddings gerados)
4. LLM configurado (OpenAI GPT-4 ou Azure OpenAI)
5. Vector database ativo (pgvector ou Qdrant)

---

## 4. Pós-condições

### Sucesso
1. Dúvida do aluno respondida com precisão
2. Conversa registrada em `tb_conversas_usuarios`
3. Mensagens armazenadas em `tb_messages`
4. Feedback de qualidade coletado (👍/👎)
5. Chunks relevantes salvos para auditoria
6. Métricas de uso registradas (Langfuse)

### Falha
1. LLM retorna "Não sei" se contexto insuficiente
2. Fallback para suporte humano se > 3 respostas insatisfatórias
3. Erro de API logado para debugging

---

## 5. Fluxo Principal

### 5.1 Aluno Inicia Conversa com Dra. Sophie

**Passo 1: Acessar Chat do Mentor**

- Aluno clica em ícone de chat flutuante (⚡ Dra. Sophie)
- Sistema abre interface de chat com:
  - Avatar da Dra. Sophie (avatar feminino profissional)
  - Mensagem de boas-vindas personalizada:
    ```
    Olá, João! 👋 Sou a Dra. Sophie, sua mentora de estética.
    Como posso te ajudar hoje?

    💡 Dica: Pergunte sobre o conteúdo dos seus cursos, técnicas,
    produtos ou tire dúvidas sobre sua jornada de aprendizado!
    ```
  - Sugestões rápidas (chips clicáveis):
    - "Como fazer fios de PDO?"
    - "Qual diferença entre ácido hialurônico e botox?"
    - "Preciso de ajuda com minha última aula"

**Passo 2: Aluno Faz Pergunta**

Exemplos de perguntas possíveis:
- **Técnica:** "Como fazer a técnica de microblading?"
- **Produto:** "Qual a diferença entre toxina botulínica tipo A e B?"
- **Aula específica:** "Não entendi a parte sobre anatomia facial da última aula"
- **Motivacional:** "Estou desmotivado, como continuar?"
- **Certificação:** "Como funciona a certificação?"

```json
// Request enviado ao backend
POST /conversas/
{
  "id_aluno": "uuid",
  "ds_titulo": "Dúvida sobre microblading",
  "ds_tipo": "mentor_ia"
}

POST /conversas/{id_conversa}/messages/
{
  "ds_conteudo": "Como fazer a técnica de microblading?",
  "ds_role": "user"
}
```

### 5.2 Sistema RAG - Recuperação de Contexto

**Passo 3: Análise da Pergunta e Extração de Intenção**

```python
# Backend - src/agents/dra_sophie_agent.py

async def processar_pergunta(pergunta: str, id_aluno: str):
    # 1. Detectar intenção da pergunta
    intencao = await classificar_intencao(pergunta)
    # Possíveis intenções:
    # - "tecnica" → pergunta sobre procedimento
    # - "produto" → dúvida sobre produto/substância
    # - "curso" → referente a aula/módulo
    # - "motivacional" → suporte emocional
    # - "administrativo" → sobre plataforma, certificação, etc.

    # 2. Extrair entidades mencionadas
    entidades = await extrair_entidades(pergunta)
    # Exemplo: {"tecnica": "microblading", "categoria": "facial"}

    # 3. Buscar contexto do aluno
    contexto_aluno = await obter_contexto_aluno(id_aluno)
    # {
    #   "cursos_ativos": ["Microblading Avançado", "Harmonização Facial"],
    #   "ultima_aula": {"nm_titulo": "Anatomia Facial", "id_aula": "uuid"},
    #   "nivel_gamificacao": 14,
    #   "especialidade": "Facial"
    # }
```

**Passo 4: Gerar Embedding da Pergunta**

```python
# Converter pergunta em vetor (OpenAI text-embedding-3-small)
embedding = await gerar_embedding(pergunta)
# Resultado: array de 1536 dimensões
```

**Passo 5: Buscar Chunks Relevantes no Vector Database**

```sql
-- Query híbrida: semantic search + filtros
SELECT
  c.id_chunk,
  c.ds_conteudo,
  c.ds_metadata,
  c.qt_relevancia,
  1 - (c.embedding <=> :query_embedding) AS similaridade
FROM tb_universidade_knowledge_chunks c
WHERE
  -- Filtrar por cursos do aluno (contexto personalizado)
  c.id_curso = ANY(:cursos_aluno)
  -- Filtrar por categoria relevante
  AND c.nm_categoria = :categoria_detectada
  -- Similaridade mínima (evitar resultados irrelevantes)
  AND (c.embedding <=> :query_embedding) < 0.3
ORDER BY similaridade DESC
LIMIT 5;
```

**Resultado esperado:**
```json
[
  {
    "id_chunk": "uuid-1",
    "ds_conteudo": "A técnica de microblading consiste em implantar pigmento na camada basal da epiderme usando um tebori (ferramenta manual com microagulhas). O procedimento requer domínio de traçado de fios, escolha adequada de pigmentos e conhecimento profundo de anatomia facial...",
    "ds_metadata": {
      "nm_curso": "Microblading Avançado",
      "nm_modulo": "Técnicas Avançadas",
      "nm_aula": "Traçado de Fios Realistas",
      "qt_timestamp": 1245, // segundos no vídeo
      "nm_instrutor": "Dra. Maria Silva"
    },
    "similaridade": 0.92
  },
  {
    "id_chunk": "uuid-2",
    "ds_conteudo": "Pré-procedimento: design de sobrancelhas deve seguir a proporção áurea. Usar régua específica para marcar pontos de início, arco e fim. Anestésico tópico (lidocaína 5%) aplicado 20 minutos antes...",
    "similaridade": 0.87
  },
  // ... mais 3 chunks
]
```

### 5.3 Geração de Resposta com LLM

**Passo 6: Montar Prompt Contextualizado**

```python
# Template de prompt para Dra. Sophie
system_prompt = """
Você é a Dra. Sophie, uma mentora especializada em estética e professora na Universidade da Beleza.

PERFIL:
- Amigável, paciente e encorajadora
- Especialista em procedimentos estéticos (botox, preenchimento, microblading, etc.)
- Usa linguagem técnica quando necessário, mas sempre explica de forma didática
- Parabeniza conquistas dos alunos e celebra progresso

DIRETRIZES:
1. Sempre responda com base no CONTEXTO fornecido (conteúdo dos cursos)
2. Se a pergunta não puder ser respondida com o contexto, diga: "Não encontrei essa informação nos seus cursos. Posso te conectar com o instrutor?"
3. Cite a fonte (nome do curso/aula) quando relevante
4. Use emojis moderadamente (1-2 por mensagem) para humanizar
5. Incentive o aluno a praticar e revisar conteúdo relacionado
6. Se detectar desmotivação, ofereça suporte emocional

CONTEXTO DO ALUNO:
- Nome: {nm_nome}
- Nível: {qt_nivel}
- Cursos ativos: {cursos}
- Última atividade: {ultima_atividade}

PROIBIÇÕES:
- NUNCA forneça informações médicas não presentes no contexto
- NUNCA invente dados sobre produtos ou técnicas
- NUNCA contradiga o conteúdo dos instrutores
"""

user_prompt = f"""
CONTEXTO RELEVANTE DOS CURSOS:
{chunks_formatados}

PERGUNTA DO ALUNO:
{pergunta}

RESPONDA de forma clara, didática e amigável, citando a fonte quando apropriado.
"""
```

**Passo 7: Chamar LLM com Streaming**

```python
# Streaming para melhor UX (resposta aparece palavra por palavra)
async def gerar_resposta_streaming(prompt: str):
    async for chunk in llm_client.stream(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=800
    ):
        yield chunk["choices"][0]["delta"]["content"]
```

**Passo 8: Enviar Resposta via SSE**

```python
# Frontend recebe via Server-Sent Events
@router.post("/conversas/{id_conversa}/chat/")
async def chat_streaming(id_conversa: UUID, message: MessageCreate):
    async def event_generator():
        resposta_completa = ""

        async for chunk in dra_sophie.responder_streaming(message.ds_conteudo):
            resposta_completa += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        # Salvar mensagem completa no banco
        await salvar_mensagem(
            id_conversa=id_conversa,
            ds_conteudo=resposta_completa,
            ds_role="assistant",
            ds_metadata={
                "chunks_usados": [c.id_chunk for c in chunks_relevantes],
                "modelo": "gpt-4-turbo",
                "tokens": len(resposta_completa.split())
            }
        )

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Exemplo de Resposta da Dra. Sophie:**

```
Ótima pergunta, João! 😊

A técnica de microblading é um procedimento de implantação de pigmento
que você está estudando no curso "Microblading Avançado".

RESUMO DA TÉCNICA:
1. **Preparação**: Design da sobrancelha seguindo proporção áurea,
   limpeza da área e aplicação de anestésico tópico

2. **Execução**: Utilizar tebori (ferramenta manual) para traçar fios
   finos na camada basal da epiderme, seguindo o desenho natural

3. **Pigmentação**: Escolha do pigmento adequado ao tom de pele e cor
   dos pelos naturais

4. **Pós-procedimento**: Orientações de cuidado para cicatrização

📚 **Fonte**: Curso "Microblading Avançado" → Módulo "Técnicas Avançadas"
    → Aula "Traçado de Fios Realistas" (aos 20:45)

💡 **Dica**: Se ainda não assistiu essa aula completa, recomendo revisar!
Depois, pratique em pele sintética antes de partir para modelos.

Precisa de mais detalhes sobre alguma etapa? 😉
```

### 5.4 Feedback e Melhoria Contínua

**Passo 9: Solicitar Feedback**

```javascript
// Frontend exibe botões de feedback após resposta
{
  "mensagem_id": "uuid",
  "conteudo": "...",
  "feedback_opcoes": [
    { "tipo": "positivo", "icone": "👍", "label": "Útil" },
    { "tipo": "negativo", "icone": "👎", "label": "Não ajudou" }
  ]
}
```

**Passo 10: Registrar Feedback**

```sql
-- Aluno clica em 👍 ou 👎
INSERT INTO tb_universidade_feedback_ia (
  id_mensagem,
  id_aluno,
  ds_tipo_feedback, -- "positivo" ou "negativo"
  ds_comentario, -- opcional: "Resposta muito técnica" ou NULL
  dt_feedback
) VALUES (:id_msg, :id_aluno, 'positivo', NULL, now());

-- Atualizar métrica da mensagem
UPDATE tb_messages
SET ds_metadata = jsonb_set(
  ds_metadata,
  '{feedback}',
  '{"tipo": "positivo", "dt": "2025-11-13T10:30:00Z"}'
)
WHERE id_mensagem = :id_msg;
```

**Passo 11: Análise de Feedback para Fine-Tuning**

```python
# Job semanal: analisar feedbacks negativos
feedbacks_negativos = await obter_feedbacks(tipo='negativo', semana_atual=True)

for feedback in feedbacks_negativos:
    # Identificar padrões:
    # - Chunks irrelevantes retornados?
    # - LLM alucinando informações?
    # - Resposta muito longa/curta?
    # - Tom inadequado?

    analisar_e_marcar_para_retreino(feedback)
```

### 5.5 Funcionalidades Avançadas

**Passo 12: Sugestões Proativas**

```python
# Dra. Sophie oferece ajuda proativa em momentos-chave

# Exemplo 1: Após aluno reprovar quiz 2 vezes
if aluno.qt_tentativas_quiz >= 2 and aluno.vl_nota < 60:
    await dra_sophie.enviar_mensagem_proativa({
        "id_aluno": aluno.id,
        "mensagem": "Oi João! 😊 Percebi que o quiz está difícil. Quer que eu explique os conceitos que mais caíram? Podemos revisar juntos! 📚"
    })

# Exemplo 2: Aluno parado há 7 dias
if dias_desde_ultima_atividade >= 7:
    await dra_sophie.enviar_mensagem_proativa({
        "mensagem": "Sentimos sua falta! 💙 Você estava indo tão bem no curso de Harmonização Facial. Que tal continuarmos hoje? Te espero! 🚀"
    })

# Exemplo 3: Celebração de conquista
if evento.tipo == 'level_up':
    await dra_sophie.enviar_mensagem_proativa({
        "mensagem": "PARABÉNS pelo nível 15! 🎉🎉 Você está arrasando! Já está quase um expert. Continue assim! 🏆"
    })
```

**Passo 13: Modo "Tutor de Estudo"**

```python
# Aluno ativa modo de estudo guiado
# Dra. Sophie vira um tutor socrático (faz perguntas em vez de dar respostas)

aluno: "Como fazer preenchimento labial?"

dra_sophie (modo tutor): "Ótima pergunta! Antes de te explicar, me diz:
você já revisou a anatomia dos lábios? Sabe identificar o arco de cupido
e os pontos de aplicação? 🤔"

aluno: "Sim, o arco de cupido é a parte superior em formato de M"

dra_sophie: "Exato! 👏 E quais são os riscos se aplicarmos filler muito
próximo à artéria labial?"

# Este modo força raciocínio ativo, melhorando retenção
```

---

## 6. Fluxos Alternativos

### 6.A - Pergunta Fora do Escopo

**Condição:** Aluno faz pergunta não relacionada a estética

**Pergunta:** "Qual a previsão do tempo amanhã?"

**Resposta da Dra. Sophie:**
```
Oi! 😊 Sou especialista em estética e educação, então não consigo
te ajudar com a previsão do tempo.

Mas posso te ajudar com:
- Dúvidas sobre procedimentos estéticos
- Explicações de aulas e conteúdo dos cursos
- Dicas de estudo e motivação
- Informações sobre certificações

Tem alguma dúvida sobre estética que eu possa responder? 💉
```

### 6.B - Contexto Insuficiente

**Condição:** RAG não encontra chunks relevantes (similaridade < 0.5)

**Pergunta:** "Como tratar complicação vascular pós-preenchimento?"

**Resposta da Dra. Sophie:**
```
Essa é uma pergunta muito importante sobre complicações! 🚨

No entanto, não encontrei essa informação detalhada nos cursos que
você está fazendo atualmente.

📞 RECOMENDAÇÃO: Entre em contato direto com o instrutor do curso
"Harmonização Facial" ou com nosso suporte médico para orientações
específicas sobre complicações.

💡 Você também pode:
- Verificar se há módulos sobre complicações nos cursos avançados
- Acessar a biblioteca de casos clínicos (em breve)

Posso te ajudar com outra dúvida? 😊
```

### 6.C - Detecção de Emergência Médica

**Condição:** Aluno relata sintoma grave em paciente/cliente

**Pergunta:** "Minha cliente está com necrose após preenchimento, o que faço?"

**Resposta da Dra. Sophie:**
```
🚨 EMERGÊNCIA MÉDICA 🚨

Se há suspeita de necrose vascular, é crucial agir IMEDIATAMENTE:

1. PARE qualquer procedimento
2. ACIONE atendimento médico de emergência (192)
3. Aplique hialuronidase se disponível (conforme protocolo)
4. Mantenha a área afetada aquecida

⚠️ IMPORTANTE: Conectando você com nosso suporte médico de urgência...

[Botão: Falar com Médico Plantonista Agora]

Esta é uma situação crítica. Não confie apenas em orientações
virtuais - busque atendimento presencial imediato!
```

```python
# Backend detecta palavras-chave de emergência
EMERGENCIAS_KEYWORDS = [
    "necrose", "vascular", "cegueira", "isquemia", "alergia grave",
    "choque anafilático", "infecção severa", "embolia"
]

if any(keyword in pergunta.lower() for keyword in EMERGENCIAS_KEYWORDS):
    # Escalate para suporte humano
    await criar_ticket_urgente(id_aluno, pergunta)
    await notificar_plantao_medico(id_aluno)
    # Resposta pré-definida de emergência
    return TEMPLATE_EMERGENCIA
```

### 6.D - Modo de Simulação de Casos Clínicos

**Condição:** Aluno ativa "Simulador de Casos" para treino

**Fluxo:**
```python
# Dra. Sophie gera caso clínico fictício
dra_sophie: """
📋 CASO CLÍNICO #45

Paciente: Feminino, 42 anos
Queixa: Rugas profundas na região frontal e glabela
Histórico: Sem procedimentos estéticos prévios
Objetivo: Harmonização facial sutil, resultado natural

PERGUNTAS:
1. Qual procedimento você recomendaria?
2. Quantas unidades de toxina botulínica?
3. Quais pontos de aplicação?
4. Cuidados pós-procedimento?

Digite suas respostas e vou te dar feedback! 💉
"""

# Aluno responde
aluno: "Recomendaria botox, 20 unidades, pontos frontais e glabela..."

# Dra. Sophie avalia com base em guidelines do curso
dra_sophie: """
Muito bem! 🎯 Sua resposta está 80% correta.

✅ ACERTOS:
- Procedimento adequado (toxina botulínica)
- Pontos de aplicação corretos

⚠️ PONTOS DE MELHORIA:
- Dosagem: Para primeira aplicação em paciente sem histórico, o
  ideal seria 15-18U (não 20U) para evitar efeito congelado
- Faltou mencionar: avaliação de contraindicações (gravidez,
  doenças autoimunes)

📚 Revise: Curso "Toxina Botulínica" → Módulo 2 → Aula "Dosagem Segura"

Quer tentar outro caso? 😊
"""
```

---

## 7. Fluxos de Exceção

### 7.A - Erro de API do LLM

**Erro:** OpenAI API retorna 500 ou timeout

**Tratamento:**
```python
try:
    resposta = await llm.chat(prompt)
except OpenAIError as e:
    logger.error(f"LLM Error: {e}")

    # Fallback: resposta pré-definida
    resposta_fallback = """
    Ops! 😅 Estou com um problema técnico temporário.
    Enquanto isso, você pode:
    - Buscar no FAQ: [link]
    - Ver respostas similares em [Fórum da Comunidade]
    - Falar com suporte: [Chat Humano]

    Já estou voltando! 🔧
    """

    # Criar ticket para suporte verificar
    await criar_ticket_erro_ia(id_aluno, pergunta, str(e))

    return resposta_fallback
```

### 7.B - Aluno Abusa do Sistema

**Erro:** > 100 mensagens em 1 hora (possível spam/teste)

**Tratamento:**
```python
# Rate limiting específico para IA
if await verificar_rate_limit(id_aluno, limite=100, janela_horas=1):
    return {
        "mensagem": "Você atingiu o limite de mensagens por hora. "
                    "Para continuar conversando, aguarde 30 minutos ou "
                    "fale diretamente com nosso suporte humano.",
        "codigo_erro": "RATE_LIMIT_IA",
        "retry_after": 1800  # segundos
    }
```

### 7.C - Chunk Vazio ou Corrompido

**Erro:** Vector search retorna chunk com `ds_conteudo = NULL`

**Tratamento:**
```python
chunks_validos = [c for c in chunks if c.ds_conteudo and len(c.ds_conteudo) > 50]

if not chunks_validos:
    logger.warning(f"Nenhum chunk válido para pergunta: {pergunta}")

    # Tentar busca menos restritiva (aumentar threshold de similaridade)
    chunks_validos = await buscar_chunks(threshold=0.5)  # mais permissivo

    if still empty:
        return "Não encontrei informações suficientes sobre isso nos seus cursos. Quer que eu te conecte com o instrutor?"
```

---

## 8. Regras de Negócio

### RN001 - Limite de Mensagens Grátis
- **Regra:** Alunos com plano gratuito: 20 mensagens/dia com Dra. Sophie
- **Plano Premium:** Mensagens ilimitadas
- **Validação:** Contar mensagens em `tb_messages WHERE DATE(dt_criacao) = CURRENT_DATE`

### RN002 - Prioridade de Contexto
- **Regra:** RAG deve priorizar chunks dos cursos que o aluno está fazendo atualmente
- **Peso:** Curso ativo = 1.5x, Curso concluído = 1.0x, Outros cursos = 0.5x
- **Objetivo:** Respostas mais personalizadas

### RN003 - Retenção de Conversas
- **Regra:** Conversas armazenadas por 1 ano
- **Exceção:** Feedbacks negativos e casos de emergência: permanentes (auditoria)
- **LGPD:** Aluno pode solicitar exclusão via `/configuracoes/privacidade`

### RN004 - Citação Obrigatória de Fontes
- **Regra:** Dra. Sophie SEMPRE deve citar curso/aula de onde veio a informação
- **Validação:** Prompt engineering + verificação pós-geração
- **Objetivo:** Transparência e confiabilidade

### RN005 - Proibição de Diagnósticos Médicos
- **Regra:** IA NÃO pode fazer diagnósticos, prescrever tratamentos ou substituir consulta médica
- **Validação:** Disclaimer em toda resposta relacionada a saúde
- **Compliance:** Regulamentação do CFM sobre IA em saúde

### RN006 - Qualidade Mínima de Chunks
- **Regra:** Chunks com < 100 caracteres ou > 2000 caracteres são descartados
- **Razão:** Muito curto = sem contexto, muito longo = ruído
- **Ideal:** 300-800 caracteres por chunk

---

## 9. Requisitos Não-Funcionais

### RNF001 - Latência de Resposta
- Primeira palavra da resposta: < 2s
- Resposta completa (streaming): < 15s
- Busca vetorial: < 500ms

### RNF002 - Qualidade das Respostas
- Acurácia: > 85% (avaliado por feedbacks positivos)
- Taxa de "Não sei": < 15% das perguntas
- Taxa de escalação para humano: < 10%

### RNF003 - Escalabilidade
- Suportar 1.000 conversas simultâneas
- Vector DB: 100.000+ chunks indexados
- Cache de embeddings frequentes (Redis)

### RNF004 - Observabilidade
- Todas as interações rastreadas no Langfuse
- Métricas:
  - Latência por etapa (embedding, busca, LLM)
  - Custo por mensagem (tokens)
  - Taxa de feedback positivo/negativo
  - Chunks mais recuperados

### RNF005 - Segurança e Privacidade
- Mensagens criptografadas em repouso (AES-256)
- Logs anonimizados (sem dados pessoais)
- Compliance LGPD: direito ao esquecimento

---

## 10. Entidades e Relacionamentos

### Tabelas Principais

#### `tb_universidade_knowledge_chunks`
```sql
CREATE TABLE tb_universidade_knowledge_chunks (
  id_chunk UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_curso UUID REFERENCES tb_universidade_cursos(id_curso),
  id_aula UUID REFERENCES tb_universidade_aulas(id_aula),

  -- Conteúdo
  ds_conteudo TEXT NOT NULL,
  ds_conteudo_original TEXT, -- Texto completo antes do chunking
  qt_ordem INTEGER, -- Ordem do chunk no documento

  -- Metadata
  ds_metadata JSONB,
  /* Exemplo:
  {
    "nm_modulo": "Técnicas Avançadas",
    "nm_instrutor": "Dra. Maria Silva",
    "qt_timestamp_video": 1245, // segundos
    "nm_tipo": "transcricao_aula" // ou "apostila", "artigo_cientifico"
  }
  */

  -- Embedding (vetor de 1536 dimensões para OpenAI text-embedding-3-small)
  embedding vector(1536),

  -- Classificação
  nm_categoria VARCHAR(100), -- "Facial", "Corporal", "Teórico", etc.
  qt_relevancia DECIMAL(3,2) DEFAULT 1.0, -- Peso manual (chunks importantes = maior)

  -- Auditoria
  dt_indexacao TIMESTAMP DEFAULT now(),
  fg_ativo BOOLEAN DEFAULT true
);

CREATE INDEX idx_chunk_curso ON tb_universidade_knowledge_chunks(id_curso);
CREATE INDEX idx_chunk_aula ON tb_universidade_knowledge_chunks(id_aula);
CREATE INDEX idx_chunk_categoria ON tb_universidade_knowledge_chunks(nm_categoria);

-- Index vetorial (HNSW para performance)
CREATE INDEX idx_chunk_embedding ON tb_universidade_knowledge_chunks
USING hnsw (embedding vector_cosine_ops);
```

#### `tb_universidade_feedback_ia`
```sql
CREATE TABLE tb_universidade_feedback_ia (
  id_feedback UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_mensagem UUID REFERENCES tb_messages(id_mensagem),
  id_aluno UUID REFERENCES tb_users(id_usuario),

  ds_tipo_feedback VARCHAR(50) NOT NULL, -- "positivo", "negativo"
  ds_comentario TEXT, -- Feedback textual opcional
  qt_estrelas INTEGER CHECK (qt_estrelas BETWEEN 1 AND 5), -- Nota opcional

  -- Contexto da resposta avaliada
  ds_metadata JSONB,
  /* Exemplo:
  {
    "chunks_usados": ["uuid1", "uuid2"],
    "modelo": "gpt-4-turbo",
    "latencia_ms": 1245,
    "tokens_gastos": 387
  }
  */

  dt_feedback TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_feedback_mensagem ON tb_universidade_feedback_ia(id_mensagem);
CREATE INDEX idx_feedback_tipo ON tb_universidade_feedback_ia(ds_tipo_feedback);
CREATE INDEX idx_feedback_data ON tb_universidade_feedback_ia(dt_feedback DESC);
```

#### `tb_universidade_mensagens_proativas`
```sql
CREATE TABLE tb_universidade_mensagens_proativas (
  id_mensagem_proativa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno UUID REFERENCES tb_users(id_usuario),
  id_conversa UUID REFERENCES tb_conversas_usuarios(id_conversa),

  ds_tipo VARCHAR(100) NOT NULL,
  -- "celebracao_level_up", "sugestao_revisao", "incentivo_streak", "ajuda_quiz"

  ds_conteudo TEXT NOT NULL,
  ds_metadata JSONB, -- Contexto que gerou a mensagem proativa

  fg_enviada BOOLEAN DEFAULT false,
  dt_envio TIMESTAMP,
  fg_lida BOOLEAN DEFAULT false,
  dt_leitura TIMESTAMP,

  dt_criacao TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_proativa_aluno ON tb_universidade_mensagens_proativas(id_aluno);
CREATE INDEX idx_proativa_tipo ON tb_universidade_mensagens_proativas(ds_tipo);
CREATE INDEX idx_proativa_enviada ON tb_universidade_mensagens_proativas(fg_enviada);
```

#### Reutilização de Tabelas Existentes

- `tb_conversas_usuarios` - Conversas entre aluno e Dra. Sophie
- `tb_messages` - Histórico de mensagens (role: user/assistant)
- `tb_agentes` - Configuração da Dra. Sophie como agente

---

## 11. Endpoints da API

### POST `/universidade/mentor/conversa/`
**Descrição:** Iniciar nova conversa com Dra. Sophie

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "ds_titulo": "Dúvida sobre microblading",
  "ds_contexto_inicial": "curso_atual" // opcional: focar no curso que está estudando
}
```

**Response 201:**
```json
{
  "id_conversa": "uuid",
  "mensagem_boas_vindas": {
    "ds_conteudo": "Olá, João! 👋 Sou a Dra. Sophie...",
    "sugestoes_rapidas": [
      "Como fazer fios de PDO?",
      "Diferença entre ácido hialurônico e botox?",
      "Ajuda com minha última aula"
    ]
  },
  "qt_mensagens_restantes_hoje": 18 // Se plano gratuito
}
```

### POST `/universidade/mentor/conversa/{id}/mensagem/`
**Descrição:** Enviar pergunta para Dra. Sophie (com resposta em streaming)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: text/event-stream
```

**Body:**
```json
{
  "ds_conteudo": "Como fazer a técnica de microblading?",
  "ds_modo": "normal" // ou "tutor" (modo socrático)
}
```

**Response (SSE Stream):**
```
data: {"chunk": "Ótima"}
data: {"chunk": " pergunta"}
data: {"chunk": ", João"}
data: {"chunk": "! 😊\n\n"}
data: {"chunk": "A técnica"}
data: {"chunk": " de microblading"}
...
data: {"done": true, "id_mensagem": "uuid", "chunks_usados": ["uuid1", "uuid2"]}
```

### POST `/universidade/mentor/feedback/`
**Descrição:** Enviar feedback sobre resposta

**Body:**
```json
{
  "id_mensagem": "uuid",
  "ds_tipo_feedback": "positivo",
  "ds_comentario": "Resposta clara e objetiva!"
}
```

**Response 200:**
```json
{
  "mensagem": "Obrigada pelo feedback! 💙"
}
```

### GET `/universidade/mentor/historico/`
**Descrição:** Histórico de conversas com Dra. Sophie

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "conversas": [
    {
      "id_conversa": "uuid",
      "ds_titulo": "Dúvida sobre microblading",
      "qt_mensagens": 8,
      "dt_ultima_mensagem": "2025-11-12T14:30:00Z",
      "preview": "Como fazer a técnica de microblading?"
    }
  ]
}
```

### POST `/universidade/mentor/modo-simulacao/`
**Descrição:** Ativar modo de simulação de casos clínicos

**Body:**
```json
{
  "nm_categoria": "Harmonização Facial", // opcional: filtrar casos
  "nm_dificuldade": "intermediario" // iniciante, intermediario, avancado
}
```

**Response 200:**
```json
{
  "id_simulacao": "uuid",
  "caso_clinico": {
    "ds_descricao": "Paciente feminino, 42 anos...",
    "ds_perguntas": "1. Qual procedimento? 2. Quantas unidades?..."
  },
  "instrucoes": "Digite suas respostas e receba feedback personalizado!"
}
```

---

## 12. Pipeline de Indexação de Conhecimento

### Processo de Criação de Embeddings

```python
# Script: scripts/indexar_cursos_rag.py

async def indexar_curso(id_curso: str):
    """Indexa todo o conteúdo de um curso no RAG"""

    # 1. Buscar todas as aulas do curso
    aulas = await db.query(
        "SELECT id_aula, ds_transcricao, ds_apostila FROM tb_universidade_aulas WHERE id_curso = $1",
        id_curso
    )

    for aula in aulas:
        # 2. Chunking: dividir texto em pedaços de ~400-600 caracteres
        chunks = chunkar_texto(
            texto=aula['ds_transcricao'] or aula['ds_apostila'],
            tamanho_chunk=500,
            overlap=100  # Sobreposição para manter contexto
        )

        for i, chunk in enumerate(chunks):
            # 3. Gerar embedding
            embedding = await gerar_embedding(chunk)

            # 4. Extrair metadata
            metadata = {
                "nm_curso": curso.nm_titulo,
                "nm_modulo": aula.nm_modulo,
                "nm_aula": aula.nm_titulo,
                "nm_instrutor": curso.nm_instrutor,
                "qt_ordem": i,
                "nm_tipo": "transcricao_aula"
            }

            # 5. Salvar no banco
            await db.execute(
                """INSERT INTO tb_universidade_knowledge_chunks
                   (id_curso, id_aula, ds_conteudo, embedding, ds_metadata, nm_categoria)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                id_curso, aula.id_aula, chunk, embedding, json.dumps(metadata), curso.nm_categoria
            )

    print(f"✅ Curso {id_curso} indexado com sucesso!")

# Executar para todos os cursos
async def indexar_todos_cursos():
    cursos = await db.query("SELECT id_curso FROM tb_universidade_cursos WHERE ds_status = 'publicado'")
    for curso in cursos:
        await indexar_curso(curso.id_curso)
```

### Atualização Incremental

```python
# Trigger: ao criar/editar aula, reindexar automaticamente
@router.put("/universidade/aulas/{id_aula}/")
async def atualizar_aula(id_aula: UUID, aula_update: AulaUpdate):
    # 1. Atualizar aula
    await aula_service.atualizar(id_aula, aula_update)

    # 2. Deletar chunks antigos
    await db.execute(
        "DELETE FROM tb_universidade_knowledge_chunks WHERE id_aula = $1",
        id_aula
    )

    # 3. Reindexar aula atualizada
    await indexar_aula(id_aula)

    return {"mensagem": "Aula atualizada e reindexada no RAG"}
```

---

## 13. Telas e Wireframes

### Tela 1: Chat com Dra. Sophie (Desktop)

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                                                  |
+----------------------------------------------------------+
|  ← Voltar aos Cursos                    Dra. Sophie 💬    |
|                                                            |
|  +----------------------------------------------------+   |
|  | [Avatar Sophie]  Dra. Sophie                       |   |
|  |                  Mentora IA - Online 🟢            |   |
|  +----------------------------------------------------+   |
|                                                            |
|  Hoje, 10:30                                               |
|  +----------------------------------------------------+   |
|  | 👩‍⚕️ Olá, João! 👋 Sou a Dra. Sophie, sua mentora  |   |
|  | de estética. Como posso te ajudar hoje?            |   |
|  |                                                    |   |
|  | 💡 Dica: Pergunte sobre o conteúdo dos seus cursos,|   |
|  | técnicas, produtos ou tire dúvidas!                |   |
|  |                                                    |   |
|  | Sugestões:                                         |   |
|  | [Como fazer fios de PDO?]                          |   |
|  | [Diferença entre ácido hialurônico e botox?]       |   |
|  | [Ajuda com minha última aula]                      |   |
|  +----------------------------------------------------+   |
|                                                            |
|  10:32                                                     |
|  +----------------------------------------------------+   |
|  | 👤 Como fazer a técnica de microblading?          |   |
|  +----------------------------------------------------+   |
|                                                            |
|  10:32                                                     |
|  +----------------------------------------------------+   |
|  | 👩‍⚕️ Ótima pergunta, João! 😊                      |   |
|  |                                                    |   |
|  | A técnica de microblading é um procedimento de     |   |
|  | implantação de pigmento que você está estudando    |   |
|  | no curso "Microblading Avançado".                  |   |
|  |                                                    |   |
|  | RESUMO DA TÉCNICA:                                 |   |
|  | 1. **Preparação**: Design da sobrancelha...        |   |
|  | [...]                                              |   |
|  |                                                    |   |
|  | 📚 Fonte: Curso "Microblading Avançado" →          |   |
|  |    Módulo "Técnicas Avançadas" → Aula aos 20:45   |   |
|  |                                                    |   |
|  | [Útil? 👍] [Não ajudou 👎]                         |   |
|  +----------------------------------------------------+   |
|                                                            |
|  [Digite sua pergunta...]                      [Enviar]   |
+----------------------------------------------------------+
```

### Tela 2: Notificação Proativa (Mobile)

**Layout:**
```
+---------------------------+
| 🔔 Nova mensagem          |
|---------------------------|
| 👩‍⚕️ Dra. Sophie           |
|                           |
| Oi João! 😊 Percebi que   |
| o quiz está difícil.      |
| Quer que eu explique os   |
| conceitos que mais        |
| caíram? Podemos revisar   |
| juntos! 📚                |
|                           |
| [Abrir Chat]  [Depois]    |
+---------------------------+
```

### Tela 3: Modo Simulação de Caso Clínico

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                     Simulador de Casos Clínicos |
+----------------------------------------------------------+
|  📋 CASO CLÍNICO #45                          [Nível: ⭐⭐] |
|                                                            |
|  Paciente: Feminino, 42 anos                               |
|  Queixa: Rugas profundas na região frontal e glabela       |
|  Histórico: Sem procedimentos estéticos prévios            |
|  Objetivo: Harmonização facial sutil, resultado natural    |
|                                                            |
|  PERGUNTAS:                                                |
|  1. Qual procedimento você recomendaria?                   |
|  2. Quantas unidades de toxina botulínica?                 |
|  3. Quais pontos de aplicação?                             |
|  4. Cuidados pós-procedimento?                             |
|                                                            |
|  +--------------------------------------------------+     |
|  | Sua Resposta:                                    |     |
|  | [______________________________________________] |     |
|  | [______________________________________________] |     |
|  | [______________________________________________] |     |
|  |                                                  |     |
|  |                            [Enviar Resposta] 📝 |     |
|  +--------------------------------------------------+     |
|                                                            |
|  Dica: Seja específico! Mencione dosagem, anatomia e      |
|  contraindicações.                                         |
+----------------------------------------------------------+
```

---

## 14. Critérios de Aceitação

### ✅ Funcionalidades Obrigatórias

1. **Resposta com RAG**
   - [ ] Busca vetorial retorna chunks relevantes (similaridade > 0.6)
   - [ ] LLM cita fonte (curso/aula) na resposta
   - [ ] Resposta streaming funciona (< 2s primeira palavra)

2. **Qualidade**
   - [ ] Taxa de feedback positivo > 80%
   - [ ] Taxa de "Não sei" < 15%
   - [ ] Respostas fora do escopo recusadas educadamente

3. **Funcionalidades Proativas**
   - [ ] Mensagens de celebração enviadas ao subir de nível
   - [ ] Sugestões de ajuda após 2 reprovações em quiz
   - [ ] Lembretes após 7 dias de inatividade

4. **Segurança**
   - [ ] Detecção de emergências médicas escalate para humano
   - [ ] Proibição de diagnósticos/prescrições respeitada
   - [ ] Rate limiting funciona (limite de mensagens/dia)

5. **Modo Tutor**
   - [ ] Pergunta socrática gerada corretamente
   - [ ] Feedback construtivo após resposta do aluno

---

## 15. Próximo Caso de Uso

1. **UC004 - Certificações Blockchain** - NFTs de certificados verificáveis

---

## 16. Histórico de Revisões

| Versão | Data       | Autor           | Descrição                 |
|--------|------------|-----------------|---------------------------|
| 1.0    | 13/11/2025 | Sistema DoctorQ | Criação inicial do UC003  |

---

**Documento gerado como parte do projeto DoctorQ - Universidade da Beleza**
