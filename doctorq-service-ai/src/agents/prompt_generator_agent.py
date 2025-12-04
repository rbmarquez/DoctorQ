# src/agents/prompt_generator_agent.py
from typing import Any, Dict, Tuple

from src.config.logger_config import get_logger
from src.agents.base_agent import BaseCustomAgent

logger = get_logger(__name__)


class PromptGeneratorAgent(BaseCustomAgent):
    """
    Agente especializado em gerar prompts para outros agentes
    """

    def __init__(self):
        super().__init__(agent_name="prompt_generator", temperature=0.7)
        self.description = (
            "Agente especializado em criaÃ§Ã£o de prompts para agentes de IA"
        )

    async def generate_prompt(
        self, descricao: str, contexto: str = "", tipo_agente: str = "geral"
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Gera um prompt estruturado para um agente baseado na descriÃ§Ã£o fornecida

        Args:
            descricao: DescriÃ§Ã£o detalhada do agente desejado
            contexto: Contexto adicional (pÃºblico-alvo, tom de voz, etc.)
            tipo_agente: Tipo/categoria do agente

        Returns:
            Tuple contendo o prompt gerado e mÃ©tricas de processamento
        """
        try:
            # Construir o prompt do sistema
            system_prompt = self._build_system_prompt()

            # Construir o prompt do usuÃ¡rio
            user_prompt = self._build_user_prompt(descricao, contexto, tipo_agente)

            # Processar com o modelo de IA
            resultado, metrics = await self._process_with_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.7,
            )

            # Limpar e formatar o resultado
            prompt_limpo = self._clean_prompt(resultado)

            logger.info(f"Prompt gerado com sucesso para tipo: {tipo_agente}")

            return prompt_limpo, metrics

        except Exception as e:
            logger.error(f"Erro ao gerar prompt: {str(e)}")
            raise

    def _build_system_prompt(self) -> str:
        """
        ConstrÃ³i o prompt do sistema para geraÃ§Ã£o de prompts
        """
        return """VocÃª Ã© um especialista em criaÃ§Ã£o de prompts para agentes de IA.
Sua missÃ£o Ã© criar prompts claros, estruturados e profissionais que definam o comportamento de agentes de IA.

DIRETRIZES PARA CRIAÃ‡ÃƒO DE PROMPTS:

1. ESTRUTURA OBRIGATÃ“RIA:
   - DefiniÃ§Ã£o clara do papel e responsabilidades do agente
   - InstruÃ§Ãµes especÃ­ficas de comportamento e tom de voz
   - LimitaÃ§Ãµes e diretrizes de seguranÃ§a
   - Formato de resposta esperado
   - Exemplos prÃ¡ticos quando apropriado

2. CARACTERÃSTICAS DO PROMPT:
   - Seja especÃ­fico e direto
   - Use linguagem clara e profissional
   - Inclua contexto relevante
   - Defina expectativas claras
   - Mantenha consistÃªncia no tom

3. ELEMENTOS ESSENCIAIS:
   - "VocÃª Ã©..." (definiÃ§Ã£o do papel)
   - "Suas responsabilidades incluem..." (tarefas especÃ­ficas)
   - "VocÃª deve..." (comportamentos obrigatÃ³rios)
   - "VocÃª nÃ£o deve..." (limitaÃ§Ãµes)
   - "Sempre..." (diretrizes consistentes)
   - "Nunca..." (restriÃ§Ãµes importantes)
   - "Regras:" (normas especÃ­ficas de funcionamento)
   - "Exemplos:" (casos prÃ¡ticos de uso)

4. REGRAS OBRIGATÃ“RIAS:
   - Incluir seÃ§Ã£o "Regras" com normas especÃ­ficas
   - Adicionar seÃ§Ã£o "Exemplos" com casos prÃ¡ticos
   - Usar formataÃ§Ã£o markdown para melhor organizaÃ§Ã£o
   - Separar seÃ§Ãµes com espaÃ§amento adequado
   - Manter linguagem clara e objetiva

5. FORMATO DE SAÃDA:
   - Prompt estruturado e bem formatado
   - ParÃ¡grafos organizados logicamente
   - Linguagem natural e fluida
   - Sem redundÃ¢ncias desnecessÃ¡rias
   - FormataÃ§Ã£o markdown para tÃ­tulos e seÃ§Ãµes
   - EspaÃ§amento visual apropriado

Crie um prompt que seja especÃ­fico, profissional e eficaz para o agente descrito."""

    def _build_user_prompt(
        self, descricao: str, contexto: str, tipo_agente: str
    ) -> str:
        """
        ConstrÃ³i o prompt do usuÃ¡rio com as informaÃ§Ãµes fornecidas
        """
        prompt_parts = [
            f"TIPO DE AGENTE: {tipo_agente.upper()}",
            f"DESCRIÃ‡ÃƒO: {descricao}",
        ]

        if contexto and contexto.strip():
            prompt_parts.append(f"CONTEXTO ADICIONAL: {contexto}")

        prompt_parts.append(
            "Com base nas informaÃ§Ãµes acima, crie um prompt completo e profissional para este agente."
        )

        return "\n\n".join(prompt_parts)

    def _clean_prompt(self, prompt: str) -> str:
        """
        Limpa e formata o prompt gerado
        """
        if not prompt:
            return ""

        # Remove aspas desnecessÃ¡rias no inÃ­cio e fim
        prompt = prompt.strip()
        if prompt.startswith('"') and prompt.endswith('"'):
            prompt = prompt[1:-1]
        if prompt.startswith("'") and prompt.endswith("'"):
            prompt = prompt[1:-1]

        # Remove marcadores de cÃ³digo desnecessÃ¡rios
        if prompt.startswith("```") and prompt.endswith("```"):
            prompt = prompt[3:-3]

        # Preserva formataÃ§Ã£o mas remove linhas vazias excessivas
        lines = prompt.split("\n")
        cleaned_lines = []
        prev_empty = False

        for line in lines:
            stripped = line.strip()
            if not stripped:
                if not prev_empty:
                    cleaned_lines.append("")
                    prev_empty = True
            else:
                cleaned_lines.append(line.rstrip())
                prev_empty = False

        # Remove linhas vazias no inÃ­cio e fim
        while cleaned_lines and not cleaned_lines[0]:
            cleaned_lines.pop(0)
        while cleaned_lines and not cleaned_lines[-1]:
            cleaned_lines.pop()

        prompt = "\n".join(cleaned_lines)

        # Adicionar formataÃ§Ã£o markdown e espaÃ§amento estruturado
        prompt = self._format_with_markdown(prompt)

        return prompt

    def _format_with_markdown(self, prompt: str) -> str:
        """
        Adiciona formataÃ§Ã£o markdown e espaÃ§amento estruturado ao prompt
        """
        if not prompt:
            return prompt

        lines = prompt.split("\n")
        formatted_lines = []

        for i, line in enumerate(lines):
            line = line.strip()

            # Pular linhas vazias
            if not line:
                formatted_lines.append("")
                continue

            # Detectar seÃ§Ãµes principais e adicionar formataÃ§Ã£o markdown
            if any(
                indicator in line.lower()
                for indicator in [
                    "vocÃª Ã©",
                    "suas responsabilidades",
                    "vocÃª deve",
                    "vocÃª nÃ£o deve",
                    "sempre",
                    "nunca",
                    "regras",
                    "exemplos",
                    "formato de resposta",
                    "diretrizes",
                    "limitaÃ§Ãµes",
                ]
            ):
                # Adicionar espaÃ§o antes de seÃ§Ãµes (exceto primeira linha)
                if formatted_lines and formatted_lines[-1] != "":
                    formatted_lines.append("")

                # FormataÃ§Ã£o como subtÃ­tulo
                if line.endswith(":"):
                    formatted_lines.append(f"## {line[:-1]}")
                else:
                    formatted_lines.append(f"**{line}**")

                # Adicionar espaÃ§o apÃ³s o tÃ­tulo
                formatted_lines.append("")
            else:
                # Detectar listas e adicionar formataÃ§Ã£o
                if line.startswith("-") or line.startswith("â€¢"):
                    formatted_lines.append(line)
                elif line.strip().startswith(("1.", "2.", "3.", "4.", "5.")):
                    formatted_lines.append(line)
                else:
                    # Texto normal com formataÃ§Ã£o de parÃ¡grafo
                    formatted_lines.append(line)

                    # Adicionar espaÃ§o apÃ³s parÃ¡grafos (se prÃ³xima linha nÃ£o for lista)
                    if i < len(lines) - 1:
                        next_line = lines[i + 1].strip()
                        if next_line and not next_line.startswith(
                            ("-", "â€¢", "1.", "2.", "3.", "4.", "5.")
                        ):
                            formatted_lines.append("")

        # Limpar espaÃ§os excessivos no final
        while formatted_lines and not formatted_lines[-1]:
            formatted_lines.pop()

        return "\n".join(formatted_lines)

    async def _process_with_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Processa o prompt com o modelo de linguagem
        """
        try:
            # Usar o DynamicCustomAgent para processamento
            from src.agents.dynamic_custom_agent import DynamicCustomAgent

            agent = DynamicCustomAgent(
                agent_name="prompt_generator",
                temperatura=temperature,
                max_tokens=max_tokens,
                limite_tokens_analise=2000,
                output_type="string",
            )

            # Combinar system e user prompt
            full_prompt = f"{system_prompt}\n\n{user_prompt}"

            resultado, metrics = await agent.process_text(texto=full_prompt)

            return resultado, metrics

        except Exception as e:
            logger.error(f"Erro no processamento LLM: {str(e)}")
            raise

    def get_agent_info(self) -> Dict[str, Any]:
        """
        Retorna informaÃ§Ãµes sobre o agente
        """
        return {
            "name": "Gerador de Prompts",
            "description": "Gera prompts estruturados para agentes de IA",
            "version": "1.0.0",
            "capabilities": [
                "GeraÃ§Ã£o de prompts personalizados",
                "EstruturaÃ§Ã£o automÃ¡tica",
                "AdaptaÃ§Ã£o por tipo de agente",
                "FormataÃ§Ã£o profissional",
            ],
        }

    def get_system_prompt(self) -> str:
        """
        Retorna o prompt do sistema especÃ­fico para este agente
        """
        return self._build_system_prompt()

    def format_user_prompt(self, **kwargs) -> str:
        """
        Formata o prompt do usuÃ¡rio com os dados especÃ­ficos
        """
        descricao = kwargs.get("descricao", "")
        contexto = kwargs.get("contexto", "")
        tipo_agente = kwargs.get("tipo_agente", "geral")
        return self._build_user_prompt(descricao, contexto, tipo_agente)

    def _get_fallback_response(self, **kwargs) -> str:
        """
        Resposta de fallback em caso de erro
        """
        tipo_agente = kwargs.get("tipo_agente", "geral")
        return f"""## VocÃª Ã©
Um assistente {tipo_agente} especializado e profissional.

## Suas responsabilidades incluem
- Fornecer respostas claras e precisas
- Manter um tom respeitoso e profissional
- Ajudar os usuÃ¡rios de forma eficiente
- Sempre priorizar a qualidade da informaÃ§Ã£o

## VocÃª deve
- Ser educado e prestativo
- Responder de forma objetiva
- Solicitar esclarecimentos quando necessÃ¡rio
- Manter confidencialidade quando apropriado

## VocÃª nÃ£o deve
- Fornecer informaÃ§Ãµes incorretas ou nÃ£o verificadas
- Ser rude ou desrespeitoso
- Ultrapassar seus limites de conhecimento
- Ignorar instruÃ§Ãµes de seguranÃ§a

## Regras
1. Sempre mantenha um padrÃ£o de excelÃªncia em suas respostas
2. Responda apenas sobre tÃ³picos dentro da sua Ã¡rea de especializaÃ§Ã£o
3. Se nÃ£o souber algo, admita honestamente
4. Mantenha respostas concisas mas completas

## Exemplos

**SituaÃ§Ã£o: UsuÃ¡rio faz pergunta fora da especializaÃ§Ã£o**
- âŒ Resposta incorreta: "Sim, posso ajudar com qualquer assunto"
- âœ… Resposta correta: "Esta pergunta estÃ¡ fora da minha Ã¡rea de especializaÃ§Ã£o. Posso ajudar com [Ã¡rea especÃ­fica]"

**SituaÃ§Ã£o: InformaÃ§Ã£o incerta**
- âŒ Resposta incorreta: Fornecer informaÃ§Ã£o nÃ£o verificada
- âœ… Resposta correta: "NÃ£o tenho certeza sobre isso. Recomendo verificar com [fonte confiÃ¡vel]"

**SituaÃ§Ã£o: Pedido de esclarecimento**
- âœ… Resposta adequada: "Para melhor ajudÃ¡-lo, poderia esclarecer [aspecto especÃ­fico]?"

Sempre mantenha profissionalismo e foque na qualidade da assistÃªncia prestada."""
