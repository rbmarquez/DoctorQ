"""
Rotas para gerenciar Clínicas
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user
from src.utils.auth_helpers import validate_empresa_access, get_user_empresa_id

router = APIRouter(prefix="/clinicas", tags=["Clínicas"])

# ============================================================================
# MODELS
# ============================================================================

class ClinicaResponse(BaseModel):
    id_clinica: str
    id_empresa: str
    nm_clinica: str
    nr_cnpj: Optional[str] = None
    ds_descricao: Optional[str] = None
    ds_endereco: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nr_cep: Optional[str] = None
    nr_telefone: Optional[str] = None
    ds_email: Optional[str] = None
    ds_site: Optional[str] = None
    ds_foto_principal: Optional[str] = None
    ds_fotos_galeria: Optional[List[str]] = None
    ds_latitude: Optional[float] = None
    ds_longitude: Optional[float] = None
    ds_horario_funcionamento: Optional[dict] = None
    ds_especialidades: Optional[List[str]] = None
    ds_convenios: Optional[List[str]] = None
    vl_avaliacao_media: Optional[float] = None
    nr_total_avaliacoes: Optional[int] = None
    st_ativa: bool
    st_aceita_agendamento_online: bool
    ds_redes_sociais: Optional[dict] = None
    dt_criacao: datetime
    # Dados relacionados
    nm_empresa: Optional[str] = None
    total_profissionais: Optional[int] = None

    class Config:
        from_attributes = True


class ClinicasResponse(BaseModel):
    items: List[ClinicaResponse]
    meta: dict


class ProfissionalViaClinicaRequest(BaseModel):
    """Model para criar profissional através da clínica"""
    id_user: str
    nm_profissional: str = Field(..., max_length=255)
    ds_especialidades: List[str] = Field(..., min_length=1, description="Ex: ['Dermatologia', 'Estética Facial']")
    ds_bio: Optional[str] = None
    ds_foto_perfil: Optional[str] = None
    ds_formacao: Optional[str] = None
    nr_registro_profissional: Optional[str] = Field(None, max_length=50)
    nr_anos_experiencia: Optional[int] = Field(None, ge=0, le=100)
    ds_telefone: Optional[str] = Field(None, max_length=20)
    ds_email: Optional[str] = Field(None, max_length=255)


class ProfissionalResponse(BaseModel):
    """Response de profissional"""
    id_profissional: str
    id_user: str
    id_clinica: str
    nm_profissional: str
    ds_especialidades: List[str]
    ds_bio: Optional[str] = None
    ds_foto_perfil: Optional[str] = None
    ds_formacao: Optional[str] = None
    nr_registro_profissional: Optional[str] = None
    nr_anos_experiencia: Optional[int] = None
    ds_telefone: Optional[str] = None
    ds_email: Optional[str] = None
    st_ativo: bool
    dt_criacao: datetime


class ClinicaCreateRequest(BaseModel):
    id_empresa: str
    nm_clinica: str = Field(..., max_length=255)
    nr_cnpj: str = Field(..., min_length=11, max_length=18, description="CNPJ da clínica")
    ds_descricao: Optional[str] = None
    ds_endereco: Optional[str] = None
    nm_cidade: Optional[str] = Field(None, max_length=100)
    nm_estado: Optional[str] = Field(None, max_length=2)
    nr_cep: Optional[str] = Field(None, max_length=10)
    nr_telefone: Optional[str] = Field(None, max_length=20)
    ds_email: Optional[str] = Field(None, max_length=255)
    ds_foto_principal: Optional[str] = None
    ds_fotos_galeria: Optional[List[str]] = None
    ds_latitude: Optional[float] = Field(None, ge=-90, le=90)
    ds_longitude: Optional[float] = Field(None, ge=-180, le=180)
    ds_horario_funcionamento: Optional[dict] = Field(
        None,
        description="Ex: {'seg': '08:00-18:00', 'ter': '08:00-18:00', ...}"
    )
    ds_especialidades: Optional[List[str]] = Field(
        None,
        description="Ex: ['Dermatologia', 'Estética Facial', ...]"
    )
    ds_convenios: Optional[List[str]] = Field(
        None,
        description="Ex: ['Unimed', 'Bradesco Saúde', ...]"
    )
    st_aceita_agendamento_online: bool = True
    ds_redes_sociais: Optional[dict] = Field(
        None,
        description="Ex: {'instagram': '@clinica', 'facebook': 'clinica'}"
    )


class ClinicaUpdateRequest(BaseModel):
    nm_clinica: Optional[str] = Field(None, max_length=255)
    nr_cnpj: Optional[str] = Field(None, max_length=18)
    ds_descricao: Optional[str] = None
    ds_endereco: Optional[str] = None
    nm_cidade: Optional[str] = Field(None, max_length=100)
    nm_estado: Optional[str] = Field(None, max_length=2)
    nr_cep: Optional[str] = Field(None, max_length=10)
    nr_telefone: Optional[str] = Field(None, max_length=20)
    ds_email: Optional[str] = Field(None, max_length=255)
    ds_foto_principal: Optional[str] = None
    ds_fotos_galeria: Optional[List[str]] = None
    ds_latitude: Optional[float] = Field(None, ge=-90, le=90)
    ds_longitude: Optional[float] = Field(None, ge=-180, le=180)
    ds_horario_funcionamento: Optional[dict] = None
    ds_especialidades: Optional[List[str]] = None
    ds_convenios: Optional[List[str]] = None
    st_ativa: Optional[bool] = None
    st_aceita_agendamento_online: Optional[bool] = None
    ds_redes_sociais: Optional[dict] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", response_model=ClinicasResponse)
async def listar_clinicas(
    id_empresa: Optional[str] = Query(None, description="UUID da empresa (obrigatório para Admin)"),
    ds_cidade: Optional[str] = Query(None),
    ds_estado: Optional[str] = Query(None),
    ds_especialidade: Optional[str] = Query(None),
    st_ativa: Optional[bool] = Query(None),
    busca: Optional[str] = Query(None, description="Buscar por nome ou descrição"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista clínicas com filtros e paginação.

    - Admin pode filtrar por qualquer empresa passando id_empresa
    - Outros usuários verão apenas clínicas de sua própria empresa
    """
    try:
        # WHERE conditions
        where_clauses = ["c.st_ativo = TRUE"]

        # Determinar qual empresa filtrar
        empresa_filtro = id_empresa if id_empresa else current_user.id_empresa

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas clínicas da empresa do usuário logado ou especificada
        if not empresa_filtro:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada. Entre em contato com o suporte."
            )
        where_clauses.append("c.id_empresa = :id_empresa")

        if ds_cidade:
            where_clauses.append("c.nm_cidade ILIKE :cidade")

        if ds_estado:
            where_clauses.append("c.nm_estado = :estado")

        if ds_especialidade:
            where_clauses.append("c.ds_especialidades @> ARRAY[:especialidade]::text[]")

        if st_ativa is not None:
            where_clauses.append("c.st_ativo = :st_ativa")

        if busca:
            where_clauses.append(
                "(c.nm_clinica ILIKE :busca OR c.ds_clinica ILIKE :busca)"
            )

        where_clause = " AND ".join(where_clauses)

        # Count total
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_clinicas c
            WHERE {where_clause}
        """)

        # Query principal com LATERAL para contar profissionais
        query = text(f"""
            SELECT
                c.id_clinica::text,
                c.id_empresa::text,
                c.nm_clinica,
                c.nr_cnpj,
                c.ds_clinica as ds_descricao,
                c.ds_endereco,
                c.nm_cidade as ds_cidade,
                c.nm_estado as ds_estado,
                c.nr_cep as ds_cep,
                c.nr_telefone as ds_telefone,
                c.ds_email,
                NULL as ds_site,
                c.ds_foto_principal,
                c.ds_fotos_galeria,
                c.ds_latitude as nr_latitude,
                c.ds_longitude as nr_longitude,
                c.ds_horario_funcionamento,
                c.ds_especialidades,
                c.ds_convenios,
                c.nr_avaliacao_media as vl_avaliacao_media,
                c.nr_total_avaliacoes,
                c.st_ativo as st_ativa,
                FALSE as st_aceita_agendamento_online,
                NULL::jsonb as ds_redes_sociais,
                c.dt_criacao,
                e.nm_empresa,
                prof.total as total_profissionais
            FROM tb_clinicas c
            LEFT JOIN tb_empresas e ON c.id_empresa = e.id_empresa
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as total
                FROM tb_profissionais p
                WHERE p.id_clinica = c.id_clinica AND p.st_ativo = TRUE
            ) prof ON TRUE
            WHERE {where_clause}
            ORDER BY c.dt_criacao DESC
            LIMIT :limit OFFSET :offset
        """)

        # Parâmetros
        params = {
            "limit": size,
            "offset": (page - 1) * size,
            "id_empresa": str(empresa_filtro)
        }

        if ds_cidade:
            params["cidade"] = f"%{ds_cidade}%"

        if ds_estado:
            params["estado"] = ds_estado

        if ds_especialidade:
            params["especialidade"] = ds_especialidade

        if st_ativa is not None:
            params["st_ativa"] = st_ativa

        if busca:
            params["busca"] = f"%{busca}%"

        # Executar queries
        count_result = await db.execute(count_query, params)
        total = count_result.scalar()

        result = await db.execute(query, params)
        rows = result.fetchall()

        # Montar resposta
        clinicas = []
        for row in rows:
            clinicas.append(ClinicaResponse(
                id_clinica=row.id_clinica,
                id_empresa=row.id_empresa,
                nm_clinica=row.nm_clinica,
                ds_descricao=row.ds_descricao,
                ds_endereco=row.ds_endereco,
                ds_cidade=row.ds_cidade,
                ds_estado=row.ds_estado,
                ds_cep=row.ds_cep,
                ds_telefone=row.ds_telefone,
                ds_email=row.ds_email,
                ds_site=row.ds_site,
                ds_foto_principal=row.ds_foto_principal,
                ds_fotos_galeria=row.ds_fotos_galeria,
                nr_latitude=float(row.nr_latitude) if row.nr_latitude else None,
                nr_longitude=float(row.nr_longitude) if row.nr_longitude else None,
                ds_horario_funcionamento=row.ds_horario_funcionamento,
                ds_especialidades=row.ds_especialidades,
                ds_convenios=row.ds_convenios,
                vl_avaliacao_media=float(row.vl_avaliacao_media) if row.vl_avaliacao_media else None,
                nr_total_avaliacoes=row.nr_total_avaliacoes,
                st_ativa=row.st_ativa,
                st_aceita_agendamento_online=row.st_aceita_agendamento_online,
                ds_redes_sociais=row.ds_redes_sociais,
                dt_criacao=row.dt_criacao,
                nm_empresa=row.nm_empresa,
                total_profissionais=row.total_profissionais,
            ))

        return ClinicasResponse(
            items=clinicas,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar clínicas: {str(e)}")


@router.get("/{id_clinica}/", response_model=ClinicaResponse)
async def obter_clinica(
    id_clinica: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna uma clínica específica.
    - Admin pode ver qualquer clínica
    - Outros usuários veem apenas clínicas da própria empresa
    """
    try:
        # Admin pode ver qualquer clínica, outros apenas da própria empresa
        where_clauses = ["c.id_clinica = :id_clinica", "c.st_ativo = TRUE"]
        params = {"id_clinica": id_clinica}

        # Se não é admin, filtrar por empresa
        if current_user.id_empresa:
            where_clauses.append("c.id_empresa = :id_empresa")
            params["id_empresa"] = str(current_user.id_empresa)

        where_clause = " AND ".join(where_clauses)

        query = text(f"""
            SELECT
                c.id_clinica,
                c.id_empresa,
                c.nm_clinica,
                c.nr_cnpj,
                c.ds_clinica as ds_descricao,
                c.ds_endereco,
                c.nm_cidade as ds_cidade,
                c.nm_estado as ds_estado,
                c.nr_cep as ds_cep,
                c.nr_telefone as ds_telefone,
                c.ds_email,
                '' as ds_site,
                c.ds_foto_principal,
                c.ds_fotos_galeria,
                c.ds_latitude as nr_latitude,
                c.ds_longitude as nr_longitude,
                c.ds_horario_funcionamento,
                c.ds_especialidades,
                c.ds_convenios,
                c.nr_avaliacao_media as vl_avaliacao_media,
                c.nr_total_avaliacoes,
                c.st_ativo as st_ativa,
                false as st_aceita_agendamento_online,
                '{{}}'::jsonb as ds_redes_sociais,
                c.dt_criacao,
                e.nm_empresa as nm_empresa,
                prof.total as total_profissionais
            FROM tb_clinicas c
            LEFT JOIN tb_empresas e ON c.id_empresa = e.id_empresa
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as total
                FROM tb_profissionais_clinicas pc
                INNER JOIN tb_profissionais p ON pc.id_profissional = p.id_profissional
                WHERE pc.id_clinica = c.id_clinica AND p.st_ativo = TRUE
            ) prof ON TRUE
            WHERE {where_clause}
        """)

        result = await db.execute(query, params)
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Clínica não encontrada")

        return ClinicaResponse(
            id_clinica=str(row.id_clinica),
            id_empresa=str(row.id_empresa) if row.id_empresa else None,
            nm_clinica=row.nm_clinica,
            nr_cnpj=row.nr_cnpj,
            ds_descricao=row.ds_descricao,
            ds_endereco=row.ds_endereco,
            nm_cidade=row.ds_cidade,
            nm_estado=row.ds_estado,
            nr_cep=row.ds_cep,
            nr_telefone=row.ds_telefone,
            ds_email=row.ds_email,
            ds_site=row.ds_site,
            ds_foto_principal=row.ds_foto_principal,
            ds_fotos_galeria=row.ds_fotos_galeria,
            ds_latitude=float(row.nr_latitude) if row.nr_latitude else None,
            ds_longitude=float(row.nr_longitude) if row.nr_longitude else None,
            ds_horario_funcionamento=row.ds_horario_funcionamento,
            ds_especialidades=row.ds_especialidades,
            ds_convenios=row.ds_convenios,
            vl_avaliacao_media=float(row.vl_avaliacao_media) if row.vl_avaliacao_media else None,
            nr_total_avaliacoes=row.nr_total_avaliacoes,
            st_ativa=row.st_ativa,
            st_aceita_agendamento_online=row.st_aceita_agendamento_online,
            ds_redes_sociais=row.ds_redes_sociais,
            dt_criacao=row.dt_criacao,
            nm_empresa=row.nm_empresa,
            total_profissionais=row.total_profissionais,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter clínica: {str(e)}")


@router.post("/", response_model=ClinicaResponse)  # ✅ Já tem trailing slash
async def criar_clinica(
    request: ClinicaCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria uma nova clínica.
    """
    try:
        # 🔒 SEGURANÇA: Validar que o usuário só pode criar clínicas para sua própria empresa
        id_empresa_user = current_user.id_empresa

        if str(request.id_empresa) != str(id_empresa_user):
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para criar clínicas para outra empresa"
            )

        query = text("""
            INSERT INTO tb_clinicas (
                id_empresa, nm_clinica, nr_cnpj, ds_clinica, ds_endereco,
                nm_cidade, nm_estado, nr_cep, nr_telefone, ds_email,
                ds_foto_principal, ds_fotos_galeria, ds_latitude, ds_longitude,
                ds_horario_funcionamento, ds_especialidades, ds_convenios
            )
            VALUES (
                :id_empresa, :nm_clinica, :nr_cnpj, :ds_descricao, :ds_endereco,
                :ds_cidade, :ds_estado, :ds_cep, :ds_telefone, :ds_email,
                :ds_foto_principal, :ds_fotos_galeria, :nr_latitude, :nr_longitude,
                :ds_horario_funcionamento, :ds_especialidades, :ds_convenios
            )
            RETURNING id_clinica
        """)

        result = await db.execute(query, {
            "id_empresa": request.id_empresa,
            "nm_clinica": request.nm_clinica,
            "nr_cnpj": request.nr_cnpj,
            "ds_descricao": request.ds_descricao,
            "ds_endereco": request.ds_endereco,
            "ds_cidade": request.nm_cidade,
            "ds_estado": request.nm_estado,
            "ds_cep": request.nr_cep,
            "ds_telefone": request.nr_telefone,
            "ds_email": request.ds_email,
            "ds_foto_principal": request.ds_foto_principal,
            "ds_fotos_galeria": request.ds_fotos_galeria,
            "nr_latitude": request.ds_latitude,
            "nr_longitude": request.ds_longitude,
            "ds_horario_funcionamento": request.ds_horario_funcionamento,
            "ds_especialidades": request.ds_especialidades,
            "ds_convenios": request.ds_convenios,
        })

        await db.commit()

        id_clinica = result.fetchone()[0]

        # Retornar clínica criada
        return await obter_clinica(id_clinica, current_user, db)

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        error_msg = str(e)
        # Tratar erro de CNPJ duplicado
        if "uk_clinicas_cnpj" in error_msg or "duplicate key" in error_msg.lower():
            raise HTTPException(status_code=409, detail="CNPJ já cadastrado para outra clínica")
        raise HTTPException(status_code=500, detail=f"Erro ao criar clínica: {error_msg}")


@router.put("/{id_clinica}/", response_model=ClinicaResponse)
async def atualizar_clinica(
    id_clinica: str,
    request: ClinicaUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza uma clínica existente.
    """
    try:
        # 🔒 SEGURANÇA: Verificar se clínica existe e pertence à empresa do usuário
        id_empresa_user = current_user.id_empresa

        check_query = text("""
            SELECT id_empresa FROM tb_clinicas
            WHERE id_clinica = :id_clinica AND st_ativo = TRUE
        """)
        check_result = await db.execute(check_query, {"id_clinica": id_clinica})
        clinica_row = check_result.fetchone()

        if not clinica_row:
            raise HTTPException(status_code=404, detail="Clínica não encontrada")

        if str(clinica_row[0]) != str(id_empresa_user):
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para atualizar esta clínica"
            )

        # Construir SET clauses dinamicamente com mapeamento de campos
        field_mapping = {
            "nm_clinica": "nm_clinica",
            "nr_cnpj": "nr_cnpj",
            "ds_descricao": "ds_clinica",
            "ds_endereco": "ds_endereco",
            "nm_cidade": "nm_cidade",
            "nm_estado": "nm_estado",
            "nr_cep": "nr_cep",
            "nr_telefone": "nr_telefone",
            "ds_email": "ds_email",
            "ds_foto_principal": "ds_foto_principal",
            "ds_fotos_galeria": "ds_fotos_galeria",
            "ds_latitude": "ds_latitude",
            "ds_longitude": "ds_longitude",
            "ds_horario_funcionamento": "ds_horario_funcionamento",
            "ds_especialidades": "ds_especialidades",
            "ds_convenios": "ds_convenios",
            "st_ativa": "st_ativo"
        }

        set_clauses = []
        params = {"id_clinica": id_clinica, "dt_atualizacao": datetime.now()}

        for field, value in request.model_dump(exclude_unset=True).items():
            if field in field_mapping:
                db_field = field_mapping[field]
                set_clauses.append(f"{db_field} = :{field}")
                params[field] = value

        if not set_clauses:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

        set_clauses.append("dt_atualizacao = :dt_atualizacao")

        update_query = text(f"""
            UPDATE tb_clinicas
            SET {", ".join(set_clauses)}
            WHERE id_clinica = :id_clinica
        """)

        await db.execute(update_query, params)
        await db.commit()

        return await obter_clinica(id_clinica, current_user, db)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar clínica: {str(e)}")


@router.delete("/{id_clinica}/")
async def deletar_clinica(
    id_clinica: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deleta (soft delete) uma clínica.
    """
    try:
        # 🔒 SEGURANÇA: Validar que a clínica pertence à empresa do usuário
        id_empresa_user = current_user.id_empresa

        query = text("""
            UPDATE tb_clinicas
            SET st_ativo = FALSE, dt_atualizacao = :dt_atualizacao
            WHERE id_clinica = :id_clinica
              AND st_ativo = TRUE
              AND id_empresa = :id_empresa
            RETURNING id_clinica
        """)

        result = await db.execute(query, {
            "id_clinica": id_clinica,
            "dt_atualizacao": datetime.now(),
            "id_empresa": str(id_empresa_user)
        })

        if not result.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Clínica não encontrada ou você não tem permissão para deletá-la"
            )

        await db.commit()

        return {"message": "Clínica deletada com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao deletar clínica: {str(e)}")


@router.get("/{id_clinica}/profissionais/", response_model=dict)
async def listar_profissionais_clinica(
    id_clinica: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista profissionais de uma clínica.
    """
    try:
        # ⚠️ FILTRO OBRIGATÓRIO: Verificar que a clínica pertence à empresa do usuário
        clinica_query = text("""
            SELECT id_empresa FROM tb_clinicas
            WHERE id_clinica = :id_clinica
                AND st_ativo = TRUE
                AND id_empresa = :id_empresa
        """)
        clinica_result = await db.execute(clinica_query, {
            "id_clinica": id_clinica,
            "id_empresa": str(current_user.id_empresa)
        })
        clinica = clinica_result.fetchone()

        if not clinica:
            raise HTTPException(status_code=404, detail="Clínica não encontrada")

        id_empresa = clinica.id_empresa

        # Contar profissionais
        count_query = text("""
            SELECT COUNT(*)
            FROM tb_profissionais
            WHERE id_empresa = :id_empresa AND st_deletado = FALSE
        """)
        count_result = await db.execute(count_query, {"id_empresa": id_empresa})
        total = count_result.scalar()

        # Buscar profissionais
        query = text("""
            SELECT
                p.id_profissional,
                p.nm_profissional,
                p.ds_especialidades,
                p.ds_foto_perfil,
                p.vl_avaliacao_media,
                p.nr_total_avaliacoes,
                p.st_ativo,
                p.st_aceita_novos_pacientes
            FROM tb_profissionais p
            WHERE p.id_empresa = :id_empresa AND p.st_deletado = FALSE
            ORDER BY p.nm_profissional ASC
            LIMIT :limit OFFSET :offset
        """)

        result = await db.execute(query, {
            "id_empresa": id_empresa,
            "limit": size,
            "offset": (page - 1) * size
        })
        rows = result.fetchall()

        profissionais = []
        for row in rows:
            profissionais.append({
                "id_profissional": row.id_profissional,
                "nm_profissional": row.nm_profissional,
                "ds_especialidades": row.ds_especialidades,
                "ds_foto_perfil": row.ds_foto_perfil,
                "vl_avaliacao_media": float(row.vl_avaliacao_media) if row.vl_avaliacao_media else None,
                "nr_total_avaliacoes": row.nr_total_avaliacoes,
                "st_ativo": row.st_ativo,
                "st_aceita_novos_pacientes": row.st_aceita_novos_pacientes,
            })

        return {
            "items": profissionais,
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
        raise HTTPException(status_code=500, detail=f"Erro ao listar profissionais: {str(e)}")


@router.post("/{id_clinica}/profissionais/", response_model=ProfissionalResponse, status_code=201)
async def criar_profissional_via_clinica(
    id_clinica: UUID = Path(..., description="UUID da clínica"),
    request: ProfissionalViaClinicaRequest = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cria um novo profissional vinculado a uma clínica específica.

    Esta é uma forma alternativa de cadastrar profissionais, mais RESTful,
    onde o profissional é criado no contexto de uma clínica.
    """
    try:
        # 🔒 SEGURANÇA: Verificar que a clínica pertence à empresa do usuário
        clinica_query = text("""
            SELECT id_empresa FROM tb_clinicas
            WHERE id_clinica = :id_clinica
              AND st_ativo = TRUE
              AND id_empresa = :id_empresa
        """)
        clinica_result = await db.execute(clinica_query, {
            "id_clinica": str(id_clinica),
            "id_empresa": str(current_user.id_empresa)
        })
        clinica = clinica_result.fetchone()

        if not clinica:
            raise HTTPException(
                status_code=404,
                detail="Clínica não encontrada ou você não tem permissão para acessá-la"
            )

        # Criar profissional
        query = text("""
            INSERT INTO tb_profissionais (
                id_user, id_clinica, nm_profissional, ds_especialidades,
                ds_biografia, ds_foto, ds_formacao, nr_registro_profissional,
                nr_anos_experiencia, nr_telefone, ds_email
            )
            VALUES (
                :id_user, :id_clinica, :nm_profissional, :ds_especialidades,
                :ds_biografia, :ds_foto, :ds_formacao, :nr_registro_profissional,
                :nr_anos_experiencia, :nr_telefone, :ds_email
            )
            RETURNING id_profissional, dt_criacao, st_ativo
        """)

        result = await db.execute(query, {
            "id_user": UUID(request.id_user),
            "id_clinica": id_clinica,
            "nm_profissional": request.nm_profissional,
            "ds_especialidades": request.ds_especialidades,
            "ds_biografia": request.ds_bio,
            "ds_foto": request.ds_foto_perfil,
            "ds_formacao": request.ds_formacao,
            "nr_registro_profissional": request.nr_registro_profissional,
            "nr_anos_experiencia": request.nr_anos_experiencia,
            "nr_telefone": request.ds_telefone,
            "ds_email": request.ds_email,
        })

        await db.commit()
        row = result.fetchone()

        return ProfissionalResponse(
            id_profissional=str(row.id_profissional),
            id_user=request.id_user,
            id_clinica=str(id_clinica),
            nm_profissional=request.nm_profissional,
            ds_especialidades=request.ds_especialidades,
            ds_bio=request.ds_bio,
            ds_foto_perfil=request.ds_foto_perfil,
            ds_formacao=request.ds_formacao,
            nr_registro_profissional=request.nr_registro_profissional,
            nr_anos_experiencia=request.nr_anos_experiencia,
            ds_telefone=request.ds_telefone,
            ds_email=request.ds_email,
            st_ativo=row.st_ativo,
            dt_criacao=row.dt_criacao,
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar profissional: {str(e)}")
