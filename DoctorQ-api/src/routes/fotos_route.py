"""
Rotas para Galeria de Fotos
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
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/fotos", tags=["fotos"])

# ============================================
# Models
# ============================================

class FotoCreateRequest(BaseModel):
    id_user: str
    id_album: Optional[str] = None
    ds_url: str
    ds_thumbnail_url: Optional[str] = None
    nm_arquivo: Optional[str] = None
    ds_tipo_mime: str = "image/jpeg"
    nr_tamanho_bytes: Optional[int] = None
    nr_largura: Optional[int] = None
    nr_altura: Optional[int] = None
    ds_titulo: Optional[str] = None
    ds_legenda: Optional[str] = None
    ds_tags: Optional[List[str]] = None
    ds_tipo_foto: Optional[str] = Field(None, description="antes, depois, durante, comparacao")
    id_agendamento: Optional[str] = None
    id_procedimento: Optional[str] = None
    id_produto: Optional[str] = None
    dt_foto_tirada: Optional[datetime] = None

class FotoResponse(BaseModel):
    id_foto: str
    id_user: str
    id_album: Optional[str]
    ds_url: str
    ds_thumbnail_url: Optional[str]
    nm_arquivo: Optional[str]
    ds_tipo_mime: str
    nr_tamanho_bytes: Optional[int]
    nr_largura: Optional[int]
    nr_altura: Optional[int]
    ds_titulo: Optional[str]
    ds_legenda: Optional[str]
    ds_tags: Optional[List[str]]
    ds_tipo_foto: Optional[str]
    st_processada: bool
    dt_criacao: datetime
    nm_user: Optional[str] = None

# ============================================
# Fotos - CRUD
# ============================================

@router.post("/", response_model=FotoResponse)
async def upload_foto(
    request: FotoCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Registrar nova foto no sistema"""
    try:
        query = text("""
            INSERT INTO tb_fotos (
                id_user, id_album, ds_url, ds_thumbnail_url, nm_arquivo, ds_tipo_mime,
                nr_tamanho_bytes, nr_largura, nr_altura, ds_titulo, ds_legenda, ds_tags,
                ds_tipo_foto, id_agendamento, id_procedimento, id_produto, dt_foto_tirada
            )
            VALUES (
                :id_user, :id_album, :ds_url, :ds_thumbnail_url, :nm_arquivo, :ds_tipo_mime,
                :nr_tamanho_bytes, :nr_largura, :nr_altura, :ds_titulo, :ds_legenda, :ds_tags,
                :ds_tipo_foto, :id_agendamento, :id_procedimento, :id_produto, :dt_foto_tirada
            )
            RETURNING id_foto, st_processada, dt_criacao
        """)

        result = await db.execute(query, {
            "id_user": request.id_user,
            "id_album": request.id_album,
            "ds_url": request.ds_url,
            "ds_thumbnail_url": request.ds_thumbnail_url,
            "nm_arquivo": request.nm_arquivo,
            "ds_tipo_mime": request.ds_tipo_mime,
            "nr_tamanho_bytes": request.nr_tamanho_bytes,
            "nr_largura": request.nr_largura,
            "nr_altura": request.nr_altura,
            "ds_titulo": request.ds_titulo,
            "ds_legenda": request.ds_legenda,
            "ds_tags": request.ds_tags,
            "ds_tipo_foto": request.ds_tipo_foto,
            "id_agendamento": request.id_agendamento,
            "id_procedimento": request.id_procedimento,
            "id_produto": request.id_produto,
            "dt_foto_tirada": request.dt_foto_tirada,
        })

        await db.commit()
        row = result.fetchone()

        return {
            "id_foto": str(row[0]),
            "id_user": request.id_user,
            "id_album": request.id_album,
            "ds_url": request.ds_url,
            "ds_thumbnail_url": request.ds_thumbnail_url,
            "nm_arquivo": request.nm_arquivo,
            "ds_tipo_mime": request.ds_tipo_mime,
            "nr_tamanho_bytes": request.nr_tamanho_bytes,
            "nr_largura": request.nr_largura,
            "nr_altura": request.nr_altura,
            "ds_titulo": request.ds_titulo,
            "ds_legenda": request.ds_legenda,
            "ds_tags": request.ds_tags,
            "ds_tipo_foto": request.ds_tipo_foto,
            "st_processada": row[1],
            "dt_criacao": row[2],
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao registrar foto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao registrar foto: {str(e)}")


@router.get("/", response_model=dict)
async def listar_fotos(
    id_user: Optional[str] = Query(None, description="Filtrar por usuário"),
    id_album: Optional[str] = Query(None, description="Filtrar por álbum"),
    id_agendamento: Optional[str] = Query(None, description="Filtrar por agendamento"),
    ds_tipo_foto: Optional[str] = Query(None, description="Filtrar por tipo"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar fotos com filtros"""
    try:
        conditions = []

        if id_user:
            conditions.append(f"f.id_user = '{id_user}'")

        if id_album:
            conditions.append(f"f.id_album = '{id_album}'")

        if id_agendamento:
            conditions.append(f"f.id_agendamento = '{id_agendamento}'")

        if ds_tipo_foto:
            conditions.append(f"f.ds_tipo_foto = '{ds_tipo_foto}'")

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # Count
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_fotos f
            WHERE {where_clause}
        """)

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        offset = (page - 1) * size

        # List
        query = text(f"""
            SELECT
                f.id_foto,
                f.ds_url,
                f.ds_thumbnail_url,
                f.ds_titulo,
                f.ds_legenda,
                f.ds_tipo_foto,
                f.nr_largura,
                f.nr_altura,
                f.dt_criacao,
                u.nm_completo as nm_user
            FROM tb_fotos f
            LEFT JOIN tb_users u ON f.id_user = u.id_user
            WHERE {where_clause}
            ORDER BY f.dt_criacao DESC
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        fotos = []
        for row in rows:
            fotos.append({
                "id_foto": str(row[0]),
                "ds_url": row[1],
                "ds_thumbnail_url": row[2],
                "ds_titulo": row[3],
                "ds_legenda": row[4],
                "ds_tipo_foto": row[5],
                "nr_largura": row[6],
                "nr_altura": row[7],
                "dt_criacao": row[8].isoformat() if row[8] else None,
                "nm_user": row[9],
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": fotos,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar fotos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar fotos: {str(e)}")


@router.get("/{foto_id}", response_model=FotoResponse)
async def obter_foto(
    foto_id: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Obter detalhes de uma foto"""
    try:
        query = text("""
            SELECT
                f.id_foto, f.id_user, f.id_album, f.ds_url, f.ds_thumbnail_url,
                f.nm_arquivo, f.ds_tipo_mime, f.nr_tamanho_bytes, f.nr_largura,
                f.nr_altura, f.ds_titulo, f.ds_legenda, f.ds_tags, f.ds_tipo_foto,
                f.st_processada, f.dt_criacao, u.nm_completo
            FROM tb_fotos f
            LEFT JOIN tb_users u ON f.id_user = u.id_user
            WHERE f.id_foto = :id_foto
        """)

        result = await db.execute(query, {"id_foto": foto_id})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Foto não encontrada")

        return {
            "id_foto": str(row[0]),
            "id_user": str(row[1]),
            "id_album": str(row[2]) if row[2] else None,
            "ds_url": row[3],
            "ds_thumbnail_url": row[4],
            "nm_arquivo": row[5],
            "ds_tipo_mime": row[6],
            "nr_tamanho_bytes": row[7],
            "nr_largura": row[8],
            "nr_altura": row[9],
            "ds_titulo": row[10],
            "ds_legenda": row[11],
            "ds_tags": row[12] if row[12] else [],
            "ds_tipo_foto": row[13],
            "st_processada": row[14],
            "dt_criacao": row[15],
            "nm_user": row[16],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter foto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter foto: {str(e)}")


@router.delete("/{foto_id}")
async def deletar_foto(
    foto_id: str,
    id_user: str = Query(..., description="ID do usuário (validação)"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Deletar uma foto"""
    try:
        query = text("""
            DELETE FROM tb_fotos
            WHERE id_foto = :id_foto
              AND id_user = :id_user
            RETURNING id_foto
        """)

        result = await db.execute(query, {
            "id_foto": foto_id,
            "id_user": id_user
        })

        await db.commit()

        row = result.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Foto não encontrada ou você não tem permissão"
            )

        return {"message": "Foto deletada com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao deletar foto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar foto: {str(e)}")
