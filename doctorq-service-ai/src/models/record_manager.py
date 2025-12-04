# src/models/record_manager.py
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel as PydanticBaseModel
from pydantic import Field
from sqlalchemy import TIMESTAMP, UUID, Column, Index, String
from sqlalchemy.sql import func

from src.models.base import BaseModel as SQLAlchemyBaseModel


class RecordManagerModel(SQLAlchemyBaseModel):
    """Modelo SQLAlchemy para Record Manager do LangChain"""

    __tablename__ = "tb_record_manager"

    # Sobrescrever o id padrÃ£o do BaseModel para usar id_record
    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, name="id_record"
    )
    namespace = Column(String(255), nullable=False, name="namespace")
    key = Column(String(1000), nullable=False, name="key")
    group_id = Column(String(255), nullable=True, name="group_id")
    updated_at = Column(
        TIMESTAMP, nullable=False, default=func.now(), name="updated_at"
    )
    created_at = Column(
        TIMESTAMP, nullable=False, default=func.now(), name="created_at"
    )

    # Propriedade para compatibilidade
    @property
    def id_record(self):
        return self.id

    __table_args__ = (
        # Constraint Ãºnico para namespace + key
        Index("uk_record_manager_namespace_key", "namespace", "key", unique=True),
        # Ãndices para performance
        Index("idx_record_manager_namespace", "namespace"),
        Index("idx_record_manager_namespace_updated_at", "namespace", "updated_at"),
        Index("idx_record_manager_group_id", "group_id"),
        Index("idx_record_manager_namespace_group_id", "namespace", "group_id"),
    )


# =============================================================================
# Schemas Pydantic
# =============================================================================


class RecordManagerBase(PydanticBaseModel):
    """Schema base para Record Manager"""

    namespace: str = Field(..., description="Namespace do record manager")
    key: str = Field(..., description="Chave Ãºnica do record")
    group_id: Optional[str] = Field(None, description="ID do grupo (opcional)")


class RecordManagerCreate(RecordManagerBase):
    """Schema para criaÃ§Ã£o de Record Manager"""


class RecordManagerUpdate(PydanticBaseModel):
    """Schema para atualizaÃ§Ã£o de Record Manager"""

    group_id: Optional[str] = Field(None, description="ID do grupo (opcional)")
    # updated_at serÃ¡ automaticamente atualizado pelo trigger


class RecordManagerResponse(RecordManagerBase):
    """Schema de resposta para Record Manager"""

    id: uuid.UUID = Field(..., description="ID Ãºnico do record")
    updated_at: datetime = Field(..., description="Timestamp da Ãºltima atualizaÃ§Ã£o")
    created_at: datetime = Field(..., description="Timestamp de criaÃ§Ã£o")

    # Propriedade para compatibilidade
    @property
    def id_record(self):
        return self.id

    class Config:
        from_attributes = True


class RecordManagerListFilter(PydanticBaseModel):
    """Schema para filtros de listagem de records"""

    namespace: str = Field(..., description="Namespace obrigatÃ³rio")
    before: Optional[float] = Field(
        None, description="Filtrar records atualizados antes deste timestamp"
    )
    after: Optional[float] = Field(
        None, description="Filtrar records atualizados depois deste timestamp"
    )
    group_ids: Optional[list[str]] = Field(
        None, description="Filtrar por group_ids especÃ­ficos"
    )
    limit: Optional[int] = Field(None, description="Limite de registros retornados")
