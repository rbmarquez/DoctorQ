from sqlalchemy import Boolean, Column, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from src.models.base import BaseModel, TimestampMixin


class MCP(BaseModel, TimestampMixin):
    __tablename__ = "tb_mcp"

    nm_mcp = Column(String(255), unique=True, nullable=False, index=True)
    ds_mcp = Column(Text, nullable=True)

    command = Column(String(500), nullable=False)
    arguments = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
    env_variables = Column(JSONB, nullable=False, server_default="'{}'::jsonb")
    st_ativo = Column(Boolean, nullable=False, server_default="true")

    config_mcp = Column(JSONB, nullable=False)
    capabilities = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
