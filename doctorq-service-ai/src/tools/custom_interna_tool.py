# src/tools/custom_interna_tool.py
import importlib
import inspect
import time
from typing import Any, Dict, List, Optional, Type

from pydantic import BaseModel, Field, create_model
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.custom_interna_config import CustomInternaToolConfig

from .base_tool import BaseTool

logger = get_logger(__name__)


class CustomInternaTool(BaseTool):
    """Tool para realizar chamadas de serviÃ§os internos"""

    tool_config: Dict[str, Any] = Field(default_factory=dict)
    callbacks: List[Any] = Field(default_factory=list)
    langfuse_config: Optional[Any] = Field(default=None)
    session_trace_context: Optional[Any] = Field(default=None)
    verbose: bool = Field(default=True)
    service_config: Optional[Any] = Field(default=None)
    args_schema: Optional[Type[BaseModel]] = Field(default=None)
    db_session: Optional[AsyncSession] = Field(default=None)

    def __init__(self, **data):
        # Extrair service_config ANTES de chamar super() para evitar conflito com Pydantic
        service_config = data.pop("service_config", None)

        # Extrair name e description do service_config se nÃ£o fornecidos diretamente
        if service_config:
            if isinstance(service_config, dict):
                if "name" not in data and "name" in service_config:
                    data["name"] = service_config["name"]
                if "description" not in data and "description" in service_config:
                    data["description"] = service_config["description"]
            elif hasattr(service_config, "name") and hasattr(
                service_config, "description"
            ):
                if "name" not in data:
                    data["name"] = service_config.name
                if "description" not in data:
                    data["description"] = service_config.description

        # Garantir valores padrÃ£o se ainda nÃ£o definidos
        if "name" not in data:
            data["name"] = "unknown_custom_interna_tool"
        if "description" not in data:
            data["description"] = "Custom Internal Service tool"

        # Adicionar service_config de volta aos dados para que seja processado pelo Pydantic
        data["service_config"] = service_config

        # Chamar super().__init__()
        super().__init__(**data)

        # Criar schema dinamicamente baseado nos parÃ¢metros do serviÃ§o
        if self.service_config:
            self.args_schema = self._create_args_schema()
        else:
            self.args_schema = None

    def _create_args_schema(self) -> Type[BaseModel]:
        """Criar schema dinÃ¢mico baseado nos parÃ¢metros do serviÃ§o"""
        try:
            fields = {}

            if not self.service_config or not getattr(
                self.service_config, "service", None
            ):
                logger.error(
                    f"CustomInternaTool {self.name} nÃ£o possui serviÃ§o configurado."
                )
                return create_model(
                    "BasicSchema", message=(str, Field(..., description="Mensagem"))
                )

            for param in self.service_config.service.parameters:
                # Determinar tipo Python baseado no tipo do parÃ¢metro
                python_type = str  # padrÃ£o
                if param.type == "integer":
                    python_type = int
                elif param.type == "boolean":
                    python_type = bool
                elif param.type == "number":
                    python_type = float

                # Criar field com valor padrÃ£o se nÃ£o obrigatÃ³rio
                if param.required:
                    fields[param.name] = (
                        python_type,
                        Field(..., description=param.description),
                    )
                else:
                    default_value = (
                        param.default_value if param.default_value is not None else None
                    )
                    fields[param.name] = (
                        Optional[python_type],
                        Field(default_value, description=param.description),
                    )

            # Criar modelo dinamicamente
            schema_name = f"{self.name}Schema"
            return create_model(schema_name, **fields)

        except Exception as e:
            logger.error(f"Erro ao criar schema para {self.name}: {str(e)}")
            # Fallback para schema bÃ¡sico
            return create_model(
                "BasicSchema", message=(str, Field(..., description="Mensagem"))
            )

    @property
    def args(self) -> Type[BaseModel]:
        """Retornar schema de argumentos para o LangChain"""
        if (
            self.args_schema is None
            or not isinstance(self.args_schema, type)
            or not issubclass(self.args_schema, BaseModel)
        ):
            # Fallback para um schema bÃ¡sico
            return create_model(
                "BasicSchema", message=(str, Field(..., description="Mensagem"))
            )
        return self.args_schema

    async def _execute_tool_logic(self, **kwargs) -> Any:
        """Executar chamada do serviÃ§o interno"""
        try:
            logger.debug(
                f"Executando tool {self.name} com parÃ¢metros: {list(kwargs.keys())}"
            )

            if not self.service_config or not getattr(
                self.service_config, "service", None
            ):
                raise ValueError(
                    f"CustomInternaTool {self.name} nÃ£o possui serviÃ§o configurado."
                )

            service_config = self.service_config.service
            start_time = time.time()

            # Preparar parÃ¢metros para o mÃ©todo
            method_kwargs = self._prepare_method_parameters(kwargs)

            # Importar e instanciar o serviÃ§o
            service_instance = await self._get_service_instance(
                service_config.service_class, service_config.requires_db
            )

            # Obter o mÃ©todo do serviÃ§o
            method = getattr(service_instance, service_config.method_name)

            # Executar o mÃ©todo (assÃ­ncrono ou sÃ­ncrono)
            if service_config.is_async:
                result = await method(**method_kwargs)
            else:
                result = method(**method_kwargs)

            execution_time = time.time() - start_time
            logger.debug(f"Tool {self.name} executado em {execution_time:.2f}s")

            return result

        except Exception as e:
            logger.error(f"Erro na execuÃ§Ã£o do CustomInternaTool {self.name}: {str(e)}")
            raise

    def _prepare_method_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Preparar parÃ¢metros para chamada do mÃ©todo"""
        if not self.service_config or not getattr(self.service_config, "service", None):
            logger.error(
                f"CustomInternaTool {self.name} nÃ£o possui serviÃ§o configurado."
            )
            return {}

        method_kwargs = {}
        logger.debug(f"Preparando parÃ¢metros do mÃ©todo: {parameters}")

        # Processar parÃ¢metros baseado na configuraÃ§Ã£o
        for param_config in self.service_config.service.parameters:
            param_name = param_config.name
            param_value = parameters.get(param_name)

            # Se parÃ¢metro Ã© obrigatÃ³rio e nÃ£o foi fornecido
            if param_config.required and param_value is None:
                raise ValueError(
                    f"ParÃ¢metro obrigatÃ³rio '{param_config.name}' nÃ£o fornecido. ParÃ¢metros disponÃ­veis: {list(parameters.keys())}"
                )

            # Usar valor padrÃ£o se disponÃ­vel
            if param_value is None and param_config.default_value is not None:
                param_value = param_config.default_value

            # Adicionar parÃ¢metro se nÃ£o for None
            if param_value is not None:
                method_kwargs[param_name] = param_value

        return method_kwargs

    async def _get_service_instance(
        self, service_class_name: str, requires_db: bool = False
    ):
        """Obter instÃ¢ncia do serviÃ§o"""
        try:
            # Parse do nome da classe para mÃ³dulo e classe
            if "." in service_class_name:
                module_path, class_name = service_class_name.rsplit(".", 1)
            else:
                # Assumir que estÃ¡ no mÃ³dulo de services
                module_path = f"src.services.{service_class_name.lower()}"
                class_name = service_class_name

            # Importar o mÃ³dulo
            module = importlib.import_module(module_path)
            service_class = getattr(module, class_name)

            # Verificar se Ã© uma funÃ§Ã£o factory (get_*_service)
            if callable(service_class) and service_class_name.startswith("get_"):
                # Ã‰ uma funÃ§Ã£o factory, chamÃ¡-la
                if requires_db and self.db_session:
                    # Verificar se a funÃ§Ã£o aceita db como parÃ¢metro
                    sig = inspect.signature(service_class)
                    if "db" in sig.parameters:
                        return service_class(db=self.db_session)
                return service_class()

            # Ã‰ uma classe, instanciÃ¡-la
            if requires_db and self.db_session:
                # Verificar se o construtor aceita db como parÃ¢metro
                sig = inspect.signature(service_class.__init__)
                if "db" in sig.parameters:
                    return service_class(db=self.db_session)
            return service_class()

        except Exception as e:
            logger.error(
                f"Erro ao obter instÃ¢ncia do serviÃ§o {service_class_name}: {str(e)}"
            )
            raise ValueError(f"NÃ£o foi possÃ­vel instanciar o serviÃ§o: {str(e)}")

    def set_db_session(self, db_session: AsyncSession):
        """Definir sessÃ£o do banco de dados"""
        self.db_session = db_session
        logger.debug(f"SessÃ£o DB definida para tool {self.name}")

    @classmethod
    def from_db_config(
        cls, tool_config: Dict[str, Any], name: str, description: str
    ) -> "CustomInternaTool":
        """Criar CustomInternaTool a partir de configuraÃ§Ã£o do banco"""
        try:
            # Fazer uma cÃ³pia para nÃ£o modificar o original
            config = tool_config.copy()

            # Garantir que name e description nunca sejam None
            config["name"] = (
                str(name)
                if name is not None
                else config.get("name", "unknown_custom_interna_tool")
            )
            config["description"] = (
                str(description)
                if description is not None
                else config.get("description", "Custom Internal Service tool")
            )

            # Verificar e adicionar campos obrigatÃ³rios com valores padrÃ£o se ausentes
            if "service" not in config:
                logger.error(
                    f"Campo 'service' obrigatÃ³rio ausente para tool {config['name']}"
                )
                raise ValueError("Campo 'service' Ã© obrigatÃ³rio")

            # Validar e criar a configuraÃ§Ã£o do serviÃ§o
            service_config = CustomInternaToolConfig.model_validate(config)

            return cls(
                name=service_config.name,
                description=service_config.description,
                service_config=service_config,
            )
        except Exception as e:
            logger.error(f"Erro ao criar CustomInternaTool: {str(e)}")
            raise ValueError(f"ConfiguraÃ§Ã£o invÃ¡lida para CustomInternaTool: {str(e)}")
