# src/services/azure_openai_embedding_service.py
from typing import Any, Dict, List

from openai import AsyncAzureOpenAI

from src.config.logger_config import get_logger
from src.services.credencial_service import CredencialService

logger = get_logger(__name__)


class AzureOpenAIEmbeddingService:
    """
    ServiÃ§o para gerar embeddings usando Azure OpenAI
    Integrado com sistema de credenciais
    """

    def __init__(
        self,
        credencial_service: CredencialService,
        embedding_model: str = "text-embedding-ada-002",
        credential_name: str = "azureOpenAiEmbedApi",
    ):
        """
        Inicializa o serviÃ§o de embeddings

        Args:
            credencial_service: ServiÃ§o de credenciais
            embedding_model: Nome do modelo de embedding
            credential_name: Nome da credencial no banco
        """
        self.credencial_service = credencial_service
        self.embedding_model = embedding_model
        self.credential_name = credential_name

        # ConfiguraÃ§Ãµes que serÃ£o carregadas
        self.azure_endpoint = None
        self.api_key = None
        self.api_version = "2023-05-15"
        self.deployment_name = None

        # Cliente Azure OpenAI
        self.client = None
        self.config_loaded = False

    async def _load_credentials(self):
        """Carrega credenciais do banco de dados"""
        try:
            logger.debug(f"Carregando credenciais: {self.credential_name}")

            # Buscar credencial pelo nome
            credencial = await self.credencial_service.get_credencial_by_name(
                self.credential_name
            )

            if not credencial:
                raise ValueError(f"Credencial '{self.credential_name}' nÃ£o encontrada")

            # Parse do JSON da credencial
            config_data = credencial.vl_credencial

            if isinstance(config_data, str):
                import json

                config_data = json.loads(config_data)

            # Extrair configuraÃ§Ãµes
            self.azure_endpoint = config_data.get("azure_endpoint")
            self.api_key = config_data.get("api_key")
            self.api_version = config_data.get("api_version", "2023-05-15")
            self.deployment_name = config_data.get("deployment_name")

            # Validar configuraÃ§Ãµes obrigatÃ³rias
            if not all([self.azure_endpoint, self.api_key, self.deployment_name]):
                missing = []
                if not self.azure_endpoint:
                    missing.append("azure_endpoint")
                if not self.api_key:
                    missing.append("api_key")
                if not self.deployment_name:
                    missing.append("deployment_name")

                raise ValueError(
                    f"ConfiguraÃ§Ãµes obrigatÃ³rias faltando: {', '.join(missing)}"
                )

            self.config_loaded = True
            logger.debug("Credenciais Azure OpenAI carregadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao carregar credenciais: {str(e)}")
            raise

    async def _get_client(self) -> AsyncAzureOpenAI:
        """ObtÃ©m cliente Azure OpenAI configurado"""
        if not self.client:
            if not self.config_loaded:
                await self._load_credentials()

            self.client = AsyncAzureOpenAI(
                azure_endpoint=self.azure_endpoint,
                api_key=self.api_key,
                api_version=self.api_version,
            )

            logger.debug("Cliente Azure OpenAI inicializado")

        return self.client

    async def create_embedding(self, text: str) -> List[float]:
        """
        Gera embedding para um texto

        Args:
            text: Texto para gerar embedding

        Returns:
            Lista de floats representando o vetor de embedding
        """
        try:
            if not text or not text.strip():
                raise ValueError("Texto nÃ£o pode estar vazio")

            # Limitar tamanho do texto (Azure OpenAI tem limite de tokens)
            max_chars = 8000  # Aproximadamente 2000 tokens
            if len(text) > max_chars:
                text = text[:max_chars]
                logger.warning(f"Texto truncado para {max_chars} caracteres")

            client = await self._get_client()

            logger.debug(f"Gerando embedding para texto de {len(text)} caracteres")

            # Gerar embedding
            response = await client.embeddings.create(
                model=self.deployment_name, input=text
            )

            if not response.data or len(response.data) == 0:
                raise ValueError("Resposta vazia do Azure OpenAI")

            embedding_vector = response.data[0].embedding

            logger.debug(f"Embedding gerado com {len(embedding_vector)} dimensÃµes")
            return embedding_vector

        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {str(e)}")
            raise

    async def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Gera embeddings para mÃºltiplos textos em lote

        Args:
            texts: Lista de textos

        Returns:
            Lista de vetores de embedding
        """
        try:
            if not texts:
                return []

            # Filtrar textos vazios
            valid_texts = [text.strip() for text in texts if text and text.strip()]

            if not valid_texts:
                return []

            # Limitar tamanho dos textos
            max_chars = 8000
            processed_texts = []
            for text in valid_texts:
                if len(text) > max_chars:
                    processed_texts.append(text[:max_chars])
                else:
                    processed_texts.append(text)

            client = await self._get_client()

            logger.debug(
                f"Gerando embeddings em lote para {len(processed_texts)} textos"
            )

            # Azure OpenAI suporta atÃ© 16 textos por requisiÃ§Ã£o
            batch_size = 16
            all_embeddings = []

            for i in range(0, len(processed_texts), batch_size):
                batch = processed_texts[i : i + batch_size]

                response = await client.embeddings.create(
                    model=self.deployment_name, input=batch
                )

                if not response.data:
                    raise ValueError(f"Resposta vazia para lote {i//batch_size + 1}")

                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)

            logger.debug(f"Gerados {len(all_embeddings)} embeddings em lote")
            return all_embeddings

        except Exception as e:
            logger.error(f"Erro ao gerar embeddings em lote: {str(e)}")
            raise

    async def test_connection(self) -> bool:
        """Testa a conexÃ£o com Azure OpenAI"""
        try:
            test_text = "Teste de conexÃ£o Azure OpenAI"
            await self.create_embedding(test_text)
            logger.debug("Teste de conexÃ£o Azure OpenAI: SUCESSO")
            return True

        except Exception as e:
            logger.error(f"Teste de conexÃ£o Azure OpenAI: FALHA - {str(e)}")
            return False

    def get_model_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes sobre o modelo configurado"""
        return {
            "embedding_model": self.embedding_model,
            "deployment_name": self.deployment_name,
            "azure_endpoint": self.azure_endpoint,
            "api_version": self.api_version,
            "credential_name": self.credential_name,
            "config_loaded": self.config_loaded,
        }

    async def reload_credentials(self):
        """Recarrega credenciais e reinicializa cliente"""
        try:
            logger.debug("Recarregando credenciais Azure OpenAI")
            self.config_loaded = False
            self.client = None
            await self._load_credentials()
            logger.debug("Credenciais recarregadas com sucesso")

        except Exception as e:
            logger.error(f"Erro ao recarregar credenciais: {str(e)}")
            raise


class AzureOpenAIService:
    """
    ServiÃ§o principal que integra chat e embeddings
    Para compatibilidade com o cÃ³digo existente
    """

    def __init__(self, credencial_service: CredencialService):
        self.credencial_service = credencial_service
        self.embedding_service = AzureOpenAIEmbeddingService(credencial_service)
        self.model_name = "text-embedding-ada-002"  # Para compatibilidade

    async def create_embedding(self, text: str) -> List[float]:
        """Wrapper para o mÃ©todo de embedding"""
        return await self.embedding_service.create_embedding(text)

    async def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Wrapper para embeddings em lote"""
        return await self.embedding_service.create_embeddings_batch(texts)

    async def test_connection(self) -> bool:
        """Wrapper para teste de conexÃ£o"""
        return await self.embedding_service.test_connection()


def get_azure_openai_service(
    credencial_service: CredencialService,
) -> AzureOpenAIService:
    """Factory function para criar instÃ¢ncia do serviÃ§o"""
    return AzureOpenAIService(credencial_service)
