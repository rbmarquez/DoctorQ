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
