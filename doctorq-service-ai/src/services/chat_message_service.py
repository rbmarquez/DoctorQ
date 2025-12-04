# src/services/chat_message_service.py
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db, ORMConfig
from src.models.chat_message import ChatMessage, ChatMessageCreate, ChatMessageUpdate

logger = get_logger(__name__)


class ChatMessageService:
    """Service para operaÃ§Ãµes com mensagens de chat - VersÃ£o com gerenciamento de sessÃ£o corrigido"""

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
        async with get_db() as db_session:
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
        async with get_db() as db_session:
            return await operation(db_session)

    async def create_message(self, message_data: ChatMessageCreate) -> ChatMessage:
        """Criar uma nova mensagem de chat"""

        async def _create_operation(db_session: AsyncSession):
            try:
                # Mapear campos do Pydantic para SQLAlchemy
                db_message = ChatMessage(
                    id_agent=message_data.id_agent,
                    id_conversation=message_data.id_conversation,
                    tools=message_data.tools,
                    nm_text=message_data.nm_text,
                    nm_tipo=(
                        message_data.nm_tipo.value
                        if hasattr(message_data.nm_tipo, "value")
                        else message_data.nm_tipo
                    ),
                )

                db_session.add(db_message)
                await db_session.flush()
                await db_session.refresh(db_message)
                return db_message

            except Exception as e:
                logger.error(f"Erro ao criar mensagem: {str(e)}")
                raise RuntimeError(f"Erro ao criar mensagem: {str(e)}") from e

        return await self._execute_with_session(_create_operation)

    async def get_message_by_id(self, message_id: uuid.UUID) -> Optional[ChatMessage]:
        """Obter uma mensagem por ID"""

        async def _get_operation(db_session: AsyncSession):
            try:
                stmt = select(ChatMessage).where(
                    ChatMessage.id_chat_message == message_id
                )
                # âœ… SessÃ£o gerenciada adequadamente
                result = await db_session.execute(stmt)
                message = result.scalar_one_or_none()

                if not message:
                    logger.debug(f"Mensagem nÃ£o encontrada: {message_id}")

                return message

            except Exception as e:
                logger.error(f"Erro ao buscar mensagem por ID: {str(e)}")
                raise RuntimeError(f"Erro ao buscar mensagem: {str(e)}") from e

        return await self._execute_read_only(_get_operation)

    async def list_messages_by_session(
        self,
        session_id: Optional[str] = None,
        page: int = 1,
        size: int = 50,
        message_type: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = False,
    ) -> Tuple[List[ChatMessage], int]:
        """Listar mensagens por sessÃ£o com filtros e paginaÃ§Ã£o"""

        async def _list_session_operation(db_session: AsyncSession):
            nonlocal order_by
            try:
                # Validar campo de ordenaÃ§Ã£o
                valid_order_fields = ["dt_criacao", "nm_tipo", "id_chat_message"]
                if order_by not in valid_order_fields:
                    logger.warning(
                        f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando dt_criacao"
                    )
                    order_by = "dt_criacao"

                # Query base para contar
                count_stmt = select(func.count(ChatMessage.id_chat_message)).where(
                    ChatMessage.id_conversation == session_id
                )

                # Query base para dados
                stmt = select(ChatMessage).where(
                    ChatMessage.id_conversation == session_id
                )

                # Aplicar filtros
                filters = []
                if message_type:
                    filters.append(ChatMessage.nm_tipo == message_type)

                if filters:
                    count_stmt = count_stmt.where(and_(*filters))
                    stmt = stmt.where(and_(*filters))

                # Contar total
                total_result = await db_session.execute(count_stmt)
                total = total_result.scalar()

                # Aplicar ordenaÃ§Ã£o
                order_column = getattr(ChatMessage, order_by, ChatMessage.dt_criacao)
                if order_desc:
                    stmt = stmt.order_by(order_column.desc())
                else:
                    stmt = stmt.order_by(order_column.asc())

                # Aplicar paginaÃ§Ã£o
                offset = (page - 1) * size
                stmt = stmt.offset(offset).limit(size)

                # Executar query
                result = await db_session.execute(stmt)
                messages = result.scalars().all()
                return list(messages), total

            except Exception as e:
                logger.error(f"Service: Erro ao listar mensagens: {str(e)}")
                raise RuntimeError(f"Erro ao listar mensagens: {str(e)}") from e

        return await self._execute_read_only(_list_session_operation)

    async def list_messages_by_agent(
        self,
        agent_id: uuid.UUID,
        page: int = 1,
        size: int = 50,
        search: Optional[str] = None,
        message_type: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[ChatMessage], int]:
        """Listar mensagens por agente com filtros e paginaÃ§Ã£o"""

        async def _list_agent_operation(db_session: AsyncSession):
            nonlocal order_by
            try:
                # Validar campo de ordenaÃ§Ã£o
                valid_order_fields = ["dt_criacao", "nm_tipo", "id_chat_message"]
                if order_by not in valid_order_fields:
                    logger.warning(
                        f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando dt_criacao"
                    )
                    order_by = "dt_criacao"

                # Query base para contar
                count_stmt = select(func.count(ChatMessage.id_chat_message)).where(
                    ChatMessage.id_agent == agent_id
                )

                # Query base para dados
                stmt = select(ChatMessage).where(ChatMessage.id_agent == agent_id)

                # Aplicar filtros
                filters = []
                if search:
                    search_filter = ChatMessage.nm_text.ilike(f"%{search}%")
                    filters.append(search_filter)

                if message_type:
                    filters.append(ChatMessage.nm_tipo == message_type)

                if filters:
                    count_stmt = count_stmt.where(and_(*filters))
                    stmt = stmt.where(and_(*filters))

                # Contar total
                total_result = await db_session.execute(count_stmt)
                total = total_result.scalar()

                # Aplicar ordenaÃ§Ã£o
                order_column = getattr(ChatMessage, order_by, ChatMessage.dt_criacao)
                if order_desc:
                    stmt = stmt.order_by(order_column.desc())
                else:
                    stmt = stmt.order_by(order_column.asc())

                # Aplicar paginaÃ§Ã£o
                offset = (page - 1) * size
                stmt = stmt.offset(offset).limit(size)

                # Executar query
                result = await db_session.execute(stmt)
                messages = result.scalars().all()
                return list(messages), total

            except Exception as e:
                logger.error(f"Service: Erro ao listar mensagens por agente: {str(e)}")
                raise RuntimeError(
                    f"Erro ao listar mensagens por agente: {str(e)}"
                ) from e

        return await self._execute_read_only(_list_agent_operation)

    async def update_message(
        self, message_id: uuid.UUID, message_update: ChatMessageUpdate
    ) -> Optional[ChatMessage]:
        """Atualizar uma mensagem existente"""

        async def _update_operation(db_session: AsyncSession):
            try:
                # Buscar a mensagem usando sessÃ£o local
                message = await self._get_message_by_id_internal(db_session, message_id)
                if not message:
                    logger.warning(f"Mensagem nÃ£o encontrada: {message_id}")
                    return None

                # Aplicar os campos que vieram no payload
                data = message_update.model_dump(exclude_unset=True)
                field_map = {
                    "id_agent": "id_agent",
                    "id_conversation": "id_conversation",
                    "tools": "tools",
                    "nm_text": "nm_text",
                    "nm_tipo": "nm_tipo",
                }

                for key, attr in field_map.items():
                    if key in data:
                        value = data[key]
                        # Converter enum para string se necessÃ¡rio
                        if key == "nm_tipo" and hasattr(value, "value"):
                            value = value.value
                        setattr(message, attr, value)

                # Atualizar timestamp
                message.dt_atualizacao = datetime.now()

                # Persistir mudanÃ§as
                await db_session.flush()
                await db_session.refresh(message)
                logger.debug(f"Mensagem atualizada: {message.id_chat_message}")
                return message

            except Exception as e:
                logger.error(f"Erro ao atualizar mensagem: {str(e)}")
                raise RuntimeError(f"Erro ao atualizar mensagem: {str(e)}") from e

        return await self._execute_with_session(_update_operation)

    async def _get_message_by_id_internal(
        self, db_session: AsyncSession, message_id: uuid.UUID
    ) -> Optional[ChatMessage]:
        """MÃ©todo interno para buscar mensagem por ID"""
        stmt = select(ChatMessage).where(ChatMessage.id_chat_message == message_id)
        result = await db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_message(self, message_id: uuid.UUID) -> bool:
        """Deletar uma mensagem"""

        async def _delete_operation(db_session: AsyncSession):
            try:
                message = await self._get_message_by_id_internal(db_session, message_id)
                if not message:
                    logger.warning(
                        f"Mensagem nÃ£o encontrada para deleÃ§Ã£o: {message_id}"
                    )
                    return False

                await db_session.delete(message)
                await db_session.flush()
                logger.debug(f"Mensagem deletada: {message_id}")
                return True

            except Exception as e:
                logger.error(f"Erro ao deletar mensagem: {str(e)}")
                raise RuntimeError(f"Erro ao deletar mensagem: {str(e)}") from e

        return await self._execute_with_session(_delete_operation)

    async def delete_messages_by_session(self, session_id: uuid.UUID) -> int:
        """Deletar todas as mensagens de uma sessÃ£o"""

        async def _delete_session_operation(db_session: AsyncSession):
            try:
                # Buscar mensagens da sessÃ£o
                stmt = select(ChatMessage).where(
                    ChatMessage.id_conversation == session_id
                )
                result = await db_session.execute(stmt)
                messages = result.scalars().all()

                count = len(messages)
                if count == 0:
                    logger.debug(
                        f"Nenhuma mensagem encontrada para sessÃ£o: {session_id}"
                    )
                    return 0

                # Deletar todas as mensagens
                for message in messages:
                    await db_session.delete(message)

                await db_session.flush()
                logger.debug(f"Deletadas {count} mensagens da sessÃ£o: {session_id}")
                return count

            except Exception as e:
                logger.error(f"Erro ao deletar mensagens da sessÃ£o: {str(e)}")
                raise RuntimeError(
                    f"Erro ao deletar mensagens da sessÃ£o: {str(e)}"
                ) from e

        return await self._execute_with_session(_delete_session_operation)

    async def get_conversation_history(
        self, id_conversation: str, limit: int = 20
    ) -> List[ChatMessage]:
        """Obter histÃ³rico de conversa ordenado por data"""

        async def _get_history_operation(db_session: AsyncSession):
            try:
                stmt = (
                    select(ChatMessage)
                    .where(ChatMessage.id_conversation == id_conversation)
                    .order_by(ChatMessage.dt_criacao.asc())
                    .limit(limit)
                )

                result = await db_session.execute(stmt)
                messages = result.scalars().all()
                return list(messages)

            except Exception as e:
                logger.error(f"Erro ao buscar histÃ³rico da conversa: {str(e)}")
                raise RuntimeError(
                    f"Erro ao buscar histÃ³rico da conversa: {str(e)}"
                ) from e

        return await self._execute_read_only(_get_history_operation)


# Factory function corrigida - Sem dependÃªncia de sessÃ£o


def get_chat_message_service() -> ChatMessageService:
    """Factory function para criar instÃ¢ncia do ChatMessageService"""
    return ChatMessageService()
