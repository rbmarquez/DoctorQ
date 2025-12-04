-- init.sql - Script de inicializaÃ§Ã£o para PostgreSQL
-- Cria os bancos de dados inovaia e langfuse

-- Conectar como usuÃ¡rio postgres (superusuÃ¡rio)
-- Este script deve ser executado com privilÃ©gios administrativos

-- Criar banco de dados inovaia
CREATE DATABASE inovaia
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;


-- Criar banco de dados langfuse
CREATE DATABASE langfuse
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON DATABASE inovaia IS 'Banco de dados para aplicaÃ§Ã£o InovaIA';
COMMENT ON DATABASE langfuse IS 'Banco de dados para aplicaÃ§Ã£o Langfuse (LLM observability)';

-- Opcional: Criar usuÃ¡rios especÃ­ficos para cada banco de dados
-- Descomente as linhas abaixo se quiser usuÃ¡rios dedicados

-- UsuÃ¡rio para inovaia
CREATE USER inovaia_user WITH PASSWORD 'inovaia_user';
GRANT ALL PRIVILEGES ON DATABASE inovaia TO inovaia_user;

-- UsuÃ¡rio para langfuse
CREATE USER langfuse_user WITH PASSWORD 'langfuse_user';
GRANT ALL PRIVILEGES ON DATABASE langfuse TO langfuse_user;

-- Conectar ao banco inovaia para configuraÃ§Ãµes adicionais
\c inovaia;

-- Criar extensÃµes Ãºteis para inovaia
-- Criar extensÃµes Ãºteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Conectar ao banco langfuse para configuraÃ§Ãµes adicionais
\c langfuse;

-- Criar extensÃµes Ãºteis para langfuse
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Voltar ao banco postgres
\c postgres;

-- Exibir bancos criados
SELECT 
    datname as "Database Name",
    pg_encoding_to_char(encoding) as "Encoding",
    datcollate as "Collate",
    datctype as "Ctype"
FROM pg_database 
WHERE datname IN ('inovaia', 'langfuse');

-- Adicionar suporte para vetores (pgvector)
-- Conectar ao banco inovaia para adicionar extensÃ£o pgvector
\c inovaia;
CREATE EXTENSION IF NOT EXISTS vector;

-- Conectar ao banco langfuse para adicionar extensÃ£o pgvector
\c langfuse;
CREATE EXTENSION IF NOT EXISTS vector;

-- Voltar ao banco postgres
\c postgres;

-- Verificar extensÃµes instaladas
SELECT 
    d.datname as "Database",
    e.extname as "Extension"
FROM pg_database d
JOIN pg_extension e ON true
WHERE d.datname IN ('inovaia', 'langfuse')
AND e.extname = 'vector';
