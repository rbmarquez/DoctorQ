# src/llms/azure_openai.py
import uuid
from typing import Any, Dict, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import AzureChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.services.credencial_service import CredencialService
from src.services.variable_service import VariableService

logger = get_logger(__name__)


class AzureOpenAILLM:
    """
    Classe para configurar e gerenciar o Azure OpenAI com LangChain
    Integrada com sistema de credenciais para configuraÃ§Ã£o dinÃ¢mica

    Carrega automaticamente o ID da credencial da variÃ¡vel 'AZURE_OPENIA_CHAT_CREDENCIAL_ID'
    """

    def __init__(
        self,
        db_session: Optional[AsyncSession] = None,
        azure_endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        api_version: Optional[str] = None,
        deployment_name: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        use_credentials: bool = True,
        id_credencial: Optional[str] = None,
        **kwargs,
    ):
        """
        Inicializa a configuraÃ§Ã£o do Azure OpenAI

        Args:
            db_session: SessÃ£o do banco de dados para buscar credenciais e variÃ¡veis
            azure_endpoint: Endpoint do Azure OpenAI
            api_key: Chave da API
            api_version: VersÃ£o da API
            deployment_name: Nome do deployment no Azure
            model_name: Nome do modelo (ex: gpt-4, gpt-35-turbo)
            temperature: Temperatura para geraÃ§Ã£o de texto (0.0 a 2.0)
            max_tokens: NÃºmero mÃ¡ximo de tokens na resposta
            use_credentials: Se deve usar o sistema de credenciais
            id_credencial: ID da credencial opcional (usado como fallback se variÃ¡vel nÃ£o existir)

        Nota: O ID da credencial serÃ¡ buscado na variÃ¡vel 'AZURE_OPENIA_CHAT_CREDENCIAL_ID'
        """

        # ConfiguraÃ§Ã£o do service de credenciais
        self.db_session = db_session
        self.credential_service = None
        self.variable_service = None
        self.use_credentials = use_credentials
        self.id_credencial = id_credencial

        if self.db_session and self.use_credentials:
            self.credential_service = CredencialService()
            self.variable_service = VariableService(self.db_session)

        # ConfiguraÃ§Ãµes iniciais (podem ser sobrescritas pelas credenciais)
        self.azure_endpoint = azure_endpoint
        self.api_key = api_key
        self.api_version = api_version or "2024-02-01"
        self.deployment_name = deployment_name
        self.model_name = model_name or "gpt-4"
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.additional_kwargs = kwargs

        # Controle de inicializaÃ§Ã£o
        self.config_loaded = False
        self.llm = None

    async def _load_credential_config(self):
        """Carrega configuraÃ§Ãµes da credencial do banco de dados"""
        if not self.credential_service or not self.variable_service:
            logger.warning("Services de credenciais ou variÃ¡veis nÃ£o disponÃ­veis")
            return

        try:
            # Buscar ID da credencial na variÃ¡vel
            variable = await self.variable_service.get_variable_by_vl_variavel(
                "AZURE_OPENIA_CHAT_CREDENCIAL_ID"
            )

            if variable:
                credencial_id = uuid.UUID(variable.vl_variavel)
            elif self.id_credencial:
                credencial_id = uuid.UUID(self.id_credencial)
            else:
                logger.error("Nenhuma credencial configurada")
                return

            # Buscar e carregar dados da credencial
            credencial_data = await self.credential_service.get_credencial_decrypted(
                credencial_id
            )
            if not credencial_data:
                logger.warning(f"Credencial nÃ£o encontrada: {credencial_id}")
                return

            dados = credencial_data.get("dados", {})

            # Mapear configuraÃ§Ãµes
            config_map = {
                "azure_endpoint": ["azure_endpoint", "endpoint"],
                "api_key": ["api_key"],
                "api_version": ["api_version"],
                "deployment_name": ["deployment_name"],
                "model_name": ["model_name"],
            }

            for attr, keys in config_map.items():
                for key in keys:
                    if key in dados:
                        setattr(self, attr, dados[key])
                        break

            # ConfiguraÃ§Ãµes numÃ©ricas com validaÃ§Ã£o
            if "temperature" in dados:
                try:
                    self.temperature = float(dados["temperature"])
                except (ValueError, TypeError):
                    logger.warning("Valor invÃ¡lido para temperature na credencial")

            if "max_tokens" in dados:
                try:
                    self.max_tokens = int(dados["max_tokens"])
                except (ValueError, TypeError):
                    logger.warning("Valor invÃ¡lido para max_tokens na credencial")

            self.config_loaded = True
            logger.debug("ConfiguraÃ§Ãµes do Azure OpenAI carregadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao carregar configuraÃ§Ãµes da credencial: {str(e)}")
            self.config_loaded = True

    def _validate_config(self):
        """Valida se todas as configuraÃ§Ãµes obrigatÃ³rias estÃ£o presentes"""
        required_configs = {
            "azure_endpoint": self.azure_endpoint,
            "api_key": self.api_key,
            "deployment_name": self.deployment_name,
        }

        missing_configs = [key for key, value in required_configs.items() if not value]

        if missing_configs:
            raise ValueError(
                f"ConfiguraÃ§Ãµes obrigatÃ³rias nÃ£o encontradas: {', '.join(missing_configs)}. "
                "Verifique a credencial no banco de dados."
            )

    async def _initialize_llm(self) -> AzureChatOpenAI:
        """Inicializa o modelo Azure OpenAI com LangChain"""
        try:
            # Carregar configuraÃ§Ãµes se ainda nÃ£o carregou
            if not self.config_loaded:
                if self.use_credentials and self.credential_service:
                    await self._load_credential_config()
                else:
                    self.config_loaded = True

            # Validar configuraÃ§Ãµes
            self._validate_config()

            # Configurar o modelo
            llm_config = {
                "azure_endpoint": self.azure_endpoint,
                "api_key": self.api_key,
                "api_version": self.api_version,
                "azure_deployment": self.deployment_name,
                "model": self.model_name,
                "temperature": self.temperature,
                **self.additional_kwargs,
            }

            if self.max_tokens:
                llm_config["max_tokens"] = self.max_tokens

            llm = AzureChatOpenAI(**llm_config)

            logger.debug("Azure OpenAI LLM inicializado com sucesso")

            return llm

        except Exception as e:
            logger.error(f"Erro ao inicializar Azure OpenAI LLM: {str(e)}")
            raise

    async def get_llm(self) -> AzureChatOpenAI:
        """Retorna a instÃ¢ncia do LLM configurado"""
        if not self.llm:
            self.llm = await self._initialize_llm()
        return self.llm

    async def reload_config(self):
        """Recarrega configuraÃ§Ãµes da credencial e reinicializa o LLM"""
        try:
            logger.debug("Recarregando configuraÃ§Ãµes do Azure OpenAI")
            self.config_loaded = False
            self.llm = None
            await self.get_llm()
            logger.debug("ConfiguraÃ§Ãµes recarregadas com sucesso")
        except Exception as e:
            logger.error(f"Erro ao recarregar configuraÃ§Ãµes: {str(e)}")
            raise

    async def invoke(self, messages: list, **kwargs) -> str:
        """
        Invoca o modelo com uma lista de mensagens

        Args:
            messages: Lista de mensagens (pode ser strings ou objetos BaseMessage)
            **kwargs: ParÃ¢metros adicionais para a invocaÃ§Ã£o

        Returns:
            Resposta do modelo como string
        """
        try:
            llm = await self.get_llm()

            # Converter strings para objetos de mensagem se necessÃ¡rio
            formatted_messages = []
            for msg in messages:
                if isinstance(msg, str):
                    formatted_messages.append(HumanMessage(content=msg))
                elif isinstance(msg, dict):
                    if msg.get("role") == "system":
                        formatted_messages.append(SystemMessage(content=msg["content"]))
                    else:
                        formatted_messages.append(HumanMessage(content=msg["content"]))
                else:
                    formatted_messages.append(msg)

            # Separar callbacks dos outros kwargs para evitar conflitos
            callbacks = kwargs.pop("callbacks", None)

            # Invocar com ou sem callbacks dependendo do que foi fornecido
            if callbacks:
                response = await llm.ainvoke(
                    formatted_messages, callbacks=callbacks, **kwargs
                )
            else:
                response = await llm.ainvoke(formatted_messages, **kwargs)

            # response.content pode ser str ou lista
            content = response.content
            if isinstance(content, list):
                # Se for lista, concatenar todos os elementos em string
                return " ".join(str(item) for item in content)
            return str(content)

        except Exception as e:
            logger.error(f"Erro ao invocar Azure OpenAI: {str(e)}")
            raise

    async def stream(self, messages: list, **kwargs):
        """
        Stream de resposta do modelo

        Args:
            messages: Lista de mensagens
            **kwargs: ParÃ¢metros adicionais

        Yields:
            Chunks da resposta do modelo
        """
        try:
            llm = await self.get_llm()

            # Converter strings para objetos de mensagem se necessÃ¡rio
            formatted_messages = []
            for msg in messages:
                if isinstance(msg, str):
                    formatted_messages.append(HumanMessage(content=msg))
                elif isinstance(msg, dict):
                    if msg.get("role") == "system":
                        formatted_messages.append(SystemMessage(content=msg["content"]))
                    else:
                        formatted_messages.append(HumanMessage(content=msg["content"]))
                else:
                    formatted_messages.append(msg)

            async for chunk in llm.astream(formatted_messages, **kwargs):
                if hasattr(chunk, "content") and chunk.content:
                    yield chunk.content

        except Exception as e:
            logger.error(f"Erro no stream do Azure OpenAI: {str(e)}")
            raise

    async def update_config(self, **kwargs):
        """
        Atualiza configuraÃ§Ãµes do modelo

        Args:
            **kwargs: Novos parÃ¢metros de configuraÃ§Ã£o
        """
        try:
            # Atualizar configuraÃ§Ãµes locais
            for key, value in kwargs.items():
                if hasattr(self, key):
                    setattr(self, key, value)

            # Reinicializar o modelo
            self.llm = None
            await self.get_llm()

            logger.debug("ConfiguraÃ§Ãµes do Azure OpenAI atualizadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao atualizar configuraÃ§Ãµes: {str(e)}")
            raise

    def get_model_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes sobre o modelo configurado"""
        return {
            "azure_endpoint": self.azure_endpoint,
            "deployment_name": self.deployment_name,
            "model_name": self.model_name,
            "api_version": self.api_version,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "use_credentials": self.use_credentials,
            "credential_name": self.id_credencial,
            "config_loaded": self.config_loaded,
        }


# Factory function para criar instÃ¢ncias facilmente
async def create_azure_openai_llm(
    db_session: Optional[AsyncSession] = None,
    deployment_name: Optional[str] = None,
    model_name: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    use_credentials: bool = True,
    credential_name: str = "azureOpenIaChatApi",
    **kwargs,
) -> AzureOpenAILLM:
    """
    Factory function para criar uma instÃ¢ncia do Azure OpenAI LLM

    Args:
        db_session: SessÃ£o do banco de dados
        deployment_name: Nome do deployment no Azure
        model_name: Nome do modelo
        temperature: Temperatura para geraÃ§Ã£o
        max_tokens: MÃ¡ximo de tokens
        use_credentials: Se deve usar sistema de credenciais
        credential_name: Nome da credencial a ser buscada
        **kwargs: ParÃ¢metros adicionais

    Returns:
        InstÃ¢ncia configurada do AzureOpenAILLM
    """
    llm = AzureOpenAILLM(
        db_session=db_session,
        deployment_name=deployment_name,
        model_name=model_name,
        temperature=temperature,
        max_tokens=max_tokens,
        use_credentials=use_credentials,
        credential_name=credential_name,
        **kwargs,
    )

    # Inicializar configuraÃ§Ãµes
    await llm.get_llm()
    return llm


# ConfiguraÃ§Ãµes prÃ©-definidas para diferentes cenÃ¡rios
class AzureOpenAIPresets:
    """Presets comuns para diferentes casos de uso"""

    @staticmethod
    async def chat_assistant(
        db_session: Optional[AsyncSession] = None,
        deployment_name: Optional[str] = None,
        use_credentials: bool = True,
        credential_name: str = "azureOpenIaChatApi",
    ) -> AzureOpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para assistente de chat"""
        return await create_azure_openai_llm(
            db_session=db_session,
            deployment_name=deployment_name,
            temperature=0.7,
            max_tokens=2000,
            use_credentials=use_credentials,
            credential_name=credential_name,
        )

    @staticmethod
    async def embedding_assistant(
        db_session: Optional[AsyncSession] = None,
        deployment_name: Optional[str] = None,
        use_credentials: bool = True,
        credential_name: str = "azureOpenIaEmbedApi",
    ) -> AzureOpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para embeddings"""
        return await create_azure_openai_llm(
            db_session=db_session,
            deployment_name=deployment_name,
            temperature=0.0,
            max_tokens=None,
            use_credentials=use_credentials,
            credential_name=credential_name,
        )

    @staticmethod
    async def code_assistant(
        db_session: Optional[AsyncSession] = None,
        deployment_name: Optional[str] = None,
        use_credentials: bool = True,
        credential_name: str = "azureOpenIaChatApi",
    ) -> AzureOpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para assistente de cÃ³digo"""
        return await create_azure_openai_llm(
            db_session=db_session,
            deployment_name=deployment_name,
            temperature=0.1,
            max_tokens=4000,
            use_credentials=use_credentials,
            credential_name=credential_name,
        )

    @staticmethod
    async def creative_writing(
        db_session: Optional[AsyncSession] = None,
        deployment_name: Optional[str] = None,
        use_credentials: bool = True,
        credential_name: str = "azureOpenIaChatApi",
    ) -> AzureOpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para escrita criativa"""
        return await create_azure_openai_llm(
            db_session=db_session,
            deployment_name=deployment_name,
            temperature=0.9,
            max_tokens=3000,
            use_credentials=use_credentials,
            credential_name=credential_name,
        )

    @staticmethod
    async def analytical(
        db_session: Optional[AsyncSession] = None,
        deployment_name: Optional[str] = None,
        use_credentials: bool = True,
        credential_name: str = "azureOpenIaChatApi",
    ) -> AzureOpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para anÃ¡lise e raciocÃ­nio"""
        return await create_azure_openai_llm(
            db_session=db_session,
            deployment_name=deployment_name,
            temperature=0.3,
            max_tokens=2500,
            use_credentials=use_credentials,
            credential_name=credential_name,
        )
