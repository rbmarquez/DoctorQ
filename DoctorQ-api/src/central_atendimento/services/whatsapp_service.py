# src/central_atendimento/services/whatsapp_service.py
"""
Serviço de integração com WhatsApp Business API (Meta Cloud API).

Este serviço implementa a integração OFICIAL com a Meta Cloud API,
que é a forma recomendada e segura de usar o WhatsApp Business.

Documentação oficial: https://developers.facebook.com/docs/whatsapp/cloud-api

Custos aproximados (Brasil, 2024):
- Conversas iniciadas pelo usuário: ~R$ 0.08
- Conversas iniciadas pelo negócio (templates): ~R$ 0.15-0.50
"""

import uuid
import httpx
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from src.config.logger_config import get_logger
from src.central_atendimento.models.canal import Canal, CanalTipo
from src.central_atendimento.models.conversa_omni import (
    MensagemOmni,
    MensagemTipo,
    MensagemStatus,
)

logger = get_logger(__name__)


class WhatsAppMessageType(str, Enum):
    """Tipos de mensagem suportados pela API do WhatsApp."""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    STICKER = "sticker"
    LOCATION = "location"
    CONTACTS = "contacts"
    INTERACTIVE = "interactive"
    TEMPLATE = "template"
    REACTION = "reaction"


class WhatsAppService:
    """
    Serviço para integração com WhatsApp Business Cloud API.

    Esta é a implementação OFICIAL usando a Meta Cloud API,
    com zero risco de banimento.
    """

    BASE_URL = "https://graph.facebook.com/v18.0"

    def __init__(
        self,
        db: AsyncSession,
        id_empresa: uuid.UUID,
        access_token: Optional[str] = None,
        phone_number_id: Optional[str] = None,
    ):
        """
        Inicializa o serviço WhatsApp.

        Args:
            db: Sessão do banco de dados
            id_empresa: ID da empresa (multi-tenant)
            access_token: Token de acesso da Meta (opcional, pode vir do canal)
            phone_number_id: ID do número de telefone no WhatsApp Business
        """
        self.db = db
        self.id_empresa = id_empresa
        self._access_token = access_token
        self._phone_number_id = phone_number_id
        self._canal: Optional[Canal] = None

    async def _get_canal_whatsapp(self) -> Optional[Canal]:
        """Obtém o canal WhatsApp configurado para a empresa."""
        if self._canal:
            return self._canal

        stmt = select(Canal).where(
            Canal.id_empresa == self.id_empresa,
            Canal.tp_canal == CanalTipo.WHATSAPP,
            Canal.st_canal == "ativo",
        )
        result = await self.db.execute(stmt)
        self._canal = result.scalar_one_or_none()
        return self._canal

    async def _get_credentials(self) -> tuple[str, str]:
        """
        Obtém as credenciais do WhatsApp.

        Returns:
            Tuple com (access_token, phone_number_id)
        """
        if self._access_token and self._phone_number_id:
            return self._access_token, self._phone_number_id

        canal = await self._get_canal_whatsapp()
        if not canal:
            raise ValueError("Canal WhatsApp não configurado para esta empresa")

        credenciais = canal.ds_credenciais or {}
        access_token = credenciais.get("access_token")
        phone_number_id = canal.id_telefone_whatsapp or credenciais.get("phone_number_id")

        if not access_token or not phone_number_id:
            raise ValueError("Credenciais do WhatsApp não configuradas")

        return access_token, phone_number_id

    async def enviar_mensagem_texto(
        self,
        telefone: str,
        texto: str,
        preview_url: bool = False,
    ) -> Dict[str, Any]:
        """
        Envia uma mensagem de texto simples.

        Args:
            telefone: Número do destinatário (formato: 5511999999999)
            texto: Texto da mensagem
            preview_url: Se deve mostrar preview de links

        Returns:
            Resposta da API com message_id
        """
        access_token, phone_number_id = await self._get_credentials()

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": texto,
            },
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_mensagem_template(
        self,
        telefone: str,
        template_name: str,
        language_code: str = "pt_BR",
        components: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Envia uma mensagem usando um template aprovado.

        Templates são necessários para iniciar conversas (first contact)
        ou após 24h sem resposta do usuário.

        Args:
            telefone: Número do destinatário
            template_name: Nome do template aprovado
            language_code: Código do idioma (padrão pt_BR)
            components: Componentes dinâmicos do template (header, body, buttons)

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        template = {
            "name": template_name,
            "language": {"code": language_code},
        }

        if components:
            template["components"] = components

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "template",
            "template": template,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_imagem(
        self,
        telefone: str,
        url_imagem: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Envia uma imagem.

        Args:
            telefone: Número do destinatário
            url_imagem: URL pública da imagem
            caption: Legenda opcional

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        image_data = {"link": url_imagem}
        if caption:
            image_data["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "image",
            "image": image_data,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_documento(
        self,
        telefone: str,
        url_documento: str,
        filename: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Envia um documento (PDF, DOC, etc.).

        Args:
            telefone: Número do destinatário
            url_documento: URL pública do documento
            filename: Nome do arquivo
            caption: Legenda opcional

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        document_data = {
            "link": url_documento,
            "filename": filename,
        }
        if caption:
            document_data["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "document",
            "document": document_data,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_audio(
        self,
        telefone: str,
        url_audio: str,
    ) -> Dict[str, Any]:
        """
        Envia um áudio.

        Args:
            telefone: Número do destinatário
            url_audio: URL pública do áudio (formato: audio/ogg; codecs=opus recomendado)

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "audio",
            "audio": {"link": url_audio},
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_video(
        self,
        telefone: str,
        url_video: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Envia um vídeo.

        Args:
            telefone: Número do destinatário
            url_video: URL pública do vídeo (max 16MB para .mp4)
            caption: Legenda opcional

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        video_data = {"link": url_video}
        if caption:
            video_data["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "video",
            "video": video_data,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_localizacao(
        self,
        telefone: str,
        latitude: float,
        longitude: float,
        name: Optional[str] = None,
        address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Envia uma localização.

        Args:
            telefone: Número do destinatário
            latitude: Latitude
            longitude: Longitude
            name: Nome do local (opcional)
            address: Endereço (opcional)

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        location_data = {
            "latitude": str(latitude),
            "longitude": str(longitude),
        }
        if name:
            location_data["name"] = name
        if address:
            location_data["address"] = address

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "location",
            "location": location_data,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_botoes_interativos(
        self,
        telefone: str,
        texto_corpo: str,
        botoes: List[Dict[str, str]],
        texto_header: Optional[str] = None,
        texto_footer: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Envia mensagem com botões interativos (máximo 3 botões).

        Args:
            telefone: Número do destinatário
            texto_corpo: Texto principal da mensagem
            botoes: Lista de botões [{"id": "btn1", "title": "Opção 1"}, ...]
            texto_header: Texto do header (opcional)
            texto_footer: Texto do footer (opcional)

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        # Limitar a 3 botões (limite da API)
        botoes = botoes[:3]

        interactive = {
            "type": "button",
            "body": {"text": texto_corpo},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}}
                    for b in botoes
                ]
            },
        }

        if texto_header:
            interactive["header"] = {"type": "text", "text": texto_header}
        if texto_footer:
            interactive["footer"] = {"text": texto_footer}

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "interactive",
            "interactive": interactive,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_lista_interativa(
        self,
        telefone: str,
        texto_corpo: str,
        texto_botao: str,
        secoes: List[Dict[str, Any]],
        texto_header: Optional[str] = None,
        texto_footer: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Envia mensagem com lista interativa (menu de opções).

        Args:
            telefone: Número do destinatário
            texto_corpo: Texto principal da mensagem
            texto_botao: Texto do botão que abre a lista
            secoes: Seções da lista [{"title": "Seção", "rows": [{"id": "1", "title": "Item"}]}]
            texto_header: Texto do header (opcional)
            texto_footer: Texto do footer (opcional)

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        interactive = {
            "type": "list",
            "body": {"text": texto_corpo},
            "action": {
                "button": texto_botao[:20],
                "sections": secoes,
            },
        }

        if texto_header:
            interactive["header"] = {"type": "text", "text": texto_header}
        if texto_footer:
            interactive["footer"] = {"text": texto_footer}

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "interactive",
            "interactive": interactive,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def marcar_como_lida(self, message_id: str) -> Dict[str, Any]:
        """
        Marca uma mensagem como lida (blue ticks).

        Args:
            message_id: ID da mensagem recebida

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def enviar_reacao(
        self,
        telefone: str,
        message_id: str,
        emoji: str,
    ) -> Dict[str, Any]:
        """
        Envia uma reação (emoji) a uma mensagem.

        Args:
            telefone: Número do destinatário
            message_id: ID da mensagem a reagir
            emoji: Emoji da reação

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self._formatar_telefone(telefone),
            "type": "reaction",
            "reaction": {
                "message_id": message_id,
                "emoji": emoji,
            },
        }

        return await self._send_request(phone_number_id, access_token, payload)

    async def obter_perfil_negocio(self) -> Dict[str, Any]:
        """
        Obtém informações do perfil do WhatsApp Business.

        Returns:
            Dados do perfil
        """
        access_token, phone_number_id = await self._get_credentials()

        url = f"{self.BASE_URL}/{phone_number_id}/whatsapp_business_profile"
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"fields": "about,address,description,email,profile_picture_url,websites,vertical"}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    async def atualizar_perfil_negocio(
        self,
        about: Optional[str] = None,
        description: Optional[str] = None,
        address: Optional[str] = None,
        email: Optional[str] = None,
        websites: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Atualiza o perfil do WhatsApp Business.

        Args:
            about: Texto "Sobre" (max 139 caracteres)
            description: Descrição (max 512 caracteres)
            address: Endereço (max 256 caracteres)
            email: Email (max 128 caracteres)
            websites: Lista de websites (max 2)

        Returns:
            Resposta da API
        """
        access_token, phone_number_id = await self._get_credentials()

        url = f"{self.BASE_URL}/{phone_number_id}/whatsapp_business_profile"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload = {"messaging_product": "whatsapp"}
        if about:
            payload["about"] = about[:139]
        if description:
            payload["description"] = description[:512]
        if address:
            payload["address"] = address[:256]
        if email:
            payload["email"] = email[:128]
        if websites:
            payload["websites"] = websites[:2]

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def listar_templates(self) -> Dict[str, Any]:
        """
        Lista todos os templates de mensagem aprovados.

        Returns:
            Lista de templates
        """
        access_token, phone_number_id = await self._get_credentials()

        # Precisamos do Business Account ID
        canal = await self._get_canal_whatsapp()
        if not canal:
            raise ValueError("Canal WhatsApp não configurado")

        waba_id = canal.id_conta_whatsapp or canal.ds_credenciais.get("waba_id")
        if not waba_id:
            raise ValueError("WABA ID não configurado")

        url = f"{self.BASE_URL}/{waba_id}/message_templates"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    async def _send_request(
        self,
        phone_number_id: str,
        access_token: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Envia requisição para a API do WhatsApp.

        Args:
            phone_number_id: ID do número de telefone
            access_token: Token de acesso
            payload: Dados da requisição

        Returns:
            Resposta da API
        """
        url = f"{self.BASE_URL}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)

                if response.status_code >= 400:
                    error_data = response.json()
                    logger.error(f"Erro WhatsApp API: {error_data}")
                    raise WhatsAppAPIError(
                        message=error_data.get("error", {}).get("message", "Erro desconhecido"),
                        code=error_data.get("error", {}).get("code"),
                        details=error_data,
                    )

                result = response.json()
                logger.info(f"Mensagem enviada com sucesso: {result}")

                # Atualizar métricas do canal
                await self._atualizar_metricas_envio()

                return result

        except httpx.TimeoutException:
            logger.error("Timeout na requisição para WhatsApp API")
            raise WhatsAppAPIError(message="Timeout na requisição", code="TIMEOUT")
        except httpx.RequestError as e:
            logger.error(f"Erro de rede WhatsApp API: {e}")
            raise WhatsAppAPIError(message=f"Erro de rede: {str(e)}", code="NETWORK_ERROR")

    async def _atualizar_metricas_envio(self):
        """Atualiza métricas de envio do canal."""
        try:
            canal = await self._get_canal_whatsapp()
            if canal:
                stmt = (
                    update(Canal)
                    .where(Canal.id_canal == canal.id_canal)
                    .values(
                        nr_mensagens_enviadas=Canal.nr_mensagens_enviadas + 1,
                        dt_ultima_mensagem=datetime.utcnow(),
                    )
                )
                await self.db.execute(stmt)
                await self.db.commit()
        except Exception as e:
            logger.warning(f"Erro ao atualizar métricas: {e}")

    @staticmethod
    def _formatar_telefone(telefone: str) -> str:
        """
        Formata o telefone para o padrão do WhatsApp.

        Remove caracteres especiais e garante formato internacional.

        Args:
            telefone: Número do telefone

        Returns:
            Telefone formatado (ex: 5511999999999)
        """
        # Remove tudo que não é dígito
        telefone = "".join(filter(str.isdigit, telefone))

        # Se começar com 0, remove
        if telefone.startswith("0"):
            telefone = telefone[1:]

        # Se não tiver código do país, assume Brasil (55)
        if len(telefone) <= 11:
            telefone = "55" + telefone

        return telefone


class WhatsAppAPIError(Exception):
    """Exceção para erros da API do WhatsApp."""

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)
