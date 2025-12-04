# src/agents/base_agent.py
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.llms.azure_openai import AzureOpenAILLM

logger = get_logger(__name__)


class BaseCustomAgent(ABC):
    """
    Classe base para agentes customizados sem tools e sem memÃ³ria.
    Focada em operaÃ§Ãµes especÃ­ficas com integraÃ§Ã£o ao Langfuse.
    """

    def __init__(
        self,
        agent_name: str,
        db_session: Optional[AsyncSession] = None,
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
    ):
        """
        Inicializar agente customizado

        Args:
            agent_name: Nome do agente para identificaÃ§Ã£o
            db_session: SessÃ£o do banco de dados
            temperature: Temperatura para geraÃ§Ã£o
            max_tokens: MÃ¡ximo de tokens na resposta
        """
        self.agent_name = agent_name
        self.db_session = db_session
        self.temperature = temperature
        self.max_tokens = max_tokens

        # LLM serÃ¡ inicializado quando necessÃ¡rio
        self.llm = None

    async def _get_custom_agent_credential_id(self) -> Optional[str]:
        """Obter ID da credencial especÃ­fica para Custom Agent do banco de dados"""
        if not self.db_session:
            logger.warning("SessÃ£o do banco nÃ£o fornecida, usando credencial padrÃ£o")
            return None
        try:
            from src.services.variable_service import VariableService

            variable_service = VariableService(self.db_session)
            variable = await variable_service.get_variable_by_name(
                "AZURE_OPENIA_CHAT_CREDENCIAL_ID_AGENT_CUSTOM"
            )

            if variable and variable.vl_variavel:
                return variable.vl_variavel

            logger.debug(
                "VariÃ¡vel AZURE_OPENIA_CHAT_CREDENCIAL_ID_AGENT_CUSTOM nÃ£o encontrada, usando credencial padrÃ£o"
            )
            return None
        except Exception as e:
            logger.warning(f"Erro ao buscar credencial customizada: {str(e)}")
            return None

    async def _get_llm(self) -> AzureOpenAILLM:
        """Obter instÃ¢ncia do LLM configurado"""
        if not self.llm:
            # Obter ID da credencial customizada
            custom_credential_id = await self._get_custom_agent_credential_id()

            self.llm = AzureOpenAILLM(
                db_session=self.db_session,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                use_credentials=True,
                id_credencial=custom_credential_id,
            )
        return self.llm

    @abstractmethod
    def get_system_prompt(self) -> str:
        """
        Retorna o prompt do sistema especÃ­fico para este agente
        Deve ser implementado por cada agente customizado
        """
        raise NotImplementedError("MÃ©todo deve ser implementado pela subclasse")

    @abstractmethod
    def format_user_prompt(self, **kwargs) -> str:
        """
        Formata o prompt do usuÃ¡rio com os dados especÃ­ficos
        Deve ser implementado por cada agente customizado
        """
        raise NotImplementedError("MÃ©todo deve ser implementado pela subclasse")

    async def invoke(self, **kwargs) -> str:
        """
        Invocar o agente com os parÃ¢metros especÃ­ficos

        Args:
            **kwargs: ParÃ¢metros especÃ­ficos para cada tipo de agente

        Returns:
            Resposta do agente como string
        """
        try:
            logger.debug(f"Invocando agente {self.agent_name}")

            # Obter LLM
            llm = await self._get_llm()

            # Preparar mensagens
            system_prompt = self.get_system_prompt()

            # Verificar se format_user_prompt estÃ¡ implementado
            try:
                user_prompt = self.format_user_prompt(**kwargs)
            except NotImplementedError:
                # Se nÃ£o implementado, usar prompt padrÃ£o
                user_prompt = (
                    "Execute a tarefa solicitada com base no contexto fornecido."
                )

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]

            # Invocar LLM diretamente
            response = await llm.invoke(messages)

            logger.debug(f"Agente {self.agent_name} executado com sucesso")
            return response.strip()

        except Exception as e:
            logger.error(f"Erro ao executar agente {self.agent_name}: {str(e)}")
            return self._get_fallback_response(**kwargs)

    @abstractmethod
    def _get_fallback_response(self, **kwargs) -> str:
        """
        Resposta de fallback em caso de erro
        Deve ser implementado por cada agente customizado
        """
        raise NotImplementedError("MÃ©todo deve ser implementado pela subclasse")

    def get_agent_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes sobre o agente"""
        return {
            "name": self.agent_name,
            "type": "custom_agent",
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "has_tools": False,
            "has_memory": False,
        }
