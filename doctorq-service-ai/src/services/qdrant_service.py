# src/services/qdrant_service.py
import uuid
from typing import Any, Dict, List
from urllib.parse import urlparse

from fastapi import Depends
from langchain_openai import AzureOpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from src.config.logger_config import get_logger
from src.models.credencial_schemas import QdrantCredencial
from src.models.embedding import DocumentVectorCreate
from src.services.agent_service import AgentService, get_agent_service
from src.services.credencial_service import CredencialService, get_credencial_service
from src.services.embedding_service import EmbeddingService, get_embedding_service

logger = get_logger(__name__)


class QdrantService:
    """Service para operaÃ§Ãµes com Qdrant vector database"""

    def __init__(
        self,
        agent_service: AgentService,
        credencial_service: CredencialService,
        embedding_service: EmbeddingService,
    ):
        self.agent_service = agent_service
        self.credencial_service = credencial_service
        self.embedding_service = embedding_service

    async def get_agent_qdrant_credentials(
        self, agent_id: str
    ) -> List[QdrantCredencial]:
        """Obter credenciais Qdrant configuradas para o agente"""
        try:
            # Buscar agente
            agent = await self.agent_service.get_agent_by_id(uuid.UUID(agent_id))
            if not agent:
                raise ValueError(f"Agente {agent_id} nÃ£o encontrado")

            # Verificar se knowledge estÃ¡ ativo
            if not agent.is_knowledge_enabled():
                raise ValueError(
                    f"Agente {agent_id} nÃ£o tem base de conhecimento ativada"
                )

            # Obter IDs das credenciais Qdrant
            credential_ids = agent.get_knowledge_credentials()
            if not credential_ids:
                raise ValueError(
                    f"Agente {agent_id} nÃ£o tem credenciais Qdrant configuradas"
                )

            credentials = []
            for credential_id in credential_ids:
                # Buscar credencial
                credencial = await self.credencial_service.get_credencial_by_id(
                    uuid.UUID(credential_id)
                )
                if not credencial:
                    logger.warning(f"Credencial Qdrant {credential_id} nÃ£o encontrada")
                    continue

                # Verificar se Ã© credencial Qdrant
                if credencial.nome_credencial != "qdrantApi":
                    logger.warning(
                        f"Credencial {credential_id} nÃ£o Ã© do tipo qdrantApi: {credencial.nome_credencial}"
                    )
                    continue

                # Descriptografar dados
                credencial_data = (
                    await self.credencial_service.get_credencial_decrypted(
                        uuid.UUID(credential_id)
                    )
                )
                if not credencial_data:
                    logger.warning(
                        f"NÃ£o foi possÃ­vel descriptografar credencial {credential_id}"
                    )
                    continue

                # Log dos dados para debug
                logger.debug(
                    f"Dados da credencial Qdrant {credential_id}: {credencial_data}"
                )

                # Extrair dados descriptografados do campo 'dados'
                dados_qdrant = credencial_data.get("dados", {})
                url = dados_qdrant.get("url")

                if not url:
                    logger.warning(
                        f"Credencial {credential_id} nÃ£o tem URL configurada"
                    )
                    continue

                qdrant_fields = {
                    "server_url": dados_qdrant.get("server_url")
                    or f"{url}:{dados_qdrant.get('porta', 6333)}",
                    "api_key": dados_qdrant.get("api_key"),
                }

                qdrant_creds = QdrantCredencial(**qdrant_fields)
                credentials.append(qdrant_creds)

            if not credentials:
                raise ValueError(
                    f"Nenhuma credencial Qdrant vÃ¡lida encontrada para agente {agent_id}"
                )

            return credentials

        except Exception as e:
            logger.error(
                f"Erro ao obter credenciais Qdrant do agente {agent_id}: {str(e)}"
            )
            raise

    def _parse_qdrant_url(self, server_url: str) -> Dict[str, Any]:
        """Parse URL do Qdrant corrigindo problema com portas padrÃ£o"""
        parsed = urlparse(server_url)

        # Determinar porta correta (fix para cliente Qdrant)
        if parsed.port:
            port = parsed.port
        elif parsed.scheme == "https":
            port = 443
        elif parsed.scheme == "http":
            port = 80
        else:
            port = 6333  # Porta padrÃ£o Qdrant

        return {
            "host": parsed.hostname,
            "port": port,
            "https": parsed.scheme == "https",
        }

    async def create_qdrant_client(self, credentials: QdrantCredencial) -> QdrantClient:
        """Criar cliente Qdrant com as credenciais fornecidas"""
        try:
            # Parse da URL para extrair host/port corretamente
            url_parts = self._parse_qdrant_url(credentials.server_url)
            logger.info(f"URL parsed: {url_parts}")

            # Configurar cliente com host/port explÃ­citos
            client_kwargs = {
                "host": url_parts["host"],
                "port": url_parts["port"],
                "https": url_parts["https"],
            }

            logger.info(f"Client kwargs: {client_kwargs}")

            # Adicionar API key se fornecida
            if credentials.api_key:
                client_kwargs["api_key"] = credentials.api_key

            # ConfiguraÃ§Ãµes para K8s com Ingress
            if url_parts["https"]:
                headers = {
                    "User-Agent": "inovaia-api/1.0",
                    "Connection": "close",  # Evitar keep-alive issues
                }

                # Adicionar Authorization header se API key existe
                if credentials.api_key:
                    headers["Authorization"] = f"Bearer {credentials.api_key}"
                    # Remover api_key dos kwargs pois usaremos header
                    client_kwargs.pop("api_key", None)

                client_kwargs.update(
                    {
                        "prefer_grpc": False,  # REST API para Ingress
                        "timeout": 60,  # Timeout de 60s
                        "headers": headers,
                    }
                )

            client = QdrantClient(**client_kwargs)

            # Testar conexÃ£o
            collections = client.get_collections()
            logger.info(
                f"Conectado ao Qdrant em {credentials.server_url}, coleÃ§Ãµes disponÃ­veis: {len(collections.collections)}"
            )

            return client

        except Exception as e:
            logger.error(f"Erro ao conectar com Qdrant: {str(e)}")
            raise

    async def ensure_collection_exists(
        self,
        client: QdrantClient,
        collection_name: str,
        vector_size: int = 1536,  # PadrÃ£o para Azure OpenAI Ada-002
    ) -> bool:
        """Garantir que a coleÃ§Ã£o existe, criando se necessÃ¡rio"""
        try:
            # Verificar se coleÃ§Ã£o existe
            try:
                client.get_collection(collection_name)
                logger.info(f"ColeÃ§Ã£o {collection_name} jÃ¡ existe")
                return True
            except Exception:
                logger.info(f"ColeÃ§Ã£o {collection_name} nÃ£o existe, tentando criar...")

            # Tentar criar coleÃ§Ã£o
            try:
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"ColeÃ§Ã£o {collection_name} criada com sucesso")
                return True
            except Exception as create_error:
                # Se erro de permissÃ£o, verificar se coleÃ§Ã£o foi criada por outro processo
                try:
                    client.get_collection(collection_name)
                    logger.warning(
                        f"ColeÃ§Ã£o {collection_name} criada por outro processo durante tentativa"
                    )
                    return True
                except Exception:
                    logger.error(
                        f"NÃ£o foi possÃ­vel criar nem encontrar coleÃ§Ã£o {collection_name}: {str(create_error)}"
                    )
                    if "403" in str(create_error) or "Forbidden" in str(create_error):
                        raise ValueError(
                            f"PermissÃ£o insuficiente para criar coleÃ§Ã£o {collection_name}. Verifique se a coleÃ§Ã£o existe ou se a API key tem permissÃµes adequadas."
                        )
                    raise

        except Exception as e:
            logger.error(f"Erro ao verificar/criar coleÃ§Ã£o {collection_name}: {str(e)}")
            raise

    async def store_document_embeddings_with_credential(
        self,
        qdrant_credential_id: str,
        document_content: str,
        document_metadata: Dict[str, Any],
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        model_credential_id: str = None,
        custom_collection_name: str = None,
        cleanup_mode: str = "none",
    ) -> Dict[str, Any]:
        """Armazenar embeddings de documento no Qdrant usando credencial direta"""
        try:
            # Obter credencial Qdrant diretamente
            qdrant_credencial_data = (
                await self.credencial_service.get_credencial_decrypted(
                    uuid.UUID(qdrant_credential_id)
                )
            )
            if not qdrant_credencial_data or not qdrant_credencial_data.get("dados"):
                raise ValueError(
                    f"Credencial Qdrant {qdrant_credential_id} nÃ£o encontrada"
                )

            dados_qdrant = qdrant_credencial_data["dados"]

            # Verificar se Ã© credencial Qdrant
            credencial_obj = await self.credencial_service.get_credencial_by_id(
                uuid.UUID(qdrant_credential_id)
            )
            if not credencial_obj or credencial_obj.nome_credencial != "qdrantApi":
                raise ValueError(
                    f"Credencial {qdrant_credential_id} nÃ£o Ã© do tipo qdrantApi"
                )

            # Criar objeto QdrantCredencial
            qdrant_fields = {
                "server_url": dados_qdrant.get("server_url")
                or f"{dados_qdrant.get('url')}:{dados_qdrant.get('porta', 6333)}",
                "api_key": dados_qdrant.get("api_key"),
            }
            qdrant_credentials = QdrantCredencial(**qdrant_fields)

            # Obter credencial para embeddings
            if not model_credential_id:
                raise ValueError("ID da credencial do modelo Ã© obrigatÃ³rio")

            credencial_data = await self.credencial_service.get_credencial_decrypted(
                uuid.UUID(model_credential_id)
            )
            if not credencial_data or not credencial_data.get("dados"):
                raise ValueError(
                    f"Credencial {model_credential_id} nÃ£o encontrada ou invÃ¡lida"
                )

            dados_azure = credencial_data["dados"]

            # Criar cliente LangChain para embeddings
            embeddings_client = AzureOpenAIEmbeddings(
                model=dados_azure.get("deployment_name"),
                api_key=dados_azure.get("api_key"),
                azure_endpoint=dados_azure.get("endpoint"),
                openai_api_version=dados_azure.get("api_version", "2024-02-01"),
            )

            # Dividir documento em chunks
            chunks = self._split_text_into_chunks(
                document_content, chunk_size, chunk_overlap
            )

            # Gerar embeddings para todos os chunks
            embeddings_list = []
            total_chunks = len(chunks)
            target_collection = custom_collection_name or "default_collection"

            for i, chunk in enumerate(chunks):
                logger.info(
                    f"{target_collection} - Gerando embedding do chunk [{i+1}/{total_chunks}]"
                )
                embedding = embeddings_client.embed_query(chunk)
                embeddings_list.append(embedding)

            # Criar cliente Qdrant
            client = await self.create_qdrant_client(qdrant_credentials)

            # Nome da coleÃ§Ã£o
            collection_name = custom_collection_name or "default_collection"

            # Garantir que coleÃ§Ã£o existe
            await self.ensure_collection_exists(client, collection_name)

            # Aplicar cleanup baseado no modo
            if cleanup_mode == "full":
                try:
                    client.delete_collection(collection_name)
                    await self.ensure_collection_exists(client, collection_name)
                    logger.info(f"ColeÃ§Ã£o {collection_name} limpa completamente")
                except Exception as e:
                    logger.warning(
                        f"Erro ao limpar coleÃ§Ã£o {collection_name}: {str(e)}"
                    )

            elif cleanup_mode == "incremental":
                filename = document_metadata.get("filename")
                if filename:
                    try:
                        filter_condition = Filter(
                            must=[
                                FieldCondition(
                                    key="filename", match=MatchValue(value=filename)
                                )
                            ]
                        )
                        client.delete(
                            collection_name=collection_name,
                            points_selector=filter_condition,
                        )
                        logger.info(f"Removidos documentos antigos de {filename}")
                    except Exception as e:
                        logger.warning(f"Erro ao remover documentos antigos: {str(e)}")

            # Processar cada chunk com embedding jÃ¡ gerado
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings_list)):
                chunk_metadata = {
                    **document_metadata,
                    "chunk_id": i,
                    "qdrant_credential_id": qdrant_credential_id,
                    "collection_name": collection_name,
                }

                document_vector = DocumentVectorCreate(
                    content=chunk,
                    embedding=embedding,
                    doc_metadata=chunk_metadata,
                )

                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=document_vector.embedding,
                    payload={
                        "content": document_vector.content,
                        **document_vector.doc_metadata,
                    },
                )
                points.append(point)

            # Inserir pontos no Qdrant
            operation_info = client.upsert(
                collection_name=collection_name, points=points
            )

            logger.info(
                f"Documento armazenado em {collection_name}: {len(chunks)} chunks"
            )

            return {
                "qdrant_credential_id": qdrant_credential_id,
                "document_metadata": document_metadata,
                "collection_name": collection_name,
                "server_url": qdrant_credentials.server_url,
                "chunks_processed": len(chunks),
                "operation_info": operation_info,
                "success": True,
                "results": [
                    {
                        "collection_name": collection_name,
                        "server_url": qdrant_credentials.server_url,
                        "chunks_processed": len(chunks),
                        "operation_info": operation_info,
                        "success": True,
                    }
                ],
            }

        except Exception as e:
            logger.error(
                f"Erro ao armazenar embeddings com credencial {qdrant_credential_id}: {str(e)}"
            )
            raise

    def _split_text_into_chunks(
        self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200
    ) -> List[str]:
        """Dividir texto em chunks para embedding"""
        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size

            # Se nÃ£o Ã© o Ãºltimo chunk, tentar quebrar em uma palavra
            if end < len(text):
                # Procurar quebra de linha ou espaÃ§o mais prÃ³ximo
                for i in range(end, max(start + chunk_size // 2, end - 100), -1):
                    if text[i] in ["\n", ".", "!", "?", " "]:
                        end = i + 1
                        break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # PrÃ³ximo chunk com overlap
            start = end - chunk_overlap if end < len(text) else end

            # Evitar loop infinito
            start = min(start, end)

        return chunks

    async def search_similar_documents(
        self,
        agent_id: str,
        query_text: str,
        limit: int = 5,
        score_threshold: float = 0.7,
        custom_collection_name: str = None,
    ) -> List[Dict[str, Any]]:
        """Buscar documentos similares no Qdrant"""
        try:
            # Obter credenciais Qdrant do agente
            qdrant_credentials = await self.get_agent_qdrant_credentials(agent_id)

            # Buscar agente para obter configuraÃ§Ã£o de embedding
            agent = await self.agent_service.get_agent_by_id(uuid.UUID(agent_id))
            if not agent:
                raise ValueError(f"Agente {agent_id} nÃ£o encontrado")

            model_credential_id = (
                agent.config_obj.model.id_credencial if agent.config_obj else None
            )
            if not model_credential_id:
                raise ValueError(
                    f"Agente {agent_id} nÃ£o tem credencial de modelo configurada"
                )

            # Obter credencial para embedding
            credencial_data = await self.credencial_service.get_credencial_decrypted(
                uuid.UUID(model_credential_id)
            )
            if not credencial_data or not credencial_data.get("dados"):
                raise ValueError(
                    f"Credencial {model_credential_id} nÃ£o encontrada ou invÃ¡lida"
                )

            dados_azure = credencial_data["dados"]

            # Criar cliente LangChain para embedding da query
            embeddings_client = AzureOpenAIEmbeddings(
                model=dados_azure.get("deployment_name"),
                api_key=dados_azure.get("api_key"),
                azure_endpoint=dados_azure.get("endpoint"),
                openai_api_version=dados_azure.get("api_version", "2024-02-01"),
            )

            # Gerar embedding da query
            query_embedding = embeddings_client.embed_query(query_text)

            all_results = []

            for credentials in qdrant_credentials:
                try:
                    # Criar cliente Qdrant
                    client = await self.create_qdrant_client(credentials)

                    # Nome da coleÃ§Ã£o (usar custom_collection_name ou padrÃ£o)
                    collection_name = custom_collection_name or f"agent_{agent_id}"

                    # Buscar pontos similares
                    search_result = client.search(
                        collection_name=collection_name,
                        query_vector=query_embedding,
                        limit=limit,
                        score_threshold=score_threshold,
                    )

                    # Formatar resultados
                    for result in search_result:
                        all_results.append(
                            {
                                "id": result.id,
                                "score": result.score,
                                "payload": result.payload,
                                "collection": collection_name,
                            }
                        )

                except Exception as e:
                    logger.error(
                        f"Erro ao buscar em {credentials.server_url}: {str(e)}"
                    )
                    continue

            # Ordenar por score e retornar top resultados
            all_results.sort(key=lambda x: x["score"], reverse=True)
            return all_results[:limit]

        except Exception as e:
            logger.error(
                f"Erro ao buscar documentos similares para agente {agent_id}: {str(e)}"
            )
            raise

    async def search_similar_documents_with_credentials(
        self,
        query_text: str,
        limit: int = 5,
        score_threshold: float = 0.7,
        collection_name: str = None,
        qdrant_credential_id: str = None,
        embedding_credential_id: str = None,
    ) -> List[Dict[str, Any]]:
        """Buscar documentos similares usando credenciais especÃ­ficas da tool"""
        try:
            if not qdrant_credential_id or not embedding_credential_id:
                raise ValueError("Credenciais Qdrant e embedding sÃ£o obrigatÃ³rias")

            # Obter credencial Qdrant
            qdrant_credencial = await self.credencial_service.get_credencial_decrypted(
                uuid.UUID(qdrant_credential_id)
            )
            if not qdrant_credencial or not qdrant_credencial.get("dados"):
                raise ValueError(
                    f"Credencial Qdrant {qdrant_credential_id} nÃ£o encontrada"
                )

            # Obter credencial embedding
            embedding_credencial = (
                await self.credencial_service.get_credencial_decrypted(
                    uuid.UUID(embedding_credential_id)
                )
            )
            if not embedding_credencial or not embedding_credencial.get("dados"):
                raise ValueError(
                    f"Credencial embedding {embedding_credential_id} nÃ£o encontrada"
                )

            dados_azure = embedding_credencial["dados"]

            # Criar cliente LangChain para embedding da query
            embeddings_client = AzureOpenAIEmbeddings(
                model=dados_azure.get("deployment_name"),
                api_key=dados_azure.get("api_key"),
                azure_endpoint=dados_azure.get("endpoint"),
                openai_api_version=dados_azure.get("api_version", "2024-02-01"),
            )

            # Gerar embedding da query
            query_embedding = embeddings_client.embed_query(query_text)

            dados_qdrant = qdrant_credencial["dados"]
            url_parts = self._parse_qdrant_url(dados_qdrant.get("server_url"))

            # Configurar cliente Qdrant com parsing correto de URL
            client_kwargs = {
                "host": url_parts["host"],
                "port": url_parts["port"],
                "https": url_parts["https"],
            }
            logger.info(
                f"Client kwargs: Ã‰ https: {client_kwargs.get('https')}, host: {client_kwargs.get('host')}, port: {url_parts.get('port')}"
            )

            headers = {
                "Connection": "close",
                "User-Agent": "inovaia-api/1.0",
            }

            # Adicionar Authorization header para HTTPS
            api_key = dados_qdrant.get("api_key")
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
                client_kwargs.pop("api_key", None)

            client_kwargs.update(
                {
                    "timeout": 60,
                    "prefer_grpc": False,
                    "headers": headers,
                }
            )

            qdrant_client = QdrantClient(**client_kwargs)

            # Realizar busca
            search_results = qdrant_client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
            )

            # Formatar resultados
            results = []
            for result in search_results:
                results.append(
                    {
                        "score": result.score,
                        "payload": result.payload,
                    }
                )

            logger.info(f"Encontrados {len(results)} documentos na busca RAG")
            return results

        except Exception as e:
            logger.error(f"Erro na busca RAG com credenciais: {str(e)}")
            raise


async def get_qdrant_service(
    agent_service: AgentService = Depends(get_agent_service),
    credencial_service: CredencialService = Depends(get_credencial_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
) -> QdrantService:
    """Factory para criar instÃ¢ncia do QdrantService"""
    return QdrantService(
        agent_service=agent_service,
        credencial_service=credencial_service,
        embedding_service=embedding_service,
    )
