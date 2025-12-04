# src/utils/presenter.py
from typing import Any, Dict, List


class ApiKeyPresenter:
    """Presenter para modificar respostas de API Keys seguindo padrÃ£o vf_r*****************Dio"""

    @staticmethod
    def mask_api_key(api_key: str) -> str:
        """Mascara a API key seguindo o padrÃ£o vf_r*****************Dio"""
        if not api_key or len(api_key) < 4:
            return api_key

        # MantÃ©m os primeiros 4 caracteres e os Ãºltimos 3
        prefix = api_key[:4]
        suffix = api_key[-3:] if len(api_key) > 7 else ""
        masked_length = len(api_key) - len(prefix) - len(suffix)

        # Cria a mÃ¡scara com asteriscos
        mask = "*" * masked_length

        return f"{prefix}{mask}{suffix}"

    @staticmethod
    def present_api_key_response(api_key_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apresenta uma resposta de API key individual"""
        if not api_key_data:
            return api_key_data

        # Cria uma cÃ³pia para nÃ£o modificar o original
        presented_data = api_key_data.copy()

        # Mascara a apiKey se existir
        if "apiKey" in presented_data:
            presented_data["apiKey"] = ApiKeyPresenter.mask_api_key(
                presented_data["apiKey"]
            )

        # Mascara o apiSecret se existir (exceto em criaÃ§Ã£o)
        if "apiSecret" in presented_data:
            presented_data["apiSecret"] = ApiKeyPresenter.mask_api_key(
                presented_data["apiSecret"]
            )

        return presented_data

    @staticmethod
    def present_api_key_list_response(
        items: List[Dict[str, Any]], meta: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apresenta uma resposta de lista de API keys"""
        # Mascara cada item da lista
        presented_items = [
            ApiKeyPresenter.present_api_key_response(item) for item in items
        ]

        return {"items": presented_items, "meta": meta}


class ResponsePresenter:
    """Presenter genÃ©rico para respostas da API"""

    @staticmethod
    def present_response(data: Any, method: str = "GET") -> Any:
        """Apresenta resposta baseada no mÃ©todo HTTP"""
        # Para POST, nÃ£o aplica mÃ¡scara (mantÃ©m dados originais)
        if method.upper() == "POST":
            return data

        # Para outros mÃ©todos, aplica mÃ¡scara se for API Key
        if isinstance(data, dict):
            if "apiKey" in data or "items" in data:
                # Ã‰ uma resposta de API Key
                if "items" in data and "meta" in data:
                    # Ã‰ uma lista
                    return ApiKeyPresenter.present_api_key_list_response(
                        data["items"], data["meta"]
                    )
                # Ã‰ um item individual
                return ApiKeyPresenter.present_api_key_response(data)

        return data
