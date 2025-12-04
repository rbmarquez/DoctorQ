# src/utils/docling_embedding.py
"""
ExtensÃ£o do DoclingProcessor especÃ­fica para processamento de embeddings
"""

import os
import tempfile
from typing import Optional

from src.config.logger_config import get_logger
from src.utils.docling import DoclingProcessor

logger = get_logger(__name__)


class DoclingEmbeddingProcessor(DoclingProcessor):
    """
    ExtensÃ£o do DoclingProcessor otimizada para extraÃ§Ã£o de texto para embeddings
    """

    def __init__(self):
        super().__init__()
        # ConfiguraÃ§Ãµes especÃ­ficas para embeddings
        self.embedding_max_text_length = 500_000  # 500KB de texto para embeddings
        self.min_text_length_for_embedding = 50  # MÃ­nimo de texto para gerar embedding

    async def extract_text_for_embedding(
        self, file_content: bytes, mime_type: str, filename: Optional[str] = None
    ) -> str:
        """
        Extrai texto de conteÃºdo de arquivo especificamente para geraÃ§Ã£o de embeddings

        Args:
            file_content: ConteÃºdo do arquivo em bytes
            mime_type: Tipo MIME do arquivo
            filename: Nome do arquivo (opcional, usado para determinar extensÃ£o)

        Returns:
            Texto extraÃ­do e otimizado para embeddings
        """
        try:
            # Determinar extensÃ£o baseada no mime_type ou filename
            ext = self._get_extension_from_mime_or_filename(mime_type, filename)

            if not ext:
                logger.warning(
                    f"NÃ£o foi possÃ­vel determinar extensÃ£o para mime_type: {mime_type}"
                )
                return ""

            # Criar arquivo temporÃ¡rio
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
                temp_file.write(file_content)
                temp_path = temp_file.name

            try:
                return await self._process_embedding_file(temp_path, ext, file_content)
            finally:
                # Limpar arquivo temporÃ¡rio
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

        except Exception as e:
            logger.error(f"Erro ao extrair texto para embedding: {str(e)}")
            return ""

    async def _process_embedding_file(
        self, temp_path: str, ext: str, file_content: bytes
    ) -> str:
        """Processa arquivo para extraÃ§Ã£o de embedding"""
        # Verificar se o arquivo Ã© suportado
        if not self.is_allowed_file_path(temp_path):
            logger.warning(f"Tipo de arquivo nÃ£o suportado para embeddings: {ext}")
            return ""

        # Verificar tamanho do arquivo
        file_size = len(file_content)
        if file_size > 100 * 1024 * 1024:  # 100MB
            logger.warning(
                f"Arquivo muito grande para processamento: {file_size} bytes"
            )
            return ""

        # Processar documento
        result = await self.process_document(temp_path, output_format="txt")

        # Extrair e validar texto
        text_content = result.get("content", "")

        if not text_content:
            logger.debug("Nenhum conteÃºdo textual extraÃ­do")
            return ""

        # Limpar e otimizar texto para embeddings
        cleaned_text = self._clean_text_for_embedding(text_content)

        # Aplicar truncamento especÃ­fico para embeddings
        if len(cleaned_text) > self.embedding_max_text_length:
            logger.debug(
                f"Texto truncado para embeddings: {len(cleaned_text)} -> {self.embedding_max_text_length}"
            )
            cleaned_text = cleaned_text[: self.embedding_max_text_length]

        # Validar tamanho mÃ­nimo
        if len(cleaned_text.strip()) < self.min_text_length_for_embedding:
            logger.debug(
                f"Texto muito pequeno para embedding: {len(cleaned_text)} caracteres"
            )
            return ""

        logger.debug(f"Texto extraÃ­do para embedding: {len(cleaned_text)} caracteres")
        return cleaned_text

    def _get_extension_from_mime_or_filename(
        self, mime_type: str, filename: Optional[str] = None
    ) -> str:
        """Determina extensÃ£o baseada no mime_type ou filename"""

        # Mapeamento de MIME types para extensÃµes
        mime_to_ext = {
            "application/pdf": ".pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
            "application/msword": ".doc",
            "text/plain": ".txt",
            "text/markdown": ".md",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
            "application/vnd.ms-powerpoint": ".ppt",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
            "application/vnd.ms-excel": ".xls",
            "text/html": ".html",
            "text/htm": ".htm",
        }

        # Tentar pelo mime_type primeiro
        ext = mime_to_ext.get(mime_type)
        if ext:
            return ext

        # Tentar pelo filename se fornecido
        if filename:
            import os.path

            _, file_ext = os.path.splitext(filename.lower())
            if file_ext in self.ALLOWED_EXTENSIONS:
                return file_ext

        # Fallback baseado em mime_type parcial
        if mime_type:
            if "pdf" in mime_type.lower():
                return ".pdf"
            if "word" in mime_type.lower() or "document" in mime_type.lower():
                return ".docx"
            if "text" in mime_type.lower():
                return ".txt"
            if "powerpoint" in mime_type.lower() or "presentation" in mime_type.lower():
                return ".pptx"
            if "excel" in mime_type.lower() or "spreadsheet" in mime_type.lower():
                return ".xlsx"

        return ""

    def _clean_text_for_embedding(self, text: str) -> str:
        """
        Limpa e otimiza texto especificamente para geraÃ§Ã£o de embeddings
        """
        if not text:
            return ""

        # Remover caracteres de controle e normalizar espaÃ§os
        import re

        # Remover caracteres de controle (exceto \n, \r, \t)
        text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)

        # Normalizar quebras de linha
        text = re.sub(r"\r\n|\r|\n", "\n", text)

        # Remover mÃºltiplas quebras de linha consecutivas
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Remover mÃºltiplos espaÃ§os
        text = re.sub(r" {2,}", " ", text)

        # Remover espaÃ§os no inÃ­cio e fim de linhas
        lines = [line.strip() for line in text.split("\n")]
        text = "\n".join(line for line in lines if line)

        # Remover caracteres especiais problemÃ¡ticos para embeddings
        # Manter pontuaÃ§Ã£o bÃ¡sica mas remover caracteres muito especÃ­ficos
        text = re.sub(r'[^\w\s\.,;:!?\-\'"()\[\]{}/@#$%&*+=<>|\\~`]', " ", text)

        # Normalizar espaÃ§os finais
        text = re.sub(r" +", " ", text).strip()

        return text

    def is_suitable_for_embedding(self, text: str) -> bool:
        """
        Verifica se o texto Ã© adequado para geraÃ§Ã£o de embeddings
        """
        if not text or not text.strip():
            return False

        cleaned_text = text.strip()

        # Verificar tamanho mÃ­nimo
        if len(cleaned_text) < self.min_text_length_for_embedding:
            return False

        # Verificar se nÃ£o Ã© apenas caracteres especiais
        import re

        if re.match(r"^[\s\W]*$", cleaned_text):
            return False

        # Verificar se tem palavras suficientes
        words = cleaned_text.split()
        if len(words) < 5:
            return False

        # Verificar se nÃ£o Ã© muito repetitivo
        unique_words = set(word.lower() for word in words)
        if len(unique_words) < len(words) * 0.3:  # Menos de 30% de palavras Ãºnicas
            logger.debug("Texto muito repetitivo para embedding")
            return False

        return True


_docling_embedding_processor: Optional[DoclingEmbeddingProcessor] = None

def get_docling_embedding_processor() -> DoclingEmbeddingProcessor:
    global _docling_embedding_processor
    if _docling_embedding_processor is None:
        _docling_embedding_processor = DoclingEmbeddingProcessor()
    return _docling_embedding_processor
