# Análise Completa do Sistema de Cadastro e Acesso - DoctorQ

**Data**: 06/11/2025
**Versão**: 1.0
**Status**: Análise Crítica e Proposta de Melhorias

---

## 📋 Sumário Executivo

Esta análise avalia o sistema atual de cadastro e controle de acesso da plataforma DoctorQ SaaS, identificando **problemas críticos** na arquitetura e propondo **soluções completas** para garantir:

1. **Cadastro via /parcerias** com identificação automática do tipo de acesso
2. **Hierarquia de perfis clara** (Admin Plataforma vs Admin Empresa)
3. **Estrutura de dados separada** para cada grupo (Clínica, Profissional, Fornecedor)
4. **Fluxo de onboarding personalizado** por tipo de parceiro

---

## 🔍 Análise da Situação Atual

### 1. **Estrutura do Banco de Dados**

#### **Tabelas Principais**

```
tb_empresas (16 empresas ativas)
├─ id_empresa (UUID)
├─ nm_empresa
├─ nm_razao_social
├─ nr_cnpj
├─ nm_plano (Free, Starter, Professional, Enterprise, partner)
└─ st_ativo

tb_users (121 usuários ativos)
├─ id_user (UUID)
├─ id_empresa → tb_empresas
├─ id_perfil → tb_perfis
├─ nm_email
├─ nm_completo
├─ nm_papel (legado: admin, usuario, user, gestor_clinica, etc.)
└─ st_ativo

tb_perfis (Sistema de Permissões em 3 Níveis)
├─ id_perfil (UUID)
├─ id_empresa → tb_empresas (NULL = template global)
├─ nm_perfil
├─ fg_template (boolean) - É template global?
├─ ds_grupos_acesso (TEXT[]) - Nível 1: [admin, clinica, profissional, paciente, fornecedor]
├─ ds_permissoes_detalhadas (JSONB) - Nível 2: {grupo: {recurso: {ação: bool}}}
├─ ds_rotas_permitidas (TEXT[]) - Nível 3: ['/admin/dashboard', '/clinica/agenda']
└─ st_ativo

tb_partner_leads (Sistema de Parcerias)
├─ id_partner_lead (UUID)
├─ tp_partner (clinic, professional, supplier, fabricante)
├─ nm_contato
├─ nm_email
├─ nm_empresa
├─ nm_status (pending, approved, rejected)
└─ dt_criacao
```

#### **Perfis Templates Globais (fg_template=true)**

| Nome              | Grupos de Acesso                                  | Status |
|-------------------|---------------------------------------------------|--------|
| admin             | [admin,clinica,profissional,paciente,fornecedor]  | ✅ Existe |
| Gestor de Clínica | [clinica]                                         | ✅ Existe |
| Profissional      | [profissional]                                    | ✅ Existe |
| Paciente          | [paciente]                                        | ✅ Existe |
| Recepcionista     | [clinica]                                         | ✅ Existe |
| **Fornecedor**    | [fornecedor]                                      | ❌ **FALTA** |

---

## ⚠️ Problemas Identificados

### 🔴 **Problema 1: Perfil "Fornecedor" Não Existe**

**Descrição**: O código referencia um perfil template "Fornecedor", mas ele não existe no banco de dados.

**Evidências**:
```python
# partner_activation_service.py:54-59
PROFILE_MAP = {
    "clinica": "Gestor de Clínica",
    "profissional": "Profissional",
    "fabricante": "Fornecedor",  # ← Mapeia para "Fornecedor"
    "fornecedor": "Fornecedor",  # ← Mas não existe no banco!
}
```

**Impacto**:
- Cadastro de fornecedores/fabricantes via `/partner-activation/` **FALHA**
- Usuário é criado, mas sem perfil adequado
- Permissões de fornecedor não são aplicadas

**Solução**:
✅ Criar perfil template "Fornecedor" com permissões adequadas

---

### 🟡 **Problema 2: Confusão entre nm_papel e id_perfil**

**Descrição**: Existem dois sistemas de controle de acesso rodando em paralelo, causando inconsistências.

**Evidências**:
- **Sistema Legado**: Campo `nm_papel` em `tb_users` (valores: admin, usuario, user, gestor_clinica, etc.)
- **Sistema Novo**: Campo `id_perfil` em `tb_users` → `tb_perfis` (sistema de 3 níveis)
- **Problema**: 6 usuários têm `nm_papel='usuario'` mas `id_perfil=NULL`

**Consulta**:
```sql
SELECT COUNT(*) FROM tb_users WHERE st_ativo = 'S' AND id_perfil IS NULL;
-- Resultado: 6 usuários sem perfil
```

**Impacto**:
- Usuários sem perfil **não têm permissões** no sistema novo
- Código precisa lidar com fallback para `nm_papel`
- Lógica de autorização duplicada e inconsistente

**Solução**:
✅ Migrar todos os usuários para o sistema de perfis
✅ Deprecar o campo `nm_papel` (manter apenas para retrocompatibilidade)

---

### 🟡 **Problema 3: Falta Distinção Admin Plataforma vs Admin Empresa**

**Descrição**: Não há distinção clara entre:
- **Admin da Plataforma** (super admin global, sem empresa)
- **Admin de Empresa** (gestor de clínica, profissional autônomo, fornecedor)

**Situação Atual**:
```sql
-- Todos os admins têm acesso total, independente da empresa
SELECT nm_perfil, ds_grupos_acesso FROM tb_perfis WHERE nm_perfil = 'admin';
-- Resultado: {admin,clinica,profissional,paciente,fornecedor}
```

**Problemas**:
1. Admin de clínica pode acessar área `/admin` (deveria ser `/clinica`)
2. Não há validação de `id_empresa` para admins de empresa
3. Admin de fornecedor não tem dashboard específico

**Solução**:
✅ Criar perfis específicos:
- **Super Admin** (id_empresa=NULL, grupos: [admin])
- **Admin Clínica** (id_empresa NOT NULL, grupos: [clinica])
- **Admin Profissional** (id_empresa NOT NULL, grupos: [profissional])
- **Admin Fornecedor** (id_empresa NOT NULL, grupos: [fornecedor])

---

### 🟡 **Problema 4: Fluxo de Cadastro Não Reflete o Tipo Correto**

**Descrição**: O fluxo atual de `/partner-activation/` não garante que o tipo de parceiro se traduza corretamente em estruturas de dados específicas.

**Exemplo**:
```json
POST /partner-activation/
{
  "partner_type": "clinic",  // ← Tipo informado
  "business_name": "Clínica ABC",
  "contact_email": "admin@clinica.com"
}
```

**O que acontece**:
1. ✅ Cria `tb_empresas` (nm_plano="partner")
2. ✅ Cria `tb_users` (id_empresa, id_perfil)
3. ✅ Clona perfil template para empresa
4. ❌ **Não cria** `tb_clinicas` (dados específicos de clínica)
5. ❌ **Não cria** `tb_profissionais` (se for profissional)
6. ❌ **Não cria** `tb_fornecedores` (se for fornecedor)

**Impacto**:
- Empresa existe, mas não tem estrutura específica (clínica, profissional, fornecedor)
- Funcionalidades específicas do tipo ficam desabilitadas
- Dados fragmentados e inconsistentes

**Solução**:
✅ Ao criar empresa via `/partner-activation/`, criar também:
- `tb_clinicas` (se partner_type=clinic)
- `tb_profissionais` (se partner_type=professional)
- `tb_fornecedores` (se partner_type=supplier/fabricante)

---

### 🟢 **Problema 5: Multi-Tenancy Parcialmente Implementado**

**Descrição**: O sistema tem RLS (Row-Level Security) em `tb_perfis`, mas não em todas as tabelas.

**Evidências**:
```sql
-- RLS ativo em tb_perfis
\d tb_perfis
-- Policies (forced row security enabled):
--   POLICY "perfis_isolation_policy"
```

**Tabelas com Multi-Tenancy**:
- ✅ `tb_perfis` (via RLS)
- ✅ `tb_agendamentos` (id_empresa)
- ✅ `tb_pacientes` (id_empresa)
- ❌ `tb_users` (sem RLS)
- ❌ `tb_clinicas` (sem RLS)
- ❌ `tb_fornecedores` (sem RLS)

**Impacto**:
- Queries podem retornar dados de outras empresas se não filtrar explicitamente
- Risco de vazamento de dados entre tenants

**Solução**:
✅ Implementar RLS em todas as tabelas com `id_empresa`

---

## 🎯 Proposta de Nova Arquitetura

### **1. Hierarquia de Perfis Atualizada**

```
┌─────────────────────────────────────────────────────────────┐
│                     PERFIS TEMPLATES GLOBAIS                │
│                (fg_template=true, id_empresa=NULL)          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼──────┐      ┌──────▼──────┐
   │  ADMIN  │          │  CLÍNICA   │      │ PROFISSIONAL│
   │ PLATAFORMA│        │  SISTEMA   │      │   SISTEMA   │
   └─────────┘          └────────────┘      └─────────────┘
        │                     │                     │
        │               ┌─────▼──────┬──────────────▼────┬────────────┐
        │               │            │                   │            │
   ┌────▼─────┐   ┌────▼─────┐ ┌──────▼──────┐  ┌───────▼──────┐  ┌─▼────────┐
   │  Super   │   │ Gestor   │ │Recepcionista│  │Profissional  │  │Fornecedor│
   │  Admin   │   │ Clínica  │ │             │  │  Autônomo    │  │          │
   └──────────┘   └──────────┘ └─────────────┘  └──────────────┘  └──────────┘
        │               │             │                │                 │
        │               │             │                │                 │
id_empresa=NULL  id_empresa!=NULL  id_empresa!=NULL  id_empresa!=NULL  id_empresa!=NULL
```

### **2. Perfis Templates a Criar/Atualizar**

| Nome do Perfil          | fg_template | id_empresa | Grupos de Acesso | Descrição |
|-------------------------|-------------|------------|------------------|-----------|
| **Super Admin**         | true        | NULL       | [admin]          | Admin da Plataforma (acesso total) |
| Gestor de Clínica       | true        | NULL       | [clinica]        | Admin de Clínica (clonado por empresa) |
| Profissional            | true        | NULL       | [profissional]   | Admin Profissional (clonado por empresa) |
| **Fornecedor** (NOVO)   | true        | NULL       | [fornecedor]     | Admin Fornecedor (clonado por empresa) |
| Recepcionista           | true        | NULL       | [clinica]        | Secretária/Atendente |
| Paciente                | true        | NULL       | [paciente]       | Cliente final |

### **3. Mapeamento partner_type → Perfil Template**

```python
PROFILE_MAP = {
    "clinic": "Gestor de Clínica",
    "clinica": "Gestor de Clínica",
    "professional": "Profissional",
    "profissional": "Profissional",
    "supplier": "Fornecedor",
    "fornecedor": "Fornecedor",
    "fabricante": "Fornecedor",
}
```

### **4. Estruturas de Dados Específicas por Tipo**

#### **Tipo: Clínica**
```
tb_empresas (criado)
├─ nm_plano = "partner"
└─ nm_porte = "Pequeno|Médio|Grande"

tb_clinicas (criado automaticamente)
├─ id_clinica
├─ id_empresa → tb_empresas
├─ nm_clinica
├─ nm_especialidade (Dermatologia, Estética, Odontologia)
├─ nr_cnpj
├─ nr_cnes (Cadastro Nacional de Estabelecimentos de Saúde)
├─ ds_endereco_completo
└─ nr_capacidade_atendimentos

tb_users (admin da clínica)
├─ id_perfil → Gestor de Clínica (clone)
├─ id_empresa → tb_empresas
└─ nm_papel = "gestor_clinica"
```

#### **Tipo: Profissional**
```
tb_empresas (criado)
├─ nm_plano = "partner"
└─ nm_porte = "Individual"

tb_profissionais (criado automaticamente)
├─ id_profissional
├─ id_empresa → tb_empresas
├─ nm_profissional
├─ nm_especialidade (Dermatologista, Esteticista, Fisioterapeuta)
├─ nr_registro_profissional (CRM, CRO, CREFITO)
├─ nr_cpf
└─ fg_autonomo = true

tb_users (admin profissional)
├─ id_perfil → Profissional (clone)
├─ id_empresa → tb_empresas
└─ nm_papel = "profissional"
```

#### **Tipo: Fornecedor/Fabricante**
```
tb_empresas (criado)
├─ nm_plano = "partner"
└─ nm_porte = "Pequeno|Médio|Grande"

tb_fornecedores (criado automaticamente)
├─ id_fornecedor
├─ id_empresa → tb_empresas
├─ nm_fornecedor
├─ nm_tipo (Fabricante, Distribuidor, Importador)
├─ nr_cnpj
├─ ds_catalogo_url
├─ ds_segmentos (JSON: ["Dermocosméticos", "Equipamentos", "Injetáveis"])
└─ nr_prazo_entrega_dias

tb_users (admin fornecedor)
├─ id_perfil → Fornecedor (clone)
├─ id_empresa → tb_empresas
└─ nm_papel = "fornecedor"
```

---

## 🛠️ Plano de Implementação

### **FASE 1: Corrigir Estrutura de Perfis** ✅

#### **1.1. Criar Perfil Template "Fornecedor"**

```sql
-- Migration: 022_create_fornecedor_profile.sql

INSERT INTO tb_perfis (
  id_perfil,
  nm_perfil,
  ds_perfil,
  nm_tipo,
  fg_template,
  id_empresa,
  ds_grupos_acesso,
  ds_permissoes_detalhadas,
  st_ativo
) VALUES (
  gen_random_uuid(),
  'Fornecedor',
  'Perfil de fornecedor/fabricante com acesso ao marketplace e gestão de produtos',
  'system',
  true,  -- É template global
  NULL,  -- Não pertence a nenhuma empresa
  ARRAY['fornecedor']::TEXT[],
  '{
    "fornecedor": {
      "dashboard": {"visualizar": true},
      "produtos": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
      "pedidos": {"visualizar": true, "editar": true},
      "financeiro": {"visualizar": true, "exportar": true},
      "relatorios": {"visualizar": true, "exportar": true},
      "perfil": {"visualizar": true, "editar": true}
    }
  }'::JSONB,
  'S'
);
```

#### **1.2. Atualizar Perfil "admin" para "Super Admin"**

```sql
-- Migration: 022_update_admin_profile.sql

-- Criar novo perfil "Super Admin" (mantém o ID do admin existente)
UPDATE tb_perfis
SET
  nm_perfil = 'Super Admin',
  ds_perfil = 'Administrador da plataforma com acesso total (não pertence a empresa)',
  ds_grupos_acesso = ARRAY['admin']::TEXT[],
  ds_permissoes_detalhadas = '{
    "admin": {
      "dashboard": {"visualizar": true},
      "usuarios": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
      "empresas": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
      "perfis": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
      "agentes": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
      "conversas": {"visualizar": true, "excluir": true},
      "analytics": {"visualizar": true},
      "configuracoes": {"visualizar": true, "editar": true},
      "tools": {"visualizar": true, "executar": true}
    }
  }'::JSONB
WHERE
  nm_perfil = 'admin'
  AND fg_template = true
  AND id_empresa IS NULL;
```

#### **1.3. Migrar Usuários sem Perfil**

```sql
-- Migration: 022_migrate_users_without_profile.sql

-- Usuários com nm_papel='admin' e sem perfil → Super Admin
UPDATE tb_users u
SET id_perfil = (
  SELECT id_perfil FROM tb_perfis
  WHERE nm_perfil = 'Super Admin'
    AND fg_template = true
    AND id_empresa IS NULL
  LIMIT 1
)
WHERE
  u.st_ativo = 'S'
  AND u.id_perfil IS NULL
  AND u.nm_papel = 'admin';

-- Usuários com nm_papel='usuario' e sem perfil → Paciente (se tiver id_empresa)
UPDATE tb_users u
SET id_perfil = (
  SELECT p.id_perfil FROM tb_perfis p
  WHERE p.nm_perfil = 'Paciente'
    AND p.id_empresa = u.id_empresa
    AND p.fg_template = false
  LIMIT 1
)
WHERE
  u.st_ativo = 'S'
  AND u.id_perfil IS NULL
  AND u.nm_papel IN ('usuario', 'user')
  AND u.id_empresa IS NOT NULL;

-- Log de usuários que não puderam ser migrados
SELECT
  id_user,
  nm_email,
  nm_completo,
  nm_papel,
  id_empresa,
  CASE
    WHEN id_empresa IS NULL THEN 'Falta empresa'
    WHEN id_perfil IS NULL THEN 'Perfil não encontrado'
    ELSE 'OK'
  END as motivo
FROM tb_users
WHERE st_ativo = 'S' AND id_perfil IS NULL;
```

---

### **FASE 2: Atualizar Serviço de Ativação de Parceiros** ✅

#### **2.1. Refatorar `partner_activation_service.py`**

**Alterações**:
1. ✅ Atualizar `PROFILE_MAP` para incluir "Fornecedor"
2. ✅ Atualizar `PROFILE_PERMISSIONS` com permissões de fornecedor
3. ✅ Adicionar método `_create_specific_entity()` para criar estruturas específicas
4. ✅ Integrar criação de `tb_clinicas`, `tb_profissionais`, `tb_fornecedores`

**Código Atualizado**:

```python
# src/services/partner_activation_service.py

class PartnerActivationService:
    """Serviço de ativação automática de parceiros."""

    # Mapeia tipo de parceiro para o perfil template correto
    PROFILE_MAP = {
        "clinic": "Gestor de Clínica",
        "clinica": "Gestor de Clínica",
        "professional": "Profissional",
        "profissional": "Profissional",
        "supplier": "Fornecedor",
        "fornecedor": "Fornecedor",
        "fabricante": "Fornecedor",
    }

    # Configuração de permissões padrão para cada tipo de perfil
    PROFILE_PERMISSIONS = {
        "Gestor de Clínica": {
            "ds_grupos_acesso": ["clinica"],
            "ds_permissoes_detalhadas": {
                "clinica": {
                    "dashboard": {"visualizar": True},
                    "agenda": {"visualizar": True, "criar": True, "editar": True, "excluir": True, "cancelar": True},
                    "pacientes": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "profissionais": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "procedimentos": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "financeiro": {"visualizar": True, "criar": True, "editar": True, "exportar": True},
                    "relatorios": {"visualizar": True, "exportar": True},
                    "configuracoes": {"visualizar": True, "editar": True},
                    "equipe": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "perfis": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                }
            },
        },
        "Profissional": {
            "ds_grupos_acesso": ["profissional"],
            "ds_permissoes_detalhadas": {
                "profissional": {
                    "dashboard": {"visualizar": True},
                    "agenda": {"visualizar": True, "criar": True, "editar": True},
                    "relatorios": {"visualizar": True, "exportar": True},
                    "procedimentos": {"visualizar": True},
                    "pacientes": {"visualizar": True, "editar": True},
                }
            },
        },
        "Fornecedor": {  # ← NOVO
            "ds_grupos_acesso": ["fornecedor"],
            "ds_permissoes_detalhadas": {
                "fornecedor": {
                    "dashboard": {"visualizar": True},
                    "produtos": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "pedidos": {"visualizar": True, "editar": True},
                    "financeiro": {"visualizar": True, "exportar": True},
                    "relatorios": {"visualizar": True, "exportar": True},
                    "perfil": {"visualizar": True, "editar": True},
                }
            },
        },
    }

    async def activate_partner(
        self,
        partner_type: str,
        contact_name: str,
        contact_email: str,
        contact_phone: str,
        business_name: str,
        cnpj: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        selected_services: List[str] = None,
        plan_type: Optional[str] = "professional",
        billing_cycle: str = "monthly",
    ) -> Dict:
        """
        Ativa um parceiro automaticamente com acesso imediato.
        """
        try:
            # Garantir que o catálogo de serviços existe
            await self.package_service.ensure_service_catalog()

            # 1. Criar o lead
            logger.info(f"Criando lead para parceiro: {business_name}")
            lead = await self._create_lead(
                partner_type=partner_type,
                contact_name=contact_name,
                contact_email=contact_email,
                contact_phone=contact_phone,
                business_name=business_name,
                cnpj=cnpj,
                city=city,
                state=state,
                selected_services=selected_services or [],
            )

            # 2. Criar empresa e usuário
            logger.info(f"Criando empresa e usuário para: {business_name}")
            empresa, user, temp_password = await self._create_empresa_and_user(
                business_name=business_name,
                contact_name=contact_name,
                contact_email=contact_email,
                contact_phone=contact_phone,
                cnpj=cnpj,
                partner_type=partner_type,
            )

            # 3. NOVO: Criar estrutura específica do tipo de parceiro
            logger.info(f"Criando estrutura específica para tipo: {partner_type}")
            specific_entity = await self._create_specific_entity(
                partner_type=partner_type,
                empresa=empresa,
                business_name=business_name,
                cnpj=cnpj,
                city=city,
                state=state,
            )

            # 4. Criar pacote com as licenças
            logger.info(f"Criando pacote de licenças para: {business_name}")
            package = await self._create_package_with_licenses(
                lead=lead,
                selected_services=selected_services or [],
                billing_cycle=billing_cycle,
            )

            # 5. Atribuir licenças ao usuário
            logger.info(f"Atribuindo licenças ao usuário: {contact_email}")
            licenses = await self._assign_licenses_to_user(
                package=package,
                user_email=contact_email,
                user_name=contact_name,
            )

            # 6. Atualizar status do lead para aprovado/ativo
            lead.nm_status = "approved"
            await self.db.commit()
            await self.db.refresh(lead)

            logger.info(f"✅ Parceiro {business_name} ativado com sucesso!")

            return {
                "success": True,
                "message": "Parceiro ativado com sucesso! Acesso imediato liberado.",
                "partner": {
                    "id_lead": str(lead.id_partner_lead),
                    "id_empresa": str(empresa.id_empresa),
                    "id_user": str(user.id_user),
                    "id_specific_entity": str(specific_entity.get("id")) if specific_entity else None,
                    "business_name": business_name,
                    "contact_name": contact_name,
                    "contact_email": contact_email,
                    "status": lead.nm_status,
                },
                "credentials": {
                    "email": contact_email,
                    "temporary_password": temp_password,
                    "must_change_password": True,
                },
                "package": {
                    "id_package": str(package.id_partner_package),
                    "package_code": package.package_code,
                    "package_name": package.package_name,
                    "status": package.status,
                    "billing_cycle": billing_cycle,
                },
                "licenses": [
                    {
                        "license_key": lic["license_key"],
                        "status": lic["status"],
                        "service": lic.get("service_name"),
                    }
                    for lic in licenses
                ],
                "access_info": {
                    "dashboard_url": self._get_dashboard_url(partner_type),
                    "login_url": "/login",
                    "onboarding_url": "/onboarding",
                },
            }

        except Exception as exc:
            logger.error(f"Erro ao ativar parceiro: {exc}", exc_info=True)
            await self.db.rollback()
            raise

    async def _create_specific_entity(
        self,
        partner_type: str,
        empresa: Empresa,
        business_name: str,
        cnpj: Optional[str],
        city: Optional[str],
        state: Optional[str],
    ) -> Optional[Dict]:
        """
        Cria a estrutura específica do tipo de parceiro.

        - clinic → tb_clinicas
        - professional → tb_profissionais
        - supplier/fabricante → tb_fornecedores
        """
        from src.models.clinica import Clinica
        from src.models.profissional import Profissional
        from src.models.fornecedor import Fornecedor

        if partner_type in ["clinic", "clinica"]:
            # Criar tb_clinicas
            clinica = Clinica(
                id_clinica=uuid.uuid4(),
                id_empresa=empresa.id_empresa,
                nm_clinica=business_name,
                nr_cnpj=cnpj,
                nm_cidade=city,
                nm_estado=state,
                st_ativo="S",
            )
            self.db.add(clinica)
            await self.db.flush()
            logger.info(f"✅ Clínica criada: {clinica.id_clinica}")
            return {"id": clinica.id_clinica, "type": "clinica"}

        elif partner_type in ["professional", "profissional"]:
            # Criar tb_profissionais
            profissional = Profissional(
                id_profissional=uuid.uuid4(),
                id_empresa=empresa.id_empresa,
                nm_profissional=business_name,
                fg_autonomo=True,
                st_ativo="S",
            )
            self.db.add(profissional)
            await self.db.flush()
            logger.info(f"✅ Profissional criado: {profissional.id_profissional}")
            return {"id": profissional.id_profissional, "type": "profissional"}

        elif partner_type in ["supplier", "fornecedor", "fabricante"]:
            # Criar tb_fornecedores
            fornecedor = Fornecedor(
                id_fornecedor=uuid.uuid4(),
                id_empresa=empresa.id_empresa,
                nm_fornecedor=business_name,
                nr_cnpj=cnpj,
                nm_cidade=city,
                nm_estado=state,
                nm_tipo="Fornecedor" if partner_type == "fornecedor" else "Fabricante",
                st_ativo="S",
            )
            self.db.add(fornecedor)
            await self.db.flush()
            logger.info(f"✅ Fornecedor criado: {fornecedor.id_fornecedor}")
            return {"id": fornecedor.id_fornecedor, "type": "fornecedor"}

        else:
            logger.warning(f"⚠️ Tipo de parceiro desconhecido: {partner_type}")
            return None

    def _get_dashboard_url(self, partner_type: str) -> str:
        """Retorna a URL do dashboard específica do tipo de parceiro."""
        if partner_type in ["clinic", "clinica"]:
            return "/clinica/dashboard"
        elif partner_type in ["professional", "profissional"]:
            return "/profissional/dashboard"
        elif partner_type in ["supplier", "fornecedor", "fabricante"]:
            return "/fornecedor/dashboard"
        else:
            return "/dashboard"
```

---

### **FASE 3: Criar Tabelas Específicas (se não existirem)** ✅

#### **3.1. Verificar e Criar `tb_clinicas`**

```sql
-- Migration: 022_create_tb_clinicas.sql

CREATE TABLE IF NOT EXISTS tb_clinicas (
  id_clinica UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
  nm_clinica VARCHAR(255) NOT NULL,
  ds_clinica TEXT,
  nm_especialidade VARCHAR(100),  -- Dermatologia, Estética, Odontologia
  nr_cnpj VARCHAR(18),
  nr_cnes VARCHAR(20),  -- Cadastro Nacional de Estabelecimentos de Saúde

  -- Endereço completo
  ds_endereco VARCHAR(255),
  nm_bairro VARCHAR(100),
  nm_cidade VARCHAR(100),
  nm_estado VARCHAR(2),
  nr_cep VARCHAR(10),

  -- Contato
  nr_telefone VARCHAR(20),
  nm_email VARCHAR(255),
  ds_site_url VARCHAR(500),

  -- Capacidade
  nr_capacidade_atendimentos INTEGER DEFAULT 10,
  nr_salas_atendimento INTEGER DEFAULT 1,

  -- Timestamps
  st_ativo CHAR(1) NOT NULL DEFAULT 'S',
  dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  dt_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clinicas_empresa ON tb_clinicas(id_empresa);
CREATE INDEX idx_clinicas_ativo ON tb_clinicas(st_ativo);
CREATE INDEX idx_clinicas_cidade_estado ON tb_clinicas(nm_cidade, nm_estado);

-- RLS (Row-Level Security)
ALTER TABLE tb_clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinicas_isolation_policy ON tb_clinicas
USING (id_empresa = current_user_empresa_id());
```

#### **3.2. Verificar e Ajustar `tb_profissionais`**

```sql
-- Migration: 022_update_tb_profissionais.sql

-- Adicionar campos necessários se não existirem
ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE;

ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS fg_autonomo BOOLEAN DEFAULT false;

ALTER TABLE tb_profissionais
ADD COLUMN IF NOT EXISTS ds_bio TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_profissionais_empresa ON tb_profissionais(id_empresa);
CREATE INDEX IF NOT EXISTS idx_profissionais_autonomo ON tb_profissionais(fg_autonomo);

-- RLS
ALTER TABLE tb_profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS profissionais_isolation_policy ON tb_profissionais
USING (id_empresa IS NULL OR id_empresa = current_user_empresa_id());
```

#### **3.3. Verificar e Ajustar `tb_fornecedores`**

```sql
-- Migration: 022_update_tb_fornecedores.sql

-- Adicionar campos necessários se não existirem
ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE;

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS nm_tipo VARCHAR(50) DEFAULT 'Fornecedor';  -- Fornecedor, Fabricante, Distribuidor

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS ds_segmentos JSONB DEFAULT '[]';  -- ["Dermocosméticos", "Equipamentos"]

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS ds_catalogo_url VARCHAR(500);

ALTER TABLE tb_fornecedores
ADD COLUMN IF NOT EXISTS nr_prazo_entrega_dias INTEGER DEFAULT 30;

-- Índices
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON tb_fornecedores(id_empresa);
CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON tb_fornecedores(nm_tipo);
CREATE INDEX IF NOT EXISTS idx_fornecedores_segmentos ON tb_fornecedores USING gin(ds_segmentos);

-- RLS
ALTER TABLE tb_fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS fornecedores_isolation_policy ON tb_fornecedores
USING (id_empresa = current_user_empresa_id());
```

---

### **FASE 4: Implementar Lógica de Admin por Contexto** ✅

#### **4.1. Criar Função `current_user_empresa_id()`**

```sql
-- Migration: 022_create_current_user_empresa_function.sql

CREATE OR REPLACE FUNCTION current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  -- Retorna o id_empresa do usuário atual (via contexto da sessão)
  -- Se não houver contexto, retorna NULL (admin da plataforma)
  RETURN NULLIF(current_setting('app.current_user_empresa_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### **4.2. Atualizar Middleware de Autenticação**

```python
# src/middleware/tenant_context_middleware.py

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

async def set_tenant_context(request: Request, db: AsyncSession, user_empresa_id: Optional[uuid.UUID]):
    """
    Define o contexto de tenant (empresa) para a sessão do banco de dados.

    Args:
        request: Request do FastAPI
        db: Sessão do banco de dados
        user_empresa_id: ID da empresa do usuário (NULL = admin da plataforma)
    """
    if user_empresa_id:
        # Usuário pertence a uma empresa (admin de empresa)
        await db.execute(text(f"SET app.current_user_empresa_id = '{user_empresa_id}'"))
    else:
        # Admin da plataforma (acesso total, sem filtro)
        await db.execute(text("SET app.current_user_empresa_id = NULL"))
```

#### **4.3. Atualizar Dependência `get_current_user()`**

```python
# src/utils/auth.py

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Retorna o usuário atual autenticado e configura o contexto de tenant.
    """
    # 1. Validar token e obter user_id
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_access_token(token)
    user_id = payload.get("sub")

    # 2. Buscar usuário no banco
    stmt = select(User).where(User.id_user == user_id, User.st_ativo == "S")
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    # 3. Configurar contexto de tenant
    await set_tenant_context(request, db, user.id_empresa)

    return user
```

---

### **FASE 5: Frontend - Atualizar Fluxo de Onboarding** ✅

#### **5.1. Criar Páginas de Dashboard Específicas**

```
/mnt/repositorios/DoctorQ/estetiQ-web/src/app/
├── (dashboard)/
│   ├── admin/           # Admin Plataforma (id_empresa=NULL)
│   │   └── dashboard/page.tsx
│   ├── clinica/         # Admin Clínica (id_empresa!=NULL, grupo=clinica)
│   │   └── dashboard/page.tsx
│   ├── profissional/    # Admin Profissional (id_empresa!=NULL, grupo=profissional)
│   │   └── dashboard/page.tsx
│   └── fornecedor/      # Admin Fornecedor (id_empresa!=NULL, grupo=fornecedor)
│       └── dashboard/page.tsx
```

#### **5.2. Criar Hook `useUserContext`**

```typescript
// src/hooks/useUserContext.ts

import { useSession } from 'next-auth/react';
import useSWR from 'swr';

export interface UserContext {
  user: User;
  empresa: Empresa | null;
  perfil: Perfil;
  isAdminPlataforma: boolean;  // Admin da Plataforma (id_empresa=NULL)
  isAdminEmpresa: boolean;     // Admin de Empresa (id_empresa!=NULL)
  gruposAcesso: string[];      // [admin, clinica, profissional, paciente, fornecedor]
  permissoes: PermissoesDetalhadas;
}

export function useUserContext() {
  const { data: session } = useSession();

  const { data, error, isLoading } = useSWR<UserContext>(
    session?.user?.id ? '/users/me/context' : null,
    fetcher
  );

  return {
    context: data,
    isLoading,
    error,
    isAdminPlataforma: data?.isAdminPlataforma ?? false,
    isAdminEmpresa: data?.isAdminEmpresa ?? false,
    gruposAcesso: data?.gruposAcesso ?? [],
  };
}
```

#### **5.3. Criar Endpoint `/users/me/context`**

```python
# src/routes/user.py

@router.get("/me/context", response_model=UserContextResponse)
async def get_user_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna contexto completo do usuário (empresa, perfil, permissões).
    """
    # Buscar empresa (se existir)
    empresa = None
    if current_user.id_empresa:
        stmt = select(Empresa).where(Empresa.id_empresa == current_user.id_empresa)
        result = await db.execute(stmt)
        empresa = result.scalar_one_or_none()

    # Buscar perfil
    stmt = select(Perfil).where(Perfil.id_perfil == current_user.id_perfil)
    result = await db.execute(stmt)
    perfil = result.scalar_one_or_none()

    # Determinar tipo de admin
    is_admin_plataforma = (
        current_user.id_empresa is None
        and perfil
        and "admin" in perfil.ds_grupos_acesso
    )
    is_admin_empresa = (
        current_user.id_empresa is not None
        and perfil
        and any(grupo in perfil.ds_grupos_acesso for grupo in ["clinica", "profissional", "fornecedor"])
    )

    return {
        "user": UserResponse.from_orm(current_user),
        "empresa": EmpresaResponse.from_orm(empresa) if empresa else None,
        "perfil": PerfilResponse.from_orm(perfil) if perfil else None,
        "isAdminPlataforma": is_admin_plataforma,
        "isAdminEmpresa": is_admin_empresa,
        "gruposAcesso": perfil.ds_grupos_acesso if perfil else [],
        "permissoes": perfil.ds_permissoes_detalhadas if perfil else {},
    }
```

---

## 📊 Resumo das Mudanças

### **Banco de Dados**
- ✅ Criar perfil template "Fornecedor"
- ✅ Atualizar perfil "admin" para "Super Admin"
- ✅ Migrar usuários sem perfil
- ✅ Criar `tb_clinicas` (se não existir)
- ✅ Atualizar `tb_profissionais` com id_empresa
- ✅ Atualizar `tb_fornecedores` com id_empresa
- ✅ Implementar RLS em todas as tabelas
- ✅ Criar função `current_user_empresa_id()`

### **Backend**
- ✅ Refatorar `partner_activation_service.py`
- ✅ Adicionar método `_create_specific_entity()`
- ✅ Atualizar `PROFILE_MAP` e `PROFILE_PERMISSIONS`
- ✅ Criar endpoint `/users/me/context`
- ✅ Atualizar middleware de tenant context

### **Frontend**
- ✅ Criar hook `useUserContext()`
- ✅ Criar páginas de dashboard específicas
- ✅ Atualizar navegação baseada em grupos de acesso
- ✅ Implementar redirecionamento inteligente após login

---

## ✅ Checklist de Implementação

### **Prioridade Alta (Bloqueadores)**
- [ ] Criar perfil template "Fornecedor"
- [ ] Migrar 6 usuários sem perfil
- [ ] Atualizar serviço de ativação de parceiros
- [ ] Criar estruturas específicas (clinica, profissional, fornecedor)

### **Prioridade Média (Melhorias)**
- [ ] Implementar RLS em todas as tabelas
- [ ] Criar endpoint `/users/me/context`
- [ ] Criar hook `useUserContext()`
- [ ] Atualizar dashboards específicos

### **Prioridade Baixa (Futuro)**
- [ ] Deprecar campo `nm_papel`
- [ ] Criar testes automatizados
- [ ] Documentar API atualizada
- [ ] Criar guia de onboarding

---

## 🎯 Conclusão

Esta análise identificou **5 problemas críticos** no sistema de cadastro e acesso:

1. ❌ **Perfil "Fornecedor" não existe** → Bloqueador para cadastro de fornecedores
2. ⚠️ **Usuários sem perfil** → 6 usuários sem permissões
3. ⚠️ **Confusão Admin Plataforma vs Empresa** → Falta distinção clara
4. ⚠️ **Estruturas específicas não criadas** → tb_clinicas, tb_profissionais, tb_fornecedores
5. ⚠️ **Multi-tenancy parcial** → RLS não aplicado em todas as tabelas

**Plano de Implementação**:
- **FASE 1**: Corrigir perfis (migrations + seed)
- **FASE 2**: Atualizar serviço de ativação
- **FASE 3**: Criar estruturas específicas
- **FASE 4**: Implementar tenant context
- **FASE 5**: Atualizar frontend

**Estimativa**: 2-3 dias de trabalho focado

---

**Próximo Passo**: Executar migrations da FASE 1 e testar fluxo de cadastro via `/partner-activation/` para cada tipo (clinic, professional, supplier).
