from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.config.orm_config import get_db
from src.schemas.candidatura_schema import (
    CriarCandidaturaRequest,
    AtualizarCandidaturaRequest,
    AvaliarCandidaturaRequest,
    CandidaturaResponse,
    CandidaturaDetailResponse,
    CandidaturaListResponse,
    CandidaturasFiltros,
    VerificarCandidaturaResponse,
    EstatisticasCandidaturasResponse,
    DashboardCandidatoResponse,
    AnalyticsEmpresaResponse
)
from src.services.candidatura_service import CandidaturaService
from src.services.email_service import email_service
from src.utils.auth import get_current_user
from src.config.logger_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/candidaturas", tags=["Candidaturas"])


@router.post("/", response_model=CandidaturaResponse, status_code=status.HTTP_201_CREATED)
async def criar_candidatura(
    data: CriarCandidaturaRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cria uma nova candidatura para uma vaga

    **Pré-requisitos:**
    - Usuário deve ter currículo cadastrado
    - Vaga deve estar aberta
    - Usuário não pode ter se candidatado anteriormente

    **Retorna:** Candidatura criada com match score calculado

    **Notificação:** Envia email para empresa notificando nova candidatura
    """
    try:
        candidatura = await CandidaturaService.criar_candidatura(
            db,
            data,
            str(current_user.id_user)
        )

        # Enviar notificação por email em background
        try:
            # Buscar email do responsável pela vaga (geralmente owner da empresa)
            from src.models.vaga import TbVagas
            from src.models.empresa import Empresa
            from sqlalchemy import select

            result = await db.execute(
                select(TbVagas, Empresa)
                .join(Empresa, TbVagas.id_empresa == Empresa.id_empresa)
                .where(TbVagas.id_vaga == candidatura.id_vaga)
            )
            vaga, empresa = result.one()

            # Email do owner (pode ser melhorado para buscar responsáveis pela vaga)
            if empresa.ds_email_contato:
                background_tasks.add_task(
                    email_service.send_nova_candidatura_notification,
                    email_empresa=empresa.ds_email_contato,
                    nm_cargo=candidatura.nm_cargo,
                    id_vaga=str(candidatura.id_vaga),
                    nm_candidato=candidatura.nm_candidato,
                    nm_cargo_desejado=candidatura.nm_cargo_desejado or "Não informado",
                    match_score=candidatura.nr_match_score or 0
                )
        except Exception as e:
            logger.warning(f"Erro ao enviar notificação de candidatura: {e}")
            # Não falha a criação da candidatura se o email falhar

        return CandidaturaResponse.from_orm(candidatura)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=CandidaturaListResponse)
async def listar_candidaturas(
    id_vaga: str = None,
    ds_status: str = None,
    nr_match_score_min: int = None,
    ordenar_por: str = "dt_candidatura",
    ordem: str = "desc",
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista candidaturas (uso interno, requer permissões)

    **Filtros:**
    - id_vaga: ID da vaga
    - ds_status: Status (enviada, em_analise, entrevista_agendada, aprovado, reprovado, desistiu)
    - nr_match_score_min: Score mínimo (0-100)
    - ordenar_por: Campo de ordenação (dt_candidatura, nr_match_score, nm_candidato)
    - ordem: Ordem (asc, desc)
    - page: Página
    - size: Itens por página
    """
    try:
        filtros = CandidaturasFiltros(
            id_vaga=id_vaga,
            ds_status=ds_status,
            nr_match_score_min=nr_match_score_min,
            ordenar_por=ordenar_por,
            ordem=ordem,
            page=page,
            size=size
        )

        return await CandidaturaService.listar_candidaturas(db, filtros)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/minhas/", response_model=CandidaturaListResponse)
async def listar_minhas_candidaturas(
    ds_status: str = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista candidaturas do usuário logado (candidato)

    **Filtros:**
    - ds_status: Status
    - page: Página
    - size: Itens por página
    """
    try:
        filtros = CandidaturasFiltros(
            ds_status=ds_status,
            page=page,
            size=size
        )

        return await CandidaturaService.listar_minhas_candidaturas(
            db,
            str(current_user.id_user),
            filtros
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/vaga/{id_vaga}/", response_model=CandidaturaListResponse)
async def listar_candidatos_vaga(
    id_vaga: str,
    ds_status: str = None,
    nr_match_score_min: int = None,
    ordenar_por: str = "nr_match_score",
    ordem: str = "desc",
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista candidatos de uma vaga específica (para empresas)

    **Permissões:** Apenas empresa proprietária da vaga

    **Ordenação padrão:** Por match score (maior primeiro)

    **Filtros:**
    - ds_status: Status
    - nr_match_score_min: Score mínimo
    - ordenar_por: Campo de ordenação
    - ordem: Ordem (asc, desc)
    - page: Página
    - size: Itens por página
    """
    try:
        filtros = CandidaturasFiltros(
            ds_status=ds_status,
            nr_match_score_min=nr_match_score_min,
            ordenar_por=ordenar_por,
            ordem=ordem,
            page=page,
            size=size
        )

        return await CandidaturaService.listar_candidatos_vaga(
            db,
            id_vaga,
            str(current_user.id_empresa),
            filtros
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/verificar/{id_vaga}/", response_model=VerificarCandidaturaResponse)
async def verificar_candidatura(
    id_vaga: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Verifica se usuário já se candidatou para uma vaga

    **Retorna:**
    - ja_candidatou: true/false
    - id_candidatura: ID da candidatura (se existir)
    - ds_status: Status atual (se existir)
    - dt_candidatura: Data da candidatura (se existir)
    """
    try:
        return await CandidaturaService.verificar_candidatura(
            db,
            id_vaga,
            str(current_user.id_user)
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{id_candidatura}/", response_model=CandidaturaResponse)
async def obter_candidatura(
    id_candidatura: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retorna detalhes de uma candidatura específica

    **Permissões:** Candidato ou empresa proprietária da vaga
    """
    try:
        candidatura = await CandidaturaService.buscar_por_id(db, id_candidatura, incluir_relacionamentos=True)

        if not candidatura:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidatura não encontrada"
            )

        # Verificar permissões
        is_candidato = str(candidatura.id_candidato) == str(current_user.id_user)
        is_empresa = str(candidatura.vaga.id_empresa) == str(current_user.id_empresa)

        if not (is_candidato or is_empresa):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para ver esta candidatura"
            )

        return CandidaturaResponse.from_orm(candidatura)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{id_candidatura}/", response_model=CandidaturaResponse)
async def atualizar_candidatura(
    id_candidatura: str,
    data: AtualizarCandidaturaRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza status e feedback de uma candidatura (empresa)

    **Permissões:** Apenas empresa proprietária da vaga

    **Ações possíveis:**
    - Mudar status (enviada → em_analise → entrevista_agendada → aprovado/reprovado)
    - Agendar entrevista (obrigatório para status "entrevista_agendada")
    - Adicionar feedback

    **Notificação:** Envia email para candidato notificando mudança de status
    """
    try:
        candidatura = await CandidaturaService.atualizar_candidatura(
            db,
            id_candidatura,
            data,
            str(current_user.id_empresa)
        )

        # Enviar notificação para o candidato em background
        try:
            from src.models.user import TbUsers
            from sqlalchemy import select

            # Buscar dados do candidato
            result = await db.execute(
                select(TbUsers).where(TbUsers.id_user == candidatura.id_candidato)
            )
            candidato = result.scalar_one_or_none()

            if candidato and candidato.ds_email:
                # Formatar data da entrevista se houver
                dt_entrevista_formatada = None
                if candidatura.dt_entrevista:
                    dt_entrevista_formatada = candidatura.dt_entrevista.strftime("%d/%m/%Y às %H:%M")

                background_tasks.add_task(
                    email_service.send_candidatura_status_notification,
                    email_candidato=candidato.ds_email,
                    nm_candidato=candidato.nm_nome or "Candidato",
                    nm_cargo=candidatura.nm_cargo,
                    nm_empresa=candidatura.nm_empresa,
                    novo_status=candidatura.ds_status,
                    feedback=candidatura.ds_feedback_empresa,
                    dt_entrevista=dt_entrevista_formatada
                )
        except Exception as e:
            logger.warning(f"Erro ao enviar notificação de status: {e}")
            # Não falha a atualização se o email falhar

        return CandidaturaResponse.from_orm(candidatura)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{id_candidatura}/desistir/", response_model=CandidaturaResponse)
async def desistir_candidatura(
    id_candidatura: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Candidato desiste da candidatura

    **Permissões:** Apenas o candidato

    **Efeito:** Muda status para "desistiu" e decrementa contador de candidatos na vaga
    """
    try:
        candidatura = await CandidaturaService.candidato_desistir(
            db,
            id_candidatura,
            str(current_user.id_user)
        )
        return CandidaturaResponse.from_orm(candidatura)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{id_candidatura}/avaliar/", response_model=CandidaturaResponse)
async def avaliar_processo(
    id_candidatura: str,
    data: AvaliarCandidaturaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Candidato avalia o processo seletivo

    **Permissões:** Apenas o candidato

    **Pré-requisito:** Processo finalizado (aprovado ou reprovado)

    **Dados:**
    - ds_feedback_candidato: Texto do feedback
    - nr_avaliacao_candidato: Nota de 1 a 5 estrelas
    """
    try:
        candidatura = await CandidaturaService.avaliar_processo(
            db,
            id_candidatura,
            data,
            str(current_user.id_user)
        )
        return CandidaturaResponse.from_orm(candidatura)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/vaga/{id_vaga}/estatisticas/", response_model=EstatisticasCandidaturasResponse)
async def obter_estatisticas_vaga(
    id_vaga: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtém estatísticas de candidaturas de uma vaga

    **Permissões:** Apenas empresa proprietária da vaga

    **Retorna:**
    - Total de candidatos
    - Candidatos por status
    - Match score médio
    - Datas primeira e última candidatura
    """
    try:
        return await CandidaturaService.obter_estatisticas_vaga(
            db,
            id_vaga,
            str(current_user.id_empresa)
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/dashboard/candidato/", response_model=DashboardCandidatoResponse)
async def obter_dashboard_candidato(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtém dashboard do candidato com estatísticas

    **Retorna:**
    - Total de candidaturas
    - Candidaturas por status
    - Entrevistas agendadas
    - Aprovações
    - Taxa de sucesso (%)
    - Candidaturas recentes (últimas 5)
    """
    try:
        return await CandidaturaService.obter_dashboard_candidato(
            db,
            str(current_user.id_user)
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/analytics/empresa/", response_model=AnalyticsEmpresaResponse)
async def obter_analytics_empresa(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtém analytics completo da empresa sobre vagas e candidaturas

    **Permissões:** Apenas empresa

    **Retorna:**
    - KPIs gerais (vagas abertas/fechadas, total candidatos, contratações, taxa conversão)
    - Top 10 vagas com mais candidatos (detalhes por vaga)
    - Tendências de candidaturas e contratações (últimos 30 dias)
    - Funil de conversão agregado
    - Distribuição de match scores
    - Tempo médio até contratação

    **Ideal para:** Dashboard executivo com visão geral do recrutamento
    """
    try:
        return await CandidaturaService.obter_analytics_empresa(
            db,
            str(current_user.id_empresa)
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
