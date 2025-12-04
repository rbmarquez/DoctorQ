/**
 * Tipos para o sistema de controle de acesso em dois níveis
 *
 * Nível 1: Grupos de acesso (admin, clinica, profissional, paciente, fornecedor)
 * Nível 2: Permissões por recurso e ação dentro de cada grupo
 *
 * @author Claude
 * @date 2025-11-05
 */

/**
 * Grupos de acesso disponíveis no sistema
 */
export type GrupoAcesso =
  | 'admin'          // Área administrativa
  | 'clinica'        // Área da clínica
  | 'profissional'   // Área do profissional
  | 'paciente'       // Portal do paciente
  | 'fornecedor';    // Portal do fornecedor

/**
 * Ações que podem ser executadas em recursos
 */
export type AcaoPermissao =
  | 'visualizar'  // Pode visualizar o recurso
  | 'criar'       // Pode criar novos registros
  | 'editar'      // Pode editar registros existentes
  | 'excluir'     // Pode excluir registros
  | 'exportar'    // Pode exportar dados (relatórios)
  | 'executar'    // Pode executar ações (agentes, tools)
  | 'cancelar'    // Pode cancelar (agendamentos)
  | 'upload';     // Pode fazer upload (fotos, arquivos)

/**
 * Permissões de um recurso específico
 */
export interface PermissoesRecurso {
  visualizar?: boolean;
  criar?: boolean;
  editar?: boolean;
  excluir?: boolean;
  exportar?: boolean;
  executar?: boolean;
  cancelar?: boolean;
  upload?: boolean;
}

/**
 * Estrutura de permissões detalhadas
 *
 * @example
 * {
 *   "clinica": {
 *     "agenda": { "criar": true, "editar": true, "visualizar": true },
 *     "pacientes": { "criar": true, "visualizar": true }
 *   },
 *   "profissional": {
 *     "agenda": { "visualizar": true, "editar": true }
 *   }
 * }
 */
export interface PermissoesDetalhadas {
  [grupo: string]: {
    [recurso: string]: PermissoesRecurso;
  };
}

/**
 * Permissões completas de um usuário
 * Retornado pelo endpoint /permissions/users/{id}/permissions
 */
export interface UserPermissions {
  /** Grupos que o usuário pode acessar */
  grupos_acesso: GrupoAcesso[];

  /** Permissões detalhadas por grupo/recurso */
  permissoes_detalhadas: PermissoesDetalhadas;

  /** Se o usuário é administrador total */
  is_admin: boolean;

  /** Nome do perfil do usuário */
  nm_perfil: string;

  /** ID do perfil do usuário */
  id_perfil: string;
}

/**
 * Recursos disponíveis no grupo Admin
 */
export type RecursoAdmin =
  | 'dashboard'
  | 'usuarios'
  | 'empresas'
  | 'perfis'
  | 'agentes'
  | 'conversas'
  | 'analytics'
  | 'configuracoes'
  | 'tools';

/**
 * Recursos disponíveis no grupo Clínica
 */
export type RecursoClinica =
  | 'dashboard'
  | 'agenda'
  | 'pacientes'
  | 'profissionais'
  | 'procedimentos'
  | 'financeiro'
  | 'relatorios'
  | 'configuracoes'
  | 'equipe'
  | 'perfis';

/**
 * Recursos disponíveis no grupo Profissional
 */
export type RecursoProfissional =
  | 'dashboard'
  | 'agenda'
  | 'relatorios'
  | 'procedimentos'
  | 'pacientes';

/**
 * Recursos disponíveis no grupo Paciente
 */
export type RecursoPaciente =
  | 'dashboard'
  | 'agendamentos'
  | 'avaliacoes'
  | 'financeiro'
  | 'fotos'
  | 'mensagens'
  | 'favoritos'
  | 'pedidos'
  | 'perfil';

/**
 * Recursos disponíveis no grupo Fornecedor
 */
export type RecursoFornecedor =
  | 'dashboard'
  | 'produtos'
  | 'pedidos'
  | 'financeiro'
  | 'relatorios'
  | 'perfil';

/**
 * Tipo union de todos os recursos
 */
export type RecursoSistema =
  | RecursoAdmin
  | RecursoClinica
  | RecursoProfissional
  | RecursoPaciente
  | RecursoFornecedor;

/**
 * Mapeamento de ícones por grupo
 */
export const ICONS_GRUPO: Record<GrupoAcesso, string> = {
  admin: 'Shield',
  clinica: 'Building2',
  profissional: 'UserCog',
  paciente: 'Users',
  fornecedor: 'Package',
};

/**
 * Mapeamento de cores por grupo (Tailwind classes)
 */
export const COLORS_GRUPO: Record<GrupoAcesso, string> = {
  admin: 'red',
  clinica: 'blue',
  profissional: 'green',
  paciente: 'purple',
  fornecedor: 'orange',
};

/**
 * Labels amigáveis para grupos
 */
export const LABELS_GRUPO: Record<GrupoAcesso, string> = {
  admin: 'Administração',
  clinica: 'Clínica',
  profissional: 'Profissional',
  paciente: 'Paciente',
  fornecedor: 'Fornecedor',
};

/**
 * Labels amigáveis para ações
 */
export const LABELS_ACAO: Record<AcaoPermissao, string> = {
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  exportar: 'Exportar',
  executar: 'Executar',
  cancelar: 'Cancelar',
  upload: 'Upload',
};

/**
 * Template de permissões vazio
 */
export const EMPTY_PERMISSIONS: UserPermissions = {
  grupos_acesso: [],
  permissoes_detalhadas: {},
  is_admin: false,
  nm_perfil: '',
  id_perfil: '',
};

/**
 * Helper function para verificar se tem permissão
 */
export function temPermissao(
  permissions: UserPermissions | null | undefined,
  grupo: GrupoAcesso,
  recurso: string,
  acao: AcaoPermissao
): boolean {
  if (!permissions) return false;

  // Verificar se tem acesso ao grupo
  if (!permissions.grupos_acesso.includes(grupo)) return false;

  // Admin tem acesso a tudo
  if (permissions.is_admin && grupo === 'admin') return true;

  // Verificar permissão específica
  const recursoPerms = permissions.permissoes_detalhadas[grupo]?.[recurso];
  return recursoPerms?.[acao] ?? false;
}

/**
 * Helper function para verificar acesso a grupo
 */
export function temAcessoGrupo(
  permissions: UserPermissions | null | undefined,
  grupo: GrupoAcesso
): boolean {
  if (!permissions) return false;
  return permissions.grupos_acesso.includes(grupo);
}

/**
 * Helper function para obter recursos acessíveis em um grupo
 */
export function getRecursosAcessiveis(
  permissions: UserPermissions | null | undefined,
  grupo: GrupoAcesso
): string[] {
  if (!permissions || !permissions.permissoes_detalhadas[grupo]) return [];
  return Object.keys(permissions.permissoes_detalhadas[grupo]);
}

/**
 * Helper function para obter ações permitidas em um recurso
 */
export function getAcoesPermitidas(
  permissions: UserPermissions | null | undefined,
  grupo: GrupoAcesso,
  recurso: string
): AcaoPermissao[] {
  if (!permissions || !permissions.permissoes_detalhadas[grupo]?.[recurso]) {
    return [];
  }

  const recursoPerms = permissions.permissoes_detalhadas[grupo][recurso];
  return Object.entries(recursoPerms)
    .filter(([_, permitido]) => permitido)
    .map(([acao]) => acao as AcaoPermissao);
}
