/**
 * Hooks SWR para User/Profile
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface User {
  id_user: string;
  nm_email: string;
  nm_completo: string;
  nm_papel: string;
  nr_telefone?: string;
  ds_foto_url?: string;
  st_ativo: string;
  nr_total_logins: string;
  dt_ultimo_login?: string;
  dt_criacao: string;
  dt_atualizacao: string;
  ds_preferencias?: UserPreferences;
}

export interface UserPreferences {
  // Profile extended fields
  dt_nascimento?: string;
  ds_genero?: string;
  nr_cep?: string;
  ds_endereco?: string;
  ds_bairro?: string;
  ds_cidade?: string;
  ds_estado?: string;

  // Notification settings
  notificacoes?: {
    email_agendamentos?: boolean;
    email_lembretes?: boolean;
    email_promocoes?: boolean;
    sms_agendamentos?: boolean;
    sms_lembretes?: boolean;
    push_agendamentos?: boolean;
    push_promocoes?: boolean;
  };

  // Privacy settings
  privacidade?: {
    perfil_publico?: boolean;
    mostrar_avaliacoes?: boolean;
    permitir_mensagens?: boolean;
    compartilhar_dados_pesquisa?: boolean;
  };
}

export interface UserUpdateData {
  nm_completo?: string;
  nm_email?: string;
  nr_telefone?: string;
  ds_foto_url?: string;
  ds_preferencias?: UserPreferences;
}

export interface PasswordChangeData {
  senha_atual: string;
  senha_nova: string;
  senha_nova_confirmacao: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obter dados do usuário autenticado
 */
export function useCurrentUser() {
  const { data, error, isLoading } = useSWR<User>(
    endpoints.auth.me,
    () => apiClient.get(endpoints.auth.me),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    user: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter dados de um usuário específico
 */
export function useUser(userId: string | null) {
  const { data, error, isLoading } = useSWR<User>(
    userId ? `/users/${userId}` : null,
    () => (userId ? apiClient.get(`/users/${userId}`) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  );

  return {
    user: data,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Atualizar dados do usuário
 */
export async function atualizarUsuario(
  userId: string,
  data: UserUpdateData
): Promise<User> {
  const result = await apiClient.put<User>(`/users/${userId}`, data);

  // Revalidate cache
  await mutate(endpoints.auth.me);
  await mutate(`/users/${userId}`);

  return result;
}

/**
 * Atualizar preferências do usuário
 */
export async function atualizarPreferencias(
  userId: string,
  preferencias: Partial<UserPreferences>
): Promise<User> {
  // Fetch current user to get existing preferences
  const currentUser = await apiClient.get<User>(endpoints.auth.me);

  // Merge with existing preferences
  const updatedPreferences = {
    ...currentUser.ds_preferencias,
    ...preferencias,
  };

  return atualizarUsuario(userId, {
    ds_preferencias: updatedPreferences,
  });
}

/**
 * Atualizar notificações
 */
export async function atualizarNotificacoes(
  userId: string,
  notificacoes: UserPreferences['notificacoes']
): Promise<User> {
  const currentUser = await apiClient.get<User>(endpoints.auth.me);

  return atualizarUsuario(userId, {
    ds_preferencias: {
      ...currentUser.ds_preferencias,
      notificacoes,
    },
  });
}

/**
 * Atualizar privacidade
 */
export async function atualizarPrivacidade(
  userId: string,
  privacidade: UserPreferences['privacidade']
): Promise<User> {
  const currentUser = await apiClient.get<User>(endpoints.auth.me);

  return atualizarUsuario(userId, {
    ds_preferencias: {
      ...currentUser.ds_preferencias,
      privacidade,
    },
  });
}

/**
 * Alterar senha do usuário
 *
 * @param userId - ID do usuário
 * @param data - Dados da mudança de senha (senha_atual, senha_nova, senha_nova_confirmacao)
 * @returns Promise<{ success: boolean, message: string }>
 *
 * @example
 * ```tsx
 * const handleChangePassword = async () => {
 *   try {
 *     const result = await alterarSenha(userId, {
 *       senha_atual: "senhaAntiga123",
 *       senha_nova: "senhaNova456",
 *       senha_nova_confirmacao: "senhaNova456"
 *     });
 *     toast.success(result.message);
 *   } catch (error: any) {
 *     toast.error(error.message);
 *   }
 * };
 * ```
 */
export async function alterarSenha(
  userId: string,
  data: PasswordChangeData
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `/users/${userId}/password`,
      data
    );
    return response;
  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);

    // Tratar erros específicos
    if (error.response?.status === 401) {
      throw new Error("Senha atual incorreta");
    } else if (error.response?.status === 404) {
      throw new Error("Usuário não encontrado");
    } else if (error.response?.status === 400) {
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        throw new Error(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Pydantic validation errors
        const firstError = detail[0];
        throw new Error(firstError.msg || "Dados inválidos");
      } else {
        throw new Error("Dados inválidos");
      }
    } else {
      throw new Error("Erro ao alterar senha. Tente novamente.");
    }
  }
}

/**
 * Upload de foto de perfil
 */
export async function uploadFotoPerfil(
  userId: string,
  file: File
): Promise<User> {
  const formData = new FormData();
  formData.append('file', file);

  // Upload da imagem
  const uploadResult = await apiClient.post<{ url: string }>(
    endpoints.upload.image,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  // Atualizar URL da foto no perfil
  return atualizarUsuario(userId, {
    ds_foto_url: uploadResult.url,
  });
}

// ============================================================================
// REVALIDATION
// ============================================================================

/**
 * Revalidar dados do usuário autenticado
 */
export function revalidarUsuarioAtual() {
  return mutate(endpoints.auth.me);
}

/**
 * Revalidar dados de um usuário específico
 */
export function revalidarUsuario(userId: string) {
  return mutate(`/users/${userId}`);
}
