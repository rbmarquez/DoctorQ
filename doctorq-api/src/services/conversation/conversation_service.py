# src/services/conversation_service.py
import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Union

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db, ORMConfig
from src.llms.azure_openai import AzureOpenAILLM
from src.models.chat_message import ChatMessage
from src.models.conversation import Conversation, ConversationCreate, ConversationUpdate

logger = get_logger(__name__)


class ConversationService:
    """Service para operaÃ§Ãµes com conversas - VersÃ£o com gerenciamento de sessÃ£o corrigido"""

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

    async def create_conversation(
        self, conversation_data: ConversationCreate, user_id: uuid.UUID
    ) -> Conversation:
        """Criar uma nova conversa"""

        async def _create_operation(db_session: AsyncSession):
            try:
                # Verificar se o agente existe
                from src.models.agent import Agent
                from sqlalchemy import select
                agent_query = select(Agent).where(Agent.id_agente == conversation_data.id_agente)
                result = await db_session.execute(agent_query)
                agent = result.scalar_one_or_none()

                if not agent:
                    raise ValueError(f"Agente {conversation_data.id_agente} não encontrado")

                # Obter tenant atual (se disponível)
                try:
                    from src.config.tenant_context import TenantContext
                    tenant_id = TenantContext.get_current_tenant()
                except Exception:
                    tenant_id = None

                # Mapear campos do Pydantic para SQLAlchemy
                db_conversation = Conversation(
                    id_usuario=user_id,
                    id_empresa=tenant_id,
                    id_agente=conversation_data.id_agente,
                    nm_titulo=conversation_data.nm_titulo,
                    ds_resumo=conversation_data.ds_resumo,
                    ds_metadata=conversation_data.ds_metadata or {},
                    ds_tags=conversation_data.ds_tags,
                )

                db_session.add(db_conversation)
                await db_session.flush()
                await db_session.refresh(db_conversation)
                return db_conversation

            except ValueError:
                raise
            except Exception as e:
                logger.error(f"Erro ao criar conversa: {str(e)}")
                raise RuntimeError(f"Erro ao criar conversa: {str(e)}") from e

        return await self._execute_with_session(_create_operation)

    async def _get_conversation_by_token_internal(
        self, db_session: AsyncSession, token: str
    ) -> Optional[Conversation]:
        """MÃ©todo interno para buscar conversa por token"""
        stmt = select(Conversation).where(Conversation.nm_token == token)
        result = await db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_conversation_by_id(
        self, conversation_id: uuid.UUID
    ) -> Optional[Conversation]:
        """Obter uma conversa por ID"""

        async def _get_operation(db_session: AsyncSession):
            try:
                stmt = select(Conversation).where(
                    Conversation.id_conversa == conversation_id
                )
                # âœ… SessÃ£o gerenciada adequadamente
                result = await db_session.execute(stmt)
                conversation = result.scalar_one_or_none()

                if not conversation:
                    logger.debug(f"Conversa nÃ£o encontrada: {conversation_id}")

                return conversation

            except Exception as e:
                logger.error(f"Erro ao buscar conversa por ID: {str(e)}")
                raise RuntimeError(f"Erro ao buscar conversa: {str(e)}") from e

        return await self._execute_read_only(_get_operation)

    async def get_conversation_by_token(self, token: str) -> Optional[Conversation]:
        """Obter uma conversa por token"""

        async def _get_operation(db_session: AsyncSession):
            try:
                stmt = select(Conversation).where(Conversation.nm_token == token)
                # âœ… SessÃ£o gerenciada adequadamente
                result = await db_session.execute(stmt)
                conversation = result.scalar_one_or_none()

                if not conversation:
                    logger.debug(f"Conversa nÃ£o encontrada: {token}")

                return conversation

            except Exception as e:
                logger.error(f"Erro ao buscar conversa por token: {str(e)}")
                raise RuntimeError(f"Erro ao buscar conversa: {str(e)}") from e

        return await self._execute_read_only(_get_operation)

    async def get_conversations_by_user(self, user_id: uuid.UUID) -> List[Conversation]:
        """Obter todas as conversas de um usuÃ¡rio"""

        async def _get_operation(db_session: AsyncSession):
            try:
                stmt = (
                    select(Conversation)
                    .where(Conversation.id_usuario == user_id)
                    .order_by(Conversation.dt_criacao.desc())
                )

                result = await db_session.execute(stmt)
                conversations = result.scalars().all()
                return list(conversations)

            except Exception as e:
                logger.error(f"Erro ao buscar conversas do usuÃ¡rio: {str(e)}")
                raise RuntimeError(f"Erro ao buscar conversas: {str(e)}") from e

        return await self._execute_read_only(_get_operation)

    async def list_conversations(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        user_id: Optional[Union[uuid.UUID, str]] = None,
        status_filter: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[Conversation], int]:
        """Listar conversas com filtros e paginaÃ§Ã£o"""

        async def _list_operation(db_session: AsyncSession):
            nonlocal order_by
            try:
                # Validar campo de ordenaÃ§Ã£o
                valid_order_fields = [
                    "dt_criacao",
                    "nm_token",
                    "st_ativa",
                    "id_conversa",
                    "dt_expira_em",
                    "dt_ultima_atividade",
                    "nm_titulo",
                    "qt_mensagens",
                ]
                if order_by not in valid_order_fields:
                    logger.warning(
                        f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando dt_criacao"
                    )
                    order_by = "dt_criacao"

                # Query base para contar
                count_stmt = select(func.count(Conversation.id_conversa))

                # Query base para dados
                stmt = select(Conversation)

                # Aplicar filtros
                filters = []
                if search:
                    # Buscar por token OU tÃ­tulo OU mensagem
                    # Subquery para conversas com mensagem que bate o termo
                    subq = (
                        select(ChatMessage.id_conversa)
                        .where(ChatMessage.nm_text.ilike(f"%{search}%"))
                        .distinct()
                    )
                    search_filter = or_(
                        Conversation.nm_token.ilike(f"%{search}%"),
                        Conversation.nm_titulo.ilike(f"%{search}%"),
                        Conversation.id_conversa.in_(subq),
                    )
                    filters.append(search_filter)

                if user_id:
                    # Agora que o frontend envia sempre o UUID, simplificamos a lÃ³gica
                    user_uuid_filter = user_id
                    if isinstance(user_id, str):
                        try:
                            # Converter string para UUID
                            user_uuid_filter = uuid.UUID(user_id)
                        except ValueError:
                            logger.warning(
                                f"ID de usuÃ¡rio invÃ¡lido (nÃ£o Ã© UUID): {user_id}"
                            )
                            # Se nÃ£o for UUID vÃ¡lido, filtrar por ID impossÃ­vel
                            # para garantir que nenhuma conversa seja retornada
                            user_uuid_filter = uuid.uuid4()  # UUID que nÃ£o existe

                    filters.append(Conversation.id_usuario == user_uuid_filter)

                if status_filter:
                    filters.append(Conversation.st_ativa == status_filter)

                if filters:
                    count_stmt = count_stmt.where(and_(*filters))
                    stmt = stmt.where(and_(*filters))

                # Contar total
                total_result = await db_session.execute(count_stmt)
                total = total_result.scalar()

                # Aplicar ordenaÃ§Ã£o
                order_column = getattr(Conversation, order_by, Conversation.dt_criacao)
                if order_desc:
                    stmt = stmt.order_by(order_column.desc())
                else:
                    stmt = stmt.order_by(order_column.asc())

                # Aplicar paginaÃ§Ã£o
                offset = (page - 1) * size
                stmt = stmt.offset(offset).limit(size)

                # Executar query
                result = await db_session.execute(stmt)
                conversations = result.scalars().all()
                return list(conversations), total

            except Exception as e:
                logger.error(f"Erro ao listar conversas: {str(e)}")
                raise RuntimeError(f"Erro ao listar conversas: {str(e)}") from e

        return await self._execute_read_only(_list_operation)

    async def update_conversation(
        self, conversation_id: uuid.UUID, conversation_update: ConversationUpdate
    ) -> Optional[Conversation]:
        """Atualizar uma conversa existente"""

        async def _update_operation(db_session: AsyncSession):
            try:
                # Buscar a conversa
                conversation = await self._get_conversation_by_id_internal(
                    db_session, conversation_id
                )
                if not conversation:
                    logger.warning(f"Conversa nÃ£o encontrada: {conversation_id}")
                    return None

                # Se o token mudar, validar duplicidade
                nm_token = conversation_update.nm_token
                if nm_token and nm_token != conversation.nm_token:
                    dup = await self._get_conversation_by_token_internal(
                        db_session, nm_token
                    )
                    if dup is not None and str(dup.id_conversa) != str(
                        conversation_id
                    ):
                        raise ValueError(f"Conversa com token '{nm_token}' jÃ¡ existe")

                # Aplicar os campos que vieram no payload
                data = conversation_update.model_dump(exclude_unset=True)
                field_map = {
                    "nm_token": "nm_token",
                    "dt_expira_em": "dt_expira_em",
                    "st_ativa": "st_ativa",
                    "nm_titulo": "nm_titulo",
                    "ds_resumo": "ds_resumo",
                }

                for key, attr in field_map.items():
                    if key in data:
                        setattr(conversation, attr, data[key])

                # Persistir e retornar
                await db_session.flush()
                await db_session.refresh(conversation)
                logger.debug(f"Conversa atualizada: {conversation.nm_token}")
                return conversation

            except ValueError:
                raise
            except Exception as e:
                logger.error(f"Erro ao atualizar conversa: {e}")
                raise RuntimeError(f"Erro ao atualizar conversa: {str(e)}") from e

        return await self._execute_with_session(_update_operation)

    async def _get_conversation_by_id_internal(
        self, db_session: AsyncSession, conversation_id: uuid.UUID
    ) -> Optional[Conversation]:
        """MÃ©todo interno para buscar conversa por ID"""
        stmt = select(Conversation).where(
            Conversation.id_conversa == conversation_id
        )
        result = await db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_conversation(self, conversation_id: uuid.UUID) -> bool:
        """Deletar uma conversa"""

        async def _delete_operation(db_session: AsyncSession):
            try:
                conversation = await self._get_conversation_by_id_internal(
                    db_session, conversation_id
                )
                if not conversation:
                    logger.warning(
                        f"Conversa nÃ£o encontrada para deleÃ§Ã£o: {conversation_id}"
                    )
                    return False

                await db_session.delete(conversation)
                await db_session.flush()
                logger.debug(f"Conversa deletada: {conversation.nm_token}")
                return True

            except Exception as e:
                logger.error(f"Erro ao deletar conversa: {str(e)}")
                raise RuntimeError(f"Erro ao deletar conversa: {str(e)}") from e

        return await self._execute_with_session(_delete_operation)

    async def deactivate_conversation(
        self, conversation_id: uuid.UUID
    ) -> Optional[Conversation]:
        """Desativar uma conversa"""

        async def _deactivate_operation(db_session: AsyncSession):
            try:
                conversation = await self._get_conversation_by_id_internal(
                    db_session, conversation_id
                )
                if not conversation:
                    return None

                setattr(conversation, "st_ativa", "N")
                await db_session.flush()
                await db_session.refresh(conversation)
                logger.debug(f"Conversa desativada: {conversation.nm_token}")
                return conversation

            except Exception as e:
                logger.error(f"Erro ao desativar conversa: {str(e)}")
                raise RuntimeError(f"Erro ao desativar conversa: {str(e)}") from e

        return await self._execute_with_session(_deactivate_operation)

    async def check_conversation_expired(self, conversation_id: uuid.UUID) -> bool:
        """Verificar se uma conversa estÃ¡ expirada"""

        async def _check_operation(db_session: AsyncSession):
            try:
                conversation = await self._get_conversation_by_id_internal(
                    db_session, conversation_id
                )
                if not conversation:
                    return True

                dt_expira_em = getattr(conversation, "dt_expira_em", None)
                if dt_expira_em is not None and dt_expira_em <= datetime.now():
                    return True

                return False

            except Exception as e:
                logger.error(f"Erro ao verificar expiraÃ§Ã£o da conversa: {str(e)}")
                return True

        return await self._execute_read_only(_check_operation)

    async def generate_title_from_first_message(
        self, conversation_id: uuid.UUID
    ) -> Optional[str]:
        """Gerar tÃ­tulo baseado na primeira mensagem da conversa usando IA"""

        async def _generate_title_operation(db_session: AsyncSession):
            try:
                # Buscar a primeira mensagem da conversa (tipo 'user')
                stmt = (
                    select(ChatMessage)
                    .where(
                        and_(
                            ChatMessage.id_conversa == conversation_id,
                            ChatMessage.nm_tipo == "user",
                        )
                    )
                    .order_by(ChatMessage.dt_criacao.asc())
                    .limit(1)
                )

                result = await db_session.execute(stmt)
                first_message = result.scalar_one_or_none()

                if not first_message or not first_message.nm_text:
                    logger.debug(
                        f"Nenhuma mensagem de usuÃ¡rio encontrada para gerar tÃ­tulo: {conversation_id}"
                    )
                    return None

                # Configurar LLM para geraÃ§Ã£o de tÃ­tulo
                llm = AzureOpenAILLM(
                    db_session=db_session,
                    temperature=0.3,
                    max_tokens=50,
                    use_credentials=True,
                )

                # Prompt para gerar tÃ­tulo conciso
                system_prompt = """VocÃª Ã© um assistente especializado em criar tÃ­tulos concisos e informativos.
Baseado na primeira mensagem do usuÃ¡rio, crie um tÃ­tulo de no mÃ¡ximo 50 caracteres que capture a essÃªncia da pergunta ou solicitaÃ§Ã£o.
O tÃ­tulo deve ser claro, objetivo e Ãºtil para identificar o assunto da conversa.
Responda APENAS com o tÃ­tulo, sem aspas ou formataÃ§Ã£o adicional."""

                user_message = f"Primeira mensagem: {first_message.nm_text[:500]}"

                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ]

                # Gerar tÃ­tulo
                generated_title = await llm.invoke(messages)

                # Limpar e validar o tÃ­tulo gerado
                if generated_title:
                    # Remover quebras de linha e espaÃ§os extras
                    title = (
                        generated_title.strip().replace("\n", " ").replace("\r", " ")
                    )

                    # Limitar tamanho
                    if len(title) > 50:
                        title = title[:47] + "..."

                    # Remover aspas se existirem
                    title = title.strip("\"'")

                    logger.debug(
                        f"TÃ­tulo gerado para conversa {conversation_id}: {title}"
                    )
                    return title

                return None

            except Exception as e:
                logger.error(
                    f"Erro ao gerar tÃ­tulo para conversa {conversation_id}: {str(e)}"
                )
                return None

        return await self._execute_read_only(_generate_title_operation)

    async def auto_update_title_from_first_message(
        self, conversation_id: uuid.UUID
    ) -> Optional[Conversation]:
        """Gerar e atualizar automaticamente o tÃ­tulo baseado na primeira mensagem"""
        try:
            # Verificar se a conversa jÃ¡ tem tÃ­tulo
            conversation = await self.get_conversation_by_id(conversation_id)
            if not conversation:
                logger.warning(f"Conversa nÃ£o encontrada: {conversation_id}")
                return None

            # Se jÃ¡ tem tÃ­tulo, nÃ£o sobrescrever
            if conversation.nm_titulo and conversation.nm_titulo.strip():
                logger.debug(f"Conversa jÃ¡ possui tÃ­tulo: {conversation_id}")
                return conversation

            # Gerar tÃ­tulo
            generated_title = await self.generate_title_from_first_message(
                conversation_id
            )

            if not generated_title:
                logger.debug(
                    f"NÃ£o foi possÃ­vel gerar tÃ­tulo para conversa: {conversation_id}"
                )
                return conversation

            # Atualizar o tÃ­tulo
            conversation_update = ConversationUpdate(
                id_conversa=conversation_id, nm_titulo=generated_title
            )

            updated_conversation = await self.update_conversation(
                conversation_id=conversation_id, conversation_update=conversation_update
            )

            logger.info(
                f"TÃ­tulo atualizado automaticamente para conversa {conversation_id}: {generated_title}"
            )
            return updated_conversation

        except Exception as e:
            logger.error(f"Erro ao atualizar tÃ­tulo automaticamente: {str(e)}")
            return None

    async def generate_summary_from_conversation(
        self, conversation_id: uuid.UUID
    ) -> Optional[str]:
        """Gerar resumo baseado nas mensagens da conversa usando IA"""

        async def _generate_summary_operation(db_session: AsyncSession):
            try:
                # Buscar as mensagens da conversa (limitando a 20 mais recentes)
                stmt = (
                    select(ChatMessage)
                    .where(ChatMessage.id_conversa == conversation_id)
                    .order_by(ChatMessage.dt_criacao.asc())
                    .limit(20)
                )

                result = await db_session.execute(stmt)
                messages = result.scalars().all()

                if not messages:
                    logger.debug(
                        f"Nenhuma mensagem encontrada para gerar resumo: {conversation_id}"
                    )
                    return None

                # Montar contexto da conversa
                conversation_text = []
                for msg in messages:
                    if msg.nm_text and msg.nm_text.strip():
                        role = "UsuÃ¡rio" if msg.nm_tipo == "user" else "Assistente"
                        conversation_text.append(f"{role}: {msg.nm_text[:300]}")

                if not conversation_text:
                    logger.debug(
                        f"Nenhuma mensagem vÃ¡lida encontrada para resumo: {conversation_id}"
                    )
                    return None

                # Configurar LLM para geraÃ§Ã£o de resumo
                llm = AzureOpenAILLM(
                    db_session=db_session,
                    temperature=0.3,
                    max_tokens=150,
                    use_credentials=True,
                )

                # Prompt para gerar resumo conciso
                system_prompt = """VocÃª Ã© um assistente especializado em criar resumos concisos e informativos.
Baseado na conversa fornecida, crie um resumo de no mÃ¡ximo 150 caracteres que capture os principais tÃ³picos e questÃµes discutidas.
O resumo deve ser claro, objetivo e Ãºtil para identificar rapidamente o conteÃºdo da conversa.
Responda APENAS com o resumo, sem aspas ou formataÃ§Ã£o adicional."""

                user_message = (
                    f"Conversa a resumir:\n\n{chr(10).join(conversation_text[:10])}"
                )

                messages_for_llm = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ]

                # Gerar resumo
                generated_summary = await llm.invoke(messages_for_llm)

                # Limpar e validar o resumo gerado
                if generated_summary:
                    # Remover quebras de linha e espaÃ§os extras
                    summary = (
                        generated_summary.strip().replace("\n", " ").replace("\r", " ")
                    )

                    # Limitar tamanho
                    if len(summary) > 150:
                        summary = summary[:147] + "..."

                    # Remover aspas se existirem
                    summary = summary.strip("\"'")

                    logger.debug(
                        f"Resumo gerado para conversa {conversation_id}: {summary}"
                    )
                    return summary

                return None

            except Exception as e:
                logger.error(
                    f"Erro ao gerar resumo para conversa {conversation_id}: {str(e)}"
                )
                return None

        return await self._execute_read_only(_generate_summary_operation)

    async def auto_update_summary_from_conversation(
        self, conversation_id: uuid.UUID
    ) -> Optional[Conversation]:
        """Gerar e atualizar automaticamente o resumo baseado nas mensagens da conversa"""
        try:
            # Verificar se a conversa existe
            conversation = await self.get_conversation_by_id(conversation_id)
            if not conversation:
                logger.warning(f"Conversa nÃ£o encontrada: {conversation_id}")
                return None

            # Se jÃ¡ tem resumo, nÃ£o sobrescrever (pode ser atualizado manualmente se necessÃ¡rio)
            if conversation.ds_resumo and conversation.ds_resumo.strip():
                logger.debug(f"Conversa jÃ¡ possui resumo: {conversation_id}")
                return conversation

            # Gerar resumo
            generated_summary = await self.generate_summary_from_conversation(
                conversation_id
            )

            if not generated_summary:
                logger.debug(
                    f"NÃ£o foi possÃ­vel gerar resumo para conversa: {conversation_id}"
                )
                return conversation

            # Atualizar o resumo
            conversation_update = ConversationUpdate(
                id_conversa=conversation_id, ds_resumo=generated_summary
            )

            updated_conversation = await self.update_conversation(
                conversation_id=conversation_id, conversation_update=conversation_update
            )

            logger.info(
                f"Resumo atualizado automaticamente para conversa {conversation_id}: {generated_summary}"
            )
            return updated_conversation

        except Exception as e:
            logger.error(f"Erro ao atualizar resumo automaticamente: {str(e)}")
            return None

    async def get_user_conversation_stats(self, user_id: Union[uuid.UUID, str]) -> dict:
        """Obter estatÃ­sticas de conversas do usuÃ¡rio"""

        async def _get_stats_operation(db_session: AsyncSession):
            try:
                # Converter user_id se necessÃ¡rio
                user_uuid_filter = user_id
                if isinstance(user_id, str):
                    try:
                        user_uuid_filter = uuid.UUID(user_id)
                    except ValueError:
                        logger.warning(
                            f"ID de usuÃ¡rio invÃ¡lido (nÃ£o Ã© UUID): {user_id}"
                        )
                        return {
                            "total_conversations": 0,
                            "active_conversations": 0,
                            "total_messages": 0,
                            "average_messages_per_conversation": 0,
                            "conversations_this_month": 0,
                            "conversations_this_week": 0,
                        }

                # Consulta base para conversas do usuÃ¡rio
                base_filter = Conversation.id_usuario == user_uuid_filter

                # Total de conversas
                total_stmt = select(func.count(Conversation.id_conversa)).where(
                    base_filter
                )
                total_result = await db_session.execute(total_stmt)
                total_conversations = total_result.scalar() or 0

                # Conversas ativas
                active_stmt = select(func.count(Conversation.id_conversa)).where(
                    and_(base_filter, Conversation.st_ativa == "S")
                )
                active_result = await db_session.execute(active_stmt)
                active_conversations = active_result.scalar() or 0

                # Total de mensagens
                total_messages_stmt = select(func.sum(Conversation.qt_mensagens)).where(
                    base_filter
                )
                total_messages_result = await db_session.execute(total_messages_stmt)
                total_messages = total_messages_result.scalar() or 0

                # MÃ©dia de mensagens por conversa
                average_messages = (
                    round(total_messages / total_conversations, 1)
                    if total_conversations > 0
                    else 0
                )

                # Conversas deste mÃªs
                from datetime import timedelta

                one_month_ago = datetime.now() - timedelta(days=30)
                month_stmt = select(func.count(Conversation.id_conversa)).where(
                    and_(base_filter, Conversation.dt_criacao >= one_month_ago)
                )
                month_result = await db_session.execute(month_stmt)
                conversations_this_month = month_result.scalar() or 0

                # Conversas desta semana
                one_week_ago = datetime.now() - timedelta(days=7)
                week_stmt = select(func.count(Conversation.id_conversa)).where(
                    and_(base_filter, Conversation.dt_criacao >= one_week_ago)
                )
                week_result = await db_session.execute(week_stmt)
                conversations_this_week = week_result.scalar() or 0

                return {
                    "total_conversations": total_conversations,
                    "active_conversations": active_conversations,
                    "total_messages": total_messages,
                    "average_messages_per_conversation": average_messages,
                    "conversations_this_month": conversations_this_month,
                    "conversations_this_week": conversations_this_week,
                }

            except Exception as e:
                logger.error(f"Erro ao obter estatÃ­sticas do usuÃ¡rio: {str(e)}")
                return {
                    "total_conversations": 0,
                    "active_conversations": 0,
                    "total_messages": 0,
                    "average_messages_per_conversation": 0,
                    "conversations_this_month": 0,
                    "conversations_this_week": 0,
                }

        return await self._execute_read_only(_get_stats_operation)


def get_conversation_service() -> ConversationService:
    """Factory function para criar instÃ¢ncia do ConversationService"""
    return ConversationService()
