"""
Extensão do DocumentoStoreService com métodos adicionais para upload e query
Este arquivo será mesclado com documento_store_service.py
"""

# Adicionar estes métodos à classe DocumentoStoreService:

async def process_document_upload(
    self,
    document_store_id: uuid.UUID,
    file: "UploadFile",
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> dict:
    """
    Processa upload de documento e cria embeddings para RAG

    Args:
        document_store_id: ID do document store
        file: Arquivo enviado
        chunk_size: Tamanho dos chunks em caracteres
        chunk_overlap: Sobreposição entre chunks

    Returns:
        Dict com informações do processamento
    """
    import io
    import json
    from fastapi import UploadFile

    try:
        # 1. Ler conteúdo do arquivo
        content = await file.read()
        filename = file.filename or "document.txt"

        # 2. Verificar tipo de arquivo
        file_extension = filename.split(".")[-1].lower()
        supported_extensions = ["pdf", "docx", "txt", "md", "html", "csv"]

        if file_extension not in supported_extensions:
            raise ValueError(
                f"Tipo de arquivo não suportado: {file_extension}. "
                f"Suportados: {', '.join(supported_extensions)}"
            )

        # 3. Processar documento com Docling
        from src.utils.docling_embedding import process_document_with_docling

        text_chunks = await process_document_with_docling(
            content=content,
            filename=filename,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        logger.info(f"Documento processado: {len(text_chunks)} chunks criados")

        # 4. Criar chunks no banco
        from src.models.documento_store_file_chunk import DocumentoStoreFileChunk

        chunks_created = 0
        for idx, chunk_text in enumerate(text_chunks):
            chunk = DocumentoStoreFileChunk(
                id_documento_store=document_store_id,
                nm_file=filename,
                ds_chunk=chunk_text,
                nr_chunk_index=idx,
            )
            self.db.add(chunk)
            chunks_created += 1

        await self.db.commit()

        # 5. Gerar embeddings (se configurado)
        embeddings_created = 0
        doc_store = await self.get_documento_store_by_id(document_store_id)

        if doc_store and doc_store.ds_embedding_config:
            try:
                embedding_config = json.loads(doc_store.ds_embedding_config)
                if embedding_config.get("enabled", False):
                    from src.services.embedding_service import EmbeddingService
                    embedding_service = EmbeddingService(self.db)

                    for chunk in text_chunks:
                        await embedding_service.create_embedding(
                            text=chunk,
                            metadata={
                                "document_store_id": str(document_store_id),
                                "filename": filename,
                            },
                        )
                        embeddings_created += 1

                    logger.info(f"Embeddings criados: {embeddings_created}")
            except Exception as e:
                logger.warning(f"Erro ao criar embeddings: {str(e)}")

        return {
            "chunks_created": chunks_created,
            "embeddings_created": embeddings_created,
            "filename": filename,
        }

    except Exception as e:
        await self.db.rollback()
        logger.error(f"Erro ao processar upload: {str(e)}")
        raise


async def get_document_store_stats(self, document_store_id: uuid.UUID) -> dict:
    """Retorna estatísticas do document store"""
    try:
        from src.models.documento_store_file_chunk import DocumentoStoreFileChunk
        from src.models.embedding import DocumentVector

        # Contar chunks
        count_chunks_stmt = select(func.count(DocumentoStoreFileChunk.id_chunk)).where(
            DocumentoStoreFileChunk.id_documento_store == document_store_id
        )
        chunks_result = await self.db.execute(count_chunks_stmt)
        total_chunks = chunks_result.scalar() or 0

        # Contar documentos únicos
        count_docs_stmt = select(
            func.count(func.distinct(DocumentoStoreFileChunk.nm_file))
        ).where(DocumentoStoreFileChunk.id_documento_store == document_store_id)
        docs_result = await self.db.execute(count_docs_stmt)
        total_documents = docs_result.scalar() or 0

        # Contar embeddings (se existir metadata com document_store_id)
        total_embeddings = 0  # Implementar quando tiver estrutura de embeddings

        return {
            "total_documents": total_documents,
            "total_chunks": total_chunks,
            "total_embeddings": total_embeddings,
        }

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        return {
            "total_documents": 0,
            "total_chunks": 0,
            "total_embeddings": 0,
        }


async def query_document_store(
    self,
    document_store_id: uuid.UUID,
    query: str,
    top_k: int = 5,
) -> list:
    """
    Consulta o document store usando similarity search

    Args:
        document_store_id: ID do document store
        query: Consulta de busca
        top_k: Número de resultados a retornar

    Returns:
        Lista de resultados com chunks relevantes
    """
    try:
        # 1. Gerar embedding da query
        from src.services.embedding_service import EmbeddingService

        embedding_service = EmbeddingService(self.db)
        query_embedding = await embedding_service.generate_embedding(query)

        # 2. Buscar chunks similares usando pgvector
        from src.models.documento_store_file_chunk import DocumentoStoreFileChunk

        # Por enquanto, fazer busca simples por texto
        # TODO: Implementar busca por similarity com embeddings
        stmt = (
            select(DocumentoStoreFileChunk)
            .where(DocumentoStoreFileChunk.id_documento_store == document_store_id)
            .where(DocumentoStoreFileChunk.ds_chunk.ilike(f"%{query}%"))
            .limit(top_k)
        )

        result = await self.db.execute(stmt)
        chunks = result.scalars().all()

        # 3. Formatar resultados
        results = []
        for chunk in chunks:
            results.append({
                "chunk_id": str(chunk.id_chunk),
                "filename": chunk.nm_file,
                "chunk_index": chunk.nr_chunk_index,
                "content": chunk.ds_chunk,
                "score": 0.0,  # TODO: Calcular score de similarity
            })

        return results

    except Exception as e:
        logger.error(f"Erro ao consultar document store: {str(e)}")
        return []
