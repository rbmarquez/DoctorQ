# src/services/api_service.py
import asyncio
import time
from typing import Any, Dict

import httpx
from fastapi import Depends

from src.config.logger_config import get_logger
from src.models.api_config import ApiCallRequest, ApiCallResponse, AuthType
from src.services.tool_service import ToolService, get_tool_service

logger = get_logger(__name__)


class ApiService:
    """Service para realizar chamadas de API"""

    def __init__(self, tool_service: ToolService):
        self.tool_service = tool_service

    def _prepare_auth_headers(self, auth_config: Dict[str, Any]) -> Dict[str, str]:
        """Preparar headers de autenticaÃ§Ã£o"""
        headers = {}

        auth_type = auth_config.get("type", "none")

        if auth_type == AuthType.BEARER:
            token = auth_config.get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"

        elif auth_type == AuthType.API_KEY:
            api_key = auth_config.get("api_key")
            api_key_header = auth_config.get("api_key_header", "X-API-Key")
            if api_key:
                headers[api_key_header] = api_key

        elif auth_type == AuthType.BASIC:
            username = auth_config.get("username")
            password = auth_config.get("password")
            if username and password:
                import base64

                credentials = base64.b64encode(
                    f"{username}:{password}".encode()
                ).decode()
                headers["Authorization"] = f"Basic {credentials}"

        elif auth_type == "custom":
            custom_header_name = auth_config.get("custom_header_name")
            custom_header_value = auth_config.get("custom_header_value")
            if custom_header_name and custom_header_value:
                headers[custom_header_name] = custom_header_value

        return headers

    def _prepare_request_data(
        self, endpoint_config: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Preparar dados da requisiÃ§Ã£o"""
        request_data = {
            "params": {},
            "json": {},
            "headers": endpoint_config.get("headers", {}),
        }

        # Processar parÃ¢metros baseado na localizaÃ§Ã£o
        for param_config in endpoint_config.get("parameters", []):
            param_name = param_config["name"]
            param_value = parameters.get(param_name)

            # Se parÃ¢metro Ã© obrigatÃ³rio e nÃ£o foi fornecido
            if param_config.get("required", False) and param_value is None:
                raise ValueError(f"ParÃ¢metro obrigatÃ³rio '{param_name}' nÃ£o fornecido")

            # Usar valor padrÃ£o se disponÃ­vel
            if param_value is None and "default_value" in param_config:
                param_value = param_config["default_value"]

            # Adicionar parÃ¢metro na localizaÃ§Ã£o correta
            if param_value is not None:
                location = param_config.get("location", "query")

                if location == "query":
                    request_data["params"][param_name] = param_value
                elif location == "body":
                    request_data["json"][param_name] = param_value
                elif location == "header":
                    request_data["headers"][param_name] = str(param_value)
                # path parameters serÃ£o tratados na URL

        return request_data

    def _replace_path_parameters(
        self, url: str, parameters: Dict[str, Any], endpoint_config: Dict[str, Any]
    ) -> str:
        """Substituir parÃ¢metros de path na URL"""
        modified_url = url

        for param_config in endpoint_config.get("parameters", []):
            if param_config.get("location") == "path":
                param_name = param_config["name"]
                param_value = parameters.get(param_name)

                if param_value is not None:
                    # Substituir {param_name} na URL
                    placeholder = f"{{{param_name}}}"
                    modified_url = modified_url.replace(placeholder, str(param_value))

        return modified_url

    async def execute_api_call(self, request: ApiCallRequest) -> ApiCallResponse:
        """Executar chamada de API"""
        start_time = time.time()
        result = None

        try:
            # Buscar configuraÃ§Ã£o do tool
            tool = await self.tool_service.get_tool_by_id(request.tool_id)
            if not tool:
                result = ApiCallResponse(
                    success=False, error=f"Tool '{request.tool_id}' nÃ£o encontrado"
                )
            elif not tool.st_ativo:
                result = ApiCallResponse(
                    success=False, error=f"Tool '{request.tool_id}' estÃ¡ inativo"
                )
            elif tool.tp_tool != "api":
                result = ApiCallResponse(
                    success=False, error=f"Tool '{request.tool_id}' nÃ£o Ã© do tipo API"
                )

            if result:
                return result

            # Extrair configuraÃ§Ãµes
            config = tool.config_tool
            auth_config = config.get("auth", {})
            endpoint_config = config.get("endpoint", {})

            # Preparar headers de autenticaÃ§Ã£o
            auth_headers = self._prepare_auth_headers(auth_config)

            # Preparar dados da requisiÃ§Ã£o
            request_data = self._prepare_request_data(
                endpoint_config, request.parameters
            )

            # Combinar headers
            request_data["headers"].update(auth_headers)

            # Preparar URL com path parameters
            url = self._replace_path_parameters(
                endpoint_config.get("url", ""), request.parameters, endpoint_config
            )

            # ConfiguraÃ§Ãµes de timeout e retry
            timeout = endpoint_config.get("timeout", 60)
            max_retries = endpoint_config.get("max_retries", 3)
            method = endpoint_config.get("method", "GET").upper()

            logger.debug(f"Executando chamada API: {method} {url}")

            # Realizar chamada HTTP
            async with httpx.AsyncClient(timeout=timeout) as client:
                for attempt in range(max_retries + 1):
                    try:
                        response = await client.request(
                            method=method,
                            url=url,
                            params=request_data["params"],
                            json=request_data["json"] if request_data["json"] else None,
                            headers=request_data["headers"],
                        )

                        # Verificar se a resposta foi bem-sucedida
                        response.raise_for_status()

                        # Tentar parsear JSON
                        try:
                            data = response.json()
                        except Exception:
                            data = response.text

                        execution_time = time.time() - start_time

                        logger.debug(
                            f"Chamada API bem-sucedida: {response.status_code}"
                        )

                        result = ApiCallResponse(
                            success=True,
                            data=data,
                            status_code=response.status_code,
                            execution_time=execution_time,
                        )
                        break

                    except httpx.HTTPStatusError as e:
                        if attempt == max_retries:
                            execution_time = time.time() - start_time
                            logger.error(
                                f"Erro HTTP na chamada API: {e.response.status_code}"
                            )

                            result = ApiCallResponse(
                                success=False,
                                error=f"Erro HTTP: {e.response.status_code} - {e.response.text}",
                                status_code=e.response.status_code,
                                execution_time=execution_time,
                            )
                            break

                        # Retry para alguns cÃ³digos de erro
                        if e.response.status_code in [429, 502, 503, 504]:
                            logger.warning(
                                f"Tentativa {attempt + 1} falhou, tentando novamente..."
                            )
                            # Backoff exponencial
                            await asyncio.sleep(2**attempt)
                            continue

                        # NÃ£o fazer retry para outros erros
                        break

                    except Exception as e:
                        if attempt == max_retries:
                            execution_time = time.time() - start_time
                            logger.error(f"Erro na chamada API: {str(e)}")

                            result = ApiCallResponse(
                                success=False,
                                error=f"Erro na requisiÃ§Ã£o: {str(e)}",
                                execution_time=execution_time,
                            )
                            break

                        logger.warning(
                            f"Tentativa {attempt + 1} falhou, tentando novamente..."
                        )
                        await asyncio.sleep(2**attempt)

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Erro interno no ApiService: {str(e)}")

            result = ApiCallResponse(
                success=False,
                error=f"Erro interno: {str(e)}",
                execution_time=execution_time,
            )

        return result


def get_api_service(
    tool_service: ToolService = Depends(get_tool_service),
) -> ApiService:
    """Factory function para criar instÃ¢ncia do ApiService"""
    return ApiService(tool_service)
