# src/central_atendimento/services/horario_atendimento_service.py
"""
Serviço de gerenciamento de horários de atendimento.

Inspirado no HorarioAtendimentoService do Maua, este serviço:
- Valida se está dentro do horário de atendimento
- Suporta horários especiais (feriados, datas específicas)
- Retorna próximo horário de atendimento
- Configura mensagens automáticas fora do horário
"""

import uuid
from datetime import datetime, time, timedelta
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from enum import IntEnum

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig

logger = get_logger(__name__)


class DiaSemana(IntEnum):
    """Dias da semana (ISO 8601: 1=Segunda, 7=Domingo)."""
    SEGUNDA = 1
    TERCA = 2
    QUARTA = 3
    QUINTA = 4
    SEXTA = 5
    SABADO = 6
    DOMINGO = 7


@dataclass
class HorarioConfig:
    """Configuração de horário de atendimento."""
    id_horario: Optional[uuid.UUID] = None
    id_empresa: Optional[uuid.UUID] = None
    nm_descricao: str = ""
    hr_inicio: time = time(8, 0)  # 08:00
    hr_fim: time = time(18, 0)  # 18:00
    dias_semana: List[int] = None  # [1, 2, 3, 4, 5] = seg-sex
    fg_especial: bool = False  # Horário especial (feriado, etc)
    dt_inicio: Optional[datetime] = None  # Para horários especiais
    dt_fim: Optional[datetime] = None
    fg_ativo: bool = True

    def __post_init__(self):
        if self.dias_semana is None:
            self.dias_semana = [1, 2, 3, 4, 5]  # Segunda a sexta


@dataclass
class StatusAtendimento:
    """Status atual do atendimento."""
    em_atendimento: bool
    mensagem: str
    proximo_horario: Optional[datetime] = None
    horario_atual: Optional[HorarioConfig] = None


class HorarioAtendimentoService:
    """
    Serviço de gerenciamento de horários de atendimento.

    Funcionalidades:
    - Verificar se está em horário de atendimento
    - Calcular próximo horário de atendimento
    - Suportar horários especiais (feriados)
    - Mensagens personalizadas por período
    """

    # Mensagens padrão
    DEFAULT_MESSAGE_OPEN = "Estamos disponíveis para atendimento!"
    DEFAULT_MESSAGE_CLOSED = "Nosso horário de atendimento é de {horario}. Por favor, retorne neste período."
    DEFAULT_MESSAGE_HOLIDAY = "Estamos em recesso. Retornaremos em {data}."

    # Horário padrão (pode ser sobrescrito por empresa)
    DEFAULT_HORARIOS: List[HorarioConfig] = [
        HorarioConfig(
            nm_descricao="Horário Comercial",
            hr_inicio=time(8, 0),
            hr_fim=time(18, 0),
            dias_semana=[1, 2, 3, 4, 5],  # Segunda a sexta
        ),
        HorarioConfig(
            nm_descricao="Sábado",
            hr_inicio=time(8, 0),
            hr_fim=time(12, 0),
            dias_semana=[6],  # Sábado
        ),
    ]

    def __init__(self):
        """Inicializa o serviço."""
        self._horarios_cache: Dict[str, List[HorarioConfig]] = {}
        self._cache_ttl_seconds = 300  # 5 minutos
        self._cache_timestamps: Dict[str, datetime] = {}

    async def verificar_horario_atendimento(
        self,
        id_empresa: uuid.UUID,
        data_hora: Optional[datetime] = None,
    ) -> StatusAtendimento:
        """
        Verifica se está dentro do horário de atendimento.

        Args:
            id_empresa: ID da empresa
            data_hora: Data/hora para verificar (default: agora)

        Returns:
            StatusAtendimento com status e mensagem
        """
        if data_hora is None:
            data_hora = datetime.now()

        # Obter horários da empresa
        horarios = await self._get_horarios_empresa(id_empresa)

        if not horarios:
            # Usar horários padrão
            horarios = self.DEFAULT_HORARIOS

        # Verificar horários especiais primeiro (feriados, etc)
        horario_especial = self._verificar_horario_especial(horarios, data_hora)
        if horario_especial is not None:
            return horario_especial

        # Verificar horário normal
        return self._verificar_horario_normal(horarios, data_hora)

    async def obter_proximo_horario(
        self,
        id_empresa: uuid.UUID,
        a_partir_de: Optional[datetime] = None,
    ) -> Optional[datetime]:
        """
        Obtém o próximo horário de atendimento disponível.

        Args:
            id_empresa: ID da empresa
            a_partir_de: Data/hora de referência (default: agora)

        Returns:
            Próximo datetime de atendimento ou None
        """
        if a_partir_de is None:
            a_partir_de = datetime.now()

        horarios = await self._get_horarios_empresa(id_empresa)
        if not horarios:
            horarios = self.DEFAULT_HORARIOS

        # Buscar nos próximos 7 dias
        for dia_offset in range(8):
            data_verificar = a_partir_de + timedelta(days=dia_offset)
            dia_semana = data_verificar.isoweekday()

            for horario in horarios:
                if horario.fg_especial:
                    continue
                if dia_semana not in horario.dias_semana:
                    continue

                # Calcular datetime do início do horário
                proximo = datetime.combine(
                    data_verificar.date(),
                    horario.hr_inicio,
                )

                # Se é hoje, verificar se o horário já passou
                if dia_offset == 0:
                    if proximo <= a_partir_de:
                        # Já passou, verificar se ainda está no horário
                        fim = datetime.combine(
                            data_verificar.date(),
                            horario.hr_fim,
                        )
                        if a_partir_de < fim:
                            # Ainda está no horário
                            return a_partir_de
                        continue  # Já passou, verificar próximo dia

                return proximo

        return None

    async def obter_mensagem_fora_horario(
        self,
        id_empresa: uuid.UUID,
        id_fila: Optional[uuid.UUID] = None,
    ) -> str:
        """
        Obtém mensagem personalizada para fora do horário.

        Args:
            id_empresa: ID da empresa
            id_fila: ID da fila (opcional, para mensagem específica)

        Returns:
            Mensagem formatada
        """
        status = await self.verificar_horario_atendimento(id_empresa)

        if status.em_atendimento:
            return self.DEFAULT_MESSAGE_OPEN

        proximo = await self.obter_proximo_horario(id_empresa)

        if proximo:
            if proximo.date() == datetime.now().date():
                horario_str = proximo.strftime("%H:%M")
                return f"Nosso atendimento inicia às {horario_str}. Por favor, aguarde ou retorne neste horário."
            else:
                data_str = proximo.strftime("%d/%m às %H:%M")
                return f"Nosso atendimento retorna em {data_str}. Por favor, deixe sua mensagem que responderemos assim que possível."

        return status.mensagem

    async def adicionar_horario(
        self,
        id_empresa: uuid.UUID,
        horario: HorarioConfig,
        db: Optional[AsyncSession] = None,
    ) -> HorarioConfig:
        """
        Adiciona novo horário de atendimento para empresa.

        Args:
            id_empresa: ID da empresa
            horario: Configuração do horário
            db: Sessão do banco (opcional)

        Returns:
            Horário criado
        """
        horario.id_horario = uuid.uuid4()
        horario.id_empresa = id_empresa

        # TODO: Persistir no banco quando modelo for criado
        # Por enquanto, adiciona ao cache
        cache_key = str(id_empresa)
        if cache_key not in self._horarios_cache:
            self._horarios_cache[cache_key] = []
        self._horarios_cache[cache_key].append(horario)

        logger.info(
            "Horário adicionado para empresa %s: %s (%s-%s)",
            id_empresa,
            horario.nm_descricao,
            horario.hr_inicio,
            horario.hr_fim,
        )

        return horario

    async def adicionar_feriado(
        self,
        id_empresa: uuid.UUID,
        data_inicio: datetime,
        data_fim: datetime,
        descricao: str = "Feriado",
    ) -> HorarioConfig:
        """
        Adiciona feriado/recesso para empresa.

        Args:
            id_empresa: ID da empresa
            data_inicio: Início do período
            data_fim: Fim do período
            descricao: Descrição do feriado

        Returns:
            Configuração do feriado
        """
        feriado = HorarioConfig(
            nm_descricao=descricao,
            fg_especial=True,
            dt_inicio=data_inicio,
            dt_fim=data_fim,
            dias_semana=[],  # Não aplica
        )

        return await self.adicionar_horario(id_empresa, feriado)

    async def _get_horarios_empresa(
        self,
        id_empresa: uuid.UUID,
    ) -> List[HorarioConfig]:
        """Obtém horários de atendimento da empresa (com cache)."""
        cache_key = str(id_empresa)

        # Verificar cache
        if cache_key in self._horarios_cache:
            cache_time = self._cache_timestamps.get(cache_key)
            if cache_time:
                age = (datetime.now() - cache_time).total_seconds()
                if age < self._cache_ttl_seconds:
                    return self._horarios_cache[cache_key]

        # TODO: Buscar do banco quando modelo for criado
        # Por enquanto, retorna vazio (usará default)
        return []

    def _verificar_horario_especial(
        self,
        horarios: List[HorarioConfig],
        data_hora: datetime,
    ) -> Optional[StatusAtendimento]:
        """Verifica se há horário especial (feriado) para a data."""
        for horario in horarios:
            if not horario.fg_especial:
                continue

            if horario.dt_inicio and horario.dt_fim:
                if horario.dt_inicio <= data_hora <= horario.dt_fim:
                    # Está em período especial (feriado)
                    return StatusAtendimento(
                        em_atendimento=False,
                        mensagem=self.DEFAULT_MESSAGE_HOLIDAY.format(
                            data=horario.dt_fim.strftime("%d/%m"),
                        ),
                        proximo_horario=horario.dt_fim,
                        horario_atual=horario,
                    )

        return None

    def _verificar_horario_normal(
        self,
        horarios: List[HorarioConfig],
        data_hora: datetime,
    ) -> StatusAtendimento:
        """Verifica horário normal de atendimento."""
        dia_semana = data_hora.isoweekday()
        hora_atual = data_hora.time()

        for horario in horarios:
            if horario.fg_especial:
                continue
            if not horario.fg_ativo:
                continue
            if dia_semana not in horario.dias_semana:
                continue

            if horario.hr_inicio <= hora_atual <= horario.hr_fim:
                return StatusAtendimento(
                    em_atendimento=True,
                    mensagem=self.DEFAULT_MESSAGE_OPEN,
                    horario_atual=horario,
                )

        # Fora do horário - calcular mensagem
        horarios_str = self._formatar_horarios(horarios)

        return StatusAtendimento(
            em_atendimento=False,
            mensagem=self.DEFAULT_MESSAGE_CLOSED.format(horario=horarios_str),
        )

    def _formatar_horarios(self, horarios: List[HorarioConfig]) -> str:
        """Formata horários para exibição."""
        partes = []

        for horario in horarios:
            if horario.fg_especial or not horario.fg_ativo:
                continue

            dias = self._formatar_dias(horario.dias_semana)
            hora = f"{horario.hr_inicio.strftime('%H:%M')} às {horario.hr_fim.strftime('%H:%M')}"
            partes.append(f"{dias}: {hora}")

        return ", ".join(partes) if partes else "Horário não definido"

    def _formatar_dias(self, dias: List[int]) -> str:
        """Formata dias da semana para exibição."""
        nomes = {
            1: "Seg",
            2: "Ter",
            3: "Qua",
            4: "Qui",
            5: "Sex",
            6: "Sáb",
            7: "Dom",
        }

        if not dias:
            return ""

        if dias == [1, 2, 3, 4, 5]:
            return "Segunda a Sexta"
        if dias == [1, 2, 3, 4, 5, 6]:
            return "Segunda a Sábado"
        if dias == [1, 2, 3, 4, 5, 6, 7]:
            return "Todos os dias"

        return ", ".join(nomes.get(d, str(d)) for d in sorted(dias))

    def limpar_cache(self, id_empresa: Optional[uuid.UUID] = None):
        """Limpa cache de horários."""
        if id_empresa:
            cache_key = str(id_empresa)
            self._horarios_cache.pop(cache_key, None)
            self._cache_timestamps.pop(cache_key, None)
        else:
            self._horarios_cache.clear()
            self._cache_timestamps.clear()


# Singleton do serviço
_horario_service: Optional[HorarioAtendimentoService] = None


def get_horario_atendimento_service() -> HorarioAtendimentoService:
    """Retorna instância singleton do serviço."""
    global _horario_service
    if _horario_service is None:
        _horario_service = HorarioAtendimentoService()
    return _horario_service
