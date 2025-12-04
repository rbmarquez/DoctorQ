# app/llms/openai.py

import logging
import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

# Carregar variÃ¡veis de ambiente
load_dotenv()

# Configurar logger
logger = logging.getLogger(__name__)


class OpenAILLM:
    """
    Classe para configurar e gerenciar o OpenAI com LangChain
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gpt-4",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        base_url: Optional[str] = None,
        organization: Optional[str] = None,
        **kwargs,
    ):
        """
        Inicializa a configuraÃ§Ã£o do OpenAI

        Args:
            api_key: Chave da API OpenAI
            model_name: Nome do modelo (ex: gpt-4, gpt-3.5-turbo, gpt-4-turbo)
            temperature: Temperatura para geraÃ§Ã£o de texto (0.0 a 2.0)
            max_tokens: NÃºmero mÃ¡ximo de tokens na resposta
            base_url: URL base customizada (opcional)
            organization: ID da organizaÃ§Ã£o (opcional)
        """

        # ConfiguraÃ§Ãµes do OpenAI
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model_name = model_name or os.getenv("OPENAI_MODEL_NAME", "gpt-4")
        self.base_url = base_url or os.getenv("OPENAI_BASE_URL")
        self.organization = organization or os.getenv("OPENAI_ORGANIZATION")

        # ParÃ¢metros do modelo
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.additional_kwargs = kwargs

        # Validar configuraÃ§Ãµes obrigatÃ³rias
        self._validate_config()

        # Inicializar o modelo
        self.llm = self._initialize_llm()

    def _validate_config(self):
        """Valida se todas as configuraÃ§Ãµes obrigatÃ³rias estÃ£o presentes"""
        required_configs = {
            "api_key": self.api_key,
        }

        missing_configs = [key for key, value in required_configs.items() if not value]

        if missing_configs:
            raise ValueError(
                f"ConfiguraÃ§Ãµes obrigatÃ³rias nÃ£o encontradas: {', '.join(missing_configs)}. "
                f"Verifique as variÃ¡veis de ambiente ou passe os parÃ¢metros diretamente."
            )

    def _initialize_llm(self) -> ChatOpenAI:
        """Inicializa o modelo OpenAI com LangChain"""
        try:
            llm_config = {
                "api_key": self.api_key,
                "model": self.model_name,
                "temperature": self.temperature,
                **self.additional_kwargs,
            }

            if self.max_tokens:
                llm_config["max_tokens"] = self.max_tokens

            if self.base_url:
                llm_config["base_url"] = self.base_url

            if self.organization:
                llm_config["organization"] = self.organization

            llm = ChatOpenAI(**llm_config)

            logger.debug(
                f"OpenAI LLM inicializado com sucesso. Modelo: {self.model_name}"
            )
            return llm

        except Exception as e:
            logger.error(f"Erro ao inicializar OpenAI LLM: {str(e)}")
            raise

    def get_llm(self) -> ChatOpenAI:
        """Retorna a instÃ¢ncia do LLM configurado"""
        return self.llm

    def invoke(self, messages: list, **kwargs) -> str:
        """
        Invoca o modelo com uma lista de mensagens

        Args:
            messages: Lista de mensagens (pode ser strings ou objetos BaseMessage)
            **kwargs: ParÃ¢metros adicionais para a invocaÃ§Ã£o

        Returns:
            Resposta do modelo como string
        """
        try:
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

            response = self.llm.invoke(formatted_messages, **kwargs)
            if isinstance(response.content, list):
                return "\n".join(
                    (
                        item["content"]
                        if isinstance(item, dict) and "content" in item
                        else str(item)
                    )
                    for item in response.content
                )
            return response.content

        except Exception as e:
            logger.error(f"Erro ao invocar OpenAI: {str(e)}")
            raise

    def stream(self, messages: list, **kwargs):
        """
        Stream de resposta do modelo

        Args:
            messages: Lista de mensagens
            **kwargs: ParÃ¢metros adicionais

        Yields:
            Chunks da resposta do modelo
        """
        try:
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

            for chunk in self.llm.stream(formatted_messages, **kwargs):
                if hasattr(chunk, "content") and chunk.content:
                    yield chunk.content

        except Exception as e:
            logger.error(f"Erro no stream do OpenAI: {str(e)}")
            raise

    def update_config(self, **kwargs):
        """
        Atualiza configuraÃ§Ãµes do modelo

        Args:
            **kwargs: Novos parÃ¢metros de configuraÃ§Ã£o
        """
        try:
            if "temperature" in kwargs:
                self.temperature = kwargs["temperature"]
            if "max_tokens" in kwargs:
                self.max_tokens = kwargs["max_tokens"]
            if "model_name" in kwargs:
                self.model_name = kwargs["model_name"]

            # Reinicializar o modelo com as novas configuraÃ§Ãµes
            self.llm = self._initialize_llm()
            logger.debug("ConfiguraÃ§Ãµes do OpenAI atualizadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao atualizar configuraÃ§Ãµes: {str(e)}")
            raise

    def get_model_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes sobre o modelo configurado"""
        return {
            "model_name": self.model_name,
            "base_url": self.base_url,
            "organization": self.organization,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "provider": "openai",
        }


# Factory function para criar instÃ¢ncias facilmente
def create_openai_llm(
    api_key: Optional[str] = None,
    model_name: str = "gpt-4",
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    **kwargs,
) -> OpenAILLM:
    """
    Factory function para criar uma instÃ¢ncia do OpenAI LLM

    Args:
        api_key: Chave da API OpenAI
        model_name: Nome do modelo
        temperature: Temperatura para geraÃ§Ã£o
        max_tokens: MÃ¡ximo de tokens
        **kwargs: ParÃ¢metros adicionais

    Returns:
        InstÃ¢ncia configurada do OpenAILLM
    """
    return OpenAILLM(
        api_key=api_key,
        model_name=model_name,
        temperature=temperature,
        max_tokens=max_tokens,
        **kwargs,
    )


# ConfiguraÃ§Ãµes prÃ©-definidas para diferentes cenÃ¡rios
class OpenAIPresets:
    """Presets comuns para diferentes casos de uso"""

    @staticmethod
    def chat_assistant(model_name: str = "gpt-4") -> OpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para assistente de chat"""
        return create_openai_llm(
            model_name=model_name, temperature=0.7, max_tokens=2000
        )

    @staticmethod
    def code_assistant(model_name: str = "gpt-4") -> OpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para assistente de cÃ³digo"""
        return create_openai_llm(
            model_name=model_name, temperature=0.1, max_tokens=4000
        )

    @staticmethod
    def creative_writing(model_name: str = "gpt-4") -> OpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para escrita criativa"""
        return create_openai_llm(
            model_name=model_name, temperature=0.9, max_tokens=3000
        )

    @staticmethod
    def analytical(model_name: str = "gpt-4") -> OpenAILLM:
        """ConfiguraÃ§Ã£o otimizada para anÃ¡lise e raciocÃ­nio"""
        return create_openai_llm(
            model_name=model_name, temperature=0.3, max_tokens=2500
        )

    @staticmethod
    def gpt_3_5_turbo() -> OpenAILLM:
        """ConfiguraÃ§Ã£o com GPT-3.5 Turbo (mais econÃ´mico)"""
        return create_openai_llm(
            model_name="gpt-3.5-turbo", temperature=0.7, max_tokens=2000
        )

    @staticmethod
    def gpt_4_turbo() -> OpenAILLM:
        """ConfiguraÃ§Ã£o com GPT-4 Turbo (mais rÃ¡pido)"""
        return create_openai_llm(
            model_name="gpt-4-turbo", temperature=0.7, max_tokens=4000
        )

    @staticmethod
    def gpt_4o() -> OpenAILLM:
        """ConfiguraÃ§Ã£o com GPT-4o (mais recente)"""
        return create_openai_llm(model_name="gpt-4o", temperature=0.7, max_tokens=4000)

    @staticmethod
    def gpt_4o_mini() -> OpenAILLM:
        """ConfiguraÃ§Ã£o com GPT-4o Mini (econÃ´mico e rÃ¡pido)"""
        return create_openai_llm(
            model_name="gpt-4o-mini", temperature=0.7, max_tokens=2000
        )


# Classe para gerenciar mÃºltiplos modelos
class OpenAIModelManager:
    """Gerenciador para mÃºltiplos modelos OpenAI"""

    def __init__(self):
        self.models = {}
        self.default_model = None

    def add_model(self, name: str, llm: OpenAILLM, set_as_default: bool = False):
        """Adicionar um modelo ao gerenciador"""
        self.models[name] = llm
        if set_as_default or not self.default_model:
            self.default_model = name

    def get_model(self, name: Optional[str] = None) -> OpenAILLM:
        """Obter um modelo por nome ou o padrÃ£o"""
        model_name = name or self.default_model
        if model_name not in self.models:
            raise ValueError(f"Modelo '{model_name}' nÃ£o encontrado")
        return self.models[model_name]

    def list_models(self) -> list:
        """Listar modelos disponÃ­veis"""
        return list(self.models.keys())

    def set_default(self, name: str):
        """Definir modelo padrÃ£o"""
        if name not in self.models:
            raise ValueError(f"Modelo '{name}' nÃ£o encontrado")
        self.default_model = name

    def remove_model(self, name: str):
        """Remover um modelo"""
        if name in self.models:
            del self.models[name]
            if self.default_model == name:
                self.default_model = (
                    list(self.models.keys())[0] if self.models else None
                )


# ConfiguraÃ§Ãµes de modelos mais comuns
class CommonModels:
    """ConfiguraÃ§Ãµes rÃ¡pidas para modelos comuns"""

    @staticmethod
    def get_fastest() -> OpenAILLM:
        """Modelo mais rÃ¡pido (GPT-4o Mini)"""
        return OpenAIPresets.gpt_4o_mini()

    @staticmethod
    def get_cheapest() -> OpenAILLM:
        """Modelo mais barato (GPT-3.5 Turbo)"""
        return OpenAIPresets.gpt_3_5_turbo()

    @staticmethod
    def get_smartest() -> OpenAILLM:
        """Modelo mais inteligente (GPT-4)"""
        return OpenAIPresets.chat_assistant("gpt-4")

    @staticmethod
    def get_balanced() -> OpenAILLM:
        """Modelo balanceado (GPT-4o)"""
        return OpenAIPresets.gpt_4o()
