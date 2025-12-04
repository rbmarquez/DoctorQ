# Documentação de Arquitetura - DoctorQ

> **Diretório de Documentação de Referência Permanente**

Este diretório contém apenas documentos de apoio permanentes. Não crie novos arquivos aqui para documentar implementações!

---

## 📚 Documentos Disponíveis

### 1. **CHANGELOG.md** 🔥 ATUALIZAR SEMPRE
**Propósito:** Histórico único de todas as mudanças no sistema.

**Quando usar:**
- ✅ Ao finalizar QUALQUER implementação
- ✅ Adicionar nova entrada no topo do arquivo
- ✅ Seguir o template definido

**NÃO criar novos `.md` para documentar features!**

---

### 2. **GUIA_PADROES.md** 📖 CONSULTAR SEMPRE
**Propósito:** Padrões, convenções de nomenclatura e tipagens.

**Quando usar:**
- ✅ ANTES de implementar qualquer feature
- ✅ Para conferir nomenclaturas de banco de dados
- ✅ Para conferir padrões de backend (Python/FastAPI)
- ✅ Para conferir padrões de frontend (Next.js/React)
- ✅ Para conferir estrutura de APIs

**Conteúdo:**
- Convenções de nomenclatura (tb_, id_, nm_, ds_, etc.)
- Padrões de banco de dados (PK, FK, índices)
- Padrões de backend (routes, services, models)
- Padrões de frontend (componentes, hooks, types)
- Checklist de implementação

---

### 3. **DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md** 🏗️
**Propósito:** Arquitetura geral do sistema.

**Conteúdo:**
- Stack tecnológica completa
- Estrutura de pastas (backend + frontend)
- Padrões arquiteturais
- Fluxos de dados
- Integrações
- Estatísticas do projeto

**Quando consultar:**
- Para entender a arquitetura geral
- Para novos desenvolvedores (onboarding)
- Para decisões arquiteturais

---

### 4. **MAPEAMENTO_ROTAS_FRONTEND.md** 🗺️
**Propósito:** Mapa completo das rotas do Next.js.

**Conteúdo:**
- 112 páginas mapeadas
- Estrutura de grupos de rotas
- Páginas por perfil (admin, paciente, profissional)
- Status de implementação

**Quando consultar:**
- Para verificar rotas existentes
- Para adicionar novas páginas
- Para entender navegação do app

---

### 5. **MODELAGEM_DADOS_COMPLETA.md** 🗄️
**Propósito:** Schema completo do banco de dados.

**Conteúdo:**
- 106 tabelas documentadas
- Relacionamentos entre tabelas
- Índices e constraints
- Convenções de nomenclatura

**Quando consultar:**
- Para entender modelo de dados
- Para adicionar novas tabelas
- Para criar relacionamentos

---

### 6. **ROADMAP_EVOLUCOES_FUTURAS.md** 🚀
**Propósito:** Planejamento de features futuras.

**Conteúdo:**
- Features planejadas por trimestre
- Prioridades
- Estimativas de esforço
- Dependências

**Quando consultar:**
- Para ver o que está planejado
- Para priorizar trabalho
- Para evitar duplicação de esforço

---

### 7. **ANALISE_VIABILIDADE_MOBILE.md** 📱
**Propósito:** Análise de viabilidade para app mobile.

**Conteúdo:**
- Estratégias possíveis (PWA, React Native, Flutter)
- Prós e contras de cada abordagem
- Recomendação técnica

---

## 🚫 O Que NÃO Fazer

❌ **NÃO criar** novos arquivos `.md` para documentar implementações
❌ **NÃO criar** relatórios de sessão
❌ **NÃO criar** summaries de features
❌ **NÃO duplicar** informações entre documentos

## ✅ Fluxo de Trabalho Correto

```
1. Ler GUIA_PADROES.md (antes de implementar)
   ↓
2. Implementar a feature seguindo os padrões
   ↓
3. Testar (build, lint, testes manuais)
   ↓
4. Atualizar CHANGELOG.md (adicionar entrada no topo)
   ↓
5. Commit e push
```

## 📁 Estrutura de Diretórios

```
DoctorQ/
├── DOC_Arquitetura/              # Você está aqui!
│   ├── README.md                 # Este arquivo
│   ├── CHANGELOG.md              # ← Atualizar sempre
│   ├── GUIA_PADROES.md           # ← Consultar sempre
│   ├── DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md
│   ├── MAPEAMENTO_ROTAS_FRONTEND.md
│   ├── MODELAGEM_DADOS_COMPLETA.md
│   ├── ROADMAP_EVOLUCOES_FUTURAS.md
│   └── ANALISE_VIABILIDADE_MOBILE.md
│
└── DOC_Executadas/               # Histórico de docs antigos
    └── (documentos de sessões anteriores)
```

---

## 🤖 Para Claude Code

**Instruções especiais:**

1. **Antes de qualquer implementação:**
   - Leia `GUIA_PADROES.md` para conferir padrões
   - Verifique `ROADMAP_EVOLUCOES_FUTURAS.md` se a feature está planejada

2. **Ao finalizar implementação:**
   - **NÃO CRIE** novo arquivo `.md`
   - **ATUALIZE** apenas `CHANGELOG.md`
   - Adicione entrada no topo seguindo o template

3. **Nunca:**
   - Criar arquivos como `IMPLEMENTACAO_X.md`
   - Criar relatórios de sessão
   - Duplicar conteúdo entre documentos

---

**Última atualização:** 02/11/2025
**Versão da política:** 1.0
