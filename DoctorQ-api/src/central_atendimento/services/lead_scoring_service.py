# src/central_atendimento/services/lead_scoring_service.py
"""
Serviço de Lead Scoring com IA.

Calcula scores baseado em:
- Comportamento (tempo de resposta, engajamento)
- Perfil (dados demográficos, segmento)
- Engajamento (frequência de interações)
- Intenção (sinais de compra detectados)
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from src.config.logger_config import get_logger
from src.central_atendimento.models.lead_scoring import (
    LeadScore,
    LeadScoreHistorico,
    LeadScoreResponse,
)
from src.central_atendimento.models.contato_omni import ContatoOmni
from src.central_atendimento.models.conversa_omni import MensagemOmni

logger = get_logger(__name__)


# Sinais de intenção de compra
SINAIS_INTENCAO = [
    {"padrao": "preço", "peso": 20, "nome": "perguntou_preco"},
    {"padrao": "valor", "peso": 15, "nome": "perguntou_valor"},
    {"padrao": "quanto custa", "peso": 20, "nome": "perguntou_quanto_custa"},
    {"padrao": "agenda", "peso": 25, "nome": "pediu_agenda"},
    {"padrao": "agendar", "peso": 25, "nome": "quer_agendar"},
    {"padrao": "horário", "peso": 15, "nome": "perguntou_horario"},
    {"padrao": "disponibilidade", "peso": 15, "nome": "perguntou_disponibilidade"},
    {"padrao": "desconto", "peso": 10, "nome": "pediu_desconto"},
    {"padrao": "promoção", "peso": 10, "nome": "perguntou_promocao"},
    {"padrao": "parcelamento", "peso": 15, "nome": "perguntou_parcelamento"},
    {"padrao": "forma de pagamento", "peso": 15, "nome": "perguntou_pagamento"},
]

# Fatores positivos
FATORES_POSITIVOS = {
    "resposta_rapida": 10,  # Respondeu em menos de 5 minutos
    "multiplas_mensagens": 5,  # Enviou várias mensagens
    "perguntou_preco": 15,
    "pediu_agenda": 20,
    "retornou_conversa": 10,  # Retomou conversa anterior
    "engajamento_alto": 10,
}

# Fatores negativos
FATORES_NEGATIVOS = {
    "sem_resposta_24h": -15,
    "sem_resposta_7_dias": -30,
    "pediu_para_sair": -50,
    "reclamacao": -20,
    "baixo_engajamento": -10,
}


class LeadScoringService:
    """Serviço para cálculo e gerenciamento de lead scoring."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def obter_score(self, id_contato: uuid.UUID) -> Optional[LeadScore]:
        """Obtém o score de um contato."""
        stmt = select(LeadScore).where(
            LeadScore.id_contato == id_contato,
            LeadScore.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_ou_criar_score(self, id_contato: uuid.UUID) -> LeadScore:
        """Obtém ou cria o score de um contato."""
        score = await self.obter_score(id_contato)

        if not score:
            score = LeadScore(
                id_contato=id_contato,
                id_empresa=self.id_empresa,
            )
            self.db.add(score)
            await self.db.commit()
            await self.db.refresh(score)

        return score

    async def calcular_score(
        self,
        id_contato: uuid.UUID,
        evento: Optional[str] = None,
    ) -> LeadScore:
        """
        Calcula o score completo de um lead.

        Args:
            id_contato: ID do contato
            evento: Evento que disparou o recálculo

        Returns:
            Score atualizado
        """
        score = await self.obter_ou_criar_score(id_contato)

        # Obter dados do contato
        stmt = select(ContatoOmni).where(ContatoOmni.id_contato == id_contato)
        result = await self.db.execute(stmt)
        contato = result.scalar_one_or_none()

        if not contato:
            return score

        # Calcular scores por dimensão
        score_comportamento = await self._calcular_score_comportamento(contato)
        score_perfil = await self._calcular_score_perfil(contato)
        score_engajamento = await self._calcular_score_engajamento(contato)
        score_intencao = await self._calcular_score_intencao(id_contato)

        # Obter pesos
        pesos = score.ds_pesos or {
            "comportamento": 0.25,
            "perfil": 0.20,
            "engajamento": 0.30,
            "intencao": 0.25,
        }

        # Calcular score total ponderado
        score_total = int(
            score_comportamento * pesos["comportamento"] +
            score_perfil * pesos["perfil"] +
            score_engajamento * pesos["engajamento"] +
            score_intencao * pesos["intencao"]
        )

        # Garantir limites
        score_total = max(0, min(100, score_total))

        # Calcular temperatura (baseado em atividade recente)
        temperatura = await self._calcular_temperatura(id_contato, contato)

        # Detectar fatores
        fatores_positivos, fatores_negativos = await self._detectar_fatores(
            id_contato, contato
        )

        # Detectar sinais de intenção
        sinais_intencao = await self._detectar_sinais_intencao(id_contato)
        intencao_compra = len(sinais_intencao) >= 2
        nivel_intencao = min(5, len(sinais_intencao))

        # Calcular probabilidade de conversão
        probabilidade = self._calcular_probabilidade_conversao(
            score_total, temperatura, nivel_intencao
        )

        # Determinar ação recomendada
        acao, motivo = self._determinar_acao_recomendada(
            score_total, temperatura, nivel_intencao, fatores_negativos
        )

        # Guardar score anterior para histórico
        score_anterior = score.nr_score_total

        # Atualizar score
        score.nr_score_total = score_total
        score.nr_score_comportamento = score_comportamento
        score.nr_score_perfil = score_perfil
        score.nr_score_engajamento = score_engajamento
        score.nr_score_intencao = score_intencao
        score.nr_temperatura = temperatura
        score.ds_fatores_positivos = fatores_positivos
        score.ds_fatores_negativos = fatores_negativos
        score.st_intencao_compra = intencao_compra
        score.nr_nivel_intencao = nivel_intencao
        score.ds_sinais_intencao = sinais_intencao
        score.nr_probabilidade_conversao = probabilidade
        score.nm_acao_recomendada = acao
        score.ds_motivo_acao = motivo
        score.dt_ultimo_calculo = datetime.utcnow()

        # Atualizar score no contato
        contato.nr_score = score_total
        contato.nr_temperatura = temperatura

        await self.db.commit()
        await self.db.refresh(score)

        # Registrar histórico se houve mudança
        variacao = score_total - score_anterior
        if abs(variacao) >= 5 or evento:  # Registrar se mudou 5+ pontos ou tem evento
            await self._registrar_historico(
                score, evento or "recalculo_automatico", variacao
            )

        logger.info(f"Score calculado para {id_contato}: {score_total}")
        return score

    async def _calcular_score_comportamento(self, contato: ContatoOmni) -> int:
        """Calcula score de comportamento."""
        score = 50  # Base

        # Quantidade de mensagens
        if contato.nr_mensagens_recebidas > 10:
            score += 20
        elif contato.nr_mensagens_recebidas > 5:
            score += 10
        elif contato.nr_mensagens_recebidas > 0:
            score += 5

        # Tempo desde última interação
        if contato.dt_ultima_interacao:
            dias = (datetime.utcnow() - contato.dt_ultima_interacao).days
            if dias <= 1:
                score += 20
            elif dias <= 7:
                score += 10
            elif dias <= 30:
                score += 0
            else:
                score -= 20

        return max(0, min(100, score))

    async def _calcular_score_perfil(self, contato: ContatoOmni) -> int:
        """Calcula score de perfil (completude dos dados)."""
        score = 30  # Base

        # Dados preenchidos
        if contato.nm_email:
            score += 10
        if contato.nr_telefone:
            score += 15
        if contato.nr_documento:
            score += 10
        if contato.ds_endereco:
            score += 5
        if contato.nm_cidade and contato.nm_estado:
            score += 5
        if contato.ds_segmentos:
            score += 15
        if contato.ds_tags:
            score += 10

        return max(0, min(100, score))

    async def _calcular_score_engajamento(self, contato: ContatoOmni) -> int:
        """Calcula score de engajamento."""
        score = 40  # Base

        # Conversas
        if contato.nr_conversas_total > 5:
            score += 25
        elif contato.nr_conversas_total > 2:
            score += 15
        elif contato.nr_conversas_total > 0:
            score += 5

        # Taxa de resposta
        if contato.nr_mensagens_enviadas > 0:
            taxa = contato.nr_mensagens_recebidas / contato.nr_mensagens_enviadas
            if taxa > 1:
                score += 20
            elif taxa > 0.5:
                score += 10
            elif taxa > 0.2:
                score += 5

        # Frequência de interação
        if contato.dt_ultima_interacao:
            dias = (datetime.utcnow() - contato.dt_ultima_interacao).days
            if dias <= 7:
                score += 15

        return max(0, min(100, score))

    async def _calcular_score_intencao(self, id_contato: uuid.UUID) -> int:
        """Calcula score de intenção baseado nas mensagens."""
        sinais = await self._detectar_sinais_intencao(id_contato)

        score = 20  # Base

        # Somar pesos dos sinais detectados
        for sinal in SINAIS_INTENCAO:
            if sinal["nome"] in sinais:
                score += sinal["peso"]

        return max(0, min(100, score))

    async def _calcular_temperatura(
        self,
        id_contato: uuid.UUID,
        contato: ContatoOmni,
    ) -> int:
        """Calcula a temperatura (urgência) do lead."""
        temperatura = 30  # Base

        # Atividade recente
        if contato.dt_ultima_interacao:
            horas = (datetime.utcnow() - contato.dt_ultima_interacao).total_seconds() / 3600
            if horas <= 1:
                temperatura += 40
            elif horas <= 24:
                temperatura += 25
            elif horas <= 72:
                temperatura += 10

        # Sinais de intenção
        sinais = await self._detectar_sinais_intencao(id_contato)
        if "pediu_agenda" in sinais or "quer_agendar" in sinais:
            temperatura += 30
        if "perguntou_preco" in sinais:
            temperatura += 15

        return max(0, min(100, temperatura))

    async def _detectar_fatores(
        self,
        id_contato: uuid.UUID,
        contato: ContatoOmni,
    ) -> tuple[List[str], List[str]]:
        """Detecta fatores positivos e negativos."""
        positivos = []
        negativos = []

        # Verificar última interação
        if contato.dt_ultima_interacao:
            dias = (datetime.utcnow() - contato.dt_ultima_interacao).days
            if dias > 7:
                negativos.append("sem_resposta_7_dias")
            elif dias > 1:
                negativos.append("sem_resposta_24h")

        # Engajamento
        if contato.nr_mensagens_recebidas > 5:
            positivos.append("multiplas_mensagens")

        if contato.nr_conversas_total > 1:
            positivos.append("retornou_conversa")

        # Sinais de intenção
        sinais = await self._detectar_sinais_intencao(id_contato)
        if "perguntou_preco" in sinais:
            positivos.append("perguntou_preco")
        if "pediu_agenda" in sinais:
            positivos.append("pediu_agenda")

        return positivos, negativos

    async def _detectar_sinais_intencao(self, id_contato: uuid.UUID) -> List[str]:
        """Detecta sinais de intenção nas mensagens recentes."""
        # Buscar mensagens dos últimos 30 dias
        limite = datetime.utcnow() - timedelta(days=30)

        stmt = (
            select(MensagemOmni.ds_conteudo)
            .join(
                ContatoOmni,
                MensagemOmni.id_conversa == ContatoOmni.id_contato,  # Simplificado
            )
            .where(
                MensagemOmni.st_entrada == True,  # Mensagens do contato
                MensagemOmni.ds_conteudo.isnot(None),
                MensagemOmni.dt_criacao >= limite,
            )
            .limit(50)
        )

        try:
            result = await self.db.execute(stmt)
            mensagens = result.scalars().all()
        except Exception:
            mensagens = []

        sinais = []
        texto_completo = " ".join(mensagens).lower() if mensagens else ""

        for sinal in SINAIS_INTENCAO:
            if sinal["padrao"].lower() in texto_completo:
                sinais.append(sinal["nome"])

        return sinais

    def _calcular_probabilidade_conversao(
        self,
        score: int,
        temperatura: int,
        nivel_intencao: int,
    ) -> float:
        """Calcula probabilidade de conversão."""
        # Fórmula simples baseada nos indicadores
        base = score / 100 * 0.4
        temp_factor = temperatura / 100 * 0.3
        intencao_factor = nivel_intencao / 5 * 0.3

        probabilidade = base + temp_factor + intencao_factor
        return round(min(1.0, max(0.0, probabilidade)), 2)

    def _determinar_acao_recomendada(
        self,
        score: int,
        temperatura: int,
        nivel_intencao: int,
        fatores_negativos: List[str],
    ) -> tuple[str, str]:
        """Determina a ação recomendada para o lead."""
        # Leads quentes com alta intenção
        if temperatura >= 70 and nivel_intencao >= 3:
            return "ligar_agora", "Lead quente com alta intenção de compra"

        # Leads com intenção mas precisam de follow-up
        if nivel_intencao >= 2 and temperatura >= 40:
            return "enviar_proposta", "Lead demonstrou interesse, enviar proposta"

        # Leads inativos
        if "sem_resposta_7_dias" in fatores_negativos:
            return "campanha_reengajamento", "Lead inativo há mais de 7 dias"

        # Leads com score bom mas baixa temperatura
        if score >= 60 and temperatura < 40:
            return "enviar_conteudo", "Nutrir lead com conteúdo relevante"

        # Leads novos ou neutros
        if score < 40:
            return "qualificar", "Lead precisa de qualificação"

        return "aguardar", "Monitorar próximas interações"

    async def _registrar_historico(
        self,
        score: LeadScore,
        evento: str,
        variacao: int,
    ):
        """Registra mudança no histórico."""
        historico = LeadScoreHistorico(
            id_score=score.id_score,
            id_contato=score.id_contato,
            nr_score_total=score.nr_score_total,
            nr_temperatura=score.nr_temperatura,
            nm_evento=evento,
            ds_detalhes={
                "fatores_positivos": score.ds_fatores_positivos,
                "fatores_negativos": score.ds_fatores_negativos,
            },
            nr_variacao=variacao,
        )

        self.db.add(historico)
        await self.db.commit()

    async def obter_historico(
        self,
        id_contato: uuid.UUID,
        dias: int = 30,
    ) -> List[LeadScoreHistorico]:
        """Obtém histórico de mudanças no score."""
        limite = datetime.utcnow() - timedelta(days=dias)

        stmt = (
            select(LeadScoreHistorico)
            .where(
                LeadScoreHistorico.id_contato == id_contato,
                LeadScoreHistorico.dt_registro >= limite,
            )
            .order_by(LeadScoreHistorico.dt_registro.desc())
            .limit(100)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def listar_leads_quentes(
        self,
        limite: int = 20,
    ) -> List[tuple[ContatoOmni, LeadScore]]:
        """Lista os leads mais quentes."""
        stmt = (
            select(ContatoOmni, LeadScore)
            .join(LeadScore, ContatoOmni.id_contato == LeadScore.id_contato)
            .where(
                ContatoOmni.id_empresa == self.id_empresa,
                ContatoOmni.st_ativo == True,
            )
            .order_by(LeadScore.nr_temperatura.desc())
            .limit(limite)
        )

        result = await self.db.execute(stmt)
        return list(result.all())

    async def recalcular_todos_scores(self) -> Dict[str, int]:
        """Recalcula scores de todos os contatos ativos."""
        stmt = select(ContatoOmni.id_contato).where(
            ContatoOmni.id_empresa == self.id_empresa,
            ContatoOmni.st_ativo == True,
        )
        result = await self.db.execute(stmt)
        ids = [row[0] for row in result.all()]

        resultado = {"total": len(ids), "processados": 0, "erros": 0}

        for id_contato in ids:
            try:
                await self.calcular_score(id_contato, "recalculo_batch")
                resultado["processados"] += 1
            except Exception as e:
                logger.error(f"Erro ao recalcular score {id_contato}: {e}")
                resultado["erros"] += 1

        return resultado
