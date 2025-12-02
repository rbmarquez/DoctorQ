-- SQL para criar a tabela tb_variaveis
DROP TABLE IF EXISTS public.tb_variaveis;

CREATE TABLE public.tb_variaveis (
    id_variavel uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_variavel varchar UNIQUE NOT NULL,
    vl_variavel text NOT NULL,
    st_criptogrado CHAR(1) NOT NULL  DEFAULT 'N'  CHECK (st_criptogrado IN ('S','N')),
    dt_criacao timestamp NOT NULL DEFAULT now(),
    dt_atualizacao timestamp NOT NULL DEFAULT now()
);

-- Criar Ã­ndices para performance
CREATE INDEX idx_tb_variaveis_nm_variavel ON public.tb_variaveis(nm_variavel)


-- SQL para criar a tabela tb_credentiais

DROP TABLE IF EXISTS public.tb_credenciais;

CREATE TABLE public.tb_credenciais (
    id_credencial uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome varchar NOT NULL,
    nome_credencial varchar NOT NULL,
    dados_criptografado text NOT NULL,
    dt_criacao timestamp NOT NULL DEFAULT now(),
    dt_atualizacao timestamp NOT NULL DEFAULT now()
);

-- database/migrations/add_unique_constraint_tb_variaveis.sql

-- Adicionar constraint UNIQUE na coluna nm_variavel
ALTER TABLE public.tb_variaveis 
ADD CONSTRAINT uk_tb_variaveis_nm_variavel UNIQUE (nm_variavel);

-- Verificar se a constraint foi criada
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.table_name = 'tb_variaveis' 
    AND tc.constraint_type = 'UNIQUE';


    -- Query para criar a tabela tb_sessao no PostgreSQL

CREATE TABLE tb_sessao (
    id_sessao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_sessao VARCHAR(255) NOT NULL,
    id_contato UUID NOT NULL,
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON TABLE tb_sessao IS 'Tabela para armazenar sessÃµes de contato';
COMMENT ON COLUMN tb_sessao.id_sessao IS 'Identificador Ãºnico da sessÃ£o';
COMMENT ON COLUMN tb_sessao.nm_sessao IS 'Nome da sessÃ£o';
COMMENT ON COLUMN tb_sessao.id_contato IS 'Identificador do contato associado';
COMMENT ON COLUMN tb_sessao.dt_criacao IS 'Data e hora de criaÃ§Ã£o da sessÃ£o';

-- Query para criar a tabela tb_contatos no PostgreSQL

CREATE TABLE tb_contatos (
    id_contato UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_contato VARCHAR(255) NOT NULL,
    nm_email VARCHAR(255) NOT NULL UNIQUE,
    nr_telefone VARCHAR(20),
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON TABLE tb_contatos IS 'Tabela para armazenar contatos do sistema';
COMMENT ON COLUMN tb_contatos.id_contato IS 'Identificador Ãºnico do contato';
COMMENT ON COLUMN tb_contatos.nm_contato IS 'Nome do contato';
COMMENT ON COLUMN tb_contatos.nm_email IS 'Email do contato (Ãºnico)';
COMMENT ON COLUMN tb_contatos.nr_telefone IS 'NÃºmero de telefone do contato';
COMMENT ON COLUMN tb_contatos.dt_criacao IS 'Data e hora de criaÃ§Ã£o do contato';

-- Query para criar a tabela tb_chat_message no PostgreSQL

CREATE TABLE tb_chat_message (
    id_chat_message UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_agent UUID NOT NULL,
    id_sessao UUID NOT NULL,
    tools TEXT,
    nm_text TEXT NOT NULL,
    nm_tipo VARCHAR(20) NOT NULL CHECK (nm_tipo IN ('userMessage', 'apiMessage')),
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON TABLE tb_chat_message IS 'Tabela para armazenar mensagens do chat';
COMMENT ON COLUMN tb_chat_message.id_chat_message IS 'Identificador Ãºnico da mensagem';
COMMENT ON COLUMN tb_chat_message.id_agent IS 'Identificador do agente';
COMMENT ON COLUMN tb_chat_message.id_sessao IS 'Identificador da sessÃ£o';
COMMENT ON COLUMN tb_chat_message.tools IS 'Ferramentas utilizadas na mensagem';
COMMENT ON COLUMN tb_chat_message.nm_text IS 'Texto da mensagem';
COMMENT ON COLUMN tb_chat_message.nm_tipo IS 'Tipo da mensagem: userMessage ou apiMessage';
COMMENT ON COLUMN tb_chat_message.dt_criacao IS 'Data e hora de criaÃ§Ã£o da mensagem';


-- CriaÃ§Ã£o da tabela de agentes

CREATE TABLE IF NOT EXISTS tb_agentes (
    id_agente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_agente VARCHAR NOT NULL,
    ds_analitica TEXT,
    ds_prompt TEXT NOT NULL,
    ds_config TEXT,
    nm_customizado VARCHAR,
    st_customizado BOOLEAN NOT NULL DEFAULT false,
    st_deploy BOOLEAN NOT NULL DEFAULT false,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ComentÃ¡rios da tabela
COMMENT ON TABLE tb_agentes IS 'Tabela para armazenar informaÃ§Ãµes dos agentes';
COMMENT ON COLUMN tb_agentes.id_agente IS 'ID Ãºnico do agente';
COMMENT ON COLUMN tb_agentes.nm_agente IS 'Nome do agente';
COMMENT ON COLUMN tb_agentes.ds_analitica IS 'DescriÃ§Ã£o da analÃ­tica do agente';
COMMENT ON COLUMN tb_agentes.ds_prompt IS 'Prompt utilizado pelo agente';
COMMENT ON COLUMN tb_agentes.ds_config IS 'ConfiguraÃ§Ãµes especÃ­ficas do agente';
COMMENT ON COLUMN tb_agentes.nm_customizado IS 'Nome/tipo da customizaÃ§Ã£o aplicada';
COMMENT ON COLUMN tb_agentes.st_customizado IS 'Indica se o agente Ã© customizado';
COMMENT ON COLUMN tb_agentes.st_deploy IS 'Indica se o agente estÃ¡ em deploy/ativo';
COMMENT ON COLUMN tb_agentes.dt_criacao IS 'Data e hora de criaÃ§Ã£o do registro';
COMMENT ON COLUMN tb_agentes.dt_atualizacao IS 'Data e hora da Ãºltima atualizaÃ§Ã£o';


-- Criar tabela de usuÃ¡rios
CREATE TABLE tb_users (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_microsoft_id VARCHAR(255) NOT NULL UNIQUE,
    nm_email VARCHAR(255) NOT NULL UNIQUE,
    nm_completo VARCHAR(255) NOT NULL,
    nm_display VARCHAR(255),
    nm_primeiro VARCHAR(100),
    nm_sobrenome VARCHAR(155),
    nm_papel VARCHAR(20) NOT NULL DEFAULT 'usuario',
    st_ativo CHAR(1) NOT NULL DEFAULT 'S',
    dt_ultimo_login TIMESTAMP WITH TIME ZONE,
    nr_total_logins VARCHAR(10) NOT NULL DEFAULT '0',
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ComentÃ¡rios nas colunas
COMMENT ON TABLE tb_users IS 'Tabela de usuÃ¡rios autenticados via Microsoft';
COMMENT ON COLUMN tb_users.id_user IS 'ID Ãºnico do usuÃ¡rio (UUID)';
COMMENT ON COLUMN tb_users.nm_microsoft_id IS 'ID do usuÃ¡rio no Microsoft (Ãºnico)';
COMMENT ON COLUMN tb_users.nm_email IS 'Email do usuÃ¡rio (Ãºnico)';
COMMENT ON COLUMN tb_users.nm_completo IS 'Nome completo do usuÃ¡rio';
COMMENT ON COLUMN tb_users.nm_display IS 'Nome para exibiÃ§Ã£o (chat/interface)';
COMMENT ON COLUMN tb_users.nm_primeiro IS 'Primeiro nome';
COMMENT ON COLUMN tb_users.nm_sobrenome IS 'Sobrenome';
COMMENT ON COLUMN tb_users.nm_papel IS 'Papel do usuÃ¡rio: admin, usuario, analista';
COMMENT ON COLUMN tb_users.st_ativo IS 'Status ativo: S=Sim, N=NÃ£o';
COMMENT ON COLUMN tb_users.dt_ultimo_login IS 'Data e hora do Ãºltimo login';
COMMENT ON COLUMN tb_users.nr_total_logins IS 'Contador total de logins';
COMMENT ON COLUMN tb_users.dt_criacao IS 'Data e hora de criaÃ§Ã£o do registro';
COMMENT ON COLUMN tb_users.dt_atualizacao IS 'Data e hora da Ãºltima atualizaÃ§Ã£o';


-- Constraint para validar papel
ALTER TABLE tb_users 
ADD CONSTRAINT chk_tb_users_papel 
CHECK (nm_papel IN ('admin', 'usuario', 'analista'));

-- Constraint para validar status ativo
ALTER TABLE tb_users 
ADD CONSTRAINT chk_tb_users_ativo 
CHECK (st_ativo IN ('S', 'N'));


-- Criar tabela tb_conversations
CREATE TABLE tb_conversations (
    id_conversation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL,
    nm_token VARCHAR(255) NOT NULL UNIQUE,
    dt_expira_em TIMESTAMP,
    st_ativa CHAR(1) NOT NULL DEFAULT 'S',
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_conversation_user 
        FOREIGN KEY (id_user) 
        REFERENCES tb_users(id_user) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_conversation_st_ativa 
        CHECK (st_ativa IN ('S', 'N')),
    
    CONSTRAINT chk_conversation_token_not_empty 
        CHECK (LENGTH(TRIM(nm_token)) > 0)
);


-- ComentÃ¡rios na tabela e colunas
COMMENT ON TABLE tb_conversations IS 'Tabela de conversas dos usuÃ¡rios';
COMMENT ON COLUMN tb_conversations.id_conversation IS 'Identificador Ãºnico da conversa';
COMMENT ON COLUMN tb_conversations.id_user IS 'Identificador do usuÃ¡rio proprietÃ¡rio da conversa';
COMMENT ON COLUMN tb_conversations.nm_token IS 'Token Ãºnico para identificaÃ§Ã£o da conversa';
COMMENT ON COLUMN tb_conversations.dt_expira_em IS 'Data de expiraÃ§Ã£o da conversa (opcional)';
COMMENT ON COLUMN tb_conversations.st_ativa IS 'Status da conversa: S=Ativa, N=Inativa';
COMMENT ON COLUMN tb_conversations.dt_criacao IS 'Data de criaÃ§Ã£o da conversa';

-- Criar tabela tb_mcp
CREATE TABLE public.tb_mcp (
    id uuid PRIMARY KEY NOT NULL,
    nm_mcp varchar(255) UNIQUE NOT NULL,
    ds_mcp text,
    "command" varchar(255),
    arguments jsonb,
    st_ativo boolean DEFAULT true NOT NULL,
    env_variables jsonb,
    config_mcp jsonb,
    capabilities jsonb,
    dt_criacao timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON TABLE public.tb_mcp IS 'Tabela para armazenar as configuraÃ§Ãµes dos MCPs (Modelos de Capacidade de Processamento)';
COMMENT ON COLUMN public.tb_mcp.id IS 'ID Ãºnico do MCP, coincide com id_tool e id_variavel';
COMMENT ON COLUMN public.tb_mcp.nm_mcp IS 'Nome Ãºnico do MCP';
COMMENT ON COLUMN public.tb_mcp.ds_mcp IS 'DescriÃ§Ã£o do que o MCP faz';
COMMENT ON COLUMN public.tb_mcp.env_variables IS 'VariÃ¡veis de ambiente mascaradas (JSON)';
COMMENT ON COLUMN public.tb_mcp.config_mcp IS 'ConfiguraÃ§Ãµes de execuÃ§Ã£o do MCP, como URLs e headers (JSON)';
COMMENT ON COLUMN public.tb_mcp.capabilities IS 'Lista de capacidades que o MCP oferece (JSON)';

-- 1. CRIAÃ‡ÃƒO DA TABELA PRINCIPAL
CREATE TABLE tb_tools (
    id_tool UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_tool VARCHAR(255) NOT NULL UNIQUE,
    ds_tool TEXT,
    tp_tool VARCHAR(50) NOT NULL CHECK (tp_tool IN ('api', 'function', 'external')),
    config_tool JSONB NOT NULL,
    st_ativo BOOLEAN NOT NULL DEFAULT true,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. COMENTÃRIOS NA TABELA E COLUNAS
COMMENT ON TABLE tb_tools IS 'Tabela para armazenar configuraÃ§Ãµes de tools para agentes de IA';
COMMENT ON COLUMN tb_tools.id_tool IS 'ID Ãºnico do tool';
COMMENT ON COLUMN tb_tools.nm_tool IS 'Nome Ãºnico do tool';
COMMENT ON COLUMN tb_tools.ds_tool IS 'DescriÃ§Ã£o do tool';
COMMENT ON COLUMN tb_tools.tp_tool IS 'Tipo do tool: api, function ou external';
COMMENT ON COLUMN tb_tools.config_tool IS 'ConfiguraÃ§Ãµes especÃ­ficas do tool em formato JSON';
COMMENT ON COLUMN tb_tools.st_ativo IS 'Status ativo do tool';
COMMENT ON COLUMN tb_tools.dt_criacao IS 'Data e hora de criaÃ§Ã£o do registro';
COMMENT ON COLUMN tb_tools.dt_atualizacao IS 'Data e hora da Ãºltima atualizaÃ§Ã£o';
