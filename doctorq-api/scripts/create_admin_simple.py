#!/usr/bin/env python3
"""
Script simples para criar usuário administrador usando asyncpg diretamente.
"""
import asyncio
import os
import sys
import uuid

import asyncpg
from dotenv import load_dotenv

# Adiciona o diretório src ao path para importar módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.security import hash_password

load_dotenv()

# Configurações do banco vindas do ambiente
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_PORT = int(os.getenv("DATABASE_PORT", "5432"))
DATABASE_USER = os.getenv("DATABASE_USERNAME")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_NAME = os.getenv("DATABASE_NAME")

if not all([DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME]):
    raise RuntimeError(
        "Configure DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD e DATABASE_NAME antes de executar este script."
    )

# Configurações do usuário admin
ADMIN_EMAIL = os.getenv("DOCTORQ_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("DOCTORQ_ADMIN_PASSWORD")
ADMIN_NAME = os.getenv("DOCTORQ_ADMIN_NAME", "Administrador do Sistema")

if not ADMIN_PASSWORD:
    raise RuntimeError(
        "Defina DOCTORQ_ADMIN_PASSWORD (via .env ou variáveis de ambiente protegidas) antes de executar este script."
    )


async def criar_usuario_admin():
    """Cria usuário administrador no banco de dados."""

    # Configurações do usuário
    email = ADMIN_EMAIL
    senha = ADMIN_PASSWORD
    nome_completo = ADMIN_NAME

    print("🔐 Criando usuário administrador...")
    print(f"   Email: {email}")
    print(f"   Nome: {nome_completo}")

    # Gera hash da senha
    password_hash = hash_password(senha)

    # Conecta ao banco de dados
    conn = await asyncpg.connect(
        host=DATABASE_HOST,
        port=DATABASE_PORT,
        user=DATABASE_USER,
        password=DATABASE_PASSWORD,
        database=DATABASE_NAME,
    )

    try:
        # Busca a primeira empresa
        empresa = await conn.fetchrow(
            "SELECT id_empresa, nm_empresa FROM tb_empresas LIMIT 1"
        )

        if not empresa:
            print("❌ Nenhuma empresa encontrada no banco de dados.")
            print("   Execute o script de população de dados primeiro.")
            return

        empresa_id = empresa['id_empresa']
        print(f"   Empresa: {empresa['nm_empresa']} ({empresa_id})")

        # Busca o perfil de Administrador
        perfil = await conn.fetchrow(
            "SELECT id_perfil FROM tb_perfis WHERE nm_perfil = 'Administrador' LIMIT 1"
        )

        perfil_id = perfil['id_perfil'] if perfil else None
        if perfil_id:
            print(f"   Perfil: Administrador ({perfil_id})")

        # Verifica se o email já existe
        existing = await conn.fetchrow(
            "SELECT id_user, nm_email, nm_papel FROM tb_users WHERE nm_email = $1",
            email
        )

        if existing:
            print(f"\n⚠️  Usuário com email {email} já existe!")
            print(f"   ID: {existing['id_user']}")
            print(f"   Papel: {existing['nm_papel']}")

            # Atualiza a senha e papel do usuário existente
            await conn.execute(
                """
                UPDATE tb_users
                SET nm_password_hash = $1,
                    nm_papel = 'admin',
                    id_perfil = $2,
                    nm_cargo = 'Administrador do Sistema',
                    dt_atualizacao = NOW()
                WHERE nm_email = $3
                """,
                password_hash,
                perfil_id,
                email
            )
            print("\n✅ Usuário atualizado com sucesso!")
            print(f"\n📋 Dados de acesso:")
            print(f"   Email: {email}")
            print(f"   Senha: {senha}")
            print(f"   Papel: admin")
            return

        # Gera novo UUID para o usuário
        user_id = str(uuid.uuid4())
        print(f"   User ID: {user_id}")

        # Insere novo usuário
        await conn.execute(
            """
            INSERT INTO tb_users (
                id_user,
                nm_email,
                nm_completo,
                nm_papel,
                nm_password_hash,
                st_ativo,
                nr_total_logins,
                id_empresa,
                id_perfil,
                nm_cargo,
                dt_criacao,
                dt_atualizacao
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
            )
            """,
            user_id,
            email,
            nome_completo,
            "admin",
            password_hash,
            "S",
            "0",
            empresa_id,
            perfil_id,
            "Administrador do Sistema"
        )

        print("\n✅ Usuário administrador criado com sucesso!")
        print(f"\n📋 Dados de acesso:")
        print(f"   Email: {email}")
        print(f"   Senha: {senha}")
        print(f"   Papel: admin")
        print(f"   Perfil: Administrador")

        print(f"\n🌐 Acesse o sistema:")
        print(f"   Frontend: http://localhost:3000/login")
        print(f"   Backend API: http://localhost:8080/docs")

    except Exception as e:
        print(f"\n❌ Erro ao criar usuário: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(criar_usuario_admin())
