# doctorq-api/src/routes/partner_lead.py
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.partner_lead import (
    PartnerLeadCreate,
    PartnerLeadResponse,
    PartnerLeadStatus,
    PartnerLeadStatusUpdate,
    PartnerServiceDefinitionCreate,
    PartnerServiceDefinitionResponse,
    PartnerServiceDefinitionUpdate,
    PartnerType,
)
from src.services.partner_lead_service import (
    PartnerLeadServiceManager,
    get_partner_lead_service,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/partner-leads", tags=["partner-leads"])


@router.get("/services/", response_model=list[PartnerServiceDefinitionResponse])
async def list_partner_services(
    include_inactive: bool = Query(False, description="Incluir serviços inativos"),
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Listar serviços disponíveis para licenciamento DoctorQ."""
    try:
        return await partner_lead_service.list_service_definitions(
            include_inactive=include_inactive
        )
    except Exception as exc:  # pragma: no cover - log defensivo
        logger.error("Erro ao listar serviços DoctorQ: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/services/", response_model=PartnerServiceDefinitionResponse, status_code=201)
async def create_partner_service(
    payload: PartnerServiceDefinitionCreate,
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Criar um novo serviço/plano disponível para parceiros."""
    try:
        return await partner_lead_service.create_service_definition(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - log defensivo
        logger.error("Erro ao criar serviço para parceiros: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.put(
    "/services/{service_id}/",
    response_model=PartnerServiceDefinitionResponse,
)
async def update_partner_service(
    service_id: str,
    payload: PartnerServiceDefinitionUpdate,
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Atualizar dados de um serviço/plano disponível."""
    try:
        service_uuid = uuid.UUID(service_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador inválido")

    try:
        service = await partner_lead_service.update_service_definition(
            service_uuid, payload
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - log defensivo
        logger.error("Erro ao atualizar serviço para parceiros: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return service


@router.delete("/services/{service_id}/", status_code=204)
async def delete_partner_service(
    service_id: str,
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Inativar um serviço/plano disponível."""
    try:
        service_uuid = uuid.UUID(service_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador inválido")

    deleted = await partner_lead_service.delete_service_definition(service_uuid)
    if not deleted:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return None


@router.post("/", response_model=PartnerLeadResponse, status_code=201)
async def create_partner_lead(
    payload: PartnerLeadCreate,
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Criar um novo lead de parceiro junto com os serviços contratados."""
    try:
        return await partner_lead_service.create_partner_lead(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - log defensivo
        logger.error("Erro ao criar lead de parceiro: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/", response_model=dict)
async def list_partner_leads(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    partner_type: Optional[PartnerType] = Query(None, description="Filtrar por tipo de parceiro"),
    status: Optional[PartnerLeadStatus] = Query(None, description="Filtrar por status"),
    search: Optional[str] = Query(None, description="Buscar por nome, empresa ou e-mail"),
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Listar leads de parceiros cadastrados para gestão administrativa."""
    try:
        items, total = await partner_lead_service.list_partner_leads(
            page=page,
            size=size,
            partner_type=partner_type,
            status=status,
            search=search,
        )
        return {
            "items": items,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }
    except Exception as exc:  # pragma: no cover - log defensivo
        logger.error("Erro ao listar leads de parceiros: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{lead_id}", response_model=PartnerLeadResponse)
async def get_partner_lead(
    lead_id: str,
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Detalhar um lead de parceiro e seus serviços selecionados."""
    try:
        lead_uuid = uuid.UUID(lead_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador inválido")

    lead = await partner_lead_service.get_partner_lead(lead_uuid)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    return lead


@router.put("/{lead_id}/status", response_model=PartnerLeadResponse)
async def update_partner_lead_status(
    lead_id: str,
    status_update: PartnerLeadStatusUpdate,
    partner_lead_service: PartnerLeadServiceManager = Depends(get_partner_lead_service),
):
    """Atualizar o status do lead e registrar observações administrativas."""
    try:
        lead_uuid = uuid.UUID(lead_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador inválido")

    lead = await partner_lead_service.update_status(lead_uuid, status_update)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    return lead
