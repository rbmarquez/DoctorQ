"""
Script de Migração de Vídeos do Vimeo para Sistema HLS Self-Hosted

Este script:
1. Lista todas as aulas com vídeos do Vimeo no banco de dados
2. Baixa os vídeos do Vimeo (requer credenciais)
3. Faz upload para o sistema HLS self-hosted
4. Atualiza o banco de dados com as novas informações

Uso:
    python scripts/migrate_from_vimeo.py --dry-run  # Mostra o que seria feito
    python scripts/migrate_from_vimeo.py             # Executa a migração
    python scripts/migrate_from_vimeo.py --limit 5   # Migra apenas 5 vídeos
"""

import asyncio
import argparse
import os
import sys
from pathlib import Path
from typing import List, Optional
import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config.logger import logger


# Configurações
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/doctorq_univ"
)
VIDEO_API_URL = os.getenv("VIDEO_API_URL", "http://localhost:8083")
VIDEO_API_KEY = os.getenv("API_KEY", "vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX")
VIMEO_ACCESS_TOKEN = os.getenv("VIMEO_ACCESS_TOKEN", "")

TEMP_DOWNLOAD_DIR = Path("/tmp/vimeo_migration")
TEMP_DOWNLOAD_DIR.mkdir(exist_ok=True)


# Database models (simplified)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, Integer, DateTime, Text, ARRAY, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

Base = declarative_base()


class Aula(Base):
    """Modelo simplificado da tabela tb_universidade_aulas"""
    __tablename__ = "tb_universidade_aulas"

    id_aula = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(255))
    descricao = Column(Text)
    video_provider = Column(String(50))
    video_id = Column(String(255))
    video_status = Column(String(50))
    video_processing_progress = Column(Integer)
    video_metadata = Column(JSONB)


class VimeoAPI:
    """Cliente para a API do Vimeo"""

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.vimeo.com"
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.vimeo.*+json;version=3.4"
            },
            timeout=300.0
        )

    async def get_video_info(self, video_id: str) -> dict:
        """
        Obtém informações do vídeo

        Args:
            video_id: ID do vídeo Vimeo (ex: "123456789")

        Returns:
            dict com informações do vídeo
        """
        try:
            response = await self.client.get(f"{self.base_url}/videos/{video_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao obter info do vídeo {video_id}: {e}")
            raise

    async def get_download_link(self, video_id: str) -> Optional[str]:
        """
        Obtém link de download do vídeo em melhor qualidade

        Args:
            video_id: ID do vídeo Vimeo

        Returns:
            URL de download ou None se não disponível
        """
        try:
            video_info = await self.get_video_info(video_id)
            files = video_info.get("files", [])

            # Ordenar por qualidade (maior primeiro)
            files_sorted = sorted(
                files,
                key=lambda x: x.get("width", 0) * x.get("height", 0),
                reverse=True
            )

            if files_sorted:
                return files_sorted[0].get("link")

            logger.warning(f"Nenhum arquivo de download disponível para {video_id}")
            return None

        except Exception as e:
            logger.error(f"Erro ao obter link de download {video_id}: {e}")
            return None

    async def download_video(self, video_id: str, output_path: Path) -> bool:
        """
        Baixa vídeo do Vimeo

        Args:
            video_id: ID do vídeo Vimeo
            output_path: Caminho para salvar o arquivo

        Returns:
            True se sucesso, False caso contrário
        """
        try:
            download_url = await self.get_download_link(video_id)
            if not download_url:
                return False

            logger.info(f"📥 Baixando vídeo {video_id} do Vimeo...")

            async with self.client.stream("GET", download_url) as response:
                response.raise_for_status()

                total_size = int(response.headers.get("content-length", 0))
                downloaded = 0

                with open(output_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        f.write(chunk)
                        downloaded += len(chunk)

                        # Progress
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            if downloaded % (1024 * 1024 * 10) == 0:  # Log a cada 10MB
                                logger.info(f"  Progresso: {progress:.1f}% ({downloaded}/{total_size} bytes)")

            logger.info(f"✅ Download completo: {output_path}")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao baixar vídeo {video_id}: {e}")
            return False

    async def close(self):
        """Fecha o cliente HTTP"""
        await self.client.aclose()


class VideoServiceAPI:
    """Cliente para a API do Video Service"""

    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {api_key}"
            },
            timeout=600.0  # 10 minutos para upload
        )

    async def upload_video(
        self,
        file_path: Path,
        titulo: str,
        id_aula: str
    ) -> Optional[dict]:
        """
        Faz upload de vídeo para o sistema HLS

        Args:
            file_path: Caminho do arquivo de vídeo
            titulo: Título do vídeo
            id_aula: UUID da aula

        Returns:
            dict com resposta da API ou None se falhou
        """
        try:
            logger.info(f"📤 Fazendo upload de {file_path.name} para sistema HLS...")

            with open(file_path, "rb") as f:
                files = {"file": (file_path.name, f, "video/mp4")}
                data = {
                    "titulo": titulo,
                    "id_aula": id_aula
                }

                response = await self.client.post(
                    f"{self.api_url}/api/videos/upload",
                    files=files,
                    data=data
                )
                response.raise_for_status()

                result = response.json()
                logger.info(f"✅ Upload completo: video_id={result.get('video_id')}")
                return result

        except Exception as e:
            logger.error(f"❌ Erro ao fazer upload: {e}")
            return None

    async def get_video_status(self, video_id: str) -> Optional[dict]:
        """
        Verifica status do processamento

        Args:
            video_id: UUID do vídeo

        Returns:
            dict com status ou None se falhou
        """
        try:
            response = await self.client.get(
                f"{self.api_url}/api/videos/{video_id}/status"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao obter status do vídeo {video_id}: {e}")
            return None

    async def close(self):
        """Fecha o cliente HTTP"""
        await self.client.aclose()


async def get_vimeo_aulas(db: AsyncSession, limit: Optional[int] = None) -> List[Aula]:
    """
    Lista todas as aulas que usam Vimeo

    Args:
        db: Sessão do banco de dados
        limit: Limitar número de resultados

    Returns:
        Lista de objetos Aula
    """
    stmt = select(Aula).where(
        Aula.video_provider == "vimeo"
    ).order_by(Aula.titulo)

    if limit:
        stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    return result.scalars().all()


async def migrate_aula(
    aula: Aula,
    vimeo_api: VimeoAPI,
    video_api: VideoServiceAPI,
    db: AsyncSession,
    dry_run: bool = False
) -> bool:
    """
    Migra uma única aula do Vimeo para HLS

    Args:
        aula: Objeto Aula do banco
        vimeo_api: Cliente da API Vimeo
        video_api: Cliente da API Video Service
        db: Sessão do banco de dados
        dry_run: Se True, não executa de fato

    Returns:
        True se migração foi bem-sucedida
    """
    try:
        logger.info(f"\n{'='*80}")
        logger.info(f"🎬 Migrando: {aula.titulo}")
        logger.info(f"   ID Aula: {aula.id_aula}")
        logger.info(f"   Vimeo ID: {aula.video_id}")

        if dry_run:
            logger.info("   [DRY RUN] Migração seria executada")
            return True

        # 1. Download do Vimeo
        video_file = TEMP_DOWNLOAD_DIR / f"{aula.id_aula}.mp4"

        success = await vimeo_api.download_video(aula.video_id, video_file)
        if not success:
            logger.error(f"❌ Falha no download do Vimeo")
            return False

        # 2. Upload para sistema HLS
        upload_result = await video_api.upload_video(
            file_path=video_file,
            titulo=aula.titulo,
            id_aula=str(aula.id_aula)
        )

        if not upload_result:
            logger.error(f"❌ Falha no upload para sistema HLS")
            video_file.unlink(missing_ok=True)
            return False

        new_video_id = upload_result.get("video_id")

        # 3. Atualizar banco de dados
        stmt = (
            update(Aula)
            .where(Aula.id_aula == aula.id_aula)
            .values(
                video_provider="hls",
                video_id=new_video_id,
                video_status="processing",
                video_processing_progress=0,
                video_metadata={
                    "migrated_from": "vimeo",
                    "original_vimeo_id": aula.video_id,
                    "upload_response": upload_result
                }
            )
        )

        await db.execute(stmt)
        await db.commit()

        logger.info(f"✅ Aula atualizada no banco: provider=hls, video_id={new_video_id}")

        # 4. Limpar arquivo temporário
        video_file.unlink(missing_ok=True)
        logger.info(f"🧹 Arquivo temporário removido")

        logger.info(f"✅ Migração completa!")
        return True

    except Exception as e:
        logger.error(f"❌ Erro ao migrar aula {aula.id_aula}: {e}")
        return False


async def main(args):
    """Função principal de migração"""

    # Validar configurações
    if not VIMEO_ACCESS_TOKEN and not args.dry_run:
        logger.error("❌ VIMEO_ACCESS_TOKEN não configurado!")
        logger.error("   Configure via: export VIMEO_ACCESS_TOKEN='seu_token'")
        return 1

    # Criar engine do banco
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Inicializar APIs
    vimeo_api = VimeoAPI(VIMEO_ACCESS_TOKEN) if VIMEO_ACCESS_TOKEN else None
    video_api = VideoServiceAPI(VIDEO_API_URL, VIDEO_API_KEY)

    try:
        async with async_session() as db:
            # Listar aulas com Vimeo
            logger.info("🔍 Buscando aulas com vídeos do Vimeo...")
            aulas = await get_vimeo_aulas(db, limit=args.limit)

            if not aulas:
                logger.info("✅ Nenhuma aula com Vimeo encontrada!")
                return 0

            logger.info(f"📊 Encontradas {len(aulas)} aulas para migrar")

            if args.dry_run:
                logger.info("\n🔍 DRY RUN - Nenhuma ação será executada\n")

            # Estatísticas
            success_count = 0
            failed_count = 0

            # Migrar cada aula
            for i, aula in enumerate(aulas, 1):
                logger.info(f"\n[{i}/{len(aulas)}] Processando aula...")

                success = await migrate_aula(
                    aula=aula,
                    vimeo_api=vimeo_api,
                    video_api=video_api,
                    db=db,
                    dry_run=args.dry_run
                )

                if success:
                    success_count += 1
                else:
                    failed_count += 1

                # Delay entre migrações para não sobrecarregar
                if i < len(aulas) and not args.dry_run:
                    logger.info("⏳ Aguardando 5 segundos antes da próxima...")
                    await asyncio.sleep(5)

            # Relatório final
            logger.info(f"\n{'='*80}")
            logger.info(f"📊 RELATÓRIO FINAL")
            logger.info(f"{'='*80}")
            logger.info(f"Total de aulas: {len(aulas)}")
            logger.info(f"✅ Sucessos: {success_count}")
            logger.info(f"❌ Falhas: {failed_count}")
            logger.info(f"{'='*80}\n")

            return 0 if failed_count == 0 else 1

    finally:
        if vimeo_api:
            await vimeo_api.close()
        await video_api.close()
        await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Migra vídeos do Vimeo para sistema HLS self-hosted"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula a migração sem executar (mostra o que seria feito)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limita o número de vídeos a migrar (útil para testes)"
    )

    args = parser.parse_args()

    exit_code = asyncio.run(main(args))
    sys.exit(exit_code)
