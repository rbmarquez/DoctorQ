"""
Rotas para Carrinho de Compras - Versão ORM
"""

import uuid
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.carrinho import (
    CarrinhoItemCreate,
    CarrinhoItemUpdate,
    CarrinhoItemResponse,
    CarrinhoResponse,
    CarrinhoTotal,
    CarrinhoLimpar,
    CarrinhoStats,
)
from src.models.carrinho_orm import CarrinhoORM
from src.models.produto_orm import ProdutoORM, ProdutoVariacaoORM
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/carrinho", tags=["carrinho"])


# ============================================================================
# VISUALIZAÇÃO DO CARRINHO
# ============================================================================


@router.get("/", response_model=CarrinhoResponse)
async def visualizar_carrinho(
    id_user: uuid.UUID = Query(..., description="ID do usuário"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Visualizar carrinho completo do usuário com todos os itens e totais"""
    try:
        # Query com eager loading de relacionamentos
        query = select(CarrinhoORM).options(
            selectinload(CarrinhoORM.produto)
        ).where(CarrinhoORM.id_user == id_user).order_by(CarrinhoORM.dt_criacao.desc())

        result = await db.execute(query)
        itens_db = result.scalars().all()

        # Converter para modelos de resposta
        itens = []
        vl_subtotal_total = 0.0
        nr_produtos = 0
        nr_procedimentos = 0

        for item in itens_db:
            # Calcular subtotal do item
            vl_subtotal = float(item.vl_preco_unitario) * item.nr_quantidade

            # TODO: Adicionar valor da variação se houver
            # TODO: Buscar dados de procedimento se houver
            # TODO: Buscar dados de profissional se houver

            item_dict = {
                "id_carrinho": item.id_carrinho,
                "id_user": item.id_user,
                "id_produto": item.id_produto,
                "id_procedimento": item.id_procedimento,
                "id_variacao": item.id_variacao,
                "id_profissional_desejado": item.id_profissional_desejado,
                "nr_quantidade": item.nr_quantidade,
                "vl_preco_unitario": item.vl_preco_unitario,
                "vl_subtotal": vl_subtotal,
                "dt_agendamento_desejado": item.dt_agendamento_desejado,
                "ds_observacoes": item.ds_observacoes,
                "dt_criacao": item.dt_criacao,
                "dt_atualizacao": item.dt_atualizacao,
            }

            # Adicionar dados do produto se existir
            if item.produto:
                item_dict["produto_nome"] = item.produto.nm_produto
                item_dict["produto_imagem"] = item.produto.ds_imagem_url
                item_dict["produto_slug"] = item.produto.ds_slug
                item_dict["produto_estoque"] = item.produto.nr_quantidade_estoque

            vl_subtotal_total += vl_subtotal

            # Contar tipos
            if item.id_produto:
                nr_produtos += 1
            if item.id_procedimento:
                nr_procedimentos += 1

            itens.append(CarrinhoItemResponse.model_validate(item_dict))

        # Calcular totais
        total = CarrinhoTotal(
            nr_itens=len(itens),
            vl_subtotal=round(vl_subtotal_total, 2),
            vl_desconto=0.0,  # TODO: Implementar cálculo de cupom
            vl_frete=0.0,  # TODO: Implementar cálculo de frete
            vl_total=round(vl_subtotal_total, 2),
            nr_produtos=nr_produtos,
            nr_procedimentos=nr_procedimentos,
        )

        return CarrinhoResponse(id_user=id_user, itens=itens, total=total)

    except Exception as e:
        logger.error(f"Erro ao visualizar carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/total", response_model=CarrinhoTotal)
async def calcular_total_carrinho(
    id_user: uuid.UUID = Query(..., description="ID do usuário"),
    cupom: Optional[str] = Query(None, description="Código do cupom"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Calcular totais do carrinho com aplicação de cupom e frete"""
    try:
        # Query para somar valores
        query = select(
            func.count(CarrinhoORM.id_carrinho).label("nr_itens"),
            func.sum(
                CarrinhoORM.vl_preco_unitario * CarrinhoORM.nr_quantidade
            ).label("vl_base"),
            func.sum(
                func.case(
                    (CarrinhoORM.id_produto.isnot(None), 1),
                    else_=0
                )
            ).label("nr_produtos"),
            func.sum(
                func.case(
                    (CarrinhoORM.id_procedimento.isnot(None), 1),
                    else_=0
                )
            ).label("nr_procedimentos"),
        ).where(CarrinhoORM.id_user == id_user)

        result = await db.execute(query)
        totais = result.one()

        if not totais or totais.nr_itens == 0:
            return CarrinhoTotal(
                nr_itens=0,
                vl_subtotal=0.0,
                vl_total=0.0,
                nr_produtos=0,
                nr_procedimentos=0,
            )

        vl_subtotal = float(totais.vl_base or 0)
        vl_desconto = 0.0
        cupom_codigo = None
        cupom_desconto_percentual = None
        cupom_desconto_fixo = None

        # TODO: Aplicar cupom se fornecido
        # Seria necessário criar um CupomORM model também

        # TODO: Calcular frete baseado em endereço
        vl_frete = 0.0

        vl_total = vl_subtotal - vl_desconto + vl_frete

        return CarrinhoTotal(
            nr_itens=totais.nr_itens,
            vl_subtotal=round(vl_subtotal, 2),
            vl_desconto=round(vl_desconto, 2),
            vl_frete=round(vl_frete, 2),
            vl_total=round(vl_total, 2),
            nr_produtos=int(totais.nr_produtos or 0),
            nr_procedimentos=int(totais.nr_procedimentos or 0),
            cupom_codigo=cupom_codigo,
            cupom_desconto_percentual=cupom_desconto_percentual,
            cupom_desconto_fixo=cupom_desconto_fixo,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao calcular total do carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# GERENCIAMENTO DE ITENS
# ============================================================================


@router.post("/itens", status_code=201, response_model=CarrinhoItemResponse)
async def adicionar_item_carrinho(
    id_user: uuid.UUID = Query(..., description="ID do usuário"),
    item_data: CarrinhoItemCreate = ...,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Adicionar item ao carrinho (produto ou procedimento)"""
    try:
        # Validar que apenas produto OU procedimento foi informado
        if not (
            bool(item_data.id_produto) ^ bool(item_data.id_procedimento)
        ):  # XOR lógico
            raise HTTPException(
                status_code=400,
                detail="Informe apenas id_produto OU id_procedimento, não ambos",
            )

        # Verificar se item já existe no carrinho
        if item_data.id_produto:
            query = select(CarrinhoORM).where(
                and_(
                    CarrinhoORM.id_user == id_user,
                    CarrinhoORM.id_produto == item_data.id_produto
                )
            )
        else:
            query = select(CarrinhoORM).where(
                and_(
                    CarrinhoORM.id_user == id_user,
                    CarrinhoORM.id_procedimento == item_data.id_procedimento
                )
            )

        result = await db.execute(query)
        existing_item = result.scalar_one_or_none()

        if existing_item:
            # Atualizar quantidade
            existing_item.nr_quantidade += item_data.nr_quantidade
            await db.commit()
            await db.refresh(existing_item)

            item_dict = {
                "id_carrinho": existing_item.id_carrinho,
                "id_user": existing_item.id_user,
                "id_produto": existing_item.id_produto,
                "id_procedimento": existing_item.id_procedimento,
                "id_variacao": existing_item.id_variacao,
                "id_profissional_desejado": existing_item.id_profissional_desejado,
                "nr_quantidade": existing_item.nr_quantidade,
                "vl_preco_unitario": existing_item.vl_preco_unitario,
                "vl_subtotal": float(existing_item.vl_preco_unitario) * existing_item.nr_quantidade,
                "dt_agendamento_desejado": existing_item.dt_agendamento_desejado,
                "ds_observacoes": existing_item.ds_observacoes,
                "dt_criacao": existing_item.dt_criacao,
                "dt_atualizacao": existing_item.dt_atualizacao,
            }
            return CarrinhoItemResponse.model_validate(item_dict)

        # Inserir novo item
        item_dict = item_data.model_dump(exclude_none=True)
        item_dict["id_user"] = id_user

        novo_item = CarrinhoORM(**item_dict)
        db.add(novo_item)
        await db.commit()
        await db.refresh(novo_item)

        response_dict = {
            "id_carrinho": novo_item.id_carrinho,
            "id_user": novo_item.id_user,
            "id_produto": novo_item.id_produto,
            "id_procedimento": novo_item.id_procedimento,
            "id_variacao": novo_item.id_variacao,
            "id_profissional_desejado": novo_item.id_profissional_desejado,
            "nr_quantidade": novo_item.nr_quantidade,
            "vl_preco_unitario": novo_item.vl_preco_unitario,
            "vl_subtotal": float(novo_item.vl_preco_unitario) * novo_item.nr_quantidade,
            "dt_agendamento_desejado": novo_item.dt_agendamento_desejado,
            "ds_observacoes": novo_item.ds_observacoes,
            "dt_criacao": novo_item.dt_criacao,
            "dt_atualizacao": novo_item.dt_atualizacao,
        }
        return CarrinhoItemResponse.model_validate(response_dict)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao adicionar item ao carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/itens/{item_id}", response_model=CarrinhoItemResponse)
async def atualizar_item_carrinho(
    item_id: uuid.UUID,
    id_user: uuid.UUID = Query(..., description="ID do usuário"),
    item_data: CarrinhoItemUpdate = ...,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Atualizar quantidade ou opções de item do carrinho"""
    try:
        # Buscar item
        query = select(CarrinhoORM).where(
            and_(
                CarrinhoORM.id_carrinho == item_id,
                CarrinhoORM.id_user == id_user
            )
        )
        result = await db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Item não encontrado no carrinho")

        # Preparar dados para atualização
        update_data = item_data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

        # Atualizar campos
        for field, value in update_data.items():
            setattr(item, field, value)

        await db.commit()
        await db.refresh(item)

        response_dict = {
            "id_carrinho": item.id_carrinho,
            "id_user": item.id_user,
            "id_produto": item.id_produto,
            "id_procedimento": item.id_procedimento,
            "id_variacao": item.id_variacao,
            "id_profissional_desejado": item.id_profissional_desejado,
            "nr_quantidade": item.nr_quantidade,
            "vl_preco_unitario": item.vl_preco_unitario,
            "vl_subtotal": float(item.vl_preco_unitario) * item.nr_quantidade,
            "dt_agendamento_desejado": item.dt_agendamento_desejado,
            "ds_observacoes": item.ds_observacoes,
            "dt_criacao": item.dt_criacao,
            "dt_atualizacao": item.dt_atualizacao,
        }
        return CarrinhoItemResponse.model_validate(response_dict)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao atualizar item do carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/itens/{item_id}", status_code=204)
async def remover_item_carrinho(
    item_id: uuid.UUID,
    id_user: uuid.UUID = Query(..., description="ID do usuário"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Remover item do carrinho"""
    try:
        # Buscar item
        query = select(CarrinhoORM).where(
            and_(
                CarrinhoORM.id_carrinho == item_id,
                CarrinhoORM.id_user == id_user
            )
        )
        result = await db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Item não encontrado no carrinho")

        # Deletar item
        await db.delete(item)
        await db.commit()

        return None

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao remover item do carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/", status_code=204)
async def limpar_carrinho(
    id_user: uuid.UUID = Query(..., description="ID do usuário"),
    confirmacao: CarrinhoLimpar = ...,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Limpar todo o carrinho do usuário"""
    try:
        if not confirmacao.confirmar:
            raise HTTPException(
                status_code=400, detail="Confirmação necessária para limpar carrinho"
            )

        # Buscar todos os itens do usuário
        query = select(CarrinhoORM).where(CarrinhoORM.id_user == id_user)
        result = await db.execute(query)
        itens = result.scalars().all()

        # Deletar todos
        for item in itens:
            await db.delete(item)

        await db.commit()

        logger.info(
            f"Carrinho limpo para usuário {id_user}: {len(itens)} itens removidos"
        )

        return None

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao limpar carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# ESTATÍSTICAS
# ============================================================================


@router.get("/stats", response_model=CarrinhoStats)
async def obter_estatisticas_carrinho(
    id_user: uuid.UUID = Query(..., description="ID do usuário"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter estatísticas do carrinho do usuário"""
    try:
        # Estatísticas atuais
        stats_query = select(
            func.count(CarrinhoORM.id_carrinho).label("nr_itens"),
            func.sum(
                CarrinhoORM.vl_preco_unitario * CarrinhoORM.nr_quantidade
            ).label("vl_total"),
            func.max(CarrinhoORM.dt_criacao).label("dt_ultimo_item"),
        ).where(CarrinhoORM.id_user == id_user)

        result = await db.execute(stats_query)
        stats = result.one()

        # Carrinhos abandonados (itens com mais de 7 dias)
        data_limite = datetime.now() - timedelta(days=7)
        abandonados_query = select(func.count(CarrinhoORM.id_carrinho)).where(
            and_(
                CarrinhoORM.id_user == id_user,
                CarrinhoORM.dt_criacao < data_limite,
            )
        )

        abandonados_result = await db.execute(abandonados_query)
        nr_abandonados = abandonados_result.scalar()

        return CarrinhoStats(
            id_user=id_user,
            nr_itens_atuais=stats.nr_itens or 0,
            vl_total_atual=float(stats.vl_total or 0),
            nr_carrinhos_abandonados=nr_abandonados or 0,
            vl_medio_carrinho=float(stats.vl_total or 0) / max(stats.nr_itens or 1, 1),
            dt_ultimo_item_adicionado=stats.dt_ultimo_item,
        )

    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
