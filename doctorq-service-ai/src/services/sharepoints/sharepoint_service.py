# src/services/sharepoint_service.py
import hashlib
import io
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import quote

import msal
import requests
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.services.credencial_service import CredencialService
from src.services.variable_service import VariableService

logger = get_logger(__name__)


class SharePointFile:
    """Classe para representar um arquivo do SharePoint"""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.name = data.get("name")
        self.size = data.get("size", 0)
        self.web_url = data.get("webUrl")
        self.download_url = data.get("@microsoft.graph.downloadUrl")
        self.created_datetime = data.get("createdDateTime")
        self.last_modified_datetime = data.get("lastModifiedDateTime")
        self.mime_type = (
            data.get("file", {}).get("mimeType") if data.get("file") else None
        )
        self.parent_path = data.get("parentReference", {}).get("path", "")

        # Criar caminho completo
        self.full_path = self._build_full_path()

        # Hash para controle de mudanÃ§as
        self.etag = data.get("eTag")

    def _build_full_path(self) -> str:
        """ConstrÃ³i o caminho completo do arquivo"""
        if self.parent_path:
            # Remove '/drive/root:' do inÃ­cio se existir
            clean_path = self.parent_path.replace("/drive/root:", "")
            if clean_path and not clean_path.endswith("/"):
                clean_path += "/"
            return f"{clean_path}{self.name}"
        return self.name if self.name else ""

    def is_supported_file(self) -> bool:
        """Verifica se o arquivo Ã© de um tipo suportado"""
        supported_types = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
            "application/msword",  # .doc
            "text/plain",
            "text/markdown",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
            "application/vnd.ms-powerpoint",  # .ppt
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
            "application/vnd.ms-excel",  # .xls
            "text/csv",
            "application/json",
        }

        if self.mime_type in supported_types:
            return True

        # Verificar por extensÃ£o tambÃ©m
        if self.name:
            extension = self.name.lower().split(".")[-1] if "." in self.name else ""
            supported_extensions = {
                "pdf",
                "docx",
                "doc",
                "txt",
                "md",
                "pptx",
                "ppt",
                "xlsx",
                "xls",
                "csv",
                "json",
            }
            return extension in supported_extensions

        return False

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {
            "id": self.id,
            "name": self.name,
            "size": self.size,
            "web_url": self.web_url,
            "download_url": self.download_url,
            "created_datetime": self.created_datetime,
            "last_modified_datetime": self.last_modified_datetime,
            "mime_type": self.mime_type,
            "full_path": self.full_path,
            "etag": self.etag,
        }


class SharePointFolder:
    """Classe para representar uma pasta do SharePoint"""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.name = data.get("name")
        self.web_url = data.get("webUrl")
        self.created_datetime = data.get("createdDateTime")
        self.last_modified_datetime = data.get("lastModifiedDateTime")
        self.parent_path = data.get("parentReference", {}).get("path", "")
        self.child_count = data.get("folder", {}).get("childCount", 0)

        # Criar caminho completo
        self.full_path = self._build_full_path()

    def _build_full_path(self) -> str:
        """ConstrÃ³i o caminho completo da pasta"""
        if self.parent_path:
            clean_path = self.parent_path.replace("/drive/root:", "")
            if clean_path and not clean_path.endswith("/"):
                clean_path += "/"
            return f"{clean_path}{self.name}"
        return self.name if self.name else ""

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {
            "id": self.id,
            "name": self.name,
            "web_url": self.web_url,
            "created_datetime": self.created_datetime,
            "last_modified_datetime": self.last_modified_datetime,
            "full_path": self.full_path,
            "child_count": self.child_count,
        }


class SharePointService:
    """
    ServiÃ§o para integraÃ§Ã£o com SharePoint via Microsoft Graph API

    Carrega automaticamente o ID da credencial da variÃ¡vel 'SHAREPOINT_CREDENCIAL_ID'

    Este serviÃ§o usa duas credenciais:
    1. Credencial principal que contÃ©m configuraÃ§Ãµes do SharePoint:
       - tenant_name: Nome do tenant (ex: "minfraestrutura")
       - site_url: URL completa do site
       - site_name: Nome do site (ex: "Coint336")
       - folder_path: Caminho da pasta (ex: "General/ServiÃ§o Atendimento UsuÃ¡rio OperaÃ§Ã£o Infraestrutura/Base de Conhecimento")

    2. Credencial do Microsoft Graph API para autenticaÃ§Ã£o:
       - client_id, client_secret, tenant_id

    Exemplo de uso:
        # Usar com sessÃ£o do banco para carregar automaticamente da variÃ¡vel
        service = SharePointService(db_session=db)

        # Ou usar ID especÃ­fico como fallback
        service = SharePointService(db_session=db, id_credencial="algum-id")
    """

    def __init__(
        self,
        db_session: Optional[AsyncSession] = None,
        id_credencial: Optional[str] = None,
    ):
        self.graph_url = "https://graph.microsoft.com/v1.0"
        self._access_token = None
        self.db_session = db_session
        self.variable_service = VariableService(db_session) if db_session else None
        self.id_credencial = id_credencial
        self.credencial_service = CredencialService()

        # ConfiguraÃ§Ãµes do SharePoint - serÃ£o carregadas das credenciais
        self.tenant = None
        self.site_name = None
        self.site_url = None
        self.default_library = "Shared Documents"
        self.default_folder = None

        # Site ID serÃ¡ obtido dinamicamente
        self._site_id = None

    def _validate_environment_variables(self) -> None:
        """Valida se as configuraÃ§Ãµes necessÃ¡rias estÃ£o disponÃ­veis"""
        try:
            # As configuraÃ§Ãµes agora vÃªm das credenciais, nÃ£o das variÃ¡veis de ambiente
            if not all(
                [self.tenant, self.site_name, self.site_url, self.default_folder]
            ):
                raise ValueError(
                    "ConfiguraÃ§Ãµes do SharePoint nÃ£o foram carregadas das credenciais"
                )

            logger.debug("ConfiguraÃ§Ãµes do SharePoint validadas com sucesso")

        except Exception as e:
            logger.error(f"Erro na validaÃ§Ã£o das configuraÃ§Ãµes: {str(e)}")
            raise

    async def _get_sharepoint_config(self) -> Dict[str, str]:
        """ObtÃ©m configuraÃ§Ãµes do SharePoint das credenciais"""
        try:
            # Carregar ID da credencial se ainda nÃ£o foi carregado
            if not self.id_credencial:
                await self._load_credential_id()

            if not self.id_credencial:
                logger.error("ID da credencial SharePoint nÃ£o disponÃ­vel")
                raise ValueError("ID da credencial SharePoint nÃ£o disponÃ­vel")

            # Converter string para UUID se necessÃ¡rio
            credencial_id = (
                uuid.UUID(self.id_credencial)
                if isinstance(self.id_credencial, str)
                else self.id_credencial
            )

            # Buscar credencial
            credencial_data = await self.credencial_service.get_credencial_decrypted(
                credencial_id
            )

            if not credencial_data:
                raise ValueError(f"Credencial nÃ£o encontrada: {self.id_credencial}")

            dados = credencial_data.get("dados", {})

            # Validar se os campos obrigatÃ³rios estÃ£o presentes
            required_fields = ["tenant_name", "site_url", "site_name", "folder_path"]
            missing_fields = [field for field in required_fields if field not in dados]

            if missing_fields:
                raise ValueError(
                    f"Campos obrigatÃ³rios ausentes na credencial: {', '.join(missing_fields)}"
                )

            # Atualizar configuraÃ§Ãµes da instÃ¢ncia
            self.tenant = dados["tenant_name"]
            self.site_name = dados["site_name"]
            self.site_url = dados["site_url"]
            self.default_folder = dados["folder_path"]

            logger.debug("ConfiguraÃ§Ãµes do SharePoint carregadas com sucesso")

            return {
                "tenant_name": dados["tenant_name"],
                "site_url": dados["site_url"],
                "site_name": dados["site_name"],
                "folder_path": dados["folder_path"],
            }

        except Exception as e:
            logger.error(f"Erro ao obter configuraÃ§Ãµes do SharePoint: {str(e)}")
            raise

    async def _get_credentials(self) -> Dict[str, str]:
        """ObtÃ©m credenciais do Microsoft Graph API do sistema de credenciais"""
        try:
            # Primeiro, carrega as configuraÃ§Ãµes do SharePoint
            await self._get_sharepoint_config()

            # Para as credenciais do Microsoft Graph, vamos usar um ID fixo
            # ou buscar nas variÃ¡veis de ambiente
            graph_credential_id = os.getenv(
                "MICROSOFT_GRAPH_CREDENTIAL_ID", "0f4ee71e-10ca-45e4-8873-d1a5dfae5f12"
            )
            credencial_id = (
                uuid.UUID(graph_credential_id)
                if isinstance(graph_credential_id, str)
                else graph_credential_id
            )

            # Buscar credencial do Microsoft Graph
            credencial_data = await self.credencial_service.get_credencial_decrypted(
                credencial_id
            )

            if not credencial_data:
                raise ValueError(
                    f"Credencial do Microsoft Graph nÃ£o encontrada: {graph_credential_id}"
                )

            dados = credencial_data.get("dados", {})

            # Validar se os campos obrigatÃ³rios estÃ£o presentes
            required_fields = ["client_id", "client_secret", "tenant_id"]
            missing_fields = [field for field in required_fields if field not in dados]

            if missing_fields:
                raise ValueError(
                    f"Campos obrigatÃ³rios ausentes na credencial do Microsoft Graph: {', '.join(missing_fields)}"
                )

            logger.debug("Credenciais do Microsoft Graph carregadas com sucesso")

            return {
                "client_id": dados["client_id"],
                "client_secret": dados["client_secret"],
                "tenant_id": dados["tenant_id"],
            }

        except Exception as e:
            logger.error(f"Erro ao obter credenciais: {str(e)}")
            raise

    async def _get_access_token(self) -> str:
        """ObtÃ©m token de acesso usando client credentials flow"""
        try:
            if self._access_token:
                return self._access_token

            credentials = await self._get_credentials()

            # Configurar MSAL
            app = msal.ConfidentialClientApplication(
                client_id=credentials["client_id"],
                client_credential=credentials["client_secret"],
                authority=f"https://login.microsoftonline.com/{credentials['tenant_id']}",
            )

            # Solicitar token
            result = app.acquire_token_for_client(
                scopes=["https://graph.microsoft.com/.default"]
            )

            if not result or "access_token" not in result:
                error_msg = (
                    result.get("error_description", "Erro desconhecido ao obter token")
                    if result
                    else "Resposta nula ao obter token"
                )
                raise ValueError(f"Falha na autenticaÃ§Ã£o: {error_msg}")

            self._access_token = result["access_token"]
            logger.debug("Token de acesso obtido com sucesso")
            return self._access_token

        except Exception as e:
            logger.error(f"Erro ao obter token de acesso: {str(e)}")
            raise

    async def _make_request(
        self, endpoint: str, method: str = "GET", **kwargs
    ) -> Dict[str, Any]:
        """Faz requisiÃ§Ã£o para Microsoft Graph API"""
        try:
            token = await self._get_access_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }

            url = f"{self.graph_url}{endpoint}"
            response = requests.request(
                method, url, headers=headers, timeout=30, **kwargs
            )

            if response.status_code == 401:
                # Token expirado, limpar e tentar novamente
                self._access_token = None
                token = await self._get_access_token()
                headers["Authorization"] = f"Bearer {token}"
                response = requests.request(
                    method, url, headers=headers, timeout=30, **kwargs
                )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro na requisiÃ§Ã£o para {endpoint}: {str(e)}")
            raise

    async def _get_site_id(self) -> str:
        """ObtÃ©m o ID do site SharePoint"""
        try:
            if self._site_id:
                return self._site_id

            # Garantir que as configuraÃ§Ãµes foram carregadas
            if not self.tenant or not self.site_name:
                await self._get_sharepoint_config()

            # Construir endpoint para obter site ID
            hostname = f"{self.tenant}.sharepoint.com"
            site_path = f"/sites/{self.site_name}"
            endpoint = f"/sites/{hostname}:{site_path}"

            logger.debug(f"Obtendo Site ID para: {self.site_url}")

            response = await self._make_request(endpoint)
            self._site_id = response.get("id")

            if not self._site_id:
                raise ValueError("Site ID nÃ£o encontrado na resposta")

            logger.debug(f"Site ID obtido: {self._site_id}")
            return self._site_id

        except Exception as e:
            logger.error(f"Erro ao obter Site ID: {str(e)}")
            raise

    async def get_single_file_from_root(self) -> Optional[SharePointFile]:
        """Lista apenas o primeiro arquivo encontrado na pasta raiz"""
        try:
            # Garantir que as configuraÃ§Ãµes foram carregadas
            if not self.default_folder:
                await self._get_sharepoint_config()

            site_id = await self._get_site_id()

            logger.debug(f"Buscando um arquivo na pasta raiz: {self.default_folder}")

            # URL encode do caminho para lidar com caracteres especiais
            encoded_path = quote(self.default_folder.strip("/"))
            endpoint = f"/sites/{site_id}/drive/root:/{encoded_path}:/children"

            # ParÃ¢metros para obter apenas 1 item e filtrar apenas arquivos
            params = {
                "$select": "id,name,size,createdDateTime,lastModifiedDateTime,file,folder,parentReference,webUrl,@microsoft.graph.downloadUrl,eTag",
                "$expand": "thumbnails",
                "$top": 1,  # MÃ¡ximo de itens por pÃ¡gina
            }

            response = await self._make_request(endpoint, params=params)
            items = response.get("value", [])

            if items:
                sharepoint_file = SharePointFile(items[0])
                logger.debug(sharepoint_file)
                # file =  await self.download_file_content(sharepoint_file)

                # text_content = save_upload_file([file])
                # print(text_content)
                # Logar informaÃ§Ãµes do arquivo encontrado

                return SharePointFile(items)
                # return None
            else:
                logger.debug("Nenhum arquivo encontrado na pasta raiz")
                return None

        except Exception as e:
            logger.error(f"Erro ao buscar arquivo Ãºnico: {str(e)}")
            raise

    async def list_files_in_library(
        self,
        library_name: Optional[str] = None,
        folder_path: Optional[str] = None,
        recursive: bool = True,
    ) -> List[SharePointFile]:
        """Lista arquivos em uma biblioteca do SharePoint"""
        try:
            if library_name is None:
                library_name = self.default_library

            # Garantir que as configuraÃ§Ãµes foram carregadas
            if not self.default_folder:
                await self._get_sharepoint_config()

            site_id = await self._get_site_id()
            files = []

            # Construir o caminho correto baseado no folder_path
            if folder_path:
                # Se folder_path foi fornecido, usar ele
                full_path = folder_path.strip("/")
            else:
                # Se nÃ£o foi fornecido, usar default_folder
                full_path = self.default_folder.strip("/")

            # URL encode do caminho para lidar com caracteres especiais
            encoded_path = quote(full_path)
            endpoint = f"/sites/{site_id}/drive/root:/{encoded_path}:/children"

            # Adicionar parÃ¢metros para incluir mais informaÃ§Ãµes
            params = {
                "$select": "id,name,size,createdDateTime,lastModifiedDateTime,file,folder,parentReference,webUrl,@microsoft.graph.downloadUrl,eTag",
                "$expand": "thumbnails",
                "$top": 1000,  # MÃ¡ximo de itens por pÃ¡gina
            }

            # Fazer requisiÃ§Ã£o paginada
            next_url = endpoint
            while next_url:
                if "?" in next_url:
                    response = await self._make_request(next_url)
                else:
                    response = await self._make_request(next_url, params=params)

                items = response.get("value", [])

                for item in items:
                    # Processar apenas arquivos (nÃ£o pastas)
                    if "file" in item:
                        sharepoint_file = SharePointFile(item)
                        logger.debug(f"Arquivo encontrado: {sharepoint_file.name}")
                        files.append(sharepoint_file)
                    elif "folder" in item and recursive:
                        # Recursivamente listar arquivos em subpastas
                        # CORREÃ‡ÃƒO: Construir o caminho completo da subpasta corretamente
                        subfolder_path = f"{full_path}/{item['name']}"

                        # Evitar recursÃ£o infinita: verificar se nÃ£o estamos indo para a mesma pasta
                        if subfolder_path != full_path:
                            try:
                                logger.debug(f"Entrando na subpasta: {subfolder_path}")
                                subfolder_files = await self.list_files_in_library(
                                    library_name, subfolder_path, recursive
                                )
                                logger.debug(
                                    f"Encontrados {len(subfolder_files)} arquivos na subpasta: {subfolder_path}"
                                )
                                files.extend(subfolder_files)
                            except Exception as e:
                                logger.warning(
                                    f"Erro ao listar subpasta {subfolder_path}: {str(e)}"
                                )
                                continue

                # Verificar se hÃ¡ prÃ³xima pÃ¡gina
                next_url = response.get("@odata.nextLink")
                if next_url:
                    # Extrair apenas o endpoint da URL completa
                    next_url = next_url.replace(self.graph_url, "")

            return files

        except Exception as e:
            logger.error(f"Erro ao listar arquivos: {str(e)}")
            raise

    async def list_folders(
        self, library_name: Optional[str] = None, folder_path: str = ""
    ) -> List[SharePointFolder]:
        """Lista apenas as pastas de uma biblioteca"""
        try:
            if library_name is None:
                library_name = self.default_library

            site_id = await self._get_site_id()
            folders = []

            # Construir endpoint baseado no caminho
            if folder_path:
                encoded_path = quote(folder_path.strip("/"))
                endpoint = f"/sites/{site_id}/drive/root:/{encoded_path}:/children"
            else:
                endpoint = f"/sites/{site_id}/drive/root/children"

            params = {
                "$select": "id,name,createdDateTime,lastModifiedDateTime,folder,parentReference,webUrl",
                "$filter": "folder ne null",  # Filtrar apenas pastas
                "$top": 1000,
            }

            next_url = endpoint
            while next_url:
                logger.debug(f"Fazendo requisiÃ§Ã£o para: {next_url}")
                if "?" in next_url:

                    response = await self._make_request(next_url)
                else:
                    response = await self._make_request(next_url, params=params)

                items = response.get("value", [])

                for item in items:
                    if "folder" in item:
                        folder = SharePointFolder(item)
                        folders.append(folder)
                        logger.debug(f"Encontrada pasta: {folder.name}")

                next_url = response.get("@odata.nextLink")
                if next_url:
                    next_url = next_url.replace(self.graph_url, "")

            logger.debug(
                f"Encontradas {len(folders)} pastas em {library_name}/{folder_path}"
            )
            return folders

        except Exception as e:
            logger.error(f"Erro ao listar pastas: {str(e)}")
            raise

    async def download_file_content(self, file: SharePointFile) -> io.BytesIO:
        """Baixa o conteÃºdo de um arquivo do SharePoint como um stream binÃ¡rio."""
        try:
            if not file.download_url:
                site_id = await self._get_site_id()
                endpoint = f"/sites/{site_id}/drive/items/{file.id}/content"
                token = await self._get_access_token()
                headers = {"Authorization": f"Bearer {token}"}
                url = f"{self.graph_url}{endpoint}"
                response = requests.get(url, headers=headers, timeout=30)
            else:
                response = requests.get(file.download_url, timeout=30)

            response.raise_for_status()
            data = response.content  # isso jÃ¡ Ã© um objeto bytes (binÃ¡rio)

            logger.debug(f"Arquivo baixado: {file.name} ({len(data)} bytes)")

            # retorna um buffer binÃ¡rio em memÃ³ria
            return io.BytesIO(data)

        except Exception as e:
            logger.error(f"Erro ao baixar arquivo {file.name}: {e}")
            raise

    async def get_file_by_id(self, file_id: str) -> Optional[SharePointFile]:
        """ObtÃ©m informaÃ§Ãµes de um arquivo especÃ­fico pelo ID"""
        try:
            site_id = await self._get_site_id()
            endpoint = f"/sites/{site_id}/drive/items/{file_id}"
            params = {
                "$select": "id,name,size,createdDateTime,lastModifiedDateTime,file,parentReference,webUrl,@microsoft.graph.downloadUrl,eTag"
            }

            logger.debug(f"Obtendo arquivo pelo ID: {file_id}")

            response = await self._make_request(endpoint, params=params)

            if "file" in response:
                return SharePointFile(response)

            return None

        except Exception as e:
            logger.error(f"Erro ao obter arquivo {file_id}: {str(e)}")
            raise

    async def get_file_hash(self, file: SharePointFile) -> str:
        """Calcula hash SHA256 do arquivo para controle de mudanÃ§as"""
        try:
            content = await self.download_file_content(file)
            return hashlib.sha256(content).hexdigest()

        except Exception as e:
            logger.error(f"Erro ao calcular hash do arquivo {file.name}: {str(e)}")
            raise

    async def search_files_by_name(
        self, query: str, library_name: Optional[str] = None, folder_path: str = ""
    ) -> List[SharePointFile]:
        """Busca arquivos por nome"""
        try:
            if library_name is None:
                library_name = self.default_library

            # Listar todos os arquivos e filtrar localmente
            all_files = await self.list_files_in_library(
                library_name, folder_path, recursive=True
            )

            # Filtrar por nome (case insensitive)
            query_lower = query.lower()
            matching_files = [
                file
                for file in all_files
                if query_lower and file.name and query_lower in file.name.lower()
            ]

            logger.debug(
                f"Busca por '{query}': encontrados {len(matching_files)} arquivos"
            )
            return matching_files

        except Exception as e:
            logger.error(f"Erro na busca de arquivos: {str(e)}")
            raise

    async def get_site_info(self) -> Dict[str, Any]:
        """ObtÃ©m informaÃ§Ãµes do site SharePoint"""
        try:
            site_id = await self._get_site_id()
            endpoint = f"/sites/{site_id}"

            response = await self._make_request(endpoint)

            return {
                "id": response.get("id"),
                "name": response.get("displayName"),
                "description": response.get("description"),
                "web_url": response.get("webUrl"),
                "created_datetime": response.get("createdDateTime"),
                "last_modified_datetime": response.get("lastModifiedDateTime"),
                "tenant": self.tenant,
                "site_name": self.site_name,
            }

        except Exception as e:
            logger.error(f"Erro ao obter informaÃ§Ãµes do site: {str(e)}")
            raise

    async def list_document_libraries(self) -> List[Dict[str, Any]]:
        """Lista todas as bibliotecas de documentos do site"""
        try:
            site_id = await self._get_site_id()
            endpoint = f"/sites/{site_id}/drives"

            response = await self._make_request(endpoint)
            libraries = response.get("value", [])

            formatted_libraries = []
            for library in libraries:
                formatted_libraries.append(
                    {
                        "id": library.get("id"),
                        "name": library.get("name"),
                        "description": library.get("description"),
                        "web_url": library.get("webUrl"),
                        "created_datetime": library.get("createdDateTime"),
                        "last_modified_datetime": library.get("lastModifiedDateTime"),
                        "drive_type": library.get("driveType"),
                    }
                )

            logger.debug(
                f"Encontradas {len(formatted_libraries)} bibliotecas de documentos"
            )
            return formatted_libraries

        except Exception as e:
            logger.error(f"Erro ao listar bibliotecas: {str(e)}")
            raise

    async def get_library_statistics(
        self, library_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """ObtÃ©m estatÃ­sticas de uma biblioteca"""
        try:
            if library_name is None:
                library_name = self.default_library

            # Listar todos os arquivos para calcular estatÃ­sticas
            all_files = await self.list_files_in_library(
                library_name, "", recursive=True
            )

            if not all_files:
                return {
                    "library_name": library_name,
                    "total_files": 0,
                    "total_size": 0,
                    "total_size_formatted": "0 B",
                    "supported_files": 0,
                    "file_types": {},
                    "last_scan": datetime.now().isoformat(),
                }

            # Calcular estatÃ­sticas
            total_files = len(all_files)
            total_size = sum(file.size for file in all_files)
            supported_files = sum(1 for file in all_files if file.is_supported_file())

            # Contar tipos de arquivo
            file_types = {}
            for file in all_files:
                if file.mime_type:
                    file_types[file.mime_type] = file_types.get(file.mime_type, 0) + 1
                else:
                    # Usar extensÃ£o se nÃ£o tiver mime_type
                    extension = (
                        file.name.split(".")[-1].lower()
                        if file.name and "." in file.name
                        else "sem_extensao"
                    )
                    file_types[f"*.{extension}"] = (
                        file_types.get(f"*.{extension}", 0) + 1
                    )

            return {
                "library_name": library_name,
                "total_files": total_files,
                "total_size": total_size,
                "total_size_formatted": self._format_file_size(total_size),
                "supported_files": supported_files,
                "unsupported_files": total_files - supported_files,
                "file_types": file_types,
                "average_file_size": (
                    total_size // total_files if total_files > 0 else 0
                ),
                "average_file_size_formatted": (
                    self._format_file_size(total_size // total_files)
                    if total_files > 0
                    else "0 B"
                ),
                "last_scan": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatÃ­sticas: {str(e)}")
            raise

    def _format_file_size(self, size_bytes: int) -> str:
        """Formatar tamanho do arquivo em formato legÃ­vel"""
        if size_bytes == 0:
            return "0 B"

        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        size = float(size_bytes)

        while size >= 1024.0 and i < len(size_names) - 1:
            size /= 1024.0
            i += 1

        return f"{size:.1f} {size_names[i]}"

    async def test_connection(self) -> Dict[str, Any]:
        """Testa a conexÃ£o com SharePoint"""
        try:
            logger.debug("Testando conexÃ£o com SharePoint")

            # Obter informaÃ§Ãµes do site
            site_info = await self.get_site_info()

            # Testar listagem de arquivos
            files = await self.list_files_in_library(
                self.default_library, "", recursive=False
            )

            return {
                "status": "connected",
                "message": "ConexÃ£o com SharePoint estabelecida com sucesso",
                "site_name": site_info.get("name"),
                "site_url": site_info.get("web_url"),
                "default_library": self.default_library,
                "files_found": len(files),
                "test_time": datetime.now().isoformat(),
            }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Erro na conexÃ£o com SharePoint: {str(e)}",
                "test_time": datetime.now().isoformat(),
            }

    async def _load_credential_id(self):
        """Carrega o ID da credencial da variÃ¡vel"""
        if not self.variable_service:
            logger.warning("VariableService nÃ£o disponÃ­vel para SharePoint")
            return

        try:
            # Buscar ID da credencial na variÃ¡vel
            variable = await self.variable_service.get_variable_by_vl_variavel(
                "SHAREPOINT_CREDENCIAL_ID"
            )

            if variable:
                self.id_credencial = variable.vl_variavel
                logger.debug(
                    f"ID da credencial SharePoint carregado da variÃ¡vel: {self.id_credencial}"
                )
            elif not self.id_credencial:
                logger.error("Nenhuma credencial SharePoint configurada")

        except Exception as e:
            logger.error(f"Erro ao carregar ID da credencial SharePoint: {str(e)}")

    def set_credential_id(self, id_credencial: str) -> None:
        """Define um novo ID de credencial"""
        self.id_credencial = id_credencial
        # Limpar token de acesso e configuraÃ§Ãµes para forÃ§ar novo carregamento
        self._access_token = None
        self._site_id = None
        self.tenant = None
        self.site_name = None
        self.site_url = None
        self.default_folder = None
        logger.debug(f"ID de credencial atualizado para: {id_credencial}")
