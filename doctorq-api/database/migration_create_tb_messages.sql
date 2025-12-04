-- Migration para criar tabela tb_messages
-- Data: 2025-10-21
-- Descrição: Tabela de mensagens para sistema de conversas

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS tb_messages (
    id_mensagem UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign Keys
    id_conversa UUID NOT NULL,
    id_usuario UUID,
    id_agente UUID,

    -- Conteúdo
    nm_papel VARCHAR(20) NOT NULL CHECK (nm_papel IN ('user', 'assistant', 'system', 'function', 'tool')),
    ds_conteudo TEXT NOT NULL,
    ds_metadata TEXT, -- JSON com metadados extras

    -- Tracking
    nr_tokens INTEGER,
    vl_custo NUMERIC(10,6),
    nm_modelo VARCHAR(100),

    -- Timestamps
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Foreign Key Constraints
    CONSTRAINT fk_message_conversation
        FOREIGN KEY (id_conversa)
        REFERENCES tb_conversas(id_conversa)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_user
        FOREIGN KEY (id_usuario)
        REFERENCES tb_users(id_user)
        ON DELETE SET NULL,

    CONSTRAINT fk_message_agent
        FOREIGN KEY (id_agente)
        REFERENCES tb_agentes(id_agente)
        ON DELETE SET NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_conversa ON tb_messages(id_conversa);
CREATE INDEX IF NOT EXISTS idx_messages_usuario ON tb_messages(id_usuario);
CREATE INDEX IF NOT EXISTS idx_messages_criacao ON tb_messages(dt_criacao);
CREATE INDEX IF NOT EXISTS idx_messages_papel ON tb_messages(nm_papel);

-- Comentários
COMMENT ON TABLE tb_messages IS 'Mensagens das conversas entre usuários e agentes';
COMMENT ON COLUMN tb_messages.id_mensagem IS 'ID único da mensagem';
COMMENT ON COLUMN tb_messages.id_conversa IS 'ID da conversa (FK)';
COMMENT ON COLUMN tb_messages.id_usuario IS 'ID do usuário que enviou (se aplicável)';
COMMENT ON COLUMN tb_messages.id_agente IS 'ID do agente que respondeu (se aplicável)';
COMMENT ON COLUMN tb_messages.nm_papel IS 'Papel: user, assistant, system, function, tool';
COMMENT ON COLUMN tb_messages.ds_conteudo IS 'Conteúdo da mensagem';
COMMENT ON COLUMN tb_messages.ds_metadata IS 'Metadados extras em JSON (tools usadas, etc)';
COMMENT ON COLUMN tb_messages.nr_tokens IS 'Número de tokens consumidos';
COMMENT ON COLUMN tb_messages.vl_custo IS 'Custo estimado em USD';
COMMENT ON COLUMN tb_messages.nm_modelo IS 'Modelo LLM usado (gpt-3.5-turbo, gpt-4, etc)';

-- Migrar dados existentes de tb_chat_message se necessário
-- Este é um exemplo, ajuste conforme necessário
DO $$
BEGIN
    -- Verificar se tb_chat_message tem dados
    IF EXISTS (SELECT 1 FROM tb_chat_message LIMIT 1) THEN
        RAISE NOTICE 'Migrando dados de tb_chat_message para tb_messages...';

        -- Inserir dados migrados
        INSERT INTO tb_messages (
            id_mensagem,
            id_conversa,
            id_agente,
            nm_papel,
            ds_conteudo,
            dt_criacao
        )
        SELECT
            id_chat_message,
            id_conversation,
            id_agent,
            CASE
                WHEN nm_tipo = 'userMessage' THEN 'user'
                WHEN nm_tipo = 'apiMessage' THEN 'assistant'
                ELSE 'assistant'
            END,
            nm_text,
            dt_criacao
        FROM tb_chat_message
        ON CONFLICT (id_mensagem) DO NOTHING;

        RAISE NOTICE 'Migração concluída!';
    ELSE
        RAISE NOTICE 'Nenhum dado para migrar de tb_chat_message';
    END IF;
END $$;

-- Adicionar algumas mensagens de exemplo se não houver dados
INSERT INTO tb_messages (
    id_conversa,
    id_usuario,
    id_agente,
    nm_papel,
    ds_conteudo,
    nr_tokens,
    nm_modelo,
    dt_criacao
)
SELECT
    '46931047-908e-4a21-9a03-7af821e35869'::UUID,
    'd5f47122-30dc-4b79-a808-af724e1fd984'::UUID,
    NULL,
    'user',
    'Olá! Como você pode me ajudar?',
    10,
    NULL,
    NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (
    SELECT 1 FROM tb_messages
    WHERE id_conversa = '46931047-908e-4a21-9a03-7af821e35869'::UUID
)
UNION ALL
SELECT
    '46931047-908e-4a21-9a03-7af821e35869'::UUID,
    NULL,
    '9eb7cf6c-cb55-4485-adb7-1a38b2845f1b'::UUID,
    'assistant',
    'Olá! Sou o assistente InovaIA. Posso ajudá-lo com diversas tarefas como responder perguntas, criar conteúdo, analisar dados e muito mais. Como posso ser útil hoje?',
    45,
    'gpt-3.5-turbo',
    NOW() - INTERVAL '59 minutes'
WHERE NOT EXISTS (
    SELECT 1 FROM tb_messages
    WHERE id_conversa = '46931047-908e-4a21-9a03-7af821e35869'::UUID
);

-- Criar função para atualizar dt_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_messages_dt_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar dt_atualizacao
DROP TRIGGER IF EXISTS trigger_update_messages_dt_atualizacao ON tb_messages;
CREATE TRIGGER trigger_update_messages_dt_atualizacao
    BEFORE UPDATE ON tb_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_dt_atualizacao();

GRANT ALL ON TABLE tb_messages TO postgres;