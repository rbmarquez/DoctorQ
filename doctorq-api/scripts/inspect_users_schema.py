import asyncio
from dotenv import load_dotenv
from sqlalchemy import text

from src.config.orm_config import ORMConfig


async def inspect_users_columns() -> int:
    await ORMConfig.initialize_database(max_retries=1)
    if not ORMConfig.async_engine:
        print("{\"error\": \"Async engine not initialized\"}")
        return 1
    async with ORMConfig.async_engine.begin() as conn:
        # Query information_schema for column nullability
        result = await conn.execute(
            text(
                """
                SELECT column_name, is_nullable, data_type
                FROM information_schema.columns
                WHERE table_name = 'tb_users'
                ORDER BY ordinal_position
                """
            )
        )
        rows = result.fetchall()
        data = [
            {
                "column": r[0],
                "nullable": r[1],
                "type": r[2],
            }
            for r in rows
        ]
        import json
        print(json.dumps({"tb_users": data}, ensure_ascii=False))
    await ORMConfig.close_connections()
    return 0


def main() -> int:
    load_dotenv(override=True)
    return asyncio.run(inspect_users_columns())


if __name__ == "__main__":
    raise SystemExit(main())