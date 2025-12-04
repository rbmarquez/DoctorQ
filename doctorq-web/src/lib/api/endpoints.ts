/**
 * API Endpoints - Centralização de todos os endpoints da API
 */

export const endpoints = {
  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================
  auth: {
    register: '/users/register',
    login: '/users/login-local',
    oauthLogin: '/users/oauth-login',
    me: '/users/me',
    logout: '/auth/logout',
  },

  // ============================================================================
  // PRODUTOS
  // ============================================================================
  produtos: {
    list: '/produtos-api',
    get: (id: string) => `/produtos-api/${id}`,
    create: '/produtos-api',
    update: (id: string) => `/produtos-api/${id}`,
    delete: (id: string) => `/produtos-api/${id}`,
    stats: (id: string) => `/produtos-api/${id}/stats`,
    categorias: '/produtos-api/categorias',
  },

  // ============================================================================
  // CARRINHO
  // ============================================================================
  carrinho: {
    get: '/carrinho',
    getTotal: '/carrinho/total',
    addItem: '/carrinho/itens',
    updateItem: (id: string) => `/carrinho/itens/${id}`,
    removeItem: (id: string) => `/carrinho/itens/${id}`,
    clear: '/carrinho',
    stats: '/carrinho/stats',
  },

  // ============================================================================
  // PEDIDOS
  // ============================================================================
  pedidos: {
    list: '/pedidos',
    get: (id: string) => `/pedidos/${id}`,
    create: '/pedidos',
    updateStatus: (id: string) => `/pedidos/${id}/status`,
    rastreio: (id: string) => `/pedidos/${id}/rastreio`,
    stats: '/pedidos/stats/geral',
  },

  // ============================================================================
  // PROCEDIMENTOS
  // ============================================================================
  procedimentos: {
    list: '/procedimentos/',  // ✅ Trailing slash para evitar 307 redirect
    get: (id: string) => `/procedimentos/${id}/`,
    create: '/procedimentos/',
    update: (id: string) => `/procedimentos/${id}/`,
    delete: (id: string) => `/procedimentos/${id}/`,
    categorias: '/procedimentos/categorias/',
    comparar: (nome: string) => `/procedimentos/comparar/${nome}/`,
  },

  // ============================================================================
  // PROFISSIONAIS
  // ============================================================================
  profissionais: {
    list: '/profissionais/', // ✅ Trailing slash para listagem
    get: (id: string) => `/profissionais/${id}`, // ✅ SEM trailing slash (backend não usa)
    getPublic: (id: string) => `/profissionais/public/${id}/`, // ✅ Rota pública (sem autenticação)
    create: '/profissionais/',
    update: (id: string) => `/profissionais/${id}`, // ✅ SEM trailing slash
    delete: (id: string) => `/profissionais/${id}`, // ✅ SEM trailing slash
    stats: (id: string) => `/profissionais/${id}/stats`, // ✅ SEM trailing slash
  },

  // ============================================================================
  // AGENDAMENTOS
  // ============================================================================
  agendamentos: {
    list: '/agendamentos/',
    get: (id: string) => `/agendamentos/${id}`,
    create: '/agendamentos/',  // ✅ Adicionar barra para evitar redirect 307
    update: (id: string) => `/agendamentos/${id}`,
    delete: (id: string) => `/agendamentos/${id}`,
    confirmar: (id: string) => `/agendamentos/${id}/confirmar`,
    concluir: (id: string) => `/agendamentos/${id}/concluir`,
    disponiveis: '/agendamentos/disponiveis',
    disponibilidade: '/agendamentos/disponibilidade',
    disponibilidadeBatch: '/agendamentos/disponibilidade/batch', // ✅ Novo endpoint otimizado
    profissionaisDisponiveis: '/agendamentos/profissionais-disponiveis',
  },

  // ============================================================================
  // FORNECEDORES
  // ============================================================================
  fornecedores: {
    list: '/fornecedores',
    get: (id: string) => `/fornecedores/${id}`,
    create: '/fornecedores',
    update: (id: string) => `/fornecedores/${id}`,
    delete: (id: string) => `/fornecedores/${id}`,
    stats: (id: string) => `/fornecedores/${id}/stats`,
  },

  // ============================================================================
  // AVALIAÇÕES
  // ============================================================================
  avaliacoes: {
    list: '/avaliacoes',
    get: (id: string) => `/avaliacoes/${id}`,
    create: '/avaliacoes',
    update: (id: string) => `/avaliacoes/${id}`,
    delete: (id: string) => `/avaliacoes/${id}`,
    moderar: (id: string) => `/avaliacoes/${id}/moderar`,
    marcarUtil: (id: string) => `/avaliacoes/${id}/util`,
    marcarNaoUtil: (id: string) => `/avaliacoes/${id}/nao-util`,
  },

  // ============================================================================
  // FAVORITOS
  // ============================================================================
  favoritos: {
    list: '/favoritos',
    add: '/favoritos',
    remove: (id: string) => `/favoritos/${id}`,
  },

  // ============================================================================
  // NOTIFICAÇÕES
  // ============================================================================
  notificacoes: {
    list: '/notificacoes',
    get: (id: string) => `/notificacoes/${id}`,
    markRead: (id: string) => `/notificacoes/${id}/read`,
    markAllRead: '/notificacoes/read-all',
    delete: (id: string) => `/notificacoes/${id}`,
  },

  // ============================================================================
  // ANAMNESE
  // ============================================================================
  anamnese: {
    get: (userId: string) => `/pacientes/${userId}/anamnese`,
    update: (userId: string) => `/pacientes/${userId}/anamnese`,
    historico: (userId: string) => `/pacientes/${userId}/anamnese/historico`,
  },

  // ============================================================================
  // MENSAGENS
  // ============================================================================
  mensagens: {
    send: '/mensagens',
    conversa: (id: string) => `/mensagens/conversa/${id}`,
    marcarLida: (id: string) => `/mensagens/${id}/marcar-lida`,
    delete: (id: string) => `/mensagens/${id}`,
  },

  // ============================================================================
  // FOTOS
  // ============================================================================
  fotos: {
    list: '/fotos',
    get: (id: string) => `/fotos/${id}`,
    upload: '/fotos',
    update: (id: string) => `/fotos/${id}`,
    delete: (id: string) => `/fotos/${id}`,
  },

  // ============================================================================
  // TRANSAÇÕES
  // ============================================================================
  transacoes: {
    list: '/transacoes',
    create: '/transacoes',
    stats: '/transacoes/stats',
    updateStatus: (id: string) => `/transacoes/${id}/status`,
  },

  // ============================================================================
  // CONVERSAS
  // ============================================================================
  conversas: {
    list: '/conversas',
    create: '/conversas',
    get: (id: string) => `/conversas/${id}`,
    arquivar: (id: string) => `/conversas/${id}/arquivar`,
    delete: (id: string) => `/conversas/${id}`,
    stats: (userId: string) => `/conversas/stats/${userId}`,
  },

  // ============================================================================
  // CLÍNICAS
  // ============================================================================
  clinicas: {
    list: '/clinicas/',  // ✅ Trailing slash para evitar 307 redirect
    get: (id: string) => `/clinicas/${id}/`,
    create: '/clinicas/',
    update: (id: string) => `/clinicas/${id}/`,
    delete: (id: string) => `/clinicas/${id}/`,
    profissionais: (id: string) => `/clinicas/${id}/profissionais/`,
  },

  // ============================================================================
  // ÁLBUNS
  // ============================================================================
  albums: {
    list: '/albums',
    get: (id: string) => `/albums/${id}`,
    create: '/albums',
    update: (id: string) => `/albums/${id}`,
    delete: (id: string) => `/albums/${id}`,
    fotos: (id: string) => `/albums/${id}/fotos`,
    adicionarFoto: (id: string) => `/albums/${id}/fotos`,
    removerFoto: (albumId: string, fotoId: string) => `/albums/${albumId}/fotos/${fotoId}`,
  },

  // ============================================================================
  // CONFIGURAÇÕES
  // ============================================================================
  configuracoes: {
    list: '/configuracoes',
    get: (chave: string) => `/configuracoes/${chave}`,
    update: (chave: string) => `/configuracoes/${chave}`,
  },

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  analytics: {
    dashboard: '/analytics/dashboard',
    vendas: '/analytics/vendas',
    procedimentos: '/analytics/procedimentos',
    profissionais: '/analytics/profissionais',
    events: '/analytics/events',
    snapshots: '/analytics/snapshots',
    metricas: '/analytics/metricas',
  },

  // ============================================================================
  // UPLOAD
  // ============================================================================
  upload: {
    file: '/upload/file',
    simples: '/upload/simples',
    image: '/upload/image',
  },

  // ============================================================================
  // PARTNER SYSTEM - LEADS
  // ============================================================================
  partner: {
    leads: {
      list: '/partner/leads/',
      get: (id: string) => `/partner/leads/${id}/`,
      create: '/partner/leads/',
      approve: (id: string) => `/partner/leads/${id}/approve/`,
      reject: (id: string) => `/partner/leads/${id}/reject/`,
      delete: (id: string) => `/partner/leads/${id}/`,
    },
    packages: {
      list: '/partner/packages/',
      get: (id: string) => `/partner/packages/${id}/`,
      create: '/partner/packages/',
    },
    leadQuestions: {
      list: '/partner/lead-questions/',
      get: (id: string) => `/partner/lead-questions/${id}/`,
      create: '/partner/lead-questions/',
      update: (id: string) => `/partner/lead-questions/${id}/`,
      delete: (id: string) => `/partner/lead-questions/${id}/`,
      toggleActive: (id: string) => `/partner/lead-questions/${id}/toggle-active/`,
      public: (tp_partner: string) => `/partner/lead-questions/public/${tp_partner}/`,
    },
  },
};

/**
 * Helper para construir URL completa do endpoint
 */
export function buildEndpoint(
  endpoint: string | ((...args: any[]) => string),
  ...args: any[]
): string {
  if (typeof endpoint === 'function') {
    return endpoint(...args);
  }
  return endpoint;
}

export default endpoints;
