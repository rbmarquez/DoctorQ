# DoctorQ-api/src/routes/partner_license.py
"""
Rotas para gerenciamento de licenças do programa de parceiros.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from src.config.logger_config import get_logger
from src.models.partner_package import PartnerLicenseStatus
from src.services.partner_license_service import (
    PartnerLicenseService,
    get_partner_license_service,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/partner-licenses", tags=["partner-licenses"])


# =====================================================
# Schemas
# =====================================================


class LicenseAssignRequest(BaseModel):
    """Request para atribuir licença"""

    assigned_to: str = Field(..., min_length=1, max_length=255, description="Nome do destinatário")
    assigned_email: EmailStr = Field(..., description="Email do destinatário")
    metadata: Optional[dict] = Field(None, description="Metadados adicionais")


class LicenseRevokeRequest(BaseModel):
    """Request para revogar licença"""

    reason: Optional[str] = Field(None, max_length=500, description="Motivo da revogação")


class LicenseGenerateRequest(BaseModel):
    """Request para gerar licenças"""

    package_item_id: str = Field(..., description="ID do item do pacote")
    quantity: int = Field(..., ge=1, le=1000, description="Quantidade de licenças a gerar")


# =====================================================
# Rotas
# =====================================================


@router.get("/", response_model=dict)
async def list_licenses(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    status: Optional[PartnerLicenseStatus] = Query(None, description="Filtrar por status"),
    package_id: Optional[str] = Query(None, description="Filtrar por pacote"),
    search: Optional[str] = Query(None, description="Buscar por chave, nome ou email"),
    license_service: PartnerLicenseService = Depends(get_partner_license_service),
):
    """
    Listar licenças com filtros.

    Permite filtrar por status, pacote e buscar por texto.
    """
    try:
        # Converter package_id se fornecido
        package_uuid = None
        if package_id:
            try:
                package_uuid = uuid.UUID(package_id)
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="ID de pacote inválido"
                )

        items, total = await license_service.list_licenses(
            page=page,
            size=size,
            status=status,
            package_id=package_uuid,
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
    except Exception as exc:
        logger.error("Erro ao listar licenças: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stats", response_model=dict)
async def get_license_stats(
    package_id: Optional[str] = Query(None, description="Filtrar stats por pacote"),
    license_service: PartnerLicenseService = Depends(get_partner_license_service),
):
    """
    Obter estatísticas de licenças.

    Retorna contadores por status e totais.
    """
    try:
        # Converter package_id se fornecido
        package_uuid = None
        if package_id:
            try:
                package_uuid = uuid.UUID(package_id)
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="ID de pacote inválido"
                )

        stats = await license_service.get_license_stats(package_id=package_uuid)
        return stats
    except Exception as exc:
        logger.error("Erro ao obter estatísticas de licenças: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{license_id}", response_model=dict)
async def get_license(
    license_id: str,
    license_service: PartnerLicenseService = Depends(get_partner_license_service),
):
    """
    Buscar licença específica por ID.
    """
    try:
        license_uuid = uuid.UUID(license_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de licença inválido")

    license_data = await license_service.get_license(license_uuid)

    if not license_data:
        raise HTTPException(status_code=404, detail="Licença não encontrada")

    return license_data


@router.post("/generate", response_model=dict, status_code=201)
async def generate_licenses(
    payload: LicenseGenerateRequest,
    license_service: PartnerLicenseService = Depends(get_partner_license_service),
):
    """
    Gerar novas licenças para um item de pacote.

    Cria a quantidade especificada de licenças com chaves únicas.
    """
    try:
        package_item_uuid = uuid.UUID(payload.package_item_id)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="ID de item do pacote inválido"
        )

    try:
        licenses = await license_service.generate_licenses(
            package_item_id=package_item_uuid,
            quantity=payload.quantity,
        )

        return {
            "message": f"{payload.quantity} licença(s) gerada(s) com sucesso",
            "licenses": licenses,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Erro ao gerar licenças: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{license_id}/assign", response_model=dict)
async def assign_license(
    license_id: str,
    payload: LicenseAssignRequest,
    license_service: PartnerLicenseService = Depends(get_partner_license_service),
):
    """
    Atribuir licença a um usuário.

    Altera o status da licença para 'assigned' e registra o destinatário.
    """
    try:
        license_uuid = uuid.UUID(license_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de licença inválido")

    try:
        license_data = await license_service.assign_license(
            license_id=license_uuid,
            assigned_to=payload.assigned_to,
            assigned_email=payload.assigned_email,
            metadata=payload.metadata,
        )

        return {
            "message": "Licença atribuída com sucesso",
            "license": license_data,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Erro ao atribuir licença: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{license_id}/revoke", response_model=dict)
async def revoke_license(
    license_id: str,
    payload: LicenseRevokeRequest,
    license_service: PartnerLicenseService = Depends(get_partner_license_service),
):
    """
    Revogar licença.

    Altera o status da licença para 'revoked' e registra o motivo.
    """
    try:
        license_uuid = uuid.UUID(license_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de licença inválido")

    try:
        license_data = await license_service.revoke_license(
            license_id=license_uuid,
            reason=payload.reason,
        )

        return {
            "message": "Licença revogada com sucesso",
            "license": license_data,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Erro ao revogar licença: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
