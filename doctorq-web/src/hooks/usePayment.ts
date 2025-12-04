import { useState, useCallback } from "react";
import { toast } from "sonner";

// ========== Types ==========

interface StripeCheckoutRequest {
  id_empresa: string;
  id_user?: string;
  amount: number; // Valor em centavos
  currency?: string;
  success_url: string;
  cancel_url: string;
  description?: string;
  payer_email?: string;
  metadata?: Record<string, any>;
}

interface StripeCheckoutResponse {
  success: boolean;
  data: {
    id: string;
    url: string;
    id_pagamento: string;
    status: string;
    amount_total: number;
    currency: string;
  };
}

interface MercadoPagoPixRequest {
  amount: number; // Valor em reais
  description: string;
  payer_email: string;
  payer_cpf?: string;
  payer_name?: string;
  metadata?: Record<string, any>;
}

interface MercadoPagoPixResponse {
  success: boolean;
  data: {
    id: string;
    status: string;
    qr_code: string;
    qr_code_base64: string;
    ticket_url?: string;
    amount: number;
    currency: string;
  };
}

interface PaymentStatus {
  id_pagamento: string;
  id_empresa: string;
  ds_gateway: string;
  ds_tipo_pagamento: string;
  ds_external_id: string;
  vl_amount: number;
  ds_currency: string;
  ds_status: string;
  ds_status_detail?: string;
  ds_payer_email?: string;
  ds_payer_name?: string;
  dt_criacao: string;
  dt_atualizacao?: string;
}

// ========== Hook ==========

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API base URL (pode vir de variável de ambiente)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  /**
   * Criar sessão de checkout Stripe
   */
  const createStripeCheckout = useCallback(
    async (data: StripeCheckoutRequest): Promise<StripeCheckoutResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/pagamentos/stripe/checkout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erro ao criar checkout Stripe");
        }

        const result: StripeCheckoutResponse = await response.json();
        toast.success("Checkout criado com sucesso!");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        toast.error(`Erro ao criar checkout: ${message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  /**
   * Criar pagamento PIX via MercadoPago
   */
  const createMercadoPagoPix = useCallback(
    async (data: MercadoPagoPixRequest): Promise<MercadoPagoPixResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/pagamentos/mercadopago/pix/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erro ao criar pagamento PIX");
        }

        const result: MercadoPagoPixResponse = await response.json();
        toast.success("Pagamento PIX criado com sucesso!");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        toast.error(`Erro ao criar PIX: ${message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  /**
   * Buscar status de pagamento pelo ID
   */
  const getPaymentStatus = useCallback(
    async (paymentId: string): Promise<PaymentStatus | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/pagamentos/${paymentId}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erro ao buscar status do pagamento");
        }

        const result = await response.json();
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        toast.error(`Erro ao buscar pagamento: ${message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  /**
   * Listar pagamentos com filtros
   */
  const listPayments = useCallback(
    async (filters?: {
      id_empresa?: string;
      id_user?: string;
      gateway?: string;
      status?: string;
      page?: number;
      size?: number;
    }): Promise<PaymentStatus[] | null> => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters?.id_empresa) params.append("id_empresa", filters.id_empresa);
        if (filters?.id_user) params.append("id_user", filters.id_user);
        if (filters?.gateway) params.append("gateway", filters.gateway);
        if (filters?.status) params.append("status", filters.status);
        if (filters?.page) params.append("page", filters.page.toString());
        if (filters?.size) params.append("size", filters.size.toString());

        const response = await fetch(`${API_URL}/pagamentos/?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erro ao listar pagamentos");
        }

        const result = await response.json();
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        toast.error(`Erro ao listar pagamentos: ${message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  /**
   * Redirecionar para URL de checkout
   */
  const redirectToCheckout = useCallback((url: string) => {
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }, []);

  return {
    // Estado
    loading,
    error,

    // Métodos
    createStripeCheckout,
    createMercadoPagoPix,
    getPaymentStatus,
    listPayments,
    redirectToCheckout,
  };
}
