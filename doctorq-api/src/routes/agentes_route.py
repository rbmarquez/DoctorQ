# src/routes/agentes_route.py
"""
Rotas para gerenciamento de Agentes de IA.
"""

import uuid
from typing import Optional, List, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.config.logger_config import get_logger
from src.utils.auth import get_current_user, get_empresa_from_user

logger = get_logger(__name__)

router = APIRouter(
    prefix="/agentes",
    tags=["Agentes"],
)


# =============================================================================
# Schemas
# =============================================================================


class AgenteResponse(BaseModel):
    """Schema de resposta para agente."""

    id_agente: str
    nm_agente: str
    ds_agente: Optional[str] = None
    ds_tipo: Optional[str] = None
    nm_modelo: Optional[str] = None
    nm_provider: Optional[str] = None
    st_principal: bool = False
    st_ativo: bool = True

    class Config:
        from_attributes = True


class AgenteListResponse(BaseModel):
    """Schema de resposta para lista de agentes."""

    items: List[AgenteResponse]
    total: int
    page: int
    page_size: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("/", response_model=AgenteListResponse)
async def listar_agentes(
    st_principal: Optional[bool] = Query(None, description="Filtrar por agente principal"),
    st_ativo: Optional[bool] = Query(True, description="Filtrar por status ativo"),
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: int = Query(20, ge=1, le=100, description="Itens por página"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Lista os agentes de IA da empresa do usuário.

    Permite filtrar por agente principal e status.
    """
    try:
        # Obter empresa do usuário
        id_empresa = get_empresa_from_user(current_user)

        if not id_empresa:
            raise HTTPException(
                status_code=400,
                detail="Usuário não está vinculado a nenhuma empresa"
            )

        # Construir query
        conditions = ["id_empresa = :id_empresa"]
        params = {"id_empresa": id_empresa}

        if st_principal is not None:
            conditions.append("st_principal = :st_principal")
            params["st_principal"] = st_principal

        if st_ativo is not None:
            conditions.append("st_ativo = :st_ativo")
            params["st_ativo"] = st_ativo

        where_clause = " AND ".join(conditions)

        # Contar total
        count_query = f"SELECT COUNT(*) FROM tb_agentes WHERE {where_clause}"
        count_result = await db.execute(text(count_query), params)
        total = count_result.scalar() or 0

        # Buscar agentes com paginação
        offset = (page - 1) * page_size
        params["limit"] = page_size
        params["offset"] = offset

        query = f"""
            SELECT
                id_agente,
                nm_agente,
                ds_agente,
                ds_tipo,
                nm_modelo,
                nm_provider,
                st_principal,
                st_ativo
            FROM tb_agentes
            WHERE {where_clause}
            ORDER BY st_principal DESC, nm_agente ASC
            LIMIT :limit OFFSET :offset
        """

        result = await db.execute(text(query), params)
        rows = result.fetchall()

        items = [
            AgenteResponse(
                id_agente=str(row.id_agente),
                nm_agente=row.nm_agente,
                ds_agente=row.ds_agente,
                ds_tipo=row.ds_tipo,
                nm_modelo=row.nm_modelo,
                nm_provider=row.nm_provider,
                st_principal=row.st_principal,
                st_ativo=row.st_ativo,
            )
            for row in rows
        ]

        return AgenteListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar agentes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno ao listar agentes")


@router.get("/{id_agente}", response_model=AgenteResponse)
async def obter_agente(
    id_agente: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtém detalhes de um agente específico.
    """
    try:
        id_empresa = get_empresa_from_user(current_user)

        if not id_empresa:
            raise HTTPException(
                status_code=400,
                detail="Usuário não está vinculado a nenhuma empresa"
            )

        result = await db.execute(
            text("""
                SELECT
                    id_agente,
                    nm_agente,
                    ds_agente,
                    ds_tipo,
                    nm_modelo,
                    nm_provider,
                    st_principal,
                    st_ativo
                FROM tb_agentes
                WHERE id_agente = :id_agente
                  AND id_empresa = :id_empresa
            """),
            {"id_agente": id_agente, "id_empresa": id_empresa}
        )
        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Agente não encontrado"
            )

        return AgenteResponse(
            id_agente=str(row.id_agente),
            nm_agente=row.nm_agente,
            ds_agente=row.ds_agente,
            ds_tipo=row.ds_tipo,
            nm_modelo=row.nm_modelo,
            nm_provider=row.nm_provider,
            st_principal=row.st_principal,
            st_ativo=row.st_ativo,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter agente: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno")
