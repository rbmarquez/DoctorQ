# src/central_atendimento/services/campanha_service.py
"""
Serviço para gerenciamento de campanhas de prospecção e marketing.
"""

import uuid
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from src.config.logger_config import get_logger
from src.central_atendimento.models.campanha import (
    Campanha,
    CampanhaStatus,
    CampanhaTipo,
    CampanhaDestinatario,
    CampanhaCreate,
    CampanhaUpdate,
)
from src.central_atendimento.models.contato_omni import ContatoOmni, ContatoStatus
from src.central_atendimento.models.canal import CanalTipo

logger = get_logger(__name__)


class CampanhaService:
    """Serviço para operações de campanhas."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def criar(self, dados: CampanhaCreate) -> Campanha:
        """Cria uma nova campanha."""
        campanha = Campanha(
            id_empresa=self.id_empresa,
            nm_campanha=dados.nm_campanha,
            ds_descricao=dados.ds_descricao,
            tp_campanha=dados.tp_campanha,
            tp_canal=dados.tp_canal,
            id_canal=dados.id_canal,
            nm_template=dados.nm_template,
            ds_mensagem=dados.ds_mensagem,
            ds_variaveis=dados.ds_variaveis or {},
            ds_filtros=dados.ds_filtros or {},
            dt_agendamento=dados.dt_agendamento,
            nr_limite_diario=dados.nr_limite_diario,
            nr_intervalo_segundos=dados.nr_intervalo_segundos,
            st_campanha=CampanhaStatus.RASCUNHO,
        )

        self.db.add(campanha)
        await self.db.commit()
        await self.db.refresh(campanha)

        logger.info(f"Campanha criada: {campanha.id_campanha} - {campanha.nm_campanha}")
        return campanha

    async def obter(self, id_campanha: uuid.UUID) -> Optional[Campanha]:
        """Obtém uma campanha pelo ID."""
        stmt = select(Campanha).where(
            Campanha.id_campanha == id_campanha,
            Campanha.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def listar(
        self,
        st_campanha: Optional[CampanhaStatus] = None,
        tp_campanha: Optional[CampanhaTipo] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Campanha], int]:
        """Lista campanhas com filtros."""
        stmt = select(Campanha).where(Campanha.id_empresa == self.id_empresa)

        if st_campanha:
            stmt = stmt.where(Campanha.st_campanha == st_campanha)
        if tp_campanha:
            stmt = stmt.where(Campanha.tp_campanha == tp_campanha)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.execute(count_stmt)
        total_count = total.scalar()

        # Ordenar e paginar
        stmt = stmt.order_by(Campanha.dt_criacao.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        campanhas = result.scalars().all()

        return list(campanhas), total_count

    async def atualizar(
        self,
        id_campanha: uuid.UUID,
        dados: CampanhaUpdate,
    ) -> Optional[Campanha]:
        """Atualiza uma campanha."""
        campanha = await self.obter(id_campanha)
        if not campanha:
            return None

        # Não permitir edição se em execução
        if campanha.st_campanha == CampanhaStatus.EM_EXECUCAO:
            raise ValueError("Não é possível editar campanha em execução")

        update_data = dados.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(campanha, key, value)

        await self.db.commit()
        await self.db.refresh(campanha)

        logger.info(f"Campanha atualizada: {campanha.id_campanha}")
        return campanha

    async def deletar(self, id_campanha: uuid.UUID) -> bool:
        """Deleta uma campanha."""
        campanha = await self.obter(id_campanha)
        if not campanha:
            return False

        if campanha.st_campanha == CampanhaStatus.EM_EXECUCAO:
            raise ValueError("Não é possível deletar campanha em execução")

        await self.db.delete(campanha)
        await self.db.commit()

        logger.info(f"Campanha deletada: {id_campanha}")
        return True

    async def adicionar_destinatarios(
        self,
        id_campanha: uuid.UUID,
        ids_contatos: List[uuid.UUID],
        variaveis: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> Dict[str, int]:
        """
        Adiciona destinatários a uma campanha.

        Args:
            id_campanha: ID da campanha
            ids_contatos: Lista de IDs de contatos
            variaveis: Variáveis personalizadas por contato

        Returns:
            Resultado da operação
        """
        campanha = await self.obter(id_campanha)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        if campanha.st_campanha not in [CampanhaStatus.RASCUNHO, CampanhaStatus.PAUSADA]:
            raise ValueError("Só é possível adicionar destinatários em rascunho ou pausada")

        resultado = {"adicionados": 0, "duplicados": 0, "erros": 0}
        variaveis = variaveis or {}

        for id_contato in ids_contatos:
            try:
                # Verificar se já existe
                stmt = select(CampanhaDestinatario).where(
                    CampanhaDestinatario.id_campanha == id_campanha,
                    CampanhaDestinatario.id_contato == id_contato,
                )
                result = await self.db.execute(stmt)
                if result.scalar_one_or_none():
                    resultado["duplicados"] += 1
                    continue

                # Criar destinatário
                destinatario = CampanhaDestinatario(
                    id_campanha=id_campanha,
                    id_contato=id_contato,
                    ds_variaveis=variaveis.get(str(id_contato), {}),
                )
                self.db.add(destinatario)
                resultado["adicionados"] += 1

            except Exception as e:
                logger.error(f"Erro ao adicionar destinatário {id_contato}: {e}")
                resultado["erros"] += 1

        # Atualizar contador
        campanha.nr_total_destinatarios = (campanha.nr_total_destinatarios or 0) + resultado["adicionados"]

        await self.db.commit()
        return resultado

    async def adicionar_destinatarios_por_filtro(
        self,
        id_campanha: uuid.UUID,
    ) -> Dict[str, int]:
        """
        Adiciona destinatários baseado nos filtros da campanha.

        Os filtros são armazenados em ds_filtros como JSONB:
        {
            "tags": ["tag1", "tag2"],
            "status": ["lead", "qualificado"],
            "origem": "campanha_x"
        }

        Returns:
            Resultado da operação
        """
        campanha = await self.obter(id_campanha)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        # Construir query baseado nos filtros
        stmt = select(ContatoOmni.id_contato).where(
            ContatoOmni.id_empresa == self.id_empresa,
            ContatoOmni.st_ativo == True,
        )

        # Aplicar filtros do JSONB ds_filtros
        filtros = campanha.ds_filtros or {}

        # Filtro por tags (usando ds_tags do contato)
        if filtros.get("tags"):
            stmt = stmt.where(ContatoOmni.ds_tags.overlap(filtros["tags"]))

        # Filtro por status
        if filtros.get("status"):
            from src.central_atendimento.models.contato_omni import ContatoStatus
            status_list = [ContatoStatus(s) for s in filtros["status"]]
            stmt = stmt.where(ContatoOmni.st_contato.in_(status_list))

        # Filtro por origem
        if filtros.get("origem"):
            stmt = stmt.where(ContatoOmni.nm_origem == filtros["origem"])

        # Filtros de canal - garantir que contato tem o identificador do canal
        if campanha.tp_canal == CanalTipo.WHATSAPP:
            stmt = stmt.where(ContatoOmni.nr_telefone.isnot(None))
        elif campanha.tp_canal == CanalTipo.EMAIL:
            stmt = stmt.where(ContatoOmni.nm_email.isnot(None))
        elif campanha.tp_canal == CanalTipo.INSTAGRAM:
            stmt = stmt.where(ContatoOmni.id_instagram.isnot(None))

        result = await self.db.execute(stmt)
        ids_contatos = [row[0] for row in result.all()]

        return await self.adicionar_destinatarios(id_campanha, ids_contatos)

    async def iniciar_campanha(self, id_campanha: uuid.UUID) -> Campanha:
        """Inicia a execução de uma campanha."""
        campanha = await self.obter(id_campanha)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        if campanha.st_campanha not in [CampanhaStatus.RASCUNHO, CampanhaStatus.AGENDADA]:
            raise ValueError(f"Não é possível iniciar campanha com status {campanha.st_campanha}")

        if (campanha.nr_total_destinatarios or 0) == 0:
            raise ValueError("Campanha não tem destinatários")

        campanha.st_campanha = CampanhaStatus.EM_EXECUCAO
        campanha.dt_inicio = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(campanha)

        logger.info(f"Campanha iniciada: {id_campanha}")
        return campanha

    async def pausar_campanha(self, id_campanha: uuid.UUID) -> Campanha:
        """Pausa uma campanha em execução."""
        campanha = await self.obter(id_campanha)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        if campanha.st_campanha != CampanhaStatus.EM_EXECUCAO:
            raise ValueError("Só é possível pausar campanha em execução")

        campanha.st_campanha = CampanhaStatus.PAUSADA

        await self.db.commit()
        await self.db.refresh(campanha)

        logger.info(f"Campanha pausada: {id_campanha}")
        return campanha

    async def retomar_campanha(self, id_campanha: uuid.UUID) -> Campanha:
        """Retoma uma campanha pausada."""
        campanha = await self.obter(id_campanha)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        if campanha.st_campanha != CampanhaStatus.PAUSADA:
            raise ValueError("Só é possível retomar campanha pausada")

        campanha.st_campanha = CampanhaStatus.EM_EXECUCAO

        await self.db.commit()
        await self.db.refresh(campanha)

        logger.info(f"Campanha retomada: {id_campanha}")
        return campanha

    async def cancelar_campanha(self, id_campanha: uuid.UUID) -> Campanha:
        """Cancela uma campanha."""
        campanha = await self.obter(id_campanha)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        if campanha.st_campanha == CampanhaStatus.CONCLUIDA:
            raise ValueError("Não é possível cancelar campanha concluída")

        campanha.st_campanha = CampanhaStatus.CANCELADA
        campanha.dt_fim = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(campanha)

        logger.info(f"Campanha cancelada: {id_campanha}")
        return campanha

    async def obter_metricas(self, id_campanha: uuid.UUID) -> Dict[str, Any]:
        """Obtém métricas detalhadas da campanha."""
        campanha = await self.obter(id_campanha)
        if not campanha:
            return {}

        # Calcular taxas
        taxa_entrega = (
            campanha.nr_entregues / campanha.nr_enviados
            if campanha.nr_enviados > 0 else 0
        )
        taxa_leitura = (
            campanha.nr_lidos / campanha.nr_entregues
            if campanha.nr_entregues > 0 else 0
        )
        taxa_resposta = (
            campanha.nr_respondidos / campanha.nr_entregues
            if campanha.nr_entregues > 0 else 0
        )
        taxa_conversao = (
            (campanha.nr_convertidos or 0) / campanha.nr_respondidos
            if campanha.nr_respondidos > 0 else 0
        )

        return {
            "id_campanha": campanha.id_campanha,
            "nm_campanha": campanha.nm_campanha,
            "st_campanha": campanha.st_campanha,
            "nr_total_destinatarios": campanha.nr_total_destinatarios or 0,
            "nr_enviados": campanha.nr_enviados or 0,
            "nr_entregues": campanha.nr_entregues or 0,
            "nr_lidos": campanha.nr_lidos or 0,
            "nr_respondidos": campanha.nr_respondidos or 0,
            "nr_convertidos": campanha.nr_convertidos or 0,
            "nr_erros": campanha.nr_erros or 0,
            "pc_taxa_abertura": round(taxa_entrega * 100, 2),
            "pc_taxa_resposta": round(taxa_resposta * 100, 2),
            "pc_taxa_conversao": round(taxa_conversao * 100, 2),
        }

    async def listar_destinatarios(
        self,
        id_campanha: uuid.UUID,
        st_enviado: Optional[bool] = None,
        st_erro: Optional[bool] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Lista destinatários de uma campanha com filtros.

        Args:
            id_campanha: ID da campanha
            st_enviado: Filtrar por status de envio
            st_erro: Filtrar por status de erro
            page: Página
            page_size: Tamanho da página

        Returns:
            Lista de destinatários e total
        """
        campanha = await self.obter(id_campanha)
        if not campanha:
            raise ValueError("Campanha não encontrada")

        stmt = select(CampanhaDestinatario).where(
            CampanhaDestinatario.id_campanha == id_campanha,
        )

        if st_enviado is not None:
            stmt = stmt.where(CampanhaDestinatario.st_enviado == st_enviado)
        if st_erro is not None:
            stmt = stmt.where(CampanhaDestinatario.st_erro == st_erro)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Ordenar e paginar
        stmt = stmt.order_by(CampanhaDestinatario.dt_criacao.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        destinatarios = result.scalars().all()

        # Converter para dicionários com informações do contato
        items = []
        for dest in destinatarios:
            # Buscar dados do contato
            contato_stmt = select(ContatoOmni).where(
                ContatoOmni.id_contato == dest.id_contato
            )
            contato_result = await self.db.execute(contato_stmt)
            contato = contato_result.scalar_one_or_none()

            items.append({
                "id_destinatario": str(dest.id_destinatario),
                "id_campanha": str(dest.id_campanha),
                "id_contato": str(dest.id_contato),
                "nm_contato": contato.nm_contato if contato else None,
                "nr_telefone": contato.nr_telefone if contato else None,
                "nm_email": contato.nm_email if contato else None,
                "st_enviado": dest.st_enviado,
                "st_entregue": dest.st_entregue,
                "st_lido": dest.st_lido,
                "st_respondido": dest.st_respondido,
                "st_convertido": dest.st_convertido,
                "st_erro": dest.st_erro,
                "ds_erro": dest.ds_erro,
                "id_mensagem_externo": dest.id_mensagem_externo,
                "dt_envio": dest.dt_envio.isoformat() if dest.dt_envio else None,
                "dt_entrega": dest.dt_entrega.isoformat() if dest.dt_entrega else None,
                "dt_leitura": dest.dt_leitura.isoformat() if dest.dt_leitura else None,
                "dt_resposta": dest.dt_resposta.isoformat() if dest.dt_resposta else None,
                "dt_criacao": dest.dt_criacao.isoformat() if dest.dt_criacao else None,
            })

        return items, total

    async def obter_proximo_destinatario(
        self,
        id_campanha: uuid.UUID,
    ) -> Optional[CampanhaDestinatario]:
        """Obtém o próximo destinatário a enviar."""
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
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def registrar_envio(
        self,
        id_destinatario: uuid.UUID,
        sucesso: bool,
        id_mensagem_externo: Optional[str] = None,
        erro: Optional[str] = None,
    ):
        """Registra o envio para um destinatário."""
        stmt = select(CampanhaDestinatario).where(
            CampanhaDestinatario.id_destinatario == id_destinatario,
        )
        result = await self.db.execute(stmt)
        destinatario = result.scalar_one_or_none()

        if not destinatario:
            return

        if sucesso:
            destinatario.st_enviado = True
            destinatario.dt_envio = datetime.utcnow()
            destinatario.id_mensagem_externo = id_mensagem_externo
        else:
            destinatario.st_erro = True
            destinatario.ds_erro = erro

        await self.db.commit()

        # Atualizar métricas da campanha
        campanha = await self.obter(destinatario.id_campanha)
        if campanha:
            if sucesso:
                campanha.nr_enviados = (campanha.nr_enviados or 0) + 1
            else:
                campanha.nr_erros = (campanha.nr_erros or 0) + 1
            await self.db.commit()
