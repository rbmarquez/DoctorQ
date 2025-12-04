/**
 * Hook para Central de Atendimento Omnichannel
 * Gerencia conversas, mensagens e contatos via WhatsApp
 */

import useSWR from 'swr';
import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

// Types
export interface ContatoOmni {
  id_contato: string;
  id_empresa: string;
  nm_contato: string;
  nm_apelido?: string;
  nm_email?: string;
  nr_telefone?: string;
  id_whatsapp?: string;
  st_contato: 'lead' | 'prospect' | 'cliente' | 'inativo';
  st_ativo: boolean;
  dt_ultimo_contato?: string;
  dt_criacao: string;
}

export interface ConversaOmni {
  id_conversa: string;
  id_empresa: string;
  id_contato: string;
  tp_canal: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'email' | 'chat_web' | 'sms';
  nm_titulo?: string;
  st_aberta: boolean;
  st_aguardando_humano: boolean;
  st_bot_ativo: boolean;
  st_favorito?: boolean;  // Adicionado em migration_024
  id_atendente?: string;
  nr_mensagens_total: number;
  nr_mensagens_entrada: number;
  nr_mensagens_saida: number;
  dt_ultima_mensagem?: string;
  dt_criacao: string;
  contato?: ContatoOmni;
  ds_metadata?: Record<string, any>;  // Adicionado em migration_024
}

export interface MensagemOmni {
  id_mensagem: string;
  id_conversa: string;
  st_entrada: boolean;
  nm_remetente?: string;
  tp_mensagem: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'sticker' | 'template' | 'interativo';
  ds_conteudo: string;
  ds_url_midia?: string;
  nm_tipo_midia?: string;
  st_mensagem: 'pendente' | 'enviada' | 'entregue' | 'lida' | 'falha';
  st_lida: boolean;
  dt_criacao: string;
  dt_envio?: string;
  dt_entrega?: string;
  dt_leitura?: string;
}

export interface EnviarMensagemDTO {
  tp_mensagem: string;
  ds_conteudo: string;
  ds_url_midia?: string;
}

export interface CriarConversaDTO {
  id_contato: string;
  tp_canal: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'email' | 'chat_web' | 'sms';
  nm_titulo?: string;
}

export interface CriarContatoDTO {
  nm_contato: string;
  nr_telefone?: string;
  nm_email?: string;
  id_whatsapp?: string;
  st_contato?: 'lead' | 'prospect' | 'cliente' | 'inativo';
}

// API Fetcher tipado
const fetcher = async <T>(url: string): Promise<T> => {
  return await apiClient.get<T>(url);
};

// Hook principal
export function useCentralAtendimento() {
  // Listar conversas abertas
  const {
    data: conversasData,
    error: conversasError,
    mutate: mutateConversas,
    isLoading: conversasLoading
  } = useSWR<{ items: ConversaOmni[]; total: number }>(
    '/central-atendimento/conversas/?st_aberta=true&page_size=50',
    fetcher,
    { refreshInterval: 5000 }
  );

  // Listar contatos
  const {
    data: contatosData,
    error: contatosError,
    isLoading: contatosLoading
  } = useSWR<{ items: ContatoOmni[]; total: number }>(
    '/central-atendimento/contatos/?page_size=100',
    fetcher
  );

  // Buscar mensagens de uma conversa
  const useMensagens = (idConversa: string | null) => {
    const { data, error, mutate, isLoading } = useSWR<{ items: MensagemOmni[]; total: number }>(
      idConversa ? `/central-atendimento/conversas/${idConversa}/mensagens/?page_size=100` : null,
      fetcher,
      {
        refreshInterval: 5000,  // Aumentado de 3s para 5s para evitar timeout
        dedupingInterval: 2000,  // Evitar chamadas duplicadas em 2s
        revalidateOnFocus: false,  // Não revalidar ao focar janela (reduz carga)
        errorRetryInterval: 5000,  // Intervalo entre tentativas em caso de erro
        errorRetryCount: 3,  // Máximo de 3 tentativas
      }
    );
    return { mensagens: data?.items || [], total: data?.total || 0, error, mutate, isLoading };
  };

  // Enviar mensagem
  const enviarMensagem = useCallback(async (idConversa: string, dados: EnviarMensagemDTO) => {
    try {
      const response = await apiClient.post(
        `/central-atendimento/conversas/${idConversa}/enviar/`,
        dados
      ) as { data: MensagemOmni };
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }, []);

  // Fechar conversa
  const fecharConversa = useCallback(async (idConversa: string, avaliacao?: number, feedback?: string) => {
    try {
      const response = await apiClient.post(
        `/central-atendimento/conversas/${idConversa}/fechar/`,
        { avaliacao, feedback }
      ) as { data: ConversaOmni };
      await mutateConversas();
      return response.data;
    } catch (error) {
      console.error('Erro ao fechar conversa:', error);
      throw error;
    }
  }, [mutateConversas]);

  // Transferir para humano
  const transferirParaHumano = useCallback(async (idConversa: string, motivo?: string) => {
    try {
      const response = await apiClient.post(
        `/central-atendimento/conversas/${idConversa}/transferir-humano/`,
        { motivo }
      ) as { data: ConversaOmni };
      await mutateConversas();
      return response.data;
    } catch (error) {
      console.error('Erro ao transferir:', error);
      throw error;
    }
  }, [mutateConversas]);

  // Buscar contato
  const buscarContato = useCallback(async (idContato: string) => {
    try {
      const response = await apiClient.get(`/central-atendimento/contatos/${idContato}/`) as { data: ContatoOmni };
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      throw error;
    }
  }, []);

  // Criar nova conversa
  const criarConversa = useCallback(async (dados: CriarConversaDTO) => {
    try {
      const response = await apiClient.post('/central-atendimento/conversas/', dados) as { data: ConversaOmni };
      await mutateConversas();
      return response.data;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      throw error;
    }
  }, [mutateConversas]);

  // Criar novo contato
  const criarContato = useCallback(async (dados: CriarContatoDTO) => {
    try {
      const response = await apiClient.post('/central-atendimento/contatos/', dados) as { data: ContatoOmni };
      return response.data;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      throw error;
    }
  }, []);

  // Buscar contatos com filtro
  const buscarContatos = useCallback(async (termo: string) => {
    try {
      const response = await apiClient.get(`/central-atendimento/contatos/?search=${encodeURIComponent(termo)}&page_size=20`) as { data: { items: ContatoOmni[]; total: number } };
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      throw error;
    }
  }, []);

  // Favoritar conversa
  const favoritarConversa = useCallback(async (idConversa: string, favorito: boolean = true) => {
    try {
      const response = await apiClient.post(
        `/central-atendimento/conversas/${idConversa}/favoritar/?favorito=${favorito}`
      ) as { data: { message: string; st_favorito: boolean } };
      await mutateConversas();
      return response.data;
    } catch (error) {
      console.error('Erro ao favoritar conversa:', error);
      throw error;
    }
  }, [mutateConversas]);

  // Iniciar chamada de vídeo (Jitsi)
  const iniciarVideo = useCallback(async (idConversa: string) => {
    try {
      const response = await apiClient.post(
        `/central-atendimento/conversas/${idConversa}/iniciar-video/`
      ) as { video_url: string; room_name: string; expires_at: string; message: string };

      console.log('[iniciarVideo] Resposta recebida:', response);

      if (!response || !response.video_url) {
        console.error('[iniciarVideo] Resposta inválida:', response);
        throw new Error('Resposta inválida do servidor');
      }

      return response;
    } catch (error: any) {
      console.error('[iniciarVideo] Erro completo:', error);
      console.error('[iniciarVideo] Erro message:', error?.message);
      console.error('[iniciarVideo] Erro response:', error?.response);
      throw error;
    }
  }, []);

  return {
    // Dados
    conversas: conversasData?.items || [],
    totalConversas: conversasData?.total || 0,
    contatos: contatosData?.items || [],
    totalContatos: contatosData?.total || 0,

    // Estados
    isLoading: conversasLoading || contatosLoading,
    error: conversasError || contatosError,

    // Hooks
    useMensagens,

    // Ações
    enviarMensagem,
    fecharConversa,
    transferirParaHumano,
    buscarContato,
    criarConversa,
    criarContato,
    buscarContatos,
    favoritarConversa,
    iniciarVideo,

    // Mutate
    mutateConversas,
  };
}

export default useCentralAtendimento;
