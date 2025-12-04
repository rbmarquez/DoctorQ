# src/agents/dynamic_custom_agent.py
import json
from typing import Any, Dict, List, Optional, Union

import tiktoken
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger

from .base_agent import BaseCustomAgent

logger = get_logger(__name__)


# Modelos Pydantic para diferentes tipos de saÃ­da estruturada
class StringOutput(BaseModel):
    """Modelo para saÃ­da de string"""

    result: str = Field(description="Resultado como string")


class NumberOutput(BaseModel):
    """Modelo para saÃ­da numÃ©rica"""

    result: Union[int, float] = Field(description="Resultado como nÃºmero")


class BooleanOutput(BaseModel):
    """Modelo para saÃ­da booleana"""

    result: bool = Field(description="Resultado como booleano")


class ArrayOutput(BaseModel):
    """Modelo para saÃ­da de array/lista"""

    result: List[Any] = Field(description="Resultado como lista")


class DictionaryOutput(BaseModel):
    """Modelo para saÃ­da de dicionÃ¡rio"""

    result: Dict[str, Any] = Field(description="Resultado como dicionÃ¡rio")


class ObjectOutput(BaseModel):
    """Modelo para saÃ­da de objeto customizado"""

    result: Dict[str, Any] = Field(description="Resultado como objeto estruturado")


class DynamicCustomAgent(BaseCustomAgent):
    """
    Agente customizado dinÃ¢mico que permite configuraÃ§Ã£o completa atravÃ©s de parÃ¢metros.
    Sem tools, sem memÃ³ria, comportamento definido dinamicamente.
    Suporta structured output usando PydanticOutputParser.
    """

    def __init__(
        self,
        agent_name: str,
        temperatura: float,
        max_tokens: int,
        limite_tokens_analise: int,
        output_exemplo: Optional[str] = None,
        output_type: str = "string",  # string, number, boolean, array, dictionary, object
        db_session: Optional[AsyncSession] = None,
    ):
        """
        Inicializar agente dinÃ¢mico customizado

        Args:
            agent_name: Nome do agente para identificaÃ§Ã£o
            temperatura: Temperatura para controle de criatividade (0.0 a 1.0)
            max_tokens: MÃ¡ximo de tokens na resposta
            limite_tokens_analise: Limite de tokens para anÃ¡lise do texto de entrada
            output_exemplo: Exemplo do formato de saÃ­da esperado
            output_type: Tipo de saÃ­da estruturada (string, number, boolean, array, dictionary, object)
            db_session: SessÃ£o do banco de dados
        """
        super().__init__(
            agent_name=agent_name,
            db_session=db_session,
            temperature=temperatura,
            max_tokens=max_tokens,
        )

        self.limite_tokens_analise = limite_tokens_analise
        self.output_exemplo = output_exemplo or ""
        self.output_type = output_type.lower()

        # Configurar parser baseado no tipo de saÃ­da
        self.output_parser = self._get_output_parser()

        # Configurar encoder para contagem de tokens
        try:
            self.encoder = tiktoken.get_encoding("cl100k_base")
        except Exception as e:
            logger.warning(f"Erro ao carregar encoder tiktoken: {e}")
            self.encoder = None

    def _get_output_parser(self) -> PydanticOutputParser:
        """Obter parser baseado no tipo de saÃ­da configurado"""
        parser_map = {
            "string": PydanticOutputParser(pydantic_object=StringOutput),
            "number": PydanticOutputParser(pydantic_object=NumberOutput),
            "boolean": PydanticOutputParser(pydantic_object=BooleanOutput),
            "array": PydanticOutputParser(pydantic_object=ArrayOutput),
            "dictionary": PydanticOutputParser(pydantic_object=DictionaryOutput),
            "object": PydanticOutputParser(pydantic_object=ObjectOutput),
        }

        return parser_map.get(
            self.output_type, PydanticOutputParser(pydantic_object=StringOutput)
        )

    def _count_tokens(self, text: str) -> int:
        """Contar tokens aproximados em um texto"""
        if self.encoder:
            try:
                return len(self.encoder.encode(text))
            except Exception as e:
                logger.warning(f"Erro ao contar tokens: {e}")

        # Fallback: estimativa aproximada (1 token ~= 4 caracteres)
        return len(text) // 4

    def _truncate_text(self, text: str, max_tokens: int) -> str:
        """Truncar texto para nÃ£o exceder limite de tokens"""
        if not text:
            return text

        current_tokens = self._count_tokens(text)

        if current_tokens <= max_tokens:
            return text

        # Truncar aproximadamente
        ratio = max_tokens / current_tokens
        truncated_length = int(len(text) * ratio * 0.9)  # Margem de seguranÃ§a

        if truncated_length < len(text):
            truncated_text = text[:truncated_length] + "..."
            logger.debug(
                f"Texto truncado de {current_tokens} para ~{self._count_tokens(truncated_text)} tokens"
            )
            return truncated_text

        return text

    def get_system_prompt(self) -> str:
        """Prompt do sistema dinÃ¢mico baseado nos parÃ¢metros"""
        base_prompt = f"""VocÃª Ã© um assistente especializado chamado {self.agent_name}.

INSTRUÃ‡Ã•ES:
- Analise o texto fornecido
- Processe conforme a tarefa solicitada
- Responda em portuguÃªs brasileiro
- Seja objetivo e claro
- Limite sua resposta a {self.max_tokens} tokens"""

        # Adicionar exemplo de output se fornecido
        if self.output_exemplo and self.output_exemplo.strip():
            base_prompt += f"""

FORMATO DE SAÃDA ESPERADO:
{self.output_exemplo.strip()}

Use este formato como referÃªncia para estruturar sua resposta."""

        # Adicionar instruÃ§Ãµes do parser
        base_prompt += f"""

{self.output_parser.get_format_instructions()}

RESPONDA DE FORMA DIRETA E OBJETIVA SEGUINDO EXATAMENTE O FORMATO ESPECIFICADO."""

        return base_prompt

    def format_user_prompt(self, **kwargs) -> str:
        """Formatar prompt do usuÃ¡rio com o texto fornecido"""
        texto = kwargs.get("texto", "")

        if not texto or not texto.strip():
            return "Texto: [texto vazio]"

        # Limitar tamanho do texto conforme limite_tokens_analise
        texto_limitado = self._truncate_text(texto.strip(), self.limite_tokens_analise)

        return f"Texto para processar: {texto_limitado}"

    def _get_fallback_response(self, **kwargs) -> str:
        """Resposta de fallback em caso de erro"""
        # Retornar resposta estruturada mesmo em caso de erro
        fallback_map = {
            "string": '{"result": "Erro ao processar solicitaÃ§Ã£o"}',
            "number": '{"result": 0}',
            "boolean": '{"result": false}',
            "array": '{"result": []}',
            "dictionary": '{"result": {}}',
            "object": '{"result": {"error": "Erro ao processar solicitaÃ§Ã£o"}}',
        }

        return fallback_map.get(
            self.output_type, '{"result": "Erro ao processar solicitaÃ§Ã£o"}'
        )

    async def process_text(
        self, texto: str
    ) -> tuple[Union[str, int, float, bool, list, dict], dict]:
        """
        Processar texto usando o agente dinÃ¢mico com structured output

        Args:
            texto: Texto para processamento

        Returns:
            Tuple contendo (resultado_estruturado, mÃ©tricas)
        """
        try:
            # Validar entrada
            if not texto or not texto.strip():
                logger.warning("Texto vazio fornecido")
                fallback_response = self._get_fallback_response()
                try:
                    parsed_fallback = self.output_parser.parse(fallback_response)
                    return parsed_fallback.result, {
                        "input_tokens": 0,
                        "output_tokens": 0,
                    }
                except Exception:
                    return "Erro ao processar solicitaÃ§Ã£o", {
                        "input_tokens": 0,
                        "output_tokens": 0,
                    }

            # Contar tokens de entrada (antes da limitaÃ§Ã£o)
            input_tokens_original = self._count_tokens(texto)

            # Obter LLM
            llm = await self._get_llm()

            # Preparar mensagens
            system_prompt = self.get_system_prompt()
            user_prompt = self.format_user_prompt(texto=texto)

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]

            # Invocar LLM
            response = await llm.invoke(messages)

            # Parsear resposta estruturada
            try:
                parsed_response = self.output_parser.parse(response)
                resultado = parsed_response.result
            except Exception as parse_error:
                logger.warning(f"Erro ao parsear resposta estruturada: {parse_error}")
                # Tentar extrair resultado manualmente
                try:
                    # Tentar parsear como JSON
                    if response.strip().startswith("{") and response.strip().endswith(
                        "}"
                    ):
                        json_response = json.loads(response.strip())
                        resultado = json_response.get("result", response.strip())
                    else:
                        resultado = response.strip()
                except Exception:
                    resultado = response.strip()

            # Contar tokens de saÃ­da
            output_tokens = self._count_tokens(str(resultado))

            # Texto limitado para anÃ¡lise
            texto_limitado = self._truncate_text(
                texto.strip(), self.limite_tokens_analise
            )
            input_tokens_processed = self._count_tokens(texto_limitado)

            # MÃ©tricas
            metrics = {
                "input_tokens": input_tokens_processed,
                "input_tokens_original": input_tokens_original,
                "output_tokens": output_tokens,
                "truncated": input_tokens_original > input_tokens_processed,
                "output_type": self.output_type,
                "structured": True,
            }

            logger.debug(
                f"Processamento concluÃ­do. Input: {input_tokens_processed} tokens, Output: {output_tokens} tokens, Type: {self.output_type}"
            )

            return resultado, metrics

        except Exception as e:
            logger.error(
                f"Erro ao processar texto com agente {self.agent_name}: {str(e)}"
            )
            fallback_response = self._get_fallback_response()
            try:
                parsed_fallback = self.output_parser.parse(fallback_response)
                return parsed_fallback.result, {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "error": str(e),
                }
            except Exception:
                return "Erro ao processar solicitaÃ§Ã£o", {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "error": str(e),
                }

    def get_agent_info(self) -> dict:
        """Retorna informaÃ§Ãµes sobre o agente dinÃ¢mico"""
        info = super().get_agent_info()
        info.update(
            {
                "type": "dynamic_custom_agent",
                "limite_tokens_analise": self.limite_tokens_analise,
                "output_exemplo": self.output_exemplo,
                "output_type": self.output_type,
                "structured_output": True,
                "configuravel": True,
            }
        )
        return info

    @classmethod
    def validate_parameters(
        cls,
        agent_name: str,
        temperatura: float,
        max_tokens: int,
        limite_tokens_analise: int,
        output_type: str = "string",
    ) -> tuple[bool, str]:
        """
        Validar parÃ¢metros antes de criar o agente

        Returns:
            Tuple (Ã©_vÃ¡lido, mensagem_erro)
        """
        # Lista de validaÃ§Ãµes com mensagens de erro
        validations = [
            (
                not agent_name or len(agent_name.strip()) == 0,
                "Nome do agente nÃ£o pode estar vazio",
            ),
            (
                len(agent_name.strip()) > 50,
                "Nome do agente deve ter no mÃ¡ximo 50 caracteres",
            ),
            (not 0.0 <= temperatura <= 1.0, "Temperatura deve estar entre 0.0 e 1.0"),
            (not 1 <= max_tokens <= 4000, "Max tokens deve estar entre 1 e 4000"),
            (
                not 100 <= limite_tokens_analise <= 8000,
                "Limite tokens anÃ¡lise deve estar entre 100 e 8000",
            ),
        ]
        # Verificar validaÃ§Ãµes bÃ¡sicas
        for is_invalid, error_msg in validations:
            if is_invalid:
                return False, error_msg
        # Validar tipo de saÃ­da
        valid_output_types = [
            "string",
            "number",
            "boolean",
            "array",
            "dictionary",
            "object",
        ]
        if output_type.lower() not in valid_output_types:
            return (
                False,
                f"Tipo de saÃ­da deve ser um dos seguintes: {', '.join(valid_output_types)}",
            )

        return True, ""
