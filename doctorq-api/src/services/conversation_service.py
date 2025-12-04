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
# REMOVIDO: Movido para DoctorQ-service-ai
# from src.models.agent import Agent
from src.services.langchain_service import LangChainService
from src.middleware.tenant_middleware import TenantContext

logger = logging.getLogger(__name__)


class ConversationService:
    """Serviço para gerenciar conversas e mensagens."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm_service = LangChainService()

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
            # Obter tenant atual
            tenant_id = TenantContext.get_current_tenant()

            # Verificar se o agente existe
            agent_query = select(Agent).where(Agent.id_agente == conversation_data.id_agente)
            result = await self.db.execute(agent_query)
            agent = result.scalar_one_or_none()

            if not agent:
                raise ValueError(f"Agente {conversation_data.id_agente} não encontrado")

            # Criar conversa
            conversation = Conversation(
                id_usuario=user_id,
                id_empresa=tenant_id,
                id_agente=conversation_data.id_agente,
                nm_titulo=conversation_data.nm_titulo,
                ds_resumo=conversation_data.ds_resumo,
                ds_metadata=conversation_data.ds_metadata or {},
                ds_tags=conversation_data.ds_tags,
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
        user_id: UUID,
        include_messages: bool = False,
    ) -> Optional[Conversation]:
        """
        Busca uma conversa por ID.

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário
            include_messages: Se deve incluir mensagens

        Returns:
            Conversa encontrada ou None
        """
        try:
            query = select(Conversation).where(
                and_(
                    Conversation.id_conversa == conversation_id,
                    Conversation.id_usuario == user_id,
                )
            )

            if include_messages:
                query = query.options(selectinload(Conversation.messages))

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
            # Filtros base
            filters = [Conversation.id_usuario == user_id]

            # Filtrar por tenant
            tenant_id = TenantContext.get_current_tenant()
            if tenant_id:
                filters.append(Conversation.id_empresa == tenant_id)

            # Filtro de arquivadas
            if archived is not None:
                filters.append(Conversation.st_arquivada == archived)

            # Busca por texto
            if search:
                filters.append(
                    or_(
                        Conversation.nm_titulo.ilike(f"%{search}%"),
                        Conversation.ds_resumo.ilike(f"%{search}%"),
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

            # Atualizar campos
            update_dict = update_data.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(conversation, key, value)

            # Atualizar timestamp de arquivamento
            if update_data.st_arquivada is True and not conversation.dt_arquivada:
                conversation.dt_arquivada = datetime.utcnow()
            elif update_data.st_arquivada is False:
                conversation.dt_arquivada = None

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

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário

        Returns:
            Token de compartilhamento
        """
        try:
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return None

            # Gerar token se não existir
            if not conversation.ds_token_compartilhamento:
                # Usar função do banco
                query = select(func.fn_gerar_token_compartilhamento())
                result = await self.db.execute(query)
                token = result.scalar()

                conversation.ds_token_compartilhamento = token
                conversation.st_compartilhada = True

                await self.db.commit()
                await self.db.refresh(conversation)

            return conversation.ds_token_compartilhamento

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

        Args:
            token: Token de compartilhamento

        Returns:
            Conversa compartilhada
        """
        try:
            query = (
                select(Conversation)
                .where(
                    and_(
                        Conversation.ds_token_compartilhamento == token,
                        Conversation.st_compartilhada == True,
                    )
                )
                .options(selectinload(Conversation.messages))
            )

            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error(f"Erro ao buscar conversa compartilhada: {str(e)}")
            raise

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
        user_id: UUID,
        user_message: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[Dict, None]:
        """
        Processa mensagem do usuário e retorna resposta do agente com streaming.

        Integrado com LangChainService para chat streaming completo.

        Args:
            conversation_id: ID da conversa
            user_id: ID do usuário
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

            message_service = MessageService(self.db)
            user_msg = await message_service.create_message(
                conversation_id,
                MessageCreate(
                    nm_papel=MessageRole.USER,
                    ds_conteudo=user_message
                ),
                user_id=user_id,
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

