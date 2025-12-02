# src/utils/mask_utils.py
from typing import Any, Dict


def apply_masks_to_credentials(dados: Dict[str, Any]) -> Dict[str, Any]:
    """
    Aplica mÃ¡scaras nos campos sensÃ­veis de credenciais.

    Args:
        dados: DicionÃ¡rio com os dados da credencial descriptografados

    Returns:
        DicionÃ¡rio com dados mascarados apropriadamente
    """
    if not isinstance(dados, dict):
        return dados

    masked_data = {}

    for key, value in dados.items():
        if isinstance(value, str):
            masked_data[key] = _mask_sensitive_field(key, value)
        elif isinstance(value, dict):
            # Recursivamente aplicar mÃ¡scara para objetos aninhados
            masked_data[key] = apply_masks_to_credentials(value)
        else:
            # Manter valor original para tipos nÃ£o sensÃ­veis
            masked_data[key] = value

    return masked_data


def _mask_sensitive_field(field_name: str, value: str) -> str:
    """
    Aplica mÃ¡scara apropriada baseada no nome do campo.

    Args:
        field_name: Nome do campo
        value: Valor do campo

    Returns:
        Valor mascarado
    """
    if not isinstance(value, str) or not value:
        return value

    field_lower = field_name.lower()

    # Campos de senha/password - usar ****
    if any(
        password_key in field_lower for password_key in ["senha", "password", "pass"]
    ):
        return "****"

    # Campos de usuario/user - usar mÃ¡scara parcial
    if any(user_key in field_lower for user_key in ["usuario", "user"]):
        return _create_partial_mask(value)

    # Campos de token ou chave - usar mÃ¡scara parcial
    if any(
        token_key in field_lower
        for token_key in [
            "token",
            "chave",
            "key",
            "secret",
            "api_key",
            "apikey",
            "api_secret",
            "api_secret_key",
            "client",
            "tenant",
        ]
    ):
        return _create_partial_mask(value)

    # Retornar valor original para campos nÃ£o sensÃ­veis
    return value


def _create_partial_mask(value: str) -> str:
    """
    Cria mÃ¡scara parcial para tokens e chaves, mostrando apenas inÃ­cio e fim.

    Args:
        value: Valor a ser mascarado

    Returns:
        Valor com mÃ¡scara parcial
    """
    if len(value) <= 8:
        # Para valores muito pequenos, mostrar apenas os primeiros 2 caracteres
        return value[:2] + "*" * (len(value) - 2)

    if len(value) <= 20:
        # Para valores mÃ©dios, mostrar inÃ­cio e fim com asteriscos no meio
        return value[:3] + "*" * (len(value) - 6) + value[-3:]

    # Para valores grandes, mostrar mais caracteres no inÃ­cio e fim
    return value[:4] + "*" * (len(value) - 8) + value[-4:]
