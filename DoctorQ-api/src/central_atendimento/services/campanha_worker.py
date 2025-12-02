# src/central_atendimento/services/campanha_worker.py
"""
Worker para execução de campanhas de marketing.

Processa campanhas agendadas e em execução, enviando mensagens
com rate limiting e controle de horário.
"""

import uuid
import asyncio
from datetime import datetime, time
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from src.config.logger_config import get_logger
from src.config.orm_config import get_async_session_context
from src.central_atendimento.models.campanha import (
    Campanha,
    CampanhaStatus,
    CampanhaDestinatario,
)
from src.central_atendimento.models.contato_omni import ContatoOmni
from src.central_atendimento.models.canal import CanalTipo
from src.central_atendimento.services.whatsapp_service import WhatsAppService
from src.central_atendimento.services.conversa_service import ConversaOmniService
from src.services.email_service import EmailService

logger = get_logger(__name__)


class CampanhaWorker:
    """
    Worker para processamento de campanhas.

    Features:
    - Execução de campanhas agendadas
    - Rate limiting por intervalo configurado
    - Respeito a horários de envio
    - Limite diário de envios
    - Rastreamento de métricas
    """

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._check_interval = 60  # Verificar campanhas a cada 60 segundos

    async def start(self):
        """Inicia o worker."""
        if self._running:
            logger.warning("CampanhaWorker já está em execução")
            return

        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("CampanhaWorker iniciado")

    async def stop(self):
        """Para o worker."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("CampanhaWorker parado")

    async def _loop(self):
        """Loop principal do worker."""
        while self._running:
            try:
                await self._processar_campanhas()
                await asyncio.sleep(self._check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Erro no loop do CampanhaWorker: {e}")
                await asyncio.sleep(10)  # Aguardar antes de tentar novamente

    async def _processar_campanhas(self):
        """Processa todas as campanhas ativas."""
        async with get_async_session_context() as db:
            # Buscar campanhas para processar
            campanhas = await self._obter_campanhas_para_processar(db)

            for campanha in campanhas:
                try:
                    await self._processar_campanha(db, campanha)
                except Exception as e:
                    logger.error(f"Erro ao processar campanha {campanha.id_campanha}: {e}")

    async def _obter_campanhas_para_processar(
        self,
        db: AsyncSession,
    ) -> List[Campanha]:
        """Obtém campanhas que precisam ser processadas."""
        now = datetime.utcnow()

        # Campanhas em execução ou agendadas para iniciar
        stmt = select(Campanha).where(
            Campanha.st_campanha.in_([
                CampanhaStatus.EM_EXECUCAO,
                CampanhaStatus.AGENDADA,
            ])
        )
        result = await db.execute(stmt)
        campanhas = result.scalars().all()

        # Filtrar campanhas agendadas que devem iniciar
        campanhas_para_processar = []
        for campanha in campanhas:
            if campanha.st_campanha == CampanhaStatus.AGENDADA:
                if campanha.dt_agendamento and campanha.dt_agendamento <= now:
                    # Iniciar campanha agendada
                    campanha.st_campanha = CampanhaStatus.EM_EXECUCAO
                    campanha.dt_inicio = now
                    await db.commit()
                    campanhas_para_processar.append(campanha)
            else:
                campanhas_para_processar.append(campanha)

        return campanhas_para_processar

    async def _processar_campanha(self, db: AsyncSession, campanha: Campanha):
        """Processa uma campanha específica."""
        # Verificar se está dentro do horário de envio
        if not self._dentro_horario_envio(campanha):
            logger.debug(f"Campanha {campanha.id_campanha} fora do horário de envio")
            return

        # Verificar limite diário
        if campanha.nr_limite_diario and campanha.nr_enviados_hoje >= campanha.nr_limite_diario:
            logger.debug(f"Campanha {campanha.id_campanha} atingiu limite diário")
            return

        # Obter próximo destinatário
        destinatario = await self._obter_proximo_destinatario(db, campanha.id_campanha)
        if not destinatario:
            # Verificar se campanha terminou
            await self._verificar_conclusao(db, campanha)
            return

        # Obter dados do contato
        stmt = select(ContatoOmni).where(ContatoOmni.id_contato == destinatario.id_contato)
        result = await db.execute(stmt)
        contato = result.scalar_one_or_none()

        if not contato:
            await self._registrar_erro(db, destinatario, "Contato não encontrado")
            return

        # Enviar mensagem
        sucesso, id_mensagem, erro = await self._enviar_mensagem(
            db, campanha, contato, destinatario
        )

        # Registrar resultado
        await self._registrar_envio(
            db, campanha, destinatario, sucesso, id_mensagem, erro
        )

        # Aguardar intervalo configurado
        if campanha.nr_intervalo_segundos:
            await asyncio.sleep(campanha.nr_intervalo_segundos)

    def _dentro_horario_envio(self, campanha: Campanha) -> bool:
        """Verifica se está dentro do horário de envio configurado."""
        # Por enquanto, sempre retorna True (envio em qualquer horário)
        # TODO: Implementar verificação de horário quando campo ds_horarios_envio for adicionado
        return True

    async def _obter_proximo_destinatario(
        self,
        db: AsyncSession,
        id_campanha: uuid.UUID,
    ) -> Optional[CampanhaDestinatario]:
        """Obtém próximo destinatário a enviar."""
        stmt = (
            select(CampanhaDestinatario)
            .where(
                CampanhaDestinatario.id_campanha == id_campanha,
                CampanhaDestinatario.st_enviado == False,
                CampanhaDestinatario.st_erro == False,
            )
            .order_by(CampanhaDestinatario.dt_criacao.asc())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _enviar_mensagem(
        self,
        db: AsyncSession,
        campanha: Campanha,
        contato: ContatoOmni,
        destinatario: CampanhaDestinatario,
    ) -> tuple[bool, Optional[uuid.UUID], Optional[str]]:
        """
        Envia mensagem para o destinatário.

        Returns:
            (sucesso, id_mensagem, erro)
        """
        try:
            # Preparar variáveis para template
            variaveis = {
                "nome": contato.nm_contato or "Cliente",
                **(destinatario.ds_variaveis or {}),
            }

            if campanha.tp_canal == CanalTipo.WHATSAPP:
                if not contato.nr_telefone:
                    return False, None, "Contato sem telefone"

                whatsapp = WhatsAppService(db, campanha.id_empresa)

                # Enviar via template ou mensagem direta
                if campanha.nm_template:
                    resultado = await whatsapp.enviar_mensagem_template(
                        contato.nr_telefone,
                        campanha.nm_template,
                        components=self._montar_components(campanha, variaveis),
                    )
                elif campanha.ds_mensagem:
                    # Substituir variáveis na mensagem
                    mensagem = campanha.ds_mensagem
                    for key, value in variaveis.items():
                        mensagem = mensagem.replace(f"{{{key}}}", str(value))

                    resultado = await whatsapp.enviar_mensagem_texto(
                        contato.nr_telefone,
                        mensagem,
                    )
                else:
                    return False, None, "Campanha sem mensagem configurada"

                if resultado.get("messages"):
                    return True, resultado["messages"][0].get("id"), None
                else:
                    return False, None, str(resultado.get("error", "Erro desconhecido"))

            elif campanha.tp_canal == CanalTipo.EMAIL:
                if not contato.nm_email:
                    return False, None, "Contato sem email"

                # Preparar mensagem com variáveis substituídas
                mensagem = campanha.ds_mensagem or ""
                for key, value in variaveis.items():
                    mensagem = mensagem.replace(f"{{{key}}}", str(value))

                # Criar corpo HTML para o email
                html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{campanha.nm_campanha}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ✨ DoctorQ
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <div style="color: #4b5563; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">
{mensagem}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
                email_service = EmailService()
                sucesso = email_service.send_email(
                    to=contato.nm_email,
                    subject=campanha.nm_campanha or "Mensagem da DoctorQ",
                    html_body=html_body,
                    text_body=mensagem,
                )

                if sucesso:
                    return True, str(uuid.uuid4()), None
                else:
                    return False, None, "Falha ao enviar email"

            elif campanha.tp_canal == CanalTipo.SMS:
                # TODO: Implementar envio de SMS
                return False, None, "Canal SMS não implementado"

            else:
                return False, None, f"Canal {campanha.tp_canal} não suportado"

        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            return False, None, str(e)

    def _montar_components(
        self,
        campanha: Campanha,
        variaveis: Dict[str, Any],
    ) -> Optional[List[Dict]]:
        """Monta components para template WhatsApp."""
        if not campanha.ds_variaveis:
            return None

        # Substituir variáveis nos parâmetros do template
        components = []

        # Header (se tiver mídia) - campo opcional que pode não existir
        ds_url_midia = getattr(campanha, 'ds_url_midia', None)
        if ds_url_midia:
            components.append({
                "type": "header",
                "parameters": [
                    {"type": "image", "image": {"link": ds_url_midia}}
                ]
            })

        # Body
        body_params = campanha.ds_variaveis.get("body", [])
        if body_params:
            parameters = []
            for param in body_params:
                value = variaveis.get(param, param)
                parameters.append({"type": "text", "text": str(value)})

            components.append({
                "type": "body",
                "parameters": parameters,
            })

        return components if components else None

    async def _registrar_envio(
        self,
        db: AsyncSession,
        campanha: Campanha,
        destinatario: CampanhaDestinatario,
        sucesso: bool,
        id_mensagem: Optional[str],
        erro: Optional[str],
    ):
        """Registra resultado do envio."""
        now = datetime.utcnow()

        if sucesso:
            destinatario.st_enviado = True
            destinatario.dt_envio = now
            destinatario.id_mensagem_externo = id_mensagem
            campanha.nr_enviados += 1
            campanha.nr_enviados_hoje += 1
        else:
            destinatario.st_erro = True
            destinatario.ds_erro = erro
            campanha.nr_erros += 1

        await db.commit()

    async def _registrar_erro(
        self,
        db: AsyncSession,
        destinatario: CampanhaDestinatario,
        erro: str,
    ):
        """Registra erro para destinatário."""
        destinatario.st_erro = True
        destinatario.ds_erro = erro
        await db.commit()

    async def _verificar_conclusao(self, db: AsyncSession, campanha: Campanha):
        """Verifica se campanha foi concluída."""
        # Contar destinatários pendentes
        stmt = select(CampanhaDestinatario).where(
            CampanhaDestinatario.id_campanha == campanha.id_campanha,
            CampanhaDestinatario.st_enviado == False,
            CampanhaDestinatario.st_erro == False,
        )
        result = await db.execute(stmt)
        pendentes = result.scalars().all()

        if not pendentes:
            campanha.st_campanha = CampanhaStatus.CONCLUIDA
            campanha.dt_fim = datetime.utcnow()
            await db.commit()
            logger.info(f"Campanha {campanha.id_campanha} concluída")


# Singleton do worker
_campanha_worker: Optional[CampanhaWorker] = None


def get_campanha_worker() -> CampanhaWorker:
    """Retorna instância singleton do worker."""
    global _campanha_worker
    if _campanha_worker is None:
        _campanha_worker = CampanhaWorker()
    return _campanha_worker


async def iniciar_campanha_worker():
    """Inicia o worker de campanhas."""
    worker = get_campanha_worker()
    await worker.start()


async def parar_campanha_worker():
    """Para o worker de campanhas."""
    worker = get_campanha_worker()
    await worker.stop()
