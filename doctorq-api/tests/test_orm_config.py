"""Teste direto do ORMConfig"""
import pytest
from sqlalchemy import text
from tests.conftest import db_session

@pytest.mark.asyncio
async def test_orm_config_database(db_session):
    """Verifica se ORMConfig está usando banco de testes"""
    
    # Query database name
    result = await db_session.execute(text("SELECT current_database()"))
    db_name = result.scalar()
    print(f"✅ Banco conectado: {db_name}")
    assert db_name == "dbdoctorq_test", f"Esperado 'dbdoctorq_test', obteve '{db_name}'"
    
    # Check API key exists
    result = await db_session.execute(
        text("SELECT COUNT(*) FROM tb_apikey WHERE \"apiKey\" = 'test-api-key-12345'")
    )
    count = result.scalar()
    print(f"✅ API Keys encontradas: {count}")
    assert count == 1, f"Esperado 1 API key, encontrado {count}"
