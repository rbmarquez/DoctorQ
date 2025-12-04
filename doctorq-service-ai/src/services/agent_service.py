# src/services/agent_service.py
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.agent import Agent, AgentCreate, AgentUpdate
from src.models.agent_tool import AgentTool
from src.models.tool import Tool
# from src.models.agent_document_store import AgentDocumentStore  # Desabilitado temporariamente
from src.models.documento_store import DocumentoStore
from src.middleware.tenant_middleware import TenantContext

logger = get_logger(__name__)


class AgentService:
    """Service para operaÃ§Ãµes com agentes"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_agent(self, agent_data: AgentCreate) -> Agent:
        """Criar um novo agente"""
        try:
            # Verificar se jÃ¡ existe um agente com o mesmo nome
            existing_agent = await self.get_agent_by_name(agent_data.nm_agente)

            logger.debug(f"Existing agent: {existing_agent}")

            if existing_agent:
                raise ValueError(f"Agente com nome '{agent_data.nm_agente}' jÃ¡ existe")

            # Se estÃ¡ marcando como principal, desativar outros principais
            if agent_data.st_principal:
                await self._deactivate_other_principal_agents()

            # Se nÃ£o hÃ¡ configuraÃ§Ã£o, usar padrÃ£o
            config_to_use = agent_data.ds_config
            if not config_to_use:
                from src.models.agent_schemas import AgenteConfigFactory

                default_config = AgenteConfigFactory.create_default_config()
                config_to_use = default_config.model_dump()

            # Obter tenant atual do contexto para multi-tenancy
            tenant_id = TenantContext.get_current_tenant()

            # Mapear campos do Pydantic para SQLAlchemy
            db_agent = Agent(
                nm_agente=agent_data.nm_agente,
                ds_system_prompt=agent_data.ds_prompt,  # Corrigido: ds_system_prompt é o nome correto no banco
                ds_config=config_to_use,
                st_principal=agent_data.st_principal,
                id_empresa=tenant_id,  # Associar agente ao tenant atual
            )

            self.db.add(db_agent)
            await self.db.commit()
            await self.db.refresh(db_agent)
            logger.debug(f"Agente criado: {db_agent.nm_agente} para tenant: {tenant_id}")

            # Recarregar o agente com relacionamentos para evitar greenlet_spawn
            return await self.get_agent_by_id(db_agent.id_agente)

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar agente: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar agente: {str(e)}") from e

    async def get_agent_by_id(self, agent_id: uuid.UUID) -> Optional[Agent]:
        """Obter um agente por ID"""
        try:
            stmt = (
                select(Agent)
                # TEMPORARIAMENTE COMENTADO - agent_tools e tools relationships comentados
                # .options(
                #     selectinload(Agent.agent_tools).selectinload(AgentTool.tool),
                #     selectinload(Agent.tools),
                # )
                .where(Agent.id_agente == agent_id)
            )
            result = await self.db.execute(stmt)
            agent = result.scalar_one_or_none()

            if not agent:
                logger.debug(f"Agente nÃ£o encontrado: {agent_id}")

            return agent

        except Exception as e:
            logger.error(f"Erro ao buscar agente por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar agente: {str(e)}") from e

    async def get_agent_by_name(self, name: str) -> Optional[Agent]:
        """Obter um agente por nome"""
        try:
            stmt = select(Agent).where(Agent.nm_agente == name)
            result = await self.db.execute(stmt)
            agent = result.scalar_one_or_none()

            if not agent:
                logger.debug(f"Agente nÃ£o encontrado: {name}")

            return agent

        except Exception as e:
            logger.error(f"Service: Erro ao buscar agente por nome: {str(e)}")
            raise RuntimeError(f"Erro ao buscar agente: {str(e)}") from e

    async def list_agents(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        st_principal: Optional[bool] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[Agent], int]:
        """Listar agentes com filtros e paginaÃ§Ã£o"""
        try:
            # Validar campo de ordenaÃ§Ã£o
            valid_order_fields = [
                "dt_criacao",
                "dt_atualizacao",
                "nm_agente",
                "id_agente",
            ]
            if order_by not in valid_order_fields:
                logger.warning(
                    f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando dt_criacao"
                )
                order_by = "dt_criacao"

            # Query base para contar
            count_stmt = select(func.count(Agent.id_agente))

            # Query base para dados
            # TEMPORARIAMENTE COMENTADO - agent_tools relationship comentado
            # stmt = select(Agent).options(
            #     selectinload(Agent.agent_tools).selectinload(AgentTool.tool)
            # )
            stmt = select(Agent)

            # Aplicar filtros
            filters = []
            if search:
                search_filter = or_(
                    Agent.nm_agente.ilike(f"%{search}%"),
                    Agent.ds_system_prompt.ilike(f"%{search}%"),  # Corrigido: ds_system_prompt
                )
                filters.append(search_filter)

            if st_principal is not None:
                filters.append(Agent.st_principal == st_principal)

            # Filtrar por tenant (multi-tenancy)
            tenant_id = TenantContext.get_current_tenant()
            if tenant_id is not None:
                filters.append(Agent.id_empresa == tenant_id)
                logger.debug(f"Filtrando agentes por tenant: {tenant_id}")

            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Garantir que total nÃ£o seja None
            if total is None:
                total = 0

            # Aplicar ordenaÃ§Ã£o
            order_column = getattr(Agent, order_by, Agent.dt_criacao)
            if order_desc:
                stmt = stmt.order_by(order_column.desc())
            else:
                stmt = stmt.order_by(order_column.asc())

            # Aplicar paginaÃ§Ã£o
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            agents = result.scalars().all()
            return list(agents), total

        except Exception as e:
            logger.error(f"Service: Erro ao listar agentes: {str(e)}")
            raise RuntimeError(f"Erro ao listar agentes: {str(e)}") from e

    async def update_agent(
        self, agent_id: uuid.UUID, agent_update: AgentUpdate
    ) -> Optional[Agent]:
        """Atualiza um agente existente"""
        try:
            # 1. Busca o agente
            agent = await self.get_agent_by_id(agent_id)
            if not agent:
                logger.warning(f"Agente nÃ£o encontrado: {agent_id}")
                return None
            # 2. Se o nome mudar, valida duplicidade
            nm_agente = agent_update.nm_agente
            if nm_agente and nm_agente != agent.nm_agente:
                dup = await self.get_agent_by_name(nm_agente)
                if dup is not None and dup.id_agente != agent_id:
                    raise ValueError(f"Agente com nome '{nm_agente}' jÃ¡ existe")

            # 3. Validar regras de agente principal
            if agent_update.st_principal is not None:
                if agent_update.st_principal:
                    # Se estÃ¡ marcando como principal, desativar outros principais
                    await self._deactivate_other_principal_agents(exclude_id=agent_id)
                else:
                    # Se estÃ¡ tentando desmarcar como principal, verificar se nÃ£o Ã© o Ãºltimo
                    current_principal_count = await self._count_principal_agents()
                    if current_principal_count <= 1 and agent.st_principal:
                        raise ValueError(
                            "NÃ£o Ã© possÃ­vel desativar o Ãºltimo agente principal. Deve existir pelo menos um agente principal no sistema."
                        )

            # 4. Aplica os campos que vieram no payload usando update
            data = agent_update.model_dump(exclude_unset=True)

            # Mapear ds_prompt (do schema) para ds_system_prompt (do banco)
            if "ds_prompt" in data:
                data["ds_system_prompt"] = data.pop("ds_prompt")
                logger.debug(f"âœ… Mapeando ds_prompt -> ds_system_prompt")

            # Se st_principal foi enviado (mesmo que seja False), incluir explicitamente
            if agent_update.st_principal is not None:
                data["st_principal"] = agent_update.st_principal
                logger.debug(
                    f"âœ… ForÃ§ando inclusÃ£o de st_principal: {agent_update.st_principal}"
                )

            logger.debug(
                f"â­ st_principal nos dados finais: {data.get('st_principal', 'CAMPO AUSENTE')}"
            )
            if data:
                # Adiciona timestamp de atualizaÃ§Ã£o
                data["dt_atualizacao"] = datetime.now()

                # Usar update statement para evitar problemas de tipo
                from sqlalchemy import update

                stmt = update(Agent).where(Agent.id_agente == agent_id).values(**data)
                await self.db.execute(stmt)

            # 5. Persiste e retorna
            await self.db.commit()
            await self.db.refresh(agent)

            # Recarregar o agente com relacionamentos para evitar greenlet_spawn
            return await self.get_agent_by_id(agent_id)

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao salvar agente: {e}")
            raise RuntimeError(f"Erro ao atualizar agente: {str(e)}") from e

    async def delete_agent(self, agent_id: uuid.UUID) -> bool:
        """Deletar um agente"""
        try:
            agent = await self.get_agent_by_id(agent_id)
            if not agent:
                logger.warning(f"Agente nÃ£o encontrado para deleÃ§Ã£o: {agent_id}")
                return False

            # Verificar se Ã© o Ãºltimo agente principal
            if agent.st_principal:
                current_principal_count = await self._count_principal_agents()
                if current_principal_count <= 1:
                    raise ValueError(
                        "NÃ£o Ã© possÃ­vel excluir o Ãºltimo agente principal. Deve existir pelo menos um agente principal no sistema."
                    )

            await self.db.delete(agent)
            await self.db.commit()
            logger.info(f"Agente deletado: {agent.nm_agente}")
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar agente: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar agente: {str(e)}") from e

    async def _deactivate_other_principal_agents(
        self, exclude_id: Optional[uuid.UUID] = None
    ) -> None:
        """Desativar outros agentes principais"""
        try:
            from sqlalchemy import update

            stmt = update(Agent).where(Agent.st_principal)
            if exclude_id:
                stmt = stmt.where(Agent.id_agente != exclude_id)
            stmt = stmt.values(st_principal=False, dt_atualizacao=datetime.now())

            result = await self.db.execute(stmt)
            logger.debug(f"Desativados {result.rowcount} agentes principais")
        except Exception as e:
            logger.error(f"Erro ao desativar agentes principais: {str(e)}")
            raise

    async def _count_principal_agents(self) -> int:
        """Contar quantos agentes principais existem"""
        try:
            stmt = select(func.count(Agent.id_agente)).where(Agent.st_principal)
            result = await self.db.execute(stmt)
            count = result.scalar()
            return count or 0
        except Exception as e:
            logger.error(f"Erro ao contar agentes principais: {str(e)}")
            return 0

    async def get_principal_agent(self) -> Optional[Agent]:
        """Obter o agente principal (st_principal = true)"""
        try:
            stmt = (
                select(Agent)
                # TEMPORARIAMENTE COMENTADO - agent_tools relationship comentado
                # .options(selectinload(Agent.agent_tools))
                .where(Agent.st_principal)
            )
            result = await self.db.execute(stmt)

            print(f"Result: {result}")
            agent = result.scalar_one_or_none()

            if not agent:
                logger.debug("Nenhum agente principal encontrado")

            return agent

        except Exception as e:
            logger.error(f"Erro ao buscar agente principal: {str(e)}")
            raise RuntimeError(f"Erro ao buscar agente principal: {str(e)}") from e

    async def add_tool_to_agent(self, agent_id: uuid.UUID, tool_id: uuid.UUID) -> dict:
        """Adicionar uma ferramenta a um agente usando relacionamentos SQLAlchemy"""
        try:
            # Verificar se agente existe
            agent = await self.get_agent_by_id(agent_id)
            if not agent:
                raise ValueError(f"Agente com ID {agent_id} nÃ£o encontrado")

            # Verificar se tool existe
            stmt_tool = select(Tool).where(Tool.id_tool == tool_id)
            result_tool = await self.db.execute(stmt_tool)
            tool = result_tool.scalar_one_or_none()

            if not tool:
                raise ValueError(f"Ferramenta com ID {tool_id} nÃ£o encontrada")

            # Verificar se relacionamento jÃ¡ existe usando SQLAlchemy
            existing_relation = await self.db.execute(
                select(AgentTool).where(
                    and_(AgentTool.id_agente == agent_id, AgentTool.id_tool == tool_id)
                )
            )

            if existing_relation.scalar_one_or_none():
                raise ValueError("Ferramenta jÃ¡ estÃ¡ associada ao agente")

            # Criar relacionamento usando SQLAlchemy ORM
            agent_tool = AgentTool(id_agente=agent_id, id_tool=tool_id)

            self.db.add(agent_tool)
            await self.db.commit()
            await self.db.refresh(agent_tool)

            logger.info(f"Tool {tool_id} adicionada ao agente {agent_id}")

            return {
                "id_agente_tool": str(agent_tool.id_agente_tool),
                "agent_id": str(agent_id),
                "tool_id": str(tool_id),
                "tool_name": tool.nm_tool,
            }

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao adicionar tool ao agente: {str(e)}")
            raise RuntimeError(f"Erro ao adicionar tool ao agente: {str(e)}") from e

    async def remove_tool_from_agent(
        self, agent_id: uuid.UUID, tool_id: uuid.UUID
    ) -> dict:
        """Remover uma ferramenta de um agente usando relacionamentos SQLAlchemy"""
        try:
            # Verificar se agente existe
            agent = await self.get_agent_by_id(agent_id)
            if not agent:
                raise ValueError(f"Agente com ID {agent_id} nÃ£o encontrado")

            # Verificar se tool existe
            stmt_tool = select(Tool).where(Tool.id_tool == tool_id)
            result_tool = await self.db.execute(stmt_tool)
            tool = result_tool.scalar_one_or_none()

            if not tool:
                raise ValueError(f"Ferramenta com ID {tool_id} nÃ£o encontrada")

            # Buscar o relacionamento usando SQLAlchemy
            relation_result = await self.db.execute(
                select(AgentTool).where(
                    and_(AgentTool.id_agente == agent_id, AgentTool.id_tool == tool_id)
                )
            )

            agent_tool = relation_result.scalar_one_or_none()
            if not agent_tool:
                raise ValueError("Ferramenta nÃ£o estÃ¡ associada ao agente")

            # Remover relacionamento usando SQLAlchemy ORM
            relationship_id = agent_tool.id_agente_tool
            await self.db.delete(agent_tool)
            await self.db.commit()

            logger.info(f"Tool {tool_id} removida do agente {agent_id}")

            return {
                "id_agente_tool": str(relationship_id),
                "agent_id": str(agent_id),
                "tool_id": str(tool_id),
                "tool_name": tool.nm_tool,
            }

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao remover tool do agente: {str(e)}")
            raise RuntimeError(f"Erro ao remover tool do agente: {str(e)}") from e

    # Métodos para gerenciar Document Stores vinculados a agentes

    async def list_agent_document_stores(self, agent_id: uuid.UUID) -> List[dict]:
        """Listar Document Stores vinculados a um agente com informação do tipo de busca

        TEMPORARIAMENTE DESABILITADO - AgentDocumentStore modelo não configurado
        """
        raise NotImplementedError(
            "Funcionalidade de Document Stores temporariamente desabilitada. "
            "AgentDocumentStore modelo precisa ser reconfigurado."
        )

    async def add_document_store_to_agent(
        self, agent_id: uuid.UUID, document_store_id: uuid.UUID, search_type: str = "embedding"
    ):
        """Vincular um Document Store a um agente com tipo de busca especificado

        TEMPORARIAMENTE DESABILITADO - AgentDocumentStore modelo não configurado
        """
        raise NotImplementedError(
            "Funcionalidade de Document Stores temporariamente desabilitada. "
            "AgentDocumentStore modelo precisa ser reconfigurado."
        )

    async def remove_document_store_from_agent(
        self, agent_id: uuid.UUID, document_store_id: uuid.UUID
    ) -> None:
        """Desvincular um Document Store de um agente

        TEMPORARIAMENTE DESABILITADO - AgentDocumentStore modelo não configurado
        """
        raise NotImplementedError(
            "Funcionalidade de Document Stores temporariamente desabilitada. "
            "AgentDocumentStore modelo precisa ser reconfigurado."
        )


def get_agent_service(db: AsyncSession = Depends(get_db)) -> AgentService:
    """Factory function para criar instÃ¢ncia do AgentService"""
    return AgentService(db)
