# src/models/documento_store_file_chunk.py
import uuid
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from src.models.base import Base


class DocumentoStoreFileChunk(Base):
    """Modelo para a tabela tb_documento_store_file_chunk"""

    __tablename__ = "tb_documento_store_file_chunk"

    id_chunk = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_chunk",
    )
    id_documento = Column(UUID(as_uuid=True), nullable=True, name="id_documento")
    nr_chunk = Column(Integer, nullable=True, name="nr_chunk")
    id_store = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_documento_store.id_documento_store", ondelete="CASCADE"),
        nullable=True,
        name="id_store",
    )
    ds_page_content = Column(Text, nullable=True, name="ds_page_content")
    ds_metadata = Column(Text, nullable=True, name="ds_metadata")
    ds_embedding = Column(Vector(3072), nullable=True, name="ds_embedding")  # text-embedding-3-large (3072 dims)

    # Relacionamentos
    documento_store = relationship(
        "DocumentoStore", back_populates="chunks", lazy="select"
    )

    def __repr__(self):
        return f"<DocumentoStoreFileChunk(id_chunk={self.id_chunk}, id_documento='{self.id_documento}', nr_chunk={self.nr_chunk})>"


# Pydantic Models para API
class DocumentoStoreFileChunkBase(BaseModel):
    """Schema base para DocumentoStoreFileChunk"""

    id_documento: Optional[uuid.UUID] = Field(None, description="ID do documento")
    nr_chunk: Optional[int] = Field(None, description="NÃºmero do chunk")
    id_store: Optional[uuid.UUID] = Field(None, description="ID do store")
    ds_page_content: Optional[str] = Field(None, description="ConteÃºdo da pÃ¡gina")
    ds_metadata: Optional[str] = Field(None, description="Metadados do chunk")


class DocumentoStoreFileChunkCreate(DocumentoStoreFileChunkBase):
    """Schema para criar um DocumentoStoreFileChunk"""

    id_documento: uuid.UUID = Field(..., description="ID do documento")
    nr_chunk: int = Field(..., description="NÃºmero do chunk")
    id_store: uuid.UUID = Field(..., description="ID do store")
    ds_page_content: str = Field(..., description="ConteÃºdo da pÃ¡gina")
    ds_metadata: Optional[str] = Field(None, description="Metadados do chunk")


class DocumentoStoreFileChunkUpdate(BaseModel):
    """Schema para atualizar um DocumentoStoreFileChunk"""

    id_chunk: uuid.UUID = Field(..., description="ID Ãºnico do chunk")
    id_documento: Optional[uuid.UUID] = Field(None, description="ID do documento")
    nr_chunk: Optional[int] = Field(None, description="NÃºmero do chunk")
    id_store: Optional[uuid.UUID] = Field(None, description="ID do store")
    ds_page_content: Optional[str] = Field(None, description="ConteÃºdo da pÃ¡gina")
    ds_metadata: Optional[str] = Field(None, description="Metadados do chunk")


class DocumentoStoreFileChunkResponse(DocumentoStoreFileChunkBase):
    """Schema de resposta para DocumentoStoreFileChunk"""

    id_chunk: uuid.UUID = Field(..., description="ID Ãºnico do chunk")
    id_documento: Optional[uuid.UUID] = Field(None, description="ID do documento")
    nr_chunk: Optional[int] = Field(None, description="NÃºmero do chunk")
    id_store: Optional[uuid.UUID] = Field(None, description="ID do store")
    ds_page_content: Optional[str] = Field(None, description="ConteÃºdo da pÃ¡gina")
    ds_metadata: Optional[str] = Field(None, description="Metadados do chunk")

    class Config:
        from_attributes = True


class DocumentoStoreFileChunkListResponse(BaseModel):
    """Schema para lista de chunks"""

    items: list[DocumentoStoreFileChunkResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(
        cls, chunks: List["DocumentoStoreFileChunk"], total: int, page: int, size: int
    ):
        """Criar resposta de paginaÃ§Ã£o"""
        total_pages = (total + size - 1) // size  # CÃ¡lculo de pÃ¡ginas

        # Converter chunks para response - usa model_validate
        items = [
            DocumentoStoreFileChunkResponse.model_validate(chunk) for chunk in chunks
        ]

        return cls(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            },
        )
