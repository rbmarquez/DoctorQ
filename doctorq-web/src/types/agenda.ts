// Tipos para o sistema de Agenda Inteligente

export type StatusAgendamento = "confirmado" | "pendente" | "cancelado" | "concluido" | "nao_compareceu";
export type TipoVisualizacao = "dia" | "semana" | "mes";
export type TipoBloqueio = "almoco" | "descanso" | "ferias" | "congresso" | "ausencia";

export interface Paciente {
  id_paciente: string;
  nm_completo: string;
  nr_telefone: string;
  nm_email: string;
  ds_foto_url?: string;
  nr_faltas_historico?: number; // Para previsão de no-shows
}

export interface Procedimento {
  id_procedimento: string;
  nm_procedimento: string;
  nr_duracao_minutos: number;
  vl_preco: number;
  ds_cor_hex?: string; // Cor para visualização no calendário
  nr_buffer_minutos?: number; // Tempo de buffer após o procedimento
}

export interface Profissional {
  id_profissional: string;
  nm_completo: string;
  nm_especialidade: string;
  ds_foto_url?: string;
  ds_cor_agenda?: string; // Cor da agenda do profissional
}

export interface Sala {
  id_sala: string;
  nm_sala: string;
  ds_tipo: string; // "consultorio", "laser", "procedimentos"
  bo_disponivel: boolean;
}

export interface Equipamento {
  id_equipamento: string;
  nm_equipamento: string;
  ds_tipo: string;
  bo_disponivel: boolean;
}

export interface Clinica {
  id_clinica: string;
  nm_clinica: string;
  ds_endereco?: string;
  ds_cor_hex?: string; // Cor para identificação visual da clínica
}

export interface Agendamento {
  id_agendamento: string;
  id_paciente: string;
  id_profissional: string;
  id_procedimento: string;
  id_clinica?: string; // ✨ NOVO: Suporte multi-clínica
  id_sala?: string;
  id_equipamento?: string;

  dt_agendamento: string; // YYYY-MM-DD
  hr_inicio: string; // HH:mm
  hr_fim: string; // HH:mm
  nr_duracao_minutos: number;

  st_status: StatusAgendamento;
  ds_observacoes?: string;
  bo_primeira_vez: boolean;

  // Dados desnormalizados para exibição rápida
  paciente?: Paciente;
  procedimento?: Procedimento;
  profissional?: Profissional;
  clinica?: Clinica; // ✨ NOVO: Informações da clínica
  sala?: Sala;

  // Confirmações
  bo_confirmado_sms: boolean;
  bo_confirmado_whatsapp: boolean;
  dt_confirmacao?: string;

  // Previsão de no-show
  nr_probabilidade_falta?: number; // 0-100

  // Auditoria
  dt_criacao: string;
  dt_atualizacao: string;
  id_usuario_criacao: string;
}

export interface BloqueioAgenda {
  id_bloqueio: string;
  id_profissional: string;
  tp_bloqueio: TipoBloqueio;
  dt_inicio: string; // YYYY-MM-DD
  hr_inicio?: string; // HH:mm (opcional para bloqueios de dia inteiro)
  dt_fim: string; // YYYY-MM-DD
  hr_fim?: string; // HH:mm (opcional para bloqueios de dia inteiro)
  ds_motivo: string;
  bo_recorrente: boolean;
  ds_recorrencia?: string; // "diario", "semanal", "mensal"
  dt_criacao: string;
}

export interface ConfiguracaoAgenda {
  id_configuracao: string;
  id_profissional: string;

  // Horários de funcionamento
  hr_inicio_expediente: string; // HH:mm
  hr_fim_expediente: string; // HH:mm
  nr_intervalo_slots_minutos: number; // Intervalo padrão entre slots (ex: 15, 30 min)

  // Dias de funcionamento (0 = Domingo, 6 = Sábado)
  dias_funcionamento: number[]; // [1, 2, 3, 4, 5] = Seg a Sex

  // Bloqueios automáticos
  hr_almoco_inicio?: string;
  hr_almoco_fim?: string;
  nr_buffer_padrao_minutos: number; // Buffer padrão entre procedimentos

  // Regras de negócio
  bo_permitir_sobreposicao: boolean;
  bo_bloquear_fins_semana: boolean;
  nr_antecedencia_minima_horas: number; // Antecedência mínima para agendamento
  nr_antecedencia_maxima_dias: number; // Até quantos dias no futuro pode agendar

  // Confirmações
  bo_enviar_confirmacao_sms: boolean;
  bo_enviar_confirmacao_whatsapp: boolean;
  nr_horas_antecedencia_confirmacao: number; // 24h antes, 48h antes, etc.

  // Lista de espera
  bo_habilitar_lista_espera: boolean;

  dt_criacao: string;
  dt_atualizacao: string;
}

export interface EventoCalendario {
  id: string;
  tipo: "agendamento" | "bloqueio";
  titulo: string;
  inicio: Date;
  fim: Date;
  cor: string;
  dados: Agendamento | BloqueioAgenda;
}

export interface EstatisticasAgenda {
  dt_referencia: string;
  nr_total_agendamentos: number;
  nr_agendamentos_confirmados: number;
  nr_agendamentos_pendentes: number;
  nr_agendamentos_concluidos: number;
  nr_cancelamentos: number;
  nr_no_shows: number;
  vl_faturamento_previsto: number;
  vl_faturamento_realizado: number;
  nr_taxa_ocupacao_percentual: number; // 0-100
  nr_tempo_medio_procedimento_minutos: number;
  procedimentos_mais_agendados: {
    id_procedimento: string;
    nm_procedimento: string;
    nr_quantidade: number;
  }[];
}

export interface SugestaoOtimizacao {
  id_sugestao: string;
  tp_sugestao: "preencher_horario" | "remarcacao" | "lista_espera" | "buffer_reduzido";
  ds_titulo: string;
  ds_descricao: string;
  dt_sugerida: string;
  hr_sugerida: string;
  nr_beneficio_estimado_minutos?: number;
  bo_aplicada: boolean;
}

export interface ListaEspera {
  id_lista_espera: string;
  id_paciente: string;
  id_procedimento: string;
  id_profissional: string;
  dt_preferencia_inicio: string;
  dt_preferencia_fim: string;
  hr_preferencias: string[]; // ["09:00", "10:00", "14:00"]
  nr_prioridade: number; // 1-5
  st_status: "ativa" | "notificada" | "agendada" | "cancelada";
  dt_criacao: string;
  paciente?: Paciente;
  procedimento?: Procedimento;
}
