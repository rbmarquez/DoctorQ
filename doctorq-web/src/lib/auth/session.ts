/**
 * Session helpers for Server Components
 *
 * Provides utilities to access user session and data in Server Components
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { serverFetch } from '@/lib/api/server';

/**
 * Get current session (or redirect to login if not authenticated)
 */
export async function getSession() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

/**
 * Get current session (returns null if not authenticated)
 */
export async function getSessionOrNull() {
  return await auth();
}

/**
 * Get current user ID from session
 */
export async function getUserId(): Promise<string> {
  const session = await getSession();
  return session.user.id!;
}

/**
 * Get current user role from session
 */
export async function getUserRole(): Promise<string> {
  const session = await getSession();
  return session.user.role || 'paciente';
}

/**
 * Get full user data from backend
 */
export async function getUserData() {
  const session = await getSession();
  const userId = session.user.id;

  try {
    // Usar URL sem trailing slash para evitar redirect 307
    const userData = await serverFetch<any>(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    return userData;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    throw error;
  }
}

/**
 * Get ID do paciente associado ao usuário
 *
 * Para usuários do tipo paciente, o id_user é usado como id_paciente
 * quando não há um registro explícito na tabela tb_pacientes
 */
export async function getPacienteId(): Promise<string | null> {
  try {
    const session = await getSession();
    const userData = await getUserData();

    // Primeiro tenta obter id_paciente explícito do backend
    if (userData.id_paciente) {
      return userData.id_paciente;
    }

    // Se não existir, usa id_user como id_paciente para usuários do tipo paciente
    // Isso ocorre quando o agendamento foi criado usando o id_user diretamente
    const userId = userData.id_user || session.user.id;
    if (userId) {
      return userId;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar ID do paciente:', error);
    return null;
  }
}

/**
 * Get ID do profissional associado ao usuário
 */
export async function getProfissionalId(): Promise<string | null> {
  try {
    const userData = await getUserData();
    return userData.id_profissional || null;
  } catch (error) {
    console.error('Erro ao buscar ID do profissional:', error);
    return null;
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const session = await getSessionOrNull();
  return session?.user?.role === role;
}

/**
 * Require specific role (redirect to /dashboard if not authorized)
 */
export async function requireRole(role: string) {
  const userRole = await getUserRole();

  if (userRole !== role) {
    redirect('/dashboard');
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole('admin');
}

/**
 * Check if user is profissional
 */
export async function isProfissional(): Promise<boolean> {
  return await hasRole('profissional');
}

/**
 * Check if user is paciente
 */
export async function isPaciente(): Promise<boolean> {
  return await hasRole('paciente');
}
