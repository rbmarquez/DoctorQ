"""
Rotas para Fornecedores
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.fornecedor import (
    FornecedorCreate,
    FornecedorResponse,
    FornecedorUpdate,
    FornecedorList,
    FornecedorStats,
)
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/fornecedores", tags=["fornecedores"])


# ============================================================================
# LISTAGEM E BUSCA
# ============================================================================


@router.get("/", response_model=FornecedorList)
async def listar_fornecedores(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome ou CNPJ"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria de produto"),
    cidade: Optional[str] = Query(None, description="Filtrar por cidade"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (UF)"),
    st_verificado: Optional[bool] = Query(None, description="Filtrar por verificado"),
    st_ativo: bool = Query(True, description="Filtrar por ativos/inativos"),
    ordenar_por: str = Query("avaliacao", description="Ordenar por: avaliacao, vendas, alfabetico, recente"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar fornecedores com filtros e paginação"""
    try:
        # Importar modelo aqui para evitar imports circulares
        from sqlalchemy import Table, MetaData, Column, String, Boolean, DECIMAL, Integer, UUID as SQLUUID, TIMESTAMP

        metadata = MetaData()
        tb_fornecedores = Table(
            'tb_fornecedores',
            metadata,
            Column('id_fornecedor', SQLUUID),
            Column('nm_empresa', String),
            Column('nr_cnpj', String),
            Column('nm_cidade', String),
            Column('nm_estado', String),
            Column('ds_categorias_produtos', String),  # Array
            Column('st_verificado', Boolean),
            Column('st_ativo', Boolean),
            Column('nr_avaliacao_media', DECIMAL),
            Column('nr_total_vendas', Integer),
            Column('dt_criacao', TIMESTAMP),
            autoload_with=db.bind
        )

        # Construir query
        query = select(tb_fornecedores).where(tb_fornecedores.c.st_ativo == st_ativo)

        # Filtros
        if search:
            query = query.where(
                (tb_fornecedores.c.nm_empresa.ilike(f"%{search}%")) |
                (tb_fornecedores.c.nr_cnpj.ilike(f"%{search}%"))
            )

        if cidade:
            query = query.where(tb_fornecedores.c.nm_cidade.ilike(f"%{cidade}%"))

        if estado:
            query = query.where(tb_fornecedores.c.nm_estado == estado.upper())

        if st_verificado is not None:
            query = query.where(tb_fornecedores.c.st_verificado == st_verificado)

        if categoria:
            # Filtrar por categoria no array
            query = query.where(tb_fornecedores.c.ds_categorias_produtos.contains([categoria]))

        # Ordenação
        if ordenar_por == "avaliacao":
            query = query.order_by(tb_fornecedores.c.nr_avaliacao_media.desc())
        elif ordenar_por == "vendas":
            query = query.order_by(tb_fornecedores.c.nr_total_vendas.desc())
        elif ordenar_por == "alfabetico":
            query = query.order_by(tb_fornecedores.c.nm_empresa.asc())
        elif ordenar_por == "recente":
            query = query.order_by(tb_fornecedores.c.dt_criacao.desc())

        # Contar total
        count_query = select(func.count()).select_from(query.alias())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Paginação
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Executar query
        result = await db.execute(query)
        fornecedores = result.fetchall()

        # Converter para response model
        items = [FornecedorResponse.model_validate(dict(f._mapping)) for f in fornecedores]

        return FornecedorList(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            }
        )

    except Exception as e:
        logger.error(f"Erro ao listar fornecedores: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{fornecedor_id}", response_model=FornecedorResponse)
async def obter_fornecedor(
    fornecedor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter detalhes de um fornecedor"""
    try:
        from sqlalchemy import Table, MetaData

        metadata = MetaData()
        tb_fornecedores = Table('tb_fornecedores', metadata, autoload_with=db.bind)

        query = select(tb_fornecedores).where(tb_fornecedores.c.id_fornecedor == fornecedor_id)
        result = await db.execute(query)
        fornecedor = result.fetchone()

        if not fornecedor:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        return FornecedorResponse.model_validate(dict(fornecedor._mapping))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter fornecedor: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# CRIAÇÃO E ATUALIZAÇÃO
# ============================================================================


@router.post("/", status_code=201, response_model=FornecedorResponse)
async def criar_fornecedor(
    fornecedor_data: FornecedorCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Criar novo fornecedor"""
    try:
        from sqlalchemy import Table, MetaData, insert

        metadata = MetaData()
        tb_fornecedores = Table('tb_fornecedores', metadata, autoload_with=db.bind)

        # Verificar se CNPJ já existe
        check_query = select(tb_fornecedores).where(tb_fornecedores.c.nr_cnpj == fornecedor_data.nr_cnpj)
        existing = await db.execute(check_query)
        if existing.fetchone():
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

        # Preparar dados
        fornecedor_dict = fornecedor_data.model_dump(exclude_none=True)
        fornecedor_dict['id_fornecedor'] = uuid.uuid4()

        # Inserir
        insert_stmt = insert(tb_fornecedores).values(**fornecedor_dict).returning(tb_fornecedores)
        result = await db.execute(insert_stmt)
        await db.commit()

        novo_fornecedor = result.fetchone()
        return FornecedorResponse.model_validate(dict(novo_fornecedor._mapping))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar fornecedor: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{fornecedor_id}", response_model=FornecedorResponse)
async def atualizar_fornecedor(
    fornecedor_id: uuid.UUID,
    fornecedor_data: FornecedorUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Atualizar fornecedor"""
    try:
        from sqlalchemy import Table, MetaData, update

        metadata = MetaData()
        tb_fornecedores = Table('tb_fornecedores', metadata, autoload_with=db.bind)

        # Verificar se existe
        check_query = select(tb_fornecedores).where(tb_fornecedores.c.id_fornecedor == fornecedor_id)
        existing = await db.execute(check_query)
        if not existing.fetchone():
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        # Preparar dados para atualização
        update_data = fornecedor_data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

        # Atualizar
        update_stmt = (
            update(tb_fornecedores)
            .where(tb_fornecedores.c.id_fornecedor == fornecedor_id)
            .values(**update_data)
            .returning(tb_fornecedores)
        )
        result = await db.execute(update_stmt)
        await db.commit()

        fornecedor_atualizado = result.fetchone()
        return FornecedorResponse.model_validate(dict(fornecedor_atualizado._mapping))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao atualizar fornecedor: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{fornecedor_id}", status_code=204)
async def desativar_fornecedor(
    fornecedor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Desativar fornecedor (soft delete)"""
    try:
        from sqlalchemy import Table, MetaData, update

        metadata = MetaData()
        tb_fornecedores = Table('tb_fornecedores', metadata, autoload_with=db.bind)

        # Atualizar status
        update_stmt = (
            update(tb_fornecedores)
            .where(tb_fornecedores.c.id_fornecedor == fornecedor_id)
            .values(st_ativo=False)
        )
        result = await db.execute(update_stmt)
        await db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        return None

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao desativar fornecedor: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# ESTATÍSTICAS
# ============================================================================


@router.get("/{fornecedor_id}/stats", response_model=FornecedorStats)
async def obter_estatisticas_fornecedor(
    fornecedor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter estatísticas de um fornecedor"""
    try:
        from sqlalchemy import Table, MetaData, extract, and_
        from datetime import datetime, date

        metadata = MetaData()
        tb_fornecedores = Table('tb_fornecedores', metadata, autoload_with=db.bind)
        tb_produtos = Table('tb_produtos', metadata, autoload_with=db.bind)
        tb_pedidos = Table('tb_pedidos', metadata, autoload_with=db.bind)

        # Buscar fornecedor
        fornecedor_query = select(tb_fornecedores).where(tb_fornecedores.c.id_fornecedor == fornecedor_id)
        fornecedor_result = await db.execute(fornecedor_query)
        fornecedor = fornecedor_result.fetchone()

        if not fornecedor:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        # Contar produtos
        produtos_query = select(
            func.count().label('total'),
            func.count().filter(tb_produtos.c.st_ativo == "S").label('ativos')
        ).where(tb_produtos.c.id_fornecedor == fornecedor_id)

        produtos_result = await db.execute(produtos_query)
        produtos_stats = produtos_result.fetchone()

        # Estatísticas de pedidos
        mes_atual = datetime.now().month
        ano_atual = datetime.now().year

        pedidos_query = select(
            func.count().label('total_pedidos'),
            func.sum(tb_pedidos.c.vl_total).label('total_vendas'),
            func.count().filter(
                and_(
                    extract('month', tb_pedidos.c.dt_criacao) == mes_atual,
                    extract('year', tb_pedidos.c.dt_criacao) == ano_atual
                )
            ).label('pedidos_mes'),
            func.sum(tb_pedidos.c.vl_total).filter(
                and_(
                    extract('month', tb_pedidos.c.dt_criacao) == mes_atual,
                    extract('year', tb_pedidos.c.dt_criacao) == ano_atual
                )
            ).label('vendas_mes')
        ).where(tb_pedidos.c.id_fornecedor == fornecedor_id)

        pedidos_result = await db.execute(pedidos_query)
        pedidos_stats = pedidos_result.fetchone()

        return FornecedorStats(
            id_fornecedor=fornecedor_id,
            nm_empresa=fornecedor.nm_empresa,
            nr_total_produtos=produtos_stats.total or 0,
            nr_produtos_ativos=produtos_stats.ativos or 0,
            nr_total_pedidos=pedidos_stats.total_pedidos or 0,
            nr_pedidos_mes=pedidos_stats.pedidos_mes or 0,
            vl_total_vendas=float(pedidos_stats.total_vendas or 0),
            vl_vendas_mes=float(pedidos_stats.vendas_mes or 0),
            nr_avaliacao_media=float(fornecedor.nr_avaliacao_media or 0),
            nr_total_avaliacoes=int(fornecedor.nr_total_avaliacoes or 0),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do fornecedor: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
