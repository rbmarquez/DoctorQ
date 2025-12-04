import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.services import mcp_service


async def execute_mcp_query(db: AsyncSession, mcp_id: str, query: str):
    """
    Executa uma consulta usando a configuraÃ§Ã£o de um MCP especÃ­fico.
    """
    mcp = await mcp_service.get_mcp_by_id(db, mcp_id)
    if not mcp:
        raise HTTPException(
            status_code=404, detail=f"MCP com id {mcp_id} nÃ£o encontrado."
        )

    try:
        config = mcp.config_mcp
        base_url = config.get("base_url")
        endpoint = config.get("endpoints", {}).get("search")
        headers = config.get("headers", {})

        if not base_url or not endpoint:
            raise HTTPException(status_code=400, detail="ConfiguraÃ§Ã£o do MCP invÃ¡lida")

        headers = await mcp_service.resolve_headers_with_env(db, headers)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Erro na configuraÃ§Ã£o do MCP id {mcp_id}: {e}"
        )

    payload = {"q": query}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{base_url}{endpoint}", headers=headers, json=payload, timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Erro no servidor MCP externo: {e.response.text}",
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"NÃ£o foi possÃ­vel conectar ao servidor MCP externo: {e}",
            )
