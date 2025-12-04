# src/utils/docling.py

import asyncio
import json
import logging
import os
import subprocess
import sys
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional

import psutil
from docling.document_converter import DocumentConverter
from fastapi import UploadFile

from .excel_processor_hybrid import HybridExcelProcessor
from .pdf_processor_hybrid import HybridPDFProcessor
from .ocr_singleton import ocr_singleton

# Suprimir warnings especÃ­ficos do PyTorch e Docling
warnings.filterwarnings(
    "ignore", message=".*pin_memory.*argument is set as true but not supported on MPS.*"
)
warnings.filterwarnings(
    "ignore", category=UserWarning, module="torch.utils.data.dataloader"
)
warnings.filterwarnings(
    "ignore", message=".*Parameter.*strict_text.*has been deprecated.*"
)
warnings.filterwarnings(
    "ignore", category=UserWarning, module="docling_core.types.doc.document"
)

logger = logging.getLogger(__name__)


class DoclingProcessor:
    """
    ServiÃ§o otimizado para converter arquivos.

    Melhorias:
    - Controle de tamanho de resposta
    - PrevenÃ§Ã£o de travamento do navegador
    - Processamento eficiente de memÃ³ria
    - Timeouts apropriados
    """

    # ExtensÃµes de arquivo permitidas pelo Docling
    DOCLING_EXTENSIONS = {
        ".pdf",
        ".docx",
        ".txt",
        ".md",
        ".html",
        ".htm",
        ".pptx",
        ".xlsx",
        # Imagens
        ".jpg",
        ".jpeg",
        ".png",
        ".tiff",
        ".tif",
        ".gif",
        ".bmp",
        ".webp",
    }

    # ExtensÃµes adiciais que podem ser processadas com outras ferramentas
    FALLBACK_EXTENSIONS = {".doc"}

    # Todas as extensÃµes suportadas
    ALLOWED_EXTENSIONS = DOCLING_EXTENSIONS | FALLBACK_EXTENSIONS

    # Limites de seguranÃ§a
    MAX_TEXT_LENGTH = 9_000_000  # 9MB de texto (mais agressivo)
    MAX_JSON_SIZE = 1_500_000  # 1.5MB de JSON (mais agressivo)
    MAX_PROCESSING_TIME = 8 * 60  # 8 minutos (aumentado de 4 minutos)
    MAX_FILE_SIZE = 40_728_640  # 40MB (mais agressivo)

    def __init__(self):
        self.logger = logger
        self.converter = self._create_optimized_converter()
        self.hybrid_pdf_processor = HybridPDFProcessor()
        self.hybrid_excel_processor = HybridExcelProcessor()
        self.use_hybrid_pdf = True  # Flag para ativar processamento hÃ­brido PDF
        self.use_hybrid_excel = True  # Flag para ativar processamento hÃ­brido Excel
        
        # PrÃ©-inicializar OCR em background para evitar delay na primeira requisiÃ§Ã£o
        import threading
        threading.Thread(target=self._warmup_ocr, daemon=True).start()
        
        self.logger.debug(
            "Conversor inicializado com limites de seguranca + Processadores HÃ­bridos (PDF + Excel)"
        )

    def _create_optimized_converter(self) -> DocumentConverter:
        """Cria conversor padrÃ£o com cache persistente"""
        try:
            self.logger.info("Usando conversor padrÃ£o")
            # Configurar caches persistentes para modelos
            import os
            from pathlib import Path
            
            # Cache EasyOCR - usar diretÃ³rio fixo do container
            easyocr_cache = Path("/app/.EasyOCR")
            easyocr_cache.mkdir(parents=True, exist_ok=True)
            
            # Cache Transformers/Hugging Face - usar diretÃ³rio fixo do container
            cache_base = Path("/app/.cache")
            transformers_cache = cache_base / "transformers"
            transformers_cache.mkdir(parents=True, exist_ok=True)
            
            hf_cache = cache_base / "huggingface"
            hf_cache.mkdir(parents=True, exist_ok=True)
            
            # Configurar variÃ¡veis de ambiente
            os.environ["EASYOCR_MODULE_PATH"] = str(easyocr_cache)
            os.environ["TRANSFORMERS_CACHE"] = str(transformers_cache)
            os.environ["HF_HOME"] = str(hf_cache)
            
            self.logger.info(f"Cache configurado - EasyOCR: {easyocr_cache}, Transformers: {transformers_cache}")
            
            return DocumentConverter()
        except Exception as e:
            self.logger.warning(f"Erro ao criar conversor: {e} - usando padrÃ£o")
            return DocumentConverter()

    def _warmup_ocr(self):
        """PrÃ©-aquece o OCR em background"""
        try:
            self.logger.info("Iniciando warmup do OCR em background...")
            # ForÃ§a inicializaÃ§Ã£o do singleton
            ocr_singleton.get_reader()
            self.logger.info("Warmup do OCR concluÃ­do")
        except Exception as e:
            self.logger.warning(f"Erro no warmup do OCR: {e}")

    def is_allowed_file(self, upload_file: UploadFile) -> bool:
        """Verifica se o arquivo tem extensÃ£o permitida"""
        if not upload_file.filename:
            return False
        ext = os.path.splitext(upload_file.filename)[1].lower()
        return ext in self.ALLOWED_EXTENSIONS

    def is_allowed_file_path(self, file_path: str) -> bool:
        """Verifica se o caminho do arquivo tem extensÃ£o permitida"""
        ext = Path(file_path).suffix.lower()
        return ext in self.ALLOWED_EXTENSIONS

    def _get_memory_usage(self) -> int:
        """Retorna uso de memÃ³ria atual em bytes"""
        try:
            process = psutil.Process(os.getpid())
            return process.memory_info().rss
        except (ImportError, Exception):
            return sys.getsizeof({})

    def _check_memory_limit(self) -> bool:
        """Verifica se o uso de memÃ³ria estÃ¡ dentro do limite"""
        try:
            memory_usage = self._get_memory_usage()
            # Limite de 5GB de memÃ³ria - ajustado para pod com recursos adequados
            memory_limit = 5_368_709_120  # 5GB em bytes

            if memory_usage > memory_limit * 0.9:  # 90% do limite
                self.logger.warning(
                    f"Alto uso de memÃ³ria: {memory_usage / 1024 / 1024:.2f}MB"
                )
                return False
            return True
        except Exception as e:
            self.logger.error(f"Erro ao verificar memÃ³ria: {e}")
            return True

    def _truncate_text(
        self, text: str, max_length: Optional[int] = None, force_truncate: bool = True
    ) -> str:
        """Trunca texto se exceder o limite"""
        if not force_truncate:
            return text

        if max_length is None:
            max_length = self.MAX_TEXT_LENGTH

        if len(text) <= max_length:
            return text

        self.logger.warning(
            f"Texto truncado de {len(text)} para {max_length} caracteres"
        )
        return text[:max_length] + "\n\n[TEXTO TRUNCADO - CONTEUDO MUITO GRANDE]"

    def _optimize_json_data(self, data: dict) -> dict:
        """Otimiza dados JSON para evitar travamento do navegador"""

        def truncate_dict(obj, max_depth=10, current_depth=0):
            if current_depth >= max_depth:
                return "[DADOS TRUNCADOS - ESTRUTURA MUITO PROFUNDA]"

            if isinstance(obj, dict):
                result = {}
                for key, value in obj.items():
                    if isinstance(value, str) and len(value) > 50000:
                        result[key] = value[:50000] + "... [TRUNCADO]"
                    if isinstance(value, (dict, list)):
                        result[key] = truncate_dict(value, max_depth, current_depth + 1)
                    else:
                        result[key] = value
                return result
            if isinstance(obj, list):
                if len(obj) > 100:  # Limita arrays grandes
                    return obj[:100] + ["... [LISTA TRUNCADA]"]
                return [
                    truncate_dict(item, max_depth, current_depth + 1) for item in obj
                ]
            else:
                return obj

        optimized = truncate_dict(data)

        # Verifica tamanho final
        json_str = json.dumps(optimized, ensure_ascii=False)
        if len(json_str) > self.MAX_JSON_SIZE:
            self.logger.warning(
                f"JSON muito grande ({len(json_str)} bytes), aplicando truncamento adicional"
            )
            # EstratÃ©gia mais agressiva se ainda estiver grande
            if "pages" in optimized:
                optimized["pages"] = (
                    optimized["pages"][:5] + ["... [PAGINAS TRUNCADAS]"]
                    if len(optimized["pages"]) > 5
                    else optimized["pages"]
                )

        return optimized

    def _extract_text_from_doc(self, file_path: str) -> str:
        """Extrai texto de arquivo .doc usando mÃ©todos alternativos"""
        try:
            # Tentar usar olefile para extrair texto de arquivos .doc
            try:
                import olefile

                if olefile.isOleFile(file_path):
                    with olefile.OleFileIO(file_path) as ole:
                        # Tentar extrair texto do stream WordDocument
                        if ole.exists("WordDocument"):
                            # Este Ã© um mÃ©todo bÃ¡sico - arquivos .doc sÃ£o complexos
                            # Mas pelo menos evita ler dados binÃ¡rios como texto
                            self.logger.debug(
                                "Arquivo .doc detectado como OLE, mas extraÃ§Ã£o completa nÃ£o implementada"
                            )
                            raise ValueError(
                                "Arquivo .doc requer processamento especializado"
                            )
            except ImportError:
                pass
            except Exception as e:
                self.logger.debug(f"olefile falhou: {e}")

            # Tentar usar antiword se disponÃ­vel
            try:
                result = subprocess.run(
                    ["antiword", file_path],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    check=False,
                )
                if result.returncode == 0 and result.stdout:
                    self.logger.debug(
                        f"Texto extraÃ­do com antiword: {len(result.stdout)} caracteres"
                    )
                    return result.stdout
            except (
                subprocess.TimeoutExpired,
                FileNotFoundError,
                subprocess.CalledProcessError,
            ) as e:
                self.logger.debug(f"antiword nÃ£o disponÃ­vel ou falhou: {e}")

            # Tentar usar textract se disponÃ­vel
            try:
                import textract

                text = textract.process(file_path).decode("utf-8")
                if text and text.strip():
                    self.logger.debug(
                        f"Texto extraÃ­do com textract: {len(text)} caracteres"
                    )
                    return text
            except ImportError:
                pass
            except Exception as e:
                self.logger.debug(f"textract falhou: {e}")

            # Tentar usar docx2txt como Ãºltimo recurso (pode funcionar para alguns .doc)
            try:
                import docx2txt

                text = docx2txt.process(file_path)
                if text and text.strip():
                    self.logger.debug(
                        f"Texto extraÃ­do com docx2txt: {len(text)} caracteres"
                    )
                    return text
            except ImportError:
                pass
            except Exception as e:
                self.logger.debug(f"docx2txt falhou: {e}")

            # Se nenhum mÃ©todo funcionou, retornar erro especÃ­fico
            raise ValueError(
                f"NÃ£o foi possÃ­vel extrair texto do arquivo .doc: {file_path}. "
                "Arquivo .doc requer ferramentas especializadas como 'antiword' ou 'textract'. "
                "Considere converter o arquivo para .docx primeiro."
            )

        except Exception as e:
            self.logger.error(f"Erro ao processar arquivo .doc {file_path}: {e}")
            raise

    def _is_doc_file(self, file_path: str) -> bool:
        """Verifica se o arquivo Ã© um .doc"""
        return Path(file_path).suffix.lower() == ".doc"

    def _is_pdf_file(self, file_path: str) -> bool:
        """Verifica se o arquivo Ã© um PDF"""
        return Path(file_path).suffix.lower() == ".pdf"

    async def _should_use_hybrid_pdf(self, file_path: str) -> bool:
        """Decide se deve usar processamento hÃ­brido para PDF"""
        if not self.use_hybrid_pdf or not self._is_pdf_file(file_path):
            return False

        # Sempre usar hÃ­brido para PDFs - Ã© mais eficiente
        return True

    def _is_excel_file(self, file_path: str) -> bool:
        """Verifica se o arquivo Ã© um Excel"""
        return Path(file_path).suffix.lower() in [".xlsx", ".xls"]

    async def _should_use_hybrid_excel(self, file_path: str) -> bool:
        """Decide se deve usar processamento hÃ­brido para Excel"""
        if not self.use_hybrid_excel or not self._is_excel_file(file_path):
            return False

        # Sempre usar hÃ­brido para Excel - Ã© mais eficiente
        return True

    async def _process_doc_file(
        self, file_path: str, output_format: str = "txt"
    ) -> Dict[str, Any]:
        """Processa arquivo .doc usando mÃ©todos alternativos"""
        try:
            # Extrair texto do arquivo .doc
            text_content = self._extract_text_from_doc(file_path)

            # Aplicar truncamento
            text_content = self._truncate_text(text_content)

            processed_data = {
                "file_debug": {
                    "original_filename": Path(file_path).name,
                    "file_size": Path(file_path).stat().st_size,
                    "file_extension": Path(file_path).suffix.lower(),
                    "processor_used": "fallback_doc_processor",
                }
            }

            if output_format == "full":
                processed_data.update(
                    {
                        "text_content": text_content,
                        "markdown_content": text_content,  # Para .doc, texto simples Ã© o melhor que temos
                        "metadata": {
                            "extraction_method": "fallback_doc_processor",
                            "formatting_preserved": False,
                        },
                        "structure": {
                            "page_count": None,
                            "text_length": len(text_content),
                            "truncated": len(text_content) > self.MAX_TEXT_LENGTH,
                        },
                    }
                )
            elif output_format == "json":
                processed_data["content"] = {
                    "text": text_content,
                    "extraction_method": "fallback_doc_processor",
                }
            elif output_format == "markdown":
                processed_data["content"] = text_content
            elif output_format == "html":
                # Converter texto simples para HTML bÃ¡sico
                html_content = text_content.replace("\n", "<br>\n")
                processed_data["content"] = (
                    f"<html><body><pre>{html_content}</pre></body></html>"
                )
            elif output_format == "txt":
                processed_data["content"] = text_content
            else:
                raise ValueError(f"Formato de saida nao suportado: {output_format}")

            return processed_data

        except Exception as e:
            self.logger.error(f"Erro ao processar arquivo .doc {file_path}: {e}")
            raise

    async def _process_pdf_hybrid(
        self, file_path: str, output_format: str = "txt"
    ) -> Dict[str, Any]:
        """Processa PDF usando sistema hÃ­brido otimizado"""
        try:
            self.logger.info(
                f"Iniciando processamento PDF hÃ­brido: {Path(file_path).name}"
            )

            # Usar processador hÃ­brido
            result = await self.hybrid_pdf_processor.process_pdf(
                file_path, use_cache=True
            )

            content = result["content"]
            processing_info = result["processing_info"]

            # Aplicar truncamento se necessÃ¡rio
            content = self._truncate_text(content)

            processed_data = {
                "file_debug": {
                    "original_filename": Path(file_path).name,
                    "file_size": Path(file_path).stat().st_size,
                    "file_extension": Path(file_path).suffix.lower(),
                    "processor_used": "hybrid_pdf_processor",
                    "strategy_used": processing_info["strategy"],
                    "from_cache": processing_info.get("from_cache", False),
                    "processing_time": processing_info.get("processing_time", 0),
                }
            }

            if output_format == "full":
                processed_data.update(
                    {
                        "text_content": content,
                        "markdown_content": content,  # Para hÃ­brido, conteÃºdo jÃ¡ estÃ¡ bem formatado
                        "metadata": {
                            "extraction_method": f"hybrid_pdf_{processing_info['strategy']}",
                            "complexity": processing_info.get("complexity", {}),
                            "processing_time": processing_info.get(
                                "processing_time", 0
                            ),
                            "from_cache": processing_info.get("from_cache", False),
                        },
                        "structure": {
                            "page_count": processing_info.get("complexity", {}).get(
                                "page_count"
                            ),
                            "text_length": len(content),
                            "truncated": len(content) >= self.MAX_TEXT_LENGTH,
                            "file_size_mb": processing_info.get("complexity", {}).get(
                                "file_size_mb"
                            ),
                            "has_images": processing_info.get("complexity", {}).get(
                                "has_images"
                            ),
                            "has_tables": processing_info.get("complexity", {}).get(
                                "has_tables"
                            ),
                        },
                    }
                )
            elif output_format == "json":
                # Para JSON, criar estrutura compatÃ­vel
                processed_data["content"] = {
                    "text": content,
                    "extraction_method": f"hybrid_pdf_{processing_info['strategy']}",
                    "processing_info": processing_info,
                    "metadata": processing_info.get("complexity", {}),
                }
            elif output_format in ["markdown", "html", "txt"]:
                processed_data["content"] = content
            else:
                raise ValueError(f"Formato de saida nao suportado: {output_format}")

            self.logger.info(
                f"PDF hÃ­brido processado com sucesso: {processing_info['strategy']} "
                f"em {processing_info.get('processing_time', 0):.2f}s "
                f"(cache: {processing_info.get('from_cache', False)})"
            )

            return processed_data

        except Exception as e:
            self.logger.error(f"Erro ao processar PDF hÃ­brido {file_path}: {e}")
            raise

    async def _process_excel_hybrid(
        self, file_path: str, output_format: str = "txt"
    ) -> Dict[str, Any]:
        """Processa Excel usando sistema hÃ­brido otimizado"""
        try:
            self.logger.info(
                f"Iniciando processamento Excel hÃ­brido: {Path(file_path).name}"
            )

            # Usar processador hÃ­brido Excel
            result = await self.hybrid_excel_processor.process_excel(
                file_path, use_cache=True
            )

            content = result["content"]
            processing_info = result["processing_info"]

            # Aplicar truncamento se necessÃ¡rio
            content = self._truncate_text(content)

            processed_data = {
                "file_debug": {
                    "original_filename": Path(file_path).name,
                    "file_size": Path(file_path).stat().st_size,
                    "file_extension": Path(file_path).suffix.lower(),
                    "processor_used": "hybrid_excel_processor",
                    "strategy_used": processing_info["strategy"],
                    "from_cache": processing_info.get("from_cache", False),
                    "processing_time": processing_info.get("processing_time", 0),
                }
            }

            if output_format == "full":
                processed_data.update(
                    {
                        "text_content": content,
                        "markdown_content": content,  # Para hÃ­brido, conteÃºdo jÃ¡ estÃ¡ bem formatado
                        "metadata": {
                            "extraction_method": f"hybrid_excel_{processing_info['strategy']}",
                            "complexity": processing_info.get("complexity", {}),
                            "processing_time": processing_info.get(
                                "processing_time", 0
                            ),
                            "from_cache": processing_info.get("from_cache", False),
                        },
                        "structure": {
                            "sheet_count": processing_info.get("complexity", {}).get(
                                "sheet_count"
                            ),
                            "total_rows": processing_info.get("complexity", {}).get(
                                "total_rows"
                            ),
                            "max_columns": processing_info.get("complexity", {}).get(
                                "max_columns"
                            ),
                            "text_length": len(content),
                            "truncated": len(content) >= self.MAX_TEXT_LENGTH,
                            "file_size_mb": processing_info.get("complexity", {}).get(
                                "file_size_mb"
                            ),
                            "has_formulas": processing_info.get("complexity", {}).get(
                                "has_formulas"
                            ),
                            "sheet_names": processing_info.get("complexity", {}).get(
                                "sheet_names", []
                            ),
                        },
                    }
                )
            elif output_format == "json":
                # Para JSON, criar estrutura compatÃ­vel
                processed_data["content"] = {
                    "text": content,
                    "extraction_method": f"hybrid_excel_{processing_info['strategy']}",
                    "processing_info": processing_info,
                    "metadata": processing_info.get("complexity", {}),
                }
            elif output_format in ["markdown", "html", "txt"]:
                processed_data["content"] = content
            else:
                raise ValueError(f"Formato de saida nao suportado: {output_format}")

            self.logger.info(
                f"Excel hÃ­brido processado com sucesso: {processing_info['strategy']} "
                f"em {processing_info.get('processing_time', 0):.2f}s "
                f"({processing_info.get('complexity', {}).get('sheet_count', 0)} abas) "
                f"(cache: {processing_info.get('from_cache', False)})"
            )

            return processed_data

        except Exception as e:
            self.logger.error(f"Erro ao processar Excel hÃ­brido {file_path}: {e}")
            raise

    async def save_upload_file(self, upload_file: UploadFile) -> str:
        """Salva arquivo de upload temporariamente"""
        if not self.is_allowed_file(upload_file):
            raise ValueError(f"Arquivo nao suportado: {upload_file.filename}")

        # Criar diretÃ³rio temporÃ¡rio
        # Usar /tmp se disponÃ­vel, senÃ£o diretÃ³rio do projeto
        if Path("/tmp").exists():
            temp_dir = Path("/tmp") / "inovaia_uploads"
            self.logger.debug(f"Usando diretÃ³rio temporÃ¡rio: {temp_dir}")
        else:
            # Em ambiente local, usar diretÃ³rio do projeto
            project_root = Path(__file__).parent.parent.parent
            temp_dir = project_root / "temp" / "uploads"
            self.logger.debug(f"Usando diretÃ³rio temporÃ¡rio local: {temp_dir}")

        temp_dir.mkdir(parents=True, exist_ok=True)

        # Usar timestamp para evitar conflitos de nome
        import time

        timestamp = str(int(time.time() * 1000))
        safe_filename = f"{timestamp}_{upload_file.filename}"
        destination = temp_dir / safe_filename

        self.logger.debug(f"Salvando arquivo {upload_file.filename} em {destination}")

        try:
            # Ler conteÃºdo do arquivo
            content = await upload_file.read()

            # Verificar se o conteÃºdo nÃ£o estÃ¡ vazio
            if not content:
                self.logger.error(
                    f"Arquivo {upload_file.filename} estÃ¡ vazio (0 bytes)"
                )
                raise ValueError(f"Arquivo {upload_file.filename} estÃ¡ vazio")

            self.logger.debug(
                f"ConteÃºdo lido: {len(content)} bytes para {upload_file.filename}"
            )

            # Salvar arquivo
            with open(destination, "wb") as buffer:
                buffer.write(content)

            # Verificar se o arquivo foi salvo corretamente
            if not destination.exists():
                self.logger.error(f"Arquivo nÃ£o foi criado: {destination}")
                raise RuntimeError(f"Falha ao criar arquivo: {destination}")

            # Verificar tamanho do arquivo salvo
            saved_size = destination.stat().st_size
            if saved_size == 0:
                self.logger.error(f"Arquivo salvo estÃ¡ vazio: {destination} (0 bytes)")
                raise RuntimeError(f"Arquivo salvo estÃ¡ vazio: {destination}")

            self.logger.debug(
                f"Arquivo salvo com sucesso: {destination} ({saved_size} bytes)"
            )

            # Verificar se o tamanho corresponde ao conteÃºdo original
            if saved_size != len(content):
                self.logger.warning(
                    f"Tamanho do arquivo salvo ({saved_size}) nÃ£o corresponde ao conteÃºdo original ({len(content)})"
                )

            return str(destination)
        except Exception as e:
            self.logger.error(f"Erro ao salvar arquivo: {e}")
            # Tentar limpar arquivo parcial se existir
            if destination.exists():
                try:
                    destination.unlink()
                except Exception as cleanup_error:
                    self.logger.warning(
                        f"Erro ao limpar arquivo parcial: {cleanup_error}"
                    )
            raise

    async def _convert_with_timeout(
        self, file_path: str, timeout: Optional[int] = None
    ) -> Any:
        """Converte arquivo com timeout e verificaÃ§Ã£o de memÃ³ria"""
        if timeout is None:
            timeout = self.MAX_PROCESSING_TIME

        # Verificar memÃ³ria antes do processamento
        if not self._check_memory_limit():
            raise RuntimeError("Uso de memÃ³ria muito alto, rejeitando processamento")

        # Verificar tamanho do arquivo
        file_size = os.path.getsize(file_path)
        if file_size > self.MAX_FILE_SIZE:
            raise ValueError(
                f"Arquivo muito grande: {file_size / 1024 / 1024:.2f}MB (mÃ¡x: {self.MAX_FILE_SIZE / 1024 / 1024:.2f}MB)"
            )

        try:
            loop = asyncio.get_event_loop()
            result = await asyncio.wait_for(
                loop.run_in_executor(None, self._safe_convert, file_path),
                timeout=timeout,
            )
            return result
        except asyncio.TimeoutError as exc:
            raise TimeoutError(f"Processamento excedeu {timeout} segundos") from exc

    def _estimate_pdf_pages(self, file_path: str) -> int:
        """Estima nÃºmero de pÃ¡ginas do PDF rapidamente"""
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(file_path)
            page_count = len(doc)
            doc.close()
            return page_count
        except ImportError:
            # Fallback: estimar por tamanho do arquivo
            file_size = os.path.getsize(file_path)
            # Estimativa grosseira: ~50KB por pÃ¡gina
            estimated_pages = max(1, file_size // 51200)
            self.logger.debug(f"Estimativa de pÃ¡ginas por tamanho: {estimated_pages}")
            return estimated_pages
        except Exception as e:
            self.logger.warning(f"Erro ao estimar pÃ¡ginas: {e}")
            return 1

    def _safe_convert(self, file_path: str) -> Any:
        """Converte arquivo de forma segura com try/catch"""
        try:
            # Log inicial
            self.logger.info(f"Iniciando conversÃ£o: {os.path.basename(file_path)}")

            return self.converter.convert(file_path)

        except Exception as e:
            error_msg = str(e)
            if "PdfiumError" in error_msg or "Data format error" in error_msg:
                self.logger.warning(
                    f"Docling nÃ£o conseguiu processar o PDF {file_path}: {e}"
                )
                raise ValueError(
                    "PDF nÃ£o pÃ´de ser processado pelo Docling. Tente converter o arquivo para outro formato ou use um PDF diferente."
                )

            self.logger.error(f"Erro na conversÃ£o do arquivo {file_path}: {e}")
            raise RuntimeError(f"Falha no processamento: {str(e)}") from e

    async def extract_full_content(self, file_path: str) -> str:
        """Extrai conteÃºdo completo sem truncamentos para armazenamento interno"""
        if not self.is_allowed_file_path(file_path):
            raise ValueError(f"Tipo de arquivo nÃ£o suportado: {file_path}")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo nÃ£o encontrado: {file_path}")

        # Verificar se Ã© arquivo .doc e usar processamento alternativo
        if self._is_doc_file(file_path):
            text_content = self._extract_text_from_doc(file_path)
            return text_content  # Sem truncamento

        # Usar Docling para outros formatos
        result = await self._convert_with_timeout(file_path)

        # Tentar diferentes mÃ©todos e retornar o mais completo
        markdown = result.document.export_to_markdown()
        text_content = result.document.export_to_text()

        # Retornar o que tiver mais conteÃºdo, sem truncamento
        if len(text_content) > len(markdown):
            return text_content

        return markdown

    async def convert_to_markdown(self, upload_file: UploadFile) -> str:
        """Converte arquivo para Markdown"""
        path = await self.save_upload_file(upload_file)
        try:
            result = await self._convert_with_timeout(path)
            markdown = result.document.export_to_markdown()

            # Aplica truncamento se necessÃ¡rio
            markdown = self._truncate_text(markdown)

            self.logger.debug(
                f"Arquivo convertido para Markdown: {len(markdown)} caracteres"
            )
            return markdown
        finally:
            if os.path.exists(path):
                os.unlink(path)

    async def convert_to_json(self, upload_file: UploadFile) -> dict:
        """Converte arquivo para JSON otimizado"""
        path = await self.save_upload_file(upload_file)
        try:
            result = await self._convert_with_timeout(path)
            json_data = result.document.export_to_dict()

            # Otimiza JSON para evitar travamento
            optimized_data = self._optimize_json_data(json_data)

            self.logger.debug("Arquivo convertido para JSON otimizado")
            return optimized_data
        finally:
            if os.path.exists(path):
                os.unlink(path)

    async def convert_to_html(self, upload_file: UploadFile) -> str:
        """Converte arquivo para HTML"""
        path = await self.save_upload_file(upload_file)
        try:
            result = await self._convert_with_timeout(path)
            html = result.document.export_to_html()

            # Aplica truncamento se necessÃ¡rio
            html = self._truncate_text(html)

            self.logger.debug(f"Arquivo convertido para HTML: {len(html)} caracteres")
            return html
        finally:
            if os.path.exists(path):
                os.unlink(path)

    async def convert_to_txt(self, upload_file: UploadFile) -> str:
        """Converte arquivo para texto simples"""
        path = await self.save_upload_file(upload_file)
        try:
            result = await self._convert_with_timeout(path)
            text = result.document.export_to_text()

            # Aplica truncamento se necessÃ¡rio
            text = self._truncate_text(text)

            self.logger.debug(f"Arquivo convertido para TXT: {len(text)} caracteres")
            return text
        finally:
            if os.path.exists(path):
                os.unlink(path)

    async def convert_from_bites(
        self, file_bytes: bytes, output_format: str = "txt"
    ) -> Dict[str, Any]:
        """Converte bytes de arquivo para o formato especificado"""
        if not file_bytes:
            raise ValueError("Nenhum dado de arquivo fornecido")

        # Criar diretÃ³rio temporÃ¡rio local do projeto
        project_root = Path(__file__).parent.parent.parent
        temp_dir = project_root / "temp" / "uploads"
        temp_dir.mkdir(parents=True, exist_ok=True)

        import time

        timestamp = str(int(time.time() * 1000))
        temp_path = temp_dir / f"{timestamp}_temp_file"

        with open(temp_path, "wb") as temp_file:
            temp_file.write(file_bytes)
        temp_path = str(temp_path)

        try:
            return await self.process_document(temp_path, output_format)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    async def process_document(
        self, file_path: str, output_format: str = "txt"
    ) -> Dict[str, Any]:
        """Processa documento com formato otimizado"""
        if not self.is_allowed_file_path(file_path):
            raise ValueError(f"Tipo de arquivo nao suportado: {file_path}")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo nao encontrado: {file_path}")

        # Verificar se Ã© arquivo .doc e usar processamento alternativo
        if self._is_doc_file(file_path):
            return await self._process_doc_file(file_path, output_format)

        # Verificar se Ã© PDF e deve usar processamento hÃ­brido
        if await self._should_use_hybrid_pdf(file_path):
            return await self._process_pdf_hybrid(file_path, output_format)

        # Verificar se Ã© Excel e deve usar processamento hÃ­brido
        if await self._should_use_hybrid_excel(file_path):
            return await self._process_excel_hybrid(file_path, output_format)

        # Usar Docling para outros formatos
        result = await self._convert_with_timeout(file_path)

        processed_data = {
            "file_debug": {
                "original_filename": Path(file_path).name,
                "file_size": Path(file_path).stat().st_size,
                "file_extension": Path(file_path).suffix.lower(),
            }
        }

        if output_format == "full":
            # VersÃ£o simplificada do full para evitar travamento
            text_content = result.document.export_to_text()
            processed_data.update(
                {
                    "text_content": self._truncate_text(text_content),
                    "markdown_content": self._truncate_text(
                        result.document.export_to_markdown()
                    ),
                    "metadata": self._extract_metadata(result.document),
                    "structure": {
                        "page_count": (
                            len(result.document.pages)
                            if hasattr(result.document, "pages")
                            else None
                        ),
                        "text_length": len(text_content),
                        "truncated": len(text_content) > self.MAX_TEXT_LENGTH,
                    },
                }
            )
        elif output_format == "json":
            json_data = result.document.export_to_dict()
            processed_data["content"] = self._optimize_json_data(json_data)
        elif output_format == "markdown":
            processed_data["content"] = self._truncate_text(
                result.document.export_to_markdown()
            )
        elif output_format == "html":
            processed_data["content"] = self._truncate_text(
                result.document.export_to_html()
            )
        elif output_format == "txt":
            processed_data["content"] = self._truncate_text(
                result.document.export_to_text()
            )
        else:
            raise ValueError(f"Formato de saida nao suportado: {output_format}")

        return processed_data

    def _extract_metadata(self, document) -> Dict[str, Any]:
        """Extrai metadados do documento de forma segura"""
        metadata = {}
        try:
            # Metadados bÃ¡sicos
            safe_attrs = ["title", "author", "creation_date", "modification_date"]
            for attr in safe_attrs:
                if hasattr(document, attr):
                    value = getattr(document, attr)
                    if value is not None:
                        metadata[attr] = str(value)[:1000]  # Limita tamanho

            # debugrmaÃ§Ãµes estruturais
            if hasattr(document, "pages"):
                metadata["page_count"] = len(document.pages)

        except (AttributeError, ValueError, TypeError) as e:
            self.logger.warning(f"Erro ao extrair metadados: {e}")
            metadata["extraction_error"] = str(e)

        return metadata

    async def process_upload_file_complete(
        self, upload_file: UploadFile, output_format: str = "txt"
    ) -> Dict[str, Any]:
        """Processa arquivo de upload completo com otimizaÃ§Ãµes"""
        temp_path = await self.save_upload_file(upload_file)
        try:
            # VerificaÃ§Ã£o adicional apÃ³s salvar o arquivo
            if not os.path.exists(temp_path):
                raise RuntimeError(f"Arquivo temporÃ¡rio nÃ£o foi criado: {temp_path}")

            file_size = os.path.getsize(temp_path)
            if file_size == 0:
                raise RuntimeError(f"Arquivo temporÃ¡rio estÃ¡ vazio: {temp_path}")

            self.logger.debug(
                f"Arquivo temporÃ¡rio criado: {temp_path} ({file_size} bytes)"
            )

            result = await self.process_document(temp_path, output_format)
            result["upload_debug"] = {
                "original_filename": upload_file.filename,
                "content_type": upload_file.content_type,
                "processing_format": output_format,
                "timestamp": str(asyncio.get_event_loop().time()),
                "temp_file_size": file_size,
                "temp_file_path": temp_path,
            }
            return result
        finally:
            if os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                    self.logger.debug(f"Arquivo temporÃ¡rio removido: {temp_path}")
                except Exception as cleanup_error:
                    self.logger.warning(
                        f"Erro ao remover arquivo temporÃ¡rio: {cleanup_error}"
                    )

    def html_para_markdown(self, html: str | None, truncate: bool = True) -> str:
        """
        Converte uma string HTML para Markdown mantendo a formataÃ§Ã£o original.

        Args:
            html (str | None): ConteÃºdo em HTML.

        Returns:
            str: ConteÃºdo convertido para Markdown.
        """
        if html is None:
            return ""

        if not isinstance(html, str):
            raise ValueError("O parÃ¢metro 'html' deve ser uma string ou None.")

        if not html.strip():
            return ""

        try:
            # Decodificar entidades HTML se necessÃ¡rio
            import html as html_module

            decoded_html = html_module.unescape(html)

            self.logger.debug(f"HTML input length: {len(html)}")
            self.logger.debug(f"Decoded HTML preview: {decoded_html[:20]}...")

            # Criar arquivo temporÃ¡rio com HTML decodificado
            project_root = Path(__file__).parent.parent.parent
            temp_dir = project_root / "temp" / "uploads"
            temp_dir.mkdir(parents=True, exist_ok=True)

            import time

            timestamp = str(int(time.time() * 1000))
            temp_path = temp_dir / f"{timestamp}_temp.html"

            with open(temp_path, "w", encoding="utf-8") as temp_file:
                temp_file.write(decoded_html)
            temp_path = str(temp_path)

            try:
                # Usar capacidades nativas do Docling com HTML decodificado
                result = self.converter.convert(temp_path)
                markdown = result.document.export_to_markdown()

                self.logger.debug(f"Markdown output length: {len(markdown)}")
                self.logger.debug(f"Markdown preview: {markdown[:30]}...")

                if markdown.strip():
                    return self._truncate_text(markdown, force_truncate=truncate)

                # Fallback para BeautifulSoup se Docling nÃ£o retornar conteÃºdo
                self.logger.debug(
                    "Docling returned empty, using BeautifulSoup fallback"
                )
                from bs4 import BeautifulSoup

                soup = BeautifulSoup(decoded_html, "html.parser")
                for script in soup(["script", "style"]):
                    script.decompose()
                text = soup.get_text()
                import re

                text = re.sub(r"\s+", " ", text).strip()
                return text

            finally:
                # Limpar arquivo temporÃ¡rio
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

        except Exception as e:
            self.logger.error(f"Erro ao converter HTML para Markdown: {e}")
            # Fallback para BeautifulSoup em caso de erro
            try:
                import html as html_module

                decoded_html = html_module.unescape(html)
                from bs4 import BeautifulSoup

                soup = BeautifulSoup(decoded_html, "html.parser")
                for script in soup(["script", "style"]):
                    script.decompose()
                text = soup.get_text()
                import re

                text = re.sub(r"\s+", " ", text).strip()
                return text
            except Exception:
                return html

    def get_supported_formats(self) -> List[str]:
        """Retorna formatos suportados"""
        return list(self.ALLOWED_EXTENSIONS)

    def get_available_output_formats(self) -> List[str]:
        """Retorna formatos de saÃ­da disponÃ­veis"""
        return ["markdown", "html", "txt", "json", "full"]

    def get_processing_limits(self) -> Dict[str, int]:
        """Retorna limites de processamento"""
        base_limits = {
            "max_text_length": self.MAX_TEXT_LENGTH,
            "max_json_size": self.MAX_JSON_SIZE,
            "max_processing_time": self.MAX_PROCESSING_TIME,
        }

        # Adicionar informaÃ§Ãµes dos processadores hÃ­bridos se disponÃ­veis
        if hasattr(self, "hybrid_pdf_processor"):
            hybrid_pdf_info = self.hybrid_pdf_processor.get_strategy_info()
            base_limits["hybrid_pdf_available"] = True
            base_limits["hybrid_pdf_strategies"] = hybrid_pdf_info["strategies"]
            base_limits["hybrid_pdf_limits"] = hybrid_pdf_info["limits"]
        else:
            base_limits["hybrid_pdf_available"] = False

        if hasattr(self, "hybrid_excel_processor"):
            hybrid_excel_info = self.hybrid_excel_processor.get_strategy_info()
            base_limits["hybrid_excel_available"] = True
            base_limits["hybrid_excel_strategies"] = hybrid_excel_info["strategies"]
            base_limits["hybrid_excel_limits"] = hybrid_excel_info["limits"]
        else:
            base_limits["hybrid_excel_available"] = False

        return base_limits

    def get_hybrid_pdf_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes detalhadas sobre processamento hÃ­brido de PDF"""
        if hasattr(self, "hybrid_pdf_processor"):
            return self.hybrid_pdf_processor.get_strategy_info()

        return {"error": "Processador hÃ­brido nÃ£o disponÃ­vel"}

    def get_hybrid_excel_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes detalhadas sobre processamento hÃ­brido de Excel"""
        if hasattr(self, "hybrid_excel_processor"):
            return self.hybrid_excel_processor.get_strategy_info()

        return {"error": "Processador hÃ­brido Excel nÃ£o disponÃ­vel"}

    async def cleanup_pdf_cache(self, max_age_hours: int = 72):
        """Limpa cache do processador hÃ­brido de PDF"""
        if hasattr(self, "hybrid_pdf_processor"):
            self.hybrid_pdf_processor.cleanup_cache(max_age_hours)
            self.logger.info(
                f"Cache PDF hÃ­brido limpo (arquivos > {max_age_hours}h removidos)"
            )
        else:
            self.logger.warning(
                "Processador hÃ­brido PDF nÃ£o disponÃ­vel para limpeza de cache"
            )

    async def cleanup_excel_cache(self, max_age_hours: int = 72):
        """Limpa cache do processador hÃ­brido de Excel"""
        if hasattr(self, "hybrid_excel_processor"):
            self.hybrid_excel_processor.cleanup_cache(max_age_hours)
            self.logger.info(
                f"Cache Excel hÃ­brido limpo (arquivos > {max_age_hours}h removidos)"
            )
        else:
            self.logger.warning(
                "Processador hÃ­brido Excel nÃ£o disponÃ­vel para limpeza de cache"
            )

    async def cleanup_all_hybrid_caches(self, max_age_hours: int = 72):
        """Limpa todos os caches dos processadores hÃ­bridos"""
        await self.cleanup_pdf_cache(max_age_hours)
        await self.cleanup_excel_cache(max_age_hours)
