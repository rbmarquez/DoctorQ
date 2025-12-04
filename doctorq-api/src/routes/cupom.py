"""
Rotas para gerenciamento de cupons de desconto
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
import uuid

from src.config.orm_config import get_db
from src.services.cupom_service import CupomService
from src.config.logger_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/cupons", tags=["Cupons"])


# ====================================================================
# SCHEMAS
# ====================================================================

class ValidarCupomRequest(BaseModel):
    """Request para validar cupom"""
    ds_codigo: str = Field(..., description="Código do cupom")
    id_user: uuid.UUID = Field(..., description="ID do usuário")
    vl_carrinho: Decimal = Field(..., description="Valor total do carrinho")
    ds_produtos_ids: Optional[List[uuid.UUID]] = Field(None, description="IDs dos produtos no carrinho")
    ds_categorias_ids: Optional[List[uuid.UUID]] = Field(None, description="IDs das categorias")


class ValidarCupomResponse(BaseModel):
    """Response da validação de cupom"""
    valido: bool
    desconto: Decimal
    mensagem: str
    cupom: Optional[dict] = None


class ListarCuponsRequest(BaseModel):
    """Request para listar cupons disponíveis"""
    id_user: uuid.UUID = Field(..., description="ID do usuário")
    id_empresa: Optional[uuid.UUID] = Field(None, description="ID da empresa (opcional)")


# ====================================================================
# ENDPOINTS
# ====================================================================

@router.post("/validar", response_model=ValidarCupomResponse, status_code=status.HTTP_200_OK)
async def validar_cupom(
    request: ValidarCupomRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Valida um cupom de desconto

    Verificações realizadas:
    - Cupom existe e está ativo
    - Dentro do período de validade
    - Valor mínimo de compra atendido
    - Limite de usos não atingido
    - Usuário não excedeu limite de usos
    - Restrições de produtos/categorias
    - Primeira compra (se aplicável)

    Returns:
        ValidarCupomResponse: Resultado da validação com desconto calculado
    """
    try:
        logger.info(f"Validando cupom: {request.ds_codigo} para usuário {request.id_user}")

        resultado = await CupomService.validar_cupom(
            db=db,
            codigo=request.ds_codigo,
            user_id=request.id_user,
            valor_carrinho=request.vl_carrinho,
            produtos_ids=request.ds_produtos_ids,
            categorias_ids=request.ds_categorias_ids
        )

        return ValidarCupomResponse(**resultado)

    except Exception as e:
        logger.error(f"Erro ao validar cupom: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao validar cupom: {str(e)}"
        )


@router.post("/disponiveis", response_model=List[dict], status_code=status.HTTP_200_OK)
async def listar_cupons_disponiveis(
    request: ListarCuponsRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Lista todos os cupons disponíveis para um usuário

    Retorna apenas cupons:
    - Ativos
    - Dentro do período de validade
    - Que o usuário ainda pode usar (não excedeu limite)
    - Não esgotados

    Args:
        request: Request com id_user e opcionalmente id_empresa

    Returns:
        List[dict]: Lista de cupons disponíveis
    """
    try:
        logger.info(f"Listando cupons disponíveis para usuário {request.id_user}")

        cupons = await CupomService.listar_cupons_disponiveis(
            db=db,
            user_id=request.id_user,
            empresa_id=request.id_empresa
        )

        return cupons

    except Exception as e:
        logger.error(f"Erro ao listar cupons disponíveis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar cupons: {str(e)}"
        )


@router.get("/{codigo}", response_model=dict, status_code=status.HTTP_200_OK)
async def obter_cupom_por_codigo(
    codigo: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtém informações de um cupom pelo código (sem validar)

    Args:
        codigo: Código do cupom

    Returns:
        dict: Informações do cupom
    """
    try:
        from sqlalchemy import select, and_
        from src.models.cupom import CupomORM

        query = select(CupomORM).where(
            and_(
                CupomORM.ds_codigo == codigo.upper(),
                CupomORM.st_ativo == "S"
            )
        )
        result = await db.execute(query)
        cupom = result.scalar_one_or_none()

        if not cupom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cupom não encontrado"
            )

        return cupom.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar cupom: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar cupom: {str(e)}"
        )


# ====================================================================
# HEALTH CHECK
# ====================================================================

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check do módulo de cupons"""
    return {
        "status": "ok",
        "module": "cupons",
        "endpoints": [
            "POST /cupons/validar - Validar cupom",
            "POST /cupons/disponiveis - Listar cupons disponíveis",
            "GET /cupons/{codigo} - Obter cupom por código"
        ]
    }
