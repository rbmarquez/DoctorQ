# src/services/partner_upgrade_service.py
"""Service para UC-PARC-007 (Adicionar Unidade) e UC-PARC-008 (Upgrade de Plano)."""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.models.clinica_orm import ClinicaORM
from src.models.partner_lead import PartnerServiceDefinition
from src.models.partner_package import (
    ClinicaUnitCreate,
    ClinicaUnitResponse,
    PackageChangeType,
    PackageUpgradeRequest,
    PartnerPackage,
    PartnerPackageHistory,
    PartnerPackageItem,
    PartnerPackageItemStatus,
    ProfissionalClinica,
    ProfissionalClinicaLink,
    ProrataCalculation,
)
from src.models.profissional_clinica_orm import ProfissionalClinicaORM

logger = get_logger(__name__)


class PartnerUpgradeService:
    """Service para upgrade de planos e gestão de múltiplas unidades."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========================================================================
    # UC-PARC-007: Adicionar Nova Unidade/Clínica
    # ========================================================================

    async def create_clinic_unit(
        self, data: ClinicaUnitCreate
    ) -> ClinicaUnitResponse:
        """
        Criar nova unidade/clínica vinculada a uma empresa.

        RN-PARC-044: Unidades ilimitadas por empresa.
        RN-PARC-045: Licenças são da empresa, não da unidade específica.
        """
        try:
            # Criar clínica
            clinica = ClinicaORM(
                id_empresa=data.id_empresa,
                nm_clinica=data.nm_clinica,
                ds_clinica=data.ds_clinica,
                nr_cnpj=data.nr_cnpj,
                ds_email=data.ds_email,
                nr_telefone=data.nr_telefone,
                nr_whatsapp=data.nr_whatsapp,
                ds_endereco=data.ds_endereco,
                nr_numero=data.nr_numero,
                ds_complemento=data.ds_complemento,
                nm_bairro=data.nm_bairro,
                nm_cidade=data.nm_cidade,
                nm_estado=data.nm_estado,
                nr_cep=data.nr_cep,
                nm_responsavel=data.nm_responsavel,
                st_ativo=True,
            )
            self.db.add(clinica)
            await self.db.flush()

            # Vincular profissionais (RN-PARC-046)
            for id_prof in data.profissionais_ids:
                vinculo = ProfissionalClinica(
                    id_profissional=id_prof,
                    id_clinica=clinica.id_clinica,
                    st_ativo="S",
                )
                self.db.add(vinculo)

            await self.db.commit()
            await self.db.refresh(clinica)

            # Contar profissionais
            stmt = select(func.count()).where(
                ProfissionalClinica.id_clinica == clinica.id_clinica,
                ProfissionalClinica.st_ativo == "S",
            )
            result = await self.db.execute(stmt)
            qt_profs = result.scalar() or 0

            return ClinicaUnitResponse(
                id_clinica=clinica.id_clinica,
                id_empresa=clinica.id_empresa,
                nm_clinica=clinica.nm_clinica,
                nm_cidade=clinica.nm_cidade,
                nm_estado=clinica.nm_estado,
                nr_telefone=clinica.nr_telefone,
                st_ativo=bool(clinica.st_ativo),
                qt_profissionais=qt_profs,
                dt_criacao=clinica.dt_criacao,
            )

        except Exception as exc:
            logger.error(f"Erro ao criar unidade: {exc}", exc_info=True)
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar unidade: {str(exc)}") from exc

    async def link_professional_to_unit(
        self, data: ProfissionalClinicaLink
    ) -> dict:
        """
        Vincular profissional a uma unidade adicional.

        RN-PARC-047: 1 profissional = 1 licença (pode atuar em N unidades).
        """
        try:
            # Verificar se vínculo já existe
            stmt = select(ProfissionalClinica).where(
                ProfissionalClinica.id_profissional == data.id_profissional,
                ProfissionalClinica.id_clinica == data.id_clinica,
            )
            result = await self.db.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                if existing.st_ativo == "N":
                    existing.st_ativo = "S"
                    existing.ds_observacoes = data.ds_observacoes
                    await self.db.commit()
                    return {"status": "reativado", "id": existing.id_profissional_clinica}
                else:
                    return {"status": "ja_existe", "id": existing.id_profissional_clinica}

            # Criar novo vínculo
            vinculo = ProfissionalClinica(
                id_profissional=data.id_profissional,
                id_clinica=data.id_clinica,
                st_ativo="S",
                ds_observacoes=data.ds_observacoes,
            )
            self.db.add(vinculo)
            await self.db.commit()
            await self.db.refresh(vinculo)

            return {"status": "criado", "id": vinculo.id_profissional_clinica}

        except Exception as exc:
            logger.error(f"Erro ao vincular profissional: {exc}", exc_info=True)
            await self.db.rollback()
            raise RuntimeError(f"Erro ao vincular profissional: {str(exc)}") from exc

    # ========================================================================
    # UC-PARC-008: Fazer Upgrade de Plano (Self-Service)
    # ========================================================================

    async def calculate_prorata(
        self, id_package: uuid.UUID, id_service_new: uuid.UUID
    ) -> ProrataCalculation:
        """
        Calcular valor pro-rata para upgrade de plano.

        RN-PARC-049: Valor pro-rata = (valor_novo - crédito_atual) proporcional.
        RN-PARC-050: Ciclo padrão = 30 dias.
        """
        # Buscar pacote atual
        stmt = (
            select(PartnerPackage)
            .where(PartnerPackage.id_partner_package == id_package)
            .options(selectinload(PartnerPackage.items).selectinload(PartnerPackageItem.service_definition))
        )
        result = await self.db.execute(stmt)
        package = result.scalar_one_or_none()

        if not package:
            raise ValueError("Pacote não encontrado")

        # Buscar plano atual (primeiro item não-addon ativo)
        current_item = next(
            (item for item in package.items if item.status == "active" and not item.service_definition.fg_is_addon),
            None,
        )
        if not current_item:
            raise ValueError("Plano atual não encontrado no pacote")

        # Buscar plano novo
        stmt_new = select(PartnerServiceDefinition).where(
            PartnerServiceDefinition.id_service == id_service_new
        )
        result_new = await self.db.execute(stmt_new)
        service_new = result_new.scalar_one_or_none()

        if not service_new:
            raise ValueError("Serviço novo não encontrado")

        # Calcular dias restantes (RN-PARC-051)
        dt_now = datetime.now()
        dt_activation = package.activated_at or package.created_at

        # Ciclo de cobrança (assumir mensal = 30 dias)
        dias_ciclo = 30
        if package.nm_billing_cycle == "quarterly":
            dias_ciclo = 90
        elif package.nm_billing_cycle == "semiannual":
            dias_ciclo = 180
        elif package.nm_billing_cycle == "annual":
            dias_ciclo = 365

        # Calcular próxima renovação
        dt_next_renewal = dt_activation + timedelta(days=dias_ciclo)
        dias_restantes = (dt_next_renewal - dt_now).days

        if dias_restantes < 0:
            dias_restantes = 0

        # Valores
        vl_atual = float(current_item.service_definition.vl_preco_base or 0)
        vl_novo = float(service_new.vl_preco_base or 0)

        # Cálculos pro-rata (RN-PARC-049)
        vl_proporcional_novo = (vl_novo / dias_ciclo) * dias_restantes
        vl_credito_atual = (vl_atual / dias_ciclo) * dias_restantes
        vl_a_pagar = vl_proporcional_novo - vl_credito_atual

        # Garantir que não seja negativo
        if vl_a_pagar < 0:
            vl_a_pagar = 0

        explicacao = (
            f"Valor Proporcional do Plano Novo ({dias_restantes} dias): R$ {vl_proporcional_novo:.2f}\n"
            f"Crédito Proporcional do Plano Atual ({dias_restantes} dias): R$ {vl_credito_atual:.2f}\n"
            f"Valor a Pagar no Upgrade: R$ {vl_a_pagar:.2f}"
        )

        return ProrataCalculation(
            plano_atual=current_item.service_definition.nm_service,
            plano_novo=service_new.nm_service,
            vl_plano_atual=vl_atual,
            vl_plano_novo=vl_novo,
            dt_upgrade=dt_now,
            qt_dias_restantes=dias_restantes,
            qt_dias_ciclo=dias_ciclo,
            vl_proporcional_novo=vl_proporcional_novo,
            vl_credito_atual=vl_credito_atual,
            vl_a_pagar=vl_a_pagar,
            ds_explicacao=explicacao,
        )

    async def execute_upgrade(
        self, id_package: uuid.UUID, request: PackageUpgradeRequest, id_user: Optional[uuid.UUID] = None
    ) -> dict:
        """
        Executar upgrade de plano com cálculo pro-rata.

        RN-PARC-052: Upgrade imediato após confirmação.
        RN-PARC-053: Histórico completo de mudanças.
        """
        try:
            # Calcular pro-rata
            prorata = await self.calculate_prorata(id_package, request.id_service_new)

            if not request.confirm_prorata and prorata.vl_a_pagar > 0:
                return {
                    "status": "aguardando_confirmacao",
                    "prorata": prorata.model_dump(),
                    "message": f"Upgrade requer pagamento de R$ {prorata.vl_a_pagar:.2f}. Confirme para prosseguir.",
                }

            # Buscar pacote
            stmt = (
                select(PartnerPackage)
                .where(PartnerPackage.id_partner_package == id_package)
                .options(selectinload(PartnerPackage.items).selectinload(PartnerPackageItem.service_definition))
            )
            result = await self.db.execute(stmt)
            package = result.scalar_one_or_none()

            if not package:
                raise ValueError("Pacote não encontrado")

            # Buscar item atual
            current_item = next(
                (item for item in package.items if item.status == "active" and not item.service_definition.fg_is_addon),
                None,
            )
            if not current_item:
                raise ValueError("Plano atual não encontrado")

            # Buscar serviço novo
            stmt_new = select(PartnerServiceDefinition).where(
                PartnerServiceDefinition.id_service == request.id_service_new
            )
            result_new = await self.db.execute(stmt_new)
            service_new = result_new.scalar_one_or_none()

            if not service_new:
                raise ValueError("Serviço novo não encontrado")

            # Marcar item atual como superseded (RN-PARC-054)
            current_item.nm_status = PackageItemStatus.SUPERSEDED.value
            current_item.ds_metadata = current_item.ds_metadata or {}
            current_item.ds_metadata["superseded_at"] = datetime.now().isoformat()

            # Criar novo item
            new_item = PartnerPackageItem(
                id_partner_package=id_package,
                id_service=request.id_service_new,
                qt_licenses=service_new.qt_max_licenses or current_item.qt_licenses,
                vl_unitario=service_new.vl_preco_base,
                ds_preco_label=f"R$ {service_new.vl_preco_base:.2f}/mês",
                nm_status=PackageItemStatus.ACTIVE.value,
            )
            self.db.add(new_item)

            # Atualizar valor total do pacote
            package.vl_total = service_new.vl_preco_base
            package.dt_atualizacao = datetime.now()

            # Criar registro no histórico (RN-PARC-053)
            history = PartnerPackageHistory(
                id_partner_package=id_package,
                id_service_old=current_item.id_service,
                id_service_new=request.id_service_new,
                tp_change=PackageChangeType.UPGRADE.value,
                vl_prorata_charged=Decimal(str(prorata.vl_a_pagar)),
                qt_dias_restantes=prorata.qt_dias_restantes,
                ds_reason=request.ds_reason,
                id_user_action=id_user,
            )
            self.db.add(history)

            await self.db.commit()

            return {
                "status": "upgrade_concluido",
                "plano_anterior": prorata.plano_atual,
                "plano_novo": prorata.plano_novo,
                "vl_cobrado": prorata.vl_a_pagar,
                "message": f"Upgrade realizado com sucesso! Plano alterado de '{prorata.plano_atual}' para '{prorata.plano_novo}'.",
            }

        except Exception as exc:
            logger.error(f"Erro ao executar upgrade: {exc}", exc_info=True)
            await self.db.rollback()
            raise RuntimeError(f"Erro ao executar upgrade: {str(exc)}") from exc

    async def list_package_history(self, id_package: uuid.UUID) -> List[dict]:
        """Listar histórico de mudanças de um pacote."""
        stmt = (
            select(PartnerPackageHistory)
            .where(PartnerPackageHistory.id_partner_package == id_package)
            .order_by(PartnerPackageHistory.dt_change.desc())
        )
        result = await self.db.execute(stmt)
        history_items = result.scalars().all()

        return [
            {
                "id_history": str(item.id_history),
                "tp_change": item.tp_change,
                "vl_prorata_charged": float(item.vl_prorata_charged) if item.vl_prorata_charged else None,
                "qt_dias_restantes": item.qt_dias_restantes,
                "dt_change": item.dt_change.isoformat(),
                "ds_reason": item.ds_reason,
            }
            for item in history_items
        ]
