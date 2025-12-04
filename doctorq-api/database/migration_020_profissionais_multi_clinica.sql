-- Migration 020: Sistema Multi-clínica para Profissionais (N:N)
-- Permite que um profissional trabalhe em múltiplas clínicas
-- Data: 03/11/2025

-- =====================================================
-- 1. Criar tabela de relacionamento N:N
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_profissionais_clinicas (
    id_profissional_clinica UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_profissional UUID NOT NULL,
    id_clinica UUID NOT NULL,
    dt_vinculo TIMESTAMP NOT NULL DEFAULT now(),
    dt_desvinculo TIMESTAMP,
    st_ativo BOOLEAN NOT NULL DEFAULT true,
    ds_observacoes TEXT,
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_profissional_clinica_profissional
        FOREIGN KEY (id_profissional)
        REFERENCES tb_profissionais(id_profissional)
        ON DELETE CASCADE,

    CONSTRAINT fk_profissional_clinica_clinica
        FOREIGN KEY (id_clinica)
        REFERENCES tb_clinicas(id_clinica)
        ON DELETE CASCADE,

    -- Garantir unicidade: um profissional não pode ter múltiplos vínculos ativos com a mesma clínica
    CONSTRAINT uk_profissional_clinica_ativo
        UNIQUE (id_profissional, id_clinica, st_ativo)
);

-- =====================================================
-- 2. Criar índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_prof_clinicas_profissional
    ON tb_profissionais_clinicas(id_profissional);

CREATE INDEX IF NOT EXISTS idx_prof_clinicas_clinica
    ON tb_profissionais_clinicas(id_clinica);

CREATE INDEX IF NOT EXISTS idx_prof_clinicas_ativo
    ON tb_profissionais_clinicas(st_ativo);

CREATE INDEX IF NOT EXISTS idx_prof_clinicas_vinculo
    ON tb_profissionais_clinicas(dt_vinculo);

-- =====================================================
-- 3. Migrar dados existentes
-- =====================================================

-- Inserir relacionamentos existentes na nova tabela
-- Apenas profissionais que já têm id_clinica definido
INSERT INTO tb_profissionais_clinicas (
    id_profissional,
    id_clinica,
    dt_vinculo,
    st_ativo,
    dt_criacao
)
SELECT
    id_profissional,
    id_clinica,
    dt_criacao,
    st_ativo,
    dt_criacao
FROM tb_profissionais
WHERE id_clinica IS NOT NULL
ON CONFLICT (id_profissional, id_clinica, st_ativo) DO NOTHING;

-- =====================================================
-- 4. Modificar tabela tb_profissionais
-- =====================================================

-- Remover a constraint de FK (mas manter a coluna por compatibilidade)
ALTER TABLE tb_profissionais
    DROP CONSTRAINT IF EXISTS tb_profissionais_id_clinica_fkey;

-- Tornar id_clinica nullable (se ainda não for)
ALTER TABLE tb_profissionais
    ALTER COLUMN id_clinica DROP NOT NULL;

-- Adicionar comentário indicando que a coluna está deprecated
COMMENT ON COLUMN tb_profissionais.id_clinica IS
    'DEPRECATED: Clínica principal (manter por compatibilidade). Usar tb_profissionais_clinicas para relacionamento N:N.';

-- =====================================================
-- 5. Criar função auxiliar para obter clínicas de um profissional
-- =====================================================

CREATE OR REPLACE FUNCTION get_profissional_clinicas(p_id_profissional UUID)
RETURNS TABLE (
    id_clinica UUID,
    nm_clinica VARCHAR(255),
    id_empresa UUID,
    st_ativo BOOLEAN,
    dt_vinculo TIMESTAMP
) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Criar função auxiliar para obter profissionais de uma clínica
-- =====================================================

CREATE OR REPLACE FUNCTION get_clinica_profissionais(p_id_clinica UUID)
RETURNS TABLE (
    id_profissional UUID,
    nm_profissional VARCHAR(255),
    ds_especialidades TEXT[],
    nr_registro_profissional VARCHAR(50),
    st_ativo BOOLEAN,
    dt_vinculo TIMESTAMP
) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Criar view para facilitar consultas
-- =====================================================

CREATE OR REPLACE VIEW vw_profissionais_clinicas AS
SELECT
    pc.id_profissional_clinica,
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
FROM tb_profissionais_clinicas pc
INNER JOIN tb_profissionais p ON pc.id_profissional = p.id_profissional
INNER JOIN tb_clinicas c ON pc.id_clinica = c.id_clinica
INNER JOIN tb_empresas e ON c.id_empresa = e.id_empresa;

-- =====================================================
-- 8. Adicionar comentários para documentação
-- =====================================================

COMMENT ON TABLE tb_profissionais_clinicas IS
    'Relacionamento N:N entre profissionais e clínicas. Permite que um profissional trabalhe em múltiplas clínicas.';

COMMENT ON COLUMN tb_profissionais_clinicas.id_profissional_clinica IS
    'Identificador único do vínculo';

COMMENT ON COLUMN tb_profissionais_clinicas.id_profissional IS
    'Profissional vinculado';

COMMENT ON COLUMN tb_profissionais_clinicas.id_clinica IS
    'Clínica vinculada';

COMMENT ON COLUMN tb_profissionais_clinicas.dt_vinculo IS
    'Data de início do vínculo';

COMMENT ON COLUMN tb_profissionais_clinicas.dt_desvinculo IS
    'Data de término do vínculo (NULL se ainda ativo)';

COMMENT ON COLUMN tb_profissionais_clinicas.st_ativo IS
    'Status do vínculo (true = ativo, false = inativo)';

COMMENT ON FUNCTION get_profissional_clinicas(UUID) IS
    'Retorna todas as clínicas ativas de um profissional';

COMMENT ON FUNCTION get_clinica_profissionais(UUID) IS
    'Retorna todos os profissionais ativos de uma clínica';

COMMENT ON VIEW vw_profissionais_clinicas IS
    'View consolidada com dados completos do relacionamento profissional-clínica';

-- =====================================================
-- 9. Grants de permissões (ajustar conforme necessário)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON tb_profissionais_clinicas TO doctorq_app;
-- GRANT SELECT ON vw_profissionais_clinicas TO doctorq_app;
-- GRANT EXECUTE ON FUNCTION get_profissional_clinicas(UUID) TO doctorq_app;
-- GRANT EXECUTE ON FUNCTION get_clinica_profissionais(UUID) TO doctorq_app;

-- =====================================================
-- 10. Dados de exemplo/teste (opcional - descomentar se necessário)
-- =====================================================

/*
-- Exemplo: Vincular um profissional a múltiplas clínicas
-- INSERT INTO tb_profissionais_clinicas (id_profissional, id_clinica, ds_observacoes)
-- VALUES
--     ('uuid-profissional-1', 'uuid-clinica-1', 'Atende segundas e quartas'),
--     ('uuid-profissional-1', 'uuid-clinica-2', 'Atende terças e quintas');
*/

-- =====================================================
-- Fim da Migration 020
-- =====================================================

-- Verificações pós-migração
DO $$
DECLARE
    v_count_table INTEGER;
    v_count_indexes INTEGER;
    v_count_functions INTEGER;
BEGIN
    -- Verificar se a tabela foi criada
    SELECT COUNT(*) INTO v_count_table
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'tb_profissionais_clinicas';

    -- Verificar índices
    SELECT COUNT(*) INTO v_count_indexes
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename = 'tb_profissionais_clinicas';

    -- Verificar funções
    SELECT COUNT(*) INTO v_count_functions
    FROM pg_proc
    WHERE proname IN ('get_profissional_clinicas', 'get_clinica_profissionais');

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Migration 020 - Verificações:';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tabela tb_profissionais_clinicas: % (esperado: 1)', v_count_table;
    RAISE NOTICE 'Índices criados: % (esperado: 4)', v_count_indexes;
    RAISE NOTICE 'Funções criadas: % (esperado: 2)', v_count_functions;
    RAISE NOTICE '==============================================';

    IF v_count_table = 1 AND v_count_indexes >= 4 AND v_count_functions = 2 THEN
        RAISE NOTICE '✅ Migration executada com sucesso!';
    ELSE
        RAISE WARNING '⚠️  Alguns objetos podem não ter sido criados corretamente.';
    END IF;
END $$;
