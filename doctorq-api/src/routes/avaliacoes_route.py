"""
Rotas para Sistema de Avaliações Verificadas
"""

import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/avaliacoes", tags=["avaliacoes"])

# ============================================
# Models
# ============================================

class AvaliacaoCreateRequest(BaseModel):
    tk_verificacao: Optional[str] = None  # Token do QR Code
    id_agendamento: Optional[str] = None
    id_paciente: str
    id_profissional: Optional[str] = None
    id_clinica: Optional[str] = None
    id_procedimento: Optional[str] = None
    nr_nota: int = Field(ge=1, le=5, description="Nota geral de 1 a 5")
    nr_atendimento: Optional[int] = Field(default=None, ge=1, le=5)
    nr_instalacoes: Optional[int] = Field(default=None, ge=1, le=5)
    nr_pontualidade: Optional[int] = Field(default=None, ge=1, le=5)
    nr_resultado: Optional[int] = Field(default=None, ge=1, le=5)
    ds_comentario: Optional[str] = None
    st_recomenda: Optional[bool] = True
    ds_fotos: Optional[List[str]] = Field(default=[], description="URLs das fotos")

class AvaliacaoResponse(BaseModel):
    id_avaliacao: str
    id_paciente: str
    id_profissional: Optional[str]
    id_clinica: Optional[str]
    id_procedimento: Optional[str]
    nr_nota: int
    nr_atendimento: Optional[int]
    nr_instalacoes: Optional[int]
    nr_pontualidade: Optional[int]
    nr_resultado: Optional[int]
    ds_comentario: Optional[str]
    st_recomenda: Optional[bool]
    st_verificada: bool
    st_aprovada: bool
    st_visivel: bool
    nr_likes: int
    nr_nao_util: int
    ds_badge: Optional[str]
    ds_fotos: Optional[List[str]]
    ds_resposta: Optional[str]
    dt_resposta: Optional[datetime]
    dt_criacao: datetime

    # Dados do paciente (quando disponível)
    nm_paciente: Optional[str] = None

class AvaliacaoLikeRequest(BaseModel):
    st_tipo: str = Field(description="util ou nao_util")

# ============================================
# Avaliações - CRUD
# ============================================

@router.post("/", response_model=AvaliacaoResponse)
async def criar_avaliacao(
    request: AvaliacaoCreateRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Cria uma nova avaliação.
    Se tk_verificacao for fornecido, a avaliação será marcada como verificada.
    """
    try:
        st_verificada = False

        # Se tem token de verificação, validar e marcar como verificada
        if request.tk_verificacao:
            validate_query = text("""
                SELECT id_qrcode, id_agendamento, st_utilizado, dt_expiracao
                FROM tb_qrcodes_avaliacao
                WHERE tk_codigo = :tk_codigo
            """)

            result = await db.execute(validate_query, {"tk_codigo": request.tk_verificacao})
            qrcode = result.fetchone()

            if not qrcode:
                raise HTTPException(status_code=400, detail="Token de verificação inválido")

            if qrcode[2]:  # st_utilizado
                raise HTTPException(status_code=400, detail="Token de verificação já foi utilizado")

            if datetime.now() > qrcode[3]:  # dt_expiracao
                raise HTTPException(status_code=400, detail="Token de verificação expirado")

            st_verificada = True

            # Marcar QR Code como utilizado
            await db.execute(
                text("UPDATE tb_qrcodes_avaliacao SET st_utilizado = TRUE, dt_utilizacao = NOW() WHERE id_qrcode = :id_qrcode"),
                {"id_qrcode": qrcode[0]}
            )

            # Se não informou id_agendamento, pegar do QR Code
            if not request.id_agendamento:
                request.id_agendamento = str(qrcode[1])

        # Capturar IP e User Agent para anti-fraude
        client_ip = req.client.host if req.client else None
        user_agent = req.headers.get("user-agent")

        # Inserir avaliação
        insert_query = text("""
            INSERT INTO tb_avaliacoes (
                id_agendamento,
                id_paciente,
                id_profissional,
                id_clinica,
                id_procedimento,
                nr_nota,
                nr_atendimento,
                nr_instalacoes,
                nr_pontualidade,
                nr_resultado,
                ds_comentario,
                st_recomenda,
                st_verificada,
                tk_verificacao,
                dt_verificacao,
                ds_fotos,
                ds_ip_origem,
                ds_user_agent,
                st_aprovada,
                st_visivel
            ) VALUES (
                :id_agendamento,
                :id_paciente,
                :id_profissional,
                :id_clinica,
                :id_procedimento,
                :nr_nota,
                :nr_atendimento,
                :nr_instalacoes,
                :nr_pontualidade,
                :nr_resultado,
                :ds_comentario,
                :st_recomenda,
                :st_verificada,
                :tk_verificacao,
                :dt_verificacao,
                :ds_fotos,
                :ds_ip_origem,
                :ds_user_agent,
                TRUE,
                TRUE
            )
            RETURNING id_avaliacao, dt_criacao
        """)

        result = await db.execute(insert_query, {
            "id_agendamento": request.id_agendamento,
            "id_paciente": request.id_paciente,
            "id_profissional": request.id_profissional,
            "id_clinica": request.id_clinica,
            "id_procedimento": request.id_procedimento,
            "nr_nota": request.nr_nota,
            "nr_atendimento": request.nr_atendimento,
            "nr_instalacoes": request.nr_instalacoes,
            "nr_pontualidade": request.nr_pontualidade,
            "nr_resultado": request.nr_resultado,
            "ds_comentario": request.ds_comentario,
            "st_recomenda": request.st_recomenda,
            "st_verificada": st_verificada,
            "tk_verificacao": request.tk_verificacao,
            "dt_verificacao": datetime.now() if st_verificada else None,
            "ds_fotos": request.ds_fotos if request.ds_fotos else [],
            "ds_ip_origem": client_ip,
            "ds_user_agent": user_agent,
        })

        await db.commit()

        row = result.fetchone()
        id_avaliacao = str(row[0])

        logger.info(f"Avaliação criada: {id_avaliacao} (verificada: {st_verificada})")

        # Buscar avaliação completa
        return await obter_avaliacao(id_avaliacao, db, _)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar avaliação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar avaliação: {str(e)}")


@router.get("/{id_avaliacao}", response_model=AvaliacaoResponse)
async def obter_avaliacao(
    id_avaliacao: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obter detalhes completos de uma avaliação
    """
    try:
        query = text("""
            SELECT
                a.id_avaliacao,
                a.id_paciente,
                a.id_profissional,
                a.id_clinica,
                a.id_procedimento,
                a.nr_nota,
                a.nr_atendimento,
                a.nr_instalacoes,
                a.nr_pontualidade,
                a.nr_resultado,
                a.ds_comentario,
                a.st_recomenda,
                a.st_aprovada,
                a.st_visivel,
                a.ds_badge,
                a.ds_fotos,
                a.ds_resposta,
                a.dt_resposta,
                a.dt_criacao,
                p.nm_paciente
            FROM tb_avaliacoes a
            LEFT JOIN tb_pacientes p ON a.id_paciente = p.id_paciente
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE a.id_avaliacao = :id_avaliacao
                AND c.id_empresa = :id_empresa
        """)

        result = await db.execute(query, {
            "id_avaliacao": id_avaliacao,
            "id_empresa": str(current_user.id_empresa)
        })
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Avaliação não encontrada")

        # Converter array PostgreSQL para lista Python
        ds_fotos_list = list(row[18]) if row[18] else []

        return AvaliacaoResponse(
            id_avaliacao=str(row[0]),
            id_paciente=str(row[1]),
            id_profissional=str(row[2]) if row[2] else None,
            id_clinica=str(row[3]) if row[3] else None,
            id_procedimento=str(row[4]) if row[4] else None,
            nr_nota=row[5],
            nr_atendimento=row[6],
            nr_instalacoes=row[7],
            nr_pontualidade=row[8],
            nr_resultado=row[9],
            ds_comentario=row[10],
            st_recomenda=row[11],
            st_verificada=row[12],
            st_aprovada=row[13],
            st_visivel=row[14],
            nr_likes=row[15] or 0,
            nr_nao_util=row[16] or 0,
            ds_badge=row[17],
            ds_fotos=ds_fotos_list,
            ds_resposta=row[19],
            dt_resposta=row[20],
            dt_criacao=row[21],
            nm_paciente=row[22],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar avaliação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar avaliação: {str(e)}")


@router.get("/", response_model=dict)
async def listar_avaliacoes(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    id_clinica: Optional[str] = None,
    id_profissional: Optional[str] = None,
    id_procedimento: Optional[str] = None,
    apenas_verificadas: bool = False,
    ordenar_por: str = Query("recentes", description="recentes, mais_uteis, melhor_avaliadas"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Listar avaliações com filtros
    """
    try:
        # Filtros
        conditions = ["a.st_aprovada = TRUE", "a.st_visivel = TRUE"]

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas avaliações de clínicas da empresa do usuário
        conditions.append("c.id_empresa = :id_empresa")

        if id_clinica:
            conditions.append(f"a.id_clinica = '{id_clinica}'")

        if id_profissional:
            conditions.append(f"a.id_profissional = '{id_profissional}'")

        if id_procedimento:
            conditions.append(f"a.id_procedimento = '{id_procedimento}'")

        if apenas_verificadas:
            conditions.append("a.st_verificada = TRUE")

        where_clause = " AND ".join(conditions)

        # Ordenação
        order_clause = "a.dt_criacao DESC"
        if ordenar_por == "mais_uteis":
            order_clause = "a.nr_likes DESC"
        elif ordenar_por == "melhor_avaliadas":
            order_clause = "a.nr_nota DESC, a.dt_criacao DESC"

        # Count total
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_avaliacoes a
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE {where_clause}
        """)
        count_result = await db.execute(count_query, {"id_empresa": str(current_user.id_empresa)})
        total = count_result.scalar() or 0

        # Paginação
        offset = (page - 1) * size

        # Buscar avaliações
        query = text(f"""
            SELECT
                a.id_avaliacao,
                a.nr_nota,
                a.ds_comentario,
                a.dt_criacao,
                p.nm_paciente
            FROM tb_avaliacoes a
            LEFT JOIN tb_pacientes p ON a.id_paciente = p.id_paciente
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE {where_clause}
            ORDER BY {order_clause}
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(query, {"id_empresa": str(current_user.id_empresa)})
        rows = result.fetchall()

        avaliacoes = []
        for row in rows:
            avaliacoes.append({
                "id_avaliacao": str(row[0]),
                "nr_nota": row[1],
                "ds_comentario": row[2],
                "st_verificada": row[3],
                "nr_likes": row[4] or 0,
                "dt_criacao": row[5],
                "nm_paciente": row[6],
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": avaliacoes,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar avaliações: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar avaliações: {str(e)}")


@router.post("/{id_avaliacao}/like")
async def dar_like_avaliacao(
    id_avaliacao: str,
    request: AvaliacaoLikeRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Marcar avaliação como útil ou não útil.
    Requer id_user do usuário logado (TODO: implementar autenticação de usuário).
    """
    try:
        # TODO: Pegar id_user do token de autenticação
        # Por enquanto, vamos usar um UUID fixo para demonstração
        id_user = "00000000-0000-0000-0000-000000000001"

        if request.st_tipo not in ["util", "nao_util"]:
            raise HTTPException(status_code=400, detail="st_tipo deve ser 'util' ou 'nao_util'")

        # Verificar se já deu like
        check_query = text("""
            SELECT id_like, st_tipo
            FROM tb_avaliacoes_likes
            WHERE id_avaliacao = :id_avaliacao AND id_user = :id_user
        """)

        result = await db.execute(check_query, {
            "id_avaliacao": id_avaliacao,
            "id_user": id_user
        })
        existing = result.fetchone()

        if existing:
            # Se já deu o mesmo tipo de like, remover
            if existing[1] == request.st_tipo:
                await db.execute(
                    text("DELETE FROM tb_avaliacoes_likes WHERE id_like = :id_like"),
                    {"id_like": existing[0]}
                )
                await db.commit()
                return {"message": "Like removido"}
            else:
                # Se deu outro tipo, atualizar
                await db.execute(
                    text("UPDATE tb_avaliacoes_likes SET st_tipo = :st_tipo WHERE id_like = :id_like"),
                    {"st_tipo": request.st_tipo, "id_like": existing[0]}
                )
                await db.commit()
                return {"message": "Like atualizado"}

        # Inserir novo like
        insert_query = text("""
            INSERT INTO tb_avaliacoes_likes (id_avaliacao, id_user, st_tipo)
            VALUES (:id_avaliacao, :id_user, :st_tipo)
        """)

        await db.execute(insert_query, {
            "id_avaliacao": id_avaliacao,
            "id_user": id_user,
            "st_tipo": request.st_tipo
        })

        await db.commit()

        return {"message": "Like registrado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao dar like em avaliação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao dar like: {str(e)}")
