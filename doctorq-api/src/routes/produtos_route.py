"""
Rotas para Marketplace de Produtos Físicos (Dermocosméticos, Equipamentos, etc.)
"""

import uuid
from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, or_, desc, asc, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/produtos", tags=["produtos"])

# ============================================
# Models
# ============================================

class ProdutoResponse(BaseModel):
    id_produto: str
    nm_produto: str
    ds_descricao: Optional[str]
    ds_categoria: str
    ds_marca: Optional[str]
    vl_preco: Decimal
    vl_preco_original: Optional[Decimal]
    nr_avaliacao_media: Decimal
    nr_total_avaliacoes: int
    nr_total_vendas: int
    st_estoque: bool
    nr_quantidade_estoque: int
    ds_selo: Optional[str]
    ds_imagem_url: Optional[str]
    st_destaque: bool

class CarrinhoCreate(BaseModel):
    id_produto: str
    nr_quantidade: int = Field(ge=1)

class FavoritoCreate(BaseModel):
    id_produto: str

# ============================================
# Produtos - Listagem e Detalhes
# ============================================

@router.get("/", response_model=dict)
async def listar_produtos(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(12, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    marca: Optional[str] = Query(None, description="Filtrar por marca"),
    preco_min: Optional[float] = Query(None, description="Preço mínimo"),
    preco_max: Optional[float] = Query(None, description="Preço máximo"),
    ordenar_por: str = Query("relevancia", description="Ordenar por: relevancia, preco_asc, preco_desc, avaliacao, vendas"),
    apenas_estoque: bool = Query(False, description="Apenas produtos em estoque"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar produtos do marketplace"""
    try:
        # Filtros base
        conditions = ["p.st_ativo = TRUE"]
        if search:
            conditions.append(f"p.nm_produto ILIKE '%{search}%'")
        if categoria:
            conditions.append(f"c.nm_categoria = '{categoria}'")
        if marca:
            conditions.append(f"p.ds_marca = '{marca}'")
        if preco_min is not None:
            conditions.append(f"p.vl_preco >= {preco_min}")
        if preco_max is not None:
            conditions.append(f"p.vl_preco <= {preco_max}")
        if apenas_estoque:
            conditions.append("p.nr_estoque > 0")

        where_clause = " AND ".join(conditions)

        # Ordenação
        order_clause = "p.nr_avaliacao_media DESC"
        if ordenar_por == "preco_asc":
            order_clause = "p.vl_preco ASC"
        elif ordenar_por == "preco_desc":
            order_clause = "p.vl_preco DESC"
        elif ordenar_por == "avaliacao":
            order_clause = "p.nr_avaliacao_media DESC"
        elif ordenar_por == "vendas":
            order_clause = "p.nr_total_vendas DESC"

        # Count total
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_produtos p
            LEFT JOIN tb_categorias_produtos c ON p.id_categoria = c.id_categoria
            WHERE {where_clause}
        """)
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Fetch produtos
        offset = (page - 1) * size
        produtos_query = text(f"""
            SELECT p.id_produto, p.nm_produto, p.ds_descricao,
                   COALESCE(c.nm_categoria, 'Sem Categoria') as ds_categoria,
                   p.ds_marca,
                   p.vl_preco, p.vl_preco_promocional as vl_preco_original,
                   p.nr_avaliacao_media, p.nr_total_avaliacoes,
                   p.nr_total_vendas,
                   (p.nr_estoque > 0) as st_estoque,
                   p.nr_estoque as nr_quantidade_estoque,
                   CASE
                       WHEN p.st_destaque THEN 'Destaque'
                       WHEN p.st_novidade THEN 'Novidade'
                       ELSE NULL
                   END as ds_selo,
                   p.ds_imagem_principal as ds_imagem_url,
                   p.st_destaque
            FROM tb_produtos p
            LEFT JOIN tb_categorias_produtos c ON p.id_categoria = c.id_categoria
            WHERE {where_clause}
            ORDER BY {order_clause}
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(produtos_query)
        produtos = []
        for row in result:
            produtos.append({
                "id_produto": str(row[0]),
                "nm_produto": row[1],
                "ds_descricao": row[2],
                "ds_categoria": row[3],
                "ds_marca": row[4],
                "vl_preco": float(row[5]),
                "vl_preco_original": float(row[6]) if row[6] else None,
                "nr_avaliacao_media": float(row[7]),
                "nr_total_avaliacoes": row[8],
                "nr_total_vendas": row[9],
                "st_estoque": row[10],
                "nr_quantidade_estoque": row[11],
                "ds_selo": row[12],
                "ds_imagem_url": row[13],
                "st_destaque": row[14]
            })

        return {
            "items": produtos,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except Exception as e:
        logger.error(f"Erro ao listar produtos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/categorias", response_model=List[str])
async def listar_categorias(
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar categorias disponíveis"""
    try:
        query = text("""
            SELECT DISTINCT c.nm_categoria
            FROM tb_categorias_produtos c
            INNER JOIN tb_produtos p ON p.id_categoria = c.id_categoria
            WHERE p.st_ativo = TRUE AND c.st_ativo = TRUE
            ORDER BY c.nm_categoria
        """)
        result = await db.execute(query)
        return [row[0] for row in result]
    except Exception as e:
        logger.error(f"Erro ao listar categorias: {str(e)}")
        return ["Dermocosméticos", "Equipamentos", "Suplementos", "Cosméticos"]


@router.get("/marcas", response_model=List[str])
async def listar_marcas(
    categoria: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar marcas disponíveis"""
    try:
        if categoria:
            query = text(f"""
                SELECT DISTINCT p.ds_marca
                FROM tb_produtos p
                INNER JOIN tb_categorias_produtos c ON p.id_categoria = c.id_categoria
                WHERE p.st_ativo = TRUE AND c.nm_categoria = '{categoria}'
                ORDER BY p.ds_marca
            """)
        else:
            query = text("SELECT DISTINCT ds_marca FROM tb_produtos WHERE st_ativo = TRUE ORDER BY ds_marca")
        result = await db.execute(query)
        return [row[0] for row in result if row[0]]
    except Exception as e:
        logger.error(f"Erro ao listar marcas: {str(e)}")
        return []


@router.get("/{produto_id}", response_model=dict)
async def get_produto(
    produto_id: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter detalhes de um produto"""
    try:
        query = text(f"""
            SELECT p.id_produto, p.nm_produto, p.ds_descricao,
                   COALESCE(c.nm_categoria, 'Sem Categoria') as ds_categoria,
                   p.ds_marca,
                   p.vl_preco, p.vl_preco_promocional as vl_preco_original,
                   p.nr_avaliacao_media, p.nr_total_avaliacoes,
                   p.nr_total_vendas,
                   (p.nr_estoque > 0) as st_estoque,
                   p.nr_estoque as nr_quantidade_estoque,
                   CASE
                       WHEN p.st_destaque THEN 'Destaque'
                       WHEN p.st_novidade THEN 'Novidade'
                       ELSE NULL
                   END as ds_selo,
                   p.ds_imagem_principal as ds_imagem_url,
                   p.ds_imagens as ds_imagens_adicionais,
                   '{{}}'::jsonb as ds_especificacoes,
                   p.ds_tags,
                   p.st_destaque
            FROM tb_produtos p
            LEFT JOIN tb_categorias_produtos c ON p.id_categoria = c.id_categoria
            WHERE p.id_produto = '{produto_id}' AND p.st_ativo = TRUE
        """)
        result = await db.execute(query)
        row = result.first()

        if not row:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        return {
            "id_produto": str(row[0]),
            "nm_produto": row[1],
            "ds_descricao": row[2],
            "ds_categoria": row[3],
            "ds_marca": row[4],
            "vl_preco": float(row[5]),
            "vl_preco_original": float(row[6]) if row[6] else None,
            "nr_avaliacao_media": float(row[7]),
            "nr_total_avaliacoes": row[8],
            "nr_total_vendas": row[9],
            "st_estoque": row[10],
            "nr_quantidade_estoque": row[11],
            "ds_selo": row[12],
            "ds_imagem_url": row[13],
            "ds_imagens_adicionais": row[14] or [],
            "ds_especificacoes": row[15] or {},
            "ds_tags": row[16] or [],
            "st_destaque": row[17]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter produto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


# ============================================
# Carrinho
# ============================================

@router.get("/carrinho/me", response_model=dict)
async def get_carrinho(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obter carrinho do usuário atual"""
    try:
        # ⚠️ FILTRO OBRIGATÓRIO: Apenas carrinho do usuário logado
        query = text(f"""
            SELECT c.id_carrinho, c.id_produto, c.nr_quantidade, c.vl_preco_unitario,
                   p.nm_produto, p.ds_imagem_url, p.st_estoque, p.nr_quantidade_estoque
            FROM tb_carrinho c
            JOIN tb_produtos p ON c.id_produto = p.id_produto
            WHERE c.id_user = '{current_user.id_user}'
        """)
        result = await db.execute(query)

        itens = []
        total = 0.0
        for row in result:
            preco_total_item = float(row[3]) * row[2]
            itens.append({
                "id_carrinho": str(row[0]),
                "id_produto": str(row[1]),
                "nr_quantidade": row[2],
                "vl_preco_unitario": float(row[3]),
                "vl_total_item": preco_total_item,
                "nm_produto": row[4],
                "ds_imagem_url": row[5],
                "st_estoque": row[6],
                "nr_quantidade_estoque": row[7]
            })
            total += preco_total_item

        return {
            "itens": itens,
            "vl_total": total,
            "nr_itens": len(itens)
        }

    except Exception as e:
        logger.error(f"Erro ao obter carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post("/carrinho", response_model=dict)
async def adicionar_ao_carrinho(
    item: CarrinhoCreate,
    db: AsyncSession = Depends(get_db),
    apikey: object = Depends(get_current_apikey),
):
    """Adicionar produto ao carrinho"""
    try:
        user_id = apikey.get("id_user")

        # Verificar se produto existe e está em estoque
        produto_query = text(f"SELECT vl_preco, st_estoque, nr_quantidade_estoque FROM tb_produtos WHERE id_produto = '{item.id_produto}'")
        produto_result = await db.execute(produto_query)
        produto = produto_result.first()

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        if not produto[1] or produto[2] < item.nr_quantidade:
            raise HTTPException(status_code=400, detail="Produto sem estoque suficiente")

        # Verificar se já existe no carrinho
        check_query = text(f"SELECT id_carrinho, nr_quantidade FROM tb_carrinho WHERE id_user = '{user_id}' AND id_produto = '{item.id_produto}'")
        existing = await db.execute(check_query)
        existing_row = existing.first()

        if existing_row:
            # Atualizar quantidade
            new_quantity = existing_row[1] + item.nr_quantidade
            update_query = text(f"""
                UPDATE tb_carrinho
                SET nr_quantidade = {new_quantity}
                WHERE id_carrinho = '{existing_row[0]}'
            """)
            await db.execute(update_query)
        else:
            # Inserir novo item
            insert_query = text(f"""
                INSERT INTO tb_carrinho (id_user, id_produto, nr_quantidade, vl_preco_unitario)
                VALUES ('{user_id}', '{item.id_produto}', {item.nr_quantidade}, {produto[0]})
            """)
            await db.execute(insert_query)

        await db.commit()

        return {"message": "Produto adicionado ao carrinho", "success": True}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao adicionar ao carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.delete("/carrinho/{carrinho_id}")
async def remover_do_carrinho(
    carrinho_id: str,
    db: AsyncSession = Depends(get_db),
    apikey: object = Depends(get_current_apikey),
):
    """Remover item do carrinho"""
    try:
        user_id = apikey.get("id_user")
        query = text(f"DELETE FROM tb_carrinho WHERE id_carrinho = '{carrinho_id}' AND id_user = '{user_id}'")
        await db.execute(query)
        await db.commit()

        return {"message": "Item removido do carrinho", "success": True}

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao remover do carrinho: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


# ============================================
# Favoritos
# ============================================

@router.get("/favoritos/me", response_model=List[dict])
async def get_favoritos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obter favoritos do usuário"""
    try:
        # ⚠️ FILTRO OBRIGATÓRIO: Apenas favoritos do usuário logado
        query = text(f"""
            SELECT f.id_favorito, f.id_produto, p.nm_produto, p.ds_marca, p.vl_preco,
                   p.ds_imagem_url, p.nr_avaliacao_media, p.st_estoque
            FROM tb_favoritos f
            JOIN tb_produtos p ON f.id_produto = p.id_produto
            WHERE f.id_user = '{current_user.id_user}'
            ORDER BY f.dt_criacao DESC
        """)
        result = await db.execute(query)

        favoritos = []
        for row in result:
            favoritos.append({
                "id_favorito": str(row[0]),
                "id_produto": str(row[1]),
                "nm_produto": row[2],
                "ds_marca": row[3],
                "vl_preco": float(row[4]),
                "ds_imagem_url": row[5],
                "nr_avaliacao_media": float(row[6]),
                "st_estoque": row[7]
            })

        return favoritos

    except Exception as e:
        logger.error(f"Erro ao obter favoritos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post("/favoritos", response_model=dict)
async def adicionar_favorito(
    item: FavoritoCreate,
    db: AsyncSession = Depends(get_db),
    apikey: object = Depends(get_current_apikey),
):
    """Adicionar produto aos favoritos"""
    try:
        user_id = apikey.get("id_user")

        # Verificar se já existe
        check_query = text(f"SELECT id_favorito FROM tb_favoritos WHERE id_user = '{user_id}' AND id_produto = '{item.id_produto}'")
        existing = await db.execute(check_query)

        if existing.first():
            return {"message": "Produto já está nos favoritos", "success": True}

        # Inserir
        insert_query = text(f"INSERT INTO tb_favoritos (id_user, id_produto) VALUES ('{user_id}', '{item.id_produto}')")
        await db.execute(insert_query)
        await db.commit()

        return {"message": "Produto adicionado aos favoritos", "success": True}

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao adicionar favorito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.delete("/favoritos/{produto_id}")
async def remover_favorito(
    produto_id: str,
    db: AsyncSession = Depends(get_db),
    apikey: object = Depends(get_current_apikey),
):
    """Remover produto dos favoritos"""
    try:
        user_id = apikey.get("id_user")
        query = text(f"DELETE FROM tb_favoritos WHERE id_produto = '{produto_id}' AND id_user = '{user_id}'")
        await db.execute(query)
        await db.commit()

        return {"message": "Produto removido dos favoritos", "success": True}

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao remover favorito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


# ============================================================================
# GERENCIAMENTO DE IMAGENS DE PRODUTOS
# ============================================================================

@router.post("/{id_produto}/imagens", response_model=dict)
async def adicionar_imagens_produto(
    id_produto: str,
    imagens: List[str],
    db: AsyncSession = Depends(get_db),
    apikey: object = Depends(get_current_apikey),
):
    """
    Adicionar imagens adicionais a um produto.
    As URLs são adicionadas ao array ds_imagens_adicionais.
    """
    try:
        # Verificar se o produto existe
        check_query = text("SELECT ds_imagens_adicionais FROM tb_produtos WHERE id_produto = :id_produto")
        result = await db.execute(check_query, {"id_produto": id_produto})
        produto = result.fetchone()

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Obter imagens atuais
        imagens_atuais = produto[0] if produto[0] else []

        # Adicionar novas imagens (evitar duplicatas)
        for img in imagens:
            if img not in imagens_atuais:
                imagens_atuais.append(img)

        # Atualizar no banco
        update_query = text("""
            UPDATE tb_produtos
            SET ds_imagens_adicionais = :imagens,
                dt_atualizacao = CURRENT_TIMESTAMP
            WHERE id_produto = :id_produto
        """)

        await db.execute(update_query, {
            "id_produto": id_produto,
            "imagens": imagens_atuais
        })
        await db.commit()

        logger.info(f"Imagens adicionadas ao produto {id_produto}: {len(imagens)} novas imagens")

        return {
            "message": "Imagens adicionadas com sucesso",
            "total_imagens": len(imagens_atuais),
            "imagens": imagens_atuais
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao adicionar imagens: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar imagens: {str(e)}")


@router.delete("/{id_produto}/imagens/{index}", response_model=dict)
async def remover_imagem_produto(
    id_produto: str,
    index: int = Path(..., ge=0, description="Índice da imagem a ser removida"),
    db: AsyncSession = Depends(get_db),
    apikey: object = Depends(get_current_apikey),
):
    """
    Remover uma imagem específica do array de imagens adicionais.
    """
    try:
        # Buscar imagens atuais
        check_query = text("SELECT ds_imagens_adicionais FROM tb_produtos WHERE id_produto = :id_produto")
        result = await db.execute(check_query, {"id_produto": id_produto})
        produto = result.fetchone()

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        imagens_atuais = produto[0] if produto[0] else []

        # Verificar se o índice é válido
        if index >= len(imagens_atuais):
            raise HTTPException(
                status_code=400,
                detail=f"Índice {index} inválido. O produto tem {len(imagens_atuais)} imagens."
            )

        # Remover imagem do índice especificado
        imagem_removida = imagens_atuais.pop(index)

        # Atualizar no banco
        update_query = text("""
            UPDATE tb_produtos
            SET ds_imagens_adicionais = :imagens,
                dt_atualizacao = CURRENT_TIMESTAMP
            WHERE id_produto = :id_produto
        """)

        await db.execute(update_query, {
            "id_produto": id_produto,
            "imagens": imagens_atuais
        })
        await db.commit()

        logger.info(f"Imagem removida do produto {id_produto}: {imagem_removida}")

        return {
            "message": "Imagem removida com sucesso",
            "imagem_removida": imagem_removida,
            "total_imagens": len(imagens_atuais),
            "imagens": imagens_atuais
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao remover imagem: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao remover imagem: {str(e)}")
