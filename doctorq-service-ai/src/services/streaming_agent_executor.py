# src/services/streaming_agent_executor.py
import uuid
from typing import Any, AsyncGenerator, Dict, List, Optional

from langchain.agents import AgentExecutor
from langchain_openai import AzureChatOpenAI

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class StreamingAgentExecutor:
    """
    Executor de agente com streaming real usando estratÃ©gia hÃ­brida.
    Combina streaming do LLM com execuÃ§Ã£o de ferramentas quando necessÃ¡rio.
    """

    def __init__(self, agent_executor: AgentExecutor, llm: AzureChatOpenAI):
        self.agent_executor = agent_executor
        self.llm = llm
        self._intermediate_steps: List[Any] = []

    async def astream_invoke(
        self, agent_input: Dict[str, Any], max_tool_iterations: int = 3
    ) -> AsyncGenerator[str, None]:
        """
        Executar agente com streaming real, alternando entre LLM e ferramentas conforme necessÃ¡rio.

        Args:
            agent_input: Input para o agente (input, chat_history, system_prompt)
            max_tool_iterations: MÃ¡ximo de iteraÃ§Ãµes de ferramentas

        Yields:
            str: Chunks da resposta em streaming
        """
        try:
            iteration = 0
            self._intermediate_steps = []

            # Extrair dados do input
            user_input = agent_input.get("input", "")
            chat_history = agent_input.get("chat_history", [])
            system_prompt = agent_input.get("system_prompt", "")

            logger.debug(
                f"ðŸ”„ [STREAMING_AGENT] Iniciando streaming com {len(self.agent_executor.tools)} ferramentas"
            )

            # Preparar mensagens iniciais
            messages = []
            if system_prompt:
                from langchain_core.messages import SystemMessage

                messages.append(SystemMessage(content=system_prompt))

            # Adicionar histÃ³rico
            messages.extend(chat_history)

            # Adicionar input do usuÃ¡rio
            from langchain_core.messages import HumanMessage

            messages.append(HumanMessage(content=user_input))

            # Loop principal: alternar entre LLM e ferramentas
            while iteration < max_tool_iterations:
                iteration += 1

                logger.debug(
                    f"ðŸ”„ [STREAMING_AGENT] IteraÃ§Ã£o {iteration}/{max_tool_iterations}"
                )

                # 1. Tentar obter resposta do LLM com streaming
                llm_response = ""
                tool_calls = []

                try:
                    # Stream da resposta do LLM
                    async for chunk in self.llm.astream(messages):
                        if hasattr(chunk, "content") and chunk.content:
                            content = str(chunk.content)
                            llm_response += content

                            # Se nÃ£o detectamos function calls ainda, fazer yield imediato
                            if not self._contains_function_call_indicators(
                                llm_response
                            ):
                                yield content

                        # Capturar function calls se existirem
                        if hasattr(chunk, "tool_calls") and chunk.tool_calls:
                            tool_calls.extend(chunk.tool_calls)
                        elif hasattr(
                            chunk, "additional_kwargs"
                        ) and chunk.additional_kwargs.get("tool_calls"):
                            tool_calls.extend(chunk.additional_kwargs["tool_calls"])

                except Exception as e:
                    logger.error(f"âŒ [STREAMING_AGENT] Erro no LLM streaming: {e}")
                    yield f"Erro no processamento: {e}"
                    return

                # 2. Se nÃ£o hÃ¡ tool calls, resposta final
                if not tool_calls and not self._needs_tool_execution(llm_response):
                    logger.debug("âœ… [STREAMING_AGENT] Resposta final sem ferramentas")

                    # Se ainda nÃ£o fizemos yield (caso function call foi detectado erroneamente)
                    if self._contains_function_call_indicators(llm_response):
                        # Limpar indicadores de function call e fazer yield
                        clean_response = self._clean_function_call_artifacts(
                            llm_response
                        )
                        if clean_response.strip():
                            yield clean_response

                    return

                # 3. Executar ferramentas identificadas
                if tool_calls or self._needs_tool_execution(llm_response):
                    logger.debug(
                        f"ðŸ”§ [STREAMING_AGENT] Executando {len(tool_calls)} ferramentas"
                    )

                    # Indicar que estamos processando
                    yield "ðŸ”§ Processando informaÃ§Ãµes..."

                    try:
                        # Executar ferramentas
                        tool_results = await self._execute_tools(
                            tool_calls, llm_response
                        )

                        # Adicionar resultados Ã s mensagens
                        if tool_results:
                            from langchain_core.messages import ToolMessage

                            for tool_result in tool_results:
                                messages.append(
                                    ToolMessage(
                                        content=str(tool_result["result"]),
                                        tool_call_id=tool_result.get(
                                            "tool_call_id", str(uuid.uuid4())
                                        ),
                                    )
                                )

                        # Continuar o loop para prÃ³xima iteraÃ§Ã£o
                        continue

                    except Exception as e:
                        logger.error(
                            f"âŒ [STREAMING_AGENT] Erro executando ferramentas: {e}"
                        )
                        yield f"\n\nErro ao executar ferramentas: {e}"
                        return

                # Se chegou aqui, algo deu errado
                logger.warning("âš ï¸ [STREAMING_AGENT] Loop sem progresso, finalizando")
                break

            # Se esgotar iteraÃ§Ãµes
            if iteration >= max_tool_iterations:
                logger.warning(
                    f"âš ï¸ [STREAMING_AGENT] MÃ¡ximo de {max_tool_iterations} iteraÃ§Ãµes atingido"
                )
                yield "\n\nâš ï¸ Processamento interrompido: muitas iteraÃ§Ãµes."

        except Exception as e:
            logger.error(f"âŒ [STREAMING_AGENT] Erro geral: {e}")
            yield f"Erro no processamento: {e}"

    def _contains_function_call_indicators(self, text: str) -> bool:
        """Detectar se o texto contÃ©m indicadores de function calls."""
        indicators = [
            "tool_calls",
            "function_call",
            '{"name":',
            '{"arguments":',
            '"type":"function"',
        ]
        text_lower = text.lower()
        return any(indicator.lower() in text_lower for indicator in indicators)

    def _needs_tool_execution(self, text: str) -> bool:
        """Determinar se precisamos executar ferramentas baseado no texto."""
        # Implementar lÃ³gica para detectar necessidade de ferramentas
        # Por exemplo, se o LLM menciona que vai usar uma ferramenta
        tool_indicators = [
            "vou buscar",
            "vou consultar",
            "vou pesquisar",
            "consultando",
            "buscando informaÃ§Ãµes",
            "tool:",
            "ferramenta:",
        ]
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in tool_indicators)

    def _clean_function_call_artifacts(self, text: str) -> str:
        """Limpar artefatos de function calls do texto."""
        import re

        # Remover JSON de function calls
        text = re.sub(r'\{[^}]*"name"[^}]*\}', "", text)
        text = re.sub(r'\{[^}]*"arguments"[^}]*\}', "", text)

        # Remover linhas vazias extras
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        return "\n".join(lines)

    async def _execute_tools(
        self, tool_calls: List[Any], llm_response: str
    ) -> List[Dict[str, Any]]:
        """Executar ferramentas identificadas."""
        results = []

        try:
            if tool_calls:
                # Executar via tool_calls estruturados
                for tool_call in tool_calls:
                    tool_name = tool_call.get("name") or tool_call.get(
                        "function", {}
                    ).get("name")
                    tool_args = tool_call.get("arguments") or tool_call.get(
                        "function", {}
                    ).get("arguments", {})

                    if isinstance(tool_args, str):
                        import json

                        try:
                            tool_args = json.loads(tool_args)
                        except json.JSONDecodeError:
                            logger.warning(
                                f"Argumentos invÃ¡lidos para {tool_name}: {tool_args}"
                            )
                            continue

                    # Encontrar ferramenta correspondente
                    tool = self._find_tool_by_name(tool_name)
                    if tool:
                        try:
                            result = await tool.ainvoke(tool_args)
                            results.append(
                                {
                                    "tool_name": tool_name,
                                    "result": result,
                                    "tool_call_id": tool_call.get(
                                        "id", str(uuid.uuid4())
                                    ),
                                }
                            )
                            self._intermediate_steps.append((tool_call, result))
                        except Exception as e:
                            logger.error(f"Erro executando {tool_name}: {e}")
                            results.append(
                                {
                                    "tool_name": tool_name,
                                    "result": f"Erro: {e}",
                                    "tool_call_id": tool_call.get(
                                        "id", str(uuid.uuid4())
                                    ),
                                }
                            )
            else:
                # Fallback: tentar extrair do texto do LLM
                logger.debug(
                    f"Tentando extrair ferramentas do texto: {llm_response[:100]}..."
                )
                # Implementar extraÃ§Ã£o de ferramentas do texto se necessÃ¡rio

        except Exception as e:
            logger.error(f"Erro executando ferramentas: {e}")
            results.append(
                {
                    "tool_name": "error",
                    "result": f"Erro geral: {e}",
                    "tool_call_id": str(uuid.uuid4()),
                }
            )

        return results

    def _find_tool_by_name(self, tool_name: str) -> Optional[Any]:
        """Encontrar ferramenta pelo nome."""
        for tool in self.agent_executor.tools:
            if hasattr(tool, "name") and tool.name == tool_name:
                return tool
        return None

    def get_intermediate_steps(self) -> List[Any]:
        """Obter steps intermediÃ¡rios para logging/debug."""
        return self._intermediate_steps.copy()


async def create_streaming_agent_executor(
    agent_executor: AgentExecutor, llm: AzureChatOpenAI
) -> StreamingAgentExecutor:
    """Factory para criar StreamingAgentExecutor."""
    return StreamingAgentExecutor(agent_executor, llm)
