"""
Rotas para API de Produtos - Versão ORM
"""

import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.produto import (
    ProdutoCreate,
    ProdutoUpdate,
    ProdutoResponse,
    ProdutoList,
    ProdutoListItem,
    CategoriaProduto,
    ProdutoStats,
)
from src.models.produto_orm import ProdutoORM, CategoriaProdutoORM, ProdutoVariacaoORM
from src.models.fornecedor_orm import FornecedorORM
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/produtos-api", tags=["produtos-api"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def produto_orm_to_dict(produto: ProdutoORM, include_relations: bool = False) -> dict:
    """Converter ProdutoORM para dict"""
    produto_dict = {
        "id_produto": produto.id_produto,
        "nm_produto": produto.nm_produto,
        "ds_descricao": produto.ds_descricao,
        "ds_descricao_curta": produto.ds_descricao_curta,
        "ds_marca": produto.ds_marca,
        "ds_sku": produto.ds_sku,
        "vl_preco": produto.vl_preco,
        "vl_preco_promocional": produto.vl_preco_promocional,
        "ds_imagem_url": produto.ds_imagem_url,
        "ds_imagens_adicionais": produto.ds_imagens_adicionais,
        "id_categoria": produto.id_categoria,
        "id_fornecedor": produto.id_fornecedor,
        "nr_quantidade_estoque": produto.nr_quantidade_estoque,
        "st_estoque": produto.st_estoque,
        "st_destaque": produto.st_destaque,
        "st_promocao": produto.st_promocao,
        "st_vegano": produto.st_vegano,
        "st_cruelty_free": produto.st_cruelty_free,
        "st_organico": produto.st_organico,
        "st_ativo": produto.st_ativo,
        "ds_selo": produto.ds_selo,
        "ds_tags": produto.ds_tags,
        "nr_avaliacao_media": produto.nr_avaliacao_media,
        "nr_total_avaliacoes": produto.nr_total_avaliacoes,
        "nr_total_vendas": produto.nr_total_vendas,
        "dt_criacao": produto.dt_criacao,
        "dt_atualizacao": produto.dt_atualizacao,
        "dt_inicio_promocao": produto.dt_inicio_promocao,
        "dt_fim_promocao": produto.dt_fim_promocao,
        "ds_especificacoes": produto.ds_especificacoes,
        "ds_slug": produto.ds_slug,
    }

    if include_relations:
        if produto.categoria:
            produto_dict["ds_categoria"] = produto.categoria.nm_categoria
        if produto.fornecedor:
            produto_dict["fornecedor_nome"] = produto.fornecedor.nm_empresa
            produto_dict["fornecedor_logo"] = produto.fornecedor.ds_logo_url

    return produto_dict


# ============================================================================
# CATEGORIAS
# ============================================================================


@router.get("/categorias", response_model=List[CategoriaProduto])
async def listar_categorias(
    st_ativo: bool = Query(True, description="Filtrar por ativas/inativas"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar todas as categorias de produtos"""
    try:
        query = select(CategoriaProdutoORM).where(CategoriaProdutoORM.st_ativo == st_ativo)
        query = query.order_by(CategoriaProdutoORM.nm_categoria.asc())

        result = await db.execute(query)
        categorias = result.scalars().all()

        return [
            CategoriaProduto(
                id_categoria=c.id_categoria,
                nm_categoria=c.nm_categoria,
                ds_descricao=c.ds_descricao,
                ds_icone=c.ds_icone,
                ds_imagem_url=c.ds_imagem_url,
                nr_ordem=c.nr_ordem,
                st_ativo=c.st_ativo,
            )
            for c in categorias
        ]

    except Exception as e:
        logger.error(f"Erro ao listar categorias: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# LISTAGEM E BUSCA DE PRODUTOS
# ============================================================================


@router.get("/", response_model=ProdutoList)
async def listar_produtos(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(12, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome, marca ou SKU"),
    id_categoria: Optional[str] = Query(None, description="Filtrar por categoria (UUID)"),
    id_fornecedor: Optional[str] = Query(None, description="Filtrar por fornecedor (UUID)"),
    marca: Optional[str] = Query(None, description="Filtrar por marca"),
    tags: Optional[str] = Query(None, description="Filtrar por tags (separadas por vírgula)"),
    vl_min: Optional[float] = Query(None, description="Preço mínimo"),
    vl_max: Optional[float] = Query(None, description="Preço máximo"),
    em_estoque: Optional[bool] = Query(None, description="Apenas produtos em estoque"),
    st_promocao: Optional[bool] = Query(None, description="Apenas produtos em promoção"),
    st_vegano: Optional[bool] = Query(None, description="Apenas produtos veganos"),
    st_organico: Optional[bool] = Query(None, description="Apenas produtos orgânicos"),
    st_destaque: Optional[bool] = Query(None, description="Apenas produtos em destaque"),
    st_ativo: bool = Query(True, description="Filtrar por ativos/inativos"),
    ordenar_por: str = Query("relevancia", description="Ordenar por: relevancia, preco_asc, preco_desc, avaliacao, mais_vendidos, recente, alfabetico"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar produtos com filtros avançados e paginação"""
    try:
        # Query base com eager loading de relacionamentos
        query = select(ProdutoORM).options(
            selectinload(ProdutoORM.categoria),
            selectinload(ProdutoORM.fornecedor)
        ).where(ProdutoORM.st_ativo == st_ativo)

        # Filtros
        if search:
            query = query.where(
                or_(
                    ProdutoORM.nm_produto.ilike(f"%{search}%"),
                    ProdutoORM.ds_marca.ilike(f"%{search}%"),
                    ProdutoORM.ds_sku.ilike(f"%{search}%"),
                    ProdutoORM.ds_descricao.ilike(f"%{search}%")
                )
            )

        if id_categoria:
            try:
                categoria_uuid = uuid.UUID(id_categoria)
                query = query.where(ProdutoORM.id_categoria == categoria_uuid)
            except ValueError:
                pass

        if id_fornecedor:
            try:
                fornecedor_uuid = uuid.UUID(id_fornecedor)
                query = query.where(ProdutoORM.id_fornecedor == fornecedor_uuid)
            except ValueError:
                pass

        if marca:
            query = query.where(ProdutoORM.ds_marca.ilike(f"%{marca}%"))

        if tags:
            tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
            for tag in tags_list:
                query = query.where(ProdutoORM.ds_tags.contains([tag]))

        if vl_min is not None:
            query = query.where(ProdutoORM.vl_preco >= vl_min)

        if vl_max is not None:
            query = query.where(ProdutoORM.vl_preco <= vl_max)

        if em_estoque:
            query = query.where(
                and_(
                    ProdutoORM.st_estoque == True,
                    ProdutoORM.nr_quantidade_estoque > 0
                )
            )

        if st_promocao:
            agora = datetime.now()
            query = query.where(
                and_(
                    ProdutoORM.vl_preco_promocional.isnot(None),
                    or_(
                        ProdutoORM.dt_inicio_promocao.is_(None),
                        ProdutoORM.dt_inicio_promocao <= agora
                    ),
                    or_(
                        ProdutoORM.dt_fim_promocao.is_(None),
                        ProdutoORM.dt_fim_promocao >= agora
                    )
                )
            )

        if st_vegano:
            query = query.where(ProdutoORM.st_vegano == True)

        if st_organico:
            query = query.where(ProdutoORM.st_organico == True)

        if st_destaque:
            query = query.where(ProdutoORM.st_destaque == True)

        # Ordenação
        if ordenar_por == "preco_asc":
            query = query.order_by(ProdutoORM.vl_preco.asc())
        elif ordenar_por == "preco_desc":
            query = query.order_by(ProdutoORM.vl_preco.desc())
        elif ordenar_por == "avaliacao":
            query = query.order_by(ProdutoORM.nr_avaliacao_media.desc())
        elif ordenar_por == "mais_vendidos":
            query = query.order_by(ProdutoORM.nr_total_vendas.desc())
        elif ordenar_por == "recente":
            query = query.order_by(ProdutoORM.dt_criacao.desc())
        elif ordenar_por == "alfabetico":
            query = query.order_by(ProdutoORM.nm_produto.asc())
        else:  # relevancia (destaque + avaliação)
            query = query.order_by(
                ProdutoORM.st_destaque.desc(),
                ProdutoORM.nr_avaliacao_media.desc()
            )

        # Contar total (sem eager loading para performance)
        count_query = select(func.count()).select_from(ProdutoORM).where(
            ProdutoORM.st_ativo == st_ativo
        )
        # Aplicar os mesmos filtros
        if search:
            count_query = count_query.where(
                or_(
                    ProdutoORM.nm_produto.ilike(f"%{search}%"),
                    ProdutoORM.ds_marca.ilike(f"%{search}%"),
                    ProdutoORM.ds_sku.ilike(f"%{search}%"),
                    ProdutoORM.ds_descricao.ilike(f"%{search}%")
                )
            )
        if id_categoria:
            try:
                categoria_uuid = uuid.UUID(id_categoria)
                count_query = count_query.where(ProdutoORM.id_categoria == categoria_uuid)
            except ValueError:
                pass

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Paginação
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Executar query
        result = await db.execute(query)
        produtos = result.scalars().all()

        # Converter para modelo de resposta
        items = []
        for p in produtos:
            # Construir lista de certificações
            certificacoes = []
            if p.st_vegano:
                certificacoes.append('vegano')
            if p.st_cruelty_free:
                certificacoes.append('cruelty-free')
            if p.st_organico:
                certificacoes.append('orgânico')

            item = ProdutoListItem(
                id_produto=p.id_produto,
                nm_produto=p.nm_produto,
                ds_descricao_curta=p.ds_descricao_curta,
                ds_marca=p.ds_marca,
                vl_preco=float(p.vl_preco),
                vl_preco_promocional=float(p.vl_preco_promocional) if p.vl_preco_promocional else None,
                ds_imagem_url=p.ds_imagem_url,
                nr_avaliacao_media=float(p.nr_avaliacao_media or 0),
                nr_total_avaliacoes=int(p.nr_total_avaliacoes or 0),
                st_estoque=p.st_estoque,
                st_destaque=p.st_destaque,
                ds_selo=p.ds_selo,
                ds_tags=p.ds_tags or [],
                certificacoes=certificacoes,
                fornecedor_nome=p.fornecedor.nm_empresa if p.fornecedor else None
            )
            items.append(item)

        return ProdutoList(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            }
        )

    except Exception as e:
        logger.error(f"Erro ao listar produtos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}") from e


@router.get("/{produto_id}", response_model=ProdutoResponse)
async def obter_produto(
    produto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter detalhes completos de um produto"""
    try:
        query = select(ProdutoORM).options(
            selectinload(ProdutoORM.categoria),
            selectinload(ProdutoORM.fornecedor)
        ).where(ProdutoORM.id_produto == produto_id)

        result = await db.execute(query)
        produto = result.scalar_one_or_none()

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        produto_dict = produto_orm_to_dict(produto, include_relations=True)
        return ProdutoResponse.model_validate(produto_dict)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter produto: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# CRIAÇÃO E ATUALIZAÇÃO
# ============================================================================


@router.post("/", status_code=201, response_model=ProdutoResponse)
async def criar_produto(
    produto_data: ProdutoCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Criar novo produto"""
    try:
        # Verificar se SKU já existe (se fornecido)
        if produto_data.ds_sku:
            check_query = select(ProdutoORM).where(ProdutoORM.ds_sku == produto_data.ds_sku)
            existing = await db.execute(check_query)
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="SKU já cadastrado")

        # Preparar dados
        produto_dict = produto_data.model_dump(exclude_none=False)

        # Gerar slug se não fornecido
        if not produto_dict.get('ds_slug') and produto_dict.get('nm_produto'):
            slug = produto_dict['nm_produto'].lower()
            slug = slug.replace(' ', '-').replace('ã', 'a').replace('á', 'a').replace('ç', 'c')
            produto_dict['ds_slug'] = slug

        # Criar instância ORM
        novo_produto = ProdutoORM(**produto_dict)

        # Adicionar ao banco
        db.add(novo_produto)
        await db.commit()
        await db.refresh(novo_produto)

        # Carregar relacionamentos
        await db.refresh(novo_produto, ['categoria', 'fornecedor'])

        produto_response = produto_orm_to_dict(novo_produto, include_relations=True)
        return ProdutoResponse.model_validate(produto_response)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar produto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}") from e


@router.put("/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(
    produto_id: uuid.UUID,
    produto_data: ProdutoUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Atualizar produto existente"""
    try:
        # Buscar produto
        query = select(ProdutoORM).where(ProdutoORM.id_produto == produto_id)
        result = await db.execute(query)
        produto = result.scalar_one_or_none()

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Preparar dados para atualização
        update_data = produto_data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

        # Atualizar campos
        for field, value in update_data.items():
            setattr(produto, field, value)

        await db.commit()
        await db.refresh(produto)

        # Carregar relacionamentos
        await db.refresh(produto, ['categoria', 'fornecedor'])

        produto_dict = produto_orm_to_dict(produto, include_relations=True)
        return ProdutoResponse.model_validate(produto_dict)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao atualizar produto: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{produto_id}", status_code=204)
async def desativar_produto(
    produto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Desativar produto (soft delete)"""
    try:
        # Buscar produto
        query = select(ProdutoORM).where(ProdutoORM.id_produto == produto_id)
        result = await db.execute(query)
        produto = result.scalar_one_or_none()

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Soft delete
        produto.st_ativo = False
        await db.commit()

        return None

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao desativar produto: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ============================================================================
# ESTATÍSTICAS
# ============================================================================


@router.get("/{produto_id}/stats", response_model=ProdutoStats)
async def obter_estatisticas_produto(
    produto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter estatísticas de um produto"""
    try:
        # Buscar produto
        query = select(ProdutoORM).where(ProdutoORM.id_produto == produto_id)
        result = await db.execute(query)
        produto = result.scalar_one_or_none()

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Por enquanto, retornar estatísticas básicas do próprio produto
        # TODO: Implementar contagem de favoritos, visualizações, carrinho quando essas tabelas estiverem populadas

        return ProdutoStats(
            id_produto=produto_id,
            nm_produto=produto.nm_produto,
            nr_visualizacoes=0,  # TODO: implementar tracking
            nr_favoritos=0,  # TODO: contar na tb_favoritos
            nr_carrinho=0,  # TODO: contar na tb_carrinho
            nr_vendas=int(produto.nr_total_vendas or 0),
            vl_total_vendas=0.0,  # TODO: somar da tb_pedidos
            nr_avaliacao_media=float(produto.nr_avaliacao_media or 0),
            nr_total_avaliacoes=int(produto.nr_total_avaliacoes or 0),
            nr_estoque_atual=int(produto.nr_quantidade_estoque or 0),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do produto: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
