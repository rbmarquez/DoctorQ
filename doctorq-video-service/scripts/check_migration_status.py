"""
Script para Verificar Status da Migração de Vídeos

Mostra estatísticas detalhadas sobre o progresso da migração:
- Quantos vídeos ainda estão no Vimeo
- Quantos foram migrados para HLS
- Status do processamento (pending, processing, completed, failed)
- Progresso individual de cada vídeo

Uso:
    python scripts/check_migration_status.py
    python scripts/check_migration_status.py --detailed
    python scripts/check_migration_status.py --export status.json
"""

import asyncio
import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List
from datetime import datetime
from sqlalchemy import select, func
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


# Database models (simplified)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
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


async def get_migration_stats(db: AsyncSession) -> Dict:
    """
    Obtém estatísticas da migração

    Returns:
        dict com estatísticas detalhadas
    """
    # Total por provider
    stmt_provider = select(
        Aula.video_provider,
        func.count(Aula.id_aula).label("total")
    ).where(
        Aula.video_provider.in_(["vimeo", "hls"])
    ).group_by(Aula.video_provider)

    result_provider = await db.execute(stmt_provider)
    provider_stats = {row.video_provider: row.total for row in result_provider}

    # Total por status (apenas HLS)
    stmt_status = select(
        Aula.video_status,
        func.count(Aula.id_aula).label("total")
    ).where(
        Aula.video_provider == "hls"
    ).group_by(Aula.video_status)

    result_status = await db.execute(stmt_status)
    status_stats = {row.video_status or "pending": row.total for row in result_status}

    # Progresso médio (apenas processing e completed)
    stmt_progress = select(
        func.avg(Aula.video_processing_progress).label("avg_progress")
    ).where(
        Aula.video_provider == "hls",
        Aula.video_processing_progress.isnot(None)
    )

    result_progress = await db.execute(stmt_progress)
    avg_progress = result_progress.scalar() or 0

    return {
        "providers": provider_stats,
        "status": status_stats,
        "avg_progress": round(float(avg_progress), 2)
    }


async def get_detailed_aulas(db: AsyncSession, provider: str = None) -> List[Dict]:
    """
    Obtém lista detalhada de aulas

    Args:
        provider: Filtrar por provider (vimeo, hls, ou None para todos)

    Returns:
        Lista de dicts com informações das aulas
    """
    stmt = select(Aula)

    if provider:
        stmt = stmt.where(Aula.video_provider == provider)
    else:
        stmt = stmt.where(Aula.video_provider.in_(["vimeo", "hls"]))

    stmt = stmt.order_by(Aula.titulo)

    result = await db.execute(stmt)
    aulas = result.scalars().all()

    return [
        {
            "id_aula": str(aula.id_aula),
            "titulo": aula.titulo,
            "provider": aula.video_provider,
            "video_id": aula.video_id,
            "status": aula.video_status,
            "progress": aula.video_processing_progress,
            "metadata": aula.video_metadata
        }
        for aula in aulas
    ]


def print_stats(stats: Dict):
    """Imprime estatísticas formatadas"""

    print("\n" + "=" * 80)
    print("📊 ESTATÍSTICAS DE MIGRAÇÃO DE VÍDEOS")
    print("=" * 80)

    # Providers
    print("\n🎬 Por Provider:")
    vimeo_count = stats["providers"].get("vimeo", 0)
    hls_count = stats["providers"].get("hls", 0)
    total_videos = vimeo_count + hls_count

    if total_videos > 0:
        hls_percent = (hls_count / total_videos) * 100
        vimeo_percent = (vimeo_count / total_videos) * 100
    else:
        hls_percent = vimeo_percent = 0

    print(f"  • Vimeo: {vimeo_count:3d} ({vimeo_percent:5.1f}%)")
    print(f"  • HLS:   {hls_count:3d} ({hls_percent:5.1f}%)")
    print(f"  ─────────────────────")
    print(f"  • Total: {total_videos:3d}")

    # Status (apenas HLS)
    if hls_count > 0:
        print("\n⚡ Status dos Vídeos HLS:")
        status_order = ["pending", "uploaded", "processing", "completed", "failed"]
        for status in status_order:
            count = stats["status"].get(status, 0)
            if count > 0:
                percent = (count / hls_count) * 100
                icon = {
                    "pending": "⏳",
                    "uploaded": "📤",
                    "processing": "🔄",
                    "completed": "✅",
                    "failed": "❌"
                }.get(status, "❓")
                print(f"  {icon} {status.capitalize():12s}: {count:3d} ({percent:5.1f}%)")

        # Progresso médio
        avg_progress = stats["avg_progress"]
        print(f"\n📈 Progresso Médio: {avg_progress:.1f}%")

    # Estimativa de conclusão
    processing_count = stats["status"].get("processing", 0)
    completed_count = stats["status"].get("completed", 0)
    pending_count = stats["status"].get("pending", 0) + stats["status"].get("uploaded", 0)

    print("\n🎯 Resumo:")
    print(f"  ✅ Concluídos:     {completed_count}")
    print(f"  🔄 Processando:    {processing_count}")
    print(f"  ⏳ Pendentes:      {pending_count}")
    print(f"  🎬 Não migrados:   {vimeo_count}")

    print("\n" + "=" * 80 + "\n")


def print_detailed_aulas(aulas: List[Dict], title: str):
    """Imprime lista detalhada de aulas"""

    print(f"\n{title}")
    print("=" * 80)

    if not aulas:
        print("  Nenhuma aula encontrada.")
        return

    for i, aula in enumerate(aulas, 1):
        print(f"\n[{i}] {aula['titulo']}")
        print(f"    ID: {aula['id_aula']}")
        print(f"    Provider: {aula['provider']}")
        print(f"    Video ID: {aula['video_id']}")

        if aula['provider'] == 'hls':
            status_icon = {
                "pending": "⏳",
                "uploaded": "📤",
                "processing": "🔄",
                "completed": "✅",
                "failed": "❌"
            }.get(aula.get('status'), "❓")

            print(f"    Status: {status_icon} {aula.get('status', 'N/A')}")

            if aula.get('progress') is not None:
                print(f"    Progresso: {aula['progress']}%")

            if aula.get('metadata'):
                metadata = aula['metadata']
                if metadata.get('migrated_from'):
                    print(f"    Migrado de: {metadata['migrated_from']}")
                    print(f"    ID Original: {metadata.get('original_vimeo_id')}")

                if metadata.get('hls_master_playlist'):
                    print(f"    Playlist: {metadata['hls_master_playlist']}")

                if metadata.get('qualities'):
                    qualities = metadata['qualities']
                    print(f"    Qualidades: {', '.join(qualities)}")

    print("\n" + "=" * 80)


def export_to_json(stats: Dict, aulas: List[Dict], output_file: str):
    """Exporta dados para JSON"""

    data = {
        "timestamp": datetime.utcnow().isoformat(),
        "statistics": stats,
        "aulas": aulas
    }

    output_path = Path(output_file)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Dados exportados para: {output_path.absolute()}")


async def main(args):
    """Função principal"""

    # Criar engine do banco
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as db:
            # Obter estatísticas
            stats = await get_migration_stats(db)

            # Imprimir estatísticas
            print_stats(stats)

            # Modo detalhado
            if args.detailed:
                # Vimeo (não migrados)
                aulas_vimeo = await get_detailed_aulas(db, provider="vimeo")
                if aulas_vimeo:
                    print_detailed_aulas(
                        aulas_vimeo,
                        f"📹 VÍDEOS AINDA NO VIMEO ({len(aulas_vimeo)} aulas)"
                    )

                # HLS em processamento
                aulas_hls = await get_detailed_aulas(db, provider="hls")
                aulas_processing = [
                    a for a in aulas_hls
                    if a.get('status') in ['pending', 'uploaded', 'processing']
                ]
                if aulas_processing:
                    print_detailed_aulas(
                        aulas_processing,
                        f"🔄 VÍDEOS EM PROCESSAMENTO ({len(aulas_processing)} aulas)"
                    )

                # HLS completos
                aulas_completed = [
                    a for a in aulas_hls
                    if a.get('status') == 'completed'
                ]
                if aulas_completed:
                    print_detailed_aulas(
                        aulas_completed,
                        f"✅ VÍDEOS CONCLUÍDOS ({len(aulas_completed)} aulas)"
                    )

                # HLS falhados
                aulas_failed = [
                    a for a in aulas_hls
                    if a.get('status') == 'failed'
                ]
                if aulas_failed:
                    print_detailed_aulas(
                        aulas_failed,
                        f"❌ VÍDEOS COM FALHA ({len(aulas_failed)} aulas)"
                    )

            # Exportar para JSON
            if args.export:
                all_aulas = await get_detailed_aulas(db)
                export_to_json(stats, all_aulas, args.export)

            return 0

    finally:
        await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Verifica status da migração de vídeos do Vimeo para HLS"
    )
    parser.add_argument(
        "--detailed",
        action="store_true",
        help="Mostra lista detalhada de todas as aulas"
    )
    parser.add_argument(
        "--export",
        type=str,
        metavar="FILE",
        help="Exporta dados para arquivo JSON (ex: status.json)"
    )

    args = parser.parse_args()

    exit_code = asyncio.run(main(args))
    sys.exit(exit_code)
