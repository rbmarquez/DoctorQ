# src/agents/title_generator_agent.py
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger

from .base_agent import BaseCustomAgent

logger = get_logger(__name__)


class TitleGeneratorAgent(BaseCustomAgent):
    """
    Agente customizado para gerar tÃ­tulos baseado em qualquer texto fornecido.
    Sem tools, sem memÃ³ria, focado apenas na geraÃ§Ã£o de tÃ­tulos concisos e descritivos.
    """

    def __init__(self, db_session: Optional[AsyncSession] = None):
        super().__init__(
            agent_name="TitleGenerator",
            db_session=db_session,
            temperature=0.3,  # Baixa temperatura para tÃ­tulos consistentes
            max_tokens=80,  # TÃ­tulos podem ser um pouco mais descritivos
        )

    def get_system_prompt(self) -> str:
        """Prompt do sistema para geraÃ§Ã£o de tÃ­tulos"""
        return """VocÃª Ã© um assistente especializado em criar tÃ­tulos concisos e descritivos.

INSTRUÃ‡Ã•ES:
- Analise o texto fornecido
- Crie um tÃ­tulo claro e objetivo em atÃ© 80 caracteres
- O tÃ­tulo deve representar o assunto principal do texto
- Use linguagem em portuguÃªs brasileiro
- Seja direto e evite palavras desnecessÃ¡rias
- NÃ£o inclua pontuaÃ§Ã£o no final
- Prefira substantivos e evite verbos no tÃ­tulo
- NÃƒO use aspas duplas ou simples na resposta
- Retorne apenas o texto do tÃ­tulo, sem formataÃ§Ã£o adicional

EXEMPLOS DE BONS TÃTULOS:
- DÃºvidas sobre integraÃ§Ã£o API
- Problema login sistema
- ConfiguraÃ§Ã£o banco dados
- RelatÃ³rio vendas mensal
- Suporte tÃ©cnico urgente

RESPONDA APENAS COM O TÃTULO SIMPLES, SEM ASPAS OU EXPLICAÃ‡Ã•ES ADICIONAIS."""

    def format_user_prompt(self, **kwargs) -> str:
        """Formatar prompt do usuÃ¡rio com o texto fornecido"""
        text = kwargs.get("text", "")

        if not text or not text.strip():
            return "Texto: [texto vazio]"

        # Limitar tamanho do texto para anÃ¡lise
        max_length = 500
        if len(text) > max_length:
            text = text[:max_length] + "..."

        return f"Texto para criar tÃ­tulo: {text.strip()}"

    def _get_fallback_response(self, **kwargs) -> str:
        """Resposta de fallback em caso de erro"""
        return "TÃ­tulo GenÃ©rico"

    async def generate_title(self, text: str) -> str:
        """
        Gerar tÃ­tulo baseado em qualquer texto

        Args:
            text: Texto para anÃ¡lise e geraÃ§Ã£o do tÃ­tulo

        Returns:
            TÃ­tulo gerado
        """
        try:
            # Validar entrada
            if not text or not text.strip():
                logger.warning("Texto vazio, usando tÃ­tulo padrÃ£o")
                return self._get_fallback_response()

            # Invocar agente
            title = await self.invoke(text=text)

            # Validar e limpar tÃ­tulo
            title = title.strip()

            # Remover aspas duplas ou simples se presentes
            if title.startswith('"') and title.endswith('"'):
                title = title[1:-1].strip()
            elif title.startswith("'") and title.endswith("'"):
                title = title[1:-1].strip()

            if len(title) > 80:
                title = title[:80].strip()

            # Se tÃ­tulo vazio ou muito curto, usar fallback
            if not title or len(title) < 3:
                logger.warning("TÃ­tulo gerado invÃ¡lido, usando fallback")
                return self._get_fallback_response()

            logger.debug(f"TÃ­tulo gerado: '{title}'")
            return title

        except Exception as e:
            logger.error(f"Erro ao gerar tÃ­tulo: {str(e)}")
            return self._get_fallback_response()

    def validate_title(self, title: str) -> bool:
        """
        Validar se um tÃ­tulo Ã© apropriado

        Args:
            title: TÃ­tulo a ser validado

        Returns:
            True se vÃ¡lido, False caso contrÃ¡rio
        """
        if not title or not title.strip():
            return False

        title = title.strip()

        # Verificar tamanho
        if len(title) < 3 or len(title) > 80:
            return False

        # Verificar se nÃ£o Ã© apenas espaÃ§os ou caracteres especiais
        if not any(c.isalnum() for c in title):
            return False

        return True
