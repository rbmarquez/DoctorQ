# doctorq-api/src/routes/partner_package.py
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.partner_package import (
    PartnerPackageCreate,
    PartnerPackageResponse,
    PartnerPackageStatus,
    PartnerPackageStatusUpdate,
)
from src.services.partner_package_service import (
    PartnerPackageServiceManager,
    get_partner_package_service,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/partner-packages", tags=["partner-packages"])


@router.get("/", response_model=dict)
async def list_partner_packages(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    status: Optional[PartnerPackageStatus] = Query(None, description="Filtrar por status do pacote"),
    search: Optional[str] = Query(None, description="Busca por código, nome ou empresa"),
    package_service: PartnerPackageServiceManager = Depends(get_partner_package_service),
):
    """Listar pacotes licenciados para gestão no admin DoctorQ."""
    try:
        items, total = await package_service.list_packages(
            page=page,
            size=size,
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
        logger.error("Erro ao listar pacotes de parceiros: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{package_id}", response_model=PartnerPackageResponse)
async def get_partner_package(
    package_id: str,
    package_service: PartnerPackageServiceManager = Depends(get_partner_package_service),
):
    """Recuperar um pacote específico com seus itens e licenças."""
    try:
        package_uuid = uuid.UUID(package_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador de pacote inválido")

    package = await package_service.get_package(package_uuid)
    if not package:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    return package


@router.post("/", response_model=PartnerPackageResponse, status_code=201)
async def create_partner_package(
    payload: PartnerPackageCreate,
    package_service: PartnerPackageServiceManager = Depends(get_partner_package_service),
):
    """Criar um novo pacote customizado pelo time administrativo."""
    try:
        return await package_service.create_package(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - log defensivo
        logger.error("Erro ao criar pacote de parceiro: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/from-lead/{lead_id}", response_model=PartnerPackageResponse, status_code=201)
async def create_package_from_lead(
    lead_id: str,
    package_code: Optional[str] = Query(None, description="Código personalizado para o pacote"),
    package_name: Optional[str] = Query(None, description="Nome do pacote"),
    package_service: PartnerPackageServiceManager = Depends(get_partner_package_service),
):
    """Gerar pacote com base nos serviços selecionados por um lead."""
    try:
        lead_uuid = uuid.UUID(lead_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador de lead inválido")

    try:
        return await package_service.create_from_lead(
            lead_id=lead_uuid,
            package_code=package_code,
            package_name=package_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - log defensivo
        logger.error("Erro ao criar pacote a partir de lead: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{package_id}/status", response_model=PartnerPackageResponse)
async def update_partner_package_status(
    package_id: str,
    status_update: PartnerPackageStatusUpdate,
    package_service: PartnerPackageServiceManager = Depends(get_partner_package_service),
):
    """Atualizar o status do pacote e registrar observações administrativas."""
    try:
        package_uuid = uuid.UUID(package_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Identificador de pacote inválido")

    package = await package_service.update_status(package_uuid, status_update)
    if not package:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    return package
