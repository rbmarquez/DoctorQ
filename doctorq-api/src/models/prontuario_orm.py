"""
ORM Model para Prontuários
Estrutura da tabela tb_prontuarios
"""

import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Column,
    String,
    Text,
    Numeric,
    Date,
    TIMESTAMP,
    ForeignKey,
    ARRAY,
)
from sqlalchemy.dialects.postgresql import UUID

from src.models.base import Base


class ProntuarioORM(Base):
    """Prontuários - Estrutura da tabela tb_prontuarios"""

    __tablename__ = "tb_prontuarios"
    __table_args__ = {'extend_existing': True}

    # Identificação
    id_prontuario = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("tb_pacientes.id_paciente", ondelete="CASCADE"))
    id_profissional = Column(UUID(as_uuid=True), ForeignKey("tb_profissionais.id_profissional", ondelete="CASCADE"))
    id_agendamento = Column(UUID(as_uuid=True), ForeignKey("tb_agendamentos.id_agendamento", ondelete="CASCADE"))
    id_clinica = Column(UUID(as_uuid=True), ForeignKey("tb_clinicas.id_clinica", ondelete="CASCADE"))

    # Dados da consulta
    dt_consulta = Column(TIMESTAMP, nullable=False)
    ds_tipo = Column(String(50))  # Primeira consulta, Retorno, Acompanhamento

    # Anamnese
    ds_queixa_principal = Column(Text)
    ds_historico_doenca_atual = Column(Text)
    ds_antecedentes_pessoais = Column(Text)
    ds_antecedentes_familiares = Column(Text)
    ds_habitos_vida = Column(Text)

    # Dados vitais
    ds_pressao_arterial = Column(String(20))
    ds_peso = Column(Numeric(5, 2))
    ds_altura = Column(Numeric(5, 2))
    ds_imc = Column(Numeric(5, 2))

    # Exame físico e avaliação
    ds_exame_fisico = Column(Text)
    ds_avaliacao_estetica = Column(Text)
    ds_diagnostico = Column(Text)

    # Procedimentos e tratamento
    ds_procedimentos_realizados = Column(Text)
    ds_produtos_utilizados = Column(Text)
    ds_prescricoes = Column(Text)
    ds_orientacoes = Column(Text)
    ds_plano_tratamento = Column(Text)

    # Evolução
    ds_evolucao = Column(Text)
    ds_intercorrencias = Column(Text)

    # Anexos
    ds_fotos_antes = Column(ARRAY(Text))
    ds_fotos_depois = Column(ARRAY(Text))
    ds_arquivos_anexos = Column(ARRAY(Text))

    # Agendamento de retorno
    dt_retorno_sugerido = Column(Date)

    # Assinatura digital
    ds_assinatura_profissional = Column(Text)
    dt_assinatura = Column(TIMESTAMP)

    # Auditoria
    dt_criacao = Column(TIMESTAMP, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
