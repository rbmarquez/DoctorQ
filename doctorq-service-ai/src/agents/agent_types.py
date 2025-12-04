# src/agents/agent_types.py
from enum import Enum
from typing import Optional, Type

from .base_agent import BaseCustomAgent
from .dynamic_custom_agent import DynamicCustomAgent
from .prompt_generator_agent import PromptGeneratorAgent
from .summary_generator_agent import SummaryGeneratorAgent
from .title_generator_agent import TitleGeneratorAgent


class AgentType(str, Enum):
    """
    Enum para tipos de agentes customizados disponÃ­veis
    """

    TITULO_AGENTE = "titulo_agente"
    RESUMO_AGENTE = "resumo_agente"
    DINAMICO_AGENTE = "dinamico_agente"
    PROMPT_GENERATOR_AGENTE = "prompt_generator_agente"


class AgentFactory:
    """
    Factory para criar instÃ¢ncias de agentes baseado no tipo
    """

    _agent_mapping = {
        AgentType.TITULO_AGENTE: TitleGeneratorAgent,
        AgentType.RESUMO_AGENTE: SummaryGeneratorAgent,
        AgentType.DINAMICO_AGENTE: DynamicCustomAgent,
        AgentType.PROMPT_GENERATOR_AGENTE: PromptGeneratorAgent,
    }

    @classmethod
    def get_agent_class(cls, agent_type: str) -> Optional[Type[BaseCustomAgent]]:
        """
        Obter classe do agente baseado no tipo

        Args:
            agent_type: Tipo do agente (string)

        Returns:
            Classe do agente ou None se nÃ£o encontrado
        """
        try:
            agent_enum = AgentType(agent_type)
            return cls._agent_mapping.get(agent_enum)
        except ValueError:
            return None

    @classmethod
    def is_valid_agent_type(cls, agent_type: str) -> bool:
        """
        Verificar se o tipo de agente Ã© vÃ¡lido

        Args:
            agent_type: Tipo do agente

        Returns:
            True se vÃ¡lido, False caso contrÃ¡rio
        """
        try:
            AgentType(agent_type)
            return True
        except ValueError:
            return False

    @classmethod
    def get_available_types(cls) -> list[str]:
        """
        Obter lista de tipos de agentes disponÃ­veis

        Returns:
            Lista com os tipos disponÃ­veis
        """
        return [agent_type.value for agent_type in AgentType]

    @classmethod
    def get_agent_info(cls, agent_type: str) -> Optional[dict]:
        """
        Obter informaÃ§Ãµes sobre um tipo de agente

        Args:
            agent_type: Tipo do agente

        Returns:
            DicionÃ¡rio com informaÃ§Ãµes do agente ou None
        """
        agent_info = {
            AgentType.TITULO_AGENTE: {
                "name": "Gerador de TÃ­tulos",
                "description": "Gera tÃ­tulos concisos baseado em qualquer texto fornecido",
                "class": "TitleGeneratorAgent",
                "file": "title_generator_agent.py",
                "method": "generate_title",
                "supports_dynamic_config": False,
            },
            AgentType.RESUMO_AGENTE: {
                "name": "Gerador de Resumos",
                "description": "Gera resumos informativos baseado em qualquer texto fornecido",
                "class": "SummaryGeneratorAgent",
                "file": "summary_generator_agent.py",
                "method": "generate_summary",
                "supports_dynamic_config": False,
            },
            AgentType.DINAMICO_AGENTE: {
                "name": "Agente DinÃ¢mico",
                "description": "Agente configurÃ¡vel dinamicamente atravÃ©s de parÃ¢metros",
                "class": "DynamicCustomAgent",
                "file": "dynamic_custom_agent.py",
                "method": "process_text",
                "supports_dynamic_config": True,
            },
            AgentType.PROMPT_GENERATOR_AGENTE: {
                "name": "Gerador de Prompts",
                "description": "Gera prompts estruturados para agentes de IA",
                "class": "PromptGeneratorAgent",
                "file": "prompt_generator_agent.py",
                "method": "generate_prompt",
                "supports_dynamic_config": False,
            },
        }

        try:
            agent_enum = AgentType(agent_type)
            return agent_info.get(agent_enum)
        except ValueError:
            return None
