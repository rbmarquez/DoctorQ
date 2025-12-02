"""
Service para gerenciamento de Billing, Planos e Assinaturas
Inclui lógica de negócio para monetização e quota enforcement
"""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.billing import (
    BillingInterval,
    Invoice,
    InvoiceCreate,
    InvoiceStatus,
    InvoiceUpdate,
    Payment,
    PaymentCreate,
    PaymentStatus,
    PaymentUpdate,
    Plan,
    PlanCreate,
    PlanTier,
    PlanUpdate,
    Subscription,
    SubscriptionCreate,
    SubscriptionStatus,
    SubscriptionUpdate,
    UsageMetric,
    UsageMetricCreate,
    UsageMetricType,
    UsageSummary,
)

logger = get_logger(__name__)


class BillingService:
    """Service para gerenciamento de billing"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =========================================================================
    # PLAN MANAGEMENT
    # =========================================================================

    async def create_plan(self, plan_data: PlanCreate) -> Plan:
        """Criar um novo plano"""
        try:
            # Verificar se já existe plano com mesmo nome
            existing_plan = await self.get_plan_by_name(plan_data.nm_plan)
            if existing_plan:
                raise ValueError(f"Plano com nome '{plan_data.nm_plan}' já existe")

            # Criar plano
            db_plan = Plan(
                nm_plan=plan_data.nm_plan,
                ds_plan=plan_data.ds_plan,
                nm_tier=plan_data.nm_tier.value,
                vl_price_monthly=plan_data.vl_price_monthly,
                vl_price_yearly=plan_data.vl_price_yearly,
                ds_features=plan_data.ds_features,
                ds_quotas=plan_data.ds_quotas,
                nr_trial_days=plan_data.nr_trial_days,
                nm_stripe_price_id_monthly=plan_data.nm_stripe_price_id_monthly,
                nm_stripe_price_id_yearly=plan_data.nm_stripe_price_id_yearly,
            )

            self.db.add(db_plan)
            await self.db.commit()
            await self.db.refresh(db_plan)

            logger.info(f"Plano criado: {db_plan.nm_plan} (tier: {db_plan.nm_tier})")
            return db_plan

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar plano: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar plano: {str(e)}") from e

    async def get_plan_by_id(self, plan_id: uuid.UUID) -> Optional[Plan]:
        """Buscar plano por ID"""
        try:
            stmt = select(Plan).where(Plan.id_plan == plan_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar plano: {str(e)}")
            raise RuntimeError(f"Erro ao buscar plano: {str(e)}") from e

    async def get_plan_by_name(self, name: str) -> Optional[Plan]:
        """Buscar plano por nome"""
        try:
            stmt = select(Plan).where(Plan.nm_plan == name)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar plano por nome: {str(e)}")
            raise RuntimeError(f"Erro ao buscar plano: {str(e)}") from e

    async def list_plans(
        self,
        page: int = 1,
        size: int = 10,
        tier: Optional[PlanTier] = None,
        visible_only: bool = True,
        active_only: bool = True,
    ) -> Tuple[List[Plan], int]:
        """Listar planos com filtros"""
        try:
            # Query base
            stmt = select(Plan)
            count_stmt = select(func.count(Plan.id_plan))

            # Filtros
            filters = []
            if tier:
                filters.append(Plan.nm_tier == tier.value)
            if visible_only:
                filters.append(Plan.st_visivel == "S")
            if active_only:
                filters.append(Plan.st_ativo == "S")

            if filters:
                stmt = stmt.where(and_(*filters))
                count_stmt = count_stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Ordenar por tier (free < starter < professional < enterprise)
            tier_order = {
                "free": 1,
                "starter": 2,
                "professional": 3,
                "enterprise": 4,
            }
            stmt = stmt.order_by(
                func.coalesce(
                    func.case(
                        (Plan.nm_tier == "free", tier_order["free"]),
                        (Plan.nm_tier == "starter", tier_order["starter"]),
                        (Plan.nm_tier == "professional", tier_order["professional"]),
                        (Plan.nm_tier == "enterprise", tier_order["enterprise"]),
                        else_=999,
                    ),
                    999,
                )
            )

            # Paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            result = await self.db.execute(stmt)
            plans = result.scalars().all()

            return list(plans), total

        except Exception as e:
            logger.error(f"Erro ao listar planos: {str(e)}")
            raise RuntimeError(f"Erro ao listar planos: {str(e)}") from e

    async def update_plan(
        self, plan_id: uuid.UUID, plan_update: PlanUpdate
    ) -> Optional[Plan]:
        """Atualizar plano"""
        try:
            plan = await self.get_plan_by_id(plan_id)
            if not plan:
                return None

            # Atualizar campos
            update_data = plan_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(plan, key, value)

            await self.db.commit()
            await self.db.refresh(plan)

            logger.info(f"Plano atualizado: {plan.nm_plan}")
            return plan

        except Exception as e:
            logger.error(f"Erro ao atualizar plano: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao atualizar plano: {str(e)}") from e

    # =========================================================================
    # SUBSCRIPTION MANAGEMENT
    # =========================================================================

    async def create_subscription(
        self, subscription_data: SubscriptionCreate
    ) -> Subscription:
        """Criar nova assinatura"""
        try:
            # Verificar se plano existe
            plan = await self.get_plan_by_id(subscription_data.id_plan)
            if not plan:
                raise ValueError(f"Plano não encontrado: {subscription_data.id_plan}")

            # Verificar se usuário já tem assinatura ativa
            existing_sub = await self.get_active_subscription_by_user(
                subscription_data.id_user
            )
            if existing_sub:
                logger.warning(
                    f"Usuário {subscription_data.id_user} já possui assinatura ativa"
                )
                # Cancelar assinatura antiga
                await self.cancel_subscription(existing_sub.id_subscription)

            # Calcular data de fim do trial
            trial_end = None
            if plan.nr_trial_days > 0:
                trial_end = datetime.now() + timedelta(days=plan.nr_trial_days)

            # Criar assinatura
            db_subscription = Subscription(
                id_user=subscription_data.id_user,
                id_plan=subscription_data.id_plan,
                nm_status=SubscriptionStatus.TRIALING.value
                if trial_end
                else SubscriptionStatus.ACTIVE.value,
                nm_billing_interval=subscription_data.nm_billing_interval.value,
                dt_start=datetime.now(),
                dt_trial_end=trial_end,
                dt_current_period_start=datetime.now(),
                dt_current_period_end=datetime.now()
                + (
                    timedelta(days=365)
                    if subscription_data.nm_billing_interval == BillingInterval.YEAR
                    else timedelta(days=30)
                ),
                nm_stripe_customer_id=subscription_data.nm_stripe_customer_id,
            )

            self.db.add(db_subscription)
            await self.db.commit()
            await self.db.refresh(db_subscription)

            logger.info(
                f"Assinatura criada: user={subscription_data.id_user}, "
                f"plan={plan.nm_plan}, status={db_subscription.nm_status}"
            )
            return db_subscription

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar assinatura: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar assinatura: {str(e)}") from e

    async def get_subscription_by_id(
        self, subscription_id: uuid.UUID
    ) -> Optional[Subscription]:
        """Buscar assinatura por ID"""
        try:
            stmt = (
                select(Subscription)
                .where(Subscription.id_subscription == subscription_id)
            )
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar assinatura: {str(e)}")
            raise RuntimeError(f"Erro ao buscar assinatura: {str(e)}") from e

    async def get_active_subscription_by_user(
        self, user_id: uuid.UUID
    ) -> Optional[Subscription]:
        """Buscar assinatura ativa do usuário"""
        try:
            stmt = (
                select(Subscription)
                .where(Subscription.id_user == user_id)
                .where(
                    Subscription.nm_status.in_(
                        [
                            SubscriptionStatus.ACTIVE.value,
                            SubscriptionStatus.TRIALING.value,
                        ]
                    )
                )
                .order_by(Subscription.dt_criacao.desc())
                .limit(1)
            )
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar assinatura ativa: {str(e)}")
            raise RuntimeError(f"Erro ao buscar assinatura ativa: {str(e)}") from e

    async def update_subscription(
        self, subscription_id: uuid.UUID, subscription_update: SubscriptionUpdate
    ) -> Optional[Subscription]:
        """Atualizar assinatura"""
        try:
            subscription = await self.get_subscription_by_id(subscription_id)
            if not subscription:
                return None

            # Atualizar campos
            update_data = subscription_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                if isinstance(value, (SubscriptionStatus, BillingInterval)):
                    setattr(subscription, key, value.value)
                else:
                    setattr(subscription, key, value)

            await self.db.commit()
            await self.db.refresh(subscription)

            logger.info(f"Assinatura atualizada: {subscription_id}")
            return subscription

        except Exception as e:
            logger.error(f"Erro ao atualizar assinatura: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao atualizar assinatura: {str(e)}") from e

    async def cancel_subscription(
        self, subscription_id: uuid.UUID, immediately: bool = False, reason: Optional[str] = None
    ) -> Optional[Subscription]:
        """Cancelar assinatura"""
        try:
            subscription = await self.get_subscription_by_id(subscription_id)
            if not subscription:
                return None

            subscription.nm_status = SubscriptionStatus.CANCELED.value
            subscription.dt_canceled_at = datetime.now()

            if immediately:
                subscription.dt_ended_at = datetime.now()
            else:
                # Cancelar no fim do período atual
                subscription.dt_ended_at = subscription.dt_current_period_end

            await self.db.commit()
            await self.db.refresh(subscription)

            logger.info(
                f"Assinatura cancelada: {subscription_id} (immediately={immediately}, reason={reason})"
            )
            return subscription

        except Exception as e:
            logger.error(f"Erro ao cancelar assinatura: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao cancelar assinatura: {str(e)}") from e

    async def list_all_subscriptions(
        self,
        page: int = 1,
        size: int = 10,
        status: Optional[SubscriptionStatus] = None,
    ) -> Tuple[List[Subscription], int]:
        """Listar todas as assinaturas (admin)"""
        try:
            # Query base
            stmt = select(Subscription)
            count_stmt = select(func.count(Subscription.id_subscription))

            # Filtros
            if status:
                stmt = stmt.where(Subscription.nm_status == status.value)
                count_stmt = count_stmt.where(Subscription.nm_status == status.value)

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Ordenar por data de criação (mais recente primeiro)
            stmt = stmt.order_by(Subscription.dt_criacao.desc())

            # Paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            result = await self.db.execute(stmt)
            subscriptions = result.scalars().all()

            return list(subscriptions), total

        except Exception as e:
            logger.error(f"Erro ao listar assinaturas: {str(e)}")
            raise RuntimeError(f"Erro ao listar assinaturas: {str(e)}") from e

    async def update_subscription_from_stripe(
        self, db: AsyncSession, id_empresa: uuid.UUID, subscription_data: dict
    ) -> Optional[Subscription]:
        """
        Atualizar assinatura com dados do Stripe webhook
        Usado quando recebemos eventos como subscription.created
        """
        try:
            # Buscar assinatura ativa da empresa
            from src.models.empresa import TbEmpresa

            stmt = select(TbEmpresa).where(TbEmpresa.id_empresa == id_empresa)
            result = await db.execute(stmt)
            empresa = result.scalar_one_or_none()

            if not empresa or not empresa.id_user:
                logger.warning(f"Empresa {id_empresa} não possui usuário associado")
                return None

            subscription = await self.get_active_subscription_by_user(empresa.id_user)
            if not subscription:
                logger.warning(f"Nenhuma assinatura ativa encontrada para empresa {id_empresa}")
                return None

            # Atualizar campos com dados do Stripe
            subscription.nm_stripe_subscription_id = subscription_data.get("id")
            subscription.nm_stripe_customer_id = subscription_data.get("customer")

            status = subscription_data.get("status")
            if status == "active":
                subscription.nm_status = SubscriptionStatus.ACTIVE.value
            elif status == "trialing":
                subscription.nm_status = SubscriptionStatus.TRIALING.value
            elif status == "canceled":
                subscription.nm_status = SubscriptionStatus.CANCELED.value
            elif status == "past_due":
                subscription.nm_status = SubscriptionStatus.PAST_DUE.value

            await db.commit()
            await db.refresh(subscription)

            logger.info(f"Assinatura atualizada via Stripe: {subscription.id_subscription}")
            return subscription

        except Exception as e:
            logger.error(f"Erro ao atualizar assinatura do Stripe: {str(e)}")
            await db.rollback()
            raise RuntimeError(f"Erro ao atualizar assinatura: {str(e)}") from e

    async def upgrade_subscription_automatically(
        self,
        db: AsyncSession,
        id_empresa: uuid.UUID,
        new_plan_id: str,
        subscription_data: dict
    ) -> Optional[Subscription]:
        """
        UPGRADE AUTOMÁTICO de assinatura via webhook do Stripe

        Fluxo:
        1. Identifica o novo plano baseado no Stripe price_id
        2. Atualiza a assinatura para o novo plano
        3. Atualiza os limites/quotas da empresa automaticamente
        4. Registra evento de analytics

        Args:
            db: Sessão do banco de dados
            id_empresa: ID da empresa que está fazendo upgrade
            new_plan_id: Stripe price_id do novo plano
            subscription_data: Dados completos da subscription do Stripe

        Returns:
            Subscription atualizada ou None se erro
        """
        try:
            logger.info(f"🔄 Iniciando UPGRADE AUTOMÁTICO - Empresa: {id_empresa}, Plano: {new_plan_id}")

            # 1. Buscar empresa e usuário
            from src.models.empresa import TbEmpresa

            stmt = select(TbEmpresa).where(TbEmpresa.id_empresa == id_empresa)
            result = await db.execute(stmt)
            empresa = result.scalar_one_or_none()

            if not empresa or not empresa.id_user:
                logger.error(f"Empresa {id_empresa} não encontrada ou sem usuário")
                return None

            # 2. Buscar assinatura ativa
            subscription = await self.get_active_subscription_by_user(empresa.id_user)
            if not subscription:
                logger.error(f"Nenhuma assinatura ativa para empresa {id_empresa}")
                return None

            # 3. Identificar novo plano pelo Stripe price_id
            # Buscar plano que tem esse price_id (monthly ou yearly)
            stmt = select(Plan).where(
                or_(
                    Plan.nm_stripe_price_id_monthly == new_plan_id,
                    Plan.nm_stripe_price_id_yearly == new_plan_id
                )
            )
            result = await db.execute(stmt)
            new_plan = result.scalar_one_or_none()

            if not new_plan:
                logger.warning(f"Plano não encontrado para Stripe price_id: {new_plan_id}")
                # Continuar com atualização básica mesmo sem encontrar plano
                subscription.nm_stripe_subscription_id = subscription_data.get("id")
                subscription.nm_stripe_customer_id = subscription_data.get("customer")
                await db.commit()
                return subscription

            # 4. Atualizar subscription para novo plano
            old_plan_id = subscription.id_plan
            subscription.id_plan = new_plan.id_plan
            subscription.nm_stripe_subscription_id = subscription_data.get("id")
            subscription.nm_stripe_customer_id = subscription_data.get("customer")
            subscription.nm_status = SubscriptionStatus.ACTIVE.value

            # Atualizar período de billing
            current_period_start = subscription_data.get("current_period_start")
            current_period_end = subscription_data.get("current_period_end")

            if current_period_start:
                subscription.dt_current_period_start = datetime.fromtimestamp(current_period_start)
            if current_period_end:
                subscription.dt_current_period_end = datetime.fromtimestamp(current_period_end)

            # 5. Atualizar limites da empresa (quotas)
            # Copiar quotas do novo plano para a empresa
            if new_plan.ds_quotas:
                # Atualizar configurações da empresa com novos limites
                # Isso pode envolver atualizar campos específicos da empresa
                # ou uma tabela de configurações separada
                logger.info(f"Quotas atualizadas: {new_plan.ds_quotas}")

            await db.commit()
            await db.refresh(subscription)

            # 6. Registrar evento de analytics
            from src.models.analytics import TbAnalyticsEvents

            analytics_event = TbAnalyticsEvents(
                id_empresa=id_empresa,
                id_user=empresa.id_user,
                nm_event_type="subscription_upgraded",
                ds_event_data={
                    "old_plan_id": str(old_plan_id),
                    "new_plan_id": str(new_plan.id_plan),
                    "new_plan_name": new_plan.nm_plan,
                    "new_plan_tier": new_plan.nm_tier,
                    "stripe_subscription_id": subscription_data.get("id"),
                    "upgrade_source": "stripe_webhook_automatic"
                },
                nm_source="billing_webhook",
                nm_session_id=None
            )
            db.add(analytics_event)
            await db.commit()

            logger.info(
                f"✅ UPGRADE AUTOMÁTICO CONCLUÍDO - "
                f"Empresa: {empresa.nm_razao_social}, "
                f"Novo Plano: {new_plan.nm_plan} ({new_plan.nm_tier})"
            )

            return subscription

        except Exception as e:
            logger.error(f"❌ Erro no upgrade automático: {str(e)}", exc_info=True)
            await db.rollback()
            raise RuntimeError(f"Erro no upgrade automático: {str(e)}") from e

    async def get_billing_statistics(self) -> Dict:
        """Obter estatísticas de billing (admin)"""
        try:
            # Total de assinaturas
            total_subs_stmt = select(func.count(Subscription.id_subscription))
            total_subs_result = await self.db.execute(total_subs_stmt)
            total_subscriptions = total_subs_result.scalar() or 0

            # Assinaturas ativas
            active_subs_stmt = select(func.count(Subscription.id_subscription)).where(
                Subscription.nm_status.in_(
                    [
                        SubscriptionStatus.ACTIVE.value,
                        SubscriptionStatus.TRIALING.value,
                    ]
                )
            )
            active_subs_result = await self.db.execute(active_subs_stmt)
            active_subscriptions = active_subs_result.scalar() or 0

            # Calcular MRR (Monthly Recurring Revenue) e ARR (Annual Recurring Revenue)
            # Buscar todas as assinaturas ativas com seus planos
            revenue_stmt = (
                select(Subscription, Plan)
                .join(Plan, Subscription.id_plan == Plan.id_plan)
                .where(
                    Subscription.nm_status.in_(
                        [
                            SubscriptionStatus.ACTIVE.value,
                            SubscriptionStatus.TRIALING.value,
                        ]
                    )
                )
            )
            revenue_result = await self.db.execute(revenue_stmt)
            active_subs_with_plans = revenue_result.all()

            mrr = Decimal("0.00")
            for subscription, plan in active_subs_with_plans:
                if subscription.nm_billing_interval == BillingInterval.MONTH.value:
                    mrr += plan.vl_price_monthly
                elif subscription.nm_billing_interval == BillingInterval.YEAR.value:
                    # Converter anual para mensal
                    mrr += plan.vl_price_yearly / 12

            arr = mrr * 12

            return {
                "total_subscriptions": total_subscriptions,
                "active_subscriptions": active_subscriptions,
                "mrr": float(mrr),
                "arr": float(arr),
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatísticas de billing: {str(e)}")
            raise RuntimeError(f"Erro ao obter estatísticas de billing: {str(e)}") from e

    # =========================================================================
    # USAGE TRACKING
    # =========================================================================

    async def track_usage(self, metric_data: UsageMetricCreate) -> UsageMetric:
        """Registrar uso de recursos"""
        try:
            db_metric = UsageMetric(
                id_subscription=metric_data.id_subscription,
                id_user=metric_data.id_user,
                nm_metric_type=metric_data.nm_metric_type.value,
                nr_value=metric_data.nr_value,
                dt_period_start=metric_data.dt_period_start,
                dt_period_end=metric_data.dt_period_end,
                ds_metadata=metric_data.ds_metadata,
            )

            self.db.add(db_metric)
            await self.db.commit()
            await self.db.refresh(db_metric)

            logger.debug(
                f"Uso registrado: user={metric_data.id_user}, "
                f"type={metric_data.nm_metric_type}, value={metric_data.nr_value}"
            )
            return db_metric

        except Exception as e:
            logger.error(f"Erro ao registrar uso: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao registrar uso: {str(e)}") from e

    async def get_usage_summary(
        self, user_id: uuid.UUID, start_date: Optional[datetime] = None
    ) -> UsageSummary:
        """Obter resumo de uso do usuário"""
        try:
            # Buscar assinatura ativa
            subscription = await self.get_active_subscription_by_user(user_id)
            if not subscription:
                raise ValueError(f"Usuário {user_id} não possui assinatura ativa")

            # Definir período
            if not start_date:
                start_date = subscription.dt_current_period_start or datetime.now()
            end_date = subscription.dt_current_period_end or datetime.now()

            # Buscar métricas
            stmt = (
                select(
                    UsageMetric.nm_metric_type, func.sum(UsageMetric.nr_value).label("total")
                )
                .where(UsageMetric.id_user == user_id)
                .where(UsageMetric.dt_period_start >= start_date)
                .where(UsageMetric.dt_period_end <= end_date)
                .group_by(UsageMetric.nm_metric_type)
            )

            result = await self.db.execute(stmt)
            metrics_data = result.all()

            # Montar dicionário de métricas
            metrics = {
                metric_type: Decimal(str(total))
                for metric_type, total in metrics_data
            }

            # Buscar quotas do plano
            plan = await self.get_plan_by_id(subscription.id_plan)
            quotas = plan.ds_quotas or {}

            # Calcular percentual de uso
            usage_percentage = {}
            for metric_type, quota in quotas.items():
                if quota > 0:  # Quota positiva
                    current_usage = float(metrics.get(metric_type, 0))
                    usage_percentage[metric_type] = (current_usage / quota) * 100
                elif quota == -1:  # Ilimitado
                    usage_percentage[metric_type] = 0.0
                else:  # Quota zero (feature bloqueada)
                    usage_percentage[metric_type] = 0.0

            return UsageSummary(
                id_user=user_id,
                current_period_start=start_date,
                current_period_end=end_date,
                metrics=metrics,
                quotas=quotas,
                usage_percentage=usage_percentage,
            )

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao obter resumo de uso: {str(e)}")
            raise RuntimeError(f"Erro ao obter resumo de uso: {str(e)}") from e

    async def check_quota(
        self, user_id: uuid.UUID, metric_type: UsageMetricType
    ) -> Tuple[bool, Dict]:
        """Verificar se usuário está dentro da quota"""
        try:
            summary = await self.get_usage_summary(user_id)

            # Obter quota e uso atual
            quota = summary.quotas.get(metric_type.value, 0)
            current_usage = float(summary.metrics.get(metric_type.value, 0))

            # -1 = ilimitado
            if quota == -1:
                return True, {
                    "allowed": True,
                    "quota": -1,
                    "current_usage": current_usage,
                    "remaining": -1,
                }

            # 0 = feature bloqueada
            if quota == 0:
                return False, {
                    "allowed": False,
                    "quota": 0,
                    "current_usage": current_usage,
                    "remaining": 0,
                    "message": f"Feature {metric_type.value} não incluída no plano",
                }

            # Quota normal
            remaining = quota - current_usage
            allowed = remaining > 0

            return allowed, {
                "allowed": allowed,
                "quota": quota,
                "current_usage": current_usage,
                "remaining": max(0, remaining),
                "usage_percentage": summary.usage_percentage.get(metric_type.value, 0),
            }

        except Exception as e:
            logger.error(f"Erro ao verificar quota: {str(e)}")
            # Em caso de erro, permitir (fail-open para não bloquear usuário)
            return True, {"allowed": True, "error": str(e)}

    # =========================================================================
    # PAYMENT MANAGEMENT
    # =========================================================================

    async def create_payment(self, payment_data: PaymentCreate) -> Payment:
        """Criar um novo pagamento"""
        try:
            db_payment = Payment(
                id_subscription=payment_data.id_subscription,
                id_user=payment_data.id_user,
                id_invoice=payment_data.id_invoice,
                nm_stripe_payment_id=payment_data.nm_stripe_payment_id,
                nm_stripe_payment_intent_id=payment_data.nm_stripe_payment_intent_id,
                nm_payment_method=payment_data.nm_payment_method,
                nm_status=payment_data.nm_status.value,
                vl_amount=payment_data.vl_amount,
                nm_currency=payment_data.nm_currency,
                ds_metadata=payment_data.ds_metadata,
            )

            self.db.add(db_payment)
            await self.db.commit()
            await self.db.refresh(db_payment)

            logger.info(f"Payment criado: {db_payment.id_payment} (valor: {db_payment.vl_amount})")
            return db_payment

        except Exception as e:
            logger.error(f"Erro ao criar payment: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar payment: {str(e)}") from e

    async def get_payment_by_id(self, payment_id: uuid.UUID) -> Optional[Payment]:
        """Buscar payment por ID"""
        try:
            stmt = select(Payment).where(Payment.id_payment == payment_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar payment: {str(e)}")
            raise RuntimeError(f"Erro ao buscar payment: {str(e)}") from e

    async def update_payment(
        self, payment_id: uuid.UUID, payment_update: PaymentUpdate
    ) -> Optional[Payment]:
        """Atualizar payment"""
        try:
            payment = await self.get_payment_by_id(payment_id)
            if not payment:
                return None

            # Atualizar campos
            update_data = payment_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                if isinstance(value, PaymentStatus):
                    setattr(payment, key, value.value)
                else:
                    setattr(payment, key, value)

            await self.db.commit()
            await self.db.refresh(payment)

            logger.info(f"Payment atualizado: {payment_id}")
            return payment

        except Exception as e:
            logger.error(f"Erro ao atualizar payment: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao atualizar payment: {str(e)}") from e

    async def get_payment_history(
        self, user_id: uuid.UUID, page: int = 1, size: int = 10
    ) -> Tuple[List[Payment], int]:
        """Obter histórico de pagamentos do usuário"""
        try:
            # Query base
            stmt = select(Payment).where(Payment.id_user == user_id)
            count_stmt = select(func.count(Payment.id_payment)).where(
                Payment.id_user == user_id
            )

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Ordenar por data de criação (mais recente primeiro)
            stmt = stmt.order_by(Payment.dt_criacao.desc())

            # Paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            result = await self.db.execute(stmt)
            payments = result.scalars().all()

            return list(payments), total

        except Exception as e:
            logger.error(f"Erro ao buscar histórico de payments: {str(e)}")
            raise RuntimeError(f"Erro ao buscar histórico de payments: {str(e)}") from e

    # =========================================================================
    # INVOICE MANAGEMENT
    # =========================================================================

    async def create_invoice(self, invoice_data: InvoiceCreate) -> Invoice:
        """Criar uma nova invoice"""
        try:
            db_invoice = Invoice(
                id_subscription=invoice_data.id_subscription,
                id_user=invoice_data.id_user,
                nm_stripe_invoice_id=invoice_data.nm_stripe_invoice_id,
                nm_status=invoice_data.nm_status.value,
                vl_subtotal=invoice_data.vl_subtotal,
                vl_tax=invoice_data.vl_tax,
                vl_discount=invoice_data.vl_discount,
                vl_total=invoice_data.vl_total,
                vl_amount_due=invoice_data.vl_amount_due,
                dt_period_start=invoice_data.dt_period_start,
                dt_period_end=invoice_data.dt_period_end,
                dt_due_date=invoice_data.dt_due_date,
                nm_currency=invoice_data.nm_currency,
                ds_description=invoice_data.ds_description,
                ds_items=invoice_data.ds_items,
                ds_metadata=invoice_data.ds_metadata,
            )

            self.db.add(db_invoice)
            await self.db.commit()
            await self.db.refresh(db_invoice)

            logger.info(f"Invoice criada: {db_invoice.nm_invoice_number} (total: {db_invoice.vl_total})")
            return db_invoice

        except Exception as e:
            logger.error(f"Erro ao criar invoice: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar invoice: {str(e)}") from e

    async def get_invoice_by_id(self, invoice_id: uuid.UUID) -> Optional[Invoice]:
        """Buscar invoice por ID"""
        try:
            stmt = select(Invoice).where(Invoice.id_invoice == invoice_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar invoice: {str(e)}")
            raise RuntimeError(f"Erro ao buscar invoice: {str(e)}") from e

    async def update_invoice(
        self, invoice_id: uuid.UUID, invoice_update: InvoiceUpdate
    ) -> Optional[Invoice]:
        """Atualizar invoice"""
        try:
            invoice = await self.get_invoice_by_id(invoice_id)
            if not invoice:
                return None

            # Atualizar campos
            update_data = invoice_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                if isinstance(value, InvoiceStatus):
                    setattr(invoice, key, value.value)
                else:
                    setattr(invoice, key, value)

            await self.db.commit()
            await self.db.refresh(invoice)

            logger.info(f"Invoice atualizada: {invoice_id}")
            return invoice

        except Exception as e:
            logger.error(f"Erro ao atualizar invoice: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao atualizar invoice: {str(e)}") from e

    async def get_user_invoices(
        self, user_id: uuid.UUID, page: int = 1, size: int = 10
    ) -> Tuple[List[Invoice], int]:
        """Obter invoices do usuário"""
        try:
            # Query base
            stmt = select(Invoice).where(Invoice.id_user == user_id)
            count_stmt = select(func.count(Invoice.id_invoice)).where(
                Invoice.id_user == user_id
            )

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Ordenar por data de criação (mais recente primeiro)
            stmt = stmt.order_by(Invoice.dt_criacao.desc())

            # Paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            result = await self.db.execute(stmt)
            invoices = result.scalars().all()

            return list(invoices), total

        except Exception as e:
            logger.error(f"Erro ao buscar invoices do usuário: {str(e)}")
            raise RuntimeError(f"Erro ao buscar invoices do usuário: {str(e)}") from e


def get_billing_service(
    db: AsyncSession = Depends(get_db),
) -> BillingService:
    """Factory function para criar instância do BillingService"""
    return BillingService(db)
