# src/models/documento_store.py
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


class DocumentoStore(Base):
    """Modelo para a tabela tb_documento_store"""

    __tablename__ = "tb_documento_store"

    id_documento_store = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_documento_store",
    )
    nm_documento_store = Column(String, nullable=True, name="nm_documento_store")
    ds_documento_store = Column(String, nullable=True, name="ds_documento_store")
    ds_loaders = Column(Text, nullable=True, name="ds_loaders")
    ds_where_used = Column(Text, nullable=True, name="ds_where_used")
    nm_status = Column(String, nullable=True, name="nm_status")
    dt_criacao = Column(
        DateTime,
        nullable=True,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=True,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )
    ds_vector_store_config = Column(Text, nullable=True, name="ds_vector_store_config")
    ds_embedding_config = Column(Text, nullable=True, name="ds_embedding_config")
    ds_record_manager_config = Column(
        Text, nullable=True, name="ds_record_manager_config"
    )

    # Relacionamento com chunks
    chunks = relationship(
        "DocumentoStoreFileChunk",
        back_populates="documento_store",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # Relacionamento com Agents
    # Nota: Comentado temporariamente - modelo AgentDocumentStore não configurado ainda
    # agent_document_stores = relationship(
    #     "AgentDocumentStore",
    #     back_populates="document_store",
    #     cascade="all, delete-orphan",
    #     lazy="select"
    # )

    # Relacionamento many-to-many com Agent através de AgentDocumentStore
    # Nota: Comentado temporariamente até AgentDocumentStore estar configurado
    # agents = relationship(
    #     "Agent",
    #     secondary="tb_agent_document_stores",
    #     back_populates="document_stores",
    #     viewonly=True,
    #     lazy="select"
    # )

    def __repr__(self):
        return f"<DocumentoStore(id_documento_store={self.id_documento_store}, nm_documento_store='{self.nm_documento_store}', nm_status='{self.nm_status}')>"


# Pydantic Models para API
class DocumentoStoreBase(BaseModel):
    """Schema base para DocumentoStore"""

    nm_documento_store: Optional[str] = Field(
        None, description="Nome do documento store"
    )
    ds_documento_store: Optional[str] = Field(
        None, description="DescriÃ§Ã£o do documento store"
    )
    ds_loaders: Optional[str] = Field(None, description="ConfiguraÃ§Ã£o dos loaders")
    ds_where_used: Optional[str] = Field(None, description="Onde Ã© utilizado")
    nm_status: Optional[str] = Field(None, description="Status do documento store")
    ds_vector_store_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do vector store"
    )
    ds_embedding_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do embedding"
    )
    ds_record_manager_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do record manager"
    )


class DocumentoStoreCreate(DocumentoStoreBase):
    """Schema para criar um DocumentoStore"""

    nm_documento_store: str = Field(..., description="Nome do documento store")
    ds_documento_store: Optional[str] = Field(
        None, description="DescriÃ§Ã£o do documento store"
    )
    ds_loaders: Optional[str] = Field(None, description="ConfiguraÃ§Ã£o dos loaders")
    ds_where_used: Optional[str] = Field(None, description="Onde Ã© utilizado")
    nm_status: Optional[str] = Field("active", description="Status do documento store")
    ds_vector_store_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do vector store"
    )
    ds_embedding_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do embedding"
    )
    ds_record_manager_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do record manager"
    )


class DocumentoStoreUpdate(BaseModel):
    """Schema para atualizar um DocumentoStore"""

    id_documento_store: uuid.UUID = Field(
        ..., description="ID Ãºnico do documento store"
    )
    nm_documento_store: Optional[str] = Field(
        None, description="Nome do documento store"
    )
    ds_documento_store: Optional[str] = Field(
        None, description="DescriÃ§Ã£o do documento store"
    )
    ds_loaders: Optional[str] = Field(None, description="ConfiguraÃ§Ã£o dos loaders")
    ds_where_used: Optional[str] = Field(None, description="Onde Ã© utilizado")
    nm_status: Optional[str] = Field(None, description="Status do documento store")
    ds_vector_store_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do vector store"
    )
    ds_embedding_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do embedding"
    )
    ds_record_manager_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do record manager"
    )


class DocumentoStoreResponse(DocumentoStoreBase):
    """Schema de resposta para DocumentoStore"""

    id_documento_store: uuid.UUID = Field(
        ..., description="ID Ãºnico do documento store"
    )
    nm_documento_store: Optional[str] = Field(
        None, description="Nome do documento store"
    )
    ds_documento_store: Optional[str] = Field(
        None, description="DescriÃ§Ã£o do documento store"
    )
    ds_loaders: Optional[str] = Field(None, description="ConfiguraÃ§Ã£o dos loaders")
    ds_where_used: Optional[str] = Field(None, description="Onde Ã© utilizado")
    nm_status: Optional[str] = Field(None, description="Status do documento store")
    dt_criacao: Optional[datetime] = Field(None, description="Data de criaÃ§Ã£o")
    dt_atualizacao: Optional[datetime] = Field(None, description="Data de atualizaÃ§Ã£o")
    ds_vector_store_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do vector store"
    )
    ds_embedding_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do embedding"
    )
    ds_record_manager_config: Optional[str] = Field(
        None, description="ConfiguraÃ§Ã£o do record manager"
    )

    class Config:
        from_attributes = True


class DocumentoStoreListResponse(BaseModel):
    """Schema para lista de documento stores"""

    items: list[DocumentoStoreResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(
        cls, documento_stores: List["DocumentoStore"], total: int, page: int, size: int
    ):
        """Criar resposta de paginaÃ§Ã£o"""
        total_pages = (total + size - 1) // size  # CÃ¡lculo de pÃ¡ginas

        # Converter documento stores para response - usa model_validate
        items = [
            DocumentoStoreResponse.model_validate(doc_store)
            for doc_store in documento_stores
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
