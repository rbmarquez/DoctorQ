# Sistema de Controle de Acesso em Dois Níveis - DoctorQ

**Data de Criação**: 05/11/2025
**Autor**: Claude
**Versão**: 1.0

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Implementado](#implementado)
4. [Próximas Etapas](#próximas-etapas)
5. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O sistema implementa **dois níveis** de controle de acesso:

### **Nível 1 - Controle de Grupos**
Define quais **áreas da aplicação** (grupos/rotas) o usuário pode acessar:
- `/admin` - Área administrativa
- `/clinica` - Área da clínica
- `/profissional` - Área do profissional
- `/paciente` - Portal do paciente
- `/fornecedor` - Portal do fornecedor

**Comportamento**: Menus e rotas são ocultados/bloqueados se o usuário não tiver acesso ao grupo.

### **Nível 2 - Controle de Funcionalidades**
Define **ações específicas** dentro de cada grupo:
- `visualizar` - Pode visualizar o recurso
- `criar` - Pode criar novos registros
- `editar` - Pode editar registros existentes
- `excluir` - Pode excluir registros
- `exportar` - Pode exportar dados (relatórios)
- `executar` - Pode executar ações (agentes, tools)

**Exemplo Prático**:
```
Secretária:
├─ Grupo: clinica
│  ├─ agenda: {criar: true, editar: true, visualizar: true}
│  ├─ pacientes: {criar: true, editar: false, visualizar: true}
│  └─ procedimentos: {visualizar: true}
```

---

## 🏗️ Arquitetura

### **1. Banco de Dados**

#### Tabela `tb_perfis` (Schema Atualizado)

```sql
CREATE TABLE tb_perfis (
  id_perfil UUID PRIMARY KEY,
  nm_perfil VARCHAR(100) NOT NULL,
  ds_perfil TEXT,
  id_empresa UUID REFERENCES tb_empresas(id_empresa),

  -- CONTROLE DE ACESSO (NOVOS CAMPOS)
  ds_grupos_acesso TEXT[] DEFAULT '{}',  -- Nível 1: Grupos permitidos
  ds_permissoes_detalhadas JSONB DEFAULT '{}',  -- Nível 2: Permissões por grupo
  fg_template BOOLEAN DEFAULT false,  -- É template?

  -- Campos legados
  ds_permissoes JSONB DEFAULT '{}',
  nm_tipo VARCHAR(20) DEFAULT 'custom',
  nm_tipo_acesso VARCHAR(20),
  id_perfil_pai UUID REFERENCES tb_perfis(id_perfil),
  nr_ordem INTEGER DEFAULT 0,
  st_ativo CHAR(1) DEFAULT 'S',
  dt_criacao TIMESTAMP DEFAULT NOW(),
  dt_atualizacao TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_perfis_grupos_acesso ON tb_perfis USING gin(ds_grupos_acesso);
CREATE INDEX idx_perfis_permissoes_detalhadas ON tb_perfis USING gin(ds_permissoes_detalhadas);
CREATE INDEX idx_perfis_template ON tb_perfis(fg_template);
```

#### Estrutura de Dados - `ds_permissoes_detalhadas`

```json
{
  "admin": {
    "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "empresas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true}
  },
  "clinica": {
    "agenda": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
    "pacientes": {"criar": true, "editar": true, "visualizar": true},
    "procedimentos": {"visualizar": true},
    "financeiro": {"visualizar": true},
    "relatorios": {"visualizar": true, "exportar": true}
  },
  "profissional": {
    "agenda": {"visualizar": true, "editar": true},
    "relatorios": {"visualizar": true},
    "procedimentos": {"visualizar": true}
  }
}
```

#### Funções PostgreSQL

```sql
-- Verificar acesso a grupo
SELECT perfil_tem_acesso_grupo(
  '22222222-2222-2222-2222-222222222221'::uuid,  -- id_perfil
  'admin'  -- grupo
);

-- Verificar permissão específica
SELECT perfil_tem_permissao(
  '22222222-2222-2222-2222-222222222221'::uuid,  -- id_perfil
  'clinica',  -- grupo
  'agenda',   -- recurso
  'criar'     -- ação
);
```

#### View `vw_usuarios_permissoes`

```sql
CREATE VIEW vw_usuarios_permissoes AS
SELECT
  u.id_user,
  u.nm_email,
  u.nm_completo,
  p.nm_perfil,
  p.ds_grupos_acesso,
  p.ds_permissoes_detalhadas,
  'admin' = ANY(p.ds_grupos_acesso) AS fg_acesso_admin,
  'clinica' = ANY(p.ds_grupos_acesso) AS fg_acesso_clinica,
  'profissional' = ANY(p.ds_grupos_acesso) AS fg_acesso_profissional,
  'paciente' = ANY(p.ds_grupos_acesso) AS fg_acesso_paciente,
  'fornecedor' = ANY(p.ds_grupos_acesso) AS fg_acesso_fornecedor
FROM tb_users u
LEFT JOIN tb_perfis p ON u.id_perfil = p.id_perfil
WHERE u.st_ativo = 'S';
```

---

### **2. Backend (FastAPI)**

#### Model Atualizado - `src/models/perfil.py`

```python
from sqlalchemy import ARRAY, Boolean, Column, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB, UUID

class Perfil(Base):
    __tablename__ = "tb_perfis"

    id_perfil = Column(UUID(as_uuid=True), primary_key=True)
    nm_perfil = Column(String(100), nullable=False)
    ds_perfil = Column(String)

    # CONTROLE DE ACESSO EM DOIS NÍVEIS
    ds_grupos_acesso = Column(ARRAY(Text), nullable=False, default=[])
    ds_permissoes_detalhadas = Column(JSONB, nullable=False, default={})
    fg_template = Column(Boolean, nullable=False, default=False)

    # ... outros campos
```

#### Pydantic Schema - `PerfilResponse`

```python
from typing import Dict, List

class PerfilResponse(BaseModel):
    id_perfil: uuid.UUID
    nm_perfil: str
    ds_perfil: Optional[str]

    # Controle de acesso
    ds_grupos_acesso: List[str] = Field(default_factory=list)
    ds_permissoes_detalhadas: Dict = Field(default_factory=dict)
    fg_template: bool = False

    # ... outros campos
```

#### Serviço de Permissões - `src/services/permission_service.py`

```python
class PermissionService:
    """Serviço para verificação de permissões"""

    async def check_group_access(self, user_id: UUID, grupo: str) -> bool:
        """Verifica se usuário tem acesso ao grupo (Nível 1)"""
        permissions = await self.get_user_permissions(user_id)
        return grupo in permissions["grupos_acesso"]

    async def check_feature_permission(
        self, user_id: UUID, grupo: str, recurso: str, acao: str
    ) -> bool:
        """Verifica permissão específica (Nível 2)"""
        permissions = await self.get_user_permissions(user_id)
        if grupo not in permissions["grupos_acesso"]:
            return False
        return permissions["permissoes_detalhadas"].get(grupo, {}) \
            .get(recurso, {}).get(acao, False)

    async def get_user_groups(self, user_id: UUID) -> List[str]:
        """Retorna grupos permitidos para o usuário"""
        permissions = await self.get_user_permissions(user_id)
        return permissions["grupos_acesso"]
```

---

### **3. Frontend (Next.js 15 + React 19)**

#### Tipos TypeScript - `src/types/permissions.ts` (A CRIAR)

```typescript
export type GrupoAcesso = 'admin' | 'clinica' | 'profissional' | 'paciente' | 'fornecedor';

export type AcaoPermissao = 'visualizar' | 'criar' | 'editar' | 'excluir' | 'exportar' | 'executar';

export interface PermissoesRecurso {
  visualizar?: boolean;
  criar?: boolean;
  editar?: boolean;
  excluir?: boolean;
  exportar?: boolean;
  executar?: boolean;
}

export interface PermissoesDetalhadas {
  [grupo: string]: {
    [recurso: string]: PermissoesRecurso;
  };
}

export interface UserPermissions {
  grupos_acesso: GrupoAcesso[];
  permissoes_detalhadas: PermissoesDetalhadas;
  is_admin: boolean;
  nm_perfil: string;
  id_perfil: string;
}
```

#### Hook de Permissões - `src/hooks/usePermissions.ts` (A CRIAR)

```typescript
import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions, isLoading } = useSWR<UserPermissions>(
    user?.id_user ? `/users/${user.id_user}/permissions` : null
  );

  const hasGroupAccess = (grupo: GrupoAcesso) => {
    return permissions?.grupos_acesso.includes(grupo) ?? false;
  };

  const hasPermission = (grupo: GrupoAcesso, recurso: string, acao: AcaoPermissao) => {
    if (!hasGroupAccess(grupo)) return false;
    return permissions?.permissoes_detalhadas[grupo]?.[recurso]?.[acao] ?? false;
  };

  const getAccessibleGroups = () => {
    return permissions?.grupos_acesso ?? [];
  };

  return {
    permissions,
    isLoading,
    hasGroupAccess,
    hasPermission,
    getAccessibleGroups,
    isAdmin: permissions?.is_admin ?? false
  };
}
```

#### Componente Protected Route - `src/components/auth/ProtectedRoute.tsx` (A CRIAR)

```typescript
'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  grupo: GrupoAcesso;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ grupo, children, fallback }: ProtectedRouteProps) {
  const { hasGroupAccess, isLoading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasGroupAccess(grupo)) {
      router.push('/acesso-negado');
    }
  }, [grupo, hasGroupAccess, isLoading, router]);

  if (isLoading) {
    return <div>Carregando permissões...</div>;
  }

  if (!hasGroupAccess(grupo)) {
    return fallback || null;
  }

  return <>{children}</>;
}
```

#### Componente Protected Action - `src/components/auth/ProtectedAction.tsx` (A CRIAR)

```typescript
'use client';

import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedActionProps {
  grupo: GrupoAcesso;
  recurso: string;
  acao: AcaoPermissao;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedAction({
  grupo,
  recurso,
  acao,
  children,
  fallback
}: ProtectedActionProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;

  if (!hasPermission(grupo, recurso, acao)) {
    return fallback || null;
  }

  return <>{children}</>;
}
```

---

## ✅ Implementado

### Backend
- ✅ Migration 020 criada e aplicada
- ✅ Tabela `tb_perfis` atualizada com novos campos
- ✅ Funções PostgreSQL (`perfil_tem_acesso_grupo`, `perfil_tem_permissao`)
- ✅ View `vw_usuarios_permissoes` criada
- ✅ Model `Perfil` atualizado (SQLAlchemy)
- ✅ Pydantic schemas atualizados (`PerfilResponse`)
- ✅ Serviço `PermissionService` implementado
- ✅ Perfis template criados (admin, gestor_clinica, profissional, recepcionista, paciente)

### Frontend
- ⏳ **PENDENTE** (próximas etapas)

---

## 🚀 Próximas Etapas

### **Etapa 1: Endpoints da API** (Backend)

```python
# src/routes/permissions.py (CRIAR)
from fastapi import APIRouter, Depends
from src.services.permission_service import PermissionService, get_permission_service

router = APIRouter(prefix="/permissions", tags=["permissions"])

@router.get("/users/{user_id}/permissions")
async def get_user_permissions(
    user_id: str,
    perm_service: PermissionService = Depends(get_permission_service)
):
    """Retorna permissões completas do usuário"""
    return await perm_service.get_user_permissions(UUID(user_id))

@router.get("/users/{user_id}/groups")
async def get_user_groups(
    user_id: str,
    perm_service: PermissionService = Depends(get_permission_service)
):
    """Retorna grupos acessíveis pelo usuário"""
    return await perm_service.get_user_groups(UUID(user_id))

@router.post("/check-group-access")
async def check_group_access(
    user_id: str,
    grupo: str,
    perm_service: PermissionService = Depends(get_permission_service)
):
    """Verifica acesso a um grupo"""
    has_access = await perm_service.check_group_access(UUID(user_id), grupo)
    return {"has_access": has_access}

@router.post("/check-permission")
async def check_permission(
    user_id: str,
    grupo: str,
    recurso: str,
    acao: str,
    perm_service: PermissionService = Depends(get_permission_service)
):
    """Verifica permissão específica"""
    has_permission = await perm_service.check_feature_permission(
        UUID(user_id), grupo, recurso, acao
    )
    return {"has_permission": has_permission}
```

### **Etapa 2: Frontend - Tipos e Hooks**

1. Criar `src/types/permissions.ts`
2. Criar `src/hooks/usePermissions.ts`
3. Atualizar `src/hooks/useAuth.ts` para incluir permissões

### **Etapa 3: Frontend - Componentes de Proteção**

1. Criar `src/components/auth/ProtectedRoute.tsx`
2. Criar `src/components/auth/ProtectedAction.tsx`
3. Criar `src/components/auth/AccessDenied.tsx`

### **Etapa 4: Frontend - Filtro de Menu**

```typescript
// src/components/layout/Sidebar.tsx (ATUALIZAR)
import { usePermissions } from '@/hooks/usePermissions';

export function Sidebar() {
  const { getAccessibleGroups } = usePermissions();
  const accessibleGroups = getAccessibleGroups();

  const menuItems = [
    { label: 'Admin', href: '/admin', grupo: 'admin' as const },
    { label: 'Clínica', href: '/clinica', grupo: 'clinica' as const },
    { label: 'Profissional', href: '/profissional', grupo: 'profissional' as const },
    { label: 'Paciente', href: '/paciente', grupo: 'paciente' as const },
    { label: 'Fornecedor', href: '/fornecedor', grupo: 'fornecedor' as const },
  ];

  const filteredMenu = menuItems.filter(item =>
    accessibleGroups.includes(item.grupo)
  );

  return (
    <nav>
      {filteredMenu.map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

### **Etapa 5: Página de Configuração de Permissões**

Atualizar `/clinica/perfis` para permitir configurar:
1. **Grupos Acessíveis** (checkboxes para admin, clinica, profissional, etc)
2. **Permissões Detalhadas** (grid de recurso x ações)

---

## 💡 Exemplos de Uso

### **Exemplo 1: Proteger uma Página Inteira**

```typescript
// src/app/(dashboard)/admin/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute grupo="admin">
      <div>
        <h1>Painel Administrativo</h1>
        {/* Conteúdo da página */}
      </div>
    </ProtectedRoute>
  );
}
```

### **Exemplo 2: Proteger um Botão**

```typescript
// Botão de criar agendamento
<ProtectedAction grupo="clinica" recurso="agenda" acao="criar">
  <Button onClick={handleCreateAgendamento}>
    Novo Agendamento
  </Button>
</ProtectedAction>
```

### **Exemplo 3: Verificar Permissão Programaticamente**

```typescript
const { hasPermission } = usePermissions();

const handleDelete = async (id: string) => {
  if (!hasPermission('clinica', 'pacientes', 'excluir')) {
    toast.error('Você não tem permissão para excluir pacientes');
    return;
  }

  await deletePaciente(id);
};
```

### **Exemplo 4: Filtrar Menu por Grupo**

```typescript
const { hasGroupAccess } = usePermissions();

const sidebarItems = [
  { label: 'Dashboard Admin', href: '/admin', grupo: 'admin' },
  { label: 'Agenda', href: '/clinica/agenda', grupo: 'clinica' },
  { label: 'Meus Agendamentos', href: '/paciente/agendamentos', grupo: 'paciente' },
].filter(item => hasGroupAccess(item.grupo));
```

---

## 📊 Perfis Template Padrão

### 1. Administrador Total

```json
{
  "ds_grupos_acesso": ["admin", "clinica", "profissional", "paciente", "fornecedor"],
  "ds_permissoes_detalhadas": {
    "admin": {
      "usuarios": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "empresas": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "perfis": {"criar": true, "editar": true, "excluir": true, "visualizar": true}
    },
    "clinica": {
      "agenda": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "pacientes": {"criar": true, "editar": true, "excluir": true, "visualizar": true}
    }
  }
}
```

### 2. Gestor de Clínica

```json
{
  "ds_grupos_acesso": ["clinica"],
  "ds_permissoes_detalhadas": {
    "clinica": {
      "agenda": {"criar": true, "editar": true, "excluir": true, "visualizar": true},
      "pacientes": {"criar": true, "editar": true, "visualizar": true},
      "procedimentos": {"criar": true, "editar": true, "visualizar": true},
      "financeiro": {"visualizar": true},
      "relatorios": {"visualizar": true, "exportar": true}
    }
  }
}
```

### 3. Secretária/Recepcionista

```json
{
  "ds_grupos_acesso": ["clinica"],
  "ds_permissoes_detalhadas": {
    "clinica": {
      "agenda": {"criar": true, "editar": true, "visualizar": true},
      "pacientes": {"criar": true, "editar": true, "visualizar": true},
      "procedimentos": {"visualizar": true}
    }
  }
}
```

### 4. Profissional

```json
{
  "ds_grupos_acesso": ["profissional"],
  "ds_permissoes_detalhadas": {
    "profissional": {
      "agenda": {"visualizar": true, "editar": true},
      "relatorios": {"visualizar": true},
      "procedimentos": {"visualizar": true},
      "pacientes": {"visualizar": true}
    }
  }
}
```

### 5. Paciente

```json
{
  "ds_grupos_acesso": ["paciente"],
  "ds_permissoes_detalhadas": {
    "paciente": {
      "agendamentos": {"criar": true, "visualizar": true, "cancelar": true},
      "avaliacoes": {"criar": true, "editar": true, "visualizar": true},
      "financeiro": {"visualizar": true},
      "perfil": {"editar": true, "visualizar": true}
    }
  }
}
```

---

## 🔐 Segurança

### Validações Obrigatórias

1. **Backend**: Sempre validar permissões no servidor (não confiar no frontend)
2. **Middleware**: Criar middleware de validação automática para rotas protegidas
3. **Logs**: Registrar tentativas de acesso negado para auditoria
4. **Tokens**: Incluir `id_perfil` no JWT para validação rápida

### Exemplo de Middleware (A CRIAR)

```python
# src/middleware/permission_middleware.py
from fastapi import Request, HTTPException
from src.services.permission_service import PermissionService

async def check_permission_middleware(
    request: Request,
    grupo: str,
    recurso: str,
    acao: str
):
    user_id = request.state.user.id_user  # Do JWT
    perm_service = PermissionService(request.state.db)

    if not await perm_service.check_feature_permission(user_id, grupo, recurso, acao):
        raise HTTPException(status_code=403, detail="Acesso negado")
```

---

## 📝 Checklist de Implementação

### Backend
- [x] Migration criada e aplicada
- [x] Model `Perfil` atualizado
- [x] Serviço `PermissionService` implementado
- [ ] Endpoints de permissões criados
- [ ] Middleware de validação criado
- [ ] Testes unitários implementados

### Frontend
- [ ] Tipos TypeScript criados
- [ ] Hook `usePermissions` implementado
- [ ] Componente `ProtectedRoute` criado
- [ ] Componente `ProtectedAction` criado
- [ ] Filtro de menu implementado
- [ ] Página de configuração de permissões atualizada
- [ ] Testes E2E implementados

---

## 🎓 Referências

- Tabela: `tb_perfis`
- Migration: `migration_020_add_permission_control.sql`
- Model: `src/models/perfil.py`
- Serviço: `src/services/permission_service.py`
- View: `vw_usuarios_permissoes`

---

**Status**: 🟡 Em Implementação (Backend 80% completo, Frontend 0%)
**Próximo Passo**: Criar endpoints de permissões no backend
**Responsável**: Equipe de desenvolvimento
