/**
 * Hook para gerenciamento de Onboarding do Usuário
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface OnboardingPreferences {
  interesses: string[];
  objetivos: string[];
  frequencia_uso: string;
  nivel_experiencia: string;
  notificacoes_email: boolean;
  notificacoes_push: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface OnboardingStatus {
  id_user: string;
  st_onboarding_completed: boolean;
  dt_onboarding_completed: string | null;
  ds_preferencias: OnboardingPreferences | null;
  nr_step_atual: number;
  nr_total_steps: number;
}

export interface SalvarOnboardingData {
  ds_preferencias: OnboardingPreferences;
  st_onboarding_completed: boolean;
}

// ====================================================================
// HOOKS
// ====================================================================

export function useOnboardingStatus(userId: string | null) {
  const shouldFetch = Boolean(userId);

  const { data, error, isLoading, mutate } = useSWR<OnboardingStatus>(
    shouldFetch ? `/onboarding/${userId}` : null,
    async () => {
      const response = await apiClient.get<OnboardingStatus>(`/onboarding/${userId}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  );

  return {
    status: data,
    isLoading,
    error,
    mutate,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

export async function salvarOnboarding(
  userId: string,
  data: SalvarOnboardingData
): Promise<OnboardingStatus> {
  const response = await apiClient.post<OnboardingStatus>(`/onboarding/${userId}`, data);
  return response;
}

export async function atualizarStepOnboarding(
  userId: string,
  step: number
): Promise<OnboardingStatus> {
  const response = await apiClient.patch<OnboardingStatus>(`/onboarding/${userId}/step`, {
    nr_step_atual: step,
  });
  return response;
}

export async function completarOnboarding(
  userId: string,
  preferencias: OnboardingPreferences
): Promise<OnboardingStatus> {
  return salvarOnboarding(userId, {
    ds_preferencias: preferencias,
    st_onboarding_completed: true,
  });
}

export async function resetarOnboarding(userId: string): Promise<OnboardingStatus> {
  const response = await apiClient.delete<OnboardingStatus>(`/onboarding/${userId}`);
  return response;
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarOnboarding(userId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/onboarding/${userId}`);
}

// ====================================================================
// HELPERS
// ====================================================================

export function needsOnboarding(status: OnboardingStatus | undefined): boolean {
  return !status?.st_onboarding_completed;
}

export function getOnboardingProgress(status: OnboardingStatus | undefined): number {
  if (!status) return 0;
  return Math.round((status.nr_step_atual / status.nr_total_steps) * 100);
}
