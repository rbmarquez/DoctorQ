# src/services/partner_service.py
import secrets
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.partner_lead import (
    PartnerLead,
    PartnerLeadCreate,
    PartnerLeadStatus,
    PartnerLeadStatusUpdate,
    PartnerServiceDefinition,
)
from src.models.partner_package import (
    PartnerLicense,
    PartnerLicenseStatus,
    PartnerPackage,
    PartnerPackageCreate,
    PartnerPackageItem,
    PartnerPackageItemStatus,
    PartnerPackageStatus,
    PartnerPackageStatusUpdate,
)

logger = get_logger(__name__)


class PartnerLeadService:
    """Service para operações com leads de parceiros"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_lead(self, lead_data: PartnerLeadCreate) -> PartnerLead:
        """Criar um novo lead de parceiro"""
        try:
            # Verificar se já existe lead com o mesmo email
            existing_lead = await self.get_lead_by_email(lead_data.contact_email)
            if existing_lead:
                raise ValueError(
                    f"Lead com email '{lead_data.contact_email}' já existe"
                )

            # Criar lead
            db_lead = PartnerLead(
                partner_type=lead_data.partner_type.value,
                contact_name=lead_data.contact_name,
                contact_email=lead_data.contact_email,
                contact_phone=lead_data.contact_phone,
                business_name=lead_data.business_name,
                cnpj=lead_data.cnpj,
                city=lead_data.city,
                state=lead_data.state,
                services_description=lead_data.services,
                differentiators=lead_data.differentiators,
                team_size=lead_data.team_size,
                catalog_link=lead_data.catalog_link,
                notes=lead_data.notes,
                status=PartnerLeadStatus.PENDING.value,
            )

            self.db.add(db_lead)
            await self.db.flush()

            # Adicionar serviços selecionados
            for service_item in lead_data.selected_services:
                # Buscar definição do serviço
                stmt_service = select(PartnerServiceDefinition).where(
                    PartnerServiceDefinition.service_code == service_item.service_code
                )
                result_service = await self.db.execute(stmt_service)
                service_def = result_service.scalar_one_or_none()

                if not service_def:
                    raise ValueError(
                        f"Serviço '{service_item.service_code}' não encontrado"
                    )

                # Criar relação lead-serviço
                lead_service = PartnerLeadService(
                    id_partner_lead=db_lead.id_partner_lead,
                    id_service=service_def.id_service,
                    service_name=service_def.service_name,
                    price_label_snapshot=service_def.price_label,
                )
                self.db.add(lead_service)

            await self.db.commit()
            await self.db.refresh(db_lead)

            logger.info(
                f"Lead criado: {db_lead.business_name} (ID: {db_lead.id_partner_lead})"
            )
            return db_lead

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar lead: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar lead: {str(e)}") from e

    async def get_lead_by_id(self, lead_id: uuid.UUID) -> Optional[PartnerLead]:
        """Obter um lead por ID"""
        try:
            stmt = (
                select(PartnerLead)
                .where(PartnerLead.id_partner_lead == lead_id)
                .options(selectinload(PartnerLead.services))
            )
            result = await self.db.execute(stmt)
            lead = result.scalar_one_or_none()

            if not lead:
                logger.debug(f"Lead não encontrado: {lead_id}")

            return lead

        except Exception as e:
            logger.error(f"Erro ao buscar lead por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar lead: {str(e)}") from e

    async def get_lead_by_email(self, email: str) -> Optional[PartnerLead]:
        """Obter um lead por email"""
        try:
            stmt = select(PartnerLead).where(PartnerLead.contact_email == email)
            result = await self.db.execute(stmt)
            lead = result.scalar_one_or_none()
            return lead

        except Exception as e:
            logger.error(f"Erro ao buscar lead por email: {str(e)}")
            raise RuntimeError(f"Erro ao buscar lead por email: {str(e)}") from e

    async def list_leads(
        self,
        page: int = 1,
        size: int = 10,
        status_filter: Optional[str] = None,
        partner_type_filter: Optional[str] = None,
        search: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[PartnerLead], int]:
        """Listar leads com paginação e filtros"""
        try:
            # Base query
            stmt = select(PartnerLead).options(selectinload(PartnerLead.services))

            # Aplicar filtros
            filters = []
            if status_filter:
                filters.append(PartnerLead.status == status_filter)
            if partner_type_filter:
                filters.append(PartnerLead.partner_type == partner_type_filter)
            if search:
                search_pattern = f"%{search}%"
                filters.append(
                    or_(
                        PartnerLead.business_name.ilike(search_pattern),
                        PartnerLead.contact_name.ilike(search_pattern),
                        PartnerLead.contact_email.ilike(search_pattern),
                    )
                )

            if filters:
                stmt = stmt.where(and_(*filters))

            # Count total
            count_stmt = select(func.count()).select_from(stmt.alias())
            count_result = await self.db.execute(count_stmt)
            total = count_result.scalar() or 0

            # Ordenação
            order_column = getattr(PartnerLead, order_by, PartnerLead.created_at)
            if order_desc:
                stmt = stmt.order_by(desc(order_column))
            else:
                stmt = stmt.order_by(order_column)

            # Paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            leads = result.scalars().all()

            return list(leads), total

        except Exception as e:
            logger.error(f"Erro ao listar leads: {str(e)}")
            raise RuntimeError(f"Erro ao listar leads: {str(e)}") from e

    async def update_status(
        self, lead_id: uuid.UUID, status_update: PartnerLeadStatusUpdate
    ) -> Optional[PartnerLead]:
        """Atualizar status de um lead"""
        try:
            lead = await self.get_lead_by_id(lead_id)
            if not lead:
                return None

            lead.status = status_update.status.value
            if status_update.notes:
                lead.notes = status_update.notes
            lead.updated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(lead)

            logger.info(
                f"Status do lead atualizado: {lead.business_name} -> {status_update.status.value}"
            )
            return lead

        except Exception as e:
            logger.error(f"Erro ao atualizar status do lead: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao atualizar status do lead: {str(e)}") from e

    async def delete_lead(self, lead_id: uuid.UUID) -> bool:
        """Deletar um lead"""
        try:
            lead = await self.get_lead_by_id(lead_id)
            if not lead:
                return False

            await self.db.delete(lead)
            await self.db.commit()

            logger.info(f"Lead deletado: {lead.business_name} (ID: {lead_id})")
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar lead: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar lead: {str(e)}") from e


class PartnerPackageService:
    """Service para operações com packages de parceiros"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_package(
        self, package_data: PartnerPackageCreate
    ) -> PartnerPackage:
        """Criar um novo package de parceiro"""
        try:
            # Verificar se já existe package com o mesmo código
            existing_package = await self.get_package_by_code(package_data.package_code)
            if existing_package:
                raise ValueError(
                    f"Package com código '{package_data.package_code}' já existe"
                )

            # Verificar se lead existe (se fornecido)
            if package_data.lead_id:
                stmt_lead = select(PartnerLead).where(
                    PartnerLead.id_partner_lead == package_data.lead_id
                )
                result_lead = await self.db.execute(stmt_lead)
                lead = result_lead.scalar_one_or_none()
                if not lead:
                    raise ValueError(f"Lead '{package_data.lead_id}' não encontrado")

            # Criar package
            db_package = PartnerPackage(
                id_partner_lead=package_data.lead_id,
                package_code=package_data.package_code,
                package_name=package_data.package_name,
                billing_cycle=package_data.billing_cycle,
                total_value=package_data.total_value,
                notes=package_data.notes,
                status=PartnerPackageStatus.DRAFT.value,
            )

            self.db.add(db_package)
            await self.db.flush()

            # Adicionar itens do package
            for item_data in package_data.items:
                # Buscar definição do serviço
                stmt_service = select(PartnerServiceDefinition).where(
                    PartnerServiceDefinition.service_code == item_data.service_code
                )
                result_service = await self.db.execute(stmt_service)
                service_def = result_service.scalar_one_or_none()

                if not service_def:
                    raise ValueError(
                        f"Serviço '{item_data.service_code}' não encontrado"
                    )

                # Criar item do package
                package_item = PartnerPackageItem(
                    id_partner_package=db_package.id_partner_package,
                    id_service=service_def.id_service,
                    quantity=item_data.quantity,
                    unit_price_value=service_def.price_value,
                    unit_price_label=service_def.price_label,
                    status=PartnerPackageItemStatus.PENDING.value,
                )
                self.db.add(package_item)

            await self.db.commit()
            await self.db.refresh(db_package)

            logger.info(
                f"Package criado: {db_package.package_name} (ID: {db_package.id_partner_package})"
            )
            return db_package

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar package: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar package: {str(e)}") from e

    async def get_package_by_id(
        self, package_id: uuid.UUID
    ) -> Optional[PartnerPackage]:
        """Obter um package por ID"""
        try:
            stmt = (
                select(PartnerPackage)
                .where(PartnerPackage.id_partner_package == package_id)
                .options(
                    selectinload(PartnerPackage.items).selectinload(
                        PartnerPackageItem.licenses
                    ),
                    selectinload(PartnerPackage.partner_lead),
                )
            )
            result = await self.db.execute(stmt)
            package = result.scalar_one_or_none()

            if not package:
                logger.debug(f"Package não encontrado: {package_id}")

            return package

        except Exception as e:
            logger.error(f"Erro ao buscar package por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar package: {str(e)}") from e

    async def get_package_by_code(self, code: str) -> Optional[PartnerPackage]:
        """Obter um package por código"""
        try:
            stmt = select(PartnerPackage).where(PartnerPackage.package_code == code)
            result = await self.db.execute(stmt)
            package = result.scalar_one_or_none()
            return package

        except Exception as e:
            logger.error(f"Erro ao buscar package por código: {str(e)}")
            raise RuntimeError(f"Erro ao buscar package por código: {str(e)}") from e

    async def list_packages(
        self,
        page: int = 1,
        size: int = 10,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[PartnerPackage], int]:
        """Listar packages com paginação e filtros"""
        try:
            # Base query
            stmt = select(PartnerPackage).options(
                selectinload(PartnerPackage.items).selectinload(
                    PartnerPackageItem.licenses
                ),
                selectinload(PartnerPackage.partner_lead),
            )

            # Aplicar filtros
            filters = []
            if status_filter:
                filters.append(PartnerPackage.status == status_filter)
            if search:
                search_pattern = f"%{search}%"
                filters.append(
                    or_(
                        PartnerPackage.package_name.ilike(search_pattern),
                        PartnerPackage.package_code.ilike(search_pattern),
                    )
                )

            if filters:
                stmt = stmt.where(and_(*filters))

            # Count total
            count_stmt = select(func.count()).select_from(stmt.alias())
            count_result = await self.db.execute(count_stmt)
            total = count_result.scalar() or 0

            # Ordenação
            order_column = getattr(PartnerPackage, order_by, PartnerPackage.created_at)
            if order_desc:
                stmt = stmt.order_by(desc(order_column))
            else:
                stmt = stmt.order_by(order_column)

            # Paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            packages = result.scalars().all()

            return list(packages), total

        except Exception as e:
            logger.error(f"Erro ao listar packages: {str(e)}")
            raise RuntimeError(f"Erro ao listar packages: {str(e)}") from e

    async def update_status(
        self, package_id: uuid.UUID, status_update: PartnerPackageStatusUpdate
    ) -> Optional[PartnerPackage]:
        """Atualizar status de um package"""
        try:
            package = await self.get_package_by_id(package_id)
            if not package:
                return None

            old_status = package.status
            package.status = status_update.status.value
            if status_update.notes:
                package.notes = status_update.notes
            package.updated_at = datetime.utcnow()

            # Se estiver ativando, definir data de ativação
            if (
                status_update.status == PartnerPackageStatus.ACTIVE
                and old_status != PartnerPackageStatus.ACTIVE.value
            ):
                package.activated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(package)

            logger.info(
                f"Status do package atualizado: {package.package_name} -> {status_update.status.value}"
            )
            return package

        except Exception as e:
            logger.error(f"Erro ao atualizar status do package: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao atualizar status do package: {str(e)}") from e

    async def delete_package(self, package_id: uuid.UUID) -> bool:
        """Deletar um package"""
        try:
            package = await self.get_package_by_id(package_id)
            if not package:
                return False

            await self.db.delete(package)
            await self.db.commit()

            logger.info(
                f"Package deletado: {package.package_name} (ID: {package_id})"
            )
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar package: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar package: {str(e)}") from e


class PartnerLicenseService:
    """Service para operações com licenças de parceiros"""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_license_key(self) -> str:
        """Gerar chave de licença única"""
        # Formato: DOCTORQ-XXXX-XXXX-XXXX-XXXX
        segments = [secrets.token_hex(2).upper() for _ in range(4)]
        return f"DOCTORQ-{'-'.join(segments)}"

    async def generate_licenses(
        self, package_item_id: uuid.UUID, quantity: int
    ) -> List[PartnerLicense]:
        """Gerar licenças para um item de package"""
        try:
            # Verificar se package item existe
            stmt_item = select(PartnerPackageItem).where(
                PartnerPackageItem.id_partner_package_item == package_item_id
            )
            result_item = await self.db.execute(stmt_item)
            package_item = result_item.scalar_one_or_none()

            if not package_item:
                raise ValueError(f"Package item '{package_item_id}' não encontrado")

            # Gerar licenças
            licenses = []
            for _ in range(quantity):
                license_key = self._generate_license_key()

                # Garantir unicidade
                while await self.get_license_by_key(license_key):
                    license_key = self._generate_license_key()

                license_obj = PartnerLicense(
                    id_partner_package_item=package_item_id,
                    license_key=license_key,
                    status=PartnerLicenseStatus.AVAILABLE.value,
                )
                self.db.add(license_obj)
                licenses.append(license_obj)

            await self.db.commit()

            logger.info(
                f"{quantity} licenças geradas para package item {package_item_id}"
            )
            return licenses

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao gerar licenças: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao gerar licenças: {str(e)}") from e

    async def get_license_by_key(self, license_key: str) -> Optional[PartnerLicense]:
        """Obter licença por chave"""
        try:
            stmt = select(PartnerLicense).where(
                PartnerLicense.license_key == license_key
            )
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error(f"Erro ao buscar licença por chave: {str(e)}")
            raise RuntimeError(f"Erro ao buscar licença: {str(e)}") from e

    async def activate_license(
        self, license_key: str, assigned_to: str, assigned_email: str
    ) -> Optional[PartnerLicense]:
        """Ativar uma licença"""
        try:
            license_obj = await self.get_license_by_key(license_key)
            if not license_obj:
                return None

            if license_obj.status != PartnerLicenseStatus.AVAILABLE.value:
                raise ValueError(
                    f"Licença '{license_key}' não está disponível para ativação"
                )

            license_obj.status = PartnerLicenseStatus.ASSIGNED.value
            license_obj.assigned_to = assigned_to
            license_obj.assigned_email = assigned_email
            license_obj.activated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(license_obj)

            logger.info(f"Licença ativada: {license_key} -> {assigned_email}")
            return license_obj

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao ativar licença: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao ativar licença: {str(e)}") from e

    async def revoke_license(self, license_key: str) -> Optional[PartnerLicense]:
        """Revogar uma licença"""
        try:
            license_obj = await self.get_license_by_key(license_key)
            if not license_obj:
                return None

            license_obj.status = PartnerLicenseStatus.REVOKED.value
            license_obj.revoked_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(license_obj)

            logger.info(f"Licença revogada: {license_key}")
            return license_obj

        except Exception as e:
            logger.error(f"Erro ao revogar licença: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao revogar licença: {str(e)}") from e


class PartnerStatisticsService:
    """Service para estatísticas do sistema de parceiros"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_stats(self) -> dict:
        """Calcular estatísticas gerais do sistema de parceiros"""
        try:
            # Total de leads por status
            stmt_leads = (
                select(PartnerLead.status, func.count(PartnerLead.id_partner_lead))
                .group_by(PartnerLead.status)
            )
            result_leads = await self.db.execute(stmt_leads)
            leads_by_status = dict(result_leads.all())

            # Total de packages por status
            stmt_packages = (
                select(
                    PartnerPackage.status, func.count(PartnerPackage.id_partner_package)
                )
                .group_by(PartnerPackage.status)
            )
            result_packages = await self.db.execute(stmt_packages)
            packages_by_status = dict(result_packages.all())

            # Total de licenças por status
            stmt_licenses = (
                select(
                    PartnerLicense.status, func.count(PartnerLicense.id_partner_license)
                )
                .group_by(PartnerLicense.status)
            )
            result_licenses = await self.db.execute(stmt_licenses)
            licenses_by_status = dict(result_licenses.all())

            # Taxa de conversão (leads aprovados / total de leads)
            total_leads = sum(leads_by_status.values())
            approved_leads = leads_by_status.get(PartnerLeadStatus.APPROVED.value, 0)
            conversion_rate = (
                (approved_leads / total_leads * 100) if total_leads > 0 else 0
            )

            # Receita total (packages ativos)
            stmt_revenue = select(
                func.sum(PartnerPackage.total_value)
            ).where(PartnerPackage.status == PartnerPackageStatus.ACTIVE.value)
            result_revenue = await self.db.execute(stmt_revenue)
            total_revenue = result_revenue.scalar() or Decimal("0.00")

            return {
                "leads": {
                    "total": total_leads,
                    "by_status": leads_by_status,
                },
                "packages": {
                    "total": sum(packages_by_status.values()),
                    "by_status": packages_by_status,
                },
                "licenses": {
                    "total": sum(licenses_by_status.values()),
                    "by_status": licenses_by_status,
                },
                "conversion_rate": round(conversion_rate, 2),
                "total_revenue": float(total_revenue),
            }

        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas: {str(e)}")
            raise RuntimeError(f"Erro ao calcular estatísticas: {str(e)}") from e


# Dependency Injection functions
async def get_partner_lead_service(db: AsyncSession = Depends(get_db)):
    """Dependency injection para PartnerLeadService"""
    return PartnerLeadService(db)


async def get_partner_package_service(db: AsyncSession = Depends(get_db)):
    """Dependency injection para PartnerPackageService"""
    return PartnerPackageService(db)


async def get_partner_license_service(db: AsyncSession = Depends(get_db)):
    """Dependency injection para PartnerLicenseService"""
    return PartnerLicenseService(db)


async def get_partner_statistics_service(db: AsyncSession = Depends(get_db)):
    """Dependency injection para PartnerStatisticsService"""
    return PartnerStatisticsService(db)
