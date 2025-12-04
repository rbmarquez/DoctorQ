#!/usr/bin/env python3
"""
Script para criar API key inicial no banco de dados.

Este script cria a API key que é usada pelo frontend para autenticação.
A chave já existe no .env do frontend, então precisamos criá-la no backend.

Uso:
    uv run python scripts/create_initial_apikey.py
"""

import asyncio
import sys
from pathlib import Path

# Adicionar o diretório src ao path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.config.orm_config import get_async_session_context
from src.models.apikey import ApiKeyCreate
from src.services.apikey_service import ApiKeyService
from src.config.logger_config import get_logger

logger = get_logger(__name__)


async def create_initial_apikey():
    """Cria a API key inicial para o frontend"""

    # API key que já existe no frontend .env
    FRONTEND_API_KEY = "vf_9I1t4WPnl1D9rZ994C9Njbakli3IR5bL"
    KEY_NAME = "Frontend Web - InovaIA"

    try:
        # Inicializar o banco de dados
        from src.config.orm_config import ORMConfig
        await ORMConfig.initialize_database()
        logger.info("✅ Banco de dados inicializado")

        async with get_async_session_context() as db:
            service = ApiKeyService(db)

            # Verificar se a API key já existe
            existing_key = await service.get_apikey_by_key(FRONTEND_API_KEY)
            if existing_key:
                logger.info(f"✅ API Key '{KEY_NAME}' já existe no banco de dados")
                logger.info(f"   Key: {FRONTEND_API_KEY[:12]}...")
                return

            # Verificar se existe uma key com o mesmo nome
            existing_name = await service.get_apikey_by_name(KEY_NAME)
            if existing_name:
                logger.warning(f"⚠️  Já existe uma API Key com nome '{KEY_NAME}'")
                logger.info(f"   Usando nome alternativo...")
                key_name = f"{KEY_NAME} - {FRONTEND_API_KEY[:8]}"
            else:
                key_name = KEY_NAME

            # Como não podemos definir a API key manualmente (o serviço gera automaticamente),
            # vamos criar uma nova key e informar ao usuário para atualizar o .env do frontend
            logger.info(f"🔑 Criando nova API Key: {key_name}")

            apikey_data = ApiKeyCreate(keyName=key_name)
            apikey, api_secret = await service.create_apikey(apikey_data)

            logger.info("✅ API Key criada com sucesso!")
            logger.info("")
            logger.info("=" * 80)
            logger.info("IMPORTANTE: Atualize o arquivo .env do frontend com estas credenciais:")
            logger.info("=" * 80)
            logger.info("")
            logger.info(f"API_InovaIA_API_KEY={apikey.apiKey}")
            logger.info("")
            logger.info("=" * 80)
            logger.info("")
            logger.info("Detalhes da API Key:")
            logger.info(f"  - Nome: {apikey.keyName}")
            logger.info(f"  - API Key (pública): {apikey.apiKey}")
            logger.info(f"  - API Secret (privado): {api_secret[:16]}... (não compartilhe!)")
            logger.info(f"  - ID: {apikey.id}")
            logger.info("")
            logger.info("⚠️  ATENÇÃO:")
            logger.info("  1. Copie a API Key acima para /mnt/repositorios/InovaIA/inovaia-web/.env")
            logger.info("  2. Substitua o valor de API_InovaIA_API_KEY")
            logger.info("  3. Reinicie o servidor frontend (yarn dev)")
            logger.info("")

    except Exception as e:
        logger.error(f"❌ Erro ao criar API Key: {str(e)}")
        raise


if __name__ == "__main__":
    print("🚀 Criando API Key inicial para o frontend...")
    print("")
    asyncio.run(create_initial_apikey())
