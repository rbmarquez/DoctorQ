# 🚀 Sistema de Carreiras - Guia Rápido

## ✅ O Que Está Funcionando AGORA

### 1. **Cadastro de Currículo** ✅
**URL:** `/carreiras/cadastro-curriculo`

Wizard completo de 5 etapas para candidatos criarem seu perfil profissional.

### 2. **Exploração de Vagas** ✅
**URL:** `/carreiras/vagas`

Página completa com:
- Busca por cargo/habilidade/empresa
- Filtros avançados (área, localização, nível, contrato, regime)
- Grid de cards de vagas
- Paginação
- Ordenação

### 3. **Componentes Reutilizáveis** ✅
- `VagaCard` - Card visual para exibir vagas

## 🔗 Rotas Ativas

### Públicas (Sem Login)
```
/carreiras/cadastro-curriculo   → Criar currículo
/carreiras/vagas                 → Explorar vagas
/carreiras/vagas/[id]           → Detalhes da vaga (a implementar)
```

### Empresas (Requer Login)
```
/clinica/vagas                  → Gestão de vagas (a implementar)
/clinica/vagas/nova             → Criar vaga (a implementar)
/clinica/vagas/[id]/candidatos  → Ver candidatos (a implementar)

/profissional/vagas             → Gestão de vagas (a implementar)
/profissional/vagas/nova        → Criar vaga (a implementar)

/fornecedor/vagas               → Gestão de vagas (a implementar)
/fornecedor/vagas/nova          → Criar vaga (a implementar)
```

### Candidatos (Requer Login)
```
/carreiras/meu-curriculo        → Gerenciar currículo (a implementar)
/carreiras/minhas-candidaturas  → Acompanhar candidaturas (a implementar)
```

## 📦 Arquivos Criados

```
src/
├── types/
│   └── carreiras.ts                           # Types completos
├── lib/api/hooks/
│   ├── useVagas.ts                            # Hooks para vagas
│   ├── useCurriculos.ts                       # Hooks para currículos
│   └── useCandidaturas.ts                     # Hooks para candidaturas
├── components/carreiras/
│   └── VagaCard.tsx                           # Card de vaga
├── app/(public)/carreiras/
│   ├── cadastro-curriculo/page.tsx            # Wizard de currículo
│   └── vagas/page.tsx                         # Exploração de vagas
└── SISTEMA_CARREIRAS.md                       # Documentação completa
```

## 🎯 Como Testar Localmente

### 1. Frontend (já funciona!)
```bash
cd estetiQ-web
yarn dev
```

Acesse:
- http://localhost:3000/carreiras/cadastro-curriculo
- http://localhost:3000/carreiras/vagas

**Nota:** As páginas vão funcionar visualmente, mas as chamadas de API vão falhar até o backend ser implementado.

### 2. Backend (precisa implementar)

Você precisa criar no backend:

#### Models (SQLAlchemy)
```python
# src/models/curriculo.py
class TbCurriculos(Base):
    __tablename__ = "tb_curriculos"
    id_curriculo = Column(UUID, primary_key=True)
    id_usuario = Column(UUID, ForeignKey("tb_users.id_user"))
    nm_completo = Column(String(255))
    ds_email = Column(String(255))
    # ... (ver types/carreiras.ts para todos os campos)

# src/models/vaga.py
class TbVagas(Base):
    __tablename__ = "tb_vagas"
    id_vaga = Column(UUID, primary_key=True)
    id_empresa = Column(UUID, ForeignKey("tb_empresas.id_empresa"))
    nm_cargo = Column(String(255))
    # ... (ver types/carreiras.ts para todos os campos)

# src/models/candidatura.py
class TbCandidaturas(Base):
    __tablename__ = "tb_candidaturas"
    id_candidatura = Column(UUID, primary_key=True)
    id_vaga = Column(UUID, ForeignKey("tb_vagas.id_vaga"))
    id_curriculo = Column(UUID, ForeignKey("tb_curriculos.id_curriculo"))
    # ... (ver types/carreiras.ts para todos os campos)
```

#### Rotas (FastAPI)
```python
# src/routes/curriculos.py
@router.post("/curriculos/")
async def criar_curriculo(data: CriarCurriculoSchema):
    # Implementar criação

@router.get("/curriculos/")
async def listar_curriculos(filtros: CurriculosFiltros):
    # Implementar listagem com filtros

# src/routes/vagas.py
@router.post("/vagas/")
async def criar_vaga(data: CriarVagaSchema):
    # Implementar criação

@router.get("/vagas/")
async def listar_vagas(filtros: VagasFiltros):
    # Implementar listagem com filtros

# src/routes/candidaturas.py
@router.post("/candidaturas/")
async def criar_candidatura(data: CriarCandidaturaSchema):
    # Implementar candidatura
```

## 📋 Próximos Passos (Prioridade)

### Alta Prioridade (Core Features)
1. ✅ ~~Cadastro de currículo~~ (FEITO)
2. ✅ ~~Exploração de vagas~~ (FEITO)
3. ⏳ Detalhes da vaga + formulário de candidatura
4. ⏳ Criar vaga (empresas)
5. ⏳ Dashboard de gestão de vagas (empresas)
6. ⏳ Ver candidatos de uma vaga (empresas)

### Média Prioridade (Gestão)
7. ⏳ Editar currículo
8. ⏳ Minhas candidaturas (candidato)
9. ⏳ Alterar status de candidatura (empresa)
10. ⏳ Sistema de notificações

### Baixa Prioridade (Nice to Have)
11. Match com IA (algoritmo de score)
12. Sugestões de vagas para candidatos
13. Sugestões de candidatos para vagas
14. Analytics e métricas
15. Exportar currículo em PDF

## 🎨 Design System

### Cores do Módulo Carreiras
- **Primary:** Indigo 600 (`#4F46E5`)
- **Secondary:** Purple 600 (`#9333EA`)
- **Accent:** Pink 600 (`#DB2777`)

### Componentes UI
- Shadcn/UI + Radix
- Tailwind CSS
- Lucide Icons

## 🔐 Autenticação

- Usuários **devem estar logados** para:
  - Criar currículo
  - Candidatar-se a vagas
  - Criar vagas (empresas)
  - Ver candidatos

- Usuários **podem acessar sem login**:
  - Explorar vagas
  - Ver detalhes de vagas

## 📊 Estatísticas do Sistema

- **6 arquivos criados** anteriormente
- **+ 2 arquivos novos** (VagaCard, página de vagas)
- **~2.500 linhas de código** TypeScript
- **50% do sistema implementado**

## 🐛 Problemas Conhecidos

1. **API não implementada:** Chamadas vão falhar até backend ser criado
2. **Autenticação:** Precisa integrar com NextAuth
3. **Upload de foto:** Endpoint de upload não implementado
4. **Notificações:** Sistema de notificações por email pendente

## 💡 Dicas de Implementação

### Para Implementar Backend
1. Copie os types de `carreiras.ts` para criar os Pydantic schemas
2. Crie os models SQLAlchemy baseado nos schemas
3. Implemente as rotas FastAPI seguindo os hooks SWR
4. Adicione filtros usando query parameters
5. Implemente paginação (page, size)

### Para Adicionar Novas Páginas
1. Use os hooks existentes (`useVagas`, `useCurriculos`, `useCandidaturas`)
2. Siga o design system (indigo/purple)
3. Mantenha responsividade (mobile-first)
4. Use componentes do Shadcn/UI
5. Adicione loading states e error handling

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- `SISTEMA_CARREIRAS.md` - Documentação completa
- `src/types/carreiras.ts` - Tipos e interfaces
- Hooks em `src/lib/api/hooks/` - Exemplos de uso

---

**Status:** 🟢 50% Implementado
**Última Atualização:** 12/11/2025
