import json
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional, TypedDict, Union

from pydantic import BaseModel, Field, validator
from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text, func, ARRAY
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, relationship

from src.models.agent_schemas import AgenteConfigFactory, AgenteConfigSchema
from src.models.base import Base

if TYPE_CHECKING:
    from src.models.agent_tool import AgentTool
    from src.models.tool import Tool
    from src.models.agent_document_store import AgentDocumentStore
    from src.models.documento_store import DocumentoStore

__all__ = [
    "Agent",
    "AgentBase",
    "AgentCreate",
    "AgentUpdate",
    "AgentResponse",
    "AgentListResponse",
    "AgentConfigDict",
    "exemplo_uso_agent_config_dict",
]


# Tipo especÃ­fico para ds_config
class AgentConfigDict(TypedDict, total=False):
    """Tipo especÃ­fico para o campo ds_config do agente"""

    tools: List[Dict[str, Any]]
    model: Dict[str, Any]
    observability: Optional[Dict[str, Any]]
    memory: Dict[str, Any]
    knowledge: Dict[str, Any]


class Agent(Base):
    """Modelo para a tabela agent"""

    __tablename__ = "tb_agentes"

    id_agente = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_agente",
    )
    nm_agente = Column(String(255), nullable=False, name="nm_agente")
    ds_agente = Column(Text, nullable=True, name="ds_agente")
    ds_tipo = Column(String(50), nullable=True, default="assistant", name="ds_tipo")
    nm_modelo = Column(String(100), nullable=True, default="gpt-4", name="nm_modelo")
    nm_provider = Column(String(50), nullable=True, default="openai", name="nm_provider")
    nr_temperature = Column(Numeric(3, 2), nullable=True, default=0.7, name="nr_temperature")
    nr_max_tokens = Column(Integer, nullable=True, default=2000, name="nr_max_tokens")
    ds_system_prompt = Column(Text, nullable=True, name="ds_system_prompt")
    ds_prompt_template = Column(Text, nullable=True, name="ds_prompt_template")
    ds_tools = Column(ARRAY(Text), nullable=True, name="ds_tools")
    st_ativo = Column(Boolean, nullable=True, default=True, name="st_ativo")
    st_principal = Column(Boolean, nullable=True, default=False, name="st_principal")
    ds_config: Optional[AgentConfigDict] = Column(
        JSON, nullable=True, default={}, name="ds_config"
    )  # JSON object com tipo especÃ­fico

    # Campo para multi-tenancy
    id_empresa = Column(
        UUID(as_uuid=True),
        nullable=True,  # Nullable para permitir agentes globais
        name="id_empresa",
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
    # agent_tools: Mapped[List["AgentTool"]] = relationship(
    #     "AgentTool", back_populates="agent", cascade="all, delete-orphan"
    # )

    # Relacionamento many-to-many com Tool atravÃ©s de AgentTool
    # TEMPORARIAMENTE COMENTADO - Causando erro no mapper
    # tools: Mapped[List["Tool"]] = relationship(
    #     "Tool", secondary="tb_agente_tools", back_populates="agents", viewonly=True
    # )

    # Relacionamento com DocumentStores
    # Nota: Comentado temporariamente - AgentDocumentStore não está configurado ainda
    # agent_document_stores: Mapped[List["AgentDocumentStore"]] = relationship(
    #     "AgentDocumentStore", back_populates="agent", cascade="all, delete-orphan", lazy="select"
    # )

    # Relacionamento many-to-many com DocumentoStore através de AgentDocumentStore
    # Nota: Comentado temporariamente até AgentDocumentStore estar configurado
    # document_stores: Mapped[List["DocumentoStore"]] = relationship(
    #     "DocumentoStore", secondary="tb_agent_document_stores", back_populates="agents", viewonly=True, lazy="select"
    # )

    def __repr__(self):
        return f"<Agent(id_agente={self.id_agente}, nm_agente='{self.nm_agente}')>"

    @property
    def ds_prompt(self) -> Optional[str]:
        """Alias para ds_system_prompt para compatibilidade com Pydantic schemas"""
        return self.ds_system_prompt

    @property
    def config_obj(self) -> Optional[AgenteConfigSchema]:
        """Converter ds_config para objeto validado"""
        if not self.ds_config:
            return None

        try:
            # Se ds_config jÃ¡ Ã© um dict (vem do JSON do banco)
            if isinstance(self.ds_config, dict):
                return AgenteConfigSchema(**self.ds_config)

            # Se ds_config Ã© uma string (fallback)
            config_dict = json.loads(self.ds_config)
            return AgenteConfigSchema(**config_dict)
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            # Log do erro mas nÃ£o falha
            import logging

            logger = logging.getLogger(__name__)
            logger.warning(f"Erro ao parsear ds_config do agente {self.id_agente}: {e}")
            return None

    def set_config(self, config: AgenteConfigSchema) -> None:
        """Definir configuraÃ§Ã£o a partir de objeto validado"""
        # Armazenar diretamente como dict, o SQLAlchemy irÃ¡ converter para JSON
        self.ds_config = config.model_dump()

    @classmethod
    def create_default_config(cls) -> AgenteConfigSchema:
        """Criar configuraÃ§Ã£o padrÃ£o para novos agentes"""
        return AgenteConfigFactory.create_default_config()

    def validate_config(self) -> bool:
        """Validar se a configuraÃ§Ã£o Ã© vÃ¡lida"""
        try:
            config_obj = self.config_obj
            return config_obj is not None
        except Exception:
            return False

    def is_streaming_enabled(self) -> bool:
        """Verificar se streaming estÃ¡ habilitado"""
        config = self.config_obj
        if config and config.model:
            return config.model.stream is not None and config.model.stream
        # Fallback para verificaÃ§Ã£o direta no dict
        if self.ds_config and isinstance(self.ds_config, dict):
            model_config = self.ds_config.get("model", {})
            return model_config.get("stream", True)  # PadrÃ£o True
        return True  # PadrÃ£o True se nÃ£o hÃ¡ configuraÃ§Ã£o

    def is_memory_enabled(self) -> bool:
        """Verificar se memÃ³ria estÃ¡ habilitada"""
        config = self.config_obj
        if config and config.memory:
            return config.memory.ativo
        # Fallback para verificaÃ§Ã£o direta no dict
        if self.ds_config and isinstance(self.ds_config, dict):
            memory_config = self.ds_config.get("memory", {})
            return memory_config.get("ativo", False)  # PadrÃ£o False
        return False  # PadrÃ£o False se nÃ£o hÃ¡ configuraÃ§Ã£o

    def has_tools(self) -> bool:
        """Verificar se o agente tem ferramentas configuradas"""
        # Prioridade 1: Verificar no config_obj (estruturado)
        config = self.config_obj
        if config and config.tools:
            return len(config.tools) > 0

        # Prioridade 2: Verificar diretamente no dict ds_config
        if self.ds_config and isinstance(self.ds_config, dict):
            tools = self.ds_config.get("tools", [])
            if len(tools) > 0:
                return True

        # Prioridade 3: Verificar no relacionamento tools (carregado pelo SQLAlchemy)
        if hasattr(self, "tools") and self.tools:
            return len(self.tools) > 0

        return False  # PadrÃ£o False se nÃ£o hÃ¡ configuraÃ§Ã£o

    def is_observability_enabled(self) -> bool:
        """Verificar se observabilidade estÃ¡ habilitada"""
        config = self.config_obj
        if config and config.observability:
            return config.observability.ativo
        # Fallback para verificaÃ§Ã£o direta no dict
        if self.ds_config and isinstance(self.ds_config, dict):
            observability_config = self.ds_config.get("observability", {})
            return observability_config.get("ativo", False)  # PadrÃ£o False
        return False  # PadrÃ£o False se nÃ£o hÃ¡ configuraÃ§Ã£o

    def is_knowledge_enabled(self) -> bool:
        """Verificar se base de conhecimento estÃ¡ habilitada"""
        config = self.config_obj
        if config and config.knowledge:
            return config.knowledge.ativo
        # Fallback para verificaÃ§Ã£o direta no dict
        if self.ds_config and isinstance(self.ds_config, dict):
            knowledge_config = self.ds_config.get("knowledge", {})
            return knowledge_config.get("ativo", False)  # PadrÃ£o False
        return False  # PadrÃ£o False se nÃ£o hÃ¡ configuraÃ§Ã£o

    def get_knowledge_credentials(self) -> List[str]:
        """Obter lista de IDs das credenciais de base de conhecimento"""
        config = self.config_obj
        if config and config.knowledge and config.knowledge.ativo:
            return [k.credentialId for k in config.knowledge.knowledges]
        # Fallback para verificaÃ§Ã£o direta no dict
        if self.ds_config and isinstance(self.ds_config, dict):
            knowledge_config = self.ds_config.get("knowledge", {})
            if knowledge_config.get("ativo", False):
                knowledges = knowledge_config.get("knowledges", [])
                return [
                    k.get("credentialId") for k in knowledges if k.get("credentialId")
                ]
        return []


# Pydantic Models para API (alinhados com tipos do frontend)
class AgentBase(BaseModel):
    """Schema base para Agent"""

    nm_agente: str = Field(
        ..., min_length=1, max_length=255, description="Nome do agente"
    )
    ds_prompt: str = Field(
        ..., min_length=1, max_length=50000, description="Prompt/instruÃ§Ãµes do agente"
    )
    ds_config: Optional[Union[str, AgentConfigDict]] = Field(
        None, description="ConfiguraÃ§Ãµes do agente em JSON"
    )
    st_principal: bool = Field(
        False, description="Indica se o agente Ã© principal/prioritÃ¡rio"
    )

    @validator("nm_agente")
    def validate_nm_agente(cls, v):  # pylint: disable=no-self-argument
        """Validar nome do agente"""
        if not v or not v.strip():
            raise ValueError("Nome do agente nÃ£o pode estar vazio")
        return v.strip()

    @validator("ds_prompt")
    def validate_ds_prompt(cls, v):  # pylint: disable=no-self-argument
        """Validar prompt do agente"""
        if not v or not v.strip():
            raise ValueError("Prompt do agente nÃ£o pode estar vazio")
        if len(v) > 50000:
            raise ValueError("Prompt nÃ£o pode exceder 50.000 caracteres")
        return v.strip()

    @validator("ds_config")
    def validate_ds_config(cls, v):  # pylint: disable=no-self-argument
        """Validar configuraÃ§Ã£o JSON"""
        if v is None:
            return None

        if isinstance(v, str):
            if v.strip() == "":
                return None
            try:
                config_dict = json.loads(v)
            except json.JSONDecodeError as e:
                raise ValueError(f"ds_config deve ser um JSON vÃ¡lido: {e}")
        elif isinstance(v, dict):
            config_dict = v
        else:
            raise ValueError("ds_config deve ser um JSON string ou objeto dict")

        try:
            # Validar usando o schema
            validated_config = AgenteConfigSchema(**config_dict)
            # Retornar como dict para ser armazenado como JSON
            return validated_config.model_dump()
        except Exception as e:
            raise ValueError(f"ConfiguraÃ§Ã£o invÃ¡lida: {e}")

    @classmethod
    def with_default_config(cls, nm_agente: str, ds_prompt: str) -> "AgentBase":
        """Criar AgentBase com configuraÃ§Ã£o padrÃ£o"""
        default_config = AgenteConfigFactory.create_default_config()
        ds_config = default_config.model_dump()

        return cls(nm_agente=nm_agente, ds_prompt=ds_prompt, ds_config=ds_config)


class AgentCreate(AgentBase):
    """Schema para criar um Agent"""

    nm_agente: str = Field(..., description="Nome do agente")
    ds_prompt: str = Field(..., description="Prompt/instruÃ§Ãµes do agente")
    ds_config: Optional[Union[str, AgentConfigDict]] = Field(
        None, description="ConfiguraÃ§Ãµes do agente em JSON"
    )
    st_principal: bool = Field(
        False, description="Indica se o agente Ã© principal/prioritÃ¡rio"
    )


class AgentUpdate(BaseModel):
    """Schema para atualizar um Agent"""

    id_agente: Optional[uuid.UUID] = Field(None, description="ID Ãºnico do agente (opcional, vem da URL)")
    nm_agente: Optional[str] = Field(None, description="Nome do agente")
    ds_prompt: Optional[str] = Field(None, description="Prompt/instruÃ§Ãµes do agente")
    ds_config: Optional[Union[str, AgentConfigDict]] = Field(
        None, description="ConfiguraÃ§Ãµes do agente em JSON"
    )
    st_principal: Optional[bool] = Field(
        None, description="Indica se o agente Ã© principal/prioritÃ¡rio"
    )


class AgentResponse(BaseModel):
    """Schema de resposta para Agent"""

    id_agente: uuid.UUID = Field(..., description="ID Ãºnico do agente")
    nm_agente: str = Field(..., description="Nome do agente")
    ds_prompt: str = Field(..., description="Prompt/instruÃ§Ãµes do agente")
    ds_config: Optional[Union[str, AgentConfigDict]] = Field(
        None, description="ConfiguraÃ§Ãµes do agente em JSON"
    )
    st_principal: bool = Field(
        False, description="Indica se o agente Ã© principal/prioritÃ¡rio"
    )
    dt_criacao: datetime = Field(..., description="Data de criaÃ§Ã£o")
    dt_atualizacao: datetime = Field(..., description="Data de atualizaÃ§Ã£o")

    class Config:
        from_attributes = True

    @property
    def config_obj(self) -> Optional[AgenteConfigSchema]:
        """Obter configuraÃ§Ã£o como objeto validado"""
        if not self.ds_config:
            return None

        try:
            # Se ds_config jÃ¡ Ã© um dict (vem do JSON do banco)
            if isinstance(self.ds_config, dict):
                return AgenteConfigSchema(**self.ds_config)

            # Se ds_config Ã© uma string (fallback)
            config_dict = json.loads(self.ds_config)
            return AgenteConfigSchema(**config_dict)
        except (json.JSONDecodeError, ValueError, TypeError):
            return None

    def get_model_name(self) -> Optional[str]:
        """Obter nome/ID da credencial do modelo"""
        config = self.config_obj
        if config and config.model:
            return config.model.id_credencial
        return None

    def has_tools(self) -> bool:
        """Verificar se o agente tem ferramentas configuradas"""
        config = self.config_obj
        return config is not None and len(config.tools) > 0

    def is_observability_enabled(self) -> bool:
        """Verificar se observabilidade estÃ¡ ativa"""
        config = self.config_obj
        return (
            config is not None
            and config.observability is not None
            and config.observability.ativo
        )

    def is_memory_enabled(self) -> bool:
        """Verificar se memÃ³ria estÃ¡ ativa"""
        config = self.config_obj
        return config is not None and config.memory is not None and config.memory.ativo


class AgentListResponse(BaseModel):
    """Schema para lista de agentes"""

    items: list[AgentResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(cls, agents: List["Agent"], total: int, page: int, size: int):
        """Criar resposta de paginaÃ§Ã£o"""
        total_pages = (total + size - 1) // size

        # Converter agentes para response
        items = [AgentResponse.model_validate(agent) for agent in agents]

        return cls(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            },
        )


# Exemplo de uso do tipo AgentConfigDict
def exemplo_uso_agent_config_dict() -> AgentConfigDict:
    """Exemplo de como usar o tipo AgentConfigDict"""
    return {
        "tools": [
            {
                "id": "tool_1",
                "nome": "Ferramenta 1",
                "ativo": True,
                "configuracao": {"param1": "valor1"},
            }
        ],
        "model": {
            "id_credencial": "cred_123",
            "temperature": 0.7,
            "top_p": 0.95,
            "max_tokens": 4000,
            "stream": True,
        },
        "observability": {"ativo": False, "credencialId": None, "tipo": None},
        "memory": {
            "ativo": True,
            "tipo": "conversation_buffer_window",
            "credencialId": "redis_cred",
            "configuracao": {"k": 5},
        },
        "knowledge": {"ativo": False, "knowledges": []},
    }


# Exemplo simples de verificaÃ§Ã£o de streaming
def exemplo_simples_streaming():
    """Exemplo simples de como verificar streaming"""
    # Criar configuraÃ§Ã£o bÃ¡sica
    config = {
        "model": {
            "id_credencial": "cred_123",
            "temperature": 0.7,
            "stream": True,  # Streaming habilitado
        },
        "tools": [],
        "memory": {"ativo": False},
        "observability": {"ativo": False},
        "knowledge": {"ativo": False, "knowledges": []},
    }

    # Criar agente
    agent = Agent(
        nm_agente="Agente Teste", ds_prompt="Prompt de teste", ds_config=config
    )

    # Verificar streaming
    is_streaming = agent.is_streaming_enabled()
    print(f"Streaming habilitado: {is_streaming}")

    # Alterar para desabilitar streaming
    config["model"]["stream"] = False
    agent.ds_config = config
    is_streaming = agent.is_streaming_enabled()
    print(f"Streaming habilitado apÃ³s alteraÃ§Ã£o: {is_streaming}")

    return agent


# Exemplo completo de verificaÃ§Ã£o de todas as configuraÃ§Ãµes
def exemplo_verificacao_completa():
    """Exemplo de como verificar streaming, memÃ³ria, tools e observabilidade juntos"""
    # ConfiguraÃ§Ã£o completa com todas as funcionalidades
    config_completa = {
        "model": {"id_credencial": "cred_123", "temperature": 0.7, "stream": True},
        "tools": [
            {
                "id": "tool_1",
                "nome": "Ferramenta 1",
                "ativo": True,
                "configuracao": {"param1": "valor1"},
            }
        ],
        "memory": {
            "ativo": True,
            "tipo": "conversation_buffer_window",
            "credencialId": "redis_cred",
            "configuracao": {"k": 5},
        },
        "observability": {
            "ativo": True,
            "credencialId": "langfuse_cred",
            "tipo": "langfuse",
        },
        "knowledge": {"ativo": False, "knowledges": []},
    }

    # Criar agente
    agent = Agent(
        nm_agente="Agente Completo",
        ds_prompt="Prompt de exemplo",
        ds_config=config_completa,
    )

    # Verificar todas as configuraÃ§Ãµes
    is_streaming = agent.is_streaming_enabled()
    is_memory = agent.is_memory_enabled()
    has_tools = agent.has_tools()
    is_observability = agent.is_observability_enabled()
    is_knowledge = agent.is_knowledge_enabled()
    knowledge_credentials = agent.get_knowledge_credentials()

    print(f"Streaming habilitado: {is_streaming}")
    print(f"MemÃ³ria habilitada: {is_memory}")
    print(f"Tem ferramentas: {has_tools}")
    print(f"Observabilidade habilitada: {is_observability}")
    print(f"Base de conhecimento habilitada: {is_knowledge}")
    print(f"Credenciais de conhecimento: {knowledge_credentials}")

    # Simular uso no endpoint
    if is_streaming:
        print("â†’ Usando modo streaming com SSE")
        print(f"â†’ use_memory={is_memory}")
        print(f"â†’ use_tools={has_tools}")
        print(f"â†’ use_observability={is_observability}")
        print(f"â†’ use_knowledge={is_knowledge}")
    else:
        print("â†’ Usando modo simples (JSON response)")
        print(f"â†’ use_memory={is_memory}")
        print(f"â†’ use_tools={has_tools}")
        print(f"â†’ use_observability={is_observability}")
        print(f"â†’ use_knowledge={is_knowledge}")

    return agent
