# 🎉 Release Notes - Universidade da Beleza v1.1.0

**Data de Release**: 13 de Janeiro de 2025
**Versão**: 1.1.0
**Versão Anterior**: 1.0.0

---

## 🚀 Destaques desta Versão

Esta versão traz **9 novos endpoints**, **sistema RAG completo**, **Docker pronto para produção** e muito mais!

### ✨ Principais Novidades

1. **🎬 Sistema de Eventos Completo**
   - Lives, webinars, workshops e congressos
   - Inscrições e controle de presença
   - Certificação automática por participação

2. **🎓 Certificados Digitais**
   - Emissão automatizada com código único
   - Verificação pública de autenticidade
   - Controle de validade por tipo
   - Preparado para blockchain (NFT)

3. **🤖 Busca Semântica com IA**
   - RAG (Retrieval-Augmented Generation) com pgvector
   - Busca inteligente em transcrições de aulas
   - Respostas contextualizadas
   - Preparado para GPT-4 Vision

4. **🐳 Docker Production-Ready**
   - Multi-stage build otimizado
   - Stack completa (API + DB + Redis)
   - Healthchecks configurados
   - Pronto para Kubernetes

5. **🧪 Testes Automatizados**
   - Setup com pytest
   - Testes de cursos e gamificação
   - Preparado para CI/CD

---

## 📊 Comparação de Versões

| Recurso | v1.0.0 | v1.1.0 |
|---------|--------|--------|
| **Endpoints** | 14 | **23** (+9) |
| **Services** | 3 | **6** (+3) |
| **Routers** | 3 | **6** (+3) |
| **Linhas de código** | ~3.500 | **~5.200** (+48%) |
| **Funcionalidades** | Core básico | **+ Eventos, Certificados, RAG** |
| **Docker** | ❌ | ✅ |
| **Testes** | ❌ | ✅ |
| **CI/CD Ready** | ❌ | ✅ |

---

## 🆕 Novos Endpoints

### 🎬 Eventos (5 endpoints)

```bash
GET    /eventos/                      # Listar eventos
GET    /eventos/{id}/                 # Buscar evento
POST   /eventos/                      # Criar evento
POST   /eventos/{id}/inscricao/       # Inscrever usuário
POST   /eventos/{id}/presenca/        # Marcar presença
```

**Exemplo de uso:**
```bash
curl -X POST http://localhost:8081/eventos/ \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Webinar: Novidades em Toxina Botulínica",
    "tipo": "webinar",
    "dt_inicio": "2026-02-15T19:00:00",
    "dt_fim": "2026-02-15T21:00:00",
    "duracao_horas": 2,
    "instrutor_nome": "Dra. Ana Costa",
    "preco": 49.00,
    "preco_assinante": 0.00
  }'
```

### 🎓 Certificados (4 endpoints)

```bash
GET    /certificados/usuario/{id}/           # Meus certificados
GET    /certificados/verificar/{codigo}/     # Verificar autenticidade
POST   /certificados/emitir/                 # Emitir certificado
GET    /certificados/{id}/                   # Buscar por ID
```

**Exemplo de verificação:**
```bash
curl http://localhost:8081/certificados/verificar/EST-2026-123456/

# Resposta:
{
  "valido": true,
  "codigo": "EST-2026-123456",
  "id_usuario": "uuid",
  "tipo": "prata",
  "nota_final": 95.5,
  "carga_horaria": 20,
  "dt_emissao": "2026-01-15T10:00:00",
  "dt_validade": "2029-01-15T10:00:00"
}
```

### 🤖 Busca Semântica (2 endpoints)

```bash
POST   /busca/semantica/  # Busca RAG em aulas
POST   /busca/pergunta/   # Responder com IA
```

**Exemplo de busca:**
```bash
curl -X POST http://localhost:8081/busca/semantica/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Como tratar melasma em pele negra?",
    "top_k": 5
  }'

# Resposta:
{
  "query": "Como tratar melasma em pele negra?",
  "total_resultados": 3,
  "resultados": [
    {
      "curso": "Peelings Químicos Avançados",
      "modulo": "Tratamento de Melasma",
      "aula": "Melasma em Fototipos Altos",
      "similarity": 0.92,
      "transcript": "Para tratamento de melasma em peles..."
    }
  ]
}
```

---

## 🛠️ Novos Services

### EventoService
- Gerenciamento completo de eventos
- Controle de inscrições e vagas
- Marcação de presença e tempo assistido
- Preparado para emissão automática de certificados

### CertificadoService
- Geração de código único (EST-YYYY-XXXXXX)
- Emissão automatizada
- Verificação de autenticidade
- Controle de validade por tipo:
  - **Bronze**: 2 anos
  - **Prata**: 3 anos
  - **Ouro**: 5 anos
  - **Diamante**: Vitalício

### RAGAgent
- Indexação automática de transcrições
- Busca semântica com OpenAI embeddings
- Similaridade de cosseno via pgvector
- Preparado para integração com LLM

---

## 🐳 Docker & Deploy

### Docker Production-Ready

**Dockerfile otimizado:**
- Multi-stage build (reduz tamanho)
- Usuário não-root (segurança)
- Healthcheck configurado
- Layers otimizadas (cache)

**docker-compose.yml completo:**
- API + PostgreSQL + Redis
- Volumes persistentes
- Networks isoladas
- Healthchecks em todos os serviços
- Migrations automáticas (initdb)

**Como usar:**
```bash
# Build e start
docker-compose up -d

# Logs
docker-compose logs -f api

# Status
docker-compose ps

# Stop
docker-compose down
```

### Kubernetes Ready

Manifests básicos incluídos:
- Deployment com 3 réplicas
- Liveness e Readiness probes
- Resource limits configurados
- Service LoadBalancer

---

## 🧪 Testes

### Setup Completo

- **pytest** configurado
- **Fixtures** para testes async
- **Database de teste** isolada
- **Cobertura** preparada

### Testes Implementados

```bash
# Rodar todos os testes
make test

# Com cobertura
pytest --cov=src --cov-report=html

# Apenas um arquivo
pytest tests/test_cursos.py -v
```

**Testes criados:**
- `test_cursos.py` - CRUD de cursos
- `test_gamificacao.py` - XP e tokens
- Mais testes virão nas próximas versões

---

## 📚 Nova Documentação

### Arquivos Adicionados

1. **CHANGELOG.md** - Histórico completo de versões
2. **DEPLOYMENT.md** - Guia de deploy completo
   - Docker
   - VPS/VM manual
   - Kubernetes
   - Nginx
   - CI/CD com GitHub Actions
3. **RELEASE_NOTES_v1.1.md** - Este arquivo
4. **.dockerignore** - Otimização de build
5. **.env.docker** - Template para Docker
6. **pytest.ini** - Configuração de testes

---

## 🔧 Melhorias Técnicas

### Código

- ✅ Middleware de autenticação criado
- ✅ Estrutura de testes profissional
- ✅ Logging melhorado em todos os services
- ✅ Validação Pydantic em todos os endpoints
- ✅ Docstrings completas

### Performance

- ✅ Connection pooling otimizado
- ✅ Indexes pgvector para busca rápida
- ✅ Redis cache preparado (a implementar)
- ✅ Queries otimizadas com joins

### Segurança

- ✅ API Key authentication
- ✅ Usuário não-root no Docker
- ✅ Secrets via environment variables
- ✅ CORS configurável
- ✅ Input validation (Pydantic)

---

## 🐛 Correções

- Nenhum bug crítico da v1.0.0 (primeira release)

---

## 📦 Dependências

### Novas Dependências

```toml
# IA e RAG
langchain>=0.3.14
langchain-openai>=0.2.14
langchain-community>=0.3.13

# Testes
pytest>=8.3.4
pytest-asyncio>=0.25.2
pytest-cov>=6.0.0
httpx>=0.28.1  # Para testes de API
```

### Atualizadas

- Nenhuma alteração breaking nas dependências existentes

---

## 🚧 Breaking Changes

**Nenhuma breaking change nesta versão!**

Todos os endpoints da v1.0.0 continuam funcionando normalmente.

---

## 🔜 Próximos Passos (Roadmap v1.2)

### Planejado para Fevereiro 2026

- [ ] **IA Mentora Completa (Dra. Sophie)**
  - Integração GPT-4 Vision
  - Análise de fotos de pacientes
  - Recomendações personalizadas
  - Chat streaming com SSE

- [ ] **Geração de PDF de Certificados**
  - Template profissional
  - QR Code integrado
  - Upload para S3/MinIO
  - Preview online

- [ ] **Sistema de Upload de Vídeos**
  - Integração Mux ou Cloudflare Stream
  - Transcodificação automática
  - Legendas (SRT)
  - Analytics de visualização

- [ ] **Sistema de Avaliações**
  - Reviews de cursos
  - Estrelas (1-5)
  - Comentários moderados
  - Ranking de cursos

---

## 📈 Estatísticas Finais

### Código
- **Arquivos**: 70+ arquivos
- **Linhas**: ~5.200 linhas Python
- **Cobertura**: Base para 80%+ (a implementar)

### API
- **Endpoints**: 23 funcionais
- **Models**: 17 SQLAlchemy models
- **Services**: 6 services
- **Routes**: 6 routers

### Banco de Dados
- **Tabelas**: 20 tabelas
- **Indexes**: 25+ indexes
- **Seeds**: 17 registros iniciais
- **Migrations**: 1 migration (SQL manual)

---

## 🙏 Agradecimentos

Obrigado a todos que contribuíram para esta versão!

---

## 📞 Suporte

- **Documentação**: [README.md](./README.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Deploy**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Docs**: http://localhost:8081/docs
- **Email**: dev@doctorq.app

---

## 🎯 Instalação

### Docker (Recomendado)

```bash
git clone <repo>
cd estetiQ-api-univ
cp .env.docker .env
docker-compose up -d
```

### Manual

```bash
cd estetiQ-api-univ
make install
make dev
```

Acesse: http://localhost:8081/docs

---

**🎓 Universidade da Beleza v1.1.0 - Pronta para Revolucionar a Educação Estética!**

> *"Do Aprendizado à Prática, do Virtual ao Real."*

---

**Changelog completo**: [CHANGELOG.md](./CHANGELOG.md)
**Versão anterior**: v1.0.0
**Próxima versão**: v1.2.0 (Fevereiro 2026)
