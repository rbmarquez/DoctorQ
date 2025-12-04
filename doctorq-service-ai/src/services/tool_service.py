import re
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import AsyncSessionContext, ORMConfig
from src.models.tool import Tool, ToolCreate, ToolType, ToolUpdate

logger = get_logger(__name__)


class ToolService:
    """Service para operaÃ§Ãµes com tools - VersÃ£o com gerenciamento de sessÃ£o corrigido"""

    def __init__(self):
        """
        Inicializar service sem sessÃ£o fixa.
        Cada mÃ©todo criarÃ¡ sua prÃ³pria sessÃ£o.
        """

    async def _execute_with_session(self, operation):
        """
        Executar operaÃ§Ã£o com sessÃ£o gerenciada automaticamente

        Args:
            operation: FunÃ§Ã£o async que recebe uma sessÃ£o como parÃ¢metro
        """
        async with AsyncSessionContext() as db_session:
            try:
                result = await operation(db_session)
                await db_session.commit()
                return result
            except Exception as e:
                await db_session.rollback()
                raise e

    async def _execute_read_only(self, operation):
        """
        Executar operaÃ§Ã£o de leitura com sessÃ£o gerenciada

        Args:
            operation: FunÃ§Ã£o async que recebe uma sessÃ£o como parÃ¢metro
        """
        async with AsyncSessionContext() as db_session:
            return await operation(db_session)

    def _convert_st_ativo_to_bool(self, st_ativo) -> bool:
        """Converter st_ativo para boolean"""
        if isinstance(st_ativo, bool):
            return st_ativo
        if isinstance(st_ativo, str):
            return st_ativo.upper() == "S"
        return True  # padrÃ£o

    def _convert_bool_to_st_ativo(self, ativo: bool) -> str:
        """Converter boolean para string para compatibilidade"""
        return "S" if ativo else "N"

    async def create_tool(self, tool_data: ToolCreate) -> Tool:
        """Criar um novo tool"""

        async def _create_operation(db_session: AsyncSession):
            try:
                # Verificar se jÃ¡ existe um tool com o mesmo nome
                existing_tool = await self._get_tool_by_name_internal(
                    db_session, tool_data.nm_tool
                )
                if existing_tool:
                    raise ValueError(f"Tool com nome '{tool_data.nm_tool}' jÃ¡ existe")

                # Mapear campos do Pydantic para SQLAlchemy
                db_tool = Tool(
                    nm_tool=tool_data.nm_tool,
                    tp_tool=tool_data.tp_tool,
                    config_tool=tool_data.config_tool,
                    ds_tool=tool_data.ds_tool,
                    st_ativo=tool_data.st_ativo,  # Agora Ã© boolean
                )

                db_session.add(db_tool)
                await db_session.flush()
                await db_session.refresh(db_tool)

                logger.debug(
                    f"Tool criado com sucesso: {db_tool.nm_tool} (ativo: {db_tool.st_ativo})"
                )
                return db_tool

            except ValueError:
                raise
            except Exception as e:
                logger.error(f"Erro ao criar tool: {str(e)}")
                raise RuntimeError(f"Erro ao criar tool: {str(e)}") from e

        return await self._execute_with_session(_create_operation)

    async def _get_tool_by_name_internal(
        self, db_session: AsyncSession, name: str
    ) -> Optional[Tool]:
        """MÃ©todo interno para buscar tool por nome"""
        stmt = select(Tool).where(Tool.nm_tool == name)
        result = await db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_tool_by_id(self, tool_id: uuid.UUID) -> Optional[Tool]:
        """Obter um tool por ID"""

        async def _get_operation(db_session: AsyncSession):
            try:
                stmt = select(Tool).where(Tool.id_tool == tool_id)
                result = await db_session.execute(stmt)
                tool = result.scalar_one_or_none()

                if not tool:
                    logger.debug(f"Tool nÃ£o encontrado: {tool_id}")

                return tool

            except Exception as e:
                logger.error(f"Erro ao buscar tool por ID: {str(e)}")
                raise RuntimeError(f"Erro ao buscar tool: {str(e)}") from e

        return await self._execute_read_only(_get_operation)

    async def get_tool_by_name(self, name: str) -> Optional[Tool]:
        """Obter um tool por nome"""

        async def _get_operation(db_session: AsyncSession):
            try:
                stmt = select(Tool).where(Tool.nm_tool == name)
                result = await db_session.execute(stmt)
                tool = result.scalar_one_or_none()
                return tool

            except Exception as e:
                logger.error(f"Erro ao buscar tool por nome: {str(e)}")
                raise RuntimeError(f"Erro ao buscar tool: {str(e)}") from e

        return await self._execute_read_only(_get_operation)

    async def get_active_tools(self) -> List[Tool]:
        """Obter todos os tools ativos - CORRIGIDO para usar boolean"""

        async def _get_active_operation(db_session: AsyncSession):
            try:
                # CORREÃ‡ÃƒO: Usar True em vez de 'S'
                stmt = select(Tool).where(Tool.st_ativo).order_by(Tool.nm_tool.asc())

                result = await db_session.execute(stmt)
                tools = result.scalars().all()

                logger.debug(f"Encontrados {len(tools)} tools ativos no banco")
                return list(tools)

            except Exception as e:
                logger.error(f"Erro ao buscar tools ativos: {str(e)}")
                raise RuntimeError(f"Erro ao buscar tools: {str(e)}") from e

        return await self._execute_read_only(_get_active_operation)

    def _filter_sei_tools_by_unidades(
        self, tools: List[Tool], user_unidades: List[Dict]
    ) -> List[Tool]:
        """
        Filtrar tools do SEI baseado nas unidades que o usuÃ¡rio possui acesso

        Args:
            tools: Lista de tools ativas
            user_unidades: Lista de unidades do usuÃ¡rio (formato: [{"id_unidade": 1}, ...])

        Returns:
            Lista filtrada de tools
        """
        try:
            if not user_unidades:
                logger.debug(
                    "UsuÃ¡rio nÃ£o possui unidades SEI, removendo todas as tools SEI"
                )
                # Se nÃ£o tem unidades, remove todas as tools SEI
                filtered_tools = [
                    tool for tool in tools if not self._is_sei_tool(tool.nm_tool)
                ]
                return filtered_tools

            # Extrair IDs das unidades do usuÃ¡rio
            user_unit_ids = set()
            for unidade in user_unidades:
                if isinstance(unidade, dict):
                    # Suporte a diferentes formatos de ID
                    unit_id = (
                        unidade.get("id_unidade")
                        or unidade.get("od")
                        or unidade.get("id")
                    )
                    if unit_id:
                        user_unit_ids.add(str(unit_id))
                elif hasattr(unidade, "id_unidade"):
                    user_unit_ids.add(str(unidade.id_unidade))
                elif hasattr(unidade, "od"):
                    user_unit_ids.add(str(unidade.od))

            logger.debug(f"UsuÃ¡rio possui acesso Ã s unidades: {user_unit_ids}")

            filtered_tools = []
            for tool in tools:
                if self._is_sei_tool(tool.nm_tool):
                    # Ã‰ uma tool SEI, verificar se usuÃ¡rio tem acesso Ã  unidade
                    unit_id = self._extract_unit_id_from_tool_name(tool.nm_tool)
                    if unit_id and unit_id in user_unit_ids:
                        filtered_tools.append(tool)
                        logger.debug(
                            f"Tool SEI permitida: {tool.nm_tool} (unidade {unit_id})"
                        )
                    else:
                        logger.debug(
                            f"Tool SEI removida: {tool.nm_tool} (unidade {unit_id} nÃ£o autorizada)"
                        )
                else:
                    # NÃ£o Ã© tool SEI, sempre permitir
                    filtered_tools.append(tool)

            return filtered_tools

        except Exception as e:
            logger.error(f"Erro ao filtrar tools SEI: {str(e)}")
            return [tool for tool in tools if not self._is_sei_tool(tool.nm_tool)]

    def _is_sei_tool(self, tool_name: str) -> bool:
        """
        Verificar se uma tool segue o padrÃ£o do SEI

        Args:
            tool_name: Nome da tool

        Returns:
            True se Ã© uma tool SEI
        """
        return "base_conhecimento_sei_" in tool_name.lower()

    def is_sei_tool(self, tool_name: str) -> bool:
        """
        Verificar se uma tool segue o padrÃ£o do SEI (mÃ©todo pÃºblico)

        Args:
            tool_name: Nome da tool

        Returns:
            True se Ã© uma tool SEI
        """
        return self._is_sei_tool(tool_name)

    def _extract_unit_id_from_tool_name(self, tool_name: str) -> Optional[str]:
        """
        Extrair ID da unidade do nome da tool SEI

        Args:
            tool_name: Nome da tool (ex: "base_conhecimento_sei_123")

        Returns:
            ID da unidade como string ou None se nÃ£o encontrar
        """
        try:
            # Usar regex para extrair o ID da unidade
            pattern = r"base_conhecimento_sei_(\d+)"
            match = re.search(pattern, tool_name.lower())
            if match:
                return match.group(1)
            return None
        except Exception as e:
            logger.error(f"Erro ao extrair ID da unidade de '{tool_name}': {str(e)}")
            return None

    def extract_unit_id_from_tool_name(self, tool_name: str) -> Optional[str]:
        """
        Extrair ID da unidade do nome da tool SEI (mÃ©todo pÃºblico)

        Args:
            tool_name: Nome da tool (ex: "base_conhecimento_sei_123")

        Returns:
            ID da unidade como string ou None se nÃ£o encontrar
        """
        return self._extract_unit_id_from_tool_name(tool_name)

    async def get_active_tools_filtered(
        self, user_unidades: List[Dict] = None
    ) -> List[Tool]:
        """
        Obter tools ativas com filtro por unidades do usuÃ¡rio (para tools SEI)

        Args:
            user_unidades: Lista de unidades do usuÃ¡rio para filtrar tools SEI

        Returns:
            Lista de tools filtradas
        """
        try:
            # Obter todas as tools ativas
            all_active_tools = await self.get_active_tools()

            # Se nÃ£o hÃ¡ filtro de unidades, retornar todas
            if user_unidades is None:
                logger.debug(
                    "Nenhum filtro de unidades fornecido, retornando todas as tools"
                )
                return all_active_tools

            # Aplicar filtro SEI
            filtered_tools = self._filter_sei_tools_by_unidades(
                all_active_tools, user_unidades
            )
            return filtered_tools

        except Exception as e:
            logger.error(f"Erro ao obter tools ativas filtradas: {str(e)}")
            raise RuntimeError(f"Erro ao obter tools filtradas: {str(e)}") from e

    async def list_tools(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        tool_type: Optional[ToolType] = None,
        active_filter: Optional[bool] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[Tool], int]:
        """Listar tools com filtros e paginaÃ§Ã£o"""

        async def _list_operation(db_session: AsyncSession):
            try:
                # CORREÃ‡ÃƒO: Mover a validaÃ§Ã£o para dentro da funÃ§Ã£o interna
                # para que order_by seja acessÃ­vel em todo o escopo

                # Validar campo de ordenaÃ§Ã£o
                valid_order_fields = [
                    "dt_criacao",
                    "dt_atualizacao",
                    "nm_tool",
                    "tp_tool",
                    "st_ativo",
                    "id_tool",
                ]

                # Usar order_by do parÃ¢metro da funÃ§Ã£o externa
                validated_order_by = order_by
                if order_by not in valid_order_fields:
                    logger.warning(
                        f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando dt_criacao"
                    )
                    validated_order_by = "dt_criacao"

                # Query base para contar
                count_stmt = select(func.count(Tool.id_tool))

                # Query base para dados
                stmt = select(Tool)

                # Aplicar filtros
                filters = []
                if search:
                    search_filter = or_(
                        Tool.nm_tool.ilike(f"%{search}%"),
                        Tool.ds_tool.ilike(f"%{search}%"),
                    )
                    filters.append(search_filter)

                if tool_type:
                    filters.append(Tool.tp_tool == tool_type)

                # CORREÃ‡ÃƒO: Usar boolean em vez de string
                if active_filter is not None:
                    filters.append(Tool.st_ativo == active_filter)

                if filters:
                    count_stmt = count_stmt.where(and_(*filters))
                    stmt = stmt.where(and_(*filters))

                # Contar total
                total_result = await db_session.execute(count_stmt)
                total = total_result.scalar()

                # Aplicar ordenaÃ§Ã£o usando a variÃ¡vel validada
                order_column = getattr(Tool, validated_order_by, Tool.dt_criacao)
                if order_desc:
                    stmt = stmt.order_by(order_column.desc())
                else:
                    stmt = stmt.order_by(order_column.asc())

                # Aplicar paginaÃ§Ã£o
                offset = (page - 1) * size
                stmt = stmt.offset(offset).limit(size)

                # Executar query
                result = await db_session.execute(stmt)
                tools = result.scalars().all()
                return list(tools), total

            except Exception as e:
                logger.error(f"Erro ao listar tools: {str(e)}")
                raise RuntimeError(f"Erro ao listar tools: {str(e)}") from e

        return await self._execute_read_only(_list_operation)

    async def update_tool(
        self, tool_id: uuid.UUID, tool_update: ToolUpdate
    ) -> Optional[Tool]:
        """Atualizar um tool existente"""

        async def _update_operation(db_session: AsyncSession):
            try:
                # Buscar o tool
                tool = await self._get_tool_by_id_internal(db_session, tool_id)
                if not tool:
                    logger.warning(f"Tool nÃ£o encontrado: {tool_id}")
                    return None

                # Se o nome mudar, validar duplicidade
                nm_tool = tool_update.nm_tool
                if nm_tool and nm_tool != tool.nm_tool:
                    dup = await self._get_tool_by_name_internal(db_session, nm_tool)
                    if dup is not None and str(dup.id_tool) != str(tool_id):
                        raise ValueError(f"Tool com nome '{nm_tool}' jÃ¡ existe")

                # Aplicar os campos que vieram no payload
                data = tool_update.model_dump(exclude_unset=True)
                field_map = {
                    "nm_tool": "nm_tool",
                    "tp_tool": "tp_tool",
                    "config_tool": "config_tool",
                    "ds_tool": "ds_tool",
                    "st_ativo": "st_ativo",
                }

                for key, attr in field_map.items():
                    if key in data:
                        setattr(tool, attr, data[key])

                # Atualizar timestamp
                setattr(tool, "dt_atualizacao", datetime.now())

                # Persistir e retornar
                await db_session.flush()
                await db_session.refresh(tool)
                logger.debug(
                    f"Tool atualizado: {tool.nm_tool} (ativo: {tool.st_ativo})"
                )
                return tool

            except ValueError:
                raise
            except Exception as e:
                logger.error(f"Erro ao atualizar tool: {e}")
                raise RuntimeError(f"Erro ao atualizar tool: {str(e)}") from e

        return await self._execute_with_session(_update_operation)

    async def _get_tool_by_id_internal(
        self, db_session: AsyncSession, tool_id: uuid.UUID
    ) -> Optional[Tool]:
        """MÃ©todo interno para buscar tool por ID"""
        stmt = select(Tool).where(Tool.id_tool == tool_id)
        result = await db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_tool(self, tool_id: uuid.UUID) -> bool:
        """Deletar um tool"""

        async def _delete_operation(db_session: AsyncSession):
            try:
                tool = await self._get_tool_by_id_internal(db_session, tool_id)
                if not tool:
                    logger.warning(f"Tool nÃ£o encontrado para deleÃ§Ã£o: {tool_id}")
                    return False

                await db_session.delete(tool)
                await db_session.flush()
                logger.debug(f"Tool deletado: {tool.nm_tool}")
                return True

            except Exception as e:
                logger.error(f"Erro ao deletar tool: {str(e)}")
                raise RuntimeError(f"Erro ao deletar tool: {str(e)}") from e

        return await self._execute_with_session(_delete_operation)

    async def activate_tool(self, tool_id: uuid.UUID) -> Optional[Tool]:
        """Ativar um tool"""

        async def _activate_operation(db_session: AsyncSession):
            try:
                tool = await self._get_tool_by_id_internal(db_session, tool_id)
                if not tool:
                    return None

                setattr(tool, "dt_atualizacao", datetime.now())
                setattr(tool, "st_ativo", True)

                await db_session.flush()
                await db_session.refresh(tool)
                logger.debug(f"Tool ativado: {tool.nm_tool}")
                return tool

            except Exception as e:
                logger.error(f"Erro ao ativar tool: {str(e)}")
                raise RuntimeError(f"Erro ao ativar tool: {str(e)}") from e

        return await self._execute_with_session(_activate_operation)

    async def deactivate_tool(self, tool_id: uuid.UUID) -> Optional[Tool]:
        """Desativar um tool"""

        async def _deactivate_operation(db_session: AsyncSession):
            try:
                tool = await self._get_tool_by_id_internal(db_session, tool_id)
                if not tool:
                    return None

                setattr(tool, "dt_atualizacao", datetime.now())
                setattr(tool, "st_ativo", False)

                await db_session.flush()
                await db_session.refresh(tool)
                logger.debug(f"Tool desativado: {tool.nm_tool}")
                return tool

            except Exception as e:
                logger.error(f"Erro ao desativar tool: {str(e)}")
                raise RuntimeError(f"Erro ao desativar tool: {str(e)}") from e

        return await self._execute_with_session(_deactivate_operation)


# Factory function corrigida - Sem dependÃªncia de sessÃ£o
def get_tool_service() -> ToolService:
    """Factory function para criar instÃ¢ncia do ToolService"""
    return ToolService()
