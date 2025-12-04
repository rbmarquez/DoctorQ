"""
Service para Gestão de Estoque - UC043
"""
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, and_, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.estoque import TbMovimentacaoEstoque, TbReservaEstoque, MovimentacaoCreate
from src.config.logger_config import get_logger

logger = get_logger("estoque_service")


class EstoqueService:
    """Service para gestão de estoque"""

    @staticmethod
    async def criar_movimentacao(
        db: AsyncSession,
        id_empresa: UUID,
        id_user: UUID,
        data: MovimentacaoCreate
    ) -> TbMovimentacaoEstoque:
        """Cria movimentação e atualiza estoque"""

        # Buscar estoque atual
        query = select(func.coalesce(func.sum(func.case(
            (TbMovimentacaoEstoque.tp_movimentacao.in_(['entrada', 'devolucao']), TbMovimentacaoEstoque.nr_quantidade),
            else_=-TbMovimentacaoEstoque.nr_quantidade
        )), 0)).where(
            and_(
                TbMovimentacaoEstoque.id_empresa == id_empresa,
                TbMovimentacaoEstoque.id_produto == data.id_produto
            )
        )
        result = await db.execute(query)
        estoque_atual = result.scalar() or 0

        # Calcular novo estoque
        if data.tp_movimentacao in ['entrada', 'devolucao']:
            novo_estoque = estoque_atual + data.nr_quantidade
        else:  # saida, ajuste, reserva
            novo_estoque = estoque_atual - data.nr_quantidade
            if novo_estoque < 0:
                raise ValueError("Estoque insuficiente")

        # Criar movimentação
        movimentacao = TbMovimentacaoEstoque(
            id_empresa=id_empresa,
            id_produto=data.id_produto,
            id_user=id_user,
            id_agendamento=data.id_agendamento,
            id_pedido=data.id_pedido,
            tp_movimentacao=data.tp_movimentacao,
            nr_quantidade=data.nr_quantidade,
            nr_estoque_anterior=estoque_atual,
            nr_estoque_atual=novo_estoque,
            vl_custo_unitario=data.vl_custo_unitario,
            ds_motivo=data.ds_motivo,
            ds_lote=data.ds_lote,
            dt_validade=data.dt_validade
        )

        db.add(movimentacao)

        # Atualizar estoque na tabela de produtos
        await db.execute(
            update(TbMovimentacaoEstoque.__table__.metadata.tables['tb_produtos'])
            .where(TbMovimentacaoEstoque.__table__.metadata.tables['tb_produtos'].c.id_produto == data.id_produto)
            .values(nr_quantidade_estoque=novo_estoque)
        )

        await db.commit()
        await db.refresh(movimentacao)

        logger.info(f"Movimentação criada: {movimentacao.id_movimentacao}")
        return movimentacao

    @staticmethod
    async def listar_movimentacoes(
        db: AsyncSession,
        id_empresa: UUID,
        id_produto: Optional[UUID] = None,
        tp_movimentacao: Optional[str] = None,
        page: int = 1,
        size: int = 50
    ) -> tuple[List[TbMovimentacaoEstoque], int]:
        """Lista movimentações"""
        query = select(TbMovimentacaoEstoque).where(TbMovimentacaoEstoque.id_empresa == id_empresa)

        if id_produto:
            query = query.where(TbMovimentacaoEstoque.id_produto == id_produto)
        if tp_movimentacao:
            query = query.where(TbMovimentacaoEstoque.tp_movimentacao == tp_movimentacao)

        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        query = query.offset((page - 1) * size).limit(size).order_by(TbMovimentacaoEstoque.dt_criacao.desc())
        result = await db.execute(query)
        return list(result.scalars().all()), total or 0

    @staticmethod
    async def criar_reserva(
        db: AsyncSession,
        id_empresa: UUID,
        id_produto: UUID,
        id_agendamento: UUID,
        nr_quantidade: int
    ) -> TbReservaEstoque:
        """Cria reserva de estoque"""
        reserva = TbReservaEstoque(
            id_empresa=id_empresa,
            id_produto=id_produto,
            id_agendamento=id_agendamento,
            nr_quantidade=nr_quantidade,
            st_reserva="ativa",
            dt_expiracao=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(reserva)
        await db.commit()
        await db.refresh(reserva)
        return reserva

    @staticmethod
    async def cancelar_reserva(db: AsyncSession, id_reserva: UUID) -> Optional[TbReservaEstoque]:
        """Cancela reserva"""
        query = select(TbReservaEstoque).where(TbReservaEstoque.id_reserva == id_reserva)
        result = await db.execute(query)
        reserva = result.scalar_one_or_none()

        if reserva:
            reserva.st_reserva = "cancelada"
            await db.commit()
            await db.refresh(reserva)
        return reserva

    @staticmethod
    async def listar_alertas_estoque(
        db: AsyncSession,
        id_empresa: UUID,
        page: int = 1,
        size: int = 50
    ) -> tuple[List[dict], int]:
        """
        Lista produtos com estoque baixo (abaixo do mínimo)

        Retorna produtos onde nr_quantidade_estoque < nr_estoque_minimo
        """
        from src.models.produto import TbProduto

        # Query para produtos com estoque baixo
        query = select(TbProduto).where(
            and_(
                TbProduto.id_empresa == id_empresa,
                TbProduto.nr_quantidade_estoque < TbProduto.nr_estoque_minimo,
                TbProduto.fg_ativo == "S"
            )
        )

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0

        # Ordenar por criticidade (quanto mais abaixo do mínimo, mais crítico)
        query = query.order_by(
            (TbProduto.nr_quantidade_estoque - TbProduto.nr_estoque_minimo).asc()
        ).offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        produtos = result.scalars().all()

        # Montar resposta com detalhes do alerta
        alertas = []
        for produto in produtos:
            diferenca = produto.nr_estoque_minimo - produto.nr_quantidade_estoque
            percentual = (produto.nr_quantidade_estoque / produto.nr_estoque_minimo * 100) if produto.nr_estoque_minimo > 0 else 0

            # Determinar criticidade
            if percentual <= 25:
                nm_criticidade = "critica"
            elif percentual <= 50:
                nm_criticidade = "alta"
            else:
                nm_criticidade = "media"

            alertas.append({
                "id_produto": produto.id_produto,
                "nm_produto": produto.nm_produto,
                "nr_quantidade_estoque": produto.nr_quantidade_estoque,
                "nr_estoque_minimo": produto.nr_estoque_minimo,
                "nr_diferenca": diferenca,
                "pc_estoque": round(percentual, 2),
                "nm_criticidade": nm_criticidade,
                "dt_ultima_movimentacao": None  # TODO: adicionar quando implementar
            })

        logger.info(f"Alertas de estoque: {total} produtos abaixo do mínimo")
        return alertas, total

    @staticmethod
    async def obter_resumo_estoque(
        db: AsyncSession,
        id_empresa: UUID
    ) -> dict:
        """
        Obtém resumo/estatísticas do estoque

        Retorna:
        - Total de produtos
        - Total em estoque (quantidade)
        - Produtos com estoque baixo
        - Produtos em falta
        - Valor total do estoque
        """
        from src.models.produto import TbProduto

        # Total de produtos ativos
        query_total = select(func.count(TbProduto.id_produto)).where(
            and_(
                TbProduto.id_empresa == id_empresa,
                TbProduto.fg_ativo == "S"
            )
        )
        total_produtos = await db.scalar(query_total) or 0

        # Total em estoque (soma de quantidades)
        query_quantidade = select(func.sum(TbProduto.nr_quantidade_estoque)).where(
            and_(
                TbProduto.id_empresa == id_empresa,
                TbProduto.fg_ativo == "S"
            )
        )
        total_quantidade = await db.scalar(query_quantidade) or 0

        # Produtos com estoque baixo
        query_baixo = select(func.count(TbProduto.id_produto)).where(
            and_(
                TbProduto.id_empresa == id_empresa,
                TbProduto.nr_quantidade_estoque < TbProduto.nr_estoque_minimo,
                TbProduto.nr_quantidade_estoque > 0,
                TbProduto.fg_ativo == "S"
            )
        )
        produtos_estoque_baixo = await db.scalar(query_baixo) or 0

        # Produtos em falta (estoque zero)
        query_falta = select(func.count(TbProduto.id_produto)).where(
            and_(
                TbProduto.id_empresa == id_empresa,
                TbProduto.nr_quantidade_estoque == 0,
                TbProduto.fg_ativo == "S"
            )
        )
        produtos_em_falta = await db.scalar(query_falta) or 0

        # Valor total do estoque (quantidade * custo unitário)
        query_valor = select(
            func.sum(TbProduto.nr_quantidade_estoque * TbProduto.vl_custo)
        ).where(
            and_(
                TbProduto.id_empresa == id_empresa,
                TbProduto.fg_ativo == "S"
            )
        )
        valor_total_estoque = await db.scalar(query_valor) or 0

        # Movimentações no mês atual
        from datetime import datetime
        primeiro_dia_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        query_mov_mes = select(func.count(TbMovimentacaoEstoque.id_movimentacao)).where(
            and_(
                TbMovimentacaoEstoque.id_empresa == id_empresa,
                TbMovimentacaoEstoque.dt_criacao >= primeiro_dia_mes
            )
        )
        movimentacoes_mes = await db.scalar(query_mov_mes) or 0

        resumo = {
            "nr_total_produtos": total_produtos,
            "nr_total_quantidade": total_quantidade,
            "nr_produtos_estoque_baixo": produtos_estoque_baixo,
            "nr_produtos_em_falta": produtos_em_falta,
            "vl_total_estoque": float(valor_total_estoque),
            "nr_movimentacoes_mes": movimentacoes_mes,
            "pc_produtos_alerta": round((produtos_estoque_baixo + produtos_em_falta) / total_produtos * 100, 2) if total_produtos > 0 else 0
        }

        logger.info(f"Resumo de estoque obtido para empresa {id_empresa}")
        return resumo
