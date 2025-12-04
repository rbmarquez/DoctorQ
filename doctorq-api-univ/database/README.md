# 🗄️ Database Migrations - Universidade da Beleza

## Estrutura

```
database/
├── migration_001_init_universidade.sql  # Schema inicial completo
└── README.md                            # Este arquivo
```

## Como Criar o Banco

### 1. Criar Database

```bash
# Conecte ao PostgreSQL
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres

# Crie o banco
CREATE DATABASE doctorq_univ;

# Habilite extensões
\c doctorq_univ
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
```

### 2. Executar Migration

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api-univ

# Execute a migration inicial
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ < database/migration_001_init_universidade.sql
```

### 3. Verificar

```bash
# Liste as tabelas criadas
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ -c "\dt tb_universidade*"

# Verifique dados seed (badges)
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq_univ -c "SELECT codigo, nome, raridade FROM tb_universidade_badges;"
```

## Tabelas Criadas

**Total: 21 tabelas**

### Core (Cursos)
- `tb_universidade_cursos` - Catálogo de cursos
- `tb_universidade_modulos` - Módulos dos cursos
- `tb_universidade_aulas` - Aulas (vídeo, PDF, quiz)

### Progresso
- `tb_universidade_inscricoes` - Inscrições em cursos
- `tb_universidade_progresso_aulas` - Progresso de cada aula

### Gamificação
- `tb_universidade_xp` - XP e níveis
- `tb_universidade_badges` - Badges disponíveis (8 seeds)
- `tb_universidade_badges_usuarios` - Badges conquistados
- `tb_universidade_tokens` - Saldo de tokens ($ESTQ)
- `tb_universidade_transacoes_tokens` - Histórico de transações
- `tb_universidade_ranking` - Rankings (diário, semanal, mensal)

### Certificações
- `tb_universidade_certificados` - Certificados emitidos

### Eventos
- `tb_universidade_eventos` - Lives, webinars, workshops
- `tb_universidade_inscricoes_eventos` - Inscrições em eventos

### Mentoria
- `tb_universidade_mentores` - Perfil de mentores
- `tb_universidade_sessoes_mentoria` - Sessões de mentoria

### Metaverso
- `tb_universidade_avatares` - Avatares 3D
- `tb_universidade_salas_metaverso` - Salas virtuais (4 seeds)

### Outros
- `tb_universidade_avaliacoes_cursos` - Avaliações de cursos
- `tb_universidade_analytics` - Eventos de tracking

## Convenções

### Nomenclatura

- **Tabelas**: `tb_universidade_*` (plural)
- **Colunas ID**: `id_*` (UUID)
- **Flags**: `fg_*` (Boolean)
- **Datas**: `dt_*` (Timestamp)
- **Valores**: `vl_*` (Numeric)
- **Nomes**: `nm_*` (String)
- **Quantidades**: `total_*` (Integer)

### Padrões

```sql
-- Primary Key (sempre UUID)
id_nome_tabela UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Foreign Key
id_referencia UUID REFERENCES tb_outra_tabela(id) ON DELETE CASCADE

-- Timestamps
dt_criacao TIMESTAMP NOT NULL DEFAULT now()
dt_atualizacao TIMESTAMP

-- Flags
fg_ativo BOOLEAN DEFAULT true
```

## Seeds Incluídos

### Badges (8 badges iniciais)

```sql
primeira_aula     - Assistiu primeira aula (comum, 10 XP)
streak_7          - 7 dias seguidos (raro, 100 XP)
streak_30         - 30 dias seguidos (épico, 500 XP)
primeiro_curso    - Completou primeiro curso (comum, 100 XP)
nota_maxima       - 100% em quiz (raro, 50 XP)
injetaveis_expert - Todos cursos de injetáveis (lendário, 1000 XP)
mentor            - 50+ mentorias (épico, 500 XP)
top_1_porcento    - Top 1% ranking (lendário, 2000 XP)
```

### Salas do Metaverso (4 salas)

```sql
Auditório Principal  - 100 pessoas
Laboratório          - 50 pessoas
Lounge do Café       - 30 pessoas
Biblioteca Central   - 20 pessoas
```

## Futuras Migrations

Para criar novas migrations, use Alembic:

```bash
# Criar nova migration
make revision

# Aplicar migrations pendentes
make migrate

# Rollback última migration
make rollback
```

---

**Banco: doctorq_univ @ 10.11.2.81:5432**
