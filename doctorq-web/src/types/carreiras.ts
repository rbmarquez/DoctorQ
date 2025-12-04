// ============================================================================
// TYPES PARA SISTEMA DE CARREIRAS - VAGAS E CURRÍCULOS
// ============================================================================

// ============================================================================
// CURRÍCULOS
// ============================================================================

export type NivelExperiencia = "estagiario" | "junior" | "pleno" | "senior" | "especialista";
export type TipoContrato = "clt" | "pj" | "estagio" | "temporario" | "freelance";
export type RegimeTrabalho = "presencial" | "remoto" | "hibrido";
export type StatusCurriculo = "ativo" | "inativo" | "pausado";

export interface ExperienciaProfissional {
  id?: string;
  nm_empresa: string;
  nm_cargo: string;
  ds_atividades: string;
  dt_inicio: string;
  dt_fim?: string;
  fg_emprego_atual: boolean;
}

export interface FormacaoAcademica {
  id?: string;
  nm_instituicao: string;
  nm_curso: string;
  nm_nivel: "tecnico" | "graduacao" | "pos" | "mestrado" | "doutorado";
  dt_inicio: string;
  dt_conclusao?: string;
  fg_cursando: boolean;
}

export interface Certificacao {
  id?: string;
  nm_certificacao: string;
  nm_instituicao: string;
  dt_emissao: string;
  dt_validade?: string;
  ds_codigo?: string;
}

export interface Curriculo {
  id_curriculo: string;
  id_usuario?: string;

  // Dados Pessoais
  nm_completo: string;
  ds_email: string;
  nr_telefone: string;
  ds_linkedin?: string;
  ds_portfolio?: string;
  ds_foto_url?: string;

  // Localização
  nm_cidade: string;
  nm_estado: string;
  ds_cep?: string;

  // Perfil Profissional
  nm_cargo_desejado: string;
  ds_resumo_profissional: string;
  nm_nivel_experiencia: NivelExperiencia;
  nr_anos_experiencia: number;

  // Habilidades
  habilidades: string[]; // Tags: "Harmonização Facial", "Botox", etc
  idiomas: Array<{
    nm_idioma: string;
    nm_nivel: "basico" | "intermediario" | "avancado" | "fluente";
  }>;

  // Experiências e Formação
  experiencias: ExperienciaProfissional[];
  formacoes: FormacaoAcademica[];
  certificacoes: Certificacao[];

  // Preferências de Trabalho
  tipos_contrato_aceitos: TipoContrato[];
  regimes_trabalho_aceitos: RegimeTrabalho[];
  vl_pretensao_salarial_min?: number;
  vl_pretensao_salarial_max?: number;
  fg_disponibilidade_viagem: boolean;
  fg_disponibilidade_mudanca: boolean;

  // Status
  ds_status: StatusCurriculo;
  fg_visivel_recrutadores: boolean;

  // Metadados
  dt_criacao: string;
  dt_atualizacao: string;
  nr_visualizacoes?: number;
  nr_candidaturas?: number;
}

export interface CriarCurriculoData {
  nm_completo: string;
  ds_email: string;
  nr_telefone: string;
  nm_cidade: string;
  nm_estado: string;
  nm_cargo_desejado: string;
  ds_resumo_profissional: string;
  nm_nivel_experiencia: NivelExperiencia;
  nr_anos_experiencia: number;
  habilidades: string[];
  tipos_contrato_aceitos: TipoContrato[];
  regimes_trabalho_aceitos: RegimeTrabalho[];
}

export interface AtualizarCurriculoData extends Partial<CriarCurriculoData> {
  experiencias?: ExperienciaProfissional[];
  formacoes?: FormacaoAcademica[];
  certificacoes?: Certificacao[];
  idiomas?: Array<{ nm_idioma: string; nm_nivel: string }>;
  vl_pretensao_salarial_min?: number;
  vl_pretensao_salarial_max?: number;
}

// ============================================================================
// VAGAS
// ============================================================================

export type StatusVaga = "aberta" | "pausada" | "fechada" | "cancelada";
export type NivelVaga = "estagiario" | "junior" | "pleno" | "senior" | "especialista";

export interface Vaga {
  id_vaga: string;
  id_empresa: string;
  id_criador: string; // Profissional ou admin que criou

  // Dados da Empresa (desnormalizado para performance)
  nm_empresa: string;
  ds_logo_empresa?: string;

  // Informações da Vaga
  nm_cargo: string;
  ds_resumo: string;
  ds_responsabilidades: string;
  ds_requisitos: string;
  ds_diferenciais?: string;

  // Classificação
  nm_area: string; // "Estética Facial", "Corporal", "Administrativa", etc
  nm_nivel: NivelVaga;
  nm_tipo_contrato: TipoContrato;
  nm_regime_trabalho: RegimeTrabalho;

  // Localização
  nm_cidade: string;
  nm_estado: string;
  fg_aceita_remoto: boolean;

  // Remuneração
  vl_salario_min?: number;
  vl_salario_max?: number;
  fg_salario_a_combinar: boolean;
  ds_beneficios?: string[]; // ["VR", "VT", "Plano de Saúde"]

  // Requisitos
  nr_anos_experiencia_min?: number;
  habilidades_requeridas: string[];
  habilidades_desejaveis?: string[];
  certificacoes_necessarias?: string[];

  // Status e Visibilidade
  ds_status: StatusVaga;
  fg_destaque: boolean;
  dt_expiracao?: string;

  // Estatísticas
  nr_vagas: number; // Quantidade de vagas disponíveis
  nr_candidatos?: number;
  nr_visualizacoes?: number;

  // Metadados
  dt_criacao: string;
  dt_atualizacao: string;
  dt_publicacao?: string;
}

export interface CriarVagaData {
  nm_cargo: string;
  ds_resumo: string;
  ds_responsabilidades: string;
  ds_requisitos: string;
  ds_diferenciais?: string;
  nm_area: string;
  nm_nivel: NivelVaga;
  nm_tipo_contrato: TipoContrato;
  nm_regime_trabalho: RegimeTrabalho;
  nm_cidade: string;
  nm_estado: string;
  fg_aceita_remoto: boolean;
  vl_salario_min?: number;
  vl_salario_max?: number;
  fg_salario_a_combinar: boolean;
  ds_beneficios?: string[];
  nr_anos_experiencia_min?: number;
  habilidades_requeridas: string[];
  habilidades_desejaveis?: string[];
  certificacoes_necessarias?: string[];
  nr_vagas: number;
  dt_expiracao?: string;
}

export interface AtualizarVagaData extends Partial<CriarVagaData> {
  ds_status?: StatusVaga;
  fg_destaque?: boolean;
}

// ============================================================================
// CANDIDATURAS
// ============================================================================

export type StatusCandidatura =
  | "enviada"
  | "visualizada"
  | "em_analise"
  | "entrevista_agendada"
  | "aprovada"
  | "reprovada"
  | "desistiu";

export interface Candidatura {
  id_candidatura: string;
  id_vaga: string;
  id_curriculo: string;
  id_candidato: string;

  // Dados da Vaga (desnormalizado)
  nm_cargo: string;
  nm_empresa: string;

  // Dados do Candidato (desnormalizado)
  nm_candidato: string;
  ds_email_candidato: string;
  ds_foto_candidato?: string;

  // Candidatura
  ds_carta_apresentacao?: string;
  ds_status: StatusCandidatura;
  nr_match_score?: number; // 0-100 (calculado por IA)

  // Processo Seletivo
  dt_visualizacao?: string;
  dt_entrevista?: string;
  ds_feedback_empresa?: string;
  ds_motivo_reprovacao?: string;

  // Metadados
  dt_candidatura: string;
  dt_atualizacao: string;
}

export interface CriarCandidaturaData {
  id_vaga: string;
  id_curriculo: string;
  ds_carta_apresentacao?: string;
}

export interface AtualizarCandidaturaData {
  ds_status?: StatusCandidatura;
  dt_entrevista?: string;
  ds_feedback_empresa?: string;
  ds_motivo_reprovacao?: string;
}

// ============================================================================
// FILTROS E LISTAGENS
// ============================================================================

export interface VagasFiltros {
  nm_cargo?: string;
  nm_area?: string;
  nm_cidade?: string;
  nm_estado?: string;
  nm_nivel?: NivelVaga;
  nm_tipo_contrato?: TipoContrato;
  nm_regime_trabalho?: RegimeTrabalho;
  vl_salario_min?: number;
  habilidades?: string[];
  fg_aceita_remoto?: boolean;
  ds_status?: StatusVaga;
  page?: number;
  size?: number;
}

export interface CurriculosFiltros {
  nm_cargo_desejado?: string;
  nm_cidade?: string;
  nm_estado?: string;
  nm_nivel_experiencia?: NivelExperiencia;
  habilidades?: string[];
  nr_anos_experiencia_min?: number;
  tipos_contrato_aceitos?: TipoContrato[];
  regimes_trabalho_aceitos?: RegimeTrabalho[];
  page?: number;
  size?: number;
}

export interface CandidaturasFiltros {
  id_vaga?: string;
  id_curriculo?: string;
  ds_status?: StatusCandidatura;
  nr_match_score_min?: number;
  page?: number;
  size?: number;
}

// ============================================================================
// RESPONSES
// ============================================================================

export interface VagasResponse {
  vagas: Vaga[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface CurriculosResponse {
  curriculos: Curriculo[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface CandidaturasResponse {
  candidaturas: Candidatura[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

export interface EstatisticasCarreiras {
  total_vagas_ativas: number;
  total_curriculos_ativos: number;
  total_candidaturas: number;
  taxa_conversao: number;
  vagas_por_area: Array<{ nm_area: string; count: number }>;
  salario_medio: number;
}
