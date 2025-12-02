from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.models import mcp_schema
from src.services import mcp_service

router = APIRouter(prefix="/mcp", tags=["MCP"])


@router.post("/", response_model=mcp_schema.MCPRead)
async def create_mcp(payload: mcp_schema.MCPCreate, db: AsyncSession = Depends(get_db)):
    """Cria um novo MCP (delegado para service)."""
    try:
        return await mcp_service.create_mcp(db, payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro interno ao criar MCP: {str(e)}"
        )


@router.get("/", response_model=List[mcp_schema.MCPRead])
async def list_mcps(db: AsyncSession = Depends(get_db)):
    """Lista todos os MCPs (env_variables mascaradas)."""
    try:
        mcps = await mcp_service.list_mcps(db)
        for mcp in mcps:
            if mcp.env_variables:
                mcp.env_variables = {k: "********" for k in mcp.env_variables.keys()}
        return mcps
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar MCPs: {str(e)}")


@router.get("/{mcp_id}", response_model=mcp_schema.MCPRead)
async def get_mcp(mcp_id: UUID, db: AsyncSession = Depends(get_db)):
    """Busca um MCP por ID (env_variables mascaradas)."""
    try:
        mcp = await mcp_service.get_mcp_by_id(db, mcp_id)
        if not mcp:
            raise HTTPException(status_code=404, detail="MCP nÃ£o encontrado")

        if mcp.env_variables:
            mcp.env_variables = {k: "********" for k in mcp.env_variables.keys()}
        return mcp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao buscar MCP {mcp_id}: {str(e)}"
        )


@router.put("/{mcp_id}", response_model=mcp_schema.MCPRead)
async def update_mcp(
    mcp_id: UUID, payload: mcp_schema.MCPUpdate, db: AsyncSession = Depends(get_db)
):
    """Atualiza um MCP existente."""
    try:
        updated = await mcp_service.update_mcp(db, mcp_id, payload)
        if not updated:
            raise HTTPException(status_code=404, detail="MCP nÃ£o encontrado")

        if updated.env_variables:
            updated.env_variables = {
                k: "********" for k in updated.env_variables.keys()
            }
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao atualizar MCP {mcp_id}: {str(e)}"
        )


@router.delete("/{mcp_id}")
async def delete_mcp(mcp_id: UUID, db: AsyncSession = Depends(get_db)):
    """Exclui um MCP e sua Tool vinculada."""
    try:
        deleted = await mcp_service.delete_mcp(db, mcp_id)
        if not deleted:
            return {"message": f"Nenhum MCP com id {mcp_id} encontrado"}
        return {"message": f"MCP {mcp_id} excluÃ­do com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao excluir MCP {mcp_id}: {str(e)}"
        )
