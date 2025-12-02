# Guia de Aplicação do Decorator @require_permission

**Data**: 05/11/2025
**Objetivo**: Aplicar o sistema de permissões de dois níveis em todos os endpoints CRUD da API

## ✅ O Que Já Foi Implementado

### 1. Middleware de Permissões (Completo)
- **Arquivo**: `src/middleware/permission_middleware.py`
- **Decorator**: `@require_permission(grupo, recurso, acao)`
- **Funções auxiliares**: `check_permission()`, `get_user_permissions()`

### 2. Função get_current_user (Completo)
- **Arquivo**: `src/utils/auth.py`
- **Função**: `async def get_current_user(...) -> User`
- **Suporta**:
  - JWT tokens (usuários logados via `/login-local` ou OAuth)
  - API Key global (fallback para testes/integrações - retorna user "system" com papel admin)

### 3. Hook Frontend (Completo)
- **Arquivo**: `src/hooks/usePermissaoDetalhada.tsx`
- **Exports**: `usePermissaoDetalhada()`, `withPermission()`, `PermissionGuard`

### 4. Arquivo de Exemplo (Completo)
- **Arquivo**: `src/routes/agendamentos_route.py` ✅ ATUALIZADO
- **Endpoints protegidos**:
  - `POST /agendamentos/` - criar
  - `GET /agendamentos/` - visualizar (list)
  - `GET /agendamentos/{id}` - visualizar (get)
  - `DELETE /agendamentos/{id}` - excluir

## 📋 Checklist de Implementação por Arquivo de Rota

Para cada arquivo de rota (`src/routes/*.py`), siga este checklist:

### Passo 1: Adicionar Imports

```python
# No topo do arquivo, adicionar:
from src.middleware.permission_middleware import require_permission
from src.models.user import User
from src.utils.auth import get_current_user

# Remover ou manter (se precisar de outros usos):
# from src.utils.auth import get_current_apikey
```

### Passo 2: Identificar Grupo e Recursos

**Mapeamento Grupo → Recursos**:

| Grupo         | Recursos Típicos                                                      |
|---------------|-----------------------------------------------------------------------|
| `admin`       | usuarios, empresas, perfis, agentes, analytics, billing, configuracoes |
| `clinica`     | clinicas, agendamentos, profissionais, pacientes, procedimentos       |
| `profissional`| agendamentos (próprios), pacientes (próprios), procedimentos          |
| `paciente`    | agendamentos (próprios), avaliacoes, favoritos, pedidos              |
| `fornecedor`  | produtos, pedidos, fornecedores                                       |

**Dica**: Se em dúvida sobre qual grupo usar, consulte `DOC_Arquitetura/ANALISE_SISTEMA_PERMISSOES_DOIS_NIVEIS.md`

### Passo 3: Aplicar Decorator aos Endpoints

**Padrão de Aplicação**:

#### Endpoint POST (Criar)

```python
# ANTES:
@router.post("/", response_model=RecursoResponse)
async def criar_recurso(
    request: RecursoCreateRequest,
    db: AsyncSession = Depends(ORMConfig.get_session),
    _: object = Depends(get_current_apikey),  # ❌ Remover
):
    """Criar novo recurso"""
    pass

# DEPOIS:
@router.post("/", response_model=RecursoResponse)
@require_permission(grupo="clinica", recurso="recursos", acao="criar")  # ✅ Adicionar
async def criar_recurso(
    request: RecursoCreateRequest,
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),  # ✅ Adicionar
):
    """
    Criar novo recurso.

    **Permissão necessária**: clinica.recursos.criar
    """
    pass
```

#### Endpoint GET (Listar)

```python
@router.get("/", response_model=List[RecursoResponse])
@require_permission(grupo="clinica", recurso="recursos", acao="visualizar")
async def listar_recursos(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Listar recursos com paginação.

    **Permissão necessária**: clinica.recursos.visualizar
    """
    pass
```

#### Endpoint GET (Obter por ID)

```python
@router.get("/{id_recurso}", response_model=RecursoResponse)
@require_permission(grupo="clinica", recurso="recursos", acao="visualizar")
async def obter_recurso(
    id_recurso: str,
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Obter detalhes de um recurso.

    **Permissão necessária**: clinica.recursos.visualizar
    """
    pass
```

#### Endpoint PUT/PATCH (Atualizar)

```python
@router.put("/{id_recurso}", response_model=RecursoResponse)
@require_permission(grupo="clinica", recurso="recursos", acao="editar")
async def atualizar_recurso(
    id_recurso: str,
    request: RecursoUpdateRequest,
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Atualizar um recurso.

    **Permissão necessária**: clinica.recursos.editar
    """
    pass
```

#### Endpoint DELETE (Excluir)

```python
@router.delete("/{id_recurso}")
@require_permission(grupo="clinica", recurso="recursos", acao="excluir")
async def excluir_recurso(
    id_recurso: str,
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Excluir um recurso (soft delete).

    **Permissão necessária**: clinica.recursos.excluir
    """
    pass
```

### Passo 4: Atualizar Chamadas Internas

Se um endpoint chama outro endpoint internamente (como `criar_agendamento` chamando `obter_agendamento`), atualize a assinatura:

```python
# ANTES:
return await obter_agendamento(id_agendamento, db, _)

# DEPOIS:
return await obter_agendamento(id_agendamento, db, current_user)
```

### Passo 5: Compilar e Testar

```bash
# Compilar arquivo individual
python3 -m py_compile src/routes/nome_do_arquivo_route.py

# Se compilar com sucesso, prosseguir para o próximo arquivo
```

## 🎯 Arquivos de Rota Prioritários (Ordem de Implementação)

### Alta Prioridade (Core Business)
1. ✅ `agendamentos_route.py` - **COMPLETO**
2. ⏳ `clinicas_route.py` - Gestão de clínicas
3. ⏳ `profissionais_route.py` - Gestão de profissionais
4. ⏳ `pacientes_route.py` - Gestão de pacientes
5. ⏳ `procedimentos_route.py` - Catálogo de procedimentos
6. ⏳ `avaliacoes_route.py` - Sistema de reviews
7. ⏳ `perfil.py` - Gestão de perfis (já parcialmente protegido)

### Média Prioridade (Marketplace)
8. ⏳ `produtos_route.py` - Catálogo de produtos
9. ⏳ `fornecedores_route.py` - Gestão de fornecedores
10. ⏳ `pedidos_route.py` - Gestão de pedidos
11. ⏳ `carrinho_route.py` - Carrinho de compras
12. ⏳ `cupom.py` - Sistema de cupons

### Média Prioridade (Administrativo)
13. ⏳ `empresa.py` - Gestão de empresas
14. ⏳ `user.py` - Gestão de usuários
15. ⏳ `configuracoes_route.py` - Configurações
16. ⏳ `billing.py` - Faturamento

### Baixa Prioridade (Auxiliar)
17. ⏳ `fotos_route.py` - Upload de fotos
18. ⏳ `albums_route.py` - Álbuns de fotos
19. ⏳ `mensagens_route.py` - Mensagens
20. ⏳ `notificacoes_route.py` - Notificações
21. ⏳ `favoritos_route.py` - Favoritos

### Não Aplicar (Endpoints Públicos ou Sistema)
- ❌ `onboarding.py` - Público (cadastro de parceiros)
- ❌ `partner_activation.py` - Sistema (ativação automática)
- ❌ `analytics.py` - Já tem autenticação específica
- ❌ Endpoints de health check, docs, webhooks

## 🔒 Casos Especiais

### 1. Endpoints Públicos (Sem Autenticação)

Para endpoints que devem ser públicos (busca de clínicas, lista de profissionais para pacientes não logados), **NÃO aplicar** o decorator:

```python
# Endpoint público - mantém como está
@router.get("/publico/clinicas", response_model=List[ClinicaResponse])
async def buscar_clinicas_publico(
    cidade: Optional[str] = None,
    especialidade: Optional[str] = None,
    db: AsyncSession = Depends(ORMConfig.get_session),
    # SEM autenticação
):
    """Buscar clínicas (público - sem autenticação)"""
    pass
```

### 2. Admin Bypass

O decorator já tem suporte a admin bypass por padrão. Usuários com `nm_papel="admin"` ou que usam API Key global passam automaticamente:

```python
@require_permission(grupo="clinica", recurso="recursos", acao="criar")
# Se current_user.nm_papel == "admin", permissão concedida automaticamente
```

Para **desabilitar** admin bypass (raro):

```python
@require_permission(grupo="clinica", recurso="recursos", acao="criar", allow_admin_bypass=False)
```

### 3. Permissões Customizadas

Para recursos que precisam de ações além de criar/visualizar/editar/excluir:

```python
@require_permission(grupo="admin", recurso="relatorios", acao="exportar")
async def exportar_relatorio(...):
    pass

@require_permission(grupo="admin", recurso="agentes", acao="executar")
async def executar_agente(...):
    pass
```

## ⚠️ Erros Comuns

### Erro 1: Forgot to add current_user dependency

```python
# ❌ ERRADO - decorator sem current_user no endpoint
@router.post("/")
@require_permission(grupo="clinica", recurso="recursos", acao="criar")
async def criar_recurso(
    request: RecursoCreateRequest,
    db: AsyncSession = Depends(ORMConfig.get_session),
    # ❌ Faltou: current_user: User = Depends(get_current_user)
):
    pass

# Erro: HTTPException 401 "Usuário não autenticado. Endpoint deve ter dependência get_current_user."
```

**Solução**: Sempre adicionar `current_user: User = Depends(get_current_user)` aos endpoints protegidos.

### Erro 2: Ordem dos decorators

```python
# ❌ ERRADO - decorator antes do router decorator
@require_permission(grupo="clinica", recurso="recursos", acao="criar")
@router.post("/")
async def criar_recurso(...):
    pass

# ✅ CORRETO - router decorator sempre primeiro
@router.post("/")
@require_permission(grupo="clinica", recurso="recursos", acao="criar")
async def criar_recurso(...):
    pass
```

### Erro 3: Typo no nome do grupo/recurso/ação

```python
# ❌ ERRADO - typos causam falha silenciosa
@require_permission(grupo="clinic", recurso="agendamento", acao="create")
#                          ^^^^^^           ^^^^^^^^^^^          ^^^^^^
#                          Deve ser "clinica", "agendamentos", "criar"
```

**Grupos válidos**: `admin`, `clinica`, `profissional`, `paciente`, `fornecedor`
**Ações válidas**: `visualizar`, `criar`, `editar`, `excluir`, `executar`, `exportar`

## 🧪 Como Testar

### 1. Testar com API Key Global (Admin Bypass)

```bash
curl -H "Authorization: Bearer vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8080/agendamentos/
```

**Esperado**: 200 OK (admin bypass ativo)

### 2. Testar com JWT de Usuário Real

```bash
# 1. Login
curl -X POST http://localhost:8080/users/login-local \
  -H "Content-Type: application/json" \
  -d '{"nm_email": "usuario@example.com", "password": "senha123"}'

# Resposta:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer"
# }

# 2. Usar o token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/agendamentos/
```

**Esperado**:
- **200 OK**: Se o usuário tem permissão `clinica.agendamentos.visualizar`
- **403 Forbidden**: Se o usuário não tem permissão

Resposta 403:
```json
{
  "detail": {
    "error": "Permissão negada",
    "message": "Sem permissão para 'visualizar' em 'agendamentos'",
    "required_permission": {
      "grupo": "clinica",
      "recurso": "agendamentos",
      "acao": "visualizar"
    }
  }
}
```

### 3. Testar Permissões no Banco

Verificar as permissões de um usuário:

```sql
-- Buscar perfil do usuário
SELECT u.nm_email, p.nm_perfil, p.ds_grupos_acesso, p.ds_permissoes_detalhadas
FROM tb_users u
INNER JOIN tb_perfis p ON u.id_perfil = p.id_perfil
WHERE u.nm_email = 'usuario@example.com';
```

Exemplo de resultado:
```
nm_email              | nm_perfil          | ds_grupos_acesso | ds_permissoes_detalhadas
----------------------|--------------------|----|-------------------
usuario@example.com   | Gestor de Clínica  | {clinica} | {
  "clinica": {
    "agendamentos": {"visualizar": true, "criar": true, "editar": true, "excluir": false},
    "profissionais": {"visualizar": true, "criar": false, "editar": false, "excluir": false}
  }
}
```

Este usuário:
- ✅ Pode visualizar, criar e editar agendamentos
- ❌ NÃO pode excluir agendamentos
- ✅ Pode visualizar profissionais
- ❌ NÃO pode criar/editar/excluir profissionais

## 📊 Progresso da Implementação

**Status Geral**: 🟡 Em Progresso

- ✅ Middleware implementado (Task 6)
- ✅ Hook frontend implementado (Task 7)
- ✅ Função `get_current_user` implementada (Task 8.1)
- ✅ Arquivo de exemplo `agendamentos_route.py` atualizado (Task 8.2)
- ⏳ Aplicar em demais arquivos de rota (Task 8.3 - **EM ANDAMENTO**)
- ⏳ Testes end-to-end (Task 10)

**Arquivos Atualizados**: 1/51 (2%)

---

## 🚀 Próximos Passos

1. **Aplicar o padrão** em todos os arquivos de rota prioritários (lista acima)
2. **Compilar e testar** cada arquivo individualmente
3. **Atualizar perfis no banco** para refletir permissões corretas:
   ```sql
   UPDATE tb_perfis
   SET ds_permissoes_detalhadas = '{
     "clinica": {
       "agendamentos": {"visualizar": true, "criar": true, "editar": true, "excluir": true},
       "profissionais": {"visualizar": true, "criar": true, "editar": true, "excluir": false}
     }
   }'
   WHERE nm_perfil = 'Gestor de Clínica';
   ```
4. **Rodar build completo** da API: `make dev`
5. **Executar Task 10**: Teste completo (cadastro → login → acesso → CRUD)

---

**Contato para Dúvidas**: Consultar `DOC_Arquitetura/ANALISE_SISTEMA_PERMISSOES_DOIS_NIVEIS.md` ou revisar `src/middleware/permission_middleware.py`
