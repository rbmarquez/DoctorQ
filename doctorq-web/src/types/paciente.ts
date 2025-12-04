/**
 * Tipos para Pacientes - Sistema DoctorQ
 */

export interface Paciente {
  id_paciente: string;
  id_user?: string;
  id_clinica?: string;
  id_profissional?: string;

  // Informações pessoais
  nm_paciente: string;
  dt_nascimento?: string;
  nr_cpf: string;
  nr_rg?: string;
  nm_genero?: "masculino" | "feminino" | "outro" | "prefiro_nao_dizer";

  // Contato
  ds_email?: string;
  nr_telefone?: string;
  nr_whatsapp?: string;

  // Endereço
  ds_endereco?: string;
  nr_numero?: string;
  ds_complemento?: string;
  nm_bairro?: string;
  nm_cidade?: string;
  nm_estado?: string;
  nr_cep?: string;

  // Informações médicas
  ds_tipo_sanguineo?: string;
  ds_alergias?: string;
  ds_medicamentos_uso?: string;
  ds_condicoes_medicas?: string;
  ds_cirurgias_previas?: string;
  ds_observacoes?: string;

  // Convênio
  st_possui_convenio: boolean;
  nm_convenio?: string;
  nr_carteirinha?: string;

  // Foto
  ds_foto?: string;

  // Status
  st_ativo: boolean;

  // Metadata
  dt_primeira_consulta?: string;
  dt_ultima_consulta?: string;
  nr_total_consultas: number;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface PacienteCreate {
  id_user?: string;
  id_clinica?: string;
  id_profissional?: string;
  nm_paciente: string;
  dt_nascimento?: string;
  nr_cpf: string;
  nr_rg?: string;
  nm_genero?: string;
  ds_email?: string;
  nr_telefone?: string;
  nr_whatsapp?: string;
  ds_endereco?: string;
  nr_numero?: string;
  ds_complemento?: string;
  nm_bairro?: string;
  nm_cidade?: string;
  nm_estado?: string;
  nr_cep?: string;
  ds_tipo_sanguineo?: string;
  ds_alergias?: string;
  ds_medicamentos_uso?: string;
  ds_condicoes_medicas?: string;
  ds_cirurgias_previas?: string;
  ds_observacoes?: string;
  st_possui_convenio?: boolean;
  nm_convenio?: string;
  nr_carteirinha?: string;
}

export interface PacienteUpdate {
  id_clinica?: string;
  nm_paciente?: string;
  dt_nascimento?: string;
  nr_cpf?: string;
  nr_rg?: string;
  nm_genero?: string;
  ds_email?: string;
  nr_telefone?: string;
  nr_whatsapp?: string;
  ds_endereco?: string;
  nr_numero?: string;
  ds_complemento?: string;
  nm_bairro?: string;
  nm_cidade?: string;
  nm_estado?: string;
  nr_cep?: string;
  ds_tipo_sanguineo?: string;
  ds_alergias?: string;
  ds_medicamentos_uso?: string;
  ds_condicoes_medicas?: string;
  ds_cirurgias_previas?: string;
  ds_observacoes?: string;
  st_possui_convenio?: boolean;
  nm_convenio?: string;
  nr_carteirinha?: string;
  st_ativo?: boolean;
}

export interface PacienteListResponse {
  total: number;
  page: number;
  size: number;
  items: Paciente[];
}

export interface PacienteFilters {
  id_clinica?: string;
  busca?: string;
  apenas_ativos?: boolean;
  page?: number;
  size?: number;
}

export const GENEROS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_dizer", label: "Prefiro não dizer" },
] as const;

export const TIPOS_SANGUINEOS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const ESTADOS_BRASIL = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
] as const;
