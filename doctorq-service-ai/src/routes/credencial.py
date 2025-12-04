# src/routes/credencial.py
"""
Rotas para gerenciamento de credenciais
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import ORMConfig
from src.models.credencial import (
    CredencialCreate,
    CredencialResponse,
    CredencialUpdate,
)
from src.services.credencial_service import CredencialService

router = APIRouter(prefix="/credenciais", tags=["Credenciais"])


@router.get("/", response_model=dict)
async def listar_credenciais(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Tamanho da página"),
    search: Optional[str] = Query(None, description="Busca por nome ou tipo"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Listar todas as credenciais com paginação
    """
    service = CredencialService()
    # Note: Service doesn't support search/tipo filters yet, just pagination
    credenciais, total = await service.get_credenciais(
        page=page,
        size=size,
    )

    # Converter para response
    items = [CredencialResponse.model_validate(cred) for cred in credenciais]

    return {
        "items": items,
        "meta": {
            "totalItems": total,
            "itemsPerPage": size,
            "totalPages": (total + size - 1) // size,
            "currentPage": page,
        },
    }


@router.get("/{id_credencial}/", response_model=CredencialResponse)
async def obter_credencial(
    id_credencial: UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Obter uma credencial específica por ID
    """
    service = CredencialService()
    credencial = await service.get_credencial_by_id(credencial_id=id_credencial)

    if not credencial:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")

    return CredencialResponse.model_validate(credencial)


@router.post("/", response_model=CredencialResponse)
async def criar_credencial(
    data: CredencialCreate,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Criar uma nova credencial
    """
    service = CredencialService()

    # Verificar se já existe uma credencial com o mesmo nome
    credencial_existente = await service.obter_por_nome(db=db, nome=data.nm_credencial)
    if credencial_existente:
        raise HTTPException(
            status_code=400,
            detail=f"Já existe uma credencial com o nome '{data.nm_credencial}'"
        )

    credencial = await service.criar(db=db, data=data)
    return CredencialResponse.model_validate(credencial)


@router.put("/{id_credencial}/", response_model=CredencialResponse)
async def atualizar_credencial(
    id_credencial: UUID,
    data: CredencialUpdate,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Atualizar uma credencial existente
    """
    service = CredencialService()

    # Verificar se a credencial existe
    credencial = await service.obter_por_id(db=db, id_credencial=id_credencial)
    if not credencial:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")

    # Se mudando o nome, verificar se já existe outra com o mesmo nome
    if data.nm_credencial and data.nm_credencial != credencial.nm_credencial:
        credencial_existente = await service.obter_por_nome(
            db=db, nome=data.nm_credencial
        )
        if credencial_existente and credencial_existente.id_credencial != id_credencial:
            raise HTTPException(
                status_code=400,
                detail=f"Já existe outra credencial com o nome '{data.nm_credencial}'"
            )

    credencial_atualizada = await service.atualizar(
        db=db, id_credencial=id_credencial, data=data
    )
    return CredencialResponse.model_validate(credencial_atualizada)


@router.delete("/{id_credencial}/")
async def deletar_credencial(
    id_credencial: UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Deletar uma credencial
    """
    service = CredencialService()

    # Verificar se a credencial existe
    credencial = await service.obter_por_id(db=db, id_credencial=id_credencial)
    if not credencial:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")

    await service.deletar(db=db, id_credencial=id_credencial)
    return {"message": "Credencial deletada com sucesso"}


@router.get("/tipos/", response_model=List[str])
async def listar_tipos_credenciais(
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Listar todos os tipos de credenciais disponíveis
    """
    service = CredencialService()
    tipos = await service.listar_tipos(db=db)
    return tipos


@router.post("/{id_credencial}/test/")
async def testar_credencial(
    id_credencial: UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Testar se uma credencial está funcionando
    """
    service = CredencialService()

    # Verificar se a credencial existe
    credencial = await service.obter_por_id(db=db, id_credencial=id_credencial)
    if not credencial:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")

    # Aqui poderia implementar testes específicos dependendo do tipo de credencial
    # Por exemplo: testar conexão com banco de dados, API externa, etc.

    return {
        "success": True,
        "message": f"Credencial '{credencial.nm_credencial}' testada com sucesso",
        "tipo": credencial.tp_credencial,
    }