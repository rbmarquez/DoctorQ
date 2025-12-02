"""
Rotas para Marketplace de Agentes
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.marketplace import (
    CATEGORIAS_MARKETPLACE,
    AvaliacaoCreate,
    AvaliacaoResponse,
    InstalacaoCreate,
    InstalacaoResponse,
    MarketplaceAgentePublicar,
    MarketplaceAgenteResponse,
)
from src.services.marketplace_service import MarketplaceService, get_marketplace_service
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


@router.get("/", response_model=dict)
async def listar_marketplace(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(12, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome ou descrição"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    tags: Optional[str] = Query(None, description="Filtrar por tags (separadas por vírgula)"),
    ordenar_por: str = Query("popularidade", description="Ordenar por: popularidade, avaliacao, recente"),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Listar agentes disponíveis no marketplace"""
    try:
        # Converter tags de string para lista
        tags_list = None
        if tags:
            tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

        agentes, total = await marketplace_service.listar_marketplace(
            page=page,
            size=size,
            search=search,
            categoria=categoria,
            tags=tags_list,
            ordenar_por=ordenar_por,
        )

        return {
            "items": agentes,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except Exception as e:
        logger.error(f"Erro ao listar marketplace: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/categorias", response_model=List[str])
async def listar_categorias(
    _: object = Depends(get_current_apikey),
):
    """Listar categorias disponíveis no marketplace"""
    return CATEGORIAS_MARKETPLACE


@router.get("/destaques", response_model=dict)
async def listar_destaques(
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Listar agentes em destaque"""
    try:
        # Usar o serviço mas com filtro apenas para destaques
        agentes, total = await marketplace_service.listar_marketplace(
            page=1,
            size=6,
            ordenar_por="avaliacao",
        )

        # Filtrar apenas os destacados (se tiver campo st_destacado)
        destaques = [a for a in agentes if a.get("st_destacado", False)]

        return {
            "items": destaques[:6],  # Máximo 6 destaques
            "total": len(destaques),
        }

    except Exception as e:
        logger.error(f"Erro ao listar destaques: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/publicar", status_code=201)
async def publicar_agente(
    agente_data: MarketplaceAgentePublicar,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Publicar agente no marketplace"""
    try:
        marketplace_agente = await marketplace_service.publicar_agente(
            agente_data, user_id=None
        )

        return {
            "id_marketplace_agente": str(marketplace_agente.id_marketplace_agente),
            "message": "Agente publicado com sucesso no marketplace",
        }

    except ValueError as e:
        logger.warning(f"Erro de validação ao publicar agente: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao publicar agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/instalar", status_code=201, response_model=dict)
async def instalar_agente(
    instalacao_data: InstalacaoCreate,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Instalar agente do marketplace"""
    try:
        # TODO: Pegar user_id do contexto de autenticação
        user_id = uuid.uuid4()  # Temporário

        id_agente_instalado, foi_criado = await marketplace_service.instalar_agente(
            instalacao_data.id_marketplace_agente, user_id=user_id
        )

        return {
            "id_agente_instalado": str(id_agente_instalado),
            "foi_criado": foi_criado,
            "message": "Agente instalado com sucesso" if foi_criado else "Agente já estava instalado",
        }

    except ValueError as e:
        logger.warning(f"Erro de validação ao instalar agente: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao instalar agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{marketplace_agente_id}/avaliacoes", response_model=dict)
async def listar_avaliacoes(
    marketplace_agente_id: uuid.UUID,
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Listar avaliações de um agente"""
    try:
        avaliacoes, total = await marketplace_service.listar_avaliacoes(
            marketplace_agente_id, page=page, size=size
        )

        avaliacoes_response = [
            AvaliacaoResponse.model_validate(a) for a in avaliacoes
        ]

        return {
            "items": avaliacoes_response,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except Exception as e:
        logger.error(f"Erro ao listar avaliações: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/avaliar", status_code=201, response_model=AvaliacaoResponse)
async def criar_avaliacao(
    avaliacao_data: AvaliacaoCreate,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Criar avaliação de agente"""
    try:
        # TODO: Pegar user_id do contexto de autenticação
        user_id = uuid.uuid4()  # Temporário

        avaliacao = await marketplace_service.criar_avaliacao(avaliacao_data, user_id=user_id)

        return AvaliacaoResponse.model_validate(avaliacao)

    except ValueError as e:
        logger.warning(f"Erro de validação ao criar avaliação: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao criar avaliação: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# =============================================================================
# DETALHES DE AGENTE
# =============================================================================


@router.get("/{marketplace_agente_id}", response_model=dict)
async def get_agente_detalhes(
    marketplace_agente_id: uuid.UUID,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Obter detalhes completos de um agente do marketplace"""
    try:
        # TODO: Implementar método no service para buscar por ID
        agente = await marketplace_service.buscar_por_id(marketplace_agente_id)

        if not agente:
            raise HTTPException(status_code=404, detail="Agente não encontrado no marketplace")

        # Obter estatísticas do agente
        avaliacoes, total_avaliacoes = await marketplace_service.listar_avaliacoes(
            marketplace_agente_id, page=1, size=5
        )

        return {
            "agente": agente,
            "total_avaliacoes": total_avaliacoes,
            "avaliacoes_recentes": [AvaliacaoResponse.model_validate(a) for a in avaliacoes],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do agente: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# =============================================================================
# GERENCIAMENTO DE PUBLICAÇÕES
# =============================================================================


@router.get("/meus-agentes/publicados")
async def listar_meus_agentes(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(12, ge=1, le=100, description="Itens por página"),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Listar agentes publicados pelo usuário autenticado"""
    try:
        # TODO: Pegar user_empresa_id do contexto de autenticação
        from src.middleware.tenant_middleware import TenantContext

        user_empresa_id = TenantContext.get_current_tenant()
        if not user_empresa_id:
            raise HTTPException(status_code=401, detail="Empresa não identificada")

        agentes, total = await marketplace_service.listar_por_usuario(
            user_empresa_id, page=page, size=size
        )

        return {
            "items": agentes,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar agentes do usuário: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{marketplace_agente_id}", status_code=200)
async def atualizar_publicacao(
    marketplace_agente_id: uuid.UUID,
    agente_data: MarketplaceAgentePublicar,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Atualizar agente publicado no marketplace"""
    try:
        from src.middleware.tenant_middleware import TenantContext

        user_empresa_id = TenantContext.get_current_tenant()
        if not user_empresa_id:
            raise HTTPException(status_code=401, detail="Empresa não identificada")

        marketplace_agente = await marketplace_service.atualizar_publicacao(
            marketplace_agente_id, agente_data, user_empresa_id
        )

        if not marketplace_agente:
            raise HTTPException(status_code=404, detail="Publicação não encontrada")

        return {
            "id_marketplace_agente": str(marketplace_agente_id),
            "message": "Publicação atualizada com sucesso",
        }

    except ValueError as e:
        logger.warning(f"Erro de validação ao atualizar publicação: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar publicação: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{marketplace_agente_id}", status_code=204)
async def remover_publicacao(
    marketplace_agente_id: uuid.UUID,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Remover agente do marketplace"""
    try:
        from src.middleware.tenant_middleware import TenantContext

        user_empresa_id = TenantContext.get_current_tenant()
        if not user_empresa_id:
            raise HTTPException(status_code=401, detail="Empresa não identificada")

        success = await marketplace_service.remover_publicacao(
            marketplace_agente_id, user_empresa_id
        )

        if not success:
            raise HTTPException(status_code=404, detail="Publicação não encontrada")

        return None

    except ValueError as e:
        logger.warning(f"Erro de validação ao remover publicação: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover publicação: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# =============================================================================
# ESTATÍSTICAS
# =============================================================================


@router.get("/{marketplace_agente_id}/stats")
async def get_agente_stats(
    marketplace_agente_id: uuid.UUID,
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Obter estatísticas de um agente do marketplace"""
    try:
        stats = await marketplace_service.get_agente_stats(marketplace_agente_id)
        return stats

    except ValueError as e:
        logger.warning(f"Agente não encontrado: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/stats/geral")
async def get_marketplace_stats(
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
    _: object = Depends(get_current_apikey),
):
    """Obter estatísticas gerais do marketplace (admin)"""
    try:
        stats = await marketplace_service.get_marketplace_stats()
        return stats

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas gerais: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
