from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.config.orm_config import get_db
from src.schemas.curriculo_schema import (
    CriarCurriculoRequest,
    AtualizarCurriculoRequest,
    CurriculoResponse,
    CurriculoListResponse,
    CurriculoFiltros
)
from src.services.curriculo_service import CurriculoService
from src.utils.auth import get_current_user  # Assumindo que existe

router = APIRouter(prefix="/curriculos", tags=["Currículos"])


@router.post("/", response_model=CurriculoResponse, status_code=status.HTTP_201_CREATED)
async def criar_curriculo(
    data: CriarCurriculoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cria um novo currículo para o usuário logado
    """
    try:
        curriculo = await CurriculoService.criar_curriculo(
            db,
            data,
            str(current_user.id_user)
        )
        return CurriculoResponse.from_orm(curriculo)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=CurriculoListResponse)
async def listar_curriculos(
    nm_cargo: str = None,
    nm_cidade: str = None,
    nm_estado: str = None,
    nm_nivel: str = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Lista currículos públicos com filtros (para recrutadores)

    **Filtros disponíveis:**
    - nm_cargo: Cargo desejado (busca parcial)
    - nm_cidade: Cidade (busca parcial)
    - nm_estado: Estado (sigla, ex: SP)
    - nm_nivel: Nível de experiência (estagiario, junior, pleno, senior, especialista)
    - page: Página (padrão: 1)
    - size: Itens por página (padrão: 20, máx: 100)
    """
    try:
        filtros = CurriculoFiltros(
            nm_cargo=nm_cargo,
            nm_cidade=nm_cidade,
            nm_estado=nm_estado,
            nm_nivel=nm_nivel,
            fg_visivel_recrutadores=True,
            page=page,
            size=size
        )

        return await CurriculoService.listar_curriculos(db, filtros)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/meu/", response_model=CurriculoResponse)
async def obter_meu_curriculo(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retorna o currículo do usuário logado
    """
    try:
        curriculo = await CurriculoService.buscar_por_usuario(db, str(current_user.id_user))

        if not curriculo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Você ainda não cadastrou um currículo"
            )

        return CurriculoResponse.from_orm(curriculo)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{id_curriculo}/", response_model=CurriculoResponse)
async def obter_curriculo(
    id_curriculo: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna detalhes de um currículo específico

    **Importante:** Incrementa contador de visualizações
    """
    try:
        curriculo = await CurriculoService.buscar_por_id(db, id_curriculo)

        if not curriculo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Currículo não encontrado"
            )

        # Incrementar visualizações
        await CurriculoService.incrementar_visualizacoes(db, id_curriculo)

        return CurriculoResponse.from_orm(curriculo)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{id_curriculo}/", response_model=CurriculoResponse)
async def atualizar_curriculo(
    id_curriculo: str,
    data: AtualizarCurriculoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza um currículo existente

    **Apenas o proprietário pode atualizar**
    """
    try:
        curriculo = await CurriculoService.atualizar_curriculo(
            db,
            id_curriculo,
            data,
            str(current_user.id_user)
        )
        return CurriculoResponse.from_orm(curriculo)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{id_curriculo}/", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_curriculo(
    id_curriculo: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Deleta um currículo

    **Apenas o proprietário pode deletar**
    """
    try:
        await CurriculoService.deletar_curriculo(
            db,
            id_curriculo,
            str(current_user.id_user)
        )
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{id_curriculo}/visibilidade/", response_model=CurriculoResponse)
async def alterar_visibilidade_curriculo(
    id_curriculo: str,
    visivel: bool,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Altera visibilidade do currículo para recrutadores

    **Query Params:**
    - visivel: true ou false
    """
    try:
        curriculo = await CurriculoService.alterar_visibilidade(
            db,
            id_curriculo,
            str(current_user.id_user),
            visivel
        )
        return CurriculoResponse.from_orm(curriculo)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
