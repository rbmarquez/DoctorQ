/**
 * Types para sistema de parceiros (Partner System)
 */

export type PartnerLeadStatus =
  | 'pending'
  | 'contacted'
  | 'approved'
  | 'rejected'
  | 'converted';

export type PartnerType = 'paciente' | 'profissional' | 'clinica' | 'fornecedor';

export interface PartnerLead {
  id_partner_lead: string;
  tp_partner: PartnerType;
  nm_contato: string;
  nm_email: string;
  nm_telefone?: string;
  nm_empresa: string;
  nr_cnpj?: string;
  ds_endereco?: string;
  nm_status: PartnerLeadStatus;
  ds_notes?: string;
  ds_metadata?: Record<string, any>;
  id_empresa?: string;
  id_user?: string;
  dt_criacao: string;
  dt_atualizacao: string;
  dt_converted?: string;
  dt_contacted?: string;
}

export interface PartnerLeadCreate {
  tp_partner: PartnerType;
  nm_contato: string;
  nm_email: string;
  nm_telefone?: string;
  nm_empresa: string;
  nr_cnpj?: string;
  ds_endereco?: string;
  ds_notes?: string;
  ds_metadata?: Record<string, any>;
}

export interface PartnerLeadFilters {
  page?: number;
  size?: number;
  status?: PartnerLeadStatus;
  partner_type?: PartnerType;
  search?: string;
  order_by?: string;
  order_desc?: boolean;
}

export interface PartnerPackage {
  id_package: string;
  id_partner_lead?: string;
  nm_package: string;
  ds_package?: string;
  tp_partner: PartnerType;
  vl_price: number;
  nr_duration_months: number;
  nm_status: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface PartnerPackageCreate {
  id_partner_lead?: string;
  nm_package: string;
  ds_package?: string;
  tp_partner: PartnerType;
  vl_price: number;
  nr_duration_months: number;
}

// ============================================================================
// PARTNER LEAD QUESTIONS
// ============================================================================

export type InputType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'number'
  | 'email'
  | 'tel'
  | 'date';

export interface PartnerLeadQuestion {
  id_question: string;
  tp_partner: PartnerType;
  nm_question: string;
  tp_input: InputType;
  ds_options?: {
    options: string[];
  };
  ds_placeholder?: string;
  ds_help_text?: string;
  nr_order: number;
  st_required: boolean;
  st_active: boolean;
  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface PartnerLeadQuestionCreate {
  tp_partner: PartnerType;
  nm_question: string;
  tp_input: InputType;
  ds_options?: {
    options: string[];
  };
  ds_placeholder?: string;
  ds_help_text?: string;
  nr_order?: number;
  st_required?: boolean;
  st_active?: boolean;
}

export interface PartnerLeadQuestionUpdate {
  tp_partner?: PartnerType;
  nm_question?: string;
  tp_input?: InputType;
  ds_options?: {
    options: string[];
  };
  ds_placeholder?: string;
  ds_help_text?: string;
  nr_order?: number;
  st_required?: boolean;
  st_active?: boolean;
}

export interface PartnerLeadQuestionFilters {
  page?: number;
  size?: number;
  tp_partner?: PartnerType;
  st_active?: boolean;
  search?: string;
}
