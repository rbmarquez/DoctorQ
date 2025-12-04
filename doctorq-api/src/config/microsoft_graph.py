# src/utils/microsoft_graph.py
from typing import Any, Dict, Optional

import msal
import requests

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class MicrosoftGraphClient:
    """Cliente utilitÃ¡rio para Microsoft Graph API"""

    def __init__(self, client_id: str, client_secret: str, tenant_id: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.tenant_id = tenant_id
        self.authority = f"https://login.microsoftonline.com/{tenant_id}"
        self.graph_url = "https://graph.microsoft.com/v1.0"
        self._access_token: Optional[str] = None

        # Configurar aplicaÃ§Ã£o MSAL
        self.app: msal.ConfidentialClientApplication = (
            msal.ConfidentialClientApplication(
                client_id=self.client_id,
                client_credential=self.client_secret,
                authority=self.authority,
            )
        )

    def get_access_token(self) -> str:
        """Obter token de acesso usando client credentials flow"""
        try:
            if self._access_token:
                return self._access_token

            # Solicitar token com escopo apropriado
            result = self.app.acquire_token_for_client(
                scopes=["https://graph.microsoft.com/.default"]
            )

            if "access_token" not in result:
                error_description = result.get("error_description", "Erro desconhecido")
                error_code = result.get("error", "unknown_error")
                raise ValueError(
                    f"Falha na autenticaÃ§Ã£o Microsoft Graph: {error_code} - {error_description}"
                )

            access_token = result.get("access_token")
            if not access_token or not isinstance(access_token, str):
                raise ValueError(
                    "Token de acesso invÃ¡lido retornado pelo Microsoft Graph"
                )

            self._access_token = access_token
            logger.debug("Token de acesso Microsoft Graph obtido com sucesso")
            return self._access_token

        except Exception as e:
            logger.error(f"Erro ao obter token Microsoft Graph: {str(e)}")
            raise

    def make_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Fazer requisiÃ§Ã£o para Microsoft Graph API"""
        try:
            token = self.get_access_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }

            url = f"{self.graph_url}{endpoint}"

            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=30,
            )

            # Se token expirou, tentar renovar
            if response.status_code == 401:
                logger.warning("Token expirado, renovando...")
                self._access_token = None
                token = self.get_access_token()
                headers["Authorization"] = f"Bearer {token}"

                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=data,
                    params=params,
                    timeout=30,
                )

            response.raise_for_status()

            # Retornar JSON se disponÃ­vel
            try:
                return response.json()
            except ValueError:
                return {
                    "content": response.content.decode(),
                    "status_code": response.status_code,
                }

        except requests.exceptions.RequestException as e:
            logger.error(
                f"Erro na requisiÃ§Ã£o Microsoft Graph para {endpoint}: {str(e)}"
            )
            raise
        except Exception as e:
            logger.error(f"Erro inesperado na requisiÃ§Ã£o Microsoft Graph: {str(e)}")
            raise

    def test_connection(self) -> bool:
        """Testar conectividade com Microsoft Graph"""
        try:
            # Fazer requisiÃ§Ã£o simples para validar credenciais
            response = self.make_request("/me/drive")

            if response.get("id"):
                logger.debug("ConexÃ£o com Microsoft Graph validada com sucesso")
                return True
            logger.warning("ConexÃ£o com Microsoft Graph retornou resposta inesperada")
            return False

        except Exception as e:
            logger.error(f"Falha na conexÃ£o com Microsoft Graph: {str(e)}")
            return False

    def get_user_info(self) -> Dict[str, Any]:
        """Obter informaÃ§Ãµes do usuÃ¡rio autenticado"""
        try:
            return self.make_request("/me")
        except Exception as e:
            logger.error(f"Erro ao obter informaÃ§Ãµes do usuÃ¡rio: {str(e)}")
            raise

    def get_drive_info(self) -> Dict[str, Any]:
        """Obter informaÃ§Ãµes do OneDrive"""
        try:
            return self.make_request("/me/drive")
        except Exception as e:
            logger.error(f"Erro ao obter informaÃ§Ãµes do drive: {str(e)}")
            raise

    def list_files(self, path: str = "/", limit: int = 1000) -> Dict[str, Any]:
        """Listar arquivos em um caminho especÃ­fico"""
        try:
            if path == "/" or not path:
                endpoint = "/me/drive/root/children"
            else:
                clean_path = path.strip("/")
                endpoint = f"/me/drive/root:/{clean_path}:/children"

            params = {
                "$top": limit,
                "$select": "id,name,size,createdDateTime,lastModifiedDateTime,file,folder,parentReference,webUrl,@microsoft.graph.downloadUrl,eTag",
            }

            return self.make_request(endpoint, params=params)

        except Exception as e:
            logger.error(f"Erro ao listar arquivos em {path}: {str(e)}")
            raise

    def download_file(self, file_id: str) -> bytes:
        """Baixar conteÃºdo de um arquivo"""
        try:
            # Primeiro obter a URL de download
            file_info = self.make_request(f"/me/drive/items/{file_id}")
            download_url = file_info.get("@microsoft.graph.downloadUrl")

            if download_url:
                # Usar URL de download direto
                response = requests.get(download_url, timeout=60)
                response.raise_for_status()
                return response.content

            # Usar endpoint padrÃ£o
            token = self.get_access_token()
            headers = {"Authorization": f"Bearer {token}"}
            url = f"{self.graph_url}/me/drive/items/{file_id}/content"

            response = requests.get(url, headers=headers, timeout=60)
            response.raise_for_status()
            return response.content

        except Exception as e:
            logger.error(f"Erro ao baixar arquivo {file_id}: {str(e)}")
            raise

    def get_file_info(self, file_id: str) -> Dict[str, Any]:
        """Obter informaÃ§Ãµes detalhadas de um arquivo"""
        try:
            params = {
                "$select": "id,name,size,createdDateTime,lastModifiedDateTime,file,parentReference,webUrl,@microsoft.graph.downloadUrl,eTag"
            }
            return self.make_request(f"/me/drive/items/{file_id}", params=params)

        except Exception as e:
            logger.error(f"Erro ao obter informaÃ§Ãµes do arquivo {file_id}: {str(e)}")
            raise

    def search_files(self, query: str, limit: int = 100) -> Dict[str, Any]:
        """Buscar arquivos por nome ou conteÃºdo"""
        try:
            params = {
                "$top": limit,
                "$select": "id,name,size,createdDateTime,lastModifiedDateTime,file,parentReference,webUrl",
            }

            endpoint = f"/me/drive/root/search(q='{query}')"
            return self.make_request(endpoint, params=params)

        except Exception as e:
            logger.error(f"Erro ao buscar arquivos com query '{query}': {str(e)}")
            raise


def create_graph_client(
    client_id: str, client_secret: str, tenant_id: str
) -> MicrosoftGraphClient:
    """Factory function para criar cliente Microsoft Graph"""
    return MicrosoftGraphClient(client_id, client_secret, tenant_id)
