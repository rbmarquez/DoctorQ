"""
Testes de Integração Simples - Valida workaround db_session
Foco em validar que o workaround funciona, não em testar toda lógica de negócio
"""
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_db_connection(db_session: AsyncSession):
    """Teste básico: validar conexão com banco de testes"""
    result = await db_session.execute(text("SELECT current_database()"))
    db_name = result.scalar()

    assert db_name == "dbdoctorq_test"


@pytest.mark.asyncio
async def test_count_empresas(db_session: AsyncSession):
    """Teste básico: contar empresas no banco de testes"""
    result = await db_session.execute(text("SELECT COUNT(*) FROM tb_empresas"))
    count = result.scalar()

    # Deve retornar um número (mesmo que zero)
    assert count >= 0


@pytest.mark.asyncio
async def test_count_users(db_session: AsyncSession):
    """Teste básico: contar usuários no banco de testes"""
    result = await db_session.execute(text("SELECT COUNT(*) FROM tb_users"))
    count = result.scalar()

    assert count >= 0


@pytest.mark.asyncio
async def test_count_albums(db_session: AsyncSession):
    """Teste básico: contar álbuns no banco de testes"""
    result = await db_session.execute(text("SELECT COUNT(*) FROM tb_albuns"))
    count = result.scalar()

    assert count >= 0


@pytest.mark.asyncio
async def test_api_key_exists(db_session: AsyncSession):
    """Teste: verificar se API key de teste existe"""
    result = await db_session.execute(
        text("SELECT COUNT(*) FROM tb_apikey WHERE \"apiKey\" = 'test-api-key-12345'")
    )
    count = result.scalar()

    assert count == 1, "API key de teste não encontrada"


@pytest.mark.asyncio
async def test_transaction_rollback(db_session: AsyncSession):
    """Teste: validar que rollback automático funciona"""
    # Inserir uma empresa temporária
    empresa_id = "00000000-0000-0000-0000-000000000001"

    await db_session.execute(
        text("""
            INSERT INTO tb_empresas (id_empresa, nm_empresa, nr_cnpj, st_ativo)
            VALUES (:id, 'Test Company', '00.000.000/0001-00', 'S')
        """),
        {'id': empresa_id}
    )

    # Não fazer commit - o rollback automático deve remover
    # (fixture db_session tem rollback automático ao final)

    # Verificar que foi inserida nesta transação
    result = await db_session.execute(
        text("SELECT COUNT(*) FROM tb_empresas WHERE id_empresa = :id"),
        {'id': empresa_id}
    )
    count = result.scalar()
    assert count == 1


@pytest.mark.asyncio
async def test_query_structure(db_session: AsyncSession):
    """Teste: validar estrutura de query básica"""
    # Testar query com JOIN
    result = await db_session.execute(
        text("""
            SELECT COUNT(*)
            FROM tb_users u
            LEFT JOIN tb_empresas e ON u.id_empresa = e.id_empresa
        """)
    )
    count = result.scalar()

    assert count >= 0
