"""
Rotas para gerenciar Profissionais
"""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, Request, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user
from src.utils.auth_helpers import validate_empresa_access, get_user_empresa_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profissionais", tags=["Profissionais"])

# ============================================================================
# MODELS
# ============================================================================

class ProfissionalResponse(BaseModel):
    id_profissional: str
    id_user: Optional[str] = None
    id_empresa: Optional[str] = None
    nm_profissional: str
    ds_especialidades: Optional[List[str]] = None
    ds_biografia: Optional[str] = None
    ds_foto: Optional[str] = None
    ds_formacao: Optional[str] = None
    nr_registro_profissional: Optional[str] = None
    nr_anos_experiencia: Optional[int] = None
    nr_avaliacao_media: Optional[float] = None
    nr_total_avaliacoes: Optional[int] = None
    st_ativo: bool
    st_aceita_online: Optional[bool] = True  # ✅ Opcional com default True
    ds_idiomas: Optional[List[str]] = None
    ds_redes_sociais: Optional[dict] = None
    dt_criacao: datetime
    # Dados relacionados
    nm_empresa: Optional[str] = None
    nm_user: Optional[str] = None
    ds_email: Optional[str] = None
    nr_telefone: Optional[str] = None
    nr_whatsapp: Optional[str] = None

    class Config:
        from_attributes = True


class ProfissionaisResponse(BaseModel):
    items: List[ProfissionalResponse]
    meta: dict


class ProfissionalCreateRequest(BaseModel):
    id_user: str
    id_clinica: Optional[str] = None
    id_empresa: Optional[str] = None  # Deprecated - usar id_clinica
    nm_profissional: str = Field(..., max_length=255)
    ds_especialidades: List[str] = Field(..., min_length=1, description="Ex: ['Dermatologia', 'Estética Facial']")
    ds_biografia: Optional[str] = None
    ds_foto: Optional[str] = None
    ds_formacao: Optional[str] = None
    nr_registro_profissional: Optional[str] = Field(None, max_length=50)
    nr_anos_experiencia: Optional[int] = Field(None, ge=0, le=100)
    st_aceita_online: bool = True
    ds_idiomas: Optional[List[str]] = Field(None, description="Ex: ['Português', 'Inglês']")
    ds_redes_sociais: Optional[dict] = Field(None, description="Ex: {'instagram': '@user', 'linkedin': 'profile'}")


class ProfissionalUpdateRequest(BaseModel):
    nm_profissional: Optional[str] = Field(None, max_length=255)
    ds_especialidades: Optional[List[str]] = None
    ds_biografia: Optional[str] = None
    ds_foto: Optional[str] = None
    ds_formacao: Optional[str] = None
    nr_registro_profissional: Optional[str] = Field(None, max_length=50)
    nr_anos_experiencia: Optional[int] = Field(None, ge=0, le=100)
    ds_email: Optional[str] = Field(None, max_length=255)
    nr_telefone: Optional[str] = Field(None, max_length=20)
    nr_whatsapp: Optional[str] = Field(None, max_length=20)
    st_ativo: Optional[bool] = None
    st_aceita_online: Optional[bool] = None
    ds_idiomas: Optional[List[str]] = None
    ds_redes_sociais: Optional[dict] = None


class EstatisticasProfissionalResponse(BaseModel):
    id_profissional: str
    total_agendamentos: int
    agendamentos_concluidos: int
    agendamentos_pendentes: int
    taxa_conclusao: float
    avaliacoes_positivas: int
    avaliacoes_neutras: int
    avaliacoes_negativas: int
    total_avaliacoes: int
    media_avaliacoes: float
    total_pacientes: int
    total_procedimentos: int
    receita_total: float


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", response_model=ProfissionaisResponse)
async def listar_profissionais(
    request: Request,
    id_empresa: Optional[str] = Query(None, description="UUID da empresa (obrigatório para Admin)"),
    id_user: Optional[str] = Query(None, description="UUID do usuário para filtrar profissional específico"),
    ds_especialidade: Optional[str] = Query(None),
    st_ativo: Optional[bool] = Query(None),
    st_aceita_novos_pacientes: Optional[bool] = Query(None),
    busca: Optional[str] = Query(None, description="Buscar por nome ou especialidade"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista profissionais com filtros e paginação.
    - Admin pode filtrar por qualquer empresa passando id_empresa
    - Outros usuários verão apenas profissionais de sua própria empresa
    """
    try:
        # WHERE conditions - por padrão, só lista profissionais ativos
        where_clauses = ["p.st_ativo = TRUE"]  # Apenas ativos por padrão

        # ⚠️ BUSCA PÚBLICA: Apenas filtrar por empresa se explicitamente fornecido
        # Não usar id_empresa da API Key ou JWT para permitir busca pública
        empresa_filtro = id_empresa  # Apenas o parâmetro explícito da query string

        # ⚠️ FILTRO OPCIONAL: Se empresa_filtro for fornecido, filtrar por empresa
        # tb_profissionais usa id_clinica, então filtramos via JOIN com tb_clinicas
        # Se não houver empresa_filtro, mostra TODOS profissionais ativos (busca pública)
        if empresa_filtro:
            where_clauses.append(f"c.id_empresa = :id_empresa")

        if id_user:
            where_clauses.append(f"p.id_user = :id_user")

        if ds_especialidade:
            where_clauses.append(f"p.ds_especialidades ILIKE :especialidade")

        # Se st_ativo for explicitamente passado, sobrescreve o filtro padrão
        if st_ativo is not None:
            where_clauses[0] = f"p.st_ativo = :st_ativo"

        # st_aceita_novos_pacientes column doesn't exist in tb_profissionais
        # if st_aceita_novos_pacientes is not None:
        #     where_clauses.append(f"p.st_aceita_novos_pacientes = :aceita_novos")

        if busca:
            where_clauses.append(
                "(p.nm_profissional ILIKE :busca OR p.ds_especialidades::text ILIKE :busca)"
            )

        where_clause = " AND ".join(where_clauses)

        # Count total
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_profissionais p
            LEFT JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE {where_clause}
        """)

        # Query principal (ajustado para schema correto)
        query = text(f"""
            SELECT
                p.id_profissional::text,
                p.id_user::text,
                c.id_empresa::text as id_empresa,
                p.nm_profissional,
                p.ds_especialidades,
                p.ds_biografia,
                p.ds_foto,
                p.ds_formacao,
                p.nr_registro_profissional,
                p.nr_anos_experiencia,
                p.nr_avaliacao_media,
                p.nr_total_avaliacoes,
                p.st_ativo,
                p.st_aceita_online,
                NULL::text[] as ds_idiomas,
                NULL::jsonb as ds_redes_sociais,
                p.dt_criacao,
                c.nm_clinica as nm_empresa,
                u.nm_completo as nm_user,
                u.nm_email as ds_email,
                p.nr_telefone,
                p.nr_whatsapp
            FROM tb_profissionais p
            LEFT JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            LEFT JOIN tb_users u ON p.id_user = u.id_user
            WHERE {where_clause}
            ORDER BY p.dt_criacao DESC
            LIMIT :limit OFFSET :offset
        """)

        # Parâmetros
        params = {
            "limit": size,
            "offset": (page - 1) * size,
        }

        # Adicionar id_empresa apenas se houver filtro de empresa
        if empresa_filtro:
            params["id_empresa"] = str(empresa_filtro)

        if id_user:
            params["id_user"] = id_user

        if ds_especialidade:
            params["especialidade"] = f"%{ds_especialidade}%"

        if st_ativo is not None:
            params["st_ativo"] = st_ativo

        # st_aceita_novos_pacientes doesn't exist
        # if st_aceita_novos_pacientes is not None:
        #     params["aceita_novos"] = st_aceita_novos_pacientes

        if busca:
            params["busca"] = f"%{busca}%"

        # Executar queries
        count_result = await db.execute(count_query, params)
        total = count_result.scalar()

        result = await db.execute(query, params)
        rows = result.fetchall()

        # Montar resposta
        profissionais = []
        for row in rows:
            profissionais.append(ProfissionalResponse(
                id_profissional=row.id_profissional,
                id_user=row.id_user,
                id_empresa=row.id_empresa,
                nm_profissional=row.nm_profissional,
                ds_especialidades=row.ds_especialidades,
                ds_biografia=row.ds_biografia,
                ds_foto=row.ds_foto,
                ds_formacao=row.ds_formacao,
                nr_registro_profissional=row.nr_registro_profissional,
                nr_anos_experiencia=row.nr_anos_experiencia,
                nr_avaliacao_media=float(row.nr_avaliacao_media) if row.nr_avaliacao_media else None,
                nr_total_avaliacoes=row.nr_total_avaliacoes,
                st_ativo=row.st_ativo,
                st_aceita_online=row.st_aceita_online,
                ds_idiomas=row.ds_idiomas,
                ds_redes_sociais=row.ds_redes_sociais,
                dt_criacao=row.dt_criacao,
                nm_empresa=row.nm_empresa,
                nm_user=row.nm_user,
                ds_email=row.ds_email,
                nr_telefone=row.nr_telefone,
                nr_whatsapp=row.nr_whatsapp,
            ))

        return ProfissionaisResponse(
            items=profissionais,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar profissionais: {str(e)}")


@router.get("/public/{id_profissional}/", response_model=ProfissionalResponse)
async def obter_profissional_publico(
    id_profissional: UUID = Path(..., description="UUID do profissional"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna um profissional específico - Rota pública (sem autenticação).

    Usada para visualização pública de perfis de profissionais.
    """
    try:
        logger.info(f"🔍 Buscando profissional público: {id_profissional}")

        query = text("""
            SELECT
                p.id_profissional::text,
                p.id_user::text,
                c.id_empresa::text as id_empresa,
                p.nm_profissional,
                p.ds_especialidades,
                p.ds_biografia,
                p.ds_foto,
                p.ds_formacao,
                p.nr_registro_profissional,
                p.nr_anos_experiencia,
                p.nr_telefone,
                p.nr_whatsapp,
                p.nr_avaliacao_media,
                p.nr_total_avaliacoes,
                p.st_ativo,
                COALESCE(p.st_aceita_online, true) as st_aceita_online,
                NULL::text[] as ds_idiomas,
                NULL::jsonb as ds_redes_sociais,
                p.dt_criacao,
                c.nm_clinica as nm_empresa,
                u.nm_completo as nm_user,
                u.nm_email as ds_email
            FROM tb_profissionais p
            LEFT JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            LEFT JOIN tb_users u ON p.id_user = u.id_user
            WHERE p.id_profissional = :id_profissional
              AND p.st_ativo = TRUE
        """)

        result = await db.execute(query, {
            "id_profissional": str(id_profissional)
        })
        row = result.fetchone()

        if not row:
            logger.warning(f"❌ Profissional público não encontrado: {id_profissional}")
            raise HTTPException(status_code=404, detail="Profissional não encontrado")

        logger.info(f"✅ Profissional público encontrado: {row.nm_profissional}")

        return ProfissionalResponse(
            id_profissional=row.id_profissional,
            id_user=row.id_user,
            id_empresa=row.id_empresa,
            nm_profissional=row.nm_profissional,
            ds_especialidades=row.ds_especialidades,
            ds_biografia=row.ds_biografia,
            ds_foto=row.ds_foto,
            ds_formacao=row.ds_formacao,
            nr_registro_profissional=row.nr_registro_profissional,
            nr_anos_experiencia=row.nr_anos_experiencia,
            nr_avaliacao_media=float(row.nr_avaliacao_media) if row.nr_avaliacao_media else None,
            nr_total_avaliacoes=row.nr_total_avaliacoes,
            st_ativo=row.st_ativo,
            st_aceita_online=row.st_aceita_online,
            ds_idiomas=row.ds_idiomas,
            ds_redes_sociais=row.ds_redes_sociais,
            dt_criacao=row.dt_criacao,
            nm_empresa=row.nm_empresa,
            nm_user=row.nm_user,
            ds_email=row.ds_email,
            nr_telefone=row.nr_telefone,
            nr_whatsapp=row.nr_whatsapp,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao buscar profissional público: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar profissional: {str(e)}")


@router.get("/{id_profissional}", response_model=ProfissionalResponse)
async def obter_profissional(
    id_profissional: UUID = Path(..., description="UUID do profissional"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna um profissional específico.
    """
    try:
        query = text("""
            SELECT
                p.id_profissional::text,
                p.id_user::text,
                c.id_empresa::text as id_empresa,
                p.nm_profissional,
                p.ds_especialidades,
                p.ds_biografia,
                p.ds_foto,
                p.ds_formacao,
                p.nr_registro_profissional,
                p.nr_anos_experiencia,
                p.nr_telefone,
                p.nr_whatsapp,
                p.nr_avaliacao_media,
                p.nr_total_avaliacoes,
                p.st_ativo,
                p.st_aceita_online,
                NULL::text[] as ds_idiomas,
                NULL::jsonb as ds_redes_sociais,
                p.dt_criacao,
                c.nm_clinica as nm_empresa,
                u.nm_completo as nm_user,
                u.nm_email as ds_email
            FROM tb_profissionais p
            LEFT JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            LEFT JOIN tb_users u ON p.id_user = u.id_user
            WHERE p.id_profissional = :id_profissional
              AND (c.id_empresa = :id_empresa OR p.id_clinica IS NULL)
              AND p.st_ativo = TRUE
        """)

        result = await db.execute(query, {
            "id_profissional": id_profissional,
            "id_empresa": str(current_user.id_empresa)
        })
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")

        return ProfissionalResponse(
            id_profissional=row.id_profissional,
            id_user=row.id_user,
            id_empresa=row.id_empresa,
            nm_profissional=row.nm_profissional,
            ds_especialidades=row.ds_especialidades,
            ds_biografia=row.ds_biografia,
            ds_foto=row.ds_foto,
            ds_formacao=row.ds_formacao,
            nr_registro_profissional=row.nr_registro_profissional,
            nr_anos_experiencia=row.nr_anos_experiencia,
            nr_avaliacao_media=float(row.nr_avaliacao_media) if row.nr_avaliacao_media else None,
            nr_total_avaliacoes=row.nr_total_avaliacoes,
            st_ativo=row.st_ativo,
            st_aceita_online=row.st_aceita_online,
            ds_idiomas=row.ds_idiomas,
            ds_redes_sociais=row.ds_redes_sociais,
            dt_criacao=row.dt_criacao,
            nm_empresa=row.nm_empresa,
            nm_user=row.nm_user,
            ds_email=row.ds_email,
            nr_telefone=row.nr_telefone,
            nr_whatsapp=row.nr_whatsapp,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter profissional: {str(e)}")


@router.post("/", response_model=ProfissionalResponse)
async def criar_profissional(
    request: ProfissionalCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria um novo profissional.
    """
    try:
        # 🔒 SEGURANÇA: Validar que a clínica pertence à empresa do usuário
        # TODO: Reimplementar validação de clínica
        id_empresa_user = current_user.id_empresa

        query = text("""
            INSERT INTO tb_profissionais (
                id_user, id_clinica, nm_profissional, ds_especialidades,
                ds_biografia, ds_foto, ds_formacao, nr_registro_profissional,
                nr_anos_experiencia
            )
            VALUES (
                :id_user, :id_clinica, :nm_profissional, :ds_especialidades,
                :ds_biografia, :ds_foto, :ds_formacao, :nr_registro_profissional,
                :nr_anos_experiencia
            )
            RETURNING id_profissional
        """)

        result = await db.execute(query, {
            "id_user": UUID(request.id_user) if request.id_user else None,
            "id_clinica": UUID(request.id_clinica) if request.id_clinica else None,
            "nm_profissional": request.nm_profissional,
            "ds_especialidades": request.ds_especialidades,
            "ds_biografia": request.ds_biografia,
            "ds_foto": request.ds_foto,
            "ds_formacao": request.ds_formacao,
            "nr_registro_profissional": request.nr_registro_profissional,
            "nr_anos_experiencia": request.nr_anos_experiencia,
        })

        await db.commit()

        id_profissional = result.fetchone()[0]

        # Retornar profissional criado
        return await obter_profissional(id_profissional, current_user, db)

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar profissional: {str(e)}")


@router.put("/{id_profissional}", response_model=ProfissionalResponse)
async def atualizar_profissional(
    id_profissional: UUID = Path(..., description="UUID do profissional"),
    request: ProfissionalUpdateRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza um profissional existente.
    """
    try:
        # 🔒 SEGURANÇA: Verificar se profissional existe e pertence à empresa do usuário
        id_empresa_user = current_user.id_empresa

        check_query = text("""
            SELECT c.id_empresa
            FROM tb_profissionais p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE p.id_profissional = :id_profissional
        """)
        check_result = await db.execute(check_query, {"id_profissional": id_profissional})
        prof_row = check_result.fetchone()

        if not prof_row:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")

        if str(prof_row[0]) != str(id_empresa_user):
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para atualizar este profissional"
            )

        # Construir SET clauses dinamicamente
        set_clauses = []
        params = {"id_profissional": id_profissional, "dt_atualizacao": datetime.now()}

        if request.nm_profissional is not None:
            set_clauses.append("nm_profissional = :nm_profissional")
            params["nm_profissional"] = request.nm_profissional

        if request.ds_especialidades is not None:
            set_clauses.append("ds_especialidades = :ds_especialidades")
            params["ds_especialidades"] = request.ds_especialidades

        if request.ds_biografia is not None:
            set_clauses.append("ds_biografia = :ds_biografia")
            params["ds_biografia"] = request.ds_biografia

        if request.ds_foto is not None:
            set_clauses.append("ds_foto = :ds_foto")
            params["ds_foto"] = request.ds_foto

        if request.ds_formacao is not None:
            set_clauses.append("ds_formacao = :ds_formacao")
            params["ds_formacao"] = request.ds_formacao

        if request.nr_registro_profissional is not None:
            set_clauses.append("nr_registro_profissional = :nr_registro_profissional")
            params["nr_registro_profissional"] = request.nr_registro_profissional

        if request.nr_anos_experiencia is not None:
            set_clauses.append("nr_anos_experiencia = :nr_anos_experiencia")
            params["nr_anos_experiencia"] = request.nr_anos_experiencia

        if request.nr_telefone is not None:
            set_clauses.append("nr_telefone = :nr_telefone")
            params["nr_telefone"] = request.nr_telefone

        if request.ds_email is not None:
            set_clauses.append("ds_email = :ds_email")
            params["ds_email"] = request.ds_email

        if request.st_ativo is not None:
            set_clauses.append("st_ativo = :st_ativo")
            params["st_ativo"] = request.st_ativo

        # NOTA: Campos removidos pois não existem na tabela tb_profissionais
        # if request.st_aceita_novos_pacientes is not None:
        #     set_clauses.append("st_aceita_novos_pacientes = :st_aceita_novos_pacientes")
        #     params["st_aceita_novos_pacientes"] = request.st_aceita_novos_pacientes

        # if request.ds_idiomas is not None:
        #     set_clauses.append("ds_idiomas = :ds_idiomas")
        #     params["ds_idiomas"] = request.ds_idiomas

        # if request.ds_redes_sociais is not None:
        #     set_clauses.append("ds_redes_sociais = :ds_redes_sociais")
        #     params["ds_redes_sociais"] = request.ds_redes_sociais

        if not set_clauses:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

        set_clauses.append("dt_atualizacao = :dt_atualizacao")

        update_query = text(f"""
            UPDATE tb_profissionais
            SET {", ".join(set_clauses)}
            WHERE id_profissional = :id_profissional
        """)

        await db.execute(update_query, params)
        await db.commit()

        return await obter_profissional(id_profissional, current_user, db)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar profissional: {str(e)}")


@router.delete("/{id_profissional}")
async def deletar_profissional(
    id_profissional: UUID = Path(..., description="UUID do profissional"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deleta (soft delete) um profissional - marca como inativo.
    """
    try:
        # 🔒 SEGURANÇA: Validar que o profissional pertence à empresa do usuário
        id_empresa_user = current_user.id_empresa

        query = text("""
            UPDATE tb_profissionais p
            SET st_ativo = FALSE, dt_atualizacao = :dt_atualizacao
            FROM tb_clinicas c
            WHERE p.id_profissional = :id_profissional
              AND p.id_clinica = c.id_clinica
              AND c.id_empresa = :id_empresa
              AND p.st_ativo = TRUE
            RETURNING p.id_profissional
        """)

        result = await db.execute(query, {
            "id_profissional": id_profissional,
            "dt_atualizacao": datetime.now(),
            "id_empresa": str(id_empresa_user)
        })

        if not result.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Profissional não encontrado, já está inativo ou você não tem permissão"
            )

        await db.commit()

        return {"message": "Profissional inativado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao inativar profissional: {str(e)}")


@router.get("/{id_profissional}/stats", response_model=EstatisticasProfissionalResponse)
async def estatisticas_profissional(
    id_profissional: UUID = Path(..., description="UUID do profissional"),
    dt_inicio: Optional[date] = Query(None),
    dt_fim: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna estatísticas do profissional.
    """
    try:
        # WHERE conditions para data
        date_conditions = []
        params = {
            "id_profissional": id_profissional,
            "id_empresa": str(current_user.id_empresa)
        }

        if dt_inicio:
            date_conditions.append("a.dt_agendamento >= :dt_inicio")
            params["dt_inicio"] = dt_inicio

        if dt_fim:
            date_conditions.append("a.dt_agendamento <= :dt_fim")
            params["dt_fim"] = dt_fim

        date_clause = " AND " + " AND ".join(date_conditions) if date_conditions else ""

        query = text(f"""
            SELECT
                COUNT(DISTINCT a.id_agendamento) as total_agendamentos,
                COUNT(DISTINCT a.id_agendamento) FILTER (WHERE a.ds_status = 'concluido') as agendamentos_concluidos,
                COUNT(DISTINCT a.id_agendamento) FILTER (WHERE a.ds_status IN ('pendente', 'confirmado')) as agendamentos_pendentes,
                COUNT(DISTINCT av.id_avaliacao) FILTER (WHERE av.nr_nota >= 4) as avaliacoes_positivas,
                COUNT(DISTINCT av.id_avaliacao) FILTER (WHERE av.nr_nota = 3) as avaliacoes_neutras,
                COUNT(DISTINCT av.id_avaliacao) FILTER (WHERE av.nr_nota <= 2) as avaliacoes_negativas,
                COUNT(DISTINCT av.id_avaliacao) as total_avaliacoes,
                COALESCE(AVG(av.nr_nota), 0) as media_avaliacoes,
                COUNT(DISTINCT a.id_paciente) as total_pacientes,
                COUNT(DISTINCT a.id_procedimento) as total_procedimentos,
                COALESCE(SUM(t.vl_liquido) FILTER (WHERE t.ds_status = 'pago'), 0) as receita_total
            FROM tb_profissionais p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            LEFT JOIN tb_agendamentos a ON p.id_profissional = a.id_profissional {date_clause}
            LEFT JOIN tb_avaliacoes av ON p.id_profissional = av.id_profissional
            LEFT JOIN tb_transacoes t ON a.id_agendamento = t.id_agendamento
            WHERE p.id_profissional = :id_profissional
              AND c.id_empresa = :id_empresa
              AND p.st_ativo = TRUE
            GROUP BY p.id_profissional
        """)

        result = await db.execute(query, params)
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")

        total = row.total_agendamentos or 0
        concluidos = row.agendamentos_concluidos or 0
        taxa_conclusao = (concluidos / total * 100) if total > 0 else 0.0

        return EstatisticasProfissionalResponse(
            id_profissional=str(id_profissional),
            total_agendamentos=total,
            agendamentos_concluidos=concluidos,
            agendamentos_pendentes=row.agendamentos_pendentes or 0,
            taxa_conclusao=round(taxa_conclusao, 2),
            avaliacoes_positivas=row.avaliacoes_positivas or 0,
            avaliacoes_neutras=row.avaliacoes_neutras or 0,
            avaliacoes_negativas=row.avaliacoes_negativas or 0,
            total_avaliacoes=row.total_avaliacoes or 0,
            media_avaliacoes=round(float(row.media_avaliacoes), 2),
            total_pacientes=row.total_pacientes or 0,
            total_procedimentos=row.total_procedimentos or 0,
            receita_total=float(row.receita_total or 0),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")


# ============================================================================
# ENDPOINTS MULTI-CLÍNICA
# ============================================================================

class ClinicaProfissionalResponse(BaseModel):
    """Resposta com dados da clínica vinculada ao profissional"""
    id_clinica: str
    nm_clinica: str
    ds_endereco: Optional[str] = None
    ds_telefone: Optional[str] = None
    ds_email: Optional[str] = None
    st_ativo: bool
    dt_vinculo: datetime

    class Config:
        from_attributes = True


@router.get("/{id_profissional}/clinicas/", response_model=List[ClinicaProfissionalResponse])
async def listar_clinicas_profissional(
    id_profissional: UUID = Path(..., description="UUID do profissional"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista todas as clínicas ativas vinculadas a um profissional.

    Usa a view vw_profissionais_clinicas criada na migration 020.
    Retorna apenas clínicas com st_ativo = true.

    **Suporte Multi-Clínica**: Profissional pode trabalhar em múltiplas clínicas
    """
    try:
        query = text("""
            SELECT
                c.id_clinica,
                c.nm_clinica,
                c.ds_endereco,
                c.ds_telefone,
                c.ds_email,
                pc.st_ativo,
                pc.dt_vinculo
            FROM tb_profissionais_clinicas pc
            INNER JOIN tb_clinicas c ON pc.id_clinica = c.id_clinica
            WHERE pc.id_profissional = :id_profissional
                AND pc.st_ativo = true
                AND c.st_ativo = true
                AND c.id_empresa = :id_empresa
            ORDER BY pc.dt_vinculo DESC
        """)

        result = await db.execute(query, {
            "id_profissional": id_profissional,
            "id_empresa": str(current_user.id_empresa)
        })
        rows = result.fetchall()

        clinicas = [
            {
                "id_clinica": str(row.id_clinica),
                "nm_clinica": row.nm_clinica,
                "ds_endereco": row.ds_endereco,
                "ds_telefone": row.ds_telefone,
                "ds_email": row.ds_email,
                "st_ativo": row.st_ativo,
                "dt_vinculo": row.dt_vinculo,
            }
            for row in rows
        ]

        return clinicas

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar clínicas do profissional: {str(e)}"
        )


# ============================================================================
# ENDPOINT PARA CRIAR PROFISSIONAL COM USUÁRIO
# ============================================================================

class ProfissionalComUsuarioRequest(BaseModel):
    # Dados do profissional
    nm_profissional: str = Field(..., max_length=255)
    ds_email: str = Field(..., description="Email do profissional (será usado para criar usuário)")
    nr_telefone: Optional[str] = Field(None, max_length=20)
    ds_especialidades: List[str] = Field(..., min_items=1, description="Ex: ['Dermatologia', 'Estética Facial']")
    nr_registro_profissional: Optional[str] = Field(None, max_length=50)
    nr_anos_experiencia: Optional[int] = Field(None, ge=0, le=100)
    ds_formacao: Optional[str] = None
    ds_biografia: Optional[str] = None
    ds_foto: Optional[str] = None
    # Dados opcionais da clínica
    id_clinica: Optional[str] = Field(None, description="ID da clínica (opcional, será inferido da empresa)")


class ProfissionalComUsuarioResponse(BaseModel):
    profissional: ProfissionalResponse
    usuario_email: str
    senha_temporaria: str
    email_enviado: bool


@router.post("/create-with-user/", response_model=ProfissionalComUsuarioResponse)
async def criar_profissional_com_usuario(
    request: ProfissionalComUsuarioRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria um novo profissional junto com um usuário automaticamente.
    Envia email com as credenciais de acesso.

    Este endpoint:
    1. Cria um usuário na tb_users com email e senha gerada
    2. Cria um profissional na tb_profissionais vinculado ao usuário
    3. Envia email com as credenciais

    **Importante**: O email fornecido deve ser único no sistema.
    """
    import secrets
    import string
    from src.services.email_service import email_service

    try:
        # 🔒 SEGURANÇA: Validar empresa do usuário autenticado
        id_empresa_user = current_user.id_empresa

        if not id_empresa_user:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada"
            )

        # 1. Verificar se email já existe
        check_email_query = text("""
            SELECT id_user FROM tb_users WHERE nm_email = :email
        """)
        email_result = await db.execute(check_email_query, {"email": request.ds_email})
        existing_user = email_result.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail=f"Já existe um usuário com o email {request.ds_email}"
            )

        # 2. Gerar senha temporária (12 caracteres: letras maiúsculas, minúsculas e números)
        alphabet = string.ascii_letters + string.digits
        senha_temporaria = ''.join(secrets.choice(alphabet) for _ in range(12))

        # 3. Buscar perfil "profissional" usando query SQL direta (workaround para problema de transação)
        perfil_query_sql = text("""
            SELECT id_perfil, id_empresa
            FROM tb_perfis
            WHERE LOWER(nm_perfil) = 'profissional'
              AND (id_empresa = :id_empresa OR id_empresa IS NULL)
            ORDER BY CASE WHEN id_empresa = :id_empresa THEN 1 ELSE 2 END
            LIMIT 1
        """)

        logger.info(f"🔍 Buscando perfil 'profissional' para empresa {id_empresa_user}...")
        perfil_result = await db.execute(perfil_query_sql, {"id_empresa": str(id_empresa_user)})
        perfil_row = perfil_result.fetchone()

        if not perfil_row:
            logger.error("❌ Perfil 'profissional' não encontrado!")
            raise HTTPException(
                status_code=500,
                detail="Perfil 'profissional' não encontrado no sistema"
            )

        id_perfil = str(perfil_row.id_perfil)
        logger.info(f"✅ Perfil selecionado: {id_perfil}")

        # 4. Criar usuário
        from src.utils.security import hash_password
        logger.info(f"🔐 Gerando hash para senha de {len(senha_temporaria)} caracteres...")
        senha_hash = hash_password(senha_temporaria)
        logger.info(f"✅ Hash gerado com sucesso")

        create_user_query = text("""
            INSERT INTO tb_users (
                id_empresa, id_perfil, nm_email, nm_completo, ds_senha_hash,
                nr_telefone, nm_papel
            )
            VALUES (
                :id_empresa, :id_perfil, :nm_email, :nm_completo, :ds_senha_hash,
                :nr_telefone, :nm_papel
            )
            RETURNING id_user
        """)

        user_result = await db.execute(create_user_query, {
            "id_empresa": str(id_empresa_user),
            "id_perfil": id_perfil,
            "nm_email": request.ds_email,
            "nm_completo": request.nm_profissional,
            "ds_senha_hash": senha_hash,
            "nr_telefone": request.nr_telefone,
            "nm_papel": "profissional",
        })

        id_user = str(user_result.fetchone()[0])

        # 5. Buscar ou usar primeira clínica da empresa
        if request.id_clinica:
            id_clinica = request.id_clinica
        else:
            # Buscar primeira clínica ativa da empresa
            clinica_query = text("""
                SELECT id_clinica FROM tb_clinicas
                WHERE id_empresa = :id_empresa AND st_ativo = TRUE
                ORDER BY dt_criacao ASC
                LIMIT 1
            """)
            clinica_result = await db.execute(clinica_query, {"id_empresa": str(id_empresa_user)})
            clinica_row = clinica_result.fetchone()

            if not clinica_row:
                # Rollback da criação do usuário
                await db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail="Empresa não possui clínicas cadastradas. Cadastre uma clínica primeiro."
                )

            id_clinica = str(clinica_row[0])

        # 6. Criar profissional
        create_prof_query = text("""
            INSERT INTO tb_profissionais (
                id_user, id_clinica, nm_profissional, ds_email, nr_telefone,
                ds_especialidades, nr_registro_profissional, nr_anos_experiencia,
                ds_formacao, ds_biografia, ds_foto, st_ativo
            )
            VALUES (
                :id_user, :id_clinica, :nm_profissional, :ds_email, :nr_telefone,
                :ds_especialidades, :nr_registro_profissional, :nr_anos_experiencia,
                :ds_formacao, :ds_biografia, :ds_foto, TRUE
            )
            RETURNING id_profissional
        """)

        prof_result = await db.execute(create_prof_query, {
            "id_user": id_user,
            "id_clinica": id_clinica,
            "nm_profissional": request.nm_profissional,
            "ds_email": request.ds_email,
            "nr_telefone": request.nr_telefone,
            "ds_especialidades": request.ds_especialidades,
            "nr_registro_profissional": request.nr_registro_profissional,
            "nr_anos_experiencia": request.nr_anos_experiencia,
            "ds_formacao": request.ds_formacao,
            "ds_biografia": request.ds_biografia,
            "ds_foto": request.ds_foto,
        })

        id_profissional = str(prof_result.fetchone()[0])

        # Commit das alterações
        await db.commit()

        # 7. Enviar email com credenciais
        email_enviado = False
        try:
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bem-vindo à Equipe - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                🎉 Bem-vindo à Equipe!
                            </h1>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold;">
                                Olá, {request.nm_profissional}!
                            </h2>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Você foi cadastrado como <strong>profissional</strong> na plataforma DoctorQ.
                            </p>

                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Abaixo estão suas credenciais de acesso temporárias:
                            </p>

                            <!-- Credenciais -->
                            <div style="margin: 24px 0; padding: 24px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                                <h3 style="color: #065f46; margin: 0 0 16px; font-size: 18px;">🔐 Credenciais de Acesso</h3>
                                <table style="width: 100%; color: #065f46;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; width: 140px;">Email:</td>
                                        <td style="padding: 8px 0; font-family: monospace; background-color: #dcfce7; padding: 8px 12px; border-radius: 4px;">{request.ds_email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold;">Senha Temporária:</td>
                                        <td style="padding: 8px 0; font-family: monospace; background-color: #dcfce7; padding: 8px 12px; border-radius: 4px;">{senha_temporaria}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Alerta de segurança -->
                            <div style="margin: 24px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: bold;">
                                    ⚠️ Importante - Segurança:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <li>Esta é uma <strong>senha temporária</strong></li>
                                    <li>Altere sua senha no primeiro acesso</li>
                                    <li>Não compartilhe suas credenciais</li>
                                    <li>Guarde este email em local seguro</li>
                                </ul>
                            </div>

                            <!-- Botão de acesso -->
                            <table role="presentation" style="margin: 24px auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
                                        <a href="{email_service.frontend_url}/login" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Acessar Plataforma
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Após o login, você terá acesso ao sistema de agendamentos, prontuários e todas as ferramentas para gestão da sua agenda profissional.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                                Dúvidas? Entre em contato: <a href="mailto:suporte@doctorq.app" style="color: #8b5cf6;">suporte@doctorq.app</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

            text_body = f"""
DoctorQ - Bem-vindo à Equipe!

Olá, {request.nm_profissional}!

Você foi cadastrado como profissional na plataforma DoctorQ.

CREDENCIAIS DE ACESSO:
- Email: {request.ds_email}
- Senha Temporária: {senha_temporaria}

IMPORTANTE - SEGURANÇA:
- Esta é uma senha temporária
- Altere sua senha no primeiro acesso
- Não compartilhe suas credenciais
- Guarde este email em local seguro

Acesse a plataforma: {email_service.frontend_url}/login

Após o login, você terá acesso ao sistema de agendamentos, prontuários e todas as ferramentas para gestão da sua agenda profissional.

Esta é uma mensagem automática, por favor não responda.
Dúvidas? suporte@doctorq.app

© 2025 DoctorQ. Todos os direitos reservados.
"""

            email_enviado = email_service.send_email(
                to=request.ds_email,
                subject=f"🎉 Bem-vindo à Equipe - DoctorQ",
                html_body=html_body,
                text_body=text_body,
            )

            if not email_enviado:
                logger.warning(f"Falha ao enviar email para {request.ds_email}, mas profissional foi criado")

        except Exception as e:
            logger.error(f"Erro ao enviar email de boas-vindas: {e}")
            # Não falhar a requisição se o email não for enviado

        # 8. Buscar profissional completo para retornar
        profissional_completo = await obter_profissional(id_profissional, current_user, db)

        return ProfissionalComUsuarioResponse(
            profissional=profissional_completo,
            usuario_email=request.ds_email,
            senha_temporaria=senha_temporaria,
            email_enviado=email_enviado,
        )

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar profissional com usuário: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar profissional com usuário: {str(e)}"
        )


# ============================================================================
# BUSCA INTELIGENTE COM IA
# ============================================================================

class LeadBuscaInteligenteRequest(BaseModel):
    """Request para busca inteligente de profissionais baseada em lead do paciente"""
    respostas_lead: dict = Field(..., description="Respostas do questionário de lead do paciente")
    nm_cidade: Optional[str] = Field(None, description="Cidade preferencial")
    nm_estado: Optional[str] = Field(None, description="Estado preferencial")
    limit: Optional[int] = Field(10, description="Número máximo de resultados")


class ProfissionalMatchScore(BaseModel):
    """Profissional com score de compatibilidade"""
    profissional: ProfissionalResponse
    score_compatibilidade: float = Field(..., description="Score de 0.0 a 1.0")
    ds_justificativa: str = Field(..., description="Justificativa do match pela IA")


class BuscaInteligenteResponse(BaseModel):
    """Resposta da busca inteligente"""
    profissionais: List[ProfissionalMatchScore]
    ds_resumo_analise: str = Field(..., description="Resumo da análise feita pela IA")
    total_encontrados: int


@router.post("/busca-inteligente/", response_model=BuscaInteligenteResponse)
async def busca_inteligente_profissionais(
    lead_request: LeadBuscaInteligenteRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Busca inteligente de profissionais usando IA Gisele para matching de leads.

    **Fluxo:**
    1. Recebe respostas do lead do paciente
    2. Busca profissionais ativos no banco
    3. Para cada profissional, busca dados do lead da clínica
    4. Usa IA Gisele para fazer matching semântico
    5. Retorna profissionais ranqueados por compatibilidade

    **Parâmetros:**
    - respostas_lead: Dict com respostas do questionário do paciente
    - nm_cidade: Cidade preferencial (opcional)
    - nm_estado: Estado preferencial (opcional)
    - limit: Máximo de resultados (default: 10)

    **Retorna:**
    - Lista de profissionais com score de compatibilidade
    - Justificativa do match pela IA
    - Resumo da análise
    """
    try:
        from src.services.busca_inteligente_service import BuscaInteligenteService

        # Inicializar service
        service = BuscaInteligenteService(db)

        # Executar busca inteligente
        resultado = await service.buscar_profissionais_com_ia(
            respostas_lead=lead_request.respostas_lead,
            nm_cidade=lead_request.nm_cidade,
            nm_estado=lead_request.nm_estado,
            limit=lead_request.limit
        )

        return resultado

    except Exception as e:
        logger.error(f"Erro na busca inteligente: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao realizar busca inteligente: {str(e)}"
        )
