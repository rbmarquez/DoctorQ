/**
 * Hooks SWR para Empresas
 * Gestão de empresas no sistema (Admin)
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';

// ============================================================================
// TIPOS
// ============================================================================

export interface Empresa {
  id_empresa: string;
  nm_fantasia: string;
  nm_razao_social: string;
  nr_cnpj: string;
  nm_email: string;
  nr_telefone?: string;
  ds_endereco?: string;
  ds_cidade?: string;
  ds_estado?: string;
  nr_cep?: string;
  ds_logo_url?: string;
  ds_plano: string; // 'free' | 'basic' | 'premium' | 'enterprise'
  st_ativo: string; // 'S' | 'N'
  nr_max_users?: number;
  nr_max_agents?: number;
  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface EmpresasResponse {
  items: Empresa[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface EmpresasFiltros {
  search?: string;
  plano?: string;
  ativo?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
}

export interface CriarEmpresaData {
  nm_fantasia: string;
  nm_razao_social: string;
  nr_cnpj: string;
  nm_email: string;
  nr_telefone?: string;
  ds_endereco?: string;
  ds_cidade?: string;
  ds_estado?: string;
  nr_cep?: string;
  ds_logo_url?: string;
  ds_plano?: string;
  nr_max_users?: number;
  nr_max_agents?: number;
}

export interface AtualizarEmpresaData extends Partial<CriarEmpresaData> {
  st_ativo?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar empresas com filtros
 */
export function useEmpresas(filtros: EmpresasFiltros = {}) {
  const {
    search,
    plano,
    ativo,
    page = 1,
    size = 10,
    order_by = 'dt_criacao',
    order_desc = true,
  } = filtros;

  // Construir query params
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    order_by,
    order_desc: order_desc.toString(),
  });

  if (search) params.append('search', search);
  if (plano) params.append('plano', plano);
  if (ativo) params.append('ativo', ativo);

  const key = `/empresas/?${params.toString()}`;

  const { data, error, isLoading } = useSWR<EmpresasResponse>(
    key,
    async () => {
      try {
        return await apiClient.get<EmpresasResponse>(key);
      } catch (err) {
        console.error("Falha ao carregar empresas:", err);
        return {
          items: [],
          meta: {
            totalItems: 0,
            itemsPerPage: size,
            totalPages: 0,
            currentPage: page,
          },
        };
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
      shouldRetryOnError: false,
    }
  );

  return {
    empresas: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter uma empresa específica
 */
export function useEmpresa(empresaId: string | null) {
  const key = empresaId ? `/empresas/${empresaId}/` : null;

  const { data, error, isLoading } = useSWR<Empresa>(
    key,
    () => (empresaId ? apiClient.get(`/empresas/${empresaId}/`) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    empresa: data,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Criar nova empresa
 */
export async function criarEmpresa(data: CriarEmpresaData): Promise<Empresa> {
  try {
    const result = await apiClient.post<Empresa>('/empresas/', data);

    // Revalidate cache
    await mutate((key: any) => typeof key === 'string' && key.startsWith('/empresas'));

    return result;
  } catch (error: any) {
    console.error('Erro ao criar empresa:', error);

    if (error.response?.status === 400) {
      const detail = error.response?.data?.detail;
      throw new Error(detail || 'Dados inválidos');
    }

    if (error.response?.status === 409) {
      throw new Error('CNPJ já cadastrado');
    }

    throw new Error('Erro ao criar empresa. Tente novamente.');
  }
}

/**
 * Atualizar empresa existente
 */
export async function atualizarEmpresa(
  empresaId: string,
  data: AtualizarEmpresaData
): Promise<Empresa> {
  try {
    const result = await apiClient.put<Empresa>(`/empresas/${empresaId}/`, data);

    // Revalidate cache
    await Promise.all([
      mutate((key: any) => typeof key === 'string' && key.startsWith('/empresas')),
      mutate(`/empresas/${empresaId}`),
    ]);

    return result;
  } catch (error: any) {
    console.error('Erro ao atualizar empresa:', error);

    if (error.response?.status === 404) {
      throw new Error('Empresa não encontrada');
    }

    if (error.response?.status === 400) {
      const detail = error.response?.data?.detail;
      throw new Error(detail || 'Dados inválidos');
    }

    throw new Error('Erro ao atualizar empresa. Tente novamente.');
  }
}

/**
 * Deletar empresa
 */
export async function deletarEmpresa(empresaId: string): Promise<{ message: string }> {
  try {
    const result = await apiClient.delete<{ message: string }>(`/empresas/${empresaId}/`);

    // Revalidate cache
    await mutate((key: any) => typeof key === 'string' && key.startsWith('/empresas'));

    return result;
  } catch (error: any) {
    console.error('Erro ao deletar empresa:', error);

    if (error.response?.status === 404) {
      throw new Error('Empresa não encontrada');
    }

    if (error.response?.status === 400) {
      const detail = error.response?.data?.detail;
      if (detail?.includes('usuários')) {
        throw new Error('Não é possível deletar empresa com usuários ativos');
      }
      throw new Error(detail || 'Não foi possível deletar a empresa');
    }

    throw new Error('Erro ao deletar empresa. Tente novamente.');
  }
}

/**
 * Ativar/Desativar empresa
 */
export async function toggleEmpresaStatus(empresaId: string, ativar: boolean): Promise<Empresa> {
  try {
    const result = await atualizarEmpresa(empresaId, {
      st_ativo: ativar ? 'S' : 'N',
    });

    return result;
  } catch (error: any) {
    throw error;
  }
}

// ============================================================================
// REVALIDATION
// ============================================================================

/**
 * Revalidar lista de empresas
 */
export function revalidarEmpresas() {
  return mutate((key: any) => typeof key === 'string' && key.startsWith('/empresas'));
}

/**
 * Revalidar empresa específica
 */
export function revalidarEmpresa(empresaId: string) {
  return mutate(`/empresas/${empresaId}`);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validar CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação dos dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

/**
 * Formatar CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return cnpj;

  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Obter badge de plano
 */
export function getBadgePlano(plano: string): { label: string; color: string } {
  const planos: Record<string, { label: string; color: string }> = {
    free: { label: 'Grátis', color: 'bg-gray-100 text-gray-800' },
    basic: { label: 'Básico', color: 'bg-blue-100 text-blue-800' },
    premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800' },
    enterprise: { label: 'Enterprise', color: 'bg-orange-100 text-orange-800' },
  };

  return planos[plano] || planos.free;
}
