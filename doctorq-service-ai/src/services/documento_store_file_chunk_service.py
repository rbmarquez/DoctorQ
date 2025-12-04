# src/services/documento_store_file_chunk_service.py
import uuid
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.documento_store_file_chunk import (
    DocumentoStoreFileChunk,
    DocumentoStoreFileChunkCreate,
    DocumentoStoreFileChunkUpdate,
)

logger = get_logger(__name__)


class DocumentoStoreFileChunkService:
    """Service para operaÃ§Ãµes com chunks de arquivos do documento store"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_chunk(
        self, chunk_data: DocumentoStoreFileChunkCreate
    ) -> DocumentoStoreFileChunk:
        """Criar um novo chunk"""
        try:
            # Mapear campos do Pydantic para SQLAlchemy
            db_chunk = DocumentoStoreFileChunk(
                id_documento=chunk_data.id_documento,
                nr_chunk=chunk_data.nr_chunk,
                id_store=chunk_data.id_store,
                ds_page_content=chunk_data.ds_page_content,
                ds_metadata=chunk_data.ds_metadata,
            )

            self.db.add(db_chunk)
            await self.db.commit()
            await self.db.refresh(db_chunk)

            logger.info(
                f"Chunk criado: documento {db_chunk.id_documento}, chunk {db_chunk.nr_chunk}"
            )
            return db_chunk

        except Exception as e:
            logger.error(f"Erro ao criar chunk: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar chunk: {str(e)}") from e

    async def get_chunk_by_id(
        self, chunk_id: uuid.UUID
    ) -> Optional[DocumentoStoreFileChunk]:
        """Obter um chunk por ID"""
        try:
            stmt = select(DocumentoStoreFileChunk).where(
                DocumentoStoreFileChunk.id_chunk == chunk_id
            )
            result = await self.db.execute(stmt)
            chunk = result.scalar_one_or_none()

            if not chunk:
                logger.debug(f"Chunk nÃ£o encontrado: {chunk_id}")

            return chunk

        except Exception as e:
            logger.error(f"Erro ao buscar chunk por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar chunk: {str(e)}") from e

    async def get_chunks_by_documento(
        self, documento_id: uuid.UUID
    ) -> List[DocumentoStoreFileChunk]:
        """Obter todos os chunks de um documento"""
        try:
            stmt = (
                select(DocumentoStoreFileChunk)
                .where(DocumentoStoreFileChunk.id_documento == documento_id)
                .order_by(DocumentoStoreFileChunk.nr_chunk.asc())
            )

            result = await self.db.execute(stmt)
            chunks = result.scalars().all()

            logger.debug(
                f"Encontrados {len(chunks)} chunks para documento {documento_id}"
            )
            return list(chunks)

        except Exception as e:
            logger.error(f"Erro ao buscar chunks por documento: {str(e)}")
            raise RuntimeError(f"Erro ao buscar chunks por documento: {str(e)}") from e

    async def get_chunks_by_store(
        self, store_id: uuid.UUID
    ) -> List[DocumentoStoreFileChunk]:
        """Obter todos os chunks de um store"""
        try:
            stmt = (
                select(DocumentoStoreFileChunk)
                .where(DocumentoStoreFileChunk.id_store == store_id)
                .order_by(
                    DocumentoStoreFileChunk.id_documento.asc(),
                    DocumentoStoreFileChunk.nr_chunk.asc(),
                )
            )

            result = await self.db.execute(stmt)
            chunks = result.scalars().all()

            logger.debug(f"Encontrados {len(chunks)} chunks para store {store_id}")
            return list(chunks)

        except Exception as e:
            logger.error(f"Erro ao buscar chunks por store: {str(e)}")
            raise RuntimeError(f"Erro ao buscar chunks por store: {str(e)}") from e

    async def list_chunks(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        documento_id: Optional[uuid.UUID] = None,
        store_id: Optional[uuid.UUID] = None,
        order_by: str = "nr_chunk",
        order_desc: bool = False,
    ) -> Tuple[List[DocumentoStoreFileChunk], int]:
        """Listar chunks com filtros e paginaÃ§Ã£o"""
        try:
            # Validar campo de ordenaÃ§Ã£o
            valid_order_fields = ["nr_chunk", "id_documento", "id_store", "id_chunk"]
            if order_by not in valid_order_fields:
                logger.warning(
                    f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando nr_chunk"
                )
                order_by = "nr_chunk"

            # Query base para contar
            count_stmt = select(func.count(DocumentoStoreFileChunk.id_chunk))

            # Query base para dados
            stmt = select(DocumentoStoreFileChunk)

            # Aplicar filtros
            filters = []
            if search:
                search_filter = DocumentoStoreFileChunk.ds_page_content.ilike(
                    f"%{search}%"
                )
                filters.append(search_filter)

            if documento_id:
                filters.append(DocumentoStoreFileChunk.id_documento == documento_id)

            if store_id:
                filters.append(DocumentoStoreFileChunk.id_store == store_id)

            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Aplicar ordenaÃ§Ã£o
            order_column = getattr(
                DocumentoStoreFileChunk, order_by, DocumentoStoreFileChunk.nr_chunk
            )
            if order_desc:
                stmt = stmt.order_by(order_column.desc())
            else:
                stmt = stmt.order_by(order_column.asc())

            # Aplicar paginaÃ§Ã£o
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            chunks = result.scalars().all()
            return list(chunks), total

        except Exception as e:
            logger.error(f"Service: Erro ao listar chunks: {str(e)}")
            raise RuntimeError(f"Erro ao listar chunks: {str(e)}") from e

    async def update_chunk(
        self, chunk_id: uuid.UUID, chunk_update: DocumentoStoreFileChunkUpdate
    ) -> Optional[DocumentoStoreFileChunk]:
        """Atualiza um chunk existente"""
        try:
            # 1. Busca o chunk
            chunk = await self.get_chunk_by_id(chunk_id)
            if not chunk:
                logger.warning(f"Chunk nÃ£o encontrado: {chunk_id}")
                return None

            # 2. Aplica os campos que vieram no payload
            data = chunk_update.model_dump(exclude_unset=True)
            field_map = {
                "id_documento": "id_documento",
                "nr_chunk": "nr_chunk",
                "id_store": "id_store",
                "ds_page_content": "ds_page_content",
                "ds_metadata": "ds_metadata",
            }

            for key, attr in field_map.items():
                if key in data:
                    value = data[key]
                    setattr(chunk, attr, value)

            # 3. Persiste e retorna
            await self.db.commit()
            await self.db.refresh(chunk)
            logger.info(f"Chunk atualizado: {chunk.id_chunk}")
            return chunk

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar chunk: {e}")
            raise RuntimeError(f"Erro ao atualizar chunk: {str(e)}") from e

    async def delete_chunk(self, chunk_id: uuid.UUID) -> bool:
        """Deletar um chunk"""
        try:
            chunk = await self.get_chunk_by_id(chunk_id)
            if not chunk:
                logger.warning(f"Chunk nÃ£o encontrado para deleÃ§Ã£o: {chunk_id}")
                return False

            await self.db.delete(chunk)
            await self.db.commit()
            logger.info(f"Chunk deletado: {chunk.id_chunk}")
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar chunk: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar chunk: {str(e)}") from e

    async def delete_chunks_by_documento(self, documento_id: uuid.UUID) -> int:
        """Deletar todos os chunks de um documento"""
        try:
            chunks = await self.get_chunks_by_documento(documento_id)
            count = len(chunks)

            for chunk in chunks:
                await self.db.delete(chunk)

            await self.db.commit()
            logger.info(f"Deletados {count} chunks do documento {documento_id}")
            return count

        except Exception as e:
            logger.error(f"Erro ao deletar chunks por documento: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar chunks por documento: {str(e)}") from e

    async def delete_chunks_by_store(self, store_id: uuid.UUID) -> int:
        """Deletar todos os chunks de um store"""
        try:
            chunks = await self.get_chunks_by_store(store_id)
            count = len(chunks)

            for chunk in chunks:
                await self.db.delete(chunk)

            await self.db.commit()
            logger.info(f"Deletados {count} chunks do store {store_id}")
            return count

        except Exception as e:
            logger.error(f"Erro ao deletar chunks por store: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar chunks por store: {str(e)}") from e


def get_documento_store_file_chunk_service(
    db: AsyncSession = Depends(get_db),
) -> DocumentoStoreFileChunkService:
    """Factory function para criar instÃ¢ncia do DocumentoStoreFileChunkService"""
    return DocumentoStoreFileChunkService(db)
