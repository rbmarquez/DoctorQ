# src/services/conversation_update_service.py
import uuid
from datetime import datetime
from typing import List

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db, ORMConfig
from src.llms.azure_openai import AzureOpenAILLM
from src.models.chat_message import ChatMessage
from src.models.conversation import Conversation

logger = get_logger(__name__)


class ConversationUpdateService:
    """
    ServiÃ§o temporÃ¡rio para atualizar campos faltantes nas conversas existentes.
    Este serviÃ§o gera tÃ­tulos e resumos usando IA baseado no histÃ³rico de mensagens.
    """

    def __init__(self):
        """Inicializar service sem sessÃ£o fixa."""

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

    async def create_temp_agent_for_title_generation(self) -> str:
        """Criar prompt para geraÃ§Ã£o de tÃ­tulos"""
        return """
        VocÃª Ã© um assistente especializado em criar tÃ­tulos concisos para conversas.

        InstruÃ§Ãµes:
        - Analise a primeira mensagem do usuÃ¡rio fornecida
        - Crie um tÃ­tulo descritivo em atÃ© 50 caracteres
        - O tÃ­tulo deve ser claro e representar o assunto principal
        - Use linguagem em portuguÃªs brasileiro
        - NÃ£o inclua pontuaÃ§Ã£o no final
        - Seja direto e objetivo

        Primeira mensagem do usuÃ¡rio: {first_message}

        Responda apenas com o tÃ­tulo, sem explicaÃ§Ãµes adicionais.
        """

    async def create_temp_agent_for_summary_generation(self) -> str:
        """Criar prompt para geraÃ§Ã£o de resumos"""
        return """
        VocÃª Ã© um assistente especializado em criar resumos de conversas.

        InstruÃ§Ãµes:
        - Analise todo o histÃ³rico da conversa fornecido
        - Crie um resumo em atÃ© 200 caracteres
        - Inclua os principais tÃ³picos discutidos
        - Use linguagem em portuguÃªs brasileiro
        - Seja objetivo e informativo

        HistÃ³rico da conversa: {conversation_history}

        Responda apenas com o resumo, sem explicaÃ§Ãµes adicionais.
        """

    async def _get_conversation_messages(
        self, db_session: AsyncSession, conversation_id: uuid.UUID
    ) -> List[ChatMessage]:
        """Buscar mensagens da conversa"""
        try:
            stmt = (
                select(ChatMessage)
                .where(ChatMessage.id_conversa == conversation_id)
                .order_by(ChatMessage.dt_criacao.asc())
            )

            result = await db_session.execute(stmt)
            messages = result.scalars().all()
            return list(messages)

        except Exception as e:
            logger.error(
                f"Erro ao buscar mensagens da conversa {conversation_id}: {str(e)}"
            )
            return []

    async def _generate_title(
        self, db_session: AsyncSession, messages: List[ChatMessage]
    ) -> str:
        """Gerar tÃ­tulo baseado na primeira mensagem do usuÃ¡rio"""
        try:
            # Encontrar primeira mensagem do usuÃ¡rio
            first_user_message = None
            for msg in messages:
                if (
                    msg.nm_tipo in ["userMessage", "user"]
                    and msg.nm_text
                    and msg.nm_text.strip()
                ):
                    first_user_message = msg.nm_text
                    break

            if not first_user_message:
                return "Conversa sem tÃ­tulo"

            # Usar IA para gerar tÃ­tulo
            llm = AzureOpenAILLM(
                db_session=db_session,
                temperature=0.3,
                max_tokens=50,
                use_credentials=True,
            )

            prompt_template = await self.create_temp_agent_for_title_generation()
            title_prompt = prompt_template.format(
                first_message=first_user_message[:500]
            )

            # Usar o mÃ©todo invoke do LLM
            title = await llm.invoke([title_prompt])

            # Limitar tamanho e limpar
            title = title.strip()[:50] if title else "Conversa"
            return title

        except Exception as e:
            logger.error(f"Erro ao gerar tÃ­tulo: {str(e)}")
            return "Conversa"

    async def _generate_summary(
        self, db_session: AsyncSession, messages: List[ChatMessage]
    ) -> str:
        """Gerar resumo baseado em todas as mensagens"""
        try:
            # Preparar histÃ³rico da conversa
            conversation_text = ""
            for msg in messages:
                if msg.nm_text and msg.nm_text.strip():
                    role = (
                        "UsuÃ¡rio"
                        if msg.nm_tipo in ["userMessage", "user"]
                        else "Assistente"
                    )
                    conversation_text += f"{role}: {msg.nm_text[:300]}\n"

            if not conversation_text.strip():
                return "Resumo nÃ£o disponÃ­vel"

            # Limitar tamanho do texto para nÃ£o exceder limites da API
            if len(conversation_text) > 3000:
                conversation_text = conversation_text[:3000] + "..."

            # Usar IA para gerar resumo
            llm = AzureOpenAILLM(
                db_session=db_session,
                temperature=0.3,
                max_tokens=100,
                use_credentials=True,
            )

            prompt_template = await self.create_temp_agent_for_summary_generation()
            summary_prompt = prompt_template.format(
                conversation_history=conversation_text
            )

            # Usar o mÃ©todo invoke do LLM
            summary = await llm.invoke([summary_prompt])

            # Limitar tamanho e limpar
            summary = summary.strip()[:200] if summary else "Resumo nÃ£o disponÃ­vel"
            return summary

        except Exception as e:
            logger.error(f"Erro ao gerar resumo: {str(e)}")
            return "Resumo nÃ£o disponÃ­vel"

    async def _update_conversation_record(
        self,
        db_session: AsyncSession,
        conversation_id: uuid.UUID,
        nm_titulo: str,
        ds_resumo: str,
        qt_mensagens: int,
        dt_ultima_atividade: datetime,
    ):
        """Atualizar registro da conversa no banco de dados"""
        try:
            # Buscar a conversa
            stmt = select(Conversation).where(
                Conversation.id_conversa == conversation_id
            )
            result = await db_session.execute(stmt)
            conversation = result.scalar_one_or_none()

            if not conversation:
                raise ValueError(f"Conversa nÃ£o encontrada: {conversation_id}")

            # Atualizar campos
            conversation.nm_titulo = nm_titulo
            conversation.ds_resumo = ds_resumo
            conversation.qt_mensagens = qt_mensagens
            conversation.dt_ultima_atividade = dt_ultima_atividade

            await db_session.flush()
            logger.debug(f"Conversa {conversation_id} atualizada com sucesso")

        except Exception as e:
            logger.error(f"Erro ao atualizar conversa {conversation_id}: {str(e)}")
            raise

    async def update_conversation_fields(self, conversation_id: uuid.UUID) -> bool:
        """Atualizar todos os campos de uma conversa especÃ­fica"""

        async def _update_operation(db_session: AsyncSession):
            try:
                # 1. Buscar mensagens da conversa
                messages = await self._get_conversation_messages(
                    db_session, conversation_id
                )

                if not messages:
                    logger.warning(
                        f"Nenhuma mensagem encontrada para conversa {conversation_id}"
                    )
                    return False

                # 2. Calcular qt_mensagens
                qt_mensagens = len(messages)

                # 3. Calcular dt_ultima_atividade
                dt_ultima_atividade = max(msg.dt_criacao for msg in messages)

                # 4. Gerar tÃ­tulo baseado na primeira mensagem do usuÃ¡rio
                nm_titulo = await self._generate_title(db_session, messages)

                # 5. Gerar resumo baseado em todas as mensagens
                ds_resumo = await self._generate_summary(db_session, messages)

                # 6. Atualizar a conversa
                await self._update_conversation_record(
                    db_session=db_session,
                    conversation_id=conversation_id,
                    nm_titulo=nm_titulo,
                    ds_resumo=ds_resumo,
                    qt_mensagens=qt_mensagens,
                    dt_ultima_atividade=dt_ultima_atividade,
                )

                return True

            except Exception as e:
                logger.error(f"Erro ao atualizar conversa {conversation_id}: {str(e)}")
                return False

        return await self._execute_with_session(_update_operation)

    async def get_conversations_to_update(self) -> List[Conversation]:
        """Buscar todas as conversas que precisam de atualizaÃ§Ã£o"""

        async def _get_operation(db_session: AsyncSession):
            try:
                # Buscar conversas que tÃªm pelo menos um dos campos vazios
                stmt = (
                    select(Conversation)
                    .where(
                        and_(
                            Conversation.st_ativa == "S",  # Apenas conversas ativas
                            # Pelo menos um campo precisa ser atualizado
                            (
                                (Conversation.nm_titulo.is_(None))
                                | (Conversation.nm_titulo == "")
                                | (Conversation.ds_resumo.is_(None))
                                | (Conversation.ds_resumo == "")
                                | (Conversation.qt_mensagens == 0)
                            ),
                        )
                    )
                    .order_by(Conversation.dt_criacao.desc())
                )

                result = await db_session.execute(stmt)
                conversations = result.scalars().all()
                return list(conversations)

            except Exception as e:
                logger.error(f"Erro ao buscar conversas para atualizaÃ§Ã£o: {str(e)}")
                return []

        return await self._execute_read_only(_get_operation)

    async def get_conversation_count_to_update(self) -> int:
        """Contar quantas conversas precisam de atualizaÃ§Ã£o"""

        async def _count_operation(db_session: AsyncSession):
            try:
                stmt = select(func.count(Conversation.id_conversa)).where(
                    and_(
                        Conversation.st_ativa == "S",
                        (
                            (Conversation.nm_titulo.is_(None))
                            | (Conversation.nm_titulo == "")
                            | (Conversation.ds_resumo.is_(None))
                            | (Conversation.ds_resumo == "")
                            | (Conversation.qt_mensagens == 0)
                        ),
                    )
                )

                result = await db_session.execute(stmt)
                count = result.scalar()
                return count or 0

            except Exception as e:
                logger.error(f"Erro ao contar conversas para atualizaÃ§Ã£o: {str(e)}")
                return 0

        return await self._execute_read_only(_count_operation)
