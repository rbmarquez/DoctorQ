from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.config.orm_config import get_db
from src.schemas.vaga_schema import (
    CriarVagaRequest,
    AtualizarVagaRequest,
    VagaResponse,
    VagaListResponse,
    VagasFiltros,
    AtualizarStatusVagaRequest
)
from src.services.vaga_service import VagaService
from src.utils.auth import get_current_user

router = APIRouter(prefix="/vagas", tags=["Vagas"])


@router.post("/", response_model=VagaResponse, status_code=status.HTTP_201_CREATED)
async def criar_vaga(
    data: CriarVagaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cria uma nova vaga de emprego

    **Permissões:** Empresa (clinica, profissional, fornecedor)
    """
    try:
        vaga = await VagaService.criar_vaga(
            db,
            data,
            str(current_user.id_empresa),
            current_user.id_user
        )
        return VagaResponse.from_orm(vaga)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=VagaListResponse)
async def listar_vagas(
    nm_cargo: str = None,
    nm_area: str = None,
    nm_cidade: str = None,
    nm_estado: str = None,
    nm_nivel: str = None,
    nm_tipo_contrato: str = None,
    nm_regime_trabalho: str = None,
    fg_aceita_remoto: bool = None,
    fg_destaque: bool = None,
    ds_status: str = "aberta",
    page: int = 1,
    size: int = 12,
    db: AsyncSession = Depends(get_db)
):
    """
    Lista vagas públicas com filtros (para candidatos)

    **Filtros disponíveis:**
    - nm_cargo: Cargo (busca parcial)
    - nm_area: Área (Estética Facial, Corporal, etc.)
    - nm_cidade: Cidade (busca parcial)
    - nm_estado: Estado (sigla, ex: SP)
    - nm_nivel: Nível (estagiario, junior, pleno, senior, especialista)
    - nm_tipo_contrato: Tipo (clt, pj, estagio, temporario, freelance)
    - nm_regime_trabalho: Regime (presencial, remoto, hibrido)
    - fg_aceita_remoto: Aceita remoto (true/false)
    - fg_destaque: Apenas vagas em destaque (true/false)
    - ds_status: Status (padrão: aberta)
    - page: Página (padrão: 1)
    - size: Itens por página (padrão: 12, máx: 100)
    """
    try:
        filtros = VagasFiltros(
            nm_cargo=nm_cargo,
            nm_area=nm_area,
            nm_cidade=nm_cidade,
            nm_estado=nm_estado,
            nm_nivel=nm_nivel,
            nm_tipo_contrato=nm_tipo_contrato,
            nm_regime_trabalho=nm_regime_trabalho,
            fg_aceita_remoto=fg_aceita_remoto,
            fg_destaque=fg_destaque,
            ds_status=ds_status,
            page=page,
            size=size
        )

        return await VagaService.listar_vagas(db, filtros)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/minhas/", response_model=VagaListResponse)
async def listar_minhas_vagas(
    ds_status: str = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista vagas da empresa logada

    **Permissões:** Empresa

    **Filtros:**
    - ds_status: Status (aberta, pausada, fechada, expirada)
    - page: Página (padrão: 1)
    - size: Itens por página (padrão: 20)
    """
    try:
        filtros = VagasFiltros(
            id_empresa=str(current_user.id_empresa),
            ds_status=ds_status,
            page=page,
            size=size
        )

        return await VagaService.listar_minhas_vagas(
            db,
            str(current_user.id_empresa),
            filtros
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{id_vaga}/", response_model=VagaResponse)
async def obter_vaga(
    id_vaga: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna detalhes de uma vaga específica

    **Importante:** Incrementa contador de visualizações
    """
    try:
        vaga = await VagaService.buscar_por_id(db, id_vaga)

        if not vaga:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaga não encontrada"
            )

        # Incrementar visualizações
        await VagaService.incrementar_visualizacoes(db, id_vaga)

        return VagaResponse.from_orm(vaga)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{id_vaga}/", response_model=VagaResponse)
async def atualizar_vaga(
    id_vaga: str,
    data: AtualizarVagaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza uma vaga existente

    **Apenas a empresa proprietária pode atualizar**
    """
    try:
        vaga = await VagaService.atualizar_vaga(
            db,
            id_vaga,
            data,
            current_user.id_empresa
        )
        return VagaResponse.from_orm(vaga)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{id_vaga}/status/", response_model=VagaResponse)
async def atualizar_status_vaga(
    id_vaga: str,
    data: AtualizarStatusVagaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza status da vaga (aberta, pausada, fechada)

    **Apenas a empresa proprietária pode atualizar**
    """
    try:
        vaga = await VagaService.atualizar_status_vaga(
            db,
            id_vaga,
            data,
            str(current_user.id_empresa)
        )
        return VagaResponse.from_orm(vaga)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{id_vaga}/", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_vaga(
    id_vaga: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Deleta uma vaga

    **Apenas a empresa proprietária pode deletar**
    """
    try:
        await VagaService.deletar_vaga(
            db,
            id_vaga,
            current_user.id_empresa
        )
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
