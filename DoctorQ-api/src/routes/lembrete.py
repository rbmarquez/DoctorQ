"""
Rotas de Lembretes
UC027 - Enviar Lembretes de Agendamento
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.lembrete import (
    LembreteCreate,
    LembreteResponse,
    LembreteListResponse,
    LembreteEnvioResponse
)
from src.models.user import User
from src.services.lembrete_service import LembreteService

router = APIRouter(prefix="/lembretes", tags=["Lembretes"])


@router.post("/", response_model=LembreteResponse, status_code=status.HTTP_201_CREATED)
async def criar_lembrete(
    data: LembreteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista"]))
):
    """
    Cria um novo lembrete agendado

    **Permissões:** admin, gestor_clinica, recepcionista

    **Regras:**
    - Tipos válidos: 24h, 2h, custom
    - Canais: email, whatsapp, sms, push
    - Data agendada deve ser futura
    """
    try:
        lembrete = await LembreteService.criar_lembrete(
            db=db,
            id_empresa=current_user.id_empresa,
            data=data
        )

        return LembreteResponse.model_validate(lembrete)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=LembreteListResponse)
async def listar_lembretes(
    id_agendamento: Optional[UUID] = Query(None, description="Filtrar por agendamento"),
    id_paciente: Optional[UUID] = Query(None, description="Filtrar por paciente"),
    tp_lembrete: Optional[str] = Query(None, description="Filtrar por tipo (24h, 2h, custom)"),
    st_lembrete: Optional[str] = Query(None, description="Filtrar por status (pendente, enviado, erro, cancelado)"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista lembretes com filtros

    **Permissões:** Qualquer usuário autenticado da empresa
    """
    lembretes, total = await LembreteService.listar_lembretes(
        db=db,
        id_empresa=current_user.id_empresa,
        id_agendamento=id_agendamento,
        id_paciente=id_paciente,
        tp_lembrete=tp_lembrete,
        st_lembrete=st_lembrete,
        page=page,
        size=size
    )

    items = [LembreteResponse.model_validate(l) for l in lembretes]

    return LembreteListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/{id_lembrete}/", response_model=LembreteResponse)
async def buscar_lembrete(
    id_lembrete: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca lembrete por ID

    **Permissões:** Qualquer usuário autenticado da empresa
    """
    lembrete = await LembreteService.buscar_lembrete_por_id(
        db=db,
        id_lembrete=id_lembrete,
        id_empresa=current_user.id_empresa
    )

    if not lembrete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lembrete não encontrado"
        )

    return LembreteResponse.model_validate(lembrete)


@router.post("/{id_lembrete}/enviar/", response_model=LembreteEnvioResponse)
async def enviar_lembrete_manual(
    id_lembrete: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista"]))
):
    """
    Envia um lembrete manualmente (força envio imediato)

    **Permissões:** admin, gestor_clinica, recepcionista

    **Regras:**
    - Apenas lembretes pendentes podem ser enviados
    - Ignora dt_agendado e envia imediatamente
    """
    lembrete = await LembreteService.buscar_lembrete_por_id(
        db=db,
        id_lembrete=id_lembrete,
        id_empresa=current_user.id_empresa
    )

    if not lembrete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lembrete não encontrado"
        )

    if lembrete.st_lembrete != "pendente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lembrete com status '{lembrete.st_lembrete}' não pode ser enviado"
        )

    try:
        # TODO: Implementar serviço de notificações real
        # Por enquanto, usar mock service
        from src.services.notificacao_service import NotificacaoService
        servico_notificacao = NotificacaoService()

        resultado = await LembreteService.enviar_lembrete(
            db=db,
            id_lembrete=id_lembrete,
            servico_notificacao=servico_notificacao
        )

        return LembreteEnvioResponse(
            id_lembrete=resultado["lembrete"].id_lembrete,
            tp_lembrete=resultado["lembrete"].tp_lembrete,
            canais_enviados=resultado["canais_enviados"],
            canais_erro=resultado["canais_erro"],
            st_lembrete=resultado["lembrete"].st_lembrete,
            dt_enviado=resultado["lembrete"].dt_enviado
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao enviar lembrete: {str(e)}"
        )


@router.post("/agendamento/{id_agendamento}/criar-lembretes/", response_model=list[LembreteResponse])
async def criar_lembretes_agendamento(
    id_agendamento: UUID,
    dt_agendamento: str = Query(..., description="Data/hora do agendamento (ISO 8601)"),
    id_paciente: UUID = Query(..., description="ID do paciente"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista", "profissional"]))
):
    """
    Cria lembretes automáticos para um agendamento
    - Lembrete 24h antes (email + whatsapp + push)
    - Lembrete 2h antes (sms + whatsapp)

    **Permissões:** admin, gestor_clinica, recepcionista, profissional

    **Uso:**
    Chamado automaticamente após criar um agendamento
    """
    try:
        from datetime import datetime

        # Parse da data
        dt_agendamento_parsed = datetime.fromisoformat(dt_agendamento.replace("Z", "+00:00"))

        lembretes = await LembreteService.criar_lembretes_para_agendamento(
            db=db,
            id_empresa=current_user.id_empresa,
            id_agendamento=id_agendamento,
            id_paciente=id_paciente,
            dt_agendamento=dt_agendamento_parsed
        )

        return [LembreteResponse.model_validate(l) for l in lembretes]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data inválida: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar lembretes: {str(e)}"
        )


@router.delete("/agendamento/{id_agendamento}/cancelar-lembretes/", status_code=status.HTTP_200_OK)
async def cancelar_lembretes_agendamento(
    id_agendamento: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista", "profissional"]))
):
    """
    Cancela todos os lembretes pendentes de um agendamento

    **Permissões:** admin, gestor_clinica, recepcionista, profissional

    **Uso:**
    Chamado automaticamente quando agendamento é cancelado ou reagendado
    """
    try:
        count = await LembreteService.cancelar_lembretes_agendamento(
            db=db,
            id_agendamento=id_agendamento
        )

        return {
            "message": f"{count} lembretes cancelados",
            "count": count
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao cancelar lembretes: {str(e)}"
        )


@router.post("/processar-pendentes/", status_code=status.HTTP_200_OK)
async def processar_lembretes_pendentes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Processa todos os lembretes pendentes (cron job)

    **Permissões:** admin (ou API key do cron job)

    **Uso:**
    Chamado por cron job a cada 15 minutos para processar lembretes agendados
    """
    try:
        # TODO: Implementar serviço de notificações real
        from src.services.notificacao_service import NotificacaoService
        servico_notificacao = NotificacaoService()

        stats = await LembreteService.processar_lembretes_pendentes(
            db=db,
            servico_notificacao=servico_notificacao
        )

        return {
            "message": "Lembretes processados com sucesso",
            "stats": stats
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar lembretes: {str(e)}"
        )
