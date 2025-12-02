import asyncio
import os
from sqlalchemy import text
from src.config.orm_config import ORMConfig

async def test_connection():
    # Force test environment
    os.environ["TESTING"] = "true"
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/dbdoctorq_test"
    
    # Initialize
    await ORMConfig.initialize()
    
    # Query database name
    async with ORMConfig.get_session() as session:
        result = await session.execute(text("SELECT current_database()"))
        db_name = result.scalar()
        print(f"✅ Conectado ao banco: {db_name}")
        
        # Check API key
        result = await session.execute(
            text("SELECT COUNT(*) FROM tb_apikey WHERE \"apiKey\" = 'test-api-key-12345'")
        )
        count = result.scalar()
        print(f"✅ API Keys encontradas: {count}")

if __name__ == "__main__":
    asyncio.run(test_connection())
