#!/usr/bin/env python3
"""
Script para criar usuário administrador no banco de dados.

Este script cria um usuário com papel 'admin' para acessar o sistema.

Uso:
    uv run python scripts/create_admin_user.py
"""

import asyncio
import sys
from pathlib import Path

# Adicionar o diretório src ao path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.config.orm_config import ORMConfig, get_async_session_context
from src.models.user import UserRegister
from src.services.user_service import UserService
from src.config.logger_config import get_logger

logger = get_logger(__name__)


async def create_admin_user():
    """Cria um usuário administrador para o sistema"""

    # Dados do usuário admin padrão
    ADMIN_EMAIL = "rodrigo.consultoria@gmail.com"
    ADMIN_NAME = "Rodrigo - Administrador"
    ADMIN_PASSWORD = "12345678"

    print("🔐 Criando usuário administrador...")
    print("")
    print("⚠️  ATENÇÃO: Este é um usuário padrão para desenvolvimento.")
    print("   Em produção, use credenciais fortes e exclusivas!")
    print("")

    try:
        # Inicializar o banco de dados
        await ORMConfig.initialize_database()
        logger.info("✅ Banco de dados inicializado")

        async with get_async_session_context() as db:
            service = UserService(db)

            # Verificar se o usuário já existe
            existing_user = await service.get_user_by_email(ADMIN_EMAIL)
            if existing_user:
                logger.info(f"✅ Usuário admin '{ADMIN_EMAIL}' já existe no banco de dados")
                logger.info(f"   ID: {existing_user.id_user}")
                logger.info(f"   Nome: {existing_user.nm_completo}")
                logger.info(f"   Papel: {existing_user.nm_papel}")
                logger.info(f"   Ativo: {existing_user.st_ativo}")
                print("")
                print("=" * 80)
                print("Usuário admin já existe!")
                print("=" * 80)
                print("")
                print(f"Email: {existing_user.nm_email}")
                print(f"Nome: {existing_user.nm_completo}")
                print(f"Papel: {existing_user.nm_papel}")
                print("")
                print("Se esqueceu a senha, você pode atualizá-la diretamente no banco:")
                print(f"  - ID do usuário: {existing_user.id_user}")
                print("")
                return

            # Criar novo usuário admin
            logger.info(f"🔑 Criando novo usuário admin: {ADMIN_EMAIL}")

            user_data = UserRegister(
                nm_email=ADMIN_EMAIL,
                nm_completo=ADMIN_NAME,
                nm_papel="admin",
                senha=ADMIN_PASSWORD,
            )

            user = await service.register_local_user(user_data)

            logger.info("✅ Usuário admin criado com sucesso!")
            print("")
            print("=" * 80)
            print("USUÁRIO ADMINISTRADOR CRIADO COM SUCESSO!")
            print("=" * 80)
            print("")
            print("Credenciais de acesso:")
            print(f"  Email: {user.nm_email}")
            print(f"  Senha: {ADMIN_PASSWORD}")
            print("")
            print("Detalhes do usuário:")
            print(f"  - ID: {user.id_user}")
            print(f"  - Nome: {user.nm_completo}")
            print(f"  - Papel: {user.nm_papel}")
            print(f"  - Ativo: {user.st_ativo}")
            print("")
            print("=" * 80)
            print("PRÓXIMOS PASSOS:")
            print("=" * 80)
            print("")
            print("1. Acesse o frontend: http://localhost:3000")
            print("2. Faça login com as credenciais acima")
            print("3. IMPORTANTE: Troque a senha padrão após o primeiro login!")
            print("")
            print("Páginas administrativas disponíveis:")
            print("  - Usuários: http://localhost:3000/usuarios")
            print("  - Variáveis: http://localhost:3000/variaveis")
            print("  - Agentes: http://localhost:3000/agentes")
            print("")

    except Exception as e:
        logger.error(f"❌ Erro ao criar usuário admin: {str(e)}")
        print("")
        print("❌ Erro ao criar usuário admin!")
        print(f"   Erro: {str(e)}")
        print("")
        print("Verifique se:")
        print("  - O PostgreSQL está rodando")
        print("  - As credenciais do .env estão corretas")
        print("  - A tabela tb_users existe no banco")
        print("")
        raise


if __name__ == "__main__":
    asyncio.run(create_admin_user())
