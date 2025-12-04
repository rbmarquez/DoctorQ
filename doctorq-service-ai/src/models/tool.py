# src/models/tool.py
import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, relationship

from src.models.base import Base

if TYPE_CHECKING:
    from src.models.agent import Agent
    from src.models.agent_tool import AgentTool


class ToolType(str, Enum):
    """Enum para tipos de tools"""

    API = "api"
    FUNCTION = "function"
    EXTERNAL = "external"
    RAG = "rag"
    RAG_QDRANT = "rag_qdrant"
    RAG_POSTGRES = "rag_postgres"
    CUSTOM_INTERNA = "custom_interna"
    MCP = "mcp"


class Tool(Base):
    """Modelo para a tabela de tools"""

    __tablename__ = "tb_tools"

    id_tool = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_tool",
    )
    nm_tool = Column(String, nullable=False, name="nm_tool", unique=True)
    ds_tool = Column(Text, nullable=True, name="ds_tool")
    # 'api', 'function', 'external', 'rag', 'custom_interna'
    tp_tool = Column(String, nullable=False, name="tp_tool")
    # ConfiguraÃ§Ãµes especÃ­ficas
    config_tool = Column(JSON, nullable=False, name="config_tool")
    st_ativo = Column(Boolean, nullable=False, default=True, name="st_ativo")
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    # Relacionamentos
    # TEMPORARIAMENTE COMENTADO - Causando erro no mapper
    # agent_tools: Mapped[List["AgentTool"]] = relationship(
    #     "AgentTool", back_populates="tool", cascade="all, delete-orphan"
    # )

    # Relacionamento many-to-many com Agent atravÃ©s de AgentTool
    # TEMPORARIAMENTE COMENTADO - Causando erro no mapper
    # agents: Mapped[List["Agent"]] = relationship(
    #     "Agent", secondary="tb_agente_tools", back_populates="tools", viewonly=True
    # )

    @property
    def st_ativo_str(self) -> str:
        """Converter boolean para string para compatibilidade"""
        return "S" if self.st_ativo else "N"

    def __repr__(self):
        return f"<Tool(id_tool={self.id_tool}, nm_tool='{self.nm_tool}', tp_tool='{self.tp_tool}', st_ativo={self.st_ativo})>"


# Pydantic Models para API
class ToolBase(BaseModel):
    """Schema base para Tool"""

    nm_tool: str = Field(..., description="Nome do tool")
    ds_tool: Optional[str] = Field(None, description="DescriÃ§Ã£o do tool")
    tp_tool: ToolType = Field(..., description="Tipo do tool")
    config_tool: Dict = Field(..., description="ConfiguraÃ§Ãµes do tool")
    st_ativo: bool = Field(True, description="Status ativo")


class ToolCreate(ToolBase):
    """Schema para criar um Tool"""


class ToolUpdate(BaseModel):
    """Schema para atualizar um Tool"""

    nm_tool: Optional[str] = Field(None, description="Nome do tool")
    ds_tool: Optional[str] = Field(None, description="DescriÃ§Ã£o do tool")
    tp_tool: Optional[ToolType] = Field(None, description="Tipo do tool")
    config_tool: Optional[Dict] = Field(None, description="ConfiguraÃ§Ãµes do tool")
    st_ativo: Optional[bool] = Field(None, description="Status ativo")


class ToolResponse(ToolBase):
    """Schema de resposta para Tool"""

    id_tool: uuid.UUID = Field(..., description="ID Ãºnico do tool")
    dt_criacao: datetime = Field(..., description="Data de criaÃ§Ã£o")
    dt_atualizacao: datetime = Field(..., description="Data de atualizaÃ§Ã£o")

    class Config:
        from_attributes = True


class ToolListResponse(BaseModel):
    """Schema para lista de tools"""

    items: List[ToolResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(cls, tools: List["Tool"], total: int, page: int, size: int):
        """Criar resposta de paginaÃ§Ã£o"""
        total_pages = (total + size - 1) // size

        items = [ToolResponse.model_validate(tool) for tool in tools]

        return cls(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            },
        )
