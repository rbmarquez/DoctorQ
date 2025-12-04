"""
Singleton para EasyOCR evitando mÃºltiplas inicializaÃ§Ãµes.
Melhora performance e reduz uso de memÃ³ria.
"""

import logging
import threading
from typing import Optional

logger = logging.getLogger(__name__)


class EasyOCRSingleton:
    """Singleton para gerenciar instÃ¢ncia Ãºnica do EasyOCR"""
    
    _instance: Optional[object] = None
    _reader: Optional[object] = None
    _lock = threading.Lock()
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_reader(self):
        """Retorna instÃ¢ncia do EasyOCR reader, criando se necessÃ¡rio"""
        if not self._initialized:
            with self._lock:
                if not self._initialized:
                    self._init_reader()
                    self._initialized = True
        return self._reader
    
    def _init_reader(self):
        """Inicializa o reader EasyOCR"""
        try:
            import easyocr
            import os
            from pathlib import Path
            
            logger.info("Inicializando EasyOCR reader (singleton)...")
            
            # Configurar diretÃ³rio de cache persistente
            cache_dir = Path("/app/.EasyOCR")
            cache_dir.mkdir(exist_ok=True, parents=True)
            
            # Definir variÃ¡vel de ambiente
            os.environ['EASYOCR_MODULE_PATH'] = str(cache_dir)
            
            # Configurar para usar CPU e diretÃ³rio de cache especÃ­fico
            self._reader = easyocr.Reader(
                ['pt', 'en'], 
                gpu=False, 
                model_storage_directory=str(cache_dir)
            )
            
            logger.info("EasyOCR reader inicializado com sucesso")
            
        except ImportError:
            logger.warning("EasyOCR nÃ£o instalado")
            self._reader = None
        except Exception as e:
            logger.error(f"Erro ao inicializar EasyOCR: {e}")
            self._reader = None
    
    def is_available(self) -> bool:
        """Verifica se o EasyOCR estÃ¡ disponÃ­vel"""
        reader = self.get_reader()
        return reader is not None
    
    def read_text(self, image):
        """Extrai texto da imagem usando EasyOCR"""
        reader = self.get_reader()
        if reader is None:
            raise RuntimeError("EasyOCR nÃ£o disponÃ­vel")
        
        try:
            return reader.readtext(image)
        except Exception as e:
            logger.error(f"Erro ao processar imagem com EasyOCR: {e}")
            raise


# InstÃ¢ncia global do singleton
ocr_singleton = EasyOCRSingleton()
