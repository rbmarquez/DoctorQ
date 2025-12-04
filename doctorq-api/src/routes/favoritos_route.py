"""
Rotas para Sistema de Favoritos
Permite aos usuários favoritar produtos, procedimentos, profissionais, clínicas e fornecedores
"""

import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/favoritos", tags=["favoritos"])

# ============================================
# Models
# ============================================

class FavoritoCreateRequest(BaseModel):
    id_user: str
    ds_tipo_item: str = Field(..., description="Tipo: produto, procedimento, profissional, clinica, fornecedor")
    id_produto: Optional[str] = None
    id_procedimento: Optional[str] = None
    id_profissional: Optional[str] = None
    id_clinica: Optional[str] = None
    id_fornecedor: Optional[str] = None
    ds_categoria_favorito: Optional[str] = None
    ds_observacoes: Optional[str] = None
    nr_prioridade: int = Field(default=0, ge=0, le=10)
    st_notificar_promocao: bool = True
    st_notificar_disponibilidade: bool = True

class FavoritoResponse(BaseModel):
    id_favorito: str
    id_user: str
    ds_tipo_item: str
    id_produto: Optional[str]
    id_procedimento: Optional[str]
    id_profissional: Optional[str]
    id_clinica: Optional[str]
    id_fornecedor: Optional[str]
    ds_categoria_favorito: Optional[str]
    ds_observacoes: Optional[str]
    nr_prioridade: int
    st_notificar_promocao: bool
    st_notificar_disponibilidade: bool
    dt_criacao: datetime
    dt_atualizacao: datetime

    # Dados relacionados
    nm_item: Optional[str] = None
    ds_item: Optional[str] = None
    ds_foto: Optional[str] = None
    vl_preco: Optional[float] = None

# ============================================
# Favoritos - CRUD
# ============================================

@router.post("/", response_model=FavoritoResponse)
async def adicionar_favorito(
    request: FavoritoCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Adicionar item aos favoritos.
    Suporta: produtos, procedimentos, profissionais, clínicas, fornecedores
    """
    try:
        # Validar que pelo menos um ID foi fornecido
        item_ids = [
            request.id_produto,
            request.id_procedimento,
            request.id_profissional,
            request.id_clinica,
            request.id_fornecedor
        ]

        if not any(item_ids):
            raise HTTPException(
                status_code=400,
                detail="Você deve fornecer pelo menos um ID (produto, procedimento, profissional, clínica ou fornecedor)"
            )

        # Verificar se já existe
        check_query = text("""
            SELECT id_favorito
            FROM tb_favoritos
            WHERE id_user = :id_user
              AND (
                (id_produto = :id_produto AND id_produto IS NOT NULL) OR
                (id_procedimento = :id_procedimento AND id_procedimento IS NOT NULL) OR
                (id_profissional = :id_profissional AND id_profissional IS NOT NULL) OR
                (id_clinica = :id_clinica AND id_clinica IS NOT NULL) OR
                (id_fornecedor = :id_fornecedor AND id_fornecedor IS NOT NULL)
              )
        """)

        check_result = await db.execute(check_query, {
            "id_user": request.id_user,
            "id_produto": request.id_produto,
            "id_procedimento": request.id_procedimento,
            "id_profissional": request.id_profissional,
            "id_clinica": request.id_clinica,
            "id_fornecedor": request.id_fornecedor,
        })

        existing = check_result.fetchone()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Este item já está nos seus favoritos"
            )

        # Inserir favorito
        query = text("""
            INSERT INTO tb_favoritos (
                id_user, ds_tipo_item, id_produto, id_procedimento, id_profissional,
                id_clinica, id_fornecedor, ds_categoria_favorito, ds_observacoes,
                nr_prioridade, st_notificar_promocao, st_notificar_disponibilidade
            )
            VALUES (
                :id_user, :ds_tipo_item, :id_produto, :id_procedimento, :id_profissional,
                :id_clinica, :id_fornecedor, :ds_categoria_favorito, :ds_observacoes,
                :nr_prioridade, :st_notificar_promocao, :st_notificar_disponibilidade
            )
            RETURNING id_favorito, dt_criacao, dt_atualizacao
        """)

        result = await db.execute(query, {
            "id_user": request.id_user,
            "ds_tipo_item": request.ds_tipo_item,
            "id_produto": request.id_produto,
            "id_procedimento": request.id_procedimento,
            "id_profissional": request.id_profissional,
            "id_clinica": request.id_clinica,
            "id_fornecedor": request.id_fornecedor,
            "ds_categoria_favorito": request.ds_categoria_favorito,
            "ds_observacoes": request.ds_observacoes,
            "nr_prioridade": request.nr_prioridade,
            "st_notificar_promocao": request.st_notificar_promocao,
            "st_notificar_disponibilidade": request.st_notificar_disponibilidade,
        })

        await db.commit()

        row = result.fetchone()

        return {
            "id_favorito": str(row[0]),
            "id_user": request.id_user,
            "ds_tipo_item": request.ds_tipo_item,
            "id_produto": request.id_produto,
            "id_procedimento": request.id_procedimento,
            "id_profissional": request.id_profissional,
            "id_clinica": request.id_clinica,
            "id_fornecedor": request.id_fornecedor,
            "ds_categoria_favorito": request.ds_categoria_favorito,
            "ds_observacoes": request.ds_observacoes,
            "nr_prioridade": request.nr_prioridade,
            "st_notificar_promocao": request.st_notificar_promocao,
            "st_notificar_disponibilidade": request.st_notificar_disponibilidade,
            "dt_criacao": row[1],
            "dt_atualizacao": row[2],
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao adicionar favorito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar favorito: {str(e)}")


@router.get("/", response_model=dict)
async def listar_favoritos(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar favoritos do usuário com dados relacionados"""
    try:
        # ⚠️ FILTRO OBRIGATÓRIO: Apenas favoritos do usuário logado
        conditions = [f"f.id_user = '{current_user.id_user}'"]

        if tipo:
            conditions.append(f"f.ds_tipo_item = '{tipo}'")

        if categoria:
            conditions.append(f"f.ds_categoria_favorito = '{categoria}'")

        where_clause = " AND ".join(conditions)

        # Count
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_favoritos f
            WHERE {where_clause}
        """)

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        offset = (page - 1) * size

        # Query com LEFT JOINs para pegar informações de cada tipo
        query = text(f"""
            SELECT
                f.id_favorito,
                f.ds_tipo_item,
                f.id_produto,
                f.id_procedimento,
                f.id_profissional,
                f.id_clinica,
                f.id_fornecedor,
                f.ds_categoria_favorito,
                f.nr_prioridade,
                f.st_notificar_promocao,
                f.st_notificar_disponibilidade,
                f.dt_criacao,

                -- Dados do produto
                prod.nm_produto,
                prod.ds_descricao,
                prod.vl_preco,
                prod.ds_imagem_principal,

                -- Dados do procedimento
                proc.nm_procedimento,
                proc.ds_procedimento,
                proc.vl_preco,
                proc.ds_foto_principal,

                -- Dados do profissional
                prof.nm_profissional,
                prof.ds_especialidades,
                prof.ds_foto_url as ds_foto,

                -- Dados da clínica
                clin.nm_clinica,
                clin.ds_endereco,
                clin.ds_foto_principal,

                -- Dados do fornecedor
                forn.nm_empresa,
                forn.ds_descricao,
                forn.ds_logo_url

            FROM tb_favoritos f
            LEFT JOIN tb_produtos prod ON f.id_produto = prod.id_produto
            LEFT JOIN tb_procedimentos proc ON f.id_procedimento = proc.id_procedimento
            LEFT JOIN tb_profissionais prof ON f.id_profissional = prof.id_profissional
            LEFT JOIN tb_clinicas clin ON f.id_clinica = clin.id_clinica
            LEFT JOIN tb_fornecedores forn ON f.id_fornecedor = forn.id_fornecedor
            WHERE {where_clause}
            ORDER BY f.nr_prioridade DESC, f.dt_criacao DESC
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        favoritos = []
        for row in rows:
            # Determinar qual item está favoritado e pegar os dados correspondentes
            tipo_item = row[1]

            if tipo_item == "produto" and row[12]:  # nm_produto
                nm_item = row[12]
                ds_item = row[13]
                vl_preco = float(row[14]) if row[14] else None
                ds_foto = row[15]
            elif tipo_item == "procedimento" and row[16]:  # nm_procedimento
                nm_item = row[16]
                ds_item = row[17]
                vl_preco = float(row[18]) if row[18] else None
                ds_foto = row[19]
            elif tipo_item == "profissional" and row[20]:  # nm_profissional
                nm_item = row[20]
                ds_item = row[21]
                vl_preco = None
                ds_foto = row[22]
            elif tipo_item == "clinica" and row[23]:  # nm_clinica
                nm_item = row[23]
                ds_item = row[24]
                vl_preco = None
                ds_foto = row[25]
            elif tipo_item == "fornecedor" and row[26]:  # nm_fornecedor
                nm_item = row[26]
                ds_item = row[27]
                vl_preco = None
                ds_foto = row[28]
            else:
                nm_item = "Item não encontrado"
                ds_item = None
                vl_preco = None
                ds_foto = None

            favoritos.append({
                "id_favorito": str(row[0]),
                "ds_tipo_item": row[1],
                "id_produto": str(row[2]) if row[2] else None,
                "id_procedimento": str(row[3]) if row[3] else None,
                "id_profissional": str(row[4]) if row[4] else None,
                "id_clinica": str(row[5]) if row[5] else None,
                "id_fornecedor": str(row[6]) if row[6] else None,
                "ds_categoria_favorito": row[7],
                "nr_prioridade": row[8],
                "st_notificar_promocao": row[9],
                "st_notificar_disponibilidade": row[10],
                "dt_criacao": row[11].isoformat() if row[11] else None,
                "nm_item": nm_item,
                "ds_item": ds_item,
                "vl_preco": vl_preco,
                "ds_foto": ds_foto,
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": favoritos,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar favoritos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar favoritos: {str(e)}")


@router.delete("/{favorito_id}")
async def remover_favorito(
    favorito_id: str,
    id_user: str = Query(..., description="ID do usuário (validação)"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Remover item dos favoritos"""
    try:
        query = text("""
            DELETE FROM tb_favoritos
            WHERE id_favorito = :id_favorito
              AND id_user = :id_user
            RETURNING id_favorito
        """)

        result = await db.execute(query, {
            "id_favorito": favorito_id,
            "id_user": id_user
        })

        await db.commit()

        row = result.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Favorito não encontrado ou você não tem permissão para removê-lo"
            )

        return {"message": "Favorito removido com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao remover favorito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao remover favorito: {str(e)}")


@router.get("/verificar/{tipo}/{item_id}")
async def verificar_favorito(
    tipo: str,
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verificar se um item está nos favoritos"""
    try:
        # Mapear tipo para coluna
        tipo_coluna_map = {
            "produto": "id_produto",
            "procedimento": "id_procedimento",
            "profissional": "id_profissional",
            "clinica": "id_clinica",
            "fornecedor": "id_fornecedor",
        }

        if tipo not in tipo_coluna_map:
            raise HTTPException(status_code=400, detail="Tipo inválido")

        coluna = tipo_coluna_map[tipo]

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas favoritos do usuário logado
        query = text(f"""
            SELECT id_favorito
            FROM tb_favoritos
            WHERE id_user = :id_user
              AND {coluna} = :item_id
        """)

        result = await db.execute(query, {
            "id_user": str(current_user.id_user),
            "item_id": item_id
        })

        row = result.fetchone()

        return {
            "is_favorito": row is not None,
            "id_favorito": str(row[0]) if row else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar favorito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao verificar favorito: {str(e)}")


@router.get("/stats/me")
async def estatisticas_favoritos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Estatísticas dos favoritos do usuário logado"""
    try:
        # ⚠️ FILTRO OBRIGATÓRIO: Apenas estatísticas do usuário logado
        query = text("""
            SELECT
                COUNT(*) as total,
                ds_tipo_item,
                COUNT(CASE WHEN st_notificar_promocao = TRUE THEN 1 END) as com_notificacao_promocao
            FROM tb_favoritos
            WHERE id_user = :id_user
            GROUP BY ds_tipo_item
            ORDER BY total DESC
        """)

        result = await db.execute(query, {"id_user": str(current_user.id_user)})
        rows = result.fetchall()

        stats = {
            "total_geral": 0,
            "por_tipo": []
        }

        for row in rows:
            stats["total_geral"] += row[0]
            stats["por_tipo"].append({
                "tipo": row[1],
                "total": row[0],
                "com_notificacao_promocao": row[2]
            })

        return stats

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")
