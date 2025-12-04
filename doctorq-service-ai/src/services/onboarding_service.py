"""
Serviço para Onboarding de Usuários
"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.clinica_orm import ClinicaORM
from src.models.empresa import Empresa
from src.models.fornecedor_orm import FornecedorORM
from src.models.onboarding import (
    CompleteStepRequest,
    OnboardingDashboard,
    OnboardingEvent,
    OnboardingEventCreate,
    OnboardingEventResponse,
    OnboardingFlow,
    OnboardingFlowConfig,
    OnboardingFlowCreate,
    OnboardingFlowResponse,
    OnboardingFlowUpdate,
    OnboardingStatus,
    OnboardingStepConfig,
    OnboardingStepType,
    SkipStepRequest,
    StepStatus,
    UserOnboardingProgress,
    UserOnboardingProgressCreate,
    UserOnboardingProgressResponse,
    UserOnboardingProgressUpdate,
)
from src.models.profissionais_orm import ProfissionalORM
from src.models.user import PapelUsuario, User

logger = get_logger(__name__)

CLINIC_FLOW_NAME = "Configuração da Clínica"
CLINIC_FLOW_TARGET = "clinica"
CLINIC_FLOW_DESCRIPTION = (
    "Configure sua clínica em 7 passos simples e comece a usar a plataforma"
)

EMPRESA_LOGO_MAX_LENGTH = 500

DEFAULT_CLINIC_FLOW_STEPS: List[OnboardingStepConfig] = [
    OnboardingStepConfig(
        step_type=OnboardingStepType.CLINIC_INFO,
        title="Informações da Clínica",
        description="Cadastre os dados básicos da clínica, logo e endereço",
        order=1,
        required=True,
        estimated_minutes=5,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SCHEDULE_SETUP,
        title="Horários e Agendamentos",
        description="Configure horários de funcionamento e regras de agendamento",
        order=2,
        required=True,
        estimated_minutes=3,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.TEAM_SETUP,
        title="Cadastro de Profissionais",
        description="Adicione os profissionais que trabalham na clínica",
        order=3,
        required=False,
        estimated_minutes=5,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SERVICES_SETUP,
        title="Cadastro de Procedimentos",
        description="Cadastre os procedimentos e serviços oferecidos",
        order=4,
        required=False,
        estimated_minutes=5,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.NOTIFICATIONS,
        title="Notificações e Pagamentos",
        description="Configure notificações e formas de pagamento",
        order=5,
        required=True,
        estimated_minutes=3,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.INTEGRATIONS,
        title="Integrações",
        description="Conecte WhatsApp, Gmail, Google Calendar e gateway de pagamento",
        order=6,
        required=False,
        estimated_minutes=5,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.PRIVACY,
        title="Privacidade e Aparência",
        description="Ajuste configurações de privacidade e personalização visual",
        order=7,
        required=True,
        estimated_minutes=2,
    ),
]

DEFAULT_CLINIC_FLOW_CONFIG = OnboardingFlowConfig(
    allow_skip=True,
    show_progress_bar=True,
    auto_advance=False,
    celebration_on_complete=True,
)

PROFESSIONAL_FLOW_NAME = "Configuração do Perfil Profissional"
PROFESSIONAL_FLOW_TARGET = "profissional"
PROFESSIONAL_FLOW_DESCRIPTION = (
    "Complete seu perfil profissional e comece a atender pacientes pela DoctorQ"
)

DEFAULT_PROFESSIONAL_FLOW_STEPS: List[OnboardingStepConfig] = [
    OnboardingStepConfig(
        step_type=OnboardingStepType.PROFESSIONAL_INFO,
        title="Informações Profissionais",
        description="Atualize seus dados pessoais, especialidade e biografia",
        order=1,
        required=True,
        estimated_minutes=5,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.AVAILABILITY,
        title="Horários de Atendimento",
        description="Configure sua disponibilidade semanal e duração padrão das consultas",
        order=2,
        required=True,
        estimated_minutes=4,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SERVICES_SETUP,
        title="Procedimentos Oferecidos",
        description="Selecione os procedimentos que você realiza",
        order=3,
        required=False,
        estimated_minutes=3,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.NOTIFICATIONS,
        title="Notificações",
        description="Escolha como deseja ser notificado sobre sua agenda",
        order=4,
        required=False,
        estimated_minutes=2,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.PUBLIC_PROFILE,
        title="Perfil Público",
        description="Defina as preferências e visibilidade do seu perfil",
        order=5,
        required=True,
        estimated_minutes=3,
    ),
]

DEFAULT_PROFESSIONAL_FLOW_CONFIG = OnboardingFlowConfig(
    allow_skip=True,
    show_progress_bar=True,
    auto_advance=False,
    celebration_on_complete=True,
)

SUPPLIER_FLOW_NAME = "Configuração do Parceiro Comercial"
SUPPLIER_FLOW_TARGET = "fornecedor"
SUPPLIER_FLOW_DESCRIPTION = (
    "Configure seu perfil de parceiro DoctorQ, catálogo e integrações comerciais"
)

DEFAULT_SUPPLIER_FLOW_STEPS: List[OnboardingStepConfig] = [
    OnboardingStepConfig(
        step_type=OnboardingStepType.SUPPLIER_INFO,
        title="Informações do Parceiro",
        description="Cadastre os dados básicos da empresa e endereço",
        order=1,
        required=True,
        estimated_minutes=5,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SUPPLIER_TEAM,
        title="Equipe Comercial",
        description="Adicione contatos principais e responsáveis",
        order=2,
        required=False,
        estimated_minutes=3,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SUPPLIER_CATALOG,
        title="Catálogo e Categorias",
        description="Informe as categorias e principais produtos oferecidos",
        order=3,
        required=True,
        estimated_minutes=4,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SUPPLIER_LOGISTICS,
        title="Logística e Políticas",
        description="Configure prazos, políticas comerciais e mínimos",
        order=4,
        required=True,
        estimated_minutes=3,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SUPPLIER_INTEGRATIONS,
        title="Pagamentos e Integrações",
        description="Configure canais de contato e integrações externas",
        order=5,
        required=False,
        estimated_minutes=3,
    ),
    OnboardingStepConfig(
        step_type=OnboardingStepType.SUPPLIER_REVIEW,
        title="Revisão Final",
        description="Revise e confirme as informações antes de publicar",
        order=6,
        required=True,
        estimated_minutes=2,
    ),
]

DEFAULT_SUPPLIER_FLOW_CONFIG = OnboardingFlowConfig(
    allow_skip=True,
    show_progress_bar=True,
    auto_advance=False,
    celebration_on_complete=True,
)


def _clean_str(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _is_data_uri(value: str) -> bool:
    return value.strip().lower().startswith("data:")


def _sanitize_logo_for_empresa(value: Optional[str]) -> Optional[str]:
    """Ignora data URIs ou strings maiores que o limite suportado em tb_empresas.ds_logo_url."""
    cleaned = _clean_str(value)
    if not cleaned:
        return None
    if len(cleaned) > EMPRESA_LOGO_MAX_LENGTH:
        logger.info(
            "Ignorando logo da empresa por exceder %s caracteres",
            EMPRESA_LOGO_MAX_LENGTH,
        )
        return None
    if _is_data_uri(cleaned):
        logger.info("Ignorando logo da empresa em formato data URI (não suportado)")
        return None
    return cleaned


def _only_digits(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    return digits or None


def _to_bool(value: Optional[object], default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes", "sim", "on"}:
            return True
        if lowered in {"false", "0", "no", "não", "off"}:
            return False
    if isinstance(value, (int, float)):
        return bool(value)
    return default


def _to_int(value: Optional[object], default: Optional[int] = None) -> Optional[int]:
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _sanitize_phone(value: Optional[str]) -> Optional[str]:
    digits = _only_digits(value)
    if not digits:
        return None
    return digits


def _get_preferences(user: User) -> Dict[str, Any]:
    prefs = user.ds_preferencias or {}
    if not isinstance(prefs, dict):
        try:
            prefs = dict(prefs)
        except Exception:
            prefs = {}
    return prefs


def _set_nested(data: Dict[str, Any], keys: List[str], value: Any) -> Dict[str, Any]:
    target = data
    for key in keys[:-1]:
        if key not in target or not isinstance(target[key], dict):
            target[key] = {}
        target = target[key]
    target[keys[-1]] = value
    return data


class OnboardingService:
    """Serviço para gerenciar onboarding de usuários"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =============================================================================
    # ONBOARDING FLOW MANAGEMENT
    # =============================================================================

    async def create_flow(self, flow_data: OnboardingFlowCreate) -> OnboardingFlow:
        """
        Cria um novo flow de onboarding

        Args:
            flow_data: Dados do flow

        Returns:
            Flow criado
        """
        try:
            # Converter steps para dict
            steps_dict = [step.model_dump() for step in flow_data.ds_steps]

            # Converter config para dict
            config_dict = (
                flow_data.ds_config.model_dump() if flow_data.ds_config else None
            )

            flow = OnboardingFlow(
                nm_flow=flow_data.nm_flow,
                ds_flow=flow_data.ds_flow,
                nm_target_type=flow_data.nm_target_type,
                nr_order=flow_data.nr_order,
                bl_ativo=flow_data.bl_ativo,
                ds_steps=steps_dict,
                ds_config=config_dict,
            )

            self.db.add(flow)
            await self.db.commit()
            await self.db.refresh(flow)

            logger.info(f"Flow de onboarding criado: {flow.nm_flow}")
            return flow

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar flow de onboarding: {str(e)}")
            raise

    async def get_flow_by_id(self, flow_id: uuid.UUID) -> Optional[OnboardingFlow]:
        """Busca flow por ID"""
        try:
            query = select(OnboardingFlow).where(OnboardingFlow.id_flow == flow_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar flow: {str(e)}")
            raise

    async def get_flow_by_name(self, flow_name: str) -> Optional[OnboardingFlow]:
        """Busca flow por nome"""
        try:
            query = select(OnboardingFlow).where(OnboardingFlow.nm_flow == flow_name)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar flow '{flow_name}': {str(e)}")
            raise

    async def get_active_flows(
        self, target_type: Optional[str] = None
    ) -> List[OnboardingFlow]:
        """
        Busca flows ativos, opcionalmente filtrados por target type

        Args:
            target_type: Tipo de usuário alvo (all_users, free_users, etc.)

        Returns:
            Lista de flows
        """
        try:
            query = select(OnboardingFlow).where(OnboardingFlow.bl_ativo == True)

            if target_type:
                query = query.where(
                    or_(
                        OnboardingFlow.nm_target_type == target_type,
                        OnboardingFlow.nm_target_type == "all_users",
                    )
                )

            query = query.order_by(OnboardingFlow.nr_order.asc())

            result = await self.db.execute(query)
            flows = result.scalars().all()

            return list(flows)

        except Exception as e:
            logger.error(f"Erro ao buscar flows ativos: {str(e)}")
            raise

    async def _ensure_clinic_flow(self) -> OnboardingFlow:
        """
        Garante que o flow padrão de onboarding de clínicas exista e retorna-o.
        """
        flow = await self.get_flow_by_name(CLINIC_FLOW_NAME)
        if flow:
            return flow

        try:
            flow_data = OnboardingFlowCreate(
                nm_flow=CLINIC_FLOW_NAME,
                ds_flow=CLINIC_FLOW_DESCRIPTION,
                nm_target_type=CLINIC_FLOW_TARGET,
                nr_order=5,
                bl_ativo=True,
                ds_steps=[step.model_copy() for step in DEFAULT_CLINIC_FLOW_STEPS],
                ds_config=DEFAULT_CLINIC_FLOW_CONFIG.model_copy(),
            )
            flow = await self.create_flow(flow_data)
            return flow
        except Exception as e:
            logger.error(
                f"Erro ao garantir flow de onboarding clínico '{CLINIC_FLOW_NAME}': {str(e)}"
            )
            raise

    async def _ensure_professional_flow(self) -> OnboardingFlow:
        """Garante que o flow padrão de onboarding de profissionais exista."""
        flow = await self.get_flow_by_name(PROFESSIONAL_FLOW_NAME)
        if flow:
            return flow

        try:
            flow_data = OnboardingFlowCreate(
                nm_flow=PROFESSIONAL_FLOW_NAME,
                ds_flow=PROFESSIONAL_FLOW_DESCRIPTION,
                nm_target_type=PROFESSIONAL_FLOW_TARGET,
                nr_order=6,
                bl_ativo=True,
                ds_steps=[step.model_copy() for step in DEFAULT_PROFESSIONAL_FLOW_STEPS],
                ds_config=DEFAULT_PROFESSIONAL_FLOW_CONFIG.model_copy(),
            )
            return await self.create_flow(flow_data)
        except Exception as e:
            logger.error(
                f"Erro ao garantir flow profissional '{PROFESSIONAL_FLOW_NAME}': {str(e)}"
            )
            raise

    async def _ensure_supplier_flow(self) -> OnboardingFlow:
        """Garante que o flow padrão de onboarding de fornecedores exista."""
        flow = await self.get_flow_by_name(SUPPLIER_FLOW_NAME)
        if flow:
            return flow

        try:
            flow_data = OnboardingFlowCreate(
                nm_flow=SUPPLIER_FLOW_NAME,
                ds_flow=SUPPLIER_FLOW_DESCRIPTION,
                nm_target_type=SUPPLIER_FLOW_TARGET,
                nr_order=7,
                bl_ativo=True,
                ds_steps=[step.model_copy() for step in DEFAULT_SUPPLIER_FLOW_STEPS],
                ds_config=DEFAULT_SUPPLIER_FLOW_CONFIG.model_copy(),
            )
            return await self.create_flow(flow_data)
        except Exception as e:
            logger.error(
                f"Erro ao garantir flow de fornecedor '{SUPPLIER_FLOW_NAME}': {str(e)}"
            )
            raise

    async def update_flow(
        self, flow_id: uuid.UUID, flow_data: OnboardingFlowUpdate
    ) -> OnboardingFlow:
        """Atualiza um flow de onboarding"""
        try:
            flow = await self.get_flow_by_id(flow_id)
            if not flow:
                raise ValueError(f"Flow {flow_id} não encontrado")

            # Atualizar campos se fornecidos
            if flow_data.nm_flow is not None:
                flow.nm_flow = flow_data.nm_flow
            if flow_data.ds_flow is not None:
                flow.ds_flow = flow_data.ds_flow
            if flow_data.nm_target_type is not None:
                flow.nm_target_type = flow_data.nm_target_type
            if flow_data.nr_order is not None:
                flow.nr_order = flow_data.nr_order
            if flow_data.bl_ativo is not None:
                flow.bl_ativo = flow_data.bl_ativo
            if flow_data.ds_steps is not None:
                flow.ds_steps = [step.model_dump() for step in flow_data.ds_steps]
            if flow_data.ds_config is not None:
                flow.ds_config = flow_data.ds_config.model_dump()

            await self.db.commit()
            await self.db.refresh(flow)

            logger.info(f"Flow atualizado: {flow.nm_flow}")
            return flow

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar flow: {str(e)}")
            raise

    async def delete_flow(self, flow_id: uuid.UUID) -> bool:
        """Deleta (desativa) um flow"""
        try:
            flow = await self.get_flow_by_id(flow_id)
            if not flow:
                raise ValueError(f"Flow {flow_id} não encontrado")

            flow.bl_ativo = False
            await self.db.commit()

            logger.info(f"Flow desativado: {flow.nm_flow}")
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao desativar flow: {str(e)}")
            raise

    # =============================================================================
    # HELPER METHODS
    # =============================================================================

    async def _get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Busca usuário por ID."""
        try:
            result = await self.db.execute(select(User).where(User.id_user == user_id))
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar usuário {user_id}: {str(e)}")
            raise

    async def _get_empresa_by_id(
        self, empresa_id: Optional[uuid.UUID]
    ) -> Optional[Empresa]:
        """Busca empresa por ID."""
        if not empresa_id:
            return None
        try:
            result = await self.db.execute(
                select(Empresa).where(Empresa.id_empresa == empresa_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar empresa {empresa_id}: {str(e)}")
            raise

    async def _get_or_create_clinic(
        self, empresa_id: uuid.UUID, default_name: Optional[str] = None
    ) -> ClinicaORM:
        """Garante que exista uma clínica vinculada à empresa."""
        try:
            query = (
                select(ClinicaORM)
                .where(ClinicaORM.id_empresa == empresa_id)
                .order_by(ClinicaORM.dt_criacao.asc())
            )
            result = await self.db.execute(query)
            clinic = result.scalars().first()
            if clinic:
                return clinic

            clinic_name = default_name or "Clínica DoctorQ"
            clinic = ClinicaORM(
                id_empresa=empresa_id,
                nm_clinica=clinic_name,
                st_ativo=True,
            )
            self.db.add(clinic)
            await self.db.flush()
            logger.info(
                "Clínica criada automaticamente para empresa %s durante onboarding",
                empresa_id,
            )
            return clinic
        except Exception as e:
            logger.error(
                f"Erro ao garantir clínica para empresa {empresa_id}: {str(e)}"
            )
            raise

    async def _get_professional(self, user: User) -> Optional[ProfissionalORM]:
        try:
            query = (
                select(ProfissionalORM)
                .where(ProfissionalORM.id_user == user.id_user)
                .order_by(ProfissionalORM.dt_criacao.asc())
            )
            result = await self.db.execute(query)
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Erro ao buscar profissional para usuário {user.id_user}: {str(e)}")
            raise

    async def _get_or_create_professional(self, user: User) -> ProfissionalORM:
        profissional = await self._get_professional(user)
        if profissional:
            return profissional

        try:
            profissional = ProfissionalORM(
                id_user=user.id_user,
                id_empresa=user.id_empresa,
                nm_profissional=_clean_str(user.nm_completo) or user.nm_email,
                ds_email=user.nm_email,
                ds_especialidades="[]",
                st_ativo=True,
            )
            self.db.add(profissional)
            await self.db.flush()
            logger.info(
                "Profissional criado automaticamente para usuário %s durante onboarding",
                user.id_user,
            )
            return profissional
        except Exception as e:
            logger.error(f"Erro ao criar profissional para usuário {user.id_user}: {str(e)}")
            raise

    async def _get_supplier(self, user: User) -> Optional[FornecedorORM]:
        try:
            query = (
                select(FornecedorORM)
                .where(FornecedorORM.id_user == user.id_user)
                .order_by(FornecedorORM.dt_criacao.asc())
            )
            result = await self.db.execute(query)
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Erro ao buscar fornecedor para usuário {user.id_user}: {str(e)}")
            raise

    def _infer_target_types(self, user: User) -> List[str]:
        """Determina os flows preferenciais para o usuário."""
        targets: List[str] = []
        papel_value = _clean_str(user.nm_papel)
        papel_enum: Optional[PapelUsuario] = None
        papel_lower = papel_value.lower() if papel_value else ""

        if papel_value:
            try:
                papel_enum = PapelUsuario(papel_value)
            except ValueError:
                papel_enum = None

        clinic_roles = {
            PapelUsuario.GESTOR_CLINICA,
            PapelUsuario.RECEPCIONISTA,
            PapelUsuario.SECRETARIA,
            PapelUsuario.FINANCEIRO,
            PapelUsuario.PROFISSIONAL,
        }

        clinic_aliases = {
            "gestor_clinica",
            "gestor clínica",
            "gestor",
            "clinica",
            "clínica",
            "manager",
        }
        professional_aliases = {
            "profissional",
            "profissional_estetica",
            "profissional_estética",
            "medico",
            "médico",
            "esteticista",
        }
        supplier_aliases = {
            "fornecedor",
            "gestor_fornecedor",
            "vendedor",
            "marketing",
            "parceiro",
        }

        if papel_enum == PapelUsuario.PROFISSIONAL or papel_lower in professional_aliases:
            targets.append(PROFESSIONAL_FLOW_TARGET)

        if papel_enum in {PapelUsuario.FORNECEDOR, PapelUsuario.PARCEIRO} or papel_lower in supplier_aliases:
            targets.append(SUPPLIER_FLOW_TARGET)

        if (
            papel_enum in clinic_roles
            or papel_lower in clinic_aliases
            or user.id_empresa is not None
        ):
            targets.append(CLINIC_FLOW_TARGET)

        targets.append("all_users")
        # Remover duplicatas mantendo ordem
        seen = set()
        return [t for t in targets if not (t in seen or seen.add(t))]

    async def _handle_step_data(
        self,
        user: User,
        step_request: CompleteStepRequest,
        progress: UserOnboardingProgress,
    ) -> Dict:
        """Trata dados específicos de cada step e realiza persistência."""
        data = step_request.data or {}
        step_type = step_request.step_type

        empresa: Optional[Empresa] = None
        clinic: Optional[ClinicaORM] = None

        requires_empresa = step_type in {
            OnboardingStepType.CLINIC_INFO,
            OnboardingStepType.SCHEDULE_SETUP,
            OnboardingStepType.TEAM_SETUP,
            OnboardingStepType.SERVICES_SETUP,
            OnboardingStepType.NOTIFICATIONS,
            OnboardingStepType.INTEGRATIONS,
            OnboardingStepType.PRIVACY,
        }

        if requires_empresa:
            if not user.id_empresa:
                raise ValueError(
                    "Usuário não possui empresa associada para completar este passo"
                )

            empresa = await self._get_empresa_by_id(user.id_empresa)
            if not empresa:
                raise ValueError("Empresa associada ao usuário não foi encontrada")

            if step_type in {
                OnboardingStepType.CLINIC_INFO,
                OnboardingStepType.SCHEDULE_SETUP,
                OnboardingStepType.TEAM_SETUP,
                OnboardingStepType.SERVICES_SETUP,
                OnboardingStepType.PRIVACY,
            }:
                clinic = await self._get_or_create_clinic(
                    empresa.id_empresa,
                    default_name=empresa.nm_empresa or user.nm_completo,
                )

        if step_type == OnboardingStepType.CLINIC_INFO:
            return await self._handle_clinic_info_step(user, empresa, clinic, data)
        if step_type == OnboardingStepType.SCHEDULE_SETUP:
            return await self._handle_schedule_setup_step(clinic, data)
        if step_type == OnboardingStepType.TEAM_SETUP:
            return await self._handle_team_setup_step(user, clinic, data)
        if step_type == OnboardingStepType.SERVICES_SETUP:
            return await self._handle_services_setup_step(clinic, data)
        if step_type == OnboardingStepType.NOTIFICATIONS:
            if not empresa:
                raise ValueError("Empresa não encontrada para configurar notificações")
            return await self._handle_notifications_step(empresa, data)
        if step_type == OnboardingStepType.INTEGRATIONS:
            if not empresa:
                raise ValueError("Empresa não encontrada para configurar integrações")
            return await self._handle_integrations_step(empresa, data)
        if step_type == OnboardingStepType.PRIVACY:
            if not empresa:
                raise ValueError("Empresa não encontrada para configurar privacidade")
            return await self._handle_privacy_step(empresa, clinic, data)

        # Professional-specific steps
        if step_type == OnboardingStepType.PROFESSIONAL_INFO:
            return await self._handle_professional_info_step(user, data)
        if step_type == OnboardingStepType.AVAILABILITY:
            return await self._handle_availability_step(user, data)
        if step_type == OnboardingStepType.SERVICES:
            return await self._handle_professional_services_step(user, data)
        if step_type == OnboardingStepType.PUBLIC_PROFILE:
            return await self._handle_public_profile_step(user, data)

        # Para steps sem tratamento específico, apenas retorna os dados
        return data

    async def _handle_clinic_info_step(
        self,
        user: User,
        empresa: Optional[Empresa],
        clinic: Optional[ClinicaORM],
        data: Dict,
    ) -> Dict:
        if not clinic:
            raise ValueError("Clínica não encontrada para atualização de dados")

        nome_clinica = _clean_str(data.get("nm_clinica")) or clinic.nm_clinica
        if not nome_clinica and empresa and empresa.nm_empresa:
            nome_clinica = empresa.nm_empresa

        clinic.nm_clinica = nome_clinica or clinic.nm_clinica
        clinic.ds_clinica = _clean_str(data.get("ds_descricao")) or clinic.ds_clinica
        clinic.nr_cnpj = _only_digits(data.get("nr_cnpj")) or clinic.nr_cnpj
        clinic.nr_telefone = _clean_str(data.get("nr_telefone")) or clinic.nr_telefone
        clinic.ds_email = _clean_str(data.get("ds_email")) or clinic.ds_email
        clinic.ds_endereco = _clean_str(data.get("ds_endereco")) or clinic.ds_endereco
        clinic.nm_cidade = _clean_str(data.get("ds_cidade")) or clinic.nm_cidade
        clinic.nm_estado = _clean_str(data.get("ds_estado")) or clinic.nm_estado
        clinic.nr_cep = _only_digits(data.get("nr_cep")) or clinic.nr_cep

        logo_data = data.get("ds_logo_url")
        if logo_data:
            clinic.ds_foto_principal = logo_data

        if empresa:
            if nome_clinica and not empresa.nm_empresa:
                empresa.nm_empresa = nome_clinica
            if clinic.nr_cnpj and not empresa.nr_cnpj:
                empresa.nr_cnpj = clinic.nr_cnpj
            if clinic.nr_telefone and not empresa.nr_telefone:
                empresa.nr_telefone = clinic.nr_telefone
            if clinic.ds_email and not empresa.nm_email_contato:
                empresa.nm_email_contato = clinic.ds_email
            if clinic.ds_endereco and not empresa.nm_endereco:
                empresa.nm_endereco = clinic.ds_endereco
            if clinic.nm_cidade and not empresa.nm_cidade:
                empresa.nm_cidade = clinic.nm_cidade
            if clinic.nm_estado and not empresa.nm_estado:
                empresa.nm_estado = clinic.nm_estado
            if clinic.nr_cep and not empresa.nr_cep:
                empresa.nr_cep = clinic.nr_cep
            empresa_logo = _sanitize_logo_for_empresa(logo_data)
            if empresa_logo:
                empresa.ds_logo_url = empresa_logo
            elif logo_data:
                logger.debug(
                    "Logo da clínica mantido apenas em tb_clinicas: tamanho=%s, data_uri=%s",
                    len(logo_data),
                    _is_data_uri(logo_data) if isinstance(logo_data, str) else False,
                )

        await self.db.flush()
        return {
            "nm_clinica": clinic.nm_clinica,
            "nr_cnpj": clinic.nr_cnpj,
            "ds_descricao": clinic.ds_clinica,
            "nr_telefone": clinic.nr_telefone,
            "ds_email": clinic.ds_email,
            "ds_endereco": clinic.ds_endereco,
            "ds_cidade": clinic.nm_cidade,
            "ds_estado": clinic.nm_estado,
            "nr_cep": clinic.nr_cep,
            "ds_logo_url": clinic.ds_foto_principal,
        }

    async def _handle_schedule_setup_step(
        self, clinic: Optional[ClinicaORM], data: Dict
    ) -> Dict:
        if not clinic:
            raise ValueError("Clínica não encontrada para configurar horários")

        schedule = {
            "hr_abertura": _clean_str(data.get("hr_abertura")),
            "hr_fechamento": _clean_str(data.get("hr_fechamento")),
            "nr_intervalo_agendamento": _to_int(
                data.get("nr_intervalo_agendamento"), 30
            ),
            "st_agenda_sabado": _to_bool(data.get("st_agenda_sabado")),
            "st_agenda_domingo": _to_bool(data.get("st_agenda_domingo")),
            "nr_antecedencia_cancelamento": _to_int(
                data.get("nr_antecedencia_cancelamento"), 24
            ),
            "nr_tolerancia_atraso": _to_int(
                data.get("nr_tolerancia_atraso"), 15
            ),
        }

        clinic.ds_horario_funcionamento = {
            "hr_abertura": schedule["hr_abertura"],
            "hr_fechamento": schedule["hr_fechamento"],
            "intervalo_minutos": schedule["nr_intervalo_agendamento"],
            "atende_sabado": schedule["st_agenda_sabado"],
            "atende_domingo": schedule["st_agenda_domingo"],
            "antecedencia_cancelamento_horas": schedule["nr_antecedencia_cancelamento"],
            "tolerancia_atraso_minutos": schedule["nr_tolerancia_atraso"],
        }

        if schedule["nr_intervalo_agendamento"] is not None:
            clinic.nr_tempo_medio_consulta = schedule["nr_intervalo_agendamento"]

        await self.db.flush()
        return schedule

    async def _handle_team_setup_step(
        self, user: User, clinic: Optional[ClinicaORM], data: Dict
    ) -> Dict:
        if not clinic:
            raise ValueError("Clínica não encontrada para cadastrar profissionais")

        profissionais_input = data.get("profissionais") or []
        profissionais_output: List[Dict] = []

        for entry in profissionais_input:
            nome = _clean_str(entry.get("nm_profissional"))
            if not nome:
                continue

            email = _clean_str(entry.get("ds_email"))
            registro = _clean_str(entry.get("nr_registro"))
            especialidade = _clean_str(entry.get("ds_especialidade"))
            telefone = _sanitize_phone(entry.get("nr_telefone"))
            especialidades_array = [especialidade] if especialidade else None

            profissional_id = await self._upsert_professional(
                clinic_id=clinic.id_clinica,
                empresa_id=user.id_empresa,
                name=nome,
                email=email.lower() if email else None,
                telefone=telefone,
                registro=registro,
                especialidades=especialidades_array,
            )

            profissionais_output.append(
                {
                    "id_profissional": str(profissional_id),
                    "nm_profissional": nome,
                    "nr_registro": registro,
                    "ds_especialidade": especialidade,
                    "ds_email": email,
                    "nr_telefone": telefone,
                }
            )

        return {"profissionais": profissionais_output}

    async def _upsert_professional(
        self,
        clinic_id: uuid.UUID,
        empresa_id: Optional[uuid.UUID],
        name: str,
        email: Optional[str],
        telefone: Optional[str],
        registro: Optional[str],
        especialidades: Optional[List[str]],
    ) -> uuid.UUID:
        email_lower = email.lower() if email else None
        select_query = text(
            """
            SELECT id_profissional
            FROM tb_profissionais
            WHERE id_clinica = :id_clinica
              AND LOWER(nm_profissional) = :nome
              AND (:email IS NULL OR LOWER(COALESCE(ds_email, '')) = :email)
            ORDER BY dt_atualizacao DESC
            LIMIT 1
            """
        )

        result = await self.db.execute(
            select_query,
            {"id_clinica": str(clinic_id), "nome": name.lower(), "email": email_lower},
        )
        row = result.first()

        if row:
            profissional_id = row[0]
            update_query = text(
                """
                UPDATE tb_profissionais
                SET nr_registro_profissional = :registro,
                    ds_especialidades = COALESCE(:especialidades, ds_especialidades),
                    ds_email = :email,
                    nr_telefone = :telefone,
                    st_ativo = TRUE,
                    dt_atualizacao = NOW()
                WHERE id_profissional = :id_profissional
                """
            )
            await self.db.execute(
                update_query,
                {
                    "registro": registro,
                    "especialidades": especialidades,
                    "email": email_lower,
                    "telefone": telefone,
                    "id_profissional": profissional_id,
                },
            )
            return profissional_id

        novo_id = uuid.uuid4()
        insert_query = text(
            """
            INSERT INTO tb_profissionais (
                id_profissional,
                id_user,
                id_clinica,
                id_empresa,
                nm_profissional,
                ds_especialidades,
                nr_registro_profissional,
                ds_email,
                nr_telefone,
                st_aceita_novos_pacientes,
                st_ativo,
                dt_criacao,
                dt_atualizacao
            )
            VALUES (
                :id_profissional,
                NULL,
                :id_clinica,
                :id_empresa,
                :nome,
                COALESCE(:especialidades, ARRAY[]::text[]),
                :registro,
                :email,
                :telefone,
                TRUE,
                TRUE,
                NOW(),
                NOW()
            )
            """
        )

        await self.db.execute(
            insert_query,
            {
                "id_profissional": novo_id,
                "id_clinica": str(clinic_id),
                "id_empresa": str(empresa_id) if empresa_id else None,
                "nome": name,
                "especialidades": especialidades,
                "registro": registro,
                "email": email_lower,
                "telefone": telefone,
            },
        )
        return novo_id

    async def _handle_services_setup_step(
        self, clinic: Optional[ClinicaORM], data: Dict
    ) -> Dict:
        if not clinic:
            raise ValueError("Clínica não encontrada para cadastrar procedimentos")

        procedimentos_input = data.get("procedimentos") or []
        procedimentos_output: List[Dict] = []

        for entry in procedimentos_input:
            nome = _clean_str(entry.get("nm_procedimento"))
            if not nome:
                continue

            categoria = _clean_str(entry.get("ds_categoria"))
            duracao = _to_int(entry.get("qt_duracao"), 30) or 30

            preco_raw = entry.get("vl_procedimento")
            preco: Optional[float]
            try:
                preco = float(preco_raw) if preco_raw not in (None, "") else None
            except (TypeError, ValueError):
                preco = None

            descricao = _clean_str(entry.get("ds_procedimento"))

            procedimento_id = await self._upsert_procedure(
                clinic_id=clinic.id_clinica,
                name=nome,
                categoria=categoria,
                duracao=duracao,
                preco=preco,
                descricao=descricao,
            )

            procedimentos_output.append(
                {
                    "id_procedimento": str(procedimento_id),
                    "nm_procedimento": nome,
                    "ds_categoria": categoria,
                    "qt_duracao": duracao,
                    "vl_procedimento": preco,
                    "ds_procedimento": descricao,
                }
            )

        return {"procedimentos": procedimentos_output}

    async def _upsert_procedure(
        self,
        clinic_id: uuid.UUID,
        name: str,
        categoria: Optional[str],
        duracao: int,
        preco: Optional[float],
        descricao: Optional[str],
    ) -> uuid.UUID:
        select_query = text(
            """
            SELECT id_procedimento
            FROM tb_procedimentos
            WHERE id_clinica = :id_clinica
              AND LOWER(nm_procedimento) = :nome
            ORDER BY dt_atualizacao DESC
            LIMIT 1
            """
        )

        result = await self.db.execute(
            select_query,
            {"id_clinica": str(clinic_id), "nome": name.lower()},
        )
        row = result.first()

        if row:
            procedimento_id = row[0]
            update_query = text(
                """
                UPDATE tb_procedimentos
                SET ds_categoria = :categoria,
                    vl_preco = :preco,
                    nr_duracao_minutos = :duracao,
                    ds_procedimento = :descricao,
                    st_ativo = TRUE,
                    dt_atualizacao = NOW()
                WHERE id_procedimento = :id_procedimento
                """
            )
            await self.db.execute(
                update_query,
                {
                    "categoria": categoria,
                    "preco": preco,
                    "duracao": duracao,
                    "descricao": descricao,
                    "id_procedimento": procedimento_id,
                },
            )
            return procedimento_id

        novo_id = uuid.uuid4()
        insert_query = text(
            """
            INSERT INTO tb_procedimentos (
                id_procedimento,
                id_clinica,
                nm_procedimento,
                ds_procedimento,
                ds_categoria,
                vl_preco,
                nr_duracao_minutos,
                st_requer_avaliacao,
                st_disponivel_online,
                st_ativo,
                dt_criacao,
                dt_atualizacao
            )
            VALUES (
                :id_procedimento,
                :id_clinica,
                :nome,
                :descricao,
                :categoria,
                :preco,
                :duracao,
                FALSE,
                TRUE,
                TRUE,
                NOW(),
                NOW()
            )
            """
        )

        await self.db.execute(
            insert_query,
            {
                "id_procedimento": novo_id,
                "id_clinica": str(clinic_id),
                "nome": name,
                "descricao": descricao,
                "categoria": categoria,
                "preco": preco,
                "duracao": duracao,
            },
        )
        return novo_id

    async def _handle_notifications_step(
        self, empresa: Empresa, data: Dict
    ) -> Dict:
        notifications = {
            "email": _to_bool(data.get("st_notificacao_email"), True),
            "sms": _to_bool(data.get("st_notificacao_sms"), False),
            "whatsapp": _to_bool(data.get("st_notificacao_whatsapp"), True),
            "lembrete": _to_bool(data.get("st_lembrete_agendamento"), True),
            "horas_lembrete": _to_int(data.get("nr_horas_lembrete"), 24),
        }

        payments = {
            "dinheiro": _to_bool(data.get("st_aceita_dinheiro"), True),
            "pix": _to_bool(data.get("st_aceita_pix"), True),
            "desconto_pix": _to_int(data.get("pc_desconto_pix"), 0),
            "cartao_credito": _to_bool(data.get("st_aceita_credito"), True),
            "parcelas_maximo": _to_int(data.get("nr_parcelas_maximo"), 1),
            "cartao_debito": _to_bool(data.get("st_aceita_debito"), True),
        }

        config = empresa.ds_config or {}
        config.setdefault("notifications", {}).update(notifications)
        config.setdefault("payments", {}).update(payments)
        empresa.ds_config = config

        await self.db.flush()
        return {"notifications": notifications, "payments": payments}

    async def _handle_integrations_step(self, empresa: Empresa, data: Dict) -> Dict:
        integrations = {
            "whatsapp": {
                "enabled": _to_bool(data.get("fg_whatsapp"), False),
                "numero": _sanitize_phone(data.get("nr_whatsapp")),
            },
            "google_calendar": {
                "enabled": _to_bool(data.get("fg_google_calendar"), False)
            },
            "email_smtp": {
                "enabled": _to_bool(data.get("fg_email_smtp"), False),
                "email_remetente": _clean_str(data.get("ds_email_smtp")),
            },
            "pagamento_online": {
                "enabled": _to_bool(data.get("fg_pagamento_online"), False),
                "api_key": _clean_str(data.get("ds_api_key_pagamento")),
            },
        }

        config = empresa.ds_config or {}
        config["integrations"] = integrations
        empresa.ds_config = config

        await self.db.flush()
        return integrations

    async def _handle_privacy_step(
        self,
        empresa: Empresa,
        clinic: Optional[ClinicaORM],
        data: Dict,
    ) -> Dict:
        privacy = {
            "perfil_publico": _to_bool(data.get("st_perfil_publico"), True),
            "mostrar_precos": _to_bool(data.get("st_mostrar_precos"), True),
            "aceitar_avaliacao": _to_bool(data.get("st_aceitar_avaliacao"), True),
            "compartilhar_fotos": _to_bool(data.get("st_compartilhar_fotos"), False),
            "politica_privacidade": _clean_str(data.get("ds_politica_privacidade")),
        }

        appearance = {
            "tema": _clean_str(data.get("ds_tema")) or "light",
            "cor_primaria": _clean_str(data.get("ds_cor_primaria"))
            or empresa.nm_cor_primaria,
            "logo_url": _clean_str(data.get("ds_logo_url")) or empresa.ds_logo_url,
        }

        config = empresa.ds_config or {}
        config["privacy"] = privacy
        config["appearance"] = appearance
        empresa.ds_config = config

        if appearance["cor_primaria"]:
            empresa.nm_cor_primaria = appearance["cor_primaria"]
        logo_for_empresa = _sanitize_logo_for_empresa(appearance["logo_url"])
        if logo_for_empresa:
            empresa.ds_logo_url = logo_for_empresa
            appearance["logo_url"] = logo_for_empresa
            if clinic:
                clinic.ds_foto_principal = logo_for_empresa
        elif appearance["logo_url"]:
            logger.debug(
                "Logo recebido na etapa de privacidade ignorado para empresa. tamanho=%s, data_uri=%s",
                len(appearance["logo_url"]),
                _is_data_uri(appearance["logo_url"]),
            )
            if clinic and _is_data_uri(appearance["logo_url"]):
                clinic.ds_foto_principal = appearance["logo_url"]

        await self.db.flush()
        return {"privacy": privacy, "appearance": appearance}

    async def _handle_professional_info_step(
        self, user: User, data: Dict
    ) -> Dict:
        """Salva informações profissionais do step 1"""
        profissional = await self._get_or_create_professional(user)

        # Atualizar dados básicos
        if data.get("nm_profissional"):
            profissional.nm_profissional = _clean_str(data["nm_profissional"])
        if data.get("ds_email"):
            profissional.ds_email = _clean_str(data["ds_email"])
        if data.get("nr_telefone"):
            profissional.nr_telefone = _sanitize_phone(data["nr_telefone"])
        if data.get("nr_whatsapp"):
            profissional.nr_whatsapp = _sanitize_phone(data["nr_whatsapp"])

        # Especialidade (converter string para array JSON)
        if data.get("ds_especialidade"):
            especialidade = _clean_str(data["ds_especialidade"])
            profissional.ds_especialidades = [especialidade] if especialidade else []

        # Registro profissional
        if data.get("nr_registro"):
            profissional.nr_registro_profissional = _clean_str(data["nr_registro"])

        # Biografia e formação
        if data.get("ds_biografia"):
            profissional.ds_bio = _clean_str(data["ds_biografia"])
        if data.get("ds_formacao"):
            profissional.ds_formacao = _clean_str(data["ds_formacao"])
        if data.get("nr_anos_experiencia"):
            profissional.nr_anos_experiencia = _to_int(data["nr_anos_experiencia"])

        # Foto de perfil
        if data.get("ds_foto_url"):
            profissional.ds_foto = data["ds_foto_url"]

        await self.db.commit()
        logger.info(f"Informações profissionais atualizadas para usuário {user.id_user}")

        return {
            "nm_profissional": profissional.nm_profissional,
            "ds_email": profissional.ds_email,
            "nr_telefone": profissional.nr_telefone,
            "ds_especialidade": profissional.ds_especialidades[0] if profissional.ds_especialidades else None,
            "nr_registro": profissional.nr_registro_profissional,
            "ds_foto_url": profissional.ds_foto,
        }

    async def _handle_availability_step(
        self, user: User, data: Dict
    ) -> Dict:
        """Salva horários de atendimento do step 2"""
        profissional = await self._get_or_create_professional(user)

        # Salvar horários semanais (JSONB)
        if data.get("ds_horarios_atendimento"):
            profissional.ds_horarios_atendimento = data["ds_horarios_atendimento"]

        # Duração padrão da consulta
        if data.get("nr_tempo_consulta"):
            profissional.nr_tempo_consulta = _to_int(data["nr_tempo_consulta"], 60)

        # Intervalo entre consultas (salvar em JSONB dos horários)
        if data.get("qt_intervalo_consultas"):
            horarios = profissional.ds_horarios_atendimento or {}
            horarios["intervalo_consultas"] = _to_int(data["qt_intervalo_consultas"], 0)
            profissional.ds_horarios_atendimento = horarios

        await self.db.commit()
        logger.info(f"Horários de atendimento configurados para profissional {profissional.id_profissional}")

        return {
            "ds_horarios_atendimento": profissional.ds_horarios_atendimento,
            "nr_tempo_consulta": profissional.nr_tempo_consulta,
        }

    async def _handle_professional_services_step(
        self, user: User, data: Dict
    ) -> Dict:
        """Salva procedimentos oferecidos do step 3"""
        profissional = await self._get_or_create_professional(user)

        # Salvar array de procedimentos realizados (campo TEXT que armazena JSON)
        if data.get("ds_procedimentos_realizados"):
            procedimentos = data["ds_procedimentos_realizados"]
            if isinstance(procedimentos, list):
                # Converter lista para string JSON
                profissional.ds_procedimentos_realizados = json.dumps(procedimentos)
            else:
                profissional.ds_procedimentos_realizados = json.dumps([procedimentos])

        await self.db.commit()
        logger.info(f"Procedimentos configurados para profissional {profissional.id_profissional}")

        # Retornar como lista (parse do JSON)
        try:
            procedimentos_list = json.loads(profissional.ds_procedimentos_realizados or "[]")
        except json.JSONDecodeError:
            procedimentos_list = []

        return {
            "ds_procedimentos_realizados": procedimentos_list,
        }

    async def _handle_public_profile_step(
        self, user: User, data: Dict
    ) -> Dict:
        """Salva configurações de perfil público do step 5"""
        profissional = await self._get_or_create_professional(user)

        # Configurações de visibilidade
        if data.get("st_aceita_online") is not None:
            profissional.st_aceita_online = _to_bool(data["st_aceita_online"], True)

        # Notificações (salvar nas preferências do usuário)
        prefs = user.ds_preferencias or {}
        if data.get("st_notificacao_email") is not None:
            prefs["notificacoes_email"] = _to_bool(data["st_notificacao_email"])
        if data.get("st_notificacao_whatsapp") is not None:
            prefs["notificacoes_whatsapp"] = _to_bool(data["st_notificacao_whatsapp"])
        if data.get("st_perfil_publico") is not None:
            prefs["perfil_publico"] = _to_bool(data["st_perfil_publico"], True)
        user.ds_preferencias = prefs

        await self.db.commit()
        logger.info(f"Perfil público configurado para profissional {profissional.id_profissional}")

        return {
            "st_aceita_online": profissional.st_aceita_online,
            "st_perfil_publico": prefs.get("perfil_publico", True),
        }

    # =============================================================================
    # USER PROGRESS MANAGEMENT
    # =============================================================================

    async def start_onboarding(
        self, user_id: uuid.UUID, flow_id: uuid.UUID
    ) -> UserOnboardingProgress:
        """
        Inicia onboarding para um usuário

        Args:
            user_id: ID do usuário
            flow_id: ID do flow

        Returns:
            Progresso criado
        """
        try:
            # Verificar se já existe progresso
            existing = await self.get_user_progress(user_id, flow_id)
            if existing:
                logger.info(
                    f"Usuário {user_id} já tem progresso no flow {flow_id}, retornando existente"
                )
                return existing

            flow = await self.get_flow_by_id(flow_id)
            if not flow:
                raise ValueError(f"Flow {flow_id} não encontrado para iniciar onboarding")

            initial_step = self._get_next_step(flow, [])

            # Criar novo progresso
            progress = UserOnboardingProgress(
                id_user=user_id,
                id_flow=flow_id,
                nm_status=OnboardingStatus.IN_PROGRESS,
                nr_progress_percentage=0,
                 nm_current_step=initial_step,
                 ds_progress_data={},
                dt_inicio=datetime.now(),
                dt_ultima_atividade=datetime.now(),
            )

            self.db.add(progress)
            await self.db.commit()
            await self.db.refresh(progress)

            # Registrar evento
            await self.create_event(
                OnboardingEventCreate(
                    id_user=user_id,
                    id_progress=progress.id_progress,
                    nm_event_type="flow_started",
                    ds_event_data={"flow_id": str(flow_id)},
                )
            )

            logger.info(f"Onboarding iniciado para usuário {user_id} no flow {flow_id}")
            return progress

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao iniciar onboarding: {str(e)}")
            raise

    async def get_user_progress(
        self, user_id: uuid.UUID, flow_id: uuid.UUID
    ) -> Optional[UserOnboardingProgress]:
        """Busca progresso de um usuário em um flow específico"""
        try:
            query = select(UserOnboardingProgress).where(
                and_(
                    UserOnboardingProgress.id_user == user_id,
                    UserOnboardingProgress.id_flow == flow_id,
                )
            )
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar progresso: {str(e)}")
            raise

    async def get_all_user_progress(
        self, user_id: uuid.UUID
    ) -> List[UserOnboardingProgress]:
        """Busca todo o progresso de onboarding de um usuário"""
        try:
            query = select(UserOnboardingProgress).where(
                UserOnboardingProgress.id_user == user_id
            )
            result = await self.db.execute(query)
            progress_list = result.scalars().all()
            return list(progress_list)
        except Exception as e:
            logger.error(f"Erro ao buscar progresso do usuário: {str(e)}")
            raise

    async def complete_step(
        self, user_id: uuid.UUID, flow_id: uuid.UUID, step_request: CompleteStepRequest
    ) -> UserOnboardingProgress:
        """
        Marca um step como completado

        Args:
            user_id: ID do usuário
            flow_id: ID do flow
            step_request: Request com tipo de step e dados opcionais

        Returns:
            Progresso atualizado
        """
        try:
            # Buscar progresso
            progress = await self.get_user_progress(user_id, flow_id)
            if not progress:
                # Se não existe, criar
                progress = await self.start_onboarding(user_id, flow_id)

            user = await self._get_user_by_id(user_id)
            if not user:
                raise ValueError(f"Usuário {user_id} não encontrado")

            # Buscar flow para validar step
            flow = await self.get_flow_by_id(flow_id)
            if not flow:
                raise ValueError(f"Flow {flow_id} não encontrado")

            # Validar se step existe no flow
            step_exists = any(
                step.get("step_type") == step_request.step_type
                for step in flow.ds_steps
            )
            if not step_exists:
                raise ValueError(
                    f"Step {step_request.step_type} não encontrado no flow"
                )

            # Processar dados específicos do step
            handled_data = await self._handle_step_data(user, step_request, progress)

            # Persistir dados do step
            progress_data = progress.ds_progress_data or {}
            progress_data[step_request.step_type.value] = handled_data
            progress.ds_progress_data = progress_data

            # Adicionar step aos completados se ainda não está
            completed_steps_raw = progress.ds_completed_steps or []
            completed_steps = [
                step if isinstance(step, str) else getattr(step, "value", str(step))
                for step in completed_steps_raw
            ]
            step_key = step_request.step_type.value
            if step_key not in completed_steps:
                completed_steps.append(step_key)
                progress.ds_completed_steps = completed_steps

            # Atualizar step atual para o próximo
            next_step = self._get_next_step(flow, completed_steps)
            progress.nm_current_step = next_step

            # Calcular progresso
            total_steps = len(flow.ds_steps)
            completed_count = len(completed_steps)
            progress.nr_progress_percentage = int((completed_count / total_steps) * 100)

            # Verificar se completou tudo
            if completed_count >= total_steps:
                progress.nm_status = OnboardingStatus.COMPLETED
                progress.dt_conclusao = datetime.now()

            progress.dt_ultima_atividade = datetime.now()

            await self.db.commit()
            await self.db.refresh(progress)

            # Registrar evento
            await self.create_event(
                OnboardingEventCreate(
                    id_user=user_id,
                    id_progress=progress.id_progress,
                    nm_event_type="step_completed",
                    nm_step_type=step_request.step_type,
                    ds_event_data=handled_data,
                )
            )

            logger.info(
                f"Step {step_request.step_type} completado para usuário {user_id}"
            )
            return progress

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao completar step: {str(e)}")
            raise

    async def skip_step(
        self, user_id: uuid.UUID, flow_id: uuid.UUID, skip_request: SkipStepRequest
    ) -> UserOnboardingProgress:
        """
        Pula um step

        Args:
            user_id: ID do usuário
            flow_id: ID do flow
            skip_request: Request com tipo de step e razão

        Returns:
            Progresso atualizado
        """
        try:
            progress = await self.get_user_progress(user_id, flow_id)
            if not progress:
                progress = await self.start_onboarding(user_id, flow_id)

            # Adicionar step aos pulados
            skipped_steps_raw = progress.ds_skipped_steps or []
            skipped_steps = [
                step if isinstance(step, str) else getattr(step, "value", str(step))
                for step in skipped_steps_raw
            ]
            skip_key = skip_request.step_type.value
            if skip_key not in skipped_steps:
                skipped_steps.append(skip_key)
                progress.ds_skipped_steps = skipped_steps

            # Buscar flow
            flow = await self.get_flow_by_id(flow_id)

            # Atualizar step atual para o próximo
            completed_steps = [
                step if isinstance(step, str) else getattr(step, "value", str(step))
                for step in (progress.ds_completed_steps or [])
            ]
            completed_and_skipped = completed_steps + skipped_steps
            next_step = self._get_next_step(flow, completed_and_skipped)
            progress.nm_current_step = next_step

            # Recalcular progresso (considerando skipped como "progress")
            total_steps = len(flow.ds_steps)
            completed_count = len(completed_steps)
            skipped_count = len(skipped_steps)
            progress.nr_progress_percentage = int(
                ((completed_count + skipped_count) / total_steps) * 100
            )

            progress.dt_ultima_atividade = datetime.now()

            await self.db.commit()
            await self.db.refresh(progress)

            # Registrar evento
            await self.create_event(
                OnboardingEventCreate(
                    id_user=user_id,
                    id_progress=progress.id_progress,
                    nm_event_type="step_skipped",
                    nm_step_type=skip_request.step_type,
                    ds_event_data={"reason": skip_request.reason},
                )
            )

            logger.info(f"Step {skip_request.step_type} pulado para usuário {user_id}")
            return progress

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao pular step: {str(e)}")
            raise

    def _get_next_step(
        self, flow: OnboardingFlow, completed_steps: List[str]
    ) -> Optional[str]:
        """
        Retorna o próximo step a ser completado

        Args:
            flow: Flow de onboarding
            completed_steps: Lista de steps completados/pulados

        Returns:
            Tipo do próximo step ou None se todos completados
        """
        # Ordenar steps por ordem
        sorted_steps = sorted(flow.ds_steps, key=lambda s: s.get("order", 0))

        # Encontrar primeiro step não completado
        for step in sorted_steps:
            if step.get("step_type") not in completed_steps:
                return step.get("step_type")

        return None

    # =============================================================================
    # DASHBOARD
    # =============================================================================

    async def get_user_dashboard(
        self, user_id: uuid.UUID, flow_id: Optional[uuid.UUID] = None
    ) -> OnboardingDashboard:
        """
        Retorna dashboard de onboarding para um usuário

        Args:
            user_id: ID do usuário
            flow_id: ID do flow específico (opcional, usa primeiro ativo se não fornecido)

        Returns:
            Dashboard com flow, progresso e próximos steps
        """
        try:
            user = await self._get_user_by_id(user_id)
            if not user:
                raise ValueError(f"Usuário {user_id} não encontrado")

            # Se não forneceu flow_id, pegar primeiro flow ativo
            if not flow_id:
                flow: Optional[OnboardingFlow] = None
                for target in self._infer_target_types(user):
                    if target == CLINIC_FLOW_TARGET:
                        flow = await self._ensure_clinic_flow()
                        break
                    if target == PROFESSIONAL_FLOW_TARGET:
                        flow = await self._ensure_professional_flow()
                        break
                    if target == SUPPLIER_FLOW_TARGET:
                        flow = await self._ensure_supplier_flow()
                        break
                    candidate_flows = await self.get_active_flows(target_type=target)
                    if candidate_flows:
                        flow = candidate_flows[0]
                        break

                if not flow:
                    fallback_flows = await self.get_active_flows()
                    if not fallback_flows:
                        raise ValueError("Nenhum flow de onboarding ativo encontrado")
                    flow = fallback_flows[0]

                flow_id = flow.id_flow
            else:
                flow = await self.get_flow_by_id(flow_id)
                if not flow:
                    raise ValueError(f"Flow {flow_id} não encontrado")

            # Buscar ou criar progresso
            progress = await self.get_user_progress(user_id, flow_id)
            if not progress:
                progress = await self.start_onboarding(user_id, flow_id)
            elif not progress.nm_current_step:
                completed_raw = progress.ds_completed_steps or []
                completed_cast = [
                    step if isinstance(step, str) else getattr(step, "value", str(step))
                    for step in completed_raw
                ]
                progress.nm_current_step = self._get_next_step(flow, completed_cast)

            # Normalizar listas de steps
            completed_steps = [
                step if isinstance(step, str) else getattr(step, "value", str(step))
                for step in (progress.ds_completed_steps or [])
            ]
            skipped_steps = [
                step if isinstance(step, str) else getattr(step, "value", str(step))
                for step in (progress.ds_skipped_steps or [])
            ]

            # Identificar step atual e próximos
            all_done_steps = completed_steps + skipped_steps

            # Ordenar steps
            sorted_steps = sorted(flow.ds_steps, key=lambda s: s.get("order", 0))

            # Encontrar step atual
            current_step_dict = None
            next_steps_dict = []

            for step in sorted_steps:
                step_type = step.get("step_type")
                if step_type not in all_done_steps:
                    if current_step_dict is None:
                        current_step_dict = step
                    else:
                        next_steps_dict.append(step)

            # Converter para Pydantic models
            current_step = (
                OnboardingStepConfig(**current_step_dict)
                if current_step_dict
                else None
            )
            next_steps = [OnboardingStepConfig(**s) for s in next_steps_dict[:3]]

            # Verificar se está completado
            is_completed = progress.nm_status == OnboardingStatus.COMPLETED

            return OnboardingDashboard(
                flow=OnboardingFlowResponse.model_validate(flow),
                progress=UserOnboardingProgressResponse.model_validate(progress),
                current_step=current_step,
                next_steps=next_steps,
                is_completed=is_completed,
                completion_percentage=progress.nr_progress_percentage,
            )

        except Exception as e:
            logger.error(f"Erro ao buscar dashboard de onboarding: {str(e)}")
            raise

    # =============================================================================
    # EVENTS
    # =============================================================================

    async def create_event(
        self, event_data: OnboardingEventCreate
    ) -> OnboardingEvent:
        """Cria um evento de onboarding"""
        try:
            event = OnboardingEvent(
                id_user=event_data.id_user,
                id_progress=event_data.id_progress,
                nm_event_type=event_data.nm_event_type,
                nm_step_type=event_data.nm_step_type,
                ds_event_data=event_data.ds_event_data,
            )

            self.db.add(event)
            await self.db.commit()
            await self.db.refresh(event)

            return event

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar evento de onboarding: {str(e)}")
            raise

    async def get_user_events(
        self, user_id: uuid.UUID, limit: int = 50
    ) -> List[OnboardingEvent]:
        """Busca eventos de onboarding de um usuário"""
        try:
            query = (
                select(OnboardingEvent)
                .where(OnboardingEvent.id_user == user_id)
                .order_by(OnboardingEvent.dt_event.desc())
                .limit(limit)
            )

            result = await self.db.execute(query)
            events = result.scalars().all()

            return list(events)

        except Exception as e:
            logger.error(f"Erro ao buscar eventos de onboarding: {str(e)}")
            raise


# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================

from fastapi import Depends

from src.config.orm_config import get_db


def get_onboarding_service(
    db: AsyncSession = Depends(get_db),
) -> OnboardingService:
    """Factory para OnboardingService"""
    return OnboardingService(db)
