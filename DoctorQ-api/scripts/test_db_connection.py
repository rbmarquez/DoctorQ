import asyncio
import json
from dotenv import load_dotenv

from src.config.orm_config import ORMConfig


async def run_test() -> int:
    try:
        ok = await ORMConfig.initialize_database(max_retries=1)
        health = await ORMConfig.health_check()
        print(json.dumps({"initialized": ok, "health": health}))
        await ORMConfig.close_connections()
        return 0
    except Exception as e:
        print(json.dumps({"initialized": False, "error": str(e)}))
        return 1


def main() -> int:
    load_dotenv(override=True)
    return asyncio.run(run_test())


if __name__ == "__main__":
    raise SystemExit(main())