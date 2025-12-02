-- Migration 022: Adicionar relacionamento Paciente-Profissional
-- Data: 2025-01-10
-- Objetivo: Permitir que pacientes sejam vinculados tanto a clínicas quanto a profissionais específicos

-- =============================================
-- 1. ADICIONAR COLUNA id_profissional EM tb_pacientes
-- =============================================
-- Permite vincular um paciente diretamente a um profissional responsável
ALTER TABLE tb_pacientes
ADD COLUMN id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX idx_pacientes_profissional ON tb_pacientes(id_profissional);

-- Adicionar comentário
COMMENT ON COLUMN tb_pacientes.id_profissional IS 'Profissional responsável pelo paciente (opcional). Se preenchido, paciente foi cadastrado por um profissional específico.';

-- =============================================
-- 2. CRIAR TABELA DE RELACIONAMENTO N:N (tb_pacientes_profissionais)
-- =============================================
-- Permite que um paciente seja atendido por múltiplos profissionais
-- e um profissional possa ter acesso a múltiplos pacientes
CREATE TABLE IF NOT EXISTS tb_pacientes_profissionais (
    id_paciente_profissional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID NOT NULL REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional UUID NOT NULL REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,

    -- Controle de relacionamento
    st_principal BOOLEAN DEFAULT FALSE, -- Indica se é o profissional principal do paciente
    st_ativo BOOLEAN DEFAULT TRUE,

    -- Auditoria
    dt_vinculo TIMESTAMP DEFAULT now(),
    dt_ultimo_atendimento TIMESTAMP,
    nr_total_atendimentos INTEGER DEFAULT 0,

    -- Observações sobre o relacionamento
    ds_observacoes TEXT,

    -- Timestamps
    dt_criacao TIMESTAMP DEFAULT now(),
    dt_atualizacao TIMESTAMP DEFAULT now(),

    -- Constraint para evitar duplicação
    UNIQUE(id_paciente, id_profissional)
);

-- Comentários
COMMENT ON TABLE tb_pacientes_profissionais IS 'Relacionamento N:N entre pacientes e profissionais. Permite que um paciente seja atendido por múltiplos profissionais.';
COMMENT ON COLUMN tb_pacientes_profissionais.st_principal IS 'Indica se este é o profissional principal responsável pelo paciente';
COMMENT ON COLUMN tb_pacientes_profissionais.dt_ultimo_atendimento IS 'Data do último atendimento realizado por este profissional';

-- Índices para performance
CREATE INDEX idx_pacientes_profissionais_paciente ON tb_pacientes_profissionais(id_paciente);
CREATE INDEX idx_pacientes_profissionais_profissional ON tb_pacientes_profissionais(id_profissional);
CREATE INDEX idx_pacientes_profissionais_clinica ON tb_pacientes_profissionais(id_clinica);
CREATE INDEX idx_pacientes_profissionais_ativo ON tb_pacientes_profissionais(st_ativo);

-- Trigger para atualizar dt_atualizacao
CREATE TRIGGER trg_update_pacientes_profissionais
    BEFORE UPDATE ON tb_pacientes_profissionais
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_atualizacao();

-- =============================================
-- 3. FUNÇÃO AUXILIAR: Obter pacientes de um profissional
-- =============================================
-- Retorna todos os pacientes que um profissional tem acesso
-- (pacientes vinculados diretamente + pacientes da clínica)
CREATE OR REPLACE FUNCTION fn_get_pacientes_profissional(p_id_profissional UUID)
RETURNS TABLE (
    id_paciente UUID,
    nm_paciente VARCHAR(255),
    nr_cpf VARCHAR(14),
    dt_nascimento DATE,
    ds_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    id_clinica UUID,
    id_profissional_responsavel UUID,
    st_vinculo_direto BOOLEAN,
    st_principal BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Pacientes vinculados diretamente ao profissional
    SELECT
        p.id_paciente,
        p.nm_paciente,
        p.nr_cpf,
        p.dt_nascimento,
        p.ds_email,
        p.nr_telefone,
        p.id_clinica,
        p.id_profissional AS id_profissional_responsavel,
        TRUE AS st_vinculo_direto,
        pp.st_principal
    FROM tb_pacientes p
    LEFT JOIN tb_pacientes_profissionais pp ON p.id_paciente = pp.id_paciente AND pp.id_profissional = p_id_profissional
    WHERE p.id_profissional = p_id_profissional
       OR EXISTS (
           SELECT 1 FROM tb_pacientes_profissionais pp2
           WHERE pp2.id_paciente = p.id_paciente
             AND pp2.id_profissional = p_id_profissional
             AND pp2.st_ativo = TRUE
       )

    UNION

    -- Pacientes da clínica onde o profissional trabalha (acesso compartilhado)
    SELECT DISTINCT
        p.id_paciente,
        p.nm_paciente,
        p.nr_cpf,
        p.dt_nascimento,
        p.ds_email,
        p.nr_telefone,
        p.id_clinica,
        p.id_profissional AS id_profissional_responsavel,
        FALSE AS st_vinculo_direto,
        FALSE AS st_principal
    FROM tb_pacientes p
    INNER JOIN tb_profissionais prof ON p.id_clinica = prof.id_clinica
    WHERE prof.id_profissional = p_id_profissional
      AND p.st_ativo = TRUE
      AND prof.st_ativo = TRUE
      -- Não incluir pacientes que já foram retornados no primeiro SELECT
      AND NOT EXISTS (
          SELECT 1 FROM tb_pacientes_profissionais pp
          WHERE pp.id_paciente = p.id_paciente
            AND pp.id_profissional = p_id_profissional
      )
      AND p.id_profissional IS DISTINCT FROM p_id_profissional;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_pacientes_profissional IS 'Retorna todos os pacientes que um profissional tem acesso (diretos + da clínica)';

-- =============================================
-- 4. DADOS DE EXEMPLO (Opcional - para desenvolvimento)
-- =============================================
-- Exemplo de vinculação de pacientes existentes a profissionais
-- Descomente apenas em ambiente de desenvolvimento

/*
-- Exemplo 1: Vincular todos os pacientes de uma clínica aos profissionais dessa clínica
INSERT INTO tb_pacientes_profissionais (id_paciente, id_profissional, id_clinica, st_principal)
SELECT
    p.id_paciente,
    prof.id_profissional,
    p.id_clinica,
    FALSE -- Não é o profissional principal (apenas acesso compartilhado)
FROM tb_pacientes p
INNER JOIN tb_profissionais prof ON p.id_clinica = prof.id_clinica
WHERE p.st_ativo = TRUE
  AND prof.st_ativo = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM tb_pacientes_profissionais pp
      WHERE pp.id_paciente = p.id_paciente
        AND pp.id_profissional = prof.id_profissional
  )
ON CONFLICT (id_paciente, id_profissional) DO NOTHING;
*/

-- =============================================
-- 5. VALIDAÇÕES E CONSTRAINTS
-- =============================================

-- Garantir que se id_profissional está preenchido, pelo menos um dos dois (id_clinica ou id_profissional) deve estar preenchido
ALTER TABLE tb_pacientes
ADD CONSTRAINT chk_paciente_vinculo
CHECK (id_clinica IS NOT NULL OR id_profissional IS NOT NULL);

COMMENT ON CONSTRAINT chk_paciente_vinculo ON tb_pacientes IS 'Garante que todo paciente está vinculado a pelo menos uma clínica ou profissional';

-- =============================================
-- 6. VIEW PARA FACILITAR CONSULTAS
-- =============================================
-- View que mostra pacientes com informações de seus profissionais
CREATE OR REPLACE VIEW vw_pacientes_completo AS
SELECT
    p.id_paciente,
    p.id_user,
    p.id_clinica,
    p.id_profissional AS id_profissional_responsavel,
    p.nm_paciente,
    p.dt_nascimento,
    p.nr_cpf,
    p.ds_email,
    p.nr_telefone,
    p.st_ativo,
    p.nr_total_consultas,
    p.dt_criacao,

    -- Informações da clínica
    c.nm_clinica,
    c.ds_endereco AS ds_endereco_clinica,

    -- Informações do profissional responsável
    prof.nm_profissional AS nm_profissional_responsavel,
    prof.ds_especialidades AS ds_especialidades_profissional,

    -- Quantidade de profissionais vinculados
    (SELECT COUNT(*) FROM tb_pacientes_profissionais pp
     WHERE pp.id_paciente = p.id_paciente AND pp.st_ativo = TRUE) AS nr_profissionais_vinculados,

    -- Lista de profissionais vinculados
    (SELECT array_agg(prof2.nm_profissional)
     FROM tb_pacientes_profissionais pp2
     INNER JOIN tb_profissionais prof2 ON pp2.id_profissional = prof2.id_profissional
     WHERE pp2.id_paciente = p.id_paciente AND pp2.st_ativo = TRUE) AS nm_profissionais_vinculados

FROM tb_pacientes p
LEFT JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
LEFT JOIN tb_profissionais prof ON p.id_profissional = prof.id_profissional;

COMMENT ON VIEW vw_pacientes_completo IS 'View com informações completas de pacientes, incluindo clínica e profissionais vinculados';

-- =============================================
-- FIM DA MIGRATION 022
-- =============================================

-- Verificar estrutura criada
SELECT
    'tb_pacientes - Coluna id_profissional adicionada' AS status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_pacientes' AND column_name = 'id_profissional'
    ) THEN '✓ OK' ELSE '✗ ERRO' END AS resultado
UNION ALL
SELECT
    'tb_pacientes_profissionais - Tabela criada' AS status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tb_pacientes_profissionais'
    ) THEN '✓ OK' ELSE '✗ ERRO' END AS resultado
UNION ALL
SELECT
    'fn_get_pacientes_profissional - Função criada' AS status,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'fn_get_pacientes_profissional'
    ) THEN '✓ OK' ELSE '✗ ERRO' END AS resultado
UNION ALL
SELECT
    'vw_pacientes_completo - View criada' AS status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'vw_pacientes_completo'
    ) THEN '✓ OK' ELSE '✗ ERRO' END AS resultado;
