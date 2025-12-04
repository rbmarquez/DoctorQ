/**
 * Barrel export centralizado para todos os hooks de API
 *
 * @example
 * ```typescript
 * import { useEmpresas, useAgentes, useAgendamentos } from '@/lib/api/hooks';
 * ```
 */

// Factory e utilitários
export * from './factory';

// Hooks por domínio (principais)
export * from './gestao';
export * from './clinica';
export * from './financeiro';

// IA - Conversas de agentes IA
export {
  useConversas,
  useMensagens,
  useConversa,
  useCreateConversa,
  useDeleteConversa
} from './ia/useConversas';
export * from './ia/useAgentes';

// Comunicação - Mensagens entre usuários (renomeadas para evitar conflito)
export {
  useConversas as useConversasUsuarios,
  useMensagens as useMensagensUsuarios,
  useMensagem,
  useCreateMensagem,
  useUpdateMensagem,
  useDeleteMensagem,
  useMarcarComoLida,
  useArquivarMensagem
} from './comunicacao/useMensagens';

// Marketplace - Exportações com alias para evitar conflitos
export { useProdutos } from './marketplace/useProdutos';
export { useFavoritos as useFavoritosMarketplace } from './marketplace/useFavoritos';
export { useCarrinho as useCarrinhoMarketplace } from './marketplace/useCarrinho';

// Hooks individuais específicos (versões do paciente/usuário)
export * from './useFavoritos'; // Versão do paciente
export * from './useCarrinho'; // Versão do paciente
export * from './useComparacao';
export * from './useNotificacoes';

// NOTA: Os hooks abaixo JÁ SÃO exportados por './clinica', não duplicar:
// - useAlbums, useAnamneses, useAvaliacoes, useFotos, usePacientes (exportados por clinica)
// - useTransacoes (exportado por financeiro)
