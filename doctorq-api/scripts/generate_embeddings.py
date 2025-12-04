"""
Script para gerar embeddings dos chunks existentes que não têm embeddings
Versão simplificada sem dependências complexas
"""
import asyncio
import os
import sys
import json
from typing import List
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Carregar variáveis de ambiente do .env
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from openai import AsyncAzureOpenAI

import base64
import hashlib
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


async def generate_embeddings_batch(
    client: AsyncAzureOpenAI,
    texts: List[str],
    model: str,
    batch_size: int = 16
) -> List[List[float]]:
    """Gera embeddings para múltiplos textos em lotes"""
    all_embeddings = []

    # Azure OpenAI suporta até 16 textos por requisição
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]

        # Limitar tamanho dos textos (8000 chars ~ 2000 tokens)
        max_chars = 8000
        processed_batch = [
            text[:max_chars] if len(text) > max_chars else text
            for text in batch
        ]

        print(f"📊 Gerando embeddings do lote {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size} ({len(processed_batch)} textos)...")

        response = await client.embeddings.create(
            model=model,
            input=processed_batch,
            encoding_format="float"
        )

        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings


def decrypt_aes_cbc(encrypted_data: str, key_str: str) -> str:
    """Descriptografa dados usando AES-256-CBC (mesmo método que o sistema usa)"""
    # Derivar chave de 32 bytes usando SHA-256
    key = hashlib.sha256(key_str.encode('utf-8')).digest()

    # Decodificar base64
    encrypted_bytes = base64.b64decode(encrypted_data)

    # Extrair IV (primeiros 16 bytes) e ciphertext
    iv = encrypted_bytes[:16]
    ciphertext = encrypted_bytes[16:]

    # Descriptografar
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(ciphertext) + decryptor.finalize()

    # Remover padding PKCS7
    unpadder = padding.PKCS7(128).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()

    return data.decode('utf-8')


async def get_azure_embedding_credential(session: AsyncSession) -> dict:
    """Busca a credencial Azure OpenAI Embedding do banco de dados usando SQL direto"""
    try:
        # Buscar credencial usando SQL direto
        query = text("""
            SELECT id_credencial, nome, nome_credencial, dados_criptografado
            FROM tb_credenciais
            WHERE nome_credencial = 'azureOpenIaEmbbedApi'
            LIMIT 1
        """)

        result = await session.execute(query)
        row = result.first()

        if not row:
            print("❌ Credencial 'azureOpenIaEmbbedApi' não encontrada")
            return None

        print(f"✅ Credencial encontrada: {row.nome}")

        # Descriptografar credencial usando AES-256-CBC
        encryption_key = os.getenv("DATA_ENCRYPTION_KEY")
        if not encryption_key:
            print("❌ DATA_ENCRYPTION_KEY não encontrada no ambiente")
            return None

        dados_decrypted = decrypt_aes_cbc(row.dados_criptografado, encryption_key)
        dados = json.loads(dados_decrypted)

        return {
            'id_credencial': str(row.id_credencial),
            'nome': row.nome,
            'nome_credencial': row.nome_credencial,
            'dados': dados
        }

    except Exception as e:
        print(f"❌ Erro ao buscar/descriptografar credencial: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def main():
    """Função principal"""
    print("🚀 Iniciando geração de embeddings para chunks existentes...")
    print("📌 Usando credencial Azure OpenAI Embedding (azureOpenIaEmbbedApi)")

    # Construir DATABASE_URL a partir das variáveis de ambiente
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        # Construir a partir das variáveis individuais
        db_host = os.getenv("DATABASE_HOST", "localhost")
        db_name = os.getenv("DATABASE_NAME", "inovaia")
        db_user = os.getenv("DATABASE_USERNAME", "postgres")
        db_pass = os.getenv("DATABASE_PASSWORD", "postgres")
        database_url = f"postgresql+asyncpg://{db_user}:{db_pass}@{db_host}/{db_name}"
        print(f"📝 DATABASE_URL construída: postgresql+asyncpg://{db_user}:***@{db_host}/{db_name}")

    print("🔌 Conectando ao banco de dados...")
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Buscar credencial Azure OpenAI Embedding
        print("🔍 Buscando credencial Azure OpenAI Embedding no banco de dados...")
        credential = await get_azure_embedding_credential(session)

        if not credential:
            print("❌ ERRO: Credencial 'azureOpenIaEmbbedApi' não encontrada!")
            print("💡 Verifique se a credencial foi cadastrada no sistema")
            await engine.dispose()
            return

        # Extrair dados da credencial
        dados = credential.get('dados', {})
        api_key = dados.get('api_key')
        endpoint = dados.get('endpoint')
        # Usar API version v válida (2024-02-01 é estável)
        api_version = '2024-02-01'
        # O deployment_name está na credencial
        deployment_name = dados.get('deployment_name', 'text-embedding-3-small')

        print(f"🔧 Ajustando API version para: {api_version} (versão estável)")

        if not api_key or not endpoint:
            print("❌ ERRO: Credencial inválida (faltam api_key ou endpoint)")
            await engine.dispose()
            return

        print(f"✅ Configuração Azure OpenAI:")
        print(f"   Endpoint: {endpoint}")
        print(f"   Deployment: {deployment_name}")
        print(f"   API Version: {api_version}")

        # Criar cliente Azure OpenAI
        client = AsyncAzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint
        )

        # Continuar com a geração de embeddings
        try:
            # Buscar chunks sem embeddings usando SQL direto
            print("\n🔍 Buscando chunks sem embeddings...")
            query = text("""
                SELECT id_chunk, ds_page_content
                FROM tb_documento_store_file_chunk
                WHERE ds_embedding IS NULL
                ORDER BY nr_chunk
            """)

            result = await session.execute(query)
            rows = result.fetchall()

            if not rows:
                print("✅ Todos os chunks já têm embeddings!")
                await engine.dispose()
                return

            total_chunks = len(rows)
            print(f"📦 Encontrados {total_chunks} chunks sem embeddings")

            # Preparar dados
            chunk_ids = [row.id_chunk for row in rows]
            texts = [row.ds_page_content for row in rows]

            # Gerar embeddings em lotes de 16 (limite do Azure OpenAI)
            print(f"\n🤖 Gerando embeddings com Azure OpenAI ({deployment_name})...")
            print(f"⏱️  Processando em lotes de 16 textos por requisição...")
            embeddings = await generate_embeddings_batch(
                client,
                texts,
                model=deployment_name,
                batch_size=16
            )

            # Atualizar chunks com embeddings usando SQL direto
            print("\n💾 Salvando embeddings no banco de dados...")
            updated = 0
            for chunk_id, embedding in zip(chunk_ids, embeddings):
                if embedding:
                    # Converter lista de floats para string formato pgvector
                    embedding_str = '[' + ','.join(map(str, embedding)) + ']'

                    # asyncpg com SQLAlchemy usa :param
                    update_query = text("""
                        UPDATE tb_documento_store_file_chunk
                        SET ds_embedding = CAST(:embedding AS vector)
                        WHERE id_chunk = CAST(:chunk_id AS uuid)
                    """)

                    await session.execute(
                        update_query,
                        {"embedding": embedding_str, "chunk_id": str(chunk_id)}
                    )
                    updated += 1

                    if updated % 50 == 0:
                        print(f"   Progresso: {updated}/{total_chunks} embeddings salvos...")

            await session.commit()

            print(f"\n✅ Embeddings gerados com sucesso!")
            print(f"📊 Total de chunks atualizados: {updated}/{total_chunks}")

        except Exception as e:
            print(f"\n❌ Erro: {str(e)}")
            import traceback
            traceback.print_exc()
            await session.rollback()
            raise

    await engine.dispose()
    print("\n👋 Processo concluído!")


if __name__ == "__main__":
    asyncio.run(main())
