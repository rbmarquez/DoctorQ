"""
Rotas de Gestão de Estoque - UC043
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.estoque import (
    MovimentacaoCreate,
    MovimentacaoResponse,
    MovimentacaoListResponse,
    ReservaEstoqueCreate,
    ReservaEstoqueResponse,
    EstoqueAlertaResponse,
    EstoqueResumoResponse
)
from src.models.user import User
from src.services.estoque_service import EstoqueService

router = APIRouter(prefix="/estoque", tags=["Estoque"])


@router.post("/movimentacoes/", response_model=MovimentacaoResponse, status_code=status.HTTP_201_CREATED)
async def criar_movimentacao(
    data: MovimentacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista"]))
):
    """
    Cria movimentação de estoque

    **Permissões:** admin, gestor_clinica, recepcionista

    **Tipos de movimentação:**
    - entrada: Entrada de produtos (compra, recebimento)
    - saida: Saída de produtos (venda, consumo)
    - ajuste: Ajuste manual de estoque
    - reserva: Reserva para agendamento
    - devolucao: Devolução de produto

    **Regras:**
    - Valida estoque disponível para saídas
    - Atualiza nr_quantidade_estoque em tb_produtos
    - Registra usuário responsável
    """
    try:
        movimentacao = await EstoqueService.criar_movimentacao(
            db=db,
            id_empresa=current_user.id_empresa,
            id_user=current_user.id_user,
            data=data
        )
        return MovimentacaoResponse.model_validate(movimentacao)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar movimentação: {str(e)}"
        )


@router.get("/movimentacoes/", response_model=MovimentacaoListResponse)
async def listar_movimentacoes(
    id_produto: Optional[UUID] = Query(None, description="Filtrar por produto"),
    tp_movimentacao: Optional[str] = Query(None, description="Filtrar por tipo: entrada|saida|ajuste|reserva|devolucao"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista movimentações de estoque

    **Permissões:** Qualquer usuário autenticado

    **Filtros:**
    - id_produto: Filtrar por produto específico
    - tp_movimentacao: Filtrar por tipo de movimentação
    """
    movimentacoes, total = await EstoqueService.listar_movimentacoes(
        db=db,
        id_empresa=current_user.id_empresa,
        id_produto=id_produto,
        tp_movimentacao=tp_movimentacao,
        page=page,
        size=size
    )

    items = [MovimentacaoResponse.model_validate(m) for m in movimentacoes]

    return MovimentacaoListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.post("/reservas/", response_model=ReservaEstoqueResponse, status_code=status.HTTP_201_CREATED)
async def criar_reserva(
    data: ReservaEstoqueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "profissional", "recepcionista"]))
):
    """
    Cria reserva de estoque para agendamento

    **Permissões:** admin, gestor_clinica, profissional, recepcionista

    **Regras:**
    - Reserva por 24h (dt_expiracao automático)
    - Status inicial: "ativa"
    - Não consome estoque ainda (apenas reserva)
    """
    try:
        reserva = await EstoqueService.criar_reserva(
            db=db,
            id_empresa=current_user.id_empresa,
            id_produto=data.id_produto,
            id_agendamento=data.id_agendamento,
            nr_quantidade=data.nr_quantidade
        )
        return ReservaEstoqueResponse.model_validate(reserva)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar reserva: {str(e)}"
        )


@router.delete("/reservas/{id_reserva}/", status_code=status.HTTP_204_NO_CONTENT)
async def cancelar_reserva(
    id_reserva: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "profissional", "recepcionista"]))
):
    """
    Cancela reserva de estoque

    **Permissões:** admin, gestor_clinica, profissional, recepcionista

    **Regras:**
    - Altera st_reserva para "cancelada"
    - Libera quantidade reservada
    """
    reserva = await EstoqueService.cancelar_reserva(db=db, id_reserva=id_reserva)

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )

    return None


@router.get("/alertas/", response_model=EstoqueAlertaResponse)
async def listar_alertas_estoque(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista produtos com estoque baixo (alertas)

    **Permissões:** Qualquer usuário autenticado

    **Retorna produtos onde:**
    - nr_quantidade_estoque < nr_estoque_minimo
    - fg_ativo = True

    **Ordenação:** Mais críticos primeiro (menor quantidade em relação ao mínimo)

    **Criticidade:**
    - critica: estoque ≤ 25% do mínimo
    - alta: estoque ≤ 50% do mínimo
    - media: estoque > 50% do mínimo
    """
    try:
        alertas, total = await EstoqueService.listar_alertas_estoque(
            db=db,
            id_empresa=current_user.id_empresa,
            page=page,
            size=size
        )

        return EstoqueAlertaResponse(
            total=total,
            page=page,
            size=size,
            items=alertas
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar alertas de estoque: {str(e)}"
        )


@router.get("/resumo/", response_model=EstoqueResumoResponse)
async def obter_resumo_estoque(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém resumo e estatísticas do estoque

    **Permissões:** Qualquer usuário autenticado

    **Retorna:**
    - nr_total_produtos: Total de produtos ativos
    - nr_total_quantidade: Soma das quantidades em estoque
    - nr_produtos_estoque_baixo: Produtos abaixo do mínimo (mas não zerados)
    - nr_produtos_em_falta: Produtos com estoque zerado
    - vl_total_estoque: Valor total do estoque (quantidade × custo)
    - nr_movimentacoes_mes: Total de movimentações no mês atual
    - pc_produtos_alerta: Percentual de produtos em alerta (baixo + falta)
    """
    try:
        resumo = await EstoqueService.obter_resumo_estoque(
            db=db,
            id_empresa=current_user.id_empresa
        )

        return EstoqueResumoResponse(**resumo)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter resumo de estoque: {str(e)}"
        )
