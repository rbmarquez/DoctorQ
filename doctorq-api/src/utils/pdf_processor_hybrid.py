# src/utils/pdf_processor_hybrid.py

import asyncio
import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

import psutil

logger = logging.getLogger(__name__)


class HybridPDFProcessor:
    """
    Processador hÃ­brido inteligente para PDFs de todos os tamanhos.

    EstratÃ©gias:
    1. PDFs pequenos (â‰¤ 5MB, â‰¤ 10 pÃ¡ginas): PyMuPDF (ultra rÃ¡pido)
    2. PDFs mÃ©dios (â‰¤ 20MB, â‰¤ 50 pÃ¡ginas): pdfplumber (melhor para tabelas)
    3. PDFs grandes (> 50 pÃ¡ginas): Processamento em chunks + cache
    4. PDFs gigantes (> 200 pÃ¡ginas): Processamento assÃ­ncrono obrigatÃ³rio
    """

    # Limites para classificaÃ§Ã£o automÃ¡tica
    SMALL_PDF_MAX_SIZE_MB = 5
    SMALL_PDF_MAX_PAGES = 15  # Aumentado de 10

    MEDIUM_PDF_MAX_SIZE_MB = 30  # Aumentado de 20
    MEDIUM_PDF_MAX_PAGES = 80  # Aumentado de 50

    LARGE_PDF_MAX_PAGES = 300  # Aumentado de 200

    # ConfiguraÃ§Ãµes de performance
    CHUNK_SIZE_PAGES = 30  # Aumentado de 25 para melhor performance
    CACHE_EXPIRY_HOURS = 24
    MAX_PROCESSING_TIME = 600  # Aumentado para 10 minutos

    def __init__(self):
        self.logger = logger
        self._cache_dir = self._setup_cache_dir()
        self._memory_limit_mb = 2048  # Aumentado para 2GB em ambiente K8s

    def _setup_cache_dir(self) -> Path:
        """Configura diretÃ³rio de cache"""
        # Detectar ambiente K8s
        is_k8s = os.getenv("KUBERNETES_SERVICE_HOST") is not None or os.path.exists(
            "/.dockerenv"
        )

        if is_k8s:
            # Em K8s, usar /tmp que Ã© garantido ter permissÃµes de escrita
            cache_dir = Path("/tmp") / "inovaia_pdf_cache"
            self.logger.debug(f"Usando cache K8s: {cache_dir}")
        else:
            # Em ambiente local, usar diretÃ³rio do projeto
            project_root = Path(__file__).parent.parent.parent
            cache_dir = project_root / "temp" / "pdf_cache"
            self.logger.debug(f"Usando cache local: {cache_dir}")

        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir

    def _get_file_hash(self, file_path: str) -> str:
        """Gera hash Ãºnico do arquivo para cache"""
        # Verificar se o arquivo existe e nÃ£o estÃ¡ vazio
        if not os.path.exists(file_path):
            self.logger.error(f"Arquivo nÃ£o existe para hash: {file_path}")
            raise FileNotFoundError(f"Arquivo nÃ£o encontrado: {file_path}")

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            self.logger.error(f"Arquivo estÃ¡ vazio para hash: {file_path}")
            raise ValueError(f"Arquivo estÃ¡ vazio: {file_path}")

        with open(file_path, "rb") as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        return file_hash

    def _get_memory_usage_mb(self) -> float:
        """Retorna uso de memÃ³ria atual em MB"""
        try:
            process = psutil.Process(os.getpid())
            return process.memory_info().rss / 1024 / 1024
        except Exception:
            return 0

    def _check_memory_limit(self) -> bool:
        """Verifica se hÃ¡ memÃ³ria suficiente disponÃ­vel"""
        current_memory = self._get_memory_usage_mb()
        return current_memory < (self._memory_limit_mb * 0.8)  # 80% do limite

    async def _estimate_pdf_complexity(self, file_path: str) -> Dict[str, Any]:
        """Estima complexidade e caracterÃ­sticas do PDF"""
        try:
            # Verificar se o arquivo existe e nÃ£o estÃ¡ vazio
            if not os.path.exists(file_path):
                self.logger.error(f"Arquivo nÃ£o existe: {file_path}")
                raise FileNotFoundError(f"Arquivo nÃ£o encontrado: {file_path}")

            file_size = os.path.getsize(file_path)
            if file_size == 0:
                self.logger.error(f"Arquivo estÃ¡ vazio: {file_path} (0 bytes)")
                raise ValueError(f"Arquivo estÃ¡ vazio: {file_path}")

            self.logger.debug(f"Analisando PDF: {file_path} ({file_size} bytes)")

            import fitz  # PyMuPDF para anÃ¡lise rÃ¡pida

            doc = fitz.open(file_path)
            page_count = len(doc)
            file_size_mb = file_size / 1024 / 1024

            # Analisar primeira pÃ¡gina para detectar complexidade
            has_images = False
            has_tables = False
            text_density = 0

            if page_count > 0:
                first_page = doc[0]

                # Verificar imagens
                image_list = first_page.get_images()
                has_images = len(image_list) > 0

                # Verificar densidade de texto
                text = first_page.get_text()
                text_density = (
                    len(text) / (first_page.rect.width * first_page.rect.height)
                    if text
                    else 0
                )

                # HeurÃ­stica simples para detectar tabelas
                lines = text.split("\n")
                tab_count = sum(line.count("\t") for line in lines)
                has_tables = tab_count > 5 or any(
                    len(line.split()) > 10 for line in lines[:10]
                )

            doc.close()

            complexity = {
                "page_count": page_count,
                "file_size_mb": file_size_mb,
                "has_images": has_images,
                "has_tables": has_tables,
                "text_density": text_density,
                "estimated_processing_time": self._estimate_processing_time(
                    page_count, file_size_mb, has_images
                ),
            }

            self.logger.info(f"PDF Complexity Analysis: {complexity}")
            return complexity

        except Exception as e:
            self.logger.error(f"Erro ao analisar PDF: {e}")
            # Fallback: estimar apenas por tamanho do arquivo
            try:
                file_size = os.path.getsize(file_path)
                file_size_mb = file_size / 1024 / 1024
                estimated_pages = max(1, int(file_size_mb * 20))  # ~50KB por pÃ¡gina
            except Exception as size_error:
                self.logger.error(f"Erro ao obter tamanho do arquivo: {size_error}")
                file_size_mb = 0
                estimated_pages = 1

            return {
                "page_count": estimated_pages,
                "file_size_mb": file_size_mb,
                "has_images": True,  # Assumir complexidade mÃ©dia
                "has_tables": False,
                "text_density": 0.1,
                "estimated_processing_time": self._estimate_processing_time(
                    estimated_pages, file_size_mb, True
                ),
            }

    def _estimate_processing_time(
        self, pages: int, size_mb: float, has_images: bool
    ) -> int:
        """Estima tempo de processamento em segundos"""
        base_time_per_page = 0.5  # 0.5s por pÃ¡gina para texto simples
        if has_images:
            base_time_per_page *= 3  # 3x mais lento com imagens

        estimated_seconds = pages * base_time_per_page

        # Adicionar overhead por tamanho do arquivo
        size_overhead = size_mb * 0.1  # 0.1s por MB

        return int(estimated_seconds + size_overhead)

    def _select_strategy(self, complexity: Dict[str, Any]) -> str:
        """Seleciona estratÃ©gia de processamento baseada na complexidade"""
        pages = complexity["page_count"]
        size_mb = complexity["file_size_mb"]
        has_images = complexity["has_images"]
        has_tables = complexity["has_tables"]

        # EstratÃ©gia 1: PDF pequeno e simples -> PyMuPDF (mais rÃ¡pido)
        if (
            pages <= self.SMALL_PDF_MAX_PAGES
            and size_mb <= self.SMALL_PDF_MAX_SIZE_MB
            and not has_images
        ):
            return "pymupdf_fast"

        # EstratÃ©gia 2: PDF mÃ©dio com tabelas -> pdfplumber
        if (
            pages <= self.MEDIUM_PDF_MAX_PAGES
            and size_mb <= self.MEDIUM_PDF_MAX_SIZE_MB
            and has_tables
        ):
            return "pdfplumber_tables"

        # EstratÃ©gia 3: PDF mÃ©dio com imagens -> PyMuPDF (melhor que docling)
        if (
            pages <= self.MEDIUM_PDF_MAX_PAGES
            and size_mb <= self.MEDIUM_PDF_MAX_SIZE_MB
        ):
            return "pymupdf_standard"

        # EstratÃ©gia 4: PDF grande -> Processamento em chunks
        if pages <= self.LARGE_PDF_MAX_PAGES:
            return "chunked_processing"

        # EstratÃ©gia 5: PDF gigante -> Processamento assÃ­ncrono obrigatÃ³rio
        return "async_required"

    async def _extract_with_pymupdf_fast(self, file_path: str) -> str:
        """ExtraÃ§Ã£o ultra rÃ¡pida com PyMuPDF para PDFs pequenos"""
        try:
            # Verificar se o arquivo existe e nÃ£o estÃ¡ vazio
            if not os.path.exists(file_path):
                self.logger.error(
                    f"Arquivo nÃ£o existe para extraÃ§Ã£o rÃ¡pida: {file_path}"
                )
                raise FileNotFoundError(f"Arquivo nÃ£o encontrado: {file_path}")

            file_size = os.path.getsize(file_path)
            if file_size == 0:
                self.logger.error(
                    f"Arquivo estÃ¡ vazio para extraÃ§Ã£o rÃ¡pida: {file_path}"
                )
                raise ValueError(f"Arquivo estÃ¡ vazio: {file_path}")

            self.logger.debug(f"Extraindo PDF rÃ¡pido: {file_path} ({file_size} bytes)")

            import fitz

            doc = fitz.open(file_path)
            text_parts = []

            for page_num, page in enumerate(doc):
                text = page.get_text()
                if text.strip():
                    text_parts.append(f"--- PÃ¡gina {page_num + 1} ---\n{text}")

            doc.close()
            return "\n\n".join(text_parts)

        except Exception as e:
            self.logger.error(f"Erro PyMuPDF Fast: {e}")
            raise

    async def _extract_with_pymupdf_standard(self, file_path: str) -> str:
        """ExtraÃ§Ã£o padrÃ£o com PyMuPDF para PDFs mÃ©dios"""
        try:
            # Verificar se o arquivo existe e nÃ£o estÃ¡ vazio
            if not os.path.exists(file_path):
                self.logger.error(
                    f"Arquivo nÃ£o existe para extraÃ§Ã£o padrÃ£o: {file_path}"
                )
                raise FileNotFoundError(f"Arquivo nÃ£o encontrado: {file_path}")

            file_size = os.path.getsize(file_path)
            if file_size == 0:
                self.logger.error(
                    f"Arquivo estÃ¡ vazio para extraÃ§Ã£o padrÃ£o: {file_path}"
                )
                raise ValueError(f"Arquivo estÃ¡ vazio: {file_path}")

            self.logger.debug(f"Extraindo PDF padrÃ£o: {file_path} ({file_size} bytes)")

            import fitz

            doc = fitz.open(file_path)
            text_parts = []

            for page_num, page in enumerate(doc):
                # Extrair texto com melhor formataÃ§Ã£o
                text = page.get_text("text")

                # Tentar extrair texto de imagens se necessÃ¡rio (OCR bÃ¡sico)
                if len(text.strip()) < 50:  # PÃ¡gina com pouco texto, pode ter imagens
                    try:
                        # Pegar texto de imagens se disponÃ­vel
                        # text_dict = page.get_text("dict")  # Para futuro processamento avanÃ§ado
                        # Processar estrutura do texto se necessÃ¡rio
                        pass
                    except Exception:
                        pass

                if text.strip():
                    text_parts.append(f"--- PÃ¡gina {page_num + 1} ---\n{text}")

            doc.close()
            return "\n\n".join(text_parts)

        except Exception as e:
            self.logger.error(f"Erro PyMuPDF Standard: {e}")
            raise

    async def _extract_with_pdfplumber(self, file_path: str) -> str:
        """ExtraÃ§Ã£o com pdfplumber, otimizada para tabelas"""
        try:
            import pdfplumber

            text_parts = []

            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_text = f"--- PÃ¡gina {page_num + 1} ---\n"

                    # Extrair texto normal
                    text = page.extract_text()
                    if text:
                        page_text += text + "\n"

                    # Extrair tabelas
                    tables = page.extract_tables()
                    for table_num, table in enumerate(tables):
                        if table:
                            page_text += f"\n[TABELA {table_num + 1}]\n"
                            for row in table:
                                if row:
                                    # Limpar valores None
                                    clean_row = [
                                        str(cell) if cell is not None else ""
                                        for cell in row
                                    ]
                                    page_text += "\t".join(clean_row) + "\n"
                            page_text += "[/TABELA]\n"

                    if page_text.strip() != f"--- PÃ¡gina {page_num + 1} ---":
                        text_parts.append(page_text)

            return "\n\n".join(text_parts)

        except Exception as e:
            self.logger.error(f"Erro pdfplumber: {e}")
            raise

    async def _extract_with_chunked_processing(self, file_path: str) -> str:
        """Processamento em chunks para PDFs grandes"""
        try:
            import fitz

            doc = fitz.open(file_path)
            total_pages = len(doc)
            text_parts = []

            # Processar em chunks para controlar memÃ³ria
            for chunk_start in range(0, total_pages, self.CHUNK_SIZE_PAGES):
                chunk_end = min(chunk_start + self.CHUNK_SIZE_PAGES, total_pages)

                # Verificar memÃ³ria antes de cada chunk
                if not self._check_memory_limit():
                    self.logger.warning(
                        "Limite de memÃ³ria atingido, interrompendo processamento"
                    )
                    break

                self.logger.info(
                    f"Processando chunk {chunk_start}-{chunk_end} de {total_pages} pÃ¡ginas"
                )

                chunk_text = []
                for page_num in range(chunk_start, chunk_end):
                    page = doc[page_num]
                    text = page.get_text()
                    if text.strip():
                        chunk_text.append(f"--- PÃ¡gina {page_num + 1} ---\n{text}")

                if chunk_text:
                    text_parts.extend(chunk_text)

                # Pequena pausa para evitar sobrecarga
                await asyncio.sleep(0.1)

            doc.close()
            return "\n\n".join(text_parts)

        except Exception as e:
            self.logger.error(f"Erro chunked processing: {e}")
            raise

    def _save_to_cache(self, file_hash: str, content: str, strategy: str):
        """Salva resultado no cache"""
        try:
            cache_data = {
                "content": content,
                "strategy": strategy,
                "timestamp": time.time(),
                "size": len(content),
            }

            cache_file = self._cache_dir / f"{file_hash}.json"
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)

            self.logger.debug(f"Resultado salvo no cache: {cache_file}")

        except Exception as e:
            self.logger.warning(f"Erro ao salvar cache: {e}")

    def _load_from_cache(self, file_hash: str) -> Optional[str]:
        """Carrega resultado do cache se vÃ¡lido"""
        try:
            cache_file = self._cache_dir / f"{file_hash}.json"

            if not cache_file.exists():
                return None

            with open(cache_file, "r", encoding="utf-8") as f:
                cache_data = json.load(f)

            # Verificar se cache ainda Ã© vÃ¡lido
            cache_age_hours = (time.time() - cache_data["timestamp"]) / 3600
            if cache_age_hours > self.CACHE_EXPIRY_HOURS:
                # Cache expirado, remover
                cache_file.unlink()
                return None

            self.logger.info(
                f"Resultado carregado do cache (idade: {cache_age_hours:.1f}h)"
            )
            return cache_data["content"]

        except Exception as e:
            self.logger.warning(f"Erro ao carregar cache: {e}")
            return None

    async def process_pdf(
        self, file_path: str, use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Processa PDF usando estratÃ©gia hÃ­brida inteligente

        Returns:
            Dict com conteÃºdo extraÃ­do e metadados do processamento
        """
        start_time = time.time()

        try:
            # 1. Verificar cache se habilitado
            file_hash = self._get_file_hash(file_path) if use_cache else None

            if use_cache and file_hash:
                cached_content = self._load_from_cache(file_hash)
                if cached_content:
                    return {
                        "content": cached_content,
                        "processing_info": {
                            "strategy": "cache_hit",
                            "processing_time": time.time() - start_time,
                            "from_cache": True,
                            "file_hash": file_hash,
                        },
                    }

            # 2. Analisar complexidade do PDF
            complexity = await self._estimate_pdf_complexity(file_path)

            # 3. Selecionar estratÃ©gia
            strategy = self._select_strategy(complexity)

            self.logger.info(
                f"EstratÃ©gia selecionada: {strategy} para PDF com {complexity['page_count']} pÃ¡ginas"
            )

            # 4. Verificar se Ã© processamento assÃ­ncrono obrigatÃ³rio
            if strategy == "async_required":
                raise ValueError(
                    f"PDF muito grande para processamento sÃ­ncrono ({complexity['page_count']} pÃ¡ginas)"
                )

            # 5. Processar com timeout
            content = await asyncio.wait_for(
                self._execute_strategy(strategy, file_path),
                timeout=self.MAX_PROCESSING_TIME,
            )

            processing_time = time.time() - start_time

            # 6. Salvar no cache
            if use_cache and file_hash:
                self._save_to_cache(file_hash, content, strategy)

            # 7. Retornar resultado
            return {
                "content": content,
                "processing_info": {
                    "strategy": strategy,
                    "processing_time": processing_time,
                    "complexity": complexity,
                    "from_cache": False,
                    "file_hash": file_hash,
                    "content_size": len(content),
                },
            }

        except asyncio.TimeoutError:
            raise TimeoutError(f"Processamento excedeu {self.MAX_PROCESSING_TIME}s")
        except Exception as e:
            self.logger.error(f"Erro no processamento hÃ­brido: {e}")
            raise

    async def _execute_strategy(self, strategy: str, file_path: str) -> str:
        """Executa a estratÃ©gia selecionada"""
        if strategy == "pymupdf_fast":
            return await self._extract_with_pymupdf_fast(file_path)
        if strategy == "pymupdf_standard":
            return await self._extract_with_pymupdf_standard(file_path)
        if strategy == "pdfplumber_tables":
            return await self._extract_with_pdfplumber(file_path)
        if strategy == "chunked_processing":
            return await self._extract_with_chunked_processing(file_path)

        raise ValueError(f"EstratÃ©gia nÃ£o implementada: {strategy}")

    def get_strategy_info(self) -> Dict[str, Any]:
        """Retorna informaÃ§Ãµes sobre as estratÃ©gias disponÃ­veis"""
        return {
            "strategies": {
                "pymupdf_fast": "Ultra rÃ¡pido para PDFs pequenos (â‰¤10 pÃ¡ginas, â‰¤5MB, sem imagens)",
                "pymupdf_standard": "PadrÃ£o para PDFs mÃ©dios com imagens (â‰¤50 pÃ¡ginas, â‰¤20MB)",
                "pdfplumber_tables": "Otimizado para PDFs com tabelas (â‰¤50 pÃ¡ginas, â‰¤20MB)",
                "chunked_processing": "Processamento em chunks para PDFs grandes (â‰¤200 pÃ¡ginas)",
                "async_required": "Processamento assÃ­ncrono obrigatÃ³rio (>200 pÃ¡ginas)",
            },
            "limits": {
                "small_pdf_max_pages": self.SMALL_PDF_MAX_PAGES,
                "small_pdf_max_size_mb": self.SMALL_PDF_MAX_SIZE_MB,
                "medium_pdf_max_pages": self.MEDIUM_PDF_MAX_PAGES,
                "medium_pdf_max_size_mb": self.MEDIUM_PDF_MAX_SIZE_MB,
                "large_pdf_max_pages": self.LARGE_PDF_MAX_PAGES,
                "chunk_size_pages": self.CHUNK_SIZE_PAGES,
                "max_processing_time": self.MAX_PROCESSING_TIME,
            },
            "features": {
                "intelligent_strategy_selection": True,
                "automatic_caching": True,
                "memory_monitoring": True,
                "chunked_processing": True,
                "table_extraction": True,
                "performance_optimized": True,
            },
        }

    def cleanup_cache(self, max_age_hours: int = 72):
        """Limpa cache antigo"""
        try:
            current_time = time.time()
            removed_count = 0

            for cache_file in self._cache_dir.glob("*.json"):
                try:
                    file_age = (current_time - cache_file.stat().st_mtime) / 3600
                    if file_age > max_age_hours:
                        cache_file.unlink()
                        removed_count += 1
                except Exception:
                    pass

            self.logger.info(
                f"Cache cleanup: {removed_count} arquivos antigos removidos"
            )

        except Exception as e:
            self.logger.warning(f"Erro na limpeza do cache: {e}")
