# src/routes/partner_route.py
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.partner_lead import (
    PartnerLeadCreate,
    PartnerLeadResponse,
    PartnerLeadStatus,
    PartnerLeadStatusUpdate,
)
from src.models.partner_package import (
    PartnerPackageCreate,
    PartnerPackageItemResponse,
    PartnerPackageResponse,
    PartnerPackageStatus,
    PartnerPackageStatusUpdate,
)
from src.services.partner_service import (
    PartnerLeadService,
    PartnerLicenseService,
    PartnerPackageService,
    PartnerStatisticsService,
    get_partner_lead_service,
    get_partner_license_service,
    get_partner_package_service,
    get_partner_statistics_service,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/partner", tags=["Partner System"])


# ==========================================
# ENDPOINTS - LEADS
# ==========================================


@router.post("/leads/", response_model=PartnerLeadResponse, status_code=201)
async def create_partner_lead(
    lead_data: PartnerLeadCreate,
    lead_service: PartnerLeadService = Depends(get_partner_lead_service),
):
    """Criar um novo lead de parceiro"""
    try:
        lead = await lead_service.create_lead(lead_data)
        return PartnerLeadResponse.model_validate(lead)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao criar lead: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leads/", response_model=dict)
async def list_partner_leads(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    partner_type: Optional[str] = Query(None, description="Filtrar por tipo de parceiro"),
    search: Optional[str] = Query(
        None, description="Buscar por nome, email ou empresa"
    ),
    order_by: str = Query("dt_criacao", description="Campo para ordenação"),
    order_desc: bool = Query(True, description="Ordenação descendente"),
    lead_service: PartnerLeadService = Depends(get_partner_lead_service),
):
    """Listar leads de parceiros com paginação e filtros"""
    try:
        leads, total = await lead_service.list_leads(
            page=page,
            size=size,
            status_filter=status,
            partner_type_filter=partner_type,
            search=search,
            order_by=order_by,
            order_desc=order_desc,
        )

        items = [PartnerLeadResponse.model_validate(lead) for lead in leads]

        return {
            "items": items,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except Exception as e:
        logger.error(f"Erro ao listar leads: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leads/{lead_id}/", response_model=PartnerLeadResponse)
async def get_partner_lead(
    lead_id: str,
    lead_service: PartnerLeadService = Depends(get_partner_lead_service),
):
    """Obter detalhes de um lead por ID"""
    try:
        lead_uuid = uuid.UUID(lead_id)
        lead = await lead_service.get_lead_by_id(lead_uuid)

        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")

        return PartnerLeadResponse.model_validate(lead)

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de lead inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar lead: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/leads/{lead_id}/approve/", response_model=PartnerLeadResponse)
async def approve_partner_lead(
    lead_id: str,
    notes: Optional[str] = None,
    lead_service: PartnerLeadService = Depends(get_partner_lead_service),
):
    """Aprovar um lead de parceiro"""
    try:
        lead_uuid = uuid.UUID(lead_id)

        status_update = PartnerLeadStatusUpdate(
            status=PartnerLeadStatus.APPROVED,
            notes=notes,
        )

        lead = await lead_service.update_status(lead_uuid, status_update)

        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")

        return PartnerLeadResponse.model_validate(lead)

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de lead inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao aprovar lead: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/leads/{lead_id}/reject/", response_model=PartnerLeadResponse)
async def reject_partner_lead(
    lead_id: str,
    notes: Optional[str] = None,
    lead_service: PartnerLeadService = Depends(get_partner_lead_service),
):
    """Rejeitar um lead de parceiro"""
    try:
        lead_uuid = uuid.UUID(lead_id)

        status_update = PartnerLeadStatusUpdate(
            status=PartnerLeadStatus.REJECTED,
            notes=notes,
        )

        lead = await lead_service.update_status(lead_uuid, status_update)

        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")

        return PartnerLeadResponse.model_validate(lead)

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de lead inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao rejeitar lead: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/leads/{lead_id}/", status_code=200)
async def delete_partner_lead(
    lead_id: str,
    lead_service: PartnerLeadService = Depends(get_partner_lead_service),
):
    """Deletar um lead de parceiro"""
    try:
        lead_uuid = uuid.UUID(lead_id)
        success = await lead_service.delete_lead(lead_uuid)

        if not success:
            raise HTTPException(status_code=404, detail="Lead não encontrado")

        return {"message": "Lead deletado com sucesso"}

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de lead inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar lead: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ENDPOINTS - PACKAGES
# ==========================================


@router.post("/packages/", response_model=PartnerPackageResponse, status_code=201)
async def create_partner_package(
    package_data: PartnerPackageCreate,
    package_service: PartnerPackageService = Depends(get_partner_package_service),
    license_service: PartnerLicenseService = Depends(get_partner_license_service),
):
    """Criar um novo package de parceiro"""
    try:
        package = await package_service.create_package(package_data)

        # Gerar licenças automaticamente para cada item do package
        for item in package.items:
            await license_service.generate_licenses(
                item.id_partner_package_item, item.quantity
            )

        # Recarregar package com licenças
        package = await package_service.get_package_by_id(package.id_partner_package)

        return PartnerPackageResponse.model_validate(package)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao criar package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/packages/", response_model=dict)
async def list_partner_packages(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    search: Optional[str] = Query(None, description="Buscar por nome ou código"),
    order_by: str = Query("dt_criacao", description="Campo para ordenação"),
    order_desc: bool = Query(True, description="Ordenação descendente"),
    package_service: PartnerPackageService = Depends(get_partner_package_service),
):
    """Listar packages de parceiros com paginação e filtros"""
    try:
        packages, total = await package_service.list_packages(
            page=page,
            size=size,
            status_filter=status,
            search=search,
            order_by=order_by,
            order_desc=order_desc,
        )

        items = [PartnerPackageResponse.model_validate(pkg) for pkg in packages]

        return {
            "items": items,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except Exception as e:
        logger.error(f"Erro ao listar packages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/packages/{package_id}/", response_model=PartnerPackageResponse)
async def get_partner_package(
    package_id: str,
    package_service: PartnerPackageService = Depends(get_partner_package_service),
):
    """Obter detalhes de um package por ID"""
    try:
        package_uuid = uuid.UUID(package_id)
        package = await package_service.get_package_by_id(package_uuid)

        if not package:
            raise HTTPException(status_code=404, detail="Package não encontrado")

        return PartnerPackageResponse.model_validate(package)

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de package inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/packages/{package_id}/activate/", response_model=PartnerPackageResponse)
async def activate_partner_package(
    package_id: str,
    notes: Optional[str] = None,
    package_service: PartnerPackageService = Depends(get_partner_package_service),
):
    """Ativar um package de parceiro"""
    try:
        package_uuid = uuid.UUID(package_id)

        status_update = PartnerPackageStatusUpdate(
            status=PartnerPackageStatus.ACTIVE,
            notes=notes,
        )

        package = await package_service.update_status(package_uuid, status_update)

        if not package:
            raise HTTPException(status_code=404, detail="Package não encontrado")

        return PartnerPackageResponse.model_validate(package)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao ativar package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/packages/{package_id}/suspend/", response_model=PartnerPackageResponse)
async def suspend_partner_package(
    package_id: str,
    notes: Optional[str] = None,
    package_service: PartnerPackageService = Depends(get_partner_package_service),
):
    """Suspender um package de parceiro"""
    try:
        package_uuid = uuid.UUID(package_id)

        status_update = PartnerPackageStatusUpdate(
            status=PartnerPackageStatus.SUSPENDED,
            notes=notes,
        )

        package = await package_service.update_status(package_uuid, status_update)

        if not package:
            raise HTTPException(status_code=404, detail="Package não encontrado")

        return PartnerPackageResponse.model_validate(package)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao suspender package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/packages/{package_id}/", status_code=200)
async def delete_partner_package(
    package_id: str,
    package_service: PartnerPackageService = Depends(get_partner_package_service),
):
    """Deletar um package de parceiro"""
    try:
        package_uuid = uuid.UUID(package_id)
        success = await package_service.delete_package(package_uuid)

        if not success:
            raise HTTPException(status_code=404, detail="Package não encontrado")

        return {"message": "Package deletado com sucesso"}

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de package inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ENDPOINTS - ESTATÍSTICAS
# ==========================================


@router.get("/stats/", response_model=dict)
async def get_partner_statistics(
    stats_service: PartnerStatisticsService = Depends(get_partner_statistics_service),
):
    """Obter estatísticas gerais do sistema de parceiros"""
    try:
        stats = await stats_service.calculate_stats()
        return stats

    except Exception as e:
        logger.error(f"Erro ao calcular estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
