-- Migration 023 Fix: Criar apenas o perfil "Financeiro" que faltou
-- Data: 2025-11-06

-- Perfil para responsáveis financeiros dentro de clínicas
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
WHERE NOT EXISTS (
    SELECT 1 FROM tb_perfis
    WHERE nm_perfil = 'Financeiro' AND fg_template = true AND id_empresa IS NULL
);

-- Verificar criação
SELECT
    nm_perfil,
    ds_grupos_acesso,
    array_length(ds_rotas_permitidas, 1) as qt_rotas,
    st_ativo
FROM tb_perfis
WHERE fg_template = true AND id_empresa IS NULL
ORDER BY nm_perfil;
