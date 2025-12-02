# src/services/partner_lead_service.py
import uuid
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.data.partner_service_seed import SERVICE_DEFINITIONS_SEED
from src.models.partner_lead import (
    PartnerLead,
    PartnerLeadCreate,
    PartnerLeadResponse,
    PartnerLeadService,
    PartnerLeadServiceResponse,
    PartnerLeadStatus,
    PartnerLeadStatusUpdate,
    PartnerServiceDefinition,
    PartnerServiceDefinitionCreate,
    PartnerServiceDefinitionResponse,
    PartnerServiceDefinitionUpdate,
    PartnerType,
)

logger = get_logger(__name__)


class PartnerLeadServiceManager:
    """Regras de negócio para leads de parceiros e licenciamento DoctorQ."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_service_definitions(
        self, include_inactive: bool = False
    ) -> List[PartnerServiceDefinitionResponse]:
        await self._ensure_service_catalog()

        stmt = (
            select(PartnerServiceDefinition)
            .order_by(PartnerServiceDefinition.service_name)
        )
        if not include_inactive:
            stmt = stmt.where(PartnerServiceDefinition.active_flag == "S")

        result = await self.db.execute(stmt)
        services = result.scalars().all()

        return [self._build_service_definition_response(service) for service in services]

    async def create_service_definition(
        self, payload: PartnerServiceDefinitionCreate
    ) -> PartnerServiceDefinitionResponse:
        await self._ensure_service_catalog()

        stmt = select(PartnerServiceDefinition).where(
            func.lower(PartnerServiceDefinition.service_code)
            == payload.service_code.lower()
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError("Código de serviço já cadastrado.")

        definition = PartnerServiceDefinition(
            service_code=payload.service_code,
            service_name=payload.service_name,
            description=payload.description,
            price_value=payload.price_value,
            price_label=payload.price_label,
            features=payload.features or [],
            active_flag="S" if payload.active else "N",
            recommended_flag=payload.recommended,
            category=payload.category.value,
            partner_type=payload.partner_type,
            max_licenses=payload.max_licenses,
            yearly_discount=payload.yearly_discount,
        )

        self.db.add(definition)
        await self.db.commit()
        await self.db.refresh(definition)

        return self._build_service_definition_response(definition)

    async def update_service_definition(
        self, service_id: uuid.UUID, payload: PartnerServiceDefinitionUpdate
    ) -> Optional[PartnerServiceDefinitionResponse]:
        stmt = select(PartnerServiceDefinition).where(
            PartnerServiceDefinition.id_service == service_id
        )
        result = await self.db.execute(stmt)
        definition = result.scalar_one_or_none()

        if not definition:
            return None

        if payload.service_code and payload.service_code != definition.service_code:
            duplicate_stmt = select(PartnerServiceDefinition).where(
                func.lower(PartnerServiceDefinition.service_code)
                == payload.service_code.lower(),
                PartnerServiceDefinition.id_service != service_id,
            )
            duplicate_result = await self.db.execute(duplicate_stmt)
            if duplicate_result.scalar_one_or_none():
                raise ValueError("Código de serviço já cadastrado.")
            definition.service_code = payload.service_code

        if payload.service_name is not None:
            definition.service_name = payload.service_name
        if payload.description is not None:
            definition.description = payload.description
        if payload.price_value is not None:
            definition.price_value = payload.price_value
        if payload.price_label is not None:
            definition.price_label = payload.price_label
        if payload.features is not None:
            definition.features = payload.features
        if payload.active is not None:
            definition.active_flag = "S" if payload.active else "N"
        if payload.recommended is not None:
            definition.recommended_flag = payload.recommended
        if payload.category is not None:
            definition.category = payload.category.value
        if payload.partner_type is not None:
            definition.partner_type = payload.partner_type
        if payload.max_licenses is not None:
            definition.max_licenses = payload.max_licenses
        if payload.yearly_discount is not None:
            definition.yearly_discount = payload.yearly_discount

        await self.db.commit()
        await self.db.refresh(definition)
        return self._build_service_definition_response(definition)

    async def delete_service_definition(self, service_id: uuid.UUID) -> bool:
        stmt = select(PartnerServiceDefinition).where(
            PartnerServiceDefinition.id_service == service_id
        )
        result = await self.db.execute(stmt)
        definition = result.scalar_one_or_none()

        if not definition:
            return False

        definition.active_flag = "N"
        await self.db.commit()
        return True

    async def create_partner_lead(self, data: PartnerLeadCreate) -> PartnerLeadResponse:
        await self._ensure_service_catalog()

        try:
            service_codes = [service.service_code for service in data.selected_services]
            if not service_codes:
                raise ValueError("Selecione ao menos um serviço para contratar.")

            stmt = select(PartnerServiceDefinition).where(
                PartnerServiceDefinition.service_code.in_(service_codes),
                PartnerServiceDefinition.active_flag == "S",
            )
            result = await self.db.execute(stmt)
            definitions = {service.service_code: service for service in result.scalars().all()}

            missing = set(service_codes) - set(definitions.keys())
            if missing:
                raise ValueError(f"Serviços inválidos: {', '.join(sorted(missing))}")

            lead = PartnerLead(
                partner_type=data.partner_type.value,
                contact_name=data.contact_name,
                contact_email=data.contact_email,
                contact_phone=data.contact_phone,
                business_name=data.business_name,
                cnpj=data.cnpj,
                city=data.city,
                state=data.state,
                services_description=data.services,
                differentiators=data.differentiators,
                team_size=data.team_size,
                catalog_link=data.catalog_link,
                notes=data.notes,
            )

            self.db.add(lead)
            await self.db.flush()

            for service_code in service_codes:
                definition = definitions[service_code]
                lead_service = PartnerLeadService(
                    partner_lead=lead,
                    service_definition=definition,
                    service_name=definition.service_name,
                    price_label_snapshot=definition.price_label,
                )
                self.db.add(lead_service)

            await self.db.commit()
            await self.db.refresh(lead)

            return await self._build_lead_response(lead)
        except ValueError:
            await self.db.rollback()
            raise
        except Exception as exc:  # pragma: no cover - log defensivo
            logger.error("Erro ao criar lead de parceiro: %s", exc, exc_info=True)
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar lead de parceiro: {str(exc)}") from exc

    async def list_partner_leads(
        self,
        page: int = 1,
        size: int = 10,
        partner_type: Optional[PartnerType] = None,
        status: Optional[PartnerLeadStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[PartnerLeadResponse], int]:
        try:
            stmt = (
                select(PartnerLead)
                .options(selectinload(PartnerLead.services).selectinload(PartnerLeadService.service_definition))
                .order_by(PartnerLead.created_at.desc())
            )
            count_stmt = select(func.count(PartnerLead.id_partner_lead))

            filters = []
            if partner_type:
                filters.append(PartnerLead.partner_type == partner_type.value)
            if status:
                filters.append(PartnerLead.status == status.value)
            if search:
                search_like = f"%{search}%"
                filters.append(
                    or_(
                        PartnerLead.contact_name.ilike(search_like),
                        PartnerLead.contact_email.ilike(search_like),
                        PartnerLead.business_name.ilike(search_like),
                        PartnerLead.contact_phone.ilike(search_like),
                    )
                )

            if filters:
                stmt = stmt.where(*filters)
                count_stmt = count_stmt.where(*filters)

            stmt = stmt.offset((page - 1) * size).limit(size)

            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar() or 0

            result = await self.db.execute(stmt)
            leads = result.scalars().all()

            responses = [await self._build_lead_response(lead) for lead in leads]
            return responses, total
        except Exception as exc:  # pragma: no cover - log defensivo
            logger.error("Erro ao listar leads de parceiros: %s", exc, exc_info=True)
            raise RuntimeError(f"Erro ao listar leads de parceiros: {str(exc)}") from exc

    async def get_partner_lead(self, lead_id: uuid.UUID) -> Optional[PartnerLeadResponse]:
        stmt = (
            select(PartnerLead)
            .where(PartnerLead.id_partner_lead == lead_id)
            .options(selectinload(PartnerLead.services).selectinload(PartnerLeadService.service_definition))
        )
        result = await self.db.execute(stmt)
        lead = result.scalar_one_or_none()
        if not lead:
            return None
        return await self._build_lead_response(lead)

    def _build_service_definition_response(
        self, service: PartnerServiceDefinition
    ) -> PartnerServiceDefinitionResponse:
        return PartnerServiceDefinitionResponse(
            id_service=service.id_service,
            service_code=service.service_code,
            service_name=service.service_name,
            description=service.description,
            price_value=float(service.price_value)
            if service.price_value is not None
            else None,
            price_label=service.price_label,
            features=service.features or [],
            active=service.active_flag == "S",
            recommended=bool(service.recommended_flag),
            category=service.category,
            partner_type=service.partner_type or "universal",
            max_licenses=service.max_licenses,
            yearly_discount=float(service.yearly_discount)
            if service.yearly_discount is not None
            else 17.00,
        )

    async def update_status(
        self,
        lead_id: uuid.UUID,
        status_update: PartnerLeadStatusUpdate,
    ) -> Optional[PartnerLeadResponse]:
        stmt = (
            select(PartnerLead)
            .where(PartnerLead.id_partner_lead == lead_id)
            .options(selectinload(PartnerLead.services).selectinload(PartnerLeadService.service_definition))
        )
        result = await self.db.execute(stmt)
        lead = result.scalar_one_or_none()
        if not lead:
            return None

        lead.status = status_update.status.value
        if status_update.notes:
            lead.notes = (lead.notes or "") + f"\n[Atualização status] {status_update.notes}"

        await self.db.commit()
        await self.db.refresh(lead)
        return await self._build_lead_response(lead)

    async def _build_lead_response(self, lead: PartnerLead) -> PartnerLeadResponse:
        services_response: List[PartnerLeadServiceResponse] = []
        for service in lead.services:
            definition = service.service_definition
            services_response.append(
                PartnerLeadServiceResponse(
                    id_service=service.id_service,
                    service_code=definition.service_code if definition else "",
                    service_name=service.service_name,
                    price_label=service.price_label_snapshot,
                )
            )

        return PartnerLeadResponse(
            id_partner_lead=lead.id_partner_lead,
            partner_type=PartnerType(lead.partner_type),
            status=PartnerLeadStatus(lead.status),
            contact_name=lead.contact_name,
            contact_email=lead.contact_email,
            contact_phone=lead.contact_phone,
            business_name=lead.business_name,
            cnpj=lead.cnpj,
            city=lead.city,
            state=lead.state,
            services=lead.services_description,
            differentiators=lead.differentiators,
            team_size=lead.team_size,
            catalog_link=lead.catalog_link,
            notes=lead.notes,
            created_at=lead.created_at,
            updated_at=lead.updated_at,
            services_selected=services_response,
        )

    async def _ensure_service_catalog(self) -> None:
        stmt = select(PartnerServiceDefinition.service_code)
        result = await self.db.execute(stmt)
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


async def get_partner_lead_service(
    db: AsyncSession = Depends(get_db),
) -> PartnerLeadServiceManager:
    return PartnerLeadServiceManager(db)
