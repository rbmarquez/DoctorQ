"""
Rotas para Sistema de Notificações
Gerencia notificações push, email, SMS e WhatsApp para usuários
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

router = APIRouter(prefix="/notificacoes", tags=["notificacoes"])

# ============================================
# Models
# ============================================

class NotificacaoCreateRequest(BaseModel):
    id_user: str
    id_empresa: Optional[str] = None
    ds_tipo: str = Field(..., description="Tipo: agendamento, pedido, promocao, mensagem, sistema, alerta")
    ds_categoria: Optional[str] = None
    nm_titulo: str = Field(..., max_length=255)
    ds_conteudo: str
    ds_dados_adicionais: Optional[dict] = None
    ds_prioridade: str = Field(default="normal", description="Prioridade: baixa, normal, alta, urgente")
    st_push: bool = True
    st_email: bool = False
    st_sms: bool = False
    st_whatsapp: bool = False
    ds_acao: Optional[str] = None
    ds_url: Optional[str] = None
    ds_url_deep_link: Optional[str] = None
    id_agendamento: Optional[str] = None
    id_pedido: Optional[str] = None
    id_mensagem: Optional[str] = None
    id_conversa: Optional[str] = None
    dt_envio_programado: Optional[datetime] = None
    dt_expiracao: Optional[datetime] = None

class NotificacaoResponse(BaseModel):
    id_notificacao: str
    id_user: str
    id_empresa: Optional[str]
    ds_tipo: str
    ds_categoria: Optional[str]
    nm_titulo: str
    ds_conteudo: str
    ds_dados_adicionais: Optional[dict]
    ds_prioridade: str
    st_push: bool
    st_email: bool
    st_sms: bool
    st_whatsapp: bool
    st_lida: bool
    dt_lida: Optional[datetime]
    ds_acao: Optional[str]
    ds_url: Optional[str]
    ds_url_deep_link: Optional[str]
    id_agendamento: Optional[str]
    id_pedido: Optional[str]
    id_mensagem: Optional[str]
    id_conversa: Optional[str]
    dt_envio_programado: Optional[datetime]
    st_enviada: bool
    dt_expiracao: Optional[datetime]
    dt_criacao: datetime
    dt_atualizacao: datetime

class NotificacaoListItem(BaseModel):
    id_notificacao: str
    ds_tipo: str
    nm_titulo: str
    ds_conteudo: str
    ds_prioridade: str
    st_lida: bool
    dt_criacao: datetime

# ============================================
# Notificações - CRUD
# ============================================

@router.post("/", response_model=NotificacaoResponse)
async def criar_notificacao(
    request: NotificacaoCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Criar nova notificação.
    Suporta múltiplos canais: push, email, SMS, WhatsApp
    """
    try:
        query = text("""
            INSERT INTO tb_notificacoes (
                id_user, id_empresa, ds_tipo, ds_categoria, nm_titulo, ds_conteudo,
                ds_dados_adicionais, ds_prioridade, st_push, st_email, st_sms, st_whatsapp,
                ds_acao, ds_url, ds_url_deep_link, id_agendamento, id_pedido, id_mensagem,
                id_conversa, dt_envio_programado, dt_expiracao
            )
            VALUES (
                :id_user, :id_empresa, :ds_tipo, :ds_categoria, :nm_titulo, :ds_conteudo,
                :ds_dados_adicionais, :ds_prioridade, :st_push, :st_email, :st_sms, :st_whatsapp,
                :ds_acao, :ds_url, :ds_url_deep_link, :id_agendamento, :id_pedido, :id_mensagem,
                :id_conversa, :dt_envio_programado, :dt_expiracao
            )
            RETURNING
                id_notificacao, st_push_enviado, st_email_enviado, st_sms_enviado,
                st_whatsapp_enviado, st_lida, dt_lida, st_enviada, dt_criacao, dt_atualizacao
        """)

        result = await db.execute(query, {
            "id_user": request.id_user,
            "id_empresa": request.id_empresa,
            "ds_tipo": request.ds_tipo,
            "ds_categoria": request.ds_categoria,
            "nm_titulo": request.nm_titulo,
            "ds_conteudo": request.ds_conteudo,
            "ds_dados_adicionais": request.ds_dados_adicionais,
            "ds_prioridade": request.ds_prioridade,
            "st_push": request.st_push,
            "st_email": request.st_email,
            "st_sms": request.st_sms,
            "st_whatsapp": request.st_whatsapp,
            "ds_acao": request.ds_acao,
            "ds_url": request.ds_url,
            "ds_url_deep_link": request.ds_url_deep_link,
            "id_agendamento": request.id_agendamento,
            "id_pedido": request.id_pedido,
            "id_mensagem": request.id_mensagem,
            "id_conversa": request.id_conversa,
            "dt_envio_programado": request.dt_envio_programado,
            "dt_expiracao": request.dt_expiracao,
        })

        await db.commit()

        row = result.fetchone()

        logger.info(f"Notificação {row[0]} criada para usuário {request.id_user}")

        return {
            "id_notificacao": str(row[0]),
            "id_user": request.id_user,
            "id_empresa": request.id_empresa,
            "ds_tipo": request.ds_tipo,
            "ds_categoria": request.ds_categoria,
            "nm_titulo": request.nm_titulo,
            "ds_conteudo": request.ds_conteudo,
            "ds_dados_adicionais": request.ds_dados_adicionais,
            "ds_prioridade": request.ds_prioridade,
            "st_push": request.st_push,
            "st_email": request.st_email,
            "st_sms": request.st_sms,
            "st_whatsapp": request.st_whatsapp,
            "st_lida": row[5],
            "dt_lida": row[6],
            "ds_acao": request.ds_acao,
            "ds_url": request.ds_url,
            "ds_url_deep_link": request.ds_url_deep_link,
            "id_agendamento": request.id_agendamento,
            "id_pedido": request.id_pedido,
            "id_mensagem": request.id_mensagem,
            "id_conversa": request.id_conversa,
            "dt_envio_programado": request.dt_envio_programado,
            "st_enviada": row[7],
            "dt_expiracao": request.dt_expiracao,
            "dt_criacao": row[8],
            "dt_atualizacao": row[9],
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar notificação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar notificação: {str(e)}")


@router.get("/", response_model=dict)
async def listar_notificacoes(
    id_user: str = Query(..., description="ID do usuário"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    apenas_nao_lidas: bool = Query(False, description="Apenas não lidas"),
    prioridade: Optional[str] = Query(None, description="Filtrar por prioridade"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar notificações do usuário"""
    try:
        conditions = [f"id_user = '{id_user}'"]

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas notificações da empresa do usuário logado
        if not current_user.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada. Entre em contato com o suporte."
            )
        conditions.append(f"id_empresa = '{current_user.id_empresa}'")

        if tipo:
            conditions.append(f"ds_tipo = '{tipo}'")

        if apenas_nao_lidas:
            conditions.append("st_lida = FALSE")

        if prioridade:
            conditions.append(f"ds_prioridade = '{prioridade}'")

        # Filtrar notificações expiradas
        conditions.append("(dt_expiracao IS NULL OR dt_expiracao > NOW())")

        where_clause = " AND ".join(conditions)

        # Count
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_notificacoes
            WHERE {where_clause}
        """)

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        offset = (page - 1) * size

        # List
        query = text(f"""
            SELECT
                id_notificacao,
                ds_tipo,
                ds_categoria,
                nm_titulo,
                ds_conteudo,
                ds_prioridade,
                st_lida,
                dt_lida,
                ds_acao,
                ds_url,
                id_agendamento,
                id_pedido,
                dt_criacao
            FROM tb_notificacoes
            WHERE {where_clause}
            ORDER BY
                CASE ds_prioridade
                    WHEN 'urgente' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'normal' THEN 3
                    WHEN 'baixa' THEN 4
                    ELSE 5
                END,
                st_lida ASC,
                dt_criacao DESC
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        notificacoes = []
        for row in rows:
            notificacoes.append({
                "id_notificacao": str(row[0]),
                "ds_tipo": row[1],
                "ds_categoria": row[2],
                "nm_titulo": row[3],
                "ds_conteudo": row[4],
                "ds_prioridade": row[5],
                "st_lida": row[6],
                "dt_lida": row[7].isoformat() if row[7] else None,
                "ds_acao": row[8],
                "ds_url": row[9],
                "id_agendamento": str(row[10]) if row[10] else None,
                "id_pedido": str(row[11]) if row[11] else None,
                "dt_criacao": row[12].isoformat() if row[12] else None,
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": notificacoes,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar notificações: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar notificações: {str(e)}")


@router.get("/{notificacao_id}", response_model=NotificacaoResponse)
async def obter_notificacao(
    notificacao_id: str,
    id_user: str = Query(..., description="ID do usuário (validação)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obter detalhes de uma notificação"""
    try:
        query = text("""
            SELECT
                id_notificacao, id_user, id_empresa, ds_tipo, ds_categoria, nm_titulo,
                ds_conteudo, ds_dados_adicionais, ds_prioridade, st_push, st_email, st_sms,
                st_whatsapp, st_lida, dt_lida, ds_acao, ds_url, ds_url_deep_link,
                id_agendamento, id_pedido, id_mensagem, id_conversa, dt_envio_programado,
                st_enviada, dt_expiracao, dt_criacao, dt_atualizacao
            FROM tb_notificacoes
            WHERE id_notificacao = :id_notificacao
              AND id_user = :id_user
              AND id_empresa = :id_empresa
        """)

        result = await db.execute(query, {
            "id_notificacao": notificacao_id,
            "id_user": id_user,
            "id_empresa": str(current_user.id_empresa)
        })

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Notificação não encontrada ou você não tem permissão"
            )

        return {
            "id_notificacao": str(row[0]),
            "id_user": str(row[1]),
            "id_empresa": str(row[2]) if row[2] else None,
            "ds_tipo": row[3],
            "ds_categoria": row[4],
            "nm_titulo": row[5],
            "ds_conteudo": row[6],
            "ds_dados_adicionais": row[7],
            "ds_prioridade": row[8],
            "st_push": row[9],
            "st_email": row[10],
            "st_sms": row[11],
            "st_whatsapp": row[12],
            "st_lida": row[13],
            "dt_lida": row[14],
            "ds_acao": row[15],
            "ds_url": row[16],
            "ds_url_deep_link": row[17],
            "id_agendamento": str(row[18]) if row[18] else None,
            "id_pedido": str(row[19]) if row[19] else None,
            "id_mensagem": str(row[20]) if row[20] else None,
            "id_conversa": str(row[21]) if row[21] else None,
            "dt_envio_programado": row[22],
            "st_enviada": row[23],
            "dt_expiracao": row[24],
            "dt_criacao": row[25],
            "dt_atualizacao": row[26],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter notificação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter notificação: {str(e)}")


@router.post("/{notificacao_id}/marcar-lida")
async def marcar_como_lida(
    notificacao_id: str,
    id_user: str = Query(..., description="ID do usuário (validação)"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Marcar notificação como lida"""
    try:
        query = text("""
            UPDATE tb_notificacoes
            SET st_lida = TRUE,
                dt_lida = NOW()
            WHERE id_notificacao = :id_notificacao
              AND id_user = :id_user
              AND st_lida = FALSE
            RETURNING id_notificacao
        """)

        result = await db.execute(query, {
            "id_notificacao": notificacao_id,
            "id_user": id_user
        })

        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Notificação não encontrada, já foi lida ou você não tem permissão"
            )

        return {"message": "Notificação marcada como lida"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao marcar como lida: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao marcar como lida: {str(e)}")


@router.post("/marcar-todas-lidas")
async def marcar_todas_lidas(
    id_user: str = Query(..., description="ID do usuário"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Marcar todas as notificações como lidas"""
    try:
        query = text("""
            UPDATE tb_notificacoes
            SET st_lida = TRUE,
                dt_lida = NOW()
            WHERE id_user = :id_user
              AND st_lida = FALSE
            RETURNING id_notificacao
        """)

        result = await db.execute(query, {"id_user": id_user})
        await db.commit()

        rows = result.fetchall()
        count = len(rows)

        logger.info(f"{count} notificações marcadas como lidas para usuário {id_user}")

        return {
            "message": f"{count} notificações marcadas como lidas",
            "count": count
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao marcar todas como lidas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao marcar todas como lidas: {str(e)}")


@router.delete("/{notificacao_id}")
async def deletar_notificacao(
    notificacao_id: str,
    id_user: str = Query(..., description="ID do usuário (validação)"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Deletar uma notificação"""
    try:
        query = text("""
            DELETE FROM tb_notificacoes
            WHERE id_notificacao = :id_notificacao
              AND id_user = :id_user
            RETURNING id_notificacao
        """)

        result = await db.execute(query, {
            "id_notificacao": notificacao_id,
            "id_user": id_user
        })

        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Notificação não encontrada ou você não tem permissão"
            )

        return {"message": "Notificação deletada com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao deletar notificação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar notificação: {str(e)}")


@router.get("/stats/{id_user}")
async def estatisticas_notificacoes(
    id_user: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Estatísticas das notificações do usuário"""
    try:
        query = text("""
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN st_lida = FALSE THEN 1 END) as nao_lidas,
                COUNT(CASE WHEN st_lida = TRUE THEN 1 END) as lidas,
                COUNT(CASE WHEN ds_prioridade = 'urgente' AND st_lida = FALSE THEN 1 END) as urgentes_nao_lidas,
                COUNT(CASE WHEN ds_tipo = 'agendamento' THEN 1 END) as agendamentos,
                COUNT(CASE WHEN ds_tipo = 'pedido' THEN 1 END) as pedidos,
                COUNT(CASE WHEN ds_tipo = 'mensagem' THEN 1 END) as mensagens,
                COUNT(CASE WHEN ds_tipo = 'promocao' THEN 1 END) as promocoes
            FROM tb_notificacoes
            WHERE id_user = :id_user
              AND id_empresa = :id_empresa
              AND (dt_expiracao IS NULL OR dt_expiracao > NOW())
        """)

        result = await db.execute(query, {
            "id_user": id_user,
            "id_empresa": str(current_user.id_empresa)
        })
        row = result.fetchone()

        return {
            "total": row[0],
            "nao_lidas": row[1],
            "lidas": row[2],
            "urgentes_nao_lidas": row[3],
            "por_tipo": {
                "agendamentos": row[4],
                "pedidos": row[5],
                "mensagens": row[6],
                "promocoes": row[7],
            }
        }

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")
