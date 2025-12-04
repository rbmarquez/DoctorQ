# DoctorQ Database Schema Skill

## Descrição
Esta skill ajuda a verificar, documentar e validar o schema do banco de dados PostgreSQL, garantindo consistência entre migrations, modelos ORM e documentação.

## Quando Usar
- Ao criar ou modificar tabelas do banco
- Para verificar integridade referencial
- Antes de releases (validar migrations)
- Para documentar schema do banco
- Ao diagnosticar problemas de schema

## Instruções

Você é um assistente especializado no schema do banco de dados DoctorQ. Sua função é:

### 1. Conectar ao Banco de Dados

**Conexão padrão (produção)**:
```bash
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq
```

**Comandos básicos psql**:
```sql
-- Listar todas as tabelas
\dt tb_*

-- Descrever estrutura de uma tabela
\d tb_empresas

-- Listar indexes
\di

-- Listar foreign keys
\d+ tb_nome_tabela

-- Listar extensions
\dx

-- Ver tamanho das tabelas
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. Verificar Schema vs Models

**Comparar tabelas do banco com models SQLAlchemy**:

```bash
# Listar models no código
find /mnt/repositorios/DoctorQ/estetiQ-api/src/models -name "*.py" | xargs grep "class Tb"

# Listar tabelas no banco
PGPASSWORD=postgres psql -h 10.11.2.81 -U postgres -d doctorq -c "\dt tb_*"
```

**Verificar consistência**:
- [ ] Toda tabela no banco tem model correspondente
- [ ] Todo model tem tabela no banco
- [ ] Colunas do model correspondem às colunas da tabela
- [ ] Tipos de dados estão corretos
- [ ] Foreign keys estão definidas
- [ ] Indexes estão criados

### 3. Validar Migrations

**Verificar migrations aplicadas**:
```sql
-- Ver versão atual do Alembic
SELECT * FROM alembic_version;

-- Deve retornar o hash da última migration
```

**Listar arquivos de migration**:
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api

# Migrations Alembic (preferidas)
ls -la alembic/versions/

# Migrations SQL (legado)
ls -la database/migration_*.sql
```

**Verificar integridade das migrations**:
```bash
# Verificar se migrations podem ser aplicadas
uv run alembic check

# Ver histórico
uv run alembic history

# Ver migrations pendentes
uv run alembic current
```

### 4. Documentar Schema

**Template para documentação de tabela**:

```markdown
### `tb_nome_tabela`

**Descrição**: Descrição clara do propósito da tabela

**Arquivo Model**: [nome_model.py](estetiQ-api/src/models/nome_model.py)

**Colunas**:

| Coluna | Tipo | Null | Default | Descrição |
|--------|------|------|---------|-----------|
| id_nome_tabela | UUID | NOT NULL | gen_random_uuid() | PK - Identificador único |
| id_empresa | UUID | NOT NULL | - | FK para tb_empresas |
| nm_nome | VARCHAR(255) | NOT NULL | - | Nome descritivo |
| ds_descricao | TEXT | NULL | - | Descrição detalhada |
| vl_valor | DECIMAL(10,2) | NOT NULL | 0.00 | Valor monetário |
| dt_criacao | TIMESTAMP | NOT NULL | now() | Data de criação |
| dt_atualizacao | TIMESTAMP | NULL | - | Última atualização |
| fg_ativo | BOOLEAN | NOT NULL | true | Flag ativo/inativo |

**Constraints**:
- **Primary Key**: `pk_nome_tabela (id_nome_tabela)`
- **Foreign Keys**:
  - `fk_nome_tabela_empresa`: id_empresa → tb_empresas(id_empresa) ON DELETE CASCADE
  - `fk_nome_tabela_usuario`: id_usuario → tb_users(id_user) ON DELETE SET NULL
- **Unique**: `uq_nome_tabela_campo (id_empresa, nm_campo)`
- **Check**: `ck_nome_tabela_valor CHECK (vl_valor >= 0)`

**Indexes**:
- `idx_nome_tabela_empresa` ON id_empresa
- `idx_nome_tabela_ativo` ON fg_ativo WHERE fg_ativo = true
- `idx_nome_tabela_criacao` ON dt_criacao DESC

**Triggers**:
- `trg_nome_tabela_updated_at`: Atualiza dt_atualizacao automaticamente

**Relacionamentos**:
- **Belongs to**: tb_empresas (muitos-para-um)
- **Has many**: tb_outra_tabela (um-para-muitos)
- **Many to many**: tb_terceira_tabela via tb_junction_table

**Uso**:
- Módulo: [Nome do Módulo]
- Rotas: `/endpoint/`, `/endpoint/{id}/`
- Services: [nome_service.py](estetiQ-api/src/services/nome_service.py)

**Dados Exemplo**:
```sql
INSERT INTO tb_nome_tabela (id_empresa, nm_nome, vl_valor)
VALUES ('uuid-empresa', 'Exemplo', 99.90);
```

**Queries Comuns**:
```sql
-- Listar ativos por empresa
SELECT * FROM tb_nome_tabela
WHERE id_empresa = 'uuid' AND fg_ativo = true
ORDER BY dt_criacao DESC;

-- Estatísticas
SELECT id_empresa, COUNT(*), AVG(vl_valor)
FROM tb_nome_tabela
GROUP BY id_empresa;
```
```

### 5. Convenções de Nomenclatura DoctorQ

**Tabelas**:
- Prefixo: `tb_`
- Nome: plural em português (tb_empresas, tb_usuarios, tb_agendamentos)
- Snake_case

**Colunas**:
- Prefixos padronizados:
  - `id_` - Identificadores (PKs e FKs)
  - `nm_` - Nomes (VARCHAR)
  - `ds_` - Descrições (TEXT)
  - `vl_` - Valores (DECIMAL, INTEGER)
  - `dt_` - Datas (DATE, TIMESTAMP)
  - `fg_` - Flags booleanas (BOOLEAN)
  - `qt_` - Quantidades (INTEGER)
  - `pc_` - Percentuais (DECIMAL)
  - `tx_` - Taxas (DECIMAL)
- Snake_case
- Primary key: `id_nome_tabela` (singular)
- Foreign key: `id_tabela_referenciada` (singular)

**Constraints**:
- `pk_nome_tabela` - Primary key
- `fk_nome_tabela_referencia` - Foreign key
- `uq_nome_tabela_campo` - Unique
- `ck_nome_tabela_condicao` - Check

**Indexes**:
- `idx_nome_tabela_campo` - Index simples
- `idx_nome_tabela_campo1_campo2` - Index composto

### 6. Padrão de Auditoria

**Colunas padrão em todas as tabelas**:
```sql
id_nome_tabela UUID PRIMARY KEY DEFAULT gen_random_uuid(),
dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
dt_atualizacao TIMESTAMP,
id_usuario_criacao UUID REFERENCES tb_users(id_user),
id_usuario_atualizacao UUID REFERENCES tb_users(id_user),
fg_ativo BOOLEAN NOT NULL DEFAULT true
```

**Trigger de atualização automática**:
```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nome_tabela_updated_at
    BEFORE UPDATE ON tb_nome_tabela
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
```

### 7. Multi-Tenancy

**Padrão de isolamento por empresa**:
```sql
-- Todas as tabelas de dados devem ter:
id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,

-- Index para performance:
CREATE INDEX idx_nome_tabela_empresa ON tb_nome_tabela(id_empresa);

-- Queries sempre filtram por empresa:
SELECT * FROM tb_nome_tabela
WHERE id_empresa = 'uuid-empresa';
```

**Tabelas que NÃO precisam de id_empresa**:
- tb_empresas (é a raiz do tenant)
- tb_users (usuário pode pertencer a múltiplas empresas)
- tb_perfis (roles são globais)
- Tabelas de sistema (logs, configs globais)

### 8. Validações de Integridade

**Checklist de validação**:

```sql
-- 1. Verificar foreign keys órfãs
SELECT t.id_empresa
FROM tb_nome_tabela t
LEFT JOIN tb_empresas e ON t.id_empresa = e.id_empresa
WHERE e.id_empresa IS NULL;

-- 2. Verificar valores NULL indevidos
SELECT COUNT(*)
FROM tb_nome_tabela
WHERE campo_obrigatorio IS NULL;

-- 3. Verificar duplicatas
SELECT id_empresa, campo, COUNT(*)
FROM tb_nome_tabela
GROUP BY id_empresa, campo
HAVING COUNT(*) > 1;

-- 4. Verificar violações de check constraints
SELECT * FROM tb_nome_tabela WHERE vl_valor < 0;

-- 5. Verificar tipos de dados inconsistentes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tb_nome_tabela';
```

### 9. Performance e Otimização

**Identificar tabelas sem indexes**:
```sql
SELECT
    t.tablename,
    c.column_name
FROM pg_tables t
JOIN information_schema.columns c ON t.tablename = c.table_name
LEFT JOIN pg_indexes i ON t.tablename = i.tablename
    AND c.column_name = ANY(string_to_array(i.indexdef, ' '))
WHERE t.schemaname = 'public'
    AND t.tablename LIKE 'tb_%'
    AND c.column_name LIKE 'id_%'
    AND i.indexname IS NULL;
```

**Queries lentas (pg_stat_statements)**:
```sql
SELECT
    calls,
    total_exec_time,
    mean_exec_time,
    query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 10. Comandos de Manutenção

**Backup do schema**:
```bash
pg_dump -h 10.11.2.81 -U postgres -d doctorq --schema-only > doctorq_schema_$(date +%Y%m%d).sql
```

**Backup de dados**:
```bash
pg_dump -h 10.11.2.81 -U postgres -d doctorq > doctorq_full_$(date +%Y%m%d).sql
```

**Restore**:
```bash
psql -h 10.11.2.81 -U postgres -d doctorq < doctorq_backup.sql
```

**Vacuum e analyze**:
```sql
VACUUM ANALYZE tb_nome_tabela;
```

### 11. Gerar Diagrama ER

**Usando pg_dump para extrair DDL**:
```bash
pg_dump -h 10.11.2.81 -U postgres -d doctorq --schema-only | grep -E "CREATE TABLE|ALTER TABLE|CONSTRAINT"
```

**Documentar relacionamentos**:
- Identificar todas as foreign keys
- Mapear relacionamentos muitos-para-muitos
- Criar diagrama ASCII ou usar ferramenta (dbdiagram.io, DBeaver)

## Exemplo de Uso

**Usuário**: Valida o schema do banco de dados e documenta as tabelas principais

**Ações Esperadas**:
1. Conectar ao banco: `psql -h 10.11.2.81 ...`
2. Listar todas as tabelas: `\dt tb_*`
3. Para cada tabela principal:
   - Descrever estrutura: `\d+ tb_nome`
   - Verificar foreign keys
   - Listar indexes
4. Comparar com models em `src/models/`
5. Verificar migrations aplicadas
6. Gerar relatório com:
   - Total de tabelas
   - Tabelas sem model correspondente
   - Models sem tabela
   - Sugestões de otimização
7. Atualizar documentação se necessário

**Resposta Exemplo**:
```
# Auditoria de Schema - DoctorQ Database

Conectado a: doctorq @ 10.11.2.81

## 📊 Estatísticas

- **Tabelas**: 82
- **Views**: 3
- **Indexes**: 156
- **Foreign Keys**: 94
- **Triggers**: 12

## ✅ Tabelas Validadas

Todas as 51 models têm tabelas correspondentes no banco.

## ⚠️ Atenção

**Tabelas sem index em FK**:
1. tb_avaliacoes.id_profissional (← tb_profissionais)
2. tb_mensagens.id_remetente (← tb_users)

**Sugestão**:
```sql
CREATE INDEX idx_avaliacoes_profissional ON tb_avaliacoes(id_profissional);
CREATE INDEX idx_mensagens_remetente ON tb_mensagens(id_remetente);
```

**Schema está 98% consistente com models!**

Quer que eu crie os indexes faltantes?
```

## Referências
- Models: `/mnt/repositorios/DoctorQ/estetiQ-api/src/models/`
- Migrations: `/mnt/repositorios/DoctorQ/estetiQ-api/database/`
- Alembic: `/mnt/repositorios/DoctorQ/estetiQ-api/alembic/`
- Documentação DB: Ver Seção 2.4 de DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md
