"""
Upload de Fotos com Processamento de Imagem
"""

import io
import os
import uuid
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from PIL import Image
import piexif
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.utils.auth import get_current_apikey

logger = get_logger(__name__)

router = APIRouter(prefix="/fotos", tags=["fotos-upload"])

# Diretório para uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
THUMBNAILS_DIR = UPLOAD_DIR / "thumbnails"
THUMBNAILS_DIR.mkdir(exist_ok=True)

# Configurações
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
THUMBNAIL_SIZE = (300, 300)


# ============================================
# Helper Functions
# ============================================

def extract_exif_data(image: Image.Image) -> dict:
    """Extrair dados EXIF da imagem"""
    try:
        exif_data = {}

        # Obter info EXIF se disponível
        if hasattr(image, '_getexif') and image._getexif():
            exif_dict = piexif.load(image.info.get("exif", b""))

            # GPS
            gps = exif_dict.get("GPS", {})
            if gps:
                exif_data["gps"] = {
                    "latitude": gps.get(piexif.GPSIFD.GPSLatitude),
                    "longitude": gps.get(piexif.GPSIFD.GPSLongitude),
                }

            # Camera info
            exif_info = exif_dict.get("0th", {})
            if exif_info:
                exif_data["camera"] = {
                    "make": exif_info.get(piexif.ImageIFD.Make, b"").decode("utf-8", errors="ignore"),
                    "model": exif_info.get(piexif.ImageIFD.Model, b"").decode("utf-8", errors="ignore"),
                }

            # Data da foto
            exif_details = exif_dict.get("Exif", {})
            if exif_details:
                date_str = exif_details.get(piexif.ExifIFD.DateTimeOriginal, b"").decode("utf-8", errors="ignore")
                if date_str:
                    exif_data["date_taken"] = date_str

        return exif_data
    except Exception as e:
        logger.warning(f"Erro ao extrair EXIF: {str(e)}")
        return {}


def create_thumbnail(image: Image.Image, size: tuple = THUMBNAIL_SIZE) -> Image.Image:
    """Criar thumbnail mantendo aspect ratio"""
    thumbnail = image.copy()
    thumbnail.thumbnail(size, Image.Resampling.LANCZOS)
    return thumbnail


def optimize_image(image: Image.Image, max_width: int = 1920) -> Image.Image:
    """Otimizar imagem para web"""
    # Redimensionar se muito grande
    if image.width > max_width:
        ratio = max_width / image.width
        new_height = int(image.height * ratio)
        image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)

    # Converter RGBA para RGB se necessário (para JPEG)
    if image.mode == "RGBA":
        rgb_image = Image.new("RGB", image.size, (255, 255, 255))
        rgb_image.paste(image, mask=image.split()[3])  # Alpha channel como mask
        return rgb_image

    return image


# ============================================
# Upload Endpoint
# ============================================

@router.post("/upload")
async def upload_foto(
    file: UploadFile = File(...),
    id_user: str = Form(...),
    ds_titulo: Optional[str] = Form(None),
    ds_legenda: Optional[str] = Form(None),
    ds_tipo_foto: Optional[str] = Form(None),
    id_album: Optional[str] = Form(None),
    id_agendamento: Optional[str] = Form(None),
    id_procedimento: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Upload de foto com processamento automático:
    - Validação de tipo e tamanho
    - Extração de EXIF
    - Geração de thumbnail
    - Otimização para web
    """
    try:
        # 1. Validar tipo de arquivo
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de arquivo não permitido. Aceitos: {', '.join(ALLOWED_TYPES)}"
            )

        # 2. Ler arquivo
        contents = await file.read()
        file_size = len(contents)

        # Validar tamanho
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

        # 3. Processar imagem
        try:
            image = Image.open(io.BytesIO(contents))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Arquivo não é uma imagem válida: {str(e)}")

        # 4. Extrair EXIF
        exif_data = extract_exif_data(image)
        dt_foto_tirada = None
        if "date_taken" in exif_data:
            try:
                dt_foto_tirada = datetime.strptime(exif_data["date_taken"], "%Y:%m:%d %H:%M:%S")
            except:
                pass

        # 5. Otimizar imagem
        image = optimize_image(image)
        width, height = image.size

        # 6. Gerar nomes únicos
        unique_id = str(uuid.uuid4())
        extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{unique_id}.{extension}"
        thumbnail_filename = f"{unique_id}_thumb.{extension}"

        # 7. Salvar imagem original otimizada
        original_path = UPLOAD_DIR / filename
        image.save(original_path, format="JPEG", quality=85, optimize=True)

        # 8. Criar e salvar thumbnail
        thumbnail = create_thumbnail(image)
        thumbnail_path = THUMBNAILS_DIR / thumbnail_filename
        thumbnail.save(thumbnail_path, format="JPEG", quality=85, optimize=True)

        # 9. URLs relativas (ou absoluta se tiver domínio)
        # Para desenvolvimento local, vamos usar path relativo
        base_url = "/uploads"  # Será servido por endpoint estático
        ds_url = f"{base_url}/{filename}"
        ds_thumbnail_url = f"{base_url}/thumbnails/{thumbnail_filename}"

        # 10. Salvar no banco de dados
        query = text("""
            INSERT INTO tb_fotos (
                id_user, id_album, ds_url, ds_thumbnail_url, nm_arquivo, ds_tipo_mime,
                nr_tamanho_bytes, nr_largura, nr_altura, ds_titulo, ds_legenda,
                ds_tipo_foto, id_agendamento, id_procedimento, dt_foto_tirada,
                ds_exif_data, st_processada
            )
            VALUES (
                :id_user, :id_album, :ds_url, :ds_thumbnail_url, :nm_arquivo, :ds_tipo_mime,
                :nr_tamanho_bytes, :nr_largura, :nr_altura, :ds_titulo, :ds_legenda,
                :ds_tipo_foto, :id_agendamento, :id_procedimento, :dt_foto_tirada,
                :ds_exif_data, :st_processada
            )
            RETURNING id_foto, dt_criacao
        """)

        result = await db.execute(query, {
            "id_user": id_user,
            "id_album": id_album,
            "ds_url": ds_url,
            "ds_thumbnail_url": ds_thumbnail_url,
            "nm_arquivo": file.filename,
            "ds_tipo_mime": file.content_type,
            "nr_tamanho_bytes": file_size,
            "nr_largura": width,
            "nr_altura": height,
            "ds_titulo": ds_titulo,
            "ds_legenda": ds_legenda,
            "ds_tipo_foto": ds_tipo_foto,
            "id_agendamento": id_agendamento,
            "id_procedimento": id_procedimento,
            "dt_foto_tirada": dt_foto_tirada,
            "ds_exif_data": exif_data or None,
            "st_processada": True,
        })

        await db.commit()
        row = result.fetchone()

        logger.info(f"Foto enviada com sucesso: {filename} ({file_size} bytes)")

        return {
            "id_foto": str(row[0]),
            "id_user": id_user,
            "id_album": id_album,
            "ds_url": ds_url,
            "ds_thumbnail_url": ds_thumbnail_url,
            "nm_arquivo": file.filename,
            "ds_tipo_mime": file.content_type,
            "nr_tamanho_bytes": file_size,
            "nr_largura": width,
            "nr_altura": height,
            "ds_titulo": ds_titulo,
            "ds_legenda": ds_legenda,
            "ds_tipo_foto": ds_tipo_foto,
            "dt_criacao": row[1].isoformat(),
            "st_processada": True,
            "exif_data": exif_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao fazer upload de foto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {str(e)}")


# ============================================
# Servir Arquivos Estáticos
# ============================================

@router.get("/static/{filename}")
async def get_uploaded_file(filename: str):
    """Servir arquivo de upload"""
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    return FileResponse(file_path)


@router.get("/static/thumbnails/{filename}")
async def get_thumbnail(filename: str):
    """Servir thumbnail"""
    file_path = THUMBNAILS_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail não encontrado")

    return FileResponse(file_path)
