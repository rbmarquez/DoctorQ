-- Migration: Sistema de Avaliações Verificadas
-- Created: 2025-10-23
-- Description: Adiciona campos para tornar as avaliações verificadas com QR Code, fotos e badges

-- ============================================
-- 1. Adicionar novos campos à tb_avaliacoes
-- ============================================

-- Token de verificação para QR Code
ALTER TABLE tb_avaliacoes
ADD COLUMN IF NOT EXISTS tk_verificacao VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS dt_verificacao TIMESTAMP,
ADD COLUMN IF NOT EXISTS st_verificada BOOLEAN DEFAULT FALSE;

-- Fotos da avaliação (antes/depois, resultados)
ALTER TABLE tb_avaliacoes
ADD COLUMN IF NOT EXISTS ds_fotos TEXT[] DEFAULT '{}';

-- Sistema de likes/útil
ALTER TABLE tb_avaliacoes
ADD COLUMN IF NOT EXISTS nr_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nr_nao_util INTEGER DEFAULT 0;

-- Badge do avaliador (verificado, premium, top rated)
ALTER TABLE tb_avaliacoes
ADD COLUMN IF NOT EXISTS ds_badge VARCHAR(50);

-- Procedimento avaliado (caso seja avaliação de procedimento específico)
ALTER TABLE tb_avaliacoes
ADD COLUMN IF NOT EXISTS id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE SET NULL;

-- IP do avaliador (anti-fraude)
ALTER TABLE tb_avaliacoes
ADD COLUMN IF NOT EXISTS ds_ip_origem VARCHAR(45);

-- Device info (anti-fraude)
ALTER TABLE tb_avaliacoes
ADD COLUMN IF NOT EXISTS ds_user_agent TEXT;

-- ============================================
-- 2. Criar tabela de QR Codes de Avaliação
-- ============================================
CREATE TABLE IF NOT EXISTS tb_qrcodes_avaliacao (
    id_qrcode UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_agendamento UUID NOT NULL REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,
    id_paciente UUID NOT NULL REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE SET NULL,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE SET NULL,
    tk_codigo VARCHAR(100) UNIQUE NOT NULL,
    ds_qrcode_url TEXT, -- URL da imagem do QR Code gerado
    st_utilizado BOOLEAN DEFAULT FALSE,
    dt_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_utilizacao TIMESTAMP,
    dt_expiracao TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'), -- Expira em 30 dias
    nr_tentativas_uso INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qrcodes_token ON tb_qrcodes_avaliacao(tk_codigo);
CREATE INDEX IF NOT EXISTS idx_qrcodes_agendamento ON tb_qrcodes_avaliacao(id_agendamento);
CREATE INDEX IF NOT EXISTS idx_qrcodes_utilizado ON tb_qrcodes_avaliacao(st_utilizado);
CREATE INDEX IF NOT EXISTS idx_qrcodes_expiracao ON tb_qrcodes_avaliacao(dt_expiracao);

-- ============================================
-- 3. Criar tabela de Likes em Avaliações
-- ============================================
CREATE TABLE IF NOT EXISTS tb_avaliacoes_likes (
    id_like UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_avaliacao UUID NOT NULL REFERENCES tb_avaliacoes(id_avaliacao) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    st_tipo VARCHAR(10) NOT NULL CHECK (st_tipo IN ('util', 'nao_util')),
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_avaliacao, id_user) -- Um usuário só pode dar like uma vez por avaliação
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_likes_avaliacao ON tb_avaliacoes_likes(id_avaliacao);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_likes_user ON tb_avaliacoes_likes(id_user);

-- ============================================
-- 4. Criar tabela de Moderação de Fotos
-- ============================================
CREATE TABLE IF NOT EXISTS tb_avaliacoes_fotos_moderacao (
    id_moderacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_avaliacao UUID NOT NULL REFERENCES tb_avaliacoes(id_avaliacao) ON DELETE CASCADE,
    ds_foto_url TEXT NOT NULL,
    st_aprovada BOOLEAN,
    ds_motivo_rejeicao TEXT,
    id_moderador UUID REFERENCES tb_users(id_user) ON DELETE SET NULL,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_moderacao TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fotos_moderacao_avaliacao ON tb_avaliacoes_fotos_moderacao(id_avaliacao);
CREATE INDEX IF NOT EXISTS idx_fotos_moderacao_status ON tb_avaliacoes_fotos_moderacao(st_aprovada);

-- ============================================
-- 5. Criar índices adicionais na tb_avaliacoes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_avaliacoes_verificada ON tb_avaliacoes(st_verificada);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_procedimento ON tb_avaliacoes(id_procedimento);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_likes_count ON tb_avaliacoes(nr_likes DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nota ON tb_avaliacoes(nr_nota DESC);

-- ============================================
-- 6. Função para gerar token único de verificação
-- ============================================
CREATE OR REPLACE FUNCTION gerar_token_verificacao()
RETURNS VARCHAR(100) AS $$
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
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Trigger para atualizar contadores de likes
-- ============================================
CREATE OR REPLACE FUNCTION atualizar_likes_avaliacao()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_likes_avaliacao
AFTER INSERT OR DELETE ON tb_avaliacoes_likes
FOR EACH ROW EXECUTE FUNCTION atualizar_likes_avaliacao();

-- ============================================
-- 8. Comentários nas tabelas
-- ============================================
COMMENT ON TABLE tb_qrcodes_avaliacao IS 'QR Codes gerados após procedimentos para avaliações verificadas';
COMMENT ON TABLE tb_avaliacoes_likes IS 'Likes/útil dados por usuários em avaliações';
COMMENT ON TABLE tb_avaliacoes_fotos_moderacao IS 'Moderação de fotos enviadas nas avaliações';

COMMENT ON COLUMN tb_avaliacoes.tk_verificacao IS 'Token único de verificação gerado via QR Code';
COMMENT ON COLUMN tb_avaliacoes.st_verificada IS 'Indica se a avaliação foi feita via QR Code verificado';
COMMENT ON COLUMN tb_avaliacoes.ds_fotos IS 'Array de URLs de fotos enviadas na avaliação';
COMMENT ON COLUMN tb_avaliacoes.ds_badge IS 'Badge do avaliador: verificado, premium, top_rated, etc';

-- ============================================
-- 9. Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_qrcodes_avaliacao TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_avaliacoes_likes TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON tb_avaliacoes_fotos_moderacao TO postgres;

-- Fim da migration
