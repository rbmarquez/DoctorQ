# src/models/agent_schemas.py
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class TipoMemoria(str, Enum):
    """Tipos de memÃ³ria suportados"""

    CONVERSATION_BUFFER = "conversation_buffer"
    CONVERSATION_SUMMARY = "conversation_summary"
    CONVERSATION_BUFFER_WINDOW = "conversation_buffer_window"
    CONVERSATION_TOKEN_BUFFER = "conversation_token_buffer"


class TipoObservabilidade(str, Enum):
    """Tipos de observabilidade suportados"""

    LANGFUSE = "langfuse"


class ModelConfig(BaseModel):
    """Schema para configuraÃ§Ã£o do modelo de IA"""

    id_credencial: Optional[str] = Field(None, description="ID da credencial do modelo")
    temperature: Optional[float] = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Temperatura do modelo (0.0 = determinÃ­stico, 1.0 = criativo)",
    )
    top_p: Optional[float] = Field(
        0.95,
        ge=0.0,
        le=1.0,
        description="Top P - Nucleus sampling (controla diversidade)",
    )
    max_tokens: Optional[int] = Field(
        4000, ge=1, le=32000, description="MÃ¡ximo de tokens na resposta"
    )
    stream: Optional[bool] = Field(
        True, description="Habilitar streaming das respostas"
    )
    timeout: Optional[float] = Field(
        300.0,
        ge=1.0,
        le=3600.0,
        description="Timeout em segundos para requisiÃ§Ãµes (1-3600s)",
    )


class ObservabilityConfig(BaseModel):
    """Schema para configuraÃ§Ã£o de observabilidade"""

    ativo: bool = Field(False, description="Observabilidade ativa")
    credencialId: Optional[str] = Field(
        None, description="ID da credencial de observabilidade"
    )
    tipo: Optional[TipoObservabilidade] = Field(
        None, description="Tipo de observabilidade"
    )


class MemoryConfig(BaseModel):
    """Schema para configuraÃ§Ã£o de memÃ³ria do agente"""

    ativo: bool = Field(False, description="MemÃ³ria ativa")
    tipo: Optional[TipoMemoria] = Field(None, description="Tipo de memÃ³ria")
    credencialId: Optional[str] = Field(
        None, description="ID da credencial Redis para memÃ³ria"
    )
    configuracao: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="ConfiguraÃ§Ã£o especÃ­fica da memÃ³ria"
    )

    @validator("configuracao")
    def validate_configuracao(cls, v, values):  # pylint: disable=no-self-argument
        """Validar configuraÃ§Ã£o baseada no tipo de memÃ³ria"""
        if not v:
            return {}

        tipo_memoria = values.get("tipo")
        if tipo_memoria == TipoMemoria.CONVERSATION_BUFFER_WINDOW:
            # Validar que tem k (janela)
            if "k" not in v or not isinstance(v["k"], int) or v["k"] <= 0:
                raise ValueError("MemÃ³ria buffer window requer 'k' (inteiro positivo)")

        elif tipo_memoria == TipoMemoria.CONVERSATION_TOKEN_BUFFER:
            # Validar que tem max_token_limit
            if (
                "max_token_limit" not in v
                or not isinstance(v["max_token_limit"], int)
                or v["max_token_limit"] <= 0
            ):
                raise ValueError(
                    "MemÃ³ria token buffer requer 'max_token_limit' (inteiro positivo)"
                )

        return v


class ToolConfig(BaseModel):
    """Schema para configuraÃ§Ã£o de uma ferramenta"""

    id: str = Field(..., description="ID Ãºnico da ferramenta")
    nome: str = Field(..., description="Nome da ferramenta")
    ativo: bool = Field(True, description="Ferramenta ativa")
    configuracao: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="ConfiguraÃ§Ã£o especÃ­fica da ferramenta"
    )


class Knowledge(BaseModel):
    """Schema para uma base de conhecimento"""

    credentialId: str = Field(..., description="ID da credencial Qdrant")



class DocumentStore(BaseModel):
    """Schema para um Document Store configurado"""

    documentStoreId: str = Field(..., description="ID do Document Store")
    topK: int = Field(
        5, ge=1, le=20, description="Número de chunks a retornar"
    )
    enableEmbeddings: bool = Field(
        False, description="Usar busca por embeddings"
    )
    embeddingCredentialId: Optional[str] = Field(
        None, description="ID da credencial para embeddings"
    )

class KnowledgeConfig(BaseModel):
    """Schema para configuraÃ§Ã£o de base de conhecimento vector"""

    ativo: bool = Field(False, description="Base de conhecimento ativa")
    knowledges: List[Knowledge] = Field(
        default_factory=list, description="Lista de bases de conhecimento configuradas"
    )
    documentStores: List[DocumentStore] = Field(
        default_factory=list, description="Lista de Document Stores configurados"
    )


class AgenteConfigSchema(BaseModel):
    """Schema completo para configuraÃ§Ã£o do agente (ds_config)"""

    tools: List[ToolConfig] = Field(
        default_factory=list, description="Lista de ferramentas configuradas"
    )
    model: Union[str, ModelConfig] = Field(..., description="ConfiguraÃ§Ã£o do modelo de IA")
    observability: Optional[ObservabilityConfig] = Field(
        None, description="ConfiguraÃ§Ã£o de observabilidade"
    )
    memory: MemoryConfig = Field(..., description="ConfiguraÃ§Ã£o de memÃ³ria")
    knowledge: KnowledgeConfig = Field(
        ..., description="ConfiguraÃ§Ã£o de base de conhecimento"
    )

    @validator("tools")
    def validate_tools(cls, v):  # pylint: disable=no-self-argument
        """Validar lista de ferramentas"""
        if not isinstance(v, list):
            raise ValueError("Tools deve ser uma lista")

        # Verificar IDs Ãºnicos
        tool_ids = [tool.id for tool in v if hasattr(tool, "id")]
        if len(tool_ids) != len(set(tool_ids)):
            raise ValueError("IDs das ferramentas devem ser Ãºnicos")

        return v


    @validator("model", pre=True)
    def convert_model(cls, v):  # pylint: disable=no-self-argument
        """Converter string para ModelConfig ou retornar ModelConfig existente"""
        if isinstance(v, str):
            # Criar ModelConfig básico a partir de string
            return ModelConfig(id_credencial=v)
        elif isinstance(v, dict):
            # Se for dict, criar ModelConfig
            return ModelConfig(**v)
        return v
    @validator("observability", pre=True, always=True)
    def validate_observability(cls, v):  # pylint: disable=no-self-argument
        """Garantir que observability nÃ£o seja None"""
        if v is None:
            return ObservabilityConfig()
        return v

    @validator("memory", pre=True, always=True)
    def validate_memory(cls, v):  # pylint: disable=no-self-argument
        """Garantir que memory nÃ£o seja None"""
        if v is None:
            return MemoryConfig()
        return v

    @validator("knowledge", pre=True, always=True)
    def validate_knowledge(cls, v):  # pylint: disable=no-self-argument
        """Garantir que knowledge nÃ£o seja None"""
        if v is None:
            return KnowledgeConfig()
        return v

    class Config:
        """ConfiguraÃ§Ã£o do schema"""

        extra = "ignore"  # Ignorar campos extras
        validate_assignment = True


class AgenteConfigFactory:
    """Factory para criar e validar configuraÃ§Ãµes de agente"""

    @classmethod
    def create_default_config(cls) -> AgenteConfigSchema:
        """Criar configuraÃ§Ã£o padrÃ£o para novos agentes"""
        return AgenteConfigSchema(
            tools=[],
            model=ModelConfig(
                id_credencial="",
                temperature=0.7,
                top_p=0.95,
                max_tokens=4000,
                stream=True,
            ),
            observability=ObservabilityConfig(ativo=False),
            memory=MemoryConfig(ativo=False),
            knowledge=KnowledgeConfig(ativo=False),
        )

    @classmethod
    def create_chat_config(
        cls, credencial_id: str, redis_credencial_id: Optional[str] = None
    ) -> AgenteConfigSchema:
        """Criar configuraÃ§Ã£o otimizada para chat"""
        return AgenteConfigSchema(
            tools=[],
            model=ModelConfig(
                id_credencial=credencial_id,
                temperature=0.7,
                top_p=0.95,
                max_tokens=2000,
                stream=True,
            ),
            observability=ObservabilityConfig(ativo=False),
            memory=MemoryConfig(
                ativo=True,
                tipo=TipoMemoria.CONVERSATION_BUFFER_WINDOW,
                credencialId=redis_credencial_id,  # Pode ser None para usar configuraÃ§Ãµes padrÃ£o
                configuracao={"k": 5},
            ),
            knowledge=KnowledgeConfig(ativo=False),
        )

    @classmethod
    def create_analysis_config(cls, credencial_id: str) -> AgenteConfigSchema:
        """Criar configuraÃ§Ã£o otimizada para anÃ¡lise"""
        return AgenteConfigSchema(
            tools=[],
            model=ModelConfig(
                id_credencial=credencial_id,
                temperature=0.3,
                top_p=0.9,
                max_tokens=8000,
                stream=False,
            ),
            observability=ObservabilityConfig(ativo=True),
            memory=MemoryConfig(ativo=False),
            knowledge=KnowledgeConfig(ativo=False),
        )

    @classmethod
    def validate_config(cls, config_dict: Dict[str, Any]) -> AgenteConfigSchema:
        """Validar e criar objeto de configuraÃ§Ã£o a partir de dicionÃ¡rio"""
        try:
            return AgenteConfigSchema(**config_dict)
        except Exception as e:
            raise ValueError(f"ConfiguraÃ§Ã£o de agente invÃ¡lida: {str(e)}") from e

    @classmethod
    def get_memory_types(cls) -> List[str]:
        """Obter lista de tipos de memÃ³ria suportados"""
        return [tipo.value for tipo in TipoMemoria]

    @classmethod
    def get_observability_types(cls) -> List[str]:
        """Obter lista de tipos de observabilidade suportados"""
        return [tipo.value for tipo in TipoObservabilidade]

    @classmethod
    def get_default_memory_config(cls, tipo: TipoMemoria) -> Dict[str, Any]:
        """Obter configuraÃ§Ã£o padrÃ£o para tipo de memÃ³ria especÃ­fico"""
        configs = {
            TipoMemoria.CONVERSATION_BUFFER: {},
            TipoMemoria.CONVERSATION_SUMMARY: {"max_token_limit": 2000},
            TipoMemoria.CONVERSATION_BUFFER_WINDOW: {"k": 5},
            TipoMemoria.CONVERSATION_TOKEN_BUFFER: {"max_token_limit": 2000},
        }
        return configs.get(tipo, {})
