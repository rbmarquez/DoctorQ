"""
Service para gerenciamento de Lembretes
UC027 - Enviar Lembretes de Agendamento
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.lembrete import TbLembrete, LembreteCreate
from src.config.logger_config import get_logger

logger = get_logger("lembrete_service")


class LembreteService:
    """Service para gerenciamento de lembretes"""

    @staticmethod
    async def criar_lembrete(
        db: AsyncSession,
        id_empresa: UUID,
        data: LembreteCreate
    ) -> TbLembrete:
        """
        Cria um novo lembrete agendado

        Args:
            db: Sessão do banco
            id_empresa: ID da empresa
            data: Dados do lembrete

        Returns:
            Lembrete criado
        """
        # Determinar quais canais serão usados
        canais = data.canais or ["email", "whatsapp"]

        lembrete = TbLembrete(
            id_empresa=id_empresa,
            id_agendamento=data.id_agendamento,
            id_paciente=data.id_paciente,
            tp_lembrete=data.tp_lembrete,
            fg_email="email" in canais,
            fg_whatsapp="whatsapp" in canais,
            fg_sms="sms" in canais,
            fg_push="push" in canais,
            dt_agendado=data.dt_agendado,
            st_lembrete="pendente",
            nr_tentativas=0
        )

        db.add(lembrete)
        await db.commit()
        await db.refresh(lembrete)

        logger.info(
            f"Lembrete criado: {lembrete.id_lembrete} - "
            f"Tipo: {data.tp_lembrete}, Agendado para: {data.dt_agendado}"
        )

        return lembrete

    @staticmethod
    async def buscar_lembretes_pendentes(
        db: AsyncSession,
        limite_data: Optional[datetime] = None
    ) -> List[TbLembrete]:
        """
        Busca lembretes pendentes que devem ser enviados

        Args:
            db: Sessão do banco
            limite_data: Buscar lembretes até esta data/hora (default: agora)

        Returns:
            Lista de lembretes pendentes
        """
        if not limite_data:
            limite_data = datetime.utcnow()

        query = select(TbLembrete).where(
            and_(
                TbLembrete.st_lembrete == "pendente",
                TbLembrete.dt_agendado <= limite_data,
                TbLembrete.nr_tentativas < 3  # Máximo 3 tentativas
            )
        ).order_by(TbLembrete.dt_agendado.asc())

        result = await db.execute(query)
        lembretes = result.scalars().all()

        return list(lembretes)

    @staticmethod
    async def enviar_lembrete(
        db: AsyncSession,
        id_lembrete: UUID,
        servico_notificacao: Any
    ) -> Dict[str, Any]:
        """
        Envia um lembrete pelos canais configurados

        Args:
            db: Sessão do banco
            id_lembrete: ID do lembrete
            servico_notificacao: Serviço de notificações

        Returns:
            Dict com status do envio por canal
        """
        # Buscar lembrete
        query = select(TbLembrete).where(TbLembrete.id_lembrete == id_lembrete)
        result = await db.execute(query)
        lembrete = result.scalar_one_or_none()

        if not lembrete:
            raise ValueError(f"Lembrete {id_lembrete} não encontrado")

        # Buscar dados do agendamento (JOIN será necessário aqui)
        # TODO: Implementar JOIN com tb_agendamentos para pegar dados completos

        resultado = {
            "email": {"sucesso": False, "erro": None},
            "whatsapp": {"sucesso": False, "erro": None},
            "sms": {"sucesso": False, "erro": None},
            "push": {"sucesso": False, "erro": None}
        }

        canais_enviados = []
        canais_erro = []

        # Incrementar tentativas
        lembrete.nr_tentativas += 1

        # Enviar por email
        if lembrete.fg_email and not lembrete.dt_email:
            try:
                await servico_notificacao.enviar_email_lembrete(
                    id_agendamento=lembrete.id_agendamento,
                    id_paciente=lembrete.id_paciente,
                    tp_lembrete=lembrete.tp_lembrete
                )
                lembrete.dt_email = datetime.utcnow()
                resultado["email"]["sucesso"] = True
                canais_enviados.append("email")
                logger.info(f"Lembrete {id_lembrete} enviado por email")
            except Exception as e:
                resultado["email"]["erro"] = str(e)
                canais_erro.append("email")
                logger.error(f"Erro ao enviar email do lembrete {id_lembrete}: {e}")

        # Enviar por WhatsApp
        if lembrete.fg_whatsapp and not lembrete.dt_whatsapp:
            try:
                await servico_notificacao.enviar_whatsapp_lembrete(
                    id_agendamento=lembrete.id_agendamento,
                    id_paciente=lembrete.id_paciente,
                    tp_lembrete=lembrete.tp_lembrete
                )
                lembrete.dt_whatsapp = datetime.utcnow()
                resultado["whatsapp"]["sucesso"] = True
                canais_enviados.append("whatsapp")
                logger.info(f"Lembrete {id_lembrete} enviado por WhatsApp")
            except Exception as e:
                resultado["whatsapp"]["erro"] = str(e)
                canais_erro.append("whatsapp")
                logger.error(f"Erro ao enviar WhatsApp do lembrete {id_lembrete}: {e}")

        # Enviar por SMS
        if lembrete.fg_sms and not lembrete.dt_sms:
            try:
                await servico_notificacao.enviar_sms_lembrete(
                    id_agendamento=lembrete.id_agendamento,
                    id_paciente=lembrete.id_paciente,
                    tp_lembrete=lembrete.tp_lembrete
                )
                lembrete.dt_sms = datetime.utcnow()
                resultado["sms"]["sucesso"] = True
                canais_enviados.append("sms")
                logger.info(f"Lembrete {id_lembrete} enviado por SMS")
            except Exception as e:
                resultado["sms"]["erro"] = str(e)
                canais_erro.append("sms")
                logger.error(f"Erro ao enviar SMS do lembrete {id_lembrete}: {e}")

        # Enviar push notification
        if lembrete.fg_push and not lembrete.dt_push:
            try:
                await servico_notificacao.enviar_push_lembrete(
                    id_agendamento=lembrete.id_agendamento,
                    id_paciente=lembrete.id_paciente,
                    tp_lembrete=lembrete.tp_lembrete
                )
                lembrete.dt_push = datetime.utcnow()
                resultado["push"]["sucesso"] = True
                canais_enviados.append("push")
                logger.info(f"Lembrete {id_lembrete} enviado por push")
            except Exception as e:
                resultado["push"]["erro"] = str(e)
                canais_erro.append("push")
                logger.error(f"Erro ao enviar push do lembrete {id_lembrete}: {e}")

        # Atualizar status
        if canais_enviados and not canais_erro:
            lembrete.st_lembrete = "enviado"
            lembrete.dt_enviado = datetime.utcnow()
        elif canais_erro and not canais_enviados:
            lembrete.st_lembrete = "erro"
            lembrete.ds_erro = f"Erro em todos os canais: {', '.join(canais_erro)}"
        else:
            # Parcialmente enviado
            lembrete.st_lembrete = "enviado"
            lembrete.dt_enviado = datetime.utcnow()
            lembrete.ds_erro = f"Erro em alguns canais: {', '.join(canais_erro)}"

        lembrete.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(lembrete)

        return {
            "lembrete": lembrete,
            "resultado": resultado,
            "canais_enviados": canais_enviados,
            "canais_erro": canais_erro
        }

    @staticmethod
    async def processar_lembretes_pendentes(
        db: AsyncSession,
        servico_notificacao: Any
    ) -> Dict[str, int]:
        """
        Processa todos os lembretes pendentes (chamado por cron job)

        Args:
            db: Sessão do banco
            servico_notificacao: Serviço de notificações

        Returns:
            Estatísticas do processamento
        """
        lembretes = await LembreteService.buscar_lembretes_pendentes(db)

        stats = {
            "total": len(lembretes),
            "enviados": 0,
            "erros": 0,
            "parciais": 0
        }

        logger.info(f"Processando {len(lembretes)} lembretes pendentes...")

        for lembrete in lembretes:
            try:
                resultado = await LembreteService.enviar_lembrete(
                    db=db,
                    id_lembrete=lembrete.id_lembrete,
                    servico_notificacao=servico_notificacao
                )

                if resultado["lembrete"].st_lembrete == "enviado":
                    if resultado["canais_erro"]:
                        stats["parciais"] += 1
                    else:
                        stats["enviados"] += 1
                else:
                    stats["erros"] += 1

            except Exception as e:
                logger.error(f"Erro ao processar lembrete {lembrete.id_lembrete}: {e}")
                stats["erros"] += 1

        logger.info(
            f"Processamento concluído: {stats['enviados']} enviados, "
            f"{stats['parciais']} parciais, {stats['erros']} erros"
        )

        return stats

    @staticmethod
    async def criar_lembretes_para_agendamento(
        db: AsyncSession,
        id_empresa: UUID,
        id_agendamento: UUID,
        id_paciente: UUID,
        dt_agendamento: datetime
    ) -> List[TbLembrete]:
        """
        Cria lembretes automáticos para um agendamento
        - Lembrete 24h antes
        - Lembrete 2h antes (se não confirmado)

        Args:
            db: Sessão do banco
            id_empresa: ID da empresa
            id_agendamento: ID do agendamento
            id_paciente: ID do paciente
            dt_agendamento: Data/hora do agendamento

        Returns:
            Lista de lembretes criados
        """
        lembretes_criados = []

        # Lembrete 24h antes (email + whatsapp + push)
        dt_lembrete_24h = dt_agendamento - timedelta(hours=24)

        if dt_lembrete_24h > datetime.utcnow():  # Só criar se ainda não passou
            lembrete_24h = await LembreteService.criar_lembrete(
                db=db,
                id_empresa=id_empresa,
                data=LembreteCreate(
                    id_agendamento=id_agendamento,
                    id_paciente=id_paciente,
                    tp_lembrete="24h",
                    dt_agendado=dt_lembrete_24h,
                    canais=["email", "whatsapp", "push"]
                )
            )
            lembretes_criados.append(lembrete_24h)

        # Lembrete 2h antes (sms + whatsapp)
        dt_lembrete_2h = dt_agendamento - timedelta(hours=2)

        if dt_lembrete_2h > datetime.utcnow():  # Só criar se ainda não passou
            lembrete_2h = await LembreteService.criar_lembrete(
                db=db,
                id_empresa=id_empresa,
                data=LembreteCreate(
                    id_agendamento=id_agendamento,
                    id_paciente=id_paciente,
                    tp_lembrete="2h",
                    dt_agendado=dt_lembrete_2h,
                    canais=["sms", "whatsapp"]
                )
            )
            lembretes_criados.append(lembrete_2h)

        logger.info(
            f"Criados {len(lembretes_criados)} lembretes para agendamento {id_agendamento}"
        )

        return lembretes_criados

    @staticmethod
    async def cancelar_lembretes_agendamento(
        db: AsyncSession,
        id_agendamento: UUID
    ) -> int:
        """
        Cancela todos os lembretes pendentes de um agendamento
        (usado quando agendamento é cancelado/reagendado)

        Args:
            db: Sessão do banco
            id_agendamento: ID do agendamento

        Returns:
            Número de lembretes cancelados
        """
        query = select(TbLembrete).where(
            and_(
                TbLembrete.id_agendamento == id_agendamento,
                TbLembrete.st_lembrete == "pendente"
            )
        )

        result = await db.execute(query)
        lembretes = result.scalars().all()

        count = 0
        for lembrete in lembretes:
            lembrete.st_lembrete = "cancelado"
            lembrete.dt_atualizacao = datetime.utcnow()
            count += 1

        await db.commit()

        logger.info(f"Cancelados {count} lembretes do agendamento {id_agendamento}")

        return count

    @staticmethod
    async def listar_lembretes(
        db: AsyncSession,
        id_empresa: UUID,
        id_agendamento: Optional[UUID] = None,
        id_paciente: Optional[UUID] = None,
        tp_lembrete: Optional[str] = None,
        st_lembrete: Optional[str] = None,
        page: int = 1,
        size: int = 50
    ) -> tuple[List[TbLembrete], int]:
        """Lista lembretes com filtros"""
        query = select(TbLembrete).where(TbLembrete.id_empresa == id_empresa)

        if id_agendamento:
            query = query.where(TbLembrete.id_agendamento == id_agendamento)

        if id_paciente:
            query = query.where(TbLembrete.id_paciente == id_paciente)

        if tp_lembrete:
            query = query.where(TbLembrete.tp_lembrete == tp_lembrete)

        if st_lembrete:
            query = query.where(TbLembrete.st_lembrete == st_lembrete)

        # Total de registros
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        # Paginação
        query = query.offset((page - 1) * size).limit(size)
        query = query.order_by(TbLembrete.dt_criacao.desc())

        result = await db.execute(query)
        lembretes = result.scalars().all()

        return list(lembretes), total or 0

    @staticmethod
    async def buscar_lembrete_por_id(
        db: AsyncSession,
        id_lembrete: UUID,
        id_empresa: UUID
    ) -> Optional[TbLembrete]:
        """Busca lembrete por ID"""
        query = select(TbLembrete).where(
            and_(
                TbLembrete.id_lembrete == id_lembrete,
                TbLembrete.id_empresa == id_empresa
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
