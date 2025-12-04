"""
Rotas de Nota Fiscal Eletrônica - UC063
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.nota_fiscal import (
    NotaFiscalCreate,
    NotaFiscalResponse,
    NotaFiscalListResponse,
    NotaFiscalCancelar,
    NotaFiscalReenvio,
    NotaFiscalEstatisticas
)
from src.models.user import User
from src.services.nota_fiscal_service import NotaFiscalService

router = APIRouter(prefix="/notas-fiscais", tags=["Notas Fiscais"])


@router.post("/", response_model=NotaFiscalResponse, status_code=status.HTTP_201_CREATED)
async def emitir_nota_fiscal(
    data: NotaFiscalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "financeiro"]))
):
    """
    Emite nota fiscal eletrônica (NFSe)

    **Permissões:** admin, gestor_clinica, financeiro

    **Processo:**
    1. Valida dados do tomador e serviço
    2. Calcula ISS e demais tributos
    3. Gera RPS (Recibo Provisório)
    4. Envia para API do provedor (Focus NFe, eNotas, etc)
    5. Retorna nota emitida
    6. Envia email para cliente

    **Provedores Suportados:**
    - focus_nfe: Focus NFe (recomendado)
    - enotas: eNotas
    - nfse_nacional: NFSe Nacional (Gov.br)

    **Observações:**
    - Requer CNPJ e Inscrição Municipal cadastrados
    - Alíquota ISS varia por município (padrão 5%)
    - Notas ficam com status "pendente" se houver erro na emissão
    """
    try:
        nota = await NotaFiscalService.criar_nota_fiscal(
            db=db,
            id_empresa=current_user.id_empresa,
            data=data
        )
        return NotaFiscalResponse.model_validate(nota)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao emitir nota fiscal: {str(e)}"
        )


@router.get("/", response_model=NotaFiscalListResponse)
async def listar_notas_fiscais(
    status_nota: Optional[str] = Query(None, description="Filtrar por status: pendente|emitida|cancelada|erro"),
    dt_inicio: Optional[datetime] = Query(None, description="Data início"),
    dt_fim: Optional[datetime] = Query(None, description="Data fim"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista notas fiscais emitidas

    **Permissões:** Qualquer usuário autenticado

    **Filtros:**
    - status: pendente, emitida, cancelada, erro
    - dt_inicio/dt_fim: Período de emissão
    """
    notas, total = await NotaFiscalService.listar_notas(
        db=db,
        id_empresa=current_user.id_empresa,
        status=status_nota,
        dt_inicio=dt_inicio,
        dt_fim=dt_fim,
        page=page,
        size=size
    )

    items = [NotaFiscalResponse.model_validate(n) for n in notas]

    return NotaFiscalListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/{id_nota_fiscal}/", response_model=NotaFiscalResponse)
async def buscar_nota_fiscal(
    id_nota_fiscal: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca nota fiscal por ID

    **Permissões:** Qualquer usuário autenticado

    **Retorna:**
    - Dados completos da nota
    - Links para PDF e visualização
    - Chave de acesso
    """
    from src.models.nota_fiscal import TbNotaFiscal
    from sqlalchemy import select

    query = select(TbNotaFiscal).where(
        TbNotaFiscal.id_nota_fiscal == id_nota_fiscal,
        TbNotaFiscal.id_empresa == current_user.id_empresa
    )
    result = await db.execute(query)
    nota = result.scalar_one_or_none()

    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota fiscal não encontrada"
        )

    return NotaFiscalResponse.model_validate(nota)


@router.post("/{id_nota_fiscal}/cancelar/", response_model=NotaFiscalResponse)
async def cancelar_nota_fiscal(
    id_nota_fiscal: UUID,
    data: NotaFiscalCancelar,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "financeiro"]))
):
    """
    Cancela nota fiscal emitida

    **Permissões:** admin, gestor_clinica, financeiro

    **Regras:**
    - Apenas notas emitidas podem ser canceladas
    - Motivo deve ter no mínimo 15 caracteres
    - Cancelamento é irreversível
    - Cancela também na prefeitura (via API do provedor)

    **Prazos:**
    - A maioria dos municípios permite cancelamento até 24h
    - Consultar legislação local
    """
    try:
        nota = await NotaFiscalService.cancelar_nota_fiscal(
            db=db,
            id_nota_fiscal=id_nota_fiscal,
            motivo=data.motivo
        )
        return NotaFiscalResponse.model_validate(nota)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao cancelar nota: {str(e)}"
        )


@router.post("/{id_nota_fiscal}/reenviar/", status_code=status.HTTP_200_OK)
async def reenviar_nota_fiscal(
    id_nota_fiscal: UUID,
    data: NotaFiscalReenvio,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "financeiro", "recepcionista"]))
):
    """
    Reenvia nota fiscal por email

    **Permissões:** admin, gestor_clinica, financeiro, recepcionista

    **Útil para:**
    - Cliente não recebeu o email original
    - Enviar para email alternativo
    - Reenviar após correção de dados
    """
    try:
        sucesso = await NotaFiscalService.reenviar_email(
            db=db,
            id_nota_fiscal=id_nota_fiscal,
            email=data.email
        )

        return {
            "message": "Nota fiscal reenviada com sucesso",
            "email": data.email,
            "id_nota_fiscal": id_nota_fiscal
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao reenviar nota: {str(e)}"
        )


@router.get("/estatisticas/", response_model=NotaFiscalEstatisticas)
async def obter_estatisticas_notas(
    dt_inicio: Optional[datetime] = Query(None, description="Data início"),
    dt_fim: Optional[datetime] = Query(None, description="Data fim"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "financeiro"]))
):
    """
    Obtém estatísticas de notas fiscais

    **Permissões:** admin, gestor_clinica, financeiro

    **Métricas:**
    - Total de notas emitidas
    - Total canceladas
    - Total pendentes
    - Total com erro
    - Valor total faturado
    - Valor total de ISS
    - Valor total de tributos
    """
    stats = await NotaFiscalService.obter_estatisticas(
        db=db,
        id_empresa=current_user.id_empresa,
        dt_inicio=dt_inicio,
        dt_fim=dt_fim
    )

    return NotaFiscalEstatisticas(**stats)


@router.post("/{id_nota_fiscal}/reemitir/", response_model=NotaFiscalResponse)
async def reemitir_nota_fiscal(
    id_nota_fiscal: UUID,
    provedor: str = Query("focus_nfe", description="focus_nfe | enotas | nfse_nacional"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Tenta reemitir nota fiscal com erro

    **Permissões:** admin, gestor_clinica

    **Útil para:**
    - Notas que falharam na emissão
    - Retry após correção de credenciais
    - Trocar de provedor
    """
    try:
        nota = await NotaFiscalService.emitir_nota_fiscal(
            db=db,
            id_nota_fiscal=id_nota_fiscal,
            provedor=provedor
        )
        return NotaFiscalResponse.model_validate(nota)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao reemitir nota: {str(e)}"
        )
