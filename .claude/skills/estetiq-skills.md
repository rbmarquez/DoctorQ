# DoctorQ Skills Index

## Descrição
Esta skill lista todas as Skills disponíveis para o projeto DoctorQ e ajuda a escolher a skill apropriada para cada tarefa.

## Quando Usar
- Quando não souber qual skill usar
- Para ver todas as capacidades disponíveis
- Ao aprender sobre o sistema de skills
- Para descobrir novas funcionalidades

## Instruções

Você é um assistente que conhece todas as Skills do DoctorQ. Sua função é:

### 1. Listar Skills Disponíveis

Quando solicitado, liste todas as skills com descrição breve:

```markdown
# Skills Disponíveis - DoctorQ

## 🏗️ Arquitetura e Documentação

### doctorq-arch
**Consulta rápida de arquitetura técnica**
- Stack tecnológico
- Fluxos de dados
- Integrações
- Decisões arquiteturais

**Exemplo**: "Como funciona o sistema de autenticação?"

---

### doctorq-doc-update
**Atualização de documentação após implementações**
- Sincroniza código com docs
- Move arquivos para DOC_Executadas/
- Atualiza estatísticas
- Mantém consistência

**Exemplo**: "Atualiza a documentação após implementar módulo X"

---

## 📅 Planejamento

### doctorq-roadmap
**Gestão de roadmap e sprints**
- Consulta funcionalidades planejadas
- Atualiza status de implementações
- Gerencia prioridades
- Visão de longo prazo

**Exemplo**: "Quais funcionalidades vêm no Q1 2026?"

---

## 👥 Onboarding

### doctorq-onboarding
**Guia completo para novos desenvolvedores**
- Setup de ambiente
- Tour pelo código
- Primeiro desenvolvimento
- Processos e padrões

**Exemplo**: "Sou novo no projeto, como começo?"

---

## 🔍 Auditoria e Validação

### doctorq-api-check
**Auditoria de rotas da API**
- Verifica rotas documentadas
- Valida Swagger/OpenAPI
- Identifica inconsistências
- Gera relatórios

**Exemplo**: "Verifica se todas as APIs estão documentadas"

---

### doctorq-frontend-routes
**Mapeamento de páginas do frontend**
- Lista todas as páginas Next.js
- Atualiza MAPEAMENTO_ROTAS_FRONTEND.md
- Valida proteção de rotas
- Verifica navegação

**Exemplo**: "Mapeia as rotas do frontend"

---

### doctorq-db-schema
**Validação de schema do banco**
- Verifica consistência com models
- Valida migrations
- Documenta tabelas
- Otimização de performance

**Exemplo**: "Valida o schema do banco de dados"

---
```

### 2. Recomendar Skill Apropriada

Baseado na pergunta do usuário, recomende a skill mais adequada:

**Padrões de Reconhecimento**:

| Pergunta do Usuário | Skill Recomendada |
|---------------------|-------------------|
| "Como funciona...", "Explica...", "Qual é a arquitetura..." | doctorq-arch |
| "Atualiza a documentação", "Sincroniza docs" | doctorq-doc-update |
| "O que vem no próximo sprint", "Roadmap", "Prioridades" | doctorq-roadmap |
| "Como começar", "Setup", "Onboarding", "Sou novo" | doctorq-onboarding |
| "Verifica APIs", "Audita rotas", "Endpoints documentados" | doctorq-api-check |
| "Páginas do frontend", "Rotas Next.js", "Mapeia rotas" | doctorq-frontend-routes |
| "Schema do banco", "Valida tabelas", "Migrations", "Database" | doctorq-db-schema |

### 3. Sugerir Fluxos de Trabalho

**Fluxo: Nova Funcionalidade Implementada**
```
1. doctorq-api-check → Verifica se rotas estão OK
2. doctorq-frontend-routes → Mapeia novas páginas
3. doctorq-doc-update → Atualiza documentação
4. doctorq-roadmap → Marca como concluído
```

**Fluxo: Preparação para Release**
```
1. doctorq-api-check → Auditoria de APIs
2. doctorq-frontend-routes → Auditoria de rotas
3. doctorq-db-schema → Validação de schema
4. doctorq-doc-update → Documentação completa
```

**Fluxo: Novo Desenvolvedor**
```
1. doctorq-onboarding → Setup inicial
2. doctorq-arch → Entender arquitetura
3. doctorq-roadmap → Ver o que está sendo feito
4. [Primeiro desenvolvimento]
```

**Fluxo: Mudança no Banco de Dados**
```
1. doctorq-db-schema → Criar migration
2. doctorq-db-schema → Validar schema
3. doctorq-doc-update → Documentar mudança
```

**Fluxo: Auditoria Completa**
```
1. doctorq-api-check → APIs
2. doctorq-frontend-routes → Frontend
3. doctorq-db-schema → Database
4. doctorq-arch → Arquitetura
5. doctorq-doc-update → Consolidar documentação
```

### 4. Ajudar na Escolha

Se o usuário não souber qual skill usar, faça perguntas:

```
Para te ajudar melhor, me diga:

1. **Tipo de Tarefa**:
   - [ ] Consulta/Aprendizado
   - [ ] Implementação/Desenvolvimento
   - [ ] Auditoria/Validação
   - [ ] Planejamento
   - [ ] Documentação

2. **Área do Projeto**:
   - [ ] Backend (API)
   - [ ] Frontend (Web)
   - [ ] Banco de Dados
   - [ ] Arquitetura Geral
   - [ ] Processos/Fluxos

3. **Objetivo**:
   - [ ] Entender como algo funciona
   - [ ] Implementar algo novo
   - [ ] Verificar/validar existente
   - [ ] Planejar futuro
   - [ ] Onboarding/aprendizado

Com base nas respostas, recomendarei a(s) skill(s) mais adequada(s).
```

### 5. Quick Reference

**Comandos Rápidos por Contexto**:

**Acabei de implementar algo**:
→ `doctorq-doc-update` + `doctorq-roadmap`

**Quero entender o código**:
→ `doctorq-arch`

**Sou novo no projeto**:
→ `doctorq-onboarding`

**Vou lançar uma versão**:
→ `doctorq-api-check` + `doctorq-frontend-routes` + `doctorq-db-schema`

**Mudei o banco de dados**:
→ `doctorq-db-schema` + `doctorq-doc-update`

**Planejamento de sprint**:
→ `doctorq-roadmap`

**Adicionei novas páginas**:
→ `doctorq-frontend-routes` + `doctorq-doc-update`

**Adicionei novas APIs**:
→ `doctorq-api-check` + `doctorq-doc-update`

## Exemplo de Uso

**Usuário**: Quais skills estão disponíveis?

**Resposta**:
```
# 🛠️ Skills do DoctorQ

Temos **7 skills especializadas** para te ajudar:

## 📚 Consulta e Aprendizado
- **doctorq-arch**: Arquitetura e documentação técnica
- **doctorq-onboarding**: Guia para novos desenvolvedores

## 📋 Planejamento
- **doctorq-roadmap**: Gestão de roadmap e sprints

## 🔍 Auditoria
- **doctorq-api-check**: Validação de APIs
- **doctorq-frontend-routes**: Mapeamento de rotas frontend
- **doctorq-db-schema**: Validação de schema do banco

## 📝 Documentação
- **doctorq-doc-update**: Atualização de documentação

O que você gostaria de fazer?
```

**Usuário**: Não sei qual usar para adicionar uma nova tabela no banco

**Resposta**:
```
Para adicionar uma nova tabela no banco, recomendo este fluxo:

1. **doctorq-db-schema**:
   - Te ajudará a criar o model seguindo padrões do DoctorQ
   - Gerará a migration Alembic
   - Validará o schema após aplicar

2. **doctorq-doc-update**:
   - Atualizará a documentação com a nova tabela
   - Registrará nas estatísticas do projeto

Quer que eu te guie pelo processo?
```

## Referências

- Diretório de Skills: `/mnt/repositorios/DoctorQ/.claude/skills/`
- README das Skills: [README.md](.claude/skills/README.md)
- Documentação: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/`
