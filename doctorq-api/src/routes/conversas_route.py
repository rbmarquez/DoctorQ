"""
Rotas para Conversas (Chat)
Gerenciamento de conversas entre usuários
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from asyncpg import UndefinedColumnError
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging

from src.config.orm_config import get_db
from src.utils.auth import get_current_apikey

# Configurar logger
logger = logging.getLogger(__name__)

# Criar router
router = APIRouter(prefix="/conversas", tags=["Conversas"])

# ============================================================================
# MODELOS PYDANTIC
# ============================================================================

class ConversaCreateRequest(BaseModel):
    id_user_1: str
    id_user_2: str
    ds_tipo: Optional[str] = Field(None, description="Tipo: paciente_profissional, paciente_clinica, suporte")
    id_agendamento: Optional[str] = None
    id_procedimento: Optional[str] = None

class ConversaResponse(BaseModel):
    id_conversa: str
    id_user_1: str
    id_user_2: str
    ds_tipo: Optional[str]
    id_agendamento: Optional[str]
    id_procedimento: Optional[str]
    st_arquivada: bool
    st_ativa: bool
    dt_ultima_mensagem: Optional[datetime]
    dt_criacao: datetime
    # Dados dos participantes
    nm_user_1: Optional[str] = None
    ds_foto_user_1: Optional[str] = None
    nm_user_2: Optional[str] = None
    ds_foto_user_2: Optional[str] = None
    # Contadores
    total_mensagens: int = 0
    mensagens_nao_lidas: int = 0

class ConversasResponse(BaseModel):
    items: List[ConversaResponse]
    meta: dict

class ConversaStatsResponse(BaseModel):
    total: int
    ativas: int
    arquivadas: int
    com_mensagens_nao_lidas: int

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/", response_model=ConversaResponse)
async def criar_conversa(
    request: ConversaCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Criar nova conversa entre dois usuários.
    Se já existe conversa entre esses usuários, retorna a existente.
    """
    try:
        # Verificar se já existe conversa entre esses usuários
        check_query = text("""
            SELECT id_conversa
            FROM tb_conversas
            WHERE (
                (id_user_1 = :user1 AND id_user_2 = :user2) OR
                (id_user_1 = :user2 AND id_user_2 = :user1)
            )
            AND st_ativa = TRUE
            LIMIT 1
        """)

        result = await db.execute(check_query, {
            "user1": request.id_user_1,
            "user2": request.id_user_2
        })
        existing = result.fetchone()

        if existing:
            # Retornar conversa existente
            get_query = text("""
                SELECT
                    c.id_conversa, c.id_user_1, c.id_user_2, c.ds_tipo,
                    c.id_agendamento, c.id_procedimento, c.st_arquivada,
                    c.st_ativa, c.dt_ultima_mensagem, c.dt_criacao,
                    u1.nm_completo as nm_user_1, u1.ds_foto_url as ds_foto_user_1,
                    u2.nm_completo as nm_user_2, u2.ds_foto_url as ds_foto_user_2,
                    COALESCE(msg_count.total, 0) as total_mensagens,
                    COALESCE(msg_count.nao_lidas, 0) as mensagens_nao_lidas
                FROM tb_conversas c
                LEFT JOIN tb_users u1 ON c.id_user_1 = u1.id_user
                LEFT JOIN tb_users u2 ON c.id_user_2 = u2.id_user
                LEFT JOIN LATERAL (
                    SELECT
                        COUNT(*) as total,
                        COUNT(*) FILTER (WHERE st_lida = FALSE) as nao_lidas
                    FROM tb_mensagens_usuarios
                    WHERE id_conversa = c.id_conversa AND st_deletada = FALSE
                ) msg_count ON true
                WHERE c.id_conversa = :id_conversa
            """)
            result = await db.execute(get_query, {"id_conversa": existing[0]})
            row = result.fetchone()

            return ConversaResponse(
                id_conversa=str(row[0]),
                id_user_1=str(row[1]),
                id_user_2=str(row[2]),
                ds_tipo=row[3],
                id_agendamento=str(row[4]) if row[4] else None,
                id_procedimento=str(row[5]) if row[5] else None,
                st_arquivada=row[6],
                st_ativa=row[7],
                dt_ultima_mensagem=row[8],
                dt_criacao=row[9],
                nm_user_1=row[10],
                ds_foto_user_1=row[11],
                nm_user_2=row[12],
                ds_foto_user_2=row[13],
                total_mensagens=row[14],
                mensagens_nao_lidas=row[15]
            )

        # Criar nova conversa
        insert_query = text("""
            INSERT INTO tb_conversas (
                id_user_1, id_user_2, ds_tipo, id_agendamento, id_procedimento
            )
            VALUES (:user1, :user2, :tipo, :agendamento, :procedimento)
            RETURNING id_conversa, dt_criacao
        """)

        result = await db.execute(insert_query, {
            "user1": request.id_user_1,
            "user2": request.id_user_2,
            "tipo": request.ds_tipo,
            "agendamento": request.id_agendamento,
            "procedimento": request.id_procedimento
        })
        await db.commit()

        row = result.fetchone()
        id_conversa = str(row[0])
        dt_criacao = row[1]

        # Buscar dados dos usuários
        users_query = text("""
            SELECT
                u1.nm_completo, u1.ds_foto_url,
                u2.nm_completo, u2.ds_foto_url
            FROM tb_users u1, tb_users u2
            WHERE u1.id_user = :user1 AND u2.id_user = :user2
        """)
        result = await db.execute(users_query, {
            "user1": request.id_user_1,
            "user2": request.id_user_2
        })
        users_row = result.fetchone()

        return ConversaResponse(
            id_conversa=id_conversa,
            id_user_1=request.id_user_1,
            id_user_2=request.id_user_2,
            ds_tipo=request.ds_tipo,
            id_agendamento=request.id_agendamento,
            id_procedimento=request.id_procedimento,
            st_arquivada=False,
            st_ativa=True,
            dt_ultima_mensagem=None,
            dt_criacao=dt_criacao,
            nm_user_1=users_row[0] if users_row else None,
            ds_foto_user_1=users_row[1] if users_row else None,
            nm_user_2=users_row[2] if users_row else None,
            ds_foto_user_2=users_row[3] if users_row else None,
            total_mensagens=0,
            mensagens_nao_lidas=0
        )

    except Exception as e:
        logger.error(f"Erro ao criar conversa: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar conversa: {str(e)}")


@router.get("/", response_model=ConversasResponse)
async def listar_conversas(
    id_user: Optional[str] = Query(None, description="ID do usuário"),
    id_agente: Optional[str] = Query(None, description="ID do agente (filtro alternativo)"),
    st_arquivada: Optional[bool] = Query(None, description="Filtrar por arquivadas"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Listar conversas do usuário com agentes AI.

    Requer pelo menos um dos filtros: id_user ou id_agente.
    Se nenhum for fornecido, retorna lista vazia.
    """
    try:
        # Se não houver id_user nem id_agente, retornar lista vazia
        if not id_user and not id_agente:
            return ConversasResponse(
                items=[],
                meta={
                    "totalItems": 0,
                    "itemsPerPage": size,
                    "totalPages": 0,
                    "currentPage": page
                }
            )

        # Construir WHERE clause
        where_conditions = ["c.st_ativa = TRUE"]

        # Adicionar filtro de usuário se fornecido
        if id_user:
            where_conditions.append("c.id_user = :id_user")

        # Adicionar filtro de agente se fornecido
        if id_agente:
            where_conditions.append("c.id_agente = :id_agente")

        where_clause = " AND ".join(where_conditions)

        # Query simplificada - retorna conversas entre usuário e agente AI
        query = text(f"""
            SELECT
                c.id_conversa,
                c.id_user,
                c.id_agente,
                c.id_paciente,
                c.nm_titulo,
                c.st_ativa,
                c.dt_ultima_mensagem,
                c.dt_criacao,
                u.nm_completo as nm_user,
                u.ds_foto_url as ds_foto_user,
                a.nm_agente,
                COALESCE(c.nr_total_mensagens, 0) as total_mensagens
            FROM tb_conversas c
            LEFT JOIN tb_users u ON c.id_user = u.id_user
            LEFT JOIN tb_agentes a ON c.id_agente = a.id_agente
            WHERE {where_clause}
            ORDER BY c.dt_ultima_mensagem DESC NULLS LAST, c.dt_criacao DESC
            LIMIT :limit OFFSET :offset
        """)

        # Count query
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_conversas c
            WHERE {where_clause}
        """)

        offset = (page - 1) * size

        # Construir parâmetros da query
        query_params = {
            "limit": size,
            "offset": offset
        }
        if id_user:
            query_params["id_user"] = id_user
        if id_agente:
            query_params["id_agente"] = id_agente

        result = await db.execute(query, query_params)
        rows = result.fetchall()

        # Parâmetros para count query
        count_params = {}
        if id_user:
            count_params["id_user"] = id_user
        if id_agente:
            count_params["id_agente"] = id_agente

        count_result = await db.execute(count_query, count_params)
        total = count_result.scalar()

        # Mapear resultados para ConversaResponse
        # IMPORTANTE: Adaptar ao schema atual (user + agente, não user_1 + user_2)
        conversas = [
            ConversaResponse(
                id_conversa=str(row[0]),
                id_user_1=str(row[1]) if row[1] else "",  # id_user
                id_user_2=str(row[2]) if row[2] else "",  # id_agente (representado como user_2)
                ds_tipo="agente",  # Sempre conversa com agente
                id_agendamento=None,
                id_procedimento=None,
                st_arquivada=False,  # TODO: adicionar coluna st_arquivada na tabela
                st_ativa=row[5],
                dt_ultima_mensagem=row[6],
                dt_criacao=row[7],
                nm_user_1=row[8],  # nm_user
                ds_foto_user_1=row[9],  # ds_foto_user
                nm_user_2=row[10] if row[10] else "Agente AI",  # nm_agente
                ds_foto_user_2=None,  # Agentes não têm foto no modelo atual
                total_mensagens=row[11],
                mensagens_nao_lidas=0  # TODO: implementar contagem de não lidas
            )
            for row in rows
        ]

        return ConversasResponse(
            items=conversas,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page
            }
        )

    except ProgrammingError as e:
        if isinstance(e.orig, UndefinedColumnError):
            logger.warning(
                "Erro de coluna não definida em tb_conversas. "
                "Retornando resposta vazia para compatibilidade."
            )
            return ConversasResponse(
                items=[],
                meta={
                    "totalItems": 0,
                    "itemsPerPage": size,
                    "totalPages": 0,
                    "currentPage": page,
                },
            )
        raise
    except Exception as e:
        logger.error(f"Erro ao listar conversas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar conversas: {str(e)}")


@router.get("/{conversa_id}", response_model=ConversaResponse)
async def obter_conversa(
    conversa_id: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Obter detalhes de uma conversa específica.
    """
    try:
        query = text("""
            SELECT
                c.id_conversa, c.id_user_1, c.id_user_2, c.ds_tipo,
                c.id_agendamento, c.id_procedimento, c.st_arquivada,
                c.st_ativa, c.dt_ultima_mensagem, c.dt_criacao,
                u1.nm_completo as nm_user_1, u1.ds_foto_url as ds_foto_user_1,
                u2.nm_completo as nm_user_2, u2.ds_foto_url as ds_foto_user_2,
                COALESCE(msg_count.total, 0) as total_mensagens,
                COALESCE(msg_count.nao_lidas, 0) as mensagens_nao_lidas
            FROM tb_conversas c
            LEFT JOIN tb_users u1 ON c.id_user_1 = u1.id_user
            LEFT JOIN tb_users u2 ON c.id_user_2 = u2.id_user
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE st_lida = FALSE) as nao_lidas
                FROM tb_mensagens_usuarios
                WHERE id_conversa = c.id_conversa AND st_deletada = FALSE
            ) msg_count ON true
            WHERE c.id_conversa = :id_conversa
        """)

        result = await db.execute(query, {"id_conversa": conversa_id})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Conversa não encontrada")

        return ConversaResponse(
            id_conversa=str(row[0]),
            id_user_1=str(row[1]),
            id_user_2=str(row[2]),
            ds_tipo=row[3],
            id_agendamento=str(row[4]) if row[4] else None,
            id_procedimento=str(row[5]) if row[5] else None,
            st_arquivada=row[6],
            st_ativa=row[7],
            dt_ultima_mensagem=row[8],
            dt_criacao=row[9],
            nm_user_1=row[10],
            ds_foto_user_1=row[11],
            nm_user_2=row[12],
            ds_foto_user_2=row[13],
            total_mensagens=row[14],
            mensagens_nao_lidas=row[15]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter conversa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter conversa: {str(e)}")


@router.put("/{conversa_id}/arquivar")
async def arquivar_conversa(
    conversa_id: str,
    arquivar: bool = Query(True, description="True para arquivar, False para desarquivar"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Arquivar ou desarquivar uma conversa.
    """
    try:
        query = text("""
            UPDATE tb_conversas
            SET st_arquivada = :arquivar
            WHERE id_conversa = :id_conversa
            RETURNING id_conversa
        """)

        result = await db.execute(query, {
            "id_conversa": conversa_id,
            "arquivar": arquivar
        })
        await db.commit()

        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Conversa não encontrada")

        return {
            "message": f"Conversa {'arquivada' if arquivar else 'desarquivada'} com sucesso",
            "id_conversa": conversa_id,
            "st_arquivada": arquivar
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao arquivar conversa: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao arquivar conversa: {str(e)}")


@router.delete("/{conversa_id}")
async def deletar_conversa(
    conversa_id: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Deletar conversa (soft delete).
    """
    try:
        query = text("""
            UPDATE tb_conversas
            SET st_ativa = FALSE
            WHERE id_conversa = :id_conversa
            RETURNING id_conversa
        """)

        result = await db.execute(query, {"id_conversa": conversa_id})
        await db.commit()

        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Conversa não encontrada")

        return {"message": "Conversa deletada com sucesso", "id_conversa": conversa_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar conversa: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao deletar conversa: {str(e)}")


@router.get("/stats/{id_user}", response_model=ConversaStatsResponse)
async def estatisticas_conversas(
    id_user: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Estatísticas de conversas do usuário.
    """
    try:
        query = text("""
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE st_arquivada = FALSE) as ativas,
                COUNT(*) FILTER (WHERE st_arquivada = TRUE) as arquivadas,
                COUNT(DISTINCT c.id_conversa) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM tb_mensagens_usuarios m
                        WHERE m.id_conversa = c.id_conversa
                        AND m.st_lida = FALSE
                        AND m.id_remetente != :id_user
                        AND m.st_deletada = FALSE
                    )
                ) as com_mensagens_nao_lidas
            FROM tb_conversas c
            WHERE (c.id_user_1 = :id_user OR c.id_user_2 = :id_user)
            AND c.st_ativa = TRUE
        """)

        result = await db.execute(query, {"id_user": id_user})
        row = result.fetchone()

        return ConversaStatsResponse(
            total=row[0],
            ativas=row[1],
            arquivadas=row[2],
            com_mensagens_nao_lidas=row[3]
        )

    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")


# ============================================================================
# COMPARTILHAMENTO DE CONVERSAS - UC085
# ============================================================================

from src.models.conversa_compartilhada import (
    CompartilharConversaRequest,
    CompartilharConversaResponse,
    AcessarConversaCompartilhadaRequest,
    ConversaCompartilhadaResponse,
    CompartilhamentoListResponse,
    CompartilhamentoListItem,
    CompartilhamentoStats
)
from src.services.conversa_compartilhada_service import ConversaCompartilhadaService
from src.utils.auth import get_current_user


@router.post("/{id_conversa}/compartilhar/", response_model=CompartilharConversaResponse)
async def compartilhar_conversa(
    id_conversa: str,
    request: CompartilharConversaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Cria link público para compartilhar conversa

    **Permissões:** Usuário autenticado (participante da conversa)

    **Recursos:**
    - Token único para acesso público
    - Senha opcional para proteger o link
    - Expiração configurável (dias ou data específica)
    - Contador de visualizações

    **Exemplos de Uso:**
    - Compartilhar histórico de atendimento com outro profissional
    - Fornecer acesso temporário a supervisor/auditor
    - Documentar comunicação importante

    **Segurança:**
    - Token URL-safe de 43 caracteres
    - Senha opcional com hash bcrypt
    - Controle de expiração
    - Rastreamento de acessos
    """
    try:
        # Obter IP do cliente (opcional)
        ip_criador = None  # TODO: Extrair de request.client.host se disponível

        # Criar compartilhamento
        compartilhamento = await ConversaCompartilhadaService.criar_compartilhamento(
            db=db,
            id_conversa=UUID(id_conversa),
            id_user_criador=UUID(current_user.id_user),
            data=request,
            ip_criador=ip_criador
        )

        # Montar URL completa
        # TODO: Pegar base URL das configs
        base_url = "https://doctorq.app"  # ou settings.frontend_url
        url_compartilhamento = f"{base_url}/conversas/compartilhadas/{compartilhamento.ds_token}"

        return CompartilharConversaResponse(
            id_compartilhamento=compartilhamento.id_compartilhamento,
            id_conversa=compartilhamento.id_conversa,
            ds_token=compartilhamento.ds_token,
            url_compartilhamento=url_compartilhamento,
            dt_expiracao=compartilhamento.dt_expiracao,
            fg_protegido_senha=compartilhamento.ds_senha_hash is not None,
            dt_criacao=compartilhamento.dt_criacao
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao compartilhar conversa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao compartilhar conversa: {str(e)}")


@router.post("/compartilhadas/{token}/", response_model=ConversaCompartilhadaResponse)
async def acessar_conversa_compartilhada(
    token: str,
    request: AcessarConversaCompartilhadaRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Acessa conversa compartilhada via token público

    **Permissões:** Público (não requer autenticação, apenas token válido)

    **Validações:**
    - Token deve existir e estar ativo
    - Link não deve estar expirado
    - Senha deve ser válida (se protegido)

    **Resposta:**
    - Mensagens da conversa
    - Dados anonimizados dos participantes
    - Metadados do compartilhamento

    **Observações:**
    - Incrementa contador de visualizações
    - Atualiza data do último acesso
    """
    try:
        # Buscar compartilhamento por token
        compartilhamento = await ConversaCompartilhadaService.buscar_por_token(
            db=db,
            token=token,
            incrementar_visualizacao=True
        )

        if not compartilhamento:
            raise HTTPException(
                status_code=404,
                detail="Link inválido ou expirado"
            )

        # Validar senha (se protegido)
        senha_valida = await ConversaCompartilhadaService.validar_senha(
            compartilhamento=compartilhamento,
            senha_fornecida=request.ds_senha
        )

        if not senha_valida:
            raise HTTPException(
                status_code=401,
                detail="Senha incorreta"
            )

        # Buscar dados da conversa e mensagens
        query = text("""
            SELECT
                c.id_conversa, c.ds_tipo, c.dt_criacao, c.dt_ultima_mensagem,
                u1.nm_completo as nm_user_1, u1.ds_foto_url as ds_foto_user_1,
                u2.nm_completo as nm_user_2, u2.ds_foto_url as ds_foto_user_2
            FROM tb_conversas c
            LEFT JOIN tb_users u1 ON c.id_user_1 = u1.id_user
            LEFT JOIN tb_users u2 ON c.id_user_2 = u2.id_user
            WHERE c.id_conversa = :id_conversa
        """)

        result = await db.execute(query, {"id_conversa": str(compartilhamento.id_conversa)})
        conversa_row = result.fetchone()

        if not conversa_row:
            raise HTTPException(status_code=404, detail="Conversa não encontrada")

        # Buscar mensagens
        mensagens_query = text("""
            SELECT
                id_mensagem, id_user_remetente, ds_conteudo,
                dt_enviada, st_lida, ds_tipo_conteudo
            FROM tb_mensagens_usuarios
            WHERE id_conversa = :id_conversa AND st_deletada = FALSE
            ORDER BY dt_enviada ASC
        """)

        mensagens_result = await db.execute(mensagens_query, {"id_conversa": str(compartilhamento.id_conversa)})
        mensagens = [
            {
                "id_mensagem": str(row[0]),
                "id_user_remetente": str(row[1]),
                "ds_conteudo": row[2],
                "dt_enviada": row[3],
                "st_lida": row[4],
                "ds_tipo_conteudo": row[5]
            }
            for row in mensagens_result.fetchall()
        ]

        return ConversaCompartilhadaResponse(
            id_conversa=UUID(str(conversa_row[0])),
            ds_tipo=conversa_row[1],
            dt_criacao=conversa_row[2],
            dt_ultima_mensagem=conversa_row[3],
            nm_user_1=conversa_row[4] or "Usuário 1",
            ds_foto_user_1=conversa_row[5],
            nm_user_2=conversa_row[6] or "Usuário 2",
            ds_foto_user_2=conversa_row[7],
            mensagens=mensagens,
            nr_visualizacoes=compartilhamento.nr_visualizacoes,
            dt_compartilhado=compartilhamento.dt_criacao,
            ds_descricao=compartilhamento.ds_descricao
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao acessar conversa compartilhada: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao acessar conversa: {str(e)}")


@router.get("/compartilhadas/", response_model=CompartilhamentoListResponse)
async def listar_compartilhamentos(
    id_conversa: Optional[str] = Query(None, description="Filtrar por conversa"),
    apenas_ativos: bool = Query(True, description="Apenas links ativos"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Lista compartilhamentos do usuário

    **Permissões:** Usuário autenticado

    **Filtros:**
    - id_conversa: Filtrar por conversa específica
    - apenas_ativos: Se deve mostrar apenas links ativos
    - Paginação: page e size

    **Ordenação:** Data de criação (mais recente primeiro)
    """
    try:
        id_conversa_uuid = UUID(id_conversa) if id_conversa else None

        compartilhamentos, total = await ConversaCompartilhadaService.listar_compartilhamentos(
            db=db,
            id_conversa=id_conversa_uuid,
            id_user_criador=UUID(current_user.id_user),
            apenas_ativos=apenas_ativos,
            page=page,
            size=size
        )

        # Montar URL para cada compartilhamento
        base_url = "https://doctorq.app"  # TODO: Pegar das configs
        items = [
            CompartilhamentoListItem(
                id_compartilhamento=c.id_compartilhamento,
                id_conversa=c.id_conversa,
                ds_token=c.ds_token,
                url_compartilhamento=f"{base_url}/conversas/compartilhadas/{c.ds_token}",
                dt_expiracao=c.dt_expiracao,
                fg_protegido_senha=c.ds_senha_hash is not None,
                fg_expirado=c.fg_expirado,
                nr_visualizacoes=c.nr_visualizacoes,
                dt_ultimo_acesso=c.dt_ultimo_acesso,
                dt_criacao=c.dt_criacao,
                fg_ativo=c.fg_ativo
            )
            for c in compartilhamentos
        ]

        return CompartilhamentoListResponse(
            total=total,
            page=page,
            size=size,
            items=items
        )

    except Exception as e:
        logger.error(f"Erro ao listar compartilhamentos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar compartilhamentos: {str(e)}")


@router.delete("/compartilhadas/{id_compartilhamento}/", status_code=200)
async def revogar_compartilhamento(
    id_compartilhamento: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Revoga link de compartilhamento

    **Permissões:** Usuário autenticado (criador do link)

    **Efeito:**
    - Link não poderá mais ser acessado
    - Soft delete (fg_ativo = false)
    - Registra data de revogação

    **Validações:**
    - Apenas o criador pode revogar
    """
    try:
        compartilhamento = await ConversaCompartilhadaService.revogar_compartilhamento(
            db=db,
            id_compartilhamento=UUID(id_compartilhamento),
            id_user_revogador=UUID(current_user.id_user)
        )

        if not compartilhamento:
            raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")

        return {
            "message": "Compartilhamento revogado com sucesso",
            "id_compartilhamento": id_compartilhamento
        }

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao revogar compartilhamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao revogar: {str(e)}")


@router.get("/compartilhadas/stats/", response_model=CompartilhamentoStats)
async def obter_estatisticas_compartilhamentos(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtém estatísticas de compartilhamentos do usuário

    **Permissões:** Usuário autenticado

    **Métricas:**
    - Total de compartilhamentos criados
    - Links ativos vs expirados
    - Links protegidos por senha
    - Total de visualizações
    - Média de visualizações por link
    """
    try:
        stats = await ConversaCompartilhadaService.obter_estatisticas(
            db=db,
            id_user=UUID(current_user.id_user)
        )

        return CompartilhamentoStats(**stats)

    except Exception as e:
        logger.error(f"Erro ao obter estatísticas de compartilhamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")
