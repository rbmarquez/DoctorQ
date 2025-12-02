# src/central_atendimento/services/fila_service.py
"""
Serviço para gerenciamento de filas de atendimento.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from src.config.logger_config import get_logger
from src.central_atendimento.models.fila_atendimento import (
    FilaAtendimento,
    AtendimentoItem,
    AtendimentoStatus,
    FilaAtendimentoCreate,
    FilaAtendimentoUpdate,
)

logger = get_logger(__name__)


class FilaAtendimentoService:
    """Serviço para operações de filas de atendimento."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def criar(self, dados: FilaAtendimentoCreate) -> FilaAtendimento:
        """Cria uma nova fila."""
        # Se for padrão, remover padrão das outras
        if dados.st_padrao:
            await self._remover_padrao_existente()

        fila = FilaAtendimento(
            id_empresa=self.id_empresa,
            nm_fila=dados.nm_fila,
            ds_descricao=dados.ds_descricao,
            nm_cor=dados.nm_cor,
            st_padrao=dados.st_padrao,
            nr_sla_primeira_resposta=dados.nr_sla_primeira_resposta,
            nr_sla_resposta=dados.nr_sla_resposta,
            nr_sla_resolucao=dados.nr_sla_resolucao,
            nm_modo_distribuicao=dados.nm_modo_distribuicao,
            nr_limite_simultaneo=dados.nr_limite_simultaneo,
            ds_mensagem_boas_vindas=dados.ds_mensagem_boas_vindas,
            ds_mensagem_fora_horario=dados.ds_mensagem_fora_horario,
            ds_mensagem_aguardando=dados.ds_mensagem_aguardando,
            ds_atendentes=dados.ds_atendentes or [],
            nr_prioridade=dados.nr_prioridade,
        )

        if dados.ds_horario_funcionamento:
            fila.ds_horario_funcionamento = dados.ds_horario_funcionamento

        self.db.add(fila)
        await self.db.commit()
        await self.db.refresh(fila)

        logger.info(f"Fila criada: {fila.id_fila} - {fila.nm_fila}")
        return fila

    async def obter(self, id_fila: uuid.UUID) -> Optional[FilaAtendimento]:
        """Obtém uma fila pelo ID."""
        stmt = select(FilaAtendimento).where(
            FilaAtendimento.id_fila == id_fila,
            FilaAtendimento.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def listar(
        self,
        apenas_ativas: bool = True,
    ) -> List[FilaAtendimento]:
        """Lista todas as filas da empresa."""
        stmt = select(FilaAtendimento).where(
            FilaAtendimento.id_empresa == self.id_empresa,
        )

        if apenas_ativas:
            stmt = stmt.where(FilaAtendimento.st_ativa == True)

        stmt = stmt.order_by(
            FilaAtendimento.nr_prioridade.desc(),
            FilaAtendimento.nm_fila.asc(),
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def atualizar(
        self,
        id_fila: uuid.UUID,
        dados: FilaAtendimentoUpdate,
    ) -> Optional[FilaAtendimento]:
        """Atualiza uma fila."""
        fila = await self.obter(id_fila)
        if not fila:
            return None

        update_data = dados.model_dump(exclude_unset=True)

        # Se está marcando como padrão
        if update_data.get("st_padrao"):
            await self._remover_padrao_existente(excluir_id=id_fila)

        for key, value in update_data.items():
            setattr(fila, key, value)

        await self.db.commit()
        await self.db.refresh(fila)

        logger.info(f"Fila atualizada: {fila.id_fila}")
        return fila

    async def deletar(self, id_fila: uuid.UUID) -> bool:
        """Deleta uma fila."""
        fila = await self.obter(id_fila)
        if not fila:
            return False

        # Verificar se tem itens pendentes
        stmt = select(func.count()).where(
            AtendimentoItem.id_fila == id_fila,
            AtendimentoItem.st_atendimento.in_([
                AtendimentoStatus.AGUARDANDO,
                AtendimentoStatus.EM_ATENDIMENTO,
            ]),
        )
        result = await self.db.execute(stmt)
        pendentes = result.scalar()

        if pendentes > 0:
            raise ValueError(f"Fila tem {pendentes} atendimentos pendentes")

        await self.db.delete(fila)
        await self.db.commit()

        logger.info(f"Fila deletada: {id_fila}")
        return True

    async def adicionar_atendente(
        self,
        id_fila: uuid.UUID,
        id_atendente: uuid.UUID,
    ) -> Optional[FilaAtendimento]:
        """Adiciona um atendente à fila."""
        fila = await self.obter(id_fila)
        if not fila:
            return None

        atendentes = fila.ds_atendentes or []
        if id_atendente not in atendentes:
            atendentes.append(id_atendente)
            fila.ds_atendentes = atendentes

            await self.db.commit()
            await self.db.refresh(fila)

        return fila

    async def remover_atendente(
        self,
        id_fila: uuid.UUID,
        id_atendente: uuid.UUID,
    ) -> Optional[FilaAtendimento]:
        """Remove um atendente da fila."""
        fila = await self.obter(id_fila)
        if not fila:
            return None

        atendentes = fila.ds_atendentes or []
        if id_atendente in atendentes:
            atendentes.remove(id_atendente)
            fila.ds_atendentes = atendentes

            await self.db.commit()
            await self.db.refresh(fila)

        return fila

    async def obter_metricas(self, id_fila: uuid.UUID) -> Dict[str, Any]:
        """Obtém métricas detalhadas de uma fila."""
        fila = await self.obter(id_fila)
        if not fila:
            return {}

        # Contar por status
        stmt_aguardando = select(func.count()).where(
            AtendimentoItem.id_fila == id_fila,
            AtendimentoItem.st_atendimento == AtendimentoStatus.AGUARDANDO,
        )
        stmt_atendendo = select(func.count()).where(
            AtendimentoItem.id_fila == id_fila,
            AtendimentoItem.st_atendimento == AtendimentoStatus.EM_ATENDIMENTO,
        )

        # Contar SLAs estourados hoje
        inicio_dia = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        stmt_sla = select(func.count()).where(
            AtendimentoItem.id_fila == id_fila,
            AtendimentoItem.st_sla_estourado == True,
            AtendimentoItem.dt_entrada_fila >= inicio_dia,
        )

        # Média de avaliação
        stmt_avaliacao = select(func.avg(AtendimentoItem.nr_avaliacao)).where(
            AtendimentoItem.id_fila == id_fila,
            AtendimentoItem.nr_avaliacao.isnot(None),
            AtendimentoItem.dt_fim_atendimento >= inicio_dia,
        )

        result_aguardando = await self.db.execute(stmt_aguardando)
        result_atendendo = await self.db.execute(stmt_atendendo)
        result_sla = await self.db.execute(stmt_sla)
        result_avaliacao = await self.db.execute(stmt_avaliacao)

        return {
            "id_fila": fila.id_fila,
            "nm_fila": fila.nm_fila,
            "nr_aguardando": result_aguardando.scalar(),
            "nr_em_atendimento": result_atendendo.scalar(),
            "nr_atendimentos_hoje": fila.nr_atendimentos_hoje,
            "nr_tempo_espera_medio": fila.nr_tempo_espera_medio,
            "nr_tempo_atendimento_medio": fila.nr_tempo_atendimento_medio,
            "nr_sla_estourados_hoje": result_sla.scalar(),
            "nr_avaliacao_media": round(result_avaliacao.scalar() or 0, 2),
            "nr_atendentes": len(fila.ds_atendentes or []),
        }

    async def verificar_horario_funcionamento(
        self,
        id_fila: uuid.UUID,
    ) -> bool:
        """Verifica se a fila está em horário de funcionamento."""
        fila = await self.obter(id_fila)
        if not fila:
            return False

        horario = fila.ds_horario_funcionamento or {}
        agora = datetime.now()

        # Mapear dia da semana
        dias_map = {
            0: "segunda",
            1: "terca",
            2: "quarta",
            3: "quinta",
            4: "sexta",
            5: "sabado",
            6: "domingo",
        }
        dia = dias_map[agora.weekday()]

        config_dia = horario.get(dia, {})
        if not config_dia.get("ativo", False):
            return False

        inicio = config_dia.get("inicio", "00:00")
        fim = config_dia.get("fim", "23:59")

        hora_atual = agora.strftime("%H:%M")
        return inicio <= hora_atual <= fim

    async def _remover_padrao_existente(
        self,
        excluir_id: Optional[uuid.UUID] = None,
    ):
        """Remove flag padrão das filas existentes."""
        stmt = (
            update(FilaAtendimento)
            .where(
                FilaAtendimento.id_empresa == self.id_empresa,
                FilaAtendimento.st_padrao == True,
            )
            .values(st_padrao=False)
        )

        if excluir_id:
            stmt = stmt.where(FilaAtendimento.id_fila != excluir_id)

        await self.db.execute(stmt)
