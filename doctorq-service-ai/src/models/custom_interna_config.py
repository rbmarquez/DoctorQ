# src/models/custom_interna_config.py
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class CustomInternaParameter(BaseModel):
    """ParÃ¢metro para chamada de serviÃ§o interno"""

    name: str = Field(..., description="Nome do parÃ¢metro")
    type: Literal["string", "integer", "boolean", "number"] = Field(
        ..., description="Tipo do parÃ¢metro"
    )
    description: str = Field(..., description="DescriÃ§Ã£o do parÃ¢metro")
    required: bool = Field(False, description="Se o parÃ¢metro Ã© obrigatÃ³rio")
    default_value: Optional[Any] = Field(None, description="Valor padrÃ£o")


class CustomInternaServiceConfig(BaseModel):
    """ConfiguraÃ§Ã£o do serviÃ§o interno"""

    service_class: str = Field(..., description="Nome da classe do serviÃ§o")
    method_name: str = Field(..., description="Nome do mÃ©todo a ser chamado")
    parameters: List[CustomInternaParameter] = Field(
        default_factory=list, description="ParÃ¢metros do mÃ©todo"
    )
    is_async: bool = Field(True, description="Se o mÃ©todo Ã© assÃ­ncrono")
    requires_db: bool = Field(False, description="Se o serviÃ§o precisa de sessÃ£o de DB")


class CustomInternaToolConfig(BaseModel):
    """ConfiguraÃ§Ã£o completa para um tool de serviÃ§o interno"""

    name: str = Field(..., description="Nome do tool")
    description: str = Field(..., description="DescriÃ§Ã£o do que o tool faz")
    service: CustomInternaServiceConfig = Field(
        ..., description="ConfiguraÃ§Ã£o do serviÃ§o"
    )
    response_format: Optional[str] = Field(
        None, description="Formato esperado da resposta"
    )


class CustomInternaCallRequest(BaseModel):
    """Request para executar chamada de serviÃ§o interno"""

    tool_id: str = Field(..., description="ID do tool")
    parameters: Dict[str, Any] = Field(
        default_factory=dict, description="ParÃ¢metros para a chamada"
    )


class CustomInternaCallResponse(BaseModel):
    """Resposta da chamada de serviÃ§o interno"""

    success: bool = Field(..., description="Se a chamada foi bem-sucedida")
    data: Optional[Any] = Field(None, description="Dados retornados")
    error: Optional[str] = Field(None, description="Mensagem de erro")
    execution_time: Optional[float] = Field(
        None, description="Tempo de execuÃ§Ã£o em segundos"
    )
