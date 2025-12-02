-- Migration 023: Adiciona perfil "Financeiro" e suporte completo para gestão de equipe
-- Data: 2025-11-06
-- Autor: Claude Code
-- Descrição: Cria perfil template "Financeiro" para sub-usuários de clínicas gerenciarem
--            área financeira, e adiciona campos necessários para controle de limites de usuários

-- ============================================================================
-- 1. CRIAR PERFIL TEMPLATE "FINANCEIRO"
-- ============================================================================

-- Perfil para responsáveis financeiros dentro de clínicas
-- Acesso: Dashboard, Faturas, Transações, Relatórios Financeiros, Configurações de Pagamento
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo,
    fg_template,
    id_empresa,
    ds_grupos_acesso,
    ds_permissoes,
    ds_permissoes_detalhadas,
    ds_rotas_permitidas,
    st_ativo,
    dt_criacao
) VALUES (
    gen_random_uuid(),
    'Financeiro',
    'Perfil de responsável financeiro com acesso à gestão de faturas, transações, cobranças e relatórios financeiros',
    'system',
    true,
    NULL,
    ARRAY['clinica']::TEXT[],
    '{}'::JSONB,
    '{
        "clinica": {
            "dashboard": {
                "visualizar": true
            },
            "faturas": {
                "visualizar": true,
                "criar": true,
                "editar": true,
                "cancelar": true,
                "exportar": true
            },
            "transacoes": {
                "visualizar": true,
                "criar": true,
                "estornar": false
            },
            "cobrancas": {
                "visualizar": true,
                "criar": true,
                "editar": true,
                "cancelar": false
            },
            "relatorios": {
                "visualizar": true,
                "exportar": true,
                "financeiro": true,
                "faturamento": true,
                "inadimplencia": true
            },
            "configuracoes": {
                "pagamento": {
                    "visualizar": true,
                    "editar": true
                },
                "impostos": {
                    "visualizar": true,
                    "editar": false
                }
            }
        }
    }'::JSONB,
    ARRAY[
        '/clinica/dashboard',
        '/clinica/financeiro',
        '/clinica/financeiro/faturas',
        '/clinica/financeiro/transacoes',
        '/clinica/financeiro/cobrancas',
        '/clinica/financeiro/relatorios',
        '/clinica/configuracoes/pagamento'
    ]::TEXT[],
    'S',
    NOW()
);

-- ============================================================================
-- 2. ADICIONAR CAMPO qt_limite_usuarios EM tb_empresas
-- ============================================================================

-- Campo para controlar limite de usuários por empresa/clínica
-- Será definido no momento da ativação da parceria
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_empresas' AND column_name = 'qt_limite_usuarios'
    ) THEN
        ALTER TABLE tb_empresas
        ADD COLUMN qt_limite_usuarios INTEGER DEFAULT 5 NOT NULL;

        COMMENT ON COLUMN tb_empresas.qt_limite_usuarios IS
        'Limite de usuários permitidos para esta empresa conforme pacote de parceria contratado';
    END IF;
END $$;

-- ============================================================================
-- 3. ADICIONAR CAMPO id_usuario_criador EM tb_users (auditoria)
-- ============================================================================

-- Campo para rastrear quem criou cada usuário (útil para gestão de equipe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tb_users' AND column_name = 'id_usuario_criador'
    ) THEN
        ALTER TABLE tb_users
        ADD COLUMN id_usuario_criador UUID REFERENCES tb_users(id_user) ON DELETE SET NULL;

        COMMENT ON COLUMN tb_users.id_usuario_criador IS
        'Usuário (admin de clínica) que criou este sub-usuário';

        -- Índice para performance
        CREATE INDEX idx_users_criador ON tb_users(id_usuario_criador);
    END IF;
END $$;

-- ============================================================================
-- 4. CRIAR VIEW PARA CONTAGEM DE USUÁRIOS POR EMPRESA
-- ============================================================================

-- View para facilitar verificação de limite de usuários
CREATE OR REPLACE VIEW vw_empresas_usuarios_count AS
SELECT
    e.id_empresa,
    e.nm_razao_social,
    e.qt_limite_usuarios,
    COUNT(DISTINCT u.id_user) AS qt_usuarios_atuais,
    (e.qt_limite_usuarios - COUNT(DISTINCT u.id_user)) AS qt_usuarios_disponiveis,
    CASE
        WHEN COUNT(DISTINCT u.id_user) >= e.qt_limite_usuarios THEN true
        ELSE false
    END AS fg_limite_atingido
FROM tb_empresas e
LEFT JOIN tb_users u ON u.id_empresa = e.id_empresa AND u.st_ativo = 'S'
GROUP BY e.id_empresa, e.nm_razao_social, e.qt_limite_usuarios;

COMMENT ON VIEW vw_empresas_usuarios_count IS
'View para monitorar uso de limite de usuários por empresa';

-- ============================================================================
-- 5. CRIAR PERFIL "RECEPCIONISTA" SE NÃO EXISTIR
-- ============================================================================

-- Garantir que perfil Recepcionista existe (mencionado na visão do projeto)
INSERT INTO tb_perfis (
    id_perfil,
    nm_perfil,
    ds_perfil,
    nm_tipo,
    fg_template,
    id_empresa,
    ds_grupos_acesso,
    ds_permissoes,
    ds_permissoes_detalhadas,
    ds_rotas_permitidas,
    st_ativo,
    dt_criacao
)
SELECT
    gen_random_uuid(),
    'Recepcionista',
    'Perfil de recepcionista com acesso à gestão de agendamentos, pacientes e atendimento',
    'system',
    true,
    NULL,
    ARRAY['clinica']::TEXT[],
    '{}'::JSONB,
    '{
        "clinica": {
            "dashboard": {
                "visualizar": true
            },
            "agendamentos": {
                "visualizar": true,
                "criar": true,
                "editar": true,
                "cancelar": true,
                "confirmar": true
            },
            "pacientes": {
                "visualizar": true,
                "criar": true,
                "editar": true,
                "excluir": false
            },
            "atendimento": {
                "visualizar": true,
                "iniciar": true,
                "finalizar": false
            },
            "mensagens": {
                "visualizar": true,
                "enviar": true,
                "excluir": false
            },
            "configuracoes": {
                "agenda": {
                    "visualizar": true,
                    "editar": false
                }
            }
        }
    }'::JSONB,
    ARRAY[
        '/clinica/dashboard',
        '/clinica/agendamentos',
        '/clinica/pacientes',
        '/clinica/atendimento',
        '/clinica/mensagens'
    ]::TEXT[],
    'S',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tb_perfis
    WHERE nm_perfil = 'Recepcionista' AND fg_template = true AND id_empresa IS NULL
);

-- ============================================================================
-- 6. ATUALIZAR qt_limite_usuarios PADRÃO PARA EMPRESAS EXISTENTES
-- ============================================================================

-- Empresas existentes recebem limite padrão de 10 usuários (pode ser ajustado depois)
UPDATE tb_empresas
SET qt_limite_usuarios = 10
WHERE qt_limite_usuarios IS NULL OR qt_limite_usuarios = 5;

-- ============================================================================
-- 7. INDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para filtrar usuários ativos por empresa (usado na validação de limite)
CREATE INDEX IF NOT EXISTS idx_users_empresa_ativo
ON tb_users(id_empresa, st_ativo)
WHERE st_ativo = 'S';

-- ============================================================================
-- 8. VERIFICAÇÃO E ESTATÍSTICAS
-- ============================================================================

-- Exibir perfis templates criados
SELECT
    nm_perfil,
    ds_grupos_acesso,
    array_length(ds_rotas_permitidas, 1) as qt_rotas,
    st_ativo
FROM tb_perfis
WHERE fg_template = true AND id_empresa IS NULL
ORDER BY nm_perfil;

-- Exibir estatísticas de usuários por empresa
SELECT * FROM vw_empresas_usuarios_count
ORDER BY qt_usuarios_atuais DESC
LIMIT 10;

-- ============================================================================
-- FIM DA MIGRATION 023
-- ============================================================================
