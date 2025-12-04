import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID as PythonUUID

from pgvector.sqlalchemy import Vector
from pydantic import BaseModel
from sqlalchemy import JSON, Column, Index, Text, func, select
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from src.models.base import Base


class DocumentVectorCreate(BaseModel):
    """Schema para criaÃ§Ã£o de DocumentVector"""

    content: str
    embedding: List[float]
    doc_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class DocumentVectorResponse(BaseModel):
    """Schema para resposta de DocumentVector"""

    id: PythonUUID
    content: str
    doc_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentVector(Base):
    """Modelo para armazenar vetores de documentos no Postgres usando pgvector"""

    __tablename__ = "tb_documentos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id")
    content = Column(Text, nullable=False, name="content")
    embedding = Column(
        Vector(1536),  # Ajuste o tamanho do vetor conforme necessÃ¡rio
        nullable=False,
        name="embedding",
    )
    doc_metadata = Column(JSON, nullable=True, name="metadata")
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        name="created_at",
    )

    __table_args__ = (
        Index(
            "idx_tb_documentos_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_l2_ops"},
            postgresql_with={"m": 16, "ef_construction": 200},
        ),
    )

    def __repr__(self):
        return f"<DocumentVector(id={self.id}, content_snippet={self.content[:30]!r})>"

    @classmethod
    def create(
        cls,
        db: Session,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "DocumentVector":
        """
        Cria e persiste um novo registro de DocumentVector.

        :param db: SessÃ£o do SQLAlchemy
        :param content: Texto do documento ou chunk
        :param embedding: Vetor de embedding como lista de floats
        :param metadata: DicionÃ¡rio de metadados adicionais
        :return: InstÃ¢ncia de DocumentVector persistida
        """
        obj = cls(content=content, embedding=embedding, doc_metadata=metadata or {})
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @classmethod
    async def create_async(
        cls,
        db: AsyncSession,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "DocumentVector":
        """
        Cria e persiste um novo registro de DocumentVector de forma assÃ­ncrona.

        :param db: SessÃ£o do SQLAlchemy assÃ­ncrona
        :param content: Texto do documento ou chunk
        :param embedding: Vetor de embedding como lista de floats
        :param metadata: DicionÃ¡rio de metadados adicionais
        :return: InstÃ¢ncia de DocumentVector persistida
        """
        obj = cls(content=content, embedding=embedding, doc_metadata=metadata or {})
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    @classmethod
    async def search_similar(
        cls,
        db: AsyncSession,
        query_embedding: List[float],
        limit: int = 10,
        threshold: float = 0.7,
    ) -> List["DocumentVector"]:
        """
        Busca documentos similares usando similaridade de cosseno.
        """
        stmt = (
            select(cls)
            .order_by(cls.embedding.cosine_distance(query_embedding))
            .limit(limit)
        )

        result = await db.execute(stmt)
        return result.scalars().all()
