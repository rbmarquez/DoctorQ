# DoctorQ-api/src/services/partner_license_service.py
"""
Service para gerenciamento de licenças do programa de parceiros.
"""
import secrets
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db, ORMConfig
from src.models.partner_package import (
    PartnerLicense,
    PartnerLicenseStatus,
    PartnerPackageItem,
)

logger = get_logger(__name__)


class PartnerLicenseService:
    """Service para operações de licenças"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def list_licenses(
        self,
        page: int = 1,
        size: int = 10,
        status: Optional[PartnerLicenseStatus] = None,
        package_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Dict], int]:
        """Listar licenças com filtros"""
        offset = (page - 1) * size

        # Query base com relacionamentos
        query = select(PartnerLicense).options(
            selectinload(PartnerLicense.package_item).selectinload(
                PartnerPackageItem.package
            ),
            selectinload(PartnerLicense.package_item).selectinload(
                PartnerPackageItem.service_definition
            ),
        )

        # Filtros
        filters = []

        if status:
            filters.append(PartnerLicense.status == status.value)

        if package_id:
            # Filtrar por pacote através do package_item
            subquery = (
                select(PartnerPackageItem.id_partner_package_item)
                .where(PartnerPackageItem.id_partner_package == package_id)
            )
            filters.append(PartnerLicense.id_partner_package_item.in_(subquery))

        if search:
            search_filter = or_(
                PartnerLicense.license_key.ilike(f"%{search}%"),
                PartnerLicense.assigned_to.ilike(f"%{search}%"),
                PartnerLicense.assigned_email.ilike(f"%{search}%"),
            )
            filters.append(search_filter)

        if filters:
            query = query.where(and_(*filters))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginação e ordenação
        query = (
            query.order_by(PartnerLicense.created_at.desc())
            .offset(offset)
            .limit(size)
        )

        result = await self.db.execute(query)
        licenses = result.scalars().all()

        # Serializar resultado
        items = []
        for lic in licenses:
            item_data = {
                "id_license": str(lic.id_partner_license),
                "license_key": lic.license_key,
                "status": lic.status,
                "assigned_to": lic.assigned_to,
                "assigned_email": lic.assigned_email,
                "created_at": lic.created_at.isoformat() if lic.created_at else None,
                "activated_at": lic.activated_at.isoformat() if lic.activated_at else None,
                "revoked_at": lic.revoked_at.isoformat() if lic.revoked_at else None,
                "metadata": lic.metadata_json,
            }

            # Adicionar informações do item do pacote
            if lic.package_item:
                item_data["package_item"] = {
                    "id": str(lic.package_item.id_partner_package_item),
                    "quantity": lic.package_item.quantity,
                }

                # Informações do pacote
                if lic.package_item.package:
                    item_data["package"] = {
                        "id": str(lic.package_item.package.id_partner_package),
                        "code": lic.package_item.package.package_code,
                        "name": lic.package_item.package.package_name,
                        "status": lic.package_item.package.status,
                    }

                # Informações do serviço
                if lic.package_item.service_definition:
                    item_data["service"] = {
                        "code": lic.package_item.service_definition.service_code,
                        "name": lic.package_item.service_definition.service_name,
                    }

            items.append(item_data)

        return items, total

    async def get_license(self, license_id: uuid.UUID) -> Optional[Dict]:
        """Buscar licença por ID"""
        query = (
            select(PartnerLicense)
            .options(
                selectinload(PartnerLicense.package_item).selectinload(
                    PartnerPackageItem.package
                ),
                selectinload(PartnerLicense.package_item).selectinload(
                    PartnerPackageItem.service_definition
                ),
            )
            .where(PartnerLicense.id_partner_license == license_id)
        )

        result = await self.db.execute(query)
        license_obj = result.scalar_one_or_none()

        if not license_obj:
            return None

        # Serializar
        data = {
            "id_license": str(license_obj.id_partner_license),
            "license_key": license_obj.license_key,
            "status": license_obj.status,
            "assigned_to": license_obj.assigned_to,
            "assigned_email": license_obj.assigned_email,
            "created_at": license_obj.created_at.isoformat() if license_obj.created_at else None,
            "activated_at": license_obj.activated_at.isoformat() if license_obj.activated_at else None,
            "revoked_at": license_obj.revoked_at.isoformat() if license_obj.revoked_at else None,
            "metadata": license_obj.metadata_json,
        }

        if license_obj.package_item:
            data["package_item"] = {
                "id": str(license_obj.package_item.id_partner_package_item),
                "quantity": license_obj.package_item.quantity,
            }

            if license_obj.package_item.package:
                data["package"] = {
                    "id": str(license_obj.package_item.package.id_partner_package),
                    "code": license_obj.package_item.package.package_code,
                    "name": license_obj.package_item.package.package_name,
                }

            if license_obj.package_item.service_definition:
                data["service"] = {
                    "code": license_obj.package_item.service_definition.service_code,
                    "name": license_obj.package_item.service_definition.service_name,
                }

        return data

    async def assign_license(
        self,
        license_id: uuid.UUID,
        assigned_to: str,
        assigned_email: str,
        metadata: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """Atribuir licença a um usuário"""
        # Buscar licença
        query = select(PartnerLicense).where(
            PartnerLicense.id_partner_license == license_id
        )
        result = await self.db.execute(query)
        license_obj = result.scalar_one_or_none()

        if not license_obj:
            raise ValueError("Licença não encontrada")

        # Verificar se já está atribuída
        if license_obj.status != PartnerLicenseStatus.AVAILABLE.value:
            raise ValueError(f"Licença já está {license_obj.status}")

        # Atualizar
        license_obj.assigned_to = assigned_to
        license_obj.assigned_email = assigned_email
        license_obj.status = PartnerLicenseStatus.ASSIGNED.value
        license_obj.activated_at = datetime.utcnow()

        if metadata:
            current_metadata = license_obj.metadata_json or {}
            current_metadata.update(metadata)
            license_obj.metadata_json = current_metadata

        await self.db.commit()
        await self.db.refresh(license_obj)

        return await self.get_license(license_id)

    async def revoke_license(
        self,
        license_id: uuid.UUID,
        reason: Optional[str] = None,
    ) -> Optional[Dict]:
        """Revogar licença"""
        # Buscar licença
        query = select(PartnerLicense).where(
            PartnerLicense.id_partner_license == license_id
        )
        result = await self.db.execute(query)
        license_obj = result.scalar_one_or_none()

        if not license_obj:
            raise ValueError("Licença não encontrada")

        # Atualizar
        license_obj.status = PartnerLicenseStatus.REVOKED.value
        license_obj.revoked_at = datetime.utcnow()

        if reason:
            metadata = license_obj.metadata_json or {}
            metadata["revoke_reason"] = reason
            metadata["revoked_at"] = datetime.utcnow().isoformat()
            license_obj.metadata_json = metadata

        await self.db.commit()
        await self.db.refresh(license_obj)

        return await self.get_license(license_id)

    async def generate_licenses(
        self,
        package_item_id: uuid.UUID,
        quantity: int,
    ) -> List[Dict]:
        """Gerar licenças para um item de pacote"""
        if quantity <= 0:
            raise ValueError("Quantidade deve ser maior que zero")

        # Verificar se o package_item existe
        query = select(PartnerPackageItem).where(
            PartnerPackageItem.id_partner_package_item == package_item_id
        )
        result = await self.db.execute(query)
        package_item = result.scalar_one_or_none()

        if not package_item:
            raise ValueError("Item do pacote não encontrado")

        # Gerar licenças
        licenses = []
        for _ in range(quantity):
            license_key = self._generate_license_key()

            license_obj = PartnerLicense(
                id_partner_license=uuid.uuid4(),
                id_partner_package_item=package_item_id,
                license_key=license_key,
                status=PartnerLicenseStatus.AVAILABLE.value,
            )
            self.db.add(license_obj)
            licenses.append(license_obj)

        await self.db.commit()

        # Retornar licenças criadas
        result = []
        for lic in licenses:
            await self.db.refresh(lic)
            result.append({
                "id_license": str(lic.id_partner_license),
                "license_key": lic.license_key,
                "status": lic.status,
                "created_at": lic.created_at.isoformat() if lic.created_at else None,
            })

        return result

    def _generate_license_key(self) -> str:
        """Gerar chave de licença única"""
        # Formato: ESTQ-XXXX-XXXX-XXXX-XXXX
        parts = []
        for _ in range(4):
            part = secrets.token_hex(2).upper()
            parts.append(part)

        return f"ESTQ-{'-'.join(parts)}"

    async def get_license_stats(self, package_id: Optional[uuid.UUID] = None) -> Dict:
        """Obter estatísticas de licenças"""
        # Query base
        base_query = select(PartnerLicense)

        if package_id:
            # Filtrar por pacote
            subquery = (
                select(PartnerPackageItem.id_partner_package_item)
                .where(PartnerPackageItem.id_partner_package == package_id)
            )
            base_query = base_query.where(
                PartnerLicense.id_partner_package_item.in_(subquery)
            )

        # Total
        total_query = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(total_query)
        total = total_result.scalar() or 0

        # Por status
        stats_by_status = {}
        for status in PartnerLicenseStatus:
            status_query = select(func.count()).select_from(
                base_query.where(PartnerLicense.status == status.value).subquery()
            )
            status_result = await self.db.execute(status_query)
            stats_by_status[status.value] = status_result.scalar() or 0

        return {
            "total": total,
            "by_status": stats_by_status,
        }


# Dependency
async def get_partner_license_service() -> PartnerLicenseService:
    """Dependency para obter o service de licenças"""
    async with get_db() as session:
        yield PartnerLicenseService(session)
