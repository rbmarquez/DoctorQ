"""
Rotas de Anamnese
UC032 - Registrar Anamnese
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.anamnese import (
    AnamneseCreate,
    AnamneseUpdate,
    AnamneseResponse,
    AnamneseListResponse,
    AnamneseAssinaturaRequest,
    AnamneseAssinaturaResponse,
    AnamneseTemplateCreate,
    AnamneseTemplateUpdate,
    AnamneseTemplateResponse,
)
from src.models.user import User
from src.services.anamnese_service import AnamneseService, AnamneseTemplateService

router = APIRouter(prefix="/anamneses", tags=["Anamnese"])


# ========== TEMPLATES ==========

@router.post("/templates/", response_model=AnamneseTemplateResponse, status_code=status.HTTP_201_CREATED)
async def criar_template(
    data: AnamneseTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Cria um novo template de anamnese

    **Permissões:** admin, gestor_clinica

    **Regras:**
    - Templates podem ser específicos de uma empresa ou globais (fg_publico=True)
    - Perguntas devem ter tp_resposta válido
    - Regras de alerta são opcionais
    """
    try:
        template = await AnamneseTemplateService.criar_template(
            db=db,
            id_empresa=current_user.id_empresa,
            data=data
        )

        return AnamneseTemplateResponse.model_validate(template)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/templates/", response_model=AnamneseListResponse)
async def listar_templates(
    tp_template: Optional[str] = Query(None, description="Filtrar por tipo"),
    apenas_ativos: bool = Query(True, description="Apenas templates ativos"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista templates de anamnese disponíveis

    **Permissões:** Qualquer usuário autenticado

    **Retorna:**
    - Templates da empresa do usuário
    - Templates públicos (globais)
    """
    templates, total = await AnamneseTemplateService.listar_templates(
        db=db,
        id_empresa=current_user.id_empresa,
        tp_template=tp_template,
        apenas_ativos=apenas_ativos,
        page=page,
        size=size
    )

    items = [AnamneseTemplateResponse.model_validate(t) for t in templates]

    return AnamneseListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/templates/{id_template}/", response_model=AnamneseTemplateResponse)
async def buscar_template(
    id_template: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca template por ID

    **Permissões:** Qualquer usuário autenticado
    """
    template = await AnamneseTemplateService.buscar_template_por_id(db, id_template)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template não encontrado"
        )

    # Verificar acesso
    if template.id_empresa and template.id_empresa != current_user.id_empresa:
        if not template.fg_publico:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este template"
            )

    return AnamneseTemplateResponse.model_validate(template)


@router.put("/templates/{id_template}/", response_model=AnamneseTemplateResponse)
async def atualizar_template(
    id_template: UUID,
    data: AnamneseTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Atualiza um template de anamnese

    **Permissões:** admin, gestor_clinica (apenas templates da própria empresa)
    """
    template = await AnamneseTemplateService.buscar_template_por_id(db, id_template)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template não encontrado"
        )

    # Verificar permissão
    if template.id_empresa != current_user.id_empresa:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar este template"
        )

    template_atualizado = await AnamneseTemplateService.atualizar_template(
        db=db,
        id_template=id_template,
        data=data
    )

    return AnamneseTemplateResponse.model_validate(template_atualizado)


@router.post("/templates/padrao/", response_model=AnamneseTemplateResponse, status_code=status.HTTP_201_CREATED)
async def criar_template_padrao(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Cria o template padrão de anamnese geral para a empresa

    **Permissões:** admin, gestor_clinica

    **Retorna:** Template padrão criado
    """
    template = await AnamneseTemplateService.criar_template_padrao(
        db=db,
        id_empresa=current_user.id_empresa
    )

    return AnamneseTemplateResponse.model_validate(template)


# ========== ANAMNESES ==========

@router.post("/", response_model=AnamneseResponse, status_code=status.HTTP_201_CREATED)
async def criar_anamnese(
    data: AnamneseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["paciente", "profissional", "recepcionista", "gestor_clinica"]))
):
    """
    Cria uma nova anamnese preenchida

    **Permissões:** paciente, profissional, recepcionista, gestor_clinica

    **Regras:**
    - Paciente só pode criar anamnese para si mesmo
    - Profissionais/recepcionistas podem criar para qualquer paciente da empresa
    - Todas as perguntas obrigatórias devem ser respondidas
    - Sistema gera alertas automaticamente baseado nas respostas
    """
    # Verificar permissão
    if current_user.id_perfil_nome == "paciente" and data.id_paciente != current_user.id_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Paciente só pode criar anamnese para si mesmo"
        )

    try:
        anamnese = await AnamneseService.criar_anamnese(
            db=db,
            id_empresa=current_user.id_empresa,
            data=data
        )

        return AnamneseResponse.model_validate(anamnese)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar anamnese: {str(e)}"
        )


@router.get("/", response_model=AnamneseListResponse)
async def listar_anamneses(
    id_paciente: Optional[UUID] = Query(None, description="Filtrar por paciente"),
    id_profissional: Optional[UUID] = Query(None, description="Filtrar por profissional"),
    id_procedimento: Optional[UUID] = Query(None, description="Filtrar por procedimento"),
    apenas_com_alertas: bool = Query(False, description="Apenas anamneses com alertas críticos"),
    apenas_ativos: bool = Query(True, description="Apenas anamneses ativas"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista anamneses com filtros

    **Permissões:**
    - Paciente: Apenas suas próprias anamneses
    - Profissional/Recepcionista/Gestor: Todas da empresa
    """
    # Se for paciente, forçar filtro por seu ID
    if current_user.id_perfil_nome == "paciente":
        id_paciente = current_user.id_user

    anamneses, total = await AnamneseService.listar_anamneses(
        db=db,
        id_empresa=current_user.id_empresa,
        id_paciente=id_paciente,
        id_profissional=id_profissional,
        id_procedimento=id_procedimento,
        apenas_com_alertas=apenas_com_alertas,
        apenas_ativos=apenas_ativos,
        page=page,
        size=size
    )

    items = [AnamneseResponse.model_validate(a) for a in anamneses]

    return AnamneseListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/{id_anamnese}/", response_model=AnamneseResponse)
async def buscar_anamnese(
    id_anamnese: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca anamnese por ID

    **Permissões:**
    - Paciente: Apenas suas próprias anamneses
    - Profissional/Recepcionista/Gestor: Todas da empresa
    """
    anamnese = await AnamneseService.buscar_anamnese_por_id(
        db=db,
        id_anamnese=id_anamnese,
        id_empresa=current_user.id_empresa
    )

    if not anamnese:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anamnese não encontrada"
        )

    # Verificar permissão
    if current_user.id_perfil_nome == "paciente" and anamnese.id_paciente != current_user.id_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar esta anamnese"
        )

    return AnamneseResponse.model_validate(anamnese)


@router.put("/{id_anamnese}/", response_model=AnamneseResponse)
async def atualizar_anamnese(
    id_anamnese: UUID,
    data: AnamneseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["paciente", "profissional", "recepcionista", "gestor_clinica"]))
):
    """
    Atualiza uma anamnese

    **Permissões:**
    - Paciente: Apenas suas próprias anamneses (antes de assinar)
    - Profissional/Recepcionista/Gestor: Qualquer anamnese da empresa

    **Regras:**
    - Após assinatura do paciente, apenas profissional pode adicionar observações
    """
    anamnese = await AnamneseService.buscar_anamnese_por_id(
        db=db,
        id_anamnese=id_anamnese,
        id_empresa=current_user.id_empresa
    )

    if not anamnese:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anamnese não encontrada"
        )

    # Verificar permissão
    if current_user.id_perfil_nome == "paciente":
        if anamnese.id_paciente != current_user.id_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para editar esta anamnese"
            )

        # Paciente não pode editar após assinar
        if anamnese.dt_assinatura_paciente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anamnese já foi assinada e não pode mais ser editada"
            )

    try:
        anamnese_atualizada = await AnamneseService.atualizar_anamnese(
            db=db,
            id_anamnese=id_anamnese,
            id_empresa=current_user.id_empresa,
            data=data
        )

        return AnamneseResponse.model_validate(anamnese_atualizada)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{id_anamnese}/assinar-paciente/", response_model=AnamneseAssinaturaResponse)
async def assinar_anamnese_paciente(
    id_anamnese: UUID,
    data: AnamneseAssinaturaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["paciente"]))
):
    """
    Paciente assina a anamnese

    **Permissões:** paciente (apenas própria anamnese)

    **Regras:**
    - Paciente só pode assinar uma vez
    - Após assinatura, anamnese não pode ser editada pelo paciente
    """
    anamnese = await AnamneseService.buscar_anamnese_por_id(
        db=db,
        id_anamnese=id_anamnese,
        id_empresa=current_user.id_empresa
    )

    if not anamnese:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anamnese não encontrada"
        )

    # Verificar se é o paciente dono da anamnese
    if anamnese.id_paciente != current_user.id_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para assinar esta anamnese"
        )

    # Verificar se já foi assinada
    if anamnese.dt_assinatura_paciente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anamnese já foi assinada"
        )

    anamnese_assinada = await AnamneseService.assinar_anamnese_paciente(
        db=db,
        id_anamnese=id_anamnese,
        id_empresa=current_user.id_empresa,
        nm_assinatura=data.nm_assinatura
    )

    return AnamneseAssinaturaResponse(
        id_anamnese=anamnese_assinada.id_anamnese,
        nm_assinatura=anamnese_assinada.nm_assinatura_paciente,
        dt_assinatura=anamnese_assinada.dt_assinatura_paciente,
        tp_assinatura="paciente"
    )


@router.post("/{id_anamnese}/assinar-profissional/", response_model=AnamneseAssinaturaResponse)
async def assinar_anamnese_profissional(
    id_anamnese: UUID,
    data: AnamneseAssinaturaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["profissional", "gestor_clinica"]))
):
    """
    Profissional assina a anamnese

    **Permissões:** profissional, gestor_clinica

    **Regras:**
    - Profissional pode assinar após revisão
    - Assinatura vincula o profissional à anamnese
    """
    anamnese = await AnamneseService.buscar_anamnese_por_id(
        db=db,
        id_anamnese=id_anamnese,
        id_empresa=current_user.id_empresa
    )

    if not anamnese:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anamnese não encontrada"
        )

    anamnese_assinada = await AnamneseService.assinar_anamnese_profissional(
        db=db,
        id_anamnese=id_anamnese,
        id_empresa=current_user.id_empresa,
        id_profissional=current_user.id_user,
        nm_assinatura=data.nm_assinatura
    )

    return AnamneseAssinaturaResponse(
        id_anamnese=anamnese_assinada.id_anamnese,
        nm_assinatura=anamnese_assinada.nm_assinatura_profissional,
        dt_assinatura=anamnese_assinada.dt_assinatura_profissional,
        tp_assinatura="profissional"
    )


@router.delete("/{id_anamnese}/", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_anamnese(
    id_anamnese: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["gestor_clinica", "admin"]))
):
    """
    Desativa uma anamnese (soft delete)

    **Permissões:** gestor_clinica, admin

    **Regras:**
    - Não remove dados, apenas marca como inativa (fg_ativo=False)
    - Para conformidade com LGPD
    """
    anamnese = await AnamneseService.desativar_anamnese(
        db=db,
        id_anamnese=id_anamnese,
        id_empresa=current_user.id_empresa
    )

    if not anamnese:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anamnese não encontrada"
        )

    return None
