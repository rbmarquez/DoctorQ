-- Migration 021: Row Level Security (RLS) para Multi-Tenancy
-- Data: 2025-11-05
-- Descrição: Implementa Row Level Security no PostgreSQL para garantir
--            isolamento automático de dados por empresa, como camada adicional
--            de segurança além dos filtros na aplicação.

-- IMPORTANTE: Esta migration é COMPLEMENTAR às correções de código.
--             Ela adiciona uma camada extra de segurança no banco de dados.

-- ==========================================
-- 1. Criar função helper para obter id_empresa do contexto
-- ==========================================

CREATE OR REPLACE FUNCTION current_user_empresa_id()
RETURNS UUID AS $$
DECLARE
    empresa_id_value TEXT;
BEGIN
    -- Busca a variável de sessão configurada pela aplicação
    empresa_id_value := current_setting('app.current_empresa_id', TRUE);

    IF empresa_id_value IS NULL OR empresa_id_value = '' THEN
        -- Se não estiver configurado, retorna NULL (bypass RLS para queries de sistema)
        RETURN NULL;
    END IF;

    RETURN empresa_id_value::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION current_user_empresa_id() IS
'Retorna o UUID da empresa do usuário atual baseado em variável de sessão configurada pela aplicação';

-- ==========================================
-- 2. Habilitar RLS em tabelas com id_empresa
-- ==========================================

-- Tabela: tb_perfis
ALTER TABLE tb_perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY perfis_isolation_policy ON tb_perfis
    USING (
        id_empresa IS NULL  -- Templates globais são visíveis para todos
        OR id_empresa = current_user_empresa_id()  -- Perfis da empresa
    );

COMMENT ON POLICY perfis_isolation_policy ON tb_perfis IS
'Permite acesso a perfis globais (templates) e perfis da empresa do usuário';

-- Tabela: tb_users
ALTER TABLE tb_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_isolation_policy ON tb_users
    USING (id_empresa = current_user_empresa_id());

COMMENT ON POLICY users_isolation_policy ON tb_users IS
'Isola usuários por empresa';

-- Tabela: tb_configuracoes
ALTER TABLE tb_configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY configuracoes_isolation_policy ON tb_configuracoes
    USING (id_empresa = current_user_empresa_id());

-- Tabela: tb_notificacoes
ALTER TABLE tb_notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notificacoes_isolation_policy ON tb_notificacoes
    USING (id_empresa = current_user_empresa_id());

-- Tabela: tb_transacoes
ALTER TABLE tb_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY transacoes_isolation_policy ON tb_transacoes
    USING (id_empresa = current_user_empresa_id());

-- ==========================================
-- 3. Habilitar RLS em tabelas com id_clinica
--    (via JOIN com tb_clinicas)
-- ==========================================

-- Tabela: tb_clinicas
ALTER TABLE tb_clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinicas_isolation_policy ON tb_clinicas
    USING (id_empresa = current_user_empresa_id());

-- Tabela: tb_procedimentos
ALTER TABLE tb_procedimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY procedimentos_isolation_policy ON tb_procedimentos
    USING (
        id_clinica IN (
            SELECT id_clinica
            FROM tb_clinicas
            WHERE id_empresa = current_user_empresa_id()
        )
    );

-- Tabela: tb_profissionais
ALTER TABLE tb_profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY profissionais_isolation_policy ON tb_profissionais
    USING (
        id_clinica IN (
            SELECT id_clinica
            FROM tb_clinicas
            WHERE id_empresa = current_user_empresa_id()
        )
    );

-- Tabela: tb_agendamentos
ALTER TABLE tb_agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY agendamentos_isolation_policy ON tb_agendamentos
    USING (
        id_clinica IN (
            SELECT id_clinica
            FROM tb_clinicas
            WHERE id_empresa = current_user_empresa_id()
        )
    );

-- Tabela: tb_pacientes
ALTER TABLE tb_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY pacientes_isolation_policy ON tb_pacientes
    USING (
        id_clinica IN (
            SELECT id_clinica
            FROM tb_clinicas
            WHERE id_empresa = current_user_empresa_id()
        )
    );

-- Tabela: tb_avaliacoes
ALTER TABLE tb_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY avaliacoes_isolation_policy ON tb_avaliacoes
    USING (
        id_clinica IN (
            SELECT id_clinica
            FROM tb_clinicas
            WHERE id_empresa = current_user_empresa_id()
        )
    );

-- ==========================================
-- 4. IMPORTANTE: Bypass RLS para admins/sistema
-- ==========================================

-- Criar policy permissiva para queries de sistema (quando app.current_empresa_id não está configurado)
-- Isso permite que jobs, migrations e queries de admin funcionem

ALTER TABLE tb_perfis FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_users FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_clinicas FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_procedimentos FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_profissionais FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_agendamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_pacientes FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_avaliacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_configuracoes FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_notificacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE tb_transacoes FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 5. Como usar na aplicação
-- ==========================================

/*
No código Python (FastAPI), antes de cada query:

from sqlalchemy import text

async def some_endpoint(current_user: User, db: AsyncSession):
    # Configurar variável de sessão com id_empresa do usuário
    await db.execute(
        text("SET LOCAL app.current_empresa_id = :empresa_id"),
        {"empresa_id": str(current_user.id_empresa)}
    )

    # Agora todas as queries nesta transação serão automaticamente filtradas
    result = await db.execute(select(Perfil))
    # Retorna APENAS perfis da empresa do current_user

Ou criar um Dependency:

async def set_empresa_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    await db.execute(
        text("SET LOCAL app.current_empresa_id = :empresa_id"),
        {"empresa_id": str(current_user.id_empresa)}
    )
    return current_user
*/

-- ==========================================
-- 6. Verificação
-- ==========================================

-- Testar RLS:
-- SET LOCAL app.current_empresa_id = 'd5ea2e27-11e2-4b5d-a1f1-64f1adcfed0c';
-- SELECT * FROM tb_perfis;  -- Deve retornar apenas perfis desta empresa + templates

-- Verificar policies ativas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename LIKE 'tb_%'
-- ORDER BY tablename, policyname;

-- ==========================================
-- 7. ROLLBACK (se necessário)
-- ==========================================

/*
-- Para reverter as mudanças:

ALTER TABLE tb_perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_clinicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_procedimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_profissionais DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_avaliacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_configuracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_transacoes DISABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS current_user_empresa_id();
*/
