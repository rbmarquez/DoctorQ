import uuid
from typing import Optional

from langfuse import Langfuse

# Importar CallbackHandler com fallback para compatibilidade
try:
    from langfuse.langchain import CallbackHandler
except (ImportError, ModuleNotFoundError):
    # Fallback se langfuse não conseguir importar langchain callbacks
    # Criar uma classe dummy para evitar erros de inicialização
    class CallbackHandler:  # type: ignore
        """Dummy CallbackHandler quando langfuse-langchain não está disponível"""

        def __init__(self, *args, **kwargs):
            pass

from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.services.variable_service import VariableService

logger = get_logger(__name__)


class LangFuseConfig:
    """
    ConfiguraÃ§Ã£o simplificada do Langfuse

    Configura credencial a partir da configuraÃ§Ã£o de observabilidade do agent_config.
    Quando observability.ativo=True e observability.tipo="langfuse", usa observability.credencialId.
    """

    def __init__(
        self,
        db_session: Optional[AsyncSession] = None,
        id_credencial: Optional[str] = None,
    ):
        self.db_session = db_session
        self.variable_service = VariableService(db_session) if db_session else None
        self.id_credencial = id_credencial
        self.credencial_id = None  # SerÃ¡ carregado dinamicamente
        self.enabled = True
        self._client = None
        self._callback_handler = None
        self._credentials = None
        self._session_handlers = {}  # Cache de handlers por sessÃ£o

    def set_credential_from_agent_config(self, agent_config: dict):
        """Configurar credencial a partir do agent_config"""
        try:
            # ValidaÃ§Ãµes iniciais
            if not agent_config:
                logger.warning("agent_config nÃ£o fornecido")
                return False

            observability_config = agent_config.get("observability", {})
            if not observability_config.get("ativo", False):
                logger.debug("Observabilidade nÃ£o estÃ¡ ativa no agent_config")
                return False

            if observability_config.get("tipo") != "langfuse":
                logger.debug(
                    f"Tipo de observabilidade nÃ£o Ã© langfuse: {observability_config.get('tipo')}"
                )
                return False

            credencial_id_str = observability_config.get("credencialId")
            if not credencial_id_str:
                logger.warning(
                    "credencialId nÃ£o configurado na observabilidade do agent_config"
                )
                return False

            # Configurar credencial
            self.credencial_id = uuid.UUID(credencial_id_str)
            logger.debug(
                f"Credencial Langfuse configurada do agent_config: {self.credencial_id}"
            )
            return True

        except ValueError:
            logger.error(
                f"ID de credencial invÃ¡lido no agent_config: {credencial_id_str}"
            )
            return False
        except Exception as e:
            logger.error(f"Erro ao configurar credencial do agent_config: {e}")
            return False

    async def initialize(self, credencial_service) -> bool:
        """Inicializar Langfuse com credenciais"""
        # VerificaÃ§Ãµes iniciais
        if not self.enabled:
            return False

        if self._client:
            logger.debug("Langfuse jÃ¡ inicializado")
            return True

        if not self.credencial_id:
            return False

        try:
            # Buscar credenciais
            credencial_data = await credencial_service.get_credencial_decrypted(
                self.credencial_id
            )
            if not credencial_data:
                logger.error("Credencial Langfuse nÃ£o encontrada")
                return False

            dados = credencial_data.get("dados", {})
            required_keys = ["host", "public_key", "secret_key"]

            if not all(k in dados for k in required_keys):
                logger.error(f"Dados obrigatÃ³rios ausentes: {required_keys}")
                logger.debug(f"Dados disponÃ­veis: {list(dados.keys())}")
                return False

            # Configurar Langfuse
            self._credentials = {
                "host": dados["host"],
                "public_key": dados["public_key"],
                "secret_key": dados["secret_key"],
            }

            self._client = Langfuse(**self._credentials)
            self._callback_handler = CallbackHandler(
                **self._credentials, session_id=None
            )

            self._wrap_callback_handler_with_truncation()
            self._configure_token_capture()

            return True

        except Exception as e:
            logger.error(f"Erro ao inicializar Langfuse: {e}")
            return False

    def _configure_token_capture(self):
        """Configurar captura de tokens no callback handler"""
        callback_attributes = dir(self._callback_handler)
        token_capture_attrs = [
            "trace_inputs",
            "trace_outputs",
            "capture_inputs",
            "capture_outputs",
            "include_inputs",
            "include_outputs",
            "verbose_inputs",
            "verbose_outputs",
            "capture_usage",
            "include_usage",
            "trace_usage",
        ]

        for attr in token_capture_attrs:
            if attr in callback_attributes:
                setattr(self._callback_handler, attr, True)
                logger.debug(f"Configurado {attr} = True para captura de tokens")

    def get_client(self) -> Optional[Langfuse]:
        """Retornar cliente Langfuse"""
        return self._client if self.enabled else None

    def emergency_truncate_input(self, data, max_size: int = 1000000) -> any:
        """
        Truncamento de emergÃªncia para inputs muito grandes antes de entrarem no sistema

        Args:
            data: Dados de input
            max_size: Tamanho mÃ¡ximo em bytes (1MB por padrÃ£o)

        Returns:
            Dados truncados se necessÃ¡rio
        """
        try:
            import json

            if data is None:
                return data

            # Para strings, truncar diretamente
            if isinstance(data, str):
                size = len(data.encode("utf-8"))
                if size > max_size:
                    logger.warning(
                        f"Input de emergÃªncia truncado: {size} bytes -> {max_size} bytes"
                    )
                    return self._truncate_string(data, max_size, "emergency_input")
                return data

            # Para outros tipos, verificar tamanho serializado
            try:
                data_str = json.dumps(data, ensure_ascii=False, default=str)
                size = len(data_str.encode("utf-8"))

                if size > max_size:
                    logger.warning(
                        f"Input complexo de emergÃªncia truncado: {size} bytes -> {max_size} bytes"
                    )
                    return self.truncate_large_data(
                        data, max_size=max_size, field_name="emergency_complex_input"
                    )

                return data

            except Exception:
                # Se nÃ£o conseguir serializar, converter para string e truncar
                data_str = str(data)
                if len(data_str.encode("utf-8")) > max_size:
                    logger.warning("Input nÃ£o serializÃ¡vel truncado para string")
                    return self._truncate_string(
                        data_str, max_size, "emergency_fallback_input"
                    )
                return data_str

        except Exception as e:
            logger.error(f"Erro no truncamento de emergÃªncia: {e}")
            return "Erro: dados muito grandes para processar"

    def get_callbacks(self) -> list:
        """Retornar callbacks do Langfuse"""
        if not self.enabled:
            logger.debug("Langfuse desabilitado - retornando lista vazia de callbacks")
            return []

        if not self._callback_handler:
            logger.warning("Callback handler nÃ£o inicializado - retornando lista vazia")
            return []

        logger.debug("Retornando callback handler do Langfuse")
        return [self._callback_handler]

    def get_handler(
        self,
        trace_id: Optional[str] = None,
        session_id: Optional[str] = None,
        trace_name: Optional[str] = None,
    ) -> Optional[CallbackHandler]:
        """Retornar handler - usar get_callbacks_with_session em vez disso"""
        logger.warning("get_handler() Ã© deprecated - use get_callbacks_with_session()")
        callbacks = self.get_callbacks_with_session(
            session_id=session_id, trace_name=trace_name
        )
        return callbacks[0] if callbacks else None

    def get_simple_handler(self) -> Optional[CallbackHandler]:
        """Retornar handler simples apenas com credenciais bÃ¡sicas"""
        if not self.enabled or not self._credentials:
            return None

        try:
            handler = CallbackHandler(**self._credentials)
            logger.debug("CallbackHandler simples criado com sucesso")
            return handler
        except Exception as e:
            logger.error(f"Erro ao criar CallbackHandler simples: {e}")
            return None

    def is_initialized(self) -> bool:
        """Verificar se inicializado"""
        return self.enabled and self._client is not None

    def _wrap_callback_handler_with_truncation(self):
        """Aplica wrapper de truncamento ao callback handler"""
        if not self._callback_handler:
            return

        try:
            # Salvar mÃ©todos originais
            original_on_llm_end = getattr(self._callback_handler, "on_llm_end", None)
            original_on_chain_end = getattr(
                self._callback_handler, "on_chain_end", None
            )
            original_on_tool_end = getattr(self._callback_handler, "on_tool_end", None)
            original_on_agent_action = getattr(
                self._callback_handler, "on_agent_action", None
            )
            original_on_agent_finish = getattr(
                self._callback_handler, "on_agent_finish", None
            )

            # Wrapper para on_llm_end
            def wrapped_on_llm_end(response, **kwargs):
                if original_on_llm_end:
                    try:
                        # Truncar response se necessÃ¡rio (mais conservador)
                        if hasattr(response, "generations"):
                            for generation_list in response.generations:
                                for generation in generation_list:
                                    if hasattr(generation, "text"):
                                        if (
                                            len(generation.text.encode("utf-8")) > 50000
                                        ):  # 50KB para LLM output (muito conservador)
                                            generation.text = self._truncate_string(
                                                generation.text, 50000, "llm_output"
                                            )

                        return original_on_llm_end(response, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_llm_end: {e}")
                        return original_on_llm_end(response, **kwargs)

            # Wrapper para on_chain_end
            def wrapped_on_chain_end(outputs, **kwargs):
                if original_on_chain_end:
                    try:
                        # Truncar outputs se necessÃ¡rio (mais conservador)
                        truncated_outputs = self.truncate_large_data(
                            outputs, max_size=50000, field_name="chain_outputs"
                        )
                        return original_on_chain_end(truncated_outputs, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_chain_end: {e}")
                        return original_on_chain_end(outputs, **kwargs)

            # Wrapper para on_tool_end
            def wrapped_on_tool_end(output, **kwargs):
                if original_on_tool_end:
                    try:
                        # Truncar tool output se necessÃ¡rio (mais conservador)
                        truncated_output = self.truncate_large_data(
                            output, max_size=50000, field_name="tool_output"
                        )
                        return original_on_tool_end(truncated_output, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_tool_end: {e}")
                        return original_on_tool_end(output, **kwargs)

            # Wrapper para on_agent_action
            def wrapped_on_agent_action(action, **kwargs):
                if original_on_agent_action:
                    try:
                        # Truncar action input se necessÃ¡rio (mais conservador)
                        if hasattr(action, "tool_input"):
                            action.tool_input = self.truncate_large_data(
                                action.tool_input,
                                max_size=30000,
                                field_name="agent_action_input",
                            )
                        return original_on_agent_action(action, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_agent_action: {e}")
                        return original_on_agent_action(action, **kwargs)

            # Wrapper para on_agent_finish
            def wrapped_on_agent_finish(finish, **kwargs):
                if original_on_agent_finish:
                    try:
                        # Truncar agent output se necessÃ¡rio (mais conservador)
                        if hasattr(finish, "return_values"):
                            finish.return_values = self.truncate_large_data(
                                finish.return_values,
                                max_size=50000,
                                field_name="agent_finish_output",
                            )
                        return original_on_agent_finish(finish, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_agent_finish: {e}")
                        return original_on_agent_finish(finish, **kwargs)

            # Aplicar wrappers
            if original_on_llm_end:
                setattr(self._callback_handler, "on_llm_end", wrapped_on_llm_end)
            if original_on_chain_end:
                setattr(self._callback_handler, "on_chain_end", wrapped_on_chain_end)
            if original_on_tool_end:
                setattr(self._callback_handler, "on_tool_end", wrapped_on_tool_end)
            if original_on_agent_action:
                setattr(
                    self._callback_handler, "on_agent_action", wrapped_on_agent_action
                )
            if original_on_agent_finish:
                setattr(
                    self._callback_handler, "on_agent_finish", wrapped_on_agent_finish
                )

            logger.debug("Wrapper de truncamento aplicado ao callback handler")

        except Exception as e:
            logger.error(
                f"Erro ao aplicar wrapper de truncamento ao callback handler: {e}"
            )

    def _apply_truncation_to_handler(self, handler):
        """Aplica truncamento a um handler especÃ­fico"""
        if not handler:
            return

        try:
            # Salvar mÃ©todos originais
            original_on_llm_end = getattr(handler, "on_llm_end", None)
            original_on_chain_end = getattr(handler, "on_chain_end", None)
            original_on_tool_end = getattr(handler, "on_tool_end", None)
            original_on_agent_action = getattr(handler, "on_agent_action", None)
            original_on_agent_finish = getattr(handler, "on_agent_finish", None)

            # Wrapper para on_llm_end
            def wrapped_on_llm_end(response, **kwargs):
                if original_on_llm_end:
                    try:
                        # Truncar response se necessÃ¡rio
                        if hasattr(response, "generations"):
                            for generation_list in response.generations:
                                for generation in generation_list:
                                    if hasattr(generation, "text"):
                                        if (
                                            len(generation.text.encode("utf-8")) > 50000
                                        ):  # 50KB para LLM output (muito conservador)
                                            generation.text = self._truncate_string(
                                                generation.text, 50000, "llm_output"
                                            )

                        return original_on_llm_end(response, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_llm_end (handler): {e}")
                        return original_on_llm_end(response, **kwargs)

            # Wrapper para on_chain_end
            def wrapped_on_chain_end(outputs, **kwargs):
                if original_on_chain_end:
                    try:
                        # Truncar outputs se necessÃ¡rio
                        truncated_outputs = self.truncate_large_data(
                            outputs, max_size=50000, field_name="chain_outputs"
                        )
                        return original_on_chain_end(truncated_outputs, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_chain_end (handler): {e}")
                        return original_on_chain_end(outputs, **kwargs)

            # Wrapper para on_tool_end
            def wrapped_on_tool_end(output, **kwargs):
                if original_on_tool_end:
                    try:
                        # Truncar tool output se necessÃ¡rio
                        truncated_output = self.truncate_large_data(
                            output, max_size=50000, field_name="tool_output"
                        )
                        return original_on_tool_end(truncated_output, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_tool_end (handler): {e}")
                        return original_on_tool_end(output, **kwargs)

            # Wrapper para on_agent_action
            def wrapped_on_agent_action(action, **kwargs):
                if original_on_agent_action:
                    try:
                        # Truncar action input se necessÃ¡rio
                        if hasattr(action, "tool_input"):
                            action.tool_input = self.truncate_large_data(
                                action.tool_input,
                                max_size=30000,
                                field_name="agent_action_input",
                            )
                        return original_on_agent_action(action, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_agent_action (handler): {e}")
                        return original_on_agent_action(action, **kwargs)

            # Wrapper para on_agent_finish
            def wrapped_on_agent_finish(finish, **kwargs):
                if original_on_agent_finish:
                    try:
                        # Truncar agent output se necessÃ¡rio
                        if hasattr(finish, "return_values"):
                            finish.return_values = self.truncate_large_data(
                                finish.return_values,
                                max_size=50000,
                                field_name="agent_finish_output",
                            )
                        return original_on_agent_finish(finish, **kwargs)
                    except Exception as e:
                        logger.error(f"Erro no wrapped_on_agent_finish (handler): {e}")
                        return original_on_agent_finish(finish, **kwargs)

            # Aplicar wrappers
            if original_on_llm_end:
                setattr(handler, "on_llm_end", wrapped_on_llm_end)
            if original_on_chain_end:
                setattr(handler, "on_chain_end", wrapped_on_chain_end)
            if original_on_tool_end:
                setattr(handler, "on_tool_end", wrapped_on_tool_end)
            if original_on_agent_action:
                setattr(handler, "on_agent_action", wrapped_on_agent_action)
            if original_on_agent_finish:
                setattr(handler, "on_agent_finish", wrapped_on_agent_finish)

            logger.debug("Wrapper de truncamento aplicado ao handler especÃ­fico")

        except Exception as e:
            logger.error(f"Erro ao aplicar truncamento ao handler: {e}")

    def flush(self) -> None:
        """Flush do cliente"""
        if not self.enabled:
            logger.debug("Langfuse desabilitado - flush ignorado")
            return

        if self._client:
            try:
                logger.debug("Executando flush do cliente Langfuse...")
                self._client.flush()
                logger.debug("Flush do Langfuse executado com sucesso")
            except Exception as e:
                logger.error(f"Erro no flush do Langfuse: {e}")
        else:
            logger.warning("Cliente Langfuse nÃ£o inicializado - flush ignorado")

    def _check_data_size_safe(
        self, data, max_size: int = 100000, field_name: str = "data"
    ) -> bool:
        """
        VerificaÃ§Ã£o rÃ¡pida de tamanho dos dados para prevenir travamentos

        Args:
            data: Dados a serem verificados
            max_size: Tamanho mÃ¡ximo seguro em bytes (100KB por padrÃ£o)
            field_name: Nome do campo para logs

        Returns:
            bool: True se os dados estÃ£o em tamanho seguro
        """
        try:
            import json

            if data is None:
                return True

            # VerificaÃ§Ã£o rÃ¡pida para strings
            if isinstance(data, str):
                size = len(data.encode("utf-8"))
                if size > max_size:
                    logger.warning(
                        f"Dados {field_name} muito grandes: {size} bytes > {max_size} bytes - serÃ¡ truncado"
                    )
                    return False
                return True

            # Para outros tipos, serializar para verificar tamanho
            data_str = json.dumps(data, ensure_ascii=False, default=str)
            size = len(data_str.encode("utf-8"))

            if size > max_size:
                logger.warning(
                    f"Dados {field_name} muito grandes: {size} bytes > {max_size} bytes - serÃ¡ truncado"
                )
                return False

            return True

        except Exception as e:
            logger.error(f"Erro ao verificar tamanho dos dados {field_name}: {e}")
            # Em caso de erro, assumir que Ã© grande demais para ser seguro
            return False

    def truncate_large_data(
        self, data, max_size: int = 200000, field_name: str = "data"
    ) -> dict:
        """
        Trunca dados grandes para evitar erro 'Item exceeds size limit' no Langfuse

        Args:
            data: Dados a serem truncados (pode ser dict, str, list, etc.)
            max_size: Tamanho mÃ¡ximo em bytes (padrÃ£o 1.5MB, sendo que Langfuse limita em ~2MB)
            field_name: Nome do campo para logs

        Returns:
            Dados truncados
        """
        try:
            import json

            if data is None:
                return data

            # Calcular tamanho atual
            data_str = json.dumps(data, ensure_ascii=False, default=str)
            current_size = len(data_str.encode("utf-8"))

            # Se estÃ¡ dentro do limite, retornar sem alteraÃ§Ãµes
            if current_size <= max_size:
                return data

            logger.info(
                f"Truncando {field_name}: {current_size} bytes > {max_size} bytes"
            )

            # EstratÃ©gias de truncamento baseadas no tipo
            if isinstance(data, dict):
                return self._truncate_dict(data, max_size, field_name)
            if isinstance(data, str):
                return self._truncate_string(data, max_size, field_name)
            if isinstance(data, list):
                return self._truncate_list(data, max_size, field_name)

            # Para outros tipos, converter para string e truncar
            data_str = str(data)
            return self._truncate_string(data_str, max_size, field_name)

        except Exception as e:
            logger.error(f"Erro ao truncar {field_name}: {e}")
            return {
                "error": f"Dados muito grandes para processar ({field_name})",
                "truncated": True,
            }

    def _truncate_string(self, data: str, max_size: int, field_name: str) -> str:
        """Trunca string mantendo informaÃ§Ãµes importantes"""
        # Calcular tamanho mÃ¡ximo aproximado para o conteÃºdo
        overhead = 200  # Overhead para metadados de truncamento
        max_content_size = max_size - overhead

        if len(data.encode("utf-8")) <= max_content_size:
            return data

        # Truncar mantendo inÃ­cio e fim se possÃ­vel
        data_bytes = data.encode("utf-8")
        if len(data_bytes) > max_content_size:
            # Manter 60% do inÃ­cio e 10% do fim (mais agressivo)
            start_size = int(max_content_size * 0.6)
            end_size = int(max_content_size * 0.1)

            start_part = data_bytes[:start_size].decode("utf-8", errors="ignore")
            end_part = data_bytes[-end_size:].decode("utf-8", errors="ignore")

            truncation_info = f"\n\n[TRUNCADO: {len(data_bytes)} bytes > {max_size} bytes - mantido inÃ­cio e fim]"
            result = start_part + truncation_info + "\n...\n" + end_part

            logger.debug(
                f"{field_name} string truncada: {len(data)} -> {len(result)} chars"
            )
            return result

        return data

    def _truncate_list(self, data: list, max_size: int, field_name: str) -> list:
        """Trunca lista mantendo elementos importantes"""
        import json

        # Tentar manter os primeiros elementos atÃ© atingir o limite
        truncated_list = []
        current_size = 0
        overhead = 500  # Overhead para metadados

        for i, item in enumerate(data):
            item_str = json.dumps(item, ensure_ascii=False, default=str)
            item_size = len(item_str.encode("utf-8"))

            if current_size + item_size + overhead > max_size:
                # Adicionar informaÃ§Ã£o sobre truncamento
                truncated_list.append(
                    {
                        "truncated": True,
                        "message": f"Lista truncada apÃ³s {i} de {len(data)} itens",
                        "original_size": len(data),
                        "size_limit_reached": max_size,
                    }
                )
                break

            truncated_list.append(item)
            current_size += item_size

        logger.debug(
            f"{field_name} lista truncada: {len(data)} -> {len(truncated_list)} itens"
        )
        return truncated_list

    def _truncate_dict(self, data: dict, max_size: int, field_name: str) -> dict:
        """Trunca dicionÃ¡rio priorizando campos importantes"""
        import json

        # Campos prioritÃ¡rios que devem ser mantidos
        priority_fields = [
            "content",
            "input",
            "output",
            "message",
            "result",
            "response",
        ]

        # Campos que podem ser truncados mais agressivamente
        truncatable_fields = [
            "intermediate_steps",
            "chat_history",
            "context",
            "full_content",
            "raw_data",
        ]

        result = {}
        current_size = 0
        overhead = 1000  # Overhead para metadados e estrutura JSON

        # Primeiro, incluir campos prioritÃ¡rios
        for key in priority_fields:
            if key in data:
                value = data[key]

                # Se o valor Ã© muito grande, truncar especificamente
                if (
                    isinstance(value, str)
                    and len(value.encode("utf-8")) > max_size // 2
                ):
                    value = self._truncate_string(
                        value, max_size // 2, f"{field_name}.{key}"
                    )
                elif (
                    isinstance(value, list)
                    and len(json.dumps(value, default=str).encode("utf-8"))
                    > max_size // 2
                ):
                    value = self._truncate_list(
                        value, max_size // 2, f"{field_name}.{key}"
                    )

                result[key] = value

                # Calcular tamanho atual
                result_str = json.dumps(result, ensure_ascii=False, default=str)
                current_size = len(result_str.encode("utf-8"))

                if current_size + overhead > max_size:
                    break

        # Incluir outros campos atÃ© o limite
        for key, value in data.items():
            if key in priority_fields:
                continue  # JÃ¡ processado

            if current_size + overhead > max_size:
                break

            # Para campos truncÃ¡veis, aplicar truncamento mais agressivo
            if key in truncatable_fields:
                if (
                    isinstance(value, str) and len(value.encode("utf-8")) > 5000
                ):  # 50KB max
                    value = self._truncate_string(value, 50000, f"{field_name}.{key}")
                elif isinstance(value, list) and len(value) > 10:  # Max 10 itens
                    value = value[:10] + [
                        {"truncated": f"Lista reduzida de {len(value)} para 10 itens"}
                    ]

            result[key] = value

            # Recalcular tamanho
            result_str = json.dumps(result, ensure_ascii=False, default=str)
            current_size = len(result_str.encode("utf-8"))

        # Adicionar informaÃ§Ã£o sobre truncamento se necessÃ¡rio
        if len(result) < len(data):
            result["_langfuse_truncated"] = {
                "original_fields": len(data),
                "truncated_fields": len(data) - len(result),
                "size_limit": max_size,
                "truncated_at": field_name,
            }

        logger.debug(f"{field_name} dict truncado: {len(data)} -> {len(result)} campos")
        return result

    def clear_session_handlers(self) -> None:
        """Limpar cache de handlers por sessÃ£o"""
        try:
            cleared_count = len(self._session_handlers)
            self._session_handlers.clear()
            logger.debug(f"Cache de handlers limpo: {cleared_count} handlers removidos")
        except Exception as e:
            logger.error(f"Erro ao limpar cache de handlers: {e}")

    def remove_session_handler(self, session_id: str) -> None:
        """Remover handler especÃ­fico do cache"""
        try:
            if session_id in self._session_handlers:
                del self._session_handlers[session_id]
        except Exception as e:
            logger.error(f"Erro ao remover handler do cache: {e}")

    def create_trace(
        self,
        name: str,
        session_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs,
    ):
        """Criar trace com informaÃ§Ãµes de sessÃ£o"""
        if not self._client:
            # logger.warning("Langfuse nÃ£o inicializado")
            return None

        trace_kwargs = {"name": name, "session_id": session_id, **kwargs}

        # VerificaÃ§Ã£o preventiva e truncamento mais agressivo
        if "input" in kwargs:
            if not self._check_data_size_safe(kwargs["input"], 50000, "trace_input"):
                trace_kwargs["input"] = self.truncate_large_data(
                    kwargs["input"], max_size=50000, field_name="trace_input"
                )
            else:
                trace_kwargs["input"] = kwargs["input"]
            logger.debug(f"Input processado para trace {name}")

        if "output" in kwargs:
            if not self._check_data_size_safe(kwargs["output"], 50000, "trace_output"):
                trace_kwargs["output"] = self.truncate_large_data(
                    kwargs["output"], max_size=50000, field_name="trace_output"
                )
            else:
                trace_kwargs["output"] = kwargs["output"]

        if metadata:
            if not self._check_data_size_safe(metadata, 10000, "trace_metadata"):
                trace_kwargs["metadata"] = self.truncate_large_data(
                    metadata, max_size=10000, field_name="trace_metadata"
                )
            else:
                trace_kwargs["metadata"] = metadata

        logger.debug(f"Criando trace: {name} com session_id: {session_id}")
        logger.debug(f"Trace kwargs: {list(trace_kwargs.keys())}")

        try:
            return self._client.trace(**trace_kwargs)
        except Exception as e:
            logger.error(f"Erro ao criar trace {name}: {e}")
            # Tentar novamente com dados mais reduzidos em caso de erro
            try:
                # Aplicar truncamento de emergÃªncia ainda mais agressivo
                for key in ["input", "output"]:
                    if key in trace_kwargs:
                        trace_kwargs[key] = self.truncate_large_data(
                            trace_kwargs[key],
                            max_size=30000,  # 30KB como limite de emergÃªncia
                            field_name=f"trace_{key}_emergency",
                        )

                # Reduzir metadata drasticamente
                if "metadata" in trace_kwargs:
                    trace_kwargs["metadata"] = self.truncate_large_data(
                        trace_kwargs["metadata"],
                        max_size=5000,  # 5KB para metadata em emergÃªncia
                        field_name="trace_metadata_emergency",
                    )

                logger.warning(
                    f"Tentativa de recuperaÃ§Ã£o para trace {name} com dados reduzidos"
                )
                return self._client.trace(**trace_kwargs)
            except Exception as e2:
                logger.error(f"Erro persistente ao criar trace {name}: {e2}")
                # Em Ãºltimo caso, criar trace mÃ­nimo apenas com nome e session_id
                try:
                    minimal_trace = self._client.trace(
                        name=name,
                        session_id=session_id,
                        metadata={"error": "Dados muito grandes - trace mÃ­nimo criado"},
                    )
                    logger.warning(
                        f"Trace mÃ­nimo criado para {name} devido a erro de tamanho"
                    )
                    return minimal_trace
                except Exception as e3:
                    logger.error(f"Falha total ao criar trace {name}: {e3}")
                    return None

    def create_span(
        self,
        trace_context,
        name: str,
        metadata: Optional[dict] = None,
        input_data: Optional[dict] = None,
        **kwargs,
    ):
        """Criar span dentro de um trace existente"""
        if not trace_context:
            logger.warning("Contexto de trace nÃ£o fornecido para criar span")
            return None

        try:
            span_kwargs = {"name": name, **kwargs}

            # VerificaÃ§Ã£o preventiva e truncamento mais agressivo
            if metadata:
                if not self._check_data_size_safe(metadata, 10000, "span_metadata"):
                    span_kwargs["metadata"] = self.truncate_large_data(
                        metadata, max_size=10000, field_name="span_metadata"
                    )
                else:
                    span_kwargs["metadata"] = metadata

            if input_data:
                if not self._check_data_size_safe(input_data, 40000, "span_input"):
                    span_kwargs["input"] = self.truncate_large_data(
                        input_data, max_size=40000, field_name="span_input"
                    )
                else:
                    span_kwargs["input"] = input_data

            if "output" in kwargs:
                if not self._check_data_size_safe(
                    kwargs["output"], 40000, "span_output"
                ):
                    span_kwargs["output"] = self.truncate_large_data(
                        kwargs["output"], max_size=40000, field_name="span_output"
                    )
                else:
                    span_kwargs["output"] = kwargs["output"]

            logger.debug(
                f"Criando span: {name} no trace: {getattr(trace_context, 'id', 'unknown')}"
            )

            span = trace_context.span(**span_kwargs)

            # Armazenar o nome no span para referÃªncia futura
            if span and hasattr(span, "__dict__"):
                setattr(span, "_display_name", name)

            return span

        except Exception as e:
            logger.error(f"Erro ao criar span {name}: {e}")
            # Tentar novamente com dados mais reduzidos
            try:
                # Aplicar truncamento de emergÃªncia ainda mais agressivo
                for key in ["input", "output"]:
                    if key in span_kwargs:
                        span_kwargs[key] = self.truncate_large_data(
                            span_kwargs[key],
                            max_size=50000,  # 50KB como limite de emergÃªncia para spans
                            field_name=f"span_{key}_emergency",
                        )

                # Reduzir metadata drasticamente
                if "metadata" in span_kwargs:
                    span_kwargs["metadata"] = self.truncate_large_data(
                        span_kwargs["metadata"],
                        max_size=10000,  # 10KB para metadata em emergÃªncia
                        field_name="span_metadata_emergency",
                    )

                logger.warning(
                    f"Tentativa de recuperaÃ§Ã£o para span {name} com dados reduzidos"
                )
                span = trace_context.span(**span_kwargs)

                if span and hasattr(span, "__dict__"):
                    setattr(span, "_display_name", name)

                return span
            except Exception as e2:
                logger.error(f"Erro persistente ao criar span {name}: {e2}")
                # Em Ãºltimo caso, criar span mÃ­nimo
                try:
                    minimal_span = trace_context.span(
                        name=name,
                        metadata={"error": "Dados muito grandes - span mÃ­nimo criado"},
                    )
                    if minimal_span and hasattr(minimal_span, "__dict__"):
                        setattr(minimal_span, "_display_name", name)
                    logger.warning(
                        f"Span mÃ­nimo criado para {name} devido a erro de tamanho"
                    )
                    return minimal_span
                except Exception as e3:
                    logger.error(f"Falha total ao criar span {name}: {e3}")
                    return None

    def create_generation(
        self,
        trace_context,
        name: str,
        model: Optional[str] = None,
        input_data: Optional[dict] = None,
        metadata: Optional[dict] = None,
        **kwargs,
    ):
        """Criar generation (LLM span) dentro de um trace existente"""
        if not trace_context:
            logger.warning("Contexto de trace nÃ£o fornecido para criar generation")
            return None

        try:
            generation_kwargs = {"name": name, **kwargs}

            if model:
                generation_kwargs["model"] = model

            # Aplicar truncamento preventivo nos dados da generation
            if metadata:
                generation_kwargs["metadata"] = self.truncate_large_data(
                    metadata, max_size=100000, field_name="generation_metadata"
                )

            if input_data:
                generation_kwargs["input"] = self.truncate_large_data(
                    input_data, field_name="generation_input"
                )
                logger.debug(f"Input processado para generation {name}")

            if "output" in kwargs:
                generation_kwargs["output"] = self.truncate_large_data(
                    kwargs["output"], field_name="generation_output"
                )

            logger.debug(
                f"Criando generation: {name} com model: {model} no trace: {getattr(trace_context, 'id', 'unknown')}"
            )
            logger.debug(f"Generation kwargs: {list(generation_kwargs.keys())}")

            generation = trace_context.generation(**generation_kwargs)

            # Armazenar o nome na generation para referÃªncia futura
            if generation and hasattr(generation, "__dict__"):
                setattr(generation, "_display_name", name)

            return generation

        except Exception as e:
            logger.error(f"Erro ao criar generation {name}: {e}")
            # Tentar novamente com dados mais reduzidos
            try:
                # Aplicar truncamento ainda mais agressivo
                for key in ["input", "output", "metadata"]:
                    if key in generation_kwargs:
                        generation_kwargs[key] = self.truncate_large_data(
                            generation_kwargs[key],
                            max_size=300000,  # 300KB como limite de emergÃªncia para generations
                            field_name=f"generation_{key}_emergency",
                        )

                logger.warning(
                    f"Tentativa de recuperaÃ§Ã£o para generation {name} com dados reduzidos"
                )
                generation = trace_context.generation(**generation_kwargs)

                if generation and hasattr(generation, "__dict__"):
                    setattr(generation, "_display_name", name)

                return generation
            except Exception as e2:
                logger.error(f"Erro persistente ao criar generation {name}: {e2}")
                return None

    def create_tool_execution_span(
        self,
        parent_span,
        tool_name: str,
        input_data: Optional[dict] = None,
        metadata: Optional[dict] = None,
    ):
        """Criar span para execuÃ§Ã£o de tool dentro de um trace ou span pai"""
        if not parent_span:
            logger.warning(
                "Contexto de span pai nÃ£o fornecido para criar tool execution span"
            )
            return None

        # Validar se parent_span nÃ£o Ã© uma string
        if isinstance(parent_span, str):
            logger.error(
                f"Erro ao criar tool execution span {tool_name}: parent_span Ã© uma string ('{parent_span}') em vez de um objeto span"
            )
            return None

        try:
            span_kwargs = {
                "name": f"tool_{tool_name}",
                "metadata": {
                    "type": "tool_execution",
                    "tool_name": tool_name,
                    **(metadata or {}),
                },
            }

            if input_data:
                span_kwargs["input"] = input_data
                logger.debug(f"Input adicionado ao tool span {tool_name}: {input_data}")

            logger.debug(
                f"Criando tool execution span: {tool_name} no parent: {getattr(parent_span, 'id', 'unknown')}"
            )

            tool_span = parent_span.span(**span_kwargs)

            # Armazenar o nome no span para referÃªncia futura
            if tool_span and hasattr(tool_span, "__dict__"):
                setattr(tool_span, "_display_name", f"tool_{tool_name}")

            return tool_span

        except Exception as e:
            logger.error(f"Erro ao criar tool execution span {tool_name}: {e}")
            return None

    def end_span(
        self,
        span_context,
        output_data: Optional[dict] = None,
        metadata: Optional[dict] = None,
    ):
        """Finalizar span com output e metadata opcionais"""
        if not span_context:
            return

        # Validar se span_context nÃ£o Ã© uma string
        if isinstance(span_context, str):
            logger.error(
                f"Erro ao finalizar span: span_context Ã© uma string ('{span_context}') em vez de um objeto span"
            )
            return

        try:
            end_kwargs = {}

            if output_data:
                end_kwargs["output"] = output_data

            if metadata:
                # Merge metadata se jÃ¡ existir
                existing_metadata = getattr(span_context, "metadata", {}) or {}
                end_kwargs["metadata"] = {**existing_metadata, **metadata}

            # Tentar obter nome do span de diferentes formas
            span_name = "unknown"
            if hasattr(span_context, "_display_name"):
                span_name = getattr(span_context, "_display_name", "unknown")
            elif hasattr(span_context, "name"):
                span_name = span_context.name
            elif hasattr(span_context, "_name"):
                span_name = getattr(span_context, "_name", "unknown")
            elif metadata and "tool_name" in metadata:
                span_name = metadata["tool_name"]
            elif hasattr(span_context, "id"):
                span_name = f"span_{span_context.id}"

            span_context.end(**end_kwargs)
            logger.debug(f"Span finalizado: {span_name}")

        except Exception as e:
            logger.error(f"Erro ao finalizar span: {e}")
            # Log mais detalhado do erro
            logger.debug(f"Span context type: {type(span_context)}")
            logger.debug(f"Span context attributes: {dir(span_context)}")

    def create_session_context(self, session_id: str, trace_name: Optional[str] = None):
        """Criar contexto de sessÃ£o para rastreamento"""
        if not self._client:
            logger.warning("Cliente Langfuse nÃ£o inicializado")
            return None

        try:
            # Criar trace principal da sessÃ£o com nome "AgentExecutor"
            effective_trace_name = trace_name or "AgentExecutor"
            trace = self._client.trace(
                name=effective_trace_name,
                session_id=session_id,
                metadata={
                    "session_type": "agent_execution",
                    "session_id": session_id,
                    "trace_type": "langchain_agent",
                    "agent_type": "openai_functions_agent",
                },
            )

            logger.debug(
                f"Contexto de sessÃ£o criado para session_id: {session_id} com trace_name: {effective_trace_name}"
            )
            return trace

        except Exception as e:
            logger.error(f"Erro ao criar contexto de sessÃ£o: {e}")
            return None

    def disable(self):
        """Desabilitar Langfuse"""
        self.enabled = False

    def enable(self):
        """Habilitar Langfuse"""
        self.enabled = True

    def configure_input_tracking(self, enable_detailed_tracking: bool = True):
        """Configurar rastreamento detalhado de inputs"""
        if not self.enabled or not self._callback_handler:
            return

        try:
            # Verificar se o handler suporta configuraÃ§Ãµes avanÃ§adas
            # available_attrs = [
            #     attr for attr in dir(self._callback_handler) if not attr.startswith("_")
            # ]

            # Tentar configurar diferentes opÃ§Ãµes de captura
            tracking_attrs = [
                "trace_inputs",
                "trace_outputs",
                "capture_inputs",
                "capture_outputs",
                "include_inputs",
                "include_outputs",
                "verbose_inputs",
                "verbose_outputs",
            ]

            for attr in tracking_attrs:
                if hasattr(self._callback_handler, attr):
                    setattr(self._callback_handler, attr, enable_detailed_tracking)
                    logger.debug(f"Configurado {attr} = {enable_detailed_tracking}")

        except Exception as e:
            logger.error(f"Erro ao configurar rastreamento de inputs: {e}")

    def verify_token_capture_configuration(self) -> dict:
        """Verificar e retornar configuraÃ§Ã£o de captura de tokens"""
        if not self._callback_handler:
            return {
                "status": "no_handler",
                "message": "Callback handler nÃ£o inicializado",
            }

        available_attrs = dir(self._callback_handler)
        token_capture_attrs = [
            "trace_inputs",
            "trace_outputs",
            "capture_inputs",
            "capture_outputs",
            "include_inputs",
            "include_outputs",
            "verbose_inputs",
            "verbose_outputs",
            "capture_usage",
            "include_usage",
            "trace_usage",
        ]

        configured_attrs = {}
        for attr in token_capture_attrs:
            if attr in available_attrs:
                configured_attrs[attr] = getattr(self._callback_handler, attr, None)

        return {
            "status": "configured",
            "available_attributes": [
                attr for attr in available_attrs if not attr.startswith("_")
            ],
            "token_capture_settings": configured_attrs,
            "langfuse_version": getattr(
                self._callback_handler, "_langfuse_version", "unknown"
            ),
        }

    def get_status(self) -> dict:
        """Retornar status do Langfuse"""
        return {
            "enabled": self.enabled,
            "initialized": self.is_initialized(),
            "has_client": self._client is not None,
            "has_callback": self._callback_handler is not None,
            "host": self._credentials.get("host") if self._credentials else None,
        }

    def get_callbacks_with_session(
        self, session_id: Optional[str] = None, trace_name: Optional[str] = None
    ) -> list:
        """Retornar callbacks com contexto de sessÃ£o - usar cache para evitar duplicaÃ§Ã£o"""
        if not self.enabled:
            logger.debug("Langfuse desabilitado - retornando lista vazia de callbacks")
            return []

        if not self._credentials:
            # logger.warning("Credenciais nÃ£o configuradas - retornando lista vazia")
            return []

        try:
            # Se session_id for fornecido, usar cache de handlers
            if session_id:
                # Verificar se jÃ¡ existe um handler para esta sessÃ£o
                if session_id in self._session_handlers:
                    logger.debug(
                        f"Reutilizando handler existente para session_id: {session_id}"
                    )
                    return [self._session_handlers[session_id]]

                # Criar novo handler para a sessÃ£o
                try:
                    session_handler = CallbackHandler(
                        **self._credentials, session_id=session_id
                    )

                    # Configurar captura de tokens
                    callback_attributes = dir(session_handler)
                    token_capture_attrs = [
                        "trace_inputs",
                        "trace_outputs",
                        "capture_inputs",
                        "capture_outputs",
                        "include_inputs",
                        "include_outputs",
                        "verbose_inputs",
                        "verbose_outputs",
                        "capture_usage",
                        "include_usage",
                        "trace_usage",
                    ]

                    for attr in token_capture_attrs:
                        if attr in callback_attributes:
                            setattr(session_handler, attr, True)

                    # Aplicar truncamento ao handler de sessÃ£o
                    self._apply_truncation_to_handler(session_handler)

                    # Armazenar no cache
                    self._session_handlers[session_id] = session_handler
                    logger.debug(
                        f"Novo handler criado e armazenado em cache para session_id: {session_id}"
                    )
                    return [session_handler]

                except Exception as e:
                    logger.error(f"Erro ao criar handler com session_id: {e}")
                    # Fallback para handler padrÃ£o

            # Fallback para callback padrÃ£o
            logger.debug("Retornando callback handler padrÃ£o")
            return [self._callback_handler] if self._callback_handler else []

        except Exception as e:
            logger.error(f"Erro ao criar callbacks com sessÃ£o: {e}")
            return [self._callback_handler] if self._callback_handler else []


# InstÃ¢ncia global para singleton
_LANGFUSE_CONFIG = None


def create_langfuse_config(
    db_session: Optional[AsyncSession] = None, id_credencial: Optional[str] = None
) -> LangFuseConfig:
    """Factory function para criar nova instÃ¢ncia do LangFuseConfig"""
    return LangFuseConfig(db_session=db_session, id_credencial=id_credencial)


def get_langfuse_config(
    db_session: Optional[AsyncSession] = None, id_credencial: Optional[str] = None
) -> LangFuseConfig:
    """Factory function para obter instÃ¢ncia singleton do LangFuseConfig"""
    global _LANGFUSE_CONFIG  # pylint: disable=global-statement
    if _LANGFUSE_CONFIG is None:
        _LANGFUSE_CONFIG = LangFuseConfig(
            db_session=db_session, id_credencial=id_credencial
        )
    return _LANGFUSE_CONFIG
