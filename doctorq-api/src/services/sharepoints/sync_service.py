# src/services/sync_service.py
import json
import os
import tempfile
import warnings
from datetime import datetime
from typing import Any, Dict, List, Optional

from src.config.logger_config import get_logger
from src.services.embedding_service import EmbeddingService
from src.services.sharepoints.sharepoint_service import (
    SharePointFile,
    SharePointService,
)
from src.utils.docling import DoclingProcessor

# Suprimir warnings especÃ­ficos do PyTorch relacionados ao MPS/pin_memory
warnings.filterwarnings(
    "ignore", message=".*pin_memory.*argument is set as true but not supported on MPS.*"
)
warnings.filterwarnings(
    "ignore", category=UserWarning, module="torch.utils.data.dataloader"
)

# Suprimir warnings da biblioteca Docling
warnings.filterwarnings(
    "ignore", message=".*Parameter.*strict_text.*has been deprecated.*"
)
warnings.filterwarnings(
    "ignore", category=UserWarning, module="docling_core.types.doc.document"
)

logger = get_logger(__name__)


class SyncService:
    """ServiÃ§o para sincronizaÃ§Ã£o com SharePoint"""

    def __init__(
        self,
        sharepoint_service: SharePointService,
        docling_processor: DoclingProcessor,
        embedding_service: EmbeddingService,
    ):
        self.sharepoint_service = sharepoint_service
        self.docling_processor = docling_processor
        self.embedding_service = embedding_service

    async def get_first_file(
        self, library: Optional[str] = None, folder_path: str = ""
    ) -> Optional[Dict[str, Any]]:
        """Obter apenas o primeiro arquivo de uma biblioteca/pasta especÃ­fica"""
        try:
            logger.debug(
                f"Obtendo primeiro arquivo da biblioteca: {library}, pasta: {folder_path}"
            )

            # Listar arquivos do SharePoint
            files = await self.sharepoint_service.get_single_file_from_root()

            if not files:
                logger.debug(
                    "Nenhum arquivo encontrado na biblioteca/pasta especificada"
                )
                return None

            # Retornar apenas o primeiro arquivo
            first_file = files[0]
            file_info = {
                "id": first_file.id,
                "name": first_file.name,
                "size": first_file.size,
                "size_formatted": self._format_file_size(first_file.size),
                "full_path": first_file.full_path,
                "web_url": first_file.web_url,
                "mime_type": first_file.mime_type,
                "created_datetime": first_file.created_datetime,
                "last_modified_datetime": first_file.last_modified_datetime,
                "is_supported": first_file.is_supported_file(),
                "etag": first_file.etag,
            }

            logger.debug(f"Primeiro arquivo encontrado: {first_file.name}")
            return file_info

        except Exception as e:
            logger.error(f"Erro ao obter primeiro arquivo: {str(e)}")
            raise

    async def list_sharepoint_files(
        self,
        library: Optional[str] = None,
        folder_path: str = "",
        force_refresh: Optional[bool] = False,
    ) -> List[Dict[str, Any]]:
        """Listar arquivos do SharePoint em uma biblioteca/pasta especÃ­fica"""
        try:
            logger.debug(
                f"Iniciando listagem de arquivos da biblioteca: {library}, pasta: {folder_path}"
            )

            cache_dir = "temp/cache/sharepoint/"
            os.makedirs(cache_dir, exist_ok=True)

            library_name = library or "default"
            # Incluir folder_path no nome do cache para diferenciar pastas
            folder_safe = (
                folder_path.replace("/", "_").replace("\\", "_")
                if folder_path
                else "root"
            )
            cache_file = os.path.join(
                cache_dir, f"files_cache_{library_name}_{folder_safe}.json"
            )

            files = []

            if force_refresh:
                logger.debug("Force refresh ativado - buscando arquivos do SharePoint")
                # Buscar arquivos do SharePoint
                files = await self.sharepoint_service.list_files_in_library(
                    library, folder_path
                )

                # Salvar no cache
                files_data = []
                for file in files:
                    # Tratar datetime - pode ser objeto datetime ou string
                    file_data = {
                        "id": file.id,
                        "name": file.name,
                        "size": file.size,
                        "full_path": file.full_path,
                    }
                    files_data.append(file_data)

                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(files_data, f, indent=2, ensure_ascii=False)

                logger.debug(f"Cache atualizado: {cache_file}")

            else:
                # Tentar carregar do cache
                if os.path.exists(cache_file):
                    logger.debug(f"Carregando arquivos do cache: {cache_file}")
                    try:
                        with open(cache_file, "r", encoding="utf-8") as f:
                            files_data = json.load(f)

                        # Reconstruir objetos SharePointFile do cache
                        for file_data in files_data:
                            # Converter strings ISO de volta para datetime se necessÃ¡rio
                            if file_data.get("created_datetime") and isinstance(
                                file_data["created_datetime"], str
                            ):
                                try:
                                    file_data["created_datetime"] = (
                                        datetime.fromisoformat(
                                            file_data["created_datetime"]
                                        )
                                    )
                                except Exception:
                                    file_data["created_datetime"] = None

                            if file_data.get("last_modified_datetime") and isinstance(
                                file_data["last_modified_datetime"], str
                            ):
                                try:
                                    file_data["last_modified_datetime"] = (
                                        datetime.fromisoformat(
                                            file_data["last_modified_datetime"]
                                        )
                                    )
                                except Exception:
                                    file_data["last_modified_datetime"] = None

                            files.append(SharePointFile(file_data))

                        logger.debug(f"Carregados {len(files)} arquivos do cache")

                    except Exception as cache_error:
                        logger.warning(f"Erro ao carregar cache: {cache_error}")
                        logger.debug(
                            "Cache corrompido, buscando arquivos do SharePoint"
                        )
                        files = await self.sharepoint_service.list_files_in_library(
                            library, folder_path
                        )
                else:
                    logger.debug(
                        "Cache nÃ£o encontrado, buscando arquivos do SharePoint"
                    )
                    files = await self.sharepoint_service.list_files_in_library(
                        library, folder_path
                    )

                    # Salvar no cache para prÃ³ximas consultas
                    files_data = []
                    for file in files:
                        # Tratar datetime - pode ser objeto datetime ou string

                        file_data = {
                            "id": file.id,
                            "name": file.name,
                            "size": file.size,
                            "full_path": file.full_path,
                        }
                        files_data.append(file_data)

                    with open(cache_file, "w", encoding="utf-8") as f:
                        json.dump(files_data, f, indent=2, ensure_ascii=False)

                    logger.debug(f"Cache criado: {cache_file}")

            if not files:
                logger.debug(
                    "Nenhum arquivo encontrado na biblioteca/pasta especificada"
                )
                return []

            # Formatar resultados para retorno
            formatted_files = []
            for file in files:
                file_info = {
                    "id": file.id,
                    "name": file.name,
                    "size": file.size,
                    "size_formatted": self._format_file_size(file.size),
                    "full_path": file.full_path,
                    "web_url": file.web_url,
                    "mime_type": file.mime_type,
                    "created_datetime": file.created_datetime,
                    "last_modified_datetime": file.last_modified_datetime,
                    "is_supported": file.is_supported_file(),
                    "etag": file.etag,
                }
                formatted_files.append(file_info)

            logger.debug(f"Retornando {len(files)} arquivos de {library}/{folder_path}")
            return formatted_files

        except Exception as e:
            logger.error(f"Erro ao listar arquivos do SharePoint: {str(e)}")
            raise

    async def list_folders(
        self, library: Optional[str] = None, folder_path: str = ""
    ) -> List[Dict[str, Any]]:
        """Listar apenas pastas de uma biblioteca"""
        try:
            logger.debug(
                f"Listando pastas da biblioteca: {library}, pasta: {folder_path}"
            )

            folders = await self.sharepoint_service.list_folders(library, folder_path)

            # Formatar resultados
            formatted_folders = []
            for folder in folders:
                folder_info = {
                    "id": folder.id,
                    "name": folder.name,
                    "full_path": folder.full_path,
                    "web_url": folder.web_url,
                    "created_datetime": folder.created_datetime,
                    "last_modified_datetime": folder.last_modified_datetime,
                    "child_count": folder.child_count,
                }
                formatted_folders.append(folder_info)

            logger.debug(f"Encontradas {len(folders)} pastas")
            return formatted_folders

        except Exception as e:
            logger.error(f"Erro ao listar pastas: {str(e)}")
            raise

    async def get_file_details(self, file_id: str) -> Dict[str, Any]:
        """Obter detalhes de um arquivo especÃ­fico"""
        try:
            logger.debug(f"Obtendo detalhes do arquivo: {file_id}")

            file = await self.sharepoint_service.get_file_by_id(file_id)

            if not file:
                logger.warning(f"Arquivo {file_id} nÃ£o encontrado")
                return None  # type: ignore

            # Calcular hash do arquivo para controle de integridade
            try:
                file_hash = await self.sharepoint_service.get_file_hash(file)
            except Exception as e:
                logger.warning(
                    f"Erro ao calcular hash do arquivo {file.name}: {str(e)}"
                )
                file_hash = None

            file_details = {
                "id": file.id,
                "name": file.name,
                "size": file.size,
                "size_formatted": self._format_file_size(file.size),
                "full_path": file.full_path,
                "web_url": file.web_url,
                "download_url": file.download_url,
                "mime_type": file.mime_type,
                "created_datetime": file.created_datetime,
                "last_modified_datetime": file.last_modified_datetime,
                "is_supported": file.is_supported_file(),
                "etag": file.etag,
                "file_hash": file_hash,
            }

            logger.debug(f"Detalhes obtidos para o arquivo: {file.name}")
            return file_details

        except Exception as e:
            logger.error(f"Erro ao obter detalhes do arquivo {file_id}: {str(e)}")
            raise

    async def download_file_content(self, file_id: str) -> bytes:
        """Baixar conteÃºdo de um arquivo especÃ­fico"""
        try:
            logger.debug(f"Iniciando download do arquivo: {file_id}")

            # Primeiro obter informaÃ§Ãµes do arquivo
            file = await self.sharepoint_service.get_file_by_id(file_id)

            if not file:
                raise ValueError(f"Arquivo {file_id} nÃ£o encontrado")

            # Baixar conteÃºdo
            content = await self.sharepoint_service.download_file_content(file)

            logger.debug(f"Download concluÃ­do: {file.name} ({len(content)} bytes)")
            return content

        except Exception as e:
            logger.error(f"Erro ao baixar arquivo {file_id}: {str(e)}")
            raise

    async def search_files_by_name(
        self, search_term: str, library: Optional[str] = None, folder_path: str = ""
    ) -> List[Dict[str, Any]]:
        """Buscar arquivos por nome"""
        try:
            logger.debug(
                f"Buscando arquivos com termo: '{search_term}' em {library}/{folder_path}"
            )

            # Buscar arquivos
            matching_files = await self.sharepoint_service.search_files_by_name(
                search_term, library, folder_path
            )

            # Formatar resultados
            formatted_results = []
            for file in matching_files:
                file_info = {
                    "id": file.id,
                    "name": file.name,
                    "size": file.size,
                    "size_formatted": self._format_file_size(file.size),
                    "full_path": file.full_path,
                    "web_url": file.web_url,
                    "mime_type": file.mime_type,
                    "created_datetime": file.created_datetime,
                    "last_modified_datetime": file.last_modified_datetime,
                    "is_supported": file.is_supported_file(),
                }
                formatted_results.append(file_info)

            logger.debug(f"Encontrados {len(matching_files)} arquivos correspondentes")
            return formatted_results

        except Exception as e:
            logger.error(f"Erro na busca de arquivos: {str(e)}")
            raise

    async def process_sharepoint_files(
        self, batch_size: int = 10
    ) -> List[Dict[str, Any]]:
        """Processar arquivos do SharePoint em lotes"""
        try:
            # Listar arquivos do SharePoint
            cache_dir = "temp/cache/sharepoint/"
            cache_file = os.path.join(
                cache_dir,
                "files_cache_default_General_ServiÃ§o Atendimento UsuÃ¡rio OperaÃ§Ã£o Infraestrutura_Base de Conhecimento.json",
            )

            # Ler e exibir o conteÃºdo do arquivo JSON
            with open(cache_file, "r", encoding="utf-8") as f:
                json_content = f.read()

            # Converter JSON string para objeto Python
            json_data = json.loads(json_content)

            # Converter para lista se nÃ£o for
            if isinstance(json_data, list):
                lista = json_data
            else:
                lista = [json_data]

            if not lista:
                logger.warning("Nenhum arquivo encontrado no cache")
                return []

            # Logar o nÃºmero de itens selecionados e configuraÃ§Ã£o de lote
            logger.debug(f"Processando {len(lista)} arquivos em lotes de {batch_size}")

            results = []

            # Dividir a lista em lotes
            for batch_index in range(0, len(lista), batch_size):
                batch = lista[batch_index : batch_index + batch_size]
                batch_number = (batch_index // batch_size) + 1
                total_batches = (len(lista) + batch_size - 1) // batch_size

                logger.debug(
                    f"Processando lote {batch_number}/{total_batches} com {len(batch)} arquivos"
                )

                # Processar arquivos do lote atual
                batch_results = await self._process_batch(
                    batch, batch_index, batch_size
                )
                results.extend(batch_results)

                # Log de progresso do lote
                successful_in_batch = sum(
                    1 for r in batch_results if r.get("status") == "success"
                )
                failed_in_batch = len(batch_results) - successful_in_batch
                logger.debug(
                    f"Lote {batch_number}/{total_batches} concluÃ­do: {successful_in_batch} sucessos, {failed_in_batch} erros"
                )

            # EstatÃ­sticas finais
            total_successful = sum(1 for r in results if r.get("status") == "success")
            total_failed = len(results) - total_successful
            logger.debug(
                f"Processamento concluÃ­do: {total_successful} sucessos, {total_failed} erros de {len(results)} arquivos processados"
            )

            return results

        except Exception as e:
            logger.error(f"Erro no processamento de arquivos: {str(e)}")
            raise

    async def _process_batch(
        self, batch: List[Dict[str, Any]], batch_start_index: int, batch_size: int
    ) -> List[Dict[str, Any]]:
        """Processar um lote de arquivos"""
        batch_results = []

        # Iterar sobre todos os arquivos do lote atual
        for i, file_data in enumerate(batch):
            file_index = batch_start_index + i + 1
            try:
                logger.debug(
                    f"Processando arquivo {file_index}: {file_data.get('name', 'Desconhecido')}"
                )

                # Verificar se o arquivo jÃ¡ foi processado (existe no embedding service)
                existing_embeddings = await self.embedding_service.search_by_metadata(
                    namespace="sharepoint", metadata_filter={"file_id": file_data["id"]}
                )

                if existing_embeddings:
                    logger.debug(
                        f"Arquivo {file_data.get('name', 'Desconhecido')} jÃ¡ foi processado anteriormente. Pulando..."
                    )
                    batch_results.append(
                        {
                            "file_info": {
                                "id": file_data.get("id"),
                                "name": file_data.get("name", "Desconhecido"),
                            },
                            "processed_content": "Arquivo jÃ¡ processado anteriormente",
                            "status": "skipped",
                        }
                    )
                    continue
                # Obter informaÃ§Ãµes do arquivo primeiro
                file_obj = await self.sharepoint_service.get_file_by_id(file_data["id"])
                if not file_obj:
                    logger.error(f"Arquivo {file_data['id']} nÃ£o encontrado")
                    batch_results.append(
                        {
                            "file_info": {
                                "id": file_data.get("id"),
                                "name": file_data.get("name", "Desconhecido"),
                                "error_at": datetime.now().isoformat(),
                            },
                            "processed_content": None,
                            "status": "error",
                            "error_message": "Arquivo nÃ£o encontrado no SharePoint",
                        }
                    )
                    continue

                # Baixar conteÃºdo do arquivo
                file_content = await self.sharepoint_service.download_file_content(
                    file_obj
                )

                # Verificar se Ã© BytesIO e converter para bytes se necessÃ¡rio
                if hasattr(file_content, "read"):
                    file_bytes = file_content.read()
                    if hasattr(file_content, "seek"):
                        file_content.seek(0)  # Reset position if needed
                else:
                    file_bytes = file_content

                # Processar com docling - passar o nome do arquivo para identificar a extensÃ£o
                # Obter extensÃ£o do arquivo original
                file_ext = (
                    os.path.splitext(file_obj.name)[1] if file_obj.name else ".tmp"
                )

                # Criar arquivo temporÃ¡rio com extensÃ£o correta
                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=file_ext
                ) as temp_file:
                    temp_file.write(file_bytes)
                    temp_path = temp_file.name

                try:
                    docling = await self.docling_processor.process_document(temp_path)

                    # Criar embedding do texto
                    await self.embedding_service.create_embeddings_from_chunks(
                        namespace="sharepoint",
                        content=docling.get("content"),
                        metadata={
                            "file_id": file_obj.id,
                            "file_name": file_obj.name,
                            "processed_at": datetime.now().isoformat(),
                        },
                    )

                    # Retornar estrutura compatÃ­vel com a API
                    result = {
                        "file_info": {
                            "id": file_obj.id,
                            "name": file_obj.name,
                            "batch_info": f"batch_{(batch_start_index // batch_size) + 1}",
                        },
                        "processed_content": docling.get(
                            "content", "ConteÃºdo processado"
                        ),
                        "status": "success",
                    }

                    batch_results.append(result)
                    logger.debug(f"Arquivo {file_obj.name} processado com sucesso")

                finally:
                    # Limpar arquivo temporÃ¡rio
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)

            except Exception as file_error:
                logger.error(
                    f"Erro ao processar arquivo {file_data.get('name', 'Desconhecido')}: {str(file_error)}"
                )
                # Adicionar resultado de erro para este arquivo
                batch_results.append(
                    {
                        "file_info": {
                            "id": file_data.get("id"),
                            "name": file_data.get("name", "Desconhecido"),
                            "error_at": datetime.now().isoformat(),
                            "batch_info": f"batch_{(batch_start_index // batch_size) + 1}",
                        },
                        "processed_content": None,
                        "status": "error",
                        "error_message": str(file_error),
                    }
                )
                # Continuar processando os prÃ³ximos arquivos
                continue

        return batch_results

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


def create_sync_service(db_session=None) -> SyncService:
    """Factory function para criar instÃ¢ncia do SyncService"""
    sharepoint_service = SharePointService(db_session=db_session)
    docling_processor = DoclingProcessor()
    embedding_service = (
        EmbeddingService(db_session) if db_session else EmbeddingService()
    )
    return SyncService(
        sharepoint_service=sharepoint_service,
        docling_processor=docling_processor,
        embedding_service=embedding_service,
    )
