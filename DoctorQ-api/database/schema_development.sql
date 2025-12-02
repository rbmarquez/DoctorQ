--
-- PostgreSQL database dump
--

\restrict 4CPqkGVRISP0vrqDz0gRpbzEdwxgodcwpukEbTxrdpTywfJdjONWFRbuiQb3BdR

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: enum_partner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_partner_type AS ENUM (
    'clinica',
    'profissional',
    'fornecedor',
    'universal'
);


--
-- Name: st_atendimento_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.st_atendimento_enum AS ENUM (
    'aguardando',
    'em_atendimento',
    'pausado',
    'transferido',
    'finalizado',
    'abandonado'
);


--
-- Name: st_campanha_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.st_campanha_enum AS ENUM (
    'rascunho',
    'agendada',
    'em_execucao',
    'pausada',
    'concluida',
    'cancelada'
);


--
-- Name: st_canal_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.st_canal_enum AS ENUM (
    'ativo',
    'inativo',
    'configurando',
    'erro',
    'suspenso'
);


--
-- Name: st_contato_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.st_contato_enum AS ENUM (
    'LEAD',
    'QUALIFICADO',
    'CLIENTE',
    'INATIVO',
    'BLOQUEADO'
);


--
-- Name: st_contato_omni_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.st_contato_omni_enum AS ENUM (
    'lead',
    'qualificado',
    'cliente',
    'inativo',
    'bloqueado'
);


--
-- Name: st_mensagem_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.st_mensagem_enum AS ENUM (
    'PENDENTE',
    'ENVIADA',
    'ENTREGUE',
    'LIDA',
    'FALHA',
    'DELETADA'
);


--
-- Name: st_mensagem_omni_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.st_mensagem_omni_enum AS ENUM (
    'pendente',
    'enviada',
    'entregue',
    'lida',
    'falha',
    'deletada'
);


--
-- Name: tp_campanha_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tp_campanha_enum AS ENUM (
    'prospeccao',
    'reengajamento',
    'marketing',
    'lembrete',
    'followup',
    'pesquisa'
);


--
-- Name: tp_canal_campanha_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tp_canal_campanha_enum AS ENUM (
    'WHATSAPP',
    'INSTAGRAM',
    'FACEBOOK',
    'EMAIL',
    'SMS',
    'WEBCHAT'
);


--
-- Name: tp_canal_conversa_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tp_canal_conversa_enum AS ENUM (
    'WHATSAPP',
    'INSTAGRAM',
    'FACEBOOK',
    'EMAIL',
    'SMS',
    'WEBCHAT'
);


--
-- Name: tp_canal_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tp_canal_enum AS ENUM (
    'whatsapp',
    'instagram',
    'facebook',
    'email',
    'sms',
    'webchat'
);


--
-- Name: tp_categoria_email; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tp_categoria_email AS ENUM (
    'transacional',
    'notificacao',
    'marketing',
    'operacional',
    'lembrete',
    'suporte'
);


--
-- Name: tp_mensagem_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tp_mensagem_enum AS ENUM (
    'TEXTO',
    'IMAGEM',
    'VIDEO',
    'AUDIO',
    'DOCUMENTO',
    'LOCALIZACAO',
    'CONTATO',
    'STICKER',
    'TEMPLATE',
    'INTERATIVO',
    'REACAO',
    'SISTEMA'
);


--
-- Name: tp_mensagem_omni_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tp_mensagem_omni_enum AS ENUM (
    'texto',
    'imagem',
    'video',
    'audio',
    'documento',
    'localizacao',
    'contato',
    'sticker',
    'template',
    'interativo',
    'reacao',
    'sistema'
);


--
-- Name: atualizar_chunks_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_chunks_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE tb_documentos
    SET nr_chunks_count = (
        SELECT COUNT(*)
        FROM tb_document_chunks
        WHERE id_documento = NEW.id_documento
    ),
    dt_ultimo_processamento = CURRENT_TIMESTAMP
    WHERE id_documento = NEW.id_documento;

    RETURN NEW;
END;
$$;


--
-- Name: atualizar_curtidas_foto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_curtidas_foto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tb_fotos
        SET nr_curtidas = nr_curtidas + 1
        WHERE id_foto = NEW.id_foto;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tb_fotos
        SET nr_curtidas = GREATEST(nr_curtidas - 1, 0)
        WHERE id_foto = OLD.id_foto;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: atualizar_estatisticas_campanha(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_estatisticas_campanha(p_id_campanha uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE tb_broadcast_campanhas
    SET
        nr_enviados = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio IN ('enviado', 'entregue', 'aberto', 'clicado')),
        nr_entregues = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio IN ('entregue', 'aberto', 'clicado')),
        nr_falhas = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio = 'falha'),
        nr_abertos = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio IN ('aberto', 'clicado')),
        nr_cliques = (SELECT COUNT(*) FROM tb_broadcast_destinatarios WHERE id_campanha = p_id_campanha AND st_envio = 'clicado'),
        dt_atualizacao = now()
    WHERE id_campanha = p_id_campanha;
END;
$$;


--
-- Name: FUNCTION atualizar_estatisticas_campanha(p_id_campanha uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.atualizar_estatisticas_campanha(p_id_campanha uuid) IS 'Atualiza estatísticas de envio da campanha baseado nos destinatários';


--
-- Name: atualizar_flow_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_flow_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_install_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_install_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tb_templates
        SET nr_install_count = nr_install_count + 1
        WHERE id_template = NEW.id_template;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tb_templates
        SET nr_install_count = GREATEST(0, nr_install_count - 1)
        WHERE id_template = OLD.id_template;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: atualizar_likes_avaliacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_likes_avaliacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.st_tipo = 'util' THEN
            UPDATE tb_avaliacoes
            SET nr_likes = nr_likes + 1
            WHERE id_avaliacao = NEW.id_avaliacao;
        ELSE
            UPDATE tb_avaliacoes
            SET nr_nao_util = nr_nao_util + 1
            WHERE id_avaliacao = NEW.id_avaliacao;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.st_tipo = 'util' THEN
            UPDATE tb_avaliacoes
            SET nr_likes = nr_likes - 1
            WHERE id_avaliacao = OLD.id_avaliacao;
        ELSE
            UPDATE tb_avaliacoes
            SET nr_nao_util = nr_nao_util - 1
            WHERE id_avaliacao = OLD.id_avaliacao;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_mensagens_nao_lidas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_mensagens_nao_lidas() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Atualizar contador para todos os participantes (exceto remetente)
    UPDATE tb_participantes_conversa
    SET nr_mensagens_nao_lidas = nr_mensagens_nao_lidas + 1
    WHERE id_conversa = NEW.id_conversa
      AND id_user != NEW.id_remetente
      AND st_ativo = true;

    -- Atualizar última mensagem da conversa
    UPDATE tb_conversas_usuarios
    SET dt_ultima_mensagem = NEW.dt_criacao,
        id_ultima_mensagem = NEW.id_mensagem
    WHERE id_conversa = NEW.id_conversa;

    RETURN NEW;
END;
$$;


--
-- Name: atualizar_nps_pesquisa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_nps_pesquisa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_respostas INTEGER;
    promotores INTEGER;
    detratores INTEGER;
    nps_score DECIMAL(5, 2);
BEGIN
    -- Contar respostas
    SELECT COUNT(*) INTO total_respostas
    FROM tb_respostas_pesquisas
    WHERE id_pesquisa = NEW.id_pesquisa AND nr_nota_nps IS NOT NULL;

    IF total_respostas > 0 THEN
        -- Contar promotores
        SELECT COUNT(*) INTO promotores
        FROM tb_respostas_pesquisas
        WHERE id_pesquisa = NEW.id_pesquisa AND ds_categoria_nps = 'promotor';

        -- Contar detratores
        SELECT COUNT(*) INTO detratores
        FROM tb_respostas_pesquisas
        WHERE id_pesquisa = NEW.id_pesquisa AND ds_categoria_nps = 'detrator';

        -- Calcular NPS: ((promotores - detratores) / total) * 100
        nps_score := ((promotores::DECIMAL - detratores::DECIMAL) / total_respostas::DECIMAL) * 100;

        -- Atualizar pesquisa
        UPDATE tb_pesquisas
        SET nr_nps_score = nps_score,
            nr_total_respostas = total_respostas
        WHERE id_pesquisa = NEW.id_pesquisa;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: atualizar_progress_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_progress_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_template_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_template_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_avg_rating NUMERIC(3, 2);
    v_rating_count INTEGER;
BEGIN
    -- Calcular nova média e contagem
    SELECT
        COALESCE(AVG(nr_rating), 0.00)::NUMERIC(3, 2),
        COUNT(*)
    INTO v_avg_rating, v_rating_count
    FROM tb_template_reviews
    WHERE id_template = COALESCE(NEW.id_template, OLD.id_template)
      AND bl_aprovado = TRUE;

    -- Atualizar template
    UPDATE tb_templates
    SET
        nr_rating_avg = v_avg_rating,
        nr_rating_count = v_rating_count
    WHERE id_template = COALESCE(NEW.id_template, OLD.id_template);

    RETURN NEW;
END;
$$;


--
-- Name: atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_total_fotos_album(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_total_fotos_album() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tb_albuns
        SET nr_total_fotos = nr_total_fotos + 1
        WHERE id_album = NEW.id_album;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tb_albuns
        SET nr_total_fotos = GREATEST(nr_total_fotos - 1, 0)
        WHERE id_album = OLD.id_album;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: atualizar_uso_cupom(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_uso_cupom() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Incrementa contador de usos do cupom
    UPDATE tb_cupons
    SET nr_usos_atuais = nr_usos_atuais + 1
    WHERE id_cupom = NEW.id_cupom;

    RETURN NEW;
END;
$$;


--
-- Name: atualizar_valor_pago_fatura(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_valor_pago_fatura() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Atualiza o valor pago na fatura quando uma transação é confirmada
    IF NEW.ds_status = 'confirmado' AND NEW.id_fatura IS NOT NULL THEN
        UPDATE tb_faturas
        SET vl_pago = COALESCE((
            SELECT SUM(vl_liquido)
            FROM tb_transacoes
            WHERE id_fatura = NEW.id_fatura AND ds_status = 'confirmado'
        ), 0)
        WHERE id_fatura = NEW.id_fatura;

        -- Atualiza status da fatura
        UPDATE tb_faturas f
        SET ds_status = CASE
            WHEN f.vl_saldo <= 0 THEN 'paga'
            WHEN f.vl_pago > 0 AND f.vl_saldo > 0 THEN 'parcialmente_paga'
            WHEN f.dt_vencimento < CURRENT_DATE AND f.vl_saldo > 0 THEN 'vencida'
            ELSE f.ds_status
        END
        WHERE f.id_fatura = NEW.id_fatura;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: busca_semantica(public.vector, uuid, integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.busca_semantica(p_embedding public.vector, p_id_documento_store uuid, p_top_k integer DEFAULT 5, p_min_similarity numeric DEFAULT 0.7) RETURNS TABLE(id_chunk uuid, ds_texto text, nr_similarity numeric, js_metadata jsonb, nr_ordem integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id_chunk,
        c.ds_texto,
        ROUND((1 - (c.embedding <=> p_embedding))::DECIMAL, 4) as nr_similarity,
        c.js_metadata,
        c.nr_ordem
    FROM tb_document_chunks c
    WHERE c.id_documento_store = p_id_documento_store
        AND c.embedding IS NOT NULL
        AND (1 - (c.embedding <=> p_embedding)) >= p_min_similarity
    ORDER BY c.embedding <=> p_embedding
    LIMIT p_top_k;
END;
$$;


--
-- Name: FUNCTION busca_semantica(p_embedding public.vector, p_id_documento_store uuid, p_top_k integer, p_min_similarity numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.busca_semantica(p_embedding public.vector, p_id_documento_store uuid, p_top_k integer, p_min_similarity numeric) IS 'Busca semântica por similaridade de vetores com threshold mínimo';


--
-- Name: buscar_agendamentos_prontos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_agendamentos_prontos() RETURNS TABLE(id_agendamento uuid, nm_agendamento character varying, tp_relatorio character varying, dt_proxima_execucao timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id_agendamento,
        a.nm_agendamento,
        a.tp_relatorio,
        a.dt_proxima_execucao
    FROM tb_export_agendamentos a
    WHERE a.fg_ativo = true
      AND a.dt_proxima_execucao <= now()
    ORDER BY a.dt_proxima_execucao;
END;
$$;


--
-- Name: FUNCTION buscar_agendamentos_prontos(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_agendamentos_prontos() IS 'Busca agendamentos prontos para processar';


--
-- Name: buscar_campanhas_agendadas_para_envio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_campanhas_agendadas_para_envio() RETURNS TABLE(id_campanha uuid, nm_campanha character varying, dt_agendamento timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id_campanha,
        c.nm_campanha,
        c.dt_agendamento
    FROM tb_broadcast_campanhas c
    WHERE c.st_campanha = 'agendada'
      AND c.dt_agendamento <= now()
      AND c.fg_ativo = true
    ORDER BY c.dt_agendamento;
END;
$$;


--
-- Name: FUNCTION buscar_campanhas_agendadas_para_envio(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_campanhas_agendadas_para_envio() IS 'Retorna campanhas agendadas prontas para envio (dt_agendamento <= now)';


--
-- Name: buscar_eventos_usuario(uuid, timestamp without time zone, timestamp without time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_eventos_usuario(p_user_id uuid, p_start_date timestamp without time zone DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP, p_limit integer DEFAULT 100) RETURNS TABLE(id_event uuid, nm_event_type character varying, dt_event timestamp without time zone, ds_event_data jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id_event,
        e.nm_event_type,
        e.dt_event,
        e.ds_event_data
    FROM tb_analytics_events e
    WHERE e.id_user = p_user_id
      AND e.dt_event >= p_start_date
      AND e.dt_event <= p_end_date
    ORDER BY e.dt_event DESC
    LIMIT p_limit;
END;
$$;


--
-- Name: FUNCTION buscar_eventos_usuario(p_user_id uuid, p_start_date timestamp without time zone, p_end_date timestamp without time zone, p_limit integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_eventos_usuario(p_user_id uuid, p_start_date timestamp without time zone, p_end_date timestamp without time zone, p_limit integer) IS 'Busca eventos de um usuário específico por período';


--
-- Name: buscar_proximo_step(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_proximo_step(p_user_id uuid, p_flow_id uuid) RETURNS TABLE(step_type character varying, title text, description text, order_num integer, required boolean, estimated_minutes integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_progress RECORD;
    v_flow RECORD;
    v_step JSONB;
BEGIN
    -- Buscar progresso do usuário
    SELECT * INTO v_progress
    FROM tb_user_onboarding_progress
    WHERE id_user = p_user_id AND id_flow = p_flow_id;

    -- Se não existe progresso, retornar primeiro step
    IF v_progress IS NULL THEN
        SELECT * INTO v_flow FROM tb_onboarding_flows WHERE id_flow = p_flow_id;

        IF v_flow IS NOT NULL THEN
            -- Retornar primeiro step ordenado
            FOR v_step IN
                SELECT * FROM jsonb_array_elements(v_flow.ds_steps)
                ORDER BY (value->>'order')::INTEGER ASC
                LIMIT 1
            LOOP
                RETURN QUERY
                SELECT
                    v_step->>'step_type',
                    v_step->>'title',
                    v_step->>'description',
                    (v_step->>'order')::INTEGER,
                    (v_step->>'required')::BOOLEAN,
                    (v_step->>'estimated_minutes')::INTEGER;
            END LOOP;
        END IF;

        RETURN;
    END IF;

    -- Buscar flow
    SELECT * INTO v_flow FROM tb_onboarding_flows WHERE id_flow = p_flow_id;

    -- Encontrar primeiro step não completado
    FOR v_step IN
        SELECT * FROM jsonb_array_elements(v_flow.ds_steps)
        WHERE (value->>'step_type') NOT IN (
            SELECT jsonb_array_elements_text(COALESCE(v_progress.ds_completed_steps, '[]'::jsonb))
            UNION
            SELECT jsonb_array_elements_text(COALESCE(v_progress.ds_skipped_steps, '[]'::jsonb))
        )
        ORDER BY (value->>'order')::INTEGER ASC
        LIMIT 1
    LOOP
        RETURN QUERY
        SELECT
            v_step->>'step_type',
            v_step->>'title',
            v_step->>'description',
            (v_step->>'order')::INTEGER,
            (v_step->>'required')::BOOLEAN,
            (v_step->>'estimated_minutes')::INTEGER;
    END LOOP;
END;
$$;


--
-- Name: FUNCTION buscar_proximo_step(p_user_id uuid, p_flow_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_proximo_step(p_user_id uuid, p_flow_id uuid) IS 'Retorna o próximo step de onboarding para um usuário';


--
-- Name: buscar_templates(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_templates(p_query text, p_limit integer DEFAULT 10) RETURNS TABLE(id_template uuid, nm_template character varying, ds_template text, nm_category character varying, nr_rating_avg numeric, nr_install_count integer, similarity_score real)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id_template,
        t.nm_template,
        t.ds_template,
        t.nm_category,
        t.nr_rating_avg,
        t.nr_install_count,
        ts_rank(
            to_tsvector('portuguese', COALESCE(t.nm_template, '') || ' ' || COALESCE(t.ds_template, '')),
            plainto_tsquery('portuguese', p_query)
        ) as similarity_score
    FROM tb_templates t
    WHERE t.nm_status = 'published'
      AND t.nm_visibility = 'public'
      AND to_tsvector('portuguese', COALESCE(t.nm_template, '') || ' ' || COALESCE(t.ds_template, ''))
          @@ plainto_tsquery('portuguese', p_query)
    ORDER BY similarity_score DESC, t.nr_install_count DESC
    LIMIT p_limit;
END;
$$;


--
-- Name: FUNCTION buscar_templates(p_query text, p_limit integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_templates(p_query text, p_limit integer) IS 'Busca templates por similaridade textual (full-text search)';


--
-- Name: calcular_categoria_nps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_categoria_nps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.nr_nota_nps IS NOT NULL THEN
        NEW.ds_categoria_nps := CASE
            WHEN NEW.nr_nota_nps >= 0 AND NEW.nr_nota_nps <= 6 THEN 'detrator'
            WHEN NEW.nr_nota_nps >= 7 AND NEW.nr_nota_nps <= 8 THEN 'neutro'
            WHEN NEW.nr_nota_nps >= 9 AND NEW.nr_nota_nps <= 10 THEN 'promotor'
        END;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: calcular_crescimento_metrica(character varying, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_crescimento_metrica(p_metric_type character varying, p_days integer DEFAULT 30) RETURNS TABLE(dt_inicio date, dt_fim date, valor_inicial numeric, valor_final numeric, crescimento_absoluto numeric, crescimento_percentual numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_valor_inicial NUMERIC;
    v_valor_final NUMERIC;
BEGIN
    v_data_fim := CURRENT_DATE;
    v_data_inicio := CURRENT_DATE - p_days;

    -- Buscar valor inicial
    SELECT nr_value INTO v_valor_inicial
    FROM tb_analytics_snapshots
    WHERE nm_metric_type = p_metric_type
      AND dt_snapshot >= v_data_inicio
    ORDER BY dt_snapshot ASC
    LIMIT 1;

    -- Buscar valor final
    SELECT nr_value INTO v_valor_final
    FROM tb_analytics_snapshots
    WHERE nm_metric_type = p_metric_type
      AND dt_snapshot <= v_data_fim
    ORDER BY dt_snapshot DESC
    LIMIT 1;

    -- Calcular crescimento
    RETURN QUERY
    SELECT
        v_data_inicio,
        v_data_fim,
        COALESCE(v_valor_inicial, 0::NUMERIC),
        COALESCE(v_valor_final, 0::NUMERIC),
        COALESCE(v_valor_final - v_valor_inicial, 0::NUMERIC) as crescimento_abs,
        CASE
            WHEN COALESCE(v_valor_inicial, 0) = 0 THEN 0::NUMERIC
            ELSE ((v_valor_final - v_valor_inicial) / v_valor_inicial * 100)
        END as crescimento_pct;
END;
$$;


--
-- Name: FUNCTION calcular_crescimento_metrica(p_metric_type character varying, p_days integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_crescimento_metrica(p_metric_type character varying, p_days integer) IS 'Calcula crescimento absoluto e percentual de uma métrica em um período';


--
-- Name: calcular_estoque_produto(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_estoque_produto(p_id_empresa uuid, p_id_produto uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_estoque INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN tp_movimentacao IN ('entrada', 'devolucao') THEN nr_quantidade
            ELSE -nr_quantidade
        END
    ), 0)
    INTO v_estoque
    FROM tb_movimentacoes_estoque
    WHERE id_empresa = p_id_empresa
      AND id_produto = p_id_produto;

    RETURN v_estoque;
END;
$$;


--
-- Name: FUNCTION calcular_estoque_produto(p_id_empresa uuid, p_id_produto uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_estoque_produto(p_id_empresa uuid, p_id_produto uuid) IS 'Calcula estoque atual de um produto somando todas as movimentações';


--
-- Name: calcular_estoque_reservado(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_estoque_reservado(p_id_empresa uuid, p_id_produto uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reservado INTEGER;
BEGIN
    SELECT COALESCE(SUM(nr_quantidade), 0)
    INTO v_reservado
    FROM tb_reservas_estoque
    WHERE id_empresa = p_id_empresa
      AND id_produto = p_id_produto
      AND st_reserva = 'ativa'
      AND (dt_expiracao IS NULL OR dt_expiracao > now());

    RETURN v_reservado;
END;
$$;


--
-- Name: FUNCTION calcular_estoque_reservado(p_id_empresa uuid, p_id_produto uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_estoque_reservado(p_id_empresa uuid, p_id_produto uuid) IS 'Calcula estoque reservado (ativo e não expirado) de um produto';


--
-- Name: calcular_iss_nota(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_iss_nota(p_vl_servicos numeric, p_vl_deducoes numeric, p_vl_desconto numeric, p_pc_aliquota numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_base_calculo DECIMAL;
    v_iss DECIMAL;
BEGIN
    -- Base de cálculo = Valor Serviços - Deduções - Desconto
    v_base_calculo := p_vl_servicos - COALESCE(p_vl_deducoes, 0) - COALESCE(p_vl_desconto, 0);

    -- ISS = Base × Alíquota
    v_iss := v_base_calculo * (COALESCE(p_pc_aliquota, 5.0) / 100);

    RETURN ROUND(v_iss, 2);
END;
$$;


--
-- Name: FUNCTION calcular_iss_nota(p_vl_servicos numeric, p_vl_deducoes numeric, p_vl_desconto numeric, p_pc_aliquota numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_iss_nota(p_vl_servicos numeric, p_vl_deducoes numeric, p_vl_desconto numeric, p_pc_aliquota numeric) IS 'Calcula o valor do ISS baseado na alíquota municipal';


--
-- Name: calcular_taxa_abertura(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_taxa_abertura(p_id_campanha uuid) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_entregues INTEGER;
    v_abertos INTEGER;
    v_taxa NUMERIC;
BEGIN
    SELECT nr_entregues, nr_abertos INTO v_entregues, v_abertos
    FROM tb_broadcast_campanhas
    WHERE id_campanha = p_id_campanha;

    IF v_entregues = 0 THEN
        RETURN 0;
    END IF;

    v_taxa := (v_abertos::NUMERIC / v_entregues::NUMERIC) * 100;
    RETURN ROUND(v_taxa, 2);
END;
$$;


--
-- Name: FUNCTION calcular_taxa_abertura(p_id_campanha uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_taxa_abertura(p_id_campanha uuid) IS 'Calcula taxa de abertura: (abertos / entregues) × 100';


--
-- Name: calcular_taxa_clique(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_taxa_clique(p_id_campanha uuid) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_abertos INTEGER;
    v_cliques INTEGER;
    v_taxa NUMERIC;
BEGIN
    SELECT nr_abertos, nr_cliques INTO v_abertos, v_cliques
    FROM tb_broadcast_campanhas
    WHERE id_campanha = p_id_campanha;

    IF v_abertos = 0 THEN
        RETURN 0;
    END IF;

    v_taxa := (v_cliques::NUMERIC / v_abertos::NUMERIC) * 100;
    RETURN ROUND(v_taxa, 2);
END;
$$;


--
-- Name: FUNCTION calcular_taxa_clique(p_id_campanha uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_taxa_clique(p_id_campanha uuid) IS 'Calcula taxa de clique: (cliques / abertos) × 100';


--
-- Name: calcular_taxa_conclusao_flow(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_taxa_conclusao_flow(p_flow_id uuid) RETURNS TABLE(total_usuarios integer, usuarios_completaram integer, taxa_conclusao numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total,
        COUNT(CASE WHEN nm_status = 'completed' THEN 1 END)::INTEGER as completaram,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN nm_status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100), 2)
            ELSE 0::NUMERIC
        END as taxa
    FROM tb_user_onboarding_progress
    WHERE id_flow = p_flow_id;
END;
$$;


--
-- Name: FUNCTION calcular_taxa_conclusao_flow(p_flow_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_taxa_conclusao_flow(p_flow_id uuid) IS 'Calcula taxa de conclusão de um flow';


--
-- Name: cancelar_lembretes_agendamento(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancelar_lembretes_agendamento(p_id_agendamento uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE tb_lembretes
    SET
        st_lembrete = 'cancelado',
        dt_atualizacao = now()
    WHERE
        id_agendamento = p_id_agendamento
        AND st_lembrete = 'pendente';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$;


--
-- Name: FUNCTION cancelar_lembretes_agendamento(p_id_agendamento uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cancelar_lembretes_agendamento(p_id_agendamento uuid) IS 'Cancela todos os lembretes pendentes de um agendamento';


--
-- Name: comparar_metricas_mensal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.comparar_metricas_mensal() RETURNS TABLE(nm_metric_type character varying, valor_mes_atual numeric, valor_mes_anterior numeric, diferenca numeric, crescimento_percentual numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH mes_atual AS (
        SELECT
            s.nm_metric_type,
            AVG(s.nr_value) as valor
        FROM tb_analytics_snapshots s
        WHERE s.dt_snapshot >= DATE_TRUNC('month', CURRENT_DATE)
          AND s.dt_snapshot <= CURRENT_DATE
        GROUP BY s.nm_metric_type
    ),
    mes_anterior AS (
        SELECT
            s.nm_metric_type,
            AVG(s.nr_value) as valor
        FROM tb_analytics_snapshots s
        WHERE s.dt_snapshot >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND s.dt_snapshot < DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY s.nm_metric_type
    )
    SELECT
        COALESCE(ma.nm_metric_type, mant.nm_metric_type) as metric,
        COALESCE(ma.valor, 0::NUMERIC) as val_atual,
        COALESCE(mant.valor, 0::NUMERIC) as val_anterior,
        COALESCE(ma.valor, 0::NUMERIC) - COALESCE(mant.valor, 0::NUMERIC) as diff,
        CASE
            WHEN COALESCE(mant.valor, 0) = 0 THEN 0::NUMERIC
            ELSE ((ma.valor - mant.valor) / mant.valor * 100)
        END as growth_pct
    FROM mes_atual ma
    FULL OUTER JOIN mes_anterior mant ON ma.nm_metric_type = mant.nm_metric_type
    ORDER BY metric;
END;
$$;


--
-- Name: FUNCTION comparar_metricas_mensal(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.comparar_metricas_mensal() IS 'Compara métricas do mês atual com o mês anterior';


--
-- Name: cosine_similarity(public.vector, public.vector); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cosine_similarity(a public.vector, b public.vector) RETURNS double precision
    LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
    AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$;


--
-- Name: FUNCTION cosine_similarity(a public.vector, b public.vector); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cosine_similarity(a public.vector, b public.vector) IS 'Calcula similaridade cosine entre dois vetores (retorna 0-1)';


--
-- Name: criar_lembretes_agendamento(uuid, uuid, uuid, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_lembretes_agendamento(p_id_empresa uuid, p_id_agendamento uuid, p_id_paciente uuid, p_dt_agendamento timestamp without time zone) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_dt_lembrete_24h TIMESTAMP;
    v_dt_lembrete_2h TIMESTAMP;
    v_count INTEGER := 0;
BEGIN
    -- Calcular datas dos lembretes
    v_dt_lembrete_24h := p_dt_agendamento - INTERVAL '24 hours';
    v_dt_lembrete_2h := p_dt_agendamento - INTERVAL '2 hours';

    -- Lembrete 24h antes (email + whatsapp + push)
    IF v_dt_lembrete_24h > now() THEN
        INSERT INTO tb_lembretes (
            id_empresa,
            id_agendamento,
            id_paciente,
            tp_lembrete,
            fg_email,
            fg_whatsapp,
            fg_push,
            dt_agendado,
            st_lembrete,
            nr_tentativas
        ) VALUES (
            p_id_empresa,
            p_id_agendamento,
            p_id_paciente,
            '24h',
            TRUE,  -- email
            TRUE,  -- whatsapp
            TRUE,  -- push
            v_dt_lembrete_24h,
            'pendente',
            0
        );
        v_count := v_count + 1;
    END IF;

    -- Lembrete 2h antes (sms + whatsapp)
    IF v_dt_lembrete_2h > now() THEN
        INSERT INTO tb_lembretes (
            id_empresa,
            id_agendamento,
            id_paciente,
            tp_lembrete,
            fg_sms,
            fg_whatsapp,
            dt_agendado,
            st_lembrete,
            nr_tentativas
        ) VALUES (
            p_id_empresa,
            p_id_agendamento,
            p_id_paciente,
            '2h',
            TRUE,  -- sms
            TRUE,  -- whatsapp
            v_dt_lembrete_2h,
            'pendente',
            0
        );
        v_count := v_count + 1;
    END IF;

    RETURN v_count;
END;
$$;


--
-- Name: FUNCTION criar_lembretes_agendamento(p_id_empresa uuid, p_id_agendamento uuid, p_id_paciente uuid, p_dt_agendamento timestamp without time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.criar_lembretes_agendamento(p_id_empresa uuid, p_id_agendamento uuid, p_id_paciente uuid, p_dt_agendamento timestamp without time zone) IS 'Cria lembretes automáticos (24h e 2h) para um agendamento';


--
-- Name: current_user_empresa_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_empresa_id() RETURNS uuid
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    -- Retorna o id_empresa do usuário atual (via contexto da sessão)
    -- Se não houver contexto, retorna NULL (admin da plataforma)
    RETURN NULLIF(current_setting('app.current_user_empresa_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;


--
-- Name: FUNCTION current_user_empresa_id(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_empresa_id() IS 'Retorna o ID da empresa do usuário atual para RLS (NULL = admin plataforma)';


--
-- Name: expirar_reservas_antigas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.expirar_reservas_antigas() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE tb_reservas_estoque
    SET st_reserva = 'expirada',
        dt_atualizacao = now()
    WHERE st_reserva = 'ativa'
      AND dt_expiracao IS NOT NULL
      AND dt_expiracao < now();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


--
-- Name: FUNCTION expirar_reservas_antigas(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.expirar_reservas_antigas() IS 'Expira reservas cujo dt_expiracao passou (deve ser executado periodicamente)';


--
-- Name: fn_atualizar_dt_atualizacao_conversa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_dt_atualizacao_conversa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: fn_buscar_conversas_por_conteudo(uuid, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_buscar_conversas_por_conteudo(p_usuario_id uuid, p_termo_busca text, p_limite integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id_conversa uuid, nm_titulo character varying, ds_resumo text, nr_total_mensagens integer, dt_ultima_mensagem timestamp without time zone, relevancia double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id_conversa,
        c.nm_titulo,
        c.ds_resumo,
        c.nr_total_mensagens,
        c.dt_ultima_mensagem,
        ts_rank(
            to_tsvector('portuguese', COALESCE(c.nm_titulo, '') || ' ' || COALESCE(c.ds_resumo, '')),
            plainto_tsquery('portuguese', p_termo_busca)
        ) AS relevancia
    FROM tb_conversas c
    LEFT JOIN tb_mensagens m ON m.id_conversa = c.id_conversa
    WHERE
        c.id_usuario = p_usuario_id
        AND c.st_arquivada = FALSE
        AND (
            c.nm_titulo ILIKE '%' || p_termo_busca || '%'
            OR c.ds_resumo ILIKE '%' || p_termo_busca || '%'
            OR m.ds_conteudo ILIKE '%' || p_termo_busca || '%'
        )
    ORDER BY relevancia DESC, c.dt_ultima_mensagem DESC NULLS LAST
    LIMIT p_limite
    OFFSET p_offset;
END;
$$;


--
-- Name: fn_decrementar_contador_mensagens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_decrementar_contador_mensagens() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE tb_conversas
    SET
        nr_total_mensagens = GREATEST(nr_total_mensagens - 1, 0),
        nr_mensagens_usuario = CASE
            WHEN OLD.nm_papel = 'user' THEN GREATEST(nr_mensagens_usuario - 1, 0)
            ELSE nr_mensagens_usuario
        END,
        nr_mensagens_agente = CASE
            WHEN OLD.nm_papel = 'assistant' THEN GREATEST(nr_mensagens_agente - 1, 0)
            ELSE nr_mensagens_agente
        END,
        nr_tokens_total = GREATEST(nr_tokens_total - COALESCE(OLD.nr_tokens, 0), 0),
        vl_custo_total = GREATEST(vl_custo_total - COALESCE(OLD.vl_custo, 0), 0),
        dt_atualizacao = NOW()
    WHERE id_conversa = OLD.id_conversa;

    RETURN OLD;
END;
$$;


--
-- Name: fn_gerar_token_compartilhamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_gerar_token_compartilhamento() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    token VARCHAR(100);
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gera token aleatório de 32 caracteres
        token := encode(gen_random_bytes(24), 'base64');
        token := REPLACE(token, '/', '_');
        token := REPLACE(token, '+', '-');
        token := REPLACE(token, '=', '');

        -- Verifica se já existe
        SELECT EXISTS(
            SELECT 1 FROM tb_conversas WHERE ds_token_compartilhamento = token
        ) INTO existe;

        -- Se não existe, retorna
        IF NOT existe THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$;


--
-- Name: fn_incrementar_contador_mensagens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_incrementar_contador_mensagens() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE tb_conversas
    SET
        nr_total_mensagens = nr_total_mensagens + 1,
        nr_mensagens_usuario = CASE WHEN NEW.nm_papel = 'user' THEN nr_mensagens_usuario + 1 ELSE nr_mensagens_usuario END,
        nr_mensagens_agente = CASE WHEN NEW.nm_papel = 'assistant' THEN nr_mensagens_agente + 1 ELSE nr_mensagens_agente END,
        nr_tokens_total = nr_tokens_total + COALESCE(NEW.nr_tokens, 0),
        vl_custo_total = vl_custo_total + COALESCE(NEW.vl_custo, 0),
        dt_ultima_mensagem = NEW.dt_criacao,
        dt_atualizacao = NOW()
    WHERE id_conversa = NEW.id_conversa;

    RETURN NEW;
END;
$$;


--
-- Name: gerar_numero_fatura(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_numero_fatura() RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    proximo_numero INTEGER;
    numero_fatura TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(nr_fatura FROM 5) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM tb_faturas
    WHERE nr_fatura ~ '^FAT-[0-9]+$';

    numero_fatura := 'FAT-' || LPAD(proximo_numero::TEXT, 6, '0');

    RETURN numero_fatura;
END;
$_$;


--
-- Name: gerar_numero_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_numero_pedido() RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    proximo_numero INTEGER;
    numero_pedido TEXT;
BEGIN
    -- Pega o maior número atual e incrementa
    SELECT COALESCE(MAX(CAST(SUBSTRING(nr_pedido FROM 5) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM tb_pedidos
    WHERE nr_pedido ~ '^PED-[0-9]+$';

    -- Formata com zeros à esquerda
    numero_pedido := 'PED-' || LPAD(proximo_numero::TEXT, 6, '0');

    RETURN numero_pedido;
END;
$_$;


--
-- Name: gerar_resumo_rastreamento(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_resumo_rastreamento(p_id_pedido uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_resumo JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_eventos', COUNT(*),
        'transportadora', MAX(ds_transportadora),
        'ultimo_status', (
            SELECT ds_status_mapeado
            FROM tb_rastreamento_eventos
            WHERE id_pedido = p_id_pedido
            ORDER BY dt_evento DESC
            LIMIT 1
        ),
        'ultimo_evento', (
            SELECT ds_descricao
            FROM tb_rastreamento_eventos
            WHERE id_pedido = p_id_pedido
            ORDER BY dt_evento DESC
            LIMIT 1
        ),
        'dt_ultimo_evento', (
            SELECT dt_evento
            FROM tb_rastreamento_eventos
            WHERE id_pedido = p_id_pedido
            ORDER BY dt_evento DESC
            LIMIT 1
        ),
        'primeira_atualizacao', MIN(dt_captura),
        'ultima_atualizacao', MAX(dt_captura)
    )
    INTO v_resumo
    FROM tb_rastreamento_eventos
    WHERE id_pedido = p_id_pedido;

    RETURN v_resumo;
END;
$$;


--
-- Name: FUNCTION gerar_resumo_rastreamento(p_id_pedido uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.gerar_resumo_rastreamento(p_id_pedido uuid) IS 'Gera JSON com resumo completo de rastreamento de um pedido';


--
-- Name: gerar_token_verificacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_token_verificacao() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    caracteres VARCHAR(62) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    token VARCHAR(100) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..40 LOOP
        token := token || substr(caracteres, floor(random() * 62 + 1)::INTEGER, 1);
    END LOOP;
    RETURN 'VER-' || token;
END;
$$;


--
-- Name: get_clinica_profissionais(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_clinica_profissionais(p_id_clinica uuid) RETURNS TABLE(id_profissional uuid, nm_profissional character varying, ds_especialidades text[], nr_registro_profissional character varying, st_ativo boolean, dt_vinculo timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id_profissional,
        p.nm_profissional,
        p.ds_especialidades,
        p.nr_registro_profissional,
        pc.st_ativo,
        pc.dt_vinculo
    FROM tb_profissionais_clinicas pc
    INNER JOIN tb_profissionais p ON pc.id_profissional = p.id_profissional
    WHERE pc.id_clinica = p_id_clinica
        AND pc.st_ativo = true
    ORDER BY p.nm_profissional;
END;
$$;


--
-- Name: FUNCTION get_clinica_profissionais(p_id_clinica uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_clinica_profissionais(p_id_clinica uuid) IS 'Retorna todos os profissionais ativos de uma clínica';


--
-- Name: get_configuracao(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_configuracao(chave character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    valor TEXT;
BEGIN
    SELECT ds_valor INTO valor
    FROM tb_configuracoes
    WHERE nm_chave = chave AND st_ativo = TRUE
    LIMIT 1;

    RETURN valor;
END;
$$;


--
-- Name: get_profissional_clinicas(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profissional_clinicas(p_id_profissional uuid) RETURNS TABLE(id_clinica uuid, nm_clinica character varying, id_empresa uuid, st_ativo boolean, dt_vinculo timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id_clinica,
        c.nm_clinica,
        c.id_empresa,
        pc.st_ativo,
        pc.dt_vinculo
    FROM tb_profissionais_clinicas pc
    INNER JOIN tb_clinicas c ON pc.id_clinica = c.id_clinica
    WHERE pc.id_profissional = p_id_profissional
        AND pc.st_ativo = true
    ORDER BY pc.dt_vinculo DESC;
END;
$$;


--
-- Name: FUNCTION get_profissional_clinicas(p_id_profissional uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_profissional_clinicas(p_id_profissional uuid) IS 'Retorna todas as clínicas ativas de um profissional';


--
-- Name: incrementar_instalacoes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_instalacoes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.st_ativo = TRUE THEN
        UPDATE tb_marketplace_agentes
        SET nr_instalacoes = nr_instalacoes + 1
        WHERE id_marketplace_agente = NEW.id_marketplace_agente;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.st_ativo = FALSE AND NEW.st_ativo = TRUE THEN
            UPDATE tb_marketplace_agentes
            SET nr_instalacoes = nr_instalacoes + 1
            WHERE id_marketplace_agente = NEW.id_marketplace_agente;
        ELSIF OLD.st_ativo = TRUE AND NEW.st_ativo = FALSE THEN
            UPDATE tb_marketplace_agentes
            SET nr_instalacoes = nr_instalacoes - 1
            WHERE id_marketplace_agente = NEW.id_marketplace_agente;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: incrementar_uso_template(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_uso_template() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Incrementar contador quando template é usado
    UPDATE tb_templates_mensagens
    SET nr_vezes_usado = nr_vezes_usado + 1,
        dt_ultimo_uso = NOW()
    WHERE id_template = NEW.id_template;

    RETURN NEW;
END;
$$;


--
-- Name: limpar_cache_expirado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpar_cache_expirado() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    registros_deletados INTEGER;
BEGIN
    DELETE FROM tb_cache
    WHERE dt_expiracao < NOW();

    GET DIAGNOSTICS registros_deletados = ROW_COUNT;
    RETURN registros_deletados;
END;
$$;


--
-- Name: limpar_exports_expirados(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpar_exports_expirados() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM tb_export_jobs
    WHERE dt_expiracao < now()
      AND st_export = 'concluido';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


--
-- Name: FUNCTION limpar_exports_expirados(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.limpar_exports_expirados() IS 'Remove jobs de exportação expirados';


--
-- Name: limpar_logs_antigos(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpar_logs_antigos(dias integer DEFAULT 90) RETURNS TABLE(logs_acesso integer, logs_integracao integer, logs_erro_resolvidos integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_logs_acesso INTEGER;
    v_logs_integracao INTEGER;
    v_logs_erro INTEGER;
BEGIN
    -- Limpar logs de acesso
    DELETE FROM tb_logs_acesso WHERE dt_criacao < NOW() - INTERVAL '1 day' * dias;
    GET DIAGNOSTICS v_logs_acesso = ROW_COUNT;

    -- Limpar logs de integração
    DELETE FROM tb_logs_integracao WHERE dt_criacao < NOW() - INTERVAL '1 day' * dias;
    GET DIAGNOSTICS v_logs_integracao = ROW_COUNT;

    -- Limpar logs de erro resolvidos
    DELETE FROM tb_logs_erro WHERE st_resolvido = true AND dt_criacao < NOW() - INTERVAL '1 day' * dias;
    GET DIAGNOSTICS v_logs_erro = ROW_COUNT;

    RETURN QUERY SELECT v_logs_acesso, v_logs_integracao, v_logs_erro;
END;
$$;


--
-- Name: marcar_embeddings_gerados(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.marcar_embeddings_gerados() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.embedding IS NOT NULL AND OLD.embedding IS NULL THEN
        UPDATE tb_documentos
        SET bl_embeddings_gerados = TRUE,
            dt_ultimo_processamento = CURRENT_TIMESTAMP
        WHERE id_documento = NEW.id_documento;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: marcar_mensagens_lidas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.marcar_mensagens_lidas() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Zerar contador de mensagens não lidas
    UPDATE tb_participantes_conversa
    SET nr_mensagens_nao_lidas = 0,
        dt_ultima_leitura = NEW.dt_leitura
    WHERE id_conversa = (
        SELECT id_conversa FROM tb_mensagens_usuarios WHERE id_mensagem = NEW.id_mensagem
    ) AND id_user = NEW.id_user;

    RETURN NEW;
END;
$$;


--
-- Name: notificar_mudanca_rastreamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notificar_mudanca_rastreamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- TODO: Integrar com sistema de notificações
    -- Quando novo evento importante é capturado, notificar cliente
    IF NEW.ds_status_mapeado IN ('entregue', 'saiu_para_entrega', 'problema') THEN
        -- INSERT INTO tb_notificacoes (...)
        RAISE NOTICE 'Notificação: Novo status de rastreamento - %', NEW.ds_status_mapeado;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: obter_proximo_rps(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_proximo_rps(p_id_empresa uuid) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
    v_rps VARCHAR;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM tb_notas_fiscais
    WHERE id_empresa = p_id_empresa;

    v_rps := LPAD((v_count + 1)::VARCHAR, 6, '0');
    RETURN v_rps;
END;
$$;


--
-- Name: FUNCTION obter_proximo_rps(p_id_empresa uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_proximo_rps(p_id_empresa uuid) IS 'Gera número sequencial de RPS por empresa (ex: 000001)';


--
-- Name: obter_ultimo_evento_rastreamento(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_ultimo_evento_rastreamento(p_id_pedido uuid) RETURNS TABLE(ds_status character varying, ds_descricao text, dt_evento timestamp without time zone, ds_local character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.ds_status_mapeado,
        e.ds_descricao,
        e.dt_evento,
        e.ds_local_completo
    FROM tb_rastreamento_eventos e
    WHERE e.id_pedido = p_id_pedido
    ORDER BY e.dt_evento DESC
    LIMIT 1;
END;
$$;


--
-- Name: FUNCTION obter_ultimo_evento_rastreamento(p_id_pedido uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_ultimo_evento_rastreamento(p_id_pedido uuid) IS 'Retorna o evento mais recente de um pedido';


--
-- Name: perfil_tem_acesso_grupo(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.perfil_tem_acesso_grupo(p_id_perfil uuid, p_grupo text) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_grupos_acesso TEXT[];
BEGIN
  SELECT ds_grupos_acesso INTO v_grupos_acesso
  FROM tb_perfis
  WHERE id_perfil = p_id_perfil AND st_ativo = 'S';

  RETURN p_grupo = ANY(v_grupos_acesso);
END;
$$;


--
-- Name: perfil_tem_permissao(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.perfil_tem_permissao(p_id_perfil uuid, p_grupo text, p_recurso text, p_acao text) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_permissoes JSONB;
  v_tem_permissao BOOLEAN;
BEGIN
  SELECT ds_permissoes_detalhadas INTO v_permissoes
  FROM tb_perfis
  WHERE id_perfil = p_id_perfil AND st_ativo = 'S';

  -- Check if the permission exists and is true
  v_tem_permissao := COALESCE(
    (v_permissoes -> p_grupo -> p_recurso ->> p_acao)::BOOLEAN,
    false
  );

  RETURN v_tem_permissao;
END;
$$;


--
-- Name: pode_instalar_template(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_instalar_template(p_user_id uuid, p_template_id uuid) RETURNS TABLE(pode_instalar boolean, motivo text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_template_exists BOOLEAN;
    v_template_status VARCHAR(20);
    v_template_visibility VARCHAR(20);
    v_already_installed BOOLEAN;
BEGIN
    -- Verificar se template existe
    SELECT EXISTS(SELECT 1 FROM tb_templates WHERE id_template = p_template_id)
    INTO v_template_exists;

    IF NOT v_template_exists THEN
        RETURN QUERY SELECT FALSE, 'Template não encontrado'::TEXT;
        RETURN;
    END IF;

    -- Verificar status e visibilidade
    SELECT nm_status, nm_visibility
    INTO v_template_status, v_template_visibility
    FROM tb_templates
    WHERE id_template = p_template_id;

    IF v_template_status != 'published' THEN
        RETURN QUERY SELECT FALSE, 'Template não está publicado'::TEXT;
        RETURN;
    END IF;

    -- Verificar se já instalou
    SELECT EXISTS(
        SELECT 1 FROM tb_template_installations
        WHERE id_template = p_template_id
          AND id_user = p_user_id
          AND bl_ativo = TRUE
    ) INTO v_already_installed;

    IF v_already_installed THEN
        RETURN QUERY SELECT FALSE, 'Template já está instalado'::TEXT;
        RETURN;
    END IF;

    -- Pode instalar
    RETURN QUERY SELECT TRUE, 'Pode instalar'::TEXT;
END;
$$;


--
-- Name: FUNCTION pode_instalar_template(p_user_id uuid, p_template_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.pode_instalar_template(p_user_id uuid, p_template_id uuid) IS 'Verifica se usuário pode instalar um template';


--
-- Name: recalcular_media_estrelas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalcular_media_estrelas() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE tb_marketplace_agentes
    SET
        nr_media_estrelas = (
            SELECT COALESCE(AVG(nr_estrelas), 0)
            FROM tb_avaliacoes_agentes
            WHERE id_marketplace_agente = NEW.id_marketplace_agente
        ),
        nr_avaliacoes = (
            SELECT COUNT(*)
            FROM tb_avaliacoes_agentes
            WHERE id_marketplace_agente = NEW.id_marketplace_agente
        )
    WHERE id_marketplace_agente = NEW.id_marketplace_agente;

    RETURN NEW;
END;
$$;


--
-- Name: registrar_historico_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Só registra se o status mudou
    IF NEW.ds_status IS DISTINCT FROM OLD.ds_status THEN
        INSERT INTO tb_pedido_historico (
            id_pedido,
            ds_status_anterior,
            ds_status_novo
        ) VALUES (
            NEW.id_pedido,
            OLD.ds_status,
            NEW.ds_status
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: registrar_mudanca_configuracao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_mudanca_configuracao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Só registra se o valor mudou
    IF NEW.ds_valor IS DISTINCT FROM OLD.ds_valor THEN
        INSERT INTO tb_historico_configuracoes (
            id_configuracao,
            ds_valor_anterior,
            ds_valor_novo
        ) VALUES (
            NEW.id_configuracao,
            OLD.ds_valor,
            NEW.ds_valor
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: reset_campanhas_diario(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_campanhas_diario() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE tb_campanhas
    SET nr_enviados_hoje = 0,
        dt_ultimo_reset_diario = CURRENT_DATE
    WHERE dt_ultimo_reset_diario IS NULL
       OR dt_ultimo_reset_diario < CURRENT_DATE;
END;
$$;


--
-- Name: set_configuracao(character varying, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_configuracao(chave character varying, novo_valor text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE tb_configuracoes
    SET ds_valor = novo_valor,
        dt_atualizacao = NOW()
    WHERE nm_chave = chave;

    RETURN FOUND;
END;
$$;


--
-- Name: trg_atualizar_estatisticas_campanha(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_atualizar_estatisticas_campanha() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.st_envio IS DISTINCT FROM NEW.st_envio) THEN
        PERFORM atualizar_estatisticas_campanha(NEW.id_campanha);
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: trg_incrementar_contadores_destinatario(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_incrementar_contadores_destinatario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se mudou para 'aberto' e ainda não tinha data de abertura
    IF NEW.st_envio = 'aberto' AND OLD.st_envio != 'aberto' AND NEW.dt_aberto IS NULL THEN
        NEW.dt_aberto := now();
        NEW.nr_vezes_aberto := NEW.nr_vezes_aberto + 1;
    END IF;

    -- Se mudou para 'clicado' e ainda não tinha data de clique
    IF NEW.st_envio = 'clicado' AND OLD.st_envio != 'clicado' AND NEW.dt_clicado IS NULL THEN
        NEW.dt_clicado := now();
        NEW.nr_vezes_clicado := NEW.nr_vezes_clicado + 1;
        -- Se clicou, também conta como aberto
        IF NEW.dt_aberto IS NULL THEN
            NEW.dt_aberto := now();
            NEW.nr_vezes_aberto := NEW.nr_vezes_aberto + 1;
        END IF;
    END IF;

    NEW.dt_atualizacao := now();

    RETURN NEW;
END;
$$;


--
-- Name: trigger_registrar_evento_login(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_registrar_evento_login() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Registrar evento de login quando dt_ultimo_login é atualizado
    IF NEW.dt_ultimo_login IS DISTINCT FROM OLD.dt_ultimo_login THEN
        INSERT INTO tb_analytics_events (
            id_user,
            nm_event_type,
            ds_event_data,
            ds_metadata
        ) VALUES (
            NEW.id_user,
            'user_login',
            jsonb_build_object(
                'email', NEW.nm_email,
                'nome', NEW.nm_completo
            ),
            jsonb_build_object(
                'total_logins', NEW.nr_total_logins,
                'ultimo_login', NEW.dt_ultimo_login
            )
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION trigger_registrar_evento_login(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.trigger_registrar_evento_login() IS 'Registra evento de login automaticamente quando usuário faz login';


--
-- Name: update_anamnese_templates_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_anamnese_templates_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_anamneses_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_anamneses_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_central_atendimento_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_central_atendimento_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_config_central_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_config_central_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_dt_atualizacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_dt_atualizacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_dt_atualizacao_configuracoes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_dt_atualizacao_configuracoes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_lembretes_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lembretes_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_marketplace_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_marketplace_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_messages_dt_atualizacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_messages_dt_atualizacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_notas_fiscais_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notas_fiscais_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_partner_lead_questions_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_partner_lead_questions_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_plans_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_plans_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_prompt_biblioteca_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_prompt_biblioteca_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_reservas_estoque_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_reservas_estoque_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_subscriptions_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_subscriptions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_tb_messages_dt_atualizacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_tb_messages_dt_atualizacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_webhooks_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_webhooks_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$;


--
-- Name: validar_cnpj_cpf(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_cnpj_cpf(p_documento character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    v_documento VARCHAR;
    v_length INTEGER;
BEGIN
    -- Remove caracteres não numéricos
    v_documento := regexp_replace(p_documento, '[^0-9]', '', 'g');
    v_length := char_length(v_documento);

    -- Valida tamanho (11 para CPF, 14 para CNPJ)
    IF v_length NOT IN (11, 14) THEN
        RETURN FALSE;
    END IF;

    -- Valida se não são todos dígitos iguais
    IF v_documento ~ '^(\d)\1+$' THEN
        RETURN FALSE;
    END IF;

    -- TODO: Implementar validação completa de dígitos verificadores
    -- Por ora, apenas validação básica

    RETURN TRUE;
END;
$_$;


--
-- Name: FUNCTION validar_cnpj_cpf(p_documento character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_cnpj_cpf(p_documento character varying) IS 'Valida formato de CPF (11 dígitos) ou CNPJ (14 dígitos)';


--
-- Name: verificar_instalacao_review(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_instalacao_review() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar se usuário instalou o template
    IF EXISTS (
        SELECT 1 FROM tb_template_installations
        WHERE id_template = NEW.id_template
          AND id_user = NEW.id_user
    ) THEN
        NEW.bl_verified_install = TRUE;
    ELSE
        NEW.bl_verified_install = FALSE;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: verificar_pedido_atrasado(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_pedido_atrasado(p_id_pedido uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_dt_estimada DATE;
    v_status VARCHAR;
BEGIN
    SELECT dt_entrega_estimada, ds_status
    INTO v_dt_estimada, v_status
    FROM tb_pedidos
    WHERE id_pedido = p_id_pedido;

    IF v_dt_estimada IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_status = 'entregue' THEN
        RETURN FALSE;
    END IF;

    RETURN v_dt_estimada < CURRENT_DATE;
END;
$$;


--
-- Name: FUNCTION verificar_pedido_atrasado(p_id_pedido uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_pedido_atrasado(p_id_pedido uuid) IS 'Verifica se um pedido está atrasado (data estimada passou e não foi entregue)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tb_agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_agendamentos (
    id_agendamento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_paciente uuid,
    id_profissional uuid,
    id_clinica uuid,
    id_procedimento uuid,
    dt_agendamento timestamp without time zone NOT NULL,
    nr_duracao_minutos integer NOT NULL,
    ds_status character varying(50) DEFAULT 'agendado'::character varying,
    ds_motivo character varying(255),
    ds_observacoes text,
    st_confirmado boolean DEFAULT false,
    dt_confirmacao timestamp without time zone,
    nm_confirmado_por character varying(255),
    st_lembrete_enviado boolean DEFAULT false,
    dt_lembrete_enviado timestamp without time zone,
    ds_motivo_cancelamento text,
    dt_cancelamento timestamp without time zone,
    nm_cancelado_por character varying(255),
    vl_valor numeric(10,2),
    ds_forma_pagamento character varying(50),
    st_pago boolean DEFAULT false,
    dt_pagamento timestamp without time zone,
    st_avaliado boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public.tb_agendamentos FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_agendamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_agendamentos IS 'Agendamentos de consultas e procedimentos';


--
-- Name: tb_agent_document_stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_agent_document_stores (
    id_agent_document_store uuid NOT NULL,
    id_agente uuid NOT NULL,
    id_documento_store uuid NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    nm_search_type character varying(50) DEFAULT 'embedding'::character varying
);


--
-- Name: COLUMN tb_agent_document_stores.nm_search_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_agent_document_stores.nm_search_type IS 'Tipo de busca: ''embedding'' para busca semântica ou ''text'' para busca textual';


--
-- Name: tb_agente_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_agente_tools (
    id_agente_tool uuid NOT NULL,
    id_agente uuid NOT NULL,
    id_tool uuid NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_agentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_agentes (
    id_agente uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    nm_agente character varying(255) NOT NULL,
    ds_agente text,
    ds_tipo character varying(50) DEFAULT 'assistant'::character varying,
    nm_modelo character varying(100) DEFAULT 'gpt-4'::character varying,
    nm_provider character varying(50) DEFAULT 'openai'::character varying,
    nr_temperature numeric(3,2) DEFAULT 0.7,
    nr_max_tokens integer DEFAULT 2000,
    ds_system_prompt text,
    ds_prompt_template text,
    ds_config jsonb DEFAULT '{}'::jsonb,
    ds_tools text[],
    st_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    st_principal boolean DEFAULT false
);


--
-- Name: COLUMN tb_agentes.id_empresa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_agentes.id_empresa IS 'Empresa proprietária do agente (NULL = agente global)';


--
-- Name: tb_albuns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_albuns (
    id_album uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    nm_album character varying(255) NOT NULL,
    ds_descricao text,
    ds_tipo character varying(50) DEFAULT 'pessoal'::character varying,
    ds_visibilidade character varying(20) DEFAULT 'privado'::character varying,
    id_profissional uuid,
    id_paciente uuid,
    id_procedimento uuid,
    ds_capa_url text,
    nr_total_fotos integer DEFAULT 0,
    nr_visualizacoes integer DEFAULT 0,
    st_ativo boolean DEFAULT true,
    st_destaque boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_albuns; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_albuns IS 'Álbuns de fotos (pessoais, antes/depois, portfolio)';


--
-- Name: tb_analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_analytics_events (
    id_event uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    nm_event_type character varying(100) NOT NULL,
    ds_event_data jsonb,
    ds_metadata jsonb,
    dt_event timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_event_type CHECK (((nm_event_type)::text <> ''::text))
);


--
-- Name: TABLE tb_analytics_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_analytics_events IS 'Rastreamento de eventos de analytics e auditoria';


--
-- Name: COLUMN tb_analytics_events.nm_event_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_analytics_events.nm_event_type IS 'Tipo de evento (login, signup, api_call, etc.)';


--
-- Name: COLUMN tb_analytics_events.ds_event_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_analytics_events.ds_event_data IS 'Dados específicos do evento em formato JSON';


--
-- Name: COLUMN tb_analytics_events.ds_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_analytics_events.ds_metadata IS 'Metadados adicionais (IP, user agent, source, etc.)';


--
-- Name: tb_analytics_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_analytics_snapshots (
    id_snapshot uuid DEFAULT gen_random_uuid() NOT NULL,
    dt_snapshot date NOT NULL,
    nm_metric_type character varying(100) NOT NULL,
    nr_value numeric(20,4) DEFAULT 0.0000 NOT NULL,
    ds_metadata jsonb,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_metric_type CHECK (((nm_metric_type)::text <> ''::text))
);


--
-- Name: TABLE tb_analytics_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_analytics_snapshots IS 'Snapshots diários de métricas de negócio para análise histórica';


--
-- Name: COLUMN tb_analytics_snapshots.dt_snapshot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_analytics_snapshots.dt_snapshot IS 'Data do snapshot (geralmente fim do dia)';


--
-- Name: COLUMN tb_analytics_snapshots.nm_metric_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_analytics_snapshots.nm_metric_type IS 'Tipo de métrica capturada';


--
-- Name: COLUMN tb_analytics_snapshots.nr_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_analytics_snapshots.nr_value IS 'Valor da métrica no momento do snapshot';


--
-- Name: tb_anamnese_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_anamnese_templates (
    id_template uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    nm_template character varying(255) NOT NULL,
    ds_template text,
    tp_template character varying(50) NOT NULL,
    ds_perguntas jsonb NOT NULL,
    ds_regras_validacao jsonb,
    ds_regras_alertas jsonb,
    fg_ativo boolean DEFAULT true NOT NULL,
    fg_publico boolean DEFAULT false NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_tp_template CHECK (((tp_template)::text = ANY ((ARRAY['geral'::character varying, 'facial'::character varying, 'corporal'::character varying, 'depilacao'::character varying, 'preenchimento'::character varying, 'laser'::character varying, 'botox'::character varying, 'outro'::character varying])::text[])))
);


--
-- Name: TABLE tb_anamnese_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_anamnese_templates IS 'Templates de anamnese (questionários pré-atendimento)';


--
-- Name: COLUMN tb_anamnese_templates.id_template; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.id_template IS 'ID único do template';


--
-- Name: COLUMN tb_anamnese_templates.id_empresa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.id_empresa IS 'Empresa dona do template (NULL = template global)';


--
-- Name: COLUMN tb_anamnese_templates.nm_template; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.nm_template IS 'Nome do template';


--
-- Name: COLUMN tb_anamnese_templates.ds_template; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.ds_template IS 'Descrição do template';


--
-- Name: COLUMN tb_anamnese_templates.tp_template; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.tp_template IS 'Tipo do template: geral, facial, corporal, depilacao, preenchimento, laser, botox, outro';


--
-- Name: COLUMN tb_anamnese_templates.ds_perguntas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.ds_perguntas IS 'Array de perguntas estruturadas em JSON';


--
-- Name: COLUMN tb_anamnese_templates.ds_regras_validacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.ds_regras_validacao IS 'Regras de validação de respostas';


--
-- Name: COLUMN tb_anamnese_templates.ds_regras_alertas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.ds_regras_alertas IS 'Regras para gerar alertas baseados em respostas';


--
-- Name: COLUMN tb_anamnese_templates.fg_ativo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.fg_ativo IS 'Template ativo?';


--
-- Name: COLUMN tb_anamnese_templates.fg_publico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamnese_templates.fg_publico IS 'Template disponível para todas as clínicas?';


--
-- Name: tb_anamneses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_anamneses (
    id_anamnese uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_paciente uuid NOT NULL,
    id_profissional uuid,
    id_procedimento uuid,
    id_template uuid NOT NULL,
    ds_respostas jsonb NOT NULL,
    ds_observacoes text,
    fg_alertas_criticos boolean DEFAULT false NOT NULL,
    ds_alertas jsonb,
    nm_assinatura_paciente character varying(255),
    dt_assinatura_paciente timestamp without time zone,
    nm_assinatura_profissional character varying(255),
    dt_assinatura_profissional timestamp without time zone,
    fg_ativo boolean DEFAULT true NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_assinatura_paciente CHECK ((((nm_assinatura_paciente IS NULL) AND (dt_assinatura_paciente IS NULL)) OR ((nm_assinatura_paciente IS NOT NULL) AND (dt_assinatura_paciente IS NOT NULL)))),
    CONSTRAINT chk_assinatura_profissional CHECK ((((nm_assinatura_profissional IS NULL) AND (dt_assinatura_profissional IS NULL)) OR ((nm_assinatura_profissional IS NOT NULL) AND (dt_assinatura_profissional IS NOT NULL))))
);


--
-- Name: TABLE tb_anamneses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_anamneses IS 'Anamneses preenchidas por pacientes antes de procedimentos';


--
-- Name: COLUMN tb_anamneses.id_anamnese; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.id_anamnese IS 'ID único da anamnese';


--
-- Name: COLUMN tb_anamneses.id_empresa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.id_empresa IS 'Empresa da anamnese (multi-tenant)';


--
-- Name: COLUMN tb_anamneses.id_paciente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.id_paciente IS 'Paciente que preencheu a anamnese';


--
-- Name: COLUMN tb_anamneses.id_profissional; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.id_profissional IS 'Profissional que revisou/assinou (opcional)';


--
-- Name: COLUMN tb_anamneses.id_procedimento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.id_procedimento IS 'Procedimento relacionado (opcional)';


--
-- Name: COLUMN tb_anamneses.id_template; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.id_template IS 'Template utilizado';


--
-- Name: COLUMN tb_anamneses.ds_respostas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.ds_respostas IS 'Respostas do questionário em JSON';


--
-- Name: COLUMN tb_anamneses.ds_observacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.ds_observacoes IS 'Observações adicionais do profissional ou paciente';


--
-- Name: COLUMN tb_anamneses.fg_alertas_criticos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.fg_alertas_criticos IS 'Possui alertas críticos? (ex: gravidez, alergias severas)';


--
-- Name: COLUMN tb_anamneses.ds_alertas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.ds_alertas IS 'Lista de alertas identificados';


--
-- Name: COLUMN tb_anamneses.nm_assinatura_paciente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.nm_assinatura_paciente IS 'Nome para assinatura digital do paciente';


--
-- Name: COLUMN tb_anamneses.dt_assinatura_paciente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.dt_assinatura_paciente IS 'Data/hora da assinatura do paciente';


--
-- Name: COLUMN tb_anamneses.nm_assinatura_profissional; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.nm_assinatura_profissional IS 'Nome para assinatura digital do profissional';


--
-- Name: COLUMN tb_anamneses.dt_assinatura_profissional; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.dt_assinatura_profissional IS 'Data/hora da assinatura do profissional';


--
-- Name: COLUMN tb_anamneses.fg_ativo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_anamneses.fg_ativo IS 'Anamnese ativa? (soft delete para LGPD)';


--
-- Name: tb_anexos_mensagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_anexos_mensagens (
    id_anexo uuid DEFAULT gen_random_uuid() NOT NULL,
    id_mensagem uuid,
    nm_arquivo character varying(500) NOT NULL,
    ds_url text NOT NULL,
    ds_tipo_mime character varying(100),
    nr_tamanho_bytes bigint,
    ds_thumbnail_url text,
    nr_largura integer,
    nr_altura integer,
    nr_duracao_segundos integer,
    st_processado boolean DEFAULT false,
    st_virus_scan boolean DEFAULT false,
    ds_status_scan character varying(50),
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_anexos_mensagens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_anexos_mensagens IS 'Anexos de arquivos nas mensagens';


--
-- Name: tb_api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_api_keys (
    id_api_key uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    nm_api_key character varying(255) NOT NULL,
    nm_descricao text,
    st_ativo boolean DEFAULT true,
    dt_expiracao timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: tb_apikey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_apikey (
    id uuid NOT NULL,
    "apiKey" character varying NOT NULL,
    "apiSecret" character varying NOT NULL,
    "keyName" character varying NOT NULL,
    "updatedDate" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_atendimento_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_atendimento_items (
    id_item uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_fila uuid NOT NULL,
    id_conversa uuid NOT NULL,
    id_contato uuid NOT NULL,
    id_atendente uuid,
    id_atendente_anterior uuid,
    st_atendimento public.st_atendimento_enum DEFAULT 'aguardando'::public.st_atendimento_enum NOT NULL,
    nr_prioridade integer DEFAULT 0,
    nr_posicao_fila integer,
    nr_protocolo character varying(20),
    ds_motivo text,
    ds_motivo_transferencia text,
    dt_sla_primeira_resposta timestamp with time zone,
    dt_sla_resolucao timestamp with time zone,
    st_sla_estourado boolean DEFAULT false,
    dt_entrada_fila timestamp with time zone DEFAULT now() NOT NULL,
    dt_inicio_atendimento timestamp with time zone,
    dt_fim_atendimento timestamp with time zone,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    nr_tempo_espera integer DEFAULT 0,
    nr_tempo_atendimento integer DEFAULT 0
);


--
-- Name: TABLE tb_atendimento_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_atendimento_items IS 'Itens na fila de atendimento humano';


--
-- Name: tb_atividades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_atividades (
    id_atividade uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    ds_tipo character varying(50) NOT NULL,
    ds_entidade character varying(100) NOT NULL,
    id_entidade uuid,
    ds_acao character varying(500) NOT NULL,
    ds_dados_antes jsonb,
    ds_dados_depois jsonb,
    ds_dados_adicionais jsonb,
    ds_ip character varying(45),
    ds_user_agent text,
    ds_origem character varying(50),
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_atividades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_atividades IS 'Log de atividades e auditoria do sistema';


--
-- Name: tb_avaliacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_avaliacoes (
    id_avaliacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_paciente uuid,
    id_profissional uuid,
    id_clinica uuid,
    id_agendamento uuid,
    nr_nota integer,
    ds_comentario text,
    nr_atendimento integer,
    nr_instalacoes integer,
    nr_pontualidade integer,
    nr_resultado integer,
    st_recomenda boolean,
    ds_resposta text,
    dt_resposta timestamp without time zone,
    st_aprovada boolean DEFAULT false,
    st_visivel boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    tk_verificacao character varying(100),
    dt_verificacao timestamp without time zone,
    st_verificada boolean DEFAULT false,
    ds_fotos text[] DEFAULT '{}'::text[],
    nr_likes integer DEFAULT 0,
    nr_nao_util integer DEFAULT 0,
    ds_badge character varying(50),
    id_procedimento uuid,
    ds_ip_origem character varying(45),
    ds_user_agent text,
    CONSTRAINT tb_avaliacoes_nr_atendimento_check CHECK (((nr_atendimento >= 1) AND (nr_atendimento <= 5))),
    CONSTRAINT tb_avaliacoes_nr_instalacoes_check CHECK (((nr_instalacoes >= 1) AND (nr_instalacoes <= 5))),
    CONSTRAINT tb_avaliacoes_nr_nota_check CHECK (((nr_nota >= 1) AND (nr_nota <= 5))),
    CONSTRAINT tb_avaliacoes_nr_pontualidade_check CHECK (((nr_pontualidade >= 1) AND (nr_pontualidade <= 5))),
    CONSTRAINT tb_avaliacoes_nr_resultado_check CHECK (((nr_resultado >= 1) AND (nr_resultado <= 5)))
);

ALTER TABLE ONLY public.tb_avaliacoes FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_avaliacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_avaliacoes IS 'Avaliações de pacientes sobre profissionais e clínicas';


--
-- Name: COLUMN tb_avaliacoes.tk_verificacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_avaliacoes.tk_verificacao IS 'Token único de verificação gerado via QR Code';


--
-- Name: COLUMN tb_avaliacoes.st_verificada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_avaliacoes.st_verificada IS 'Indica se a avaliação foi feita via QR Code verificado';


--
-- Name: COLUMN tb_avaliacoes.ds_fotos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_avaliacoes.ds_fotos IS 'Array de URLs de fotos enviadas na avaliação';


--
-- Name: COLUMN tb_avaliacoes.ds_badge; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_avaliacoes.ds_badge IS 'Badge do avaliador: verificado, premium, top_rated, etc';


--
-- Name: tb_avaliacoes_agentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_avaliacoes_agentes (
    id_avaliacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_marketplace_agente uuid NOT NULL,
    id_usuario uuid NOT NULL,
    id_empresa uuid,
    nr_estrelas integer NOT NULL,
    ds_comentario text,
    st_util boolean,
    nr_votos_util integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tb_avaliacoes_agentes_nr_estrelas_check CHECK (((nr_estrelas >= 1) AND (nr_estrelas <= 5)))
);


--
-- Name: TABLE tb_avaliacoes_agentes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_avaliacoes_agentes IS 'Avaliações e comentários dos usuários sobre agentes do marketplace';


--
-- Name: COLUMN tb_avaliacoes_agentes.st_util; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_avaliacoes_agentes.st_util IS 'Outros usuários marcam a avaliação como útil ou não';


--
-- Name: tb_avaliacoes_fotos_moderacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_avaliacoes_fotos_moderacao (
    id_moderacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_avaliacao uuid NOT NULL,
    ds_foto_url text NOT NULL,
    st_aprovada boolean,
    ds_motivo_rejeicao text,
    id_moderador uuid,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dt_moderacao timestamp without time zone
);


--
-- Name: TABLE tb_avaliacoes_fotos_moderacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_avaliacoes_fotos_moderacao IS 'Moderação de fotos enviadas nas avaliações';


--
-- Name: tb_avaliacoes_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_avaliacoes_likes (
    id_like uuid DEFAULT gen_random_uuid() NOT NULL,
    id_avaliacao uuid NOT NULL,
    id_user uuid NOT NULL,
    st_tipo character varying(10) NOT NULL,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tb_avaliacoes_likes_st_tipo_check CHECK (((st_tipo)::text = ANY ((ARRAY['util'::character varying, 'nao_util'::character varying])::text[])))
);


--
-- Name: TABLE tb_avaliacoes_likes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_avaliacoes_likes IS 'Likes/útil dados por usuários em avaliações';


--
-- Name: tb_avaliacoes_produtos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_avaliacoes_produtos (
    id_avaliacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_produto uuid,
    id_user uuid,
    id_pedido uuid,
    nr_nota integer NOT NULL,
    ds_titulo character varying(255),
    ds_comentario text,
    nr_qualidade integer,
    nr_custo_beneficio integer,
    nr_entrega integer,
    ds_fotos text[],
    st_recomenda boolean,
    st_compra_verificada boolean DEFAULT false,
    ds_resposta text,
    dt_resposta timestamp without time zone,
    st_aprovada boolean DEFAULT false,
    st_reportada boolean DEFAULT false,
    ds_motivo_report text,
    nr_util integer DEFAULT 0,
    nr_nao_util integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    ds_resposta_fornecedor text,
    dt_resposta_fornecedor timestamp without time zone,
    CONSTRAINT tb_avaliacoes_produtos_nr_custo_beneficio_check CHECK (((nr_custo_beneficio >= 1) AND (nr_custo_beneficio <= 5))),
    CONSTRAINT tb_avaliacoes_produtos_nr_entrega_check CHECK (((nr_entrega >= 1) AND (nr_entrega <= 5))),
    CONSTRAINT tb_avaliacoes_produtos_nr_nota_check CHECK (((nr_nota >= 1) AND (nr_nota <= 5))),
    CONSTRAINT tb_avaliacoes_produtos_nr_qualidade_check CHECK (((nr_qualidade >= 1) AND (nr_qualidade <= 5)))
);


--
-- Name: TABLE tb_avaliacoes_produtos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_avaliacoes_produtos IS 'Avaliações de produtos por clientes';


--
-- Name: tb_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_banners (
    id_banner uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    nm_titulo character varying(255) NOT NULL,
    ds_descricao text,
    ds_imagem_url text NOT NULL,
    ds_imagem_mobile_url text,
    ds_tipo_acao character varying(50),
    ds_url text,
    id_produto uuid,
    id_procedimento uuid,
    ds_posicao character varying(50) DEFAULT 'home'::character varying,
    nr_ordem integer DEFAULT 0,
    dt_inicio timestamp without time zone NOT NULL,
    dt_fim timestamp without time zone NOT NULL,
    ds_publico_alvo character varying(50),
    nr_visualizacoes integer DEFAULT 0,
    nr_cliques integer DEFAULT 0,
    nr_taxa_conversao numeric(5,2) DEFAULT 0,
    st_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_banners; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_banners IS 'Banners e anúncios promocionais';


--
-- Name: tb_broadcast_campanhas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_broadcast_campanhas (
    id_campanha uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_user_criador uuid NOT NULL,
    nm_campanha character varying(255) NOT NULL,
    ds_descricao text,
    tp_campanha character varying(20) DEFAULT 'informativo'::character varying NOT NULL,
    ds_assunto character varying(255),
    ds_mensagem text NOT NULL,
    ds_template_id uuid,
    tp_canal character varying(20) DEFAULT 'email'::character varying NOT NULL,
    ds_filtros_segmentacao jsonb,
    dt_agendamento timestamp without time zone,
    fg_agendada boolean DEFAULT false NOT NULL,
    st_campanha character varying(20) DEFAULT 'rascunho'::character varying NOT NULL,
    dt_inicio_envio timestamp without time zone,
    dt_fim_envio timestamp without time zone,
    nr_total_destinatarios integer DEFAULT 0 NOT NULL,
    nr_enviados integer DEFAULT 0 NOT NULL,
    nr_entregues integer DEFAULT 0 NOT NULL,
    nr_falhas integer DEFAULT 0 NOT NULL,
    nr_abertos integer DEFAULT 0 NOT NULL,
    nr_cliques integer DEFAULT 0 NOT NULL,
    ds_metadados jsonb,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    fg_ativo boolean DEFAULT true NOT NULL,
    CONSTRAINT tb_broadcast_campanhas_st_campanha_check CHECK (((st_campanha)::text = ANY ((ARRAY['rascunho'::character varying, 'agendada'::character varying, 'processando'::character varying, 'enviada'::character varying, 'cancelada'::character varying, 'erro'::character varying])::text[]))),
    CONSTRAINT tb_broadcast_campanhas_tp_campanha_check CHECK (((tp_campanha)::text = ANY ((ARRAY['promocional'::character varying, 'informativo'::character varying, 'transacional'::character varying, 'lembrete'::character varying])::text[]))),
    CONSTRAINT tb_broadcast_campanhas_tp_canal_check CHECK (((tp_canal)::text = ANY ((ARRAY['email'::character varying, 'whatsapp'::character varying, 'sms'::character varying, 'push'::character varying, 'mensagem_interna'::character varying])::text[])))
);


--
-- Name: TABLE tb_broadcast_campanhas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_broadcast_campanhas IS 'Campanhas de broadcast (envio em massa)';


--
-- Name: COLUMN tb_broadcast_campanhas.tp_campanha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_broadcast_campanhas.tp_campanha IS 'promocional | informativo | transacional | lembrete';


--
-- Name: COLUMN tb_broadcast_campanhas.tp_canal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_broadcast_campanhas.tp_canal IS 'email | whatsapp | sms | push | mensagem_interna';


--
-- Name: COLUMN tb_broadcast_campanhas.ds_filtros_segmentacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_broadcast_campanhas.ds_filtros_segmentacao IS 'JSON com filtros de segmentação aplicados';


--
-- Name: COLUMN tb_broadcast_campanhas.st_campanha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_broadcast_campanhas.st_campanha IS 'rascunho | agendada | processando | enviada | cancelada | erro';


--
-- Name: tb_broadcast_destinatarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_broadcast_destinatarios (
    id_destinatario uuid DEFAULT gen_random_uuid() NOT NULL,
    id_campanha uuid NOT NULL,
    id_user uuid NOT NULL,
    ds_email character varying(255),
    ds_telefone character varying(20),
    ds_push_token character varying(255),
    st_envio character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    ds_mensagem_erro text,
    dt_enviado timestamp without time zone,
    dt_entregue timestamp without time zone,
    dt_aberto timestamp without time zone,
    dt_clicado timestamp without time zone,
    nr_vezes_aberto integer DEFAULT 0 NOT NULL,
    nr_vezes_clicado integer DEFAULT 0 NOT NULL,
    ds_metadados jsonb,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_broadcast_destinatarios_st_envio_check CHECK (((st_envio)::text = ANY ((ARRAY['pendente'::character varying, 'enviado'::character varying, 'entregue'::character varying, 'falha'::character varying, 'aberto'::character varying, 'clicado'::character varying])::text[])))
);


--
-- Name: TABLE tb_broadcast_destinatarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_broadcast_destinatarios IS 'Destinatários individuais de cada campanha com tracking de entrega';


--
-- Name: COLUMN tb_broadcast_destinatarios.st_envio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_broadcast_destinatarios.st_envio IS 'pendente | enviado | entregue | falha | aberto | clicado';


--
-- Name: tb_broadcast_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_broadcast_templates (
    id_template uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    nm_template character varying(255) NOT NULL,
    ds_descricao text,
    tp_canal character varying(20) NOT NULL,
    ds_assunto character varying(255),
    ds_corpo text NOT NULL,
    ds_variaveis jsonb,
    tp_categoria character varying(50),
    fg_ativo boolean DEFAULT true NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_broadcast_templates_tp_canal_check CHECK (((tp_canal)::text = ANY ((ARRAY['email'::character varying, 'whatsapp'::character varying, 'sms'::character varying, 'push'::character varying, 'mensagem_interna'::character varying])::text[])))
);


--
-- Name: TABLE tb_broadcast_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_broadcast_templates IS 'Templates reutilizáveis para campanhas de broadcast';


--
-- Name: COLUMN tb_broadcast_templates.ds_variaveis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_broadcast_templates.ds_variaveis IS 'JSON com lista de variáveis permitidas no template';


--
-- Name: tb_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_cache (
    nm_chave character varying(500) NOT NULL,
    ds_valor text NOT NULL,
    ds_tags text[],
    dt_expiracao timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_cache; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_cache IS 'Cache de dados do sistema';


--
-- Name: tb_campanha_destinatarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_campanha_destinatarios (
    id_destinatario uuid DEFAULT gen_random_uuid() NOT NULL,
    id_campanha uuid NOT NULL,
    id_contato uuid NOT NULL,
    st_enviado boolean DEFAULT false,
    st_entregue boolean DEFAULT false,
    st_lido boolean DEFAULT false,
    st_respondido boolean DEFAULT false,
    st_convertido boolean DEFAULT false,
    st_erro boolean DEFAULT false,
    ds_erro text,
    id_mensagem_externo character varying(255),
    ds_variaveis jsonb DEFAULT '{}'::jsonb,
    dt_envio timestamp with time zone,
    dt_entrega timestamp with time zone,
    dt_leitura timestamp with time zone,
    dt_resposta timestamp with time zone,
    dt_conversao timestamp with time zone,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_campanha_destinatarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_campanha_destinatarios IS 'Destinatários de campanhas com tracking individual';


--
-- Name: tb_campanhas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_campanhas (
    id_campanha uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    nm_campanha character varying(255) NOT NULL,
    ds_descricao text,
    tp_campanha public.tp_campanha_enum NOT NULL,
    st_campanha public.st_campanha_enum DEFAULT 'rascunho'::public.st_campanha_enum NOT NULL,
    tp_canal public.tp_canal_enum NOT NULL,
    id_canal uuid,
    nm_template character varying(100),
    ds_mensagem text NOT NULL,
    ds_variaveis jsonb DEFAULT '{}'::jsonb,
    dt_agendamento timestamp with time zone,
    dt_inicio timestamp with time zone,
    dt_fim timestamp with time zone,
    nr_limite_diario integer DEFAULT 100,
    nr_intervalo_segundos integer DEFAULT 60,
    ds_filtros jsonb DEFAULT '{}'::jsonb,
    nr_total_destinatarios integer DEFAULT 0,
    nr_enviados integer DEFAULT 0,
    nr_entregues integer DEFAULT 0,
    nr_lidos integer DEFAULT 0,
    nr_respondidos integer DEFAULT 0,
    nr_convertidos integer DEFAULT 0,
    nr_erros integer DEFAULT 0,
    pc_taxa_abertura numeric(5,2) DEFAULT 0,
    pc_taxa_resposta numeric(5,2) DEFAULT 0,
    pc_taxa_conversao numeric(5,2) DEFAULT 0,
    id_criador uuid,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    nr_enviados_hoje integer DEFAULT 0 NOT NULL,
    dt_ultimo_reset_diario date
);


--
-- Name: TABLE tb_campanhas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_campanhas IS 'Campanhas de prospecção proativa e marketing';


--
-- Name: tb_canais_omni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_canais_omni (
    id_canal uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    nm_canal character varying(100) NOT NULL,
    tp_canal public.tp_canal_enum NOT NULL,
    ds_descricao text,
    st_canal public.st_canal_enum DEFAULT 'configurando'::public.st_canal_enum NOT NULL,
    st_ativo boolean DEFAULT true NOT NULL,
    id_telefone_whatsapp character varying(20),
    id_instagram character varying(100),
    id_facebook_page character varying(100),
    nm_email character varying(255),
    ds_credenciais jsonb DEFAULT '{}'::jsonb,
    id_credencial uuid,
    ds_configuracoes jsonb DEFAULT '{}'::jsonb,
    ds_webhook_url character varying(500),
    ds_webhook_secret character varying(255),
    nr_mensagens_enviadas integer DEFAULT 0,
    nr_mensagens_recebidas integer DEFAULT 0,
    nr_conversas_ativas integer DEFAULT 0,
    dt_ultima_sincronizacao timestamp with time zone,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_desativacao timestamp with time zone
);


--
-- Name: TABLE tb_canais_omni; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_canais_omni IS 'Canais de comunicação omnichannel (WhatsApp, Instagram, etc.)';


--
-- Name: COLUMN tb_canais_omni.ds_credenciais; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_canais_omni.ds_credenciais IS 'Credenciais do canal (tokens, secrets) - devem ser criptografadas';


--
-- Name: tb_candidaturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_candidaturas (
    id_candidatura uuid NOT NULL,
    id_vaga uuid NOT NULL,
    id_curriculo uuid NOT NULL,
    id_candidato uuid NOT NULL,
    ds_carta_apresentacao text NOT NULL,
    ds_status character varying(50) NOT NULL,
    nr_match_score integer,
    dt_candidatura timestamp without time zone NOT NULL,
    dt_visualizacao_empresa timestamp without time zone,
    dt_entrevista timestamp without time zone,
    dt_finalizacao timestamp without time zone,
    ds_feedback_empresa text,
    ds_feedback_candidato text,
    nr_avaliacao_candidato integer,
    nm_candidato character varying(255),
    ds_email_candidato character varying(255),
    nr_telefone_candidato character varying(20),
    nm_cargo_vaga character varying(255),
    nm_empresa character varying(255),
    dt_atualizacao timestamp without time zone
);


--
-- Name: tb_carrinho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_carrinho (
    id_item_carrinho uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_produto uuid,
    id_procedimento uuid,
    id_variacao uuid,
    id_profissional uuid,
    dt_agendamento_desejado timestamp without time zone,
    qt_quantidade integer DEFAULT 1,
    vl_unitario numeric(10,2) NOT NULL,
    vl_total numeric(10,2) GENERATED ALWAYS AS (((qt_quantidade)::numeric * vl_unitario)) STORED,
    ds_observacoes text,
    dt_adicionado timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    id_profissional_desejado uuid,
    CONSTRAINT chk_carrinho_item_type CHECK ((((id_produto IS NOT NULL) AND (id_procedimento IS NULL)) OR ((id_produto IS NULL) AND (id_procedimento IS NOT NULL)))),
    CONSTRAINT chk_item_type CHECK ((((id_produto IS NOT NULL) AND (id_procedimento IS NULL)) OR ((id_produto IS NULL) AND (id_procedimento IS NOT NULL)))),
    CONSTRAINT tb_carrinho_qt_quantidade_check CHECK ((qt_quantidade > 0))
);


--
-- Name: TABLE tb_carrinho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_carrinho IS 'Carrinho de compras dos usuários (produtos e procedimentos)';


--
-- Name: COLUMN tb_carrinho.id_procedimento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_carrinho.id_procedimento IS 'Procedimento a ser agendado (alternativo a produto)';


--
-- Name: COLUMN tb_carrinho.dt_agendamento_desejado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_carrinho.dt_agendamento_desejado IS 'Data/hora desejada para procedimento';


--
-- Name: tb_categorias_financeiras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_categorias_financeiras (
    id_categoria uuid DEFAULT gen_random_uuid() NOT NULL,
    id_categoria_pai uuid,
    id_empresa uuid,
    nm_categoria character varying(100) NOT NULL,
    ds_tipo character varying(20) NOT NULL,
    ds_cor character varying(20),
    ds_icone character varying(50),
    st_ativo boolean DEFAULT true,
    nr_ordem integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_categorias_financeiras; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_categorias_financeiras IS 'Categorias para organização de receitas e despesas';


--
-- Name: tb_categorias_produtos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_categorias_produtos (
    id_categoria uuid DEFAULT gen_random_uuid() NOT NULL,
    id_categoria_pai uuid,
    nm_categoria character varying(100) NOT NULL,
    ds_descricao text,
    ds_slug character varying(100) NOT NULL,
    ds_icone character varying(100),
    ds_imagem_url text,
    nr_ordem integer DEFAULT 0,
    st_ativo boolean DEFAULT true,
    st_destaque boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_categorias_produtos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_categorias_produtos IS 'Categorias hierárquicas de produtos';


--
-- Name: tb_chat_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_chat_message (
    id_chat_message uuid NOT NULL,
    id_agent uuid NOT NULL,
    id_conversation uuid NOT NULL,
    tools text,
    nm_text text NOT NULL,
    nm_tipo character varying(20) NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_clinicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_clinicas (
    id_clinica uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    nm_clinica character varying(255) NOT NULL,
    ds_clinica text,
    nr_cnpj character varying(18),
    ds_email character varying(255),
    nr_telefone character varying(20),
    nr_whatsapp character varying(20),
    ds_endereco character varying(255),
    nr_numero character varying(20),
    ds_complemento character varying(100),
    nm_bairro character varying(100),
    nm_cidade character varying(100),
    nm_estado character varying(2),
    nr_cep character varying(10),
    ds_latitude numeric(10,8),
    ds_longitude numeric(11,8),
    nm_responsavel character varying(255),
    nr_cnes character varying(20),
    ds_especialidades text[],
    ds_foto_principal text,
    ds_fotos_galeria text[],
    ds_horario_funcionamento jsonb,
    nr_tempo_medio_consulta integer DEFAULT 60,
    st_aceita_convenio boolean DEFAULT false,
    ds_convenios text[],
    st_ativo boolean DEFAULT true,
    st_verificada boolean DEFAULT false,
    nr_avaliacao_media numeric(3,2) DEFAULT 0.0,
    nr_total_avaliacoes integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public.tb_clinicas FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_clinicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_clinicas IS 'Cadastro de clínicas de estética';


--
-- Name: tb_cliques_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_cliques_banners (
    id_clique uuid DEFAULT gen_random_uuid() NOT NULL,
    id_banner uuid,
    id_user uuid,
    ds_ip character varying(45),
    ds_user_agent text,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_cliques_banners; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_cliques_banners IS 'Rastreamento de cliques em banners';


--
-- Name: tb_comentarios_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_comentarios_fotos (
    id_comentario uuid DEFAULT gen_random_uuid() NOT NULL,
    id_foto uuid,
    id_user uuid,
    id_comentario_pai uuid,
    ds_comentario text NOT NULL,
    st_editado boolean DEFAULT false,
    st_aprovado boolean DEFAULT true,
    st_deletado boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_comentarios_fotos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_comentarios_fotos IS 'Comentários nas fotos';


--
-- Name: tb_compartilhamentos_album; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_compartilhamentos_album (
    id_compartilhamento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_album uuid,
    id_user_compartilhou uuid,
    id_user_destinatario uuid,
    st_pode_comentar boolean DEFAULT true,
    st_pode_baixar boolean DEFAULT false,
    ds_token_compartilhamento character varying(100),
    dt_expiracao timestamp without time zone,
    st_ativo boolean DEFAULT true,
    st_visto boolean DEFAULT false,
    dt_primeiro_acesso timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_compartilhamentos_album; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_compartilhamentos_album IS 'Compartilhamento de álbuns entre usuários';


--
-- Name: tb_config_central_atendimento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_config_central_atendimento (
    id_config uuid NOT NULL,
    id_empresa uuid NOT NULL,
    nm_empresa_chat character varying(100) NOT NULL,
    ds_mensagem_boas_vindas text,
    ds_mensagem_ausencia text,
    ds_mensagem_encerramento text,
    nr_tempo_inatividade integer NOT NULL,
    st_encerramento_automatico boolean NOT NULL,
    st_pesquisa_satisfacao boolean NOT NULL,
    st_bot_ativo boolean NOT NULL,
    st_transferencia_automatica boolean NOT NULL,
    nr_tentativas_antes_transferir integer NOT NULL,
    ds_palavras_transferencia character varying[],
    st_resposta_ia boolean NOT NULL,
    nm_modelo_ia character varying(50) NOT NULL,
    nr_temperatura_ia double precision NOT NULL,
    st_respeitar_horario boolean NOT NULL,
    hr_inicio character varying(5) NOT NULL,
    hr_fim character varying(5) NOT NULL,
    ds_dias_semana character varying[] NOT NULL,
    st_atender_feriados boolean NOT NULL,
    st_som_mensagem boolean NOT NULL,
    st_notificacao_desktop boolean NOT NULL,
    st_email_nova_conversa boolean NOT NULL,
    st_email_resumo_diario boolean NOT NULL,
    nm_email_notificacoes character varying(255),
    ds_webhook_url character varying(500),
    st_webhook_ativo boolean NOT NULL,
    st_rate_limiting boolean NOT NULL,
    ds_cor_widget character varying(7) NOT NULL,
    ds_posicao_widget character varying(20) NOT NULL,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_config_central_atendimento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_config_central_atendimento IS 'Configurações da Central de Atendimento por empresa';


--
-- Name: COLUMN tb_config_central_atendimento.nr_tempo_inatividade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_config_central_atendimento.nr_tempo_inatividade IS 'Tempo em minutos para encerramento automático';


--
-- Name: COLUMN tb_config_central_atendimento.ds_palavras_transferencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_config_central_atendimento.ds_palavras_transferencia IS 'Palavras-chave que disparam transferência para humano';


--
-- Name: COLUMN tb_config_central_atendimento.nr_temperatura_ia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_config_central_atendimento.nr_temperatura_ia IS 'Temperatura do modelo de IA (0.0 a 2.0)';


--
-- Name: tb_configuracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_configuracoes (
    id_configuracao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    nm_chave character varying(255) NOT NULL,
    ds_valor text,
    ds_valor_padrao text,
    ds_tipo character varying(50) DEFAULT 'texto'::character varying,
    ds_categoria character varying(100) NOT NULL,
    ds_descricao text,
    ds_ajuda text,
    st_criptografado boolean DEFAULT false,
    st_somente_leitura boolean DEFAULT false,
    ds_validacao character varying(500),
    ds_opcoes text[],
    st_ativo boolean DEFAULT true,
    st_visivel boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public.tb_configuracoes FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_configuracoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_configuracoes IS 'Configurações do sistema (WhatsApp, Email, SMS, etc)';


--
-- Name: COLUMN tb_configuracoes.id_empresa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_configuracoes.id_empresa IS 'Empresa dona da configuração (multi-tenant)';


--
-- Name: COLUMN tb_configuracoes.ds_valor_padrao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_configuracoes.ds_valor_padrao IS 'Valor padrão caso configuração não esteja definida';


--
-- Name: COLUMN tb_configuracoes.ds_tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_configuracoes.ds_tipo IS 'Tipo do valor: texto, numero, boolean, json, senha';


--
-- Name: COLUMN tb_configuracoes.ds_categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_configuracoes.ds_categoria IS 'Categoria da configuração: whatsapp, email, sms, pagamento, geral';


--
-- Name: COLUMN tb_configuracoes.st_criptografado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_configuracoes.st_criptografado IS 'Se TRUE, o valor deve ser criptografado no backend';


--
-- Name: tb_contas_bancarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_contas_bancarias (
    id_conta uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    id_profissional uuid,
    id_fornecedor uuid,
    ds_tipo_titular character varying(20) NOT NULL,
    nm_banco character varying(100) NOT NULL,
    nr_banco character varying(10),
    ds_agencia character varying(20) NOT NULL,
    ds_conta character varying(20) NOT NULL,
    ds_tipo_conta character varying(20) DEFAULT 'corrente'::character varying,
    ds_pix character varying(255),
    st_principal boolean DEFAULT false,
    st_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_titular_type CHECK ((((id_empresa IS NOT NULL) AND (id_profissional IS NULL) AND (id_fornecedor IS NULL)) OR ((id_empresa IS NULL) AND (id_profissional IS NOT NULL) AND (id_fornecedor IS NULL)) OR ((id_empresa IS NULL) AND (id_profissional IS NULL) AND (id_fornecedor IS NOT NULL))))
);


--
-- Name: TABLE tb_contas_bancarias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_contas_bancarias IS 'Contas bancárias de empresas, profissionais e fornecedores';


--
-- Name: tb_contatos_omni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_contatos_omni (
    id_contato uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    nm_contato character varying(255) NOT NULL,
    nm_apelido character varying(100),
    nm_email character varying(255),
    nr_telefone character varying(20),
    nr_telefone_secundario character varying(20),
    nr_documento character varying(20),
    ds_endereco text,
    nm_cidade character varying(100),
    nm_estado character varying(2),
    nr_cep character varying(10),
    nm_pais character varying(50) DEFAULT 'Brasil'::character varying,
    st_contato public.st_contato_omni_enum DEFAULT 'lead'::public.st_contato_omni_enum NOT NULL,
    st_ativo boolean DEFAULT true NOT NULL,
    st_bloqueado boolean DEFAULT false NOT NULL,
    id_whatsapp character varying(50),
    id_instagram character varying(100),
    id_facebook character varying(100),
    id_paciente uuid,
    ds_preferencias jsonb DEFAULT '{}'::jsonb,
    ds_tags text[] DEFAULT '{}'::text[],
    nm_origem character varying(100),
    nm_canal_origem character varying(50),
    ds_metadata jsonb DEFAULT '{}'::jsonb,
    ds_notas text,
    nr_conversas_total integer DEFAULT 0,
    nr_agendamentos_total integer DEFAULT 0,
    nr_compras_total integer DEFAULT 0,
    vl_total_gasto numeric(15,2) DEFAULT 0,
    dt_primeiro_contato timestamp with time zone,
    dt_ultimo_contato timestamp with time zone,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_contatos_omni; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_contatos_omni IS 'Contatos unificados omnichannel com dados de múltiplos canais';


--
-- Name: COLUMN tb_contatos_omni.ds_tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_contatos_omni.ds_tags IS 'Tags para segmentação do contato';


--
-- Name: tb_conversas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_conversas (
    id_conversa uuid DEFAULT gen_random_uuid() NOT NULL,
    id_agente uuid,
    id_user uuid,
    id_paciente uuid,
    nm_titulo character varying(255),
    ds_contexto text,
    ds_metadata jsonb DEFAULT '{}'::jsonb,
    st_ativa boolean DEFAULT true,
    dt_ultima_mensagem timestamp without time zone,
    nr_total_mensagens integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    id_empresa uuid,
    ds_resumo text,
    nr_mensagens_usuario integer DEFAULT 0,
    nr_mensagens_agente integer DEFAULT 0,
    nr_tokens_total integer DEFAULT 0,
    vl_custo_total numeric(10,6) DEFAULT 0.0,
    st_arquivada boolean DEFAULT false,
    st_compartilhada boolean DEFAULT false,
    st_favorita boolean DEFAULT false,
    ds_token_compartilhamento character varying(255),
    ds_tags text[],
    dt_arquivada timestamp without time zone
);


--
-- Name: TABLE tb_conversas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_conversas IS 'Armazena conversas entre usuários e agentes de IA';


--
-- Name: COLUMN tb_conversas.nm_titulo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.nm_titulo IS 'Título da conversa (auto-gerado ou manual)';


--
-- Name: COLUMN tb_conversas.nr_total_mensagens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.nr_total_mensagens IS 'Total de mensagens na conversa';


--
-- Name: COLUMN tb_conversas.id_empresa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.id_empresa IS 'FK para tb_empresas - permite multi-tenancy';


--
-- Name: COLUMN tb_conversas.ds_resumo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.ds_resumo IS 'Resumo automático da conversa gerado por IA';


--
-- Name: COLUMN tb_conversas.nr_mensagens_usuario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.nr_mensagens_usuario IS 'Contador de mensagens do usuário';


--
-- Name: COLUMN tb_conversas.nr_mensagens_agente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.nr_mensagens_agente IS 'Contador de mensagens do agente/assistente';


--
-- Name: COLUMN tb_conversas.nr_tokens_total; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.nr_tokens_total IS 'Total de tokens consumidos na conversa';


--
-- Name: COLUMN tb_conversas.vl_custo_total; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.vl_custo_total IS 'Custo total acumulado da conversa em USD';


--
-- Name: COLUMN tb_conversas.st_arquivada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.st_arquivada IS 'Indica se a conversa foi arquivada';


--
-- Name: COLUMN tb_conversas.st_compartilhada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.st_compartilhada IS 'Indica se a conversa está compartilhada publicamente';


--
-- Name: COLUMN tb_conversas.st_favorita; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.st_favorita IS 'Indica se a conversa está marcada como favorita';


--
-- Name: COLUMN tb_conversas.ds_token_compartilhamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.ds_token_compartilhamento IS 'Token único para compartilhamento público da conversa';


--
-- Name: COLUMN tb_conversas.ds_tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.ds_tags IS 'Array de tags para categorização da conversa';


--
-- Name: COLUMN tb_conversas.dt_arquivada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas.dt_arquivada IS 'Data e hora em que a conversa foi arquivada';


--
-- Name: tb_conversas_compartilhadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_conversas_compartilhadas (
    id_compartilhamento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_conversa uuid NOT NULL,
    id_user_criador uuid NOT NULL,
    ds_token character varying(64) NOT NULL,
    ds_senha_hash character varying(255),
    dt_expiracao timestamp without time zone,
    fg_expirado boolean DEFAULT false NOT NULL,
    nr_visualizacoes integer DEFAULT 0 NOT NULL,
    dt_ultimo_acesso timestamp without time zone,
    ds_descricao text,
    ds_ip_criador character varying(45),
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_revogado timestamp without time zone,
    fg_ativo boolean DEFAULT true NOT NULL
);


--
-- Name: TABLE tb_conversas_compartilhadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_conversas_compartilhadas IS 'UC085 - Links públicos de compartilhamento de conversas';


--
-- Name: COLUMN tb_conversas_compartilhadas.ds_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas_compartilhadas.ds_token IS 'Token único para acesso público (URL-safe base64)';


--
-- Name: COLUMN tb_conversas_compartilhadas.ds_senha_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas_compartilhadas.ds_senha_hash IS 'Hash bcrypt da senha de proteção (opcional)';


--
-- Name: COLUMN tb_conversas_compartilhadas.dt_expiracao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas_compartilhadas.dt_expiracao IS 'Data de expiração do link (null = nunca expira)';


--
-- Name: COLUMN tb_conversas_compartilhadas.nr_visualizacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas_compartilhadas.nr_visualizacoes IS 'Contador de acessos ao link';


--
-- Name: tb_conversas_omni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_conversas_omni (
    id_conversa uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_contato uuid NOT NULL,
    id_canal uuid,
    tp_canal public.tp_canal_enum NOT NULL,
    nm_titulo character varying(255),
    ds_resumo text,
    st_aberta boolean DEFAULT true NOT NULL,
    st_arquivada boolean DEFAULT false NOT NULL,
    st_bot_ativo boolean DEFAULT true NOT NULL,
    st_aguardando_humano boolean DEFAULT false NOT NULL,
    id_atendente uuid,
    id_fila uuid,
    id_agente uuid,
    nr_mensagens_total integer DEFAULT 0,
    nr_mensagens_entrada integer DEFAULT 0,
    nr_mensagens_saida integer DEFAULT 0,
    nr_tempo_resposta_medio integer DEFAULT 0,
    ds_contexto jsonb DEFAULT '{}'::jsonb,
    ds_metadata jsonb DEFAULT '{}'::jsonb,
    nr_avaliacao integer,
    ds_feedback text,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_ultima_mensagem timestamp with time zone,
    dt_fechamento timestamp with time zone,
    st_favorito boolean DEFAULT false,
    CONSTRAINT tb_conversas_omni_nr_avaliacao_check CHECK (((nr_avaliacao >= 1) AND (nr_avaliacao <= 5)))
);


--
-- Name: TABLE tb_conversas_omni; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_conversas_omni IS 'Conversas unificadas omnichannel com histórico completo';


--
-- Name: COLUMN tb_conversas_omni.ds_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas_omni.ds_metadata IS 'Metadados da conversa em JSON (ex: video_url, call_sid, tags)';


--
-- Name: COLUMN tb_conversas_omni.st_favorito; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_conversas_omni.st_favorito IS 'Indica se a conversa foi marcada como favorita pelo atendente';


--
-- Name: tb_conversas_usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_conversas_usuarios (
    id_conversa uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    ds_tipo character varying(20) DEFAULT 'individual'::character varying,
    nm_titulo character varying(255),
    ds_descricao text,
    st_arquivada boolean DEFAULT false,
    st_bloqueada boolean DEFAULT false,
    ds_avatar_url text,
    dt_ultima_mensagem timestamp without time zone,
    id_ultima_mensagem uuid,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_conversas_usuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_conversas_usuarios IS 'Conversas entre usuários (individual ou grupo)';


--
-- Name: tb_credenciais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_credenciais (
    id_credencial uuid NOT NULL,
    nome character varying(255) NOT NULL,
    nome_credencial character varying(100) NOT NULL,
    dados_criptografado text NOT NULL,
    dt_criacao timestamp with time zone DEFAULT now(),
    dt_atualizacao timestamp with time zone DEFAULT now()
);


--
-- Name: tb_cupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_cupons (
    id_cupom uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    id_fornecedor uuid,
    ds_codigo character varying(50) NOT NULL,
    nm_cupom character varying(255) NOT NULL,
    ds_descricao text,
    ds_tipo_desconto character varying(20) NOT NULL,
    nr_percentual_desconto numeric(5,2),
    vl_desconto_fixo numeric(10,2),
    vl_minimo_compra numeric(10,2),
    vl_maximo_desconto numeric(10,2),
    nr_usos_maximos integer,
    nr_usos_por_usuario integer DEFAULT 1,
    nr_usos_atuais integer DEFAULT 0,
    ds_produtos_validos uuid[],
    ds_categorias_validas uuid[],
    st_primeira_compra boolean DEFAULT false,
    dt_inicio timestamp without time zone NOT NULL,
    dt_fim timestamp without time zone NOT NULL,
    st_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_cupons; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_cupons IS 'Cupons de desconto promocionais';


--
-- Name: tb_cupons_uso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_cupons_uso (
    id_uso uuid DEFAULT gen_random_uuid() NOT NULL,
    id_cupom uuid,
    id_user uuid,
    id_pedido uuid,
    vl_desconto_aplicado numeric(10,2) NOT NULL,
    dt_uso timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_cupons_uso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_cupons_uso IS 'Rastreamento de uso de cupons';


--
-- Name: tb_curriculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_curriculos (
    id_curriculo uuid NOT NULL,
    id_usuario uuid,
    nm_completo character varying(255) NOT NULL,
    ds_email character varying(255) NOT NULL,
    nr_telefone character varying(20) NOT NULL,
    ds_linkedin character varying(500),
    ds_portfolio character varying(500),
    ds_foto_url character varying(500),
    nm_cidade character varying(100) NOT NULL,
    nm_estado character varying(2) NOT NULL,
    ds_cep character varying(10),
    nm_cargo_desejado character varying(255) NOT NULL,
    ds_resumo_profissional text NOT NULL,
    nm_nivel_experiencia character varying(50) NOT NULL,
    nr_anos_experiencia integer NOT NULL,
    habilidades json NOT NULL,
    idiomas json,
    experiencias json,
    formacoes json,
    certificacoes json,
    tipos_contrato_aceitos json NOT NULL,
    regimes_trabalho_aceitos json NOT NULL,
    vl_pretensao_salarial_min numeric(10,2),
    vl_pretensao_salarial_max numeric(10,2),
    fg_disponibilidade_viagem boolean,
    fg_disponibilidade_mudanca boolean,
    ds_status character varying(20) NOT NULL,
    fg_visivel_recrutadores boolean,
    dt_criacao timestamp without time zone NOT NULL,
    dt_atualizacao timestamp without time zone,
    nr_visualizacoes integer,
    nr_candidaturas integer
);


--
-- Name: tb_curtidas_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_curtidas_fotos (
    id_curtida uuid DEFAULT gen_random_uuid() NOT NULL,
    id_foto uuid,
    id_user uuid,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_curtidas_fotos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_curtidas_fotos IS 'Curtidas nas fotos';


--
-- Name: tb_dispositivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_dispositivos (
    id_dispositivo uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    ds_token_push character varying(500) NOT NULL,
    ds_plataforma character varying(20) NOT NULL,
    nm_modelo character varying(255),
    ds_sistema_operacional character varying(100),
    ds_versao_app character varying(50),
    st_ativo boolean DEFAULT true,
    dt_ultimo_acesso timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_dispositivos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_dispositivos IS 'Dispositivos registrados para push notifications';


--
-- Name: tb_documento_store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_documento_store (
    id_documento_store uuid NOT NULL,
    nm_documento_store character varying,
    ds_documento_store character varying,
    ds_loaders text,
    ds_where_used text,
    nm_status character varying,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    ds_vector_store_config text,
    ds_embedding_config text,
    ds_record_manager_config text
);


--
-- Name: tb_documento_store_file_chunk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_documento_store_file_chunk (
    id_chunk uuid NOT NULL,
    id_documento uuid,
    nr_chunk integer,
    id_store uuid,
    ds_page_content text,
    ds_metadata text,
    ds_embedding public.vector(3072)
);


--
-- Name: tb_documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_documentos (
    id uuid NOT NULL,
    content text NOT NULL,
    embedding public.vector(1536) NOT NULL,
    metadata json,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_email_logs (
    id_email_log uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    ds_destinatario character varying(255) NOT NULL,
    ds_assunto character varying(500) NOT NULL,
    tp_categoria public.tp_categoria_email DEFAULT 'transacional'::public.tp_categoria_email NOT NULL,
    tp_template character varying(100),
    st_envio character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    ds_erro text,
    ds_metadata jsonb,
    ds_smtp_message_id character varying(255),
    fg_aberto boolean DEFAULT false,
    dt_aberto timestamp without time zone,
    fg_clicado boolean DEFAULT false,
    dt_clicado timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_enviado timestamp without time zone,
    dt_tentativa_envio timestamp without time zone
);


--
-- Name: TABLE tb_email_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_email_logs IS 'UC095 - Histórico de emails enviados pelo sistema';


--
-- Name: COLUMN tb_email_logs.tp_categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_email_logs.tp_categoria IS 'Categoria do email: transacional, notificacao, marketing, operacional, lembrete, suporte';


--
-- Name: COLUMN tb_email_logs.tp_template; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_email_logs.tp_template IS 'Nome do template usado (ex: password_reset, welcome, invoice)';


--
-- Name: COLUMN tb_email_logs.st_envio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_email_logs.st_envio IS 'Status do envio: pendente, enviado, erro, rejeitado';


--
-- Name: COLUMN tb_email_logs.ds_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_email_logs.ds_metadata IS 'Dados adicionais do email (variáveis, contexto)';


--
-- Name: tb_empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_empresas (
    id_empresa uuid DEFAULT gen_random_uuid() NOT NULL,
    nm_empresa character varying(255) NOT NULL,
    nr_cnpj character varying(18) NOT NULL,
    ds_email character varying(255),
    nr_telefone character varying(20),
    ds_endereco text,
    nr_cep character varying(10),
    nm_cidade character varying(100),
    nm_estado character varying(2),
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    nm_razao_social character varying(255),
    nm_segmento character varying(100),
    nm_porte character varying(50) DEFAULT 'Pequeno'::character varying,
    nm_email_contato character varying(255),
    nm_endereco character varying(255),
    nm_pais character varying(100) DEFAULT 'Brasil'::character varying,
    dt_assinatura date,
    dt_vencimento date,
    nm_plano character varying(50) DEFAULT 'Free'::character varying,
    nr_limite_usuarios integer DEFAULT 5,
    nr_limite_agentes integer DEFAULT 2,
    nr_limite_document_stores integer DEFAULT 1,
    ds_config jsonb,
    ds_logo_url character varying(500),
    nm_cor_primaria character varying(7) DEFAULT '#6366f1'::character varying,
    st_ativo character varying(1) DEFAULT 'S'::character varying NOT NULL,
    qt_limite_usuarios integer DEFAULT 5 NOT NULL
);


--
-- Name: COLUMN tb_empresas.qt_limite_usuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_empresas.qt_limite_usuarios IS 'Limite de usuários permitidos para esta empresa conforme pacote de parceria contratado';


--
-- Name: tb_execucoes_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_execucoes_jobs (
    id_execucao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_job uuid,
    dt_inicio timestamp without time zone DEFAULT now(),
    dt_fim timestamp without time zone,
    nr_duracao_segundos integer,
    st_sucesso boolean,
    ds_resultado text,
    ds_erro text,
    ds_stack_trace text,
    ds_logs text,
    nr_registros_processados integer,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_execucoes_jobs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_execucoes_jobs IS 'Histórico de execuções de jobs';


--
-- Name: tb_export_agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_export_agendamentos (
    id_agendamento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_user_criador uuid NOT NULL,
    nm_agendamento character varying(255) NOT NULL,
    ds_descricao text,
    tp_relatorio character varying(50) NOT NULL,
    tp_formato character varying(20) NOT NULL,
    ds_filtros jsonb,
    tp_frequencia character varying(20) NOT NULL,
    nr_hora_execucao integer DEFAULT 8,
    nr_dia_execucao integer,
    fg_enviar_email boolean DEFAULT true NOT NULL,
    ds_emails_destinatarios jsonb,
    dt_ultima_execucao timestamp without time zone,
    dt_proxima_execucao timestamp without time zone,
    fg_ativo boolean DEFAULT true NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_export_agendamentos_nr_dia_execucao_check CHECK (((nr_dia_execucao >= 1) AND (nr_dia_execucao <= 31))),
    CONSTRAINT tb_export_agendamentos_nr_hora_execucao_check CHECK (((nr_hora_execucao >= 0) AND (nr_hora_execucao <= 23))),
    CONSTRAINT tb_export_agendamentos_tp_frequencia_check CHECK (((tp_frequencia)::text = ANY ((ARRAY['diario'::character varying, 'semanal'::character varying, 'mensal'::character varying, 'trimestral'::character varying])::text[])))
);


--
-- Name: TABLE tb_export_agendamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_export_agendamentos IS 'Agendamentos recorrentes de exportação';


--
-- Name: tb_export_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_export_jobs (
    id_export uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_user_solicitante uuid NOT NULL,
    tp_relatorio character varying(50) NOT NULL,
    ds_nome_relatorio character varying(255) NOT NULL,
    tp_formato character varying(20) NOT NULL,
    ds_filtros jsonb,
    st_export character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    ds_mensagem_erro text,
    ds_arquivo_path text,
    ds_arquivo_url text,
    nr_total_registros integer DEFAULT 0,
    nr_tamanho_bytes integer DEFAULT 0,
    dt_solicitacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_inicio_processamento timestamp without time zone,
    dt_fim_processamento timestamp without time zone,
    dt_expiracao timestamp without time zone,
    fg_agendado boolean DEFAULT false NOT NULL,
    id_agendamento uuid,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_export_jobs_st_export_check CHECK (((st_export)::text = ANY ((ARRAY['pendente'::character varying, 'processando'::character varying, 'concluido'::character varying, 'erro'::character varying])::text[]))),
    CONSTRAINT tb_export_jobs_tp_formato_check CHECK (((tp_formato)::text = ANY ((ARRAY['excel'::character varying, 'csv'::character varying, 'pdf'::character varying, 'json'::character varying])::text[])))
);


--
-- Name: TABLE tb_export_jobs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_export_jobs IS 'Jobs de exportação de relatórios';


--
-- Name: tb_faturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_faturas (
    id_fatura uuid DEFAULT gen_random_uuid() NOT NULL,
    nr_fatura character varying(20) NOT NULL,
    id_empresa uuid,
    id_paciente uuid,
    id_empresa_cliente uuid,
    vl_subtotal numeric(12,2) NOT NULL,
    vl_descontos numeric(12,2) DEFAULT 0,
    vl_impostos numeric(12,2) DEFAULT 0,
    vl_total numeric(12,2) NOT NULL,
    vl_pago numeric(12,2) DEFAULT 0,
    vl_saldo numeric(12,2) GENERATED ALWAYS AS ((vl_total - vl_pago)) STORED,
    ds_status character varying(50) DEFAULT 'rascunho'::character varying,
    dt_emissao date NOT NULL,
    dt_vencimento date NOT NULL,
    dt_pagamento timestamp without time zone,
    ds_observacoes text,
    ds_termos_condicoes text,
    ds_numero_nota_fiscal character varying(50),
    ds_chave_nfe character varying(44),
    ds_url_danfe text,
    dt_emissao_nf timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_cliente_fatura CHECK (((id_paciente IS NOT NULL) OR (id_empresa_cliente IS NOT NULL)))
);


--
-- Name: TABLE tb_faturas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_faturas IS 'Faturas emitidas para clientes';


--
-- Name: tb_favoritos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_favoritos (
    id_favorito uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    ds_tipo_item character varying(50) NOT NULL,
    id_profissional uuid,
    id_procedimento uuid,
    id_produto uuid,
    id_fornecedor uuid,
    id_clinica uuid,
    ds_categoria_favorito character varying(100),
    ds_observacoes text,
    nr_prioridade integer DEFAULT 0,
    st_notificar_promocao boolean DEFAULT true,
    st_notificar_disponibilidade boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    id_vaga uuid,
    CONSTRAINT chk_tipo_favorito CHECK (((((ds_tipo_item)::text = 'profissional'::text) AND (id_profissional IS NOT NULL) AND (id_procedimento IS NULL) AND (id_produto IS NULL) AND (id_fornecedor IS NULL) AND (id_clinica IS NULL) AND (id_vaga IS NULL)) OR (((ds_tipo_item)::text = 'procedimento'::text) AND (id_profissional IS NULL) AND (id_procedimento IS NOT NULL) AND (id_produto IS NULL) AND (id_fornecedor IS NULL) AND (id_clinica IS NULL) AND (id_vaga IS NULL)) OR (((ds_tipo_item)::text = 'produto'::text) AND (id_profissional IS NULL) AND (id_procedimento IS NULL) AND (id_produto IS NOT NULL) AND (id_fornecedor IS NULL) AND (id_clinica IS NULL) AND (id_vaga IS NULL)) OR (((ds_tipo_item)::text = 'fornecedor'::text) AND (id_profissional IS NULL) AND (id_procedimento IS NULL) AND (id_produto IS NULL) AND (id_fornecedor IS NOT NULL) AND (id_clinica IS NULL) AND (id_vaga IS NULL)) OR (((ds_tipo_item)::text = 'clinica'::text) AND (id_profissional IS NULL) AND (id_procedimento IS NULL) AND (id_produto IS NULL) AND (id_fornecedor IS NULL) AND (id_clinica IS NOT NULL) AND (id_vaga IS NULL)) OR (((ds_tipo_item)::text = 'vaga'::text) AND (id_profissional IS NULL) AND (id_procedimento IS NULL) AND (id_produto IS NULL) AND (id_fornecedor IS NULL) AND (id_clinica IS NULL) AND (id_vaga IS NOT NULL))))
);


--
-- Name: TABLE tb_favoritos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_favoritos IS 'Itens favoritados pelos usuários (profissionais, produtos, etc.)';


--
-- Name: COLUMN tb_favoritos.ds_tipo_item; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_favoritos.ds_tipo_item IS 'Tipo do item favoritado (produto, procedimento, profissional, etc)';


--
-- Name: COLUMN tb_favoritos.ds_categoria_favorito; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_favoritos.ds_categoria_favorito IS 'Categoria organizacional do favorito';


--
-- Name: tb_filas_atendimento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_filas_atendimento (
    id_fila uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    nm_fila character varying(100) NOT NULL,
    ds_descricao text,
    nm_cor character varying(7) DEFAULT '#3B82F6'::character varying,
    st_ativa boolean DEFAULT true NOT NULL,
    st_padrao boolean DEFAULT false NOT NULL,
    nr_sla_primeira_resposta integer DEFAULT 300,
    nr_sla_resposta integer DEFAULT 600,
    nr_sla_resolucao integer DEFAULT 86400,
    nm_modo_distribuicao character varying(30) DEFAULT 'round_robin'::character varying,
    nr_limite_simultaneo integer DEFAULT 5,
    ds_horario_funcionamento jsonb DEFAULT '{"sexta": {"fim": "18:00", "ativo": true, "inicio": "08:00"}, "terca": {"fim": "18:00", "ativo": true, "inicio": "08:00"}, "quarta": {"fim": "18:00", "ativo": true, "inicio": "08:00"}, "quinta": {"fim": "18:00", "ativo": true, "inicio": "08:00"}, "sabado": {"fim": "12:00", "ativo": false, "inicio": "08:00"}, "domingo": {"ativo": false}, "segunda": {"fim": "18:00", "ativo": true, "inicio": "08:00"}}'::jsonb,
    ds_mensagem_boas_vindas text,
    ds_mensagem_fora_horario text,
    ds_mensagem_aguardando text DEFAULT 'Aguarde um momento, em breve um atendente irá lhe ajudar.'::text,
    ds_regras_roteamento jsonb DEFAULT '[]'::jsonb,
    ds_atendentes uuid[] DEFAULT '{}'::uuid[],
    nr_atendimentos_hoje integer DEFAULT 0,
    nr_aguardando integer DEFAULT 0,
    nr_tempo_espera_medio integer DEFAULT 0,
    nr_tempo_atendimento_medio integer DEFAULT 0,
    nr_prioridade integer DEFAULT 0,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_filas_atendimento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_filas_atendimento IS 'Filas de atendimento humano com SLA e distribuição inteligente';


--
-- Name: COLUMN tb_filas_atendimento.nm_modo_distribuicao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_filas_atendimento.nm_modo_distribuicao IS 'Modo de distribuição: round_robin, menos_ocupado, skill_based';


--
-- Name: tb_fornecedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_fornecedores (
    id_fornecedor uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    nm_empresa character varying(255) NOT NULL,
    ds_razao_social character varying(255),
    nr_cnpj character varying(18) NOT NULL,
    nr_inscricao_estadual character varying(20),
    ds_descricao text,
    ds_site character varying(255),
    ds_email character varying(255),
    nr_telefone character varying(20),
    nr_whatsapp character varying(20),
    ds_endereco character varying(255),
    nr_numero character varying(20),
    ds_complemento character varying(100),
    nm_bairro character varying(100),
    nm_cidade character varying(100),
    nm_estado character varying(2),
    nr_cep character varying(10),
    ds_banco character varying(100),
    ds_agencia character varying(20),
    ds_conta character varying(20),
    ds_tipo_conta character varying(20),
    ds_pix character varying(255),
    ds_categorias_produtos text[],
    nr_tempo_entrega_dias integer DEFAULT 7,
    vl_frete_minimo numeric(10,2) DEFAULT 0,
    vl_pedido_minimo numeric(10,2),
    ds_logo_url text,
    ds_banner_url text,
    ds_fotos text[],
    st_ativo boolean DEFAULT true,
    st_verificado boolean DEFAULT false,
    nr_avaliacao_media numeric(3,2) DEFAULT 0.0,
    nr_total_avaliacoes integer DEFAULT 0,
    nr_total_vendas integer DEFAULT 0,
    vl_total_vendido numeric(12,2) DEFAULT 0,
    dt_primeira_venda timestamp without time zone,
    dt_ultima_venda timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    nm_tipo character varying(50) DEFAULT 'Fornecedor'::character varying,
    ds_segmentos jsonb DEFAULT '[]'::jsonb,
    ds_catalogo_url character varying(500),
    nr_prazo_entrega_dias integer DEFAULT 30,
    ds_config jsonb DEFAULT '{}'::jsonb
);


--
-- Name: TABLE tb_fornecedores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_fornecedores IS 'Cadastro de fornecedores de produtos de estética';


--
-- Name: tb_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_fotos (
    id_foto uuid DEFAULT gen_random_uuid() NOT NULL,
    id_album uuid,
    id_user uuid,
    ds_url text NOT NULL,
    ds_thumbnail_url text,
    ds_url_original text,
    nm_arquivo character varying(500),
    ds_tipo_mime character varying(100) DEFAULT 'image/jpeg'::character varying,
    nr_tamanho_bytes bigint,
    nr_largura integer,
    nr_altura integer,
    ds_titulo character varying(255),
    ds_legenda text,
    ds_tags text[],
    ds_tipo_foto character varying(50),
    id_agendamento uuid,
    id_procedimento uuid,
    id_produto uuid,
    id_foto_relacionada uuid,
    dt_foto_tirada timestamp without time zone,
    ds_exif jsonb,
    st_processada boolean DEFAULT false,
    st_aprovada boolean DEFAULT false,
    ds_motivo_rejeicao text,
    ds_visibilidade character varying(20) DEFAULT 'privado'::character varying,
    nr_visualizacoes integer DEFAULT 0,
    nr_curtidas integer DEFAULT 0,
    nr_ordem integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_fotos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_fotos IS 'Fotos armazenadas nos álbuns';


--
-- Name: tb_historico_configuracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_historico_configuracoes (
    id_historico uuid DEFAULT gen_random_uuid() NOT NULL,
    id_configuracao uuid,
    id_user uuid,
    ds_valor_anterior text,
    ds_valor_novo text,
    ds_ip character varying(45),
    ds_origem character varying(50),
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_historico_configuracoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_historico_configuracoes IS 'Histórico de mudanças nas configurações';


--
-- Name: tb_instalacoes_marketplace; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_instalacoes_marketplace (
    id_instalacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_marketplace_agente uuid NOT NULL,
    id_agente_instalado uuid NOT NULL,
    id_empresa uuid NOT NULL,
    id_usuario_instalador uuid NOT NULL,
    st_ativo boolean DEFAULT true,
    dt_instalacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE tb_instalacoes_marketplace; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_instalacoes_marketplace IS 'Registro de instalações de agentes do marketplace por empresas';


--
-- Name: tb_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_invoices (
    id_invoice uuid NOT NULL,
    id_subscription uuid NOT NULL,
    id_user uuid NOT NULL,
    nm_stripe_invoice_id character varying(255),
    nm_invoice_number character varying(100),
    nm_status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    vl_subtotal numeric(10,2) NOT NULL,
    vl_tax numeric(10,2) DEFAULT 0.00,
    vl_discount numeric(10,2) DEFAULT 0.00,
    vl_total numeric(10,2) NOT NULL,
    vl_amount_paid numeric(10,2) DEFAULT 0.00,
    vl_amount_due numeric(10,2) NOT NULL,
    nm_currency character varying(3) DEFAULT 'BRL'::character varying NOT NULL,
    dt_period_start timestamp without time zone NOT NULL,
    dt_period_end timestamp without time zone NOT NULL,
    dt_due_date timestamp without time zone,
    dt_paid_at timestamp without time zone,
    dt_finalized_at timestamp without time zone,
    dt_voided_at timestamp without time zone,
    ds_description character varying,
    ds_items jsonb,
    ds_metadata jsonb,
    ds_invoice_pdf_url character varying,
    ds_hosted_invoice_url character varying,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: tb_itens_fatura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_itens_fatura (
    id_item uuid DEFAULT gen_random_uuid() NOT NULL,
    id_fatura uuid,
    id_agendamento uuid,
    id_produto uuid,
    ds_descricao character varying(500) NOT NULL,
    qt_quantidade numeric(10,2) DEFAULT 1,
    vl_unitario numeric(12,2) NOT NULL,
    vl_desconto numeric(12,2) DEFAULT 0,
    vl_total numeric(12,2) NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now(),
    CONSTRAINT tb_itens_fatura_qt_quantidade_check CHECK ((qt_quantidade > (0)::numeric))
);


--
-- Name: TABLE tb_itens_fatura; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_itens_fatura IS 'Itens/serviços incluídos nas faturas';


--
-- Name: tb_itens_lista_desejos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_itens_lista_desejos (
    id_item uuid DEFAULT gen_random_uuid() NOT NULL,
    id_lista uuid,
    id_produto uuid,
    id_procedimento uuid,
    qt_quantidade integer DEFAULT 1,
    nr_prioridade integer DEFAULT 0,
    ds_observacoes text,
    st_adquirido boolean DEFAULT false,
    dt_adquirido timestamp without time zone,
    nr_ordem integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_item_lista_desejo CHECK ((((id_produto IS NOT NULL) AND (id_procedimento IS NULL)) OR ((id_produto IS NULL) AND (id_procedimento IS NOT NULL))))
);


--
-- Name: TABLE tb_itens_lista_desejos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_itens_lista_desejos IS 'Itens das listas de desejos';


--
-- Name: tb_itens_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_itens_pedido (
    id_item uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pedido uuid,
    id_produto uuid,
    id_variacao uuid,
    nm_produto character varying(255) NOT NULL,
    ds_produto text,
    ds_sku character varying(100),
    ds_variacao character varying(100),
    ds_imagem_url text,
    qt_quantidade integer NOT NULL,
    vl_unitario numeric(10,2) NOT NULL,
    vl_desconto_item numeric(10,2) DEFAULT 0,
    vl_total numeric(10,2) NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now(),
    CONSTRAINT tb_itens_pedido_qt_quantidade_check CHECK ((qt_quantidade > 0))
);


--
-- Name: TABLE tb_itens_pedido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_itens_pedido IS 'Itens dos pedidos (produtos comprados)';


--
-- Name: tb_itens_repasse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_itens_repasse (
    id_item uuid DEFAULT gen_random_uuid() NOT NULL,
    id_repasse uuid,
    id_transacao uuid,
    id_agendamento uuid,
    id_pedido uuid,
    ds_descricao character varying(500) NOT NULL,
    vl_valor numeric(12,2) NOT NULL,
    nr_percentual_comissao numeric(5,2),
    vl_comissao numeric(12,2) NOT NULL,
    dt_referencia date,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_itens_repasse; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_itens_repasse IS 'Detalhamento dos itens que compõem os repasses';


--
-- Name: tb_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_jobs (
    id_job uuid DEFAULT gen_random_uuid() NOT NULL,
    nm_job character varying(255) NOT NULL,
    ds_tipo character varying(100) NOT NULL,
    ds_cron character varying(100),
    dt_proxima_execucao timestamp without time zone,
    ds_parametros jsonb,
    nr_timeout_segundos integer DEFAULT 300,
    nr_max_tentativas integer DEFAULT 3,
    st_ativo boolean DEFAULT true,
    st_executando boolean DEFAULT false,
    nr_total_execucoes integer DEFAULT 0,
    nr_execucoes_sucesso integer DEFAULT 0,
    nr_execucoes_falha integer DEFAULT 0,
    dt_ultima_execucao timestamp without time zone,
    dt_ultima_execucao_sucesso timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_jobs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_jobs IS 'Tarefas agendadas e jobs do sistema';


--
-- Name: tb_lead_score_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_lead_score_historico (
    id_historico uuid DEFAULT gen_random_uuid() NOT NULL,
    id_score uuid NOT NULL,
    id_contato uuid NOT NULL,
    nr_score_total integer NOT NULL,
    nr_score_comportamento integer DEFAULT 0,
    nr_score_perfil integer DEFAULT 0,
    nr_score_engajamento integer DEFAULT 0,
    nr_score_intencao integer DEFAULT 0,
    nr_temperatura integer DEFAULT 0,
    nm_evento character varying(100),
    ds_detalhes jsonb DEFAULT '{}'::jsonb,
    dt_registro timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_lead_score_historico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_lead_score_historico IS 'Histórico de alterações de lead score para análise de tendência';


--
-- Name: tb_lead_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_lead_scores (
    id_score uuid DEFAULT gen_random_uuid() NOT NULL,
    id_contato uuid NOT NULL,
    id_empresa uuid NOT NULL,
    nr_score_total integer DEFAULT 0 NOT NULL,
    nr_score_comportamento integer DEFAULT 0,
    nr_score_perfil integer DEFAULT 0,
    nr_score_engajamento integer DEFAULT 0,
    nr_score_intencao integer DEFAULT 0,
    nr_temperatura integer DEFAULT 0,
    ds_pesos jsonb DEFAULT '{"perfil": 0.20, "intencao": 0.25, "engajamento": 0.30, "comportamento": 0.25}'::jsonb,
    ds_fatores jsonb DEFAULT '{}'::jsonb,
    ds_recomendacoes jsonb DEFAULT '[]'::jsonb,
    nm_classificacao character varying(20) DEFAULT 'frio'::character varying,
    st_qualificado boolean DEFAULT false,
    st_prioridade_alta boolean DEFAULT false,
    dt_calculo timestamp with time zone DEFAULT now() NOT NULL,
    dt_proximo_calculo timestamp with time zone,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_lead_scores_nr_score_comportamento_check CHECK (((nr_score_comportamento >= 0) AND (nr_score_comportamento <= 100))),
    CONSTRAINT tb_lead_scores_nr_score_engajamento_check CHECK (((nr_score_engajamento >= 0) AND (nr_score_engajamento <= 100))),
    CONSTRAINT tb_lead_scores_nr_score_intencao_check CHECK (((nr_score_intencao >= 0) AND (nr_score_intencao <= 100))),
    CONSTRAINT tb_lead_scores_nr_score_perfil_check CHECK (((nr_score_perfil >= 0) AND (nr_score_perfil <= 100))),
    CONSTRAINT tb_lead_scores_nr_score_total_check CHECK (((nr_score_total >= 0) AND (nr_score_total <= 100))),
    CONSTRAINT tb_lead_scores_nr_temperatura_check CHECK (((nr_temperatura >= 0) AND (nr_temperatura <= 100)))
);


--
-- Name: TABLE tb_lead_scores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_lead_scores IS 'Lead scoring com IA para priorização de contatos';


--
-- Name: COLUMN tb_lead_scores.nm_classificacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_lead_scores.nm_classificacao IS 'Classificação automática: frio, morno, quente';


--
-- Name: tb_leitura_mensagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_leitura_mensagens (
    id_leitura uuid DEFAULT gen_random_uuid() NOT NULL,
    id_mensagem uuid,
    id_user uuid,
    dt_leitura timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_leitura_mensagens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_leitura_mensagens IS 'Rastreamento de leitura de mensagens por usuário';


--
-- Name: tb_lembretes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_lembretes (
    id_lembrete uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    nm_titulo character varying(255) NOT NULL,
    ds_descricao text,
    dt_lembrete timestamp without time zone NOT NULL,
    st_recorrente boolean DEFAULT false,
    ds_frequencia character varying(20),
    nr_dias_antecedencia integer,
    id_agendamento uuid,
    id_tarefa uuid,
    st_enviado boolean DEFAULT false,
    dt_enviado timestamp without time zone,
    st_concluido boolean DEFAULT false,
    dt_concluido timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_lembretes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_lembretes IS 'Lembretes automáticos de agendamentos enviados por múltiplos canais';


--
-- Name: COLUMN tb_lembretes.id_lembrete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_lembretes.id_lembrete IS 'ID único do lembrete';


--
-- Name: COLUMN tb_lembretes.id_agendamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_lembretes.id_agendamento IS 'Agendamento relacionado';


--
-- Name: COLUMN tb_lembretes.dt_enviado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_lembretes.dt_enviado IS 'Data/hora real do envio (quando foi processado)';


--
-- Name: tb_listas_desejos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_listas_desejos (
    id_lista uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    nm_lista character varying(255) NOT NULL,
    ds_descricao text,
    ds_tipo character varying(50) DEFAULT 'geral'::character varying,
    st_publica boolean DEFAULT false,
    ds_token_compartilhamento character varying(100),
    st_ativa boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_listas_desejos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_listas_desejos IS 'Listas de desejos de produtos e procedimentos';


--
-- Name: tb_logs_acesso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_logs_acesso (
    id_log uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    ds_metodo character varying(10) NOT NULL,
    ds_endpoint character varying(500) NOT NULL,
    ds_parametros_query jsonb,
    ds_body jsonb,
    nr_status_code integer NOT NULL,
    nr_tempo_resposta_ms integer,
    nr_tamanho_resposta_bytes bigint,
    ds_ip character varying(45) NOT NULL,
    ds_user_agent text,
    ds_referer text,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_logs_acesso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_logs_acesso IS 'Logs de acesso HTTP/API';


--
-- Name: tb_logs_erro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_logs_erro (
    id_log uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    ds_nivel character varying(20) NOT NULL,
    ds_mensagem text NOT NULL,
    ds_stack_trace text,
    ds_tipo_erro character varying(255),
    ds_endpoint character varying(500),
    ds_metodo character varying(10),
    ds_parametros jsonb,
    ds_resposta jsonb,
    ds_ip character varying(45),
    ds_user_agent text,
    ds_referer text,
    ds_hostname character varying(255),
    ds_processo character varying(100),
    ds_versao_app character varying(50),
    st_resolvido boolean DEFAULT false,
    dt_resolvido timestamp without time zone,
    id_user_resolveu uuid,
    ds_solucao text,
    ds_hash_erro character varying(64),
    nr_ocorrencias integer DEFAULT 1,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_logs_erro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_logs_erro IS 'Logs de erros e exceções do sistema';


--
-- Name: tb_logs_integracao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_logs_integracao (
    id_log uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    ds_servico character varying(100) NOT NULL,
    ds_tipo character varying(50) NOT NULL,
    ds_acao character varying(100),
    ds_endpoint_externo text,
    ds_metodo character varying(10),
    ds_headers jsonb,
    ds_payload jsonb,
    nr_status_code integer,
    ds_resposta jsonb,
    ds_erro text,
    st_sucesso boolean NOT NULL,
    nr_tempo_resposta_ms integer,
    nr_tentativas integer DEFAULT 1,
    id_notificacao uuid,
    id_transacao uuid,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_logs_integracao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_logs_integracao IS 'Logs de integrações externas (WhatsApp, Email, Pagamentos)';


--
-- Name: tb_marketplace_agentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_marketplace_agentes (
    id_marketplace_agente uuid DEFAULT gen_random_uuid() NOT NULL,
    id_agente uuid NOT NULL,
    id_empresa_publicador uuid,
    nm_categoria character varying(100),
    ds_tags text[],
    ds_descricao_longa text,
    nr_instalacoes integer DEFAULT 0,
    nr_avaliacoes integer DEFAULT 0,
    nr_media_estrelas numeric(3,2) DEFAULT 0.00,
    st_ativo boolean DEFAULT true,
    st_destacado boolean DEFAULT false,
    dt_publicacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_media_estrelas CHECK (((nr_media_estrelas >= (0)::numeric) AND (nr_media_estrelas <= (5)::numeric)))
);


--
-- Name: TABLE tb_marketplace_agentes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_marketplace_agentes IS 'Agentes públicos disponíveis no marketplace para instalação';


--
-- Name: COLUMN tb_marketplace_agentes.st_destacado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_marketplace_agentes.st_destacado IS 'Indica se o agente aparece em destaque na página principal';


--
-- Name: tb_mensagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_mensagens (
    id_mensagem uuid DEFAULT gen_random_uuid() NOT NULL,
    id_conversa uuid NOT NULL,
    nm_papel character varying(20) NOT NULL,
    ds_conteudo text NOT NULL,
    ds_metadata jsonb DEFAULT '{}'::jsonb,
    nr_tokens integer,
    vl_custo numeric(10,6),
    vl_temperatura numeric(3,2),
    nm_modelo character varying(100),
    st_editada boolean DEFAULT false,
    st_regenerada boolean DEFAULT false,
    st_deletada boolean DEFAULT false,
    st_streaming boolean DEFAULT false,
    id_mensagem_original uuid,
    id_mensagem_pai uuid,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    dt_deletada timestamp without time zone,
    CONSTRAINT tb_mensagens_nm_papel_check CHECK (((nm_papel)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying, 'function'::character varying])::text[])))
);


--
-- Name: TABLE tb_mensagens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_mensagens IS 'Armazena mensagens individuais de cada conversa';


--
-- Name: COLUMN tb_mensagens.nm_papel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_mensagens.nm_papel IS 'Papel da mensagem: user, assistant, system ou function';


--
-- Name: COLUMN tb_mensagens.ds_conteudo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_mensagens.ds_conteudo IS 'Conteúdo da mensagem (suporta Markdown)';


--
-- Name: COLUMN tb_mensagens.nr_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_mensagens.nr_tokens IS 'Número de tokens consumidos pela mensagem';


--
-- Name: COLUMN tb_mensagens.st_regenerada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_mensagens.st_regenerada IS 'Se a mensagem foi regenerada';


--
-- Name: COLUMN tb_mensagens.id_mensagem_original; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_mensagens.id_mensagem_original IS 'Referência à mensagem original se foi editada';


--
-- Name: tb_mensagens_agendadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_mensagens_agendadas (
    id_mensagem_agendada uuid DEFAULT gen_random_uuid() NOT NULL,
    id_conversa uuid,
    id_remetente uuid,
    ds_conteudo text NOT NULL,
    ds_arquivos_url text[],
    dt_envio_programado timestamp without time zone NOT NULL,
    st_enviada boolean DEFAULT false,
    dt_enviada timestamp without time zone,
    id_mensagem_criada uuid,
    st_cancelada boolean DEFAULT false,
    dt_cancelada timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_mensagens_agendadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_mensagens_agendadas IS 'Mensagens programadas para envio futuro';


--
-- Name: tb_mensagens_omni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_mensagens_omni (
    id_mensagem uuid DEFAULT gen_random_uuid() NOT NULL,
    id_conversa uuid NOT NULL,
    id_externo character varying(255),
    st_entrada boolean DEFAULT true NOT NULL,
    nm_remetente character varying(100),
    tp_mensagem public.tp_mensagem_omni_enum DEFAULT 'texto'::public.tp_mensagem_omni_enum NOT NULL,
    ds_conteudo text NOT NULL,
    ds_conteudo_original text,
    ds_url_midia character varying(500),
    nm_tipo_midia character varying(100),
    nr_tamanho_midia integer,
    ds_transcricao text,
    st_mensagem public.st_mensagem_omni_enum DEFAULT 'pendente'::public.st_mensagem_omni_enum NOT NULL,
    st_lida boolean DEFAULT false NOT NULL,
    ds_metadata jsonb DEFAULT '{}'::jsonb,
    ds_erro text,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_envio timestamp with time zone,
    dt_entrega timestamp with time zone,
    dt_leitura timestamp with time zone
);


--
-- Name: TABLE tb_mensagens_omni; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_mensagens_omni IS 'Mensagens de conversas omnichannel com suporte a múltiplos tipos';


--
-- Name: tb_mensagens_usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_mensagens_usuarios (
    id_mensagem uuid DEFAULT gen_random_uuid() NOT NULL,
    id_conversa uuid,
    id_remetente uuid,
    id_mensagem_pai uuid,
    ds_tipo_mensagem character varying(20) DEFAULT 'texto'::character varying,
    ds_conteudo text NOT NULL,
    ds_arquivos_url text[],
    ds_metadados jsonb,
    id_agendamento uuid,
    id_produto uuid,
    id_procedimento uuid,
    st_editada boolean DEFAULT false,
    st_deletada boolean DEFAULT false,
    dt_editada timestamp without time zone,
    dt_deletada timestamp without time zone,
    st_enviada boolean DEFAULT true,
    st_entregue boolean DEFAULT false,
    st_lida boolean DEFAULT false,
    dt_entregue timestamp without time zone,
    dt_lida timestamp without time zone,
    ds_reacoes jsonb,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_mensagens_usuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_mensagens_usuarios IS 'Mensagens trocadas nas conversas';


--
-- Name: tb_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_messages (
    id_message uuid DEFAULT gen_random_uuid() NOT NULL,
    id_conversa uuid,
    id_user uuid,
    ds_role character varying(50) NOT NULL,
    ds_content text NOT NULL,
    ds_metadata jsonb DEFAULT '{}'::jsonb,
    nr_tokens_prompt integer,
    nr_tokens_completion integer,
    vl_custo numeric(10,6),
    dt_criacao timestamp without time zone DEFAULT now(),
    id_agente uuid,
    nm_modelo character varying(100),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    vl_temperatura numeric(3,2),
    st_deletada boolean DEFAULT false
);


--
-- Name: TABLE tb_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_messages IS 'Mensagens das conversas entre usuários e agentes';


--
-- Name: COLUMN tb_messages.id_conversa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.id_conversa IS 'ID da conversa (FK)';


--
-- Name: COLUMN tb_messages.ds_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.ds_metadata IS 'Metadados extras em JSON (tools usadas, etc)';


--
-- Name: COLUMN tb_messages.vl_custo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.vl_custo IS 'Custo estimado em USD';


--
-- Name: COLUMN tb_messages.id_agente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.id_agente IS 'FK para tb_agentes - identifica qual agente gerou a mensagem';


--
-- Name: COLUMN tb_messages.nm_modelo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.nm_modelo IS 'Nome do modelo LLM usado (ex: gpt-4, gpt-3.5-turbo)';


--
-- Name: COLUMN tb_messages.dt_atualizacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.dt_atualizacao IS 'Timestamp de última atualização da mensagem';


--
-- Name: COLUMN tb_messages.vl_temperatura; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.vl_temperatura IS 'Temperatura usada na geração (0.0 a 2.0)';


--
-- Name: COLUMN tb_messages.st_deletada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_messages.st_deletada IS 'Indica se a mensagem foi soft deleted';


--
-- Name: tb_movimentacoes_estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_movimentacoes_estoque (
    id_movimentacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_produto uuid NOT NULL,
    id_user uuid,
    id_agendamento uuid,
    id_pedido uuid,
    tp_movimentacao character varying(20) NOT NULL,
    nr_quantidade integer NOT NULL,
    nr_estoque_anterior integer NOT NULL,
    nr_estoque_atual integer NOT NULL,
    vl_custo_unitario numeric(10,2),
    ds_motivo text,
    ds_lote character varying(50),
    dt_validade timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_estoque_nao_negativo CHECK ((nr_estoque_atual >= 0)),
    CONSTRAINT tb_movimentacoes_estoque_nr_quantidade_check CHECK ((nr_quantidade > 0)),
    CONSTRAINT tb_movimentacoes_estoque_tp_movimentacao_check CHECK (((tp_movimentacao)::text = ANY ((ARRAY['entrada'::character varying, 'saida'::character varying, 'ajuste'::character varying, 'reserva'::character varying, 'devolucao'::character varying])::text[])))
);


--
-- Name: TABLE tb_movimentacoes_estoque; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_movimentacoes_estoque IS 'Movimentações de estoque (entrada, saída, ajuste, etc)';


--
-- Name: COLUMN tb_movimentacoes_estoque.tp_movimentacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_movimentacoes_estoque.tp_movimentacao IS 'entrada | saida | ajuste | reserva | devolucao';


--
-- Name: COLUMN tb_movimentacoes_estoque.nr_estoque_anterior; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_movimentacoes_estoque.nr_estoque_anterior IS 'Estoque antes da movimentação';


--
-- Name: COLUMN tb_movimentacoes_estoque.nr_estoque_atual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_movimentacoes_estoque.nr_estoque_atual IS 'Estoque após a movimentação';


--
-- Name: COLUMN tb_movimentacoes_estoque.ds_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_movimentacoes_estoque.ds_lote IS 'Número do lote do produto';


--
-- Name: COLUMN tb_movimentacoes_estoque.dt_validade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_movimentacoes_estoque.dt_validade IS 'Data de validade do lote';


--
-- Name: tb_notas_fiscais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_notas_fiscais (
    id_nota_fiscal uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_pedido uuid,
    id_fatura uuid,
    tp_nota character varying(10) DEFAULT 'nfse'::character varying NOT NULL,
    nr_nota character varying(50),
    ds_serie character varying(10),
    nr_rps character varying(50) NOT NULL,
    st_nota character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    ds_status_mensagem text,
    vl_servicos numeric(10,2) NOT NULL,
    vl_deducoes numeric(10,2) DEFAULT 0,
    vl_pis numeric(10,2) DEFAULT 0,
    vl_cofins numeric(10,2) DEFAULT 0,
    vl_inss numeric(10,2) DEFAULT 0,
    vl_ir numeric(10,2) DEFAULT 0,
    vl_csll numeric(10,2) DEFAULT 0,
    vl_iss numeric(10,2) DEFAULT 0,
    vl_desconto_condicionado numeric(10,2) DEFAULT 0,
    vl_desconto_incondicionado numeric(10,2) DEFAULT 0,
    vl_outras_retencoes numeric(10,2) DEFAULT 0,
    vl_total_tributos numeric(10,2) DEFAULT 0,
    vl_liquido numeric(10,2) NOT NULL,
    pc_aliquota_iss numeric(5,2) DEFAULT 5.00,
    ds_tomador_cnpj_cpf character varying(14) NOT NULL,
    ds_tomador_razao_social character varying(255) NOT NULL,
    ds_tomador_email character varying(255),
    ds_tomador_endereco jsonb,
    ds_prestador_cnpj character varying(14) NOT NULL,
    ds_prestador_razao_social character varying(255) NOT NULL,
    ds_prestador_inscricao_municipal character varying(50),
    ds_prestador_endereco jsonb,
    ds_discriminacao text NOT NULL,
    ds_codigo_servico character varying(10),
    ds_item_lista_servico character varying(10),
    ds_codigo_tributacao_municipio character varying(20),
    ds_provedor_nfe character varying(50),
    ds_ref_externa character varying(100),
    ds_chave_acesso character varying(44),
    ds_codigo_verificacao character varying(20),
    ds_url_nfe text,
    ds_url_pdf text,
    ds_xml_rps text,
    ds_xml_nfe text,
    ds_dados_completos jsonb,
    fg_cancelada boolean DEFAULT false,
    dt_cancelamento timestamp without time zone,
    ds_motivo_cancelamento text,
    dt_emissao timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_cnpj_cpf_length CHECK ((char_length((ds_tomador_cnpj_cpf)::text) = ANY (ARRAY[11, 14]))),
    CONSTRAINT chk_vl_positivos CHECK (((vl_servicos >= (0)::numeric) AND (vl_liquido >= (0)::numeric))),
    CONSTRAINT tb_notas_fiscais_st_nota_check CHECK (((st_nota)::text = ANY ((ARRAY['pendente'::character varying, 'processando'::character varying, 'emitida'::character varying, 'cancelada'::character varying, 'erro'::character varying])::text[]))),
    CONSTRAINT tb_notas_fiscais_tp_nota_check CHECK (((tp_nota)::text = ANY ((ARRAY['nfse'::character varying, 'nfe'::character varying, 'nfce'::character varying])::text[])))
);


--
-- Name: TABLE tb_notas_fiscais; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_notas_fiscais IS 'Notas fiscais eletrônicas emitidas (NFSe, NFe, NFCe)';


--
-- Name: COLUMN tb_notas_fiscais.tp_nota; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_notas_fiscais.tp_nota IS 'nfse | nfe | nfce';


--
-- Name: COLUMN tb_notas_fiscais.nr_rps; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_notas_fiscais.nr_rps IS 'RPS - Recibo Provisório de Serviços (antes da emissão)';


--
-- Name: COLUMN tb_notas_fiscais.st_nota; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_notas_fiscais.st_nota IS 'pendente | processando | emitida | cancelada | erro';


--
-- Name: COLUMN tb_notas_fiscais.pc_aliquota_iss; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_notas_fiscais.pc_aliquota_iss IS 'Alíquota do ISS em % (varia por município)';


--
-- Name: COLUMN tb_notas_fiscais.ds_discriminacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_notas_fiscais.ds_discriminacao IS 'Descrição detalhada dos serviços prestados';


--
-- Name: COLUMN tb_notas_fiscais.ds_provedor_nfe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_notas_fiscais.ds_provedor_nfe IS 'Serviço de NFe: focus_nfe | enotas | nfse_nacional';


--
-- Name: COLUMN tb_notas_fiscais.ds_chave_acesso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_notas_fiscais.ds_chave_acesso IS 'Chave de acesso de 44 dígitos da NFe';


--
-- Name: tb_notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_notificacoes (
    id_notificacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_empresa uuid,
    ds_tipo character varying(50) NOT NULL,
    ds_categoria character varying(50),
    nm_titulo character varying(255) NOT NULL,
    ds_conteudo text NOT NULL,
    ds_dados_adicionais jsonb,
    ds_prioridade character varying(20) DEFAULT 'normal'::character varying,
    st_push boolean DEFAULT true,
    st_email boolean DEFAULT false,
    st_sms boolean DEFAULT false,
    st_whatsapp boolean DEFAULT false,
    st_push_enviado boolean DEFAULT false,
    st_email_enviado boolean DEFAULT false,
    st_sms_enviado boolean DEFAULT false,
    st_whatsapp_enviado boolean DEFAULT false,
    dt_push_enviado timestamp without time zone,
    dt_email_enviado timestamp without time zone,
    dt_sms_enviado timestamp without time zone,
    dt_whatsapp_enviado timestamp without time zone,
    st_lida boolean DEFAULT false,
    dt_lida timestamp without time zone,
    ds_acao character varying(50),
    ds_url text,
    ds_url_deep_link text,
    id_agendamento uuid,
    id_pedido uuid,
    id_mensagem uuid,
    id_conversa uuid,
    dt_envio_programado timestamp without time zone,
    st_enviada boolean DEFAULT false,
    dt_expiracao timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public.tb_notificacoes FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_notificacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_notificacoes IS 'Notificações multi-canal para usuários (push, email, SMS, WhatsApp)';


--
-- Name: tb_onboarding_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_onboarding_events (
    id_event uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid NOT NULL,
    id_progress uuid NOT NULL,
    nm_event_type character varying(100) NOT NULL,
    nm_step_type character varying(100),
    ds_event_data jsonb,
    dt_event timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_event_type CHECK (((nm_event_type)::text <> ''::text))
);


--
-- Name: TABLE tb_onboarding_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_onboarding_events IS 'Eventos de onboarding para tracking e analytics';


--
-- Name: COLUMN tb_onboarding_events.nm_event_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_onboarding_events.nm_event_type IS 'Tipo de evento (flow_started, step_completed, etc.)';


--
-- Name: COLUMN tb_onboarding_events.nm_step_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_onboarding_events.nm_step_type IS 'Step relacionado ao evento (opcional)';


--
-- Name: tb_onboarding_flows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_onboarding_flows (
    id_flow uuid DEFAULT gen_random_uuid() NOT NULL,
    nm_flow character varying(100) NOT NULL,
    ds_flow text,
    nm_target_type character varying(50) DEFAULT 'all_users'::character varying NOT NULL,
    nr_order integer DEFAULT 0 NOT NULL,
    bl_ativo boolean DEFAULT true NOT NULL,
    ds_steps jsonb NOT NULL,
    ds_config jsonb,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_flow_name CHECK (((nm_flow)::text <> ''::text)),
    CONSTRAINT chk_steps_not_empty CHECK ((jsonb_array_length(ds_steps) > 0))
);


--
-- Name: TABLE tb_onboarding_flows; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_onboarding_flows IS 'Flows de onboarding configuráveis com steps customizados';


--
-- Name: COLUMN tb_onboarding_flows.nm_target_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_onboarding_flows.nm_target_type IS 'Tipo de usuário alvo (all_users, free_users, etc.)';


--
-- Name: COLUMN tb_onboarding_flows.ds_steps; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_onboarding_flows.ds_steps IS 'Array JSON de steps do flow com configurações';


--
-- Name: COLUMN tb_onboarding_flows.ds_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_onboarding_flows.ds_config IS 'Configurações do flow (skip, progress bar, etc.)';


--
-- Name: tb_pacientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_pacientes (
    id_paciente uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_clinica uuid,
    nm_paciente character varying(255) NOT NULL,
    dt_nascimento date,
    nr_cpf character varying(14),
    nr_rg character varying(20),
    nm_genero character varying(20),
    ds_email character varying(255),
    nr_telefone character varying(20),
    nr_whatsapp character varying(20),
    ds_endereco character varying(255),
    nr_numero character varying(20),
    ds_complemento character varying(100),
    nm_bairro character varying(100),
    nm_cidade character varying(100),
    nm_estado character varying(2),
    nr_cep character varying(10),
    ds_tipo_sanguineo character varying(5),
    ds_alergias text,
    ds_medicamentos_uso text,
    ds_condicoes_medicas text,
    ds_cirurgias_previas text,
    ds_observacoes text,
    st_possui_convenio boolean DEFAULT false,
    nm_convenio character varying(100),
    nr_carteirinha character varying(50),
    ds_foto text,
    st_ativo boolean DEFAULT true,
    dt_primeira_consulta timestamp without time zone,
    dt_ultima_consulta timestamp without time zone,
    nr_total_consultas integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    id_profissional uuid
);

ALTER TABLE ONLY public.tb_pacientes FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_pacientes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_pacientes IS 'Cadastro de pacientes/clientes';


--
-- Name: tb_pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_pagamentos (
    id_pagamento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_user uuid,
    ds_gateway character varying(50) NOT NULL,
    ds_tipo_pagamento character varying(50) NOT NULL,
    ds_external_id character varying(255) NOT NULL,
    ds_session_id character varying(255),
    ds_payment_method character varying(50),
    vl_amount numeric(10,2) NOT NULL,
    ds_currency character varying(3) DEFAULT 'BRL'::character varying,
    vl_fee numeric(10,2),
    vl_net numeric(10,2),
    ds_status character varying(50) NOT NULL,
    ds_status_detail text,
    ds_payer_email character varying(255),
    ds_payer_name character varying(255),
    ds_payer_cpf character varying(14),
    nm_payer_phone character varying(20),
    ds_description text,
    ds_metadata jsonb,
    ds_qr_code text,
    ds_qr_code_base64 text,
    ds_ticket_url text,
    ds_success_url text,
    ds_cancel_url text,
    ds_failure_url text,
    ds_pending_url text,
    qt_installments integer DEFAULT 1,
    fg_refunded boolean DEFAULT false,
    dt_refunded timestamp without time zone,
    vl_refunded numeric(10,2),
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone,
    dt_expiracao timestamp without time zone,
    fg_ativo boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_amount_positive CHECK ((vl_amount > (0)::numeric)),
    CONSTRAINT chk_gateway CHECK (((ds_gateway)::text = ANY ((ARRAY['stripe'::character varying, 'mercadopago'::character varying])::text[]))),
    CONSTRAINT chk_status CHECK (((ds_status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'canceled'::character varying, 'refunded'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: TABLE tb_pagamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_pagamentos IS 'Pagamentos processados via Stripe e MercadoPago';


--
-- Name: COLUMN tb_pagamentos.ds_gateway; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_pagamentos.ds_gateway IS 'Gateway de pagamento: stripe ou mercadopago';


--
-- Name: COLUMN tb_pagamentos.ds_tipo_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_pagamentos.ds_tipo_pagamento IS 'Tipo: checkout, payment_intent, pix, card, preference';


--
-- Name: COLUMN tb_pagamentos.ds_external_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_pagamentos.ds_external_id IS 'ID externo do gateway (payment_id, session_id, etc)';


--
-- Name: COLUMN tb_pagamentos.vl_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_pagamentos.vl_amount IS 'Valor em reais (ou moeda especificada)';


--
-- Name: COLUMN tb_pagamentos.ds_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_pagamentos.ds_metadata IS 'Metadata JSON para rastreamento';


--
-- Name: tb_participantes_conversa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_participantes_conversa (
    id_participante uuid DEFAULT gen_random_uuid() NOT NULL,
    id_conversa uuid,
    id_user uuid,
    ds_papel character varying(20) DEFAULT 'membro'::character varying,
    st_ativo boolean DEFAULT true,
    st_silenciado boolean DEFAULT false,
    dt_ultima_leitura timestamp without time zone,
    nr_mensagens_nao_lidas integer DEFAULT 0,
    st_notificacoes_ativas boolean DEFAULT true,
    dt_entrada timestamp without time zone DEFAULT now(),
    dt_saida timestamp without time zone
);


--
-- Name: TABLE tb_participantes_conversa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_participantes_conversa IS 'Participantes de cada conversa';


--
-- Name: tb_partner_lead_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_lead_questions (
    id_question uuid DEFAULT gen_random_uuid() NOT NULL,
    tp_partner character varying(32) NOT NULL,
    nm_question character varying(500) NOT NULL,
    tp_input character varying(32) NOT NULL,
    ds_options jsonb,
    ds_placeholder character varying(255),
    ds_help_text text,
    nr_order integer NOT NULL,
    st_required boolean NOT NULL,
    st_active boolean NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone
);


--
-- Name: TABLE tb_partner_lead_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_partner_lead_questions IS 'Gerenciamento de perguntas dinâmicas para leads de parceiros';


--
-- Name: COLUMN tb_partner_lead_questions.id_question; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.id_question IS 'ID único da pergunta';


--
-- Name: COLUMN tb_partner_lead_questions.tp_partner; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.tp_partner IS 'Tipo de parceiro: paciente, profissional, clinica, fornecedor';


--
-- Name: COLUMN tb_partner_lead_questions.nm_question; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.nm_question IS 'Texto da pergunta';


--
-- Name: COLUMN tb_partner_lead_questions.tp_input; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.tp_input IS 'Tipo de input: text, textarea, select, radio, checkbox, number, email, tel, date';


--
-- Name: COLUMN tb_partner_lead_questions.ds_options; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.ds_options IS 'Opções para select/radio/checkbox em formato JSONB';


--
-- Name: COLUMN tb_partner_lead_questions.ds_placeholder; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.ds_placeholder IS 'Texto de placeholder para o input';


--
-- Name: COLUMN tb_partner_lead_questions.ds_help_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.ds_help_text IS 'Texto de ajuda/dica para a pergunta';


--
-- Name: COLUMN tb_partner_lead_questions.nr_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.nr_order IS 'Ordem de exibição da pergunta';


--
-- Name: COLUMN tb_partner_lead_questions.st_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.st_required IS 'Se a pergunta é obrigatória';


--
-- Name: COLUMN tb_partner_lead_questions.st_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_lead_questions.st_active IS 'Se a pergunta está ativa';


--
-- Name: tb_partner_lead_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_lead_services (
    id_partner_lead_service uuid NOT NULL,
    id_partner_lead uuid NOT NULL,
    id_service uuid NOT NULL,
    nm_service character varying(255) NOT NULL,
    ds_preco_label character varying(255),
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_partner_lead_services; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_partner_lead_services IS 'Serviços solicitados por cada lead';


--
-- Name: tb_partner_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_leads (
    id_partner_lead uuid NOT NULL,
    tp_partner character varying(32) NOT NULL,
    nm_contato character varying(255) NOT NULL,
    nm_email character varying(255) NOT NULL,
    nr_telefone character varying(32) NOT NULL,
    nm_empresa character varying(255) NOT NULL,
    nr_cnpj character varying(32),
    nm_cidade character varying(120),
    nm_estado character varying(64),
    ds_servicos text,
    ds_diferenciais text,
    nr_tamanho_equipe character varying(32),
    ds_catalogo_url character varying(500),
    ds_observacoes text,
    nm_status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    id_empresa uuid,
    id_user uuid
);


--
-- Name: TABLE tb_partner_leads; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_partner_leads IS 'Leads de potenciais parceiros (clínicas/empresas interessadas)';


--
-- Name: tb_partner_licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_licenses (
    id_partner_license uuid NOT NULL,
    id_partner_package_item uuid NOT NULL,
    cd_license character varying(128) NOT NULL,
    nm_assigned_to character varying(255),
    nm_assigned_email character varying(255),
    nm_status character varying(32) DEFAULT 'available'::character varying NOT NULL,
    ds_metadata jsonb,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_ativacao timestamp with time zone,
    dt_revogacao timestamp with time zone
);


--
-- Name: TABLE tb_partner_licenses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_partner_licenses IS 'Licenças individuais geradas para ativação de serviços';


--
-- Name: tb_partner_package_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_package_history (
    id_history uuid NOT NULL,
    id_partner_package uuid NOT NULL,
    id_service_old uuid,
    id_service_new uuid NOT NULL,
    tp_change character varying(32) NOT NULL,
    vl_prorata_charged numeric(12,2),
    nm_currency character varying(8) NOT NULL,
    qt_dias_restantes integer,
    dt_change timestamp with time zone NOT NULL,
    ds_reason text,
    id_user_action uuid,
    ds_metadata jsonb
);


--
-- Name: tb_partner_package_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_package_items (
    id_partner_package_item uuid NOT NULL,
    id_partner_package uuid NOT NULL,
    id_service uuid NOT NULL,
    qt_licenses integer DEFAULT 1 NOT NULL,
    vl_unitario numeric(12,2),
    ds_preco_label character varying(255),
    nm_status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    ds_metadata jsonb,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_partner_package_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_partner_package_items IS 'Itens (serviços) incluídos em cada pacote';


--
-- Name: tb_partner_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_packages (
    id_partner_package uuid NOT NULL,
    id_partner_lead uuid,
    cd_package character varying(64) NOT NULL,
    nm_package character varying(255) NOT NULL,
    nm_status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    nm_billing_cycle character varying(32) DEFAULT 'monthly'::character varying NOT NULL,
    vl_total numeric(12,2),
    nm_currency character varying(8) DEFAULT 'BRL'::character varying NOT NULL,
    ds_contract_url character varying(500),
    ds_notes text,
    ds_metadata jsonb,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    dt_ativacao timestamp with time zone,
    dt_expiracao timestamp with time zone
);


--
-- Name: TABLE tb_partner_packages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_partner_packages IS 'Pacotes/contratos criados para parceiros';


--
-- Name: tb_partner_service_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partner_service_definitions (
    id_service uuid NOT NULL,
    cd_service character varying(64) NOT NULL,
    nm_service character varying(255) NOT NULL,
    ds_resumo text,
    vl_preco_base numeric(12,2),
    ds_preco_label character varying(255),
    ds_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    st_ativo character(1) DEFAULT 'S'::bpchar NOT NULL,
    st_recomendado boolean DEFAULT false NOT NULL,
    tp_categoria character varying(32) DEFAULT 'plano_base'::character varying NOT NULL,
    dt_criacao timestamp with time zone DEFAULT now() NOT NULL,
    nm_currency character varying(8) DEFAULT 'BRL'::character varying NOT NULL,
    ds_descricao_completa text,
    fg_is_addon boolean DEFAULT false NOT NULL,
    ds_metadata jsonb,
    dt_atualizacao timestamp with time zone DEFAULT now() NOT NULL,
    tp_partner character varying(32) DEFAULT 'universal'::character varying,
    qt_max_licenses integer,
    pc_desconto_anual numeric(5,2) DEFAULT 17.00
);


--
-- Name: TABLE tb_partner_service_definitions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_partner_service_definitions IS 'Catálogo de serviços/produtos que podem ser licenciados via programa de parceria';


--
-- Name: COLUMN tb_partner_service_definitions.tp_categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_service_definitions.tp_categoria IS 'Categoria do plano: plano_base (core), oferta (promotional), diferencial (feature), addon (add-on)';


--
-- Name: COLUMN tb_partner_service_definitions.tp_partner; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_service_definitions.tp_partner IS 'Tipo de parceiro: clinica, profissional, fornecedor, ou universal (todos)';


--
-- Name: COLUMN tb_partner_service_definitions.pc_desconto_anual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_partner_service_definitions.pc_desconto_anual IS 'Percentual de desconto para plano anual (ex: 17.00 = 17% de desconto)';


--
-- Name: tb_password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_password_reset_tokens (
    id_token uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid NOT NULL,
    ds_token character varying(255) NOT NULL,
    dt_expiration timestamp without time zone NOT NULL,
    st_used character varying(1) DEFAULT 'N'::character varying NOT NULL,
    dt_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dt_used timestamp without time zone,
    ds_ip_address character varying(45),
    ds_user_agent text,
    CONSTRAINT tb_password_reset_tokens_st_used_check CHECK (((st_used)::text = ANY ((ARRAY['S'::character varying, 'N'::character varying])::text[])))
);


--
-- Name: TABLE tb_password_reset_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_password_reset_tokens IS 'Armazena tokens de recuperação de senha';


--
-- Name: COLUMN tb_password_reset_tokens.id_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.id_token IS 'ID único do token';


--
-- Name: COLUMN tb_password_reset_tokens.id_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.id_user IS 'ID do usuário que solicitou a recuperação';


--
-- Name: COLUMN tb_password_reset_tokens.ds_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.ds_token IS 'Token único para recuperação';


--
-- Name: COLUMN tb_password_reset_tokens.dt_expiration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.dt_expiration IS 'Data e hora de expiração (1 hora após criação)';


--
-- Name: COLUMN tb_password_reset_tokens.st_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.st_used IS 'Se o token já foi usado (S/N)';


--
-- Name: COLUMN tb_password_reset_tokens.dt_created; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.dt_created IS 'Data e hora de criação';


--
-- Name: COLUMN tb_password_reset_tokens.dt_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.dt_used IS 'Data e hora em que foi usado';


--
-- Name: COLUMN tb_password_reset_tokens.ds_ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.ds_ip_address IS 'Endereço IP que solicitou';


--
-- Name: COLUMN tb_password_reset_tokens.ds_user_agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_password_reset_tokens.ds_user_agent IS 'User agent do navegador';


--
-- Name: tb_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_payments (
    id_payment uuid NOT NULL,
    id_subscription uuid NOT NULL,
    id_user uuid NOT NULL,
    id_invoice uuid,
    nm_stripe_payment_id character varying(255),
    nm_stripe_payment_intent_id character varying(255),
    nm_payment_method character varying(50) NOT NULL,
    nm_status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    vl_amount numeric(10,2) NOT NULL,
    vl_amount_refunded numeric(10,2) DEFAULT 0.00,
    nm_currency character varying(3) DEFAULT 'BRL'::character varying NOT NULL,
    ds_metadata jsonb,
    ds_failure_message character varying,
    ds_receipt_url character varying,
    dt_paid_at timestamp without time zone,
    dt_refunded_at timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: tb_pedido_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_pedido_historico (
    id_historico uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pedido uuid,
    ds_status_anterior character varying(50),
    ds_status_novo character varying(50) NOT NULL,
    ds_observacao text,
    ds_observacao_cliente text,
    id_user uuid,
    nm_usuario character varying(255),
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_pedido_historico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_pedido_historico IS 'Histórico de mudanças de status dos pedidos';


--
-- Name: tb_pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_pedidos (
    id_pedido uuid DEFAULT gen_random_uuid() NOT NULL,
    nr_pedido character varying(20) NOT NULL,
    id_user uuid,
    id_fornecedor uuid,
    ds_destinatario character varying(255) NOT NULL,
    ds_endereco character varying(255) NOT NULL,
    nr_numero character varying(20) NOT NULL,
    ds_complemento character varying(100),
    nm_bairro character varying(100) NOT NULL,
    nm_cidade character varying(100) NOT NULL,
    nm_estado character varying(2) NOT NULL,
    nr_cep character varying(10) NOT NULL,
    nr_telefone character varying(20),
    vl_subtotal numeric(10,2) NOT NULL,
    vl_frete numeric(10,2) DEFAULT 0,
    vl_desconto numeric(10,2) DEFAULT 0,
    vl_taxa_servico numeric(10,2) DEFAULT 0,
    vl_total numeric(10,2) NOT NULL,
    id_cupom uuid,
    ds_codigo_cupom character varying(50),
    ds_status character varying(50) DEFAULT 'pendente'::character varying,
    ds_forma_pagamento character varying(50),
    ds_status_pagamento character varying(50) DEFAULT 'pendente'::character varying,
    ds_id_transacao_gateway character varying(255),
    ds_dados_pagamento jsonb,
    dt_pagamento timestamp without time zone,
    ds_metodo_envio character varying(50),
    ds_codigo_rastreio character varying(100),
    ds_transportadora character varying(100),
    dt_envio timestamp without time zone,
    dt_entrega_prevista date,
    dt_entrega timestamp without time zone,
    ds_numero_nota_fiscal character varying(50),
    ds_chave_nfe character varying(44),
    ds_url_danfe text,
    dt_emissao_nf timestamp without time zone,
    ds_observacoes_cliente text,
    ds_observacoes_internas text,
    ds_motivo_cancelamento text,
    dt_cancelamento timestamp without time zone,
    nm_cancelado_por character varying(255),
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    dt_entrega_estimada date,
    ds_endereco_entrega jsonb
);


--
-- Name: TABLE tb_pedidos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_pedidos IS 'Pedidos de produtos realizados';


--
-- Name: COLUMN tb_pedidos.id_fornecedor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_pedidos.id_fornecedor IS 'Fornecedor responsável pelo pedido';


--
-- Name: COLUMN tb_pedidos.ds_codigo_rastreio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_pedidos.ds_codigo_rastreio IS 'Código de rastreamento da transportadora';


--
-- Name: tb_perfis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_perfis (
    id_perfil uuid DEFAULT gen_random_uuid() NOT NULL,
    nm_perfil character varying(100) NOT NULL,
    ds_perfil text,
    ds_permissoes jsonb DEFAULT '{}'::jsonb,
    dt_criacao timestamp without time zone DEFAULT now(),
    nm_tipo_acesso character varying(20),
    id_perfil_pai uuid,
    nr_ordem integer DEFAULT 0,
    id_empresa uuid,
    nm_tipo character varying(20) DEFAULT 'custom'::character varying,
    ds_grupos_acesso text[] DEFAULT '{}'::text[],
    ds_permissoes_detalhadas jsonb DEFAULT '{}'::jsonb,
    ds_rotas_permitidas text[] DEFAULT '{}'::text[],
    fg_template boolean DEFAULT false,
    st_ativo character varying(1) DEFAULT 'S'::character varying,
    dt_atualizacao timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public.tb_perfis FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN tb_perfis.nm_tipo_acesso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_perfis.nm_tipo_acesso IS 'Tipo de acesso principal: admin, parceiro, fornecedor';


--
-- Name: COLUMN tb_perfis.id_perfil_pai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_perfis.id_perfil_pai IS 'ID do perfil pai (NULL = perfil raiz)';


--
-- Name: COLUMN tb_perfis.nr_ordem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_perfis.nr_ordem IS 'Ordem de exibição no menu';


--
-- Name: tb_pesquisas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_pesquisas (
    id_pesquisa uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    nm_titulo character varying(255) NOT NULL,
    ds_descricao text,
    ds_tipo character varying(50) DEFAULT 'nps'::character varying,
    ds_perguntas jsonb NOT NULL,
    st_anonima boolean DEFAULT false,
    st_obrigatoria boolean DEFAULT false,
    dt_inicio date,
    dt_fim date,
    st_ativa boolean DEFAULT true,
    nr_total_respostas integer DEFAULT 0,
    nr_nps_score numeric(5,2),
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_pesquisas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_pesquisas IS 'Pesquisas de satisfação e NPS';


--
-- Name: tb_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_plans (
    id_plan uuid DEFAULT gen_random_uuid() NOT NULL,
    nm_plan character varying(100) NOT NULL,
    ds_plan character varying(500),
    nm_tier character varying(20) DEFAULT 'free'::character varying NOT NULL,
    vl_price_monthly numeric(10,2) DEFAULT 0.00 NOT NULL,
    vl_price_yearly numeric(10,2) DEFAULT 0.00 NOT NULL,
    ds_features jsonb,
    ds_quotas jsonb,
    st_ativo character(1) DEFAULT 'S'::bpchar NOT NULL,
    st_visivel character(1) DEFAULT 'S'::bpchar NOT NULL,
    nr_trial_days integer DEFAULT 0 NOT NULL,
    nm_stripe_price_id_monthly character varying(100),
    nm_stripe_price_id_yearly character varying(100),
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao timestamp without time zone,
    CONSTRAINT chk_prices CHECK (((vl_price_monthly >= (0)::numeric) AND (vl_price_yearly >= (0)::numeric))),
    CONSTRAINT chk_status CHECK ((st_ativo = ANY (ARRAY['S'::bpchar, 'N'::bpchar]))),
    CONSTRAINT chk_tier CHECK (((nm_tier)::text = ANY ((ARRAY['free'::character varying, 'starter'::character varying, 'professional'::character varying, 'enterprise'::character varying])::text[]))),
    CONSTRAINT chk_trial_days CHECK (((nr_trial_days >= 0) AND (nr_trial_days <= 365))),
    CONSTRAINT chk_visibilidade CHECK ((st_visivel = ANY (ARRAY['S'::bpchar, 'N'::bpchar])))
);


--
-- Name: TABLE tb_plans; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_plans IS 'Planos de assinatura disponíveis para usuários';


--
-- Name: COLUMN tb_plans.nm_tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_plans.nm_tier IS 'Tier do plano: free, starter, professional, enterprise';


--
-- Name: COLUMN tb_plans.ds_features; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_plans.ds_features IS 'Features incluídas no plano (JSON)';


--
-- Name: COLUMN tb_plans.ds_quotas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_plans.ds_quotas IS 'Limites de uso (quotas) do plano (JSON)';


--
-- Name: COLUMN tb_plans.nr_trial_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_plans.nr_trial_days IS 'Número de dias de trial gratuito';


--
-- Name: tb_preferencias_notificacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_preferencias_notificacao (
    id_preferencia uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    ds_canal character varying(50) NOT NULL,
    st_agendamentos boolean DEFAULT true,
    st_mensagens boolean DEFAULT true,
    st_pedidos boolean DEFAULT true,
    st_pagamentos boolean DEFAULT true,
    st_avaliacoes boolean DEFAULT true,
    st_promocoes boolean DEFAULT false,
    st_sistema boolean DEFAULT true,
    hr_inicio_silencio time without time zone,
    hr_fim_silencio time without time zone,
    ds_frequencia_resumo character varying(20),
    hr_envio_resumo time without time zone,
    st_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_preferencias_notificacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_preferencias_notificacao IS 'Preferências de notificação por usuário e canal';


--
-- Name: tb_procedimentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_procedimentos (
    id_procedimento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_clinica uuid,
    nm_procedimento character varying(255) NOT NULL,
    ds_procedimento text,
    ds_categoria character varying(100),
    ds_subcategoria character varying(100),
    vl_preco numeric(10,2),
    vl_preco_promocional numeric(10,2),
    nr_duracao_minutos integer NOT NULL,
    nr_sessoes_recomendadas integer DEFAULT 1,
    ds_indicacoes text,
    ds_contraindicacoes text,
    ds_preparacao text,
    ds_cuidados_pos text,
    ds_resultados_esperados text,
    ds_foto_principal text,
    ds_fotos text[],
    ds_video text,
    st_requer_avaliacao boolean DEFAULT false,
    st_disponivel_online boolean DEFAULT true,
    nr_idade_minima integer,
    st_ativo boolean DEFAULT true,
    nr_ordem_exibicao integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public.tb_procedimentos FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_procedimentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_procedimentos IS 'Catálogo de procedimentos estéticos';


--
-- Name: tb_produto_variacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_produto_variacoes (
    id_variacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_produto uuid,
    nm_tipo_variacao character varying(50) NOT NULL,
    nm_variacao character varying(100) NOT NULL,
    vl_preco_adicional numeric(10,2) DEFAULT 0,
    nr_estoque integer DEFAULT 0,
    ds_sku character varying(100),
    ds_imagem_url text,
    st_ativo boolean DEFAULT true,
    nr_ordem integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_produto_variacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_produto_variacoes IS 'Variações de produtos (cor, tamanho, etc.)';


--
-- Name: tb_produtos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_produtos (
    id_produto uuid DEFAULT gen_random_uuid() NOT NULL,
    id_fornecedor uuid,
    id_categoria uuid,
    nm_produto character varying(255) NOT NULL,
    ds_descricao text,
    ds_descricao_curta character varying(500),
    ds_slug character varying(255) NOT NULL,
    ds_sku character varying(100),
    ds_ean character varying(13),
    ds_codigo_fornecedor character varying(100),
    ds_tags text[],
    ds_marca character varying(100),
    vl_preco numeric(10,2) NOT NULL,
    vl_preco_promocional numeric(10,2),
    dt_inicio_promocao timestamp without time zone,
    dt_fim_promocao timestamp without time zone,
    nr_percentual_desconto integer,
    nr_estoque integer DEFAULT 0,
    nr_estoque_minimo integer DEFAULT 5,
    nr_estoque_maximo integer DEFAULT 999,
    st_controla_estoque boolean DEFAULT true,
    st_disponivel_sem_estoque boolean DEFAULT false,
    nr_peso_gramas integer,
    nr_altura_cm numeric(10,2),
    nr_largura_cm numeric(10,2),
    nr_profundidade_cm numeric(10,2),
    ds_ingredientes text,
    ds_modo_uso text,
    ds_cuidados text,
    ds_contraindicacoes text,
    nr_volume_ml integer,
    nr_quantidade_unidades integer,
    ds_registro_anvisa character varying(100),
    st_vegano boolean DEFAULT false,
    st_cruelty_free boolean DEFAULT false,
    st_organico boolean DEFAULT false,
    ds_certificacoes text[],
    ds_imagem_principal text,
    ds_imagens text[],
    ds_video_url text,
    ds_meta_title character varying(255),
    ds_meta_description character varying(500),
    ds_meta_keywords text[],
    st_ativo boolean DEFAULT true,
    st_destaque boolean DEFAULT false,
    st_novidade boolean DEFAULT false,
    nr_avaliacao_media numeric(3,2) DEFAULT 0.0,
    nr_total_avaliacoes integer DEFAULT 0,
    nr_total_vendas integer DEFAULT 0,
    nr_visualizacoes integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_produtos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_produtos IS 'Catálogo de produtos do marketplace';


--
-- Name: COLUMN tb_produtos.id_fornecedor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_produtos.id_fornecedor IS 'Fornecedor do produto';


--
-- Name: COLUMN tb_produtos.id_categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_produtos.id_categoria IS 'Categoria do produto (hierárquica)';


--
-- Name: COLUMN tb_produtos.ds_slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_produtos.ds_slug IS 'URL-friendly identifier único';


--
-- Name: COLUMN tb_produtos.ds_sku; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_produtos.ds_sku IS 'Stock Keeping Unit - código único do produto';


--
-- Name: tb_profissionais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_profissionais (
    id_profissional uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_clinica uuid,
    nm_profissional character varying(255) NOT NULL,
    ds_biografia text,
    ds_especialidades text[] NOT NULL,
    nr_registro_profissional character varying(50),
    ds_formacao text,
    nr_anos_experiencia integer,
    ds_email character varying(255),
    nr_telefone character varying(20),
    nr_whatsapp character varying(20),
    ds_foto text,
    ds_horarios_atendimento jsonb,
    nr_tempo_consulta integer DEFAULT 60,
    st_aceita_online boolean DEFAULT true,
    ds_procedimentos_realizados text[],
    st_ativo boolean DEFAULT true,
    st_verificado boolean DEFAULT false,
    nr_avaliacao_media numeric(3,2) DEFAULT 0.0,
    nr_total_avaliacoes integer DEFAULT 0,
    nr_total_atendimentos integer DEFAULT 0,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    id_empresa uuid,
    fg_autonomo boolean DEFAULT false,
    ds_bio text,
    ds_foto_url character varying(500),
    ds_config jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.tb_profissionais FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_profissionais; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_profissionais IS 'Cadastro de profissionais (esteticistas, dermatologistas, etc.)';


--
-- Name: COLUMN tb_profissionais.id_clinica; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_profissionais.id_clinica IS 'DEPRECATED: Clínica principal (manter por compatibilidade). Usar tb_profissionais_clinicas para relacionamento N:N.';


--
-- Name: tb_profissionais_clinicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_profissionais_clinicas (
    id_profissional_clinica uuid DEFAULT gen_random_uuid() NOT NULL,
    id_profissional uuid NOT NULL,
    id_clinica uuid NOT NULL,
    dt_vinculo timestamp without time zone DEFAULT now() NOT NULL,
    dt_desvinculo timestamp without time zone,
    st_ativo boolean DEFAULT true NOT NULL,
    ds_observacoes text,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone
);


--
-- Name: TABLE tb_profissionais_clinicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_profissionais_clinicas IS 'Relacionamento N:N entre profissionais e clínicas. Permite que um profissional trabalhe em múltiplas clínicas.';


--
-- Name: COLUMN tb_profissionais_clinicas.id_profissional_clinica; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_profissionais_clinicas.id_profissional_clinica IS 'Identificador único do vínculo';


--
-- Name: COLUMN tb_profissionais_clinicas.id_profissional; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_profissionais_clinicas.id_profissional IS 'Profissional vinculado';


--
-- Name: COLUMN tb_profissionais_clinicas.id_clinica; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_profissionais_clinicas.id_clinica IS 'Clínica vinculada';


--
-- Name: COLUMN tb_profissionais_clinicas.dt_vinculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_profissionais_clinicas.dt_vinculo IS 'Data de início do vínculo';


--
-- Name: COLUMN tb_profissionais_clinicas.dt_desvinculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_profissionais_clinicas.dt_desvinculo IS 'Data de término do vínculo (NULL se ainda ativo)';


--
-- Name: COLUMN tb_profissionais_clinicas.st_ativo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_profissionais_clinicas.st_ativo IS 'Status do vínculo (true = ativo, false = inativo)';


--
-- Name: tb_prompt_biblioteca; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_prompt_biblioteca (
    id_prompt uuid DEFAULT gen_random_uuid() NOT NULL,
    nm_titulo character varying(200) NOT NULL,
    ds_prompt text NOT NULL,
    ds_categoria character varying(50),
    ds_tags text[],
    id_empresa uuid,
    id_usuario_criador uuid,
    nr_vezes_usado integer DEFAULT 0,
    st_publico boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_categoria CHECK (((ds_categoria)::text = ANY ((ARRAY['atendimento'::character varying, 'analise'::character varying, 'criacao'::character varying, 'codigo'::character varying, 'pesquisa'::character varying, 'educacao'::character varying, 'outro'::character varying])::text[])))
);


--
-- Name: TABLE tb_prompt_biblioteca; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_prompt_biblioteca IS 'Biblioteca de prompts reutilizáveis para criação de agentes';


--
-- Name: COLUMN tb_prompt_biblioteca.nr_vezes_usado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_prompt_biblioteca.nr_vezes_usado IS 'Contador de quantas vezes o prompt foi utilizado';


--
-- Name: COLUMN tb_prompt_biblioteca.st_publico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_prompt_biblioteca.st_publico IS 'Se true, prompt visível para todos usuários da empresa';


--
-- Name: tb_prontuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_prontuarios (
    id_prontuario uuid DEFAULT gen_random_uuid() NOT NULL,
    id_paciente uuid,
    id_profissional uuid,
    id_agendamento uuid,
    id_clinica uuid,
    dt_consulta timestamp without time zone NOT NULL,
    ds_tipo character varying(50),
    ds_queixa_principal text,
    ds_historico_doenca_atual text,
    ds_antecedentes_pessoais text,
    ds_antecedentes_familiares text,
    ds_habitos_vida text,
    ds_pressao_arterial character varying(20),
    ds_peso numeric(5,2),
    ds_altura numeric(5,2),
    ds_imc numeric(5,2),
    ds_exame_fisico text,
    ds_avaliacao_estetica text,
    ds_diagnostico text,
    ds_procedimentos_realizados text,
    ds_produtos_utilizados text,
    ds_prescricoes text,
    ds_orientacoes text,
    ds_plano_tratamento text,
    ds_evolucao text,
    ds_intercorrencias text,
    ds_fotos_antes text[],
    ds_fotos_depois text[],
    ds_arquivos_anexos text[],
    dt_retorno_sugerido date,
    ds_assinatura_profissional text,
    dt_assinatura timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_prontuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_prontuarios IS 'Prontuários eletrônicos dos pacientes';


--
-- Name: tb_qrcodes_avaliacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_qrcodes_avaliacao (
    id_qrcode uuid DEFAULT gen_random_uuid() NOT NULL,
    id_agendamento uuid NOT NULL,
    id_paciente uuid NOT NULL,
    id_clinica uuid,
    id_profissional uuid,
    id_procedimento uuid,
    tk_codigo character varying(100) NOT NULL,
    ds_qrcode_url text,
    st_utilizado boolean DEFAULT false,
    dt_geracao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dt_utilizacao timestamp without time zone,
    dt_expiracao timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '30 days'::interval),
    nr_tentativas_uso integer DEFAULT 0
);


--
-- Name: TABLE tb_qrcodes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_qrcodes_avaliacao IS 'QR Codes gerados após procedimentos para avaliações verificadas';


--
-- Name: tb_rastreamento_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_rastreamento_eventos (
    id_evento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pedido uuid NOT NULL,
    ds_transportadora character varying(100) NOT NULL,
    ds_codigo_rastreio character varying(100) NOT NULL,
    ds_status character varying(100) NOT NULL,
    ds_status_mapeado character varying(50),
    ds_descricao text NOT NULL,
    ds_cidade character varying(100),
    ds_estado character varying(2),
    ds_pais character varying(3) DEFAULT 'BRA'::character varying,
    ds_local_completo character varying(255),
    dt_evento timestamp without time zone NOT NULL,
    dt_captura timestamp without time zone DEFAULT now() NOT NULL,
    ds_dados_brutos jsonb,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_rastreamento_eventos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_rastreamento_eventos IS 'Eventos de rastreamento capturados das APIs de transportadoras';


--
-- Name: COLUMN tb_rastreamento_eventos.ds_transportadora; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_rastreamento_eventos.ds_transportadora IS 'correios | jadlog | total_express | outro';


--
-- Name: COLUMN tb_rastreamento_eventos.ds_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_rastreamento_eventos.ds_status IS 'Status original retornado pela transportadora';


--
-- Name: COLUMN tb_rastreamento_eventos.ds_status_mapeado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_rastreamento_eventos.ds_status_mapeado IS 'Status normalizado: em_transito | saiu_para_entrega | entregue | problema | etc';


--
-- Name: COLUMN tb_rastreamento_eventos.dt_evento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_rastreamento_eventos.dt_evento IS 'Data/hora real do evento (timestamp da transportadora)';


--
-- Name: COLUMN tb_rastreamento_eventos.dt_captura; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_rastreamento_eventos.dt_captura IS 'Data/hora que capturamos o evento da API';


--
-- Name: COLUMN tb_rastreamento_eventos.ds_dados_brutos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_rastreamento_eventos.ds_dados_brutos IS 'JSON completo da resposta da API (para auditoria)';


--
-- Name: tb_record_manager; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_record_manager (
    id_record uuid NOT NULL,
    namespace character varying(255) NOT NULL,
    key character varying(1000) NOT NULL,
    group_id character varying(255),
    updated_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: tb_repasses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_repasses (
    id_repasse uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    id_profissional uuid,
    id_fornecedor uuid,
    id_conta_bancaria uuid,
    vl_bruto numeric(12,2) NOT NULL,
    vl_impostos numeric(12,2) DEFAULT 0,
    vl_taxas numeric(12,2) DEFAULT 0,
    vl_liquido numeric(12,2) GENERATED ALWAYS AS (((vl_bruto - vl_impostos) - vl_taxas)) STORED,
    dt_inicio_periodo date NOT NULL,
    dt_fim_periodo date NOT NULL,
    ds_status character varying(50) DEFAULT 'pendente'::character varying,
    ds_forma_pagamento character varying(50),
    dt_pagamento timestamp without time zone,
    ds_comprovante_url text,
    ds_observacoes text,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_beneficiario_repasse CHECK ((((id_profissional IS NOT NULL) AND (id_fornecedor IS NULL)) OR ((id_profissional IS NULL) AND (id_fornecedor IS NOT NULL))))
);


--
-- Name: TABLE tb_repasses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_repasses IS 'Repasses financeiros para profissionais e fornecedores';


--
-- Name: tb_reservas_estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_reservas_estoque (
    id_reserva uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid NOT NULL,
    id_produto uuid NOT NULL,
    id_agendamento uuid NOT NULL,
    nr_quantidade integer NOT NULL,
    st_reserva character varying(20) DEFAULT 'ativa'::character varying NOT NULL,
    dt_expiracao timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_reservas_estoque_nr_quantidade_check CHECK ((nr_quantidade > 0)),
    CONSTRAINT tb_reservas_estoque_st_reserva_check CHECK (((st_reserva)::text = ANY ((ARRAY['ativa'::character varying, 'confirmada'::character varying, 'cancelada'::character varying, 'expirada'::character varying])::text[])))
);


--
-- Name: TABLE tb_reservas_estoque; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_reservas_estoque IS 'Reservas temporárias de estoque para agendamentos';


--
-- Name: COLUMN tb_reservas_estoque.st_reserva; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_reservas_estoque.st_reserva IS 'ativa | confirmada | cancelada | expirada';


--
-- Name: COLUMN tb_reservas_estoque.dt_expiracao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_reservas_estoque.dt_expiracao IS 'Data/hora de expiração da reserva (default 24h)';


--
-- Name: tb_respostas_pesquisas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_respostas_pesquisas (
    id_resposta uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pesquisa uuid,
    id_user uuid,
    id_agendamento uuid,
    id_pedido uuid,
    ds_respostas jsonb NOT NULL,
    nr_nota_nps integer,
    ds_categoria_nps character varying(20),
    ds_comentario text,
    dt_criacao timestamp without time zone DEFAULT now(),
    CONSTRAINT tb_respostas_pesquisas_nr_nota_nps_check CHECK (((nr_nota_nps >= 0) AND (nr_nota_nps <= 10)))
);


--
-- Name: TABLE tb_respostas_pesquisas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_respostas_pesquisas IS 'Respostas das pesquisas';


--
-- Name: tb_respostas_rapidas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_respostas_rapidas (
    id_resposta uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    id_user uuid,
    ds_atalho character varying(50) NOT NULL,
    ds_conteudo text NOT NULL,
    nr_vezes_usado integer DEFAULT 0,
    dt_ultimo_uso timestamp without time zone,
    st_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_respostas_rapidas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_respostas_rapidas IS 'Respostas rápidas com atalhos para usuários';


--
-- Name: tb_sessoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_sessoes (
    id_sessao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    ds_token character varying(500) NOT NULL,
    ds_refresh_token character varying(500),
    ds_ip character varying(45) NOT NULL,
    ds_user_agent text,
    ds_plataforma character varying(20),
    ds_navegador character varying(100),
    ds_localizacao character varying(255),
    st_ativa boolean DEFAULT true,
    dt_ultimo_acesso timestamp without time zone DEFAULT now(),
    dt_expiracao timestamp without time zone NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_sessoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_sessoes IS 'Sessões ativas de usuários';


--
-- Name: tb_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_subscriptions (
    id_subscription uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid NOT NULL,
    id_plan uuid,
    nm_status character varying(20) DEFAULT 'trialing'::character varying NOT NULL,
    nm_billing_interval character varying(10) DEFAULT 'month'::character varying NOT NULL,
    dt_start timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_trial_end timestamp without time zone,
    dt_current_period_start timestamp without time zone,
    dt_current_period_end timestamp without time zone,
    dt_canceled_at timestamp without time zone,
    dt_ended_at timestamp without time zone,
    nm_stripe_subscription_id character varying(100),
    nm_stripe_customer_id character varying(100),
    ds_metadata jsonb,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao timestamp without time zone,
    CONSTRAINT chk_billing_interval CHECK (((nm_billing_interval)::text = ANY ((ARRAY['month'::character varying, 'year'::character varying])::text[]))),
    CONSTRAINT chk_status CHECK (((nm_status)::text = ANY ((ARRAY['active'::character varying, 'trialing'::character varying, 'past_due'::character varying, 'canceled'::character varying, 'unpaid'::character varying, 'paused'::character varying])::text[])))
);


--
-- Name: TABLE tb_subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_subscriptions IS 'Assinaturas ativas, trial e canceladas de usuários';


--
-- Name: COLUMN tb_subscriptions.nm_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_subscriptions.nm_status IS 'Status da assinatura: active, trialing, past_due, canceled, unpaid, paused';


--
-- Name: COLUMN tb_subscriptions.nm_billing_interval; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_subscriptions.nm_billing_interval IS 'Intervalo de cobrança: month ou year';


--
-- Name: COLUMN tb_subscriptions.dt_trial_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_subscriptions.dt_trial_end IS 'Data de término do período de trial';


--
-- Name: COLUMN tb_subscriptions.nm_stripe_subscription_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_subscriptions.nm_stripe_subscription_id IS 'ID da subscription no Stripe (único)';


--
-- Name: tb_template_installations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_template_installations (
    id_installation uuid DEFAULT gen_random_uuid() NOT NULL,
    id_template uuid NOT NULL,
    id_user uuid NOT NULL,
    id_empresa uuid,
    id_agente uuid,
    js_customizations jsonb,
    bl_ativo boolean DEFAULT true NOT NULL,
    dt_instalacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_ultima_atualizacao timestamp without time zone
);


--
-- Name: TABLE tb_template_installations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_template_installations IS 'Rastreamento de instalações de templates por usuários';


--
-- Name: COLUMN tb_template_installations.id_agente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_template_installations.id_agente IS 'Agente criado a partir do template (se aplicável)';


--
-- Name: COLUMN tb_template_installations.js_customizations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_template_installations.js_customizations IS 'Customizações aplicadas na instalação';


--
-- Name: tb_template_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_template_reviews (
    id_review uuid DEFAULT gen_random_uuid() NOT NULL,
    id_template uuid NOT NULL,
    id_user uuid NOT NULL,
    nr_rating integer NOT NULL,
    ds_title character varying(200),
    ds_review text,
    bl_verified_install boolean DEFAULT false NOT NULL,
    bl_aprovado boolean DEFAULT true NOT NULL,
    ds_moderacao_nota text,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT tb_template_reviews_nr_rating_check CHECK (((nr_rating >= 1) AND (nr_rating <= 5)))
);


--
-- Name: TABLE tb_template_reviews; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_template_reviews IS 'Avaliações e reviews de templates por usuários';


--
-- Name: COLUMN tb_template_reviews.nr_rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_template_reviews.nr_rating IS 'Avaliação de 1 a 5 estrelas';


--
-- Name: COLUMN tb_template_reviews.bl_verified_install; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_template_reviews.bl_verified_install IS 'Se TRUE, usuário realmente instalou o template';


--
-- Name: tb_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_templates (
    id_template uuid DEFAULT gen_random_uuid() NOT NULL,
    nm_template character varying(200) NOT NULL,
    ds_template text,
    nm_category character varying(50) DEFAULT 'other'::character varying NOT NULL,
    nm_status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    nm_visibility character varying(20) DEFAULT 'public'::character varying NOT NULL,
    id_user_creator uuid,
    id_empresa_creator uuid,
    js_agent_config jsonb NOT NULL,
    ds_tags jsonb,
    ds_metadata jsonb,
    nm_version character varying(20) DEFAULT '1.0.0'::character varying NOT NULL,
    nr_install_count integer DEFAULT 0 NOT NULL,
    nr_rating_avg numeric(3,2) DEFAULT 0.00 NOT NULL,
    nr_rating_count integer DEFAULT 0 NOT NULL,
    ds_image_url character varying(500),
    ds_icon_url character varying(500),
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_publicacao timestamp without time zone,
    CONSTRAINT chk_rating_avg CHECK (((nr_rating_avg >= 0.00) AND (nr_rating_avg <= 5.00))),
    CONSTRAINT chk_template_category CHECK (((nm_category)::text = ANY ((ARRAY['customer_service'::character varying, 'sales'::character varying, 'support'::character varying, 'hr'::character varying, 'marketing'::character varying, 'analytics'::character varying, 'productivity'::character varying, 'legal'::character varying, 'finance'::character varying, 'education'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT chk_template_status CHECK (((nm_status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying, 'deprecated'::character varying])::text[]))),
    CONSTRAINT chk_template_visibility CHECK (((nm_visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'organization'::character varying])::text[])))
);


--
-- Name: TABLE tb_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_templates IS 'Templates de agentes para o marketplace';


--
-- Name: COLUMN tb_templates.nm_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_templates.nm_status IS 'Status: draft, published, archived, deprecated';


--
-- Name: COLUMN tb_templates.nm_visibility; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_templates.nm_visibility IS 'Visibilidade: public, private, organization';


--
-- Name: COLUMN tb_templates.js_agent_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_templates.js_agent_config IS 'Configuração completa do agente em formato JSON';


--
-- Name: COLUMN tb_templates.nr_rating_avg; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_templates.nr_rating_avg IS 'Média de avaliações (0.00 a 5.00)';


--
-- Name: tb_templates_mensagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_templates_mensagens (
    id_template uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    id_user uuid,
    nm_template character varying(255) NOT NULL,
    ds_conteudo text NOT NULL,
    ds_categoria character varying(100),
    ds_variaveis text[],
    nr_vezes_usado integer DEFAULT 0,
    dt_ultimo_uso timestamp without time zone,
    st_ativo boolean DEFAULT true,
    st_favorito boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_templates_mensagens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_templates_mensagens IS 'Templates reutilizáveis de mensagens';


--
-- Name: tb_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_tools (
    id_tool uuid NOT NULL,
    nm_tool character varying NOT NULL,
    ds_tool text,
    tp_tool character varying NOT NULL,
    config_tool json NOT NULL,
    st_ativo boolean NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_transacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_transacoes (
    id_transacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    id_categoria uuid,
    id_conta_bancaria uuid,
    id_agendamento uuid,
    id_pedido uuid,
    id_fatura uuid,
    ds_tipo character varying(20) NOT NULL,
    vl_valor numeric(12,2) NOT NULL,
    vl_taxa numeric(12,2) DEFAULT 0,
    vl_liquido numeric(12,2) GENERATED ALWAYS AS ((vl_valor - vl_taxa)) STORED,
    ds_descricao character varying(500) NOT NULL,
    ds_observacoes text,
    ds_forma_pagamento character varying(50),
    ds_status character varying(50) DEFAULT 'pendente'::character varying,
    ds_gateway character varying(50),
    ds_id_transacao_gateway character varying(255),
    ds_dados_gateway jsonb,
    dt_vencimento date,
    dt_pagamento timestamp without time zone,
    dt_competencia date,
    st_recorrente boolean DEFAULT false,
    ds_frequencia_recorrencia character varying(20),
    id_transacao_pai uuid,
    nr_parcela integer,
    nr_total_parcelas integer,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_valor_positivo CHECK ((vl_valor > (0)::numeric))
);

ALTER TABLE ONLY public.tb_transacoes FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE tb_transacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_transacoes IS 'Transações financeiras (receitas, despesas, transferências)';


--
-- Name: tb_transacoes_pagamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_transacoes_pagamento (
    id_transacao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pagamento uuid NOT NULL,
    ds_evento_tipo character varying(100) NOT NULL,
    ds_evento_origem character varying(50) NOT NULL,
    ds_status_anterior character varying(50),
    ds_status_novo character varying(50) NOT NULL,
    ds_evento_data jsonb,
    ds_resposta_data jsonb,
    ds_mensagem text,
    ds_codigo_erro character varying(100),
    ds_ip_address inet,
    ds_user_agent text,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tb_transacoes_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_transacoes_pagamento IS 'Histórico de eventos e transições de estado dos pagamentos';


--
-- Name: COLUMN tb_transacoes_pagamento.ds_evento_tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_transacoes_pagamento.ds_evento_tipo IS 'Tipo do evento: payment.created, payment.succeeded, payment.failed, etc';


--
-- Name: COLUMN tb_transacoes_pagamento.ds_evento_origem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_transacoes_pagamento.ds_evento_origem IS 'Origem do evento: api, webhook, manual';


--
-- Name: COLUMN tb_transacoes_pagamento.ds_evento_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_transacoes_pagamento.ds_evento_data IS 'Payload JSON completo do evento';


--
-- Name: tb_usage_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_usage_metrics (
    id_metric uuid DEFAULT gen_random_uuid() NOT NULL,
    id_subscription uuid NOT NULL,
    id_user uuid NOT NULL,
    nm_metric_type character varying(50) NOT NULL,
    nr_value numeric(15,2) DEFAULT 0.00 NOT NULL,
    dt_period_start timestamp without time zone NOT NULL,
    dt_period_end timestamp without time zone NOT NULL,
    ds_metadata jsonb,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_metric_type CHECK (((nm_metric_type)::text = ANY ((ARRAY['api_calls'::character varying, 'tokens'::character varying, 'messages'::character varying, 'agents'::character varying, 'document_stores'::character varying, 'storage_gb'::character varying, 'embeddings'::character varying])::text[]))),
    CONSTRAINT chk_period CHECK ((dt_period_start < dt_period_end)),
    CONSTRAINT chk_value CHECK ((nr_value >= (0)::numeric))
);


--
-- Name: TABLE tb_usage_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_usage_metrics IS 'Métricas de uso de recursos por usuário/assinatura';


--
-- Name: COLUMN tb_usage_metrics.nm_metric_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_usage_metrics.nm_metric_type IS 'Tipo de métrica: api_calls, tokens, messages, agents, etc';


--
-- Name: COLUMN tb_usage_metrics.nr_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_usage_metrics.nr_value IS 'Valor numérico da métrica (pode ser decimal para GB, etc)';


--
-- Name: COLUMN tb_usage_metrics.dt_period_start; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_usage_metrics.dt_period_start IS 'Início do período de medição';


--
-- Name: COLUMN tb_usage_metrics.dt_period_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_usage_metrics.dt_period_end IS 'Fim do período de medição';


--
-- Name: tb_user_onboarding_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_user_onboarding_progress (
    id_progress uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid NOT NULL,
    id_flow uuid NOT NULL,
    nm_status character varying(20) DEFAULT 'not_started'::character varying NOT NULL,
    nr_progress_percentage integer DEFAULT 0 NOT NULL,
    nm_current_step character varying(100),
    ds_completed_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    ds_skipped_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    ds_progress_data jsonb,
    dt_inicio timestamp without time zone,
    dt_conclusao timestamp without time zone,
    dt_ultima_atividade timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT tb_user_onboarding_progress_nr_progress_percentage_check CHECK (((nr_progress_percentage >= 0) AND (nr_progress_percentage <= 100)))
);


--
-- Name: TABLE tb_user_onboarding_progress; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_user_onboarding_progress IS 'Progresso de onboarding dos usuários';


--
-- Name: COLUMN tb_user_onboarding_progress.nr_progress_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_user_onboarding_progress.nr_progress_percentage IS 'Percentual de conclusão (0-100)';


--
-- Name: COLUMN tb_user_onboarding_progress.ds_completed_steps; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_user_onboarding_progress.ds_completed_steps IS 'Array de step_types completados';


--
-- Name: COLUMN tb_user_onboarding_progress.ds_skipped_steps; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_user_onboarding_progress.ds_skipped_steps IS 'Array de step_types pulados';


--
-- Name: tb_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_users (
    id_user uuid DEFAULT gen_random_uuid() NOT NULL,
    id_empresa uuid,
    id_perfil uuid,
    nm_email character varying(255) NOT NULL,
    nm_completo character varying(255) NOT NULL,
    ds_senha_hash character varying(255),
    nm_papel character varying(50) DEFAULT 'usuario'::character varying NOT NULL,
    nr_telefone character varying(20),
    ds_foto_url text,
    st_ativo character(1) DEFAULT 'S'::bpchar NOT NULL,
    nm_provider character varying(50),
    ds_provider_id character varying(255),
    nr_total_logins character varying(10) DEFAULT '0'::character varying NOT NULL,
    dt_ultimo_login timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now(),
    dt_atualizacao timestamp without time zone DEFAULT now(),
    id_usuario_criador uuid,
    nm_password_hash character varying(255),
    nm_microsoft_id character varying(255),
    nm_cargo character varying(100),
    ds_preferencias jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.tb_users FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN tb_users.id_usuario_criador; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_users.id_usuario_criador IS 'Usuário (admin de clínica) que criou este sub-usuário';


--
-- Name: tb_vagas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_vagas (
    id_vaga uuid NOT NULL,
    id_empresa uuid NOT NULL,
    id_criador uuid NOT NULL,
    nm_cargo character varying(255) NOT NULL,
    ds_resumo text NOT NULL,
    ds_responsabilidades text NOT NULL,
    ds_requisitos text NOT NULL,
    ds_diferenciais text,
    nm_area character varying(100) NOT NULL,
    nm_nivel character varying(50) NOT NULL,
    nm_tipo_contrato character varying(50) NOT NULL,
    nm_regime_trabalho character varying(50) NOT NULL,
    nm_cidade character varying(100) NOT NULL,
    nm_estado character varying(2) NOT NULL,
    ds_cep character varying(10),
    fg_aceita_remoto boolean,
    vl_salario_min numeric(10,2),
    vl_salario_max numeric(10,2),
    fg_salario_a_combinar boolean,
    ds_beneficios json,
    habilidades_requeridas json NOT NULL,
    habilidades_desejaveis json,
    certificacoes_necessarias json,
    nr_anos_experiencia_min integer NOT NULL,
    ds_status character varying(20) NOT NULL,
    fg_destaque boolean,
    dt_expiracao date,
    nr_vagas integer NOT NULL,
    nr_candidatos integer,
    nr_visualizacoes integer,
    nm_empresa character varying(255),
    ds_logo_empresa character varying(500),
    dt_criacao timestamp without time zone NOT NULL,
    dt_atualizacao timestamp without time zone,
    dt_publicacao timestamp without time zone
);


--
-- Name: tb_variaveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_variaveis (
    st_criptogrado character(1) DEFAULT 'N'::bpchar NOT NULL,
    id_variavel uuid NOT NULL,
    nm_variavel character varying NOT NULL,
    vl_variavel text NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_webhook_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_webhook_deliveries (
    id_delivery uuid DEFAULT gen_random_uuid() NOT NULL,
    id_webhook uuid NOT NULL,
    nm_event_type character varying(100) NOT NULL,
    ds_event_data jsonb NOT NULL,
    nm_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    nr_http_status integer,
    ds_response_body text,
    ds_error_message text,
    nr_attempt integer DEFAULT 1 NOT NULL,
    dt_next_retry timestamp without time zone,
    nr_duration_ms integer,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_enviado timestamp without time zone,
    dt_completado timestamp without time zone,
    CONSTRAINT chk_deliveries_status CHECK (((nm_status)::text = ANY ((ARRAY['pending'::character varying, 'delivered'::character varying, 'failed'::character varying, 'retrying'::character varying])::text[])))
);


--
-- Name: tb_webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_webhooks (
    id_webhook uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid NOT NULL,
    id_empresa uuid,
    nm_webhook character varying(200) NOT NULL,
    ds_webhook text,
    ds_url character varying(500) NOT NULL,
    ds_events jsonb NOT NULL,
    ds_secret character varying(200),
    nm_status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    nr_max_retries integer DEFAULT 3 NOT NULL,
    nr_retry_delay_seconds integer DEFAULT 60 NOT NULL,
    nr_success_count integer DEFAULT 0 NOT NULL,
    nr_failure_count integer DEFAULT 0 NOT NULL,
    dt_last_success timestamp without time zone,
    dt_last_failure timestamp without time zone,
    ds_headers jsonb,
    ds_metadata jsonb,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_webhooks_status CHECK (((nm_status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: vw_active_subscriptions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_active_subscriptions AS
 SELECT s.id_subscription,
    s.id_user,
    u.nm_email,
    u.nm_completo,
    p.nm_plan,
    p.nm_tier,
    s.nm_status,
    s.nm_billing_interval,
    s.dt_current_period_end,
    p.vl_price_monthly,
    p.vl_price_yearly,
        CASE
            WHEN ((s.nm_billing_interval)::text = 'month'::text) THEN p.vl_price_monthly
            WHEN ((s.nm_billing_interval)::text = 'year'::text) THEN p.vl_price_yearly
            ELSE (0)::numeric
        END AS vl_price_current
   FROM ((public.tb_subscriptions s
     JOIN public.tb_users u ON ((s.id_user = u.id_user)))
     LEFT JOIN public.tb_plans p ON ((s.id_plan = p.id_plan)))
  WHERE ((s.nm_status)::text = ANY ((ARRAY['active'::character varying, 'trialing'::character varying])::text[]));


--
-- Name: VIEW vw_active_subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_active_subscriptions IS 'View com resumo de todas as assinaturas ativas';


--
-- Name: vw_analytics_current_month; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_analytics_current_month AS
 SELECT nm_metric_type,
    max(nr_value) AS valor_atual,
    min(nr_value) AS valor_minimo,
    max(nr_value) AS valor_maximo,
    avg(nr_value) AS valor_medio,
    count(*) AS nr_snapshots
   FROM public.tb_analytics_snapshots
  WHERE ((dt_snapshot >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)) AND (dt_snapshot <= CURRENT_DATE))
  GROUP BY nm_metric_type;


--
-- Name: VIEW vw_analytics_current_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_analytics_current_month IS 'Resumo de métricas do mês atual';


--
-- Name: vw_analytics_events_daily; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_analytics_events_daily AS
 SELECT date(dt_event) AS dt_dia,
    nm_event_type,
    count(*) AS nr_eventos,
    count(DISTINCT id_user) AS nr_usuarios_distintos,
    count(DISTINCT id_empresa) AS nr_empresas_distintas
   FROM public.tb_analytics_events
  GROUP BY (date(dt_event)), nm_event_type
  ORDER BY (date(dt_event)) DESC, (count(*)) DESC;


--
-- Name: VIEW vw_analytics_events_daily; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_analytics_events_daily IS 'Eventos agrupados por dia e tipo para análises rápidas';


--
-- Name: vw_analytics_top_events; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_analytics_top_events AS
 SELECT nm_event_type,
    count(*) AS nr_eventos,
    count(DISTINCT id_user) AS nr_usuarios,
    count(DISTINCT date(dt_event)) AS nr_dias,
    min(dt_event) AS dt_primeiro_evento,
    max(dt_event) AS dt_ultimo_evento
   FROM public.tb_analytics_events
  WHERE (dt_event >= (CURRENT_DATE - '30 days'::interval))
  GROUP BY nm_event_type
  ORDER BY (count(*)) DESC
 LIMIT 10;


--
-- Name: VIEW vw_analytics_top_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_analytics_top_events IS 'Top 10 eventos mais comuns nos últimos 30 dias';


--
-- Name: vw_broadcast_painel; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_broadcast_painel AS
 SELECT id_campanha,
    id_empresa,
    nm_campanha,
    tp_campanha,
    tp_canal,
    st_campanha,
    dt_agendamento,
    nr_total_destinatarios,
    nr_enviados,
    nr_entregues,
    nr_falhas,
    nr_abertos,
    nr_cliques,
        CASE
            WHEN (nr_enviados > 0) THEN round((((nr_entregues)::numeric / (nr_enviados)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS taxa_entrega,
        CASE
            WHEN (nr_entregues > 0) THEN round((((nr_abertos)::numeric / (nr_entregues)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS taxa_abertura,
        CASE
            WHEN (nr_abertos > 0) THEN round((((nr_cliques)::numeric / (nr_abertos)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS taxa_clique,
        CASE
            WHEN (nr_enviados > 0) THEN round((((nr_falhas)::numeric / (nr_enviados)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS taxa_falha,
        CASE
            WHEN ((dt_inicio_envio IS NOT NULL) AND (dt_fim_envio IS NOT NULL)) THEN (EXTRACT(epoch FROM (dt_fim_envio - dt_inicio_envio)))::integer
            ELSE NULL::integer
        END AS duracao_segundos,
    dt_criacao,
    dt_inicio_envio,
    dt_fim_envio
   FROM public.tb_broadcast_campanhas c
  WHERE (fg_ativo = true);


--
-- Name: VIEW vw_broadcast_painel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_broadcast_painel IS 'Painel consolidado de campanhas com estatísticas calculadas';


--
-- Name: vw_broadcast_ranking; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_broadcast_ranking AS
 SELECT id_campanha,
    nm_campanha,
    tp_campanha,
    tp_canal,
    st_campanha,
    nr_total_destinatarios,
    nr_abertos,
    nr_cliques,
        CASE
            WHEN (nr_entregues > 0) THEN round((((nr_abertos)::numeric / (nr_entregues)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS taxa_abertura,
        CASE
            WHEN (nr_abertos > 0) THEN round((((nr_cliques)::numeric / (nr_abertos)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS taxa_clique,
    dt_criacao,
        CASE
            WHEN ((nr_entregues > 0) AND (nr_abertos > 0)) THEN ((((nr_abertos)::numeric / (nr_entregues)::numeric) * 0.6) + (((nr_cliques)::numeric / (NULLIF(nr_abertos, 0))::numeric) * 0.4))
            ELSE (0)::numeric
        END AS score_performance
   FROM public.tb_broadcast_campanhas c
  WHERE ((fg_ativo = true) AND ((st_campanha)::text = 'enviada'::text))
  ORDER BY
        CASE
            WHEN ((nr_entregues > 0) AND (nr_abertos > 0)) THEN ((((nr_abertos)::numeric / (nr_entregues)::numeric) * 0.6) + (((nr_cliques)::numeric / (NULLIF(nr_abertos, 0))::numeric) * 0.4))
            ELSE (0)::numeric
        END DESC;


--
-- Name: VIEW vw_broadcast_ranking; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_broadcast_ranking IS 'Ranking de campanhas por performance (taxa abertura 60% + taxa clique 40%)';


--
-- Name: vw_configuracoes_categoria; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_configuracoes_categoria AS
 SELECT ds_categoria,
    count(*) AS nr_total,
    count(*) FILTER (WHERE (st_ativo = true)) AS nr_ativas
   FROM public.tb_configuracoes
  GROUP BY ds_categoria;


--
-- Name: vw_current_usage_by_user; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_current_usage_by_user AS
 SELECT um.id_user,
    u.nm_email,
    um.nm_metric_type,
    sum(um.nr_value) AS total_usage,
    max(um.dt_period_end) AS last_updated
   FROM (public.tb_usage_metrics um
     JOIN public.tb_users u ON ((um.id_user = u.id_user)))
  WHERE (um.dt_period_end >= (CURRENT_DATE - '30 days'::interval))
  GROUP BY um.id_user, u.nm_email, um.nm_metric_type;


--
-- Name: VIEW vw_current_usage_by_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_current_usage_by_user IS 'Uso agregado por usuário nos últimos 30 dias';


--
-- Name: vw_erros_pendentes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_erros_pendentes AS
 SELECT l.id_log,
    l.id_user,
    l.id_empresa,
    l.ds_nivel,
    l.ds_mensagem,
    l.ds_stack_trace,
    l.ds_tipo_erro,
    l.ds_endpoint,
    l.ds_metodo,
    l.ds_parametros,
    l.ds_resposta,
    l.ds_ip,
    l.ds_user_agent,
    l.ds_referer,
    l.ds_hostname,
    l.ds_processo,
    l.ds_versao_app,
    l.st_resolvido,
    l.dt_resolvido,
    l.id_user_resolveu,
    l.ds_solucao,
    l.ds_hash_erro,
    l.nr_ocorrencias,
    l.dt_criacao,
    u.nm_completo AS nm_user,
    e.nm_empresa
   FROM ((public.tb_logs_erro l
     LEFT JOIN public.tb_users u ON ((l.id_user = u.id_user)))
     LEFT JOIN public.tb_empresas e ON ((l.id_empresa = e.id_empresa)))
  WHERE (l.st_resolvido = false)
  ORDER BY l.dt_criacao DESC;


--
-- Name: vw_estoque_estatisticas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_estoque_estatisticas AS
 SELECT id_empresa,
    id_produto,
    tp_movimentacao,
    count(*) AS nr_movimentacoes,
    sum(nr_quantidade) AS nr_total_quantidade,
    avg(nr_quantidade) AS nr_media_quantidade,
    min(dt_criacao) AS dt_primeira_movimentacao,
    max(dt_criacao) AS dt_ultima_movimentacao
   FROM public.tb_movimentacoes_estoque
  GROUP BY id_empresa, id_produto, tp_movimentacao;


--
-- Name: VIEW vw_estoque_estatisticas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_estoque_estatisticas IS 'Estatísticas de movimentações por empresa, produto e tipo';


--
-- Name: vw_jobs_proximos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_jobs_proximos AS
 SELECT j.id_job,
    j.nm_job,
    j.ds_tipo,
    j.ds_cron,
    j.dt_proxima_execucao,
    j.ds_parametros,
    j.nr_timeout_segundos,
    j.nr_max_tentativas,
    j.st_ativo,
    j.st_executando,
    j.nr_total_execucoes,
    j.nr_execucoes_sucesso,
    j.nr_execucoes_falha,
    j.dt_ultima_execucao,
    j.dt_ultima_execucao_sucesso,
    j.dt_criacao,
    j.dt_atualizacao,
    e.dt_inicio AS dt_ultima_execucao_inicio,
    e.st_sucesso AS st_ultima_execucao_sucesso
   FROM (public.tb_jobs j
     LEFT JOIN LATERAL ( SELECT tb_execucoes_jobs.dt_inicio,
            tb_execucoes_jobs.st_sucesso
           FROM public.tb_execucoes_jobs
          WHERE (tb_execucoes_jobs.id_job = j.id_job)
          ORDER BY tb_execucoes_jobs.dt_inicio DESC
         LIMIT 1) e ON (true))
  WHERE (j.st_ativo = true)
  ORDER BY j.dt_proxima_execucao;


--
-- Name: vw_notas_fiscais_mes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_notas_fiscais_mes AS
 SELECT id_empresa,
    date_trunc('month'::text, dt_emissao) AS mes,
    count(*) AS total_notas,
    sum(vl_servicos) AS vl_servicos,
    sum(vl_iss) AS vl_iss,
    sum(vl_liquido) AS vl_liquido,
    sum(vl_total_tributos) AS vl_tributos
   FROM public.tb_notas_fiscais
  WHERE (((st_nota)::text = 'emitida'::text) AND (NOT fg_cancelada))
  GROUP BY id_empresa, (date_trunc('month'::text, dt_emissao))
  ORDER BY (date_trunc('month'::text, dt_emissao)) DESC;


--
-- Name: VIEW vw_notas_fiscais_mes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_notas_fiscais_mes IS 'Faturamento mensal por empresa';


--
-- Name: vw_notas_fiscais_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_notas_fiscais_resumo AS
 SELECT id_empresa,
    count(*) AS total_notas,
    count(*) FILTER (WHERE (((st_nota)::text = 'emitida'::text) AND (NOT fg_cancelada))) AS total_emitidas,
    count(*) FILTER (WHERE fg_cancelada) AS total_canceladas,
    count(*) FILTER (WHERE ((st_nota)::text = 'pendente'::text)) AS total_pendentes,
    count(*) FILTER (WHERE ((st_nota)::text = 'erro'::text)) AS total_erros,
    sum(vl_servicos) FILTER (WHERE (((st_nota)::text = 'emitida'::text) AND (NOT fg_cancelada))) AS vl_total_servicos,
    sum(vl_iss) FILTER (WHERE (((st_nota)::text = 'emitida'::text) AND (NOT fg_cancelada))) AS vl_total_iss,
    sum(vl_liquido) FILTER (WHERE (((st_nota)::text = 'emitida'::text) AND (NOT fg_cancelada))) AS vl_total_liquido,
    sum(vl_total_tributos) FILTER (WHERE (((st_nota)::text = 'emitida'::text) AND (NOT fg_cancelada))) AS vl_total_tributos,
    min(dt_emissao) AS dt_primeira_emissao,
    max(dt_emissao) AS dt_ultima_emissao
   FROM public.tb_notas_fiscais
  GROUP BY id_empresa;


--
-- Name: VIEW vw_notas_fiscais_resumo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_notas_fiscais_resumo IS 'Resumo de notas fiscais por empresa (totais, valores, datas)';


--
-- Name: vw_onboarding_flow_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_onboarding_flow_stats AS
 SELECT f.id_flow,
    f.nm_flow,
    f.nm_target_type,
    f.bl_ativo,
    count(DISTINCT p.id_user) AS nr_usuarios_iniciados,
    count(DISTINCT
        CASE
            WHEN ((p.nm_status)::text = 'completed'::text) THEN p.id_user
            ELSE NULL::uuid
        END) AS nr_usuarios_completaram,
        CASE
            WHEN (count(DISTINCT p.id_user) > 0) THEN round((((count(DISTINCT
            CASE
                WHEN ((p.nm_status)::text = 'completed'::text) THEN p.id_user
                ELSE NULL::uuid
            END))::numeric / (count(DISTINCT p.id_user))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS taxa_conclusao_percentual,
    COALESCE(avg(p.nr_progress_percentage), (0)::numeric) AS media_progresso
   FROM (public.tb_onboarding_flows f
     LEFT JOIN public.tb_user_onboarding_progress p ON ((p.id_flow = f.id_flow)))
  GROUP BY f.id_flow, f.nm_flow, f.nm_target_type, f.bl_ativo;


--
-- Name: VIEW vw_onboarding_flow_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_onboarding_flow_stats IS 'Estatísticas de cada flow de onboarding';


--
-- Name: vw_onboarding_incomplete; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_onboarding_incomplete AS
 SELECT u.id_user,
    u.nm_email,
    u.nm_completo,
    f.nm_flow,
    p.nm_status,
    p.nr_progress_percentage,
    p.nm_current_step,
    p.dt_ultima_atividade,
    EXTRACT(day FROM (CURRENT_TIMESTAMP - (p.dt_inicio)::timestamp with time zone)) AS dias_desde_inicio
   FROM ((public.tb_user_onboarding_progress p
     JOIN public.tb_users u ON ((u.id_user = p.id_user)))
     JOIN public.tb_onboarding_flows f ON ((f.id_flow = p.id_flow)))
  WHERE ((p.nm_status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying])::text[]))
  ORDER BY p.dt_ultima_atividade DESC NULLS LAST;


--
-- Name: VIEW vw_onboarding_incomplete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_onboarding_incomplete IS 'Usuários com onboarding incompleto para campanhas de re-engajamento';


--
-- Name: vw_onboarding_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_onboarding_summary AS
 SELECT u.id_user,
    u.nm_email,
    u.nm_completo,
    count(DISTINCT p.id_progress) AS nr_flows_iniciados,
    count(DISTINCT
        CASE
            WHEN ((p.nm_status)::text = 'completed'::text) THEN p.id_progress
            ELSE NULL::uuid
        END) AS nr_flows_completados,
    COALESCE(avg(p.nr_progress_percentage), (0)::numeric) AS media_progresso,
    max(p.dt_ultima_atividade) AS dt_ultima_atividade_onboarding
   FROM (public.tb_users u
     LEFT JOIN public.tb_user_onboarding_progress p ON ((p.id_user = u.id_user)))
  GROUP BY u.id_user, u.nm_email, u.nm_completo;


--
-- Name: VIEW vw_onboarding_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_onboarding_summary IS 'Resumo de onboarding por usuário';


--
-- Name: vw_profissionais_clinicas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_profissionais_clinicas AS
 SELECT pc.id_profissional_clinica,
    p.id_profissional,
    p.nm_profissional,
    p.nr_registro_profissional,
    p.ds_especialidades,
    c.id_clinica,
    c.nm_clinica,
    c.id_empresa,
    e.nm_empresa,
    pc.dt_vinculo,
    pc.dt_desvinculo,
    pc.st_ativo,
    pc.ds_observacoes
   FROM (((public.tb_profissionais_clinicas pc
     JOIN public.tb_profissionais p ON ((pc.id_profissional = p.id_profissional)))
     JOIN public.tb_clinicas c ON ((pc.id_clinica = c.id_clinica)))
     JOIN public.tb_empresas e ON ((c.id_empresa = e.id_empresa)));


--
-- Name: VIEW vw_profissionais_clinicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_profissionais_clinicas IS 'View consolidada com dados completos do relacionamento profissional-clínica';


--
-- Name: vw_rastreamento_estatisticas_transportadora; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_rastreamento_estatisticas_transportadora AS
 SELECT ds_transportadora,
    count(DISTINCT id_pedido) AS total_pedidos,
    count(*) AS total_eventos,
    count(DISTINCT ds_codigo_rastreio) AS total_codigos_rastreio,
    min(dt_captura) AS primeira_captura,
    max(dt_captura) AS ultima_captura,
    avg((EXTRACT(epoch FROM (dt_captura - dt_evento)) / (3600)::numeric)) AS delay_medio_captura_horas
   FROM public.tb_rastreamento_eventos
  GROUP BY ds_transportadora;


--
-- Name: VIEW vw_rastreamento_estatisticas_transportadora; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_rastreamento_estatisticas_transportadora IS 'Estatísticas de rastreamento por transportadora';


--
-- Name: vw_reviews_recentes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_reviews_recentes AS
 SELECT r.id_review,
    r.id_template,
    t.nm_template,
    r.id_user,
    u.nm_email,
    u.nm_completo,
    r.nr_rating,
    r.ds_title,
    r.ds_review,
    r.bl_verified_install,
    r.bl_aprovado,
    r.dt_criacao
   FROM ((public.tb_template_reviews r
     JOIN public.tb_templates t ON ((r.id_template = t.id_template)))
     JOIN public.tb_users u ON ((r.id_user = u.id_user)))
  WHERE (r.bl_aprovado = true)
  ORDER BY r.dt_criacao DESC
 LIMIT 100;


--
-- Name: VIEW vw_reviews_recentes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_reviews_recentes IS 'Reviews aprovadas mais recentes (últimas 100)';


--
-- Name: vw_template_stats_por_categoria; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_template_stats_por_categoria AS
 SELECT nm_category,
    count(*) AS nr_templates,
    sum(nr_install_count) AS nr_total_installs,
    avg(nr_rating_avg) AS avg_rating,
    count(DISTINCT id_user_creator) AS nr_creators
   FROM public.tb_templates
  WHERE ((nm_status)::text = 'published'::text)
  GROUP BY nm_category
  ORDER BY (sum(nr_install_count)) DESC;


--
-- Name: VIEW vw_template_stats_por_categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_template_stats_por_categoria IS 'Estatísticas de templates agrupadas por categoria';


--
-- Name: vw_templates_populares; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_templates_populares AS
 SELECT t.id_template,
    t.nm_template,
    t.ds_template,
    t.nm_category,
    t.nm_status,
    t.nr_install_count,
    t.nr_rating_avg,
    t.nr_rating_count,
    t.dt_publicacao,
    count(DISTINCT i.id_installation) AS nr_active_installs,
    count(DISTINCT r.id_review) AS nr_reviews
   FROM ((public.tb_templates t
     LEFT JOIN public.tb_template_installations i ON (((t.id_template = i.id_template) AND (i.bl_ativo = true))))
     LEFT JOIN public.tb_template_reviews r ON (((t.id_template = r.id_template) AND (r.bl_aprovado = true))))
  WHERE (((t.nm_status)::text = 'published'::text) AND ((t.nm_visibility)::text = 'public'::text))
  GROUP BY t.id_template, t.nm_template, t.ds_template, t.nm_category, t.nm_status, t.nr_install_count, t.nr_rating_avg, t.nr_rating_count, t.dt_publicacao
  ORDER BY t.nr_install_count DESC, t.nr_rating_avg DESC;


--
-- Name: VIEW vw_templates_populares; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_templates_populares IS 'Templates mais populares (publicados, públicos, ordenados por instalações)';


--
-- Name: vw_user_templates; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_user_templates AS
 SELECT u.id_user,
    u.nm_email,
    t.id_template,
    t.nm_template,
    t.nm_category,
        CASE
            WHEN (t.id_user_creator = u.id_user) THEN 'creator'::text
            WHEN (i.id_installation IS NOT NULL) THEN 'installer'::text
            ELSE 'other'::text
        END AS relationship_type,
    t.nr_install_count,
    t.nr_rating_avg,
    i.dt_instalacao,
    i.bl_ativo AS installation_active
   FROM ((public.tb_users u
     LEFT JOIN public.tb_templates t ON ((u.id_user = t.id_user_creator)))
     LEFT JOIN public.tb_template_installations i ON (((u.id_user = i.id_user) AND (t.id_template = i.id_template))))
  WHERE ((t.id_template IS NOT NULL) OR (i.id_installation IS NOT NULL));


--
-- Name: VIEW vw_user_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_user_templates IS 'Templates associados a cada usuário (criados ou instalados)';


--
-- Name: tb_agendamentos tb_agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agendamentos
    ADD CONSTRAINT tb_agendamentos_pkey PRIMARY KEY (id_agendamento);


--
-- Name: tb_agent_document_stores tb_agent_document_stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agent_document_stores
    ADD CONSTRAINT tb_agent_document_stores_pkey PRIMARY KEY (id_agent_document_store);


--
-- Name: tb_agente_tools tb_agente_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agente_tools
    ADD CONSTRAINT tb_agente_tools_pkey PRIMARY KEY (id_agente_tool);


--
-- Name: tb_agentes tb_agentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agentes
    ADD CONSTRAINT tb_agentes_pkey PRIMARY KEY (id_agente);


--
-- Name: tb_albuns tb_albuns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_albuns
    ADD CONSTRAINT tb_albuns_pkey PRIMARY KEY (id_album);


--
-- Name: tb_analytics_events tb_analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_analytics_events
    ADD CONSTRAINT tb_analytics_events_pkey PRIMARY KEY (id_event);


--
-- Name: tb_analytics_snapshots tb_analytics_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_analytics_snapshots
    ADD CONSTRAINT tb_analytics_snapshots_pkey PRIMARY KEY (id_snapshot);


--
-- Name: tb_anamnese_templates tb_anamnese_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamnese_templates
    ADD CONSTRAINT tb_anamnese_templates_pkey PRIMARY KEY (id_template);


--
-- Name: tb_anamneses tb_anamneses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamneses
    ADD CONSTRAINT tb_anamneses_pkey PRIMARY KEY (id_anamnese);


--
-- Name: tb_anexos_mensagens tb_anexos_mensagens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anexos_mensagens
    ADD CONSTRAINT tb_anexos_mensagens_pkey PRIMARY KEY (id_anexo);


--
-- Name: tb_api_keys tb_api_keys_nm_api_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_api_keys
    ADD CONSTRAINT tb_api_keys_nm_api_key_key UNIQUE (nm_api_key);


--
-- Name: tb_api_keys tb_api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_api_keys
    ADD CONSTRAINT tb_api_keys_pkey PRIMARY KEY (id_api_key);


--
-- Name: tb_apikey tb_apikey_apiKey_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_apikey
    ADD CONSTRAINT "tb_apikey_apiKey_key" UNIQUE ("apiKey");


--
-- Name: tb_apikey tb_apikey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_apikey
    ADD CONSTRAINT tb_apikey_pkey PRIMARY KEY (id);


--
-- Name: tb_atendimento_items tb_atendimento_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atendimento_items
    ADD CONSTRAINT tb_atendimento_items_pkey PRIMARY KEY (id_item);


--
-- Name: tb_atividades tb_atividades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atividades
    ADD CONSTRAINT tb_atividades_pkey PRIMARY KEY (id_atividade);


--
-- Name: tb_avaliacoes_agentes tb_avaliacoes_agentes_id_marketplace_agente_id_usuario_id_e_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_agentes
    ADD CONSTRAINT tb_avaliacoes_agentes_id_marketplace_agente_id_usuario_id_e_key UNIQUE (id_marketplace_agente, id_usuario, id_empresa);


--
-- Name: tb_avaliacoes_agentes tb_avaliacoes_agentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_agentes
    ADD CONSTRAINT tb_avaliacoes_agentes_pkey PRIMARY KEY (id_avaliacao);


--
-- Name: tb_avaliacoes_fotos_moderacao tb_avaliacoes_fotos_moderacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_fotos_moderacao
    ADD CONSTRAINT tb_avaliacoes_fotos_moderacao_pkey PRIMARY KEY (id_moderacao);


--
-- Name: tb_avaliacoes_likes tb_avaliacoes_likes_id_avaliacao_id_user_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_likes
    ADD CONSTRAINT tb_avaliacoes_likes_id_avaliacao_id_user_key UNIQUE (id_avaliacao, id_user);


--
-- Name: tb_avaliacoes_likes tb_avaliacoes_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_likes
    ADD CONSTRAINT tb_avaliacoes_likes_pkey PRIMARY KEY (id_like);


--
-- Name: tb_avaliacoes tb_avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes
    ADD CONSTRAINT tb_avaliacoes_pkey PRIMARY KEY (id_avaliacao);


--
-- Name: tb_avaliacoes_produtos tb_avaliacoes_produtos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_produtos
    ADD CONSTRAINT tb_avaliacoes_produtos_pkey PRIMARY KEY (id_avaliacao);


--
-- Name: tb_avaliacoes tb_avaliacoes_tk_verificacao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes
    ADD CONSTRAINT tb_avaliacoes_tk_verificacao_key UNIQUE (tk_verificacao);


--
-- Name: tb_banners tb_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_banners
    ADD CONSTRAINT tb_banners_pkey PRIMARY KEY (id_banner);


--
-- Name: tb_broadcast_campanhas tb_broadcast_campanhas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_campanhas
    ADD CONSTRAINT tb_broadcast_campanhas_pkey PRIMARY KEY (id_campanha);


--
-- Name: tb_broadcast_destinatarios tb_broadcast_destinatarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_destinatarios
    ADD CONSTRAINT tb_broadcast_destinatarios_pkey PRIMARY KEY (id_destinatario);


--
-- Name: tb_broadcast_templates tb_broadcast_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_templates
    ADD CONSTRAINT tb_broadcast_templates_pkey PRIMARY KEY (id_template);


--
-- Name: tb_cache tb_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cache
    ADD CONSTRAINT tb_cache_pkey PRIMARY KEY (nm_chave);


--
-- Name: tb_campanha_destinatarios tb_campanha_destinatarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanha_destinatarios
    ADD CONSTRAINT tb_campanha_destinatarios_pkey PRIMARY KEY (id_destinatario);


--
-- Name: tb_campanhas tb_campanhas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanhas
    ADD CONSTRAINT tb_campanhas_pkey PRIMARY KEY (id_campanha);


--
-- Name: tb_canais_omni tb_canais_omni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_canais_omni
    ADD CONSTRAINT tb_canais_omni_pkey PRIMARY KEY (id_canal);


--
-- Name: tb_candidaturas tb_candidaturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_candidaturas
    ADD CONSTRAINT tb_candidaturas_pkey PRIMARY KEY (id_candidatura);


--
-- Name: tb_carrinho tb_carrinho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_carrinho
    ADD CONSTRAINT tb_carrinho_pkey PRIMARY KEY (id_item_carrinho);


--
-- Name: tb_categorias_financeiras tb_categorias_financeiras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_categorias_financeiras
    ADD CONSTRAINT tb_categorias_financeiras_pkey PRIMARY KEY (id_categoria);


--
-- Name: tb_categorias_produtos tb_categorias_produtos_ds_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_categorias_produtos
    ADD CONSTRAINT tb_categorias_produtos_ds_slug_key UNIQUE (ds_slug);


--
-- Name: tb_categorias_produtos tb_categorias_produtos_nm_categoria_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_categorias_produtos
    ADD CONSTRAINT tb_categorias_produtos_nm_categoria_key UNIQUE (nm_categoria);


--
-- Name: tb_categorias_produtos tb_categorias_produtos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_categorias_produtos
    ADD CONSTRAINT tb_categorias_produtos_pkey PRIMARY KEY (id_categoria);


--
-- Name: tb_chat_message tb_chat_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_chat_message
    ADD CONSTRAINT tb_chat_message_pkey PRIMARY KEY (id_chat_message);


--
-- Name: tb_clinicas tb_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_clinicas
    ADD CONSTRAINT tb_clinicas_pkey PRIMARY KEY (id_clinica);


--
-- Name: tb_cliques_banners tb_cliques_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cliques_banners
    ADD CONSTRAINT tb_cliques_banners_pkey PRIMARY KEY (id_clique);


--
-- Name: tb_comentarios_fotos tb_comentarios_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_comentarios_fotos
    ADD CONSTRAINT tb_comentarios_fotos_pkey PRIMARY KEY (id_comentario);


--
-- Name: tb_compartilhamentos_album tb_compartilhamentos_album_ds_token_compartilhamento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_compartilhamentos_album
    ADD CONSTRAINT tb_compartilhamentos_album_ds_token_compartilhamento_key UNIQUE (ds_token_compartilhamento);


--
-- Name: tb_compartilhamentos_album tb_compartilhamentos_album_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_compartilhamentos_album
    ADD CONSTRAINT tb_compartilhamentos_album_pkey PRIMARY KEY (id_compartilhamento);


--
-- Name: tb_config_central_atendimento tb_config_central_atendimento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_config_central_atendimento
    ADD CONSTRAINT tb_config_central_atendimento_pkey PRIMARY KEY (id_config);


--
-- Name: tb_configuracoes tb_configuracoes_nm_chave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_configuracoes
    ADD CONSTRAINT tb_configuracoes_nm_chave_key UNIQUE (nm_chave);


--
-- Name: tb_configuracoes tb_configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_configuracoes
    ADD CONSTRAINT tb_configuracoes_pkey PRIMARY KEY (id_configuracao);


--
-- Name: tb_contas_bancarias tb_contas_bancarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contas_bancarias
    ADD CONSTRAINT tb_contas_bancarias_pkey PRIMARY KEY (id_conta);


--
-- Name: tb_contatos_omni tb_contatos_omni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contatos_omni
    ADD CONSTRAINT tb_contatos_omni_pkey PRIMARY KEY (id_contato);


--
-- Name: tb_conversas_compartilhadas tb_conversas_compartilhadas_ds_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_compartilhadas
    ADD CONSTRAINT tb_conversas_compartilhadas_ds_token_key UNIQUE (ds_token);


--
-- Name: tb_conversas_compartilhadas tb_conversas_compartilhadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_compartilhadas
    ADD CONSTRAINT tb_conversas_compartilhadas_pkey PRIMARY KEY (id_compartilhamento);


--
-- Name: tb_conversas tb_conversas_ds_token_compartilhamento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas
    ADD CONSTRAINT tb_conversas_ds_token_compartilhamento_key UNIQUE (ds_token_compartilhamento);


--
-- Name: tb_conversas_omni tb_conversas_omni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_omni
    ADD CONSTRAINT tb_conversas_omni_pkey PRIMARY KEY (id_conversa);


--
-- Name: tb_conversas tb_conversas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas
    ADD CONSTRAINT tb_conversas_pkey PRIMARY KEY (id_conversa);


--
-- Name: tb_conversas_usuarios tb_conversas_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_usuarios
    ADD CONSTRAINT tb_conversas_usuarios_pkey PRIMARY KEY (id_conversa);


--
-- Name: tb_credenciais tb_credenciais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_credenciais
    ADD CONSTRAINT tb_credenciais_pkey PRIMARY KEY (id_credencial);


--
-- Name: tb_cupons tb_cupons_ds_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons
    ADD CONSTRAINT tb_cupons_ds_codigo_key UNIQUE (ds_codigo);


--
-- Name: tb_cupons tb_cupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons
    ADD CONSTRAINT tb_cupons_pkey PRIMARY KEY (id_cupom);


--
-- Name: tb_cupons_uso tb_cupons_uso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons_uso
    ADD CONSTRAINT tb_cupons_uso_pkey PRIMARY KEY (id_uso);


--
-- Name: tb_curriculos tb_curriculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_curriculos
    ADD CONSTRAINT tb_curriculos_pkey PRIMARY KEY (id_curriculo);


--
-- Name: tb_curtidas_fotos tb_curtidas_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_curtidas_fotos
    ADD CONSTRAINT tb_curtidas_fotos_pkey PRIMARY KEY (id_curtida);


--
-- Name: tb_dispositivos tb_dispositivos_ds_token_push_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_dispositivos
    ADD CONSTRAINT tb_dispositivos_ds_token_push_key UNIQUE (ds_token_push);


--
-- Name: tb_dispositivos tb_dispositivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_dispositivos
    ADD CONSTRAINT tb_dispositivos_pkey PRIMARY KEY (id_dispositivo);


--
-- Name: tb_documento_store_file_chunk tb_documento_store_file_chunk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_documento_store_file_chunk
    ADD CONSTRAINT tb_documento_store_file_chunk_pkey PRIMARY KEY (id_chunk);


--
-- Name: tb_documento_store tb_documento_store_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_documento_store
    ADD CONSTRAINT tb_documento_store_pkey PRIMARY KEY (id_documento_store);


--
-- Name: tb_documentos tb_documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_documentos
    ADD CONSTRAINT tb_documentos_pkey PRIMARY KEY (id);


--
-- Name: tb_email_logs tb_email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_email_logs
    ADD CONSTRAINT tb_email_logs_pkey PRIMARY KEY (id_email_log);


--
-- Name: tb_empresas tb_empresas_nr_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_empresas
    ADD CONSTRAINT tb_empresas_nr_cnpj_key UNIQUE (nr_cnpj);


--
-- Name: tb_empresas tb_empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_empresas
    ADD CONSTRAINT tb_empresas_pkey PRIMARY KEY (id_empresa);


--
-- Name: tb_execucoes_jobs tb_execucoes_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_execucoes_jobs
    ADD CONSTRAINT tb_execucoes_jobs_pkey PRIMARY KEY (id_execucao);


--
-- Name: tb_export_agendamentos tb_export_agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_export_agendamentos
    ADD CONSTRAINT tb_export_agendamentos_pkey PRIMARY KEY (id_agendamento);


--
-- Name: tb_export_jobs tb_export_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_export_jobs
    ADD CONSTRAINT tb_export_jobs_pkey PRIMARY KEY (id_export);


--
-- Name: tb_faturas tb_faturas_nr_fatura_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_faturas
    ADD CONSTRAINT tb_faturas_nr_fatura_key UNIQUE (nr_fatura);


--
-- Name: tb_faturas tb_faturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_faturas
    ADD CONSTRAINT tb_faturas_pkey PRIMARY KEY (id_fatura);


--
-- Name: tb_favoritos tb_favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_pkey PRIMARY KEY (id_favorito);


--
-- Name: tb_filas_atendimento tb_filas_atendimento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_filas_atendimento
    ADD CONSTRAINT tb_filas_atendimento_pkey PRIMARY KEY (id_fila);


--
-- Name: tb_fornecedores tb_fornecedores_nr_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fornecedores
    ADD CONSTRAINT tb_fornecedores_nr_cnpj_key UNIQUE (nr_cnpj);


--
-- Name: tb_fornecedores tb_fornecedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fornecedores
    ADD CONSTRAINT tb_fornecedores_pkey PRIMARY KEY (id_fornecedor);


--
-- Name: tb_fotos tb_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fotos
    ADD CONSTRAINT tb_fotos_pkey PRIMARY KEY (id_foto);


--
-- Name: tb_historico_configuracoes tb_historico_configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_historico_configuracoes
    ADD CONSTRAINT tb_historico_configuracoes_pkey PRIMARY KEY (id_historico);


--
-- Name: tb_instalacoes_marketplace tb_instalacoes_marketplace_id_marketplace_agente_id_empresa_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_instalacoes_marketplace
    ADD CONSTRAINT tb_instalacoes_marketplace_id_marketplace_agente_id_empresa_key UNIQUE (id_marketplace_agente, id_empresa);


--
-- Name: tb_instalacoes_marketplace tb_instalacoes_marketplace_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_instalacoes_marketplace
    ADD CONSTRAINT tb_instalacoes_marketplace_pkey PRIMARY KEY (id_instalacao);


--
-- Name: tb_invoices tb_invoices_nm_stripe_invoice_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_invoices
    ADD CONSTRAINT tb_invoices_nm_stripe_invoice_id_key UNIQUE (nm_stripe_invoice_id);


--
-- Name: tb_invoices tb_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_invoices
    ADD CONSTRAINT tb_invoices_pkey PRIMARY KEY (id_invoice);


--
-- Name: tb_itens_fatura tb_itens_fatura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_fatura
    ADD CONSTRAINT tb_itens_fatura_pkey PRIMARY KEY (id_item);


--
-- Name: tb_itens_lista_desejos tb_itens_lista_desejos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_lista_desejos
    ADD CONSTRAINT tb_itens_lista_desejos_pkey PRIMARY KEY (id_item);


--
-- Name: tb_itens_pedido tb_itens_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_pedido
    ADD CONSTRAINT tb_itens_pedido_pkey PRIMARY KEY (id_item);


--
-- Name: tb_itens_repasse tb_itens_repasse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_repasse
    ADD CONSTRAINT tb_itens_repasse_pkey PRIMARY KEY (id_item);


--
-- Name: tb_jobs tb_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_jobs
    ADD CONSTRAINT tb_jobs_pkey PRIMARY KEY (id_job);


--
-- Name: tb_lead_score_historico tb_lead_score_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lead_score_historico
    ADD CONSTRAINT tb_lead_score_historico_pkey PRIMARY KEY (id_historico);


--
-- Name: tb_lead_scores tb_lead_scores_id_contato_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lead_scores
    ADD CONSTRAINT tb_lead_scores_id_contato_key UNIQUE (id_contato);


--
-- Name: tb_lead_scores tb_lead_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lead_scores
    ADD CONSTRAINT tb_lead_scores_pkey PRIMARY KEY (id_score);


--
-- Name: tb_leitura_mensagens tb_leitura_mensagens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_leitura_mensagens
    ADD CONSTRAINT tb_leitura_mensagens_pkey PRIMARY KEY (id_leitura);


--
-- Name: tb_lembretes tb_lembretes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lembretes
    ADD CONSTRAINT tb_lembretes_pkey PRIMARY KEY (id_lembrete);


--
-- Name: tb_listas_desejos tb_listas_desejos_ds_token_compartilhamento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_listas_desejos
    ADD CONSTRAINT tb_listas_desejos_ds_token_compartilhamento_key UNIQUE (ds_token_compartilhamento);


--
-- Name: tb_listas_desejos tb_listas_desejos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_listas_desejos
    ADD CONSTRAINT tb_listas_desejos_pkey PRIMARY KEY (id_lista);


--
-- Name: tb_logs_acesso tb_logs_acesso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_acesso
    ADD CONSTRAINT tb_logs_acesso_pkey PRIMARY KEY (id_log);


--
-- Name: tb_logs_erro tb_logs_erro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_erro
    ADD CONSTRAINT tb_logs_erro_pkey PRIMARY KEY (id_log);


--
-- Name: tb_logs_integracao tb_logs_integracao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_integracao
    ADD CONSTRAINT tb_logs_integracao_pkey PRIMARY KEY (id_log);


--
-- Name: tb_marketplace_agentes tb_marketplace_agentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_marketplace_agentes
    ADD CONSTRAINT tb_marketplace_agentes_pkey PRIMARY KEY (id_marketplace_agente);


--
-- Name: tb_mensagens_agendadas tb_mensagens_agendadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_agendadas
    ADD CONSTRAINT tb_mensagens_agendadas_pkey PRIMARY KEY (id_mensagem_agendada);


--
-- Name: tb_mensagens_omni tb_mensagens_omni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_omni
    ADD CONSTRAINT tb_mensagens_omni_pkey PRIMARY KEY (id_mensagem);


--
-- Name: tb_mensagens tb_mensagens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens
    ADD CONSTRAINT tb_mensagens_pkey PRIMARY KEY (id_mensagem);


--
-- Name: tb_mensagens_usuarios tb_mensagens_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_usuarios
    ADD CONSTRAINT tb_mensagens_usuarios_pkey PRIMARY KEY (id_mensagem);


--
-- Name: tb_messages tb_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_messages
    ADD CONSTRAINT tb_messages_pkey PRIMARY KEY (id_message);


--
-- Name: tb_movimentacoes_estoque tb_movimentacoes_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_movimentacoes_estoque
    ADD CONSTRAINT tb_movimentacoes_estoque_pkey PRIMARY KEY (id_movimentacao);


--
-- Name: tb_notas_fiscais tb_notas_fiscais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notas_fiscais
    ADD CONSTRAINT tb_notas_fiscais_pkey PRIMARY KEY (id_nota_fiscal);


--
-- Name: tb_notificacoes tb_notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notificacoes
    ADD CONSTRAINT tb_notificacoes_pkey PRIMARY KEY (id_notificacao);


--
-- Name: tb_onboarding_events tb_onboarding_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_onboarding_events
    ADD CONSTRAINT tb_onboarding_events_pkey PRIMARY KEY (id_event);


--
-- Name: tb_onboarding_flows tb_onboarding_flows_nm_flow_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_onboarding_flows
    ADD CONSTRAINT tb_onboarding_flows_nm_flow_key UNIQUE (nm_flow);


--
-- Name: tb_onboarding_flows tb_onboarding_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_onboarding_flows
    ADD CONSTRAINT tb_onboarding_flows_pkey PRIMARY KEY (id_flow);


--
-- Name: tb_pacientes tb_pacientes_nr_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pacientes
    ADD CONSTRAINT tb_pacientes_nr_cpf_key UNIQUE (nr_cpf);


--
-- Name: tb_pacientes tb_pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pacientes
    ADD CONSTRAINT tb_pacientes_pkey PRIMARY KEY (id_paciente);


--
-- Name: tb_pagamentos tb_pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pagamentos
    ADD CONSTRAINT tb_pagamentos_pkey PRIMARY KEY (id_pagamento);


--
-- Name: tb_participantes_conversa tb_participantes_conversa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_participantes_conversa
    ADD CONSTRAINT tb_participantes_conversa_pkey PRIMARY KEY (id_participante);


--
-- Name: tb_partner_lead_questions tb_partner_lead_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_lead_questions
    ADD CONSTRAINT tb_partner_lead_questions_pkey PRIMARY KEY (id_question);


--
-- Name: tb_partner_lead_services tb_partner_lead_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_lead_services
    ADD CONSTRAINT tb_partner_lead_services_pkey PRIMARY KEY (id_partner_lead_service);


--
-- Name: tb_partner_leads tb_partner_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_leads
    ADD CONSTRAINT tb_partner_leads_pkey PRIMARY KEY (id_partner_lead);


--
-- Name: tb_partner_licenses tb_partner_licenses_cd_license_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_licenses
    ADD CONSTRAINT tb_partner_licenses_cd_license_key UNIQUE (cd_license);


--
-- Name: tb_partner_licenses tb_partner_licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_licenses
    ADD CONSTRAINT tb_partner_licenses_pkey PRIMARY KEY (id_partner_license);


--
-- Name: tb_partner_package_history tb_partner_package_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_history
    ADD CONSTRAINT tb_partner_package_history_pkey PRIMARY KEY (id_history);


--
-- Name: tb_partner_package_items tb_partner_package_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_items
    ADD CONSTRAINT tb_partner_package_items_pkey PRIMARY KEY (id_partner_package_item);


--
-- Name: tb_partner_packages tb_partner_packages_cd_package_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_packages
    ADD CONSTRAINT tb_partner_packages_cd_package_key UNIQUE (cd_package);


--
-- Name: tb_partner_packages tb_partner_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_packages
    ADD CONSTRAINT tb_partner_packages_pkey PRIMARY KEY (id_partner_package);


--
-- Name: tb_partner_service_definitions tb_partner_service_definitions_cd_service_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_service_definitions
    ADD CONSTRAINT tb_partner_service_definitions_cd_service_key UNIQUE (cd_service);


--
-- Name: tb_partner_service_definitions tb_partner_service_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_service_definitions
    ADD CONSTRAINT tb_partner_service_definitions_pkey PRIMARY KEY (id_service);


--
-- Name: tb_password_reset_tokens tb_password_reset_tokens_ds_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_password_reset_tokens
    ADD CONSTRAINT tb_password_reset_tokens_ds_token_key UNIQUE (ds_token);


--
-- Name: tb_password_reset_tokens tb_password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_password_reset_tokens
    ADD CONSTRAINT tb_password_reset_tokens_pkey PRIMARY KEY (id_token);


--
-- Name: tb_payments tb_payments_nm_stripe_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_payments
    ADD CONSTRAINT tb_payments_nm_stripe_payment_id_key UNIQUE (nm_stripe_payment_id);


--
-- Name: tb_payments tb_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_payments
    ADD CONSTRAINT tb_payments_pkey PRIMARY KEY (id_payment);


--
-- Name: tb_pedido_historico tb_pedido_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedido_historico
    ADD CONSTRAINT tb_pedido_historico_pkey PRIMARY KEY (id_historico);


--
-- Name: tb_pedidos tb_pedidos_nr_pedido_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedidos
    ADD CONSTRAINT tb_pedidos_nr_pedido_key UNIQUE (nr_pedido);


--
-- Name: tb_pedidos tb_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedidos
    ADD CONSTRAINT tb_pedidos_pkey PRIMARY KEY (id_pedido);


--
-- Name: tb_perfis tb_perfis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_perfis
    ADD CONSTRAINT tb_perfis_pkey PRIMARY KEY (id_perfil);


--
-- Name: tb_pesquisas tb_pesquisas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pesquisas
    ADD CONSTRAINT tb_pesquisas_pkey PRIMARY KEY (id_pesquisa);


--
-- Name: tb_plans tb_plans_nm_plan_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_plans
    ADD CONSTRAINT tb_plans_nm_plan_key UNIQUE (nm_plan);


--
-- Name: tb_plans tb_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_plans
    ADD CONSTRAINT tb_plans_pkey PRIMARY KEY (id_plan);


--
-- Name: tb_preferencias_notificacao tb_preferencias_notificacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_preferencias_notificacao
    ADD CONSTRAINT tb_preferencias_notificacao_pkey PRIMARY KEY (id_preferencia);


--
-- Name: tb_procedimentos tb_procedimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_procedimentos
    ADD CONSTRAINT tb_procedimentos_pkey PRIMARY KEY (id_procedimento);


--
-- Name: tb_produto_variacoes tb_produto_variacoes_ds_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produto_variacoes
    ADD CONSTRAINT tb_produto_variacoes_ds_sku_key UNIQUE (ds_sku);


--
-- Name: tb_produto_variacoes tb_produto_variacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produto_variacoes
    ADD CONSTRAINT tb_produto_variacoes_pkey PRIMARY KEY (id_variacao);


--
-- Name: tb_produtos tb_produtos_ds_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produtos
    ADD CONSTRAINT tb_produtos_ds_sku_key UNIQUE (ds_sku);


--
-- Name: tb_produtos tb_produtos_ds_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produtos
    ADD CONSTRAINT tb_produtos_ds_slug_key UNIQUE (ds_slug);


--
-- Name: tb_produtos tb_produtos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produtos
    ADD CONSTRAINT tb_produtos_pkey PRIMARY KEY (id_produto);


--
-- Name: tb_profissionais_clinicas tb_profissionais_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_profissionais_clinicas
    ADD CONSTRAINT tb_profissionais_clinicas_pkey PRIMARY KEY (id_profissional_clinica);


--
-- Name: tb_profissionais tb_profissionais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_profissionais
    ADD CONSTRAINT tb_profissionais_pkey PRIMARY KEY (id_profissional);


--
-- Name: tb_prompt_biblioteca tb_prompt_biblioteca_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_prompt_biblioteca
    ADD CONSTRAINT tb_prompt_biblioteca_pkey PRIMARY KEY (id_prompt);


--
-- Name: tb_prontuarios tb_prontuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_prontuarios
    ADD CONSTRAINT tb_prontuarios_pkey PRIMARY KEY (id_prontuario);


--
-- Name: tb_qrcodes_avaliacao tb_qrcodes_avaliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_qrcodes_avaliacao
    ADD CONSTRAINT tb_qrcodes_avaliacao_pkey PRIMARY KEY (id_qrcode);


--
-- Name: tb_qrcodes_avaliacao tb_qrcodes_avaliacao_tk_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_qrcodes_avaliacao
    ADD CONSTRAINT tb_qrcodes_avaliacao_tk_codigo_key UNIQUE (tk_codigo);


--
-- Name: tb_rastreamento_eventos tb_rastreamento_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_rastreamento_eventos
    ADD CONSTRAINT tb_rastreamento_eventos_pkey PRIMARY KEY (id_evento);


--
-- Name: tb_record_manager tb_record_manager_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_record_manager
    ADD CONSTRAINT tb_record_manager_pkey PRIMARY KEY (id_record);


--
-- Name: tb_repasses tb_repasses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_repasses
    ADD CONSTRAINT tb_repasses_pkey PRIMARY KEY (id_repasse);


--
-- Name: tb_reservas_estoque tb_reservas_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reservas_estoque
    ADD CONSTRAINT tb_reservas_estoque_pkey PRIMARY KEY (id_reserva);


--
-- Name: tb_respostas_pesquisas tb_respostas_pesquisas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_pesquisas
    ADD CONSTRAINT tb_respostas_pesquisas_pkey PRIMARY KEY (id_resposta);


--
-- Name: tb_respostas_rapidas tb_respostas_rapidas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_rapidas
    ADD CONSTRAINT tb_respostas_rapidas_pkey PRIMARY KEY (id_resposta);


--
-- Name: tb_sessoes tb_sessoes_ds_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_sessoes
    ADD CONSTRAINT tb_sessoes_ds_refresh_token_key UNIQUE (ds_refresh_token);


--
-- Name: tb_sessoes tb_sessoes_ds_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_sessoes
    ADD CONSTRAINT tb_sessoes_ds_token_key UNIQUE (ds_token);


--
-- Name: tb_sessoes tb_sessoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_sessoes
    ADD CONSTRAINT tb_sessoes_pkey PRIMARY KEY (id_sessao);


--
-- Name: tb_subscriptions tb_subscriptions_nm_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_subscriptions
    ADD CONSTRAINT tb_subscriptions_nm_stripe_subscription_id_key UNIQUE (nm_stripe_subscription_id);


--
-- Name: tb_subscriptions tb_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_subscriptions
    ADD CONSTRAINT tb_subscriptions_pkey PRIMARY KEY (id_subscription);


--
-- Name: tb_template_installations tb_template_installations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_installations
    ADD CONSTRAINT tb_template_installations_pkey PRIMARY KEY (id_installation);


--
-- Name: tb_template_reviews tb_template_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_reviews
    ADD CONSTRAINT tb_template_reviews_pkey PRIMARY KEY (id_review);


--
-- Name: tb_templates_mensagens tb_templates_mensagens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_templates_mensagens
    ADD CONSTRAINT tb_templates_mensagens_pkey PRIMARY KEY (id_template);


--
-- Name: tb_templates tb_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_templates
    ADD CONSTRAINT tb_templates_pkey PRIMARY KEY (id_template);


--
-- Name: tb_tools tb_tools_nm_tool_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_tools
    ADD CONSTRAINT tb_tools_nm_tool_key UNIQUE (nm_tool);


--
-- Name: tb_tools tb_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_tools
    ADD CONSTRAINT tb_tools_pkey PRIMARY KEY (id_tool);


--
-- Name: tb_transacoes_pagamento tb_transacoes_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes_pagamento
    ADD CONSTRAINT tb_transacoes_pagamento_pkey PRIMARY KEY (id_transacao);


--
-- Name: tb_transacoes tb_transacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes
    ADD CONSTRAINT tb_transacoes_pkey PRIMARY KEY (id_transacao);


--
-- Name: tb_usage_metrics tb_usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_usage_metrics
    ADD CONSTRAINT tb_usage_metrics_pkey PRIMARY KEY (id_metric);


--
-- Name: tb_user_onboarding_progress tb_user_onboarding_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_user_onboarding_progress
    ADD CONSTRAINT tb_user_onboarding_progress_pkey PRIMARY KEY (id_progress);


--
-- Name: tb_users tb_users_nm_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_users
    ADD CONSTRAINT tb_users_nm_email_key UNIQUE (nm_email);


--
-- Name: tb_users tb_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_users
    ADD CONSTRAINT tb_users_pkey PRIMARY KEY (id_user);


--
-- Name: tb_vagas tb_vagas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_vagas
    ADD CONSTRAINT tb_vagas_pkey PRIMARY KEY (id_vaga);


--
-- Name: tb_variaveis tb_variaveis_nm_variavel_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_variaveis
    ADD CONSTRAINT tb_variaveis_nm_variavel_key UNIQUE (nm_variavel);


--
-- Name: tb_variaveis tb_variaveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_variaveis
    ADD CONSTRAINT tb_variaveis_pkey PRIMARY KEY (id_variavel);


--
-- Name: tb_webhook_deliveries tb_webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_webhook_deliveries
    ADD CONSTRAINT tb_webhook_deliveries_pkey PRIMARY KEY (id_delivery);


--
-- Name: tb_webhooks tb_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_webhooks
    ADD CONSTRAINT tb_webhooks_pkey PRIMARY KEY (id_webhook);


--
-- Name: tb_respostas_rapidas uk_atalho_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_rapidas
    ADD CONSTRAINT uk_atalho_user UNIQUE (id_user, ds_atalho);


--
-- Name: tb_broadcast_destinatarios uk_broadcast_campanha_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_destinatarios
    ADD CONSTRAINT uk_broadcast_campanha_user UNIQUE (id_campanha, id_user);


--
-- Name: tb_campanha_destinatarios uk_campanha_contato; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanha_destinatarios
    ADD CONSTRAINT uk_campanha_contato UNIQUE (id_campanha, id_contato);


--
-- Name: tb_canais_omni uk_canal_empresa_tipo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_canais_omni
    ADD CONSTRAINT uk_canal_empresa_tipo UNIQUE (id_empresa, tp_canal, id_telefone_whatsapp);


--
-- Name: tb_clinicas uk_clinicas_cnpj; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_clinicas
    ADD CONSTRAINT uk_clinicas_cnpj UNIQUE (nr_cnpj);


--
-- Name: tb_contatos_omni uk_contato_empresa_telefone; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contatos_omni
    ADD CONSTRAINT uk_contato_empresa_telefone UNIQUE (id_empresa, nr_telefone);


--
-- Name: tb_notas_fiscais uk_nr_nota; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notas_fiscais
    ADD CONSTRAINT uk_nr_nota UNIQUE (id_empresa, nr_nota, ds_serie);


--
-- Name: tb_profissionais_clinicas uk_profissional_clinica_ativo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_profissionais_clinicas
    ADD CONSTRAINT uk_profissional_clinica_ativo UNIQUE (id_profissional, id_clinica, st_ativo);


--
-- Name: tb_rastreamento_eventos uk_rastreamento_evento; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_rastreamento_eventos
    ADD CONSTRAINT uk_rastreamento_evento UNIQUE (id_pedido, ds_codigo_rastreio, dt_evento, ds_status);


--
-- Name: tb_preferencias_notificacao uk_user_canal; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_preferencias_notificacao
    ADD CONSTRAINT uk_user_canal UNIQUE (id_user, ds_canal);


--
-- Name: tb_participantes_conversa uk_user_conversa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_participantes_conversa
    ADD CONSTRAINT uk_user_conversa UNIQUE (id_conversa, id_user);


--
-- Name: tb_curtidas_fotos uk_user_foto_curtida; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_curtidas_fotos
    ADD CONSTRAINT uk_user_foto_curtida UNIQUE (id_foto, id_user);


--
-- Name: tb_leitura_mensagens uk_user_mensagem_leitura; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_leitura_mensagens
    ADD CONSTRAINT uk_user_mensagem_leitura UNIQUE (id_mensagem, id_user);


--
-- Name: tb_users unique_provider_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_users
    ADD CONSTRAINT unique_provider_id UNIQUE (nm_provider, ds_provider_id);


--
-- Name: tb_partner_lead_services uq_partner_lead_service; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_lead_services
    ADD CONSTRAINT uq_partner_lead_service UNIQUE (id_partner_lead, id_service);


--
-- Name: tb_partner_package_items uq_partner_package_item; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_items
    ADD CONSTRAINT uq_partner_package_item UNIQUE (id_partner_package, id_service);


--
-- Name: tb_analytics_snapshots uq_snapshot_date_metric; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_analytics_snapshots
    ADD CONSTRAINT uq_snapshot_date_metric UNIQUE (dt_snapshot, nm_metric_type);


--
-- Name: tb_template_installations uq_template_user_active; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_installations
    ADD CONSTRAINT uq_template_user_active UNIQUE (id_template, id_user);


--
-- Name: tb_template_reviews uq_template_user_review; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_reviews
    ADD CONSTRAINT uq_template_user_review UNIQUE (id_template, id_user);


--
-- Name: tb_user_onboarding_progress uq_user_flow; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_user_onboarding_progress
    ADD CONSTRAINT uq_user_flow UNIQUE (id_user, id_flow);


--
-- Name: idx_agendamentos_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_clinica ON public.tb_agendamentos USING btree (id_clinica);


--
-- Name: idx_agendamentos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_data ON public.tb_agendamentos USING btree (dt_agendamento);


--
-- Name: idx_agendamentos_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_paciente ON public.tb_agendamentos USING btree (id_paciente);


--
-- Name: idx_agendamentos_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_profissional ON public.tb_agendamentos USING btree (id_profissional);


--
-- Name: idx_agendamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_status ON public.tb_agendamentos USING btree (ds_status);


--
-- Name: idx_agentes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agentes_empresa ON public.tb_agentes USING btree (id_empresa);


--
-- Name: idx_agentes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agentes_tipo ON public.tb_agentes USING btree (ds_tipo);


--
-- Name: idx_albuns_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_albuns_empresa ON public.tb_albuns USING btree (id_empresa);


--
-- Name: idx_albuns_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_albuns_paciente ON public.tb_albuns USING btree (id_paciente);


--
-- Name: idx_albuns_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_albuns_profissional ON public.tb_albuns USING btree (id_profissional);


--
-- Name: idx_albuns_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_albuns_tipo ON public.tb_albuns USING btree (ds_tipo);


--
-- Name: idx_albuns_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_albuns_user ON public.tb_albuns USING btree (id_user);


--
-- Name: idx_albuns_visibilidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_albuns_visibilidade ON public.tb_albuns USING btree (ds_visibilidade);


--
-- Name: idx_analytics_events_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_data ON public.tb_analytics_events USING gin (ds_event_data);


--
-- Name: idx_analytics_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_date ON public.tb_analytics_events USING btree (dt_event DESC);


--
-- Name: idx_analytics_events_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_empresa ON public.tb_analytics_events USING btree (id_empresa);


--
-- Name: idx_analytics_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_type ON public.tb_analytics_events USING btree (nm_event_type);


--
-- Name: idx_analytics_events_type_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_type_date ON public.tb_analytics_events USING btree (nm_event_type, dt_event DESC);


--
-- Name: idx_analytics_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_user ON public.tb_analytics_events USING btree (id_user);


--
-- Name: idx_analytics_events_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_user_date ON public.tb_analytics_events USING btree (id_user, dt_event DESC);


--
-- Name: idx_analytics_snapshots_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_date ON public.tb_analytics_snapshots USING btree (dt_snapshot DESC);


--
-- Name: idx_analytics_snapshots_metric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_metric ON public.tb_analytics_snapshots USING btree (nm_metric_type);


--
-- Name: idx_analytics_snapshots_metric_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_metric_date ON public.tb_analytics_snapshots USING btree (nm_metric_type, dt_snapshot DESC);


--
-- Name: idx_anamnese_templates_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamnese_templates_ativo ON public.tb_anamnese_templates USING btree (fg_ativo) WHERE (fg_ativo = true);


--
-- Name: idx_anamnese_templates_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamnese_templates_empresa ON public.tb_anamnese_templates USING btree (id_empresa);


--
-- Name: idx_anamnese_templates_perguntas_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamnese_templates_perguntas_gin ON public.tb_anamnese_templates USING gin (ds_perguntas);


--
-- Name: idx_anamnese_templates_publico; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamnese_templates_publico ON public.tb_anamnese_templates USING btree (fg_publico) WHERE (fg_publico = true);


--
-- Name: idx_anamnese_templates_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamnese_templates_tipo ON public.tb_anamnese_templates USING btree (tp_template);


--
-- Name: idx_anamneses_alertas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_alertas ON public.tb_anamneses USING btree (fg_alertas_criticos) WHERE (fg_alertas_criticos = true);


--
-- Name: idx_anamneses_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_ativo ON public.tb_anamneses USING btree (fg_ativo) WHERE (fg_ativo = true);


--
-- Name: idx_anamneses_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_dt_criacao ON public.tb_anamneses USING btree (dt_criacao DESC);


--
-- Name: idx_anamneses_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_empresa ON public.tb_anamneses USING btree (id_empresa);


--
-- Name: idx_anamneses_empresa_alertas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_empresa_alertas ON public.tb_anamneses USING btree (id_empresa, fg_alertas_criticos) WHERE (fg_alertas_criticos = true);


--
-- Name: idx_anamneses_empresa_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_empresa_paciente ON public.tb_anamneses USING btree (id_empresa, id_paciente);


--
-- Name: idx_anamneses_empresa_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_empresa_profissional ON public.tb_anamneses USING btree (id_empresa, id_profissional);


--
-- Name: idx_anamneses_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_paciente ON public.tb_anamneses USING btree (id_paciente);


--
-- Name: idx_anamneses_procedimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_procedimento ON public.tb_anamneses USING btree (id_procedimento);


--
-- Name: idx_anamneses_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_profissional ON public.tb_anamneses USING btree (id_profissional);


--
-- Name: idx_anamneses_respostas_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_respostas_gin ON public.tb_anamneses USING gin (ds_respostas);


--
-- Name: idx_anamneses_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anamneses_template ON public.tb_anamneses USING btree (id_template);


--
-- Name: idx_anexos_mensagens_mensagem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anexos_mensagens_mensagem ON public.tb_anexos_mensagens USING btree (id_mensagem);


--
-- Name: idx_anexos_mensagens_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anexos_mensagens_tipo ON public.tb_anexos_mensagens USING btree (ds_tipo_mime);


--
-- Name: idx_api_keys_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_key ON public.tb_api_keys USING btree (nm_api_key);


--
-- Name: idx_api_keys_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_user ON public.tb_api_keys USING btree (id_user);


--
-- Name: idx_atendimento_items_atendente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimento_items_atendente ON public.tb_atendimento_items USING btree (id_atendente);


--
-- Name: idx_atendimento_items_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimento_items_conversa ON public.tb_atendimento_items USING btree (id_conversa);


--
-- Name: idx_atendimento_items_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimento_items_empresa ON public.tb_atendimento_items USING btree (id_empresa);


--
-- Name: idx_atendimento_items_fila; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimento_items_fila ON public.tb_atendimento_items USING btree (id_fila);


--
-- Name: idx_atendimento_items_fila_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimento_items_fila_status ON public.tb_atendimento_items USING btree (id_fila, st_atendimento);


--
-- Name: idx_atendimento_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atendimento_items_status ON public.tb_atendimento_items USING btree (st_atendimento);


--
-- Name: idx_atividades_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atividades_criacao ON public.tb_atividades USING btree (dt_criacao DESC);


--
-- Name: idx_atividades_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atividades_empresa ON public.tb_atividades USING btree (id_empresa);


--
-- Name: idx_atividades_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atividades_entidade ON public.tb_atividades USING btree (ds_entidade);


--
-- Name: idx_atividades_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atividades_entidade_id ON public.tb_atividades USING btree (id_entidade);


--
-- Name: idx_atividades_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atividades_tipo ON public.tb_atividades USING btree (ds_tipo);


--
-- Name: idx_atividades_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atividades_user ON public.tb_atividades USING btree (id_user);


--
-- Name: idx_avaliacoes_aprovada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_aprovada ON public.tb_avaliacoes USING btree (st_aprovada);


--
-- Name: idx_avaliacoes_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_clinica ON public.tb_avaliacoes USING btree (id_clinica);


--
-- Name: idx_avaliacoes_likes_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_likes_avaliacao ON public.tb_avaliacoes_likes USING btree (id_avaliacao);


--
-- Name: idx_avaliacoes_likes_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_likes_count ON public.tb_avaliacoes USING btree (nr_likes DESC);


--
-- Name: idx_avaliacoes_likes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_likes_user ON public.tb_avaliacoes_likes USING btree (id_user);


--
-- Name: idx_avaliacoes_marketplace_agente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_marketplace_agente ON public.tb_avaliacoes_agentes USING btree (id_marketplace_agente);


--
-- Name: idx_avaliacoes_nota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_nota ON public.tb_avaliacoes USING btree (nr_nota DESC);


--
-- Name: idx_avaliacoes_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_paciente ON public.tb_avaliacoes USING btree (id_paciente);


--
-- Name: idx_avaliacoes_procedimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_procedimento ON public.tb_avaliacoes USING btree (id_procedimento);


--
-- Name: idx_avaliacoes_produtos_aprovada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_produtos_aprovada ON public.tb_avaliacoes_produtos USING btree (st_aprovada);


--
-- Name: idx_avaliacoes_produtos_nota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_produtos_nota ON public.tb_avaliacoes_produtos USING btree (nr_nota);


--
-- Name: idx_avaliacoes_produtos_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_produtos_produto ON public.tb_avaliacoes_produtos USING btree (id_produto);


--
-- Name: idx_avaliacoes_produtos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_produtos_user ON public.tb_avaliacoes_produtos USING btree (id_user);


--
-- Name: idx_avaliacoes_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_profissional ON public.tb_avaliacoes USING btree (id_profissional);


--
-- Name: idx_avaliacoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_usuario ON public.tb_avaliacoes_agentes USING btree (id_usuario);


--
-- Name: idx_avaliacoes_verificada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_verificada ON public.tb_avaliacoes USING btree (st_verificada);


--
-- Name: idx_banners_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_ativo ON public.tb_banners USING btree (st_ativo);


--
-- Name: idx_banners_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_empresa ON public.tb_banners USING btree (id_empresa);


--
-- Name: idx_banners_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_periodo ON public.tb_banners USING btree (dt_inicio, dt_fim);


--
-- Name: idx_banners_posicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banners_posicao ON public.tb_banners USING btree (ds_posicao);


--
-- Name: idx_broadcast_campanhas_agendadas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_agendadas ON public.tb_broadcast_campanhas USING btree (st_campanha, dt_agendamento) WHERE ((st_campanha)::text = 'agendada'::text);


--
-- Name: idx_broadcast_campanhas_canal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_canal ON public.tb_broadcast_campanhas USING btree (tp_canal);


--
-- Name: idx_broadcast_campanhas_criador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_criador ON public.tb_broadcast_campanhas USING btree (id_user_criador);


--
-- Name: idx_broadcast_campanhas_dt_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_dt_agendamento ON public.tb_broadcast_campanhas USING btree (dt_agendamento) WHERE (dt_agendamento IS NOT NULL);


--
-- Name: idx_broadcast_campanhas_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_dt_criacao ON public.tb_broadcast_campanhas USING btree (dt_criacao DESC);


--
-- Name: idx_broadcast_campanhas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_empresa ON public.tb_broadcast_campanhas USING btree (id_empresa);


--
-- Name: idx_broadcast_campanhas_filtros_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_filtros_gin ON public.tb_broadcast_campanhas USING gin (ds_filtros_segmentacao);


--
-- Name: idx_broadcast_campanhas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_campanhas_status ON public.tb_broadcast_campanhas USING btree (st_campanha);


--
-- Name: idx_broadcast_destinatarios_campanha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_destinatarios_campanha ON public.tb_broadcast_destinatarios USING btree (id_campanha);


--
-- Name: idx_broadcast_destinatarios_campanha_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_destinatarios_campanha_status ON public.tb_broadcast_destinatarios USING btree (id_campanha, st_envio);


--
-- Name: idx_broadcast_destinatarios_dt_enviado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_destinatarios_dt_enviado ON public.tb_broadcast_destinatarios USING btree (dt_enviado DESC);


--
-- Name: idx_broadcast_destinatarios_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_destinatarios_status ON public.tb_broadcast_destinatarios USING btree (st_envio);


--
-- Name: idx_broadcast_destinatarios_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_destinatarios_user ON public.tb_broadcast_destinatarios USING btree (id_user);


--
-- Name: idx_broadcast_templates_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_templates_ativo ON public.tb_broadcast_templates USING btree (fg_ativo);


--
-- Name: idx_broadcast_templates_canal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_templates_canal ON public.tb_broadcast_templates USING btree (tp_canal);


--
-- Name: idx_broadcast_templates_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broadcast_templates_empresa ON public.tb_broadcast_templates USING btree (id_empresa);


--
-- Name: idx_cache_expiracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cache_expiracao ON public.tb_cache USING btree (dt_expiracao);


--
-- Name: idx_cache_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cache_tags ON public.tb_cache USING gin (ds_tags);


--
-- Name: idx_campanha_dest_campanha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanha_dest_campanha ON public.tb_campanha_destinatarios USING btree (id_campanha);


--
-- Name: idx_campanha_dest_contato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanha_dest_contato ON public.tb_campanha_destinatarios USING btree (id_contato);


--
-- Name: idx_campanha_dest_enviado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanha_dest_enviado ON public.tb_campanha_destinatarios USING btree (st_enviado);


--
-- Name: idx_campanhas_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_agendamento ON public.tb_campanhas USING btree (dt_agendamento);


--
-- Name: idx_campanhas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_empresa ON public.tb_campanhas USING btree (id_empresa);


--
-- Name: idx_campanhas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_status ON public.tb_campanhas USING btree (st_campanha);


--
-- Name: idx_campanhas_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_tipo ON public.tb_campanhas USING btree (tp_campanha);


--
-- Name: idx_canais_omni_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_canais_omni_ativo ON public.tb_canais_omni USING btree (st_ativo);


--
-- Name: idx_canais_omni_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_canais_omni_empresa ON public.tb_canais_omni USING btree (id_empresa);


--
-- Name: idx_canais_omni_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_canais_omni_tipo ON public.tb_canais_omni USING btree (tp_canal);


--
-- Name: idx_carrinho_procedimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carrinho_procedimento ON public.tb_carrinho USING btree (id_procedimento);


--
-- Name: idx_carrinho_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carrinho_produto ON public.tb_carrinho USING btree (id_produto);


--
-- Name: idx_carrinho_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carrinho_profissional ON public.tb_carrinho USING btree (id_profissional_desejado);


--
-- Name: idx_carrinho_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carrinho_user ON public.tb_carrinho USING btree (id_user);


--
-- Name: idx_categorias_financeiras_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_financeiras_empresa ON public.tb_categorias_financeiras USING btree (id_empresa);


--
-- Name: idx_categorias_financeiras_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_financeiras_tipo ON public.tb_categorias_financeiras USING btree (ds_tipo);


--
-- Name: idx_categorias_produtos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_produtos_ativo ON public.tb_categorias_produtos USING btree (st_ativo);


--
-- Name: idx_categorias_produtos_pai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_produtos_pai ON public.tb_categorias_produtos USING btree (id_categoria_pai);


--
-- Name: idx_categorias_produtos_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_produtos_slug ON public.tb_categorias_produtos USING btree (ds_slug);


--
-- Name: idx_clinicas_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_ativo ON public.tb_clinicas USING btree (st_ativo);


--
-- Name: idx_clinicas_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_avaliacao ON public.tb_clinicas USING btree (nr_avaliacao_media);


--
-- Name: idx_clinicas_cidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_cidade ON public.tb_clinicas USING btree (nm_cidade);


--
-- Name: idx_clinicas_cidade_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_cidade_estado ON public.tb_clinicas USING btree (nm_cidade, nm_estado);


--
-- Name: idx_clinicas_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_cnpj ON public.tb_clinicas USING btree (nr_cnpj);


--
-- Name: idx_clinicas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_empresa ON public.tb_clinicas USING btree (id_empresa);


--
-- Name: idx_cliques_banners_banner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliques_banners_banner ON public.tb_cliques_banners USING btree (id_banner);


--
-- Name: idx_cliques_banners_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliques_banners_user ON public.tb_cliques_banners USING btree (id_user);


--
-- Name: idx_comentarios_fotos_foto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comentarios_fotos_foto ON public.tb_comentarios_fotos USING btree (id_foto);


--
-- Name: idx_comentarios_fotos_pai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comentarios_fotos_pai ON public.tb_comentarios_fotos USING btree (id_comentario_pai);


--
-- Name: idx_comentarios_fotos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comentarios_fotos_user ON public.tb_comentarios_fotos USING btree (id_user);


--
-- Name: idx_compartilhamentos_album; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compartilhamentos_album ON public.tb_compartilhamentos_album USING btree (id_album);


--
-- Name: idx_compartilhamentos_compartilhou; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compartilhamentos_compartilhou ON public.tb_compartilhamentos_album USING btree (id_user_compartilhou);


--
-- Name: idx_compartilhamentos_destinatario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compartilhamentos_destinatario ON public.tb_compartilhamentos_album USING btree (id_user_destinatario);


--
-- Name: idx_compartilhamentos_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compartilhamentos_token ON public.tb_compartilhamentos_album USING btree (ds_token_compartilhamento);


--
-- Name: idx_config_central_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_central_empresa ON public.tb_config_central_atendimento USING btree (id_empresa);


--
-- Name: idx_configuracoes_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracoes_ativo ON public.tb_configuracoes USING btree (st_ativo);


--
-- Name: idx_configuracoes_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracoes_categoria ON public.tb_configuracoes USING btree (ds_categoria);


--
-- Name: idx_configuracoes_chave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracoes_chave ON public.tb_configuracoes USING btree (nm_chave);


--
-- Name: idx_configuracoes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracoes_empresa ON public.tb_configuracoes USING btree (id_empresa);


--
-- Name: idx_contas_bancarias_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_bancarias_empresa ON public.tb_contas_bancarias USING btree (id_empresa);


--
-- Name: idx_contas_bancarias_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_bancarias_fornecedor ON public.tb_contas_bancarias USING btree (id_fornecedor);


--
-- Name: idx_contas_bancarias_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_bancarias_profissional ON public.tb_contas_bancarias USING btree (id_profissional);


--
-- Name: idx_contatos_omni_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contatos_omni_email ON public.tb_contatos_omni USING btree (nm_email);


--
-- Name: idx_contatos_omni_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contatos_omni_empresa ON public.tb_contatos_omni USING btree (id_empresa);


--
-- Name: idx_contatos_omni_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contatos_omni_paciente ON public.tb_contatos_omni USING btree (id_paciente);


--
-- Name: idx_contatos_omni_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contatos_omni_status ON public.tb_contatos_omni USING btree (st_contato);


--
-- Name: idx_contatos_omni_telefone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contatos_omni_telefone ON public.tb_contatos_omni USING btree (nr_telefone);


--
-- Name: idx_contatos_omni_whatsapp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contatos_omni_whatsapp ON public.tb_contatos_omni USING btree (id_whatsapp);


--
-- Name: idx_conversas_agente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_agente ON public.tb_conversas USING btree (id_agente);


--
-- Name: idx_conversas_arquivada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_arquivada ON public.tb_conversas USING btree (st_arquivada);


--
-- Name: idx_conversas_atendente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_atendente ON public.tb_conversas_omni USING btree (id_atendente, st_aberta);


--
-- Name: idx_conversas_compartilhada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_compartilhada ON public.tb_conversas USING btree (st_compartilhada);


--
-- Name: idx_conversas_compartilhadas_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_compartilhadas_conversa ON public.tb_conversas_compartilhadas USING btree (id_conversa);


--
-- Name: idx_conversas_compartilhadas_criador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_compartilhadas_criador ON public.tb_conversas_compartilhadas USING btree (id_user_criador);


--
-- Name: idx_conversas_compartilhadas_expiracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_compartilhadas_expiracao ON public.tb_conversas_compartilhadas USING btree (dt_expiracao) WHERE (fg_expirado = false);


--
-- Name: idx_conversas_compartilhadas_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_compartilhadas_token ON public.tb_conversas_compartilhadas USING btree (ds_token) WHERE (fg_ativo = true);


--
-- Name: idx_conversas_contato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_contato ON public.tb_conversas_omni USING btree (id_contato);


--
-- Name: idx_conversas_dt_atualizacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_dt_atualizacao ON public.tb_conversas USING btree (dt_atualizacao DESC);


--
-- Name: idx_conversas_dt_ultima_mensagem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_dt_ultima_mensagem ON public.tb_conversas USING btree (dt_ultima_mensagem DESC NULLS LAST);


--
-- Name: idx_conversas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_empresa ON public.tb_conversas USING btree (id_empresa);


--
-- Name: idx_conversas_empresa_aberta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_empresa_aberta ON public.tb_conversas_omni USING btree (id_empresa, st_aberta);


--
-- Name: idx_conversas_empresa_contato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_empresa_contato ON public.tb_conversas_omni USING btree (id_empresa, id_contato);


--
-- Name: idx_conversas_fila; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_fila ON public.tb_conversas_omni USING btree (id_fila);


--
-- Name: idx_conversas_omni_favorito; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_omni_favorito ON public.tb_conversas_omni USING btree (id_empresa, st_favorito) WHERE (st_favorito = true);


--
-- Name: idx_conversas_omni_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_omni_metadata ON public.tb_conversas_omni USING gin (ds_metadata);


--
-- Name: idx_conversas_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_paciente ON public.tb_conversas USING btree (id_paciente);


--
-- Name: idx_conversas_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_token ON public.tb_conversas USING btree (ds_token_compartilhamento) WHERE (ds_token_compartilhamento IS NOT NULL);


--
-- Name: idx_conversas_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_user ON public.tb_conversas USING btree (id_user);


--
-- Name: idx_conversas_usuarios_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_usuarios_empresa ON public.tb_conversas_usuarios USING btree (id_empresa);


--
-- Name: idx_conversas_usuarios_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_usuarios_tipo ON public.tb_conversas_usuarios USING btree (ds_tipo);


--
-- Name: idx_conversas_usuarios_ultima_mensagem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversas_usuarios_ultima_mensagem ON public.tb_conversas_usuarios USING btree (dt_ultima_mensagem DESC);


--
-- Name: idx_cupons_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cupons_ativo ON public.tb_cupons USING btree (st_ativo);


--
-- Name: idx_cupons_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cupons_codigo ON public.tb_cupons USING btree (ds_codigo);


--
-- Name: idx_cupons_uso_cupom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cupons_uso_cupom ON public.tb_cupons_uso USING btree (id_cupom);


--
-- Name: idx_cupons_uso_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cupons_uso_pedido ON public.tb_cupons_uso USING btree (id_pedido);


--
-- Name: idx_cupons_uso_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cupons_uso_user ON public.tb_cupons_uso USING btree (id_user);


--
-- Name: idx_cupons_validade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cupons_validade ON public.tb_cupons USING btree (dt_inicio, dt_fim);


--
-- Name: idx_curtidas_fotos_foto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_curtidas_fotos_foto ON public.tb_curtidas_fotos USING btree (id_foto);


--
-- Name: idx_curtidas_fotos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_curtidas_fotos_user ON public.tb_curtidas_fotos USING btree (id_user);


--
-- Name: idx_dispositivos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_ativo ON public.tb_dispositivos USING btree (st_ativo);


--
-- Name: idx_dispositivos_plataforma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_plataforma ON public.tb_dispositivos USING btree (ds_plataforma);


--
-- Name: idx_dispositivos_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_token ON public.tb_dispositivos USING btree (ds_token_push);


--
-- Name: idx_dispositivos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_user ON public.tb_dispositivos USING btree (id_user);


--
-- Name: idx_email_logs_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_categoria ON public.tb_email_logs USING btree (tp_categoria);


--
-- Name: idx_email_logs_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_criacao ON public.tb_email_logs USING btree (dt_criacao DESC);


--
-- Name: idx_email_logs_destinatario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_destinatario ON public.tb_email_logs USING btree (ds_destinatario);


--
-- Name: idx_email_logs_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_empresa ON public.tb_email_logs USING btree (id_empresa);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.tb_email_logs USING btree (st_envio);


--
-- Name: idx_email_logs_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_template ON public.tb_email_logs USING btree (tp_template);


--
-- Name: idx_email_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_user ON public.tb_email_logs USING btree (id_user);


--
-- Name: idx_empresas_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_ativo ON public.tb_empresas USING btree (st_ativo);


--
-- Name: idx_empresas_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_cnpj ON public.tb_empresas USING btree (nr_cnpj);


--
-- Name: idx_empresas_plano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_plano ON public.tb_empresas USING btree (nm_plano);


--
-- Name: idx_empresas_segmento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_segmento ON public.tb_empresas USING btree (nm_segmento);


--
-- Name: idx_execucoes_jobs_inicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_execucoes_jobs_inicio ON public.tb_execucoes_jobs USING btree (dt_inicio DESC);


--
-- Name: idx_execucoes_jobs_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_execucoes_jobs_job ON public.tb_execucoes_jobs USING btree (id_job);


--
-- Name: idx_execucoes_jobs_sucesso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_execucoes_jobs_sucesso ON public.tb_execucoes_jobs USING btree (st_sucesso);


--
-- Name: idx_export_agendamentos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_agendamentos_ativo ON public.tb_export_agendamentos USING btree (fg_ativo);


--
-- Name: idx_export_agendamentos_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_agendamentos_empresa ON public.tb_export_agendamentos USING btree (id_empresa);


--
-- Name: idx_export_agendamentos_proxima; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_agendamentos_proxima ON public.tb_export_agendamentos USING btree (dt_proxima_execucao) WHERE (fg_ativo = true);


--
-- Name: idx_export_jobs_dt_expiracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_jobs_dt_expiracao ON public.tb_export_jobs USING btree (dt_expiracao) WHERE (dt_expiracao IS NOT NULL);


--
-- Name: idx_export_jobs_dt_solicitacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_jobs_dt_solicitacao ON public.tb_export_jobs USING btree (dt_solicitacao DESC);


--
-- Name: idx_export_jobs_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_jobs_empresa ON public.tb_export_jobs USING btree (id_empresa);


--
-- Name: idx_export_jobs_solicitante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_jobs_solicitante ON public.tb_export_jobs USING btree (id_user_solicitante);


--
-- Name: idx_export_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_jobs_status ON public.tb_export_jobs USING btree (st_export);


--
-- Name: idx_faturas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturas_empresa ON public.tb_faturas USING btree (id_empresa);


--
-- Name: idx_faturas_nr_fatura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturas_nr_fatura ON public.tb_faturas USING btree (nr_fatura);


--
-- Name: idx_faturas_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturas_paciente ON public.tb_faturas USING btree (id_paciente);


--
-- Name: idx_faturas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturas_status ON public.tb_faturas USING btree (ds_status);


--
-- Name: idx_faturas_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturas_vencimento ON public.tb_faturas USING btree (dt_vencimento);


--
-- Name: idx_favoritos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_categoria ON public.tb_favoritos USING btree (ds_categoria_favorito);


--
-- Name: idx_favoritos_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_clinica ON public.tb_favoritos USING btree (id_clinica);


--
-- Name: idx_favoritos_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_fornecedor ON public.tb_favoritos USING btree (id_fornecedor);


--
-- Name: idx_favoritos_procedimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_procedimento ON public.tb_favoritos USING btree (id_procedimento);


--
-- Name: idx_favoritos_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_produto ON public.tb_favoritos USING btree (id_produto);


--
-- Name: idx_favoritos_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_profissional ON public.tb_favoritos USING btree (id_profissional);


--
-- Name: idx_favoritos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_tipo ON public.tb_favoritos USING btree (ds_tipo_item);


--
-- Name: idx_favoritos_tipo_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_tipo_item ON public.tb_favoritos USING btree (ds_tipo_item);


--
-- Name: idx_favoritos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_user ON public.tb_favoritos USING btree (id_user);


--
-- Name: idx_favoritos_vaga; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_vaga ON public.tb_favoritos USING btree (id_vaga);


--
-- Name: idx_filas_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_filas_ativa ON public.tb_filas_atendimento USING btree (st_ativa);


--
-- Name: idx_filas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_filas_empresa ON public.tb_filas_atendimento USING btree (id_empresa);


--
-- Name: idx_filas_empresa_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_filas_empresa_ativa ON public.tb_filas_atendimento USING btree (id_empresa, st_ativa);


--
-- Name: idx_fornecedores_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_ativo ON public.tb_fornecedores USING btree (st_ativo);


--
-- Name: idx_fornecedores_categorias; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_categorias ON public.tb_fornecedores USING gin (ds_categorias_produtos);


--
-- Name: idx_fornecedores_cidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_cidade ON public.tb_fornecedores USING btree (nm_cidade);


--
-- Name: idx_fornecedores_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_cnpj ON public.tb_fornecedores USING btree (nr_cnpj);


--
-- Name: idx_fornecedores_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_empresa ON public.tb_fornecedores USING btree (id_empresa);


--
-- Name: idx_fornecedores_segmentos; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_segmentos ON public.tb_fornecedores USING gin (ds_segmentos);


--
-- Name: idx_fornecedores_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_tipo ON public.tb_fornecedores USING btree (nm_tipo);


--
-- Name: idx_fornecedores_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_user ON public.tb_fornecedores USING btree (id_user);


--
-- Name: idx_fotos_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_agendamento ON public.tb_fotos USING btree (id_agendamento);


--
-- Name: idx_fotos_album; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_album ON public.tb_fotos USING btree (id_album);


--
-- Name: idx_fotos_moderacao_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_moderacao_avaliacao ON public.tb_avaliacoes_fotos_moderacao USING btree (id_avaliacao);


--
-- Name: idx_fotos_moderacao_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_moderacao_status ON public.tb_avaliacoes_fotos_moderacao USING btree (st_aprovada);


--
-- Name: idx_fotos_procedimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_procedimento ON public.tb_fotos USING btree (id_procedimento);


--
-- Name: idx_fotos_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_produto ON public.tb_fotos USING btree (id_produto);


--
-- Name: idx_fotos_relacionada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_relacionada ON public.tb_fotos USING btree (id_foto_relacionada);


--
-- Name: idx_fotos_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_tags ON public.tb_fotos USING gin (ds_tags);


--
-- Name: idx_fotos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_tipo ON public.tb_fotos USING btree (ds_tipo_foto);


--
-- Name: idx_fotos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_user ON public.tb_fotos USING btree (id_user);


--
-- Name: idx_fotos_visibilidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_visibilidade ON public.tb_fotos USING btree (ds_visibilidade);


--
-- Name: idx_historico_config_configuracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_config_configuracao ON public.tb_historico_configuracoes USING btree (id_configuracao);


--
-- Name: idx_historico_config_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_config_criacao ON public.tb_historico_configuracoes USING btree (dt_criacao DESC);


--
-- Name: idx_historico_config_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_config_user ON public.tb_historico_configuracoes USING btree (id_user);


--
-- Name: idx_instalacoes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instalacoes_empresa ON public.tb_instalacoes_marketplace USING btree (id_empresa);


--
-- Name: idx_installations_agente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_installations_agente ON public.tb_template_installations USING btree (id_agente);


--
-- Name: idx_installations_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_installations_ativo ON public.tb_template_installations USING btree (bl_ativo);


--
-- Name: idx_installations_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_installations_data ON public.tb_template_installations USING btree (dt_instalacao DESC);


--
-- Name: idx_installations_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_installations_empresa ON public.tb_template_installations USING btree (id_empresa);


--
-- Name: idx_installations_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_installations_template ON public.tb_template_installations USING btree (id_template);


--
-- Name: idx_installations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_installations_user ON public.tb_template_installations USING btree (id_user);


--
-- Name: idx_itens_fatura_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_fatura_agendamento ON public.tb_itens_fatura USING btree (id_agendamento);


--
-- Name: idx_itens_fatura_fatura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_fatura_fatura ON public.tb_itens_fatura USING btree (id_fatura);


--
-- Name: idx_itens_fatura_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_fatura_produto ON public.tb_itens_fatura USING btree (id_produto);


--
-- Name: idx_itens_lista_desejos_lista; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_lista_desejos_lista ON public.tb_itens_lista_desejos USING btree (id_lista);


--
-- Name: idx_itens_lista_desejos_procedimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_lista_desejos_procedimento ON public.tb_itens_lista_desejos USING btree (id_procedimento);


--
-- Name: idx_itens_lista_desejos_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_lista_desejos_produto ON public.tb_itens_lista_desejos USING btree (id_produto);


--
-- Name: idx_itens_pedido_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_pedido ON public.tb_itens_pedido USING btree (id_pedido);


--
-- Name: idx_itens_pedido_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_produto ON public.tb_itens_pedido USING btree (id_produto);


--
-- Name: idx_itens_repasse_repasse; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_repasse_repasse ON public.tb_itens_repasse USING btree (id_repasse);


--
-- Name: idx_itens_repasse_transacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_repasse_transacao ON public.tb_itens_repasse USING btree (id_transacao);


--
-- Name: idx_jobs_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_ativo ON public.tb_jobs USING btree (st_ativo);


--
-- Name: idx_jobs_proxima_execucao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_proxima_execucao ON public.tb_jobs USING btree (dt_proxima_execucao);


--
-- Name: idx_jobs_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_tipo ON public.tb_jobs USING btree (ds_tipo);


--
-- Name: idx_lead_score_hist_contato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_score_hist_contato ON public.tb_lead_score_historico USING btree (id_contato);


--
-- Name: idx_lead_score_hist_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_score_hist_data ON public.tb_lead_score_historico USING btree (dt_registro);


--
-- Name: idx_lead_score_hist_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_score_hist_score ON public.tb_lead_score_historico USING btree (id_score);


--
-- Name: idx_lead_scores_classificacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_classificacao ON public.tb_lead_scores USING btree (nm_classificacao);


--
-- Name: idx_lead_scores_contato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_contato ON public.tb_lead_scores USING btree (id_contato);


--
-- Name: idx_lead_scores_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_empresa ON public.tb_lead_scores USING btree (id_empresa);


--
-- Name: idx_lead_scores_temperatura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_temperatura ON public.tb_lead_scores USING btree (nr_temperatura DESC);


--
-- Name: idx_lead_scores_total; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_total ON public.tb_lead_scores USING btree (nr_score_total DESC);


--
-- Name: idx_leitura_mensagens_mensagem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leitura_mensagens_mensagem ON public.tb_leitura_mensagens USING btree (id_mensagem);


--
-- Name: idx_leitura_mensagens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leitura_mensagens_user ON public.tb_leitura_mensagens USING btree (id_user);


--
-- Name: idx_lembretes_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lembretes_agendamento ON public.tb_lembretes USING btree (id_agendamento);


--
-- Name: idx_lembretes_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lembretes_data ON public.tb_lembretes USING btree (dt_lembrete);


--
-- Name: idx_lembretes_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lembretes_dt_criacao ON public.tb_lembretes USING btree (dt_criacao DESC);


--
-- Name: idx_lembretes_enviado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lembretes_enviado ON public.tb_lembretes USING btree (st_enviado);


--
-- Name: idx_lembretes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lembretes_user ON public.tb_lembretes USING btree (id_user);


--
-- Name: idx_listas_desejos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listas_desejos_tipo ON public.tb_listas_desejos USING btree (ds_tipo);


--
-- Name: idx_listas_desejos_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listas_desejos_token ON public.tb_listas_desejos USING btree (ds_token_compartilhamento);


--
-- Name: idx_listas_desejos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listas_desejos_user ON public.tb_listas_desejos USING btree (id_user);


--
-- Name: idx_logs_acesso_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_criacao ON public.tb_logs_acesso USING btree (dt_criacao DESC);


--
-- Name: idx_logs_acesso_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_endpoint ON public.tb_logs_acesso USING btree (ds_endpoint);


--
-- Name: idx_logs_acesso_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_ip ON public.tb_logs_acesso USING btree (ds_ip);


--
-- Name: idx_logs_acesso_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_status ON public.tb_logs_acesso USING btree (nr_status_code);


--
-- Name: idx_logs_acesso_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_user ON public.tb_logs_acesso USING btree (id_user);


--
-- Name: idx_logs_erro_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_erro_criacao ON public.tb_logs_erro USING btree (dt_criacao DESC);


--
-- Name: idx_logs_erro_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_erro_empresa ON public.tb_logs_erro USING btree (id_empresa);


--
-- Name: idx_logs_erro_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_erro_endpoint ON public.tb_logs_erro USING btree (ds_endpoint);


--
-- Name: idx_logs_erro_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_erro_hash ON public.tb_logs_erro USING btree (ds_hash_erro);


--
-- Name: idx_logs_erro_nivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_erro_nivel ON public.tb_logs_erro USING btree (ds_nivel);


--
-- Name: idx_logs_erro_resolvido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_erro_resolvido ON public.tb_logs_erro USING btree (st_resolvido);


--
-- Name: idx_logs_erro_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_erro_user ON public.tb_logs_erro USING btree (id_user);


--
-- Name: idx_logs_integracao_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_integracao_criacao ON public.tb_logs_integracao USING btree (dt_criacao DESC);


--
-- Name: idx_logs_integracao_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_integracao_empresa ON public.tb_logs_integracao USING btree (id_empresa);


--
-- Name: idx_logs_integracao_servico; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_integracao_servico ON public.tb_logs_integracao USING btree (ds_servico);


--
-- Name: idx_logs_integracao_sucesso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_integracao_sucesso ON public.tb_logs_integracao USING btree (st_sucesso);


--
-- Name: idx_logs_integracao_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_integracao_tipo ON public.tb_logs_integracao USING btree (ds_tipo);


--
-- Name: idx_marketplace_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_categoria ON public.tb_marketplace_agentes USING btree (nm_categoria);


--
-- Name: idx_marketplace_instalacoes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_instalacoes ON public.tb_marketplace_agentes USING btree (nr_instalacoes DESC);


--
-- Name: idx_marketplace_media_estrelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_media_estrelas ON public.tb_marketplace_agentes USING btree (nr_media_estrelas DESC);


--
-- Name: idx_marketplace_publicacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_publicacao ON public.tb_marketplace_agentes USING btree (dt_publicacao DESC);


--
-- Name: idx_marketplace_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_tags ON public.tb_marketplace_agentes USING gin (ds_tags);


--
-- Name: idx_mensagens_agendadas_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_agendadas_conversa ON public.tb_mensagens_agendadas USING btree (id_conversa);


--
-- Name: idx_mensagens_agendadas_enviada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_agendadas_enviada ON public.tb_mensagens_agendadas USING btree (st_enviada);


--
-- Name: idx_mensagens_agendadas_envio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_agendadas_envio ON public.tb_mensagens_agendadas USING btree (dt_envio_programado);


--
-- Name: idx_mensagens_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_conversa ON public.tb_mensagens USING btree (id_conversa);


--
-- Name: idx_mensagens_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_criacao ON public.tb_mensagens_omni USING btree (dt_criacao);


--
-- Name: idx_mensagens_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_dt_criacao ON public.tb_mensagens USING btree (dt_criacao);


--
-- Name: idx_mensagens_externo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_externo ON public.tb_mensagens_omni USING btree (id_externo);


--
-- Name: idx_mensagens_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_metadata ON public.tb_mensagens USING gin (ds_metadata);


--
-- Name: idx_mensagens_nao_deletadas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_nao_deletadas ON public.tb_mensagens USING btree (id_conversa, dt_criacao) WHERE (st_deletada = false);


--
-- Name: idx_mensagens_papel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_papel ON public.tb_mensagens USING btree (nm_papel);


--
-- Name: idx_mensagens_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_status ON public.tb_mensagens_omni USING btree (st_mensagem);


--
-- Name: idx_mensagens_usuarios_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_usuarios_agendamento ON public.tb_mensagens_usuarios USING btree (id_agendamento);


--
-- Name: idx_mensagens_usuarios_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_usuarios_conversa ON public.tb_mensagens_usuarios USING btree (id_conversa);


--
-- Name: idx_mensagens_usuarios_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_usuarios_criacao ON public.tb_mensagens_usuarios USING btree (dt_criacao DESC);


--
-- Name: idx_mensagens_usuarios_pai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_usuarios_pai ON public.tb_mensagens_usuarios USING btree (id_mensagem_pai);


--
-- Name: idx_mensagens_usuarios_remetente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_usuarios_remetente ON public.tb_mensagens_usuarios USING btree (id_remetente);


--
-- Name: idx_mensagens_usuarios_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagens_usuarios_tipo ON public.tb_mensagens_usuarios USING btree (ds_tipo_mensagem);


--
-- Name: idx_messages_agente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_agente ON public.tb_messages USING btree (id_agente);


--
-- Name: idx_messages_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversa ON public.tb_messages USING btree (id_conversa);


--
-- Name: idx_messages_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_criacao ON public.tb_messages USING btree (dt_criacao);


--
-- Name: idx_messages_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_data ON public.tb_messages USING btree (dt_criacao);


--
-- Name: idx_messages_deletada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_deletada ON public.tb_messages USING btree (st_deletada) WHERE (st_deletada = false);


--
-- Name: idx_messages_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_user ON public.tb_messages USING btree (id_user);


--
-- Name: idx_movimentacoes_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_agendamento ON public.tb_movimentacoes_estoque USING btree (id_agendamento);


--
-- Name: idx_movimentacoes_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_dt_criacao ON public.tb_movimentacoes_estoque USING btree (dt_criacao DESC);


--
-- Name: idx_movimentacoes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_empresa ON public.tb_movimentacoes_estoque USING btree (id_empresa);


--
-- Name: idx_movimentacoes_empresa_produto_dt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_empresa_produto_dt ON public.tb_movimentacoes_estoque USING btree (id_empresa, id_produto, dt_criacao DESC);


--
-- Name: idx_movimentacoes_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_lote ON public.tb_movimentacoes_estoque USING btree (ds_lote) WHERE (ds_lote IS NOT NULL);


--
-- Name: idx_movimentacoes_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_pedido ON public.tb_movimentacoes_estoque USING btree (id_pedido);


--
-- Name: idx_movimentacoes_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_produto ON public.tb_movimentacoes_estoque USING btree (id_produto);


--
-- Name: idx_movimentacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_tipo ON public.tb_movimentacoes_estoque USING btree (tp_movimentacao);


--
-- Name: idx_movimentacoes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_user ON public.tb_movimentacoes_estoque USING btree (id_user);


--
-- Name: idx_notas_fiscais_cancelada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_cancelada ON public.tb_notas_fiscais USING btree (fg_cancelada);


--
-- Name: idx_notas_fiscais_chave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_chave ON public.tb_notas_fiscais USING btree (ds_chave_acesso);


--
-- Name: idx_notas_fiscais_dados_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_dados_gin ON public.tb_notas_fiscais USING gin (ds_dados_completos);


--
-- Name: idx_notas_fiscais_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_dt_criacao ON public.tb_notas_fiscais USING btree (dt_criacao DESC);


--
-- Name: idx_notas_fiscais_dt_emissao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_dt_emissao ON public.tb_notas_fiscais USING btree (dt_emissao DESC);


--
-- Name: idx_notas_fiscais_emitidas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_emitidas ON public.tb_notas_fiscais USING btree (id_empresa, dt_emissao DESC) WHERE (((st_nota)::text = 'emitida'::text) AND (fg_cancelada = false));


--
-- Name: idx_notas_fiscais_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_empresa ON public.tb_notas_fiscais USING btree (id_empresa);


--
-- Name: idx_notas_fiscais_fatura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_fatura ON public.tb_notas_fiscais USING btree (id_fatura);


--
-- Name: idx_notas_fiscais_nr_nota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_nr_nota ON public.tb_notas_fiscais USING btree (nr_nota);


--
-- Name: idx_notas_fiscais_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_pedido ON public.tb_notas_fiscais USING btree (id_pedido);


--
-- Name: idx_notas_fiscais_pendentes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_pendentes ON public.tb_notas_fiscais USING btree (id_empresa, dt_criacao) WHERE ((st_nota)::text = ANY ((ARRAY['pendente'::character varying, 'erro'::character varying])::text[]));


--
-- Name: idx_notas_fiscais_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_status ON public.tb_notas_fiscais USING btree (st_nota);


--
-- Name: idx_notas_fiscais_tomador_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_tomador_cpf ON public.tb_notas_fiscais USING btree (ds_tomador_cnpj_cpf);


--
-- Name: idx_notificacoes_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_agendamento ON public.tb_notificacoes USING btree (id_agendamento);


--
-- Name: idx_notificacoes_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_criacao ON public.tb_notificacoes USING btree (dt_criacao DESC);


--
-- Name: idx_notificacoes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_empresa ON public.tb_notificacoes USING btree (id_empresa);


--
-- Name: idx_notificacoes_envio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_envio ON public.tb_notificacoes USING btree (dt_envio_programado);


--
-- Name: idx_notificacoes_lida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_lida ON public.tb_notificacoes USING btree (st_lida);


--
-- Name: idx_notificacoes_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_pedido ON public.tb_notificacoes USING btree (id_pedido);


--
-- Name: idx_notificacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_tipo ON public.tb_notificacoes USING btree (ds_tipo);


--
-- Name: idx_notificacoes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_user ON public.tb_notificacoes USING btree (id_user);


--
-- Name: idx_onboarding_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_date ON public.tb_onboarding_events USING btree (dt_event DESC);


--
-- Name: idx_onboarding_events_progress; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_progress ON public.tb_onboarding_events USING btree (id_progress);


--
-- Name: idx_onboarding_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_type ON public.tb_onboarding_events USING btree (nm_event_type);


--
-- Name: idx_onboarding_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_user ON public.tb_onboarding_events USING btree (id_user);


--
-- Name: idx_onboarding_events_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_user_date ON public.tb_onboarding_events USING btree (id_user, dt_event DESC);


--
-- Name: idx_onboarding_flows_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_flows_active ON public.tb_onboarding_flows USING btree (bl_ativo) WHERE (bl_ativo = true);


--
-- Name: idx_onboarding_flows_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_flows_order ON public.tb_onboarding_flows USING btree (nr_order);


--
-- Name: idx_onboarding_flows_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_flows_target ON public.tb_onboarding_flows USING btree (nm_target_type);


--
-- Name: idx_pacientes_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pacientes_clinica ON public.tb_pacientes USING btree (id_clinica);


--
-- Name: idx_pacientes_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pacientes_cpf ON public.tb_pacientes USING btree (nr_cpf);


--
-- Name: idx_pacientes_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pacientes_nome ON public.tb_pacientes USING btree (nm_paciente);


--
-- Name: idx_pacientes_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pacientes_profissional ON public.tb_pacientes USING btree (id_profissional);


--
-- Name: idx_pacientes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pacientes_user ON public.tb_pacientes USING btree (id_user);


--
-- Name: idx_pagamentos_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_dt_criacao ON public.tb_pagamentos USING btree (dt_criacao DESC);


--
-- Name: idx_pagamentos_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_empresa ON public.tb_pagamentos USING btree (id_empresa);


--
-- Name: idx_pagamentos_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_external_id ON public.tb_pagamentos USING btree (ds_external_id);


--
-- Name: idx_pagamentos_gateway; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_gateway ON public.tb_pagamentos USING btree (ds_gateway);


--
-- Name: idx_pagamentos_payer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_payer_email ON public.tb_pagamentos USING btree (ds_payer_email);


--
-- Name: idx_pagamentos_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_session_id ON public.tb_pagamentos USING btree (ds_session_id);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_status ON public.tb_pagamentos USING btree (ds_status);


--
-- Name: idx_pagamentos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_user ON public.tb_pagamentos USING btree (id_user);


--
-- Name: idx_participantes_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_ativo ON public.tb_participantes_conversa USING btree (st_ativo);


--
-- Name: idx_participantes_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_conversa ON public.tb_participantes_conversa USING btree (id_conversa);


--
-- Name: idx_participantes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_user ON public.tb_participantes_conversa USING btree (id_user);


--
-- Name: idx_partner_lead_questions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_lead_questions_active ON public.tb_partner_lead_questions USING btree (st_active);


--
-- Name: idx_partner_lead_questions_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_lead_questions_order ON public.tb_partner_lead_questions USING btree (tp_partner, nr_order);


--
-- Name: idx_partner_lead_questions_tp_partner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_lead_questions_tp_partner ON public.tb_partner_lead_questions USING btree (tp_partner);


--
-- Name: idx_partner_lead_services_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_lead_services_lead ON public.tb_partner_lead_services USING btree (id_partner_lead);


--
-- Name: idx_partner_lead_services_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_lead_services_service ON public.tb_partner_lead_services USING btree (id_service);


--
-- Name: idx_partner_leads_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_leads_cnpj ON public.tb_partner_leads USING btree (nr_cnpj);


--
-- Name: idx_partner_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_leads_email ON public.tb_partner_leads USING btree (nm_email);


--
-- Name: idx_partner_leads_partner_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_leads_partner_type ON public.tb_partner_leads USING btree (tp_partner);


--
-- Name: idx_partner_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_leads_status ON public.tb_partner_leads USING btree (nm_status);


--
-- Name: idx_partner_licenses_assigned_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_licenses_assigned_email ON public.tb_partner_licenses USING btree (nm_assigned_email);


--
-- Name: idx_partner_licenses_license_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_licenses_license_key ON public.tb_partner_licenses USING btree (cd_license);


--
-- Name: idx_partner_licenses_package_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_licenses_package_item ON public.tb_partner_licenses USING btree (id_partner_package_item);


--
-- Name: idx_partner_licenses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_licenses_status ON public.tb_partner_licenses USING btree (nm_status);


--
-- Name: idx_partner_package_items_package; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_package_items_package ON public.tb_partner_package_items USING btree (id_partner_package);


--
-- Name: idx_partner_package_items_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_package_items_service ON public.tb_partner_package_items USING btree (id_service);


--
-- Name: idx_partner_package_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_package_items_status ON public.tb_partner_package_items USING btree (nm_status);


--
-- Name: idx_partner_packages_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_packages_code ON public.tb_partner_packages USING btree (cd_package);


--
-- Name: idx_partner_packages_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_packages_lead ON public.tb_partner_packages USING btree (id_partner_lead);


--
-- Name: idx_partner_packages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_packages_status ON public.tb_partner_packages USING btree (nm_status);


--
-- Name: idx_partner_service_definitions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_service_definitions_active ON public.tb_partner_service_definitions USING btree (st_ativo);


--
-- Name: idx_partner_service_definitions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_service_definitions_category ON public.tb_partner_service_definitions USING btree (tp_categoria);


--
-- Name: idx_partner_service_definitions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_service_definitions_code ON public.tb_partner_service_definitions USING btree (cd_service);


--
-- Name: idx_partner_service_definitions_partner_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_service_definitions_partner_type ON public.tb_partner_service_definitions USING btree (tp_partner);


--
-- Name: idx_password_reset_expiration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_expiration ON public.tb_password_reset_tokens USING btree (dt_expiration);


--
-- Name: idx_password_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_token ON public.tb_password_reset_tokens USING btree (ds_token);


--
-- Name: idx_password_reset_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_used ON public.tb_password_reset_tokens USING btree (st_used);


--
-- Name: idx_password_reset_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_user ON public.tb_password_reset_tokens USING btree (id_user);


--
-- Name: idx_password_reset_validation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_validation ON public.tb_password_reset_tokens USING btree (ds_token, st_used, dt_expiration);


--
-- Name: idx_pedido_historico_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedido_historico_data ON public.tb_pedido_historico USING btree (dt_criacao);


--
-- Name: idx_pedido_historico_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedido_historico_pedido ON public.tb_pedido_historico USING btree (id_pedido);


--
-- Name: idx_pedidos_codigo_rastreio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_codigo_rastreio ON public.tb_pedidos USING btree (ds_codigo_rastreio);


--
-- Name: idx_pedidos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_data ON public.tb_pedidos USING btree (dt_criacao);


--
-- Name: idx_pedidos_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_dt_criacao ON public.tb_pedidos USING btree (dt_criacao DESC);


--
-- Name: idx_pedidos_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_fornecedor ON public.tb_pedidos USING btree (id_fornecedor);


--
-- Name: idx_pedidos_nr_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_nr_pedido ON public.tb_pedidos USING btree (nr_pedido);


--
-- Name: idx_pedidos_rastreio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_rastreio ON public.tb_pedidos USING btree (ds_codigo_rastreio);


--
-- Name: idx_pedidos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_status ON public.tb_pedidos USING btree (ds_status);


--
-- Name: idx_pedidos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_user ON public.tb_pedidos USING btree (id_user);


--
-- Name: idx_perfis_pai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_perfis_pai ON public.tb_perfis USING btree (id_perfil_pai);


--
-- Name: idx_perfis_tipo_acesso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_perfis_tipo_acesso ON public.tb_perfis USING btree (nm_tipo_acesso);


--
-- Name: idx_pesquisas_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pesquisas_ativa ON public.tb_pesquisas USING btree (st_ativa);


--
-- Name: idx_pesquisas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pesquisas_empresa ON public.tb_pesquisas USING btree (id_empresa);


--
-- Name: idx_pesquisas_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pesquisas_periodo ON public.tb_pesquisas USING btree (dt_inicio, dt_fim);


--
-- Name: idx_plans_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_ativo ON public.tb_plans USING btree (st_ativo);


--
-- Name: idx_plans_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_tier ON public.tb_plans USING btree (nm_tier);


--
-- Name: idx_plans_visivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_visivel ON public.tb_plans USING btree (st_visivel);


--
-- Name: idx_preferencias_notificacao_canal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preferencias_notificacao_canal ON public.tb_preferencias_notificacao USING btree (ds_canal);


--
-- Name: idx_preferencias_notificacao_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preferencias_notificacao_user ON public.tb_preferencias_notificacao USING btree (id_user);


--
-- Name: idx_procedimentos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedimentos_ativo ON public.tb_procedimentos USING btree (st_ativo);


--
-- Name: idx_procedimentos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedimentos_categoria ON public.tb_procedimentos USING btree (ds_categoria);


--
-- Name: idx_procedimentos_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedimentos_clinica ON public.tb_procedimentos USING btree (id_clinica);


--
-- Name: idx_produto_variacoes_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produto_variacoes_produto ON public.tb_produto_variacoes USING btree (id_produto);


--
-- Name: idx_produto_variacoes_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produto_variacoes_sku ON public.tb_produto_variacoes USING btree (ds_sku);


--
-- Name: idx_produtos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_ativo ON public.tb_produtos USING btree (st_ativo);


--
-- Name: idx_produtos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_categoria ON public.tb_produtos USING btree (id_categoria);


--
-- Name: idx_produtos_categoria_new; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_categoria_new ON public.tb_produtos USING btree (id_categoria);


--
-- Name: idx_produtos_destaque; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_destaque ON public.tb_produtos USING btree (st_destaque);


--
-- Name: idx_produtos_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_fornecedor ON public.tb_produtos USING btree (id_fornecedor);


--
-- Name: idx_produtos_marca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_marca ON public.tb_produtos USING btree (ds_marca);


--
-- Name: idx_produtos_preco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_preco ON public.tb_produtos USING btree (vl_preco);


--
-- Name: idx_produtos_promocao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_promocao ON public.tb_produtos USING btree (dt_inicio_promocao, dt_fim_promocao);


--
-- Name: idx_produtos_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_sku ON public.tb_produtos USING btree (ds_sku);


--
-- Name: idx_produtos_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_slug ON public.tb_produtos USING btree (ds_slug);


--
-- Name: idx_produtos_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_tags ON public.tb_produtos USING gin (ds_tags);


--
-- Name: idx_produtos_vegano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_vegano ON public.tb_produtos USING btree (st_vegano);


--
-- Name: idx_prof_clinicas_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prof_clinicas_ativo ON public.tb_profissionais_clinicas USING btree (st_ativo);


--
-- Name: idx_prof_clinicas_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prof_clinicas_clinica ON public.tb_profissionais_clinicas USING btree (id_clinica);


--
-- Name: idx_prof_clinicas_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prof_clinicas_profissional ON public.tb_profissionais_clinicas USING btree (id_profissional);


--
-- Name: idx_prof_clinicas_vinculo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prof_clinicas_vinculo ON public.tb_profissionais_clinicas USING btree (dt_vinculo);


--
-- Name: idx_profissionais_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profissionais_ativo ON public.tb_profissionais USING btree (st_ativo);


--
-- Name: idx_profissionais_autonomo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profissionais_autonomo ON public.tb_profissionais USING btree (fg_autonomo);


--
-- Name: idx_profissionais_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profissionais_clinica ON public.tb_profissionais USING btree (id_clinica);


--
-- Name: idx_profissionais_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profissionais_empresa ON public.tb_profissionais USING btree (id_empresa);


--
-- Name: idx_profissionais_especialidades; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profissionais_especialidades ON public.tb_profissionais USING gin (ds_especialidades);


--
-- Name: idx_profissionais_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profissionais_user ON public.tb_profissionais USING btree (id_user);


--
-- Name: idx_prompt_biblioteca_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prompt_biblioteca_categoria ON public.tb_prompt_biblioteca USING btree (ds_categoria);


--
-- Name: idx_prompt_biblioteca_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prompt_biblioteca_criacao ON public.tb_prompt_biblioteca USING btree (dt_criacao DESC);


--
-- Name: idx_prompt_biblioteca_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prompt_biblioteca_empresa ON public.tb_prompt_biblioteca USING btree (id_empresa);


--
-- Name: idx_prompt_biblioteca_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prompt_biblioteca_tags ON public.tb_prompt_biblioteca USING gin (ds_tags);


--
-- Name: idx_prontuarios_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prontuarios_agendamento ON public.tb_prontuarios USING btree (id_agendamento);


--
-- Name: idx_prontuarios_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prontuarios_data ON public.tb_prontuarios USING btree (dt_consulta);


--
-- Name: idx_prontuarios_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prontuarios_paciente ON public.tb_prontuarios USING btree (id_paciente);


--
-- Name: idx_prontuarios_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prontuarios_profissional ON public.tb_prontuarios USING btree (id_profissional);


--
-- Name: idx_qrcodes_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qrcodes_agendamento ON public.tb_qrcodes_avaliacao USING btree (id_agendamento);


--
-- Name: idx_qrcodes_expiracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qrcodes_expiracao ON public.tb_qrcodes_avaliacao USING btree (dt_expiracao);


--
-- Name: idx_qrcodes_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qrcodes_token ON public.tb_qrcodes_avaliacao USING btree (tk_codigo);


--
-- Name: idx_qrcodes_utilizado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qrcodes_utilizado ON public.tb_qrcodes_avaliacao USING btree (st_utilizado);


--
-- Name: idx_rastreamento_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_codigo ON public.tb_rastreamento_eventos USING btree (ds_codigo_rastreio);


--
-- Name: idx_rastreamento_codigo_dt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_codigo_dt ON public.tb_rastreamento_eventos USING btree (ds_codigo_rastreio, dt_evento DESC);


--
-- Name: idx_rastreamento_dados_brutos_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_dados_brutos_gin ON public.tb_rastreamento_eventos USING gin (ds_dados_brutos);


--
-- Name: idx_rastreamento_dt_captura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_dt_captura ON public.tb_rastreamento_eventos USING btree (dt_captura DESC);


--
-- Name: idx_rastreamento_dt_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_dt_evento ON public.tb_rastreamento_eventos USING btree (dt_evento DESC);


--
-- Name: idx_rastreamento_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_pedido ON public.tb_rastreamento_eventos USING btree (id_pedido);


--
-- Name: idx_rastreamento_pedido_dt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_pedido_dt ON public.tb_rastreamento_eventos USING btree (id_pedido, dt_evento DESC);


--
-- Name: idx_rastreamento_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_status ON public.tb_rastreamento_eventos USING btree (ds_status_mapeado);


--
-- Name: idx_rastreamento_transportadora; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rastreamento_transportadora ON public.tb_rastreamento_eventos USING btree (ds_transportadora);


--
-- Name: idx_record_manager_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_record_manager_group_id ON public.tb_record_manager USING btree (group_id);


--
-- Name: idx_record_manager_namespace; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_record_manager_namespace ON public.tb_record_manager USING btree (namespace);


--
-- Name: idx_record_manager_namespace_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_record_manager_namespace_group_id ON public.tb_record_manager USING btree (namespace, group_id);


--
-- Name: idx_record_manager_namespace_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_record_manager_namespace_updated_at ON public.tb_record_manager USING btree (namespace, updated_at);


--
-- Name: idx_repasses_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repasses_empresa ON public.tb_repasses USING btree (id_empresa);


--
-- Name: idx_repasses_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repasses_fornecedor ON public.tb_repasses USING btree (id_fornecedor);


--
-- Name: idx_repasses_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repasses_periodo ON public.tb_repasses USING btree (dt_inicio_periodo, dt_fim_periodo);


--
-- Name: idx_repasses_profissional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repasses_profissional ON public.tb_repasses USING btree (id_profissional);


--
-- Name: idx_repasses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repasses_status ON public.tb_repasses USING btree (ds_status);


--
-- Name: idx_reservas_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservas_agendamento ON public.tb_reservas_estoque USING btree (id_agendamento);


--
-- Name: idx_reservas_ativas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservas_ativas ON public.tb_reservas_estoque USING btree (id_empresa, id_produto) WHERE ((st_reserva)::text = 'ativa'::text);


--
-- Name: idx_reservas_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservas_dt_criacao ON public.tb_reservas_estoque USING btree (dt_criacao DESC);


--
-- Name: idx_reservas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservas_empresa ON public.tb_reservas_estoque USING btree (id_empresa);


--
-- Name: idx_reservas_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservas_produto ON public.tb_reservas_estoque USING btree (id_produto);


--
-- Name: idx_reservas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservas_status ON public.tb_reservas_estoque USING btree (st_reserva);


--
-- Name: idx_respostas_pesquisas_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_pesquisas_agendamento ON public.tb_respostas_pesquisas USING btree (id_agendamento);


--
-- Name: idx_respostas_pesquisas_nps; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_pesquisas_nps ON public.tb_respostas_pesquisas USING btree (nr_nota_nps);


--
-- Name: idx_respostas_pesquisas_pesquisa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_pesquisas_pesquisa ON public.tb_respostas_pesquisas USING btree (id_pesquisa);


--
-- Name: idx_respostas_pesquisas_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_pesquisas_user ON public.tb_respostas_pesquisas USING btree (id_user);


--
-- Name: idx_respostas_rapidas_atalho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_rapidas_atalho ON public.tb_respostas_rapidas USING btree (ds_atalho);


--
-- Name: idx_respostas_rapidas_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_rapidas_user ON public.tb_respostas_rapidas USING btree (id_user);


--
-- Name: idx_reviews_aprovado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_aprovado ON public.tb_template_reviews USING btree (bl_aprovado);


--
-- Name: idx_reviews_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_data ON public.tb_template_reviews USING btree (dt_criacao DESC);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_rating ON public.tb_template_reviews USING btree (nr_rating);


--
-- Name: idx_reviews_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_template ON public.tb_template_reviews USING btree (id_template);


--
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_user ON public.tb_template_reviews USING btree (id_user);


--
-- Name: idx_sessoes_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessoes_ativa ON public.tb_sessoes USING btree (st_ativa);


--
-- Name: idx_sessoes_expiracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessoes_expiracao ON public.tb_sessoes USING btree (dt_expiracao);


--
-- Name: idx_sessoes_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessoes_token ON public.tb_sessoes USING btree (ds_token);


--
-- Name: idx_sessoes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessoes_user ON public.tb_sessoes USING btree (id_user);


--
-- Name: idx_subscriptions_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_period_end ON public.tb_subscriptions USING btree (dt_current_period_end);


--
-- Name: idx_subscriptions_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_plan ON public.tb_subscriptions USING btree (id_plan);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.tb_subscriptions USING btree (nm_status);


--
-- Name: idx_subscriptions_stripe_sub_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe_sub_id ON public.tb_subscriptions USING btree (nm_stripe_subscription_id);


--
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user ON public.tb_subscriptions USING btree (id_user);


--
-- Name: idx_tb_documentos_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tb_documentos_embedding_hnsw ON public.tb_documentos USING hnsw (embedding public.vector_l2_ops) WITH (m='16', ef_construction='200');


--
-- Name: idx_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_category ON public.tb_templates USING btree (nm_category);


--
-- Name: idx_templates_creator_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_creator_empresa ON public.tb_templates USING btree (id_empresa_creator);


--
-- Name: idx_templates_creator_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_creator_user ON public.tb_templates USING btree (id_user_creator);


--
-- Name: idx_templates_installs; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_installs ON public.tb_templates USING btree (nr_install_count DESC);


--
-- Name: idx_templates_mensagens_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_mensagens_categoria ON public.tb_templates_mensagens USING btree (ds_categoria);


--
-- Name: idx_templates_mensagens_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_mensagens_empresa ON public.tb_templates_mensagens USING btree (id_empresa);


--
-- Name: idx_templates_mensagens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_mensagens_user ON public.tb_templates_mensagens USING btree (id_user);


--
-- Name: idx_templates_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_rating ON public.tb_templates USING btree (nr_rating_avg DESC);


--
-- Name: idx_templates_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_search ON public.tb_templates USING gin (to_tsvector('portuguese'::regconfig, (((COALESCE(nm_template, ''::character varying))::text || ' '::text) || COALESCE(ds_template, ''::text))));


--
-- Name: idx_templates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_status ON public.tb_templates USING btree (nm_status);


--
-- Name: idx_templates_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_tags ON public.tb_templates USING gin (ds_tags);


--
-- Name: idx_templates_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_visibility ON public.tb_templates USING btree (nm_visibility);


--
-- Name: idx_transacoes_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_agendamento ON public.tb_transacoes USING btree (id_agendamento);


--
-- Name: idx_transacoes_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_categoria ON public.tb_transacoes USING btree (id_categoria);


--
-- Name: idx_transacoes_competencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_competencia ON public.tb_transacoes USING btree (dt_competencia);


--
-- Name: idx_transacoes_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_dt_criacao ON public.tb_transacoes_pagamento USING btree (dt_criacao DESC);


--
-- Name: idx_transacoes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_empresa ON public.tb_transacoes USING btree (id_empresa);


--
-- Name: idx_transacoes_evento_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_evento_tipo ON public.tb_transacoes_pagamento USING btree (ds_evento_tipo);


--
-- Name: idx_transacoes_pagamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_pagamento ON public.tb_transacoes_pagamento USING btree (id_pagamento);


--
-- Name: idx_transacoes_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_pedido ON public.tb_transacoes USING btree (id_pedido);


--
-- Name: idx_transacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_status ON public.tb_transacoes USING btree (ds_status);


--
-- Name: idx_transacoes_status_novo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_status_novo ON public.tb_transacoes_pagamento USING btree (ds_status_novo);


--
-- Name: idx_transacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_tipo ON public.tb_transacoes USING btree (ds_tipo);


--
-- Name: idx_transacoes_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_vencimento ON public.tb_transacoes USING btree (dt_vencimento);


--
-- Name: idx_usage_metric_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_metric_type ON public.tb_usage_metrics USING btree (nm_metric_type);


--
-- Name: idx_usage_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_period ON public.tb_usage_metrics USING btree (dt_period_start, dt_period_end);


--
-- Name: idx_usage_sub_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_sub_type ON public.tb_usage_metrics USING btree (id_subscription, nm_metric_type);


--
-- Name: idx_usage_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_subscription ON public.tb_usage_metrics USING btree (id_subscription);


--
-- Name: idx_usage_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_user ON public.tb_usage_metrics USING btree (id_user);


--
-- Name: idx_usage_user_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_user_period ON public.tb_usage_metrics USING btree (id_user, dt_period_start, dt_period_end);


--
-- Name: idx_user_progress_flow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_progress_flow ON public.tb_user_onboarding_progress USING btree (id_flow);


--
-- Name: idx_user_progress_incomplete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_progress_incomplete ON public.tb_user_onboarding_progress USING btree (id_user, nm_status) WHERE ((nm_status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying])::text[]));


--
-- Name: idx_user_progress_percentage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_progress_percentage ON public.tb_user_onboarding_progress USING btree (nr_progress_percentage);


--
-- Name: idx_user_progress_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_progress_status ON public.tb_user_onboarding_progress USING btree (nm_status);


--
-- Name: idx_user_progress_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_progress_user ON public.tb_user_onboarding_progress USING btree (id_user);


--
-- Name: idx_users_criador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_criador ON public.tb_users USING btree (id_usuario_criador);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.tb_users USING btree (nm_email);


--
-- Name: idx_users_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_empresa ON public.tb_users USING btree (id_empresa);


--
-- Name: idx_users_perfil; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_perfil ON public.tb_users USING btree (id_perfil);


--
-- Name: idx_users_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_provider ON public.tb_users USING btree (nm_provider, ds_provider_id);


--
-- Name: idx_webhook_deliveries_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_deliveries_created ON public.tb_webhook_deliveries USING btree (dt_criacao DESC);


--
-- Name: idx_webhook_deliveries_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_deliveries_event ON public.tb_webhook_deliveries USING btree (nm_event_type);


--
-- Name: idx_webhook_deliveries_next_retry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_deliveries_next_retry ON public.tb_webhook_deliveries USING btree (dt_next_retry) WHERE ((nm_status)::text = 'retrying'::text);


--
-- Name: idx_webhook_deliveries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_deliveries_status ON public.tb_webhook_deliveries USING btree (nm_status);


--
-- Name: idx_webhook_deliveries_webhook; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_deliveries_webhook ON public.tb_webhook_deliveries USING btree (id_webhook);


--
-- Name: idx_webhooks_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_empresa ON public.tb_webhooks USING btree (id_empresa);


--
-- Name: idx_webhooks_events_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_events_gin ON public.tb_webhooks USING gin (ds_events);


--
-- Name: idx_webhooks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_status ON public.tb_webhooks USING btree (nm_status);


--
-- Name: idx_webhooks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_user ON public.tb_webhooks USING btree (id_user);


--
-- Name: ix_tb_config_central_atendimento_id_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_tb_config_central_atendimento_id_empresa ON public.tb_config_central_atendimento USING btree (id_empresa);


--
-- Name: uk_record_manager_namespace_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_record_manager_namespace_key ON public.tb_record_manager USING btree (namespace, key);


--
-- Name: uq_tb_users_nm_microsoft_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_tb_users_nm_microsoft_id ON public.tb_users USING btree (nm_microsoft_id) WHERE (nm_microsoft_id IS NOT NULL);


--
-- Name: tb_users trg_analytics_user_login; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_analytics_user_login AFTER UPDATE ON public.tb_users FOR EACH ROW WHEN ((new.dt_ultimo_login IS DISTINCT FROM old.dt_ultimo_login)) EXECUTE FUNCTION public.trigger_registrar_evento_login();


--
-- Name: tb_conversas trg_atualizar_dt_atualizacao_conversa; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_dt_atualizacao_conversa BEFORE UPDATE ON public.tb_conversas FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_dt_atualizacao_conversa();


--
-- Name: tb_mensagens trg_atualizar_dt_atualizacao_mensagem; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_dt_atualizacao_mensagem BEFORE UPDATE ON public.tb_mensagens FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_dt_atualizacao_conversa();


--
-- Name: tb_transacoes trg_atualizar_fatura_pagamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_fatura_pagamento AFTER INSERT OR UPDATE ON public.tb_transacoes FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_pago_fatura();


--
-- Name: tb_avaliacoes_likes trg_atualizar_likes_avaliacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_likes_avaliacao AFTER INSERT OR DELETE ON public.tb_avaliacoes_likes FOR EACH ROW EXECUTE FUNCTION public.atualizar_likes_avaliacao();


--
-- Name: tb_broadcast_destinatarios trg_broadcast_destinatario_atualizar_stats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_broadcast_destinatario_atualizar_stats AFTER UPDATE ON public.tb_broadcast_destinatarios FOR EACH ROW EXECUTE FUNCTION public.trg_atualizar_estatisticas_campanha();


--
-- Name: tb_broadcast_destinatarios trg_broadcast_destinatario_contadores; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_broadcast_destinatario_contadores BEFORE UPDATE ON public.tb_broadcast_destinatarios FOR EACH ROW EXECUTE FUNCTION public.trg_incrementar_contadores_destinatario();


--
-- Name: tb_respostas_pesquisas trg_categoria_nps; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_categoria_nps BEFORE INSERT OR UPDATE ON public.tb_respostas_pesquisas FOR EACH ROW EXECUTE FUNCTION public.calcular_categoria_nps();


--
-- Name: tb_cupons_uso trg_cupom_usado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cupom_usado AFTER INSERT ON public.tb_cupons_uso FOR EACH ROW EXECUTE FUNCTION public.atualizar_uso_cupom();


--
-- Name: tb_curtidas_fotos trg_curtida_foto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_curtida_foto AFTER INSERT OR DELETE ON public.tb_curtidas_fotos FOR EACH ROW EXECUTE FUNCTION public.atualizar_curtidas_foto();


--
-- Name: tb_mensagens trg_decrementar_contador_mensagens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_decrementar_contador_mensagens AFTER UPDATE ON public.tb_mensagens FOR EACH ROW WHEN (((old.st_deletada = false) AND (new.st_deletada = true))) EXECUTE FUNCTION public.fn_decrementar_contador_mensagens();


--
-- Name: tb_fotos trg_foto_album_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_foto_album_total AFTER INSERT OR DELETE ON public.tb_fotos FOR EACH ROW EXECUTE FUNCTION public.atualizar_total_fotos_album();


--
-- Name: tb_mensagens trg_incrementar_contador_mensagens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_incrementar_contador_mensagens AFTER INSERT ON public.tb_mensagens FOR EACH ROW WHEN ((new.st_deletada = false)) EXECUTE FUNCTION public.fn_incrementar_contador_mensagens();


--
-- Name: tb_leitura_mensagens trg_mensagem_lida; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_mensagem_lida AFTER INSERT ON public.tb_leitura_mensagens FOR EACH ROW EXECUTE FUNCTION public.marcar_mensagens_lidas();


--
-- Name: tb_configuracoes trg_mudanca_configuracao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_mudanca_configuracao AFTER UPDATE ON public.tb_configuracoes FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_configuracao();


--
-- Name: tb_rastreamento_eventos trg_notificar_mudanca_rastreamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notificar_mudanca_rastreamento AFTER INSERT ON public.tb_rastreamento_eventos FOR EACH ROW EXECUTE FUNCTION public.notificar_mudanca_rastreamento();


--
-- Name: tb_mensagens_usuarios trg_nova_mensagem; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nova_mensagem AFTER INSERT ON public.tb_mensagens_usuarios FOR EACH ROW EXECUTE FUNCTION public.atualizar_mensagens_nao_lidas();


--
-- Name: tb_respostas_pesquisas trg_nps_score; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nps_score AFTER INSERT OR UPDATE ON public.tb_respostas_pesquisas FOR EACH ROW EXECUTE FUNCTION public.atualizar_nps_pesquisa();


--
-- Name: tb_pedidos trg_pedido_status_historico; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pedido_status_historico AFTER UPDATE ON public.tb_pedidos FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_pedido();


--
-- Name: tb_plans trg_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.tb_plans FOR EACH ROW EXECUTE FUNCTION public.update_plans_updated_at();


--
-- Name: tb_subscriptions trg_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.tb_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_subscriptions_updated_at();


--
-- Name: tb_atendimento_items trg_tb_atendimento_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_atendimento_items_updated_at BEFORE UPDATE ON public.tb_atendimento_items FOR EACH ROW EXECUTE FUNCTION public.update_central_atendimento_updated_at();


--
-- Name: tb_campanhas trg_tb_campanhas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_campanhas_updated_at BEFORE UPDATE ON public.tb_campanhas FOR EACH ROW EXECUTE FUNCTION public.update_central_atendimento_updated_at();


--
-- Name: tb_canais_omni trg_tb_canais_omni_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_canais_omni_updated_at BEFORE UPDATE ON public.tb_canais_omni FOR EACH ROW EXECUTE FUNCTION public.update_central_atendimento_updated_at();


--
-- Name: tb_contatos_omni trg_tb_contatos_omni_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_contatos_omni_updated_at BEFORE UPDATE ON public.tb_contatos_omni FOR EACH ROW EXECUTE FUNCTION public.update_central_atendimento_updated_at();


--
-- Name: tb_conversas_omni trg_tb_conversas_omni_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_conversas_omni_updated_at BEFORE UPDATE ON public.tb_conversas_omni FOR EACH ROW EXECUTE FUNCTION public.update_central_atendimento_updated_at();


--
-- Name: tb_filas_atendimento trg_tb_filas_atendimento_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_filas_atendimento_updated_at BEFORE UPDATE ON public.tb_filas_atendimento FOR EACH ROW EXECUTE FUNCTION public.update_central_atendimento_updated_at();


--
-- Name: tb_lead_scores trg_tb_lead_scores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_lead_scores_updated_at BEFORE UPDATE ON public.tb_lead_scores FOR EACH ROW EXECUTE FUNCTION public.update_central_atendimento_updated_at();


--
-- Name: tb_agendamentos trg_update_agendamentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_agendamentos BEFORE UPDATE ON public.tb_agendamentos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_agentes trg_update_agentes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_agentes BEFORE UPDATE ON public.tb_agentes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_albuns trg_update_albuns; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_albuns BEFORE UPDATE ON public.tb_albuns FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_avaliacoes trg_update_avaliacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_avaliacoes BEFORE UPDATE ON public.tb_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_avaliacoes_produtos trg_update_avaliacoes_produtos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_avaliacoes_produtos BEFORE UPDATE ON public.tb_avaliacoes_produtos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_banners trg_update_banners; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_banners BEFORE UPDATE ON public.tb_banners FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_cache trg_update_cache; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_cache BEFORE UPDATE ON public.tb_cache FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_carrinho trg_update_carrinho; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_carrinho BEFORE UPDATE ON public.tb_carrinho FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_categorias_financeiras trg_update_categorias_financeiras; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_categorias_financeiras BEFORE UPDATE ON public.tb_categorias_financeiras FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_categorias_produtos trg_update_categorias_produtos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_categorias_produtos BEFORE UPDATE ON public.tb_categorias_produtos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_clinicas trg_update_clinicas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_clinicas BEFORE UPDATE ON public.tb_clinicas FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_comentarios_fotos trg_update_comentarios_fotos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_comentarios_fotos BEFORE UPDATE ON public.tb_comentarios_fotos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_compartilhamentos_album trg_update_compartilhamentos_album; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_compartilhamentos_album BEFORE UPDATE ON public.tb_compartilhamentos_album FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_configuracoes trg_update_configuracoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_configuracoes BEFORE UPDATE ON public.tb_configuracoes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_contas_bancarias trg_update_contas_bancarias; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_contas_bancarias BEFORE UPDATE ON public.tb_contas_bancarias FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_conversas trg_update_conversas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_conversas BEFORE UPDATE ON public.tb_conversas FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_conversas_usuarios trg_update_conversas_usuarios; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_conversas_usuarios BEFORE UPDATE ON public.tb_conversas_usuarios FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_cupons trg_update_cupons; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_cupons BEFORE UPDATE ON public.tb_cupons FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_dispositivos trg_update_dispositivos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_dispositivos BEFORE UPDATE ON public.tb_dispositivos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_empresas trg_update_empresas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_empresas BEFORE UPDATE ON public.tb_empresas FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_faturas trg_update_faturas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_faturas BEFORE UPDATE ON public.tb_faturas FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_favoritos trg_update_favoritos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_favoritos BEFORE UPDATE ON public.tb_favoritos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_onboarding_flows trg_update_flow_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_flow_timestamp BEFORE UPDATE ON public.tb_onboarding_flows FOR EACH ROW EXECUTE FUNCTION public.atualizar_flow_timestamp();


--
-- Name: tb_fornecedores trg_update_fornecedores; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_fornecedores BEFORE UPDATE ON public.tb_fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_fotos trg_update_fotos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_fotos BEFORE UPDATE ON public.tb_fotos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_jobs trg_update_jobs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_jobs BEFORE UPDATE ON public.tb_jobs FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_lembretes trg_update_lembretes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_lembretes BEFORE UPDATE ON public.tb_lembretes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_listas_desejos trg_update_listas_desejos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_listas_desejos BEFORE UPDATE ON public.tb_listas_desejos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_mensagens_agendadas trg_update_mensagens_agendadas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_mensagens_agendadas BEFORE UPDATE ON public.tb_mensagens_agendadas FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_notas_fiscais trg_update_notas_fiscais_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_notas_fiscais_timestamp BEFORE UPDATE ON public.tb_notas_fiscais FOR EACH ROW EXECUTE FUNCTION public.update_notas_fiscais_timestamp();


--
-- Name: tb_notificacoes trg_update_notificacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_notificacoes BEFORE UPDATE ON public.tb_notificacoes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_pacientes trg_update_pacientes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_pacientes BEFORE UPDATE ON public.tb_pacientes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_pedidos trg_update_pedidos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_pedidos BEFORE UPDATE ON public.tb_pedidos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_pesquisas trg_update_pesquisas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_pesquisas BEFORE UPDATE ON public.tb_pesquisas FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_preferencias_notificacao trg_update_preferencias_notificacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_preferencias_notificacao BEFORE UPDATE ON public.tb_preferencias_notificacao FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_procedimentos trg_update_procedimentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_procedimentos BEFORE UPDATE ON public.tb_procedimentos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_produto_variacoes trg_update_produto_variacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_produto_variacoes BEFORE UPDATE ON public.tb_produto_variacoes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_produtos trg_update_produtos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_produtos BEFORE UPDATE ON public.tb_produtos FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_profissionais trg_update_profissionais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_profissionais BEFORE UPDATE ON public.tb_profissionais FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_user_onboarding_progress trg_update_progress_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_progress_timestamp BEFORE UPDATE ON public.tb_user_onboarding_progress FOR EACH ROW EXECUTE FUNCTION public.atualizar_progress_timestamp();


--
-- Name: tb_prontuarios trg_update_prontuarios; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_prontuarios BEFORE UPDATE ON public.tb_prontuarios FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_repasses trg_update_repasses; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_repasses BEFORE UPDATE ON public.tb_repasses FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_reservas_estoque trg_update_reservas_estoque_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_reservas_estoque_timestamp BEFORE UPDATE ON public.tb_reservas_estoque FOR EACH ROW EXECUTE FUNCTION public.update_reservas_estoque_timestamp();


--
-- Name: tb_respostas_rapidas trg_update_respostas_rapidas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_respostas_rapidas BEFORE UPDATE ON public.tb_respostas_rapidas FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_templates_mensagens trg_update_templates_mensagens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_templates_mensagens BEFORE UPDATE ON public.tb_templates_mensagens FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_transacoes trg_update_transacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_transacoes BEFORE UPDATE ON public.tb_transacoes FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_users trg_update_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_users BEFORE UPDATE ON public.tb_users FOR EACH ROW EXECUTE FUNCTION public.update_dt_atualizacao();


--
-- Name: tb_config_central_atendimento trigger_config_central_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_config_central_timestamp BEFORE UPDATE ON public.tb_config_central_atendimento FOR EACH ROW EXECUTE FUNCTION public.update_config_central_timestamp();


--
-- Name: tb_instalacoes_marketplace trigger_incrementar_instalacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_incrementar_instalacoes AFTER INSERT OR UPDATE ON public.tb_instalacoes_marketplace FOR EACH ROW EXECUTE FUNCTION public.incrementar_instalacoes();


--
-- Name: tb_avaliacoes_agentes trigger_recalcular_media_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_recalcular_media_delete AFTER DELETE ON public.tb_avaliacoes_agentes FOR EACH ROW EXECUTE FUNCTION public.recalcular_media_estrelas();


--
-- Name: tb_avaliacoes_agentes trigger_recalcular_media_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_recalcular_media_insert AFTER INSERT ON public.tb_avaliacoes_agentes FOR EACH ROW EXECUTE FUNCTION public.recalcular_media_estrelas();


--
-- Name: tb_avaliacoes_agentes trigger_recalcular_media_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_recalcular_media_update AFTER UPDATE ON public.tb_avaliacoes_agentes FOR EACH ROW EXECUTE FUNCTION public.recalcular_media_estrelas();


--
-- Name: tb_template_reviews trigger_review_atualizacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_review_atualizacao BEFORE UPDATE ON public.tb_template_reviews FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: tb_templates trigger_template_atualizacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_template_atualizacao BEFORE UPDATE ON public.tb_templates FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: tb_anamnese_templates trigger_update_anamnese_templates_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_anamnese_templates_timestamp BEFORE UPDATE ON public.tb_anamnese_templates FOR EACH ROW EXECUTE FUNCTION public.update_anamnese_templates_timestamp();


--
-- Name: tb_anamneses trigger_update_anamneses_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_anamneses_timestamp BEFORE UPDATE ON public.tb_anamneses FOR EACH ROW EXECUTE FUNCTION public.update_anamneses_timestamp();


--
-- Name: tb_avaliacoes_agentes trigger_update_avaliacao_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_avaliacao_timestamp BEFORE UPDATE ON public.tb_avaliacoes_agentes FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_timestamp();


--
-- Name: tb_template_installations trigger_update_install_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_install_count AFTER INSERT OR DELETE ON public.tb_template_installations FOR EACH ROW EXECUTE FUNCTION public.atualizar_install_count();


--
-- Name: tb_lembretes trigger_update_lembretes_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_lembretes_timestamp BEFORE UPDATE ON public.tb_lembretes FOR EACH ROW EXECUTE FUNCTION public.update_lembretes_timestamp();


--
-- Name: tb_marketplace_agentes trigger_update_marketplace_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_marketplace_timestamp BEFORE UPDATE ON public.tb_marketplace_agentes FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_timestamp();


--
-- Name: tb_messages trigger_update_messages_dt_atualizacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_messages_dt_atualizacao BEFORE UPDATE ON public.tb_messages FOR EACH ROW EXECUTE FUNCTION public.update_messages_dt_atualizacao();


--
-- Name: tb_partner_lead_questions trigger_update_partner_lead_questions_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_partner_lead_questions_timestamp BEFORE UPDATE ON public.tb_partner_lead_questions FOR EACH ROW EXECUTE FUNCTION public.update_partner_lead_questions_timestamp();


--
-- Name: tb_prompt_biblioteca trigger_update_prompt_biblioteca_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_prompt_biblioteca_timestamp BEFORE UPDATE ON public.tb_prompt_biblioteca FOR EACH ROW EXECUTE FUNCTION public.update_prompt_biblioteca_timestamp();


--
-- Name: tb_messages trigger_update_tb_messages_dt_atualizacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_tb_messages_dt_atualizacao BEFORE UPDATE ON public.tb_messages FOR EACH ROW EXECUTE FUNCTION public.update_tb_messages_dt_atualizacao();


--
-- Name: tb_template_reviews trigger_update_template_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_template_rating AFTER INSERT OR DELETE OR UPDATE ON public.tb_template_reviews FOR EACH ROW EXECUTE FUNCTION public.atualizar_template_rating();


--
-- Name: tb_webhooks trigger_update_webhooks_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_webhooks_timestamp BEFORE UPDATE ON public.tb_webhooks FOR EACH ROW EXECUTE FUNCTION public.update_webhooks_timestamp();


--
-- Name: tb_template_reviews trigger_verificar_instalacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_verificar_instalacao BEFORE INSERT OR UPDATE ON public.tb_template_reviews FOR EACH ROW EXECUTE FUNCTION public.verificar_instalacao_review();


--
-- Name: tb_export_jobs fk_export_jobs_agendamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_export_jobs
    ADD CONSTRAINT fk_export_jobs_agendamento FOREIGN KEY (id_agendamento) REFERENCES public.tb_export_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_pagamentos fk_pagamento_empresa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pagamentos
    ADD CONSTRAINT fk_pagamento_empresa FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_pagamentos fk_pagamento_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pagamentos
    ADD CONSTRAINT fk_pagamento_user FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_partner_leads fk_partner_lead_empresa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_leads
    ADD CONSTRAINT fk_partner_lead_empresa FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_partner_leads fk_partner_lead_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_leads
    ADD CONSTRAINT fk_partner_lead_user FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_password_reset_tokens fk_password_reset_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_password_reset_tokens
    ADD CONSTRAINT fk_password_reset_user FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_profissionais_clinicas fk_profissional_clinica_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_profissionais_clinicas
    ADD CONSTRAINT fk_profissional_clinica_clinica FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_profissionais_clinicas fk_profissional_clinica_profissional; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_profissionais_clinicas
    ADD CONSTRAINT fk_profissional_clinica_profissional FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_transacoes_pagamento fk_transacao_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes_pagamento
    ADD CONSTRAINT fk_transacao_pagamento FOREIGN KEY (id_pagamento) REFERENCES public.tb_pagamentos(id_pagamento) ON DELETE CASCADE;


--
-- Name: tb_agendamentos tb_agendamentos_id_clinica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agendamentos
    ADD CONSTRAINT tb_agendamentos_id_clinica_fkey FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_agendamentos tb_agendamentos_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agendamentos
    ADD CONSTRAINT tb_agendamentos_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE CASCADE;


--
-- Name: tb_agendamentos tb_agendamentos_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agendamentos
    ADD CONSTRAINT tb_agendamentos_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE SET NULL;


--
-- Name: tb_agendamentos tb_agendamentos_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agendamentos
    ADD CONSTRAINT tb_agendamentos_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_agent_document_stores tb_agent_document_stores_id_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agent_document_stores
    ADD CONSTRAINT tb_agent_document_stores_id_agente_fkey FOREIGN KEY (id_agente) REFERENCES public.tb_agentes(id_agente) ON DELETE CASCADE;


--
-- Name: tb_agent_document_stores tb_agent_document_stores_id_documento_store_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agent_document_stores
    ADD CONSTRAINT tb_agent_document_stores_id_documento_store_fkey FOREIGN KEY (id_documento_store) REFERENCES public.tb_documento_store(id_documento_store) ON DELETE CASCADE;


--
-- Name: tb_agente_tools tb_agente_tools_id_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agente_tools
    ADD CONSTRAINT tb_agente_tools_id_agente_fkey FOREIGN KEY (id_agente) REFERENCES public.tb_agentes(id_agente) ON DELETE CASCADE;


--
-- Name: tb_agente_tools tb_agente_tools_id_tool_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agente_tools
    ADD CONSTRAINT tb_agente_tools_id_tool_fkey FOREIGN KEY (id_tool) REFERENCES public.tb_tools(id_tool) ON DELETE CASCADE;


--
-- Name: tb_agentes tb_agentes_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_agentes
    ADD CONSTRAINT tb_agentes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_albuns tb_albuns_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_albuns
    ADD CONSTRAINT tb_albuns_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_albuns tb_albuns_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_albuns
    ADD CONSTRAINT tb_albuns_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE CASCADE;


--
-- Name: tb_albuns tb_albuns_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_albuns
    ADD CONSTRAINT tb_albuns_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE CASCADE;


--
-- Name: tb_albuns tb_albuns_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_albuns
    ADD CONSTRAINT tb_albuns_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_albuns tb_albuns_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_albuns
    ADD CONSTRAINT tb_albuns_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_analytics_events tb_analytics_events_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_analytics_events
    ADD CONSTRAINT tb_analytics_events_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_analytics_events tb_analytics_events_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_analytics_events
    ADD CONSTRAINT tb_analytics_events_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_anamnese_templates tb_anamnese_templates_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamnese_templates
    ADD CONSTRAINT tb_anamnese_templates_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_anamneses tb_anamneses_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamneses
    ADD CONSTRAINT tb_anamneses_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_anamneses tb_anamneses_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamneses
    ADD CONSTRAINT tb_anamneses_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_anamneses tb_anamneses_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamneses
    ADD CONSTRAINT tb_anamneses_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE SET NULL;


--
-- Name: tb_anamneses tb_anamneses_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamneses
    ADD CONSTRAINT tb_anamneses_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_anamneses tb_anamneses_id_template_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anamneses
    ADD CONSTRAINT tb_anamneses_id_template_fkey FOREIGN KEY (id_template) REFERENCES public.tb_anamnese_templates(id_template) ON DELETE RESTRICT;


--
-- Name: tb_anexos_mensagens tb_anexos_mensagens_id_mensagem_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_anexos_mensagens
    ADD CONSTRAINT tb_anexos_mensagens_id_mensagem_fkey FOREIGN KEY (id_mensagem) REFERENCES public.tb_mensagens_usuarios(id_mensagem) ON DELETE CASCADE;


--
-- Name: tb_api_keys tb_api_keys_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_api_keys
    ADD CONSTRAINT tb_api_keys_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_api_keys tb_api_keys_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_api_keys
    ADD CONSTRAINT tb_api_keys_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_atendimento_items tb_atendimento_items_id_atendente_anterior_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atendimento_items
    ADD CONSTRAINT tb_atendimento_items_id_atendente_anterior_fkey FOREIGN KEY (id_atendente_anterior) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_atendimento_items tb_atendimento_items_id_atendente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atendimento_items
    ADD CONSTRAINT tb_atendimento_items_id_atendente_fkey FOREIGN KEY (id_atendente) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_atendimento_items tb_atendimento_items_id_contato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atendimento_items
    ADD CONSTRAINT tb_atendimento_items_id_contato_fkey FOREIGN KEY (id_contato) REFERENCES public.tb_contatos_omni(id_contato) ON DELETE CASCADE;


--
-- Name: tb_atendimento_items tb_atendimento_items_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atendimento_items
    ADD CONSTRAINT tb_atendimento_items_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas_omni(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_atendimento_items tb_atendimento_items_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atendimento_items
    ADD CONSTRAINT tb_atendimento_items_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_atendimento_items tb_atendimento_items_id_fila_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atendimento_items
    ADD CONSTRAINT tb_atendimento_items_id_fila_fkey FOREIGN KEY (id_fila) REFERENCES public.tb_filas_atendimento(id_fila) ON DELETE CASCADE;


--
-- Name: tb_atividades tb_atividades_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atividades
    ADD CONSTRAINT tb_atividades_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_atividades tb_atividades_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_atividades
    ADD CONSTRAINT tb_atividades_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_avaliacoes_agentes tb_avaliacoes_agentes_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_agentes
    ADD CONSTRAINT tb_avaliacoes_agentes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa);


--
-- Name: tb_avaliacoes_agentes tb_avaliacoes_agentes_id_marketplace_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_agentes
    ADD CONSTRAINT tb_avaliacoes_agentes_id_marketplace_agente_fkey FOREIGN KEY (id_marketplace_agente) REFERENCES public.tb_marketplace_agentes(id_marketplace_agente) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes_fotos_moderacao tb_avaliacoes_fotos_moderacao_id_avaliacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_fotos_moderacao
    ADD CONSTRAINT tb_avaliacoes_fotos_moderacao_id_avaliacao_fkey FOREIGN KEY (id_avaliacao) REFERENCES public.tb_avaliacoes(id_avaliacao) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes_fotos_moderacao tb_avaliacoes_fotos_moderacao_id_moderador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_fotos_moderacao
    ADD CONSTRAINT tb_avaliacoes_fotos_moderacao_id_moderador_fkey FOREIGN KEY (id_moderador) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_avaliacoes tb_avaliacoes_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes
    ADD CONSTRAINT tb_avaliacoes_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes tb_avaliacoes_id_clinica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes
    ADD CONSTRAINT tb_avaliacoes_id_clinica_fkey FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes tb_avaliacoes_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes
    ADD CONSTRAINT tb_avaliacoes_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes tb_avaliacoes_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes
    ADD CONSTRAINT tb_avaliacoes_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE SET NULL;


--
-- Name: tb_avaliacoes tb_avaliacoes_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes
    ADD CONSTRAINT tb_avaliacoes_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes_likes tb_avaliacoes_likes_id_avaliacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_likes
    ADD CONSTRAINT tb_avaliacoes_likes_id_avaliacao_fkey FOREIGN KEY (id_avaliacao) REFERENCES public.tb_avaliacoes(id_avaliacao) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes_likes tb_avaliacoes_likes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_likes
    ADD CONSTRAINT tb_avaliacoes_likes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes_produtos tb_avaliacoes_produtos_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_produtos
    ADD CONSTRAINT tb_avaliacoes_produtos_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE CASCADE;


--
-- Name: tb_avaliacoes_produtos tb_avaliacoes_produtos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacoes_produtos
    ADD CONSTRAINT tb_avaliacoes_produtos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_banners tb_banners_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_banners
    ADD CONSTRAINT tb_banners_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_banners tb_banners_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_banners
    ADD CONSTRAINT tb_banners_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE SET NULL;


--
-- Name: tb_banners tb_banners_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_banners
    ADD CONSTRAINT tb_banners_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE SET NULL;


--
-- Name: tb_broadcast_campanhas tb_broadcast_campanhas_ds_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_campanhas
    ADD CONSTRAINT tb_broadcast_campanhas_ds_template_id_fkey FOREIGN KEY (ds_template_id) REFERENCES public.tb_broadcast_templates(id_template) ON DELETE SET NULL;


--
-- Name: tb_broadcast_campanhas tb_broadcast_campanhas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_campanhas
    ADD CONSTRAINT tb_broadcast_campanhas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_broadcast_campanhas tb_broadcast_campanhas_id_user_criador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_campanhas
    ADD CONSTRAINT tb_broadcast_campanhas_id_user_criador_fkey FOREIGN KEY (id_user_criador) REFERENCES public.tb_users(id_user) ON DELETE RESTRICT;


--
-- Name: tb_broadcast_destinatarios tb_broadcast_destinatarios_id_campanha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_destinatarios
    ADD CONSTRAINT tb_broadcast_destinatarios_id_campanha_fkey FOREIGN KEY (id_campanha) REFERENCES public.tb_broadcast_campanhas(id_campanha) ON DELETE CASCADE;


--
-- Name: tb_broadcast_destinatarios tb_broadcast_destinatarios_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_destinatarios
    ADD CONSTRAINT tb_broadcast_destinatarios_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_broadcast_templates tb_broadcast_templates_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_broadcast_templates
    ADD CONSTRAINT tb_broadcast_templates_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_campanha_destinatarios tb_campanha_destinatarios_id_campanha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanha_destinatarios
    ADD CONSTRAINT tb_campanha_destinatarios_id_campanha_fkey FOREIGN KEY (id_campanha) REFERENCES public.tb_campanhas(id_campanha) ON DELETE CASCADE;


--
-- Name: tb_campanha_destinatarios tb_campanha_destinatarios_id_contato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanha_destinatarios
    ADD CONSTRAINT tb_campanha_destinatarios_id_contato_fkey FOREIGN KEY (id_contato) REFERENCES public.tb_contatos_omni(id_contato) ON DELETE CASCADE;


--
-- Name: tb_campanhas tb_campanhas_id_canal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanhas
    ADD CONSTRAINT tb_campanhas_id_canal_fkey FOREIGN KEY (id_canal) REFERENCES public.tb_canais_omni(id_canal) ON DELETE SET NULL;


--
-- Name: tb_campanhas tb_campanhas_id_criador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanhas
    ADD CONSTRAINT tb_campanhas_id_criador_fkey FOREIGN KEY (id_criador) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_campanhas tb_campanhas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_campanhas
    ADD CONSTRAINT tb_campanhas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_canais_omni tb_canais_omni_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_canais_omni
    ADD CONSTRAINT tb_canais_omni_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_candidaturas tb_candidaturas_id_candidato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_candidaturas
    ADD CONSTRAINT tb_candidaturas_id_candidato_fkey FOREIGN KEY (id_candidato) REFERENCES public.tb_users(id_user);


--
-- Name: tb_candidaturas tb_candidaturas_id_curriculo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_candidaturas
    ADD CONSTRAINT tb_candidaturas_id_curriculo_fkey FOREIGN KEY (id_curriculo) REFERENCES public.tb_curriculos(id_curriculo);


--
-- Name: tb_candidaturas tb_candidaturas_id_vaga_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_candidaturas
    ADD CONSTRAINT tb_candidaturas_id_vaga_fkey FOREIGN KEY (id_vaga) REFERENCES public.tb_vagas(id_vaga);


--
-- Name: tb_carrinho tb_carrinho_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_carrinho
    ADD CONSTRAINT tb_carrinho_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE CASCADE;


--
-- Name: tb_carrinho tb_carrinho_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_carrinho
    ADD CONSTRAINT tb_carrinho_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE CASCADE;


--
-- Name: tb_carrinho tb_carrinho_id_profissional_desejado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_carrinho
    ADD CONSTRAINT tb_carrinho_id_profissional_desejado_fkey FOREIGN KEY (id_profissional_desejado) REFERENCES public.tb_profissionais(id_profissional) ON DELETE SET NULL;


--
-- Name: tb_carrinho tb_carrinho_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_carrinho
    ADD CONSTRAINT tb_carrinho_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE SET NULL;


--
-- Name: tb_carrinho tb_carrinho_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_carrinho
    ADD CONSTRAINT tb_carrinho_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_carrinho tb_carrinho_id_variacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_carrinho
    ADD CONSTRAINT tb_carrinho_id_variacao_fkey FOREIGN KEY (id_variacao) REFERENCES public.tb_produto_variacoes(id_variacao) ON DELETE CASCADE;


--
-- Name: tb_categorias_financeiras tb_categorias_financeiras_id_categoria_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_categorias_financeiras
    ADD CONSTRAINT tb_categorias_financeiras_id_categoria_pai_fkey FOREIGN KEY (id_categoria_pai) REFERENCES public.tb_categorias_financeiras(id_categoria) ON DELETE SET NULL;


--
-- Name: tb_categorias_financeiras tb_categorias_financeiras_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_categorias_financeiras
    ADD CONSTRAINT tb_categorias_financeiras_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_categorias_produtos tb_categorias_produtos_id_categoria_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_categorias_produtos
    ADD CONSTRAINT tb_categorias_produtos_id_categoria_pai_fkey FOREIGN KEY (id_categoria_pai) REFERENCES public.tb_categorias_produtos(id_categoria) ON DELETE SET NULL;


--
-- Name: tb_clinicas tb_clinicas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_clinicas
    ADD CONSTRAINT tb_clinicas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_cliques_banners tb_cliques_banners_id_banner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cliques_banners
    ADD CONSTRAINT tb_cliques_banners_id_banner_fkey FOREIGN KEY (id_banner) REFERENCES public.tb_banners(id_banner) ON DELETE CASCADE;


--
-- Name: tb_cliques_banners tb_cliques_banners_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cliques_banners
    ADD CONSTRAINT tb_cliques_banners_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_comentarios_fotos tb_comentarios_fotos_id_comentario_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_comentarios_fotos
    ADD CONSTRAINT tb_comentarios_fotos_id_comentario_pai_fkey FOREIGN KEY (id_comentario_pai) REFERENCES public.tb_comentarios_fotos(id_comentario) ON DELETE CASCADE;


--
-- Name: tb_comentarios_fotos tb_comentarios_fotos_id_foto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_comentarios_fotos
    ADD CONSTRAINT tb_comentarios_fotos_id_foto_fkey FOREIGN KEY (id_foto) REFERENCES public.tb_fotos(id_foto) ON DELETE CASCADE;


--
-- Name: tb_comentarios_fotos tb_comentarios_fotos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_comentarios_fotos
    ADD CONSTRAINT tb_comentarios_fotos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_compartilhamentos_album tb_compartilhamentos_album_id_album_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_compartilhamentos_album
    ADD CONSTRAINT tb_compartilhamentos_album_id_album_fkey FOREIGN KEY (id_album) REFERENCES public.tb_albuns(id_album) ON DELETE CASCADE;


--
-- Name: tb_compartilhamentos_album tb_compartilhamentos_album_id_user_compartilhou_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_compartilhamentos_album
    ADD CONSTRAINT tb_compartilhamentos_album_id_user_compartilhou_fkey FOREIGN KEY (id_user_compartilhou) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_compartilhamentos_album tb_compartilhamentos_album_id_user_destinatario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_compartilhamentos_album
    ADD CONSTRAINT tb_compartilhamentos_album_id_user_destinatario_fkey FOREIGN KEY (id_user_destinatario) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_config_central_atendimento tb_config_central_atendimento_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_config_central_atendimento
    ADD CONSTRAINT tb_config_central_atendimento_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_configuracoes tb_configuracoes_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_configuracoes
    ADD CONSTRAINT tb_configuracoes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_contas_bancarias tb_contas_bancarias_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contas_bancarias
    ADD CONSTRAINT tb_contas_bancarias_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_contas_bancarias tb_contas_bancarias_id_fornecedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contas_bancarias
    ADD CONSTRAINT tb_contas_bancarias_id_fornecedor_fkey FOREIGN KEY (id_fornecedor) REFERENCES public.tb_fornecedores(id_fornecedor) ON DELETE CASCADE;


--
-- Name: tb_contas_bancarias tb_contas_bancarias_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contas_bancarias
    ADD CONSTRAINT tb_contas_bancarias_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_contatos_omni tb_contatos_omni_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contatos_omni
    ADD CONSTRAINT tb_contatos_omni_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_contatos_omni tb_contatos_omni_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_contatos_omni
    ADD CONSTRAINT tb_contatos_omni_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE SET NULL;


--
-- Name: tb_conversas_compartilhadas tb_conversas_compartilhadas_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_compartilhadas
    ADD CONSTRAINT tb_conversas_compartilhadas_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_conversas_compartilhadas tb_conversas_compartilhadas_id_user_criador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_compartilhadas
    ADD CONSTRAINT tb_conversas_compartilhadas_id_user_criador_fkey FOREIGN KEY (id_user_criador) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_conversas tb_conversas_id_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas
    ADD CONSTRAINT tb_conversas_id_agente_fkey FOREIGN KEY (id_agente) REFERENCES public.tb_agentes(id_agente) ON DELETE CASCADE;


--
-- Name: tb_conversas tb_conversas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas
    ADD CONSTRAINT tb_conversas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_conversas tb_conversas_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas
    ADD CONSTRAINT tb_conversas_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE SET NULL;


--
-- Name: tb_conversas tb_conversas_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas
    ADD CONSTRAINT tb_conversas_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_conversas_omni tb_conversas_omni_id_atendente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_omni
    ADD CONSTRAINT tb_conversas_omni_id_atendente_fkey FOREIGN KEY (id_atendente) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_conversas_omni tb_conversas_omni_id_canal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_omni
    ADD CONSTRAINT tb_conversas_omni_id_canal_fkey FOREIGN KEY (id_canal) REFERENCES public.tb_canais_omni(id_canal) ON DELETE SET NULL;


--
-- Name: tb_conversas_omni tb_conversas_omni_id_contato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_omni
    ADD CONSTRAINT tb_conversas_omni_id_contato_fkey FOREIGN KEY (id_contato) REFERENCES public.tb_contatos_omni(id_contato) ON DELETE CASCADE;


--
-- Name: tb_conversas_omni tb_conversas_omni_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_omni
    ADD CONSTRAINT tb_conversas_omni_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_conversas_omni tb_conversas_omni_id_fila_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_omni
    ADD CONSTRAINT tb_conversas_omni_id_fila_fkey FOREIGN KEY (id_fila) REFERENCES public.tb_filas_atendimento(id_fila) ON DELETE SET NULL;


--
-- Name: tb_conversas_usuarios tb_conversas_usuarios_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_conversas_usuarios
    ADD CONSTRAINT tb_conversas_usuarios_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_cupons tb_cupons_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons
    ADD CONSTRAINT tb_cupons_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_cupons tb_cupons_id_fornecedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons
    ADD CONSTRAINT tb_cupons_id_fornecedor_fkey FOREIGN KEY (id_fornecedor) REFERENCES public.tb_fornecedores(id_fornecedor) ON DELETE CASCADE;


--
-- Name: tb_cupons_uso tb_cupons_uso_id_cupom_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons_uso
    ADD CONSTRAINT tb_cupons_uso_id_cupom_fkey FOREIGN KEY (id_cupom) REFERENCES public.tb_cupons(id_cupom) ON DELETE CASCADE;


--
-- Name: tb_cupons_uso tb_cupons_uso_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons_uso
    ADD CONSTRAINT tb_cupons_uso_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE CASCADE;


--
-- Name: tb_cupons_uso tb_cupons_uso_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_cupons_uso
    ADD CONSTRAINT tb_cupons_uso_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_curriculos tb_curriculos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_curriculos
    ADD CONSTRAINT tb_curriculos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.tb_users(id_user);


--
-- Name: tb_curtidas_fotos tb_curtidas_fotos_id_foto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_curtidas_fotos
    ADD CONSTRAINT tb_curtidas_fotos_id_foto_fkey FOREIGN KEY (id_foto) REFERENCES public.tb_fotos(id_foto) ON DELETE CASCADE;


--
-- Name: tb_curtidas_fotos tb_curtidas_fotos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_curtidas_fotos
    ADD CONSTRAINT tb_curtidas_fotos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_dispositivos tb_dispositivos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_dispositivos
    ADD CONSTRAINT tb_dispositivos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_documento_store_file_chunk tb_documento_store_file_chunk_id_store_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_documento_store_file_chunk
    ADD CONSTRAINT tb_documento_store_file_chunk_id_store_fkey FOREIGN KEY (id_store) REFERENCES public.tb_documento_store(id_documento_store) ON DELETE CASCADE;


--
-- Name: tb_email_logs tb_email_logs_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_email_logs
    ADD CONSTRAINT tb_email_logs_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_email_logs tb_email_logs_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_email_logs
    ADD CONSTRAINT tb_email_logs_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_execucoes_jobs tb_execucoes_jobs_id_job_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_execucoes_jobs
    ADD CONSTRAINT tb_execucoes_jobs_id_job_fkey FOREIGN KEY (id_job) REFERENCES public.tb_jobs(id_job) ON DELETE CASCADE;


--
-- Name: tb_export_agendamentos tb_export_agendamentos_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_export_agendamentos
    ADD CONSTRAINT tb_export_agendamentos_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_export_agendamentos tb_export_agendamentos_id_user_criador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_export_agendamentos
    ADD CONSTRAINT tb_export_agendamentos_id_user_criador_fkey FOREIGN KEY (id_user_criador) REFERENCES public.tb_users(id_user) ON DELETE RESTRICT;


--
-- Name: tb_export_jobs tb_export_jobs_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_export_jobs
    ADD CONSTRAINT tb_export_jobs_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_export_jobs tb_export_jobs_id_user_solicitante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_export_jobs
    ADD CONSTRAINT tb_export_jobs_id_user_solicitante_fkey FOREIGN KEY (id_user_solicitante) REFERENCES public.tb_users(id_user) ON DELETE RESTRICT;


--
-- Name: tb_faturas tb_faturas_id_empresa_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_faturas
    ADD CONSTRAINT tb_faturas_id_empresa_cliente_fkey FOREIGN KEY (id_empresa_cliente) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_faturas tb_faturas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_faturas
    ADD CONSTRAINT tb_faturas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_faturas tb_faturas_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_faturas
    ADD CONSTRAINT tb_faturas_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE CASCADE;


--
-- Name: tb_favoritos tb_favoritos_id_clinica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_id_clinica_fkey FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_favoritos tb_favoritos_id_fornecedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_id_fornecedor_fkey FOREIGN KEY (id_fornecedor) REFERENCES public.tb_fornecedores(id_fornecedor) ON DELETE CASCADE;


--
-- Name: tb_favoritos tb_favoritos_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE CASCADE;


--
-- Name: tb_favoritos tb_favoritos_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE CASCADE;


--
-- Name: tb_favoritos tb_favoritos_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_favoritos tb_favoritos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_favoritos tb_favoritos_id_vaga_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_favoritos
    ADD CONSTRAINT tb_favoritos_id_vaga_fkey FOREIGN KEY (id_vaga) REFERENCES public.tb_vagas(id_vaga) ON DELETE CASCADE;


--
-- Name: tb_filas_atendimento tb_filas_atendimento_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_filas_atendimento
    ADD CONSTRAINT tb_filas_atendimento_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_fornecedores tb_fornecedores_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fornecedores
    ADD CONSTRAINT tb_fornecedores_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_fornecedores tb_fornecedores_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fornecedores
    ADD CONSTRAINT tb_fornecedores_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_fotos tb_fotos_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fotos
    ADD CONSTRAINT tb_fotos_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_fotos tb_fotos_id_album_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fotos
    ADD CONSTRAINT tb_fotos_id_album_fkey FOREIGN KEY (id_album) REFERENCES public.tb_albuns(id_album) ON DELETE CASCADE;


--
-- Name: tb_fotos tb_fotos_id_foto_relacionada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fotos
    ADD CONSTRAINT tb_fotos_id_foto_relacionada_fkey FOREIGN KEY (id_foto_relacionada) REFERENCES public.tb_fotos(id_foto) ON DELETE SET NULL;


--
-- Name: tb_fotos tb_fotos_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fotos
    ADD CONSTRAINT tb_fotos_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE SET NULL;


--
-- Name: tb_fotos tb_fotos_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fotos
    ADD CONSTRAINT tb_fotos_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE SET NULL;


--
-- Name: tb_fotos tb_fotos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_fotos
    ADD CONSTRAINT tb_fotos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_historico_configuracoes tb_historico_configuracoes_id_configuracao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_historico_configuracoes
    ADD CONSTRAINT tb_historico_configuracoes_id_configuracao_fkey FOREIGN KEY (id_configuracao) REFERENCES public.tb_configuracoes(id_configuracao) ON DELETE CASCADE;


--
-- Name: tb_historico_configuracoes tb_historico_configuracoes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_historico_configuracoes
    ADD CONSTRAINT tb_historico_configuracoes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_instalacoes_marketplace tb_instalacoes_marketplace_id_agente_instalado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_instalacoes_marketplace
    ADD CONSTRAINT tb_instalacoes_marketplace_id_agente_instalado_fkey FOREIGN KEY (id_agente_instalado) REFERENCES public.tb_agentes(id_agente) ON DELETE CASCADE;


--
-- Name: tb_instalacoes_marketplace tb_instalacoes_marketplace_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_instalacoes_marketplace
    ADD CONSTRAINT tb_instalacoes_marketplace_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa);


--
-- Name: tb_instalacoes_marketplace tb_instalacoes_marketplace_id_marketplace_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_instalacoes_marketplace
    ADD CONSTRAINT tb_instalacoes_marketplace_id_marketplace_agente_fkey FOREIGN KEY (id_marketplace_agente) REFERENCES public.tb_marketplace_agentes(id_marketplace_agente) ON DELETE CASCADE;


--
-- Name: tb_invoices tb_invoices_id_subscription_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_invoices
    ADD CONSTRAINT tb_invoices_id_subscription_fkey FOREIGN KEY (id_subscription) REFERENCES public.tb_subscriptions(id_subscription) ON DELETE CASCADE;


--
-- Name: tb_invoices tb_invoices_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_invoices
    ADD CONSTRAINT tb_invoices_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_itens_fatura tb_itens_fatura_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_fatura
    ADD CONSTRAINT tb_itens_fatura_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_itens_fatura tb_itens_fatura_id_fatura_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_fatura
    ADD CONSTRAINT tb_itens_fatura_id_fatura_fkey FOREIGN KEY (id_fatura) REFERENCES public.tb_faturas(id_fatura) ON DELETE CASCADE;


--
-- Name: tb_itens_fatura tb_itens_fatura_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_fatura
    ADD CONSTRAINT tb_itens_fatura_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE SET NULL;


--
-- Name: tb_itens_lista_desejos tb_itens_lista_desejos_id_lista_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_lista_desejos
    ADD CONSTRAINT tb_itens_lista_desejos_id_lista_fkey FOREIGN KEY (id_lista) REFERENCES public.tb_listas_desejos(id_lista) ON DELETE CASCADE;


--
-- Name: tb_itens_lista_desejos tb_itens_lista_desejos_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_lista_desejos
    ADD CONSTRAINT tb_itens_lista_desejos_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE CASCADE;


--
-- Name: tb_itens_lista_desejos tb_itens_lista_desejos_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_lista_desejos
    ADD CONSTRAINT tb_itens_lista_desejos_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE CASCADE;


--
-- Name: tb_itens_pedido tb_itens_pedido_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_pedido
    ADD CONSTRAINT tb_itens_pedido_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE CASCADE;


--
-- Name: tb_itens_pedido tb_itens_pedido_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_pedido
    ADD CONSTRAINT tb_itens_pedido_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE SET NULL;


--
-- Name: tb_itens_pedido tb_itens_pedido_id_variacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_pedido
    ADD CONSTRAINT tb_itens_pedido_id_variacao_fkey FOREIGN KEY (id_variacao) REFERENCES public.tb_produto_variacoes(id_variacao) ON DELETE SET NULL;


--
-- Name: tb_itens_repasse tb_itens_repasse_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_repasse
    ADD CONSTRAINT tb_itens_repasse_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_itens_repasse tb_itens_repasse_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_repasse
    ADD CONSTRAINT tb_itens_repasse_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE SET NULL;


--
-- Name: tb_itens_repasse tb_itens_repasse_id_repasse_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_repasse
    ADD CONSTRAINT tb_itens_repasse_id_repasse_fkey FOREIGN KEY (id_repasse) REFERENCES public.tb_repasses(id_repasse) ON DELETE CASCADE;


--
-- Name: tb_itens_repasse tb_itens_repasse_id_transacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_itens_repasse
    ADD CONSTRAINT tb_itens_repasse_id_transacao_fkey FOREIGN KEY (id_transacao) REFERENCES public.tb_transacoes(id_transacao) ON DELETE SET NULL;


--
-- Name: tb_lead_score_historico tb_lead_score_historico_id_contato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lead_score_historico
    ADD CONSTRAINT tb_lead_score_historico_id_contato_fkey FOREIGN KEY (id_contato) REFERENCES public.tb_contatos_omni(id_contato) ON DELETE CASCADE;


--
-- Name: tb_lead_score_historico tb_lead_score_historico_id_score_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lead_score_historico
    ADD CONSTRAINT tb_lead_score_historico_id_score_fkey FOREIGN KEY (id_score) REFERENCES public.tb_lead_scores(id_score) ON DELETE CASCADE;


--
-- Name: tb_lead_scores tb_lead_scores_id_contato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lead_scores
    ADD CONSTRAINT tb_lead_scores_id_contato_fkey FOREIGN KEY (id_contato) REFERENCES public.tb_contatos_omni(id_contato) ON DELETE CASCADE;


--
-- Name: tb_lead_scores tb_lead_scores_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lead_scores
    ADD CONSTRAINT tb_lead_scores_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_leitura_mensagens tb_leitura_mensagens_id_mensagem_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_leitura_mensagens
    ADD CONSTRAINT tb_leitura_mensagens_id_mensagem_fkey FOREIGN KEY (id_mensagem) REFERENCES public.tb_mensagens_usuarios(id_mensagem) ON DELETE CASCADE;


--
-- Name: tb_leitura_mensagens tb_leitura_mensagens_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_leitura_mensagens
    ADD CONSTRAINT tb_leitura_mensagens_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_lembretes tb_lembretes_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lembretes
    ADD CONSTRAINT tb_lembretes_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE CASCADE;


--
-- Name: tb_lembretes tb_lembretes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_lembretes
    ADD CONSTRAINT tb_lembretes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_listas_desejos tb_listas_desejos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_listas_desejos
    ADD CONSTRAINT tb_listas_desejos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_logs_acesso tb_logs_acesso_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_acesso
    ADD CONSTRAINT tb_logs_acesso_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_logs_erro tb_logs_erro_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_erro
    ADD CONSTRAINT tb_logs_erro_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_logs_erro tb_logs_erro_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_erro
    ADD CONSTRAINT tb_logs_erro_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_logs_erro tb_logs_erro_id_user_resolveu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_erro
    ADD CONSTRAINT tb_logs_erro_id_user_resolveu_fkey FOREIGN KEY (id_user_resolveu) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_logs_integracao tb_logs_integracao_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_integracao
    ADD CONSTRAINT tb_logs_integracao_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_logs_integracao tb_logs_integracao_id_notificacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_integracao
    ADD CONSTRAINT tb_logs_integracao_id_notificacao_fkey FOREIGN KEY (id_notificacao) REFERENCES public.tb_notificacoes(id_notificacao) ON DELETE SET NULL;


--
-- Name: tb_logs_integracao tb_logs_integracao_id_transacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_logs_integracao
    ADD CONSTRAINT tb_logs_integracao_id_transacao_fkey FOREIGN KEY (id_transacao) REFERENCES public.tb_transacoes(id_transacao) ON DELETE SET NULL;


--
-- Name: tb_marketplace_agentes tb_marketplace_agentes_id_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_marketplace_agentes
    ADD CONSTRAINT tb_marketplace_agentes_id_agente_fkey FOREIGN KEY (id_agente) REFERENCES public.tb_agentes(id_agente) ON DELETE CASCADE;


--
-- Name: tb_marketplace_agentes tb_marketplace_agentes_id_empresa_publicador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_marketplace_agentes
    ADD CONSTRAINT tb_marketplace_agentes_id_empresa_publicador_fkey FOREIGN KEY (id_empresa_publicador) REFERENCES public.tb_empresas(id_empresa);


--
-- Name: tb_mensagens_agendadas tb_mensagens_agendadas_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_agendadas
    ADD CONSTRAINT tb_mensagens_agendadas_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas_usuarios(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_mensagens_agendadas tb_mensagens_agendadas_id_mensagem_criada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_agendadas
    ADD CONSTRAINT tb_mensagens_agendadas_id_mensagem_criada_fkey FOREIGN KEY (id_mensagem_criada) REFERENCES public.tb_mensagens_usuarios(id_mensagem) ON DELETE SET NULL;


--
-- Name: tb_mensagens_agendadas tb_mensagens_agendadas_id_remetente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_agendadas
    ADD CONSTRAINT tb_mensagens_agendadas_id_remetente_fkey FOREIGN KEY (id_remetente) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_mensagens tb_mensagens_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens
    ADD CONSTRAINT tb_mensagens_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_mensagens tb_mensagens_id_mensagem_original_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens
    ADD CONSTRAINT tb_mensagens_id_mensagem_original_fkey FOREIGN KEY (id_mensagem_original) REFERENCES public.tb_mensagens(id_mensagem);


--
-- Name: tb_mensagens tb_mensagens_id_mensagem_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens
    ADD CONSTRAINT tb_mensagens_id_mensagem_pai_fkey FOREIGN KEY (id_mensagem_pai) REFERENCES public.tb_mensagens(id_mensagem);


--
-- Name: tb_mensagens_omni tb_mensagens_omni_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_omni
    ADD CONSTRAINT tb_mensagens_omni_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas_omni(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_mensagens_usuarios tb_mensagens_usuarios_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_usuarios
    ADD CONSTRAINT tb_mensagens_usuarios_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_mensagens_usuarios tb_mensagens_usuarios_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_usuarios
    ADD CONSTRAINT tb_mensagens_usuarios_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas_usuarios(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_mensagens_usuarios tb_mensagens_usuarios_id_mensagem_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_usuarios
    ADD CONSTRAINT tb_mensagens_usuarios_id_mensagem_pai_fkey FOREIGN KEY (id_mensagem_pai) REFERENCES public.tb_mensagens_usuarios(id_mensagem) ON DELETE SET NULL;


--
-- Name: tb_mensagens_usuarios tb_mensagens_usuarios_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_usuarios
    ADD CONSTRAINT tb_mensagens_usuarios_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE SET NULL;


--
-- Name: tb_mensagens_usuarios tb_mensagens_usuarios_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_usuarios
    ADD CONSTRAINT tb_mensagens_usuarios_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE SET NULL;


--
-- Name: tb_mensagens_usuarios tb_mensagens_usuarios_id_remetente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagens_usuarios
    ADD CONSTRAINT tb_mensagens_usuarios_id_remetente_fkey FOREIGN KEY (id_remetente) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_messages tb_messages_id_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_messages
    ADD CONSTRAINT tb_messages_id_agente_fkey FOREIGN KEY (id_agente) REFERENCES public.tb_agentes(id_agente) ON DELETE SET NULL;


--
-- Name: tb_messages tb_messages_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_messages
    ADD CONSTRAINT tb_messages_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_messages tb_messages_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_messages
    ADD CONSTRAINT tb_messages_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_movimentacoes_estoque tb_movimentacoes_estoque_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_movimentacoes_estoque
    ADD CONSTRAINT tb_movimentacoes_estoque_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_movimentacoes_estoque tb_movimentacoes_estoque_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_movimentacoes_estoque
    ADD CONSTRAINT tb_movimentacoes_estoque_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_movimentacoes_estoque tb_movimentacoes_estoque_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_movimentacoes_estoque
    ADD CONSTRAINT tb_movimentacoes_estoque_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE SET NULL;


--
-- Name: tb_movimentacoes_estoque tb_movimentacoes_estoque_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_movimentacoes_estoque
    ADD CONSTRAINT tb_movimentacoes_estoque_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE RESTRICT;


--
-- Name: tb_movimentacoes_estoque tb_movimentacoes_estoque_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_movimentacoes_estoque
    ADD CONSTRAINT tb_movimentacoes_estoque_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_notas_fiscais tb_notas_fiscais_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notas_fiscais
    ADD CONSTRAINT tb_notas_fiscais_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_notas_fiscais tb_notas_fiscais_id_fatura_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notas_fiscais
    ADD CONSTRAINT tb_notas_fiscais_id_fatura_fkey FOREIGN KEY (id_fatura) REFERENCES public.tb_faturas(id_fatura) ON DELETE SET NULL;


--
-- Name: tb_notas_fiscais tb_notas_fiscais_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notas_fiscais
    ADD CONSTRAINT tb_notas_fiscais_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE SET NULL;


--
-- Name: tb_notificacoes tb_notificacoes_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notificacoes
    ADD CONSTRAINT tb_notificacoes_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE CASCADE;


--
-- Name: tb_notificacoes tb_notificacoes_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notificacoes
    ADD CONSTRAINT tb_notificacoes_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas_usuarios(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_notificacoes tb_notificacoes_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notificacoes
    ADD CONSTRAINT tb_notificacoes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_notificacoes tb_notificacoes_id_mensagem_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notificacoes
    ADD CONSTRAINT tb_notificacoes_id_mensagem_fkey FOREIGN KEY (id_mensagem) REFERENCES public.tb_mensagens_usuarios(id_mensagem) ON DELETE CASCADE;


--
-- Name: tb_notificacoes tb_notificacoes_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notificacoes
    ADD CONSTRAINT tb_notificacoes_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE CASCADE;


--
-- Name: tb_notificacoes tb_notificacoes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_notificacoes
    ADD CONSTRAINT tb_notificacoes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_onboarding_events tb_onboarding_events_id_progress_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_onboarding_events
    ADD CONSTRAINT tb_onboarding_events_id_progress_fkey FOREIGN KEY (id_progress) REFERENCES public.tb_user_onboarding_progress(id_progress) ON DELETE CASCADE;


--
-- Name: tb_onboarding_events tb_onboarding_events_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_onboarding_events
    ADD CONSTRAINT tb_onboarding_events_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_pacientes tb_pacientes_id_clinica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pacientes
    ADD CONSTRAINT tb_pacientes_id_clinica_fkey FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_pacientes tb_pacientes_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pacientes
    ADD CONSTRAINT tb_pacientes_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE SET NULL;


--
-- Name: tb_pacientes tb_pacientes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pacientes
    ADD CONSTRAINT tb_pacientes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_participantes_conversa tb_participantes_conversa_id_conversa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_participantes_conversa
    ADD CONSTRAINT tb_participantes_conversa_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.tb_conversas_usuarios(id_conversa) ON DELETE CASCADE;


--
-- Name: tb_participantes_conversa tb_participantes_conversa_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_participantes_conversa
    ADD CONSTRAINT tb_participantes_conversa_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_partner_lead_services tb_partner_lead_services_id_partner_lead_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_lead_services
    ADD CONSTRAINT tb_partner_lead_services_id_partner_lead_fkey FOREIGN KEY (id_partner_lead) REFERENCES public.tb_partner_leads(id_partner_lead) ON DELETE CASCADE;


--
-- Name: tb_partner_lead_services tb_partner_lead_services_id_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_lead_services
    ADD CONSTRAINT tb_partner_lead_services_id_service_fkey FOREIGN KEY (id_service) REFERENCES public.tb_partner_service_definitions(id_service) ON DELETE RESTRICT;


--
-- Name: tb_partner_licenses tb_partner_licenses_id_partner_package_item_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_licenses
    ADD CONSTRAINT tb_partner_licenses_id_partner_package_item_fkey FOREIGN KEY (id_partner_package_item) REFERENCES public.tb_partner_package_items(id_partner_package_item) ON DELETE CASCADE;


--
-- Name: tb_partner_package_history tb_partner_package_history_id_partner_package_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_history
    ADD CONSTRAINT tb_partner_package_history_id_partner_package_fkey FOREIGN KEY (id_partner_package) REFERENCES public.tb_partner_packages(id_partner_package) ON DELETE CASCADE;


--
-- Name: tb_partner_package_history tb_partner_package_history_id_service_new_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_history
    ADD CONSTRAINT tb_partner_package_history_id_service_new_fkey FOREIGN KEY (id_service_new) REFERENCES public.tb_partner_service_definitions(id_service) ON DELETE RESTRICT;


--
-- Name: tb_partner_package_history tb_partner_package_history_id_service_old_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_history
    ADD CONSTRAINT tb_partner_package_history_id_service_old_fkey FOREIGN KEY (id_service_old) REFERENCES public.tb_partner_service_definitions(id_service) ON DELETE SET NULL;


--
-- Name: tb_partner_package_history tb_partner_package_history_id_user_action_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_history
    ADD CONSTRAINT tb_partner_package_history_id_user_action_fkey FOREIGN KEY (id_user_action) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_partner_package_items tb_partner_package_items_id_partner_package_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_items
    ADD CONSTRAINT tb_partner_package_items_id_partner_package_fkey FOREIGN KEY (id_partner_package) REFERENCES public.tb_partner_packages(id_partner_package) ON DELETE CASCADE;


--
-- Name: tb_partner_package_items tb_partner_package_items_id_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_package_items
    ADD CONSTRAINT tb_partner_package_items_id_service_fkey FOREIGN KEY (id_service) REFERENCES public.tb_partner_service_definitions(id_service) ON DELETE RESTRICT;


--
-- Name: tb_partner_packages tb_partner_packages_id_partner_lead_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partner_packages
    ADD CONSTRAINT tb_partner_packages_id_partner_lead_fkey FOREIGN KEY (id_partner_lead) REFERENCES public.tb_partner_leads(id_partner_lead) ON DELETE SET NULL;


--
-- Name: tb_payments tb_payments_id_invoice_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_payments
    ADD CONSTRAINT tb_payments_id_invoice_fkey FOREIGN KEY (id_invoice) REFERENCES public.tb_invoices(id_invoice) ON DELETE SET NULL;


--
-- Name: tb_payments tb_payments_id_subscription_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_payments
    ADD CONSTRAINT tb_payments_id_subscription_fkey FOREIGN KEY (id_subscription) REFERENCES public.tb_subscriptions(id_subscription) ON DELETE CASCADE;


--
-- Name: tb_payments tb_payments_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_payments
    ADD CONSTRAINT tb_payments_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_pedido_historico tb_pedido_historico_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedido_historico
    ADD CONSTRAINT tb_pedido_historico_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE CASCADE;


--
-- Name: tb_pedido_historico tb_pedido_historico_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedido_historico
    ADD CONSTRAINT tb_pedido_historico_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_pedidos tb_pedidos_id_cupom_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedidos
    ADD CONSTRAINT tb_pedidos_id_cupom_fkey FOREIGN KEY (id_cupom) REFERENCES public.tb_cupons(id_cupom) ON DELETE SET NULL;


--
-- Name: tb_pedidos tb_pedidos_id_fornecedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedidos
    ADD CONSTRAINT tb_pedidos_id_fornecedor_fkey FOREIGN KEY (id_fornecedor) REFERENCES public.tb_fornecedores(id_fornecedor) ON DELETE CASCADE;


--
-- Name: tb_pedidos tb_pedidos_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pedidos
    ADD CONSTRAINT tb_pedidos_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_perfis tb_perfis_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_perfis
    ADD CONSTRAINT tb_perfis_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_perfis tb_perfis_id_perfil_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_perfis
    ADD CONSTRAINT tb_perfis_id_perfil_pai_fkey FOREIGN KEY (id_perfil_pai) REFERENCES public.tb_perfis(id_perfil) ON DELETE CASCADE;


--
-- Name: tb_pesquisas tb_pesquisas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_pesquisas
    ADD CONSTRAINT tb_pesquisas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_preferencias_notificacao tb_preferencias_notificacao_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_preferencias_notificacao
    ADD CONSTRAINT tb_preferencias_notificacao_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_procedimentos tb_procedimentos_id_clinica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_procedimentos
    ADD CONSTRAINT tb_procedimentos_id_clinica_fkey FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_produto_variacoes tb_produto_variacoes_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produto_variacoes
    ADD CONSTRAINT tb_produto_variacoes_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE CASCADE;


--
-- Name: tb_produtos tb_produtos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produtos
    ADD CONSTRAINT tb_produtos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.tb_categorias_produtos(id_categoria) ON DELETE SET NULL;


--
-- Name: tb_produtos tb_produtos_id_fornecedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_produtos
    ADD CONSTRAINT tb_produtos_id_fornecedor_fkey FOREIGN KEY (id_fornecedor) REFERENCES public.tb_fornecedores(id_fornecedor) ON DELETE CASCADE;


--
-- Name: tb_profissionais tb_profissionais_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_profissionais
    ADD CONSTRAINT tb_profissionais_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_profissionais tb_profissionais_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_profissionais
    ADD CONSTRAINT tb_profissionais_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_prompt_biblioteca tb_prompt_biblioteca_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_prompt_biblioteca
    ADD CONSTRAINT tb_prompt_biblioteca_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_prontuarios tb_prontuarios_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_prontuarios
    ADD CONSTRAINT tb_prontuarios_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE CASCADE;


--
-- Name: tb_prontuarios tb_prontuarios_id_clinica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_prontuarios
    ADD CONSTRAINT tb_prontuarios_id_clinica_fkey FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_prontuarios tb_prontuarios_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_prontuarios
    ADD CONSTRAINT tb_prontuarios_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE CASCADE;


--
-- Name: tb_prontuarios tb_prontuarios_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_prontuarios
    ADD CONSTRAINT tb_prontuarios_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_qrcodes_avaliacao tb_qrcodes_avaliacao_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_qrcodes_avaliacao
    ADD CONSTRAINT tb_qrcodes_avaliacao_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE CASCADE;


--
-- Name: tb_qrcodes_avaliacao tb_qrcodes_avaliacao_id_clinica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_qrcodes_avaliacao
    ADD CONSTRAINT tb_qrcodes_avaliacao_id_clinica_fkey FOREIGN KEY (id_clinica) REFERENCES public.tb_clinicas(id_clinica) ON DELETE CASCADE;


--
-- Name: tb_qrcodes_avaliacao tb_qrcodes_avaliacao_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_qrcodes_avaliacao
    ADD CONSTRAINT tb_qrcodes_avaliacao_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.tb_pacientes(id_paciente) ON DELETE CASCADE;


--
-- Name: tb_qrcodes_avaliacao tb_qrcodes_avaliacao_id_procedimento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_qrcodes_avaliacao
    ADD CONSTRAINT tb_qrcodes_avaliacao_id_procedimento_fkey FOREIGN KEY (id_procedimento) REFERENCES public.tb_procedimentos(id_procedimento) ON DELETE SET NULL;


--
-- Name: tb_qrcodes_avaliacao tb_qrcodes_avaliacao_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_qrcodes_avaliacao
    ADD CONSTRAINT tb_qrcodes_avaliacao_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE SET NULL;


--
-- Name: tb_rastreamento_eventos tb_rastreamento_eventos_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_rastreamento_eventos
    ADD CONSTRAINT tb_rastreamento_eventos_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE CASCADE;


--
-- Name: tb_repasses tb_repasses_id_conta_bancaria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_repasses
    ADD CONSTRAINT tb_repasses_id_conta_bancaria_fkey FOREIGN KEY (id_conta_bancaria) REFERENCES public.tb_contas_bancarias(id_conta) ON DELETE SET NULL;


--
-- Name: tb_repasses tb_repasses_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_repasses
    ADD CONSTRAINT tb_repasses_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_repasses tb_repasses_id_fornecedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_repasses
    ADD CONSTRAINT tb_repasses_id_fornecedor_fkey FOREIGN KEY (id_fornecedor) REFERENCES public.tb_fornecedores(id_fornecedor) ON DELETE CASCADE;


--
-- Name: tb_repasses tb_repasses_id_profissional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_repasses
    ADD CONSTRAINT tb_repasses_id_profissional_fkey FOREIGN KEY (id_profissional) REFERENCES public.tb_profissionais(id_profissional) ON DELETE CASCADE;


--
-- Name: tb_reservas_estoque tb_reservas_estoque_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reservas_estoque
    ADD CONSTRAINT tb_reservas_estoque_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE CASCADE;


--
-- Name: tb_reservas_estoque tb_reservas_estoque_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reservas_estoque
    ADD CONSTRAINT tb_reservas_estoque_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_reservas_estoque tb_reservas_estoque_id_produto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reservas_estoque
    ADD CONSTRAINT tb_reservas_estoque_id_produto_fkey FOREIGN KEY (id_produto) REFERENCES public.tb_produtos(id_produto) ON DELETE RESTRICT;


--
-- Name: tb_respostas_pesquisas tb_respostas_pesquisas_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_pesquisas
    ADD CONSTRAINT tb_respostas_pesquisas_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_respostas_pesquisas tb_respostas_pesquisas_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_pesquisas
    ADD CONSTRAINT tb_respostas_pesquisas_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE SET NULL;


--
-- Name: tb_respostas_pesquisas tb_respostas_pesquisas_id_pesquisa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_pesquisas
    ADD CONSTRAINT tb_respostas_pesquisas_id_pesquisa_fkey FOREIGN KEY (id_pesquisa) REFERENCES public.tb_pesquisas(id_pesquisa) ON DELETE CASCADE;


--
-- Name: tb_respostas_pesquisas tb_respostas_pesquisas_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_pesquisas
    ADD CONSTRAINT tb_respostas_pesquisas_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_respostas_rapidas tb_respostas_rapidas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_rapidas
    ADD CONSTRAINT tb_respostas_rapidas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_respostas_rapidas tb_respostas_rapidas_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_respostas_rapidas
    ADD CONSTRAINT tb_respostas_rapidas_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_sessoes tb_sessoes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_sessoes
    ADD CONSTRAINT tb_sessoes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_subscriptions tb_subscriptions_id_plan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_subscriptions
    ADD CONSTRAINT tb_subscriptions_id_plan_fkey FOREIGN KEY (id_plan) REFERENCES public.tb_plans(id_plan) ON DELETE SET NULL;


--
-- Name: tb_subscriptions tb_subscriptions_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_subscriptions
    ADD CONSTRAINT tb_subscriptions_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_template_installations tb_template_installations_id_agente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_installations
    ADD CONSTRAINT tb_template_installations_id_agente_fkey FOREIGN KEY (id_agente) REFERENCES public.tb_agentes(id_agente) ON DELETE SET NULL;


--
-- Name: tb_template_installations tb_template_installations_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_installations
    ADD CONSTRAINT tb_template_installations_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_template_installations tb_template_installations_id_template_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_installations
    ADD CONSTRAINT tb_template_installations_id_template_fkey FOREIGN KEY (id_template) REFERENCES public.tb_templates(id_template) ON DELETE CASCADE;


--
-- Name: tb_template_installations tb_template_installations_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_installations
    ADD CONSTRAINT tb_template_installations_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_template_reviews tb_template_reviews_id_template_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_reviews
    ADD CONSTRAINT tb_template_reviews_id_template_fkey FOREIGN KEY (id_template) REFERENCES public.tb_templates(id_template) ON DELETE CASCADE;


--
-- Name: tb_template_reviews tb_template_reviews_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_template_reviews
    ADD CONSTRAINT tb_template_reviews_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_templates tb_templates_id_empresa_creator_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_templates
    ADD CONSTRAINT tb_templates_id_empresa_creator_fkey FOREIGN KEY (id_empresa_creator) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_templates tb_templates_id_user_creator_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_templates
    ADD CONSTRAINT tb_templates_id_user_creator_fkey FOREIGN KEY (id_user_creator) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_templates_mensagens tb_templates_mensagens_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_templates_mensagens
    ADD CONSTRAINT tb_templates_mensagens_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_templates_mensagens tb_templates_mensagens_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_templates_mensagens
    ADD CONSTRAINT tb_templates_mensagens_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_transacoes tb_transacoes_id_agendamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes
    ADD CONSTRAINT tb_transacoes_id_agendamento_fkey FOREIGN KEY (id_agendamento) REFERENCES public.tb_agendamentos(id_agendamento) ON DELETE SET NULL;


--
-- Name: tb_transacoes tb_transacoes_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes
    ADD CONSTRAINT tb_transacoes_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.tb_categorias_financeiras(id_categoria) ON DELETE SET NULL;


--
-- Name: tb_transacoes tb_transacoes_id_conta_bancaria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes
    ADD CONSTRAINT tb_transacoes_id_conta_bancaria_fkey FOREIGN KEY (id_conta_bancaria) REFERENCES public.tb_contas_bancarias(id_conta) ON DELETE SET NULL;


--
-- Name: tb_transacoes tb_transacoes_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes
    ADD CONSTRAINT tb_transacoes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_transacoes tb_transacoes_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes
    ADD CONSTRAINT tb_transacoes_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.tb_pedidos(id_pedido) ON DELETE SET NULL;


--
-- Name: tb_transacoes tb_transacoes_id_transacao_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_transacoes
    ADD CONSTRAINT tb_transacoes_id_transacao_pai_fkey FOREIGN KEY (id_transacao_pai) REFERENCES public.tb_transacoes(id_transacao) ON DELETE SET NULL;


--
-- Name: tb_usage_metrics tb_usage_metrics_id_subscription_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_usage_metrics
    ADD CONSTRAINT tb_usage_metrics_id_subscription_fkey FOREIGN KEY (id_subscription) REFERENCES public.tb_subscriptions(id_subscription) ON DELETE CASCADE;


--
-- Name: tb_usage_metrics tb_usage_metrics_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_usage_metrics
    ADD CONSTRAINT tb_usage_metrics_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_user_onboarding_progress tb_user_onboarding_progress_id_flow_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_user_onboarding_progress
    ADD CONSTRAINT tb_user_onboarding_progress_id_flow_fkey FOREIGN KEY (id_flow) REFERENCES public.tb_onboarding_flows(id_flow) ON DELETE CASCADE;


--
-- Name: tb_user_onboarding_progress tb_user_onboarding_progress_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_user_onboarding_progress
    ADD CONSTRAINT tb_user_onboarding_progress_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_users tb_users_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_users
    ADD CONSTRAINT tb_users_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE CASCADE;


--
-- Name: tb_users tb_users_id_perfil_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_users
    ADD CONSTRAINT tb_users_id_perfil_fkey FOREIGN KEY (id_perfil) REFERENCES public.tb_perfis(id_perfil);


--
-- Name: tb_users tb_users_id_usuario_criador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_users
    ADD CONSTRAINT tb_users_id_usuario_criador_fkey FOREIGN KEY (id_usuario_criador) REFERENCES public.tb_users(id_user) ON DELETE SET NULL;


--
-- Name: tb_vagas tb_vagas_id_criador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_vagas
    ADD CONSTRAINT tb_vagas_id_criador_fkey FOREIGN KEY (id_criador) REFERENCES public.tb_users(id_user);


--
-- Name: tb_vagas tb_vagas_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_vagas
    ADD CONSTRAINT tb_vagas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa);


--
-- Name: tb_webhook_deliveries tb_webhook_deliveries_id_webhook_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_webhook_deliveries
    ADD CONSTRAINT tb_webhook_deliveries_id_webhook_fkey FOREIGN KEY (id_webhook) REFERENCES public.tb_webhooks(id_webhook) ON DELETE CASCADE;


--
-- Name: tb_webhooks tb_webhooks_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_webhooks
    ADD CONSTRAINT tb_webhooks_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.tb_empresas(id_empresa) ON DELETE SET NULL;


--
-- Name: tb_webhooks tb_webhooks_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_webhooks
    ADD CONSTRAINT tb_webhooks_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_users(id_user) ON DELETE CASCADE;


--
-- Name: tb_agendamentos agendamentos_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agendamentos_isolation_policy ON public.tb_agendamentos USING ((id_clinica IN ( SELECT tb_clinicas.id_clinica
   FROM public.tb_clinicas
  WHERE (tb_clinicas.id_empresa = public.current_user_empresa_id()))));


--
-- Name: tb_avaliacoes avaliacoes_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacoes_isolation_policy ON public.tb_avaliacoes USING ((id_clinica IN ( SELECT tb_clinicas.id_clinica
   FROM public.tb_clinicas
  WHERE (tb_clinicas.id_empresa = public.current_user_empresa_id()))));


--
-- Name: tb_broadcast_campanhas broadcast_campanhas_empresa_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY broadcast_campanhas_empresa_isolation ON public.tb_broadcast_campanhas USING ((id_empresa = (current_setting('app.current_empresa_id'::text, true))::uuid));


--
-- Name: tb_broadcast_destinatarios broadcast_destinatarios_empresa_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY broadcast_destinatarios_empresa_isolation ON public.tb_broadcast_destinatarios USING ((id_campanha IN ( SELECT tb_broadcast_campanhas.id_campanha
   FROM public.tb_broadcast_campanhas
  WHERE (tb_broadcast_campanhas.id_empresa = (current_setting('app.current_empresa_id'::text, true))::uuid))));


--
-- Name: tb_broadcast_templates broadcast_templates_empresa_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY broadcast_templates_empresa_isolation ON public.tb_broadcast_templates USING ((id_empresa = (current_setting('app.current_empresa_id'::text, true))::uuid));


--
-- Name: tb_clinicas clinicas_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinicas_isolation_policy ON public.tb_clinicas USING ((id_empresa = public.current_user_empresa_id()));


--
-- Name: tb_configuracoes configuracoes_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY configuracoes_isolation_policy ON public.tb_configuracoes USING ((id_empresa = public.current_user_empresa_id()));


--
-- Name: tb_export_agendamentos export_agendamentos_empresa_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY export_agendamentos_empresa_isolation ON public.tb_export_agendamentos USING ((id_empresa = (current_setting('app.current_empresa_id'::text, true))::uuid));


--
-- Name: tb_export_jobs export_jobs_empresa_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY export_jobs_empresa_isolation ON public.tb_export_jobs USING ((id_empresa = (current_setting('app.current_empresa_id'::text, true))::uuid));


--
-- Name: tb_fornecedores fornecedores_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fornecedores_isolation_policy ON public.tb_fornecedores USING ((id_empresa = public.current_user_empresa_id()));


--
-- Name: tb_movimentacoes_estoque movimentacoes_estoque_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY movimentacoes_estoque_tenant_isolation ON public.tb_movimentacoes_estoque USING ((id_empresa = (current_setting('app.current_empresa_id'::text))::uuid));


--
-- Name: tb_notas_fiscais notas_fiscais_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notas_fiscais_tenant_isolation ON public.tb_notas_fiscais USING ((id_empresa = (current_setting('app.current_empresa_id'::text))::uuid));


--
-- Name: tb_notificacoes notificacoes_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notificacoes_isolation_policy ON public.tb_notificacoes USING ((id_empresa = public.current_user_empresa_id()));


--
-- Name: tb_pacientes pacientes_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pacientes_isolation_policy ON public.tb_pacientes USING ((id_clinica IN ( SELECT tb_clinicas.id_clinica
   FROM public.tb_clinicas
  WHERE (tb_clinicas.id_empresa = public.current_user_empresa_id()))));


--
-- Name: tb_procedimentos procedimentos_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY procedimentos_isolation_policy ON public.tb_procedimentos USING ((id_clinica IN ( SELECT tb_clinicas.id_clinica
   FROM public.tb_clinicas
  WHERE (tb_clinicas.id_empresa = public.current_user_empresa_id()))));


--
-- Name: tb_profissionais profissionais_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profissionais_isolation_policy ON public.tb_profissionais USING (((id_empresa IS NULL) OR (id_empresa = public.current_user_empresa_id())));


--
-- Name: tb_rastreamento_eventos rastreamento_eventos_user_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rastreamento_eventos_user_isolation ON public.tb_rastreamento_eventos USING ((id_pedido IN ( SELECT tb_pedidos.id_pedido
   FROM public.tb_pedidos
  WHERE (tb_pedidos.id_user = (current_setting('app.current_user_id'::text))::uuid))));


--
-- Name: tb_reservas_estoque reservas_estoque_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reservas_estoque_tenant_isolation ON public.tb_reservas_estoque USING ((id_empresa = (current_setting('app.current_empresa_id'::text))::uuid));


--
-- Name: tb_agendamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_agendamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_avaliacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_broadcast_campanhas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_broadcast_campanhas ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_broadcast_destinatarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_broadcast_destinatarios ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_broadcast_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_broadcast_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_clinicas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_configuracoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_configuracoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_export_agendamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_export_agendamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_export_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_export_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_fornecedores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_fornecedores ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_movimentacoes_estoque; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_notas_fiscais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_notas_fiscais ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_notificacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_notificacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_pacientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_pacientes ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_perfis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_perfis ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_procedimentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_procedimentos ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_rastreamento_eventos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_rastreamento_eventos ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_reservas_estoque; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_reservas_estoque ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_transacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_transacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tb_users ENABLE ROW LEVEL SECURITY;

--
-- Name: tb_transacoes transacoes_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transacoes_isolation_policy ON public.tb_transacoes USING ((id_empresa = public.current_user_empresa_id()));


--
-- Name: tb_users users_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_isolation_policy ON public.tb_users USING (((public.current_user_empresa_id() IS NULL) OR (id_empresa = public.current_user_empresa_id())));


--
-- PostgreSQL database dump complete
--

\unrestrict 4CPqkGVRISP0vrqDz0gRpbzEdwxgodcwpukEbTxrdpTywfJdjONWFRbuiQb3BdR

