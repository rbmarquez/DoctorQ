# src/utils/sse_wrapper.py
import asyncio
import json
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class SSEWrapper:
    """Wrapper para formataÃ§Ã£o de Server-Sent Events"""

    def __init__(self, user_id: str, conversation_token: Optional[str] = None):
        self.user_id = user_id
        self.conversation_token = (
            conversation_token
            or f"{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )
        self.tools_used = []
        self.sources_used = []

    def _format_sse_data(self, data: Dict[str, Any]) -> str:
        """Formatar dados para SSE com formato correto"""
        data["timestamp"] = datetime.now().isoformat()
        json_data = json.dumps(data, ensure_ascii=False)
        # Formato SSE correto: data: + JSON + duas quebras de linha
        return f"data: {json_data}\n\n"

    def format_chunk(self, chunk: str, full_response: str) -> str:
        """Formatar chunk de resposta"""
        return self._format_sse_data(
            {
                "type": "chat_chunk",
                "chunk": chunk,
                "full_response": full_response,
                "conversation_token": self.conversation_token,
            }
        )

    def set_tools_used(self, tools: List[str]):
        """Define as tools utilizadas para incluir no stream"""
        self.tools_used = tools

    def set_sources_used(self, sources: List[Dict[str, str]]):
        """Define as sources/documentos utilizados para incluir no stream"""
        self.sources_used = sources

    def format_complete(self, full_response: str) -> str:
        """Formatar resposta completa"""
        return self._format_sse_data(
            {
                "type": "chat_complete",
                "full_response": full_response,
                "tools": self.tools_used,
                "sources": self.sources_used,
                "conversation_token": self.conversation_token,
            }
        )

    def format_error(self, error_message: str) -> str:
        """Formatar erro"""
        return self._format_sse_data(
            {
                "type": "error",
                "message": error_message,
                "conversation_token": self.conversation_token,
            }
        )

    def format_heartbeat(self) -> str:
        """Formatar heartbeat para manter conexÃ£o viva (comentÃ¡rio SSE)"""
        # Usar comentÃ¡rio SSE que nÃ£o aparece no frontend
        return ": heartbeat\n\n"

    def format_custom(self, data_type: str, data: Dict[str, Any]) -> str:
        """Formatar dados customizados"""
        return self._format_sse_data(
            {"type": data_type, "conversation_token": self.conversation_token, **data}
        )

    async def wrap_stream(
        self, stream_generator: AsyncGenerator[str, None], langchain_service=None
    ) -> AsyncGenerator[str, None]:
        """
        Wrapper para streaming com formataÃ§Ã£o SSE otimizada

        Args:
            stream_generator: Gerador de chunks do LangChain Service
            langchain_service: ServiÃ§o LangChain para capturar tools utilizadas
        """
        try:

            full_response = ""
            chunk_count = 0

            # NÃƒO enviar heartbeat inicial - pode causar problemas no frontend
            # yield self.format_heartbeat()

            # Processar chunks do stream
            async for chunk in stream_generator:
                if chunk:
                    full_response += chunk
                    chunk_count += 1
                    formatted_chunk = self.format_chunk(chunk, full_response)
                    yield formatted_chunk
                    # Pequeno delay para permitir streaming real
                    await asyncio.sleep(0.01)

            # Capturar tools utilizadas apÃ³s o stream terminar
            if langchain_service:
                try:
                    tools_used = (
                        await langchain_service.get_tools_used_in_last_execution()
                    )
                    self.set_tools_used(tools_used)
                except Exception as e:
                    logger.warning(f"Erro ao capturar tools utilizadas: {e}")
                    self.set_tools_used([])

                # Capturar sources/documentos utilizados apÃ³s o stream terminar
                try:
                    sources_used = (
                        await langchain_service.get_sources_used_in_last_execution()
                    )
                    self.set_sources_used(sources_used)
                except Exception as e:
                    logger.warning(f"Erro ao capturar sources utilizadas: {e}")
                    self.set_sources_used([])
            else:
                self.set_tools_used([])
                self.set_sources_used([])

            # Finalizar stream
            final_message = self.format_complete(full_response)
            yield final_message

        except asyncio.CancelledError:
            yield self.format_error("Stream cancelado pelo cliente")
        except Exception as e:
            logger.error(f"âŒ [SSE] Erro no stream: {str(e)}")
            yield self.format_error(f"Erro interno: {str(e)}")


def create_sse_wrapper(
    user_id: str, conversation_token: Optional[str] = None
) -> SSEWrapper:
    """Factory function para criar wrapper SSE"""
    return SSEWrapper(user_id, conversation_token)
