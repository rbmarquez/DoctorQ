# src/routes/partner_upgrade.py
"""Rotas para UC-PARC-007 (Múltiplas Unidades) e UC-PARC-008 (Upgrade de Plano)."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.models.partner_package import (
    ClinicaUnitCreate,
    ClinicaUnitResponse,
    PackageUpgradeRequest,
    ProfissionalClinicaLink,
    ProrataCalculation,
)
from src.services.partner_upgrade_service import PartnerUpgradeService

router = APIRouter(prefix="/parceiros", tags=["Parceiros - Upgrade & Unidades"])


# ============================================================================
# UC-PARC-007: Adicionar Nova Unidade/Clínica
# ============================================================================


@router.post(
    "/clinicas/unidades/",
    response_model=ClinicaUnitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[UC-PARC-007] Adicionar Nova Unidade/Clínica",
    description="""
    Cria uma nova unidade/clínica vinculada a uma empresa (parceiro).

    **Regras de Negócio:**
    - RN-PARC-044: Empresa pode ter unidades ilimitadas (gratuito)
    - RN-PARC-045: Licenças pertencem à empresa, não à unidade
    - RN-PARC-046: Profissionais podem atuar em múltiplas unidades
    - RN-PARC-047: 1 profissional = 1 licença (independente do número de unidades)
    """,
)
async def create_clinic_unit(
    data: ClinicaUnitCreate,
    db: AsyncSession = Depends(get_db),
) -> ClinicaUnitResponse:
    """Criar nova unidade/clínica."""
    service = PartnerUpgradeService(db)
    return await service.create_clinic_unit(data)


@router.post(
    "/clinicas/vincular-profissional/",
    status_code=status.HTTP_200_OK,
    summary="[UC-PARC-007] Vincular Profissional a Unidade",
    description="""
    Vincula um profissional existente a uma unidade adicional.

    **Regras de Negócio:**
    - RN-PARC-047: 1 profissional = 1 licença (pode atuar em N unidades)
    - RN-PARC-048: Profissional pode ser vinculado a múltiplas unidades
    """,
)
async def link_professional_to_unit(
    data: ProfissionalClinicaLink,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Vincular profissional a uma unidade."""
    service = PartnerUpgradeService(db)
    return await service.link_professional_to_unit(data)


# ============================================================================
# UC-PARC-008: Fazer Upgrade de Plano (Self-Service)
# ============================================================================


@router.get(
    "/pacotes/{id_package}/calcular-upgrade/",
    response_model=ProrataCalculation,
    summary="[UC-PARC-008] Calcular Valor Pro-rata para Upgrade",
    description="""
    Calcula o valor pro-rata a ser pago em um upgrade de plano.

    **Regras de Negócio:**
    - RN-PARC-049: Cálculo proporcional aos dias restantes no ciclo
    - RN-PARC-050: Ciclo padrão = 30 dias (mensal)
    - RN-PARC-051: Credita valor proporcional do plano atual

    **Fórmula:**
    ```
    Valor Pro-rata Novo = (Valor Plano Novo / Dias Ciclo) * Dias Restantes
    Crédito Pro-rata Atual = (Valor Plano Atual / Dias Ciclo) * Dias Restantes
    Valor a Pagar = Valor Pro-rata Novo - Crédito Pro-rata Atual
    ```
    """,
)
async def calculate_upgrade_prorata(
    id_package: uuid.UUID,
    id_service_new: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProrataCalculation:
    """Calcular valor pro-rata para upgrade."""
    service = PartnerUpgradeService(db)
    try:
        return await service.calculate_prorata(id_package, id_service_new)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/pacotes/{id_package}/upgrade/",
    status_code=status.HTTP_200_OK,
    summary="[UC-PARC-008] Executar Upgrade de Plano",
    description="""
    Executa o upgrade de plano com cobrança pro-rata.

    **Fluxo:**
    1. Calcula valor pro-rata
    2. Aguarda confirmação do parceiro (se houver valor a pagar)
    3. Marca plano atual como 'superseded'
    4. Cria novo item de plano no pacote
    5. Registra histórico da mudança
    6. Gera licenças adicionais (se aplicável)

    **Regras de Negócio:**
    - RN-PARC-052: Upgrade é imediato após confirmação
    - RN-PARC-053: Histórico completo de mudanças é mantido
    - RN-PARC-054: Plano anterior fica como 'superseded'
    - RN-PARC-055: Não pode fazer downgrade se houver licenças em uso
    """,
)
async def execute_package_upgrade(
    id_package: uuid.UUID,
    request: PackageUpgradeRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Executar upgrade de plano."""
    service = PartnerUpgradeService(db)
    try:
        return await service.execute_upgrade(id_package, request, id_user=None)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/pacotes/{id_package}/historico/",
    response_model=List[dict],
    summary="[UC-PARC-008] Listar Histórico de Mudanças do Pacote",
    description="""
    Lista o histórico completo de mudanças de um pacote (upgrades, downgrades, add-ons).

    **Informações Retornadas:**
    - Tipo de mudança (upgrade, downgrade, add_licenses, add_addon, remove_addon)
    - Plano anterior e novo
    - Valor pro-rata cobrado/creditado
    - Data da mudança
    - Motivo/Observações
    """,
)
async def list_package_history(
    id_package: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Listar histórico de mudanças do pacote."""
    service = PartnerUpgradeService(db)
    return await service.list_package_history(id_package)
