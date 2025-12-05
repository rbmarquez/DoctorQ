"""
Rotas para Configuração de Telas por Plano

IMPORTANTE: Rotas específicas devem vir ANTES de rotas com path parameters
para evitar conflitos de matching no FastAPI.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import ORMConfig
from src.models.plano_tela_config import (
    PlanoTelaConfigBulkCreate,
    PlanoTelaConfigBulkResponse,
    PlanoTelaConfigORM,
    PlanoTelaConfigResponse,
    TelasPermitidasResponse,
)
from src.models.partner_lead import PartnerServiceDefinition
from src.utils.auth import get_current_user

router = APIRouter(prefix="/plano-telas", tags=["plano_telas"])


# ============================================================================
# ROTA ESPECÍFICA - DEVE VIR PRIMEIRO para evitar conflito com /{id_service}/
# ============================================================================

@router.get("/usuario/me/telas-permitidas/", response_model=TelasPermitidasResponse)
async def get_telas_permitidas_usuario(
    request: Request,
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user=Depends(get_current_user),
):
    """
    Retorna as telas permitidas para o usuário logado baseado no plano da empresa.

    Fluxo:
    1. Busca a empresa do usuário (id_empresa)
    2. Busca a licença da empresa (tb_partner_licenses)
    3. Via licença → package_item → service_definition, obtém o id_service
    4. Busca as telas configuradas para esse plano
    5. Retorna apenas as telas com fg_visivel = true

    Headers opcionais (quando chamado via API Key do sistema):
    - X-User-Id: ID do usuário real (para buscar empresa)
    - X-User-Email: Email do usuário real (fallback)
    """
    from src.models.empresa import Empresa
    from src.models.user import User

    # SEMPRE verificar headers X-User-* primeiro para identificar o usuário real
    # Isso é necessário porque o Next.js passa esses headers quando o usuário está logado
    # mas a autenticação com o backend é via API Key do sistema
    id_empresa = None
    user_id_header = request.headers.get("X-User-Id")
    user_email_header = request.headers.get("X-User-Email")

    if user_id_header:
        try:
            user_id = uuid.UUID(user_id_header)
            result = await db.execute(
                select(User).where(User.id_user == user_id)
            )
            real_user = result.scalar_one_or_none()
            if real_user:
                id_empresa = real_user.id_empresa
        except (ValueError, Exception):
            pass  # Ignora erro e tenta pelo email

    if not id_empresa and user_email_header:
        result = await db.execute(
            select(User).where(User.nm_email == user_email_header)
        )
        real_user = result.scalar_one_or_none()
        if real_user:
            id_empresa = real_user.id_empresa

    # Fallback: usar id_empresa do current_user (API Key ou JWT)
    if not id_empresa:
        id_empresa = getattr(current_user, 'id_empresa', None)

    if not id_empresa:
        # Usuário sem empresa - retorna todas as telas (comportamento padrão)
        return TelasPermitidasResponse(
            telas_permitidas=[],  # Lista vazia = sem restrições
            id_service=None,
            nm_plano=None,
        )

    # Buscar empresa para pegar nm_plano
    empresa = await db.get(Empresa, id_empresa)
    nm_plano = empresa.nm_plano if empresa else None

    # Buscar id_service pelo nome do plano (via service_code ou service_name)
    id_service = None

    if nm_plano:
        # Tenta encontrar o plano pelo nome
        result = await db.execute(
            select(PartnerServiceDefinition).where(
                (PartnerServiceDefinition.service_name.ilike(f"%{nm_plano}%")) |
                (PartnerServiceDefinition.service_code.ilike(f"%{nm_plano}%"))
            )
        )
        plano = result.scalar_one_or_none()
        if plano:
            id_service = plano.id_service

    # Se não encontrou por nome, tentar pela licença ativa
    if not id_service:
        # Buscar via tb_partner_licenses → tb_partner_package_items → tb_partner_service_definitions
        query = """
            SELECT psd.id_service, psd.nm_service
            FROM tb_partner_licenses pl
            JOIN tb_partner_package_items ppi ON pl.id_partner_package_item = ppi.id_partner_package_item
            JOIN tb_partner_packages pp ON ppi.id_partner_package = pp.id_partner_package
            JOIN tb_partner_leads ple ON pp.id_partner_lead = ple.id_partner_lead
            JOIN tb_partner_service_definitions psd ON ppi.id_service = psd.id_service
            JOIN tb_empresas e ON e.nr_cnpj = ple.nr_cnpj OR e.ds_email = ple.nm_email
            WHERE e.id_empresa = :id_empresa
            AND pl.nm_status = 'active'
            AND psd.tp_categoria = 'plano_base'
            LIMIT 1
        """
        from sqlalchemy import text
        result = await db.execute(text(query), {"id_empresa": str(id_empresa)})
        row = result.fetchone()
        if row:
            id_service = row[0]
            nm_plano = row[1]

    if not id_service:
        # Sem plano associado - retorna lista vazia (sem restrições)
        return TelasPermitidasResponse(
            telas_permitidas=[],
            id_service=None,
            nm_plano=nm_plano,
        )

    # Buscar telas configuradas para o plano
    result = await db.execute(
        select(PlanoTelaConfigORM).where(
            PlanoTelaConfigORM.id_service == id_service,
            PlanoTelaConfigORM.fg_visivel == True
        )
    )
    telas_visiveis = result.scalars().all()

    # Se não há configurações para o plano, retorna lista vazia (sem restrições)
    if not telas_visiveis:
        # Verificar se existe alguma configuração para o plano
        result_all = await db.execute(
            select(PlanoTelaConfigORM).where(PlanoTelaConfigORM.id_service == id_service)
        )
        todas_configs = result_all.scalars().all()

        if not todas_configs:
            # Sem configurações = sem restrições
            return TelasPermitidasResponse(
                telas_permitidas=[],
                id_service=id_service,
                nm_plano=nm_plano,
            )

    # Retorna lista de códigos de telas visíveis
    telas_permitidas = [tela.cd_tela for tela in telas_visiveis]

    return TelasPermitidasResponse(
        telas_permitidas=telas_permitidas,
        id_service=id_service,
        nm_plano=nm_plano,
    )


# ============================================================================
# ROTAS COM PATH PARAMETERS - DEVEM VIR APÓS rotas específicas
# ============================================================================

@router.get("/{id_service}/", response_model=List[PlanoTelaConfigResponse])
async def listar_telas_plano(
    id_service: uuid.UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Lista todas as configurações de telas para um plano específico.
    """
    result = await db.execute(
        select(PlanoTelaConfigORM).where(PlanoTelaConfigORM.id_service == id_service)
    )
    configs = result.scalars().all()
    return configs


@router.post("/{id_service}/", response_model=PlanoTelaConfigBulkResponse)
async def salvar_telas_plano(
    id_service: uuid.UUID,
    data: PlanoTelaConfigBulkCreate,
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user=Depends(get_current_user),
):
    """
    Salva as configurações de telas para um plano.
    Substitui todas as configurações existentes.
    """
    # Verificar se o plano existe
    plano = await db.get(PartnerServiceDefinition, id_service)
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    # Deletar configurações existentes
    await db.execute(
        delete(PlanoTelaConfigORM).where(PlanoTelaConfigORM.id_service == id_service)
    )

    # Criar novas configurações
    configs = []
    for tela in data.telas:
        config = PlanoTelaConfigORM(
            id_plano_tela=uuid.uuid4(),
            id_service=id_service,
            cd_tela=tela.cd_tela,
            fg_visivel=tela.fg_visivel,
        )
        db.add(config)
        configs.append(config)

    await db.commit()

    # Recarregar as configurações
    for config in configs:
        await db.refresh(config)

    return PlanoTelaConfigBulkResponse(
        message="Configurações salvas com sucesso",
        count=len(configs),
        configs=[PlanoTelaConfigResponse.model_validate(c) for c in configs],
    )


@router.delete("/{id_service}/")
async def deletar_telas_plano(
    id_service: uuid.UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user=Depends(get_current_user),
):
    """
    Remove todas as configurações de telas de um plano.
    """
    result = await db.execute(
        delete(PlanoTelaConfigORM).where(PlanoTelaConfigORM.id_service == id_service)
    )
    await db.commit()

    return {"message": "Configurações removidas com sucesso", "deleted": result.rowcount}
