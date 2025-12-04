# doctorq-api/src/services/partner_activation_service.py
"""
Serviço para ativação automática de parceiros (estilo iFood).

Quando um parceiro se cadastra, automaticamente:
1. Cria o lead
2. Cria um pacote baseado nos serviços selecionados
3. Gera licenças
4. Cria conta de usuário + empresa
5. Ativa acesso imediato à plataforma
"""
import secrets
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.empresa import Empresa
from src.models.perfil import Perfil
from src.models.user import User
from src.utils.security import hash_password
from src.models.partner_lead import (
    PartnerLead,
    PartnerLeadService,
    PartnerServiceDefinition,
    PartnerType,
    PartnerLeadStatus,
)
from src.models.partner_package import (
    PartnerPackage,
    PartnerPackageItem,
    PartnerPackageItemStatus,
    PartnerPackageStatus,
    PartnerLicense,
    PartnerLicenseStatus,
)
from src.services.partner_lead_service import PartnerLeadServiceManager
from src.services.partner_package_service import PartnerPackageServiceManager
from src.data.partner_service_seed import SERVICE_DEFINITIONS_SEED

logger = get_logger(__name__)


class PartnerActivationService:
    """Serviço de ativação automática de parceiros."""

    # Mapeia tipo de parceiro para o perfil template correto (usando fg_template=true)
    PROFILE_MAP = {
        "clinica": "Gestor de Clínica",
        "profissional": "Profissional",
        "fabricante": "Fornecedor",
        "fornecedor": "Fornecedor",
    }
    # Configuração de permissões padrão para cada tipo de perfil
    PROFILE_PERMISSIONS = {
        "Gestor de Clínica": {
            "ds_grupos_acesso": ["clinica"],
            "ds_permissoes_detalhadas": {
                "clinica": {
                    "dashboard": {"visualizar": True},
                    "agenda": {"visualizar": True, "criar": True, "editar": True, "excluir": True, "cancelar": True},
                    "pacientes": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "profissionais": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "procedimentos": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "financeiro": {"visualizar": True, "criar": True, "editar": True, "exportar": True},
                    "relatorios": {"visualizar": True, "exportar": True},
                    "configuracoes": {"visualizar": True, "editar": True},
                    "equipe": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "perfis": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                }
            },
        },
        "Profissional": {
            "ds_grupos_acesso": ["profissional"],
            "ds_permissoes_detalhadas": {
                "profissional": {
                    "dashboard": {"visualizar": True},
                    "agenda": {"visualizar": True, "criar": True, "editar": True},
                    "relatorios": {"visualizar": True, "exportar": True},
                    "procedimentos": {"visualizar": True},
                    "pacientes": {"visualizar": True, "editar": True},
                }
            },
        },
        "Fornecedor": {
            "ds_grupos_acesso": ["fornecedor"],
            "ds_permissoes_detalhadas": {
                "fornecedor": {
                    "dashboard": {"visualizar": True},
                    "produtos": {"visualizar": True, "criar": True, "editar": True, "excluir": True},
                    "pedidos": {"visualizar": True, "editar": True},
                    "financeiro": {"visualizar": True, "exportar": True},
                    "relatorios": {"visualizar": True, "exportar": True},
                    "perfil": {"visualizar": True, "editar": True},
                }
            },
        },
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.lead_service = PartnerLeadServiceManager(db)
        self.package_service = PartnerPackageServiceManager(db)

    async def _set_empresa_context(self, id_empresa: uuid.UUID) -> None:
        """Configura contexto de tenant para obedecer às políticas de RLS."""
        if not id_empresa:
            return

        empresa_id_str = str(id_empresa)
        await self.db.execute(
            text(f"SET LOCAL app.current_empresa_id = '{empresa_id_str}'")
        )
        # Compatibilidade com migrations que usam app.current_user_empresa_id
        await self.db.execute(
            text(f"SET LOCAL app.current_user_empresa_id = '{empresa_id_str}'")
        )

    async def activate_partner(
        self,
        partner_type: str,
        contact_name: str,
        contact_email: str,
        contact_phone: str,
        business_name: str,
        cnpj: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        selected_services: List[str] = None,
        plan_type: Optional[str] = "professional",
        billing_cycle: str = "monthly",
    ) -> Dict:
        """
        Ativa um parceiro automaticamente com acesso imediato.

        Args:
            partner_type: Tipo de parceiro (clinic, supplier, etc.)
            contact_name: Nome do contato responsável
            contact_email: Email do responsável
            contact_phone: Telefone
            business_name: Nome da empresa
            cnpj: CNPJ da empresa (opcional)
            city: Cidade
            state: Estado
            selected_services: Lista de códigos de serviços selecionados
            plan_type: Tipo de plano (starter, professional, enterprise)
            billing_cycle: Ciclo de cobrança (monthly, yearly)

        Returns:
            Dict com informações do parceiro ativado, credenciais e licenças
        """
        try:
            # Garantir que o catálogo de serviços existe
            await self.package_service.ensure_service_catalog()

            # 1. Criar o lead
            logger.info(f"Criando lead para parceiro: {business_name}")
            lead = await self._create_lead(
                partner_type=partner_type,
                contact_name=contact_name,
                contact_email=contact_email,
                contact_phone=contact_phone,
                business_name=business_name,
                cnpj=cnpj,
                city=city,
                state=state,
                selected_services=selected_services or [],
            )

            # 2. Criar empresa e usuário
            logger.info(f"Criando empresa e usuário para: {business_name}")
            empresa, user, temp_password = await self._create_empresa_and_user(
                business_name=business_name,
                contact_name=contact_name,
                contact_email=contact_email,
                contact_phone=contact_phone,
                cnpj=cnpj,
                partner_type=partner_type,
            )

            # 3. NOVO: Criar estrutura específica do tipo de parceiro
            logger.info(f"Criando estrutura específica para tipo: {partner_type}")
            specific_entity = await self._create_specific_entity(
                partner_type=partner_type,
                empresa=empresa,
                business_name=business_name,
                cnpj=cnpj,
                city=city,
                state=state,
            )

            # 4. Criar pacote com as licenças
            logger.info(f"Criando pacote de licenças para: {business_name}")
            package = await self._create_package_with_licenses(
                lead=lead,
                selected_services=selected_services or [],
                billing_cycle=billing_cycle,
            )

            # 4. Atribuir licenças ao usuário
            logger.info(f"Atribuindo licenças ao usuário: {contact_email}")
            licenses = await self._assign_licenses_to_user(
                package=package,
                user_email=contact_email,
                user_name=contact_name,
            )

            # 5. Atualizar status do lead para aprovado/ativo
            lead.status = PartnerLeadStatus.APPROVED.value
            await self.db.commit()
            await self.db.refresh(lead)

            logger.info(f"✅ Parceiro {business_name} ativado com sucesso!")

            return {
                "success": True,
                "message": "Parceiro ativado com sucesso! Acesso imediato liberado.",
                "partner": {
                    "id_lead": str(lead.id_partner_lead),
                    "id_empresa": str(empresa.id_empresa),
                    "id_user": str(user.id_user),
                    "id_specific_entity": str(specific_entity.get("id")) if specific_entity else None,
                    "entity_type": specific_entity.get("type") if specific_entity else None,
                    "business_name": business_name,
                    "contact_name": contact_name,
                    "contact_email": contact_email,
                    "status": lead.status,
                },
                "credentials": {
                    "email": contact_email,
                    "temporary_password": temp_password,
                    "must_change_password": True,
                },
                "package": {
                    "id_package": str(package.id_partner_package),
                    "package_code": package.package_code,
                    "package_name": package.package_name,
                    "status": package.status,
                    "billing_cycle": billing_cycle,
                },
                "licenses": [
                    {
                        "license_key": lic["license_key"],
                        "status": lic["status"],
                        "service": lic.get("service_name"),
                    }
                    for lic in licenses
                ],
                "access_info": {
                    "dashboard_url": self._get_dashboard_url(partner_type),
                    "login_url": "/login",
                    "onboarding_url": "/onboarding",
                },
            }

        except Exception as exc:
            logger.error(f"Erro ao ativar parceiro: {exc}", exc_info=True)
            await self.db.rollback()
            raise

    async def _clone_perfil_template(self, profile_name: str, id_empresa: uuid.UUID) -> Perfil:
        """
        Clona um perfil template global para uma empresa específica.

        Fluxo:
        1. Busca perfil template global (fg_template=true, id_empresa=NULL)
        2. Verifica se já existe clone para esta empresa
        3. Se não existir, cria clone com:
           - fg_template = False
           - id_empresa = {empresa_id}
           - Copia ds_grupos_acesso e ds_permissoes_detalhadas do template

        Args:
            profile_name: Nome do perfil template ("Gestor de Clínica", "Profissional", etc.)
            id_empresa: UUID da empresa para a qual clonar o perfil

        Returns:
            Perfil clonado ou existente para a empresa
        """
        # 1. Buscar perfil template global (fg_template=true, id_empresa=NULL)
        stmt = select(Perfil).where(
            Perfil.nm_perfil == profile_name,
            Perfil.fg_template == True,
            Perfil.id_empresa.is_(None),
            Perfil.st_ativo == "S",
        )
        result = await self.db.execute(stmt)
        perfil_template = result.scalar_one_or_none()

        if not perfil_template:
            logger.error(f"❌ Perfil template '{profile_name}' não encontrado!")
            # Fallback: criar perfil básico com permissões padrão
            permissions = self.PROFILE_PERMISSIONS.get(profile_name, {})
            perfil_clone = Perfil(
                id_perfil=uuid.uuid4(),
                id_empresa=id_empresa,
                nm_perfil=profile_name,
                ds_perfil=f"Perfil {profile_name} (criado automaticamente)",
                nm_tipo="custom",
                st_ativo="S",
                fg_template=False,
                ds_grupos_acesso=permissions.get("ds_grupos_acesso", []),
                ds_permissoes_detalhadas=permissions.get("ds_permissoes_detalhadas", {}),
            )
            self.db.add(perfil_clone)
            await self.db.flush()
            logger.warning(f"⚠️ Template não encontrado, criado perfil básico '{profile_name}' para empresa {id_empresa}")
            return perfil_clone

        # 2. Verificar se já existe clone para esta empresa
        stmt = select(Perfil).where(
            Perfil.nm_perfil == profile_name,
            Perfil.id_empresa == id_empresa,
            Perfil.fg_template == False,
            Perfil.st_ativo == "S",
        )
        result = await self.db.execute(stmt)
        perfil_existente = result.scalar_one_or_none()

        if perfil_existente:
            logger.info(f"✅ Perfil '{profile_name}' já existe para empresa {id_empresa}, reutilizando")
            return perfil_existente

        # 3. Clonar perfil template para a empresa
        perfil_clone = Perfil(
            id_perfil=uuid.uuid4(),
            id_empresa=id_empresa,
            nm_perfil=perfil_template.nm_perfil,
            ds_perfil=perfil_template.ds_perfil,
            nm_tipo="custom",  # Clones são sempre custom, nunca system
            st_ativo="S",
            fg_template=False,  # Clones NÃO são templates
            # Copiar permissões do template
            ds_grupos_acesso=perfil_template.ds_grupos_acesso.copy() if perfil_template.ds_grupos_acesso else [],
            ds_permissoes_detalhadas=perfil_template.ds_permissoes_detalhadas.copy() if perfil_template.ds_permissoes_detalhadas else {},
            # Copiar hierarquia (se existir)
            nm_tipo_acesso=perfil_template.nm_tipo_acesso,
            id_perfil_pai=perfil_template.id_perfil_pai,
            nr_ordem=perfil_template.nr_ordem,
        )

        self.db.add(perfil_clone)
        await self.db.flush()

        logger.info(
            f"✅ Perfil '{profile_name}' clonado para empresa {id_empresa} | "
            f"Grupos: {perfil_clone.ds_grupos_acesso} | "
            f"Template ID: {perfil_template.id_perfil} → Clone ID: {perfil_clone.id_perfil}"
        )

        return perfil_clone

    async def _create_lead(
        self,
        partner_type: str,
        contact_name: str,
        contact_email: str,
        contact_phone: str,
        business_name: str,
        cnpj: Optional[str],
        city: Optional[str],
        state: Optional[str],
        selected_services: List[str],
    ) -> PartnerLead:
        """Cria o lead do parceiro."""
        # Buscar definições de serviços
        service_codes = selected_services if selected_services else ["core_platform"]

        stmt = select(PartnerServiceDefinition).where(
            PartnerServiceDefinition.service_code.in_(service_codes),
            PartnerServiceDefinition.active_flag == "S",
        )
        result = await self.db.execute(stmt)
        definitions = {service.service_code: service for service in result.scalars().all()}

        # Criar lead
        lead = PartnerLead(
            partner_type=partner_type,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
            business_name=business_name,
            cnpj=cnpj,
            city=city,
            state=state,
            status=PartnerLeadStatus.PENDING.value,
            services_description=f"Plano com {len(selected_services)} serviços",
        )

        self.db.add(lead)
        await self.db.flush()

        # Associar serviços ao lead
        for service_code in service_codes:
            if service_code in definitions:
                definition = definitions[service_code]
                lead_service = PartnerLeadService(
                    partner_lead=lead,
                    service_definition=definition,
                    service_name=definition.service_name,
                    price_label_snapshot=definition.price_label,
                )
                self.db.add(lead_service)

        await self.db.flush()
        return lead

    async def _create_empresa_and_user(
        self,
        business_name: str,
        contact_name: str,
        contact_email: str,
        contact_phone: str,
        cnpj: Optional[str],
        partner_type: str,
    ) -> tuple[Empresa, User, Optional[str]]:
        """Cria a empresa e o usuário administrador."""
        # Verificar se empresa já existe
        stmt = select(Empresa).where(Empresa.nm_empresa == business_name)
        result = await self.db.execute(stmt)
        existing_empresa = result.scalar_one_or_none()

<<<<<<< Updated upstream:DoctorQ-api/src/services/partner_activation_service.py
        empresa = existing_empresa
        if not empresa and cnpj:
            stmt = select(Empresa).where(Empresa.nr_cnpj == cnpj)
            result = await self.db.execute(stmt)
            empresa = result.scalar_one_or_none()

        if empresa:
            # Atualizar dados básicos se estiverem diferentes
            if business_name and empresa.nm_empresa != business_name:
                empresa.nm_empresa = business_name
            if business_name and empresa.nm_razao_social != business_name:
                empresa.nm_razao_social = business_name
            if empresa.nm_plano != "partner":
                empresa.nm_plano = "partner"
            if empresa.st_ativo != "S":
                empresa.st_ativo = "S"
            await self.db.flush()
        else:
            # Criar empresa
            empresa = Empresa(
                id_empresa=uuid.uuid4(),
                nm_empresa=business_name,
                nm_razao_social=business_name,
                nm_plano="partner",  # Plano de parceiro
                st_ativo="S",  # S = Ativo, N = Inativo
                nr_cnpj=cnpj if cnpj else None,
                dt_criacao=datetime.utcnow(),
            )

            self.db.add(empresa)
            await self.db.flush()

        # Verificar existência de usuário antes de aplicar o contexto de tenant.
        # Sem o contexto configurado conseguimos inspecionar duplicidades mesmo que pertençam a outra empresa.
        stmt = select(User).where(User.nm_email == contact_email)
        result = await self.db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user and existing_user.id_empresa and existing_user.id_empresa != empresa.id_empresa:
            raise ValueError(
                "Endereço de e-mail já está associado a outra empresa DoctorQ. Utilize um e-mail diferente."
            )

        # Gerar senha temporária (SEMPRE, mesmo para usuários existentes)
        temp_password = self._generate_temp_password()

        if existing_user:
            # Atualizar dados essenciais antes de configurar o contexto de tenant.
            existing_user.id_empresa = empresa.id_empresa
            existing_user.nm_completo = contact_name
            existing_user.nr_telefone = contact_phone
            existing_user.nm_password_hash = hash_password(temp_password)
            user = existing_user
            await self.db.flush()
        else:
            # Usuário será criado após clonagem do perfil (precisamos do id_perfil).
            user = None

        # Configurar contexto de tenant para permitir operações nas tabelas com RLS
        await self._set_empresa_context(empresa.id_empresa)

        # Buscar perfil template para o tipo de parceiro e CLONAR para a empresa
        desired_profile_name = self.PROFILE_MAP.get(partner_type, "Gestor de Clínica")
        perfil_gestor = await self._clone_perfil_template(desired_profile_name, empresa.id_empresa)

        if user is not None:
            # Garantir que o usuário utilize o perfil correto após clonagem
            user.id_perfil = perfil_gestor.id_perfil
        else:
            # Criar usuário com perfil de gestor_clinica e associar à empresa
            user = User(
                id_user=uuid.uuid4(),
                id_empresa=empresa.id_empresa,  # Associar à empresa
                id_perfil=perfil_gestor.id_perfil,  # Perfil de parceiro adequado
                nm_email=contact_email,
                nm_completo=contact_name,
                nm_password_hash=hash_password(temp_password),  # Hash seguro com pbkdf2_sha256
                nm_papel="usuario",  # Papel básico (o perfil específico está em id_perfil)
                nr_telefone=contact_phone,  # Adicionar telefone
                st_ativo="S",  # S = Ativo
                dt_criacao=datetime.utcnow(),
            )
            self.db.add(user)

        await self.db.flush()
        return empresa, user, temp_password
=======
        empresa = existing_empresa
        if not empresa and cnpj:
            stmt = select(Empresa).where(Empresa.nr_cnpj == cnpj)
            result = await self.db.execute(stmt)
            empresa = result.scalar_one_or_none()

        if empresa:
            # Atualizar dados básicos se estiverem diferentes
            if business_name and empresa.nm_empresa != business_name:
                empresa.nm_empresa = business_name
            if business_name and empresa.nm_razao_social != business_name:
                empresa.nm_razao_social = business_name
            if empresa.nm_plano != "partner":
                empresa.nm_plano = "partner"
            if empresa.st_ativo != "S":
                empresa.st_ativo = "S"
            await self.db.flush()
        else:
            # Criar empresa
            empresa = Empresa(
                id_empresa=uuid.uuid4(),
                nm_empresa=business_name,
                nm_razao_social=business_name,
                nm_plano="partner",  # Plano de parceiro
                st_ativo="S",  # S = Ativo, N = Inativo
                nr_cnpj=cnpj if cnpj else None,
                dt_criacao=datetime.utcnow(),
            )

            self.db.add(empresa)
            await self.db.flush()

        # Verificar existência de usuário antes de aplicar o contexto de tenant.
        # Sem o contexto configurado conseguimos inspecionar duplicidades mesmo que pertençam a outra empresa.
        stmt = select(User).where(User.nm_email == contact_email)
        result = await self.db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user and existing_user.id_empresa and existing_user.id_empresa != empresa.id_empresa:
            raise ValueError(
                "Endereço de e-mail já está associado a outra empresa DoctorQ. Utilize um e-mail diferente."
            )

        # Gerar senha temporária (SEMPRE, mesmo para usuários existentes)
        temp_password = self._generate_temp_password()

        if existing_user:
            # Atualizar dados essenciais antes de configurar o contexto de tenant.
            existing_user.id_empresa = empresa.id_empresa
            existing_user.nm_completo = contact_name
            existing_user.nr_telefone = contact_phone
            existing_user.nm_password_hash = hash_password(temp_password)
            user = existing_user
            await self.db.flush()
        else:
            # Usuário será criado após clonagem do perfil (precisamos do id_perfil).
            user = None

        # Configurar contexto de tenant para permitir operações nas tabelas com RLS
        await self._set_empresa_context(empresa.id_empresa)

        # Buscar perfil template para o tipo de parceiro e CLONAR para a empresa
        desired_profile_name = self.PROFILE_MAP.get(partner_type, "Gestor de Clínica")
        perfil_gestor = await self._clone_perfil_template(desired_profile_name, empresa.id_empresa)

        if user is not None:
            # Garantir que o usuário utilize o perfil correto após clonagem
            user.id_perfil = perfil_gestor.id_perfil
        else:
            # Criar usuário com perfil de gestor_clinica e associar à empresa
            user = User(
                id_user=uuid.uuid4(),
                id_empresa=empresa.id_empresa,  # Associar à empresa
                id_perfil=perfil_gestor.id_perfil,  # Perfil de parceiro adequado
                nm_email=contact_email,
                nm_completo=contact_name,
                nm_password_hash=hash_password(temp_password),  # Hash seguro com pbkdf2_sha256
                nm_papel="usuario",  # Papel básico (o perfil específico está em id_perfil)
                nr_telefone=contact_phone,  # Adicionar telefone
                st_ativo="S",  # S = Ativo
                dt_criacao=datetime.utcnow(),
            )
            self.db.add(user)

        await self.db.flush()
        return empresa, user, temp_password
>>>>>>> Stashed changes:doctorq-api/src/services/partner_activation_service.py

    async def _create_package_with_licenses(
        self,
        lead: PartnerLead,
        selected_services: List[str],
        billing_cycle: str,
    ) -> PartnerPackage:
        """Cria o pacote com licenças para os serviços selecionados."""
        # Buscar serviços
        service_codes = selected_services if selected_services else ["core_platform"]
        stmt = select(PartnerServiceDefinition).where(
            PartnerServiceDefinition.service_code.in_(service_codes),
            PartnerServiceDefinition.active_flag == "S",
        )
        result = await self.db.execute(stmt)
        definitions = {service.service_code: service for service in result.scalars().all()}

        # Criar pacote
        package_code = f"PKG-{lead.id_partner_lead.hex[:8].upper()}"
        package = PartnerPackage(
            id_partner_package=uuid.uuid4(),
            package_code=package_code,
            package_name=f"Pacote {lead.business_name}",
            id_partner_lead=lead.id_partner_lead,
            status=PartnerPackageStatus.ACTIVE.value,
            billing_cycle=billing_cycle,
            activated_at=datetime.utcnow(),
        )
        self.db.add(package)
        await self.db.flush()

        # Criar itens e licenças
        total_value = 0.0
        for service_code in service_codes:
            if service_code in definitions:
                definition = definitions[service_code]
                unit_price = float(definition.price_value) if definition.price_value else 0.0
                total_value += unit_price

                # Criar item do pacote
                package_item = PartnerPackageItem(
                    id_partner_package_item=uuid.uuid4(),
                    id_partner_package=package.id_partner_package,
                    id_service=definition.id_service,
                    quantity=1,
                    unit_price_value=definition.price_value,
                    unit_price_label=definition.price_label,
                    status=PartnerPackageItemStatus.ACTIVE.value,
                )
                self.db.add(package_item)
                await self.db.flush()

                # Gerar licença para este item
                license_key = self._generate_license_key()
                license_entry = PartnerLicense(
                    id_partner_license=uuid.uuid4(),
                    id_partner_package_item=package_item.id_partner_package_item,
                    license_key=license_key,
                    status=PartnerLicenseStatus.AVAILABLE.value,
                    created_at=datetime.utcnow(),
                )
                self.db.add(license_entry)

        package.total_value = total_value
        await self.db.flush()
        return package

    async def _assign_licenses_to_user(
        self,
        package: PartnerPackage,
        user_email: str,
        user_name: str,
    ) -> List[Dict]:
        """Atribui todas as licenças do pacote ao usuário."""
        # Buscar licenças do pacote
        stmt = (
            select(PartnerLicense)
            .join(PartnerPackageItem)
            .join(PartnerServiceDefinition)
            .where(
                PartnerPackageItem.id_partner_package == package.id_partner_package,
                PartnerLicense.status == PartnerLicenseStatus.AVAILABLE.value,
            )
            .options(
                selectinload(PartnerLicense.package_item).selectinload(
                    PartnerPackageItem.service_definition
                )
            )
        )
        result = await self.db.execute(stmt)
        licenses = result.scalars().all()

        assigned_licenses = []
        for license_obj in licenses:
            # Atribuir licença
            license_obj.status = PartnerLicenseStatus.ASSIGNED.value
            license_obj.assigned_to = user_name
            license_obj.assigned_email = user_email
            license_obj.activated_at = datetime.utcnow()

            service_name = (
                license_obj.package_item.service_definition.service_name
                if license_obj.package_item and license_obj.package_item.service_definition
                else "Serviço"
            )

            assigned_licenses.append(
                {
                    "license_key": license_obj.license_key,
                    "status": license_obj.status,
                    "service_name": service_name,
                    "assigned_at": license_obj.activated_at.isoformat(),
                }
            )

        await self.db.flush()
        return assigned_licenses

    async def _create_specific_entity(
        self,
        partner_type: str,
        empresa: Empresa,
        business_name: str,
        cnpj: Optional[str],
        city: Optional[str],
        state: Optional[str],
    ) -> Optional[Dict]:
        """
        Cria a estrutura específica do tipo de parceiro.

        - clinic/clinica → tb_clinicas
        - professional/profissional → tb_profissionais
        - supplier/fornecedor/fabricante → tb_fornecedores
        """
        from src.models.clinica_orm import ClinicaORM as Clinica
        from src.models.profissionais_orm import ProfissionalORM as Profissional
        from src.models.fornecedor_orm import FornecedorORM as Fornecedor

        if partner_type in ["clinic", "clinica"]:
            # Criar tb_clinicas
            clinica = Clinica(
                id_clinica=uuid.uuid4(),
                id_empresa=empresa.id_empresa,
                nm_clinica=business_name,
                nr_cnpj=cnpj,
                nm_cidade=city,
                nm_estado=state,
                st_ativo=True,  # Boolean, não string "S"
                st_aceita_convenio=False,  # Boolean obrigatório
            )
            self.db.add(clinica)
            await self.db.flush()
            logger.info(f"✅ Clínica criada: {clinica.id_clinica}")
            return {"id": clinica.id_clinica, "type": "clinica"}

        elif partner_type in ["professional", "profissional"]:
            # Criar tb_profissionais
            profissional = Profissional(
                id_profissional=uuid.uuid4(),
                id_empresa=empresa.id_empresa,
                nm_profissional=business_name,
                fg_autonomo=True,
                st_ativo=True,  # Boolean, não string "S"
            )
            self.db.add(profissional)
            await self.db.flush()
            logger.info(f"✅ Profissional criado: {profissional.id_profissional}")
            return {"id": profissional.id_profissional, "type": "profissional"}

        elif partner_type in ["supplier", "fornecedor", "fabricante"]:
            # Criar tb_fornecedores
            fornecedor = Fornecedor(
                id_fornecedor=uuid.uuid4(),
                id_empresa=empresa.id_empresa,
                nm_empresa=business_name,
                nr_cnpj=cnpj if cnpj else f"TEMP-{uuid.uuid4().hex[:13].upper()}",  # 18 chars max (TEMP- = 5 + 13 hex = 18)
                nm_cidade=city,
                nm_estado=state,
                st_ativo=True,  # Boolean, não string "S"
            )
            self.db.add(fornecedor)
            await self.db.flush()
            logger.info(f"✅ Fornecedor criado: {fornecedor.id_fornecedor}")
            return {"id": fornecedor.id_fornecedor, "type": "fornecedor"}

        else:
            logger.warning(f"⚠️ Tipo de parceiro desconhecido: {partner_type}")
            return None

    def _get_dashboard_url(self, partner_type: str) -> str:
        """Retorna a URL do dashboard específica do tipo de parceiro."""
        if partner_type in ["clinic", "clinica"]:
            return "/clinica/dashboard"
        elif partner_type in ["professional", "profissional"]:
            return "/profissional/dashboard"
        elif partner_type in ["supplier", "fornecedor", "fabricante"]:
            return "/fornecedor/dashboard"
        else:
            return "/dashboard"

    def _generate_license_key(self) -> str:
        """Gera chave de licença única no formato ESTQ-XXXX-XXXX-XXXX-XXXX."""
        parts = []
        for _ in range(4):
            part = secrets.token_hex(2).upper()
            parts.append(part)
        return f"ESTQ-{'-'.join(parts)}"

    def _generate_temp_password(self) -> str:
        """Gera senha temporária segura."""
        # Gera senha aleatória de 12 caracteres
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return "".join(secrets.choice(chars) for _ in range(12))


async def get_partner_activation_service(
    db: AsyncSession = Depends(get_db),
) -> PartnerActivationService:
    """Dependency para obter o serviço de ativação."""
    return PartnerActivationService(db)
