from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class MCPBase(BaseModel):
    nm_mcp: str
    ds_mcp: Optional[str]
    command: str
    arguments: List[str] = []
    env_variables: Dict[str, str] = {}
    st_ativo: bool = True
    config_mcp: Dict[str, Any]
    capabilities: List[str] = []


class MCPCreate(MCPBase):
    pass


class MCPUpdate(BaseModel):
    nm_mcp: Optional[str] = None
    ds_mcp: Optional[str] = None
    command: Optional[str] = None
    arguments: Optional[List[str]] = None
    env_variables: Optional[Dict[str, str]] = None
    st_ativo: Optional[bool] = None
    config_mcp: Optional[Dict[str, Any]] = None
    capabilities: Optional[List[str]] = None


class MCPRead(MCPBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MCPClientRequest(BaseModel):
    mcp_id: UUID
    query: str


class MCPClientResponse(BaseModel):
    mcp_id: UUID
    original_query: str
    response_data: Any
    capabilities: List[str] = []
