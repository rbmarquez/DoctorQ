"""
Rotas de Broadcast de Mensagens - UC096
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.broadcast import (
    BroadcastCampanhaCreate,
    BroadcastCampanhaUpdate,
    BroadcastCampanhaResponse,
    BroadcastCampanhaListResponse,
    BroadcastTemplateCreate,
    BroadcastTemplateResponse,
    BroadcastEstatisticas,
    BroadcastPreview
)
from src.models.user import User
from src.services.broadcast_service import BroadcastService

router = APIRouter(prefix="/broadcast", tags=["Broadcast"])


# ========== Campanhas ==========

@router.post("/campanhas/", response_model=BroadcastCampanhaResponse, status_code=status.HTTP_201_CREATED)
async def criar_campanha(
    data: BroadcastCampanhaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "profissional"]))
):
    """
    Cria nova campanha de broadcast

    **Permissões:** admin, gestor_clinica, profissional

    **Processo:**
    1. Valida template (se fornecido)
    2. Aplica filtros de segmentação
    3. Busca destinatários baseado nos filtros
    4. Cria campanha com status "rascunho" ou "agendada"
    5. Se dt_agendamento = null, campanha fica em rascunho

    **Segmentação Disponível:**
    - Por perfil (admin, gestor_clinica, profissional, paciente)
    - Por cidade/estado
    - Por clínica
    - Por data de última visita
    - Por IDs específicos

    **Canais Suportados:**
    - email: Requer ds_email preenchido
    - whatsapp: Requer ds_telefone preenchido
    - sms: Requer ds_telefone preenchido
    - push: Requer dispositivo cadastrado
    - mensagem_interna: Sempre disponível

    **Variáveis no Corpo:**
    - {{nome}}: Nome do destinatário
    - {{email}}: Email do destinatário
    - {{clinica}}: Nome da clínica
    - {{data}}: Data atual
    - Personalize conforme necessário
    """
    try:
        campanha = await BroadcastService.criar_campanha(
            db=db,
            id_empresa=current_user.id_empresa,
            id_user_criador=current_user.id_user,
            data=data
        )
        return BroadcastCampanhaResponse.model_validate(campanha)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar campanha: {str(e)}"
        )


@router.get("/campanhas/", response_model=BroadcastCampanhaListResponse)
async def listar_campanhas(
    status_campanha: Optional[str] = Query(None, description="Filtrar por status: rascunho|agendada|processando|enviada|cancelada|erro"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista campanhas de broadcast

    **Permissões:** Qualquer usuário autenticado

    **Filtros:**
    - status: rascunho, agendada, processando, enviada, cancelada, erro
    - Paginação: page e size

    **Ordenação:** Data de criação (mais recente primeiro)
    """
    campanhas, total = await BroadcastService.listar_campanhas(
        db=db,
        id_empresa=current_user.id_empresa,
        status=status_campanha,
        page=page,
        size=size
    )

    items = [BroadcastCampanhaResponse.model_validate(c) for c in campanhas]

    return BroadcastCampanhaListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/campanhas/{id_campanha}/", response_model=BroadcastCampanhaResponse)
async def buscar_campanha(
    id_campanha: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca campanha por ID

    **Permissões:** Qualquer usuário autenticado

    **Retorna:**
    - Dados completos da campanha
    - Estatísticas de envio
    - Segmentação aplicada
    """
    campanha = await BroadcastService.buscar_campanha(
        db=db,
        id_campanha=id_campanha,
        id_empresa=current_user.id_empresa
    )

    if not campanha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campanha não encontrada"
        )

    return BroadcastCampanhaResponse.model_validate(campanha)


@router.post("/campanhas/{id_campanha}/preview/", response_model=BroadcastPreview)
async def gerar_preview(
    id_campanha: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "profissional"]))
):
    """
    Gera preview da campanha antes de enviar

    **Permissões:** admin, gestor_clinica, profissional

    **Retorna:**
    - Total de destinatários
    - Amostra de 10 primeiros destinatários
    - Mensagem renderizada com variáveis substituídas (exemplo)
    - Custo estimado (se aplicável - ex: SMS)
    - Distribuição por canal

    **Útil para:**
    - Validar segmentação antes de enviar
    - Conferir variáveis renderizadas
    - Estimar custo (SMS)
    - Verificar destinatários
    """
    try:
        preview = await BroadcastService.gerar_preview(
            db=db,
            id_campanha=id_campanha,
            id_empresa=current_user.id_empresa
        )
        return preview

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar preview: {str(e)}"
        )


@router.post("/campanhas/{id_campanha}/enviar/", response_model=BroadcastCampanhaResponse)
async def enviar_campanha(
    id_campanha: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Envia campanha imediatamente

    **Permissões:** admin, gestor_clinica

    **Processo:**
    1. Valida se campanha pode ser enviada (status = rascunho ou agendada)
    2. Atualiza status para "processando"
    3. Processa destinatários em batch (100 por vez)
    4. Envia por canal apropriado (email, WhatsApp, SMS, push, mensagem interna)
    5. Atualiza estatísticas (enviados, falhas)
    6. Marca status como "enviada" ao concluir

    **Canais de Envio:**
    - email: Via serviço SMTP configurado
    - whatsapp: Via Twilio API (TODO: implementar)
    - sms: Via Twilio API (TODO: implementar)
    - push: Via Firebase Cloud Messaging (TODO: implementar)
    - mensagem_interna: Cria registro em tb_mensagens_usuarios

    **Observações:**
    - Envio é processado de forma assíncrona em background
    - Estatísticas são atualizadas em tempo real
    - Destinatários com falha recebem mensagem de erro
    - Processo irreversível após iniciado
    """
    try:
        campanha = await BroadcastService.enviar_campanha(
            db=db,
            id_campanha=id_campanha,
            id_empresa=current_user.id_empresa
        )
        return BroadcastCampanhaResponse.model_validate(campanha)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao enviar campanha: {str(e)}"
        )


@router.post("/campanhas/{id_campanha}/agendar/", response_model=BroadcastCampanhaResponse)
async def agendar_campanha(
    id_campanha: UUID,
    dt_agendamento: datetime,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Agenda campanha para envio futuro

    **Permissões:** admin, gestor_clinica

    **Parâmetros:**
    - dt_agendamento: Data/hora futura para envio

    **Validações:**
    - dt_agendamento deve ser no futuro
    - Campanha deve estar em rascunho
    - Ao menos 1 destinatário cadastrado

    **Processo:**
    - Atualiza dt_agendamento
    - Marca fg_agendada = true
    - Muda status para "agendada"
    - Job scheduler processará no horário agendado

    **Observação:**
    - Requer job scheduler (Celery/APScheduler) configurado
    - Campanha pode ser cancelada antes do envio
    """
    if dt_agendamento <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data de agendamento deve ser no futuro"
        )

    campanha = await BroadcastService.buscar_campanha(
        db=db,
        id_campanha=id_campanha,
        id_empresa=current_user.id_empresa
    )

    if not campanha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campanha não encontrada"
        )

    if campanha.st_campanha != "rascunho":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas campanhas em rascunho podem ser agendadas"
        )

    campanha.dt_agendamento = dt_agendamento
    campanha.fg_agendada = True
    campanha.st_campanha = "agendada"

    await db.commit()
    await db.refresh(campanha)

    return BroadcastCampanhaResponse.model_validate(campanha)


@router.delete("/campanhas/{id_campanha}/", status_code=status.HTTP_200_OK)
async def cancelar_campanha(
    id_campanha: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Cancela campanha

    **Permissões:** admin, gestor_clinica

    **Regras:**
    - Apenas campanhas em "rascunho" ou "agendada" podem ser canceladas
    - Campanhas em "processando" ou "enviada" não podem ser canceladas
    - Soft delete (fg_ativo = false)
    """
    try:
        campanha = await BroadcastService.cancelar_campanha(
            db=db,
            id_campanha=id_campanha,
            id_empresa=current_user.id_empresa
        )

        return {
            "message": "Campanha cancelada com sucesso",
            "id_campanha": id_campanha,
            "st_campanha": campanha.st_campanha
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao cancelar campanha: {str(e)}"
        )


@router.get("/campanhas/{id_campanha}/estatisticas/", response_model=BroadcastEstatisticas)
async def obter_estatisticas(
    id_campanha: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém estatísticas detalhadas da campanha

    **Permissões:** Qualquer usuário autenticado

    **Métricas:**
    - Total de destinatários
    - Enviados, entregues, falhas
    - Abertos (email/push)
    - Cliques (se houver links)
    - Taxa de entrega: (entregues / enviados) × 100
    - Taxa de abertura: (abertos / entregues) × 100
    - Taxa de clique: (cliques / abertos) × 100
    - Taxa de falha: (falhas / enviados) × 100
    - Duração do envio (segundos)

    **Útil para:**
    - Avaliar performance da campanha
    - Comparar campanhas
    - Identificar problemas de entrega
    - Otimizar segmentação
    """
    try:
        estatisticas = await BroadcastService.obter_estatisticas(
            db=db,
            id_campanha=id_campanha,
            id_empresa=current_user.id_empresa
        )
        return estatisticas

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter estatísticas: {str(e)}"
        )


# ========== Templates ==========

@router.post("/templates/", response_model=BroadcastTemplateResponse, status_code=status.HTTP_201_CREATED)
async def criar_template(
    data: BroadcastTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Cria template reutilizável para campanhas

    **Permissões:** admin, gestor_clinica

    **Vantagens:**
    - Reutilizar mensagens em múltiplas campanhas
    - Padronizar comunicação
    - Variáveis dinâmicas: {{nome}}, {{clinica}}, etc
    - Separar por canal (email, WhatsApp, SMS)

    **Exemplo de Corpo:**
    ```
    Olá {{nome}},

    Obrigado por ser cliente da {{clinica}}!

    Aproveite nossa promoção especial válida até {{data_fim}}.

    Atenciosamente,
    Equipe {{clinica}}
    ```

    **Variáveis Suportadas:**
    - {{nome}}, {{email}}, {{telefone}}
    - {{clinica}}, {{profissional}}
    - {{data}}, {{hora}}
    - Personalize conforme necessidade
    """
    try:
        template = await BroadcastService.criar_template(
            db=db,
            id_empresa=current_user.id_empresa,
            nm_template=data.nm_template,
            tp_canal=data.tp_canal.value,
            ds_corpo=data.ds_corpo,
            ds_assunto=data.ds_assunto,
            ds_descricao=data.ds_descricao,
            variaveis=data.variaveis,
            tp_categoria=data.tp_categoria
        )
        return BroadcastTemplateResponse.model_validate(template)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar template: {str(e)}"
        )


@router.get("/templates/", response_model=List[BroadcastTemplateResponse])
async def listar_templates(
    tp_canal: Optional[str] = Query(None, description="Filtrar por canal: email|whatsapp|sms|push|mensagem_interna"),
    fg_ativo: bool = Query(True, description="Apenas ativos"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista templates disponíveis

    **Permissões:** Qualquer usuário autenticado

    **Filtros:**
    - tp_canal: email, whatsapp, sms, push, mensagem_interna
    - fg_ativo: true/false

    **Ordenação:** Nome do template (A-Z)
    """
    templates = await BroadcastService.listar_templates(
        db=db,
        id_empresa=current_user.id_empresa,
        tp_canal=tp_canal,
        fg_ativo=fg_ativo
    )

    return [BroadcastTemplateResponse.model_validate(t) for t in templates]
