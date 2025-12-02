"""
Rotas para API de Pedidos
"""

import uuid
from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_, text, insert, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.pedido import (
    PedidoCreate,
    PedidoUpdate,
    PedidoResponse,
    PedidoList,
    PedidoListItem,
    RastreioResponse,
    RastreioEvento,
    PedidoStats,
    ItemPedido,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


async def gerar_numero_pedido(db: AsyncSession) -> str:
    """Gerar próximo número de pedido sequencial"""
    from sqlalchemy import Table, MetaData

    metadata = MetaData()
    tb_pedidos = Table("tb_pedidos", metadata, autoload_with=db.bind)

    # Buscar último número
    query = select(func.max(tb_pedidos.c.nr_pedido))
    result = await db.execute(query)
    ultimo_numero = result.scalar()

    if ultimo_numero:
        # Extrair número e incrementar
        numero = int(ultimo_numero.split("-")[1]) + 1
    else:
        numero = 1

    return f"PED-{numero:06d}"


async def calcular_frete(estado: str, vl_subtotal: Decimal) -> Decimal:
    """Calcular valor do frete baseado no estado e subtotal"""
    # Frete grátis acima de R$ 200
    if vl_subtotal >= Decimal("200.00"):
        return Decimal("0.00")

    # Tabela simples de frete por região
    fretes = {
        "SP": Decimal("25.00"),
        "RJ": Decimal("30.00"),
        "MG": Decimal("30.00"),
        "ES": Decimal("35.00"),
        "PR": Decimal("35.00"),
        "SC": Decimal("40.00"),
        "RS": Decimal("45.00"),
    }

    # Outros estados: R$ 50
    return fretes.get(estado, Decimal("50.00"))


# ============================================================================
# CRIAR PEDIDO
# ============================================================================


@router.post("/", status_code=201, response_model=PedidoResponse)
async def criar_pedido(
    pedido_data: PedidoCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Criar novo pedido a partir do carrinho do usuário

    - Valida itens no carrinho
    - Calcula totais (subtotal, desconto, frete)
    - Cria pedido e itens
    - Limpa carrinho
    """
    try:
        from sqlalchemy import Table, MetaData, delete

        metadata = MetaData()
        tb_pedidos = Table("tb_pedidos", metadata, autoload_with=db.bind)
        tb_itens_pedido = Table("tb_itens_pedido", metadata, autoload_with=db.bind)
        tb_carrinho = Table("tb_carrinho", metadata, autoload_with=db.bind)
        tb_produtos = Table("tb_produtos", metadata, autoload_with=db.bind)
        tb_procedimentos = Table("tb_procedimentos", metadata, autoload_with=db.bind)

        # 1. Buscar itens do carrinho
        carrinho_query = (
            select(
                tb_carrinho,
                tb_produtos.c.nm_produto.label("produto_nome"),
                tb_produtos.c.ds_imagem_url.label("produto_imagem"),
                tb_produtos.c.nr_quantidade_estoque.label("produto_estoque"),
                tb_procedimentos.c.nm_procedimento.label("procedimento_nome"),
                tb_procedimentos.c.ds_imagem_url.label("procedimento_imagem"),
                tb_procedimentos.c.vl_preco_base.label("procedimento_preco"),
            )
            .select_from(
                tb_carrinho.outerjoin(
                    tb_produtos, tb_carrinho.c.id_produto == tb_produtos.c.id_produto
                ).outerjoin(
                    tb_procedimentos,
                    tb_carrinho.c.id_procedimento == tb_procedimentos.c.id_procedimento,
                )
            )
            .where(tb_carrinho.c.id_user == pedido_data.id_user)
        )

        carrinho_result = await db.execute(carrinho_query)
        itens_carrinho = carrinho_result.fetchall()

        if not itens_carrinho:
            raise HTTPException(status_code=400, detail="Carrinho vazio")

        # 2. Validar estoque e calcular subtotal
        vl_subtotal = Decimal("0.00")
        itens_pedido = []

        for item in itens_carrinho:
            item_dict = dict(item._mapping)

            # Validar estoque de produtos
            if item_dict.get("id_produto"):
                estoque = item_dict.get("produto_estoque", 0)
                if estoque < item_dict["qt_quantidade"]:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Estoque insuficiente para {item_dict.get('produto_nome', 'produto')}",
                    )

            # Calcular subtotal do item
            vl_item = Decimal(str(item_dict["vl_preco_unitario"]))
            qt_item = item_dict["qt_quantidade"]
            vl_subtotal_item = vl_item * qt_item
            vl_subtotal += vl_subtotal_item

            # Preparar item para inserção
            itens_pedido.append({
                "id_item": uuid.uuid4(),
                "id_produto": item_dict.get("id_produto"),
                "id_procedimento": item_dict.get("id_procedimento"),
                "nm_item": item_dict.get("produto_nome") or item_dict.get("procedimento_nome"),
                "qt_quantidade": qt_item,
                "vl_unitario": vl_item,
                "vl_subtotal": vl_subtotal_item,
                "ds_imagem_url": item_dict.get("produto_imagem") or item_dict.get("procedimento_imagem"),
            })

        # 3. Calcular desconto (cupom) - TODO: implementar lógica de cupom
        vl_desconto = Decimal("0.00")

        # 4. Calcular frete
        estado = pedido_data.ds_endereco_entrega.ds_estado
        vl_frete = await calcular_frete(estado, vl_subtotal)

        # 5. Calcular total
        vl_total = vl_subtotal - vl_desconto + vl_frete

        # 6. Gerar número do pedido
        nr_pedido = await gerar_numero_pedido(db)

        # 7. Criar pedido
        pedido_dict = {
            "id_pedido": uuid.uuid4(),
            "id_user": pedido_data.id_user,
            "nr_pedido": nr_pedido,
            "vl_subtotal": vl_subtotal,
            "vl_desconto": vl_desconto,
            "vl_frete": vl_frete,
            "vl_total": vl_total,
            "ds_status": "pendente",
            "ds_endereco_entrega": pedido_data.ds_endereco_entrega.model_dump(),
            "ds_forma_pagamento": pedido_data.ds_forma_pagamento,
            "ds_observacoes": pedido_data.ds_observacoes,
            "dt_pedido": datetime.now(),
        }

        # Estimativa de entrega (7 dias úteis)
        pedido_dict["dt_entrega_estimada"] = (datetime.now() + timedelta(days=10)).date()

        insert_pedido = insert(tb_pedidos).values(**pedido_dict).returning(tb_pedidos)
        pedido_result = await db.execute(insert_pedido)
        pedido_criado = pedido_result.fetchone()

        # 8. Criar itens do pedido
        for item in itens_pedido:
            item["id_pedido"] = pedido_dict["id_pedido"]
            await db.execute(insert(tb_itens_pedido).values(**item))

        # 9. Limpar carrinho
        delete_stmt = delete(tb_carrinho).where(tb_carrinho.c.id_user == pedido_data.id_user)
        await db.execute(delete_stmt)

        # 10. Commit
        await db.commit()

        # 11. Retornar resposta
        pedido_response = dict(pedido_criado._mapping)
        pedido_response["itens"] = [ItemPedido.model_validate(i) for i in itens_pedido]

        return PedidoResponse.model_validate(pedido_response)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar pedido: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar pedido: {str(e)}") from e


# ============================================================================
# LISTAR PEDIDOS
# ============================================================================


@router.get("/", response_model=PedidoList)
async def listar_pedidos(
    id_user: Optional[uuid.UUID] = Query(None, description="Filtrar por usuário"),
    ds_status: Optional[str] = Query(None, description="Filtrar por status"),
    dt_inicio: Optional[datetime] = Query(None, description="Data inicial"),
    dt_fim: Optional[datetime] = Query(None, description="Data final"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(12, ge=1, le=100, description="Itens por página"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar pedidos com filtros e paginação"""
    try:
        from sqlalchemy import Table, MetaData

        metadata = MetaData()
        tb_pedidos = Table("tb_pedidos", metadata, autoload_with=db.bind)
        tb_itens_pedido = Table("tb_itens_pedido", metadata, autoload_with=db.bind)
        tb_fornecedores = Table("tb_fornecedores", metadata, autoload_with=db.bind)

        # Subquery para contar itens
        itens_count = (
            select(
                tb_itens_pedido.c.id_pedido,
                func.count(tb_itens_pedido.c.id_item).label("qt_itens"),
            )
            .group_by(tb_itens_pedido.c.id_pedido)
            .subquery()
        )

        # Query principal
        query = (
            select(
                tb_pedidos,
                tb_fornecedores.c.nm_empresa.label("fornecedor_nome"),
                itens_count.c.qt_itens,
            )
            .select_from(
                tb_pedidos.outerjoin(
                    tb_fornecedores,
                    tb_pedidos.c.id_fornecedor == tb_fornecedores.c.id_fornecedor,
                ).outerjoin(itens_count, tb_pedidos.c.id_pedido == itens_count.c.id_pedido)
            )
            .order_by(tb_pedidos.c.dt_pedido.desc())
        )

        # Filtros
        if id_user:
            query = query.where(tb_pedidos.c.id_user == id_user)

        if ds_status:
            query = query.where(tb_pedidos.c.ds_status == ds_status.lower())

        if dt_inicio:
            query = query.where(tb_pedidos.c.dt_pedido >= dt_inicio)

        if dt_fim:
            query = query.where(tb_pedidos.c.dt_pedido <= dt_fim)

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Paginação
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Executar
        result = await db.execute(query)
        pedidos = result.fetchall()

        # Converter para modelo
        items = []
        for p in pedidos:
            p_dict = dict(p._mapping)
            items.append(
                PedidoListItem(
                    id_pedido=p_dict["id_pedido"],
                    nr_pedido=p_dict["nr_pedido"],
                    dt_pedido=p_dict["dt_pedido"],
                    vl_total=Decimal(str(p_dict["vl_total"])),
                    ds_status=p_dict["ds_status"],
                    qt_itens=p_dict.get("qt_itens", 0) or 0,
                    fornecedor_nome=p_dict.get("fornecedor_nome"),
                )
            )

        return PedidoList(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        )

    except Exception as e:
        logger.error(f"Erro ao listar pedidos: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# DETALHES DO PEDIDO
# ============================================================================


@router.get("/{pedido_id}", response_model=PedidoResponse)
async def obter_pedido(
    pedido_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter detalhes completos de um pedido incluindo itens"""
    try:
        from sqlalchemy import Table, MetaData

        metadata = MetaData()
        tb_pedidos = Table("tb_pedidos", metadata, autoload_with=db.bind)
        tb_itens_pedido = Table("tb_itens_pedido", metadata, autoload_with=db.bind)
        tb_fornecedores = Table("tb_fornecedores", metadata, autoload_with=db.bind)

        # Buscar pedido
        pedido_query = (
            select(tb_pedidos, tb_fornecedores.c.nm_empresa.label("fornecedor_nome"))
            .select_from(
                tb_pedidos.outerjoin(
                    tb_fornecedores,
                    tb_pedidos.c.id_fornecedor == tb_fornecedores.c.id_fornecedor,
                )
            )
            .where(tb_pedidos.c.id_pedido == pedido_id)
        )

        pedido_result = await db.execute(pedido_query)
        pedido = pedido_result.fetchone()

        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")

        # Buscar itens
        itens_query = select(tb_itens_pedido).where(
            tb_itens_pedido.c.id_pedido == pedido_id
        )
        itens_result = await db.execute(itens_query)
        itens = itens_result.fetchall()

        # Montar resposta
        pedido_dict = dict(pedido._mapping)
        pedido_dict["itens"] = [ItemPedido.model_validate(dict(i._mapping)) for i in itens]

        return PedidoResponse.model_validate(pedido_dict)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter pedido: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# ATUALIZAR STATUS
# ============================================================================


@router.put("/{pedido_id}/status", response_model=PedidoResponse)
async def atualizar_status_pedido(
    pedido_id: uuid.UUID,
    pedido_update: PedidoUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Atualizar status e informações do pedido"""
    try:
        from sqlalchemy import Table, MetaData

        metadata = MetaData()
        tb_pedidos = Table("tb_pedidos", metadata, autoload_with=db.bind)

        # Verificar se pedido existe
        check_query = select(tb_pedidos).where(tb_pedidos.c.id_pedido == pedido_id)
        existing = await db.execute(check_query)
        if not existing.fetchone():
            raise HTTPException(status_code=404, detail="Pedido não encontrado")

        # Preparar dados para atualização
        update_data = pedido_update.model_dump(exclude_none=True)

        # Atualizar timestamps baseado no status
        if pedido_update.ds_status:
            if pedido_update.ds_status == "confirmado":
                update_data["dt_confirmacao"] = datetime.now()
            elif pedido_update.ds_status == "pago":
                update_data["dt_pagamento"] = datetime.now()
            elif pedido_update.ds_status == "enviado" and not update_data.get("dt_envio"):
                update_data["dt_envio"] = datetime.now()
            elif pedido_update.ds_status == "entregue" and not update_data.get("dt_entrega"):
                update_data["dt_entrega"] = datetime.now()
            elif pedido_update.ds_status == "cancelado":
                update_data["dt_cancelamento"] = datetime.now()

        # Atualizar
        update_stmt = (
            update(tb_pedidos)
            .where(tb_pedidos.c.id_pedido == pedido_id)
            .values(**update_data)
            .returning(tb_pedidos)
        )
        result = await db.execute(update_stmt)
        await db.commit()

        pedido_atualizado = result.fetchone()
        return PedidoResponse.model_validate(dict(pedido_atualizado._mapping))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao atualizar status do pedido: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# RASTREAMENTO
# ============================================================================


@router.get("/{pedido_id}/rastreio", response_model=RastreioResponse)
async def obter_rastreio(
    pedido_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter informações de rastreamento do pedido"""
    try:
        from sqlalchemy import Table, MetaData

        metadata = MetaData()
        tb_pedidos = Table("tb_pedidos", metadata, autoload_with=db.bind)
        tb_pedido_historico = Table("tb_pedido_historico", metadata, autoload_with=db.bind)

        # Buscar pedido
        pedido_query = select(tb_pedidos).where(tb_pedidos.c.id_pedido == pedido_id)
        pedido_result = await db.execute(pedido_query)
        pedido = pedido_result.fetchone()

        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")

        # Buscar histórico de status
        historico_query = (
            select(tb_pedido_historico)
            .where(tb_pedido_historico.c.id_pedido == pedido_id)
            .order_by(tb_pedido_historico.c.dt_mudanca.desc())
        )
        historico_result = await db.execute(historico_query)
        historico = historico_result.fetchall()

        # Montar eventos
        eventos = []
        for h in historico:
            h_dict = dict(h._mapping)
            eventos.append(
                RastreioEvento(
                    dt_evento=h_dict["dt_mudanca"],
                    ds_local="Centro de Distribuição",  # TODO: implementar tracking real
                    ds_descricao=h_dict.get("ds_observacao", ""),
                    ds_status=h_dict["ds_status_novo"],
                )
            )

        p_dict = dict(pedido._mapping)

        return RastreioResponse(
            id_pedido=p_dict["id_pedido"],
            nr_pedido=p_dict["nr_pedido"],
            ds_codigo_rastreio=p_dict.get("ds_codigo_rastreio"),
            ds_transportadora="Correios",  # TODO: obter da tabela
            dt_postagem=p_dict.get("dt_envio"),
            dt_entrega_prevista=p_dict.get("dt_entrega_estimada"),
            ds_status_atual=p_dict["ds_status"],
            eventos=eventos,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter rastreio: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# ESTATÍSTICAS
# ============================================================================


@router.get("/stats/geral", response_model=PedidoStats)
async def obter_estatisticas(
    id_user: Optional[uuid.UUID] = Query(None, description="Filtrar por usuário"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter estatísticas gerais de pedidos"""
    try:
        from sqlalchemy import Table, MetaData

        metadata = MetaData()
        tb_pedidos = Table("tb_pedidos", metadata, autoload_with=db.bind)

        # Query base
        base_query = select(tb_pedidos)
        if id_user:
            base_query = base_query.where(tb_pedidos.c.id_user == id_user)

        # Total de pedidos
        total_query = select(func.count()).select_from(base_query.subquery())
        total_result = await db.execute(total_query)
        total_pedidos = total_result.scalar() or 0

        # Total faturado
        faturado_query = select(func.sum(tb_pedidos.c.vl_total)).select_from(
            base_query.subquery()
        )
        faturado_result = await db.execute(faturado_query)
        total_faturado = Decimal(str(faturado_result.scalar() or 0))

        # Ticket médio
        ticket_medio = total_faturado / total_pedidos if total_pedidos > 0 else Decimal("0.00")

        # Pedidos por status
        status_query = (
            select(tb_pedidos.c.ds_status, func.count().label("total"))
            .select_from(base_query.subquery())
            .group_by(tb_pedidos.c.ds_status)
        )
        status_result = await db.execute(status_query)
        status_rows = status_result.fetchall()
        pedidos_por_status = {row.ds_status: row.total for row in status_rows}

        # Pedidos do mês
        mes_atual = datetime.now().replace(day=1, hour=0, minute=0, second=0)
        mes_query = base_query.where(tb_pedidos.c.dt_pedido >= mes_atual)

        pedidos_mes_query = select(func.count()).select_from(mes_query.subquery())
        pedidos_mes_result = await db.execute(pedidos_mes_query)
        pedidos_mes = pedidos_mes_result.scalar() or 0

        faturamento_mes_query = select(func.sum(tb_pedidos.c.vl_total)).select_from(
            mes_query.subquery()
        )
        faturamento_mes_result = await db.execute(faturamento_mes_query)
        faturamento_mes = Decimal(str(faturamento_mes_result.scalar() or 0))

        return PedidoStats(
            total_pedidos=total_pedidos,
            total_faturado=total_faturado,
            ticket_medio=ticket_medio,
            pedidos_por_status=pedidos_por_status,
            pedidos_mes=pedidos_mes,
            faturamento_mes=faturamento_mes,
        )

    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
