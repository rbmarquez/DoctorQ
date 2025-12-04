/**
 * Hook SWR para gestão de equipe (sub-usuários) de clínicas
 */

import useSWR from 'swr'
import { fetcher } from '@/lib/api/client'

export interface UsuarioEquipe {
  id_user: string
  nm_email: string
  nm_completo: string
  nm_perfil: string | null
  ds_perfil: string | null
  dt_criacao: string | null
  dt_ultimo_login: string | null
  nr_total_logins: string
  id_usuario_criador: string | null
  nm_criador: string | null
  st_ativo: string
}

export interface LimiteUsuarios {
  qt_limite_usuarios: number
  qt_usuarios_atuais: number
  qt_usuarios_disponiveis: number
  fg_limite_atingido: boolean
}

/**
 * Hook para listar usuários da equipe
 */
export function useUsuariosEquipe(id_empresa?: string) {
  const { data, error, isLoading, mutate } = useSWR<UsuarioEquipe[]>(
    id_empresa ? `/clinicas/${id_empresa}/usuarios/` : null,
    fetcher
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook para verificar limites de usuários
 */
export function useLimitesUsuarios(id_empresa?: string) {
  const { data, error, isLoading, mutate } = useSWR<LimiteUsuarios>(
    id_empresa ? `/clinicas/${id_empresa}/limites/` : null,
    fetcher
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
