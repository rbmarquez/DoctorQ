# src/services/tool_filter_service.py
import os
import uuid
from typing import Dict, List

from src.config.logger_config import get_logger
from src.models.tool import Tool
from src.services.tool_service import ToolService, get_tool_service
from src.services.user_service import UserService, get_user_service

logger = get_logger(__name__)


class ToolFilterService:
    """
    Service para filtrar tools baseado nas unidades SEI do usuÃ¡rio
    Integra UserService e ToolService para aplicar regras de seguranÃ§a
    """

    def __init__(
        self, user_service: UserService = None, tool_service: ToolService = None
    ):
        self.user_service = user_service or get_user_service()
        self.tool_service = tool_service or get_tool_service()

    async def get_user_tools_filtered(self, user_id: uuid.UUID) -> List[Tool]:
        """
        Obter tools ativas filtradas pelas unidades SEI do usuÃ¡rio

        Args:
            user_id: ID do usuÃ¡rio

        Returns:
            Lista de tools que o usuÃ¡rio pode acessar
        """
        try:
            logger.debug(f"Iniciando filtro de tools para usuÃ¡rio {user_id}")

            # Verificar se o filtro SEI estÃ¡ desabilitado
            disable_sei_filter = os.getenv("DISABLE_SEI_FILTER", "false").lower() in [
                "true",
                "1",
                "yes",
                "on",
            ]

            if disable_sei_filter:
                logger.warning(
                    "Filtro SEI desabilitado via DISABLE_SEI_FILTER - retornando todas as tools"
                )
                return await self.tool_service.get_active_tools()

            # Obter unidades SEI do usuÃ¡rio do cache Redis
            user_unidades_data = await self.user_service.get_unidade_sei(str(user_id))
            user_unidades = user_unidades_data.get("unidades", [])

            # Verificar se Redis estÃ¡ funcionando
            if not user_unidades and user_unidades_data.get("ultimo_sync") is None:
                logger.warning(f"Redis pode estar indisponÃ­vel para usuÃ¡rio {user_id}")

                # Fallback: verificar se deve retornar todas as tools ou sÃ³ nÃ£o-SEI
                redis_fallback_mode = os.getenv("REDIS_FALLBACK_MODE", "safe").lower()

                if redis_fallback_mode == "allow_all":
                    logger.warning(
                        "REDIS_FALLBACK_MODE=allow_all - retornando todas as tools"
                    )
                    return await self.tool_service.get_active_tools()

                logger.info(
                    "REDIS_FALLBACK_MODE=safe - retornando apenas tools nÃ£o-SEI"
                )
                all_tools = await self.tool_service.get_active_tools()
                safe_tools = [
                    tool
                    for tool in all_tools
                    if not self.tool_service.is_sei_tool(tool.nm_tool)
                ]
                logger.info(
                    f"Fallback Redis: {len(safe_tools)} tools nÃ£o-SEI disponÃ­veis"
                )
                return safe_tools

            if not user_unidades:
                logger.info(f"UsuÃ¡rio {user_id} nÃ£o possui unidades SEI no cache")
            else:
                logger.debug(
                    f"UsuÃ¡rio {user_id} possui {len(user_unidades)} unidades SEI"
                )
                # Log das unidades para debug
                unit_ids = [u.get("id_unidade") for u in user_unidades]
                logger.debug(f"Unidades do usuÃ¡rio {user_id}: {unit_ids}")

                # Obter tools filtradas
                filtered_tools = await self.tool_service.get_active_tools_filtered(
                    user_unidades
                )

                logger.info(
                    f"UsuÃ¡rio {user_id}: {len(filtered_tools)} tools disponÃ­veis apÃ³s filtro SEI"
                )
                return filtered_tools

        except Exception as e:
            logger.error(f"Erro ao filtrar tools para usuÃ¡rio {user_id}: {str(e)}")
            # Em caso de erro, retornar apenas tools nÃ£o-SEI para seguranÃ§a
            try:
                all_tools = await self.tool_service.get_active_tools()
                safe_tools = [
                    tool
                    for tool in all_tools
                    if not self.tool_service.is_sei_tool(tool.nm_tool)
                ]
                logger.warning(
                    f"Fallback de erro: retornando {len(safe_tools)} tools nÃ£o-SEI para usuÃ¡rio {user_id}"
                )
                return safe_tools
            except Exception as fallback_error:
                logger.error(f"Erro no fallback de tools: {fallback_error}")
                return []

    async def force_user_sei_sync_and_get_tools(
        self, user_id: uuid.UUID, user_email: str
    ) -> Dict:
        """
        ForÃ§a sincronizaÃ§Ã£o SEI e retorna tools atualizadas

        Args:
            user_id: ID do usuÃ¡rio
            user_email: Email do usuÃ¡rio

        Returns:
            DicionÃ¡rio com dados de sincronizaÃ§Ã£o e tools filtradas
        """
        try:
            logger.info(f"ForÃ§ando sincronizaÃ§Ã£o SEI para usuÃ¡rio {user_email}")

            # ForÃ§ar sincronizaÃ§Ã£o SEI
            sync_result = await self.user_service.force_sei_sync(
                user_email, str(user_id)
            )

            # Obter tools filtradas apÃ³s sincronizaÃ§Ã£o
            filtered_tools = await self.get_user_tools_filtered(user_id)

            return {
                "sync_result": sync_result,
                "filtered_tools": [
                    {
                        "id_tool": str(tool.id_tool),
                        "nm_tool": tool.nm_tool,
                        "tp_tool": tool.tp_tool,
                        "ds_tool": tool.ds_tool,
                        "is_sei_tool": self.tool_service.is_sei_tool(tool.nm_tool),
                    }
                    for tool in filtered_tools
                ],
                "total_tools": len(filtered_tools),
            }

        except Exception as e:
            logger.error(f"Erro ao sincronizar e filtrar tools: {str(e)}")
            return {
                "sync_result": {"erro": str(e)},
                "filtered_tools": [],
                "total_tools": 0,
            }

    async def get_user_tools_summary(self, user_id: uuid.UUID) -> Dict:
        """
        Obter resumo das tools do usuÃ¡rio com informaÃ§Ãµes de filtro

        Args:
            user_id: ID do usuÃ¡rio

        Returns:
            DicionÃ¡rio com resumo das tools
        """
        try:
            # Obter todas as tools ativas
            all_tools = await self.tool_service.get_active_tools()

            # Obter tools filtradas para o usuÃ¡rio
            user_tools = await self.get_user_tools_filtered(user_id)

            # Contar por categoria
            sei_tools_available = [
                tool
                for tool in user_tools
                if self.tool_service.is_sei_tool(tool.nm_tool)
            ]

            sei_tools_total = [
                tool
                for tool in all_tools
                if self.tool_service.is_sei_tool(tool.nm_tool)
            ]

            non_sei_tools = [
                tool
                for tool in user_tools
                if not self.tool_service.is_sei_tool(tool.nm_tool)
            ]

            # Obter dados das unidades
            user_unidades_data = await self.user_service.get_unidade_sei(str(user_id))

            return {
                "user_id": str(user_id),
                "total_tools_available": len(user_tools),
                "sei_tools": {
                    "available": len(sei_tools_available),
                    "total_system": len(sei_tools_total),
                    "user_units": len(user_unidades_data.get("unidades", [])),
                },
                "non_sei_tools": len(non_sei_tools),
                "last_sei_sync": user_unidades_data.get("ultimo_sync"),
                "tools_details": [
                    {
                        "nm_tool": tool.nm_tool,
                        "tp_tool": tool.tp_tool,
                        "is_sei": self.tool_service.is_sei_tool(tool.nm_tool),
                        "unit_id": (
                            self.tool_service.extract_unit_id_from_tool_name(
                                tool.nm_tool
                            )
                            if self.tool_service.is_sei_tool(tool.nm_tool)
                            else None
                        ),
                    }
                    for tool in user_tools
                ],
            }

        except Exception as e:
            logger.error(f"Erro ao obter resumo de tools: {str(e)}")
            return {
                "user_id": str(user_id),
                "error": str(e),
                "total_tools_available": 0,
                "sei_tools": {"available": 0, "total_system": 0, "user_units": 0},
                "non_sei_tools": 0,
                "tools_details": [],
            }


def get_tool_filter_service() -> ToolFilterService:
    """Factory function para criar instÃ¢ncia do ToolFilterService"""
    return ToolFilterService()
