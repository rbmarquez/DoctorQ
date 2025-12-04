"""
Rotas para gerenciar Álbuns de Fotos
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from src.config.orm_config import get_db
from src.utils.auth import get_current_apikey

router = APIRouter(prefix="/albums", tags=["Álbuns"])

# ============================================================================
# MODELS
# ============================================================================

class AlbumResponse(BaseModel):
    id_album: str
    id_user: str
    nm_album: str
    ds_descricao: Optional[str] = None
    ds_capa_url: Optional[str] = None
    ds_tipo: Optional[str] = None
    id_agendamento: Optional[str] = None
    id_procedimento: Optional[str] = None
    st_privado: bool
    st_favorito: bool
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None
    # Contadores
    total_fotos: int
    # Dados relacionados
    nm_user: Optional[str] = None
    nm_procedimento: Optional[str] = None

    class Config:
        from_attributes = True


class AlbunsResponse(BaseModel):
    items: List[AlbumResponse]
    meta: dict


class AlbumCreateRequest(BaseModel):
    id_user: str
    nm_album: str = Field(..., max_length=255)
    ds_descricao: Optional[str] = None
    ds_capa_url: Optional[str] = None
    ds_tipo: Optional[str] = Field(None, description="Tipo: procedimento, antes_depois, evolucao, geral")
    id_agendamento: Optional[str] = None
    id_procedimento: Optional[str] = None
    st_privado: bool = False
    st_favorito: bool = False


class AlbumUpdateRequest(BaseModel):
    nm_album: Optional[str] = Field(None, max_length=255)
    ds_descricao: Optional[str] = None
    ds_capa_url: Optional[str] = None
    ds_tipo: Optional[str] = None
    st_privado: Optional[bool] = None
    st_favorito: Optional[bool] = None


class AlbumFotoCreateRequest(BaseModel):
    id_foto: str


class AlbumFotoResponse(BaseModel):
    id_album_foto: str
    id_album: str
    id_foto: str
    nr_ordem: int
    dt_adicionado: datetime
    # Dados da foto
    ds_url: str
    ds_thumbnail_url: Optional[str] = None
    ds_titulo: Optional[str] = None
    ds_tipo_foto: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# ENDPOINTS - ÁLBUNS
# ============================================================================

@router.get("/", response_model=AlbunsResponse)
async def listar_albums(
    id_user: Optional[str] = Query(None),
    ds_tipo: Optional[str] = Query(None),
    st_privado: Optional[bool] = Query(None),
    st_favorito: Optional[bool] = Query(None),
    busca: Optional[str] = Query(None, description="Buscar por nome ou descrição"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Lista álbuns com filtros e paginação.
    """
    try:
        # WHERE conditions
        where_clauses = ["a.st_deletado = FALSE"]

        if id_user:
            where_clauses.append("a.id_user = :id_user")

        if ds_tipo:
            where_clauses.append("a.ds_tipo = :ds_tipo")

        if st_privado is not None:
            where_clauses.append("a.st_privado = :st_privado")

        if st_favorito is not None:
            where_clauses.append("a.st_favorito = :st_favorito")

        if busca:
            where_clauses.append(
                "(a.nm_album ILIKE :busca OR a.ds_descricao ILIKE :busca)"
            )

        where_clause = " AND ".join(where_clauses)

        # Count total
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_albums a
            WHERE {where_clause}
        """)

        # Query principal com LATERAL para contar fotos
        query = text(f"""
            SELECT
                a.id_album,
                a.id_user,
                a.nm_album,
                a.ds_descricao,
                a.ds_capa_url,
                a.ds_tipo,
                a.id_agendamento,
                a.id_procedimento,
                a.st_privado,
                a.st_favorito,
                a.dt_criacao,
                a.dt_atualizacao,
                u.nm_completo as nm_user,
                proc.nm_procedimento,
                COALESCE(fotos.total, 0) as total_fotos
            FROM tb_albums a
            LEFT JOIN tb_users u ON a.id_user = u.id_user
            LEFT JOIN tb_procedimentos proc ON a.id_procedimento = proc.id_procedimento
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as total
                FROM tb_albums_fotos af
                WHERE af.id_album = a.id_album
            ) fotos ON TRUE
            WHERE {where_clause}
            ORDER BY a.dt_criacao DESC
            LIMIT :limit OFFSET :offset
        """)

        # Parâmetros
        params = {
            "limit": size,
            "offset": (page - 1) * size
        }

        if id_user:
            params["id_user"] = id_user

        if ds_tipo:
            params["ds_tipo"] = ds_tipo

        if st_privado is not None:
            params["st_privado"] = st_privado

        if st_favorito is not None:
            params["st_favorito"] = st_favorito

        if busca:
            params["busca"] = f"%{busca}%"

        # Executar queries
        count_result = await db.execute(count_query, params)
        total = count_result.scalar()

        result = await db.execute(query, params)
        rows = result.fetchall()

        # Montar resposta
        albums = []
        for row in rows:
            albums.append(AlbumResponse(
                id_album=row.id_album,
                id_user=row.id_user,
                nm_album=row.nm_album,
                ds_descricao=row.ds_descricao,
                ds_capa_url=row.ds_capa_url,
                ds_tipo=row.ds_tipo,
                id_agendamento=row.id_agendamento,
                id_procedimento=row.id_procedimento,
                st_privado=row.st_privado,
                st_favorito=row.st_favorito,
                dt_criacao=row.dt_criacao,
                dt_atualizacao=row.dt_atualizacao,
                total_fotos=row.total_fotos,
                nm_user=row.nm_user,
                nm_procedimento=row.nm_procedimento,
            ))

        return AlbunsResponse(
            items=albums,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar álbuns: {str(e)}")


@router.get("/{id_album}", response_model=AlbumResponse)
async def obter_album(
    id_album: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna um álbum específico.
    """
    try:
        query = text("""
            SELECT
                a.id_album,
                a.id_user,
                a.nm_album,
                a.ds_descricao,
                a.ds_capa_url,
                a.ds_tipo,
                a.id_agendamento,
                a.id_procedimento,
                a.st_privado,
                a.st_favorito,
                a.dt_criacao,
                a.dt_atualizacao,
                u.nm_completo as nm_user,
                proc.nm_procedimento,
                COALESCE(fotos.total, 0) as total_fotos
            FROM tb_albums a
            LEFT JOIN tb_users u ON a.id_user = u.id_user
            LEFT JOIN tb_procedimentos proc ON a.id_procedimento = proc.id_procedimento
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as total
                FROM tb_albums_fotos af
                WHERE af.id_album = a.id_album
            ) fotos ON TRUE
            WHERE a.id_album = :id_album AND a.st_deletado = FALSE
        """)

        result = await db.execute(query, {"id_album": id_album})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Álbum não encontrado")

        return AlbumResponse(
            id_album=row.id_album,
            id_user=row.id_user,
            nm_album=row.nm_album,
            ds_descricao=row.ds_descricao,
            ds_capa_url=row.ds_capa_url,
            ds_tipo=row.ds_tipo,
            id_agendamento=row.id_agendamento,
            id_procedimento=row.id_procedimento,
            st_privado=row.st_privado,
            st_favorito=row.st_favorito,
            dt_criacao=row.dt_criacao,
            dt_atualizacao=row.dt_atualizacao,
            total_fotos=row.total_fotos,
            nm_user=row.nm_user,
            nm_procedimento=row.nm_procedimento,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter álbum: {str(e)}")


@router.post("/", response_model=AlbumResponse)
async def criar_album(
    request: AlbumCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Cria um novo álbum.
    """
    try:
        query = text("""
            INSERT INTO tb_albums (
                id_user, nm_album, ds_descricao, ds_capa_url, ds_tipo,
                id_agendamento, id_procedimento, st_privado, st_favorito
            )
            VALUES (
                :id_user, :nm_album, :ds_descricao, :ds_capa_url, :ds_tipo,
                :id_agendamento, :id_procedimento, :st_privado, :st_favorito
            )
            RETURNING id_album
        """)

        result = await db.execute(query, {
            "id_user": request.id_user,
            "nm_album": request.nm_album,
            "ds_descricao": request.ds_descricao,
            "ds_capa_url": request.ds_capa_url,
            "ds_tipo": request.ds_tipo,
            "id_agendamento": request.id_agendamento,
            "id_procedimento": request.id_procedimento,
            "st_privado": request.st_privado,
            "st_favorito": request.st_favorito,
        })

        await db.commit()

        id_album = result.fetchone()[0]

        # Retornar álbum criado
        return await obter_album(id_album, db)

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar álbum: {str(e)}")


@router.put("/{id_album}", response_model=AlbumResponse)
async def atualizar_album(
    id_album: str,
    request: AlbumUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Atualiza um álbum existente.
    """
    try:
        # Verificar se álbum existe
        check_query = text("""
            SELECT id_album FROM tb_albums
            WHERE id_album = :id_album AND st_deletado = FALSE
        """)
        check_result = await db.execute(check_query, {"id_album": id_album})
        if not check_result.fetchone():
            raise HTTPException(status_code=404, detail="Álbum não encontrado")

        # Construir SET clauses dinamicamente
        set_clauses = []
        params = {"id_album": id_album, "dt_atualizacao": datetime.now()}

        for field, value in request.model_dump(exclude_unset=True).items():
            set_clauses.append(f"{field} = :{field}")
            params[field] = value

        if not set_clauses:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

        set_clauses.append("dt_atualizacao = :dt_atualizacao")

        update_query = text(f"""
            UPDATE tb_albums
            SET {", ".join(set_clauses)}
            WHERE id_album = :id_album
        """)

        await db.execute(update_query, params)
        await db.commit()

        return await obter_album(id_album, db)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar álbum: {str(e)}")


@router.delete("/{id_album}")
async def deletar_album(
    id_album: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Deleta (soft delete) um álbum.
    """
    try:
        query = text("""
            UPDATE tb_albums
            SET st_deletado = TRUE, dt_atualizacao = :dt_atualizacao
            WHERE id_album = :id_album AND st_deletado = FALSE
            RETURNING id_album
        """)

        result = await db.execute(query, {
            "id_album": id_album,
            "dt_atualizacao": datetime.now()
        })

        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Álbum não encontrado")

        await db.commit()

        return {"message": "Álbum deletado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao deletar álbum: {str(e)}")


# ============================================================================
# ENDPOINTS - FOTOS DO ÁLBUM
# ============================================================================

@router.get("/{id_album}/fotos", response_model=dict)
async def listar_fotos_album(
    id_album: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Lista fotos de um álbum.
    """
    try:
        # Verificar se álbum existe
        check_query = text("""
            SELECT id_album FROM tb_albums
            WHERE id_album = :id_album AND st_deletado = FALSE
        """)
        check_result = await db.execute(check_query, {"id_album": id_album})
        if not check_result.fetchone():
            raise HTTPException(status_code=404, detail="Álbum não encontrado")

        # Count total
        count_query = text("""
            SELECT COUNT(*)
            FROM tb_albums_fotos
            WHERE id_album = :id_album
        """)
        count_result = await db.execute(count_query, {"id_album": id_album})
        total = count_result.scalar()

        # Query principal
        query = text("""
            SELECT
                af.id_album_foto,
                af.id_album,
                af.id_foto,
                af.nr_ordem,
                af.dt_adicionado,
                f.ds_url,
                f.ds_thumbnail_url,
                f.ds_titulo,
                f.ds_tipo_foto
            FROM tb_albums_fotos af
            LEFT JOIN tb_fotos_usuarios f ON af.id_foto = f.id_foto
            WHERE af.id_album = :id_album
            ORDER BY af.nr_ordem ASC, af.dt_adicionado DESC
            LIMIT :limit OFFSET :offset
        """)

        result = await db.execute(query, {
            "id_album": id_album,
            "limit": size,
            "offset": (page - 1) * size
        })
        rows = result.fetchall()

        fotos = []
        for row in rows:
            fotos.append(AlbumFotoResponse(
                id_album_foto=row.id_album_foto,
                id_album=row.id_album,
                id_foto=row.id_foto,
                nr_ordem=row.nr_ordem,
                dt_adicionado=row.dt_adicionado,
                ds_url=row.ds_url,
                ds_thumbnail_url=row.ds_thumbnail_url,
                ds_titulo=row.ds_titulo,
                ds_tipo_foto=row.ds_tipo_foto,
            ))

        return {
            "items": fotos,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar fotos: {str(e)}")


@router.post("/{id_album}/fotos")
async def adicionar_foto_album(
    id_album: str,
    request: AlbumFotoCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Adiciona uma foto ao álbum.
    """
    try:
        # Verificar se álbum existe
        check_album = text("""
            SELECT id_album FROM tb_albums
            WHERE id_album = :id_album AND st_deletado = FALSE
        """)
        album_result = await db.execute(check_album, {"id_album": id_album})
        if not album_result.fetchone():
            raise HTTPException(status_code=404, detail="Álbum não encontrado")

        # Verificar se foto existe
        check_foto = text("""
            SELECT id_foto FROM tb_fotos_usuarios
            WHERE id_foto = :id_foto AND st_deletada = FALSE
        """)
        foto_result = await db.execute(check_foto, {"id_foto": request.id_foto})
        if not foto_result.fetchone():
            raise HTTPException(status_code=404, detail="Foto não encontrada")

        # Verificar se foto já está no álbum
        check_existing = text("""
            SELECT id_album_foto FROM tb_albums_fotos
            WHERE id_album = :id_album AND id_foto = :id_foto
        """)
        existing_result = await db.execute(check_existing, {
            "id_album": id_album,
            "id_foto": request.id_foto
        })
        if existing_result.fetchone():
            raise HTTPException(status_code=400, detail="Foto já está no álbum")

        # Obter próxima ordem
        ordem_query = text("""
            SELECT COALESCE(MAX(nr_ordem), 0) + 1 as next_ordem
            FROM tb_albums_fotos
            WHERE id_album = :id_album
        """)
        ordem_result = await db.execute(ordem_query, {"id_album": id_album})
        next_ordem = ordem_result.scalar()

        # Adicionar foto
        insert_query = text("""
            INSERT INTO tb_albums_fotos (id_album, id_foto, nr_ordem)
            VALUES (:id_album, :id_foto, :nr_ordem)
            RETURNING id_album_foto
        """)

        result = await db.execute(insert_query, {
            "id_album": id_album,
            "id_foto": request.id_foto,
            "nr_ordem": next_ordem
        })

        await db.commit()

        id_album_foto = result.fetchone()[0]

        return {"id_album_foto": id_album_foto, "message": "Foto adicionada ao álbum"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar foto: {str(e)}")


@router.delete("/{id_album}/fotos/{id_foto}")
async def remover_foto_album(
    id_album: str,
    id_foto: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Remove uma foto do álbum.
    """
    try:
        query = text("""
            DELETE FROM tb_albums_fotos
            WHERE id_album = :id_album AND id_foto = :id_foto
            RETURNING id_album_foto
        """)

        result = await db.execute(query, {
            "id_album": id_album,
            "id_foto": id_foto
        })

        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Foto não encontrada no álbum")

        await db.commit()

        return {"message": "Foto removida do álbum"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao remover foto: {str(e)}")
