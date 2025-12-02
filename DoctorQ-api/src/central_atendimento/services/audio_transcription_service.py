# src/central_atendimento/services/audio_transcription_service.py
"""
Serviço de transcrição de áudio para texto.

Inspirado no extractTextFromMedia do Maua, este serviço:
- Transcreve áudios do WhatsApp/outros canais
- Suporta múltiplos providers (OpenAI Whisper, Azure, local)
- Cache de transcrições para evitar reprocessamento
"""

import asyncio
import uuid
import tempfile
import os
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import httpx

from src.config.logger_config import get_logger

logger = get_logger(__name__)


class TranscriptionProvider(str, Enum):
    """Providers de transcrição suportados."""
    OPENAI_WHISPER = "openai_whisper"
    AZURE_SPEECH = "azure_speech"
    LOCAL_WHISPER = "local_whisper"


class AudioTranscriptionService:
    """
    Serviço de transcrição de áudio para texto.

    Suporta:
    - OpenAI Whisper API
    - Azure Speech Services
    - Whisper local (via faster-whisper)
    """

    # Formatos suportados
    SUPPORTED_FORMATS = {"ogg", "mp3", "wav", "m4a", "webm", "mp4", "mpeg", "mpga"}
    MAX_FILE_SIZE_MB = 25  # Limite do OpenAI Whisper

    def __init__(
        self,
        provider: TranscriptionProvider = TranscriptionProvider.OPENAI_WHISPER,
        openai_api_key: Optional[str] = None,
        azure_speech_key: Optional[str] = None,
        azure_speech_region: Optional[str] = None,
    ):
        """
        Inicializa o serviço.

        Args:
            provider: Provider de transcrição a usar
            openai_api_key: Chave da API OpenAI (para Whisper)
            azure_speech_key: Chave do Azure Speech Services
            azure_speech_region: Região do Azure Speech
        """
        self.provider = provider
        self._openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self._azure_speech_key = azure_speech_key or os.getenv("AZURE_SPEECH_KEY")
        self._azure_speech_region = azure_speech_region or os.getenv("AZURE_SPEECH_REGION")
        self._cache: Dict[str, str] = {}  # cache em memória simples
        self._stats = {
            "total_transcriptions": 0,
            "total_characters": 0,
            "cache_hits": 0,
            "errors": 0,
        }

    async def transcribe_from_url(
        self,
        audio_url: str,
        language: str = "pt",
        cache_key: Optional[str] = None,
    ) -> Optional[str]:
        """
        Transcreve áudio a partir de URL.

        Args:
            audio_url: URL do arquivo de áudio
            language: Código do idioma (pt, en, es, etc)
            cache_key: Chave para cache (ex: message_id)

        Returns:
            Texto transcrito ou None em caso de erro
        """
        # Verificar cache
        if cache_key and cache_key in self._cache:
            self._stats["cache_hits"] += 1
            logger.debug("Cache hit para transcrição: %s", cache_key)
            return self._cache[cache_key]

        try:
            # Download do áudio
            audio_data = await self._download_audio(audio_url)
            if not audio_data:
                return None

            # Transcrever
            text = await self._transcribe(audio_data, language)

            if text and cache_key:
                self._cache[cache_key] = text

            return text

        except Exception as e:
            logger.error("Erro ao transcrever áudio de URL: %s", str(e))
            self._stats["errors"] += 1
            return None

    async def transcribe_from_bytes(
        self,
        audio_data: bytes,
        language: str = "pt",
        file_extension: str = "ogg",
        cache_key: Optional[str] = None,
    ) -> Optional[str]:
        """
        Transcreve áudio a partir de bytes.

        Args:
            audio_data: Dados do áudio em bytes
            language: Código do idioma
            file_extension: Extensão do arquivo
            cache_key: Chave para cache

        Returns:
            Texto transcrito ou None em caso de erro
        """
        # Verificar cache
        if cache_key and cache_key in self._cache:
            self._stats["cache_hits"] += 1
            return self._cache[cache_key]

        try:
            text = await self._transcribe(audio_data, language, file_extension)

            if text and cache_key:
                self._cache[cache_key] = text

            return text

        except Exception as e:
            logger.error("Erro ao transcrever áudio: %s", str(e))
            self._stats["errors"] += 1
            return None

    async def transcribe_whatsapp_audio(
        self,
        media_id: str,
        phone_number_id: str,
        access_token: str,
        language: str = "pt",
    ) -> Optional[str]:
        """
        Transcreve áudio do WhatsApp usando a API da Meta.

        Args:
            media_id: ID da mídia no WhatsApp
            phone_number_id: ID do número de telefone
            access_token: Token de acesso da API
            language: Código do idioma

        Returns:
            Texto transcrito ou None em caso de erro
        """
        try:
            # 1. Obter URL de download
            async with httpx.AsyncClient() as client:
                # Obter info da mídia
                media_response = await client.get(
                    f"https://graph.facebook.com/v18.0/{media_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                media_response.raise_for_status()
                media_info = media_response.json()
                media_url = media_info.get("url")

                if not media_url:
                    logger.error("URL de mídia não encontrada para: %s", media_id)
                    return None

                # Download do áudio
                audio_response = await client.get(
                    media_url,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                audio_response.raise_for_status()
                audio_data = audio_response.content

            # Transcrever
            return await self.transcribe_from_bytes(
                audio_data,
                language=language,
                file_extension="ogg",  # WhatsApp usa OGG/Opus
                cache_key=media_id,
            )

        except Exception as e:
            logger.error("Erro ao transcrever áudio WhatsApp: %s", str(e))
            self._stats["errors"] += 1
            return None

    async def _download_audio(self, url: str) -> Optional[bytes]:
        """Faz download do áudio da URL."""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(url)
                response.raise_for_status()

                # Verificar tamanho
                content_length = len(response.content)
                if content_length > self.MAX_FILE_SIZE_MB * 1024 * 1024:
                    logger.warning(
                        "Áudio muito grande: %.2f MB (máx: %d MB)",
                        content_length / (1024 * 1024),
                        self.MAX_FILE_SIZE_MB,
                    )
                    return None

                return response.content

        except Exception as e:
            logger.error("Erro ao baixar áudio: %s", str(e))
            return None

    async def _transcribe(
        self,
        audio_data: bytes,
        language: str,
        file_extension: str = "ogg",
    ) -> Optional[str]:
        """Executa a transcrição usando o provider configurado."""
        if self.provider == TranscriptionProvider.OPENAI_WHISPER:
            return await self._transcribe_openai(audio_data, language, file_extension)
        elif self.provider == TranscriptionProvider.AZURE_SPEECH:
            return await self._transcribe_azure(audio_data, language)
        else:
            logger.error("Provider de transcrição não suportado: %s", self.provider)
            return None

    async def _transcribe_openai(
        self,
        audio_data: bytes,
        language: str,
        file_extension: str,
    ) -> Optional[str]:
        """Transcreve usando OpenAI Whisper API."""
        if not self._openai_api_key:
            logger.error("OPENAI_API_KEY não configurada")
            return None

        try:
            # Criar arquivo temporário
            with tempfile.NamedTemporaryFile(
                suffix=f".{file_extension}",
                delete=False,
            ) as temp_file:
                temp_file.write(audio_data)
                temp_path = temp_file.name

            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    with open(temp_path, "rb") as audio_file:
                        response = await client.post(
                            "https://api.openai.com/v1/audio/transcriptions",
                            headers={
                                "Authorization": f"Bearer {self._openai_api_key}",
                            },
                            files={"file": (f"audio.{file_extension}", audio_file)},
                            data={
                                "model": "whisper-1",
                                "language": language,
                                "response_format": "text",
                            },
                        )
                        response.raise_for_status()
                        text = response.text.strip()

                        self._stats["total_transcriptions"] += 1
                        self._stats["total_characters"] += len(text)

                        logger.debug(
                            "Transcrição OpenAI concluída: %d caracteres",
                            len(text),
                        )
                        return text

            finally:
                # Limpar arquivo temporário
                os.unlink(temp_path)

        except Exception as e:
            logger.error("Erro na transcrição OpenAI: %s", str(e))
            self._stats["errors"] += 1
            return None

    async def _transcribe_azure(
        self,
        audio_data: bytes,
        language: str,
    ) -> Optional[str]:
        """Transcreve usando Azure Speech Services."""
        if not self._azure_speech_key or not self._azure_speech_region:
            logger.error("Azure Speech não configurado")
            return None

        try:
            # Mapeamento de idiomas
            language_map = {
                "pt": "pt-BR",
                "en": "en-US",
                "es": "es-ES",
            }
            azure_language = language_map.get(language, "pt-BR")

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"https://{self._azure_speech_region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1",
                    params={"language": azure_language},
                    headers={
                        "Ocp-Apim-Subscription-Key": self._azure_speech_key,
                        "Content-Type": "audio/ogg; codecs=opus",
                    },
                    content=audio_data,
                )
                response.raise_for_status()
                result = response.json()

                text = result.get("DisplayText", "")
                if text:
                    self._stats["total_transcriptions"] += 1
                    self._stats["total_characters"] += len(text)

                return text

        except Exception as e:
            logger.error("Erro na transcrição Azure: %s", str(e))
            self._stats["errors"] += 1
            return None

    def clear_cache(self):
        """Limpa o cache de transcrições."""
        self._cache.clear()
        logger.debug("Cache de transcrições limpo")

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do serviço."""
        return {
            **self._stats,
            "provider": self.provider.value,
            "cache_size": len(self._cache),
        }


# Singleton do serviço
_transcription_service: Optional[AudioTranscriptionService] = None


def get_audio_transcription_service() -> AudioTranscriptionService:
    """Retorna instância singleton do serviço de transcrição."""
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = AudioTranscriptionService()
    return _transcription_service
