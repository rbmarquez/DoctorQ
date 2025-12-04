--
-- PostgreSQL database dump
--

\restrict TR3vGjR4ZxqOJRBFlstJxNLj4fJsGcGiFxgJphtJqn71cdxEl72wOwvftzC9GWw

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

ALTER TABLE IF EXISTS ONLY public.tb_universidade_sessoes_mentoria DROP CONSTRAINT IF EXISTS tb_universidade_sessoes_mentoria_id_mentor_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_progresso_aulas DROP CONSTRAINT IF EXISTS tb_universidade_progresso_aulas_id_inscricao_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_progresso_aulas DROP CONSTRAINT IF EXISTS tb_universidade_progresso_aulas_id_aula_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_notas DROP CONSTRAINT IF EXISTS tb_universidade_notas_id_aula_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_modulos DROP CONSTRAINT IF EXISTS tb_universidade_modulos_id_curso_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_matriculas DROP CONSTRAINT IF EXISTS tb_universidade_matriculas_id_pagamento_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_matriculas DROP CONSTRAINT IF EXISTS tb_universidade_matriculas_id_curso_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_inscricoes DROP CONSTRAINT IF EXISTS tb_universidade_inscricoes_id_curso_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_inscricoes_eventos DROP CONSTRAINT IF EXISTS tb_universidade_inscricoes_eventos_id_evento_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_certificados DROP CONSTRAINT IF EXISTS tb_universidade_certificados_id_curso_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_badges_usuarios DROP CONSTRAINT IF EXISTS tb_universidade_badges_usuarios_id_badge_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_avaliacoes_cursos DROP CONSTRAINT IF EXISTS tb_universidade_avaliacoes_cursos_id_curso_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_aulas DROP CONSTRAINT IF EXISTS tb_universidade_aulas_id_modulo_fkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_assinaturas DROP CONSTRAINT IF EXISTS tb_universidade_assinaturas_id_pagamento_fkey;
DROP INDEX IF EXISTS public.idx_xp_usuario;
DROP INDEX IF EXISTS public.idx_transacoes_usuario;
DROP INDEX IF EXISTS public.idx_tokens_usuario;
DROP INDEX IF EXISTS public.idx_ranking_periodo;
DROP INDEX IF EXISTS public.idx_progresso_inscricao;
DROP INDEX IF EXISTS public.idx_progresso_aula;
DROP INDEX IF EXISTS public.idx_podcasts_episodio;
DROP INDEX IF EXISTS public.idx_podcasts_data;
DROP INDEX IF EXISTS public.idx_podcasts_categoria;
DROP INDEX IF EXISTS public.idx_podcasts_ativo;
DROP INDEX IF EXISTS public.idx_pagamentos_usuario;
DROP INDEX IF EXISTS public.idx_pagamentos_tipo_item;
DROP INDEX IF EXISTS public.idx_pagamentos_status;
DROP INDEX IF EXISTS public.idx_pagamentos_mp_payment_id;
DROP INDEX IF EXISTS public.idx_pagamentos_dt_criacao;
DROP INDEX IF EXISTS public.idx_notas_usuario;
DROP INDEX IF EXISTS public.idx_notas_timestamp;
DROP INDEX IF EXISTS public.idx_notas_criacao;
DROP INDEX IF EXISTS public.idx_notas_conteudo_busca;
DROP INDEX IF EXISTS public.idx_notas_aula;
DROP INDEX IF EXISTS public.idx_notas_ativo;
DROP INDEX IF EXISTS public.idx_modulos_curso;
DROP INDEX IF EXISTS public.idx_missoes_usuario;
DROP INDEX IF EXISTS public.idx_missoes_tipo;
DROP INDEX IF EXISTS public.idx_missoes_data_criacao;
DROP INDEX IF EXISTS public.idx_missoes_concluida;
DROP INDEX IF EXISTS public.idx_matriculas_usuario;
DROP INDEX IF EXISTS public.idx_matriculas_status;
DROP INDEX IF EXISTS public.idx_matriculas_progresso;
DROP INDEX IF EXISTS public.idx_matriculas_curso;
DROP INDEX IF EXISTS public.idx_inscricoes_usuario;
DROP INDEX IF EXISTS public.idx_inscricoes_status;
DROP INDEX IF EXISTS public.idx_inscricoes_eventos_usuario;
DROP INDEX IF EXISTS public.idx_inscricoes_curso;
DROP INDEX IF EXISTS public.idx_favoritos_usuario;
DROP INDEX IF EXISTS public.idx_favoritos_tipo;
DROP INDEX IF EXISTS public.idx_favoritos_referencia;
DROP INDEX IF EXISTS public.idx_favoritos_criacao;
DROP INDEX IF EXISTS public.idx_eventos_tipo;
DROP INDEX IF EXISTS public.idx_eventos_status;
DROP INDEX IF EXISTS public.idx_eventos_data;
DROP INDEX IF EXISTS public.idx_ebooks_categoria;
DROP INDEX IF EXISTS public.idx_ebooks_autor;
DROP INDEX IF EXISTS public.idx_ebooks_ativo;
DROP INDEX IF EXISTS public.idx_cursos_nivel;
DROP INDEX IF EXISTS public.idx_cursos_instrutor;
DROP INDEX IF EXISTS public.idx_cursos_categoria;
DROP INDEX IF EXISTS public.idx_cursos_ativo;
DROP INDEX IF EXISTS public.idx_certificados_usuario;
DROP INDEX IF EXISTS public.idx_certificados_curso;
DROP INDEX IF EXISTS public.idx_certificados_codigo;
DROP INDEX IF EXISTS public.idx_badges_usuario;
DROP INDEX IF EXISTS public.idx_badges_badge;
DROP INDEX IF EXISTS public.idx_aulas_video_status;
DROP INDEX IF EXISTS public.idx_aulas_video_provider;
DROP INDEX IF EXISTS public.idx_aulas_video_id;
DROP INDEX IF EXISTS public.idx_aulas_modulo;
DROP INDEX IF EXISTS public.idx_assinaturas_usuario;
DROP INDEX IF EXISTS public.idx_assinaturas_status;
DROP INDEX IF EXISTS public.idx_assinaturas_dt_fim;
DROP INDEX IF EXISTS public.idx_analytics_usuario;
DROP INDEX IF EXISTS public.idx_analytics_evento;
DROP INDEX IF EXISTS public.idx_analytics_data;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_matriculas DROP CONSTRAINT IF EXISTS uk_matricula_usuario_curso;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_xp DROP CONSTRAINT IF EXISTS tb_universidade_xp_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_xp DROP CONSTRAINT IF EXISTS tb_universidade_xp_id_usuario_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_transacoes_tokens DROP CONSTRAINT IF EXISTS tb_universidade_transacoes_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_tokens DROP CONSTRAINT IF EXISTS tb_universidade_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_tokens DROP CONSTRAINT IF EXISTS tb_universidade_tokens_id_usuario_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_sessoes_mentoria DROP CONSTRAINT IF EXISTS tb_universidade_sessoes_mentoria_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_salas_metaverso DROP CONSTRAINT IF EXISTS tb_universidade_salas_metaverso_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_ranking DROP CONSTRAINT IF EXISTS tb_universidade_ranking_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_ranking DROP CONSTRAINT IF EXISTS tb_universidade_ranking_periodo_id_usuario_dt_calculo_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_progresso_aulas DROP CONSTRAINT IF EXISTS tb_universidade_progresso_aulas_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_progresso_aulas DROP CONSTRAINT IF EXISTS tb_universidade_progresso_aulas_id_inscricao_id_aula_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_podcasts DROP CONSTRAINT IF EXISTS tb_universidade_podcasts_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_pagamentos DROP CONSTRAINT IF EXISTS tb_universidade_pagamentos_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_notas DROP CONSTRAINT IF EXISTS tb_universidade_notas_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_modulos DROP CONSTRAINT IF EXISTS tb_universidade_modulos_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_missoes DROP CONSTRAINT IF EXISTS tb_universidade_missoes_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_mentores DROP CONSTRAINT IF EXISTS tb_universidade_mentores_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_mentores DROP CONSTRAINT IF EXISTS tb_universidade_mentores_id_usuario_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_matriculas DROP CONSTRAINT IF EXISTS tb_universidade_matriculas_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_inscricoes DROP CONSTRAINT IF EXISTS tb_universidade_inscricoes_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_inscricoes DROP CONSTRAINT IF EXISTS tb_universidade_inscricoes_id_usuario_id_curso_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_inscricoes_eventos DROP CONSTRAINT IF EXISTS tb_universidade_inscricoes_eventos_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_inscricoes_eventos DROP CONSTRAINT IF EXISTS tb_universidade_inscricoes_eventos_id_usuario_id_evento_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_favoritos DROP CONSTRAINT IF EXISTS tb_universidade_favoritos_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_favoritos DROP CONSTRAINT IF EXISTS tb_universidade_favoritos_id_usuario_tx_tipo_id_referencia_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_eventos DROP CONSTRAINT IF EXISTS tb_universidade_eventos_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_ebooks DROP CONSTRAINT IF EXISTS tb_universidade_ebooks_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_cursos DROP CONSTRAINT IF EXISTS tb_universidade_cursos_slug_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_cursos DROP CONSTRAINT IF EXISTS tb_universidade_cursos_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_certificados DROP CONSTRAINT IF EXISTS tb_universidade_certificados_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_certificados DROP CONSTRAINT IF EXISTS tb_universidade_certificados_codigo_verificacao_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_badges_usuarios DROP CONSTRAINT IF EXISTS tb_universidade_badges_usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_badges_usuarios DROP CONSTRAINT IF EXISTS tb_universidade_badges_usuarios_id_usuario_id_badge_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_badges DROP CONSTRAINT IF EXISTS tb_universidade_badges_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_badges DROP CONSTRAINT IF EXISTS tb_universidade_badges_codigo_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_avatares DROP CONSTRAINT IF EXISTS tb_universidade_avatares_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_avatares DROP CONSTRAINT IF EXISTS tb_universidade_avatares_id_usuario_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_avaliacoes_cursos DROP CONSTRAINT IF EXISTS tb_universidade_avaliacoes_cursos_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_avaliacoes_cursos DROP CONSTRAINT IF EXISTS tb_universidade_avaliacoes_cursos_id_usuario_id_curso_key;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_aulas DROP CONSTRAINT IF EXISTS tb_universidade_aulas_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_assinaturas DROP CONSTRAINT IF EXISTS tb_universidade_assinaturas_pkey;
ALTER TABLE IF EXISTS ONLY public.tb_universidade_analytics DROP CONSTRAINT IF EXISTS tb_universidade_analytics_pkey;
DROP TABLE IF EXISTS public.tb_universidade_xp;
DROP TABLE IF EXISTS public.tb_universidade_transacoes_tokens;
DROP TABLE IF EXISTS public.tb_universidade_tokens;
DROP TABLE IF EXISTS public.tb_universidade_sessoes_mentoria;
DROP TABLE IF EXISTS public.tb_universidade_salas_metaverso;
DROP TABLE IF EXISTS public.tb_universidade_ranking;
DROP TABLE IF EXISTS public.tb_universidade_progresso_aulas;
DROP TABLE IF EXISTS public.tb_universidade_podcasts;
DROP TABLE IF EXISTS public.tb_universidade_pagamentos;
DROP TABLE IF EXISTS public.tb_universidade_notas;
DROP TABLE IF EXISTS public.tb_universidade_modulos;
DROP TABLE IF EXISTS public.tb_universidade_missoes;
DROP TABLE IF EXISTS public.tb_universidade_mentores;
DROP TABLE IF EXISTS public.tb_universidade_matriculas;
DROP TABLE IF EXISTS public.tb_universidade_inscricoes_eventos;
DROP TABLE IF EXISTS public.tb_universidade_inscricoes;
DROP TABLE IF EXISTS public.tb_universidade_favoritos;
DROP TABLE IF EXISTS public.tb_universidade_eventos;
DROP TABLE IF EXISTS public.tb_universidade_ebooks;
DROP TABLE IF EXISTS public.tb_universidade_cursos;
DROP TABLE IF EXISTS public.tb_universidade_certificados;
DROP TABLE IF EXISTS public.tb_universidade_badges_usuarios;
DROP TABLE IF EXISTS public.tb_universidade_badges;
DROP TABLE IF EXISTS public.tb_universidade_avatares;
DROP TABLE IF EXISTS public.tb_universidade_avaliacoes_cursos;
DROP TABLE IF EXISTS public.tb_universidade_aulas;
DROP TABLE IF EXISTS public.tb_universidade_assinaturas;
DROP TABLE IF EXISTS public.tb_universidade_analytics;
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS "uuid-ossp";
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tb_universidade_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid,
    evento character varying(100) NOT NULL,
    categoria character varying(50),
    metadados jsonb,
    dt_evento timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_universidade_assinaturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_assinaturas (
    id_assinatura uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_pagamento uuid,
    tipo_plano character varying(50) NOT NULL,
    vl_plano numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'pendente'::character varying NOT NULL,
    dt_inicio timestamp without time zone,
    dt_fim timestamp without time zone,
    dt_cancelamento timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now(),
    fg_renovacao_automatica boolean DEFAULT false,
    fg_ativo boolean DEFAULT true
);


--
-- Name: TABLE tb_universidade_assinaturas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_assinaturas IS 'Assinaturas de planos (Mensal, Trimestral, Anual)';


--
-- Name: COLUMN tb_universidade_assinaturas.tipo_plano; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_assinaturas.tipo_plano IS 'Tipo: mensal (R$47,90), trimestral (R$129,90), anual (R$479,90)';


--
-- Name: COLUMN tb_universidade_assinaturas.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_assinaturas.status IS 'Status: ativa, cancelada, expirada, pendente';


--
-- Name: tb_universidade_aulas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_aulas (
    id_aula uuid DEFAULT gen_random_uuid() NOT NULL,
    id_modulo uuid NOT NULL,
    ordem integer NOT NULL,
    titulo character varying(200) NOT NULL,
    tipo character varying(50),
    conteudo_url character varying(500),
    duracao_minutos integer DEFAULT 0,
    transcript text,
    embeddings public.vector(1536),
    recursos jsonb,
    fg_preview boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    video_provider character varying(50) DEFAULT 'hls'::character varying,
    video_id character varying(255),
    video_status character varying(50) DEFAULT 'pending'::character varying,
    video_processing_progress integer DEFAULT 0,
    video_metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT tb_universidade_aulas_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['video'::character varying, 'pdf'::character varying, 'quiz'::character varying, 'simulador_ar'::character varying, 'live'::character varying, 'texto'::character varying, 'infografico'::character varying])::text[]))),
    CONSTRAINT tb_universidade_aulas_video_processing_progress_check CHECK (((video_processing_progress >= 0) AND (video_processing_progress <= 100))),
    CONSTRAINT tb_universidade_aulas_video_provider_check CHECK (((video_provider)::text = ANY ((ARRAY['youtube'::character varying, 'vimeo'::character varying, 'bunny'::character varying, 'hls'::character varying, 'custom'::character varying])::text[]))),
    CONSTRAINT tb_universidade_aulas_video_status_check CHECK (((video_status)::text = ANY ((ARRAY['pending'::character varying, 'uploaded'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: COLUMN tb_universidade_aulas.video_provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_aulas.video_provider IS 'Provedor de vídeo: youtube, vimeo, bunny, hls (self-hosted), custom';


--
-- Name: COLUMN tb_universidade_aulas.video_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_aulas.video_id IS 'ID do vídeo no provedor (UUID para HLS)';


--
-- Name: COLUMN tb_universidade_aulas.video_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_aulas.video_status IS 'Status do processamento: pending, uploaded, processing, completed, failed';


--
-- Name: COLUMN tb_universidade_aulas.video_processing_progress; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_aulas.video_processing_progress IS 'Progresso de processamento (0-100%)';


--
-- Name: COLUMN tb_universidade_aulas.video_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_aulas.video_metadata IS 'Metadados do vídeo: duração, resoluções, thumbnail, etc.';


--
-- Name: tb_universidade_avaliacoes_cursos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_avaliacoes_cursos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_curso uuid NOT NULL,
    avaliacao integer NOT NULL,
    comentario text,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_avaliacoes_cursos_avaliacao_check CHECK (((avaliacao >= 1) AND (avaliacao <= 5)))
);


--
-- Name: tb_universidade_avatares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_avatares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    avatar_url character varying(500),
    customizacoes jsonb,
    tier character varying(50) DEFAULT 'basic'::character varying,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone,
    CONSTRAINT tb_universidade_avatares_tier_check CHECK (((tier)::text = ANY ((ARRAY['basic'::character varying, 'premium'::character varying, 'vip'::character varying])::text[])))
);


--
-- Name: tb_universidade_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_badges (
    id_badge uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    icone_url character varying(500),
    tipo character varying(50) DEFAULT 'progresso'::character varying,
    raridade character varying(50) DEFAULT 'comum'::character varying,
    xp_reward integer DEFAULT 0,
    fg_nft_habilitado boolean DEFAULT false,
    nft_contract_address character varying(100),
    condicoes jsonb,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_badges_raridade_check CHECK (((raridade)::text = ANY ((ARRAY['comum'::character varying, 'raro'::character varying, 'epico'::character varying, 'lendario'::character varying])::text[]))),
    CONSTRAINT tb_universidade_badges_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['progresso'::character varying, 'excelencia'::character varying, 'especializacao'::character varying, 'social'::character varying])::text[])))
);


--
-- Name: TABLE tb_universidade_badges; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_badges IS 'Badges/conquistas disponíveis';


--
-- Name: tb_universidade_badges_usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_badges_usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_badge uuid NOT NULL,
    dt_conquista timestamp without time zone DEFAULT now() NOT NULL,
    nft_token_id character varying(100),
    nft_tx_hash character varying(100),
    nft_blockchain_url character varying(500)
);


--
-- Name: tb_universidade_certificados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_certificados (
    id_certificado uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_verificacao character varying(50) NOT NULL,
    id_usuario uuid NOT NULL,
    id_curso uuid NOT NULL,
    tipo_certificacao character varying(50),
    dt_emissao timestamp without time zone DEFAULT now() NOT NULL,
    dt_validade timestamp without time zone,
    nota_final numeric(5,2) NOT NULL,
    carga_horaria integer NOT NULL,
    acreditacoes jsonb,
    pdf_url character varying(500),
    fg_nft_habilitado boolean DEFAULT false,
    nft_token_id character varying(100),
    nft_contract_address character varying(100),
    nft_tx_hash character varying(100),
    nft_blockchain_url character varying(500),
    qr_code_url character varying(500),
    CONSTRAINT tb_universidade_certificados_tipo_certificacao_check CHECK (((tipo_certificacao)::text = ANY ((ARRAY['bronze'::character varying, 'prata'::character varying, 'ouro'::character varying, 'diamante'::character varying])::text[])))
);


--
-- Name: TABLE tb_universidade_certificados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_certificados IS 'Certificados emitidos (blockchain-ready)';


--
-- Name: tb_universidade_cursos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_cursos (
    id_curso uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    descricao text,
    nivel character varying(50),
    categoria character varying(100),
    duracao_horas integer DEFAULT 0 NOT NULL,
    preco numeric(10,2) DEFAULT 0.00,
    preco_assinante numeric(10,2) DEFAULT 0.00,
    thumbnail_url character varying(500),
    video_intro_url character varying(500),
    instrutor_id uuid,
    instrutor_nome character varying(200),
    certificacao_tipo character varying(50),
    fg_ativo boolean DEFAULT true,
    total_inscricoes integer DEFAULT 0,
    avaliacao_media numeric(3,2) DEFAULT 0.00,
    total_avaliacoes integer DEFAULT 0,
    tags text[],
    prerequisitos uuid[],
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone,
    dt_publicacao timestamp without time zone,
    CONSTRAINT tb_universidade_cursos_certificacao_tipo_check CHECK (((certificacao_tipo)::text = ANY ((ARRAY['bronze'::character varying, 'prata'::character varying, 'ouro'::character varying, 'diamante'::character varying])::text[]))),
    CONSTRAINT tb_universidade_cursos_nivel_check CHECK (((nivel)::text = ANY ((ARRAY['iniciante'::character varying, 'intermediario'::character varying, 'avancado'::character varying, 'expert'::character varying])::text[])))
);


--
-- Name: TABLE tb_universidade_cursos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_cursos IS 'Catálogo de cursos da Universidade da Beleza';


--
-- Name: tb_universidade_ebooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_ebooks (
    id_ebook uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    autor character varying(200) NOT NULL,
    categoria character varying(50) NOT NULL,
    paginas integer DEFAULT 0 NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    avaliacao_media numeric(3,2) DEFAULT 0.00,
    total_avaliacoes integer DEFAULT 0,
    formato character varying(20) DEFAULT 'PDF'::character varying,
    tamanho_mb numeric(5,2),
    idioma character varying(50) DEFAULT 'Português'::character varying,
    thumbnail_url character varying(500),
    pdf_url character varying(500) NOT NULL,
    preview_url character varying(500),
    isbn character varying(20),
    tags text[],
    fg_gratuito boolean DEFAULT true,
    preco numeric(10,2) DEFAULT 0.00,
    dt_publicacao timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone,
    fg_ativo boolean DEFAULT true
);


--
-- Name: tb_universidade_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_eventos (
    id_evento uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    tipo character varying(50) NOT NULL,
    dt_inicio timestamp without time zone NOT NULL,
    dt_fim timestamp without time zone NOT NULL,
    duracao_horas integer NOT NULL,
    instrutor_id uuid,
    instrutor_nome character varying(200),
    preco numeric(10,2) DEFAULT 0.00,
    preco_assinante numeric(10,2) DEFAULT 0.00,
    max_participantes integer,
    total_inscritos integer DEFAULT 0,
    stream_url character varying(500),
    replay_url character varying(500),
    fg_chat_habilitado boolean DEFAULT true,
    fg_metaverso_habilitado boolean DEFAULT false,
    metaverso_room_id character varying(100),
    certificado_horas integer DEFAULT 0,
    thumbnail_url character varying(500),
    status character varying(50) DEFAULT 'agendado'::character varying,
    tags text[],
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_eventos_status_check CHECK (((status)::text = ANY ((ARRAY['agendado'::character varying, 'ao_vivo'::character varying, 'finalizado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT tb_universidade_eventos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['webinar'::character varying, 'workshop'::character varying, 'congresso'::character varying, 'imersao'::character varying, 'masterclass'::character varying])::text[])))
);


--
-- Name: TABLE tb_universidade_eventos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_eventos IS 'Lives, webinars e eventos';


--
-- Name: tb_universidade_favoritos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_favoritos (
    id_favorito uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    tx_tipo character varying(20) NOT NULL,
    id_referencia uuid NOT NULL,
    tx_observacao text,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_favoritos_tx_tipo_check CHECK (((tx_tipo)::text = ANY ((ARRAY['curso'::character varying, 'aula'::character varying, 'instrutor'::character varying])::text[])))
);


--
-- Name: TABLE tb_universidade_favoritos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_favoritos IS 'Itens favoritos dos usuários (cursos, aulas, instrutores)';


--
-- Name: COLUMN tb_universidade_favoritos.tx_tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_favoritos.tx_tipo IS 'Tipo do favorito: curso, aula ou instrutor';


--
-- Name: COLUMN tb_universidade_favoritos.id_referencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_favoritos.id_referencia IS 'ID do item favoritado';


--
-- Name: tb_universidade_inscricoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_inscricoes (
    id_inscricao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_curso uuid NOT NULL,
    dt_inscricao timestamp without time zone DEFAULT now() NOT NULL,
    dt_conclusao timestamp without time zone,
    progresso_percentual integer DEFAULT 0,
    status character varying(50) DEFAULT 'em_andamento'::character varying,
    nota_final numeric(5,2),
    tempo_total_estudo_minutos integer DEFAULT 0,
    ultima_aula_assistida uuid,
    dt_ultima_atividade timestamp without time zone,
    CONSTRAINT tb_universidade_inscricoes_progresso_percentual_check CHECK (((progresso_percentual >= 0) AND (progresso_percentual <= 100))),
    CONSTRAINT tb_universidade_inscricoes_status_check CHECK (((status)::text = ANY ((ARRAY['em_andamento'::character varying, 'concluido'::character varying, 'cancelado'::character varying, 'expirado'::character varying])::text[])))
);


--
-- Name: TABLE tb_universidade_inscricoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_inscricoes IS 'Inscrições de usuários em cursos';


--
-- Name: tb_universidade_inscricoes_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_inscricoes_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_evento uuid NOT NULL,
    dt_inscricao timestamp without time zone DEFAULT now() NOT NULL,
    preco_pago numeric(10,2) NOT NULL,
    fg_compareceu boolean DEFAULT false,
    tempo_assistido_minutos integer DEFAULT 0,
    fg_certificado_emitido boolean DEFAULT false,
    avaliacao integer,
    comentario text,
    CONSTRAINT tb_universidade_inscricoes_eventos_avaliacao_check CHECK (((avaliacao >= 1) AND (avaliacao <= 5)))
);


--
-- Name: tb_universidade_matriculas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_matriculas (
    id_matricula uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_curso uuid NOT NULL,
    id_pagamento uuid,
    progresso integer DEFAULT 0,
    dt_conclusao timestamp without time zone,
    status character varying(50) DEFAULT 'ativa'::character varying NOT NULL,
    dt_primeiro_acesso timestamp without time zone,
    dt_ultimo_acesso timestamp without time zone,
    fg_certificado_emitido boolean DEFAULT false,
    dt_certificado timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now(),
    fg_ativo boolean DEFAULT true
);


--
-- Name: TABLE tb_universidade_matriculas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_matriculas IS 'Matrículas em cursos individuais';


--
-- Name: COLUMN tb_universidade_matriculas.progresso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_matriculas.progresso IS 'Progresso do curso em % (0-100)';


--
-- Name: COLUMN tb_universidade_matriculas.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_matriculas.status IS 'Status: ativa, concluida, cancelada';


--
-- Name: tb_universidade_mentores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_mentores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    especialidades text[],
    preco_sessao_tokens integer DEFAULT 200 NOT NULL,
    disponibilidade jsonb,
    total_mentorias integer DEFAULT 0,
    avaliacao_media numeric(3,2) DEFAULT 0.00,
    total_avaliacoes integer DEFAULT 0,
    biografia text,
    certificacoes text[],
    fg_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_universidade_missoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_missoes (
    id_user_missao uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    tipo_missao character varying(50) NOT NULL,
    titulo character varying(100) NOT NULL,
    descricao character varying(255),
    icone character varying(10) DEFAULT '🎯'::character varying,
    meta integer NOT NULL,
    progresso_atual integer DEFAULT 0,
    xp_recompensa integer DEFAULT 0,
    tokens_recompensa integer DEFAULT 0,
    fg_concluida boolean DEFAULT false,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_conclusao timestamp without time zone,
    dt_expiracao timestamp without time zone NOT NULL
);


--
-- Name: TABLE tb_universidade_missoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_missoes IS 'Missões diárias dos usuários';


--
-- Name: COLUMN tb_universidade_missoes.tipo_missao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_missoes.tipo_missao IS 'Tipo: assistir_aulas, tempo_estudo, completar_modulo, etc';


--
-- Name: COLUMN tb_universidade_missoes.meta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_missoes.meta IS 'Valor alvo para completar a missão';


--
-- Name: COLUMN tb_universidade_missoes.progresso_atual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_missoes.progresso_atual IS 'Progresso atual em direção à meta';


--
-- Name: tb_universidade_modulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_modulos (
    id_modulo uuid DEFAULT gen_random_uuid() NOT NULL,
    id_curso uuid NOT NULL,
    ordem integer NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    duracao_minutos integer DEFAULT 0,
    fg_obrigatorio boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tb_universidade_notas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_notas (
    id_nota uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    id_aula uuid NOT NULL,
    tx_conteudo text NOT NULL,
    nr_timestamp_video integer,
    fg_publica boolean DEFAULT false,
    fg_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone
);


--
-- Name: TABLE tb_universidade_notas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_notas IS 'Notas dos usuários em aulas';


--
-- Name: COLUMN tb_universidade_notas.nr_timestamp_video; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_notas.nr_timestamp_video IS 'Segundo do vídeo onde a nota foi criada';


--
-- Name: COLUMN tb_universidade_notas.fg_publica; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_notas.fg_publica IS 'Se a nota pode ser vista por outros usuários';


--
-- Name: tb_universidade_pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_pagamentos (
    id_pagamento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    tipo_item character varying(50) NOT NULL,
    id_item uuid,
    mp_payment_id character varying(255),
    mp_preference_id character varying(255),
    tipo_pagamento character varying(50) NOT NULL,
    metodo_pagamento character varying(50),
    vl_total numeric(10,2) NOT NULL,
    vl_taxa numeric(10,2) DEFAULT 0.00,
    vl_liquido numeric(10,2),
    moeda character varying(3) DEFAULT 'BRL'::character varying,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    status_detalhe text,
    email_pagador character varying(255),
    nome_pagador character varying(255),
    cpf_pagador character varying(14),
    descricao text,
    qr_code text,
    qr_code_base64 text,
    ticket_url text,
    parcelas integer DEFAULT 1,
    ds_metadata jsonb,
    dt_aprovacao timestamp without time zone,
    dt_expiracao timestamp without time zone,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone DEFAULT now(),
    fg_ativo boolean DEFAULT true
);


--
-- Name: TABLE tb_universidade_pagamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_pagamentos IS 'Pagamentos via MercadoPago (PIX, cartão)';


--
-- Name: COLUMN tb_universidade_pagamentos.tipo_item; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_pagamentos.tipo_item IS 'Tipo do item pago: assinatura, curso, ebook';


--
-- Name: COLUMN tb_universidade_pagamentos.mp_payment_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_pagamentos.mp_payment_id IS 'ID do pagamento no MercadoPago';


--
-- Name: COLUMN tb_universidade_pagamentos.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tb_universidade_pagamentos.status IS 'Status: pending, approved, rejected, cancelled, refunded';


--
-- Name: tb_universidade_podcasts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_podcasts (
    id_podcast uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    categoria character varying(50) NOT NULL,
    episodio integer NOT NULL,
    duracao_minutos integer NOT NULL,
    dt_publicacao timestamp without time zone NOT NULL,
    autor character varying(200) NOT NULL,
    thumbnail_url character varying(500),
    audio_url character varying(500) NOT NULL,
    plays integer DEFAULT 0,
    tags text[],
    transcricao text,
    fg_ativo boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    dt_atualizacao timestamp without time zone
);


--
-- Name: tb_universidade_progresso_aulas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_progresso_aulas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_inscricao uuid NOT NULL,
    id_aula uuid NOT NULL,
    fg_assistido boolean DEFAULT false,
    tempo_assistido_segundos integer DEFAULT 0,
    ultima_posicao_segundos integer DEFAULT 0,
    progresso_percentual integer DEFAULT 0,
    dt_inicio timestamp without time zone,
    dt_conclusao timestamp without time zone
);


--
-- Name: tb_universidade_ranking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_ranking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    periodo character varying(20),
    id_usuario uuid NOT NULL,
    posicao integer NOT NULL,
    pontuacao integer NOT NULL,
    dt_calculo timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_ranking_periodo_check CHECK (((periodo)::text = ANY ((ARRAY['diario'::character varying, 'semanal'::character varying, 'mensal'::character varying, 'anual'::character varying, 'geral'::character varying])::text[])))
);


--
-- Name: tb_universidade_salas_metaverso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_salas_metaverso (
    id_sala uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(200) NOT NULL,
    tipo character varying(50) NOT NULL,
    max_usuarios integer DEFAULT 50,
    usuarios_online integer DEFAULT 0,
    colyseus_room_id character varying(100),
    fg_ativa boolean DEFAULT true,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_salas_metaverso_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['auditorio'::character varying, 'laboratorio'::character varying, 'lounge'::character varying, 'biblioteca'::character varying])::text[])))
);


--
-- Name: tb_universidade_sessoes_mentoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_sessoes_mentoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_mentor uuid NOT NULL,
    id_mentorado uuid NOT NULL,
    dt_hora timestamp without time zone NOT NULL,
    duracao_minutos integer DEFAULT 30,
    status character varying(50) DEFAULT 'agendada'::character varying,
    room_url character varying(500),
    notas_mentor text,
    avaliacao_mentorado integer,
    comentario_mentorado text,
    tokens_pagos integer NOT NULL,
    dt_criacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_sessoes_mentoria_avaliacao_mentorado_check CHECK (((avaliacao_mentorado >= 1) AND (avaliacao_mentorado <= 5))),
    CONSTRAINT tb_universidade_sessoes_mentoria_status_check CHECK (((status)::text = ANY ((ARRAY['agendada'::character varying, 'realizada'::character varying, 'cancelada'::character varying, 'falta'::character varying])::text[])))
);


--
-- Name: tb_universidade_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    saldo_tokens integer DEFAULT 0,
    total_ganho integer DEFAULT 0,
    total_gasto integer DEFAULT 0,
    dt_atualizacao timestamp without time zone DEFAULT now(),
    CONSTRAINT tb_universidade_tokens_saldo_tokens_check CHECK ((saldo_tokens >= 0))
);


--
-- Name: tb_universidade_transacoes_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_transacoes_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    quantidade integer NOT NULL,
    motivo character varying(200),
    referencia_id uuid,
    metadados jsonb,
    dt_transacao timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tb_universidade_transacoes_tokens_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ganho'::character varying, 'gasto'::character varying, 'transfer'::character varying, 'staking'::character varying, 'bonus'::character varying])::text[])))
);


--
-- Name: tb_universidade_xp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_universidade_xp (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    total_xp integer DEFAULT 0,
    nivel integer DEFAULT 1,
    xp_proximo_nivel integer DEFAULT 100,
    dt_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tb_universidade_xp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tb_universidade_xp IS 'Sistema de experiência e níveis dos usuários';


--
-- Data for Name: tb_universidade_analytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_analytics (id, id_usuario, evento, categoria, metadados, dt_evento) FROM stdin;
\.


--
-- Data for Name: tb_universidade_assinaturas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_assinaturas (id_assinatura, id_usuario, id_pagamento, tipo_plano, vl_plano, status, dt_inicio, dt_fim, dt_cancelamento, dt_criacao, dt_atualizacao, fg_renovacao_automatica, fg_ativo) FROM stdin;
\.


--
-- Data for Name: tb_universidade_aulas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_aulas (id_aula, id_modulo, ordem, titulo, tipo, conteudo_url, duracao_minutos, transcript, embeddings, recursos, fg_preview, dt_criacao, video_provider, video_id, video_status, video_processing_progress, video_metadata) FROM stdin;
0ef876bd-fd4d-47a6-8bf9-881ce41cfc70	5766d58c-b608-401e-bce4-bdbf8abbe484	1	Introdução à Toxina Botulínica	video	https://vimeo.com/76979871	30	\N	\N	{"video": {"provider": "vimeo", "video_id": "76979871", "embed_url": "https://player.vimeo.com/video/76979871"}, "referencias": ["Carruthers JD, Carruthers A. History of the clinical use of botulinum toxin A. J Cosmet Laser Ther. 2014", "Klein AW. The therapeutic potential of botulinum toxin. Dermatol Surg. 2004"], "materiais_complementares": [{"url": "https://www.sbcd.org.br/wp-content/uploads/2019/05/toxina-botulinica-guia-pratico.pdf", "tipo": "pdf", "titulo": "Guia de Introdução à Toxina Botulínica"}, {"url": "https://www.sbcd.org.br/wp-content/uploads/2020/01/anatomia-facial-aplicada.pdf", "tipo": "pdf", "titulo": "Anatomia Facial para Procedimentos"}]}	t	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
89d5be34-44ad-4f11-a558-25f43ae02a40	5766d58c-b608-401e-bce4-bdbf8abbe484	4	Quiz: Fundamentos	quiz	\N	15	\N	\N	{"quiz_config": {"nota_aprovacao": 7.0, "total_questoes": 10, "tempo_limite_minutos": 15}}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
5f821b1d-2336-4d0d-96a7-0490b6c699bc	a3974870-d7cb-4067-9b04-70050f190ffb	4	Simulador AR: Prática Glabela	simulador_ar	\N	60	\N	\N	{"simulador_config": {"tipo": "realidade_aumentada", "instrucoes": "Use seu smartphone para praticar aplicação virtual em modelo 3D", "plataforma": "WebAR", "url_launcher": "https://ar.doctorq.app/simulador/glabela"}}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
ecd979e1-9d7c-4863-9a5b-76b0941d40c1	a3974870-d7cb-4067-9b04-70050f190ffb	5	Quiz: Técnicas	quiz	\N	20	\N	\N	{"quiz_config": {"nota_aprovacao": 8.0, "total_questoes": 15, "tempo_limite_minutos": 20}}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
41c59eee-4885-436e-915b-c90127b69e4b	b10146ce-ad54-4075-b2aa-bd74f4c5c9a0	5	Prova Final	quiz	\N	40	\N	\N	{"observacao": "Prova final para certificação. Requer 85% de acerto.", "quiz_config": {"certificacao": true, "nota_aprovacao": 8.5, "total_questoes": 30, "tempo_limite_minutos": 45, "tentativas_permitidas": 2}}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
d6b2d21c-97e4-4380-98c0-d8f1315ff617	5766d58c-b608-401e-bce4-bdbf8abbe484	2	Mecanismo de Ação	video	https://vimeo.com/148751763	45	\N	\N	{"materiais_complementares": [{"url": "https://www.sbcp.org.br/pdfs/mecanismo-acao-toxina.pdf", "tipo": "pdf", "titulo": "Mecanismo de Ação da Toxina Tipo A"}, {"url": "https://cdn.aesthetic.guide/infographics/toxin-mechanism.png", "tipo": "infografico", "titulo": "Infográfico: Como a Toxina Age"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
f629deee-77a8-4344-aaf2-ff0973cb213c	5766d58c-b608-401e-bce4-bdbf8abbe484	3	Anatomia Facial Aplicada	video	https://vimeo.com/148618960	60	\N	\N	{"imagens_3d": "https://anatomy3d.app/facial-muscles", "materiais_complementares": [{"url": "https://www.anatomy.guide/facial-muscles-atlas.pdf", "tipo": "pdf", "titulo": "Atlas de Anatomia Facial"}, {"url": "https://www.sbcd.org.br/wp-content/uploads/2021/pontos-seguros.pdf", "tipo": "pdf", "titulo": "Pontos de Segurança para Aplicação"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
9f9e7ade-130d-47e9-9db3-b3ddc522747f	a3974870-d7cb-4067-9b04-70050f190ffb	1	Aplicação na Glabela	video	https://vimeo.com/76979871	40	\N	\N	{"pontos_aplicacao": ["Procerus", "Corrugador superciliar", "Depressor superciliar"], "materiais_complementares": [{"url": "https://www.sbcd.org.br/protocolos/glabela-protocol.pdf", "tipo": "pdf", "titulo": "Protocolo de Aplicação na Glabela"}, {"url": "https://vimeo.com/demo/glabela-technique", "tipo": "video", "titulo": "Demonstração Prática Glabela"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
24a38228-edb4-47c4-b69f-c98f79cb16d0	a3974870-d7cb-4067-9b04-70050f190ffb	2	Aplicação na Testa	video	https://vimeo.com/148751763	35	\N	\N	{"avisos": ["Evitar ptose palpebral", "Respeitar distância de 2cm da sobrancelha", "Dosagem individualizada"], "materiais_complementares": [{"url": "https://www.aesthetic.guide/forehead-botox.pdf", "tipo": "pdf", "titulo": "Técnica de Aplicação Frontal"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
a2a17109-de3b-4264-bc88-45c7c29d87b6	a3974870-d7cb-4067-9b04-70050f190ffb	3	Aplicação Periorbital	video	https://vimeo.com/148618960	45	\N	\N	{"precaucoes": ["Zona de segurança periorbital", "Cuidado com orbicular dos olhos", "Evitar áreas lacrimais"], "materiais_complementares": [{"url": "https://www.sbcd.org.br/periorbital-safe.pdf", "tipo": "pdf", "titulo": "Aplicação Periorbital Segura"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
d0488f4f-5b94-4ec5-901b-700253a1ab9b	b10146ce-ad54-4075-b2aa-bd74f4c5c9a0	1	Correção de Assimetrias	video	https://vimeo.com/76979871	50	\N	\N	{"materiais_complementares": [{"url": "https://www.facial-asymmetry.guide/corrections.pdf", "tipo": "pdf", "titulo": "Correção de Assimetrias Faciais"}, {"url": "https://www.sbcd.org.br/clinical-cases-asymmetry.pdf", "tipo": "pdf", "titulo": "Casos Clínicos de Correção"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
875501ec-75d8-46c6-9cd4-cdf4eb8bddc8	b10146ce-ad54-4075-b2aa-bd74f4c5c9a0	2	Técnicas Avançadas: Baby Botox	video	https://vimeo.com/148751763	40	\N	\N	{"diferenciais": ["Doses menores (micro-doses)", "Resultado mais natural", "Movimento facial preservado"], "materiais_complementares": [{"url": "https://www.aesthetic.guide/baby-botox-guide.pdf", "tipo": "pdf", "titulo": "Baby Botox: Técnica e Indicações"}, {"url": "https://www.botox-comparison.org/baby-vs-traditional.pdf", "tipo": "pdf", "titulo": "Comparativo: Botox Tradicional vs Baby Botox"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
38c0dc19-7ece-4a86-a76b-10ee5679c4af	b10146ce-ad54-4075-b2aa-bd74f4c5c9a0	3	Manejo de Complicações	video	https://vimeo.com/148618960	60	\N	\N	{"complicacoes": ["Ptose palpebral", "Assimetria temporária", "Hematomas", "Reações alérgicas", "Cefaleia"], "contatos_emergencia": {"sbcd": "0800-xxx-xxxx", "suporte_24h": "suporte@doctorq.app"}, "materiais_complementares": [{"url": "https://www.sbcd.org.br/complication-management.pdf", "tipo": "pdf", "titulo": "Protocolo de Manejo de Complicações"}, {"url": "https://www.emergency-aesthetics.org/protocol.pdf", "tipo": "pdf", "titulo": "Emergências em Procedimentos Estéticos"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
782fe808-40ff-491f-9f7f-c15bf7a2b0ea	b10146ce-ad54-4075-b2aa-bd74f4c5c9a0	4	Casos Clínicos Complexos	video	https://vimeo.com/169599296	70	\N	\N	{"casos_estudados": ["Paciente com hipertrofia masseter bilateral", "Correção de sorriso gengival", "Lifting não-cirúrgico com toxina", "Tratamento de bruxismo estético"], "materiais_complementares": [{"url": "https://www.clinical-cases.org/complex-vol1.pdf", "tipo": "pdf", "titulo": "Casos Clínicos Complexos - Volume 1"}, {"url": "https://www.photo-analysis.guide/before-after.pdf", "tipo": "pdf", "titulo": "Análise de Resultados e Fotografias"}]}	f	2025-11-13 17:26:58.341339	hls	\N	pending	0	{}
\.


--
-- Data for Name: tb_universidade_avaliacoes_cursos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_avaliacoes_cursos (id, id_usuario, id_curso, avaliacao, comentario, dt_criacao) FROM stdin;
ad8d3326-f17a-4624-a2a5-8f6e730d1693	a1b2c3d4-e5f6-4890-a234-567890abcdef	ecb484dc-22e3-4981-bb46-9b2fa7cdfa3a	5	Curso excepcional! O instrutor domina o assunto e as técnicas são muito bem explicadas.	2025-10-05 17:39:22.243756
b7c9f827-99ed-4b47-a9b9-dc69fbbb080c	a1b2c3d4-e5f6-4890-a234-567890abcdef	7e41888d-e899-4c58-a1e3-befedbde27b7	5	Estou adorando o curso! A parte de anatomia é excelente.	2025-11-11 17:39:22.250582
ce6350f6-ca80-464c-a0b4-5ce28de8f6d2	b2c3d4e5-f6a7-4901-a345-678901bcdef0	f5dd74ff-ddf1-44b7-ba2e-5a6b4697edb0	4	Curso muito bom para quem está começando com marketing digital.	2025-11-12 17:39:22.253178
295d0b7f-5e93-4651-b1a9-1d1813726546	c3d4e5f6-a7b8-4012-a456-789012cdef01	80fc05c2-095d-44c3-b844-d4c9de5247d6	5	Aulas muito didáticas! A Dra. Maria explica de forma clara e segura.	2025-11-13 17:39:22.255592
2c262726-0d20-4c9e-9331-4dfa5e1e30ea	d4e5f6a7-b8c9-4123-a567-890123def012	79f89eef-58bb-4fa9-afd1-9b669df9cbea	5	Curso completo e atualizado. Já comprei o aparelho e estou tendo ótimos resultados!	2025-10-20 17:39:22.258022
db4e9ad8-de61-4bbc-91a7-adbb73cdf808	69d2879c-827f-4970-a70a-356843d8b9e8	7e41888d-e899-4c58-a1e3-befedbde27b7	5	Excelente curso! Superou minhas expectativas.	2025-09-15 17:39:22.260558
95c70c55-5939-476c-adc3-494c0d38ec8a	b0a77322-1c48-4732-8902-2b548bd65b32	7e41888d-e899-4c58-a1e3-befedbde27b7	4	Muito bom, só poderia ter mais vídeos práticos.	2025-09-20 17:39:22.263048
911b6bd7-68fb-4597-a4f3-0752cf9ac0e0	a56e22b8-26f2-4af9-8f9d-f49ccebc5847	ecb484dc-22e3-4981-bb46-9b2fa7cdfa3a	5	Maravilhoso! Aprendi técnicas que não conhecia.	2025-09-25 17:39:22.26551
\.


--
-- Data for Name: tb_universidade_avatares; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_avatares (id, id_usuario, avatar_url, customizacoes, tier, dt_criacao, dt_atualizacao) FROM stdin;
\.


--
-- Data for Name: tb_universidade_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_badges (id_badge, codigo, nome, descricao, icone_url, tipo, raridade, xp_reward, fg_nft_habilitado, nft_contract_address, condicoes, dt_criacao) FROM stdin;
e0530e75-d60e-4919-8e89-0fe19eb4dfeb	primeira_aula	Primeira Aula	Assistiu sua primeira aula	/badges/primeira_aula.svg	progresso	comum	10	f	\N	{"tipo": "aula_completa", "quantidade": 1}	2025-11-13 17:23:54.342431
6688bb55-8ba5-4657-b933-d468639c9ef9	streak_7	Streak 7 Dias	Estudou 7 dias seguidos	/badges/streak_7.svg	excelencia	raro	100	f	\N	{"tipo": "streak_dias", "quantidade": 7}	2025-11-13 17:23:54.342431
3020d6a3-0381-4866-98d7-509677d47d3f	streak_30	Streak 30 Dias	Estudou 30 dias seguidos	/badges/streak_30.svg	excelencia	epico	500	f	\N	{"tipo": "streak_dias", "quantidade": 30}	2025-11-13 17:23:54.342431
68f93810-af02-468f-99f0-5694656f5d28	primeiro_curso	Graduado	Completou seu primeiro curso	/badges/primeiro_curso.svg	progresso	comum	100	f	\N	{"tipo": "curso_completo", "quantidade": 1}	2025-11-13 17:23:54.342431
eb182b6d-0080-4a5b-93a6-44d2c634d50a	nota_maxima	Nota Máxima	Tirou 100% em um quiz	/badges/nota_maxima.svg	excelencia	raro	50	f	\N	{"tipo": "quiz_perfeito", "quantidade": 1}	2025-11-13 17:23:54.342431
56dd86cf-151c-4e95-bd3f-be8059ad3e27	injetaveis_expert	Injetáveis Expert	Completou todos os cursos de injetáveis	/badges/injetaveis.svg	especializacao	lendario	1000	f	\N	{"tipo": "categoria_completa", "categoria": "injetaveis"}	2025-11-13 17:23:54.342431
db49435b-fa6d-44f6-8658-e8c3732ebf85	mentor	Mentor	Ajudou 50+ alunos	/badges/mentor.svg	social	epico	500	f	\N	{"tipo": "mentorias", "quantidade": 50}	2025-11-13 17:23:54.342431
70efb223-81e4-46a2-a9eb-74dbfa3e62d8	top_1_porcento	Top 1%	Ficou no top 1% do ranking mensal	/badges/top_1.svg	excelencia	lendario	2000	f	\N	{"tipo": "ranking", "percentil": 1}	2025-11-13 17:23:54.342431
\.


--
-- Data for Name: tb_universidade_badges_usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_badges_usuarios (id, id_usuario, id_badge, dt_conquista, nft_token_id, nft_tx_hash, nft_blockchain_url) FROM stdin;
514f5150-a80a-414f-a308-4a4b8a9271fd	a1b2c3d4-e5f6-4890-a234-567890abcdef	e0530e75-d60e-4919-8e89-0fe19eb4dfeb	2025-09-30 17:40:13.080511	\N	\N	\N
6cd4c363-758b-4183-9aec-2084a6f8cda0	a1b2c3d4-e5f6-4890-a234-567890abcdef	68f93810-af02-468f-99f0-5694656f5d28	2025-09-30 17:40:13.080511	\N	\N	\N
1827f37f-998a-498a-b970-76ef01837aa2	a1b2c3d4-e5f6-4890-a234-567890abcdef	eb182b6d-0080-4a5b-93a6-44d2c634d50a	2025-09-30 17:40:13.080511	\N	\N	\N
6c97a7a4-ebdb-46b7-8927-4ec403d646d8	b2c3d4e5-f6a7-4901-a345-678901bcdef0	e0530e75-d60e-4919-8e89-0fe19eb4dfeb	2025-11-06 17:40:13.094624	\N	\N	\N
dcb34a92-13ac-4d6d-9566-a4c92de506ec	b2c3d4e5-f6a7-4901-a345-678901bcdef0	6688bb55-8ba5-4657-b933-d468639c9ef9	2025-11-06 17:40:13.094624	\N	\N	\N
c707d00e-c1fa-40fc-8f4c-a66a9df5bcc6	c3d4e5f6-a7b8-4012-a456-789012cdef01	e0530e75-d60e-4919-8e89-0fe19eb4dfeb	2025-11-09 17:40:13.097684	\N	\N	\N
0376572a-3463-4f40-9ca1-43072bfb5fa0	d4e5f6a7-b8c9-4123-a567-890123def012	e0530e75-d60e-4919-8e89-0fe19eb4dfeb	2025-10-15 17:40:13.100671	\N	\N	\N
794f1fc8-7a97-48ba-abe2-340f030ae32c	d4e5f6a7-b8c9-4123-a567-890123def012	68f93810-af02-468f-99f0-5694656f5d28	2025-10-15 17:40:13.100671	\N	\N	\N
3901d136-96e7-403f-9d5c-0146819c0ba3	e5f6a7b8-c9d0-4234-a678-901234ef0123	e0530e75-d60e-4919-8e89-0fe19eb4dfeb	2025-10-25 17:40:13.103569	\N	\N	\N
5b0bbaa5-a6fb-496b-91bf-d7a112ed1ffb	e5f6a7b8-c9d0-4234-a678-901234ef0123	6688bb55-8ba5-4657-b933-d468639c9ef9	2025-10-25 17:40:13.103569	\N	\N	\N
\.


--
-- Data for Name: tb_universidade_certificados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_certificados (id_certificado, codigo_verificacao, id_usuario, id_curso, tipo_certificacao, dt_emissao, dt_validade, nota_final, carga_horaria, acreditacoes, pdf_url, fg_nft_habilitado, nft_token_id, nft_contract_address, nft_tx_hash, nft_blockchain_url, qr_code_url) FROM stdin;
\.


--
-- Data for Name: tb_universidade_cursos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_cursos (id_curso, titulo, slug, descricao, nivel, categoria, duracao_horas, preco, preco_assinante, thumbnail_url, video_intro_url, instrutor_id, instrutor_nome, certificacao_tipo, fg_ativo, total_inscricoes, avaliacao_media, total_avaliacoes, tags, prerequisitos, dt_criacao, dt_atualizacao, dt_publicacao) FROM stdin;
7e41888d-e899-4c58-a1e3-befedbde27b7	Toxina Botulínica Avançada	toxina-botulinica-avancada	Curso completo sobre aplicação de toxina botulínica para rejuvenescimento facial. Técnicas avançadas, anatomia detalhada e protocolos de segurança.	avancado	injetaveis	20	997.00	697.00	\N	\N	\N	Dra. Ana Costa	prata	t	245	4.67	3	{toxina,injetaveis,facial,avancado}	\N	2025-11-13 17:26:58.318724	\N	\N
ecb484dc-22e3-4981-bb46-9b2fa7cdfa3a	Preenchedores Faciais	preenchedores-faciais	Domine as técnicas de preenchimento facial com ácido hialurônico. MD Codes, 8-Point Lift e harmonização natural.	intermediario	injetaveis	30	1497.00	997.00	\N	\N	\N	Dr. João Silva	ouro	t	189	5.00	2	{preenchedores,injetaveis,harmonizacao}	\N	2025-11-13 17:26:58.331509	\N	\N
80fc05c2-095d-44c3-b844-d4c9de5247d6	Peelings Químicos Avançados	peelings-quimicos-avancados	Protocolos completos de peelings químicos superficiais, médios e profundos. Indicações, contraindicações e manejo de complicações.	intermediario	facial	15	797.00	597.00	\N	\N	\N	Dra. Maria Santos	prata	t	156	5.00	1	{peelings,facial,rejuvenescimento}	\N	2025-11-13 17:26:58.334089	\N	\N
f5dd74ff-ddf1-44b7-ba2e-5a6b4697edb0	Marketing Digital para Clínicas de Estética	marketing-digital-clinicas	Estratégias de marketing digital específicas para clínicas de estética. Instagram, Google Ads, SEO e conversão de leads.	iniciante	negocios	8	497.00	347.00	\N	\N	\N	Rafael Oliveira	bronze	t	98	4.00	1	{marketing,negocios,vendas,digital}	\N	2025-11-13 17:26:58.33652	\N	\N
79f89eef-58bb-4fa9-afd1-9b669df9cbea	Criolipólise Avançada	criolipolise-avancada	Técnicas avançadas de criolipólise para redução de gordura localizada. Protocolos, parâmetros e combinações com outros tratamentos.	avancado	corporal	12	697.00	497.00	\N	\N	\N	Dr. Carlos Mendes	prata	t	134	5.00	1	{criolipolise,corporal,emagrecimento}	\N	2025-11-13 17:26:58.338857	\N	\N
\.


--
-- Data for Name: tb_universidade_ebooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_ebooks (id_ebook, titulo, descricao, autor, categoria, paginas, downloads, avaliacao_media, total_avaliacoes, formato, tamanho_mb, idioma, thumbnail_url, pdf_url, preview_url, isbn, tags, fg_gratuito, preco, dt_publicacao, dt_criacao, dt_atualizacao, fg_ativo) FROM stdin;
88fbe380-ec17-4eec-9f6c-60e0b606c700	Guia Completo de Toxina Botulínica	Manual prático com protocolos de aplicação, anatomia facial detalhada e manejo de complicações.	Dra. Ana Costa	injetaveis	156	2543	4.90	87	PDF	12.50	Português	https://picsum.photos/seed/ebook1/400/600	https://exemplo.com/ebooks/toxina-botulina.pdf	https://exemplo.com/ebooks/toxina-botulina-preview.pdf	\N	{toxina,protocolos,anatomia}	t	0.00	2025-08-16 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
343c6f1d-d7d9-4a25-b14d-0bb3f912cd34	Marketing Digital para Clínicas	Estratégias práticas de marketing digital, SEO, Google Ads e conversão de leads para clínicas de estética.	Rafael Oliveira	negocios	98	1876	4.70	54	PDF	8.20	Português	https://picsum.photos/seed/ebook2/400/600	https://exemplo.com/ebooks/marketing-digital.pdf	https://exemplo.com/ebooks/marketing-digital-preview.pdf	\N	{marketing,vendas,digital}	t	0.00	2025-09-15 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
ccfa2d31-cdca-48ac-93d6-8369acc9cd5c	Preenchedores: MD Codes e Harmonização Facial	Técnicas avançadas de MD Codes, pontos de aplicação e protocolos para harmonização facial natural.	Dr. João Silva	injetaveis	234	3124	5.00	126	PDF	18.70	Português	https://picsum.photos/seed/ebook3/400/600	https://exemplo.com/ebooks/preenchedores-md-codes.pdf	https://exemplo.com/ebooks/preenchedores-md-codes-preview.pdf	\N	{preenchedores,md-codes,harmonizacao}	t	0.00	2025-09-30 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
83314e7d-4846-496f-93af-99091d5f71f1	Peelings Químicos: Do Básico ao Avançado	Protocolos completos de peelings superficiais, médios e profundos com indicações e contraindicações.	Dra. Maria Santos	facial	187	1654	4.80	72	PDF	14.30	Português	https://picsum.photos/seed/ebook4/400/600	https://exemplo.com/ebooks/peelings-quimicos.pdf	https://exemplo.com/ebooks/peelings-quimicos-preview.pdf	\N	{peelings,protocolos,facial}	t	0.00	2025-10-15 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
ebb8006d-74ba-4cd9-857a-ebbac796e84f	Criolipólise e Tecnologias Corporais	Guia prático de criolipólise, radiofrequência e outras tecnologias para tratamento corporal.	Dr. Carlos Mendes	corporal	142	2198	4.60	63	PDF	10.80	Português	https://picsum.photos/seed/ebook5/400/600	https://exemplo.com/ebooks/criolipolise.pdf	https://exemplo.com/ebooks/criolipolise-preview.pdf	\N	{criolipolise,corporal,tecnologias}	t	0.00	2025-10-25 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
d0c11cc7-9ada-4595-aeb7-c97655f9cb69	Gestão Financeira de Clínicas de Estética	Como organizar as finanças, precificar procedimentos e aumentar a lucratividade da clínica.	Rafael Oliveira	negocios	114	987	4.50	41	PDF	6.40	Português	https://picsum.photos/seed/ebook6/400/600	https://exemplo.com/ebooks/gestao-financeira.pdf	https://exemplo.com/ebooks/gestao-financeira-preview.pdf	\N	{financeiro,gestao,negocios}	t	0.00	2025-10-30 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
6f51c005-37c7-4e52-bdcf-f896087a29ed	Fotografia Clínica em Estética	Técnicas de fotografia clínica padronizada para documentação de procedimentos estéticos.	Lucas Ferreira	tecnologias	76	1433	4.70	38	PDF	15.20	Português	https://picsum.photos/seed/ebook7/400/600	https://exemplo.com/ebooks/fotografia-clinica.pdf	https://exemplo.com/ebooks/fotografia-clinica-preview.pdf	\N	{fotografia,documentacao,tecnicas}	t	0.00	2025-11-04 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
0a0b10b4-bb4e-46b0-9f5d-1d050c221b80	Anatomia Facial para Injetáveis	Atlas anatômico detalhado com foco em pontos seguros para aplicação de injetáveis.	Dra. Patricia Lima	injetaveis	198	2878	4.90	94	PDF	22.40	Português	https://picsum.photos/seed/ebook8/400/600	https://exemplo.com/ebooks/anatomia-facial.pdf	https://exemplo.com/ebooks/anatomia-facial-preview.pdf	\N	{anatomia,injetaveis,seguranca}	t	0.00	2025-11-09 19:13:34.90068	2025-11-14 19:13:34.90068	\N	t
\.


--
-- Data for Name: tb_universidade_eventos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_eventos (id_evento, titulo, descricao, tipo, dt_inicio, dt_fim, duracao_horas, instrutor_id, instrutor_nome, preco, preco_assinante, max_participantes, total_inscritos, stream_url, replay_url, fg_chat_habilitado, fg_metaverso_habilitado, metaverso_room_id, certificado_horas, thumbnail_url, status, tags, dt_criacao) FROM stdin;
80ad400d-00c6-454d-92f0-16940a3c0302	Toxina Botulínica: Novos Protocolos 2025	Webinar ao vivo com demonstração prática dos novos protocolos de aplicação de toxina botulínica aprovados pela ANVISA. Discussão de casos clínicos e manejo de complicações.	webinar	2025-01-20 19:00:00	2025-01-20 21:00:00	2	\N	Dra. Ana Costa	49.90	0.00	500	234	https://meet.doctorq.app/webinar-toxina-2025	\N	t	f	\N	2	https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800	agendado	{toxina,injetaveis,protocolos,anvisa}	2025-11-14 19:21:12.632611
c0da2c83-ae05-4537-8858-f089535adfc5	Workshop Prático: MD Codes Avançado	Workshop intensivo de 2 dias com prática em modelos anatômicos. Aprenda as técnicas avançadas de MD Codes para harmonização facial natural. Inclui kit de materiais.	workshop	2025-02-15 09:00:00	2025-02-16 18:00:00	16	\N	Dr. João Silva	1990.00	1490.00	30	18	\N	\N	f	f	\N	16	https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800	agendado	{preenchedores,md-codes,harmonizacao,pratica}	2025-11-14 19:21:12.632611
475b7183-aa59-4e40-a622-59d883d4d7de	Masterclass: Marketing Digital para Clínicas de Estética	Estratégias comprovadas de marketing digital para aumentar sua base de clientes. Análise de cases de sucesso e ferramentas práticas para implementar hoje.	masterclass	2025-01-10 20:00:00	2025-01-10 22:00:00	2	\N	Rafael Oliveira	0.00	0.00	\N	872	\N	https://youtube.com/watch?v=exemplo-marketing-digital	f	f	\N	0	https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800	finalizado	{marketing,digital,vendas,estrategia}	2025-11-14 19:21:12.632611
e20e5dfa-80ac-4945-9de9-0646c407f9c2	Congresso Internacional de Estética Avançada 2025	Maior evento de estética do Brasil! 3 dias com mais de 50 palestrantes nacionais e internacionais. Networking, feira de tecnologias e certificação internacional.	congresso	2025-06-10 08:00:00	2025-06-12 20:00:00	30	\N	Comitê Científico DoctorQ	2990.00	1990.00	1000	456	https://meet.doctorq.app/congresso-2025	\N	t	t	doctorq-congress-2025	30	https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800	agendado	{congresso,internacional,networking,certificacao}	2025-11-14 19:21:12.632611
0f8942e2-54fa-4ff2-8e69-632dae82f669	Imersão: Peelings Químicos - Do Básico ao Avançado	Imersão completa de 1 semana sobre peelings químicos. Teoria, prática supervisionada em pacientes reais, protocolos de segurança e manejo de complicações. Vagas limitadas.	imersao	2025-03-03 08:00:00	2025-03-07 18:00:00	40	\N	Dra. Maria Santos	4990.00	3990.00	15	12	\N	\N	f	f	\N	40	https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800	agendado	{peelings,quimicos,pratica,imersao}	2025-11-14 19:21:12.632611
89dfffad-1ebf-4ef2-928b-bffa12756dfb	Webinar: Lasers em Estética - Tecnologias 2025	Novidades em tecnologia laser para rejuvenescimento, tratamento de manchas e cicatrizes. Comparativo entre diferentes plataformas e análise de custo-benefício.	webinar	2025-01-05 19:00:00	2025-01-05 21:00:00	2	\N	Dr. Carlos Mendes	39.90	0.00	500	412	\N	https://youtube.com/watch?v=exemplo-lasers-2025	f	f	\N	2	https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800	finalizado	{laser,tecnologia,rejuvenescimento,equipamentos}	2025-11-14 19:21:12.632611
e98839bd-a3fb-4281-829e-94c5993a38eb	Workshop: Gestão Financeira para Clínicas	Workshop de 1 dia sobre gestão financeira específica para clínicas de estética. Fluxo de caixa, precificação, indicadores de performance e planejamento tributário.	workshop	2025-02-28 09:00:00	2025-02-28 17:00:00	8	\N	Rafael Oliveira	490.00	290.00	50	32	\N	\N	f	f	\N	8	https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800	agendado	{financeiro,gestao,negocios,planejamento}	2025-11-14 19:21:12.632611
b9afff41-efe7-46dd-918d-e21e3d107f15	Masterclass: Fios de PDO - Técnicas e Indicações	Masterclass gratuita sobre fios de PDO. Anatomia aplicada, técnicas de aplicação, indicações e contraindicações. Tire suas dúvidas ao vivo com especialista.	masterclass	2025-01-25 20:00:00	2025-01-25 21:30:00	1	\N	Dra. Paula Ribeiro	0.00	0.00	\N	89	https://meet.doctorq.app/live-fios-pdo	\N	t	f	\N	0	https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800	agendado	{fios,pdo,lifting,tecnicas}	2025-11-14 19:21:12.632611
\.


--
-- Data for Name: tb_universidade_favoritos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_favoritos (id_favorito, id_usuario, tx_tipo, id_referencia, tx_observacao, dt_criacao) FROM stdin;
\.


--
-- Data for Name: tb_universidade_inscricoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_inscricoes (id_inscricao, id_usuario, id_curso, dt_inscricao, dt_conclusao, progresso_percentual, status, nota_final, tempo_total_estudo_minutos, ultima_aula_assistida, dt_ultima_atividade) FROM stdin;
88e46f94-629a-4fbc-b428-82b839b2e232	a1b2c3d4-e5f6-4890-a234-567890abcdef	ecb484dc-22e3-4981-bb46-9b2fa7cdfa3a	2025-09-30 17:36:57.23767	2025-10-05 17:36:57.23767	100	concluido	\N	1800	\N	\N
d5473ed1-a715-4e3a-8632-1591e5300222	a1b2c3d4-e5f6-4890-a234-567890abcdef	7e41888d-e899-4c58-a1e3-befedbde27b7	2025-10-30 17:36:57.243472	\N	80	em_andamento	\N	720	\N	\N
7cf3afe6-6d92-4d43-9a18-a214410c8219	b2c3d4e5-f6a7-4901-a345-678901bcdef0	f5dd74ff-ddf1-44b7-ba2e-5a6b4697edb0	2025-11-06 17:36:57.246216	\N	60	em_andamento	\N	290	\N	\N
c103af5e-9dcd-49fe-86d1-81fbc7dd32a2	c3d4e5f6-a7b8-4012-a456-789012cdef01	80fc05c2-095d-44c3-b844-d4c9de5247d6	2025-11-09 17:36:57.248897	\N	25	em_andamento	\N	180	\N	\N
f222e29d-c33a-4b8a-8829-09966131a986	d4e5f6a7-b8c9-4123-a567-890123def012	79f89eef-58bb-4fa9-afd1-9b669df9cbea	2025-10-15 17:36:57.251549	2025-10-20 17:36:57.251549	100	concluido	\N	720	\N	\N
e11fb4c9-77e2-4b65-9365-b9a9131ae7fe	d4e5f6a7-b8c9-4123-a567-890123def012	7e41888d-e899-4c58-a1e3-befedbde27b7	2025-11-02 17:36:57.254187	\N	40	em_andamento	\N	480	\N	\N
eb3ffd1e-749f-45c0-a442-257e2e12af8f	e5f6a7b8-c9d0-4234-a678-901234ef0123	ecb484dc-22e3-4981-bb46-9b2fa7cdfa3a	2025-10-25 17:36:57.256778	\N	90	em_andamento	\N	1620	\N	\N
\.


--
-- Data for Name: tb_universidade_inscricoes_eventos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_inscricoes_eventos (id, id_usuario, id_evento, dt_inscricao, preco_pago, fg_compareceu, tempo_assistido_minutos, fg_certificado_emitido, avaliacao, comentario) FROM stdin;
\.


--
-- Data for Name: tb_universidade_matriculas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_matriculas (id_matricula, id_usuario, id_curso, id_pagamento, progresso, dt_conclusao, status, dt_primeiro_acesso, dt_ultimo_acesso, fg_certificado_emitido, dt_certificado, dt_criacao, dt_atualizacao, fg_ativo) FROM stdin;
\.


--
-- Data for Name: tb_universidade_mentores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_mentores (id, id_usuario, especialidades, preco_sessao_tokens, disponibilidade, total_mentorias, avaliacao_media, total_avaliacoes, biografia, certificacoes, fg_ativo, dt_criacao) FROM stdin;
\.


--
-- Data for Name: tb_universidade_missoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_missoes (id_user_missao, id_usuario, tipo_missao, titulo, descricao, icone, meta, progresso_atual, xp_recompensa, tokens_recompensa, fg_concluida, dt_criacao, dt_conclusao, dt_expiracao) FROM stdin;
4785c979-aa5a-483a-b186-5844e09eb156	d42a62bd-fb53-4eac-a330-877e35dce06f	primeira_aula	Primeiro Passo	Assista sua primeira aula do dia	🌅	1	0	30	5	f	2025-11-13 21:35:13.324302	\N	2025-11-14 18:35:13.323062
9fce0907-d091-42ba-b787-8bd4c4479634	d42a62bd-fb53-4eac-a330-877e35dce06f	assistir_aulas	Estudante Dedicado	Assista 3 aulas hoje	📚	3	0	50	10	f	2025-11-13 21:35:13.324307	\N	2025-11-14 18:35:13.323127
b392d58f-e13a-4ba6-9d21-70747739a7ac	d42a62bd-fb53-4eac-a330-877e35dce06f	tempo_estudo	Maratona de Estudos	Estude por 30 minutos hoje	⏱️	30	0	75	15	f	2025-11-13 21:35:13.32431	\N	2025-11-14 18:35:13.323155
\.


--
-- Data for Name: tb_universidade_modulos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_modulos (id_modulo, id_curso, ordem, titulo, descricao, duracao_minutos, fg_obrigatorio, dt_criacao) FROM stdin;
5766d58c-b608-401e-bce4-bdbf8abbe484	7e41888d-e899-4c58-a1e3-befedbde27b7	1	Fundamentos da Toxina Botulínica	Histórico, mecanismo de ação e farmacologia	240	t	2025-11-13 17:26:58.341339
a3974870-d7cb-4067-9b04-70050f190ffb	7e41888d-e899-4c58-a1e3-befedbde27b7	2	Técnicas de Aplicação	Protocolos de aplicação nas principais áreas faciais	360	t	2025-11-13 17:26:58.341339
b10146ce-ad54-4075-b2aa-bd74f4c5c9a0	7e41888d-e899-4c58-a1e3-befedbde27b7	3	Técnicas Avançadas e Complicações	Técnicas avançadas, correção de assimetrias e manejo de complicações	300	t	2025-11-13 17:26:58.341339
\.


--
-- Data for Name: tb_universidade_notas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_notas (id_nota, id_usuario, id_aula, tx_conteudo, nr_timestamp_video, fg_publica, fg_ativo, dt_criacao, dt_atualizacao) FROM stdin;
\.


--
-- Data for Name: tb_universidade_pagamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_pagamentos (id_pagamento, id_usuario, tipo_item, id_item, mp_payment_id, mp_preference_id, tipo_pagamento, metodo_pagamento, vl_total, vl_taxa, vl_liquido, moeda, status, status_detalhe, email_pagador, nome_pagador, cpf_pagador, descricao, qr_code, qr_code_base64, ticket_url, parcelas, ds_metadata, dt_aprovacao, dt_expiracao, dt_criacao, dt_atualizacao, fg_ativo) FROM stdin;
\.


--
-- Data for Name: tb_universidade_podcasts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_podcasts (id_podcast, titulo, descricao, categoria, episodio, duracao_minutos, dt_publicacao, autor, thumbnail_url, audio_url, plays, tags, transcricao, fg_ativo, dt_criacao, dt_atualizacao) FROM stdin;
0213e69a-48ad-46b7-b634-2a873ee521fd	Marketing Digital para Clínicas: Cases de Sucesso	Como aumentar sua base de clientes usando estratégias digitais comprovadas.	negocios	11	38	2025-11-02 19:13:34.904841	Rafael Oliveira	https://picsum.photos/seed/podcast2/800/450	https://exemplo.com/podcasts/marketing-digital-ep11.mp3	987	{marketing,digital,vendas}	\N	t	2025-11-14 19:13:34.904841	\N
cbcaf588-1856-48b2-bea7-f10d7cc0d207	Preenchedores: MD Codes Avançado	Técnicas avançadas de MD Codes para harmonização facial natural.	injetaveis	10	52	2025-10-26 19:13:34.904841	Dr. João Silva	https://picsum.photos/seed/podcast3/800/450	https://exemplo.com/podcasts/preenchedores-md-codes-ep10.mp3	1543	{preenchedores,md-codes,harmonizacao}	\N	t	2025-11-14 19:13:34.904841	\N
1d973e31-5379-4c0c-af7b-6a07ac01bfdb	Peelings Químicos: Protocolos de Segurança	Manejo de complicações e protocolos de segurança em peelings médios e profundos.	facial	9	41	2025-10-19 19:13:34.904841	Dra. Maria Santos	https://picsum.photos/seed/podcast4/800/450	https://exemplo.com/podcasts/peelings-quimicos-ep9.mp3	876	{peelings,seguranca,protocolos}	\N	t	2025-11-14 19:13:34.904841	\N
a6644746-e625-4b97-ab10-20bb11e4c7a0	Lasers em Estética: O que há de novo	Novidades em tecnologia laser para rejuvenescimento e tratamento de manchas.	tecnologias	8	48	2025-10-12 19:13:34.904841	Dr. Carlos Mendes	https://picsum.photos/seed/podcast5/800/450	https://exemplo.com/podcasts/lasers-estetica-ep8.mp3	1098	{laser,tecnologia,rejuvenescimento}	\N	t	2025-11-14 19:13:34.904841	\N
760a5e00-8717-40a1-80d6-5f2eba807907	Gestão Financeira para Clínicas de Estética	Como organizar as finanças da sua clínica e aumentar a lucratividade.	negocios	7	35	2025-10-05 19:13:34.904841	Rafael Oliveira	https://picsum.photos/seed/podcast6/800/450	https://exemplo.com/podcasts/gestao-financeira-ep7.mp3	654	{financeiro,gestao,negocios}	\N	t	2025-11-14 19:13:34.904841	\N
d38e805c-a0b5-4fe7-95fd-590f09a14516	Toxina Botulínica: Novos Protocolos 2025	Discussão com especialistas sobre as últimas tendências e protocolos de aplicação de toxina botulínica.	injetaveis	12	45	2025-11-09 19:13:34.904841	Dra. Ana Costa	https://picsum.photos/seed/podcast1/800/450	https://exemplo.com/podcasts/toxina-botulina-ep12.mp3	1236	{toxina,protocolos,injetaveis}	\N	t	2025-11-14 19:13:34.904841	\N
\.


--
-- Data for Name: tb_universidade_progresso_aulas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_progresso_aulas (id, id_inscricao, id_aula, fg_assistido, tempo_assistido_segundos, ultima_posicao_segundos, progresso_percentual, dt_inicio, dt_conclusao) FROM stdin;
\.


--
-- Data for Name: tb_universidade_ranking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_ranking (id, periodo, id_usuario, posicao, pontuacao, dt_calculo) FROM stdin;
\.


--
-- Data for Name: tb_universidade_salas_metaverso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_salas_metaverso (id_sala, nome, tipo, max_usuarios, usuarios_online, colyseus_room_id, fg_ativa, dt_criacao) FROM stdin;
1845a241-2b79-4ed4-9a65-3944d0776546	Auditório Principal	auditorio	100	0	\N	t	2025-11-13 17:23:54.345547
3fb78d99-7a21-4e42-aee0-48711196dbe3	Laboratório de Práticas	laboratorio	50	0	\N	t	2025-11-13 17:23:54.345547
6bf6c51a-ab5f-4ccb-941f-4ef81ca43e2a	Lounge do Café	lounge	30	0	\N	t	2025-11-13 17:23:54.345547
97c80059-2b77-453e-b9bb-7bf4c31675e7	Biblioteca Central	biblioteca	20	0	\N	t	2025-11-13 17:23:54.345547
\.


--
-- Data for Name: tb_universidade_sessoes_mentoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_sessoes_mentoria (id, id_mentor, id_mentorado, dt_hora, duracao_minutos, status, room_url, notas_mentor, avaliacao_mentorado, comentario_mentorado, tokens_pagos, dt_criacao) FROM stdin;
\.


--
-- Data for Name: tb_universidade_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_tokens (id, id_usuario, saldo_tokens, total_ganho, total_gasto, dt_atualizacao) FROM stdin;
b4e38e13-25bb-440f-828d-bf8dfc0487ad	a1b2c3d4-e5f6-4890-a234-567890abcdef	350	0	0	2025-11-14 17:36:57.234749
8b24d6f2-9f95-4ad8-8f30-3f0f367f0e9e	b2c3d4e5-f6a7-4901-a345-678901bcdef0	180	0	0	2025-11-14 17:36:57.234749
705bdc12-5a08-4e30-9a30-97db39ff5663	c3d4e5f6-a7b8-4012-a456-789012cdef01	75	0	0	2025-11-14 17:36:57.234749
4392fcd8-f927-47ca-8c56-a286b36cdf91	d4e5f6a7-b8c9-4123-a567-890123def012	120	0	0	2025-11-14 17:36:57.234749
8b90591c-af96-4c34-aeeb-e1b1504cbaf6	e5f6a7b8-c9d0-4234-a678-901234ef0123	210	0	0	2025-11-14 17:36:57.234749
\.


--
-- Data for Name: tb_universidade_transacoes_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_transacoes_tokens (id, id_usuario, tipo, quantidade, motivo, referencia_id, metadados, dt_transacao) FROM stdin;
\.


--
-- Data for Name: tb_universidade_xp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tb_universidade_xp (id, id_usuario, total_xp, nivel, xp_proximo_nivel, dt_atualizacao) FROM stdin;
e567190f-c7b0-484d-b584-2fc87dfed927	a1b2c3d4-e5f6-4890-a234-567890abcdef	8500	8	9000	2025-11-14 17:36:57.231506
254365e7-8994-446d-ac31-7108fa48604b	b2c3d4e5-f6a7-4901-a345-678901bcdef0	4200	5	5000	2025-11-14 17:36:57.231506
b55810d9-2d82-483d-a9b9-33b2373f101a	c3d4e5f6-a7b8-4012-a456-789012cdef01	1800	2	2000	2025-11-14 17:36:57.231506
b42d5fe9-8987-41f4-94e6-38c6c7ace70b	d4e5f6a7-b8c9-4123-a567-890123def012	3100	4	4000	2025-11-14 17:36:57.231506
3739e46c-e0ed-4340-b96e-73555d741b4a	e5f6a7b8-c9d0-4234-a678-901234ef0123	5600	6	6000	2025-11-14 17:36:57.231506
\.


--
-- Name: tb_universidade_analytics tb_universidade_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_analytics
    ADD CONSTRAINT tb_universidade_analytics_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_assinaturas tb_universidade_assinaturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_assinaturas
    ADD CONSTRAINT tb_universidade_assinaturas_pkey PRIMARY KEY (id_assinatura);


--
-- Name: tb_universidade_aulas tb_universidade_aulas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_aulas
    ADD CONSTRAINT tb_universidade_aulas_pkey PRIMARY KEY (id_aula);


--
-- Name: tb_universidade_avaliacoes_cursos tb_universidade_avaliacoes_cursos_id_usuario_id_curso_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_avaliacoes_cursos
    ADD CONSTRAINT tb_universidade_avaliacoes_cursos_id_usuario_id_curso_key UNIQUE (id_usuario, id_curso);


--
-- Name: tb_universidade_avaliacoes_cursos tb_universidade_avaliacoes_cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_avaliacoes_cursos
    ADD CONSTRAINT tb_universidade_avaliacoes_cursos_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_avatares tb_universidade_avatares_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_avatares
    ADD CONSTRAINT tb_universidade_avatares_id_usuario_key UNIQUE (id_usuario);


--
-- Name: tb_universidade_avatares tb_universidade_avatares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_avatares
    ADD CONSTRAINT tb_universidade_avatares_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_badges tb_universidade_badges_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_badges
    ADD CONSTRAINT tb_universidade_badges_codigo_key UNIQUE (codigo);


--
-- Name: tb_universidade_badges tb_universidade_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_badges
    ADD CONSTRAINT tb_universidade_badges_pkey PRIMARY KEY (id_badge);


--
-- Name: tb_universidade_badges_usuarios tb_universidade_badges_usuarios_id_usuario_id_badge_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_badges_usuarios
    ADD CONSTRAINT tb_universidade_badges_usuarios_id_usuario_id_badge_key UNIQUE (id_usuario, id_badge);


--
-- Name: tb_universidade_badges_usuarios tb_universidade_badges_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_badges_usuarios
    ADD CONSTRAINT tb_universidade_badges_usuarios_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_certificados tb_universidade_certificados_codigo_verificacao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_certificados
    ADD CONSTRAINT tb_universidade_certificados_codigo_verificacao_key UNIQUE (codigo_verificacao);


--
-- Name: tb_universidade_certificados tb_universidade_certificados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_certificados
    ADD CONSTRAINT tb_universidade_certificados_pkey PRIMARY KEY (id_certificado);


--
-- Name: tb_universidade_cursos tb_universidade_cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_cursos
    ADD CONSTRAINT tb_universidade_cursos_pkey PRIMARY KEY (id_curso);


--
-- Name: tb_universidade_cursos tb_universidade_cursos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_cursos
    ADD CONSTRAINT tb_universidade_cursos_slug_key UNIQUE (slug);


--
-- Name: tb_universidade_ebooks tb_universidade_ebooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_ebooks
    ADD CONSTRAINT tb_universidade_ebooks_pkey PRIMARY KEY (id_ebook);


--
-- Name: tb_universidade_eventos tb_universidade_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_eventos
    ADD CONSTRAINT tb_universidade_eventos_pkey PRIMARY KEY (id_evento);


--
-- Name: tb_universidade_favoritos tb_universidade_favoritos_id_usuario_tx_tipo_id_referencia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_favoritos
    ADD CONSTRAINT tb_universidade_favoritos_id_usuario_tx_tipo_id_referencia_key UNIQUE (id_usuario, tx_tipo, id_referencia);


--
-- Name: tb_universidade_favoritos tb_universidade_favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_favoritos
    ADD CONSTRAINT tb_universidade_favoritos_pkey PRIMARY KEY (id_favorito);


--
-- Name: tb_universidade_inscricoes_eventos tb_universidade_inscricoes_eventos_id_usuario_id_evento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_inscricoes_eventos
    ADD CONSTRAINT tb_universidade_inscricoes_eventos_id_usuario_id_evento_key UNIQUE (id_usuario, id_evento);


--
-- Name: tb_universidade_inscricoes_eventos tb_universidade_inscricoes_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_inscricoes_eventos
    ADD CONSTRAINT tb_universidade_inscricoes_eventos_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_inscricoes tb_universidade_inscricoes_id_usuario_id_curso_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_inscricoes
    ADD CONSTRAINT tb_universidade_inscricoes_id_usuario_id_curso_key UNIQUE (id_usuario, id_curso);


--
-- Name: tb_universidade_inscricoes tb_universidade_inscricoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_inscricoes
    ADD CONSTRAINT tb_universidade_inscricoes_pkey PRIMARY KEY (id_inscricao);


--
-- Name: tb_universidade_matriculas tb_universidade_matriculas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_matriculas
    ADD CONSTRAINT tb_universidade_matriculas_pkey PRIMARY KEY (id_matricula);


--
-- Name: tb_universidade_mentores tb_universidade_mentores_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_mentores
    ADD CONSTRAINT tb_universidade_mentores_id_usuario_key UNIQUE (id_usuario);


--
-- Name: tb_universidade_mentores tb_universidade_mentores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_mentores
    ADD CONSTRAINT tb_universidade_mentores_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_missoes tb_universidade_missoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_missoes
    ADD CONSTRAINT tb_universidade_missoes_pkey PRIMARY KEY (id_user_missao);


--
-- Name: tb_universidade_modulos tb_universidade_modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_modulos
    ADD CONSTRAINT tb_universidade_modulos_pkey PRIMARY KEY (id_modulo);


--
-- Name: tb_universidade_notas tb_universidade_notas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_notas
    ADD CONSTRAINT tb_universidade_notas_pkey PRIMARY KEY (id_nota);


--
-- Name: tb_universidade_pagamentos tb_universidade_pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_pagamentos
    ADD CONSTRAINT tb_universidade_pagamentos_pkey PRIMARY KEY (id_pagamento);


--
-- Name: tb_universidade_podcasts tb_universidade_podcasts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_podcasts
    ADD CONSTRAINT tb_universidade_podcasts_pkey PRIMARY KEY (id_podcast);


--
-- Name: tb_universidade_progresso_aulas tb_universidade_progresso_aulas_id_inscricao_id_aula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_progresso_aulas
    ADD CONSTRAINT tb_universidade_progresso_aulas_id_inscricao_id_aula_key UNIQUE (id_inscricao, id_aula);


--
-- Name: tb_universidade_progresso_aulas tb_universidade_progresso_aulas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_progresso_aulas
    ADD CONSTRAINT tb_universidade_progresso_aulas_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_ranking tb_universidade_ranking_periodo_id_usuario_dt_calculo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_ranking
    ADD CONSTRAINT tb_universidade_ranking_periodo_id_usuario_dt_calculo_key UNIQUE (periodo, id_usuario, dt_calculo);


--
-- Name: tb_universidade_ranking tb_universidade_ranking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_ranking
    ADD CONSTRAINT tb_universidade_ranking_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_salas_metaverso tb_universidade_salas_metaverso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_salas_metaverso
    ADD CONSTRAINT tb_universidade_salas_metaverso_pkey PRIMARY KEY (id_sala);


--
-- Name: tb_universidade_sessoes_mentoria tb_universidade_sessoes_mentoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_sessoes_mentoria
    ADD CONSTRAINT tb_universidade_sessoes_mentoria_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_tokens tb_universidade_tokens_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_tokens
    ADD CONSTRAINT tb_universidade_tokens_id_usuario_key UNIQUE (id_usuario);


--
-- Name: tb_universidade_tokens tb_universidade_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_tokens
    ADD CONSTRAINT tb_universidade_tokens_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_transacoes_tokens tb_universidade_transacoes_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_transacoes_tokens
    ADD CONSTRAINT tb_universidade_transacoes_tokens_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_xp tb_universidade_xp_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_xp
    ADD CONSTRAINT tb_universidade_xp_id_usuario_key UNIQUE (id_usuario);


--
-- Name: tb_universidade_xp tb_universidade_xp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_xp
    ADD CONSTRAINT tb_universidade_xp_pkey PRIMARY KEY (id);


--
-- Name: tb_universidade_matriculas uk_matricula_usuario_curso; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_matriculas
    ADD CONSTRAINT uk_matricula_usuario_curso UNIQUE (id_usuario, id_curso);


--
-- Name: idx_analytics_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_data ON public.tb_universidade_analytics USING btree (dt_evento);


--
-- Name: idx_analytics_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_evento ON public.tb_universidade_analytics USING btree (evento);


--
-- Name: idx_analytics_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_usuario ON public.tb_universidade_analytics USING btree (id_usuario);


--
-- Name: idx_assinaturas_dt_fim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assinaturas_dt_fim ON public.tb_universidade_assinaturas USING btree (dt_fim);


--
-- Name: idx_assinaturas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assinaturas_status ON public.tb_universidade_assinaturas USING btree (status);


--
-- Name: idx_assinaturas_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assinaturas_usuario ON public.tb_universidade_assinaturas USING btree (id_usuario);


--
-- Name: idx_aulas_modulo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aulas_modulo ON public.tb_universidade_aulas USING btree (id_modulo);


--
-- Name: idx_aulas_video_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aulas_video_id ON public.tb_universidade_aulas USING btree (video_id);


--
-- Name: idx_aulas_video_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aulas_video_provider ON public.tb_universidade_aulas USING btree (video_provider);


--
-- Name: idx_aulas_video_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aulas_video_status ON public.tb_universidade_aulas USING btree (video_status);


--
-- Name: idx_badges_badge; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_badges_badge ON public.tb_universidade_badges_usuarios USING btree (id_badge);


--
-- Name: idx_badges_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_badges_usuario ON public.tb_universidade_badges_usuarios USING btree (id_usuario);


--
-- Name: idx_certificados_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificados_codigo ON public.tb_universidade_certificados USING btree (codigo_verificacao);


--
-- Name: idx_certificados_curso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificados_curso ON public.tb_universidade_certificados USING btree (id_curso);


--
-- Name: idx_certificados_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificados_usuario ON public.tb_universidade_certificados USING btree (id_usuario);


--
-- Name: idx_cursos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cursos_ativo ON public.tb_universidade_cursos USING btree (fg_ativo);


--
-- Name: idx_cursos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cursos_categoria ON public.tb_universidade_cursos USING btree (categoria);


--
-- Name: idx_cursos_instrutor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cursos_instrutor ON public.tb_universidade_cursos USING btree (instrutor_id);


--
-- Name: idx_cursos_nivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cursos_nivel ON public.tb_universidade_cursos USING btree (nivel);


--
-- Name: idx_ebooks_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ebooks_ativo ON public.tb_universidade_ebooks USING btree (fg_ativo);


--
-- Name: idx_ebooks_autor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ebooks_autor ON public.tb_universidade_ebooks USING btree (autor);


--
-- Name: idx_ebooks_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ebooks_categoria ON public.tb_universidade_ebooks USING btree (categoria);


--
-- Name: idx_eventos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_data ON public.tb_universidade_eventos USING btree (dt_inicio);


--
-- Name: idx_eventos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_status ON public.tb_universidade_eventos USING btree (status);


--
-- Name: idx_eventos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_tipo ON public.tb_universidade_eventos USING btree (tipo);


--
-- Name: idx_favoritos_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_criacao ON public.tb_universidade_favoritos USING btree (dt_criacao);


--
-- Name: idx_favoritos_referencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_referencia ON public.tb_universidade_favoritos USING btree (id_referencia);


--
-- Name: idx_favoritos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_tipo ON public.tb_universidade_favoritos USING btree (tx_tipo);


--
-- Name: idx_favoritos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favoritos_usuario ON public.tb_universidade_favoritos USING btree (id_usuario);


--
-- Name: idx_inscricoes_curso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscricoes_curso ON public.tb_universidade_inscricoes USING btree (id_curso);


--
-- Name: idx_inscricoes_eventos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscricoes_eventos_usuario ON public.tb_universidade_inscricoes_eventos USING btree (id_usuario);


--
-- Name: idx_inscricoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscricoes_status ON public.tb_universidade_inscricoes USING btree (status);


--
-- Name: idx_inscricoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscricoes_usuario ON public.tb_universidade_inscricoes USING btree (id_usuario);


--
-- Name: idx_matriculas_curso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matriculas_curso ON public.tb_universidade_matriculas USING btree (id_curso);


--
-- Name: idx_matriculas_progresso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matriculas_progresso ON public.tb_universidade_matriculas USING btree (progresso);


--
-- Name: idx_matriculas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matriculas_status ON public.tb_universidade_matriculas USING btree (status);


--
-- Name: idx_matriculas_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matriculas_usuario ON public.tb_universidade_matriculas USING btree (id_usuario);


--
-- Name: idx_missoes_concluida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_missoes_concluida ON public.tb_universidade_missoes USING btree (fg_concluida);


--
-- Name: idx_missoes_data_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_missoes_data_criacao ON public.tb_universidade_missoes USING btree (dt_criacao);


--
-- Name: idx_missoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_missoes_tipo ON public.tb_universidade_missoes USING btree (tipo_missao);


--
-- Name: idx_missoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_missoes_usuario ON public.tb_universidade_missoes USING btree (id_usuario);


--
-- Name: idx_modulos_curso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modulos_curso ON public.tb_universidade_modulos USING btree (id_curso);


--
-- Name: idx_notas_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_ativo ON public.tb_universidade_notas USING btree (fg_ativo);


--
-- Name: idx_notas_aula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_aula ON public.tb_universidade_notas USING btree (id_aula);


--
-- Name: idx_notas_conteudo_busca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_conteudo_busca ON public.tb_universidade_notas USING gin (to_tsvector('portuguese'::regconfig, tx_conteudo));


--
-- Name: idx_notas_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_criacao ON public.tb_universidade_notas USING btree (dt_criacao);


--
-- Name: idx_notas_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_timestamp ON public.tb_universidade_notas USING btree (nr_timestamp_video);


--
-- Name: idx_notas_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_usuario ON public.tb_universidade_notas USING btree (id_usuario);


--
-- Name: idx_pagamentos_dt_criacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_dt_criacao ON public.tb_universidade_pagamentos USING btree (dt_criacao);


--
-- Name: idx_pagamentos_mp_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_mp_payment_id ON public.tb_universidade_pagamentos USING btree (mp_payment_id);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_status ON public.tb_universidade_pagamentos USING btree (status);


--
-- Name: idx_pagamentos_tipo_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_tipo_item ON public.tb_universidade_pagamentos USING btree (tipo_item);


--
-- Name: idx_pagamentos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_usuario ON public.tb_universidade_pagamentos USING btree (id_usuario);


--
-- Name: idx_podcasts_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_podcasts_ativo ON public.tb_universidade_podcasts USING btree (fg_ativo);


--
-- Name: idx_podcasts_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_podcasts_categoria ON public.tb_universidade_podcasts USING btree (categoria);


--
-- Name: idx_podcasts_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_podcasts_data ON public.tb_universidade_podcasts USING btree (dt_publicacao);


--
-- Name: idx_podcasts_episodio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_podcasts_episodio ON public.tb_universidade_podcasts USING btree (episodio);


--
-- Name: idx_progresso_aula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progresso_aula ON public.tb_universidade_progresso_aulas USING btree (id_aula);


--
-- Name: idx_progresso_inscricao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progresso_inscricao ON public.tb_universidade_progresso_aulas USING btree (id_inscricao);


--
-- Name: idx_ranking_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ranking_periodo ON public.tb_universidade_ranking USING btree (periodo, posicao);


--
-- Name: idx_tokens_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_usuario ON public.tb_universidade_tokens USING btree (id_usuario);


--
-- Name: idx_transacoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_usuario ON public.tb_universidade_transacoes_tokens USING btree (id_usuario);


--
-- Name: idx_xp_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_xp_usuario ON public.tb_universidade_xp USING btree (id_usuario);


--
-- Name: tb_universidade_assinaturas tb_universidade_assinaturas_id_pagamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_assinaturas
    ADD CONSTRAINT tb_universidade_assinaturas_id_pagamento_fkey FOREIGN KEY (id_pagamento) REFERENCES public.tb_universidade_pagamentos(id_pagamento) ON DELETE SET NULL;


--
-- Name: tb_universidade_aulas tb_universidade_aulas_id_modulo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_aulas
    ADD CONSTRAINT tb_universidade_aulas_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.tb_universidade_modulos(id_modulo) ON DELETE CASCADE;


--
-- Name: tb_universidade_avaliacoes_cursos tb_universidade_avaliacoes_cursos_id_curso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_avaliacoes_cursos
    ADD CONSTRAINT tb_universidade_avaliacoes_cursos_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.tb_universidade_cursos(id_curso) ON DELETE CASCADE;


--
-- Name: tb_universidade_badges_usuarios tb_universidade_badges_usuarios_id_badge_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_badges_usuarios
    ADD CONSTRAINT tb_universidade_badges_usuarios_id_badge_fkey FOREIGN KEY (id_badge) REFERENCES public.tb_universidade_badges(id_badge) ON DELETE CASCADE;


--
-- Name: tb_universidade_certificados tb_universidade_certificados_id_curso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_certificados
    ADD CONSTRAINT tb_universidade_certificados_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.tb_universidade_cursos(id_curso);


--
-- Name: tb_universidade_inscricoes_eventos tb_universidade_inscricoes_eventos_id_evento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_inscricoes_eventos
    ADD CONSTRAINT tb_universidade_inscricoes_eventos_id_evento_fkey FOREIGN KEY (id_evento) REFERENCES public.tb_universidade_eventos(id_evento) ON DELETE CASCADE;


--
-- Name: tb_universidade_inscricoes tb_universidade_inscricoes_id_curso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_inscricoes
    ADD CONSTRAINT tb_universidade_inscricoes_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.tb_universidade_cursos(id_curso) ON DELETE CASCADE;


--
-- Name: tb_universidade_matriculas tb_universidade_matriculas_id_curso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_matriculas
    ADD CONSTRAINT tb_universidade_matriculas_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.tb_universidade_cursos(id_curso) ON DELETE CASCADE;


--
-- Name: tb_universidade_matriculas tb_universidade_matriculas_id_pagamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_matriculas
    ADD CONSTRAINT tb_universidade_matriculas_id_pagamento_fkey FOREIGN KEY (id_pagamento) REFERENCES public.tb_universidade_pagamentos(id_pagamento) ON DELETE SET NULL;


--
-- Name: tb_universidade_modulos tb_universidade_modulos_id_curso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_modulos
    ADD CONSTRAINT tb_universidade_modulos_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.tb_universidade_cursos(id_curso) ON DELETE CASCADE;


--
-- Name: tb_universidade_notas tb_universidade_notas_id_aula_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_notas
    ADD CONSTRAINT tb_universidade_notas_id_aula_fkey FOREIGN KEY (id_aula) REFERENCES public.tb_universidade_aulas(id_aula) ON DELETE CASCADE;


--
-- Name: tb_universidade_progresso_aulas tb_universidade_progresso_aulas_id_aula_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_progresso_aulas
    ADD CONSTRAINT tb_universidade_progresso_aulas_id_aula_fkey FOREIGN KEY (id_aula) REFERENCES public.tb_universidade_aulas(id_aula) ON DELETE CASCADE;


--
-- Name: tb_universidade_progresso_aulas tb_universidade_progresso_aulas_id_inscricao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_progresso_aulas
    ADD CONSTRAINT tb_universidade_progresso_aulas_id_inscricao_fkey FOREIGN KEY (id_inscricao) REFERENCES public.tb_universidade_inscricoes(id_inscricao) ON DELETE CASCADE;


--
-- Name: tb_universidade_sessoes_mentoria tb_universidade_sessoes_mentoria_id_mentor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_universidade_sessoes_mentoria
    ADD CONSTRAINT tb_universidade_sessoes_mentoria_id_mentor_fkey FOREIGN KEY (id_mentor) REFERENCES public.tb_universidade_mentores(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict TR3vGjR4ZxqOJRBFlstJxNLj4fJsGcGiFxgJphtJqn71cdxEl72wOwvftzC9GWw

