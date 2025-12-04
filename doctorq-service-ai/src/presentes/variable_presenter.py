# src/presentes/variable_presenter.py
from typing import Any, Dict, List

from src.models.variable import Variable


class VariablePresenter:
    """Presenter para formataÃ§Ã£o de respostas de variÃ¡veis"""

    @staticmethod
    def mask_encrypted_value(value: str, show_partial: bool = False) -> str:
        """Mascara valores criptografados - retorna apenas asteriscos"""
        if not value:
            return value

        # Sempre retorna apenas asteriscos para valores criptografados
        return "*****"

    @staticmethod
    def present_variable(
        variable: Variable, mask_encrypted: bool = True
    ) -> Dict[str, Any]:
        """Apresenta uma variÃ¡vel individual"""
        if not variable:
            return {}

        presented = {
            "id_variavel": str(variable.id_variavel),
            "nm_variavel": variable.nm_variavel,
            "vl_variavel": variable.vl_variavel,
            "st_criptografado": variable.st_criptografado,
            "dt_criacao": (
                variable.dt_criacao.isoformat() if variable.dt_criacao else None
            ),
            "dt_atualizacao": (
                variable.dt_atualizacao.isoformat() if variable.dt_atualizacao else None
            ),
        }

        # Mascarar valores criptografados se solicitado
        if mask_encrypted and variable.st_criptografado == "S":
            presented["vl_variavel"] = VariablePresenter.mask_encrypted_value(
                variable.vl_variavel or ""
            )

        return presented

    @staticmethod
    def present_variable_list(
        variables: List[Variable],
        total: int,
        page: int,
        size: int,
        mask_encrypted: bool = True,
    ) -> Dict[str, Any]:
        """Apresenta uma lista de variÃ¡veis com metadados de paginaÃ§Ã£o"""
        import math

        presented_variables = [
            VariablePresenter.present_variable(var, mask_encrypted) for var in variables
        ]

        return {
            "data": presented_variables,
            "meta": {
                "total": total,
                "page": page,
                "size": size,
                "totalPages": math.ceil(total / size) if size > 0 else 0,
                "hasNext": page * size < total,
                "hasPrevious": page > 1,
            },
        }

    @staticmethod
    def present_variable_response(
        variable: Variable, method: str = "GET"
    ) -> Dict[str, Any]:
        """Apresenta resposta de variÃ¡vel baseada no mÃ©todo HTTP"""
        # Para POST/PUT, nÃ£o mascarar valores (retornar dados completos)
        mask_encrypted = method.upper() not in ["POST", "PUT"]

        return VariablePresenter.present_variable(variable, mask_encrypted)

    @staticmethod
    def present_variable_list_response(
        variables: List[Variable], total: int, page: int, size: int, method: str = "GET"
    ) -> Dict[str, Any]:
        """Apresenta resposta de lista de variÃ¡veis"""
        # Para GET, mascarar valores criptografados
        mask_encrypted = method.upper() == "GET"

        return VariablePresenter.present_variable_list(
            variables, total, page, size, mask_encrypted
        )
