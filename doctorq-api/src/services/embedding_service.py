import hashlib
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import Depends
from openai import AsyncAzureOpenAI
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db

# Imports ajustados para usar modelos existentes
from src.models.embedding import DocumentVector, DocumentVectorCreate
from src.services.credencial_service import CredencialService
from src.services.record_manager_service import RecordManagerService
from src.services.variable_service import VariableService

logger = get_logger(__name__)


# Classes de resultado para compatibilidade
class DocumentSearchResult:
    """Resultado da busca de embeddings"""

    def __init__(
        self,
        id: UUID,
        content: str,
        similarity: Optional[float],
        metadata: Dict[str, Any],
        created_at: datetime,
    ) -> None:
        self.id = id
        self.content = content
        self.similarity = similarity
        self.metadata = metadata
        self.created_at = created_at


class DocumentHybridResult:
    """Resultado da busca hÃ­brida"""

    def __init__(
        self,
        id: UUID,
        content: str,
        score_final: float,
        score_vetorial: float,
        score_textual: float,
    ) -> None:
        self.id = id
        self.content = content
        self.score_final = score_final
        self.score_vetorial = score_vetorial
        self.score_textual = score_textual


class EmbeddingService:
    """ServiÃ§o para operaÃ§Ãµes com embeddings usando pgvector"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.variable_service = VariableService(db)
        self.chunk_size = 7000  # Tamanho do chunk ajustado para compatibilidade
        self.chunk_overlap = 200  # SobreposiÃ§Ã£o de chunks
        # ConfiguraÃ§Ãµes de credenciais
        self.credencial_service: Optional[CredencialService] = None
        self.azure_client: Optional[AsyncAzureOpenAI] = None
        self.azure_config: Optional[Dict[str, Any]] = None

    def _generate_key_from_content(
        self, content: str, metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Gerar chave Ãºnica baseada no conteÃºdo e metadata"""
        # Criar hash do conteÃºdo + metadata para garantir unicidade
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]

        # Adicionar informaÃ§Ãµes de metadata se disponÃ­vel
        metadata_str = ""
        if metadata:
            # Ordenar metadata para garantir consistÃªncia
            sorted_metadata = sorted(metadata.items())
            metadata_str = (
                "_" + hashlib.md5(str(sorted_metadata).encode("utf-8")).hexdigest()[:8]
            )

        return f"embed_{content_hash}{metadata_str}"

    async def _check_record_manager(
        self, content: str, namespace: str, metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Verificar se o embedding jÃ¡ existe no Record Manager

        Returns:
            True se jÃ¡ existe, False se Ã© novo
        """
        try:
            record_service = RecordManagerService(self.db)
            key = self._generate_key_from_content(content, metadata)

            # Verificar se a chave jÃ¡ existe
            exists_result = await record_service.exists(namespace, [key])

            return exists_result[0] if exists_result else False

        except Exception as e:
            logger.error(f"Erro ao verificar Record Manager: {str(e)}")
            # Em caso de erro, assumir que nÃ£o existe para nÃ£o bloquear
            return False

    async def _register_in_record_manager(
        self,
        content: str,
        namespace: str,
        metadata: Optional[Dict[str, Any]] = None,
        group_id: Optional[str] = None,
    ) -> str:
        """
        Registrar embedding no Record Manager

        Returns:
            A chave gerada para o record
        """
        try:
            record_service = RecordManagerService(self.db)
            key = self._generate_key_from_content(content, metadata)

            # Registrar no Record Manager
            await record_service.upsert_records(
                namespace=namespace,
                keys=[key],
                group_ids=[group_id] if group_id else None,
            )

            logger.debug(f"Embedding registrado no Record Manager: {namespace}:{key}")
            return key

        except Exception as e:
            logger.error(f"Erro ao registrar no Record Manager: {str(e)}")
            # Re-raise para nÃ£o salvar embedding se Record Manager falhar
            raise

    async def generate_embedding(self, content: str) -> List[float]:
        """Gerar embedding para o conteÃºdo usando Azure OpenAI"""
        try:
            # Obter cliente Azure OpenAI configurado
            client = await self._get_azure_client()

            # Modelo de embedding (geralmente text-embedding-ada-002 ou similar)
            if not self.azure_config:
                raise ValueError("Azure config nÃ£o inicializado")

            embedding_model = self.azure_config.get("deployment_name")
            if not embedding_model:
                raise ValueError("deployment_name nÃ£o encontrado na configuraÃ§Ã£o")

            # Gerar embedding
            response = await client.embeddings.create(
                input=content, model=embedding_model
            )

            if not response.data or not response.data[0].embedding:
                raise ValueError("Erro ao gerar embedding")

            logger.debug(
                f"Embedding gerado com sucesso para conteÃºdo de {len(content)} caracteres"
            )
            return response.data[0].embedding

        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {str(e)}")
            raise

    async def create_embedding(
        self,
        embedding_data: DocumentVectorCreate,
        namespace: str,
        group_id: Optional[str] = None,
        skip_if_exists: bool = True,
    ) -> Optional[DocumentVector]:
        """
        Criar um novo embedding com checagem do Record Manager

        Args:
            embedding_data: Dados do embedding
            group_id: ID do grupo opcional para Record Manager
            skip_if_exists: Se True, pula criaÃ§Ã£o se jÃ¡ existe no Record Manager

        Returns:
            DocumentVector criado ou None se jÃ¡ existe e skip_if_exists=True
        """

        logger.debug(f"namespace {namespace}")
        # Verificar se jÃ¡ existe no Record Manager
        if skip_if_exists:
            exists = await self._check_record_manager(
                content=embedding_data.content,
                namespace=namespace,
                metadata=embedding_data.doc_metadata,
            )
            if exists:
                logger.debug("Embedding jÃ¡ existe no Record Manager, pulando criaÃ§Ã£o")
                return None

        try:
            # Registrar no Record Manager primeiro
            record_key = await self._register_in_record_manager(
                content=embedding_data.content,
                namespace=namespace,
                metadata=embedding_data.doc_metadata,
                group_id=group_id,
            )

            # Criar embedding no banco
            db_embedding = DocumentVector(
                content=embedding_data.content,
                embedding=embedding_data.embedding,
                doc_metadata=embedding_data.doc_metadata or {},
            )

            # Adicionar chave do Record Manager aos metadados
            metadata = dict(embedding_data.doc_metadata or {})
            metadata["record_manager_key"] = record_key
            metadata["record_manager_namespace"] = namespace
            db_embedding.doc_metadata = metadata  # type: ignore[assignment]

            self.db.add(db_embedding)
            await self.db.commit()
            await self.db.refresh(db_embedding)

            logger.info(
                f"Embedding criado: ID {db_embedding.id}, Record Key: {record_key}"
            )
            return db_embedding

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar embedding: {str(e)}")
            raise

    def _split_text_into_chunks(self, text: str) -> List[str]:
        """Dividir texto em chunks"""
        if not text:
            return []

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size

            # Tentar quebrar em palavra prÃ³xima ao limite
            if end < len(text):
                for i in range(min(100, len(text) - end)):
                    char = text[end + i]
                    if char in [" ", ".", "\n", "!", "?"]:
                        end = end + i + 1
                        break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # PrÃ³ximo chunk com sobreposiÃ§Ã£o
            start = end - self.chunk_overlap if end < len(text) else end

        return chunks

    async def search_similar_embeddings(
        self,
        query_vector: List[float],
        limit: int = 10,
        threshold: float = 0.3,
        namespace: Optional[str] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        user_unidades: Optional[List[str]] = None,
    ) -> List[DocumentSearchResult]:
        """Buscar embeddings similares usando pgvector"""
        logger.debug(
            f"ðŸ” Iniciando busca vetorial - namespace: {namespace}, threshold: {threshold}, limit: {limit}"
        )
        logger.debug(f"ðŸ”§ Filtros de metadados: {metadata_filters}")
        logger.debug(f"ðŸ¢ Unidades do usuÃ¡rio: {user_unidades}")

        try:
            # Primeiro, verificar quantos documentos existem
            count_stmt = select(func.count(DocumentVector.id))
            if namespace:
                count_stmt = count_stmt.where(
                    DocumentVector.doc_metadata.op("->>")("record_manager_namespace")
                    == namespace
                )
            count_result = await self.db.execute(count_stmt)
            total_docs = count_result.scalar()
            logger.info(f"Total de documentos no namespace '{namespace}': {total_docs}")

            # Usar operador de similaridade de cosseno do pgvector
            # <=> Ã© o operador de distÃ¢ncia de cosseno
            stmt = select(
                DocumentVector.id,
                DocumentVector.content,
                DocumentVector.doc_metadata,
                DocumentVector.created_at,
                DocumentVector.embedding.cosine_distance(query_vector).label(
                    "distance"
                ),
            )

            # Filtrar por namespace se especificado
            if namespace:
                stmt = stmt.where(
                    DocumentVector.doc_metadata.op("->>")("record_manager_namespace")
                    == namespace
                )
                logger.debug(f"Aplicando filtro de namespace: {namespace}")

            # Aplicar filtros de metadados SEI se especificados
            if metadata_filters:
                for key, value in metadata_filters.items():
                    if value is not None:
                        stmt = stmt.where(
                            DocumentVector.doc_metadata.op("->>")(key) == str(value)
                        )
                        logger.debug(f"Aplicando filtro SEI: {key} = {value}")

            # Aplicar filtro por unidades do usuÃ¡rio (para SEI)
            if user_unidades and len(user_unidades) > 0:
                # Filtrar documentos onde idUnidade estÃ¡ na lista de unidades do usuÃ¡rio
                unidade_conditions = []
                for unidade_id in user_unidades:
                    unidade_conditions.append(
                        DocumentVector.doc_metadata.op("->>")("idUnidade")
                        == str(unidade_id)
                    )

                if unidade_conditions:
                    from sqlalchemy import or_

                    stmt = stmt.where(or_(*unidade_conditions))
                    logger.debug(
                        f"Aplicando filtro por unidades do usuÃ¡rio: {user_unidades}"
                    )

            stmt = stmt.order_by(
                DocumentVector.embedding.cosine_distance(query_vector)
            ).limit(limit)

            result = await self.db.execute(stmt)
            rows = result.fetchall()
            logger.debug(f"ðŸ“Š Query retornou {len(rows)} linhas brutas")

            # Converter distÃ¢ncia para similaridade (1 - distÃ¢ncia)
            search_results = []
            for i, row in enumerate(rows):
                similarity = 1 - row.distance
                logger.debug(
                    f"ðŸ“ Doc {i+1}: distÃ¢ncia={row.distance:.4f}, similaridade={similarity:.4f}"
                )

                if similarity >= threshold:
                    search_result = DocumentSearchResult(
                        id=row.id,
                        content=row.content,
                        similarity=similarity,
                        metadata=row.doc_metadata,
                        created_at=row.created_at,
                    )
                    search_results.append(search_result)
                    logger.debug(
                        f"âœ… Doc {i+1} incluÃ­do (similaridade {similarity:.4f} >= {threshold})"
                    )
                else:
                    logger.debug(
                        f"âŒ Doc {i+1} rejeitado (similaridade {similarity:.4f} < {threshold})"
                    )

            logger.debug(
                f"ðŸŽ¯ Busca vetorial encontrou {len(search_results)} resultados apÃ³s filtro de threshold"
            )
            return search_results

        except Exception as e:
            logger.error(f"âŒ Erro na busca vetorial: {str(e)}")
            # Fallback para busca manual
            return await self._search_manual_similarity(
                query_vector, limit, threshold, namespace, metadata_filters
            )

    async def _search_manual_similarity(
        self,
        query_vector: List[float],
        limit: int,
        threshold: float,
        namespace: Optional[str] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
    ) -> List[DocumentSearchResult]:
        """Busca manual de similaridade como fallback"""
        try:
            # Buscar embeddings (limitado para performance)
            stmt = select(DocumentVector)

            # Filtrar por namespace se especificado
            if namespace:
                stmt = stmt.where(
                    DocumentVector.doc_metadata.op("->>")("record_manager_namespace")
                    == namespace
                )

            # Aplicar filtros de metadados SEI se especificados (fallback manual)
            if metadata_filters:
                for key, value in metadata_filters.items():
                    if value is not None:
                        stmt = stmt.where(
                            DocumentVector.doc_metadata.op("->>")(key) == str(value)
                        )

            stmt = stmt.limit(1000)
            result = await self.db.execute(stmt)
            all_embeddings = result.scalars().all()

            similarities = []

            for embedding in all_embeddings:
                try:
                    if embedding.embedding is not None:  # type: ignore[operator]
                        # Calcular similaridade de cosseno
                        similarity = self._cosine_similarity(
                            query_vector, embedding.embedding  # type: ignore[arg-type]
                        )

                        if similarity >= threshold:
                            search_result = DocumentSearchResult(
                                id=embedding.id,  # type: ignore[arg-type]
                                content=embedding.content,  # type: ignore[arg-type]
                                similarity=similarity,
                                metadata=embedding.doc_metadata,  # type: ignore[arg-type]
                                created_at=embedding.created_at,  # type: ignore[arg-type]
                            )
                            similarities.append((search_result, similarity))

                except Exception as e:
                    logger.debug(f"Erro ao calcular similaridade: {str(e)}")
                    continue

            # Ordenar e limitar
            similarities.sort(key=lambda x: x[1], reverse=True)
            results = [result for result, _ in similarities[:limit]]

            logger.debug(f"Busca manual encontrou {len(results)} resultados")
            return results

        except Exception as e:
            logger.error(f"Erro na busca manual: {str(e)}")
            return []

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calcular similaridade de cosseno"""
        try:
            import math

            if len(vec1) != len(vec2):
                return 0.0

            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            magnitude1 = math.sqrt(sum(a * a for a in vec1))
            magnitude2 = math.sqrt(sum(a * a for a in vec2))

            if magnitude1 == 0 or magnitude2 == 0:
                return 0.0

            return dot_product / (magnitude1 * magnitude2)

        except Exception:
            return 0.0

    async def search_hybrid(
        self,
        query_vector: List[float],
        query_texto: str,
        limit: int = 10,
        peso_vetorial: float = 0.7,
        peso_textual: float = 0.3,
    ) -> List[DocumentHybridResult]:
        """Busca hÃ­brida (vetorial + textual)"""
        try:
            # Busca vetorial primeiro
            vector_results = await self.search_similar_embeddings(
                query_vector, limit * 2, 0.3
            )

            # Combinar com busca textual
            hybrid_results = []
            for result in vector_results:
                # Score textual baseado na presenÃ§a do texto na consulta
                score_textual = (
                    1.0 if query_texto.lower() in result.content.lower() else 0.0
                )

                # Score final combinado
                similarity_score = result.similarity or 0.0
                score_final = (peso_vetorial * similarity_score) + (
                    peso_textual * score_textual
                )

                hybrid_result = DocumentHybridResult(
                    id=result.id,
                    content=result.content,
                    score_final=score_final,
                    score_vetorial=similarity_score,
                    score_textual=score_textual,
                )
                hybrid_results.append(hybrid_result)

            # Ordenar por score final e limitar
            hybrid_results.sort(key=lambda x: x.score_final, reverse=True)
            final_results = hybrid_results[:limit]

            logger.debug(f"Busca hÃ­brida encontrou {len(final_results)} resultados")
            return final_results

        except Exception as e:
            logger.error(f"Erro na busca hÃ­brida: {str(e)}")
            raise

    async def search_by_text(
        self, query_text: str, limit: int = 10
    ) -> List[DocumentSearchResult]:
        """Buscar documentos por conteÃºdo de texto"""
        try:
            # Busca usando ILIKE para busca case-insensitive
            stmt = (
                select(DocumentVector)
                .where(DocumentVector.content.ilike(f"%{query_text}%"))
                .limit(limit)
            )

            result = await self.db.execute(stmt)
            documents = result.scalars().all()

            # Converter para DocumentSearchResult
            search_results = []
            for doc in documents:
                search_result = DocumentSearchResult(
                    id=doc.id,  # type: ignore[arg-type]
                    content=doc.content,  # type: ignore[arg-type]
                    similarity=1.0,  # Score fixo para busca textual
                    metadata=doc.doc_metadata,  # type: ignore[arg-type]
                    created_at=doc.created_at,  # type: ignore[arg-type]
                )
                search_results.append(search_result)

            logger.debug(f"Busca textual encontrou {len(search_results)} resultados")
            return search_results

        except Exception as e:
            logger.error(f"Erro na busca textual: {str(e)}")
            raise

    async def get_document_by_id(self, document_id: UUID) -> Optional[DocumentVector]:
        """Buscar documento por ID"""
        try:
            stmt = select(DocumentVector).where(DocumentVector.id == document_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar documento por ID: {str(e)}")
            return None

    async def delete_document(self, namespace: str, document_id: UUID) -> bool:
        """Deletar documento por ID e remover do Record Manager"""
        try:
            stmt = select(DocumentVector).where(DocumentVector.id == document_id)
            result = await self.db.execute(stmt)
            document = result.scalar_one_or_none()

            if document:
                # Remover do Record Manager se tiver chave registrada
                record_key = None
                if document.doc_metadata and "record_manager_key" in document.doc_metadata:  # type: ignore[operator]
                    record_key = document.doc_metadata["record_manager_key"]  # type: ignore[index,assignment]

                    try:
                        record_service = RecordManagerService(self.db)
                        await record_service.delete_keys(namespace, [record_key])  # type: ignore[list-item]
                        logger.debug(
                            f"Record removido do Record Manager: {namespace}:{record_key}"
                        )
                    except Exception as e:
                        logger.warning(f"Erro ao remover do Record Manager: {str(e)}")
                        # Continua com a deleÃ§Ã£o mesmo se Record Manager falhar

                # Deletar documento
                await self.db.delete(document)
                await self.db.commit()
                logger.debug(f"Documento {document_id} deletado com sucesso")
                return True
            else:
                logger.warning(f"Documento {document_id} nÃ£o encontrado")
                return False

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao deletar documento: {str(e)}")
            return False

    async def create_embedding_from_text(
        self,
        content: str,
        namespace: str,
        metadata: Optional[Dict[str, Any]] = None,
        group_id: Optional[str] = None,
        skip_if_exists: bool = True,
    ) -> Optional[DocumentVector]:
        """
        Criar embedding a partir de texto, gerando o vetor automaticamente

        Args:
            content: ConteÃºdo do texto
            metadata: Metadados opcionais
            group_id: ID do grupo opcional para Record Manager
            skip_if_exists: Se True, pula criaÃ§Ã£o se jÃ¡ existe no Record Manager

        Returns:
            DocumentVector criado ou None se jÃ¡ existe e skip_if_exists=True
        """
        try:
            # Verificar se jÃ¡ existe no Record Manager
            if skip_if_exists:
                exists = await self._check_record_manager(
                    content=content, namespace=namespace, metadata=metadata
                )
                if exists:
                    logger.debug(
                        "Embedding jÃ¡ existe no Record Manager, pulando criaÃ§Ã£o"
                    )
                    return None

            # Gerar embedding para o conteÃºdo
            logger.info(f"Gerando embedding para conteÃºdo de {len(content)} caracteres")
            embedding_vector = await self.generate_embedding(content)

            # Criar objeto DocumentVectorCreate
            embedding_data = DocumentVectorCreate(
                content=content, embedding=embedding_vector, doc_metadata=metadata or {}
            )

            # Salvar no banco de dados com Record Manager
            return await self.create_embedding(
                embedding_data, namespace, group_id, skip_if_exists=False
            )

        except Exception as e:
            logger.error(f"Erro ao criar embedding a partir de texto: {str(e)}")
            raise

    async def create_embeddings_from_chunks(
        self,
        content: str,
        namespace: str,
        metadata: Optional[Dict[str, Any]] = None,
        group_id: Optional[str] = None,
        skip_if_exists: bool = True,
    ) -> List[DocumentVector]:
        """
        Criar embeddings a partir de texto dividido em chunks

        Args:
            content: ConteÃºdo do texto
            metadata: Metadados opcionais
            group_id: ID do grupo opcional para Record Manager
            skip_if_exists: Se True, pula criaÃ§Ã£o se jÃ¡ existe no Record Manager

        Returns:
            Lista de DocumentVector criados (exclui os que jÃ¡ existiam)
        """
        try:
            # Dividir texto em chunks
            chunks = self._split_text_into_chunks(content)

            if not chunks:
                logger.warning("Nenhum chunk gerado do texto fornecido")
                return []

            logger.debug(f"Criando embeddings para {len(chunks)} chunks")

            # Criar embeddings para cada chunk
            created_embeddings = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = metadata.copy() if metadata else {}
                chunk_metadata.update(
                    {
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "chunk_size": len(chunk),
                        "source_content_hash": hashlib.sha256(
                            content.encode("utf-8")
                        ).hexdigest()[:16],
                    }
                )

                # Criar group_id especÃ­fico para o chunk se fornecido
                chunk_group_id = f"{group_id}_chunk_{i}" if group_id else None

                embedding = await self.create_embedding_from_text(
                    content=chunk,
                    namespace=namespace,
                    metadata=chunk_metadata,
                    group_id=chunk_group_id,
                    skip_if_exists=skip_if_exists,
                )

                if embedding:  # SÃ³ adiciona se foi criado (nÃ£o existia antes)
                    created_embeddings.append(embedding)
                    logger.debug(f"Embedding criado para chunk {i+1}/{len(chunks)}")
                else:
                    logger.debug(f"Embedding jÃ¡ existe para chunk {i+1}/{len(chunks)}")

            logger.debug(
                f"Total de {len(created_embeddings)} embeddings criados (de {len(chunks)} chunks)"
            )
            return created_embeddings

        except Exception as e:
            logger.error(f"Erro ao criar embeddings a partir de chunks: {str(e)}")
            raise

    async def create_embeddings_from_chunks_from_sei(
        self,
        content: str,
        namespace: str,
        metadata: Optional[Dict[str, Any]] = None,
        group_id: Optional[str] = None,
        skip_if_exists: bool = True,
    ) -> List[DocumentVector]:
        """
        Criar embeddings a partir de texto dividido em chunks para o sei

        Args:
            content: ConteÃºdo do texto
            metadata: Metadados opcionais
            group_id: ID do grupo opcional para Record Manager
            skip_if_exists: Se True, pula criaÃ§Ã£o se jÃ¡ existe no Record Manager

        Returns:
            Lista de DocumentVector criados (exclui os que jÃ¡ existiam)
        """
        try:
            # Dividir texto em chunks
            chunks = self._split_text_into_chunks(content)

            if not chunks:
                logger.warning("Nenhum chunk gerado do texto fornecido")
                return []

            logger.debug(f"Criando embeddings para {len(chunks)} chunks")

            # Criar embeddings para cada chunk
            created_embeddings = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = metadata.copy() if metadata else {}
                chunk_metadata.update(
                    {
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "chunk_size": len(chunk),
                        "source_content_hash": hashlib.sha256(
                            content.encode("utf-8")
                        ).hexdigest()[:16],
                    }
                )

                # Criar group_id especÃ­fico para o chunk se fornecido
                chunk_group_id = f"{group_id}_chunk_{i}" if group_id else None

                embedding = await self.create_embedding_from_text(
                    content=chunk,
                    namespace=namespace,
                    metadata=chunk_metadata,
                    group_id=chunk_group_id,
                    skip_if_exists=skip_if_exists,
                )

                if embedding:  # SÃ³ adiciona se foi criado (nÃ£o existia antes)
                    created_embeddings.append(embedding)
                    logger.debug(f"Embedding criado para chunk {i+1}/{len(chunks)}")
                else:
                    logger.debug(f"Embedding jÃ¡ existe para chunk {i+1}/{len(chunks)}")

            logger.debug(
                f"Total de {len(created_embeddings)} embeddings criados (de {len(chunks)} chunks)"
            )
            return created_embeddings

        except Exception as e:
            logger.error(f"Erro ao criar embeddings a partir de chunks: {str(e)}")
            raise

    async def semantic_search(
        self,
        query: str,
        limit: int = 10,
        threshold: float = 0.3,
        namespace: Optional[str] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        user_unidades: Optional[List[str]] = None,
    ) -> List[DocumentSearchResult]:
        """Busca semÃ¢ntica: gera embedding da query e busca documentos similares"""
        try:
            logger.debug(
                f"ðŸš€ Iniciando busca semÃ¢ntica - Query: '{query[:50]}...', namespace: {namespace}"
            )

            # Gerar embedding para a query
            logger.debug("ðŸ”§ Gerando embedding da query...")
            query_embedding = await self.generate_embedding(query)
            logger.debug(f"âœ… Embedding gerado com {len(query_embedding)} dimensÃµes")

            # Buscar documentos similares
            logger.debug("ðŸ” Iniciando busca por documentos similares...")
            results = await self.search_similar_embeddings(
                query_vector=query_embedding,
                limit=limit,
                threshold=threshold,
                namespace=namespace,
                metadata_filters=metadata_filters,
                user_unidades=user_unidades,
            )

            logger.debug(
                f"ðŸŽ¯ Busca semÃ¢ntica para '{query[:50]}...' encontrou {len(results)} resultados"
            )
            return results

        except Exception as e:
            logger.error(f"âŒ Erro na busca semÃ¢ntica: {str(e)}")
            raise

    async def semantic_search_hybrid(
        self,
        query: str,
        limit: int = 10,
        peso_vetorial: float = 0.7,
        peso_textual: float = 0.3,
    ) -> List[DocumentHybridResult]:
        """Busca semÃ¢ntica hÃ­brida: combina busca vetorial e textual"""
        try:
            # Gerar embedding para a query
            query_embedding = await self.generate_embedding(query)

            # Executar busca hÃ­brida
            results = await self.search_hybrid(
                query_vector=query_embedding,
                query_texto=query,
                limit=limit,
                peso_vetorial=peso_vetorial,
                peso_textual=peso_textual,
            )

            logger.debug(
                f"Busca hÃ­brida para '{query[:50]}...' encontrou {len(results)} resultados"
            )
            return results

        except Exception as e:
            logger.error(f"Erro na busca hÃ­brida semÃ¢ntica: {str(e)}")
            raise

    async def sync_embedding_with_record_manager(self, document_id: UUID) -> bool:
        """Sincronizar embedding com o Record Manager"""
        try:
            # Buscar documento
            document = await self.get_document_by_id(document_id)

            if not document:
                logger.warning(
                    f"Documento {document_id} nÃ£o encontrado para sincronizaÃ§Ã£o"
                )
                return False

            # Calcular hash do conteÃºdo para verificar alteraÃ§Ãµes
            content_hash = hashlib.sha256(document.content.encode("utf-8")).hexdigest()

            # Verificar se jÃ¡ existe registro no Record Manager
            record_manager_service = RecordManagerService(self.db)
            existing_record = await record_manager_service.get_record_by_document_id(document_id)  # type: ignore[attr-defined]

            if existing_record:
                # Verificar se o conteÃºdo foi alterado
                if existing_record.content_hash == content_hash:
                    logger.debug(
                        f"Nenhuma alteraÃ§Ã£o detectada para o documento {document_id}. SincronizaÃ§Ã£o nÃ£o Ã© necessÃ¡ria."
                    )
                    return True  # Nenhuma alteraÃ§Ã£o, sincronizaÃ§Ã£o nÃ£o necessÃ¡ria

                # Atualizar registro existente
                await record_manager_service.update_record_content_hash(document_id, content_hash)  # type: ignore[attr-defined]
                logger.debug(
                    f"Registro do documento {document_id} atualizado no Record Manager"
                )

            else:
                # Criar novo registro no Record Manager
                await record_manager_service.create_record_for_document(document_id, content_hash)  # type: ignore[attr-defined]
                logger.debug(
                    f"Novo registro criado no Record Manager para o documento {document_id}"
                )

            return True

        except Exception as e:
            logger.error(
                f"Erro ao sincronizar embedding com o Record Manager: {str(e)}"
            )
            return False

    async def clean_orphaned_records(self, namespace: str) -> int:
        """
        Limpar records Ã³rfÃ£os no Record Manager (que nÃ£o tÃªm embedding correspondente)

        Returns:
            NÃºmero de records Ã³rfÃ£os removidos
        """
        try:
            record_service = RecordManagerService(self.db)

            # Listar todas as chaves do namespace
            all_keys = await record_service.list_keys(namespace)

            if not all_keys:
                logger.debug("Nenhum record encontrado no Record Manager")
                return 0

            # Verificar quais chaves tÃªm embeddings correspondentes
            orphaned_keys = []
            for key in all_keys:
                # Buscar embedding com esta chave nos metadados
                stmt = select(DocumentVector).where(
                    DocumentVector.doc_metadata.op("->>")("record_manager_key") == key
                )
                result = await self.db.execute(stmt)
                embedding = result.scalar_one_or_none()

                if not embedding:
                    orphaned_keys.append(key)

            # Remover chaves Ã³rfÃ£s
            if orphaned_keys:
                await record_service.delete_keys(namespace, orphaned_keys)
                logger.debug(
                    f"Removidos {len(orphaned_keys)} records Ã³rfÃ£os do Record Manager"
                )
                return len(orphaned_keys)
            else:
                logger.debug("Nenhum record Ã³rfÃ£o encontrado")
                return 0

        except Exception as e:
            logger.error(f"Erro ao limpar records Ã³rfÃ£os: {str(e)}")
            raise

    async def get_record_manager_stats(self, namespace: str) -> Dict[str, Any]:
        """
        Obter estatÃ­sticas do Record Manager para este namespace

        Returns:
            DicionÃ¡rio com estatÃ­sticas
        """
        try:
            record_service = RecordManagerService(self.db)

            # Contar total de records no namespace
            all_keys = await record_service.list_keys(namespace)
            total_records = len(all_keys)

            # Contar embeddings com chave do Record Manager
            stmt = select(func.count(DocumentVector.id)).where(
                DocumentVector.doc_metadata.op("->>")("record_manager_namespace")
                == namespace
            )
            result = await self.db.execute(stmt)
            embeddings_with_records = result.scalar() or 0

            # Contar total de embeddings
            stmt = select(func.count(DocumentVector.id))
            result = await self.db.execute(stmt)
            total_embeddings = result.scalar() or 0

            return {
                "namespace": namespace,
                "total_records": total_records,
                "embeddings_with_records": embeddings_with_records,
                "total_embeddings": total_embeddings,
                "orphaned_records": max(0, total_records - embeddings_with_records),
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatÃ­sticas: {str(e)}")
            return {"namespace": namespace, "error": str(e)}

    async def search_by_metadata_sei(
        self,
        metadata_filter: Optional[Dict[str, Any]],
        limit: int = 100,
        # Filtros especÃ­ficos do SEI
        id_unidade: Optional[str] = None,
        id_procedimento: Optional[str] = None,
        id_documento: Optional[str] = None,
        numero_documento: Optional[str] = None,
        protocolo: Optional[str] = None,
        protocolo_formatado_procedimento: Optional[str] = None,
        sigla_unidade_geradora: Optional[str] = None,
    ) -> List[DocumentSearchResult]:
        """
        Buscar documentos por metadados com suporte especÃ­fico para campos do SEI

        Args:
            metadata_filter: Filtros genÃ©ricos por metadados
            limit: Limite de resultados
            id_unidade: ID da unidade no SEI
            id_procedimento: ID do procedimento no SEI
            id_documento: ID do documento no SEI
            numero_documento: NÃºmero do documento
            protocolo: Protocolo formatado do procedimento
            nivel_acesso: NÃ­vel de acesso do documento
            protocolo_formatado_procedimento: Protocolo formatado completo
            sigla_unidade_geradora: Sigla da unidade geradora

        Returns:
            Lista de DocumentSearchResult encontrados
        """
        logger.debug(f"Buscando metadata filtros genÃ©ricos: {metadata_filter}")
        logger.debug(
            f"Filtros SEI especÃ­ficos - id_unidade: {id_unidade}, id_procedimento: {id_procedimento}, id_documento: {id_documento}"
        )

        conditions = []

        # Aplicar filtros genÃ©ricos de metadata
        if metadata_filter:
            for key, value in metadata_filter.items():
                if value is not None:
                    conditions.append(
                        DocumentVector.doc_metadata.op("->>")(key) == str(value)
                    )
                    logger.debug(f"Aplicando filtro genÃ©rico: {key} = {value}")

        # Aplicar filtros especÃ­ficos do SEI somente se fornecidos
        sei_filters = {
            "id_unidade": id_unidade,
            "id_procedimento": id_procedimento,
            "id_documento": id_documento,
            "numero_documento": numero_documento,
            "protocolo": protocolo,
            "nivel_acesso": "PÃºblico",
            "protocolo_formatado_procedimento": protocolo_formatado_procedimento,
            "sigla_unidade_geradora": sigla_unidade_geradora,
        }

        # Aplicar filtros SEI apenas se tiverem valores
        for field_name, field_value in sei_filters.items():
            if (
                field_value is not None and field_value.strip()
            ):  # Verificar se nÃ£o Ã© vazio
                conditions.append(
                    DocumentVector.doc_metadata.op("->>")(field_name)
                    == str(field_value)
                )
                logger.debug(f"Aplicando filtro SEI: {field_name} = {field_value}")

        try:
            if conditions:
                stmt = select(DocumentVector).where(*conditions).limit(limit)
            else:
                stmt = select(DocumentVector).limit(limit)

            logger.debug(f"Query SQL montada com {len(conditions)} condiÃ§Ãµes")
            result = await self.db.execute(stmt)
            documents = result.scalars().all()
            logger.debug(f"Documentos encontrados: {len(documents)}")

            search_results = []
            for doc in documents:
                search_result = DocumentSearchResult(
                    id=doc.id,  # type: ignore[arg-type]
                    content=doc.content,  # type: ignore[arg-type]
                    similarity=1.0,  # Busca por metadata nÃ£o tem similaridade
                    metadata=doc.doc_metadata,  # type: ignore[arg-type]
                    created_at=doc.created_at,  # type: ignore[arg-type]
                )
                search_results.append(search_result)

                # Log dos metadados para debug (limitado)
                if doc.doc_metadata:  # type: ignore[misc]
                    metadata_sample = {
                        k: v
                        for k, v in doc.doc_metadata.items()  # type: ignore[misc]
                        if k
                        in [
                            "id_unidade",
                            "id_documento",
                            "numero_documento",
                            "protocolo",
                        ]
                    }
                    logger.debug(f"Documento {doc.id}: {metadata_sample}")  # type: ignore[misc]

            logger.info(f"Busca por metadata retornou {len(search_results)} documentos")
            return search_results

        except Exception as e:
            logger.error(f"Erro na busca por metadata: {str(e)}")
            raise

    async def search_by_metadata(
        self, metadata_filter: Optional[Dict[str, Any]], limit: int = 100
    ) -> List[DocumentSearchResult]:
        """
        Buscar documentos por metadados (mÃ©todo simplificado)

        Args:
            metadata_filter: Filtros por metadados
            limit: Limite de resultados

        Returns:
            Lista de DocumentSearchResult encontrados
        """
        return await self.search_by_metadata_sei(
            metadata_filter=metadata_filter, limit=limit
        )

    async def _setup_azure_credentials(self) -> Dict[str, Any]:
        """
        Configurar e buscar credenciais do Azure OpenAI para embeddings

        Carrega automaticamente o ID da credencial da variÃ¡vel 'AZURE_OPENIA_EMBEDDINGS_CREDENCIAL_ID'

        Returns:
            Dict com configuraÃ§Ãµes do Azure OpenAI
        """
        try:
            # Buscar ID da credencial na variÃ¡vel
            variable = await self.variable_service.get_variable_by_vl_variavel(
                "AZURE_OPENIA_EMBEDDINGS_CREDENCIAL_ID"
            )

            if not variable:
                logger.error(
                    "VariÃ¡vel AZURE_OPENIA_EMBEDDINGS_CREDENCIAL_ID nÃ£o encontrada"
                )
                raise ValueError("Credencial de embeddings nÃ£o configurada")

            # Buscar credenciais do Azure OpenAI para embeddings
            credencial_service = CredencialService()
            credencial_id = uuid.UUID(variable.vl_variavel)
            credencial = await credencial_service.get_credencial_decrypted(
                credencial_id
            )

            if not credencial:
                raise ValueError("Credencial para Azure OpenAI nÃ£o encontrada")

            # Acessar os dados descriptografados da credencial
            dados = credencial.get("dados", {})

            # Validar dados obrigatÃ³rios
            required_fields = ["api_key", "endpoint", "deployment_name"]
            missing_fields = [
                field for field in required_fields if not dados.get(field)
            ]

            if missing_fields:
                raise ValueError(
                    f"Campos obrigatÃ³rios faltando na credencial: {', '.join(missing_fields)}"
                )

            config = {
                "api_key": dados.get("api_key"),
                "azure_endpoint": dados.get("endpoint"),
                "api_version": dados.get("api_version", "2024-02-01"),
                "deployment_name": dados.get("deployment_name"),
            }

            logger.debug("Credenciais Azure OpenAI configuradas com sucesso")
            return config

        except Exception as e:
            logger.error(f"Erro ao configurar credenciais Azure OpenAI: {str(e)}")
            raise

    async def _get_azure_client(self) -> AsyncAzureOpenAI:
        """
        Obter cliente Azure OpenAI configurado

        Returns:
            Cliente AsyncAzureOpenAI configurado
        """
        if not self.azure_client or not self.azure_config:
            self.azure_config = await self._setup_azure_credentials()

            # Configurar cliente Azure OpenAI
            self.azure_client = AsyncAzureOpenAI(
                api_key=self.azure_config["api_key"],
                api_version=self.azure_config["api_version"],
                azure_endpoint=self.azure_config["azure_endpoint"],
            )

            logger.debug("Cliente Azure OpenAI inicializado")

        return self.azure_client

    async def reload_azure_credentials(self) -> None:
        """
        Recarregar credenciais do Azure OpenAI
        Ãštil quando as credenciais foram atualizadas no banco de dados
        """
        try:
            logger.debug("Recarregando credenciais Azure OpenAI")
            self.azure_client = None
            self.azure_config = None
            # A prÃ³xima chamada para _get_azure_client() irÃ¡ recarregar as credenciais
            logger.debug("Credenciais Azure OpenAI recarregadas com sucesso")
        except Exception as e:
            logger.error(f"Erro ao recarregar credenciais: {str(e)}")
            raise

    def get_azure_config_info(self) -> Dict[str, Any]:
        """
        Obter informaÃ§Ãµes sobre a configuraÃ§Ã£o atual do Azure OpenAI

        Returns:
            Dict com informaÃ§Ãµes da configuraÃ§Ã£o (sem dados sensÃ­veis)
        """
        if not self.azure_config:
            return {"status": "NÃ£o configurado", "config_loaded": False}

        return {
            "status": "Configurado",
            "config_loaded": True,
            "azure_endpoint": (
                self.azure_config.get("azure_endpoint", "").replace(
                    "https://", "https://***"
                )
                if self.azure_config.get("azure_endpoint")
                else None
            ),
            "api_version": self.azure_config.get("api_version"),
            "deployment_name": self.azure_config.get("deployment_name"),
            "api_key_configured": bool(self.azure_config.get("api_key")),
        }

    async def text_search(
        self, query: str, limit: int = 10, namespace: Optional[str] = None
    ) -> List[DocumentSearchResult]:
        """
        Busca textual usando correspondÃªncia de texto

        Args:
            query: Consulta de texto
            limit: NÃºmero mÃ¡ximo de resultados
            namespace: Namespace para filtrar a busca

        Returns:
            Lista de resultados da busca textual
        """
        try:
            # Busca textual usando ILIKE para busca case-insensitive
            stmt = select(
                DocumentVector.id,
                DocumentVector.content,
                DocumentVector.doc_metadata,
                DocumentVector.created_at,
            ).where(DocumentVector.content.ilike(f"%{query}%"))

            # Filtrar por namespace se especificado
            if namespace:
                stmt = stmt.where(
                    DocumentVector.doc_metadata.op("->>")("record_manager_namespace")
                    == namespace
                )

            stmt = stmt.order_by(DocumentVector.created_at.desc()).limit(limit)

            result = await self.db.execute(stmt)
            rows = result.fetchall()

            # Converter para DocumentSearchResult
            search_results = []
            for row in rows:
                search_result = DocumentSearchResult(
                    id=row.id,  # type: ignore[arg-type]
                    content=row.content,  # type: ignore[arg-type]
                    similarity=None,  # Busca textual nÃ£o tem similaridade
                    metadata=row.doc_metadata,  # type: ignore[arg-type]
                    created_at=row.created_at,  # type: ignore[arg-type]
                )
                search_results.append(search_result)

            logger.debug(f"Busca textual encontrou {len(search_results)} resultados")
            return search_results

        except Exception as e:
            logger.error(f"Erro na busca textual: {str(e)}")
            raise

    async def list_namespaces(self) -> List[str]:
        """
        Lista todos os namespaces disponÃ­veis

        Returns:
            Lista de namespaces Ãºnicos
        """
        try:
            # Buscar todos os namespaces Ãºnicos
            stmt = select(
                DocumentVector.doc_metadata.op("->>")(
                    "record_manager_namespace"
                ).distinct()
            ).where(
                DocumentVector.doc_metadata.op("->>")(
                    "record_manager_namespace"
                ).is_not(None)
            )

            result = await self.db.execute(stmt)
            namespaces = [row[0] for row in result.fetchall() if row[0]]

            logger.debug(f"Encontrados {len(namespaces)} namespaces")
            return sorted(namespaces)

        except Exception as e:
            logger.error(f"Erro ao listar namespaces: {str(e)}")
            raise

    async def get_stats(self) -> Dict[str, Any]:
        """
        Obter estatÃ­sticas dos embeddings

        Returns:
            DicionÃ¡rio com estatÃ­sticas
        """
        try:
            # Contar total de documentos
            total_stmt = select(func.count(DocumentVector.id))
            total_result = await self.db.execute(total_stmt)
            total_documents = total_result.scalar()

            # Corrigir expressÃ£o para evitar erro de GROUP BY
            namespace_expr = DocumentVector.doc_metadata.op("->>")(
                "record_manager_namespace"
            )
            namespace_stmt = (
                select(
                    namespace_expr.label("namespace"),
                    func.count(DocumentVector.id).label("count"),
                )
                .where(namespace_expr.is_not(None))
                .group_by(namespace_expr)
            )

            namespace_result = await self.db.execute(namespace_stmt)
            namespace_counts = {
                row.namespace: row.count for row in namespace_result.fetchall()
            }

            # Obter data do documento mais recente
            recent_stmt = select(func.max(DocumentVector.created_at))
            recent_result = await self.db.execute(recent_stmt)
            most_recent = recent_result.scalar()

            stats = {
                "total_documents": total_documents,
                "namespaces": namespace_counts,
                "total_namespaces": len(namespace_counts),
                "most_recent_document": (
                    most_recent.isoformat() if most_recent else None
                ),
            }

            logger.debug("EstatÃ­sticas obtidas com sucesso")
            return stats

        except Exception as e:
            logger.error(f"Erro ao obter estatÃ­sticas: {str(e)}")
            raise


def get_embedding_service(db: AsyncSession = Depends(get_db)) -> EmbeddingService:
    """Factory function para criar instÃ¢ncia do EmbeddingService"""
    return EmbeddingService(db)
