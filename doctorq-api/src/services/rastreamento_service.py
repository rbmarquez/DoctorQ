"""
Service para Rastreamento de Pedidos - UC054
Integrações com Correios, Jadlog, Total Express e outras transportadoras
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID
import httpx

from sqlalchemy import select, and_, func, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.rastreamento import TbRastreamentoEvento
from src.config.logger_config import get_logger

logger = get_logger("rastreamento_service")


class RastreamentoService:
    """Service para rastreamento de pedidos com integração a transportadoras"""

    # Mapeamento de status das transportadoras para nosso sistema
    STATUS_MAPPING = {
        # Correios
        "PO": "postado",
        "RO": "em_transito",
        "DO": "saiu_para_entrega",
        "BDE": "entregue",
        "BDI": "problema",
        "PAR": "aguardando_retirada",

        # Jadlog
        "001": "coletado",
        "002": "em_transito",
        "003": "saiu_para_entrega",
        "004": "entregue",
        "005": "problema",

        # Total Express
        "COLETA": "coletado",
        "TRANSITO": "em_transito",
        "SAIDA": "saiu_para_entrega",
        "ENTREGUE": "entregue",
        "DEVOLUCAO": "problema",

        # Status genéricos
        "coletado": "em_transito",
        "em rota": "em_transito",
        "saiu para entrega": "saiu_para_entrega",
        "entregue": "entregue",
        "cancelado": "cancelado",
        "devolvido": "problema",
        "aguardando": "aguardando_retirada",
    }

    @staticmethod
    async def consultar_rastreamento_correios(codigo_rastreio: str) -> List[Dict[str, Any]]:
        """
        Consulta rastreamento nos Correios
        API: https://api.correios.com.br/rastro/v1/objetos/{codigo}

        NOTA: Requer autenticação OAuth2 com credenciais dos Correios
        Esta é uma implementação mock. Em produção, usar credenciais reais.
        """
        try:
            # TODO: Implementar autenticação OAuth2 dos Correios
            # TOKEN = await obter_token_correios()

            # Mock de resposta (em produção, fazer request real)
            async with httpx.AsyncClient() as client:
                # response = await client.get(
                #     f"https://api.correios.com.br/rastro/v1/objetos/{codigo_rastreio}",
                #     headers={"Authorization": f"Bearer {TOKEN}"},
                #     timeout=30.0
                # )
                # eventos = response.json()

                # Mock para desenvolvimento
                eventos = [
                    {
                        "codigo": "PO",
                        "descricao": "Objeto postado",
                        "dtHora": datetime.now().isoformat(),
                        "unidade": {"endereco": {"cidade": "São Paulo", "uf": "SP"}},
                    },
                    {
                        "codigo": "RO",
                        "descricao": "Objeto em trânsito - por favor aguarde",
                        "dtHora": (datetime.now() + timedelta(days=1)).isoformat(),
                        "unidade": {"endereco": {"cidade": "Campinas", "uf": "SP"}},
                    },
                ]

                logger.info(f"Rastreamento Correios consultado: {codigo_rastreio}")
                return eventos

        except Exception as e:
            logger.error(f"Erro ao consultar Correios: {str(e)}")
            return []

    @staticmethod
    async def consultar_rastreamento_jadlog(codigo_rastreio: str) -> List[Dict[str, Any]]:
        """
        Consulta rastreamento na Jadlog
        API: https://www.jadlog.com.br/api/tracking

        NOTA: Requer token de autenticação Jadlog
        """
        try:
            # TODO: Implementar integração real com Jadlog
            # TOKEN = await obter_token_jadlog()

            # Mock para desenvolvimento
            eventos = [
                {
                    "codigo": "001",
                    "descricao": "Coleta realizada",
                    "data": datetime.now().isoformat(),
                    "cidade": "Rio de Janeiro",
                    "estado": "RJ",
                }
            ]

            logger.info(f"Rastreamento Jadlog consultado: {codigo_rastreio}")
            return eventos

        except Exception as e:
            logger.error(f"Erro ao consultar Jadlog: {str(e)}")
            return []

    @staticmethod
    async def consultar_rastreamento_total_express(codigo_rastreio: str) -> List[Dict[str, Any]]:
        """
        Consulta rastreamento na Total Express
        API: https://api.totalexpress.com.br/tracking

        NOTA: Requer credenciais Total Express
        """
        try:
            # TODO: Implementar integração real com Total Express

            # Mock para desenvolvimento
            eventos = [
                {
                    "status": "COLETA",
                    "descricao": "Mercadoria coletada",
                    "dataHora": datetime.now().isoformat(),
                    "localizacao": {"cidade": "Belo Horizonte", "uf": "MG"},
                }
            ]

            logger.info(f"Rastreamento Total Express consultado: {codigo_rastreio}")
            return eventos

        except Exception as e:
            logger.error(f"Erro ao consultar Total Express: {str(e)}")
            return []

    @staticmethod
    async def consultar_rastreamento(
        db: AsyncSession,
        id_pedido: UUID,
        codigo_rastreio: str,
        transportadora: Optional[str] = None
    ) -> List[TbRastreamentoEvento]:
        """
        Consulta rastreamento de um pedido
        Se transportadora não informada, tenta detectar pelo formato do código
        """
        # Detectar transportadora pelo código se não informada
        if not transportadora:
            transportadora = RastreamentoService._detectar_transportadora(codigo_rastreio)

        # Consultar API da transportadora
        eventos_externos = []
        if transportadora == "correios":
            eventos_externos = await RastreamentoService.consultar_rastreamento_correios(codigo_rastreio)
        elif transportadora == "jadlog":
            eventos_externos = await RastreamentoService.consultar_rastreamento_jadlog(codigo_rastreio)
        elif transportadora == "total_express":
            eventos_externos = await RastreamentoService.consultar_rastreamento_total_express(codigo_rastreio)

        # Processar e salvar eventos
        eventos_salvos = []
        for evento_ext in eventos_externos:
            evento = await RastreamentoService._processar_evento(
                db, id_pedido, codigo_rastreio, transportadora, evento_ext
            )
            if evento:
                eventos_salvos.append(evento)

        await db.commit()

        logger.info(f"Rastreamento atualizado: {len(eventos_salvos)} eventos para pedido {id_pedido}")
        return eventos_salvos

    @staticmethod
    def _detectar_transportadora(codigo_rastreio: str) -> str:
        """Detecta transportadora pelo formato do código de rastreio"""
        codigo = codigo_rastreio.upper().strip()

        # Correios: 2 letras + 9 dígitos + 2 letras (ex: AB123456789BR)
        if len(codigo) == 13 and codigo[:2].isalpha() and codigo[-2:].isalpha():
            return "correios"

        # Jadlog: geralmente numérico com prefixo
        if codigo.startswith("JL") or (codigo.isdigit() and len(codigo) >= 10):
            return "jadlog"

        # Total Express: formato variado, geralmente começa com TE
        if codigo.startswith("TE"):
            return "total_express"

        # Padrão genérico
        return "outro"

    @staticmethod
    async def _processar_evento(
        db: AsyncSession,
        id_pedido: UUID,
        codigo_rastreio: str,
        transportadora: str,
        evento_externo: Dict[str, Any]
    ) -> Optional[TbRastreamentoEvento]:
        """Processa e salva evento de rastreamento"""
        try:
            # Mapear campos conforme transportadora
            if transportadora == "correios":
                ds_status = evento_externo.get("codigo", "")
                ds_descricao = evento_externo.get("descricao", "")
                dt_evento_str = evento_externo.get("dtHora", "")
                dt_evento = datetime.fromisoformat(dt_evento_str.replace("Z", "+00:00"))
                local = evento_externo.get("unidade", {}).get("endereco", {})
                ds_cidade = local.get("cidade")
                ds_estado = local.get("uf")

            elif transportadora == "jadlog":
                ds_status = evento_externo.get("codigo", "")
                ds_descricao = evento_externo.get("descricao", "")
                dt_evento = datetime.fromisoformat(evento_externo.get("data", ""))
                ds_cidade = evento_externo.get("cidade")
                ds_estado = evento_externo.get("estado")

            elif transportadora == "total_express":
                ds_status = evento_externo.get("status", "")
                ds_descricao = evento_externo.get("descricao", "")
                dt_evento = datetime.fromisoformat(evento_externo.get("dataHora", ""))
                local = evento_externo.get("localizacao", {})
                ds_cidade = local.get("cidade")
                ds_estado = local.get("uf")

            else:
                # Formato genérico
                ds_status = evento_externo.get("status", "")
                ds_descricao = evento_externo.get("descricao", evento_externo.get("description", ""))
                dt_evento = datetime.fromisoformat(evento_externo.get("data", evento_externo.get("date", "")))
                ds_cidade = evento_externo.get("cidade")
                ds_estado = evento_externo.get("estado")

            # Mapear status
            ds_status_mapeado = RastreamentoService.STATUS_MAPPING.get(
                ds_status, RastreamentoService.STATUS_MAPPING.get(ds_descricao.lower(), "em_transito")
            )

            # Verificar se evento já existe (evitar duplicatas)
            query = select(TbRastreamentoEvento).where(
                and_(
                    TbRastreamentoEvento.id_pedido == id_pedido,
                    TbRastreamentoEvento.ds_codigo_rastreio == codigo_rastreio,
                    TbRastreamentoEvento.dt_evento == dt_evento,
                    TbRastreamentoEvento.ds_status == ds_status
                )
            )
            result = await db.execute(query)
            evento_existente = result.scalar_one_or_none()

            if evento_existente:
                logger.debug(f"Evento duplicado ignorado: {ds_status} em {dt_evento}")
                return None

            # Criar novo evento
            evento = TbRastreamentoEvento(
                id_pedido=id_pedido,
                ds_transportadora=transportadora,
                ds_codigo_rastreio=codigo_rastreio,
                ds_status=ds_status,
                ds_status_mapeado=ds_status_mapeado,
                ds_descricao=ds_descricao,
                ds_cidade=ds_cidade,
                ds_estado=ds_estado,
                ds_local_completo=f"{ds_cidade}/{ds_estado}" if ds_cidade and ds_estado else None,
                dt_evento=dt_evento,
                ds_dados_brutos=evento_externo,
            )

            db.add(evento)

            # Atualizar status do pedido se necessário
            await RastreamentoService._atualizar_status_pedido(db, id_pedido, ds_status_mapeado)

            return evento

        except Exception as e:
            logger.error(f"Erro ao processar evento: {str(e)}")
            return None

    @staticmethod
    async def _atualizar_status_pedido(db: AsyncSession, id_pedido: UUID, novo_status: str):
        """Atualiza status do pedido baseado em evento de rastreamento"""
        from src.models.pedido import TbPedido

        query = select(TbPedido).where(TbPedido.id_pedido == id_pedido)
        result = await db.execute(query)
        pedido = result.scalar_one_or_none()

        if not pedido:
            return

        # Mapeamento de status de rastreamento para status de pedido
        status_pedido_mapping = {
            "em_transito": "enviado",
            "saiu_para_entrega": "enviado",
            "entregue": "entregue",
            "aguardando_retirada": "aguardando_retirada",
            "problema": "problema_entrega",
            "cancelado": "cancelado",
        }

        novo_status_pedido = status_pedido_mapping.get(novo_status)

        if novo_status_pedido and pedido.ds_status != novo_status_pedido:
            pedido.ds_status = novo_status_pedido

            # Atualizar timestamps
            if novo_status_pedido == "entregue" and not pedido.dt_entrega:
                pedido.dt_entrega = datetime.utcnow()
            elif novo_status_pedido == "enviado" and not pedido.dt_envio:
                pedido.dt_envio = datetime.utcnow()

            logger.info(f"Status do pedido {id_pedido} atualizado para: {novo_status_pedido}")

            # TODO: Enviar notificação ao cliente sobre mudança de status
            # await NotificacaoService.enviar_notificacao_status_pedido(...)

    @staticmethod
    async def listar_eventos(
        db: AsyncSession,
        id_pedido: UUID
    ) -> List[TbRastreamentoEvento]:
        """Lista eventos de rastreamento de um pedido"""
        query = (
            select(TbRastreamentoEvento)
            .where(TbRastreamentoEvento.id_pedido == id_pedido)
            .order_by(desc(TbRastreamentoEvento.dt_evento))
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def processar_webhook(
        db: AsyncSession,
        codigo_rastreio: str,
        transportadora: str,
        dados_webhook: Dict[str, Any]
    ) -> Optional[TbRastreamentoEvento]:
        """
        Processa webhook de transportadora
        Usado quando transportadora envia atualizações proativamente
        """
        # Buscar pedido pelo código de rastreio
        from src.models.pedido import TbPedido

        query = select(TbPedido).where(TbPedido.ds_codigo_rastreio == codigo_rastreio)
        result = await db.execute(query)
        pedido = result.scalar_one_or_none()

        if not pedido:
            logger.warning(f"Pedido não encontrado para código de rastreio: {codigo_rastreio}")
            return None

        # Processar evento
        evento = await RastreamentoService._processar_evento(
            db, pedido.id_pedido, codigo_rastreio, transportadora, dados_webhook
        )

        await db.commit()

        logger.info(f"Webhook processado: {transportadora} - {codigo_rastreio}")
        return evento
