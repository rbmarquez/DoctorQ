# src/services/empresa_service.py
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.empresa import Empresa, EmpresaCreate, EmpresaUpdate

logger = get_logger(__name__)


class EmpresaService:
    """Service para operações com empresas"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_empresa(self, empresa_data: EmpresaCreate) -> Empresa:
        """Criar uma nova empresa"""
        try:
            # Verificar se já existe empresa com o mesmo CNPJ
            if empresa_data.nr_cnpj:
                existing_empresa = await self.get_empresa_by_cnpj(empresa_data.nr_cnpj)
                if existing_empresa:
                    raise ValueError(f"Empresa com CNPJ '{empresa_data.nr_cnpj}' já existe")

            # Criar empresa
            db_empresa = Empresa(
                nm_empresa=empresa_data.nm_empresa,
                nm_razao_social=empresa_data.nm_razao_social,
                nr_cnpj=empresa_data.nr_cnpj,
                nm_segmento=empresa_data.nm_segmento,
                nm_porte=empresa_data.nm_porte,
                nr_telefone=empresa_data.nr_telefone,
                nm_email_contato=empresa_data.nm_email_contato,
                nm_endereco=empresa_data.nm_endereco,
                nm_cidade=empresa_data.nm_cidade,
                nm_estado=empresa_data.nm_estado,
                nr_cep=empresa_data.nr_cep,
                nm_pais=empresa_data.nm_pais,
                st_ativo=empresa_data.st_ativo,
                dt_assinatura=empresa_data.dt_assinatura,
                dt_vencimento=empresa_data.dt_vencimento,
                nm_plano=empresa_data.nm_plano,
                nr_limite_usuarios=empresa_data.nr_limite_usuarios,
                nr_limite_agentes=empresa_data.nr_limite_agentes,
                nr_limite_document_stores=empresa_data.nr_limite_document_stores,
                ds_config=empresa_data.ds_config,
                ds_logo_url=empresa_data.ds_logo_url,
                nm_cor_primaria=empresa_data.nm_cor_primaria,
            )

            self.db.add(db_empresa)
            await self.db.commit()
            await self.db.refresh(db_empresa)

            logger.info(f"Empresa criada: {db_empresa.nm_empresa} (ID: {db_empresa.id_empresa})")
            return db_empresa

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar empresa: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar empresa: {str(e)}") from e

    async def get_empresa_by_id(
        self, empresa_id: uuid.UUID, include_stats: bool = False
    ) -> Optional[Empresa]:
        """Obter uma empresa por ID"""
        try:
            stmt = select(Empresa).where(Empresa.id_empresa == empresa_id)
            result = await self.db.execute(stmt)
            empresa = result.scalar_one_or_none()

            if not empresa:
                logger.debug(f"Empresa não encontrada: {empresa_id}")

            return empresa

        except Exception as e:
            logger.error(f"Erro ao buscar empresa por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar empresa: {str(e)}") from e

    async def get_empresa_by_cnpj(self, cnpj: str) -> Optional[Empresa]:
        """Obter uma empresa por CNPJ"""
        try:
            stmt = select(Empresa).where(Empresa.nr_cnpj == cnpj)
            result = await self.db.execute(stmt)
            empresa = result.scalar_one_or_none()

            if not empresa:
                logger.debug(f"Empresa não encontrada: {cnpj}")

            return empresa

        except Exception as e:
            logger.error(f"Erro ao buscar empresa por CNPJ: {str(e)}")
            raise RuntimeError(f"Erro ao buscar empresa: {str(e)}") from e

    async def list_empresas(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        plano_filter: Optional[str] = None,
        ativo_filter: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[Empresa], int]:
        """Listar empresas com filtros e paginação"""
        try:
            # Validar campo de ordenação
            valid_order_fields = [
                "dt_criacao",
                "dt_atualizacao",
                "nm_empresa",
                "nm_plano",
                "id_empresa",
            ]
            if order_by not in valid_order_fields:
                logger.warning(f"Campo de ordenação inválido: {order_by}, usando dt_criacao")
                order_by = "dt_criacao"

            # Query base para contar
            count_stmt = select(func.count(Empresa.id_empresa))

            # Query base para dados
            stmt = select(Empresa)

            # Aplicar filtros
            filters = []
            if search:
                search_filter = or_(
                    Empresa.nm_empresa.ilike(f"%{search}%"),
                    Empresa.nm_razao_social.ilike(f"%{search}%"),
                    Empresa.nr_cnpj.ilike(f"%{search}%"),
                )
                filters.append(search_filter)

            if plano_filter:
                filters.append(Empresa.nm_plano == plano_filter)

            if ativo_filter:
                filters.append(Empresa.st_ativo == ativo_filter)

            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Aplicar ordenação
            order_column = getattr(Empresa, order_by, Empresa.dt_criacao)
            if order_desc:
                stmt = stmt.order_by(order_column.desc())
            else:
                stmt = stmt.order_by(order_column.asc())

            # Aplicar paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            empresas = result.scalars().all()

            logger.debug(f"Listadas {len(empresas)} empresas (total: {total})")
            return list(empresas), total

        except Exception as e:
            logger.error(f"Erro ao listar empresas: {str(e)}")
            raise RuntimeError(f"Erro ao listar empresas: {str(e)}") from e

    async def update_empresa(
        self,
        empresa_id: uuid.UUID,
        empresa_update: EmpresaUpdate,
    ) -> Optional[Empresa]:
        """Atualizar uma empresa existente"""
        try:
            # Buscar a empresa
            empresa = await self.get_empresa_by_id(empresa_id)
            if not empresa:
                logger.warning(f"Empresa não encontrada: {empresa_id}")
                return None

            # Se o CNPJ mudar, validar duplicidade
            if empresa_update.nr_cnpj and empresa_update.nr_cnpj != empresa.nr_cnpj:
                dup = await self.get_empresa_by_cnpj(empresa_update.nr_cnpj)
                if dup and dup.id_empresa != empresa_id:
                    raise ValueError(f"Empresa com CNPJ '{empresa_update.nr_cnpj}' já existe")

            # Aplicar os campos que vieram no payload
            data = empresa_update.model_dump(exclude_unset=True)
            for key, value in data.items():
                if hasattr(empresa, key):
                    setattr(empresa, key, value)

            # Atualizar timestamp
            empresa.dt_atualizacao = datetime.now()

            await self.db.commit()
            await self.db.refresh(empresa)

            logger.info(f"Empresa atualizada: {empresa.nm_empresa}")
            return empresa

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar empresa: {e}")
            raise RuntimeError(f"Erro ao atualizar empresa: {str(e)}") from e

    async def delete_empresa(self, empresa_id: uuid.UUID) -> bool:
        """Deletar uma empresa (soft delete - desativar)"""
        try:
            empresa = await self.get_empresa_by_id(empresa_id)
            if not empresa:
                logger.warning(f"Empresa não encontrada para deleção: {empresa_id}")
                return False

            # Soft delete
            empresa.st_ativo = "N"
            empresa.dt_atualizacao = datetime.now()

            await self.db.commit()

            logger.info(f"Empresa desativada: {empresa.nm_empresa}")
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar empresa: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar empresa: {str(e)}") from e

    async def get_empresa_stats(self, empresa_id: uuid.UUID) -> dict:
        """Obter estatísticas da empresa"""
        try:
            from src.models.user import User
            from src.models.agent import Agent

            # Contar usuários ativos
            stmt_users = select(func.count(User.id_user)).where(
                and_(User.id_empresa == empresa_id, User.st_ativo == "S")
            )
            result_users = await self.db.execute(stmt_users)
            total_users = result_users.scalar() or 0

            # Contar agentes (se tiver relacionamento)
            # TODO: Adicionar quando houver relacionamento com agentes
            total_agents = 0

            return {
                "nr_usuarios_ativos": total_users,
                "nr_agentes_criados": total_agents,
                "nr_document_stores_criados": 0,  # TODO
            }

        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas da empresa: {str(e)}")
            return {
                "nr_usuarios_ativos": 0,
                "nr_agentes_criados": 0,
                "nr_document_stores_criados": 0,
            }


def get_empresa_service(db: AsyncSession = Depends(get_db)) -> EmpresaService:
    """Factory function para criar instância do EmpresaService"""
    return EmpresaService(db)
