# src/services/documento_store_service.py
import uuid
from datetime import datetime
from typing import List, Optional, Tuple
import os

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from openai import AsyncOpenAI

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.documento_store import (
    DocumentoStore,
    DocumentoStoreCreate,
    DocumentoStoreUpdate,
)

logger = get_logger(__name__)


class DocumentoStoreService:
    """Service para operaÃ§Ãµes com documento stores"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_documento_store(
        self, documento_store_data: DocumentoStoreCreate
    ) -> DocumentoStore:
        """Criar um novo documento store"""
        try:
            # Verificar se jÃ¡ existe um documento store com o mesmo nome
            existing_documento_store = await self.get_documento_store_by_name(
                documento_store_data.nm_documento_store
            )
            if existing_documento_store:
                raise ValueError(
                    f"Documento store com nome '{documento_store_data.nm_documento_store}' jÃ¡ existe"
                )

            # Mapear campos do Pydantic para SQLAlchemy
            db_documento_store = DocumentoStore(
                nm_documento_store=documento_store_data.nm_documento_store,
                ds_documento_store=documento_store_data.ds_documento_store,
                ds_loaders=documento_store_data.ds_loaders,
                ds_where_used=documento_store_data.ds_where_used,
                nm_status=documento_store_data.nm_status,
                ds_vector_store_config=documento_store_data.ds_vector_store_config,
                ds_embedding_config=documento_store_data.ds_embedding_config,
                ds_record_manager_config=documento_store_data.ds_record_manager_config,
            )

            self.db.add(db_documento_store)
            await self.db.commit()
            await self.db.refresh(db_documento_store)

            logger.debug(
                f"Documento store criado: {db_documento_store.nm_documento_store}"
            )
            return db_documento_store

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar documento store: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar documento store: {str(e)}") from e

    async def get_documento_store_by_id(
        self, documento_store_id: uuid.UUID, include_chunks: bool = False
    ) -> Optional[DocumentoStore]:
        """Obter um documento store por ID"""
        try:
            stmt = select(DocumentoStore).where(
                DocumentoStore.id_documento_store == documento_store_id
            )

            # Incluir chunks se solicitado
            if include_chunks:
                stmt = stmt.options(selectinload(DocumentoStore.chunks))

            result = await self.db.execute(stmt)
            documento_store = result.scalar_one_or_none()

            if not documento_store:
                logger.debug(f"Documento store nÃ£o encontrado: {documento_store_id}")

            return documento_store

        except Exception as e:
            logger.error(f"Erro ao buscar documento store por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar documento store: {str(e)}") from e

    async def get_documento_store_by_name(self, name: str) -> Optional[DocumentoStore]:
        """Obter um documento store por nome"""
        try:
            stmt = select(DocumentoStore).where(
                DocumentoStore.nm_documento_store == name
            )
            result = await self.db.execute(stmt)
            documento_store = result.scalar_one_or_none()

            if not documento_store:
                logger.debug(f"Documento store nÃ£o encontrado: {name}")

            return documento_store

        except Exception as e:
            logger.error(f"Service: Erro ao buscar documento store por nome: {str(e)}")
            raise RuntimeError(f"Erro ao buscar documento store: {str(e)}") from e

    async def list_documento_stores(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
        include_chunks: bool = True,
    ) -> Tuple[List[DocumentoStore], int]:
        """Listar documento stores com filtros e paginaÃ§Ã£o"""
        try:
            # Validar campo de ordenaÃ§Ã£o
            valid_order_fields = [
                "dt_criacao",
                "dt_atualizacao",
                "nm_documento_store",
                "nm_status",
                "id_documento_store",
            ]
            if order_by not in valid_order_fields:
                logger.warning(
                    f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando dt_criacao"
                )
                order_by = "dt_criacao"

            # Query base para contar
            count_stmt = select(func.count(DocumentoStore.id_documento_store))

            # Query base para dados
            stmt = select(DocumentoStore)

            # Incluir chunks se solicitado
            if include_chunks:
                stmt = stmt.options(selectinload(DocumentoStore.chunks))

            # Aplicar filtros
            filters = []
            if search:
                search_filter = or_(
                    DocumentoStore.nm_documento_store.ilike(f"%{search}%"),
                    DocumentoStore.ds_documento_store.ilike(f"%{search}%"),
                )
                filters.append(search_filter)

            if status_filter:
                filters.append(DocumentoStore.nm_status == status_filter)

            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Aplicar ordenaÃ§Ã£o
            order_column = getattr(DocumentoStore, order_by, DocumentoStore.dt_criacao)
            if order_desc:
                stmt = stmt.order_by(order_column.desc())
            else:
                stmt = stmt.order_by(order_column.asc())

            # Aplicar paginaÃ§Ã£o
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            documento_stores = result.scalars().all()
            return list(documento_stores), total

        except Exception as e:
            logger.error(f"Service: Erro ao listar documento stores: {str(e)}")
            raise RuntimeError(f"Erro ao listar documento stores: {str(e)}") from e

    async def update_documento_store(
        self,
        documento_store_id: uuid.UUID,
        documento_store_update: DocumentoStoreUpdate,
    ) -> Optional[DocumentoStore]:
        """Atualiza um documento store existente"""
        try:
            # 1. Busca o documento store
            documento_store = await self.get_documento_store_by_id(documento_store_id)
            if not documento_store:
                logger.warning(f"Documento store nÃ£o encontrado: {documento_store_id}")
                return None

            # 2. Se o nome mudar, valida duplicidade
            nm_documento_store = documento_store_update.nm_documento_store
            if (
                nm_documento_store
                and nm_documento_store != documento_store.nm_documento_store
            ):
                dup = await self.get_documento_store_by_name(nm_documento_store)
                if dup and dup.id_documento_store != documento_store_id:
                    raise ValueError(
                        f"Documento store com nome '{nm_documento_store}' jÃ¡ existe"
                    )

            # 3. Aplica os campos que vieram no payload
            data = documento_store_update.model_dump(exclude_unset=True)
            field_map = {
                "nm_documento_store": "nm_documento_store",
                "ds_documento_store": "ds_documento_store",
                "ds_loaders": "ds_loaders",
                "ds_where_used": "ds_where_used",
                "nm_status": "nm_status",
                "ds_vector_store_config": "ds_vector_store_config",
                "ds_embedding_config": "ds_embedding_config",
                "ds_record_manager_config": "ds_record_manager_config",
            }

            for key, attr in field_map.items():
                if key in data:
                    value = data[key]
                    setattr(documento_store, attr, value)

            # 4. Atualiza timestamp
            documento_store.dt_atualizacao = datetime.now()

            # 5. Persiste e retorna
            await self.db.commit()
            await self.db.refresh(documento_store)
            logger.debug(
                f"Documento store atualizado: {documento_store.nm_documento_store}"
            )
            return documento_store

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar documento store: {e}")
            raise RuntimeError(f"Erro ao atualizar documento store: {str(e)}") from e

    async def delete_documento_store(self, documento_store_id: uuid.UUID) -> bool:
        """Deletar um documento store"""
        try:
            documento_store = await self.get_documento_store_by_id(documento_store_id)
            if not documento_store:
                logger.warning(
                    f"Documento store nÃ£o encontrado para deleÃ§Ã£o: {documento_store_id}"
                )
                return False

            await self.db.delete(documento_store)
            await self.db.commit()
            logger.debug(
                f"Documento store deletado: {documento_store.nm_documento_store}"
            )
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar documento store: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar documento store: {str(e)}") from e

    async def generate_embedding(
        self,
        text: str,
        credential: Optional[dict] = None
    ) -> List[float]:
        """
        Gera embedding para um texto usando OpenAI ou Azure OpenAI

        Args:
            text: Texto para gerar embedding
            credential: Dicionário com credenciais (suporta OpenAI e Azure OpenAI)
        """
        try:
            from openai import AsyncAzureOpenAI

            # Se não foi passada credencial, tentar variável de ambiente
            if not credential:
                openai_api_key = os.getenv("OPENAI_API_KEY")
                if not openai_api_key:
                    logger.warning("Credencial não configurada - embeddings não serão gerados")
                    return None

                client = AsyncOpenAI(api_key=openai_api_key)
                model = "text-embedding-3-small"

            # Azure OpenAI - verifica pelo tipo de credencial
            elif credential.get("nome_credencial") in ["azureOpenIaChatApi", "azureOpenIaEmbbedApi"]:
                logger.debug(f"Usando Azure OpenAI para embeddings (tipo: {credential.get('nome_credencial')})")

                dados = credential.get("dados", {})
                client = AsyncAzureOpenAI(
                    api_key=dados.get("api_key"),
                    api_version=dados.get("api_version", "2024-02-01"),
                    azure_endpoint=dados.get("endpoint")
                )
                # Para chat credential usa deployment_name, para embed usa deployment_name também
                model = dados.get("deployment_name", "text-embedding-3-small")

            # OpenAI padrão
            elif credential.get("nome_credencial") == "openIaApi":
                logger.debug("Usando OpenAI padrão para embeddings")
                dados = credential.get("dados", {})
                client = AsyncOpenAI(api_key=dados.get("api_key"))
                model = "text-embedding-3-small"

            else:
                logger.warning(f"Tipo de credencial não suportado para embeddings: {credential.get('nome_credencial')}")
                return None

            # Gerar embedding
            response = await client.embeddings.create(
                model=model,
                input=text,
                encoding_format="float"
            )

            embedding = response.data[0].embedding
            logger.debug(f"Embedding gerado com {len(embedding)} dimensões")
            return embedding

        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {str(e)}")
            return None

    async def generate_embeddings_batch(
        self,
        texts: List[str],
        credential: Optional[dict] = None,
        batch_size: int = 100
    ) -> List[Optional[List[float]]]:
        """
        Gera embeddings para múltiplos textos em lotes

        Args:
            texts: Lista de textos para gerar embeddings
            credential: Dicionário com credenciais (suporta OpenAI e Azure OpenAI)
            batch_size: Quantidade de textos por lote
        """
        try:
            from openai import AsyncAzureOpenAI

            # Se não foi passada credencial, tentar variável de ambiente
            if not credential:
                openai_api_key = os.getenv("OPENAI_API_KEY")
                if not openai_api_key:
                    logger.warning("Credencial não configurada - embeddings não serão gerados")
                    return [None] * len(texts)

                client = AsyncOpenAI(api_key=openai_api_key)
                model = "text-embedding-3-small"

            # Azure OpenAI - verifica pelo tipo de credencial
            elif credential.get("nome_credencial") in ["azureOpenIaChatApi", "azureOpenIaEmbbedApi"]:
                logger.debug(f"Usando Azure OpenAI para embeddings em lote (tipo: {credential.get('nome_credencial')})")

                dados = credential.get("dados", {})
                client = AsyncAzureOpenAI(
                    api_key=dados.get("api_key"),
                    api_version=dados.get("api_version", "2024-02-01"),
                    azure_endpoint=dados.get("endpoint")
                )
                model = dados.get("deployment_name", "text-embedding-3-small")

            # OpenAI padrão
            elif credential.get("nome_credencial") == "openIaApi":
                logger.debug("Usando OpenAI padrão para embeddings em lote")
                dados = credential.get("dados", {})
                client = AsyncOpenAI(api_key=dados.get("api_key"))
                model = "text-embedding-3-small"

            else:
                logger.warning(f"Tipo de credencial não suportado para embeddings em lote: {credential.get('nome_credencial')}")
                return [None] * len(texts)

            all_embeddings = []

            # Azure OpenAI tem limite de 16 textos por requisição
            # Ajustar batch_size se necessário
            if credential and credential.get("nome_credencial") in ["azureOpenIaChatApi", "azureOpenIaEmbbedApi"]:
                batch_size = min(batch_size, 16)
                logger.info(f"Usando batch_size={batch_size} para Azure OpenAI")

            # Processar em lotes para evitar rate limits
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]

                # Limitar tamanho dos textos (8000 chars ~ 2000 tokens)
                max_chars = 8000
                processed_batch = [
                    text[:max_chars] if len(text) > max_chars else text
                    for text in batch
                ]

                logger.info(f"Gerando embeddings do lote {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size} ({len(processed_batch)} textos)")

                response = await client.embeddings.create(
                    model=model,
                    input=processed_batch,
                    encoding_format="float"
                )

                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)

                logger.debug(f"Lote {i//batch_size + 1} processado - {len(batch_embeddings)} embeddings gerados")

            logger.info(f"✅ Gerados {len(all_embeddings)} embeddings com sucesso (dimensão: {len(all_embeddings[0]) if all_embeddings else 0})")
            return all_embeddings

        except Exception as e:
            logger.error(f"Erro ao gerar embeddings em lote: {str(e)}")
            return [None] * len(texts)

    async def process_document_upload(
        self,
        document_store_id: uuid.UUID,
        file,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        generate_embeddings: bool = False,
        embedding_credential_id: Optional[str] = None,
    ) -> dict:
        """
        Processa upload de documento e cria chunks para RAG

        Args:
            document_store_id: ID do document store
            file: Arquivo uploaded
            chunk_size: Tamanho de cada chunk em caracteres
            chunk_overlap: Sobreposição entre chunks em caracteres
            generate_embeddings: Se deve gerar embeddings automaticamente
            embedding_credential_id: ID da credencial para gerar embeddings

        Returns:
            Dicionário com estatísticas do processamento
        """
        try:
            # Ler conteúdo do arquivo
            content = await file.read()
            filename = file.filename or "document.txt"
            file_extension = filename.split(".")[-1].lower()

            # Processar conteúdo baseado no tipo
            logger.debug(f"Processando arquivo {filename} ({file_extension})")

            if file_extension == "pdf":
                # TODO: Usar Docling para parsing avançado de PDF
                text_content = content.decode("utf-8", errors="ignore")
            elif file_extension in ["txt", "md", "html", "csv"]:
                text_content = content.decode("utf-8", errors="ignore")
            elif file_extension == "docx":
                # TODO: Usar python-docx para parsing de DOCX
                text_content = content.decode("utf-8", errors="ignore")
            else:
                text_content = content.decode("utf-8", errors="ignore")

            # Criar chunks com overlap
            from src.models.documento_store_file_chunk import DocumentoStoreFileChunk

            chunks = []
            chunk_texts = []
            position = 0

            while position < len(text_content):
                # Extrair chunk
                end_position = position + chunk_size
                chunk_text = text_content[position:end_position]

                if chunk_text.strip():
                    # Criar metadata com informações do arquivo
                    metadata = {
                        "filename": filename,
                        "chunk_index": len(chunks),
                        "document_store_id": str(document_store_id)
                    }

                    chunk = DocumentoStoreFileChunk(
                        id_store=document_store_id,
                        id_documento=document_store_id,  # Usar o mesmo ID por enquanto
                        nr_chunk=len(chunks),
                        ds_page_content=chunk_text,
                        ds_metadata=str(metadata),
                    )
                    self.db.add(chunk)
                    chunks.append(chunk)
                    chunk_texts.append(chunk_text)

                # Avançar posição com overlap
                position += (chunk_size - chunk_overlap)

            # Commit dos chunks (sem embeddings ainda)
            await self.db.commit()

            logger.info(
                f"Documento processado: {filename} - {len(chunks)} chunks criados"
            )

            # Gerar embeddings usando OpenAI ou Azure OpenAI (sempre tentar gerar para suportar busca semântica)
            embeddings_created = 0
            try:
                logger.info(f"🔄 Iniciando geração de embeddings para {len(chunks)} chunks")

                # Obter credencial para embeddings
                credential = None
                if embedding_credential_id:
                    from src.services.credencial_service import CredencialService
                    cred_service = CredencialService()
                    logger.info(f"Buscando credencial específica: {embedding_credential_id}")
                    credential = await cred_service.get_credencial_decrypted(embedding_credential_id)
                    if credential:
                        logger.info(f"✅ Usando credencial especificada para embeddings: {credential.get('nome')} (tipo: {credential.get('nome_credencial')})")
                    else:
                        logger.warning(f"❌ Credencial {embedding_credential_id} não encontrada ou falhou ao descriptografar")

                # Se não houver credencial especificada, buscar automaticamente
                if not credential:
                    from src.services.credencial_service import CredencialService
                    import json

                    logger.info("🔍 Buscando credencial de embeddings automaticamente...")
                    cred_service = CredencialService()

                    # 1. PRIORIDADE: Tentar buscar credencial específica de embeddings (azureOpenIaEmbbedApi)
                    logger.debug("Buscando credencial tipo 'azureOpenIaEmbbedApi'")
                    embedding_credentials = await cred_service.get_credenciais_by_type("azureOpenIaEmbbedApi", limit=1)

                    if embedding_credentials and len(embedding_credentials) > 0:
                        logger.info(f"✅ Encontrada credencial de embeddings: {embedding_credentials[0].nome}")
                        credential = await cred_service.get_credencial_decrypted(str(embedding_credentials[0].id_credencial))
                        if credential:
                            logger.info(f"✅ Usando credencial de embeddings: {credential.get('nome')} (tipo: {credential.get('nome_credencial')})")
                        else:
                            logger.error("❌ Falha ao descriptografar credencial de embeddings")
                    else:
                        logger.warning("⚠️  Nenhuma credencial 'azureOpenIaEmbbedApi' encontrada")

                    # 2. FALLBACK: Se não houver credencial de embeddings, tentar credencial do agente padrão
                    if not credential:
                        logger.info("🔍 Buscando credencial do agente padrão como fallback...")
                        from src.models.agent import Agent

                        stmt = select(Agent).where(Agent.st_principal == True).limit(1)
                        result = await self.db.execute(stmt)
                        default_agent = result.scalar_one_or_none()

                        if default_agent and default_agent.ds_config:
                            config = json.loads(default_agent.ds_config) if isinstance(default_agent.ds_config, str) else default_agent.ds_config
                            default_cred_id = config.get("model", {}).get("id_credencial")

                            if default_cred_id:
                                logger.info(f"Usando credencial do agente padrão: {default_agent.nm_agente}")
                                credential = await cred_service.get_credencial_decrypted(default_cred_id)

                                if credential:
                                    logger.info(f"✅ Credencial obtida: {credential.get('nome')} (tipo: {credential.get('nome_credencial')})")
                                else:
                                    logger.error("❌ Falha ao descriptografar credencial do agente")
                            else:
                                logger.warning("⚠️  Agente padrão não tem credencial configurada")
                        else:
                            logger.warning("⚠️  Nenhum agente padrão encontrado")

                # Gerar embeddings em batch
                if not credential:
                    logger.error("❌ Nenhuma credencial disponível para gerar embeddings")
                    embeddings = [None] * len(chunk_texts)
                else:
                    logger.info(f"📊 Gerando {len(chunk_texts)} embeddings...")
                    embeddings = await self.generate_embeddings_batch(
                        chunk_texts,
                        credential=credential,
                        batch_size=100
                    )

                # Atualizar chunks com embeddings
                logger.info(f"💾 Atualizando chunks com embeddings...")
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    if embedding:
                        chunk.ds_embedding = embedding
                        embeddings_created += 1
                        if i < 3:  # Log dos primeiros 3 para debug
                            logger.debug(f"Chunk {i}: embedding com {len(embedding)} dimensões")

                # Commit das atualizações de embeddings
                await self.db.commit()

                if embeddings_created > 0:
                    logger.info(f"✅ Embeddings criados e salvos: {embeddings_created}/{len(chunks)}")
                else:
                    logger.warning(f"⚠️  Nenhum embedding foi gerado (0/{len(chunks)})")

            except Exception as e:
                logger.error(f"❌ Erro ao gerar embeddings: {str(e)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                # Não falhar o upload se embeddings falharem
                logger.info("Documento salvo sem embeddings - busca semântica não estará disponível")

            return {
                "chunks_created": len(chunks),
                "embeddings_created": embeddings_created,
                "filename": filename,
                "chunk_size": chunk_size,
                "chunk_overlap": chunk_overlap,
            }

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao processar upload: {str(e)}")
            raise RuntimeError(f"Erro ao processar upload: {str(e)}") from e

    async def get_document_store_stats(self, document_store_id: uuid.UUID) -> dict:
        """Retorna estatísticas do document store"""
        try:
            from src.models.documento_store_file_chunk import DocumentoStoreFileChunk

            # Contar chunks
            count_chunks_stmt = select(
                func.count(DocumentoStoreFileChunk.id_chunk)
            ).where(DocumentoStoreFileChunk.id_store == document_store_id)
            chunks_result = await self.db.execute(count_chunks_stmt)
            total_chunks = chunks_result.scalar() or 0

            # Contar documentos únicos (via id_documento)
            count_docs_stmt = select(
                func.count(func.distinct(DocumentoStoreFileChunk.id_documento))
            ).where(DocumentoStoreFileChunk.id_store == document_store_id)
            docs_result = await self.db.execute(count_docs_stmt)
            total_documents = docs_result.scalar() or 0

            return {
                "total_documents": total_documents,
                "total_chunks": total_chunks,
                "total_embeddings": 0,  # TODO: Contar embeddings
            }

        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas: {str(e)}")
            return {"total_documents": 0, "total_chunks": 0, "total_embeddings": 0}

    async def query_document_store(
        self,
        document_store_id: uuid.UUID,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.0,
        metadata_filter: Optional[dict] = None,
    ) -> list:
        """
        Consulta o document store usando busca semântica com embeddings (fallback para keyword search)

        Args:
            document_store_id: ID do document store
            query: Texto da consulta
            top_k: Número de resultados a retornar
            min_similarity: Similaridade mínima (0.0-1.0, 0.0 = sem filtro)
            metadata_filter: Dicionário com filtros para metadados (ex: {"filename": "doc.pdf"})

        Returns:
            Lista de resultados com chunk_id, content, score, filename, search_method
        """
        try:
            from src.models.documento_store_file_chunk import DocumentoStoreFileChunk
            from src.models.agent import Agent
            from src.services.credencial_service import CredencialService
            from sqlalchemy import or_, func
            import json

            # Buscar credencial para embeddings
            credential = None
            cred_service = CredencialService()

            # 1. PRIORIDADE: Tentar buscar credencial específica de embeddings (azureOpenIaEmbbedApi)
            embedding_credentials = await cred_service.get_credenciais_by_type("azureOpenIaEmbbedApi", limit=1)

            if embedding_credentials and len(embedding_credentials) > 0:
                logger.info(f"Encontrada credencial de embeddings para busca: {embedding_credentials[0].nome}")
                credential = await cred_service.get_credencial_decrypted(embedding_credentials[0].id_credencial)
                if credential:
                    logger.info(f"Usando credencial de embeddings: {credential.get('nome')} (tipo: {credential.get('nome_credencial')})")

            # 2. FALLBACK: Se não houver credencial de embeddings, tentar credencial do agente padrão
            if not credential:
                stmt = select(Agent).where(Agent.st_principal == True).limit(1)
                result = await self.db.execute(stmt)
                default_agent = result.scalar_one_or_none()

                if default_agent and default_agent.ds_config:
                    config = json.loads(default_agent.ds_config) if isinstance(default_agent.ds_config, str) else default_agent.ds_config
                    default_cred_id = config.get("model", {}).get("id_credencial")

                    if default_cred_id:
                        credential = await cred_service.get_credencial_decrypted(default_cred_id)
                        if credential:
                            logger.info(f"Credencial obtida para busca (fallback): {credential.get('nome')} (tipo: {credential.get('nome_credencial')})")

            # Tentar busca semântica primeiro
            query_embedding = await self.generate_embedding(query, credential)

            chunks = []
            search_method = "semantic"

            if query_embedding:
                # BUSCA SEMÂNTICA: Usar similaridade de cosseno com embeddings
                logger.debug("Usando busca semântica com embeddings")

                # Buscar chunks com embeddings que sejam mais similares à query
                # Usar o operador <=> do pgvector que retorna cosine distance
                # Similaridade = 1 - distance
                from sqlalchemy import func as sql_func, text

                stmt = (
                    select(
                        DocumentoStoreFileChunk,
                        # Calcular similaridade como 1 - cosine_distance
                        (1 - DocumentoStoreFileChunk.ds_embedding.cosine_distance(query_embedding)).label('similarity')
                    )
                    .where(DocumentoStoreFileChunk.id_store == document_store_id)
                    .where(DocumentoStoreFileChunk.ds_embedding.isnot(None))
                )

                # Aplicar filtro de similaridade mínima
                if min_similarity > 0:
                    stmt = stmt.where(
                        (1 - DocumentoStoreFileChunk.ds_embedding.cosine_distance(query_embedding)) >= min_similarity
                    )

                # Aplicar filtros de metadados se fornecidos
                if metadata_filter:
                    import json
                    for key, value in metadata_filter.items():
                        # Filtrar usando JSONB contains operator
                        filter_json = json.dumps({key: value})
                        stmt = stmt.where(
                            text(f"ds_metadata::jsonb @> '{filter_json}'::jsonb")
                        )

                # Ordenar por similaridade (maior primeiro) e limitar
                stmt = (
                    stmt.order_by(DocumentoStoreFileChunk.ds_embedding.cosine_distance(query_embedding))
                    .limit(top_k * 2)  # Buscar mais para ter margem após filtros
                )

                result = await self.db.execute(stmt)
                rows = result.all()

                # Extrair chunks e similaridades
                chunks = [(row[0], row[1]) for row in rows]  # (chunk, similarity)

                logger.info(f"Busca semântica retornou {len(chunks)} chunks")

            # Fallback para busca por keywords se não houver embeddings ou resultados
            if not chunks:
                search_method = "keyword"
                logger.debug("Fallback para busca por palavras-chave")

                # Extrair palavras-chave da query (palavras com 3+ caracteres)
                import re
                keywords = [word for word in re.findall(r'\b\w+\b', query.lower())
                           if len(word) >= 3 and word not in ['que', 'para', 'como', 'por', 'com', 'uma', 'um', 'o', 'a', 'os', 'as']]

                logger.debug(f"Palavras-chave extraídas da query: {keywords}")

                # Busca por palavras-chave
                if not keywords:
                    # Se não há palavras-chave, usar a query completa
                    conditions = [DocumentoStoreFileChunk.ds_page_content.ilike(f"%{query}%")]
                else:
                    # Buscar chunks que contenham QUALQUER uma das palavras-chave
                    conditions = [
                        DocumentoStoreFileChunk.ds_page_content.ilike(f"%{keyword}%")
                        for keyword in keywords
                    ]

                stmt = (
                    select(DocumentoStoreFileChunk)
                    .where(DocumentoStoreFileChunk.id_store == document_store_id)
                    .where(or_(*conditions))
                    .limit(top_k * 2)  # Buscar mais chunks para ter opções
                )

                result = await self.db.execute(stmt)
                chunks = result.scalars().all()[:top_k]

                logger.info(f"Busca por keywords retornou {len(chunks)} chunks")

            # Formatar resultados
            results = []
            import json
            import ast

            # Para busca semântica, chunks é uma lista de tuplas (chunk, similarity)
            # Para busca keyword, chunks é uma lista de objetos chunk
            if search_method == "semantic":
                chunks_to_process = chunks[:top_k]  # Já vem com (chunk, similarity)
            else:
                chunks_to_process = [(chunk, 0.0) for chunk in chunks[:top_k]]  # Keyword não tem similarity

            for chunk_data in chunks_to_process:
                # Desempacotar chunk e score
                if search_method == "semantic":
                    chunk, score = chunk_data
                else:
                    chunk = chunk_data[0]
                    score = 0.0

                # Extrair filename do metadata se possível
                filename = "unknown"
                metadata_dict = {}
                try:
                    if chunk.ds_metadata:
                        # Tentar JSON primeiro (formato correto)
                        try:
                            metadata_dict = json.loads(chunk.ds_metadata)
                        except json.JSONDecodeError:
                            # Fallback para Python dict string (single quotes)
                            metadata_dict = ast.literal_eval(chunk.ds_metadata)
                        filename = metadata_dict.get("filename", "unknown")
                except:
                    pass

                # Garantir que score está entre 0 e 1
                score = max(0.0, min(1.0, float(score)))

                results.append(
                    {
                        "chunk_id": str(chunk.id_chunk),
                        "filename": filename,
                        "chunk_index": chunk.nr_chunk,
                        "content": chunk.ds_page_content,
                        "score": round(score, 4),
                        "search_method": search_method,
                        "metadata": metadata_dict,
                    }
                )

            logger.info(f"Retornando {len(results)} resultados (método: {search_method})")
            return results

        except Exception as e:
            logger.error(f"Erro ao consultar document store: {str(e)}")
            return []

    async def list_files_in_document_store(
        self, document_store_id: uuid.UUID
    ) -> List[dict]:
        """Lista todos os arquivos únicos em um document store"""
        try:
            from src.models.documento_store_file_chunk import DocumentoStoreFileChunk
            import json

            # Buscar todos os chunks do store, agrupados por id_documento
            stmt = (
                select(
                    DocumentoStoreFileChunk.id_documento,
                    func.count(DocumentoStoreFileChunk.id_chunk).label("chunk_count"),
                    func.min(DocumentoStoreFileChunk.ds_metadata).label("metadata"),
                )
                .where(DocumentoStoreFileChunk.id_store == document_store_id)
                .where(DocumentoStoreFileChunk.id_documento.isnot(None))
                .group_by(DocumentoStoreFileChunk.id_documento)
            )

            result = await self.db.execute(stmt)
            files = result.all()

            # Formatar resultados
            file_list = []
            for file_row in files:
                id_documento, chunk_count, metadata_str = file_row

                # Extrair filename do metadata
                filename = "unknown"
                try:
                    metadata = json.loads(metadata_str) if metadata_str else {}
                    filename = metadata.get("filename", "unknown")
                except:
                    pass

                file_list.append({
                    "id_documento": str(id_documento),
                    "filename": filename,
                    "chunk_count": chunk_count,
                })

            logger.info(f"Encontrados {len(file_list)} arquivos no document store {document_store_id}")
            return file_list

        except Exception as e:
            logger.error(f"Erro ao listar arquivos do document store: {str(e)}")
            return []

    async def delete_file_from_document_store(
        self, document_store_id: uuid.UUID, id_documento: uuid.UUID
    ) -> bool:
        """Exclui todos os chunks de um arquivo específico"""
        try:
            from src.models.documento_store_file_chunk import DocumentoStoreFileChunk
            from sqlalchemy import delete

            # Verificar se o arquivo existe neste store
            stmt = select(func.count()).select_from(DocumentoStoreFileChunk).where(
                and_(
                    DocumentoStoreFileChunk.id_store == document_store_id,
                    DocumentoStoreFileChunk.id_documento == id_documento,
                )
            )
            result = await self.db.execute(stmt)
            count = result.scalar()

            if count == 0:
                logger.warning(
                    f"Arquivo {id_documento} não encontrado no store {document_store_id}"
                )
                return False

            # Deletar todos os chunks deste arquivo
            delete_stmt = delete(DocumentoStoreFileChunk).where(
                and_(
                    DocumentoStoreFileChunk.id_store == document_store_id,
                    DocumentoStoreFileChunk.id_documento == id_documento,
                )
            )

            await self.db.execute(delete_stmt)
            await self.db.commit()

            logger.info(
                f"Arquivo {id_documento} excluído do store {document_store_id} ({count} chunks removidos)"
            )
            return True

        except Exception as e:
            logger.error(f"Erro ao excluir arquivo do document store: {str(e)}")
            await self.db.rollback()
            return False

    async def check_file_exists(
        self, document_store_id: uuid.UUID, filename: str
    ) -> Optional[uuid.UUID]:
        """Verifica se um arquivo com este nome já existe no store"""
        try:
            from src.models.documento_store_file_chunk import DocumentoStoreFileChunk
            import json

            # Buscar chunks que possam ter este filename no metadata
            stmt = select(DocumentoStoreFileChunk).where(
                DocumentoStoreFileChunk.id_store == document_store_id
            ).limit(1000)  # Limitar para evitar carregar muitos chunks

            result = await self.db.execute(stmt)
            chunks = result.scalars().all()

            # Verificar metadata de cada chunk
            for chunk in chunks:
                if chunk.ds_metadata:
                    try:
                        metadata = json.loads(chunk.ds_metadata)
                        if metadata.get("filename") == filename:
                            logger.info(
                                f"Arquivo '{filename}' já existe no store {document_store_id} (id_documento: {chunk.id_documento})"
                            )
                            return chunk.id_documento
                    except:
                        continue

            return None

        except Exception as e:
            logger.error(f"Erro ao verificar se arquivo existe: {str(e)}")
            return None


def get_documento_store_service(
    db: AsyncSession = Depends(get_db),
) -> DocumentoStoreService:
    """Factory function para criar instÃ¢ncia do DocumentoStoreService"""
    return DocumentoStoreService(db)
