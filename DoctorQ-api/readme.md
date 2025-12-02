# DoctorQ API

API Backend da plataforma DoctorQ - Uma plataforma SaaS moderna para gestão de clínicas de estética, inspirada no Doctoralia.

## Sobre o Projeto

O DoctorQ é uma plataforma completa para o segmento de estética que oferece:

- **Gestão de Clínicas**: Cadastro e gerenciamento de clínicas de estética
- **Profissionais**: Cadastro de profissionais (esteticistas, dermatologistas, etc.)
- **Agendamentos**: Sistema inteligente de agendamento de consultas e procedimentos
- **Pacientes**: Gestão de prontuários e histórico de procedimentos
- **Procedimentos**: Catálogo de procedimentos estéticos com precificação
- **IA Assistente**: Agentes de IA para atendimento, recomendações e análises
- **Marketplace**: Marketplace de produtos e equipamentos para estética
- **Financeiro**: Controle de pagamentos, assinaturas e faturamento

## Tecnologias

- **Python**: 3.12+
- **FastAPI**: Framework web assíncrono
- **PostgreSQL**: Banco de dados principal (16+) com pgvector para embeddings
- **Redis**: Cache e sessões
- **LangChain**: Orquestração de LLMs e agentes de IA
- **OpenAI/Azure OpenAI/Ollama**: Modelos de linguagem
- **SQLAlchemy**: ORM assíncrono
- **UV**: Gerenciador de pacotes Python
- **Docker**: Containerização

## Instalação

### Pré-requisitos

- Python 3.12 ou superior
- PostgreSQL 16+ com extensão pgvector
- Redis 6.4+
- UV (gerenciador de pacotes Python)

### Instalação com UV

```bash
# Clone o repositório
cd /mnt/repositorios/DoctorQ/doctorq-api

# Instalar dependências
make install

# Instalar com dependências de desenvolvimento
make sync
```

## Configuração

Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp env-exemplo .env
```

Configure as variáveis no arquivo `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbdoctorq

# Redis
REDIS_URL=redis://localhost:6379

# LLM Providers
OPENAI_API_KEY=sk-...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://....openai.azure.com/

# Authentication
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

# CORS
URL_PERMITIDA=http://localhost:3000
```

## Executando

### Desenvolvimento

```bash
make dev
```

### Produção

```bash
make prod
```

### Docker

```bash
docker-compose up -d
```

## Database

### Migrations

Os arquivos de migração SQL estão na pasta `database/`:

```bash
# Aplicar migração
PGPASSWORD=postgres psql -h localhost -U postgres -d dbdoctorq -f database/migration_001_init_doctorq.sql

# Verificar tabelas
PGPASSWORD=postgres psql -h localhost -U postgres -d dbdoctorq -c "\dt tb_*"
```

### Schema Principal

- `tb_clinicas` - Clínicas cadastradas
- `tb_profissionais` - Profissionais de estética
- `tb_pacientes` - Pacientes/clientes
- `tb_agendamentos` - Agendamentos de procedimentos
- `tb_procedimentos` - Catálogo de procedimentos
- `tb_prontuarios` - Prontuários e evoluções
- `tb_users` - Usuários do sistema
- `tb_agentes` - Agentes de IA configurados
- `tb_conversas` - Conversas com agentes
- `tb_messages` - Mensagens das conversas
- `tb_api_keys` - Chaves de API
- `tb_empresas` - Empresas/contas (multi-tenant)

## API Endpoints

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `POST /users/oauth-login` - Login OAuth (Google, Microsoft)

### Clínicas
- `GET /clinicas` - Listar clínicas
- `POST /clinicas` - Criar clínica
- `GET /clinicas/{id}` - Detalhes da clínica
- `PUT /clinicas/{id}` - Atualizar clínica
- `DELETE /clinicas/{id}` - Excluir clínica

### Profissionais
- `GET /profissionais` - Listar profissionais
- `POST /profissionais` - Cadastrar profissional
- `GET /profissionais/{id}` - Detalhes do profissional
- `PUT /profissionais/{id}` - Atualizar profissional

### Agendamentos
- `GET /agendamentos` - Listar agendamentos
- `POST /agendamentos` - Criar agendamento
- `GET /agendamentos/{id}` - Detalhes do agendamento
- `PUT /agendamentos/{id}` - Atualizar agendamento
- `DELETE /agendamentos/{id}` - Cancelar agendamento

### Pacientes
- `GET /pacientes` - Listar pacientes
- `POST /pacientes` - Cadastrar paciente
- `GET /pacientes/{id}` - Detalhes do paciente
- `GET /pacientes/{id}/prontuario` - Prontuário do paciente

### Agentes de IA
- `GET /agentes` - Listar agentes
- `POST /agentes` - Criar agente
- `GET /agentes/{id}` - Detalhes do agente
- `POST /conversas/{id}/chat` - Enviar mensagem (streaming SSE)

### Health
- `GET /health` - Health check
- `GET /ready` - Readiness check

## Desenvolvimento

### Linting e Formatação

```bash
# Executar linting
make lint

# Auto-fix
make fix
```

### Testes

```bash
# Testes unitários (a implementar)
make test

# Testar conexão com banco
make check-db
```

### Estrutura do Código

```
src/
├── main.py              # Entry point da aplicação
├── routes/              # Endpoints da API
├── services/            # Lógica de negócio
├── models/              # Modelos SQLAlchemy e Pydantic
├── agents/              # Agentes de IA
├── llms/                # Integrações com LLMs
├── tools/               # Ferramentas para agentes
├── middleware/          # Middlewares (auth, quota, etc.)
├── config/              # Configurações (DB, cache, etc.)
└── utils/               # Utilitários
```

## Comandos Make

```bash
make help        # Lista todos os comandos disponíveis
make install     # Instalar dependências
make sync        # Instalar com dev extras
make dev         # Servidor de desenvolvimento
make prod        # Servidor de produção
make lint        # Executar linting
make fix         # Auto-fix formatação
make clean       # Limpar temporários
make check-db    # Testar conexão com banco
make db-init     # Inicializar banco de dados
make db-reset    # Resetar banco (cuidado!)
make db-shell    # Shell do PostgreSQL
```

## Licença

Proprietário - DoctorQ © 2025

## Suporte

Para dúvidas ou suporte, entre em contato: devs@doctorq.app
