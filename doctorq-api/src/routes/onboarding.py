"""
Rotas para Onboarding de Usuários
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.config.logger_config import get_logger
from src.models.onboarding import (
    CompleteStepRequest,
    OnboardingDashboard,
    OnboardingEventResponse,
    OnboardingFlowCreate,
    OnboardingFlowResponse,
    OnboardingFlowUpdate,
    SkipStepRequest,
    UserOnboardingProgressResponse,
)
from src.services.onboarding_service import OnboardingService, get_onboarding_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


# =============================================================================
# FLOW MANAGEMENT (Admin)
# =============================================================================


@router.post("/flows", status_code=status.HTTP_201_CREATED, response_model=OnboardingFlowResponse)
async def create_flow(
    flow_data: OnboardingFlowCreate,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Cria um novo flow de onboarding

    **Apenas para administradores**

    **Exemplo de payload:**
    ```json
    {
        "nm_flow": "Onboarding Básico",
        "ds_flow": "Flow de onboarding para novos usuários",
        "nm_target_type": "all_users",
        "nr_order": 1,
        "bl_ativo": true,
        "ds_steps": [
            {
                "step_type": "account_setup",
                "title": "Configure sua conta",
                "description": "Complete seu perfil",
                "order": 1,
                "required": true,
                "estimated_minutes": 5
            },
            {
                "step_type": "first_agent",
                "title": "Crie seu primeiro agente",
                "description": "Teste o poder da IA",
                "order": 2,
                "required": true,
                "estimated_minutes": 10
            }
        ],
        "ds_config": {
            "allow_skip": true,
            "show_progress_bar": true,
            "auto_advance": false,
            "celebration_on_complete": true
        }
    }
    ```
    """
    try:
        flow = await onboarding_service.create_flow(flow_data)
        return OnboardingFlowResponse.model_validate(flow)
    except Exception as e:
        logger.error(f"Erro ao criar flow de onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar flow de onboarding",
        ) from e


@router.get("/flows", response_model=List[OnboardingFlowResponse])
async def list_flows(
    target_type: Optional[str] = Query(None, description="Filtrar por tipo de usuário alvo"),
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Lista flows de onboarding ativos

    **Filtros:**
    - `target_type`: Tipo de usuário (all_users, free_users, paid_users, enterprise_users)

    **Exemplo de resposta:**
    ```json
    [
        {
            "id_flow": "...",
            "nm_flow": "Onboarding Básico",
            "ds_flow": "Flow para novos usuários",
            "nm_target_type": "all_users",
            "nr_order": 1,
            "bl_ativo": true,
            "ds_steps": [...],
            "ds_config": {...}
        }
    ]
    ```
    """
    try:
        flows = await onboarding_service.get_active_flows(target_type=target_type)
        return [OnboardingFlowResponse.model_validate(f) for f in flows]
    except Exception as e:
        logger.error(f"Erro ao listar flows: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao listar flows",
        ) from e


@router.get("/flows/{flow_id}", response_model=OnboardingFlowResponse)
async def get_flow(
    flow_id: uuid.UUID,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Busca flow de onboarding por ID

    **Parâmetros:**
    - `flow_id`: ID do flow

    **Retorna:**
    - Dados completos do flow
    """
    try:
        flow = await onboarding_service.get_flow_by_id(flow_id)
        if not flow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flow {flow_id} não encontrado",
            )
        return OnboardingFlowResponse.model_validate(flow)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar flow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar flow",
        ) from e


@router.put("/flows/{flow_id}", response_model=OnboardingFlowResponse)
async def update_flow(
    flow_id: uuid.UUID,
    flow_data: OnboardingFlowUpdate,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Atualiza um flow de onboarding

    **Apenas para administradores**

    **Parâmetros:**
    - `flow_id`: ID do flow
    - Payload com campos a atualizar (parcial)

    **Exemplo de payload:**
    ```json
    {
        "bl_ativo": false,
        "ds_steps": [...]
    }
    ```
    """
    try:
        flow = await onboarding_service.update_flow(flow_id, flow_data)
        return OnboardingFlowResponse.model_validate(flow)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao atualizar flow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar flow",
        ) from e


@router.delete("/flows/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow(
    flow_id: uuid.UUID,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Desativa um flow de onboarding

    **Apenas para administradores**

    **Parâmetros:**
    - `flow_id`: ID do flow

    **Nota:** O flow não é deletado, apenas marcado como inativo
    """
    try:
        await onboarding_service.delete_flow(flow_id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao deletar flow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao deletar flow",
        ) from e


# =============================================================================
# USER PROGRESS
# =============================================================================


@router.post("/start/{flow_id}", status_code=status.HTTP_201_CREATED, response_model=UserOnboardingProgressResponse)
async def start_onboarding(
    flow_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="ID do usuário"),
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Inicia onboarding para um usuário

    **Parâmetros:**
    - `flow_id`: ID do flow a iniciar
    - `user_id`: ID do usuário

    **Retorna:**
    - Progresso de onboarding criado

    **Exemplo de uso:**
    ```
    POST /onboarding/start/{flow_id}?user_id={user_id}
    ```
    """
    try:
        progress = await onboarding_service.start_onboarding(user_id, flow_id)
        return UserOnboardingProgressResponse.model_validate(progress)
    except Exception as e:
        logger.error(f"Erro ao iniciar onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao iniciar onboarding",
        ) from e


@router.get("/progress/{user_id}", response_model=List[UserOnboardingProgressResponse])
async def get_user_progress(
    user_id: uuid.UUID,
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Busca todo o progresso de onboarding de um usuário

    **Parâmetros:**
    - `user_id`: ID do usuário

    **Retorna:**
    - Lista de progressos em todos os flows

    **Exemplo de resposta:**
    ```json
    [
        {
            "id_progress": "...",
            "id_user": "...",
            "id_flow": "...",
            "nm_status": "in_progress",
            "nr_progress_percentage": 50,
            "nm_current_step": "first_agent",
            "ds_completed_steps": ["account_setup"],
            "ds_skipped_steps": []
        }
    ]
    ```
    """
    try:
        progress_list = await onboarding_service.get_all_user_progress(user_id)
        return [UserOnboardingProgressResponse.model_validate(p) for p in progress_list]
    except Exception as e:
        logger.error(f"Erro ao buscar progresso: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar progresso",
        ) from e


@router.post("/complete-step/{flow_id}", response_model=UserOnboardingProgressResponse)
async def complete_step(
    flow_id: uuid.UUID,
    step_request: CompleteStepRequest,
    user_id: uuid.UUID = Query(..., description="ID do usuário"),
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Marca um step como completado

    **Parâmetros:**
    - `flow_id`: ID do flow
    - `user_id`: ID do usuário
    - Payload com step_type e dados opcionais

    **Exemplo de payload:**
    ```json
    {
        "step_type": "first_agent",
        "data": {
            "agent_id": "...",
            "agent_name": "Meu Primeiro Agente"
        }
    }
    ```

    **Retorna:**
    - Progresso atualizado com percentual e próximo step
    """
    try:
        progress = await onboarding_service.complete_step(user_id, flow_id, step_request)
        return UserOnboardingProgressResponse.model_validate(progress)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao completar step: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao completar step",
        ) from e


@router.post("/skip-step/{flow_id}", response_model=UserOnboardingProgressResponse)
async def skip_step(
    flow_id: uuid.UUID,
    skip_request: SkipStepRequest,
    user_id: uuid.UUID = Query(..., description="ID do usuário"),
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Pula um step de onboarding

    **Parâmetros:**
    - `flow_id`: ID do flow
    - `user_id`: ID do usuário
    - Payload com step_type e razão opcional

    **Exemplo de payload:**
    ```json
    {
        "step_type": "invite_team",
        "reason": "Vou fazer isso depois"
    }
    ```

    **Retorna:**
    - Progresso atualizado
    """
    try:
        progress = await onboarding_service.skip_step(user_id, flow_id, skip_request)
        return UserOnboardingProgressResponse.model_validate(progress)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao pular step: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao pular step",
        ) from e


# =============================================================================
# DASHBOARD
# =============================================================================


@router.get("/dashboard/{user_id}", response_model=OnboardingDashboard)
async def get_dashboard(
    user_id: uuid.UUID,
    flow_id: Optional[uuid.UUID] = Query(None, description="ID do flow (opcional)"),
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Retorna dashboard de onboarding para um usuário

    **Parâmetros:**
    - `user_id`: ID do usuário
    - `flow_id`: ID do flow específico (opcional, usa primeiro ativo se não fornecido)

    **Retorna:**
    - Dashboard completo com:
      - Informações do flow
      - Progresso do usuário
      - Step atual
      - Próximos steps (até 3)
      - Status de conclusão
      - Percentual de progresso

    **Uso principal:**
    - Endpoint principal para exibir onboarding na interface
    - Mostra o que o usuário precisa fazer a seguir
    - Indica se já completou tudo

    **Exemplo de resposta:**
    ```json
    {
        "flow": {
            "id_flow": "...",
            "nm_flow": "Onboarding Básico",
            "ds_steps": [...]
        },
        "progress": {
            "nm_status": "in_progress",
            "nr_progress_percentage": 33,
            "ds_completed_steps": ["account_setup"]
        },
        "current_step": {
            "step_type": "first_agent",
            "title": "Crie seu primeiro agente",
            "description": "...",
            "order": 2,
            "required": true,
            "estimated_minutes": 10
        },
        "next_steps": [
            {
                "step_type": "first_conversation",
                "title": "Inicie uma conversa",
                "order": 3
            }
        ],
        "is_completed": false,
        "completion_percentage": 33
    }
    ```
    """
    try:
        dashboard = await onboarding_service.get_user_dashboard(user_id, flow_id)
        return dashboard
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao buscar dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar dashboard",
        ) from e


# =============================================================================
# EVENTS
# =============================================================================


@router.get("/events/{user_id}", response_model=List[OnboardingEventResponse])
async def get_user_events(
    user_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200, description="Limite de eventos"),
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
    _: object = Depends(get_current_apikey),
):
    """
    Busca eventos de onboarding de um usuário

    **Parâmetros:**
    - `user_id`: ID do usuário
    - `limit`: Limite de eventos (padrão: 50, máx: 200)

    **Retorna:**
    - Lista de eventos ordenados por data (mais recentes primeiro)

    **Exemplo de resposta:**
    ```json
    [
        {
            "id_event": "...",
            "id_user": "...",
            "id_progress": "...",
            "nm_event_type": "step_completed",
            "nm_step_type": "account_setup",
            "ds_event_data": {...},
            "dt_event": "2025-01-21T10:30:00"
        }
    ]
    ```
    """
    try:
        events = await onboarding_service.get_user_events(user_id, limit)
        return [OnboardingEventResponse.model_validate(e) for e in events]
    except Exception as e:
        logger.error(f"Erro ao buscar eventos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar eventos",
        ) from e


# =============================================================================
# HEALTH CHECK
# =============================================================================


@router.get("/health", status_code=status.HTTP_200_OK)
async def onboarding_health():
    """
    Health check para o módulo de onboarding

    **Retorna:**
    - Status: OK
    - Timestamp atual
    """
    from datetime import datetime

    return {
        "status": "OK",
        "module": "onboarding",
        "timestamp": datetime.now().isoformat(),
    }
