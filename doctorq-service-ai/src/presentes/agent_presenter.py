from typing import Any, Dict, List

from src.models.agent import Agent


class AgentPresenter:
    """Presenter para formataÃ§Ã£o de respostas de agentes"""

    def present_agent(self, agent: Agent) -> Dict[str, Any]:
        """Apresenta um agente individual"""
        if not agent:
            return {}

        # Extrair tools do relacionamento agent_tools de forma segura
        tools = []
        if hasattr(agent, "agent_tools") and agent.agent_tools:
            for agent_tool in agent.agent_tools:
                if hasattr(agent_tool, "tool") and agent_tool.tool:
                    tools.append(
                        {
                            "id_tool": str(agent_tool.tool.id_tool),
                            "nm_tool": agent_tool.tool.nm_tool,
                        }
                    )

        presented = {
            "id_agente": str(agent.id_agente),
            "nm_agente": agent.nm_agente,
            "ds_agente": agent.ds_agente,
            "ds_tipo": agent.ds_tipo,
            "nm_modelo": agent.nm_modelo,
            "nm_provider": agent.nm_provider,
            "nr_temperature": float(agent.nr_temperature) if agent.nr_temperature else None,
            "nr_max_tokens": agent.nr_max_tokens,
            "ds_system_prompt": agent.ds_system_prompt,
            "ds_prompt": agent.ds_system_prompt,  # Alias para compatibilidade com frontend
            "ds_prompt_template": agent.ds_prompt_template,
            "st_ativo": agent.st_ativo,
            "st_principal": agent.st_principal if hasattr(agent, "st_principal") else False,
            "id_empresa": str(agent.id_empresa) if agent.id_empresa else None,
            "ds_config": agent.ds_config or {},
            "dt_criacao": agent.dt_criacao.isoformat() if agent.dt_criacao else None,
            "dt_atualizacao": (
                agent.dt_atualizacao.isoformat() if agent.dt_atualizacao else None
            ),
            "tools": tools,
        }

        return presented

    def present_agent_list(
        self,
        agents: List[Agent],
        total: int,
        page: int,
        size: int,
    ) -> Dict[str, Any]:
        """Apresenta uma lista de agentes com metadados de paginaÃ§Ã£o"""
        import math

        presented_agents = [self.present_agent(agent) for agent in agents]

        return {
            "items": presented_agents,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": math.ceil(total / size) if size > 0 else 0,
                "currentPage": page,
            },
        }

    def present_agent_response(
        self, agent: Agent, method: str = "GET"
    ) -> Dict[str, Any]:
        """Apresenta resposta de agente baseada no mÃ©todo HTTP"""

        return self.present_agent(agent)

    def present_agent_list_response(
        self,
        agents: List[Agent],
        total: int,
        page: int,
        size: int,
    ) -> Dict[str, Any]:
        """Apresenta resposta de lista de agentes"""
        return self.present_agent_list(agents, total, page, size)

    def present_agent_summary(self, agent: Agent) -> Dict[str, Any]:
        """Apresenta um resumo do agente para listagens rÃ¡pidas"""
        if not agent:
            return {}

        config = agent.config_obj

        # Extrair tools do relacionamento agent_tools de forma segura
        tools = []
        if hasattr(agent, "agent_tools") and agent.agent_tools:
            for agent_tool in agent.agent_tools:
                if hasattr(agent_tool, "tool") and agent_tool.tool:
                    tools.append(
                        {
                            "id_tool": str(agent_tool.tool.id_tool),
                            "nm_tool": agent_tool.tool.nm_tool,
                            "ds_tool": agent_tool.tool.ds_tool,
                        }
                    )

        return {
            "id_agente": str(agent.id_agente),
            "nm_agente": agent.nm_agente,
            "ds_tipo": agent.ds_tipo,
            "nm_modelo": agent.nm_modelo,
            "st_ativo": agent.st_ativo,
            "dt_atualizacao": (
                agent.dt_atualizacao.isoformat() if agent.dt_atualizacao else None
            ),
            "features": {
                "has_tools": agent.has_tools() if hasattr(agent, 'has_tools') else bool(tools),
                "memory_enabled": agent.is_memory_enabled() if hasattr(agent, 'is_memory_enabled') else False,
                "observability_enabled": agent.is_observability_enabled() if hasattr(agent, 'is_observability_enabled') else False,
                "streaming_enabled": agent.is_streaming_enabled() if hasattr(agent, 'is_streaming_enabled') else False,
            },
            "model_temperature": (
                float(agent.nr_temperature) if agent.nr_temperature else config.model.temperature if config and config.model else None
            ),
            "tools": tools,
        }
