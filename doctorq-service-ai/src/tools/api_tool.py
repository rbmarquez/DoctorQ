# src/tools/api_tool.py
import asyncio
from typing import Any, Dict, List, Optional, Type

import httpx
from pydantic import BaseModel, Field, create_model

from src.config.logger_config import get_logger
from src.models.api_config import ApiToolConfig, AuthType, HttpMethod

from .base_tool import BaseTool

logger = get_logger(__name__)


class ApiToolError(Exception):
    """ExceÃ§Ã£o base para erros do ApiTool"""


class ApiConfigError(ApiToolError):
    """Erro de configuraÃ§Ã£o da API"""


class ApiRequestError(ApiToolError):
    """Erro na requisiÃ§Ã£o HTTP"""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response_text: Optional[str] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.response_text = response_text


class ApiValidationError(ApiToolError):
    """Erro de validaÃ§Ã£o de parÃ¢metros"""


class ApiTool(BaseTool):
    """Tool para realizar chamadas de API externa com suporte robusto e inteligente.
    Attributes:
        api_config: ConfiguraÃ§Ã£o completa da API
        args_schema: Schema dinÃ¢mico dos argumentos
    """

    tool_config: Dict[str, Any] = Field(
        default_factory=dict, description="ConfiguraÃ§Ã£o adicional da ferramenta"
    )
    callbacks: List[Any] = Field(
        default_factory=list, description="Callbacks de execuÃ§Ã£o"
    )
    langfuse_config: Optional[Any] = Field(
        default=None, description="ConfiguraÃ§Ã£o do Langfuse"
    )
    session_trace_context: Optional[Any] = Field(
        default=None, description="Contexto de trace da sessÃ£o"
    )
    verbose: bool = Field(default=True, description="Modo verboso de logging")
    api_config: Optional[ApiToolConfig] = Field(
        default=None, description="ConfiguraÃ§Ã£o da API"
    )
    args_schema: Optional[Type[BaseModel]] = Field(
        default=None, description="Schema dos argumentos"
    )
    client: Optional[httpx.AsyncClient] = Field(
        default=None, exclude=True, description="Cliente HTTP reutilizÃ¡vel"
    )
    nm_tool: Optional[str] = Field(
        default=None, description="Nome original da tool do banco de dados"
    )
    ds_tool: Optional[str] = Field(
        default=None, description="DescriÃ§Ã£o original da tool do banco de dados"
    )

    def __init__(self, **data) -> None:
        """Inicializa ApiTool com validaÃ§Ã£o robusta de configuraÃ§Ã£o.

        Args:
            **data: Dados de configuraÃ§Ã£o incluindo api_config, nm_tool, ds_tool

        Raises:
            ApiConfigError: Se a configuraÃ§Ã£o for invÃ¡lida
        """
        api_config = data.pop("api_config", None)

        try:
            data["api_config"] = api_config
            super().__init__(**data)

            if self.api_config:
                self._validate_api_config()
                self.args_schema = self._create_args_schema()
            else:
                self.args_schema = self._create_basic_schema()

            logger.debug(f"ApiTool '{self.nm_tool}' inicializado com sucesso")

        except Exception as e:
            logger.error(f"Erro na inicializaÃ§Ã£o do ApiTool: {str(e)}")
            raise ApiConfigError(f"Falha na inicializaÃ§Ã£o: {str(e)}")

    def _validate_api_config(self) -> None:
        """Valida configuraÃ§Ã£o da API."""
        if not self.api_config or not hasattr(self.api_config, "endpoint"):
            raise ApiConfigError("Endpoint nÃ£o configurado")

        if not self.api_config.endpoint.url:
            raise ApiConfigError("URL do endpoint Ã© obrigatÃ³ria")

        if not isinstance(self.api_config.endpoint.method, HttpMethod):
            raise ApiConfigError(
                f"MÃ©todo HTTP invÃ¡lido: {self.api_config.endpoint.method}"
            )

    def _get_python_type(self, param_type: str) -> Type:
        """Mapeia tipo de parÃ¢metro para tipo Python."""
        type_mapping = {
            "string": str,
            "integer": int,
            "boolean": bool,
            "number": float,
        }
        return type_mapping.get(param_type, str)

    def _create_args_schema(self) -> Type[BaseModel]:
        """Cria schema dinÃ¢mico otimizado baseado nos parÃ¢metros da API."""
        try:
            if not self.api_config or not self.api_config.endpoint:
                logger.warning(f"ApiTool {self.nm_tool} sem endpoint configurado")
                return self._create_basic_schema()

            fields = {}

            # Adicionar campo prompt automaticamente como contexto do tool
            tool_prompt = self._create_tool_prompt()
            if tool_prompt:
                fields["prompt"] = (
                    Optional[str],
                    Field(
                        default=tool_prompt,
                        description=f"Contexto da ferramenta: {self.nm_tool}. InformaÃ§Ãµes sobre a ferramenta e seus parÃ¢metros.",
                    ),
                )
                logger.debug(f"Tool {self.nm_tool}: prompt criado: {tool_prompt}")
            else:
                logger.warning(f"Tool {self.nm_tool}: nenhum prompt criado")

            # Adicionar campos especÃ­ficos da API
            for param in self.api_config.endpoint.parameters:
                python_type = self._get_python_type(param.type)

                if param.required:
                    fields[param.name] = (
                        python_type,
                        Field(..., description=param.description),
                    )
                else:
                    default_value = param.default_value
                    fields[param.name] = (
                        Optional[python_type],
                        Field(default=default_value, description=param.description),
                    )

            schema_name = f"{self.nm_tool.replace('-', '_').replace(' ', '_')}Schema"
            logger.debug(
                f"Tool {self.nm_tool}: criando schema com {len(fields)} campos"
            )
            return create_model(schema_name, **fields)

        except Exception as e:
            logger.error(f"Erro ao criar schema para {self.nm_tool}: {str(e)}")
            return self._create_basic_schema()

    def _create_basic_schema(self) -> Type[BaseModel]:
        """Cria schema bÃ¡sico como fallback."""
        # Criar prompt bÃ¡sico com informaÃ§Ãµes da tool
        basic_prompt = f"Ferramenta: {self.nm_tool} | DescriÃ§Ã£o: {self.ds_tool}"

        return create_model(
            "BasicSchema",
            message=(
                str,
                Field(
                    ...,
                    description=f"Mensagem para a API {self.nm_tool}: {self.ds_tool}",
                ),
            ),
            prompt=(
                Optional[str],
                Field(
                    default=basic_prompt,
                    description=f"Contexto da ferramenta: {self.nm_tool}",
                ),
            ),
        )

    @property
    def args(self) -> Type[BaseModel]:
        """Retorna schema de argumentos validado para o LangChain."""
        if not self._is_valid_schema(self.args_schema):
            logger.debug(f"Schema invÃ¡lido para {self.nm_tool}, usando schema bÃ¡sico")
            return self._create_basic_schema()
        return self.args_schema

    def _is_valid_schema(self, schema: Any) -> bool:
        """Valida se o schema Ã© vÃ¡lido."""
        return (
            schema is not None
            and isinstance(schema, type)
            and issubclass(schema, BaseModel)
        )

    async def _execute_tool_logic(self, **kwargs) -> Any:
        """Executa chamada da API com validaÃ§Ã£o robusta e retry inteligente."""
        try:
            self._validate_execution_params(kwargs)

            # Adicionar contexto do tool (nm_tool e ds_tool como prompt)
            enhanced_kwargs = self._add_tool_context(kwargs)

            logger.info(
                f"Executando {self.nm_tool} com parÃ¢metros: {list(enhanced_kwargs.keys())}"
            )

            request_context = await self._prepare_request_context(enhanced_kwargs)
            response_data = await self._execute_http_request(request_context)

            logger.info(f"Tool {self.nm_tool} executado com sucesso")
            return response_data

        except ApiToolError:
            raise
        except Exception as e:
            logger.error(f"Erro inesperado no {self.nm_tool}: {str(e)}", exc_info=True)
            raise ApiToolError(f"Falha na execuÃ§Ã£o: {str(e)}")

    def _add_tool_context(self, kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """Adiciona contexto do tool (nm_tool e ds_tool) como prompt para o agente."""
        enhanced_kwargs = kwargs.copy()

        # Criar prompt com informaÃ§Ãµes do tool para contexto do agente
        tool_prompt = self._create_tool_prompt()

        # Adicionar o prompt aos parÃ¢metros se nÃ£o existir explicitamente
        if "prompt" not in enhanced_kwargs and tool_prompt:
            enhanced_kwargs["prompt"] = tool_prompt
            logger.debug(f"Adicionado prompt do tool: {tool_prompt[:100]}...")

        # Aplicar mapeamento inteligente de parÃ¢metros
        enhanced_kwargs = self._apply_parameter_mapping(enhanced_kwargs)

        return enhanced_kwargs

    def _apply_parameter_mapping(self, kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """Aplica processamento bÃ¡sico de parÃ¢metros."""
        if not self.api_config or not self.api_config.endpoint:
            return kwargs

        mapped_kwargs = kwargs.copy()
        expected_params = {p.name: p for p in self.api_config.endpoint.parameters}

        # Preencher apenas parÃ¢metros obrigatÃ³rios ausentes com valores padrÃ£o
        mapped_kwargs = self._fill_missing_required_params(
            mapped_kwargs, expected_params
        )

        return mapped_kwargs

    def _fill_missing_required_params(
        self, kwargs: Dict[str, Any], expected_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Preenche parÃ¢metros obrigatÃ³rios ausentes com valores padrÃ£o inteligentes."""
        filled_kwargs = kwargs.copy()

        for param_name, param_config in expected_params.items():
            if param_config.required and param_name not in filled_kwargs:
                default_value = self._generate_smart_default(param_name, param_config)
                if default_value is not None:
                    filled_kwargs[param_name] = default_value
                    logger.debug(
                        f"Preenchido parÃ¢metro obrigatÃ³rio '{param_name}' com valor padrÃ£o"
                    )

        return filled_kwargs

    def _generate_smart_default(self, param_name: str, param_config: Any) -> Any:
        """Gera valores padrÃ£o simples baseados apenas no tipo do parÃ¢metro."""
        _ = param_name  # ParÃ¢metro mantido para compatibilidade futura
        param_type = getattr(param_config, "type", "string")

        # Valores padrÃ£o simples por tipo
        type_defaults = {
            "string": "valor_padrao",
            "integer": 1,
            "number": 1.0,
            "boolean": True,
        }

        return type_defaults.get(param_type, "valor_padrao")

    def _convert_to_param_type(self, value: Any, param_type: str) -> Any:
        """Converte valor para o tipo esperado do parÃ¢metro."""
        try:
            if param_type == "integer":
                return int(value) if str(value).isdigit() else 1
            if param_type == "number":
                return float(value) if str(value).replace(".", "").isdigit() else 1.0
            if param_type == "boolean":
                return bool(value)
            # string
            return str(value)
        except (ValueError, TypeError):
            # Fallback para valores padrÃ£o por tipo
            return {"integer": 1, "number": 1.0, "boolean": True}.get(
                param_type, "valor_padrao"
            )

    def _create_tool_prompt(self) -> str:
        """Cria prompt informativo sobre o tool para o agente."""
        # Usar nm_tool e ds_tool do banco de dados
        tool_name = self.nm_tool
        tool_desc = self.ds_tool

        if not tool_name or not tool_desc:
            return ""

        prompt_parts = []

        if tool_name and tool_name != "unknown_api_tool":
            prompt_parts.append(f"Ferramenta: {tool_name}")

        if tool_desc and tool_desc != "API tool":
            prompt_parts.append(f"DescriÃ§Ã£o: {tool_desc}")

        if (
            self.api_config
            and self.api_config.endpoint
            and self.api_config.endpoint.parameters
        ):
            required_params = [
                param.name
                for param in self.api_config.endpoint.parameters
                if param.required
            ]
            if required_params:
                prompt_parts.append(
                    f"ParÃ¢metros obrigatÃ³rios: {', '.join(required_params)}"
                )

        return " | ".join(prompt_parts) if prompt_parts else ""

    def _validate_execution_params(self, kwargs: Dict[str, Any]) -> None:
        """Valida parÃ¢metros de entrada."""
        if not self.api_config or not self.api_config.endpoint:
            raise ApiConfigError("Endpoint nÃ£o configurado")

        required_params = [
            param.name
            for param in self.api_config.endpoint.parameters
            if param.required
        ]

        missing_params = [param for param in required_params if param not in kwargs]
        if missing_params:
            raise ApiValidationError(
                f"ParÃ¢metros obrigatÃ³rios ausentes: {', '.join(missing_params)}"
            )

    async def _prepare_request_context(self, kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """Prepara contexto completo da requisiÃ§Ã£o."""
        auth_headers = await self._prepare_auth_headers()
        request_data = self._prepare_request_data(kwargs)

        headers = {**auth_headers, **request_data.get("headers", {})}
        url = self._replace_path_parameters(self.api_config.endpoint.url, kwargs)

        return {
            "method": self.api_config.endpoint.method.value,
            "url": url,
            "headers": headers,
            "params": request_data.get("params", {}),
            "json": request_data.get("json") or None,
            "timeout": self.api_config.endpoint.timeout,
            "max_retries": self.api_config.endpoint.max_retries,
        }

    async def _execute_http_request(self, context: Dict[str, Any]) -> Any:
        """Executa requisiÃ§Ã£o HTTP com retry inteligente."""
        async with httpx.AsyncClient(timeout=context["timeout"]) as client:
            last_exception = None

            for attempt in range(context["max_retries"] + 1):
                try:
                    response = await client.request(
                        method=context["method"],
                        url=context["url"],
                        params=context["params"],
                        json=context["json"],
                        headers=context["headers"],
                    )

                    return await self._process_response(response)

                except httpx.HTTPStatusError as e:
                    last_exception = e

                    if not self._should_retry(
                        e.response.status_code, attempt, context["max_retries"]
                    ):
                        raise ApiRequestError(
                            f"HTTP {e.response.status_code}: {e.response.text[:200]}",
                            status_code=e.response.status_code,
                            response_text=e.response.text,
                        )

                    await self._handle_retry_delay(attempt, e.response.status_code)

                except Exception as e:
                    last_exception = e

                    if attempt == context["max_retries"]:
                        raise ApiRequestError(f"Erro de conexÃ£o: {str(e)}")

                    logger.warning(
                        f"Tentativa {attempt + 1} falhou ({type(e).__name__}), tentando novamente..."
                    )
                    await asyncio.sleep(2**attempt)

            if last_exception:
                raise ApiRequestError(
                    f"Todas as tentativas falharam: {str(last_exception)}"
                )

    async def _process_response(self, response: httpx.Response) -> Any:
        """Processa resposta HTTP."""
        response.raise_for_status()

        content_type = response.headers.get("content-type", "")

        if "application/json" in content_type:
            try:
                return response.json()
            except Exception as e:
                logger.warning(f"Erro ao parsear JSON: {str(e)}")
                return response.text

        return response.text

    def _should_retry(self, status_code: int, attempt: int, max_retries: int) -> bool:
        """Determina se deve tentar novamente baseado no status code."""
        if attempt >= max_retries:
            return False

        retry_codes = {
            429,
            502,
            503,
            504,
        }  # Rate limit, Bad Gateway, Service Unavailable, Gateway Timeout
        return status_code in retry_codes

    async def _handle_retry_delay(self, attempt: int, status_code: int) -> None:
        """Gerencia delay entre tentativas."""
        if status_code == 429:  # Rate limit
            delay = min(60, 2**attempt)  # Cap no mÃ¡ximo 60s para rate limit
        else:
            delay = 2**attempt

        logger.info(
            f"Aguardando {delay}s antes da prÃ³xima tentativa (HTTP {status_code})"
        )
        await asyncio.sleep(delay)

    async def _prepare_auth_headers(self) -> Dict[str, str]:
        """Prepara headers de autenticaÃ§Ã£o de forma robusta."""
        if not self.api_config or not self.api_config.auth:
            return {}

        auth = self.api_config.auth
        headers = {}

        try:
            if auth.type == AuthType.BEARER:
                if not auth.token:
                    raise ApiConfigError("Token Bearer nÃ£o configurado")
                headers["Authorization"] = f"Bearer {auth.token}"

            elif auth.type == AuthType.API_KEY:
                if not auth.api_key:
                    raise ApiConfigError("API Key nÃ£o configurada")
                api_key_header = auth.api_key_header or "X-API-Key"
                headers[api_key_header] = auth.api_key

            elif auth.type == AuthType.BASIC:
                if not auth.username or not auth.password:
                    raise ApiConfigError("Credenciais bÃ¡sicas incompletas")

                import base64

                credentials = base64.b64encode(
                    f"{auth.username}:{auth.password}".encode()
                ).decode()
                headers["Authorization"] = f"Basic {credentials}"

            elif auth.type == AuthType.CUSTOM:
                if not auth.custom_header_name or not auth.custom_header_value:
                    raise ApiConfigError("Header customizado requer nome e valor")
                headers[auth.custom_header_name] = auth.custom_header_value

            logger.debug(f"Headers de autenticaÃ§Ã£o preparados para {auth.type.value}")
            return headers

        except Exception as e:
            logger.error(f"Erro ao preparar autenticaÃ§Ã£o: {str(e)}")
            raise ApiConfigError(f"Falha na autenticaÃ§Ã£o: {str(e)}")

    def _prepare_request_data(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Prepara dados da requisiÃ§Ã£o organizados por localizaÃ§Ã£o."""
        request_data = {
            "params": {},
            "json": {},
            "headers": dict(self.api_config.endpoint.headers or {}),
        }

        # Filtrar parÃ¢metros para remover campos de contexto (como prompt)
        filtered_parameters = self._filter_context_parameters(parameters)

        logger.debug(
            f"Organizando {len(filtered_parameters)} parÃ¢metros por localizaÃ§Ã£o"
        )

        for param_config in self.api_config.endpoint.parameters:
            param_value = self._get_parameter_value(param_config, filtered_parameters)

            if param_value is not None:
                self._place_parameter(param_config, param_value, request_data)

        logger.debug(
            f"Request preparado: params={len(request_data['params'])}, "
            f"json={len(request_data['json'])}, headers={len(request_data['headers'])}"
        )

        return request_data

    def _filter_context_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Remove parÃ¢metros de contexto que nÃ£o devem ser enviados na requisiÃ§Ã£o HTTP."""
        context_fields = {"prompt"}  # Campos que sÃ£o apenas para contexto do agente

        filtered = {
            key: value for key, value in parameters.items() if key not in context_fields
        }

        if len(filtered) != len(parameters):
            removed_fields = set(parameters.keys()) - set(filtered.keys())
            logger.debug(
                f"Campos de contexto removidos da requisiÃ§Ã£o: {removed_fields}"
            )

        return filtered

    def _get_parameter_value(self, param_config, parameters: Dict[str, Any]) -> Any:
        """ObtÃ©m valor do parÃ¢metro com fallback para valor padrÃ£o."""
        param_value = parameters.get(param_config.name)

        if param_value is None and param_config.default_value is not None:
            param_value = param_config.default_value
            logger.debug(f"Usando valor padrÃ£o para {param_config.name}: {param_value}")

        return param_value

    def _place_parameter(
        self, param_config, param_value: Any, request_data: Dict[str, Any]
    ) -> None:
        """Coloca parÃ¢metro na localizaÃ§Ã£o correta da requisiÃ§Ã£o."""
        location_handlers = {
            "query": lambda: request_data["params"].update(
                {param_config.name: param_value}
            ),
            "body": lambda: request_data["json"].update(
                {param_config.name: param_value}
            ),
            "header": lambda: request_data["headers"].update(
                {param_config.name: str(param_value)}
            ),
            "path": lambda: None,  # Path params tratados na URL
        }

        handler = location_handlers.get(param_config.location)
        if handler:
            handler()
        else:
            logger.warning(f"LocalizaÃ§Ã£o desconhecida: {param_config.location}")

    def _replace_path_parameters(self, url: str, parameters: Dict[str, Any]) -> str:
        """Substitui parÃ¢metros de path na URL com validaÃ§Ã£o."""
        modified_url = url
        path_params = [
            param
            for param in self.api_config.endpoint.parameters
            if param.location == "path"
        ]

        for param_config in path_params:
            param_value = parameters.get(param_config.name)
            placeholder = f"{{{param_config.name}}}"

            if param_value is not None:
                modified_url = modified_url.replace(placeholder, str(param_value))
                logger.debug(f"SubstituÃ­do {placeholder} por {param_value}")
            elif param_config.required:
                raise ApiValidationError(
                    f"ParÃ¢metro de path obrigatÃ³rio '{param_config.name}' ausente"
                )

        # Verificar se ainda hÃ¡ placeholders nÃ£o substituÃ­dos
        remaining_placeholders = [p for p in url.split() if "{" in p and "}" in p]
        if remaining_placeholders:
            logger.warning(f"Placeholders nÃ£o substituÃ­dos: {remaining_placeholders}")

        return modified_url

    @classmethod
    def from_db_config(
        cls, tool_config: Dict[str, Any], nm_tool: str, ds_tool: str
    ) -> "ApiTool":
        """Cria ApiTool a partir de configuraÃ§Ã£o do banco com validaÃ§Ã£o robusta.

        Args:
            tool_config: ConfiguraÃ§Ã£o da ferramenta do banco de dados
            nm_tool: Nome da ferramenta do banco
            ds_tool: DescriÃ§Ã£o da ferramenta do banco

        Returns:
            InstÃ¢ncia configurada do ApiTool

        Raises:
            ApiConfigError: Se a configuraÃ§Ã£o for invÃ¡lida
        """
        try:
            logger.debug(f"Criando ApiTool a partir de configuraÃ§Ã£o: {nm_tool}")

            config = cls._normalize_config(tool_config.copy(), nm_tool, ds_tool)
            cls._validate_required_fields(config)

            api_config = ApiToolConfig.model_validate(config)

            instance = cls(
                name=nm_tool,  # Usar nm_tool como name
                description=ds_tool,  # Usar ds_tool como description
                api_config=api_config,
                nm_tool=nm_tool,  # Nome original do banco
                ds_tool=ds_tool,  # DescriÃ§Ã£o original do banco
            )

            logger.info(f"ApiTool '{nm_tool}' criado com sucesso")
            return instance

        except Exception as e:
            logger.error(f"Falha ao criar ApiTool '{nm_tool}': {str(e)}")
            raise ApiConfigError(f"ConfiguraÃ§Ã£o invÃ¡lida: {str(e)}")

    @classmethod
    def _normalize_config(
        cls, config: Dict[str, Any], nm_tool: str, ds_tool: str
    ) -> Dict[str, Any]:
        """Normaliza e padroniza configuraÃ§Ã£o."""
        # NÃ£o adiciona nm_tool e ds_tool ao config pois eles vÃªm como parÃ¢metros separados
        # e sÃ£o usados diretamente na criaÃ§Ã£o da instÃ¢ncia
        _ = (
            nm_tool,
            ds_tool,
        )  # ParÃ¢metros necessÃ¡rios para compatibilidade de interface

        config.setdefault("auth", {"type": "none"})

        # Converter endpoint string para objeto completo
        if isinstance(config.get("endpoint"), str):
            config["endpoint"] = {
                "url": config["endpoint"],
                "method": config.get("method", "GET"),
                "headers": {},
                "parameters": [],
                "timeout": 30,
                "max_retries": 3,
            }

        return config

    @classmethod
    def _validate_required_fields(cls, config: Dict[str, Any]) -> None:
        """Valida campos obrigatÃ³rios da configuraÃ§Ã£o."""
        if "endpoint" not in config:
            raise ApiConfigError("Campo 'endpoint' Ã© obrigatÃ³rio")

        endpoint = config["endpoint"]
        if not isinstance(endpoint, dict) or not endpoint.get("url"):
            raise ApiConfigError("Endpoint deve conter uma URL vÃ¡lida")
