"""
Serviço para gerenciar Biblioteca de Prompts
"""

import uuid
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.middleware.tenant_middleware import TenantContext
from src.models.prompt_library import (
    PromptLibrary,
    PromptLibraryCreate,
    PromptLibraryUpdate,
)

logger = get_logger(__name__)


class PromptLibraryService:
    """Serviço para operações de Biblioteca de Prompts"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_prompt(
        self, prompt_data: PromptLibraryCreate, user_id: Optional[uuid.UUID] = None
    ) -> PromptLibrary:
        """Criar novo prompt"""
        try:
            # Obter tenant atual
            tenant_id = TenantContext.get_current_tenant()

            db_prompt = PromptLibrary(
                nm_titulo=prompt_data.nm_titulo,
                ds_prompt=prompt_data.ds_prompt,
                ds_categoria=prompt_data.ds_categoria,
                ds_tags=prompt_data.ds_tags or [],
                st_publico=prompt_data.st_publico,
                id_empresa=tenant_id,
                id_usuario_criador=user_id,
            )

            self.db.add(db_prompt)
            await self.db.commit()
            await self.db.refresh(db_prompt)

            logger.debug(
                f"Prompt criado: {db_prompt.nm_titulo} (tenant: {tenant_id})"
            )
            return db_prompt

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar prompt: {str(e)}")
            raise

    async def get_prompt_by_id(self, prompt_id: uuid.UUID) -> Optional[PromptLibrary]:
        """Buscar prompt por ID"""
        try:
            tenant_id = TenantContext.get_current_tenant()

            stmt = select(PromptLibrary).where(
                PromptLibrary.id_prompt == prompt_id
            )

            # Filtrar por tenant se disponível
            if tenant_id:
                stmt = stmt.where(
                    or_(
                        PromptLibrary.id_empresa == tenant_id,
                        PromptLibrary.id_empresa.is_(None),  # Prompts globais
                    )
                )

            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error(f"Erro ao buscar prompt {prompt_id}: {str(e)}")
            raise

    async def list_prompts(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        categoria: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Tuple[List[PromptLibrary], int]:
        """Listar prompts com filtros"""
        try:
            tenant_id = TenantContext.get_current_tenant()

            # Query base
            count_stmt = select(func.count(PromptLibrary.id_prompt))
            stmt = select(PromptLibrary)

            # Filtros
            filters = []

            # Filtrar por tenant (incluir prompts públicos e do tenant)
            if tenant_id:
                filters.append(
                    or_(
                        PromptLibrary.id_empresa == tenant_id,
                        PromptLibrary.id_empresa.is_(None),
                    )
                )

            # Busca por texto
            if search:
                search_filter = or_(
                    PromptLibrary.nm_titulo.ilike(f"%{search}%"),
                    PromptLibrary.ds_prompt.ilike(f"%{search}%"),
                )
                filters.append(search_filter)

            # Filtrar por categoria
            if categoria:
                filters.append(PromptLibrary.ds_categoria == categoria)

            # Filtrar por tags (qualquer tag que corresponda)
            if tags and len(tags) > 0:
                # Usando overlap operator &&
                filters.append(PromptLibrary.ds_tags.overlap(tags))

            # Aplicar filtros
            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar() or 0

            # Ordenar por mais usados e depois por data
            stmt = stmt.order_by(
                PromptLibrary.nr_vezes_usado.desc(),
                PromptLibrary.dt_criacao.desc(),
            )

            # Paginar
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar
            result = await self.db.execute(stmt)
            prompts = list(result.scalars().all())

            logger.debug(
                f"Listados {len(prompts)} prompts (total: {total}, tenant: {tenant_id})"
            )
            return prompts, total

        except Exception as e:
            logger.error(f"Erro ao listar prompts: {str(e)}")
            raise

    async def update_prompt(
        self, prompt_id: uuid.UUID, prompt_data: PromptLibraryUpdate
    ) -> Optional[PromptLibrary]:
        """Atualizar prompt"""
        try:
            db_prompt = await self.get_prompt_by_id(prompt_id)
            if not db_prompt:
                return None

            # Atualizar campos
            update_data = prompt_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_prompt, field, value)

            await self.db.commit()
            await self.db.refresh(db_prompt)

            logger.debug(f"Prompt atualizado: {prompt_id}")
            return db_prompt

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar prompt {prompt_id}: {str(e)}")
            raise

    async def delete_prompt(self, prompt_id: uuid.UUID) -> bool:
        """Deletar prompt"""
        try:
            db_prompt = await self.get_prompt_by_id(prompt_id)
            if not db_prompt:
                return False

            await self.db.delete(db_prompt)
            await self.db.commit()

            logger.debug(f"Prompt deletado: {prompt_id}")
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao deletar prompt {prompt_id}: {str(e)}")
            raise

    async def increment_usage(self, prompt_id: uuid.UUID) -> None:
        """Incrementar contador de uso"""
        try:
            db_prompt = await self.get_prompt_by_id(prompt_id)
            if db_prompt:
                db_prompt.nr_vezes_usado += 1
                await self.db.commit()
                logger.debug(f"Uso incrementado para prompt {prompt_id}")

        except Exception as e:
            logger.error(f"Erro ao incrementar uso do prompt {prompt_id}: {str(e)}")
            # Não precisa fazer rollback, não é crítico


# Dependency para injeção
def get_prompt_library_service(db: AsyncSession = Depends(get_db)) -> PromptLibraryService:
    """Dependency para obter serviço de Biblioteca de Prompts"""
    return PromptLibraryService(db)
