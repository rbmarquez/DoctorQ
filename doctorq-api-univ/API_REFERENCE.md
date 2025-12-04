# 📖 API Reference - Universidade da Beleza

**Base URL**: `http://localhost:8081`
**Versão**: 1.1.0
**Formato**: JSON
**Autenticação**: API Key (header `X-API-Key`)

---

## 📑 Índice

- [Autenticação](#autenticação)
- [Cursos](#cursos)
- [Inscrições](#inscrições)
- [Gamificação](#gamificação)
- [Eventos](#eventos)
- [Certificados](#certificados)
- [Busca Semântica](#busca-semântica)
- [Health Checks](#health-checks)
- [Códigos de Status](#códigos-de-status)
- [Paginação](#paginação)

---

## 🔐 Autenticação

Todas as rotas (exceto health checks) requerem API Key no header:

```http
X-API-Key: univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX
```

**Exemplo:**
```bash
curl -H "X-API-Key: univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX" \
  http://localhost:8081/cursos/
```

---

## 📚 Cursos

### Listar Cursos

```http
GET /cursos/
```

**Query Parameters:**
- `categoria` (string, opcional): `injetaveis`, `corporal`, `facial`, `negocios`
- `nivel` (string, opcional): `iniciante`, `intermediario`, `avancado`, `expert`
- `ativo` (boolean, opcional): `true` (default) ou `false`
- `page` (int, opcional): Número da página (default: 1)
- `size` (int, opcional): Itens por página (default: 20)

**Exemplo:**
```bash
curl "http://localhost:8081/cursos/?categoria=injetaveis&page=1&size=10"
```

**Response 200:**
```json
[
  {
    "id_curso": "uuid",
    "titulo": "Toxina Botulínica Avançada",
    "slug": "toxina-botulinica-avancada",
    "descricao": "Curso completo...",
    "nivel": "avancado",
    "categoria": "injetaveis",
    "duracao_horas": 20,
    "preco": 997.00,
    "preco_assinante": 697.00,
    "instrutor_nome": "Dra. Ana Costa",
    "certificacao_tipo": "prata",
    "total_inscricoes": 245,
    "avaliacao_media": 4.8,
    "total_avaliacoes": 87,
    "fg_ativo": true,
    "tags": ["toxina", "injetaveis", "facial"],
    "dt_criacao": "2025-01-13T10:00:00"
  }
]
```

---

### Buscar Curso

```http
GET /cursos/{id_curso}/
```

**Path Parameters:**
- `id_curso` (UUID): ID do curso

**Query Parameters:**
- `incluir_modulos` (boolean, opcional): Incluir módulos e aulas

**Response 200:**
```json
{
  "id_curso": "uuid",
  "titulo": "Toxina Botulínica Avançada",
  ...
}
```

**Response 404:**
```json
{
  "detail": "Curso não encontrado"
}
```

---

### Criar Curso

```http
POST /cursos/
```

**Request Body:**
```json
{
  "titulo": "Nome do Curso",
  "slug": "nome-do-curso",
  "descricao": "Descrição completa",
  "nivel": "intermediario",
  "categoria": "facial",
  "duracao_horas": 15,
  "preco": 797.00,
  "preco_assinante": 597.00,
  "instrutor_nome": "Dr. João Silva",
  "certificacao_tipo": "prata",
  "tags": ["peelings", "facial"],
  "prerequisitos": []
}
```

**Response 201:**
```json
{
  "id_curso": "uuid",
  ...
}
```

---

### Atualizar Curso

```http
PUT /cursos/{id_curso}/
```

**Request Body** (campos opcionais):
```json
{
  "titulo": "Novo Título",
  "preco": 899.00,
  "fg_ativo": true
}
```

**Response 200:**
```json
{
  "id_curso": "uuid",
  ...
}
```

---

### Deletar Curso

```http
DELETE /cursos/{id_curso}/
```

**Response 204:** No content (sucesso)

**Response 404:**
```json
{
  "detail": "Curso não encontrado"
}
```

---

## 📝 Inscrições

### Criar Inscrição

```http
POST /inscricoes/
```

**Request Body:**
```json
{
  "id_usuario": "uuid",
  "id_curso": "uuid"
}
```

**Response 201:**
```json
{
  "id_inscricao": "uuid",
  "id_usuario": "uuid",
  "id_curso": "uuid",
  "dt_inscricao": "2025-01-13T10:00:00",
  "progresso_percentual": 0,
  "status": "em_andamento",
  "tempo_total_estudo_minutos": 0
}
```

---

### Listar Inscrições do Usuário

```http
GET /inscricoes/usuario/{id_usuario}/
```

**Response 200:**
```json
[
  {
    "id_inscricao": "uuid",
    "id_curso": "uuid",
    "progresso_percentual": 45,
    "status": "em_andamento",
    ...
  }
]
```

---

### Atualizar Progresso

```http
POST /inscricoes/{id_inscricao}/progresso/
```

**Request Body:**
```json
{
  "id_aula": "uuid",
  "tempo_segundos": 1800,
  "fg_assistido": true
}
```

**Response 200:**
```json
{
  "message": "Progresso atualizado",
  "progresso_percentual": 15
}
```

---

## 🎮 Gamificação

### Buscar XP do Usuário

```http
GET /gamificacao/xp/{id_usuario}/
```

**Response 200:**
```json
{
  "id_usuario": "uuid",
  "total_xp": 1250,
  "nivel": 6,
  "xp_proximo_nivel": 3500
}
```

---

### Buscar Tokens do Usuário

```http
GET /gamificacao/tokens/{id_usuario}/
```

**Response 200:**
```json
{
  "id_usuario": "uuid",
  "saldo_tokens": 750,
  "total_ganho": 1200,
  "total_gasto": 450
}
```

---

## 🎬 Eventos

### Listar Eventos

```http
GET /eventos/
```

**Query Parameters:**
- `tipo` (string, opcional): `webinar`, `workshop`, `congresso`, `imersao`
- `status` (string, opcional): `agendado`, `ao_vivo`, `finalizado`
- `page` (int)
- `size` (int)

**Response 200:**
```json
[
  {
    "id_evento": "uuid",
    "titulo": "Webinar: Toxina Botulínica 2026",
    "tipo": "webinar",
    "dt_inicio": "2026-02-15T19:00:00",
    "dt_fim": "2026-02-15T21:00:00",
    "status": "agendado",
    "preco": 49.00,
    "total_inscritos": 120
  }
]
```

---

### Criar Evento

```http
POST /eventos/
```

**Request Body:**
```json
{
  "titulo": "Webinar: Novidades 2026",
  "descricao": "Descrição do evento",
  "tipo": "webinar",
  "dt_inicio": "2026-02-15T19:00:00",
  "dt_fim": "2026-02-15T21:00:00",
  "duracao_horas": 2,
  "instrutor_nome": "Dra. Ana Costa",
  "preco": 49.00,
  "preco_assinante": 0.00,
  "max_participantes": 500
}
```

**Response 201:**
```json
{
  "id_evento": "uuid",
  ...
}
```

---

### Inscrever em Evento

```http
POST /eventos/{id_evento}/inscricao/
```

**Request Body:**
```json
{
  "id_usuario": "uuid",
  "preco_pago": 49.00
}
```

**Response 200:**
```json
{
  "message": "Inscrição realizada com sucesso",
  "id_inscricao": "uuid"
}
```

---

### Marcar Presença

```http
POST /eventos/{id_evento}/presenca/
```

**Request Body:**
```json
{
  "id_usuario": "uuid",
  "tempo_minutos": 90
}
```

**Response 200:**
```json
{
  "message": "Presença registrada",
  "tempo_assistido": 90
}
```

---

## 🎓 Certificados

### Listar Certificados do Usuário

```http
GET /certificados/usuario/{id_usuario}/
```

**Response 200:**
```json
[
  {
    "id_certificado": "uuid",
    "codigo_verificacao": "EST-2026-123456",
    "id_usuario": "uuid",
    "id_curso": "uuid",
    "tipo_certificacao": "prata",
    "dt_emissao": "2026-01-15T10:00:00",
    "nota_final": 95.5,
    "carga_horaria": 20,
    "pdf_url": null
  }
]
```

---

### Verificar Certificado

```http
GET /certificados/verificar/{codigo}/
```

**Exemplo:**
```bash
curl http://localhost:8081/certificados/verificar/EST-2026-123456/
```

**Response 200 (válido):**
```json
{
  "valido": true,
  "codigo": "EST-2026-123456",
  "id_usuario": "uuid",
  "id_curso": "uuid",
  "tipo": "prata",
  "nota_final": 95.5,
  "carga_horaria": 20,
  "dt_emissao": "2026-01-15T10:00:00",
  "dt_validade": "2029-01-15T10:00:00",
  "acreditacoes": ["DoctorQ Universidade"]
}
```

**Response 200 (inválido):**
```json
{
  "valido": false,
  "motivo": "Certificado não encontrado"
}
```

---

### Emitir Certificado

```http
POST /certificados/emitir/
```

**Request Body:**
```json
{
  "id_usuario": "uuid",
  "id_curso": "uuid",
  "nota_final": 95.5,
  "carga_horaria": 20,
  "tipo_certificacao": "prata"
}
```

**Response 201:**
```json
{
  "id_certificado": "uuid",
  "codigo_verificacao": "EST-2026-654321",
  ...
}
```

---

## 🔍 Busca Semântica

### Busca Semântica

```http
POST /busca/semantica/
```

**Request Body:**
```json
{
  "query": "Como tratar melasma em pele negra?",
  "top_k": 5
}
```

**Response 200:**
```json
{
  "query": "Como tratar melasma em pele negra?",
  "total_resultados": 3,
  "resultados": [
    {
      "id_aula": "uuid",
      "titulo": "Melasma em Fototipos Altos",
      "curso": "Peelings Químicos Avançados",
      "modulo": "Tratamento de Melasma",
      "similarity": 0.92,
      "transcript": "Para tratamento de melasma..."
    }
  ]
}
```

---

### Responder Pergunta com IA

```http
POST /busca/pergunta/
```

**Request Body:**
```json
{
  "pergunta": "Quais são as contraindicações da toxina botulínica?",
  "contexto_adicional": "Paciente com 65 anos"
}
```

**Response 200:**
```json
{
  "resposta": "As principais contraindicações são...",
  "fontes": [
    {
      "curso": "Toxina Botulínica Avançada",
      "aula": "Contraindicações e Precauções",
      ...
    }
  ],
  "confianca": 0.95
}
```

---

## ❤️ Health Checks

### Health Check Básico

```http
GET /
```

**Response 200:**
```json
{
  "app": "DoctorQ Universidade da Beleza",
  "version": "1.1.0",
  "status": "online",
  "docs": "/docs"
}
```

---

### Health Check Detalhado

```http
GET /health/
```

**Response 200:**
```json
{
  "status": "healthy",
  "database": "online",
  "redis": "online",
  "environment": "development"
}
```

---

### Readiness Probe

```http
GET /ready/
```

**Response 200:**
```json
{
  "status": "ready"
}
```

**Response 503:**
```json
{
  "status": "not ready",
  "error": "Database connection failed"
}
```

---

## 📊 Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado |
| 204 | No Content - Sucesso sem conteúdo |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - API Key inválida |
| 404 | Not Found - Recurso não encontrado |
| 422 | Unprocessable Entity - Validação falhou |
| 500 | Internal Server Error - Erro no servidor |
| 503 | Service Unavailable - Serviço indisponível |

---

## 📄 Paginação

Endpoints com listagem suportam paginação:

**Query Parameters:**
- `page` (int): Número da página (1-indexed)
- `size` (int): Itens por página (max: 100)

**Exemplo:**
```bash
curl "http://localhost:8081/cursos/?page=2&size=20"
```

**Headers de Response:**
```http
X-Total-Count: 45
X-Page: 2
X-Page-Size: 20
```

---

## 🔢 Formatos de Data

Todas as datas seguem o formato ISO 8601:

```
2026-01-15T10:30:00        # DateTime
2026-01-15                 # Date
```

---

## 🌐 CORS

CORS configurado para:
- `http://localhost:3000`
- `https://doctorq.app`

Para adicionar origens, configure `CORS_ORIGINS` no `.env`.

---

## 📚 Recursos Adicionais

- **Swagger UI**: http://localhost:8081/docs
- **ReDoc**: http://localhost:8081/redoc
- **OpenAPI Schema**: http://localhost:8081/openapi.json

---

## 💡 Exemplos Completos

### Fluxo: Criar Curso → Inscrever → Progredir → Certificar

```bash
# 1. Criar curso
CURSO_ID=$(curl -X POST http://localhost:8081/cursos/ \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Curso Teste",
    "slug": "curso-teste",
    "nivel": "iniciante",
    "categoria": "facial",
    "duracao_horas": 10,
    "preco": 500.00
  }' | jq -r '.id_curso')

# 2. Inscrever usuário
INSCRICAO_ID=$(curl -X POST http://localhost:8081/inscricoes/ \
  -H "Content-Type: application/json" \
  -d "{
    \"id_usuario\": \"$USER_ID\",
    \"id_curso\": \"$CURSO_ID\"
  }" | jq -r '.id_inscricao')

# 3. Atualizar progresso
curl -X POST http://localhost:8081/inscricoes/$INSCRICAO_ID/progresso/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_aula": "uuid",
    "tempo_segundos": 1800,
    "fg_assistido": true
  }'

# 4. Emitir certificado (após conclusão)
curl -X POST http://localhost:8081/certificados/emitir/ \
  -H "Content-Type: application/json" \
  -d "{
    \"id_usuario\": \"$USER_ID\",
    \"id_curso\": \"$CURSO_ID\",
    \"nota_final\": 95.5,
    \"carga_horaria\": 10,
    \"tipo_certificacao\": \"bronze\"
  }"
```

---

**Versão da API**: 1.1.0
**Última Atualização**: 13/01/2025
**Base URL**: http://localhost:8081
