-- Migration 008: Melhorias em conversas (idempotente e compatível)
-- - Adiciona colunas em tb_conversations
-- - Cria índices
-- - Define função e trigger para atualizar atividade de conversas ao inserir mensagens

-- Adicionar colunas se não existirem
ALTER TABLE IF EXISTS public.tb_conversations
  ADD COLUMN IF NOT EXISTS nm_titulo TEXT,
  ADD COLUMN IF NOT EXISTS ds_resumo TEXT,
  ADD COLUMN IF NOT EXISTS qt_mensagens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dt_ultima_atividade TIMESTAMP WITHOUT TIME ZONE;

-- Índices (idempotentes)
CREATE INDEX IF NOT EXISTS idx_tb_conversations_ultima_atividade
  ON public.tb_conversations (dt_ultima_atividade);

CREATE INDEX IF NOT EXISTS idx_tb_conversations_qt_mensagens
  ON public.tb_conversations (qt_mensagens);

-- Função para atualizar atividade da conversa ao inserir mensagem
CREATE OR REPLACE FUNCTION public.update_conversation_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se não houver conversa associada, não faz nada
  IF NEW.id_conversation IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.tb_conversations
     SET qt_mensagens = COALESCE(qt_mensagens, 0) + 1,
         dt_ultima_atividade = COALESCE(NEW.dt_criacao, NOW())
   WHERE id_conversation = NEW.id_conversation;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_conversation_activity() IS
  'Atualiza qt_mensagens e dt_ultima_atividade da conversa ao inserir mensagem.';

-- Criar trigger na tabela de mensagens existente (tb_chat_message ou tb_chat_messages)
DO $$
DECLARE
  chat_table REGCLASS;
  trig_exists BOOLEAN := FALSE;
BEGIN
  chat_table := COALESCE(to_regclass('public.tb_chat_message'), to_regclass('public.tb_chat_messages'));

  IF chat_table IS NULL THEN
    RAISE NOTICE 'Tabela de mensagens não encontrada (tb_chat_message/tb_chat_messages).';
    RETURN;
  END IF;

  -- Verifica se o trigger já existe na tabela detectada
  PERFORM 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
   WHERE t.tgname = 'trigger_update_conversation_activity'
     AND c.oid = chat_table;

  IF NOT FOUND THEN
    EXECUTE format(
      'CREATE TRIGGER trigger_update_conversation_activity AFTER INSERT ON %s FOR EACH ROW EXECUTE FUNCTION public.update_conversation_activity()',
      chat_table::text
    );
    RAISE NOTICE 'Trigger trigger_update_conversation_activity criado em %', chat_table::text;
  ELSE
    RAISE NOTICE 'Trigger trigger_update_conversation_activity já existe em %', chat_table::text;
  END IF;
END
$$;

-- Comentários nas novas colunas
COMMENT ON COLUMN public.tb_conversations.nm_titulo IS 'Título curto da conversa';
COMMENT ON COLUMN public.tb_conversations.ds_resumo IS 'Resumo ou descrição da conversa';
COMMENT ON COLUMN public.tb_conversations.qt_mensagens IS 'Contagem de mensagens na conversa';
COMMENT ON COLUMN public.tb_conversations.dt_ultima_atividade IS 'Última atividade registrada na conversa';