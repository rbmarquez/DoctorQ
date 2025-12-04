# src/agents/dtos.py
import uuid
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class GenericAgentRequest(BaseModel):
    """DTO para requisiÃ§Ãµes de agentes genÃ©ricos (tÃ­tulo e resumo)"""

    text: str = Field(
        ..., min_length=1, description="Texto para processamento pelo agente"
    )

    @validator("text")
    @classmethod
    def validar_text(cls, v):
        if not v or not v.strip():
            raise ValueError(
                "O texto nÃ£o pode estar vazio. ForneÃ§a um texto vÃ¡lido para processamento."
            )
        if len(v.strip()) < 3:
            raise ValueError("O texto deve ter pelo menos 3 caracteres.")
        return v.strip()


class CustomAgentRequest(BaseModel):
    """DTO para requisiÃ§Ãµes de agentes customizados dinÃ¢micos"""

    texto: str = Field(
        ..., min_length=1, description="Texto para processamento pelo agente"
    )
    temperatura: Optional[float] = Field(
        default=0.3, description="Controla criatividade da resposta (0.0 a 1.0)"
    )
    max_tokens: Optional[int] = Field(
        default=500, description="Limite mÃ¡ximo de tokens na resposta"
    )
    limite_tokens_analise: Optional[int] = Field(
        default=2000, description="Limite de tokens do texto de entrada para anÃ¡lise"
    )
    nome_agente: str = Field(
        ..., min_length=1, max_length=50, description="Nome identificador do agente"
    )
    output_exemplo: Optional[str] = Field(
        default="", description="Exemplo do formato de saÃ­da esperado"
    )
    output_type: Optional[str] = Field(
        default="string",
        description="Tipo de saÃ­da estruturada (string, number, boolean, array, dictionary, object)",
    )

    @validator("texto")
    @classmethod
    def validar_texto(cls, v):
        if not v or not v.strip():
            raise ValueError(
                "O texto nÃ£o pode estar vazio. ForneÃ§a um texto vÃ¡lido para processamento."
            )
        if len(v.strip()) < 3:
            raise ValueError("O texto deve ter pelo menos 3 caracteres.")
        return v.strip()

    @validator("temperatura")
    @classmethod
    def validar_temperatura(cls, v):
        if v is not None:
            if v < 0.0:
                raise ValueError(
                    "A temperatura deve ser maior ou igual a 0.0 (mais determinÃ­stica)."
                )
            if v > 1.0:
                raise ValueError(
                    "A temperatura deve ser menor ou igual a 1.0 (mais criativa)."
                )
        return v

    @validator("max_tokens")
    @classmethod
    def validar_max_tokens(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError("O limite mÃ¡ximo de tokens deve ser pelo menos 1.")
            if v > 4000:
                raise ValueError("O limite mÃ¡ximo de tokens nÃ£o pode exceder 4000.")
        return v

    @validator("limite_tokens_analise")
    @classmethod
    def validar_limite_tokens_analise(cls, v):
        if v is not None:
            if v < 100:
                raise ValueError(
                    "O limite de tokens para anÃ¡lise deve ser pelo menos 100 para garantir processamento adequado."
                )
            if v > 8000:
                raise ValueError(
                    "O limite de tokens para anÃ¡lise nÃ£o pode exceder 8000."
                )
        return v

    @validator("nome_agente")
    @classmethod
    def validar_nome_agente(cls, v):
        if not v or not v.strip():
            raise ValueError("O nome do agente Ã© obrigatÃ³rio.")
        v = v.strip()
        if len(v) < 1:
            raise ValueError("O nome do agente deve ter pelo menos 1 caractere.")
        if len(v) > 50:
            raise ValueError("O nome do agente nÃ£o pode exceder 50 caracteres.")

        # Validar tipos de agente disponÃ­veis
        valid_agents = ["titulo_agente", "resumo_agente", "dinamico_agente"]
        if v not in valid_agents:
            raise ValueError(
                f'Tipo de agente invÃ¡lido: "{v}". Tipos disponÃ­veis: {", ".join(valid_agents)}'
            )
        return v

    @validator("output_type")
    @classmethod
    def validar_output_type(cls, v):
        if v is not None:
            valid_types = [
                "string",
                "number",
                "boolean",
                "array",
                "dictionary",
                "object",
            ]
            if v not in valid_types:
                raise ValueError(
                    f'Tipo de saÃ­da invÃ¡lido: "{v}". Tipos disponÃ­veis: {", ".join(valid_types)}'
                )
        return v


class ConversationUpdateRequest(BaseModel):
    """DTO para requisiÃ§Ãµes de atualizaÃ§Ã£o de conversa"""

    conversation_id: uuid.UUID = Field(
        ..., description="ID da conversa a ser atualizada"
    )

    @validator("conversation_id")
    @classmethod
    def validar_conversation_id(cls, v):
        if not v:
            raise ValueError("O ID da conversa Ã© obrigatÃ³rio.")
        return v


class CustomAgentResponse(BaseModel):
    """DTO para resposta unificada de agentes customizados"""

    result: Union[str, int, float, bool, List[Any], Dict[str, Any]] = Field(
        ..., description="Resultado do processamento do agente"
    )
    agent_type: str = Field(..., description="Tipo do agente utilizado")
    agent_name: str = Field(..., description="Nome do agente utilizado")
    timestamp: str = Field(..., description="Timestamp da resposta")
    input_tokens: int = Field(..., description="NÃºmero de tokens de entrada")
    output_tokens: int = Field(..., description="NÃºmero de tokens de saÃ­da")
    truncated: Optional[bool] = Field(
        default=None, description="Se o texto foi truncado"
    )
    output_type: Optional[str] = Field(
        default="string", description="Tipo de saÃ­da estruturada"
    )
    structured: Optional[bool] = Field(
        default=False, description="Se a resposta foi estruturada"
    )

    @validator("result")
    @classmethod
    def validar_result(cls, v):
        if v is None:
            raise ValueError("O resultado nÃ£o pode estar vazio.")
        return v

    @validator("agent_type")
    @classmethod
    def validar_agent_type(cls, v):
        if not v:
            raise ValueError("O tipo do agente Ã© obrigatÃ³rio.")
        return v

    @validator("agent_name")
    @classmethod
    def validar_agent_name(cls, v):
        if not v:
            raise ValueError("O nome do agente Ã© obrigatÃ³rio.")
        return v

    @validator("timestamp")
    @classmethod
    def validar_timestamp(cls, v):
        if not v:
            raise ValueError("O timestamp Ã© obrigatÃ³rio.")
        return v


class ConversationUpdateResponse(BaseModel):
    """DTO para resposta de atualizaÃ§Ã£o de conversa"""

    success: bool = Field(..., description="Se a atualizaÃ§Ã£o foi bem-sucedida")
    conversation_id: str = Field(..., description="ID da conversa atualizada")
    original: Optional[dict] = Field(
        default=None, description="Dados originais da conversa"
    )
    updated: Optional[dict] = Field(
        default=None, description="Dados atualizados da conversa"
    )
    changes: Optional[dict] = Field(default=None, description="Resumo das mudanÃ§as")
    error: Optional[str] = Field(
        default=None, description="Mensagem de erro, se houver"
    )
    timestamp: str = Field(..., description="Timestamp da resposta")

    @validator("conversation_id")
    @classmethod
    def validar_conversation_id(cls, v):
        if not v:
            raise ValueError("O ID da conversa Ã© obrigatÃ³rio.")
        return v

    @validator("timestamp")
    @classmethod
    def validar_timestamp(cls, v):
        if not v:
            raise ValueError("O timestamp Ã© obrigatÃ³rio.")
        return v


class PromptGenerationRequest(BaseModel):
    """DTO para requisiÃ§Ãµes de geraÃ§Ã£o de prompts"""

    descricao: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="DescriÃ§Ã£o detalhada do agente desejado",
    )
    contexto: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Contexto adicional (pÃºblico-alvo, tom de voz, restriÃ§Ãµes)",
    )
    tipo_agente: Optional[str] = Field(
        default="geral",
        max_length=50,
        description="Tipo/categoria do agente (atendimento, suporte, vendas, etc.)",
    )

    @validator("descricao")
    @classmethod
    def validar_descricao(cls, v):
        if not v or not v.strip():
            raise ValueError("A descriÃ§Ã£o do agente Ã© obrigatÃ³ria.")
        if len(v.strip()) < 10:
            raise ValueError(
                "A descriÃ§Ã£o deve ter pelo menos 10 caracteres para gerar um prompt adequado."
            )
        return v.strip()

    @validator("contexto")
    @classmethod
    def validar_contexto(cls, v):
        if v is not None:
            return v.strip()
        return ""

    @validator("tipo_agente")
    @classmethod
    def validar_tipo_agente(cls, v):
        if v is not None:
            return v.strip().lower()
        return "geral"


class PromptGenerationResponse(BaseModel):
    """DTO para resposta de geraÃ§Ã£o de prompts"""

    prompt: str = Field(..., description="Prompt gerado para o agente")
    sugestoes: List[str] = Field(
        default_factory=list, description="SugestÃµes adicionais para melhorar o prompt"
    )
    timestamp: str = Field(..., description="Timestamp da geraÃ§Ã£o")
    tipo_agente: str = Field(..., description="Tipo do agente usado na geraÃ§Ã£o")
    qualidade: Optional[str] = Field(
        default="alta", description="Indicador da qualidade do prompt gerado"
    )

    @validator("prompt")
    @classmethod
    def validar_prompt(cls, v):
        if not v or not v.strip():
            raise ValueError("O prompt gerado nÃ£o pode estar vazio.")
        return v.strip()

    @validator("timestamp")
    @classmethod
    def validar_timestamp(cls, v):
        if not v:
            raise ValueError("O timestamp Ã© obrigatÃ³rio.")
        return v


def format_validation_error(error) -> str:
    """Formatar erro de validaÃ§Ã£o para uma mensagem mais amigÃ¡vel"""
    errors = []
    for err in error.errors():
        field = err.get("loc", ["campo"])[-1]  # Pegar o Ãºltimo elemento do loc
        msg = err.get("msg", "Erro de validaÃ§Ã£o")

        # Personalizar mensagens baseadas no tipo de erro
        if err.get("type") == "value_error":
            # Usar mensagem customizada dos validators
            errors.append(msg)
        elif err.get("type") == "greater_than_equal":
            min_val = err.get("ctx", {}).get("ge", "valor mÃ­nimo")
            errors.append(f'O campo "{field}" deve ser maior ou igual a {min_val}.')
        elif err.get("type") == "less_than_equal":
            max_val = err.get("ctx", {}).get("le", "valor mÃ¡ximo")
            errors.append(f'O campo "{field}" deve ser menor ou igual a {max_val}.')
        elif err.get("type") == "string_too_short":
            min_length = err.get("ctx", {}).get("min_length", "comprimento mÃ­nimo")
            errors.append(
                f'O campo "{field}" deve ter pelo menos {min_length} caracteres.'
            )
        elif err.get("type") == "string_too_long":
            max_length = err.get("ctx", {}).get("max_length", "comprimento mÃ¡ximo")
            errors.append(
                f'O campo "{field}" nÃ£o pode exceder {max_length} caracteres.'
            )
        elif err.get("type") == "missing":
            errors.append(f'O campo "{field}" Ã© obrigatÃ³rio.')
        else:
            errors.append(f'Erro no campo "{field}": {msg}')

    return "; ".join(errors)
