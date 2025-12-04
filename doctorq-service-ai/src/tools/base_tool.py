from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from langchain_core.tools import BaseTool as LangChainBaseTool
from pydantic import Field

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class BaseTool(LangChainBaseTool, ABC):
    """Classe base para todos os tools"""

    tool_config: Dict[str, Any] = Field(default_factory=dict)
    callbacks: List[Any] = Field(default_factory=list)
    langfuse_config: Optional[Any] = Field(default=None)
    session_trace_context: Optional[Any] = Field(default=None)
    verbose: bool = Field(default=True)

    def __init__(self, **data):
        if "name" not in data or not data["name"]:
            data["name"] = "unknown_tool"
        if "description" not in data or not data["description"]:
            data["description"] = "Tool description"

        super().__init__(**data)

    @abstractmethod
    async def _execute_tool_logic(self, **kwargs) -> Any:
        """ExecuÃ§Ã£o assÃ­ncrona do tool - implementar nos tools concretos"""

    def _create_langfuse_span(self, method: str, kwargs: Dict[str, Any]):
        """Cria span do Langfuse se configurado"""
        if not (self.langfuse_config and self.session_trace_context):
            return None

        return self.langfuse_config.create_tool_execution_span(
            parent_span=self.session_trace_context,
            tool_name=self.name,
            input_data={"parameters": kwargs},
            metadata={
                "tool_type": self.__class__.__name__,
                "execution_method": method,
            },
        )

    def _end_langfuse_span(self, span, result=None, error=None):
        """Finaliza span do Langfuse"""
        if not (span and self.langfuse_config):
            return

        output_data = {"result": result} if result else {"error": str(error)}
        metadata = {"status": "success" if result else "error", "tool_name": self.name}

        if error:
            metadata.update(
                {"error_type": type(error).__name__, "error_message": str(error)[:200]}
            )

        self.langfuse_config.end_span(
            span_context=span, output_data=output_data, metadata=metadata
        )

    async def _arun(self, *args, **kwargs) -> Any:
        """ExecuÃ§Ã£o assÃ­ncrona do tool"""
        span = self._create_langfuse_span("_arun", kwargs)

        try:
            logger.debug(f"Executando tool: {self.name}")
            if self.verbose:
                logger.debug(f"ParÃ¢metros: {kwargs}")

            result = await self._execute_tool_logic(**kwargs)

            if self.verbose:
                logger.debug(f"Tool {self.name} executado com sucesso")

            self._end_langfuse_span(span, result=result)
            return result

        except Exception as e:
            logger.error(f"Erro ao executar tool {self.name}: {str(e)}")
            self._end_langfuse_span(span, error=e)
            raise

    def _run(self, *args, **kwargs) -> Any:
        """ExecuÃ§Ã£o sÃ­ncrona nÃ£o suportada"""
        raise NotImplementedError("Use _arun para execuÃ§Ã£o assÃ­ncrona")

    def set_langfuse_context(self, langfuse_config, session_trace_context):
        """Definir contexto do Langfuse para instrumentaÃ§Ã£o"""
        self.langfuse_config = langfuse_config
        self.session_trace_context = session_trace_context
