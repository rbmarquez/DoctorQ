"use client";

import { useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface StripeCheckoutProps {
  idEmpresa: string;
  idUser?: string;
  amount: number; // Valor em centavos
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (checkoutUrl: string) => void;
  onError?: (error: string) => void;
}

export function StripeCheckout({
  idEmpresa,
  idUser,
  amount,
  currency = "brl",
  description = "Pagamento DoctorQ",
  metadata = {},
  onSuccess,
  onError,
}: StripeCheckoutProps) {
  const { createStripeCheckout, loading, redirectToCheckout } = usePayment();
  const [email, setEmail] = useState("");

  const handleCheckout = async () => {
    if (!email) {
      onError?.("Por favor, informe seu e-mail");
      return;
    }

    const successUrl = `${window.location.origin}/pagamento/sucesso`;
    const cancelUrl = `${window.location.origin}/pagamento/cancelado`;

    const result = await createStripeCheckout({
      id_empresa: idEmpresa,
      id_user: idUser,
      amount,
      currency,
      success_url: successUrl,
      cancel_url: cancelUrl,
      description,
      payer_email: email,
      metadata,
    });

    if (result && result.success) {
      onSuccess?.(result.data.url);
      // Redirecionar para página de checkout do Stripe
      redirectToCheckout(result.data.url);
    } else {
      onError?.("Erro ao criar checkout");
    }
  };

  const formatCurrency = (valueInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(valueInCents / 100);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-purple-100 bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Pagamento com Cartão</h3>
          <p className="text-sm text-gray-500">Processado via Stripe</p>
        </div>
      </div>

      {/* Resumo do valor */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Valor total</span>
          <span className="text-2xl font-bold text-purple-600">{formatCurrency(amount)}</span>
        </div>
        {description && (
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        )}
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            placeholder="seu@email.com"
            required
          />
        </div>

        {/* Botão de checkout */}
        <button
          onClick={handleCheckout}
          disabled={loading || !email}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processando...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              <span>Pagar {formatCurrency(amount)}</span>
            </>
          )}
        </button>

        {/* Informações de segurança */}
        <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3">
          <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-green-900">Pagamento 100% seguro</p>
            <p className="text-xs text-green-700">
              Seus dados são protegidos com criptografia de ponta a ponta
            </p>
          </div>
        </div>

        {/* Logos de bandeiras */}
        <div className="flex items-center justify-center gap-3 opacity-60 grayscale">
          <span className="text-xs font-medium text-gray-500">Aceitamos</span>
          <div className="flex gap-2">
            <span className="text-xs text-gray-400">Visa</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">Mastercard</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">Amex</span>
          </div>
        </div>
      </div>
    </div>
  );
}
