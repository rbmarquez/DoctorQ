# 🎓 Universidade da Beleza - Guia de Acesso

## 📍 Como Acessar

### 1️⃣ Iniciar o Backend da Universidade

```bash
# Navegar para o diretório
cd /mnt/repositorios/EstetiQ/estetiQ-api-univ

# Iniciar o servidor (porta 8081)
make dev
# OU
uv run uvicorn src.main:app --host 0.0.0.0 --port 8081 --reload
```

**API estará disponível em:** http://localhost:8081
**Documentação Swagger:** http://localhost:8081/docs

### 2️⃣ Iniciar o Frontend

```bash
# Em outro terminal, navegar para o frontend
cd /mnt/repositorios/EstetiQ/estetiQ-web

# Instalar dependências (se necessário)
yarn install

# Iniciar servidor de desenvolvimento (porta 3000)
yarn dev
```

**Frontend estará disponível em:** http://localhost:3000

---

## 🌐 URLs de Acesso

### Páginas Públicas (Não requer login)

| URL | Descrição |
|-----|-----------|
| http://localhost:3000/universidade | Landing page da Universidade |
| http://localhost:3000/universidade/cursos | Catálogo de cursos |
| http://localhost:3000/universidade/cursos/[slug] | Detalhes de um curso específico |

**Exemplo de acesso:**
```
http://localhost:3000/universidade
http://localhost:3000/universidade/cursos
http://localhost:3000/universidade/cursos/toxina-botulinica-fundamentos
```

### Páginas Autenticadas (Requer login)

| URL | Descrição |
|-----|-----------|
| http://localhost:3000/profissional/universidade | Dashboard do aluno |
| http://localhost:3000/profissional/universidade/curso/[id] | Player do curso |

**Exemplo de acesso:**
```
http://localhost:3000/profissional/universidade
http://localhost:3000/profissional/universidade/curso/fe98bef6-fece-4d96-ac0d-589d2d268bba
```

---

## 🔗 O Que Está Implementado e Conectado

### ✅ Backend (API - Porta 8081)

**Microserviço:** `estetiQ-api-univ`
**Banco de Dados:** PostgreSQL `estetiq_univ` em 10.11.2.81:5432

#### Endpoints Disponíveis (23 no total)

**Cursos:**
- `GET /cursos/` - Listar cursos com filtros
- `GET /cursos/{id}` - Buscar curso por ID
- `GET /cursos/slug/{slug}` - Buscar curso por slug
- `POST /cursos/` - Criar curso (admin)
- `PUT /cursos/{id}` - Atualizar curso (admin)
- `DELETE /cursos/{id}` - Deletar curso (admin)

**Módulos:**
- `GET /modulos/curso/{id_curso}` - Listar módulos de um curso
- `POST /modulos/` - Criar módulo (admin)

**Aulas:**
- `GET /aulas/modulo/{id_modulo}` - Listar aulas de um módulo
- `POST /aulas/` - Criar aula (admin)

**Inscrições:**
- `GET /inscricoes/usuario/{id_usuario}` - Minhas inscrições
- `GET /inscricoes/curso/{id_curso}` - Inscrição específica
- `POST /inscricoes/` - Inscrever em curso
- `PUT /inscricoes/{id}/cancelar/` - Cancelar inscrição

**Gamificação:**
- `GET /gamificacao/progresso/{id_usuario}` - Progresso e XP
- `GET /gamificacao/badges/{id_usuario}` - Badges conquistados
- `GET /gamificacao/tokens/{id_usuario}` - Saldo de tokens
- `POST /gamificacao/marcar-aula/` - Marcar aula como assistida
- `GET /gamificacao/ranking/` - Ranking de usuários

**Eventos:**
- `GET /eventos/` - Listar eventos (webinars, workshops)
- `POST /eventos/` - Criar evento (admin)
- `POST /eventos/{id}/inscricao/` - Inscrever em evento

**Certificados:**
- `GET /certificados/usuario/{id_usuario}` - Meus certificados
- `GET /certificados/verificar/{codigo}` - Verificar autenticidade
- `POST /certificados/emitir/` - Emitir certificado

**Busca Semântica (IA):**
- `POST /busca/semantica/` - Busca RAG com pgvector
- `POST /busca/pergunta/` - Responder com IA

### ✅ Frontend (Next.js - Porta 3000)

#### Componentes Criados

**Hooks SWR** (`src/lib/api/hooks/useUniversidade.ts`):
- ✅ `useCursos()` - Lista de cursos
- ✅ `useCursoById()` - Curso por ID
- ✅ `useCursoBySlug()` - Curso por slug
- ✅ `useModulosByCurso()` - Módulos do curso
- ✅ `useMinhasInscricoes()` - Minhas inscrições
- ✅ `useInscricaoByCurso()` - Inscrição específica
- ✅ `useInscreverCurso()` - Inscrever em curso
- ✅ `useMeuProgresso()` - XP e nível
- ✅ `useMeusBadges()` - Badges conquistados
- ✅ `useMeusTokens()` - Tokens $ESTQ
- ✅ `useMarcarAulaComoAssistida()` - Marcar aula

**Componentes UI** (`src/components/universidade/`):
- ✅ `CursoCard.tsx` - Card de curso
- ✅ `CursosList.tsx` - Lista com filtros

**Páginas** (`src/app/`):
- ✅ `/universidade/page.tsx` - Landing page
- ✅ `/universidade/cursos/page.tsx` - Catálogo
- ✅ `/universidade/cursos/[slug]/page.tsx` - Detalhes
- ✅ `/profissional/universidade/page.tsx` - Dashboard aluno
- ✅ `/profissional/universidade/curso/[id]/page.tsx` - Player

---

## 🎮 Funcionalidades Implementadas

### Landing Page (/universidade)
- ✅ Hero section com stats
- ✅ 6 feature cards (IA, Gamificação, Certificados, AR, Comunidade, Cursos)
- ✅ Seção de depoimentos
- ✅ Multiple CTAs
- ✅ Design responsivo

### Catálogo de Cursos (/universidade/cursos)
- ✅ Grid de cursos
- ✅ Filtros: busca, categoria, nível
- ✅ Loading states
- ✅ Empty states

### Detalhes do Curso (/universidade/cursos/[slug])
- ✅ Hero com informações completas
- ✅ Card de inscrição com preço
- ✅ Accordion com módulos e aulas
- ✅ Stats (duração, alunos, avaliação)
- ✅ Informações do instrutor
- ✅ Objetivos e requisitos
- ✅ Tags

### Dashboard do Aluno (/profissional/universidade)
- ✅ 4 cards de stats (XP, Cursos em Andamento, Concluídos, Tokens)
- ✅ Tab "Meus Cursos" com grid de inscrições
- ✅ Tab "Badges & Conquistas"
- ✅ Tab "Progresso" com XP e tokens
- ✅ Progress bars visuais
- ✅ CTA para continuar/começar curso

### Player de Curso (/profissional/universidade/curso/[id])
- ✅ Player de vídeo HTML5
- ✅ Sidebar com módulos e aulas (accordion)
- ✅ Indicadores de aulas assistidas
- ✅ Botão "Marcar como Concluída"
- ✅ Progress bar de conclusão
- ✅ Auto-avanço para próxima aula
- ✅ Layout adaptativo

---

## 🔑 Autenticação

### Para Páginas Públicas
**Não requer autenticação** - Qualquer pessoa pode acessar.

### Para Páginas Autenticadas
**Requer login** - Você precisa estar autenticado no sistema EstetiQ.

**Como fazer login:**
1. Acesse: http://localhost:3000/login
2. Use credenciais de um usuário cadastrado
3. Após login, acesse: http://localhost:3000/profissional/universidade

---

## 🧪 Testar Funcionalidades

### 1. Testar API Diretamente (Swagger)

```bash
# Abrir no navegador
http://localhost:8081/docs
```

### 2. Testar Endpoints via cURL

```bash
# Listar cursos
curl http://localhost:8081/cursos/

# Buscar curso específico
curl http://localhost:8081/cursos/fe98bef6-fece-4d96-ac0d-589d2d268bba

# Listar módulos de um curso
curl http://localhost:8081/modulos/curso/fe98bef6-fece-4d96-ac0d-589d2d268bba

# Buscar curso por slug
curl http://localhost:8081/cursos/slug/toxina-botulinica-fundamentos
```

### 3. Testar Banco de Dados

```bash
# Conectar ao banco
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d estetiq_univ

# Listar cursos
SELECT id_curso, titulo, slug FROM tb_universidade_cursos;

# Ver inscrições
SELECT * FROM tb_universidade_inscricoes;

# Ver progresso
SELECT * FROM tb_universidade_progresso_aulas;
```

---

## 📊 Dados de Exemplo (Seeds)

O banco já vem com dados de exemplo:

**5 Cursos:**
- Toxina Botulínica - Fundamentos
- Preenchedores Faciais - Técnicas Avançadas
- Peelings Químicos - Do Básico ao Avançado
- Gestão de Clínica de Estética
- Marketing para Profissionais da Estética

**8 Badges:**
- Primeiro Passo, Dedicado, Mestre, Expert, Maratonista, Perfeccionista, Social, Inovador

**4 Salas de Metaverso:**
- Sala de Anatomia Facial 3D, Laboratório de Simulação, Auditório Virtual, Sala de Networking

**12 Aulas no curso de Toxina Botulínica:**
- Introdução à Toxina Botulínica
- Anatomia Facial Aplicada
- Marcação de Pontos de Aplicação
- Técnicas de Diluição e Dosagem
- etc.

---

## 🚀 Próximos Passos

### Funcionalidades Planejadas (Não Implementadas)

- [ ] Sistema de upload de vídeos
- [ ] Geração de certificados PDF
- [ ] Sistema de avaliações de cursos
- [ ] Página de eventos/lives
- [ ] Chat com IA Mentora (Dra. Sophie)
- [ ] Simulador AR
- [ ] Marketplace de tokens
- [ ] Área de mentores

### Para Implementar

1. **Upload de Vídeos**: Integração com Mux ou Cloudflare Stream
2. **Certificados PDF**: Geração automática com QR Code
3. **Avaliações**: Sistema de reviews e ratings
4. **IA Mentora**: Chat com GPT-4 Vision para análise de casos

---

## 🔧 Troubleshooting

### Erro: "Failed to fetch"
- Verifique se o backend está rodando na porta 8081
- Confira se o `.env.local` tem `NEXT_PUBLIC_UNIV_API_URL=http://localhost:8081`

### Erro: "Not Found"
- Certifique-se de que o banco de dados `estetiq_univ` existe
- Rode as migrations: `cd estetiQ-api-univ && make migrate`

### Página em branco
- Abra o console do navegador (F12) para ver erros
- Verifique se ambos os servidores estão rodando (8080 e 8081)

### CORS Error
- O backend já tem CORS configurado para `http://localhost:3000`
- Se mudou a porta do frontend, atualize em `estetiQ-api-univ/src/main.py`

---

## 📞 Suporte

- **Backend README**: `/mnt/repositorios/EstetiQ/estetiQ-api-univ/README.md`
- **Quick Start**: `/mnt/repositorios/EstetiQ/estetiQ-api-univ/QUICK_START.md`
- **Release Notes**: `/mnt/repositorios/EstetiQ/estetiQ-api-univ/RELEASE_NOTES_v1.1.md`
- **API Docs**: http://localhost:8081/docs (quando rodando)

---

**Versão:** 1.1.0
**Última Atualização:** 13/01/2025
