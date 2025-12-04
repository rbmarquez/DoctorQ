# src/services/postgresql_service.py
import uuid
from typing import Any, Dict, List

from fastapi import Depends
from langchain_openai import AzureOpenAIEmbeddings
from sqlalchemy import select

from src.config.logger_config import get_logger
from src.config.orm_config import get_db, ORMConfig
from src.models.credencial_schemas import PostgreSQLCredencial
from src.models.embedding import DocumentVector
from src.services.agent_service import AgentService, get_agent_service
from src.services.credencial_service import CredencialService, get_credencial_service
from src.services.embedding_service import EmbeddingService, get_embedding_service

logger = get_logger(__name__)


class PostgreSQLService:
    """Service para operaÃ§Ãµes com PostgreSQL para RAG"""

    def __init__(
        self,
        agent_service: AgentService,
        credencial_service: CredencialService,
        embedding_service: EmbeddingService,
    ):
        self.agent_service = agent_service
        self.credencial_service = credencial_service
        self.embedding_service = embedding_service

    async def get_agent_postgresql_credentials(
        self, agent_id: str
    ) -> List[PostgreSQLCredencial]:
        """Obter credenciais PostgreSQL configuradas para o agente"""
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

            # Obter IDs das credenciais PostgreSQL
            credential_ids = agent.get_knowledge_credentials()
            if not credential_ids:
                raise ValueError(
                    f"Agente {agent_id} nÃ£o tem credenciais PostgreSQL configuradas"
                )

            credentials = []
            for credential_id in credential_ids:
                # Buscar credencial
                credencial = await self.credencial_service.get_credencial_by_id(
                    uuid.UUID(credential_id)
                )
                if not credencial:
                    logger.warning(
                        f"Credencial PostgreSQL {credential_id} nÃ£o encontrada"
                    )
                    continue

                # Verificar se Ã© credencial PostgreSQL
                if credencial.nome_credencial != "postgresqlApi":
                    logger.warning(
                        f"Credencial {credential_id} nÃ£o Ã© do tipo postgresqlApi: {credencial.nome_credencial}"
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
                    f"Dados da credencial PostgreSQL {credential_id}: {credencial_data}"
                )

                # Extrair dados descriptografados do campo 'dados'
                dados_postgresql = credencial_data.get("dados", {})
                host = dados_postgresql.get("host")

                if not host:
                    logger.warning(
                        f"Credencial {credential_id} nÃ£o tem host configurado"
                    )
                    continue

                postgresql_fields = {
                    "host": host,
                    "port": int(dados_postgresql.get("port", 5432)),
                    "database": dados_postgresql.get("database"),
                    "username": dados_postgresql.get("username"),
                    "password": dados_postgresql.get("password"),
                }

                postgresql_creds = PostgreSQLCredencial(**postgresql_fields)
                credentials.append(postgresql_creds)

            if not credentials:
                raise ValueError(
                    f"Nenhuma credencial PostgreSQL vÃ¡lida encontrada para agente {agent_id}"
                )

            return credentials

        except Exception as e:
            logger.error(
                f"Erro ao obter credenciais PostgreSQL do agente {agent_id}: {str(e)}"
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

    async def store_document_embeddings(
        self,
        agent_id: str,
        document_content: str,
        document_metadata: Dict[str, Any],
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        model_credential_id: str = None,
        cleanup_mode: str = "none",
    ) -> Dict[str, Any]:
        """Armazenar embeddings de documento no PostgreSQL"""
        try:
            # Dividir documento em chunks
            chunks = self._split_text_into_chunks(
                document_content, chunk_size, chunk_overlap
            )

            # Buscar agente para obter configuraÃ§Ã£o de embedding
            agent = await self.agent_service.get_agent_by_id(uuid.UUID(agent_id))
            if not agent:
                raise ValueError(f"Agente {agent_id} nÃ£o encontrado")

            if not model_credential_id:
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

            # Criar cliente LangChain para embedding
            embeddings_client = AzureOpenAIEmbeddings(
                model=dados_azure.get("deployment_name"),
                api_key=dados_azure.get("api_key"),
                azure_endpoint=dados_azure.get("endpoint"),
                openai_api_version=dados_azure.get("api_version", "2024-02-01"),
            )

            # Aplicar cleanup baseado no modo
            if cleanup_mode == "full":
                # Limpar todos os embeddings do agente
                try:
                    async with get_db() as db_session:
                        # Buscar todos os documentos do agente
                        result = await db_session.execute(
                            select(DocumentVector).where(
                                DocumentVector.doc_metadata["agent_id"].astext
                                == agent_id
                            )
                        )
                        documents = result.scalars().all()

                        # Deletar cada documento
                        for doc in documents:
                            await db_session.delete(doc)

                        await db_session.commit()
                        logger.info(
                            f"Embeddings do agente {agent_id} limpos completamente"
                        )
                except Exception as e:
                    logger.warning(f"Erro ao limpar embeddings: {str(e)}")

            elif cleanup_mode == "incremental":
                # Remover documentos com mesmo filename
                filename = document_metadata.get("filename")
                if filename:
                    try:
                        async with get_db() as db_session:
                            # Buscar documentos com mesmo filename e agent_id
                            result = await db_session.execute(
                                select(DocumentVector).where(
                                    DocumentVector.doc_metadata["filename"].astext
                                    == filename,
                                    DocumentVector.doc_metadata["agent_id"].astext
                                    == agent_id,
                                )
                            )
                            documents = result.scalars().all()

                            # Deletar cada documento
                            for doc in documents:
                                await db_session.delete(doc)

                            await db_session.commit()
                            logger.info(f"Removidos documentos antigos de {filename}")
                    except Exception as e:
                        logger.warning(f"Erro ao remover documentos antigos: {str(e)}")

            # Processar cada chunk
            chunks_processed = 0
            async with get_db() as db_session:
                for i, chunk in enumerate(chunks):
                    try:
                        # Gerar embedding para o chunk
                        embedding = embeddings_client.embed_query(chunk)

                        # Preparar metadados do chunk
                        chunk_metadata = {
                            **document_metadata,
                            "chunk_id": i,
                            "agent_id": agent_id,
                        }

                        # Criar usando ORM
                        await DocumentVector.create_async(
                            db=db_session,
                            content=chunk,
                            embedding=embedding,
                            metadata=chunk_metadata,
                        )
                        chunks_processed += 1

                        logger.info(
                            f"Chunk {i+1}/{len(chunks)} processado para PostgreSQL"
                        )

                    except Exception as e:
                        logger.error(f"Erro ao processar chunk {i}: {str(e)}")
                        continue

            return {
                "agent_id": agent_id,
                "document_metadata": document_metadata,
                "results": [
                    {
                        "chunks_processed": chunks_processed,
                        "success": True,
                    }
                ],
                "success": True,
            }

        except Exception as e:
            logger.error(
                f"Erro ao armazenar embeddings para agente {agent_id}: {str(e)}"
            )
            raise

    async def store_document_embeddings_direct(
        self,
        document_content: str,
        document_metadata: Dict[str, Any],
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        model_credential_id: str = None,
        cleanup_mode: str = "none",
        namespace: str = None,
    ) -> Dict[str, Any]:
        """Armazenar embeddings de documento no PostgreSQL sem agente especÃ­fico"""
        try:
            if not model_credential_id:
                raise ValueError("Credencial do modelo Ã© obrigatÃ³ria")

            # Dividir documento em chunks
            chunks = self._split_text_into_chunks(
                document_content, chunk_size, chunk_overlap
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

            # Criar cliente LangChain para embedding
            embeddings_client = AzureOpenAIEmbeddings(
                model=dados_azure.get("deployment_name"),
                api_key=dados_azure.get("api_key"),
                azure_endpoint=dados_azure.get("endpoint"),
                openai_api_version=dados_azure.get("api_version", "2024-02-01"),
            )

            # Aplicar cleanup baseado no modo
            if cleanup_mode == "full" and namespace:
                # Limpar todos os embeddings do namespace
                try:
                    async with get_db() as db_session:
                        # Buscar todos os documentos do namespace
                        result = await db_session.execute(
                            select(DocumentVector).where(
                                DocumentVector.doc_metadata["namespace"].astext
                                == namespace
                            )
                        )
                        documents = result.scalars().all()

                        # Deletar cada documento
                        for doc in documents:
                            await db_session.delete(doc)

                        await db_session.commit()
                        logger.info(
                            f"Embeddings do namespace {namespace} limpos completamente"
                        )
                except Exception as e:
                    logger.warning(f"Erro ao limpar embeddings: {str(e)}")

            elif cleanup_mode == "incremental":
                # Remover documentos com mesmo filename no namespace
                filename = document_metadata.get("filename")
                if filename and namespace:
                    try:
                        async with get_db() as db_session:
                            # Buscar documentos com mesmo filename e namespace
                            result = await db_session.execute(
                                select(DocumentVector).where(
                                    DocumentVector.doc_metadata["filename"].astext
                                    == filename,
                                    DocumentVector.doc_metadata["namespace"].astext
                                    == namespace,
                                )
                            )
                            documents = result.scalars().all()

                            # Deletar cada documento
                            for doc in documents:
                                await db_session.delete(doc)

                            await db_session.commit()
                            logger.info(
                                f"Removidos documentos antigos de {filename} no namespace {namespace}"
                            )
                    except Exception as e:
                        logger.warning(f"Erro ao remover documentos antigos: {str(e)}")

            # Processar cada chunk
            chunks_processed = 0
            async with get_db() as db_session:
                for i, chunk in enumerate(chunks):
                    try:
                        # Gerar embedding para o chunk
                        embedding = embeddings_client.embed_query(chunk)

                        # Preparar metadados do chunk
                        chunk_metadata = {
                            **document_metadata,
                            "chunk_id": i,
                            "namespace": namespace,
                        }

                        # Criar usando ORM
                        await DocumentVector.create_async(
                            db=db_session,
                            content=chunk,
                            embedding=embedding,
                            metadata=chunk_metadata,
                        )
                        chunks_processed += 1

                        logger.info(
                            f"Chunk {i+1}/{len(chunks)} processado para PostgreSQL"
                        )

                    except Exception as e:
                        logger.error(f"Erro ao processar chunk {i}: {str(e)}")
                        continue

            return {
                "document_metadata": document_metadata,
                "results": [
                    {
                        "chunks_processed": chunks_processed,
                        "success": True,
                    }
                ],
                "success": True,
            }

        except Exception as e:
            logger.error(f"Erro ao armazenar embeddings: {str(e)}")
            raise

    async def search_similar_documents_with_credentials(
        self,
        query_text: str,
        limit: int = 5,
        score_threshold: float = 0.7,
        postgresql_credential_id: str = None,
        embedding_credential_id: str = None,
        namespace: str = None,
    ) -> List[Dict[str, Any]]:
        """Buscar documentos similares usando conexÃ£o padrÃ£o e credencial embedding especÃ­fica"""
        try:
            if not embedding_credential_id:
                raise ValueError("Credencial embedding Ã© obrigatÃ³ria")

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

            # Usar sessÃ£o do banco existente para busca de similaridade
            async with get_db() as db_session:
                # Buscar documentos similares usando ORM, filtrados por namespace se especificado
                if namespace:
                    # Buscar apenas no namespace especÃ­fico
                    stmt = (
                        select(DocumentVector)
                        .where(
                            DocumentVector.doc_metadata["namespace"].astext == namespace
                        )
                        .order_by(
                            DocumentVector.embedding.cosine_distance(query_embedding)
                        )
                        .limit(limit)
                    )
                    result = await db_session.execute(stmt)
                    documents = result.scalars().all()
                else:
                    # Buscar em todos os documentos
                    documents = await DocumentVector.search_similar(
                        db=db_session,
                        query_embedding=query_embedding,
                        limit=limit,
                        threshold=score_threshold,
                    )

                # Formatar resultados
                results = []
                for doc in documents:
                    # Calcular score de similaridade
                    similarity_score = 1 - doc.embedding.cosine_distance(
                        query_embedding
                    )

                    # Aplicar threshold
                    if similarity_score >= score_threshold:
                        results.append(
                            {
                                "score": float(similarity_score),
                                "payload": {
                                    "content": doc.content,
                                    **(doc.doc_metadata or {}),
                                },
                            }
                        )

                logger.info(
                    f"Encontrados {len(results)} documentos na busca RAG PostgreSQL"
                )
                return results

        except Exception as e:
            logger.error(f"Erro na busca RAG PostgreSQL com credenciais: {str(e)}")
            raise


async def get_postgresql_service(
    agent_service: AgentService = Depends(get_agent_service),
    credencial_service: CredencialService = Depends(get_credencial_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
) -> PostgreSQLService:
    """Factory para criar instÃ¢ncia do PostgreSQLService"""
    return PostgreSQLService(
        agent_service=agent_service,
        credencial_service=credencial_service,
        embedding_service=embedding_service,
    )
