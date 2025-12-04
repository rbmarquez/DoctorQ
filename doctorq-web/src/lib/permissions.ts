/**
 * Sistema de Permissões do DoctorQ
 *
 * Define permissões granulares por perfil de usuário.
 * Permite verificar se um usuário tem permissão para executar determinada ação em um recurso.
 */

export type Permission = 'criar' | 'editar' | 'listar' | 'deletar' | 'ver_todos' | 'ver_proprios' | 'cancelar' | 'gerar_relatorios';

export type Resource =
  | 'profissionais'
  | 'agendamentos'
  | 'procedimentos'
  | 'pacientes'
  | 'prontuarios'
  | 'financeiro'
  | 'usuarios'
  | 'empresas'
  | 'perfis'
  | 'agentes'
  | 'configuracoes';

export type Role =
  | 'admin'
  | 'super_admin'
  | 'gestor_clinica'
  | 'medico'
  | 'profissional_estetica'
  | 'secretaria'
  | 'financeiro'
  | 'paciente'
  | 'fornecedor'
  | 'gestor_fornecedor';

/**
 * Matriz de permissões por perfil
 */
export const PERMISSIONS: Record<Role, Partial<Record<Resource, Permission[]>>> = {
  // Administrador do sistema (acesso total)
  admin: {
    usuarios: ['criar', 'editar', 'listar', 'deletar'],
    empresas: ['criar', 'editar', 'listar', 'deletar'],
    perfis: ['criar', 'editar', 'listar', 'deletar'],
    agentes: ['criar', 'editar', 'listar', 'deletar'],
    profissionais: ['criar', 'editar', 'listar', 'deletar', 'ver_todos'],
    agendamentos: ['criar', 'editar', 'listar', 'deletar', 'ver_todos', 'cancelar'],
    procedimentos: ['criar', 'editar', 'listar', 'deletar'],
    pacientes: ['criar', 'editar', 'listar', 'deletar', 'ver_todos'],
    prontuarios: ['criar', 'editar', 'listar', 'deletar', 'ver_todos'],
    financeiro: ['criar', 'editar', 'listar', 'deletar', 'ver_todos', 'gerar_relatorios'],
    configuracoes: ['criar', 'editar', 'listar', 'deletar'],
  },

  // Super Admin (idêntico ao admin, para compatibilidade)
  super_admin: {
    usuarios: ['criar', 'editar', 'listar', 'deletar'],
    empresas: ['criar', 'editar', 'listar', 'deletar'],
    perfis: ['criar', 'editar', 'listar', 'deletar'],
    agentes: ['criar', 'editar', 'listar', 'deletar'],
    profissionais: ['criar', 'editar', 'listar', 'deletar', 'ver_todos'],
    agendamentos: ['criar', 'editar', 'listar', 'deletar', 'ver_todos', 'cancelar'],
    procedimentos: ['criar', 'editar', 'listar', 'deletar'],
    pacientes: ['criar', 'editar', 'listar', 'deletar', 'ver_todos'],
    prontuarios: ['criar', 'editar', 'listar', 'deletar', 'ver_todos'],
    financeiro: ['criar', 'editar', 'listar', 'deletar', 'ver_todos', 'gerar_relatorios'],
    configuracoes: ['criar', 'editar', 'listar', 'deletar'],
  },

  // Gestor de Clínica (gerencia múltiplos profissionais)
  gestor_clinica: {
    profissionais: ['criar', 'editar', 'listar', 'deletar'],
    agendamentos: ['criar', 'editar', 'listar', 'ver_todos', 'cancelar'],
    procedimentos: ['criar', 'editar', 'listar', 'deletar'],
    pacientes: ['criar', 'editar', 'listar', 'ver_todos'],
    prontuarios: ['listar', 'ver_todos'],  // Apenas visualização
    financeiro: ['listar', 'ver_todos', 'gerar_relatorios'],
    configuracoes: ['editar', 'listar'],
  },

  // Médico (profissional individual)
  medico: {
    profissionais: ['listar', 'ver_proprios'],  // Apenas seus próprios dados
    agendamentos: ['criar', 'editar', 'listar', 'ver_proprios', 'cancelar'],
    procedimentos: ['listar'],  // Apenas visualização
    pacientes: ['criar', 'editar', 'listar', 'ver_proprios'],
    prontuarios: ['criar', 'editar', 'listar', 'ver_proprios'],
    financeiro: ['listar', 'ver_proprios'],
  },

  // Profissional de Estética (similar ao médico)
  profissional_estetica: {
    profissionais: ['listar', 'ver_proprios'],
    agendamentos: ['criar', 'editar', 'listar', 'ver_proprios', 'cancelar'],
    procedimentos: ['listar'],
    pacientes: ['criar', 'editar', 'listar', 'ver_proprios'],
    prontuarios: ['criar', 'editar', 'listar', 'ver_proprios'],
    financeiro: ['listar', 'ver_proprios'],
  },

  // Secretária (gerencia agendamentos)
  secretaria: {
    profissionais: ['listar'],
    agendamentos: ['criar', 'editar', 'listar', 'ver_todos', 'cancelar'],
    procedimentos: ['listar'],
    pacientes: ['criar', 'editar', 'listar', 'ver_todos'],
    prontuarios: ['listar'],  // Apenas visualização
    financeiro: ['listar'],
  },

  // Financeiro (gerencia pagamentos)
  financeiro: {
    profissionais: ['listar'],
    agendamentos: ['listar', 'ver_todos'],
    procedimentos: ['listar'],
    pacientes: ['listar', 'ver_todos'],
    financeiro: ['criar', 'editar', 'listar', 'ver_todos', 'gerar_relatorios'],
  },

  // Paciente (acesso limitado aos próprios dados)
  paciente: {
    agendamentos: ['criar', 'listar', 'ver_proprios', 'cancelar'],
    pacientes: ['editar', 'ver_proprios'],  // Apenas seu próprio perfil
    prontuarios: ['listar', 'ver_proprios'],  // Apenas seus prontuários
    financeiro: ['listar', 'ver_proprios'],  // Apenas suas finanças
  },

  // Fornecedor (acesso ao marketplace)
  fornecedor: {
    procedimentos: ['criar', 'editar', 'listar'],
    financeiro: ['listar', 'ver_proprios'],
  },

  // Gestor de Fornecedor
  gestor_fornecedor: {
    profissionais: ['listar'],  // Pode ver profissionais para marketing
    procedimentos: ['criar', 'editar', 'listar', 'deletar'],
    financeiro: ['listar', 'ver_todos', 'gerar_relatorios'],
  },
};

/**
 * Verifica se um perfil tem permissão para executar uma ação em um recurso
 *
 * @param role - Perfil do usuário
 * @param resource - Recurso a ser acessado
 * @param permission - Permissão desejada
 * @returns true se o usuário tem a permissão, false caso contrário
 *
 * @example
 * ```ts
 * if (hasPermission('gestor_clinica', 'profissionais', 'criar')) {
 *   // Permite criar profissional
 * }
 * ```
 */
export function hasPermission(
  role: Role | string,
  resource: Resource,
  permission: Permission
): boolean {
  // Tratamento para roles não reconhecidas
  if (!PERMISSIONS[role as Role]) {
    return false;
  }

  const rolePermissions = PERMISSIONS[role as Role];
  const resourcePermissions = rolePermissions[resource];

  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions.includes(permission);
}

/**
 * Retorna todas as permissões de um perfil para um recurso
 *
 * @param role - Perfil do usuário
 * @param resource - Recurso a ser acessado
 * @returns Array de permissões ou array vazio
 *
 * @example
 * ```ts
 * const permissions = getResourcePermissions('medico', 'pacientes');
 * // ['criar', 'editar', 'listar', 'ver_proprios']
 * ```
 */
export function getResourcePermissions(
  role: Role | string,
  resource: Resource
): Permission[] {
  if (!PERMISSIONS[role as Role]) {
    return [];
  }

  const rolePermissions = PERMISSIONS[role as Role];
  return rolePermissions[resource] || [];
}

/**
 * Verifica se um perfil tem TODAS as permissões especificadas para um recurso
 *
 * @param role - Perfil do usuário
 * @param resource - Recurso a ser acessado
 * @param permissions - Array de permissões requeridas
 * @returns true se o usuário tem todas as permissões
 *
 * @example
 * ```ts
 * if (hasAllPermissions('gestor_clinica', 'profissionais', ['criar', 'editar'])) {
 *   // Permite criar e editar profissionais
 * }
 * ```
 */
export function hasAllPermissions(
  role: Role | string,
  resource: Resource,
  permissions: Permission[]
): boolean {
  return permissions.every(permission =>
    hasPermission(role, resource, permission)
  );
}

/**
 * Verifica se um perfil tem ALGUMA das permissões especificadas para um recurso
 *
 * @param role - Perfil do usuário
 * @param resource - Recurso a ser acessado
 * @param permissions - Array de permissões requeridas
 * @returns true se o usuário tem pelo menos uma das permissões
 *
 * @example
 * ```ts
 * if (hasAnyPermission('medico', 'pacientes', ['criar', 'editar'])) {
 *   // Permite criar OU editar pacientes
 * }
 * ```
 */
export function hasAnyPermission(
  role: Role | string,
  resource: Resource,
  permissions: Permission[]
): boolean {
  return permissions.some(permission =>
    hasPermission(role, resource, permission)
  );
}

/**
 * Retorna todos os recursos que um perfil pode acessar
 *
 * @param role - Perfil do usuário
 * @returns Array de recursos
 *
 * @example
 * ```ts
 * const resources = getAllowedResources('paciente');
 * // ['agendamentos', 'pacientes', 'prontuarios', 'financeiro']
 * ```
 */
export function getAllowedResources(role: Role | string): Resource[] {
  if (!PERMISSIONS[role as Role]) {
    return [];
  }

  return Object.keys(PERMISSIONS[role as Role]) as Resource[];
}

/**
 * Hook de permissões (React)
 * Pode ser usado em componentes para verificar permissões
 */
export function usePermissions(role: Role | string | undefined) {
  return {
    hasPermission: (resource: Resource, permission: Permission) =>
      role ? hasPermission(role, resource, permission) : false,

    hasAllPermissions: (resource: Resource, permissions: Permission[]) =>
      role ? hasAllPermissions(role, resource, permissions) : false,

    hasAnyPermission: (resource: Resource, permissions: Permission[]) =>
      role ? hasAnyPermission(role, resource, permissions) : false,

    getResourcePermissions: (resource: Resource) =>
      role ? getResourcePermissions(role, resource) : [],

    getAllowedResources: () =>
      role ? getAllowedResources(role) : [],
  };
}
