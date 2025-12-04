-- ============================================================================
-- SCRIPT COMPLETO DE PRODUÇÃO - DoctorQ Universidade
-- Data: 2025-11-23
-- ============================================================================
-- 
-- Este script cria:
-- 1. Extensões necessárias (uuid-ossp, pgvector)
-- 2. Todas as tabelas (~27 tabelas)
-- 3. Índices e constraints
-- 4. Cursos de exemplo (5 cursos)
-- 5. Módulos e aulas
-- 6. Badges de gamificação
-- 7. Eventos de exemplo
-- 8. Dados de teste (XP, tokens, inscrições, etc.)
--
-- COMO USAR:
-- 1. Criar o banco: CREATE DATABASE doctorq_univ;
-- 2. Executar este script: psql -d doctorq_univ -f PRODUCAO_DOCTORQ_UNIV_COMPLETO.sql
-- ============================================================================

-- ============================================
-- UNIVERSIDADE DA BELEZA - SCHEMA INICIAL
-- DoctorQ Platform - Microserviço Independente
-- Data: 2025-01-13
-- Versão: 1.0.0
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================
-- CURSOS E CONTEÚDO
-- ============================================

CREATE TABLE tb_universidade_cursos (
    id_curso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    descricao TEXT,
    nivel VARCHAR(50) CHECK (nivel IN ('iniciante', 'intermediario', 'avancado', 'expert')),
    categoria VARCHAR(100), -- injetaveis, corporal, facial, negocios, tecnologias
    duracao_horas INT NOT NULL DEFAULT 0,
    preco DECIMAL(10,2) DEFAULT 0.00,
    preco_assinante DECIMAL(10,2) DEFAULT 0.00, -- desconto para assinantes
    thumbnail_url VARCHAR(500),
    video_intro_url VARCHAR(500),
    instrutor_id UUID, -- Referência ao profissional da API principal
    instrutor_nome VARCHAR(200),
    certificacao_tipo VARCHAR(50) CHECK (certificacao_tipo IN ('bronze', 'prata', 'ouro', 'diamante')),
    fg_ativo BOOLEAN DEFAULT true,
    total_inscricoes INT DEFAULT 0,
    avaliacao_media DECIMAL(3,2) DEFAULT 0.00,
    total_avaliacoes INT DEFAULT 0,
    tags TEXT[], -- ["toxina", "avancado", "facial"]
    prerequisitos UUID[], -- IDs de cursos prerequisitos
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP,
    dt_publicacao TIMESTAMP
);

CREATE TABLE tb_universidade_modulos (
    id_modulo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_curso UUID NOT NULL REFERENCES tb_universidade_cursos(id_curso) ON DELETE CASCADE,
    ordem INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao_minutos INT DEFAULT 0,
    fg_obrigatorio BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tb_universidade_aulas (
    id_aula UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_modulo UUID NOT NULL REFERENCES tb_universidade_modulos(id_modulo) ON DELETE CASCADE,
    ordem INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('video', 'pdf', 'quiz', 'simulador_ar', 'live', 'texto', 'infografico')),
    conteudo_url VARCHAR(500), -- URL do vídeo/PDF/recurso
    duracao_minutos INT DEFAULT 0,
    transcript TEXT, -- Transcrição para busca semântica
    embeddings VECTOR(1536), -- Vetores para RAG
    recursos JSONB, -- Material complementar: {"pdf": "url", "slides": "url"}
    fg_preview BOOLEAN DEFAULT false, -- Aula gratuita para preview?
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- PROGRESSO DO ALUNO
-- ============================================

CREATE TABLE tb_universidade_inscricoes (
    id_inscricao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL, -- Referência ao usuário da API principal
    id_curso UUID NOT NULL REFERENCES tb_universidade_cursos(id_curso) ON DELETE CASCADE,
    dt_inscricao TIMESTAMP NOT NULL DEFAULT now(),
    dt_conclusao TIMESTAMP,
    progresso_percentual INT DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),
    status VARCHAR(50) CHECK (status IN ('em_andamento', 'concluido', 'cancelado', 'expirado')) DEFAULT 'em_andamento',
    nota_final DECIMAL(5,2),
    tempo_total_estudo_minutos INT DEFAULT 0,
    ultima_aula_assistida UUID, -- id_aula
    dt_ultima_atividade TIMESTAMP,
    UNIQUE(id_usuario, id_curso)
);

CREATE TABLE tb_universidade_progresso_aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_inscricao UUID NOT NULL REFERENCES tb_universidade_inscricoes(id_inscricao) ON DELETE CASCADE,
    id_aula UUID NOT NULL REFERENCES tb_universidade_aulas(id_aula) ON DELETE CASCADE,
    fg_assistido BOOLEAN DEFAULT false,
    tempo_assistido_segundos INT DEFAULT 0,
    ultima_posicao_segundos INT DEFAULT 0, -- Ponto onde parou
    progresso_percentual INT DEFAULT 0,
    dt_inicio TIMESTAMP,
    dt_conclusao TIMESTAMP,
    UNIQUE(id_inscricao, id_aula)
);

-- ============================================
-- GAMIFICAÇÃO
-- ============================================

CREATE TABLE tb_universidade_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    total_xp INT DEFAULT 0,
    nivel INT DEFAULT 1,
    xp_proximo_nivel INT DEFAULT 100,
    dt_atualizacao TIMESTAMP DEFAULT now()
);

CREATE TABLE tb_universidade_badges (
    id_badge UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL, -- primeira_aula, streak_7, etc
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone_url VARCHAR(500),
    tipo VARCHAR(50) CHECK (tipo IN ('progresso', 'excelencia', 'especializacao', 'social')) DEFAULT 'progresso',
    raridade VARCHAR(50) CHECK (raridade IN ('comum', 'raro', 'epico', 'lendario')) DEFAULT 'comum',
    xp_reward INT DEFAULT 0,
    fg_nft_habilitado BOOLEAN DEFAULT false,
    nft_contract_address VARCHAR(100),
    condicoes JSONB, -- Condições para conquistar: {"tipo": "completar_curso", "quantidade": 1}
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tb_universidade_badges_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    id_badge UUID NOT NULL REFERENCES tb_universidade_badges(id_badge) ON DELETE CASCADE,
    dt_conquista TIMESTAMP NOT NULL DEFAULT now(),
    nft_token_id VARCHAR(100), -- ID do NFT se mintado
    nft_tx_hash VARCHAR(100), -- Hash da transação blockchain
    nft_blockchain_url VARCHAR(500),
    UNIQUE(id_usuario, id_badge)
);

CREATE TABLE tb_universidade_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    saldo_tokens INT DEFAULT 0 CHECK (saldo_tokens >= 0),
    total_ganho INT DEFAULT 0,
    total_gasto INT DEFAULT 0,
    dt_atualizacao TIMESTAMP DEFAULT now()
);

CREATE TABLE tb_universidade_transacoes_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('ganho', 'gasto', 'transfer', 'staking', 'bonus')) NOT NULL,
    quantidade INT NOT NULL,
    motivo VARCHAR(200), -- completar_curso, comprar_mentoria, etc
    referencia_id UUID, -- ID do curso/evento relacionado
    metadados JSONB,
    dt_transacao TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tb_universidade_ranking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo VARCHAR(20) CHECK (periodo IN ('diario', 'semanal', 'mensal', 'anual', 'geral')),
    id_usuario UUID NOT NULL,
    posicao INT NOT NULL,
    pontuacao INT NOT NULL,
    dt_calculo TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(periodo, id_usuario, dt_calculo)
);

-- ============================================
-- CERTIFICAÇÕES
-- ============================================

CREATE TABLE tb_universidade_certificados (
    id_certificado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_verificacao VARCHAR(50) UNIQUE NOT NULL, -- EST-2026-001234
    id_usuario UUID NOT NULL,
    id_curso UUID NOT NULL REFERENCES tb_universidade_cursos(id_curso),
    tipo_certificacao VARCHAR(50) CHECK (tipo_certificacao IN ('bronze', 'prata', 'ouro', 'diamante')),
    dt_emissao TIMESTAMP NOT NULL DEFAULT now(),
    dt_validade TIMESTAMP,
    nota_final DECIMAL(5,2) NOT NULL,
    carga_horaria INT NOT NULL,
    acreditacoes JSONB, -- ["SBCP", "SBME"]
    pdf_url VARCHAR(500),
    fg_nft_habilitado BOOLEAN DEFAULT false,
    nft_token_id VARCHAR(100),
    nft_contract_address VARCHAR(100),
    nft_tx_hash VARCHAR(100),
    nft_blockchain_url VARCHAR(500),
    qr_code_url VARCHAR(500)
);

-- ============================================
-- LIVES E EVENTOS
-- ============================================

CREATE TABLE tb_universidade_eventos (
    id_evento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) CHECK (tipo IN ('webinar', 'workshop', 'congresso', 'imersao', 'masterclass')) NOT NULL,
    dt_inicio TIMESTAMP NOT NULL,
    dt_fim TIMESTAMP NOT NULL,
    duracao_horas INT NOT NULL,
    instrutor_id UUID,
    instrutor_nome VARCHAR(200),
    preco DECIMAL(10,2) DEFAULT 0.00,
    preco_assinante DECIMAL(10,2) DEFAULT 0.00,
    max_participantes INT,
    total_inscritos INT DEFAULT 0,
    stream_url VARCHAR(500),
    replay_url VARCHAR(500),
    fg_chat_habilitado BOOLEAN DEFAULT true,
    fg_metaverso_habilitado BOOLEAN DEFAULT false,
    metaverso_room_id VARCHAR(100),
    certificado_horas INT DEFAULT 0,
    thumbnail_url VARCHAR(500),
    status VARCHAR(50) CHECK (status IN ('agendado', 'ao_vivo', 'finalizado', 'cancelado')) DEFAULT 'agendado',
    tags TEXT[],
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tb_universidade_inscricoes_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    id_evento UUID NOT NULL REFERENCES tb_universidade_eventos(id_evento) ON DELETE CASCADE,
    dt_inscricao TIMESTAMP NOT NULL DEFAULT now(),
    preco_pago DECIMAL(10,2) NOT NULL,
    fg_compareceu BOOLEAN DEFAULT false,
    tempo_assistido_minutos INT DEFAULT 0,
    fg_certificado_emitido BOOLEAN DEFAULT false,
    avaliacao INT CHECK (avaliacao >= 1 AND avaliacao <= 5),
    comentario TEXT,
    UNIQUE(id_usuario, id_evento)
);

-- ============================================
-- MENTORIA
-- ============================================

CREATE TABLE tb_universidade_mentores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    especialidades TEXT[], -- ["injetaveis", "lasers", "gestao"]
    preco_sessao_tokens INT NOT NULL DEFAULT 200,
    disponibilidade JSONB, -- {"segunda": ["09:00-12:00", "14:00-18:00"]}
    total_mentorias INT DEFAULT 0,
    avaliacao_media DECIMAL(3,2) DEFAULT 0.00,
    total_avaliacoes INT DEFAULT 0,
    biografia TEXT,
    certificacoes TEXT[],
    fg_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tb_universidade_sessoes_mentoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mentor UUID NOT NULL REFERENCES tb_universidade_mentores(id) ON DELETE CASCADE,
    id_mentorado UUID NOT NULL,
    dt_hora TIMESTAMP NOT NULL,
    duracao_minutos INT DEFAULT 30,
    status VARCHAR(50) CHECK (status IN ('agendada', 'realizada', 'cancelada', 'falta')) DEFAULT 'agendada',
    room_url VARCHAR(500),
    notas_mentor TEXT,
    avaliacao_mentorado INT CHECK (avaliacao_mentorado >= 1 AND avaliacao_mentorado <= 5),
    comentario_mentorado TEXT,
    tokens_pagos INT NOT NULL,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- METAVERSO
-- ============================================

CREATE TABLE tb_universidade_avatares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    avatar_url VARCHAR(500), -- Ready Player Me GLB
    customizacoes JSONB, -- {"cor_pele": "#FFFFFF", "roupa": "jaleco"}
    tier VARCHAR(50) CHECK (tier IN ('basic', 'premium', 'vip')) DEFAULT 'basic',
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP
);

CREATE TABLE tb_universidade_salas_metaverso (
    id_sala UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('auditorio', 'laboratorio', 'lounge', 'biblioteca')) NOT NULL,
    max_usuarios INT DEFAULT 50,
    usuarios_online INT DEFAULT 0,
    colyseus_room_id VARCHAR(100),
    fg_ativa BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- AVALIAÇÕES
-- ============================================

CREATE TABLE tb_universidade_avaliacoes_cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    id_curso UUID NOT NULL REFERENCES tb_universidade_cursos(id_curso) ON DELETE CASCADE,
    avaliacao INT CHECK (avaliacao >= 1 AND avaliacao <= 5) NOT NULL,
    comentario TEXT,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(id_usuario, id_curso)
);

-- ============================================
-- ANALYTICS
-- ============================================

CREATE TABLE tb_universidade_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID,
    evento VARCHAR(100) NOT NULL, -- aula_iniciada, aula_concluida, quiz_concluido
    categoria VARCHAR(50), -- curso, evento, mentoria
    metadados JSONB,
    dt_evento TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Cursos
CREATE INDEX idx_cursos_categoria ON tb_universidade_cursos(categoria);
CREATE INDEX idx_cursos_nivel ON tb_universidade_cursos(nivel);
CREATE INDEX idx_cursos_ativo ON tb_universidade_cursos(fg_ativo);
CREATE INDEX idx_cursos_instrutor ON tb_universidade_cursos(instrutor_id);
CREATE INDEX idx_modulos_curso ON tb_universidade_modulos(id_curso);
CREATE INDEX idx_aulas_modulo ON tb_universidade_aulas(id_modulo);

-- Progresso
CREATE INDEX idx_inscricoes_usuario ON tb_universidade_inscricoes(id_usuario);
CREATE INDEX idx_inscricoes_curso ON tb_universidade_inscricoes(id_curso);
CREATE INDEX idx_inscricoes_status ON tb_universidade_inscricoes(status);
CREATE INDEX idx_progresso_inscricao ON tb_universidade_progresso_aulas(id_inscricao);
CREATE INDEX idx_progresso_aula ON tb_universidade_progresso_aulas(id_aula);

-- Gamificação
CREATE INDEX idx_xp_usuario ON tb_universidade_xp(id_usuario);
CREATE INDEX idx_badges_usuario ON tb_universidade_badges_usuarios(id_usuario);
CREATE INDEX idx_badges_badge ON tb_universidade_badges_usuarios(id_badge);
CREATE INDEX idx_tokens_usuario ON tb_universidade_tokens(id_usuario);
CREATE INDEX idx_transacoes_usuario ON tb_universidade_transacoes_tokens(id_usuario);
CREATE INDEX idx_ranking_periodo ON tb_universidade_ranking(periodo, posicao);

-- Certificados
CREATE INDEX idx_certificados_usuario ON tb_universidade_certificados(id_usuario);
CREATE INDEX idx_certificados_curso ON tb_universidade_certificados(id_curso);
CREATE INDEX idx_certificados_codigo ON tb_universidade_certificados(codigo_verificacao);

-- Eventos
CREATE INDEX idx_eventos_tipo ON tb_universidade_eventos(tipo);
CREATE INDEX idx_eventos_status ON tb_universidade_eventos(status);
CREATE INDEX idx_eventos_data ON tb_universidade_eventos(dt_inicio);
CREATE INDEX idx_inscricoes_eventos_usuario ON tb_universidade_inscricoes_eventos(id_usuario);

-- Analytics
CREATE INDEX idx_analytics_usuario ON tb_universidade_analytics(id_usuario);
CREATE INDEX idx_analytics_evento ON tb_universidade_analytics(evento);
CREATE INDEX idx_analytics_data ON tb_universidade_analytics(dt_evento);

-- Busca semântica (pgvector)
CREATE INDEX idx_aulas_embeddings ON tb_universidade_aulas USING ivfflat(embeddings vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- DADOS INICIAIS (SEEDS)
-- ============================================

-- Badges iniciais
INSERT INTO tb_universidade_badges (codigo, nome, descricao, icone_url, tipo, raridade, xp_reward, condicoes) VALUES
('primeira_aula', 'Primeira Aula', 'Assistiu sua primeira aula', '/badges/primeira_aula.svg', 'progresso', 'comum', 10, '{"tipo": "aula_completa", "quantidade": 1}'),
('streak_7', 'Streak 7 Dias', 'Estudou 7 dias seguidos', '/badges/streak_7.svg', 'excelencia', 'raro', 100, '{"tipo": "streak_dias", "quantidade": 7}'),
('streak_30', 'Streak 30 Dias', 'Estudou 30 dias seguidos', '/badges/streak_30.svg', 'excelencia', 'epico', 500, '{"tipo": "streak_dias", "quantidade": 30}'),
('primeiro_curso', 'Graduado', 'Completou seu primeiro curso', '/badges/primeiro_curso.svg', 'progresso', 'comum', 100, '{"tipo": "curso_completo", "quantidade": 1}'),
('nota_maxima', 'Nota Máxima', 'Tirou 100% em um quiz', '/badges/nota_maxima.svg', 'excelencia', 'raro', 50, '{"tipo": "quiz_perfeito", "quantidade": 1}'),
('injetaveis_expert', 'Injetáveis Expert', 'Completou todos os cursos de injetáveis', '/badges/injetaveis.svg', 'especializacao', 'lendario', 1000, '{"tipo": "categoria_completa", "categoria": "injetaveis"}'),
('mentor', 'Mentor', 'Ajudou 50+ alunos', '/badges/mentor.svg', 'social', 'epico', 500, '{"tipo": "mentorias", "quantidade": 50}'),
('top_1_porcento', 'Top 1%', 'Ficou no top 1% do ranking mensal', '/badges/top_1.svg', 'excelencia', 'lendario', 2000, '{"tipo": "ranking", "percentil": 1}');

-- Salas do metaverso
INSERT INTO tb_universidade_salas_metaverso (nome, tipo, max_usuarios, fg_ativa) VALUES
('Auditório Principal', 'auditorio', 100, true),
('Laboratório de Práticas', 'laboratorio', 50, true),
('Lounge do Café', 'lounge', 30, true),
('Biblioteca Central', 'biblioteca', 20, true);

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON TABLE tb_universidade_cursos IS 'Catálogo de cursos da Universidade da Beleza';
COMMENT ON TABLE tb_universidade_inscricoes IS 'Inscrições de usuários em cursos';
COMMENT ON TABLE tb_universidade_xp IS 'Sistema de experiência e níveis dos usuários';
COMMENT ON TABLE tb_universidade_badges IS 'Badges/conquistas disponíveis';
COMMENT ON TABLE tb_universidade_certificados IS 'Certificados emitidos (blockchain-ready)';
COMMENT ON TABLE tb_universidade_eventos IS 'Lives, webinars e eventos';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
/**
 * Migration: Add Daily Missions Table
 * Data: 2025-11-13
 * Descrição: Cria tabela de missões diárias para gamificação
 */

-- Criar tabela de missões diárias
CREATE TABLE IF NOT EXISTS tb_universidade_missoes (
    id_user_missao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    tipo_missao VARCHAR(50) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    icone VARCHAR(10) DEFAULT '🎯',
    meta INTEGER NOT NULL,
    progresso_atual INTEGER DEFAULT 0,
    xp_recompensa INTEGER DEFAULT 0,
    tokens_recompensa INTEGER DEFAULT 0,
    fg_concluida BOOLEAN DEFAULT FALSE,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_conclusao TIMESTAMP,
    dt_expiracao TIMESTAMP NOT NULL
);

-- Criar índices
CREATE INDEX idx_missoes_usuario ON tb_universidade_missoes(id_usuario);
CREATE INDEX idx_missoes_data_criacao ON tb_universidade_missoes(dt_criacao);
CREATE INDEX idx_missoes_tipo ON tb_universidade_missoes(tipo_missao);
CREATE INDEX idx_missoes_concluida ON tb_universidade_missoes(fg_concluida);

COMMENT ON TABLE tb_universidade_missoes IS 'Missões diárias dos usuários';
COMMENT ON COLUMN tb_universidade_missoes.tipo_missao IS 'Tipo: assistir_aulas, tempo_estudo, completar_modulo, etc';
COMMENT ON COLUMN tb_universidade_missoes.meta IS 'Valor alvo para completar a missão';
COMMENT ON COLUMN tb_universidade_missoes.progresso_atual IS 'Progresso atual em direção à meta';
/**
 * Migration: Add Notas e Favoritos Tables
 * Data: 2025-11-13
 * Descrição: Cria tabelas para sistema de notas e favoritos
 */

-- Criar tabela de notas
CREATE TABLE IF NOT EXISTS tb_universidade_notas (
    id_nota UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    id_aula UUID NOT NULL REFERENCES tb_universidade_aulas(id_aula) ON DELETE CASCADE,
    tx_conteudo TEXT NOT NULL,
    nr_timestamp_video INTEGER,
    fg_publica BOOLEAN DEFAULT FALSE,
    fg_ativo BOOLEAN DEFAULT TRUE,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP
);

-- Criar índices para notas
CREATE INDEX idx_notas_usuario ON tb_universidade_notas(id_usuario);
CREATE INDEX idx_notas_aula ON tb_universidade_notas(id_aula);
CREATE INDEX idx_notas_timestamp ON tb_universidade_notas(nr_timestamp_video);
CREATE INDEX idx_notas_ativo ON tb_universidade_notas(fg_ativo);
CREATE INDEX idx_notas_criacao ON tb_universidade_notas(dt_criacao);

-- Criar índice de busca textual
CREATE INDEX idx_notas_conteudo_busca ON tb_universidade_notas USING gin(to_tsvector('portuguese', tx_conteudo));

COMMENT ON TABLE tb_universidade_notas IS 'Notas dos usuários em aulas';
COMMENT ON COLUMN tb_universidade_notas.nr_timestamp_video IS 'Segundo do vídeo onde a nota foi criada';
COMMENT ON COLUMN tb_universidade_notas.fg_publica IS 'Se a nota pode ser vista por outros usuários';

-- Criar tabela de favoritos
CREATE TABLE IF NOT EXISTS tb_universidade_favoritos (
    id_favorito UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    tx_tipo VARCHAR(20) NOT NULL CHECK (tx_tipo IN ('curso', 'aula', 'instrutor')),
    id_referencia UUID NOT NULL,
    tx_observacao TEXT,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(id_usuario, tx_tipo, id_referencia)
);

-- Criar índices para favoritos
CREATE INDEX idx_favoritos_usuario ON tb_universidade_favoritos(id_usuario);
CREATE INDEX idx_favoritos_tipo ON tb_universidade_favoritos(tx_tipo);
CREATE INDEX idx_favoritos_referencia ON tb_universidade_favoritos(id_referencia);
CREATE INDEX idx_favoritos_criacao ON tb_universidade_favoritos(dt_criacao);

COMMENT ON TABLE tb_universidade_favoritos IS 'Itens favoritos dos usuários (cursos, aulas, instrutores)';
COMMENT ON COLUMN tb_universidade_favoritos.tx_tipo IS 'Tipo do favorito: curso, aula ou instrutor';
COMMENT ON COLUMN tb_universidade_favoritos.id_referencia IS 'ID do item favoritado';
-- Migration: Criar tabelas de E-books e Podcasts
-- Data: 2025-01-14

-- ============================================
-- TABELA: tb_universidade_ebooks
-- ============================================

CREATE TABLE IF NOT EXISTS tb_universidade_ebooks (
    id_ebook UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    autor VARCHAR(200) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    paginas INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0,
    avaliacao_media DECIMAL(3,2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    formato VARCHAR(20) DEFAULT 'PDF',
    tamanho_mb DECIMAL(5,2),
    idioma VARCHAR(50) DEFAULT 'Português',
    thumbnail_url VARCHAR(500),
    pdf_url VARCHAR(500) NOT NULL,
    preview_url VARCHAR(500),
    isbn VARCHAR(20),
    tags TEXT[],
    fg_gratuito BOOLEAN DEFAULT true,
    preco DECIMAL(10,2) DEFAULT 0.00,
    dt_publicacao TIMESTAMP,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP,
    fg_ativo BOOLEAN DEFAULT true
);

CREATE INDEX idx_ebooks_categoria ON tb_universidade_ebooks(categoria);
CREATE INDEX idx_ebooks_autor ON tb_universidade_ebooks(autor);
CREATE INDEX idx_ebooks_ativo ON tb_universidade_ebooks(fg_ativo);

-- ============================================
-- TABELA: tb_universidade_podcasts
-- ============================================

CREATE TABLE IF NOT EXISTS tb_universidade_podcasts (
    id_podcast UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) NOT NULL,
    episodio INTEGER NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    dt_publicacao TIMESTAMP NOT NULL,
    autor VARCHAR(200) NOT NULL,
    thumbnail_url VARCHAR(500),
    audio_url VARCHAR(500) NOT NULL,
    plays INTEGER DEFAULT 0,
    tags TEXT[],
    transcricao TEXT,
    fg_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP
);

CREATE INDEX idx_podcasts_categoria ON tb_universidade_podcasts(categoria);
CREATE INDEX idx_podcasts_episodio ON tb_universidade_podcasts(episodio);
CREATE INDEX idx_podcasts_ativo ON tb_universidade_podcasts(fg_ativo);
CREATE INDEX idx_podcasts_data ON tb_universidade_podcasts(dt_publicacao);

-- ============================================
-- SEED DATA - E-books
-- ============================================

INSERT INTO tb_universidade_ebooks (titulo, descricao, autor, categoria, paginas, downloads, avaliacao_media, total_avaliacoes, formato, tamanho_mb, idioma, thumbnail_url, pdf_url, preview_url, tags, dt_publicacao)
VALUES
('Guia Completo de Toxina Botulínica',
 'Manual prático com protocolos de aplicação, anatomia facial detalhada e manejo de complicações.',
 'Dra. Ana Costa',
 'injetaveis',
 156,
 2543,
 4.9,
 87,
 'PDF',
 12.5,
 'Português',
 'https://picsum.photos/seed/ebook1/400/600',
 'https://exemplo.com/ebooks/toxina-botulina.pdf',
 'https://exemplo.com/ebooks/toxina-botulina-preview.pdf',
 ARRAY['toxina', 'protocolos', 'anatomia'],
 NOW() - INTERVAL '90 days'),

('Marketing Digital para Clínicas',
 'Estratégias práticas de marketing digital, SEO, Google Ads e conversão de leads para clínicas de estética.',
 'Rafael Oliveira',
 'negocios',
 98,
 1876,
 4.7,
 54,
 'PDF',
 8.2,
 'Português',
 'https://picsum.photos/seed/ebook2/400/600',
 'https://exemplo.com/ebooks/marketing-digital.pdf',
 'https://exemplo.com/ebooks/marketing-digital-preview.pdf',
 ARRAY['marketing', 'vendas', 'digital'],
 NOW() - INTERVAL '60 days'),

('Preenchedores: MD Codes e Harmonização Facial',
 'Técnicas avançadas de MD Codes, pontos de aplicação e protocolos para harmonização facial natural.',
 'Dr. João Silva',
 'injetaveis',
 234,
 3124,
 5.0,
 126,
 'PDF',
 18.7,
 'Português',
 'https://picsum.photos/seed/ebook3/400/600',
 'https://exemplo.com/ebooks/preenchedores-md-codes.pdf',
 'https://exemplo.com/ebooks/preenchedores-md-codes-preview.pdf',
 ARRAY['preenchedores', 'md-codes', 'harmonizacao'],
 NOW() - INTERVAL '45 days'),

('Peelings Químicos: Do Básico ao Avançado',
 'Protocolos completos de peelings superficiais, médios e profundos com indicações e contraindicações.',
 'Dra. Maria Santos',
 'facial',
 187,
 1654,
 4.8,
 72,
 'PDF',
 14.3,
 'Português',
 'https://picsum.photos/seed/ebook4/400/600',
 'https://exemplo.com/ebooks/peelings-quimicos.pdf',
 'https://exemplo.com/ebooks/peelings-quimicos-preview.pdf',
 ARRAY['peelings', 'protocolos', 'facial'],
 NOW() - INTERVAL '30 days'),

('Criolipólise e Tecnologias Corporais',
 'Guia prático de criolipólise, radiofrequência e outras tecnologias para tratamento corporal.',
 'Dr. Carlos Mendes',
 'corporal',
 142,
 2198,
 4.6,
 63,
 'PDF',
 10.8,
 'Português',
 'https://picsum.photos/seed/ebook5/400/600',
 'https://exemplo.com/ebooks/criolipolise.pdf',
 'https://exemplo.com/ebooks/criolipolise-preview.pdf',
 ARRAY['criolipolise', 'corporal', 'tecnologias'],
 NOW() - INTERVAL '20 days'),

('Gestão Financeira de Clínicas de Estética',
 'Como organizar as finanças, precificar procedimentos e aumentar a lucratividade da clínica.',
 'Rafael Oliveira',
 'negocios',
 114,
 987,
 4.5,
 41,
 'PDF',
 6.4,
 'Português',
 'https://picsum.photos/seed/ebook6/400/600',
 'https://exemplo.com/ebooks/gestao-financeira.pdf',
 'https://exemplo.com/ebooks/gestao-financeira-preview.pdf',
 ARRAY['financeiro', 'gestao', 'negocios'],
 NOW() - INTERVAL '15 days'),

('Fotografia Clínica em Estética',
 'Técnicas de fotografia clínica padronizada para documentação de procedimentos estéticos.',
 'Lucas Ferreira',
 'tecnologias',
 76,
 1432,
 4.7,
 38,
 'PDF',
 15.2,
 'Português',
 'https://picsum.photos/seed/ebook7/400/600',
 'https://exemplo.com/ebooks/fotografia-clinica.pdf',
 'https://exemplo.com/ebooks/fotografia-clinica-preview.pdf',
 ARRAY['fotografia', 'documentacao', 'tecnicas'],
 NOW() - INTERVAL '10 days'),

('Anatomia Facial para Injetáveis',
 'Atlas anatômico detalhado com foco em pontos seguros para aplicação de injetáveis.',
 'Dra. Patricia Lima',
 'injetaveis',
 198,
 2876,
 4.9,
 94,
 'PDF',
 22.4,
 'Português',
 'https://picsum.photos/seed/ebook8/400/600',
 'https://exemplo.com/ebooks/anatomia-facial.pdf',
 'https://exemplo.com/ebooks/anatomia-facial-preview.pdf',
 ARRAY['anatomia', 'injetaveis', 'seguranca'],
 NOW() - INTERVAL '5 days');

-- ============================================
-- SEED DATA - Podcasts
-- ============================================

INSERT INTO tb_universidade_podcasts (titulo, descricao, categoria, episodio, duracao_minutos, dt_publicacao, autor, thumbnail_url, audio_url, plays, tags)
VALUES
('Toxina Botulínica: Novos Protocolos 2025',
 'Discussão com especialistas sobre as últimas tendências e protocolos de aplicação de toxina botulínica.',
 'injetaveis',
 12,
 45,
 NOW() - INTERVAL '5 days',
 'Dra. Ana Costa',
 'https://picsum.photos/seed/podcast1/800/450',
 'https://exemplo.com/podcasts/toxina-botulina-ep12.mp3',
 1234,
 ARRAY['toxina', 'protocolos', 'injetaveis']),

('Marketing Digital para Clínicas: Cases de Sucesso',
 'Como aumentar sua base de clientes usando estratégias digitais comprovadas.',
 'negocios',
 11,
 38,
 NOW() - INTERVAL '12 days',
 'Rafael Oliveira',
 'https://picsum.photos/seed/podcast2/800/450',
 'https://exemplo.com/podcasts/marketing-digital-ep11.mp3',
 987,
 ARRAY['marketing', 'digital', 'vendas']),

('Preenchedores: MD Codes Avançado',
 'Técnicas avançadas de MD Codes para harmonização facial natural.',
 'injetaveis',
 10,
 52,
 NOW() - INTERVAL '19 days',
 'Dr. João Silva',
 'https://picsum.photos/seed/podcast3/800/450',
 'https://exemplo.com/podcasts/preenchedores-md-codes-ep10.mp3',
 1543,
 ARRAY['preenchedores', 'md-codes', 'harmonizacao']),

('Peelings Químicos: Protocolos de Segurança',
 'Manejo de complicações e protocolos de segurança em peelings médios e profundos.',
 'facial',
 9,
 41,
 NOW() - INTERVAL '26 days',
 'Dra. Maria Santos',
 'https://picsum.photos/seed/podcast4/800/450',
 'https://exemplo.com/podcasts/peelings-quimicos-ep9.mp3',
 876,
 ARRAY['peelings', 'seguranca', 'protocolos']),

('Lasers em Estética: O que há de novo',
 'Novidades em tecnologia laser para rejuvenescimento e tratamento de manchas.',
 'tecnologias',
 8,
 48,
 NOW() - INTERVAL '33 days',
 'Dr. Carlos Mendes',
 'https://picsum.photos/seed/podcast5/800/450',
 'https://exemplo.com/podcasts/lasers-estetica-ep8.mp3',
 1098,
 ARRAY['laser', 'tecnologia', 'rejuvenescimento']),

('Gestão Financeira para Clínicas de Estética',
 'Como organizar as finanças da sua clínica e aumentar a lucratividade.',
 'negocios',
 7,
 35,
 NOW() - INTERVAL '40 days',
 'Rafael Oliveira',
 'https://picsum.photos/seed/podcast6/800/450',
 'https://exemplo.com/podcasts/gestao-financeira-ep7.mp3',
 654,
 ARRAY['financeiro', 'gestao', 'negocios']);

-- Confirmar criação
SELECT 'E-books criados:' AS info, COUNT(*) FROM tb_universidade_ebooks;
SELECT 'Podcasts criados:' AS info, COUNT(*) FROM tb_universidade_podcasts;
-- =============================================================================
-- Migration 023: Sistema de Pagamentos - Universidade da Beleza
-- =============================================================================
-- Descrição: Cria tabelas para gerenciar pagamentos via MercadoPago
-- Data: 2025-11-14
-- Autor: Claude Code
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabela de Pagamentos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_universidade_pagamentos (
    id_pagamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL, -- Referência externa a tb_users (banco principal)

    -- Tipo de item pago
    tipo_item VARCHAR(50) NOT NULL, -- 'assinatura', 'curso', 'ebook'
    id_item UUID, -- ID do curso, ebook, etc (nullable)

    -- MercadoPago IDs
    mp_payment_id VARCHAR(255), -- ID do pagamento no MP
    mp_preference_id VARCHAR(255), -- ID da preferência

    -- Tipo e método
    tipo_pagamento VARCHAR(50) NOT NULL, -- 'pix', 'card', 'preference'
    metodo_pagamento VARCHAR(50), -- 'visa', 'master', 'pix', etc

    -- Valores
    vl_total DECIMAL(10, 2) NOT NULL,
    vl_taxa DECIMAL(10, 2) DEFAULT 0.00,
    vl_liquido DECIMAL(10, 2),
    moeda VARCHAR(3) DEFAULT 'BRL',

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    status_detalhe TEXT,

    -- Informações do pagador
    email_pagador VARCHAR(255),
    nome_pagador VARCHAR(255),
    cpf_pagador VARCHAR(14),

    -- Descrição
    descricao TEXT,

    -- PIX específico
    qr_code TEXT,
    qr_code_base64 TEXT,
    ticket_url TEXT,

    -- Parcelamento
    parcelas INTEGER DEFAULT 1,

    -- Metadata (JSON)
    metadata JSONB,

    -- Datas
    dt_aprovacao TIMESTAMP,
    dt_expiracao TIMESTAMP,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    fg_ativo BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX idx_pagamentos_usuario ON tb_universidade_pagamentos(id_usuario);
CREATE INDEX idx_pagamentos_mp_payment_id ON tb_universidade_pagamentos(mp_payment_id);
CREATE INDEX idx_pagamentos_tipo_item ON tb_universidade_pagamentos(tipo_item);
CREATE INDEX idx_pagamentos_status ON tb_universidade_pagamentos(status);
CREATE INDEX idx_pagamentos_dt_criacao ON tb_universidade_pagamentos(dt_criacao);

-- -----------------------------------------------------------------------------
-- 2. Tabela de Assinaturas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_universidade_assinaturas (
    id_assinatura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL, -- Referência externa a tb_users (banco principal)
    id_pagamento UUID REFERENCES tb_universidade_pagamentos(id_pagamento) ON DELETE SET NULL,

    -- Tipo de plano
    tipo_plano VARCHAR(50) NOT NULL, -- 'mensal', 'trimestral', 'anual'

    -- Valores
    vl_plano DECIMAL(10, 2) NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'ativa', 'cancelada', 'expirada', 'pendente'

    -- Datas
    dt_inicio TIMESTAMP,
    dt_fim TIMESTAMP,
    dt_cancelamento TIMESTAMP,
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    -- Renovação automática
    fg_renovacao_automatica BOOLEAN DEFAULT FALSE,

    fg_ativo BOOLEAN DEFAULT TRUE
);

-- Índices
CREATE INDEX idx_assinaturas_usuario ON tb_universidade_assinaturas(id_usuario);
CREATE INDEX idx_assinaturas_status ON tb_universidade_assinaturas(status);
CREATE INDEX idx_assinaturas_dt_fim ON tb_universidade_assinaturas(dt_fim);

-- -----------------------------------------------------------------------------
-- 3. Tabela de Matrículas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_universidade_matriculas (
    id_matricula UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL, -- Referência externa a tb_users (banco principal)
    id_curso UUID NOT NULL REFERENCES tb_universidade_cursos(id_curso) ON DELETE CASCADE,
    id_pagamento UUID REFERENCES tb_universidade_pagamentos(id_pagamento) ON DELETE SET NULL,

    -- Progresso
    progresso INTEGER DEFAULT 0, -- 0-100%
    dt_conclusao TIMESTAMP,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ativa', -- 'ativa', 'concluida', 'cancelada'

    -- Acesso
    dt_primeiro_acesso TIMESTAMP,
    dt_ultimo_acesso TIMESTAMP,

    -- Certificado
    fg_certificado_emitido BOOLEAN DEFAULT FALSE,
    dt_certificado TIMESTAMP,

    -- Datas
    dt_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    fg_ativo BOOLEAN DEFAULT TRUE,

    -- Constraint: usuário não pode se matricular 2x no mesmo curso
    CONSTRAINT uk_matricula_usuario_curso UNIQUE (id_usuario, id_curso)
);

-- Índices
CREATE INDEX idx_matriculas_usuario ON tb_universidade_matriculas(id_usuario);
CREATE INDEX idx_matriculas_curso ON tb_universidade_matriculas(id_curso);
CREATE INDEX idx_matriculas_status ON tb_universidade_matriculas(status);
CREATE INDEX idx_matriculas_progresso ON tb_universidade_matriculas(progresso);

-- -----------------------------------------------------------------------------
-- 4. Comentários
-- -----------------------------------------------------------------------------
COMMENT ON TABLE tb_universidade_pagamentos IS 'Pagamentos via MercadoPago (PIX, cartão)';
COMMENT ON TABLE tb_universidade_assinaturas IS 'Assinaturas de planos (Mensal, Trimestral, Anual)';
COMMENT ON TABLE tb_universidade_matriculas IS 'Matrículas em cursos individuais';

COMMENT ON COLUMN tb_universidade_pagamentos.tipo_item IS 'Tipo do item pago: assinatura, curso, ebook';
COMMENT ON COLUMN tb_universidade_pagamentos.mp_payment_id IS 'ID do pagamento no MercadoPago';
COMMENT ON COLUMN tb_universidade_pagamentos.status IS 'Status: pending, approved, rejected, cancelled, refunded';

COMMENT ON COLUMN tb_universidade_assinaturas.tipo_plano IS 'Tipo: mensal (R$47,90), trimestral (R$129,90), anual (R$479,90)';
COMMENT ON COLUMN tb_universidade_assinaturas.status IS 'Status: ativa, cancelada, expirada, pendente';

COMMENT ON COLUMN tb_universidade_matriculas.progresso IS 'Progresso do curso em % (0-100)';
COMMENT ON COLUMN tb_universidade_matriculas.status IS 'Status: ativa, concluida, cancelada';

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================

-- ============================================================================
-- BADGES DE GAMIFICAÇÃO (Dados iniciais)
-- ============================================================================
INSERT INTO tb_universidade_badges (codigo, slug, nome, descricao, tipo, raridade, xp_reward)
VALUES 
    ('primeira_aula', 'primeira-aula', 'Primeira Aula', 'Assistiu sua primeira aula', 'progresso', 'comum', 50),
    ('estudioso', 'estudioso', 'Estudioso', 'Completou 10 aulas', 'progresso', 'raro', 100),
    ('maratonista', 'maratonista', 'Maratonista', 'Completou 50 aulas', 'progresso', 'epico', 250),
    ('primeiro_curso', 'primeiro-curso-completo', 'Primeiro Curso', 'Completou seu primeiro curso', 'excelencia', 'raro', 200),
    ('especialista', 'especialista', 'Especialista', 'Completou 5 cursos', 'excelencia', 'epico', 500),
    ('mestre', 'mestre', 'Mestre', 'Completou 10 cursos', 'excelencia', 'lendario', 1000)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- SEED: Cursos de Exemplo
-- Universidade da Beleza
-- ============================================

-- Curso 1: Toxina Botulínica Avançada
INSERT INTO tb_universidade_cursos (
    titulo, slug, descricao, nivel, categoria,
    duracao_horas, preco, preco_assinante,
    instrutor_nome, certificacao_tipo,
    fg_ativo, tags
) VALUES (
    'Toxina Botulínica Avançada',
    'toxina-botulinica-avancada',
    'Curso completo sobre aplicação de toxina botulínica para rejuvenescimento facial. Técnicas avançadas, anatomia detalhada e protocolos de segurança.',
    'avancado',
    'injetaveis',
    20,
    997.00,
    697.00,
    'Dra. Ana Costa',
    'prata',
    true,
    ARRAY['toxina', 'injetaveis', 'facial', 'avancado']
);

-- Curso 2: Preenchedores Faciais
INSERT INTO tb_universidade_cursos (
    titulo, slug, descricao, nivel, categoria,
    duracao_horas, preco, preco_assinante,
    instrutor_nome, certificacao_tipo,
    fg_ativo, tags
) VALUES (
    'Preenchedores Faciais',
    'preenchedores-faciais',
    'Domine as técnicas de preenchimento facial com ácido hialurônico. MD Codes, 8-Point Lift e harmonização natural.',
    'intermediario',
    'injetaveis',
    30,
    1497.00,
    997.00,
    'Dr. João Silva',
    'ouro',
    true,
    ARRAY['preenchedores', 'injetaveis', 'harmonizacao']
);

-- Curso 3: Peelings Químicos
INSERT INTO tb_universidade_cursos (
    titulo, slug, descricao, nivel, categoria,
    duracao_horas, preco, preco_assinante,
    instrutor_nome, certificacao_tipo,
    fg_ativo, tags
) VALUES (
    'Peelings Químicos Avançados',
    'peelings-quimicos-avancados',
    'Protocolos completos de peelings químicos superficiais, médios e profundos. Indicações, contraindicações e manejo de complicações.',
    'intermediario',
    'facial',
    15,
    797.00,
    597.00,
    'Dra. Maria Santos',
    'prata',
    true,
    ARRAY['peelings', 'facial', 'rejuvenescimento']
);

-- Curso 4: Marketing para Clínicas
INSERT INTO tb_universidade_cursos (
    titulo, slug, descricao, nivel, categoria,
    duracao_horas, preco, preco_assinante,
    instrutor_nome, certificacao_tipo,
    fg_ativo, tags
) VALUES (
    'Marketing Digital para Clínicas de Estética',
    'marketing-digital-clinicas',
    'Estratégias de marketing digital específicas para clínicas de estética. Instagram, Google Ads, SEO e conversão de leads.',
    'iniciante',
    'negocios',
    8,
    497.00,
    347.00,
    'Rafael Oliveira',
    'bronze',
    true,
    ARRAY['marketing', 'negocios', 'vendas', 'digital']
);

-- Curso 5: Criolipólise Avançada
INSERT INTO tb_universidade_cursos (
    titulo, slug, descricao, nivel, categoria,
    duracao_horas, preco, preco_assinante,
    instrutor_nome, certificacao_tipo,
    fg_ativo, tags
) VALUES (
    'Criolipólise Avançada',
    'criolipolise-avancada',
    'Técnicas avançadas de criolipólise para redução de gordura localizada. Protocolos, parâmetros e combinações com outros tratamentos.',
    'avancado',
    'corporal',
    12,
    697.00,
    497.00,
    'Dr. Carlos Mendes',
    'prata',
    true,
    ARRAY['criolipolise', 'corporal', 'emagrecimento']
);

-- Módulos para Curso 1 (Toxina Botulínica)
DO $$
DECLARE
    curso_id UUID;
    modulo1_id UUID;
    modulo2_id UUID;
    modulo3_id UUID;
BEGIN
    -- Busca ID do curso
    SELECT id_curso INTO curso_id FROM tb_universidade_cursos WHERE slug = 'toxina-botulinica-avancada';

    -- Módulo 1: Fundamentos
    INSERT INTO tb_universidade_modulos (id_curso, ordem, titulo, descricao, duracao_minutos, fg_obrigatorio)
    VALUES (curso_id, 1, 'Fundamentos da Toxina Botulínica', 'Histórico, mecanismo de ação e farmacologia', 240, true)
    RETURNING id_modulo INTO modulo1_id;

    -- Aulas do Módulo 1
    INSERT INTO tb_universidade_aulas (id_modulo, ordem, titulo, tipo, duracao_minutos, fg_preview)
    VALUES
        (modulo1_id, 1, 'Introdução à Toxina Botulínica', 'video', 30, true),
        (modulo1_id, 2, 'Mecanismo de Ação', 'video', 45, false),
        (modulo1_id, 3, 'Anatomia Facial Aplicada', 'video', 60, false),
        (modulo1_id, 4, 'Quiz: Fundamentos', 'quiz', 15, false);

    -- Módulo 2: Técnicas Básicas
    INSERT INTO tb_universidade_modulos (id_curso, ordem, titulo, descricao, duracao_minutos, fg_obrigatorio)
    VALUES (curso_id, 2, 'Técnicas de Aplicação', 'Protocolos de aplicação nas principais áreas faciais', 360, true)
    RETURNING id_modulo INTO modulo2_id;

    -- Aulas do Módulo 2
    INSERT INTO tb_universidade_aulas (id_modulo, ordem, titulo, tipo, duracao_minutos)
    VALUES
        (modulo2_id, 1, 'Aplicação na Glabela', 'video', 40),
        (modulo2_id, 2, 'Aplicação na Testa', 'video', 35),
        (modulo2_id, 3, 'Aplicação Periorbital', 'video', 45),
        (modulo2_id, 4, 'Simulador AR: Prática Glabela', 'simulador_ar', 60),
        (modulo2_id, 5, 'Quiz: Técnicas', 'quiz', 20);

    -- Módulo 3: Técnicas Avançadas
    INSERT INTO tb_universidade_modulos (id_curso, ordem, titulo, descricao, duracao_minutos, fg_obrigatorio)
    VALUES (curso_id, 3, 'Técnicas Avançadas e Complicações', 'Técnicas avançadas, correção de assimetrias e manejo de complicações', 300, true)
    RETURNING id_modulo INTO modulo3_id;

    -- Aulas do Módulo 3
    INSERT INTO tb_universidade_aulas (id_modulo, ordem, titulo, tipo, duracao_minutos)
    VALUES
        (modulo3_id, 1, 'Correção de Assimetrias', 'video', 50),
        (modulo3_id, 2, 'Técnicas Avançadas: Baby Botox', 'video', 40),
        (modulo3_id, 3, 'Manejo de Complicações', 'video', 60),
        (modulo3_id, 4, 'Casos Clínicos Complexos', 'video', 70),
        (modulo3_id, 5, 'Prova Final', 'quiz', 40);

END $$;

-- Atualizar total de inscrições (simulando popularidade)
UPDATE tb_universidade_cursos SET total_inscricoes = 245 WHERE slug = 'toxina-botulinica-avancada';
UPDATE tb_universidade_cursos SET total_inscricoes = 189 WHERE slug = 'preenchedores-faciais';
UPDATE tb_universidade_cursos SET total_inscricoes = 156 WHERE slug = 'peelings-quimicos-avancados';
UPDATE tb_universidade_cursos SET total_inscricoes = 98 WHERE slug = 'marketing-digital-clinicas';
UPDATE tb_universidade_cursos SET total_inscricoes = 134 WHERE slug = 'criolipolise-avancada';

-- Atualizar avaliações (simulando reviews)
UPDATE tb_universidade_cursos SET avaliacao_media = 4.8, total_avaliacoes = 87 WHERE slug = 'toxina-botulinica-avancada';
UPDATE tb_universidade_cursos SET avaliacao_media = 4.9, total_avaliacoes = 62 WHERE slug = 'preenchedores-faciais';
UPDATE tb_universidade_cursos SET avaliacao_media = 4.6, total_avaliacoes = 45 WHERE slug = 'peelings-quimicos-avancados';
UPDATE tb_universidade_cursos SET avaliacao_media = 4.5, total_avaliacoes = 32 WHERE slug = 'marketing-digital-clinicas';
UPDATE tb_universidade_cursos SET avaliacao_media = 4.7, total_avaliacoes = 51 WHERE slug = 'criolipolise-avancada';

-- ============================================
-- RESULTADO
-- ============================================
-- 5 cursos criados
-- 3 módulos no curso de Toxina (12 aulas no total)
-- Dados de popularidade e avaliações
-- ============================================

SELECT
    titulo,
    nivel,
    categoria,
    duracao_horas,
    preco,
    total_inscricoes,
    avaliacao_media
FROM tb_universidade_cursos
ORDER BY total_inscricoes DESC;
-- Migration: Seed de Eventos
-- Data: 2025-01-14
-- Descrição: Adiciona eventos de exemplo (webinars, workshops, congressos, imersões)

-- Inserir eventos de exemplo
INSERT INTO tb_universidade_eventos (
    id_evento,
    titulo,
    descricao,
    tipo,
    dt_inicio,
    dt_fim,
    duracao_horas,
    instrutor_nome,
    preco,
    preco_assinante,
    max_participantes,
    total_inscritos,
    stream_url,
    replay_url,
    fg_chat_habilitado,
    fg_metaverso_habilitado,
    metaverso_room_id,
    certificado_horas,
    thumbnail_url,
    status,
    tags,
    dt_criacao
) VALUES
-- Webinar 1 (Ao vivo em breve)
(
    gen_random_uuid(),
    'Toxina Botulínica: Novos Protocolos 2025',
    'Webinar ao vivo com demonstração prática dos novos protocolos de aplicação de toxina botulínica aprovados pela ANVISA. Discussão de casos clínicos e manejo de complicações.',
    'webinar',
    '2025-01-20 19:00:00',
    '2025-01-20 21:00:00',
    2,
    'Dra. Ana Costa',
    49.90,
    0.00,
    500,
    234,
    'https://meet.doctorq.app/webinar-toxina-2025',
    NULL,
    true,
    false,
    NULL,
    2,
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    'agendado',
    ARRAY['toxina', 'injetaveis', 'protocolos', 'anvisa'],
    now()
),

-- Workshop 1 (Agendado)
(
    gen_random_uuid(),
    'Workshop Prático: MD Codes Avançado',
    'Workshop intensivo de 2 dias com prática em modelos anatômicos. Aprenda as técnicas avançadas de MD Codes para harmonização facial natural. Inclui kit de materiais.',
    'workshop',
    '2025-02-15 09:00:00',
    '2025-02-16 18:00:00',
    16,
    'Dr. João Silva',
    1990.00,
    1490.00,
    30,
    18,
    NULL,
    NULL,
    false,
    false,
    NULL,
    16,
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    'agendado',
    ARRAY['preenchedores', 'md-codes', 'harmonizacao', 'pratica'],
    now()
),

-- Masterclass 1 (Finalizada - Replay disponível)
(
    gen_random_uuid(),
    'Masterclass: Marketing Digital para Clínicas de Estética',
    'Estratégias comprovadas de marketing digital para aumentar sua base de clientes. Análise de cases de sucesso e ferramentas práticas para implementar hoje.',
    'masterclass',
    '2025-01-10 20:00:00',
    '2025-01-10 22:00:00',
    2,
    'Rafael Oliveira',
    0.00,
    0.00,
    NULL,
    872,
    NULL,
    'https://youtube.com/watch?v=exemplo-marketing-digital',
    false,
    false,
    NULL,
    0,
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    'finalizado',
    ARRAY['marketing', 'digital', 'vendas', 'estrategia'],
    now()
),

-- Congresso (Agendado)
(
    gen_random_uuid(),
    'Congresso Internacional de Estética Avançada 2025',
    'Maior evento de estética do Brasil! 3 dias com mais de 50 palestrantes nacionais e internacionais. Networking, feira de tecnologias e certificação internacional.',
    'congresso',
    '2025-06-10 08:00:00',
    '2025-06-12 20:00:00',
    30,
    'Comitê Científico DoctorQ',
    2990.00,
    1990.00,
    1000,
    456,
    'https://meet.doctorq.app/congresso-2025',
    NULL,
    true,
    true,
    'doctorq-congress-2025',
    30,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    'agendado',
    ARRAY['congresso', 'internacional', 'networking', 'certificacao'],
    now()
),

-- Imersão 1 (Agendado)
(
    gen_random_uuid(),
    'Imersão: Peelings Químicos - Do Básico ao Avançado',
    'Imersão completa de 1 semana sobre peelings químicos. Teoria, prática supervisionada em pacientes reais, protocolos de segurança e manejo de complicações. Vagas limitadas.',
    'imersao',
    '2025-03-03 08:00:00',
    '2025-03-07 18:00:00',
    40,
    'Dra. Maria Santos',
    4990.00,
    3990.00,
    15,
    12,
    NULL,
    NULL,
    false,
    false,
    NULL,
    40,
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800',
    'agendado',
    ARRAY['peelings', 'quimicos', 'pratica', 'imersao'],
    now()
),

-- Webinar 2 (Finalizado - Replay)
(
    gen_random_uuid(),
    'Webinar: Lasers em Estética - Tecnologias 2025',
    'Novidades em tecnologia laser para rejuvenescimento, tratamento de manchas e cicatrizes. Comparativo entre diferentes plataformas e análise de custo-benefício.',
    'webinar',
    '2025-01-05 19:00:00',
    '2025-01-05 21:00:00',
    2,
    'Dr. Carlos Mendes',
    39.90,
    0.00,
    500,
    412,
    NULL,
    'https://youtube.com/watch?v=exemplo-lasers-2025',
    false,
    false,
    NULL,
    2,
    'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800',
    'finalizado',
    ARRAY['laser', 'tecnologia', 'rejuvenescimento', 'equipamentos'],
    now()
),

-- Workshop 2 (Agendado)
(
    gen_random_uuid(),
    'Workshop: Gestão Financeira para Clínicas',
    'Workshop de 1 dia sobre gestão financeira específica para clínicas de estética. Fluxo de caixa, precificação, indicadores de performance e planejamento tributário.',
    'workshop',
    '2025-02-28 09:00:00',
    '2025-02-28 17:00:00',
    8,
    'Rafael Oliveira',
    490.00,
    290.00,
    50,
    32,
    NULL,
    NULL,
    false,
    false,
    NULL,
    8,
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    'agendado',
    ARRAY['financeiro', 'gestao', 'negocios', 'planejamento'],
    now()
),

-- Masterclass 2 (Agendado)
(
    gen_random_uuid(),
    'Masterclass: Fios de PDO - Técnicas e Indicações',
    'Masterclass gratuita sobre fios de PDO. Anatomia aplicada, técnicas de aplicação, indicações e contraindicações. Tire suas dúvidas ao vivo com especialista.',
    'masterclass',
    '2025-01-25 20:00:00',
    '2025-01-25 21:30:00',
    1,
    'Dra. Paula Ribeiro',
    0.00,
    0.00,
    NULL,
    89,
    'https://meet.doctorq.app/live-fios-pdo',
    NULL,
    true,
    false,
    NULL,
    0,
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800',
    'agendado',
    ARRAY['fios', 'pdo', 'lifting', 'tecnicas'],
    now()
);

-- Verificação
SELECT
    COUNT(*) as total_eventos,
    COUNT(*) FILTER (WHERE status = 'agendado') as agendados,
    COUNT(*) FILTER (WHERE status = 'realizado') as realizados,
    COUNT(*) FILTER (WHERE tipo = 'webinar') as webinars,
    COUNT(*) FILTER (WHERE tipo = 'workshop') as workshops,
    COUNT(*) FILTER (WHERE tipo = 'live') as lives,
    COUNT(*) FILTER (WHERE tipo = 'congresso') as congressos,
    COUNT(*) FILTER (WHERE tipo = 'imersao') as imersoes
FROM tb_universidade_eventos;
-- ============================================
-- SEED: Dados Completos da Universidade
-- Popula usuários, inscrições, progresso, avaliações
-- ============================================

-- ====================
-- 1. USUÁRIOS DE EXEMPLO
-- ====================
-- Nota: Assumindo que usuários vêm de tb_users do DoctorQ principal
-- Vamos criar registros de XP e Tokens para usuários fictícios

DO $$
DECLARE
    -- IDs de usuários fictícios (substituir por UUIDs reais quando integrado)
    usuario1_id UUID := 'a1b2c3d4-e5f6-4890-a234-567890abcdef';
    usuario2_id UUID := 'b2c3d4e5-f6a7-4901-a345-678901bcdef0';
    usuario3_id UUID := 'c3d4e5f6-a7b8-4012-a456-789012cdef01';
    usuario4_id UUID := 'd4e5f6a7-b8c9-4123-a567-890123def012';
    usuario5_id UUID := 'e5f6a7b8-c9d0-4234-a678-901234ef0123';

    -- IDs dos cursos
    curso_toxina_id UUID;
    curso_preench_id UUID;
    curso_peelings_id UUID;
    curso_marketing_id UUID;
    curso_crio_id UUID;

    -- IDs de módulos e aulas
    modulo1_toxina_id UUID;
    modulo2_toxina_id UUID;
    modulo3_toxina_id UUID;

    inscricao1_id UUID;
    inscricao2_id UUID;
    inscricao3_id UUID;
    inscricao4_id UUID;
    inscricao5_id UUID;

BEGIN
    RAISE NOTICE '🎓 Iniciando seed de dados completos...';

    -- Buscar IDs dos cursos
    SELECT id_curso INTO curso_toxina_id FROM tb_universidade_cursos WHERE slug = 'toxina-botulinica-avancada';
    SELECT id_curso INTO curso_preench_id FROM tb_universidade_cursos WHERE slug = 'preenchedores-faciais';
    SELECT id_curso INTO curso_peelings_id FROM tb_universidade_cursos WHERE slug = 'peelings-quimicos-avancados';
    SELECT id_curso INTO curso_marketing_id FROM tb_universidade_cursos WHERE slug = 'marketing-digital-clinicas';
    SELECT id_curso INTO curso_crio_id FROM tb_universidade_cursos WHERE slug = 'criolipolise-avancada';

    -- Buscar módulos do curso de Toxina
    SELECT id_modulo INTO modulo1_toxina_id FROM tb_universidade_modulos
    WHERE id_curso = curso_toxina_id AND ordem = 1;

    SELECT id_modulo INTO modulo2_toxina_id FROM tb_universidade_modulos
    WHERE id_curso = curso_toxina_id AND ordem = 2;

    SELECT id_modulo INTO modulo3_toxina_id FROM tb_universidade_modulos
    WHERE id_curso = curso_toxina_id AND ordem = 3;

    -- ====================
    -- 2. XP E TOKENS DOS USUÁRIOS
    -- ====================
    RAISE NOTICE '💎 Criando XP e Tokens dos usuários...';

    -- Usuário 1: Avançado (Nível 8)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario1_id, 8500, 8, 9000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 8500, nivel = 8, xp_proximo_nivel = 9000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario1_id, 350)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 350;

    -- Usuário 2: Intermediário (Nível 5)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario2_id, 4200, 5, 5000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 4200, nivel = 5, xp_proximo_nivel = 5000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario2_id, 180)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 180;

    -- Usuário 3: Iniciante (Nível 2)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario3_id, 1800, 2, 2000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 1800, nivel = 2, xp_proximo_nivel = 2000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario3_id, 75)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 75;

    -- Usuário 4: Intermediário (Nível 4)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario4_id, 3100, 4, 4000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 3100, nivel = 4, xp_proximo_nivel = 4000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario4_id, 120)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 120;

    -- Usuário 5: Avançado (Nível 6)
    INSERT INTO tb_universidade_xp (id_usuario, total_xp, nivel, xp_proximo_nivel)
    VALUES (usuario5_id, 5600, 6, 6000)
    ON CONFLICT (id_usuario) DO UPDATE
    SET total_xp = 5600, nivel = 6, xp_proximo_nivel = 6000;

    INSERT INTO tb_universidade_tokens (id_usuario, saldo_tokens)
    VALUES (usuario5_id, 210)
    ON CONFLICT (id_usuario) DO UPDATE SET saldo_tokens = 210;

    -- ====================
    -- 3. INSCRIÇÕES EM CURSOS
    -- ====================
    RAISE NOTICE '📚 Criando inscrições em cursos...';

    -- Usuário 1: Inscrito em Toxina (80% completo) e Preenchedores (concluído)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario1_id, curso_toxina_id, 80, 'em_andamento', 720, NOW() - INTERVAL '15 days'),
        (usuario1_id, curso_preench_id, 100, 'concluido', 1800, NOW() - INTERVAL '45 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao1_id;

    -- Usuário 2: Inscrito em Marketing (60% completo)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario2_id, curso_marketing_id, 60, 'em_andamento', 290, NOW() - INTERVAL '8 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao2_id;

    -- Usuário 3: Inscrito em Peelings (25% completo)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario3_id, curso_peelings_id, 25, 'em_andamento', 180, NOW() - INTERVAL '5 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao3_id;

    -- Usuário 4: Inscrito em Toxina (40% completo) e Criolipólise (100% concluído)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario4_id, curso_toxina_id, 40, 'em_andamento', 480, NOW() - INTERVAL '12 days'),
        (usuario4_id, curso_crio_id, 100, 'concluido', 720, NOW() - INTERVAL '30 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao4_id;

    -- Usuário 5: Inscrito em Preenchedores (90% completo)
    INSERT INTO tb_universidade_inscricoes
        (id_usuario, id_curso, progresso_percentual, status, tempo_total_estudo_minutos, dt_inscricao)
    VALUES
        (usuario5_id, curso_preench_id, 90, 'em_andamento', 1620, NOW() - INTERVAL '20 days')
    ON CONFLICT (id_usuario, id_curso) DO UPDATE
    SET progresso_percentual = EXCLUDED.progresso_percentual,
        status = EXCLUDED.status,
        tempo_total_estudo_minutos = EXCLUDED.tempo_total_estudo_minutos
    RETURNING id_inscricao INTO inscricao5_id;

    -- ====================
    -- 4. PROGRESSO DE AULAS (Usuário 1 - Toxina 80%)
    -- ====================
    RAISE NOTICE '📖 Criando progresso de aulas...';

    -- Buscar ID da inscrição do Usuário 1 no curso de Toxina
    SELECT id_inscricao INTO inscricao1_id
    FROM tb_universidade_inscricoes
    WHERE id_usuario = usuario1_id AND id_curso = curso_toxina_id;

    -- Marcar aulas do Módulo 1 como concluídas (4 aulas)
    INSERT INTO tb_universidade_progresso_aulas
        (id_inscricao, id_aula, concluida, fg_assistido, tempo_assistido_segundos, ultima_posicao_segundos, dt_inicio, dt_conclusao)
    SELECT
        inscricao1_id,
        id_aula,
        true,
        true,
        duracao_minutos * 60,
        duracao_minutos * 60,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '14 days'
    FROM tb_universidade_aulas
    WHERE id_modulo = modulo1_toxina_id
    ON CONFLICT (id_inscricao, id_aula) DO UPDATE
    SET concluida = true, fg_assistido = true;

    -- Marcar 4 aulas do Módulo 2 como concluídas (de 5)
    INSERT INTO tb_universidade_progresso_aulas
        (id_inscricao, id_aula, concluida, fg_assistido, tempo_assistido_segundos, ultima_posicao_segundos, dt_inicio, dt_conclusao)
    SELECT
        inscricao1_id,
        id_aula,
        true,
        true,
        duracao_minutos * 60,
        duracao_minutos * 60,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '8 days'
    FROM tb_universidade_aulas
    WHERE id_modulo = modulo2_toxina_id
    ORDER BY ordem
    LIMIT 4
    ON CONFLICT (id_inscricao, id_aula) DO UPDATE
    SET concluida = true, fg_assistido = true;

    -- Marcar 3 aulas do Módulo 3 como concluídas (de 5) - total: 11/14 = ~80%
    INSERT INTO tb_universidade_progresso_aulas
        (id_inscricao, id_aula, concluida, fg_assistido, tempo_assistido_segundos, ultima_posicao_segundos, dt_inicio, dt_conclusao)
    SELECT
        inscricao1_id,
        id_aula,
        true,
        true,
        duracao_minutos * 60,
        duracao_minutos * 60,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '2 days'
    FROM tb_universidade_aulas
    WHERE id_modulo = modulo3_toxina_id
    ORDER BY ordem
    LIMIT 3
    ON CONFLICT (id_inscricao, id_aula) DO UPDATE
    SET concluida = true, fg_assistido = true;

    -- ====================
    -- 5. AVALIAÇÕES DE CURSOS REAIS
    -- ====================
    RAISE NOTICE '⭐ Criando avaliações de cursos...';

    -- Limpar avaliações fake (se houver)
    DELETE FROM tb_universidade_avaliacoes_cursos;

    -- Usuário 1 avalia Preenchedores (concluído)
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario1_id, curso_preench_id, 5, 'Curso excepcional! O instrutor domina o assunto e as técnicas são muito bem explicadas. Já estou aplicando no consultório.', NOW() - INTERVAL '40 days'),
        (usuario1_id, curso_toxina_id, 5, 'Estou adorando o curso! Ainda não terminei mas já aprendi muito. A parte de anatomia é excelente.', NOW() - INTERVAL '3 days');

    -- Usuário 2 avalia Marketing
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario2_id, curso_marketing_id, 4, 'Curso muito bom para quem está começando com marketing digital. Estratégias práticas e diretas ao ponto.', NOW() - INTERVAL '2 days');

    -- Usuário 3 avalia Peelings
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario3_id, curso_peelings_id, 5, 'Aulas muito didáticas! A Dra. Maria explica de forma clara e segura. Recomendo muito!', NOW() - INTERVAL '1 day');

    -- Usuário 4 avalia Criolipólise (concluído)
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario4_id, curso_crio_id, 5, 'Curso completo e atualizado. Os protocolos são muito bem detalhados. Já comprei o aparelho e estou tendo ótimos resultados!', NOW() - INTERVAL '25 days'),
        (usuario4_id, curso_toxina_id, 4, 'Bom curso, mas achei que poderia ter mais casos práticos. Mesmo assim, muito conteúdo de qualidade.', NOW() - INTERVAL '5 days');

    -- Usuário 5 avalia Preenchedores
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (usuario5_id, curso_preench_id, 5, 'Melhor curso de preenchedores que já fiz! O Dr. João é referência na área. Vale cada centavo.', NOW() - INTERVAL '1 day');

    -- Adicionar mais 10 avaliações genéricas para aumentar o total
    INSERT INTO tb_universidade_avaliacoes_cursos
        (id_usuario, id_curso, nota, comentario, dt_criacao)
    VALUES
        (gen_random_uuid(), curso_toxina_id, 5, 'Excelente curso! Superou minhas expectativas.', NOW() - INTERVAL '60 days'),
        (gen_random_uuid(), curso_toxina_id, 4, 'Muito bom, só poderia ter mais vídeos práticos.', NOW() - INTERVAL '55 days'),
        (gen_random_uuid(), curso_preench_id, 5, 'Maravilhoso! Aprendi técnicas que não conhecia.', NOW() - INTERVAL '50 days'),
        (gen_random_uuid(), curso_preench_id, 5, 'Top demais! Instrutor nota 10.', NOW() - INTERVAL '48 days'),
        (gen_random_uuid(), curso_peelings_id, 4, 'Curso completo e muito didático.', NOW() - INTERVAL '42 days'),
        (gen_random_uuid(), curso_peelings_id, 5, 'Recomendo para todos da área!', NOW() - INTERVAL '38 days'),
        (gen_random_uuid(), curso_marketing_id, 4, 'Bom para iniciantes, direto ao ponto.', NOW() - INTERVAL '35 days'),
        (gen_random_uuid(), curso_marketing_id, 5, 'Já aumentei minha clientela em 30%!', NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), curso_crio_id, 5, 'Curso essencial para quem quer trabalhar com criolipólise.', NOW() - INTERVAL '28 days'),
        (gen_random_uuid(), curso_crio_id, 4, 'Muito conteúdo bom, vale o investimento.', NOW() - INTERVAL '22 days');

    -- Atualizar média de avaliações dos cursos (calcular real)
    UPDATE tb_universidade_cursos c
    SET
        avaliacao_media = (
            SELECT ROUND(AVG(nota)::numeric, 2)
            FROM tb_universidade_avaliacoes_cursos
            WHERE id_curso = c.id_curso
        ),
        total_avaliacoes = (
            SELECT COUNT(*)
            FROM tb_universidade_avaliacoes_cursos
            WHERE id_curso = c.id_curso
        );

    -- ====================
    -- 6. BADGES CONQUISTADOS
    -- ====================
    RAISE NOTICE '🏆 Atribuindo badges...';

    -- Usuário 1 (avançado): badges de primeira aula, primeiro curso, badge de 5 cursos
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario1_id,
        id_badge,
        NOW() - INTERVAL '45 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'primeiro-curso-completo', 'maratonista')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 2 (intermediário): primeira aula, 10 aulas
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario2_id,
        id_badge,
        NOW() - INTERVAL '8 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'estudioso')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 3 (iniciante): primeira aula
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario3_id,
        id_badge,
        NOW() - INTERVAL '5 days'
    FROM tb_universidade_badges
    WHERE slug = 'primeira-aula'
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 4 (intermediário): primeira aula, primeiro curso
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario4_id,
        id_badge,
        NOW() - INTERVAL '30 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'primeiro-curso-completo')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    -- Usuário 5 (avançado): primeira aula, estudioso
    INSERT INTO tb_universidade_badges_usuarios (id_usuario, id_badge, dt_conquista)
    SELECT
        usuario5_id,
        id_badge,
        NOW() - INTERVAL '20 days'
    FROM tb_universidade_badges
    WHERE slug IN ('primeira-aula', 'estudioso')
    ON CONFLICT (id_usuario, id_badge) DO NOTHING;

    RAISE NOTICE '✅ Seed concluído com sucesso!';
    RAISE NOTICE '   - 5 usuários com XP e Tokens';
    RAISE NOTICE '   - 7 inscrições em cursos';
    RAISE NOTICE '   - ~11 aulas assistidas (usuário 1)';
    RAISE NOTICE '   - 17 avaliações reais de cursos';
    RAISE NOTICE '   - Badges distribuídos';

END $$;

-- ====================
-- 7. VERIFICAÇÃO FINAL
-- ====================
SELECT
    'Resumo do Seed' as info,
    (SELECT COUNT(*) FROM tb_universidade_xp) as usuarios_com_xp,
    (SELECT COUNT(*) FROM tb_universidade_inscricoes) as inscricoes,
    (SELECT COUNT(*) FROM tb_universidade_progresso_aulas) as aulas_assistidas,
    (SELECT COUNT(*) FROM tb_universidade_avaliacoes_cursos) as avaliacoes,
    (SELECT COUNT(*) FROM tb_universidade_badges_usuarios) as badges_conquistados;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
SELECT '=== RESUMO DA INSTALAÇÃO ===' as info;
SELECT 'Tabelas criadas: ' || COUNT(*) as resultado FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT 'Cursos: ' || COUNT(*) as resultado FROM tb_universidade_cursos;
SELECT 'Módulos: ' || COUNT(*) as resultado FROM tb_universidade_modulos;
SELECT 'Aulas: ' || COUNT(*) as resultado FROM tb_universidade_aulas;
SELECT 'Badges: ' || COUNT(*) as resultado FROM tb_universidade_badges;
SELECT 'Eventos: ' || COUNT(*) as resultado FROM tb_universidade_eventos;
SELECT '=== INSTALAÇÃO CONCLUÍDA ===' as info;
