# Sistema de Perfis Hierárquicos - DoctorQ

## 📋 Visão Geral

O sistema de perfis do DoctorQ foi reestruturado para suportar uma hierarquia com 2 níveis:

**Nível 1 - Perfis Principais (Tipo de Acesso)**
- Definem o tipo de acesso à plataforma
- 3 perfis principais + 1 perfil de usuário final

**Nível 2 - Sub-perfis (Funções)**
- Definem funções específicas dentro de cada tipo de acesso
- Herdam permissões do perfil pai e adicionam permissões específicas

---

## 🎯 Estrutura de Perfis

### 1. ADMINISTRADOR (`nm_tipo_acesso: 'admin'`)
**Descrição**: Controla plataforma e licenças

#### Sub-perfis:
| Código | Nome | Descrição | Permissões |
|--------|------|-----------|------------|
| `super_admin` | Super Administrador | Acesso total ao sistema | Todas as permissões + admin |
| `analista` | Analista de Dados | Acessa relatórios e analytics | Relatórios, visualização de dados |
| `suporte` | Suporte Técnico | Atende usuários e resolve problemas | Visualizar usuários, conversas, licenças |

---

### 2. PARCEIRO (`nm_tipo_acesso: 'parceiro'`)
**Descrição**: Clínicas e profissionais que prestam serviços estéticos

#### Sub-perfis:
| Código | Nome | Descrição | Permissões |
|--------|------|-----------|------------|
| `gestor_clinica` | Gestor de Clínica | Gestão completa da clínica | Agendamentos, pacientes, profissionais, financeiro |
| `medico` | Médico | Atendimentos médicos | Agendamentos, pacientes, prontuários |
| `profissional_estetica` | Profissional de Estética | Procedimentos estéticos | Agendamentos, pacientes, procedimentos |
| `secretaria` | Secretaria/Recepção | Atendimento e agendamento | Agendamentos, pacientes (visualização financeira) |
| `financeiro` | Financeiro | Gestão financeira | Faturas, contas, relatórios financeiros |

---

### 3. FORNECEDOR (`nm_tipo_acesso: 'fornecedor'`)
**Descrição**: Empresas que vendem produtos (dermocosméticos, equipamentos)

#### Sub-perfis:
| Código | Nome | Descrição | Permissões |
|--------|------|-----------|------------|
| `gestor_fornecedor` | Gestor de Fornecedor | Gestão completa do fornecedor | Produtos, pedidos, campanhas, marketplace |
| `vendedor` | Vendedor | Vendas e atendimento | Visualizar produtos e pedidos |
| `marketing` | Marketing | Campanhas e propaganda | Campanhas, produtos (visualização) |

---

### 4. PACIENTE (`nm_tipo_acesso: 'paciente'`)
**Descrição**: Usuários finais que utilizam a plataforma

**Permissões**:
- Criar e visualizar agendamentos
- Criar e visualizar avaliações
- Editar perfil pessoal
- Visualizar procedimentos disponíveis

---

## 🗄️ Estrutura no Banco de Dados

### Tabela `tb_perfis`

```sql
CREATE TABLE tb_perfis (
  id_perfil UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
  nm_perfil VARCHAR(100) NOT NULL UNIQUE,
  ds_perfil TEXT,
  nm_tipo VARCHAR(20) NOT NULL DEFAULT 'custom',  -- system, custom

  -- Hierarquia (novo)
  nm_tipo_acesso VARCHAR(20),  -- admin, parceiro, fornecedor, paciente
  id_perfil_pai UUID REFERENCES tb_perfis(id_perfil) ON DELETE CASCADE,
  nr_ordem INTEGER DEFAULT 0,  -- Ordem de exibição

  -- Permissões e auditoria
  ds_permissoes JSONB NOT NULL DEFAULT '{}',
  st_ativo CHAR(1) NOT NULL DEFAULT 'S',
  dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
  dt_atualizacao TIMESTAMP NOT NULL DEFAULT now()
);
```

### Campos Importantes

| Campo | Tipo | Descrição | Exemplos |
|-------|------|-----------|----------|
| `nm_tipo_acesso` | VARCHAR(20) | Tipo de acesso principal (Nível 1) | `admin`, `parceiro`, `fornecedor`, `paciente` |
| `id_perfil_pai` | UUID | Referência ao perfil pai (Nível 2) | NULL (perfil raiz) ou UUID do perfil pai |
| `nr_ordem` | INTEGER | Ordem de exibição no menu | 1, 2, 3... |

---

## 🔐 Sistema de Permissões

As permissões são armazenadas em formato JSONB no campo `ds_permissoes`:

### Estrutura de Permissões

```json
{
  "admin": false,  // Se true, acesso total
  "recurso": {
    "criar": true,
    "editar": true,
    "excluir": false,
    "visualizar": true,
    "executar": false,
    "upload": false,
    "exportar": true
  },
  ...
}
```

### Recursos Disponíveis

- `usuarios` - Gerenciar usuários
- `agentes` - Agentes de IA
- `conversas` - Conversas do chatbot
- `empresa` - Dados da empresa
- `perfis` - Gerenciar perfis
- `licencas` - Gerenciar licenças
- `agendamentos` - Agendamentos
- `pacientes` - Pacientes/Clientes
- `procedimentos` - Procedimentos estéticos
- `profissionais` - Profissionais da clínica
- `financeiro` - Gestão financeira
- `faturas` - Faturas e cobranças
- `produtos` - Produtos do marketplace
- `pedidos` - Pedidos de produtos
- `marketplace` - Gestão do marketplace
- `campanhas` - Campanhas de marketing
- `prontuarios` - Prontuários eletrônicos
- `relatorios` - Relatórios e dashboards
- `analytics` - Analytics e métricas

---

## 📊 Exemplos de Uso

### Exemplo 1: Criar Usuário com Perfil de Gestor de Clínica

```python
# Buscar perfil "gestor_clinica"
stmt = select(Perfil).where(
    Perfil.nm_perfil == "gestor_clinica",
    Perfil.st_ativo == "S"
)
perfil = await db.execute(stmt)
perfil_gestor = perfil.scalar_one()

# Criar usuário associado ao perfil
user = User(
    id_user=uuid.uuid4(),
    id_empresa=empresa_id,
    id_perfil=perfil_gestor.id_perfil,  # ✅ Perfil de gestor
    nm_email="maria@clinica.com",
    nm_completo="Maria Silva",
    nm_papel="usuario",
    st_ativo="S"
)
```

### Exemplo 2: Listar Perfis por Tipo de Acesso

```sql
-- Listar todos os perfis de PARCEIRO
SELECT
  p.nm_perfil,
  p.ds_perfil,
  pp.nm_perfil as perfil_pai
FROM tb_perfis p
LEFT JOIN tb_perfis pp ON p.id_perfil_pai = pp.id_perfil
WHERE p.nm_tipo_acesso = 'parceiro'
ORDER BY p.nr_ordem;
```

**Resultado**:
```
nm_perfil             | ds_perfil                     | perfil_pai
----------------------|-------------------------------|-----------
parceiro              | Parceiro (Clínica/Prof...)    | NULL
gestor_clinica        | Gestor de Clínica             | parceiro
medico                | Médico                        | parceiro
profissional_estetica | Profissional de Estética      | parceiro
secretaria            | Secretaria/Recepção           | parceiro
financeiro            | Financeiro                    | parceiro
```

### Exemplo 3: Verificar Permissões no Frontend

```typescript
// Response do login
{
  "user": {
    "id_user": "...",
    "nm_email": "joao@clinica.com",
    "id_perfil": "48ad90ed-e92e-4b7f-949d-8cb5c15143f3",
    "perfil": {
      "nm_perfil": "gestor_clinica",
      "nm_tipo_acesso": "parceiro",
      "ds_permissoes": {
        "agendamentos": { "criar": true, "editar": true, ... },
        "pacientes": { "criar": true, "editar": true, ... },
        ...
      }
    }
  }
}

// Roteamento no frontend
if (user.perfil.nm_tipo_acesso === 'admin') {
  router.push('/admin/dashboard');
} else if (user.perfil.nm_tipo_acesso === 'parceiro') {
  router.push('/profissional/dashboard');
} else if (user.perfil.nm_tipo_acesso === 'fornecedor') {
  router.push('/fornecedor/dashboard');
} else if (user.perfil.nm_tipo_acesso === 'paciente') {
  router.push('/paciente/dashboard');
}
```

---

## 🚀 Fluxo de Ativação de Parceiro

Quando um parceiro se cadastra (estilo iFood), o sistema:

1. **Cria a empresa** (`tb_empresas`)
   - `nm_plano = "partner"`
   - `st_ativo = "S"`

2. **Busca o perfil "gestor_clinica"**
   ```python
   perfil = await db.execute(
       select(Perfil).where(
           Perfil.nm_perfil == "gestor_clinica",
           Perfil.nm_tipo_acesso == "parceiro"
       )
   )
   ```

3. **Cria o usuário**
   - `id_empresa` → Vincula à empresa criada
   - `id_perfil` → Vincula ao perfil "gestor_clinica"
   - `nm_papel = "usuario"` (papel básico)

4. **Gera licenças** automaticamente

5. **Retorna credenciais** para acesso imediato

---

## 🔄 Migration Aplicada

**Arquivo**: `migration_019_perfis_hierarquicos.sql`

**Alterações**:
1. Adicionou coluna `nm_tipo_acesso` (tipo de acesso principal)
2. Adicionou coluna `id_perfil_pai` (FK para perfil pai)
3. Adicionou coluna `nr_ordem` (ordem de exibição)
4. Criou 16 perfis do sistema:
   - 4 perfis raiz (admin, parceiro, fornecedor, paciente)
   - 12 sub-perfis (distribuídos nos perfis raiz)

**Executar migration**:
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -f database/migration_019_perfis_hierarquicos.sql
```

---

## 📈 Estatísticas

| Métrica | Valor |
|---------|-------|
| **Total de perfis** | 16 perfis system |
| **Perfis raiz** | 4 (admin, parceiro, fornecedor, paciente) |
| **Sub-perfis Admin** | 3 (super_admin, analista, suporte) |
| **Sub-perfis Parceiro** | 5 (gestor_clinica, medico, profissional_estetica, secretaria, financeiro) |
| **Sub-perfis Fornecedor** | 3 (gestor_fornecedor, vendedor, marketing) |
| **Total recursos com permissões** | 19 recursos |

---

## ✅ Testes e Validação

### 1. Verificar perfis criados

```sql
SELECT
  nm_perfil,
  nm_tipo_acesso,
  (SELECT nm_perfil FROM tb_perfis WHERE id_perfil = p.id_perfil_pai) as perfil_pai,
  st_ativo
FROM tb_perfis p
WHERE nm_tipo = 'system'
ORDER BY nm_tipo_acesso, nr_ordem;
```

### 2. Testar auto-ativação de parceiro

```bash
curl -X POST http://localhost:8080/partner-activation/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  -d '{
    "partner_type": "clinic",
    "contact_name": "Dr. João Silva",
    "contact_email": "joao@teste.com",
    "contact_phone": "(11) 98765-4321",
    "business_name": "Clínica Teste",
    "selected_services": ["PLATAFORMA", "CENTRAL_ATENDIMENTO"],
    "plan_type": "professional",
    "billing_cycle": "monthly",
    "accept_terms": true
  }'
```

### 3. Verificar usuário criado

```sql
SELECT
  u.nm_email,
  u.nm_completo,
  p.nm_perfil,
  p.nm_tipo_acesso,
  e.nm_empresa
FROM tb_users u
INNER JOIN tb_perfis p ON u.id_perfil = p.id_perfil
INNER JOIN tb_empresas e ON u.id_empresa = e.id_empresa
WHERE u.nm_email = 'joao@teste.com';
```

**Resultado esperado**:
```
nm_email          | nm_completo      | nm_perfil      | nm_tipo_acesso | nm_empresa
------------------|------------------|----------------|----------------|-------------
joao@teste.com    | Dr. João Silva   | gestor_clinica | parceiro       | Clínica Teste
```

---

## 📚 Referências

- **Modelo SQLAlchemy**: [`src/models/perfil.py`](../../estetiQ-api/src/models/perfil.py)
- **Migration**: [`database/migration_019_perfis_hierarquicos.sql`](../../estetiQ-api/database/migration_019_perfis_hierarquicos.sql)
- **Serviço de Ativação**: [`src/services/partner_activation_service.py`](../../estetiQ-api/src/services/partner_activation_service.py)
- **Arquitetura Completa**: [DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md](DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)

---

**Data**: 02/11/2025
**Versão**: 1.0
**Autor**: Claude Code
**Status**: ✅ Implementado e Testado
