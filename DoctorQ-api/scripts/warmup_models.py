#!/usr/bin/env python3
"""
Script para prÃ©-carregar modelos do EasyOCR durante o build do container.
Evita downloads em produÃ§Ã£o que causam lentidÃ£o inicial.
"""

import sys
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def warmup_easyocr():
    """PrÃ©-carrega modelos do EasyOCR"""
    try:
        import easyocr
        import os
        
        logger.info("Iniciando warmup do EasyOCR...")
        
        # Configurar diretÃ³rio cache
        cache_dir = Path("/app/.EasyOCR")  # Usar diretÃ³rio fixo do container
        cache_dir.mkdir(exist_ok=True, parents=True)
        
        # Definir variÃ¡vel de ambiente para o EasyOCR usar o cache correto
        os.environ['EASYOCR_MODULE_PATH'] = str(cache_dir)
        
        logger.info(f"Cache EasyOCR configurado em: {cache_dir}")
        
        # Inicializar EasyOCR com portuguÃªs e inglÃªs (forÃ§a download dos modelos)
        reader = easyocr.Reader(['pt', 'en'], gpu=False, model_storage_directory=str(cache_dir))
        
        logger.info("Modelos EasyOCR carregados com sucesso")
        
        # Testar com uma imagem pequena para garantir que tudo funciona
        import numpy as np
        test_image = np.ones((100, 100, 3), dtype=np.uint8) * 255
        result = reader.readtext(test_image)
        
        logger.info(f"Warmup do EasyOCR concluÃ­do com sucesso - teste: {len(result)} detecÃ§Ãµes")
        return True
        
    except ImportError as e:
        logger.warning(f"EasyOCR nÃ£o instalado: {e}")
        return False
    except Exception as e:
        logger.error(f"Erro durante warmup do EasyOCR: {e}")
        return False

def warmup_docling():
    """PrÃ©-carrega componentes do Docling"""
    try:
        from docling.document_converter import DocumentConverter
        import os
        
        logger.info("Iniciando warmup do Docling...")
        
        # Configurar variÃ¡veis de ambiente para cache
        cache_base = Path("/app/.cache")
        cache_base.mkdir(exist_ok=True, parents=True)
        
        os.environ.setdefault("TRANSFORMERS_CACHE", str(cache_base / "transformers"))
        os.environ.setdefault("HF_HOME", str(cache_base / "huggingface"))
        
        # Criar conversor padrÃ£o (forÃ§a inicializaÃ§Ã£o dos componentes)
        _ = DocumentConverter()
        
        logger.info("Docling inicializado com sucesso")
        return True
        
    except ImportError as e:
        logger.warning(f"Docling nÃ£o instalado: {e}")
        return False
    except Exception as e:
        logger.error(f"Erro durante warmup do Docling: {e}")
        return False

def main():
    """Executa warmup de todos os modelos necessÃ¡rios"""
    logger.info("=== Iniciando warmup de modelos ===")
    
    results = []
    
    # Warmup EasyOCR
    results.append(("EasyOCR", warmup_easyocr()))
    
    # Warmup Docling  
    results.append(("Docling", warmup_docling()))
    
    # RelatÃ³rio final
    logger.info("=== Resultado do warmup ===")
    for name, success in results:
        status = "âœ… OK" if success else "âŒ FALHA"
        logger.info(f"{name}: {status}")
    
    # Retornar código de saída (0 = sucesso, mesmo com falhas opcionais)
    # EasyOCR é opcional - apenas Docling é crítico
    critical_failures = sum(1 for name, success in results if not success and name == "Docling")

    if critical_failures > 0:
        logger.error("Componente crítico falhou no warmup")
        return 1

    failed_count = sum(1 for _, success in results if not success)
    if failed_count > 0:
        logger.warning(f"{failed_count} componente(s) opcional(is) não carregado(s)")
    else:
        logger.info("Todos os componentes foram aquecidos com sucesso")

    return 0

if __name__ == "__main__":
    sys.exit(main())
