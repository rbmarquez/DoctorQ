"""
Serviço para Analytics e Métricas de Negócio
"""

import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.analytics import (
    AnalyticsEvent,
    AnalyticsEventCreate,
    AnalyticsSnapshot,
    ConversationAnalytics,
    DashboardSummary,
    EventType,
    MetricType,
    RevenueAnalytics,
    TemplateAnalytics,
    UsageAnalytics,
    UserAnalytics,
)
from src.models.billing import Subscription, SubscriptionStatus, UsageMetric
from src.models.template import Template, TemplateInstallation, TemplateReview
from src.models.user import User

logger = get_logger(__name__)


class AnalyticsService:
    """Serviço para gerenciar analytics e métricas"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =============================================================================
    # EVENT TRACKING
    # =============================================================================

    async def track_event(self, event_data: AnalyticsEventCreate) -> AnalyticsEvent:
        """
        Registra um evento de analytics

        Args:
            event_data: Dados do evento

        Returns:
            Evento criado
        """
        try:
            event = AnalyticsEvent(
                id_user=event_data.id_user,
                id_empresa=event_data.id_empresa,
                nm_event_type=event_data.nm_event_type,
                ds_event_data=event_data.ds_event_data,
                ds_metadata=event_data.ds_metadata,
            )

            self.db.add(event)
            await self.db.commit()
            await self.db.refresh(event)

            logger.info(
                f"Evento registrado: {event.nm_event_type} para user {event.id_user}"
            )
            return event

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao registrar evento: {str(e)}")
            raise

    async def get_events(
        self,
        user_id: Optional[uuid.UUID] = None,
        empresa_id: Optional[uuid.UUID] = None,
        event_type: Optional[EventType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[AnalyticsEvent]:
        """
        Busca eventos com filtros

        Args:
            user_id: Filtrar por usuário
            empresa_id: Filtrar por empresa
            event_type: Tipo de evento
            start_date: Data inicial
            end_date: Data final
            limit: Limite de resultados

        Returns:
            Lista de eventos
        """
        try:
            query = select(AnalyticsEvent)

            # Aplicar filtros
            if user_id:
                query = query.where(AnalyticsEvent.id_user == user_id)
            if empresa_id:
                query = query.where(AnalyticsEvent.id_empresa == empresa_id)
            if event_type:
                query = query.where(AnalyticsEvent.nm_event_type == event_type)
            if start_date:
                query = query.where(AnalyticsEvent.dt_event >= start_date)
            if end_date:
                query = query.where(AnalyticsEvent.dt_event <= end_date)

            query = query.order_by(AnalyticsEvent.dt_event.desc()).limit(limit)

            result = await self.db.execute(query)
            events = result.scalars().all()

            return list(events)

        except Exception as e:
            logger.error(f"Erro ao buscar eventos: {str(e)}")
            raise

    # =============================================================================
    # SNAPSHOTS
    # =============================================================================

    async def create_snapshot(
        self, snapshot_date: date, metric_type: MetricType, value: Decimal
    ) -> AnalyticsSnapshot:
        """
        Cria snapshot de métrica

        Args:
            snapshot_date: Data do snapshot
            metric_type: Tipo de métrica
            value: Valor da métrica

        Returns:
            Snapshot criado
        """
        try:
            snapshot = AnalyticsSnapshot(
                dt_snapshot=snapshot_date, nm_metric_type=metric_type, nr_value=value
            )

            self.db.add(snapshot)
            await self.db.commit()
            await self.db.refresh(snapshot)

            logger.info(
                f"Snapshot criado: {metric_type} = {value} em {snapshot_date}"
            )
            return snapshot

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar snapshot: {str(e)}")
            raise

    async def get_snapshots(
        self,
        metric_type: MetricType,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[AnalyticsSnapshot]:
        """
        Busca snapshots de uma métrica

        Args:
            metric_type: Tipo de métrica
            start_date: Data inicial
            end_date: Data final

        Returns:
            Lista de snapshots
        """
        try:
            query = select(AnalyticsSnapshot).where(
                AnalyticsSnapshot.nm_metric_type == metric_type
            )

            if start_date:
                query = query.where(AnalyticsSnapshot.dt_snapshot >= start_date)
            if end_date:
                query = query.where(AnalyticsSnapshot.dt_snapshot <= end_date)

            query = query.order_by(AnalyticsSnapshot.dt_snapshot.desc())

            result = await self.db.execute(query)
            snapshots = result.scalars().all()

            return list(snapshots)

        except Exception as e:
            logger.error(f"Erro ao buscar snapshots: {str(e)}")
            raise

    # =============================================================================
    # USER ANALYTICS
    # =============================================================================

    async def get_user_analytics(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> UserAnalytics:
        """
        Calcula métricas de usuários

        Args:
            start_date: Data inicial (padrão: 30 dias atrás)
            end_date: Data final (padrão: hoje)

        Returns:
            Métricas de usuários
        """
        try:
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=30)

            # Total de usuários
            total_users_query = select(func.count(User.id_user))
            total_users_result = await self.db.execute(total_users_query)
            total_users = total_users_result.scalar() or 0

            # Usuários ativos (últimos 30 dias)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            active_users_query = select(func.count(User.id_user.distinct())).where(
                User.dt_ultimo_login >= thirty_days_ago
            )
            active_users_result = await self.db.execute(active_users_query)
            active_users = active_users_result.scalar() or 0

            # Novos usuários no período
            new_users_query = select(func.count(User.id_user)).where(
                and_(
                    User.dt_criacao >= datetime.combine(start_date, datetime.min.time()),
                    User.dt_criacao <= datetime.combine(end_date, datetime.max.time()),
                )
            )
            new_users_result = await self.db.execute(new_users_query)
            new_users = new_users_result.scalar() or 0

            # Taxa de retenção (usuários que fizeram login nos últimos 7 dias)
            seven_days_ago = datetime.now() - timedelta(days=7)
            retained_users_query = select(func.count(User.id_user.distinct())).where(
                User.dt_ultimo_login >= seven_days_ago
            )
            retained_users_result = await self.db.execute(retained_users_query)
            retained_users = retained_users_result.scalar() or 0

            retention_rate = (
                Decimal(retained_users) / Decimal(total_users) * 100
                if total_users > 0
                else Decimal(0)
            )

            # Taxa de churn (usuários inativos há mais de 30 dias)
            inactive_users = total_users - active_users
            churn_rate = (
                Decimal(inactive_users) / Decimal(total_users) * 100
                if total_users > 0
                else Decimal(0)
            )

            return UserAnalytics(
                total_users=total_users,
                active_users=active_users,
                new_users=new_users,
                churn_rate=churn_rate,
                retention_rate=retention_rate,
            )

        except Exception as e:
            logger.error(f"Erro ao calcular user analytics: {str(e)}")
            raise

    # =============================================================================
    # CONVERSATION ANALYTICS
    # =============================================================================

    async def get_conversation_analytics(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> ConversationAnalytics:
        """
        Calcula métricas de conversas

        Args:
            start_date: Data inicial (padrão: 30 dias atrás)
            end_date: Data final (padrão: hoje)

        Returns:
            Métricas de conversas
        """
        try:
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=30)

            # Query SQL direto para contar conversas e mensagens
            # Assumindo que existe tb_conversas e tb_messages
            query = text(
                """
                SELECT
                    COUNT(DISTINCT c.id_conversa) as total_conversations,
                    COUNT(m.id_message) as total_messages,
                    COALESCE(AVG(msg_count.msg_per_conv), 0) as avg_messages_per_conversation
                FROM tb_conversas c
                LEFT JOIN tb_messages m ON m.id_conversa = c.id_conversa
                LEFT JOIN (
                    SELECT id_conversa, COUNT(*) as msg_per_conv
                    FROM tb_messages
                    GROUP BY id_conversa
                ) msg_count ON msg_count.id_conversa = c.id_conversa
                WHERE c.dt_criacao >= :start_date
                  AND c.dt_criacao <= :end_date
            """
            )

            result = await self.db.execute(
                query,
                {
                    "start_date": datetime.combine(start_date, datetime.min.time()),
                    "end_date": datetime.combine(end_date, datetime.max.time()),
                },
            )
            row = result.fetchone()

            total_conversations = row[0] or 0
            total_messages = row[1] or 0
            avg_messages = Decimal(str(row[2] or 0))

            # Conversas ativas (com mensagem nos últimos 7 dias)
            active_query = text(
                """
                SELECT COUNT(DISTINCT c.id_conversa)
                FROM tb_conversas c
                INNER JOIN tb_messages m ON m.id_conversa = c.id_conversa
                WHERE m.dt_criacao >= :seven_days_ago
            """
            )
            active_result = await self.db.execute(
                active_query, {"seven_days_ago": datetime.now() - timedelta(days=7)}
            )
            active_conversations = active_result.scalar() or 0

            # Taxa de engajamento
            engagement_rate = (
                Decimal(active_conversations) / Decimal(total_conversations) * 100
                if total_conversations > 0
                else Decimal(0)
            )

            return ConversationAnalytics(
                total_conversations=total_conversations,
                active_conversations=active_conversations,
                total_messages=total_messages,
                avg_messages_per_conversation=avg_messages,
                engagement_rate=engagement_rate,
            )

        except Exception as e:
            logger.error(f"Erro ao calcular conversation analytics: {str(e)}")
            # Retornar valores zerados em caso de erro
            return ConversationAnalytics(
                total_conversations=0,
                active_conversations=0,
                total_messages=0,
                avg_messages_per_conversation=Decimal(0),
                engagement_rate=Decimal(0),
            )

    # =============================================================================
    # REVENUE ANALYTICS
    # =============================================================================

    async def get_revenue_analytics(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> RevenueAnalytics:
        """
        Calcula métricas de receita

        Args:
            start_date: Data inicial (padrão: 30 dias atrás)
            end_date: Data final (padrão: hoje)

        Returns:
            Métricas de receita
        """
        try:
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=30)

            # MRR - Monthly Recurring Revenue (assinaturas ativas)
            mrr_query = (
                select(func.sum(Subscription.vl_price))
                .join(Subscription.plan)
                .where(
                    Subscription.nm_status.in_(
                        [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]
                    )
                )
            )
            mrr_result = await self.db.execute(mrr_query)
            mrr = mrr_result.scalar() or Decimal(0)

            # ARR - Annual Recurring Revenue
            arr = mrr * 12

            # Total de assinaturas pagas
            paid_subs_query = select(func.count(Subscription.id_subscription)).where(
                and_(
                    Subscription.nm_status
                    == SubscriptionStatus.ACTIVE,
                    Subscription.vl_price > 0,
                )
            )
            paid_subs_result = await self.db.execute(paid_subs_query)
            paid_subscriptions = paid_subs_result.scalar() or 0

            # Total de assinaturas trial
            trial_subs_query = select(func.count(Subscription.id_subscription)).where(
                Subscription.nm_status == SubscriptionStatus.TRIALING
            )
            trial_subs_result = await self.db.execute(trial_subs_query)
            trial_subscriptions = trial_subs_result.scalar() or 0

            # ARPU - Average Revenue Per User
            arpu = (
                mrr / Decimal(paid_subscriptions)
                if paid_subscriptions > 0
                else Decimal(0)
            )

            # LTV - Lifetime Value (simplificado: MRR * 12 meses / churn_rate)
            # Assumindo churn de 5% ao mês como padrão
            ltv = mrr * 12 / Decimal(0.05) if mrr > 0 else Decimal(0)

            return RevenueAnalytics(
                mrr=mrr,
                arr=arr,
                paid_subscriptions=paid_subscriptions,
                trial_subscriptions=trial_subscriptions,
                arpu=arpu,
                ltv=ltv,
            )

        except Exception as e:
            logger.error(f"Erro ao calcular revenue analytics: {str(e)}")
            raise

    # =============================================================================
    # USAGE ANALYTICS
    # =============================================================================

    async def get_usage_analytics(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> UsageAnalytics:
        """
        Calcula métricas de uso

        Args:
            start_date: Data inicial (padrão: 30 dias atrás)
            end_date: Data final (padrão: hoje)

        Returns:
            Métricas de uso
        """
        try:
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=30)

            # Total de chamadas de API
            api_calls_query = (
                select(func.sum(UsageMetric.nr_value))
                .where(
                    and_(
                        UsageMetric.nm_metric_type == "api_calls",
                        UsageMetric.dt_criacao
                        >= datetime.combine(start_date, datetime.min.time()),
                        UsageMetric.dt_criacao
                        <= datetime.combine(end_date, datetime.max.time()),
                    )
                )
            )
            api_calls_result = await self.db.execute(api_calls_query)
            total_api_calls = int(api_calls_result.scalar() or 0)

            # Total de tokens
            tokens_query = (
                select(func.sum(UsageMetric.nr_value))
                .where(
                    and_(
                        UsageMetric.nm_metric_type == "tokens_used",
                        UsageMetric.dt_criacao
                        >= datetime.combine(start_date, datetime.min.time()),
                        UsageMetric.dt_criacao
                        <= datetime.combine(end_date, datetime.max.time()),
                    )
                )
            )
            tokens_result = await self.db.execute(tokens_query)
            total_tokens = int(tokens_result.scalar() or 0)

            # Storage usado
            storage_query = (
                select(func.sum(UsageMetric.nr_value))
                .where(
                    and_(
                        UsageMetric.nm_metric_type == "storage_gb",
                        UsageMetric.dt_criacao
                        >= datetime.combine(start_date, datetime.min.time()),
                        UsageMetric.dt_criacao
                        <= datetime.combine(end_date, datetime.max.time()),
                    )
                )
            )
            storage_result = await self.db.execute(storage_query)
            total_storage_gb = Decimal(str(storage_result.scalar() or 0))

            # Média de tokens por chamada
            avg_tokens = (
                Decimal(total_tokens) / Decimal(total_api_calls)
                if total_api_calls > 0
                else Decimal(0)
            )

            # Custo estimado (assumindo $0.002 por 1K tokens)
            estimated_cost = (Decimal(total_tokens) / 1000) * Decimal("0.002")

            return UsageAnalytics(
                total_api_calls=total_api_calls,
                total_tokens=total_tokens,
                total_storage_gb=total_storage_gb,
                avg_tokens_per_call=avg_tokens,
                estimated_cost=estimated_cost,
            )

        except Exception as e:
            logger.error(f"Erro ao calcular usage analytics: {str(e)}")
            raise

    # =============================================================================
    # TEMPLATE ANALYTICS
    # =============================================================================

    async def get_template_analytics(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> TemplateAnalytics:
        """
        Calcula métricas de templates

        Args:
            start_date: Data inicial (padrão: 30 dias atrás)
            end_date: Data final (padrão: hoje)

        Returns:
            Métricas de templates
        """
        try:
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=30)

            # Total de templates publicados
            total_templates_query = select(func.count(Template.id_template)).where(
                Template.nm_status == "published"
            )
            total_templates_result = await self.db.execute(total_templates_query)
            total_templates = total_templates_result.scalar() or 0

            # Total de instalações
            total_installs_query = select(
                func.count(TemplateInstallation.id_installation)
            ).where(TemplateInstallation.bl_ativo == True)
            total_installs_result = await self.db.execute(total_installs_query)
            total_installations = total_installs_result.scalar() or 0

            # Total de reviews
            total_reviews_query = select(func.count(TemplateReview.id_review))
            total_reviews_result = await self.db.execute(total_reviews_query)
            total_reviews = total_reviews_result.scalar() or 0

            # Rating médio
            avg_rating_query = select(func.avg(Template.nr_rating_avg)).where(
                Template.nm_status == "published"
            )
            avg_rating_result = await self.db.execute(avg_rating_query)
            avg_rating = Decimal(str(avg_rating_result.scalar() or 0))

            # Top 5 templates por instalações
            top_templates_query = (
                select(Template)
                .where(Template.nm_status == "published")
                .order_by(Template.nr_install_count.desc())
                .limit(5)
            )
            top_templates_result = await self.db.execute(top_templates_query)
            top_templates = [t.nm_template for t in top_templates_result.scalars()]

            return TemplateAnalytics(
                total_templates=total_templates,
                total_installations=total_installations,
                total_reviews=total_reviews,
                avg_rating=avg_rating,
                top_templates=top_templates,
            )

        except Exception as e:
            logger.error(f"Erro ao calcular template analytics: {str(e)}")
            raise

    # =============================================================================
    # DASHBOARD SUMMARY
    # =============================================================================

    async def get_dashboard_summary(
        self, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> DashboardSummary:
        """
        Retorna resumo completo do dashboard

        Args:
            start_date: Data inicial (padrão: 30 dias atrás)
            end_date: Data final (padrão: hoje)

        Returns:
            Resumo completo com todas as métricas
        """
        try:
            # Buscar todas as métricas em paralelo seria ideal,
            # mas vamos fazer sequencial por simplicidade
            users = await self.get_user_analytics(start_date, end_date)
            conversations = await self.get_conversation_analytics(start_date, end_date)
            revenue = await self.get_revenue_analytics(start_date, end_date)
            usage = await self.get_usage_analytics(start_date, end_date)
            templates = await self.get_template_analytics(start_date, end_date)

            # Agent analytics (simplificado)
            # REMOVIDO: Movido para DoctorQ-service-ai
            # from src.models.agent import Agent

            total_agents_query = select(func.count(Agent.id_agente))
            total_agents_result = await self.db.execute(total_agents_query)
            total_agents = total_agents_result.scalar() or 0

            return DashboardSummary(
                users=users,
                conversations=conversations,
                revenue=revenue,
                agents={"total_agents": total_agents},
                templates=templates,
                usage=usage,
            )

        except Exception as e:
            logger.error(f"Erro ao gerar dashboard summary: {str(e)}")
            raise

    # =============================================================================
    # DAILY SNAPSHOTS (Background Task)
    # =============================================================================

    async def create_daily_snapshots(self, snapshot_date: Optional[date] = None):
        """
        Cria snapshots diários de todas as métricas

        Args:
            snapshot_date: Data do snapshot (padrão: hoje)
        """
        try:
            if not snapshot_date:
                snapshot_date = date.today()

            logger.info(f"Criando snapshots diários para {snapshot_date}")

            # User metrics
            user_analytics = await self.get_user_analytics(
                start_date=snapshot_date, end_date=snapshot_date
            )
            await self.create_snapshot(
                snapshot_date, MetricType.TOTAL_USERS, Decimal(user_analytics.total_users)
            )
            await self.create_snapshot(
                snapshot_date,
                MetricType.DAILY_ACTIVE_USERS,
                Decimal(user_analytics.active_users),
            )

            # Revenue metrics
            revenue_analytics = await self.get_revenue_analytics(
                start_date=snapshot_date, end_date=snapshot_date
            )
            await self.create_snapshot(
                snapshot_date, MetricType.MRR, revenue_analytics.mrr
            )
            await self.create_snapshot(
                snapshot_date, MetricType.ARR, revenue_analytics.arr
            )

            # Conversation metrics
            conv_analytics = await self.get_conversation_analytics(
                start_date=snapshot_date, end_date=snapshot_date
            )
            await self.create_snapshot(
                snapshot_date,
                MetricType.TOTAL_CONVERSATIONS,
                Decimal(conv_analytics.total_conversations),
            )
            await self.create_snapshot(
                snapshot_date,
                MetricType.TOTAL_MESSAGES,
                Decimal(conv_analytics.total_messages),
            )

            logger.info(f"Snapshots criados com sucesso para {snapshot_date}")

        except Exception as e:
            logger.error(f"Erro ao criar snapshots diários: {str(e)}")
            raise


# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================

from fastapi import Depends

from src.config.orm_config import get_db


def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    """Factory para AnalyticsService"""
    return AnalyticsService(db)
