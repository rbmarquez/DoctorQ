import asyncio
from dotenv import load_dotenv
from sqlalchemy import text

from src.config.orm_config import ORMConfig
from src.config.logger_config import get_logger


logger = get_logger(__name__)


async def ensure_password_hash_column():
    await ORMConfig.initialize_database(max_retries=1)
    if not ORMConfig.async_engine:
        raise RuntimeError("Async engine not initialized")
    async with ORMConfig.async_engine.begin() as conn:
        try:
            await conn.execute(
                text(
                    "ALTER TABLE tb_users ADD COLUMN IF NOT EXISTS nm_password_hash VARCHAR(255)"
                )
            )
            logger.info("Added nm_password_hash column to tb_users (if missing)")
        except Exception as e:
            logger.error(f"Failed to add nm_password_hash: {e}")
            raise
    await ORMConfig.close_connections()


async def ensure_microsoft_id_nullable():
    await ORMConfig.initialize_database(max_retries=1)
    if not ORMConfig.async_engine:
        raise RuntimeError("Async engine not initialized")
    async with ORMConfig.async_engine.begin() as conn:
        try:
            await conn.execute(
                text(
                    "ALTER TABLE tb_users ALTER COLUMN nm_microsoft_id DROP NOT NULL"
                )
            )
            logger.info("Dropped NOT NULL from nm_microsoft_id (if present)")
        except Exception as e:
            logger.error(f"Failed to drop NOT NULL from nm_microsoft_id: {e}")
            raise
    await ORMConfig.close_connections()


async def run_all():
    await ensure_password_hash_column()
    await ensure_microsoft_id_nullable()


def main() -> int:
    load_dotenv(override=True)
    asyncio.run(run_all())
    print("Users schema ensured: password hash + microsoft_id nullable")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())