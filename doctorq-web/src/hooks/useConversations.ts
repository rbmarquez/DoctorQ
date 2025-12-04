import {
  Conversation,
  ConversationFilters,
  ConversationListResponse,
} from "@/types/chat";
import { useCallback, useEffect, useState } from "react";

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  } | null;
  fetchConversations: (filters?: ConversationFilters) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  updateConversationTitle: (
    conversationId: string,
    title: string
  ) => Promise<boolean>;
  generateAutoTitle: (conversationId: string) => Promise<boolean>;
  refreshConversations: () => Promise<void>;
}

interface UseConversationsOptions {
  initialFilters?: ConversationFilters;
  autoLoad?: boolean; // Controla se deve carregar automaticamente
}

export const useConversations = (
  optionsOrFilters?: ConversationFilters | UseConversationsOptions,
  legacyAutoLoad?: boolean
): UseConversationsReturn => {
  // Suporte para ambas as assinaturas (backward compatibility)
  let initialFilters: ConversationFilters = {};
  let autoLoad = true;

  if (optionsOrFilters) {
    // Se tem propriedades de UseConversationsOptions
    if (
      "autoLoad" in optionsOrFilters ||
      "initialFilters" in optionsOrFilters
    ) {
      const options = optionsOrFilters as UseConversationsOptions;
      initialFilters = options.initialFilters || {};
      autoLoad = options.autoLoad !== undefined ? options.autoLoad : true;
    } else {
      // Backward compatibility: primeiro parâmetro é ConversationFilters
      initialFilters = optionsOrFilters as ConversationFilters;
      autoLoad = legacyAutoLoad !== undefined ? legacyAutoLoad : true;
    }
  }

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<UseConversationsReturn["meta"]>(null);
  const [currentFilters, setCurrentFilters] =
    useState<ConversationFilters>(initialFilters);

  const fetchConversations = useCallback(
    async (filters?: ConversationFilters) => {
      setLoading(true);
      setError(null);

      try {
        const filtersToUse = filters || currentFilters;
        if (filters) {
          setCurrentFilters(filtersToUse);
        }

        // Construir parâmetros da query
        const params = new URLSearchParams();

        if (filtersToUse.page)
          params.append("page", filtersToUse.page.toString());
        if (filtersToUse.size)
          params.append("size", filtersToUse.size.toString());
        if (filtersToUse.search) params.append("search", filtersToUse.search);
        if (filtersToUse.user_id)
          params.append("user_id", filtersToUse.user_id);
        if (filtersToUse.status) params.append("status", filtersToUse.status);
        if (filtersToUse.order_by)
          params.append("order_by", filtersToUse.order_by);
        if (filtersToUse.order_desc !== undefined)
          params.append("order_desc", filtersToUse.order_desc.toString());

        // Usar API route interna do Next.js
        const url = `/api/conversas?${params.toString()}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Erro ao buscar conversas: ${response.status} - ${response.statusText}`
          );
        }
        const data: ConversationListResponse = await response.json();
        setConversations(data.items);
        setMeta(data.meta);
      } catch (err) {
        console.error("❌ Erro ao buscar conversas:", {
          error: err,
          message: err instanceof Error ? err.message : "Erro desconhecido",
          timestamp: new Date().toISOString(),
        });

        let errorMessage = "Erro ao carregar conversas";

        if (err instanceof TypeError && err.message === "Failed to fetch") {
          errorMessage = "Erro de conexão com o servidor.";
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentFilters]
  );

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/conversas/${conversationId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Erro ao deletar conversa: ${response.status}`
          );
        }

        // Remover a conversa da lista local
        setConversations((prev) =>
          prev.filter((conv) => conv.id_conversation !== conversationId)
        );

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao deletar conversa";
        setError(errorMessage);
        console.error("Erro ao deletar conversa:", err);
        return false;
      }
    },
    []
  );

  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/conversas/${conversationId}/titulo`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ nm_titulo: title }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Erro ao atualizar título: ${response.status}`
          );
        }

        const updatedConversation: Conversation = await response.json();

        // Atualizar a conversa na lista local
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id_conversation === conversationId
              ? { ...conv, nm_titulo: updatedConversation.nm_titulo }
              : conv
          )
        );

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao atualizar título";
        setError(errorMessage);
        console.error("Erro ao atualizar título:", err);
        return false;
      }
    },
    []
  );

  const generateAutoTitle = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/conversas/${conversationId}/gerar-titulo`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Erro ao gerar título automático: ${response.status}`
          );
        }

        const updatedConversation: Conversation = await response.json();

        // Atualizar a conversa na lista local
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id_conversation === conversationId
              ? { ...conv, nm_titulo: updatedConversation.nm_titulo }
              : conv
          )
        );

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao gerar título automático";
        setError(errorMessage);
        console.error("Erro ao gerar título automático:", err);
        return false;
      }
    },
    []
  );

  const refreshConversations = useCallback(async () => {
    await fetchConversations(currentFilters);
  }, [fetchConversations, currentFilters]);

  // Buscar conversas na inicialização apenas se autoLoad for true
  useEffect(() => {
    if (autoLoad) {
      fetchConversations();
    }
  }, [autoLoad, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    meta,
    fetchConversations,
    deleteConversation,
    updateConversationTitle,
    generateAutoTitle,
    refreshConversations,
  };
};
