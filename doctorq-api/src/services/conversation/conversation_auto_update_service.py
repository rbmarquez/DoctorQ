# src/services/conversation_auto_update_service.py
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents import SummaryGeneratorAgent, TitleGeneratorAgent
from src.config.logger_config import get_logger
from src.config.orm_config import get_db, ORMConfig
from src.models.chat_message import ChatMessage
from src.models.conversation import Conversation
from src.services.conversation.conversation_background_update_service import (
    get_conversation_background_update_service,
)

logger = get_logger(__name__)


class ConversationAutoUpdateService:
    """
    ServiÃ§o para atualizaÃ§Ã£o automÃ¡tica de conversas usando agentes customizados.
    Integrado ao salvamento de mensagens para manter conversas sempre atualizadas.
    """

    def __init__(self):
        """Inicializar service sem sessÃ£o fixa"""

    async def _execute_with_session(self, operation):
        """Executar operaÃ§Ã£o com sessÃ£o gerenciada automaticamente"""
        async with get_db() as db_session:
            try:
                result = await operation(db_session)
                await db_session.commit()
                return result
            except Exception as e:
                await db_session.rollback()
                raise e

    async def _execute_read_only(self, operation):
        """Executar operaÃ§Ã£o de leitura com sessÃ£o gerenciada"""
        async with get_db() as db_session:
            return await operation(db_session)

    async def update_conversation_on_new_message(
        self, conversation_id: uuid.UUID
    ) -> bool:
        """
        Atualizar conversa quando uma nova mensagem Ã© adicionada.
        Este mÃ©todo verifica se a conversa precisa de atualizaÃ§Ãµes e as aplica.

        Args:
            conversation_id: ID da conversa

        Returns:
            True se a conversa foi atualizada, False caso contrÃ¡rio
        """
        try:

            async def _update_operation(db_session: AsyncSession):
                # 1. Buscar conversa atual
                conversation = await self._get_conversation(db_session, conversation_id)
                if not conversation:
                    logger.warning(f"Conversa nÃ£o encontrada: {conversation_id}")
                    return False

                # 2. Buscar mensagens da conversa
                messages = await self._get_conversation_messages(
                    db_session, conversation_id
                )
                if not messages:
                    logger.warning(
                        f"Nenhuma mensagem encontrada para conversa {conversation_id}"
                    )
                    return False

                # 3. Verificar se precisa atualizar
                needs_update = await self._check_needs_update(
                    conversation, len(messages)
                )
                if not needs_update:
                    logger.debug(
                        f"Conversa {conversation_id} nÃ£o precisa de atualizaÃ§Ã£o"
                    )
                    return False

                # 4. Atualizar campos necessÃ¡rios
                updated = False

                # Atualizar sempre: quantidade de mensagens e data Ãºltima atividade
                qt_mensagens = len(messages)
                dt_ultima_atividade = max(msg.dt_criacao for msg in messages)

                conversation.qt_mensagens = qt_mensagens
                conversation.dt_ultima_atividade = dt_ultima_atividade
                updated = True

                # Agendar atualizaÃ§Ã£o de tÃ­tulo em background se necessÃ¡rio
                if await self._should_update_title(conversation):
                    background_service = (
                        await get_conversation_background_update_service()
                    )
                    await background_service.schedule_title_generation(
                        conversation_id=conversation_id,
                        delay_seconds=2,  # 2 segundos apÃ³s a resposta
                    )

                # Agendar atualizaÃ§Ã£o de resumo em background se necessÃ¡rio
                if await self._should_update_summary(conversation, messages):
                    background_service = (
                        await get_conversation_background_update_service()
                    )
                    await background_service.schedule_summary_generation(
                        conversation_id=conversation_id,
                        delay_seconds=5,  # 5 segundos apÃ³s a resposta
                    )

                if updated:
                    await db_session.flush()

                return updated

            return await self._execute_with_session(_update_operation)

        except Exception as e:
            logger.error(f"Erro ao atualizar conversa {conversation_id}: {str(e)}")
            return False

    async def _get_conversation(
        self, db_session: AsyncSession, conversation_id: uuid.UUID
    ) -> Optional[Conversation]:
        """Buscar conversa por ID"""
        stmt = select(Conversation).where(
            Conversation.id_conversa == conversation_id
        )
        result = await db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_conversation_messages(
        self, db_session: AsyncSession, conversation_id: uuid.UUID
    ) -> List[ChatMessage]:
        """Buscar mensagens da conversa ordenadas por data de criaÃ§Ã£o"""
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.id_conversa == conversation_id)
            .order_by(ChatMessage.dt_criacao.asc())
        )

        result = await db_session.execute(stmt)
        return list(result.scalars().all())

    async def _check_needs_update(
        self, conversation: Conversation, message_count: int
    ) -> bool:
        """Verificar se a conversa precisa de atualizaÃ§Ã£o"""
        # Sempre atualizar quantidade e data
        if conversation.qt_mensagens != message_count:
            return True

        # Verificar se tÃ­tulo ou resumo estÃ£o vazios
        if not conversation.nm_titulo or conversation.nm_titulo.strip() == "":
            return True

        if not conversation.ds_resumo or conversation.ds_resumo.strip() == "":
            return True

        return False

    async def _should_update_title(self, conversation: Conversation) -> bool:
        """Verificar se deve atualizar o tÃ­tulo"""
        # OTIMIZAÃ‡ÃƒO: SÃ³ gerar tÃ­tulo na 2Âª ou 3Âª mensagem para ter mais contexto
        if conversation.qt_mensagens < 2:
            return False

        # Atualizar se tÃ­tulo estÃ¡ vazio ou Ã© padrÃ£o
        if not conversation.nm_titulo or conversation.nm_titulo.strip() == "":
            return True

        # Atualizar se tÃ­tulo Ã© genÃ©rico (incluindo fallbacks dos agentes)
        generic_titles = [
            "Conversa",
            "Nova Conversa",
            "Conversa sem tÃ­tulo",
            "TÃ­tulo GenÃ©rico",
            "TÃ­tulo nÃ£o disponÃ­vel",
        ]
        if conversation.nm_titulo.strip() in generic_titles:
            return True

        return False

    async def _should_update_summary(
        self, conversation: Conversation, messages: List[ChatMessage]
    ) -> bool:
        """Verificar se deve atualizar o resumo"""
        # OTIMIZAÃ‡ÃƒO: SÃ³ gerar resumo apÃ³s 4+ mensagens para ter conteÃºdo suficiente
        if conversation.qt_mensagens < 4:
            return False

        # Atualizar se resumo estÃ¡ vazio ou Ã© padrÃ£o
        if not conversation.ds_resumo or conversation.ds_resumo.strip() == "":
            return True

        # Atualizar se resumo Ã© genÃ©rico (incluindo fallbacks dos agentes)
        generic_summaries = [
            "Resumo nÃ£o disponÃ­vel",
            "Conversa sobre diversos tÃ³picos",
            "Conversa sem conteÃºdo",
            "Conversa iniciada",
        ]
        if conversation.ds_resumo.strip() in generic_summaries:
            return True

        # Atualizar se resumo segue padrÃ£o de fallback "Conversa com X mensagens"
        if (
            conversation.ds_resumo.strip().startswith("Conversa com")
            and "mensagens" in conversation.ds_resumo
        ):
            return True

        # OTIMIZAÃ‡ÃƒO: Atualizar periodicamente a cada 10 mensagens (em vez de 5)
        if len(messages) > 0 and len(messages) % 10 == 0:
            return True

        return False

    async def _generate_title_with_agent(
        self, messages: List[ChatMessage]
    ) -> Optional[str]:
        """
        Gerar tÃ­tulo usando agente customizado.
        Passa apenas a primeira mensagem do usuÃ¡rio para o agente.
        Retorna apenas o texto do tÃ­tulo para salvar no banco.
        """
        try:
            # Encontrar primeira mensagem do usuÃ¡rio (mais especÃ­fica)
            first_user_message = None
            for msg in sorted(messages, key=lambda x: x.dt_criacao):
                if (
                    msg.nm_tipo in ["userMessage", "user"]
                    and msg.nm_text
                    and msg.nm_text.strip()
                    and len(msg.nm_text.strip()) >= 1
                ):  # Aceita qualquer mensagem nÃ£o vazia
                    first_user_message = msg.nm_text.strip()
                    break

            if not first_user_message:
                logger.warning("Primeira mensagem vÃ¡lida do usuÃ¡rio nÃ£o encontrada")
                # Vamos fazer debug adicional para entender o que estÃ¡ acontecendo
                logger.debug(f"Total de mensagens para anÃ¡lise: {len(messages)}")
                for i, msg in enumerate(sorted(messages, key=lambda x: x.dt_criacao)):
                    logger.debug(
                        f"Mensagem {i}: tipo='{msg.nm_tipo}', texto='{msg.nm_text}', tamanho={len(msg.nm_text.strip()) if msg.nm_text else 0}"
                    )
                return "Conversa"  # Fallback bÃ¡sico

            # Limitar tamanho para otimizar processamento
            if len(first_user_message) > 300:
                first_user_message = first_user_message[:300] + "..."

            # Usar agente customizado com sessÃ£o de banco - interface genÃ©rica
            async with get_db() as db_session:
                title_agent = TitleGeneratorAgent(db_session=db_session)
                title = await title_agent.generate_title(text=first_user_message)

            # Validar resultado
            if not title or len(title.strip()) < 2:
                logger.warning("TÃ­tulo gerado invÃ¡lido, usando fallback")
                return "Conversa"

            # Retornar apenas o texto limpo para o banco
            clean_title = title.strip()
            logger.debug(f"TÃ­tulo gerado com sucesso: '{clean_title}'")
            return clean_title

        except Exception as e:
            logger.error(f"Erro ao gerar tÃ­tulo com agente: {str(e)}")
            return "Conversa"  # Fallback em caso de erro

    async def _generate_summary_with_agent(
        self, messages: List[ChatMessage]
    ) -> Optional[str]:
        """
        Gerar resumo usando agente customizado.
        Passa toda a conversa formatada para o agente.
        Retorna apenas o texto do resumo para salvar no banco.
        """
        try:
            # Converter todas as mensagens para texto formatado
            conversation_parts = []
            for msg in sorted(messages, key=lambda x: x.dt_criacao):
                if msg.nm_text and msg.nm_text.strip():
                    role = (
                        "UsuÃ¡rio"
                        if msg.nm_tipo in ["userMessage", "user"]
                        else "Assistente"
                    )
                    # Limitar cada mensagem individual
                    text = msg.nm_text.strip()
                    if len(text) > 400:
                        text = text[:400] + "..."
                    conversation_parts.append(f"{role}: {text}")

            if not conversation_parts:
                logger.warning("Nenhuma mensagem vÃ¡lida encontrada para resumo")
                return "Conversa sem conteÃºdo"  # Fallback bÃ¡sico

            # Juntar todas as mensagens
            conversation_text = "\n".join(conversation_parts)

            # Limitar tamanho total para otimizar processamento
            if len(conversation_text) > 2000:
                conversation_text = (
                    conversation_text[:2000] + "\n... [conversa truncada]"
                )

            logger.debug(
                f"Gerando resumo para conversa com {len(conversation_parts)} mensagens"
            )
            logger.debug(f"Texto da conversa: {len(conversation_text)} caracteres")

            # Usar agente customizado com sessÃ£o de banco - interface genÃ©rica
            async with get_db() as db_session:
                summary_agent = SummaryGeneratorAgent(db_session=db_session)
                summary = await summary_agent.generate_summary(text=conversation_text)

            # Validar resultado
            if not summary or len(summary.strip()) < 5:
                logger.warning("Resumo gerado invÃ¡lido, usando fallback")
                return f"Conversa com {len(conversation_parts)} mensagens"

            # Retornar apenas o texto limpo para o banco
            clean_summary = summary.strip()
            logger.debug(f"Resumo gerado com sucesso: '{clean_summary[:50]}...'")
            return clean_summary

        except Exception as e:
            logger.error(f"Erro ao gerar resumo com agente: {str(e)}")
            return f"Conversa com {len(messages)} mensagens"  # Fallback em caso de erro

    async def force_update_conversation(
        self, conversation_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        ForÃ§ar atualizaÃ§Ã£o completa de uma conversa especÃ­fica.
        Usado para testes ou correÃ§Ãµes manuais.

        Returns:
            DicionÃ¡rio com resultado da atualizaÃ§Ã£o
        """
        try:

            async def _force_update_operation(db_session: AsyncSession):
                # Buscar conversa e mensagens
                conversation = await self._get_conversation(db_session, conversation_id)
                if not conversation:
                    return {"error": "Conversa nÃ£o encontrada"}

                messages = await self._get_conversation_messages(
                    db_session, conversation_id
                )
                if not messages:
                    return {"error": "Nenhuma mensagem encontrada"}

                # Dados originais
                original_data = {
                    "title": conversation.nm_titulo,
                    "summary": conversation.ds_resumo,
                    "message_count": conversation.qt_mensagens,
                    "last_activity": conversation.dt_ultima_atividade,
                }

                # ForÃ§ar atualizaÃ§Ã£o de todos os campos
                qt_mensagens = len(messages)
                dt_ultima_atividade = max(msg.dt_criacao for msg in messages)

                title = await self._generate_title_with_agent(messages)
                summary = await self._generate_summary_with_agent(messages)

                # Aplicar atualizaÃ§Ãµes
                conversation.qt_mensagens = qt_mensagens
                conversation.dt_ultima_atividade = dt_ultima_atividade

                if title:
                    conversation.nm_titulo = title
                if summary:
                    conversation.ds_resumo = summary

                await db_session.flush()

                # Dados atualizados
                updated_data = {
                    "title": conversation.nm_titulo,
                    "summary": conversation.ds_resumo,
                    "message_count": conversation.qt_mensagens,
                    "last_activity": conversation.dt_ultima_atividade,
                }

                return {
                    "success": True,
                    "conversation_id": str(conversation_id),
                    "original": original_data,
                    "updated": updated_data,
                    "changes": {
                        "title_changed": original_data["title"]
                        != updated_data["title"],
                        "summary_changed": original_data["summary"]
                        != updated_data["summary"],
                        "count_changed": original_data["message_count"]
                        != updated_data["message_count"],
                    },
                }

            return await self._execute_with_session(_force_update_operation)

        except Exception as e:
            logger.error(
                f"Erro ao forÃ§ar atualizaÃ§Ã£o da conversa {conversation_id}: {str(e)}"
            )
            return {"error": str(e)}


# Factory function para facilitar uso
async def get_conversation_auto_update_service() -> ConversationAutoUpdateService:
    """Obter instÃ¢ncia do serviÃ§o de atualizaÃ§Ã£o automÃ¡tica de conversas"""
    return ConversationAutoUpdateService()
