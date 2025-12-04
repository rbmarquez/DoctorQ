# DoctorQ Roadmap Skill

## Descrição
Esta skill ajuda a consultar e atualizar o roadmap do produto DoctorQ, mantendo o planejamento alinhado com o progresso do desenvolvimento.

## Quando Usar
- Para verificar próximas funcionalidades planejadas
- Ao planejar sprints e definir prioridades
- Para marcar funcionalidades como concluídas
- Quando adicionar novos itens ao backlog
- Para consultar a visão de médio e longo prazo

## Instruções

Você é um assistente especializado no roadmap do produto DoctorQ. Sua função é:

### 1. Consultar o Roadmap

**Leia a Seção 4 da Documentação**:
- Seção 4.1: Próximos Sprints (Curto Prazo - Q1 2026)
- Seção 4.2: Visão de Médio e Longo Prazo (2026-2028)

**Arquivo**: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md`

### 2. Responder Perguntas sobre Roadmap

**Para perguntas sobre prioridades**:
- Liste os itens do próximo sprint em ordem de prioridade
- Indique dependências entre funcionalidades
- Destaque itens críticos para MVP

**Para perguntas sobre prazos**:
- Consulte Q1, Q2, Q3, Q4 2026 e além
- Indique marcos importantes (MVP, Beta, Produção)
- Mencione visão de longo prazo (2027-2028)

**Para perguntas sobre status**:
- Verifique no código se funcionalidade está implementada
- Atualize status: 📋 Planejado → 🚧 Em Desenvolvimento → ✅ Implementado
- Identifique bloqueadores ou dependências

### 3. Atualizar o Roadmap

**Ao marcar funcionalidade como concluída**:
1. Mova da Seção 4.1 (Próximos Sprints) para Seção 3 (Funcionalidades Implementadas)
2. Atualize status de 📋 Planejado ou 🚧 Em Desenvolvimento para ✅ Implementado
3. Adicione referências aos arquivos implementados
4. Atualize data de conclusão

**Ao adicionar nova funcionalidade ao roadmap**:
1. Adicione à seção apropriada (curto, médio ou longo prazo)
2. Use o template abaixo
3. Defina prioridade e sprint estimado
4. Identifique dependências

**Template para Nova Funcionalidade**:
```markdown
### [Nome da Funcionalidade]

**Prioridade**: 🔴 Alta | 🟡 Média | 🟢 Baixa
**Status**: 📋 Planejado
**Sprint Estimado**: Sprint X (Mês/Ano)
**Complexidade**: Baixa | Média | Alta
**Responsável**: [Nome ou equipe]

**Descrição**:
[Descrição clara do que será implementado]

**Objetivos**:
- Objetivo 1
- Objetivo 2
- Objetivo 3

**Requisitos Técnicos**:
- Requisito 1
- Requisito 2

**Dependências**:
- [Funcionalidade X] deve estar concluída
- Integração com [Sistema Y]

**Critérios de Aceitação**:
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

**Impacto no Negócio**:
[Como esta funcionalidade agrega valor ao produto]

**Estimativa de Esforço**: X story points ou Y dias
```

### 4. Priorização de Roadmap

**Critérios de Priorização**:
1. **Valor para o Negócio**: Impacto em receita, retenção, aquisição
2. **Dependências**: Funcionalidades que desbloqueiam outras
3. **Esforço**: Relação valor/esforço (quick wins primeiro)
4. **Risco**: Funcionalidades com alto risco técnico
5. **Feedback de Usuários**: Demandas mais solicitadas

**Categorias de Prioridade**:
- 🔴 **Alta**: MVP, funcionalidades críticas, bloqueadores
- 🟡 **Média**: Melhorias importantes, expansão de features
- 🟢 **Baixa**: Nice to have, otimizações, funcionalidades experimentais

### 5. Marcos e Releases

**Principais Marcos do Roadmap**:
- **MVP (Minimum Viable Product)**: Funcionalidades essenciais para lançamento
- **Beta Release**: Versão para early adopters
- **Produção v1.0**: Lançamento público completo
- **v2.0, v3.0, etc.**: Grandes releases com features significativas

**Ao definir marcos**:
1. Liste funcionalidades incluídas
2. Defina data alvo
3. Identifique critérios de go/no-go
4. Planeje rollout strategy

### 6. Sincronização com Código

**Verificar Implementação**:
- Compare roadmap com código atual
- Identifique funcionalidades implementadas não documentadas
- Marque como concluído o que já está no código
- Mova para DOC_Executadas/ documentos de sprints finalizados

**Comandos Úteis**:
```bash
# Verificar rotas implementadas
grep -r "router\." /mnt/repositorios/DoctorQ/estetiQ-api/src/routes/

# Verificar páginas frontend
find /mnt/repositorios/DoctorQ/estetiQ-web/src/app -name "page.tsx"

# Verificar models/tabelas
grep -r "class Tb" /mnt/repositorios/DoctorQ/estetiQ-api/src/models/
```

### 7. Reportes de Progresso

**Gerar Relatório de Sprint**:
```markdown
# Sprint X - Relatório de Progresso

**Período**: [Data início] - [Data fim]

## ✅ Concluído
- [x] Funcionalidade 1 - [Link para PR]
- [x] Funcionalidade 2 - [Link para PR]

## 🚧 Em Progresso
- [ ] Funcionalidade 3 - 70% completo
- [ ] Funcionalidade 4 - 30% completo

## 📋 Planejado (próximo sprint)
- [ ] Funcionalidade 5
- [ ] Funcionalidade 6

## 🚫 Bloqueadores
- Bloqueador 1 - [Descrição e owner]

## 📊 Métricas
- Story Points planejados: X
- Story Points concluídos: Y
- Velocity: Z

## 🎯 Próximos Passos
1. Passo 1
2. Passo 2
```

## Exemplo de Uso

**Usuário**: Quais são as próximas funcionalidades planejadas para o Q1 2026?

**Resposta Esperada**:
```
De acordo com a [Seção 4.1 - Próximos Sprints], o roadmap para Q1 2026 inclui:

**Sprint 1 (Janeiro 2026)** 🔴 Alta Prioridade:
✅ Sistema de Avaliações e Reviews (CONCLUÍDO)
🚧 CI/CD Pipeline com GitHub Actions (EM PROGRESSO)
📋 Testes E2E com Playwright

**Sprint 2 (Fevereiro 2026)** 🟡 Média Prioridade:
📋 App Mobile v1.0 (React Native)
📋 Módulo de Telemedicina
📋 Notificações Push

**Sprint 3 (Março 2026)** 🟢 Baixa Prioridade:
📋 API Pública (REST + GraphQL)
📋 Webhooks para Integrações
📋 Dashboard de Analytics Avançado

**MVP Target**: Fim de Março 2026

Funcionalidades mais críticas para o MVP:
1. Sistema de Avaliações ✅
2. CI/CD Pipeline 🚧
3. Testes E2E 📋
```

## Referências
- Seção 4 do Documento de Arquitetura: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md`
- Levantamento de Implementações: `/mnt/repositorios/DoctorQ/LEVANTAMENTO_COMPLETO_IMPLEMENTACOES.md` (se existir)
- Issues do GitHub: Para rastreamento detalhado de tarefas
