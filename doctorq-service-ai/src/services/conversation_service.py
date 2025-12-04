# src/services/conversation_service.py
"""
Service layer para gerenciamento de conversas e mensagens.
Implementa lógica de negócio para o sistema de chat.
"""

import json
import logging
from datetime import datetime
from typing import AsyncGenerator, Dict, List, Optional
from uuid import UUID

from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.conversation import (
    Conversation,
    ConversationCreate,
    ConversationUpdate,
)
from src.models.message import Message, MessageCreate
from src.models.agent import Agent
from src.services.langchain_service import LangChainService
from src.middleware.tenant_middleware import TenantContext

logger = logging.getLogger(__name__)


class ConversationService:
    """Serviço para gerenciar conversas e mensagens."""

    def __init__(self, db: AsyncSession):
        self.db = db
        # LAZY INITIALIZATION - Não inicializar llm_service aqui para evitar recursão
        self._llm_service = None

    @property
    def llm_service(self):
        """Lazy initialization of llm_service to avoid circular dependency"""
        if self._llm_service is None:
            from src.services.langchain_service import LangChainService
            self._llm_service = LangChainService(self.db)
        return self._llm_service

    # ========================================================================
    # CRUD - Conversas
    # ========================================================================

    async def create_conversation(
        self,
        conversation_data: ConversationCreate,
        user_id: UUID,
    ) -> Conversation:
        """
        Cria uma nova conversa.

        Args:
            conversation_data: Dados da conversa
            user_id: ID do usuário

        Returns:
            Conversa criada
        """
        try:
            # Verificar se o agente existe
            agent_query = select(Agent).where(Agent.id_agente == conversation_data.id_agente)
            result = await self.db.execute(agent_query)
            agent = result.scalar_one_or_none()

            if not agent:
                raise ValueError(f"Agente {conversation_data.id_agente} não encontrado")

            # Criar conversa - ALINHADO COM SCHEMA REAL DO BANCO
            conversation = Conversation(
                id_user=user_id,
                id_agente=conversation_data.id_agente,
                id_paciente=conversation_data.id_paciente if hasattr(conversation_data, 'id_paciente') else None,
                nm_titulo=conversation_data.nm_titulo,
                ds_contexto=conversation_data.ds_contexto if hasattr(conversation_data, 'ds_contexto') else None,
                ds_metadata=conversation_data.ds_metadata or {},
            )

            self.db.add(conversation)
            await self.db.commit()
            await self.db.refresh(conversation)

            logger.info(f"Conversa criada: {conversation.id_conversa}")
            return conversation

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar conversa: {str(e)}")
            raise

    async def get_conversation(
        self,
        conversation_id: UUID,
        user_id: Optional[UUID] = None,
        include_messages: bool = False,
    ) -> Optional[Conversation]:
        """
        Busca uma conversa por ID.

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário (None ou UUID zero para conversas anônimas)
            include_messages: Se deve incluir mensagens

        Returns:
            Conversa encontrada ou None
        """
        try:
            # UUID zero indica usuário anônimo
            zero_uuid = UUID("00000000-0000-0000-0000-000000000000")

            # Se user_id for None ou UUID zero, buscar conversas anônimas
            if user_id is None or user_id == zero_uuid:
                query = select(Conversation).where(
                    and_(
                        Conversation.id_conversa == conversation_id,
                        Conversation.id_user.is_(None),  # IS NULL - ALINHADO COM SCHEMA REAL
                    )
                )
            else:
                query = select(Conversation).where(
                    and_(
                        Conversation.id_conversa == conversation_id,
                        Conversation.id_user == user_id,  # ALINHADO COM SCHEMA REAL
                    )
                )

            # Note: selectinload removed - messages relationship not defined in ORM
            # if include_messages:
            #     query = query.options(selectinload(Conversation.messages))

            result = await self.db.execute(query)
            conversation = result.scalar_one_or_none()

            return conversation

        except Exception as e:
            logger.error(f"Erro ao buscar conversa: {str(e)}")
            raise

    async def list_conversations(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
        archived: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Conversation], int]:
        """
        Lista conversas do usuário.

        Args:
            user_id: ID do usuário
            page: Número da página
            page_size: Tamanho da página
            archived: Filtrar por arquivadas
            search: Termo de busca

        Returns:
            Tupla (lista de conversas, total)
        """
        try:
            # Filtros base - ALINHADO COM SCHEMA REAL
            filters = [Conversation.id_user == user_id]

            # Filtro de arquivadas (st_ativa é o inverso de arquivada)
            if archived is not None:
                filters.append(Conversation.st_ativa == (not archived))

            # Busca por texto - ALINHADO COM SCHEMA REAL
            if search:
                filters.append(
                    or_(
                        Conversation.nm_titulo.ilike(f"%{search}%"),
                        Conversation.ds_contexto.ilike(f"%{search}%"),
                    )
                )

            # Query de contagem
            count_query = select(func.count()).select_from(Conversation).where(and_(*filters))
            count_result = await self.db.execute(count_query)
            total = count_result.scalar() or 0

            # Query de dados
            query = (
                select(Conversation)
                .where(and_(*filters))
                .order_by(desc(Conversation.dt_ultima_mensagem), desc(Conversation.dt_criacao))
                .offset((page - 1) * page_size)
                .limit(page_size)
            )

            result = await self.db.execute(query)
            conversations = result.scalars().all()

            return list(conversations), total

        except Exception as e:
            logger.error(f"Erro ao listar conversas: {str(e)}")
            raise

    async def update_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
        update_data: ConversationUpdate,
    ) -> Optional[Conversation]:
        """
        Atualiza uma conversa.

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário
            update_data: Dados para atualizar

        Returns:
            Conversa atualizada
        """
        try:
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return None

            # Atualizar campos - ALINHADO COM SCHEMA REAL
            update_dict = update_data.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(conversation, key, value)

            await self.db.commit()
            await self.db.refresh(conversation)

            logger.info(f"Conversa atualizada: {conversation_id}")
            return conversation

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar conversa: {str(e)}")
            raise

    async def delete_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        Deleta uma conversa.

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário

        Returns:
            True se deletada, False se não encontrada
        """
        try:
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return False

            await self.db.delete(conversation)
            await self.db.commit()

            logger.info(f"Conversa deletada: {conversation_id}")
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao deletar conversa: {str(e)}")
            raise

    # ========================================================================
    # Compartilhamento
    # ========================================================================

    async def share_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> Optional[str]:
        """
        Gera token de compartilhamento para conversa.

        NOTA: Funcionalidade de compartilhamento não implementada no banco atual.
        Por enquanto, retorna o ID da conversa como token.

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário

        Returns:
            Token de compartilhamento (ID da conversa)
        """
        try:
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return None

            # TEMPORÁRIO: Banco não tem ds_token_compartilhamento e st_compartilhada
            # Retornar o próprio ID da conversa como token
            return str(conversation.id_conversa)

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao compartilhar conversa: {str(e)}")
            raise

    async def get_shared_conversation(
        self,
        token: str,
    ) -> Optional[Conversation]:
        """
        Busca conversa compartilhada por token.

        NOTA: Funcionalidade de compartilhamento não implementada no banco atual.
        Por enquanto, busca por ID da conversa.

        Args:
            token: Token de compartilhamento (ou ID da conversa)

        Returns:
            Conversa compartilhada
        """
        try:
            # TEMPORÁRIO: Banco não tem ds_token_compartilhamento e st_compartilhada
            # Buscar por ID da conversa diretamente
            from uuid import UUID
            try:
                conversation_id = UUID(token)
                query = select(Conversation).where(Conversation.id_conversa == conversation_id)
            except ValueError:
                # Token não é UUID válido - retornar None
                return None

            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error(f"Erro ao buscar conversa compartilhada: {str(e)}")
            raise

    async def get_conversation_by_token(
        self,
        token: str,
    ) -> Optional[Conversation]:
        """
        Alias para get_shared_conversation - busca conversa por token de compartilhamento.
        
        Args:
            token: Token de compartilhamento
            
        Returns:
            Conversa compartilhada
        """
        return await self.get_shared_conversation(token)

    # ========================================================================
    # CRUD - Mensagens
    # ========================================================================

    async def create_message(
        self,
        conversation_id: UUID,
        message_data: MessageCreate,
    ) -> Message:
        """
        Cria uma nova mensagem.

        Args:
            conversation_id: ID da conversa
            message_data: Dados da mensagem

        Returns:
            Mensagem criada
        """
        try:
            message = Message(
                id_conversa=conversation_id,
                nm_papel=message_data.nm_papel,
                ds_conteudo=message_data.ds_conteudo,
                ds_metadata=message_data.ds_metadata or {},
                nr_tokens=message_data.nr_tokens,
                vl_custo=message_data.vl_custo,
                vl_temperatura=message_data.vl_temperatura,
                nm_modelo=message_data.nm_modelo,
            )

            self.db.add(message)
            await self.db.commit()
            await self.db.refresh(message)

            logger.info(f"Mensagem criada: {message.id_mensagem}")
            return message

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar mensagem: {str(e)}")
            raise

    async def get_messages(
        self,
        conversation_id: UUID,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[List[Message], int]:
        """
        Lista mensagens de uma conversa.

        Args:
            conversation_id: ID da conversa
            page: Número da página
            page_size: Tamanho da página

        Returns:
            Tupla (lista de mensagens, total)
        """
        try:
            # Filtros
            filters = [
                Message.id_conversa == conversation_id,
                Message.st_deletada == False,
            ]

            # Contagem
            count_query = select(func.count()).select_from(Message).where(and_(*filters))
            count_result = await self.db.execute(count_query)
            total = count_result.scalar() or 0

            # Query de dados
            query = (
                select(Message)
                .where(and_(*filters))
                .order_by(Message.dt_criacao)
                .offset((page - 1) * page_size)
                .limit(page_size)
            )

            result = await self.db.execute(query)
            messages = result.scalars().all()

            return list(messages), total

        except Exception as e:
            logger.error(f"Erro ao listar mensagens: {str(e)}")
            raise

    # ========================================================================
    # Chat com Streaming
    # ========================================================================

    async def chat_stream(
        self,
        conversation_id: UUID,
        user_id: Optional[UUID],
        user_message: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[Dict, None]:
        """
        Processa mensagem do usuário e retorna resposta do agente com streaming.

        Integrado com LangChainService para chat streaming completo.

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário (opcional para conversas anônimas)
            user_message: Mensagem do usuário
            temperature: Temperatura para o LLM (opcional)
            max_tokens: Máximo de tokens (opcional)

        Yields:
            Chunks da resposta em formato dict
        """
        try:
            # 1. Buscar conversa e verificar permissões
            conversation = await self.get_conversation(
                conversation_id,
                user_id,
                include_messages=False
            )
            if not conversation:
                yield {"type": "error", "content": "Conversa não encontrada"}
                return

            # 2. Buscar agente
            agent_query = select(Agent).where(Agent.id_agente == conversation.id_agente)
            result = await self.db.execute(agent_query)
            agent = result.scalar_one_or_none()

            if not agent:
                yield {"type": "error", "content": "Agente não encontrado"}
                return

            # 3. Salvar mensagem do usuário em tb_messages
            from src.services.message_service import MessageService
            from src.models.message import MessageCreate, MessageRole

            # UUID zero indica usuário anônimo - converter para None
            zero_uuid = UUID("00000000-0000-0000-0000-000000000000")
            actual_user_id = None if (user_id is None or user_id == zero_uuid) else user_id

            message_service = MessageService(self.db)
            user_msg = await message_service.create_message(
                conversation_id,
                MessageCreate(
                    nm_papel=MessageRole.USER,
                    ds_conteudo=user_message
                ),
                user_id=actual_user_id,  # None para anônimos
                agent_id=None
            )

            yield {
                "type": "user_message",
                "message_id": str(user_msg.id_mensagem),
                "content": user_message,
            }

            # 4. Preparar configuração
            config = agent.ds_config or {}
            model = config.get("model", "gpt-3.5-turbo")
            system_prompt = agent.ds_prompt or "Você é um assistente útil."
            use_memory = agent.is_memory_enabled()
            use_tools = agent.has_tools()

            agent_config = dict(config)
            if temperature is not None:
                agent_config["temperature"] = temperature
            if max_tokens is not None:
                agent_config["max_tokens"] = max_tokens

            yield {"type": "start", "model": model}

            # 5. Streaming com LangChainService
            langchain_service = LangChainService(self.db)
            full_response = ""

            async for chunk in langchain_service.run_process_streaming(
                user_message=user_message,
                user_id=str(user_id),
                conversation_token=str(conversation_id),
                system_prompt=system_prompt,
                use_memory=use_memory,
                use_tools=use_tools,
                agent_config=agent_config,
            ):
                if chunk:
                    full_response += chunk
                    yield {"type": "content", "content": chunk}

            # 6. Salvar resposta do assistente em tb_messages
            estimated_tokens = len(full_response.split())
            cost = estimated_tokens * 0.000002

            assistant_msg = await message_service.create_message(
                conversation_id,
                MessageCreate(
                    nm_papel=MessageRole.ASSISTANT,
                    ds_conteudo=full_response,
                    nr_tokens=estimated_tokens,
                    vl_custo=cost,
                    nm_modelo=model,
                ),
                user_id=None,
                agent_id=agent.id_agente
            )

            yield {
                "type": "done",
                "message_id": str(assistant_msg.id_mensagem),
                "total_tokens": estimated_tokens,
                "cost": float(cost),
            }

        except Exception as e:
            logger.error(f"Erro no chat stream: {str(e)}", exc_info=True)
            yield {"type": "error", "content": f"Erro: {str(e)}"}


async def get_conversation_service():
    """Dependency para obter ConversationService com database session"""
    from src.config.orm_config import get_db
    async for db in get_db():
        yield ConversationService(db)
