# src/models/credencial_schemas.py
from enum import Enum
from typing import Optional, Union

from pydantic import BaseModel, Field


class TipoCredencial(str, Enum):
    """Types of supported credentials"""

    POSTGRESQL_API = "postgresqlApi"
    REDIS_API = "redisApi"
    FLOWISE_API = "flowiseApi"
    AZURE_OPENAI_CHAT_API = "azureOpenIaChatApi"
    AZURE_OPENAI_EMBED_API = "azureOpenIaEmbbedApi"
    LANGFUSE_API = "langfuseApi"
    OPEN_IA = "openIaApi"
    QDRANT_API = "qdrantApi"
    MINIO = "minIOApi"
    MICROSOFT_GRAPH_API = "microsoftGraphApi"
    SHAREPOINT_FOLDER = "sharepointFolderApi"
    SEI_API = "seiApi"


class PostgreSQLCredencial(BaseModel):
    """PostgreSQL database credentials for RAG"""

    host: str = Field(..., description="Database host")
    port: int = Field(5432, description="Port number", ge=1, le=65535)
    database: str = Field(..., description="Database name")
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")
    schema_name: Optional[str] = Field(
        "public", description="Schema name", alias="schema"
    )


class QdrantCredencial(BaseModel):
    """Qdrant database credentials"""

    server_url: str = Field(..., description="Qdrant Server URL (with port)")
    api_key: Optional[str] = Field(None, description="API Key")


class RedisCredencial(BaseModel):
    """Redis credentials"""

    host: str = Field(..., description="Redis URL")
    port: int = Field(6379, description="Port number", ge=1, le=65535)
    password: Optional[str] = Field(None, description="Password")
    database: int = Field(0, description="Database number", ge=0)


class MinioCredencial(BaseModel):
    """MinIO credentials"""

    endpoint: str = Field(..., description="MinIO endpoint")
    access_key: str = Field(..., description="Access key")
    secret_key: str = Field(..., description="Secret key")
    bucket_name: Optional[str] = Field(None, description="Default bucket name")


class MicrosoftGraphCredencial(BaseModel):
    """Microsoft Graph API credentials"""

    tenant_id: str = Field(..., description="Azure AD Tenant ID")
    client_id: str = Field(..., description="Azure AD Application (Client) ID")
    client_secret: str = Field(..., description="Azure AD Client Secret")
    graph_url: Optional[str] = Field(
        "https://graph.microsoft.com/v1.0", description="Microsoft Graph API URL"
    )
    scopes: Optional[str] = Field(
        "https://graph.microsoft.com/.default", description="Graph API scopes"
    )
    authority: Optional[str] = Field(
        "https://login.microsoftonline.com", description="Authority URL"
    )


class SharepointFolderCredencial(BaseModel):
    """SharePoint Folder credentials"""

    tenant_name: str = Field(..., description="Azure AD Tenant ID")
    site_url: str = Field(..., description="SharePoint site URL")
    site_name: Optional[str] = Field(None, description="SharePoint site name")
    folder_path: str = Field(..., description="Folder path within SharePoint")


class SeiCredencial(BaseModel):
    """SEI credentials"""

    url: str = Field(..., description="SEI URL")
    usuario: str = Field(..., description="Username")
    senha: str = Field(..., description="Password")


class OpenIACredencial(BaseModel):
    """OpenAI API credentials"""

    api_key: str = Field(..., description="API Key")
    model_name: str = Field("gpt-4", description="Model name")
    base_url: Optional[str] = Field(
        "https://api.openai.com/v1", description="Base URL for OpenAI API"
    )


class FlowiseCredencial(BaseModel):
    """Flowise API credentials"""

    url: str = Field(..., description="Flowise API URL")
    api_key: str = Field(..., description="API Key")
    chatflow_id: Optional[str] = Field(None, description="Default Chatflow ID")


class AzureOpenAIChatCredencial(BaseModel):
    """Azure OpenAI Chat API credentials"""

    endpoint: str = Field(..., description="Azure OpenAI endpoint")
    api_key: str = Field(..., description="API Key")
    api_version: str = Field("2024-02-01", description="API Version")
    deployment_name: str = Field(..., description="Deployment name")
    model_name: str = Field("gpt-4", description="Model name")


class AzureOpenAIEmbedCredencial(BaseModel):
    """Azure OpenAI Embedding API credentials"""

    endpoint: str = Field(..., description="Azure OpenAI endpoint")
    api_key: str = Field(..., description="API Key")
    api_version: str = Field("2024-02-01", description="API Version")
    deployment_name: str = Field(..., description="Deployment name")


class LangfuseCredencial(BaseModel):
    """Langfuse API credentials"""

    host: str = Field("https://cloud.langfuse.com", description="Langfuse host")
    public_key: str = Field(..., description="Public key")
    secret_key: str = Field(..., description="Secret key")
    project_id: Optional[str] = Field(None, description="Project ID")


# Union type for all credential types
CredencialData = Union[
    RedisCredencial,
    FlowiseCredencial,
    AzureOpenAIChatCredencial,
    AzureOpenAIEmbedCredencial,
    LangfuseCredencial,
    OpenIACredencial,
    QdrantCredencial,
    PostgreSQLCredencial,
    MinioCredencial,
    MicrosoftGraphCredencial,
    SharepointFolderCredencial,
    SeiCredencial,
]


class CredencialFactory:
    """Factory to create and validate credential objects"""

    _credential_mapping = {
        TipoCredencial.POSTGRESQL_API: PostgreSQLCredencial,
        TipoCredencial.REDIS_API: RedisCredencial,
        TipoCredencial.FLOWISE_API: FlowiseCredencial,
        TipoCredencial.AZURE_OPENAI_CHAT_API: AzureOpenAIChatCredencial,
        TipoCredencial.AZURE_OPENAI_EMBED_API: AzureOpenAIEmbedCredencial,
        TipoCredencial.LANGFUSE_API: LangfuseCredencial,
        TipoCredencial.OPEN_IA: OpenIACredencial,
        TipoCredencial.QDRANT_API: QdrantCredencial,
        TipoCredencial.MINIO: MinioCredencial,
        TipoCredencial.MICROSOFT_GRAPH_API: MicrosoftGraphCredencial,
        TipoCredencial.SHAREPOINT_FOLDER: SharepointFolderCredencial,
        TipoCredencial.SEI_API: SeiCredencial,
    }

    @classmethod
    def create_credencial(cls, tipo: str, dados: dict) -> CredencialData:
        """Create credential object based on type"""
        try:
            tipo_enum = TipoCredencial(tipo)
            credential_class = cls._credential_mapping[tipo_enum]
            return credential_class(**dados)
        except ValueError as e:
            raise ValueError(f"Tipo de credencial nÃ£o suportado: {tipo}") from e
        except Exception as e:
            raise ValueError(f"Erro ao validar credencial: {str(e)}") from e

    @classmethod
    def get_supported_types(cls) -> list[str]:
        """Get list of supported credential types"""
        return [tipo.value for tipo in TipoCredencial]
