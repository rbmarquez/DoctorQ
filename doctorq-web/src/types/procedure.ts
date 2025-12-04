// src/types/procedure.ts

export interface Procedure {
  id_procedimento: string;
  nm_procedimento: string;
  ds_descricao: string;
  ds_categoria: string;
  ds_subcategoria?: string;

  // Classificações
  ds_area_corpo: string; // "facial", "corporal", "capilar"
  ds_objetivo: string[]; // ["rejuvenescimento", "emagrecimento", "hidratação"]
  ds_tecnologia?: string; // "laser", "ultrassom", "radiofrequência"
  ds_invasividade: string; // "não invasivo", "minimamente invasivo", "cirúrgico"

  // Informações Técnicas
  nr_tempo_procedimento_min: number; // minutos
  nr_tempo_recuperacao_dias?: number;
  nr_sessoes_recomendadas?: number;
  nr_intervalo_sessoes_dias?: number;

  // Preços
  vl_preco_medio_min: number;
  vl_preco_medio_max: number;

  // Indicações e Contraindicações
  ds_indicacoes: string[];
  ds_contraindicacoes: string[];
  ds_resultados_esperados: string;
  ds_cuidados_pos: string[];

  // Media
  ds_imagem_principal?: string;
  ds_imagens_galeria?: string[];
  ds_video_url?: string;

  // Avaliações
  nr_avaliacao_media?: number;
  nr_total_avaliacoes?: number;

  // Profissionais
  nr_profissionais_oferecem: number;

  // Metadata
  st_ativo: boolean;
  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface ProcedureCategory {
  id_categoria: string;
  nm_categoria: string;
  ds_descricao: string;
  ds_icone: string;
  nr_procedimentos: number;
}

export interface ProcedureComparison {
  procedure: Procedure;
  professionals: {
    id_profissional: string;
    nm_profissional: string;
    nr_avaliacao_media: number;
    vl_preco: number;
    nm_cidade: string;
    nm_estado: string;
  }[];
}

export interface AppointmentBooking {
  id_agendamento?: string;
  id_procedimento: string;
  id_profissional: string;
  id_paciente: string;

  // Data e Hora
  dt_agendamento: string; // ISO date
  hr_inicio: string; // "14:00"
  hr_fim: string; // "15:00"

  // Status
  st_agendamento: 'pendente' | 'confirmado' | 'cancelado' | 'realizado';
  ds_motivo_cancelamento?: string;

  // Valores
  vl_procedimento: number;
  vl_desconto?: number;
  vl_total: number;

  // Pagamento
  ds_forma_pagamento?: string;
  st_pagamento?: 'pendente' | 'pago' | 'cancelado';

  // Observações
  ds_observacoes?: string;

  // Confirmações
  bo_confirmado_profissional: boolean;
  bo_confirmado_paciente: boolean;

  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface TimeSlot {
  hr_inicio: string;
  hr_fim: string;
  bo_disponivel: boolean;
  vl_preco?: number;
}

export interface AvailableDate {
  dt_data: string; // ISO date
  slots: TimeSlot[];
}

// Filtros para busca de procedimentos
export interface ProcedureFilter {
  categoria?: string[];
  area_corpo?: string[];
  tecnologia?: string[];
  invasividade?: string[];
  preco_min?: number;
  preco_max?: number;
  duracao_max?: number;
  busca?: string;
  ordenacao?: "relevancia" | "preco_asc" | "preco_desc" | "avaliacao" | "popularidade";
}

// Estado do fluxo de agendamento (wizard de 4 etapas)
export interface BookingWizardState {
  // Etapa 1: Escolher procedimento
  procedimento?: Procedure;
  profissional?: {
    id_profissional: string;
    nm_profissional: string;
    ds_foto_url?: string;
    nr_avaliacao_media: number;
    vl_preco_procedimento: number;
  };

  // Etapa 2: Escolher data e horário
  data?: string; // ISO date
  horario?: TimeSlot;

  // Etapa 3: Dados do paciente (se não logado)
  paciente?: {
    nm_completo: string;
    nm_email: string;
    nr_telefone: string;
    ds_observacoes?: string;
  };

  // Etapa 4: Pagamento
  forma_pagamento?: "online" | "na_clinica";
  metodo_pagamento?: "pix" | "credito" | "debito" | "boleto";

  // Metadata
  etapa_atual: 1 | 2 | 3 | 4;
  etapa_concluida: number; // Última etapa concluída (0-4)
}

// Resumo do agendamento para confirmação
export interface BookingSummary {
  procedimento: {
    nm_procedimento: string;
    ds_categoria: string;
    nr_tempo_procedimento_min: number;
  };
  profissional: {
    nm_profissional: string;
    ds_foto_url?: string;
    nm_clinica?: string;
    ds_endereco?: string;
  };
  data_hora: {
    dt_data: string;
    hr_inicio: string;
    hr_fim: string;
    ds_data_formatada: string; // "Segunda, 15 de Janeiro de 2025"
  };
  valores: {
    vl_procedimento: number;
    vl_desconto?: number;
    vl_total: number;
  };
  pagamento: {
    forma: string;
    metodo?: string;
  };
}
