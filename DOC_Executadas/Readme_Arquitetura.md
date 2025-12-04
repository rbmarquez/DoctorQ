# 📐 Documentação de Arquitetura - DoctorQ Platform

Este diretório contém toda a documentação de arquitetura do projeto DoctorQ.

## 📁 Arquivos Disponíveis

### 1. [DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md](./DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)

**Documento Principal de Arquitetura** (1.917 linhas)

Documento completo e detalhado que abrange:

#### **1. Visão Geral e Estratégia de Negócio**
- Resumo Executivo
- Visão de Produto 2027
- Modelo de Negócio (5 fontes de receita)
- Personas de Usuário (Paciente, Profissional, Fornecedor)

#### **2. Arquitetura da Solução Técnica**
- Diagrama de Arquitetura ASCII
- Stack Tecnológico Completo (Frontend + Backend + IA)
- Fluxo de Dados (2 casos de uso detalhados)
- APIs e Integrações (53 rotas backend + 6 integrações externas)

#### **3. Funcionalidades Implementadas**
- Módulo de Pacientes (agendamento, busca, perfil)
- Módulo de Profissionais (agenda, chat, portfolio)
- Módulo de Marketplace (e-commerce completo)
- Chatbot com IA (RAG + LangChain)

#### **4. Roadmap de Produto**
- Próximos Sprints (Q1 2026): MVP, testes, CI/CD
- Visão de Médio Prazo (Q2-Q4 2026): App mobile, telemedicina, API pública
- Visão de Longo Prazo (2027-2028): IA avançada, expansão internacional

#### **5. Guias e Documentação Auxiliar**
- Guia de Onboarding para Desenvolvedores (setup completo)
- Guia de Contribuição (GitFlow, padrões de código)
- Glossário de Termos (domínio + técnico)

---

## 🎯 Para Quem é Esta Documentação?

### **Desenvolvedores Novos**
1. Comece com [Seção 5.1 - Guia de Onboarding](#51-guia-de-onboarding-para-desenvolvedores)
2. Leia [Seção 2 - Arquitetura Técnica](#2-arquitetura-da-solução-técnica)
3. Consulte [Seção 5.3 - Glossário](#53-glossário-de-termos) quando necessário

### **Gerentes de Produto**
1. Leia [Seção 1 - Estratégia de Negócio](#1-visão-geral-e-estratégia-de-negócio)
2. Consulte [Seção 4 - Roadmap](#4-roadmap-de-produto-e-atividades-futuras)
3. Revise [Seção 3 - Funcionalidades](#3-funcionalidades-implementadas)

### **Stakeholders e C-Level**
1. Foque no [Resumo Executivo](#11-resumo-executivo)
2. Consulte [Modelo de Negócio](#13-modelo-de-negócio)
3. Revise [Roadmap de Alto Nível](#42-visão-de-médio-e-longo-prazo-2026-2028)

### **Arquitetos e Tech Leads**
1. Estude [Diagrama de Arquitetura](#21-visão-geral-da-arquitetura)
2. Analise [Stack Tecnológico](#22-stack-de-tecnologias)
3. Revise [Fluxo de Dados](#23-fluxo-de-dados)
4. Consulte [APIs e Integrações](#24-apis-e-integrações)

---

## 📊 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| **Backend** | |
| Linhas de código | ~50.000+ |
| Rotas API | 53 |
| Services | 38 |
| Models | 51 |
| Migrations | 18 (~250KB DDL) |
| **Frontend** | |
| Páginas | 242 |
| Hooks SWR | 28 |
| Componentes | ~200+ |
| Linhas de código | ~40.000+ |
| **Infraestrutura** | |
| Tabelas DB | ~80+ |
| Integrações | 6 (WhatsApp, Stripe, OAuth, etc.) |
| **Projeto** | |
| Status | 80% Completo |
| Documentos MD | 90+ |

---

## 🔗 Referências Cruzadas

### **Documentação Técnica**
- [GUIA_COMPLETO_DESENVOLVIMENTO_DOCTORQ.md](../GUIA_COMPLETO_DESENVOLVIMENTO_DOCTORQ.md) - Guia de desenvolvimento
- [LEVANTAMENTO_COMPLETO_IMPLEMENTACOES.md](../LEVANTAMENTO_COMPLETO_IMPLEMENTACOES.md) - Progresso de implementação

### **Documentação Executada**
- [DOC_Executadas/](../DOC_Executadas/) - 90+ documentos de sessões e implementações
- [DOC_Executadas/INDEX.md](../DOC_Executadas/INDEX.md) - Índice completo

### **Código-Fonte**
- Backend: [estetiQ-api/](../estetiQ-api/)
- Frontend: [estetiQ-web/](../estetiQ-web/)
- README Principal: [../README.md](../README.md)

---

## 📝 Manutenção da Documentação

### **Frequência de Atualização**
- **Semanal**: Durante sprints de desenvolvimento ativo
- **Mensal**: Durante manutenção e estabilização
- **Trimestral**: Revisão completa de arquitetura

### **Responsáveis**
- **Arquitetura Técnica**: Tech Lead + Arquiteto de Soluções
- **Roadmap de Produto**: Product Manager
- **Guias de Desenvolvimento**: Desenvolvedores Seniores

### **Versionamento**
Este documento segue versionamento semântico:
- **v1.0** (28/10/2025): Versão inicial completa
- **v1.1** (Futuro): Atualizações incrementais
- **v2.0** (Futuro): Mudanças arquiteturais significativas

---

## 🚀 Próximos Passos

1. **Desenvolvedores**:
   - Siga o [Guia de Onboarding](#51-guia-de-onboarding-para-desenvolvedores)
   - Configure ambiente local
   - Contribua seguindo o [Guia de Contribuição](#52-guia-de-contribuição)

2. **Product Managers**:
   - Priorize itens do [Roadmap](#41-próximos-sprints-curto-prazo---q1-2026)
   - Atualize personas com feedback de usuários
   - Refine modelo de negócio com métricas reais

3. **DevOps**:
   - Implemente CI/CD pipeline (Sprint 1)
   - Configure monitoring e alertas
   - Prepare infraestrutura para lançamento beta

---

## 📞 Contato

**Dúvidas sobre a documentação?**
- Crie um issue no repositório
- Entre em contato com o Tech Lead
- Consulte o canal #arquitetura no Slack

---

**Última Atualização**: 28 de Outubro de 2025
**Mantido por**: Equipe de Arquitetura DoctorQ
**Próxima Revisão**: Janeiro de 2026
