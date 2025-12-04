/**
 * Hook SWR para Partner Leads
 */

import useSWR from 'swr';
import { apiClient, buildQueryString } from '../client';
import endpoints from '../endpoints';
import type {
  PartnerLead,
  PartnerLeadCreate,
  PartnerLeadFilters,
} from '@/types/partner';
import type { PaginatedResponse } from '../types';

/**
 * Hook para listar leads de parceiros com paginação e filtros
 */
export function usePartnerLeads(filters?: PartnerLeadFilters) {
  const queryString = filters ? buildQueryString(filters) : '';
  const url = `${endpoints.partner.leads.list}${queryString}`;

  const { data, error, isLoading, mutate } = useSWR<
    PaginatedResponse<PartnerLead>
  >(url);

  return {
    leads: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook para obter um lead específico por ID
 */
export function usePartnerLead(leadId: string | null) {
  const url = leadId ? endpoints.partner.leads.get(leadId) : null;

  const { data, error, isLoading, mutate } = useSWR<PartnerLead>(url);

  return {
    lead: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Funções de mutação para leads
 */
export const partnerLeadsActions = {
  /**
   * Criar novo lead
   */
  async create(leadData: PartnerLeadCreate): Promise<PartnerLead> {
    return apiClient.post<PartnerLead>(endpoints.partner.leads.create, leadData);
  },

  /**
   * Aprovar lead
   */
  async approve(leadId: string, notes?: string): Promise<PartnerLead> {
    return apiClient.put<PartnerLead>(
      endpoints.partner.leads.approve(leadId),
      { notes }
    );
  },

  /**
   * Rejeitar lead
   */
  async reject(leadId: string, notes?: string): Promise<PartnerLead> {
    return apiClient.put<PartnerLead>(
      endpoints.partner.leads.reject(leadId),
      { notes }
    );
  },

  /**
   * Deletar lead
   */
  async delete(leadId: string): Promise<void> {
    return apiClient.delete(endpoints.partner.leads.delete(leadId));
  },
};
