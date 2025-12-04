"""
Rotas para Sistema de Mensagens entre Usuários
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

router = APIRouter(prefix="/mensagens", tags=["mensagens"])

# ============================================
# Models
# ============================================

class MensagemCreateRequest(BaseModel):
    id_conversa: str
    id_remetente: str
    ds_conteudo: str
    ds_tipo_mensagem: str = Field(default="texto", description="Tipo: texto, imagem, arquivo, audio, video")
    ds_arquivos_url: Optional[List[str]] = None
    ds_metadados: Optional[dict] = None
    id_mensagem_pai: Optional[str] = None
    id_agendamento: Optional[str] = None
    id_produto: Optional[str] = None
    id_procedimento: Optional[str] = None

class MensagemResponse(BaseModel):
    id_mensagem: str
    id_conversa: str
    id_remetente: str
    ds_tipo_mensagem: str
    ds_conteudo: str
    ds_arquivos_url: Optional[List[str]]
    ds_metadados: Optional[dict]
    st_editada: bool
    st_deletada: bool
    st_enviada: bool
    st_entregue: bool
    st_lida: bool
    dt_criacao: datetime
    nm_remetente: Optional[str] = None

# ============================================
# Mensagens - CRUD
# ============================================

@router.post("/", response_model=MensagemResponse)
async def enviar_mensagem(
    request: MensagemCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Enviar nova mensagem"""
    try:
        query = text("""
            INSERT INTO tb_mensagens_usuarios (
                id_conversa, id_remetente, ds_conteudo, ds_tipo_mensagem,
                ds_arquivos_url, ds_metadados, id_mensagem_pai, id_agendamento,
                id_produto, id_procedimento
            )
            VALUES (
                :id_conversa, :id_remetente, :ds_conteudo, :ds_tipo_mensagem,
                :ds_arquivos_url, :ds_metadados, :id_mensagem_pai, :id_agendamento,
                :id_produto, :id_procedimento
            )
            RETURNING id_mensagem, st_editada, st_deletada, st_enviada, st_entregue, st_lida, dt_criacao
        """)

        result = await db.execute(query, {
            "id_conversa": request.id_conversa,
            "id_remetente": request.id_remetente,
            "ds_conteudo": request.ds_conteudo,
            "ds_tipo_mensagem": request.ds_tipo_mensagem,
            "ds_arquivos_url": request.ds_arquivos_url,
            "ds_metadados": request.ds_metadados,
            "id_mensagem_pai": request.id_mensagem_pai,
            "id_agendamento": request.id_agendamento,
            "id_produto": request.id_produto,
            "id_procedimento": request.id_procedimento,
        })

        await db.commit()
        row = result.fetchone()

        return {
            "id_mensagem": str(row[0]),
            "id_conversa": request.id_conversa,
            "id_remetente": request.id_remetente,
            "ds_tipo_mensagem": request.ds_tipo_mensagem,
            "ds_conteudo": request.ds_conteudo,
            "ds_arquivos_url": request.ds_arquivos_url,
            "ds_metadados": request.ds_metadados,
            "st_editada": row[1],
            "st_deletada": row[2],
            "st_enviada": row[3],
            "st_entregue": row[4],
            "st_lida": row[5],
            "dt_criacao": row[6],
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao enviar mensagem: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao enviar mensagem: {str(e)}")


@router.get("/conversa/{conversa_id}", response_model=dict)
async def listar_mensagens_conversa(
    conversa_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Listar mensagens de uma conversa"""
    try:
        # Count
        count_query = text("""
            SELECT COUNT(*)
            FROM tb_mensagens_usuarios
            WHERE id_conversa = :id_conversa
              AND st_deletada = FALSE
        """)

        count_result = await db.execute(count_query, {"id_conversa": conversa_id})
        total = count_result.scalar() or 0

        offset = (page - 1) * size

        # List
        query = text("""
            SELECT
                m.id_mensagem,
                m.id_remetente,
                m.ds_tipo_mensagem,
                m.ds_conteudo,
                m.ds_arquivos_url,
                m.st_editada,
                m.st_lida,
                m.dt_criacao,
                u.nm_completo as nm_remetente
            FROM tb_mensagens_usuarios m
            LEFT JOIN tb_users u ON m.id_remetente = u.id_user
            WHERE m.id_conversa = :id_conversa
              AND m.st_deletada = FALSE
            ORDER BY m.dt_criacao ASC
            LIMIT :size OFFSET :offset
        """)

        result = await db.execute(query, {
            "id_conversa": conversa_id,
            "size": size,
            "offset": offset
        })

        rows = result.fetchall()

        mensagens = []
        for row in rows:
            mensagens.append({
                "id_mensagem": str(row[0]),
                "id_remetente": str(row[1]),
                "ds_tipo_mensagem": row[2],
                "ds_conteudo": row[3],
                "ds_arquivos_url": row[4] if row[4] else [],
                "st_editada": row[5],
                "st_lida": row[6],
                "dt_criacao": row[7].isoformat() if row[7] else None,
                "nm_remetente": row[8],
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": mensagens,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar mensagens: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar mensagens: {str(e)}")


@router.post("/{mensagem_id}/marcar-lida")
async def marcar_mensagem_lida(
    mensagem_id: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Marcar mensagem como lida"""
    try:
        query = text("""
            UPDATE tb_mensagens_usuarios
            SET st_lida = TRUE,
                dt_lida = NOW()
            WHERE id_mensagem = :id_mensagem
              AND st_lida = FALSE
            RETURNING id_mensagem
        """)

        result = await db.execute(query, {"id_mensagem": mensagem_id})
        await db.commit()

        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Mensagem não encontrada ou já foi lida")

        return {"message": "Mensagem marcada como lida"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao marcar como lida: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao marcar como lida: {str(e)}")


@router.delete("/{mensagem_id}")
async def deletar_mensagem(
    mensagem_id: str,
    id_user: str = Query(..., description="ID do usuário (validação)"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Deletar mensagem (soft delete)"""
    try:
        query = text("""
            UPDATE tb_mensagens_usuarios
            SET st_deletada = TRUE,
                dt_deletada = NOW()
            WHERE id_mensagem = :id_mensagem
              AND id_remetente = :id_user
              AND st_deletada = FALSE
            RETURNING id_mensagem
        """)

        result = await db.execute(query, {
            "id_mensagem": mensagem_id,
            "id_user": id_user
        })

        await db.commit()

        row = result.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Mensagem não encontrada ou você não tem permissão"
            )

        return {"message": "Mensagem deletada com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao deletar mensagem: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar mensagem: {str(e)}")
