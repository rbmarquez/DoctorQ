from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.models.mcp_schema import MCPClientRequest, MCPClientResponse
from src.services import mcp_service

router = APIRouter(prefix="/mcp-client", tags=["MCP Client"])


@router.post("/execute", response_model=MCPClientResponse)
async def execute_mcp(request: MCPClientRequest, db: AsyncSession = Depends(get_db)):
    """Executa um MCP externo (delegado para o serviÃ§o)."""
    try:
        return await mcp_service.execute_mcp_client(db, request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro inesperado ao executar MCP: {str(e)}"
        )
