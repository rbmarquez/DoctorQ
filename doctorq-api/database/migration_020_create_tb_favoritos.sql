-- Migration: Criação da tabela tb_favoritos
-- Descrição: Tabela para gerenciar vagas favoritadas pelos usuários
-- Data: 2025-11-17

-- Criar tabela tb_favoritos
CREATE TABLE IF NOT EXISTS tb_favoritos (
    id_favorito UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL,
    id_vaga UUID NOT NULL,
    dt_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Foreign keys
    CONSTRAINT fk_favoritos_user FOREIGN KEY (id_user)
        REFERENCES tb_users(id_user) ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_vaga FOREIGN KEY (id_vaga)
        REFERENCES tb_vagas(id_vaga) ON DELETE CASCADE,

    -- Constraint único: um usuário não pode favoritar a mesma vaga duas vezes
    CONSTRAINT uq_user_vaga_favorito UNIQUE (id_user, id_vaga)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_favoritos_user ON tb_favoritos(id_user);
CREATE INDEX IF NOT EXISTS idx_favoritos_vaga ON tb_favoritos(id_vaga);
CREATE INDEX IF NOT EXISTS idx_favoritos_dt_criacao ON tb_favoritos(dt_criacao DESC);

-- Comentários
COMMENT ON TABLE tb_favoritos IS 'Tabela de vagas favoritadas pelos usuários';
COMMENT ON COLUMN tb_favoritos.id_favorito IS 'ID único do favorito';
COMMENT ON COLUMN tb_favoritos.id_user IS 'ID do usuário que favoritou a vaga';
COMMENT ON COLUMN tb_favoritos.id_vaga IS 'ID da vaga favoritada';
COMMENT ON COLUMN tb_favoritos.dt_criacao IS 'Data e hora em que a vaga foi favoritada';
