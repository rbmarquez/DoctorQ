# app/llms/ollama.py

import logging
import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

# Carregar variÃ¡veis de ambiente
load_dotenv()

# Configurar logger
logger = logging.getLogger(__name__)


class OllamaLLM:
    """
    Classe para configurar e gerenciar o Ollama com LangChain
    """

    def __init__(
        self,
        model_name: str = "llama2",
        base_url: str = "http://localhost:11434",
        temperature: float = 0.7,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        num_predict: Optional[int] = None,
        repeat_penalty: Optional[float] = None,
        timeout: int = 60,
        **kwargs,
    ):
        """
        Inicializa a configuraÃ§Ã£o do Ollama

        Args:
            model_name: Nome do modelo Ollama (ex: llama2, codellama, mistral)
            base_url: URL base do servidor Ollama
            temperature: Temperatura para geraÃ§Ã£o de texto (0.0 a 2.0)
            top_p: Nucleus sampling parameter
            top_k: Top-k sampling parameter
            num_predict: NÃºmero mÃ¡ximo de tokens para gerar
            repeat_penalty: Penalidade para repetiÃ§Ã£o
            timeout: Timeout para requisiÃ§Ãµes em segundos
        """

        # ConfiguraÃ§Ãµes do Ollama
        self.model_name = model_name or os.getenv("OLLAMA_MODEL_NAME", "llama2")
        self.base_url = base_url or os.getenv(
            "OLLAMA_BASE_URL", "http://localhost:11434"
        )

        # ParÃ¢metros do modelo
        self.temperature = temperature
        self.top_p = top_p
        self.top_k = top_k
        self.num_predict = num_predict
        self.repeat_penalty = repeat_penalty
        self.timeout = timeout
        self.additional_kwargs = kwargs

        # Validar configuraÃ§Ãµes
        self._validate_config()

        # Inicializar o modelo
        self.llm = self._initialize_llm()

    def _validate_config(self):
        """Valida se todas as configuraÃ§Ãµes obrigatÃ³rias estÃ£o presentes"""
        # Verificar se o servidor Ollama estÃ¡ acessÃ­vel
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code != 200:
                raise ValueError(f"Servidor Ollama nÃ£o acessÃ­vel em {self.base_url}")
        except requests.RequestException as e:
            raise ValueError(
                f"NÃ£o foi possÃ­vel conectar ao Ollama em {self.base_url}: {str(e)}"
            )

        # Verificar se o modelo estÃ¡ disponÃ­vel
        if not self._check_model_available():
            logger.warning(
                f"Modelo '{self.model_name}' nÃ£o encontrado. Tentando baixar..."
            )
            if not self._pull_model():
                raise ValueError(
                    f"Modelo '{self.model_name}' nÃ£o disponÃ­vel e falha ao baixar"
                )

    def _check_model_available(self) -> bool:
        """Verifica se o modelo estÃ¡ disponÃ­vel localmente"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json()
                model_names = [
                    model["name"].split(":")[0] for model in models.get("models", [])
                ]
                return self.model_name.split(":")[0] in model_names
            return False
        except Exception as e:
            logger.error(f"Erro ao verificar modelos disponÃ­veis: {str(e)}")
            return False

    def _pull_model(self) -> bool:
        """Tenta baixar o modelo do Ollama"""
        try:
            logger.info(f"Baixando modelo {self.model_name}...")
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": self.model_name},
                timeout=300,  # 5 minutos para download
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Erro ao baixar modelo: {str(e)}")
            return False

    def _initialize_llm(self) -> ChatOllama:
        """Inicializa o modelo Ollama com LangChain"""
        try:
            llm_config = {
                "model": self.model_name,
                "base_url": self.base_url,
                "temperature": self.temperature,
                "timeout": self.timeout,
                **self.additional_kwargs,
            }

            # Adicionar parÃ¢metros opcionais se fornecidos
            if self.top_p is not None:
                llm_config["top_p"] = self.top_p
            if self.top_k is not None:
                llm_config["top_k"] = self.top_k
            if self.num_predict is not None:
                llm_config["num_predict"] = self.num_predict
            if self.repeat_penalty is not None:
                llm_config["repeat_penalty"] = self.repeat_penalty

            llm = ChatOllama(**llm_config)

            logger.info(
                f"Ollama LLM inicializado com sucesso. Modelo: {self.model_name}"
            )
            return llm

        except Exception as e:
            logger.error(f"Erro ao inicializar Ollama LLM: {str(e)}")
            raise

    def get_llm(self) -> ChatOllama:
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
            # response.content pode ser str ou lista
            content = response.content
            if isinstance(content, list):
                # Se for lista, concatenar todos os elementos em string
                return " ".join(str(item) for item in content)
            return str(content)

        except Exception as e:
            logger.error(f"Erro ao invocar Ollama: {str(e)}")
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
            logger.error(f"Erro no stream do Ollama: {str(e)}")
            raise

    def update_config(self, **kwargs):
        """
        Atualiza configuraÃ§Ãµes do modelo

        Args:
            **kwargs: Novos parÃ¢metros de configuraÃ§Ã£o
        """
        try:
            config_updated = False

            if "temperature" in kwargs:
                self.temperature = kwargs["temperature"]
                config_updated = True
            if "model_name" in kwargs:
                self.model_name = kwargs["model_name"]
                config_updated = True
            if "top_p" in kwargs:
                self.top_p = kwargs["top_p"]
                config_updated = True
            if "top_k" in kwargs:
                self.top_k = kwargs["top_k"]
                config_updated = True
            if "num_predict" in kwargs:
                self.num_predict = kwargs["num_predict"]
                config_updated = True
            if "repeat_penalty" in kwargs:
                self.repeat_penalty = kwargs["repeat_penalty"]
                config_updated = True

            if config_updated:
                # Reinicializar o modelo com as novas configuraÃ§Ãµes
                self.llm = self._initialize_llm()
                logger.info("ConfiguraÃ§Ãµes do Ollama atualizadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao atualizar configuraÃ§Ãµes: {str(e)}")
            raise

    def get_model_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes sobre o modelo configurado"""
        return {
            "model_name": self.model_name,
            "base_url": self.base_url,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "top_k": self.top_k,
            "num_predict": self.num_predict,
            "repeat_penalty": self.repeat_penalty,
            "timeout": self.timeout,
            "provider": "ollama",
        }

    def get_available_models(self) -> List[str]:
        """Retorna lista de modelos disponÃ­veis no servidor Ollama"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json()
                return [model["name"] for model in models.get("models", [])]
            return []
        except Exception as e:
            logger.error(f"Erro ao obter modelos disponÃ­veis: {str(e)}")
            return []

    def pull_model(self, model_name: str) -> bool:
        """Baixar um modelo especÃ­fico"""
        try:
            logger.info(f"Baixando modelo {model_name}...")
            response = requests.post(
                f"{self.base_url}/api/pull", json={"name": model_name}, timeout=300
            )
            success = response.status_code == 200
            if success:
                logger.info(f"Modelo {model_name} baixado com sucesso")
            else:
                logger.error(f"Falha ao baixar modelo {model_name}")
            return success
        except Exception as e:
            logger.error(f"Erro ao baixar modelo {model_name}: {str(e)}")
            return False

    def delete_model(self, model_name: str) -> bool:
        """Deletar um modelo do servidor"""
        try:
            response = requests.delete(
                f"{self.base_url}/api/delete", json={"name": model_name}, timeout=10
            )
            success = response.status_code == 200
            if success:
                logger.info(f"Modelo {model_name} deletado com sucesso")
            else:
                logger.error(f"Falha ao deletar modelo {model_name}")
            return success
        except Exception as e:
            logger.error(f"Erro ao deletar modelo {model_name}: {str(e)}")
            return False


# Factory function para criar instÃ¢ncias facilmente
def create_ollama_llm(
    model_name: str = "llama2",
    base_url: str = "http://localhost:11434",
    temperature: float = 0.7,
    **kwargs,
) -> OllamaLLM:
    """
    Factory function para criar uma instÃ¢ncia do Ollama LLM

    Args:
        model_name: Nome do modelo
        base_url: URL do servidor Ollama
        temperature: Temperatura para geraÃ§Ã£o
        **kwargs: ParÃ¢metros adicionais

    Returns:
        InstÃ¢ncia configurada do OllamaLLM
    """
    return OllamaLLM(
        model_name=model_name, base_url=base_url, temperature=temperature, **kwargs
    )


# ConfiguraÃ§Ãµes prÃ©-definidas para diferentes cenÃ¡rios
class OllamaPresets:
    """Presets comuns para diferentes casos de uso"""

    @staticmethod
    def chat_assistant(model_name: str = "llama2") -> OllamaLLM:
        """ConfiguraÃ§Ã£o otimizada para assistente de chat"""
        return create_ollama_llm(
            model_name=model_name, temperature=0.7, num_predict=2000
        )

    @staticmethod
    def code_assistant(model_name: str = "codellama") -> OllamaLLM:
        """ConfiguraÃ§Ã£o otimizada para assistente de cÃ³digo"""
        return create_ollama_llm(
            model_name=model_name, temperature=0.1, num_predict=4000, top_p=0.9
        )

    @staticmethod
    def creative_writing(model_name: str = "llama2") -> OllamaLLM:
        """ConfiguraÃ§Ã£o otimizada para escrita criativa"""
        return create_ollama_llm(
            model_name=model_name, temperature=0.9, num_predict=3000, top_p=0.95
        )

    @staticmethod
    def analytical(model_name: str = "llama2") -> OllamaLLM:
        """ConfiguraÃ§Ã£o otimizada para anÃ¡lise e raciocÃ­nio"""
        return create_ollama_llm(
            model_name=model_name, temperature=0.3, num_predict=2500, top_p=0.85
        )

    @staticmethod
    def llama2_7b() -> OllamaLLM:
        """Llama 2 7B - Modelo balanceado"""
        return create_ollama_llm(model_name="llama2:7b")

    @staticmethod
    def llama2_13b() -> OllamaLLM:
        """Llama 2 13B - Modelo mais poderoso"""
        return create_ollama_llm(model_name="llama2:13b")

    @staticmethod
    def codellama() -> OllamaLLM:
        """Code Llama - Especializado em cÃ³digo"""
        return create_ollama_llm(
            model_name="codellama", temperature=0.1, num_predict=4000
        )

    @staticmethod
    def mistral() -> OllamaLLM:
        """Mistral 7B - RÃ¡pido e eficiente"""
        return create_ollama_llm(model_name="mistral")

    @staticmethod
    def neural_chat() -> OllamaLLM:
        """Neural Chat - Otimizado para conversas"""
        return create_ollama_llm(model_name="neural-chat")

    @staticmethod
    def phi() -> OllamaLLM:
        """Phi - Modelo pequeno e rÃ¡pido"""
        return create_ollama_llm(model_name="phi")


# Classe para gerenciar servidor Ollama
class OllamaServerManager:
    """Gerenciador para servidor Ollama"""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    def is_server_running(self) -> bool:
        """Verificar se o servidor Ollama estÃ¡ rodando"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except (requests.RequestException, Exception):
            return False

    def get_server_info(self) -> Dict[str, Any]:
        """Obter informaÃ§Ãµes do servidor"""
        try:
            if not self.is_server_running():
                return {"status": "offline", "error": "Servidor nÃ£o acessÃ­vel"}

            # Obter modelos disponÃ­veis
            models_response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            models = (
                models_response.json()
                if models_response.status_code == 200
                else {"models": []}
            )

            return {
                "status": "online",
                "base_url": self.base_url,
                "models_count": len(models.get("models", [])),
                "available_models": [
                    model["name"] for model in models.get("models", [])
                ],
                "total_size": sum(
                    model.get("size", 0) for model in models.get("models", [])
                ),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def pull_model(self, model_name: str) -> bool:
        """Baixar modelo"""
        try:
            response = requests.post(
                f"{self.base_url}/api/pull", json={"name": model_name}, timeout=300
            )
            return response.status_code == 200
        except (requests.RequestException, Exception):
            return False

    def delete_model(self, model_name: str) -> bool:
        """Deletar modelo"""
        try:
            response = requests.delete(
                f"{self.base_url}/api/delete", json={"name": model_name}, timeout=10
            )
            return response.status_code == 200
        except (requests.RequestException, Exception):
            return False


# Modelos populares prÃ©-definidos
class PopularModels:
    """Modelos Ollama populares"""

    MODELS = {
        "llama2": "Meta Llama 2 - Modelo geral versÃ¡til",
        "llama2:7b": "Meta Llama 2 7B - Menor e mais rÃ¡pido",
        "llama2:13b": "Meta Llama 2 13B - Maior e mais preciso",
        "codellama": "Code Llama - Especializado em programaÃ§Ã£o",
        "mistral": "Mistral 7B - RÃ¡pido e eficiente",
        "neural-chat": "Neural Chat - Otimizado para conversas",
        "phi": "Microsoft Phi - Modelo pequeno",
        "orca-mini": "Orca Mini - Modelo compacto",
        "vicuna": "Vicuna - Baseado em Llama",
        "alpaca": "Alpaca - Modelo instrucional",
    }

    @classmethod
    def get_model_list(cls) -> Dict[str, str]:
        """Retornar lista de modelos populares"""
        return cls.MODELS.copy()

    @classmethod
    def get_recommended_for_task(cls, task: str) -> str:
        """Recomendar modelo para tarefa especÃ­fica"""
        recommendations = {
            "chat": "llama2",
            "code": "codellama",
            "creative": "neural-chat",
            "analysis": "mistral",
            "fast": "phi",
            "balanced": "llama2:7b",
        }
        return recommendations.get(task.lower(), "llama2")
