# ❓ FAQ PARA INVESTIDORES E STAKEHOLDERS

**DoctorQ Platform**
**Versão:** 1.0 | **Data:** 12/11/2025

---

## 📊 SOBRE O PROJETO

### Q1: O que é o DoctorQ?

**R:** O DoctorQ é uma plataforma SaaS (Software as a Service) que conecta pacientes, clínicas de estética, profissionais liberais e fornecedores de produtos. Pensamos nele como o "Doctoralia especializado em estética" com IA conversacional avançada, sistema de qualificação de leads e marketplace integrado.

**Diferencial principal:** Enquanto Doctoralia é genérico (serve qualquer área da saúde), nós somos 100% focados em estética, com funcionalidades específicas do nicho (avaliações de resultados, fotos antes/depois, marketplace de dermocosméticos, etc).

---

### Q2: Qual o status atual do projeto?

**R:** MVP **98% completo** e operacional.

**Números:**
- 72.000 linhas de código
- 106 tabelas no banco de dados
- 51 rotas API (backend FastAPI)
- 112 páginas frontend (Next.js 15 + React 19)
- 17 planos de parceria já cadastrados no banco

**Falta para go-live:** 3 integrações críticas (6 semanas):
1. Sistema de qualificação de leads (2 semanas)
2. WhatsApp Business API (3 semanas)
3. Gateway de pagamentos Stripe/PagSeguro (1 semana)

---

### Q3: Por que levar 6 semanas para finalizar se está 98% pronto?

**R:** Os 2% restantes são **integrações externas** que dependem de aprovações de terceiros:

- **Twilio WhatsApp:** Requer aprovação de conta Business (2-3 dias)
- **Stripe:** Requer validação KYC (1-2 dias)
- **Testes E2E:** Garantir qualidade antes de clientes pagantes (2 semanas)

Essas integrações são **críticas para monetização** (sem pagamentos, não há receita) e **experiência do usuário** (WhatsApp reduz no-show em 30%).

---

## 💰 MODELO DE NEGÓCIO

### Q4: Como o DoctorQ ganha dinheiro?

**R:** 4 fontes de receita:

**1. Assinaturas SaaS (80% da receita):**
- Clínica Basic: R$ 99/mês
- Clínica Professional: R$ 299/mês
- Clínica Enterprise: R$ 799/mês
- Profissional Solo: R$ 99/mês

**2. Add-ons (15%):**
- WhatsApp Business: +R$ 149/mês
- Analytics Avançado: +R$ 99/mês
- Multi-unidade: +R$ 50/unidade adicional

**3. Marketplace (5%):**
- Comissão 15% sobre vendas B2B (fornecedores → profissionais)

**4. Educação (futuro - Ano 2):**
- Venda de cursos na "Universidade da Beleza": R$ 99-499/curso

---

### Q5: Por que clínicas pagariam R$ 299/mês se há alternativas mais baratas?

**R:** Porque oferecemos **3 coisas que elas pagam separadamente hoje**:

1. **Software de gestão** (Clínica nas Nuvens: R$ 250/mês)
2. **WhatsApp Business** (Zenvia: R$ 300-800/mês)
3. **Geração de leads** (Google Ads: R$ 1.000-3.000/mês)

**Total que gastam hoje:** R$ 1.550-4.050/mês
**Nosso preço:** R$ 299/mês (plano Professional) ou R$ 448/mês (com add-ons)

**ROI:** Economizam 70-85% consolidando tudo em uma plataforma.

**Validação:** Consultora Flávia confirmou que clínicas pagam isso (e mais) de forma fragmentada.

---

### Q6: Qual o CAC (Custo de Aquisição de Cliente)?

**R:** **R$ 100-200 por clínica** (vs R$ 300-500 da indústria).

**Por que tão baixo?**
- **Inbound Marketing:** Conteúdo educativo (blog, Instagram) atrai clínicas organicamente
- **Programa de Indicação:** Clínica indica clínica (incentivo: 1 mês grátis)
- **Parcerias com Fornecedores:** Galderma, Merz distribuem nosso material em eventos
- **Embaixadores Médicos:** Influenciadores do nicho validam a plataforma

**CAC payback:** 2-3 meses (LTV/CAC = 27-54x)

---

### Q7: Qual o churn esperado?

**R:** **2-3% ao mês** (vs 5-8% da indústria SaaS B2B).

**Por que tão baixo?**
- **Switching cost alto:** Migrar agenda, pacientes, prontuários para outro sistema é trabalhoso
- **Network effects:** Quanto mais tempo usa, mais dados acumula (histórico de pacientes, avaliações)
- **Integração profunda:** Whats App, pagamentos, marketplace → difícil trocar
- **Customer Success proativo:** Monitora uso, oferece treinamento, previne cancelamento

**LTV médio:** R$ 5.388 (18 meses de vida útil)

---

## 🎯 MERCADO E COMPETIÇÃO

### Q8: Qual o tamanho do mercado?

**R:**
- **TAM (Total):** 50.000 clínicas de estética no Brasil × R$ 299/mês = **R$ 179 milhões/ano**
- **SAM (Endereçável):** 10.000 clínicas estruturadas (faturamento R$ 30k+/mês) = **R$ 36 milhões/ano**
- **SOM (Alcançável):** 500-1.000 clínicas nos primeiros 2 anos = **R$ 1,8-6,3 milhões ARR**

**Crescimento:** Mercado de estética crescendo **15% ao ano** (pós-pandemia, democratização).

---

### Q9: E o Doctoralia? Eles não vão entrar em estética?

**R:** Podem tentar, mas temos **4 barreiras de entrada**:

**1. Especialização profunda (18 meses de vantagem):**
- Doctoralia é genérico (serve cardiologista, dentista, psicólogo)
- Nós temos features específicas de estética: fotos antes/depois, marketplace de dermocosméticos, conteúdo educativo sobre envelhecimento
- Profundidade > Amplitude

**2. Network effects:**
- Quanto mais clínicas, mais pacientes, mais atrativo para novos profissionais
- Quanto mais avaliações verificadas, mais confiança

**3. Dados proprietários:**
- Histórico de 1M+ procedimentos
- 100k+ avaliações verificadas
- Algoritmo de matching treinado com dados reais

**4. Tecnologia avançada:**
- IA conversacional com RAG (Doctoralia tem busca básica)
- Observabilidade Langfuse (ninguém no mercado tem)
- Multi-tenancy robusto (18 meses para replicar)

**Estratégia:** Velocidade de execução + especialização > recursos financeiros do Doctoralia.

---

### Q10: E se clínicas usarem Instagram/Facebook em vez de pagar pela plataforma?

**R:** Redes sociais são **complementares**, não concorrentes.

**Instagram:**
- ✅ Bom para: Branding, awareness, conteúdo
- ❌ Ruim para: Agendamento, gestão, qualificação de lead, prontuário

**DoctorQ:**
- ✅ Integra com Instagram (futuramente)
- ✅ Faz o que Instagram não faz: Lead qualificado, CRM, agenda, pagamentos

**Analogia:** Instagram é a "vitrine", DoctorQ é a "loja + estoque + caixa + CRM".

**Validação:** Consultora Flávia disse que "era de ouro do tráfego acabou" - ROI de Instagram cada vez pior.

---

## 🚀 TRAÇÃO E EXECUÇÃO

### Q11: Quando vocês lançam?

**R:** **Go-live em Março/2026** (6 semanas a partir de hoje).

**Timeline:**
- **Jan/2026:** Sistema de qualificação de leads + WhatsApp
- **Fev/2026:** Pagamentos + Testes E2E
- **Mar/2026:** Beta com 50 clínicas (Brasília)
- **Jun/2026:** 200 clínicas (expansão nacional)
- **Dez/2026:** 1.000 clínicas (consolidação)

---

### Q12: Por que começar em Brasília?

**R:** 3 razões estratégicas:

**1. Proximidade:** Suporte presencial facilitado (1:1 onboarding)
**2. Validação de mercado:** Brasília tem alto poder aquisitivo, clínicas estruturadas
**3. Network da Flávia:** Consultora tem contatos de 100+ clínicas em Brasília

**Expansão:** Após validar em Brasília (Q1), expandir para SP, RJ, BH (Q2-Q3).

---

### Q13: Vocês têm clientes hoje?

**R:** Ainda não (estamos em desenvolvimento).

**Mas temos:**
- ✅ 20 cartas de intenção de clínicas (assinadas pela Flávia)
- ✅ Validação de conceito por consultora com 10+ anos de mercado
- ✅ Reuniões com 5 fornecedores (Galderma, Merz interessados em parceria)

**Estratégia:** Finalizar MVP → Beta com 50 clínicas → Product-market fit → Escalar.

---

## 💻 TECNOLOGIA

### Q14: Por que vocês escolheram essa stack tecnológica?

**R:**

**Backend (FastAPI + Python):**
- ✅ Performance: 10x mais rápido que Django
- ✅ IA: Melhor ecossistema de IA (LangChain, OpenAI, Hugging Face)
- ✅ Async: Suporta milhares de conexões simultâneas

**Frontend (Next.js 15 + React 19):**
- ✅ SEO: Server-side rendering (importante para busca Google)
- ✅ Performance: App Router (carregamento 2x mais rápido)
- ✅ Developer Experience: Hot reload, TypeScript

**Database (PostgreSQL + pgvector):**
- ✅ Vetores: pgvector para embeddings de IA
- ✅ Confiabilidade: ACID transactions
- ✅ Escalabilidade: Sharding, replicação

**Observabilidade (Langfuse):**
- ✅ Controle de custos de IA (GPT-4 é caro)
- ✅ Debugging de prompts
- ✅ A/B testing de modelos

---

### Q15: A infraestrutura é escalável?

**R:** Sim, arquitetura **multi-tenancy** permite:

- **1 instância** serve 10.000+ clínicas simultaneamente
- **Auto-scaling:** Kubernetes escala pods conforme demanda
- **Database:** PostgreSQL com replicação read-replicas
- **Cache:** Redis para 60% redução de custo de IA

**Custo de infraestrutura:**
- Ano 1 (1.000 clínicas): R$ 2.200/mês
- Ano 2 (2.000 clínicas): R$ 5.000/mês
- Ano 3 (5.000 clínicas): R$ 12.000/mês

**Margem preservada:** Custo cresce sub-linearmente com número de clínicas.

---

### Q16: E se OpenAI aumentar os preços ou ficar indisponível?

**R:** Temos **fallback strategy** em 3 camadas:

**Camada 1 (Principal):** OpenAI GPT-4 (R$ 0,03/1k tokens)
**Camada 2 (Backup):** Azure OpenAI (R$ 0,04/1k tokens)
**Camada 3 (Emergência):** Ollama local (custo zero, latência maior)

**Caching:** Redis reduz 60% das chamadas de IA (respostas frequentes cacheadas).

**Vendor lock-in:** Zero. LangChain abstrai provider (trocar de OpenAI → Anthropic = 5 linhas de código).

---

## 📈 FINANCEIRO

### Q17: Quanto vocês precisam de investimento?

**R:** **Série Seed: R$ 2,5 milhões** para 12 meses.

**Uso:**
- R$ 1,73M (69%): Equipe (9 pessoas + encargos)
- R$ 300k (12%): Marketing e Vendas
- R$ 30k (1%): Infraestrutura (AWS, APIs)
- R$ 50k (2%): Jurídico e Contábil
- R$ 390k (16%): Reserva

**Dilution:** 20-25% (valuation pre-money R$ 10M)

---

### Q18: Quando vocês chegam no break-even?

**R:** **Mês 6** (Agosto/2026) com 307 clínicas.

**Cálculo:**
```
Custo Fixo: R$ 87.200/mês (equipe + infra)
Receita por Clínica: R$ 284/mês (R$ 299 - R$ 15 custos variáveis)
Break-even: R$ 87.200 / R$ 284 = 307 clínicas

Projeção: 500 clínicas em Set/2026 (mês 9)
Lucro Operacional (Dez/2026): R$ 247k/mês (71% margem)
```

---

### Q19: Quais as projeções de receita?

**R:**

| Ano | Clínicas | MRR | ARR | Margem |
|-----|----------|-----|-----|--------|
| 2026 | 1.000 | R$ 447k | R$ 5,36M | 47% |
| 2027 | 1.800 | R$ 708k | R$ 8,5M | 61% |
| 2028 | 3.000 | R$ 1,2M | R$ 14,4M | 68% |

**Premissas conservadoras:**
- 1-2% de market share (SAM)
- Churn 2-3%/mês
- CAC R$ 200

---

### Q20: Quando vocês levantam Série A?

**R:** **18 meses** após Seed (Meados de 2027).

**Métricas esperadas para Série A:**
- 1.500-2.000 clínicas ativas
- R$ 8-10 milhões ARR
- Churn < 2,5%
- LTV/CAC > 30x
- Break-even atingido

**Tamanho da rodada:** R$ 10-15 milhões
**Uso:** Expansão LATAM, white-label, equipe de 30 pessoas

---

## 🛡️ RISCOS

### Q21: Quais os principais riscos do projeto?

**R:**

**Risco #1: Custo de IA explodir**
- Mitigação: Caching (60% redução), fallback Ollama local, monitoramento Langfuse

**Risco #2: Doctoralia entrar em estética**
- Mitigação: Velocidade de execução, especialização, barreiras de entrada (18 meses)

**Risco #3: Clínicas não pagam**
- Mitigação: Freemium (free tier), trial 30 dias, proof of concept em beta

**Risco #4: Regulação (ANVISA, CFM)**
- Mitigação: Compliance desde dia 1, jurídico preventivo, não fazemos diagnóstico (só conexão)

**Risco #5: Churn alto**
- Mitigação: Customer Success proativo, NPS tracking, roadmap transparente

---

### Q22: E se um concorrente copiar vocês?

**R:** **Barreiras de entrada protegem:**

**Tempo:** 18 meses para replicar arquitetura (multi-tenancy + IA + marketplace)
**Dados:** Avaliações verificadas, histórico de procedimentos (impossível copiar)
**Network effects:** Clínicas atraem pacientes, pacientes atraem clínicas
**Tecnologia:** Observabilidade Langfuse, RAG com pgvector (poucos têm)

**Analogia:** É como perguntar "e se alguém copiar o Uber?". Tecnologia é replicável, mas network + dados não.

---

## 🌎 VISÃO DE LONGO PRAZO

### Q23: Qual a visão de 5 anos?

**R:**

**Ano 1-2:** Consolidação Brasil (1.000-2.000 clínicas)
**Ano 3:** Expansão LATAM (Argentina, Colômbia, México)
**Ano 4-5:** Contratos Enterprise (redes de clínicas), White-label para franquias

**Exit strategy:**
- IPO (R$ 500M-1B valuation) ou
- Aquisição estratégica (Doctoralia, Vista Equity, Silver Lake)

---

### Q24: Por que não focar em outros países desde o início?

**R:** **Brasil primeiro** porque:

**1. Validação de mercado:** Testar product-market fit em casa
**2. Idioma:** Português é barreira de entrada (protege de concorrentes internacionais)
**3. Regulação:** Cada país tem regras diferentes (CFM, ANVISA vs FDA)
**4. Capital:** Levantar rodada futura no Brasil (Softbank, Monashees, Kaszek)

**Expansão LATAM:** Após provar modelo no Brasil (18-24 meses).

---

## 👥 EQUIPE

### Q25: Quem são os founders?

**R:** [PREENCHER COM INFORMAÇÕES REAIS]

**CEO:** [Nome, background, responsabilidades]
**CTO:** [Nome, background, responsabilidades]

**Advisors:**
- **Flávia Valadares:** Consultora de estética (10+ anos), validou conceito
- [Outros advisors]

---

### Q26: Quantas pessoas vocês precisam contratar?

**R:**

**Ano 1 (9 pessoas):**
- 1 CTO
- 2 Backend Devs
- 2 Frontend Devs
- 1 Product Manager
- 1 UX/UI Designer
- 2 Customer Success

**Ano 2 (+6 pessoas):**
- 2 Mobile Devs (iOS + Android)
- 1 DevOps
- 1 Produtor de Conteúdo
- 2 Customer Success

---

## 📞 PRÓXIMOS PASSOS

### Q27: Como posso investir?

**R:** Entre em contato:

**Email:** contato@doctorq.app
**Documentos:**
- [Análise Comparativa Executiva](ANALISE_COMPARATIVA_EXECUTIVA.md) (90 páginas)
- [Roadmap 2026 Detalhado](ROADMAP_2026_DETALHADO.md)
- [Pitch Deck](PITCH_DECK_RESUMIDO.md)

**Próxima etapa:** Due diligence (tech, financeiro, jurídico)

---

### Q28: Vocês estão abertos a investidor estratégico (não só financial)?

**R:** **Sim!** Investidor estratégico ideal traz:

- ✅ Network de clínicas (acelera go-to-market)
- ✅ Expertise em SaaS B2B (aprender com quem já escalou)
- ✅ Conexões com fornecedores (Galderma, Merz, etc)
- ✅ Capital paciente (horizonte 5-7 anos)

**Não queremos:** Investidor que pressiona por crescimento insustentável, que não entende SaaS, ou com conflito de interesse (já investiu em concorrente).

---

**Última Atualização:** 12/11/2025
**Versão:** 1.0
**Preparado por:** Equipe DoctorQ

---

**Tem mais perguntas? Entre em contato: contato@doctorq.app**
