# src/routes/profissional_consolidacao_route.py
"""
Rotas para consolidação de dados de profissionais multi-clínica.

Endpoints:
- GET /profissionais/{id_profissional}/clinicas/ - Listar clínicas onde trabalha
- GET /profissionais/{id_profissional}/agendas/consolidadas/ - Agendas de todas as clínicas
- GET /profissionais/{id_profissional}/pacientes/ - Pacientes de todas as clínicas
- GET /profissionais/{id_profissional}/estatisticas/ - Estatísticas consolidadas
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.services.profissional_consolidacao_service import ProfissionalConsolidacaoService
from src.middleware.apikey_auth import get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/profissionais", tags=["profissionais", "consolidacao"])


# ==========================================
# SCHEMAS PYDANTIC
# ==========================================


class ClinicaVinculoResponse(BaseModel):
    """Schema para resposta de vínculo com clínica"""

    id_vinculo: str
    id_clinica: str
    nm_clinica: str
    nm_cidade: Optional[str]
    nm_estado: Optional[str]
    ds_endereco: Optional[str]
    nr_telefone: Optional[str]
    dt_vinculo: Optional[str]
    dt_desvinculo: Optional[str]
    st_ativo: bool
    ds_observacoes: Optional[str]


class AgendamentoConsolidadoResponse(BaseModel):
    """Schema para agendamento consolidado"""

    id_agendamento: str
    dt_agendamento: str
    nr_duracao_minutos: int
    ds_status: Optional[str]
    ds_motivo: Optional[str]
    st_confirmado: Optional[bool]
    vl_valor: Optional[float]
    st_pago: Optional[bool]
    clinica: Optional[dict]
    paciente: Optional[dict]


class AgendamentoConsolidadoPaginatedResponse(BaseModel):
    """Schema para resposta paginada de agendamentos consolidados"""

    items: List[AgendamentoConsolidadoResponse]
    total: int = Field(..., description="Total de registros")
    page: int = Field(..., description="Página atual")
    size: int = Field(..., description="Tamanho da página")
    pages: int = Field(..., description="Total de páginas")


class PacienteConsolidadoResponse(BaseModel):
    """Schema para paciente consolidado"""

    id_paciente: str
    nm_paciente: str
    ds_email: Optional[str]
    nr_telefone: Optional[str]
    dt_nascimento: Optional[str]
    qt_agendamentos_total: int
    clinicas_atendimento: List[str]


class PacienteConsolidadoPaginatedResponse(BaseModel):
    """Schema para resposta paginada de pacientes consolidados"""

    items: List[PacienteConsolidadoResponse]
    total: int = Field(..., description="Total de registros")
    page: int = Field(..., description="Página atual")
    size: int = Field(..., description="Tamanho da página")
    pages: int = Field(..., description="Total de páginas")


class EstatisticasResponse(BaseModel):
    """Schema para estatísticas do profissional"""

    qt_clinicas_ativas: int
    qt_pacientes_total: int
    qt_agendamentos_mes_atual: int


class ProntuarioConsolidadoResponse(BaseModel):
    """Schema para prontuário consolidado"""

    id_prontuario: str
    dt_consulta: Optional[str]
    ds_tipo: Optional[str]
    ds_queixa_principal: Optional[str]
    ds_diagnostico: Optional[str]
    ds_procedimentos_realizados: Optional[str]
    dt_retorno_sugerido: Optional[str]
    dt_assinatura: Optional[str]
    clinica: Optional[dict]
    paciente: Optional[dict]


class ProntuarioConsolidadoPaginatedResponse(BaseModel):
    """Schema para resposta paginada de prontuários consolidados"""

    items: List[ProntuarioConsolidadoResponse]
    total: int = Field(..., description="Total de registros")
    page: int = Field(..., description="Página atual")
    size: int = Field(..., description="Tamanho da página")
    pages: int = Field(..., description="Total de páginas")


# ==========================================
# DEPENDENCY INJECTION
# ==========================================


async def get_consolidacao_service(
    db: AsyncSession = Depends(get_db),
) -> ProfissionalConsolidacaoService:
    """Dependency injection para ProfissionalConsolidacaoService"""
    return ProfissionalConsolidacaoService(db)


# ==========================================
# ENDPOINTS
# ==========================================


@router.get(
    "/{id_profissional}/clinicas/",
    response_model=List[ClinicaVinculoResponse],
    summary="Listar clínicas do profissional",
    description="""
    Lista todas as clínicas onde o profissional trabalha.

    **Retorna**:
    - Lista de clínicas com informações de vínculo
    - Status do vínculo (ativo/inativo)
    - Datas de vínculo e desvínculo
    """,
)
async def listar_clinicas_profissional(
    id_profissional: str,
    apenas_ativas: bool = Query(True, description="Retornar apenas vínculos ativos"),
    consolidacao_service: ProfissionalConsolidacaoService = Depends(
        get_consolidacao_service
    ),
    request: Request = None,
):
    """Listar clínicas onde o profissional trabalha"""
    try:
        # Validar usuário autenticado
        current_user = get_current_user(request)
        id_usuario = uuid.UUID(current_user["uid"])
        id_prof_uuid = uuid.UUID(id_profissional)

        # Validar acesso
        tem_acesso = await consolidacao_service.validar_acesso_profissional(
            id_usuario, id_prof_uuid
        )
        if not tem_acesso:
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar dados deste profissional",
            )

        # Listar clínicas
        clinicas = await consolidacao_service.listar_clinicas_profissional(
            id_prof_uuid, apenas_ativas
        )

        logger.info(
            f"Listadas {len(clinicas)} clínicas (profissional: {id_profissional})"
        )

        return clinicas

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar clínicas do profissional: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get(
    "/{id_profissional}/agendas/consolidadas/",
    response_model=AgendamentoConsolidadoPaginatedResponse,
    summary="Listar agendas consolidadas",
    description="""
    Lista agendamentos consolidados de todas as clínicas onde o profissional trabalha.

    **Paginação**:
    - page: Número da página (default: 1)
    - size: Tamanho da página (default: 50, max: 100)

    **Filtros**:
    - dt_inicio: Data inicial (default: hoje)
    - dt_fim: Data final (default: +30 dias)
    - status: Filtrar por status (agendado, confirmado, cancelado, etc.)

    **Cache**:
    - TTL: 5 minutos (300 segundos)
    - Chave baseada em: profissional, período, status, página

    **Retorna**:
    - Lista de agendamentos com informações da clínica e paciente
    - Ordenação: Data/hora do agendamento (ascendente)
    - Metadados de paginação (total, page, size, pages)
    """,
)
async def listar_agendas_consolidadas(
    id_profissional: str,
    dt_inicio: Optional[datetime] = Query(None, description="Data inicial (ISO 8601)"),
    dt_fim: Optional[datetime] = Query(None, description="Data final (ISO 8601)"),
    status: Optional[str] = Query(
        None, description="Filtrar por status (agendado, confirmado, etc.)"
    ),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página (max: 100)"),
    consolidacao_service: ProfissionalConsolidacaoService = Depends(
        get_consolidacao_service
    ),
    request: Request = None,
):
    """Listar agendas consolidadas de todas as clínicas (com paginação e cache)"""
    try:
        # Validar usuário autenticado
        current_user = get_current_user(request)
        id_usuario = uuid.UUID(current_user["uid"])
        id_prof_uuid = uuid.UUID(id_profissional)

        # Validar acesso
        tem_acesso = await consolidacao_service.validar_acesso_profissional(
            id_usuario, id_prof_uuid
        )
        if not tem_acesso:
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar dados deste profissional",
            )

        # Listar agendamentos (retorna tupla: items, total)
        agendamentos, total = await consolidacao_service.listar_agendas_consolidadas(
            id_prof_uuid, dt_inicio, dt_fim, status, page, size
        )

        # Calcular total de páginas
        pages = (total + size - 1) // size  # Ceiling division

        logger.info(
            f"Listados {len(agendamentos)}/{total} agendamentos consolidados "
            f"(profissional: {id_profissional}, página: {page}/{pages})"
        )

        return AgendamentoConsolidadoPaginatedResponse(
            items=agendamentos,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar agendas consolidadas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get(
    "/{id_profissional}/pacientes/",
    response_model=PacienteConsolidadoPaginatedResponse,
    summary="Listar pacientes consolidados",
    description="""
    Lista todos os pacientes únicos que o profissional já atendeu
    em todas as clínicas.

    **Paginação**:
    - page: Número da página (default: 1)
    - size: Tamanho da página (default: 50, max: 100)

    **Filtros**:
    - search: Buscar por nome ou email do paciente

    **Retorna**:
    - Lista de pacientes únicos
    - Contagem total de agendamentos por paciente
    - Lista de clínicas onde o paciente foi atendido
    - Ordenação: Último agendamento (descendente)
    - Metadados de paginação (total, page, size, pages)
    """,
)
async def listar_pacientes_consolidados(
    id_profissional: str,
    search: Optional[str] = Query(None, description="Buscar por nome ou email"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página (max: 100)"),
    consolidacao_service: ProfissionalConsolidacaoService = Depends(
        get_consolidacao_service
    ),
    request: Request = None,
):
    """Listar pacientes consolidados de todas as clínicas (com paginação)"""
    try:
        # Validar usuário autenticado
        current_user = get_current_user(request)
        id_usuario = uuid.UUID(current_user["uid"])
        id_prof_uuid = uuid.UUID(id_profissional)

        # Validar acesso
        tem_acesso = await consolidacao_service.validar_acesso_profissional(
            id_usuario, id_prof_uuid
        )
        if not tem_acesso:
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar dados deste profissional",
            )

        # Listar pacientes (retorna tupla: items, total)
        pacientes, total = await consolidacao_service.listar_pacientes_consolidados(
            id_prof_uuid, search, page, size
        )

        # Calcular total de páginas
        pages = (total + size - 1) // size  # Ceiling division

        logger.info(
            f"Listados {len(pacientes)}/{total} pacientes consolidados "
            f"(profissional: {id_profissional}, página: {page}/{pages})"
        )

        return PacienteConsolidadoPaginatedResponse(
            items=pacientes,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar pacientes consolidados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get(
    "/{id_profissional}/estatisticas/",
    response_model=EstatisticasResponse,
    summary="Estatísticas consolidadas",
    description="""
    Retorna estatísticas consolidadas do profissional.

    **Retorna**:
    - qt_clinicas_ativas: Número de clínicas onde trabalha atualmente
    - qt_pacientes_total: Total de pacientes únicos atendidos
    - qt_agendamentos_mes_atual: Agendamentos no mês atual
    """,
)
async def estatisticas_profissional(
    id_profissional: str,
    consolidacao_service: ProfissionalConsolidacaoService = Depends(
        get_consolidacao_service
    ),
    request: Request = None,
):
    """Obter estatísticas consolidadas do profissional"""
    try:
        # Validar usuário autenticado
        current_user = get_current_user(request)
        id_usuario = uuid.UUID(current_user["uid"])
        id_prof_uuid = uuid.UUID(id_profissional)

        # Validar acesso
        tem_acesso = await consolidacao_service.validar_acesso_profissional(
            id_usuario, id_prof_uuid
        )
        if not tem_acesso:
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar dados deste profissional",
            )

        # Obter estatísticas
        estatisticas = await consolidacao_service.estatisticas_profissional(id_prof_uuid)

        logger.info(f"Estatísticas obtidas (profissional: {id_profissional})")

        return estatisticas

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do profissional: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get(
    "/{id_profissional}/prontuarios/",
    response_model=ProntuarioConsolidadoPaginatedResponse,
    summary="Listar prontuários consolidados",
    description="""
    Lista prontuários consolidados de todas as clínicas onde o profissional trabalha.

    **Paginação**:
    - page: Número da página (default: 1)
    - size: Tamanho da página (default: 50, max: 100)

    **Filtros**:
    - dt_inicio: Data inicial (default: -90 dias)
    - dt_fim: Data final (default: hoje)
    - id_paciente: Filtrar por paciente específico

    **Retorna**:
    - Lista de prontuários com informações da clínica e paciente
    - Ordenação: Data de consulta (descendente)
    - Metadados de paginação (total, page, size, pages)
    """,
)
async def listar_prontuarios_consolidados(
    id_profissional: str,
    dt_inicio: Optional[datetime] = Query(None, description="Data inicial (ISO 8601)"),
    dt_fim: Optional[datetime] = Query(None, description="Data final (ISO 8601)"),
    id_paciente: Optional[str] = Query(None, description="Filtrar por paciente"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página (max: 100)"),
    consolidacao_service: ProfissionalConsolidacaoService = Depends(
        get_consolidacao_service
    ),
    request: Request = None,
):
    """Listar prontuários consolidados de todas as clínicas (com paginação)"""
    try:
        # Validar usuário autenticado
        current_user = get_current_user(request)
        id_usuario = uuid.UUID(current_user["uid"])
        id_prof_uuid = uuid.UUID(id_profissional)

        # Validar acesso
        tem_acesso = await consolidacao_service.validar_acesso_profissional(
            id_usuario, id_prof_uuid
        )
        if not tem_acesso:
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar dados deste profissional",
            )

        # Converter id_paciente se fornecido
        id_paciente_uuid = uuid.UUID(id_paciente) if id_paciente else None

        # Listar prontuários (retorna tupla: items, total)
        prontuarios, total = await consolidacao_service.listar_prontuarios_consolidados(
            id_prof_uuid, dt_inicio, dt_fim, id_paciente_uuid, page, size
        )

        # Calcular total de páginas
        pages = (total + size - 1) // size  # Ceiling division

        logger.info(
            f"Listados {len(prontuarios)}/{total} prontuários consolidados "
            f"(profissional: {id_profissional}, página: {page}/{pages})"
        )

        return ProntuarioConsolidadoPaginatedResponse(
            items=prontuarios,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar prontuários consolidados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
