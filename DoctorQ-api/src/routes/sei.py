from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.services.sei.sei_common_service import get_sei_common_service
from src.utils.auth import get_current_apikey

router = APIRouter(prefix="/sei", tags=["SEI"])
logger = get_logger(__name__)


@router.get("/filter")
async def processar_documento(
    search: Optional[str] = Query(
        None, description="Pesquisa por palavras chave no procedimento"
    ),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    try:
        sei_common_service = get_sei_common_service(db_session=db)
        return await sei_common_service.get_processo(
            filtros={"palavras_chave": search}, nivel_acesso_publico=False, limit=3
        )
    except Exception as e:
        logger.error(f"Erro ao processar documento: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao processar documento: {str(e)}"
        )


@router.get("/atividade/{id_procedimento}")
async def listar_atividades_sei(
    id_procedimento: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Lista todas as atividades SEI de um procedimento especÃ­fico"""
    try:
        sei_common_service = get_sei_common_service(db_session=db)
        result = await sei_common_service.listar_atividades_sei(id_procedimento)

        if not result["success"]:
            raise HTTPException(
                status_code=404,
                detail=f"Nenhuma atividade encontrada para o procedimento {id_procedimento}",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar atividades SEI: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar atividades SEI: {str(e)}"
        )
