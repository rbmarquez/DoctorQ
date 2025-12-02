# Scripts de MigraÃ§Ã£o - Ambiente de Desenvolvimento

Este diretÃ³rio contÃ©m os scripts de migraÃ§Ã£o para o ambiente de desenvolvimento do inovaia API.

## Estrutura dos Arquivos

- `001_update_tb_agentes.sql` - Script para atualizar tabela tb_agentes existente
- `001_update_tb_agentes_rollback.sql` - Script de rollback para reverter as alteraÃ§Ãµes
- `README.md` - Esta documentaÃ§Ã£o

## Como Executar

### Aplicar a MigraÃ§Ã£o

```bash
# Conectar ao banco de dados PostgreSQL
psql -h localhost -U seu_usuario -d inovaia_dev -f 001_update_tb_agentes.sql
```

### Reverter a MigraÃ§Ã£o (Rollback)

```bash
# Conectar ao banco de dados PostgreSQL
psql -h localhost -U seu_usuario -d inovaia_dev -f 001_update_tb_agentes_rollback.sql
```

## Estrutura da Tabela tb_agentes

A tabela `tb_agentes` foi atualizada para armazenar configuraÃ§Ãµes de agentes de IA com os seguintes campos:

| Campo | Tipo | DescriÃ§Ã£o |
|-------|------|-----------|
| `id_agente` | UUID | ID Ãºnico do agente (chave primÃ¡ria) |
| `nm_agente` | VARCHAR(255) | Nome do agente |
| `ds_analitica` | TEXT | DescriÃ§Ã£o analÃ­tica do agente |
| `ds_prompt` | TEXT | Prompt/instruÃ§Ãµes do agente |
| `ds_config` | TEXT | ConfiguraÃ§Ãµes do agente em formato JSON |
| `nm_customizado` | VARCHAR(255) | Nome customizado do agente |
| `st_customizado` | BOOLEAN | Status se o agente Ã© customizado |
| `st_deploy` | BOOLEAN | Status se o agente estÃ¡ em deploy |
| `dt_criacao` | TIMESTAMP WITH TIME ZONE | Data e hora de criaÃ§Ã£o |
| `dt_atualizacao` | TIMESTAMP WITH TIME ZONE | Data e hora da Ãºltima atualizaÃ§Ã£o |

## Funcionalidades IncluÃ­das

1. **Ãndices de Performance**: Criados Ã­ndices nas colunas mais consultadas
2. **Trigger de AtualizaÃ§Ã£o**: Atualiza automaticamente `dt_atualizacao` quando o registro Ã© modificado
3. **Dados de Exemplo**: IncluÃ­dos dois agentes padrÃ£o para teste
4. **ComentÃ¡rios**: DocumentaÃ§Ã£o completa da tabela e colunas

## Dados de Exemplo

O script inclui dois agentes de exemplo (apenas se a tabela estiver vazia):

1. **Agente PadrÃ£o**: ConfiguraÃ§Ã£o bÃ¡sica com GPT-3.5-turbo
2. **Agente Especialista**: ConfiguraÃ§Ã£o avanÃ§ada com GPT-4 e recursos de memÃ³ria/observabilidade

## AlteraÃ§Ãµes Realizadas

1. **AtualizaÃ§Ã£o de tipos**: Timestamps convertidos para `TIMESTAMP WITH TIME ZONE`
2. **Ãndices de performance**: Criados Ã­ndices nas colunas mais consultadas
3. **Trigger de atualizaÃ§Ã£o**: Atualiza automaticamente `dt_atualizacao`
4. **ComentÃ¡rios**: DocumentaÃ§Ã£o completa da tabela e colunas
5. **Compatibilidade**: MantÃ©m todas as colunas existentes da tabela original

## Compatibilidade

- PostgreSQL 12+
- CompatÃ­vel com o modelo SQLAlchemy em `src/models/agent.py`
- Suporta UUIDs nativos do PostgreSQL
