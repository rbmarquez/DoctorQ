/**
 * API Module - Export central de todos os recursos da API
 */

// Cliente HTTP
export { apiClient, fetcher, uploadFile, APIError } from './client';
export type { RequestOptions } from './client';

// Endpoints
export { endpoints } from './endpoints';

// Hooks de Produtos
export {
  useProdutos,
  useProdutosInfinite,
  useProduto,
  useCategoriasProdutos,
  criarProduto,
  atualizarProduto,
  deletarProduto,
  revalidarProdutos,
} from './hooks/useProdutos';
export type {
  Produto,
  CategoriaProduto,
  ProdutoListResponse,
  ProdutosFiltros,
} from './hooks/useProdutos';

// Hooks de Carrinho
export {
  useCarrinho,
  useCarrinhoTotal,
  adicionarAoCarrinho,
  atualizarItemCarrinho,
  removerDoCarrinho,
  limparCarrinho,
  revalidarCarrinho,
} from './hooks/useCarrinho';
export type {
  CarrinhoItem,
  CarrinhoTotal,
  CarrinhoResponse,
  AdicionarItemData,
} from './hooks/useCarrinho';

// Hooks de Cupons
export {
  useCuponsDisponiveis,
  useCupom,
  validarCupom,
  aplicarCupom,
  removerCupom,
} from './hooks/useCupons';
export type {
  Cupom,
  ValidarCupomRequest,
  ValidarCupomResponse,
  ListarCuponsRequest,
} from './hooks/useCupons';

// Hooks de Pedidos
export {
  usePedidos,
  usePedido,
  useRastreio,
  criarPedido,
  atualizarStatusPedido,
  revalidarPedidos,
  revalidarPedido,
} from './hooks/usePedidos';
export type {
  Pedido,
  PedidoListItem,
  PedidoListResponse,
  PedidosFiltros,
  CriarPedidoData,
  EnderecoEntrega,
  ItemPedido,
  RastreioResponse,
  RastreioEvento,
} from './hooks/usePedidos';

// Hooks de Procedimentos
export {
  useProcedimentos,
  useProcedimento,
  useCategorias,
  useProcedimentosComparacao,
} from './hooks/useProcedimentos';
export type {
  Procedimento,
  ProcedimentoDetalhado,
  Categoria,
  ProcedimentosFilters,
} from './hooks/useProcedimentos';

// Hooks de Agendamentos
export {
  useAgendamentos,
  useAgendamento,
  useHorariosDisponiveis,
  useProfissionaisDisponiveis,
  criarAgendamento,
  confirmarAgendamento,
  cancelarAgendamento,
  atualizarAgendamento,
  revalidarAgendamentos,
  revalidarAgendamento,
} from './hooks/useAgendamentos';
export type {
  Agendamento,
  AgendamentoListItem,
  AgendamentoListResponse,
  AgendamentosFiltros,
  CriarAgendamentoData,
  HorarioDisponivel,
  ProfissionalDisponivel,
  ProfissionaisDisponiveisParams,
} from './hooks/useAgendamentos';

// Hooks de Anamnese
export {
  useAnamnese,
  useHistoricoAnamnese,
  salvarAnamnese,
} from './hooks/useAnamnese';
export type {
  AnamneseFicha,
  AnamneseHistoricoItem,
  AnamneseHabitos,
  AnamneseMedicamento,
  AnamneseSinaisVitais,
} from './hooks/useAnamnese';

// Hooks de User/Profile
export {
  useCurrentUser,
  useUser,
  atualizarUsuario,
  atualizarPreferencias,
  atualizarNotificacoes,
  atualizarPrivacidade,
  alterarSenha,
  uploadFotoPerfil,
  revalidarUsuarioAtual,
  revalidarUsuario,
} from './hooks/useUser';
export type {
  User,
  UserPreferences,
  UserUpdateData,
  PasswordChangeData,
} from './hooks/useUser';

// Hooks de Favoritos
export {
  useFavoritos,
  useFavoritosStats,
  adicionarFavorito,
  removerFavorito,
  verificarFavorito,
  toggleFavorito,
  revalidarFavoritos,
  isProdutoFavorito,
  getFavoritoByProdutoId,
  getTipoFavorito,
  getNomeFavorito,
  getImagemFavorito,
} from './hooks/useFavoritos';
export type {
  Favorito,
  FavoritosResponse,
  FavoritosFiltros,
  AdicionarFavoritoData,
  VerificarFavoritoResponse,
  FavoritosStats,
  TipoFavorito,
  FavoritoProduto, // Legacy
} from './hooks/useFavoritos';

// Hooks de Avaliações
export {
  useAvaliacoes,
  useAvaliacao,
  criarAvaliacao,
  darLikeAvaliacao,
  revalidarAvaliacoes,
  revalidarAvaliacao,
} from './hooks/useAvaliacoes';
export type {
  Avaliacao,
  AvaliacaoListResponse,
  AvaliacoesFiltros,
  CriarAvaliacaoData,
} from './hooks/useAvaliacoes';

// Hooks de Notificações
export {
  useNotificacoes,
  useNotificacoesNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  deletarNotificacao,
  revalidarNotificacoes,
} from './hooks/useNotificacoes';
export type {
  Notificacao,
  NotificacaoListResponse,
  NotificacoesFiltros,
} from './hooks/useNotificacoes';

// Hooks de Pacientes (Profissional)
export {
  usePacientesProfissional,
  usePaciente,
  revalidarPacientes,
} from './hooks/usePacientesProfissional';
export type {
  PacienteProfissional,
  PacientesProfissionalFiltros,
  PacientesProfissionalResponse,
} from './hooks/usePacientesProfissional';

// Hooks de Mensagens
export {
  useMensagens,
  enviarMensagem,
  marcarMensagemLida,
  deletarMensagem,
  revalidarMensagens,
} from './hooks/useMensagens';
export type {
  Mensagem,
  MensagensResponse,
  EnviarMensagemData,
} from './hooks/useMensagens';

// Hooks de Fotos
export {
  useFotos,
  useFoto,
  uploadFoto,
  deletarFoto,
  atualizarFoto,
  revalidarFotos,
  revalidarFoto,
} from './hooks/useFotos';
export type {
  Foto,
  FotosResponse,
  FotosFiltros,
  UploadFotoData,
} from './hooks/useFotos';

// Hooks de Transações
export {
  useTransacoes,
  useEstatisticasFinanceiras,
  criarTransacao,
  atualizarStatusTransacao,
  revalidarTransacoes,
  revalidarEstatisticas,
} from './hooks/useTransacoes';
export type {
  Transacao,
  TransacoesResponse,
  TransacoesFiltros,
  CriarTransacaoData,
  EstatisticasFinanceiras,
  EstatisticasFiltros,
} from './hooks/useTransacoes';

// Hooks de Conversas
export {
  useConversas,
  useConversa,
  useConversasStats,
  criarConversa,
  arquivarConversa,
  deletarConversa,
  revalidarConversas,
  revalidarConversa,
  getOutroParticipante,
  temMensagensNaoLidas,
} from './hooks/useConversas';
export type {
  Conversa,
  ConversasResponse,
  ConversasFiltros,
  CriarConversaData,
  ConversasStats,
} from './hooks/useConversas';

// Hooks de Profissionais
export {
  useProfissionais,
  useProfissional,
  useEstatisticasProfissional,
  criarProfissional,
  atualizarProfissional,
  deletarProfissional,
  revalidarProfissionais,
  revalidarProfissional,
  formatarEspecialidades,
  getAvaliacaoColor,
  isProfissionalDisponivel,
  getExperienciaLabel,
} from './hooks/useProfissionais';
export type {
  Profissional,
  ProfissionaisResponse,
  ProfissionaisFiltros,
  CriarProfissionalData,
  AtualizarProfissionalData,
  EstatisticasProfissional,
  StatsFiltros,
} from './hooks/useProfissionais';

// Hooks de Clínicas
export {
  useClinicas,
  useClinica,
  useProfissionaisClinica,
  criarClinica,
  atualizarClinica,
  deletarClinica,
  revalidarClinicas,
  revalidarClinica,
  revalidarProfissionaisClinica,
  formatarHorario,
  isClinicaAberta,
  getDistancia,
  formatarDistancia,
  hasConvenio,
} from './hooks/useClinicas';
export type {
  Clinica,
  ClinicasResponse,
  ClinicasFiltros,
  CriarClinicaData,
  AtualizarClinicaData,
  ProfissionalClinica,
  ProfissionaisClinicaResponse,
} from './hooks/useClinicas';

// Hooks de Álbuns
export {
  useAlbums,
  useAlbum,
  useFotosAlbum,
  criarAlbum,
  atualizarAlbum,
  deletarAlbum,
  adicionarFotoAlbum,
  removerFotoAlbum,
  revalidarAlbums,
  revalidarAlbum,
  revalidarFotosAlbum,
  getTipoAlbumLabel,
  getTipoAlbumColor,
  isAlbumVazio,
  canAddFoto,
  getCapaUrl,
  formatarDataAlbum,
  ordenarFotosPorOrdem,
  getFotoCapa,
  countFotosPorTipo,
  filterFotosPorTipo,
  getAlbumIcon,
  TIPOS_ALBUM,
} from './hooks/useAlbums';
export type {
  Album,
  AlbunsResponse,
  AlbunsFiltros,
  CriarAlbumData,
  AtualizarAlbumData,
  AlbumFoto,
  AlbumFotosResponse,
  AdicionarFotoAlbumData,
  TipoAlbum,
} from './hooks/useAlbums';

// Helpers de erro
export {
  isAuthError,
  isPermissionError,
  isValidationError,
  getErrorMessage,
} from './client';


// Hooks de Empresas
export {
  useEmpresas,
  useEmpresa,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  toggleEmpresaStatus,
  revalidarEmpresas,
  revalidarEmpresa,
  validarCNPJ,
  formatarCNPJ,
  getBadgePlano,
} from './hooks/useEmpresas';
export type {
  Empresa,
  EmpresasResponse,
  EmpresasFiltros,
  CriarEmpresaData,
  AtualizarEmpresaData,
} from './hooks/useEmpresas';

// Hooks de Perfis (Roles/Permissions)
export {
  usePerfis,
  usePerfisDisponiveis,
  usePerfil,
  criarPerfil,
  atualizarPerfil,
  deletarPerfil,
  togglePerfilStatus,
  revalidarPerfis,
  revalidarPerfil,
  revalidarPerfisDisponiveis,
  isPerfilSystem,
  isPerfilAtivo,
  getBadgeTipo,
  formatarPermissoes,
  temPermissao,
  criarPermissoesVazias,
  criarPermissoesAdmin,
} from './hooks/usePerfis';
export type {
  Perfil,
  PerfisResponse,
  PerfisFiltros,
  CriarPerfilData,
  AtualizarPerfilData,
  PermissoesRecurso,
  PermissoesCompletas,
} from './hooks/usePerfis';

// Hooks de Agentes (IA)
export {
  useAgentes,
  useAgente,
  criarAgente,
  atualizarAgente,
  deletarAgente,
  adicionarToolAgente,
  removerToolAgente,
  adicionarDocumentStoreAgente,
  removerDocumentStoreAgente,
  revalidarAgentes,
  revalidarAgente,
  isAgentePrincipal,
  hasTools,
  isStreamingEnabled,
  isMemoryEnabled,
  isObservabilityEnabled,
  isKnowledgeEnabled,
  getModelCredentialId,
  criarConfigPadrao,
  formatarTemperatura,
  getBadgeStatus,
} from './hooks/useAgentes';
export type {
  Agente,
  AgentesResponse,
  AgentesFiltros,
  CriarAgenteData,
  AtualizarAgenteData,
  AgenteConfig,
  ModelConfig,
  ToolConfig,
  MemoryConfig,
  ObservabilityConfig,
  KnowledgeConfig,
  Knowledge,
  DocumentStore,
} from './hooks/useAgentes';

// Hooks de Tools (Ferramentas)
export {
  useTools,
  useTool,
  criarTool,
  atualizarTool,
  deletarTool,
  executarTool,
  toggleToolStatus,
  revalidarTools,
  revalidarTool,
  isToolAtivo,
  getBadgeTipo as getBadgeTipoTool,
} from './hooks/useTools';
export type {
  Tool,
  ToolsResponse,
  ToolsFiltros,
  CriarToolData,
  AtualizarToolData,
  ExecutarToolData,
  ExecutarToolResponse,
} from './hooks/useTools';

// Hooks de API Keys
export {
  useApiKeys,
  useApiKey,
  criarApiKey,
  atualizarApiKey,
  deletarApiKey,
  toggleApiKeyStatus,
  revalidarApiKeys,
  revalidarApiKey,
  isApiKeyAtiva,
  isApiKeyExpirada,
  isApiKeyValida,
  formatarDataExpiracao,
  getBadgeStatus as getBadgeStatusApiKey,
  mascararKey,
} from './hooks/useApiKeys';
export type {
  ApiKey,
  ApiKeysResponse,
  ApiKeysFiltros,
  CriarApiKeyData,
  AtualizarApiKeyData,
  CriarApiKeyResponse,
} from './hooks/useApiKeys';

// Hooks de Credenciais
export {
  useCredenciais,
  useCredencial,
  useTiposCredenciais,
  criarCredencial,
  atualizarCredencial,
  deletarCredencial,
  toggleCredencialStatus,
  revalidarCredenciais,
  revalidarCredencial,
  isCredencialAtiva,
  getBadgeTipo as getBadgeTipoCredencial,
  getBadgeProvedor,
  mascarValue,
  hasField,
  formatarUltimoUso,
} from './hooks/useCredenciais';
export type {
  Credencial,
  CredenciaisResponse,
  CredenciaisFiltros,
  CriarCredencialData,
  AtualizarCredencialData,
  TipoCredencial,
} from './hooks/useCredenciais';

// Hooks de Document Stores (Knowledge Base)
export {
  useDocumentStores,
  useDocumentStore,
  useDocumentosStore,
  useDocumentStoreStats,
  criarDocumentStore,
  atualizarDocumentStore,
  deletarDocumentStore,
  uploadDocumento,
  uploadDocumentosBulk,
  deletarDocumento,
  queryDocumentStore,
  toggleDocumentStoreStatus,
  revalidarDocumentStores,
  revalidarDocumentStore,
  revalidarDocumentosStore,
  isDocumentStoreAtivo,
  getBadgeTipo as getBadgeTipoDocumentStore,
  formatarTamanho,
  isDocumentoProcessado,
  getBadgeProcessamento,
} from './hooks/useDocumentStores';
export type {
  DocumentStore as DocumentStoreType,
  DocumentStoresResponse,
  DocumentStoresFiltros,
  CriarDocumentStoreData,
  AtualizarDocumentStoreData,
  Documento,
  DocumentosResponse,
  DocumentStoreStats,
  QueryRequest,
  QueryResult,
  QueryResponse,
} from './hooks/useDocumentStores';

// Hooks de Configurações
export {
  useConfiguracoes,
  useConfiguracoesMap,
  atualizarConfiguracao,
  atualizarConfiguracoesLote,
  revalidarConfiguracoes,
  getConfigValue,
  hasConfig,
} from './hooks/useConfiguracoes';
export type {
  Configuracao,
  ConfiguracoesResponse,
  ConfiguracoesMap,
  AtualizarConfiguracaoData,
} from './hooks/useConfiguracoes';

// Hooks de Onboarding
export {
  useOnboardingStatus,
  salvarOnboarding,
  atualizarStepOnboarding,
  completarOnboarding,
  resetarOnboarding,
  revalidarOnboarding,
  needsOnboarding,
  getOnboardingProgress,
} from './hooks/useOnboarding';
export type {
  OnboardingPreferences,
  OnboardingStatus,
  SalvarOnboardingData,
} from './hooks/useOnboarding';

// Hooks de Comparação de Produtos
export {
  useComparacao,
  compararAtributos,
  getMelhorValor,
} from './hooks/useComparacao';
export type {
  ItemComparacao,
} from './hooks/useComparacao';
