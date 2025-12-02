"""
Rotas de Pacientes - UC030
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.paciente import (
    PacienteCreate,
    PacienteUpdate,
    PacienteResponse,
    PacienteListResponse
)
from src.models.user import User
from src.services.paciente_service import PacienteService
from src.utils.auth_helpers import get_user_empresa_id, get_user_profissional_id, get_user_role

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.post("/", response_model=PacienteResponse, status_code=status.HTTP_201_CREATED)
async def criar_paciente(
    request: Request,
    data: PacienteCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Cria um novo paciente

    **Permissões:** Qualquer usuário autenticado (JWT ou API Key)

    **Lógica de Vínculo (atualizada 2025-11-11):**
    - **Profissional cadastra**: Paciente vinculado ao profissional (id_profissional) + clínica do profissional
    - **Usuário da clínica cadastra**: Paciente vinculado apenas à clínica (id_clinica)

    **Detecção automática:**
    1. Backend verifica se usuário é profissional (existe em tb_profissionais)
    2. Se SIM: define id_profissional e pega id_clinica do profissional
    3. Se NÃO: define apenas id_clinica (da empresa)

    **Regras:**
    - CPF deve ser único
    - Validação de CPF
    """
    # Validar autenticação (JWT ou API Key)
    id_empresa = get_user_empresa_id(request)

    # Detectar se usuário é profissional
    id_profissional = await get_user_profissional_id(request, db)

    # Aplicar regra de vínculo
    if id_profissional:
        # Usuário É profissional: vincular paciente ao profissional
        data.id_profissional = id_profissional

        # Buscar clínica do profissional (primeira clínica ou clínica principal)
        from sqlalchemy import select
        from src.models.profissionais_orm import ProfissionalORM
        from src.models.profissional_clinica_orm import ProfissionalClinicaORM

        # Tentar pegar clínica principal do profissional
        profissional_query = select(ProfissionalORM).where(ProfissionalORM.id_profissional == id_profissional)
        profissional_result = await db.execute(profissional_query)
        profissional = profissional_result.scalar_one_or_none()

        if profissional and profissional.id_clinica:
            data.id_clinica = profissional.id_clinica
        else:
            # Se não tem clínica principal, pegar primeira clínica do relacionamento
            clinica_query = select(ProfissionalClinicaORM.id_clinica).where(
                ProfissionalClinicaORM.id_profissional == id_profissional,
                ProfissionalClinicaORM.st_ativo == True
            ).limit(1)
            clinica_result = await db.execute(clinica_query)
            id_clinica_profissional = clinica_result.scalar_one_or_none()

            if id_clinica_profissional:
                data.id_clinica = id_clinica_profissional
    else:
        # Usuário NÃO é profissional: vincular apenas à clínica
        data.id_profissional = None

        # Se não passou id_clinica, buscar primeira clínica da empresa
        if not data.id_clinica:
            from sqlalchemy import select
            from src.models.clinica_orm import ClinicaORM

            clinica_query = select(ClinicaORM.id_clinica).where(
                ClinicaORM.id_empresa == id_empresa,
                ClinicaORM.st_ativo == True
            ).limit(1)
            clinica_result = await db.execute(clinica_query)
            id_clinica_empresa = clinica_result.scalar_one_or_none()

            if id_clinica_empresa:
                data.id_clinica = id_clinica_empresa

    try:
        paciente = await PacienteService.criar_paciente(db=db, data=data)
        return PacienteResponse.model_validate(paciente)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar paciente: {str(e)}"
        )


@router.get("/", response_model=PacienteListResponse)
async def listar_pacientes(
    request: Request,
    id_clinica: Optional[UUID] = Query(None, description="Filtrar por clínica"),
    busca: Optional[str] = Query(None, description="Buscar por nome, email, CPF ou telefone"),
    apenas_ativos: bool = Query(True, description="Apenas pacientes ativos"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista pacientes com filtros (automático por perfil)

    **Permissões:** Qualquer usuário autenticado (JWT ou API Key)

    **Lógica de Filtragem:**
    - **Profissional**: Retorna pacientes vinculados ao profissional
    - **Admin/Gestor**: Retorna todos os pacientes da empresa (via clínicas)
    - Se `id_clinica` for passado, sobrescreve o filtro automático

    **Filtros:**
    - id_clinica: Filtrar por clínica (opcional, sobrescreve filtro automático)
    - busca: Buscar por nome, email, CPF ou telefone
    - apenas_ativos: Mostrar apenas ativos
    """
    # Validar autenticação (JWT ou API Key)
    id_empresa = get_user_empresa_id(request)

    # Detectar perfil do usuário e aplicar filtro apropriado
    id_profissional = await get_user_profissional_id(request, db)

    # Se não foi passado id_clinica explicitamente, usar lógica automática
    filtro_clinica = id_clinica
    filtro_profissional = None
    filtro_empresa = None

    if not id_clinica:
        # Filtro automático baseado no perfil
        if id_profissional:
            # Usuário é profissional: filtrar por id_profissional
            filtro_profissional = id_profissional
        else:
            # Usuário NÃO é profissional (admin/gestor): filtrar por id_empresa
            # Isso irá buscar todas as clínicas da empresa e retornar pacientes dessas clínicas
            filtro_empresa = id_empresa

    pacientes, total = await PacienteService.listar_pacientes(
        db=db,
        id_clinica=filtro_clinica,
        id_profissional=filtro_profissional,
        id_empresa=filtro_empresa,
        busca=busca,
        apenas_ativos=apenas_ativos,
        page=page,
        size=size
    )

    items = [PacienteResponse.model_validate(p) for p in pacientes]

    return PacienteListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/{id_paciente}/", response_model=PacienteResponse)
async def buscar_paciente(
    id_paciente: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca paciente por ID

    **Permissões:** Qualquer usuário autenticado
    """
    paciente = await PacienteService.buscar_paciente_por_id(db=db, id_paciente=id_paciente)

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    return PacienteResponse.model_validate(paciente)


@router.get("/cpf/{cpf}/", response_model=PacienteResponse)
async def buscar_paciente_por_cpf(
    cpf: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista", "profissional"]))
):
    """
    Busca paciente por CPF

    **Permissões:** admin, gestor_clinica, recepcionista, profissional
    """
    paciente = await PacienteService.buscar_por_cpf(db=db, cpf=cpf)

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado com este CPF"
        )

    return PacienteResponse.model_validate(paciente)


@router.put("/{id_paciente}/", response_model=PacienteResponse)
async def atualizar_paciente(
    request: Request,
    id_paciente: UUID,
    data: PacienteUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Atualiza um paciente

    **Permissões:** Qualquer usuário autenticado (JWT ou API Key)

    **Regras:**
    - CPF deve ser único
    """
    # Validar autenticação (JWT ou API Key)
    _ = get_user_empresa_id(request)
    try:
        paciente = await PacienteService.atualizar_paciente(
            db=db,
            id_paciente=id_paciente,
            data=data
        )

        if not paciente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paciente não encontrado"
            )

        return PacienteResponse.model_validate(paciente)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar paciente: {str(e)}"
        )


@router.delete("/{id_paciente}/", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_paciente(
    id_paciente: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Desativa um paciente (soft delete)

    **Permissões:** admin, gestor_clinica

    **Regras:**
    - Não remove dados, apenas marca como inativo (LGPD)
    """
    paciente = await PacienteService.desativar_paciente(db=db, id_paciente=id_paciente)

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    return None


@router.post("/{id_paciente}/reativar/", response_model=PacienteResponse)
async def reativar_paciente(
    id_paciente: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Reativa um paciente inativo

    **Permissões:** admin, gestor_clinica
    """
    paciente = await PacienteService.reativar_paciente(db=db, id_paciente=id_paciente)

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    return PacienteResponse.model_validate(paciente)
