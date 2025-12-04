-- ============================================================================
-- Migration: Configuração do Handoff Gisele para Central de Atendimento
-- Data: 2025-11-23
-- Descrição: Configura a integração do chatbot Gisele com a Central de Atendimento
--
-- IMPORTANTE: Este script não altera schema, apenas configura dados necessários
-- para o funcionamento do handoff entre Gisele e Central de Atendimento.
-- ============================================================================

-- Verificar se a empresa padrão existe
DO $$
DECLARE
    v_empresa_id UUID := 'af8b2919-d0f6-4310-9a77-488989969ea4';
    v_empresa_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM tb_empresas WHERE id_empresa = v_empresa_id) INTO v_empresa_exists;

    IF NOT v_empresa_exists THEN
        RAISE NOTICE 'AVISO: Empresa padrão % não encontrada. O handoff pode não funcionar corretamente.', v_empresa_id;
    ELSE
        RAISE NOTICE 'OK: Empresa padrão % encontrada.', v_empresa_id;
    END IF;
END $$;

-- Garantir que o canal webchat existe para a empresa padrão
INSERT INTO tb_canais_omni (
    id_canal,
    id_empresa,
    tp_canal,
    nm_canal,
    ds_canal,
    fg_ativo,
    dt_criacao
)
SELECT
    gen_random_uuid(),
    'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID,
    'webchat',
    'Chat Gisele',
    'Canal de chat do widget Gisele para handoff para atendimento humano',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tb_canais_omni
    WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID
    AND tp_canal = 'webchat'
);

-- Criar fila de atendimento padrão se não existir
INSERT INTO tb_filas_atendimento (
    id_fila,
    id_empresa,
    nm_fila,
    ds_fila,
    nr_prioridade,
    nr_tempo_sla_minutos,
    fg_ativo,
    dt_criacao
)
SELECT
    gen_random_uuid(),
    'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID,
    'Fila Geral - Handoff Gisele',
    'Fila de atendimento para conversas transferidas do chatbot Gisele',
    1,
    15,
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tb_filas_atendimento
    WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID
    AND nm_fila LIKE '%Gisele%'
);

-- ============================================================================
-- Verificação de configuração
-- ============================================================================
DO $$
DECLARE
    v_canais INTEGER;
    v_filas INTEGER;
    v_conversas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_canais
    FROM tb_canais_omni
    WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID;

    SELECT COUNT(*) INTO v_filas
    FROM tb_filas_atendimento
    WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID;

    SELECT COUNT(*) INTO v_conversas
    FROM tb_conversas_omni
    WHERE id_empresa = 'af8b2919-d0f6-4310-9a77-488989969ea4'::UUID;

    RAISE NOTICE '--- Configuração do Handoff ---';
    RAISE NOTICE 'Canais configurados: %', v_canais;
    RAISE NOTICE 'Filas de atendimento: %', v_filas;
    RAISE NOTICE 'Conversas existentes: %', v_conversas;
    RAISE NOTICE '-------------------------------';
END $$;

-- ============================================================================
-- NOTAS DE DEPLOY:
--
-- 1. Variável de ambiente obrigatória:
--    DEFAULT_EMPRESA_ID=af8b2919-d0f6-4310-9a77-488989969ea4
--
-- 2. Endpoints do Handoff:
--    - POST /central-atendimento/handoff/iniciar/ - Inicia handoff
--    - POST /central-atendimento/handoff/detectar-intencao/ - Detecta intenção
--    - GET  /central-atendimento/handoff/status/{id_conversa}/ - Status
--
-- 3. WebSocket para chat em tempo real:
--    - ws://{host}/ws/central-atendimento/chat/{id_conversa}/
--
-- 4. Requisitos do frontend:
--    - Configurar NEXT_PUBLIC_API_URL apontando para a API
--    - Implementar conexão WebSocket no GiseleChatWidget
-- ============================================================================
