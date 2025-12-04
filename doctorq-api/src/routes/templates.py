"""
Rotas para o Marketplace de Templates
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.config.logger_config import get_logger
from src.models.template import (
    MarketplaceStats,
    TemplateCategory,
    TemplateCreate,
    TemplateInstallationCreate,
    TemplateInstallationResponse,
    TemplateInstallationUpdate,
    TemplateListResponse,
    TemplateResponse,
    TemplateReviewCreate,
    TemplateReviewResponse,
    TemplateReviewUpdate,
    TemplateSearchFilters,
    TemplateStats,
    TemplateStatus,
    TemplateUpdate,
    TemplateVisibility,
)
from src.services.template_service import TemplateService, get_template_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(
    prefix="/templates",
    tags=["Templates"],
    responses={404: {"description": "Não encontrado"}},
)


# =============================================================================
# TEMPLATES
# =============================================================================


@router.get("")
async def list_templates(
    page: int = Query(1, ge=1, description="Página"),
    size: int = Query(20, ge=1, le=100, description="Tamanho da página"),
    category: Optional[TemplateCategory] = Query(None, description="Filtrar por categoria"),
    tags: Optional[str] = Query(None, description="Tags separadas por vírgula"),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0, description="Rating mínimo"),
    search: Optional[str] = Query(None, description="Buscar por nome/descrição"),
    visibility: Optional[TemplateVisibility] = Query(None, description="Filtrar por visibilidade"),
    order_by: str = Query("popular", description="Ordenação: popular, recent, rating"),
    service: TemplateService = Depends(get_template_service),
) -> TemplateListResponse:
    """
    Listar templates do marketplace

    Filtros disponíveis:
    - category: Filtrar por categoria
    - tags: Tags separadas por vírgula (ex: "chatbot,support")
    - min_rating: Rating mínimo (0.0 a 5.0)
    - search: Busca textual em nome/descrição
    - visibility: public, private, organization
    - order_by: popular (instalações), recent (data publicação), rating (avaliação)
    """
    # Processar tags
    tag_list = None
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    # Criar filtros
    filters = TemplateSearchFilters(
        category=category,
        tags=tag_list,
        min_rating=min_rating,
        search_query=search,
        visibility=visibility,
        status=TemplateStatus.PUBLISHED,  # Apenas templates publicados
    )

    # Buscar templates
    templates, total = await service.list_templates(
        page=page, size=size, filters=filters, order_by=order_by
    )

    # Calcular total de páginas
    total_pages = (total + size - 1) // size

    return TemplateListResponse(
        templates=[TemplateResponse.model_validate(t) for t in templates],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateResponse:
    """
    Criar novo template (requer autenticação)

    O template é criado no status DRAFT por padrão.
    Use PUT /templates/{id}/publish para publicar.
    """
    try:
        template = await service.create_template(template_data)
        return TemplateResponse.model_validate(template)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{template_id}")
async def get_template(
    template_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
) -> TemplateResponse:
    """Obter detalhes de um template"""
    template = await service.get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado"
        )
    return TemplateResponse.model_validate(template)


@router.put("/{template_id}")
async def update_template(
    template_id: uuid.UUID,
    template_update: TemplateUpdate,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateResponse:
    """Atualizar template (requer autenticação)"""
    template = await service.update_template(template_id, template_update)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado"
        )
    return TemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
):
    """Deletar template (requer autenticação)"""
    deleted = await service.delete_template(template_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado"
        )


@router.post("/{template_id}/publish")
async def publish_template(
    template_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateResponse:
    """
    Publicar template (requer autenticação)

    Muda o status para PUBLISHED e define a data de publicação.
    """
    template = await service.publish_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado"
        )
    return TemplateResponse.model_validate(template)


@router.post("/{template_id}/archive")
async def archive_template(
    template_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateResponse:
    """Arquivar template (requer autenticação)"""
    template = await service.archive_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado"
        )
    return TemplateResponse.model_validate(template)


@router.get("/search/{query}")
async def search_templates(
    query: str,
    limit: int = Query(10, ge=1, le=50),
    service: TemplateService = Depends(get_template_service),
):
    """
    Busca semântica de templates usando full-text search

    Busca em nome e descrição dos templates com ranking de relevância.
    """
    templates = await service.search_templates(query, limit=limit)
    return {
        "query": query,
        "results": [TemplateResponse.model_validate(t) for t in templates],
        "count": len(templates),
    }


# =============================================================================
# INSTALAÇÕES
# =============================================================================


@router.post("/{template_id}/install", status_code=status.HTTP_201_CREATED)
async def install_template(
    template_id: uuid.UUID,
    installation_data: TemplateInstallationCreate,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateInstallationResponse:
    """
    Instalar template para usuário (requer autenticação)

    Verifica se o template está publicado e se o usuário ainda não instalou.
    """
    # Validar que o template_id da URL corresponde ao do body
    if installation_data.id_template != template_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID do template na URL não corresponde ao do body",
        )

    try:
        installation = await service.install_template(installation_data)
        return TemplateInstallationResponse.model_validate(installation)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/installations/user/{user_id}")
async def get_user_installations(
    user_id: uuid.UUID,
    active_only: bool = Query(True, description="Apenas instalações ativas"),
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
):
    """Listar instalações de um usuário (requer autenticação)"""
    installations = await service.get_user_installations(user_id, active_only=active_only)
    return {
        "user_id": user_id,
        "installations": [
            TemplateInstallationResponse.model_validate(i) for i in installations
        ],
        "count": len(installations),
    }


@router.get("/{template_id}/installations")
async def get_template_installations(
    template_id: uuid.UUID,
    active_only: bool = Query(True, description="Apenas instalações ativas"),
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
):
    """Listar instalações de um template (requer autenticação)"""
    installations = await service.get_template_installations(
        template_id, active_only=active_only
    )
    return {
        "template_id": template_id,
        "installations": [
            TemplateInstallationResponse.model_validate(i) for i in installations
        ],
        "count": len(installations),
    }


@router.put("/installations/{installation_id}")
async def update_installation(
    installation_id: uuid.UUID,
    update_data: TemplateInstallationUpdate,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateInstallationResponse:
    """Atualizar customizações de uma instalação (requer autenticação)"""
    installation = await service.update_installation(installation_id, update_data)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Instalação não encontrada"
        )
    return TemplateInstallationResponse.model_validate(installation)


@router.delete("/installations/{installation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def uninstall_template(
    installation_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
):
    """Desinstalar template (marca como inativo) (requer autenticação)"""
    installation = await service.uninstall_template(installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Instalação não encontrada"
        )


@router.get("/{template_id}/can-install/{user_id}")
async def can_install_template(
    template_id: uuid.UUID,
    user_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
):
    """
    Verificar se usuário pode instalar template

    Retorna:
    - can_install: bool
    - reason: str (motivo se não puder instalar)
    """
    can_install, reason = await service.can_install_template(user_id, template_id)
    return {"can_install": can_install, "reason": reason}


# =============================================================================
# REVIEWS
# =============================================================================


@router.post("/{template_id}/reviews", status_code=status.HTTP_201_CREATED)
async def create_review(
    template_id: uuid.UUID,
    review_data: TemplateReviewCreate,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateReviewResponse:
    """
    Criar review de um template (requer autenticação)

    O sistema verifica automaticamente se o usuário instalou o template
    e marca bl_verified_install=true se sim.
    """
    # Validar template_id
    if review_data.id_template != template_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID do template na URL não corresponde ao do body",
        )

    try:
        review = await service.create_review(review_data)
        return TemplateReviewResponse.model_validate(review)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{template_id}/reviews")
async def get_template_reviews(
    template_id: uuid.UUID,
    approved_only: bool = Query(True, description="Apenas reviews aprovadas"),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    service: TemplateService = Depends(get_template_service),
):
    """Listar reviews de um template"""
    reviews, total = await service.get_template_reviews(
        template_id, approved_only=approved_only, page=page, size=size
    )

    total_pages = (total + size - 1) // size

    return {
        "template_id": template_id,
        "reviews": [TemplateReviewResponse.model_validate(r) for r in reviews],
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages,
    }


@router.put("/reviews/{review_id}")
async def update_review(
    review_id: uuid.UUID,
    review_update: TemplateReviewUpdate,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
) -> TemplateReviewResponse:
    """Atualizar review (requer autenticação)"""
    review = await service.update_review(review_id, review_update)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review não encontrada"
        )
    return TemplateReviewResponse.model_validate(review)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
    _=Depends(get_current_apikey),
):
    """Deletar review (requer autenticação)"""
    deleted = await service.delete_review(review_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review não encontrada"
        )


# =============================================================================
# ESTATÍSTICAS
# =============================================================================


@router.get("/{template_id}/stats")
async def get_template_stats(
    template_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
) -> TemplateStats:
    """
    Obter estatísticas detalhadas de um template

    Inclui:
    - Instalações totais e ativas
    - Rating médio e contagem
    - Número de reviews
    - Data da última instalação
    """
    stats = await service.get_template_stats(template_id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado"
        )
    return stats


@router.get("/stats/marketplace")
async def get_marketplace_stats(
    service: TemplateService = Depends(get_template_service),
) -> MarketplaceStats:
    """
    Obter estatísticas gerais do marketplace

    Inclui:
    - Total de templates publicados
    - Total de instalações
    - Total de reviews
    - Rating médio geral
    - Templates por categoria
    - Top 5 templates mais instalados
    """
    return await service.get_marketplace_stats()


# =============================================================================
# CATEGORIAS
# =============================================================================


@router.get("/categories/list")
async def get_categories():
    """Listar todas as categorias disponíveis"""
    return {
        "categories": [
            {
                "value": cat.value,
                "label": cat.value.replace("_", " ").title(),
            }
            for cat in TemplateCategory
        ]
    }
