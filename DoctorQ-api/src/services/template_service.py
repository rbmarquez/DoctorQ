"""
Service para gerenciamento de Templates do Marketplace
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from sqlalchemy import and_, delete, desc, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
# REMOVIDO: Movido para DoctorQ-service-ai
# from src.models.agent import Agent
from src.models.template import (
    MarketplaceStats,
    Template,
    TemplateCategory,
    TemplateCreate,
    TemplateInstallation,
    TemplateInstallationCreate,
    TemplateInstallationUpdate,
    TemplateReview,
    TemplateReviewCreate,
    TemplateReviewUpdate,
    TemplateSearchFilters,
    TemplateStats,
    TemplateStatus,
    TemplateUpdate,
    TemplateVisibility,
)

logger = get_logger(__name__)


class TemplateService:
    """Service para operações de templates do marketplace"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =========================================================================
    # TEMPLATE CRUD
    # =========================================================================

    async def create_template(self, template_data: TemplateCreate) -> Template:
        """
        Criar novo template

        Args:
            template_data: Dados do template

        Returns:
            Template criado

        Raises:
            ValueError: Se já existe template com o mesmo nome
        """
        # Verificar duplicata por nome
        existing = await self.get_template_by_name(template_data.nm_template)
        if existing:
            raise ValueError(f"Template com nome '{template_data.nm_template}' já existe")

        template = Template(**template_data.model_dump())
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)

        logger.info(f"Template criado: {template.id_template} - {template.nm_template}")
        return template

    async def get_template_by_id(self, template_id: uuid.UUID) -> Optional[Template]:
        """Buscar template por ID"""
        stmt = select(Template).where(Template.id_template == template_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_template_by_name(self, name: str) -> Optional[Template]:
        """Buscar template por nome"""
        stmt = select(Template).where(Template.nm_template == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_template(
        self, template_id: uuid.UUID, template_update: TemplateUpdate
    ) -> Optional[Template]:
        """
        Atualizar template

        Args:
            template_id: ID do template
            template_update: Dados para atualização

        Returns:
            Template atualizado ou None se não encontrado
        """
        template = await self.get_template_by_id(template_id)
        if not template:
            return None

        # Atualizar apenas campos fornecidos
        update_data = template_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)

        # Se mudou para published, definir data de publicação
        if (
            "nm_status" in update_data
            and update_data["nm_status"] == TemplateStatus.PUBLISHED.value
            and not template.dt_publicacao
        ):
            template.dt_publicacao = datetime.now()

        await self.db.commit()
        await self.db.refresh(template)

        logger.info(f"Template atualizado: {template_id}")
        return template

    async def delete_template(self, template_id: uuid.UUID) -> bool:
        """
        Deletar template

        Args:
            template_id: ID do template

        Returns:
            True se deletado, False se não encontrado
        """
        template = await self.get_template_by_id(template_id)
        if not template:
            return False

        await self.db.delete(template)
        await self.db.commit()

        logger.info(f"Template deletado: {template_id}")
        return True

    async def list_templates(
        self,
        page: int = 1,
        size: int = 20,
        filters: Optional[TemplateSearchFilters] = None,
        order_by: str = "popular",  # popular, recent, rating
    ) -> Tuple[List[Template], int]:
        """
        Listar templates com filtros e paginação

        Args:
            page: Página (1-indexed)
            size: Tamanho da página
            filters: Filtros de busca
            order_by: Ordenação (popular, recent, rating)

        Returns:
            Tupla (lista de templates, total)
        """
        # Base query
        stmt = select(Template)

        # Aplicar filtros
        conditions = []

        if filters:
            if filters.category:
                conditions.append(Template.nm_category == filters.category.value)

            if filters.tags:
                # Buscar templates que contenham QUALQUER uma das tags
                tag_conditions = [
                    Template.ds_tags.contains([tag]) for tag in filters.tags
                ]
                conditions.append(or_(*tag_conditions))

            if filters.min_rating is not None:
                conditions.append(Template.nr_rating_avg >= filters.min_rating)

            if filters.search_query:
                # Busca full-text ou ILIKE
                search_pattern = f"%{filters.search_query}%"
                conditions.append(
                    or_(
                        Template.nm_template.ilike(search_pattern),
                        Template.ds_template.ilike(search_pattern),
                    )
                )

            if filters.visibility:
                conditions.append(Template.nm_visibility == filters.visibility.value)

            if filters.status:
                conditions.append(Template.nm_status == filters.status.value)
            else:
                # Default: apenas templates publicados
                conditions.append(Template.nm_status == TemplateStatus.PUBLISHED.value)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Ordenação
        if order_by == "popular":
            stmt = stmt.order_by(desc(Template.nr_install_count), desc(Template.nr_rating_avg))
        elif order_by == "rating":
            stmt = stmt.order_by(desc(Template.nr_rating_avg), desc(Template.nr_install_count))
        elif order_by == "recent":
            stmt = stmt.order_by(desc(Template.dt_publicacao))
        else:
            # Default: popular
            stmt = stmt.order_by(desc(Template.nr_install_count))

        # Paginação
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        result = await self.db.execute(stmt)
        templates = list(result.scalars().all())

        return templates, total

    async def search_templates(
        self, query: str, limit: int = 10
    ) -> List[Template]:
        """
        Busca semântica de templates usando full-text search

        Args:
            query: Texto de busca
            limit: Limite de resultados

        Returns:
            Lista de templates ordenados por relevância
        """
        # Usar função SQL de busca semântica
        stmt = text("""
            SELECT * FROM buscar_templates(:query, :limit)
        """)

        result = await self.db.execute(stmt, {"query": query, "limit": limit})
        rows = result.fetchall()

        # Buscar templates completos
        template_ids = [row[0] for row in rows]  # id_template é primeira coluna
        if not template_ids:
            return []

        stmt = select(Template).where(Template.id_template.in_(template_ids))
        result = await self.db.execute(stmt)
        templates = list(result.scalars().all())

        # Ordenar pela ordem de relevância da busca
        id_to_template = {t.id_template: t for t in templates}
        return [id_to_template[tid] for tid in template_ids if tid in id_to_template]

    # =========================================================================
    # INSTALAÇÕES
    # =========================================================================

    async def install_template(
        self, installation_data: TemplateInstallationCreate
    ) -> TemplateInstallation:
        """
        Instalar template para usuário

        Args:
            installation_data: Dados da instalação

        Returns:
            Installation criada

        Raises:
            ValueError: Se template não pode ser instalado
        """
        # Verificar se pode instalar
        can_install, reason = await self.can_install_template(
            installation_data.id_user, installation_data.id_template
        )
        if not can_install:
            raise ValueError(f"Não é possível instalar template: {reason}")

        # Criar instalação
        installation = TemplateInstallation(**installation_data.model_dump())
        self.db.add(installation)
        await self.db.commit()
        await self.db.refresh(installation)

        logger.info(
            f"Template instalado: {installation.id_template} por usuário {installation.id_user}"
        )
        return installation

    async def can_install_template(
        self, user_id: uuid.UUID, template_id: uuid.UUID
    ) -> Tuple[bool, str]:
        """
        Verificar se usuário pode instalar template

        Args:
            user_id: ID do usuário
            template_id: ID do template

        Returns:
            Tupla (pode_instalar: bool, motivo: str)
        """
        # Usar função SQL
        stmt = text("""
            SELECT pode_instalar, motivo
            FROM pode_instalar_template(:user_id, :template_id)
        """)

        result = await self.db.execute(
            stmt, {"user_id": str(user_id), "template_id": str(template_id)}
        )
        row = result.fetchone()

        if row:
            return row[0], row[1]
        return False, "Erro ao verificar instalação"

    async def get_user_installations(
        self, user_id: uuid.UUID, active_only: bool = True
    ) -> List[TemplateInstallation]:
        """Listar instalações do usuário"""
        stmt = select(TemplateInstallation).where(
            TemplateInstallation.id_user == user_id
        )

        if active_only:
            stmt = stmt.where(TemplateInstallation.bl_ativo == True)

        stmt = stmt.order_by(desc(TemplateInstallation.dt_instalacao))

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_template_installations(
        self, template_id: uuid.UUID, active_only: bool = True
    ) -> List[TemplateInstallation]:
        """Listar instalações de um template"""
        stmt = select(TemplateInstallation).where(
            TemplateInstallation.id_template == template_id
        )

        if active_only:
            stmt = stmt.where(TemplateInstallation.bl_ativo == True)

        stmt = stmt.order_by(desc(TemplateInstallation.dt_instalacao))

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def uninstall_template(
        self, installation_id: uuid.UUID
    ) -> Optional[TemplateInstallation]:
        """
        Desinstalar template (marcar como inativo)

        Args:
            installation_id: ID da instalação

        Returns:
            Installation atualizada ou None
        """
        stmt = select(TemplateInstallation).where(
            TemplateInstallation.id_installation == installation_id
        )
        result = await self.db.execute(stmt)
        installation = result.scalar_one_or_none()

        if not installation:
            return None

        installation.bl_ativo = False
        installation.dt_ultima_atualizacao = datetime.now()

        await self.db.commit()
        await self.db.refresh(installation)

        logger.info(f"Template desinstalado: {installation_id}")
        return installation

    async def update_installation(
        self, installation_id: uuid.UUID, update_data: TemplateInstallationUpdate
    ) -> Optional[TemplateInstallation]:
        """Atualizar customizações da instalação"""
        stmt = select(TemplateInstallation).where(
            TemplateInstallation.id_installation == installation_id
        )
        result = await self.db.execute(stmt)
        installation = result.scalar_one_or_none()

        if not installation:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(installation, field, value)

        installation.dt_ultima_atualizacao = datetime.now()

        await self.db.commit()
        await self.db.refresh(installation)

        return installation

    # =========================================================================
    # REVIEWS
    # =========================================================================

    async def create_review(
        self, review_data: TemplateReviewCreate
    ) -> TemplateReview:
        """
        Criar review de template

        Args:
            review_data: Dados da review

        Returns:
            Review criada

        Raises:
            ValueError: Se usuário já fez review deste template
        """
        # Verificar duplicata
        existing = await self.get_user_review(
            review_data.id_user, review_data.id_template
        )
        if existing:
            raise ValueError("Usuário já fez review deste template")

        review = TemplateReview(**review_data.model_dump())
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)

        logger.info(
            f"Review criada: template={review.id_template}, user={review.id_user}, rating={review.nr_rating}"
        )
        return review

    async def get_user_review(
        self, user_id: uuid.UUID, template_id: uuid.UUID
    ) -> Optional[TemplateReview]:
        """Buscar review de um usuário para um template"""
        stmt = select(TemplateReview).where(
            and_(
                TemplateReview.id_user == user_id,
                TemplateReview.id_template == template_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_review(
        self, review_id: uuid.UUID, review_update: TemplateReviewUpdate
    ) -> Optional[TemplateReview]:
        """Atualizar review"""
        stmt = select(TemplateReview).where(TemplateReview.id_review == review_id)
        result = await self.db.execute(stmt)
        review = result.scalar_one_or_none()

        if not review:
            return None

        update_dict = review_update.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(review, field, value)

        await self.db.commit()
        await self.db.refresh(review)

        logger.info(f"Review atualizada: {review_id}")
        return review

    async def delete_review(self, review_id: uuid.UUID) -> bool:
        """Deletar review"""
        stmt = delete(TemplateReview).where(TemplateReview.id_review == review_id)
        result = await self.db.execute(stmt)
        await self.db.commit()

        deleted = result.rowcount > 0
        if deleted:
            logger.info(f"Review deletada: {review_id}")

        return deleted

    async def get_template_reviews(
        self, template_id: uuid.UUID, approved_only: bool = True, page: int = 1, size: int = 10
    ) -> Tuple[List[TemplateReview], int]:
        """Listar reviews de um template"""
        stmt = select(TemplateReview).where(
            TemplateReview.id_template == template_id
        )

        if approved_only:
            stmt = stmt.where(TemplateReview.bl_aprovado == True)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Paginação e ordenação
        offset = (page - 1) * size
        stmt = stmt.order_by(desc(TemplateReview.dt_criacao)).offset(offset).limit(size)

        result = await self.db.execute(stmt)
        reviews = list(result.scalars().all())

        return reviews, total

    # =========================================================================
    # ESTATÍSTICAS
    # =========================================================================

    async def get_template_stats(self, template_id: uuid.UUID) -> Optional[TemplateStats]:
        """Obter estatísticas de um template"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return None

        # Contar instalações ativas
        stmt = select(func.count()).where(
            and_(
                TemplateInstallation.id_template == template_id,
                TemplateInstallation.bl_ativo == True,
            )
        )
        active_installs_result = await self.db.execute(stmt)
        active_installs = active_installs_result.scalar() or 0

        # Contar reviews
        stmt = select(func.count()).where(
            and_(
                TemplateReview.id_template == template_id,
                TemplateReview.bl_aprovado == True,
            )
        )
        reviews_result = await self.db.execute(stmt)
        reviews_count = reviews_result.scalar() or 0

        # Última instalação
        stmt = (
            select(TemplateInstallation.dt_instalacao)
            .where(TemplateInstallation.id_template == template_id)
            .order_by(desc(TemplateInstallation.dt_instalacao))
            .limit(1)
        )
        last_install_result = await self.db.execute(stmt)
        last_install = last_install_result.scalar_one_or_none()

        return TemplateStats(
            id_template=template_id,
            nr_install_count=template.nr_install_count,
            nr_active_installs=active_installs,
            nr_rating_avg=template.nr_rating_avg,
            nr_rating_count=template.nr_rating_count,
            nr_reviews=reviews_count,
            dt_ultima_instalacao=last_install,
        )

    async def get_marketplace_stats(self) -> MarketplaceStats:
        """Obter estatísticas gerais do marketplace"""
        # Total de templates publicados
        stmt = select(func.count()).where(
            Template.nm_status == TemplateStatus.PUBLISHED.value
        )
        total_templates_result = await self.db.execute(stmt)
        total_templates = total_templates_result.scalar() or 0

        # Total de instalações
        stmt = select(func.count()).select_from(TemplateInstallation)
        total_installs_result = await self.db.execute(stmt)
        total_installs = total_installs_result.scalar() or 0

        # Total de reviews
        stmt = select(func.count()).where(TemplateReview.bl_aprovado == True)
        total_reviews_result = await self.db.execute(stmt)
        total_reviews = total_reviews_result.scalar() or 0

        # Média geral de rating
        stmt = select(func.avg(Template.nr_rating_avg)).where(
            and_(
                Template.nm_status == TemplateStatus.PUBLISHED.value,
                Template.nr_rating_count > 0,
            )
        )
        avg_rating_result = await self.db.execute(stmt)
        avg_rating = avg_rating_result.scalar() or Decimal("0.00")

        # Templates por categoria
        stmt = (
            select(Template.nm_category, func.count())
            .where(Template.nm_status == TemplateStatus.PUBLISHED.value)
            .group_by(Template.nm_category)
        )
        category_result = await self.db.execute(stmt)
        templates_by_category = {row[0]: row[1] for row in category_result.fetchall()}

        # Top templates (5 mais instalados)
        stmt = (
            select(Template)
            .where(Template.nm_status == TemplateStatus.PUBLISHED.value)
            .order_by(desc(Template.nr_install_count))
            .limit(5)
        )
        top_result = await self.db.execute(stmt)
        top_templates = list(top_result.scalars().all())

        return MarketplaceStats(
            total_templates=total_templates,
            total_installations=total_installs,
            total_reviews=total_reviews,
            avg_rating=Decimal(str(avg_rating)),
            templates_by_category=templates_by_category,
            top_templates=top_templates,
        )

    # =========================================================================
    # HELPERS
    # =========================================================================

    async def publish_template(self, template_id: uuid.UUID) -> Optional[Template]:
        """
        Publicar template (mudar status para PUBLISHED)

        Args:
            template_id: ID do template

        Returns:
            Template publicado ou None
        """
        update_data = TemplateUpdate(nm_status=TemplateStatus.PUBLISHED)
        return await self.update_template(template_id, update_data)

    async def archive_template(self, template_id: uuid.UUID) -> Optional[Template]:
        """Arquivar template"""
        update_data = TemplateUpdate(nm_status=TemplateStatus.ARCHIVED)
        return await self.update_template(template_id, update_data)


# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================

from fastapi import Depends
from src.config.orm_config import get_db


def get_template_service(
    db: AsyncSession = Depends(get_db),
) -> TemplateService:
    """Factory para TemplateService"""
    return TemplateService(db)
