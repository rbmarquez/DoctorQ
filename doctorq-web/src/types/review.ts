// src/types/review.ts

export interface Review {
  id_avaliacao: string;
  id_profissional: string;
  id_paciente: string;
  id_procedimento?: string;

  // Avaliação geral
  nr_nota_geral: number; // 1-5

  // Critérios específicos
  nr_nota_atendimento: number; // 1-5
  nr_nota_estrutura: number; // 1-5
  nr_nota_resultado: number; // 1-5
  nr_nota_custo_beneficio: number; // 1-5
  bo_recomenda: boolean;

  // Conteúdo
  ds_comentario: string;
  ds_resposta_profissional?: string;

  // Fotos antes/depois
  ds_fotos_antes?: string[]; // URLs
  ds_fotos_depois?: string[]; // URLs

  // Verificação
  bo_verificada: boolean;
  ds_token_verificacao?: string;
  dt_verificacao?: string;

  // Metadata
  nm_paciente: string; // Nome exibido (pode ser anônimo)
  ds_foto_paciente?: string;
  dt_criacao: string;
  dt_atualizacao?: string;

  // Engajamento
  nr_util: number; // Quantas pessoas marcaram como útil
  nr_nao_util: number;

  // Moderação
  st_moderacao: 'pendente' | 'aprovada' | 'rejeitada';
  ds_motivo_rejeicao?: string;
}

export interface Professional {
  id_profissional: string;
  nm_profissional: string;
  ds_especialidade: string;
  ds_biografia?: string;
  ds_foto_perfil?: string;
  ds_foto_capa?: string;

  // Registro profissional
  nm_conselho: string; // CRM, CRO, etc.
  nr_registro: string;
  st_verificado: boolean;

  // Localização
  nm_clinica?: string;
  ds_endereco: string;
  ds_cidade: string;
  ds_estado: string;
  ds_cep: string;
  nr_latitude?: number;
  nr_longitude?: number;

  // Avaliações
  nr_avaliacao_media: number;
  nr_total_avaliacoes: number;
  nr_total_procedimentos: number;

  // Badges
  badges: ProfessionalBadge[];

  // Contato
  ds_telefone?: string;
  ds_email?: string;
  ds_site?: string;
  ds_instagram?: string;

  // Procedimentos oferecidos
  procedimentos: ProcedureOffered[];

  // Horários
  horarios_atendimento?: WorkingHours[];

  dt_cadastro: string;
}

export interface ProfessionalBadge {
  id_badge: string;
  nm_badge: string;
  ds_descricao: string;
  ds_icone: string;
  ds_cor: string;
  dt_conquista: string;
}

export interface ProcedureOffered {
  id_procedimento: string;
  nm_procedimento: string;
  ds_categoria: string;
  vl_preco_min?: number;
  vl_preco_max?: number;
  nr_duracao_minutos?: number;
  bo_disponivel: boolean;
}

export interface WorkingHours {
  dia_semana: number; // 0-6 (Domingo-Sábado)
  hr_inicio: string; // "09:00"
  hr_fim: string; // "18:00"
  bo_ativo: boolean;
}

export interface ReviewStats {
  total: number;
  media_geral: number;
  media_atendimento: number;
  media_estrutura: number;
  media_resultado: number;
  media_custo_beneficio: number;
  percentual_recomenda: number;

  // Distribuição de estrelas
  distribuicao: {
    [key: number]: number; // 1: 10, 2: 5, 3: 20, 4: 30, 5: 100
  };
}

export interface ReviewFormData {
  id_procedimento?: string;
  nr_nota_atendimento: number;
  nr_nota_estrutura: number;
  nr_nota_resultado: number;
  nr_nota_custo_beneficio: number;
  bo_recomenda: boolean;
  ds_comentario: string;
  fotos_antes?: File[];
  fotos_depois?: File[];
}
