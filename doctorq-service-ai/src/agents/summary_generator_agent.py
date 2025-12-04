# src/agents/summary_generator_agent.py
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger

from .base_agent import BaseCustomAgent

logger = get_logger(__name__)


class SummaryGeneratorAgent(BaseCustomAgent):
    """
    Agente customizado para gerar resumos baseado em qualquer texto fornecido.
    Sem tools, sem memÃ³ria, focado apenas na geraÃ§Ã£o de resumos informativos e concisos.
    """

    def __init__(self, db_session: Optional[AsyncSession] = None):
        super().__init__(
            agent_name="SummaryGenerator",
            db_session=db_session,
            temperature=0.3,  # Baixa temperatura para resumos consistentes
            max_tokens=150,  # Resumos podem ser mais informativos
        )

    def get_system_prompt(self) -> str:
        """Prompt do sistema para geraÃ§Ã£o de resumos"""
        return """VocÃª Ã© um assistente especializado em criar resumos informativos e concisos.

INSTRUÃ‡Ã•ES:
- Analise todo o texto fornecido
- Crie um resumo objetivo em atÃ© 300 caracteres
- Inclua os principais tÃ³picos e questÃµes discutidas
- Use linguagem em portuguÃªs brasileiro
- Seja informativo e capture a essÃªncia do conteÃºdo
- Evite detalhes desnecessÃ¡rios
- Foque nos pontos principais e resultados
- NÃƒO use aspas duplas ou simples na resposta
- Retorne apenas o texto do resumo, sem formataÃ§Ã£o adicional

EXEMPLOS DE BONS RESUMOS:
- DiscussÃ£o sobre problemas de login e configuraÃ§Ã£o de acesso ao sistema
- Suporte para integraÃ§Ã£o API, resoluÃ§Ã£o de erros de conexÃ£o
- AnÃ¡lise de relatÃ³rios de vendas e propostas de melhorias
- ConfiguraÃ§Ã£o banco dados, migraÃ§Ã£o de dados histÃ³ricos
- DÃºvidas tÃ©cnicas sobre implementaÃ§Ã£o de funcionalidades

RESPONDA APENAS COM O RESUMO SIMPLES, SEM ASPAS OU EXPLICAÃ‡Ã•ES ADICIONAIS."""

    def format_user_prompt(self, **kwargs) -> str:
        """Formatar prompt do usuÃ¡rio com o texto fornecido"""
        text = kwargs.get("text", "")

        if not text or not text.strip():
            return "Texto: [texto vazio]"

        # Limitar tamanho total para nÃ£o exceder limites da API
        max_total_length = 2000
        if len(text) > max_total_length:
            text = text[:max_total_length] + "..."

        return f"Texto para resumir:\n{text.strip()}"

    def _get_fallback_response(self, **kwargs) -> str:
        """Resposta de fallback em caso de erro"""
        return "Resumo nÃ£o disponÃ­vel"

    async def generate_summary(self, text: str) -> str:
        """
        Gerar resumo baseado em qualquer texto

        Args:
            text: Texto para anÃ¡lise e geraÃ§Ã£o do resumo

        Returns:
            Resumo gerado
        """
        try:
            # Validar entrada
            if not text or not text.strip():
                logger.warning("Texto vazio, usando resumo padrÃ£o")
                return self._get_fallback_response()

            # Invocar agente
            summary = await self.invoke(text=text)

            # Validar e limpar resumo
            summary = summary.strip()

            # Remover aspas duplas ou simples se presentes
            if summary.startswith('"') and summary.endswith('"'):
                summary = summary[1:-1].strip()
            elif summary.startswith("'") and summary.endswith("'"):
                summary = summary[1:-1].strip()

            if len(summary) > 300:
                summary = summary[:300].strip()

            # Se resumo vazio ou muito curto, usar fallback
            if not summary or len(summary) < 10:
                logger.warning("Resumo gerado invÃ¡lido, usando fallback")
                return self._get_fallback_response()

            logger.debug(f"Resumo gerado: '{summary}'")
            return summary

        except Exception as e:
            logger.error(f"Erro ao gerar resumo: {str(e)}")
            return self._get_fallback_response()

    def validate_summary(self, summary: str) -> bool:
        """
        Validar se um resumo Ã© apropriado

        Args:
            summary: Resumo a ser validado

        Returns:
            True se vÃ¡lido, False caso contrÃ¡rio
        """
        if not summary or not summary.strip():
            return False

        summary = summary.strip()

        # Verificar tamanho
        if len(summary) < 10 or len(summary) > 300:
            return False

        # Verificar se nÃ£o Ã© apenas espaÃ§os ou caracteres especiais
        if not any(c.isalnum() for c in summary):
            return False

        return True
