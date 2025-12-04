# estetiQ-api/src/services/partner_package_service.py
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.orm_config import get_db
from src.data.partner_service_seed import SERVICE_DEFINITIONS_SEED
from src.models.partner_lead import PartnerLead, PartnerLeadService, PartnerServiceDefinition
from src.models.partner_package import (
    PartnerLicense,
    PartnerLicenseResponse,
    PartnerLicenseStatus,
    PartnerPackage,
    PartnerPackageCreate,
    PartnerPackageItem,
    PartnerPackageItemResponse,
    PartnerPackageItemStatus,
    PartnerPackageLeadInfo,
    PartnerPackageResponse,
    PartnerPackageStatus,
    PartnerPackageStatusUpdate,
)


class PartnerPackageServiceManager:
    """Operações administrativas de pacotes/licenças para parceiros DoctorQ."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_service_catalog(self) -> None:
        """Garante que os serviços mock estejam persistidos."""
        existing_stmt = select(PartnerServiceDefinition.service_code)
        result = await self.db.execute(existing_stmt)
        existing_codes = {row[0] for row in result.all()}

        created = False
        for seed in SERVICE_DEFINITIONS_SEED:
            if seed["service_code"] in existing_codes:
                continue
            definition = PartnerServiceDefinition(
                service_code=seed["service_code"],
                service_name=seed["service_name"],
                description=seed["description"],
                price_value=seed["price_value"],
                price_label=seed["price_label"],
                features=seed["features"],
                active_flag="S",
                recommended_flag=seed.get("recommended", False),
            )
            self.db.add(definition)
            created = True

        if created:
            await self.db.commit()

    async def list_packages(
        self,
        page: int = 1,
        size: int = 10,
        status: Optional[PartnerPackageStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[PartnerPackageResponse], int]:
        stmt = (
            select(PartnerPackage)
            .options(
                selectinload(PartnerPackage.partner_lead),
                selectinload(PartnerPackage.items)
                .selectinload(PartnerPackageItem.service_definition),
                selectinload(PartnerPackage.items).selectinload(PartnerPackageItem.licenses),
            )
            .order_by(PartnerPackage.created_at.desc())
        )
        count_stmt = select(func.count(PartnerPackage.id_partner_package))

        filters = []
        if status:
            filters.append(PartnerPackage.status == status.value)
        if search:
            like = f"%{search}%"
            filters.append(
                or_(
                    PartnerPackage.package_name.ilike(like),
                    PartnerPackage.package_code.ilike(like),
                    PartnerPackage.notes.ilike(like),
                    PartnerLead.business_name.ilike(like),
                )
            )

        if filters:
            stmt = stmt.join(PartnerPackage.partner_lead, isouter=True).where(*filters)
            count_stmt = count_stmt.join(PartnerPackage.partner_lead, isouter=True).where(*filters)

        stmt = stmt.offset((page - 1) * size).limit(size)

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        result = await self.db.execute(stmt)
        packages = result.scalars().unique().all()

        responses = [await self._build_package_response(package) for package in packages]
        return responses, total

    async def get_package(self, package_id: uuid.UUID) -> Optional[PartnerPackageResponse]:
        stmt = (
            select(PartnerPackage)
            .where(PartnerPackage.id_partner_package == package_id)
            .options(
                selectinload(PartnerPackage.partner_lead),
                selectinload(PartnerPackage.items)
                .selectinload(PartnerPackageItem.service_definition),
                selectinload(PartnerPackage.items).selectinload(PartnerPackageItem.licenses),
            )
        )
        result = await self.db.execute(stmt)
        package = result.scalar_one_or_none()
        if not package:
            return None
        return await self._build_package_response(package)

    async def create_package(self, payload: PartnerPackageCreate) -> PartnerPackageResponse:
        await self.ensure_service_catalog()

        duplicate_stmt = select(PartnerPackage).where(PartnerPackage.package_code == payload.package_code)
        duplicate_result = await self.db.execute(duplicate_stmt)
        if duplicate_result.scalar_one_or_none():
            raise ValueError("Código de pacote já está em uso.")

        lead: Optional[PartnerLead] = None
        if payload.lead_id:
            lead_stmt = (
                select(PartnerLead)
                .where(PartnerLead.id_partner_lead == payload.lead_id)
                .options(selectinload(PartnerLead.services).selectinload(PartnerLeadService.service_definition))
            )
            lead_result = await self.db.execute(lead_stmt)
            lead = lead_result.scalar_one_or_none()
            if not lead:
                raise ValueError("Lead informado não foi encontrado.")

        requested_codes = [item.service_code for item in payload.items]
        definitions = await self._load_service_definitions(requested_codes)
        missing = set(requested_codes) - set(definitions.keys())
        if missing:
            raise ValueError(f"Serviços inválidos: {', '.join(sorted(missing))}")

        package = PartnerPackage(
            package_code=payload.package_code,
            package_name=payload.package_name,
            partner_lead=lead,
            billing_cycle=payload.billing_cycle,
            notes=payload.notes,
        )
        self.db.add(package)
        await self.db.flush()

        computed_total = 0.0
        for item_payload in payload.items:
            definition = definitions[item_payload.service_code]
            unit_price = float(definition.price_value) if definition.price_value is not None else 0.0
            computed_total += unit_price * item_payload.quantity

            package_item = PartnerPackageItem(
                package=package,
                service_definition=definition,
                quantity=item_payload.quantity,
                unit_price_value=definition.price_value,
                unit_price_label=definition.price_label,
                status=PartnerPackageItemStatus.PENDING.value,
            )
            self.db.add(package_item)
            await self.db.flush()

            await self._create_licenses_for_item(package_item, item_payload.quantity)

        package.total_value = payload.total_value if payload.total_value is not None else computed_total

        await self.db.commit()
        await self.db.refresh(package)
        return await self._build_package_response(package)

    async def create_from_lead(
        self,
        lead_id: uuid.UUID,
        package_code: Optional[str] = None,
        package_name: Optional[str] = None,
    ) -> PartnerPackageResponse:
        lead_stmt = (
            select(PartnerLead)
            .where(PartnerLead.id_partner_lead == lead_id)
            .options(selectinload(PartnerLead.services).selectinload(PartnerLeadService.service_definition))
        )
        lead_result = await self.db.execute(lead_stmt)
        lead = lead_result.scalar_one_or_none()
        if not lead:
            raise ValueError("Lead informado não foi encontrado.")

        if not lead.services:
            raise ValueError("O lead selecionado não possui serviços configurados.")

        await self.ensure_service_catalog()

        generated_code = package_code or f"LEAD-{lead.id_partner_lead.hex[:8].upper()}"
        generated_name = package_name or f"Pacote {lead.business_name}"

        payload = PartnerPackageCreate(
            package_code=generated_code,
            package_name=generated_name,
            lead_id=lead.id_partner_lead,
            billing_cycle="monthly",
            notes=lead.notes,
            items=[
                {"service_code": service.service_definition.service_code, "quantity": 1}
                for service in lead.services
                if service.service_definition
            ],
        )
        return await self.create_package(payload)

    async def update_status(
        self,
        package_id: uuid.UUID,
        status_update: PartnerPackageStatusUpdate,
    ) -> Optional[PartnerPackageResponse]:
        stmt = (
            select(PartnerPackage)
            .where(PartnerPackage.id_partner_package == package_id)
            .options(
                selectinload(PartnerPackage.items)
                .selectinload(PartnerPackageItem.service_definition),
                selectinload(PartnerPackage.items).selectinload(PartnerPackageItem.licenses),
            )
        )
        result = await self.db.execute(stmt)
        package = result.scalar_one_or_none()
        if not package:
            return None

        package.status = status_update.status.value
        current_time = datetime.now(timezone.utc)
        if status_update.status in {PartnerPackageStatus.ACTIVE, PartnerPackageStatus.PENDING}:
            package.activated_at = current_time
        if status_update.status in {PartnerPackageStatus.CANCELLED, PartnerPackageStatus.EXPIRED}:
            package.expires_at = current_time
        if status_update.notes:
            package.notes = (package.notes or "") + f"\n[Status] {status_update.notes}"

        await self.db.commit()
        await self.db.refresh(package)
        return await self._build_package_response(package)

    async def _load_service_definitions(
        self,
        service_codes: List[str],
    ) -> Dict[str, PartnerServiceDefinition]:
        stmt = select(PartnerServiceDefinition).where(
            PartnerServiceDefinition.service_code.in_(service_codes),
            PartnerServiceDefinition.active_flag == "S",
        )
        result = await self.db.execute(stmt)
        definitions = {definition.service_code: definition for definition in result.scalars().all()}
        return definitions

    async def _create_licenses_for_item(self, package_item: PartnerPackageItem, quantity: int) -> None:
        for _ in range(quantity):
            license_entry = PartnerLicense(
                package_item=package_item,
                license_key=str(uuid.uuid4()),
                status=PartnerLicenseStatus.AVAILABLE.value,
            )
            self.db.add(license_entry)

    async def _build_package_response(self, package: PartnerPackage) -> PartnerPackageResponse:
        items_response: List[PartnerPackageItemResponse] = []
        for item in package.items:
            definition = item.service_definition
            licenses_response: List[PartnerLicenseResponse] = [
                PartnerLicenseResponse(
                    id_partner_license=license.id_partner_license,
                    license_key=license.license_key,
                    status=PartnerLicenseStatus(license.status),
                    assigned_to=license.assigned_to,
                    assigned_email=license.assigned_email,
                    activated_at=license.activated_at,
                    revoked_at=license.revoked_at,
                )
                for license in item.licenses
            ]
            items_response.append(
                PartnerPackageItemResponse(
                    id_partner_package_item=item.id_partner_package_item,
                    id_service=item.id_service,
                    service_code=definition.service_code if definition else "",
                    service_name=definition.service_name if definition else "",
                    quantity=item.quantity,
                    unit_price_value=float(item.unit_price_value)
                    if item.unit_price_value is not None
                    else None,
                    unit_price_label=item.unit_price_label,
                    status=PartnerPackageItemStatus(item.status),
                    licenses=licenses_response,
                )
            )

        lead_info: Optional[PartnerPackageLeadInfo] = None
        if package.partner_lead:
            lead = package.partner_lead
            lead_info = PartnerPackageLeadInfo(
                id_partner_lead=lead.id_partner_lead,
                business_name=lead.business_name,
                contact_name=lead.contact_name,
                contact_email=lead.contact_email,
                status=lead.status,
            )

        return PartnerPackageResponse(
            id_partner_package=package.id_partner_package,
            package_code=package.package_code,
            package_name=package.package_name,
            status=PartnerPackageStatus(package.status),
            billing_cycle=package.billing_cycle,
            total_value=float(package.total_value) if package.total_value is not None else None,
            currency=package.currency,
            contract_url=package.contract_url,
            notes=package.notes,
            created_at=package.created_at,
            updated_at=package.updated_at,
            activated_at=package.activated_at,
            expires_at=package.expires_at,
            id_partner_lead=package.id_partner_lead,
            lead=lead_info,
            items=items_response,
        )


async def get_partner_package_service(
    db: AsyncSession = Depends(get_db),
) -> PartnerPackageServiceManager:
    return PartnerPackageServiceManager(db)
