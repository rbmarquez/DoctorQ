# 📋 Pendências de Desenvolvimento do Frontend - DoctorQ

**Data de Análise**: 27/10/2025
**Status Geral**: 🟡 Em Desenvolvimento Ativo
**Progresso de Integração**: 9/137 páginas (6.6%)

---

## 📊 Visão Geral

### Estatísticas
- **Total de Páginas**: 137 páginas
- **Páginas 100% Integradas**: 9 (6.6%)
- **Páginas com Dados Mock**: ~128 (93.4%)
- **TODOs no Código**: 23 itens
- **Hooks SWR Criados**: 3 (useProdutos, useCarrinho, usePedidos)
- **Backend APIs Prontas**: ~60% das principais rotas

### Páginas Já Integradas ✅
1. ✅ `/marketplace` - Listagem de produtos
2. ✅ `/marketplace/[id]` - Detalhe do produto
3. ✅ `/marketplace/carrinho` - Carrinho de compras
4. ✅ `/checkout` - Checkout completo
5. ✅ `/checkout/sucesso` - Confirmação do pedido
6. ✅ `/paciente/pedidos` - Lista de pedidos
7. ✅ `/paciente/pedidos/[id]` - Detalhe do pedido
8. ✅ `/login` - Autenticação (NextAuth completo)
9. ✅ `/cadastro` - Registro de usuários

---

## 🚨 Pendências Críticas (Alta Prioridade)

### 1. Sistema de Cupons - Backend Integration
**Status**: ⚠️ Implementação Client-Side Temporária
**Arquivos**: `src/app/marketplace/carrinho/page.tsx`

**Problema Atual**:
```typescript
// Cupom (client-side apenas - TODO: integrar com backend)
const cuponsValidos: { [key: string]: number } = {
  BEMVINDO10: 10,
  PRIMEIRACOMPRA: 15,
  CLIENTE20: 20,
  VERAO2025: 25,
};
```

**Necessidades**:
- [ ] Backend: Criar endpoint `POST /cupons/validar`
- [ ] Backend: Endpoint `GET /cupons/aplicaveis` (lista de cupons do usuário)
- [ ] Frontend: Hook `useCupons()` para gerenciar cupons
- [ ] Frontend: Validação server-side com feedback em tempo real
- [ ] Frontend: Remover mock de cupons válidos

**Impacto**: Segurança (cupons podem ser manipulados no cliente)

---

### 2. Sistema de Favoritos - Persistência
**Status**: ⚠️ Local Storage Only
**Arquivos**: Múltiplas páginas (marketplace, procedimentos)

**Problema Atual**:
- Favoritos salvos apenas em localStorage
- Não sincroniza entre dispositivos
- Perdidos ao limpar cache

**Necessidades**:
- [ ] Backend: Verificar se endpoint `/favoritos` existe e está funcional
- [ ] Frontend: Hook `useFavoritos(userId)` com SWR
- [ ] Frontend: Mutations: `adicionarFavorito()`, `removerFavorito()`
- [ ] Frontend: Sync localStorage → API em background
- [ ] Frontend: Badge de contagem de favoritos no header

**Impacto**: UX (dados não persistem)

---

### 3. Sistema de Comparação de Produtos
**Status**: ⚠️ Local Storage Only
**Arquivos**: `src/contexts/MarketplaceContext.tsx`

**Problema Atual**:
- Comparação de produtos é totalmente local
- Não persiste entre sessões/dispositivos

**Necessidades**:
- [ ] Backend: Verificar endpoint `/comparacao`
- [ ] Frontend: Hook `useComparacao(userId)`
- [ ] Frontend: Mutations: `adicionarAComparacao()`, `removerDeComparacao()`
- [ ] Frontend: Página `/marketplace/comparar` para exibir lado a lado

**Impacto**: Médio (feature secundária)

---

### 4. Mudança de Senha do Usuário
**Status**: ❌ Não Implementado
**Arquivos**: `src/lib/api/hooks/useUser.ts`, `src/app/paciente/perfil/page.tsx`

**TODO Encontrado**:
```typescript
/**
 * TODO: Backend precisa implementar endpoint de mudança de senha
 * Endpoint esperado: PUT /users/{userId}/password
 * Body: { senha_atual: string, senha_nova: string }
 */
```

**Necessidades**:
- [ ] Backend: Criar endpoint `PUT /users/{userId}/password`
- [ ] Backend: Validar senha atual com bcrypt
- [ ] Backend: Hash da nova senha
- [ ] Frontend: Form de mudança de senha com confirmação
- [ ] Frontend: Validação de senha forte (8+ caracteres, números, símbolos)
- [ ] Frontend: Feedback de sucesso/erro

**Impacto**: Segurança (usuários não conseguem trocar senha)

---

### 5. Integração do Chat com Backend
**Status**: ⚠️ Mock Parcial
**Arquivos**: `src/components/new/NewChatComponent.tsx`

**TODO Encontrado**:
```typescript
// TODO: Enviar mensagem inicial quando endpoint /conversas/{id}/chat for implementado
```

**Problema Atual**:
- Interface do chat existe
- Endpoint `/conversas/{id}/chat` pode não estar completamente integrado
- Mensagens podem não estar persistindo corretamente

**Necessidades**:
- [ ] Backend: Verificar se `/conversas/{id}/chat` está funcional com SSE (Server-Sent Events)
- [ ] Backend: Verificar `/conversas/{id}/messages` para histórico
- [ ] Frontend: Implementar SSE para streaming de mensagens
- [ ] Frontend: Persistência de mensagens em tempo real
- [ ] Frontend: Upload de anexos (se necessário)

**Impacto**: Alto (feature core do sistema)

---

## 🔄 Pendências de Integração (Média Prioridade)

### 6. Páginas de Procedimentos
**Status**: ⏳ Não Integrado
**Arquivos**: `src/app/procedimentos/[id]/page.tsx`

**TODO Encontrado**:
```typescript
// TODO: Fetch clinicas from API (when endpoint is ready)
```

**Páginas a Integrar**:
- [ ] `/procedimentos` - Listagem de procedimentos
- [ ] `/procedimentos/[id]` - Detalhe do procedimento
- [ ] Filtros por categoria, clínica, profissional
- [ ] Integração com sistema de agendamento

**Necessidades**:
- [ ] Backend: Verificar endpoints `/procedimentos`
- [ ] Backend: Endpoint `/clinicas` para filtro
- [ ] Frontend: Hook `useProcedimentos(filtros)`
- [ ] Frontend: Hook `useProcedimento(id)`
- [ ] Frontend: Remover dados mock

**Impacto**: Alto (feature core)

---

### 7. Sistema de Agendamentos
**Status**: ⏳ Mock Data
**Arquivos**: `src/app/agenda/page.tsx`, `src/contexts/BookingContext.tsx`

**TODOs Encontrados**:
```typescript
// TODO: Integração com backend
// TODO: Chamar API para atualizar
// TODO: Atualizar duração na API
```

**Problema Atual**:
- BookingContext usa dados mocados
- Calendário não reflete disponibilidade real
- Agendamentos não persistem no backend

**Páginas a Integrar**:
- [ ] `/agenda` - Calendário de agendamentos
- [ ] `/agendar/[procedimentoId]` - Criar agendamento
- [ ] `/paciente/agendamentos` - Lista de agendamentos do paciente
- [ ] `/profissional/agenda` - Agenda do profissional

**Necessidades**:
- [ ] Backend: Verificar endpoints `/agendamentos`
- [ ] Backend: Endpoint `/agendamentos/disponibilidade`
- [ ] Backend: Endpoint `/profissionais/{id}/horarios`
- [ ] Frontend: Hook `useAgendamentos(userId)`
- [ ] Frontend: Hook `useDisponibilidade(profissionalId, data)`
- [ ] Frontend: Calendar component integrado
- [ ] Frontend: Remover BookingContext mock

**Impacto**: Crítico (feature core)

---

### 8. Sistema de Billing/Assinaturas
**Status**: ⏳ Parcialmente Integrado
**Arquivos**: `src/app/billing/**/*.tsx`

**TODOs Encontrados**:
```typescript
// TODO: Get user ID from auth context (em 3 arquivos)
// TODO: Integrar com Stripe ou outro gateway de pagamento
```

**Páginas a Revisar**:
- [ ] `/billing/invoices` - Faturas
- [ ] `/billing/subscription` - Assinatura atual
- [ ] `/billing/payments` - Pagamentos
- [ ] `/billing/subscribe/[id]` - Assinar plano

**Necessidades**:
- [ ] Frontend: Usar `useAuth()` para obter userId (substituir placeholders)
- [ ] Backend: Integração com Stripe/Mercado Pago
- [ ] Backend: Webhooks de pagamento
- [ ] Frontend: Remover `"user-id-placeholder"`
- [ ] Frontend: Checkout de assinatura funcional

**Impacto**: Alto (monetização)

---

### 9. Galeria de Imagens de Produtos
**Status**: ⏳ Implementação Parcial
**Arquivos**: `src/app/marketplace/[id]/page.tsx`

**TODO Encontrado**:
```typescript
{/* Image Gallery - TODO: Implementar galeria quando tivermos ds_imagens_adicionais */}
{/* TODO: Implementar ds_modo_uso, ds_cuidados quando disponível no backend */}
{/* TODO: Adicionar mais especificações quando disponível (peso, dimensões, etc.) */}
```

**Necessidades**:
- [ ] Backend: Adicionar campo `ds_imagens_adicionais` em ProdutoORM
- [ ] Backend: Endpoint para upload de múltiplas imagens
- [ ] Backend: Adicionar campos `ds_modo_uso`, `ds_cuidados`, `ds_especificacoes`
- [ ] Frontend: Component de galeria com thumbnails
- [ ] Frontend: Zoom de imagem
- [ ] Frontend: Lightbox/modal para imagens

**Impacto**: Médio (melhoria de UX)

---

### 10. Onboarding de Usuários
**Status**: ⏳ Não Persiste
**Arquivos**: `src/app/onboarding/page.tsx`

**TODO Encontrado**:
```typescript
// TODO: Save preferences to backend
```

**Necessidades**:
- [ ] Backend: Endpoint `PUT /users/{userId}/preferences`
- [ ] Backend: Adicionar campo `ds_onboarding_completed` em UserORM
- [ ] Frontend: Salvar preferências ao completar onboarding
- [ ] Frontend: Não mostrar onboarding novamente após completar

**Impacto**: Baixo (melhoria de UX)

---

## 📄 Páginas Restantes (128 páginas com ~93.4%)

### Categorias de Páginas Não Integradas

#### Área do Paciente (23 páginas)
- [ ] `/paciente/dashboard` - Dashboard principal
- [ ] `/paciente/agendamentos` - Agendamentos
- [ ] `/paciente/avaliacoes` - Avaliações
- [ ] `/paciente/favoritos` - Favoritos
- [ ] `/paciente/fotos` - Fotos (evolução)
- [ ] `/paciente/financeiro` - Financeiro
- [ ] `/paciente/mensagens` - Mensagens
- [ ] `/paciente/notificacoes` - Notificações
- [ ] `/paciente/pagamentos` - Pagamentos
- [x] `/paciente/anamnese` - Anamnese
- [ ] E mais...

#### Área Administrativa (30+ páginas)
- [ ] `/admin/dashboard` - Dashboard admin
- [ ] `/admin/usuarios` - Gerenciar usuários
- [ ] `/admin/empresas` - Gerenciar empresas
- [ ] `/admin/perfis` - Perfis e permissões
- [ ] `/admin/agentes` - Agentes de IA
- [ ] `/admin/conversas` - Conversas
- [ ] `/admin/knowledge` - Base de conhecimento
- [ ] `/admin/tools` - Ferramentas
- [ ] `/admin/apikeys` - Chaves de API
- [ ] E mais...

#### Área do Profissional (15+ páginas)
- [ ] `/profissional/agenda` - Agenda do profissional
- [ ] `/profissional/pacientes` - Lista de pacientes
- [ ] `/profissional/procedimentos` - Procedimentos realizados
- [ ] `/profissional/financeiro` - Relatórios financeiros
- [ ] E mais...

#### Marketplace e E-commerce (10+ páginas)
- [ ] `/marketplace/categoria/[slug]` - Categoria de produtos
- [ ] `/marketplace/busca` - Busca de produtos
- [ ] `/marketplace/comparar` - Comparação de produtos
- [ ] E mais...

#### Outras Áreas (50+ páginas)
- Studio de IA
- Biblioteca de documentos
- Parceiros
- Billing avançado
- Configurações
- E mais...

---

## 🔧 Melhorias Técnicas Pendentes

### 11. Otimização de Performance
- [x] Implementar infinite scroll no marketplace (carregar mais produtos)
- [x] Lazy loading de componentes pesados
- [x] Prefetch de páginas no hover dos links
- [x] Image optimization com Next.js Image
- [x] Code splitting para reduzir bundle size
- [x] Service Worker para PWA

### 12. Validação de Formulários
- [ ] Migrar todos os forms para react-hook-form
- [ ] Criar schemas Zod para todas as entidades
- [ ] Mensagens de erro consistentes em PT-BR
- [ ] Validação em tempo real (debounced)

### 13. Testes Automatizados
- [ ] Testes de integração com Jest
- [ ] Testes E2E com Playwright
- [ ] Coverage mínimo de 70%
- [ ] CI/CD com testes automatizados

### 14. Acessibilidade (a11y)
- [ ] Audit com Lighthouse
- [ ] ARIA labels em todos os botões/inputs
- [ ] Navegação por teclado
- [ ] Screen reader support
- [ ] Contrast ratio WCAG AA

### 15. Internacionalização (i18n)
- [ ] Setup do next-i18next
- [ ] Tradução PT-BR → EN
- [ ] Formatação de moedas/datas por locale
- [ ] RTL support (futuro)

---

## 🎯 Roadmap de Integração Sugerido

### Fase 1 - Urgente (1-2 semanas)
1. ✅ ~~Marketplace + Carrinho + Checkout~~ - **CONCLUÍDO**
2. 🔄 Sistema de Cupons (backend + frontend)
3. 🔄 Sistema de Favoritos (persistência)
4. 🔄 Mudança de senha

### Fase 2 - Core Features (2-4 semanas)
5. 🔄 Procedimentos (listagem + detalhe)
6. 🔄 Agendamentos (calendário + disponibilidade)
7. 🔄 Chat (SSE + persistência)
8. 🔄 Dashboard do Paciente

### Fase 3 - Administrativo (4-6 semanas)
9. 🔄 Área administrativa (usuários, empresas, perfis)
10. 🔄 Agentes de IA (configuração + treino)
11. 🔄 Knowledge base (upload + indexação)
12. 🔄 Relatórios e Analytics

### Fase 4 - Profissional (6-8 semanas)
13. 🔄 Agenda do profissional
14. 🔄 Prontuário eletrônico
15. 🔄 Relatórios financeiros
16. 🔄 Gestão de pacientes

### Fase 5 - Refinamento (8-12 semanas)
17. 🔄 Billing avançado (Stripe integration)
18. 🔄 Comparação de produtos
19. 🔄 Sistema de avaliações
20. 🔄 Notificações push
21. 🔄 PWA features

---

## 📈 Métricas de Progresso

### Integração Atual
- **9/137 páginas integradas** (6.6%)
- **23 TODOs identificados**
- **3 hooks SWR criados**
- **8 ORM models migrados**

### Meta para Próximos 30 Dias
- **Meta**: 30/137 páginas integradas (22%)
- **Reduzir TODOs**: 23 → 10
- **Criar hooks**: +10 hooks SWR
- **Cobertura de testes**: 0% → 30%

### Meta para 90 Dias
- **Meta**: 80/137 páginas integradas (58%)
- **Todos os core features integrados**
- **Cobertura de testes**: 70%
- **Performance**: Lighthouse score >90

---

## 🐛 Bugs Conhecidos

### 1. Contexto MarketplaceContext vs SWR Cache
**Problema**: MarketplaceContext pode conflitar com cache do SWR
**Solução**: Migrar todo estado do MarketplaceContext para hooks SWR

### 2. CORS em Produção
**Problema**: Configuração de CORS precisa ser revisada para produção
**Solução**: Whitelist de domínios no backend

### 3. Session Timeout
**Problema**: Token JWT expira sem refresh automático
**Solução**: Implementar refresh token automático

---

## 📚 Recursos Necessários

### Backend
- [ ] Swagger/OpenAPI docs completo
- [ ] Postman collection atualizada
- [ ] Logs estruturados
- [ ] Rate limiting
- [ ] Health checks

### Frontend
- [ ] Storybook para componentes
- [ ] Design system documentado
- [ ] Guia de contribuição
- [ ] ADRs (Architecture Decision Records)

### DevOps
- [ ] CI/CD pipeline
- [ ] Staging environment
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Performance monitoring (Web Vitals)

---

**Última Atualização**: 27/10/2025 às 08:30
**Responsável**: Claude + Rodrigo
**Próxima Revisão**: 03/11/2025
**Status**: 🟡 Em Desenvolvimento Ativo
