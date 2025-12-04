"""
Rotas para gerenciamento de Favoritos (Vagas)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.config.orm_config import get_db
from src.schemas.favorito_schema import (
    CriarFavoritoRequest,
    FavoritoResponse,
)
from src.services.favorito_service import FavoritoService
from src.utils.auth import get_current_user

router = APIRouter(prefix="/favoritos", tags=["Favoritos"])


@router.post("/", response_model=FavoritoResponse, status_code=status.HTTP_201_CREATED)
async def adicionar_favorito(
    data: CriarFavoritoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Adiciona uma vaga aos favoritos do usuário

    **Permissões:** Usuário autenticado
    """
    try:
        favorito = await FavoritoService.adicionar_favorito(
            db, str(current_user.id_user), data
        )
        return FavoritoResponse.from_orm(favorito)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.delete("/{id_vaga}/", status_code=status.HTTP_204_NO_CONTENT)
async def remover_favorito(
    id_vaga: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Remove uma vaga dos favoritos do usuário

    **Permissões:** Usuário autenticado
    """
    try:
        await FavoritoService.remover_favorito(
            db, str(current_user.id_user), id_vaga
        )
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/verificar/{id_vaga}/", response_model=dict)
async def verificar_favorito(
    id_vaga: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Verifica se uma vaga está nos favoritos do usuário

    **Permissões:** Usuário autenticado

    **Returns:** { "is_favorito": bool }
    """
    try:
        is_favorito = await FavoritoService.verificar_favorito(
            db, str(current_user.id_user), id_vaga
        )
        return {"is_favorito": is_favorito}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/", response_model=List[FavoritoResponse])
async def listar_favoritos(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Lista todos os favoritos do usuário autenticado

    **Permissões:** Usuário autenticado
    """
    try:
        favoritos = await FavoritoService.listar_favoritos(
            db, str(current_user.id_user)
        )
        return [FavoritoResponse.from_orm(fav) for fav in favoritos]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
