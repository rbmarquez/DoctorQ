import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, relationship

from src.models.base import Base

if TYPE_CHECKING:
    from src.models.agent import Agent
    from src.models.tool import Tool

__all__ = ["AgentTool"]


class AgentTool(Base):
    """Modelo para a tabela de relacionamento agent-tools"""

    __tablename__ = "tb_agente_tools"

    id_agente_tool = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_agente_tool",
    )
    id_agente = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_agentes.id_agente", ondelete="CASCADE"),
        nullable=False,
        name="id_agente",
    )
    id_tool = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_tools.id_tool", ondelete="CASCADE"),
        nullable=False,
        name="id_tool",
    )
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
    # agent: Mapped["Agent"] = relationship("Agent", back_populates="agent_tools")
    # tool: Mapped["Tool"] = relationship("Tool", back_populates="agent_tools")

    def __repr__(self):
        return f"<AgentTool(id={self.id_agente_tool}, agent_id={self.id_agente}, tool_id={self.id_tool})>"

    def __str__(self):
        return f"AgentTool(agent_id={self.id_agente}, tool_id={self.id_tool})"
