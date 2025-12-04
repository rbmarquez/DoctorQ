-- ============================================================================
-- Migration v2: Configuração do Handoff Gisele para Central de Atendimento
-- Data: 2025-11-23
-- Descrição: Versão corrigida para banco de produção AWS RDS
-- ============================================================================

-- 1. Primeiro, criar a empresa padrão se não existir
INSERT INTO tb_empresas (
    id_empresa,
    nm_empresa,
    nm_razao_social,
    nr_cnpj,
    fg_ativo,
    dt_criacao
)
SELECT
    'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID,
    'DoctorQ - Empresa Padrão',
    'DoctorQ Tecnologia LTDA',
    '00000000000000',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tb_empresas WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID
);

-- Verificar estrutura da tabela tb_canais_omni
DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura das tabelas...';
END $$;

-- 2. Inserir canal webchat (adaptado para colunas existentes)
DO $$
DECLARE
    v_has_ds_canal BOOLEAN;
BEGIN
    -- Verificar se coluna ds_canal existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_canais_omni' AND column_name = 'ds_canal'
    ) INTO v_has_ds_canal;

    IF v_has_ds_canal THEN
        -- Schema com ds_canal
        INSERT INTO tb_canais_omni (id_canal, id_empresa, tp_canal, nm_canal, ds_canal, fg_ativo, dt_criacao)
        SELECT gen_random_uuid(), 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID, 'webchat', 'Chat Gisele', 'Canal de chat do widget Gisele', true, NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM tb_canais_omni WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID AND tp_canal = 'webchat'
        );
    ELSE
        -- Schema sem ds_canal
        INSERT INTO tb_canais_omni (id_canal, id_empresa, tp_canal, nm_canal, fg_ativo, dt_criacao)
        SELECT gen_random_uuid(), 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID, 'webchat', 'Chat Gisele', true, NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM tb_canais_omni WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID AND tp_canal = 'webchat'
        );
    END IF;

    RAISE NOTICE 'Canal webchat verificado/criado';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar canal: %', SQLERRM;
END $$;

-- 3. Inserir fila de atendimento (adaptado para colunas existentes)
DO $$
DECLARE
    v_has_ds_fila BOOLEAN;
BEGIN
    -- Verificar se coluna ds_fila existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_filas_atendimento' AND column_name = 'ds_fila'
    ) INTO v_has_ds_fila;

    IF v_has_ds_fila THEN
        -- Schema com ds_fila
        INSERT INTO tb_filas_atendimento (id_fila, id_empresa, nm_fila, ds_fila, nr_prioridade, nr_tempo_sla_minutos, fg_ativo, dt_criacao)
        SELECT gen_random_uuid(), 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID, 'Fila Geral - Handoff Gisele', 'Fila de atendimento para conversas transferidas', 1, 15, true, NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM tb_filas_atendimento WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID AND nm_fila LIKE '%Gisele%'
        );
    ELSE
        -- Schema sem ds_fila
        INSERT INTO tb_filas_atendimento (id_fila, id_empresa, nm_fila, nr_prioridade, nr_tempo_sla_minutos, fg_ativo, dt_criacao)
        SELECT gen_random_uuid(), 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID, 'Fila Geral - Handoff Gisele', 1, 15, true, NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM tb_filas_atendimento WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID AND nm_fila LIKE '%Gisele%'
        );
    END IF;

    RAISE NOTICE 'Fila de atendimento verificada/criada';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar fila: %', SQLERRM;
END $$;

-- 4. Verificação final
DO $$
DECLARE
    v_empresa BOOLEAN;
    v_canais INTEGER;
    v_filas INTEGER;
BEGIN
    SELECT EXISTS(SELECT 1 FROM tb_empresas WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID) INTO v_empresa;
    SELECT COUNT(*) INTO v_canais FROM tb_canais_omni WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID;
    SELECT COUNT(*) INTO v_filas FROM tb_filas_atendimento WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Configuração do Handoff Gisele';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Empresa padrão existe: %', v_empresa;
    RAISE NOTICE 'Canais configurados: %', v_canais;
    RAISE NOTICE 'Filas de atendimento: %', v_filas;
    RAISE NOTICE '========================================';

    IF NOT v_empresa THEN
        RAISE NOTICE 'AVISO: Empresa padrão não encontrada!';
    END IF;
END $$;

-- ============================================================================
-- VARIÁVEL DE AMBIENTE OBRIGATÓRIA:
-- DEFAULT_EMPRESA_ID=af8b2919-d0f6-4310-9a77-488989969ea4
-- ============================================================================
