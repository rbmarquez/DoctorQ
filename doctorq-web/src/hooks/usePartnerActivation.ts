/**
 * Hook para ativação automática de parceiros
 * Fluxo estilo iFood: cadastro → ativação imediata → acesso liberado
 */
import { useState } from "react";
import { toast } from "sonner";

export interface PartnerActivationData {
  // Tipo de parceiro
  partner_type: string; // 'clinic', 'supplier', 'professional', 'network'

  // Informações de contato
  contact_name: string;
  contact_email: string;
  contact_phone: string;

  // Informações da empresa
  business_name: string;
  cnpj?: string;
  city?: string;
  state?: string;

  // Serviços e plano
  selected_services: string[]; // ['core_platform', 'marketplace', 'ai_assistant']
  plan_type?: string; // 'starter', 'professional', 'enterprise'
  billing_cycle: string; // 'monthly', 'yearly'

  // Opcionais
  needs?: string;
  accept_terms: boolean;
}

export interface PartnerActivationResult {
  success: boolean;
  message: string;
  partner: {
    id_lead: string;
    id_empresa: string;
    id_user: string;
    business_name: string;
    contact_name: string;
    contact_email: string;
    status: string;
  };
  credentials: {
    email: string;
    temporary_password: string;
    must_change_password: boolean;
  };
  package: {
    id_package: string;
    package_code: string;
    package_name: string;
    status: string;
    billing_cycle: string;
  };
  licenses: Array<{
    license_key: string;
    status: string;
    service: string;
  }>;
  access_info: {
    dashboard_url: string;
    login_url: string;
    onboarding_url: string;
  };
}

export function usePartnerActivation() {
  const [isActivating, setIsActivating] = useState(false);
  const [result, setResult] = useState<PartnerActivationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activatePartner = async (
    data: PartnerActivationData
  ): Promise<PartnerActivationResult | null> => {
    setIsActivating(true);
    setError(null);
    setResult(null);

    try {
      // Chamar endpoint de ativação no backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || "vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX";

      console.log("[usePartnerActivation] Enviando requisição:", {
        url: `${apiUrl}/partner-activation/`,
        payload: data,
      });

      const response = await fetch(`${apiUrl}/partner-activation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      });

      console.log("[usePartnerActivation] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[usePartnerActivation] Error response:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }

        throw new Error(
          errorData.detail ||
          errorData.message ||
          `Erro ao ativar parceiro: ${response.status}`
        );
      }

      const result: PartnerActivationResult = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Erro ao ativar parceiro");
      }

      setResult(result);

      // Mostrar notificação de sucesso
      toast.success("Parceiro ativado com sucesso!", {
        description: `Bem-vindo, ${data.contact_name}! Acesso liberado imediatamente.`,
        duration: 5000,
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao ativar parceiro. Tente novamente.";

      setError(errorMessage);

      toast.error("Erro na ativação", {
        description: errorMessage,
        duration: 6000,
      });

      console.error("Erro ao ativar parceiro:", err);
      return null;
    } finally {
      setIsActivating(false);
    }
  };

  const reset = () => {
    setIsActivating(false);
    setResult(null);
    setError(null);
  };

  return {
    activatePartner,
    isActivating,
    result,
    error,
    reset,
  };
}
