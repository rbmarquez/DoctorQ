# src/services/conversation/conversation_background_update_service.py
import asyncio
import uuid
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents import SummaryGeneratorAgent, TitleGeneratorAgent
from src.config.logger_config import get_logger
from src.config.orm_config import get_db_context, ORMConfig
from src.models.chat_message import ChatMessage
from src.models.conversation import Conversation, ConversationUpdate
from src.services.conversation.conversation_service import get_conversation_service

logger = get_logger(__name__)


class ConversationBackgroundUpdateService:
    """
    ServiÃ§o para atualizaÃ§Ã£o em background de conversas usando agentes.
    Executa atualizaÃ§Ãµes de tÃ­tulo e resumo de forma assÃ­ncrona para nÃ£o bloquear o usuÃ¡rio.
    """

    def __init__(self):
        self._running_tasks: Dict[str, asyncio.Task] = {}

    async def schedule_title_generation(
        self, conversation_id: uuid.UUID, delay_seconds: int = 2
    ) -> None:
        """
        Agendar geraÃ§Ã£o de tÃ­tulo em background.

        Args:
            conversation_id: ID da conversa
            delay_seconds: Atraso antes de executar (padrÃ£o: 2 segundos)
        """
        task_key = f"title_{conversation_id}"

        # Cancelar task anterior se existir
        if task_key in self._running_tasks:
            self._running_tasks[task_key].cancel()

        # Criar nova task
        self._running_tasks[task_key] = asyncio.create_task(
            self._generate_title_delayed(conversation_id, delay_seconds)
        )

        logger.debug(
            f"TÃ­tulo agendado para conversa {conversation_id} em {delay_seconds}s"
        )

    async def schedule_summary_generation(
        self, conversation_id: uuid.UUID, delay_seconds: int = 5
    ) -> None:
        """
        Agendar geraÃ§Ã£o de resumo em background.

        Args:
            conversation_id: ID da conversa
            delay_seconds: Atraso antes de executar (padrÃ£o: 5 segundos)
        """
        task_key = f"summary_{conversation_id}"

        # Cancelar task anterior se existir
        if task_key in self._running_tasks:
            self._running_tasks[task_key].cancel()

        # Criar nova task
        self._running_tasks[task_key] = asyncio.create_task(
            self._generate_summary_delayed(conversation_id, delay_seconds)
        )

        logger.debug(
            f"Resumo agendado para conversa {conversation_id} em {delay_seconds}s"
        )

    async def _generate_title_delayed(
        self, conversation_id: uuid.UUID, delay_seconds: int
    ) -> None:
        """Executar geraÃ§Ã£o de tÃ­tulo apÃ³s delay."""
        try:
            await asyncio.sleep(delay_seconds)
            await self._generate_and_update_title(conversation_id)
        except asyncio.CancelledError:
            logger.debug(f"GeraÃ§Ã£o de tÃ­tulo cancelada para conversa {conversation_id}")
        except Exception as e:
            logger.error(f"Erro na geraÃ§Ã£o de tÃ­tulo em background: {str(e)}")
        finally:
            # Remover task da lista
            task_key = f"title_{conversation_id}"
            self._running_tasks.pop(task_key, None)

    async def _generate_summary_delayed(
        self, conversation_id: uuid.UUID, delay_seconds: int
    ) -> None:
        """Executar geraÃ§Ã£o de resumo apÃ³s delay."""
        try:
            await asyncio.sleep(delay_seconds)
            await self._generate_and_update_summary(conversation_id)
        except asyncio.CancelledError:
            logger.debug(f"GeraÃ§Ã£o de resumo cancelada para conversa {conversation_id}")
        except Exception as e:
            logger.error(f"Erro na geraÃ§Ã£o de resumo em background: {str(e)}")
        finally:
            # Remover task da lista
            task_key = f"summary_{conversation_id}"
            self._running_tasks.pop(task_key, None)

    async def _generate_and_update_title(self, conversation_id: uuid.UUID) -> None:
        """Gerar e atualizar tÃ­tulo da conversa."""
        try:
            async with get_db_context() as db_session:
                # Verificar se conversa ainda existe e nÃ£o tem tÃ­tulo
                conversation = await self._get_conversation(db_session, conversation_id)
                if not conversation:
                    logger.debug(f"Conversa nÃ£o encontrada: {conversation_id}")
                    return

                # NÃ£o sobrescrever tÃ­tulo existente
                if conversation.nm_titulo and conversation.nm_titulo.strip():
                    logger.debug(f"Conversa jÃ¡ tem tÃ­tulo: {conversation_id}")
                    return

                # Buscar primeira mensagem do usuÃ¡rio
                messages = await self._get_conversation_messages(
                    db_session, conversation_id
                )
                if not messages:
                    logger.debug(f"Nenhuma mensagem encontrada: {conversation_id}")
                    return

                # Gerar tÃ­tulo usando agente
                title = await self._generate_title_with_agent(messages)
                if not title or not title.strip():
                    logger.debug(f"TÃ­tulo nÃ£o gerado para conversa: {conversation_id}")
                    return

                # Atualizar no banco usando o service
                conversation_service = get_conversation_service()
                conversation_update = ConversationUpdate(
                    id_conversa=conversation_id, nm_titulo=title
                )

                updated_conversation = await conversation_service.update_conversation(
                    conversation_id=conversation_id,
                    conversation_update=conversation_update,
                )

                if updated_conversation:
                    logger.info(
                        f"TÃ­tulo gerado em background para conversa {conversation_id}: {title}"
                    )
                else:
                    logger.warning(
                        f"Falha ao atualizar tÃ­tulo para conversa {conversation_id}"
                    )

        except Exception as e:
            logger.error(
                f"Erro ao gerar tÃ­tulo em background para {conversation_id}: {str(e)}"
            )

    async def _generate_and_update_summary(self, conversation_id: uuid.UUID) -> None:
        """Gerar e atualizar resumo da conversa."""
        try:
            async with get_db_context() as db_session:
                # Verificar se conversa ainda existe e nÃ£o tem resumo
                conversation = await self._get_conversation(db_session, conversation_id)
                if not conversation:
                    logger.debug(f"Conversa nÃ£o encontrada: {conversation_id}")
                    return

                # NÃ£o sobrescrever resumo existente (pode ser atualizado se necessÃ¡rio)
                if conversation.ds_resumo and conversation.ds_resumo.strip():
                    logger.debug(f"Conversa jÃ¡ tem resumo: {conversation_id}")
                    return

                # Buscar mensagens da conversa
                messages = await self._get_conversation_messages(
                    db_session, conversation_id
                )
                if not messages:
                    logger.debug(f"Nenhuma mensagem encontrada: {conversation_id}")
                    return

                # Gerar resumo usando agente
                summary = await self._generate_summary_with_agent(messages)
                if not summary or not summary.strip():
                    logger.debug(f"Resumo nÃ£o gerado para conversa: {conversation_id}")
                    return

                # Atualizar no banco usando o service
                conversation_service = get_conversation_service()
                conversation_update = ConversationUpdate(
                    id_conversa=conversation_id, ds_resumo=summary
                )

                updated_conversation = await conversation_service.update_conversation(
                    conversation_id=conversation_id,
                    conversation_update=conversation_update,
                )

                if updated_conversation:
                    logger.info(
                        f"Resumo gerado em background para conversa {conversation_id}: {summary[:50]}..."
                    )
                else:
                    logger.warning(
                        f"Falha ao atualizar resumo para conversa {conversation_id}"
                    )

        except Exception as e:
            logger.error(
                f"Erro ao gerar resumo em background para {conversation_id}: {str(e)}"
            )

    async def _get_conversation(
        self, db_session: AsyncSession, conversation_id: uuid.UUID
    ) -> Optional[Conversation]:
        """Buscar conversa por ID."""
        stmt = select(Conversation).where(
            Conversation.id_conversa == conversation_id
        )
        result = await db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_conversation_messages(
        self, db_session: AsyncSession, conversation_id: uuid.UUID
    ) -> List[ChatMessage]:
        """Buscar mensagens da conversa ordenadas por data de criaÃ§Ã£o."""
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.id_conversa == conversation_id)
            .order_by(ChatMessage.dt_criacao.asc())
        )

        result = await db_session.execute(stmt)
        return list(result.scalars().all())

    async def _generate_title_with_agent(
        self, messages: List[ChatMessage]
    ) -> Optional[str]:
        """Gerar tÃ­tulo usando agente customizado."""
        try:
            # Encontrar primeira mensagem do usuÃ¡rio
            first_user_message = None
            for msg in sorted(messages, key=lambda x: x.dt_criacao):
                if (
                    msg.nm_tipo in ["userMessage", "user"]
                    and msg.nm_text
                    and msg.nm_text.strip()
                    and len(msg.nm_text.strip()) >= 1
                ):
                    first_user_message = msg.nm_text.strip()
                    break

            if not first_user_message:
                logger.debug("Primeira mensagem vÃ¡lida do usuÃ¡rio nÃ£o encontrada")
                return "Nova Conversa"

            # Limitar tamanho para otimizar processamento
            if len(first_user_message) > 300:
                first_user_message = first_user_message[:300] + "..."

            # Usar agente customizado
            async with get_db_context() as db_session:
                title_agent = TitleGeneratorAgent(db_session=db_session)
                title = await title_agent.generate_title(text=first_user_message)

            # Validar resultado
            if not title or len(title.strip()) < 2:
                logger.debug("TÃ­tulo gerado invÃ¡lido")
                return "Nova Conversa"

            clean_title = title.strip()
            logger.debug(f"TÃ­tulo gerado: '{clean_title}'")
            return clean_title

        except Exception as e:
            logger.error(f"Erro ao gerar tÃ­tulo com agente: {str(e)}")
            return "Nova Conversa"

    async def _generate_summary_with_agent(
        self, messages: List[ChatMessage]
    ) -> Optional[str]:
        """Gerar resumo usando agente customizado."""
        try:
            # Converter mensagens para texto formatado
            conversation_parts = []
            for msg in sorted(messages, key=lambda x: x.dt_criacao):
                if msg.nm_text and msg.nm_text.strip():
                    role = (
                        "UsuÃ¡rio"
                        if msg.nm_tipo in ["userMessage", "user"]
                        else "Assistente"
                    )
                    text = msg.nm_text.strip()
                    if len(text) > 400:
                        text = text[:400] + "..."
                    conversation_parts.append(f"{role}: {text}")

            if not conversation_parts:
                logger.debug("Nenhuma mensagem vÃ¡lida encontrada para resumo")
                return "Conversa iniciada"

            # Juntar mensagens
            conversation_text = "\n".join(conversation_parts)

            # Limitar tamanho total
            if len(conversation_text) > 2000:
                conversation_text = (
                    conversation_text[:2000] + "\n... [conversa truncada]"
                )

            # Usar agente customizado
            async with get_db_context() as db_session:
                summary_agent = SummaryGeneratorAgent(db_session=db_session)
                summary = await summary_agent.generate_summary(text=conversation_text)

            # Validar resultado
            if not summary or len(summary.strip()) < 5:
                logger.debug("Resumo gerado invÃ¡lido")
                return f"Conversa com {len(conversation_parts)} mensagens"

            clean_summary = summary.strip()
            logger.debug(f"Resumo gerado: '{clean_summary[:50]}...'")
            return clean_summary

        except Exception as e:
            logger.error(f"Erro ao gerar resumo com agente: {str(e)}")
            return f"Conversa com {len(messages)} mensagens"

    async def cancel_pending_tasks(self, conversation_id: uuid.UUID) -> None:
        """Cancelar tasks pendentes para uma conversa."""
        tasks_to_cancel = [f"title_{conversation_id}", f"summary_{conversation_id}"]

        for task_key in tasks_to_cancel:
            if task_key in self._running_tasks:
                self._running_tasks[task_key].cancel()
                self._running_tasks.pop(task_key, None)
                logger.debug(f"Task cancelada: {task_key}")

    async def get_running_tasks_count(self) -> int:
        """Obter nÃºmero de tasks em execuÃ§Ã£o."""
        return len(self._running_tasks)

    async def cleanup_finished_tasks(self) -> None:
        """Limpar tasks finalizadas."""
        finished_keys = []
        for key, task in self._running_tasks.items():
            if task.done():
                finished_keys.append(key)

        for key in finished_keys:
            self._running_tasks.pop(key, None)

        if finished_keys:
            logger.debug(f"Limpeza de {len(finished_keys)} tasks finalizadas")


# InstÃ¢ncia global do serviÃ§o
_background_update_service = ConversationBackgroundUpdateService()


async def get_conversation_background_update_service() -> (
    ConversationBackgroundUpdateService
):
    """Obter instÃ¢ncia do serviÃ§o de atualizaÃ§Ã£o em background."""
    return _background_update_service
