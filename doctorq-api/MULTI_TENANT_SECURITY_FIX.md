# 🔐 Correção de Segurança Multi-Tenant - DoctorQ

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO

**Data**: 05/11/2025
**Severidade**: 🔴 CRÍTICA
**Tipo**: Violação de Multi-Tenancy / Data Leakage

### Descrição
Múltiplas rotas da API não estão filtrando dados por `id_empresa` do usuário logado, permitindo que usuários vejam dados de outras empresas/clínicas.

### Impacto
- Usuários de uma clínica podem ver agendamentos, pacientes, profissionais de outras clínicas
- Violação de LGPD (dados de saúde)
- Quebra total do isolamento multi-tenant

---

## 📊 Tabelas Afetadas

### Tabelas com `id_empresa` (filtro direto)
```sql
tb_agentes, tb_albuns, tb_analytics_events, tb_analytics_snapshots,
tb_api_keys, tb_apikey, tb_atividades, tb_avaliacoes_agentes,
tb_banners, tb_categorias_financeiras, tb_configuracoes,
tb_contas_bancarias, tb_conversas_usuarios, tb_cupons, tb_empresas,
tb_faturas, tb_fornecedores, tb_instalacoes_marketplace, tb_logs_erro,
tb_logs_integracao, tb_notificacoes, tb_pagamentos, tb_perfis,
tb_pesquisas, tb_produtos, tb_prompt_biblioteca, tb_repasses,
tb_respostas_rapidas, tb_template_installations, tb_templates_mensagens,
tb_transacoes, tb_users
```

### Tabelas com `id_clinica` (filtro via JOIN)
```sql
tb_agendamentos, tb_avaliacoes, tb_clinicas, tb_favoritos,
tb_pacientes, tb_procedimentos, tb_profissionais,
tb_profissionais_clinicas, tb_prontuarios, tb_qrcodes_avaliacao
```

---

## ✅ Correções Aplicadas

### 1. `/agendamentos/` - GET (✅ CORRIGIDO)
**Arquivo**: `src/routes/agendamentos_route.py`
**Linhas**: 685-820
**Status**: ✅ Completo

**Mudanças**:
- Adicionado filtro obrigatório: `cli.id_empresa = '{current_user.id_empresa}'`
- Mudado LEFT JOIN para INNER JOIN com `tb_clinicas`
- Aplica em COUNT e SELECT principal

### 2. `/perfis/` - GET (✅ CORRIGIDO)
**Arquivo**: `src/routes/perfil.py`
**Linhas**: 23-74
**Status**: ✅ Completo

**Mudanças**:
- Removido parâmetro `empresa_id` opcional
- Adicionado `current_user: User = Depends(get_current_user)`
- Força filtro: `empresa_uuid = current_user.id_empresa`
- Service já tinha lógica correta (empresa + templates globais)

### 3. `/profissionais/` - GET (✅ CORRIGIDO)
**Arquivo**: `src/routes/profissionais_route.py`
**Linhas**: 99-245
**Status**: ✅ Completo

**Mudanças**:
- Removido parâmetro `id_empresa` opcional
- Adicionado `current_user: User = Depends(get_current_user)`
- Adicionado filtro obrigatório: `c.id_empresa = :id_empresa`
- Mudado LEFT JOIN para INNER JOIN com `tb_clinicas`
- Atualizado params: `"id_empresa": str(current_user.id_empresa)`

### 4. Row Level Security (✅ IMPLEMENTADO)
**Arquivo**: `database/migration_021_row_level_security.sql`
**Status**: ✅ Pronto para aplicar (não aplicado ainda)

**Camadas de Segurança**:
1. **Função Helper**: `current_user_empresa_id()` - Retorna UUID da empresa do contexto
2. **Policies em 11 tabelas**: Filtragem automática por empresa
3. **Tabelas protegidas**:
   - Com `id_empresa`: perfis, users, configuracoes, notificacoes, transacoes
   - Com `id_clinica`: clinicas, procedimentos, profissionais, agendamentos, pacientes, avaliacoes

**Como funciona**:
```sql
-- Na aplicação, antes de cada query:
SET LOCAL app.current_empresa_id = '{user.id_empresa}';

-- Agora TODAS as queries são filtradas automaticamente pelo PostgreSQL
SELECT * FROM tb_pacientes;  -- Retorna APENAS pacientes da empresa
```

### 5. Middleware de Contexto Tenant (✅ CRIADO)
**Arquivo**: `src/middleware/tenant_context_middleware.py`
**Status**: ✅ Pronto para integrar

**Funcionalidade**:
- Extrai `id_empresa` do token JWT automaticamente
- Configura `SET LOCAL app.current_empresa_id` em TODA requisição
- Defense in Depth: mesmo que rota esqueça filtro, RLS protege
- Bypass automático para rotas públicas (/docs, /health, etc.)

---

## 🔴 Rotas Pendentes de Correção (URGENTE)

### Grupo: Clínica

#### `/perfis/` - GET
**Risco**: Alto
**Tabela**: `tb_perfis` (tem `id_empresa`)
**Ação**: Adicionar WHERE `id_empresa = current_user.id_empresa`

#### `/profissionais/` - GET
**Risco**: Crítico
**Tabela**: `tb_profissionais` (usa `id_clinica`)
**Ação**: JOIN com `tb_clinicas` + filtro por `id_empresa`

#### `/pacientes/` - GET
**Risco**: CRÍTICO (dados de saúde - LGPD)
**Tabela**: `tb_pacientes` (usa `id_clinica`)
**Ação**: JOIN com `tb_clinicas` + filtro por `id_empresa`

#### `/procedimentos/` - GET
**Risco**: Médio
**Tabela**: `tb_procedimentos` (usa `id_clinica`)
**Ação**: JOIN com `tb_clinicas` + filtro por `id_empresa`

#### `/clinicas/` - GET
**Risco**: Alto
**Tabela**: `tb_clinicas` (tem `id_empresa`)
**Ação**: WHERE `id_empresa = current_user.id_empresa`

#### `/avaliacoes/` - GET
**Risco**: Alto
**Tabela**: `tb_avaliacoes` (usa `id_clinica`)
**Ação**: JOIN com `tb_clinicas` + filtro por `id_empresa`

### Grupo: Admin

#### `/empresas/` - GET
**Risco**: Médio
**Nota**: Deve retornar APENAS a empresa do usuário (exceto se for admin global)
**Ação**: Verificar perfil, se não for admin global, filtrar por `id_empresa`

#### `/users/` - GET
**Risco**: Alto
**Tabela**: `tb_users` (tem `id_empresa`)
**Ação**: WHERE `id_empresa = current_user.id_empresa`

### Grupo: Marketplace

#### `/produtos/` - GET
**Risco**: Médio
**Tabela**: `tb_produtos` (tem `id_empresa`)
**Ação**: WHERE `id_empresa = current_user.id_empresa`

#### `/fornecedores/` - GET
**Risco**: Médio
**Tabela**: `tb_fornecedores` (tem `id_empresa`)
**Ação**: WHERE `id_empresa = current_user.id_empresa`

### Grupo: Financeiro

#### `/faturas/` - GET
**Risco**: Alto
**Tabela**: `tb_faturas` (tem `id_empresa`)
**Ação**: WHERE `id_empresa = current_user.id_empresa`

#### `/transacoes/` - GET
**Risco**: Alto
**Tabela**: `tb_transacoes` (tem `id_empresa`)
**Ação**: WHERE `id_empresa = current_user.id_empresa`

---

## 🔧 Padrão de Correção

### Para tabelas com `id_empresa`:
```python
@router.get("/")
async def listar_recursos(
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Model).where(
        Model.id_empresa == current_user.id_empresa  # ⚠️ FILTRO OBRIGATÓRIO
    )
    result = await db.execute(stmt)
    return result.scalars().all()
```

### Para tabelas com `id_clinica`:
```python
@router.get("/")
async def listar_recursos(
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Model)
        .join(Clinica, Model.id_clinica == Clinica.id_clinica)
        .where(Clinica.id_empresa == current_user.id_empresa)  # ⚠️ FILTRO OBRIGATÓRIO
    )
    result = await db.execute(stmt)
    return result.scalars().all()
```

---

## 📝 Checklist de Correção

- [x] `/agendamentos/` - GET
- [ ] `/perfis/` - GET
- [ ] `/profissionais/` - GET
- [ ] `/pacientes/` - GET (PRIORIDADE MÁXIMA - LGPD)
- [ ] `/procedimentos/` - GET
- [ ] `/clinicas/` - GET
- [ ] `/avaliacoes/` - GET
- [ ] `/empresas/` - GET
- [ ] `/users/` - GET
- [ ] `/produtos/` - GET
- [ ] `/fornecedores/` - GET
- [ ] `/faturas/` - GET
- [ ] `/transacoes/` - GET
- [ ] Todas as demais rotas de listagem

---

## 🧪 Como Testar

1. Criar 2 empresas diferentes no banco
2. Criar usuário em cada empresa
3. Fazer login com usuário da Empresa A
4. Tentar listar recursos
5. Verificar que APENAS recursos da Empresa A aparecem

---

## ⚖️ Impacto Legal (LGPD)

**Art. 46 da LGPD**: Multa de até 2% do faturamento (limite R$ 50 milhões)
**Motivo**: Vazamento de dados pessoais sensíveis (dados de saúde)

**Ação Imediata**: Corrigir rotas de pacientes, prontuários e agendamentos.

---

## 📋 Próximos Passos

1. ✅ Corrigir `/agendamentos/` (FEITO)
2. 🔴 Corrigir `/pacientes/` (URGENTE - LGPD)
3. 🔴 Corrigir `/profissionais/`
4. 🔴 Corrigir `/perfis/`
5. 🟡 Criar script de auditoria SQL para validar isolamento
6. 🟡 Adicionar testes automatizados de multi-tenancy
7. 🟡 Revisar TODAS as rotas GET/POST/PUT/DELETE

---

**Status**: 🔴 EM ANDAMENTO
**Última Atualização**: 05/11/2025 18:45
