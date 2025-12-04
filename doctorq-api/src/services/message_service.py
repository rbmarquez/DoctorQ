"""
Service para gerenciamento de mensagens
"""
import json
import uuid
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.message import (
    Message,
    MessageCreate,
    MessageResponse,
    MessageRole,
    MessageUpdate,
)
from src.models.conversation import Conversation

logger = get_logger(__name__)


class MessageService:
    """Service para operações com mensagens"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_message(
        self,
        conversation_id: UUID,
        message_data: MessageCreate,
        user_id: Optional[UUID] = None,
        agent_id: Optional[UUID] = None,
    ) -> Message:
        """Criar uma nova mensagem"""
        try:
            # Criar mensagem
            message = Message(
                id_conversa=conversation_id,
                id_usuario=user_id if message_data.nm_papel == MessageRole.USER else None,
                id_agente=agent_id if message_data.nm_papel == MessageRole.ASSISTANT else None,
                nm_papel=message_data.nm_papel,
                ds_conteudo=message_data.ds_conteudo,
                ds_metadata=json.dumps(message_data.ds_metadata) if message_data.ds_metadata else None,
                nr_tokens=message_data.nr_tokens,
                vl_custo=message_data.vl_custo,
                nm_modelo=message_data.nm_modelo,
            )

            self.db.add(message)
            await self.db.commit()
            await self.db.refresh(message)

            logger.debug(f"Mensagem criada: {message.id_mensagem}")
            return message

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar mensagem: {str(e)}")
            raise

    async def list_messages(
        self,
        conversation_id: UUID,
        page: int = 1,
        size: int = 50,
        order_desc: bool = False,
    ) -> Tuple[List[Message], int]:
        """Listar mensagens de uma conversa"""
        try:
            # Query base
            query = select(Message).where(Message.id_conversa == conversation_id)

            # Ordenação
            if order_desc:
                query = query.order_by(Message.dt_criacao.desc())
            else:
                query = query.order_by(Message.dt_criacao.asc())

            # Count total
            count_query = select(func.count()).select_from(Message).where(
                Message.id_conversa == conversation_id
            )
            total = await self.db.scalar(count_query)

            # Paginação
            offset = (page - 1) * size
            query = query.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(query)
            messages = result.scalars().all()

            return messages, total or 0

        except Exception as e:
            logger.error(f"Erro ao listar mensagens: {str(e)}")
            raise

    async def get_message(
        self,
        message_id: UUID,
    ) -> Optional[Message]:
        """Obter uma mensagem específica"""
        try:
            query = select(Message).where(Message.id_mensagem == message_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error(f"Erro ao buscar mensagem: {str(e)}")
            raise

    async def update_message(
        self,
        message_id: UUID,
        update_data: MessageUpdate,
    ) -> Optional[Message]:
        """Atualizar uma mensagem"""
        try:
            # Buscar mensagem
            message = await self.get_message(message_id)
            if not message:
                return None

            # Atualizar campos
            for field, value in update_data.model_dump(exclude_unset=True).items():
                if field == "ds_metadata" and value is not None:
                    value = json.dumps(value)
                setattr(message, field, value)

            await self.db.commit()
            await self.db.refresh(message)

            return message

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar mensagem: {str(e)}")
            raise

    async def delete_message(
        self,
        message_id: UUID,
    ) -> bool:
        """Deletar uma mensagem"""
        try:
            message = await self.get_message(message_id)
            if not message:
                return False

            await self.db.delete(message)
            await self.db.commit()

            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao deletar mensagem: {str(e)}")
            raise

    async def get_conversation_messages_count(
        self,
        conversation_id: UUID,
    ) -> Dict[str, int]:
        """Obter contagem de mensagens por papel"""
        try:
            # Query para contar mensagens por papel
            query = (
                select(
                    Message.nm_papel,
                    func.count(Message.id_mensagem).label("count"),
                )
                .where(Message.id_conversa == conversation_id)
                .group_by(Message.nm_papel)
            )

            result = await self.db.execute(query)
            counts = {row[0]: row[1] for row in result}

            # Garantir que todos os papéis tenham contagem
            return {
                "user": counts.get(MessageRole.USER, 0),
                "assistant": counts.get(MessageRole.ASSISTANT, 0),
                "system": counts.get(MessageRole.SYSTEM, 0),
                "total": sum(counts.values()),
            }

        except Exception as e:
            logger.error(f"Erro ao contar mensagens: {str(e)}")
            raise

    async def get_conversation_cost(
        self,
        conversation_id: UUID,
    ) -> Dict[str, float]:
        """Obter custo total de uma conversa"""
        try:
            query = (
                select(
                    func.sum(Message.vl_custo).label("total_cost"),
                    func.sum(Message.nr_tokens).label("total_tokens"),
                )
                .where(Message.id_conversa == conversation_id)
            )

            result = await self.db.execute(query)
            row = result.first()

            return {
                "total_cost": float(row[0] or 0),
                "total_tokens": int(row[1] or 0),
            }

        except Exception as e:
            logger.error(f"Erro ao calcular custo: {str(e)}")
            raise

    async def delete_conversation_messages(
        self,
        conversation_id: UUID,
    ) -> int:
        """Deletar todas as mensagens de uma conversa"""
        try:
            # Contar mensagens
            count_query = select(func.count()).select_from(Message).where(
                Message.id_conversa == conversation_id
            )
            count = await self.db.scalar(count_query)

            # Deletar mensagens
            query = select(Message).where(Message.id_conversa == conversation_id)
            result = await self.db.execute(query)
            messages = result.scalars().all()

            for message in messages:
                await self.db.delete(message)

            await self.db.commit()

            return count or 0

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao deletar mensagens da conversa: {str(e)}")
            raise

    async def get_last_messages(
        self,
        conversation_id: UUID,
        limit: int = 10,
    ) -> List[Message]:
        """Obter últimas N mensagens de uma conversa"""
        try:
            query = (
                select(Message)
                .where(Message.id_conversa == conversation_id)
                .order_by(Message.dt_criacao.desc())
                .limit(limit)
            )

            result = await self.db.execute(query)
            messages = result.scalars().all()

            # Reverter para ordem cronológica
            return list(reversed(messages))

        except Exception as e:
            logger.error(f"Erro ao buscar últimas mensagens: {str(e)}")
            raise

    async def search_messages(
        self,
        conversation_id: UUID,
        search_term: str,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Message], int]:
        """Buscar mensagens por termo"""
        try:
            # Query com busca
            query = (
                select(Message)
                .where(
                    and_(
                        Message.id_conversa == conversation_id,
                        Message.ds_conteudo.ilike(f"%{search_term}%"),
                    )
                )
                .order_by(Message.dt_criacao.asc())
            )

            # Count total
            count_query = (
                select(func.count())
                .select_from(Message)
                .where(
                    and_(
                        Message.id_conversa == conversation_id,
                        Message.ds_conteudo.ilike(f"%{search_term}%"),
                    )
                )
            )
            total = await self.db.scalar(count_query)

            # Paginação
            offset = (page - 1) * size
            query = query.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(query)
            messages = result.scalars().all()

            return messages, total or 0

        except Exception as e:
            logger.error(f"Erro ao buscar mensagens: {str(e)}")
            raise


# Dependency injection
async def get_message_service(
    db: AsyncSession = Depends(get_db),
) -> MessageService:
    """Obter instância do MessageService"""
    return MessageService(db)