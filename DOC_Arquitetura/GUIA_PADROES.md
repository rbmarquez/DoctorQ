# Guia de Padrões e Convenções - DoctorQ

> **Documento de Referência Permanente**
> Consulte este guia SEMPRE antes de implementar novas features.
> Todos os padrões, convenções de nomenclatura e tipagens estão aqui.

**Versão:** 1.0
**Última Atualização:** 02/11/2025

---

## 📋 Índice

- [Convenções de Nomenclatura](#convenções-de-nomenclatura)
- [Padrões de Banco de Dados](#padrões-de-banco-de-dados)
- [Padrões de Backend (Python/FastAPI)](#padrões-de-backend-pythonfastapi)
- [Padrões de Frontend (Next.js/React)](#padrões-de-frontend-nextjsreact)
- [Padrões de API](#padrões-de-api)
- [Documentação](#documentação)

---

## Convenções de Nomenclatura

### Banco de Dados (PostgreSQL)

#### Tabelas
- **Prefixo obrigatório:** `tb_`
- **Nome:** Plural em português, snake_case
- **Exemplos:**
  ```sql
  tb_usuarios
  tb_empresas
  tb_agendamentos
  tb_itens_pedido
  ```

#### Colunas

**Prefixos por Tipo:**

| Prefixo | Tipo de Dado | Exemplo |
|---------|--------------|---------|
| `id_` | Identificadores (PK, FK) | `id_usuario`, `id_empresa` |
| `nm_` | Nomes (VARCHAR) | `nm_completo`, `nm_email` |
| `ds_` | Descrições (TEXT) | `ds_biografia`, `ds_endereco` |
| `vl_` | Valores numéricos (DECIMAL, INTEGER) | `vl_total`, `vl_desconto` |
| `dt_` | Datas e timestamps | `dt_criacao`, `dt_nascimento` |
| `fg_` | Flags booleanas | `fg_ativo`, `fg_concluido` |
| `st_` | Status (CHAR(1) ou VARCHAR) | `st_ativo` ('S'/'N') |
| `qt_` | Quantidades (INTEGER) | `qt_itens`, `qt_parcelas` |
| `pc_` | Percentuais (DECIMAL) | `pc_desconto`, `pc_comissao` |
| `nr_` | Números identificadores | `nr_cnpj`, `nr_telefone` |

**Exemplos Completos:**
```sql
CREATE TABLE tb_usuarios (
  id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa UUID REFERENCES tb_empresas(id_empresa),
  nm_completo VARCHAR(255) NOT NULL,
  nm_email VARCHAR(255) UNIQUE NOT NULL,
  ds_biografia TEXT,
  dt_nascimento DATE,
  dt_criacao TIMESTAMP DEFAULT now(),
  dt_atualizacao TIMESTAMP,
  st_ativo CHAR(1) DEFAULT 'S',
  fg_verificado BOOLEAN DEFAULT false,
  nr_telefone VARCHAR(20),
  vl_credito DECIMAL(10,2) DEFAULT 0.00
);
```

#### Índices
- **Formato:** `idx_[tabela]_[coluna(s)]`
- **Exemplos:**
  ```sql
  CREATE INDEX idx_usuarios_email ON tb_usuarios(nm_email);
  CREATE INDEX idx_agendamentos_data ON tb_agendamentos(dt_agendamento);
  CREATE INDEX idx_pedidos_empresa ON tb_pedidos(id_empresa);
  ```

#### Constraints
- **Primary Keys:** `[tabela]_pkey`
- **Foreign Keys:** `[tabela]_[coluna]_fkey`
- **Unique:** `[tabela]_[coluna]_key`
- **Check:** `[tabela]_[coluna]_check`

---

### Backend (Python/FastAPI)

#### Arquivos e Módulos
- **Formato:** `snake_case.py`
- **Exemplos:**
  ```
  user_service.py
  agendamento_service.py
  perfil_service.py
  ```

#### Classes

**Models (SQLAlchemy):**
```python
class TbUsuarios(Base):
    """Modelo SQLAlchemy para usuários."""
    __tablename__ = "tb_usuarios"

    id_usuario = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nm_completo = Column(String(255), nullable=False)
    # ...
```

**Schemas (Pydantic):**
```python
class UsuarioBase(BaseModel):
    """Schema base para usuário."""
    nm_completo: str
    nm_email: EmailStr
    nr_telefone: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    """Schema para criação de usuário."""
    senha: str

class UsuarioResponse(UsuarioBase):
    """Schema para resposta de usuário."""
    id_usuario: uuid.UUID
    dt_criacao: datetime
    st_ativo: str

    class Config:
        from_attributes = True
```

**Services:**
```python
class UsuarioService:
    """Serviço de lógica de negócio para usuários."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def criar_usuario(self, data: UsuarioCreate) -> TbUsuarios:
        """Cria novo usuário no sistema."""
        # Implementação
```

#### Funções e Métodos
- **Formato:** `snake_case`
- **Verbos:** Sempre iniciar com verbo no infinitivo
- **Exemplos:**
  ```python
  async def buscar_usuario_por_email(email: str) -> Optional[TbUsuarios]:
  async def criar_agendamento(dados: AgendamentoCreate) -> TbAgendamentos:
  async def atualizar_status(id: UUID, status: str) -> bool:
  ```

#### Constantes
```python
# UPPER_SNAKE_CASE
API_VERSION = "v1"
MAX_UPLOAD_SIZE_MB = 10
DEFAULT_PAGE_SIZE = 10
```

---

### Frontend (Next.js/React/TypeScript)

#### Arquivos e Diretórios

**Componentes:**
```
src/components/
  ui/
    Button.tsx          # PascalCase
    Card.tsx
  layout/
    Header.tsx
    Sidebar.tsx
  forms/
    LoginForm.tsx
```

**Hooks:**
```
src/hooks/
  useAuth.ts            # camelCase com prefixo 'use'
  useAgendamentos.ts
  usePerfis.ts
```

**Páginas (App Router):**
```
src/app/
  (dashboard)/
    admin/
      page.tsx          # Sempre 'page.tsx'
      layout.tsx        # Sempre 'layout.tsx'
      usuarios/
        page.tsx
```

**API Routes:**
```
src/app/api/
  auth/
    [...nextauth]/
      route.ts          # Sempre 'route.ts'
```

#### Componentes React

```typescript
// PascalCase para componentes
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button
      className={cn("btn", `btn-${variant}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

#### Hooks Customizados

```typescript
// camelCase com prefixo 'use'
export function useAgendamentos() {
  const { data, error, isLoading, mutate } = useSWR<Agendamento[]>(
    '/agendamentos',
    fetcher
  );

  return {
    agendamentos: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
```

#### Interfaces e Types

```typescript
// PascalCase
export interface Usuario {
  id_usuario: string;
  nm_completo: string;
  nm_email: string;
  dt_criacao: string;
}

export type UsuarioStatus = 'ativo' | 'inativo' | 'pendente';
```

#### Variáveis e Constantes

```typescript
// camelCase para variáveis
const userName = "João Silva";
const isLoading = true;

// UPPER_SNAKE_CASE para constantes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_ITEMS_PER_PAGE = 10;
```

---

## Padrões de Banco de Dados

### Primary Keys
```sql
-- SEMPRE UUID com gen_random_uuid()
id_[tabela] UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Foreign Keys
```sql
-- Sempre com ON DELETE CASCADE ou RESTRICT
id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE
```

### Campos de Auditoria (Obrigatórios)
```sql
-- Sempre incluir em todas as tabelas
dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
dt_atualizacao TIMESTAMP,
st_ativo CHAR(1) NOT NULL DEFAULT 'S'
```

### Multi-Tenancy
```sql
-- Todas as tabelas de dados devem ter id_empresa
-- EXCETO: tb_users, tb_empresas, tb_perfis (core)
id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE
```

### Índices Obrigatórios
```sql
-- Sempre criar índices em:
-- 1. Foreign keys
CREATE INDEX idx_agendamentos_empresa ON tb_agendamentos(id_empresa);

-- 2. Campos de busca frequente
CREATE INDEX idx_usuarios_email ON tb_usuarios(nm_email);

-- 3. Campos de data (range queries)
CREATE INDEX idx_agendamentos_data ON tb_agendamentos(dt_agendamento);
```

---

## Padrões de Backend (Python/FastAPI)

### Estrutura de Pastas
```
src/
├── routes/         # Endpoints da API
├── services/       # Lógica de negócio (stateless)
├── models/         # SQLAlchemy ORM + Pydantic schemas
├── middleware/     # Middlewares (auth, CORS, logging)
├── config/         # Configurações (ORM, Redis, Logger)
└── utils/          # Funções utilitárias
```

### Padrão de Rotas (Routes)

```python
from fastapi import APIRouter, Depends
from src.models.usuario import UsuarioCreate, UsuarioResponse
from src.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

# SEMPRE com trailing slash!
@router.get("/")  # ✅ CORRETO
async def listar_usuarios(
    page: int = 1,
    size: int = 10,
    service: UsuarioService = Depends(get_usuario_service)
) -> dict:
    """Lista usuários com paginação."""
    return await service.listar_usuarios(page, size)

@router.post("/")
async def criar_usuario(
    data: UsuarioCreate,
    service: UsuarioService = Depends(get_usuario_service)
) -> UsuarioResponse:
    """Cria novo usuário."""
    return await service.criar_usuario(data)
```

### Padrão de Services

```python
class UsuarioService:
    """Serviço stateless para usuários."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar_usuarios(self, page: int, size: int) -> dict:
        """Lista usuários com paginação."""
        offset = (page - 1) * size

        stmt = select(TbUsuarios).offset(offset).limit(size)
        result = await self.db.execute(stmt)
        usuarios = result.scalars().all()

        # Contar total
        count_stmt = select(func.count()).select_from(TbUsuarios)
        total = await self.db.scalar(count_stmt)

        return {
            "items": [UsuarioResponse.model_validate(u).model_dump() for u in usuarios],
            "meta": {
                "total": total,
                "page": page,
                "size": size,
                "pages": (total + size - 1) // size
            }
        }
```

### Dependency Injection

```python
# Criar função get_service em cada service
async def get_usuario_service(
    db: AsyncSession = Depends(ORMConfig.get_session)
) -> UsuarioService:
    """Dependency para UsuarioService."""
    return UsuarioService(db)
```

### Error Handling

```python
from fastapi import HTTPException, status

# Use exceções do FastAPI
if not usuario:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Usuário com ID {id_usuario} não encontrado"
    )
```

---

## Padrões de Frontend (Next.js/React)

### Estrutura de Componentes

```typescript
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onClose?: () => void;
}

// 3. Component
export function Component({ title, onClose }: ComponentProps) {
  // 3.1. Hooks
  const [isOpen, setIsOpen] = useState(false);

  // 3.2. Handlers
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // 3.3. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Toggle</Button>
    </div>
  );
}
```

### Hooks SWR (Data Fetching)

```typescript
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";

// Fetcher genérico
const fetcher = (url: string) => apiClient.get(url);

export function useUsuarios() {
  const { data, error, isLoading, mutate } = useSWR<{
    items: Usuario[];
    meta: PaginationMeta;
  }>('/usuarios', fetcher);

  return {
    usuarios: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    mutate,  // Para revalidação manual
  };
}
```

### Client vs Server Components

```typescript
// Server Component (padrão no App Router)
// Não precisa de "use client"
export default async function Page() {
  const data = await fetchData();  // Fetch no servidor
  return <div>{data}</div>;
}

// Client Component (interatividade)
"use client";  // ← Obrigatório

export function InteractiveComponent() {
  const [state, setState] = useState(0);
  return <button onClick={() => setState(s => s + 1)}>{state}</button>;
}
```

---

## Padrões de API

### Endpoints

**Formato de URL:**
```
/{recurso}/{id?}/{acao?}
```

**Exemplos:**
```
GET    /usuarios                    # Lista
GET    /usuarios/{id}               # Busca um
POST   /usuarios                    # Cria
PUT    /usuarios/{id}               # Atualiza completo
PATCH  /usuarios/{id}               # Atualiza parcial
DELETE /usuarios/{id}               # Deleta
GET    /usuarios/{id}/agendamentos  # Sub-recurso
POST   /usuarios/{id}/ativar        # Ação específica
```

### Respostas

**Sucesso (200-299):**
```json
{
  "items": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  }
}
```

**Erro (400-599):**
```json
{
  "detail": "Usuário não encontrado",
  "status_code": 404
}
```

### Status Codes

| Código | Uso |
|--------|-----|
| 200 | Sucesso (GET, PUT, PATCH) |
| 201 | Criado (POST) |
| 204 | Sem conteúdo (DELETE) |
| 400 | Bad Request (validação) |
| 401 | Não autenticado |
| 403 | Não autorizado (sem permissão) |
| 404 | Não encontrado |
| 500 | Erro interno |

---

## Documentação

### Regras de Documentação

✅ **O QUE FAZER:**
1. **Sempre atualizar** apenas o `CHANGELOG.md` ao finalizar implementações
2. **Consultar** este `GUIA_PADROES.md` antes de implementar
3. **Manter** documentos de referência em `DOC_Arquitetura/`:
   - `DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md` (arquitetura geral)
   - `MAPEAMENTO_ROTAS_FRONTEND.md` (rotas do Next.js)
   - `MODELAGEM_DADOS_COMPLETA.md` (schema do banco)
   - `ROADMAP_EVOLUCOES_FUTURAS.md` (planejamento)
   - Este arquivo: `GUIA_PADROES.md`

❌ **O QUE NÃO FAZER:**
1. **Não criar** novos arquivos `.md` para cada implementação
2. **Não duplicar** informações entre documentos
3. **Não deixar** documentação desatualizada

### Template de Commit

```
<tipo>: <descrição curta>

<descrição longa opcional>

Atualiza: CHANGELOG.md
Refs: #issue (opcional)
```

**Tipos:**
- `feat:` Nova feature
- `fix:` Correção de bug
- `refactor:` Refatoração
- `docs:` Atualização de documentação
- `chore:` Manutenção geral
- `test:` Adição/correção de testes

---

## Checklist de Implementação

Ao implementar qualquer nova feature, siga esta ordem:

### 1. Planejamento
- [ ] Consultar `GUIA_PADROES.md` (este arquivo)
- [ ] Verificar `ROADMAP_EVOLUCOES_FUTURAS.md`
- [ ] Definir escopo e objetivos

### 2. Backend
- [ ] Criar migration (se necessário) seguindo padrões de nomenclatura
- [ ] Criar/atualizar model (SQLAlchemy + Pydantic)
- [ ] Criar/atualizar service (lógica de negócio)
- [ ] Criar/atualizar route (endpoints)
- [ ] Testar endpoints via curl/Postman

### 3. Frontend
- [ ] Criar/atualizar types
- [ ] Criar hook SWR (se necessário)
- [ ] Criar/atualizar componentes
- [ ] Criar/atualizar páginas
- [ ] Testar no navegador

### 4. Finalização
- [ ] Executar `yarn build` (frontend) e `make lint` (backend)
- [ ] Atualizar **APENAS** `CHANGELOG.md`
- [ ] Commit com mensagem descritiva
- [ ] Push para repositório

---

**Mantenha este documento atualizado quando novos padrões forem estabelecidos!**
