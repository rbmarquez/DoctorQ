"""
Serviço para gerenciar Marketplace de Agentes
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select as future_select

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.middleware.tenant_middleware import TenantContext
# REMOVIDO: Movido para DoctorQ-service-ai
# from src.models.agent import Agent
from src.models.marketplace import (
    AvaliacaoAgente,
    AvaliacaoCreate,
    AvaliacaoUpdate,
    InstalacaoMarketplace,
    MarketplaceAgente,
    MarketplaceAgentePublicar,
)

logger = get_logger(__name__)


class MarketplaceService:
    """Serviço para operações do Marketplace"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def publicar_agente(
        self, agente_data: MarketplaceAgentePublicar, user_id: Optional[uuid.UUID] = None
    ) -> MarketplaceAgente:
        """Publicar agente no marketplace"""
        try:
            tenant_id = TenantContext.get_current_tenant()

            # Verificar se agente existe
            stmt = select(Agent).where(Agent.id_agente == agente_data.id_agente)
            result = await self.db.execute(stmt)
            agente = result.scalar_one_or_none()

            if not agente:
                raise ValueError("Agente não encontrado")

            # Verificar se já está publicado
            check_stmt = select(MarketplaceAgente).where(
                MarketplaceAgente.id_agente == agente_data.id_agente
            )
            check_result = await self.db.execute(check_stmt)
            existing = check_result.scalar_one_or_none()

            if existing:
                raise ValueError("Agente já está publicado no marketplace")

            # Criar registro no marketplace
            marketplace_agente = MarketplaceAgente(
                id_agente=agente_data.id_agente,
                id_empresa_publicador=tenant_id,
                nm_categoria=agente_data.nm_categoria,
                ds_tags=agente_data.ds_tags or [],
                ds_descricao_longa=agente_data.ds_descricao_longa,
            )

            self.db.add(marketplace_agente)
            await self.db.commit()
            await self.db.refresh(marketplace_agente)

            logger.info(f"Agente {agente_data.id_agente} publicado no marketplace")
            return marketplace_agente

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao publicar agente: {str(e)}")
            raise

    async def listar_marketplace(
        self,
        page: int = 1,
        size: int = 12,
        search: Optional[str] = None,
        categoria: Optional[str] = None,
        tags: Optional[List[str]] = None,
        ordenar_por: str = "popularidade",
    ) -> Tuple[List[dict], int]:
        """Listar agentes do marketplace com detalhes"""
        try:
            # Query base com JOIN para pegar dados do agente
            base_stmt = (
                select(MarketplaceAgente, Agent)
                .join(Agent, MarketplaceAgente.id_agente == Agent.id_agente)
                .where(MarketplaceAgente.st_ativo == "S")
            )

            count_stmt = (
                select(func.count(MarketplaceAgente.id_marketplace_agente))
                .join(Agent, MarketplaceAgente.id_agente == Agent.id_agente)
                .where(MarketplaceAgente.st_ativo == "S")
            )

            # Filtros
            filters = []

            if search:
                filters.append(
                    or_(
                        Agent.nm_agente.ilike(f"%{search}%"),
                        Agent.ds_prompt.ilike(f"%{search}%"),
                        MarketplaceAgente.ds_descricao_longa.ilike(f"%{search}%"),
                    )
                )

            if categoria:
                filters.append(MarketplaceAgente.nm_categoria == categoria)

            if tags and len(tags) > 0:
                filters.append(MarketplaceAgente.ds_tags.overlap(tags))

            if filters:
                base_stmt = base_stmt.where(and_(*filters))
                count_stmt = count_stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar() or 0

            # Ordenação
            if ordenar_por == "popularidade":
                base_stmt = base_stmt.order_by(MarketplaceAgente.nr_instalacoes.desc())
            elif ordenar_por == "avaliacao":
                base_stmt = base_stmt.order_by(MarketplaceAgente.nr_media_estrelas.desc())
            elif ordenar_por == "recente":
                base_stmt = base_stmt.order_by(MarketplaceAgente.dt_publicacao.desc())
            else:
                base_stmt = base_stmt.order_by(MarketplaceAgente.nr_instalacoes.desc())

            # Paginação
            offset = (page - 1) * size
            base_stmt = base_stmt.offset(offset).limit(size)

            # Executar
            result = await self.db.execute(base_stmt)
            rows = result.all()

            # Montar resposta com dados combinados
            agentes_marketplace = []
            for marketplace, agente in rows:
                agentes_marketplace.append({
                    "id_marketplace_agente": str(marketplace.id_marketplace_agente),
                    "id_agente": str(marketplace.id_agente),
                    "nm_agente": agente.nm_agente,
                    "ds_prompt": agente.ds_prompt[:200] + "..." if len(agente.ds_prompt) > 200 else agente.ds_prompt,
                    "nm_categoria": marketplace.nm_categoria,
                    "ds_tags": marketplace.ds_tags,
                    "ds_descricao_longa": marketplace.ds_descricao_longa,
                    "nr_instalacoes": marketplace.nr_instalacoes,
                    "nr_avaliacoes": marketplace.nr_avaliacoes,
                    "nr_media_estrelas": float(marketplace.nr_media_estrelas),
                    "st_destacado": marketplace.st_destacado,
                    "dt_publicacao": marketplace.dt_publicacao.isoformat(),
                })

            logger.debug(f"Listados {len(agentes_marketplace)} agentes do marketplace")
            return agentes_marketplace, total

        except Exception as e:
            logger.error(f"Erro ao listar marketplace: {str(e)}")
            raise

    async def instalar_agente(
        self, marketplace_agente_id: uuid.UUID, user_id: uuid.UUID
    ) -> Tuple[uuid.UUID, bool]:
        """
        Instalar agente do marketplace para a empresa do usuário.
        Retorna (id_agente_instalado, foi_criado_novo)
        """
        try:
            tenant_id = TenantContext.get_current_tenant()
            if not tenant_id:
                raise ValueError("Tenant não identificado")

            # Verificar se já foi instalado
            check_stmt = select(InstalacaoMarketplace).where(
                and_(
                    InstalacaoMarketplace.id_marketplace_agente == marketplace_agente_id,
                    InstalacaoMarketplace.id_empresa == tenant_id,
                    InstalacaoMarketplace.st_ativo == "S",
                )
            )
            check_result = await self.db.execute(check_stmt)
            existing = check_result.scalar_one_or_none()

            if existing:
                # Já instalado, retornar o agente existente
                return existing.id_agente_instalado, False

            # Buscar agente do marketplace
            marketplace_stmt = (
                select(MarketplaceAgente, Agent)
                .join(Agent, MarketplaceAgente.id_agente == Agent.id_agente)
                .where(MarketplaceAgente.id_marketplace_agente == marketplace_agente_id)
            )
            marketplace_result = await self.db.execute(marketplace_stmt)
            row = marketplace_result.first()

            if not row:
                raise ValueError("Agente não encontrado no marketplace")

            marketplace_agente, agente_original = row

            # Criar cópia do agente para a empresa
            novo_agente = Agent(
                nm_agente=f"{agente_original.nm_agente} (Marketplace)",
                ds_prompt=agente_original.ds_prompt,
                ds_config=agente_original.ds_config,
                st_principal=False,
                id_empresa=tenant_id,
            )

            self.db.add(novo_agente)
            await self.db.flush()

            # Registrar instalação
            instalacao = InstalacaoMarketplace(
                id_marketplace_agente=marketplace_agente_id,
                id_agente_instalado=novo_agente.id_agente,
                id_empresa=tenant_id,
                id_usuario_instalador=user_id,
            )

            self.db.add(instalacao)
            await self.db.commit()

            logger.info(
                f"Agente {marketplace_agente_id} instalado para empresa {tenant_id}"
            )
            return novo_agente.id_agente, True

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao instalar agente: {str(e)}")
            raise

    async def criar_avaliacao(
        self, avaliacao_data: AvaliacaoCreate, user_id: uuid.UUID
    ) -> AvaliacaoAgente:
        """Criar avaliação de agente"""
        try:
            tenant_id = TenantContext.get_current_tenant()

            # Verificar se já avaliou
            check_stmt = select(AvaliacaoAgente).where(
                and_(
                    AvaliacaoAgente.id_marketplace_agente == avaliacao_data.id_marketplace_agente,
                    AvaliacaoAgente.id_usuario == user_id,
                    AvaliacaoAgente.id_empresa == tenant_id,
                )
            )
            check_result = await self.db.execute(check_stmt)
            existing = check_result.scalar_one_or_none()

            if existing:
                raise ValueError("Você já avaliou este agente")

            # Criar avaliação
            avaliacao = AvaliacaoAgente(
                id_marketplace_agente=avaliacao_data.id_marketplace_agente,
                id_usuario=user_id,
                id_empresa=tenant_id,
                nr_estrelas=avaliacao_data.nr_estrelas,
                ds_comentario=avaliacao_data.ds_comentario,
            )

            self.db.add(avaliacao)
            await self.db.commit()
            await self.db.refresh(avaliacao)

            logger.info(f"Avaliação criada para agente {avaliacao_data.id_marketplace_agente}")
            return avaliacao

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar avaliação: {str(e)}")
            raise

    async def listar_avaliacoes(
        self, marketplace_agente_id: uuid.UUID, page: int = 1, size: int = 10
    ) -> Tuple[List[AvaliacaoAgente], int]:
        """Listar avaliações de um agente"""
        try:
            count_stmt = select(func.count(AvaliacaoAgente.id_avaliacao)).where(
                AvaliacaoAgente.id_marketplace_agente == marketplace_agente_id
            )

            stmt = (
                select(AvaliacaoAgente)
                .where(AvaliacaoAgente.id_marketplace_agente == marketplace_agente_id)
                .order_by(AvaliacaoAgente.dt_criacao.desc())
            )

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar() or 0

            # Paginar
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar
            result = await self.db.execute(stmt)
            avaliacoes = list(result.scalars().all())

            return avaliacoes, total

        except Exception as e:
            logger.error(f"Erro ao listar avaliações: {str(e)}")
            raise

    async def buscar_por_id(self, marketplace_agente_id: uuid.UUID) -> Optional[dict]:
        """Buscar agente do marketplace por ID com detalhes completos"""
        try:
            stmt = (
                select(MarketplaceAgente, Agent)
                .join(Agent, MarketplaceAgente.id_agente == Agent.id_agente)
                .where(MarketplaceAgente.id_marketplace_agente == marketplace_agente_id)
                .where(MarketplaceAgente.st_ativo == "S")
            )

            result = await self.db.execute(stmt)
            row = result.first()

            if not row:
                return None

            marketplace, agente = row

            return {
                "id_marketplace_agente": str(marketplace.id_marketplace_agente),
                "id_agente": str(marketplace.id_agente),
                "nm_agente": agente.nm_agente,
                "ds_prompt": agente.ds_prompt,
                "ds_config": agente.ds_config,
                "nm_categoria": marketplace.nm_categoria,
                "ds_tags": marketplace.ds_tags,
                "ds_descricao_longa": marketplace.ds_descricao_longa,
                "nr_instalacoes": marketplace.nr_instalacoes,
                "nr_avaliacoes": marketplace.nr_avaliacoes,
                "nr_media_estrelas": float(marketplace.nr_media_estrelas),
                "st_destacado": marketplace.st_destacado,
                "dt_publicacao": marketplace.dt_publicacao.isoformat(),
                "id_empresa_publicador": str(marketplace.id_empresa_publicador) if marketplace.id_empresa_publicador else None,
            }

        except Exception as e:
            logger.error(f"Erro ao buscar agente por ID: {str(e)}")
            raise

    async def listar_por_usuario(
        self, user_empresa_id: uuid.UUID, page: int = 1, size: int = 12
    ) -> Tuple[List[dict], int]:
        """Listar agentes publicados por uma empresa"""
        try:
            count_stmt = select(func.count(MarketplaceAgente.id_marketplace_agente)).where(
                MarketplaceAgente.id_empresa_publicador == user_empresa_id
            )

            stmt = (
                select(MarketplaceAgente, Agent)
                .join(Agent, MarketplaceAgente.id_agente == Agent.id_agente)
                .where(MarketplaceAgente.id_empresa_publicador == user_empresa_id)
                .order_by(MarketplaceAgente.dt_publicacao.desc())
            )

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar() or 0

            # Paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar
            result = await self.db.execute(stmt)
            rows = result.all()

            agentes = []
            for marketplace, agente in rows:
                agentes.append({
                    "id_marketplace_agente": str(marketplace.id_marketplace_agente),
                    "id_agente": str(marketplace.id_agente),
                    "nm_agente": agente.nm_agente,
                    "nm_categoria": marketplace.nm_categoria,
                    "ds_tags": marketplace.ds_tags,
                    "nr_instalacoes": marketplace.nr_instalacoes,
                    "nr_avaliacoes": marketplace.nr_avaliacoes,
                    "nr_media_estrelas": float(marketplace.nr_media_estrelas),
                    "st_ativo": marketplace.st_ativo,
                    "st_destacado": marketplace.st_destacado,
                    "dt_publicacao": marketplace.dt_publicacao.isoformat(),
                })

            return agentes, total

        except Exception as e:
            logger.error(f"Erro ao listar agentes do usuário: {str(e)}")
            raise

    async def atualizar_publicacao(
        self,
        marketplace_agente_id: uuid.UUID,
        agente_data: MarketplaceAgentePublicar,
        user_empresa_id: uuid.UUID,
    ) -> Optional[MarketplaceAgente]:
        """Atualizar publicação de agente no marketplace"""
        try:
            # Buscar publicação
            stmt = select(MarketplaceAgente).where(
                MarketplaceAgente.id_marketplace_agente == marketplace_agente_id
            )
            result = await self.db.execute(stmt)
            marketplace_agente = result.scalar_one_or_none()

            if not marketplace_agente:
                return None

            # Verificar se o usuário é o dono da publicação
            if marketplace_agente.id_empresa_publicador != user_empresa_id:
                raise ValueError("Você não tem permissão para atualizar esta publicação")

            # Atualizar campos
            if agente_data.nm_categoria:
                marketplace_agente.nm_categoria = agente_data.nm_categoria
            if agente_data.ds_tags is not None:
                marketplace_agente.ds_tags = agente_data.ds_tags
            if agente_data.ds_descricao_longa is not None:
                marketplace_agente.ds_descricao_longa = agente_data.ds_descricao_longa

            await self.db.commit()
            await self.db.refresh(marketplace_agente)

            logger.info(f"Publicação atualizada: {marketplace_agente_id}")
            return marketplace_agente

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar publicação: {str(e)}")
            raise

    async def remover_publicacao(
        self, marketplace_agente_id: uuid.UUID, user_empresa_id: uuid.UUID
    ) -> bool:
        """Remover agente do marketplace (soft delete)"""
        try:
            # Buscar publicação
            stmt = select(MarketplaceAgente).where(
                MarketplaceAgente.id_marketplace_agente == marketplace_agente_id
            )
            result = await self.db.execute(stmt)
            marketplace_agente = result.scalar_one_or_none()

            if not marketplace_agente:
                return False

            # Verificar se o usuário é o dono da publicação
            if marketplace_agente.id_empresa_publicador != user_empresa_id:
                raise ValueError("Você não tem permissão para remover esta publicação")

            # Soft delete
            marketplace_agente.st_ativo = False

            await self.db.commit()

            logger.info(f"Publicação removida: {marketplace_agente_id}")
            return True

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao remover publicação: {str(e)}")
            raise

    async def get_agente_stats(self, marketplace_agente_id: uuid.UUID) -> dict:
        """Obter estatísticas de um agente do marketplace"""
        try:
            # Buscar agente
            stmt = select(MarketplaceAgente).where(
                MarketplaceAgente.id_marketplace_agente == marketplace_agente_id
            )
            result = await self.db.execute(stmt)
            marketplace_agente = result.scalar_one_or_none()

            if not marketplace_agente:
                raise ValueError("Agente não encontrado")

            # Calcular instalações nos últimos 30 dias
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_installs_stmt = select(
                func.count(InstalacaoMarketplace.id_instalacao)
            ).where(
                and_(
                    InstalacaoMarketplace.id_marketplace_agente == marketplace_agente_id,
                    InstalacaoMarketplace.dt_instalacao >= thirty_days_ago,
                )
            )
            recent_installs_result = await self.db.execute(recent_installs_stmt)
            recent_installs = recent_installs_result.scalar() or 0

            return {
                "id_marketplace_agente": str(marketplace_agente_id),
                "total_instalacoes": marketplace_agente.nr_instalacoes,
                "total_avaliacoes": marketplace_agente.nr_avaliacoes,
                "media_avaliacao": float(marketplace_agente.nr_media_estrelas),
                "total_visualizacoes": marketplace_agente.nr_visualizacoes or 0,
                "instalacoes_ultimos_30_dias": recent_installs,
            }

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas do agente: {str(e)}")
            raise

    async def get_marketplace_stats(self) -> dict:
        """Obter estatísticas gerais do marketplace (admin)"""
        try:
            # Total de agentes
            total_agentes_stmt = select(func.count(MarketplaceAgente.id_marketplace_agente)).where(
                MarketplaceAgente.st_ativo == "S"
            )
            total_agentes_result = await self.db.execute(total_agentes_stmt)
            total_agentes = total_agentes_result.scalar() or 0

            # Total de instalações
            total_installs_stmt = select(func.sum(MarketplaceAgente.nr_instalacoes))
            total_installs_result = await self.db.execute(total_installs_stmt)
            total_instalacoes = total_installs_result.scalar() or 0

            # Total de avaliações
            total_reviews_stmt = select(func.count(AvaliacaoAgente.id_avaliacao))
            total_reviews_result = await self.db.execute(total_reviews_stmt)
            total_avaliacoes = total_reviews_result.scalar() or 0

            # Total de publicadores únicos
            total_publishers_stmt = select(
                func.count(func.distinct(MarketplaceAgente.id_empresa_publicador))
            ).where(MarketplaceAgente.st_ativo == "S")
            total_publishers_result = await self.db.execute(total_publishers_stmt)
            total_publicadores = total_publishers_result.scalar() or 0

            # Agentes mais populares (top 5)
            popular_agentes_stmt = (
                select(MarketplaceAgente, Agent)
                .join(Agent, MarketplaceAgente.id_agente == Agent.id_agente)
                .where(MarketplaceAgente.st_ativo == "S")
                .order_by(MarketplaceAgente.nr_instalacoes.desc())
                .limit(5)
            )
            popular_result = await self.db.execute(popular_agentes_stmt)
            popular_rows = popular_result.all()

            agentes_mais_populares = [
                {
                    "id_marketplace_agente": str(marketplace.id_marketplace_agente),
                    "nm_agente": agente.nm_agente,
                    "nr_instalacoes": marketplace.nr_instalacoes,
                    "nr_media_estrelas": float(marketplace.nr_media_estrelas),
                }
                for marketplace, agente in popular_rows
            ]

            # Categorias mais populares (top 5)
            categorias_stmt = (
                select(
                    MarketplaceAgente.nm_categoria,
                    func.count(MarketplaceAgente.id_marketplace_agente).label("count"),
                )
                .where(MarketplaceAgente.st_ativo == "S")
                .group_by(MarketplaceAgente.nm_categoria)
                .order_by(func.count(MarketplaceAgente.id_marketplace_agente).desc())
                .limit(5)
            )
            categorias_result = await self.db.execute(categorias_stmt)
            categorias_rows = categorias_result.all()

            categorias_mais_populares = [
                {"categoria": categoria, "total_agentes": count}
                for categoria, count in categorias_rows
            ]

            return {
                "total_agentes": total_agentes,
                "total_instalacoes": int(total_instalacoes),
                "total_avaliacoes": total_avaliacoes,
                "total_publicadores": total_publicadores,
                "agentes_mais_populares": agentes_mais_populares,
                "categorias_mais_populares": categorias_mais_populares,
            }

        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas gerais: {str(e)}")
            raise


# Dependency para injeção
def get_marketplace_service(db: AsyncSession = Depends(get_db)) -> MarketplaceService:
    """Dependency para obter serviço de Marketplace"""
    return MarketplaceService(db)
