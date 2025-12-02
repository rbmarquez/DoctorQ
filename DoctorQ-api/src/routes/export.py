"""
Rotas de Exportação de Relatórios - UC115
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.export import (
    ExportJobCreate,
    ExportJobResponse,
    ExportJobListResponse,
    ExportAgendamentoCreate,
    ExportAgendamentoUpdate,
    ExportAgendamentoResponse,
    ExportAgendamentoListResponse,
    ExportEstatisticas
)
from src.models.user import User
from src.services.export_service import ExportService

router = APIRouter(prefix="/exports", tags=["Exports"])


# ========== Jobs de Exportação ==========

@router.post("/jobs/", response_model=ExportJobResponse, status_code=status.HTTP_201_CREATED)
async def criar_export_job(
    data: ExportJobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "financeiro"]))
):
    """
    Cria job de exportação de relatório

    **Permissões:** admin, gestor_clinica, financeiro

    **Formatos Suportados:**
    - excel: Planilha Excel (.xlsx)
    - csv: CSV (.csv)
    - json: JSON (.json)
    - pdf: PDF (.pdf) - em desenvolvimento

    **Tipos de Relatório:**
    - agendamentos: Relatório de agendamentos
    - faturamento: Relatório financeiro
    - produtos: Catálogo de produtos
    - pacientes: Lista de pacientes
    - avaliacoes: Avaliações e reviews
    - estoque: Movimentação de estoque
    - notas_fiscais: Notas fiscais emitidas
    - broadcast: Campanhas de broadcast

    **Processamento:**
    - Job é processado imediatamente (modo síncrono)
    - Em produção, usar Celery para processamento assíncrono
    - Arquivo expira em 7 dias

    **Filtros:**
    - dt_inicio/dt_fim: Período
    - id_clinica: Clínica específica
    - id_profissional: Profissional específico
    - status: Status (varia por tipo de relatório)
    """
    try:
        job = await ExportService.criar_export_job(
            db=db,
            id_empresa=current_user.id_empresa,
            id_user=current_user.id_user,
            data=data
        )
        return ExportJobResponse.model_validate(job)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar job de exportação: {str(e)}"
        )


@router.get("/jobs/", response_model=ExportJobListResponse)
async def listar_export_jobs(
    status_export: Optional[str] = Query(None, description="Filtrar por status: pendente|processando|concluido|erro"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista jobs de exportação

    **Permissões:** Qualquer usuário autenticado

    **Filtros:**
    - status: pendente, processando, concluido, erro
    - Paginação: page e size
    """
    jobs, total = await ExportService.listar_jobs(
        db=db,
        id_empresa=current_user.id_empresa,
        status=status_export,
        page=page,
        size=size
    )

    items = [ExportJobResponse.model_validate(j) for j in jobs]

    return ExportJobListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/jobs/{id_export}/", response_model=ExportJobResponse)
async def buscar_export_job(
    id_export: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca job por ID

    **Permissões:** Qualquer usuário autenticado

    **Retorna:**
    - Dados do job
    - Status de processamento
    - URL para download (se concluído)
    - Mensagem de erro (se houver)
    """
    job = await ExportService.buscar_job(
        db=db,
        id_export=id_export,
        id_empresa=current_user.id_empresa
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job não encontrado"
        )

    return ExportJobResponse.model_validate(job)


@router.get("/download/{id_export}/")
async def download_export(
    id_export: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download de arquivo exportado

    **Permissões:** Qualquer usuário autenticado

    **Retorna:**
    - Arquivo para download (CSV, Excel, JSON, PDF)

    **Observações:**
    - Apenas jobs com status "concluido" podem ser baixados
    - Arquivo expira em 7 dias
    """
    arquivo_path, nome_arquivo = await ExportService.download_arquivo(
        db=db,
        id_export=id_export,
        id_empresa=current_user.id_empresa
    )

    if not arquivo_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo não encontrado ou expirado"
        )

    return FileResponse(
        path=arquivo_path,
        filename=nome_arquivo,
        media_type="application/octet-stream"
    )


# ========== Agendamentos ==========

@router.post("/agendamentos/", response_model=ExportAgendamentoResponse, status_code=status.HTTP_201_CREATED)
async def criar_agendamento(
    data: ExportAgendamentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Cria agendamento recorrente de exportação

    **Permissões:** admin, gestor_clinica

    **Frequências:**
    - diario: Todo dia às X horas
    - semanal: Toda semana no dia X (1=segunda, 7=domingo)
    - mensal: Todo mês no dia X (1-31)
    - trimestral: A cada 3 meses

    **Email Automático:**
    - fg_enviar_email: true/false
    - emails_destinatarios: Lista de emails para receber relatório

    **Observações:**
    - Requer job scheduler (Celery/APScheduler) configurado
    - Função SQL `buscar_campanhas_agendadas_para_envio()` lista agendamentos prontos
    - Arquivos enviados por email não expiram imediatamente
    """
    try:
        agendamento = await ExportService.criar_agendamento(
            db=db,
            id_empresa=current_user.id_empresa,
            id_user=current_user.id_user,
            nm_agendamento=data.nm_agendamento,
            tp_relatorio=data.tp_relatorio.value,
            tp_formato=data.tp_formato.value,
            tp_frequencia=data.tp_frequencia.value,
            nr_hora_execucao=data.nr_hora_execucao,
            nr_dia_execucao=data.nr_dia_execucao,
            filtros=data.filtros.model_dump() if data.filtros else None,
            fg_enviar_email=data.fg_enviar_email,
            emails_destinatarios=data.emails_destinatarios
        )
        return ExportAgendamentoResponse.model_validate(agendamento)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar agendamento: {str(e)}"
        )


@router.get("/agendamentos/", response_model=ExportAgendamentoListResponse)
async def listar_agendamentos(
    fg_ativo: bool = Query(True, description="Apenas ativos"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista agendamentos recorrentes

    **Permissões:** Qualquer usuário autenticado

    **Filtros:**
    - fg_ativo: true/false
    """
    agendamentos, total = await ExportService.listar_agendamentos(
        db=db,
        id_empresa=current_user.id_empresa,
        fg_ativo=fg_ativo,
        page=page,
        size=size
    )

    items = [ExportAgendamentoResponse.model_validate(a) for a in agendamentos]

    return ExportAgendamentoListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.delete("/agendamentos/{id_agendamento}/", status_code=status.HTTP_200_OK)
async def desativar_agendamento(
    id_agendamento: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Desativa agendamento recorrente

    **Permissões:** admin, gestor_clinica

    **Observações:**
    - Soft delete (fg_ativo = false)
    - Jobs já agendados não são cancelados
    """
    try:
        agendamento = await ExportService.desativar_agendamento(
            db=db,
            id_agendamento=id_agendamento,
            id_empresa=current_user.id_empresa
        )

        return {
            "message": "Agendamento desativado com sucesso",
            "id_agendamento": id_agendamento
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao desativar agendamento: {str(e)}"
        )


# ========== Estatísticas ==========

@router.get("/estatisticas/", response_model=ExportEstatisticas)
async def obter_estatisticas_exports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "financeiro"]))
):
    """
    Obtém estatísticas de exportações

    **Permissões:** admin, gestor_clinica, financeiro

    **Métricas:**
    - Total de exports realizados
    - Total concluídos/erro/pendentes
    - Tamanho total (MB)
    - Formatos mais usados
    - Relatórios mais exportados
    """
    try:
        stats = await ExportService.obter_estatisticas(
            db=db,
            id_empresa=current_user.id_empresa
        )
        return stats

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter estatísticas: {str(e)}"
        )
