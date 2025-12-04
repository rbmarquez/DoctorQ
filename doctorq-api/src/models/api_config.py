# src/models/api_config.py
import uuid
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class HttpMethod(str, Enum):
    """MÃ©todos HTTP suportados"""

    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


class AuthType(str, Enum):
    """Tipos de autenticaÃ§Ã£o suportados"""

    NONE = "none"
    BEARER = "bearer"
    API_KEY = "api_key"
    BASIC = "basic"
    CUSTOM = "custom"


class ApiAuthConfig(BaseModel):
    """ConfiguraÃ§Ã£o de autenticaÃ§Ã£o da API"""

    type: AuthType = Field(..., description="Tipo de autenticaÃ§Ã£o")
    token: Optional[str] = Field(None, description="Token de autenticaÃ§Ã£o")
    api_key: Optional[str] = Field(None, description="Chave da API")
    api_key_header: Optional[str] = Field(
        None, description="Nome do header para API key"
    )
    username: Optional[str] = Field(
        None, description="UsuÃ¡rio para autenticaÃ§Ã£o bÃ¡sica"
    )
    password: Optional[str] = Field(None, description="Senha para autenticaÃ§Ã£o bÃ¡sica")
    # Campos para autenticaÃ§Ã£o customizada
    custom_header_name: Optional[str] = Field(
        None, description="Nome do header customizado"
    )
    custom_header_value: Optional[str] = Field(
        None, description="Valor do header customizado"
    )


class ApiParameter(BaseModel):
    """ParÃ¢metro da API"""

    name: str = Field(..., description="Nome do parÃ¢metro")
    type: Literal["string", "integer", "boolean", "number"] = Field(
        ..., description="Tipo do parÃ¢metro"
    )
    description: str = Field(..., description="DescriÃ§Ã£o do parÃ¢metro")
    required: bool = Field(False, description="Se o parÃ¢metro Ã© obrigatÃ³rio")
    default_value: Optional[Any] = Field(None, description="Valor padrÃ£o")
    location: Literal["query", "body", "path", "header"] = Field(
        "query", description="LocalizaÃ§Ã£o do parÃ¢metro"
    )


class ApiEndpointConfig(BaseModel):
    """ConfiguraÃ§Ã£o de endpoint da API"""

    url: str = Field(..., description="URL do endpoint")
    method: HttpMethod = Field(HttpMethod.GET, description="MÃ©todo HTTP")
    headers: Optional[Dict[str, str]] = Field(None, description="Headers adicionais")
    parameters: List[ApiParameter] = Field(
        default_factory=list, description="ParÃ¢metros da API"
    )
    timeout: int = Field(120, description="Timeout em segundos")
    max_retries: int = Field(3, description="NÃºmero mÃ¡ximo de tentativas")


class ApiToolConfig(BaseModel):
    """ConfiguraÃ§Ã£o completa para um tool de API"""

    auth: ApiAuthConfig = Field(..., description="ConfiguraÃ§Ã£o de autenticaÃ§Ã£o")
    endpoint: ApiEndpointConfig = Field(..., description="ConfiguraÃ§Ã£o do endpoint")
    response_format: Optional[str] = Field(
        None, description="Formato esperado da resposta"
    )


class ApiCallRequest(BaseModel):
    """Request para executar chamada de API"""

    tool_id: uuid.UUID = Field(..., description="ID do tool")
    parameters: Dict[str, Any] = Field(
        default_factory=dict, description="ParÃ¢metros para a chamada"
    )


class ApiCallResponse(BaseModel):
    """Resposta da chamada de API"""

    success: bool = Field(..., description="Se a chamada foi bem-sucedida")
    data: Optional[Any] = Field(None, description="Dados retornados")
    error: Optional[str] = Field(None, description="Mensagem de erro")
    status_code: Optional[int] = Field(None, description="CÃ³digo de status HTTP")
    execution_time: Optional[float] = Field(
        None, description="Tempo de execuÃ§Ã£o em segundos"
    )
